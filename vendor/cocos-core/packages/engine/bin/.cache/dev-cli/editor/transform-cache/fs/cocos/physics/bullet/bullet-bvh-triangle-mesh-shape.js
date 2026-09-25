System.register("q-bundled:///fs/cocos/physics/bullet/bullet-bvh-triangle-mesh-shape.js", ["./instantiated.js", "./bullet-utils.js"], function (_export, _context) {
  "use strict";

  var bt, EBulletType, cocos2BulletTriMesh, BulletBvhTriangleMeshShape, _BulletBvhTriangleMeshShape;
  _export("BulletBvhTriangleMeshShape", void 0);
  return {
    setters: [function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      EBulletType = _instantiatedJs.EBulletType;
    }, function (_bulletUtilsJs) {
      cocos2BulletTriMesh = _bulletUtilsJs.cocos2BulletTriMesh;
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
      _export("BulletBvhTriangleMeshShape", BulletBvhTriangleMeshShape = class BulletBvhTriangleMeshShape {
        static getBulletBvhTriangleMeshShape(key, mesh) {
          let newBulletBvhTriangleMeshShape;
          if (BulletBvhTriangleMeshShape.BulletBvhTriangleMeshShapeMap.has(key)) {
            //can be improved
            newBulletBvhTriangleMeshShape = BulletBvhTriangleMeshShape.BulletBvhTriangleMeshShapeMap.get(key);
            newBulletBvhTriangleMeshShape.reference = true;
          } else {
            newBulletBvhTriangleMeshShape = new BulletBvhTriangleMeshShape(key, mesh);
            BulletBvhTriangleMeshShape.BulletBvhTriangleMeshShapeMap.set(key, newBulletBvhTriangleMeshShape);
          }
          return newBulletBvhTriangleMeshShape;
        }
        set reference(v) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          v ? this.ref++ : this.ref--;
          if (this.ref === 0) {
            this.destroy();
          }
        }
        constructor(key, mesh) {
          this.key = void 0;
          this.ref = 0;
          this.bulletBvhTriangleMeshShapePtr = void 0;
          this.btTriangleMeshPtr = 0;
          this.reference = true;
          this.key = key;
          this.btTriangleMeshPtr = bt.TriangleMesh_new();
          cocos2BulletTriMesh(this.btTriangleMeshPtr, mesh);
          this.bulletBvhTriangleMeshShapePtr = bt.BvhTriangleMeshShape_new(this.btTriangleMeshPtr, true, true);
        }
        destroy() {
          if (this.bulletBvhTriangleMeshShapePtr) {
            bt._safe_delete(this.bulletBvhTriangleMeshShapePtr, EBulletType.EBulletTypeCollisionShape);
          }
          if (this.btTriangleMeshPtr) {
            bt._safe_delete(this.btTriangleMeshPtr, EBulletType.EBulletTypeTriangleMesh);
          }
          BulletBvhTriangleMeshShape.BulletBvhTriangleMeshShapeMap.delete(this.key);
        }
      });
      _BulletBvhTriangleMeshShape = BulletBvhTriangleMeshShape;
      BulletBvhTriangleMeshShape.BulletBvhTriangleMeshShapeMap = new Map();
    }
  };
});