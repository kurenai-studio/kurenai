System.register("q-bundled:///fs/cocos/core/math/math-native-ext.js", ["../../../../virtual/internal%253Aconstants.js", "./mat4.js", "./mat3.js", "./vec3.js", "./vec2.js", "./vec4.js", "./quat.js", "./color.js"], function (_export, _context) {
  "use strict";

  var NATIVE, Mat4, Mat3, Vec3, Vec2, Vec4, Quat, Color, MathType;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      NATIVE = _virtualInternal253AconstantsJs.NATIVE;
    }, function (_mat4Js) {
      Mat4 = _mat4Js.Mat4;
    }, function (_mat3Js) {
      Mat3 = _mat3Js.Mat3;
    }, function (_vec3Js) {
      Vec3 = _vec3Js.Vec3;
    }, function (_vec2Js) {
      Vec2 = _vec2Js.Vec2;
    }, function (_vec4Js) {
      Vec4 = _vec4Js.Vec4;
    }, function (_quatJs) {
      Quat = _quatJs.Quat;
    }, function (_colorJs) {
      Color = _colorJs.Color;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
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
      _export("MathType", MathType = /*#__PURE__*/function (MathType) {
        MathType[MathType["VEC2"] = 0] = "VEC2";
        MathType[MathType["VEC3"] = 1] = "VEC3";
        MathType[MathType["VEC4"] = 2] = "VEC4";
        MathType[MathType["QUATERNION"] = 3] = "QUATERNION";
        MathType[MathType["MAT3"] = 4] = "MAT3";
        MathType[MathType["MAT4"] = 5] = "MAT4";
        MathType[MathType["SIZE"] = 6] = "SIZE";
        MathType[MathType["RECT"] = 7] = "RECT";
        MathType[MathType["COLOR"] = 8] = "COLOR";
        return MathType;
      }({}));
      if (NATIVE) {
        const defineAttr = (proto, name, offset) => {
          Object.defineProperty(proto, name, {
            configurable: true,
            enumerable: true,
            get() {
              return this._data()[offset];
            },
            set(v) {
              this._data()[offset] = v;
            }
          });
        };
        const extendType = (proto, parentProto, typ) => {
          proto._data = function _data() {
            if (!this.__data) {
              this.__data = new Float32Array(this.underlyingData()); // underlyingData is a JSB method.
            }
            return this.__data;
          };
          Object.setPrototypeOf(proto, parentProto);
          Object.defineProperty(proto, 'type', {
            configurable: true,
            enumerable: true,
            writable: false,
            value: typ
          });
        };
        const inheritCCClass = (ctor, parentCtor) => {
          for (const attrName of ['__cid__', '__classname__']) {
            Object.defineProperty(ctor.prototype, attrName, {
              value: parentCtor.prototype[attrName],
              writable: false,
              enumerable: false,
              configurable: true
            });
          }
          for (const staticKey of ['__attrs__', '__props__', '__values__']) {
            ctor[staticKey] = parentCtor[staticKey];
          }
        };
        extendType(jsb.Mat4.prototype, Mat4.prototype, MathType.MAT4);
        for (let i = 0; i < 16; i++) {
          const numb = `0${i}`;
          defineAttr(jsb.Mat4.prototype, `m${numb.substring(numb.length - 2)}`, i);
        }
        for (let i = 0; i < 9; i++) {
          const numb = `0${i}`;
          defineAttr(jsb.Mat3.prototype, `m${numb.substring(numb.length - 2)}`, i);
        }
        extendType(jsb.Mat3.prototype, Mat3.prototype, MathType.MAT3);
        defineAttr(jsb.Vec2.prototype, 'x', 0);
        defineAttr(jsb.Vec2.prototype, 'y', 1);
        extendType(jsb.Vec2.prototype, Vec2.prototype, MathType.VEC2);
        defineAttr(jsb.Vec3.prototype, 'x', 0);
        defineAttr(jsb.Vec3.prototype, 'y', 1);
        defineAttr(jsb.Vec3.prototype, 'z', 2);
        extendType(jsb.Vec3.prototype, Vec3.prototype, MathType.VEC3);
        defineAttr(jsb.Vec4.prototype, 'x', 0);
        defineAttr(jsb.Vec4.prototype, 'y', 1);
        defineAttr(jsb.Vec4.prototype, 'z', 2);
        defineAttr(jsb.Vec4.prototype, 'w', 3);
        extendType(jsb.Vec4.prototype, Vec4.prototype, MathType.VEC4);
        defineAttr(jsb.Quat.prototype, 'x', 0);
        defineAttr(jsb.Quat.prototype, 'y', 1);
        defineAttr(jsb.Quat.prototype, 'z', 2);
        defineAttr(jsb.Quat.prototype, 'w', 3);
        extendType(jsb.Quat.prototype, Quat.prototype, MathType.QUATERNION);
        Object.setPrototypeOf(jsb.Color.prototype, Color.prototype);
        Object.defineProperty(jsb.Color.prototype, 'type', {
          configurable: true,
          enumerable: true,
          writable: false,
          value: MathType.COLOR
        });
        inheritCCClass(jsb.Vec4, Vec4);
        inheritCCClass(jsb.Vec3, Vec3);
        inheritCCClass(jsb.Vec2, Vec2);
        inheritCCClass(jsb.Mat4, Mat4);
        inheritCCClass(jsb.Mat3, Mat3);
        inheritCCClass(jsb.Color, Color);
        inheritCCClass(jsb.Quat, Quat);
      }
    }
  };
});