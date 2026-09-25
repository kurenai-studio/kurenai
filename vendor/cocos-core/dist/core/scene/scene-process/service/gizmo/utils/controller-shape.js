'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const EPSILON = 1e-6;
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const PrimitiveMode = cc_1.gfx.PrimitiveMode;
const v3_forward = new cc_1.Vec3(0, 0, 1);
const tempVec3 = new cc_1.Vec3();
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
function deg2rad(deg) {
    return deg * D2R;
}
class ControllerShape {
    calcCylinderData(radiusTop = 0.5, radiusBottom = 0.5, height = 2, opts = {}) {
        const halfHeight = height * 0.5;
        const radialSegments = opts.radialSegments || 16;
        const heightSegments = opts.heightSegments || 1;
        const capped = opts.capped !== undefined ? opts.capped : true;
        const arc = opts.arc || 2.0 * Math.PI;
        let cntCap = 0;
        if (!capped) {
            if (radiusTop > 0) {
                cntCap++;
            }
            if (radiusBottom > 0) {
                cntCap++;
            }
        }
        // calculate vertex count
        let vertCount = (radialSegments + 1) * (heightSegments + 1);
        if (capped) {
            vertCount += (radialSegments + 1) * cntCap + radialSegments * cntCap;
        }
        // calculate index count
        let indexCount = radialSegments * heightSegments * 2 * 3;
        if (capped) {
            indexCount += radialSegments * cntCap * 3;
        }
        const indices = new Array(indexCount);
        const positions = new Array(vertCount);
        const normals = new Array(vertCount);
        const uvs = new Array(vertCount);
        const maxRadius = Math.max(radiusTop, radiusBottom);
        const minPos = new cc_1.Vec3(-maxRadius, -halfHeight, -maxRadius);
        const maxPos = new cc_1.Vec3(maxRadius, halfHeight, maxRadius);
        let index = 0;
        let indexOffset = 0;
        generateTorso();
        if (capped) {
            if (radiusBottom > 0) {
                generateCap(false);
            }
            if (radiusTop > 0) {
                generateCap(true);
            }
        }
        // =======================
        // internal functions
        // =======================
        function generateTorso() {
            const indexArray = [];
            // this will be used to calculate the normal
            const slope = (radiusTop - radiusBottom) / height;
            // generate positions, normals and uvs
            for (let y = 0; y <= heightSegments; y++) {
                const indexRow = [];
                const v = y / heightSegments;
                // calculate the radius of the current row
                const radius = v * (radiusTop - radiusBottom) + radiusBottom;
                for (let x = 0; x <= radialSegments; ++x) {
                    const u = x / radialSegments;
                    const theta = u * arc;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);
                    // vertex
                    positions[index] = new cc_1.Vec3(radius * sinTheta, v * height - halfHeight, radius * cosTheta);
                    // normal
                    normals[index] = new cc_1.Vec3(sinTheta, -slope, cosTheta);
                    normals[index].normalize();
                    // uv
                    uvs[index] = new cc_1.Vec2(((1 - u) * 2) % 1, v);
                    // save index of vertex in respective row
                    indexRow.push(index);
                    // increase index
                    ++index;
                }
                // now save positions of the row in our index array
                indexArray.push(indexRow);
            }
            // generate indices
            for (let y = 0; y < heightSegments; ++y) {
                for (let x = 0; x < radialSegments; ++x) {
                    // we use the index array to access the correct indices
                    const i1 = indexArray[y][x];
                    const i2 = indexArray[y + 1][x];
                    const i3 = indexArray[y + 1][x + 1];
                    const i4 = indexArray[y][x + 1];
                    // face one
                    indices[indexOffset] = i1;
                    ++indexOffset;
                    indices[indexOffset] = i4;
                    ++indexOffset;
                    indices[indexOffset] = i2;
                    ++indexOffset;
                    // face two
                    indices[indexOffset] = i4;
                    ++indexOffset;
                    indices[indexOffset] = i3;
                    ++indexOffset;
                    indices[indexOffset] = i2;
                    ++indexOffset;
                }
            }
        }
        function generateCap(top) {
            const radius = top ? radiusTop : radiusBottom;
            const sign = top ? 1 : -1;
            // save the index of the first center vertex
            const centerIndexStart = index;
            for (let x = 1; x <= radialSegments; ++x) {
                // vertex
                positions[index] = new cc_1.Vec3(0, halfHeight * sign, 0);
                // normal
                normals[index] = new cc_1.Vec3(0, sign, 0);
                // uv
                uvs[index] = new cc_1.Vec2(0.5, 0.5);
                // increase index
                ++index;
            }
            // save the index of the last center vertex
            const centerIndexEnd = index;
            for (let x = 0; x <= radialSegments; ++x) {
                const u = x / radialSegments;
                const theta = u * arc;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);
                // vertex
                positions[index] = new cc_1.Vec3(radius * sinTheta, halfHeight * sign, radius * cosTheta);
                // normal
                normals[index] = new cc_1.Vec3(0, sign, 0);
                // uv
                uvs[index] = new cc_1.Vec2(0.5 - sinTheta * 0.5 * sign, 0.5 + cosTheta * 0.5);
                // increase index
                ++index;
            }
            // generate indices
            for (let x = 0; x < radialSegments; ++x) {
                const c = centerIndexStart + x;
                const i = centerIndexEnd + x;
                if (top) {
                    // face top
                    indices[indexOffset] = i + 1;
                    ++indexOffset;
                    indices[indexOffset] = c;
                    ++indexOffset;
                    indices[indexOffset] = i;
                    ++indexOffset;
                }
                else {
                    // face bottom
                    indices[indexOffset] = c;
                    ++indexOffset;
                    indices[indexOffset] = i + 1;
                    ++indexOffset;
                    indices[indexOffset] = i;
                    ++indexOffset;
                }
            }
        }
        return {
            positions,
            normals,
            uvs,
            indices,
            minPos,
            maxPos,
        };
    }
    calcConeData(radius, height, opts = {}) {
        return this.calcCylinderData(0, radius, height, opts);
    }
    /**
     * 生成 MeshRenderer 所需要的 position 数据
     */
    calcPositionData(center, width, height, normal = new cc_1.Vec3(0, 0, 1), needBoundingBox = true) {
        const hw = width / 2;
        const hh = height / 2;
        const points = [];
        const rot = tempQuat_a;
        cc_1.Quat.rotationTo(rot, v3_forward, normal);
        points[0] = center.clone();
        points[0].add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(-hw, hh, 0), rot));
        points[1] = center.clone();
        points[1].add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(-hw, -hh, 0), rot));
        points[2] = center.clone();
        points[2].add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(hw, -hh, 0), rot));
        points[3] = center.clone();
        points[3].add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(hw, hh, 0), rot));
        let minPos, maxPos;
        if (needBoundingBox) {
            minPos = center.clone();
            minPos.add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(-hw, -hh, -0.01), rot));
            maxPos = center.clone();
            maxPos.add(cc_1.Vec3.transformQuat(tempVec3, new cc_1.Vec3(hw, hh, 0.01), rot));
        }
        return {
            positions: points,
            minPos: minPos,
            maxPos: maxPos,
        };
    }
    calcQuadData(center, width, height, normal = new cc_1.Vec3(0, 0, 1), needBoundingBox = true) {
        const indices = [0, 3, 1, 3, 2, 1];
        const uvs = [new cc_1.Vec2(0, 1), new cc_1.Vec2(0, 0), new cc_1.Vec2(1, 0), new cc_1.Vec2(1, 1)];
        const { positions, minPos, maxPos } = this.calcPositionData(center, width, height, normal, needBoundingBox);
        return {
            positions,
            normals: Array(4).fill(normal),
            indices,
            minPos,
            maxPos,
            uvs,
            doubleSided: true,
        };
    }
    lineWithBoundingBox(length, size = 3) {
        return {
            positions: [new cc_1.Vec3(), new cc_1.Vec3(length, 0, 0)],
            normals: Array(2).fill(new cc_1.Vec3(0, 1, 0)),
            indices: [0, 1],
            minPos: new cc_1.Vec3(0, -size, -size),
            maxPos: new cc_1.Vec3(length, size, size),
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcCubeData(width, height, length, center, opts = {}) {
        const ws = opts.widthSegments ? opts.widthSegments : 1;
        const hs = opts.heightSegments ? opts.heightSegments : 1;
        const ls = opts.lengthSegments ? opts.lengthSegments : 1;
        const hw = width * 0.5;
        const hh = height * 0.5;
        const hl = length * 0.5;
        const corners = [
            new cc_1.Vec3(-hw, -hh, hl),
            new cc_1.Vec3(hw, -hh, hl),
            new cc_1.Vec3(hw, hh, hl),
            new cc_1.Vec3(-hw, hh, hl),
            new cc_1.Vec3(hw, -hh, -hl),
            new cc_1.Vec3(-hw, -hh, -hl),
            new cc_1.Vec3(-hw, hh, -hl),
            new cc_1.Vec3(hw, hh, -hl),
        ];
        const faceAxis = [
            [2, 3, 1], // FRONT
            [4, 5, 7], // BACK
            [7, 6, 2], // TOP
            [1, 0, 4], // BOTTOM
            [1, 4, 2], // RIGHT
            [5, 0, 6], // LEFT
        ];
        const faceNormals = [
            new cc_1.Vec3(0, 0, 1), // FRONT
            new cc_1.Vec3(0, 0, -1), // BACK
            new cc_1.Vec3(0, 1, 0), // TOP
            new cc_1.Vec3(0, -1, 0), // BOTTOM
            new cc_1.Vec3(1, 0, 0), // RIGHT
            new cc_1.Vec3(-1, 0, 0), // LEFT
        ];
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const minPos = new cc_1.Vec3(-hw, -hh, -hl);
        const maxPos = new cc_1.Vec3(hw, hh, hl);
        function _buildPlane(side, uSegments, vSegments) {
            let u;
            let v;
            let ix;
            let iy;
            const offset = positions.length;
            const idx = faceAxis[side];
            const faceNormal = faceNormals[side];
            const t1 = tempVec3_a;
            const t2 = tempVec3_b;
            for (iy = 0; iy <= vSegments; iy++) {
                for (ix = 0; ix <= uSegments; ix++) {
                    u = ix / uSegments;
                    v = iy / vSegments;
                    cc_1.Vec3.lerp(t1, corners[idx[0]], corners[idx[1]], u);
                    cc_1.Vec3.lerp(t2, corners[idx[0]], corners[idx[2]], v);
                    t2.subtract(corners[idx[0]]);
                    const pos = new cc_1.Vec3(t1);
                    const normal = faceNormal.clone();
                    pos.add(t2);
                    normals.push(normal);
                    if (center) {
                        cc_1.Vec3.add(pos, center, pos);
                    }
                    positions.push(pos);
                    uvs.push(new cc_1.Vec2(u, v));
                    if (ix < uSegments && iy < vSegments) {
                        const useg1 = uSegments + 1;
                        const a = ix + iy * useg1;
                        const b = ix + (iy + 1) * useg1;
                        const c = ix + 1 + (iy + 1) * useg1;
                        const d = ix + 1 + iy * useg1;
                        indices.push(offset + a, offset + d, offset + b);
                        indices.push(offset + b, offset + d, offset + c);
                    }
                }
            }
        }
        _buildPlane(0, ws, hs); // FRONT
        _buildPlane(4, ls, hs); // RIGHT
        _buildPlane(1, ws, hs); // BACK
        _buildPlane(5, ls, hs); // LEFT
        _buildPlane(3, ws, ls); // BOTTOM
        _buildPlane(2, ws, ls); // TOP
        return {
            positions,
            indices,
            normals,
            minPos,
            maxPos,
        };
    }
    torus(radius, tube, opts = {}) {
        const radialSegments = opts.radialSegments || 30;
        const tubularSegments = opts.tubularSegments || 20;
        const arc = opts.arc || 2.0 * Math.PI;
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const minPos = new cc_1.Vec3(-radius - tube, -tube, -radius - tube);
        const maxPos = new cc_1.Vec3(radius + tube, tube, radius + tube);
        for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {
                const u = i / tubularSegments;
                const v = j / radialSegments;
                const u1 = u * arc;
                const v1 = v * Math.PI * 2;
                // vertex
                const x = (radius + tube * Math.cos(v1)) * Math.sin(u1);
                const y = tube * Math.sin(v1);
                const z = (radius + tube * Math.cos(v1)) * Math.cos(u1);
                // this vector is used to calculate the normal
                const nx = Math.sin(u1) * Math.cos(v1);
                const ny = Math.sin(v1);
                const nz = Math.cos(u1) * Math.cos(v1);
                positions.push(new cc_1.Vec3(x, y, z));
                normals.push(new cc_1.Vec3(nx, ny, nz));
                uvs.push(new cc_1.Vec2(u, v));
                if (i < tubularSegments && j < radialSegments) {
                    const seg1 = tubularSegments + 1;
                    const a = seg1 * j + i;
                    const b = seg1 * (j + 1) + i;
                    const c = seg1 * (j + 1) + i + 1;
                    const d = seg1 * j + i + 1;
                    indices.push(a, d, b);
                    indices.push(d, c, b);
                }
            }
        }
        return {
            positions,
            indices,
            normals,
            uvs,
            minPos,
            maxPos,
        };
    }
    calcArcPoints(center, normal, fromDir, radian, radius, segments = 60) {
        cc_1.Vec3.normalize(tempVec3_a, fromDir);
        cc_1.Vec3.normalize(tempVec3_b, normal);
        const deltaRot = tempQuat_a;
        const count = segments;
        cc_1.Quat.fromAxisAngle(deltaRot, tempVec3_b, radian / (count - 1));
        const tangent = tempVec3;
        cc_1.Vec3.multiplyScalar(tangent, tempVec3_a, radius);
        const arcPoints = [];
        for (let i = 0; i < count; i++) {
            arcPoints[i] = center.clone();
            arcPoints[i].add(tangent);
            cc_1.Vec3.transformQuat(tangent, tangent, deltaRot);
        }
        return arcPoints;
    }
    getBiNormalByNormal(normal) {
        const biNormal = new cc_1.Vec3();
        cc_1.Vec3.cross(biNormal, normal, new cc_1.Vec3(0, 1, 0));
        if (cc_1.Vec3.lengthSqr(biNormal) < 0.001) {
            cc_1.Vec3.cross(biNormal, normal, new cc_1.Vec3(1, 0, 0));
        }
        return biNormal;
    }
    calcCirclePoints(center, normal, radius, segments = 60) {
        const biNormal = this.getBiNormalByNormal(normal);
        return this.calcArcPoints(center, normal, biNormal, TWO_PI, radius, segments);
    }
    calcDiscPoints(center, normal, radius, segments = 60) {
        const biNormal = this.getBiNormalByNormal(normal);
        return this.calcSectorPoints(center, normal, biNormal, TWO_PI, radius, segments);
    }
    calcSectorPoints(center, normal, fromDir, radian, radius, segments) {
        let sectorPoints = [];
        sectorPoints.push(center);
        const arcPoints = this.calcArcPoints(center, normal, fromDir, radian, radius, segments);
        sectorPoints = sectorPoints.concat(arcPoints);
        return sectorPoints;
    }
    indicesFanToList(fanIndices) {
        const listIndices = Array((fanIndices.length - 2) * 3).fill(0);
        for (let i = 1; i < fanIndices.length - 1; i++) {
            listIndices[(i - 1) * 3] = 0;
            listIndices[(i - 1) * 3 + 1] = i;
            listIndices[(i - 1) * 3 + 2] = i + 1;
        }
        return listIndices;
    }
    // 扇形
    calcSectorData(center, normal, fromDir, radian, radius, segments) {
        return {
            positions: this.calcSectorPoints(center, normal, fromDir, radian, radius, segments),
            normals: Array(segments + 1).fill(normal.clone()),
            indices: this.indicesFanToList([...Array(segments + 1).keys()]),
            primitiveType: PrimitiveMode.TRIANGLE_LIST,
        };
    }
    arcDirectionLine(center, normal, fromDir, radian, radius, length, segments) {
        const vertices = [];
        const indices = [];
        // add direction line
        const arcPoints = this.calcArcPoints(center, normal, fromDir, radian, radius, segments);
        const endOffset = new cc_1.Vec3();
        cc_1.Vec3.multiplyScalar(endOffset, normal, length);
        for (let i = 0; i < arcPoints.length; i++) {
            const endPoint = new cc_1.Vec3();
            cc_1.Vec3.add(endPoint, arcPoints[i], endOffset);
            vertices.push(arcPoints[i], endPoint);
            indices.push(i * 2, i * 2 + 1);
        }
        // add arc
        for (let i = 1; i < arcPoints.length; i++) {
            vertices.push(arcPoints[i - 1]);
            indices.push(vertices.length - 1);
            vertices.push(arcPoints[i]);
            indices.push(vertices.length - 1);
        }
        return {
            positions: vertices,
            normals: Array(vertices.length).fill(new cc_1.Vec3(0, 1, 1)),
            indices,
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcBoxPoints(center, size) {
        const halfSize = new cc_1.Vec3();
        cc_1.Vec3.multiplyScalar(halfSize, size, 0.5);
        const points = [];
        points[0] = new cc_1.Vec3(center);
        points[0].add(new cc_1.Vec3(-halfSize.x, -halfSize.y, -halfSize.z));
        points[1] = new cc_1.Vec3(center);
        points[1].add(new cc_1.Vec3(-halfSize.x, halfSize.y, -halfSize.z));
        points[2] = new cc_1.Vec3(center);
        points[2].add(new cc_1.Vec3(halfSize.x, halfSize.y, -halfSize.z));
        points[3] = new cc_1.Vec3(center);
        points[3].add(new cc_1.Vec3(halfSize.x, -halfSize.y, -halfSize.z));
        points[4] = new cc_1.Vec3(center);
        points[4].add(new cc_1.Vec3(-halfSize.x, -halfSize.y, halfSize.z));
        points[5] = new cc_1.Vec3(center);
        points[5].add(new cc_1.Vec3(-halfSize.x, halfSize.y, halfSize.z));
        points[6] = new cc_1.Vec3(center);
        points[6].add(new cc_1.Vec3(halfSize.x, halfSize.y, halfSize.z));
        points[7] = new cc_1.Vec3(center);
        points[7].add(new cc_1.Vec3(halfSize.x, -halfSize.y, halfSize.z));
        return points;
    }
    wireframeBox(center, size) {
        const points = this.calcBoxPoints(center, size);
        const indices = [];
        for (let i = 1; i < 4; i++) {
            indices.push(i - 1, i);
        }
        indices.push(0, 3);
        for (let i = 5; i < 8; i++) {
            indices.push(i - 1, i);
        }
        indices.push(4, 7);
        for (let i = 0; i < 4; i++) {
            indices.push(i, i + 4);
        }
        return {
            positions: points,
            normals: Array(points.length).fill(new cc_1.Vec3(0, 1, 0)),
            indices,
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcFrustum(isOrtho, orthoHeight, fov, aspect, near, far, isFOVY) {
        const points = [];
        const indices = [];
        let nearHalfHeight;
        let nearHalfWidth;
        let farHalfHeight;
        let farHalfWidth;
        if (isOrtho) {
            nearHalfHeight = farHalfHeight = orthoHeight;
            nearHalfWidth = farHalfWidth = nearHalfHeight * aspect;
        }
        else {
            if (isFOVY) {
                nearHalfHeight = Math.tan(deg2rad(fov / 2)) * near;
                nearHalfWidth = nearHalfHeight * aspect;
                farHalfHeight = Math.tan(deg2rad(fov / 2)) * far;
                farHalfWidth = farHalfHeight * aspect;
            }
            else {
                nearHalfWidth = Math.tan(deg2rad(fov / 2)) * near;
                nearHalfHeight = nearHalfWidth / aspect;
                farHalfWidth = Math.tan(deg2rad(fov / 2)) * far;
                farHalfHeight = farHalfWidth / aspect;
            }
        }
        points[0] = new cc_1.Vec3(-nearHalfWidth, -nearHalfHeight, -near);
        points[1] = new cc_1.Vec3(-nearHalfWidth, nearHalfHeight, -near);
        points[2] = new cc_1.Vec3(nearHalfWidth, nearHalfHeight, -near);
        points[3] = new cc_1.Vec3(nearHalfWidth, -nearHalfHeight, -near);
        points[4] = new cc_1.Vec3(-farHalfWidth, -farHalfHeight, -far);
        points[5] = new cc_1.Vec3(-farHalfWidth, farHalfHeight, -far);
        points[6] = new cc_1.Vec3(farHalfWidth, farHalfHeight, -far);
        points[7] = new cc_1.Vec3(farHalfWidth, -farHalfHeight, -far);
        for (let i = 1; i < 4; i++) {
            indices.push(i - 1, i);
        }
        indices.push(0, 3);
        for (let i = 5; i < 8; i++) {
            indices.push(i - 1, i);
        }
        indices.push(4, 7);
        for (let i = 0; i < 4; i++) {
            indices.push(i, i + 4);
        }
        return {
            positions: points,
            indices,
            normals: Array(points.length).fill(new cc_1.Vec3(0, 1, 0)),
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcRectanglePoints(center, rotation, size) {
        const right = new cc_1.Vec3(size.x / 2, 0, 0);
        const up = new cc_1.Vec3(0, size.y / 2, 0);
        cc_1.Vec3.transformQuat(right, right, rotation);
        cc_1.Vec3.transformQuat(up, up, rotation);
        const vertices = [];
        vertices[0] = center.clone();
        vertices[0].add(right);
        vertices[0].add(up);
        vertices[1] = center.clone();
        vertices[1].add(right);
        vertices[1].subtract(up);
        vertices[2] = center.clone();
        vertices[2].subtract(right);
        vertices[2].subtract(up);
        vertices[3] = center.clone();
        vertices[3].subtract(right);
        vertices[3].add(up);
        const indices = [];
        for (let i = 1; i < 4; i++) {
            indices.push(i - 1, i);
        }
        indices.push(0, 3);
        return { vertices, indices };
    }
    calcRectangleData(center, rotation, size) {
        const rectData = this.calcRectanglePoints(center, rotation, size);
        return {
            positions: rectData.vertices,
            normals: Array(rectData.vertices.length).fill(new cc_1.Vec3(0, 1, 0)),
            indices: rectData.indices,
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcSphereData(center, radius = 0.5, opts = {}) {
        const segments = opts.segments !== undefined ? opts.segments : 32;
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const minPos = new cc_1.Vec3(-radius, -radius, -radius);
        const maxPos = new cc_1.Vec3(radius, radius, radius);
        const boundingRadius = radius;
        for (let lat = 0; lat <= segments; ++lat) {
            const theta = (lat * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = -Math.cos(theta);
            for (let lon = 0; lon <= segments; ++lon) {
                const phi = (lon * 2 * Math.PI) / segments - Math.PI / 2.0;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = sinPhi * sinTheta;
                const y = cosTheta;
                const z = cosPhi * sinTheta;
                const u = lon / segments;
                const v = lat / segments;
                positions.push(new cc_1.Vec3(center.x + x * radius, center.y + y * radius, center.z + z * radius));
                normals.push(new cc_1.Vec3(x, y, z));
                uvs.push(new cc_1.Vec2(u, v));
                if (lat < segments && lon < segments) {
                    const seg1 = segments + 1;
                    const a = seg1 * lat + lon;
                    const b = seg1 * (lat + 1) + lon;
                    const c = seg1 * (lat + 1) + lon + 1;
                    const d = seg1 * lat + lon + 1;
                    indices.push(a, d, b);
                    indices.push(d, c, b);
                }
            }
        }
        return {
            positions,
            indices,
            normals,
            uvs,
            minPos,
            maxPos,
            boundingRadius,
        };
    }
    // calculate shape data
    calcArcData(center, normal, fromDir, radian, radius, segments = 60) {
        cc_1.Vec3.normalize(tempVec3_a, fromDir);
        cc_1.Vec3.normalize(tempVec3_b, normal);
        const deltaRot = tempQuat_a;
        const count = segments;
        cc_1.Quat.fromAxisAngle(deltaRot, tempVec3_b, radian / (count - 1));
        const tangent = new cc_1.Vec3();
        cc_1.Vec3.multiplyScalar(tangent, tempVec3_a, radius);
        const arcPoints = [];
        for (let i = 0; i < count; i++) {
            arcPoints[i] = center.clone();
            arcPoints[i].add(tangent);
            cc_1.Vec3.transformQuat(tangent, tangent, deltaRot);
        }
        return {
            positions: arcPoints,
            normals: Array(segments).fill(new cc_1.Vec3(tempVec3_b)),
            indices: [...Array(segments).keys()],
            primitiveType: PrimitiveMode.LINE_STRIP,
        };
    }
    calcCircleData(center, normal, radius, segments = 60) {
        const biNormal = this.getBiNormalByNormal(normal);
        return this.calcArcData(center, normal, biNormal, TWO_PI, radius, segments);
    }
    calcLinesData(vertices, indices, needBoundingBoxData = true) {
        const lineData = {
            positions: vertices,
            normals: Array(vertices.length).fill(new cc_1.Vec3(0, 1, 0)),
            indices,
            primitiveType: PrimitiveMode.LINE_LIST,
        };
        if (needBoundingBoxData) {
            const minPos = new cc_1.Vec3();
            const maxPos = new cc_1.Vec3();
            if (vertices.length > 0) {
                minPos.set(vertices[0]);
                maxPos.set(vertices[0]);
                for (let i = 1; i < vertices.length; i++) {
                    cc_1.Vec3.min(minPos, minPos, vertices[i]);
                    cc_1.Vec3.max(maxPos, maxPos, vertices[i]);
                }
            }
            lineData.minPos = minPos;
            lineData.maxPos = maxPos;
        }
        return lineData;
    }
    calcDiscData(center, normal, radius, segments = 60) {
        const biNormal = this.getBiNormalByNormal(normal);
        const maxPos = new cc_1.Vec3(radius, radius, 0);
        const minPos = new cc_1.Vec3(-radius, -radius, 0);
        cc_1.Quat.rotationTo(tempQuat_a, cc_1.Vec3.UNIT_Z, normal);
        cc_1.Vec3.add(maxPos, maxPos, center);
        cc_1.Vec3.transformQuat(maxPos, maxPos, tempQuat_a);
        cc_1.Vec3.add(minPos, minPos, center);
        cc_1.Vec3.transformQuat(minPos, minPos, tempQuat_a);
        return {
            positions: this.calcSectorPoints(center, normal, biNormal, TWO_PI, radius, segments),
            normals: Array(segments + 1).fill(normal.clone()),
            indices: this.indicesFanToList([...Array(segments + 1).keys()]),
            primitiveType: PrimitiveMode.TRIANGLE_LIST,
            minPos,
            maxPos,
        };
    }
    calcLineData(startPos, endPos) {
        const minPos = new cc_1.Vec3();
        const maxPos = new cc_1.Vec3();
        cc_1.Vec3.min(minPos, startPos, endPos);
        cc_1.Vec3.max(maxPos, startPos, endPos);
        cc_1.Vec3.subtract(tempVec3, maxPos, minPos);
        const parts = [];
        // 和轴平行的线需要一个不为0的包围盒
        const xyz = ['x', 'y', 'z'];
        xyz.forEach((part) => {
            // @ts-expect-error
            if (tempVec3[part] === 0) {
                parts.push(part);
            }
        });
        if (parts.length === 2) {
            parts.forEach((part) => {
                // @ts-expect-error
                minPos[part] -= 0.5;
                // @ts-expect-error
                maxPos[part] += 0.5;
            });
        }
        return {
            positions: [new cc_1.Vec3(startPos.x, startPos.y, startPos.z), new cc_1.Vec3(endPos.x, endPos.y, endPos.z)],
            normals: Array(2).fill(new cc_1.Vec3(0, 1, 0)),
            indices: [0, 1],
            minPos,
            maxPos,
            primitiveType: PrimitiveMode.LINE_LIST,
        };
    }
    calcPolygonData(points, indices) {
        const minPos = new cc_1.Vec3();
        const maxPos = new cc_1.Vec3();
        points.forEach((point) => {
            cc_1.Vec3.min(minPos, minPos, point);
            cc_1.Vec3.max(maxPos, maxPos, point);
        });
        let finalIndices;
        if (indices) {
            finalIndices = indices;
        }
        else {
            finalIndices = [...points.keys()];
        }
        return {
            positions: points,
            normals: Array(points.length).fill(new cc_1.Vec3(0, 1, 0)),
            indices: finalIndices,
            minPos,
            maxPos,
            primitiveType: PrimitiveMode.TRIANGLE_LIST,
        };
    }
    /**
     * calculate the data of octahedron
     * https://en.wikipedia.org/wiki/Octahedron
     * @param lowerPoint The lower apex's position.
     * @param upperPoint The upper apex's position.
     * @param width The width of the polygonal base
     * @param length The length of the polygonal base
     * @param ratio The height ratio of the downside pyramid. Usually in interval [0, 1].
     */
    calcOctahedronData(lowerPoint, upperPoint, width, length, ratio = 0.2) {
        const halfWidth = width / 2.0;
        const halfLength = length / 2.0;
        const minPos = new cc_1.Vec3();
        const maxPos = new cc_1.Vec3();
        const positions = [
            new cc_1.Vec3(0.0, 0.0, 0.0), // lowerApex
            new cc_1.Vec3(0.0, 1.0, 0.0), // upperApex
            new cc_1.Vec3(halfWidth, ratio, halfLength), // v0
            new cc_1.Vec3(-halfWidth, ratio, halfLength), // v1
            new cc_1.Vec3(-halfWidth, ratio, -halfLength), // v2
            new cc_1.Vec3(halfWidth, ratio, -halfLength), // v3
        ];
        const dir = cc_1.Vec3.subtract(new cc_1.Vec3(), upperPoint, lowerPoint);
        const dirLen = cc_1.Vec3.len(dir);
        cc_1.Vec3.normalize(dir, dir);
        const rot = cc_1.Quat.rotationTo(new cc_1.Quat(), cc_1.Vec3.UNIT_Y, dir);
        const transform = cc_1.Mat4.fromRTS(new cc_1.Mat4(), rot, lowerPoint, new cc_1.Vec3(dirLen, dirLen, dirLen));
        for (let i = 0; i < positions.length; ++i) {
            const p = positions[i];
            cc_1.Vec3.transformMat4(p, p, transform);
            cc_1.Vec3.min(minPos, minPos, p);
            cc_1.Vec3.max(maxPos, maxPos, p);
        }
        const lowerApex = 0;
        const upperApex = 1;
        const v0 = 2;
        const v1 = 3;
        const v2 = 4;
        const v3 = 5;
        const faceVertices = [
            v0, v1, lowerApex,
            v1, v2, lowerApex,
            v2, v3, lowerApex,
            v3, v0, lowerApex,
            upperApex, v1, v0,
            upperApex, v2, v1,
            upperApex, v3, v2,
            upperApex, v0, v3,
        ];
        const nFaceVertices = faceVertices.length;
        const vertices = new Array(3 * nFaceVertices).fill(0.0);
        for (let iFaceVertex = 0; iFaceVertex < nFaceVertices; ++iFaceVertex) {
            const positionIndex = faceVertices[iFaceVertex];
            vertices[3 * iFaceVertex] = positions[positionIndex].x;
            vertices[3 * iFaceVertex + 1] = positions[positionIndex].y;
            vertices[3 * iFaceVertex + 2] = positions[positionIndex].z;
        }
        // 简化版法线计算（不依赖 External.GeometryUtils.calculateNormals）
        const normals = calculateTriangleNormals(vertices, nFaceVertices);
        const vec3Normals = [];
        for (let i = 0; i < normals.length; i += 3) {
            vec3Normals.push(new cc_1.Vec3(normals[i], normals[i + 1], normals[i + 2]));
        }
        const vec3Positions = faceVertices.map((index) => positions[index]);
        const indices = [...Array(vec3Positions.length).keys()];
        return {
            primitiveType: PrimitiveMode.TRIANGLE_LIST,
            positions: vec3Positions,
            normals: vec3Normals,
            indices,
            minPos,
            maxPos,
        };
    }
}
/**
 * 简化版三角形法线计算
 */
function calculateTriangleNormals(vertices, nFaceVertices) {
    const normals = new Array(vertices.length).fill(0.0);
    const indices = Array.from({ length: nFaceVertices }, (_, i) => i);
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        const ax = vertices[i0 * 3], ay = vertices[i0 * 3 + 1], az = vertices[i0 * 3 + 2];
        const bx = vertices[i1 * 3], by = vertices[i1 * 3 + 1], bz = vertices[i1 * 3 + 2];
        const cx = vertices[i2 * 3], cy = vertices[i2 * 3 + 1], cz = vertices[i2 * 3 + 2];
        const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
        const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;
        for (const idx of [i0, i1, i2]) {
            normals[idx * 3] += nx;
            normals[idx * 3 + 1] += ny;
            normals[idx * 3 + 2] += nz;
        }
    }
    // normalize
    for (let i = 0; i < normals.length; i += 3) {
        const len = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
        if (len > EPSILON) {
            normals[i] /= len;
            normals[i + 1] /= len;
            normals[i + 2] /= len;
        }
    }
    return normals;
}
exports.default = new ControllerShape();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci1zaGFwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9naXptby91dGlscy9jb250cm9sbGVyLXNoYXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFFYiwyQkFBNEQ7QUFHNUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQzFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBRTFCLE1BQU0sYUFBYSxHQUFHLFFBQUcsQ0FBQyxhQUFhLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDOUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUM5QixNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBRTlCLFNBQVMsT0FBTyxDQUFDLEdBQVc7SUFDeEIsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxNQUFNLGVBQWU7SUFDVixnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLFlBQVksR0FBRyxHQUFHLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxPQUFZLEVBQUU7UUFDbkYs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LENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLFNBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksU0FBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksU0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksU0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxTQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFNBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLFNBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksU0FBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLFNBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksU0FBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxTQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFNBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3RCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRU0sWUFBWSxDQUFDLE1BQVksRUFBRSxJQUFVO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUVuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FB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LENBQUMsQ0FBQztRQUMxQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTFCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsRixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEYsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRWxGLE1BQU0sR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDbEQsTUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUVsRCxNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDakMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2pDLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUVqQyxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMzQixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0IsQ0FBQztJQUNMLENBQUM7SUFFRCxZQUFZO0lBQ1osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25GLElBQUksR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7WUFDbEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7WUFDdEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7UUFDMUIsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBRUQsa0JBQWUsSUFBSSxlQUFlLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZ2Z4LCBJVmVjM0xpa2UsIE1hdDQsIFF1YXQsIFZlYzIsIFZlYzMgfSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IElNZXNoUHJpbWl0aXZlIH0gZnJvbSAnLi9kZWZpbmVzJztcblxuY29uc3QgRVBTSUxPTiA9IDFlLTY7XG5jb25zdCBUV09fUEkgPSBNYXRoLlBJICogMjtcbmNvbnN0IEhBTEZfUEkgPSBNYXRoLlBJIC8gMjtcbmNvbnN0IEQyUiA9IE1hdGguUEkgLyAxODA7XG5jb25zdCBSMkQgPSAxODAgLyBNYXRoLlBJO1xuXG5jb25zdCBQcmltaXRpdmVNb2RlID0gZ2Z4LlByaW1pdGl2ZU1vZGU7XG5jb25zdCB2M19mb3J3YXJkID0gbmV3IFZlYzMoMCwgMCwgMSk7XG5jb25zdCB0ZW1wVmVjMyA9IG5ldyBWZWMzKCk7XG5jb25zdCB0ZW1wVmVjM19hID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBWZWMzX2IgPSBuZXcgVmVjMygpO1xuY29uc3QgdGVtcFF1YXRfYSA9IG5ldyBRdWF0KCk7XG5cbmZ1bmN0aW9uIGRlZzJyYWQoZGVnOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBkZWcgKiBEMlI7XG59XG5cbmNsYXNzIENvbnRyb2xsZXJTaGFwZSB7XG4gICAgcHVibGljIGNhbGNDeWxpbmRlckRhdGEocmFkaXVzVG9wID0gMC41LCByYWRpdXNCb3R0b20gPSAwLjUsIGhlaWdodCA9IDIsIG9wdHM6IGFueSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGhhbGZIZWlnaHQgPSBoZWlnaHQgKiAwLjU7XG4gICAgICAgIGNvbnN0IHJhZGlhbFNlZ21lbnRzID0gb3B0cy5yYWRpYWxTZWdtZW50cyB8fCAxNjtcbiAgICAgICAgY29uc3QgaGVpZ2h0U2VnbWVudHMgPSBvcHRzLmhlaWdodFNlZ21lbnRzIHx8IDE7XG4gICAgICAgIGNvbnN0IGNhcHBlZCA9IG9wdHMuY2FwcGVkICE9PSB1bmRlZmluZWQgPyBvcHRzLmNhcHBlZCA6IHRydWU7XG4gICAgICAgIGNvbnN0IGFyYyA9IG9wdHMuYXJjIHx8IDIuMCAqIE1hdGguUEk7XG5cbiAgICAgICAgbGV0IGNudENhcCA9IDA7XG4gICAgICAgIGlmICghY2FwcGVkKSB7XG4gICAgICAgICAgICBpZiAocmFkaXVzVG9wID4gMCkge1xuICAgICAgICAgICAgICAgIGNudENhcCsrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmFkaXVzQm90dG9tID4gMCkge1xuICAgICAgICAgICAgICAgIGNudENhcCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHZlcnRleCBjb3VudFxuICAgICAgICBsZXQgdmVydENvdW50ID0gKHJhZGlhbFNlZ21lbnRzICsgMSkgKiAoaGVpZ2h0U2VnbWVudHMgKyAxKTtcbiAgICAgICAgaWYgKGNhcHBlZCkge1xuICAgICAgICAgICAgdmVydENvdW50ICs9IChyYWRpYWxTZWdtZW50cyArIDEpICogY250Q2FwICsgcmFkaWFsU2VnbWVudHMgKiBjbnRDYXA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYWxjdWxhdGUgaW5kZXggY291bnRcbiAgICAgICAgbGV0IGluZGV4Q291bnQgPSByYWRpYWxTZWdtZW50cyAqIGhlaWdodFNlZ21lbnRzICogMiAqIDM7XG4gICAgICAgIGlmIChjYXBwZWQpIHtcbiAgICAgICAgICAgIGluZGV4Q291bnQgKz0gcmFkaWFsU2VnbWVudHMgKiBjbnRDYXAgKiAzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IG5ldyBBcnJheShpbmRleENvdW50KTtcbiAgICAgICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEFycmF5KHZlcnRDb3VudCk7XG4gICAgICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgQXJyYXkodmVydENvdW50KTtcbiAgICAgICAgY29uc3QgdXZzID0gbmV3IEFycmF5KHZlcnRDb3VudCk7XG4gICAgICAgIGNvbnN0IG1heFJhZGl1cyA9IE1hdGgubWF4KHJhZGl1c1RvcCwgcmFkaXVzQm90dG9tKTtcbiAgICAgICAgY29uc3QgbWluUG9zID0gbmV3IFZlYzMoLW1heFJhZGl1cywgLWhhbGZIZWlnaHQsIC1tYXhSYWRpdXMpO1xuICAgICAgICBjb25zdCBtYXhQb3MgPSBuZXcgVmVjMyhtYXhSYWRpdXMsIGhhbGZIZWlnaHQsIG1heFJhZGl1cyk7XG5cbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgbGV0IGluZGV4T2Zmc2V0ID0gMDtcblxuICAgICAgICBnZW5lcmF0ZVRvcnNvKCk7XG5cbiAgICAgICAgaWYgKGNhcHBlZCkge1xuICAgICAgICAgICAgaWYgKHJhZGl1c0JvdHRvbSA+IDApIHtcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUNhcChmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyYWRpdXNUb3AgPiAwKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVDYXAodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyBpbnRlcm5hbCBmdW5jdGlvbnNcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZVRvcnNvKCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXhBcnJheTogbnVtYmVyW11bXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgYmUgdXNlZCB0byBjYWxjdWxhdGUgdGhlIG5vcm1hbFxuICAgICAgICAgICAgY29uc3Qgc2xvcGUgPSAocmFkaXVzVG9wIC0gcmFkaXVzQm90dG9tKSAvIGhlaWdodDtcblxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgcG9zaXRpb25zLCBub3JtYWxzIGFuZCB1dnNcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDw9IGhlaWdodFNlZ21lbnRzOyB5KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleFJvdzogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0geSAvIGhlaWdodFNlZ21lbnRzO1xuXG4gICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHRoZSByYWRpdXMgb2YgdGhlIGN1cnJlbnQgcm93XG4gICAgICAgICAgICAgICAgY29uc3QgcmFkaXVzID0gdiAqIChyYWRpdXNUb3AgLSByYWRpdXNCb3R0b20pICsgcmFkaXVzQm90dG9tO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPD0gcmFkaWFsU2VnbWVudHM7ICsreCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1ID0geCAvIHJhZGlhbFNlZ21lbnRzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGV0YSA9IHUgKiBhcmM7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHZlcnRleFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnNbaW5kZXhdID0gbmV3IFZlYzMocmFkaXVzICogc2luVGhldGEsIHYgKiBoZWlnaHQgLSBoYWxmSGVpZ2h0LCByYWRpdXMgKiBjb3NUaGV0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gbm9ybWFsXG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbHNbaW5kZXhdID0gbmV3IFZlYzMoc2luVGhldGEsIC1zbG9wZSwgY29zVGhldGEpO1xuICAgICAgICAgICAgICAgICAgICBub3JtYWxzW2luZGV4XS5ub3JtYWxpemUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB1dlxuICAgICAgICAgICAgICAgICAgICB1dnNbaW5kZXhdID0gbmV3IFZlYzIoKCgxIC0gdSkgKiAyKSAlIDEsIHYpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhdmUgaW5kZXggb2YgdmVydGV4IGluIHJlc3BlY3RpdmUgcm93XG4gICAgICAgICAgICAgICAgICAgIGluZGV4Um93LnB1c2goaW5kZXgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGluY3JlYXNlIGluZGV4XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gbm93IHNhdmUgcG9zaXRpb25zIG9mIHRoZSByb3cgaW4gb3VyIGluZGV4IGFycmF5XG4gICAgICAgICAgICAgICAgaW5kZXhBcnJheS5wdXNoKGluZGV4Um93KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgaW5kaWNlc1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHRTZWdtZW50czsgKyt5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCByYWRpYWxTZWdtZW50czsgKyt4KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIHVzZSB0aGUgaW5kZXggYXJyYXkgdG8gYWNjZXNzIHRoZSBjb3JyZWN0IGluZGljZXNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaTEgPSBpbmRleEFycmF5W3ldW3hdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpMiA9IGluZGV4QXJyYXlbeSArIDFdW3hdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpMyA9IGluZGV4QXJyYXlbeSArIDFdW3ggKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaTQgPSBpbmRleEFycmF5W3ldW3ggKyAxXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmYWNlIG9uZVxuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGkxO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGk0O1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGkyO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZhY2UgdHdvXG4gICAgICAgICAgICAgICAgICAgIGluZGljZXNbaW5kZXhPZmZzZXRdID0gaTQ7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGluZGljZXNbaW5kZXhPZmZzZXRdID0gaTM7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGluZGljZXNbaW5kZXhPZmZzZXRdID0gaTI7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVDYXAodG9wOiBib29sZWFuKSB7XG4gICAgICAgICAgICBjb25zdCByYWRpdXMgPSB0b3AgPyByYWRpdXNUb3AgOiByYWRpdXNCb3R0b207XG4gICAgICAgICAgICBjb25zdCBzaWduID0gdG9wID8gMSA6IC0xO1xuXG4gICAgICAgICAgICAvLyBzYXZlIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgY2VudGVyIHZlcnRleFxuICAgICAgICAgICAgY29uc3QgY2VudGVySW5kZXhTdGFydCA9IGluZGV4O1xuXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMTsgeCA8PSByYWRpYWxTZWdtZW50czsgKyt4KSB7XG4gICAgICAgICAgICAgICAgLy8gdmVydGV4XG4gICAgICAgICAgICAgICAgcG9zaXRpb25zW2luZGV4XSA9IG5ldyBWZWMzKDAsIGhhbGZIZWlnaHQgKiBzaWduLCAwKTtcblxuICAgICAgICAgICAgICAgIC8vIG5vcm1hbFxuICAgICAgICAgICAgICAgIG5vcm1hbHNbaW5kZXhdID0gbmV3IFZlYzMoMCwgc2lnbiwgMCk7XG5cbiAgICAgICAgICAgICAgICAvLyB1dlxuICAgICAgICAgICAgICAgIHV2c1tpbmRleF0gPSBuZXcgVmVjMigwLjUsIDAuNSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpbmNyZWFzZSBpbmRleFxuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgdGhlIGluZGV4IG9mIHRoZSBsYXN0IGNlbnRlciB2ZXJ0ZXhcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlckluZGV4RW5kID0gaW5kZXg7XG5cbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IHJhZGlhbFNlZ21lbnRzOyArK3gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1ID0geCAvIHJhZGlhbFNlZ21lbnRzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRoZXRhID0gdSAqIGFyYztcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgICAgICAgICAgICAgLy8gdmVydGV4XG4gICAgICAgICAgICAgICAgcG9zaXRpb25zW2luZGV4XSA9IG5ldyBWZWMzKHJhZGl1cyAqIHNpblRoZXRhLCBoYWxmSGVpZ2h0ICogc2lnbiwgcmFkaXVzICogY29zVGhldGEpO1xuXG4gICAgICAgICAgICAgICAgLy8gbm9ybWFsXG4gICAgICAgICAgICAgICAgbm9ybWFsc1tpbmRleF0gPSBuZXcgVmVjMygwLCBzaWduLCAwKTtcblxuICAgICAgICAgICAgICAgIC8vIHV2XG4gICAgICAgICAgICAgICAgdXZzW2luZGV4XSA9IG5ldyBWZWMyKDAuNSAtIHNpblRoZXRhICogMC41ICogc2lnbiwgMC41ICsgY29zVGhldGEgKiAwLjUpO1xuXG4gICAgICAgICAgICAgICAgLy8gaW5jcmVhc2UgaW5kZXhcbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSBpbmRpY2VzXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHJhZGlhbFNlZ21lbnRzOyArK3gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gY2VudGVySW5kZXhTdGFydCArIHg7XG4gICAgICAgICAgICAgICAgY29uc3QgaSA9IGNlbnRlckluZGV4RW5kICsgeDtcblxuICAgICAgICAgICAgICAgIGlmICh0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmFjZSB0b3BcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlc1tpbmRleE9mZnNldF0gPSBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleE9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlc1tpbmRleE9mZnNldF0gPSBjO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmFjZSBib3R0b21cbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlc1tpbmRleE9mZnNldF0gPSBjO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzW2luZGV4T2Zmc2V0XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9ucyxcbiAgICAgICAgICAgIG5vcm1hbHMsXG4gICAgICAgICAgICB1dnMsXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgbWluUG9zLFxuICAgICAgICAgICAgbWF4UG9zLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjQ29uZURhdGEocmFkaXVzOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBvcHRzOiBhbnkgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWxjQ3lsaW5kZXJEYXRhKDAsIHJhZGl1cywgaGVpZ2h0LCBvcHRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnlJ/miJAgTWVzaFJlbmRlcmVyIOaJgOmcgOimgeeahCBwb3NpdGlvbiDmlbDmja5cbiAgICAgKi9cbiAgICBwdWJsaWMgY2FsY1Bvc2l0aW9uRGF0YShjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbm9ybWFsOiBSZWFkb25seTxWZWMzPiA9IG5ldyBWZWMzKDAsIDAsIDEpLCBuZWVkQm91bmRpbmdCb3ggPSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGh3ID0gd2lkdGggLyAyO1xuICAgICAgICBjb25zdCBoaCA9IGhlaWdodCAvIDI7XG4gICAgICAgIGNvbnN0IHBvaW50cyA9IFtdO1xuICAgICAgICBjb25zdCByb3QgPSB0ZW1wUXVhdF9hO1xuICAgICAgICBRdWF0LnJvdGF0aW9uVG8ocm90LCB2M19mb3J3YXJkLCBub3JtYWwpO1xuICAgICAgICBwb2ludHNbMF0gPSBjZW50ZXIuY2xvbmUoKTtcbiAgICAgICAgcG9pbnRzWzBdLmFkZChWZWMzLnRyYW5zZm9ybVF1YXQodGVtcFZlYzMsIG5ldyBWZWMzKC1odywgaGgsIDApLCByb3QpKTtcbiAgICAgICAgcG9pbnRzWzFdID0gY2VudGVyLmNsb25lKCk7XG4gICAgICAgIHBvaW50c1sxXS5hZGQoVmVjMy50cmFuc2Zvcm1RdWF0KHRlbXBWZWMzLCBuZXcgVmVjMygtaHcsIC1oaCwgMCksIHJvdCkpO1xuICAgICAgICBwb2ludHNbMl0gPSBjZW50ZXIuY2xvbmUoKTtcbiAgICAgICAgcG9pbnRzWzJdLmFkZChWZWMzLnRyYW5zZm9ybVF1YXQodGVtcFZlYzMsIG5ldyBWZWMzKGh3LCAtaGgsIDApLCByb3QpKTtcbiAgICAgICAgcG9pbnRzWzNdID0gY2VudGVyLmNsb25lKCk7XG4gICAgICAgIHBvaW50c1szXS5hZGQoVmVjMy50cmFuc2Zvcm1RdWF0KHRlbXBWZWMzLCBuZXcgVmVjMyhodywgaGgsIDApLCByb3QpKTtcblxuICAgICAgICBsZXQgbWluUG9zLCBtYXhQb3M7XG5cbiAgICAgICAgaWYgKG5lZWRCb3VuZGluZ0JveCkge1xuICAgICAgICAgICAgbWluUG9zID0gY2VudGVyLmNsb25lKCk7XG4gICAgICAgICAgICBtaW5Qb3MuYWRkKFZlYzMudHJhbnNmb3JtUXVhdCh0ZW1wVmVjMywgbmV3IFZlYzMoLWh3LCAtaGgsIC0wLjAxKSwgcm90KSk7XG4gICAgICAgICAgICBtYXhQb3MgPSBjZW50ZXIuY2xvbmUoKTtcbiAgICAgICAgICAgIG1heFBvcy5hZGQoVmVjMy50cmFuc2Zvcm1RdWF0KHRlbXBWZWMzLCBuZXcgVmVjMyhodywgaGgsIDAuMDEpLCByb3QpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBwb2ludHMsXG4gICAgICAgICAgICBtaW5Qb3M6IG1pblBvcyxcbiAgICAgICAgICAgIG1heFBvczogbWF4UG9zLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjUXVhZERhdGEoY2VudGVyOiBSZWFkb25seTxWZWMzPiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIG5vcm1hbDogUmVhZG9ubHk8VmVjMz4gPSBuZXcgVmVjMygwLCAwLCAxKSwgbmVlZEJvdW5kaW5nQm94ID0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gWzAsIDMsIDEsIDMsIDIsIDFdO1xuICAgICAgICBjb25zdCB1dnMgPSBbbmV3IFZlYzIoMCwgMSksIG5ldyBWZWMyKDAsIDApLCBuZXcgVmVjMigxLCAwKSwgbmV3IFZlYzIoMSwgMSldO1xuICAgICAgICBjb25zdCB7IHBvc2l0aW9ucywgbWluUG9zLCBtYXhQb3MgfSA9IHRoaXMuY2FsY1Bvc2l0aW9uRGF0YShjZW50ZXIsIHdpZHRoLCBoZWlnaHQsIG5vcm1hbCwgbmVlZEJvdW5kaW5nQm94KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zLFxuICAgICAgICAgICAgbm9ybWFsczogQXJyYXkoNCkuZmlsbChub3JtYWwpLFxuICAgICAgICAgICAgaW5kaWNlcyxcbiAgICAgICAgICAgIG1pblBvcyxcbiAgICAgICAgICAgIG1heFBvcyxcbiAgICAgICAgICAgIHV2cyxcbiAgICAgICAgICAgIGRvdWJsZVNpZGVkOiB0cnVlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBsaW5lV2l0aEJvdW5kaW5nQm94KGxlbmd0aDogbnVtYmVyLCBzaXplID0gMykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBbbmV3IFZlYzMoKSwgbmV3IFZlYzMobGVuZ3RoLCAwLCAwKV0sXG4gICAgICAgICAgICBub3JtYWxzOiBBcnJheSgyKS5maWxsKG5ldyBWZWMzKDAsIDEsIDApKSxcbiAgICAgICAgICAgIGluZGljZXM6IFswLCAxXSxcbiAgICAgICAgICAgIG1pblBvczogbmV3IFZlYzMoMCwgLXNpemUsIC1zaXplKSxcbiAgICAgICAgICAgIG1heFBvczogbmV3IFZlYzMobGVuZ3RoLCBzaXplLCBzaXplKSxcbiAgICAgICAgICAgIHByaW1pdGl2ZVR5cGU6IFByaW1pdGl2ZU1vZGUuTElORV9MSVNULFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjQ3ViZURhdGEod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBjZW50ZXI/OiBJVmVjM0xpa2UsIG9wdHM6IGFueSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IHdzID0gb3B0cy53aWR0aFNlZ21lbnRzID8gb3B0cy53aWR0aFNlZ21lbnRzIDogMTtcbiAgICAgICAgY29uc3QgaHMgPSBvcHRzLmhlaWdodFNlZ21lbnRzID8gb3B0cy5oZWlnaHRTZWdtZW50cyA6IDE7XG4gICAgICAgIGNvbnN0IGxzID0gb3B0cy5sZW5ndGhTZWdtZW50cyA/IG9wdHMubGVuZ3RoU2VnbWVudHMgOiAxO1xuXG4gICAgICAgIGNvbnN0IGh3ID0gd2lkdGggKiAwLjU7XG4gICAgICAgIGNvbnN0IGhoID0gaGVpZ2h0ICogMC41O1xuICAgICAgICBjb25zdCBobCA9IGxlbmd0aCAqIDAuNTtcblxuICAgICAgICBjb25zdCBjb3JuZXJzID0gW1xuICAgICAgICAgICAgbmV3IFZlYzMoLWh3LCAtaGgsIGhsKSxcbiAgICAgICAgICAgIG5ldyBWZWMzKGh3LCAtaGgsIGhsKSxcbiAgICAgICAgICAgIG5ldyBWZWMzKGh3LCBoaCwgaGwpLFxuICAgICAgICAgICAgbmV3IFZlYzMoLWh3LCBoaCwgaGwpLFxuICAgICAgICAgICAgbmV3IFZlYzMoaHcsIC1oaCwgLWhsKSxcbiAgICAgICAgICAgIG5ldyBWZWMzKC1odywgLWhoLCAtaGwpLFxuICAgICAgICAgICAgbmV3IFZlYzMoLWh3LCBoaCwgLWhsKSxcbiAgICAgICAgICAgIG5ldyBWZWMzKGh3LCBoaCwgLWhsKSxcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBmYWNlQXhpcyA9IFtcbiAgICAgICAgICAgIFsyLCAzLCAxXSwgLy8gRlJPTlRcbiAgICAgICAgICAgIFs0LCA1LCA3XSwgLy8gQkFDS1xuICAgICAgICAgICAgWzcsIDYsIDJdLCAvLyBUT1BcbiAgICAgICAgICAgIFsxLCAwLCA0XSwgLy8gQk9UVE9NXG4gICAgICAgICAgICBbMSwgNCwgMl0sIC8vIFJJR0hUXG4gICAgICAgICAgICBbNSwgMCwgNl0sIC8vIExFRlRcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBmYWNlTm9ybWFscyA9IFtcbiAgICAgICAgICAgIG5ldyBWZWMzKDAsIDAsIDEpLCAvLyBGUk9OVFxuICAgICAgICAgICAgbmV3IFZlYzMoMCwgMCwgLTEpLCAvLyBCQUNLXG4gICAgICAgICAgICBuZXcgVmVjMygwLCAxLCAwKSwgLy8gVE9QXG4gICAgICAgICAgICBuZXcgVmVjMygwLCAtMSwgMCksIC8vIEJPVFRPTVxuICAgICAgICAgICAgbmV3IFZlYzMoMSwgMCwgMCksIC8vIFJJR0hUXG4gICAgICAgICAgICBuZXcgVmVjMygtMSwgMCwgMCksIC8vIExFRlRcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbnM6IFZlYzNbXSA9IFtdO1xuICAgICAgICBjb25zdCBub3JtYWxzOiBWZWMzW10gPSBbXTtcbiAgICAgICAgY29uc3QgdXZzOiBWZWMyW10gPSBbXTtcbiAgICAgICAgY29uc3QgaW5kaWNlczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgbWluUG9zID0gbmV3IFZlYzMoLWh3LCAtaGgsIC1obCk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKGh3LCBoaCwgaGwpO1xuXG4gICAgICAgIGZ1bmN0aW9uIF9idWlsZFBsYW5lKHNpZGU6IG51bWJlciwgdVNlZ21lbnRzOiBudW1iZXIsIHZTZWdtZW50czogbnVtYmVyKSB7XG4gICAgICAgICAgICBsZXQgdTtcbiAgICAgICAgICAgIGxldCB2O1xuICAgICAgICAgICAgbGV0IGl4O1xuICAgICAgICAgICAgbGV0IGl5O1xuICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gcG9zaXRpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGZhY2VBeGlzW3NpZGVdO1xuICAgICAgICAgICAgY29uc3QgZmFjZU5vcm1hbCA9IGZhY2VOb3JtYWxzW3NpZGVdO1xuXG4gICAgICAgICAgICBjb25zdCB0MSA9IHRlbXBWZWMzX2E7XG4gICAgICAgICAgICBjb25zdCB0MiA9IHRlbXBWZWMzX2I7XG4gICAgICAgICAgICBmb3IgKGl5ID0gMDsgaXkgPD0gdlNlZ21lbnRzOyBpeSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpeCA9IDA7IGl4IDw9IHVTZWdtZW50czsgaXgrKykge1xuICAgICAgICAgICAgICAgICAgICB1ID0gaXggLyB1U2VnbWVudHM7XG4gICAgICAgICAgICAgICAgICAgIHYgPSBpeSAvIHZTZWdtZW50cztcblxuICAgICAgICAgICAgICAgICAgICBWZWMzLmxlcnAodDEsIGNvcm5lcnNbaWR4WzBdXSwgY29ybmVyc1tpZHhbMV1dLCB1KTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5sZXJwKHQyLCBjb3JuZXJzW2lkeFswXV0sIGNvcm5lcnNbaWR4WzJdXSwgdik7XG4gICAgICAgICAgICAgICAgICAgIHQyLnN1YnRyYWN0KGNvcm5lcnNbaWR4WzBdXSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IG5ldyBWZWMzKHQxKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZU5vcm1hbC5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICBwb3MuYWRkKHQyKTtcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG5vcm1hbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjZW50ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlYzMuYWRkKHBvcywgY2VudGVyLCBwb3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHBvcyk7XG4gICAgICAgICAgICAgICAgICAgIHV2cy5wdXNoKG5ldyBWZWMyKHUsIHYpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXggPCB1U2VnbWVudHMgJiYgaXkgPCB2U2VnbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZWcxID0gdVNlZ21lbnRzICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGEgPSBpeCArIGl5ICogdXNlZzE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiID0gaXggKyAoaXkgKyAxKSAqIHVzZWcxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYyA9IGl4ICsgMSArIChpeSArIDEpICogdXNlZzE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gaXggKyAxICsgaXkgKiB1c2VnMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKG9mZnNldCArIGEsIG9mZnNldCArIGQsIG9mZnNldCArIGIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKG9mZnNldCArIGIsIG9mZnNldCArIGQsIG9mZnNldCArIGMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgX2J1aWxkUGxhbmUoMCwgd3MsIGhzKTsgLy8gRlJPTlRcbiAgICAgICAgX2J1aWxkUGxhbmUoNCwgbHMsIGhzKTsgLy8gUklHSFRcbiAgICAgICAgX2J1aWxkUGxhbmUoMSwgd3MsIGhzKTsgLy8gQkFDS1xuICAgICAgICBfYnVpbGRQbGFuZSg1LCBscywgaHMpOyAvLyBMRUZUXG4gICAgICAgIF9idWlsZFBsYW5lKDMsIHdzLCBscyk7IC8vIEJPVFRPTVxuICAgICAgICBfYnVpbGRQbGFuZSgyLCB3cywgbHMpOyAvLyBUT1BcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zLFxuICAgICAgICAgICAgaW5kaWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHMsXG4gICAgICAgICAgICBtaW5Qb3MsXG4gICAgICAgICAgICBtYXhQb3MsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHRvcnVzKHJhZGl1czogbnVtYmVyLCB0dWJlOiBudW1iZXIsIG9wdHM6IGFueSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IHJhZGlhbFNlZ21lbnRzID0gb3B0cy5yYWRpYWxTZWdtZW50cyB8fCAzMDtcbiAgICAgICAgY29uc3QgdHVidWxhclNlZ21lbnRzID0gb3B0cy50dWJ1bGFyU2VnbWVudHMgfHwgMjA7XG4gICAgICAgIGNvbnN0IGFyYyA9IG9wdHMuYXJjIHx8IDIuMCAqIE1hdGguUEk7XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgICAgIGNvbnN0IG5vcm1hbHMgPSBbXTtcbiAgICAgICAgY29uc3QgdXZzID0gW107XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBbXTtcbiAgICAgICAgY29uc3QgbWluUG9zID0gbmV3IFZlYzMoLXJhZGl1cyAtIHR1YmUsIC10dWJlLCAtcmFkaXVzIC0gdHViZSk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKHJhZGl1cyArIHR1YmUsIHR1YmUsIHJhZGl1cyArIHR1YmUpO1xuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDw9IHJhZGlhbFNlZ21lbnRzOyBqKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHR1YnVsYXJTZWdtZW50czsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdSA9IGkgLyB0dWJ1bGFyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IGogLyByYWRpYWxTZWdtZW50cztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHUxID0gdSAqIGFyYztcbiAgICAgICAgICAgICAgICBjb25zdCB2MSA9IHYgKiBNYXRoLlBJICogMjtcblxuICAgICAgICAgICAgICAgIC8vIHZlcnRleFxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSAocmFkaXVzICsgdHViZSAqIE1hdGguY29zKHYxKSkgKiBNYXRoLnNpbih1MSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHR1YmUgKiBNYXRoLnNpbih2MSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IChyYWRpdXMgKyB0dWJlICogTWF0aC5jb3ModjEpKSAqIE1hdGguY29zKHUxKTtcblxuICAgICAgICAgICAgICAgIC8vIHRoaXMgdmVjdG9yIGlzIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBub3JtYWxcbiAgICAgICAgICAgICAgICBjb25zdCBueCA9IE1hdGguc2luKHUxKSAqIE1hdGguY29zKHYxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBueSA9IE1hdGguc2luKHYxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBueiA9IE1hdGguY29zKHUxKSAqIE1hdGguY29zKHYxKTtcblxuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKG5ldyBWZWMzKHgsIHksIHopKTtcbiAgICAgICAgICAgICAgICBub3JtYWxzLnB1c2gobmV3IFZlYzMobngsIG55LCBueikpO1xuICAgICAgICAgICAgICAgIHV2cy5wdXNoKG5ldyBWZWMyKHUsIHYpKTtcblxuICAgICAgICAgICAgICAgIGlmIChpIDwgdHVidWxhclNlZ21lbnRzICYmIGogPCByYWRpYWxTZWdtZW50cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWcxID0gdHVidWxhclNlZ21lbnRzICsgMTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYSA9IHNlZzEgKiBqICsgaTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IHNlZzEgKiAoaiArIDEpICsgaTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYyA9IHNlZzEgKiAoaiArIDEpICsgaSArIDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWcxICogaiArIGkgKyAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChhLCBkLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGQsIGMsIGIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbnMsXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgbm9ybWFscyxcbiAgICAgICAgICAgIHV2cyxcbiAgICAgICAgICAgIG1pblBvcyxcbiAgICAgICAgICAgIG1heFBvcyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY0FyY1BvaW50cyhjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCBub3JtYWw6IFJlYWRvbmx5PFZlYzM+LCBmcm9tRGlyOiBSZWFkb25seTxWZWMzPiwgcmFkaWFuOiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBzZWdtZW50cyA9IDYwKSB7XG4gICAgICAgIFZlYzMubm9ybWFsaXplKHRlbXBWZWMzX2EsIGZyb21EaXIpO1xuICAgICAgICBWZWMzLm5vcm1hbGl6ZSh0ZW1wVmVjM19iLCBub3JtYWwpO1xuICAgICAgICBjb25zdCBkZWx0YVJvdCA9IHRlbXBRdWF0X2E7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gc2VnbWVudHM7XG4gICAgICAgIFF1YXQuZnJvbUF4aXNBbmdsZShkZWx0YVJvdCwgdGVtcFZlYzNfYiwgcmFkaWFuIC8gKGNvdW50IC0gMSkpO1xuICAgICAgICBjb25zdCB0YW5nZW50ID0gdGVtcFZlYzM7XG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIodGFuZ2VudCwgdGVtcFZlYzNfYSwgcmFkaXVzKTtcblxuICAgICAgICBjb25zdCBhcmNQb2ludHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBhcmNQb2ludHNbaV0gPSBjZW50ZXIuY2xvbmUoKTtcbiAgICAgICAgICAgIGFyY1BvaW50c1tpXS5hZGQodGFuZ2VudCk7XG4gICAgICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQodGFuZ2VudCwgdGFuZ2VudCwgZGVsdGFSb3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyY1BvaW50cztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QmlOb3JtYWxCeU5vcm1hbChub3JtYWw6IFJlYWRvbmx5PFZlYzM+KSB7XG4gICAgICAgIGNvbnN0IGJpTm9ybWFsID0gbmV3IFZlYzMoKTtcbiAgICAgICAgVmVjMy5jcm9zcyhiaU5vcm1hbCwgbm9ybWFsLCBuZXcgVmVjMygwLCAxLCAwKSk7XG4gICAgICAgIGlmIChWZWMzLmxlbmd0aFNxcihiaU5vcm1hbCkgPCAwLjAwMSkge1xuICAgICAgICAgICAgVmVjMy5jcm9zcyhiaU5vcm1hbCwgbm9ybWFsLCBuZXcgVmVjMygxLCAwLCAwKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmlOb3JtYWw7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNDaXJjbGVQb2ludHMoY2VudGVyOiBSZWFkb25seTxWZWMzPiwgbm9ybWFsOiBSZWFkb25seTxWZWMzPiwgcmFkaXVzOiBudW1iZXIsIHNlZ21lbnRzID0gNjApIHtcbiAgICAgICAgY29uc3QgYmlOb3JtYWwgPSB0aGlzLmdldEJpTm9ybWFsQnlOb3JtYWwobm9ybWFsKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jYWxjQXJjUG9pbnRzKGNlbnRlciwgbm9ybWFsLCBiaU5vcm1hbCwgVFdPX1BJLCByYWRpdXMsIHNlZ21lbnRzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY0Rpc2NQb2ludHMoY2VudGVyOiBSZWFkb25seTxWZWMzPiwgbm9ybWFsOiBSZWFkb25seTxWZWMzPiwgcmFkaXVzOiBudW1iZXIsIHNlZ21lbnRzID0gNjApIHtcbiAgICAgICAgY29uc3QgYmlOb3JtYWwgPSB0aGlzLmdldEJpTm9ybWFsQnlOb3JtYWwobm9ybWFsKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jYWxjU2VjdG9yUG9pbnRzKGNlbnRlciwgbm9ybWFsLCBiaU5vcm1hbCwgVFdPX1BJLCByYWRpdXMsIHNlZ21lbnRzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY1NlY3RvclBvaW50cyhjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCBub3JtYWw6IFJlYWRvbmx5PFZlYzM+LCBmcm9tRGlyOiBSZWFkb25seTxWZWMzPiwgcmFkaWFuOiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBzZWdtZW50czogbnVtYmVyKSB7XG4gICAgICAgIGxldCBzZWN0b3JQb2ludHM6IFZlYzNbXSA9IFtdO1xuICAgICAgICBzZWN0b3JQb2ludHMucHVzaChjZW50ZXIgYXMgVmVjMyk7XG4gICAgICAgIGNvbnN0IGFyY1BvaW50cyA9IHRoaXMuY2FsY0FyY1BvaW50cyhjZW50ZXIsIG5vcm1hbCwgZnJvbURpciwgcmFkaWFuLCByYWRpdXMsIHNlZ21lbnRzKTtcbiAgICAgICAgc2VjdG9yUG9pbnRzID0gc2VjdG9yUG9pbnRzLmNvbmNhdChhcmNQb2ludHMpO1xuICAgICAgICByZXR1cm4gc2VjdG9yUG9pbnRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbmRpY2VzRmFuVG9MaXN0KGZhbkluZGljZXM6IG51bWJlcltdKSB7XG4gICAgICAgIGNvbnN0IGxpc3RJbmRpY2VzID0gQXJyYXkoKGZhbkluZGljZXMubGVuZ3RoIC0gMikgKiAzKS5maWxsKDApO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGZhbkluZGljZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICBsaXN0SW5kaWNlc1soaSAtIDEpICogM10gPSAwO1xuICAgICAgICAgICAgbGlzdEluZGljZXNbKGkgLSAxKSAqIDMgKyAxXSA9IGk7XG4gICAgICAgICAgICBsaXN0SW5kaWNlc1soaSAtIDEpICogMyArIDJdID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RJbmRpY2VzO1xuICAgIH1cblxuICAgIC8vIOaJh+W9olxuICAgIHB1YmxpYyBjYWxjU2VjdG9yRGF0YShjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCBub3JtYWw6IFJlYWRvbmx5PFZlYzM+LCBmcm9tRGlyOiBSZWFkb25seTxWZWMzPiwgcmFkaWFuOiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBzZWdtZW50czogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbnM6IHRoaXMuY2FsY1NlY3RvclBvaW50cyhjZW50ZXIsIG5vcm1hbCwgZnJvbURpciwgcmFkaWFuLCByYWRpdXMsIHNlZ21lbnRzKSxcbiAgICAgICAgICAgIG5vcm1hbHM6IEFycmF5KHNlZ21lbnRzICsgMSkuZmlsbChub3JtYWwuY2xvbmUoKSksXG4gICAgICAgICAgICBpbmRpY2VzOiB0aGlzLmluZGljZXNGYW5Ub0xpc3QoWy4uLkFycmF5KHNlZ21lbnRzICsgMSkua2V5cygpXSksXG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGFyY0RpcmVjdGlvbkxpbmUoY2VudGVyOiBWZWMzLCBub3JtYWw6IFZlYzMsIGZyb21EaXI6IFZlYzMsIHJhZGlhbjogbnVtYmVyLCByYWRpdXM6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHNlZ21lbnRzOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdmVydGljZXM6IFZlYzNbXSA9IFtdO1xuICAgICAgICBjb25zdCBpbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuXG4gICAgICAgIC8vIGFkZCBkaXJlY3Rpb24gbGluZVxuICAgICAgICBjb25zdCBhcmNQb2ludHMgPSB0aGlzLmNhbGNBcmNQb2ludHMoY2VudGVyLCBub3JtYWwsIGZyb21EaXIsIHJhZGlhbiwgcmFkaXVzLCBzZWdtZW50cyk7XG4gICAgICAgIGNvbnN0IGVuZE9mZnNldCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIoZW5kT2Zmc2V0LCBub3JtYWwsIGxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJjUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbmRQb2ludCA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBWZWMzLmFkZChlbmRQb2ludCwgYXJjUG9pbnRzW2ldLCBlbmRPZmZzZXQpO1xuICAgICAgICAgICAgdmVydGljZXMucHVzaChhcmNQb2ludHNbaV0sIGVuZFBvaW50KTtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChpICogMiwgaSAqIDIgKyAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCBhcmNcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhcmNQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZlcnRpY2VzLnB1c2goYXJjUG9pbnRzW2kgLSAxXSk7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2godmVydGljZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB2ZXJ0aWNlcy5wdXNoKGFyY1BvaW50c1tpXSk7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2godmVydGljZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiB2ZXJ0aWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHM6IEFycmF5KHZlcnRpY2VzLmxlbmd0aCkuZmlsbChuZXcgVmVjMygwLCAxLCAxKSksXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgcHJpbWl0aXZlVHlwZTogUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1QsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNCb3hQb2ludHMoY2VudGVyOiBWZWMzLCBzaXplOiBWZWMzKSB7XG4gICAgICAgIGNvbnN0IGhhbGZTaXplID0gbmV3IFZlYzMoKTtcbiAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcihoYWxmU2l6ZSwgc2l6ZSwgMC41KTtcbiAgICAgICAgY29uc3QgcG9pbnRzID0gW107XG5cbiAgICAgICAgcG9pbnRzWzBdID0gbmV3IFZlYzMoY2VudGVyKTtcbiAgICAgICAgcG9pbnRzWzBdLmFkZChuZXcgVmVjMygtaGFsZlNpemUueCwgLWhhbGZTaXplLnksIC1oYWxmU2l6ZS56KSk7XG4gICAgICAgIHBvaW50c1sxXSA9IG5ldyBWZWMzKGNlbnRlcik7XG4gICAgICAgIHBvaW50c1sxXS5hZGQobmV3IFZlYzMoLWhhbGZTaXplLngsIGhhbGZTaXplLnksIC1oYWxmU2l6ZS56KSk7XG4gICAgICAgIHBvaW50c1syXSA9IG5ldyBWZWMzKGNlbnRlcik7XG4gICAgICAgIHBvaW50c1syXS5hZGQobmV3IFZlYzMoaGFsZlNpemUueCwgaGFsZlNpemUueSwgLWhhbGZTaXplLnopKTtcbiAgICAgICAgcG9pbnRzWzNdID0gbmV3IFZlYzMoY2VudGVyKTtcbiAgICAgICAgcG9pbnRzWzNdLmFkZChuZXcgVmVjMyhoYWxmU2l6ZS54LCAtaGFsZlNpemUueSwgLWhhbGZTaXplLnopKTtcbiAgICAgICAgcG9pbnRzWzRdID0gbmV3IFZlYzMoY2VudGVyKTtcbiAgICAgICAgcG9pbnRzWzRdLmFkZChuZXcgVmVjMygtaGFsZlNpemUueCwgLWhhbGZTaXplLnksIGhhbGZTaXplLnopKTtcbiAgICAgICAgcG9pbnRzWzVdID0gbmV3IFZlYzMoY2VudGVyKTtcbiAgICAgICAgcG9pbnRzWzVdLmFkZChuZXcgVmVjMygtaGFsZlNpemUueCwgaGFsZlNpemUueSwgaGFsZlNpemUueikpO1xuICAgICAgICBwb2ludHNbNl0gPSBuZXcgVmVjMyhjZW50ZXIpO1xuICAgICAgICBwb2ludHNbNl0uYWRkKG5ldyBWZWMzKGhhbGZTaXplLngsIGhhbGZTaXplLnksIGhhbGZTaXplLnopKTtcbiAgICAgICAgcG9pbnRzWzddID0gbmV3IFZlYzMoY2VudGVyKTtcbiAgICAgICAgcG9pbnRzWzddLmFkZChuZXcgVmVjMyhoYWxmU2l6ZS54LCAtaGFsZlNpemUueSwgaGFsZlNpemUueikpO1xuXG4gICAgICAgIHJldHVybiBwb2ludHM7XG4gICAgfVxuXG4gICAgcHVibGljIHdpcmVmcmFtZUJveChjZW50ZXI6IFZlYzMsIHNpemU6IFZlYzMpIHtcbiAgICAgICAgY29uc3QgcG9pbnRzID0gdGhpcy5jYWxjQm94UG9pbnRzKGNlbnRlciwgc2l6ZSk7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLSAxLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBpbmRpY2VzLnB1c2goMCwgMyk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDU7IGkgPCA4OyBpKyspIHtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChpIC0gMSwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kaWNlcy5wdXNoKDQsIDcpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2goaSwgaSArIDQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogcG9pbnRzLFxuICAgICAgICAgICAgbm9ybWFsczogQXJyYXkocG9pbnRzLmxlbmd0aCkuZmlsbChuZXcgVmVjMygwLCAxLCAwKSksXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgcHJpbWl0aXZlVHlwZTogUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1QsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNGcnVzdHVtKGlzT3J0aG86IGJvb2xlYW4sIG9ydGhvSGVpZ2h0OiBudW1iZXIsIGZvdjogbnVtYmVyLCBhc3BlY3Q6IG51bWJlciwgbmVhcjogbnVtYmVyLCBmYXI6IG51bWJlciwgaXNGT1ZZOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHBvaW50cyA9IFtdO1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gW107XG4gICAgICAgIGxldCBuZWFySGFsZkhlaWdodDtcbiAgICAgICAgbGV0IG5lYXJIYWxmV2lkdGg7XG4gICAgICAgIGxldCBmYXJIYWxmSGVpZ2h0O1xuICAgICAgICBsZXQgZmFySGFsZldpZHRoO1xuXG4gICAgICAgIGlmIChpc09ydGhvKSB7XG4gICAgICAgICAgICBuZWFySGFsZkhlaWdodCA9IGZhckhhbGZIZWlnaHQgPSBvcnRob0hlaWdodDtcbiAgICAgICAgICAgIG5lYXJIYWxmV2lkdGggPSBmYXJIYWxmV2lkdGggPSBuZWFySGFsZkhlaWdodCAqIGFzcGVjdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpc0ZPVlkpIHtcbiAgICAgICAgICAgICAgICBuZWFySGFsZkhlaWdodCA9IE1hdGgudGFuKGRlZzJyYWQoZm92IC8gMikpICogbmVhcjtcbiAgICAgICAgICAgICAgICBuZWFySGFsZldpZHRoID0gbmVhckhhbGZIZWlnaHQgKiBhc3BlY3Q7XG5cbiAgICAgICAgICAgICAgICBmYXJIYWxmSGVpZ2h0ID0gTWF0aC50YW4oZGVnMnJhZChmb3YgLyAyKSkgKiBmYXI7XG4gICAgICAgICAgICAgICAgZmFySGFsZldpZHRoID0gZmFySGFsZkhlaWdodCAqIGFzcGVjdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmVhckhhbGZXaWR0aCA9IE1hdGgudGFuKGRlZzJyYWQoZm92IC8gMikpICogbmVhcjtcbiAgICAgICAgICAgICAgICBuZWFySGFsZkhlaWdodCA9IG5lYXJIYWxmV2lkdGggLyBhc3BlY3Q7XG5cbiAgICAgICAgICAgICAgICBmYXJIYWxmV2lkdGggPSBNYXRoLnRhbihkZWcycmFkKGZvdiAvIDIpKSAqIGZhcjtcbiAgICAgICAgICAgICAgICBmYXJIYWxmSGVpZ2h0ID0gZmFySGFsZldpZHRoIC8gYXNwZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcG9pbnRzWzBdID0gbmV3IFZlYzMoLW5lYXJIYWxmV2lkdGgsIC1uZWFySGFsZkhlaWdodCwgLW5lYXIpO1xuICAgICAgICBwb2ludHNbMV0gPSBuZXcgVmVjMygtbmVhckhhbGZXaWR0aCwgbmVhckhhbGZIZWlnaHQsIC1uZWFyKTtcbiAgICAgICAgcG9pbnRzWzJdID0gbmV3IFZlYzMobmVhckhhbGZXaWR0aCwgbmVhckhhbGZIZWlnaHQsIC1uZWFyKTtcbiAgICAgICAgcG9pbnRzWzNdID0gbmV3IFZlYzMobmVhckhhbGZXaWR0aCwgLW5lYXJIYWxmSGVpZ2h0LCAtbmVhcik7XG5cbiAgICAgICAgcG9pbnRzWzRdID0gbmV3IFZlYzMoLWZhckhhbGZXaWR0aCwgLWZhckhhbGZIZWlnaHQsIC1mYXIpO1xuICAgICAgICBwb2ludHNbNV0gPSBuZXcgVmVjMygtZmFySGFsZldpZHRoLCBmYXJIYWxmSGVpZ2h0LCAtZmFyKTtcbiAgICAgICAgcG9pbnRzWzZdID0gbmV3IFZlYzMoZmFySGFsZldpZHRoLCBmYXJIYWxmSGVpZ2h0LCAtZmFyKTtcbiAgICAgICAgcG9pbnRzWzddID0gbmV3IFZlYzMoZmFySGFsZldpZHRoLCAtZmFySGFsZkhlaWdodCwgLWZhcik7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChpIC0gMSwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kaWNlcy5wdXNoKDAsIDMpO1xuICAgICAgICBmb3IgKGxldCBpID0gNTsgaSA8IDg7IGkrKykge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLSAxLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBpbmRpY2VzLnB1c2goNCwgNyk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChpLCBpICsgNCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBwb2ludHMsXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgbm9ybWFsczogQXJyYXkocG9pbnRzLmxlbmd0aCkuZmlsbChuZXcgVmVjMygwLCAxLCAwKSksXG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLkxJTkVfTElTVCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY1JlY3RhbmdsZVBvaW50cyhjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCByb3RhdGlvbjogUmVhZG9ubHk8UXVhdD4sIHNpemU6IGFueSkge1xuICAgICAgICBjb25zdCByaWdodCA9IG5ldyBWZWMzKHNpemUueCAvIDIsIDAsIDApO1xuICAgICAgICBjb25zdCB1cCA9IG5ldyBWZWMzKDAsIHNpemUueSAvIDIsIDApO1xuICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQocmlnaHQsIHJpZ2h0LCByb3RhdGlvbik7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh1cCwgdXAsIHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdCB2ZXJ0aWNlcyA9IFtdO1xuICAgICAgICB2ZXJ0aWNlc1swXSA9IGNlbnRlci5jbG9uZSgpO1xuICAgICAgICB2ZXJ0aWNlc1swXS5hZGQocmlnaHQpO1xuICAgICAgICB2ZXJ0aWNlc1swXS5hZGQodXApO1xuICAgICAgICB2ZXJ0aWNlc1sxXSA9IGNlbnRlci5jbG9uZSgpO1xuICAgICAgICB2ZXJ0aWNlc1sxXS5hZGQocmlnaHQpO1xuICAgICAgICB2ZXJ0aWNlc1sxXS5zdWJ0cmFjdCh1cCk7XG4gICAgICAgIHZlcnRpY2VzWzJdID0gY2VudGVyLmNsb25lKCk7XG4gICAgICAgIHZlcnRpY2VzWzJdLnN1YnRyYWN0KHJpZ2h0KTtcbiAgICAgICAgdmVydGljZXNbMl0uc3VidHJhY3QodXApO1xuICAgICAgICB2ZXJ0aWNlc1szXSA9IGNlbnRlci5jbG9uZSgpO1xuICAgICAgICB2ZXJ0aWNlc1szXS5zdWJ0cmFjdChyaWdodCk7XG4gICAgICAgIHZlcnRpY2VzWzNdLmFkZCh1cCk7XG5cbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLSAxLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBpbmRpY2VzLnB1c2goMCwgMyk7XG5cbiAgICAgICAgcmV0dXJuIHsgdmVydGljZXMsIGluZGljZXMgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY1JlY3RhbmdsZURhdGEoY2VudGVyOiBSZWFkb25seTxWZWMzPiwgcm90YXRpb246IFJlYWRvbmx5PFF1YXQ+LCBzaXplOiBhbnkpIHtcbiAgICAgICAgY29uc3QgcmVjdERhdGEgPSB0aGlzLmNhbGNSZWN0YW5nbGVQb2ludHMoY2VudGVyLCByb3RhdGlvbiwgc2l6ZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbnM6IHJlY3REYXRhLnZlcnRpY2VzLFxuICAgICAgICAgICAgbm9ybWFsczogQXJyYXkocmVjdERhdGEudmVydGljZXMubGVuZ3RoKS5maWxsKG5ldyBWZWMzKDAsIDEsIDApKSxcbiAgICAgICAgICAgIGluZGljZXM6IHJlY3REYXRhLmluZGljZXMsXG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLkxJTkVfTElTVCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY1NwaGVyZURhdGEoY2VudGVyOiBSZWFkb25seTxWZWMzPiwgcmFkaXVzID0gMC41LCBvcHRzOiBhbnkgPSB7fSk6IElNZXNoUHJpbWl0aXZlIHtcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBvcHRzLnNlZ21lbnRzICE9PSB1bmRlZmluZWQgPyBvcHRzLnNlZ21lbnRzIDogMzI7XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgICAgIGNvbnN0IG5vcm1hbHMgPSBbXTtcbiAgICAgICAgY29uc3QgdXZzID0gW107XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBbXTtcbiAgICAgICAgY29uc3QgbWluUG9zID0gbmV3IFZlYzMoLXJhZGl1cywgLXJhZGl1cywgLXJhZGl1cyk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKHJhZGl1cywgcmFkaXVzLCByYWRpdXMpO1xuICAgICAgICBjb25zdCBib3VuZGluZ1JhZGl1cyA9IHJhZGl1cztcblxuICAgICAgICBmb3IgKGxldCBsYXQgPSAwOyBsYXQgPD0gc2VnbWVudHM7ICsrbGF0KSB7XG4gICAgICAgICAgICBjb25zdCB0aGV0YSA9IChsYXQgKiBNYXRoLlBJKSAvIHNlZ21lbnRzO1xuICAgICAgICAgICAgY29uc3Qgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgICAgICAgICBjb25zdCBjb3NUaGV0YSA9IC1NYXRoLmNvcyh0aGV0YSk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGxvbiA9IDA7IGxvbiA8PSBzZWdtZW50czsgKytsb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwaGkgPSAobG9uICogMiAqIE1hdGguUEkpIC8gc2VnbWVudHMgLSBNYXRoLlBJIC8gMi4wO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpblBoaSA9IE1hdGguc2luKHBoaSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29zUGhpID0gTWF0aC5jb3MocGhpKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBzaW5QaGkgKiBzaW5UaGV0YTtcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gY29zVGhldGE7XG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IGNvc1BoaSAqIHNpblRoZXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IHUgPSBsb24gLyBzZWdtZW50cztcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gbGF0IC8gc2VnbWVudHM7XG5cbiAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaChuZXcgVmVjMyhjZW50ZXIueCArIHggKiByYWRpdXMsIGNlbnRlci55ICsgeSAqIHJhZGl1cywgY2VudGVyLnogKyB6ICogcmFkaXVzKSk7XG4gICAgICAgICAgICAgICAgbm9ybWFscy5wdXNoKG5ldyBWZWMzKHgsIHksIHopKTtcbiAgICAgICAgICAgICAgICB1dnMucHVzaChuZXcgVmVjMih1LCB2KSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobGF0IDwgc2VnbWVudHMgJiYgbG9uIDwgc2VnbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VnMSA9IHNlZ21lbnRzICsgMTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYSA9IHNlZzEgKiBsYXQgKyBsb247XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBzZWcxICogKGxhdCArIDEpICsgbG9uO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjID0gc2VnMSAqIChsYXQgKyAxKSArIGxvbiArIDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWcxICogbGF0ICsgbG9uICsgMTtcblxuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goYSwgZCwgYik7XG4gICAgICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChkLCBjLCBiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zLFxuICAgICAgICAgICAgaW5kaWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHMsXG4gICAgICAgICAgICB1dnMsXG4gICAgICAgICAgICBtaW5Qb3MsXG4gICAgICAgICAgICBtYXhQb3MsXG4gICAgICAgICAgICBib3VuZGluZ1JhZGl1cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBjYWxjdWxhdGUgc2hhcGUgZGF0YVxuICAgIHB1YmxpYyBjYWxjQXJjRGF0YShjZW50ZXI6IFJlYWRvbmx5PFZlYzM+LCBub3JtYWw6IFJlYWRvbmx5PFZlYzM+LCBmcm9tRGlyOiBSZWFkb25seTxWZWMzPiwgcmFkaWFuOiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBzZWdtZW50cyA9IDYwKSB7XG4gICAgICAgIFZlYzMubm9ybWFsaXplKHRlbXBWZWMzX2EsIGZyb21EaXIpO1xuICAgICAgICBWZWMzLm5vcm1hbGl6ZSh0ZW1wVmVjM19iLCBub3JtYWwpO1xuICAgICAgICBjb25zdCBkZWx0YVJvdCA9IHRlbXBRdWF0X2E7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gc2VnbWVudHM7XG4gICAgICAgIFF1YXQuZnJvbUF4aXNBbmdsZShkZWx0YVJvdCwgdGVtcFZlYzNfYiwgcmFkaWFuIC8gKGNvdW50IC0gMSkpO1xuICAgICAgICBjb25zdCB0YW5nZW50ID0gbmV3IFZlYzMoKTtcbiAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0YW5nZW50LCB0ZW1wVmVjM19hLCByYWRpdXMpO1xuXG4gICAgICAgIGNvbnN0IGFyY1BvaW50cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGFyY1BvaW50c1tpXSA9IGNlbnRlci5jbG9uZSgpO1xuICAgICAgICAgICAgYXJjUG9pbnRzW2ldLmFkZCh0YW5nZW50KTtcbiAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0YW5nZW50LCB0YW5nZW50LCBkZWx0YVJvdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBhcmNQb2ludHMsXG4gICAgICAgICAgICBub3JtYWxzOiBBcnJheShzZWdtZW50cykuZmlsbChuZXcgVmVjMyh0ZW1wVmVjM19iKSksXG4gICAgICAgICAgICBpbmRpY2VzOiBbLi4uQXJyYXkoc2VnbWVudHMpLmtleXMoKV0sXG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLkxJTkVfU1RSSVAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNDaXJjbGVEYXRhKGNlbnRlcjogUmVhZG9ubHk8VmVjMz4sIG5vcm1hbDogUmVhZG9ubHk8VmVjMz4sIHJhZGl1czogbnVtYmVyLCBzZWdtZW50cyA9IDYwKSB7XG4gICAgICAgIGNvbnN0IGJpTm9ybWFsID0gdGhpcy5nZXRCaU5vcm1hbEJ5Tm9ybWFsKG5vcm1hbCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsY0FyY0RhdGEoY2VudGVyLCBub3JtYWwsIGJpTm9ybWFsLCBUV09fUEksIHJhZGl1cywgc2VnbWVudHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjTGluZXNEYXRhKHZlcnRpY2VzOiBWZWMzW10sIGluZGljZXM6IG51bWJlcltdLCBuZWVkQm91bmRpbmdCb3hEYXRhID0gdHJ1ZSk6IElNZXNoUHJpbWl0aXZlIHtcbiAgICAgICAgY29uc3QgbGluZURhdGE6IElNZXNoUHJpbWl0aXZlID0ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiB2ZXJ0aWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHM6IEFycmF5KHZlcnRpY2VzLmxlbmd0aCkuZmlsbChuZXcgVmVjMygwLCAxLCAwKSksXG4gICAgICAgICAgICBpbmRpY2VzLFxuICAgICAgICAgICAgcHJpbWl0aXZlVHlwZTogUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1QsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG5lZWRCb3VuZGluZ0JveERhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG1pblBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBjb25zdCBtYXhQb3MgPSBuZXcgVmVjMygpO1xuXG4gICAgICAgICAgICBpZiAodmVydGljZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG1pblBvcy5zZXQodmVydGljZXNbMF0pO1xuICAgICAgICAgICAgICAgIG1heFBvcy5zZXQodmVydGljZXNbMF0pO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5taW4obWluUG9zLCBtaW5Qb3MsIHZlcnRpY2VzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5tYXgobWF4UG9zLCBtYXhQb3MsIHZlcnRpY2VzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpbmVEYXRhLm1pblBvcyA9IG1pblBvcztcbiAgICAgICAgICAgIGxpbmVEYXRhLm1heFBvcyA9IG1heFBvcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaW5lRGF0YTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY0Rpc2NEYXRhKGNlbnRlcjogUmVhZG9ubHk8VmVjMz4sIG5vcm1hbDogUmVhZG9ubHk8VmVjMz4sIHJhZGl1czogbnVtYmVyLCBzZWdtZW50cyA9IDYwKSB7XG4gICAgICAgIGNvbnN0IGJpTm9ybWFsID0gdGhpcy5nZXRCaU5vcm1hbEJ5Tm9ybWFsKG5vcm1hbCk7XG5cbiAgICAgICAgY29uc3QgbWF4UG9zID0gbmV3IFZlYzMocmFkaXVzLCByYWRpdXMsIDApO1xuICAgICAgICBjb25zdCBtaW5Qb3MgPSBuZXcgVmVjMygtcmFkaXVzLCAtcmFkaXVzLCAwKTtcbiAgICAgICAgUXVhdC5yb3RhdGlvblRvKHRlbXBRdWF0X2EsIFZlYzMuVU5JVF9aLCBub3JtYWwpO1xuICAgICAgICBWZWMzLmFkZChtYXhQb3MsIG1heFBvcywgY2VudGVyKTtcbiAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KG1heFBvcywgbWF4UG9zLCB0ZW1wUXVhdF9hKTtcbiAgICAgICAgVmVjMy5hZGQobWluUG9zLCBtaW5Qb3MsIGNlbnRlcik7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdChtaW5Qb3MsIG1pblBvcywgdGVtcFF1YXRfYSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3NpdGlvbnM6IHRoaXMuY2FsY1NlY3RvclBvaW50cyhjZW50ZXIsIG5vcm1hbCwgYmlOb3JtYWwsIFRXT19QSSwgcmFkaXVzLCBzZWdtZW50cyksXG4gICAgICAgICAgICBub3JtYWxzOiBBcnJheShzZWdtZW50cyArIDEpLmZpbGwobm9ybWFsLmNsb25lKCkpLFxuICAgICAgICAgICAgaW5kaWNlczogdGhpcy5pbmRpY2VzRmFuVG9MaXN0KFsuLi5BcnJheShzZWdtZW50cyArIDEpLmtleXMoKV0pLFxuICAgICAgICAgICAgcHJpbWl0aXZlVHlwZTogUHJpbWl0aXZlTW9kZS5UUklBTkdMRV9MSVNULFxuICAgICAgICAgICAgbWluUG9zLFxuICAgICAgICAgICAgbWF4UG9zLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjTGluZURhdGEoc3RhcnRQb3M6IFZlYzMsIGVuZFBvczogVmVjMykge1xuICAgICAgICBjb25zdCBtaW5Qb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICBjb25zdCBtYXhQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICBWZWMzLm1pbihtaW5Qb3MsIHN0YXJ0UG9zLCBlbmRQb3MpO1xuICAgICAgICBWZWMzLm1heChtYXhQb3MsIHN0YXJ0UG9zLCBlbmRQb3MpO1xuXG4gICAgICAgIFZlYzMuc3VidHJhY3QodGVtcFZlYzMsIG1heFBvcywgbWluUG9zKTtcbiAgICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIC8vIOWSjOi9tOW5s+ihjOeahOe6v+mcgOimgeS4gOS4quS4jeS4ujDnmoTljIXlm7Tnm5JcbiAgICAgICAgY29uc3QgeHl6ID0gWyd4JywgJ3knLCAneiddO1xuICAgICAgICB4eXouZm9yRWFjaCgocGFydCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICAgICAgaWYgKHRlbXBWZWMzW3BhcnRdID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGFydHMucHVzaChwYXJ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgcGFydHMuZm9yRWFjaCgocGFydCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgICAgICAgICAgICBtaW5Qb3NbcGFydF0gLT0gMC41O1xuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgICAgICAgICAgICBtYXhQb3NbcGFydF0gKz0gMC41O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBbbmV3IFZlYzMoc3RhcnRQb3MueCwgc3RhcnRQb3MueSwgc3RhcnRQb3MueiksIG5ldyBWZWMzKGVuZFBvcy54LCBlbmRQb3MueSwgZW5kUG9zLnopXSxcbiAgICAgICAgICAgIG5vcm1hbHM6IEFycmF5KDIpLmZpbGwobmV3IFZlYzMoMCwgMSwgMCkpLFxuICAgICAgICAgICAgaW5kaWNlczogWzAsIDFdLFxuICAgICAgICAgICAgbWluUG9zLFxuICAgICAgICAgICAgbWF4UG9zLFxuICAgICAgICAgICAgcHJpbWl0aXZlVHlwZTogUHJpbWl0aXZlTW9kZS5MSU5FX0xJU1QsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNQb2x5Z29uRGF0YShwb2ludHM6IFZlYzNbXSwgaW5kaWNlcz86IG51bWJlcltdKSB7XG4gICAgICAgIGNvbnN0IG1pblBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIHBvaW50cy5mb3JFYWNoKChwb2ludCkgPT4ge1xuICAgICAgICAgICAgVmVjMy5taW4obWluUG9zLCBtaW5Qb3MsIHBvaW50KTtcbiAgICAgICAgICAgIFZlYzMubWF4KG1heFBvcywgbWF4UG9zLCBwb2ludCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBmaW5hbEluZGljZXM7XG4gICAgICAgIGlmIChpbmRpY2VzKSB7XG4gICAgICAgICAgICBmaW5hbEluZGljZXMgPSBpbmRpY2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmluYWxJbmRpY2VzID0gWy4uLnBvaW50cy5rZXlzKCldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogcG9pbnRzLFxuICAgICAgICAgICAgbm9ybWFsczogQXJyYXkocG9pbnRzLmxlbmd0aCkuZmlsbChuZXcgVmVjMygwLCAxLCAwKSksXG4gICAgICAgICAgICBpbmRpY2VzOiBmaW5hbEluZGljZXMsXG4gICAgICAgICAgICBtaW5Qb3MsXG4gICAgICAgICAgICBtYXhQb3MsXG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2FsY3VsYXRlIHRoZSBkYXRhIG9mIG9jdGFoZWRyb25cbiAgICAgKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9PY3RhaGVkcm9uXG4gICAgICogQHBhcmFtIGxvd2VyUG9pbnQgVGhlIGxvd2VyIGFwZXgncyBwb3NpdGlvbi5cbiAgICAgKiBAcGFyYW0gdXBwZXJQb2ludCBUaGUgdXBwZXIgYXBleCdzIHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSB3aWR0aCBUaGUgd2lkdGggb2YgdGhlIHBvbHlnb25hbCBiYXNlXG4gICAgICogQHBhcmFtIGxlbmd0aCBUaGUgbGVuZ3RoIG9mIHRoZSBwb2x5Z29uYWwgYmFzZVxuICAgICAqIEBwYXJhbSByYXRpbyBUaGUgaGVpZ2h0IHJhdGlvIG9mIHRoZSBkb3duc2lkZSBweXJhbWlkLiBVc3VhbGx5IGluIGludGVydmFsIFswLCAxXS5cbiAgICAgKi9cbiAgICBwdWJsaWMgY2FsY09jdGFoZWRyb25EYXRhKGxvd2VyUG9pbnQ6IElWZWMzTGlrZSwgdXBwZXJQb2ludDogSVZlYzNMaWtlLCB3aWR0aDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgcmF0aW8gPSAwLjIpIHtcbiAgICAgICAgY29uc3QgaGFsZldpZHRoID0gd2lkdGggLyAyLjA7XG4gICAgICAgIGNvbnN0IGhhbGZMZW5ndGggPSBsZW5ndGggLyAyLjA7XG4gICAgICAgIGNvbnN0IG1pblBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IG1heFBvcyA9IG5ldyBWZWMzKCk7XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb25zOiBWZWMzW10gPSBbXG4gICAgICAgICAgICBuZXcgVmVjMygwLjAsIDAuMCwgMC4wKSwgLy8gbG93ZXJBcGV4XG4gICAgICAgICAgICBuZXcgVmVjMygwLjAsIDEuMCwgMC4wKSwgLy8gdXBwZXJBcGV4XG4gICAgICAgICAgICBuZXcgVmVjMyhoYWxmV2lkdGgsIHJhdGlvLCBoYWxmTGVuZ3RoKSwgLy8gdjBcbiAgICAgICAgICAgIG5ldyBWZWMzKC1oYWxmV2lkdGgsIHJhdGlvLCBoYWxmTGVuZ3RoKSwgLy8gdjFcbiAgICAgICAgICAgIG5ldyBWZWMzKC1oYWxmV2lkdGgsIHJhdGlvLCAtaGFsZkxlbmd0aCksIC8vIHYyXG4gICAgICAgICAgICBuZXcgVmVjMyhoYWxmV2lkdGgsIHJhdGlvLCAtaGFsZkxlbmd0aCksIC8vIHYzXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3QgZGlyID0gVmVjMy5zdWJ0cmFjdChuZXcgVmVjMygpLCB1cHBlclBvaW50LCBsb3dlclBvaW50KTtcbiAgICAgICAgY29uc3QgZGlyTGVuID0gVmVjMy5sZW4oZGlyKTtcbiAgICAgICAgVmVjMy5ub3JtYWxpemUoZGlyLCBkaXIpO1xuICAgICAgICBjb25zdCByb3QgPSBRdWF0LnJvdGF0aW9uVG8obmV3IFF1YXQoKSwgVmVjMy5VTklUX1ksIGRpcik7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IE1hdDQuZnJvbVJUUyhuZXcgTWF0NCgpLCByb3QsIGxvd2VyUG9pbnQsIG5ldyBWZWMzKGRpckxlbiwgZGlyTGVuLCBkaXJMZW4pKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBwb3NpdGlvbnNbaV07XG4gICAgICAgICAgICBWZWMzLnRyYW5zZm9ybU1hdDQocCwgcCwgdHJhbnNmb3JtKTtcblxuICAgICAgICAgICAgVmVjMy5taW4obWluUG9zLCBtaW5Qb3MsIHApO1xuICAgICAgICAgICAgVmVjMy5tYXgobWF4UG9zLCBtYXhQb3MsIHApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG93ZXJBcGV4ID0gMDtcbiAgICAgICAgY29uc3QgdXBwZXJBcGV4ID0gMTtcbiAgICAgICAgY29uc3QgdjAgPSAyO1xuICAgICAgICBjb25zdCB2MSA9IDM7XG4gICAgICAgIGNvbnN0IHYyID0gNDtcbiAgICAgICAgY29uc3QgdjMgPSA1O1xuXG4gICAgICAgIGNvbnN0IGZhY2VWZXJ0aWNlczogbnVtYmVyW10gPSBbXG4gICAgICAgICAgICB2MCwgdjEsIGxvd2VyQXBleCxcbiAgICAgICAgICAgIHYxLCB2MiwgbG93ZXJBcGV4LFxuICAgICAgICAgICAgdjIsIHYzLCBsb3dlckFwZXgsXG4gICAgICAgICAgICB2MywgdjAsIGxvd2VyQXBleCxcbiAgICAgICAgICAgIHVwcGVyQXBleCwgdjEsIHYwLFxuICAgICAgICAgICAgdXBwZXJBcGV4LCB2MiwgdjEsXG4gICAgICAgICAgICB1cHBlckFwZXgsIHYzLCB2MixcbiAgICAgICAgICAgIHVwcGVyQXBleCwgdjAsIHYzLFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IG5GYWNlVmVydGljZXMgPSBmYWNlVmVydGljZXMubGVuZ3RoO1xuICAgICAgICBjb25zdCB2ZXJ0aWNlczogbnVtYmVyW10gPSBuZXcgQXJyYXkoMyAqIG5GYWNlVmVydGljZXMpLmZpbGwoMC4wKTtcbiAgICAgICAgZm9yIChsZXQgaUZhY2VWZXJ0ZXggPSAwOyBpRmFjZVZlcnRleCA8IG5GYWNlVmVydGljZXM7ICsraUZhY2VWZXJ0ZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uSW5kZXggPSBmYWNlVmVydGljZXNbaUZhY2VWZXJ0ZXhdO1xuICAgICAgICAgICAgdmVydGljZXNbMyAqIGlGYWNlVmVydGV4XSA9IHBvc2l0aW9uc1twb3NpdGlvbkluZGV4XS54O1xuICAgICAgICAgICAgdmVydGljZXNbMyAqIGlGYWNlVmVydGV4ICsgMV0gPSBwb3NpdGlvbnNbcG9zaXRpb25JbmRleF0ueTtcbiAgICAgICAgICAgIHZlcnRpY2VzWzMgKiBpRmFjZVZlcnRleCArIDJdID0gcG9zaXRpb25zW3Bvc2l0aW9uSW5kZXhdLno7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnroDljJbniYjms5Xnur/orqHnrpfvvIjkuI3kvp3otZYgRXh0ZXJuYWwuR2VvbWV0cnlVdGlscy5jYWxjdWxhdGVOb3JtYWxz77yJXG4gICAgICAgIGNvbnN0IG5vcm1hbHMgPSBjYWxjdWxhdGVUcmlhbmdsZU5vcm1hbHModmVydGljZXMsIG5GYWNlVmVydGljZXMpO1xuXG4gICAgICAgIGNvbnN0IHZlYzNOb3JtYWxzOiBWZWMzW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub3JtYWxzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICB2ZWMzTm9ybWFscy5wdXNoKG5ldyBWZWMzKG5vcm1hbHNbaV0sIG5vcm1hbHNbaSArIDFdLCBub3JtYWxzW2kgKyAyXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmVjM1Bvc2l0aW9uczogVmVjM1tdID0gZmFjZVZlcnRpY2VzLm1hcCgoaW5kZXgpID0+IHBvc2l0aW9uc1tpbmRleF0pO1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gWy4uLkFycmF5KHZlYzNQb3NpdGlvbnMubGVuZ3RoKS5rZXlzKCldO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmltaXRpdmVUeXBlOiBQcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QsXG4gICAgICAgICAgICBwb3NpdGlvbnM6IHZlYzNQb3NpdGlvbnMsXG4gICAgICAgICAgICBub3JtYWxzOiB2ZWMzTm9ybWFscyxcbiAgICAgICAgICAgIGluZGljZXMsXG4gICAgICAgICAgICBtaW5Qb3MsXG4gICAgICAgICAgICBtYXhQb3MsXG4gICAgICAgIH07XG4gICAgfVxufVxuXG4vKipcbiAqIOeugOWMlueJiOS4ieinkuW9ouazlee6v+iuoeeul1xuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVUcmlhbmdsZU5vcm1hbHModmVydGljZXM6IG51bWJlcltdLCBuRmFjZVZlcnRpY2VzOiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgY29uc3Qgbm9ybWFscyA9IG5ldyBBcnJheSh2ZXJ0aWNlcy5sZW5ndGgpLmZpbGwoMC4wKTtcbiAgICBjb25zdCBpbmRpY2VzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogbkZhY2VWZXJ0aWNlcyB9LCAoXywgaSkgPT4gaSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY29uc3QgaTAgPSBpbmRpY2VzW2ldO1xuICAgICAgICBjb25zdCBpMSA9IGluZGljZXNbaSArIDFdO1xuICAgICAgICBjb25zdCBpMiA9IGluZGljZXNbaSArIDJdO1xuXG4gICAgICAgIGNvbnN0IGF4ID0gdmVydGljZXNbaTAgKiAzXSwgYXkgPSB2ZXJ0aWNlc1tpMCAqIDMgKyAxXSwgYXogPSB2ZXJ0aWNlc1tpMCAqIDMgKyAyXTtcbiAgICAgICAgY29uc3QgYnggPSB2ZXJ0aWNlc1tpMSAqIDNdLCBieSA9IHZlcnRpY2VzW2kxICogMyArIDFdLCBieiA9IHZlcnRpY2VzW2kxICogMyArIDJdO1xuICAgICAgICBjb25zdCBjeCA9IHZlcnRpY2VzW2kyICogM10sIGN5ID0gdmVydGljZXNbaTIgKiAzICsgMV0sIGN6ID0gdmVydGljZXNbaTIgKiAzICsgMl07XG5cbiAgICAgICAgY29uc3QgZTF4ID0gYnggLSBheCwgZTF5ID0gYnkgLSBheSwgZTF6ID0gYnogLSBhejtcbiAgICAgICAgY29uc3QgZTJ4ID0gY3ggLSBheCwgZTJ5ID0gY3kgLSBheSwgZTJ6ID0gY3ogLSBhejtcblxuICAgICAgICBjb25zdCBueCA9IGUxeSAqIGUyeiAtIGUxeiAqIGUyeTtcbiAgICAgICAgY29uc3QgbnkgPSBlMXogKiBlMnggLSBlMXggKiBlMno7XG4gICAgICAgIGNvbnN0IG56ID0gZTF4ICogZTJ5IC0gZTF5ICogZTJ4O1xuXG4gICAgICAgIGZvciAoY29uc3QgaWR4IG9mIFtpMCwgaTEsIGkyXSkge1xuICAgICAgICAgICAgbm9ybWFsc1tpZHggKiAzXSArPSBueDtcbiAgICAgICAgICAgIG5vcm1hbHNbaWR4ICogMyArIDFdICs9IG55O1xuICAgICAgICAgICAgbm9ybWFsc1tpZHggKiAzICsgMl0gKz0gbno7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBub3JtYWxpemVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vcm1hbHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY29uc3QgbGVuID0gTWF0aC5zcXJ0KG5vcm1hbHNbaV0gKiogMiArIG5vcm1hbHNbaSArIDFdICoqIDIgKyBub3JtYWxzW2kgKyAyXSAqKiAyKTtcbiAgICAgICAgaWYgKGxlbiA+IEVQU0lMT04pIHtcbiAgICAgICAgICAgIG5vcm1hbHNbaV0gLz0gbGVuO1xuICAgICAgICAgICAgbm9ybWFsc1tpICsgMV0gLz0gbGVuO1xuICAgICAgICAgICAgbm9ybWFsc1tpICsgMl0gLz0gbGVuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbHM7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBDb250cm9sbGVyU2hhcGUoKTtcbiJdfQ==