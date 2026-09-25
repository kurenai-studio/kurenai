System.register("q-bundled:///fs/cocos/serialization/deserialize-dynamic.js", ["../../../virtual/internal%253Aconstants.js", "../core/index.js", "../misc/missing-script.js", "../../pal/system-info/enum-type/index.js", "./ccon.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, TEST, DEV, DEBUG, JSB, PREVIEW, SUPPORT_JIT, cclegacy, js, misc, CCClass, ENUM_TAG, BITMASK_TAG, sys, error, assertIsTrue, deserializeTag, errorID, MissingScript, Platform, CCON, DeserializerPool, _Deserializer, compileDeserialize, DELIMITER, POSTFIX_TYPE, POSTFIX_EDITOR_ONLY, POSTFIX_DEFAULT, POSTFIX_FORMERLY_SERIALIZED_AS;
  /*
   Copyright (c) 2013-2016 Chukong Technologies Inc.
   Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
  
   https://www.cocos.com
  
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

  function compileObjectTypeJit(sources, defaultValue, accessorToSet, propNameLiteralToSet, assumeHavePropIfIsValue) {
    if (defaultValue instanceof cclegacy.ValueType) {
      // fast case
      if (!assumeHavePropIfIsValue) {
        sources.push('if(prop){');
      }
      const ctorCode = js.getClassName(defaultValue);
      sources.push(`s._deserializeFastDefinedObject(o${accessorToSet},prop,${ctorCode});`);
      if (!assumeHavePropIfIsValue) {
        sources.push(`}else o${accessorToSet}=null;`);
      }
    } else {
      sources.push(`
if (prop) {
    s._deserializeAndAssignField(o, prop, ${propNameLiteralToSet});
} else {
    o${accessorToSet}=null;
}
`);
    }
  }
  function compileDeserializeJIT(self, klass) {
    const attrs = CCClass.Attr.getClassAttrs(klass);
    const props = klass.__values__;
    // self, obj, serializedData, klass
    const sources = ['var prop;'];
    const fastMode = canBeDeserializedInFastMode(klass);
    // sources.push('var vb,vn,vs,vo,vu,vf;');    // boolean, number, string, object, undefined, function

    for (let p = 0; p < props.length; p++) {
      const propName = props[p];
      if ((PREVIEW || (EDITOR || NODEJS) && self.ignoreEditorOnly) && attrs[propName + POSTFIX_EDITOR_ONLY]) {
        continue; // skip editor only if in preview
      }
      let accessorToSet;
      let propNameLiteralToSet;
      if (CCClass.IDENTIFIER_RE.test(propName)) {
        propNameLiteralToSet = `"${propName}"`;
        accessorToSet = `.${propName}`;
      } else {
        propNameLiteralToSet = CCClass.escapeForJS(propName);
        accessorToSet = `[${propNameLiteralToSet}]`;
      }
      let accessorToGet = accessorToSet;
      if (attrs[propName + POSTFIX_FORMERLY_SERIALIZED_AS]) {
        const propNameToRead = attrs[propName + POSTFIX_FORMERLY_SERIALIZED_AS];
        if (CCClass.IDENTIFIER_RE.test(propNameToRead)) {
          accessorToGet = `.${propNameToRead}`;
        } else {
          accessorToGet = `[${CCClass.escapeForJS(propNameToRead)}]`;
        }
      }
      sources.push(`prop=d${accessorToGet};`);
      sources.push(`if(typeof ${JSB ? '(prop)' : 'prop'}!=="undefined"){`);

      // function undefined object(null) string boolean number
      const defaultValue = CCClass.getDefault(attrs[propName + POSTFIX_DEFAULT]);
      const userType = attrs[propName + POSTFIX_TYPE];
      if (fastMode && (defaultValue !== undefined || userType)) {
        const isPrimitiveTypeInFastMode = isPrimitivePropertyByDefaultOrType(defaultValue, userType);
        if (isPrimitiveTypeInFastMode) {
          sources.push(`o${accessorToSet}=prop;`);
        } else {
          compileObjectTypeJit(sources, defaultValue, accessorToSet, propNameLiteralToSet, true);
        }
      } else {
        sources.push(`${`if(typeof ${JSB ? '(prop)' : 'prop'}!=="object"){` + 'o'}${accessorToSet}=prop;` + `}else{`);
        compileObjectTypeJit(sources, defaultValue, accessorToSet, propNameLiteralToSet, false);
        sources.push('}');
      }
      sources.push('}');
    }
    if (js.isChildClassOf(klass, cclegacy.Node) || js.isChildClassOf(klass, cclegacy.Component)) {
      if (PREVIEW || (EDITOR || NODEJS) && self.ignoreEditorOnly) {
        const mayUsedInPersistRoot = js.isChildClassOf(klass, cclegacy.Node);
        if (mayUsedInPersistRoot) {
          sources.push('d._id&&(o._id=d._id);');
        }
      } else {
        sources.push('d._id&&(o._id=d._id);');
      }
    }
    if (props[props.length - 1] === '_$erialized') {
      // deep copy original serialized data
      sources.push('o._$erialized=JSON.parse(JSON.stringify(d));');
      // parse the serialized data as primitive javascript object, so its __id__ will be dereferenced
      sources.push('s._fillPlainObject(o._$erialized,d);');
    }
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    return Function('s', 'o', 'd', 'k', sources.join(''));
  }
  function compileDeserializeNative(_self, klass) {
    const fastMode = canBeDeserializedInFastMode(klass);
    const shouldCopyId = js.isChildClassOf(klass, cclegacy.Node) || js.isChildClassOf(klass, cclegacy.Component);
    let shouldCopyRawData = false;
    const simpleProps = [];
    let simplePropsToRead = simpleProps;
    const advancedProps = [];
    let advancedPropsToRead = advancedProps;
    const advancedPropsValueType = [];
    (() => {
      const props = klass.__values__;
      shouldCopyRawData = props[props.length - 1] === '_$erialized';
      const attrs = CCClass.Attr.getClassAttrs(klass);
      for (let p = 0; p < props.length; p++) {
        const propName = props[p];
        let propNameToRead = propName;
        if (attrs[propName + POSTFIX_FORMERLY_SERIALIZED_AS]) {
          propNameToRead = attrs[propName + POSTFIX_FORMERLY_SERIALIZED_AS];
        }
        // function undefined object(null) string boolean number
        const defaultValue = CCClass.getDefault(attrs[propName + POSTFIX_DEFAULT]);
        const userType = attrs[propName + POSTFIX_TYPE];
        let isPrimitiveTypeInFastMode = false;
        if (fastMode && (defaultValue !== undefined || userType)) {
          isPrimitiveTypeInFastMode = isPrimitivePropertyByDefaultOrType(defaultValue, userType);
        }
        if (isPrimitiveTypeInFastMode) {
          if (propNameToRead !== propName && simplePropsToRead === simpleProps) {
            simplePropsToRead = simpleProps.slice();
          }
          simpleProps.push(propName);
          if (simplePropsToRead !== simpleProps) {
            simplePropsToRead.push(propNameToRead);
          }
        } else {
          if (propNameToRead !== propName && advancedPropsToRead === advancedProps) {
            advancedPropsToRead = advancedProps.slice();
          }
          advancedProps.push(propName);
          if (advancedPropsToRead !== advancedProps) {
            advancedPropsToRead.push(propNameToRead);
          }
          advancedPropsValueType.push(defaultValue instanceof cclegacy.ValueType && defaultValue.constructor);
        }
      }
    })();
    return (s, o, d, k) => {
      for (let i = 0; i < simpleProps.length; ++i) {
        const prop = d[simplePropsToRead[i]];
        if (prop !== undefined) {
          o[simpleProps[i]] = prop;
        }
      }
      for (let i = 0; i < advancedProps.length; ++i) {
        const propName = advancedProps[i];
        const prop = d[advancedPropsToRead[i]];
        if (prop === undefined) {
          continue;
        }
        if (!fastMode && typeof prop !== 'object') {
          o[propName] = prop;
        } else {
          // fastMode (so will not simpleProp) or object
          const valueTypeCtor = advancedPropsValueType[i];
          if (valueTypeCtor) {
            if (fastMode || prop) {
              s._deserializeFastDefinedObject(o[propName], prop, valueTypeCtor);
            } else {
              o[propName] = null;
            }
          } else if (prop) {
            s._deserializeAndAssignField(o, prop, propName);
          } else {
            o[propName] = null;
          }
        }
      }
      if (shouldCopyId && d._id) {
        o._id = d._id;
      }
      if (shouldCopyRawData) {
        // deep copy original serialized data
        o._$erialized = JSON.parse(JSON.stringify(d));
        // parse the serialized data as primitive javascript object, so its __id__ will be dereferenced
        s._fillPlainObject(o._$erialized, d);
      }
    };
  }

  /**
   * Tells if the class can be deserialized in "fast mode".
   * In fast mode, deserialization of the class will go into an optimized way:
   * each class property will be examined whether to be primitive according to their default value
   * and type. Finally, all primitive properties would be together deserialized using simple assignment,
   * without performing in-loop check.
   */
  function canBeDeserializedInFastMode(klass) {
    return misc.BUILTIN_CLASSID_RE.test(js.getClassId(klass));
  }
  function isPrimitivePropertyByDefaultOrType(defaultValue, userType) {
    if (defaultValue === undefined) {
      return userType instanceof CCClass.Attr.PrimitiveType || userType === ENUM_TAG || userType === BITMASK_TAG;
    } else {
      const defaultType = typeof defaultValue;
      return defaultType === 'string' || defaultType === 'number' || defaultType === 'boolean';
    }
  }
  function deserializeDynamic(data, details, options) {
    var _options$reportMissin;
    options = options || {};
    const classFinder = options.classFinder || js.getClassById;
    const createAssetRefs = options.createAssetRefs || sys.platform === Platform.EDITOR_CORE;
    const customEnv = options.customEnv;
    const ignoreEditorOnly = options.ignoreEditorOnly;
    const reportMissingClass = (_options$reportMissin = options.reportMissingClass) != null ? _options$reportMissin : cclegacy.deserialize.reportMissingClass;

    // var oldJson = JSON.stringify(data, null, 2);

    details.init();

    // TODO: this should be a HACK, we've changed the method signature
    // workaround: mark pool as type of any.
    // issue: https://github.com/cocos/cocos-engine/issues/14642
    const deserializer = _Deserializer.pool.get(details, classFinder, reportMissingClass, customEnv, ignoreEditorOnly);
    cclegacy.game._isCloning = true;
    const res = deserializer.deserialize(data);
    cclegacy.game._isCloning = false;
    _Deserializer.pool.put(deserializer);
    if (createAssetRefs) {
      details.assignAssetsBy((uuid, options) => EditorExtends.serialize.asAsset(uuid, options.type));
    }

    // var afterJson = JSON.stringify(data, null, 2);
    // if (oldJson !== afterJson) {
    //     throw new Error('JSON SHOULD not changed');
    // }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res;
  }
  function parseUuidDependenciesDynamic(serialized) {
    const depends = [];
    const parseDependRecursively = (data, out) => {
      if (!data || typeof data !== 'object' || typeof data.__id__ === 'number') {
        return;
      }
      const uuid = data.__uuid__;
      if (Array.isArray(data)) {
        for (let i = 0, l = data.length; i < l; i++) {
          parseDependRecursively(data[i], out);
        }
      } else if (uuid) {
        out.push(uuid);
      } else {
        for (const prop in data) {
          parseDependRecursively(data[prop], out);
        }
      }
    };
    parseDependRecursively(serialized, depends);
    return depends;
  }
  _export({
    deserializeDynamic: deserializeDynamic,
    parseUuidDependenciesDynamic: parseUuidDependenciesDynamic
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
      DEV = _virtualInternal253AconstantsJs.DEV;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      JSB = _virtualInternal253AconstantsJs.JSB;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      SUPPORT_JIT = _virtualInternal253AconstantsJs.SUPPORT_JIT;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      misc = _coreIndexJs.misc;
      CCClass = _coreIndexJs.CCClass;
      ENUM_TAG = _coreIndexJs.ENUM_TAG;
      BITMASK_TAG = _coreIndexJs.BITMASK_TAG;
      sys = _coreIndexJs.sys;
      error = _coreIndexJs.error;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      deserializeTag = _coreIndexJs.deserializeTag;
      errorID = _coreIndexJs.errorID;
    }, function (_miscMissingScriptJs) {
      MissingScript = _miscMissingScriptJs.MissingScript;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      Platform = _palSystemInfoEnumTypeIndexJs.Platform;
    }, function (_cconJs) {
      CCON = _cconJs.CCON;
    }],
    execute: function () {
      compileDeserialize = SUPPORT_JIT ? compileDeserializeJIT : compileDeserializeNative;
      DELIMITER = CCClass.Attr.DELIMETER;
      POSTFIX_TYPE = `${DELIMITER}type`;
      POSTFIX_EDITOR_ONLY = `${DELIMITER}editorOnly`;
      POSTFIX_DEFAULT = `${DELIMITER}default`;
      POSTFIX_FORMERLY_SERIALIZED_AS = `${DELIMITER}formerlySerializedAs`;
      DeserializerPool = class DeserializerPool extends js.Pool {
        constructor() {
          super(deserializer => {
            deserializer.clear();
          }, 1);
        }
      }; // TODO: this is should be a HACK, we've changed the method signature
      // issue: https://github.com/cocos/cocos-engine/issues/14642
      DeserializerPool.prototype.get = function (details, classFinder, reportMissingClass, customEnv, ignoreEditorOnly) {
        const cache = this._get();
        if (cache) {
          cache.reset(details, classFinder, reportMissingClass, customEnv, ignoreEditorOnly);
          return cache;
        } else {
          return new _Deserializer(details, classFinder, reportMissingClass, customEnv, ignoreEditorOnly);
        }
      };
      _Deserializer = class _Deserializer {
        /**
         * @engineInternal
         */
        get ignoreEditorOnly() {
          return this._ignoreEditorOnly;
        }
        constructor(result, classFinder, reportMissingClass, customEnv, ignoreEditorOnly) {
          this.deserializedList = [];
          this.deserializedData = null;
          this.result = result;
          this.customEnv = customEnv;
          this._classFinder = classFinder;
          this._reportMissingClass = reportMissingClass;
          this._onDereferenced = classFinder == null ? void 0 : classFinder.onDereferenced;
          if (DEV) {
            this._ignoreEditorOnly = ignoreEditorOnly;
          }
        }
        reset(result, classFinder, reportMissingClass, customEnv, ignoreEditorOnly) {
          this.result = result;
          this.customEnv = customEnv;
          this._classFinder = classFinder;
          this._reportMissingClass = reportMissingClass;
          this._onDereferenced = classFinder == null ? void 0 : classFinder.onDereferenced;
          if (DEV) {
            this._ignoreEditorOnly = ignoreEditorOnly;
          }
        }
        clear() {
          this.result = null;
          this.customEnv = null;
          this.deserializedList.length = 0;
          this.deserializedData = null;
          this._classFinder = null;
          this._reportMissingClass = null;
          this._onDereferenced = null;
        }
        deserialize(serializedData) {
          let fromCCON = false;
          let jsonObj;
          if (serializedData instanceof CCON) {
            fromCCON = true;
            jsonObj = serializedData.document;
            if (serializedData.chunks.length > 0) {
              assertIsTrue(serializedData.chunks.length === 1);
              this._mainBinChunk = serializedData.chunks[0];
            }
          } else {
            jsonObj = serializedData;
          }
          this._serializedData = jsonObj;
          this._context = {
            fromCCON
          };
          const serializedRootObject = Array.isArray(jsonObj) ? jsonObj[0] : jsonObj;
          if (EDITOR || NODEJS || TEST) {
            this.deserializedData = this._deserializeObject(serializedRootObject, 0, this.deserializedList, `${0}`);
          } else {
            this.deserializedData = this._deserializeObject(serializedRootObject, 0);
          }
          this._serializedData = undefined;
          this._mainBinChunk = undefined;
          this._context = undefined;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this.deserializedData;
        }

        /**
         * @param serialized - The object to deserialize, must be non-nil.
         * @param globalIndex - If the object is deserialized from "root objects" array.
         * @param owner - Tracing purpose.
         * @param propName - Tracing purpose.
         */
        _deserializeObject(serialized, globalIndex, owner, propName) {
          switch (serialized.__type__) {
            case 'TypedArray':
              return this._deserializeTypedArrayView(serialized);
            case 'TypedArrayRef':
              return this._deserializeTypedArrayViewRef(serialized);
            default:
              // NOTE: when 'strictNullCheck' is false, TS can't infer serialized as SerializedGeneralTypedObject
              if (serialized.__type__) {
                // Typed object (including CCClass)
                return this._deserializeTypeTaggedObject(serialized, globalIndex, owner, propName);
              } else if (!Array.isArray(serialized)) {
                // Embedded primitive javascript object
                return this._deserializePlainObject(serialized);
              } else {
                // Array
                return this._deserializeArray(serialized);
              }
          }
        }
        _deserializeTypedArrayView(value) {
          return globalThis[value.ctor].from(value.array);
        }
        _deserializeTypedArrayViewRef(value) {
          const {
            offset,
            length,
            ctor: constructorName
          } = value;
          const obj = new globalThis[constructorName](this._mainBinChunk.buffer, this._mainBinChunk.byteOffset + offset, length);
          return obj;
        }
        _deserializeArray(value) {
          const obj = new Array(value.length);
          let prop;
          for (let i = 0; i < value.length; i++) {
            prop = value[i];
            if (typeof prop === 'object' && prop) {
              const isAssetType = this._deserializeAndAssignField(obj, prop, `${i}`);
              if (isAssetType) {
                // fill default value for primitive objects (no constructor)
                obj[i] = null;
              }
            } else {
              obj[i] = prop;
            }
          }
          return obj;
        }
        _deserializePlainObject(value) {
          const obj = {};
          this._fillPlainObject(obj, value);
          return obj;
        }
        _deserializeTypeTaggedObject(value, globalIndex, owner, propName) {
          const type = value.__type__;
          const klass = this._classFinder(type, value, owner, propName);
          if (!klass) {
            const notReported = this._classFinder === js.getClassById;
            if (notReported) {
              this._reportMissingClass(type);
            }
            return null;
          }
          const createObject = constructor => {
            // eslint-disable-next-line new-cap
            const obj = new constructor();
            if (globalIndex >= 0) {
              this.deserializedList[globalIndex] = obj;
            }
            return obj;
          };
          if (!((EDITOR || NODEJS) && js.isChildClassOf(klass, cclegacy.Component))) {
            const obj = createObject(klass);
            this._deserializeInto(value, obj, klass);
            return obj;
          } else {
            try {
              const obj = createObject(klass);
              this._deserializeInto(value, obj, klass);
              return obj;
            } catch (e) {
              if (DEBUG) {
                error(`Deserialize ${klass.name} failed, ${e.stack}`);
              }
              const obj = createObject(MissingScript);
              this._deserializeInto(value, obj, MissingScript);
              return obj;
            }
          }
        }
        _deserializeInto(value, object, constructor, skipCustomized = false) {
          if (!skipCustomized && object[deserializeTag]) {
            this._runCustomizedDeserialize(value, object, constructor);
            return;
          }
          if (object._deserialize) {
            // TODO: content check?
            object._deserialize(value.content, this);
            return;
          }
          if (cclegacy.Class._isCCClass(constructor)) {
            this._deserializeFireClass(object, value, constructor);
          } else {
            this._deserializeFastDefinedObject(object, value, constructor);
          }
        }
        _runCustomizedDeserialize(value, object, constructor) {
          const serializationInput = {
            readProperty: name => {
              const serializedField = value[name];
              if (typeof serializedField !== 'object' || !serializedField) {
                return serializedField;
              } else {
                return this._deserializeObjectField(serializedField);
              }
            },
            readThis: () => {
              this._deserializeInto(value, object, constructor, true);
            },
            readSuper: () => {
              const superConstructor = js.getSuper(constructor);
              if (superConstructor) {
                this._deserializeInto(value, object, superConstructor);
              }
            }
          };
          object[deserializeTag](serializationInput, this._context);
        }
        _deserializeFireClass(obj, serialized, klass) {
          let deserialize;
          // eslint-disable-next-line no-prototype-builtins
          if (klass.hasOwnProperty('__deserialize__')) {
            deserialize = klass.__deserialize__;
          } else {
            deserialize = compileDeserialize(this, klass);

            // DEBUG: Check MissingScript data for issue 9878
            try {
              if (klass === MissingScript) {
                const props = klass.__values__;
                if (props.length === 0 || props[props.length - 1] !== '_$erialized') {
                  errorID(16341);
                  errorID(16342, props.join(', '));
                  // props.push('_$erialized');
                }
                const rawDeserialize = deserialize;
                deserialize = function (deserializer, object, deserialized, constructor) {
                  rawDeserialize(deserializer, object, deserialized, constructor);
                  if (!object._$erialized) {
                    errorID(16343, JSON.stringify(deserialized));
                  }
                };
              }
            } catch (e) {
              errorID(16344, `${e}`);
            }
            js.value(klass, '__deserialize__', deserialize, true);
          }
          deserialize(this, obj, serialized, klass);
        }

        /**
         * @engineInternal
         */
        _deserializeAndAssignField(obj, serializedField, propName) {
          const id = serializedField.__id__;
          if (typeof id === 'number') {
            const field = this.deserializedList[id];
            if (field) {
              obj[propName] = field;
            } else {
              var _this$_onDereferenced;
              // TODO: assertion
              const source = this._serializedData[id];
              if (EDITOR || NODEJS || TEST) {
                obj[propName] = this._deserializeObject(source, id, obj, propName);
              } else {
                obj[propName] = this._deserializeObject(source, id, undefined, propName);
              }
              (_this$_onDereferenced = this._onDereferenced) == null || _this$_onDereferenced.call(this, this.deserializedList, id, obj, propName);
            }
          } else {
            const uuid = serializedField.__uuid__;
            if (uuid) {
              const expectedType = serializedField.__expectedType__;
              this.result.push(obj, propName, uuid, expectedType);
            } else if (EDITOR || NODEJS || TEST) {
              obj[propName] = this._deserializeObject(serializedField, -1, obj, propName);
            } else {
              obj[propName] = this._deserializeObject(serializedField, -1);
            }
          }
          return false;
        }
        _deserializeObjectField(serializedField) {
          const id = serializedField.__id__;
          if (typeof id === 'number') {
            const field = this.deserializedList[id];
            if (field) {
              return field;
            } else {
              // TODO: assertion
              const source = this._serializedData[id];
              const field = this._deserializeObject(source, id, undefined, undefined);
              return field;
            }
          } else {
            const uuid = serializedField.__uuid__;
            if (uuid) {
              const _expectedType = serializedField.__expectedType__;
              throw new Error(`Asset reference field serialization is currently not supported in custom serialization.`);
            } else {
              return this._deserializeObject(serializedField, -1);
            }
          }
        }

        /**
         * @engineInternal
         */
        _fillPlainObject(instance, serialized) {
          for (const propName in serialized) {
            // eslint-disable-next-line no-prototype-builtins
            if (!serialized.hasOwnProperty(propName)) {
              continue;
            }
            const prop = serialized[propName];
            if (typeof prop !== 'object') {
              if (propName !== '__type__' /* && k != '__id__' */) {
                instance[propName] = prop;
              }
            } else if (prop) {
              const isAssetType = this._deserializeAndAssignField(instance, prop, propName);
              if (isAssetType) {
                // fill default value for primitive objects (no constructor)
                instance[propName] = null;
              }
            } else {
              instance[propName] = null;
            }
          }
        }

        /**
         * @engineInternal
         */
        _deserializeFastDefinedObject(instance, serialized, klass) {
          if (klass === cclegacy.Vec2) {
            instance.x = serialized.x || 0;
            instance.y = serialized.y || 0;
            return;
          } else if (klass === cclegacy.Vec3) {
            instance.x = serialized.x || 0;
            instance.y = serialized.y || 0;
            instance.z = serialized.z || 0;
            return;
          } else if (klass === cclegacy.Color) {
            instance.r = serialized.r || 0;
            instance.g = serialized.g || 0;
            instance.b = serialized.b || 0;
            const a = serialized.a;
            instance.a = a === undefined ? 255 : a;
            return;
          } else if (klass === cclegacy.Size) {
            instance.width = serialized.width || 0;
            instance.height = serialized.height || 0;
            return;
          }
          const attrs = CCClass.Attr.getClassAttrs(klass);
          // TODO: `__values__` is injected property
          // issue: https://github.com/cocos/cocos-engine/issues/14642
          const props = klass.__values__;
          if (DEBUG && !props) {
            error(`Unable to deserialize ${js.getClassName(klass)}. ` + 'For non-CCClass types, they can only be marked as serializable by `CCClass.fastDefine`.');
          }
          for (let i = 0; i < props.length; i++) {
            const propName = props[i];
            let value = serialized[propName];
            // eslint-disable-next-line no-prototype-builtins
            const exists = value !== undefined || serialized.hasOwnProperty(propName);
            if (!exists) {
              // not serialized,
              // recover to default value in ValueType, because eliminated properties equals to
              // its default value in ValueType, not default value in user class
              value = CCClass.getDefault(attrs[propName + POSTFIX_DEFAULT]);
            }
            if (typeof value !== 'object') {
              instance[propName] = value;
            } else if (value) {
              this._deserializeAndAssignField(instance, value, propName);
            } else {
              instance[propName] = null;
            }
          }
        }
      };
      _Deserializer.pool = new DeserializerPool();
    }
  };
});