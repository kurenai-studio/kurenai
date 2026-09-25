System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/shapes/polygon-shape-2d.js", ["../instantiated.js", "./shape-2d.js", "../../framework/utils/polygon-partition.js", "../../framework/physics-types.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var B2, B2Shape2D, PolygonPartition, PHYSICS_2D_PTM_RATIO, Vec2, warn, B2PolygonShape;
  _export("B2PolygonShape", void 0);
  return {
    setters: [function (_instantiatedJs) {
      B2 = _instantiatedJs.B2;
    }, function (_shape2dJs) {
      B2Shape2D = _shape2dJs.B2Shape2D;
    }, function (_frameworkUtilsPolygonPartitionJs) {
      PolygonPartition = _frameworkUtilsPolygonPartitionJs;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      warn = _coreIndexJs.warn;
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
      _export("B2PolygonShape", B2PolygonShape = class B2PolygonShape extends B2Shape2D {
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
            warn('[Physics2D] b2PolygonShape failed to decompose polygon into convex polygons, node name: ', comp.node.name);
            return shapes;
          }
          const offset = comp.offset;
          for (let i = 0; i < polys.length; i++) {
            const poly = polys[i];
            let shape = 0; //B2.PolygonShape ptr
            const vertices = B2.Vec2VectorNew();
            let firstVertice = null;
            for (let j = 0, l = poly.length; j < l; j++) {
              if (!shape) {
                shape = B2.PolygonShapeNew();
              }
              const p = poly[j];
              const x = (relativePositionX + (p.x + offset.x) * scaleX) / PHYSICS_2D_PTM_RATIO;
              const y = (relativePositionY + (p.y + offset.y) * scaleY) / PHYSICS_2D_PTM_RATIO;
              const v = {
                x,
                y
              };
              B2.Vec2VectorPush(vertices, x, y);
              if (!firstVertice) {
                firstVertice = v;
              }
              if (B2.Vec2VectorSize(vertices) === B2.maxPolygonVertices) {
                B2.PolygonShapeSet(shape, B2.Vec2VectorGetPtr(vertices), B2.Vec2VectorSize(vertices));
                shapes.push(shape);
                shape = 0;
                if (j < l - 1) {
                  const temp = B2.Vec2VectorGet(vertices, B2.Vec2VectorSize(vertices) - 1);
                  B2.Vec2VectorResize(vertices, 0, 0, 0); //clear
                  B2.Vec2VectorPush(vertices, firstVertice.x, firstVertice.y);
                  B2.Vec2VectorPush(vertices, temp.x, temp.y);
                }
              }
            }
            if (shape) {
              B2.PolygonShapeSet(shape, B2.Vec2VectorGetPtr(vertices), B2.Vec2VectorSize(vertices));
              shapes.push(shape);
            }
            B2.Vec2VectorDelete(vertices);
          }
          return shapes;
        }
      });
    }
  };
});