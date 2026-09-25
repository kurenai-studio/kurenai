System.register("q-bundled:///fs/cocos/ui/slider.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../scene-graph/index.js", "../2d/framework/index.js", "../core/math/index.js", "../core/value-types/enum.js", "../core/math/utils.js", "../2d/components/sprite.js", "../core/global-exports.js", "../scene-graph/node-event.js", "../xr/event/xr-event-handle.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, requireComponent, tooltip, type, slide, range, serializable, EDITOR, USE_XR, Component, EventHandler, UITransform, Vec3, ccenum, clamp01, Sprite, legacyCC, NodeEventType, XrUIPressEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _Slider, _tempPos, Direction, Slider;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      slide = _coreDataDecoratorsIndexJs.slide;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
      EventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_coreMathIndexJs) {
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_coreMathUtilsJs) {
      clamp01 = _coreMathUtilsJs.clamp01;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_xrEventXrEventHandleJs) {
      XrUIPressEventType = _xrEventXrEventHandleJs.XrUIPressEventType;
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
      _tempPos = new Vec3();
      /**
       * @en
       * The Slider Direction.
       *
       * @zh
       * 滑动器方向。
       */
      Direction = /*#__PURE__*/function (Direction) {
        /**
         * @en
         * The horizontal direction.
         *
         * @zh
         * 水平方向。
         */
        Direction[Direction["Horizontal"] = 0] = "Horizontal";
        /**
         * @en
         * The vertical direction.
         *
         * @zh
         * 垂直方向。
         */
        Direction[Direction["Vertical"] = 1] = "Vertical";
        return Direction;
      }(Direction || {});
      ccenum(Direction);

      /**
       * @en
       * The Slider Control.
       *
       * @zh
       * 滑动器组件。
       */
      _export("Slider", Slider = (_dec = ccclass('cc.Slider'), _dec2 = help('i18n:cc.Slider'), _dec3 = executionOrder(110), _dec4 = menu('UI/Slider'), _dec5 = requireComponent(UITransform), _dec6 = type(Sprite), _dec7 = tooltip('i18n:slider.handle'), _dec8 = type(Direction), _dec9 = tooltip('i18n:slider.direction'), _dec0 = range([0, 1, 0.01]), _dec1 = tooltip('i18n:slider.progress'), _dec10 = type([EventHandler]), _dec11 = tooltip('i18n:slider.slideEvents'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = (_class2 = (_Slider = class Slider extends Component {
        /**
         * @en
         * The "handle" part of the slider.
         *
         * @zh
         * 滑动器滑块按钮部件。
         */
        get handle() {
          return this._handle;
        }
        set handle(value) {
          if (this._handle === value) {
            return;
          }
          this._handle = value;
          if (EDITOR && this._handle) {
            this._updateHandlePosition();
          }
        }

        /**
         * @en
         * The slider direction.
         *
         * @zh
         * 滑动器方向。
         */
        get direction() {
          return this._direction;
        }
        set direction(value) {
          if (this._direction === value) {
            return;
          }
          this._direction = value;
          this._changeLayout();
        }

        /**
         * @en
         * The current progress of the slider. The valid value is between 0-1.
         *
         * @zh
         * 当前进度值，该数值的区间是 0-1 之间。
         */
        get progress() {
          return this._progress;
        }
        set progress(value) {
          if (this._progress === value) {
            return;
          }
          this._progress = value;
          this._updateHandlePosition();
        }
        constructor() {
          super();
          /**
           * @en
           * The slider slide events' callback array.
           *
           * @zh
           * 滑动器组件滑动事件回调函数数组。
           */
          _initializerDefineProperty(this, "slideEvents", _descriptor, this);
          _initializerDefineProperty(this, "_handle", _descriptor2, this);
          _initializerDefineProperty(this, "_direction", _descriptor3, this);
          _initializerDefineProperty(this, "_progress", _descriptor4, this);
          this._offset = new Vec3();
          this._dragging = false;
          this._touchHandle = false;
          this._handleLocalPos = new Vec3();
          this._touchPos = new Vec3();
        }
        __preload() {
          this._updateHandlePosition();
        }

        // 注册事件

        onEnable() {
          const self = this;
          const node = self.node;
          const handle = self._handle;
          self._updateHandlePosition();
          node.on(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.on(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self);
          node.on(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          node.on(NodeEventType.TOUCH_CANCEL, self._onTouchCancelled, self);
          if (USE_XR) {
            node.on(XrUIPressEventType.XRUI_HOVER_STAY, self._xrHoverStay, self);
            node.on(XrUIPressEventType.XRUI_CLICK, self._xrClick, self);
            node.on(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
          }
          if (handle && handle.isValid) {
            const handleNode = handle.node;
            handleNode.on(NodeEventType.TOUCH_START, self._onHandleDragStart, self);
            handleNode.on(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self);
            handleNode.on(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          }
        }
        onDisable() {
          const self = this;
          const node = self.node;
          const handle = self._handle;
          node.off(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.off(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self);
          node.off(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          node.off(NodeEventType.TOUCH_CANCEL, self._onTouchCancelled, self);
          if (USE_XR) {
            node.off(XrUIPressEventType.XRUI_HOVER_STAY, self._xrHoverStay, self);
            node.off(XrUIPressEventType.XRUI_CLICK, self._xrClick, self);
            node.off(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
          }
          if (handle && handle.isValid) {
            const handleNode = handle.node;
            handleNode.off(NodeEventType.TOUCH_START, self._onHandleDragStart, self);
            handleNode.off(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self);
            handleNode.off(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          }
        }
        _onHandleDragStart(event) {
          if (!event || !this._handle || !this._handle.node._getUITransformComp()) {
            return;
          }
          this._dragging = true;
          this._touchHandle = true;
          const touhPos = event.touch.getUILocation();
          Vec3.set(this._touchPos, touhPos.x, touhPos.y, 0);
          this._handle.node._getUITransformComp().convertToNodeSpaceAR(this._touchPos, this._offset);
          event.propagationStopped = true;
        }
        _onTouchBegan(event) {
          if (!this._handle || !event) {
            return;
          }
          this._dragging = true;
          if (!this._touchHandle) {
            this._handleSliderLogic(event.touch);
          }
          event.propagationStopped = true;
        }
        _onTouchMoved(event) {
          if (!this._dragging || !event) {
            return;
          }
          this._handleSliderLogic(event.touch);
          event.propagationStopped = true;
        }
        _onTouchEnded(event) {
          this._dragging = false;
          this._touchHandle = false;
          this._offset = new Vec3();
          if (event) {
            event.propagationStopped = true;
          }
        }
        _onTouchCancelled(event) {
          this._dragging = false;
          if (event) {
            event.propagationStopped = true;
          }
        }
        _handleSliderLogic(touch) {
          this._updateProgress(touch);
          this._emitSlideEvent();
        }
        _emitSlideEvent() {
          EventHandler.emitEvents(this.slideEvents, this);
          this.node.emit('slide', this);
        }
        _updateProgress(touch) {
          if (!this._handle || !touch) {
            return;
          }
          const touchPos = touch.getUILocation();
          Vec3.set(this._touchPos, touchPos.x, touchPos.y, 0);
          const uiTrans = this.node._getUITransformComp();
          const localTouchPos = uiTrans.convertToNodeSpaceAR(this._touchPos, _tempPos);
          localTouchPos.x += uiTrans.anchorX * uiTrans.width;
          localTouchPos.y += uiTrans.anchorY * uiTrans.height;
          if (this.direction === Direction.Horizontal) {
            this.progress = clamp01((localTouchPos.x - this._offset.x) / uiTrans.width);
          } else {
            this.progress = clamp01((localTouchPos.y - this._offset.y) / uiTrans.height);
          }
        }
        _updateHandlePosition() {
          if (!this._handle) {
            return;
          }
          this._handleLocalPos.set(this._handle.node.position);
          const uiTrans = this.node._getUITransformComp();
          if (this._direction === Direction.Horizontal) {
            this._handleLocalPos.x = -uiTrans.width * uiTrans.anchorX + this.progress * uiTrans.width;
          } else {
            this._handleLocalPos.y = -uiTrans.height * uiTrans.anchorY + this.progress * uiTrans.height;
          }
          this._handle.node.setPosition(this._handleLocalPos);
        }
        _changeLayout() {
          const uiTrans = this.node._getUITransformComp();
          const contentSize = uiTrans.contentSize;
          uiTrans.setContentSize(contentSize.height, contentSize.width);
          if (this._handle) {
            const pos = this._handle.node.position;
            if (this._direction === Direction.Horizontal) {
              this._handle.node.setPosition(pos.x, 0, pos.z);
            } else {
              this._handle.node.setPosition(0, pos.y, pos.z);
            }
            this._updateHandlePosition();
          }
        }
        _xrHandleProgress(point) {
          if (!USE_XR) return;
          if (!this._touchHandle) {
            const uiTrans = this.node._getUITransformComp();
            uiTrans.convertToNodeSpaceAR(point, _tempPos);
            if (this.direction === Direction.Horizontal) {
              this.progress = clamp01(0.5 + (_tempPos.x - this.node.position.x) / uiTrans.width);
            } else {
              this.progress = clamp01(0.5 + (_tempPos.y - this.node.position.y) / uiTrans.height);
            }
          }
        }
        _xrClick(event) {
          if (!USE_XR) return;
          if (!this._handle) {
            return;
          }
          this._dragging = true;
          this._xrHandleProgress(event.hitPoint);
          this._emitSlideEvent();
        }
        _xrUnClick() {
          if (!USE_XR) return;
          this._dragging = false;
          this._touchHandle = false;
        }
        _xrHoverStay(event) {
          if (!USE_XR) return;
          if (!this._dragging) {
            return;
          }
          this._xrHandleProgress(event.hitPoint);
          this._emitSlideEvent();
        }
      }, _Slider.Direction = Direction, _Slider), _applyDecoratedDescriptor(_class2.prototype, "handle", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "handle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "direction", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "direction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "progress", [slide, _dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "progress"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "slideEvents", [_dec10, serializable, _dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_handle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_direction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Direction.Horizontal;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_progress", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      /**
       * @zh
       * 注意：此事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
       * @event slide
       * @param {Event.EventCustom} event
       * @param {Slider} slider - The slider component.
       */
      legacyCC.Slider = Slider;
    }
  };
});