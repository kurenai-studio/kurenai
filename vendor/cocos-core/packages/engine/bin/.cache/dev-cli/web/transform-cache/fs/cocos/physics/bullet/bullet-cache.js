System.register("q-bundled:///fs/cocos/physics/bullet/bullet-cache.js", ["../../core/index.js", "./instantiated.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, Mat4, Color, bt, btCache, BulletCache, TriggerEventObject, CollisionEventObject, CharacterTriggerEventObject, CC_V3_0, CC_V3_1, CC_V3_2, CC_QUAT_0, CC_QUAT_1, CC_MAT4_0, CC_MAT4_1, CC_COLOR_0;
  _export("BulletCache", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      Mat4 = _coreIndexJs.Mat4;
      Color = _coreIndexJs.Color;
    }, function (_instantiatedJs) {
      bt = _instantiatedJs.bt;
      btCache = _instantiatedJs.btCache;
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
      _export("TriggerEventObject", TriggerEventObject = {
        type: 'onTriggerEnter',
        selfCollider: null,
        otherCollider: null,
        impl: null
      });
      _export("CollisionEventObject", CollisionEventObject = {
        type: 'onCollisionEnter',
        selfCollider: null,
        otherCollider: null,
        contacts: [],
        impl: null
      });
      _export("CharacterTriggerEventObject", CharacterTriggerEventObject = {
        type: 'onControllerTriggerEnter',
        collider: null,
        characterController: null,
        impl: null
      });
      _export("BulletCache", BulletCache = class BulletCache {
        constructor() {
          this.BT_TRANSFORM_0 = bt.Transform_new();
          this.BT_TRANSFORM_1 = bt.Transform_new();
          this.BT_V3_0 = bt.Vec3_new(0, 0, 0);
          this.BT_V3_1 = bt.Vec3_new(0, 0, 0);
          this.BT_V3_2 = bt.Vec3_new(0, 0, 0);
          this.BT_QUAT_0 = bt.Quat_new(0, 0, 0, 1);
        }
        static get instance() {
          if (BulletCache._instance == null) BulletCache._instance = new BulletCache();
          return BulletCache._instance;
        }
        static setWrapper(impl, type, wrap) {
          if (!this.ROOT[type]) this.ROOT[type] = {};
          this.ROOT[type][impl] = wrap;
        }
        static delWrapper(impl, type) {
          delete this.ROOT[type][impl];
        }
        static getWrapper(ptr, type) {
          return this.ROOT[type][ptr];
        }
        static isNotEmptyShape(ptr) {
          return ptr !== bt.EmptyShape_static();
        }
      });
      BulletCache._instance = void 0;
      BulletCache.ROOT = {};
      BulletCache.world = null;
      _export("CC_V3_0", CC_V3_0 = new Vec3());
      _export("CC_V3_1", CC_V3_1 = new Vec3());
      _export("CC_V3_2", CC_V3_2 = new Vec3());
      _export("CC_QUAT_0", CC_QUAT_0 = new Quat());
      _export("CC_QUAT_1", CC_QUAT_1 = new Quat());
      _export("CC_MAT4_0", CC_MAT4_0 = new Mat4());
      _export("CC_MAT4_1", CC_MAT4_1 = new Mat4());
      _export("CC_COLOR_0", CC_COLOR_0 = new Color());
      btCache.CACHE = BulletCache;
    }
  };
});