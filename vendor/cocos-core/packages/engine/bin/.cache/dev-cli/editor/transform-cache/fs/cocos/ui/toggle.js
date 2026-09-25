System.register("q-bundled:///fs/cocos/ui/toggle.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../scene-graph/component-event-handler.js", "../2d/framework/index.js", "../2d/components/sprite.js", "../core/data/utils/extends-enum.js", "./button.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, requireComponent, executionOrder, menu, tooltip, displayOrder, type, serializable, EDITOR_NOT_IN_PREVIEW, ComponentEventHandler, UITransform, Sprite, extendsEnum, ButtonEventType, Button, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _Toggle, ToggleEventType, Toggle;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_sceneGraphComponentEventHandlerJs) {
      ComponentEventHandler = _sceneGraphComponentEventHandlerJs.EventHandler;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_coreDataUtilsExtendsEnumJs) {
      extendsEnum = _coreDataUtilsExtendsEnumJs.extendsEnum;
    }, function (_buttonJs) {
      ButtonEventType = _buttonJs.ButtonEventType;
      Button = _buttonJs.Button;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      ToggleEventType = /*#__PURE__*/function (ToggleEventType) {
        ToggleEventType["TOGGLE"] = "toggle";
        return ToggleEventType;
      }(ToggleEventType || {});
      /**
       * @en
       * The toggle component is a CheckBox, when it used together with a ToggleGroup,
       * it could be treated as a RadioButton.
       *
       * @zh
       * Toggle 是一个 CheckBox，当它和 ToggleGroup 一起使用的时候，可以变成 RadioButton。
       */
      _export("Toggle", Toggle = (_dec = ccclass('cc.Toggle'), _dec2 = help('i18n:cc.Toggle'), _dec3 = executionOrder(110), _dec4 = menu('UI/Toggle'), _dec5 = requireComponent(UITransform), _dec6 = displayOrder(1), _dec7 = tooltip('i18n:toggle.isChecked'), _dec8 = type(Sprite), _dec9 = displayOrder(1), _dec0 = tooltip('i18n:toggle.checkMark'), _dec1 = type([ComponentEventHandler]), _dec10 = tooltip('i18n:toggle.check_events'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = (_class2 = (_Toggle = class Toggle extends Button {
        /**
         * @en
         * When this value is true, the check mark component will be enabled,
         * otherwise the check mark component will be disabled.
         *
         * @zh
         * 如果这个设置为 true，则 check mark 组件会处于 enabled 状态，否则处于 disabled 状态。
         */
        get isChecked() {
          return this._isChecked;
        }
        set isChecked(value) {
          this._set(value);
        }

        /**
         * @en
         * The image used for the checkmark.
         *
         * @zh
         * Toggle 处于选中状态时显示的图片。
         */
        get checkMark() {
          return this._checkMark;
        }
        set checkMark(value) {
          if (this._checkMark === value) {
            return;
          }
          this._checkMark = value;
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        set _resizeToTarget(value) {
          if (value) {
            this._resizeNodeToTargetNode();
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _toggleContainer() {
          const parent = this.node.parent;
          if (legacyCC.Node.isNode(parent)) {
            return parent.getComponent('cc.ToggleContainer');
          }
          return null;
        }

        /**
         * @en Enum for toggle event.
         * @zh toggle 事件枚举。
         */

        constructor() {
          super();
          /**
           * @en
           * If Toggle is clicked, it will trigger event's handler.
           *
           * @zh
           * Toggle 按钮的点击事件列表。
           */
          _initializerDefineProperty(this, "checkEvents", _descriptor, this);
          _initializerDefineProperty(this, "_isChecked", _descriptor2, this);
          _initializerDefineProperty(this, "_checkMark", _descriptor3, this);
        }
        _internalToggle() {
          this.isChecked = !this.isChecked;
        }
        _set(value, emitEvent = true) {
          if (this._isChecked == value) return;
          this._isChecked = value;
          const group = this._toggleContainer;
          if (group && group.enabled && this.enabled) {
            if (value || !group.anyTogglesChecked() && !group.allowSwitchOff) {
              this._isChecked = true;
              group.notifyToggleCheck(this, emitEvent);
            }
          }
          this.playEffect();
          if (emitEvent) {
            this._emitToggleEvents();
          }
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        playEffect() {
          if (this._checkMark) {
            this._checkMark.node.active = this._isChecked;
          }
        }

        /**
         * @en
         * Set isChecked without invoking checkEvents.
         *
         * @zh
         * 设置 isChecked 而不调用 checkEvents 回调。
         *
         * @param value @en Whether this toggle is pressed. @zh 是否被按下。
         */
        setIsCheckedWithoutNotify(value) {
          this._set(value, false);
        }
        onEnable() {
          super.onEnable();
          this.playEffect();
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.node.on(Toggle.EventType.CLICK, this._internalToggle, this);
          }
        }
        onDisable() {
          super.onDisable();
          if (!EDITOR_NOT_IN_PREVIEW) {
            this.node.off(Toggle.EventType.CLICK, this._internalToggle, this);
          }
        }
        _emitToggleEvents() {
          this.node.emit(Toggle.EventType.TOGGLE, this);
          if (this.checkEvents) {
            ComponentEventHandler.emitEvents(this.checkEvents, this);
          }
        }
      }, _Toggle.EventType = extendsEnum(ToggleEventType, ButtonEventType), _Toggle), _applyDecoratedDescriptor(_class2.prototype, "isChecked", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "isChecked"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "checkMark", [_dec8, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "checkMark"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "checkEvents", [_dec1, serializable, _dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_isChecked", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_checkMark", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      /**
       * @en
       * Note: This event is emitted from the node to which the component belongs.
       *
       * @zh
       * 注意：此事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
       * @event toggle
       * @param event @en The event when toggle is pressed up or down. @zh 切换键被按下或抬起时发送的事件。
       * @param toggle @en The Toggle component. @zh 切换键组件。
       */
      legacyCC.Toggle = Toggle;
    }
  };
});