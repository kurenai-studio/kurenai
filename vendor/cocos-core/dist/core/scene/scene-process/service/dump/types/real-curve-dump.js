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
exports.realCurveDump = void 0;
const cc = __importStar(require("cc"));
const EDITOR_EXTRAS_TAG = cc.editorExtrasTag || '__editorExtras__';
// valueType 直接使用引擎序列化
class RealCurveDump {
    encode(object, data, opts) {
        data.value = this.encodeByObj(object, opts);
        // HACK 目前曲线新建完无默认数据
        // @ts-ignore
        if (!data.value.keyFrames.length) {
            data.value = data.default;
        }
    }
    decode(data, info, dump, opts) {
        if (dump.value) {
            // @ts-ignore
            const curve = data[info.key];
            this.decodeByDump(dump, curve, opts);
        }
    }
    encodeByObj(curve, opts) {
        try {
            return {
                postExtrap: curve.postExtrapolation,
                preExtrap: curve.preExtrapolation,
                keyFrames: [...curve.keyframes()].map(([time, value]) => {
                    const editorExtras = value[EDITOR_EXTRAS_TAG] || {};
                    return {
                        time,
                        value: value.value,
                        inTangent: value.leftTangent,
                        outTangent: value.rightTangent,
                        inTangentWeight: value.leftTangentWeight,
                        outTangentWeight: value.rightTangentWeight,
                        interpMode: value.interpolationMode,
                        tangentWeightMode: value.tangentWeightMode,
                        tangentMode: editorExtras.tangentMode,
                        broken: editorExtras.broken,
                    };
                }),
            };
        }
        catch (error) {
            console.warn('Value dump failed.');
            console.warn(error);
            const ctor = opts.ctor;
            const dump = EditorExtends.serialize(new ctor(), { stringify: false, forceInline: true });
            delete dump.__type__;
            return dump;
        }
    }
    decodeByDump(dump, curve, opts) {
        if (dump.value.keyFrames) {
            const keyData = dump.value.keyFrames.map((item) => {
                const value = {
                    value: item.value,
                    leftTangent: item.inTangent,
                    rightTangent: item.outTangent,
                    interpolationMode: item.interpMode,
                    tangentWeightMode: item.tangentWeightMode,
                    leftTangentWeight: item.inTangentWeight,
                    rightTangentWeight: item.outTangentWeight,
                };
                if (item.tangentMode !== undefined || item.broken !== undefined) {
                    value[EDITOR_EXTRAS_TAG] = {
                        tangentMode: item.tangentMode,
                        broken: item.broken,
                    };
                }
                return [item.time, value];
            });
            curve.assignSorted(keyData);
            curve.postExtrapolation = dump.value.postExtrap;
            curve.preExtrapolation = dump.value.preExtrap;
        }
        return curve;
    }
}
exports.realCurveDump = new RealCurveDump();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhbC1jdXJ2ZS1kdW1wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2R1bXAvdHlwZXMvcmVhbC1jdXJ2ZS1kdW1wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtBLHVDQUF5QjtBQUV6QixNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxlQUFlLElBQUksa0JBQWtCLENBQUM7QUFFbkUsc0JBQXNCO0FBQ3RCLE1BQU0sYUFBYTtJQUVSLE1BQU0sQ0FBQyxNQUFvQixFQUFFLElBQWUsRUFBRSxJQUFVO1FBQzNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsb0JBQW9CO1FBQ3BCLGFBQWE7UUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzlCLENBQUM7SUFDTCxDQUFDO0lBRU0sTUFBTSxDQUFDLElBQW1CLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFVO1FBQy9ELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2IsYUFBYTtZQUNiLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFpQixDQUFDO1lBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO0lBQ0wsQ0FBQztJQUVNLFdBQVcsQ0FBQyxLQUFtQixFQUFFLElBQVU7UUFDOUMsSUFBSSxDQUFDO1lBQ0QsT0FBTztnQkFDSCxVQUFVLEVBQUUsS0FBSyxDQUFDLGlCQUFp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QUM7SUFDakIsQ0FBQztDQUNKO0FBRVksUUFBQSxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgSVByb3BlcnR5LFxufSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHVibGljJztcblxuaW1wb3J0IHsgRHVtcEludGVyZmFjZSB9IGZyb20gJy4vZHVtcC1pbnRlcmZhY2UnO1xuaW1wb3J0ICogYXMgY2MgZnJvbSAnY2MnO1xuXG5jb25zdCBFRElUT1JfRVhUUkFTX1RBRyA9IGNjLmVkaXRvckV4dHJhc1RhZyB8fCAnX19lZGl0b3JFeHRyYXNfXyc7XG5cbi8vIHZhbHVlVHlwZSDnm7TmjqXkvb/nlKjlvJXmk47luo/liJfljJZcbmNsYXNzIFJlYWxDdXJ2ZUR1bXAgaW1wbGVtZW50cyBEdW1wSW50ZXJmYWNlIHtcblxuICAgIHB1YmxpYyBlbmNvZGUob2JqZWN0OiBjYy5SZWFsQ3VydmUsIGRhdGE6IElQcm9wZXJ0eSwgb3B0cz86IGFueSk6IHZvaWQge1xuICAgICAgICBkYXRhLnZhbHVlID0gdGhpcy5lbmNvZGVCeU9iaihvYmplY3QsIG9wdHMpO1xuXG4gICAgICAgIC8vIEhBQ0sg55uu5YmN5puy57q/5paw5bu65a6M5peg6buY6K6k5pWw5o2uXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKCFkYXRhLnZhbHVlLmtleUZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRhdGEudmFsdWUgPSBkYXRhLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlKGRhdGE6IGNjLkN1cnZlUmFuZ2UsIGluZm86IGFueSwgZHVtcDogYW55LCBvcHRzPzogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChkdW1wLnZhbHVlKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBjdXJ2ZSA9IGRhdGFbaW5mby5rZXldIGFzIGNjLlJlYWxDdXJ2ZTtcbiAgICAgICAgICAgIHRoaXMuZGVjb2RlQnlEdW1wKGR1bXAsIGN1cnZlLCBvcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBlbmNvZGVCeU9iaihjdXJ2ZTogY2MuUmVhbEN1cnZlLCBvcHRzPzogYW55KTogYW55IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcG9zdEV4dHJhcDogY3VydmUucG9zdEV4dHJhcG9sYXRpb24sXG4gICAgICAgICAgICAgICAgcHJlRXh0cmFwOiBjdXJ2ZS5wcmVFeHRyYXBvbGF0aW9uLFxuICAgICAgICAgICAgICAgIGtleUZyYW1lczogWy4uLmN1cnZlLmtleWZyYW1lcygpXS5tYXAoKFt0aW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yRXh0cmFzID0gdmFsdWVbRURJVE9SX0VYVFJBU19UQUddIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZS52YWx1ZSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiB2YWx1ZS5sZWZ0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IHZhbHVlLnJpZ2h0VGFuZ2VudCxcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiB2YWx1ZS5sZWZ0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IHZhbHVlLnJpZ2h0VGFuZ2VudFdlaWdodCxcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogdmFsdWUuaW50ZXJwb2xhdGlvbk1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogdmFsdWUudGFuZ2VudFdlaWdodE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50TW9kZTogZWRpdG9yRXh0cmFzLnRhbmdlbnRNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VuOiBlZGl0b3JFeHRyYXMuYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVmFsdWUgZHVtcCBmYWlsZWQuJyk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuXG4gICAgICAgICAgICBjb25zdCBjdG9yID0gb3B0cy5jdG9yO1xuICAgICAgICAgICAgY29uc3QgZHVtcCA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKG5ldyBjdG9yKCksIHsgc3RyaW5naWZ5OiBmYWxzZSwgZm9yY2VJbmxpbmU6IHRydWUgfSkgYXMgYW55O1xuICAgICAgICAgICAgZGVsZXRlIGR1bXAuX190eXBlX187XG4gICAgICAgICAgICByZXR1cm4gZHVtcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkZWNvZGVCeUR1bXAoZHVtcDogYW55LCBjdXJ2ZTogY2MuUmVhbEN1cnZlLCBvcHRzPzogYW55KTogY2MuUmVhbEN1cnZlIHtcbiAgICAgICAgaWYgKGR1bXAudmFsdWUua2V5RnJhbWVzKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlEYXRhID0gZHVtcC52YWx1ZS5rZXlGcmFtZXMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaXRlbS52YWx1ZSxcblxuICAgICAgICAgICAgICAgICAgICBsZWZ0VGFuZ2VudDogaXRlbS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuXG4gICAgICAgICAgICAgICAgICAgIGludGVycG9sYXRpb25Nb2RlOiBpdGVtLmludGVycE1vZGUsXG4gICAgICAgICAgICAgICAgICAgIHRhbmdlbnRXZWlnaHRNb2RlOiBpdGVtLnRhbmdlbnRXZWlnaHRNb2RlLFxuXG4gICAgICAgICAgICAgICAgICAgIGxlZnRUYW5nZW50V2VpZ2h0OiBpdGVtLmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHRUYW5nZW50V2VpZ2h0OiBpdGVtLm91dFRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS50YW5nZW50TW9kZSAhPT0gdW5kZWZpbmVkIHx8IGl0ZW0uYnJva2VuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbRURJVE9SX0VYVFJBU19UQUddID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFuZ2VudE1vZGU6IGl0ZW0udGFuZ2VudE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW0udGltZSwgdmFsdWVdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJ2ZS5hc3NpZ25Tb3J0ZWQoa2V5RGF0YSk7XG4gICAgICAgICAgICBjdXJ2ZS5wb3N0RXh0cmFwb2xhdGlvbiA9IGR1bXAudmFsdWUucG9zdEV4dHJhcDtcbiAgICAgICAgICAgIGN1cnZlLnByZUV4dHJhcG9sYXRpb24gPSBkdW1wLnZhbHVlLnByZUV4dHJhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJ2ZTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCByZWFsQ3VydmVEdW1wID0gbmV3IFJlYWxDdXJ2ZUR1bXAoKTtcbiJdfQ==