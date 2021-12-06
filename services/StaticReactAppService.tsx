// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { default as ReactDOMServer } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import LogService from "../../../nor/ts/LogService";
import { default as i18n } from "i18next";
import { I18nextProvider } from 'react-i18next';

const LOG = LogService.createLogger('StaticReactAppService');

export default class StaticReactAppService {

    public static renderString (
        url         : string,
        App         : any
    ) : string {

        LOG.debug(`renderString: typeof url: `, typeof url);
        LOG.debug(`renderString: typeof App: `, typeof App);

        return ReactDOMServer.renderToString(
            <I18nextProvider i18n={i18n}>
                <StaticRouter location={url}>
                    <App />
                </StaticRouter>
            </I18nextProvider>
        );

    }

}
