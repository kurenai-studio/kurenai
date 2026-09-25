'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshHandler = void 0;
const asset_1 = __importDefault(require("./asset"));
exports.MeshHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-mesh',
    // 引擎内对应的类型
    assetType: 'cc.Mesh',
    importer: {
        // 版本号如果变更，则会强制重新导入
        ...asset_1.default.importer,
        version: '1.0.0',
    },
};
exports.default = exports.MeshHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9pbnN0YW50aWF0aW9uLWFzc2V0L21lc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFHYixvREFBZ0Q7QUFFbkMsUUFBQSxXQUFXLEdBQWlCO0lBQ3JDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsb0JBQW9CO0lBRTFCLFdBQVc7SUFDWCxTQUFTLEVBQUUsU0FBUztJQUVwQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsR0FBRyxlQUF5QixDQUFDLFFBQVE7UUFDckMsT0FBTyxFQUFFLE9BQU87S0FDbkI7Q0FDSixDQUFDO0FBRUYsa0JBQWUsbUJBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgSW5zdGFudGlhdGlvbkFzc2V0SGFuZGxlciBmcm9tICcuL2Fzc2V0JztcblxuZXhwb3J0IGNvbnN0IE1lc2hIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnaW5zdGFudGlhdGlvbi1tZXNoJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLk1lc2gnLFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIC4uLkluc3RhbnRpYXRpb25Bc3NldEhhbmRsZXIuaW1wb3J0ZXIsXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE1lc2hIYW5kbGVyO1xuIl19