'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.rectTransformSnapping = exports.RectTransformSnapping = exports.SnapGuidelineGroup = exports.SnapGuideline = void 0;
const cc_1 = require("cc");
const node_utils_1 = require("./node-utils");
class SnapGuideline {
    value;
    lineVertices = [];
    axis;
    checkNode;
    constructor(value, axis, vertices) {
        this.value = value;
        this.axis = axis;
        this.lineVertices = vertices;
    }
}
exports.SnapGuideline = SnapGuideline;
class SnapGuidelineGroup {
    currentGuidelines = [];
    guidelines = new Map();
    clear() {
        this.guidelines.clear();
    }
    addGuideline(guideline) {
        let guidelineArray = [];
        if (!this.guidelines.has(guideline.value)) {
            this.guidelines.set(guideline.value, guidelineArray);
        }
        else {
            guidelineArray = this.guidelines.get(guideline.value);
        }
        guidelineArray.push(guideline);
    }
    snapToGuidelines(value, snapDist) {
        const keys = this.guidelines.keys();
        if (this.guidelines.size <= 0) {
            return value;
        }
        let closestDist = Number.MAX_VALUE;
        let snapKey;
        for (const key of keys) {
            const dist = Math.abs(value - key);
            if (dist < closestDist) {
                snapKey = key;
                closestDist = dist;
            }
        }
        if (snapKey !== undefined && closestDist <= snapDist) {
            value = snapKey;
            this.currentGuidelines = this.currentGuidelines.concat(this.guidelines.get(snapKey));
        }
        return value;
    }
}
exports.SnapGuidelineGroup = SnapGuidelineGroup;
class RectTransformSnapping {
    enableSnapping = true; // 开启智能对齐(和其它节点对齐，相对间距对齐，画布对齐)
    enableGridSnapping = true; // 开启网格对齐
    snapThreshold = 4; // 吸附检测阈值
    // node snapping
    nodeSnapGuidelineGroups = [new SnapGuidelineGroup(), new SnapGuidelineGroup()];
    sidesAndMiddle = [0, 0.5, 1];
    guidelineColor = new cc_1.Color(255, 71, 0); // 通用参考线颜色
    // canvas
    canvasSnapColor = new cc_1.Color(255, 190, 75); // 和Canvas对齐的参考线颜色
    canvasSnapGuidelineGroups = [new SnapGuidelineGroup(), new SnapGuidelineGroup()];
    // equal spacing
    shapeInfos = []; // 节点的形状信息
    currentMatchMinDistInfos = []; // 满足条件的距离信息
    // grid
    gridSpacingX = 100;
    gridSpacingY = 100;
    gridColor = cc_1.Color.GRAY; // 网格颜色
    gridSnapGuidelineGroups = [new SnapGuidelineGroup(), new SnapGuidelineGroup()];
    getPureDataObject() {
        return {
            enableSnapping: this.enableSnapping,
            snapThreshold: this.snapThreshold,
        };
    }
    initFromData(data) {
        this.enableSnapping = data.enableSnapping;
        this.snapThreshold = data.snapThreshold;
    }
    lerp(from, to, ratio) {
        return from + (to - from) * ratio;
    }
    getWorldRectEx(node) {
        const bounds = (0, node_utils_1.getNodeWorldBounds)(node);
        const minPos = new cc_1.Vec3(bounds.x, bounds.y, 0);
        const maxPos = new cc_1.Vec3(bounds.x + bounds.width, bounds.y + bounds.height, 0);
        const center = new cc_1.Vec3(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, 0);
        return {
            minPos,
            maxPos,
            center,
            width: bounds.width,
            height: bounds.height,
        };
    }
    snapToGuidelinesOnAxis(guidelineGroups, value, snapDist, axis) {
        const guidelineGroup = (axis === 'x' ? guidelineGroups[0] : guidelineGroups[1]);
        return guidelineGroup.snapToGuidelines(value, snapDist);
    }
    getNodeGuidelinePos(node, axis, side) {
        const linePoints = [new cc_1.Vec3(), new cc_1.Vec3()];
        let crossAxis = 'x';
        if (axis === 'x') {
            crossAxis = 'y';
        }
        else if (axis === 'y') {
            crossAxis = 'x';
        }
        const rect = this.getWorldRectEx(node);
        const minPos = rect.minPos;
        const maxPos = rect.maxPos;
        // 设置线段的两个端点不相等的那个坐标的值
        linePoints[0][crossAxis] = minPos[crossAxis];
        linePoints[1][crossAxis] = maxPos[crossAxis];
        // 设置线段相等的那个坐标的值
        // @ts-ignore
        linePoints[0][axis] = this.lerp(minPos[axis], maxPos[axis], side);
        // @ts-ignore
        linePoints[1][axis] = linePoints[0][axis];
        return linePoints;
    }
    // side: 0->min, 1->middle, 2-> max
    getNodeSnapGuidelines(parentNode, node, axis, side) {
        const guidelines = [];
        if (parentNode) {
            // snap to siblings
            parentNode.children.forEach((child) => {
                if (child === node) {
                    return;
                }
                // 不处理size为0的情况
                const contentSize = child.getComponent(cc_1.UITransform)?.contentSize;
                if (!contentSize || contentSize.width <= 0 || contentSize.height <= 0) {
                    return;
                }
                if (side === 0) {
                    // snap min to min side
                    guidelines.push(new SnapGuideline(this.getWorldRectEx(child).minPos[axis], axis, this.getNodeGuidelinePos(child, axis, 0)));
                    // snap min to max side
                    guidelines.push(new SnapGuideline(this.getWorldRectEx(child).maxPos[axis], axis, this.getNodeGuidelinePos(child, axis, 1)));
                }
                else if (side === 1) {
                    guidelines.push(new SnapGuideline(this.getWorldRectEx(child).center[axis], axis, this.getNodeGuidelinePos(child, axis, 0.5)));
                }
                else if (side === 2) {
                    // snap max to max side
                    guidelines.push(new SnapGuideline(this.getWorldRectEx(child).maxPos[axis], axis, this.getNodeGuidelinePos(child, axis, 1)));
                    // snap max to min side
                    guidelines.push(new SnapGuideline(this.getWorldRectEx(child).minPos[axis], axis, this.getNodeGuidelinePos(child, axis, 0)));
                }
            });
        }
        return guidelines;
    }
    clearCurrentNodeGuidelines() {
        this.nodeSnapGuidelineGroups[0].currentGuidelines = [];
        this.nodeSnapGuidelineGroups[1].currentGuidelines = [];
    }
    //#region snap to other nodes
    snapToNodeGuidelinesOnAxis(value, snapDist, axis) {
        return this.snapToGuidelinesOnAxis(this.nodeSnapGuidelineGroups, value, snapDist, axis);
    }
    snapPosToNodeGuidelines(worldPos, worldSize, snapDist) {
        this.clearCurrentNodeGuidelines();
        const halfWidth = worldSize.width / 2;
        const halfHeight = worldSize.height / 2;
        // 先对齐边，再对齐中心点
        const newPos = worldPos.clone();
        // side
        newPos.x = this.snapToNodeGuidelinesOnAxis(newPos.x - halfWidth, snapDist.x, 'x') + halfWidth;
        newPos.x = this.snapToNodeGuidelinesOnAxis(newPos.x + halfWidth, snapDist.x, 'x') - halfWidth;
        newPos.y = this.snapToNodeGuidelinesOnAxis(newPos.y - halfHeight, snapDist.y, 'y') + halfHeight;
        newPos.y = this.snapToNodeGuidelinesOnAxis(newPos.y + halfHeight, snapDist.y, 'y') - halfHeight;
        // center
        newPos.x = this.snapToNodeGuidelinesOnAxis(newPos.x, snapDist.x, 'x');
        newPos.y = this.snapToNodeGuidelinesOnAxis(newPos.y, snapDist.y, 'y');
        return newPos;
    }
    snapSizeToNodeGuidelines(oriSizePos, deltaSize, snapDist) {
        this.clearCurrentNodeGuidelines();
        if (deltaSize.x !== 0) {
            deltaSize.x = this.snapToNodeGuidelinesOnAxis(oriSizePos.x + deltaSize.x, snapDist.x, 'x') - oriSizePos.x;
        }
        if (deltaSize.y !== 0) {
            deltaSize.y = this.snapToNodeGuidelinesOnAxis(oriSizePos.y + deltaSize.y, snapDist.y, 'y') - oriSizePos.y;
        }
        return deltaSize;
    }
    calculateNodeSnapGuidelines(parentNode, node) {
        for (let i = 0; i < 2; i++) {
            this.nodeSnapGuidelineGroups[i].clear();
        }
        if (!parentNode) {
            return;
        }
        let guidelines = [];
        const axisName = ['x', 'y'];
        for (let axis = 0; axis < 2; axis++) {
            for (let side = 0; side < this.sidesAndMiddle.length; side++) {
                guidelines = this.getNodeSnapGuidelines(parentNode, node, axisName[axis], side);
                guidelines.forEach((guideline) => {
                    guideline.checkNode = node;
                    this.nodeSnapGuidelineGroups[axis].addGuideline(guideline);
                });
            }
        }
    }
    // #endregion snap to other nodes
    generateWorldRect(worldPos, worldSize) {
        const halfWidth = worldSize.width / 2;
        const halfHeight = worldSize.height / 2;
        return {
            minPos: new cc_1.Vec3(worldPos.x - halfWidth, worldPos.y - halfHeight, worldPos.z),
            maxPos: new cc_1.Vec3(worldPos.x + halfWidth, worldPos.y + halfHeight, worldPos.z),
            center: worldPos,
            width: worldSize.width,
            height: worldSize.height,
        };
    }
    //#region snap to equal spacing
    checkEqualSpacingOnSide(checkDistInfo, side, snapValue) {
        const sideDistInfos = checkDistInfo[side];
        if (!sideDistInfos || sideDistInfos.length <= 0) {
            return null;
        }
        const matchSideDistInfos = [];
        const sideMinDistInfo = sideDistInfos[0];
        const checkDist = sideMinDistInfo.minDist;
        const sideTarget = sideMinDistInfo.targetShapeInfo;
        const sideDistArrayOfSideTarget = sideTarget?.distInfo[side];
        let matchDist = -1;
        let deltaDist = 0;
        let matchDeltaDist = 0;
        if (sideDistArrayOfSideTarget && sideDistArrayOfSideTarget.length > 0) {
            sideDistArrayOfSideTarget.forEach((info) => {
                deltaDist = info.minDist - checkDist;
                if (Math.abs(deltaDist) <= snapValue) {
                    matchDeltaDist = deltaDist;
                    matchDist = info.minDist;
                    matchSideDistInfos.push(info);
                }
            });
        }
        if (matchDist > 0) {
            // 检测右边和下边时，需要变换符号，才能正确更新位置
            if (side === 'right' || side === 'top') {
                matchDeltaDist = -matchDeltaDist;
            }
            return {
                matchDist,
                matchDeltaDist,
                sideMinDistShapeInfo: sideTarget, // 和检测节点最近的元素数据
                matchSideDistInfos, // 这里存的是下一级的距离数据，和检测节点最近的那个没有存储在这里，因为snap后要重新算一下位置
            };
        }
    }
    checkEqualSpacingOnAxis(distInfo, value, axis, snapValue) {
        let matchDistInfos = [];
        const matchShapeInfos = [];
        let sides = [];
        if (axis === 'x') {
            sides = ['left', 'right'];
        }
        else if (axis === 'y') {
            sides = ['top', 'bottom'];
        }
        let isHit = false;
        let newValue = 0;
        sides.forEach((side) => {
            const checkResult = this.checkEqualSpacingOnSide(distInfo, side, snapValue);
            if (checkResult) {
                isHit = true;
                newValue = value + checkResult.matchDeltaDist;
                // 暂时只支持单边
                matchDistInfos = checkResult.matchSideDistInfos;
                matchShapeInfos.push(checkResult.sideMinDistShapeInfo);
            }
        });
        if (!isHit) {
            const sideA = distInfo[sides[0]];
            const sideB = distInfo[sides[1]];
            const sideMinDistInfoA = sideA[0];
            const sideMinDistInfoB = sideB[0];
            if (sideMinDistInfoA && sideMinDistInfoB) {
                // 暂时只处理anchor在中心点的情况
                const middlePosOnAxis = (sideMinDistInfoA.minDistPosA[axis] + sideMinDistInfoB.minDistPosB[axis]) / 2;
                const posDiff = Math.abs(value - middlePosOnAxis);
                if (posDiff <= snapValue) {
                    newValue = middlePosOnAxis;
                    isHit = true;
                    matchShapeInfos.push(sideMinDistInfoA.targetShapeInfo, sideMinDistInfoB.targetShapeInfo);
                }
            }
        }
        if (isHit) {
            return {
                newValue,
                matchDistInfos,
                matchShapeInfos,
            };
        }
        return null;
    }
    snapPosToEqualSpacing(worldPos, worldSize, snapDist) {
        this.currentMatchMinDistInfos = [];
        const checkWorldRect = this.generateWorldRect(worldPos, worldSize);
        const checkShapeInfo = this.generateShapeInfo(checkWorldRect);
        for (let i = 0; i < this.shapeInfos.length; i++) {
            const info = this.shapeInfos[i];
            const { distInfoA } = this.gatherDistInfo(checkShapeInfo, info);
            this.concatDistInfo(checkShapeInfo.distInfo, distInfoA);
        }
        const newPos = worldPos.clone();
        const distInfo = checkShapeInfo.distInfo;
        function sortByDist(a, b) {
            return a.minDist - b.minDist;
        }
        const matchShapeInfos = []; // 和当前检测节点满足节点的元素，为了最后再算一下距离位置
        const left = distInfo.left;
        const right = distInfo.right;
        const top = distInfo.top;
        const bottom = distInfo.bottom;
        // check x equal spacing
        if (left.length > 0 || right.length > 0) {
            left.sort(sortByDist);
            right.sort(sortByDist);
            const checkResult = this.checkEqualSpacingOnAxis(distInfo, newPos.x, 'x', snapDist.x);
            if (checkResult) {
                newPos.x = checkResult.newValue;
                this.currentMatchMinDistInfos.push(...checkResult.matchDistInfos);
                matchShapeInfos.push(...checkResult.matchShapeInfos);
            }
        }
        // check y equal spacing
        if (top.length > 0 && bottom.length > 0) {
            top.sort(sortByDist);
            bottom.sort(sortByDist);
            const checkResult = this.checkEqualSpacingOnAxis(distInfo, newPos.y, 'y', snapDist.y);
            if (checkResult) {
                newPos.y = checkResult.newValue;
                this.currentMatchMinDistInfos.push(...checkResult.matchDistInfos);
                matchShapeInfos.push(...checkResult.matchShapeInfos);
            }
        }
        const newCheckWorldRect = this.generateWorldRect(newPos, worldSize);
        matchShapeInfos.forEach((shapeInfo) => {
            if (!shapeInfo) {
                return;
            }
            const distInfoResult = this.getDistInfoOfRect(newCheckWorldRect, shapeInfo.worldRect);
            if (distInfoResult) {
                this.currentMatchMinDistInfos.push(distInfoResult);
            }
        });
        return newPos;
    }
    calculateSpacingSnapGuidelines(parentNode, node) {
        const shapeInfos = this.gatherShapeInfos(parentNode, node);
        if (!shapeInfos) {
            return;
        }
        for (let i = 0; i < shapeInfos.length - 1; i++) {
            const infoA = shapeInfos[i];
            for (let j = i; j < shapeInfos.length; j++) {
                const infoB = shapeInfos[j];
                const { distInfoA, distInfoB } = this.gatherDistInfo(infoA, infoB);
                this.concatDistInfo(infoA.distInfo, distInfoA);
                this.concatDistInfo(infoB.distInfo, distInfoB);
            }
        }
        this.shapeInfos = shapeInfos;
    }
    gatherDistInfo(infoA, infoB) {
        const rectA = infoA.worldRect;
        const rectB = infoB.worldRect;
        const distInfoA = {
            left: [],
            right: [],
            top: [],
            bottom: [],
        };
        const distInfoB = {
            left: [],
            right: [],
            top: [],
            bottom: [],
        };
        const distInfo = this.getDistInfoOfRect(rectA, rectB);
        if (distInfo) {
            const distToBInfo = Object.assign({ targetShapeInfo: infoB }, distInfo);
            const distToAInfo = Object.assign({ targetShapeInfo: infoA }, distInfo);
            if (distInfo.axis === 'x') {
                if (rectA.center.x > rectB.center.x) {
                    distInfoA.left.push(distToBInfo);
                    distInfoB.right.push(distToAInfo);
                }
                else {
                    distInfoA.right.push(distToBInfo);
                    distInfoB.left.push(distToAInfo);
                }
            }
            else if (distInfo.axis === 'y') {
                if (rectA.center.y > rectB.center.y) {
                    distInfoA.bottom.push(distToBInfo);
                    distInfoB.top.push(distToAInfo);
                }
                else {
                    distInfoA.top.push(distToBInfo);
                    distInfoB.bottom.push(distToAInfo);
                }
            }
        }
        return {
            distInfoA,
            distInfoB,
        };
    }
    concatDistInfo(dstDistInfo, srcDistInfo) {
        dstDistInfo.left = dstDistInfo.left.concat(srcDistInfo.left);
        dstDistInfo.right = dstDistInfo.right.concat(srcDistInfo.right);
        dstDistInfo.top = dstDistInfo.top.concat(srcDistInfo.top);
        dstDistInfo.bottom = dstDistInfo.bottom.concat(srcDistInfo.bottom);
    }
    gatherShapeInfos(parentNode, node) {
        const shapeInfos = [];
        if (!parentNode) {
            return null;
        }
        parentNode.children.forEach((child) => {
            if (child === node) {
                return;
            }
            // 不处理size为0的情况
            const contentSize = child.getComponent(cc_1.UITransform)?.contentSize;
            if (!contentSize || contentSize.width <= 0 || contentSize.height <= 0) {
                return;
            }
            const worldRect = this.getWorldRectEx(child);
            shapeInfos.push(this.generateShapeInfo(worldRect));
        });
        return shapeInfos;
    }
    generateShapeInfo(worldRect) {
        return {
            worldRect,
            distInfo: {
                left: [],
                right: [],
                top: [],
                bottom: [],
            },
        };
    }
    getDistInfoOfRect(rectA, rectB) {
        let minDist = -1;
        let minDistPosA;
        let minDistPosB;
        let axis = 'x';
        const centerA = rectA.center;
        const centerB = rectB.center;
        const dx = Math.abs(centerA.x - centerB.x);
        const dy = Math.abs(centerA.y - centerB.y);
        function compareNumber(a, b) {
            return a - b;
        }
        // 两个矩形不相交，在X坐标上有重叠，最短距离为上矩形的下边和下面形的上边的距离
        if ((dx < ((rectA.width + rectB.width) / 2)) && (dy >= ((rectA.height + rectB.height) / 2))) {
            minDist = dy - ((rectA.height + rectB.height) / 2);
            let upRect = rectA;
            let downRect = rectB;
            if (centerA.y < centerB.y) {
                upRect = rectB;
                downRect = rectA;
            }
            // 找重叠X坐标
            const xSides = [upRect.minPos.x, upRect.minPos.x + upRect.width, downRect.maxPos.x, downRect.maxPos.x - downRect.width];
            xSides.sort(compareNumber);
            const middleX = (xSides[1] + xSides[2]) / 2;
            minDistPosA = new cc_1.Vec3(middleX, upRect.minPos.y, 0);
            minDistPosB = new cc_1.Vec3(middleX, downRect.maxPos.y, 0);
            axis = 'y';
        }
        else if ((dx >= ((rectA.width + rectB.width) / 2)) && (dy < ((rectA.height + rectB.height) / 2))) {
            // 两个矩形不相交，在Y坐标上有重叠，最短距离为左矩形的右边和右矩形的左边的距离
            minDist = dx - ((rectA.width + rectB.width) / 2);
            let leftRect = rectA;
            let rightRect = rectB;
            if (centerA.x > centerB.x) {
                leftRect = rectB;
                rightRect = rectA;
            }
            // 找重叠Y坐标
            const ySides = [leftRect.maxPos.y, leftRect.maxPos.y - leftRect.height, rightRect.minPos.y, rightRect.minPos.y + rightRect.height];
            ySides.sort(compareNumber);
            const middleY = (ySides[1] + ySides[2]) / 2;
            minDistPosA = new cc_1.Vec3(leftRect.maxPos.x, middleY, 0);
            minDistPosB = new cc_1.Vec3(rightRect.minPos.x, middleY, 0);
            axis = 'x';
        }
        if (minDist > 0) {
            // minDistPos为从左到右，或从上到下的线段的两个端点
            return {
                minDist,
                minDistPosA: minDistPosA,
                minDistPosB: minDistPosB,
                axis,
            };
        }
        else {
            return null;
        }
    }
    //#endregion snap to equal spacing
    //#region grid snapping
    calculateGridSnapGuidelines() {
        const size = cc.engine.getDesignResolutionSize();
        // x
        for (let i = 0; i < size.width; i += this.gridSpacingX) {
            const lineStartPos = new cc_1.Vec2(i, 0);
            const lineEndPos = new cc_1.Vec2(i, size.height);
            const xGuideline = new SnapGuideline(i, 'x', [lineStartPos, lineEndPos]);
            this.gridSnapGuidelineGroups[0].addGuideline(xGuideline);
        }
        // y
        for (let i = 0; i < size.height; i += this.gridSpacingY) {
            const lineStartPos = new cc_1.Vec2(0, i);
            const lineEndPos = new cc_1.Vec2(size.width, i);
            const yGuideline = new SnapGuideline(i, 'y', [lineStartPos, lineEndPos]);
            this.gridSnapGuidelineGroups[1].addGuideline(yGuideline);
        }
    }
    clearCurrentGridGuidelines() {
        this.gridSnapGuidelineGroups[0].currentGuidelines = [];
        this.gridSnapGuidelineGroups[1].currentGuidelines = [];
    }
    snapToGridGuidelinesOnAxis(value, snapDist, axis) {
        return this.snapToGuidelinesOnAxis(this.gridSnapGuidelineGroups, value, snapDist, axis);
    }
    snapPosToGridSnapGuidelines(worldPos, worldSize, snapDist) {
        this.clearCurrentGridGuidelines();
        const halfWidth = worldSize.width / 2;
        const halfHeight = worldSize.height / 2;
        // 只对齐边
        const newPos = worldPos.clone();
        // side
        newPos.x = this.snapToGridGuidelinesOnAxis(newPos.x - halfWidth, snapDist.x, 'x') + halfWidth;
        newPos.x = this.snapToGridGuidelinesOnAxis(newPos.x + halfWidth, snapDist.x, 'x') - halfWidth;
        newPos.y = this.snapToGridGuidelinesOnAxis(newPos.y - halfHeight, snapDist.y, 'y') + halfHeight;
        newPos.y = this.snapToGridGuidelinesOnAxis(newPos.y + halfHeight, snapDist.y, 'y') - halfHeight;
        return newPos;
    }
    snapSizeToGridGuidelines(oriSizePos, deltaSize, snapDist) {
        this.clearCurrentGridGuidelines();
        if (deltaSize.x !== 0) {
            deltaSize.x = this.snapToGridGuidelinesOnAxis(oriSizePos.x + deltaSize.x, snapDist.x, 'x') - oriSizePos.x;
        }
        if (deltaSize.y !== 0) {
            deltaSize.y = this.snapToGridGuidelinesOnAxis(oriSizePos.y + deltaSize.y, snapDist.y, 'y') - oriSizePos.y;
        }
        return deltaSize;
    }
    //#endregion grid snapping
    //#region canvas snapping
    calculateCanvasSnapGuidelines() {
        const size = cc.view.getDesignResolutionSize();
        const left = 0;
        const middleX = size.width / 2;
        const right = size.width;
        const bottom = 0;
        const middleY = size.height / 2;
        const top = size.height;
        // x
        const xAxis = [left, middleX, right];
        xAxis.forEach((x) => {
            this.canvasSnapGuidelineGroups[0].addGuideline(new SnapGuideline(x, 'x', [new cc_1.Vec3(x, 0), new cc_1.Vec3(x, size.height)]));
        });
        // y
        const yAxis = [bottom, middleY, top];
        yAxis.forEach((y) => {
            this.canvasSnapGuidelineGroups[1].addGuideline(new SnapGuideline(y, 'x', [new cc_1.Vec3(0, y), new cc_1.Vec3(size.width, y)]));
        });
    }
    clearCurrentCanvasGuidelines() {
        this.canvasSnapGuidelineGroups[0].currentGuidelines = [];
        this.canvasSnapGuidelineGroups[1].currentGuidelines = [];
    }
    snapToCanvasSnapGuidelinesOnAxis(value, snapDist, axis) {
        return this.snapToGuidelinesOnAxis(this.canvasSnapGuidelineGroups, value, snapDist, axis);
    }
    snapPosToCanvasSnapGuidelines(worldPos, worldSize, snapDist) {
        this.clearCurrentCanvasGuidelines();
        const halfWidth = worldSize.width / 2;
        const halfHeight = worldSize.height / 2;
        // 先对齐边，再对齐中心点
        const newPos = worldPos.clone();
        // side
        newPos.x = this.snapToCanvasSnapGuidelinesOnAxis(newPos.x - halfWidth, snapDist.x, 'x') + halfWidth;
        newPos.x = this.snapToCanvasSnapGuidelinesOnAxis(newPos.x + halfWidth, snapDist.x, 'x') - halfWidth;
        newPos.y = this.snapToCanvasSnapGuidelinesOnAxis(newPos.y - halfHeight, snapDist.y, 'y') + halfHeight;
        newPos.y = this.snapToCanvasSnapGuidelinesOnAxis(newPos.y + halfHeight, snapDist.y, 'y') - halfHeight;
        // center
        newPos.x = this.snapToCanvasSnapGuidelinesOnAxis(newPos.x, snapDist.x, 'x');
        newPos.y = this.snapToCanvasSnapGuidelinesOnAxis(newPos.y, snapDist.y, 'y');
        return newPos;
    }
}
exports.RectTransformSnapping = RectTransformSnapping;
const rectTransformSnapping = new RectTransformSnapping();
exports.rectTransformSnapping = rectTransformSnapping;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjdC10cmFuc2Zvcm0tc25hcHBpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vdXRpbHMvcmVjdC10cmFuc2Zvcm0tc25hcHBpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBZ0U7QUFDaEUsNkNBQWtEO0FBcUNsRCxNQUFNLGFBQWE7SUFDZixLQUFLLENBQUM7SUFDTixZQUFZLEdBQVcsRUFBRSxDQUFDO0lBQzFCLElBQUksQ0FBYztJQUNsQixTQUFTLENBQVE7SUFFakIsWUFBWSxLQUFhLEVBQUUsSUFBaUIsRUFBRSxRQUFnQjtRQUMxRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztJQUNqQyxDQUFDO0NBQ0o7QUFvc0JHLHNDQUFhO0FBbHNCakIsTUFBTSxrQkFBa0I7SUFDcEIsaUJBQWlCLEdBQW9CLEVBQUUsQ0FBQztJQUN4QyxVQUFVLEdBQWlDLElBQUksR0FBRyxFQUFFLENBQUM7SUFFckQsS0FBSztRQUNELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELFlBQVksQ0FBQyxTQUF3QjtRQUNqQyxJQUFJLGNBQWMsR0FBb0IsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3pELENBQUM7YUFBTSxDQUFDO1lBQ0osY0FBYyxHQUFHLElBQUksQ0FBQyxV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Q0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNwRyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNwRyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQztRQUN0RyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQztRQUV0RyxTQUFTO1FBQ1QsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU1RSxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBR0o7QUFPRyxzREFBcUI7QUFMekIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUM7QUFPdEQsc0RBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDb2xvciwgTm9kZSwgU2l6ZSwgVUlUcmFuc2Zvcm0sIFZlYzIsIFZlYzMgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBnZXROb2RlV29ybGRCb3VuZHMgfSBmcm9tICcuL25vZGUtdXRpbHMnO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5cbmludGVyZmFjZSBJV29ybGRSZWN0IHtcbiAgICBtaW5Qb3M6IFZlYzM7XG4gICAgbWF4UG9zOiBWZWMzO1xuICAgIGNlbnRlcjogVmVjMztcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSURpc3RhbmNlSW5mbyB7XG4gICAgbGVmdDogSVJlY3REaXN0SW5mb1tdOyAvLyDorrDlvZXlhYPntKDlt6bovrnkuI7lhbblroPlhYPntKDnmoTmiYDmnInot53nprtcbiAgICByaWdodDogSVJlY3REaXN0SW5mb1tdOyAvLyDorrDlvZXlhYPntKDlj7PovrnkuI7lhbblroPlhYPntKDnmoTmiYDmnInot53nprtcbiAgICB0b3A6IElSZWN0RGlzdEluZm9bXTsgLy8g6K6w5b2V5YWD57Sg5LiK6L655LiO5YW25a6D5YWD57Sg55qE5omA5pyJ6Led56a7XG4gICAgYm90dG9tOiBJUmVjdERpc3RJbmZvW107IC8vIOiusOW9leWFg+e0oOS4i+i+ueS4juWFtuWug+WFg+e0oOeahOaJgOaciei3neemu1xufVxuXG5pbnRlcmZhY2UgSVNoYXBlSW5mbyB7XG4gICAgd29ybGRSZWN0OiBJV29ybGRSZWN0O1xuICAgIGRpc3RJbmZvOiBJRGlzdGFuY2VJbmZvO1xufVxuXG5pbnRlcmZhY2UgSVJlY3REaXN0SW5mbyB7XG4gICAgbWluRGlzdDogbnVtYmVyO1xuICAgIG1pbkRpc3RQb3NBOiBWZWMzO1xuICAgIG1pbkRpc3RQb3NCOiBWZWMzO1xuICAgIGF4aXM6IHN0cmluZztcbiAgICB0YXJnZXRTaGFwZUluZm8/OiBJU2hhcGVJbmZvO1xufVxuXG5pbnRlcmZhY2UgSVJlY3RTbmFwQ29uZmlnRGF0YSB7XG4gICAgZW5hYmxlU25hcHBpbmc6IGJvb2xlYW47XG4gICAgc25hcFRocmVzaG9sZDogbnVtYmVyO1xufVxuXG5jbGFzcyBTbmFwR3VpZGVsaW5lIHtcbiAgICB2YWx1ZTtcbiAgICBsaW5lVmVydGljZXM6IFZlYzNbXSA9IFtdO1xuICAgIGF4aXM6IGtleW9mKFZlYzMpO1xuICAgIGNoZWNrTm9kZT86IE5vZGU7XG5cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogbnVtYmVyLCBheGlzOiBrZXlvZihWZWMzKSwgdmVydGljZXM6IFZlYzNbXSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYXhpcyA9IGF4aXM7XG4gICAgICAgIHRoaXMubGluZVZlcnRpY2VzID0gdmVydGljZXM7XG4gICAgfVxufVxuXG5jbGFzcyBTbmFwR3VpZGVsaW5lR3JvdXAge1xuICAgIGN1cnJlbnRHdWlkZWxpbmVzOiBTbmFwR3VpZGVsaW5lW10gPSBbXTtcbiAgICBndWlkZWxpbmVzOiBNYXA8bnVtYmVyLCBTbmFwR3VpZGVsaW5lW10+ID0gbmV3IE1hcCgpO1xuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZ3VpZGVsaW5lcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGFkZEd1aWRlbGluZShndWlkZWxpbmU6IFNuYXBHdWlkZWxpbmUpIHtcbiAgICAgICAgbGV0IGd1aWRlbGluZUFycmF5OiBTbmFwR3VpZGVsaW5lW10gPSBbXTtcbiAgICAgICAgaWYgKCF0aGlzLmd1aWRlbGluZXMuaGFzKGd1aWRlbGluZS52YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZ3VpZGVsaW5lcy5zZXQoZ3VpZGVsaW5lLnZhbHVlLCBndWlkZWxpbmVBcnJheSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBndWlkZWxpbmVBcnJheSA9IHRoaXMuZ3VpZGVsaW5lcy5nZXQoZ3VpZGVsaW5lLnZhbHVlKSE7XG4gICAgICAgIH1cblxuICAgICAgICBndWlkZWxpbmVBcnJheS5wdXNoKGd1aWRlbGluZSk7XG4gICAgfVxuXG4gICAgc25hcFRvR3VpZGVsaW5lcyh2YWx1ZTogbnVtYmVyLCBzbmFwRGlzdDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGtleXM6IEl0ZXJhYmxlSXRlcmF0b3I8bnVtYmVyPiA9IHRoaXMuZ3VpZGVsaW5lcy5rZXlzKCk7XG4gICAgICAgIGlmICh0aGlzLmd1aWRlbGluZXMuc2l6ZSA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2xvc2VzdERpc3QgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICBsZXQgc25hcEtleTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgY29uc3QgZGlzdCA9IE1hdGguYWJzKHZhbHVlIC0ga2V5KTtcbiAgICAgICAgICAgIGlmIChkaXN0IDwgY2xvc2VzdERpc3QpIHtcbiAgICAgICAgICAgICAgICBzbmFwS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGNsb3Nlc3REaXN0ID0gZGlzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmFwS2V5ICE9PSB1bmRlZmluZWQgJiYgY2xvc2VzdERpc3QgPD0gc25hcERpc3QpIHtcbiAgICAgICAgICAgIHZhbHVlID0gc25hcEtleTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEd1aWRlbGluZXMgPSB0aGlzLmN1cnJlbnRHdWlkZWxpbmVzLmNvbmNhdCh0aGlzLmd1aWRlbGluZXMuZ2V0KHNuYXBLZXkpISk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufVxuXG5jbGFzcyBSZWN0VHJhbnNmb3JtU25hcHBpbmcgaW1wbGVtZW50cyBJUmVjdFNuYXBDb25maWdEYXRhIHtcbiAgICBlbmFibGVTbmFwcGluZyA9IHRydWU7IC8vIOW8gOWQr+aZuuiDveWvuem9kCjlkozlhbblroPoioLngrnlr7npvZDvvIznm7jlr7npl7Tot53lr7npvZDvvIznlLvluIPlr7npvZApXG4gICAgZW5hYmxlR3JpZFNuYXBwaW5nID0gdHJ1ZTsgLy8g5byA5ZCv572R5qC85a+56b2QXG4gICAgc25hcFRocmVzaG9sZCA9IDQ7IC8vIOWQuOmZhOajgOa1i+mYiOWAvFxuICAgIC8vIG5vZGUgc25hcHBpbmdcbiAgICBub2RlU25hcEd1aWRlbGluZUdyb3VwcyA9IFtuZXcgU25hcEd1aWRlbGluZUdyb3VwKCksIG5ldyBTbmFwR3VpZGVsaW5lR3JvdXAoKV07XG4gICAgc2lkZXNBbmRNaWRkbGUgPSBbMCwgMC41LCAxXTtcbiAgICBndWlkZWxpbmVDb2xvciA9IG5ldyBDb2xvcigyNTUsIDcxLCAwKTsgLy8g6YCa55So5Y+C6ICD57q/6aKc6ImyXG5cbiAgICAvLyBjYW52YXNcbiAgICBjYW52YXNTbmFwQ29sb3IgPSBuZXcgQ29sb3IoMjU1LCAxOTAsIDc1KTsgLy8g5ZKMQ2FudmFz5a+56b2Q55qE5Y+C6ICD57q/6aKc6ImyXG4gICAgY2FudmFzU25hcEd1aWRlbGluZUdyb3VwcyA9IFtuZXcgU25hcEd1aWRlbGluZUdyb3VwKCksIG5ldyBTbmFwR3VpZGVsaW5lR3JvdXAoKV07XG5cbiAgICAvLyBlcXVhbCBzcGFjaW5nXG4gICAgc2hhcGVJbmZvczogSVNoYXBlSW5mb1tdID0gW107IC8vIOiKgueCueeahOW9oueKtuS/oeaBr1xuICAgIGN1cnJlbnRNYXRjaE1pbkRpc3RJbmZvczogSVJlY3REaXN0SW5mb1tdID0gW107IC8vIOa7oei2s+adoeS7tueahOi3neemu+S/oeaBr1xuXG4gICAgLy8gZ3JpZFxuICAgIGdyaWRTcGFjaW5nWCA9IDEwMDtcbiAgICBncmlkU3BhY2luZ1kgPSAxMDA7XG4gICAgZ3JpZENvbG9yID0gQ29sb3IuR1JBWTsgLy8g572R5qC86aKc6ImyXG4gICAgZ3JpZFNuYXBHdWlkZWxpbmVHcm91cHMgPSBbbmV3IFNuYXBHdWlkZWxpbmVHcm91cCgpLCBuZXcgU25hcEd1aWRlbGluZUdyb3VwKCldO1xuXG4gICAgcHVibGljIGdldFB1cmVEYXRhT2JqZWN0KCk6IElSZWN0U25hcENvbmZpZ0RhdGEge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW5hYmxlU25hcHBpbmc6IHRoaXMuZW5hYmxlU25hcHBpbmcsXG4gICAgICAgICAgICBzbmFwVGhyZXNob2xkOiB0aGlzLnNuYXBUaHJlc2hvbGQsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGluaXRGcm9tRGF0YShkYXRhOiBJUmVjdFNuYXBDb25maWdEYXRhKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlU25hcHBpbmcgPSBkYXRhLmVuYWJsZVNuYXBwaW5nO1xuICAgICAgICB0aGlzLnNuYXBUaHJlc2hvbGQgPSBkYXRhLnNuYXBUaHJlc2hvbGQ7XG4gICAgfVxuXG4gICAgbGVycChmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIsIHJhdGlvOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZyb20gKyAodG8gLSBmcm9tKSAqIHJhdGlvO1xuICAgIH1cblxuICAgIGdldFdvcmxkUmVjdEV4KG5vZGU6IE5vZGUpOiBJV29ybGRSZWN0IHtcbiAgICAgICAgY29uc3QgYm91bmRzID0gZ2V0Tm9kZVdvcmxkQm91bmRzKG5vZGUpO1xuXG4gICAgICAgIGNvbnN0IG1pblBvcyA9IG5ldyBWZWMzKGJvdW5kcy54LCBib3VuZHMueSwgMCk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKGJvdW5kcy54ICsgYm91bmRzLndpZHRoLCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQsIDApO1xuICAgICAgICBjb25zdCBjZW50ZXIgPSBuZXcgVmVjMyhib3VuZHMueCArIGJvdW5kcy53aWR0aCAvIDIsIGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCAvIDIsIDApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluUG9zLFxuICAgICAgICAgICAgbWF4UG9zLFxuICAgICAgICAgICAgY2VudGVyLFxuICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzbmFwVG9HdWlkZWxpbmVzT25BeGlzKGd1aWRlbGluZUdyb3VwczogU25hcEd1aWRlbGluZUdyb3VwW10sIHZhbHVlOiBudW1iZXIsIHNuYXBEaXN0OiBudW1iZXIsIGF4aXM6IHN0cmluZykge1xuICAgICAgICBjb25zdCBndWlkZWxpbmVHcm91cCA9IChheGlzID09PSAneCcgPyBndWlkZWxpbmVHcm91cHNbMF0gOiBndWlkZWxpbmVHcm91cHNbMV0pO1xuXG4gICAgICAgIHJldHVybiBndWlkZWxpbmVHcm91cC5zbmFwVG9HdWlkZWxpbmVzKHZhbHVlLCBzbmFwRGlzdCk7XG4gICAgfVxuXG4gICAgZ2V0Tm9kZUd1aWRlbGluZVBvcyhub2RlOiBOb2RlLCBheGlzOiBrZXlvZihWZWMzKSwgc2lkZTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGxpbmVQb2ludHM6IFZlYzNbXSA9IFtuZXcgVmVjMygpLCBuZXcgVmVjMygpXTtcblxuICAgICAgICBsZXQgY3Jvc3NBeGlzOiBrZXlvZihWZWMzKSA9ICd4JztcbiAgICAgICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgICAgICAgY3Jvc3NBeGlzID0gJ3knO1xuICAgICAgICB9IGVsc2UgaWYgKGF4aXMgPT09ICd5Jykge1xuICAgICAgICAgICAgY3Jvc3NBeGlzID0gJ3gnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuZ2V0V29ybGRSZWN0RXgobm9kZSk7XG4gICAgICAgIGNvbnN0IG1pblBvcyA9IHJlY3QubWluUG9zO1xuICAgICAgICBjb25zdCBtYXhQb3MgPSByZWN0Lm1heFBvcztcblxuICAgICAgICAvLyDorr7nva7nur/mrrXnmoTkuKTkuKrnq6/ngrnkuI3nm7jnrYnnmoTpgqPkuKrlnZDmoIfnmoTlgLxcbiAgICAgICAgbGluZVBvaW50c1swXVtjcm9zc0F4aXNdID0gbWluUG9zW2Nyb3NzQXhpc107XG4gICAgICAgIGxpbmVQb2ludHNbMV1bY3Jvc3NBeGlzXSA9IG1heFBvc1tjcm9zc0F4aXNdO1xuXG4gICAgICAgIC8vIOiuvue9rue6v+auteebuOetieeahOmCo+S4quWdkOagh+eahOWAvFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGxpbmVQb2ludHNbMF1bYXhpc10gPSB0aGlzLmxlcnAobWluUG9zW2F4aXNdLCBtYXhQb3NbYXhpc10sIHNpZGUpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGxpbmVQb2ludHNbMV1bYXhpc10gPSBsaW5lUG9pbnRzWzBdW2F4aXNdO1xuXG4gICAgICAgIHJldHVybiBsaW5lUG9pbnRzO1xuICAgIH1cblxuICAgIC8vIHNpZGU6IDAtPm1pbiwgMS0+bWlkZGxlLCAyLT4gbWF4XG4gICAgZ2V0Tm9kZVNuYXBHdWlkZWxpbmVzKHBhcmVudE5vZGU6IE5vZGUsIG5vZGU6IE5vZGUsIGF4aXM6IGtleW9mKFZlYzMpLCBzaWRlOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZ3VpZGVsaW5lczogU25hcEd1aWRlbGluZVtdID0gW107XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIC8vIHNuYXAgdG8gc2libGluZ3NcbiAgICAgICAgICAgIHBhcmVudE5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPT09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOS4jeWkhOeQhnNpemXkuLow55qE5oOF5Ya1XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudFNpemUgPSBjaGlsZC5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pPy5jb250ZW50U2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRTaXplIHx8IGNvbnRlbnRTaXplLndpZHRoIDw9IDAgfHwgY29udGVudFNpemUuaGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzaWRlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNuYXAgbWluIHRvIG1pbiBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGd1aWRlbGluZXMucHVzaChuZXcgU25hcEd1aWRlbGluZSh0aGlzLmdldFdvcmxkUmVjdEV4KGNoaWxkKS5taW5Qb3NbYXhpc10gYXMgbnVtYmVyLCBheGlzLCB0aGlzLmdldE5vZGVHdWlkZWxpbmVQb3MoY2hpbGQsIGF4aXMsIDApKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc25hcCBtaW4gdG8gbWF4IHNpZGVcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVsaW5lcy5wdXNoKG5ldyBTbmFwR3VpZGVsaW5lKHRoaXMuZ2V0V29ybGRSZWN0RXgoY2hpbGQpLm1heFBvc1theGlzXSBhcyBudW1iZXIsIGF4aXMsIHRoaXMuZ2V0Tm9kZUd1aWRlbGluZVBvcyhjaGlsZCwgYXhpcywgMSkpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpZGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVsaW5lcy5wdXNoKG5ldyBTbmFwR3VpZGVsaW5lKHRoaXMuZ2V0V29ybGRSZWN0RXgoY2hpbGQpLmNlbnRlcltheGlzXSBhcyBudW1iZXIsIGF4aXMsIHRoaXMuZ2V0Tm9kZUd1aWRlbGluZVBvcyhjaGlsZCwgYXhpcywgMC41KSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2lkZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBzbmFwIG1heCB0byBtYXggc2lkZVxuICAgICAgICAgICAgICAgICAgICBndWlkZWxpbmVzLnB1c2gobmV3IFNuYXBHdWlkZWxpbmUodGhpcy5nZXRXb3JsZFJlY3RFeChjaGlsZCkubWF4UG9zW2F4aXNdIGFzIG51bWJlciwgYXhpcywgdGhpcy5nZXROb2RlR3VpZGVsaW5lUG9zKGNoaWxkLCBheGlzLCAxKSkpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNuYXAgbWF4IHRvIG1pbiBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGd1aWRlbGluZXMucHVzaChuZXcgU25hcEd1aWRlbGluZSh0aGlzLmdldFdvcmxkUmVjdEV4KGNoaWxkKS5taW5Qb3NbYXhpc10gYXMgbnVtYmVyLCBheGlzLCB0aGlzLmdldE5vZGVHdWlkZWxpbmVQb3MoY2hpbGQsIGF4aXMsIDApKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3VpZGVsaW5lcztcbiAgICB9XG5cbiAgICBjbGVhckN1cnJlbnROb2RlR3VpZGVsaW5lcygpIHtcbiAgICAgICAgdGhpcy5ub2RlU25hcEd1aWRlbGluZUdyb3Vwc1swXS5jdXJyZW50R3VpZGVsaW5lcyA9IFtdO1xuICAgICAgICB0aGlzLm5vZGVTbmFwR3VpZGVsaW5lR3JvdXBzWzFdLmN1cnJlbnRHdWlkZWxpbmVzID0gW107XG4gICAgfVxuXG4gICAgLy8jcmVnaW9uIHNuYXAgdG8gb3RoZXIgbm9kZXNcblxuICAgIHNuYXBUb05vZGVHdWlkZWxpbmVzT25BeGlzKHZhbHVlOiBudW1iZXIsIHNuYXBEaXN0OiBudW1iZXIsIGF4aXM6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5zbmFwVG9HdWlkZWxpbmVzT25BeGlzKHRoaXMubm9kZVNuYXBHdWlkZWxpbmVHcm91cHMsIHZhbHVlLCBzbmFwRGlzdCwgYXhpcyk7XG4gICAgfVxuXG4gICAgc25hcFBvc1RvTm9kZUd1aWRlbGluZXMod29ybGRQb3M6IFZlYzMsIHdvcmxkU2l6ZTogU2l6ZSwgc25hcERpc3Q6IFZlYzIpIHtcbiAgICAgICAgdGhpcy5jbGVhckN1cnJlbnROb2RlR3VpZGVsaW5lcygpO1xuICAgICAgICBjb25zdCBoYWxmV2lkdGggPSB3b3JsZFNpemUud2lkdGggLyAyO1xuICAgICAgICBjb25zdCBoYWxmSGVpZ2h0ID0gd29ybGRTaXplLmhlaWdodCAvIDI7XG5cbiAgICAgICAgLy8g5YWI5a+56b2Q6L6577yM5YaN5a+56b2Q5Lit5b+D54K5XG4gICAgICAgIGNvbnN0IG5ld1BvcyA9IHdvcmxkUG9zLmNsb25lKCk7XG4gICAgICAgIC8vIHNpZGVcbiAgICAgICAgbmV3UG9zLnggPSB0aGlzLnNuYXBUb05vZGVHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy54IC0gaGFsZldpZHRoLCBzbmFwRGlzdC54LCAneCcpICsgaGFsZldpZHRoO1xuICAgICAgICBuZXdQb3MueCA9IHRoaXMuc25hcFRvTm9kZUd1aWRlbGluZXNPbkF4aXMobmV3UG9zLnggKyBoYWxmV2lkdGgsIHNuYXBEaXN0LngsICd4JykgLSBoYWxmV2lkdGg7XG4gICAgICAgIG5ld1Bvcy55ID0gdGhpcy5zbmFwVG9Ob2RlR3VpZGVsaW5lc09uQXhpcyhuZXdQb3MueSAtIGhhbGZIZWlnaHQsIHNuYXBEaXN0LnksICd5JykgKyBoYWxmSGVpZ2h0O1xuICAgICAgICBuZXdQb3MueSA9IHRoaXMuc25hcFRvTm9kZUd1aWRlbGluZXNPbkF4aXMobmV3UG9zLnkgKyBoYWxmSGVpZ2h0LCBzbmFwRGlzdC55LCAneScpIC0gaGFsZkhlaWdodDtcblxuICAgICAgICAvLyBjZW50ZXJcbiAgICAgICAgbmV3UG9zLnggPSB0aGlzLnNuYXBUb05vZGVHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy54LCBzbmFwRGlzdC54LCAneCcpO1xuICAgICAgICBuZXdQb3MueSA9IHRoaXMuc25hcFRvTm9kZUd1aWRlbGluZXNPbkF4aXMobmV3UG9zLnksIHNuYXBEaXN0LnksICd5Jyk7XG5cbiAgICAgICAgcmV0dXJuIG5ld1BvcztcbiAgICB9XG5cbiAgICBzbmFwU2l6ZVRvTm9kZUd1aWRlbGluZXMob3JpU2l6ZVBvczogVmVjMiwgZGVsdGFTaXplOiBWZWMyLCBzbmFwRGlzdDogVmVjMikge1xuICAgICAgICB0aGlzLmNsZWFyQ3VycmVudE5vZGVHdWlkZWxpbmVzKCk7XG4gICAgICAgIGlmIChkZWx0YVNpemUueCAhPT0gMCkge1xuICAgICAgICAgICAgZGVsdGFTaXplLnggPSB0aGlzLnNuYXBUb05vZGVHdWlkZWxpbmVzT25BeGlzKG9yaVNpemVQb3MueCArIGRlbHRhU2l6ZS54LCBzbmFwRGlzdC54LCAneCcpIC0gb3JpU2l6ZVBvcy54O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlbHRhU2l6ZS55ICE9PSAwKSB7XG4gICAgICAgICAgICBkZWx0YVNpemUueSA9IHRoaXMuc25hcFRvTm9kZUd1aWRlbGluZXNPbkF4aXMob3JpU2l6ZVBvcy55ICsgZGVsdGFTaXplLnksIHNuYXBEaXN0LnksICd5JykgLSBvcmlTaXplUG9zLnk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsdGFTaXplO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZU5vZGVTbmFwR3VpZGVsaW5lcyhwYXJlbnROb2RlOiBOb2RlLCBub2RlOiBOb2RlKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVTbmFwR3VpZGVsaW5lR3JvdXBzW2ldLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBndWlkZWxpbmVzID0gW107XG4gICAgICAgIGNvbnN0IGF4aXNOYW1lOiAoa2V5b2YoVmVjMykpW10gPSBbJ3gnLCAneSddO1xuICAgICAgICBmb3IgKGxldCBheGlzID0gMDsgYXhpcyA8IDI7IGF4aXMrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgc2lkZSA9IDA7IHNpZGUgPCB0aGlzLnNpZGVzQW5kTWlkZGxlLmxlbmd0aDsgc2lkZSsrKSB7XG4gICAgICAgICAgICAgICAgZ3VpZGVsaW5lcyA9IHRoaXMuZ2V0Tm9kZVNuYXBHdWlkZWxpbmVzKHBhcmVudE5vZGUsIG5vZGUsIGF4aXNOYW1lW2F4aXNdLCBzaWRlKTtcbiAgICAgICAgICAgICAgICBndWlkZWxpbmVzLmZvckVhY2goKGd1aWRlbGluZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBndWlkZWxpbmUuY2hlY2tOb2RlID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlU25hcEd1aWRlbGluZUdyb3Vwc1theGlzXS5hZGRHdWlkZWxpbmUoZ3VpZGVsaW5lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vICNlbmRyZWdpb24gc25hcCB0byBvdGhlciBub2Rlc1xuXG4gICAgZ2VuZXJhdGVXb3JsZFJlY3Qod29ybGRQb3M6IFZlYzMsIHdvcmxkU2l6ZTogU2l6ZSkge1xuICAgICAgICBjb25zdCBoYWxmV2lkdGggPSB3b3JsZFNpemUud2lkdGggLyAyO1xuICAgICAgICBjb25zdCBoYWxmSGVpZ2h0ID0gd29ybGRTaXplLmhlaWdodCAvIDI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5Qb3M6IG5ldyBWZWMzKHdvcmxkUG9zLnggLSBoYWxmV2lkdGgsIHdvcmxkUG9zLnkgLSBoYWxmSGVpZ2h0LCB3b3JsZFBvcy56KSxcbiAgICAgICAgICAgIG1heFBvczogbmV3IFZlYzMod29ybGRQb3MueCArIGhhbGZXaWR0aCwgd29ybGRQb3MueSArIGhhbGZIZWlnaHQsIHdvcmxkUG9zLnopLFxuICAgICAgICAgICAgY2VudGVyOiB3b3JsZFBvcyxcbiAgICAgICAgICAgIHdpZHRoOiB3b3JsZFNpemUud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHdvcmxkU2l6ZS5oZWlnaHQsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8jcmVnaW9uIHNuYXAgdG8gZXF1YWwgc3BhY2luZ1xuXG4gICAgY2hlY2tFcXVhbFNwYWNpbmdPblNpZGUoY2hlY2tEaXN0SW5mbzogSURpc3RhbmNlSW5mbywgc2lkZToga2V5b2YoSURpc3RhbmNlSW5mbyksIHNuYXBWYWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHNpZGVEaXN0SW5mb3MgPSBjaGVja0Rpc3RJbmZvW3NpZGVdO1xuICAgICAgICBpZiAoIXNpZGVEaXN0SW5mb3MgfHwgc2lkZURpc3RJbmZvcy5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXRjaFNpZGVEaXN0SW5mb3M6IElSZWN0RGlzdEluZm9bXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHNpZGVNaW5EaXN0SW5mbyA9IHNpZGVEaXN0SW5mb3NbMF07XG4gICAgICAgIGNvbnN0IGNoZWNrRGlzdCA9IHNpZGVNaW5EaXN0SW5mby5taW5EaXN0O1xuICAgICAgICBjb25zdCBzaWRlVGFyZ2V0ID0gc2lkZU1pbkRpc3RJbmZvLnRhcmdldFNoYXBlSW5mbztcbiAgICAgICAgY29uc3Qgc2lkZURpc3RBcnJheU9mU2lkZVRhcmdldCA9IHNpZGVUYXJnZXQ/LmRpc3RJbmZvW3NpZGVdO1xuICAgICAgICBsZXQgbWF0Y2hEaXN0ID0gLTE7XG4gICAgICAgIGxldCBkZWx0YURpc3QgPSAwO1xuICAgICAgICBsZXQgbWF0Y2hEZWx0YURpc3QgPSAwO1xuICAgICAgICBpZiAoc2lkZURpc3RBcnJheU9mU2lkZVRhcmdldCAmJiBzaWRlRGlzdEFycmF5T2ZTaWRlVGFyZ2V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNpZGVEaXN0QXJyYXlPZlNpZGVUYXJnZXQuZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgIGRlbHRhRGlzdCA9IGluZm8ubWluRGlzdCAtIGNoZWNrRGlzdDtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZGVsdGFEaXN0KSA8PSBzbmFwVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hEZWx0YURpc3QgPSBkZWx0YURpc3Q7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoRGlzdCA9IGluZm8ubWluRGlzdDtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hTaWRlRGlzdEluZm9zLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hEaXN0ID4gMCkge1xuICAgICAgICAgICAgLy8g5qOA5rWL5Y+z6L655ZKM5LiL6L655pe277yM6ZyA6KaB5Y+Y5o2i56ym5Y+377yM5omN6IO95q2j56Gu5pu05paw5L2N572uXG4gICAgICAgICAgICBpZiAoc2lkZSA9PT0gJ3JpZ2h0JyB8fCBzaWRlID09PSAndG9wJykge1xuICAgICAgICAgICAgICAgIG1hdGNoRGVsdGFEaXN0ID0gLW1hdGNoRGVsdGFEaXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtYXRjaERpc3QsXG4gICAgICAgICAgICAgICAgbWF0Y2hEZWx0YURpc3QsXG4gICAgICAgICAgICAgICAgc2lkZU1pbkRpc3RTaGFwZUluZm86IHNpZGVUYXJnZXQsIC8vIOWSjOajgOa1i+iKgueCueacgOi/keeahOWFg+e0oOaVsOaNrlxuICAgICAgICAgICAgICAgIG1hdGNoU2lkZURpc3RJbmZvcywgLy8g6L+Z6YeM5a2Y55qE5piv5LiL5LiA57qn55qE6Led56a75pWw5o2u77yM5ZKM5qOA5rWL6IqC54K55pyA6L+R55qE6YKj5Liq5rKh5pyJ5a2Y5YKo5Zyo6L+Z6YeM77yM5Zug5Li6c25hcOWQjuimgemHjeaWsOeul+S4gOS4i+S9jee9rlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrRXF1YWxTcGFjaW5nT25BeGlzKGRpc3RJbmZvOiBJRGlzdGFuY2VJbmZvLCB2YWx1ZTogbnVtYmVyLCBheGlzOiBrZXlvZihWZWMzKSwgc25hcFZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgbGV0IG1hdGNoRGlzdEluZm9zOiBJUmVjdERpc3RJbmZvW10gPSBbXTtcbiAgICAgICAgY29uc3QgbWF0Y2hTaGFwZUluZm9zOiBhbnlbXSA9IFtdO1xuICAgICAgICBsZXQgc2lkZXM6IChrZXlvZihJRGlzdGFuY2VJbmZvKSlbXSA9IFtdO1xuICAgICAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAgICAgICBzaWRlcyA9IFsnbGVmdCcsICdyaWdodCddO1xuICAgICAgICB9IGVsc2UgaWYgKGF4aXMgPT09ICd5Jykge1xuICAgICAgICAgICAgc2lkZXMgPSBbJ3RvcCcsICdib3R0b20nXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpc0hpdCA9IGZhbHNlO1xuICAgICAgICBsZXQgbmV3VmFsdWUgPSAwO1xuICAgICAgICBzaWRlcy5mb3JFYWNoKChzaWRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGVja1Jlc3VsdCA9IHRoaXMuY2hlY2tFcXVhbFNwYWNpbmdPblNpZGUoZGlzdEluZm8sIHNpZGUsIHNuYXBWYWx1ZSk7XG4gICAgICAgICAgICBpZiAoY2hlY2tSZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpc0hpdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSB2YWx1ZSArIGNoZWNrUmVzdWx0Lm1hdGNoRGVsdGFEaXN0O1xuICAgICAgICAgICAgICAgIC8vIOaaguaXtuWPquaUr+aMgeWNlei+uVxuICAgICAgICAgICAgICAgIG1hdGNoRGlzdEluZm9zID0gY2hlY2tSZXN1bHQubWF0Y2hTaWRlRGlzdEluZm9zO1xuICAgICAgICAgICAgICAgIG1hdGNoU2hhcGVJbmZvcy5wdXNoKGNoZWNrUmVzdWx0LnNpZGVNaW5EaXN0U2hhcGVJbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFpc0hpdCkge1xuICAgICAgICAgICAgY29uc3Qgc2lkZUEgPSBkaXN0SW5mb1tzaWRlc1swXV07XG4gICAgICAgICAgICBjb25zdCBzaWRlQiA9IGRpc3RJbmZvW3NpZGVzWzFdXTtcbiAgICAgICAgICAgIGNvbnN0IHNpZGVNaW5EaXN0SW5mb0EgPSBzaWRlQVswXTtcbiAgICAgICAgICAgIGNvbnN0IHNpZGVNaW5EaXN0SW5mb0IgPSBzaWRlQlswXTtcbiAgICAgICAgICAgIGlmIChzaWRlTWluRGlzdEluZm9BICYmIHNpZGVNaW5EaXN0SW5mb0IpIHtcbiAgICAgICAgICAgICAgICAvLyDmmoLml7blj6rlpITnkIZhbmNob3LlnKjkuK3lv4PngrnnmoTmg4XlhrVcbiAgICAgICAgICAgICAgICBjb25zdCBtaWRkbGVQb3NPbkF4aXMgPSAoKHNpZGVNaW5EaXN0SW5mb0EubWluRGlzdFBvc0FbYXhpc10gYXMgbnVtYmVyKSArIChzaWRlTWluRGlzdEluZm9CLm1pbkRpc3RQb3NCW2F4aXNdIGFzIG51bWJlcikpIC8gMjtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NEaWZmID0gTWF0aC5hYnModmFsdWUgLSBtaWRkbGVQb3NPbkF4aXMpO1xuICAgICAgICAgICAgICAgIGlmIChwb3NEaWZmIDw9IHNuYXBWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IG1pZGRsZVBvc09uQXhpcztcbiAgICAgICAgICAgICAgICAgICAgaXNIaXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBtYXRjaFNoYXBlSW5mb3MucHVzaChzaWRlTWluRGlzdEluZm9BLnRhcmdldFNoYXBlSW5mbywgc2lkZU1pbkRpc3RJbmZvQi50YXJnZXRTaGFwZUluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0hpdCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSxcbiAgICAgICAgICAgICAgICBtYXRjaERpc3RJbmZvcyxcbiAgICAgICAgICAgICAgICBtYXRjaFNoYXBlSW5mb3MsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgc25hcFBvc1RvRXF1YWxTcGFjaW5nKHdvcmxkUG9zOiBWZWMzLCB3b3JsZFNpemU6IFNpemUsIHNuYXBEaXN0OiBWZWMyKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1hdGNoTWluRGlzdEluZm9zID0gW107XG5cbiAgICAgICAgY29uc3QgY2hlY2tXb3JsZFJlY3QgPSB0aGlzLmdlbmVyYXRlV29ybGRSZWN0KHdvcmxkUG9zLCB3b3JsZFNpemUpO1xuICAgICAgICBjb25zdCBjaGVja1NoYXBlSW5mbyA9IHRoaXMuZ2VuZXJhdGVTaGFwZUluZm8oY2hlY2tXb3JsZFJlY3QpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2hhcGVJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMuc2hhcGVJbmZvc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGlzdEluZm9BIH0gPSB0aGlzLmdhdGhlckRpc3RJbmZvKGNoZWNrU2hhcGVJbmZvLCBpbmZvKTtcbiAgICAgICAgICAgIHRoaXMuY29uY2F0RGlzdEluZm8oY2hlY2tTaGFwZUluZm8uZGlzdEluZm8sIGRpc3RJbmZvQSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdQb3MgPSB3b3JsZFBvcy5jbG9uZSgpO1xuXG4gICAgICAgIGNvbnN0IGRpc3RJbmZvID0gY2hlY2tTaGFwZUluZm8uZGlzdEluZm87XG4gICAgICAgIGZ1bmN0aW9uIHNvcnRCeURpc3QoYTogSVJlY3REaXN0SW5mbywgYjogSVJlY3REaXN0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGEubWluRGlzdCAtIGIubWluRGlzdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1hdGNoU2hhcGVJbmZvczogYW55W10gPSBbXTsgLy8g5ZKM5b2T5YmN5qOA5rWL6IqC54K55ruh6Laz6IqC54K555qE5YWD57Sg77yM5Li65LqG5pyA5ZCO5YaN566X5LiA5LiL6Led56a75L2N572uXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkaXN0SW5mby5sZWZ0O1xuICAgICAgICBjb25zdCByaWdodCA9IGRpc3RJbmZvLnJpZ2h0O1xuICAgICAgICBjb25zdCB0b3AgPSBkaXN0SW5mby50b3A7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IGRpc3RJbmZvLmJvdHRvbTtcbiAgICAgICAgLy8gY2hlY2sgeCBlcXVhbCBzcGFjaW5nXG4gICAgICAgIGlmIChsZWZ0Lmxlbmd0aCA+IDAgfHwgcmlnaHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGVmdC5zb3J0KHNvcnRCeURpc3QpO1xuICAgICAgICAgICAgcmlnaHQuc29ydChzb3J0QnlEaXN0KTtcblxuICAgICAgICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSB0aGlzLmNoZWNrRXF1YWxTcGFjaW5nT25BeGlzKGRpc3RJbmZvLCBuZXdQb3MueCwgJ3gnLCBzbmFwRGlzdC54KTtcbiAgICAgICAgICAgIGlmIChjaGVja1Jlc3VsdCkge1xuICAgICAgICAgICAgICAgIG5ld1Bvcy54ID0gY2hlY2tSZXN1bHQubmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF0Y2hNaW5EaXN0SW5mb3MucHVzaCguLi5jaGVja1Jlc3VsdC5tYXRjaERpc3RJbmZvcyk7XG4gICAgICAgICAgICAgICAgbWF0Y2hTaGFwZUluZm9zLnB1c2goLi4uY2hlY2tSZXN1bHQubWF0Y2hTaGFwZUluZm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIHkgZXF1YWwgc3BhY2luZ1xuICAgICAgICBpZiAodG9wLmxlbmd0aCA+IDAgJiYgYm90dG9tLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRvcC5zb3J0KHNvcnRCeURpc3QpO1xuICAgICAgICAgICAgYm90dG9tLnNvcnQoc29ydEJ5RGlzdCk7XG4gICAgICAgICAgICBjb25zdCBjaGVja1Jlc3VsdCA9IHRoaXMuY2hlY2tFcXVhbFNwYWNpbmdPbkF4aXMoZGlzdEluZm8sIG5ld1Bvcy55LCAneScsIHNuYXBEaXN0LnkpO1xuICAgICAgICAgICAgaWYgKGNoZWNrUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgbmV3UG9zLnkgPSBjaGVja1Jlc3VsdC5uZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXRjaE1pbkRpc3RJbmZvcy5wdXNoKC4uLmNoZWNrUmVzdWx0Lm1hdGNoRGlzdEluZm9zKTtcbiAgICAgICAgICAgICAgICBtYXRjaFNoYXBlSW5mb3MucHVzaCguLi5jaGVja1Jlc3VsdC5tYXRjaFNoYXBlSW5mb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3Q2hlY2tXb3JsZFJlY3QgPSB0aGlzLmdlbmVyYXRlV29ybGRSZWN0KG5ld1Bvcywgd29ybGRTaXplKTtcbiAgICAgICAgbWF0Y2hTaGFwZUluZm9zLmZvckVhY2goKHNoYXBlSW5mbykgPT4ge1xuICAgICAgICAgICAgaWYgKCFzaGFwZUluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkaXN0SW5mb1Jlc3VsdCA9IHRoaXMuZ2V0RGlzdEluZm9PZlJlY3QobmV3Q2hlY2tXb3JsZFJlY3QsIHNoYXBlSW5mby53b3JsZFJlY3QpO1xuICAgICAgICAgICAgaWYgKGRpc3RJbmZvUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF0Y2hNaW5EaXN0SW5mb3MucHVzaChkaXN0SW5mb1Jlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXdQb3M7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlU3BhY2luZ1NuYXBHdWlkZWxpbmVzKHBhcmVudE5vZGU6IE5vZGUsIG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3Qgc2hhcGVJbmZvcyA9IHRoaXMuZ2F0aGVyU2hhcGVJbmZvcyhwYXJlbnROb2RlLCBub2RlKTtcblxuICAgICAgICBpZiAoIXNoYXBlSW5mb3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hhcGVJbmZvcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGluZm9BID0gc2hhcGVJbmZvc1tpXTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBpOyBqIDwgc2hhcGVJbmZvcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm9CID0gc2hhcGVJbmZvc1tqXTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRpc3RJbmZvQSwgZGlzdEluZm9CIH0gPSB0aGlzLmdhdGhlckRpc3RJbmZvKGluZm9BLCBpbmZvQik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25jYXREaXN0SW5mbyhpbmZvQS5kaXN0SW5mbywgZGlzdEluZm9BKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmNhdERpc3RJbmZvKGluZm9CLmRpc3RJbmZvLCBkaXN0SW5mb0IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zaGFwZUluZm9zID0gc2hhcGVJbmZvcztcbiAgICB9XG5cbiAgICBnYXRoZXJEaXN0SW5mbyhpbmZvQTogSVNoYXBlSW5mbywgaW5mb0I6IElTaGFwZUluZm8pIHtcbiAgICAgICAgY29uc3QgcmVjdEEgPSBpbmZvQS53b3JsZFJlY3Q7XG4gICAgICAgIGNvbnN0IHJlY3RCID0gaW5mb0Iud29ybGRSZWN0O1xuICAgICAgICBjb25zdCBkaXN0SW5mb0E6IElEaXN0YW5jZUluZm8gPSB7XG4gICAgICAgICAgICBsZWZ0OiBbXSxcbiAgICAgICAgICAgIHJpZ2h0OiBbXSxcbiAgICAgICAgICAgIHRvcDogW10sXG4gICAgICAgICAgICBib3R0b206IFtdLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRpc3RJbmZvQjogSURpc3RhbmNlSW5mbyA9IHtcbiAgICAgICAgICAgIGxlZnQ6IFtdLFxuICAgICAgICAgICAgcmlnaHQ6IFtdLFxuICAgICAgICAgICAgdG9wOiBbXSxcbiAgICAgICAgICAgIGJvdHRvbTogW10sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZGlzdEluZm8gPSB0aGlzLmdldERpc3RJbmZvT2ZSZWN0KHJlY3RBLCByZWN0Qik7XG4gICAgICAgIGlmIChkaXN0SW5mbykge1xuICAgICAgICAgICAgY29uc3QgZGlzdFRvQkluZm8gPSBPYmplY3QuYXNzaWduKHsgdGFyZ2V0U2hhcGVJbmZvOiBpbmZvQiB9LCBkaXN0SW5mbyk7XG4gICAgICAgICAgICBjb25zdCBkaXN0VG9BSW5mbyA9IE9iamVjdC5hc3NpZ24oeyB0YXJnZXRTaGFwZUluZm86IGluZm9BIH0sIGRpc3RJbmZvKTtcbiAgICAgICAgICAgIGlmIChkaXN0SW5mby5heGlzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVjdEEuY2VudGVyLnggPiByZWN0Qi5jZW50ZXIueCkge1xuICAgICAgICAgICAgICAgICAgICBkaXN0SW5mb0EubGVmdC5wdXNoKGRpc3RUb0JJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzdEluZm9CLnJpZ2h0LnB1c2goZGlzdFRvQUluZm8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3RJbmZvQS5yaWdodC5wdXNoKGRpc3RUb0JJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzdEluZm9CLmxlZnQucHVzaChkaXN0VG9BSW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkaXN0SW5mby5heGlzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVjdEEuY2VudGVyLnkgPiByZWN0Qi5jZW50ZXIueSkge1xuICAgICAgICAgICAgICAgICAgICBkaXN0SW5mb0EuYm90dG9tLnB1c2goZGlzdFRvQkluZm8pO1xuICAgICAgICAgICAgICAgICAgICBkaXN0SW5mb0IudG9wLnB1c2goZGlzdFRvQUluZm8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3RJbmZvQS50b3AucHVzaChkaXN0VG9CSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3RJbmZvQi5ib3R0b20ucHVzaChkaXN0VG9BSW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpc3RJbmZvQSxcbiAgICAgICAgICAgIGRpc3RJbmZvQixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25jYXREaXN0SW5mbyhkc3REaXN0SW5mbzogSURpc3RhbmNlSW5mbywgc3JjRGlzdEluZm86IElEaXN0YW5jZUluZm8pIHtcbiAgICAgICAgZHN0RGlzdEluZm8ubGVmdCA9IGRzdERpc3RJbmZvLmxlZnQuY29uY2F0KHNyY0Rpc3RJbmZvLmxlZnQpO1xuICAgICAgICBkc3REaXN0SW5mby5yaWdodCA9IGRzdERpc3RJbmZvLnJpZ2h0LmNvbmNhdChzcmNEaXN0SW5mby5yaWdodCk7XG4gICAgICAgIGRzdERpc3RJbmZvLnRvcCA9IGRzdERpc3RJbmZvLnRvcC5jb25jYXQoc3JjRGlzdEluZm8udG9wKTtcbiAgICAgICAgZHN0RGlzdEluZm8uYm90dG9tID0gZHN0RGlzdEluZm8uYm90dG9tLmNvbmNhdChzcmNEaXN0SW5mby5ib3R0b20pO1xuICAgIH1cblxuICAgIGdhdGhlclNoYXBlSW5mb3MocGFyZW50Tm9kZTogTm9kZSwgbm9kZTogTm9kZSkge1xuICAgICAgICBjb25zdCBzaGFwZUluZm9zOiBJU2hhcGVJbmZvW10gPSBbXTtcbiAgICAgICAgaWYgKCFwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudE5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5LiN5aSE55CGc2l6ZeS4ujDnmoTmg4XlhrVcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gY2hpbGQuZ2V0Q29tcG9uZW50KFVJVHJhbnNmb3JtKT8uY29udGVudFNpemU7XG4gICAgICAgICAgICBpZiAoIWNvbnRlbnRTaXplIHx8IGNvbnRlbnRTaXplLndpZHRoIDw9IDAgfHwgY29udGVudFNpemUuaGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHdvcmxkUmVjdCA9IHRoaXMuZ2V0V29ybGRSZWN0RXgoY2hpbGQpO1xuICAgICAgICAgICAgc2hhcGVJbmZvcy5wdXNoKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVTaGFwZUluZm8od29ybGRSZWN0KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzaGFwZUluZm9zO1xuICAgIH1cblxuICAgIGdlbmVyYXRlU2hhcGVJbmZvKHdvcmxkUmVjdDogSVdvcmxkUmVjdCk6IElTaGFwZUluZm8ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd29ybGRSZWN0LFxuICAgICAgICAgICAgZGlzdEluZm86IHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBbXSxcbiAgICAgICAgICAgICAgICByaWdodDogW10sXG4gICAgICAgICAgICAgICAgdG9wOiBbXSxcbiAgICAgICAgICAgICAgICBib3R0b206IFtdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXREaXN0SW5mb09mUmVjdChyZWN0QTogSVdvcmxkUmVjdCwgcmVjdEI6IElXb3JsZFJlY3QpOiBJUmVjdERpc3RJbmZvIHwgbnVsbCB7XG4gICAgICAgIGxldCBtaW5EaXN0ID0gLTE7XG4gICAgICAgIGxldCBtaW5EaXN0UG9zQTtcbiAgICAgICAgbGV0IG1pbkRpc3RQb3NCO1xuICAgICAgICBsZXQgYXhpcyA9ICd4JztcblxuICAgICAgICBjb25zdCBjZW50ZXJBID0gcmVjdEEuY2VudGVyO1xuICAgICAgICBjb25zdCBjZW50ZXJCID0gcmVjdEIuY2VudGVyO1xuXG4gICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoY2VudGVyQS54IC0gY2VudGVyQi54KTtcbiAgICAgICAgY29uc3QgZHkgPSBNYXRoLmFicyhjZW50ZXJBLnkgLSBjZW50ZXJCLnkpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBhcmVOdW1iZXIoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4pOS4quefqeW9ouS4jeebuOS6pO+8jOWcqFjlnZDmoIfkuIrmnInph43lj6DvvIzmnIDnn63ot53nprvkuLrkuIrnn6nlvaLnmoTkuIvovrnlkozkuIvpnaLlvaLnmoTkuIrovrnnmoTot53nprtcbiAgICAgICAgaWYgKChkeCA8ICgocmVjdEEud2lkdGggKyByZWN0Qi53aWR0aCkgLyAyKSkgJiYgKGR5ID49ICgocmVjdEEuaGVpZ2h0ICsgcmVjdEIuaGVpZ2h0KSAvIDIpKSkge1xuICAgICAgICAgICAgbWluRGlzdCA9IGR5IC0gKChyZWN0QS5oZWlnaHQgKyByZWN0Qi5oZWlnaHQpIC8gMik7XG5cbiAgICAgICAgICAgIGxldCB1cFJlY3QgPSByZWN0QTtcbiAgICAgICAgICAgIGxldCBkb3duUmVjdCA9IHJlY3RCO1xuICAgICAgICAgICAgaWYgKGNlbnRlckEueSA8IGNlbnRlckIueSkge1xuICAgICAgICAgICAgICAgIHVwUmVjdCA9IHJlY3RCO1xuICAgICAgICAgICAgICAgIGRvd25SZWN0ID0gcmVjdEE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOaJvumHjeWPoFjlnZDmoIdcbiAgICAgICAgICAgIGNvbnN0IHhTaWRlcyA9IFt1cFJlY3QubWluUG9zLngsIHVwUmVjdC5taW5Qb3MueCArIHVwUmVjdC53aWR0aCwgZG93blJlY3QubWF4UG9zLngsIGRvd25SZWN0Lm1heFBvcy54IC0gZG93blJlY3Qud2lkdGhdO1xuICAgICAgICAgICAgeFNpZGVzLnNvcnQoY29tcGFyZU51bWJlcik7XG5cbiAgICAgICAgICAgIGNvbnN0IG1pZGRsZVggPSAoeFNpZGVzWzFdICsgeFNpZGVzWzJdKSAvIDI7XG4gICAgICAgICAgICBtaW5EaXN0UG9zQSA9IG5ldyBWZWMzKG1pZGRsZVgsIHVwUmVjdC5taW5Qb3MueSwgMCk7XG4gICAgICAgICAgICBtaW5EaXN0UG9zQiA9IG5ldyBWZWMzKG1pZGRsZVgsIGRvd25SZWN0Lm1heFBvcy55LCAwKTtcbiAgICAgICAgICAgIGF4aXMgPSAneSc7XG4gICAgICAgIH0gZWxzZSBpZiAoKGR4ID49ICgocmVjdEEud2lkdGggKyByZWN0Qi53aWR0aCkgLyAyKSkgJiYgKGR5IDwgKChyZWN0QS5oZWlnaHQgKyByZWN0Qi5oZWlnaHQpIC8gMikpKSB7XG4gICAgICAgICAgICAvLyDkuKTkuKrnn6nlvaLkuI3nm7jkuqTvvIzlnKhZ5Z2Q5qCH5LiK5pyJ6YeN5Y+g77yM5pyA55+t6Led56a75Li65bem55+p5b2i55qE5Y+z6L655ZKM5Y+z55+p5b2i55qE5bem6L6555qE6Led56a7XG4gICAgICAgICAgICBtaW5EaXN0ID0gZHggLSAoKHJlY3RBLndpZHRoICsgcmVjdEIud2lkdGgpIC8gMik7XG5cbiAgICAgICAgICAgIGxldCBsZWZ0UmVjdCA9IHJlY3RBO1xuICAgICAgICAgICAgbGV0IHJpZ2h0UmVjdCA9IHJlY3RCO1xuICAgICAgICAgICAgaWYgKGNlbnRlckEueCA+IGNlbnRlckIueCkge1xuICAgICAgICAgICAgICAgIGxlZnRSZWN0ID0gcmVjdEI7XG4gICAgICAgICAgICAgICAgcmlnaHRSZWN0ID0gcmVjdEE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOaJvumHjeWPoFnlnZDmoIdcbiAgICAgICAgICAgIGNvbnN0IHlTaWRlcyA9IFtsZWZ0UmVjdC5tYXhQb3MueSwgbGVmdFJlY3QubWF4UG9zLnkgLSBsZWZ0UmVjdC5oZWlnaHQsIHJpZ2h0UmVjdC5taW5Qb3MueSwgcmlnaHRSZWN0Lm1pblBvcy55ICsgcmlnaHRSZWN0LmhlaWdodF07XG4gICAgICAgICAgICB5U2lkZXMuc29ydChjb21wYXJlTnVtYmVyKTtcblxuICAgICAgICAgICAgY29uc3QgbWlkZGxlWSA9ICh5U2lkZXNbMV0gKyB5U2lkZXNbMl0pIC8gMjtcbiAgICAgICAgICAgIG1pbkRpc3RQb3NBID0gbmV3IFZlYzMobGVmdFJlY3QubWF4UG9zLngsIG1pZGRsZVksIDApO1xuICAgICAgICAgICAgbWluRGlzdFBvc0IgPSBuZXcgVmVjMyhyaWdodFJlY3QubWluUG9zLngsIG1pZGRsZVksIDApO1xuICAgICAgICAgICAgYXhpcyA9ICd4JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtaW5EaXN0ID4gMCkge1xuICAgICAgICAgICAgLy8gbWluRGlzdFBvc+S4uuS7juW3puWIsOWPs++8jOaIluS7juS4iuWIsOS4i+eahOe6v+auteeahOS4pOS4querr+eCuVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW5EaXN0LFxuICAgICAgICAgICAgICAgIG1pbkRpc3RQb3NBOiBtaW5EaXN0UG9zQSEsXG4gICAgICAgICAgICAgICAgbWluRGlzdFBvc0I6IG1pbkRpc3RQb3NCISxcbiAgICAgICAgICAgICAgICBheGlzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8jZW5kcmVnaW9uIHNuYXAgdG8gZXF1YWwgc3BhY2luZ1xuXG4gICAgLy8jcmVnaW9uIGdyaWQgc25hcHBpbmdcbiAgICBjYWxjdWxhdGVHcmlkU25hcEd1aWRlbGluZXMoKSB7XG4gICAgICAgIGNvbnN0IHNpemUgPSAoY2MgYXMgYW55KS5lbmdpbmUuZ2V0RGVzaWduUmVzb2x1dGlvblNpemUoKTtcbiAgICAgICAgLy8geFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemUud2lkdGg7IGkgKz0gdGhpcy5ncmlkU3BhY2luZ1gpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVTdGFydFBvcyA9IG5ldyBWZWMyKGksIDApO1xuICAgICAgICAgICAgY29uc3QgbGluZUVuZFBvcyA9IG5ldyBWZWMyKGksIHNpemUuaGVpZ2h0KTtcbiAgICAgICAgICAgIGNvbnN0IHhHdWlkZWxpbmUgPSBuZXcgU25hcEd1aWRlbGluZShpLCAneCcsIFtsaW5lU3RhcnRQb3MgYXMgYW55LCBsaW5lRW5kUG9zIGFzIGFueV0pO1xuICAgICAgICAgICAgdGhpcy5ncmlkU25hcEd1aWRlbGluZUdyb3Vwc1swXS5hZGRHdWlkZWxpbmUoeEd1aWRlbGluZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB5XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZS5oZWlnaHQ7IGkgKz0gdGhpcy5ncmlkU3BhY2luZ1kpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVTdGFydFBvcyA9IG5ldyBWZWMyKDAsIGkpO1xuICAgICAgICAgICAgY29uc3QgbGluZUVuZFBvcyA9IG5ldyBWZWMyKHNpemUud2lkdGgsIGkpO1xuICAgICAgICAgICAgY29uc3QgeUd1aWRlbGluZSA9IG5ldyBTbmFwR3VpZGVsaW5lKGksICd5JywgW2xpbmVTdGFydFBvcyBhcyBhbnksIGxpbmVFbmRQb3MgYXMgYW55XSk7XG4gICAgICAgICAgICB0aGlzLmdyaWRTbmFwR3VpZGVsaW5lR3JvdXBzWzFdLmFkZEd1aWRlbGluZSh5R3VpZGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyQ3VycmVudEdyaWRHdWlkZWxpbmVzKCkge1xuICAgICAgICB0aGlzLmdyaWRTbmFwR3VpZGVsaW5lR3JvdXBzWzBdLmN1cnJlbnRHdWlkZWxpbmVzID0gW107XG4gICAgICAgIHRoaXMuZ3JpZFNuYXBHdWlkZWxpbmVHcm91cHNbMV0uY3VycmVudEd1aWRlbGluZXMgPSBbXTtcbiAgICB9XG5cbiAgICBzbmFwVG9HcmlkR3VpZGVsaW5lc09uQXhpcyh2YWx1ZTogbnVtYmVyLCBzbmFwRGlzdDogbnVtYmVyLCBheGlzOiBrZXlvZihWZWMzKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zbmFwVG9HdWlkZWxpbmVzT25BeGlzKHRoaXMuZ3JpZFNuYXBHdWlkZWxpbmVHcm91cHMsIHZhbHVlLCBzbmFwRGlzdCwgYXhpcyk7XG4gICAgfVxuXG4gICAgc25hcFBvc1RvR3JpZFNuYXBHdWlkZWxpbmVzKHdvcmxkUG9zOiBWZWMzLCB3b3JsZFNpemU6IFNpemUsIHNuYXBEaXN0OiBWZWMyKSB7XG4gICAgICAgIHRoaXMuY2xlYXJDdXJyZW50R3JpZEd1aWRlbGluZXMoKTtcbiAgICAgICAgY29uc3QgaGFsZldpZHRoID0gd29ybGRTaXplLndpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgaGFsZkhlaWdodCA9IHdvcmxkU2l6ZS5oZWlnaHQgLyAyO1xuXG4gICAgICAgIC8vIOWPquWvuem9kOi+uVxuICAgICAgICBjb25zdCBuZXdQb3MgPSB3b3JsZFBvcy5jbG9uZSgpO1xuICAgICAgICAvLyBzaWRlXG4gICAgICAgIG5ld1Bvcy54ID0gdGhpcy5zbmFwVG9HcmlkR3VpZGVsaW5lc09uQXhpcyhuZXdQb3MueCAtIGhhbGZXaWR0aCwgc25hcERpc3QueCwgJ3gnKSArIGhhbGZXaWR0aDtcbiAgICAgICAgbmV3UG9zLnggPSB0aGlzLnNuYXBUb0dyaWRHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy54ICsgaGFsZldpZHRoLCBzbmFwRGlzdC54LCAneCcpIC0gaGFsZldpZHRoO1xuICAgICAgICBuZXdQb3MueSA9IHRoaXMuc25hcFRvR3JpZEd1aWRlbGluZXNPbkF4aXMobmV3UG9zLnkgLSBoYWxmSGVpZ2h0LCBzbmFwRGlzdC55LCAneScpICsgaGFsZkhlaWdodDtcbiAgICAgICAgbmV3UG9zLnkgPSB0aGlzLnNuYXBUb0dyaWRHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy55ICsgaGFsZkhlaWdodCwgc25hcERpc3QueSwgJ3knKSAtIGhhbGZIZWlnaHQ7XG5cbiAgICAgICAgcmV0dXJuIG5ld1BvcztcbiAgICB9XG5cbiAgICBzbmFwU2l6ZVRvR3JpZEd1aWRlbGluZXMob3JpU2l6ZVBvczogVmVjMywgZGVsdGFTaXplOiBWZWMzLCBzbmFwRGlzdDogVmVjMikge1xuICAgICAgICB0aGlzLmNsZWFyQ3VycmVudEdyaWRHdWlkZWxpbmVzKCk7XG4gICAgICAgIGlmIChkZWx0YVNpemUueCAhPT0gMCkge1xuICAgICAgICAgICAgZGVsdGFTaXplLnggPSB0aGlzLnNuYXBUb0dyaWRHdWlkZWxpbmVzT25BeGlzKG9yaVNpemVQb3MueCArIGRlbHRhU2l6ZS54LCBzbmFwRGlzdC54LCAneCcpIC0gb3JpU2l6ZVBvcy54O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlbHRhU2l6ZS55ICE9PSAwKSB7XG4gICAgICAgICAgICBkZWx0YVNpemUueSA9IHRoaXMuc25hcFRvR3JpZEd1aWRlbGluZXNPbkF4aXMob3JpU2l6ZVBvcy55ICsgZGVsdGFTaXplLnksIHNuYXBEaXN0LnksICd5JykgLSBvcmlTaXplUG9zLnk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsdGFTaXplO1xuICAgIH1cblxuICAgIC8vI2VuZHJlZ2lvbiBncmlkIHNuYXBwaW5nXG5cbiAgICAvLyNyZWdpb24gY2FudmFzIHNuYXBwaW5nXG4gICAgY2FsY3VsYXRlQ2FudmFzU25hcEd1aWRlbGluZXMoKSB7XG4gICAgICAgIGNvbnN0IHNpemUgPSAoY2MgYXMgYW55KS52aWV3LmdldERlc2lnblJlc29sdXRpb25TaXplKCk7XG4gICAgICAgIGNvbnN0IGxlZnQgPSAwO1xuICAgICAgICBjb25zdCBtaWRkbGVYID0gc2l6ZS53aWR0aCAvIDI7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gc2l6ZS53aWR0aDtcbiAgICAgICAgY29uc3QgYm90dG9tID0gMDtcbiAgICAgICAgY29uc3QgbWlkZGxlWSA9IHNpemUuaGVpZ2h0IC8gMjtcbiAgICAgICAgY29uc3QgdG9wID0gc2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgLy8geFxuICAgICAgICBjb25zdCB4QXhpcyA9IFtsZWZ0LCBtaWRkbGVYLCByaWdodF07XG4gICAgICAgIHhBeGlzLmZvckVhY2goKHgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzU25hcEd1aWRlbGluZUdyb3Vwc1swXS5hZGRHdWlkZWxpbmUobmV3IFNuYXBHdWlkZWxpbmUoeCwgJ3gnLFxuICAgICAgICAgICAgICAgIFtuZXcgVmVjMyh4LCAwKSwgbmV3IFZlYzMoeCwgc2l6ZS5oZWlnaHQpXSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB5XG4gICAgICAgIGNvbnN0IHlBeGlzID0gW2JvdHRvbSwgbWlkZGxlWSwgdG9wXTtcbiAgICAgICAgeUF4aXMuZm9yRWFjaCgoeSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jYW52YXNTbmFwR3VpZGVsaW5lR3JvdXBzWzFdLmFkZEd1aWRlbGluZShuZXcgU25hcEd1aWRlbGluZSh5LCAneCcsXG4gICAgICAgICAgICAgICAgW25ldyBWZWMzKDAsIHkpLCBuZXcgVmVjMyhzaXplLndpZHRoLCB5KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2xlYXJDdXJyZW50Q2FudmFzR3VpZGVsaW5lcygpIHtcbiAgICAgICAgdGhpcy5jYW52YXNTbmFwR3VpZGVsaW5lR3JvdXBzWzBdLmN1cnJlbnRHdWlkZWxpbmVzID0gW107XG4gICAgICAgIHRoaXMuY2FudmFzU25hcEd1aWRlbGluZUdyb3Vwc1sxXS5jdXJyZW50R3VpZGVsaW5lcyA9IFtdO1xuICAgIH1cblxuICAgIHNuYXBUb0NhbnZhc1NuYXBHdWlkZWxpbmVzT25BeGlzKHZhbHVlOiBudW1iZXIsIHNuYXBEaXN0OiBudW1iZXIsIGF4aXM6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5zbmFwVG9HdWlkZWxpbmVzT25BeGlzKHRoaXMuY2FudmFzU25hcEd1aWRlbGluZUdyb3VwcywgdmFsdWUsIHNuYXBEaXN0LCBheGlzKTtcbiAgICB9XG5cbiAgICBzbmFwUG9zVG9DYW52YXNTbmFwR3VpZGVsaW5lcyh3b3JsZFBvczogVmVjMywgd29ybGRTaXplOiBTaXplLCBzbmFwRGlzdDogVmVjMikge1xuICAgICAgICB0aGlzLmNsZWFyQ3VycmVudENhbnZhc0d1aWRlbGluZXMoKTtcbiAgICAgICAgY29uc3QgaGFsZldpZHRoID0gd29ybGRTaXplLndpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgaGFsZkhlaWdodCA9IHdvcmxkU2l6ZS5oZWlnaHQgLyAyO1xuXG4gICAgICAgIC8vIOWFiOWvuem9kOi+ue+8jOWGjeWvuem9kOS4reW/g+eCuVxuICAgICAgICBjb25zdCBuZXdQb3MgPSB3b3JsZFBvcy5jbG9uZSgpO1xuICAgICAgICAvLyBzaWRlXG4gICAgICAgIG5ld1Bvcy54ID0gdGhpcy5zbmFwVG9DYW52YXNTbmFwR3VpZGVsaW5lc09uQXhpcyhuZXdQb3MueCAtIGhhbGZXaWR0aCwgc25hcERpc3QueCwgJ3gnKSArIGhhbGZXaWR0aDtcbiAgICAgICAgbmV3UG9zLnggPSB0aGlzLnNuYXBUb0NhbnZhc1NuYXBHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy54ICsgaGFsZldpZHRoLCBzbmFwRGlzdC54LCAneCcpIC0gaGFsZldpZHRoO1xuICAgICAgICBuZXdQb3MueSA9IHRoaXMuc25hcFRvQ2FudmFzU25hcEd1aWRlbGluZXNPbkF4aXMobmV3UG9zLnkgLSBoYWxmSGVpZ2h0LCBzbmFwRGlzdC55LCAneScpICsgaGFsZkhlaWdodDtcbiAgICAgICAgbmV3UG9zLnkgPSB0aGlzLnNuYXBUb0NhbnZhc1NuYXBHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy55ICsgaGFsZkhlaWdodCwgc25hcERpc3QueSwgJ3knKSAtIGhhbGZIZWlnaHQ7XG5cbiAgICAgICAgLy8gY2VudGVyXG4gICAgICAgIG5ld1Bvcy54ID0gdGhpcy5zbmFwVG9DYW52YXNTbmFwR3VpZGVsaW5lc09uQXhpcyhuZXdQb3MueCwgc25hcERpc3QueCwgJ3gnKTtcbiAgICAgICAgbmV3UG9zLnkgPSB0aGlzLnNuYXBUb0NhbnZhc1NuYXBHdWlkZWxpbmVzT25BeGlzKG5ld1Bvcy55LCBzbmFwRGlzdC55LCAneScpO1xuXG4gICAgICAgIHJldHVybiBuZXdQb3M7XG4gICAgfVxuXG4gICAgLy8jZW5kcmVnaW9uIGNhbnZhcyBzbmFwcGluZ1xufVxuXG5jb25zdCByZWN0VHJhbnNmb3JtU25hcHBpbmcgPSBuZXcgUmVjdFRyYW5zZm9ybVNuYXBwaW5nKCk7XG5cbmV4cG9ydCB7XG4gICAgU25hcEd1aWRlbGluZSxcbiAgICBTbmFwR3VpZGVsaW5lR3JvdXAsXG4gICAgUmVjdFRyYW5zZm9ybVNuYXBwaW5nLFxuICAgIElSZWN0U25hcENvbmZpZ0RhdGEsXG4gICAgcmVjdFRyYW5zZm9ybVNuYXBwaW5nLFxufTtcbiJdfQ==