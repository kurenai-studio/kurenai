System.register("q-bundled:///fs/cocos/physics/cannon/shapes/cannon-simplex-shape.js", ["@cocos/cannon", "../../../core/index.js", "../cannon-util.js", "./cannon-shape.js", "../../../../exports/physics-framework.js"], function (_export, _context) {
  "use strict";

  var CANNON, Vec3, commitShapeUpdates, CannonShape, SimplexCollider, CannonSimplexShape, createTetra;
  _export("CannonSimplexShape", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_cannonUtilJs) {
      commitShapeUpdates = _cannonUtilJs.commitShapeUpdates;
    }, function (_cannonShapeJs) {
      CannonShape = _cannonShapeJs.CannonShape;
    }, function (_exportsPhysicsFrameworkJs) {
      SimplexCollider = _exportsPhysicsFrameworkJs.SimplexCollider;
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
      /* eslint-disable func-names */
      _export("CannonSimplexShape", CannonSimplexShape = class CannonSimplexShape extends CannonShape {
        constructor(...args) {
          super(...args);
          this.vertices = [];
        }
        setShapeType(v) {
          if (this._isBinding) {
            // TODO: change the type after init
          }
        }
        setVertices(v) {
          const length = this.vertices.length;
          if (length === 4) {
            const ws = this._collider.node.worldScale;
            for (let i = 0; i < length; i++) {
              Vec3.multiply(this.vertices[i], ws, v[i]);
            }
            const impl = this.impl;
            impl.computeNormals();
            impl.computeEdges();
            impl.updateBoundingSphereRadius();
          } else {
            // TODO: add to center
            // const impl = this.impl as CANNON.Particle;
          }
          if (this._index !== -1) {
            commitShapeUpdates(this._body);
          }
        }
        get collider() {
          return this._collider;
        }
        get impl() {
          return this._shape;
        }
        onComponentSet() {
          const type = this.collider.shapeType;
          if (type === SimplexCollider.ESimplexType.TETRAHEDRON) {
            for (let i = 0; i < 4; i++) {
              this.vertices[i] = new CANNON.Vec3(0, 0, 0);
            }
            this._shape = createTetra(this.vertices);
          } else {
            if (type !== SimplexCollider.ESimplexType.VERTEX) {
              // WARN
            }
            this._shape = new CANNON.Particle();
          }
        }
        onLoad() {
          super.onLoad();
          this.collider.updateVertices();
        }
        setScale(scale) {
          super.setScale(scale);
          this.collider.updateVertices();
        }
      });
      createTetra = function () {
        const faces = [[0, 3, 2],
        // -x
        [0, 1, 3],
        // -y
        [0, 2, 1],
        // -z
        [1, 2, 3] // +xyz
        ];
        return function (verts) {
          return new CANNON.ConvexPolyhedron(verts, faces);
        };
      }();
    }
  };
});