System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/shapes/circle-shape-2d.js", ["./shape-2d.js", "../../framework/physics-types.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var b2Shape2D, PHYSICS_2D_PTM_RATIO, Vec2, b2CircleShape;
  _export("b2CircleShape", void 0);
  return {
    setters: [function (_shape2dJs) {
      b2Shape2D = _shape2dJs.b2Shape2D;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
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
      _export("b2CircleShape", b2CircleShape = class b2CircleShape extends b2Shape2D {
        constructor(...args) {
          super(...args);
          this._worldPosition = new Vec2();
        }
        get worldRadius() {
          return this._shapes[0].m_radius * PHYSICS_2D_PTM_RATIO;
        }
        get worldPosition() {
          const comp = this.collider;
          return Vec2.transformMat4(this._worldPosition, comp.offset, comp.node.worldMatrix);
        }
        _createShapes(scaleX, scaleY, relativePositionX, relativePositionY) {
          scaleX = Math.abs(scaleX);
          scaleY = Math.abs(scaleY);
          const comp = this.collider;
          const offsetX = (relativePositionX + comp.offset.x * scaleX) / PHYSICS_2D_PTM_RATIO;
          const offsetY = (relativePositionY + comp.offset.y * scaleY) / PHYSICS_2D_PTM_RATIO;
          const shape = new b2jsb.CircleShape();
          shape.m_radius = comp.radius / PHYSICS_2D_PTM_RATIO * scaleX;
          shape.m_p = {
            x: offsetX,
            y: offsetY
          };
          return [shape];
        }
      });
    }
  };
});