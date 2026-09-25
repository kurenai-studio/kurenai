System.register("q-bundled:///fs/cocos/dragon-bones/index.js", ["./CCFactory.js", "./CCSlot.js", "./CCTextureData.js", "./CCArmatureDisplay.js", "./ArmatureCache.js", "./DragonBonesAsset.js", "./DragonBonesAtlasAsset.js", "./ArmatureDisplay.js", "./AttachUtil.js", "./assembler/index.js", "@cocos/dragonbones-js"], function (_export, _context) {
  "use strict";

  var ExtensionType, DragonBonesEventType, EventType, AnimationFadeOutMode;
  return {
    setters: [function (_CCFactoryJs) {
      var _exportObj = {};
      for (var _key in _CCFactoryJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _CCFactoryJs[_key];
      }
      _export(_exportObj);
    }, function (_CCSlotJs) {
      var _exportObj2 = {};
      for (var _key2 in _CCSlotJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _CCSlotJs[_key2];
      }
      _export(_exportObj2);
    }, function (_CCTextureDataJs) {
      var _exportObj3 = {};
      for (var _key3 in _CCTextureDataJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _CCTextureDataJs[_key3];
      }
      _export(_exportObj3);
    }, function (_CCArmatureDisplayJs) {
      var _exportObj4 = {};
      for (var _key4 in _CCArmatureDisplayJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _CCArmatureDisplayJs[_key4];
      }
      _export(_exportObj4);
    }, function (_ArmatureCacheJs) {
      var _exportObj5 = {};
      for (var _key5 in _ArmatureCacheJs) {
        if (_key5 !== "default" && _key5 !== "__esModule") _exportObj5[_key5] = _ArmatureCacheJs[_key5];
      }
      _export(_exportObj5);
    }, function (_DragonBonesAssetJs) {
      var _exportObj6 = {};
      for (var _key6 in _DragonBonesAssetJs) {
        if (_key6 !== "default" && _key6 !== "__esModule") _exportObj6[_key6] = _DragonBonesAssetJs[_key6];
      }
      _export(_exportObj6);
    }, function (_DragonBonesAtlasAssetJs) {
      var _exportObj7 = {};
      for (var _key7 in _DragonBonesAtlasAssetJs) {
        if (_key7 !== "default" && _key7 !== "__esModule") _exportObj7[_key7] = _DragonBonesAtlasAssetJs[_key7];
      }
      _export(_exportObj7);
    }, function (_ArmatureDisplayJs) {
      var _exportObj8 = {};
      for (var _key8 in _ArmatureDisplayJs) {
        if (_key8 !== "default" && _key8 !== "__esModule") _exportObj8[_key8] = _ArmatureDisplayJs[_key8];
      }
      _export(_exportObj8);
    }, function (_AttachUtilJs) {
      var _exportObj9 = {};
      for (var _key9 in _AttachUtilJs) {
        if (_key9 !== "default" && _key9 !== "__esModule") _exportObj9[_key9] = _AttachUtilJs[_key9];
      }
      _export(_exportObj9);
    }, function (_assemblerIndexJs) {
      var _exportObj0 = {};
      for (var _key0 in _assemblerIndexJs) {
        if (_key0 !== "default" && _key0 !== "__esModule") _exportObj0[_key0] = _assemblerIndexJs[_key0];
      }
      _export(_exportObj0);
    }, function (_cocosDragonbonesJs) {
      var _exportObj1 = {};
      for (var _key1 in _cocosDragonbonesJs) {
        if (_key1 !== "default" && _key1 !== "__esModule") _exportObj1[_key1] = _cocosDragonbonesJs[_key1];
      }
      _export(_exportObj1);
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
       * @engineInternal Since v3.7.2, this is an engine private enum type.
       * @deprecated Since v3.7.2, will be removed in the future.
       */
      _export("ExtensionType", ExtensionType = /*#__PURE__*/function (ExtensionType) {
        ExtensionType[ExtensionType["FFD"] = 0] = "FFD";
        ExtensionType[ExtensionType["AdjustColor"] = 10] = "AdjustColor";
        ExtensionType[ExtensionType["BevelFilter"] = 11] = "BevelFilter";
        ExtensionType[ExtensionType["BlurFilter"] = 12] = "BlurFilter";
        ExtensionType[ExtensionType["DropShadowFilter"] = 13] = "DropShadowFilter";
        ExtensionType[ExtensionType["GlowFilter"] = 14] = "GlowFilter";
        ExtensionType[ExtensionType["GradientBevelFilter"] = 15] = "GradientBevelFilter";
        ExtensionType[ExtensionType["GradientGlowFilter"] = 16] = "GradientGlowFilter";
        return ExtensionType;
      }({}));
      /**
       * @en Event type in dragonbones animation.
       * @zh 龙骨动画中的事件类型。
       */
      _export("DragonBonesEventType", DragonBonesEventType = /*#__PURE__*/function (DragonBonesEventType) {
        /**
         * @en Event about animation frame.
         * @zh 动画帧相关的事件。
         */
        DragonBonesEventType[DragonBonesEventType["Frame"] = 0] = "Frame";
        /**
         * @en Event about sound.
         * @zh 声音相关的事件。
         */
        DragonBonesEventType[DragonBonesEventType["Sound"] = 1] = "Sound";
        return DragonBonesEventType;
      }({})); // To keep the compatibility, don't use it internally, otherwise, enum value may be inlined to wrong value.
      // Use DragonBonesEventType instead.
      _export("EventType", EventType = DragonBonesEventType);
      /**
       * @en Animation fade out mode.
       * @zh 动画淡出模式。
       */
      _export("AnimationFadeOutMode", AnimationFadeOutMode = /*#__PURE__*/function (AnimationFadeOutMode) {
        AnimationFadeOutMode[AnimationFadeOutMode["None"] = 0] = "None";
        /**
         * @en Fade out the animation states of the same layer.
         * @zh 淡出同层的动画状态。
         */
        AnimationFadeOutMode[AnimationFadeOutMode["SameLayer"] = 1] = "SameLayer";
        /**
         * @en Fade out the animation states of the same group.
         * @zh 淡出同组的动画状态。
         */
        AnimationFadeOutMode[AnimationFadeOutMode["SameGroup"] = 2] = "SameGroup";
        /**
         * @en Fade out the animation states of the same layer and group.
         * @zh 淡出同层并且同组的动画状态。
         */
        AnimationFadeOutMode[AnimationFadeOutMode["SameLayerAndGroup"] = 3] = "SameLayerAndGroup";
        /**
         * @en Fade out of all animation states.
         * @zh 淡出所有的动画状态。
         */
        AnimationFadeOutMode[AnimationFadeOutMode["All"] = 4] = "All";
        return AnimationFadeOutMode;
      }({}));
    }
  };
});