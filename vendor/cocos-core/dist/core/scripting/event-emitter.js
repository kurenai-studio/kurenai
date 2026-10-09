"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = exports.CustomEvent = void 0;
const events_1 = require("events");
/**
 * 用于事件派发
 */
class CustomEvent extends events_1.EventEmitter {
    on(type, listener) { return super.on(type, listener); }
    off(type, listener) { return super.off(type, listener); }
    once(type, listener) { return super.once(type, listener); }
    emit(type, ...arg) { return super.emit(type, ...arg); }
}
exports.CustomEvent = CustomEvent;
exports.eventEmitter = new CustomEvent();
