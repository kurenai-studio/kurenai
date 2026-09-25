System.register("q-bundled:///fs/cocos/physics/physx/joints/physx-fixed-joint.js", ["../../../core/index.js", "../physx-adapter.js", "./physx-joint.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, Mat4, PX, getTempTransform, _pxtrans, PhysXJoint, PhysXFixedJoint, v3_0, quat_0, mat_0;
  _export("PhysXFixedJoint", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      Mat4 = _coreIndexJs.Mat4;
    }, function (_physxAdapterJs) {
      PX = _physxAdapterJs.PX;
      getTempTransform = _physxAdapterJs.getTempTransform;
      _pxtrans = _physxAdapterJs._pxtrans;
    }, function (_physxJointJs) {
      PhysXJoint = _physxJointJs.PhysXJoint;
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
      mat_0 = new Mat4();
      /** @mangle */
      _export("PhysXFixedJoint", PhysXFixedJoint = class PhysXFixedJoint extends PhysXJoint {
        constructor(...args) {
          super(...args);
          this._breakForce = 0;
          this._breakTorque = 0;
        }
        setBreakForce(v) {
          this._breakForce = this.constraint.breakForce;
          this._impl.setBreakForce(this._breakForce, this._breakTorque);
        }
        setBreakTorque(v) {
          this._breakTorque = this.constraint.breakTorque;
          this._impl.setBreakForce(this._breakForce, this._breakTorque);
        }
        get constraint() {
          return this._com;
        }
        onComponentSet() {
          this._impl = PX.createFixedConstraint(PhysXJoint.tempActor, _pxtrans, null, _pxtrans);
          this.setBreakForce(this.constraint.breakForce);
          this.setBreakTorque(this.constraint.breakTorque);
          this.updateFrame();
          this.enableDebugVisualization(true);
        }
        updateFrame() {
          const bodyA = this._rigidBody.body.sharedBody;
          const cb = this.constraint.connectedBody;
          Mat4.fromRT(mat_0, bodyA.node.worldRotation, bodyA.node.worldPosition);
          Mat4.invert(mat_0, mat_0);
          Mat4.getRotation(quat_0, mat_0);
          Mat4.getTranslation(v3_0, mat_0);
          this._impl.setLocalPose(0, getTempTransform(v3_0, quat_0));
          if (cb) {
            const bodyB = cb.body.sharedBody;
            Mat4.fromRT(mat_0, bodyB.node.worldRotation, bodyB.node.worldPosition);
            Mat4.invert(mat_0, mat_0);
            Mat4.getRotation(quat_0, mat_0);
            Mat4.getTranslation(v3_0, mat_0);
            this._impl.setLocalPose(1, getTempTransform(v3_0, quat_0));
          } else {
            this._impl.setLocalPose(1, getTempTransform(Vec3.ZERO, Quat.IDENTITY));
          }
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