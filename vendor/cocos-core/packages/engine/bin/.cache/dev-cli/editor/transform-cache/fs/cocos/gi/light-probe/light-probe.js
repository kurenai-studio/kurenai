System.register("q-bundled:///fs/cocos/gi/light-probe/light-probe.js", ["../../core/data/decorators/index.js", "./delaunay.js", "./polynomial-solver.js", "../../core/index.js", "./sh.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, type, Vertex, Tetrahedron, Delaunay, PolynomialSolver, Vec3, cclegacy, EPSILON, SH, LightProbes, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _v1, _v2, _normal, _edgeP0, _edgeP1, _edgeP2, _crossP12, _crossP20, _normal2, _edge1, _edge2, _v, _vp0, _vp1, _vp2, LightProbesData;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  _export("LightProbes", void 0);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_delaunayJs) {
      Vertex = _delaunayJs.Vertex;
      Tetrahedron = _delaunayJs.Tetrahedron;
      Delaunay = _delaunayJs.Delaunay;
    }, function (_polynomialSolverJs) {
      PolynomialSolver = _polynomialSolverJs.PolynomialSolver;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      EPSILON = _coreIndexJs.EPSILON;
    }, function (_shJs) {
      SH = _shJs.SH;
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
      _v1 = new Vec3(0.0, 0.0, 0.0);
      _v2 = new Vec3(0.0, 0.0, 0.0);
      _normal = new Vec3(0.0, 0.0, 0.0);
      _edgeP0 = new Vec3(0.0, 0.0, 0.0);
      _edgeP1 = new Vec3(0.0, 0.0, 0.0);
      _edgeP2 = new Vec3(0.0, 0.0, 0.0);
      _crossP12 = new Vec3(0.0, 0.0, 0.0);
      _crossP20 = new Vec3(0.0, 0.0, 0.0);
      _normal2 = new Vec3(0.0, 0.0, 0.0);
      _edge1 = new Vec3(0.0, 0.0, 0.0);
      _edge2 = new Vec3(0.0, 0.0, 0.0);
      _v = new Vec3(0.0, 0.0, 0.0);
      _vp0 = new Vec3(0.0, 0.0, 0.0);
      _vp1 = new Vec3(0.0, 0.0, 0.0);
      _vp2 = new Vec3(0.0, 0.0, 0.0);
      _export("LightProbesData", LightProbesData = (_dec = ccclass('cc.LightProbesData'), _dec2 = type([Vertex]), _dec3 = type([Tetrahedron]), _dec(_class = (_class2 = class LightProbesData {
        constructor() {
          _initializerDefineProperty(this, "_probes", _descriptor, this);
          _initializerDefineProperty(this, "_tetrahedrons", _descriptor2, this);
        }
        get probes() {
          return this._probes;
        }
        get tetrahedrons() {
          return this._tetrahedrons;
        }
        empty() {
          return this._probes.length === 0 || this._tetrahedrons.length === 0;
        }
        reset() {
          this._probes.length = 0;
          this._tetrahedrons.length = 0;
        }
        updateProbes(points) {
          this._probes.length = points.length;
          const pointCount = this._probes.length;
          for (let i = 0; i < pointCount; i++) {
            let probe = this._probes[i];
            if (!probe) {
              probe = new Vertex(points[i]);
              for (let j = 0; j < SH.getBasisCount(); j++) {
                probe.coefficients[j] = Vec3.ZERO;
              }
              this._probes[i] = probe;
            } else {
              probe.position.set(points[i]);
            }
          }
        }
        updateTetrahedrons() {
          const delaunay = new Delaunay(this._probes);
          this._tetrahedrons = delaunay.build();
        }
        getInterpolationSHCoefficients(tetIndex, weights, coefficients) {
          if (!this.hasCoefficients()) {
            return false;
          }
          const length = SH.getBasisCount();
          const tetrahedron = this._tetrahedrons[tetIndex];
          const c0 = this._probes[tetrahedron.vertex0].coefficients;
          const c1 = this._probes[tetrahedron.vertex1].coefficients;
          const c2 = this._probes[tetrahedron.vertex2].coefficients;
          if (tetrahedron.vertex3 >= 0) {
            const c3 = this._probes[tetrahedron.vertex3].coefficients;
            for (let i = 0; i < length; i++) {
              coefficients[i] = new Vec3(0.0, 0.0, 0.0);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c0[i], weights.x);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c1[i], weights.y);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c2[i], weights.z);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c3[i], weights.w);
            }
          } else {
            for (let i = 0; i < length; i++) {
              coefficients[i] = new Vec3(0.0, 0.0, 0.0);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c0[i], weights.x);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c1[i], weights.y);
              Vec3.scaleAndAdd(coefficients[i], coefficients[i], c2[i], weights.z);
            }
          }
          return true;
        }
        getInterpolationWeights(position, tetIndex, weights) {
          const tetrahedronCount = this._tetrahedrons.length;
          if (tetIndex < 0 || tetIndex >= tetrahedronCount) {
            tetIndex = 0;
          }
          let lastIndex = -1;
          let nextIndex = -1;
          for (let i = 0; i < tetrahedronCount; i++) {
            const tetrahedron = this._tetrahedrons[tetIndex];
            this.getBarycentricCoord(position, tetrahedron, weights);
            if (weights.x >= 0.0 && weights.y >= 0.0 && weights.z >= 0.0 && weights.w >= 0.0) {
              break;
            }
            if (weights.x < weights.y && weights.x < weights.z && weights.x < weights.w) {
              nextIndex = tetrahedron.neighbours[0];
            } else if (weights.y < weights.z && weights.y < weights.w) {
              nextIndex = tetrahedron.neighbours[1];
            } else if (weights.z < weights.w) {
              nextIndex = tetrahedron.neighbours[2];
            } else {
              nextIndex = tetrahedron.neighbours[3];
            }

            // return directly due to numerical precision error
            if (lastIndex === nextIndex) {
              break;
            }
            lastIndex = tetIndex;
            tetIndex = nextIndex;
          }
          return tetIndex;
        }
        hasCoefficients() {
          return !this.empty() && this._probes[0].coefficients.length !== 0;
        }
        static getTriangleBarycentricCoord(p0, p1, p2, position) {
          Vec3.subtract(_v1, p1, p0);
          Vec3.subtract(_v2, p2, p0);
          Vec3.cross(_normal, _v1, _v2);
          if (_normal.lengthSqr() <= EPSILON) {
            return new Vec3(0.0, 0.0, 0.0);
          }
          const n = _normal.clone();
          n.normalize();
          const area012Inv = 1.0 / n.dot(_normal);
          Vec3.subtract(_edgeP0, p0, position);
          Vec3.subtract(_edgeP1, p1, position);
          Vec3.subtract(_edgeP2, p2, position);
          Vec3.cross(_crossP12, _edgeP1, _edgeP2);
          const areaP12 = n.dot(_crossP12);
          const alpha = areaP12 * area012Inv;
          Vec3.cross(_crossP20, _edgeP2, _edgeP0);
          const areaP20 = n.dot(_crossP20);
          const beta = areaP20 * area012Inv;
          return new Vec3(alpha, beta, 1.0 - alpha - beta);
        }
        getBarycentricCoord(position, tetrahedron, weights) {
          if (tetrahedron.vertex3 >= 0) {
            this.getTetrahedronBarycentricCoord(position, tetrahedron, weights);
          } else {
            this.getOuterCellBarycentricCoord(position, tetrahedron, weights);
          }
        }
        getTetrahedronBarycentricCoord(position, tetrahedron, weights) {
          const result = new Vec3(0.0, 0.0, 0.0);
          Vec3.subtract(result, position, this._probes[tetrahedron.vertex3].position);
          Vec3.transformMat3(result, result, tetrahedron.matrix);
          weights.set(result.x, result.y, result.z, 1.0 - result.x - result.y - result.z);
        }
        getOuterCellBarycentricCoord(position, tetrahedron, weights) {
          const p0 = this._probes[tetrahedron.vertex0].position;
          const p1 = this._probes[tetrahedron.vertex1].position;
          const p2 = this._probes[tetrahedron.vertex2].position;
          Vec3.subtract(_edge1, p1, p0);
          Vec3.subtract(_edge2, p2, p0);
          Vec3.cross(_normal2, _edge1, _edge2);
          Vec3.subtract(_v, position, p0);
          let t = Vec3.dot(_v, _normal2);
          if (t < 0.0) {
            // test tetrahedron in next iterator
            weights.set(0.0, 0.0, 0.0, -1.0);
            return;
          }
          const coefficients = new Vec3(0.0, 0.0, 0.0);
          Vec3.transformMat3(coefficients, position, tetrahedron.matrix);
          Vec3.add(coefficients, coefficients, tetrahedron.offset);
          if (tetrahedron.vertex3 === -1) {
            t = PolynomialSolver.getCubicUniqueRoot(coefficients.x, coefficients.y, coefficients.z);
          } else {
            t = PolynomialSolver.getQuadraticUniqueRoot(coefficients.x, coefficients.y, coefficients.z);
          }
          Vec3.scaleAndAdd(_vp0, p0, this._probes[tetrahedron.vertex0].normal, t);
          Vec3.scaleAndAdd(_vp1, p1, this._probes[tetrahedron.vertex1].normal, t);
          Vec3.scaleAndAdd(_vp2, p2, this._probes[tetrahedron.vertex2].normal, t);
          const result = LightProbesData.getTriangleBarycentricCoord(_vp0, _vp1, _vp2, position);
          weights.set(result.x, result.y, result.z, 0.0);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_probes", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_tetrahedrons", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      cclegacy.internal.LightProbesData = LightProbesData;

      /**
       * @en light probe data
       * @zh 光照探针数据
       */
      _export("LightProbes", LightProbes = class LightProbes {
        constructor() {
          this._giScale = 1.0;
          this._giSamples = 1024;
          this._bounces = 2;
          this._reduceRinging = 0.0;
          this._showProbe = true;
          this._showWireframe = true;
          this._showConvex = false;
          this._data = null;
          this._lightProbeSphereVolume = 1.0;
        }
        /**
         * @en GI multiplier
         * @zh GI乘数
         */
        set giScale(val) {
          this._giScale = val;
        }
        get giScale() {
          return this._giScale;
        }

        /**
          * @en GI sample counts
          * @zh GI 采样数量
          */
        set giSamples(val) {
          this._giSamples = val;
        }
        get giSamples() {
          return this._giSamples;
        }

        /**
          * @en light bounces
          * @zh 光照反弹次数
          */
        set bounces(val) {
          this._bounces = val;
        }
        get bounces() {
          return this._bounces;
        }

        /**
         * @en Reduce ringing of light probe
         * @zh 减少光照探针的振铃效果
         */
        set reduceRinging(val) {
          this._reduceRinging = val;
        }
        get reduceRinging() {
          return this._reduceRinging;
        }

        /**
         * @en Whether to show light probe
         * @zh 是否显示光照探针
         */
        set showProbe(val) {
          this._showProbe = val;
        }
        get showProbe() {
          return this._showProbe;
        }

        /**
         * @en Whether to show light probe's connection
         * @zh 是否显示光照探针连线
         */
        set showWireframe(val) {
          this._showWireframe = val;
        }
        get showWireframe() {
          return this._showWireframe;
        }

        /**
         * @en Whether to show light probe's convex
         * @zh 是否显示光照探针凸包
         */
        set showConvex(val) {
          this._showConvex = val;
        }
        get showConvex() {
          return this._showConvex;
        }

        /**
         * @en light probe's vertex and tetrahedron data
         * @zh 光照探针顶点及四面体数据
         */
        set data(val) {
          this._data = val;
        }
        get data() {
          return this._data;
        }

        /**
         * @en The value of all light probe sphere display size
         * @zh 光照探针全局显示大小
         */
        set lightProbeSphereVolume(val) {
          this._lightProbeSphereVolume = val;
        }
        get lightProbeSphereVolume() {
          return this._lightProbeSphereVolume;
        }
        initialize(info) {
          this._giScale = info.giScale;
          this._giSamples = info.giSamples;
          this._bounces = info.bounces;
          this._reduceRinging = info.reduceRinging;
          this._showProbe = info.showProbe;
          this._showWireframe = info.showWireframe;
          this._showConvex = info.showConvex;
          this._data = info.data;
          this._lightProbeSphereVolume = info.lightProbeSphereVolume;
        }
        empty() {
          if (!this._data) {
            return true;
          }
          return this._data.empty();
        }
      });
      cclegacy.internal.LightProbes = LightProbes;
    }
  };
});