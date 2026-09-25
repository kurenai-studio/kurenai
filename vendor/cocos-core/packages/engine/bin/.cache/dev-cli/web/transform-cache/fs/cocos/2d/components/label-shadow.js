System.register("q-bundled:///fs/cocos/2d/components/label-shadow.js", ["../../core/data/decorators/index.js", "../../scene-graph/component.js", "../../core/index.js", "./label.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, requireComponent, executeInEditMode, Component, assertIsTrue, Label, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, LabelShadow;
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
       * @en Shadow effect for Label component, only for system fonts or TTF fonts.
       * @zh 用于给 Label 组件添加阴影效果，只能用于系统字体或 ttf 字体。
       *
       * @deprecated since v3.8.2, please use [[Label.enableShadow]] instead.
       */
      _export("LabelShadow", LabelShadow = (_dec = ccclass('cc.LabelShadow'), _dec2 = help('i18n:cc.LabelShadow'), _dec3 = executionOrder(110), _dec4 = menu('UI/LabelShadow'), _dec5 = requireComponent(Label), _dec6 = tooltip('i18n:labelShadow.color'), _dec7 = tooltip('i18n:labelShadow.offset'), _dec8 = tooltip('i18n:labelShadow.blur'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = class LabelShadow extends Component {
        /**
         * @en
         * Shadow color.
         *
         * @zh
         * 阴影的颜色。
         *
         * @deprecated since v3.8.2, please use [[Label.shadowColor]] instead.
         */
        get color() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          return label.shadowColor;
        }
        set color(value) {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.shadowColor = value;
        }

        /**
         * @en
         * Offset between font and shadow.
         *
         * @zh
         * 字体与阴影的偏移。
         *
         * @deprecated since v3.8.2, please use [[Label.shadowOffset]] instead.
         */
        get offset() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          return label.shadowOffset;
        }
        set offset(value) {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.shadowOffset = value;
        }

        /**
         * @en
         * A non-negative float specifying the level of shadow blur.
         *
         * @zh
         * 阴影的模糊程度。
         *
         * @deprecated since v3.8.2, please use [[Label.shadowBlur]] instead.
         */
        get blur() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          return label.shadowBlur;
        }
        set blur(value) {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.shadowBlur = value;
        }

        /**
         * @deprecated since v3.8.2, please use [[Label.enableShadow]] instead.
         */
        onEnable() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.enableShadow = true;
        }

        /**
         * @deprecated since v3.8.2, please use [[Label.enableShadow]] instead.
         */
        onDisable() {
          const label = this.node.getComponent(Label);
          assertIsTrue(label);
          label.enableShadow = false;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "color", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "offset", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "offset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "blur", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "blur"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
    }
  };
});