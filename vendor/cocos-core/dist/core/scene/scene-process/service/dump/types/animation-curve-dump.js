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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationCurveDump = void 0;
const real_curve_dump_1 = require("./real-curve-dump");
const cc = __importStar(require("cc"));
// 即将废弃的数据结构
class AnimationCurveDump {
    encode(object, data, opts) {
        real_curve_dump_1.realCurveDump.encode(object._internalCurve, data, opts);
    }
    decode(data, info, dump, opts) {
        const type = cc.js.getClassName(data);
        // 引擎为了兼容旧的接口使用方式，curveRange 内将存在使用 RealCurve 封装的 AnimationCurve，界面只会编辑 RealCurve 的新字段，
        // 此时的 dump 数据不需要还原上去，否则由于 dump 顺序的不可控会覆盖用户已修改的数据
        if (type === 'cc.CurveRange') {
            return;
        }
        // @ts-ignore
        const curve = data[info.key]._internalCurve;
        real_curve_dump_1.realCurveDump.decodeByDump(dump, curve, opts);
    }
}
exports.animationCurveDump = new AnimationCurveDump();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWN1cnZlLWR1bXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZHVtcC90eXBlcy9hbmltYXRpb24tY3VydmUtZHVtcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSx1REFBa0Q7QUFDbEQsdUNBQXlCO0FBR3pCLFlBQVk7QUFDWixNQUFNLGtCQUFrQjtJQUNiLE1BQU0sQ0FBQyxNQUFXLEVBQUUsSUFBZSxFQUFFLElBQVU7UUFDbEQsK0JBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVNLE1BQU0sQ0FBQyxJQUFtQixFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBVTtRQUMvRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0Qyx1RkFBdUY7UUFDdkYsaURBQWlEO1FBQ2pELElBQUksSUFBSSxLQUFLLGVBQWUsRUFBRSxDQUFDO1lBQzNCLE9BQU87UUFDWCxDQUFDO1FBQ0QsYUFBYTtRQUNiLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDO1FBQzVDLCtCQUFhLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEQsQ0FBQztDQUNKO0FBRVksUUFBQSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IER1bXBJbnRlcmZhY2UgfSBmcm9tICcuL2R1bXAtaW50ZXJmYWNlJztcbmltcG9ydCB7IHJlYWxDdXJ2ZUR1bXAgfSBmcm9tICcuL3JlYWwtY3VydmUtZHVtcCc7XG5pbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XG5pbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHVibGljJztcblxuLy8g5Y2z5bCG5bqf5byD55qE5pWw5o2u57uT5p6EXG5jbGFzcyBBbmltYXRpb25DdXJ2ZUR1bXAgaW1wbGVtZW50cyBEdW1wSW50ZXJmYWNlIHtcbiAgICBwdWJsaWMgZW5jb2RlKG9iamVjdDogYW55LCBkYXRhOiBJUHJvcGVydHksIG9wdHM/OiBhbnkpOiB2b2lkIHtcbiAgICAgICAgcmVhbEN1cnZlRHVtcC5lbmNvZGUob2JqZWN0Ll9pbnRlcm5hbEN1cnZlLCBkYXRhLCBvcHRzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlKGRhdGE6IGNjLkN1cnZlUmFuZ2UsIGluZm86IGFueSwgZHVtcDogYW55LCBvcHRzPzogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBjYy5qcy5nZXRDbGFzc05hbWUoZGF0YSk7XG4gICAgICAgIC8vIOW8leaTjuS4uuS6huWFvOWuueaXp+eahOaOpeWPo+S9v+eUqOaWueW8j++8jGN1cnZlUmFuZ2Ug5YaF5bCG5a2Y5Zyo5L2/55SoIFJlYWxDdXJ2ZSDlsIHoo4XnmoQgQW5pbWF0aW9uQ3VydmXvvIznlYzpnaLlj6rkvJrnvJbovpEgUmVhbEN1cnZlIOeahOaWsOWtl+aute+8jFxuICAgICAgICAvLyDmraTml7bnmoQgZHVtcCDmlbDmja7kuI3pnIDopoHov5jljp/kuIrljrvvvIzlkKbliJnnlLHkuo4gZHVtcCDpobrluo/nmoTkuI3lj6/mjqfkvJropobnm5bnlKjmiLflt7Lkv67mlLnnmoTmlbDmja5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdjYy5DdXJ2ZVJhbmdlJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgY3VydmUgPSBkYXRhW2luZm8ua2V5XS5faW50ZXJuYWxDdXJ2ZTtcbiAgICAgICAgcmVhbEN1cnZlRHVtcC5kZWNvZGVCeUR1bXAoZHVtcCwgY3VydmUsIG9wdHMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGFuaW1hdGlvbkN1cnZlRHVtcCA9IG5ldyBBbmltYXRpb25DdXJ2ZUR1bXAoKTtcbiJdfQ==