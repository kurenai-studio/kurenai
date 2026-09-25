System.register("q-bundled:///fs/cocos/physics/cannon/constraints/cannon-constraint.js", ["@cocos/cannon"], function (_export, _context) {
  "use strict";

  var CANNON, CannonConstraint;
  _export("CannonConstraint", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
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

      CANNON.World.staticBody = new CANNON.Body();
      CANNON.World.idToConstraintMap = {};
      _export("CannonConstraint", CannonConstraint = class CannonConstraint {
        constructor() {
          this._impl = void 0;
          this._com = void 0;
          this._rigidBody = void 0;
          this._connectedBody = void 0;
        }
        setConnectedBody(v) {
          if (this._connectedBody === v) return;
          const oldBody2 = this._connectedBody;
          if (oldBody2) {
            const oldSB2 = oldBody2.body.sharedBody;
            oldSB2.removeJoint(this, 1);
          }
          const sb = this._rigidBody.body.sharedBody;
          sb.removeJoint(this, 0);
          if (this._impl) {
            sb.wrappedWorld.removeConstraint(this);
            delete CANNON.World.idToConstraintMap[this._impl.id];
            this._impl = null;
          }
          this._connectedBody = v;
          const connect = this._connectedBody;
          this.onComponentSet();
          this.setEnableCollision(this._com.enableCollision);
          CANNON.World.idToConstraintMap[this._impl.id] = this._impl;
          sb.wrappedWorld.addConstraint(this);
          sb.addJoint(this, 0);
          if (connect) {
            const newSB2 = connect.body.sharedBody;
            newSB2.addJoint(this, 1);
          }
        }
        setEnableCollision(v) {
          this._impl.collideConnected = v;
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
          this.setEnableCollision(v.enableCollision);
          CANNON.World.idToConstraintMap[this._impl.id] = this._impl;
        }

        // virtual
        onComponentSet() {}

        // virtual
        updateScale0() {}
        updateScale1() {}
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
          delete CANNON.World.idToConstraintMap[this._impl.id];
          this._com = null;
          this._rigidBody = null;
          this._connectedBody = null;
          this._impl = null;
        }
      });
    }
  };
});