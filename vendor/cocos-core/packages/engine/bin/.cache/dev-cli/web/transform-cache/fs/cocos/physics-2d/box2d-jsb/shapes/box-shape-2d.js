System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/shapes/box-shape-2d.js", ["./shape-2d.js", "../../framework/physics-types.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var b2Shape2D, PHYSICS_2D_PTM_RATIO, Vec2, Rect, b2BoxShape, tempAabb;
  _export("b2BoxShape", void 0);
  return {
    setters: [function (_shape2dJs) {
      b2Shape2D = _shape2dJs.b2Shape2D;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      Rect = _coreIndexJs.Rect;
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
      tempAabb = new Rect();
      _export("b2BoxShape", b2BoxShape = class b2BoxShape extends b2Shape2D {
        constructor(...args) {
          super(...args);
          this._worldPoints = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];
        }
        get worldPoints() {
          const aabb = tempAabb;
          const collider = this.collider;
          const size = collider.size;
          const offset = collider.offset;
          aabb.x = offset.x - size.width / 2;
          aabb.y = offset.y - size.height / 2;
          aabb.width = size.width;
          aabb.height = size.height;
          const wps = this._worldPoints;
          const wp0 = wps[0];
          const wp1 = wps[1];
          const wp2 = wps[2];
          const wp3 = wps[3];
          aabb.transformMat4ToPoints(collider.node.worldMatrix, wp0, wp1, wp2, wp3);
          return wps;
        }
        _createShapes(scaleX, scaleY, relativePositionX, relativePositionY) {
          scaleX = Math.abs(scaleX);
          scaleY = Math.abs(scaleY);
          const comp = this.collider;
          const width = comp.size.width / 2 / PHYSICS_2D_PTM_RATIO * scaleX;
          const height = comp.size.height / 2 / PHYSICS_2D_PTM_RATIO * scaleY;
          const offsetX = (relativePositionX + comp.offset.x * scaleX) / PHYSICS_2D_PTM_RATIO;
          const offsetY = (relativePositionY + comp.offset.y * scaleY) / PHYSICS_2D_PTM_RATIO;
          const shape = new b2jsb.PolygonShape();
          shape.SetAsBox(width, height, new b2jsb.Vec2(offsetX, offsetY), 0);
          return [shape];
        }
      });
    }
  };
});