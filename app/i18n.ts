// Copyright (c) 2021-2022. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LogService } from "../../../hg/core/LogService";
import { TRANSLATIONS } from "../../../app";
import { FRONTEND_DEFAULT_LANGUAGE } from "../../../app/constants";
import { TranslationUtils } from "../../../app/utils/TranslationUtils";

const LOG = LogService.createLogger('ssr/i18n');

i18n.use(initReactI18next).init(
    {
        resources: TranslationUtils.getConfig(TRANSLATIONS),
        lng: FRONTEND_DEFAULT_LANGUAGE,
        interpolation: {
            escapeValue: false
        }
    }
).catch(err => {
    LOG.error(`Translation init failed: `, err);
});
