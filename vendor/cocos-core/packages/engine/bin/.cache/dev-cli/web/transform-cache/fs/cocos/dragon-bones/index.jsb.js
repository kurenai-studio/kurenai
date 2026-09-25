System.register("q-bundled:///fs/cocos/dragon-bones/index.jsb.js", ["./DragonBonesAsset.js", "./DragonBonesAtlasAsset.js", "./ArmatureDisplay.js", "./AttachUtil.js", "./assembler/index.js"], function (_export, _context) {
  "use strict";

  var ExtensionType, DragonBonesEventType, EventType, AnimationFadeOutMode, dragonBones, Slot, Matrix, BaseObject, BoundingBoxData, PolygonBoundingBoxData, Transform, Animation, TextureData, CCTextureData, BaseFactory, CCFactory, WorldClock, TextureAtlasData, CCArmatureDisplay, AnimationState, BoneData, EllipseBoundingBoxData, ArmatureData, CCTextureAtlasData, TransformObject, CCSlot, Armature, Bone, RectangleBoundingBoxData, ArmatureCacheMgr, SkinData, EventObject, SlotData, DragonBonesData, AnimationData, CCArmatureCacheDisplay;
  return {
    setters: [function (_DragonBonesAssetJs) {
      var _exportObj = {};
      for (var _key in _DragonBonesAssetJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _DragonBonesAssetJs[_key];
      }
      _export(_exportObj);
    }, function (_DragonBonesAtlasAssetJs) {
      var _exportObj2 = {};
      for (var _key2 in _DragonBonesAtlasAssetJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _DragonBonesAtlasAssetJs[_key2];
      }
      _export(_exportObj2);
    }, function (_ArmatureDisplayJs) {
      var _exportObj3 = {};
      for (var _key3 in _ArmatureDisplayJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _ArmatureDisplayJs[_key3];
      }
      _export(_exportObj3);
    }, function (_AttachUtilJs) {
      var _exportObj4 = {};
      for (var _key4 in _AttachUtilJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _AttachUtilJs[_key4];
      }
      _export(_exportObj4);
    }, function (_assemblerIndexJs) {
      var _exportObj5 = {};
      for (var _key5 in _assemblerIndexJs) {
        if (_key5 !== "default" && _key5 !== "__esModule") _exportObj5[_key5] = _assemblerIndexJs[_key5];
      }
      _export(_exportObj5);
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
       * @engineInternal Since v3.7.2, this is an engine private enum type.
       * @deprecated Since v3.7.2, will be removed in the future.
       */
      _export("DragonBonesEventType", DragonBonesEventType = /*#__PURE__*/function (DragonBonesEventType) {
        DragonBonesEventType[DragonBonesEventType["Frame"] = 0] = "Frame";
        DragonBonesEventType[DragonBonesEventType["Sound"] = 1] = "Sound";
        return DragonBonesEventType;
      }({})); // To keep the compatibilty
      _export("EventType", EventType = DragonBonesEventType);
      /**
       * @engineInternal Since v3.7.2, this is an engine private enum type.
       * @deprecated Since v3.7.2, will be removed in the future.
       */
      _export("AnimationFadeOutMode", AnimationFadeOutMode = /*#__PURE__*/function (AnimationFadeOutMode) {
        AnimationFadeOutMode[AnimationFadeOutMode["None"] = 0] = "None";
        AnimationFadeOutMode[AnimationFadeOutMode["SameLayer"] = 1] = "SameLayer";
        AnimationFadeOutMode[AnimationFadeOutMode["SameGroup"] = 2] = "SameGroup";
        AnimationFadeOutMode[AnimationFadeOutMode["SameLayerAndGroup"] = 3] = "SameLayerAndGroup";
        AnimationFadeOutMode[AnimationFadeOutMode["All"] = 4] = "All";
        return AnimationFadeOutMode;
      }({}));
      dragonBones = globalThis.dragonBones;
      _export("Slot", Slot = dragonBones.Slot);
      _export("Matrix", Matrix = dragonBones.Matrix);
      _export("BaseObject", BaseObject = dragonBones.BaseObject);
      _export("BoundingBoxData", BoundingBoxData = dragonBones.BoundingBoxData);
      _export("PolygonBoundingBoxData", PolygonBoundingBoxData = dragonBones.PolygonBoundingBoxData);
      _export("Transform", Transform = dragonBones.Transform);
      _export("Animation", Animation = dragonBones.Animation);
      _export("TextureData", TextureData = dragonBones.TextureData);
      _export("CCTextureData", CCTextureData = dragonBones.CCTextureData);
      _export("BaseFactory", BaseFactory = dragonBones.BaseFactory);
      _export("CCFactory", CCFactory = dragonBones.CCFactory);
      _export("WorldClock", WorldClock = dragonBones.WorldClock);
      _export("TextureAtlasData", TextureAtlasData = dragonBones.TextureAtlasData);
      _export("CCArmatureDisplay", CCArmatureDisplay = dragonBones.CCArmatureDisplay);
      _export("AnimationState", AnimationState = dragonBones.AnimationState);
      _export("BoneData", BoneData = dragonBones.BoneData);
      _export("EllipseBoundingBoxData", EllipseBoundingBoxData = dragonBones.EllipseBoundingBoxData);
      _export("ArmatureData", ArmatureData = dragonBones.ArmatureData);
      _export("CCTextureAtlasData", CCTextureAtlasData = dragonBones.CCTextureAtlasData);
      _export("TransformObject", TransformObject = dragonBones.TransformObject);
      _export("CCSlot", CCSlot = dragonBones.CCSlot);
      _export("Armature", Armature = dragonBones.Armature);
      _export("Bone", Bone = dragonBones.Bone);
      _export("RectangleBoundingBoxData", RectangleBoundingBoxData = dragonBones.RectangleBoundingBoxData);
      _export("ArmatureCacheMgr", ArmatureCacheMgr = dragonBones.ArmatureCacheMgr);
      _export("SkinData", SkinData = dragonBones.SkinData);
      _export("EventObject", EventObject = dragonBones.EventObject);
      _export("SlotData", SlotData = dragonBones.SlotData);
      _export("DragonBonesData", DragonBonesData = dragonBones.DragonBonesData);
      _export("AnimationData", AnimationData = dragonBones.AnimationData);
      _export("CCArmatureCacheDisplay", CCArmatureCacheDisplay = dragonBones.CCArmatureCacheDisplay);
    }
  };
});