System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/shapes/polygon-shape-2d.js", ["./shape-2d.js", "../../framework/utils/polygon-partition.js", "../../framework/physics-types.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var b2Shape2D, PolygonPartition, PHYSICS_2D_PTM_RATIO, Vec2, logID, b2PolygonShape;
  _export("b2PolygonShape", void 0);
  return {
    setters: [function (_shape2dJs) {
      b2Shape2D = _shape2dJs.b2Shape2D;
    }, function (_frameworkUtilsPolygonPartitionJs) {
      PolygonPartition = _frameworkUtilsPolygonPartitionJs;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      logID = _coreIndexJs.logID;
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
      _export("b2PolygonShape", b2PolygonShape = class b2PolygonShape extends b2Shape2D {
        constructor(...args) {
          super(...args);
          this._worldPoints = [];
        }
        get worldPoints() {
          const comp = this.collider;
          const points = comp.points;
          const worldPoints = this._worldPoints;
          const m = comp.node.worldMatrix;
          for (let i = 0; i < points.length; i++) {
            if (!worldPoints[i]) {
              worldPoints[i] = new Vec2();
            }
            Vec2.transformMat4(worldPoints[i], points[i], m);
          }
          worldPoints.length = points.length;
          return this._worldPoints;
        }
        _createShapes(scaleX, scaleY, relativePositionX, relativePositionY) {
          const shapes = [];
          const comp = this.collider;
          const points = comp.points;

          // check if last point equal to first point
          if (points.length > 0 && points[0].equals(points[points.length - 1])) {
            points.length -= 1;
          }
          const polys = PolygonPartition.ConvexPartition(points);
          if (!polys) {
            logID(16408, comp.node.name);
            return shapes;
          }
          const offset = comp.offset;
          for (let i = 0; i < polys.length; i++) {
            const poly = polys[i];
            let shape = null;
            let vertices = [];
            let firstVertice = null;
            for (let j = 0, l = poly.length; j < l; j++) {
              if (!shape) {
                shape = new b2jsb.PolygonShape();
              }
              const p = poly[j];
              const x = (relativePositionX + (p.x + offset.x) * scaleX) / PHYSICS_2D_PTM_RATIO;
              const y = (relativePositionY + (p.y + offset.y) * scaleY) / PHYSICS_2D_PTM_RATIO;
              const v = new b2jsb.Vec2(x, y);
              vertices.push(v);
              if (!firstVertice) {
                firstVertice = v;
              }
              if (vertices.length === b2jsb.maxPolygonVertices) {
                shape.Set(vertices, vertices.length);
                shapes.push(shape);
                shape = null;
                if (j < l - 1) {
                  vertices = [firstVertice, vertices[vertices.length - 1]];
                }
              }
            }
            if (shape) {
              shape.Set(vertices, vertices.length);
              shapes.push(shape);
            }
          }
          return shapes;
        }
      });
    }
  };
});