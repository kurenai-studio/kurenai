System.register("q-bundled:///fs/cocos/2d/components/label-outline.js", ["../../core/data/decorators/index.js", "../../scene-graph/component.js", "../../core/index.js", "./label.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, requireComponent, executeInEditMode, Component, assertIsTrue, cclegacy, Label, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, LabelOutline;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_labelJs) {
      Label = _labelJs.Label;
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
       * Outline effect used to change the display, only for system fonts or TTF fonts.
       *
       * @zh
       * 描边效果组件,用于字体描边,只能用于系统字体。
       *
       * @deprecated since v3.8.2, please use [[Label.enableOutline]] instead.
       */
      _export("LabelOutline", LabelOutline = (_dec = ccclass('cc.LabelOutline'), _dec2 = help('i18n:cc.LabelOutline'), _dec3 = executionOrder(110), _dec4 = menu('UI/LabelOutline'), _dec5 = requireComponent(Label), _dec6 = tooltip('i18n:labelOutline.color'), _dec7 = tooltip('i18n:labelOutline.width'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = class LabelOutline extends Component {
        /**
         * @en
         * Outline color.
         *
         * @zh
         * 改变描边的颜色。
         *
         * @deprecated since v3.8.2, please use [[Label.outlineColor]] instead.
         */
        get color() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          return label.outlineColor;
        }
        set color(value) {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.outlineColor = value;
        }

        /**
         * @en
         * Change the outline width.
         *
         * @zh
         * 改变描边的宽度。
         *
         * @deprecated since v3.8.2, please use [[Label.outlineWidth]] instead.
         */
        get width() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          return label.outlineWidth;
        }
        set width(value) {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.outlineWidth = value;
        }

        /**
         * @deprecated since v3.8.2, please use [[Label.enableOutline]] instead.
         */
        onEnable() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.enableOutline = true;
        }

        /**
         * @deprecated since v3.8.2, please use [[Label.enableOutline]] instead.
         */
        onDisable() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.enableOutline = false;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "color", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "width", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "width"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
      cclegacy.LabelOutline = LabelOutline;
    }
  };
});