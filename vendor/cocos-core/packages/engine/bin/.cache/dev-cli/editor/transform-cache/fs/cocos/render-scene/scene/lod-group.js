System.register("q-bundled:///fs/cocos/render-scene/scene/lod-group.js", ["../../core/index.js", "../../gfx/index.js", "./camera.js"], function (_export, _context) {
  "use strict";

  var Vec3, assertIsTrue, v3, deviceManager, CameraProjection, LODData, LODGroup;
  _export({
    LODData: void 0,
    LODGroup: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      v3 = _coreIndexJs.v3;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_cameraJs) {
      CameraProjection = _cameraJs.CameraProjection;
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
      /**
       * @engineInternal
       * @mangle
       */
      _export("LODData", LODData = class LODData {
        constructor() {
          // Range in [0, 1].
          this.screenUsagePercentage = 1.0;
          this._models = [];
        }
        get models() {
          return this._models;
        }
        addModel(model) {
          this._models.splice(0, 0, model);
        }
        eraseModel(model) {
          const removeIndex = this._models.indexOf(model);
          if (removeIndex >= 0) {
            this._models.splice(removeIndex, 1);
          }
        }
        clearModels() {
          this._models.length = 0;
        }
      });
      /**
       * @engineInternal
       * @mangle
       */
      _export("LODGroup", LODGroup = class LODGroup {
        constructor() {
          this.scene = void 0;
          this.node = null;
          this.enabled = true;
          this._localBoundaryCenter = v3(0, 0, 0);
          /**
           * @en Object Size in local space, may be auto-calculated value from object bounding box or value from user input.
          */
          this._objectSize = 1;
          /**
           *@en The array of LODs
           */
          this._lodDataArray = [];
          /**
           * For editor only, users maybe operate several LOD's object
           */
          this._lockedLODLevelVec = [];
          this._isLockLevelChanged = false;
          this._device = deviceManager.gfxDevice;
        }
        set localBoundaryCenter(val) {
          this._localBoundaryCenter.set(val);
        }
        get localBoundaryCenter() {
          return this._localBoundaryCenter.clone();
        }
        get lodCount() {
          return this._lodDataArray.length;
        }
        set objectSize(val) {
          this._objectSize = val;
        }
        get objectSize() {
          return this._objectSize;
        }
        get lodDataArray() {
          return this._lodDataArray;
        }
        attachToScene(scene) {
          this.scene = scene;
        }
        detachFromScene() {
          this.scene = null;
        }
        lockLODLevels(lockLev) {
          if (lockLev.length !== this._lockedLODLevelVec.length) {
            this._isLockLevelChanged = true;
          } else {
            const size = lockLev.length;
            let index = 0;
            for (; index < size; index++) {
              if (lockLev[index] !== this._lockedLODLevelVec[index]) {
                this._isLockLevelChanged = true;
                break;
              }
            }
          }
          this._lockedLODLevelVec = lockLev.slice();
        }
        isLockLevelChanged() {
          return this._isLockLevelChanged;
        }
        resetLockChangeFlag() {
          this._isLockLevelChanged = false;
        }
        getLockedLODLevels() {
          return this._lockedLODLevelVec;
        }
        clearLODs() {
          this._lodDataArray.length = 0;
        }
        insertLOD(index, lod) {
          this._lodDataArray.splice(index, 0, lod);
        }
        updateLOD(index, lod) {
          this._lodDataArray[index] = lod;
        }
        eraseLOD(index) {
          this._lodDataArray.splice(index, 1);
        }

        /**
         *
         * @param camera current perspective camera
         * @returns visible LOD index in lodGroup
         */
        getVisibleLODLevel(camera) {
          const screenUsagePercentage = this.getScreenUsagePercentage(camera);
          let lodIndex = -1;
          for (let i = 0; i < this.lodCount; ++i) {
            const lod = this.lodDataArray[i];
            if (screenUsagePercentage >= lod.screenUsagePercentage) {
              lodIndex = i;
              break;
            }
          }
          return lodIndex;
        }

        /**
         *
         * @param camera current perspective camera
         * @returns height of current lod group relative to camera position in screen space, aka. relativeHeight
         */
        getScreenUsagePercentage(camera) {
          if (!this.node) return 0;
          let distance;
          if (camera.projectionType === CameraProjection.PERSPECTIVE) {
            distance = Vec3.len(this.localBoundaryCenter.transformMat4(this.node.worldMatrix).subtract(camera.node.worldPosition));
          }
          return this.distanceToScreenUsagePercentage(camera, distance, this.getWorldSpaceSize());
        }
        distanceToScreenUsagePercentage(camera, distance, size) {
          if (camera.projectionType === CameraProjection.PERSPECTIVE) {
            assertIsTrue(typeof distance === 'number', 'distance must be present for perspective projection');
            return size * camera.matProj.m05 / (distance * 2.0); // note: matProj.m11 is 1 / tan(fov / 2.0)
          } else {
            return size * camera.matProj.m05 * 0.5;
          }
        }
        getWorldSpaceSize() {
          const scale = this.node.scale;
          const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
          return maxScale * this.objectSize;
        }
      });
    }
  };
});