// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import ResponseEntity from "../../../nor/ts/request/ResponseEntity";
import PATH from "path";
import { FileSystemService } from "../services/FileSystemService";
import LogService from "../../../nor/ts/LogService";
import StaticReactAppService from "../services/StaticReactAppService";
import { Helmet, HelmetData } from "react-helmet";
import { HttpService } from "../../../palvelinkauppa/services/HttpService";

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

        LOG.debug(`Rendering ReactJS app for "${url}"`);
        let bodyString : string = '';
        try {
            bodyString = ReactServerController._renderHtmlString(url, htmlString, App);
        } catch (err) {
            LOG.error(`Could not render "${url}":`, err);
            return ResponseEntity.internalServerError<string>().body('Internal Server Error');
        }

        if (HttpService.hasOpenRequests()) {
            LOG.debug(`Waiting for HttpService to load resources for "${url}"`);
            await HttpService.waitUntilNoOpenRequests();
            LOG.debug(`Re-rendering after HTTP requests for "${url}"`);
            try {
                bodyString = ReactServerController._renderHtmlString(url, htmlString, App);
            } catch (err) {
                LOG.error(`Could not render "${url}":`, err);
                return ResponseEntity.internalServerError<string>().body('Internal Server Error');
            }
        } else {
            LOG.debug(`HttpService was not loading any resources for "${url}"`);
        }

        return ResponseEntity.ok<string>().body( bodyString );

    }

    private static _renderHtmlString (
        url: string,
        htmlString: string,
        App: any
    ) : string {

        // LOG.debug(`_renderHtmlString: typeof url: `, typeof url);
        // LOG.debug(`_renderHtmlString: typeof htmlString: `, typeof htmlString);
        // LOG.debug(`_renderHtmlString: typeof App: `, typeof App);

        let appString : string = StaticReactAppService.renderString(url, App);
        // LOG.debug(`_renderHtmlString: appString: `, appString);

        const helmet : HelmetData = Helmet.renderStatic();

        const rootDivId = 'root';

        // noinspection HtmlRequiredLangAttribute
        return htmlString.replace(
            this._createDivTag(rootDivId),
            this._createDivTag(rootDivId, appString)
        ).replace(
            /<html[^>]*>/,
            `<html ${helmet.htmlAttributes.toString()}>`
        ).replace(
            /<title>.*<\/title>/,
            helmet.title.toString()
        ).replace(
            /<body[^>]*>/,
            `<html ${helmet.bodyAttributes.toString()}>`
        );

    }

    private static _createDivTag (idName: string, content?: string) {
        return `<div id="${idName}">${content ? content : ''}</div>`;
    }

}
