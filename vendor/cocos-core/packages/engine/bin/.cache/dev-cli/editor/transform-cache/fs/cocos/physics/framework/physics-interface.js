System.register("q-bundled:///fs/cocos/physics/framework/physics-interface.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, CharacterControllerContact;
  _export("CharacterControllerContact", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
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
      /**
       * @en
       * The definition of the triggering event.
       * @zh
       * 触发事件。
       */
      /**
       * @en
       * The value type definition of the trigger event.
       * @zh
       * 触发事件的值类型定义。
       */
      /**
       * @en
       * Signature definition of the callback function that triggers the event.
       * @zh
       * 触发事件的回调函数签名定义。
       */
      /**
       * @en
       * Collision information for collision events.
       * @zh
       * 碰撞事件的碰撞信息。
       */
      /**
       * @en
       * The definition of the collision event.
       * @zh
       * 碰撞事件。
       */
      /**
       * @en
       * Value type definitions for collision events.
       * @zh
       * 碰撞事件的值类型定义。
       */
      /**
       * @en
       * Callback function signature definition for collision events.
       * @zh
       * 碰撞事件的回调函数签名定义。
       */
      /**
       * @en
       * The definition of the trigger event of the character controller.
       * @zh
       * 角色控制器触发事件的值类型定义。
       */
      /**
       * @en
       * Value type definitions fot the collision events of character controller.
       * @zh
       * 角色控制器碰撞事件的值类型定义。
       */
      /**
       * @en
       * Contact information of the collision event of character controller.
       * @zh
       * 角色控制器碰撞事件的碰撞信息。
       */
      _export("CharacterControllerContact", CharacterControllerContact = class CharacterControllerContact {
        constructor() {
          /**
           * @en
           * Character Controller in collision.
           * @zh
           * 碰撞中的角色控制器。
           */
          /**
           * @en
           * Collider in collision.
           * @zh
           * 碰撞中的碰撞器。
           */
          /**
           * @en
           * The contact point in the world coordinate system.
           * @zh
           * 世界坐标系中的碰撞点。
           */
          this.worldPosition = new Vec3();
          /**
           * @en
           * The contact normal in the world coordinate system.
           * @zh
           * 世界坐标系中的碰撞法线。
           */
          this.worldNormal = new Vec3();
          /**
           * @en
           * Motion direction.
           * @zh
           * 移动方向。
           */
          this.motionDirection = new Vec3();
          /**
           * @en
           * Motion length.
           * @zh
           * 移动长度。
           */
          this.motionLength = 0;
        }
      });
    }
  };
});