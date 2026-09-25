"use strict";
// Re:
// https://github.com/yi/node-max-rects-bin-pack/blob/master/src/maxrects.coffee
// https://github.com/juj/RectangleBinPack/blob/master/MaxRectsBinPack.cpp
Object.defineProperty(exports, "__esModule", { value: true });
const BestShortSideFit = 0; ///< -BSSF: Positions the Rectangle against the short side of a free Rectangle into which it fits the best.
const BestLongSideFit = 1; ///< -BLSF: Positions the Rectangle against the long side of a free Rectangle into which it fits the best.
const BestAreaFit = 2; ///< -BAF: Positions the Rectangle into the smallest free Rectangle into which it fits.
const BottomLeftRule = 3; ///< -BL: Does the Tetris placement.
const ContactPointRule = 4; ///< -CP: Choosest the placement where the Rectangle touches other Rectangles as much as possible.
const LeftoverArea = 5;
/**
 * Rect
 */
class Rect {
    x;
    y;
    width;
    height;
    rotated;
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
    }
    clone() {
        return new Rect(this.x, this.y, this.width, this.height);
    }
    static isContainedIn(a, b) {
        return a.x >= b.x && a.y >= b.y &&
            a.x + a.width <= b.x + b.width &&
            a.y + a.height <= b.y + b.height;
    }
}
/**
 * MaxRectanglesBinPack
 */
class MaxRectsBinPack {
    binWidth = 0;
    binHeight = 0;
    allowRotate = false;
    usedRectangles = [];
    freeRectangles = [];
    constructor(width, height, allowRotate = false) {
        this.init(width, height, allowRotate);
    }
    /**
     * Init
     */
    init(width, height, allowRotate) {
        this.binWidth = width;
        this.binHeight = height;
        this.allowRotate = allowRotate || false;
        this.usedRectangles.length = 0;
        this.freeRectangles.length = 0;
        this.freeRectangles.push(new Rect(0, 0, width, height));
    }
    /**
     * Insert a set of rectangles
     * @param rectangles
     * @param method 0~4
     * @return success inserted rectangles
     */
    insertRects(rectangles, method) {
        const res = [];
        while (rectangles.length > 0) {
            let bestScore1 = Infinity;
            let bestScore2 = Infinity;
            let bestRectangleIndex = -1;
            let bestNode = new Rect();
            for (let i = 0; i < rectangles.length; i++) {
                const score1 = { value: 0 };
                const score2 = { value: 0 };
                const newNode = this._scoreRectangle(rectangles[i].width, rectangles[i].height, method, score1, score2);
                if (score1.value < bestScore1 || (score1.value === bestScore1 && score2.value < bestScore2)) {
                    bestScore1 = score1.value;
                    bestScore2 = score2.value;
                    bestNode = newNode;
                    bestRectangleIndex = i;
                }
            }
            if (bestRectangleIndex === -1) {
                return res;
            }
            this._placeRectangle(bestNode);
            const rect = rectangles.splice(bestRectangleIndex, 1)[0];
            rect.x = bestNode.x;
            rect.y = bestNode.y;
            if (rect.width !== rect.height && rect.width === bestNode.height && rect.height === bestNode.width) {
                rect.rotated = !rect.rotated;
            }
            res.push(rect);
        }
        return res;
    }
    _placeRectangle(node) {
        for (let i = 0; i < this.freeRectangles.length; i++) {
            if (this._splitFreeNode(this.freeRectangles[i], node)) {
                this.freeRectangles.splice(i, 1);
                i--;
            }
        }
        this._pruneFreeList();
        this.usedRectangles.push(node);
    }
    _scoreRectangle(width, height, method, score1, score2) {
        let newNode = new Rect();
        score1.value = Infinity;
        score2.value = Infinity;
        switch (method) {
            case BestShortSideFit:
                newNode = this._findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
                break;
            case BottomLeftRule:
                newNode = this._findPositionForNewNodeBottomLeft(width, height, score1, score2);
                break;
            case ContactPointRule:
                newNode = this._findPositionForNewNodeContactPoint(width, height, score1);
                // todo: reverse
                // @ts-ignore - 保持与 JS 版本一致的行为
                score1 = -score1; // Reverse since we are minimizing, but for contact point score bigger is better.
                break;
            case BestLongSideFit:
                newNode = this._findPositionForNewNodeBestLongSideFit(width, height, score2, score1);
                break;
            case BestAreaFit:
                newNode = this._findPositionForNewNodeBestAreaFit(width, height, score1, score2);
                break;
            case LeftoverArea:
                newNode = this._findPositionForNewNodeLeftoverArea(width, height, score1, score2);
                break;
        }
        // Cannot fit the current Rectangle.
        if (newNode.height === 0) {
            score1.value = Infinity;
            score2.value = Infinity;
        }
        return newNode;
    }
    _findPositionForNewNodeBottomLeft(width, height, bestY, bestX) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        bestY.value = Infinity;
        let rect;
        let topSideY;
        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                topSideY = rect.y + height;
                if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestY.value = topSideY;
                    bestX.value = rect.x;
                }
            }
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                topSideY = rect.y + width;
                if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestY.value = topSideY;
                    bestX.value = rect.x;
                }
            }
        }
        return bestNode;
    }
    _findPositionForNewNodeBestShortSideFit(width, height, bestShortSideFit, bestLongSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        bestShortSideFit.value = Infinity;
        let rect;
        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let longSideFit;
        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);
                if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }
            let flippedLeftoverHoriz;
            let flippedLeftoverVert;
            let flippedShortSideFit;
            let flippedLongSideFit;
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                flippedLeftoverHoriz = Math.abs(rect.width - height);
                flippedLeftoverVert = Math.abs(rect.height - width);
                flippedShortSideFit = Math.min(flippedLeftoverHoriz, flippedLeftoverVert);
                flippedLongSideFit = Math.max(flippedLeftoverHoriz, flippedLeftoverVert);
                if (flippedShortSideFit < bestShortSideFit.value || (flippedShortSideFit === bestShortSideFit.value && flippedLongSideFit < bestLongSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = flippedShortSideFit;
                    bestLongSideFit.value = flippedLongSideFit;
                }
            }
        }
        return bestNode;
    }
    _findPositionForNewNodeBestLongSideFit(width, height, bestShortSideFit, bestLongSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        bestLongSideFit.value = Infinity;
        let rect;
        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let longSideFit;
        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);
                if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = Math.abs(rect.width - height);
                leftoverVert = Math.abs(rect.height - width);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);
                if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }
        }
        return bestNode;
    }
    _findPositionForNewNodeBestAreaFit(width, height, bestAreaFit, bestShortSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        const requestArea = width * height;
        bestAreaFit.value = Infinity;
        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            const areaFit = rect.width * rect.height - requestArea;
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = rect.width - width;
                leftoverVert = rect.height - height;
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit.value = areaFit;
                }
            }
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = rect.width - height;
                leftoverVert = rect.height - width;
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit.value = areaFit;
                }
            }
        }
        return bestNode;
    }
    _findPositionForNewNodeLeftoverArea(width, height, bestAreaFit, bestShortSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        bestAreaFit.value = 0;
        bestShortSideFit.value = 0;
        let rect;
        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let areaFit;
        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
            areaFit = rect.width * rect.height - width * height;
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                if (areaFit > bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit > bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit.value = areaFit;
                }
            }
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = Math.abs(rect.width - height);
                leftoverVert = Math.abs(rect.height - width);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                if (areaFit > bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit > bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit.value = areaFit;
                }
            }
        }
        bestAreaFit.value = this.binWidth * this.binHeight - bestAreaFit.value;
        bestShortSideFit.value = Math.min(this.binWidth, this.binHeight) - bestShortSideFit.value;
        return bestNode;
    }
    /// Returns 0 if the two intervals i1 and i2 are disjoint, or the length of their overlap otherwise.
    _commonIntervalLength(i1start, i1end, i2start, i2end) {
        if (i1end < i2start || i2end < i1start) {
            return 0;
        }
        return Math.min(i1end, i2end) - Math.max(i1start, i2start);
    }
    _contactPointScoreNode(x, y, width, height) {
        const usedRectangles = this.usedRectangles;
        let score = 0;
        if (x === 0 || x + width === this.binWidth) {
            score += height;
        }
        if (y === 0 || y + height === this.binHeight) {
            score += width;
        }
        let rect;
        for (let i = 0; i < usedRectangles.length; i++) {
            rect = usedRectangles[i];
            if (rect.x === x + width || rect.x + rect.width === x) {
                score += this._commonIntervalLength(rect.y, rect.y + rect.height, y, y + height);
            }
            if (rect.y === y + height || rect.y + rect.height === y) {
                score += this._commonIntervalLength(rect.x, rect.x + rect.width, x, x + width);
            }
        }
        return score;
    }
    _findPositionForNewNodeContactPoint(width, height, bestContactScore) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        bestContactScore.value = -1;
        let rect;
        let score;
        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                score = this._contactPointScoreNode(rect.x, rect.y, width, height);
                if (score > bestContactScore.value) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    // @ts-ignore - 保持与 JS 版本一致
                    bestContactScore = score;
                }
            }
            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                score = this._contactPointScoreNode(rect.x, rect.y, height, width);
                if (score > bestContactScore.value) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestContactScore.value = score;
                }
            }
        }
        return bestNode;
    }
    _splitFreeNode(freeNode, usedNode) {
        const freeRectangles = this.freeRectangles;
        // Test with SAT if the Rectangles even intersect.
        if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
            usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y) {
            // 没有相交的部分
            return false;
        }
        let newNode;
        if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
            // usedNode 顶部包含在 freeNode 中间，那就 usedNode 上边拆出 newNode。
            newNode = freeNode.clone();
            newNode.height = usedNode.y - freeNode.y;
            freeRectangles.push(newNode);
        }
        // New node at the bottom side of the used node.
        if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
            newNode = freeNode.clone();
            newNode.y = usedNode.y + usedNode.height;
            newNode.height = freeNode.y + freeNode.height - newNode.y;
            freeRectangles.push(newNode);
        }
        // New node at the left side of the used node.
        if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
            newNode = freeNode.clone();
            newNode.width = usedNode.x - freeNode.x;
            freeRectangles.push(newNode);
        }
        // New node at the right side of the used node.
        if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
            newNode = freeNode.clone();
            newNode.x = usedNode.x + usedNode.width;
            newNode.width = freeNode.x + freeNode.width - newNode.x;
            freeRectangles.push(newNode);
        }
        return true;
    }
    _pruneFreeList() {
        const freeRectangles = this.freeRectangles;
        for (let i = 0; i < freeRectangles.length; i++) {
            for (let j = i + 1; j < freeRectangles.length; j++) {
                if (Rect.isContainedIn(freeRectangles[i], freeRectangles[j])) {
                    freeRectangles.splice(i, 1);
                    i--;
                    break;
                }
                if (Rect.isContainedIn(freeRectangles[j], freeRectangles[i])) {
                    freeRectangles.splice(j, 1);
                    j--;
                }
            }
        }
    }
    static heuristics = {
        BestShortSideFit,
        BestLongSideFit,
        BestAreaFit,
        BottomLeftRule,
        ContactPointRule,
        LeftoverArea,
    };
}
exports.default = MaxRectsBinPack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF4cmVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1wYWNrZXIvYWxnb3JpdGhtL21heHJlY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNO0FBQ04sZ0ZBQWdGO0FBQ2hGLDBFQUEwRTs7QUFXMUUsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQywyR0FBMkc7QUFDdkksTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsMEdBQTBHO0FBQ3JJLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLHVGQUF1RjtBQUM5RyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxvQ0FBb0M7QUFDOUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxrR0FBa0c7QUFDOUgsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBRXZCOztHQUVHO0FBQ0gsTUFBTSxJQUFJO0lBQ04sQ0FBQyxDQUFTO0lBQ1YsQ0FBQyxDQUFTO0lBQ1YsS0FBSyxDQUFTO0lBQ2QsTUFBTSxDQUFTO0lBQ2YsT0FBTyxDQUFXO0lBRWxCLFlBQVksSUFBWSxDQUFDLEVBQUUsSUFBWSxDQUFDLEVBQUUsUUFBZ0IsQ0FBQyxFQUFFLFNBQWlCLENBQUM7UUFDM0UsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxLQUFLO1FBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFF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LGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzNELGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDLEVBQUUsQ0FBQztvQkFDSixNQUFNO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMzRCxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ1IsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxVQUFVLEdBQUc7UUFDaEIsZ0JBQWdCO1FBQ2hCLGVBQWU7UUFDZixXQUFXO1FBQ1gsY0FBYztRQUNkLGdCQUFnQjtRQUNoQixZQUFZO0tBQ2YsQ0FBQzs7QUFHTixrQkFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSZTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS95aS9ub2RlLW1heC1yZWN0cy1iaW4tcGFjay9ibG9iL21hc3Rlci9zcmMvbWF4cmVjdHMuY29mZmVlXG4vLyBodHRwczovL2dpdGh1Yi5jb20vanVqL1JlY3RhbmdsZUJpblBhY2svYmxvYi9tYXN0ZXIvTWF4UmVjdHNCaW5QYWNrLmNwcFxuXG5leHBvcnQgaW50ZXJmYWNlIElSZWN0IHtcbiAgICB4OiBudW1iZXI7XG4gICAgeTogbnVtYmVyO1xuICAgIHdpZHRoOiBudW1iZXI7XG4gICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgcm90YXRlZD86IGJvb2xlYW47XG4gICAgY2xvbmUoKTogSVJlY3Q7XG59XG5cbmNvbnN0IEJlc3RTaG9ydFNpZGVGaXQgPSAwOyAvLy88IC1CU1NGOiBQb3NpdGlvbnMgdGhlIFJlY3RhbmdsZSBhZ2FpbnN0IHRoZSBzaG9ydCBzaWRlIG9mIGEgZnJlZSBSZWN0YW5nbGUgaW50byB3aGljaCBpdCBmaXRzIHRoZSBiZXN0LlxuY29uc3QgQmVzdExvbmdTaWRlRml0ID0gMTsgLy8vPCAtQkxTRjogUG9zaXRpb25zIHRoZSBSZWN0YW5nbGUgYWdhaW5zdCB0aGUgbG9uZyBzaWRlIG9mIGEgZnJlZSBSZWN0YW5nbGUgaW50byB3aGljaCBpdCBmaXRzIHRoZSBiZXN0LlxuY29uc3QgQmVzdEFyZWFGaXQgPSAyOyAvLy88IC1CQUY6IFBvc2l0aW9ucyB0aGUgUmVjdGFuZ2xlIGludG8gdGhlIHNtYWxsZXN0IGZyZWUgUmVjdGFuZ2xlIGludG8gd2hpY2ggaXQgZml0cy5cbmNvbnN0IEJvdHRvbUxlZnRSdWxlID0gMzsgLy8vPCAtQkw6IERvZXMgdGhlIFRldHJpcyBwbGFjZW1lbnQuXG5jb25zdCBDb250YWN0UG9pbnRSdWxlID0gNDsgLy8vPCAtQ1A6IENob29zZXN0IHRoZSBwbGFjZW1lbnQgd2hlcmUgdGhlIFJlY3RhbmdsZSB0b3VjaGVzIG90aGVyIFJlY3RhbmdsZXMgYXMgbXVjaCBhcyBwb3NzaWJsZS5cbmNvbnN0IExlZnRvdmVyQXJlYSA9IDU7XG5cbi8qKlxuICogUmVjdFxuICovXG5jbGFzcyBSZWN0IGltcGxlbWVudHMgSVJlY3Qge1xuICAgIHg6IG51bWJlcjtcbiAgICB5OiBudW1iZXI7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICByb3RhdGVkPzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciA9IDAsIHk6IG51bWJlciA9IDAsIHdpZHRoOiBudW1iZXIgPSAwLCBoZWlnaHQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgdGhpcy54ID0geCB8fCAwO1xuICAgICAgICB0aGlzLnkgPSB5IHx8IDA7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aCB8fCAwO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodCB8fCAwO1xuICAgIH1cblxuICAgIGNsb25lKCk6IElSZWN0IHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzQ29udGFpbmVkSW4oYTogSVJlY3QsIGI6IElSZWN0KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBhLnggPj0gYi54ICYmIGEueSA+PSBiLnkgJiZcbiAgICAgICAgICAgIGEueCArIGEud2lkdGggPD0gYi54ICsgYi53aWR0aCAmJlxuICAgICAgICAgICAgYS55ICsgYS5oZWlnaHQgPD0gYi55ICsgYi5oZWlnaHQ7XG4gICAgfVxufVxuXG4vKipcbiAqIE1heFJlY3RhbmdsZXNCaW5QYWNrXG4gKi9cbmNsYXNzIE1heFJlY3RzQmluUGFjayB7XG4gICAgYmluV2lkdGg6IG51bWJlciA9IDA7XG4gICAgYmluSGVpZ2h0OiBudW1iZXIgPSAwO1xuICAgIGFsbG93Um90YXRlOiBib29sZWFuID0gZmFsc2U7XG4gICAgdXNlZFJlY3RhbmdsZXM6IElSZWN0W10gPSBbXTtcbiAgICBmcmVlUmVjdGFuZ2xlczogSVJlY3RbXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGFsbG93Um90YXRlOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5pbml0KHdpZHRoLCBoZWlnaHQsIGFsbG93Um90YXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0XG4gICAgICovXG4gICAgaW5pdCh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgYWxsb3dSb3RhdGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5iaW5XaWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmJpbkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5hbGxvd1JvdGF0ZSA9IGFsbG93Um90YXRlIHx8IGZhbHNlO1xuXG4gICAgICAgIHRoaXMudXNlZFJlY3RhbmdsZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5mcmVlUmVjdGFuZ2xlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmZyZWVSZWN0YW5nbGVzLnB1c2gobmV3IFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc2VydCBhIHNldCBvZiByZWN0YW5nbGVzXG4gICAgICogQHBhcmFtIHJlY3RhbmdsZXNcbiAgICAgKiBAcGFyYW0gbWV0aG9kIDB+NFxuICAgICAqIEByZXR1cm4gc3VjY2VzcyBpbnNlcnRlZCByZWN0YW5nbGVzXG4gICAgICovXG4gICAgaW5zZXJ0UmVjdHMocmVjdGFuZ2xlczogSVJlY3RbXSwgbWV0aG9kOiBudW1iZXIpOiBJUmVjdFtdIHtcbiAgICAgICAgY29uc3QgcmVzOiBJUmVjdFtdID0gW107XG4gICAgICAgIHdoaWxlIChyZWN0YW5nbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBiZXN0U2NvcmUxID0gSW5maW5pdHk7XG4gICAgICAgICAgICBsZXQgYmVzdFNjb3JlMiA9IEluZmluaXR5O1xuICAgICAgICAgICAgbGV0IGJlc3RSZWN0YW5nbGVJbmRleCA9IC0xO1xuICAgICAgICAgICAgbGV0IGJlc3ROb2RlID0gbmV3IFJlY3QoKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWN0YW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcmUxID0geyB2YWx1ZTogMCB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3JlMiA9IHsgdmFsdWU6IDAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdOb2RlID0gdGhpcy5fc2NvcmVSZWN0YW5nbGUocmVjdGFuZ2xlc1tpXS53aWR0aCwgcmVjdGFuZ2xlc1tpXS5oZWlnaHQsIG1ldGhvZCwgc2NvcmUxLCBzY29yZTIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNjb3JlMS52YWx1ZSA8IGJlc3RTY29yZTEgfHwgKHNjb3JlMS52YWx1ZSA9PT0gYmVzdFNjb3JlMSAmJiBzY29yZTIudmFsdWUgPCBiZXN0U2NvcmUyKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUxID0gc2NvcmUxLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUyID0gc2NvcmUyLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RSZWN0YW5nbGVJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYmVzdFJlY3RhbmdsZUluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYWNlUmVjdGFuZ2xlKGJlc3ROb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSByZWN0YW5nbGVzLnNwbGljZShiZXN0UmVjdGFuZ2xlSW5kZXgsIDEpWzBdO1xuICAgICAgICAgICAgcmVjdC54ID0gYmVzdE5vZGUueDtcbiAgICAgICAgICAgIHJlY3QueSA9IGJlc3ROb2RlLnk7XG5cbiAgICAgICAgICAgIGlmIChyZWN0LndpZHRoICE9PSByZWN0LmhlaWdodCAmJiByZWN0LndpZHRoID09PSBiZXN0Tm9kZS5oZWlnaHQgJiYgcmVjdC5oZWlnaHQgPT09IGJlc3ROb2RlLndpZHRoKSB7XG4gICAgICAgICAgICAgICAgcmVjdC5yb3RhdGVkID0gIXJlY3Qucm90YXRlZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLnB1c2gocmVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wbGFjZVJlY3RhbmdsZShub2RlOiBJUmVjdCk6IHZvaWQge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZnJlZVJlY3RhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zcGxpdEZyZWVOb2RlKHRoaXMuZnJlZVJlY3RhbmdsZXNbaV0sIG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmVlUmVjdGFuZ2xlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHJ1bmVGcmVlTGlzdCgpO1xuICAgICAgICB0aGlzLnVzZWRSZWN0YW5nbGVzLnB1c2gobm9kZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2NvcmVSZWN0YW5nbGUod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIG1ldGhvZDogbnVtYmVyLCBzY29yZTE6IHsgdmFsdWU6IG51bWJlciB9LCBzY29yZTI6IHsgdmFsdWU6IG51bWJlciB9KTogSVJlY3Qge1xuICAgICAgICBsZXQgbmV3Tm9kZSA9IG5ldyBSZWN0KCk7XG4gICAgICAgIHNjb3JlMS52YWx1ZSA9IEluZmluaXR5O1xuICAgICAgICBzY29yZTIudmFsdWUgPSBJbmZpbml0eTtcbiAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgICAgIGNhc2UgQmVzdFNob3J0U2lkZUZpdDpcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5fZmluZFBvc2l0aW9uRm9yTmV3Tm9kZUJlc3RTaG9ydFNpZGVGaXQod2lkdGgsIGhlaWdodCwgc2NvcmUxLCBzY29yZTIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBCb3R0b21MZWZ0UnVsZTpcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5fZmluZFBvc2l0aW9uRm9yTmV3Tm9kZUJvdHRvbUxlZnQod2lkdGgsIGhlaWdodCwgc2NvcmUxLCBzY29yZTIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBDb250YWN0UG9pbnRSdWxlOlxuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLl9maW5kUG9zaXRpb25Gb3JOZXdOb2RlQ29udGFjdFBvaW50KHdpZHRoLCBoZWlnaHQsIHNjb3JlMSk7XG4gICAgICAgICAgICAgICAgLy8gdG9kbzogcmV2ZXJzZVxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgLSDkv53mjIHkuI4gSlMg54mI5pys5LiA6Ie055qE6KGM5Li6XG4gICAgICAgICAgICAgICAgc2NvcmUxID0gLXNjb3JlMTsgLy8gUmV2ZXJzZSBzaW5jZSB3ZSBhcmUgbWluaW1pemluZywgYnV0IGZvciBjb250YWN0IHBvaW50IHNjb3JlIGJpZ2dlciBpcyBiZXR0ZXIuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEJlc3RMb25nU2lkZUZpdDpcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5fZmluZFBvc2l0aW9uRm9yTmV3Tm9kZUJlc3RMb25nU2lkZUZpdCh3aWR0aCwgaGVpZ2h0LCBzY29yZTIsIHNjb3JlMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEJlc3RBcmVhRml0OlxuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLl9maW5kUG9zaXRpb25Gb3JOZXdOb2RlQmVzdEFyZWFGaXQod2lkdGgsIGhlaWdodCwgc2NvcmUxLCBzY29yZTIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBMZWZ0b3ZlckFyZWE6XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVMZWZ0b3ZlckFyZWEod2lkdGgsIGhlaWdodCwgc2NvcmUxLCBzY29yZTIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2Fubm90IGZpdCB0aGUgY3VycmVudCBSZWN0YW5nbGUuXG4gICAgICAgIGlmIChuZXdOb2RlLmhlaWdodCA9PT0gMCkge1xuICAgICAgICAgICAgc2NvcmUxLnZhbHVlID0gSW5maW5pdHk7XG4gICAgICAgICAgICBzY29yZTIudmFsdWUgPSBJbmZpbml0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVCb3R0b21MZWZ0KHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBiZXN0WTogeyB2YWx1ZTogbnVtYmVyIH0sIGJlc3RYOiB7IHZhbHVlOiBudW1iZXIgfSk6IElSZWN0IHtcbiAgICAgICAgY29uc3QgZnJlZVJlY3RhbmdsZXMgPSB0aGlzLmZyZWVSZWN0YW5nbGVzO1xuICAgICAgICBjb25zdCBiZXN0Tm9kZSA9IG5ldyBSZWN0KCk7XG5cbiAgICAgICAgYmVzdFkudmFsdWUgPSBJbmZpbml0eTtcbiAgICAgICAgbGV0IHJlY3Q6IElSZWN0O1xuICAgICAgICBsZXQgdG9wU2lkZVk6IG51bWJlcjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmVlUmVjdGFuZ2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVjdCA9IGZyZWVSZWN0YW5nbGVzW2ldO1xuICAgICAgICAgICAgLy8gVHJ5IHRvIHBsYWNlIHRoZSBSZWN0YW5nbGUgaW4gdXByaWdodCAobm9uLWZsaXBwZWQpIG9yaWVudGF0aW9uLlxuICAgICAgICAgICAgaWYgKHJlY3Qud2lkdGggPj0gd2lkdGggJiYgcmVjdC5oZWlnaHQgPj0gaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdG9wU2lkZVkgPSByZWN0LnkgKyBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgaWYgKHRvcFNpZGVZIDwgYmVzdFkudmFsdWUgfHwgKHRvcFNpZGVZID09PSBiZXN0WS52YWx1ZSAmJiByZWN0LnggPCBiZXN0WC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueCA9IHJlY3QueDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueSA9IHJlY3QueTtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBiZXN0WS52YWx1ZSA9IHRvcFNpZGVZO1xuICAgICAgICAgICAgICAgICAgICBiZXN0WC52YWx1ZSA9IHJlY3QueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5hbGxvd1JvdGF0ZSAmJiByZWN0LndpZHRoID49IGhlaWdodCAmJiByZWN0LmhlaWdodCA+PSB3aWR0aCkge1xuICAgICAgICAgICAgICAgIHRvcFNpZGVZID0gcmVjdC55ICsgd2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKHRvcFNpZGVZIDwgYmVzdFkudmFsdWUgfHwgKHRvcFNpZGVZID09PSBiZXN0WS52YWx1ZSAmJiByZWN0LnggPCBiZXN0WC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueCA9IHJlY3QueDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueSA9IHJlY3QueTtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUud2lkdGggPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLmhlaWdodCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBiZXN0WS52YWx1ZSA9IHRvcFNpZGVZO1xuICAgICAgICAgICAgICAgICAgICBiZXN0WC52YWx1ZSA9IHJlY3QueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJlc3ROb2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVCZXN0U2hvcnRTaWRlRml0KHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBiZXN0U2hvcnRTaWRlRml0OiB7IHZhbHVlOiBudW1iZXIgfSwgYmVzdExvbmdTaWRlRml0OiB7IHZhbHVlOiBudW1iZXIgfSk6IElSZWN0IHtcbiAgICAgICAgY29uc3QgZnJlZVJlY3RhbmdsZXMgPSB0aGlzLmZyZWVSZWN0YW5nbGVzO1xuICAgICAgICBjb25zdCBiZXN0Tm9kZSA9IG5ldyBSZWN0KCk7XG5cbiAgICAgICAgYmVzdFNob3J0U2lkZUZpdC52YWx1ZSA9IEluZmluaXR5O1xuXG4gICAgICAgIGxldCByZWN0OiBJUmVjdDtcbiAgICAgICAgbGV0IGxlZnRvdmVySG9yaXo6IG51bWJlcjtcbiAgICAgICAgbGV0IGxlZnRvdmVyVmVydDogbnVtYmVyO1xuICAgICAgICBsZXQgc2hvcnRTaWRlRml0OiBudW1iZXI7XG4gICAgICAgIGxldCBsb25nU2lkZUZpdDogbnVtYmVyO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJlZVJlY3RhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlY3QgPSBmcmVlUmVjdGFuZ2xlc1tpXTtcbiAgICAgICAgICAgIC8vIFRyeSB0byBwbGFjZSB0aGUgUmVjdGFuZ2xlIGluIHVwcmlnaHQgKG5vbi1mbGlwcGVkKSBvcmllbnRhdGlvbi5cbiAgICAgICAgICAgIGlmIChyZWN0LndpZHRoID49IHdpZHRoICYmIHJlY3QuaGVpZ2h0ID49IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxlZnRvdmVySG9yaXogPSBNYXRoLmFicyhyZWN0LndpZHRoIC0gd2lkdGgpO1xuICAgICAgICAgICAgICAgIGxlZnRvdmVyVmVydCA9IE1hdGguYWJzKHJlY3QuaGVpZ2h0IC0gaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBzaG9ydFNpZGVGaXQgPSBNYXRoLm1pbihsZWZ0b3Zlckhvcml6LCBsZWZ0b3ZlclZlcnQpO1xuICAgICAgICAgICAgICAgIGxvbmdTaWRlRml0ID0gTWF0aC5tYXgobGVmdG92ZXJIb3JpeiwgbGVmdG92ZXJWZXJ0KTtcblxuICAgICAgICAgICAgICAgIGlmIChzaG9ydFNpZGVGaXQgPCBiZXN0U2hvcnRTaWRlRml0LnZhbHVlIHx8IChzaG9ydFNpZGVGaXQgPT09IGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgJiYgbG9uZ1NpZGVGaXQgPCBiZXN0TG9uZ1NpZGVGaXQudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnggPSByZWN0Lng7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnkgPSByZWN0Lnk7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdFNob3J0U2lkZUZpdC52YWx1ZSA9IHNob3J0U2lkZUZpdDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdExvbmdTaWRlRml0LnZhbHVlID0gbG9uZ1NpZGVGaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZsaXBwZWRMZWZ0b3Zlckhvcml6OiBudW1iZXI7XG4gICAgICAgICAgICBsZXQgZmxpcHBlZExlZnRvdmVyVmVydDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IGZsaXBwZWRTaG9ydFNpZGVGaXQ6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCBmbGlwcGVkTG9uZ1NpZGVGaXQ6IG51bWJlcjtcbiAgICAgICAgICAgIGlmICh0aGlzLmFsbG93Um90YXRlICYmIHJlY3Qud2lkdGggPj0gaGVpZ2h0ICYmIHJlY3QuaGVpZ2h0ID49IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgZmxpcHBlZExlZnRvdmVySG9yaXogPSBNYXRoLmFicyhyZWN0LndpZHRoIC0gaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBmbGlwcGVkTGVmdG92ZXJWZXJ0ID0gTWF0aC5hYnMocmVjdC5oZWlnaHQgLSB3aWR0aCk7XG4gICAgICAgICAgICAgICAgZmxpcHBlZFNob3J0U2lkZUZpdCA9IE1hdGgubWluKGZsaXBwZWRMZWZ0b3Zlckhvcml6LCBmbGlwcGVkTGVmdG92ZXJWZXJ0KTtcbiAgICAgICAgICAgICAgICBmbGlwcGVkTG9uZ1NpZGVGaXQgPSBNYXRoLm1heChmbGlwcGVkTGVmdG92ZXJIb3JpeiwgZmxpcHBlZExlZnRvdmVyVmVydCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZmxpcHBlZFNob3J0U2lkZUZpdCA8IGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgfHwgKGZsaXBwZWRTaG9ydFNpZGVGaXQgPT09IGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgJiYgZmxpcHBlZExvbmdTaWRlRml0IDwgYmVzdExvbmdTaWRlRml0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUuaGVpZ2h0ID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgPSBmbGlwcGVkU2hvcnRTaWRlRml0O1xuICAgICAgICAgICAgICAgICAgICBiZXN0TG9uZ1NpZGVGaXQudmFsdWUgPSBmbGlwcGVkTG9uZ1NpZGVGaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJlc3ROb2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVCZXN0TG9uZ1NpZGVGaXQod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGJlc3RTaG9ydFNpZGVGaXQ6IHsgdmFsdWU6IG51bWJlciB9LCBiZXN0TG9uZ1NpZGVGaXQ6IHsgdmFsdWU6IG51bWJlciB9KTogSVJlY3Qge1xuICAgICAgICBjb25zdCBmcmVlUmVjdGFuZ2xlcyA9IHRoaXMuZnJlZVJlY3RhbmdsZXM7XG4gICAgICAgIGNvbnN0IGJlc3ROb2RlID0gbmV3IFJlY3QoKTtcbiAgICAgICAgYmVzdExvbmdTaWRlRml0LnZhbHVlID0gSW5maW5pdHk7XG4gICAgICAgIGxldCByZWN0OiBJUmVjdDtcblxuICAgICAgICBsZXQgbGVmdG92ZXJIb3JpejogbnVtYmVyO1xuICAgICAgICBsZXQgbGVmdG92ZXJWZXJ0OiBudW1iZXI7XG4gICAgICAgIGxldCBzaG9ydFNpZGVGaXQ6IG51bWJlcjtcbiAgICAgICAgbGV0IGxvbmdTaWRlRml0OiBudW1iZXI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJlZVJlY3RhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlY3QgPSBmcmVlUmVjdGFuZ2xlc1tpXTtcbiAgICAgICAgICAgIC8vIFRyeSB0byBwbGFjZSB0aGUgUmVjdGFuZ2xlIGluIHVwcmlnaHQgKG5vbi1mbGlwcGVkKSBvcmllbnRhdGlvbi5cbiAgICAgICAgICAgIGlmIChyZWN0LndpZHRoID49IHdpZHRoICYmIHJlY3QuaGVpZ2h0ID49IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxlZnRvdmVySG9yaXogPSBNYXRoLmFicyhyZWN0LndpZHRoIC0gd2lkdGgpO1xuICAgICAgICAgICAgICAgIGxlZnRvdmVyVmVydCA9IE1hdGguYWJzKHJlY3QuaGVpZ2h0IC0gaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBzaG9ydFNpZGVGaXQgPSBNYXRoLm1pbihsZWZ0b3Zlckhvcml6LCBsZWZ0b3ZlclZlcnQpO1xuICAgICAgICAgICAgICAgIGxvbmdTaWRlRml0ID0gTWF0aC5tYXgobGVmdG92ZXJIb3JpeiwgbGVmdG92ZXJWZXJ0KTtcblxuICAgICAgICAgICAgICAgIGlmIChsb25nU2lkZUZpdCA8IGJlc3RMb25nU2lkZUZpdC52YWx1ZSB8fCAobG9uZ1NpZGVGaXQgPT09IGJlc3RMb25nU2lkZUZpdC52YWx1ZSAmJiBzaG9ydFNpZGVGaXQgPCBiZXN0U2hvcnRTaWRlRml0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgPSBzaG9ydFNpZGVGaXQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RMb25nU2lkZUZpdC52YWx1ZSA9IGxvbmdTaWRlRml0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuYWxsb3dSb3RhdGUgJiYgcmVjdC53aWR0aCA+PSBoZWlnaHQgJiYgcmVjdC5oZWlnaHQgPj0gd2lkdGgpIHtcbiAgICAgICAgICAgICAgICBsZWZ0b3Zlckhvcml6ID0gTWF0aC5hYnMocmVjdC53aWR0aCAtIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgbGVmdG92ZXJWZXJ0ID0gTWF0aC5hYnMocmVjdC5oZWlnaHQgLSB3aWR0aCk7XG4gICAgICAgICAgICAgICAgc2hvcnRTaWRlRml0ID0gTWF0aC5taW4obGVmdG92ZXJIb3JpeiwgbGVmdG92ZXJWZXJ0KTtcbiAgICAgICAgICAgICAgICBsb25nU2lkZUZpdCA9IE1hdGgubWF4KGxlZnRvdmVySG9yaXosIGxlZnRvdmVyVmVydCk7XG5cbiAgICAgICAgICAgICAgICBpZiAobG9uZ1NpZGVGaXQgPCBiZXN0TG9uZ1NpZGVGaXQudmFsdWUgfHwgKGxvbmdTaWRlRml0ID09PSBiZXN0TG9uZ1NpZGVGaXQudmFsdWUgJiYgc2hvcnRTaWRlRml0IDwgYmVzdFNob3J0U2lkZUZpdC52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueCA9IHJlY3QueDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUueSA9IHJlY3QueTtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUud2lkdGggPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLmhlaWdodCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBiZXN0U2hvcnRTaWRlRml0LnZhbHVlID0gc2hvcnRTaWRlRml0O1xuICAgICAgICAgICAgICAgICAgICBiZXN0TG9uZ1NpZGVGaXQudmFsdWUgPSBsb25nU2lkZUZpdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJlc3ROb2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVCZXN0QXJlYUZpdCh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgYmVzdEFyZWFGaXQ6IHsgdmFsdWU6IG51bWJlciB9LCBiZXN0U2hvcnRTaWRlRml0OiB7IHZhbHVlOiBudW1iZXIgfSk6IElSZWN0IHtcbiAgICAgICAgY29uc3QgZnJlZVJlY3RhbmdsZXMgPSB0aGlzLmZyZWVSZWN0YW5nbGVzO1xuICAgICAgICBjb25zdCBiZXN0Tm9kZSA9IG5ldyBSZWN0KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RBcmVhID0gd2lkdGggKiBoZWlnaHQ7XG5cbiAgICAgICAgYmVzdEFyZWFGaXQudmFsdWUgPSBJbmZpbml0eTtcblxuICAgICAgICBsZXQgbGVmdG92ZXJIb3JpejogbnVtYmVyO1xuICAgICAgICBsZXQgbGVmdG92ZXJWZXJ0OiBudW1iZXI7XG4gICAgICAgIGxldCBzaG9ydFNpZGVGaXQ6IG51bWJlcjtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyZWVSZWN0YW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gZnJlZVJlY3RhbmdsZXNbaV07XG4gICAgICAgICAgICBjb25zdCBhcmVhRml0ID0gcmVjdC53aWR0aCAqIHJlY3QuaGVpZ2h0IC0gcmVxdWVzdEFyZWE7XG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBwbGFjZSB0aGUgUmVjdGFuZ2xlIGluIHVwcmlnaHQgKG5vbi1mbGlwcGVkKSBvcmllbnRhdGlvbi5cbiAgICAgICAgICAgIGlmIChyZWN0LndpZHRoID49IHdpZHRoICYmIHJlY3QuaGVpZ2h0ID49IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxlZnRvdmVySG9yaXogPSByZWN0LndpZHRoIC0gd2lkdGg7XG4gICAgICAgICAgICAgICAgbGVmdG92ZXJWZXJ0ID0gcmVjdC5oZWlnaHQgLSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgc2hvcnRTaWRlRml0ID0gTWF0aC5taW4obGVmdG92ZXJIb3JpeiwgbGVmdG92ZXJWZXJ0KTtcblxuICAgICAgICAgICAgICAgIGlmIChhcmVhRml0IDwgYmVzdEFyZWFGaXQudmFsdWUgfHwgKGFyZWFGaXQgPT09IGJlc3RBcmVhRml0LnZhbHVlICYmIHNob3J0U2lkZUZpdCA8IGJlc3RTaG9ydFNpZGVGaXQudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnggPSByZWN0Lng7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnkgPSByZWN0Lnk7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdFNob3J0U2lkZUZpdC52YWx1ZSA9IHNob3J0U2lkZUZpdDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdEFyZWFGaXQudmFsdWUgPSBhcmVhRml0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuYWxsb3dSb3RhdGUgJiYgcmVjdC53aWR0aCA+PSBoZWlnaHQgJiYgcmVjdC5oZWlnaHQgPj0gd2lkdGgpIHtcbiAgICAgICAgICAgICAgICBsZWZ0b3Zlckhvcml6ID0gcmVjdC53aWR0aCAtIGhlaWdodDtcbiAgICAgICAgICAgICAgICBsZWZ0b3ZlclZlcnQgPSByZWN0LmhlaWdodCAtIHdpZHRoO1xuICAgICAgICAgICAgICAgIHNob3J0U2lkZUZpdCA9IE1hdGgubWluKGxlZnRvdmVySG9yaXosIGxlZnRvdmVyVmVydCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJlYUZpdCA8IGJlc3RBcmVhRml0LnZhbHVlIHx8IChhcmVhRml0ID09PSBiZXN0QXJlYUZpdC52YWx1ZSAmJiBzaG9ydFNpZGVGaXQgPCBiZXN0U2hvcnRTaWRlRml0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUuaGVpZ2h0ID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgPSBzaG9ydFNpZGVGaXQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RBcmVhRml0LnZhbHVlID0gYXJlYUZpdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJlc3ROb2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRQb3NpdGlvbkZvck5ld05vZGVMZWZ0b3ZlckFyZWEod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGJlc3RBcmVhRml0OiB7IHZhbHVlOiBudW1iZXIgfSwgYmVzdFNob3J0U2lkZUZpdDogeyB2YWx1ZTogbnVtYmVyIH0pOiBJUmVjdCB7XG4gICAgICAgIGNvbnN0IGZyZWVSZWN0YW5nbGVzID0gdGhpcy5mcmVlUmVjdGFuZ2xlcztcbiAgICAgICAgY29uc3QgYmVzdE5vZGUgPSBuZXcgUmVjdCgpO1xuXG4gICAgICAgIGJlc3RBcmVhRml0LnZhbHVlID0gMDtcbiAgICAgICAgYmVzdFNob3J0U2lkZUZpdC52YWx1ZSA9IDA7XG5cbiAgICAgICAgbGV0IHJlY3Q6IElSZWN0O1xuXG4gICAgICAgIGxldCBsZWZ0b3Zlckhvcml6OiBudW1iZXI7XG4gICAgICAgIGxldCBsZWZ0b3ZlclZlcnQ6IG51bWJlcjtcbiAgICAgICAgbGV0IHNob3J0U2lkZUZpdDogbnVtYmVyO1xuICAgICAgICBsZXQgYXJlYUZpdDogbnVtYmVyO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJlZVJlY3RhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlY3QgPSBmcmVlUmVjdGFuZ2xlc1tpXTtcbiAgICAgICAgICAgIGFyZWFGaXQgPSByZWN0LndpZHRoICogcmVjdC5oZWlnaHQgLSB3aWR0aCAqIGhlaWdodDtcblxuICAgICAgICAgICAgLy8gVHJ5IHRvIHBsYWNlIHRoZSBSZWN0YW5nbGUgaW4gdXByaWdodCAobm9uLWZsaXBwZWQpIG9yaWVudGF0aW9uLlxuICAgICAgICAgICAgaWYgKHJlY3Qud2lkdGggPj0gd2lkdGggJiYgcmVjdC5oZWlnaHQgPj0gaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbGVmdG92ZXJIb3JpeiA9IE1hdGguYWJzKHJlY3Qud2lkdGggLSB3aWR0aCk7XG4gICAgICAgICAgICAgICAgbGVmdG92ZXJWZXJ0ID0gTWF0aC5hYnMocmVjdC5oZWlnaHQgLSBoZWlnaHQpO1xuICAgICAgICAgICAgICAgIHNob3J0U2lkZUZpdCA9IE1hdGgubWluKGxlZnRvdmVySG9yaXosIGxlZnRvdmVyVmVydCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJlYUZpdCA+IGJlc3RBcmVhRml0LnZhbHVlIHx8IChhcmVhRml0ID09PSBiZXN0QXJlYUZpdC52YWx1ZSAmJiBzaG9ydFNpZGVGaXQgPiBiZXN0U2hvcnRTaWRlRml0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgPSBzaG9ydFNpZGVGaXQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RBcmVhRml0LnZhbHVlID0gYXJlYUZpdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmFsbG93Um90YXRlICYmIHJlY3Qud2lkdGggPj0gaGVpZ2h0ICYmIHJlY3QuaGVpZ2h0ID49IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgbGVmdG92ZXJIb3JpeiA9IE1hdGguYWJzKHJlY3Qud2lkdGggLSBoZWlnaHQpO1xuICAgICAgICAgICAgICAgIGxlZnRvdmVyVmVydCA9IE1hdGguYWJzKHJlY3QuaGVpZ2h0IC0gd2lkdGgpO1xuICAgICAgICAgICAgICAgIHNob3J0U2lkZUZpdCA9IE1hdGgubWluKGxlZnRvdmVySG9yaXosIGxlZnRvdmVyVmVydCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJlYUZpdCA+IGJlc3RBcmVhRml0LnZhbHVlIHx8IChhcmVhRml0ID09PSBiZXN0QXJlYUZpdC52YWx1ZSAmJiBzaG9ydFNpZGVGaXQgPiBiZXN0U2hvcnRTaWRlRml0LnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE5vZGUuaGVpZ2h0ID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaG9ydFNpZGVGaXQudmFsdWUgPSBzaG9ydFNpZGVGaXQ7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RBcmVhRml0LnZhbHVlID0gYXJlYUZpdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBiZXN0QXJlYUZpdC52YWx1ZSA9IHRoaXMuYmluV2lkdGggKiB0aGlzLmJpbkhlaWdodCAtIGJlc3RBcmVhRml0LnZhbHVlO1xuICAgICAgICBiZXN0U2hvcnRTaWRlRml0LnZhbHVlID0gTWF0aC5taW4odGhpcy5iaW5XaWR0aCwgdGhpcy5iaW5IZWlnaHQpIC0gYmVzdFNob3J0U2lkZUZpdC52YWx1ZTtcblxuICAgICAgICByZXR1cm4gYmVzdE5vZGU7XG4gICAgfVxuXG4gICAgLy8vIFJldHVybnMgMCBpZiB0aGUgdHdvIGludGVydmFscyBpMSBhbmQgaTIgYXJlIGRpc2pvaW50LCBvciB0aGUgbGVuZ3RoIG9mIHRoZWlyIG92ZXJsYXAgb3RoZXJ3aXNlLlxuICAgIHByaXZhdGUgX2NvbW1vbkludGVydmFsTGVuZ3RoKGkxc3RhcnQ6IG51bWJlciwgaTFlbmQ6IG51bWJlciwgaTJzdGFydDogbnVtYmVyLCBpMmVuZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKGkxZW5kIDwgaTJzdGFydCB8fCBpMmVuZCA8IGkxc3RhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihpMWVuZCwgaTJlbmQpIC0gTWF0aC5tYXgoaTFzdGFydCwgaTJzdGFydCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY29udGFjdFBvaW50U2NvcmVOb2RlKHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHVzZWRSZWN0YW5nbGVzID0gdGhpcy51c2VkUmVjdGFuZ2xlcztcbiAgICAgICAgbGV0IHNjb3JlID0gMDtcblxuICAgICAgICBpZiAoeCA9PT0gMCB8fCB4ICsgd2lkdGggPT09IHRoaXMuYmluV2lkdGgpIHtcbiAgICAgICAgICAgIHNjb3JlICs9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSA9PT0gMCB8fCB5ICsgaGVpZ2h0ID09PSB0aGlzLmJpbkhlaWdodCkge1xuICAgICAgICAgICAgc2NvcmUgKz0gd2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlY3Q6IElSZWN0O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVzZWRSZWN0YW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZWN0ID0gdXNlZFJlY3RhbmdsZXNbaV07XG4gICAgICAgICAgICBpZiAocmVjdC54ID09PSB4ICsgd2lkdGggfHwgcmVjdC54ICsgcmVjdC53aWR0aCA9PT0geCkge1xuICAgICAgICAgICAgICAgIHNjb3JlICs9IHRoaXMuX2NvbW1vbkludGVydmFsTGVuZ3RoKHJlY3QueSwgcmVjdC55ICsgcmVjdC5oZWlnaHQsIHksIHkgKyBoZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlY3QueSA9PT0geSArIGhlaWdodCB8fCByZWN0LnkgKyByZWN0LmhlaWdodCA9PT0geSkge1xuICAgICAgICAgICAgICAgIHNjb3JlICs9IHRoaXMuX2NvbW1vbkludGVydmFsTGVuZ3RoKHJlY3QueCwgcmVjdC54ICsgcmVjdC53aWR0aCwgeCwgeCArIHdpZHRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcmU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZFBvc2l0aW9uRm9yTmV3Tm9kZUNvbnRhY3RQb2ludCh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgYmVzdENvbnRhY3RTY29yZTogeyB2YWx1ZTogbnVtYmVyIH0pOiBJUmVjdCB7XG4gICAgICAgIGNvbnN0IGZyZWVSZWN0YW5nbGVzID0gdGhpcy5mcmVlUmVjdGFuZ2xlcztcbiAgICAgICAgY29uc3QgYmVzdE5vZGUgPSBuZXcgUmVjdCgpO1xuXG4gICAgICAgIGJlc3RDb250YWN0U2NvcmUudmFsdWUgPSAtMTtcblxuICAgICAgICBsZXQgcmVjdDogSVJlY3Q7XG4gICAgICAgIGxldCBzY29yZTogbnVtYmVyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyZWVSZWN0YW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZWN0ID0gZnJlZVJlY3RhbmdsZXNbaV07XG4gICAgICAgICAgICAvLyBUcnkgdG8gcGxhY2UgdGhlIFJlY3RhbmdsZSBpbiB1cHJpZ2h0IChub24tZmxpcHBlZCkgb3JpZW50YXRpb24uXG4gICAgICAgICAgICBpZiAocmVjdC53aWR0aCA+PSB3aWR0aCAmJiByZWN0LmhlaWdodCA+PSBoZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBzY29yZSA9IHRoaXMuX2NvbnRhY3RQb2ludFNjb3JlTm9kZShyZWN0LngsIHJlY3QueSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3JlID4gYmVzdENvbnRhY3RTY29yZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS54ID0gcmVjdC54O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS55ID0gcmVjdC55O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgLSDkv53mjIHkuI4gSlMg54mI5pys5LiA6Ie0XG4gICAgICAgICAgICAgICAgICAgIGJlc3RDb250YWN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5hbGxvd1JvdGF0ZSAmJiByZWN0LndpZHRoID49IGhlaWdodCAmJiByZWN0LmhlaWdodCA+PSB3aWR0aCkge1xuICAgICAgICAgICAgICAgIHNjb3JlID0gdGhpcy5fY29udGFjdFBvaW50U2NvcmVOb2RlKHJlY3QueCwgcmVjdC55LCBoZWlnaHQsIHdpZHRoKTtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcmUgPiBiZXN0Q29udGFjdFNjb3JlLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnggPSByZWN0Lng7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLnkgPSByZWN0Lnk7XG4gICAgICAgICAgICAgICAgICAgIGJlc3ROb2RlLndpZHRoID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBiZXN0Tm9kZS5oZWlnaHQgPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgYmVzdENvbnRhY3RTY29yZS52YWx1ZSA9IHNjb3JlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmVzdE5vZGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc3BsaXRGcmVlTm9kZShmcmVlTm9kZTogSVJlY3QsIHVzZWROb2RlOiBJUmVjdCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBmcmVlUmVjdGFuZ2xlcyA9IHRoaXMuZnJlZVJlY3RhbmdsZXM7XG4gICAgICAgIC8vIFRlc3Qgd2l0aCBTQVQgaWYgdGhlIFJlY3RhbmdsZXMgZXZlbiBpbnRlcnNlY3QuXG4gICAgICAgIGlmICh1c2VkTm9kZS54ID49IGZyZWVOb2RlLnggKyBmcmVlTm9kZS53aWR0aCB8fCB1c2VkTm9kZS54ICsgdXNlZE5vZGUud2lkdGggPD0gZnJlZU5vZGUueCB8fFxuICAgICAgICAgICAgdXNlZE5vZGUueSA+PSBmcmVlTm9kZS55ICsgZnJlZU5vZGUuaGVpZ2h0IHx8IHVzZWROb2RlLnkgKyB1c2VkTm9kZS5oZWlnaHQgPD0gZnJlZU5vZGUueSkge1xuICAgICAgICAgICAgLy8g5rKh5pyJ55u45Lqk55qE6YOo5YiGXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5ld05vZGU6IElSZWN0O1xuXG4gICAgICAgIGlmICh1c2VkTm9kZS55ID4gZnJlZU5vZGUueSAmJiB1c2VkTm9kZS55IDwgZnJlZU5vZGUueSArIGZyZWVOb2RlLmhlaWdodCkge1xuICAgICAgICAgICAgLy8gdXNlZE5vZGUg6aG26YOo5YyF5ZCr5ZyoIGZyZWVOb2RlIOS4remXtO+8jOmCo+WwsSB1c2VkTm9kZSDkuIrovrnmi4blh7ogbmV3Tm9kZeOAglxuICAgICAgICAgICAgbmV3Tm9kZSA9IGZyZWVOb2RlLmNsb25lKCk7XG4gICAgICAgICAgICBuZXdOb2RlLmhlaWdodCA9IHVzZWROb2RlLnkgLSBmcmVlTm9kZS55O1xuICAgICAgICAgICAgZnJlZVJlY3RhbmdsZXMucHVzaChuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5ldyBub2RlIGF0IHRoZSBib3R0b20gc2lkZSBvZiB0aGUgdXNlZCBub2RlLlxuICAgICAgICBpZiAodXNlZE5vZGUueSArIHVzZWROb2RlLmhlaWdodCA8IGZyZWVOb2RlLnkgKyBmcmVlTm9kZS5oZWlnaHQpIHtcbiAgICAgICAgICAgIG5ld05vZGUgPSBmcmVlTm9kZS5jbG9uZSgpO1xuICAgICAgICAgICAgbmV3Tm9kZS55ID0gdXNlZE5vZGUueSArIHVzZWROb2RlLmhlaWdodDtcbiAgICAgICAgICAgIG5ld05vZGUuaGVpZ2h0ID0gZnJlZU5vZGUueSArIGZyZWVOb2RlLmhlaWdodCAtIG5ld05vZGUueTtcbiAgICAgICAgICAgIGZyZWVSZWN0YW5nbGVzLnB1c2gobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOZXcgbm9kZSBhdCB0aGUgbGVmdCBzaWRlIG9mIHRoZSB1c2VkIG5vZGUuXG4gICAgICAgIGlmICh1c2VkTm9kZS54ID4gZnJlZU5vZGUueCAmJiB1c2VkTm9kZS54IDwgZnJlZU5vZGUueCArIGZyZWVOb2RlLndpZHRoKSB7XG4gICAgICAgICAgICBuZXdOb2RlID0gZnJlZU5vZGUuY2xvbmUoKTtcbiAgICAgICAgICAgIG5ld05vZGUud2lkdGggPSB1c2VkTm9kZS54IC0gZnJlZU5vZGUueDtcbiAgICAgICAgICAgIGZyZWVSZWN0YW5nbGVzLnB1c2gobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOZXcgbm9kZSBhdCB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgdXNlZCBub2RlLlxuICAgICAgICBpZiAodXNlZE5vZGUueCArIHVzZWROb2RlLndpZHRoIDwgZnJlZU5vZGUueCArIGZyZWVOb2RlLndpZHRoKSB7XG4gICAgICAgICAgICBuZXdOb2RlID0gZnJlZU5vZGUuY2xvbmUoKTtcbiAgICAgICAgICAgIG5ld05vZGUueCA9IHVzZWROb2RlLnggKyB1c2VkTm9kZS53aWR0aDtcbiAgICAgICAgICAgIG5ld05vZGUud2lkdGggPSBmcmVlTm9kZS54ICsgZnJlZU5vZGUud2lkdGggLSBuZXdOb2RlLng7XG4gICAgICAgICAgICBmcmVlUmVjdGFuZ2xlcy5wdXNoKG5ld05vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcHJ1bmVGcmVlTGlzdCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZnJlZVJlY3RhbmdsZXMgPSB0aGlzLmZyZWVSZWN0YW5nbGVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyZWVSZWN0YW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBmcmVlUmVjdGFuZ2xlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChSZWN0LmlzQ29udGFpbmVkSW4oZnJlZVJlY3RhbmdsZXNbaV0sIGZyZWVSZWN0YW5nbGVzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICBmcmVlUmVjdGFuZ2xlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChSZWN0LmlzQ29udGFpbmVkSW4oZnJlZVJlY3RhbmdsZXNbal0sIGZyZWVSZWN0YW5nbGVzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBmcmVlUmVjdGFuZ2xlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgaGV1cmlzdGljcyA9IHtcbiAgICAgICAgQmVzdFNob3J0U2lkZUZpdCxcbiAgICAgICAgQmVzdExvbmdTaWRlRml0LFxuICAgICAgICBCZXN0QXJlYUZpdCxcbiAgICAgICAgQm90dG9tTGVmdFJ1bGUsXG4gICAgICAgIENvbnRhY3RQb2ludFJ1bGUsXG4gICAgICAgIExlZnRvdmVyQXJlYSxcbiAgICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBNYXhSZWN0c0JpblBhY2s7XG4iXX0=