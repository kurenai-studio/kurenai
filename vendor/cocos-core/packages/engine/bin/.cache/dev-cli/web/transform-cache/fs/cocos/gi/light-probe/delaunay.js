System.register("q-bundled:///fs/cocos/gi/light-probe/delaunay.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Mat3, EPSILON, Vec3, _decorator, Delaunay, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _class3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _class4, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _dec2, _class5, _class6, _descriptor14, _descriptor15, _dec3, _class7, _class8, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, ccclass, serializable, _mat, _n, _a, _ap, _b, _bp, _p2, _cp, Vertex, Edge, Triangle, CircumSphere, Tetrahedron;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("Delaunay", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Mat3 = _coreIndexJs.Mat3;
      EPSILON = _coreIndexJs.EPSILON;
      Vec3 = _coreIndexJs.Vec3;
      _decorator = _coreIndexJs._decorator;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      ({
        ccclass,
        serializable
      } = _decorator);
      _mat = new Mat3();
      _n = new Vec3(0.0, 0.0, 0.0);
      _a = new Vec3(0.0, 0.0, 0.0);
      _ap = new Vec3(0.0, 0.0, 0.0);
      _b = new Vec3(0.0, 0.0, 0.0);
      _bp = new Vec3(0.0, 0.0, 0.0);
      _p2 = new Vec3(0.0, 0.0, 0.0);
      _cp = new Vec3(0.0, 0.0, 0.0);
      _export("Vertex", Vertex = (_dec = ccclass('cc.Vertex'), _dec(_class = (_class2 = class Vertex {
        constructor(pos) {
          _initializerDefineProperty(this, "position", _descriptor, this);
          _initializerDefineProperty(this, "normal", _descriptor2, this);
          _initializerDefineProperty(this, "coefficients", _descriptor3, this);
          this.position.set(pos);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "position", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "normal", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "coefficients", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      Edge = (_class3 = class Edge {
        constructor(tet, i, v0, v1) {
          _initializerDefineProperty(this, "tetrahedron", _descriptor4, this);
          // tetrahedron index this edge belongs to
          _initializerDefineProperty(this, "index", _descriptor5, this);
          // index in triangle's three edges of an outer cell
          _initializerDefineProperty(this, "vertex0", _descriptor6, this);
          _initializerDefineProperty(this, "vertex1", _descriptor7, this);
          this.tetrahedron = tet;
          this.index = i;
          if (v0 < v1) {
            this.vertex0 = v0;
            this.vertex1 = v1;
          } else {
            this.vertex0 = v1;
            this.vertex1 = v0;
          }
        }
        set(tet, i, v0, v1) {
          this.tetrahedron = tet;
          this.index = i;
          if (v0 < v1) {
            this.vertex0 = v0;
            this.vertex1 = v1;
          } else {
            this.vertex0 = v1;
            this.vertex1 = v0;
          }
        }
        isSame(other) {
          return this.vertex0 === other.vertex0 && this.vertex1 === other.vertex1;
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class3.prototype, "tetrahedron", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class3.prototype, "index", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class3.prototype, "vertex0", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class3.prototype, "vertex1", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _class3);
      Triangle = (_class4 = class Triangle {
        // tetrahedron's last vertex index used to compute normal direction

        constructor(tet, i, v0, v1, v2, v3) {
          _initializerDefineProperty(this, "invalid", _descriptor8, this);
          _initializerDefineProperty(this, "isOuterFace", _descriptor9, this);
          _initializerDefineProperty(this, "tetrahedron", _descriptor0, this);
          // tetrahedron index this triangle belongs to
          _initializerDefineProperty(this, "index", _descriptor1, this);
          // index in tetrahedron's four triangles
          _initializerDefineProperty(this, "vertex0", _descriptor10, this);
          _initializerDefineProperty(this, "vertex1", _descriptor11, this);
          _initializerDefineProperty(this, "vertex2", _descriptor12, this);
          _initializerDefineProperty(this, "vertex3", _descriptor13, this);
          this.tetrahedron = tet;
          this.index = i;
          this.vertex3 = v3;
          if (v0 < v1 && v0 < v2) {
            this.vertex0 = v0;
            if (v1 < v2) {
              this.vertex1 = v1;
              this.vertex2 = v2;
            } else {
              this.vertex1 = v2;
              this.vertex2 = v1;
            }
          } else if (v1 < v0 && v1 < v2) {
            this.vertex0 = v1;
            if (v0 < v2) {
              this.vertex1 = v0;
              this.vertex2 = v2;
            } else {
              this.vertex1 = v2;
              this.vertex2 = v0;
            }
          } else {
            this.vertex0 = v2;
            if (v0 < v1) {
              this.vertex1 = v0;
              this.vertex2 = v1;
            } else {
              this.vertex1 = v1;
              this.vertex2 = v0;
            }
          }
        }
        set(tet, i, v0, v1, v2, v3) {
          this.invalid = false;
          this.isOuterFace = true;
          this.tetrahedron = tet;
          this.index = i;
          this.vertex3 = v3;
          if (v0 < v1 && v0 < v2) {
            this.vertex0 = v0;
            if (v1 < v2) {
              this.vertex1 = v1;
              this.vertex2 = v2;
            } else {
              this.vertex1 = v2;
              this.vertex2 = v1;
            }
          } else if (v1 < v0 && v1 < v2) {
            this.vertex0 = v1;
            if (v0 < v2) {
              this.vertex1 = v0;
              this.vertex2 = v2;
            } else {
              this.vertex1 = v2;
              this.vertex2 = v0;
            }
          } else {
            this.vertex0 = v2;
            if (v0 < v1) {
              this.vertex1 = v0;
              this.vertex2 = v1;
            } else {
              this.vertex1 = v1;
              this.vertex2 = v0;
            }
          }
        }
        isSame(other) {
          return this.vertex0 === other.vertex0 && this.vertex1 === other.vertex1 && this.vertex2 === other.vertex2;
        }
      }, _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "invalid", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class4.prototype, "isOuterFace", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class4.prototype, "tetrahedron", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class4.prototype, "index", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "vertex0", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "vertex1", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "vertex2", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "vertex3", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _class4);
      _export("CircumSphere", CircumSphere = (_dec2 = ccclass('cc.CircumSphere'), _dec2(_class5 = (_class6 = class CircumSphere {
        constructor() {
          _initializerDefineProperty(this, "center", _descriptor14, this);
          _initializerDefineProperty(this, "radiusSquared", _descriptor15, this);
        }
        init(p0, p1, p2, p3) {
          // calculate circumsphere of 4 points in R^3 space.
          _mat.set(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z, p2.x - p0.x, p2.y - p0.y, p2.z - p0.z, p3.x - p0.x, p3.y - p0.y, p3.z - p0.z);
          _mat.invert();
          _mat.transpose();
          _n.set(((p1.x + p0.x) * (p1.x - p0.x) + (p1.y + p0.y) * (p1.y - p0.y) + (p1.z + p0.z) * (p1.z - p0.z)) * 0.5, ((p2.x + p0.x) * (p2.x - p0.x) + (p2.y + p0.y) * (p2.y - p0.y) + (p2.z + p0.z) * (p2.z - p0.z)) * 0.5, ((p3.x + p0.x) * (p3.x - p0.x) + (p3.y + p0.y) * (p3.y - p0.y) + (p3.z + p0.z) * (p3.z - p0.z)) * 0.5);
          Vec3.transformMat3(this.center, _n, _mat);
          this.radiusSquared = Vec3.squaredDistance(p0, this.center);
        }
      }, _descriptor14 = _applyDecoratedDescriptor(_class6.prototype, "center", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class6.prototype, "radiusSquared", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class6)) || _class5));
      /**
       * inner tetrahedron or outer cell structure
       */
      _export("Tetrahedron", Tetrahedron = (_dec3 = ccclass('cc.Tetrahedron'), _dec3(_class7 = (_class8 = class Tetrahedron {
        // only valid in inner tetrahedron

        // inner tetrahedron or outer cell constructor
        constructor(delaunay, v0, v1, v2, v3 = -1) {
          _initializerDefineProperty(this, "invalid", _descriptor16, this);
          _initializerDefineProperty(this, "vertex0", _descriptor17, this);
          _initializerDefineProperty(this, "vertex1", _descriptor18, this);
          _initializerDefineProperty(this, "vertex2", _descriptor19, this);
          _initializerDefineProperty(this, "vertex3", _descriptor20, this);
          // -1 means outer cell, otherwise inner tetrahedron
          _initializerDefineProperty(this, "neighbours", _descriptor21, this);
          _initializerDefineProperty(this, "matrix", _descriptor22, this);
          _initializerDefineProperty(this, "offset", _descriptor23, this);
          // only valid in outer cell
          _initializerDefineProperty(this, "sphere", _descriptor24, this);
          this.vertex0 = v0;
          this.vertex1 = v1;
          this.vertex2 = v2;
          this.vertex3 = v3;

          // inner tetrahedron
          if (v3 >= 0) {
            const probes = delaunay._probes;
            const p0 = probes[this.vertex0].position;
            const p1 = probes[this.vertex1].position;
            const p2 = probes[this.vertex2].position;
            const p3 = probes[this.vertex3].position;
            this.sphere.init(p0, p1, p2, p3);
          }
        }
        isInCircumSphere(point) {
          return Vec3.squaredDistance(point, this.sphere.center) < this.sphere.radiusSquared - EPSILON;
        }
        contain(vertexIndex) {
          return this.vertex0 === vertexIndex || this.vertex1 === vertexIndex || this.vertex2 === vertexIndex || this.vertex3 === vertexIndex;
        }
        isInnerTetrahedron() {
          return this.vertex3 >= 0;
        }
        isOuterCell() {
          return this.vertex3 < 0; // -1 or -2
        }
      }, _descriptor16 = _applyDecoratedDescriptor(_class8.prototype, "invalid", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class8.prototype, "vertex0", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class8.prototype, "vertex1", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class8.prototype, "vertex2", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class8.prototype, "vertex3", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class8.prototype, "neighbours", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [-1, -1, -1, -1];
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class8.prototype, "matrix", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Mat3();
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class8.prototype, "offset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0.0, 0.0, 0.0);
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class8.prototype, "sphere", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CircumSphere();
        }
      }), _class8)) || _class7));
      _export("Delaunay", Delaunay = class Delaunay {
        constructor(probes) {
          this._probes = [];
          this._tetrahedrons = [];
          this._triangles = [];
          this._edges = [];
          this._probes = probes;
        }
        build() {
          this.reset();
          this.tetrahedralize();
          this.computeAdjacency();
          this.computeMatrices();
          return this._tetrahedrons;
        }
        reset() {
          this._tetrahedrons.length = 0;
          this._triangles.length = 0;
          this._edges.length = 0;
        }

        /**
         * Bowyer-Watson algorithm
         */
        tetrahedralize() {
          // get probe count first
          const probeCount = this._probes.length;

          // init a super tetrahedron containing all probes
          const center = this.initTetrahedron();
          for (let i = 0; i < probeCount; i++) {
            this.addProbe(i);
          }

          // remove all tetrahedrons which contain the super tetrahedron's vertices
          this._tetrahedrons = this._tetrahedrons.filter(tetrahedron => {
            const vertexIndex = probeCount;
            const isSuperTetrahedron = tetrahedron.contain(vertexIndex) || tetrahedron.contain(vertexIndex + 1) || tetrahedron.contain(vertexIndex + 2) || tetrahedron.contain(vertexIndex + 3);
            return !isSuperTetrahedron;
          });

          // remove all additional points in the super tetrahedron
          this._probes.length = probeCount;
          this.reorder(center);
        }
        initTetrahedron() {
          const minPos = new Vec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
          const maxPos = new Vec3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
          for (let i = 0; i < this._probes.length; i++) {
            const position = this._probes[i].position;
            minPos.x = Math.min(minPos.x, position.x);
            maxPos.x = Math.max(maxPos.x, position.x);
            minPos.y = Math.min(minPos.y, position.y);
            maxPos.y = Math.max(maxPos.y, position.y);
            minPos.z = Math.min(minPos.z, position.z);
            maxPos.z = Math.max(maxPos.z, position.z);
          }
          const center = new Vec3(0.0, 0.0, 0.0);
          Vec3.add(center, minPos, maxPos);
          Vec3.multiplyScalar(center, center, 0.5);
          const extent = new Vec3(0.0, 0.0, 0.0);
          Vec3.subtract(extent, maxPos, minPos);
          const offset = Math.max(extent.x, extent.y, extent.z) * 10.0;
          const p0 = new Vec3(center.x, center.y + offset, center.z);
          const p1 = new Vec3(center.x - offset, center.y - offset, center.z - offset);
          const p2 = new Vec3(center.x - offset, center.y - offset, center.z + offset);
          const p3 = new Vec3(center.x + offset, center.y - offset, center.z);
          const index = this._probes.length;
          this._probes.push(new Vertex(p0));
          this._probes.push(new Vertex(p1));
          this._probes.push(new Vertex(p2));
          this._probes.push(new Vertex(p3));
          this._tetrahedrons.push(new Tetrahedron(this, index, index + 1, index + 2, index + 3));
          return center;
        }
        addTriangle(index, tet, i, v0, v1, v2, v3) {
          if (index < this._triangles.length) {
            this._triangles[index].set(tet, i, v0, v1, v2, v3);
          } else {
            this._triangles.push(new Triangle(tet, i, v0, v1, v2, v3));
          }
        }
        addEdge(index, tet, i, v0, v1) {
          if (index < this._edges.length) {
            this._edges[index].set(tet, i, v0, v1);
          } else {
            this._edges.push(new Edge(tet, i, v0, v1));
          }
        }
        addProbe(vertexIndex) {
          const probe = this._probes[vertexIndex];
          const position = probe.position;
          let triangleIndex = 0;
          for (let i = 0; i < this._tetrahedrons.length; i++) {
            const tetrahedron = this._tetrahedrons[i];
            if (tetrahedron.isInCircumSphere(position)) {
              tetrahedron.invalid = true;
              this.addTriangle(triangleIndex, i, 0, tetrahedron.vertex1, tetrahedron.vertex3, tetrahedron.vertex2, tetrahedron.vertex0);
              this.addTriangle(triangleIndex + 1, i, 1, tetrahedron.vertex0, tetrahedron.vertex2, tetrahedron.vertex3, tetrahedron.vertex1);
              this.addTriangle(triangleIndex + 2, i, 2, tetrahedron.vertex0, tetrahedron.vertex3, tetrahedron.vertex1, tetrahedron.vertex2);
              this.addTriangle(triangleIndex + 3, i, 3, tetrahedron.vertex0, tetrahedron.vertex1, tetrahedron.vertex2, tetrahedron.vertex3);
              triangleIndex += 4;
            }
          }
          for (let i = 0; i < triangleIndex; i++) {
            if (this._triangles[i].invalid) {
              continue;
            }
            for (let k = i + 1; k < triangleIndex; k++) {
              if (this._triangles[i].isSame(this._triangles[k])) {
                this._triangles[i].invalid = true;
                this._triangles[k].invalid = true;
                break;
              }
            }
          }

          // remove containing tetrahedron
          this._tetrahedrons = this._tetrahedrons.filter(tetrahedron => !tetrahedron.invalid);
          for (let i = 0; i < triangleIndex; i++) {
            const triangle = this._triangles[i];
            if (!triangle.invalid) {
              this._tetrahedrons.push(new Tetrahedron(this, triangle.vertex0, triangle.vertex1, triangle.vertex2, vertexIndex));
            }
          }
        }
        reorder(center) {
          // The tetrahedron in the middle is placed at the front of the vector
          this._tetrahedrons.sort((a, b) => Vec3.squaredDistance(a.sphere.center, center) - Vec3.squaredDistance(b.sphere.center, center));
        }
        computeAdjacency() {
          const normal = new Vec3(0.0, 0.0, 0.0);
          const edge1 = new Vec3(0.0, 0.0, 0.0);
          const edge2 = new Vec3(0.0, 0.0, 0.0);
          const edge3 = new Vec3(0.0, 0.0, 0.0);
          const tetrahedronCount = this._tetrahedrons.length;
          let triangleIndex = 0;
          for (let i = 0; i < this._tetrahedrons.length; i++) {
            const tetrahedron = this._tetrahedrons[i];
            this.addTriangle(triangleIndex, i, 0, tetrahedron.vertex1, tetrahedron.vertex3, tetrahedron.vertex2, tetrahedron.vertex0);
            this.addTriangle(triangleIndex + 1, i, 1, tetrahedron.vertex0, tetrahedron.vertex2, tetrahedron.vertex3, tetrahedron.vertex1);
            this.addTriangle(triangleIndex + 2, i, 2, tetrahedron.vertex0, tetrahedron.vertex3, tetrahedron.vertex1, tetrahedron.vertex2);
            this.addTriangle(triangleIndex + 3, i, 3, tetrahedron.vertex0, tetrahedron.vertex1, tetrahedron.vertex2, tetrahedron.vertex3);
            triangleIndex += 4;
          }
          for (let i = 0; i < triangleIndex; i++) {
            if (!this._triangles[i].isOuterFace) {
              continue;
            }
            for (let k = i + 1; k < triangleIndex; k++) {
              if (this._triangles[i].isSame(this._triangles[k])) {
                // update adjacency between tetrahedrons
                this._tetrahedrons[this._triangles[i].tetrahedron].neighbours[this._triangles[i].index] = this._triangles[k].tetrahedron;
                this._tetrahedrons[this._triangles[k].tetrahedron].neighbours[this._triangles[k].index] = this._triangles[i].tetrahedron;
                this._triangles[i].isOuterFace = false;
                this._triangles[k].isOuterFace = false;
                break;
              }
            }
            if (this._triangles[i].isOuterFace) {
              const probe0 = this._probes[this._triangles[i].vertex0];
              const probe1 = this._probes[this._triangles[i].vertex1];
              const probe2 = this._probes[this._triangles[i].vertex2];
              const probe3 = this._probes[this._triangles[i].vertex3];
              Vec3.subtract(edge1, probe1.position, probe0.position);
              Vec3.subtract(edge2, probe2.position, probe0.position);
              Vec3.cross(normal, edge1, edge2);
              Vec3.subtract(edge3, probe3.position, probe0.position);
              const negative = Vec3.dot(normal, edge3);
              if (negative > 0.0) {
                Vec3.negate(normal, normal);
              }

              // accumulate weighted normal
              Vec3.add(probe0.normal, probe0.normal, normal);
              Vec3.add(probe1.normal, probe1.normal, normal);
              Vec3.add(probe2.normal, probe2.normal, normal);

              // create an outer cell with normal facing out
              const v0 = this._triangles[i].vertex0;
              const v1 = negative > 0.0 ? this._triangles[i].vertex2 : this._triangles[i].vertex1;
              const v2 = negative > 0.0 ? this._triangles[i].vertex1 : this._triangles[i].vertex2;
              const tetrahedron = new Tetrahedron(this, v0, v1, v2);

              // update adjacency between tetrahedron and outer cell
              tetrahedron.neighbours[3] = this._triangles[i].tetrahedron;
              this._tetrahedrons[this._triangles[i].tetrahedron].neighbours[this._triangles[i].index] = this._tetrahedrons.length;
              this._tetrahedrons.push(tetrahedron);
            }
          }

          // start from outer cell index
          let edgeIndex = 0;
          for (let i = tetrahedronCount; i < this._tetrahedrons.length; i++) {
            const tetrahedron = this._tetrahedrons[i];
            this.addEdge(edgeIndex, i, 0, tetrahedron.vertex1, tetrahedron.vertex2);
            this.addEdge(edgeIndex + 1, i, 1, tetrahedron.vertex2, tetrahedron.vertex0);
            this.addEdge(edgeIndex + 2, i, 2, tetrahedron.vertex0, tetrahedron.vertex1);
            edgeIndex += 3;
          }
          for (let i = 0; i < edgeIndex; i++) {
            for (let k = i + 1; k < edgeIndex; k++) {
              if (this._edges[i].isSame(this._edges[k])) {
                // update adjacency between outer cells
                this._tetrahedrons[this._edges[i].tetrahedron].neighbours[this._edges[i].index] = this._edges[k].tetrahedron;
                this._tetrahedrons[this._edges[k].tetrahedron].neighbours[this._edges[k].index] = this._edges[i].tetrahedron;
              }
            }
          }

          // normalize all convex hull probes' normal
          for (let i = 0; i < this._probes.length; i++) {
            this._probes[i].normal.normalize();
          }
        }
        computeMatrices() {
          for (let i = 0; i < this._tetrahedrons.length; i++) {
            const tetrahedron = this._tetrahedrons[i];
            if (tetrahedron.vertex3 >= 0) {
              this.computeTetrahedronMatrix(tetrahedron);
            } else {
              this.computeOuterCellMatrix(tetrahedron);
            }
          }
        }
        computeTetrahedronMatrix(tetrahedron) {
          const p0 = this._probes[tetrahedron.vertex0].position;
          const p1 = this._probes[tetrahedron.vertex1].position;
          const p2 = this._probes[tetrahedron.vertex2].position;
          const p3 = this._probes[tetrahedron.vertex3].position;
          tetrahedron.matrix.set(p0.x - p3.x, p1.x - p3.x, p2.x - p3.x, p0.y - p3.y, p1.y - p3.y, p2.y - p3.y, p0.z - p3.z, p1.z - p3.z, p2.z - p3.z);
          tetrahedron.matrix.invert();
          tetrahedron.matrix.transpose();
        }
        computeOuterCellMatrix(tetrahedron) {
          const v = [];
          const p = [];
          v[0] = this._probes[tetrahedron.vertex0].normal;
          v[1] = this._probes[tetrahedron.vertex1].normal;
          v[2] = this._probes[tetrahedron.vertex2].normal;
          p[0] = this._probes[tetrahedron.vertex0].position;
          p[1] = this._probes[tetrahedron.vertex1].position;
          p[2] = this._probes[tetrahedron.vertex2].position;
          Vec3.subtract(_a, p[0], p[2]);
          Vec3.subtract(_ap, v[0], v[2]);
          Vec3.subtract(_b, p[1], p[2]);
          Vec3.subtract(_bp, v[1], v[2]);
          _p2.set(p[2]);
          Vec3.negate(_cp, v[2]);
          const m = [];
          m[0] = _ap.y * _bp.z - _ap.z * _bp.y;
          m[3] = -_ap.x * _bp.z + _ap.z * _bp.x;
          m[6] = _ap.x * _bp.y - _ap.y * _bp.x;
          m[9] = _a.x * _bp.y * _cp.z - _a.y * _bp.x * _cp.z + _ap.x * _b.y * _cp.z - _ap.y * _b.x * _cp.z + _a.z * _bp.x * _cp.y - _a.z * _bp.y * _cp.x + _ap.z * _b.x * _cp.y - _ap.z * _b.y * _cp.x - _a.x * _bp.z * _cp.y + _a.y * _bp.z * _cp.x - _ap.x * _b.z * _cp.y + _ap.y * _b.z * _cp.x;
          m[9] -= _p2.x * m[0] + _p2.y * m[3] + _p2.z * m[6];
          m[1] = _ap.y * _b.z + _a.y * _bp.z - _ap.z * _b.y - _a.z * _bp.y;
          m[4] = -_a.x * _bp.z - _ap.x * _b.z + _a.z * _bp.x + _ap.z * _b.x;
          m[7] = _a.x * _bp.y - _a.y * _bp.x + _ap.x * _b.y - _ap.y * _b.x;
          m[10] = _a.x * _b.y * _cp.z - _a.y * _b.x * _cp.z - _a.x * _b.z * _cp.y + _a.y * _b.z * _cp.x + _a.z * _b.x * _cp.y - _a.z * _b.y * _cp.x;
          m[10] -= _p2.x * m[1] + _p2.y * m[4] + _p2.z * m[7];
          m[2] = -_a.z * _b.y + _a.y * _b.z;
          m[5] = -_a.x * _b.z + _a.z * _b.x;
          m[8] = _a.x * _b.y - _a.y * _b.x;
          m[11] = 0.0;
          m[11] -= _p2.x * m[2] + _p2.y * m[5] + _p2.z * m[8];

          // coefficient of t^3
          const c = _ap.x * _bp.y * _cp.z - _ap.y * _bp.x * _cp.z + _ap.z * _bp.x * _cp.y - _ap.z * _bp.y * _cp.x + _ap.y * _bp.z * _cp.x - _ap.x * _bp.z * _cp.y;
          if (Math.abs(c) > EPSILON) {
            // t^3 + p * t^2 + q * t + r = 0
            for (let k = 0; k < 12; k++) {
              m[k] /= c;
            }
          } else {
            // set last vertex index of outer cell to -2
            // p * t^2 + q * t + r = 0
            tetrahedron.vertex3 = -2;
          }

          // transpose the matrix
          tetrahedron.matrix.set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);

          // last column of mat3x4
          tetrahedron.offset.set(m[9], m[10], m[11]);
        }
      });
    }
  };
});