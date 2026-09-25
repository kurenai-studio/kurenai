System.register("q-bundled:///fs/cocos/physics/cannon/shapes/cannon-trimesh-shape.js", ["@cocos/cannon", "./cannon-shape.js", "../../../core/index.js", "../cannon-util.js"], function (_export, _context) {
  "use strict";

  var CANNON, CannonShape, Vec3, commitShapeUpdates, CannonTrimeshShape, v3_cannon0;
  _export("CannonTrimeshShape", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_cannonShapeJs) {
      CannonShape = _cannonShapeJs.CannonShape;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
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
      v3_cannon0 = new CANNON.Vec3();
      _export("CannonTrimeshShape", CannonTrimeshShape = class CannonTrimeshShape extends CannonShape {
        get collider() {
          return this._collider;
        }
        get impl() {
          return this._shape;
        }
        setMesh(v) {
          if (!this._isBinding) return;
          const mesh = v;
          if (this._shape != null) {
            if (mesh && mesh.renderingSubMeshes.length > 0) {
              const vertices = mesh.renderingSubMeshes[0].geometricInfo.positions;
              const indices = mesh.renderingSubMeshes[0].geometricInfo.indices;
              if (indices instanceof Uint8Array) {
                this.updateProperties(vertices, new Uint16Array(indices));
              } else if (indices instanceof Uint16Array) {
                this.updateProperties(vertices, indices);
              } else if (indices instanceof Uint32Array) {
                this.updateProperties(vertices, new Uint16Array(indices));
              } else {
                this.updateProperties(vertices, new Uint16Array());
              }
            } else {
              this.updateProperties(new Float32Array(), new Uint16Array());
            }
          } else if (mesh && mesh.renderingSubMeshes.length > 0) {
            const vertices = mesh.renderingSubMeshes[0].geometricInfo.positions;
            const indices = mesh.renderingSubMeshes[0].geometricInfo.indices;
            this._shape = new CANNON.Trimesh(vertices, indices);
          } else {
            this._shape = new CANNON.Trimesh(new Float32Array(), new Uint16Array());
          }
        }
        onComponentSet() {
          this.setMesh(this.collider.mesh);
        }
        onLoad() {
          super.onLoad();
          this.setMesh(this.collider.mesh);
        }
        setScale(scale) {
          super.setScale(scale);
          Vec3.copy(v3_cannon0, scale);
          this.impl.setScale(v3_cannon0);
        }
        updateProperties(vertices, indices) {
          this.impl.vertices = new Float32Array(vertices);
          this.impl.indices = new Int16Array(indices);
          this.impl.normals = new Float32Array(indices.length);
          this.impl.aabb = new CANNON.AABB();
          this.impl.edges = [];
          this.impl.tree = new CANNON.Octree(new CANNON.AABB());
          this.impl.updateEdges();
          this.impl.updateNormals();
          this.impl.updateAABB();
          this.impl.updateBoundingSphereRadius();
          this.impl.updateTree();
          this.impl.setScale(this.impl.scale);
          if (this._index >= 0) {
            commitShapeUpdates(this._body);
          }
        }
      });
    }
  };
});