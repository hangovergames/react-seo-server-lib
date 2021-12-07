// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import ResponseEntity from "../../../nor/ts/request/ResponseEntity";
import PATH from "path";
import { FileSystemService } from "../services/FileSystemService";
import LogService from "../../../nor/ts/LogService";
import StaticReactAppService from "../services/StaticReactAppService";

const LOG = LogService.createLogger('ReactServerController');

export default class ReactServerController {

    public static async handleReactRequest (
        url           : string,
        appDir        : string,
        App           : any,
        indexFileName : string = './index.html'
    ) : Promise<ResponseEntity<string>> {

        const indexFile = PATH.resolve(appDir, indexFileName);

        let htmlString : string = '';
        try {
            htmlString = await FileSystemService.readTextFile(indexFile);
        } catch (err) {
            LOG.error(`Could not read "${indexFile}" for "${url}":`, err);
            return ResponseEntity.internalServerError<string>().body('Internal Server Error');
        }

        let bodyString : string = '';
        try {
            bodyString = ReactServerController._renderHtmlString(url, htmlString, App);
        } catch (err) {
            LOG.error(`Could not render "${url}":`, err);
            return ResponseEntity.internalServerError<string>().body('Internal Server Error');
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

        const appString : string = StaticReactAppService.renderString(url, App);
        // LOG.debug(`_renderHtmlString: appString: `, appString);

        const rootDivId = 'root';

        return htmlString.replace(
            ReactServerController._createDivTag(rootDivId),
            ReactServerController._createDivTag(rootDivId, appString)
        );

    }

    private static _createDivTag (idName: string, content?: string) {
        return `<div id="${idName}">${content ? content : ''}</div>`;
    }

}
