"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackerDriverLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const packerDriverLogTag = '::PackerDriver::';
const packerDriverLogTagRegex = new RegExp(packerDriverLogTag);
const packerDriverLogTagHidden = `{hidden(${packerDriverLogTag})}`;
class PackerDriverLogger {
    constructor(debugLogFile) {
        const fileLogger = winston_1.default.createLogger({
            transports: [
                new winston_1.default.transports.File({
                    level: 'debug',
                    filename: debugLogFile,
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss.SSS' }), winston_1.default.format.printf(({ level, message, timestamp }) => {
                        return `${timestamp} ${level}: ${message}`;
                    })),
                }),
            ],
        });
        this._fileLogger = fileLogger;
    }
    debug(message) {
        this._fileLogger.debug(message);
    }
    info(message) {
        this._fileLogger.info(message);
        console.info(packerDriverLogTagHidden, message);
        return this;
    }
    warn(message) {
        this._fileLogger.warn(message);
        console.warn(packerDriverLogTagHidden, message);
        return this;
    }
    error(message) {
        this._fileLogger.error(message);
        console.error(packerDriverLogTagHidden, message);
        return this;
    }
    clear() {
        console.debug('Clear logs...');
    }
    _fileLogger;
}
exports.PackerDriverLogger = PackerDriverLogger;
