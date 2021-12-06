// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import HTTP, { IncomingMessage, ServerResponse } from 'http';

import ProcessUtils from "../../nor/ts/ProcessUtils";

// Must be first import to define environment variables before anything else
ProcessUtils.initEnvFromDefaultFiles();

import {
    BACKEND_LOG_LEVEL,
    BACKEND_PORT,
    BACKEND_SCRIPT_NAME
} from "./constants/runtime";
import LogService from "../../nor/ts/LogService";

LogService.setLogLevel(BACKEND_LOG_LEVEL);

import ExitStatus from "./types/ExitStatus";
import LogLevel from "../../nor/ts/types/LogLevel";
import RequestClient from "../../nor/ts/RequestClient";
import RequestServer from "../../nor/ts/RequestServer";
import RequestRouter from "../../nor/ts/requestServer/RequestRouter";
import Headers from "../../nor/ts/request/Headers";
import HttpServerController from "./controller/HttpServerController";
import { isString } from "../../nor/ts/modules/lodash";

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
            LOG.debug(`Loading 1: "${file}"`);
            // noinspection JSVoidFunctionReturnValueUsed
            const result = oldRequire.apply(this, [file]);
            return result?.default ?? result;
        };


        if (initFile) {
            require(initFile);
        }

        const App = isString(appComponent) ? require(appComponent) : appComponent;

        const httpController = new HttpServerController(
            appDir,
            App
        );

        server = HTTP.createServer(
            (
                req : IncomingMessage,
                res : ServerResponse
            ) => {
                httpController.handleRequest(req, res);
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
