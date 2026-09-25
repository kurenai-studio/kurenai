System.register("q-bundled:///fs/cocos/animation/marionette/variable/basic.js", [], function (_export, _context) {
  "use strict";

  var VarInstanceBase, VariableType, createInstanceTag;
  _export("VarInstanceBase", void 0);
  return {
    setters: [],
    execute: function () {
      /**
       * @en
       * Represents animation graph variable types.
       * @zh
       * 表示动画图变量的类型。
       */
      _export("VariableType", VariableType = /*#__PURE__*/function (VariableType) {
        /**
         * @en
         * A floating.
         * @zh
         * 浮点数。
         */
        VariableType[VariableType["FLOAT"] = 0] = "FLOAT";
        /**
         * @en
         * A boolean.
         * @zh
         * 布尔值。
         */
        VariableType[VariableType["BOOLEAN"] = 1] = "BOOLEAN";
        /**
         * @en
         * A trigger.
         * @zh
         * 触发器。
         */
        VariableType[VariableType["TRIGGER"] = 2] = "TRIGGER";
        /**
         * @en
         * An integer.
         * @zh
         * 整数。
         */
        VariableType[VariableType["INTEGER"] = 3] = "INTEGER";
        /**
         * @zh
         * 三维向量。
         * @en
         * Vector 3d.
         */
        VariableType[VariableType["VEC3_experimental"] = 4] = "VEC3_experimental";
        /**
         * @zh
         * 四元数。
         * @en
         * Quaternion.
         */
        VariableType[VariableType["QUAT_experimental"] = 5] = "QUAT_experimental";
        return VariableType;
      }({}));
      /**
       * @en
       * Represents variable's value.
       * @zh
       * 表示变量的值。
       */
      _export("createInstanceTag", createInstanceTag = Symbol('CreateInstance'));
      _export("VarInstanceBase", VarInstanceBase = class VarInstanceBase {
        constructor(type) {
          this._refs = [];
          this.type = type;
        }
        bind(fn, thisArg, ...args) {
          this._refs.push({
            fn: fn,
            thisArg,
            args
          });
          return this.getValue();
        }
        get value() {
          return this.getValue();
        }
        set value(value) {
          this.setValue(value);
          for (const {
            fn,
            thisArg,
            args
          } of this._refs) {
            fn.call(thisArg, value, ...args);
          }
        }
      });
    }
  };
});