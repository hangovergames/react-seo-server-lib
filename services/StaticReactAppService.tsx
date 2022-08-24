// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { default as ReactDOMServer } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { default as i18n } from "i18next";
import { I18nextProvider } from 'react-i18next';
import { LogService } from "../../core/LogService";

const LOG = LogService.createLogger('StaticReactAppService');

export class StaticReactAppService {

    public static renderString (
        url         : string,
        App         : any
    ) : string {

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
