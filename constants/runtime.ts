// Copyright (c) 2021. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { parseNonEmptyString } from "../../../nor/ts/modules/lodash";
import LogLevel, { parseLogLevel } from "../../../nor/ts/types/LogLevel";
import {
    BUILD_COMMAND_NAME,
    BUILD_LOG_LEVEL
} from "./build";

export const BACKEND_LOG_LEVEL       : LogLevel = parseLogLevel(parseNonEmptyString(process?.env?.BACKEND_LOG_LEVEL) ?? parseNonEmptyString(BUILD_LOG_LEVEL)) ?? LogLevel.INFO ;
export const BACKEND_SCRIPT_NAME     : string   = parseNonEmptyString(process?.env?.BACKEND_SCRIPT_NAME)                   ?? BUILD_COMMAND_NAME;
export const BACKEND_PORT            : number | string | false = normalizePort(process?.env?.PORT || '3000');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort (val : string) : number | string | false {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

