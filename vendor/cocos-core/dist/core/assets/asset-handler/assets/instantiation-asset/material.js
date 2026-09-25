'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialHandler = void 0;
const asset_1 = __importDefault(require("./asset"));
exports.MaterialHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-material',
    // 引擎内对应的类型
    assetType: 'cc.Material',
    importer: {
        // 版本号如果变更，则会强制重新导入
        ...asset_1.default.importer,
        version: '1.0.0',
    },
};
exports.default = exports.MaterialHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9tYXRlcmlhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUdiLG9EQUFnRDtBQUVuQyxRQUFBLGVBQWUsR0FBaUI7SUFDekMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSx3QkFBd0I7SUFFOUIsV0FBVztJQUNYLFNBQVMsRUFBRSxhQUFhO0lBRXhCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixHQUFHLGVBQXlCLENBQUMsUUFBUTtRQUNyQyxPQUFPLEVBQUUsT0FBTztLQUNuQjtDQUNKLENBQUM7QUFFRixrQkFBZSx1QkFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBJbnN0YW50aWF0aW9uQXNzZXRIYW5kbGVyIGZyb20gJy4vYXNzZXQnO1xuXG5leHBvcnQgY29uc3QgTWF0ZXJpYWxIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnaW5zdGFudGlhdGlvbi1tYXRlcmlhbCcsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5NYXRlcmlhbCcsXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgLi4uSW5zdGFudGlhdGlvbkFzc2V0SGFuZGxlci5pbXBvcnRlcixcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgTWF0ZXJpYWxIYW5kbGVyO1xuIl19