// Copyright (c) 2021-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { default as ReactDOMServer } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { default as i18n } from "i18next";
import { I18nextProvider } from 'react-i18next';
import { LogService } from "../../core/LogService";
import { isString } from "../../core/modules/lodash";

const LOG = LogService.createLogger('StaticReactAppService');

/**
 * A service for rendering a static React app to a string.
 */
export class StaticReactAppService {

    /**
     * Renders the static React app to a string.
     * @param {string} url - The URL to use for the router.
     * @param {any} App - The React app to render.
     * @returns {string} The rendered React app as a string.
     */
    public static renderString (
        url         : string,
        App         : any
    ) : string {

        if (!isString(url)) {
            throw new TypeError('`url` must be a string');
        }

        LOG.debug(`renderString: url: `, url);

        return ReactDOMServer.renderToString(
            <I18nextProvider i18n={i18n}>
                <StaticRouter location={url}>
                    <App />
                </StaticRouter>
            </I18nextProvider>
        );

    }

}
