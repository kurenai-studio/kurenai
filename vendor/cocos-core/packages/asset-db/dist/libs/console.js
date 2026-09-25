"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomConsole = void 0;
class CustomConsole {
    constructor(level) {
        level = level || 4 /* LogLevel.DEBUG */;
        // 默认直接转发，避免性能消耗
        this.debug = console.debug.bind(console);
        this.log = console.log.bind(console);
        this.warn = console.warn.bind(console);
        this.error = console.error.bind(console);
        // 根据 level 配置，在初始化 console 时就确认好不同方法的实现减少后续不必要的判断
        if (level < 4 /* LogLevel.DEBUG */) {
            this.debug = () => { };
        }
        if (level < 3 /* LogLevel.LOG */) {
            this.log = () => { };
        }
        if (level < 2 /* LogLevel.WARN */) {
            this.warn = () => { };
        }
        if (level < 1 /* LogLevel.Error */) {
            this.error = () => { };
        }
    }
}
exports.CustomConsole = CustomConsole;
