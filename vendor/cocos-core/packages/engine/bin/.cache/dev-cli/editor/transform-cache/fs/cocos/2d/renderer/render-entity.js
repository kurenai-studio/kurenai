System.register("q-bundled:///fs/cocos/2d/renderer/render-entity.js", ["../../../../virtual/internal%253Aconstants.js", "./native-2d.js", "./render-draw-info.js", "../../core/index.js", "./stencil-manager.js"], function (_export, _context) {
  "use strict";

  var JSB, NativeRenderEntity, RenderDrawInfo, Color, Stage, RenderEntity, RenderEntityFillColorType, RenderEntityType, RenderEntityUInt32SharedBufferView, RenderEntityUInt8SharedBufferView, RenderEntityBoolSharedBufferViewBitIndex, MaskMode;
  _export("RenderEntity", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_native2dJs) {
      NativeRenderEntity = _native2dJs.NativeRenderEntity;
    }, function (_renderDrawInfoJs) {
      RenderDrawInfo = _renderDrawInfoJs.RenderDrawInfo;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
    }, function (_stencilManagerJs) {
      Stage = _stencilManagerJs.Stage;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("RenderEntityFillColorType", RenderEntityFillColorType = /*#__PURE__*/function (RenderEntityFillColorType) {
        RenderEntityFillColorType[RenderEntityFillColorType["COLOR"] = 0] = "COLOR";
        RenderEntityFillColorType[RenderEntityFillColorType["VERTEX"] = 1] = "VERTEX";
        return RenderEntityFillColorType;
      }({}));
      _export("RenderEntityType", RenderEntityType = /*#__PURE__*/function (RenderEntityType) {
        RenderEntityType[RenderEntityType["STATIC"] = 0] = "STATIC";
        RenderEntityType[RenderEntityType["DYNAMIC"] = 1] = "DYNAMIC";
        RenderEntityType[RenderEntityType["CROSSED"] = 2] = "CROSSED";
        return RenderEntityType;
      }({}));
      RenderEntityUInt32SharedBufferView = /*#__PURE__*/function (RenderEntityUInt32SharedBufferView) {
        RenderEntityUInt32SharedBufferView[RenderEntityUInt32SharedBufferView["priority"] = 0] = "priority";
        RenderEntityUInt32SharedBufferView[RenderEntityUInt32SharedBufferView["count"] = 1] = "count";
        return RenderEntityUInt32SharedBufferView;
      }(RenderEntityUInt32SharedBufferView || {});
      RenderEntityUInt8SharedBufferView = /*#__PURE__*/function (RenderEntityUInt8SharedBufferView) {
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["colorR"] = 0] = "colorR";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["colorG"] = 1] = "colorG";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["colorB"] = 2] = "colorB";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["colorA"] = 3] = "colorA";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["maskMode"] = 4] = "maskMode";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["fillColorType"] = 5] = "fillColorType";
        RenderEntityUInt8SharedBufferView[RenderEntityUInt8SharedBufferView["count"] = 6] = "count";
        return RenderEntityUInt8SharedBufferView;
      }(RenderEntityUInt8SharedBufferView || {});
      RenderEntityBoolSharedBufferViewBitIndex = /*#__PURE__*/function (RenderEntityBoolSharedBufferViewBitIndex) {
        RenderEntityBoolSharedBufferViewBitIndex[RenderEntityBoolSharedBufferViewBitIndex["enabled"] = 0] = "enabled";
        RenderEntityBoolSharedBufferViewBitIndex[RenderEntityBoolSharedBufferViewBitIndex["useLocal"] = 1] = "useLocal";
        RenderEntityBoolSharedBufferViewBitIndex[RenderEntityBoolSharedBufferViewBitIndex["count"] = 2] = "count";
        return RenderEntityBoolSharedBufferViewBitIndex;
      }(RenderEntityBoolSharedBufferViewBitIndex || {});
      _export("MaskMode", MaskMode = /*#__PURE__*/function (MaskMode) {
        MaskMode[MaskMode["NONE"] = 0] = "NONE";
        MaskMode[MaskMode["MASK"] = 1] = "MASK";
        MaskMode[MaskMode["MASK_INVERTED"] = 2] = "MASK_INVERTED";
        MaskMode[MaskMode["MASK_NODE"] = 3] = "MASK_NODE";
        MaskMode[MaskMode["MASK_NODE_INVERTED"] = 4] = "MASK_NODE_INVERTED";
        return MaskMode;
      }({}));
      /** @mangle */
      _export("RenderEntity", RenderEntity = class RenderEntity {
        get nativeObj() {
          return this._nativeObj;
        }
        get renderDrawInfoArr() {
          return this._dynamicDrawInfoArr;
        }
        get renderEntityType() {
          return this._renderEntityType;
        }
        // set renderEntityType (val:RenderEntityType) {
        //     this._renderEntityType = val;
        // }

        setPriority(val) {
          if (JSB) {
            this._uint32SharedBuffer[RenderEntityUInt32SharedBufferView.priority] = val;
          }
        }
        get color() {
          return this._color;
        }
        set color(val) {
          this._color = val;
          if (JSB) {
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.colorR] = val.r;
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.colorG] = val.g;
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.colorB] = val.b;
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.colorA] = val.a;
          }
        }
        get colorDirty() {
          if (JSB && this._node) {
            this._colorDirty = this._node._colorDirty;
          }
          return this._colorDirty;
        }
        set colorDirty(val) {
          this._colorDirty = val;
          if (JSB && this._node) {
            this._node._colorDirty = val;
          }
        }
        get enabled() {
          return this._enabled;
        }
        set enabled(val) {
          this._enabled = val;
          if (JSB) {
            if (val) {
              this._boolSharedBuffer[0] |= 1 << RenderEntityBoolSharedBufferViewBitIndex.enabled;
            } else {
              this._boolSharedBuffer[0] &= ~(1 << RenderEntityBoolSharedBufferViewBitIndex.enabled);
            }
          }
        }
        setUseLocal(useLocal) {
          this._useLocal = useLocal;
          if (JSB) {
            if (useLocal) {
              this._boolSharedBuffer[0] |= 1 << RenderEntityBoolSharedBufferViewBitIndex.useLocal;
            } else {
              this._boolSharedBuffer[0] &= ~(1 << RenderEntityBoolSharedBufferViewBitIndex.useLocal);
            }
          }
        }
        constructor(entityType) {
          this._renderEntityType = RenderEntityType.STATIC;
          this._dynamicDrawInfoArr = [];
          this._node = null;
          this._renderTransform = null;
          this._stencilStage = Stage.DISABLED;
          this._colorDirty = true;
          this._enabled = false;
          this._useLocal = false;
          this._maskMode = MaskMode.NONE;
          this._color = Color.WHITE.clone();
          if (JSB) {
            if (!this._nativeObj) {
              this._nativeObj = new NativeRenderEntity(entityType);
            }
            this._renderEntityType = entityType;
            this.initSharedBuffer();
          }
        }
        addDynamicRenderDrawInfo(renderDrawInfo) {
          if (JSB) {
            if (renderDrawInfo) {
              this._dynamicDrawInfoArr.push(renderDrawInfo);
              this._nativeObj.addDynamicRenderDrawInfo(renderDrawInfo.nativeObj);
            }
          }
        }
        removeDynamicRenderDrawInfo() {
          if (JSB) {
            this._dynamicDrawInfoArr.pop();
            this._nativeObj.removeDynamicRenderDrawInfo();
          }
        }
        clearDynamicRenderDrawInfos() {
          if (JSB) {
            this._dynamicDrawInfoArr.length = 0;
            this._nativeObj.clearDynamicRenderDrawInfos();
          }
        }
        clearStaticRenderDrawInfos() {
          if (JSB) {
            this._nativeObj.clearStaticRenderDrawInfos();
          }
        }
        clearRenderDrawInfos() {
          if (JSB) {
            if (this._renderEntityType === RenderEntityType.DYNAMIC) {
              this.removeDynamicRenderDrawInfo();
            } else if (this._renderEntityType === RenderEntityType.STATIC) {
              this.clearStaticRenderDrawInfos();
            }
          }
        }
        setDynamicRenderDrawInfo(renderDrawInfo, index) {
          if (JSB) {
            if (renderDrawInfo) {
              if (this._dynamicDrawInfoArr.length < index + 1) {
                this._dynamicDrawInfoArr.push(renderDrawInfo);
                this._nativeObj.addDynamicRenderDrawInfo(renderDrawInfo.nativeObj);
              } else {
                this._dynamicDrawInfoArr[index] = renderDrawInfo;
                this._nativeObj.setDynamicRenderDrawInfo(renderDrawInfo.nativeObj, index);
              }
            }
          }
        }
        setMaskMode(mode) {
          if (JSB) {
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.maskMode] = mode;
          }
          this._maskMode = mode;
        }
        setFillColorType(fillColorType) {
          if (JSB) {
            this._uint8SharedBuffer[RenderEntityUInt8SharedBufferView.fillColorType] = fillColorType;
          }
        }
        getStaticRenderDrawInfo() {
          if (JSB) {
            const nativeDrawInfo = this._nativeObj.getStaticRenderDrawInfo(this._nativeObj.staticDrawInfoSize++);
            const drawInfo = new RenderDrawInfo(nativeDrawInfo);
            return drawInfo;
          }
          return null;
        }
        setNode(node) {
          if (JSB) {
            if (this._node !== node) {
              this._nativeObj.node = node;
            }
          }
          this._node = node;
        }
        setRenderTransform(renderTransform) {
          if (JSB) {
            if (this._renderTransform !== renderTransform) {
              this._nativeObj.renderTransform = renderTransform;
            }
          }
          this._renderTransform = renderTransform;
        }
        setStencilStage(stage) {
          if (JSB) {
            if (this._stencilStage !== stage) {
              this._nativeObj.stencilStage = stage;
            }
          }
          this._stencilStage = stage;
        }
        initSharedBuffer() {
          if (JSB) {
            const buffer = this._nativeObj.getEntitySharedBufferForJS();
            let offset = 0;
            this._uint32SharedBuffer = new Uint32Array(buffer, offset, RenderEntityUInt32SharedBufferView.count);
            offset += RenderEntityUInt32SharedBufferView.count * 4;
            this._uint8SharedBuffer = new Uint8Array(buffer, offset, RenderEntityUInt8SharedBufferView.count);
            offset += RenderEntityUInt8SharedBufferView.count * 1;
            this._boolSharedBuffer = new Uint8Array(buffer, offset, 1); // Only use 1 bytes for at most 8 booleans
          }
        }
      });
    }
  };
});