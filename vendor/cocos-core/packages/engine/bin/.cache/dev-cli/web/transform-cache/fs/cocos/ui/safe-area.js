System.register("q-bundled:///fs/cocos/ui/safe-area.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "pal/screen-adapter", "../scene-graph/component.js", "../2d/framework/index.js", "../core/platform/index.js", "./widget.js", "./widget-manager.js", "../core/global-exports.js", "./view.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, executeInEditMode, requireComponent, serializable, visible, tooltip, EDITOR, screenAdapter, Component, UITransform, sys, Widget, widgetManager, legacyCC, view, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, SafeArea;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_corePlatformIndexJs) {
      sys = _corePlatformIndexJs.sys;
    }, function (_widgetJs) {
      Widget = _widgetJs.Widget;
    }, function (_widgetManagerJs) {
      widgetManager = _widgetManagerJs.widgetManager;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_viewJs) {
      view = _viewJs.view;
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
       * This component is used to adjust the layout of current node to respect the safe area of a notched mobile device such as the iPhone X.
       * It is typically used for the top node of the UI interaction area. For specific usage,
       * refer to the official [test-cases-3d/assets/cases/ui/20.safe-area/safe-area.scene](https://github.com/cocos-creator/test-cases-3d).
       *
       * The concept of safe area is to give you a fixed inner rectangle in which you can safely display content that will be drawn on screen.
       * You are strongly discouraged from providing controls outside of this area. But your screen background could embellish edges.
       *
       * This component internally uses the API `sys.getSafeAreaRect();` to obtain the safe area of the current iOS or Android device,
       * and implements the adaptation by using the Widget component and set anchor.
       *
       * @zh
       * 该组件会将所在节点的布局适配到 iPhone X 等异形屏手机的安全区域内，通常用于 UI 交互区域的顶层节点，
       * 具体用法可参考官方范例 [test-cases-3d/assets/cases/ui/20.safe-area/safe-area.scene](https://github.com/cocos-creator/test-cases-3d)。
       *
       * 该组件内部通过 API `sys.getSafeAreaRect();` 获取到当前 iOS 或 Android 设备的安全区域，并通过 Widget 组件实现适配。
       *
       */
      _export("SafeArea", SafeArea = (_dec = ccclass('cc.SafeArea'), _dec2 = help('i18n:cc.SafeArea'), _dec3 = executionOrder(110), _dec4 = menu('UI/SafeArea'), _dec5 = requireComponent(Widget), _dec6 = visible(true), _dec7 = tooltip('i18n:safe_area.symmetric'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = _dec4(_class = _dec5(_class = (_class2 = class SafeArea extends Component {
        get symmetric() {
          return this._symmetric;
        }
        set symmetric(value) {
          this._symmetric = value;
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_symmetric", _descriptor, this);
        }
        onEnable() {
          this.updateArea();
          // IDEA: need to delay the callback on Native platform ?
          screenAdapter.on('window-resize', this.updateArea, this);
          screenAdapter.on('orientation-change', this.updateArea, this);
        }
        onDisable() {
          screenAdapter.off('window-resize', this.updateArea, this);
          screenAdapter.off('orientation-change', this.updateArea, this);
        }

        /**
         * @en Adapt to safe area.
         * @zh 立即适配安全区域。
         * @method updateArea
         * @example
         * let safeArea = this.node.addComponent(cc.SafeArea);
         * safeArea.updateArea();
         */
        updateArea() {
          // TODO Remove Widget dependencies in the future
          const widget = this.node.getComponent(Widget);
          const uiTransComp = this.node.getComponent(UITransform);
          if (!widget || !uiTransComp) {
            return;
          }
          if (EDITOR) {
            widget.top = widget.bottom = widget.left = widget.right = 0;
            widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
            return;
          }
          // IMPORTANT: need to update alignment to get the latest position
          widget.updateAlignment();
          const lastPos = this.node.position.clone();
          const lastAnchorPoint = uiTransComp.anchorPoint.clone();
          //
          widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
          const visibleSize = view.getVisibleSize();
          const screenWidth = visibleSize.width;
          const screenHeight = visibleSize.height;
          const safeArea = sys.getSafeAreaRect(this._symmetric);
          widget.top = screenHeight - safeArea.y - safeArea.height;
          widget.bottom = safeArea.y;
          widget.left = safeArea.x;
          widget.right = screenWidth - safeArea.x - safeArea.width;
          widget.updateAlignment();
          // set anchor, keep the original position unchanged
          const curPos = this.node.position.clone();
          const anchorX = lastAnchorPoint.x - (curPos.x - lastPos.x) / uiTransComp.width;
          const anchorY = lastAnchorPoint.y - (curPos.y - lastPos.y) / uiTransComp.height;
          uiTransComp.setAnchorPoint(anchorX, anchorY);
          // IMPORTANT: restore to lastPos even if widget is not ALWAYS
          widgetManager.add(widget);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "symmetric", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "symmetric"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_symmetric", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
      legacyCC.SafeArea = SafeArea;
    }
  };
});