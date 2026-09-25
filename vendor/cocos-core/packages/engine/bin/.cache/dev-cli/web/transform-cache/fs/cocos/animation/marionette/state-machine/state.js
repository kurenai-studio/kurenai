System.register("q-bundled:///fs/cocos/animation/marionette/state-machine/state.js", ["../ownership.js", "../../../core/index.js", "../../define.js", "../../../serialization/instantiate.js", "../animation-graph-editor-extras-clone-helper.js"], function (_export, _context) {
  "use strict";

  var ownerSymbol, EditorExtendable, js, editorExtrasTag, _decorator, CLASS_NAME_PREFIX_ANIM, instantiate, cloneAnimationGraphEditorExtrasFrom, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, outgoingsSymbol, incomingsSymbol, ccclass, serializable, State, InteractiveState;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_ownershipJs) {
      ownerSymbol = _ownershipJs.ownerSymbol;
    }, function (_coreIndexJs) {
      EditorExtendable = _coreIndexJs.EditorExtendable;
      js = _coreIndexJs.js;
      editorExtrasTag = _coreIndexJs.editorExtrasTag;
      _decorator = _coreIndexJs._decorator;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_serializationInstantiateJs) {
      instantiate = _serializationInstantiateJs.instantiate;
    }, function (_animationGraphEditorExtrasCloneHelperJs) {
      cloneAnimationGraphEditorExtrasFrom = _animationGraphEditorExtrasCloneHelperJs.cloneAnimationGraphEditorExtrasFrom;
    }],
    execute: function () {
      /*
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
      _export("outgoingsSymbol", outgoingsSymbol = Symbol('[[Outgoing transitions]]'));
      _export("incomingsSymbol", incomingsSymbol = Symbol('[[Incoming transitions]]'));
      ({
        ccclass,
        serializable
      } = _decorator);
      _export("State", State = (_dec = ccclass('cc.animation.State'), _dec(_class = (_class2 = class State extends EditorExtendable {
        constructor() {
          super();
          _initializerDefineProperty(this, "name", _descriptor, this);
          this[outgoingsSymbol] = [];
          this[incomingsSymbol] = [];
        }
        copyTo(that) {
          that.name = this.name;
          that[editorExtrasTag] = cloneAnimationGraphEditorExtrasFrom(this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class));
      _export("InteractiveState", InteractiveState = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}InteractiveState`), _dec2(_class3 = (_class4 = class InteractiveState extends State {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_components", _descriptor2, this);
        }
        get components() {
          return this._components;
        }
        addComponent(constructor) {
          const component = new constructor();
          this._components.push(component);
          return component;
        }
        removeComponent(component) {
          js.array.remove(this._components, component);
        }
        instantiateComponents() {
          const instantiatedComponents = this._components.map(component => {
            const instantiated = instantiate(component);
            return instantiated;
          });
          return instantiatedComponents;
        }
        copyTo(that) {
          super.copyTo(that);
          that._components = this.instantiateComponents();
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_components", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class4)) || _class3));
    }
  };
});