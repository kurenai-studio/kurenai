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
exports.ReferenceImageService = void 0;
__exportStar(require("./core/decorator"), exports);
__exportStar(require("./editor"), exports);
__exportStar(require("./node"), exports);
__exportStar(require("./script"), exports);
__exportStar(require("./asset"), exports);
__exportStar(require("./terrain"), exports);
require("./effect");
__exportStar(require("./component"), exports);
__exportStar(require("./engine"), exports);
__exportStar(require("./animation"), exports);
__exportStar(require("./prefab"), exports);
__exportStar(require("./selection"), exports);
__exportStar(require("./operation"), exports);
__exportStar(require("./undo"), exports);
__exportStar(require("./redo"), exports);
__exportStar(require("./camera"), exports);
__exportStar(require("./gizmo"), exports);
__exportStar(require("./scene-view"), exports);
__exportStar(require("./particle"), exports);
__exportStar(require("./preview"), exports);
__exportStar(require("./ui"), exports);
// Keep a runtime export so the web Scene bundle follows this decorator
// registration module instead of replacing its CommonJS side-effect import
// with an empty tree-shaken namespace.
var reference_image_1 = require("./reference-image");
Object.defineProperty(exports, "ReferenceImageService", { enumerable: true, get: function () { return reference_image_1.ReferenceImageService; } });
__exportStar(require("./core/global-events"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFBaUM7QUFDakMsMkNBQXlCO0FBQ3pCLHlDQUF1QjtBQUN2QiwyQ0FBeUI7QUFDekIsMENBQXdCO0FBQ3hCLDRDQUEwQjtBQUMxQixvQkFBa0I7QUFDbEIsOENBQTRCO0FBQzVCLDJDQUF5QjtBQUN6Qiw4Q0FBNEI7QUFDNUIsMkNBQXlCO0FBQ3pCLDhDQUE0QjtBQUM1Qiw4Q0FBNEI7QUFDNUIseUNBQXVCO0FBQ3ZCLHlDQUF1QjtBQUN2QiwyQ0FBeUI7QUFDekIsMENBQXdCO0FBQ3hCLCtDQUE2QjtBQUM3Qiw2Q0FBMkI7QUFDM0IsNENBQTBCO0FBQzFCLHVDQUFxQjtBQUNyQix1RUFBdUU7QUFDdkUsMkVBQTJFO0FBQzNFLHVDQUF1QztBQUN2QyxxREFBMEQ7QUFBakQsd0hBQUEscUJBQXFCLE9BQUE7QUFDOUIsdURBQXFDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSAnLi9jb3JlL2RlY29yYXRvcic7XG5leHBvcnQgKiBmcm9tICcuL2VkaXRvcic7XG5leHBvcnQgKiBmcm9tICcuL25vZGUnO1xuZXhwb3J0ICogZnJvbSAnLi9zY3JpcHQnO1xuZXhwb3J0ICogZnJvbSAnLi9hc3NldCc7XG5leHBvcnQgKiBmcm9tICcuL3RlcnJhaW4nO1xuaW1wb3J0ICcuL2VmZmVjdCc7XG5leHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudCc7XG5leHBvcnQgKiBmcm9tICcuL2VuZ2luZSc7XG5leHBvcnQgKiBmcm9tICcuL2FuaW1hdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3ByZWZhYic7XG5leHBvcnQgKiBmcm9tICcuL3NlbGVjdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL29wZXJhdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3VuZG8nO1xuZXhwb3J0ICogZnJvbSAnLi9yZWRvJztcbmV4cG9ydCAqIGZyb20gJy4vY2FtZXJhJztcbmV4cG9ydCAqIGZyb20gJy4vZ2l6bW8nO1xuZXhwb3J0ICogZnJvbSAnLi9zY2VuZS12aWV3JztcbmV4cG9ydCAqIGZyb20gJy4vcGFydGljbGUnO1xuZXhwb3J0ICogZnJvbSAnLi9wcmV2aWV3JztcbmV4cG9ydCAqIGZyb20gJy4vdWknO1xuLy8gS2VlcCBhIHJ1bnRpbWUgZXhwb3J0IHNvIHRoZSB3ZWIgU2NlbmUgYnVuZGxlIGZvbGxvd3MgdGhpcyBkZWNvcmF0b3Jcbi8vIHJlZ2lzdHJhdGlvbiBtb2R1bGUgaW5zdGVhZCBvZiByZXBsYWNpbmcgaXRzIENvbW1vbkpTIHNpZGUtZWZmZWN0IGltcG9ydFxuLy8gd2l0aCBhbiBlbXB0eSB0cmVlLXNoYWtlbiBuYW1lc3BhY2UuXG5leHBvcnQgeyBSZWZlcmVuY2VJbWFnZVNlcnZpY2UgfSBmcm9tICcuL3JlZmVyZW5jZS1pbWFnZSc7XG5leHBvcnQgKiBmcm9tICcuL2NvcmUvZ2xvYmFsLWV2ZW50cyc7XG4iXX0=