System.register("q-bundled:///fs/cocos/core/data/utils/attribute.js", ["../../../../../virtual/internal%253Aconstants.js", "../../platform/debug.js", "../../utils/js.js", "../../utils/misc.js", "../../global-exports.js"], function (_export, _context) {
  "use strict";

  var EDITOR, log, warnID, formatStr, get, getClassName, isChildClassOf, value, isPlainEmptyObj_DEV, legacyCC, PrimitiveType, DELIMETER, CCInteger, CCFloat, CCBoolean, CCString;
  function createAttrsSingle(owner, superAttrs) {
    const attrs = superAttrs ? Object.create(superAttrs) : {};
    value(owner, '__attrs__', attrs);
    return attrs;
  }

  /**
   * @param subclass Should not have '__attrs__'.
   */
  function createAttrs(subclass) {
    if (typeof subclass !== 'function') {
      // attributes only in instance
      const instance = subclass;
      return createAttrsSingle(instance, getClassAttrs(instance.constructor));
    }
    let superClass;
    const chains = legacyCC.Class.getInheritanceChain(subclass);
    for (let i = chains.length - 1; i >= 0; i--) {
      const cls = chains[i];
      const attrs = cls.hasOwnProperty('__attrs__') && cls.__attrs__;
      if (!attrs) {
        superClass = chains[i + 1];
        createAttrsSingle(cls, superClass && superClass.__attrs__);
      }
    }
    superClass = chains[0];
    createAttrsSingle(subclass, superClass && superClass.__attrs__);
    return subclass.__attrs__;
  }

  // /**
  //  * @class Class
  //  */
  /**
   * Tag the class with any meta attributes, then return all current attributes assigned to it.
   * This function holds only the attributes, not their implementations.
   * @param constructor The class or instance. If instance, the attribute will be dynamic and only available for the specified instance.
   * @param propertyName The name of the property or function, used to retrieve the attributes.
   * @private
   */
  function attr(constructor, propertyName) {
    const attrs = getClassAttrs(constructor);
    const prefix = propertyName + DELIMETER;
    const ret = {};
    for (const key in attrs) {
      if (key.startsWith(prefix)) {
        ret[key.slice(prefix.length)] = attrs[key];
      }
    }
    return ret;
  }

  /**
   * Returns a read-only meta-object.
   */
  function getClassAttrs(constructor) {
    return constructor.hasOwnProperty('__attrs__') && constructor.__attrs__ || createAttrs(constructor);
  }
  function setClassAttr(ctor, propName, key, value) {
    getClassAttrs(ctor)[propName + DELIMETER + key] = value;
  }
  // Ensures the type matches its default value
  function getTypeChecker_ET(type, attributeName) {
    return function (constructor, mainPropertyName) {
      const propInfo = `"${getClassName(constructor)}.${mainPropertyName}"`;
      const mainPropAttrs = attr(constructor, mainPropertyName);
      let mainPropAttrsType = mainPropAttrs.type;
      if (mainPropAttrsType === CCInteger || mainPropAttrsType === CCFloat) {
        mainPropAttrsType = 'Number';
      } else if (mainPropAttrsType === CCString || mainPropAttrsType === CCBoolean) {
        mainPropAttrsType = `${mainPropAttrsType}`;
      }
      if (mainPropAttrsType !== type) {
        warnID(3604, propInfo);
        return;
      }
      if (!mainPropAttrs.hasOwnProperty('default')) {
        return;
      }
      const defaultVal = mainPropAttrs.default;
      if (typeof defaultVal === 'undefined') {
        return;
      }
      const isContainer = Array.isArray(defaultVal) || isPlainEmptyObj_DEV(defaultVal);
      if (isContainer) {
        return;
      }
      const defaultType = typeof defaultVal;
      const type_lowerCase = type.toLowerCase();
      if (defaultType === type_lowerCase) {
        if (type_lowerCase === 'object') {
          if (defaultVal && !(defaultVal instanceof mainPropAttrs.ctor)) {
            warnID(3605, propInfo, getClassName(mainPropAttrs.ctor));
          } else {
            return;
          }
        } else if (type !== 'Number') {
          warnID(3606, attributeName, propInfo, type);
        }
      } else if (defaultType !== 'function') {
        if (type === CCString.default && defaultVal == null) {
          warnID(3607, propInfo);
        } else {
          warnID(3611, attributeName, propInfo, defaultType);
        }
      } else {
        return;
      }
      delete mainPropAttrs.type;
    };
  }

  // Ensures the type matches its default value
  function getObjTypeChecker_ET(typeCtor) {
    return function (classCtor, mainPropName) {
      getTypeChecker_ET('Object', 'type')(classCtor, mainPropName);
      // check ValueType
      const defaultDef = getClassAttrs(classCtor)[`${mainPropName + DELIMETER}default`];
      const defaultVal = legacyCC.Class.getDefault(defaultDef);
      if (!Array.isArray(defaultVal) && isChildClassOf(typeCtor, legacyCC.ValueType)) {
        const typename = getClassName(typeCtor);
        const info = formatStr('No need to specify the "type" of "%s.%s" because %s is a child class of ValueType.', getClassName(classCtor), mainPropName, typename);
        if (defaultDef) {
          log(info);
        } else {
          warnID(3612, info, typename, getClassName(classCtor), mainPropName, typename);
        }
      }
    };
  }
  _export({
    createAttrsSingle: createAttrsSingle,
    createAttrs: createAttrs,
    attr: attr,
    getClassAttrs: getClassAttrs,
    setClassAttr: setClassAttr,
    PrimitiveType: void 0,
    getTypeChecker_ET: getTypeChecker_ET,
    getObjTypeChecker_ET: getObjTypeChecker_ET
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_platformDebugJs) {
      log = _platformDebugJs.log;
      warnID = _platformDebugJs.warnID;
    }, function (_utilsJsJs) {
      formatStr = _utilsJsJs.formatStr;
      get = _utilsJsJs.get;
      getClassName = _utilsJsJs.getClassName;
      isChildClassOf = _utilsJsJs.isChildClassOf;
      value = _utilsJsJs.value;
    }, function (_utilsMiscJs) {
      isPlainEmptyObj_DEV = _utilsMiscJs.isPlainEmptyObj_DEV;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
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
      _export("DELIMETER", DELIMETER = '$_$');
      _export("PrimitiveType", PrimitiveType = class PrimitiveType {
        constructor(name, defaultValue) {
          this.name = name;
          this.default = defaultValue;
        }
        toString() {
          return this.name;
        }
      });
      /**
       * @en
       * Indicates that the editor should treat this property or array element as an Integer value.
       * @zh
       * 指定编辑器以整数形式对待该属性或数组元素。
       * @example
       * ```ts
       * import { CCInteger, _decorator } from "cc";
       *
       * // in the class definition:
       *
       * @_decorator.property({type: CCInteger})
       * count = 0;
       *
       * @_decorator.property({type: [CCInteger]})
       * array = [];
       * ```
       */
      _export("CCInteger", CCInteger = new PrimitiveType('Integer', 0));
      legacyCC.Integer = CCInteger;
      legacyCC.CCInteger = CCInteger;

      /**
       * @en
       * Indicates that the editor should treat this property or array element as a Float value.
       * @zh
       * 指定编辑器以浮点数形式对待该属性或数组元素。
       * @example
       * ```ts
       * import { CCFloat, _decorator } from "cc";
       *
       * // in the class definition:
       *
       * @_decorator.property({type: CCFloat})
       * x = 0;
       *
       * @_decorator.property({type: [CCFloat]})
       * array = [];
       * ```
       */
      _export("CCFloat", CCFloat = new PrimitiveType('Float', 0.0));
      legacyCC.Float = CCFloat;
      legacyCC.CCFloat = CCFloat;
      if (EDITOR) {
        get(legacyCC, 'Number', () => {
          warnID(3603);
          return CCFloat;
        });
      }

      /**
       * @en
       * Indicates that the editor should treat this property or array element as a Boolean value.
       * @zh
       * 指定编辑器以布尔值形式对待该属性或数组元素。
       *
       * @example
       * ```ts
       * import { CCBoolean, _decorator } from "cc";
       * // in the class definition
       * @_decorator.property({type: CCBoolean})
       * isTrue = false;
       *
       * @_decorator.property({type: [CCBoolean]})
       * array = [];
       * ```
       */
      _export("CCBoolean", CCBoolean = new PrimitiveType('Boolean', false));
      legacyCC.Boolean = CCBoolean;
      legacyCC.CCBoolean = CCBoolean;

      /**
       * @en
       * Indicates that the editor should treat this property or array element as a String value.
       * @zh
       * 指定编辑器以字符串形式对待该属性或数组元素。
       * @example
       * ```ts
       * import { CCString, _decorator } from "cc";
       *
       * // in the class definition
       *
       * @_decorator.property({type: CCString})
       * name = '';
       *
       * @_decorator.property({type: [CCString]})
       * array = [];
       * ```
       */
      _export("CCString", CCString = new PrimitiveType('String', ''));
      legacyCC.String = CCString;
      legacyCC.CCString = CCString;
    }
  };
});