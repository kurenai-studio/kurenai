System.register("q-bundled:///fs/cocos/physics/physx/joints/physx-joint.js", ["../physx-adapter.js", "../physx-instance.js"], function (_export, _context) {
  "use strict";

  var PX, setJointActors, _pxtrans, PhysXInstance, PhysXJoint;
  _export("PhysXJoint", void 0);
  return {
    setters: [function (_physxAdapterJs) {
      PX = _physxAdapterJs.PX;
      setJointActors = _physxAdapterJs.setJointActors;
      _pxtrans = _physxAdapterJs._pxtrans;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
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
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      /** @mangle */
      _export("PhysXJoint", PhysXJoint = class PhysXJoint {
        constructor() {
          this._impl = void 0;
          this._com = void 0;
          this._rigidBody = void 0;
          this._connectedBody = null;
        }
        static get tempActor() {
          if (!this._tempActor) {
            this._tempActor = PhysXInstance.physics.createRigidDynamic(_pxtrans);
          }
          return this._tempActor;
        }
        setConnectedBody(v) {
          if (this._connectedBody === v) return;

          // // unregister old
          const oldBody2 = this._connectedBody;
          if (oldBody2) {
            const oldSB2 = oldBody2.body.sharedBody;
            oldSB2.removeJoint(this, 1);
          }
          const sb = this._rigidBody.body.sharedBody;
          sb.removeJoint(this, 0);
          sb.addJoint(this, 0); // add to inner body if this joint is not added to sb
          if (v) {
            const sb2 = v.body.sharedBody;
            setJointActors(this._impl, sb.impl, sb2.impl);
            sb2.addJoint(this, 1); // add to new sb2
          } else {
            setJointActors(this._impl, sb.impl, null);
          }
          if (oldBody2) {
            oldBody2.wakeUp(); // wake it up, or the old body will be sleep for a while
          }
          this._connectedBody = v;
          this.updateScale0();
          this.updateScale1();
        }
        setEnableCollision(v) {
          this._impl.setConstraintFlag(1 << 3, v);
        }
        get impl() {
          return this._impl;
        }
        get constraint() {
          return this._com;
        }
        initialize(v) {
          this._com = v;
          this._rigidBody = v.attachedBody;
          this._connectedBody = v.connectedBody;
          this.onComponentSet();
          this.setEnableCollision(this._com.enableCollision);
          if (this._impl.$$) {
            PX.IMPL_PTR[this._impl.$$.ptr] = this;
          }
        }
        enableDebugVisualization(v) {
          if (this.impl) {
            this.impl.setConstraintFlag(1 << 4, v); // PxConstraintFlag::eVISUALIZATION
          }
        }

        // virtual
        onComponentSet() {}

        // virtual
        updateScale0() {}
        updateScale1() {}
        onEnable() {
          const sb = this._rigidBody.body.sharedBody;
          const connect = this._com.connectedBody;
          sb.addJoint(this, 0);
          if (connect) {
            const sb2 = connect.body.sharedBody;
            setJointActors(this._impl, sb.impl, sb2.impl);
            sb2.addJoint(this, 1);
          } else {
            setJointActors(this._impl, sb.impl, null);
          }
        }
        onDisable() {
          setJointActors(this._impl, PhysXJoint.tempActor, null);
          const sb = this._rigidBody.body.sharedBody;
          sb.removeJoint(this, 0);
          const connect = this.constraint.connectedBody;
          if (connect) {
            const sb2 = connect.body.sharedBody;
            sb2.removeJoint(this, 1);
          }
        }
        onDestroy() {
          if (this._impl.$$) {
            PX.IMPL_PTR[this._impl.$$.ptr] = null;
            delete PX.IMPL_PTR[this._impl.$$.ptr];
          }
          this._impl.release();
          this._com = null;
          this._rigidBody = null;
          this._connectedBody = null;
          this._impl = null;
        }
      });
      PhysXJoint._tempActor = void 0;
    }
  };
});