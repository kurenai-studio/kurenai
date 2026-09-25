System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/joints/distance-joint.js", ["./joint-2d.js", "../../framework/physics-types.js"], function (_export, _context) {
  "use strict";

  var b2Joint, PHYSICS_2D_PTM_RATIO, b2DistanceJoint;
  _export("b2DistanceJoint", void 0);
  return {
    setters: [function (_joint2dJs) {
      b2Joint = _joint2dJs.b2Joint;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
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
      _export("b2DistanceJoint", b2DistanceJoint = class b2DistanceJoint extends b2Joint {
        setMaxLength(v) {
          if (this._b2joint) {
            this._b2joint.SetMaxLength(v);
          }
        }
        _createJointDef() {
          const comp = this._jointComp;
          const def = new b2jsb.RopeJointDef();
          def.localAnchorA = {
            x: comp.anchor.x / PHYSICS_2D_PTM_RATIO,
            y: comp.anchor.y / PHYSICS_2D_PTM_RATIO
          };
          def.localAnchorB = {
            x: comp.connectedAnchor.x / PHYSICS_2D_PTM_RATIO,
            y: comp.connectedAnchor.y / PHYSICS_2D_PTM_RATIO
          };
          def.maxLength = comp.maxLength / PHYSICS_2D_PTM_RATIO;
          return def;
        }
      });
    }
  };
});