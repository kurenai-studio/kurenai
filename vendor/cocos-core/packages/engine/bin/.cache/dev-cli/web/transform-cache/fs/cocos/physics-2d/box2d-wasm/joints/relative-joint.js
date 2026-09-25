System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/joints/relative-joint.js", ["../instantiated.js", "./joint-2d.js", "../../framework/physics-types.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var B2, B2Joint, PHYSICS_2D_PTM_RATIO, toRadian, B2RelativeJoint, tempB2Vec2;
  _export("B2RelativeJoint", void 0);
  return {
    setters: [function (_instantiatedJs) {
      B2 = _instantiatedJs.B2;
    }, function (_joint2dJs) {
      B2Joint = _joint2dJs.B2Joint;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      toRadian = _coreIndexJs.toRadian;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      tempB2Vec2 = {
        x: 0,
        y: 0
      }; //new b2.Vec2();
      /** @mangle */
      _export("B2RelativeJoint", B2RelativeJoint = class B2RelativeJoint extends B2Joint {
        setMaxForce(v) {
          if (this._b2joint) {
            this._b2joint.SetMaxForce(v);
          }
        }
        setAngularOffset(v) {
          if (this._b2joint) {
            this._b2joint.SetAngularOffset(toRadian(v));
          }
        }
        setLinearOffset(v) {
          if (this._b2joint) {
            tempB2Vec2.x = v.x / PHYSICS_2D_PTM_RATIO;
            tempB2Vec2.y = v.y / PHYSICS_2D_PTM_RATIO;
            this._b2joint.SetLinearOffset(tempB2Vec2);
          }
        }
        setCorrectionFactor(v) {
          if (this._b2joint) {
            this._b2joint.SetCorrectionFactor(v);
          }
        }
        setMaxTorque(v) {
          if (this._b2joint) {
            this._b2joint.SetMaxTorque(v);
          }
        }
        _createJointDef() {
          const comp = this._jointComp;
          const def = new B2.MotorJointDef();
          def.linearOffset = {
            x: comp.linearOffset.x / PHYSICS_2D_PTM_RATIO,
            y: comp.linearOffset.y / PHYSICS_2D_PTM_RATIO
          };
          def.angularOffset = toRadian(comp.angularOffset);
          def.maxForce = comp.maxForce;
          def.maxTorque = comp.maxTorque;
          def.correctionFactor = comp.correctionFactor;
          return def;
        }
      });
    }
  };
});