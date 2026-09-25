System.register("q-bundled:///fs/cocos/core/data/utils/compact-value-type-array.js", ["../decorators/index.js", "../../math/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, Vec3, Quat, Vec4, Mat4, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _CompactValueTypeArray, StorageUnit, ElementType, elementTypeBits, CompactValueTypeArray, BuiltinElementTypeTraits;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function combineStorageUnitElementType(unit, elementType) {
    return (elementType << elementTypeBits) + unit;
  }
  function extractStorageUnitElementType(combined) {
    return {
      storageUnit: ~(-1 << elementTypeBits) & combined,
      elementType: combined >> elementTypeBits
    };
  }

  /**
   * @deprecated Since V3.5.0.
   */

  function getElementTraits(elementType) {
    return BuiltinElementTypeTraits[elementType];
  }
  function getStorageConstructor(unit) {
    switch (unit) {
      case StorageUnit.Uint8:
        return Uint8Array;
      case StorageUnit.Uint16:
        return Uint16Array;
      case StorageUnit.Uint32:
        return Uint32Array;
      case StorageUnit.Int8:
        return Int8Array;
      case StorageUnit.Int16:
        return Int16Array;
      case StorageUnit.Int32:
        return Int32Array;
      case StorageUnit.Float32:
        return Float32Array;
      case StorageUnit.Float64:
        return Float64Array;
    }
  }
  function isCompactValueTypeArray(value) {
    return value instanceof CompactValueTypeArray;
  }
  _export({
    combineStorageUnitElementType: combineStorageUnitElementType,
    extractStorageUnitElementType: extractStorageUnitElementType,
    isCompactValueTypeArray: isCompactValueTypeArray
  });
  return {
    setters: [function (_decoratorsIndexJs) {
      ccclass = _decoratorsIndexJs.ccclass;
      serializable = _decoratorsIndexJs.serializable;
    }, function (_mathIndexJs) {
      Vec3 = _mathIndexJs.Vec3;
      Quat = _mathIndexJs.Quat;
      Vec4 = _mathIndexJs.Vec4;
      Mat4 = _mathIndexJs.Mat4;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("StorageUnit", StorageUnit = /*#__PURE__*/function (StorageUnit) {
        StorageUnit[StorageUnit["Uint8"] = 0] = "Uint8";
        StorageUnit[StorageUnit["Uint16"] = 1] = "Uint16";
        StorageUnit[StorageUnit["Uint32"] = 2] = "Uint32";
        StorageUnit[StorageUnit["Int8"] = 3] = "Int8";
        StorageUnit[StorageUnit["Int16"] = 4] = "Int16";
        StorageUnit[StorageUnit["Int32"] = 5] = "Int32";
        StorageUnit[StorageUnit["Float32"] = 6] = "Float32";
        StorageUnit[StorageUnit["Float64"] = 7] = "Float64";
        return StorageUnit;
      }({}));
      _export("ElementType", ElementType = /*#__PURE__*/function (ElementType) {
        ElementType[ElementType["Scalar"] = 0] = "Scalar";
        ElementType[ElementType["Vec2"] = 1] = "Vec2";
        ElementType[ElementType["Vec3"] = 2] = "Vec3";
        ElementType[ElementType["Vec4"] = 3] = "Vec4";
        ElementType[ElementType["Quat"] = 4] = "Quat";
        ElementType[ElementType["Mat4"] = 5] = "Mat4";
        return ElementType;
      }({}));
      elementTypeBits = 3;
      _export("CompactValueTypeArray", CompactValueTypeArray = (_dec = ccclass('cc.CompactValueTypeArray'), _dec(_class = (_class2 = (_CompactValueTypeArray = class CompactValueTypeArray {
        constructor() {
          /**
           * Offset into the buffer, in bytes.
           */
          _initializerDefineProperty(this, "_byteOffset", _descriptor, this);
          /**
           * Unit count this CVTA occupies.
           */
          _initializerDefineProperty(this, "_unitCount", _descriptor2, this);
          /**
           * Element type this CVTA holds.
           */
          _initializerDefineProperty(this, "_unitElement", _descriptor3, this);
          /**
           * Element count this CVTA holds.
           */
          _initializerDefineProperty(this, "_length", _descriptor4, this);
        }
        /**
         * Returns the length in bytes that a buffer needs to encode the specified value array in form of CVTA.
         * @param values The value array.
         * @param unit Target element type.
         */
        static lengthFor(values, elementType, unit) {
          const elementTraits = getElementTraits(elementType);
          return elementTraits.requiredUnits * values.length * getStorageConstructor(unit).BYTES_PER_ELEMENT;
        }

        /**
         * Compresses the specified value array in form of CVTA into target buffer.
         * @param values The value array.
         * @param unit Target element type.
         * @param arrayBuffer Target buffer.
         * @param byteOffset Offset into target buffer.
         */
        static compress(values, elementType, unit, arrayBuffer, byteOffset, presumedByteOffset) {
          const elementTraits = getElementTraits(elementType);
          const storageConstructor = getStorageConstructor(unit);
          const unitCount = elementTraits.requiredUnits * values.length;
          const storage = new storageConstructor(arrayBuffer, byteOffset, unitCount);
          for (let i = 0; i < values.length; ++i) {
            elementTraits.compress(storage, i, values[i]);
          }
          const result = new CompactValueTypeArray();
          result._unitElement = combineStorageUnitElementType(unit, elementType);
          result._byteOffset = presumedByteOffset;
          result._unitCount = unitCount;
          result._length = values.length;
          return result;
        }

        /**
         * Decompresses this CVTA.
         * @param arrayBuffer The buffer this CVTA stored in.
         */
        decompress(arrayBuffer) {
          const {
            storageUnit,
            elementType
          } = extractStorageUnitElementType(this._unitElement);
          const elementTraits = getElementTraits(elementType);
          const storageConstructor = getStorageConstructor(storageUnit);
          const storage = new storageConstructor(arrayBuffer, this._byteOffset, this._unitCount);
          const result = new Array(this._length);
          for (let i = 0; i < this._length; ++i) {
            result[i] = elementTraits.decompress(storage, i);
          }
          return result;
        }
      }, _CompactValueTypeArray.StorageUnit = StorageUnit, _CompactValueTypeArray.ElementType = ElementType, _CompactValueTypeArray), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_byteOffset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_unitCount", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_unitElement", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return combineStorageUnitElementType(StorageUnit.Uint8, ElementType.Scalar);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_length", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
      BuiltinElementTypeTraits = {
        [ElementType.Scalar]: {
          requiredUnits: 1,
          compress(storage, index, value) {
            storage[index] = value;
          },
          decompress(storage, index) {
            return storage[index];
          }
        },
        [ElementType.Vec2]: {
          requiredUnits: 2,
          compress(storage, index, value) {
            storage[index * 2] = value.x;
            storage[index * 2 + 1] = value.y;
          },
          decompress(storage, index) {
            return new Vec3(storage[index * 2], storage[index * 2 + 1]);
          }
        },
        [ElementType.Vec3]: {
          requiredUnits: 3,
          compress(storage, index, value) {
            storage[index * 3] = value.x;
            storage[index * 3 + 1] = value.y;
            storage[index * 3 + 2] = value.z;
          },
          decompress(storage, index) {
            return new Vec3(storage[index * 3], storage[index * 3 + 1], storage[index * 3 + 2]);
          }
        },
        [ElementType.Vec4]: {
          requiredUnits: 4,
          compress(storage, index, value) {
            storage[index * 4] = value.x;
            storage[index * 4 + 1] = value.y;
            storage[index * 4 + 2] = value.z;
            storage[index * 4 + 3] = value.w;
          },
          decompress(storage, index) {
            return new Vec4(storage[index * 4], storage[index * 4 + 1], storage[index * 4 + 2], storage[index * 4 + 3]);
          }
        },
        [ElementType.Quat]: {
          requiredUnits: 4,
          compress(storage, index, value) {
            storage[index * 4] = value.x;
            storage[index * 4 + 1] = value.y;
            storage[index * 4 + 2] = value.z;
            storage[index * 4 + 3] = value.w;
          },
          decompress(storage, index) {
            return new Quat(storage[index * 4], storage[index * 4 + 1], storage[index * 4 + 2], storage[index * 4 + 3]);
          }
        },
        [ElementType.Mat4]: {
          requiredUnits: 16,
          compress(storage, index, value) {
            Mat4.toArray(storage, value, index * 16);
          },
          decompress(storage, index) {
            return Mat4.fromArray(new Mat4(), storage, index * 16);
          }
        }
      };
    }
  };
});