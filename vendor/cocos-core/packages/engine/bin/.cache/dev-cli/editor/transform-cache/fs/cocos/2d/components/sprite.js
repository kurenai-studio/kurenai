System.register("q-bundled:///fs/cocos/2d/components/sprite.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../assets/sprite-atlas.js", "../assets/sprite-frame.js", "../../asset/asset-manager/builtin-res-mgr.js", "../../core/index.js", "../framework/ui-renderer.js", "../../asset/assets/asset-enum.js", "../../asset/assets/texture-base.js", "../../asset/assets/index.js", "../../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, displayOrder, type, range, editable, serializable, visible, BUILD, JSB, EDITOR, SpriteAtlas, SpriteFrame, SpriteFrameEvent, builtinResMgr, Vec2, cclegacy, ccenum, clamp, warnID, UIRenderer, InstanceMaterialType, PixelFormat, TextureBase, Material, RenderTexture, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _Sprite, SpriteType, FillType, SizeMode, SpriteEventType, Sprite;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      range = _coreDataDecoratorsIndexJs.range;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      JSB = _virtualInternal253AconstantsJs.JSB;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetsSpriteAtlasJs) {
      SpriteAtlas = _assetsSpriteAtlasJs.SpriteAtlas;
    }, function (_assetsSpriteFrameJs) {
      SpriteFrame = _assetsSpriteFrameJs.SpriteFrame;
      SpriteFrameEvent = _assetsSpriteFrameJs.SpriteFrameEvent;
    }, function (_assetAssetManagerBuiltinResMgrJs) {
      builtinResMgr = _assetAssetManagerBuiltinResMgrJs.builtinResMgr;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      cclegacy = _coreIndexJs.cclegacy;
      ccenum = _coreIndexJs.ccenum;
      clamp = _coreIndexJs.clamp;
      warnID = _coreIndexJs.warnID;
    }, function (_frameworkUiRendererJs) {
      UIRenderer = _frameworkUiRendererJs.UIRenderer;
      InstanceMaterialType = _frameworkUiRendererJs.InstanceMaterialType;
    }, function (_assetAssetsAssetEnumJs) {
      PixelFormat = _assetAssetsAssetEnumJs.PixelFormat;
    }, function (_assetAssetsTextureBaseJs) {
      TextureBase = _assetAssetsTextureBaseJs.TextureBase;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
      RenderTexture = _assetAssetsIndexJs.RenderTexture;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
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
       * Enum for sprite type.
       *
       * @zh
       * Sprite 类型。
       */
      _export("SpriteType", SpriteType = /*#__PURE__*/function (SpriteType) {
        /**
         * @en
         * The simple type.
         *
         * @zh
         * 普通类型。
         */
        SpriteType[SpriteType["SIMPLE"] = 0] = "SIMPLE";
        /**
         * @en
         * The sliced type.
         *
         * @zh
         * 切片（九宫格）类型。
         */
        SpriteType[SpriteType["SLICED"] = 1] = "SLICED";
        /**
         * @en
         * The tiled type.
         *
         * @zh  平铺类型
         */
        SpriteType[SpriteType["TILED"] = 2] = "TILED";
        /**
         * @en
         * The filled type.
         *
         * @zh
         * 填充类型。
         */
        SpriteType[SpriteType["FILLED"] = 3] = "FILLED"; // /**
        //  * @en The mesh type.
        //  * @zh  以 Mesh 三角形组成的类型
        //  */
        // MESH: 4
        return SpriteType;
      }({}));
      ccenum(SpriteType);

      /**
       * @en
       * Enum for fill type.
       *
       * @zh
       * 填充类型。
       */
      FillType = /*#__PURE__*/function (FillType) {
        /**
         * @en
         * The horizontal fill.
         *
         * @zh
         * 水平方向填充。
         */
        FillType[FillType["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en
         * The vertical fill.
         *
         * @zh
         * 垂直方向填充。
         */
        FillType[FillType["VERTICAL"] = 1] = "VERTICAL";
        /**
         * @en
         * The radial fill.
         *
         * @zh  径向填充
         */
        FillType[FillType["RADIAL"] = 2] = "RADIAL";
        return FillType;
      }(FillType || {});
      ccenum(FillType);

      /**
       * @en
       * Sprite Size can track trimmed size, raw size or none.
       *
       * @zh
       * 精灵尺寸调整模式。
       */
      SizeMode = /*#__PURE__*/function (SizeMode) {
        /**
         * @en
         * Use the customized node size.
         *
         * @zh
         * 使用节点预设的尺寸。
         */
        SizeMode[SizeMode["CUSTOM"] = 0] = "CUSTOM";
        /**
         * @en
         * Match the trimmed size of the sprite frame automatically.
         *
         * @zh
         * 自动适配为精灵裁剪后的尺寸。
         */
        SizeMode[SizeMode["TRIMMED"] = 1] = "TRIMMED";
        /**
         * @en
         * Match the raw size of the sprite frame automatically.
         *
         * @zh
         * 自动适配为精灵原图尺寸。
         */
        SizeMode[SizeMode["RAW"] = 2] = "RAW";
        return SizeMode;
      }(SizeMode || {});
      ccenum(SizeMode);
      _export("SpriteEventType", SpriteEventType = /*#__PURE__*/function (SpriteEventType) {
        SpriteEventType["SPRITE_FRAME_CHANGED"] = "spriteframe-changed";
        return SpriteEventType;
      }({}));
      /**
       * @en
       * Renders a sprite in the scene.
       *
       * @zh
       * 渲染精灵组件。
       */
      _export("Sprite", Sprite = (_dec = ccclass('cc.Sprite'), _dec2 = help('i18n:cc.Sprite'), _dec3 = executionOrder(110), _dec4 = menu('2D/Sprite'), _dec5 = type(SpriteAtlas), _dec6 = displayOrder(4), _dec7 = type(SpriteFrame), _dec8 = displayOrder(5), _dec9 = type(SpriteType), _dec0 = displayOrder(6), _dec1 = type(FillType), _dec10 = displayOrder(6), _dec11 = tooltip('i18n:sprite.fill_type'), _dec12 = displayOrder(6), _dec13 = tooltip('i18n:sprite.fill_center'), _dec14 = range([0, 1, 0.1]), _dec15 = displayOrder(6), _dec16 = tooltip('i18n:sprite.fill_start'), _dec17 = range([-1, 1, 0.1]), _dec18 = displayOrder(6), _dec19 = tooltip('i18n:sprite.fill_range'), _dec20 = visible(function () {
        return this._type === SpriteType.SIMPLE;
      }), _dec21 = displayOrder(8), _dec22 = displayOrder(5), _dec23 = type(SizeMode), _dec24 = displayOrder(5), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = (_Sprite = class Sprite extends UIRenderer {
        constructor() {
          super();
          _initializerDefineProperty(this, "_spriteFrame", _descriptor, this);
          _initializerDefineProperty(this, "_type", _descriptor2, this);
          _initializerDefineProperty(this, "_fillType", _descriptor3, this);
          _initializerDefineProperty(this, "_sizeMode", _descriptor4, this);
          _initializerDefineProperty(this, "_fillCenter", _descriptor5, this);
          _initializerDefineProperty(this, "_fillStart", _descriptor6, this);
          _initializerDefineProperty(this, "_fillRange", _descriptor7, this);
          _initializerDefineProperty(this, "_isTrimmedMode", _descriptor8, this);
          _initializerDefineProperty(this, "_useGrayscale", _descriptor9, this);
          _initializerDefineProperty(this, "_atlas", _descriptor0, this);
        }

        /**
         * @en
         * The sprite atlas where the sprite is.
         *
         * @zh
         * 精灵的图集。
         */
        get spriteAtlas() {
          return this._atlas;
        }
        set spriteAtlas(value) {
          if (this._atlas === value) {
            return;
          }
          this._atlas = value;
        }

        /**
         * @en
         * The sprite frame of the sprite.
         *
         * @zh
         * 精灵的精灵帧。
         */
        get spriteFrame() {
          return this._spriteFrame;
        }
        set spriteFrame(value) {
          if (this._spriteFrame === value) {
            return;
          }
          const lastSprite = this._spriteFrame;
          this._spriteFrame = value;
          this._markForUpdateRenderData();
          this._applySpriteFrame(lastSprite);
          if (EDITOR) {
            this.node.emit(SpriteEventType.SPRITE_FRAME_CHANGED, this);
          }
        }

        /**
         * @en
         * The sprite render type.
         *
         * @zh
         * 精灵渲染类型。
         *
         * @example
         * ```ts
         * import { Sprite } from 'cc';
         * sprite.type = Sprite.Type.SIMPLE;
         * ```
         */
        get type() {
          return this._type;
        }
        set type(value) {
          if (this._type !== value) {
            this._type = value;
            this._flushAssembler();
          }
        }

        /**
         * @en
         * The fill type, This will only have any effect if the "type" is set to “Sprite.Type.FILLED”.
         *
         * @zh
         * 精灵填充类型，仅渲染类型设置为 Sprite.Type.FILLED 时有效。
         *
         * @example
         * ```ts
         * import { Sprite } from 'cc';
         * sprite.fillType = Sprite.FillType.HORIZONTAL;
         * ```
         */
        get fillType() {
          return this._fillType;
        }
        set fillType(value) {
          if (this._fillType !== value) {
            if (value === FillType.RADIAL || this._fillType === FillType.RADIAL) {
              this.destroyRenderData();
            } else if (this.renderData) {
              this._markForUpdateRenderData(true);
            }
          }
          this._fillType = value;
          this._flushAssembler();
        }

        /**
         * @en
         * The fill Center, This will only have any effect if the "type" is set to “Sprite.Type.FILLED”.
         *
         * @zh
         * 填充中心点，仅渲染类型设置为 Sprite.Type.FILLED 时有效。
         *
         * @example
         * ```ts
         * import { Vec2 } from 'cc';
         * sprite.fillCenter = new Vec2(0, 0);
         * ```
         */
        get fillCenter() {
          return this._fillCenter;
        }
        set fillCenter(value) {
          this._fillCenter.x = value.x;
          this._fillCenter.y = value.y;
          if (this._type === SpriteType.FILLED && this.renderData) {
            this._markForUpdateRenderData();
          }
        }

        /**
         * @en
         * The fill Start, This will only have any effect if the "type" is set to “Sprite.Type.FILLED”.
         *
         * @zh
         * 填充起始点，仅渲染类型设置为 Sprite.Type.FILLED 时有效。
         *
         * @example
         * ```ts
         * // -1 To 1 between the numbers
         * sprite.fillStart = 0.5;
         * ```
         */
        get fillStart() {
          return this._fillStart;
        }
        set fillStart(value) {
          this._fillStart = clamp(value, 0, 1);
          if (this._type === SpriteType.FILLED && this.renderData) {
            this._markForUpdateRenderData();
            this._updateUVs();
          }
        }

        /**
         * @en
         * The fill Range, This will only have any effect if the "type" is set to “Sprite.Type.FILLED”.
         *
         * @zh
         * 填充范围，仅渲染类型设置为 Sprite.Type.FILLED 时有效。
         *
         * @example
         * ```ts
         * // -1 To 1 between the numbers
         * sprite.fillRange = 1;
         * ```
         */
        get fillRange() {
          return this._fillRange;
        }
        set fillRange(value) {
          // positive: counterclockwise, negative: clockwise
          this._fillRange = clamp(value, -1, 1);
          if (this._type === SpriteType.FILLED && this.renderData) {
            this._markForUpdateRenderData();
            this._updateUVs();
          }
        }
        /**
         * @en
         * specify the frame is trimmed or not.
         *
         * @zh
         * 是否使用裁剪模式。
         *
         * @example
         * ```ts
         * sprite.trim = true;
         * ```
         */
        get trim() {
          return this._isTrimmedMode;
        }
        set trim(value) {
          if (this._isTrimmedMode === value) {
            return;
          }
          this._isTrimmedMode = value;
          if (this._type === SpriteType.SIMPLE /* || this._type === SpriteType.MESH */ && this.renderData) {
            this._markForUpdateRenderData(true);
          }
        }

        /**
         * @en Grayscale mode.
         * @zh 是否以灰度模式渲染。
         */
        get grayscale() {
          return this._useGrayscale;
        }
        set grayscale(value) {
          if (this._useGrayscale === value) {
            return;
          }
          this._useGrayscale = value;
          this.changeMaterialForDefine();
          this.updateMaterial();
        }

        /**
         * @en
         * Specify the size tracing mode.
         *
         * @zh
         * 精灵尺寸调整模式。
         *
         * @example
         * ```ts
         * import { Sprite } from 'cc';
         * sprite.sizeMode = Sprite.SizeMode.CUSTOM;
         * ```
         */
        get sizeMode() {
          return this._sizeMode;
        }
        set sizeMode(value) {
          if (this._sizeMode === value) {
            return;
          }
          this._sizeMode = value;
          if (value !== SizeMode.CUSTOM) {
            this._applySpriteSize();
          }
        }

        /**
         * @en Enum for fill type.
         * @zh 填充类型。
         */

        __preload() {
          this.changeMaterialForDefine();
          super.__preload();
          if (EDITOR) {
            this._resized();
            this.node.on(NodeEventType.SIZE_CHANGED, this._resized, this);
          }
        }
        onEnable() {
          super.onEnable();

          // Force update uv, material define, active material, etc
          this._activateMaterial();
          const spriteFrame = this._spriteFrame;
          if (spriteFrame) {
            this._updateUVs();
            if (this._type === SpriteType.SLICED) {
              spriteFrame.on(SpriteFrameEvent.UV_UPDATED, this._updateUVs, this);
            }
          }
        }
        onDisable() {
          super.onDisable();
          if (this._spriteFrame && this._type === SpriteType.SLICED) {
            this._spriteFrame.off(SpriteFrameEvent.UV_UPDATED, this._updateUVs, this);
          }
        }
        onDestroy() {
          if (EDITOR) {
            this.node.off(NodeEventType.SIZE_CHANGED, this._resized, this);
          }
          super.onDestroy();
        }

        /**
         * @en
         * Quickly switch to other sprite frame in the sprite atlas.
         * If there is no atlas, the switch fails.
         *
         * @zh
         * 选取使用精灵图集中的其他精灵。
         * @param name @en Name of the spriteFrame to switch. @zh 要切换的 spriteFrame 名字。
         */
        changeSpriteFrameFromAtlas(name) {
          if (!this._atlas) {
            warnID(16377);
            return;
          }
          const sprite = this._atlas.getSpriteFrame(name);
          this.spriteFrame = sprite;
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        changeMaterialForDefine() {
          let texture;
          const lastInstanceMaterialType = this._instanceMaterialType;
          if (this._spriteFrame) {
            texture = this._spriteFrame.texture;
          }
          let value = false;
          if (texture instanceof TextureBase) {
            const format = texture.getPixelFormat();
            value = format === PixelFormat.RGBA_ETC1 || format === PixelFormat.RGB_A_PVRTC_4BPPV1 || format === PixelFormat.RGB_A_PVRTC_2BPPV1;
          }
          if (value && this.grayscale) {
            this._instanceMaterialType = InstanceMaterialType.USE_ALPHA_SEPARATED_AND_GRAY;
          } else if (value) {
            this._instanceMaterialType = InstanceMaterialType.USE_ALPHA_SEPARATED;
          } else if (this.grayscale) {
            this._instanceMaterialType = InstanceMaterialType.GRAYSCALE;
          } else {
            this._instanceMaterialType = InstanceMaterialType.ADD_COLOR_AND_TEXTURE;
          }
          if (lastInstanceMaterialType !== this._instanceMaterialType) {
            this.updateMaterial();
          }
        }
        _updateBuiltinMaterial() {
          let mat = super._updateBuiltinMaterial();
          if (this.spriteFrame && this.spriteFrame.texture instanceof RenderTexture) {
            const rtMatName = `rt-${mat.name}`;
            let rtMat = builtinResMgr.get(rtMatName);
            if (!rtMat || !rtMat.passes.length) {
              rtMat = new Material(rtMatName);
              rtMat.copy(mat, {
                defines: {
                  SAMPLE_FROM_RT: true
                }
              });
              builtinResMgr.addAsset(rtMatName, rtMat);
            }
            mat = rtMat;
          }
          return mat;
        }
        _render(render) {
          render.commitComp(this, this.renderData, this._spriteFrame, this._assembler, null);
        }
        _canRender() {
          if (!super._canRender()) {
            return false;
          }
          const spriteFrame = this._spriteFrame;
          if (!spriteFrame || !spriteFrame.texture) {
            return false;
          }
          return true;
        }
        _flushAssembler() {
          const self = this;
          const assembler = Sprite.Assembler.getAssembler(self);
          if (self._assembler !== assembler) {
            self.destroyRenderData();
            self._assembler = assembler;
          }
          if (!self._renderData) {
            if (assembler && assembler.createData) {
              const rd = self._renderData = assembler.createData(self);
              rd.material = self.getRenderMaterial(0);
              self._markForUpdateRenderData();
              if (self.spriteFrame) {
                assembler.updateUVs(self);
              }
              self._updateColor();
            }
          }

          // Only Sliced type need update uv when sprite frame insets changed
          const spriteFrame = self._spriteFrame;
          if (spriteFrame) {
            if (self._type === SpriteType.SLICED) {
              spriteFrame.on(SpriteFrameEvent.UV_UPDATED, self._updateUVs, self);
            } else {
              spriteFrame.off(SpriteFrameEvent.UV_UPDATED, self._updateUVs, self);
            }
          }
        }
        _applySpriteSize() {
          const self = this;
          const spriteFrame = self._spriteFrame;
          if (spriteFrame) {
            if (BUILD || !spriteFrame.isDefault) {
              const uiProps = self.node._uiProps;
              if (SizeMode.RAW === self._sizeMode) {
                const size = spriteFrame.originalSize;
                uiProps.uiTransformComp.setContentSize(size);
              } else if (SizeMode.TRIMMED === self._sizeMode) {
                const rect = spriteFrame.rect;
                uiProps.uiTransformComp.setContentSize(rect.width, rect.height);
              }
            }
          }
        }
        _resized() {
          if (!EDITOR) {
            return;
          }
          if (this._spriteFrame) {
            const actualSize = this.node._getUITransformComp().contentSize;
            let expectedW = actualSize.width;
            let expectedH = actualSize.height;
            if (this._sizeMode === SizeMode.RAW) {
              const size = this._spriteFrame.originalSize;
              expectedW = size.width;
              expectedH = size.height;
            } else if (this._sizeMode === SizeMode.TRIMMED) {
              const rect = this._spriteFrame.rect;
              expectedW = rect.width;
              expectedH = rect.height;
            }
            if (expectedW !== actualSize.width || expectedH !== actualSize.height) {
              this._sizeMode = SizeMode.CUSTOM;
            }
          }
        }
        _activateMaterial() {
          const spriteFrame = this._spriteFrame;
          const material = this.getRenderMaterial(0);
          if (spriteFrame) {
            if (material) {
              this._markForUpdateRenderData();
            }
          }
          if (this.renderData) {
            this.renderData.material = material;
          }
        }
        _updateUVs() {
          if (this._assembler) {
            this._assembler.updateUVs(this);
          }
        }
        _applySpriteFrame(oldFrame) {
          const self = this;
          const spriteFrame = self._spriteFrame;
          if (oldFrame && self._type === SpriteType.SLICED) {
            oldFrame.off(SpriteFrameEvent.UV_UPDATED, self._updateUVs, self);
          }
          let textureChanged = false;
          if (spriteFrame) {
            if (!oldFrame || oldFrame.texture !== spriteFrame.texture) {
              textureChanged = true;
            }
            if (textureChanged) {
              if (self.renderData) self.renderData.textureDirty = true;
              if (JSB) this._colorDirty();
              // texture type changed, set this._instanceMaterialType to default value
              const oldIsRT = oldFrame ? oldFrame.texture instanceof RenderTexture : false;
              const newIsRT = spriteFrame.texture instanceof RenderTexture;
              if (oldIsRT !== newIsRT) {
                self._instanceMaterialType = -1;
              }
              self.changeMaterialForDefine();
            }
            self._applySpriteSize();
            if (self._type === SpriteType.SLICED) {
              spriteFrame.on(SpriteFrameEvent.UV_UPDATED, self._updateUVs, self);
            }
          }
        }
      }, _Sprite.FillType = FillType, _Sprite.Type = SpriteType, _Sprite.SizeMode = SizeMode, _Sprite.EventType = SpriteEventType, _Sprite), _applyDecoratedDescriptor(_class2.prototype, "spriteAtlas", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "spriteAtlas"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spriteFrame", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "spriteFrame"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "type", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "type"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fillType", [_dec1, _dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "fillType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fillCenter", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "fillCenter"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fillStart", [_dec14, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "fillStart"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fillRange", [_dec17, _dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "fillRange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "trim", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "trim"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "grayscale", [editable, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "grayscale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sizeMode", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "sizeMode"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_spriteFrame", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_type", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SpriteType.SIMPLE;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_fillType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return FillType.HORIZONTAL;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_sizeMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SizeMode.TRIMMED;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_fillCenter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(0, 0);
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_fillStart", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_fillRange", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_isTrimmedMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_useGrayscale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_atlas", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      cclegacy.Sprite = Sprite;
    }
  };
});