// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import TRANSLATIONS from "../fi/palvelinkauppa/translations";
import { FRONTEND_DEFAULT_LANGUAGE } from "../constants/frontend";
import TranslationUtils from "../fi/palvelinkauppa/utils/TranslationUtils";
import LogService from "../fi/nor/ts/LogService";

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

export default i18n;
