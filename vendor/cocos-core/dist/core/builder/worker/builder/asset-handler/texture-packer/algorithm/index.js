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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePackerAlgorithm = void 0;
// https://github.com/finscn/max-rects-packing
// @ts-ignore
const ipacker = __importStar(require("max-rects-packing"));
const maxrects_1 = __importDefault(require("./maxrects"));
function getRectsFromInputs(inputs) {
    return inputs.map((r) => {
        return { width: r.width, height: r.height, origin: r };
    });
}
function getInputsFromRects(rects) {
    return rects.map((rect) => {
        const r = rect.origin;
        for (const name in rect) {
            if (name === 'origin') {
                continue;
            }
            r[name] = rect[name];
        }
        return r;
    });
}
function scoreMaxRects(inputs, binWidth, binHeight, heuristice, allowRotation, result) {
    // 需要克隆 inputs，不能修改到 inputs 里的数据，否则会影响到后面的遍历
    const pack = new maxrects_1.default(binWidth, binHeight, allowRotation);
    const packedRects = pack.insertRects(inputs, heuristice);
    // 已经打包的小图总面积
    let packedArea = 0;
    // 整张大图的面积
    let texArea = 0;
    let texWidth = 0;
    let texHeight = 0;
    for (let i = 0; i < packedRects.length; i++) {
        const rect = packedRects[i];
        packedArea += rect.width * rect.height;
        const right = rect.x + (rect.rotated ? rect.height : rect.width);
        const top = rect.y + (rect.rotated ? rect.width : rect.height);
        if (right > texWidth) {
            texWidth = right;
        }
        if (top > texHeight) {
            texHeight = top;
        }
    }
    texArea = texWidth * texHeight;
    // 打包好的面积除以大图面积得出分数
    const score = packedArea / texArea;
    // 如果打包的小图面积更大，则可以直接替换掉结果
    // 如果打包的分数更大，那么打包的小图面积也要大于等于结果才可以
    if (packedArea > result.packedArea || (score > result.score && packedArea >= result.packedArea)) {
        result.packedRects = packedRects;
        result.unpackedRects = inputs;
        result.score = score;
        result.packedArea = packedArea;
        result.binWidth = binWidth;
        result.binHeight = binHeight;
        result.heuristice = heuristice;
    }
}
function scoreMaxRectsForAllHeuristics(inputs, binWidth, binHeight, allowRotation, result) {
    for (let i = 0; i <= 5; i++) {
        // TODO: 修复 ContactPointRule 算法，这个算法现在会有重叠的部分
        if (i === 4) {
            continue;
        }
        scoreMaxRects(getRectsFromInputs(inputs), binWidth, binHeight, i, allowRotation, result);
    }
}
exports.TexturePackerAlgorithm = {
    ipacker(inputs, maxWidth, maxHeight, allowRotation) {
        // @ts-ignore
        const packer = new ipacker.Packer(maxWidth, maxHeight, {
            allowRotate: allowRotation,
        });
        const rects = getRectsFromInputs(inputs);
        const result = packer.fit(rects);
        return result.rects.map((rect) => {
            return Object.assign(rect.origin, rect.fitInfo);
        });
    },
    MaxRects(inputs, maxWidth, maxHeight, allowRotation) {
        let area = 0;
        for (let i = 0; i < inputs.length; i++) {
            area += inputs[i].width * inputs[i].height;
        }
        const scorePackResult = {
            packedRects: [],
            unpackedRects: [],
            score: -Infinity,
            packedArea: -Infinity,
        };
        // 如果所有小图的总面积大于设置的最大面积，则直接使用 maxWidth maxHeight 测试
        const maxArea = maxWidth * maxHeight;
        if (area < maxArea) {
            // 遍历二次幂宽高，直到大于 maxWidth maxHeight
            // 其中会包括 正方形 和 扁平长方形 的情况
            const startSearchSize = 4;
            for (let testWidth = startSearchSize; testWidth <= maxWidth; testWidth = Math.min(testWidth * 2, maxWidth)) {
                for (let testHeight = startSearchSize; testHeight <= maxHeight; testHeight = Math.min(testHeight * 2, maxHeight)) {
                    const testArea = testWidth * testHeight;
                    if (testArea >= area) {
                        // growArea 会根据测试结果自动增长
                        let growArea = area;
                        // eslint-disable-next-line no-constant-condition
                        while (1) {
                            // 使用测试面积的平方根作为测试宽高
                            const testBinSize = Math.pow(growArea, 0.5);
                            if (testBinSize <= testWidth && testBinSize <= testHeight) {
                                scoreMaxRectsForAllHeuristics(inputs, testBinSize, testBinSize, allowRotation, scorePackResult);
                            }
                            scoreMaxRectsForAllHeuristics(inputs, growArea / testHeight, testHeight, allowRotation, scorePackResult);
                            scoreMaxRectsForAllHeuristics(inputs, testWidth, growArea / testWidth, allowRotation, scorePackResult);
                            // 如果还有小图没有被打包进大图里，则将剩余小图的面积用来扩大测试的面积
                            const unpackedRects = scorePackResult.unpackedRects;
                            if (unpackedRects.length > 0) {
                                let leftArea = 0;
                                for (let i = 0; i < unpackedRects.length; i++) {
                                    leftArea += unpackedRects[i].width * unpackedRects[i].height;
                                }
                                growArea += leftArea / 2;
                            }
                            if (growArea >= testArea || unpackedRects.length === 0) {
                                break;
                            }
                        }
                    }
                    if (testHeight >= maxHeight) {
                        break;
                    }
                }
                if (testWidth >= maxWidth) {
                    break;
                }
            }
        }
        else {
            scoreMaxRectsForAllHeuristics(inputs, maxWidth, maxHeight, allowRotation, scorePackResult);
        }
        // console.debug(`Best heuristice: ${scorePackResult.heuristice}`);
        return getInputsFromRects(scorePackResult.packedRects);
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1wYWNrZXIvYWxnb3JpdGhtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhDQUE4QztBQUM5QyxhQUFhO0FBQ2IsMkRBQTZDO0FBRTdDLDBEQUFvRDtBQXdCcEQsU0FBUyxrQkFBa0IsQ0FBQyxNQUFvQjtJQUM1QyxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUNwQixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBb0MsQ0FBQztJQUM3RixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLEtBQXlDO0lBQ2pFLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3RCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN0QixJQUFJLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFBQyxTQUFTO1lBQUMsQ0FBQztZQUNuQyxDQUFTLENBQUMsSUFBSSxDQUFDLEdBQUksSUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxPQUFPLENBQWdCLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsTUFBMEMsRUFBRSxRQUFnQixFQUFFLFNBQWlCLEVBQUUsVUFBa0IsRUFBRSxhQUFzQixFQUFF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YUFBYSxDQUFDOzRCQUNwRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0NBQzNCLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztnQ0FDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQ0FDNUMsUUFBUSxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQ0FDakUsQ0FBQztnQ0FDRCxRQUFRLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQzs0QkFFRCxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQ0FDckQsTUFBTTs0QkFDVixDQUFDO3dCQUNMLENBQUM7b0JBQ0wsQ0FBQztvQkFFRCxJQUFJLFVBQVUsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFBQyxNQUFNO29CQUFDLENBQUM7Z0JBQzNDLENBQUM7Z0JBQ0QsSUFBSSxTQUFTLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQUMsTUFBTTtnQkFBQyxDQUFDO1lBQ3pDLENBQUM7UUFDTCxDQUFDO2FBQU0sQ0FBQztZQUNKLDZCQUE2QixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRUQsbUVBQW1FO1FBRW5FLE9BQU8sa0JBQWtCLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZpbnNjbi9tYXgtcmVjdHMtcGFja2luZ1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICogYXMgaXBhY2tlciBmcm9tICdtYXgtcmVjdHMtcGFja2luZyc7XG5cbmltcG9ydCBNYXhSZWN0c0JpblBhY2ssIHsgSVJlY3QgfSBmcm9tICcuL21heHJlY3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBJSW5wdXRSZWN0IHtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICAgIFtrZXk6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUGFja2VkUmVjdCBleHRlbmRzIElJbnB1dFJlY3Qge1xuICAgIHg6IG51bWJlcjtcbiAgICB5OiBudW1iZXI7XG4gICAgcm90YXRlZD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBJU2NvcmVQYWNrUmVzdWx0IHtcbiAgICBwYWNrZWRSZWN0czogKElSZWN0ICYgeyBvcmlnaW46IElJbnB1dFJlY3QgfSlbXTtcbiAgICB1bnBhY2tlZFJlY3RzOiAoSVJlY3QgJiB7IG9yaWdpbjogSUlucHV0UmVjdCB9KVtdO1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgcGFja2VkQXJlYTogbnVtYmVyO1xuICAgIGJpbldpZHRoPzogbnVtYmVyO1xuICAgIGJpbkhlaWdodD86IG51bWJlcjtcbiAgICBoZXVyaXN0aWNlPzogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBnZXRSZWN0c0Zyb21JbnB1dHMoaW5wdXRzOiBJSW5wdXRSZWN0W10pOiAoSVJlY3QgJiB7IG9yaWdpbjogSUlucHV0UmVjdCB9KVtdIHtcbiAgICByZXR1cm4gaW5wdXRzLm1hcCgocikgPT4ge1xuICAgICAgICByZXR1cm4geyB3aWR0aDogci53aWR0aCwgaGVpZ2h0OiByLmhlaWdodCwgb3JpZ2luOiByIH0gYXMgSVJlY3QgJiB7IG9yaWdpbjogSUlucHV0UmVjdCB9O1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRJbnB1dHNGcm9tUmVjdHMocmVjdHM6IChJUmVjdCAmIHsgb3JpZ2luOiBJSW5wdXRSZWN0IH0pW10pOiBJUGFja2VkUmVjdFtdIHtcbiAgICByZXR1cm4gcmVjdHMubWFwKChyZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWN0Lm9yaWdpbjtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIHJlY3QpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnb3JpZ2luJykgeyBjb250aW51ZTsgfVxuICAgICAgICAgICAgKHIgYXMgYW55KVtuYW1lXSA9IChyZWN0IGFzIGFueSlbbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHIgYXMgSVBhY2tlZFJlY3Q7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlTWF4UmVjdHMoaW5wdXRzOiAoSVJlY3QgJiB7IG9yaWdpbjogSUlucHV0UmVjdCB9KVtdLCBiaW5XaWR0aDogbnVtYmVyLCBiaW5IZWlnaHQ6IG51bWJlciwgaGV1cmlzdGljZTogbnVtYmVyLCBhbGxvd1JvdGF0aW9uOiBib29sZWFuLCByZXN1bHQ6IElTY29yZVBhY2tSZXN1bHQpOiB2b2lkIHtcbiAgICAvLyDpnIDopoHlhYvpmoYgaW5wdXRz77yM5LiN6IO95L+u5pS55YiwIGlucHV0cyDph4znmoTmlbDmja7vvIzlkKbliJnkvJrlvbHlk43liLDlkI7pnaLnmoTpgY3ljoZcbiAgICBjb25zdCBwYWNrID0gbmV3IE1heFJlY3RzQmluUGFjayhiaW5XaWR0aCwgYmluSGVpZ2h0LCBhbGxvd1JvdGF0aW9uKTtcbiAgICBjb25zdCBwYWNrZWRSZWN0cyA9IHBhY2suaW5zZXJ0UmVjdHMoaW5wdXRzLCBoZXVyaXN0aWNlKSBhcyAoSVJlY3QgJiB7IG9yaWdpbjogSUlucHV0UmVjdCB9KVtdO1xuXG4gICAgLy8g5bey57uP5omT5YyF55qE5bCP5Zu+5oC76Z2i56evXG4gICAgbGV0IHBhY2tlZEFyZWEgPSAwO1xuICAgIC8vIOaVtOW8oOWkp+WbvueahOmdouenr1xuICAgIGxldCB0ZXhBcmVhID0gMDtcbiAgICBsZXQgdGV4V2lkdGggPSAwO1xuICAgIGxldCB0ZXhIZWlnaHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2VkUmVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IHBhY2tlZFJlY3RzW2ldO1xuICAgICAgICBwYWNrZWRBcmVhICs9IHJlY3Qud2lkdGggKiByZWN0LmhlaWdodDtcblxuICAgICAgICBjb25zdCByaWdodCA9IHJlY3QueCArICgocmVjdCBhcyBhbnkpLnJvdGF0ZWQgPyByZWN0LmhlaWdodCA6IHJlY3Qud2lkdGgpO1xuICAgICAgICBjb25zdCB0b3AgPSByZWN0LnkgKyAoKHJlY3QgYXMgYW55KS5yb3RhdGVkID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0KTtcbiAgICAgICAgaWYgKHJpZ2h0ID4gdGV4V2lkdGgpIHsgdGV4V2lkdGggPSByaWdodDsgfVxuICAgICAgICBpZiAodG9wID4gdGV4SGVpZ2h0KSB7IHRleEhlaWdodCA9IHRvcDsgfVxuICAgIH1cbiAgICB0ZXhBcmVhID0gdGV4V2lkdGggKiB0ZXhIZWlnaHQ7XG5cbiAgICAvLyDmiZPljIXlpb3nmoTpnaLnp6/pmaTku6XlpKflm77pnaLnp6/lvpflh7rliIbmlbBcbiAgICBjb25zdCBzY29yZSA9IHBhY2tlZEFyZWEgLyB0ZXhBcmVhO1xuXG4gICAgLy8g5aaC5p6c5omT5YyF55qE5bCP5Zu+6Z2i56ev5pu05aSn77yM5YiZ5Y+v5Lul55u05o6l5pu/5o2i5o6J57uT5p6cXG4gICAgLy8g5aaC5p6c5omT5YyF55qE5YiG5pWw5pu05aSn77yM6YKj5LmI5omT5YyF55qE5bCP5Zu+6Z2i56ev5Lmf6KaB5aSn5LqO562J5LqO57uT5p6c5omN5Y+v5LulXG4gICAgaWYgKHBhY2tlZEFyZWEgPiByZXN1bHQucGFja2VkQXJlYSB8fCAoc2NvcmUgPiByZXN1bHQuc2NvcmUgJiYgcGFja2VkQXJlYSA+PSByZXN1bHQucGFja2VkQXJlYSkpIHtcbiAgICAgICAgcmVzdWx0LnBhY2tlZFJlY3RzID0gcGFja2VkUmVjdHM7XG4gICAgICAgIHJlc3VsdC51bnBhY2tlZFJlY3RzID0gaW5wdXRzO1xuICAgICAgICByZXN1bHQuc2NvcmUgPSBzY29yZTtcbiAgICAgICAgcmVzdWx0LnBhY2tlZEFyZWEgPSBwYWNrZWRBcmVhO1xuICAgICAgICByZXN1bHQuYmluV2lkdGggPSBiaW5XaWR0aDtcbiAgICAgICAgcmVzdWx0LmJpbkhlaWdodCA9IGJpbkhlaWdodDtcbiAgICAgICAgcmVzdWx0LmhldXJpc3RpY2UgPSBoZXVyaXN0aWNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2NvcmVNYXhSZWN0c0ZvckFsbEhldXJpc3RpY3MoaW5wdXRzOiBJSW5wdXRSZWN0W10sIGJpbldpZHRoOiBudW1iZXIsIGJpbkhlaWdodDogbnVtYmVyLCBhbGxvd1JvdGF0aW9uOiBib29sZWFuLCByZXN1bHQ6IElTY29yZVBhY2tSZXN1bHQpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSA1OyBpKyspIHtcbiAgICAgICAgLy8gVE9ETzog5L+u5aSNIENvbnRhY3RQb2ludFJ1bGUg566X5rOV77yM6L+Z5Liq566X5rOV546w5Zyo5Lya5pyJ6YeN5Y+g55qE6YOo5YiGXG4gICAgICAgIGlmIChpID09PSA0KSB7IGNvbnRpbnVlOyB9XG4gICAgICAgIHNjb3JlTWF4UmVjdHMoZ2V0UmVjdHNGcm9tSW5wdXRzKGlucHV0cyksIGJpbldpZHRoLCBiaW5IZWlnaHQsIGksIGFsbG93Um90YXRpb24sIHJlc3VsdCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgVGV4dHVyZVBhY2tlckFsZ29yaXRobSA9IHtcbiAgICBpcGFja2VyKGlucHV0czogSUlucHV0UmVjdFtdLCBtYXhXaWR0aDogbnVtYmVyLCBtYXhIZWlnaHQ6IG51bWJlciwgYWxsb3dSb3RhdGlvbjogYm9vbGVhbik6IElQYWNrZWRSZWN0W10ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHBhY2tlciA9IG5ldyBpcGFja2VyLlBhY2tlcihtYXhXaWR0aCwgbWF4SGVpZ2h0LCB7XG4gICAgICAgICAgICBhbGxvd1JvdGF0ZTogYWxsb3dSb3RhdGlvbixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVjdHMgPSBnZXRSZWN0c0Zyb21JbnB1dHMoaW5wdXRzKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcGFja2VyLmZpdChyZWN0cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQucmVjdHMubWFwKChyZWN0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHJlY3Qub3JpZ2luLCByZWN0LmZpdEluZm8pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgTWF4UmVjdHMoaW5wdXRzOiBJSW5wdXRSZWN0W10sIG1heFdpZHRoOiBudW1iZXIsIG1heEhlaWdodDogbnVtYmVyLCBhbGxvd1JvdGF0aW9uOiBib29sZWFuKTogSVBhY2tlZFJlY3RbXSB7XG4gICAgICAgIGxldCBhcmVhID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZWEgKz0gaW5wdXRzW2ldLndpZHRoICogaW5wdXRzW2ldLmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjb3JlUGFja1Jlc3VsdDogSVNjb3JlUGFja1Jlc3VsdCA9IHtcbiAgICAgICAgICAgIHBhY2tlZFJlY3RzOiBbXSxcbiAgICAgICAgICAgIHVucGFja2VkUmVjdHM6IFtdLFxuICAgICAgICAgICAgc2NvcmU6IC1JbmZpbml0eSxcbiAgICAgICAgICAgIHBhY2tlZEFyZWE6IC1JbmZpbml0eSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDlpoLmnpzmiYDmnInlsI/lm77nmoTmgLvpnaLnp6/lpKfkuo7orr7nva7nmoTmnIDlpKfpnaLnp6/vvIzliJnnm7TmjqXkvb/nlKggbWF4V2lkdGggbWF4SGVpZ2h0IOa1i+ivlVxuICAgICAgICBjb25zdCBtYXhBcmVhID0gbWF4V2lkdGggKiBtYXhIZWlnaHQ7XG4gICAgICAgIGlmIChhcmVhIDwgbWF4QXJlYSkge1xuXG4gICAgICAgICAgICAvLyDpgY3ljobkuozmrKHluYLlrr3pq5jvvIznm7TliLDlpKfkuo4gbWF4V2lkdGggbWF4SGVpZ2h0XG4gICAgICAgICAgICAvLyDlhbbkuK3kvJrljIXmi6wg5q2j5pa55b2iIOWSjCDmiYHlubPplb/mlrnlvaIg55qE5oOF5Ya1XG4gICAgICAgICAgICBjb25zdCBzdGFydFNlYXJjaFNpemUgPSA0O1xuICAgICAgICAgICAgZm9yIChsZXQgdGVzdFdpZHRoID0gc3RhcnRTZWFyY2hTaXplOyB0ZXN0V2lkdGggPD0gbWF4V2lkdGg7IHRlc3RXaWR0aCA9IE1hdGgubWluKHRlc3RXaWR0aCAqIDIsIG1heFdpZHRoKSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHRlc3RIZWlnaHQgPSBzdGFydFNlYXJjaFNpemU7IHRlc3RIZWlnaHQgPD0gbWF4SGVpZ2h0OyB0ZXN0SGVpZ2h0ID0gTWF0aC5taW4odGVzdEhlaWdodCAqIDIsIG1heEhlaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVzdEFyZWEgPSB0ZXN0V2lkdGggKiB0ZXN0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVzdEFyZWEgPj0gYXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ3Jvd0FyZWEg5Lya5qC55o2u5rWL6K+V57uT5p6c6Ieq5Yqo5aKe6ZW/XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZ3Jvd0FyZWEgPSBhcmVhO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS9v+eUqOa1i+ivlemdouenr+eahOW5s+aWueagueS9nOS4uua1i+ivleWuvemrmFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RCaW5TaXplID0gTWF0aC5wb3coZ3Jvd0FyZWEsIDAuNSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVzdEJpblNpemUgPD0gdGVzdFdpZHRoICYmIHRlc3RCaW5TaXplIDw9IHRlc3RIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcmVNYXhSZWN0c0ZvckFsbEhldXJpc3RpY3MoaW5wdXRzLCB0ZXN0QmluU2l6ZSwgdGVzdEJpblNpemUsIGFsbG93Um90YXRpb24sIHNjb3JlUGFja1Jlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3JlTWF4UmVjdHNGb3JBbGxIZXVyaXN0aWNzKGlucHV0cywgZ3Jvd0FyZWEgLyB0ZXN0SGVpZ2h0LCB0ZXN0SGVpZ2h0LCBhbGxvd1JvdGF0aW9uLCBzY29yZVBhY2tSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3JlTWF4UmVjdHNGb3JBbGxIZXVyaXN0aWNzKGlucHV0cywgdGVzdFdpZHRoLCBncm93QXJlYSAvIHRlc3RXaWR0aCwgYWxsb3dSb3RhdGlvbiwgc2NvcmVQYWNrUmVzdWx0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOi/mOacieWwj+Wbvuayoeacieiiq+aJk+WMhei/m+Wkp+WbvumHjO+8jOWImeWwhuWJqeS9meWwj+WbvueahOmdouenr+eUqOadpeaJqeWkp+a1i+ivleeahOmdouenr1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVucGFja2VkUmVjdHMgPSBzY29yZVBhY2tSZXN1bHQudW5wYWNrZWRSZWN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5wYWNrZWRSZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsZWZ0QXJlYSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5wYWNrZWRSZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdEFyZWEgKz0gdW5wYWNrZWRSZWN0c1tpXS53aWR0aCAqIHVucGFja2VkUmVjdHNbaV0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3dBcmVhICs9IGxlZnRBcmVhIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ3Jvd0FyZWEgPj0gdGVzdEFyZWEgfHwgdW5wYWNrZWRSZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3RIZWlnaHQgPj0gbWF4SGVpZ2h0KSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ZXN0V2lkdGggPj0gbWF4V2lkdGgpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjb3JlTWF4UmVjdHNGb3JBbGxIZXVyaXN0aWNzKGlucHV0cywgbWF4V2lkdGgsIG1heEhlaWdodCwgYWxsb3dSb3RhdGlvbiwgc2NvcmVQYWNrUmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUuZGVidWcoYEJlc3QgaGV1cmlzdGljZTogJHtzY29yZVBhY2tSZXN1bHQuaGV1cmlzdGljZX1gKTtcblxuICAgICAgICByZXR1cm4gZ2V0SW5wdXRzRnJvbVJlY3RzKHNjb3JlUGFja1Jlc3VsdC5wYWNrZWRSZWN0cyk7XG4gICAgfSxcbn07XG4iXX0=