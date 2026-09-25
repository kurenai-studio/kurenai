System.register("q-bundled:///fs/cocos/particle-2d/motion-streak-2d.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../2d/framework/index.js", "../asset/assets/texture-2d.js", "../core/index.js", "../2d/renderer/render-entity.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, serializable, playOnFocus, menu, help, editable, type, EDITOR_NOT_IN_PREVIEW, JSB, UIRenderer, Texture2D, Vec2, RenderEntityFillColorType, Point, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _MotionStreak, MotionStreak;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  _export("Point", void 0);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      playOnFocus = _coreDataDecoratorsIndexJs.playOnFocus;
      menu = _coreDataDecoratorsIndexJs.menu;
      help = _coreDataDecoratorsIndexJs.help;
      editable = _coreDataDecoratorsIndexJs.editable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_dFrameworkIndexJs) {
      UIRenderer = _dFrameworkIndexJs.UIRenderer;
    }, function (_assetAssetsTexture2dJs) {
      Texture2D = _assetAssetsTexture2dJs.Texture2D;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
    }, function (_dRendererRenderEntityJs) {
      RenderEntityFillColorType = _dRendererRenderEntityJs.RenderEntityFillColorType;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("Point", Point = class Point {
        constructor(point, dir) {
          this.point = new Vec2();
          this.dir = new Vec2();
          this.distance = 0;
          this.time = 0;
          if (point) this.point.set(point);
          if (dir) this.dir.set(dir);
        }
        setPoint(x, y) {
          this.point.x = x;
          this.point.y = y;
        }
        setDir(x, y) {
          this.dir.x = x;
          this.dir.y = y;
        }
      });
      /**
       * @en
       * cc.MotionStreak manages a Ribbon based on it's motion in absolute space.                 <br/>
       * You construct it with a fadeTime, minimum segment size, texture path, texture            <br/>
       * length and color. The fadeTime controls how long it takes each vertex in                 <br/>
       * the streak to fade out, the minimum segment size it how many pixels the                  <br/>
       * streak will move before adding a new ribbon segment, and the texture                     <br/>
       * length is the how many pixels the texture is stretched across. The texture               <br/>
       * is vertically aligned along the streak segment.
       * @zh 运动轨迹，用于游戏对象的运动轨迹上实现拖尾渐隐效果。
       */
      _export("MotionStreak", MotionStreak = (_dec = ccclass('cc.MotionStreak'), _dec2 = menu('Effects/MotionStreak'), _dec3 = help('i18n:COMPONENT.help_url.motionStreak'), _dec4 = type(Texture2D), _dec(_class = executeInEditMode(_class = playOnFocus(_class = _dec2(_class = _dec3(_class = (_class2 = (_MotionStreak = class MotionStreak extends UIRenderer {
        constructor() {
          super();
          _initializerDefineProperty(this, "_preview", _descriptor, this);
          _initializerDefineProperty(this, "_fadeTime", _descriptor2, this);
          _initializerDefineProperty(this, "_minSeg", _descriptor3, this);
          _initializerDefineProperty(this, "_stroke", _descriptor4, this);
          _initializerDefineProperty(this, "_texture", _descriptor5, this);
          _initializerDefineProperty(this, "_fastMode", _descriptor6, this);
          this._points = [];
          this.setFillColorType(RenderEntityFillColorType.VERTEX);
        }

        /**
         * @en Preview the trailing effect in editor mode.
         * @zh 在编辑器模式下预览拖尾效果。
         */
        get preview() {
          return this._preview;
        }
        set preview(val) {
          this._preview = val;
          this.reset();
        }
        /**
         * @en The fade time to fade.
         * @zh 拖尾的渐隐时间，以秒为单位。
         * @example
         * motionStreak.fadeTime = 3;
         */
        get fadeTime() {
          return this._fadeTime;
        }
        set fadeTime(val) {
          this._fadeTime = val;
          this.reset();
        }
        /**
         * @en The minimum segment size.
         * @zh 拖尾之间最小距离。
         * @example
         * motionStreak.minSeg = 3;
         */
        get minSeg() {
          return this._minSeg;
        }
        set minSeg(val) {
          this._minSeg = val;
        }
        /**
         * @en The stroke's width.
         * @zh 拖尾的宽度。
         * @example
         * motionStreak.stroke = 64;
         */
        get stroke() {
          return this._stroke;
        }
        set stroke(val) {
          this._stroke = val;
        }

        /**
         * @en The texture of the MotionStreak.
         * @zh 拖尾的贴图。
         * @example
         * motionStreak.texture = newTexture;
         */
        get texture() {
          return this._texture;
        }
        set texture(val) {
          if (this._texture === val) return;
          this._texture = val;
        }
        /**
         * @en The fast Mode.
         * @zh 是否启用了快速模式。当启用快速模式，新的点会被更快地添加，但精度较低。
         * @example
         * motionStreak.fastMode = true;
         */
        get fastMode() {
          return this._fastMode;
        }
        set fastMode(val) {
          this._fastMode = val;
        }
        get points() {
          return this._points;
        }
        onEnable() {
          super.onEnable();
          this.reset();
        }
        _flushAssembler() {
          const assembler = MotionStreak.Assembler.getAssembler(this);
          if (this._assembler !== assembler) {
            this._assembler = assembler;
          }
          if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
              this._renderData = this._assembler.createData(this);
              this._renderData.material = this.material;
              if (JSB) {
                this._renderData.renderDrawInfo.setVertexPositionInWorld(true);
              }
              this._updateColor();
            }
          }
        }
        onFocusInEditor() {
          if (this._preview) {
            this.reset();
          }
        }
        onLostFocusInEditor() {
          if (this._preview) {
            this.reset();
          }
        }

        /**
         * @en Remove all living segments of the ribbon.
         * @zh 删除当前所有的拖尾片段。
         * @example
         * // Remove all living segments of the ribbon.
         * myMotionStreak.reset();
         */
        reset() {
          this._points.length = 0;
          if (this._renderData) this._renderData.clear();
        }
        lateUpdate(dt) {
          if (EDITOR_NOT_IN_PREVIEW && !this._preview) return;
          if (this._assembler && this._assembler.update) {
            this._assembler.update(this, dt);
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _render(render) {
          render.commitComp(this, this._renderData, this._texture, this._assembler, null);
        }
      }, _MotionStreak.Point = Point, _MotionStreak), _applyDecoratedDescriptor(_class2.prototype, "preview", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "preview"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fadeTime", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "fadeTime"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "minSeg", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "minSeg"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "stroke", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "stroke"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "texture", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "texture"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fastMode", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "fastMode"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_preview", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_fadeTime", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_minSeg", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_stroke", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 64;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_texture", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_fastMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});