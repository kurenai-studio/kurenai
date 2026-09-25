System.register("q-bundled:///fs/cocos/2d/components/ui-opacity.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../scene-graph/component.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, disallowMultiple, editable, executeInEditMode, executionOrder, help, menu, serializable, tooltip, EDITOR_NOT_IN_PREVIEW, Component, clamp, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, UIOpacity;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      editable = _coreDataDecoratorsIndexJs.editable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      clamp = _coreIndexJs.clamp;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @en
       * Set the UI transparency component.
       * This component can be used to influence subsequent render nodes.
       * Nodes that already have a rendering component can modify the alpha channel of color directly.
       *
       * @zh
       * UI 透明度设置组件。可以通过该组件设置透明度来影响后续的渲染节点。已经带有渲染组件的节点可以直接修改 color 的 alpha 通道。
       */
      _export("UIOpacity", UIOpacity = (_dec = ccclass('cc.UIOpacity'), _dec2 = help('i18n:cc.UIOpacity'), _dec3 = executionOrder(110), _dec4 = menu('UI/UIOpacity'), _dec5 = tooltip('i18n:UIOpacity.opacity'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = disallowMultiple(_class = (_class2 = class UIOpacity extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_opacity", _descriptor, this);
        }

        /**
         * @en
         * The transparency value of the impact.
         *
         * @zh
         * 透明度。
         */
        get opacity() {
          return this._opacity;
        }
        set opacity(value) {
          if (this._opacity === value) {
            return;
          }
          value = clamp(value, 0, 255);
          this._opacity = value;
          this._syncLocalOpacity(value / 255);
          if (EDITOR_NOT_IN_PREVIEW) {
            setTimeout(() => {
              EditorExtends.Node.emit('change', this.node.uuid, this.node);
            }, 200);
          }
        }
        onEnable() {
          this._syncLocalOpacity(this._opacity / 255);
        }
        onDisable() {
          this._syncLocalOpacity(1);
        }
        _syncLocalOpacity(localOpacity) {
          this.node._uiProps.localOpacity = localOpacity;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "opacity", [editable, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "opacity"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_opacity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 255;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
    }
  };
});