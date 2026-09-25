System.register("q-bundled:///fs/cocos/physics-2d/builtin/shapes/box-shape-2d.js", ["./shape-2d.js", "../../../core/index.js", "../intersection-2d.js"], function (_export, _context) {
  "use strict";

  var BuiltinShape2D, Vec2, Intersection2D, BuiltinBoxShape;
  _export("BuiltinBoxShape", void 0);
  return {
    setters: [function (_shape2dJs) {
      BuiltinShape2D = _shape2dJs.BuiltinShape2D;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
    }, function (_intersection2dJs) {
      Intersection2D = _intersection2dJs.default;
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
      /** @mangle */
      _export("BuiltinBoxShape", BuiltinBoxShape = class BuiltinBoxShape extends BuiltinShape2D {
        constructor(...args) {
          super(...args);
          this._worldPoints = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];
        }
        get worldPoints() {
          return this._worldPoints;
        }
        update() {
          const aabb = this._worldAabb;
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
          const minx = Math.min(wp0.x, wp1.x, wp2.x, wp3.x);
          const miny = Math.min(wp0.y, wp1.y, wp2.y, wp3.y);
          const maxx = Math.max(wp0.x, wp1.x, wp2.x, wp3.x);
          const maxy = Math.max(wp0.y, wp1.y, wp2.y, wp3.y);
          aabb.x = minx;
          aabb.y = miny;
          aabb.width = maxx - minx;
          aabb.height = maxy - miny;
        }
        containsPoint(p) {
          if (!this.worldAABB.contains(p)) {
            return false;
          }
          return Intersection2D.pointInPolygon(p, this.worldPoints);
        }
        intersectsRect(rect) {
          if (!this.worldAABB.intersects(rect)) {
            return false;
          }
          return Intersection2D.rectPolygon(rect, this.worldPoints);
        }
      });
    }
  };
});