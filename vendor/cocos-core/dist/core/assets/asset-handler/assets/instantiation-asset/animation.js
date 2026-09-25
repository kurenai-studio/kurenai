'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationHandler = void 0;
const asset_1 = __importDefault(require("./asset"));
exports.AnimationHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-animation',
    // 引擎内对应的类型
    assetType: 'cc.AnimationClip',
    importer: {
        // 版本号如果变更，则会强制重新导入
        ...asset_1.default.importer,
        version: '1.0.0',
    },
};
exports.default = exports.AnimationHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2luc3RhbnRpYXRpb24tYXNzZXQvYW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBR2Isb0RBQWdEO0FBRW5DLFFBQUEsZ0JBQWdCLEdBQWlCO0lBQzFDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUseUJBQXlCO0lBRS9CLFdBQVc7SUFDWCxTQUFTLEVBQUUsa0JBQWtCO0lBRTdCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixHQUFHLGVBQXlCLENBQUMsUUFBUTtRQUNyQyxPQUFPLEVBQUUsT0FBTztLQUNuQjtDQUNKLENBQUM7QUFFRixrQkFBZSx3QkFBZ0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgSW5zdGFudGlhdGlvbkFzc2V0SGFuZGxlciBmcm9tICcuL2Fzc2V0JztcblxuZXhwb3J0IGNvbnN0IEFuaW1hdGlvbkhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdpbnN0YW50aWF0aW9uLWFuaW1hdGlvbicsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5BbmltYXRpb25DbGlwJyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICAuLi5JbnN0YW50aWF0aW9uQXNzZXRIYW5kbGVyLmltcG9ydGVyLFxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb25IYW5kbGVyO1xuIl19