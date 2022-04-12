// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { IncomingMessage, ServerResponse } from "http";
import { Server as StaticServer } from 'node-static';
import { ResponseEntity } from "../../core/request/ResponseEntity";
import { LogService } from "../../core/LogService";
import { ReactServerController } from "./ReactServerController";
import { WELL_KNOWN_HG_HEALTH_CHECK_END_POINT } from "../../core/constants/wellKnown";
import { startsWith } from "../../core/modules/lodash";
import { createHealthCheckDTO } from "../../core/types/HealthCheckDTO";

const LOG = LogService.createLogger('HttpServerController');

export class HttpServerController {

    private readonly _appDir      : string;
    private readonly _fileServer  : StaticServer;
    private readonly _App         : any;
    private readonly _apiBasePath : string | undefined;
    private readonly _apiUrl      : string | undefined;
    private readonly _proxy       : any    | undefined;

    public constructor (
        appDir  : string,
        App     : any,
        apiUrl ?: string
    ) {

        this._appDir     = appDir;
        this._App        = App;
        this._fileServer = new StaticServer(appDir);

        if (apiUrl !== undefined) {
            this._apiBasePath = '/api';
            this._apiUrl = apiUrl;
            const httpProxy = require('http-proxy');
            this._proxy = httpProxy.createProxyServer(
                {
                    autoRewrite: true,
                    proxyTimeout: 30*1000,
                    timeout: 30*1000
                }
            );
            LOG.info(`Enabled docroot "${this._appDir}" with "${this._apiBasePath}" passed to "${this._apiUrl}"`);
        } else {
            LOG.info(`Enabled docroot "${this._appDir}"`);
        }

    }

    public async handleRequest (
        req    : IncomingMessage,
        res    : ServerResponse,
    ) {

        let url = undefined;

        try {

            url = req.url;

            if ( startsWith(url, WELL_KNOWN_HG_HEALTH_CHECK_END_POINT)) {

                await this._waitUntilRequestEnd(req);

                // FIXME: Call health check for proxy target
                HttpServerController._writeResponseEntity(res, url, ResponseEntity.ok<string>(JSON.stringify(createHealthCheckDTO(true))) );
                return;
            }

            if ( this._proxy && startsWith(url, this._apiBasePath) ) {

                LOG.debug(`Routing request "${url}" to "${this._apiUrl}"`)
                await this._proxyRequestToTarget(req, res, this._apiUrl, this._apiBasePath);

            } else {

                await this._waitUntilRequestEnd(req);

                await this._serveUsingStaticServer(req, res);

            }

        } catch (err) {

            const statusCode = (err as any)?.status ?? -1;

            if ( statusCode === 404 ) {
                try {
                    await this._serveUsingReactController(res, url);
                } catch (err2) {
                    HttpServerController._writeError(res, url, err2, 500, 'Internal Server Error');
                }
            } else {
                LOG.error(`Error ${statusCode}: `, err);
                HttpServerController._writeError(res, url, err, statusCode, `Error ${statusCode}`);
            }

        } finally {

            if (!res.writableEnded) {
                LOG.warn(`"${req.method} ${req.url}": Warning! Request handler did not close the response.`);
                res.end();
            }

        }

    }

    private async _waitUntilRequestEnd (
        req    : IncomingMessage
    ) : Promise<void> {
        await new Promise( (resolve, reject) => {
            try {
                req.addListener('end', () => {
                    resolve(undefined);
                }).resume();
            } catch (err) {
                reject(err);
            }
        });
    }

    private async _serveUsingStaticServer (
        req : IncomingMessage,
        res : ServerResponse
    ) : Promise<void> {
        await new Promise( (resolve, reject) => {
            try {
                this._fileServer.serve(req, res, (err : Error) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(undefined);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    private async _serveUsingReactController (
        res : ServerResponse,
        url : string
    ) : Promise<void> {

        const response : ResponseEntity<string> = await ReactServerController.handleReactRequest(
            url,
            this._appDir,
            this._App
        );

        HttpServerController._writeResponseEntity(res, url, response);

    }

    private static _writeResponseEntity (
        res      : ServerResponse,
        url      : string,
        response : ResponseEntity<any>
    ) {
        const statusCode = response.getStatusCode();
        LOG.info(`"${url}": ${statusCode}`);
        res.writeHead(statusCode);
        res.end(response.getBody());
    }

    private static _writeError (
        res        : ServerResponse,
        url        : string,
        err        : any,
        statusCode : number,
        body       : string
    ) {
        LOG.error(`ERROR: `, err);
        LOG.info(`"${url}": ${statusCode}`);
        res.writeHead(statusCode);
        res.end(body);
    }

    /**
     * Proxies the request to another address.
     *
     * Note! Call this method only from a code which tests that optional `this._proxy` exists.
     *
     * @param req
     * @param res
     * @param target Target to proxy the request
     * @param basePath Base path to strip from the request
     * @private
     */
    private async _proxyRequestToTarget (
        req      : IncomingMessage,
        res      : ServerResponse,
        target   : string,
        basePath : string
    ) : Promise<void> {

        return await new Promise( (resolve, reject) => {
            try {

                const url : string = `${req.url}`;
                req.url = url.startsWith(basePath) ? url.substring(basePath.length) : url;

                LOG.debug(`_proxyRequestToTarget: Routing "${req.url}" to "${target}"`)
                this._proxy.web(req, res, {target}, (err: Error) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            } catch (err) {
                reject(err);
            }
        });

    }

}
