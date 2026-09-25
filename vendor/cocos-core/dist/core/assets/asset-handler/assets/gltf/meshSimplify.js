"use strict";
/*
MIT License

Copyright(c) 2017-2020 Mattias Edlund

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/////////////////////////////////////////////
//
// Mesh Simplification Tutorial
//
// (C) by Sven Forstmann in 2014
//
// License : MIT
// http://opensource.org/licenses/MIT
//
//https://github.com/sp4cerat/Fast-Quadric-Mesh-Simplification
// @ts-nocheck 此方法有很多定义不明，暂时无法完善定义
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshSimplify = void 0;
exports.getDefaultSimplifyOptions = getDefaultSimplifyOptions;
exports.simplifyMesh = simplifyMesh;
const cc_1 = require("cc");
const cc_2 = require("cc");
const _tempVec2 = new cc_1.Vec2();
const _tempVec3 = new cc_1.Vec3();
const _tempVec3_2 = new cc_1.Vec3();
const _tempVec3_3 = new cc_1.Vec3();
const _tempVec4 = new cc_1.Vec4();
const _tempColor = new cc_1.Color();
const DenomEpilson = 0.00000001;
// 颜色相加
function colorScaleAndAdd(out, colora, colorb, scale) {
    out.r = Math.max(colora.r + colorb.r * scale, 255);
    out.g = Math.max(colora.g + colorb.g * scale, 255);
    out.b = Math.max(colora.b + colorb.b * scale, 255);
    out.a = Math.max(colora.a + colorb.a * scale, 255);
}
class SymetricMatrix {
    m;
    constructor() {
        this.m = new Array(10).fill(0);
    }
    set(m11, m12, m13, m14, m22, m23, m24, m33, m34, m44) {
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m13;
        this.m[3] = m14;
        this.m[4] = m22;
        this.m[5] = m23;
        this.m[6] = m24;
        this.m[7] = m33;
        this.m[8] = m34;
        this.m[9] = m44;
        return this;
    }
    makePlane(a, b, c, d) {
        return this.set(a * a, a * b, a * c, a * d, b * b, b * c, b * d, c * c, c * d, d * d);
    }
    det(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
        const det = this.m[a11] * this.m[a22] * this.m[a33] +
            this.m[a13] * this.m[a21] * this.m[a32] +
            this.m[a12] * this.m[a23] * this.m[a31] -
            this.m[a13] * this.m[a22] * this.m[a31] -
            this.m[a11] * this.m[a23] * this.m[a32] -
            this.m[a12] * this.m[a21] * this.m[a33];
        return det;
    }
    // produces new Matrix
    add(n) {
        return new SymetricMatrix().set(this.m[0] + n.m[0], this.m[1] + n.m[1], this.m[2] + n.m[2], this.m[3] + n.m[3], this.m[4] + n.m[4], this.m[5] + n.m[5], this.m[6] + n.m[6], this.m[7] + n.m[7], this.m[8] + n.m[8], this.m[9] + n.m[9]);
    }
    addSelf(n) {
        this.m[0] += n.m[0];
        this.m[1] += n.m[1];
        this.m[2] += n.m[2];
        this.m[3] += n.m[3];
        this.m[4] += n.m[4];
        this.m[5] += n.m[5];
        this.m[6] += n.m[6];
        this.m[7] += n.m[7];
        this.m[8] += n.m[8];
        this.m[9] += n.m[9];
    }
}
class Triangle {
    v;
    va;
    err;
    deleted;
    dirty;
    n;
    constructor() {
        this.v = new Array(3); // indices for array
        this.va = new Array(3); // indices for arra
        this.err = new Array(4); // errors
        this.deleted = false;
        this.dirty = false;
        this.n = new cc_1.Vec3(); // Normal
    }
}
class Vertex {
    index;
    p;
    // public n: Vec3;
    // public uv: Vec2;
    // public tangents: Vec4;
    tstart;
    tcount;
    q;
    border;
    uvSteam;
    uvFoldover;
    constructor() {
        this.p = new cc_1.Vec3();
        this.tstart = -1;
        this.tcount = -1;
        this.q = new SymetricMatrix();
        this.border = false;
    }
}
class Ref {
    tvertex;
    tid;
}
class BorderVertex {
    index;
    hash;
    constructor(index, hash) {
        this.index = index;
        this.hash = hash;
    }
}
/**
 * 设置参数
 */
class SimplificationOptions {
    preserveSurfaceCurvature = false;
    preserveBorderEdges = false;
    preserveUVSeamEdges = false;
    preserveUVFoldoverEdges = false;
    enableSmartLink = true;
    vertexLinkDistance = Number.MIN_VALUE;
    maxIterationCount = 100;
    agressiveness = 7.0;
}
/**
 * 网格简化
 */
class MeshSimplify {
    simplificationOptions = new SimplificationOptions();
    _triangles = []; // Triangle
    _vertices = []; // Vertex
    _vertNormals = null;
    _vertTangents = null;
    _vertUV2D = null;
    _vertUV3D = null;
    _vertUV4D = null;
    _vertColors = null;
    _vertJoints = null;
    _vertWeights = null;
    _refs = []; // Ref
    _geometricInfo = '';
    _triangleHashSet1 = new Map();
    _triangleHashSet2 = new Map();
    /**
     * 初始化
     * @param origVertices
     * @param origFaces
     * @param info
     */
    init(origVertices, origFaces, info) {
        this._vertices = origVertices.map((p, index) => {
            const vert = new Vertex();
            vert.index = index;
            vert.p = new cc_1.Vec3(p.x, p.y, p.z);
            return vert;
        });
        if (info.uvs && info.uvs.length > 0) {
            this._vertUV2D = [];
            for (let i = 0; i < info.uvs.length; i += 2) {
                this._vertUV2D.push(new cc_1.Vec2(info.uvs[i], info.uvs[i + 1]));
            }
        }
        if (info.normals && info.normals.length > 0) {
            this._vertNormals = [];
            for (let i = 0; i < info.normals.length; i += 3) {
                this._vertNormals.push(new cc_1.Vec3(info.normals[i], info.normals[i + 1], info.normals[i + 2]));
            }
        }
        if (info.tangents && info.tangents.length > 0) {
            this._vertTangents = [];
            for (let i = 0; i < info.tangents.length; i += 4) {
                this._vertTangents.push(new cc_1.Vec4(info.tangents[i], info.tangents[i + 1], info.tangents[i + 2], info.tangents[i + 3]));
            }
        }
        if (info.colors && info.colors.length > 0) {
            this._vertColors = [];
            for (let i = 0; i < info.colors.length; i += 4) {
                this._vertColors.push(new cc_1.Color(info.colors[i], info.colors[i + 1], info.colors[i + 2], info.colors[i + 3]));
            }
        }
        if (info.joints && info.joints.length > 0) {
            this._vertJoints = [];
            for (let i = 0; i < info.joints.length; i += 4) {
                this._vertJoints.push(new cc_1.Vec4(info.joints[i], info.joints[i + 1], info.joints[i + 2], info.joints[i + 3]));
            }
        }
        if (info.weights && info.weights.length > 0) {
            this._vertWeights = [];
            for (let i = 0; i < info.weights.length; i += 4) {
                this._vertWeights.push(new cc_1.Vec4(info.weights[i], info.weights[i + 1], info.weights[i + 2], info.weights[i + 3]));
            }
        }
        this._triangles = origFaces.map((f) => {
            const tri = new Triangle();
            tri.v[0] = f.a;
            tri.v[1] = f.b;
            tri.v[2] = f.c;
            tri.va[0] = f.a;
            tri.va[1] = f.b;
            tri.va[2] = f.c;
            return tri;
        });
    }
    /**
     * 修改队列长度
     * @param array
     * @param count
     * @returns
     */
    _resize(array, count) {
        if (count < array.length) {
            return array.splice(count);
        }
        if (count > array.length) {
            // in JS, arrays need not be expanded
            // console.log('more');
        }
    }
    /**
     * 移动数据
     * @param refs
     * @param dest
     * @param source
     * @param count
     */
    _move(refs, dest, source, count) {
        for (let i = 0; i < count; i++) {
            // 	refs[dest + i] = refs[source + i];
            refs[dest + i].tvertex = refs[source + i].tvertex;
            refs[dest + i].tid = refs[source + i].tid;
        }
    }
    /**
     * 合并网格
     */
    compactMesh() {
        //	console.log('compact_mesh');
        let /*int */ dst = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].tcount = 0;
        }
        for (let i = 0; i < this._triangles.length; i++) {
            if (!this._triangles[i].deleted) {
                const /*Triangle &*/ t = this._triangles[i];
                for (let j = 0; j < 3; j++) {
                    if (t.va[j] != t.v[j]) {
                        const iDest = t.va[j];
                        const iSrc = t.v[j];
                        cc_1.Vec3.copy(this._vertices[iDest].p, this._vertices[iSrc].p);
                        if (this._vertWeights != null) {
                            cc_1.Vec4.copy(this._vertWeights[iDest], this._vertWeights[iSrc]);
                        }
                        if (this._vertJoints != null) {
                            cc_1.Vec4.copy(this._vertJoints[iDest], this._vertJoints[iSrc]);
                        }
                        t.v[j] = t.va[j];
                    }
                }
                this._triangles[dst++] = t;
                for (let j = 0; j < 3; j++)
                    this._vertices[t.v[j]].tcount = 1;
            }
        }
        this._resize(this._triangles, dst);
        dst = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            if (this._vertices[i].tcount) {
                this._vertices[i].tstart = dst;
                this._vertices[dst].index = dst;
                this._vertices[dst].p = this._vertices[i].p;
                if (this._vertUV2D) {
                    this._vertUV2D[dst] = this._vertUV2D[i];
                }
                if (this._vertNormals) {
                    this._vertNormals[dst] = this._vertNormals[i];
                }
                if (this._vertTangents) {
                    this._vertTangents[dst] = this._vertTangents[i];
                }
                if (this._vertColors) {
                    this._vertColors[dst] = this._vertColors[i];
                }
                if (this._vertJoints) {
                    this._vertJoints[dst] = this._vertJoints[i];
                }
                if (this._vertWeights) {
                    this._vertWeights[dst] = this._vertWeights[i];
                }
                dst++;
            }
        }
        for (let i = 0; i < this._triangles.length; i++) {
            const /*Triangle &*/ t = this._triangles[i];
            for (let j = 0; j < 3; j++)
                t.v[j] = this._vertices[t.v[j]].tstart;
        }
        //	console.log('%cCompact Mesh', 'background:#f00', this._vertices.length, dst);
        this._resize(this._vertices, dst);
        //	console.log('%cCompact Mesh ok', 'background:#f00', this._vertices.length, dst);
    }
    /**
     * 简化网格
     * @param target_count
     * @param agressiveness
     */
    _simplifyMesh(target_count, agressiveness) {
        if (agressiveness === undefined)
            agressiveness = this.simplificationOptions.agressiveness;
        // TODO normalize_mesh to max length 1?
        console.time('simplify_mesh');
        let i, il;
        // set all triangles to non deleted
        for (i = 0, il = this._triangles.length; i < il; i++) {
            this._triangles[i].deleted = false;
        }
        // main iteration loop
        let deleted_triangles = 0;
        const deleted0 = [], deleted1 = []; // std::vector<int>
        const triangle_count = this._triangles.length;
        for (let iteration = 0; iteration < this.simplificationOptions.maxIterationCount; iteration++) {
            // 	console.log("iteration %d - triangles %d, tris\n", iteration, triangle_count - deleted_triangles, this._triangles.length);
            if (triangle_count - deleted_triangles <= target_count)
                break;
            // update mesh once in a while
            if (iteration % 5 === 0) {
                this._updateMesh(iteration);
            }
            // clear dirty flag
            for (let j = 0; j < this._triangles.length; j++) {
                this._triangles[j].dirty = false;
            }
            //
            // All triangles with edges below the threshold will be removed
            //
            // The following numbers works well for most models.
            // If it does not, try to adjust the 3 parameters
            //
            //let threshold = 0.000000001 * Math.pow(iteration + 3, agressiveness);
            const threshold = 1e-13 * Math.pow(iteration + 3, agressiveness);
            // remove vertices & mark deleted triangles
            for (i = 0, il = this._triangles.length; i < il; i++) {
                const t = this._triangles[i];
                if (t.err[3] > threshold || t.deleted || t.dirty)
                    continue;
                for (let j = 0; j < 3; j++) {
                    if (t.err[j] < threshold) {
                        const i0 = t.v[j];
                        const v0 = this._vertices[i0];
                        const i1 = t.v[(j + 1) % 3];
                        const v1 = this._vertices[i1];
                        // Border check
                        if (v0.border != v1.border)
                            continue;
                        else if (v0.uvSteam != v1.uvSteam)
                            continue;
                        else if (v0.uvFoldover != v1.uvFoldover)
                            continue;
                        else if (this.simplificationOptions.preserveBorderEdges && v0.border)
                            continue;
                        // If seams should be preserved
                        else if (this.simplificationOptions.preserveUVSeamEdges && v0.uvSteam)
                            continue;
                        // If foldovers should be preserved
                        else if (this.simplificationOptions.preserveUVFoldoverEdges && v0.uvFoldover)
                            continue;
                        // Compute vertex to collapse to
                        const p = new cc_1.Vec3();
                        this._calculateError(i0, i1, p);
                        // console.log('Compute vertex to collapse to', p);
                        this._resize(deleted0, v0.tcount); // normals temporarily
                        this._resize(deleted1, v1.tcount); // normals temporarily
                        // dont remove if _flipped
                        if (this._flipped(p, i0, i1, v0, v1, deleted0))
                            continue;
                        if (this._flipped(p, i1, i0, v1, v0, deleted1))
                            continue;
                        // Calculate the barycentric coordinates within the triangle
                        const i2 = t.v[(j + 2) % 3];
                        const barycentricCoord = new cc_1.Vec3();
                        this.calculateBarycentricCoords(p, v0.p, v1.p, this._vertices[i2].p, barycentricCoord);
                        // not _flipped, so remove edge
                        v0.p = p;
                        // v0.q = v1.q + v0.q;
                        v0.q.addSelf(v1.q);
                        // Interpolate the vertex attributes
                        let ia0 = t.va[j];
                        const ia1 = t.va[(j + 1) % 3];
                        const ia2 = t.va[(j + 2) % 3];
                        this._interpolateVertexAttributes(ia0, ia0, ia1, ia2, barycentricCoord);
                        if (this._vertices[i0].uvSteam) {
                            ia0 = -1;
                        }
                        const tstart = this._refs.length;
                        // CONTINUE
                        deleted_triangles = this._updateTriangles(i0, ia0, v0, deleted0, deleted_triangles);
                        // console.log('deleted triangle v0', deleted_triangles);
                        deleted_triangles = this._updateTriangles(i0, ia0, v1, deleted1, deleted_triangles);
                        // console.log('deleted triangle v1', deleted_triangles);
                        const tcount = this._refs.length - tstart;
                        if (tcount <= v0.tcount) {
                            // console.log('save ram?');
                            if (tcount)
                                this._move(this._refs, v0.tstart, tstart, tcount);
                        }
                        // append
                        else
                            v0.tstart = tstart;
                        v0.tcount = tcount;
                        break;
                    }
                } // end for j
                // done?
                if (triangle_count - deleted_triangles <= target_count)
                    break;
            }
        } // end iteration
        // clean up mesh
        this.compactMesh();
        // ready
        console.timeEnd('simplify_mesh');
        // int timeEnd=timeGetTime();
        // printf("%s - %d/%d %d%% removed in %d ms\n",__FUNCTION__,
        // 	triangle_count-deleted_triangles,
        // 	triangle_count,deleted_triangles*100/triangle_count,
        // 	timeEnd-timeStart);
    }
    _flipped(
    /* vec3f */ p, 
    /*int*/ i0, 
    /*int*/ i1, 
    /*Vertex*/ v0, 
    /*Vertex*/ v1, // not needed
    /*std::vector<int>*/ deleted) {
        // let bordercount = 0;
        for (let k = 0; k < v0.tcount; k++) {
            // Triangle &
            const t = this._triangles[this._refs[v0.tstart + k].tid];
            if (t.deleted)
                continue;
            const s = this._refs[v0.tstart + k].tvertex;
            const id1 = t.v[(s + 1) % 3];
            const id2 = t.v[(s + 2) % 3];
            if (id1 == i1 || id2 == i1) {
                // delete ?
                // bordercount++;
                deleted[k] = true;
                continue;
            }
            /* vec3f */
            cc_1.Vec3.subtract(_tempVec3, this._vertices[id1].p, p);
            _tempVec3.normalize();
            cc_1.Vec3.subtract(_tempVec3_2, this._vertices[id2].p, p);
            _tempVec3_2.normalize();
            if (Math.abs(cc_1.Vec3.dot(_tempVec3, _tempVec3_2)) > 0.999)
                return true;
            /*vec3f  n;*/
            cc_1.Vec3.cross(_tempVec3_3, _tempVec3, _tempVec3_2);
            _tempVec3_3.normalize();
            deleted[k] = false;
            if (cc_1.Vec3.dot(_tempVec3_3, t.n) < 0.2)
                return true;
        }
        return false;
    }
    // Update triangle connections and edge error after a edge is collapsed
    /**
     * 更新三角形信息
     * @param i0
     * @param ia0
     * @param v
     * @param deleted
     * @param deleted_triangles
     * @returns
     */
    _updateTriangles(
    /*int*/ i0, ia0, 
    /*Vertex &*/ v, 
    /*std::vector<int> & */ deleted, 
    /*int &*/ deleted_triangles) {
        // console.log('_updateTriangles');
        // vec3f p;
        const p = new cc_1.Vec3();
        for (let k = 0; k < v.tcount; k++) {
            const /*Ref &*/ r = this._refs[v.tstart + k];
            const /*Triangle &*/ t = this._triangles[r.tid];
            if (t.deleted)
                continue;
            if (deleted[k]) {
                t.deleted = true;
                deleted_triangles++;
                continue;
            }
            t.v[r.tvertex] = i0;
            if (ia0 != -1) {
                t.va[r.tvertex] = ia0;
            }
            t.dirty = true;
            t.err[0] = this._calculateError(t.v[0], t.v[1], p);
            t.err[1] = this._calculateError(t.v[1], t.v[2], p);
            t.err[2] = this._calculateError(t.v[2], t.v[0], p);
            t.err[3] = Math.min(t.err[0], t.err[1], t.err[2]);
            this._refs.push(r);
        }
        return deleted_triangles;
    }
    // compact triangles, compute edge error and build reference list
    _updateMesh(iteration) {
        // console.log('_updateMesh', iteration, this._triangles.length);
        if (iteration > 0) {
            // compact triangles
            let dst = 0;
            for (let i = 0; i < this._triangles.length; i++) {
                const target = this._triangles[i];
                if (!target.deleted) {
                    this._triangles[dst++] = target;
                }
            }
            // console.log('not deleted dst', this._triangles.length, dst);
            this._triangles.splice(dst);
        }
        this._updateReferences();
        // Init Quadrics by Plane & Edge Errors
        //
        // required at the beginning ( iteration == 0 )
        // recomputing during the simplification is not required,
        // but mostly improves the result for closed meshes
        //
        // Identify boundary : vertices[].border=0,1
        if (iteration == 0) {
            // std::vector<int> vcount,vids;
            let vcount, vids;
            let borderVertexCount = 0;
            let borderMinX = 1.7976931348623157e308;
            let borderMaxX = -1.7976931348623157e308;
            for (let i = 0; i < this._vertices.length; i++) {
                this._vertices[i].border = false;
                this._vertices[i].uvSteam = false;
                this._vertices[i].uvFoldover = false;
            }
            for (let i = 0; i < this._vertices.length; i++) {
                const /*Vertex &*/ v = this._vertices[i];
                // vcount.clear();
                // vids.clear();
                vcount = [];
                vids = [];
                for (let j = 0; j < v.tcount; j++) {
                    const k = this._refs[v.tstart + j].tid;
                    const /*Triangle &*/ t = this._triangles[k];
                    for (let k = 0; k < 3; k++) {
                        let ofs = 0, id = t.v[k];
                        while (ofs < vcount.length) {
                            if (vids[ofs] == id)
                                break;
                            ofs++;
                        }
                        if (ofs == vcount.length) {
                            vcount.push(1);
                            vids.push(id);
                        }
                        else {
                            vcount[ofs]++;
                        }
                    }
                }
                for (let j = 0; j < vcount.length; j++) {
                    if (vcount[j] == 1) {
                        this._vertices[vids[j]].border = true;
                        borderVertexCount++;
                        if (this.simplificationOptions.enableSmartLink) {
                            const id = vids[j];
                            if (this._vertices[id].p.x < borderMinX) {
                                borderMinX = this._vertices[id].p.x;
                            }
                            if (this._vertices[id].p.x > borderMaxX) {
                                borderMaxX = this._vertices[id].p.x;
                            }
                        }
                    }
                }
            }
            if (this.simplificationOptions.enableSmartLink) {
                // First find all border vertices
                const borderVertices = new Array(borderVertexCount);
                let borderIndexCount = 0;
                const borderAreaWidth = borderMaxX - borderMinX;
                for (let i = 0; i < this._vertices.length; i++) {
                    if (this._vertices[i].border) {
                        const vertexHash = (((this._vertices[i].p.x - borderMinX) / borderAreaWidth) * 2.0 - 1.0) * 2147483647;
                        borderVertices[borderIndexCount] = new BorderVertex(i, vertexHash);
                        ++borderIndexCount;
                    }
                }
                // Sort the border vertices by hash
                borderVertices.sort((x, y) => {
                    // if (x.hash > y.hash) {
                    // 	return 1
                    // } else if (x.hash < y.hash) {
                    // 	return -1
                    // }
                    return x.hash - y.hash;
                });
                // Calculate the maximum hash distance based on the maximum vertex link distance
                const vertexLinkDistanceSqr = this.simplificationOptions.vertexLinkDistance * this.simplificationOptions.vertexLinkDistance;
                const vertexLinkDistance = Math.sqrt(vertexLinkDistanceSqr);
                const hashMaxDistance = Math.max((vertexLinkDistance / borderAreaWidth) * 2147483647, 1);
                // Then find identical border vertices and bind them together as one
                for (let i = 0; i < borderIndexCount; i++) {
                    const myIndex = borderVertices[i].index;
                    if (myIndex == -1)
                        continue;
                    const myPoint = this._vertices[myIndex].p;
                    for (let j = i + 1; j < borderIndexCount; j++) {
                        const otherIndex = borderVertices[j].index;
                        if (otherIndex == -1)
                            continue;
                        else if (borderVertices[j].hash - borderVertices[i].hash > hashMaxDistance)
                            // There is no point to continue beyond this point
                            break;
                        const otherPoint = this._vertices[otherIndex].p;
                        const sqrX = (myPoint.x - otherPoint.x) * (myPoint.x - otherPoint.x);
                        const sqrY = (myPoint.y - otherPoint.y) * (myPoint.y - otherPoint.y);
                        const sqrZ = (myPoint.z - otherPoint.z) * (myPoint.z - otherPoint.z);
                        const sqrMagnitude = sqrX + sqrY + sqrZ;
                        if (sqrMagnitude <= vertexLinkDistanceSqr) {
                            borderVertices[j].index = -1; // NOTE: This makes sure that the "other" vertex is not processed again
                            this._vertices[myIndex].border = false;
                            this._vertices[otherIndex].border = false;
                            // AreUVsTheSame
                            if (this._vertUV2D[myIndex].equals(this._vertUV2D[otherIndex])) {
                                this._vertices[myIndex].uvFoldover = true;
                                this._vertices[otherIndex].uvFoldover = true;
                            }
                            else {
                                this._vertices[myIndex].uvSteam = true;
                                this._vertices[otherIndex].uvSteam = true;
                            }
                            const otherTriangleCount = this._vertices[otherIndex].tcount;
                            const otherTriangleStart = this._vertices[otherIndex].tstart;
                            for (let k = 0; k < otherTriangleCount; k++) {
                                const r = this._refs[otherTriangleStart + k];
                                this._triangles[r.tid].v[r.tvertex] = myIndex;
                            }
                        }
                    }
                }
                // Update the references again
                this._updateReferences();
            }
            for (let i = 0; i < this._vertices.length; i++) {
                // may not need to do this.
                this._vertices[i].q = new SymetricMatrix();
            }
            const p1p0 = new cc_1.Vec3();
            const p2p0 = new cc_1.Vec3();
            const p = new Array(3);
            const tmp = new SymetricMatrix();
            for (let i = 0; i < this._triangles.length; i++) {
                const /*Triangle &*/ t = this._triangles[i];
                const n = new cc_1.Vec3();
                for (let j = 0; j < 3; j++) {
                    p[j] = this._vertices[t.v[j]].p;
                }
                cc_1.Vec3.subtract(p1p0, p[1], p[0]);
                cc_1.Vec3.subtract(p2p0, p[2], p[0]);
                cc_1.Vec3.cross(n, p1p0, p2p0);
                cc_1.Vec3.normalize(n, n);
                t.n = n;
                tmp.makePlane(n.x, n.y, n.z, -n.dot(p[0]));
                for (let j = 0; j < 3; j++) {
                    this._vertices[t.v[j]].q.addSelf(tmp);
                }
                // vertices[t.v[j]].q =
                // vertices[t.v[j]].q.add(SymetricMatrix(n.x,n.y,n.z,-n.dot(p[0])));
            }
            for (let i = 0; i < this._triangles.length; i++) {
                // Calc Edge Error
                const /*Triangle &*/ t = this._triangles[i];
                // vec3f p;
                const p = new cc_1.Vec3();
                for (let j = 0; j < 3; j++) {
                    t.err[j] = this._calculateError(t.v[j], t.v[(j + 1) % 3], p);
                }
                t.err[3] = Math.min(t.err[0], t.err[1], t.err[2]);
            }
        }
    }
    // Finally compact mesh before exiting
    // Error between vertex and Quadric
    _vertexError(/*SymetricMatrix*/ q, /*double*/ x, y, z) {
        return (q.m[0] * x * x +
            2 * q.m[1] * x * y +
            2 * q.m[2] * x * z +
            2 * q.m[3] * x +
            q.m[4] * y * y +
            2 * q.m[5] * y * z +
            2 * q.m[6] * y +
            q.m[7] * z * z +
            2 * q.m[8] * z +
            q.m[9]);
    }
    // Error for one edge
    // if DECIMATE is defined vertex positions are NOT interpolated
    // Luebke Survey of Polygonal Simplification Algorithms:  "vertices of a model simplified by the decimation algorithm are a subset of the original model’s vertices."
    // http://www.cs.virginia.edu/~luebke/publications/pdf/cg+a.2001.pdf
    _calculateError(id_v1, id_v2, p_result) {
        // compute interpolated vertex
        const vertex1 = this._vertices[id_v1];
        const vertex2 = this._vertices[id_v2];
        const q = vertex1.q.add(vertex2.q);
        const border = vertex1.border && vertex2.border;
        let error = 0;
        const det = q.det(0, 1, 2, 1, 4, 5, 2, 5, 7);
        if (det !== 0 && !border) {
            // q_delta is invertible
            p_result.x = (-1 / det) * q.det(1, 2, 3, 4, 5, 6, 5, 7, 8); // vx = A41/det(q_delta)
            p_result.y = (1 / det) * q.det(0, 2, 3, 1, 5, 6, 2, 7, 8); // vy = A42/det(q_delta)
            p_result.z = (-1 / det) * q.det(0, 1, 3, 1, 4, 6, 2, 5, 8); // vz = A43/det(q_delta)
            let curvatureError = 0;
            if (this.simplificationOptions.preserveSurfaceCurvature) {
                curvatureError = this._curvatureError(vertex1, vertex2);
            }
            error = this._vertexError(q, p_result.x, p_result.y, p_result.z) + curvatureError;
        }
        else {
            // det = 0 -> try to find best result
            const /*vec3f*/ p1 = vertex1.p;
            const /*vec3f*/ p2 = vertex2.p;
            const /*vec3f*/ p3 = new cc_1.Vec3();
            cc_1.Vec3.add(p3, p1, p2);
            p3.multiplyScalar(0.5);
            const error1 = this._vertexError(q, p1.x, p1.y, p1.z);
            const error2 = this._vertexError(q, p2.x, p2.y, p2.z);
            const error3 = this._vertexError(q, p3.x, p3.y, p3.z);
            error = Math.min(error1, error2, error3);
            if (error1 === error)
                cc_1.Vec3.copy(p_result, p1);
            if (error2 === error)
                cc_1.Vec3.copy(p_result, p2);
            if (error3 === error)
                cc_1.Vec3.copy(p_result, p3);
        }
        return error;
    }
    _updateReferences() {
        // Init Reference ID list
        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].tstart = 0;
            this._vertices[i].tcount = 0;
        }
        for (let i = 0; i < this._triangles.length; i++) {
            /*Triangle &*/
            const t = this._triangles[i];
            for (let j = 0; j < 3; j++)
                this._vertices[t.v[j]].tcount++;
        }
        let tstart = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            const /*Vertex &*/ v = this._vertices[i];
            v.tstart = tstart;
            tstart += v.tcount;
            v.tcount = 0;
        }
        // Write References
        // _resize(refs, triangles.length * 3)
        // console.log('pre ref', this._refs.length, this._triangles.length * 3);
        for (let i = this._refs.length; i < this._triangles.length * 3; i++) {
            this._refs[i] = new Ref();
        }
        for (let i = 0; i < this._triangles.length; i++) {
            /*Triangle &*/
            const t = this._triangles[i];
            for (let j = 0; j < 3; j++) {
                /*Vertex &*/
                const v = this._vertices[t.v[j]];
                this._refs[v.tstart + v.tcount].tid = i;
                this._refs[v.tstart + v.tcount].tvertex = j;
                v.tcount++;
            }
        }
    }
    _curvatureError(vert0, vert1) {
        cc_1.Vec3.subtract(_tempVec3, vert0.p, vert1.p);
        const diffVector = _tempVec3.length();
        const trianglesWithViOrVjOrBoth = this._triangleHashSet1;
        trianglesWithViOrVjOrBoth.clear();
        this._getTrianglesContainingVertex(vert0, trianglesWithViOrVjOrBoth);
        this._getTrianglesContainingVertex(vert1, trianglesWithViOrVjOrBoth);
        const trianglesWithViAndVjBoth = this._triangleHashSet2;
        trianglesWithViAndVjBoth.clear();
        this._getTrianglesContainingBothVertices(vert0, vert1, trianglesWithViAndVjBoth);
        let maxDotOuter = 0;
        trianglesWithViOrVjOrBoth.forEach((index, triangleWithViOrVjOrBoth) => {
            let maxDotInner = 0;
            const normVecTriangleWithViOrVjOrBoth = triangleWithViOrVjOrBoth.n.clone();
            trianglesWithViAndVjBoth.forEach((index, triangleWithViAndVjBoth) => {
                const normVecTriangleWithViAndVjBoth = triangleWithViAndVjBoth.n.clone();
                const dot = cc_1.Vec3.dot(normVecTriangleWithViOrVjOrBoth, normVecTriangleWithViAndVjBoth);
                if (dot > maxDotInner)
                    maxDotInner = dot;
            });
            if (maxDotInner > maxDotOuter)
                maxDotOuter = maxDotInner;
        });
        return diffVector * maxDotOuter;
    }
    _getTrianglesContainingVertex(vert, tris) {
        const trianglesCount = vert.tcount;
        const startIndex = vert.tstart;
        for (let a = startIndex; a < startIndex + trianglesCount; a++) {
            tris.set(this._triangles[this._refs[a].tid], true);
        }
    }
    _getTrianglesContainingBothVertices(vert0, vert1, tris) {
        const triangleCount = vert0.tcount;
        const startIndex = vert0.tstart;
        for (let refIndex = startIndex; refIndex < startIndex + triangleCount; refIndex++) {
            const tid = this._refs[refIndex].tid;
            const tri = this._triangles[tid];
            if (this._vertices[tri.v[0]].index == vert1.index ||
                this._vertices[tri.v[1]].index == vert1.index ||
                this._vertices[tri.v[2]].index == vert1.index) {
                tris.set(tri, true);
            }
        }
    }
    simplifyMesh(target_count, agressiveness = 7) {
        try {
            target_count = Math.round(target_count);
            const geometry = JSON.parse(this._geometricInfo);
            this.init(geometry.vertices, geometry.faces, geometry);
            console.time('simplify');
            this._simplifyMesh(target_count, agressiveness);
            console.timeEnd('simplify');
            //	console.log('old vertices ' + geometry.vertices.length, 'old faces ' + geometry.faces.length);
            console.log('new vertices ' + this._vertices.length, 'old faces ' + this._triangles.length);
            // TODO convert to buffer geometry.
            const newGeo = {
                positions: [],
                indices: [],
                attrs: {},
            };
            const newLength = this._vertices.length;
            for (let i = 0; i < this._vertices.length; i++) {
                const v = this._vertices[i];
                newGeo.positions.push(v.p.x);
                newGeo.positions.push(v.p.y);
                newGeo.positions.push(v.p.z);
            }
            if (this._vertUV2D) {
                this._resize(this._vertUV2D, newLength);
                newGeo.uvs = [];
                for (let i = 0; i < this._vertUV2D.length; i++) {
                    const v = this._vertUV2D[i];
                    newGeo.uvs.push(v.x);
                    newGeo.uvs.push(v.y);
                }
            }
            if (this._vertNormals) {
                this._resize(this._vertNormals, newLength);
                newGeo.normals = [];
                for (let i = 0; i < this._vertNormals.length; i++) {
                    const v = this._vertNormals[i];
                    newGeo.normals.push(v.x);
                    newGeo.normals.push(v.y);
                    newGeo.normals.push(v.z);
                }
            }
            if (this._vertTangents) {
                this._resize(this._vertTangents, newLength);
                newGeo.tangents = [];
                for (let i = 0; i < this._vertTangents.length; i++) {
                    const v = this._vertTangents[i];
                    newGeo.tangents.push(v.x);
                    newGeo.tangents.push(v.y);
                    newGeo.tangents.push(v.z);
                    newGeo.tangents.push(v.w);
                }
            }
            if (this._vertColors) {
                this._resize(this._vertColors, newLength);
                newGeo.colors = [];
                for (let i = 0; i < this._vertColors.length; i++) {
                    const v = this._vertColors[i];
                    newGeo.colors.push(v.r);
                    newGeo.colors.push(v.g);
                    newGeo.colors.push(v.b);
                    newGeo.colors.push(v.a);
                }
            }
            if (this._vertJoints) {
                this._resize(this._vertJoints, newLength);
                const list = (newGeo.attrs['joints'] = []);
                for (let i = 0; i < this._vertJoints.length; i++) {
                    const v = this._vertJoints[i];
                    list.push(v.x);
                    list.push(v.y);
                    list.push(v.z);
                    list.push(v.w);
                }
            }
            if (this._vertWeights) {
                this._resize(this._vertWeights, newLength);
                const list = (newGeo.attrs['weights'] = []);
                for (let i = 0; i < this._vertWeights.length; i++) {
                    const v = this._vertWeights[i];
                    list.push(v.x);
                    list.push(v.y);
                    list.push(v.z);
                    list.push(v.w);
                }
            }
            for (let i = 0; i < this._triangles.length; i++) {
                const tri = this._triangles[i];
                newGeo.indices.push(tri.v[0]);
                newGeo.indices.push(tri.v[1]);
                newGeo.indices.push(tri.v[2]);
            }
            return newGeo;
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * 构建geometry信息
     * @param geometry
     */
    buildGeometric(geometry) {
        //@ts-ignore
        //	mergeVertices(geometry);
        const faces = [];
        if (geometry.indices) {
            for (let i = 0; i < geometry.indices.length; i += 3) {
                faces.push({
                    a: geometry.indices[i],
                    b: geometry.indices[i + 1],
                    c: geometry.indices[i + 2],
                });
            }
        }
        else {
            const nVertices = geometry.positions.length / 3;
            for (let i = 0; i < nVertices; i += 3) {
                faces.push({
                    a: 3 * i + 0,
                    b: 3 * i + 1,
                    c: 3 * i + 2,
                });
            }
        }
        geometry.faces = faces;
        const vertices = [];
        for (let i = 0; i < geometry.positions.length; i += 3) {
            vertices.push(new cc_1.Vec3(geometry.positions[i], geometry.positions[i + 1], geometry.positions[i + 2]));
        }
        geometry.vertices = vertices;
        for (const key in geometry) {
            if (geometry[key]) {
                if (!(geometry[key] instanceof Array)) {
                    geometry[key] = Array.from(geometry[key]);
                }
            }
            else {
                delete geometry[key];
            }
        }
        this._geometricInfo = JSON.stringify(geometry);
        // this.init(geometry.vertices, geometry.faces, geometry);
        // console.log('old vertices ' + geometry.vertices.length, 'old faces ' + geometry.faces.length);
        // simplify!
        // simplify_mesh(geometry.faces.length * 0.5 | 0, 7);
        // simplify_mesh(geometry.faces.length - 2, 4);
    }
    /**
     * 计算合并的uv信息
     * @param point
     * @param a
     * @param b
     * @param c
     * @param result
     */
    calculateBarycentricCoords(point, a, b, c, result) {
        const v0 = new cc_1.Vec3();
        const v1 = new cc_1.Vec3();
        const v2 = new cc_1.Vec3();
        cc_1.Vec3.subtract(v0, b, a);
        cc_1.Vec3.subtract(v1, c, a);
        cc_1.Vec3.subtract(v2, point, a);
        const d00 = cc_1.Vec3.dot(v0, v0);
        const d01 = cc_1.Vec3.dot(v0, v1);
        const d11 = cc_1.Vec3.dot(v1, v1);
        const d20 = cc_1.Vec3.dot(v2, v0);
        const d21 = cc_1.Vec3.dot(v2, v1);
        let denom = d00 * d11 - d01 * d01;
        // Make sure the denominator is not too small to cause math problems
        if (Math.abs(denom) < DenomEpilson) {
            denom = DenomEpilson;
        }
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1.0 - v - w;
        result.set(u, v, w);
    }
    _interpolateVertexAttributes(dst, i0, i1, i2, barycentricCoord) {
        if (this._vertNormals) {
            _tempVec3.set(0, 0, 0);
            cc_1.Vec3.scaleAndAdd(_tempVec3, _tempVec3, this._vertNormals[i0], barycentricCoord.x);
            cc_1.Vec3.scaleAndAdd(_tempVec3, _tempVec3, this._vertNormals[i1], barycentricCoord.y);
            cc_1.Vec3.scaleAndAdd(_tempVec3, _tempVec3, this._vertNormals[i2], barycentricCoord.z);
            cc_1.Vec3.normalize(_tempVec3, _tempVec3);
            cc_1.Vec3.copy(this._vertNormals[dst], _tempVec3);
        }
        if (this._vertUV2D) {
            _tempVec2.set(0, 0);
            cc_1.Vec2.scaleAndAdd(_tempVec2, _tempVec2, this._vertUV2D[i0], barycentricCoord.x);
            cc_1.Vec2.scaleAndAdd(_tempVec2, _tempVec2, this._vertUV2D[i1], barycentricCoord.y);
            cc_1.Vec2.scaleAndAdd(_tempVec2, _tempVec2, this._vertUV2D[i2], barycentricCoord.z);
            cc_1.Vec2.copy(this._vertUV2D[dst], _tempVec2);
        }
        if (this._vertTangents) {
            _tempVec4.set(0, 0, 0, 0);
            cc_1.Vec4.scaleAndAdd(_tempVec4, _tempVec4, this._vertTangents[i0], barycentricCoord.x);
            cc_1.Vec4.scaleAndAdd(_tempVec4, _tempVec4, this._vertTangents[i1], barycentricCoord.y);
            cc_1.Vec4.scaleAndAdd(_tempVec4, _tempVec4, this._vertTangents[i2], barycentricCoord.z);
            this._normalizeTangent(this._vertTangents[dst], _tempVec4);
        }
        if (this._vertColors) {
            _tempColor.set(0, 0, 0, 0);
            colorScaleAndAdd(_tempColor, _tempColor, this._vertColors[i0], barycentricCoord.x);
            colorScaleAndAdd(_tempColor, _tempColor, this._vertColors[i1], barycentricCoord.y);
            colorScaleAndAdd(_tempColor, _tempColor, this._vertColors[i2], barycentricCoord.z);
            this._vertColors[dst].set(_tempColor.r, _tempColor.g, _tempColor.b, _tempColor.a);
        }
    }
    _normalizeTangent(out, tangent) {
        const tangentVec = new cc_1.Vec3(tangent.x, tangent.y, tangent.z);
        tangentVec.normalize();
        out.set(tangentVec.x, tangentVec.y, tangentVec.z, tangent.w);
    }
}
exports.MeshSimplify = MeshSimplify;
function appendUint8Array(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}
function getDefaultSimplifyOptions() {
    return {
        targetRatio: 1,
        enableSmartLink: true,
        agressiveness: 7,
        maxIterationCount: 100,
    };
}
//simplify the mesh return a new mesh， only support indexed triangle mesh
function simplifyMesh(mesh, options) {
    for (let i = 0; i < mesh.struct.primitives.length; i++) {
        const primitive = mesh.struct.primitives[i];
        if (primitive.primitiveMode !== cc_2.gfx.PrimitiveMode.TRIANGLE_LIST || primitive.indexView === undefined) {
            //TODO: support other primitive mode
            console.warn('SimplifyMesh current only support indexed triangle mesh, opreation is skipped');
            return mesh;
        }
    }
    const defaultOptions = getDefaultSimplifyOptions();
    options = Object.assign(defaultOptions, options || {});
    let byteOffset = 0, j = 0;
    const vertexBundles = new Array();
    const primitives = new Array();
    let data = new Uint8Array(0); //initlize out mesh data with empty data
    //simplify each submesh of the mesh
    for (let i = 0; i < mesh.struct.vertexBundles.length; i++) {
        const indices = mesh.readIndices(i);
        const vertexCount = mesh.struct.vertexBundles[i].view.count;
        const triangleCount = indices ? indices.length / 3 : vertexCount / 3;
        if (triangleCount > 0) {
            const uvs = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_TEX_COORD);
            const tangents = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_TANGENT);
            const normals = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_NORMAL);
            const weights = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_WEIGHTS);
            const joints = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_JOINTS);
            const colors = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_COLOR);
            const positions = mesh.readAttribute(i, cc_2.gfx.AttributeName.ATTR_POSITION);
            const simplify = new MeshSimplify();
            simplify.buildGeometric({ positions, normals, uvs, indices: indices ?? undefined, tangents, weights, joints, colors });
            simplify.simplificationOptions.agressiveness = options.agressiveness;
            simplify.simplificationOptions.enableSmartLink = options.enableSmartLink;
            const result = simplify.simplifyMesh(options.targetRatio * triangleCount);
            const gInfo = { ...result, customAttributes: [], primitiveMode: cc_2.gfx.PrimitiveMode.TRIANGLE_LIST };
            if (gInfo.attrs) {
                const attrs = gInfo.attrs;
                delete gInfo.attrs;
                for (const key in attrs) {
                    if (key == 'joints') {
                        const info = {
                            attr: new cc_2.gfx.Attribute(cc_2.gfx.AttributeName.ATTR_JOINTS, cc_2.gfx.Format.RGBA16UI),
                            values: attrs[key],
                        };
                        gInfo.customAttributes.push(info);
                    }
                    else if (key == 'weights') {
                        const info = {
                            attr: new cc_2.gfx.Attribute(cc_2.gfx.AttributeName.ATTR_WEIGHTS, cc_2.gfx.Format.RGBA32F),
                            values: attrs[key],
                        };
                        gInfo.customAttributes.push(info);
                    }
                }
            }
            const subMesh = new cc_2.Mesh();
            cc_2.utils.createMesh(gInfo, subMesh, { calculateBounds: true });
            // append submesh data to out mesh data
            (0, cc_1.assert)(subMesh.struct.vertexBundles.length == 1);
            const vertexBundle = subMesh.struct.vertexBundles[0];
            data = appendUint8Array(data, subMesh.data.slice(vertexBundle.view.offset, vertexBundle.view.offset + vertexBundle.view.length));
            vertexBundle.view.offset = byteOffset;
            vertexBundles.push(vertexBundle);
            byteOffset += vertexBundle.view.length;
            let primitive;
            if (subMesh.struct.primitives !== undefined) {
                (0, cc_1.assert)(subMesh.struct.primitives.length == 1);
                primitive = subMesh.struct.primitives[0];
                (0, cc_1.assert)(primitive.indexView);
                data = appendUint8Array(data, subMesh.data.slice(primitive.indexView.offset, primitive.indexView.offset + primitive.indexView.length));
                primitive.indexView.offset = byteOffset;
                primitive.jointMapIndex = subMesh.struct.primitives[0].jointMapIndex;
                primitives.push(primitive);
                byteOffset += primitive.indexView.length;
                primitives[j].vertexBundelIndices = [j];
                j += 1;
            }
        }
    }
    const meshCreateInfo = {
        struct: {
            vertexBundles: vertexBundles,
            primitives: primitives,
            minPosition: mesh.struct.minPosition,
            maxPosition: mesh.struct.maxPosition,
        },
        data: data,
    };
    const out = new cc_2.Mesh();
    out.reset(meshCreateInfo);
    out.hash;
    return out;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzaFNpbXBsaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2dsdGYvbWVzaFNpbXBsaWZ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXNCRTtBQUNGLDZDQUE2QztBQUM3QyxFQUFFO0FBQ0YsK0JBQStCO0FBQy9CLEVBQUU7QUFDRixnQ0FBZ0M7QUFDaEMsRUFBRTtBQUNGLGdCQUFnQjtBQUNoQixxQ0FBcUM7QUFDckMsRUFBRTtBQUNGLDhEQUE4RDtBQUM5RCxrQ0FBa0M7OztBQStyQ2xDLDhEQU9DO0FBR0Qsb0NBa0dDO0FBenlDRCwyQkFBaUU7QUFDakUsMkJBQXNDO0FBR3RDLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQy9CLE1BQU0sV0FBVyxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQUssRUFBRSxDQUFDO0FBRS9CLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQztBQUVoQyxPQUFPO0FBQ1AsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFVLEVBQUUsTUFBYSxFQUFFLE1BQWEsRUFBRSxLQUFhO0lBQzdFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ25ELEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FB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QyxDQUFDLENBQUMsRUFFbEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNsQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBRWxCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDckIsQ0FBQztJQUNOLENBQUM7SUFFTSxPQUFPLENBQUMsQ0FBaUI7UUFDNUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsQ0FBQyxDQUFD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QztRQUNMLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUgsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakgsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFD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Q3ZDO1FBQ0QsSUFBSSxFQUFFLElBQUk7S0FDYixDQUFDO0lBQ0YsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztJQUN2QixHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzFCLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDVCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuTUlUIExpY2Vuc2VcblxuQ29weXJpZ2h0KGMpIDIwMTctMjAyMCBNYXR0aWFzIEVkbHVuZFxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuU09GVFdBUkUuXG4qL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gTWVzaCBTaW1wbGlmaWNhdGlvbiBUdXRvcmlhbFxuLy9cbi8vIChDKSBieSBTdmVuIEZvcnN0bWFubiBpbiAyMDE0XG4vL1xuLy8gTGljZW5zZSA6IE1JVFxuLy8gaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuLy9cbi8vaHR0cHM6Ly9naXRodWIuY29tL3NwNGNlcmF0L0Zhc3QtUXVhZHJpYy1NZXNoLVNpbXBsaWZpY2F0aW9uXG4vLyBAdHMtbm9jaGVjayDmraTmlrnms5XmnInlvojlpJrlrprkuYnkuI3mmI7vvIzmmoLml7bml6Dms5XlrozlloTlrprkuYlcblxuaW1wb3J0IHsgVmVjMywgVmVjMiwgVmVjNCwgQ29sb3IsIG1hdGgsIGFzc2VydCwgdmlldyB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGdmeCwgTWVzaCwgdXRpbHMgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBTaW1wbGlmeU9wdGlvbnMgfSBmcm9tICcuLi8uLi9tZXRhLXNjaGVtYXMvZ2xURi5tZXRhJztcblxuY29uc3QgX3RlbXBWZWMyID0gbmV3IFZlYzIoKTtcbmNvbnN0IF90ZW1wVmVjMyA9IG5ldyBWZWMzKCk7XG5jb25zdCBfdGVtcFZlYzNfMiA9IG5ldyBWZWMzKCk7XG5jb25zdCBfdGVtcFZlYzNfMyA9IG5ldyBWZWMzKCk7XG5jb25zdCBfdGVtcFZlYzQgPSBuZXcgVmVjNCgpO1xuY29uc3QgX3RlbXBDb2xvciA9IG5ldyBDb2xvcigpO1xuXG5jb25zdCBEZW5vbUVwaWxzb24gPSAwLjAwMDAwMDAxO1xuXG4vLyDpopzoibLnm7jliqBcbmZ1bmN0aW9uIGNvbG9yU2NhbGVBbmRBZGQob3V0OiBDb2xvciwgY29sb3JhOiBDb2xvciwgY29sb3JiOiBDb2xvciwgc2NhbGU6IG51bWJlcikge1xuICAgIG91dC5yID0gTWF0aC5tYXgoY29sb3JhLnIgKyBjb2xvcmIuciAqIHNjYWxlLCAyNTUpO1xuICAgIG91dC5nID0gTWF0aC5tYXgoY29sb3JhLmcgKyBjb2xvcmIuZyAqIHNjYWxlLCAyNTUpO1xuICAgIG91dC5iID0gTWF0aC5tYXgoY29sb3JhLmIgKyBjb2xvcmIuYiAqIHNjYWxlLCAyNTUpO1xuICAgIG91dC5hID0gTWF0aC5tYXgoY29sb3JhLmEgKyBjb2xvcmIuYSAqIHNjYWxlLCAyNTUpO1xufVxuY2xhc3MgU3ltZXRyaWNNYXRyaXgge1xuICAgIHB1YmxpYyBtO1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLm0gPSBuZXcgQXJyYXkoMTApLmZpbGwoMCk7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoXG4gICAgICAgIG0xMTogbnVtYmVyLFxuICAgICAgICBtMTI6IG51bWJlcixcbiAgICAgICAgbTEzOiBudW1iZXIsXG4gICAgICAgIG0xNDogbnVtYmVyLFxuICAgICAgICBtMjI6IG51bWJlcixcbiAgICAgICAgbTIzOiBudW1iZXIsXG4gICAgICAgIG0yNDogbnVtYmVyLFxuICAgICAgICBtMzM6IG51bWJlcixcbiAgICAgICAgbTM0OiBudW1iZXIsXG4gICAgICAgIG00NDogbnVtYmVyLFxuICAgICkge1xuICAgICAgICB0aGlzLm1bMF0gPSBtMTE7XG4gICAgICAgIHRoaXMubVsxXSA9IG0xMjtcbiAgICAgICAgdGhpcy5tWzJdID0gbTEzO1xuICAgICAgICB0aGlzLm1bM10gPSBtMTQ7XG5cbiAgICAgICAgdGhpcy5tWzRdID0gbTIyO1xuICAgICAgICB0aGlzLm1bNV0gPSBtMjM7XG4gICAgICAgIHRoaXMubVs2XSA9IG0yNDtcblxuICAgICAgICB0aGlzLm1bN10gPSBtMzM7XG4gICAgICAgIHRoaXMubVs4XSA9IG0zNDtcblxuICAgICAgICB0aGlzLm1bOV0gPSBtNDQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHB1YmxpYyBtYWtlUGxhbmUoYTogbnVtYmVyLCBiOiBudW1iZXIsIGM6IG51bWJlciwgZDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldChhICogYSwgYSAqIGIsIGEgKiBjLCBhICogZCwgYiAqIGIsIGIgKiBjLCBiICogZCwgYyAqIGMsIGMgKiBkLCBkICogZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRldChhMTE6IG51bWJlciwgYTEyOiBudW1iZXIsIGExMzogbnVtYmVyLCBhMjE6IG51bWJlciwgYTIyOiBudW1iZXIsIGEyMzogbnVtYmVyLCBhMzE6IG51bWJlciwgYTMyOiBudW1iZXIsIGEzMzogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGRldCA9XG4gICAgICAgICAgICB0aGlzLm1bYTExXSAqIHRoaXMubVthMjJdICogdGhpcy5tW2EzM10gK1xuICAgICAgICAgICAgdGhpcy5tW2ExM10gKiB0aGlzLm1bYTIxXSAqIHRoaXMubVthMzJdICtcbiAgICAgICAgICAgIHRoaXMubVthMTJdICogdGhpcy5tW2EyM10gKiB0aGlzLm1bYTMxXSAtXG4gICAgICAgICAgICB0aGlzLm1bYTEzXSAqIHRoaXMubVthMjJdICogdGhpcy5tW2EzMV0gLVxuICAgICAgICAgICAgdGhpcy5tW2ExMV0gKiB0aGlzLm1bYTIzXSAqIHRoaXMubVthMzJdIC1cbiAgICAgICAgICAgIHRoaXMubVthMTJdICogdGhpcy5tW2EyMV0gKiB0aGlzLm1bYTMzXTtcbiAgICAgICAgcmV0dXJuIGRldDtcbiAgICB9XG5cbiAgICAvLyBwcm9kdWNlcyBuZXcgTWF0cml4XG4gICAgcHVibGljIGFkZChuOiBTeW1ldHJpY01hdHJpeCkge1xuICAgICAgICByZXR1cm4gbmV3IFN5bWV0cmljTWF0cml4KCkuc2V0KFxuICAgICAgICAgICAgdGhpcy5tWzBdICsgbi5tWzBdLFxuICAgICAgICAgICAgdGhpcy5tWzFdICsgbi5tWzFdLFxuICAgICAgICAgICAgdGhpcy5tWzJdICsgbi5tWzJdLFxuICAgICAgICAgICAgdGhpcy5tWzNdICsgbi5tWzNdLFxuXG4gICAgICAgICAgICB0aGlzLm1bNF0gKyBuLm1bNF0sXG4gICAgICAgICAgICB0aGlzLm1bNV0gKyBuLm1bNV0sXG4gICAgICAgICAgICB0aGlzLm1bNl0gKyBuLm1bNl0sXG5cbiAgICAgICAgICAgIHRoaXMubVs3XSArIG4ubVs3XSxcbiAgICAgICAgICAgIHRoaXMubVs4XSArIG4ubVs4XSxcblxuICAgICAgICAgICAgdGhpcy5tWzldICsgbi5tWzldLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTZWxmKG46IFN5bWV0cmljTWF0cml4KSB7XG4gICAgICAgIHRoaXMubVswXSArPSBuLm1bMF07XG4gICAgICAgIHRoaXMubVsxXSArPSBuLm1bMV07XG4gICAgICAgIHRoaXMubVsyXSArPSBuLm1bMl07XG4gICAgICAgIHRoaXMubVszXSArPSBuLm1bM107XG4gICAgICAgIHRoaXMubVs0XSArPSBuLm1bNF07XG4gICAgICAgIHRoaXMubVs1XSArPSBuLm1bNV07XG4gICAgICAgIHRoaXMubVs2XSArPSBuLm1bNl07XG4gICAgICAgIHRoaXMubVs3XSArPSBuLm1bN107XG4gICAgICAgIHRoaXMubVs4XSArPSBuLm1bOF07XG4gICAgICAgIHRoaXMubVs5XSArPSBuLm1bOV07XG4gICAgfVxufVxuXG5jbGFzcyBUcmlhbmdsZSB7XG4gICAgcHVibGljIHY6IG51bWJlcltdO1xuICAgIHB1YmxpYyB2YTogbnVtYmVyW107XG4gICAgcHVibGljIGVycjogYW55W107XG4gICAgcHVibGljIGRlbGV0ZWQ6IGJvb2xlYW47XG4gICAgcHVibGljIGRpcnR5OiBib29sZWFuO1xuICAgIHB1YmxpYyBuOiBWZWMzO1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnYgPSBuZXcgQXJyYXkoMyk7IC8vIGluZGljZXMgZm9yIGFycmF5XG4gICAgICAgIHRoaXMudmEgPSBuZXcgQXJyYXkoMyk7IC8vIGluZGljZXMgZm9yIGFycmFcbiAgICAgICAgdGhpcy5lcnIgPSBuZXcgQXJyYXkoNCk7IC8vIGVycm9yc1xuICAgICAgICB0aGlzLmRlbGV0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgICAgICB0aGlzLm4gPSBuZXcgVmVjMygpOyAvLyBOb3JtYWxcbiAgICB9XG59XG5cbmNsYXNzIFZlcnRleCB7XG4gICAgcHVibGljIGluZGV4OiBudW1iZXI7XG4gICAgcHVibGljIHA6IFZlYzM7XG4gICAgLy8gcHVibGljIG46IFZlYzM7XG4gICAgLy8gcHVibGljIHV2OiBWZWMyO1xuICAgIC8vIHB1YmxpYyB0YW5nZW50czogVmVjNDtcbiAgICBwdWJsaWMgdHN0YXJ0OiBudW1iZXI7XG4gICAgcHVibGljIHRjb3VudDogbnVtYmVyO1xuICAgIHB1YmxpYyBxOiBTeW1ldHJpY01hdHJpeDtcbiAgICBwdWJsaWMgYm9yZGVyOiBib29sZWFuO1xuICAgIHB1YmxpYyB1dlN0ZWFtITogYm9vbGVhbjtcbiAgICBwdWJsaWMgdXZGb2xkb3ZlciE6IGJvb2xlYW47XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIHRoaXMudHN0YXJ0ID0gLTE7XG4gICAgICAgIHRoaXMudGNvdW50ID0gLTE7XG4gICAgICAgIHRoaXMucSA9IG5ldyBTeW1ldHJpY01hdHJpeCgpO1xuICAgICAgICB0aGlzLmJvcmRlciA9IGZhbHNlO1xuICAgIH1cbn1cblxuY2xhc3MgUmVmIHtcbiAgICBwdWJsaWMgdHZlcnRleCE6IG51bWJlcjtcbiAgICBwdWJsaWMgdGlkITogbnVtYmVyO1xufVxuXG5jbGFzcyBCb3JkZXJWZXJ0ZXgge1xuICAgIHB1YmxpYyBpbmRleDogbnVtYmVyO1xuICAgIHB1YmxpYyBoYXNoOiBudW1iZXI7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoaW5kZXg6IG51bWJlciwgaGFzaDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5oYXNoID0gaGFzaDtcbiAgICB9XG59XG5cbi8qKlxuICog6K6+572u5Y+C5pWwXG4gKi9cbmNsYXNzIFNpbXBsaWZpY2F0aW9uT3B0aW9ucyB7XG4gICAgcHVibGljIHByZXNlcnZlU3VyZmFjZUN1cnZhdHVyZSA9IGZhbHNlO1xuICAgIHB1YmxpYyBwcmVzZXJ2ZUJvcmRlckVkZ2VzID0gZmFsc2U7XG4gICAgcHVibGljIHByZXNlcnZlVVZTZWFtRWRnZXMgPSBmYWxzZTtcbiAgICBwdWJsaWMgcHJlc2VydmVVVkZvbGRvdmVyRWRnZXMgPSBmYWxzZTtcbiAgICBwdWJsaWMgZW5hYmxlU21hcnRMaW5rID0gdHJ1ZTtcbiAgICBwdWJsaWMgdmVydGV4TGlua0Rpc3RhbmNlID0gTnVtYmVyLk1JTl9WQUxVRTtcbiAgICBwdWJsaWMgbWF4SXRlcmF0aW9uQ291bnQgPSAxMDA7XG4gICAgcHVibGljIGFncmVzc2l2ZW5lc3MgPSA3LjA7XG59XG5cbi8qKlxuICog572R5qC8566A5YyWXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNoU2ltcGxpZnkge1xuICAgIHB1YmxpYyBzaW1wbGlmaWNhdGlvbk9wdGlvbnM6IFNpbXBsaWZpY2F0aW9uT3B0aW9ucyA9IG5ldyBTaW1wbGlmaWNhdGlvbk9wdGlvbnMoKTtcbiAgICBwcml2YXRlIF90cmlhbmdsZXM6IFRyaWFuZ2xlW10gPSBbXTsgLy8gVHJpYW5nbGVcbiAgICBwcml2YXRlIF92ZXJ0aWNlczogVmVydGV4W10gPSBbXTsgLy8gVmVydGV4XG5cbiAgICBwcml2YXRlIF92ZXJ0Tm9ybWFsczogVmVjM1tdIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfdmVydFRhbmdlbnRzOiBWZWM0W10gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF92ZXJ0VVYyRDogVmVjMltdIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfdmVydFVWM0Q6IFZlYzNbXSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX3ZlcnRVVjREOiBWZWM0W10gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF92ZXJ0Q29sb3JzOiBDb2xvcltdIHwgbnVsbCA9IG51bGw7XG5cbiAgICBwcml2YXRlIF92ZXJ0Sm9pbnRzOiBWZWM0W10gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF92ZXJ0V2VpZ2h0czogVmVjNFtdIHwgbnVsbCA9IG51bGw7XG5cbiAgICBwcml2YXRlIF9yZWZzOiBSZWZbXSA9IFtdOyAvLyBSZWZcbiAgICBwcml2YXRlIF9nZW9tZXRyaWNJbmZvID0gJyc7XG5cbiAgICBwcml2YXRlIF90cmlhbmdsZUhhc2hTZXQxID0gbmV3IE1hcDxUcmlhbmdsZSwgYm9vbGVhbj4oKTtcbiAgICBwcml2YXRlIF90cmlhbmdsZUhhc2hTZXQyID0gbmV3IE1hcDxUcmlhbmdsZSwgYm9vbGVhbj4oKTtcblxuICAgIC8qKlxuICAgICAqIOWIneWni+WMllxuICAgICAqIEBwYXJhbSBvcmlnVmVydGljZXNcbiAgICAgKiBAcGFyYW0gb3JpZ0ZhY2VzXG4gICAgICogQHBhcmFtIGluZm9cbiAgICAgKi9cbiAgICBwdWJsaWMgaW5pdChvcmlnVmVydGljZXM6IFZlYzNbXSwgb3JpZ0ZhY2VzOiBhbnlbXSwgaW5mbzogeyBub3JtYWxzPzsgdXZzPzsgdGFuZ2VudHM/OyBjb2xvcnM/OyBqb2ludHM/OyB3ZWlnaHRzPyB9KSB7XG4gICAgICAgIHRoaXMuX3ZlcnRpY2VzID0gb3JpZ1ZlcnRpY2VzLm1hcCgocCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBuZXcgVmVydGV4KCk7XG4gICAgICAgICAgICB2ZXJ0LmluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICB2ZXJ0LnAgPSBuZXcgVmVjMyhwLngsIHAueSwgcC56KTtcbiAgICAgICAgICAgIHJldHVybiB2ZXJ0O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaW5mby51dnMgJiYgaW5mby51dnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fdmVydFVWMkQgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mby51dnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0VVYyRC5wdXNoKG5ldyBWZWMyKGluZm8udXZzW2ldLCBpbmZvLnV2c1tpICsgMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5ub3JtYWxzICYmIGluZm8ubm9ybWFscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0Tm9ybWFscyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvLm5vcm1hbHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0Tm9ybWFscy5wdXNoKG5ldyBWZWMzKGluZm8ubm9ybWFsc1tpXSwgaW5mby5ub3JtYWxzW2kgKyAxXSwgaW5mby5ub3JtYWxzW2kgKyAyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8udGFuZ2VudHMgJiYgaW5mby50YW5nZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0VGFuZ2VudHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mby50YW5nZW50cy5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRUYW5nZW50cy5wdXNoKG5ldyBWZWM0KGluZm8udGFuZ2VudHNbaV0sIGluZm8udGFuZ2VudHNbaSArIDFdLCBpbmZvLnRhbmdlbnRzW2kgKyAyXSwgaW5mby50YW5nZW50c1tpICsgM10pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmZvLmNvbG9ycyAmJiBpbmZvLmNvbG9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0Q29sb3JzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZm8uY29sb3JzLmxlbmd0aDsgaSArPSA0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmVydENvbG9ycy5wdXNoKG5ldyBDb2xvcihpbmZvLmNvbG9yc1tpXSwgaW5mby5jb2xvcnNbaSArIDFdLCBpbmZvLmNvbG9yc1tpICsgMl0sIGluZm8uY29sb3JzW2kgKyAzXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8uam9pbnRzICYmIGluZm8uam9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRKb2ludHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mby5qb2ludHMubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0Sm9pbnRzLnB1c2gobmV3IFZlYzQoaW5mby5qb2ludHNbaV0sIGluZm8uam9pbnRzW2kgKyAxXSwgaW5mby5qb2ludHNbaSArIDJdLCBpbmZvLmpvaW50c1tpICsgM10pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmZvLndlaWdodHMgJiYgaW5mby53ZWlnaHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRXZWlnaHRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZm8ud2VpZ2h0cy5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRXZWlnaHRzLnB1c2gobmV3IFZlYzQoaW5mby53ZWlnaHRzW2ldLCBpbmZvLndlaWdodHNbaSArIDFdLCBpbmZvLndlaWdodHNbaSArIDJdLCBpbmZvLndlaWdodHNbaSArIDNdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cmlhbmdsZXMgPSBvcmlnRmFjZXMubWFwKChmKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmkgPSBuZXcgVHJpYW5nbGUoKTtcbiAgICAgICAgICAgIHRyaS52WzBdID0gZi5hO1xuICAgICAgICAgICAgdHJpLnZbMV0gPSBmLmI7XG4gICAgICAgICAgICB0cmkudlsyXSA9IGYuYztcblxuICAgICAgICAgICAgdHJpLnZhWzBdID0gZi5hO1xuICAgICAgICAgICAgdHJpLnZhWzFdID0gZi5iO1xuICAgICAgICAgICAgdHJpLnZhWzJdID0gZi5jO1xuICAgICAgICAgICAgcmV0dXJuIHRyaTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5L+u5pS56Zif5YiX6ZW/5bqmXG4gICAgICogQHBhcmFtIGFycmF5XG4gICAgICogQHBhcmFtIGNvdW50XG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwcml2YXRlIF9yZXNpemUoYXJyYXk6IGFueVtdLCBjb3VudDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChjb3VudCA8IGFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5LnNwbGljZShjb3VudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY291bnQgPiBhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIGluIEpTLCBhcnJheXMgbmVlZCBub3QgYmUgZXhwYW5kZWRcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdtb3JlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjmlbDmja5cbiAgICAgKiBAcGFyYW0gcmVmc1xuICAgICAqIEBwYXJhbSBkZXN0XG4gICAgICogQHBhcmFtIHNvdXJjZVxuICAgICAqIEBwYXJhbSBjb3VudFxuICAgICAqL1xuICAgIHByaXZhdGUgX21vdmUocmVmczogUmVmW10sIGRlc3Q6IG51bWJlciwgc291cmNlOiBudW1iZXIsIGNvdW50OiBudW1iZXIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBcdHJlZnNbZGVzdCArIGldID0gcmVmc1tzb3VyY2UgKyBpXTtcbiAgICAgICAgICAgIHJlZnNbZGVzdCArIGldLnR2ZXJ0ZXggPSByZWZzW3NvdXJjZSArIGldLnR2ZXJ0ZXg7XG4gICAgICAgICAgICByZWZzW2Rlc3QgKyBpXS50aWQgPSByZWZzW3NvdXJjZSArIGldLnRpZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQiOW5tue9keagvFxuICAgICAqL1xuICAgIHB1YmxpYyBjb21wYWN0TWVzaCgpIHtcbiAgICAgICAgLy9cdGNvbnNvbGUubG9nKCdjb21wYWN0X21lc2gnKTtcbiAgICAgICAgbGV0IC8qaW50ICovIGRzdCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLnRjb3VudCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fdHJpYW5nbGVzW2ldLmRlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCAvKlRyaWFuZ2xlICYqLyB0ID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQudmFbal0gIT0gdC52W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpRGVzdCA9IHQudmFbal07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpU3JjID0gdC52W2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgVmVjMy5jb3B5KHRoaXMuX3ZlcnRpY2VzW2lEZXN0XS5wLCB0aGlzLl92ZXJ0aWNlc1tpU3JjXS5wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0V2VpZ2h0cyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVjNC5jb3B5KHRoaXMuX3ZlcnRXZWlnaHRzW2lEZXN0XSwgdGhpcy5fdmVydFdlaWdodHNbaVNyY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRKb2ludHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlYzQuY29weSh0aGlzLl92ZXJ0Sm9pbnRzW2lEZXN0XSwgdGhpcy5fdmVydEpvaW50c1tpU3JjXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0LnZbal0gPSB0LnZhW2pdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fdHJpYW5nbGVzW2RzdCsrXSA9IHQ7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHRoaXMuX3ZlcnRpY2VzW3QudltqXV0udGNvdW50ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZXNpemUodGhpcy5fdHJpYW5nbGVzLCBkc3QpO1xuICAgICAgICBkc3QgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdmVydGljZXNbaV0udGNvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmVydGljZXNbaV0udHN0YXJ0ID0gZHN0O1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2RzdF0uaW5kZXggPSBkc3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmVydGljZXNbZHN0XS5wID0gdGhpcy5fdmVydGljZXNbaV0ucDtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0VVYyRCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0VVYyRFtkc3RdID0gdGhpcy5fdmVydFVWMkRbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0Tm9ybWFscykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0Tm9ybWFsc1tkc3RdID0gdGhpcy5fdmVydE5vcm1hbHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0VGFuZ2VudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmVydFRhbmdlbnRzW2RzdF0gPSB0aGlzLl92ZXJ0VGFuZ2VudHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0Q29sb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRDb2xvcnNbZHN0XSA9IHRoaXMuX3ZlcnRDb2xvcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0Sm9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRKb2ludHNbZHN0XSA9IHRoaXMuX3ZlcnRKb2ludHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0V2VpZ2h0cykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0V2VpZ2h0c1tkc3RdID0gdGhpcy5fdmVydFdlaWdodHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRzdCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IC8qVHJpYW5nbGUgJiovIHQgPSB0aGlzLl90cmlhbmdsZXNbaV07XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykgdC52W2pdID0gdGhpcy5fdmVydGljZXNbdC52W2pdXS50c3RhcnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy9cdGNvbnNvbGUubG9nKCclY0NvbXBhY3QgTWVzaCcsICdiYWNrZ3JvdW5kOiNmMDAnLCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGgsIGRzdCk7XG4gICAgICAgIHRoaXMuX3Jlc2l6ZSh0aGlzLl92ZXJ0aWNlcywgZHN0KTtcbiAgICAgICAgLy9cdGNvbnNvbGUubG9nKCclY0NvbXBhY3QgTWVzaCBvaycsICdiYWNrZ3JvdW5kOiNmMDAnLCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGgsIGRzdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog566A5YyW572R5qC8XG4gICAgICogQHBhcmFtIHRhcmdldF9jb3VudFxuICAgICAqIEBwYXJhbSBhZ3Jlc3NpdmVuZXNzXG4gICAgICovXG4gICAgcHJpdmF0ZSBfc2ltcGxpZnlNZXNoKHRhcmdldF9jb3VudDogbnVtYmVyLCBhZ3Jlc3NpdmVuZXNzOiBudW1iZXIgfCB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGFncmVzc2l2ZW5lc3MgPT09IHVuZGVmaW5lZCkgYWdyZXNzaXZlbmVzcyA9IHRoaXMuc2ltcGxpZmljYXRpb25PcHRpb25zLmFncmVzc2l2ZW5lc3M7XG5cbiAgICAgICAgLy8gVE9ETyBub3JtYWxpemVfbWVzaCB0byBtYXggbGVuZ3RoIDE/XG5cbiAgICAgICAgY29uc29sZS50aW1lKCdzaW1wbGlmeV9tZXNoJyk7XG5cbiAgICAgICAgbGV0IGksIGlsO1xuXG4gICAgICAgIC8vIHNldCBhbGwgdHJpYW5nbGVzIHRvIG5vbiBkZWxldGVkXG4gICAgICAgIGZvciAoaSA9IDAsIGlsID0gdGhpcy5fdHJpYW5nbGVzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX3RyaWFuZ2xlc1tpXS5kZWxldGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYWluIGl0ZXJhdGlvbiBsb29wXG5cbiAgICAgICAgbGV0IGRlbGV0ZWRfdHJpYW5nbGVzID0gMDtcbiAgICAgICAgY29uc3QgZGVsZXRlZDA6IG5ldmVyW10gPSBbXSxcbiAgICAgICAgICAgIGRlbGV0ZWQxOiBhbnlbXSA9IFtdOyAvLyBzdGQ6OnZlY3RvcjxpbnQ+XG4gICAgICAgIGNvbnN0IHRyaWFuZ2xlX2NvdW50ID0gdGhpcy5fdHJpYW5nbGVzLmxlbmd0aDtcblxuICAgICAgICBmb3IgKGxldCBpdGVyYXRpb24gPSAwOyBpdGVyYXRpb24gPCB0aGlzLnNpbXBsaWZpY2F0aW9uT3B0aW9ucy5tYXhJdGVyYXRpb25Db3VudDsgaXRlcmF0aW9uKyspIHtcbiAgICAgICAgICAgIC8vIFx0Y29uc29sZS5sb2coXCJpdGVyYXRpb24gJWQgLSB0cmlhbmdsZXMgJWQsIHRyaXNcXG5cIiwgaXRlcmF0aW9uLCB0cmlhbmdsZV9jb3VudCAtIGRlbGV0ZWRfdHJpYW5nbGVzLCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoKTtcblxuICAgICAgICAgICAgaWYgKHRyaWFuZ2xlX2NvdW50IC0gZGVsZXRlZF90cmlhbmdsZXMgPD0gdGFyZ2V0X2NvdW50KSBicmVhaztcblxuICAgICAgICAgICAgLy8gdXBkYXRlIG1lc2ggb25jZSBpbiBhIHdoaWxlXG4gICAgICAgICAgICBpZiAoaXRlcmF0aW9uICUgNSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lc2goaXRlcmF0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2xlYXIgZGlydHkgZmxhZ1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmlhbmdsZXNbal0uZGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFsbCB0cmlhbmdsZXMgd2l0aCBlZGdlcyBiZWxvdyB0aGUgdGhyZXNob2xkIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgbnVtYmVycyB3b3JrcyB3ZWxsIGZvciBtb3N0IG1vZGVscy5cbiAgICAgICAgICAgIC8vIElmIGl0IGRvZXMgbm90LCB0cnkgdG8gYWRqdXN0IHRoZSAzIHBhcmFtZXRlcnNcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvL2xldCB0aHJlc2hvbGQgPSAwLjAwMDAwMDAwMSAqIE1hdGgucG93KGl0ZXJhdGlvbiArIDMsIGFncmVzc2l2ZW5lc3MpO1xuICAgICAgICAgICAgY29uc3QgdGhyZXNob2xkID0gMWUtMTMgKiBNYXRoLnBvdyhpdGVyYXRpb24gKyAzLCBhZ3Jlc3NpdmVuZXNzKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB2ZXJ0aWNlcyAmIG1hcmsgZGVsZXRlZCB0cmlhbmdsZXNcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlsID0gdGhpcy5fdHJpYW5nbGVzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0LmVyclszXSA+IHRocmVzaG9sZCB8fCB0LmRlbGV0ZWQgfHwgdC5kaXJ0eSkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodC5lcnJbal0gPCB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGkwID0gdC52W2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdjAgPSB0aGlzLl92ZXJ0aWNlc1tpMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGkxID0gdC52WyhqICsgMSkgJSAzXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHYxID0gdGhpcy5fdmVydGljZXNbaTFdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCb3JkZXIgY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2MC5ib3JkZXIgIT0gdjEuYm9yZGVyKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHYwLnV2U3RlYW0gIT0gdjEudXZTdGVhbSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2MC51dkZvbGRvdmVyICE9IHYxLnV2Rm9sZG92ZXIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zaW1wbGlmaWNhdGlvbk9wdGlvbnMucHJlc2VydmVCb3JkZXJFZGdlcyAmJiB2MC5ib3JkZXIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgc2VhbXMgc2hvdWxkIGJlIHByZXNlcnZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zaW1wbGlmaWNhdGlvbk9wdGlvbnMucHJlc2VydmVVVlNlYW1FZGdlcyAmJiB2MC51dlN0ZWFtKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGZvbGRvdmVycyBzaG91bGQgYmUgcHJlc2VydmVkXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLnNpbXBsaWZpY2F0aW9uT3B0aW9ucy5wcmVzZXJ2ZVVWRm9sZG92ZXJFZGdlcyAmJiB2MC51dkZvbGRvdmVyKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB2ZXJ0ZXggdG8gY29sbGFwc2UgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlRXJyb3IoaTAsIGkxLCBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdDb21wdXRlIHZlcnRleCB0byBjb2xsYXBzZSB0bycsIHApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemUoZGVsZXRlZDAsIHYwLnRjb3VudCk7IC8vIG5vcm1hbHMgdGVtcG9yYXJpbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6ZShkZWxldGVkMSwgdjEudGNvdW50KTsgLy8gbm9ybWFscyB0ZW1wb3JhcmlseVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb250IHJlbW92ZSBpZiBfZmxpcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZsaXBwZWQocCwgaTAsIGkxLCB2MCwgdjEsIGRlbGV0ZWQwKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZmxpcHBlZChwLCBpMSwgaTAsIHYxLCB2MCwgZGVsZXRlZDEpKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBiYXJ5Y2VudHJpYyBjb29yZGluYXRlcyB3aXRoaW4gdGhlIHRyaWFuZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpMiA9IHQudlsoaiArIDIpICUgM107XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXJ5Y2VudHJpY0Nvb3JkID0gbmV3IFZlYzMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlQmFyeWNlbnRyaWNDb29yZHMocCwgdjAucCwgdjEucCwgdGhpcy5fdmVydGljZXNbaTJdLnAsIGJhcnljZW50cmljQ29vcmQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgX2ZsaXBwZWQsIHNvIHJlbW92ZSBlZGdlXG4gICAgICAgICAgICAgICAgICAgICAgICB2MC5wID0gcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHYwLnEgPSB2MS5xICsgdjAucTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYwLnEuYWRkU2VsZih2MS5xKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJwb2xhdGUgdGhlIHZlcnRleCBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaWEwID0gdC52YVtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlhMSA9IHQudmFbKGogKyAxKSAlIDNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWEyID0gdC52YVsoaiArIDIpICUgM107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnBvbGF0ZVZlcnRleEF0dHJpYnV0ZXMoaWEwLCBpYTAsIGlhMSwgaWEyLCBiYXJ5Y2VudHJpY0Nvb3JkKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2VzW2kwXS51dlN0ZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWEwID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRzdGFydCA9IHRoaXMuX3JlZnMubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDT05USU5VRVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlZF90cmlhbmdsZXMgPSB0aGlzLl91cGRhdGVUcmlhbmdsZXMoaTAsIGlhMCwgdjAsIGRlbGV0ZWQwLCBkZWxldGVkX3RyaWFuZ2xlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZGVsZXRlZCB0cmlhbmdsZSB2MCcsIGRlbGV0ZWRfdHJpYW5nbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZWRfdHJpYW5nbGVzID0gdGhpcy5fdXBkYXRlVHJpYW5nbGVzKGkwLCBpYTAsIHYxLCBkZWxldGVkMSwgZGVsZXRlZF90cmlhbmdsZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RlbGV0ZWQgdHJpYW5nbGUgdjEnLCBkZWxldGVkX3RyaWFuZ2xlcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRjb3VudCA9IHRoaXMuX3JlZnMubGVuZ3RoIC0gdHN0YXJ0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGNvdW50IDw9IHYwLnRjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdzYXZlIHJhbT8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGNvdW50KSB0aGlzLl9tb3ZlKHRoaXMuX3JlZnMsIHYwLnRzdGFydCwgdHN0YXJ0LCB0Y291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXBwZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHYwLnRzdGFydCA9IHRzdGFydDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdjAudGNvdW50ID0gdGNvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IC8vIGVuZCBmb3IgalxuXG4gICAgICAgICAgICAgICAgLy8gZG9uZT9cbiAgICAgICAgICAgICAgICBpZiAodHJpYW5nbGVfY291bnQgLSBkZWxldGVkX3RyaWFuZ2xlcyA8PSB0YXJnZXRfY291bnQpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IC8vIGVuZCBpdGVyYXRpb25cblxuICAgICAgICAvLyBjbGVhbiB1cCBtZXNoXG4gICAgICAgIHRoaXMuY29tcGFjdE1lc2goKTtcblxuICAgICAgICAvLyByZWFkeVxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ3NpbXBsaWZ5X21lc2gnKTtcblxuICAgICAgICAvLyBpbnQgdGltZUVuZD10aW1lR2V0VGltZSgpO1xuICAgICAgICAvLyBwcmludGYoXCIlcyAtICVkLyVkICVkJSUgcmVtb3ZlZCBpbiAlZCBtc1xcblwiLF9fRlVOQ1RJT05fXyxcbiAgICAgICAgLy8gXHR0cmlhbmdsZV9jb3VudC1kZWxldGVkX3RyaWFuZ2xlcyxcbiAgICAgICAgLy8gXHR0cmlhbmdsZV9jb3VudCxkZWxldGVkX3RyaWFuZ2xlcyoxMDAvdHJpYW5nbGVfY291bnQsXG4gICAgICAgIC8vIFx0dGltZUVuZC10aW1lU3RhcnQpO1xuICAgIH1cbiAgICBwcml2YXRlIC8qYm9vbCovIF9mbGlwcGVkKFxuICAgICAgICAvKiB2ZWMzZiAqLyBwOiBtYXRoLklWZWMzTGlrZSxcbiAgICAgICAgLyppbnQqLyBpMDogbnVtYmVyLFxuICAgICAgICAvKmludCovIGkxOiBudW1iZXIsXG4gICAgICAgIC8qVmVydGV4Ki8gdjA6IFZlcnRleCxcbiAgICAgICAgLypWZXJ0ZXgqLyB2MTogVmVydGV4LCAvLyBub3QgbmVlZGVkXG4gICAgICAgIC8qc3RkOjp2ZWN0b3I8aW50PiovIGRlbGV0ZWQ6IGFueVtdLFxuICAgICkge1xuICAgICAgICAvLyBsZXQgYm9yZGVyY291bnQgPSAwO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHYwLnRjb3VudDsgaysrKSB7XG4gICAgICAgICAgICAvLyBUcmlhbmdsZSAmXG4gICAgICAgICAgICBjb25zdCB0ID0gdGhpcy5fdHJpYW5nbGVzW3RoaXMuX3JlZnNbdjAudHN0YXJ0ICsga10udGlkXTtcbiAgICAgICAgICAgIGlmICh0LmRlbGV0ZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBjb25zdCBzID0gdGhpcy5fcmVmc1t2MC50c3RhcnQgKyBrXS50dmVydGV4O1xuICAgICAgICAgICAgY29uc3QgaWQxID0gdC52WyhzICsgMSkgJSAzXTtcbiAgICAgICAgICAgIGNvbnN0IGlkMiA9IHQudlsocyArIDIpICUgM107XG5cbiAgICAgICAgICAgIGlmIChpZDEgPT0gaTEgfHwgaWQyID09IGkxKSB7XG4gICAgICAgICAgICAgICAgLy8gZGVsZXRlID9cbiAgICAgICAgICAgICAgICAvLyBib3JkZXJjb3VudCsrO1xuICAgICAgICAgICAgICAgIGRlbGV0ZWRba10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiB2ZWMzZiAqL1xuICAgICAgICAgICAgVmVjMy5zdWJ0cmFjdChfdGVtcFZlYzMsIHRoaXMuX3ZlcnRpY2VzW2lkMV0ucCwgcCk7XG4gICAgICAgICAgICBfdGVtcFZlYzMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBWZWMzLnN1YnRyYWN0KF90ZW1wVmVjM18yLCB0aGlzLl92ZXJ0aWNlc1tpZDJdLnAsIHApO1xuICAgICAgICAgICAgX3RlbXBWZWMzXzIubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoVmVjMy5kb3QoX3RlbXBWZWMzLCBfdGVtcFZlYzNfMikpID4gMC45OTkpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgLyp2ZWMzZiAgbjsqL1xuICAgICAgICAgICAgVmVjMy5jcm9zcyhfdGVtcFZlYzNfMywgX3RlbXBWZWMzLCBfdGVtcFZlYzNfMik7XG4gICAgICAgICAgICBfdGVtcFZlYzNfMy5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGRlbGV0ZWRba10gPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChWZWMzLmRvdChfdGVtcFZlYzNfMywgdC5uKSA8IDAuMikgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0cmlhbmdsZSBjb25uZWN0aW9ucyBhbmQgZWRnZSBlcnJvciBhZnRlciBhIGVkZ2UgaXMgY29sbGFwc2VkXG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDkuInop5LlvaLkv6Hmga9cbiAgICAgKiBAcGFyYW0gaTBcbiAgICAgKiBAcGFyYW0gaWEwXG4gICAgICogQHBhcmFtIHZcbiAgICAgKiBAcGFyYW0gZGVsZXRlZFxuICAgICAqIEBwYXJhbSBkZWxldGVkX3RyaWFuZ2xlc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHJpdmF0ZSBfdXBkYXRlVHJpYW5nbGVzKFxuICAgICAgICAvKmludCovIGkwOiBudW1iZXIsXG4gICAgICAgIGlhMDogbnVtYmVyLFxuICAgICAgICAvKlZlcnRleCAmKi8gdjogVmVydGV4LFxuICAgICAgICAvKnN0ZDo6dmVjdG9yPGludD4gJiAqLyBkZWxldGVkOiBhbnlbXSxcbiAgICAgICAgLyppbnQgJiovIGRlbGV0ZWRfdHJpYW5nbGVzOiBudW1iZXIsXG4gICAgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdfdXBkYXRlVHJpYW5nbGVzJyk7XG4gICAgICAgIC8vIHZlYzNmIHA7XG4gICAgICAgIGNvbnN0IHAgPSBuZXcgVmVjMygpO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHYudGNvdW50OyBrKyspIHtcbiAgICAgICAgICAgIGNvbnN0IC8qUmVmICYqLyByID0gdGhpcy5fcmVmc1t2LnRzdGFydCArIGtdO1xuICAgICAgICAgICAgY29uc3QgLypUcmlhbmdsZSAmKi8gdCA9IHRoaXMuX3RyaWFuZ2xlc1tyLnRpZF07XG5cbiAgICAgICAgICAgIGlmICh0LmRlbGV0ZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKGRlbGV0ZWRba10pIHtcbiAgICAgICAgICAgICAgICB0LmRlbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZWRfdHJpYW5nbGVzKys7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0LnZbci50dmVydGV4XSA9IGkwO1xuXG4gICAgICAgICAgICBpZiAoaWEwICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdC52YVtyLnR2ZXJ0ZXhdID0gaWEwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0LmRpcnR5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgdC5lcnJbMF0gPSB0aGlzLl9jYWxjdWxhdGVFcnJvcih0LnZbMF0sIHQudlsxXSwgcCk7XG4gICAgICAgICAgICB0LmVyclsxXSA9IHRoaXMuX2NhbGN1bGF0ZUVycm9yKHQudlsxXSwgdC52WzJdLCBwKTtcbiAgICAgICAgICAgIHQuZXJyWzJdID0gdGhpcy5fY2FsY3VsYXRlRXJyb3IodC52WzJdLCB0LnZbMF0sIHApO1xuICAgICAgICAgICAgdC5lcnJbM10gPSBNYXRoLm1pbih0LmVyclswXSwgdC5lcnJbMV0sIHQuZXJyWzJdKTtcbiAgICAgICAgICAgIHRoaXMuX3JlZnMucHVzaChyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVsZXRlZF90cmlhbmdsZXM7XG4gICAgfVxuXG4gICAgLy8gY29tcGFjdCB0cmlhbmdsZXMsIGNvbXB1dGUgZWRnZSBlcnJvciBhbmQgYnVpbGQgcmVmZXJlbmNlIGxpc3RcbiAgICBwcml2YXRlIF91cGRhdGVNZXNoKGl0ZXJhdGlvbjogbnVtYmVyKSAvKmludCovIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ191cGRhdGVNZXNoJywgaXRlcmF0aW9uLCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoKTtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbiA+IDApIHtcbiAgICAgICAgICAgIC8vIGNvbXBhY3QgdHJpYW5nbGVzXG4gICAgICAgICAgICBsZXQgZHN0ID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdHJpYW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0LmRlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdHJpYW5nbGVzW2RzdCsrXSA9IHRhcmdldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdub3QgZGVsZXRlZCBkc3QnLCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoLCBkc3QpO1xuICAgICAgICAgICAgdGhpcy5fdHJpYW5nbGVzLnNwbGljZShkc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlUmVmZXJlbmNlcygpO1xuXG4gICAgICAgIC8vIEluaXQgUXVhZHJpY3MgYnkgUGxhbmUgJiBFZGdlIEVycm9yc1xuICAgICAgICAvL1xuICAgICAgICAvLyByZXF1aXJlZCBhdCB0aGUgYmVnaW5uaW5nICggaXRlcmF0aW9uID09IDAgKVxuICAgICAgICAvLyByZWNvbXB1dGluZyBkdXJpbmcgdGhlIHNpbXBsaWZpY2F0aW9uIGlzIG5vdCByZXF1aXJlZCxcbiAgICAgICAgLy8gYnV0IG1vc3RseSBpbXByb3ZlcyB0aGUgcmVzdWx0IGZvciBjbG9zZWQgbWVzaGVzXG4gICAgICAgIC8vXG5cbiAgICAgICAgLy8gSWRlbnRpZnkgYm91bmRhcnkgOiB2ZXJ0aWNlc1tdLmJvcmRlcj0wLDFcbiAgICAgICAgaWYgKGl0ZXJhdGlvbiA9PSAwKSB7XG4gICAgICAgICAgICAvLyBzdGQ6OnZlY3RvcjxpbnQ+IHZjb3VudCx2aWRzO1xuICAgICAgICAgICAgbGV0IHZjb3VudCwgdmlkcztcbiAgICAgICAgICAgIGxldCBib3JkZXJWZXJ0ZXhDb3VudCA9IDA7XG4gICAgICAgICAgICBsZXQgYm9yZGVyTWluWCA9IDEuNzk3NjkzMTM0ODYyMzE1N2UzMDg7XG4gICAgICAgICAgICBsZXQgYm9yZGVyTWF4WCA9IC0xLjc5NzY5MzEzNDg2MjMxNTdlMzA4O1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLmJvcmRlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLnV2U3RlYW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0aWNlc1tpXS51dkZvbGRvdmVyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCAvKlZlcnRleCAmKi8gdiA9IHRoaXMuX3ZlcnRpY2VzW2ldO1xuICAgICAgICAgICAgICAgIC8vIHZjb3VudC5jbGVhcigpO1xuICAgICAgICAgICAgICAgIC8vIHZpZHMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB2Y291bnQgPSBbXTtcbiAgICAgICAgICAgICAgICB2aWRzID0gW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHYudGNvdW50OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgayA9IHRoaXMuX3JlZnNbdi50c3RhcnQgKyBqXS50aWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IC8qVHJpYW5nbGUgJiovIHQgPSB0aGlzLl90cmlhbmdsZXNba107XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCAzOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvZnMgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gdC52W2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9mcyA8IHZjb3VudC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmlkc1tvZnNdID09IGlkKSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZnMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9mcyA9PSB2Y291bnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmNvdW50LnB1c2goMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkcy5wdXNoKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmNvdW50W29mc10rKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZjb3VudC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmNvdW50W2pdID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW3ZpZHNbal1dLmJvcmRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJWZXJ0ZXhDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2ltcGxpZmljYXRpb25PcHRpb25zLmVuYWJsZVNtYXJ0TGluaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gdmlkc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdmVydGljZXNbaWRdLnAueCA8IGJvcmRlck1pblgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyTWluWCA9IHRoaXMuX3ZlcnRpY2VzW2lkXS5wLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0aWNlc1tpZF0ucC54ID4gYm9yZGVyTWF4WCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJNYXhYID0gdGhpcy5fdmVydGljZXNbaWRdLnAueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNpbXBsaWZpY2F0aW9uT3B0aW9ucy5lbmFibGVTbWFydExpbmspIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBmaW5kIGFsbCBib3JkZXIgdmVydGljZXNcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJWZXJ0aWNlczogQm9yZGVyVmVydGV4W10gPSBuZXcgQXJyYXkoYm9yZGVyVmVydGV4Q291bnQpO1xuICAgICAgICAgICAgICAgIGxldCBib3JkZXJJbmRleENvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBib3JkZXJBcmVhV2lkdGggPSBib3JkZXJNYXhYIC0gYm9yZGVyTWluWDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0aWNlc1tpXS5ib3JkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEhhc2ggPSAoKCh0aGlzLl92ZXJ0aWNlc1tpXS5wLnggLSBib3JkZXJNaW5YKSAvIGJvcmRlckFyZWFXaWR0aCkgKiAyLjAgLSAxLjApICogMjE0NzQ4MzY0NztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclZlcnRpY2VzW2JvcmRlckluZGV4Q291bnRdID0gbmV3IEJvcmRlclZlcnRleChpLCB2ZXJ0ZXhIYXNoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICsrYm9yZGVySW5kZXhDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFNvcnQgdGhlIGJvcmRlciB2ZXJ0aWNlcyBieSBoYXNoXG4gICAgICAgICAgICAgICAgYm9yZGVyVmVydGljZXMuc29ydCgoeDogQm9yZGVyVmVydGV4LCB5OiBCb3JkZXJWZXJ0ZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHguaGFzaCA+IHkuaGFzaCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBcdHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgIC8vIH0gZWxzZSBpZiAoeC5oYXNoIDwgeS5oYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFx0cmV0dXJuIC0xXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHguaGFzaCAtIHkuaGFzaDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbWF4aW11bSBoYXNoIGRpc3RhbmNlIGJhc2VkIG9uIHRoZSBtYXhpbXVtIHZlcnRleCBsaW5rIGRpc3RhbmNlXG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4TGlua0Rpc3RhbmNlU3FyID0gdGhpcy5zaW1wbGlmaWNhdGlvbk9wdGlvbnMudmVydGV4TGlua0Rpc3RhbmNlICogdGhpcy5zaW1wbGlmaWNhdGlvbk9wdGlvbnMudmVydGV4TGlua0Rpc3RhbmNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleExpbmtEaXN0YW5jZSA9IE1hdGguc3FydCh2ZXJ0ZXhMaW5rRGlzdGFuY2VTcXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc2hNYXhEaXN0YW5jZSA9IE1hdGgubWF4KCh2ZXJ0ZXhMaW5rRGlzdGFuY2UgLyBib3JkZXJBcmVhV2lkdGgpICogMjE0NzQ4MzY0NywgMSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGVuIGZpbmQgaWRlbnRpY2FsIGJvcmRlciB2ZXJ0aWNlcyBhbmQgYmluZCB0aGVtIHRvZ2V0aGVyIGFzIG9uZVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYm9yZGVySW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG15SW5kZXggPSBib3JkZXJWZXJ0aWNlc1tpXS5pbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG15SW5kZXggPT0gLTEpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG15UG9pbnQgPSB0aGlzLl92ZXJ0aWNlc1tteUluZGV4XS5wO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBib3JkZXJJbmRleENvdW50OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG90aGVySW5kZXggPSBib3JkZXJWZXJ0aWNlc1tqXS5pbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdGhlckluZGV4ID09IC0xKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGJvcmRlclZlcnRpY2VzW2pdLmhhc2ggLSBib3JkZXJWZXJ0aWNlc1tpXS5oYXNoID4gaGFzaE1heERpc3RhbmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIHBvaW50IHRvIGNvbnRpbnVlIGJleW9uZCB0aGlzIHBvaW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG90aGVyUG9pbnQgPSB0aGlzLl92ZXJ0aWNlc1tvdGhlckluZGV4XS5wO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3FyWCA9IChteVBvaW50LnggLSBvdGhlclBvaW50LngpICogKG15UG9pbnQueCAtIG90aGVyUG9pbnQueCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzcXJZID0gKG15UG9pbnQueSAtIG90aGVyUG9pbnQueSkgKiAobXlQb2ludC55IC0gb3RoZXJQb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNxclogPSAobXlQb2ludC56IC0gb3RoZXJQb2ludC56KSAqIChteVBvaW50LnogLSBvdGhlclBvaW50LnopO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3FyTWFnbml0dWRlID0gc3FyWCArIHNxclkgKyBzcXJaO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3FyTWFnbml0dWRlIDw9IHZlcnRleExpbmtEaXN0YW5jZVNxcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclZlcnRpY2VzW2pdLmluZGV4ID0gLTE7IC8vIE5PVEU6IFRoaXMgbWFrZXMgc3VyZSB0aGF0IHRoZSBcIm90aGVyXCIgdmVydGV4IGlzIG5vdCBwcm9jZXNzZWQgYWdhaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0aWNlc1tteUluZGV4XS5ib3JkZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0aWNlc1tvdGhlckluZGV4XS5ib3JkZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcmVVVnNUaGVTYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRVVjJEIVtteUluZGV4XS5lcXVhbHModGhpcy5fdmVydFVWMkQhW290aGVySW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92ZXJ0aWNlc1tteUluZGV4XS51dkZvbGRvdmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmVydGljZXNbb3RoZXJJbmRleF0udXZGb2xkb3ZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmVydGljZXNbbXlJbmRleF0udXZTdGVhbSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW290aGVySW5kZXhdLnV2U3RlYW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG90aGVyVHJpYW5nbGVDb3VudCA9IHRoaXMuX3ZlcnRpY2VzW290aGVySW5kZXhdLnRjb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvdGhlclRyaWFuZ2xlU3RhcnQgPSB0aGlzLl92ZXJ0aWNlc1tvdGhlckluZGV4XS50c3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBvdGhlclRyaWFuZ2xlQ291bnQ7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5fcmVmc1tvdGhlclRyaWFuZ2xlU3RhcnQgKyBrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdHJpYW5nbGVzW3IudGlkXS52W3IudHZlcnRleF0gPSBteUluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcmVmZXJlbmNlcyBhZ2FpblxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVJlZmVyZW5jZXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIG1heSBub3QgbmVlZCB0byBkbyB0aGlzLlxuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLnEgPSBuZXcgU3ltZXRyaWNNYXRyaXgoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcDFwMCA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBjb25zdCBwMnAwID0gbmV3IFZlYzMoKTtcblxuICAgICAgICAgICAgY29uc3QgcDogVmVjM1tdID0gbmV3IEFycmF5KDMpO1xuICAgICAgICAgICAgY29uc3QgdG1wID0gbmV3IFN5bWV0cmljTWF0cml4KCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3RyaWFuZ2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IC8qVHJpYW5nbGUgJiovIHQgPSB0aGlzLl90cmlhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcFtqXSA9IHRoaXMuX3ZlcnRpY2VzW3QudltqXV0ucDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBWZWMzLnN1YnRyYWN0KHAxcDAsIHBbMV0sIHBbMF0pO1xuICAgICAgICAgICAgICAgIFZlYzMuc3VidHJhY3QocDJwMCwgcFsyXSwgcFswXSk7XG4gICAgICAgICAgICAgICAgVmVjMy5jcm9zcyhuLCBwMXAwLCBwMnAwKTtcbiAgICAgICAgICAgICAgICBWZWMzLm5vcm1hbGl6ZShuLCBuKTtcbiAgICAgICAgICAgICAgICB0Lm4gPSBuO1xuICAgICAgICAgICAgICAgIHRtcC5tYWtlUGxhbmUobi54LCBuLnksIG4ueiwgLW4uZG90KHBbMF0pKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW3QudltqXV0ucS5hZGRTZWxmKHRtcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdmVydGljZXNbdC52W2pdXS5xID1cbiAgICAgICAgICAgICAgICAvLyB2ZXJ0aWNlc1t0LnZbal1dLnEuYWRkKFN5bWV0cmljTWF0cml4KG4ueCxuLnksbi56LC1uLmRvdChwWzBdKSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3RyaWFuZ2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIENhbGMgRWRnZSBFcnJvclxuICAgICAgICAgICAgICAgIGNvbnN0IC8qVHJpYW5nbGUgJiovIHQgPSB0aGlzLl90cmlhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgLy8gdmVjM2YgcDtcbiAgICAgICAgICAgICAgICBjb25zdCBwID0gbmV3IFZlYzMoKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHQuZXJyW2pdID0gdGhpcy5fY2FsY3VsYXRlRXJyb3IodC52W2pdLCB0LnZbKGogKyAxKSAlIDNdLCBwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0LmVyclszXSA9IE1hdGgubWluKHQuZXJyWzBdLCB0LmVyclsxXSwgdC5lcnJbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluYWxseSBjb21wYWN0IG1lc2ggYmVmb3JlIGV4aXRpbmdcblxuICAgIC8vIEVycm9yIGJldHdlZW4gdmVydGV4IGFuZCBRdWFkcmljXG5cbiAgICBwcml2YXRlIF92ZXJ0ZXhFcnJvcigvKlN5bWV0cmljTWF0cml4Ki8gcTogU3ltZXRyaWNNYXRyaXgsIC8qZG91YmxlKi8geDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgcS5tWzBdICogeCAqIHggK1xuICAgICAgICAgICAgMiAqIHEubVsxXSAqIHggKiB5ICtcbiAgICAgICAgICAgIDIgKiBxLm1bMl0gKiB4ICogeiArXG4gICAgICAgICAgICAyICogcS5tWzNdICogeCArXG4gICAgICAgICAgICBxLm1bNF0gKiB5ICogeSArXG4gICAgICAgICAgICAyICogcS5tWzVdICogeSAqIHogK1xuICAgICAgICAgICAgMiAqIHEubVs2XSAqIHkgK1xuICAgICAgICAgICAgcS5tWzddICogeiAqIHogK1xuICAgICAgICAgICAgMiAqIHEubVs4XSAqIHogK1xuICAgICAgICAgICAgcS5tWzldXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRXJyb3IgZm9yIG9uZSBlZGdlXG4gICAgLy8gaWYgREVDSU1BVEUgaXMgZGVmaW5lZCB2ZXJ0ZXggcG9zaXRpb25zIGFyZSBOT1QgaW50ZXJwb2xhdGVkXG4gICAgLy8gTHVlYmtlIFN1cnZleSBvZiBQb2x5Z29uYWwgU2ltcGxpZmljYXRpb24gQWxnb3JpdGhtczogIFwidmVydGljZXMgb2YgYSBtb2RlbCBzaW1wbGlmaWVkIGJ5IHRoZSBkZWNpbWF0aW9uIGFsZ29yaXRobSBhcmUgYSBzdWJzZXQgb2YgdGhlIG9yaWdpbmFsIG1vZGVs4oCZcyB2ZXJ0aWNlcy5cIlxuICAgIC8vIGh0dHA6Ly93d3cuY3MudmlyZ2luaWEuZWR1L35sdWVia2UvcHVibGljYXRpb25zL3BkZi9jZythLjIwMDEucGRmXG5cbiAgICBwcml2YXRlIF9jYWxjdWxhdGVFcnJvcihpZF92MTogbnVtYmVyLCBpZF92MjogbnVtYmVyLCBwX3Jlc3VsdDogVmVjMykge1xuICAgICAgICAvLyBjb21wdXRlIGludGVycG9sYXRlZCB2ZXJ0ZXhcbiAgICAgICAgY29uc3QgdmVydGV4MSA9IHRoaXMuX3ZlcnRpY2VzW2lkX3YxXTtcbiAgICAgICAgY29uc3QgdmVydGV4MiA9IHRoaXMuX3ZlcnRpY2VzW2lkX3YyXTtcblxuICAgICAgICBjb25zdCBxID0gdmVydGV4MS5xLmFkZCh2ZXJ0ZXgyLnEpO1xuICAgICAgICBjb25zdCBib3JkZXIgPSB2ZXJ0ZXgxLmJvcmRlciAmJiB2ZXJ0ZXgyLmJvcmRlcjtcbiAgICAgICAgbGV0IGVycm9yID0gMDtcbiAgICAgICAgY29uc3QgZGV0ID0gcS5kZXQoMCwgMSwgMiwgMSwgNCwgNSwgMiwgNSwgNyk7XG5cbiAgICAgICAgaWYgKGRldCAhPT0gMCAmJiAhYm9yZGVyKSB7XG4gICAgICAgICAgICAvLyBxX2RlbHRhIGlzIGludmVydGlibGVcbiAgICAgICAgICAgIHBfcmVzdWx0LnggPSAoLTEgLyBkZXQpICogcS5kZXQoMSwgMiwgMywgNCwgNSwgNiwgNSwgNywgOCk7IC8vIHZ4ID0gQTQxL2RldChxX2RlbHRhKVxuICAgICAgICAgICAgcF9yZXN1bHQueSA9ICgxIC8gZGV0KSAqIHEuZGV0KDAsIDIsIDMsIDEsIDUsIDYsIDIsIDcsIDgpOyAvLyB2eSA9IEE0Mi9kZXQocV9kZWx0YSlcbiAgICAgICAgICAgIHBfcmVzdWx0LnogPSAoLTEgLyBkZXQpICogcS5kZXQoMCwgMSwgMywgMSwgNCwgNiwgMiwgNSwgOCk7IC8vIHZ6ID0gQTQzL2RldChxX2RlbHRhKVxuXG4gICAgICAgICAgICBsZXQgY3VydmF0dXJlRXJyb3IgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2ltcGxpZmljYXRpb25PcHRpb25zLnByZXNlcnZlU3VyZmFjZUN1cnZhdHVyZSkge1xuICAgICAgICAgICAgICAgIGN1cnZhdHVyZUVycm9yID0gdGhpcy5fY3VydmF0dXJlRXJyb3IodmVydGV4MSwgdmVydGV4Mik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVycm9yID0gdGhpcy5fdmVydGV4RXJyb3IocSwgcF9yZXN1bHQueCwgcF9yZXN1bHQueSwgcF9yZXN1bHQueikgKyBjdXJ2YXR1cmVFcnJvcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRldCA9IDAgLT4gdHJ5IHRvIGZpbmQgYmVzdCByZXN1bHRcbiAgICAgICAgICAgIGNvbnN0IC8qdmVjM2YqLyBwMSA9IHZlcnRleDEucDtcbiAgICAgICAgICAgIGNvbnN0IC8qdmVjM2YqLyBwMiA9IHZlcnRleDIucDtcbiAgICAgICAgICAgIGNvbnN0IC8qdmVjM2YqLyBwMyA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBWZWMzLmFkZChwMywgcDEsIHAyKTtcbiAgICAgICAgICAgIHAzLm11bHRpcGx5U2NhbGFyKDAuNSk7XG4gICAgICAgICAgICBjb25zdCBlcnJvcjEgPSB0aGlzLl92ZXJ0ZXhFcnJvcihxLCBwMS54LCBwMS55LCBwMS56KTtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yMiA9IHRoaXMuX3ZlcnRleEVycm9yKHEsIHAyLngsIHAyLnksIHAyLnopO1xuICAgICAgICAgICAgY29uc3QgZXJyb3IzID0gdGhpcy5fdmVydGV4RXJyb3IocSwgcDMueCwgcDMueSwgcDMueik7XG4gICAgICAgICAgICBlcnJvciA9IE1hdGgubWluKGVycm9yMSwgZXJyb3IyLCBlcnJvcjMpO1xuICAgICAgICAgICAgaWYgKGVycm9yMSA9PT0gZXJyb3IpIFZlYzMuY29weShwX3Jlc3VsdCwgcDEpO1xuICAgICAgICAgICAgaWYgKGVycm9yMiA9PT0gZXJyb3IpIFZlYzMuY29weShwX3Jlc3VsdCwgcDIpO1xuICAgICAgICAgICAgaWYgKGVycm9yMyA9PT0gZXJyb3IpIFZlYzMuY29weShwX3Jlc3VsdCwgcDMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3VwZGF0ZVJlZmVyZW5jZXMoKSB7XG4gICAgICAgIC8vIEluaXQgUmVmZXJlbmNlIElEIGxpc3RcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fdmVydGljZXNbaV0udHN0YXJ0ID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLnRjb3VudCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8qVHJpYW5nbGUgJiovXG4gICAgICAgICAgICBjb25zdCB0ID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHRoaXMuX3ZlcnRpY2VzW3QudltqXV0udGNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRzdGFydCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IC8qVmVydGV4ICYqLyB2ID0gdGhpcy5fdmVydGljZXNbaV07XG4gICAgICAgICAgICB2LnRzdGFydCA9IHRzdGFydDtcbiAgICAgICAgICAgIHRzdGFydCArPSB2LnRjb3VudDtcbiAgICAgICAgICAgIHYudGNvdW50ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdyaXRlIFJlZmVyZW5jZXNcbiAgICAgICAgLy8gX3Jlc2l6ZShyZWZzLCB0cmlhbmdsZXMubGVuZ3RoICogMylcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3ByZSByZWYnLCB0aGlzLl9yZWZzLmxlbmd0aCwgdGhpcy5fdHJpYW5nbGVzLmxlbmd0aCAqIDMpO1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5fcmVmcy5sZW5ndGg7IGkgPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoICogMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWZzW2ldID0gbmV3IFJlZigpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl90cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8qVHJpYW5nbGUgJiovXG4gICAgICAgICAgICBjb25zdCB0ID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAvKlZlcnRleCAmKi9cbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5fdmVydGljZXNbdC52W2pdXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZzW3YudHN0YXJ0ICsgdi50Y291bnRdLnRpZCA9IGk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmc1t2LnRzdGFydCArIHYudGNvdW50XS50dmVydGV4ID0gajtcbiAgICAgICAgICAgICAgICB2LnRjb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3VydmF0dXJlRXJyb3IodmVydDA6IFZlcnRleCwgdmVydDE6IFZlcnRleCkge1xuICAgICAgICBWZWMzLnN1YnRyYWN0KF90ZW1wVmVjMywgdmVydDAucCwgdmVydDEucCk7XG4gICAgICAgIGNvbnN0IGRpZmZWZWN0b3IgPSBfdGVtcFZlYzMubGVuZ3RoKCk7XG5cbiAgICAgICAgY29uc3QgdHJpYW5nbGVzV2l0aFZpT3JWak9yQm90aCA9IHRoaXMuX3RyaWFuZ2xlSGFzaFNldDE7XG4gICAgICAgIHRyaWFuZ2xlc1dpdGhWaU9yVmpPckJvdGguY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fZ2V0VHJpYW5nbGVzQ29udGFpbmluZ1ZlcnRleCh2ZXJ0MCwgdHJpYW5nbGVzV2l0aFZpT3JWak9yQm90aCk7XG4gICAgICAgIHRoaXMuX2dldFRyaWFuZ2xlc0NvbnRhaW5pbmdWZXJ0ZXgodmVydDEsIHRyaWFuZ2xlc1dpdGhWaU9yVmpPckJvdGgpO1xuXG4gICAgICAgIGNvbnN0IHRyaWFuZ2xlc1dpdGhWaUFuZFZqQm90aCA9IHRoaXMuX3RyaWFuZ2xlSGFzaFNldDI7XG4gICAgICAgIHRyaWFuZ2xlc1dpdGhWaUFuZFZqQm90aC5jbGVhcigpO1xuICAgICAgICB0aGlzLl9nZXRUcmlhbmdsZXNDb250YWluaW5nQm90aFZlcnRpY2VzKHZlcnQwLCB2ZXJ0MSwgdHJpYW5nbGVzV2l0aFZpQW5kVmpCb3RoKTtcblxuICAgICAgICBsZXQgbWF4RG90T3V0ZXIgPSAwO1xuICAgICAgICB0cmlhbmdsZXNXaXRoVmlPclZqT3JCb3RoLmZvckVhY2goKGluZGV4LCB0cmlhbmdsZVdpdGhWaU9yVmpPckJvdGgpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXhEb3RJbm5lciA9IDA7XG4gICAgICAgICAgICBjb25zdCBub3JtVmVjVHJpYW5nbGVXaXRoVmlPclZqT3JCb3RoOiBWZWMzID0gdHJpYW5nbGVXaXRoVmlPclZqT3JCb3RoLm4uY2xvbmUoKTtcbiAgICAgICAgICAgIHRyaWFuZ2xlc1dpdGhWaUFuZFZqQm90aC5mb3JFYWNoKChpbmRleCwgdHJpYW5nbGVXaXRoVmlBbmRWakJvdGgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub3JtVmVjVHJpYW5nbGVXaXRoVmlBbmRWakJvdGg6IFZlYzMgPSB0cmlhbmdsZVdpdGhWaUFuZFZqQm90aC5uLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZG90ID0gVmVjMy5kb3Qobm9ybVZlY1RyaWFuZ2xlV2l0aFZpT3JWak9yQm90aCwgbm9ybVZlY1RyaWFuZ2xlV2l0aFZpQW5kVmpCb3RoKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb3QgPiBtYXhEb3RJbm5lcikgbWF4RG90SW5uZXIgPSBkb3Q7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChtYXhEb3RJbm5lciA+IG1heERvdE91dGVyKSBtYXhEb3RPdXRlciA9IG1heERvdElubmVyO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGlmZlZlY3RvciAqIG1heERvdE91dGVyO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFRyaWFuZ2xlc0NvbnRhaW5pbmdWZXJ0ZXgodmVydDogVmVydGV4LCB0cmlzOiBNYXA8VHJpYW5nbGUsIGJvb2xlYW4+KSB7XG4gICAgICAgIGNvbnN0IHRyaWFuZ2xlc0NvdW50ID0gdmVydC50Y291bnQ7XG4gICAgICAgIGNvbnN0IHN0YXJ0SW5kZXggPSB2ZXJ0LnRzdGFydDtcblxuICAgICAgICBmb3IgKGxldCBhID0gc3RhcnRJbmRleDsgYSA8IHN0YXJ0SW5kZXggKyB0cmlhbmdsZXNDb3VudDsgYSsrKSB7XG4gICAgICAgICAgICB0cmlzLnNldCh0aGlzLl90cmlhbmdsZXNbdGhpcy5fcmVmc1thXS50aWRdLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwcml2YXRlIF9nZXRUcmlhbmdsZXNDb250YWluaW5nQm90aFZlcnRpY2VzKHZlcnQwOiBWZXJ0ZXgsIHZlcnQxOiBWZXJ0ZXgsIHRyaXM6IE1hcDxUcmlhbmdsZSwgYm9vbGVhbj4pIHtcbiAgICAgICAgY29uc3QgdHJpYW5nbGVDb3VudCA9IHZlcnQwLnRjb3VudDtcbiAgICAgICAgY29uc3Qgc3RhcnRJbmRleCA9IHZlcnQwLnRzdGFydDtcblxuICAgICAgICBmb3IgKGxldCByZWZJbmRleCA9IHN0YXJ0SW5kZXg7IHJlZkluZGV4IDwgc3RhcnRJbmRleCArIHRyaWFuZ2xlQ291bnQ7IHJlZkluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRpZCA9IHRoaXMuX3JlZnNbcmVmSW5kZXhdLnRpZDtcbiAgICAgICAgICAgIGNvbnN0IHRyaTogVHJpYW5nbGUgPSB0aGlzLl90cmlhbmdsZXNbdGlkXTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW3RyaS52WzBdXS5pbmRleCA9PSB2ZXJ0MS5pbmRleCB8fFxuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW3RyaS52WzFdXS5pbmRleCA9PSB2ZXJ0MS5pbmRleCB8fFxuICAgICAgICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzW3RyaS52WzJdXS5pbmRleCA9PSB2ZXJ0MS5pbmRleFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdHJpcy5zZXQodHJpLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzaW1wbGlmeU1lc2godGFyZ2V0X2NvdW50OiBudW1iZXIsIGFncmVzc2l2ZW5lc3MgPSA3KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXJnZXRfY291bnQgPSBNYXRoLnJvdW5kKHRhcmdldF9jb3VudCk7XG4gICAgICAgICAgICBjb25zdCBnZW9tZXRyeSA9IEpTT04ucGFyc2UodGhpcy5fZ2VvbWV0cmljSW5mbyk7XG4gICAgICAgICAgICB0aGlzLmluaXQoZ2VvbWV0cnkudmVydGljZXMsIGdlb21ldHJ5LmZhY2VzLCBnZW9tZXRyeSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUudGltZSgnc2ltcGxpZnknKTtcbiAgICAgICAgICAgIHRoaXMuX3NpbXBsaWZ5TWVzaCh0YXJnZXRfY291bnQsIGFncmVzc2l2ZW5lc3MpO1xuICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKCdzaW1wbGlmeScpO1xuXG4gICAgICAgICAgICAvL1x0Y29uc29sZS5sb2coJ29sZCB2ZXJ0aWNlcyAnICsgZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoLCAnb2xkIGZhY2VzICcgKyBnZW9tZXRyeS5mYWNlcy5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25ldyB2ZXJ0aWNlcyAnICsgdGhpcy5fdmVydGljZXMubGVuZ3RoLCAnb2xkIGZhY2VzICcgKyB0aGlzLl90cmlhbmdsZXMubGVuZ3RoKTtcblxuICAgICAgICAgICAgLy8gVE9ETyBjb252ZXJ0IHRvIGJ1ZmZlciBnZW9tZXRyeS5cbiAgICAgICAgICAgIGNvbnN0IG5ld0dlbzogeyBwb3NpdGlvbnM7IGluZGljZXM7IG5vcm1hbHM/OiBudW1iZXJbXTsgdXZzPzsgdGFuZ2VudHM/OyBjb2xvcnM/OyBhdHRycyB9ID0ge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uczogW10sXG4gICAgICAgICAgICAgICAgaW5kaWNlczogW10sXG4gICAgICAgICAgICAgICAgYXR0cnM6IHt9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgbmV3TGVuZ3RoID0gdGhpcy5fdmVydGljZXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLl92ZXJ0aWNlc1tpXTtcbiAgICAgICAgICAgICAgICBuZXdHZW8ucG9zaXRpb25zLnB1c2godi5wLngpO1xuICAgICAgICAgICAgICAgIG5ld0dlby5wb3NpdGlvbnMucHVzaCh2LnAueSk7XG4gICAgICAgICAgICAgICAgbmV3R2VvLnBvc2l0aW9ucy5wdXNoKHYucC56KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRVVjJEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKHRoaXMuX3ZlcnRVVjJELCBuZXdMZW5ndGgpO1xuICAgICAgICAgICAgICAgIG5ld0dlby51dnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZlcnRVVjJELmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLl92ZXJ0VVYyRFtpXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3R2VvLnV2cy5wdXNoKHYueCk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0dlby51dnMucHVzaCh2LnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnROb3JtYWxzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKHRoaXMuX3ZlcnROb3JtYWxzLCBuZXdMZW5ndGgpO1xuICAgICAgICAgICAgICAgIG5ld0dlby5ub3JtYWxzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0Tm9ybWFscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5fdmVydE5vcm1hbHNbaV07XG4gICAgICAgICAgICAgICAgICAgIG5ld0dlby5ub3JtYWxzLnB1c2godi54KTtcbiAgICAgICAgICAgICAgICAgICAgbmV3R2VvLm5vcm1hbHMucHVzaCh2LnkpO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8ubm9ybWFscy5wdXNoKHYueik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fdmVydFRhbmdlbnRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKHRoaXMuX3ZlcnRUYW5nZW50cywgbmV3TGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBuZXdHZW8udGFuZ2VudHMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZlcnRUYW5nZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5fdmVydFRhbmdlbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8udGFuZ2VudHMucHVzaCh2LngpO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8udGFuZ2VudHMucHVzaCh2LnkpO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8udGFuZ2VudHMucHVzaCh2LnopO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8udGFuZ2VudHMucHVzaCh2LncpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRDb2xvcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemUodGhpcy5fdmVydENvbG9ycywgbmV3TGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBuZXdHZW8uY29sb3JzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0Q29sb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLl92ZXJ0Q29sb3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8uY29sb3JzLnB1c2godi5yKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3R2VvLmNvbG9ycy5wdXNoKHYuZyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0dlby5jb2xvcnMucHVzaCh2LmIpO1xuICAgICAgICAgICAgICAgICAgICBuZXdHZW8uY29sb3JzLnB1c2godi5hKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0Sm9pbnRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKHRoaXMuX3ZlcnRKb2ludHMsIG5ld0xlbmd0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdDogbnVtYmVyW10gPSAobmV3R2VvLmF0dHJzWydqb2ludHMnXSA9IFtdKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZlcnRKb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuX3ZlcnRKb2ludHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGxpc3QucHVzaCh2LngpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2godi55KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKHYueik7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QucHVzaCh2LncpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRXZWlnaHRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKHRoaXMuX3ZlcnRXZWlnaHRzLCBuZXdMZW5ndGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3Q6IG51bWJlcltdID0gKG5ld0dlby5hdHRyc1snd2VpZ2h0cyddID0gW10pO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdmVydFdlaWdodHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuX3ZlcnRXZWlnaHRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2godi54KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKHYueSk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QucHVzaCh2LnopO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2godi53KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fdHJpYW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJpID0gdGhpcy5fdHJpYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIG5ld0dlby5pbmRpY2VzLnB1c2godHJpLnZbMF0pO1xuICAgICAgICAgICAgICAgIG5ld0dlby5pbmRpY2VzLnB1c2godHJpLnZbMV0pO1xuICAgICAgICAgICAgICAgIG5ld0dlby5pbmRpY2VzLnB1c2godHJpLnZbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld0dlbztcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaehOW7umdlb21ldHJ55L+h5oGvXG4gICAgICogQHBhcmFtIGdlb21ldHJ5XG4gICAgICovXG4gICAgcHVibGljIGJ1aWxkR2VvbWV0cmljKGdlb21ldHJ5OiB7XG4gICAgICAgIHZlcnRpY2VzPzogVmVjM1tdO1xuICAgICAgICBmYWNlcz86IGFueVtdO1xuICAgICAgICBwb3NpdGlvbnM6IHN0cmluZyB8IGFueVtdO1xuICAgICAgICBub3JtYWxzO1xuICAgICAgICB1dnM7XG4gICAgICAgIHRhbmdlbnRzO1xuICAgICAgICBpbmRpY2VzPzogQXJyYXlMaWtlPG51bWJlcj47XG4gICAgICAgIHdlaWdodHM/O1xuICAgICAgICBqb2ludHM/O1xuICAgICAgICBjb2xvcnM/O1xuICAgIH0pIHtcbiAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgIC8vXHRtZXJnZVZlcnRpY2VzKGdlb21ldHJ5KTtcblxuICAgICAgICBjb25zdCBmYWNlczogeyBhOiBudW1iZXI7IGI6IG51bWJlcjsgYzogbnVtYmVyIH1bXSA9IFtdO1xuICAgICAgICBpZiAoZ2VvbWV0cnkuaW5kaWNlcykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5pbmRpY2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICAgICAgZmFjZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGE6IGdlb21ldHJ5LmluZGljZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGI6IGdlb21ldHJ5LmluZGljZXNbaSArIDFdLFxuICAgICAgICAgICAgICAgICAgICBjOiBnZW9tZXRyeS5pbmRpY2VzW2kgKyAyXSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5WZXJ0aWNlcyA9IGdlb21ldHJ5LnBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuVmVydGljZXM7IGkgKz0gMykge1xuICAgICAgICAgICAgICAgIGZhY2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBhOiAzICogaSArIDAsXG4gICAgICAgICAgICAgICAgICAgIGI6IDMgKiBpICsgMSxcbiAgICAgICAgICAgICAgICAgICAgYzogMyAqIGkgKyAyLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGdlb21ldHJ5LmZhY2VzID0gZmFjZXM7XG5cbiAgICAgICAgY29uc3QgdmVydGljZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5wb3NpdGlvbnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIHZlcnRpY2VzLnB1c2gobmV3IFZlYzMoZ2VvbWV0cnkucG9zaXRpb25zW2ldLCBnZW9tZXRyeS5wb3NpdGlvbnNbaSArIDFdLCBnZW9tZXRyeS5wb3NpdGlvbnNbaSArIDJdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBnZW9tZXRyeSkge1xuICAgICAgICAgICAgaWYgKGdlb21ldHJ5W2tleV0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShnZW9tZXRyeVtrZXldIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGdlb21ldHJ5W2tleV0gPSBBcnJheS5mcm9tKGdlb21ldHJ5W2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGdlb21ldHJ5W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9nZW9tZXRyaWNJbmZvID0gSlNPTi5zdHJpbmdpZnkoZ2VvbWV0cnkpO1xuICAgICAgICAvLyB0aGlzLmluaXQoZ2VvbWV0cnkudmVydGljZXMsIGdlb21ldHJ5LmZhY2VzLCBnZW9tZXRyeSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdvbGQgdmVydGljZXMgJyArIGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCwgJ29sZCBmYWNlcyAnICsgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoKTtcblxuICAgICAgICAvLyBzaW1wbGlmeSFcbiAgICAgICAgLy8gc2ltcGxpZnlfbWVzaChnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAwLjUgfCAwLCA3KTtcbiAgICAgICAgLy8gc2ltcGxpZnlfbWVzaChnZW9tZXRyeS5mYWNlcy5sZW5ndGggLSAyLCA0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorqHnrpflkIjlubbnmoR1duS/oeaBr1xuICAgICAqIEBwYXJhbSBwb2ludFxuICAgICAqIEBwYXJhbSBhXG4gICAgICogQHBhcmFtIGJcbiAgICAgKiBAcGFyYW0gY1xuICAgICAqIEBwYXJhbSByZXN1bHRcbiAgICAgKi9cbiAgICBwdWJsaWMgY2FsY3VsYXRlQmFyeWNlbnRyaWNDb29yZHMocG9pbnQ6IFZlYzMsIGE6IFZlYzMsIGI6IFZlYzMsIGM6IFZlYzMsIHJlc3VsdDogVmVjMykge1xuICAgICAgICBjb25zdCB2MCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IHYxID0gbmV3IFZlYzMoKTtcbiAgICAgICAgY29uc3QgdjIgPSBuZXcgVmVjMygpO1xuICAgICAgICBWZWMzLnN1YnRyYWN0KHYwLCBiLCBhKTtcbiAgICAgICAgVmVjMy5zdWJ0cmFjdCh2MSwgYywgYSk7XG4gICAgICAgIFZlYzMuc3VidHJhY3QodjIsIHBvaW50LCBhKTtcbiAgICAgICAgY29uc3QgZDAwID0gVmVjMy5kb3QodjAsIHYwKTtcbiAgICAgICAgY29uc3QgZDAxID0gVmVjMy5kb3QodjAsIHYxKTtcbiAgICAgICAgY29uc3QgZDExID0gVmVjMy5kb3QodjEsIHYxKTtcbiAgICAgICAgY29uc3QgZDIwID0gVmVjMy5kb3QodjIsIHYwKTtcbiAgICAgICAgY29uc3QgZDIxID0gVmVjMy5kb3QodjIsIHYxKTtcbiAgICAgICAgbGV0IGRlbm9tID0gZDAwICogZDExIC0gZDAxICogZDAxO1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVub21pbmF0b3IgaXMgbm90IHRvbyBzbWFsbCB0byBjYXVzZSBtYXRoIHByb2JsZW1zXG4gICAgICAgIGlmIChNYXRoLmFicyhkZW5vbSkgPCBEZW5vbUVwaWxzb24pIHtcbiAgICAgICAgICAgIGRlbm9tID0gRGVub21FcGlsc29uO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdiA9IChkMTEgKiBkMjAgLSBkMDEgKiBkMjEpIC8gZGVub207XG4gICAgICAgIGNvbnN0IHcgPSAoZDAwICogZDIxIC0gZDAxICogZDIwKSAvIGRlbm9tO1xuICAgICAgICBjb25zdCB1ID0gMS4wIC0gdiAtIHc7XG4gICAgICAgIHJlc3VsdC5zZXQodSwgdiwgdyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaW50ZXJwb2xhdGVWZXJ0ZXhBdHRyaWJ1dGVzKGRzdDogbnVtYmVyLCBpMDogbnVtYmVyLCBpMTogbnVtYmVyLCBpMjogbnVtYmVyLCBiYXJ5Y2VudHJpY0Nvb3JkOiBWZWMzKSB7XG4gICAgICAgIGlmICh0aGlzLl92ZXJ0Tm9ybWFscykge1xuICAgICAgICAgICAgX3RlbXBWZWMzLnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIFZlYzMuc2NhbGVBbmRBZGQoX3RlbXBWZWMzLCBfdGVtcFZlYzMsIHRoaXMuX3ZlcnROb3JtYWxzW2kwXSwgYmFyeWNlbnRyaWNDb29yZC54KTtcbiAgICAgICAgICAgIFZlYzMuc2NhbGVBbmRBZGQoX3RlbXBWZWMzLCBfdGVtcFZlYzMsIHRoaXMuX3ZlcnROb3JtYWxzW2kxXSwgYmFyeWNlbnRyaWNDb29yZC55KTtcbiAgICAgICAgICAgIFZlYzMuc2NhbGVBbmRBZGQoX3RlbXBWZWMzLCBfdGVtcFZlYzMsIHRoaXMuX3ZlcnROb3JtYWxzW2kyXSwgYmFyeWNlbnRyaWNDb29yZC56KTtcbiAgICAgICAgICAgIFZlYzMubm9ybWFsaXplKF90ZW1wVmVjMywgX3RlbXBWZWMzKTtcbiAgICAgICAgICAgIFZlYzMuY29weSh0aGlzLl92ZXJ0Tm9ybWFsc1tkc3RdLCBfdGVtcFZlYzMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRVVjJEKSB7XG4gICAgICAgICAgICBfdGVtcFZlYzIuc2V0KDAsIDApO1xuICAgICAgICAgICAgVmVjMi5zY2FsZUFuZEFkZChfdGVtcFZlYzIsIF90ZW1wVmVjMiwgdGhpcy5fdmVydFVWMkRbaTBdLCBiYXJ5Y2VudHJpY0Nvb3JkLngpO1xuICAgICAgICAgICAgVmVjMi5zY2FsZUFuZEFkZChfdGVtcFZlYzIsIF90ZW1wVmVjMiwgdGhpcy5fdmVydFVWMkRbaTFdLCBiYXJ5Y2VudHJpY0Nvb3JkLnkpO1xuICAgICAgICAgICAgVmVjMi5zY2FsZUFuZEFkZChfdGVtcFZlYzIsIF90ZW1wVmVjMiwgdGhpcy5fdmVydFVWMkRbaTJdLCBiYXJ5Y2VudHJpY0Nvb3JkLnopO1xuICAgICAgICAgICAgVmVjMi5jb3B5KHRoaXMuX3ZlcnRVVjJEW2RzdF0sIF90ZW1wVmVjMik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fdmVydFRhbmdlbnRzKSB7XG4gICAgICAgICAgICBfdGVtcFZlYzQuc2V0KDAsIDAsIDAsIDApO1xuICAgICAgICAgICAgVmVjNC5zY2FsZUFuZEFkZChfdGVtcFZlYzQsIF90ZW1wVmVjNCwgdGhpcy5fdmVydFRhbmdlbnRzW2kwXSwgYmFyeWNlbnRyaWNDb29yZC54KTtcbiAgICAgICAgICAgIFZlYzQuc2NhbGVBbmRBZGQoX3RlbXBWZWM0LCBfdGVtcFZlYzQsIHRoaXMuX3ZlcnRUYW5nZW50c1tpMV0sIGJhcnljZW50cmljQ29vcmQueSk7XG4gICAgICAgICAgICBWZWM0LnNjYWxlQW5kQWRkKF90ZW1wVmVjNCwgX3RlbXBWZWM0LCB0aGlzLl92ZXJ0VGFuZ2VudHNbaTJdLCBiYXJ5Y2VudHJpY0Nvb3JkLnopO1xuICAgICAgICAgICAgdGhpcy5fbm9ybWFsaXplVGFuZ2VudCh0aGlzLl92ZXJ0VGFuZ2VudHNbZHN0XSwgX3RlbXBWZWM0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl92ZXJ0Q29sb3JzKSB7XG4gICAgICAgICAgICBfdGVtcENvbG9yLnNldCgwLCAwLCAwLCAwKTtcbiAgICAgICAgICAgIGNvbG9yU2NhbGVBbmRBZGQoX3RlbXBDb2xvciwgX3RlbXBDb2xvciwgdGhpcy5fdmVydENvbG9yc1tpMF0sIGJhcnljZW50cmljQ29vcmQueCk7XG4gICAgICAgICAgICBjb2xvclNjYWxlQW5kQWRkKF90ZW1wQ29sb3IsIF90ZW1wQ29sb3IsIHRoaXMuX3ZlcnRDb2xvcnNbaTFdLCBiYXJ5Y2VudHJpY0Nvb3JkLnkpO1xuICAgICAgICAgICAgY29sb3JTY2FsZUFuZEFkZChfdGVtcENvbG9yLCBfdGVtcENvbG9yLCB0aGlzLl92ZXJ0Q29sb3JzW2kyXSwgYmFyeWNlbnRyaWNDb29yZC56KTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRDb2xvcnNbZHN0XS5zZXQoX3RlbXBDb2xvci5yLCBfdGVtcENvbG9yLmcsIF90ZW1wQ29sb3IuYiwgX3RlbXBDb2xvci5hKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX25vcm1hbGl6ZVRhbmdlbnQob3V0OiBWZWM0LCB0YW5nZW50OiBWZWM0KSB7XG4gICAgICAgIGNvbnN0IHRhbmdlbnRWZWMgPSBuZXcgVmVjMyh0YW5nZW50LngsIHRhbmdlbnQueSwgdGFuZ2VudC56KTtcbiAgICAgICAgdGFuZ2VudFZlYy5ub3JtYWxpemUoKTtcbiAgICAgICAgb3V0LnNldCh0YW5nZW50VmVjLngsIHRhbmdlbnRWZWMueSwgdGFuZ2VudFZlYy56LCB0YW5nZW50LncpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kVWludDhBcnJheShhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KSB7XG4gICAgY29uc3QgYyA9IG5ldyBVaW50OEFycmF5KGEubGVuZ3RoICsgYi5sZW5ndGgpO1xuICAgIGMuc2V0KGEsIDApO1xuICAgIGMuc2V0KGIsIGEubGVuZ3RoKTtcbiAgICByZXR1cm4gYztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRTaW1wbGlmeU9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFyZ2V0UmF0aW86IDEsXG4gICAgICAgIGVuYWJsZVNtYXJ0TGluazogdHJ1ZSxcbiAgICAgICAgYWdyZXNzaXZlbmVzczogNyxcbiAgICAgICAgbWF4SXRlcmF0aW9uQ291bnQ6IDEwMCxcbiAgICB9O1xufVxuXG4vL3NpbXBsaWZ5IHRoZSBtZXNoIHJldHVybiBhIG5ldyBtZXNo77yMIG9ubHkgc3VwcG9ydCBpbmRleGVkIHRyaWFuZ2xlIG1lc2hcbmV4cG9ydCBmdW5jdGlvbiBzaW1wbGlmeU1lc2gobWVzaDogTWVzaCwgb3B0aW9ucz86IFNpbXBsaWZ5T3B0aW9ucykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaC5zdHJ1Y3QucHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoLnN0cnVjdC5wcmltaXRpdmVzW2ldO1xuICAgICAgICBpZiAocHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgIT09IGdmeC5QcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QgfHwgcHJpbWl0aXZlLmluZGV4VmlldyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvL1RPRE86IHN1cHBvcnQgb3RoZXIgcHJpbWl0aXZlIG1vZGVcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignU2ltcGxpZnlNZXNoIGN1cnJlbnQgb25seSBzdXBwb3J0IGluZGV4ZWQgdHJpYW5nbGUgbWVzaCwgb3ByZWF0aW9uIGlzIHNraXBwZWQnKTtcbiAgICAgICAgICAgIHJldHVybiBtZXNoO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0gZ2V0RGVmYXVsdFNpbXBsaWZ5T3B0aW9ucygpO1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zIHx8IHt9KTtcbiAgICBsZXQgYnl0ZU9mZnNldCA9IDAsXG4gICAgICAgIGogPSAwO1xuICAgIGNvbnN0IHZlcnRleEJ1bmRsZXMgPSBuZXcgQXJyYXk8TWVzaC5JVmVydGV4QnVuZGxlPigpO1xuICAgIGNvbnN0IHByaW1pdGl2ZXMgPSBuZXcgQXJyYXk8TWVzaC5JU3ViTWVzaD4oKTtcbiAgICBsZXQgZGF0YSA9IG5ldyBVaW50OEFycmF5KDApOyAvL2luaXRsaXplIG91dCBtZXNoIGRhdGEgd2l0aCBlbXB0eSBkYXRhXG4gICAgLy9zaW1wbGlmeSBlYWNoIHN1Ym1lc2ggb2YgdGhlIG1lc2hcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2guc3RydWN0LnZlcnRleEJ1bmRsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IG1lc2gucmVhZEluZGljZXMoaSk7XG4gICAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gbWVzaC5zdHJ1Y3QudmVydGV4QnVuZGxlc1tpXS52aWV3LmNvdW50O1xuICAgICAgICBjb25zdCB0cmlhbmdsZUNvdW50ID0gaW5kaWNlcyA/IGluZGljZXMubGVuZ3RoIC8gMyA6IHZlcnRleENvdW50IC8gMztcbiAgICAgICAgaWYgKHRyaWFuZ2xlQ291bnQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB1dnMgPSBtZXNoLnJlYWRBdHRyaWJ1dGUoaSwgZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9URVhfQ09PUkQpO1xuICAgICAgICAgICAgY29uc3QgdGFuZ2VudHMgPSBtZXNoLnJlYWRBdHRyaWJ1dGUoaSwgZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9UQU5HRU5UKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbHMgPSBtZXNoLnJlYWRBdHRyaWJ1dGUoaSwgZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9OT1JNQUwpO1xuICAgICAgICAgICAgY29uc3Qgd2VpZ2h0cyA9IG1lc2gucmVhZEF0dHJpYnV0ZShpLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1dFSUdIVFMpO1xuICAgICAgICAgICAgY29uc3Qgam9pbnRzID0gbWVzaC5yZWFkQXR0cmlidXRlKGksIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfSk9JTlRTKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ycyA9IG1lc2gucmVhZEF0dHJpYnV0ZShpLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0NPTE9SKTtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IG1lc2gucmVhZEF0dHJpYnV0ZShpLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OKTtcblxuICAgICAgICAgICAgY29uc3Qgc2ltcGxpZnkgPSBuZXcgTWVzaFNpbXBsaWZ5KCk7XG4gICAgICAgICAgICBzaW1wbGlmeS5idWlsZEdlb21ldHJpYyh7IHBvc2l0aW9ucywgbm9ybWFscywgdXZzLCBpbmRpY2VzOiBpbmRpY2VzID8/IHVuZGVmaW5lZCwgdGFuZ2VudHMsIHdlaWdodHMsIGpvaW50cywgY29sb3JzIH0pO1xuICAgICAgICAgICAgc2ltcGxpZnkuc2ltcGxpZmljYXRpb25PcHRpb25zLmFncmVzc2l2ZW5lc3MgPSBvcHRpb25zLmFncmVzc2l2ZW5lc3M7XG4gICAgICAgICAgICBzaW1wbGlmeS5zaW1wbGlmaWNhdGlvbk9wdGlvbnMuZW5hYmxlU21hcnRMaW5rID0gb3B0aW9ucy5lbmFibGVTbWFydExpbms7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBzaW1wbGlmeS5zaW1wbGlmeU1lc2gob3B0aW9ucy50YXJnZXRSYXRpbyAqIHRyaWFuZ2xlQ291bnQpO1xuICAgICAgICAgICAgY29uc3QgZ0luZm8gPSB7IC4uLnJlc3VsdCwgY3VzdG9tQXR0cmlidXRlczogW10sIHByaW1pdGl2ZU1vZGU6IGdmeC5QcmltaXRpdmVNb2RlLlRSSUFOR0xFX0xJU1QgfTtcbiAgICAgICAgICAgIGlmIChnSW5mby5hdHRycykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJzID0gZ0luZm8uYXR0cnM7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGdJbmZvLmF0dHJzO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT0gJ2pvaW50cycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cjogbmV3IGdmeC5BdHRyaWJ1dGUoZ2Z4LkF0dHJpYnV0ZU5hbWUuQVRUUl9KT0lOVFMsIGdmeC5Gb3JtYXQuUkdCQTE2VUkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogYXR0cnNba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBnSW5mby5jdXN0b21BdHRyaWJ1dGVzLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09ICd3ZWlnaHRzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyOiBuZXcgZ2Z4LkF0dHJpYnV0ZShnZnguQXR0cmlidXRlTmFtZS5BVFRSX1dFSUdIVFMsIGdmeC5Gb3JtYXQuUkdCQTMyRiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBhdHRyc1trZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdJbmZvLmN1c3RvbUF0dHJpYnV0ZXMucHVzaChpbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN1Yk1lc2ggPSBuZXcgTWVzaCgpO1xuICAgICAgICAgICAgdXRpbHMuY3JlYXRlTWVzaChnSW5mbywgc3ViTWVzaCwgeyBjYWxjdWxhdGVCb3VuZHM6IHRydWUgfSk7XG4gICAgICAgICAgICAvLyBhcHBlbmQgc3VibWVzaCBkYXRhIHRvIG91dCBtZXNoIGRhdGFcbiAgICAgICAgICAgIGFzc2VydChzdWJNZXNoLnN0cnVjdC52ZXJ0ZXhCdW5kbGVzLmxlbmd0aCA9PSAxKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnRleEJ1bmRsZSA9IHN1Yk1lc2guc3RydWN0LnZlcnRleEJ1bmRsZXNbMF07XG4gICAgICAgICAgICBkYXRhID0gYXBwZW5kVWludDhBcnJheShcbiAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgIHN1Yk1lc2guZGF0YS5zbGljZSh2ZXJ0ZXhCdW5kbGUudmlldy5vZmZzZXQsIHZlcnRleEJ1bmRsZS52aWV3Lm9mZnNldCArIHZlcnRleEJ1bmRsZS52aWV3Lmxlbmd0aCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmVydGV4QnVuZGxlLnZpZXcub2Zmc2V0ID0gYnl0ZU9mZnNldDtcbiAgICAgICAgICAgIHZlcnRleEJ1bmRsZXMucHVzaCh2ZXJ0ZXhCdW5kbGUpO1xuICAgICAgICAgICAgYnl0ZU9mZnNldCArPSB2ZXJ0ZXhCdW5kbGUudmlldy5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgcHJpbWl0aXZlOiBNZXNoLklTdWJNZXNoO1xuICAgICAgICAgICAgaWYgKHN1Yk1lc2guc3RydWN0LnByaW1pdGl2ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFzc2VydChzdWJNZXNoLnN0cnVjdC5wcmltaXRpdmVzLmxlbmd0aCA9PSAxKTtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmUgPSBzdWJNZXNoLnN0cnVjdC5wcmltaXRpdmVzWzBdO1xuICAgICAgICAgICAgICAgIGFzc2VydChwcmltaXRpdmUuaW5kZXhWaWV3KTtcbiAgICAgICAgICAgICAgICBkYXRhID0gYXBwZW5kVWludDhBcnJheShcbiAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgc3ViTWVzaC5kYXRhLnNsaWNlKHByaW1pdGl2ZS5pbmRleFZpZXcub2Zmc2V0LCBwcmltaXRpdmUuaW5kZXhWaWV3Lm9mZnNldCArIHByaW1pdGl2ZS5pbmRleFZpZXcubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZS5pbmRleFZpZXcub2Zmc2V0ID0gYnl0ZU9mZnNldDtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmUuam9pbnRNYXBJbmRleCA9IHN1Yk1lc2guc3RydWN0LnByaW1pdGl2ZXNbMF0uam9pbnRNYXBJbmRleDtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmVzLnB1c2gocHJpbWl0aXZlKTtcbiAgICAgICAgICAgICAgICBieXRlT2Zmc2V0ICs9IHByaW1pdGl2ZS5pbmRleFZpZXcubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZXNbal0udmVydGV4QnVuZGVsSW5kaWNlcyA9IFtqXTtcbiAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgbWVzaENyZWF0ZUluZm86IE1lc2guSUNyZWF0ZUluZm8gPSB7XG4gICAgICAgIHN0cnVjdDoge1xuICAgICAgICAgICAgdmVydGV4QnVuZGxlczogdmVydGV4QnVuZGxlcyxcbiAgICAgICAgICAgIHByaW1pdGl2ZXM6IHByaW1pdGl2ZXMsXG4gICAgICAgICAgICBtaW5Qb3NpdGlvbjogbWVzaC5zdHJ1Y3QubWluUG9zaXRpb24sXG4gICAgICAgICAgICBtYXhQb3NpdGlvbjogbWVzaC5zdHJ1Y3QubWF4UG9zaXRpb24sXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgfTtcbiAgICBjb25zdCBvdXQgPSBuZXcgTWVzaCgpO1xuICAgIG91dC5yZXNldChtZXNoQ3JlYXRlSW5mbyk7XG4gICAgb3V0Lmhhc2g7XG4gICAgcmV0dXJuIG91dDtcbn1cbiJdfQ==