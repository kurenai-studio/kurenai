System.register("q-bundled:///fs/cocos/physics/bullet/character-controllers/bullet-capsule-character-controller.js", ["../../../core/index.js", "../../framework/index.js", "./bullet-character-controller.js", "../../../core/utils/misc.js", "../instantiated.js", "../bullet-cache.js", "../bullet-env.js"], function (_export, _context) {
  "use strict";

  var Vec3, absMax, PhysicsSystem, BulletCharacterController, degreesToRadians, bt, BulletCache, importFunc, BulletCapsuleCharacterController, v3_0;
  _export("BulletCapsuleCharacterController", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      absMax = _coreIndexJs.absMax;
    }, function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_bulletCharacterControllerJs) {
      BulletCharacterController = _bulletCharacterControllerJs.BulletCharacterController;
    }, function (_coreUtilsMiscJs) {
      degreesToRadians = _coreUtilsMiscJs.degreesToRadians;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
    }, function (_bulletCacheJs) {
      BulletCache = _bulletCacheJs.BulletCache;
    }, function (_bulletEnvJs) {
      importFunc = _bulletEnvJs.importFunc;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      v3_0 = new Vec3(0, 0, 0);
      /** @mangle */
      _export("BulletCapsuleCharacterController", BulletCapsuleCharacterController = class BulletCapsuleCharacterController extends BulletCharacterController {
        get component() {
          return this._comp;
        }
        onComponentSet() {
          this.component.node.getWorldPosition(v3_0);
          v3_0.add(this.scaledCenter);
          const pos = BulletCache.instance.BT_V3_0;
          bt.Vec3_set(pos, v3_0.x, v3_0.y, v3_0.z);
          const upDir = Vec3.UNIT_Y;
          const up = BulletCache.instance.BT_V3_1;
          bt.Vec3_set(up, upDir.x, upDir.y, upDir.z);
          const report = bt.ControllerHitReport.implement(importFunc).$$.ptr;
          const bulletWorld = PhysicsSystem.instance.physicsWorld;
          const controllerDesc = bt.CapsuleCharacterControllerDesc_new(degreesToRadians(this.component.slopeLimit), this.component.stepOffset, this.component.skinWidth, up, pos, report,
          //btUserControllerHitReport
          this.component.radius, this.component.height);
          this._impl = bt.CapsuleCharacterController_new(bulletWorld.impl, controllerDesc, 0 /*?*/);
          this.updateScale();
        }
        setRadius(value) {
          this.updateScale();
        }
        setHeight(value) {
          this.updateScale();
        }
        updateScale() {
          this.updateGeometry();
        }
        updateGeometry() {
          const ws = this.component.node.worldScale;
          const r = this.component.radius * absMax(ws.x, ws.z);
          const h = this.component.height * Math.abs(ws.y);
          bt.CapsuleCharacterController_setRadius(this.impl, r);
          bt.CapsuleCharacterController_setHeight(this.impl, h);
          this._dirty = true;
        }
      });
    }
  };
});