// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import HTTP, { IncomingMessage, ServerResponse } from 'http';

import ProcessUtils from "../../hg/core/ProcessUtils";

// Must be first import to define environment variables before anything else
ProcessUtils.initEnvFromDefaultFiles();

import {
    BACKEND_API_PROXY_URL,
    BACKEND_API_URL,
    BACKEND_LOG_LEVEL,
    BACKEND_PORT,
    BACKEND_SCRIPT_NAME
} from "./constants/runtime";
import LogService from "../../hg/core/LogService";

LogService.setLogLevel(BACKEND_LOG_LEVEL);

import ExitStatus from "./types/ExitStatus";
import LogLevel from "../../hg/core/types/LogLevel";
import RequestClient from "../../hg/core/RequestClient";
import RequestServer from "../../hg/core/RequestServer";
import RequestRouter from "../../hg/core/requestServer/RequestRouter";
import Headers from "../../hg/core/request/Headers";
import HttpServerController from "./controller/HttpServerController";
import { isString } from "../../hg/core/modules/lodash";
import { HttpService } from "../../palvelinkauppa/services/HttpService";

const LOG = LogService.createLogger('main');

export async function main (
    args: any[] = []
) : Promise<ExitStatus> {

    let server : HTTP.Server | undefined;

    try {

        args.shift();
        args.shift();

        const appDir       : string | undefined = args.shift();
        const appComponent : string | undefined = args.shift();
        const initFile     : string | undefined = args.shift();

        if ( !isString(appDir) || !appComponent ) {
            LOG.error(`USAGE: ${BACKEND_SCRIPT_NAME} APP_DIR APP_COMPONENT_FILE`);
            return;
        }

        Headers.setLogLevel(LogLevel.INFO);
        RequestRouter.setLogLevel(LogLevel.INFO);
        RequestClient.setLogLevel(LogLevel.INFO);
        RequestServer.setLogLevel(LogLevel.INFO);
        // SimpleMatrixClient.setLogLevel(LogLevel.INFO);
        // MatrixCrudRepository.setLogLevel(LogLevel.INFO);

        LOG.debug(`Loglevel as ${LogService.getLogLevelString()}`);

        // Hijack require for TypeScript ES2020 interop
        const ModuleM = require('module');
        const Module = (ModuleM as any)?.default ?? ModuleM;
        const {require: oldRequire} = Module.prototype;
        Module.prototype.require = function hijacked (file: string) {
            // LOG.debug(`Loading 1: "${file}"`);
            // noinspection JSVoidFunctionReturnValueUsed
            const result = oldRequire.apply(this, [file]);
            return result?.default ?? result;
        };

        if (BACKEND_API_URL) {
            HttpService.setBaseUrl(BACKEND_API_URL);
        }

        if (initFile) {
            require(initFile);
        }

        const App = isString(appComponent) ? require(appComponent) : appComponent;

        const httpController = new HttpServerController(
            appDir,
            App,
            BACKEND_API_PROXY_URL
        );

        server = HTTP.createServer(
            (
                req : IncomingMessage,
                res : ServerResponse
            ) => {
                try {
                    httpController.handleRequest(req, res).catch(err => {
                        LOG.error(`Unexpected exception from promise handler caught: `, err);
                    }).finally( () => {
                        if (!res.writableEnded) {
                            LOG.warn(`"${req.method} ${req.url}": Warning! Async request handler did not close the response.`);
                            res.end();
                        }
                    });
                } catch (err) {
                    LOG.error(`Exception caught: `, err);
                    if (!res.writableEnded) {
                        LOG.warn(`"${req.method} ${req.url}": Warning! Request handler did not close the response.`);
                        res.end();
                    }
                }
            }
        );

        server.listen(BACKEND_PORT);
        server.on('error', onError);
        server.on('listening', onListening);

        const stopPromise = new Promise<void>((resolve, reject) => {
            try {
                server.once('close', () => {
                    LOG.debug('Stopping server from RequestServer stop event');
                    resolve();
                });
            } catch(err) {
                reject(err);
            }
        });

        ProcessUtils.setupDestroyHandler( () => {

            server.removeListener('error', onError);
            server.removeListener('listening', onListening);

            LOG.debug('Stopping server from process utils event');

            if (server?.close) {
                server.close();
            }

        }, (err : any) => {
            LOG.error('Error while shutting down the service: ', err);
        });

        await stopPromise;

        return ExitStatus.OK;

    } catch (err) {
        LOG.error(`Fatal error: `, err);
        return ExitStatus.FATAL_ERROR;
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    function onError (error : any) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof BACKEND_PORT === 'string'
            ? 'Pipe ' + BACKEND_PORT
            : 'Port ' + BACKEND_PORT;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening () {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        LOG.info('Listening on ' + bind);
    }

}

export default main;
