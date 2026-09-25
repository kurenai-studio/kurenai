System.register("q-bundled:///fs/cocos/physics/physx/shapes/physx-terrain-shape.js", ["../physx-adapter.js", "../physx-instance.js", "./physx-shape.js"], function (_export, _context) {
  "use strict";

  var createHeightField, createHeightFieldGeometry, getTempTransform, PX, PhysXInstance, EPhysXShapeType, PhysXShape, PhysXTerrainShape;
  _export("PhysXTerrainShape", void 0);
  return {
    setters: [function (_physxAdapterJs) {
      createHeightField = _physxAdapterJs.createHeightField;
      createHeightFieldGeometry = _physxAdapterJs.createHeightFieldGeometry;
      getTempTransform = _physxAdapterJs.getTempTransform;
      PX = _physxAdapterJs.PX;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_physxShapeJs) {
      EPhysXShapeType = _physxShapeJs.EPhysXShapeType;
      PhysXShape = _physxShapeJs.PhysXShape;
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
      /** @mangle */
      _export("PhysXTerrainShape", PhysXTerrainShape = class PhysXTerrainShape extends PhysXShape {
        constructor() {
          super(EPhysXShapeType.TERRAIN);
        }
        setTerrain(v) {
          if (v && this._impl == null) {
            const physics = PhysXInstance.physics;
            const collider = this.collider;
            if (PX.TERRAIN_STATIC[v._uuid] == null) {
              const cooking = PhysXInstance.cooking;
              PX.TERRAIN_STATIC[v._uuid] = createHeightField(v, PhysXTerrainShape.heightScale, cooking, physics);
            }
            const hf = PX.TERRAIN_STATIC[v._uuid];
            const pxmat = this.getSharedMaterial(collider.sharedMaterial);
            const geometry = createHeightFieldGeometry(hf, 0, PhysXTerrainShape.heightScale, v.tileSize, v.tileSize);
            this._impl = physics.createShape(geometry, pxmat, true, this._flags);
            this.updateByReAdd();
          }
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this.setTerrain(this.collider.terrain);
        }
        updateScale() {
          this.setCenter(this._collider.center);
        }

        /* override */

        setCenter(v) {
          if (this._impl) this._impl.setLocalPose(getTempTransform(v, this._rotation));
        }
        setMaterial(v) {
          if (this._impl) super.setMaterial(v);
        }
        setAsTrigger(v) {
          if (this._impl) super.setAsTrigger(v);
        }
        setFilerData(v) {
          if (this._impl) super.setFilerData(v);
        }
        addToBody() {
          if (this._impl) super.addToBody();
        }
        removeFromBody() {
          if (this._impl) super.removeFromBody();
        }
      });
      PhysXTerrainShape.heightScale = 1 / 512;
    }
  };
});