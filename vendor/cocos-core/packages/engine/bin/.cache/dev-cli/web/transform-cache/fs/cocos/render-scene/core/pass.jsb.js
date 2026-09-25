System.register("q-bundled:///fs/cocos/render-scene/core/pass.jsb.js", ["../../core/index.js", "../../core/math/math-native-ext.js"], function (_export, _context) {
  "use strict";

  var Mat3, Mat4, Quat, Vec2, Vec3, Vec4, MathType, BatchingSchemes, Pass, proto;
  return {
    setters: [function (_coreIndexJs) {
      Mat3 = _coreIndexJs.Mat3;
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
    }, function (_coreMathMathNativeExtJs) {
      MathType = _coreMathMathNativeExtJs.MathType;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("BatchingSchemes", BatchingSchemes = /*#__PURE__*/function (BatchingSchemes) {
        BatchingSchemes[BatchingSchemes["NONE"] = 0] = "NONE";
        BatchingSchemes[BatchingSchemes["INSTANCING"] = 1] = "INSTANCING";
        return BatchingSchemes;
      }({}));
      _export("Pass", Pass = jsb.Pass);
      proto = Pass.prototype;
      proto.getUniform = function getUniform(handle, out) {
        const val = this._getUniform(handle);
        if (typeof val === 'object') {
          if (val.type) {
            switch (val.type) {
              case MathType.VEC2:
                Vec2.copy(out, val);
                break;
              case MathType.VEC3:
                Vec3.copy(out, val);
                break;
              case MathType.VEC4:
                Vec4.copy(out, val);
                break;
              case MathType.COLOR:
                out.x = val.x;
                out.y = val.y;
                out.z = val.z;
                out.w = val.w;
                break;
              case MathType.MAT3:
                Mat3.copy(out, val);
                break;
              case MathType.MAT4:
                Mat4.copy(out, val);
                break;
              case MathType.QUATERNION:
                Quat.copy(out, val);
                break;
              default:
                console.error(`getUniform, unknown object type: ${val.type}`);
                break;
            }
          } else {
            console.error(`getUniform, unknown object: ${val}`);
          }
        } else if (typeof val === 'number') {
          out = val;
        } else {
          console.error(`getUniform, not supported: ${val}`);
        }
        return out;
      };
    }
  };
});