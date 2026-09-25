System.register("q-bundled:///fs/cocos/asset/asset-manager/shared.js", ["../../../../virtual/internal%253Aconstants.js", "./cache.js", "./pipeline.js", "./weak-cache.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, Cache, Pipeline, WeakCache, assets, files, parsed, bundles, pipeline, fetchPipeline, transformPipeline, references, assetsOverrideMap, RequestType, presets, BuiltinBundleName;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_cacheJs) {
      Cache = _cacheJs.default;
    }, function (_pipelineJs) {
      Pipeline = _pipelineJs.Pipeline;
    }, function (_weakCacheJs) {
      WeakCache = _weakCacheJs.default;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("assets", assets = EDITOR ? new WeakCache() : new Cache());
      _export("files", files = new Cache());
      _export("parsed", parsed = new Cache());
      _export("bundles", bundles = new Cache());
      _export("pipeline", pipeline = new Pipeline('normal load', []));
      _export("fetchPipeline", fetchPipeline = new Pipeline('fetch', []));
      _export("transformPipeline", transformPipeline = new Pipeline('transform url', []));
      _export("references", references = EDITOR || NODEJS ? new Cache() : null);
      _export("assetsOverrideMap", assetsOverrideMap = new Map());
      _export("RequestType", RequestType = /*#__PURE__*/function (RequestType) {
        RequestType["UUID"] = "uuid";
        RequestType["PATH"] = "path";
        RequestType["DIR"] = "dir";
        RequestType["URL"] = "url";
        RequestType["SCENE"] = "scene";
        return RequestType;
      }({}));
      _export("presets", presets = {
        default: {
          priority: 0
        },
        preload: {
          maxConcurrency: 6,
          maxRequestsPerFrame: 2,
          priority: -1
        },
        scene: {
          maxConcurrency: 20,
          maxRequestsPerFrame: 20,
          priority: 1
        },
        bundle: {
          maxConcurrency: 20,
          maxRequestsPerFrame: 20,
          priority: 2
        },
        remote: {
          maxRetryCount: 4
        }
      });
      /**
       * @en
       * The builtin bundles
       *
       * @zh
       * 内置 bundle
       *
       */
      _export("BuiltinBundleName", BuiltinBundleName = /*#__PURE__*/function (BuiltinBundleName) {
        /**
         * @en
         * The builtin bundle of default asset
         *
         * @zh
         * 内置 bundle, 对应默认资源
         */
        BuiltinBundleName["INTERNAL"] = "internal";
        /**
         * @en
         * The builtin bundle corresponds to 'assets/resources'.
         *
         * @zh
         * 内置 bundle, 对应 'assets/resources' 目录
         *
         */
        BuiltinBundleName["RESOURCES"] = "resources";
        /**
         * @en
         * The builtin bundle
         *
         * @zh
         * 内置 bundle
         *
         */
        BuiltinBundleName["MAIN"] = "main";
        /**
         * @en
         * The builtin bundle, exists when Start Scene asset bundle is checked on the project building panel
         *
         * @zh
         * 内置 bundle, 如果构建面板开启了首场景分包，则会有 START_SCENE bundle
         *
         */
        BuiltinBundleName["START_SCENE"] = "start-scene";
        return BuiltinBundleName;
      }({}));
    }
  };
});