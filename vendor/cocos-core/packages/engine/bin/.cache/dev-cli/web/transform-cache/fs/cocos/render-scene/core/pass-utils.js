System.register("q-bundled:///fs/cocos/render-scene/core/pass-utils.js", ["../../gfx/index.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var Type, Color, Mat3, Mat4, Vec2, Vec3, Vec4, Quat, warnID, typeMask, bindingMask, countMask, offsetMask, genHandle, getTypeFromHandle, getBindingFromHandle, getCountFromHandle, getOffsetFromHandle, customizeType, type2reader, type2writer, type2validator, defaultValues;
  /**
   * @en Gets the default values for the given type of uniform
   * @zh 根据指定的 Uniform 类型来获取默认值
   * @param type The type of the uniform
   */
  function getDefaultFromType(type) {
    switch (type) {
      case Type.BOOL:
      case Type.INT:
      case Type.UINT:
      case Type.FLOAT:
        return defaultValues[0];
      case Type.BOOL2:
      case Type.INT2:
      case Type.UINT2:
      case Type.FLOAT2:
        return defaultValues[1];
      case Type.BOOL4:
      case Type.INT4:
      case Type.UINT4:
      case Type.FLOAT4:
        return defaultValues[2];
      case Type.MAT4:
        return defaultValues[3];
      case Type.SAMPLER2D:
        return 'default-texture';
      case Type.SAMPLER_CUBE:
        return 'default-cube-texture';
      case Type.SAMPLER2D_ARRAY:
        return 'default-array-texture';
      case Type.SAMPLER3D:
        return 'default-3d-texture';
      default:
    }
    return defaultValues[0];
  }
  function getStringFromType(type) {
    switch (type) {
      case Type.SAMPLER2D:
        return '-texture';
      case Type.SAMPLER_CUBE:
        return '-cube-texture';
      case Type.SAMPLER2D_ARRAY:
        return '-array-texture';
      case Type.SAMPLER3D:
        return '-3d-texture';
      default:
        return '-unknown';
    }
  }

  /**
   * @en Combination of preprocess macros
   * @zh 预处理宏组合
   */

  /**
   * @en Override the preprocess macros
   * @zh 覆写预处理宏
   * @param target Target preprocess macros to be overridden
   * @param source Preprocess macros used for override
   */
  function overrideMacros(target, source) {
    const entries = Object.entries(source);
    let isDifferent = false;
    for (let i = 0; i < entries.length; i++) {
      if (target[entries[i][0]] !== entries[i][1]) {
        target[entries[i][0]] = entries[i][1];
        isDifferent = true;
      }
    }
    return isDifferent;
  }
  _export({
    getDefaultFromType: getDefaultFromType,
    getStringFromType: getStringFromType,
    overrideMacros: overrideMacros
  });
  return {
    setters: [function (_gfxIndexJs) {
      Type = _gfxIndexJs.Type;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Mat3 = _coreIndexJs.Mat3;
      Mat4 = _coreIndexJs.Mat4;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
      Quat = _coreIndexJs.Quat;
      warnID = _coreIndexJs.warnID;
    }],
    execute: function () {
      /*
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
      typeMask = 0xfc000000; //  6 bits => 64 types
      bindingMask = 0x03f00000; //  6 bits => 64 bindings
      countMask = 0x000ff000; //  8 bits => 256 vectors
      offsetMask = 0x00000fff; // 12 bits => 1024 vectors
      _export("genHandle", genHandle = (binding, type, count, offset = 0) => type << 26 & typeMask | binding << 20 & bindingMask | count << 12 & countMask | offset & offsetMask);
      _export("getTypeFromHandle", getTypeFromHandle = handle => (handle & typeMask) >>> 26);
      _export("getBindingFromHandle", getBindingFromHandle = handle => (handle & bindingMask) >>> 20);
      _export("getCountFromHandle", getCountFromHandle = handle => (handle & countMask) >>> 12);
      _export("getOffsetFromHandle", getOffsetFromHandle = handle => handle & offsetMask);
      _export("customizeType", customizeType = (handle, type) => handle & ~typeMask | type << 26 & typeMask);
      /**
       * @en Vector type uniforms
       * @zh 向量类型 uniform
       */
      _export("type2reader", type2reader = {
        [Type.UNKNOWN]: (a, v, idx = 0) => warnID(12010, idx),
        [Type.INT]: (a, v, idx = 0) => a[idx],
        [Type.INT2]: (a, v, idx = 0) => Vec2.fromArray(v, a, idx),
        [Type.INT3]: (a, v, idx = 0) => Vec3.fromArray(v, a, idx),
        [Type.INT4]: (a, v, idx = 0) => Vec4.fromArray(v, a, idx),
        [Type.FLOAT]: (a, v, idx = 0) => a[idx],
        [Type.FLOAT2]: (a, v, idx = 0) => Vec2.fromArray(v, a, idx),
        [Type.FLOAT3]: (a, v, idx = 0) => Vec3.fromArray(v, a, idx),
        [Type.FLOAT4]: (a, v, idx = 0) => Vec4.fromArray(v, a, idx),
        [Type.MAT3]: (a, v, idx = 0) => Mat3.fromArray(v, a, idx),
        [Type.MAT4]: (a, v, idx = 0) => Mat4.fromArray(v, a, idx)
      });
      _export("type2writer", type2writer = {
        [Type.UNKNOWN]: (a, v, idx = 0) => warnID(12010, idx),
        [Type.INT]: (a, v, idx = 0) => a[idx] = v,
        [Type.INT2]: (a, v, idx = 0) => Vec2.toArray(a, v, idx),
        [Type.INT3]: (a, v, idx = 0) => Vec3.toArray(a, v, idx),
        [Type.INT4]: (a, v, idx = 0) => Vec4.toArray(a, v, idx),
        [Type.FLOAT]: (a, v, idx = 0) => a[idx] = v,
        [Type.FLOAT2]: (a, v, idx = 0) => Vec2.toArray(a, v, idx),
        [Type.FLOAT3]: (a, v, idx = 0) => Vec3.toArray(a, v, idx),
        [Type.FLOAT4]: (a, v, idx = 0) => Vec4.toArray(a, v, idx),
        [Type.MAT3]: (a, v, idx = 0) => Mat3.toArray(a, v, idx),
        [Type.MAT4]: (a, v, idx = 0) => Mat4.toArray(a, v, idx)
      });
      _export("type2validator", type2validator = {
        [Type.INT]: v => typeof v === 'number',
        [Type.FLOAT]: v => typeof v === 'number',
        [Type.INT2]: v => !!(v instanceof Vec2),
        [Type.FLOAT2]: v => !!(v instanceof Vec2),
        [Type.INT3]: v => !!(v instanceof Vec3),
        [Type.FLOAT3]: v => !!(v instanceof Vec3),
        [Type.INT4]: v => !!(v instanceof Vec4),
        [Type.FLOAT4]: v => !!(v instanceof Vec4 || v instanceof Color || v instanceof Quat),
        [Type.MAT3]: v => !!(v instanceof Mat3),
        [Type.MAT4]: v => !!(v instanceof Mat4)
      });
      defaultValues = [Object.freeze([0]), Object.freeze([0, 0]), Object.freeze([0, 0, 0, 0]), Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])];
    }
  };
});