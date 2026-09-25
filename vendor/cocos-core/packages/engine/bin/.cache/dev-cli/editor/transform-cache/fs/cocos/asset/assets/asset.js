System.register("q-bundled:///fs/cocos/asset/assets/asset.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../asset-manager/helper.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, PREVIEW, _decorator, Eventify, path, debug, getError, CCObject, cclegacy, getUrlWithUuid, _dec, _class, _class2, _descriptor, ccclass, serializable, property, Asset;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
    }, function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
      Eventify = _coreIndexJs.Eventify;
      path = _coreIndexJs.path;
      debug = _coreIndexJs.debug;
      getError = _coreIndexJs.getError;
      CCObject = _coreIndexJs.CCObject;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_assetManagerHelperJs) {
      getUrlWithUuid = _assetManagerHelperJs.getUrlWithUuid;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      ({
        ccclass,
        serializable,
        property
      } = _decorator);
      /**
       * @en
       * Base class for handling assets used in Creator.<br/>
       *
       * You may want to override:<br/>
       * - createNode<br/>
       * - getset functions of _nativeAsset<br/>
       * - `Object._serialize`<br/>
       * - `Object._deserialize`<br/>
       * @zh
       * Creator 中的资源基类。<br/>
       *
       * 您可能需要重写：<br/>
       * - createNode <br/>
       * - _nativeAsset 的 getset 方法<br/>
       * - `Object._serialize`<br/>
       * - `Object._deserialize`<br/>
       *
       * @class Asset
       * @extends CCObject
       */
      _export("Asset", Asset = (_dec = ccclass('cc.Asset'), _dec(_class = (_class2 = class Asset extends Eventify(CCObject) {
        /**
         * 应 AssetDB 要求提供这个方法。
         * @internal
         * @method deserialize
         * @param {String} data
         * @return {Asset}
         */
        static deserialize(data) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return cclegacy.deserialize(data);
        }

        /**
         * @en
         * Whether the asset is loaded or not
         * @zh
         * 该资源是否已经成功加载。
         *
         * @deprecated since v3.3
         */

        /**
         * @en
         * Returns the url of this asset's native object, will return an empty string if this asset does not have any native dependency.
         * @zh
         * 返回该资源对应的目标平台资源的 URL，如果此资源没有原生依赖将返回一个空字符串。
         * @readOnly
         */
        get nativeUrl() {
          if (!this._nativeUrl) {
            if (!this._native) return '';
            const name = this._native;
            if (name.charCodeAt(0) === 47) {
              // '/'
              // remove library tag
              // not imported in library, just created on-the-fly
              return name.slice(1);
            }
            if (name.charCodeAt(0) === 46) {
              // '.'
              // imported in dir where json exist
              this._nativeUrl = getUrlWithUuid(this._uuid, {
                nativeExt: name,
                isNative: true
              });
            } else {
              // imported in an independent dir
              this._nativeUrl = getUrlWithUuid(this._uuid, {
                __nativeName__: name,
                nativeExt: path.extname(name),
                isNative: true
              });
            }
          }
          return this._nativeUrl;
        }

        /**
         * @en
         * The UUID of this asset.
         *
         * @zh
         * 资源的 UUID。
         */
        get uuid() {
          return this._uuid;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future, please use `nativeAsset` instead.
         */
        get _nativeAsset() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._file;
        }
        set _nativeAsset(obj) {
          this._file = obj;
        }

        /**
         * @en
         * The underlying native asset of this asset if one is available.<br>
         * This property can be used to access additional details or functionality related to the asset.<br>
         * This property will be initialized by the loader if `_native` is available.
         * @zh
         * 此资源的基础资源（如果有）。 此属性可用于访问与资源相关的其他详细信息或功能。<br>
         * 如果`_native`可用，则此属性将由加载器初始化。
         */
        get nativeAsset() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._file;
        }
        constructor(name) {
          super(name);
          this.loaded = true;
          /**
           * @en
           * Serializable url for native asset. For internal usage.
           * @zh
           * 用于本机资产的可序列化URL。供内部使用。
           * @default ""
           *
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          _initializerDefineProperty(this, "_native", _descriptor, this);
          /**
           * @en
           * Path to native dependency.
           * @zh
           * 原生依赖的路径。
           *
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._nativeUrl = '';
          this._file = null;
          this._ref = 0;
          Object.defineProperty(this, '_uuid', {
            value: '',
            writable: true
            // enumerable is false by default, to avoid uuid being assigned to empty string during destroy
          });
          if (EDITOR || NODEJS || PREVIEW) {
            Object.defineProperty(this, 'isDefault', {
              value: false,
              writable: true
            });
          }
        }

        /**
         * @en
         * Returns the string representation of the object.<br>
         * The `Asset` object overrides the `toString()` method of the `Object` object.<br>
         * JavaScript calls the toString() method automatically<br>
         * when an asset is to be represented as a text value or when a texture is referred to in a string concatenation.<br>
         * <br>
         * For assets of the native type, it will return `this.nativeUrl`.<br>
         * Otherwise, an empty string is returned.<br>
         * This method may be overwritten by subclasses.
         * @zh
         * 返回对象的字符串表示形式。<br>
         * `Asset` 对象将会重写 `Object` 对象的 `toString()` 方法。<br>
         * 当资源要表示为文本值时或在字符串连接时引用时，<br>
         * JavaScript 会自动调用 toString() 方法。<br>
         * <br>
         * 对于原始类型的资源，它将返回`this.nativeUrl`。<br>
         * 否则，返回空字符串。<br>
         * 子类可能会覆盖此方法。
         * @method toString
         * @returns @en String representation of this asset. @zh 此资源的字符串表示。
         */
        toString() {
          return this.nativeUrl;
        }

        /**
         * 应 AssetDB 要求提供这个方法。
         * 返回一个序列化后的对象
         *
         * @method serialize
         * @returns {String}
         * @private
         */
        serialize() {}

        /**
         * @en
         * Set native file name for this asset.
         * @zh
         * 为此资源设置原始文件名。
         * @seealso nativeUrl
         *
         * @param filename
         * @param inLibrary
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _setRawAsset(filename, inLibrary = true) {
          if (inLibrary !== false) {
            this._native = filename || '';
          } else {
            this._native = `/${filename}`; // simply use '/' to tag location where is not in the library
          }
        }

        /**
         * @en
         * Create a new node using this asset in the scene.<br/>
         * If this type of asset don't have its corresponding node type, this method should be null.
         * @zh
         * 使用该资源在场景中创建一个新节点。<br/>
         * 如果这类资源没有相应的节点类型，该方法应该是空的。
         */

        /**
         * @en
         * Get native dependency information.
         *
         * @zh
         * 获取原生依赖信息。
         *
         * @returns @en The native dependency information. @zh 原生依赖信息。
         *
         * @deprecated Since v3.7, this is an internal engine interface and you should not call this interface under any circumstances.
         */
        get _nativeDep() {
          if (this._native) {
            return {
              __isNative__: true,
              uuid: this._uuid,
              ext: this._native
            };
          }
          return undefined;
        }

        /**
         * @en
         * Current reference count to this asset.
         *
         * @zh
         * 当前该资源被引用的数量。
         */
        get refCount() {
          return this._ref;
        }

        /**
         * @en
         * Increase the reference count. This will prevent assets from being automatically recycled.
         * When you no longer need to hold the asset, you need to using [[decRef]] to decrease the refCount.
         *
         * @zh
         * 增加资源的引用。这将阻止资源被自动释放。当你不再需要持有该资源时，你需要调用 [[decRef]] 来减少引用计数。
         *
         * @returns @en The asset itself. @zh 此资源本身。
         *
         */
        addRef() {
          this._ref++;
          return this;
        }

        /**
         * @en
         * Decrease the reference count and it will be auto released when refCount equals 0.
         *
         * @zh
         * 减少资源的引用，如果引用数量为 0，则将自动释放该资源。
         *
         * @return @en The asset itself. @zh 此资源本身。
         *
         */
        decRef(autoRelease = true) {
          if (this._ref > 0) {
            this._ref--;
          }
          if (autoRelease) {
            cclegacy.assetManager.getReleaseManager().tryRelease(this);
          }
          return this;
        }

        /**
         * @en
         * A callback after the asset is loaded that you can use to initialize the asset's internal data.
         *
         * @zh
         * 资源加载后的回调，你可以用于初始化资源的内部数据。
         *
         * @deprecated Since v3.7, this is an internal engine interface and you should not call this interface under any circumstances.
         */
        onLoaded() {}

        /**
         * @en
         * Initializes default asset.
         *
         * @zh
         * 初始化为默认资源。
         *
         * @deprecated Since v3.7, this is an internal engine interface and you should not call this interface under any circumstances.
         */
        initDefault(uuid) {
          if (uuid) {
            this._uuid = uuid;
          }
          this.isDefault = true;
        }

        /**
         * @en
         * Used to verify this asset is an available asset.
         *
         * @zh
         * 用于验证此资源是否为可用资源。
         *
         * @returns @zh 是否是可用资源。@en Whether this asset is available or not.
         * @deprecated Since v3.7, this is an internal engine interface and you should not call this interface under any circumstances.
         */
        validate() {
          return true;
        }

        /**
         * @en
         * Destroy this asset and its internal data.
         *
         * @zh
         * 销毁此资源以及其内部数据。
         */
        destroy() {
          debug(getError(12101, this._uuid));
          return super.destroy();
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_native", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "_nativeAsset", [property], Object.getOwnPropertyDescriptor(_class2.prototype, "_nativeAsset"), _class2.prototype), _class2)) || _class));
      /**
       * @param error - null or the error info
       * @param node - the created node or null
       */
      Asset.prototype.createNode = null;
      cclegacy.Asset = Asset;
    }
  };
});