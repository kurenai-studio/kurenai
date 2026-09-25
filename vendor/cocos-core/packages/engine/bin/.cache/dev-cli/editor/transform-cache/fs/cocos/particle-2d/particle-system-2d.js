System.register("q-bundled:///fs/cocos/particle-2d/particle-system-2d.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../2d/framework/ui-renderer.js", "../core/index.js", "./particle-simulator-2d.js", "../2d/assets/sprite-frame.js", "../asset/assets/image-asset.js", "./particle-asset.js", "../gfx/index.js", "./png-reader.js", "./tiff-reader.js", "../../external/compression/ZipUtils.js", "../asset/asset-manager/index.js", "./define.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, type, displayOrder, menu, executeInEditMode, serializable, playOnFocus, tooltip, visible, formerlySerializedAs, override, EDITOR, EDITOR_NOT_IN_PREVIEW, UIRenderer, Color, Vec2, warnID, errorID, error, path, Simulator, SpriteFrame, ImageAsset, ParticleAsset, BlendFactor, PNGReader, tiffReader, codec, assetManager, builtinResMgr, PositionType, EmitterMode, DURATION_INFINITY, START_RADIUS_EQUAL_TO_END_RADIUS, START_SIZE_EQUAL_TO_END_SIZE, ccwindow, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _descriptor41, _ParticleSystem2D, ImageFormat, wrapParseInt, wrapParseFloat, ParticleSystem2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function getImageFormatByData(imgData) {
    // if it is a png file buffer.
    if (imgData.length > 8 && imgData[0] === 0x89 && imgData[1] === 0x50 && imgData[2] === 0x4E && imgData[3] === 0x47 && imgData[4] === 0x0D && imgData[5] === 0x0A && imgData[6] === 0x1A && imgData[7] === 0x0A) {
      return ImageFormat.PNG;
    }

    // if it is a tiff file buffer.
    if (imgData.length > 2 && (imgData[0] === 0x49 && imgData[1] === 0x49 || imgData[0] === 0x4d && imgData[1] === 0x4d || imgData[0] === 0xff && imgData[1] === 0xd8)) {
      return ImageFormat.TIFF;
    }
    return ImageFormat.UNKNOWN;
  }
  function getParticleComponents(node) {
    const parent = node.parent;
    const comp = node.getComponent(ParticleSystem2D);
    if (!parent || !comp) {
      return node.getComponentsInChildren(ParticleSystem2D);
    }
    return getParticleComponents(parent);
  }
  _export("getImageFormatByData", getImageFormatByData);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      playOnFocus = _coreDataDecoratorsIndexJs.playOnFocus;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      visible = _coreDataDecoratorsIndexJs.visible;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      override = _coreDataDecoratorsIndexJs.override;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_dFrameworkUiRendererJs) {
      UIRenderer = _dFrameworkUiRendererJs.UIRenderer;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Vec2 = _coreIndexJs.Vec2;
      warnID = _coreIndexJs.warnID;
      errorID = _coreIndexJs.errorID;
      error = _coreIndexJs.error;
      path = _coreIndexJs.path;
    }, function (_particleSimulator2dJs) {
      Simulator = _particleSimulator2dJs.Simulator;
    }, function (_dAssetsSpriteFrameJs) {
      SpriteFrame = _dAssetsSpriteFrameJs.SpriteFrame;
    }, function (_assetAssetsImageAssetJs) {
      ImageAsset = _assetAssetsImageAssetJs.ImageAsset;
    }, function (_particleAssetJs) {
      ParticleAsset = _particleAssetJs.ParticleAsset;
    }, function (_gfxIndexJs) {
      BlendFactor = _gfxIndexJs.BlendFactor;
    }, function (_pngReaderJs) {
      PNGReader = _pngReaderJs.PNGReader;
    }, function (_tiffReaderJs) {
      tiffReader = _tiffReaderJs.tiffReader;
    }, function (_externalCompressionZipUtilsJs) {
      codec = _externalCompressionZipUtilsJs.default;
    }, function (_assetAssetManagerIndexJs) {
      assetManager = _assetAssetManagerIndexJs.assetManager;
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_defineJs) {
      PositionType = _defineJs.PositionType;
      EmitterMode = _defineJs.EmitterMode;
      DURATION_INFINITY = _defineJs.DURATION_INFINITY;
      START_RADIUS_EQUAL_TO_END_RADIUS = _defineJs.START_RADIUS_EQUAL_TO_END_RADIUS;
      START_SIZE_EQUAL_TO_END_SIZE = _defineJs.START_SIZE_EQUAL_TO_END_SIZE;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
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
      /**
       * Image formats
       * @enum macro.ImageFormat
       */
      _export("ImageFormat", ImageFormat = /*#__PURE__*/function (ImageFormat) {
        /**
         * @en Image Format:JPG
         * @zh 图片格式:JPG
         */
        ImageFormat[ImageFormat["JPG"] = 0] = "JPG";
        /**
         * @en Image Format:PNG
         * @zh 图片格式:PNG
         */
        ImageFormat[ImageFormat["PNG"] = 1] = "PNG";
        /**
         * @en Image Format:TIFF
         * @zh 图片格式:TIFF
         */
        ImageFormat[ImageFormat["TIFF"] = 2] = "TIFF";
        /**
         * @en Image Format:WEBP
         * @zh 图片格式:WEBP
         */
        ImageFormat[ImageFormat["WEBP"] = 3] = "WEBP";
        /**
         * @en Image Format:PVR
         * @zh 图片格式:PVR
         */
        ImageFormat[ImageFormat["PVR"] = 4] = "PVR";
        /**
         * @en Image Format:ETC
         * @zh 图片格式:ETC
         */
        ImageFormat[ImageFormat["ETC"] = 5] = "ETC";
        /**
         * @en Image Format:S3TC
         * @zh 图片格式:S3TC
         */
        ImageFormat[ImageFormat["S3TC"] = 6] = "S3TC";
        /**
         * @en Image Format:ATITC
         * @zh 图片格式:ATITC
         */
        ImageFormat[ImageFormat["ATITC"] = 7] = "ATITC";
        /**
         * @en Image Format:TGA
         * @zh 图片格式:TGA
         */
        ImageFormat[ImageFormat["TGA"] = 8] = "TGA";
        /**
         * @en Image Format:RAWDATA
         * @zh 图片格式:RAWDATA
         */
        ImageFormat[ImageFormat["RAWDATA"] = 9] = "RAWDATA";
        /**
         * @en Image Format:UNKNOWN
         * @zh 图片格式:UNKNOWN
         */
        ImageFormat[ImageFormat["UNKNOWN"] = 10] = "UNKNOWN";
        return ImageFormat;
      }({}));
      wrapParseInt = parseInt;
      wrapParseFloat = parseFloat;
      /**
       * @en Particle System base class.
       * cocos2d also supports particles generated by Particle Designer (http://particledesigner.71squared.com/).
       * 'Radius Mode' in Particle Designer uses a fixed emit rate of 30 hz. Since that can't be guarateed in cocos2d,
       * cocos2d uses a another approach, but the results are almost identical.
       * cocos2d supports all the variables used by Particle Designer plus a bit more:
       *  - spinning particles (supported when using ParticleSystem)
       *  - tangential acceleration (Gravity mode)
       *  - radial acceleration (Gravity mode)
       *  - radius direction (Radius mode) (Particle Designer supports outwards to inwards direction only)
       * It is possible to customize any of the above mentioned properties in runtime. Example:
       * emitter.radialAccel = 15;
       * emitter.startSpin = 0;
       *
       * @zh 2D 粒子基础类型
       * cocos2d 同样支 Particle Designer (http://particledesigner.71squared.com/) 生成的粒子
       * 粒子设计器中的 半径模式 使用 30 hz 的固定发射率。由于 cocos2d 无法保证，
       * cocos2d 使用了另一种方法，但结果几乎相同。
       * cocos2d 支持 Particle Designer 使用的所有变量，还有：
       * -旋转粒子（使用粒子系统时支持）
       * -切向加速度（重力模式）
       * -径向加速度（重力模式）
       * -半径方向（半径模式）（Particle Designer 仅支持向外到向内的方向）
       * 可以在运行时自定义上述任何属性。例如：
       * emitter.radialAccel = 15;
       * emitter.startSpin = 0;
       *
       */
      _export("ParticleSystem2D", ParticleSystem2D = (_dec = ccclass('cc.ParticleSystem2D'), _dec2 = menu('Effects/ParticleSystem2D'), _dec3 = displayOrder(6), _dec4 = tooltip('i18n:particle_system.custom'), _dec5 = type(ParticleAsset), _dec6 = displayOrder(5), _dec7 = tooltip('i18n:particle_system.file'), _dec8 = type(SpriteFrame), _dec9 = tooltip('i18n:particle_system.spriteFrame'), _dec0 = tooltip('i18n:particle_system.totalParticles'), _dec1 = tooltip('i18n:particle_system.duration'), _dec10 = tooltip('i18n:particle_system.emissionRate'), _dec11 = tooltip('i18n:particle_system.life'), _dec12 = tooltip('i18n:particle_system.lifeVar'), _dec13 = tooltip('i18n:particle_system.startColor'), _dec14 = tooltip('i18n:particle_system.startColorVar'), _dec15 = visible(() => false), _dec16 = tooltip('i18n:particle_system.endColor'), _dec17 = tooltip('i18n:particle_system.endColorVar'), _dec18 = tooltip('i18n:particle_system.angle'), _dec19 = tooltip('i18n:particle_system.angleVar'), _dec20 = tooltip('i18n:particle_system.startSize'), _dec21 = tooltip('i18n:particle_system.startSizeVar'), _dec22 = tooltip('i18n:particle_system.endSize'), _dec23 = tooltip('i18n:particle_system.endSizeVar'), _dec24 = tooltip('i18n:particle_system.startSpin'), _dec25 = tooltip('i18n:particle_system.startSpinVar'), _dec26 = tooltip('i18n:particle_system.endSpin'), _dec27 = tooltip('i18n:particle_system.endSpinVar'), _dec28 = tooltip('i18n:particle_system.posVar'), _dec29 = type(PositionType), _dec30 = tooltip('i18n:particle_system.positionType'), _dec31 = displayOrder(2), _dec32 = tooltip('i18n:particle_system.preview'), _dec33 = type(EmitterMode), _dec34 = tooltip('i18n:particle_system.emitterMode'), _dec35 = tooltip('i18n:particle_system.gravity'), _dec36 = tooltip('i18n:particle_system.speed'), _dec37 = tooltip('i18n:particle_system.speedVar'), _dec38 = tooltip('i18n:particle_system.tangentialAccel'), _dec39 = tooltip('i18n:particle_system.tangentialAccelVar'), _dec40 = tooltip('i18n:particle_system.radialAccel'), _dec41 = tooltip('i18n:particle_system.radialAccelVar'), _dec42 = tooltip('i18n:particle_system.rotationIsDir'), _dec43 = tooltip('i18n:particle_system.startRadius'), _dec44 = tooltip('i18n:particle_system.startRadiusVar'), _dec45 = tooltip('i18n:particle_system.endRadius'), _dec46 = tooltip('i18n:particle_system.endRadiusVar'), _dec47 = tooltip('i18n:particle_system.rotatePerS'), _dec48 = tooltip('i18n:particle_system.rotatePerSVar'), _dec49 = displayOrder(3), _dec50 = tooltip('i18n:particle_system.playOnLoad'), _dec51 = displayOrder(4), _dec52 = tooltip('i18n:particle_system.autoRemoveOnFinish'), _dec53 = formerlySerializedAs('preview'), _dec(_class = _dec2(_class = playOnFocus(_class = executeInEditMode(_class = (_class2 = (_ParticleSystem2D = class ParticleSystem2D extends UIRenderer {
        /**
         * @en If set custom to true, then use custom properties instead of read particle file.
         * @zh 是否自定义粒子属性。
         */
        get custom() {
          return this._custom;
        }
        set custom(value) {
          if (EDITOR_NOT_IN_PREVIEW && !value && !this._file) {
            warnID(6000);
            return;
          }
          if (this._custom !== value) {
            this._custom = value;
            this._applyFile();
            this._updateMaterial();
          }
        }

        /**
         * @en The plist file.
         * @zh plist 格式的粒子配置文件。
         */
        get file() {
          return this._file;
        }
        set file(value) {
          if (this._file !== value) {
            this._file = value;
            if (value) {
              this._applyFile();
            } else {
              this.custom = true;
            }
          }
        }

        /**
         * @en SpriteFrame used for particles display
         * @zh 用于粒子呈现的 SpriteFrame
         */
        get spriteFrame() {
          return this._spriteFrame;
        }
        set spriteFrame(value) {
          const lastSprite = this._renderSpriteFrame;
          if (lastSprite === value) {
            return;
          }
          this._renderSpriteFrame = value;
          if (!value || value._uuid) {
            this._spriteFrame = value;
          }
          this._applySpriteFrame();
          if (EDITOR) {
            this.node.emit('spriteframe-changed', this);
          }
        }

        /**
         * @en Current quantity of particles that are being simulated.
         * @zh 当前播放的粒子数量。
         * @readonly
         */
        get particleCount() {
          return this._simulator.particles.length;
        }

        /**
         * @en Maximum particles of the system.
         * @zh 粒子最大数量。
         */
        get totalParticles() {
          return this._totalParticles;
        }
        set totalParticles(value) {
          if (this._totalParticles === value) return;
          this._totalParticles = value;
        }

        /**
         * @en How many seconds the emitter wil run. -1 means 'forever'.
         * @zh 发射器生存时间，单位秒，-1表示持续发射。
         */

        /**
         * @en Start color of each particle.
         * @zh 粒子初始颜色。
         */
        get startColor() {
          return this._startColor;
        }
        set startColor(val) {
          this._startColor.r = val.r;
          this._startColor.g = val.g;
          this._startColor.b = val.b;
          this._startColor.a = val.a;
        }

        /**
         * @en Variation of the start color.
         * @zh 粒子初始颜色变化范围。
         */
        get startColorVar() {
          return this._startColorVar;
        }
        set startColorVar(val) {
          this._startColorVar.r = val.r;
          this._startColorVar.g = val.g;
          this._startColorVar.b = val.b;
          this._startColorVar.a = val.a;
        }
        set color(value) {}
        get color() {
          return this._color;
        }

        /**
         * @en Ending color of each particle.
         * @zh 粒子结束颜色。
         */
        get endColor() {
          return this._endColor;
        }
        set endColor(val) {
          this._endColor.r = val.r;
          this._endColor.g = val.g;
          this._endColor.b = val.b;
          this._endColor.a = val.a;
        }

        /**
         * @en Variation of the end color.
         * @zh 粒子结束颜色变化范围。
         */
        get endColorVar() {
          return this._endColorVar;
        }
        set endColorVar(val) {
          this._endColorVar.r = val.r;
          this._endColorVar.g = val.g;
          this._endColorVar.b = val.b;
          this._endColorVar.a = val.a;
        }

        /**
         * @en Angle of each particle setter.
         * @zh 粒子角度。
         */

        /**
         * @en Particles movement type.
         * @zh 粒子位置类型。
         */
        get positionType() {
          return this._positionType;
        }
        set positionType(val) {
          this._positionType = val;
          this._updateMaterial();
          this._updatePositionType();
        }

        /**
         * @en Preview particle system effect.
         * @ch 查看粒子效果
         */
        get preview() {
          return this._preview;
        }
        set preview(val) {
          if (val) {
            this._startPreview();
          } else {
            this._stopPreview();
          }
          this._preview = val;
        }

        /**
         * @en Particles emitter modes.
         * @zh 发射器类型。
         */

        /**
         * @en Indicate whether the system simulation have stopped.
         * @zh 指示粒子播放是否完毕。
         */
        get stopped() {
          return this._stopped;
        }

        /**
         * @en Indicate whether the particle system is activated.
         * @zh 是否激活粒子。
         * @readonly
         */
        get active() {
          return this._simulator.active;
        }
        get assembler() {
          return this._assembler;
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "duration", _descriptor, this);
          /**
           * @en Emission rate of the particles.
           * @zh 每秒发射的粒子数目。
           */
          _initializerDefineProperty(this, "emissionRate", _descriptor2, this);
          /**
           * @en Life of each particle setter.
           * @zh 粒子的运行时间。
           */
          _initializerDefineProperty(this, "life", _descriptor3, this);
          /**
           * @en Variation of life.
           * @zh 粒子的运行时间变化范围。
           */
          _initializerDefineProperty(this, "lifeVar", _descriptor4, this);
          _initializerDefineProperty(this, "angle", _descriptor5, this);
          /**
           * @en Variation of angle of each particle setter.
           * @zh 粒子角度变化范围。
           */
          _initializerDefineProperty(this, "angleVar", _descriptor6, this);
          /**
           * @en Start size in pixels of each particle.
           * @zh 粒子的初始大小。
           */
          _initializerDefineProperty(this, "startSize", _descriptor7, this);
          /**
           * @en Variation of start size in pixels.
           * @zh 粒子初始大小的变化范围。
           */
          _initializerDefineProperty(this, "startSizeVar", _descriptor8, this);
          /**
           * @en End size in pixels of each particle.
           * @zh 粒子结束时的大小。
           */
          _initializerDefineProperty(this, "endSize", _descriptor9, this);
          /**
           * @en Variation of end size in pixels.
           * @zh 粒子结束大小的变化范围。
           */
          _initializerDefineProperty(this, "endSizeVar", _descriptor0, this);
          /**
           * @en Start angle of each particle.
           * @zh 粒子开始自旋角度。
           */
          _initializerDefineProperty(this, "startSpin", _descriptor1, this);
          /**
           * @en Variation of start angle.
           * @zh 粒子开始自旋角度变化范围。
           */
          _initializerDefineProperty(this, "startSpinVar", _descriptor10, this);
          /**
           * @en End angle of each particle.
           * @zh 粒子结束自旋角度。
           */
          _initializerDefineProperty(this, "endSpin", _descriptor11, this);
          /**
           * @en Variation of end angle.
           * @zh 粒子结束自旋角度变化范围。
           */
          _initializerDefineProperty(this, "endSpinVar", _descriptor12, this);
          /**
           * @en Source position of the emitter.
           * @zh 发射器位置。
           */
          _initializerDefineProperty(this, "sourcePos", _descriptor13, this);
          /**
           * @en Variation of source position.
           * @zh 发射器位置的变化范围。（横向和纵向）
           */
          _initializerDefineProperty(this, "posVar", _descriptor14, this);
          _initializerDefineProperty(this, "emitterMode", _descriptor15, this);
          // GRAVITY MODE
          /**
           * @en Gravity of the emitter.
           * @zh 重力。
           */
          _initializerDefineProperty(this, "gravity", _descriptor16, this);
          /**
           * @en Speed of the emitter.
           * @zh 速度。
           */
          _initializerDefineProperty(this, "speed", _descriptor17, this);
          /**
           * @en Variation of the speed.
           * @zh 速度变化范围。
           */
          _initializerDefineProperty(this, "speedVar", _descriptor18, this);
          /**
           * @en Tangential acceleration of each particle. Only available in 'Gravity' mode.
           * @zh 每个粒子的切向加速度，即垂直于重力方向的加速度，只有在重力模式下可用。
           */
          _initializerDefineProperty(this, "tangentialAccel", _descriptor19, this);
          /**
           * @en Variation of the tangential acceleration.
           * @zh 每个粒子的切向加速度变化范围。
           */
          _initializerDefineProperty(this, "tangentialAccelVar", _descriptor20, this);
          /**
           * @en Acceleration of each particle. Only available in 'Gravity' mode.
           * @zh 粒子径向加速度，即平行于重力方向的加速度，只有在重力模式下可用。
           */
          _initializerDefineProperty(this, "radialAccel", _descriptor21, this);
          /**
           * @en Variation of the radial acceleration.
           * @zh 粒子径向加速度变化范围。
           */
          _initializerDefineProperty(this, "radialAccelVar", _descriptor22, this);
          /**
           * @en Indicate whether the rotation of each particle equals to its direction. Only available in 'Gravity' mode.
           * @zh 每个粒子的旋转是否等于其方向，只有在重力模式下可用。
           */
          _initializerDefineProperty(this, "rotationIsDir", _descriptor23, this);
          // RADIUS MODE
          /**
           * @en Starting radius of the particles. Only available in 'Radius' mode.
           * @zh 初始半径，表示粒子出生时相对发射器的距离，只有在半径模式下可用。
           */
          _initializerDefineProperty(this, "startRadius", _descriptor24, this);
          /**
           * @en Variation of the starting radius.
           * @zh 初始半径变化范围。
           */
          _initializerDefineProperty(this, "startRadiusVar", _descriptor25, this);
          /**
           * @en Ending radius of the particles. Only available in 'Radius' mode.
           * @zh 结束半径，只有在半径模式下可用。
           */
          _initializerDefineProperty(this, "endRadius", _descriptor26, this);
          /**
           * @en Variation of the ending radius.
           * @zh 结束半径变化范围。
           */
          _initializerDefineProperty(this, "endRadiusVar", _descriptor27, this);
          /**
           * @en Number of degrees to rotate a particle around the source pos per second. Only available in 'Radius' mode.
           * @zh 粒子每秒围绕起始点的旋转角度，只有在半径模式下可用。
           */
          _initializerDefineProperty(this, "rotatePerS", _descriptor28, this);
          /**
           * @en Variation of the degrees to rotate a particle around the source pos per second.
           * @zh 粒子每秒围绕起始点的旋转角度变化范围。
           */
          _initializerDefineProperty(this, "rotatePerSVar", _descriptor29, this);
          this.aspectRatio = 1;
          /**
           * @en If set to true, the particle system will automatically start playing on onLoad.
           * @zh 如果设置为 true 运行时会自动发射粒子。
           */
          _initializerDefineProperty(this, "playOnLoad", _descriptor30, this);
          /**
           * @en Indicate whether the owner node will be auto-removed when it has no particles left.
           * @zh 粒子播放完毕后自动销毁所在的节点。
           */
          _initializerDefineProperty(this, "autoRemoveOnFinish", _descriptor31, this);
          /**
           * @en Play particle in edit mode.
           * @zh 在编辑器模式下预览粒子，启用后选中粒子时，粒子将自动播放。
           */
          _initializerDefineProperty(this, "_preview", _descriptor32, this);
          _initializerDefineProperty(this, "_custom", _descriptor33, this);
          _initializerDefineProperty(this, "_file", _descriptor34, this);
          _initializerDefineProperty(this, "_spriteFrame", _descriptor35, this);
          _initializerDefineProperty(this, "_totalParticles", _descriptor36, this);
          _initializerDefineProperty(this, "_startColor", _descriptor37, this);
          _initializerDefineProperty(this, "_startColorVar", _descriptor38, this);
          _initializerDefineProperty(this, "_endColor", _descriptor39, this);
          _initializerDefineProperty(this, "_endColorVar", _descriptor40, this);
          _initializerDefineProperty(this, "_positionType", _descriptor41, this);
          this._stopped = true;
          this._useFile = void 0;
          this.initProperties();
          this._useFile = false;
        }
        onEnable() {
          super.onEnable();
          this._updateMaterial();
          this._updatePositionType();
        }
        onDestroy() {
          super.onDestroy();
          if (this.autoRemoveOnFinish) {
            this.autoRemoveOnFinish = false; // already removed
          }

          // reset uv data so next time simulator will refill buffer uv info when exit edit mode from prefab.
          this._simulator.uvFilled = 0;
          this.destroyRenderData();
        }
        initProperties() {
          this._previewTimer = null;
          this._focused = false;
          this.aspectRatio = 1;
          this._simulator = new Simulator(this);
        }
        onFocusInEditor() {
          this._focused = true;
          const components = getParticleComponents(this.node);
          for (let i = 0; i < components.length; ++i) {
            components[i]._startPreview();
          }
        }
        onLostFocusInEditor() {
          this._focused = false;
          const components = getParticleComponents(this.node);
          for (let i = 0; i < components.length; ++i) {
            components[i]._stopPreview();
          }
        }
        _startPreview() {
          if (!this._preview) {
            this.resetSystem();
          }
        }
        _stopPreview() {
          if (this._preview) {
            this.resetSystem();
            this.stopSystem();
          }
          if (this._previewTimer) {
            clearInterval(this._previewTimer);
          }
        }
        __preload() {
          super.__preload();
          if (this._custom && this.spriteFrame && !this._renderSpriteFrame) {
            this._applySpriteFrame();
          } else if (this._file) {
            if (this._custom) {
              const missCustomTexture = !this._getTexture();
              if (missCustomTexture) {
                this._applyFile();
              }
            } else {
              this._applyFile();
            }
          }

          // auto play
          if (!EDITOR_NOT_IN_PREVIEW) {
            if (this.playOnLoad) {
              this.resetSystem();
            }
          }
        }
        destroyRenderData() {
          if (this._simulator.renderData) {
            const assembler = this._assembler;
            if (assembler && assembler.removeData) {
              assembler.removeData(this._simulator.renderData);
            }
            this._simulator.renderData = null;
          }
          super.destroyRenderData();
        }
        _flushAssembler() {
          const assembler = ParticleSystem2D.Assembler.getAssembler(this);
          if (this._assembler !== assembler) {
            this._assembler = assembler;
          }
          if (this._assembler && this._assembler.createData) {
            const simulator = this._simulator;
            let renderData = simulator.renderData;
            if (!renderData) {
              renderData = simulator.renderData = this._assembler.createData(this);
              simulator.uvFilled = 0;
              renderData.particleInitRenderDrawInfo(this.renderEntity); // Make sure renderEntity and renderData are both from simulator.
              simulator.initDrawInfo();
            }
          }
        }
        lateUpdate(dt) {
          if (!this._simulator.finished) {
            this._simulator.step(dt);
          }
        }

        // APIS

        /**
         * @en Add a particle to the emitter.
         * @zh 添加一个粒子到发射器中。
         * @return {Boolean}
         */
        addParticle() {
          // Not implemented
        }

        /**
         * @en Stop emitting particles. Running particles will continue to run until they die.
         * @zh 停止发射器发射粒子，发射出去的粒子将继续运行，直至粒子生命结束。
         * @example
         * // stop particle system.
         * myParticleSystem.stopSystem();
         */
        stopSystem() {
          this._stopped = true;
          this._simulator.stop();
        }

        /**
         * @en Kill all living particles.
         * @zh 杀死所有存在的粒子，然后重新启动粒子发射器。
         * @example
         * // play particle system.
         * myParticleSystem.resetSystem();
         */
        resetSystem() {
          this._stopped = false;
          this._simulator.reset();
          this._markForUpdateRenderData();
        }

        /**
         * @en Whether or not the system is full.
         * @zh 发射器中粒子是否大于等于设置的总粒子数量。
         * @return {Boolean}
         */
        isFull() {
          return this.particleCount >= this.totalParticles;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _applyFile() {
          const file = this._file;
          if (file) {
            if (!file) {
              errorID(6029);
              return;
            }
            if (!this.isValid) {
              return;
            }
            this._plistFile = file.nativeUrl;
            if (!this._custom) {
              const isDiffFrame = this._spriteFrame !== file.spriteFrame;
              if (isDiffFrame) this.spriteFrame = file.spriteFrame;
              this._initWithDictionary(file._nativeAsset);
            }
            if (!this._spriteFrame) {
              if (file.spriteFrame) {
                this.spriteFrame = file.spriteFrame;
              } else if (this._custom) {
                this._initTextureWithDictionary(file._nativeAsset);
              }
            } else if (!this._renderSpriteFrame && this._spriteFrame) {
              this._applySpriteFrame();
            }
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _initTextureWithDictionary(dict) {
          if (dict.spriteFrameUuid) {
            const spriteFrameUuid = dict.spriteFrameUuid;
            assetManager.loadAny(spriteFrameUuid, (err, spriteFrame) => {
              if (!this.isValid) return;
              if (err) {
                dict.spriteFrameUuid = undefined;
                this._initTextureWithDictionary(dict);
                error(err);
              } else {
                this.spriteFrame = spriteFrame;
              }
            });
          } else {
            // texture
            const imgPath = path.changeBasename(this._plistFile, dict.textureFileName || '');
            if (dict.textureFileName) {
              // Try to get the texture from the cache
              assetManager.loadRemote(imgPath, (err, imageAsset) => {
                if (!this.isValid) return;
                if (err) {
                  dict.textureFileName = undefined;
                  this._initTextureWithDictionary(dict);
                  error(err);
                } else {
                  // eslint-disable-next-line no-lonely-if
                  if (imageAsset) {
                    this.spriteFrame = SpriteFrame.createWithImage(imageAsset);
                  } else {
                    this.spriteFrame = SpriteFrame.createWithImage(builtinResMgr.get('white-texture'));
                  }
                }
              });
            } else if (dict.textureImageData) {
              const textureData = dict.textureImageData;
              if (textureData && textureData.length > 0) {
                let imgPathName = imgPath;
                if (this.file) {
                  imgPathName += `-${this.file.uuid}`;
                }
                let imageAsset = assetManager.assets.get(imgPathName);
                if (!imageAsset) {
                  const buffer = codec.unzipBase64AsArray(textureData, 1);
                  if (!buffer) {
                    warnID(6030, this._file.name);
                    return false;
                  }
                  const imageFormat = getImageFormatByData(buffer);
                  if (imageFormat !== ImageFormat.TIFF && imageFormat !== ImageFormat.PNG) {
                    warnID(6031, this._file.name);
                    return false;
                  }
                  const canvasObj = ccwindow.document.createElement('canvas');
                  if (imageFormat === ImageFormat.PNG) {
                    const myPngObj = new PNGReader(buffer);
                    myPngObj.render(canvasObj);
                  } else {
                    tiffReader.parseTIFF(buffer, canvasObj);
                    tiffReader.reset(); // Reset the tiff reader to avoid memory cached in it.
                  }
                  imageAsset = new ImageAsset(canvasObj);
                  assetManager.assets.add(imgPathName, imageAsset);
                }
                if (!imageAsset) {
                  warnID(6032, this._file.name);
                }
                // TODO: Use cc.assetManager to load asynchronously the SpriteFrame object, avoid using textureUtil
                if (imageAsset) {
                  this.spriteFrame = SpriteFrame.createWithImage(imageAsset);
                } else {
                  this.spriteFrame = SpriteFrame.createWithImage(builtinResMgr.get('white-texture'));
                }
              } else {
                return false;
              }
            }
          }
          return true;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _initWithDictionary(dict) {
          this._useFile = true;
          this.totalParticles = wrapParseInt(dict.maxParticles || 0);

          // life span
          this.life = wrapParseFloat(dict.particleLifespan || 0);
          this.lifeVar = wrapParseFloat(dict.particleLifespanVariance || 0);

          // emission Rate
          const _tempEmissionRate = dict.emissionRate;
          if (_tempEmissionRate) {
            this.emissionRate = _tempEmissionRate;
          } else {
            this.emissionRate = Math.min(this.totalParticles / this.life, Number.MAX_VALUE);
          }

          // duration
          this.duration = wrapParseFloat(dict.duration || 0);

          // blend function // remove when component remove blend function
          this._srcBlendFactor = wrapParseInt(dict.blendFuncSource || BlendFactor.SRC_ALPHA);
          this._dstBlendFactor = wrapParseInt(dict.blendFuncDestination || BlendFactor.ONE_MINUS_SRC_ALPHA);

          // color
          const locStartColor = this._startColor;
          locStartColor.r = wrapParseFloat(dict.startColorRed || 0) * 255;
          locStartColor.g = wrapParseFloat(dict.startColorGreen || 0) * 255;
          locStartColor.b = wrapParseFloat(dict.startColorBlue || 0) * 255;
          locStartColor.a = wrapParseFloat(dict.startColorAlpha || 0) * 255;
          const locStartColorVar = this._startColorVar;
          locStartColorVar.r = wrapParseFloat(dict.startColorVarianceRed || 0) * 255;
          locStartColorVar.g = wrapParseFloat(dict.startColorVarianceGreen || 0) * 255;
          locStartColorVar.b = wrapParseFloat(dict.startColorVarianceBlue || 0) * 255;
          locStartColorVar.a = wrapParseFloat(dict.startColorVarianceAlpha || 0) * 255;
          const locEndColor = this._endColor;
          locEndColor.r = wrapParseFloat(dict.finishColorRed || 0) * 255;
          locEndColor.g = wrapParseFloat(dict.finishColorGreen || 0) * 255;
          locEndColor.b = wrapParseFloat(dict.finishColorBlue || 0) * 255;
          locEndColor.a = wrapParseFloat(dict.finishColorAlpha || 0) * 255;
          const locEndColorVar = this._endColorVar;
          locEndColorVar.r = wrapParseFloat(dict.finishColorVarianceRed || 0) * 255;
          locEndColorVar.g = wrapParseFloat(dict.finishColorVarianceGreen || 0) * 255;
          locEndColorVar.b = wrapParseFloat(dict.finishColorVarianceBlue || 0) * 255;
          locEndColorVar.a = wrapParseFloat(dict.finishColorVarianceAlpha || 0) * 255;

          // particle size
          this.startSize = wrapParseFloat(dict.startParticleSize || 0);
          this.startSizeVar = wrapParseFloat(dict.startParticleSizeVariance || 0);
          this.endSize = wrapParseFloat(dict.finishParticleSize || 0);
          this.endSizeVar = wrapParseFloat(dict.finishParticleSizeVariance || 0);

          // position
          // Make empty positionType value and old version compatible
          this.positionType = wrapParseFloat(dict.positionType !== undefined ? dict.positionType : PositionType.FREE);
          // for
          this.sourcePos.set(0, 0);
          this.posVar.set(wrapParseFloat(dict.sourcePositionVariancex || 0), wrapParseFloat(dict.sourcePositionVariancey || 0));
          // angle
          this.angle = wrapParseFloat(dict.angle || 0);
          this.angleVar = wrapParseFloat(dict.angleVariance || 0);

          // Spinning
          this.startSpin = wrapParseFloat(dict.rotationStart || 0);
          this.startSpinVar = wrapParseFloat(dict.rotationStartVariance || 0);
          this.endSpin = wrapParseFloat(dict.rotationEnd || 0);
          this.endSpinVar = wrapParseFloat(dict.rotationEndVariance || 0);
          this.emitterMode = wrapParseInt(dict.emitterType || EmitterMode.GRAVITY);

          // Mode A: Gravity + tangential accel + radial accel
          if (this.emitterMode === EmitterMode.GRAVITY) {
            // gravity
            this.gravity.set(wrapParseFloat(dict.gravityx || 0), wrapParseFloat(dict.gravityy || 0));
            // speed
            this.speed = wrapParseFloat(dict.speed || 0);
            this.speedVar = wrapParseFloat(dict.speedVariance || 0);

            // radial acceleration
            this.radialAccel = wrapParseFloat(dict.radialAcceleration || 0);
            this.radialAccelVar = wrapParseFloat(dict.radialAccelVariance || 0);

            // tangential acceleration
            this.tangentialAccel = wrapParseFloat(dict.tangentialAcceleration || 0);
            this.tangentialAccelVar = wrapParseFloat(dict.tangentialAccelVariance || 0);

            // rotation is dir
            let locRotationIsDir = dict.rotationIsDir || '';
            if (locRotationIsDir !== null) {
              locRotationIsDir = locRotationIsDir.toString().toLowerCase();
              this.rotationIsDir = locRotationIsDir === 'true' || locRotationIsDir === '1';
            } else {
              this.rotationIsDir = false;
            }
          } else if (this.emitterMode === EmitterMode.RADIUS) {
            // or Mode B: radius movement
            this.startRadius = wrapParseFloat(dict.maxRadius || 0);
            this.startRadiusVar = wrapParseFloat(dict.maxRadiusVariance || 0);
            this.endRadius = wrapParseFloat(dict.minRadius || 0);
            this.endRadiusVar = wrapParseFloat(dict.minRadiusVariance || 0);
            this.rotatePerS = wrapParseFloat(dict.rotatePerSecond || 0);
            this.rotatePerSVar = wrapParseFloat(dict.rotatePerSecondVariance || 0);
          } else {
            warnID(6009);
            return false;
          }
          this._initTextureWithDictionary(dict);
          return true;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _syncAspect() {
          if (this._renderSpriteFrame) {
            const frameRect = this._renderSpriteFrame.rect;
            this.aspectRatio = frameRect.width / frameRect.height;
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _applySpriteFrame() {
          this._renderSpriteFrame = this._renderSpriteFrame || this._spriteFrame;
          if (this._renderSpriteFrame) {
            if (this._renderSpriteFrame.texture) {
              if (this._simulator) {
                this._simulator.updateUVs(true);
              }
              this._syncAspect();
              this._updateMaterial();
              this._stopped = false;
              this._markForUpdateRenderData();
            }
          } else {
            this.resetSystem();
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _getTexture() {
          return this._renderSpriteFrame && this._renderSpriteFrame.texture;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateMaterial() {
          if (this._customMaterial) {
            this.setSharedMaterial(this._customMaterial, 0);
            const target = this.getRenderMaterial(0).passes[0].blendState.targets[0];
            this._dstBlendFactor = target.blendDst;
            this._srcBlendFactor = target.blendSrc;
          }
          const mat = this.getMaterialInstance(0);
          if (mat) mat.recompileShaders({
            USE_LOCAL: this._positionType !== PositionType.FREE
          });
          if (mat && mat.passes.length > 0) {
            this._updateBlendFunc();
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _finishedSimulation() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (this._preview && this._focused && !this.active /* && !cc.engine.isPlaying */) {
              this.resetSystem();
            }
            return;
          }
          this.resetSystem();
          this.stopSystem();
          this._markForUpdateRenderData();
          if (this.autoRemoveOnFinish && this._stopped) {
            this.node.destroy();
          }
        }
        _canRender() {
          return super._canRender() && !this._stopped && this._renderSpriteFrame !== null && this._renderSpriteFrame !== undefined;
        }
        _render(render) {
          if (this._positionType === PositionType.RELATIVE) {
            render.commitComp(this, this._simulator.renderData, this._renderSpriteFrame, this._assembler, this.node.parent);
          } else if (this.positionType === PositionType.GROUPED) {
            render.commitComp(this, this._simulator.renderData, this._renderSpriteFrame, this._assembler, this.node);
          } else {
            render.commitComp(this, this._simulator.renderData, this._renderSpriteFrame, this._assembler, null);
          }
        }
        _updatePositionType() {
          if (this._positionType === PositionType.RELATIVE) {
            this._renderEntity.setRenderTransform(this.node.parent);
            this._renderEntity.setUseLocal(true);
          } else if (this.positionType === PositionType.GROUPED) {
            this._renderEntity.setRenderTransform(this.node);
            this._renderEntity.setUseLocal(true);
          } else {
            this._renderEntity.setRenderTransform(null);
            this._renderEntity.setUseLocal(false);
          }
        }
      }, _ParticleSystem2D.EmitterMode = EmitterMode, _ParticleSystem2D.PositionType = PositionType, _ParticleSystem2D.DURATION_INFINITY = DURATION_INFINITY, _ParticleSystem2D.START_SIZE_EQUAL_TO_END_SIZE = START_SIZE_EQUAL_TO_END_SIZE, _ParticleSystem2D.START_RADIUS_EQUAL_TO_END_RADIUS = START_RADIUS_EQUAL_TO_END_RADIUS, _ParticleSystem2D), _applyDecoratedDescriptor(_class2.prototype, "custom", [editable, _dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "custom"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "file", [_dec5, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "file"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spriteFrame", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "spriteFrame"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "totalParticles", [editable, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "totalParticles"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "duration", [serializable, editable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "emissionRate", [serializable, editable, _dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "life", [serializable, editable, _dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "lifeVar", [serializable, editable, _dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "startColor", [editable, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "startColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "startColorVar", [editable, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "startColorVar"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "color", [override, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "endColor", [editable, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "endColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "endColorVar", [editable, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "endColorVar"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "angle", [serializable, editable, _dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 90;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "angleVar", [serializable, editable, _dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 20;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "startSize", [serializable, editable, _dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 50;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "startSizeVar", [serializable, editable, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "endSize", [serializable, editable, _dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "endSizeVar", [serializable, editable, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "startSpin", [serializable, editable, _dec24], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "startSpinVar", [serializable, editable, _dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "endSpin", [serializable, editable, _dec26], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "endSpinVar", [serializable, editable, _dec27], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "sourcePos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Vec2.ZERO.clone();
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "posVar", [serializable, editable, _dec28], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Vec2.ZERO.clone();
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "positionType", [_dec29, _dec30], Object.getOwnPropertyDescriptor(_class2.prototype, "positionType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "preview", [editable, _dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "preview"), _class2.prototype), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "emitterMode", [serializable, editable, _dec33, _dec34], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EmitterMode.GRAVITY;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "gravity", [serializable, editable, _dec35], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Vec2.ZERO.clone();
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "speed", [serializable, editable, _dec36], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 180;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "speedVar", [serializable, editable, _dec37], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 50;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "tangentialAccel", [serializable, editable, _dec38], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 80;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "tangentialAccelVar", [serializable, editable, _dec39], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "radialAccel", [serializable, editable, _dec40], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "radialAccelVar", [serializable, editable, _dec41], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "rotationIsDir", [serializable, editable, _dec42], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "startRadius", [serializable, editable, _dec43], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "startRadiusVar", [serializable, editable, _dec44], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "endRadius", [serializable, editable, _dec45], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "endRadiusVar", [serializable, editable, _dec46], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "rotatePerS", [serializable, editable, _dec47], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "rotatePerSVar", [serializable, editable, _dec48], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "playOnLoad", [serializable, editable, _dec49, _dec50], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "autoRemoveOnFinish", [serializable, editable, _dec51, _dec52], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "_preview", [_dec53], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "_custom", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "_file", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "_spriteFrame", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "_totalParticles", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 150;
        }
      }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "_startColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(255, 255, 255, 255);
        }
      }), _descriptor38 = _applyDecoratedDescriptor(_class2.prototype, "_startColorVar", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 0);
        }
      }), _descriptor39 = _applyDecoratedDescriptor(_class2.prototype, "_endColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(255, 255, 255, 0);
        }
      }), _descriptor40 = _applyDecoratedDescriptor(_class2.prototype, "_endColorVar", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 0);
        }
      }), _descriptor41 = _applyDecoratedDescriptor(_class2.prototype, "_positionType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PositionType.FREE;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});