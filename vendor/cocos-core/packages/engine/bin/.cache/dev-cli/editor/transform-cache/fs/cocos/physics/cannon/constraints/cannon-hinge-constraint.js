System.register("q-bundled:///fs/cocos/physics/cannon/constraints/cannon-hinge-constraint.js", ["@cocos/cannon", "./cannon-constraint.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var CANNON, CannonConstraint, Vec3, Quat, warnID, CannonHingeConstraint, v3_0, quat_0;
  _export("CannonHingeConstraint", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_cannonConstraintJs) {
      CannonConstraint = _cannonConstraintJs.CannonConstraint;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      warnID = _coreIndexJs.warnID;
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
      v3_0 = new Vec3();
      quat_0 = new Quat();
      _export("CannonHingeConstraint", CannonHingeConstraint = class CannonHingeConstraint extends CannonConstraint {
        get impl() {
          return this._impl;
        }
        get constraint() {
          return this._com;
        }
        setPivotA(v) {
          const cs = this.constraint;
          Vec3.multiply(this.impl.pivotA, this.constraint.node.worldScale, cs.pivotA);
          if (!cs.connectedBody) this.setPivotB(cs.pivotB);
        }
        setPivotB(v) {
          const cs = this.constraint;
          const cb = cs.connectedBody;
          if (cb) {
            Vec3.multiply(this.impl.pivotB, cb.node.worldScale, cs.pivotB);
          } else {
            const node = this.constraint.node;
            Vec3.multiply(v3_0, node.worldScale, cs.pivotA);
            Vec3.transformQuat(v3_0, v3_0, node.worldRotation);
            Vec3.add(v3_0, v3_0, node.worldPosition);
            Vec3.copy(this.impl.pivotB, v3_0);
          }
        }
        setAxis(v) {
          const equations = this.impl.equations;
          Vec3.copy(this.impl.axisA, v);
          Vec3.copy(equations[3].axisA, v);
          Vec3.copy(equations[4].axisA, v);
          Vec3.copy(equations[5].axisA, v);
          if (this.constraint.connectedBody) {
            Vec3.transformQuat(this.impl.axisB, v, this.constraint.node.worldRotation);
            Quat.invert(quat_0, this.constraint.connectedBody.node.worldRotation);
            Vec3.transformQuat(this.impl.axisB, this.impl.axisB, quat_0);
            Vec3.copy(equations[3].axisB, this.impl.axisB);
            Vec3.copy(equations[4].axisB, this.impl.axisB);
            Vec3.copy(equations[5].axisB, this.impl.axisB);
          } else {
            Vec3.transformQuat(this.impl.axisB, v, this.constraint.node.worldRotation);
            Vec3.copy(equations[3].axisB, this.impl.axisB);
            Vec3.copy(equations[4].axisB, this.impl.axisB);
            Vec3.copy(equations[5].axisB, this.impl.axisB);
          }
        }
        setLimitEnabled(v) {
          warnID(9613);
        }
        setLowerLimit(min) {
          warnID(9613);
        }
        setUpperLimit(max) {
          warnID(9613);
        }
        setMotorEnabled(v) {
          warnID(9613);
        }
        setMotorVelocity(v) {
          warnID(9613);
        }
        setMotorForceLimit(v) {
          warnID(9613);
        }
        onComponentSet() {
          const bodyA = this._rigidBody.body.impl;
          const cb = this.constraint.connectedBody;
          let bodyB = CANNON.World.staticBody;
          if (cb) {
            bodyB = cb.body.impl;
          }
          this._impl = new CANNON.HingeConstraint(bodyA, bodyB);
          this.setPivotA(this.constraint.pivotA);
          this.setPivotB(this.constraint.pivotB);
          this.setAxis(this.constraint.axis);
        }
        updateScale0() {
          this.setPivotA(this.constraint.pivotA);
        }
        updateScale1() {
          this.setPivotB(this.constraint.pivotB);
        }
      });
    }
  };
});