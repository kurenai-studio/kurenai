System.register("q-bundled:///fs/cocos/spine/index.jsb.js", ["../core/index.js", "../core/global-exports.js", "./lib/spine-core.js", "./lib/spine-version.js", "./skeleton.js", "./skeleton-data.js", "./assembler/index.js"], function (_export, _context) {
  "use strict";

  var ccenum, legacyCC, spineLib, SPINE_VERSION, spine, VertexEffectDelegate, ATTACHMENT_TYPE, AnimationEventType;
  function loadWasmModuleSpine() {
    return Promise.resolve();
  }
  _export("loadWasmModuleSpine", loadWasmModuleSpine);
  return {
    setters: [function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_libSpineCoreJs) {
      spineLib = _libSpineCoreJs.default;
    }, function (_libSpineVersionJs) {
      SPINE_VERSION = _libSpineVersionJs.SPINE_VERSION;
      var _exportObj = {};
      for (var _key in _libSpineVersionJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _libSpineVersionJs[_key];
      }
      _export(_exportObj);
    }, function (_skeletonJs) {
      var _exportObj2 = {};
      for (var _key2 in _skeletonJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _skeletonJs[_key2];
      }
      _export(_exportObj2);
    }, function (_skeletonDataJs) {
      var _exportObj3 = {};
      for (var _key3 in _skeletonDataJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _skeletonDataJs[_key3];
      }
      _export(_exportObj3);
    }, function (_assemblerIndexJs) {
      var _exportObj4 = {};
      for (var _key4 in _assemblerIndexJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _assemblerIndexJs[_key4];
      }
      _export(_exportObj4);
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
       * The global main namespace of Spine, all classes, functions,
       * properties and constants of Spine are defined in this namespace
       * @zh
       * Spine 的全局的命名空间，
       * 与 Spine 相关的所有的类，函数，属性，常量都在这个命名空间中定义。
       * @module sp
       * @main sp
       */
      /*
       * Reference:
       * http://esotericsoftware.com/spine-runtime-terminology
       * http://esotericsoftware.com/files/runtime-diagram.png
       * http://en.esotericsoftware.com/spine-using-runtimes
       */
      _export("spine", spine = globalThis.spine);
      spine.EventType = spineLib.EventType;
      _export("VertexEffectDelegate", VertexEffectDelegate = spine.VertexEffectDelegate);
      /**
       * @en
       * The attachment type of spine. It contains four types: REGION(0), BOUNDING_BOX(1), MESH(2) and SKINNED_MESH.
       * @zh
       * Attachment 类型枚举。类型包括 REGION，BOUNDING_BOX，MESH，SKINNED_MESH。
       */
      _export("ATTACHMENT_TYPE", ATTACHMENT_TYPE = /*#__PURE__*/function (ATTACHMENT_TYPE) {
        ATTACHMENT_TYPE[ATTACHMENT_TYPE["REGION"] = 0] = "REGION";
        ATTACHMENT_TYPE[ATTACHMENT_TYPE["BOUNDING_BOX"] = 1] = "BOUNDING_BOX";
        ATTACHMENT_TYPE[ATTACHMENT_TYPE["MESH"] = 2] = "MESH";
        ATTACHMENT_TYPE[ATTACHMENT_TYPE["SKINNED_MESH"] = 3] = "SKINNED_MESH";
        return ATTACHMENT_TYPE;
      }({}));
      ccenum(ATTACHMENT_TYPE);

      /**
       * @en The event type of spine skeleton animation.
       * @zh 骨骼动画事件类型。
       * @enum AnimationEventType
       */
      _export("AnimationEventType", AnimationEventType = /*#__PURE__*/function (AnimationEventType) {
        /**
         * @en The play spine skeleton animation start type.
         * @zh 开始播放骨骼动画。
         * @property {Number} START
         */
        AnimationEventType[AnimationEventType["START"] = 0] = "START";
        /**
         * @en Another entry has replaced this entry as the current entry. This entry may continue being applied for mixing.
         * @zh 当前的 entry 被其他的 entry 替换。当使用 mixing 时，当前的 entry 会继续运行。
         */
        AnimationEventType[AnimationEventType["INTERRUPT"] = 1] = "INTERRUPT";
        /**
         * @en The play spine skeleton animation finish type.
         * @zh 播放骨骼动画结束。
         * @property {Number} END
         */
        AnimationEventType[AnimationEventType["END"] = 2] = "END";
        /**
         * @en The play spine skeleton animation complete type.
         * @zh 播放骨骼动画完成。
         * @property {Number} COMPLETE
         */
        AnimationEventType[AnimationEventType["COMPLETE"] = 3] = "COMPLETE";
        /**
         * @en The entry will be disposed.
         * @zh entry 将被销毁。
         */
        AnimationEventType[AnimationEventType["DISPOSE"] = 4] = "DISPOSE";
        /**
         * @en The spine skeleton animation event type.
         * @zh 骨骼动画事件。
         * @property {Number} EVENT
         */
        AnimationEventType[AnimationEventType["EVENT"] = 5] = "EVENT";
        return AnimationEventType;
      }({}));
      ccenum(AnimationEventType);
      legacyCC.internal.SpineAnimationEventType = AnimationEventType;
      legacyCC.internal.SPINE_VERSION = SPINE_VERSION;
    }
  };
});