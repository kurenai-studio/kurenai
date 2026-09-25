System.register("q-bundled:///fs/cocos/2d/framework/ui-renderer.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../../core/index.js", "../../asset/asset-manager/index.js", "../../asset/assets/index.js", "../../gfx/index.js", "../renderer/render-data.js", "./ui-transform.js", "../renderer/stencil-manager.js", "../../scene-graph/node-event.js", "../../misc/renderer.js", "../renderer/render-entity.js", "./ui-renderer-manager.js", "../renderer/render-draw-info.js", "../../game/index.js", "../../sorting/sorting-layers.js"], function (_export, _context) {
  "use strict";

  var DEBUG, EDITOR, JSB, USE_SORTING_2D, ccclass, executeInEditMode, requireComponent, type, displayOrder, serializable, override, visible, disallowAnimation, Color, assert, ccenum, cclegacy, builtinResMgr, Material, BlendFactor, BlendOp, ColorMask, RenderData, UITransform, Stage, NodeEventType, Renderer, RenderEntity, RenderEntityType, RenderEntityFillColorType, uiRendererManager, RenderDrawInfoType, director, SortingLayers, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _UIRenderer, InstanceMaterialType, UIRenderer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      JSB = _virtualInternal253AconstantsJs.JSB;
      USE_SORTING_2D = _virtualInternal253AconstantsJs.USE_SORTING_2D;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      override = _coreDataDecoratorsIndexJs.override;
      visible = _coreDataDecoratorsIndexJs.visible;
      disallowAnimation = _coreDataDecoratorsIndexJs.disallowAnimation;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      assert = _coreIndexJs.assert;
      ccenum = _coreIndexJs.ccenum;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_gfxIndexJs) {
      BlendFactor = _gfxIndexJs.BlendFactor;
      BlendOp = _gfxIndexJs.BlendOp;
      ColorMask = _gfxIndexJs.ColorMask;
    }, function (_rendererRenderDataJs) {
      RenderData = _rendererRenderDataJs.RenderData;
    }, function (_uiTransformJs) {
      UITransform = _uiTransformJs.UITransform;
    }, function (_rendererStencilManagerJs) {
      Stage = _rendererStencilManagerJs.Stage;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_miscRendererJs) {
      Renderer = _miscRendererJs.Renderer;
    }, function (_rendererRenderEntityJs) {
      RenderEntity = _rendererRenderEntityJs.RenderEntity;
      RenderEntityType = _rendererRenderEntityJs.RenderEntityType;
      RenderEntityFillColorType = _rendererRenderEntityJs.RenderEntityFillColorType;
    }, function (_uiRendererManagerJs) {
      uiRendererManager = _uiRendererManagerJs.uiRendererManager;
    }, function (_rendererRenderDrawInfoJs) {
      RenderDrawInfoType = _rendererRenderDrawInfoJs.RenderDrawInfoType;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
    }, function (_sortingSortingLayersJs) {
      SortingLayers = _sortingSortingLayersJs.SortingLayers;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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

      // hack
      ccenum(BlendFactor);
      ccenum(BlendOp);
      ccenum(ColorMask);

      /**
       * @en
       * The shader property type of the material after instantiation.
       *
       * @zh
       * 实例后的材质的着色器属性类型。
       */
      _export("InstanceMaterialType", InstanceMaterialType = /*#__PURE__*/function (InstanceMaterialType) {
        /**
         * @en
         * The shader only has color properties.
         *
         * @zh
         * 着色器只带颜色属性。
         */
        InstanceMaterialType[InstanceMaterialType["ADD_COLOR"] = 0] = "ADD_COLOR";
        /**
         * @en
         * The shader has color and texture properties.
         *
         * @zh
         * 着色器带颜色和贴图属性。
         */
        InstanceMaterialType[InstanceMaterialType["ADD_COLOR_AND_TEXTURE"] = 1] = "ADD_COLOR_AND_TEXTURE";
        /**
         * @en
         * The shader has color and texture properties and uses grayscale mode.
         *
         * @zh
         * 着色器带颜色和贴图属性,并使用灰度模式。
         */
        InstanceMaterialType[InstanceMaterialType["GRAYSCALE"] = 2] = "GRAYSCALE";
        /**
         * @en
         * The shader has color and texture properties and uses embedded alpha mode.
         *
         * @zh
         * 着色器带颜色和贴图属性,并使用透明通道分离贴图。
         */
        InstanceMaterialType[InstanceMaterialType["USE_ALPHA_SEPARATED"] = 3] = "USE_ALPHA_SEPARATED";
        /**
         * @en
         * The shader has color and texture properties and uses embedded alpha and grayscale mode.
         *
         * @zh
         * 着色器带颜色和贴图属性,并使用灰度模式。
         */
        InstanceMaterialType[InstanceMaterialType["USE_ALPHA_SEPARATED_AND_GRAY"] = 4] = "USE_ALPHA_SEPARATED_AND_GRAY";
        return InstanceMaterialType;
      }({}));
      /**
       * @en Base class for UI components which supports rendering features.
       * This component will setup NodeUIProperties.uiComp in its owner [[Node]]
       *
       * @zh 所有支持渲染的 UI 组件的基类。
       * 这个组件会设置 [[Node]] 上的 NodeUIProperties.uiComp。
       */
      _export("UIRenderer", UIRenderer = (_dec = ccclass('cc.UIRenderer'), _dec2 = requireComponent(UITransform), _dec3 = visible(false), _dec4 = type(Material), _dec5 = displayOrder(0), _dec6 = displayOrder(1), _dec7 = type(Material), _dec(_class = _dec2(_class = executeInEditMode(_class = (_class2 = (_UIRenderer = class UIRenderer extends Renderer {
        constructor() {
          super();
          this._renderData = null;
          _initializerDefineProperty(this, "_materials", _descriptor, this);
          _initializerDefineProperty(this, "_customMaterial", _descriptor2, this);
          _initializerDefineProperty(this, "_srcBlendFactor", _descriptor3, this);
          _initializerDefineProperty(this, "_dstBlendFactor", _descriptor4, this);
          _initializerDefineProperty(this, "_color", _descriptor5, this);
          this._stencilStage = Stage.DISABLED;
          this._assembler = null;
          this._postAssembler = null;
          this._renderFlag = true;
          this._instanceMaterialType = -1;
          this._srcBlendFactorCache = BlendFactor.SRC_ALPHA;
          this._dstBlendFactorCache = BlendFactor.ONE_MINUS_SRC_ALPHA;
          /**
           * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
           */
          this._dirtyVersion = -1;
          /**
           * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
           */
          this._internalId = -1;
          /**
           * @engineInternal
           * @mangle
           */
          this._flagChangedVersion = -1;
          this._priority = 0;
          /**
           * @en UI rendering component fill color type, COLOR means using color property value to fill, VERTEX means using vertex color value to fill.
           * @zh UI 渲染组件填充颜色类型，COLOR 表示使用 color 属性值填充，VERTEX 表示使用顶点颜色值填充。
           */
          this._fillColorType = RenderEntityFillColorType.COLOR;
          this._lastParent = null;
          this._renderEntity = this.createRenderEntity();
          if (USE_SORTING_2D) {
            this.priority = SortingLayers.getDefaultPriority();
          }
        }
        get sharedMaterials() {
          // if we don't create an array copy, the editor will modify the original array directly.
          return EDITOR && this._materials.slice() || this._materials;
        }
        set sharedMaterials(val) {
          for (let i = 0; i < val.length; i++) {
            if (val[i] !== this._materials[i]) {
              this.setSharedMaterial(val[i], i);
            }
          }
          if (val.length < this._materials.length) {
            for (let i = val.length; i < this._materials.length; i++) {
              this.setSharedMaterial(null, i);
            }
            this._materials.splice(val.length);
          }
        }

        /**
         * @en The customMaterial
         * @zh 用户自定材质
         */
        get customMaterial() {
          return this._customMaterial;
        }
        set customMaterial(val) {
          this._customMaterial = val;
          this.updateMaterial();
        }

        /**
         * @en Main color for rendering, it normally multiplies with texture color.
         * @zh 渲染颜色，一般情况下会和贴图颜色相乘。
         */
        get color() {
          return this._color;
        }
        set color(value) {
          if (this._color.equals(value)) {
            return;
          }
          this._color.set(value);
          this._updateColor();
          if (EDITOR) {
            const clone = this._color.clone();
            this.node.emit(NodeEventType.COLOR_CHANGED, clone);
          }
        }
        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get renderData() {
          return this._renderData;
        }
        /**
         * As can not set setter internal individually, so add setRenderData();
         * @engineInternal
         * @mangle
         */
        setRenderData(renderData) {
          this._renderData = renderData;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         * @en The component stencil stage (please do not any modification directly on this object)
         * @zh 组件模板缓冲状态 (注意：请不要直接修改它的值)
         */
        get stencilStage() {
          return this._stencilStage;
        }
        set stencilStage(val) {
          this._stencilStage = val;
          this._renderEntity.setStencilStage(val);
        }
        /**
         * @engineInternal
         * @internal
         */
        get srcBlendFactor() {
          return this._srcBlendFactor;
        }
        set srcBlendFactor(srcBlendFactor) {
          this._srcBlendFactor = srcBlendFactor;
        }
        get priority() {
          return this._priority;
        }
        set priority(val) {
          this._priority = val;
          if (JSB) {
            this._renderEntity.setPriority(val);
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get batcher() {
          return director.root.batcher2D;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get renderEntity() {
          if (DEBUG) {
            assert(Boolean(this._renderEntity), 'this._renderEntity should not be invalid');
          }
          return this._renderEntity;
        }
        /**
         * @engineInternal
         */
        getFillColorType() {
          return this._fillColorType;
        }

        /**
         * @engineInternal
         */
        setFillColorType(val) {
          this._fillColorType = val;
          if (JSB) {
            this._renderEntity.setFillColorType(val);
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        set _useVertexOpacity(val) {
          this.setFillColorType(RenderEntityFillColorType.VERTEX);
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get _useVertexOpacity() {
          return this._fillColorType === RenderEntityFillColorType.VERTEX;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get useVertexOpacity() {
          return this._fillColorType === RenderEntityFillColorType.VERTEX;
        }
        onLoad() {
          this._renderEntity.setNode(this.node);
        }
        __preload() {
          this.node._uiProps.uiComp = this;
          if (this._flushAssembler) {
            this._flushAssembler();
          }
        }
        onEnable() {
          this.node.on(NodeEventType.ANCHOR_CHANGED, this._nodeStateChange, this);
          this.node.on(NodeEventType.SIZE_CHANGED, this._nodeStateChange, this);
          this.node.on(NodeEventType.PARENT_CHANGED, this._colorDirty, this);
          // If the renderData is invalid, it needs to be rebuilt to recalculate the batch processing.
          if (!this._renderData && this._flushAssembler) {
            this._flushAssembler();
          }
          this.updateMaterial();
          this._colorDirty();
          uiRendererManager.addRenderer(this);
          this._markForUpdateRenderData();
        }

        // For Redo, Undo
        onRestore() {
          this.updateMaterial();
          // restore render data
          this._markForUpdateRenderData();
        }
        _destroyData() {
          this.destroyRenderData();
          if (this._materials) {
            for (let i = 0; i < this._materials.length; i++) {
              this.setSharedMaterial(null, i, true);
            }
          }
        }
        onDisable() {
          this.node.off(NodeEventType.ANCHOR_CHANGED, this._nodeStateChange, this);
          this.node.off(NodeEventType.SIZE_CHANGED, this._nodeStateChange, this);
          this.node.off(NodeEventType.PARENT_CHANGED, this._colorDirty, this);
          if (!this._keepRenderData) {
            this.destroyRenderData();
          }
          uiRendererManager.removeRenderer(this);
          this._renderFlag = false;
          this._renderEntity.enabled = false;
        }

        /**
         * Whether to keep render data when the component leaves the active hierarchy.
         * Retained-mode renderers may override this policy and keep their render data until
         * the content is explicitly cleared or the component is destroyed.
         */
        get _keepRenderData() {
          return false;
        }
        onDestroy() {
          this._renderEntity.setNode(null);
          if (this.node._uiProps.uiComp === this) {
            this.node._uiProps.uiComp = null;
          }
          this._destroyData();
        }

        /**
         * @en Marks the render data of the current component as modified so that the render data is recalculated.
         * @zh 标记当前组件的渲染数据为已修改状态，这样渲染数据才会重新计算。
         * @param enable Marked necessary to update or not
         */
        markForUpdateRenderData(enable = true) {
          this._markForUpdateRenderData(enable);
        }

        /**
         * An internal method that marks the render data of the current component as modified so that the render data is recalculated.
         * Adding this method is to minify the function name by `@mangle` since this method is frequently used in the engine.
         * To keep the compatibility, the original method is still kept.
         * @engineInternal
         * @mangle
         */
        _markForUpdateRenderData(enable = true) {
          if (enable) {
            const renderData = this._renderData;
            if (renderData) {
              renderData.vertDirty = true;
            }
            uiRendererManager.markDirtyRenderer(this);
          }
        }
        /**
         * @en Request new render data object.
         * @zh 请求新的渲染数据对象。
         * @return @en The new render data. @zh 新的渲染数据。
         */
        requestRenderData(drawInfoType = RenderDrawInfoType.COMP) {
          const data = RenderData.add();
          data.initRenderDrawInfo(this, drawInfoType);
          this._renderData = data;
          return data;
        }

        /**
         * @en Destroy current render data.
         * @zh 销毁当前渲染数据。
         */
        destroyRenderData() {
          this.renderEntity.clearRenderDrawInfos();
          if (!this._renderData) {
            return;
          }
          RenderData.remove(this._renderData);
          this._renderData = null;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        updateRenderer() {
          const assembler = this._assembler;
          if (assembler && assembler.updateRenderData) {
            assembler.updateRenderData(this);
          }
          this._renderFlag = this._canRender();
          this._renderEntity.enabled = this._renderFlag;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        fillBuffers(render) {
          if (this._renderFlag) {
            this._render(render);
          }
        }

        /**
         * @en Post render data submission procedure, it's executed after assembler updated for all children.
         * It may assemble some extra render data to the geometry buffers, or it may only change some render states.
         * Don't call it unless you know what you are doing.
         * @zh 后置渲染数据组装程序，它会在所有子节点的渲染数据组装完成后被调用。
         * 它可能会组装额外的渲染数据到顶点数据缓冲区，也可能只是重置一些渲染状态。
         * 注意：不要手动调用该函数，除非你理解整个流程。
         */
        postUpdateAssembler(render) {
          if (this._postAssembler && this._renderFlag) {
            this._postRender(render);
          }
        }
        _render(render) {
          // Implemented by subclasses
        }
        _postRender(render) {
          // Implemented by subclasses
        }
        _canRender() {
          if (DEBUG) {
            assert(this.isValid, 'this component should not be invalid!');
          }
          return this.getSharedMaterial(0) !== null && this._enabled && this._color.a > 0;
        }
        _postCanRender() {
          // Implemented by subclasses
        }

        /**
         * cocos-test-projects/assets/cases/rendertexture depends on this method, so it should not be marked as `@mangle` now.
         * FIXME(cjh): `protected` is not equal to `@engineInternal + public`, because `protected` methods are also APIs exposed to developers,
         * For example, developers could implement a class which extends `UIRenderer` and call this method.
         * The mistake was merged in https://github.com/cocos/cocos-engine/pull/14572 , and it needs to be fixed in the future.
         * @engineInternal
         */
        updateMaterial() {
          if (this._customMaterial) {
            if (this.getSharedMaterial(0) !== this._customMaterial) {
              this.setSharedMaterial(this._customMaterial, 0);
            }
            return;
          }
          const mat = this._updateBuiltinMaterial();
          this.setSharedMaterial(mat, 0);
          if (this.stencilStage === Stage.ENTER_LEVEL || this.stencilStage === Stage.ENTER_LEVEL_INVERTED) {
            var _this$getMaterialInst;
            (_this$getMaterialInst = this.getMaterialInstance(0)) == null || _this$getMaterialInst.recompileShaders({
              USE_ALPHA_TEST: true
            });
          }
          this._updateBlendFunc();
        }
        _updateColor() {
          this._colorDirty();
          this.setEntityColor(this._color);
          const assembler = this._assembler;
          if (assembler) {
            if (assembler.updateColor) {
              assembler.updateColor(this);
            }
            // Need update rendFlag when opacity changes from 0 to !0 or 0 to !0
            const renderFlag = this._renderFlag;
            this._renderFlag = this._canRender();
            this.setEntityEnabled(this._renderFlag);
            if (renderFlag !== this._renderFlag) {
              const renderData = this.renderData;
              if (renderData) {
                renderData.vertDirty = true;
              }
            }
          }
        }
        setEntityColorDirty(dirty) {
          if (JSB) {
            this._renderEntity.colorDirty = dirty;
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setEntityColor(color) {
          if (JSB) {
            this._renderEntity.color = color;
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setEntityOpacity(opacity) {
          if (JSB) {
            this.node._setLocalOpacity(opacity);
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setEntityEnabled(enabled) {
          if (JSB) {
            this._renderEntity.enabled = enabled;
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateBlendFunc() {
          // todo: Not only Pass[0].target[0]
          const renderMat = this.getRenderMaterial(0);
          if (!renderMat || !renderMat.passes[0]) {
            return;
          }
          let target = renderMat.passes[0].blendState.targets[0];
          this._dstBlendFactorCache = target.blendDst;
          this._srcBlendFactorCache = target.blendSrc;
          if (this._dstBlendFactorCache !== this._dstBlendFactor || this._srcBlendFactorCache !== this._srcBlendFactor) {
            const matInstance = this.getMaterialInstance(0);
            if (!matInstance || !matInstance.passes[0]) {
              return;
            }
            target = matInstance.passes[0].blendState.targets[0];
            target.blend = true;
            target.blendDstAlpha = BlendFactor.ONE_MINUS_SRC_ALPHA;
            target.blendDst = this._dstBlendFactor;
            target.blendSrc = this._srcBlendFactor;
            const targetPass = matInstance.passes[0];
            targetPass.blendState.setTarget(0, target);
            targetPass._updatePassHash();
            this._dstBlendFactorCache = this._dstBlendFactor;
            this._srcBlendFactorCache = this._srcBlendFactor;
          }
        }

        // pos, rot, scale changed
        _nodeStateChange(transformType) {
          if (this._renderData) {
            this._markForUpdateRenderData();
          }
          for (let i = 0; i < this.node.children.length; ++i) {
            const child = this.node.children[i];
            const renderComp = child.getComponent(UIRenderer);
            if (renderComp) {
              renderComp._markForUpdateRenderData();
            }
          }
        }
        _colorDirty() {
          this.node._uiProps.colorDirty = true;
          this.setEntityColorDirty(true);
        }
        _onMaterialModified(idx, material) {
          if (this._renderData) {
            this._markForUpdateRenderData();
            this._renderData.passDirty = true;
          }
          super._onMaterialModified(idx, material);
        }
        _updateBuiltinMaterial() {
          let mat;
          switch (this._instanceMaterialType) {
            case InstanceMaterialType.ADD_COLOR:
              mat = builtinResMgr.get(`ui-base-material`);
              break;
            case InstanceMaterialType.GRAYSCALE:
              mat = builtinResMgr.get(`ui-sprite-gray-material`);
              break;
            case InstanceMaterialType.USE_ALPHA_SEPARATED:
              mat = builtinResMgr.get(`ui-sprite-alpha-sep-material`);
              break;
            case InstanceMaterialType.USE_ALPHA_SEPARATED_AND_GRAY:
              mat = builtinResMgr.get(`ui-sprite-gray-alpha-sep-material`);
              break;
            default:
              mat = builtinResMgr.get(`ui-sprite-material`);
              break;
          }
          return mat;
        }
        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setNodeDirty() {
          if (this._renderData) {
            this._renderData.nodeDirty = true;
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setTextureDirty() {
          if (this._renderData) {
            this._renderData.textureDirty = true;
          }
        }

        // RenderEntity
        // it should be overwritten by inherited classes
        createRenderEntity() {
          return new RenderEntity(RenderEntityType.STATIC);
        }
      }, _UIRenderer.BlendState = BlendFactor, _UIRenderer.Assembler = null, _UIRenderer.PostAssembler = null, _UIRenderer), _applyDecoratedDescriptor(_class2.prototype, "sharedMaterials", [override, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "sharedMaterials"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "customMaterial", [_dec4, _dec5, disallowAnimation], Object.getOwnPropertyDescriptor(_class2.prototype, "customMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "color", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_materials", [override], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_customMaterial", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_srcBlendFactor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.SRC_ALPHA;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_dstBlendFactor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return BlendFactor.ONE_MINUS_SRC_ALPHA;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_color", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _class2)) || _class) || _class) || _class));
      cclegacy.internal.UIRenderer = UIRenderer;
    }
  };
});