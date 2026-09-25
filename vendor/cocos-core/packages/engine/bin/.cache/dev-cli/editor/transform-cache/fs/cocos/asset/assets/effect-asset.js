System.register("q-bundled:///fs/cocos/asset/assets/effect-asset.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../gfx/index.js", "../../render-scene/core/program-lib.js", "./asset.js", "../../core/index.js", "../../render-scene/core/program-utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, editable, editorOnly, EDITOR_NOT_IN_PREVIEW, deviceManager, programLib, Asset, cclegacy, warnID, addEffectDefaultProperties, getCombinationDefines, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _EffectAsset, legacyBuiltinEffectNames, EffectAsset;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
      editorOnly = _coreDataDecoratorsIndexJs.editorOnly;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_renderSceneCoreProgramLibJs) {
      programLib = _renderSceneCoreProgramLibJs.programLib;
    }, function (_assetJs) {
      Asset = _assetJs.Asset;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      warnID = _coreIndexJs.warnID;
    }, function (_renderSceneCoreProgramUtilsJs) {
      addEffectDefaultProperties = _renderSceneCoreProgramUtilsJs.addEffectDefaultProperties;
      getCombinationDefines = _renderSceneCoreProgramUtilsJs.getCombinationDefines;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      legacyBuiltinEffectNames = ['planar-shadow', 'skybox', 'deferred-lighting', 'bloom', 'hbao', 'copy-pass', 'post-process', 'profiler', 'splash-screen', 'unlit', 'sprite', 'particle', 'particle-gpu', 'particle-trail', 'billboard', 'terrain', 'graphics', 'clear-stencil', 'spine', 'occlusion-query', 'geometry-renderer', 'debug-renderer', 'ssss-blur', 'float-output-process'];
      /**
       * @en Effect asset is the base template for instantiating material, all effects should be unique globally.
       * All effects are managed in a static map of EffectAsset.
       * @zh Effect 资源，作为材质实例初始化的模板，每个 effect 资源都应是全局唯一的。
       * 所有 Effect 资源都由此类的一个静态对象管理。
       */
      _export("EffectAsset", EffectAsset = (_dec = ccclass('cc.EffectAsset'), _dec(_class = (_class2 = (_EffectAsset = class EffectAsset extends Asset {
        /**
         * @en Register the effect asset to the static map.
         * @zh 将指定 effect 注册到全局管理器。
         *
         * @param asset @en The effect asset to be registered. @zh 待注册的 effect asset。
         */
        static register(asset) {
          EffectAsset._effects[asset.name] = asset;
          EffectAsset._layoutValid = false;
        }

        /**
         * @en Unregister the effect asset from the static map
         * @zh 将指定 effect 从全局管理器移除。
         *
         * @param asset - @en The effect asset to be removed. @zh 待移除的 effect asset。
         */
        static remove(asset) {
          if (typeof asset !== 'string') {
            if (EffectAsset._effects[asset.name] && EffectAsset._effects[asset.name] === asset) {
              delete EffectAsset._effects[asset.name];
            }
          } else {
            if (EffectAsset._effects[asset]) {
              delete EffectAsset._effects[asset];
              return;
            }
            for (const n in EffectAsset._effects) {
              if (EffectAsset._effects[n]._uuid === asset) {
                delete EffectAsset._effects[n];
                return;
              }
            }
          }
        }

        /**
         * @en Gets the effect asset by the given name.
         * @zh 获取指定名字的 effect 资源。
         *
         * @param name - @en The name of effect you want to get. @zh 想要获取的 effect 的名字。
         * @returns @en The effect. @zh 你查询的 effect.
         */
        static get(name) {
          if (EffectAsset._effects[name]) {
            return EffectAsset._effects[name];
          }
          for (const n in EffectAsset._effects) {
            if (EffectAsset._effects[n]._uuid === name) {
              return EffectAsset._effects[n];
            }
          }
          if (legacyBuiltinEffectNames.includes(name)) {
            warnID(16101, name);
          }
          return null;
        }

        /**
         * @en Gets all registered effect assets.
         * @zh 获取所有已注册的 effect 资源。
         * @returns @en All registered effects. @zh 所有已注册的 effect 资源。
         */
        static getAll() {
          return EffectAsset._effects;
        }

        /**
         * @engineInternal
         */

        /**
         * @engineInternal
         */
        static isLayoutValid() {
          return EffectAsset._layoutValid;
        }
        /**
         * @engineInternal
         */
        static setLayoutValid() {
          EffectAsset._layoutValid = true;
        }
        /**
         * @engineInternal
         */

        constructor(name) {
          super(name);
          /**
           * @en The techniques used by the current effect.
           * @zh 当前 effect 的所有可用 technique。
           */
          _initializerDefineProperty(this, "techniques", _descriptor, this);
          /**
           * @en The shaders used by the current effect.
           * @zh 当前 effect 使用的所有 shader。
           */
          _initializerDefineProperty(this, "shaders", _descriptor2, this);
          /**
           * @en The preprocess macro combinations for the shader
           * @zh 每个 shader 需要预编译的宏定义组合。
           */
          _initializerDefineProperty(this, "combinations", _descriptor3, this);
          /**
           * @en Whether to hide in editor mode.
           * @zh 是否在编辑器内隐藏。
           */
          _initializerDefineProperty(this, "hideInEditor", _descriptor4, this);
        }

        /**
         * @en The loaded callback which should be invoked by the [[AssetManager]], will automatically register the effect.
         * @zh 通过 [[AssetManager]] 加载完成时的回调，将自动注册 effect 资源。
         */
        onLoaded() {
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            addEffectDefaultProperties(this);
            const programLib = cclegacy.rendering.programLib;
            programLib.addEffect(this);
            programLib.init(deviceManager.gfxDevice);
          } else {
            programLib.register(this);
          }
          EffectAsset.register(this);
          if (!EDITOR_NOT_IN_PREVIEW) {
            cclegacy.game.once(cclegacy.Game.EVENT_RENDERER_INITED, this._precompile, this);
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _precompile() {
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            cclegacy.rendering.programLib.precompileEffect(deviceManager.gfxDevice, this);
            return;
          }
          const root = cclegacy.director.root;
          for (let i = 0; i < this.shaders.length; i++) {
            const shader = this.shaders[i];
            const combination = this.combinations[i];
            if (!combination) {
              continue;
            }
            const defines = getCombinationDefines(combination);
            defines.forEach(defines => programLib.getGFXShader(deviceManager.gfxDevice, shader.name, defines, root.pipeline));
          }
        }
        destroy() {
          EffectAsset.remove(this);
          return super.destroy();
        }
        initDefault(uuid) {
          super.initDefault(uuid);
          const effect = EffectAsset.get('builtin-unlit');
          this.name = 'builtin-unlit';
          this.shaders = effect.shaders;
          this.combinations = effect.combinations;
          this.techniques = effect.techniques;
        }
        validate() {
          return this.techniques.length > 0 && this.shaders.length > 0;
        }
      }, _EffectAsset._effects = {}, _EffectAsset._layoutValid = true, _EffectAsset), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "techniques", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "shaders", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "combinations", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hideInEditor", [serializable, editorOnly], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class));
      cclegacy.EffectAsset = EffectAsset;
    }
  };
});