System.register("q-bundled:///fs/cocos/physics/cannon/constraints/cannon-lock-constraint.js", ["@cocos/cannon", "./cannon-constraint.js"], function (_export, _context) {
  "use strict";

  var CANNON, CannonConstraint, CannonLockConstraint;
  _export("CannonLockConstraint", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_cannonConstraintJs) {
      CannonConstraint = _cannonConstraintJs.CannonConstraint;
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
      _export("CannonLockConstraint", CannonLockConstraint = class CannonLockConstraint extends CannonConstraint {
        constructor(...args) {
          super(...args);
          this._breakForce = 1e9;
        }
        setBreakForce(v) {
          this._breakForce = v;
          this.updateFrame();
        }
        setBreakTorque(v) {
          // not supported
        }
        get impl() {
          return this._impl;
        }
        get constraint() {
          return this._com;
        }
        onComponentSet() {
          this._breakForce = this.constraint.breakForce;
          this.updateFrame();
        }
        updateFrame() {
          const bodyA = this._rigidBody.body.impl;
          const cb = this.constraint.connectedBody;
          let bodyB = CANNON.World.staticBody;
          if (cb) {
            bodyB = cb.body.impl;
          }
          this._impl = new CANNON.LockConstraint(bodyA, bodyB, {
            maxForce: this._breakForce
          });
        }
        updateScale0() {
          this.updateFrame();
        }
        updateScale1() {
          this.updateFrame();
        }
      });
    }
  };
});