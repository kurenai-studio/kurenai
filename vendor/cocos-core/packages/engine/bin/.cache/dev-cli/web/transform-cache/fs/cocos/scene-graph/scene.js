System.register("q-bundled:///fs/cocos/scene-graph/scene.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../core/data/object.js", "../core/platform/debug.js", "./node.js", "../core/global-exports.js", "./scene-globals.js", "./prefab/utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, editable, EDITOR, NODEJS, TEST, CCObject, assert, getError, Node, legacyCC, SceneGlobals, applyTargetOverrides, expandNestedPrefabInstanceNode, _dec, _class, _class2, _descriptor, _descriptor2, Scene;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreDataObjectJs) {
      CCObject = _coreDataObjectJs.CCObject;
    }, function (_corePlatformDebugJs) {
      assert = _corePlatformDebugJs.assert;
      getError = _corePlatformDebugJs.getError;
    }, function (_nodeJs) {
      Node = _nodeJs.Node;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGlobalsJs) {
      SceneGlobals = _sceneGlobalsJs.SceneGlobals;
    }, function (_prefabUtilsJs) {
      applyTargetOverrides = _prefabUtilsJs.applyTargetOverrides;
      expandNestedPrefabInstanceNode = _prefabUtilsJs.expandNestedPrefabInstanceNode;
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
      /**
       * @en
       * Scene is a subclass of [[Node]], composed by nodes, representing the root of a runnable environment in the game.
       * It's managed by [[Director]] and user can switch from a scene to another using [[Director.loadScene]]
       * @zh
       * Scene 是 [[Node]] 的子类，由节点所构成，代表着游戏中可运行的某一个整体环境。
       * 它由 [[Director]] 管理，用户可以使用 [[Director.loadScene]] 来切换场景
       */
      _export("Scene", Scene = (_dec = ccclass('cc.Scene'), _dec(_class = (_class2 = class Scene extends Node {
        /**
         * @en The renderer scene, normally user don't need to use it
         * @zh 渲染层场景，一般情况下用户不需要关心它
         */
        get renderScene() {
          return this._renderScene;
        }
        get globals() {
          return this._globals;
        }

        /**
         * @en Indicates whether all (directly or indirectly) static referenced assets of this scene are releasable by default after scene unloading.
         * @zh 指示该场景中直接或间接静态引用到的所有资源是否默认在场景切换后自动释放。
         */

        _updateScene() {
          this._scene = this;
        }
        constructor(name) {
          super(name);
          _initializerDefineProperty(this, "autoReleaseAssets", _descriptor, this);
          /**
           * @en Per-scene level rendering info
           * @zh 场景级别的渲染信息
           *
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          _initializerDefineProperty(this, "_globals", _descriptor2, this);
          this.dependAssets = null;
          // cache all depend assets for auto release
          this._renderScene = null;
          this._prefabSyncedInLiveReload = false;
          this._activeInHierarchy = false;
          if (legacyCC.director && legacyCC.director.root) {
            this._renderScene = legacyCC.director.root.createScene({});
          }
          this._inited = legacyCC.game ? !legacyCC.game._isCloning : true;
        }

        /**
         * @en Destroy the current scene and all its nodes, this action won't destroy related assets
         * @zh 销毁当前场景中的所有节点，这个操作不会销毁资源
         */
        destroy() {
          const success = CCObject.prototype.destroy.call(this);
          if (success) {
            const children = this._children;
            for (let i = 0; i < children.length; ++i) {
              children[i].active = false;
            }
          }
          if (this._renderScene) legacyCC.director.root.destroyScene(this._renderScene);
          this._active = false;
          this._activeInHierarchy = false;
          return success;
        }

        /**
         * @en Only for compatibility purpose, user should not add any component to the scene
         * @zh 仅为兼容性保留，用户不应该在场景上直接添加任何组件
         */

        /**
         * @en Only for compatibility purpose, user should not add any component to the scene
         * @zh 仅为兼容性保留，用户不应该在场景上直接添加任何组件
         */
        addComponent() {
          throw new Error(getError(3822));
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onHierarchyChanged() {
          // do nothing
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onPostActivated(active) {
          // do nothing
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onBatchCreated(dontSyncChildPrefab) {
          const len = this._children.length;
          for (let i = 0; i < len; ++i) {
            this._children[i]._siblingIndex = i;
            this._children[i]._onBatchCreated(dontSyncChildPrefab);
          }
        }

        /**
         * @en
         * Refer to [[Node.updateWorldTransform]]
         * @zh
         * 参考 [[Node.updateWorldTransform]]
         */
        updateWorldTransform() {
          // do nothing
        }

        // life-cycle call backs

        _instantiate(cloned, isSyncedNode = false) {
          // Can not initialize scene.
          return null;
        }

        /**
         * @engineInternal
         * @mangle
         */
        _load() {
          if (!this._inited) {
            if (TEST) {
              assert(!this._activeInHierarchy, 'Should deactivate ActionManager by default');
            }
            expandNestedPrefabInstanceNode(this);
            applyTargetOverrides(this);
            this._onBatchCreated(EDITOR && this._prefabSyncedInLiveReload);
            this._inited = true;
          }
          // static method can't use this as parameter type
          this.walk(Node._setScene);
        }

        /**
         * @engineInternal
         * @mangle
         */
        _activate(active = true) {
          if (EDITOR || NODEJS) {
            // register all nodes to editor
            // TODO: `_registerIfAttached` is injected property
            // issue: https://github.com/cocos/cocos-engine/issues/14643
            this._registerIfAttached(active);
          }
          legacyCC.director._nodeActivator.activateNode(this, active);
          // The test environment does not currently support the renderer
          if (!TEST) {
            this._globals.activate(this);
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "globals", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "globals"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "autoReleaseAssets", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_globals", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new SceneGlobals();
        }
      }), _class2)) || _class));
      legacyCC.Scene = Scene;
    }
  };
});