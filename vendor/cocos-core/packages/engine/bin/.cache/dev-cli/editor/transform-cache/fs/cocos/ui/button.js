System.register("q-bundled:///fs/cocos/ui/button.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../2d/assets/index.js", "../scene-graph/index.js", "../2d/framework/index.js", "../core/math/index.js", "../core/value-types/enum.js", "../core/math/utils.js", "../scene-graph/node.js", "../2d/components/sprite.js", "../core/global-exports.js", "../scene-graph/node-enum.js", "../scene-graph/node-event.js", "../xr/event/xr-event-handle.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, requireComponent, tooltip, displayOrder, type, rangeMin, rangeMax, serializable, executeInEditMode, DEBUG, EDITOR, EDITOR_NOT_IN_PREVIEW, USE_XR, SpriteFrame, Component, ComponentEventHandler, UITransform, UIRenderer, Color, v3, Vec3, ccenum, lerp, Node, Sprite, SpriteEventType, legacyCC, TransformBit, NodeEventType, XrUIPressEventType, warn, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _Button, _tempColor, Transition, State, ButtonEventType, Button;
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
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
      rangeMax = _coreDataDecoratorsIndexJs.rangeMax;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
    }, function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_dAssetsIndexJs) {
      SpriteFrame = _dAssetsIndexJs.SpriteFrame;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
      ComponentEventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
      UIRenderer = _dFrameworkIndexJs.UIRenderer;
    }, function (_coreMathIndexJs) {
      Color = _coreMathIndexJs.Color;
      v3 = _coreMathIndexJs.v3;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_coreMathUtilsJs) {
      lerp = _coreMathUtilsJs.lerp;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
      SpriteEventType = _dComponentsSpriteJs.SpriteEventType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_xrEventXrEventHandleJs) {
      XrUIPressEventType = _xrEventXrEventHandleJs.XrUIPressEventType;
    }, function (_coreIndexJs) {
      warn = _coreIndexJs.warn;
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
      _tempColor = new Color();
      /**
       * @en Enum for transition type.
       *
       * @zh 过渡类型。
       */
      Transition = /*#__PURE__*/function (Transition) {
        /**
         * @en The none type.
         *
         * @zh 不做任何过渡。
         */
        Transition[Transition["NONE"] = 0] = "NONE";
        /**
         * @en The color type.
         *
         * @zh 颜色过渡。
         */
        Transition[Transition["COLOR"] = 1] = "COLOR";
        /**
         * @en The sprite type.
         *
         * @zh 精灵过渡。
         */
        Transition[Transition["SPRITE"] = 2] = "SPRITE";
        /**
         * @en The scale type.
         *
         * @zh 缩放过渡。
         */
        Transition[Transition["SCALE"] = 3] = "SCALE";
        return Transition;
      }(Transition || {});
      ccenum(Transition);
      State = /*#__PURE__*/function (State) {
        State[State["NORMAL"] = 0] = "NORMAL";
        State[State["HOVER"] = 1] = "HOVER";
        State[State["PRESSED"] = 2] = "PRESSED";
        State[State["DISABLED"] = 3] = "DISABLED";
        return State;
      }(State || {});
      /**
       * @en The event types of [[Button]]. All button events are distributed by the owner Node, not the component
       * @zh [[Button]] 的事件类型，注意：事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
       */
      _export("ButtonEventType", ButtonEventType = /*#__PURE__*/function (ButtonEventType) {
        /**
         * @event click
         * @param {Event.EventCustom} event
         * @param {Button} button - The Button component.
         */
        ButtonEventType["CLICK"] = "click";
        return ButtonEventType;
      }({}));
      /**
       * @en
       * Button component. Can be pressed or clicked. Button has 4 Transition types:
       *
       *   - Button.Transition.NONE   // Button will do nothing
       *   - Button.Transition.COLOR  // Button will change target's color
       *   - Button.Transition.SPRITE // Button will change target Sprite's sprite
       *   - Button.Transition.SCALE  // Button will change target node's scale
       *
       * The button can bind events (but you must be on the button's node to bind events).<br/>
       * The following events can be triggered on all platforms.
       *
       *  - cc.Node.EventType.TOUCH_START  // Press
       *  - cc.Node.EventType.TOUCH_MOVE   // After pressing and moving
       *  - cc.Node.EventType.TOUCH_END    // After pressing and releasing
       *  - cc.Node.EventType.TOUCH_CANCEL // Press to cancel
       *
       * The following events are only triggered on the PC platform:
       *
       *   - cc.Node.EventType.MOUSE_DOWN
       *   - cc.Node.EventType.MOUSE_MOVE
       *   - cc.Node.EventType.MOUSE_ENTER
       *   - cc.Node.EventType.MOUSE_LEAVE
       *   - cc.Node.EventType.MOUSE_UP
       *
       * The developer can get the current clicked node with `event.target` from event object which is passed as parameter
       * in the callback function of click event.
       *
       * @zh
       * 按钮组件。可以被按下，或者点击。<br>
       * 按钮可以通过修改 Transition 来设置按钮状态过渡的方式：
       *
       *   - Button.Transition.NONE   // 不做任何过渡
       *   - Button.Transition.COLOR  // 进行颜色之间过渡
       *   - Button.Transition.SPRITE // 进行精灵之间过渡
       *   - Button.Transition.SCALE // 进行缩放过渡
       *
       * 按钮可以绑定事件（但是必须要在按钮的 Node 上才能绑定事件）。<br/>
       * 以下事件可以在全平台上都触发：
       *
       *   - cc.Node.EventType.TOUCH_START  // 按下时事件
       *   - cc.Node.EventType.TOUCH_Move   // 按住移动后事件
       *   - cc.Node.EventType.TOUCH_END    // 按下后松开后事件
       *   - cc.Node.EventType.TOUCH_CANCEL // 按下取消事件
       *
       * 以下事件只在 PC 平台上触发：
       *
       *   - cc.Node.EventType.MOUSE_DOWN  // 鼠标按下时事件
       *   - cc.Node.EventType.MOUSE_MOVE  // 鼠标按住移动后事件
       *   - cc.Node.EventType.MOUSE_ENTER // 鼠标进入目标事件
       *   - cc.Node.EventType.MOUSE_LEAVE // 鼠标离开目标事件
       *   - cc.Node.EventType.MOUSE_UP    // 鼠标松开事件
       *
       * 开发者可以通过获取 **点击事件** 回调函数的参数 event 的 target 属性获取当前点击对象。
       *
       * @example
       * ```ts
       * import { log, Node } from 'cc';
       * // Add an event to the button.
       * button.node.on(Node.EventType.TOUCH_START, (event) => {
       *     log("This is a callback after the trigger event");
       * });
       * // You could also add a click event
       * // Note: In this way, you can't get the touch event info, so use it wisely.
       * button.node.on(Node.EventType.CLICK, (button) => {
       *    //The event is a custom event, you could get the Button component via first argument
       * })
       * ```
       */
      _export("Button", Button = (_dec = ccclass('cc.Button'), _dec2 = help('i18n:cc.Button'), _dec3 = executionOrder(110), _dec4 = menu('UI/Button'), _dec5 = requireComponent(UITransform), _dec6 = type(Node), _dec7 = displayOrder(0), _dec8 = tooltip('i18n:button.target'), _dec9 = displayOrder(1), _dec0 = tooltip('i18n:button.interactable'), _dec1 = type(Transition), _dec10 = displayOrder(2), _dec11 = tooltip('i18n:button.transition'), _dec12 = displayOrder(3), _dec13 = tooltip('i18n:button.normal_color'), _dec14 = displayOrder(3), _dec15 = tooltip('i18n:button.pressed_color'), _dec16 = displayOrder(3), _dec17 = tooltip('i18n:button.hover_color'), _dec18 = displayOrder(3), _dec19 = tooltip('i18n:button.disabled_color'), _dec20 = rangeMin(0), _dec21 = rangeMax(10), _dec22 = displayOrder(4), _dec23 = tooltip('i18n:button.duration'), _dec24 = displayOrder(3), _dec25 = tooltip('i18n:button.zoom_scale'), _dec26 = type(SpriteFrame), _dec27 = displayOrder(3), _dec28 = tooltip('i18n:button.normal_sprite'), _dec29 = type(SpriteFrame), _dec30 = displayOrder(3), _dec31 = tooltip('i18n:button.pressed_sprite'), _dec32 = type(SpriteFrame), _dec33 = displayOrder(3), _dec34 = tooltip('i18n:button.hover_sprite'), _dec35 = type(SpriteFrame), _dec36 = displayOrder(3), _dec37 = tooltip('i18n:button.disabled_sprite'), _dec38 = type([ComponentEventHandler]), _dec39 = displayOrder(20), _dec40 = tooltip('i18n:button.click_events'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = (_Button = class Button extends Component {
        /**
         * @en
         * Transition target.<br/>
         * When Button state changed:
         * - Button.Transition.NONE   // Button will do nothing
         * - Button.Transition.COLOR  // Button will change target's color
         * - Button.Transition.SPRITE // Button will change target Sprite's sprite
         * - Button.Transition.SCALE  // Button will change target node's scale
         *
         * @zh
         * 需要过渡的目标。<br/>
         * 按钮可以通过修改 Transition 来设置按钮状态过渡的方式：
         * - Button.Transition.NONE   // 不做任何过渡
         * - Button.Transition.COLOR  // 进行颜色之间过渡
         * - Button.Transition.SPRITE // 进行 Sprite 之间的过渡
         * - Button.Transition.SCALE // 进行缩放过渡
         */
        get target() {
          return this._target || this.node;
        }
        set target(value) {
          if (this._target === value) {
            return;
          }
          if (this._target) {
            // need to remove the old target event listeners
            this._unregisterTargetEvent(this._target);
          }
          this._target = value;
          this._applyTarget();
        }

        /**
         * @en
         * Whether the Button is disabled.
         * If true, the Button will trigger event and do transition.
         *
         * @zh
         * 按钮事件是否被响应，如果为 false，则按钮将被禁用。
         */
        get interactable() {
          return this._interactable;
        }
        set interactable(value) {
          // if (EDITOR) {
          //     if (value) {
          //         this._previousNormalSprite = this.normalSprite;
          //     } else {
          //         this.normalSprite = this._previousNormalSprite;
          //     }
          // }
          if (this._interactable === value) {
            return;
          }
          this._interactable = value;
          this._updateState();
          if (!this._interactable) {
            this._resetState();
          }
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
         * @en
         * Transition type.
         *
         * @zh
         * 按钮状态改变时过渡方式。
         */
        get transition() {
          return this._transition;
        }
        set transition(value) {
          if (this._transition === value) {
            return;
          }

          // Reset to normal data when change transition.
          if (this._transition === Transition.COLOR) {
            this._updateColorTransition(State.NORMAL);
          } else if (this._transition === Transition.SPRITE) {
            this._updateSpriteTransition(State.NORMAL);
          }
          this._transition = value;
          this._updateState();
        }

        // color transition

        /**
         * @en
         * Normal state color.
         *
         * @zh
         * 普通状态下按钮所显示的颜色。
         */
        get normalColor() {
          return this._normalColor;
        }
        set normalColor(value) {
          if (this._normalColor === value) {
            return;
          }
          this._normalColor.set(value);
          this._updateState();
        }

        /**
         * @en
         * Pressed state color.
         *
         * @zh
         * 按下状态时按钮所显示的颜色。
         */
        get pressedColor() {
          return this._pressedColor;
        }
        set pressedColor(value) {
          if (this._pressedColor === value) {
            return;
          }
          this._pressedColor.set(value);
        }

        /**
         * @en
         * Hover state color.
         *
         * @zh
         * 悬停状态下按钮所显示的颜色。
         */
        get hoverColor() {
          return this._hoverColor;
        }
        set hoverColor(value) {
          if (this._hoverColor === value) {
            return;
          }
          this._hoverColor.set(value);
        }
        /**
         * @en
         * Disabled state color.
         *
         * @zh
         * 禁用状态下按钮所显示的颜色。
         */
        get disabledColor() {
          return this._disabledColor;
        }
        set disabledColor(value) {
          if (this._disabledColor === value) {
            return;
          }
          this._disabledColor.set(value);
          this._updateState();
        }

        /**
         * @en
         * Color and Scale transition duration.
         *
         * @zh
         * 颜色过渡和缩放过渡时所需时间。
         */
        get duration() {
          return this._duration;
        }
        set duration(value) {
          if (this._duration === value) {
            return;
          }
          this._duration = value;
        }

        /**
         * @en
         * When user press the button, the button will zoom to a scale.
         * The final scale of the button equals (button original scale * zoomScale)
         * NOTE: Setting zoomScale less than 1 is not adviced, which could fire the touchCancel event
         * if the touch point is out of touch area after scaling.
         * if you need to do so, you should set target as another background node instead of the button node.
         *
         * @zh
         * 当用户点击按钮后，按钮会缩放到一个值，这个值等于 Button 原始 scale * zoomScale。
         * 注意：不建议 zoomScale 的值小于 1, 否则缩放后如果触摸点在触摸区域外, 则会触发 touchCancel 事件。
         * 如果你需要这么做，你应该把 target 设置为另一个背景节点，而不是按钮节点。
         */
        get zoomScale() {
          return this._zoomScale;
        }
        set zoomScale(value) {
          if (this._zoomScale === value) {
            return;
          }
          this._zoomScale = value;
        }

        // sprite transition
        /**
         * @en
         * Normal state sprite.
         *
         * @zh
         * 普通状态下按钮所显示的 Sprite。
         */
        get normalSprite() {
          return this._normalSprite;
        }
        set normalSprite(value) {
          if (this._normalSprite === value) {
            return;
          }
          this._normalSprite = value;
          const sprite = this.node.getComponent(Sprite);
          if (sprite) {
            sprite.spriteFrame = value;
          }
          this._updateState();
        }

        /**
         * @en
         * Pressed state sprite.
         *
         * @zh
         * 按下状态时按钮所显示的 Sprite。
         */
        get pressedSprite() {
          return this._pressedSprite;
        }
        set pressedSprite(value) {
          if (this._pressedSprite === value) {
            return;
          }
          this._pressedSprite = value;
          this._updateState();
        }

        /**
         * @en
         * Hover state sprite.
         *
         * @zh
         * 悬停状态下按钮所显示的 Sprite。
         */
        get hoverSprite() {
          return this._hoverSprite;
        }
        set hoverSprite(value) {
          if (this._hoverSprite === value) {
            return;
          }
          this._hoverSprite = value;
          this._updateState();
        }

        /**
         * @en
         * Disabled state sprite.
         *
         * @zh
         * 禁用状态下按钮所显示的 Sprite。
         */
        get disabledSprite() {
          return this._disabledSprite;
        }
        set disabledSprite(value) {
          if (this._disabledSprite === value) {
            return;
          }
          this._disabledSprite = value;
          this._updateState();
        }

        /**
         * @en Enum for transition type.
         * @zh 过渡类型。
         */

        constructor() {
          super();
          /**
           * @en
           * If Button is clicked, it will trigger event's handler.
           *
           * @zh
           * 按钮的点击事件列表。
           */
          _initializerDefineProperty(this, "clickEvents", _descriptor, this);
          _initializerDefineProperty(this, "_interactable", _descriptor2, this);
          _initializerDefineProperty(this, "_transition", _descriptor3, this);
          _initializerDefineProperty(this, "_normalColor", _descriptor4, this);
          _initializerDefineProperty(this, "_hoverColor", _descriptor5, this);
          _initializerDefineProperty(this, "_pressedColor", _descriptor6, this);
          _initializerDefineProperty(this, "_disabledColor", _descriptor7, this);
          _initializerDefineProperty(this, "_normalSprite", _descriptor8, this);
          _initializerDefineProperty(this, "_hoverSprite", _descriptor9, this);
          _initializerDefineProperty(this, "_pressedSprite", _descriptor0, this);
          _initializerDefineProperty(this, "_disabledSprite", _descriptor1, this);
          _initializerDefineProperty(this, "_duration", _descriptor10, this);
          _initializerDefineProperty(this, "_zoomScale", _descriptor11, this);
          _initializerDefineProperty(this, "_target", _descriptor12, this);
          this._pressed = false;
          this._hovered = false;
          this._fromColor = new Color();
          this._toColor = new Color();
          this._time = 0;
          this._transitionFinished = true;
          this._fromScale = v3();
          this._toScale = v3();
          this._originalScale = null;
          this._sprite = null;
          this._targetScale = v3();
        }
        __preload() {
          if (!this.target) {
            this.target = this.node;
          }
          this._applyTarget();
          this._resetState();
        }
        onEnable() {
          // check sprite frames
          //
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._registerNodeEvent();
          } else {
            this.node.on(SpriteEventType.SPRITE_FRAME_CHANGED, comp => {
              if (this._transition === Transition.SPRITE) {
                this._setCurrentStateSpriteFrame(comp.spriteFrame);
              } else {
                // avoid serialization data loss when in no-sprite mode
                this._normalSprite = null;
                this._hoverSprite = null;
                this._pressedSprite = null;
                this._disabledSprite = null;
              }
            }, this);
          }
        }
        onDisable() {
          this._resetState();
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._unregisterNodeEvent();
          } else {
            this.node.off(SpriteEventType.SPRITE_FRAME_CHANGED);
          }
        }
        onDestroy() {
          if (this.target.isValid) {
            this._unregisterTargetEvent(this.target);
          }
        }
        update(dt) {
          const target = this.target;
          if (this._transitionFinished || !target) {
            return;
          }
          if (this._transition !== Transition.COLOR && this._transition !== Transition.SCALE) {
            return;
          }
          this._time += dt;
          let ratio = 1.0;
          if (this._duration > 0) {
            ratio = this._time / this._duration;
          }
          if (ratio >= 1) {
            ratio = 1;
          }
          if (this._transition === Transition.COLOR) {
            const renderComp = target._uiProps.uiComp;
            Color.lerp(_tempColor, this._fromColor, this._toColor, ratio);
            if (renderComp) {
              renderComp.color = _tempColor;
            }
          } else if (this.transition === Transition.SCALE) {
            target.getScale(this._targetScale);
            this._targetScale.x = lerp(this._fromScale.x, this._toScale.x, ratio);
            this._targetScale.y = lerp(this._fromScale.y, this._toScale.y, ratio);
            target.setScale(this._targetScale);
          }
          if (ratio === 1) {
            this._transitionFinished = true;
          }
        }
        _resizeNodeToTargetNode() {
          if (!this.target) {
            return;
          }
          const targetTrans = this.target._getUITransformComp();
          if (EDITOR && targetTrans) {
            this.node._getUITransformComp().setContentSize(targetTrans.contentSize);
          }
        }
        _resetState() {
          this._pressed = false;
          this._hovered = false;
          // Restore button status
          const target = this.target;
          if (!target) {
            return;
          }
          const transition = this._transition;
          if (transition === Transition.COLOR && this._interactable) {
            const renderComp = target.getComponent(UIRenderer);
            if (renderComp) {
              renderComp.color = this._normalColor;
            }
          } else if (transition === Transition.SCALE && this._originalScale) {
            target.setScale(this._originalScale);
          }
          this._transitionFinished = true;
        }
        _registerNodeEvent() {
          const self = this;
          const node = self.node;
          node.on(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.on(NodeEventType.TOUCH_MOVE, self._onTouchMove, self);
          node.on(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          node.on(NodeEventType.TOUCH_CANCEL, self._onTouchCancel, self);
          node.on(NodeEventType.MOUSE_ENTER, self._onMouseMoveIn, self);
          node.on(NodeEventType.MOUSE_LEAVE, self._onMouseMoveOut, self);
          if (USE_XR) {
            node.on(XrUIPressEventType.XRUI_HOVER_ENTERED, self._xrHoverEnter, self);
            node.on(XrUIPressEventType.XRUI_HOVER_EXITED, self._xrHoverExit, self);
            node.on(XrUIPressEventType.XRUI_CLICK, self._xrClick, self);
            node.on(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
          }
        }
        _registerTargetEvent(target) {
          if (EDITOR_NOT_IN_PREVIEW) {
            target.on(SpriteEventType.SPRITE_FRAME_CHANGED, this._onTargetSpriteFrameChanged, this);
            target.on(NodeEventType.COLOR_CHANGED, this._onTargetColorChanged, this);
          }
          target.on(NodeEventType.TRANSFORM_CHANGED, this._onTargetTransformChanged, this);
        }
        _unregisterNodeEvent() {
          const self = this;
          const node = self.node;
          node.off(NodeEventType.TOUCH_START, self._onTouchBegan, self);
          node.off(NodeEventType.TOUCH_MOVE, self._onTouchMove, self);
          node.off(NodeEventType.TOUCH_END, self._onTouchEnded, self);
          node.off(NodeEventType.TOUCH_CANCEL, self._onTouchCancel, self);
          node.off(NodeEventType.MOUSE_ENTER, self._onMouseMoveIn, self);
          node.off(NodeEventType.MOUSE_LEAVE, self._onMouseMoveOut, self);
          if (USE_XR) {
            node.off(XrUIPressEventType.XRUI_HOVER_ENTERED, self._xrHoverEnter, self);
            node.off(XrUIPressEventType.XRUI_HOVER_EXITED, self._xrHoverExit, self);
            node.off(XrUIPressEventType.XRUI_CLICK, self._xrClick, self);
            node.off(XrUIPressEventType.XRUI_UNCLICK, self._xrUnClick, self);
          }
        }
        _unregisterTargetEvent(target) {
          if (EDITOR_NOT_IN_PREVIEW) {
            target.off(SpriteEventType.SPRITE_FRAME_CHANGED);
            target.off(NodeEventType.COLOR_CHANGED);
          }
          target.off(NodeEventType.TRANSFORM_CHANGED);
        }
        _getTargetSprite(target) {
          let sprite = null;
          if (target) {
            sprite = target.getComponent(Sprite);
          }
          return sprite;
        }
        _applyTarget() {
          if (this.target) {
            this._sprite = this._getTargetSprite(this.target);
            if (!this._originalScale) {
              this._originalScale = new Vec3();
            }
            Vec3.copy(this._originalScale, this.target.scale);
            this._registerTargetEvent(this.target);
          }
        }
        _onTargetSpriteFrameChanged(comp) {
          if (this._transition === Transition.SPRITE) {
            this._setCurrentStateSpriteFrame(comp.spriteFrame);
          }
        }
        _setCurrentStateSpriteFrame(spriteFrame) {
          if (!spriteFrame) {
            return;
          }
          switch (this._getButtonState()) {
            case State.NORMAL:
              this._normalSprite = spriteFrame;
              break;
            case State.HOVER:
              this._hoverSprite = spriteFrame;
              break;
            case State.PRESSED:
              this._pressedSprite = spriteFrame;
              break;
            case State.DISABLED:
              this._disabledSprite = spriteFrame;
              break;
            default:
              break;
          }
        }
        _onTargetColorChanged(color) {
          if (this._transition === Transition.COLOR) {
            this._setCurrentStateColor(color);
          }
        }
        _setCurrentStateColor(color) {
          switch (this._getButtonState()) {
            case State.NORMAL:
              this._normalColor = color;
              break;
            case State.HOVER:
              this._hoverColor = color;
              break;
            case State.PRESSED:
              this._pressedColor = color;
              break;
            case State.DISABLED:
              this._disabledColor = color;
              break;
            default:
              break;
          }
        }
        _onTargetTransformChanged(transformBit) {
          // update originalScale
          if (transformBit & TransformBit.SCALE && this._originalScale && this._transition === Transition.SCALE && this._transitionFinished) {
            Vec3.copy(this._originalScale, this.target.scale);
          }
        }

        // touch event handler
        _onTouchBegan(event) {
          if (!this._interactable || !this.enabledInHierarchy) {
            return;
          }
          this._pressed = true;
          this._updateState();
          if (event) {
            event.propagationStopped = true;
          }
        }
        _onTouchMove(event) {
          if (!this._interactable || !this.enabledInHierarchy || !this._pressed) {
            return;
          }
          // mobile phone will not emit _onMouseMoveOut,
          // so we have to do hit test when touch moving
          if (!event) {
            return;
          }
          const touch = event.touch;
          if (!touch) {
            return;
          }
          const hit = this.node._getUITransformComp().hitTest(touch.getLocation(), event.windowId);
          if (this._transition === Transition.SCALE && this.target && this._originalScale) {
            if (hit) {
              Vec3.copy(this._fromScale, this._originalScale);
              Vec3.multiplyScalar(this._toScale, this._originalScale, this._zoomScale);
              this._transitionFinished = false;
            } else {
              this._time = 0;
              this._transitionFinished = true;
              this.target.setScale(this._originalScale);
            }
          } else {
            let state;
            if (hit) {
              state = State.PRESSED;
            } else {
              state = State.NORMAL;
            }
            this._applyTransition(state);
          }
          if (event) {
            event.propagationStopped = true;
          }
        }
        _onTouchEnded(event) {
          if (!this._interactable || !this.enabledInHierarchy) {
            return;
          }
          if (this._pressed) {
            ComponentEventHandler.emitEvents(this.clickEvents, event);
            this.node.emit(ButtonEventType.CLICK, this);
          }
          this._pressed = false;
          this._updateState();
          if (event) {
            event.propagationStopped = true;
          }
        }
        _onTouchCancel(event) {
          if (!this._interactable || !this.enabledInHierarchy) {
            return;
          }
          this._pressed = false;
          this._updateState();
        }
        _onMouseMoveIn(event) {
          if (this._pressed || !this.interactable || !this.enabledInHierarchy) {
            return;
          }
          if (this._transition === Transition.SPRITE && !this._hoverSprite) {
            return;
          }
          if (!this._hovered) {
            this._hovered = true;
            this._updateState();
          }
        }
        _onMouseMoveOut(event) {
          if (this._hovered) {
            this._hovered = false;
            this._updateState();
          }
        }

        // state handler
        _updateState() {
          const state = this._getButtonState();
          this._applyTransition(state);
        }
        _getButtonState() {
          let state = State.NORMAL;
          if (!this._interactable) {
            state = State.DISABLED;
          } else if (this._pressed) {
            state = State.PRESSED;
          } else if (this._hovered) {
            state = State.HOVER;
          }
          return state;
        }
        _updateColorTransition(state) {
          var _this$target;
          const color = this._getColorByState(state);
          const renderComp = (_this$target = this.target) == null ? void 0 : _this$target.getComponent(UIRenderer);
          if (!renderComp) {
            return;
          }
          if (EDITOR_NOT_IN_PREVIEW || state === State.DISABLED) {
            renderComp.color = color;
            this._transitionFinished = true;
          } else {
            this._fromColor = renderComp.color.clone();
            this._toColor = color;
            this._time = 0;
            this._transitionFinished = false;
          }
        }
        _updateSpriteTransition(state) {
          const sprite = this._getSpriteFrameByState(state);
          if (this._sprite && sprite) {
            this._sprite.spriteFrame = sprite;
          }
        }
        _updateScaleTransition(state) {
          if (!this._interactable) {
            return;
          }
          if (state === State.PRESSED) {
            this._zoomUp();
          } else {
            this._zoomBack();
          }
        }
        _zoomUp() {
          // skip before __preload()
          if (!this._originalScale) {
            return;
          }
          Vec3.copy(this._fromScale, this._originalScale);
          Vec3.multiplyScalar(this._toScale, this._originalScale, this._zoomScale);
          this._time = 0;
          this._transitionFinished = false;
        }
        _zoomBack() {
          if (!this.target || !this._originalScale) {
            return;
          }
          Vec3.copy(this._fromScale, this.target.scale);
          Vec3.copy(this._toScale, this._originalScale);
          this._time = 0;
          this._transitionFinished = false;
        }
        _applyTransition(state) {
          const transition = this._transition;
          if (transition === Transition.COLOR) {
            this._updateColorTransition(state);
          } else if (transition === Transition.SPRITE) {
            this._updateSpriteTransition(state);
          } else if (transition === Transition.SCALE) {
            this._updateScaleTransition(state);
          }
        }
        _getSpriteFrameByState(state) {
          switch (state) {
            case State.NORMAL:
              return this._normalSprite;
            case State.DISABLED:
              return this._disabledSprite;
            case State.HOVER:
              return this.hoverSprite;
            case State.PRESSED:
              return this._pressedSprite;
            default:
              // Should not arrive here.
              if (DEBUG) {
                warn('Button._getColorByState(): wrong state.');
              }
              return null;
          }
        }
        _getColorByState(state) {
          switch (state) {
            case State.NORMAL:
              return this._normalColor;
            case State.DISABLED:
              return this._disabledColor;
            case State.HOVER:
              return this._hoverColor;
            case State.PRESSED:
              return this._pressedColor;
            default:
              // Should not arrive here.
              if (DEBUG) {
                warn('Button._getColorByState(): wrong state.');
              }
              return new Color();
          }
        }
        _xrHoverEnter() {
          if (!USE_XR) return;
          this._onMouseMoveIn();
          this._updateState();
        }
        _xrHoverExit() {
          if (!USE_XR) return;
          this._onMouseMoveOut();
          if (this._pressed) {
            this._pressed = false;
            this._updateState();
          }
        }
        _xrClick() {
          if (!USE_XR) return;
          if (!this._interactable || !this.enabledInHierarchy) {
            return;
          }
          this._pressed = true;
          this._updateState();
        }
        _xrUnClick() {
          if (!USE_XR) return;
          if (!this._interactable || !this.enabledInHierarchy) {
            return;
          }
          if (this._pressed) {
            ComponentEventHandler.emitEvents(this.clickEvents, this);
            this.node.emit(ButtonEventType.CLICK, this);
          }
          this._pressed = false;
          this._updateState();
        }
      }, _Button.Transition = Transition, _Button.EventType = ButtonEventType, _Button), _applyDecoratedDescriptor(_class2.prototype, "target", [_dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "target"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "interactable", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "interactable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "transition", [_dec1, _dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "transition"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "normalColor", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "normalColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "pressedColor", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "pressedColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "hoverColor", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "hoverColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "disabledColor", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "disabledColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "duration", [_dec20, _dec21, _dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "duration"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "zoomScale", [_dec24, _dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "zoomScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "normalSprite", [_dec26, _dec27, _dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "normalSprite"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "pressedSprite", [_dec29, _dec30, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "pressedSprite"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "hoverSprite", [_dec32, _dec33, _dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "hoverSprite"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "disabledSprite", [_dec35, _dec36, _dec37], Object.getOwnPropertyDescriptor(_class2.prototype, "disabledSprite"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "clickEvents", [_dec38, serializable, _dec39, _dec40], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_interactable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_transition", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Transition.NONE;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_normalColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_hoverColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(211, 211, 211, 255);
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_pressedColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_disabledColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(124, 124, 124, 255);
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_normalSprite", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_hoverSprite", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_pressedSprite", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_disabledSprite", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_zoomScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.2;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_target", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
      legacyCC.Button = Button;
    }
  };
});