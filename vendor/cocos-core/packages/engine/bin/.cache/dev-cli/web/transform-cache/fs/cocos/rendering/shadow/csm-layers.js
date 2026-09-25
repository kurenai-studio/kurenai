System.register("q-bundled:///fs/cocos/rendering/shadow/csm-layers.js", ["../../render-scene/scene/shadows.js", "../../core/math/index.js", "../../core/geometry/index.js", "../../core/memop/cached-array.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var CSMLevel, CSMOptimizationMode, Mat4, Vec3, Vec2, Vec4, Frustum, AABB, CachedArray, cclegacy, ShadowLayerVolume, CSMShadowLayer, CSMLayers, _mat4Trans, _matShadowTrans, _matShadowView, _matShadowProj, _matShadowViewProj, _matShadowViewProjArbitaryPos, _matShadowViewProjArbitaryPosInv, _focus, _projPos, _texelSize, _projSnap, _snap, _maxVec3, _minVec3, _shadowPos, _maxLayerPosz, _maxLayerFarPlane;
  _export({
    ShadowLayerVolume: void 0,
    CSMShadowLayer: void 0,
    CSMLayers: void 0
  });
  return {
    setters: [function (_renderSceneSceneShadowsJs) {
      CSMLevel = _renderSceneSceneShadowsJs.CSMLevel;
      CSMOptimizationMode = _renderSceneSceneShadowsJs.CSMOptimizationMode;
    }, function (_coreMathIndexJs) {
      Mat4 = _coreMathIndexJs.Mat4;
      Vec3 = _coreMathIndexJs.Vec3;
      Vec2 = _coreMathIndexJs.Vec2;
      Vec4 = _coreMathIndexJs.Vec4;
    }, function (_coreGeometryIndexJs) {
      Frustum = _coreGeometryIndexJs.Frustum;
      AABB = _coreGeometryIndexJs.AABB;
    }, function (_coreMemopCachedArrayJs) {
      CachedArray = _coreMemopCachedArrayJs.CachedArray;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      _mat4Trans = new Mat4();
      _matShadowTrans = new Mat4();
      _matShadowView = new Mat4();
      _matShadowProj = new Mat4();
      _matShadowViewProj = new Mat4();
      _matShadowViewProjArbitaryPos = new Mat4();
      _matShadowViewProjArbitaryPosInv = new Mat4();
      _focus = new Vec3(0, 0, 0);
      _projPos = new Vec3();
      _texelSize = new Vec2();
      _projSnap = new Vec3();
      _snap = new Vec3();
      _maxVec3 = new Vec3(10000000, 10000000, 10000000);
      _minVec3 = new Vec3(-10000000, -10000000, -10000000);
      _shadowPos = new Vec3();
      _maxLayerPosz = 0.0;
      _maxLayerFarPlane = 0.0;
      _export("ShadowLayerVolume", ShadowLayerVolume = class ShadowLayerVolume {
        constructor(level) {
          this._shadowObjects = [];
          this._shadowCameraFar = 0;
          this._matShadowView = new Mat4();
          this._matShadowProj = new Mat4();
          this._matShadowViewProj = new Mat4();
          this._validFrustum = new Frustum();
          // geometry renderer value
          this._splitFrustum = new Frustum();
          this._lightViewFrustum = new Frustum();
          this._castLightViewBoundingBox = new AABB();
          this._level = level;
          this._validFrustum.accurate = true;
          this._splitFrustum.accurate = true;
          this._lightViewFrustum.accurate = true;
        }
        get level() {
          return this._level;
        }
        get shadowObjects() {
          return this._shadowObjects;
        }
        get shadowCameraFar() {
          return this._shadowCameraFar;
        }
        set shadowCameraFar(val) {
          this._shadowCameraFar = val;
        }
        get matShadowView() {
          return this._matShadowView;
        }
        set matShadowView(val) {
          this._matShadowView = val;
        }
        get matShadowProj() {
          return this._matShadowProj;
        }
        set matShadowProj(val) {
          this._matShadowProj = val;
        }
        get matShadowViewProj() {
          return this._matShadowViewProj;
        }
        set matShadowViewProj(val) {
          this._matShadowViewProj = val;
        }
        get validFrustum() {
          return this._validFrustum;
        }
        get splitFrustum() {
          return this._splitFrustum;
        }
        get lightViewFrustum() {
          return this._lightViewFrustum;
        }
        get castLightViewBoundingBox() {
          return this._castLightViewBoundingBox;
        }
        copyToValidFrustum(validFrustum) {
          Frustum.copy(this._validFrustum, validFrustum);
        }
        calculateValidFrustumOrtho(width, height, near, far, transform) {
          Frustum.createOrtho(this._validFrustum, width, height, near, far, transform);
        }
        calculateSplitFrustum(camera, m, start, end) {
          this._splitFrustum.split(start, end, camera.aspect, camera.fov, m);
        }
        destroy() {
          this._shadowObjects.length = 0;
        }
        createMatrix(dirLight, shadowMapWidth, onlyForCulling) {
          const device = cclegacy.director.root.device;
          const invisibleOcclusionRange = dirLight.shadowInvisibleOcclusionRange;
          Frustum.copy(this._lightViewFrustum, this._splitFrustum);

          // view matrix with range back
          Mat4.fromRT(_matShadowTrans, dirLight.node.rotation, _focus);
          Mat4.invert(_matShadowView, _matShadowTrans);
          const shadowViewArbitaryPos = _matShadowView.clone();
          this._lightViewFrustum.transform(_matShadowView);

          // bounding box in light space
          AABB.fromPoints(this._castLightViewBoundingBox, _maxVec3, _minVec3);
          this._castLightViewBoundingBox.mergeFrustum(this._lightViewFrustum);
          let orthoSizeWidth;
          let orthoSizeHeight;
          if (dirLight.csmOptimizationMode === CSMOptimizationMode.DisableRotationFix) {
            orthoSizeWidth = this._castLightViewBoundingBox.halfExtents.x * 2.0;
            orthoSizeHeight = this._castLightViewBoundingBox.halfExtents.y * 2.0;
          } else {
            orthoSizeWidth = orthoSizeHeight = Vec3.distance(this._lightViewFrustum.vertices[0], this._lightViewFrustum.vertices[6]);
          }
          const csmLevel = cclegacy.director.root.pipeline.pipelineSceneData.csmSupported ? dirLight.csmLevel : 1;
          if (csmLevel > 1 && dirLight.csmOptimizationMode === CSMOptimizationMode.RemoveDuplicates) {
            if (this._level >= csmLevel - 1) {
              _maxLayerFarPlane = this._castLightViewBoundingBox.halfExtents.z;
              _maxLayerPosz = this._castLightViewBoundingBox.center.z;
            } else {
              const alignFarPlaneDist = Math.abs(this._castLightViewBoundingBox.center.z - _maxLayerPosz) + _maxLayerFarPlane;
              this._castLightViewBoundingBox.halfExtents.z = Math.max(this._castLightViewBoundingBox.center.z, alignFarPlaneDist);
            }
          }
          const r = this._castLightViewBoundingBox.halfExtents.z;
          this._shadowCameraFar = r * 2 + invisibleOcclusionRange;
          const center = this._castLightViewBoundingBox.center;
          _shadowPos.set(center.x, center.y, center.z + r + invisibleOcclusionRange);
          Vec3.transformMat4(_shadowPos, _shadowPos, _matShadowTrans);
          Mat4.fromRT(_matShadowTrans, dirLight.node.rotation, _shadowPos);
          Mat4.invert(_matShadowView, _matShadowTrans);
          if (!onlyForCulling) {
            // snap to whole texels
            const halfOrthoSizeWidth = orthoSizeWidth * 0.5;
            const halfOrthoSizeHeight = orthoSizeHeight * 0.5;
            Mat4.ortho(_matShadowProj, -halfOrthoSizeWidth, halfOrthoSizeWidth, -halfOrthoSizeHeight, halfOrthoSizeHeight, 0.1, this._shadowCameraFar, device.capabilities.clipSpaceMinZ, device.capabilities.clipSpaceSignY);
            Mat4.multiply(_matShadowViewProjArbitaryPos, _matShadowProj, shadowViewArbitaryPos);
            Vec3.transformMat4(_projPos, _shadowPos, _matShadowViewProjArbitaryPos);
            const invActualSize = 2.0 / shadowMapWidth;
            _texelSize.set(invActualSize, invActualSize);
            const modX = _projPos.x % _texelSize.x;
            const modY = _projPos.y % _texelSize.y;
            _projSnap.set(_projPos.x - modX, _projPos.y - modY, _projPos.z);
            Mat4.invert(_matShadowViewProjArbitaryPosInv, _matShadowViewProjArbitaryPos);
            Vec3.transformMat4(_snap, _projSnap, _matShadowViewProjArbitaryPosInv);
            Mat4.fromRT(_matShadowTrans, dirLight.node.rotation, _snap);
            Mat4.invert(_matShadowView, _matShadowTrans);

            // fill data
            Mat4.multiply(_matShadowViewProj, _matShadowProj, _matShadowView);
            Mat4.copy(this._matShadowView, _matShadowView);
            Mat4.copy(this._matShadowProj, _matShadowProj);
            Mat4.copy(this._matShadowViewProj, _matShadowViewProj);
          }
          Frustum.createOrtho(this._validFrustum, orthoSizeWidth, orthoSizeHeight, 0.1, this._shadowCameraFar, _matShadowTrans);
        }
      });
      _export("CSMShadowLayer", CSMShadowLayer = class CSMShadowLayer extends ShadowLayerVolume {
        constructor(level) {
          super(level);
          this._splitCameraNear = 0;
          this._splitCameraFar = 0;
          this._csmAtlas = new Vec4();
          this._calculateAtlas(level);
        }
        get splitCameraNear() {
          return this._splitCameraNear;
        }
        set splitCameraNear(val) {
          this._splitCameraNear = val;
        }
        get splitCameraFar() {
          return this._splitCameraFar;
        }
        set splitCameraFar(val) {
          this._splitCameraFar = val;
        }
        get csmAtlas() {
          return this._csmAtlas;
        }
        set csmAtlas(val) {
          this._csmAtlas = val;
        }
        destroy() {
          super.destroy();
        }
        _calculateAtlas(level) {
          const clipSpaceSignY = cclegacy.director.root.device.capabilities.clipSpaceSignY;
          const x = level % 2 - 0.5;
          const y = (0.5 - Math.floor(level / 2)) * clipSpaceSignY;
          this._csmAtlas.set(0.5, 0.5, x, y);
        }
      });
      /**
       * @en Shadow CSM layer manager
       * @zh CSM阴影图层管理
       */
      _export("CSMLayers", CSMLayers = class CSMLayers {
        get castShadowObjects() {
          return this._castShadowObjects;
        }
        get layerObjects() {
          return this._layerObjects;
        }
        get layers() {
          return this._layers;
        }
        get specialLayer() {
          return this._specialLayer;
        }
        constructor() {
          this._castShadowObjects = [];
          this._layerObjects = new CachedArray(64);
          this._layers = [];
          // LevelCount is a scalar, Indicates the number.
          this._levelCount = 0;
          // The ShadowTransformInfo object for 'fixed area shadow' || 'maximum clipping info' || 'CSM layers = 1'.
          this._specialLayer = new ShadowLayerVolume(1);
          this._shadowDistance = 0;
          for (let i = 0; i < CSMLevel.LEVEL_4; i++) {
            this._layers[i] = new CSMShadowLayer(i);
          }
        }
        update(sceneData, camera) {
          const scene = camera.scene;
          const dirLight = scene.mainLight;
          if (dirLight === null) {
            return;
          }
          const shadowInfo = sceneData.shadows;
          const levelCount = cclegacy.director.root.pipeline.pipelineSceneData.csmSupported ? dirLight.csmLevel : 1;
          const shadowDistance = dirLight.shadowDistance;
          if (!shadowInfo.enabled || !dirLight.shadowEnabled) {
            return;
          }
          if (dirLight.shadowFixedArea) {
            this._updateFixedArea(dirLight);
          } else {
            if (dirLight.csmNeedUpdate || this._levelCount !== levelCount || this._shadowDistance !== shadowDistance) {
              this._splitFrustumLevels(dirLight);
              this._levelCount = levelCount;
              this._shadowDistance = shadowDistance;
            }
            this._calculateCSM(camera, dirLight, shadowInfo);
          }
        }
        destroy() {
          this._castShadowObjects.length = 0;
          for (let i = 0; i < this._layers.length; i++) {
            this._layers[i].destroy();
          }
          this._layers.length = 0;
        }
        _updateFixedArea(dirLight) {
          const device = cclegacy.director.root.device;
          const x = dirLight.shadowOrthoSize;
          const y = dirLight.shadowOrthoSize;
          const near = dirLight.shadowNear;
          const far = dirLight.shadowFar;
          Mat4.fromRT(_matShadowTrans, dirLight.node.worldRotation, dirLight.node.worldPosition);
          Mat4.invert(_matShadowView, _matShadowTrans);
          Mat4.ortho(_matShadowProj, -x, x, -y, y, near, far, device.capabilities.clipSpaceMinZ, device.capabilities.clipSpaceSignY);
          Mat4.multiply(_matShadowViewProj, _matShadowProj, _matShadowView);
          this._specialLayer.matShadowView = _matShadowView;
          this._specialLayer.matShadowProj = _matShadowProj;
          this._specialLayer.matShadowViewProj = _matShadowViewProj;
          this._specialLayer.calculateValidFrustumOrtho(x * 2.0, y * 2.0, near, far, _matShadowTrans);
        }
        _splitFrustumLevels(dirLight) {
          const nd = 0.1;
          const fd = dirLight.shadowDistance;
          const ratio = fd / nd;
          const level = cclegacy.director.root.pipeline.pipelineSceneData.csmSupported ? dirLight.csmLevel : 1;
          const lambda = dirLight.csmLayerLambda;
          this._layers[0].splitCameraNear = nd;
          for (let i = 1; i < level; i++) {
            // i ÷ numbers of level
            const si = i / level;
            // eslint-disable-next-line no-restricted-properties
            const preNear = lambda * (nd * ratio ** si) + (1 - lambda) * (nd + (fd - nd) * si);
            // Slightly increase the overlap to avoid fracture
            const nextFar = preNear * 1.005;
            this._layers[i].splitCameraNear = preNear;
            this._layers[i - 1].splitCameraFar = nextFar;
          }
          // numbers of level - 1
          this._layers[level - 1].splitCameraFar = fd;
          dirLight.csmNeedUpdate = false;
        }
        _calculateCSM(camera, dirLight, shadowInfo) {
          const level = cclegacy.director.root.pipeline.pipelineSceneData.csmSupported ? dirLight.csmLevel : 1;
          const shadowMapWidth = level > 1 ? shadowInfo.size.x * 0.5 : shadowInfo.size.x;
          if (shadowMapWidth < 0.0) {
            return;
          }
          this._getCameraWorldMatrix(_mat4Trans, camera);
          for (let i = level - 1; i >= 0; i--) {
            const csmLayer = this._layers[i];
            const near = csmLayer.splitCameraNear;
            const far = csmLayer.splitCameraFar;
            csmLayer.calculateSplitFrustum(camera, _mat4Trans, near, far);
            csmLayer.createMatrix(dirLight, shadowMapWidth, false);
          }
          if (level === CSMLevel.LEVEL_1) {
            this._specialLayer.shadowCameraFar = this._layers[0].shadowCameraFar;
            Mat4.copy(this._specialLayer.matShadowView, this._layers[0].matShadowView);
            Mat4.copy(this._specialLayer.matShadowProj, this._layers[0].matShadowProj);
            Mat4.copy(this._specialLayer.matShadowViewProj, this._layers[0].matShadowViewProj);
            this._specialLayer.copyToValidFrustum(this._layers[0].validFrustum);
          } else {
            this._specialLayer.calculateSplitFrustum(camera, _mat4Trans, 0.1, dirLight.shadowDistance);
            this._specialLayer.createMatrix(dirLight, shadowMapWidth, true);
          }
        }
        _getCameraWorldMatrix(out, camera) {
          if (!camera.node) {
            return;
          }
          const cameraNode = camera.node;
          const position = cameraNode.worldPosition;
          const rotation = cameraNode.worldRotation;
          Mat4.fromRT(out, rotation, position);
        }
      });
    }
  };
});