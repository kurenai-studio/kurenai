'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonHandler = void 0;
const asset_1 = __importDefault(require("./asset"));
exports.SkeletonHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-skeleton',
    // 引擎内对应的类型
    assetType: 'cc.Skeleton',
    importer: {
        ...asset_1.default.importer,
        // 版本号如果变更，则会强制重新导入
        version: '1.0.0',
    },
};
exports.default = exports.SkeletonHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tlbGV0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9za2VsZXRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUdiLG9EQUFnRDtBQUVuQyxRQUFBLGVBQWUsR0FBaUI7SUFDekMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSx3QkFBd0I7SUFFOUIsV0FBVztJQUNYLFNBQVMsRUFBRSxhQUFhO0lBRXhCLFFBQVEsRUFBRTtRQUNOLEdBQUcsZUFBeUIsQ0FBQyxRQUFRO1FBQ3JDLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztLQUNuQjtDQUNKLENBQUM7QUFFRixrQkFBZSx1QkFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBJbnN0YW50aWF0aW9uQXNzZXRIYW5kbGVyIGZyb20gJy4vYXNzZXQnO1xuXG5leHBvcnQgY29uc3QgU2tlbGV0b25IYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnaW5zdGFudGlhdGlvbi1za2VsZXRvbicsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5Ta2VsZXRvbicsXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAuLi5JbnN0YW50aWF0aW9uQXNzZXRIYW5kbGVyLmltcG9ydGVyLFxuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgU2tlbGV0b25IYW5kbGVyO1xuIl19