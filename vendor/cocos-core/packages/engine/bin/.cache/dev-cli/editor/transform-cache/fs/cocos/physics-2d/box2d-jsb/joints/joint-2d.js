System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/joints/joint-2d.js", ["../../framework/index.js"], function (_export, _context) {
  "use strict";

  var PhysicsSystem2D, RigidBody2D, b2Joint;
  _export("b2Joint", void 0);
  return {
    setters: [function (_frameworkIndexJs) {
      PhysicsSystem2D = _frameworkIndexJs.PhysicsSystem2D;
      RigidBody2D = _frameworkIndexJs.RigidBody2D;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      _export("b2Joint", b2Joint = class b2Joint {
        constructor() {
          this._b2joint = null;
          this._jointComp = null;
          this._body = null;
          this._inited = false;
        }
        get impl() {
          return this._b2joint;
        }
        get comp() {
          return this._jointComp;
        }
        get body() {
          return this._body;
        }
        initialize(comp) {
          this._jointComp = comp;
        }
        onEnable() {
          PhysicsSystem2D.instance._callAfterStep(this, this._init);
        }
        onDisable() {
          PhysicsSystem2D.instance._callAfterStep(this, this._destroy);
        }

        // need init after body and connected body init
        start() {
          PhysicsSystem2D.instance._callAfterStep(this, this._init);
        }
        apply() {
          PhysicsSystem2D.instance._callAfterStep(this, this._destroy);
          if (this.comp.enabledInHierarchy) {
            PhysicsSystem2D.instance._callAfterStep(this, this._init);
          }
        }
        _init() {
          if (this._inited) return;
          const comp = this._jointComp;
          if (!comp.isValid) {
            return;
          }
          this._body = comp.getComponent(RigidBody2D);
          const def = this._createJointDef();
          if (!def) {
            return;
          }
          def.bodyA = this._body.impl.impl;
          const connectedBody = comp.connectedBody;
          //if connected body is set but not active, return
          if (connectedBody && !connectedBody.enabledInHierarchy) {
            return;
          }

          //if connected body is not set, use scene origin as connected body
          if (!connectedBody) {
            def.bodyB = PhysicsSystem2D.instance.physicsWorld.groundBodyImpl;
          } else {
            def.bodyB = connectedBody.impl.impl;
          }
          def.collideConnected = comp.collideConnected;
          this._b2joint = PhysicsSystem2D.instance.physicsWorld.impl.CreateJoint(def);
          this._inited = true;
        }
        _destroy() {
          if (!this._inited) return;

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          PhysicsSystem2D.instance.physicsWorld.impl.DestroyJoint(this._b2joint);
          this._b2joint = null;
          this._inited = false;
        }
        _createJointDef() {
          return null;
        }
        isValid() {
          return this._b2joint && this._body && this._body.impl && this._jointComp;
        }
      });
    }
  };
});