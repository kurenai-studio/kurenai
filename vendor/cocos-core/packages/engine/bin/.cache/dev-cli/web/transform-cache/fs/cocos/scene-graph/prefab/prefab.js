System.register("q-bundled:///fs/cocos/scene-graph/prefab/prefab.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../serialization/instantiate-jit.js", "../../core/index.js", "../../core/value-types/index.js", "../../asset/assets/asset.js", "../node.js", "../../core/global-exports.js", "../../core/platform/debug.js", "../../core/utils/jsb-utils.js", "./utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, editable, SUPPORT_JIT, ALIPAY, RUNTIME_BASED, JSB, compile, js, Enum, Asset, Node, legacyCC, warnID, updateChildrenForDeserialize, utils, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _Prefab, OptimizationPolicy, Prefab;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      SUPPORT_JIT = _virtualInternal253AconstantsJs.SUPPORT_JIT;
      ALIPAY = _virtualInternal253AconstantsJs.ALIPAY;
      RUNTIME_BASED = _virtualInternal253AconstantsJs.RUNTIME_BASED;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_serializationInstantiateJitJs) {
      compile = _serializationInstantiateJitJs.compile;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }, function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_nodeJs) {
      Node = _nodeJs.Node;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
    }, function (_coreUtilsJsbUtilsJs) {
      updateChildrenForDeserialize = _coreUtilsJsbUtilsJs.updateChildrenForDeserialize;
    }, function (_utilsJs) {
      utils = _utilsJs;
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
       * @en An enumeration used with the [[Prefab.optimizationPolicy]] to specify how to optimize the instantiate operation.
       * @zh Prefab 创建实例所用的优化策略，配合 [[Prefab.optimizationPolicy]] 使用。
       */
      OptimizationPolicy = Enum({
        /**
         * @en The optimization policy is automatically chosen based on the number of instantiations.
         * When you first create an instance, the behavior is the same as SINGLE_INSTANCE.
         * MULTI_INSTANCE will be automatically used after multiple creation.
         * @zh 根据创建次数自动调整优化策略。初次创建实例时，行为等同 SINGLE_INSTANCE，多次创建后将自动采用 MULTI_INSTANCE。
         */
        AUTO: 0,
        /**
         * @en Optimize for single instance creation.<br>
         * This option skips code generation for this prefab.
         * When this prefab will usually create only one instances, please select this option.
         * @zh 优化单次创建性能。<br>
         * 该选项会跳过针对这个 prefab 的代码生成优化操作。当该 prefab 加载后，一般只会创建一个实例时，请选择此项。
         */
        SINGLE_INSTANCE: 1,
        /**
         * @en Optimize for creating instances multiple times.<br>
         * This option enables code generation for this prefab.
         * When this prefab will usually create multiple instances, please select this option.
         * It is also recommended to select this option if the prefab instance in the scene
         * has Auto Sync enabled and there are multiple instances in the scene.
         * @zh 优化多次创建性能。<br>
         * 该选项会启用针对这个 prefab 的代码生成优化操作。当该 prefab 加载后，一般会创建多个实例时，请选择此项。如果该 prefab 在场景中的节点启用了自动关联，并且在场景中有多份实例，也建议选择此项。
         */
        MULTI_INSTANCE: 2
      });
      /**
       * @en Class for prefab handling.
       * @zh 预制资源类。
       */
      _export("Prefab", Prefab = (_dec = ccclass('cc.Prefab'), _dec(_class = (_class2 = (_Prefab = class Prefab extends Asset {
        constructor() {
          super();
          /**
           * @en The main [[Node]] in the prefab
           * @zh Prefab 中的根节点，[[Node]] 类型
           */
          _initializerDefineProperty(this, "data", _descriptor, this);
          /**
           * @zh
           * 设置实例化这个 prefab 时所用的优化策略。根据使用情况设置为合适的值，能优化该 prefab 实例化所用的时间。推荐在编辑器的资源中设置。
           * @en
           * Indicates the optimization policy for instantiating this prefab.
           * Set to a suitable value based on usage, can optimize the time it takes to instantiate this prefab.
           * Suggest to set this policy in the editor's asset inspector.
           * @default Prefab.OptimizationPolicy.AUTO
           * @example
           * ```ts
           * import { Prefab } from 'cc';
           * prefab.optimizationPolicy = Prefab.OptimizationPolicy.MULTI_INSTANCE;
           * ```
           */
          _initializerDefineProperty(this, "optimizationPolicy", _descriptor2, this);
          _initializerDefineProperty(this, "persistent", _descriptor3, this);
          // Cache function to optimize instance creation.
          this._createFunction = null;
          this._instantiatedTimes = 0;
        }
        createNode(cb) {
          const node = legacyCC.instantiate(this);
          node.name = this.name;
          cb(null, node);
        }

        /**
         * @en
         * Dynamically translation prefab data into minimized code.<br/>
         * This method will be called automatically before the first time the prefab being instantiated,<br/>
         * but you can re-call to refresh the create function once you modified the original prefab data in script.
         * @zh
         * 将预制数据动态转换为最小化代码。<br/>
         * 此方法将在第一次实例化预制件之前自动调用，<br/>
         * 但是您可以在脚本中修改原始预制数据后重新调用以刷新创建功能。
         */
        compileCreateFunction() {
          if (SUPPORT_JIT) {
            this._createFunction = compile(this.data);
          }
        }

        // just instantiate, will not initialize the Node, this will be called during Node's initialization.
        // @param {Node} [rootToRedirect] - specify an instantiated prefabRoot that all references to prefabRoot in prefab
        //                                  will redirect to
        /**
         * @engineInternal
         */
        _doInstantiate(rootToRedirect) {
          if (!this.data._prefab) {
            // temp guard code
            warnID(3700);
          }
          if (!this._createFunction) {
            this.compileCreateFunction();
          }
          return this._createFunction(rootToRedirect); // this.data._instantiate();
        }

        /**
         * @dontmangle
         * NOTE: the protected method `_instantiate` is invoked by dynamically without type information.
         * See `instantiate` in cocos/serialization/instantiate.ts.
         * ```ts
         * clone = original._instantiate(null, true); // original is any, so _instantiate should not be mangled.
         * ```
         */
        _instantiate() {
          let node;
          let useJit = false;
          if (SUPPORT_JIT) {
            if (this.optimizationPolicy === OptimizationPolicy.SINGLE_INSTANCE) {
              useJit = false;
            } else if (this.optimizationPolicy === OptimizationPolicy.MULTI_INSTANCE) {
              useJit = true;
            } else {
              // auto
              useJit = this._instantiatedTimes + 1 >= Prefab.OptimizationPolicyThreshold;
            }
          }
          if (useJit) {
            // instantiate node
            node = this._doInstantiate();
            // initialize node
            this.data._instantiate(node);
          } else {
            // instantiate node
            node = this.data._instantiate();
          }
          ++this._instantiatedTimes;
          return node;
        }
        initDefault(uuid) {
          super.initDefault(uuid);
          this.data = new Node();
          this.data.name = '(Missing Node)';
          const prefabInfo = new legacyCC._PrefabInfo();
          prefabInfo.asset = this;
          prefabInfo.root = this.data;
          this.data._prefab = prefabInfo;
        }
        validate() {
          return !!this.data;
        }
        onLoaded() {
          const rootNode = this.data;
          utils.expandNestedPrefabInstanceNode(rootNode);
          utils.applyTargetOverrides(rootNode);
          if (JSB) {
            updateChildrenForDeserialize(rootNode);
          }
        }
      }, _Prefab.OptimizationPolicy = OptimizationPolicy, _Prefab.OptimizationPolicyThreshold = 3, _Prefab), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "data", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "optimizationPolicy", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return OptimizationPolicy.AUTO;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "persistent", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class));
      js.value(Prefab, '_utils', utils);
      legacyCC.Prefab = Prefab;
      if (ALIPAY || RUNTIME_BASED) {
        legacyCC._Prefab = Prefab;
      } else {
        js.obsolete(legacyCC, 'cc._Prefab', 'Prefab');
      }
    }
  };
});