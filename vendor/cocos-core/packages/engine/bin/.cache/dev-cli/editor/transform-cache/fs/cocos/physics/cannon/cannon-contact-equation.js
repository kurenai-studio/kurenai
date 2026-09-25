System.register("q-bundled:///fs/cocos/physics/cannon/cannon-contact-equation.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Quat, Vec3, CannonContactEquation, quat;
  _export("CannonContactEquation", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
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
      _export("CannonContactEquation", CannonContactEquation = class CannonContactEquation {
        get isBodyA() {
          if (this.impl) {
            const si = this.event.selfCollider.shape.impl;
            const bj = this.impl.bj;
            return si.body.id === bj.id;
          }
          return false;
        }
        constructor(event) {
          this.impl = null;
          this.event = void 0;
          this.event = event;
        }
        getLocalPointOnA(out) {
          if (this.impl) Vec3.copy(out, this.impl.rj);
        }
        getLocalPointOnB(out) {
          if (this.impl) Vec3.copy(out, this.impl.ri);
        }
        getWorldPointOnA(out) {
          if (this.impl) Vec3.add(out, this.impl.rj, this.impl.bj.position);
        }
        getWorldPointOnB(out) {
          if (this.impl) Vec3.add(out, this.impl.ri, this.impl.bi.position);
        }
        getLocalNormalOnA(out) {
          if (this.impl) {
            this.getWorldNormalOnA(out);
            Quat.conjugate(quat, this.impl.bi.quaternion);
            Vec3.transformQuat(out, out, quat);
          }
        }
        getLocalNormalOnB(out) {
          if (this.impl) {
            Quat.conjugate(quat, this.impl.bj.quaternion);
            Vec3.transformQuat(out, this.impl.ni, quat);
          }
        }
        getWorldNormalOnA(out) {
          if (this.impl) {
            this.getWorldNormalOnB(out);
            if (!this.isBodyA) Vec3.negate(out, out);
          }
        }
        getWorldNormalOnB(out) {
          if (this.impl) Vec3.copy(out, this.impl.ni);
        }
      });
    }
  };
});