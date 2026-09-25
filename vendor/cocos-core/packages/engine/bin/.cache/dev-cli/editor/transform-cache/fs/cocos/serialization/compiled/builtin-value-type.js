System.register("q-bundled:///fs/cocos/serialization/compiled/builtin-value-type.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var JSB, Vec2, Vec3, Vec4, Color, Size, Rect, Quat, Mat4, assertIsTrue, constructorMap, setterMap;
  function vec4LikeSetter(obj, data) {
    obj.x = data[1];
    obj.y = data[2];
    obj.z = data[3];
    obj.w = data[4];
  }
  function serializeBuiltinValueType(obj) {
    const ctor = obj.constructor;
    const typeId = constructorMap.indexOf(ctor);
    switch (ctor) {
      case Vec2:
        return [typeId, obj.x, obj.y];
      case Vec3:
        return [typeId, obj.x, obj.y, obj.z];
      case Vec4:
      case Quat:
        return [typeId, obj.x, obj.y, obj.z, obj.w];
      case Color:
        return [typeId, Color.toUint32(obj)];
      case Size:
        return [typeId, obj.width, obj.height];
      case Rect:
        return [typeId, obj.x, obj.y, obj.width, obj.height];
      case Mat4:
        {
          const res = new Array(1 + 16);
          res[0] = typeId;
          Mat4.toArray(res, obj, 1);
          return res;
        }
      default:
        return null;
    }
  }
  function deserializeBuiltinValueType(data, owner, key, value) {
    const typeIndex = value[0];
    assertIsTrue(typeIndex >= 0 && typeIndex < constructorMap.length);
    const object = new constructorMap[typeIndex]();
    const setter = setterMap[typeIndex];
    setter(object, value);
    owner[key] = object;
  }
  function deserializeBuiltinValueTypeInto(data, owner, key, value) {
    const typeIndex = value[0];
    assertIsTrue(typeIndex >= 0 && typeIndex < constructorMap.length);
    if (JSB) {
      // The native layer type corresponding to the BuiltinValueTypes has not been exported exclude Color,
      // so we need to set to native after value changed.
      const tmp = owner[key];
      const setter = setterMap[typeIndex];
      setter(tmp, value);
      owner[key] = tmp;
    } else {
      const object = owner[key];
      const setter = setterMap[typeIndex];
      setter(object, value);
    }
  }
  _export({
    serializeBuiltinValueType: serializeBuiltinValueType,
    deserializeBuiltinValueType: deserializeBuiltinValueType,
    deserializeBuiltinValueTypeInto: deserializeBuiltinValueTypeInto
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
      Color = _coreIndexJs.Color;
      Size = _coreIndexJs.Size;
      Rect = _coreIndexJs.Rect;
      Quat = _coreIndexJs.Quat;
      Mat4 = _coreIndexJs.Mat4;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }],
    execute: function () {
      /**
       * If a value type is not registered in this list, it will be serialized as plain class.
       */
      constructorMap = [Vec2,
      // 0
      Vec3,
      // 1
      Vec4,
      // 2
      Quat,
      // 3
      Color,
      // 4
      Size,
      // 5
      Rect,
      // 6
      Mat4 // 7
      ];
      setterMap = [(obj, data) => {
        obj.x = data[1];
        obj.y = data[2];
      }, (obj, data) => {
        obj.x = data[1];
        obj.y = data[2];
        obj.z = data[3];
      }, vec4LikeSetter,
      // Vec4
      vec4LikeSetter,
      // Quat
      (obj, data) => {
        Color.fromUint32(obj, data[1]);
      }, (obj, data) => {
        obj.width = data[1];
        obj.height = data[2];
      }, (obj, data) => {
        obj.x = data[1];
        obj.y = data[2];
        obj.width = data[3];
        obj.height = data[4];
      }, (obj, data) => {
        Mat4.fromArray(obj, data, 1);
      }];
    }
  };
});