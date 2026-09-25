System.register("q-bundled:///fs/cocos/physics/bullet/constraints/bullet-constraint.js", ["../../framework/index.js", "../instantiated.js"], function (_export, _context) {
  "use strict";

  var PhysicsSystem, bt, EBulletType, BulletConstraint;
  _export("BulletConstraint", void 0);
  return {
    setters: [function (_frameworkIndexJs) {
      PhysicsSystem = _frameworkIndexJs.PhysicsSystem;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      EBulletType = _instantiatedJs.EBulletType;
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
      /* eslint-disable new-cap */
      /** @mangle */
      _export("BulletConstraint", BulletConstraint = class BulletConstraint {
        constructor() {
          this.dirty = 0;
          this.index = -1;
          this._impl = 0;
          this._com = void 0;
          this._rigidBody = void 0;
          this._connectedBody = null;
          this._collided = false;
        }
        setConnectedBody(v) {
          if (this._connectedBody === v) return;
          // clear old joint info
          const oldBody2 = this._connectedBody;
          if (oldBody2) {
            const oldSB2 = oldBody2.body.sharedBody;
            oldSB2.removeJoint(this, 1);
          }
          const sb = this._rigidBody.body.sharedBody;
          sb.removeJoint(this, 0);
          if (this._impl) {
            sb.wrappedWorld.removeConstraint(this);
            bt._safe_delete(this._impl, EBulletType.EBulletTypeTypedConstraint); // delete old bullet constraint
          }
          this._connectedBody = v;
          const connect = this._connectedBody;
          // create the new joint
          this.onComponentSet();
          this.setEnableCollision(this._collided);
          sb.wrappedWorld.addConstraint(this);
          sb.addJoint(this, 0);
          // fill new joint info
          if (connect) {
            const sb2 = connect.body.sharedBody;
            sb2.addJoint(this, 1);
          }
        }
        setEnableCollision(v) {
          if (this._collided !== v) {
            this._collided = v;
            this.updateByReAdd();
          }
        }
        get impl() {
          return this._impl;
        }
        get constraint() {
          return this._com;
        }
        updateByReAdd() {
          if (this._rigidBody && this.index >= 0) {
            const sb = this._rigidBody.body.sharedBody;
            sb.wrappedWorld.removeConstraint(this);
            sb.wrappedWorld.addConstraint(this);
          }
        }
        initialize(v) {
          this._com = v;
          this._rigidBody = v.attachedBody;
          this._connectedBody = v.connectedBody;
          this._collided = v.enableCollision;
          this.onComponentSet();
          this.setEnableCollision(this._collided);
        }
        updateDebugDrawSize() {
          if (this.impl) {
            const size = PhysicsSystem.instance.physicsWorld.debugDrawConstraintSize;
            bt.TypedConstraint_setDbgDrawSize(this.impl, size);
          }
        }

        // virtual

        onEnable() {
          const sb = this._rigidBody.body.sharedBody;
          sb.wrappedWorld.addConstraint(this);
          sb.addJoint(this, 0);
          const connect = this._connectedBody;
          if (connect) {
            const sb2 = connect.body.sharedBody;
            sb2.addJoint(this, 1);
          }
        }
        onDisable() {
          const sb = this._rigidBody.body.sharedBody;
          sb.wrappedWorld.removeConstraint(this);
          sb.removeJoint(this, 0);
          const connect = this._connectedBody;
          if (connect) {
            const sb2 = connect.body.sharedBody;
            sb2.removeJoint(this, 1);
          }
        }
        onDestroy() {
          bt._safe_delete(this._impl, EBulletType.EBulletTypeTypedConstraint);
          this._com = null;
          this._rigidBody = null;
          this._connectedBody = null;
        }
      });
    }
  };
});