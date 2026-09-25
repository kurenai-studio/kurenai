System.register("q-bundled:///fs/cocos/3d/skinned-mesh-renderer/skinned-mesh-renderer.js", ["../../core/data/decorators/index.js", "../assets/skeleton.js", "../../scene-graph/node.js", "../framework/mesh-renderer.js", "../../core/index.js", "../models/skinning-model.js", "../models/baked-skinning-model.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, executionOrder, help, menu, type, Skeleton, Node, MeshRenderer, cclegacy, assertIsTrue, SkinningModel, BakedSkinningModel, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, SkinnedMeshRenderer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_assetsSkeletonJs) {
      Skeleton = _assetsSkeletonJs.Skeleton;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_frameworkMeshRendererJs) {
      MeshRenderer = _frameworkMeshRendererJs.MeshRenderer;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_modelsSkinningModelJs) {
      SkinningModel = _modelsSkinningModelJs.SkinningModel;
    }, function (_modelsBakedSkinningModelJs) {
      BakedSkinningModel = _modelsBakedSkinningModelJs.BakedSkinningModel;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
       * @en The skinned mesh renderer component.
       * @zh 蒙皮网格渲染器组件。
       */
      _export("SkinnedMeshRenderer", SkinnedMeshRenderer = (_dec = ccclass('cc.SkinnedMeshRenderer'), _dec2 = help('i18n:cc.SkinnedMeshRenderer'), _dec3 = executionOrder(100), _dec4 = menu('Mesh/SkinnedMeshRenderer'), _dec5 = type(Skeleton), _dec6 = type(Node), _dec7 = type(Skeleton), _dec8 = type(Node), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = _dec4(_class = (_class2 = class SkinnedMeshRenderer extends MeshRenderer {
        /**
         * @en The skeleton asset.
         * @zh 骨骼资源。
         */
        get skeleton() {
          return this._skeleton;
        }
        set skeleton(val) {
          if (val === this._skeleton) {
            return;
          }
          this._skeleton = val;
          this._update();
        }

        /**
         * @en The skinning root. (The node where the controlling Animation is located)
         * @zh 骨骼根节点的引用，对应控制此模型的动画组件所在节点。
         */
        get skinningRoot() {
          return this._skinningRoot;
        }
        set skinningRoot(value) {
          if (value === this._skinningRoot) {
            return;
          }
          this._skinningRoot = value;
          this._tryBindAnimation();
          this._update();
        }
        get model() {
          return this._model;
        }

        /**
         * Set associated animation.
         * @internal This method only friends to skeletal animation component.
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "_skeleton", _descriptor, this);
          _initializerDefineProperty(this, "_skinningRoot", _descriptor2, this);
          this._clip = null;
          this.associatedAnimation = null;
          this._modelType = BakedSkinningModel;
        }
        onLoad() {
          super.onLoad();
          this._tryBindAnimation();
        }
        onDestroy() {
          if (this.associatedAnimation) {
            this.associatedAnimation.notifySkinnedMeshRemoved(this);
            assertIsTrue(this.associatedAnimation === null);
          }
          super.onDestroy();
        }
        uploadAnimation(clip) {
          this._clip = clip;
          if (this.model && this.model.uploadAnimation) {
            this.model.uploadAnimation(clip);
          }
        }

        /**
         * Set if bake mode should be used.
         * @internal This method only friends to skeletal animation component.
         */
        setUseBakedAnimation(val = true, force = false) {
          const modelType = val ? BakedSkinningModel : SkinningModel;
          if (!force && this._modelType === modelType) {
            return;
          }
          this._modelType = modelType;
          if (this._model) {
            cclegacy.director.root.destroyModel(this._model);
            this._model = null;
            this._models.length = 0;
            this._updateModels();
            this._updateCastShadow();
            this._updateReceiveShadow();
            this._updateUseLightProbe();
            if (this.enabledInHierarchy) {
              this._attachToScene();
            }
          }
        }
        setSharedMaterial(material, index) {
          super.setSharedMaterial(material, index);
          if (this._modelType === SkinningModel) {
            this.getMaterialInstance(index);
          }
        }
        _updateModelParams() {
          this._update(); // should bind skeleton before super create pso
          super._updateModelParams();
        }
        _tryBindAnimation() {
          const {
            _skinningRoot: skinningRoot
          } = this;
          if (!skinningRoot) {
            return;
          }
          let skinningRootIsParent = false;
          for (let current = this.node; current; current = current.parent) {
            if (current === skinningRoot) {
              skinningRootIsParent = true;
              break;
            }
          }
          if (!skinningRootIsParent) {
            return;
          }
          const animation = skinningRoot.getComponent('cc.SkeletalAnimation');
          if (animation && animation.enabledInHierarchy) {
            animation.notifySkinnedMeshAdded(this);
          } else {
            this.setUseBakedAnimation(false);
          }
        }
        _update() {
          if (this.model) {
            this.model.bindSkeleton(this._skeleton, this._skinningRoot, this._mesh);
            if (this.model.uploadAnimation) {
              this.model.uploadAnimation(this._clip);
            }
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_skeleton", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_skinningRoot", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "skeleton", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "skeleton"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "skinningRoot", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "skinningRoot"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});