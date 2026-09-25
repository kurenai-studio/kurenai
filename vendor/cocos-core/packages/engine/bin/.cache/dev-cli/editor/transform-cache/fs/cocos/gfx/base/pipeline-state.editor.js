System.register("q-bundled:///fs/cocos/gfx/base/pipeline-state.editor.js", ["../../core/data/decorators/index.js", "./pipeline-state.js", "./define.js", "../../rendering/define.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, type, editable, RasterizerState, DepthStencilState, BlendTarget, PolygonMode, ShadeModel, CullMode, ComparisonFunc, StencilOp, BlendFactor, BlendOp, ColorMask, PrimitiveMode, DynamicStateFlagBit, RenderPassStage, CCString, Enum, Color, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _class3, _class4, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _class5, _class6, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _dec21, _dec22, _class7, _class8, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _class9, _class0, _descriptor41, _descriptor42, _descriptor43, _descriptor44, _descriptor45, _descriptor46, _descriptor47, _descriptor48, _descriptor49, toEnum, RasterizerStateEditor, DepthStencilStateEditor, BlendTargetEditor, BlendStateEditor, PassStatesEditor;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /*
   Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.
  
   https://www.cocos.com/
  
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated engine source code (the "Software"), a limited,
   worldwide, royalty-free, non-assignable, revocable and non-exclusive license
   to use Cocos Creator solely to develop games on your target platforms. You shall
   not use Cocos Creator software for developing other software or tools that's
   used for developing games. You are not granted to publish, distribute,
   sublicense, and/or sell copies of Cocos Creator.
  
   The software or tools in this License Agreement are licensed, not sold.
   Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.
  
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
   */

  function isNumber(obj) {
    return typeof obj === 'number' && !isNaN(obj);
  }
  function getEnumData(enumObj) {
    const enumData = {};
    Object.keys(enumObj).forEach(key => {
      if (!isNumber(Number(key))) {
        enumData[key] = enumObj[key];
      }
    });
    return enumData;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_pipelineStateJs) {
      RasterizerState = _pipelineStateJs.RasterizerState;
      DepthStencilState = _pipelineStateJs.DepthStencilState;
      BlendTarget = _pipelineStateJs.BlendTarget;
    }, function (_defineJs) {
      PolygonMode = _defineJs.PolygonMode;
      ShadeModel = _defineJs.ShadeModel;
      CullMode = _defineJs.CullMode;
      ComparisonFunc = _defineJs.ComparisonFunc;
      StencilOp = _defineJs.StencilOp;
      BlendFactor = _defineJs.BlendFactor;
      BlendOp = _defineJs.BlendOp;
      ColorMask = _defineJs.ColorMask;
      PrimitiveMode = _defineJs.PrimitiveMode;
      DynamicStateFlagBit = _defineJs.DynamicStateFlagBit;
    }, function (_renderingDefineJs) {
      RenderPassStage = _renderingDefineJs.RenderPassStage;
    }, function (_coreIndexJs) {
      CCString = _coreIndexJs.CCString;
      Enum = _coreIndexJs.Enum;
      Color = _coreIndexJs.Color;
    }],
    execute: function () {
      toEnum = (() => {
        const copyAsCCEnum = e => Enum(getEnumData(e));
        return {
          PolygonMode: copyAsCCEnum(PolygonMode),
          ShadeModel: copyAsCCEnum(ShadeModel),
          CullMode: copyAsCCEnum(CullMode),
          ComparisonFunc: copyAsCCEnum(ComparisonFunc),
          StencilOp: copyAsCCEnum(StencilOp),
          PrimitiveMode: copyAsCCEnum(PrimitiveMode),
          RenderPassStage: copyAsCCEnum(RenderPassStage),
          DynamicStateFlagBit: copyAsCCEnum(DynamicStateFlagBit)
        };
      })();
      _export("RasterizerStateEditor", RasterizerStateEditor = (_dec = ccclass('RasterizerState'), _dec2 = type(toEnum.PolygonMode), _dec3 = type(toEnum.ShadeModel), _dec4 = type(toEnum.CullMode), _dec(_class = (_class2 = class RasterizerStateEditor extends RasterizerState {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "isDiscard", _descriptor, this);
          _initializerDefineProperty(this, "polygonMode", _descriptor2, this);
          _initializerDefineProperty(this, "shadeModel", _descriptor3, this);
          _initializerDefineProperty(this, "cullMode", _descriptor4, this);
          _initializerDefineProperty(this, "isFrontFaceCCW", _descriptor5, this);
          _initializerDefineProperty(this, "depthBias", _descriptor6, this);
          _initializerDefineProperty(this, "depthBiasClamp", _descriptor7, this);
          _initializerDefineProperty(this, "depthBiasSlop", _descriptor8, this);
          _initializerDefineProperty(this, "isDepthClip", _descriptor9, this);
          _initializerDefineProperty(this, "isMultisample", _descriptor0, this);
          _initializerDefineProperty(this, "lineWidth", _descriptor1, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "isDiscard", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "polygonMode", [serializable, editable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PolygonMode.FILL;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "shadeModel", [_dec3, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ShadeModel.GOURAND;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "cullMode", [_dec4, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CullMode.BACK;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isFrontFaceCCW", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "depthBias", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "depthBiasClamp", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "depthBiasSlop", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "isDepthClip", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "isMultisample", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "lineWidth", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class2)) || _class));
      _export("DepthStencilStateEditor", DepthStencilStateEditor = (_dec5 = ccclass('DepthStencilState'), _dec6 = type(toEnum.ComparisonFunc), _dec7 = type(toEnum.ComparisonFunc), _dec8 = type(toEnum.StencilOp), _dec9 = type(toEnum.StencilOp), _dec0 = type(toEnum.StencilOp), _dec1 = type(toEnum.ComparisonFunc), _dec10 = type(toEnum.StencilOp), _dec11 = type(toEnum.StencilOp), _dec12 = type(toEnum.StencilOp), _dec5(_class3 = (_class4 = class DepthStencilStateEditor extends DepthStencilState {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "depthTest", _descriptor10, this);
          _initializerDefineProperty(this, "depthWrite", _descriptor11, this);
          _initializerDefineProperty(this, "depthFunc", _descriptor12, this);
          _initializerDefineProperty(this, "stencilTestFront", _descriptor13, this);
          _initializerDefineProperty(this, "stencilFuncFront", _descriptor14, this);
          _initializerDefineProperty(this, "stencilReadMaskFront", _descriptor15, this);
          _initializerDefineProperty(this, "stencilWriteMaskFront", _descriptor16, this);
          _initializerDefineProperty(this, "stencilFailOpFront", _descriptor17, this);
          _initializerDefineProperty(this, "stencilZFailOpFront", _descriptor18, this);
          _initializerDefineProperty(this, "stencilPassOpFront", _descriptor19, this);
          _initializerDefineProperty(this, "stencilRefFront", _descriptor20, this);
          _initializerDefineProperty(this, "stencilTestBack", _descriptor21, this);
          _initializerDefineProperty(this, "stencilFuncBack", _descriptor22, this);
          _initializerDefineProperty(this, "stencilReadMaskBack", _descriptor23, this);
          _initializerDefineProperty(this, "stencilWriteMaskBack", _descriptor24, this);
          _initializerDefineProperty(this, "stencilFailOpBack", _descriptor25, this);
          _initializerDefineProperty(this, "stencilZFailOpBack", _descriptor26, this);
          _initializerDefineProperty(this, "stencilPassOpBack", _descriptor27, this);
          _initializerDefineProperty(this, "stencilRefBack", _descriptor28, this);
        }
      }, _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "depthTest", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "depthWrite", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "depthFunc", [_dec6, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ComparisonFunc.LESS;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "stencilTestFront", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class4.prototype, "stencilFuncFront", [_dec7, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ComparisonFunc.ALWAYS;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class4.prototype, "stencilReadMaskFront", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0xffffffff;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class4.prototype, "stencilWriteMaskFront", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0xffffffff;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class4.prototype, "stencilFailOpFront", [_dec8, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class4.prototype, "stencilZFailOpFront", [_dec9, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class4.prototype, "stencilPassOpFront", [_dec0, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class4.prototype, "stencilRefFront", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class4.prototype, "stencilTestBack", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class4.prototype, "stencilFuncBack", [_dec1, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ComparisonFunc.ALWAYS;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class4.prototype, "stencilReadMaskBack", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0xffffffff;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class4.prototype, "stencilWriteMaskBack", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0xffffffff;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class4.prototype, "stencilFailOpBack", [_dec10, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class4.prototype, "stencilZFailOpBack", [_dec11, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class4.prototype, "stencilPassOpBack", [_dec12, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return StencilOp.KEEP;
        }
      }), _descriptor28 = _applyDecoratedDescriptor(_class4.prototype, "stencilRefBack", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _class4)) || _class3)); // description of pipeline-state.ts class BlendTarget
      _export("BlendTargetEditor", BlendTargetEditor = (_dec13 = ccclass('BlendTarget'), _dec14 = type(BlendFactor), _dec15 = type(BlendFactor), _dec16 = type(BlendOp), _dec17 = type(BlendFactor), _dec18 = type(BlendFactor), _dec19 = type(BlendOp), _dec20 = type(ColorMask), _dec13(_class5 = (_class6 = class BlendTargetEditor extends BlendTarget {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "blend", _descriptor29, this);
          _initializerDefineProperty(this, "blendSrc", _descriptor30, this);
          _initializerDefineProperty(this, "blendDst", _descriptor31, this);
          _initializerDefineProperty(this, "blendEq", _descriptor32, this);
          _initializerDefineProperty(this, "blendSrcAlpha", _descriptor33, this);
          _initializerDefineProperty(this, "blendDstAlpha", _descriptor34, this);
          _initializerDefineProperty(this, "blendAlphaEq", _descriptor35, this);
          _initializerDefineProperty(this, "blendColorMask", _descriptor36, this);
        }
      }, _descriptor29 = _applyDecoratedDescriptor(_class6.prototype, "blend", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor30 = _applyDecoratedDescriptor(_class6.prototype, "blendSrc", [_dec14, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.ONE;
        }
      }), _descriptor31 = _applyDecoratedDescriptor(_class6.prototype, "blendDst", [_dec15, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.ZERO;
        }
      }), _descriptor32 = _applyDecoratedDescriptor(_class6.prototype, "blendEq", [_dec16, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendOp.ADD;
        }
      }), _descriptor33 = _applyDecoratedDescriptor(_class6.prototype, "blendSrcAlpha", [_dec17, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.ONE;
        }
      }), _descriptor34 = _applyDecoratedDescriptor(_class6.prototype, "blendDstAlpha", [_dec18, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.ZERO;
        }
      }), _descriptor35 = _applyDecoratedDescriptor(_class6.prototype, "blendAlphaEq", [_dec19, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendOp.ADD;
        }
      }), _descriptor36 = _applyDecoratedDescriptor(_class6.prototype, "blendColorMask", [_dec20, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ColorMask.ALL;
        }
      }), _class6)) || _class5));
      _export("BlendStateEditor", BlendStateEditor = (_dec21 = ccclass('BlendState'), _dec22 = type([BlendTargetEditor]), _dec21(_class7 = (_class8 = class BlendStateEditor {
        constructor() {
          _initializerDefineProperty(this, "isA2C", _descriptor37, this);
          _initializerDefineProperty(this, "isIndepend", _descriptor38, this);
          _initializerDefineProperty(this, "blendColor", _descriptor39, this);
          _initializerDefineProperty(this, "targets", _descriptor40, this);
        }
        init(blendState) {
          let length = 1;
          if (blendState && blendState.targets) {
            length = blendState.targets.length;
          }
          for (let i = 0; i < length; i++) {
            this.targets.push(new BlendTargetEditor());
          }
        }
      }, _descriptor37 = _applyDecoratedDescriptor(_class8.prototype, "isA2C", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor38 = _applyDecoratedDescriptor(_class8.prototype, "isIndepend", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor39 = _applyDecoratedDescriptor(_class8.prototype, "blendColor", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor40 = _applyDecoratedDescriptor(_class8.prototype, "targets", [_dec22, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class8)) || _class7));
      _export("PassStatesEditor", PassStatesEditor = (_dec23 = ccclass('PassStates'), _dec24 = type(toEnum.PrimitiveMode), _dec25 = type(toEnum.RenderPassStage), _dec26 = type(RasterizerStateEditor), _dec27 = type(DepthStencilStateEditor), _dec28 = type(BlendStateEditor), _dec29 = type([toEnum.DynamicStateFlagBit]), _dec30 = type([CCString]), _dec23(_class9 = (_class0 = class PassStatesEditor {
        constructor() {
          _initializerDefineProperty(this, "priority", _descriptor41, this);
          _initializerDefineProperty(this, "primitive", _descriptor42, this);
          _initializerDefineProperty(this, "stage", _descriptor43, this);
          _initializerDefineProperty(this, "rasterizerState", _descriptor44, this);
          _initializerDefineProperty(this, "depthStencilState", _descriptor45, this);
          _initializerDefineProperty(this, "blendState", _descriptor46, this);
          _initializerDefineProperty(this, "dynamics", _descriptor47, this);
          _initializerDefineProperty(this, "customizations", _descriptor48, this);
          _initializerDefineProperty(this, "phase", _descriptor49, this);
        }
      }, _descriptor41 = _applyDecoratedDescriptor(_class0.prototype, "priority", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 128;
        }
      }), _descriptor42 = _applyDecoratedDescriptor(_class0.prototype, "primitive", [_dec24, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PrimitiveMode.TRIANGLE_LIST;
        }
      }), _descriptor43 = _applyDecoratedDescriptor(_class0.prototype, "stage", [_dec25, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return RenderPassStage.DEFAULT;
        }
      }), _descriptor44 = _applyDecoratedDescriptor(_class0.prototype, "rasterizerState", [_dec26, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new RasterizerStateEditor();
        }
      }), _descriptor45 = _applyDecoratedDescriptor(_class0.prototype, "depthStencilState", [_dec27, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new DepthStencilStateEditor();
        }
      }), _descriptor46 = _applyDecoratedDescriptor(_class0.prototype, "blendState", [_dec28, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new BlendStateEditor();
        }
      }), _descriptor47 = _applyDecoratedDescriptor(_class0.prototype, "dynamics", [_dec29, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor48 = _applyDecoratedDescriptor(_class0.prototype, "customizations", [_dec30, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor49 = _applyDecoratedDescriptor(_class0.prototype, "phase", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class0)) || _class9));
    }
  };
});