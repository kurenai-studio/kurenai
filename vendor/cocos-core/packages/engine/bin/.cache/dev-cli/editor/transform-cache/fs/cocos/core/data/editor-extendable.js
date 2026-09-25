System.register("q-bundled:///fs/cocos/core/data/editor-extendable.js", ["../../../../virtual/internal%253Aconstants.js", "./decorators/index.js", "../utils/js.js", "./editor-extras-tag.js", "./utils/asserts.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editorOnly, getClassName, editorExtrasTag, assertIsTrue, Empty, EditorExtendable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); } /*
 Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.

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
  // Functions and classes exposed from this module are useful to
  // make a class to be `EditorExtendableObject`.
  //
  // These helpers are used internally, don't expose them to the user.
  /**
   * Creates a mixin class that inherits from the specific base class and implements the `EditorExtendableObject` interface.
   * @param Base The base class.
   * @param className Assign an optional cc class name. If the base class is not cc class, this param is required.
   * @returns The mixin class.
   */
  function EditorExtendableMixin(Base, className) {
    return editorExtendableInternal(Base);
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  function editorExtendableInternal(Base, className) {
    if (!EDITOR) {
      return Base != null ? Base : Empty;
    }
    let name;
    if (className) {
      name = className;
    } else if (!Base) {
      name = `cc.EditorExtendable`;
    } else {
      const baseName = getClassName(Base);
      if (baseName) {
        name = `cc.EditorExtendable/${baseName}`;
      } else {
        throw new Error(`You should supply a class name to EditorExtendable when mixin with ${Base.name}.`);
      }
    }
    let EditorExtendable;
    if (Base) {
      var _dec, _class, _class2, _descriptor;
      let C = (_dec = ccclass(name), _dec(_class = (_class2 = class C extends Base {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "__editorExtras__", _descriptor, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__editorExtras__", [editorOnly], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class2)) || _class);
      EditorExtendable = C;
    } else {
      var _dec2, _class3, _class4, _descriptor2;
      let C = (_dec2 = ccclass(name), _dec2(_class3 = (_class4 = class C {
        constructor() {
          _initializerDefineProperty(this, "__editorExtras__", _descriptor2, this);
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "__editorExtras__", [editorOnly], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class4)) || _class3);
      EditorExtendable = C;
    }
    return EditorExtendable;
  }
  _export("EditorExtendableMixin", EditorExtendableMixin);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_decoratorsIndexJs) {
      ccclass = _decoratorsIndexJs.ccclass;
      editorOnly = _decoratorsIndexJs.editorOnly;
    }, function (_utilsJsJs) {
      getClassName = _utilsJsJs.getClassName;
    }, function (_editorExtrasTagJs) {
      editorExtrasTag = _editorExtrasTagJs.editorExtrasTag;
    }, function (_utilsAssertsJs) {
      assertIsTrue = _utilsAssertsJs.assertIsTrue;
    }],
    execute: function () {
      Empty = class Empty {};
      /**
       * Class which implements the `EditorExtendableObject` interface.
       * @engineInternal
       */
      _export("EditorExtendable", EditorExtendable = editorExtendableInternal());
      // Note: Babel does not support decorators on computed property currently.
      // So we have to use its literal value below.
      assertIsTrue(editorExtrasTag === '__editorExtras__', 'editorExtrasTag needs to be updated.');
    }
  };
});