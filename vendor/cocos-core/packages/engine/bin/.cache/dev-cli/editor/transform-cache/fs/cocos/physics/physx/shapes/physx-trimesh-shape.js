System.register("q-bundled:///fs/cocos/physics/physx/shapes/physx-trimesh-shape.js", ["../../../core/index.js", "../physx-adapter.js", "./physx-shape.js", "../physx-instance.js"], function (_export, _context) {
  "use strict";

  var Quat, Vec3, addReference, createConvexMesh, createMeshGeometryFlags, createTriangleMesh, PX, removeReference, EPhysXShapeType, PhysXShape, PhysXInstance, PhysXTrimeshShape;
  _export("PhysXTrimeshShape", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_physxAdapterJs) {
      addReference = _physxAdapterJs.addReference;
      createConvexMesh = _physxAdapterJs.createConvexMesh;
      createMeshGeometryFlags = _physxAdapterJs.createMeshGeometryFlags;
      createTriangleMesh = _physxAdapterJs.createTriangleMesh;
      PX = _physxAdapterJs.PX;
      removeReference = _physxAdapterJs.removeReference;
    }, function (_physxShapeJs) {
      EPhysXShapeType = _physxShapeJs.EPhysXShapeType;
      PhysXShape = _physxShapeJs.PhysXShape;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
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
      /** @mangle */
      _export("PhysXTrimeshShape", PhysXTrimeshShape = class PhysXTrimeshShape extends PhysXShape {
        constructor() {
          super(EPhysXShapeType.MESH);
          this.geometry = void 0;
        }
        setMesh(v) {
          if (v && v.renderingSubMeshes.length > 0) {
            if (this._impl != null) {
              this.removeFromBody();
              removeReference(this, this._impl);
              this._impl.release();
              this._impl = null;
            }
            const physics = PhysXInstance.physics;
            const collider = this.collider;
            const pxmat = this.getSharedMaterial(collider.sharedMaterial);
            const meshScale = PhysXShape.MESH_SCALE;
            meshScale.setScale(Vec3.ONE);
            meshScale.setRotation(Quat.IDENTITY);
            const posBuf = v.renderingSubMeshes[0].geometricInfo.positions;
            let indBuf = v.renderingSubMeshes[0].geometricInfo.indices;
            if (indBuf instanceof Uint16Array) {
              indBuf = new Uint32Array(indBuf);
            }
            if (indBuf instanceof Uint8Array) {
              indBuf = new Uint32Array(indBuf);
            }
            if (collider.convex || indBuf === undefined) {
              if (PX.MESH_CONVEX[v._uuid] == null) {
                const cooking = PhysXInstance.cooking;
                PX.MESH_CONVEX[v._uuid] = createConvexMesh(posBuf, cooking, physics);
              }
              const convexMesh = PX.MESH_CONVEX[v._uuid];
              this.geometry = new PX.ConvexMeshGeometry(convexMesh, meshScale, createMeshGeometryFlags(0, true));
            } else {
              if (PX.MESH_STATIC[v._uuid] == null) {
                const cooking = PhysXInstance.cooking;
                PX.MESH_STATIC[v._uuid] = createTriangleMesh(posBuf, indBuf, cooking, physics);
              }
              const trimesh = PX.MESH_STATIC[v._uuid];
              this.geometry = new PX.TriangleMeshGeometry(trimesh, meshScale, createMeshGeometryFlags(0, false));
            }
            this.updateGeometry();
            this._impl = physics.createShape(this.geometry, pxmat, true, this._flags);
            this.addToBody();
            addReference(this, this._impl); //in case setMesh is called after initialization
          }
        }
        get collider() {
          return this._collider;
        }
        onComponentSet() {
          this.setMesh(this.collider.mesh);
        }
        updateScale() {
          this.updateGeometry();
          this.setCenter(this._collider.center);
        }
        updateGeometry() {
          const meshScale = PhysXShape.MESH_SCALE;
          meshScale.setScale(this.collider.node.worldScale);
          meshScale.setRotation(Quat.IDENTITY);
          this.geometry.setScale(meshScale);
        }

        /* override */

        setMaterial(v) {
          if (this._impl) super.setMaterial(v);
        }
        setCenter(v) {
          if (this._impl) super.setCenter(v);
        }
        setAsTrigger(v) {
          if (this._impl) super.setAsTrigger(v);
        }
        setFilerData(v) {
          if (this._impl) super.setFilerData(v);
        }
        addToBody() {
          if (this._impl) super.addToBody();
        }
        removeFromBody() {
          if (this._impl) super.removeFromBody();
        }
      });
    }
  };
});