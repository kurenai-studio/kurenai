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
