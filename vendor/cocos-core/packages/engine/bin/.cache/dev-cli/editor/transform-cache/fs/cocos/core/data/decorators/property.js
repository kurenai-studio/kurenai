System.register("q-bundled:///fs/cocos/core/data/decorators/property.js", ["../../../../../virtual/internal%253Aconstants.js", "./utils.js", "../../platform/debug.js", "../utils/preprocess-class.js", "../class-stash.js", "../../utils/js-typed.js"], function (_export, _context) {
  "use strict";

  var DEV, EDITOR, TEST, getSubDict, getClassCache, warnID, errorID, getFullFormOfProperty, PropertyStashInternalFlag, getClassName, mixin;
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

  // eslint-disable-next-line @typescript-eslint/ban-types

  /**
   * @zh CCClass 属性选项。
   * @en CCClass property options
   */

  /**
   * @en Declare as a CCClass property with options
   * @zh 声明属性为 CCClass 属性。
   * @param options property options
   */

  /**
   * @en Declare as a CCClass property with the property type
   * @zh 标注属性为 cc 属性。<br/>
   * 等价于`@property({type})`。
   * @param type A [[ccclass]] type or a [[ValueType]]
   */

  /**
   * @en Declare as a CCClass property
   * @zh 标注属性为 cc 属性。<br/>
   * 等价于`@property()`。
   */

  function property(target, propertyKey, descriptorOrInitializer) {
    let options = null;
    function normalized(target, propertyKey, descriptorOrInitializer) {
      const classStash = getOrCreateClassStash(target);
      const propertyStash = getOrCreateEmptyPropertyStash(target, propertyKey);
      const classConstructor = target.constructor;
      mergePropertyOptions(classStash, propertyStash, classConstructor, propertyKey, options, descriptorOrInitializer);
    }
    if (target === undefined) {
      // @property() => LegacyPropertyDecorator
      return property({
        type: undefined
      });
    } else if (typeof propertyKey === 'undefined') {
      // @property(options) => LegacyPropertyDescriptor
      // @property(type) => LegacyPropertyDescriptor
      options = target;
      return normalized;
    } else {
      // @property
      normalized(target, propertyKey, descriptorOrInitializer);
      return undefined;
    }
  }
  function getDefaultFromInitializer(initializer) {
    let value;
    try {
      value = initializer();
    } catch (e) {
      // just lazy initialize by CCClass
      return initializer;
    }
    if (typeof value !== 'object' || value === null) {
      // string boolean number function undefined null
      return value;
    } else {
      // The default attribute will not be used in the ES6 constructor actually,
      // so we don't need to simplify into `{}` or `[]` or vec2 completely.
      return initializer;
    }
  }
  function extractActualDefaultValues(classConstructor) {
    let dummyObj;
    try {
      // eslint-disable-next-line new-cap
      dummyObj = new classConstructor();
    } catch (e) {
      if (DEV) {
        // NOTE: here we use unknown e as a string, or sometheing supports toString() method.
        warnID(3652, getClassName(classConstructor), e);
      }
      return {};
    }
    return dummyObj;
  }
  function getOrCreateClassStash(target) {
    const cache = getClassCache(target.constructor);
    return cache;
  }
  function getOrCreateEmptyPropertyStash(target, propertyKey) {
    var _ref, _properties$_ref;
    const classStash = getClassCache(target.constructor);
    const ccclassProto = getSubDict(classStash, 'proto');
    const properties = getSubDict(ccclassProto, 'properties');
    const propertyStash = (_properties$_ref = properties[_ref = propertyKey]) != null ? _properties$_ref : properties[_ref] = {};
    return propertyStash;
  }
  function getOrCreatePropertyStash(target, propertyKey, descriptorOrInitializer) {
    var _ref2, _properties$_ref2;
    const classStash = getClassCache(target.constructor);
    const ccclassProto = getSubDict(classStash, 'proto');
    const properties = getSubDict(ccclassProto, 'properties');
    const propertyStash = (_properties$_ref2 = properties[_ref2 = propertyKey]) != null ? _properties$_ref2 : properties[_ref2] = {};
    propertyStash.__internalFlags |= PropertyStashInternalFlag.STANDALONE;
    if (descriptorOrInitializer && typeof descriptorOrInitializer !== 'function' && (descriptorOrInitializer.get || descriptorOrInitializer.set)) {
      if (descriptorOrInitializer.get) {
        propertyStash.get = descriptorOrInitializer.get;
      }
      if (descriptorOrInitializer.set) {
        propertyStash.set = descriptorOrInitializer.set;
      }
    } else {
      setDefaultValue(classStash, propertyStash, target.constructor, propertyKey, descriptorOrInitializer);
    }
    return propertyStash;
  }
  function mergePropertyOptions(cache, propertyStash, ctor, propertyKey, options, descriptorOrInitializer) {
    let fullOptions;
    const isGetset = descriptorOrInitializer && typeof descriptorOrInitializer !== 'function' && (descriptorOrInitializer.get || descriptorOrInitializer.set);
    if (options) {
      fullOptions = getFullFormOfProperty(options, isGetset);
    }
    const propertyRecord = mixin(propertyStash, fullOptions || options || {});
    if (isGetset) {
      // typescript or babel
      if (DEV && options && ((fullOptions || options).get || (fullOptions || options).set)) {
        const errorProps = getSubDict(cache, 'errorProps');
        if (!errorProps[propertyKey]) {
          errorProps[propertyKey] = true;
          warnID(3655, propertyKey, getClassName(ctor), propertyKey, propertyKey);
        }
      }
      if (descriptorOrInitializer.get) {
        propertyRecord.get = descriptorOrInitializer.get;
      }
      if (descriptorOrInitializer.set) {
        propertyRecord.set = descriptorOrInitializer.set;
      }
    } else {
      // Target property is non-accessor
      if (DEV && (propertyRecord.get || propertyRecord.set)) {
        // Specify "accessor options" for non-accessor property is forbidden.
        errorID(3655, propertyKey, getClassName(ctor), propertyKey, propertyKey);
        return;
      }
      setDefaultValue(cache, propertyRecord, ctor, propertyKey, descriptorOrInitializer);
      if (EDITOR && !window.Build || TEST) {
        // eslint-disable-next-line no-prototype-builtins
        if (!fullOptions && options && options.hasOwnProperty('default')) {
          warnID(3653, propertyKey, getClassName(ctor));
        }
      }
    }
  }
  function setDefaultValue(classStash, propertyStash, classConstructor, propertyKey, descriptorOrInitializer) {
    if (descriptorOrInitializer !== undefined) {
      if (typeof descriptorOrInitializer === 'function') {
        propertyStash.default = getDefaultFromInitializer(descriptorOrInitializer);
      } else if (descriptorOrInitializer === null) {
        // For some decorated properties we haven't specified the default value, then the initializer should be null.
        // We fall back to the behavior of v3.6.3, where we don't specify the default value automatically.
        // propertyStash.default = undefined;
      } else if (descriptorOrInitializer.initializer) {
        // In the case of Babel, if an initializer is given for a class field.
        // That initializer is passed to `descriptor.initializer`.
        propertyStash.default = getDefaultFromInitializer(descriptorOrInitializer.initializer);
      }
    } else {
      // In the case of TypeScript, we can not directly capture the initializer.
      // We have to be hacking to extract the value.
      // We should fall back to the TypeScript case only when `descriptorOrInitializer` is undefined.
      const actualDefaultValues = classStash.default || (classStash.default = extractActualDefaultValues(classConstructor));
      // eslint-disable-next-line no-prototype-builtins
      if (actualDefaultValues.hasOwnProperty(propertyKey)) {
        propertyStash.default = actualDefaultValues[propertyKey];
      }
    }
  }
  _export({
    property: property,
    getOrCreatePropertyStash: getOrCreatePropertyStash
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEV = _virtualInternal253AconstantsJs.DEV;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_utilsJs) {
      getSubDict = _utilsJs.getSubDict;
      getClassCache = _utilsJs.getClassCache;
    }, function (_platformDebugJs) {
      warnID = _platformDebugJs.warnID;
      errorID = _platformDebugJs.errorID;
    }, function (_utilsPreprocessClassJs) {
      getFullFormOfProperty = _utilsPreprocessClassJs.getFullFormOfProperty;
    }, function (_classStashJs) {
      PropertyStashInternalFlag = _classStashJs.PropertyStashInternalFlag;
    }, function (_utilsJsTypedJs) {
      getClassName = _utilsJsTypedJs.getClassName;
      mixin = _utilsJsTypedJs.mixin;
    }],
    execute: function () {}
  };
});