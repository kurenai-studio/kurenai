System.register("q-bundled:///fs/cocos/2d/components/ui-mesh-renderer.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../rendering/define.js", "../renderer/stencil-manager.js", "../../scene-graph/component.js", "../renderer/native-2d.js", "../framework/ui-renderer-manager.js", "../renderer/render-entity.js", "../renderer/render-data.js", "../../core/index.js", "../renderer/render-draw-info.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, executeInEditMode, DEBUG, JSB, RenderPriority, Stage, Component, NativeUIModelProxy, uiRendererManager, RenderEntity, RenderEntityType, MeshRenderData, assert, cclegacy, warnID, RenderDrawInfoType, _dec, _dec2, _dec3, _dec4, _class, UIMeshRenderer;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
    }, function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_renderingDefineJs) {
      RenderPriority = _renderingDefineJs.RenderPriority;
    }, function (_rendererStencilManagerJs) {
      Stage = _rendererStencilManagerJs.Stage;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_rendererNative2dJs) {
      NativeUIModelProxy = _rendererNative2dJs.NativeUIModelProxy;
    }, function (_frameworkUiRendererManagerJs) {
      uiRendererManager = _frameworkUiRendererManagerJs.uiRendererManager;
    }, function (_rendererRenderEntityJs) {
      RenderEntity = _rendererRenderEntityJs.RenderEntity;
      RenderEntityType = _rendererRenderEntityJs.RenderEntityType;
    }, function (_rendererRenderDataJs) {
      MeshRenderData = _rendererRenderDataJs.MeshRenderData;
    }, function (_coreIndexJs) {
      assert = _coreIndexJs.assert;
      cclegacy = _coreIndexJs.cclegacy;
      warnID = _coreIndexJs.warnID;
    }, function (_rendererRenderDrawInfoJs) {
      RenderDrawInfoType = _rendererRenderDrawInfoJs.RenderDrawInfoType;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      /**
       * @en
       * The component of model.
       * When you place particles or models in the UI, you must add this component to render.
       * The component must be placed on a node with the [[MeshRenderer]] or the [[ParticleSystem]].
       *
       * @zh
       * UI 模型基础组件。
       * 当你在 UI 中放置模型或者粒子的时候，必须添加该组件才能渲染。该组件必须放置在带有 [[MeshRenderer]] 或者 [[ParticleSystem]] 组件的节点上。
       * @deprecated This component is not recommended to be used, please use Render Texture instead.
       * See [UIMeshRenderer Reference](https://docs.cocos.com/creator/manual/en/ui-system/components/editor/ui-model.html)
       */
      _export("UIMeshRenderer", UIMeshRenderer = (_dec = ccclass('cc.UIMeshRenderer'), _dec2 = help('i18n:cc.UIMeshRenderer'), _dec3 = executionOrder(110), _dec4 = menu('UI/UIMeshRenderer'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = class UIMeshRenderer extends Component {
        constructor() {
          super();
          this._modelComponent = null;
          this._dirtyVersion = -1;
          this._internalId = -1;
          /**
           * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
           */
          this.stencilStage = Stage.DISABLED;
          this._renderData = null;
          this._renderEntity = new RenderEntity(RenderEntityType.DYNAMIC);
          if (JSB) {
            this._UIModelNativeProxy = new NativeUIModelProxy();
          }
        }

        /**
         * @en Get the model component on this node
         * @zh 获取同节点的 model 组件
         */
        get modelComponent() {
          return this._modelComponent;
        }
        __preload() {
          this.node._uiProps.uiComp = this;
        }
        onEnable() {
          uiRendererManager.addRenderer(this);
          this._markForUpdateRenderData();
        }
        onDisable() {
          uiRendererManager.removeRenderer(this);
          this.renderEntity.enabled = this._canRender();
        }
        onLoad() {
          if (!this.node._getUITransformComp()) {
            this.node.addComponent('cc.UITransform');
          }
          this._modelComponent = this.getComponent('cc.ModelRenderer');
          if (!this._modelComponent) {
            warnID(16378, this.node ? this.node.name : '');
            return;
          }
          if (JSB) {
            this._UIModelNativeProxy.attachNode(this.node);
          }
          this.renderEntity.setNode(this.node);
        }
        onDestroy() {
          this.renderEntity.setNode(null);
          if (this.node._uiProps.uiComp === this) {
            this.node._uiProps.uiComp = null;
          }
          this._modelComponent = this.getComponent('cc.ModelRenderer');
          if (!this._modelComponent) {
            return;
          }
          this._modelComponent._sceneGetter = null;
        }

        /**
         * @en Render data submission procedure, it update and assemble the render data to 2D data buffers before all children submission process.
         * Usually called each frame when the ui flow assemble all render data to geometry buffers.
         * Don't call it unless you know what you are doing.
         * @zh 渲染数据组装程序，这个方法会在所有子节点数据组装之前更新并组装当前组件的渲染数据到 UI 的顶点数据缓冲区中。
         * 一般在 UI 渲染流程中调用，用于组装所有的渲染数据到顶点数据缓冲区。
         * 注意：不要手动调用该函数，除非你理解整个流程。
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        _render(render) {
          if (this._modelComponent) {
            const models = this._modelComponent._collectModels();
            this._modelComponent._detachFromScene();
            for (let i = 0; i < models.length; i++) {
              if (models[i].enabled) {
                render.commitModel(this, models[i], this._modelComponent.material);
              }
            }
            return true;
          }
          return false;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        fillBuffers(render) {
          if (this.enabled) {
            this._render(render);
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        // Native updateAssembler
        updateRenderer() {
          if (JSB) {
            this.renderEntity.enabled = this._canRender();
            if (this._modelComponent) {
              const models = this._modelComponent._collectModels();
              this._modelComponent._detachFromScene(); // JSB
              // clear models
              this._UIModelNativeProxy.clearModels();
              this._renderEntity.clearDynamicRenderDrawInfos();
              for (let i = 0; i < models.length; i++) {
                if (models[i].enabled) {
                  this._uploadRenderData(i);
                  this._UIModelNativeProxy.updateModels(models[i]);
                }
              }
              this._UIModelNativeProxy.attachDrawInfo();
            }
          }
        }
        _uploadRenderData(index) {
          if (JSB) {
            const renderData = MeshRenderData.add();
            // TODO: here we weirdly use UIMeshRenderer as UIRenderer
            // please fix the type @holycanvas
            // issue: https://github.com/cocos/cocos-engine/issues/14637
            renderData.initRenderDrawInfo(this, RenderDrawInfoType.MODEL);
            // TODO: MeshRenderData and RenderData are both sub class of BaseRenderData, here we weirdly use MeshRenderData as RenderData
            // please fix the type @holycanvas
            // issue: https://github.com/cocos/cocos-engine/issues/14637
            this._renderData = renderData;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this._renderData.material = this._modelComponent.getMaterialInstance(index);
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        postUpdateAssembler(render) {
          // No behavior for this component
        }
        update() {
          if (JSB) {
            if (this._modelComponent) {
              this._markForUpdateRenderData();
            }
          }
          this._fitUIRenderQueue();
        }
        _fitUIRenderQueue() {
          if (!this._modelComponent) {
            return;
          }
          const matNum = this._modelComponent.sharedMaterials.length;
          for (let i = 0; i < matNum; i++) {
            const material = this._modelComponent.getMaterialInstance(i);
            if (material == null) {
              continue;
            }
            const passes = material.passes;
            const passNum = passes.length;
            for (let j = 0; j < passNum; j++) {
              const pass = passes[j];
              pass.setPriority(RenderPriority.MAX - 11);
              // Because the deferred pipeline cannot perform lighting processing on the uimodel,
              // it may even cause the uimodel to crash in the metal backend,
              // so force rendering uimodel in forward pipeline
              material.recompileShaders({
                CC_FORCE_FORWARD_SHADING: true
              }, j);
            }
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        // interface
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
          uiRendererManager.markDirtyRenderer(this);
        }
        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setNodeDirty() {
          // No behavior for this component
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setTextureDirty() {
          // No behavior for this component
        }
        _canRender() {
          return this.enabled && this._modelComponent !== null;
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
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get renderData() {
          return this._renderData;
        }
      }) || _class) || _class) || _class) || _class) || _class));
      cclegacy.UIMeshRenderer = UIMeshRenderer;
    }
  };
});