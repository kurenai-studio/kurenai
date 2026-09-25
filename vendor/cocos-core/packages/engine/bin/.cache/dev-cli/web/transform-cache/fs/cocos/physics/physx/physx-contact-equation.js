System.register("q-bundled:///fs/cocos/physics/physx/physx-contact-equation.js", ["../../core/index.js", "./physx-adapter.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, getContactNormal, getContactPosition, PhysXContactEquation, quat;
  _export("PhysXContactEquation", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
    }, function (_physxAdapterJs) {
      getContactNormal = _physxAdapterJs.getContactNormal;
      getContactPosition = _physxAdapterJs.getContactPosition;
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
      quat = new Quat();
      /** @mangle */
      _export("PhysXContactEquation", PhysXContactEquation = class PhysXContactEquation {
        get isBodyA() {
          return this.colliderA.uuid === this.event.selfCollider.uuid;
        }
        constructor(event) {
          this.impl = null;
          this.event = void 0;
          this.colliderA = void 0;
          this.colliderB = void 0;
          this.event = event;
        }
        getLocalPointOnA(out) {
          getContactPosition(this.impl, out, this.event.impl);
          Vec3.subtract(out, out, this.colliderA.node.worldPosition);
        }
        getLocalPointOnB(out) {
          getContactPosition(this.impl, out, this.event.impl);
          Vec3.subtract(out, out, this.colliderB.node.worldPosition);
        }
        getWorldPointOnA(out) {
          getContactPosition(this.impl, out, this.event.impl);
        }
        getWorldPointOnB(out) {
          getContactPosition(this.impl, out, this.event.impl);
        }
        getLocalNormalOnA(out) {
          this.getWorldNormalOnA(out);
          Quat.conjugate(quat, this.colliderA.node.worldRotation);
          Vec3.transformQuat(out, out, quat);
        }
        getLocalNormalOnB(out) {
          this.getWorldNormalOnB(out);
          Quat.conjugate(quat, this.colliderB.node.worldRotation);
          Vec3.transformQuat(out, out, quat);
        }
        getWorldNormalOnA(out) {
          getContactNormal(this.impl, out, this.event.impl);
          if (!this.isBodyA) Vec3.negate(out, out);
        }
        getWorldNormalOnB(out) {
          getContactNormal(this.impl, out, this.event.impl);
        }
      });
    }
  };
});