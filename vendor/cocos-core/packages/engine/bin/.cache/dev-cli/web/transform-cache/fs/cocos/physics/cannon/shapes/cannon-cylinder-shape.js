System.register("q-bundled:///fs/cocos/physics/cannon/shapes/cannon-cylinder-shape.js", ["@cocos/cannon", "./cannon-shape.js", "../../framework/physics-enum.js", "../cannon-util.js"], function (_export, _context) {
  "use strict";

  var CANNON, CannonShape, EAxisDirection, commitShapeUpdates, CannonCylinderShape;
  _export("CannonCylinderShape", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_cannonShapeJs) {
      CannonShape = _cannonShapeJs.CannonShape;
    }, function (_frameworkPhysicsEnumJs) {
      EAxisDirection = _frameworkPhysicsEnumJs.EAxisDirection;
    }, function (_cannonUtilJs) {
      commitShapeUpdates = _cannonUtilJs.commitShapeUpdates;
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
      _export("CannonCylinderShape", CannonCylinderShape = class CannonCylinderShape extends CannonShape {
        get collider() {
          return this._collider;
        }
        get impl() {
          return this._shape;
        }
        setRadius(v) {
          this.updateProperties(this.collider.radius, this.collider.height, CANNON.CC_CONFIG.numSegmentsCylinder, this.collider.direction, this.collider.node.worldScale);
          if (this._index !== -1) commitShapeUpdates(this._body);
        }
        setHeight(v) {
          this.updateProperties(this.collider.radius, this.collider.height, CANNON.CC_CONFIG.numSegmentsCylinder, this.collider.direction, this.collider.node.worldScale);
          if (this._index !== -1) commitShapeUpdates(this._body);
        }
        setDirection(v) {
          this.updateProperties(this.collider.radius, this.collider.height, CANNON.CC_CONFIG.numSegmentsCylinder, this.collider.direction, this.collider.node.worldScale);
          if (this._index !== -1) commitShapeUpdates(this._body);
        }
        constructor(radius = 0.5, height = 2, direction = EAxisDirection.Y_AXIS) {
          super();
          this._shape = new CANNON.Cylinder(radius, radius, height, CANNON.CC_CONFIG.numSegmentsCylinder, direction === EAxisDirection.Y_AXIS);
        }
        onLoad() {
          super.onLoad();
          this.setRadius(this.collider.radius);
        }
        setScale(scale) {
          super.setScale(scale);
          this.setRadius(this.collider.radius);
        }
        updateProperties(radius, height, numSegments, direction, scale) {
          let wh = height;
          let wr = radius;
          const cos = Math.cos;
          const sin = Math.sin;
          const abs = Math.abs;
          const max = Math.max;
          if (direction === 1) {
            wh = abs(scale.y) * height;
            wr = max(abs(scale.x), abs(scale.z)) * radius;
          } else if (direction === 2) {
            wh = abs(scale.z) * height;
            wr = max(abs(scale.x), abs(scale.y)) * radius;
          } else {
            wh = abs(scale.x) * height;
            wr = max(abs(scale.y), abs(scale.z)) * radius;
          }
          const N = numSegments;
          const hH = wh / 2;
          const vertices = [];
          const indices = [];
          const axes = [];
          const theta = Math.PI * 2 / N;
          if (direction === 1) {
            const bf = [1];
            const tf = [0];
            for (let i = 0; i < N; i++) {
              const x = wr * cos(theta * i);
              const z = wr * sin(theta * i);
              vertices.push(new CANNON.Vec3(x, hH, z));
              vertices.push(new CANNON.Vec3(x, -hH, z));
              if (i < N - 1) {
                indices.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
                tf.push(2 * i + 2);
                bf.push(2 * i + 3);
              } else {
                indices.push([0, 1, 2 * i + 1, 2 * i]);
              }
              if (N % 2 === 1 || i < N / 2) {
                axes.push(new CANNON.Vec3(cos(theta * (i + 0.5)), 0, sin(theta * (i + 0.5))));
              }
            }
            indices.push(bf);
            const temp = [];
            for (let i = 0; i < tf.length; i++) {
              temp.push(tf[tf.length - i - 1]);
            }
            indices.push(temp);
            axes.push(new CANNON.Vec3(0, 1, 0));
          } else if (direction === 2) {
            const bf = [0];
            const tf = [1];
            for (let i = 0; i < N; i++) {
              const x = wr * cos(theta * i);
              const y = wr * sin(theta * i);
              vertices.push(new CANNON.Vec3(x, y, hH));
              vertices.push(new CANNON.Vec3(x, y, -hH));
              if (i < N - 1) {
                indices.push([2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2]);
                bf.push(2 * i + 2);
                tf.push(2 * i + 3);
              } else {
                indices.push([2 * i, 2 * i + 1, 0, 1]);
              }
              if (N % 2 === 1 || i < N / 2) {
                axes.push(new CANNON.Vec3(cos(theta * (i + 0.5)), sin(theta * (i + 0.5)), 0));
              }
            }
            indices.push(bf);
            const temp = [];
            for (let i = 0; i < tf.length; i++) {
              temp.push(tf[tf.length - i - 1]);
            }
            indices.push(temp);
            axes.push(new CANNON.Vec3(0, 0, 1));
          } else {
            const bf = [0];
            const tf = [1];
            for (let i = 0; i < N; i++) {
              const y = wr * cos(theta * i);
              const z = wr * sin(theta * i);
              vertices.push(new CANNON.Vec3(hH, y, z));
              vertices.push(new CANNON.Vec3(-hH, y, z));
              if (i < N - 1) {
                indices.push([2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2]);
                bf.push(2 * i + 2);
                tf.push(2 * i + 3);
              } else {
                indices.push([2 * i, 2 * i + 1, 0, 1]);
              }
              if (N % 2 === 1 || i < N / 2) {
                axes.push(new CANNON.Vec3(0, cos(theta * (i + 0.5)), sin(theta * (i + 0.5))));
              }
            }
            indices.push(bf);
            const temp = [];
            for (let i = 0; i < tf.length; i++) {
              temp.push(tf[tf.length - i - 1]);
            }
            indices.push(temp);
            axes.push(new CANNON.Vec3(1, 0, 0));
          }
          this.impl.vertices = vertices;
          this.impl.faces = indices;
          this.impl.uniqueAxes = axes;
          this.impl.worldVerticesNeedsUpdate = true;
          this.impl.worldFaceNormalsNeedsUpdate = true;
          this.impl.computeNormals();
          this.impl.computeEdges();
          this.impl.updateBoundingSphereRadius();
        }
      });
    }
  };
});