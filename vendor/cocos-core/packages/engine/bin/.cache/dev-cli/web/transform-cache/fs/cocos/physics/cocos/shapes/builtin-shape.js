System.register("q-bundled:///fs/cocos/physics/cocos/shapes/builtin-shape.js", ["../../../core/index.js", "../../../../exports/physics-framework.js"], function (_export, _context) {
  "use strict";

  var Vec3, PhysicsSystem, BuiltinShape;
  _export("BuiltinShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_exportsPhysicsFrameworkJs) {
      PhysicsSystem = _exportsPhysicsFrameworkJs.PhysicsSystem;
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
      _export("BuiltinShape", BuiltinShape = class BuiltinShape {
        constructor() {
          this.id = BuiltinShape.idCounter++;
          this._sharedBody = void 0;
          this._collider = void 0;
          this._localShape = void 0;
          this._worldShape = void 0;
        }
        getAABB(v) {}
        getBoundingSphere(v) {}
        updateEventListener() {}
        setMaterial(v) {}
        setAsTrigger(v) {}
        get attachedRigidBody() {
          return null;
        }
        setCenter(v) {
          Vec3.copy(this._localShape.center, v);
        }
        get localShape() {
          return this._localShape;
        }
        get worldShape() {
          return this._worldShape;
        }
        get impl() {
          return this._worldShape;
        }
        get sharedBody() {
          return this._sharedBody;
        }
        get collider() {
          return this._collider;
        }

        /** id generator */

        initialize(comp) {
          this._collider = comp;
          this._sharedBody = PhysicsSystem.instance.physicsWorld.getSharedBody(this._collider.node);
          this._sharedBody.reference = true;
        }
        onLoad() {
          this.setCenter(this._collider.center);
        }
        onEnable() {
          this._sharedBody.addShape(this);
          this._sharedBody.enabled = true;
        }
        onDisable() {
          this._sharedBody.removeShape(this);
          this._sharedBody.enabled = false;
        }
        onDestroy() {
          this._sharedBody.reference = false;
          this._collider = null;
          this._localShape = null;
          this._worldShape = null;
        }
        transform(m, pos, rot, scale) {
          this._localShape.transform(m, pos, rot, scale, this._worldShape);
        }

        /** group */
        getGroup() {
          return this._sharedBody.getGroup();
        }
        setGroup(v) {
          this._sharedBody.setGroup(v);
        }
        addGroup(v) {
          this._sharedBody.addGroup(v);
        }
        removeGroup(v) {
          this._sharedBody.removeGroup(v);
        }

        /** mask */
        getMask() {
          return this._sharedBody.getMask();
        }
        setMask(v) {
          this._sharedBody.setMask(v);
        }
        addMask(v) {
          this._sharedBody.addMask(v);
        }
        removeMask(v) {
          this._sharedBody.removeMask(v);
        }
      });
      BuiltinShape.idCounter = 0;
    }
  };
});