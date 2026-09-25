System.register("q-bundled:///fs/cocos/ui/progress-bar.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../2d/framework/index.js", "../core/math/index.js", "../core/value-types/index.js", "../core/math/utils.js", "../2d/components/sprite.js", "../core/platform/debug.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, requireComponent, tooltip, type, range, slide, serializable, Component, UITransform, Size, Vec2, Vec3, Enum, clamp01, Sprite, warnID, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _ProgressBar, Mode, ProgressBar;
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
      range = _coreDataDecoratorsIndexJs.range;
      slide = _coreDataDecoratorsIndexJs.slide;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_coreMathIndexJs) {
      Size = _coreMathIndexJs.Size;
      Vec2 = _coreMathIndexJs.Vec2;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }, function (_coreMathUtilsJs) {
      clamp01 = _coreMathUtilsJs.clamp01;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
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
      /**
       * @en
       * Enum for ProgressBar mode.
       *
       * @zh
       * 进度条模式。
       */
      Mode = /*#__PURE__*/function (Mode) {
        /**
         * @en
         * The mode of horizontal.
         *
         * @zh
         * 水平方向模式。
         */
        Mode[Mode["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en
         * The mode of vertical.
         *
         * @zh
         *  垂直方向模式。
         */
        Mode[Mode["VERTICAL"] = 1] = "VERTICAL";
        /**
         * @en
         * The mode of fill.
         *
         * @zh
         * 填充模式。
         */
        Mode[Mode["FILLED"] = 2] = "FILLED";
        return Mode;
      }(Mode || {});
      Enum(Mode);

      /**
       * @en
       * Visual indicator of progress in some operation.
       * Displays a bar to the user representing how far the operation has progressed.
       *
       * @zh
       * 进度条组件，可用于显示加载资源时的进度。
       *
       * @example
       * ```ts
       * // update progressBar
       * update(dt) {
       *     var progress = progressBar.progress;
       *     if (progress > 0) {
       *         progress += dt;
       *     }
       *     else {
       *         progress = 1;
       *     }
       *     progressBar.progress = progress;
       * }
       * ```
       */
      _export("ProgressBar", ProgressBar = (_dec = ccclass('cc.ProgressBar'), _dec2 = help('i18n:cc.ProgressBar'), _dec3 = executionOrder(110), _dec4 = menu('UI/ProgressBar'), _dec5 = requireComponent(UITransform), _dec6 = type(Sprite), _dec7 = tooltip('i18n:progress.bar_sprite'), _dec8 = type(Mode), _dec9 = tooltip('i18n:progress.mode'), _dec0 = tooltip('i18n:progress.total_length'), _dec1 = range([0, 1, 0.1]), _dec10 = tooltip('i18n:progress.progress'), _dec11 = tooltip('i18n:progress.reverse'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = (_class2 = (_ProgressBar = class ProgressBar extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_barSprite", _descriptor, this);
          _initializerDefineProperty(this, "_mode", _descriptor2, this);
          _initializerDefineProperty(this, "_totalLength", _descriptor3, this);
          _initializerDefineProperty(this, "_progress", _descriptor4, this);
          _initializerDefineProperty(this, "_reverse", _descriptor5, this);
        }

        /**
         * @en
         * The targeted Sprite which will be changed progressively.
         *
         * @zh
         * 用来显示进度条比例的 Sprite 对象。
         */
        get barSprite() {
          return this._barSprite;
        }
        set barSprite(value) {
          if (this._barSprite === value) {
            return;
          }
          this._barSprite = value;
          this._initBarSprite();
        }

        /**
         * @en
         * The progress mode, there are two modes supported now: horizontal and vertical.
         *
         * @zh
         * 进度条的模式。
         */
        get mode() {
          return this._mode;
        }
        set mode(value) {
          if (this._mode === value) {
            return;
          }
          this._mode = value;
          if (this._barSprite) {
            const entity = this._barSprite.node;
            if (!entity) {
              return;
            }
            const entitySize = entity._getUITransformComp().contentSize;
            if (this._mode === Mode.HORIZONTAL) {
              this.totalLength = entitySize.width;
            } else if (this._mode === Mode.VERTICAL) {
              this.totalLength = entitySize.height;
            } else if (this._mode === Mode.FILLED) {
              this.totalLength = this._barSprite.fillRange;
            }
          }
        }

        /**
         * @en
         * The total width or height of the bar sprite.
         *
         * @zh
         * 进度条实际的总长度。
         */
        get totalLength() {
          return this._totalLength;
        }
        set totalLength(value) {
          if (this._mode === Mode.FILLED) {
            value = clamp01(value);
          }
          if (this._totalLength === value) {
            return;
          }
          this._totalLength = value;
          this._updateBarStatus();
        }

        /**
         * @en
         * The current progress of the bar sprite. The valid value is between 0-1.
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
          this._updateBarStatus();
        }

        /**
         * @en
         * Whether reverse the progress direction of the bar sprite.
         *
         * @zh
         * 进度条是否进行反方向变化。
         */
        get reverse() {
          return this._reverse;
        }
        set reverse(value) {
          if (this._reverse === value) {
            return;
          }
          this._reverse = value;
          if (this._barSprite) {
            this._barSprite.fillStart = 1 - this._barSprite.fillStart;
          }
          this._updateBarStatus();
        }
        onLoad() {
          this._updateBarStatus();
        }
        _initBarSprite() {
          if (this._barSprite) {
            const entity = this._barSprite.node;
            if (!entity) {
              return;
            }
            const trans = this.node._getUITransformComp();
            const nodeSize = trans.contentSize;
            const nodeAnchor = trans.anchorPoint;
            const barSpriteSize = entity._getUITransformComp().contentSize;

            // if (entity.parent === this.node) {
            //     this.node.setContentSize(barSpriteSize);
            // }

            if (this._barSprite.fillType === Sprite.FillType.RADIAL) {
              this._mode = Mode.FILLED;
            }
            if (this._mode === Mode.HORIZONTAL) {
              this.totalLength = barSpriteSize.width;
            } else if (this._mode === Mode.VERTICAL) {
              this.totalLength = barSpriteSize.height;
            } else {
              this.totalLength = this._barSprite.fillRange;
            }
            if (entity.parent === this.node) {
              const x = -nodeSize.width * nodeAnchor.x;
              entity.setPosition(x, 0, 0);
            }
          }
        }
        _updateBarStatus() {
          if (this._barSprite) {
            const entity = this._barSprite.node;
            if (!entity) {
              return;
            }
            const entTrans = entity._getUITransformComp();
            const entityAnchorPoint = entTrans.anchorPoint;
            const entitySize = entTrans.contentSize;
            let anchorPoint = new Vec2(0, 0.5);
            const progress = clamp01(this._progress);
            let actualLenth = this._totalLength * progress;
            let finalContentSize = entitySize;
            let totalWidth = 0;
            let totalHeight = 0;
            switch (this._mode) {
              case Mode.HORIZONTAL:
                if (this._reverse) {
                  anchorPoint = new Vec2(1, 0.5);
                }
                finalContentSize = new Size(actualLenth, entitySize.height);
                totalWidth = this._totalLength;
                totalHeight = entitySize.height;
                break;
              case Mode.VERTICAL:
                if (this._reverse) {
                  anchorPoint = new Vec2(0.5, 1);
                } else {
                  anchorPoint = new Vec2(0.5, 0);
                }
                finalContentSize = new Size(entitySize.width, actualLenth);
                totalWidth = entitySize.width;
                totalHeight = this._totalLength;
                break;
              default:
                break;
            }

            // handling filled mode
            if (this._mode === Mode.FILLED) {
              if (this._barSprite.type !== Sprite.Type.FILLED) {
                warnID(16397);
              } else {
                if (this._reverse) {
                  actualLenth *= -1;
                }
                this._barSprite.fillRange = actualLenth;
              }
            } else if (this._barSprite.type !== Sprite.Type.FILLED) {
              const anchorOffsetX = anchorPoint.x - entityAnchorPoint.x;
              const anchorOffsetY = anchorPoint.y - entityAnchorPoint.y;
              const finalPosition = new Vec3(entity.position);
              finalPosition.add3f(totalWidth * anchorOffsetX, totalHeight * anchorOffsetY, 0);
              entity.setPosition(finalPosition);
              entTrans.setAnchorPoint(anchorPoint);
              entTrans.setContentSize(finalContentSize);
            } else {
              warnID(16398);
            }
          }
        }
      }, _ProgressBar.Mode = Mode, _ProgressBar), _applyDecoratedDescriptor(_class2.prototype, "barSprite", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "barSprite"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mode", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "mode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "totalLength", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "totalLength"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "progress", [_dec1, slide, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "progress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reverse", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "reverse"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_barSprite", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_mode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Mode.HORIZONTAL;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_totalLength", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_progress", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_reverse", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      legacyCC.ProgressBar = ProgressBar;
    }
  };
});