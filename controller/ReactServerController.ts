// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import ResponseEntity from "../../../nor/ts/request/ResponseEntity";
import PATH from "path";
import { FileSystemService } from "../services/FileSystemService";
import LogService from "../../../nor/ts/LogService";
import StaticReactAppService from "../services/StaticReactAppService";
import { Helmet, HelmetData } from "react-helmet";
import HtmlManager from "../services/HtmlManager";
import { VoidCallback } from "../../../nor/ts/interfaces/callbacks";
import FrontendCacheService from "../../../palvelinkauppa/services/FrontendCacheService";
// import { HttpService } from "../../../palvelinkauppa/services/HttpService";

const LOG = LogService.createLogger('ReactServerController');

export default class ReactServerController {

    public static async handleReactRequest (
        url           : string,
        appDir        : string,
        App           : any,
        indexFileName : string = './index.html'
    ) : Promise<ResponseEntity<string>> {

        const indexFile = PATH.resolve(appDir, indexFileName);

        LOG.debug(`Reading static HTML file for "${url}"`);
        let htmlString : string = '';
        try {
            htmlString = await FileSystemService.readTextFile(indexFile);
        } catch (err) {
            LOG.error(`Could not read "${indexFile}" for "${url}":`, err);
            return ResponseEntity.internalServerError<string>().body('Internal Server Error');
        }

        await FrontendCacheService.initialize();

        LOG.debug(`Rendering ReactJS app for "${url}"`);
        let bodyString : string = '';
        try {
            bodyString = ReactServerController._renderHtmlString(url, htmlString, App);
        } catch (err) {
            LOG.error(`Could not render "${url}":`, err);
            return ResponseEntity.internalServerError<string>().body('Internal Server Error');
        }

        // // Waits for next stick so that we make sure there isn't HTTP requests triggered
        // LOG.debug(`Waiting a moment for internal HTTP requests for "${url}"`);
        // const [promise, cancelWait] = this._waitUntilMs(1);
        // await promise;
        //
        // if (HttpService.hasOpenRequests()) {
        //     LOG.debug(`Waiting for HttpService to load resources for "${url}"`);
        //     await HttpService.waitUntilNoOpenRequests();
        //     LOG.debug(`Re-rendering after HTTP requests for "${url}"`);
        //     try {
        //         bodyString = ReactServerController._renderHtmlString(url, htmlString, App);
        //     } catch (err) {
        //         LOG.error(`Could not render "${url}":`, err);
        //         return ResponseEntity.internalServerError<string>().body('Internal Server Error');
        //     }
        // } else {
        //     LOG.debug(`HttpService was not loading any resources for "${url}"`);
        // }

        return ResponseEntity.ok<string>().body( bodyString );

    }

    private static _renderHtmlString (
        url: string,
        htmlString: string,
        App: any
    ) : string {

        let appString : string | undefined;
        let helmet    : HelmetData;
        try {
            appString = StaticReactAppService.renderString(url, App);
            helmet = Helmet.renderStatic();
        } catch (err) {
            LOG.error(`Error while rendering app: `, err);
            helmet = Helmet.renderStatic(); // Must free up memory to prevent memory leaks in Helmet
        }
        const manager : HtmlManager = new HtmlManager(htmlString);
        manager.setHtmlAttributes(helmet.htmlAttributes.toString());
        manager.setBodyAttributes(helmet.bodyAttributes.toString());
        manager.setTitle(helmet.title.toString());
        manager.setBase(helmet.base.toString());
        manager.appendMeta(helmet.meta.toString());
        manager.appendLink(helmet.link.toString());
        manager.appendStyle(helmet.style.toString());
        manager.appendScript(helmet.script.toString());
        manager.replaceNoScript(helmet.noscript.toString());
        if (appString) {
            manager.replaceContentById('div', 'root', appString);
        }
        return manager.toString();

    }

    private static _waitUntilMs (time: number) : [Promise<void>, VoidCallback] {
        let rejectPromise : any | undefined = undefined;
        let timeout : any | undefined = undefined;
        const cancel : VoidCallback = () => {
            if (rejectPromise !== undefined) {
                rejectPromise('cancel');
                rejectPromise = undefined;
            }
            if (timeout !== undefined) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };
        const promise : Promise<void> = new Promise((resolve, reject) => {
            try {
                rejectPromise = reject;
                timeout = setTimeout(() => {
                    try {

                        if (timeout) {
                            timeout = undefined;
                        }

                        if (rejectPromise) {
                            rejectPromise = undefined;
                        }

                        resolve();

                    } catch (err) {
                        reject(err);
                        rejectPromise = undefined;
                    }
                }, time);
            } catch(err) {
                reject(err);
                rejectPromise = undefined;
            }
        });
        return [ promise, cancel ];
    }

}
