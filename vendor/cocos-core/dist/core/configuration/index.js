"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationManager = exports.configurationRegistry = void 0;
const registry_1 = require("./script/registry");
Object.defineProperty(exports, "configurationRegistry", { enumerable: true, get: function () { return registry_1.configurationRegistry; } });
const manager_1 = require("./script/manager");
Object.defineProperty(exports, "configurationManager", { enumerable: true, get: function () { return manager_1.configurationManager; } });
__exportStar(require("./migration"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9jb25maWd1cmF0aW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsZ0RBQTBEO0FBUXRELHNHQVJLLGdDQUFxQixPQVFMO0FBUHpCLDhDQUF3RDtBQVFwRCxxR0FSSyw4QkFBb0IsT0FRTDtBQU54Qiw4Q0FBNEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQmFzZUNvbmZpZ3VyYXRpb24gfSBmcm9tICcuL3NjcmlwdC9jb25maWcnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvblNjb3BlIH0gZnJvbSAnLi9zY3JpcHQvaW50ZXJmYWNlJztcbmltcG9ydCB7IGNvbmZpZ3VyYXRpb25SZWdpc3RyeSB9IGZyb20gJy4vc2NyaXB0L3JlZ2lzdHJ5JztcbmltcG9ydCB7IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIH0gZnJvbSAnLi9zY3JpcHQvbWFuYWdlcic7XG5cbmV4cG9ydCAqIGZyb20gJy4vbWlncmF0aW9uJztcblxuZXhwb3J0IHtcbiAgICBDb25maWd1cmF0aW9uU2NvcGUsXG4gICAgSUJhc2VDb25maWd1cmF0aW9uLFxuICAgIGNvbmZpZ3VyYXRpb25SZWdpc3RyeSxcbiAgICBjb25maWd1cmF0aW9uTWFuYWdlcixcbn07XG5cbmV4cG9ydCB7IElDb2Nvc0NvbmZpZ3VyYXRpb25Ob2RlLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWEgfSBmcm9tICcuL3NjcmlwdC9tZXRhZGF0YSc7XG4iXX0=