System.register("q-bundled:///fs/cocos/ui/editbox/edit-box.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../2d/framework/index.js", "../../2d/assets/sprite-frame.js", "../../scene-graph/component.js", "../../scene-graph/component-event-handler.js", "../../scene-graph/node.js", "../../2d/components/label.js", "../../2d/components/sprite.js", "./edit-box-impl.js", "./edit-box-impl-base.js", "./types.js", "../../core/global-exports.js", "../../scene-graph/node-event.js", "../../xr/event/xr-event-handle.js", "../../game/director.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, executionOrder, menu, requireComponent, tooltip, displayOrder, type, serializable, EDITOR_NOT_IN_PREVIEW, JSB, MINIGAME, RUNTIME_BASED, USE_XR, UITransform, SpriteFrame, Component, ComponentEventHandler, Node, Label, VerticalTextAlignment, Sprite, SpriteEventType, EditBoxImpl, EditBoxImplBase, InputFlag, InputMode, KeyboardReturnType, legacyCC, NodeEventType, XrKeyboardEventType, XrUIPressEventType, director, DirectorEvent, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _EditBox, LEFT_PADDING, EditBoxEventType, EditBox;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function capitalize(str) {
    return str.replace(/(?:^|\s)\S/g, a => a.toUpperCase());
  }
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      JSB = _virtualInternal253AconstantsJs.JSB;
      MINIGAME = _virtualInternal253AconstantsJs.MINIGAME;
      RUNTIME_BASED = _virtualInternal253AconstantsJs.RUNTIME_BASED;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_dAssetsSpriteFrameJs) {
      SpriteFrame = _dAssetsSpriteFrameJs.SpriteFrame;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_sceneGraphComponentEventHandlerJs) {
      ComponentEventHandler = _sceneGraphComponentEventHandlerJs.EventHandler;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_dComponentsLabelJs) {
      Label = _dComponentsLabelJs.Label;
      VerticalTextAlignment = _dComponentsLabelJs.VerticalTextAlignment;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
      SpriteEventType = _dComponentsSpriteJs.SpriteEventType;
    }, function (_editBoxImplJs) {
      EditBoxImpl = _editBoxImplJs.EditBoxImpl;
    }, function (_editBoxImplBaseJs) {
      EditBoxImplBase = _editBoxImplBaseJs.EditBoxImplBase;
    }, function (_typesJs) {
      InputFlag = _typesJs.InputFlag;
      InputMode = _typesJs.InputMode;
      KeyboardReturnType = _typesJs.KeyboardReturnType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_xrEventXrEventHandleJs) {
      XrKeyboardEventType = _xrEventXrEventHandleJs.XrKeyboardEventType;
      XrUIPressEventType = _xrEventXrEventHandleJs.XrUIPressEventType;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
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
      LEFT_PADDING = 2;
      EditBoxEventType = /*#__PURE__*/function (EditBoxEventType) {
        EditBoxEventType["EDITING_DID_BEGAN"] = "editing-did-began";
        EditBoxEventType["EDITING_DID_ENDED"] = "editing-did-ended";
        EditBoxEventType["TEXT_CHANGED"] = "text-changed";
        EditBoxEventType["EDITING_RETURN"] = "editing-return";
        EditBoxEventType["XR_EDITING_DID_BEGAN"] = "xr-editing-did-began";
        EditBoxEventType["XR_EDITING_DID_ENDED"] = "xr-editing-did-ended";
        return EditBoxEventType;
      }(EditBoxEventType || {});
      /**
       * @en
       * `EditBox` is a component for inputing text, you can use it to gather small amounts of text from users.
       *
       * @zh
       * `EditBox` 组件，用于获取用户的输入文本。
       */
      _export("EditBox", EditBox = (_dec = ccclass('cc.EditBox'), _dec2 = help('i18n:cc.EditBox'), _dec3 = executionOrder(110), _dec4 = menu('UI/EditBox'), _dec5 = requireComponent(UITransform), _dec6 = displayOrder(1), _dec7 = tooltip('i18n:editbox.string'), _dec8 = displayOrder(2), _dec9 = tooltip('i18n:editbox.placeholder'), _dec0 = type(Label), _dec1 = displayOrder(3), _dec10 = tooltip('i18n:editbox.text_lable'), _dec11 = type(Label), _dec12 = displayOrder(4), _dec13 = tooltip('i18n:editbox.placeholder_label'), _dec14 = type(SpriteFrame), _dec15 = displayOrder(5), _dec16 = tooltip('i18n:editbox.backgroundImage'), _dec17 = type(InputFlag), _dec18 = displayOrder(6), _dec19 = tooltip('i18n:editbox.input_flag'), _dec20 = type(InputMode), _dec21 = displayOrder(7), _dec22 = tooltip('i18n:editbox.input_mode'), _dec23 = type(KeyboardReturnType), _dec24 = displayOrder(8), _dec25 = tooltip('i18n:editbox.returnType'), _dec26 = displayOrder(9), _dec27 = tooltip('i18n:editbox.max_length'), _dec28 = displayOrder(10), _dec29 = tooltip('i18n:editbox.tab_index'), _dec30 = type([ComponentEventHandler]), _dec31 = displayOrder(11), _dec32 = tooltip('i18n:editbox.editing_began'), _dec33 = type([ComponentEventHandler]), _dec34 = displayOrder(12), _dec35 = tooltip('i18n:editbox.text_changed'), _dec36 = type([ComponentEventHandler]), _dec37 = displayOrder(13), _dec38 = tooltip('i18n:editbox.editing_ended'), _dec39 = type([ComponentEventHandler]), _dec40 = displayOrder(14), _dec41 = tooltip('i18n:editbox.editing_return'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = (_EditBox = class EditBox extends Component {
        /**
         * @en
         * Input string of EditBox.
         *
         * @zh
         * 输入框的初始输入内容，如果为空则会显示占位符的文本。
         */
        get string() {
          return this._string;
        }
        set string(value) {
          if (this._maxLength >= 0 && value.length >= this._maxLength) {
            value = value.slice(0, this._maxLength);
          }
          if (this._string === value) {
            return;
          }
          this._string = value;
          this._updateString(value);
        }

        /**
         * @en
         * The display text of placeholder.
         *
         * @zh
         * 输入框占位符的文本内容。
         */
        get placeholder() {
          if (!this._placeholderLabel) {
            return '';
          }
          return this._placeholderLabel.string;
        }
        set placeholder(value) {
          if (this._placeholderLabel) {
            this._placeholderLabel.string = value;
          }
        }

        /**
         * @en
         * The Label component attached to the node for EditBox's input text label.
         *
         * @zh
         * 输入框输入文本节点上挂载的 Label 组件对象。
         */
        get textLabel() {
          return this._textLabel;
        }
        set textLabel(oldValue) {
          if (this._textLabel !== oldValue) {
            this._textLabel = oldValue;
            if (this._textLabel) {
              this._updateTextLabel();
              this._updateLabels();
            }
          }
        }

        /**
         * @en
         * The Label component attached to the node for EditBox's placeholder text label.
         *
         * @zh
         * 输入框占位符节点上挂载的 Label 组件对象。
         */
        get placeholderLabel() {
          return this._placeholderLabel;
        }
        set placeholderLabel(oldValue) {
          if (this._placeholderLabel !== oldValue) {
            this._placeholderLabel = oldValue;
            if (this._placeholderLabel) {
              this._updatePlaceholderLabel();
              this._updateLabels();
            }
          }
        }

        /**
         * @en
         * The background image of EditBox.
         *
         * @zh
         * 输入框的背景图片。
         */
        get backgroundImage() {
          return this._backgroundImage;
        }
        set backgroundImage(value) {
          if (this._backgroundImage === value) {
            return;
          }
          this._backgroundImage = value;
          this._ensureBackgroundSprite();
          this._background.spriteFrame = value;
        }

        /**
         * @en
         * Set the input flags that are to be applied to the EditBox.
         *
         * @zh
         * 指定输入标志位，可以指定输入方式为密码或者单词首字母大写。
         */
        get inputFlag() {
          return this._inputFlag;
        }
        set inputFlag(value) {
          if (this._inputFlag === value) {
            return;
          }
          this._inputFlag = value;
          this._updateString(this._string);
        }

        /**
         * @en
         * Set the input mode of the edit box.
         * If you pass ANY, it will create a multiline EditBox.
         *
         * @zh
         * 指定输入模式: ANY表示多行输入，其它都是单行输入，移动平台上还可以指定键盘样式。
         */
        get inputMode() {
          return this._inputMode;
        }
        set inputMode(oldValue) {
          if (this._inputMode !== oldValue) {
            this._inputMode = oldValue;
            this._updateTextLabel();
            this._updatePlaceholderLabel();
          }
        }

        /**
         * @en
         * The return key type of EditBox.
         * Note: it is meaningless for web platforms and desktop platforms.
         *
         * @zh
         * 指定移动设备上面回车按钮的样式。
         * 注意：这个选项对 web 平台与 desktop 平台无效。
         */
        get returnType() {
          return this._returnType;
        }
        set returnType(value) {
          this._returnType = value;
        }

        /**
         * @en
         * The maximize input length of EditBox.
         * - If pass a value less than 0, it won't limit the input number of characters.
         * - If pass 0, it doesn't allow input any characters.
         *
         * @zh
         * 输入框最大允许输入的字符个数。
         * - 如果值为小于 0 的值，则不会限制输入字符个数。
         * - 如果值为 0，则不允许用户进行任何输入。
         */
        get maxLength() {
          return this._maxLength;
        }
        set maxLength(value) {
          this._maxLength = value;
        }

        /**
         * @en
         * Set the tabIndex of the DOM input element (only useful on Web).
         *
         * @zh
         * 修改 DOM 输入元素的 tabIndex（这个属性只有在 Web 上面修改有意义）。
         */
        get tabIndex() {
          return this._tabIndex;
        }
        set tabIndex(value) {
          if (this._tabIndex !== value) {
            this._tabIndex = value;
            if (this._impl) {
              this._impl.setTabIndex(value);
            }
          }
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */

        constructor() {
          super();
          /**
           * @en
           * The event handler to be called when EditBox began to edit text.
           *
           * @zh
           * 开始编辑文本输入框触发的事件回调。
           */
          _initializerDefineProperty(this, "editingDidBegan", _descriptor, this);
          /**
           * @en
           * The event handler to be called when EditBox text changes.
           *
           * @zh
           * 编辑文本输入框时触发的事件回调。
           */
          _initializerDefineProperty(this, "textChanged", _descriptor2, this);
          /**
           * @en
           * The event handler to be called when EditBox edit ends.
           *
           * @zh
           * 结束编辑文本输入框时触发的事件回调。
           */
          _initializerDefineProperty(this, "editingDidEnded", _descriptor3, this);
          /**
           * @en
           * The event handler to be called when return key is pressed. Windows is not supported.
           *
           * @zh
           * 当用户按下回车按键时的事件回调，目前不支持 windows 平台。
           */
          _initializerDefineProperty(this, "editingReturn", _descriptor4, this);
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._impl = null;
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._background = null;
          _initializerDefineProperty(this, "_textLabel", _descriptor5, this);
          _initializerDefineProperty(this, "_placeholderLabel", _descriptor6, this);
          _initializerDefineProperty(this, "_returnType", _descriptor7, this);
          _initializerDefineProperty(this, "_string", _descriptor8, this);
          _initializerDefineProperty(this, "_tabIndex", _descriptor9, this);
          _initializerDefineProperty(this, "_backgroundImage", _descriptor0, this);
          _initializerDefineProperty(this, "_inputFlag", _descriptor1, this);
          _initializerDefineProperty(this, "_inputMode", _descriptor10, this);
          _initializerDefineProperty(this, "_maxLength", _descriptor11, this);
          this._isLabelVisible = false;
        }
        __preload() {
          this._init();
        }
        onEnable() {
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._registerEvent();
          }
          this._ensureBackgroundSprite();
          if (this._impl) {
            this._impl.onEnable();
          }
        }
        _beforeDraw() {
          if (this._impl) {
            this._impl.beforeDraw();
          }
        }
        onDisable() {
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._unregisterEvent();
          }
          this._unregisterBackgroundEvent();
          if (this._impl) {
            this._impl.onDisable();
          }
        }
        onDestroy() {
          director.off(DirectorEvent.BEFORE_DRAW, this._beforeDraw, this);
          if (this._impl) {
            this._impl.clear();
          }
        }

        /**
         * @en Let the EditBox get focus.
         * @zh 让当前 EditBox 获得焦点。
         */
        setFocus() {
          if (this._impl) {
            this._impl.setFocus(true);
          }
        }

        /**
         * @en Let the EditBox get focus.
         * @zh 让当前 EditBox 获得焦点。
         */
        focus() {
          if (this._impl) {
            this._impl.setFocus(true);
          }
        }

        /**
         * @en Let the EditBox lose focus.
         * @zh 让当前 EditBox 失去焦点。
         */
        blur() {
          if (this._impl) {
            this._impl.setFocus(false);
          }
        }

        /**
         * @en Determine whether EditBox is getting focus or not.
         * @zh 判断 EditBox 是否获得了焦点。
         * Note: only available on Web at the moment.
         */
        isFocused() {
          if (this._impl) {
            return this._impl.isFocused();
          }
          return false;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _editBoxEditingDidBegan() {
          ComponentEventHandler.emitEvents(this.editingDidBegan, this);
          this.node.emit(EditBoxEventType.EDITING_DID_BEGAN, this);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         * @param text content filtered by sensitive words.This parameter may be undefined.
         * If relevant platform returns desensitized content, it will be passed to developer by EventType.EDITING_DID_ENDED.
         * Now only ByteDance minigame platform
         */
        _editBoxEditingDidEnded(text) {
          ComponentEventHandler.emitEvents(this.editingDidEnded, this);
          this.node.emit(EditBoxEventType.EDITING_DID_ENDED, this, text);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _editBoxTextChanged(text) {
          text = this._updateLabelStringStyle(text, true);
          this.string = text;
          ComponentEventHandler.emitEvents(this.textChanged, text, this);
          this.node.emit(EditBoxEventType.TEXT_CHANGED, this);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         * @param text content filtered by sensitive words.This parameter may be undefined.
         * If relevant platform returns desensitized content, it will be passed to developer by EventType.EDITING_RETURN.
         * Now only ByteDance minigame platform
         */
        _editBoxEditingReturn(text) {
          ComponentEventHandler.emitEvents(this.editingReturn, this);
          this.node.emit(EditBoxEventType.EDITING_RETURN, this, text);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _showLabels() {
          this._isLabelVisible = true;
          this._updateLabels();
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _hideLabels() {
          this._isLabelVisible = false;
          if (this._textLabel) {
            this._textLabel.node.active = false;
          }
          if (this._placeholderLabel) {
            this._placeholderLabel.node.active = false;
          }
        }
        _onTouchBegan(event) {
          event.propagationStopped = true;
        }
        _onTouchCancel(event) {
          event.propagationStopped = true;
        }
        _onTouchEnded(event) {
          if (this._impl) {
            this._impl.beginEditing();
          }
          event.propagationStopped = true;
        }
        _init() {
          this._updatePlaceholderLabel();
          this._updateTextLabel();
          this._isLabelVisible = true;
          this.node.on(NodeEventType.SIZE_CHANGED, this._resizeChildNodes, this);
          director.on(DirectorEvent.BEFORE_DRAW, this._beforeDraw, this);
          const impl = this._impl = new EditBox._EditBoxImpl();
          impl.init(this);
          this._updateString(this._string);
          this._syncSize();
        }
        _ensureBackgroundSprite() {
          if (!this._background) {
            let background = this.node.getComponent(Sprite);
            if (!background) {
              background = this.node.addComponent(Sprite);
            }
            if (background !== this._background) {
              // init background
              background.type = Sprite.Type.SLICED;
              background.spriteFrame = this._backgroundImage;
              this._background = background;
              this._registerBackgroundEvent();
            }
          }
        }
        _updateTextLabel() {
          let textLabel = this._textLabel;

          // If textLabel doesn't exist, create one.
          if (!textLabel) {
            let node = this.node.getChildByName('TEXT_LABEL');
            if (!node) {
              node = new Node('TEXT_LABEL');
              node.layer = this.node.layer;
            }
            textLabel = node.getComponent(Label);
            if (!textLabel) {
              textLabel = node.addComponent(Label);
            }
            node.parent = this.node;
            this._textLabel = textLabel;
          }
          if (this._inputMode === InputMode.ANY) {
            textLabel.verticalAlign = VerticalTextAlignment.TOP;
            textLabel.enableWrapText = true;
          } else {
            textLabel.enableWrapText = false;
          }
          textLabel.string = this._updateLabelStringStyle(this._string);
        }
        _updatePlaceholderLabel() {
          let placeholderLabel = this._placeholderLabel;

          // If placeholderLabel doesn't exist, create one.
          if (!placeholderLabel) {
            let node = this.node.getChildByName('PLACEHOLDER_LABEL');
            if (!node) {
              node = new Node('PLACEHOLDER_LABEL');
              node.layer = this.node.layer;
            }
            placeholderLabel = node.getComponent(Label);
            if (!placeholderLabel) {
              placeholderLabel = node.addComponent(Label);
            }
            node.parent = this.node;
            this._placeholderLabel = placeholderLabel;
          }
          if (this._inputMode === InputMode.ANY) {
            placeholderLabel.enableWrapText = true;
          } else {
            placeholderLabel.enableWrapText = false;
          }
          placeholderLabel.string = this.placeholder;
        }
        _syncSize() {
          const trans = this.node._getUITransformComp();
          const size = trans.contentSize;
          if (this._background) {
            const bgTrans = this._background.node._getUITransformComp();
            bgTrans.anchorPoint = trans.anchorPoint;
            bgTrans.setContentSize(size);
          }
          this._updateLabelPosition(size);
          if (this._impl) {
            this._impl.setSize(size.width, size.height);
          }
        }
        _updateLabels() {
          if (this._isLabelVisible) {
            const content = this._string;
            if (this._textLabel) {
              this._textLabel.node.active = content !== '';
            }
            if (this._placeholderLabel) {
              this._placeholderLabel.node.active = content === '';
            }
          }
        }
        _updateString(text) {
          const textLabel = this._textLabel;
          // Not inited yet
          if (!textLabel) {
            return;
          }
          let displayText = text;
          if (displayText) {
            displayText = this._updateLabelStringStyle(displayText);
          }
          textLabel.string = displayText;
          this._updateLabels();
        }
        _updateLabelStringStyle(text, ignorePassword = false) {
          const inputFlag = this._inputFlag;
          if (!ignorePassword && inputFlag === InputFlag.PASSWORD) {
            let passwordString = '';
            const len = text.length;
            for (let i = 0; i < len; ++i) {
              passwordString += '\u25CF';
            }
            text = passwordString;
          } else if (inputFlag === InputFlag.INITIAL_CAPS_ALL_CHARACTERS) {
            text = text.toUpperCase();
          } else if (inputFlag === InputFlag.INITIAL_CAPS_WORD) {
            text = capitalize(text);
          } else if (inputFlag === InputFlag.INITIAL_CAPS_SENTENCE) {
            text = capitalizeFirstLetter(text);
          }
          return text;
        }
        _registerEvent() {
          const self = this;
          const node = self.node;
          node.on(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.on(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          if (USE_XR) {
            node.on(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
            node.on(XrKeyboardEventType.XR_KEYBOARD_INPUT, self._xrKeyBoardInput, self);
          }
        }
        _unregisterEvent() {
          const self = this;
          const node = self.node;
          node.off(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.off(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          if (USE_XR) {
            node.off(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
            node.off(XrKeyboardEventType.XR_KEYBOARD_INPUT, self._xrKeyBoardInput, self);
          }
        }
        _onBackgroundSpriteFrameChanged() {
          if (!this._background) {
            return;
          }
          this.backgroundImage = this._background.spriteFrame;
        }
        _registerBackgroundEvent() {
          const node = this._background && this._background.node;
          node == null || node.on(SpriteEventType.SPRITE_FRAME_CHANGED, this._onBackgroundSpriteFrameChanged, this);
        }
        _unregisterBackgroundEvent() {
          const node = this._background && this._background.node;
          node == null || node.off(SpriteEventType.SPRITE_FRAME_CHANGED, this._onBackgroundSpriteFrameChanged, this);
        }
        _updateLabelPosition(size) {
          const trans = this.node._getUITransformComp();
          const offX = -trans.anchorX * trans.width;
          const offY = -trans.anchorY * trans.height;
          const placeholderLabel = this._placeholderLabel;
          const textLabel = this._textLabel;
          if (textLabel) {
            textLabel.node._getUITransformComp().setContentSize(size.width - LEFT_PADDING, size.height);
            textLabel.node.setPosition(offX + LEFT_PADDING, offY + size.height, textLabel.node.position.z);
            if (this._inputMode === InputMode.ANY) {
              textLabel.verticalAlign = VerticalTextAlignment.TOP;
            }
            textLabel.enableWrapText = this._inputMode === InputMode.ANY;
          }
          if (placeholderLabel) {
            placeholderLabel.node._getUITransformComp().setContentSize(size.width - LEFT_PADDING, size.height);
            placeholderLabel.node.setPosition(offX + LEFT_PADDING, offY + size.height, placeholderLabel.node.position.z);
            placeholderLabel.enableWrapText = this._inputMode === InputMode.ANY;
          }
        }
        _resizeChildNodes() {
          const trans = this.node._getUITransformComp();
          const textLabelNode = this._textLabel && this._textLabel.node;
          if (textLabelNode) {
            textLabelNode.setPosition(-trans.width / 2, trans.height / 2, textLabelNode.position.z);
            textLabelNode._getUITransformComp().setContentSize(trans.contentSize);
          }
          const placeholderLabelNode = this._placeholderLabel && this._placeholderLabel.node;
          if (placeholderLabelNode) {
            placeholderLabelNode.setPosition(-trans.width / 2, trans.height / 2, placeholderLabelNode.position.z);
            placeholderLabelNode._getUITransformComp().setContentSize(trans.contentSize);
          }
          const backgroundNode = this._background && this._background.node;
          if (backgroundNode) {
            backgroundNode._getUITransformComp().setContentSize(trans.contentSize);
          }
          this._syncSize();
        }
        _xrUnClick() {
          if (!USE_XR) return;
          this.node.emit(EditBoxEventType.XR_EDITING_DID_BEGAN, this._maxLength, this.string);
        }
        _xrKeyBoardInput(str) {
          if (!USE_XR) return;
          this.string = str;
        }
      }, _EditBox._EditBoxImpl = EditBoxImplBase, _EditBox.KeyboardReturnType = KeyboardReturnType, _EditBox.InputFlag = InputFlag, _EditBox.InputMode = InputMode, _EditBox.EventType = EditBoxEventType, _EditBox), _applyDecoratedDescriptor(_class2.prototype, "string", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "string"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "placeholder", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "placeholder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "textLabel", [_dec0, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "textLabel"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "placeholderLabel", [_dec11, _dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "placeholderLabel"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "backgroundImage", [_dec14, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "backgroundImage"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "inputFlag", [_dec17, _dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "inputFlag"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "inputMode", [_dec20, _dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "inputMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "returnType", [_dec23, _dec24, _dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "returnType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxLength", [_dec26, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "maxLength"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "tabIndex", [_dec28, _dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "tabIndex"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "editingDidBegan", [_dec30, serializable, _dec31, _dec32], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "textChanged", [_dec33, serializable, _dec34, _dec35], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "editingDidEnded", [_dec36, serializable, _dec37, _dec38], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "editingReturn", [_dec39, serializable, _dec40, _dec41], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_textLabel", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_placeholderLabel", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_returnType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return KeyboardReturnType.DEFAULT;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_string", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_tabIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_backgroundImage", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_inputFlag", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return InputFlag.DEFAULT;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_inputMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return InputMode.ANY;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_maxLength", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 20;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class)); // this equals to sys.isBrowser
      // now we have no web-adapter yet
      if (typeof window === 'object' && typeof document === 'object' && !MINIGAME && !JSB && !RUNTIME_BASED) {
        EditBox._EditBoxImpl = EditBoxImpl;
      }

      /**
       * @en if you don't need the EditBox and it isn't in any running Scene, you should
       * call the destroy method on this component or the associated node explicitly.
       * Otherwise, the created DOM element won't be removed from web page.
       * @zh
       * 如果你不再使用 EditBox，并且组件未添加到场景中，那么你必须手动对组件或所在节点调用 destroy。
       * 这样才能移除网页上的 DOM 节点，避免 Web 平台内存泄露。
       * @example
       * ```
       * editbox.node.parent = null;  // or  editbox.node.removeFromParent(false);
       * // when you don't need editbox anymore
       * editbox.node.destroy();
       * ```
       * @return {Boolean} whether it is the first time the destroy being called
       */

      legacyCC.internal.EditBox = EditBox;
    }
  };
});