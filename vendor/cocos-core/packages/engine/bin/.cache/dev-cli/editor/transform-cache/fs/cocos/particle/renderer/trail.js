System.register("q-bundled:///fs/cocos/particle/renderer/trail.js", ["../../core/data/decorators/index.js", "../../asset/assets/rendering-sub-mesh.js", "../../game/director.js", "../../gfx/index.js", "../../core/index.js", "../../render-scene/index.js", "../animator/curve-range.js", "../animator/gradient-range.js", "../enum.js", "../../scene-graph/node-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, serializable, range, RenderingSubMesh, director, AttributeName, BufferUsageBit, Format, FormatInfos, MemoryUsageBit, PrimitiveMode, Attribute, BufferInfo, Color, Mat4, Quat, toRadian, Vec3, Pool, warnID, cclegacy, scene, CurveRange, GradientRange, ParticleSpace, ParticleTextureMode, ParticleTrailMode, TransformBit, TrailSegment, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, PRE_TRIANGLE_INDEX, NEXT_TRIANGLE_INDEX, DIRECTION_THRESHOLD, _temp_trailEle, _temp_quat, _temp_vec3, _temp_vec3_1, _temp_color, TrailModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_assetAssetsRenderingSubMeshJs) {
      RenderingSubMesh = _assetAssetsRenderingSubMeshJs.RenderingSubMesh;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }, function (_gfxIndexJs) {
      AttributeName = _gfxIndexJs.AttributeName;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      Format = _gfxIndexJs.Format;
      FormatInfos = _gfxIndexJs.FormatInfos;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      toRadian = _coreIndexJs.toRadian;
      Vec3 = _coreIndexJs.Vec3;
      Pool = _coreIndexJs.Pool;
      warnID = _coreIndexJs.warnID;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
    }, function (_animatorGradientRangeJs) {
      GradientRange = _animatorGradientRangeJs.default;
    }, function (_enumJs) {
      ParticleSpace = _enumJs.ParticleSpace;
      ParticleTextureMode = _enumJs.ParticleTextureMode;
      ParticleTrailMode = _enumJs.ParticleTrailMode;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      PRE_TRIANGLE_INDEX = 1;
      NEXT_TRIANGLE_INDEX = 1 << 2;
      DIRECTION_THRESHOLD = Math.cos(toRadian(100));
      _temp_trailEle = {
        position: new Vec3(),
        velocity: new Vec3()
      };
      _temp_quat = new Quat();
      _temp_vec3 = new Vec3();
      _temp_vec3_1 = new Vec3();
      _temp_color = new Color(); // const barycentric = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // <wireframe debug>
      // let _bcIdx = 0; // <wireframe debug>
      // the valid element is in [start,end) range.if start equals -1,it represents the array is empty.
      TrailSegment = class TrailSegment {
        constructor(maxTrailElementNum) {
          this.start = void 0;
          this.end = void 0;
          this.trailElements = void 0;
          this.start = -1;
          this.end = -1;
          this.trailElements = [];
          while (maxTrailElementNum--) {
            this.trailElements.push({
              position: new Vec3(),
              lifetime: 0,
              width: 0,
              velocity: new Vec3(),
              direction: 0,
              color: new Color()
            });
          }
        }
        getElement(idx) {
          if (this.start === -1) {
            return null;
          }
          if (idx < 0) {
            idx = (idx + this.trailElements.length) % this.trailElements.length;
          }
          if (idx >= this.trailElements.length) {
            idx %= this.trailElements.length;
          }
          return this.trailElements[idx];
        }
        addElement() {
          if (this.trailElements.length === 0) {
            return null;
          }
          if (this.start === -1) {
            this.start = 0;
            this.end = 1;
            return this.trailElements[0];
          }
          if (this.start === this.end) {
            this.trailElements.splice(this.end, 0, {
              position: new Vec3(),
              lifetime: 0,
              width: 0,
              velocity: new Vec3(),
              direction: 0,
              color: new Color()
            });
            this.start++;
            this.start %= this.trailElements.length;
          }
          const newEleLoc = this.end++;
          this.end %= this.trailElements.length;
          return this.trailElements[newEleLoc];
        }
        iterateElement(target, f, p, dt) {
          const end = this.start >= this.end ? this.end + this.trailElements.length : this.end;
          for (let i = this.start; i < end; i++) {
            if (f(target, this.trailElements[i % this.trailElements.length], p, dt)) {
              this.start++;
              this.start %= this.trailElements.length;
            }
          }
          if (this.start === end) {
            this.start = -1;
            this.end = -1;
          }
        }
        count() {
          if (this.start < this.end) {
            return this.end - this.start;
          } else {
            return this.trailElements.length + this.end - this.start;
          }
        }
        clear() {
          this.start = -1;
          this.end = -1;
        }

        // <debug>
        // public _print () {
        //     let msg = String();
        //     this.iterateElement(this, (target: object, e: ITrailElement, p: Particle, dt: number) => {
        //         msg += 'pos:' + e.position.toString() + ' lifetime:' + e.lifetime + ' dir:' + e.direction +
        //                ' velocity:' + e.velocity.toString() + '\n';
        //         return false;
        //     }, null, 0);
        //     console.log(msg);
        // }
      };
      _export("default", TrailModule = (_dec = ccclass('cc.TrailModule'), _dec2 = displayOrder(0), _dec3 = type(ParticleTrailMode), _dec4 = displayOrder(1), _dec5 = tooltip('i18n:trailSegment.mode'), _dec6 = type(CurveRange), _dec7 = range([0, Number.POSITIVE_INFINITY]), _dec8 = displayOrder(3), _dec9 = tooltip('i18n:trailSegment.lifeTime'), _dec0 = displayOrder(5), _dec1 = tooltip('i18n:trailSegment.minParticleDistance'), _dec10 = type(ParticleSpace), _dec11 = displayOrder(6), _dec12 = tooltip('i18n:trailSegment.space'), _dec13 = type(ParticleTextureMode), _dec14 = displayOrder(8), _dec15 = tooltip('i18n:trailSegment.textureMode'), _dec16 = displayOrder(9), _dec17 = tooltip('i18n:trailSegment.widthFromParticle'), _dec18 = type(CurveRange), _dec19 = range([0, Number.POSITIVE_INFINITY]), _dec20 = displayOrder(10), _dec21 = tooltip('i18n:trailSegment.widthRatio'), _dec22 = displayOrder(11), _dec23 = tooltip('i18n:trailSegment.colorFromParticle'), _dec24 = type(GradientRange), _dec25 = displayOrder(12), _dec26 = tooltip('i18n:trailSegment.colorOverTrail'), _dec27 = type(GradientRange), _dec28 = displayOrder(13), _dec29 = tooltip('i18n:trailSegment.colorOvertime'), _dec30 = type(ParticleSpace), _dec(_class = (_class2 = class TrailModule {
        /**
         * 是否启用。
         */
        get enable() {
          return this._enable;
        }
        set enable(val) {
          if (val === this._enable && this._trailModel) {
            return;
          }
          if (val && !this._enable) {
            this._enable = val;
            if (this._particleSystem.processor) this._particleSystem.processor.updateTrailMaterial();
          }
          if (val && !this._trailModel) {
            this._createModel();
            this.rebuild();
          }
          this._enable = val;
          if (this._trailModel) {
            this._trailModel.enabled = val;
          }
          if (val) this.onEnable();else this.onDisable();
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */

        /**
         * 每个轨迹粒子之间的最小间距。
         */
        get minParticleDistance() {
          return this._minParticleDistance;
        }
        set minParticleDistance(val) {
          this._minParticleDistance = val;
          this._minSquaredDistance = val * val;
        }
        get space() {
          return this._space;
        }
        set space(val) {
          this._space = val;
          const ps = this._particleSystem;
          if (ps && ps.processor) {
            ps.processor.updateTrailMaterial();
          }
        }

        /**
         * 粒子本身是否存在。
         */

        /**
         * @en Get trail model
         * @zh 获取拖尾模型
         * @return Model of this trail and type is scene.Model
         */
        getModel() {
          return this._trailModel;
        }

        /**
         * 轨迹设定时的坐标系。
         */

        /**
         * @engineInternal
         */
        get inited() {
          return this._inited;
        }
        constructor() {
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          /**
           * 设定粒子生成轨迹的方式。
           */
          _initializerDefineProperty(this, "mode", _descriptor2, this);
          /**
           * 轨迹存在的生命周期。
           */
          _initializerDefineProperty(this, "lifeTime", _descriptor3, this);
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          _initializerDefineProperty(this, "_minParticleDistance", _descriptor4, this);
          _initializerDefineProperty(this, "existWithParticles", _descriptor5, this);
          /**
           * 设定纹理填充方式。
           */
          _initializerDefineProperty(this, "textureMode", _descriptor6, this);
          _initializerDefineProperty(this, "widthFromParticle", _descriptor7, this);
          /**
           * 控制轨迹长度的曲线。
           */
          _initializerDefineProperty(this, "widthRatio", _descriptor8, this);
          _initializerDefineProperty(this, "colorFromParticle", _descriptor9, this);
          _initializerDefineProperty(this, "colorOverTrail", _descriptor0, this);
          _initializerDefineProperty(this, "colorOvertime", _descriptor1, this);
          _initializerDefineProperty(this, "_space", _descriptor10, this);
          _initializerDefineProperty(this, "_particleSystem", _descriptor11, this);
          this._minSquaredDistance = 0;
          this._vertSize = void 0;
          this._trailNum = 0;
          this._trailLifetime = 0;
          this.vbOffset = 0;
          this.ibOffset = 0;
          this._trailSegments = null;
          this._particleTrail = void 0;
          this._trailModel = null;
          this._subMeshData = null;
          this._vertAttrs = void 0;
          this._vbF32 = null;
          this._vbUint32 = null;
          this._iBuffer = null;
          this._needTransform = false;
          this._material = null;
          this._psTransform = new Mat4();
          this._iaVertCount = 0;
          this._iaIndexCount = 0;
          this._vertAttrs = [new Attribute(AttributeName.ATTR_POSITION, Format.RGB32F),
          // xyz:position
          new Attribute(AttributeName.ATTR_TEX_COORD, Format.RGBA32F),
          // x:index y:size zw:texcoord
          // new Attribute(AttributeName.ATTR_TEX_COORD2, Format.RGB32F), // <wireframe debug>
          new Attribute(AttributeName.ATTR_TEX_COORD1, Format.RGB32F),
          // xyz:velocity
          new Attribute(AttributeName.ATTR_COLOR, Format.RGBA8, true)];
          this._vertSize = this._vertAttrs.reduce((size, attr) => size + FormatInfos[attr.format].size, 0);
          this._particleTrail = new Map();
          this._inited = false;
        }
        onInit(ps) {
          this._particleSystem = ps;
          this.minParticleDistance = this._minParticleDistance;
          let burstCount = 0;
          const psTime = ps.startLifetime.getMax();
          const psRate = ps.rateOverTime.getMax();
          const duration = ps.duration;
          for (let i = 0, len = ps.bursts.length; i < len; i++) {
            const b = ps.bursts[i];
            burstCount += b.getMaxCount(ps) * Math.ceil(psTime / duration);
          }
          if (this.lifeTime.getMax() < 1.0) {
            warnID(6036);
          }
          let pCount = psRate * duration; // potential particle count
          pCount = ps.prewarm ? pCount * 2 : pCount; // if prewarm we need double space
          pCount = pCount > ps.capacity ? ps.capacity : pCount; // max particle count is less/equal than capacity
          this._trailNum = Math.ceil(psTime * Math.ceil(this.lifeTime.getMax()) * 60 * (pCount + burstCount));
          this._trailSegments = new Pool(() => new TrailSegment(10), Math.ceil(psRate * duration), obj => {
            obj.trailElements.length = 0;
          });
          if (this._enable) {
            this.enable = this._enable;
          }
          this._inited = true;
        }
        onEnable() {
          this._attachToScene();
        }
        onDisable() {
          this._particleTrail.clear();
          this._detachFromScene();
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _attachToScene() {
          if (this._trailModel) {
            if (this._trailModel.scene) {
              this._detachFromScene();
            }
            this._particleSystem._getRenderScene().addModel(this._trailModel);
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _detachFromScene() {
          if (this._trailModel && this._trailModel.scene) {
            this._trailModel.scene.removeModel(this._trailModel);
          }
        }
        destroy() {
          this.destroySubMeshData();
          if (this._trailModel) {
            director.root.destroyModel(this._trailModel);
            this._trailModel = null;
          }
          if (this._trailSegments) {
            this._trailSegments.destroy();
            this._trailSegments = null;
          }
        }
        play() {
          if (this._trailModel && this._enable) {
            this._trailModel.enabled = true;
          }
        }
        clear() {
          if (this.enable) {
            const trailIter = this._particleTrail.values();
            let trail = trailIter.next();
            while (!trail.done) {
              trail.value.clear();
              trail = trailIter.next();
            }
            this._particleTrail.clear();
            this.updateRenderData();
            if (this._trailModel) this._trailModel.enabled = false;
          }
        }
        updateMaterial() {
          if (this._particleSystem) {
            this._material = this._particleSystem.getMaterialInstance(1) || this._particleSystem.processor.getDefaultTrailMaterial();
            if (this._trailModel) {
              this._trailModel.setSubModelMaterial(0, this._material);
            }
          }
        }
        update() {
          this._trailLifetime = this.lifeTime.evaluate(this._particleSystem.time, 1);
          if (this.space === ParticleSpace.World && this._particleSystem.simulationSpace === ParticleSpace.Local) {
            this._needTransform = true;
            this._particleSystem.node.getWorldMatrix(this._psTransform);
            this._particleSystem.node.getWorldRotation(_temp_quat);
          } else {
            this._needTransform = false;
          }
        }
        animate(p, scaledDt) {
          if (!this._trailSegments) {
            return;
          }
          if (p.loopCount > p.lastLoop) {
            if (p.trailDelay > 1) {
              p.lastLoop = p.loopCount;
              p.trailDelay = 0;
            } else {
              p.trailDelay++;
            }
            return;
          }
          let trail = this._particleTrail.get(p);
          if (!trail) {
            trail = this._trailSegments.alloc();
            this._particleTrail.set(p, trail);
            // Avoid position and trail are one frame apart at the end of the particle animation.
            return;
          }
          let lastSeg = trail.getElement(trail.end - 1);
          if (this._needTransform) {
            Vec3.transformMat4(_temp_vec3, p.position, this._psTransform);
          } else {
            Vec3.copy(_temp_vec3, p.position);
          }
          if (lastSeg) {
            trail.iterateElement(this, this._updateTrailElement, p, scaledDt);
            if (Vec3.squaredDistance(lastSeg.position, _temp_vec3) < this._minSquaredDistance) {
              return;
            }
          }
          lastSeg = trail.addElement();
          if (!lastSeg) {
            return;
          }
          Vec3.copy(lastSeg.position, _temp_vec3);
          lastSeg.lifetime = 0;
          if (this.widthFromParticle) {
            lastSeg.width = p.size.x * this.widthRatio.evaluate(0, 1);
          } else {
            lastSeg.width = this.widthRatio.evaluate(0, 1);
          }
          const trailNum = trail.count();
          if (trailNum === 2) {
            const lastSecondTrail = trail.getElement(trail.end - 2);
            Vec3.subtract(lastSecondTrail.velocity, lastSeg.position, lastSecondTrail.position);
          } else if (trailNum > 2) {
            const lastSecondTrail = trail.getElement(trail.end - 2);
            const lastThirdTrail = trail.getElement(trail.end - 3);
            Vec3.subtract(_temp_vec3, lastThirdTrail.position, lastSecondTrail.position);
            Vec3.subtract(_temp_vec3_1, lastSeg.position, lastSecondTrail.position);
            Vec3.subtract(lastSecondTrail.velocity, _temp_vec3_1, _temp_vec3);
            if (Vec3.equals(Vec3.ZERO, lastSecondTrail.velocity)) {
              Vec3.copy(lastSecondTrail.velocity, _temp_vec3);
            }
            Vec3.normalize(lastSecondTrail.velocity, lastSecondTrail.velocity);
            this._checkDirectionReverse(lastSecondTrail, lastThirdTrail);
          }
          if (this.colorFromParticle) {
            lastSeg.color.set(p.color);
          } else {
            lastSeg.color.set(this.colorOvertime.evaluate(0, 1));
          }
        }
        removeParticle(p) {
          const trail = this._particleTrail.get(p);
          if (trail && this._trailSegments) {
            trail.clear();
            this._trailSegments.free(trail);
            this._particleTrail.delete(p);
          }
        }
        updateRenderData() {
          this.vbOffset = 0;
          this.ibOffset = 0;
          for (const p of this._particleTrail.keys()) {
            const trailSeg = this._particleTrail.get(p);
            if (trailSeg.start === -1) {
              continue;
            }
            const indexOffset = this.vbOffset * 4 / this._vertSize;
            const end = trailSeg.start >= trailSeg.end ? trailSeg.end + trailSeg.trailElements.length : trailSeg.end;
            const trailNum = end - trailSeg.start;
            // const lastSegRatio = vec3.distance(trailSeg.getTailElement()!.position, p.position) / this._minParticleDistance;
            const textCoordSeg = 1 / trailNum /* - 1 + lastSegRatio */;
            const startSegEle = trailSeg.trailElements[trailSeg.start];
            this._fillVertexBuffer(startSegEle, this.colorOverTrail.evaluate(1, 1), indexOffset, 1, 0, NEXT_TRIANGLE_INDEX);
            for (let i = trailSeg.start + 1; i < end; i++) {
              const segEle = trailSeg.trailElements[i % trailSeg.trailElements.length];
              const j = i - trailSeg.start;
              this._fillVertexBuffer(segEle, this.colorOverTrail.evaluate(1 - j / trailNum, 1), indexOffset, 1 - j * textCoordSeg, j, PRE_TRIANGLE_INDEX | NEXT_TRIANGLE_INDEX);
            }
            if (this._needTransform) {
              Vec3.transformMat4(_temp_trailEle.position, p.position, this._psTransform);
            } else {
              Vec3.copy(_temp_trailEle.position, p.position);
            }

            // refresh particle node position to update emit position
            const trailModel = this._trailModel;
            if (trailModel) {
              trailModel.node.invalidateChildren(TransformBit.POSITION);
            }
            if (trailNum === 1 || trailNum === 2) {
              const lastSecondTrail = trailSeg.getElement(trailSeg.end - 1);
              Vec3.subtract(lastSecondTrail.velocity, _temp_trailEle.position, lastSecondTrail.position);
              const vbF32 = this._vbF32;
              const vbOffset = this.vbOffset;
              const vertSizeDiv4 = this._vertSize / 4;
              const lastSecondTrailVelocity = lastSecondTrail.velocity;
              vbF32[vbOffset - vertSizeDiv4 - 4] = lastSecondTrailVelocity.x;
              vbF32[vbOffset - vertSizeDiv4 - 3] = lastSecondTrailVelocity.y;
              vbF32[vbOffset - vertSizeDiv4 - 2] = lastSecondTrailVelocity.z;
              vbF32[vbOffset - 4] = lastSecondTrailVelocity.x;
              vbF32[vbOffset - 3] = lastSecondTrailVelocity.y;
              vbF32[vbOffset - 2] = lastSecondTrailVelocity.z;
              Vec3.subtract(_temp_trailEle.velocity, _temp_trailEle.position, lastSecondTrail.position);
              this._checkDirectionReverse(_temp_trailEle, lastSecondTrail);
            } else if (trailNum > 2) {
              const lastSecondTrail = trailSeg.getElement(trailSeg.end - 1);
              const lastThirdTrail = trailSeg.getElement(trailSeg.end - 2);
              Vec3.subtract(_temp_vec3, lastThirdTrail.position, lastSecondTrail.position);
              Vec3.subtract(_temp_vec3_1, _temp_trailEle.position, lastSecondTrail.position);
              Vec3.normalize(_temp_vec3, _temp_vec3);
              Vec3.normalize(_temp_vec3_1, _temp_vec3_1);
              Vec3.subtract(lastSecondTrail.velocity, _temp_vec3_1, _temp_vec3);
              Vec3.normalize(lastSecondTrail.velocity, lastSecondTrail.velocity);
              this._checkDirectionReverse(lastSecondTrail, lastThirdTrail);
              // refresh last trail segment data
              this.vbOffset -= this._vertSize / 4 * 2;
              this.ibOffset -= 6;
              // _bcIdx = (_bcIdx - 6 + 9) % 9;  // <wireframe debug>
              this._fillVertexBuffer(lastSecondTrail, this.colorOverTrail.evaluate(textCoordSeg, 1), indexOffset, textCoordSeg, trailNum - 1, PRE_TRIANGLE_INDEX | NEXT_TRIANGLE_INDEX);
              Vec3.subtract(_temp_trailEle.velocity, _temp_trailEle.position, lastSecondTrail.position);
              Vec3.normalize(_temp_trailEle.velocity, _temp_trailEle.velocity);
              this._checkDirectionReverse(_temp_trailEle, lastSecondTrail);
            }
            if (this.widthFromParticle) {
              _temp_trailEle.width = p.size.x * this.widthRatio.evaluate(0, 1);
            } else {
              _temp_trailEle.width = this.widthRatio.evaluate(0, 1);
            }
            _temp_trailEle.color = p.color;
            if (Vec3.equals(_temp_trailEle.velocity, Vec3.ZERO)) {
              this.ibOffset -= 3;
            } else {
              this._fillVertexBuffer(_temp_trailEle, this.colorOverTrail.evaluate(0, 1), indexOffset, 0, trailNum, PRE_TRIANGLE_INDEX);
            }
          }
          if (this._trailModel) {
            this._trailModel.enabled = this.ibOffset > 0;
          }
        }
        updateIA(count) {
          const subModels = this._trailModel && this._trailModel.subModels;
          if (subModels && subModels.length > 0) {
            const subModel = subModels[0];
            subModel.inputAssembler.vertexBuffers[0].update(this._vbF32);
            subModel.inputAssembler.indexBuffer.update(this._iBuffer);
            subModel.inputAssembler.firstIndex = 0;
            subModel.inputAssembler.indexCount = count;
            subModel.inputAssembler.vertexCount = this._iaVertCount;
          }
        }
        beforeRender() {
          this.updateIA(this.ibOffset);
        }
        _createModel() {
          if (this._trailModel) {
            return;
          }
          this._trailModel = cclegacy.director.root.createModel(scene.Model);
        }
        rebuild() {
          const self = this;
          const device = director.root.device;
          const vertexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, self._vertSize * (self._trailNum + 1) * 2, self._vertSize));
          const vBuffer = new ArrayBuffer(self._vertSize * (self._trailNum + 1) * 2);
          self._vbF32 = new Float32Array(vBuffer);
          self._vbUint32 = new Uint32Array(vBuffer);
          vertexBuffer.update(vBuffer);
          const indexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, Math.max(1, self._trailNum) * 6 * Uint16Array.BYTES_PER_ELEMENT, Uint16Array.BYTES_PER_ELEMENT));
          self._iBuffer = new Uint16Array(Math.max(1, self._trailNum) * 6);
          indexBuffer.update(self._iBuffer);
          self._iaVertCount = (self._trailNum + 1) * 2;
          self._iaIndexCount = self._trailNum * 6;
          self._subMeshData = new RenderingSubMesh([vertexBuffer], self._vertAttrs, PrimitiveMode.TRIANGLE_LIST, indexBuffer);
          const trailModel = self._trailModel;
          if (trailModel && self._material) {
            trailModel.node = trailModel.transform = self._particleSystem.node;
            trailModel.visFlags = self._particleSystem.visibility;
            trailModel.initSubModel(0, self._subMeshData, self._material);
            trailModel.enabled = true;
          }
        }
        _updateTrailElement(module, trailEle, p, dt) {
          trailEle.lifetime += dt;
          if (module.colorFromParticle) {
            trailEle.color.set(p.color);
            trailEle.color.multiply(module.colorOvertime.evaluate(1.0 - p.remainingLifetime / p.startLifetime, 1));
          } else {
            trailEle.color.set(module.colorOvertime.evaluate(1.0 - p.remainingLifetime / p.startLifetime, 1));
          }
          if (module.widthFromParticle) {
            trailEle.width = p.size.x * module.widthRatio.evaluate(trailEle.lifetime / module._trailLifetime, 1);
          } else {
            trailEle.width = module.widthRatio.evaluate(trailEle.lifetime / module._trailLifetime, 1);
          }
          return trailEle.lifetime > module._trailLifetime;
        }
        _fillVertexBuffer(trailSeg, colorModifer, indexOffset, xTexCoord, trailEleIdx, indexSet) {
          this._vbF32[this.vbOffset++] = trailSeg.position.x;
          this._vbF32[this.vbOffset++] = trailSeg.position.y;
          this._vbF32[this.vbOffset++] = trailSeg.position.z;
          this._vbF32[this.vbOffset++] = trailSeg.direction;
          this._vbF32[this.vbOffset++] = trailSeg.width;
          this._vbF32[this.vbOffset++] = xTexCoord;
          this._vbF32[this.vbOffset++] = 0;
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];  // <wireframe debug>
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];
          // _bcIdx %= 9;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.x;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.y;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.z;
          _temp_color.set(trailSeg.color);
          _temp_color.multiply(colorModifer);
          this._vbUint32[this.vbOffset++] = Color.toUint32(_temp_color);
          this._vbF32[this.vbOffset++] = trailSeg.position.x;
          this._vbF32[this.vbOffset++] = trailSeg.position.y;
          this._vbF32[this.vbOffset++] = trailSeg.position.z;
          this._vbF32[this.vbOffset++] = 1 - trailSeg.direction;
          this._vbF32[this.vbOffset++] = trailSeg.width;
          this._vbF32[this.vbOffset++] = xTexCoord;
          this._vbF32[this.vbOffset++] = 1;
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];  // <wireframe debug>
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];
          // this._vbF32![this.vbOffset++] = barycentric[_bcIdx++];
          // _bcIdx %= 9;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.x;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.y;
          this._vbF32[this.vbOffset++] = trailSeg.velocity.z;
          this._vbUint32[this.vbOffset++] = Color.toUint32(_temp_color);
          if (indexSet & PRE_TRIANGLE_INDEX) {
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx;
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx - 1;
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx + 1;
          }
          if (indexSet & NEXT_TRIANGLE_INDEX) {
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx;
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx + 1;
            this._iBuffer[this.ibOffset++] = indexOffset + 2 * trailEleIdx + 2;
          }
        }
        _checkDirectionReverse(currElement, prevElement) {
          if (Vec3.dot(currElement.velocity, prevElement.velocity) < DIRECTION_THRESHOLD) {
            currElement.direction = 1 - prevElement.direction;
          } else {
            currElement.direction = prevElement.direction;
          }
        }
        destroySubMeshData() {
          if (this._subMeshData) {
            this._subMeshData.destroy();
            this._subMeshData = null;
          }
        }

        // <debug use>
        // private _printVB() {
        //     let log = new String();
        //     for (let i = 0; i < this.vbOffset; i++) {
        //         log += 'pos:' + this._vbF32![i++].toFixed(2) + ',' + this._vbF32![i++].toFixed(2) + ',' +
        //                this._vbF32![i++].toFixed(2) + ' dir:' + this._vbF32![i++].toFixed(0) + ' ';
        //         i += 6;
        //         log += 'vel:' + this._vbF32![i++].toFixed(2) + ',' + this._vbF32![i++].toFixed(2) + ',' + this._vbF32![i++].toFixed(2) + '\n';
        //     }
        //     if (log.length > 0) {
        //         console.log(log);
        //     }
        // }
      }, _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "mode", [_dec3, serializable, _dec4, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleTrailMode.Particles;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "lifeTime", [_dec6, serializable, _dec7, _dec8, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_minParticleDistance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "minParticleDistance", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "minParticleDistance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "space", [_dec10, _dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "space"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "existWithParticles", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "textureMode", [_dec13, serializable, _dec14, _dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleTextureMode.Stretch;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "widthFromParticle", [serializable, _dec16, _dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "widthRatio", [_dec18, serializable, _dec19, _dec20, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "colorFromParticle", [serializable, _dec22, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "colorOverTrail", [_dec24, serializable, _dec25, _dec26], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new GradientRange();
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "colorOvertime", [_dec27, serializable, _dec28, _dec29], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new GradientRange();
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_space", [_dec30], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleSpace.World;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_particleSystem", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
    }
  };
});