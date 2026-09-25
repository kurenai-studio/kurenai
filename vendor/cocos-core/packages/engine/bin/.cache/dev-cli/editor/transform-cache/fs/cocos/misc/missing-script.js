System.register("q-bundled:///fs/cocos/misc/missing-script.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, inspector, editorOnly, serializable, Component, warnID, js, cclegacy, errorID, _dec, _dec2, _class, _class2, _descriptor, MissingScript;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      inspector = _coreDataDecoratorsIndexJs.inspector;
      editorOnly = _coreDataDecoratorsIndexJs.editorOnly;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
      errorID = _coreIndexJs.errorID;
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
       * A temp fallback to contain the original component which can not be loaded.
       * @zh
       * 包含无法加载的原始组件的临时回退。
       */
      _export("MissingScript", MissingScript = (_dec = ccclass('cc.MissingScript'), _dec2 = inspector('packages://inspector/inspectors/comps/missing-script.js'), _dec(_class = _dec2(_class = (_class2 = class MissingScript extends Component {
        // _scriptUuid: {
        //    get: function () {
        //        var id = this._$erialized.__type__;
        //        if (EditorExtends.UuidUtils.isUuid(id)) {
        //            return EditorExtends.UuidUtils.decompressUuid(id);
        //        }
        //        return '';
        //    },
        // },

        /*
         * @param {string} id
         * @return {function} constructor
         */
        static safeFindClass(id) {
          const cls = js.getClassById(id);
          if (cls) {
            return cls;
          }
          cclegacy.deserialize.reportMissingClass(id);
          return undefined;
        }

        // the serialized data for original script object
        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "_$erialized", _descriptor, this);
        }
        onLoad() {
          warnID(4600, this.node.name);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_$erialized", [serializable, editorOnly], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class));
      cclegacy._MissingScript = MissingScript;

      // DEBUG: Check MissingScript class for issue 9878
      // import { error } from '../platform/debug';
      try {
        const props = MissingScript.__values__;
        if (props.length === 0 || props[props.length - 1] !== '_$erialized') {
          errorID(16338);
          errorID(16339, props.join(', '));
          // props.push('_$erialized');
        }
      } catch (e) {
        errorID(16340, `${e}`);
      }
    }
  };
});