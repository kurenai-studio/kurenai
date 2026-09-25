System.register("q-bundled:///fs/cocos/serialization/deserialize.js", ["../../../virtual/internal%253Aconstants.js", "../core/index.js", "./deserialize-dynamic.js", "../asset/assets/asset.js", "./report-missing-class.js", "./compiled/builtin-value-type.js"], function (_export, _context) {
  "use strict";

  var EDITOR, TEST, PREVIEW, DEBUG, NODEJS, DEV, cclegacy, errorID, getError, js, assertIsTrue, deserializeDynamic, parseUuidDependenciesDynamic, Asset, defaultReportMissingClass, deserializeBuiltinValueType, deserializeBuiltinValueTypeInto, Details, FileInfo, _Details, FORCE_COMPILED, SUPPORT_MIN_FORMAT_VERSION, EMPTY_PLACEHOLDER, DataTypeID, CLASS_TYPE, CLASS_KEYS, CLASS_PROP_TYPE_OFFSET, MASK_CLASS, OBJ_DATA_MASK, CUSTOM_OBJ_DATA_CLASS, CUSTOM_OBJ_DATA_CONTENT, DICT_JSON_LAYOUT, ARRAY_ITEM_VALUES, Refs, File, PACKED_SECTIONS, ASSIGNMENTS;
  //

  // Parse Functions
  function dereference(refs, instances, strings) {
    const dataLength = refs.length - 1;
    let i = 0;
    // owner is object
    const instanceOffset = refs[dataLength] * Refs.EACH_RECORD_LENGTH;
    for (; i < instanceOffset; i += Refs.EACH_RECORD_LENGTH) {
      const owner = refs[i];
      const target = instances[refs[i + Refs.TARGET_OFFSET]];
      const keyIndex = refs[i + Refs.KEY_OFFSET];
      if (keyIndex >= 0) {
        owner[strings[keyIndex]] = target;
      } else {
        owner[~keyIndex] = target;
      }
    }
    // owner is instance index
    for (; i < dataLength; i += Refs.EACH_RECORD_LENGTH) {
      const owner = instances[refs[i]];
      const target = instances[refs[i + Refs.TARGET_OFFSET]];
      const keyIndex = refs[i + Refs.KEY_OFFSET];
      if (keyIndex >= 0) {
        owner[strings[keyIndex]] = target;
      } else {
        owner[~keyIndex] = target;
      }
    }
  }
  function deserializeCCObject(data, objectData) {
    const mask = data[File.SharedMasks][objectData[OBJ_DATA_MASK]];
    const clazz = mask[MASK_CLASS];
    const ctor = clazz[CLASS_TYPE];
    // if (!ctor) {
    //     return null;
    // }

    // eslint-disable-next-line new-cap
    const obj = new ctor();
    const keys = clazz[CLASS_KEYS];
    const classTypeOffset = clazz[CLASS_PROP_TYPE_OFFSET];
    const maskTypeOffset = mask[mask.length - 1];

    // parse simple type
    let i = MASK_CLASS + 1;
    for (; i < maskTypeOffset; ++i) {
      const key = keys[mask[i]];
      obj[key] = objectData[i];
    }

    // parse advanced type
    for (; i < objectData.length; ++i) {
      const key = keys[mask[i]];
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const type = clazz[mask[i] + classTypeOffset];
      const op = ASSIGNMENTS[type];
      op(data, obj, key, objectData[i]);
    }
    return obj;
  }
  function deserializeCustomCCObject(data, ctor, value) {
    // eslint-disable-next-line new-cap
    const obj = new ctor();
    if (obj._deserialize) {
      obj._deserialize(value, data[File.Context]);
    } else {
      errorID(5303, js.getClassName(ctor));
    }
    return obj;
  }
  function assignSimple(data, owner, key, value) {
    owner[key] = value;
  }
  function assignInstanceRef(data, owner, key, value) {
    if (value >= 0) {
      owner[key] = data[File.Instances][value];
    } else {
      data[File.Refs][~value * Refs.EACH_RECORD_LENGTH] = owner;
    }
  }
  function genArrayParser(parser) {
    return (data, owner, key, value) => {
      for (let i = 0; i < value.length; ++i) {
        parser(data, value, i, value[i]);
      }
      owner[key] = value;
    };
  }
  function parseAssetRefByInnerObj(data, owner, key, value) {
    owner[key] = null;
    data[File.DependObjs][value] = owner;
  }
  function parseClass(data, owner, key, value) {
    owner[key] = deserializeCCObject(data, value);
  }
  function parseCustomClass(data, owner, key, value) {
    const ctor = data[File.SharedClasses][value[CUSTOM_OBJ_DATA_CLASS]];
    owner[key] = deserializeCustomCCObject(data, ctor, value[CUSTOM_OBJ_DATA_CONTENT]);
  }
  function parseTRS(data, owner, key, value) {
    const typedArray = owner[key];
    typedArray.set(value);
  }
  function parseDict(data, owner, key, value) {
    const dict = value[DICT_JSON_LAYOUT];
    owner[key] = dict;
    for (let i = DICT_JSON_LAYOUT + 1; i < value.length; i += 3) {
      const subKey = value[i];
      const subType = value[i + 1];
      const subValue = value[i + 2];
      const op = ASSIGNMENTS[subType];
      op(data, dict, subKey, subValue);
    }
  }
  function parseArray(data, owner, key, value) {
    const array = value[ARRAY_ITEM_VALUES];
    for (let i = 0; i < array.length; ++i) {
      const subValue = array[i];
      const type = value[i + 1];
      if (type !== DataTypeID.SimpleType) {
        const op = ASSIGNMENTS[type];
        op(data, array, i, subValue);
      }
    }
    owner[key] = array;
  }
  function parseInstances(data) {
    const instances = data[File.Instances];
    const instanceTypes = data[File.InstanceTypes];
    const instanceTypesLen = instanceTypes === EMPTY_PLACEHOLDER ? 0 : instanceTypes.length;
    let rootIndex = instances[instances.length - 1];
    let normalObjectCount = instances.length - instanceTypesLen;
    if (typeof rootIndex !== 'number') {
      rootIndex = 0;
    } else {
      if (rootIndex < 0) {
        rootIndex = ~rootIndex;
      }
      --normalObjectCount;
    }

    // DataTypeID.Class

    let insIndex = 0;
    for (; insIndex < normalObjectCount; ++insIndex) {
      instances[insIndex] = deserializeCCObject(data, instances[insIndex]);
    }
    const classes = data[File.SharedClasses];
    for (let typeIndex = 0; typeIndex < instanceTypesLen; ++typeIndex, ++insIndex) {
      let type = instanceTypes[typeIndex];
      const eachData = instances[insIndex];
      if (type >= 0) {
        // class index for DataTypeID.CustomizedClass

        const ctor = classes[type]; // class
        instances[insIndex] = deserializeCustomCCObject(data, ctor, eachData);
      } else {
        // Other

        type = ~type;
        const op = ASSIGNMENTS[type];
        op(data, instances, insIndex, eachData);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return rootIndex;
  }

  // const DESERIALIZE_AS = Attr.DELIMETER + 'deserializeAs';
  // function deserializeAs(klass: AnyCCClass, klassLayout: IClass) {
  //     var attrs = Attr.getClassAttrs(klass);
  //     let keys = klassLayout[CLASS_KEYS];
  //     for (let i = 0; i < keys.length; ++i) {
  //         let newKey = attrs[keys[i] + DESERIALIZE_AS];
  //         if (newKey) {
  //             // @ts-expect-error
  //             if (keys.includes(newKey)) {
  //                 // %s cannot be deserialized by property %s because %s was also present in the serialized data.
  //                 warnID(, newKey, keys[i], newKey);
  //             }
  //             else {
  //                 keys[i] = newKey;
  //             }
  //         }
  //     }
  // }

  /**
   * @en Deserializes a previously serialized object to reconstruct it to the original.
   * @zh 将序列化后的对象进行反序列化以使其复原。
   *
   * @param data Serialized data.
   * @param details - Additional loading result.
   * @param options Deserialization Options.
   * @return The original object.
   */
  function getMissingClass(hasCustomFinder, type, reportMissingClass) {
    if (!hasCustomFinder) {
      reportMissingClass(type);
    }
    return Object;
  }
  function doLookupClass(classFinder, type, container, index, silent, hasCustomFinder, reportMissingClass) {
    let klass = classFinder(type);
    if (!klass) {
      // if (klass.__FSA__) {
      //     deserializeAs(klass, klassLayout as IClass);
      // }
      if (silent) {
        // generate a lazy proxy for ctor
        container[index] = ((c, i, t) => function proxy() {
          const actualClass = classFinder(t) || getMissingClass(hasCustomFinder, t, reportMissingClass);
          c[i] = actualClass;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, new-cap
          return new actualClass();
        })(container, index, type);
        return;
      } else {
        klass = getMissingClass(hasCustomFinder, type, reportMissingClass);
      }
    }
    container[index] = klass;
  }
  function lookupClasses(data, silent, customFinder, reportMissingClass) {
    const classFinder = customFinder || js.getClassById;
    const classes = data[File.SharedClasses];
    for (let i = 0; i < classes.length; ++i) {
      const klassLayout = classes[i];
      if (typeof klassLayout !== 'string') {
        if (DEBUG) {
          if (typeof klassLayout[CLASS_TYPE] === 'function') {
            throw new Error('Can not deserialize the same JSON data again.');
          }
        }
        const type = klassLayout[CLASS_TYPE];
        doLookupClass(classFinder, type, klassLayout, CLASS_TYPE, silent, customFinder, reportMissingClass);
      } else {
        doLookupClass(classFinder, klassLayout, classes, i, silent, customFinder, reportMissingClass);
      }
    }
  }
  function cacheMasks(data) {
    const masks = data[File.SharedMasks];
    if (masks) {
      const classes = data[File.SharedClasses];
      for (let i = 0; i < masks.length; ++i) {
        const mask = masks[i];
        mask[MASK_CLASS] = classes[mask[MASK_CLASS]];
      }
    }
  }
  function parseResult(data) {
    const instances = data[File.Instances];
    const sharedStrings = data[File.SharedStrings];
    const dependSharedUuids = data[File.SharedUuids];
    const dependObjs = data[File.DependObjs];
    const dependKeys = data[File.DependKeys];
    const dependUuids = data[File.DependUuidIndices];
    for (let i = 0; i < dependObjs.length; ++i) {
      const obj = dependObjs[i];
      if (typeof obj === 'number') {
        dependObjs[i] = instances[obj];
      } else {
        // assigned by DataTypeID.AssetRefByInnerObj or added by Details object directly in _deserialize
      }
      let key = dependKeys[i];
      if (typeof key === 'number') {
        if (key >= 0) {
          key = sharedStrings[key];
        } else {
          key = ~key;
        }
        dependKeys[i] = key;
      } else {
        // added by Details object directly in _deserialize
      }
      const uuid = dependUuids[i];
      if (typeof uuid === 'number') {
        dependUuids[i] = dependSharedUuids[uuid];
      } else {
        // added by Details object directly in _deserialize
      }
    }
  }
  function isCompiledJson(json) {
    if (Array.isArray(json)) {
      const version = json[0];
      // array[0] will not be a number in the editor version
      return typeof version === 'number' || version instanceof FileInfo;
    } else {
      return false;
    }
  }
  function initializeDeserializationContext(data, details, options) {
    details.init(data);
    options != null ? options : options = {};
    let version = data[File.Version];
    let preprocessed = false;
    if (typeof version === 'object') {
      preprocessed = version.preprocessed;
      version = version.version;
    }
    if (version < SUPPORT_MIN_FORMAT_VERSION) {
      throw new Error(getError(5304, version));
    }
    const context = options;
    context._version = version;
    context.result = details;
    data[File.Context] = context;
    if (!preprocessed) {
      var _options$reportMissin;
      lookupClasses(data, false, options.classFinder, (_options$reportMissin = options.reportMissingClass) != null ? _options$reportMissin : deserialize.reportMissingClass);
      cacheMasks(data);
    }
  }
  function deserialize(data, details, options) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    let isBorrowedDetails = false;
    if (!details) {
      const borrowedDetails = Details.pool.get();
      assertIsTrue(borrowedDetails, `Can not allocate deserialization details`);
      details = borrowedDetails;
      isBorrowedDetails = true;
    }
    let res;
    if (!FORCE_COMPILED && !isCompiledJson(data)) {
      res = deserializeDynamic(data, details, options);
    } else {
      initializeDeserializationContext(data, details, options);
      const runtimeData = data;
      cclegacy.game._isCloning = true;
      const instances = runtimeData[File.Instances];
      const rootIndex = parseInstances(runtimeData);
      cclegacy.game._isCloning = false;
      if (runtimeData[File.Refs]) {
        dereference(runtimeData[File.Refs], instances, runtimeData[File.SharedStrings]);
      }
      parseResult(runtimeData);
      res = instances[rootIndex];
    }
    if (isBorrowedDetails) {
      Details.pool.put(details);
    }
    return res;
  }
  function unpackJSONs(data, classFinder, reportMissingClass) {
    if (data[File.Version] < SUPPORT_MIN_FORMAT_VERSION) {
      throw new Error(getError(5304, data[File.Version]));
    }
    lookupClasses(data, true, classFinder, reportMissingClass != null ? reportMissingClass : deserialize.reportMissingClass);
    cacheMasks(data);
    const version = new FileInfo(data[File.Version]);
    const sharedUuids = data[File.SharedUuids];
    const sharedStrings = data[File.SharedStrings];
    const sharedClasses = data[File.SharedClasses];
    const sharedMasks = data[File.SharedMasks];
    const sections = data[PACKED_SECTIONS];
    for (let i = 0; i < sections.length; ++i) {
      const section = sections[i];
      section.unshift(version, sharedUuids, sharedStrings, sharedClasses, sharedMasks);
    }
    return sections;
  }
  function packCustomObjData(type, data, hasNativeDep) {
    return [SUPPORT_MIN_FORMAT_VERSION, EMPTY_PLACEHOLDER, EMPTY_PLACEHOLDER, [type], EMPTY_PLACEHOLDER, hasNativeDep ? [data, ~0] : [data], [0], EMPTY_PLACEHOLDER, [], [], []];
  }
  function hasNativeDep(data) {
    const instances = data[File.Instances];
    const rootInfo = instances[instances.length - 1];
    if (typeof rootInfo !== 'number') {
      return false;
    } else {
      return rootInfo < 0;
    }
  }
  function getDependUuidList(json) {
    const sharedUuids = json[File.SharedUuids];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return json[File.DependUuidIndices].map(index => sharedUuids[index]);
  }
  function parseUuidDependencies(serialized) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    if (!DEV || isCompiledJson(serialized)) {
      return getDependUuidList(serialized);
    } else {
      return parseUuidDependenciesDynamic(serialized);
    }
  }
  _export({
    Details: void 0,
    dereference: dereference,
    isCompiledJson: isCompiledJson,
    deserialize: deserialize,
    unpackJSONs: unpackJSONs,
    packCustomObjData: packCustomObjData,
    hasNativeDep: hasNativeDep,
    parseUuidDependencies: parseUuidDependencies
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      TEST = _virtualInternal253AconstantsJs.TEST;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      DEV = _virtualInternal253AconstantsJs.DEV;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      errorID = _coreIndexJs.errorID;
      getError = _coreIndexJs.getError;
      js = _coreIndexJs.js;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_deserializeDynamicJs) {
      deserializeDynamic = _deserializeDynamicJs.deserializeDynamic;
      parseUuidDependenciesDynamic = _deserializeDynamicJs.parseUuidDependenciesDynamic;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_reportMissingClassJs) {
      defaultReportMissingClass = _reportMissingClassJs.reportMissingClass;
    }, function (_compiledBuiltinValueTypeJs) {
      deserializeBuiltinValueType = _compiledBuiltinValueTypeJs.deserializeBuiltinValueType;
      deserializeBuiltinValueTypeInto = _compiledBuiltinValueTypeJs.deserializeBuiltinValueTypeInto;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      FORCE_COMPILED = false; // TODO: BUILD;
      /** **************************************************************************
       * BUILT-IN TYPES / CONSTAINTS
       *************************************************************************** */
      SUPPORT_MIN_FORMAT_VERSION = 1;
      EMPTY_PLACEHOLDER = 0;
      /** **************************************************************************
       * TYPE DECLARATIONS
       *************************************************************************** */
      // Includes Bitwise NOT value.
      // Both T and U have non-negative integer ranges.
      // When the value >= 0 represents T
      // When the value is < 0, it represents ~U. Use ~x to extract the value of U.
      // Combines a boolean and a number into one value.
      // The number must >= 0.
      // When the value >= 0, the boolean is true, the number is value.
      // When the value < 0, the boolean is false, the number is ~value.
      // Indicates whether the asset depends on a native asset
      // When the value >= 0 represents the string index
      // When the value is < 0, it just represents non-negative integer. Use ~x to extract the value.
      // A reverse index used to assign current parsing object to target command buffer so it could be assembled later.
      // Should >= REF.OBJ_OFFSET
      // Used to index the current object
      // shared with the editor
      DataTypeID = {
        SimpleType: 0,
        InstanceRef: 1,
        Array_InstanceRef: 2,
        Array_AssetRefByInnerObj: 3,
        Class: 4,
        ValueTypeCreated: 5,
        AssetRefByInnerObj: 6,
        TRS: 7,
        ValueType: 8,
        Array_Class: 9,
        CustomizedClass: 10,
        Dict: 11,
        Array: 12,
        ARRAY_LENGTH: 13
      }; // Collection of all data types
      // class Index of DataTypeID.CustomizedClass or PrimitiveObjectTypeID
      // Includes normal CCClass and fast defined class
      // eslint-disable-next-line @typescript-eslint/ban-types
      // eslint-disable-next-line @typescript-eslint/ban-types
      /**
       * If the value type is different, different Classes will be generated
       */
      CLASS_TYPE = 0;
      CLASS_KEYS = 1;
      CLASS_PROP_TYPE_OFFSET = 2;
      /**
       * Mask is used to define the properties and types that need to be deserialized.
       * Instances of the same class may have different Masks due to different default properties removed.
       */
      MASK_CLASS = 0;
      OBJ_DATA_MASK = 0;
      CUSTOM_OBJ_DATA_CLASS = 0;
      CUSTOM_OBJ_DATA_CONTENT = 1;
      DICT_JSON_LAYOUT = 0;
      ARRAY_ITEM_VALUES = 0;
      Refs = {
        EACH_RECORD_LENGTH: 3,
        OWNER_OFFSET: 0,
        KEY_OFFSET: 1,
        TARGET_OFFSET: 2
      };
      File = {
        Version: 0,
        Context: 0,
        SharedUuids: 1,
        SharedStrings: 2,
        SharedClasses: 3,
        SharedMasks: 4,
        Instances: 5,
        InstanceTypes: 6,
        Refs: 7,
        DependObjs: 8,
        DependKeys: 9,
        DependUuidIndices: 10,
        ARRAY_LENGTH: 11
      }; // Main file structure
      /**
       * At runtime, we intruded the original file data and injected some helpers.
       */
      PACKED_SECTIONS = File.Instances;
      /** **************************************************************************
       * IMPLEMENTS
       *************************************************************************** */
      /**
       * @en Contains information collected during deserialization
       * @zh 包含反序列化时的一些信息。
       * @class Details
       */
      _export("Details", Details = class Details {
        constructor() {
          /**
           * @en
           * the object list whose field needs to load asset by uuid
           * @zh
           * 对象列表，其中每个对象有属性需要通过 uuid 进行资源加载
           */
          this.uuidObjList = null;
          /**
           * @en
           * the corresponding field name which referenced to the asset
           * @zh
           * 引用着资源的字段名称
           */
          this.uuidPropList = null;
          /**
           * @en
           * list of the depends assets' uuid
           * @zh
           * 依赖资源的 uuid 列表
           */
          this.uuidList = null;
          /**
           * @en
           * list of the depends assets' type
           * @zh
           * 依赖的资源类型列表
           */
          this.uuidTypeList = [];
        }
        // eslint-disable-next-line @typescript-eslint/ban-types

        /**
         * @method init
         * @param {Object} data
         */
        init(data) {
          if (FORCE_COMPILED || data) {
            this.uuidObjList = data[File.DependObjs];
            this.uuidPropList = data[File.DependKeys];
            this.uuidList = data[File.DependUuidIndices];
          } else {
            // could be used by deserialize-dynamic
            const used = this.uuidList;
            if (!used) {
              this.uuidList = [];
              this.uuidObjList = [];
              this.uuidPropList = [];
              this.uuidTypeList = [];
            }
          }
        }

        /**
         * @method reset
         */
        reset() {
          if (FORCE_COMPILED) {
            this.uuidList = null;
            this.uuidObjList = null;
            this.uuidPropList = null;
          } else {
            // could be reused by deserialize-dynamic
            const used = this.uuidList;
            if (used) {
              this.uuidList.length = 0;
              this.uuidObjList.length = 0;
              this.uuidPropList.length = 0;
              this.uuidTypeList.length = 0;
            }
          }
        }

        /**
         * @method push
         * @param {Object} obj
         * @param {String} propName
         * @param {String} uuid
         */
        // eslint-disable-next-line @typescript-eslint/ban-types
        push(obj, propName, uuid, type) {
          this.uuidObjList.push(obj);
          this.uuidPropList.push(propName);
          this.uuidList.push(uuid);
          this.uuidTypeList.push(type || '');
        }
      });
      _Details = Details;
      Details.pool = new js.Pool(obj => {
        obj.reset();
      }, 5);
      Details.pool.get = function () {
        return this._get() || new Details();
      };
      if (EDITOR || NODEJS || TEST) {
        Details.prototype.assignAssetsBy = function (getter) {
          for (let i = 0, len = this.uuidList.length; i < len; i++) {
            const obj = this.uuidObjList[i];
            const prop = this.uuidPropList[i];
            const uuid = this.uuidList[i];
            const type = this.uuidTypeList[i];
            const _type = js.getClassById(type) || Asset;
            obj[prop] = getter(uuid, {
              type: _type,
              owner: obj,
              prop
            });
          }
        };
      }
      ASSIGNMENTS = new Array(DataTypeID.ARRAY_LENGTH);
      ASSIGNMENTS[DataTypeID.SimpleType] = assignSimple; // Only be used in the instances array
      ASSIGNMENTS[DataTypeID.InstanceRef] = assignInstanceRef;
      ASSIGNMENTS[DataTypeID.Array_InstanceRef] = genArrayParser(assignInstanceRef);
      ASSIGNMENTS[DataTypeID.Array_AssetRefByInnerObj] = genArrayParser(parseAssetRefByInnerObj);
      ASSIGNMENTS[DataTypeID.Class] = parseClass;
      ASSIGNMENTS[DataTypeID.ValueTypeCreated] = deserializeBuiltinValueTypeInto;
      ASSIGNMENTS[DataTypeID.AssetRefByInnerObj] = parseAssetRefByInnerObj;
      ASSIGNMENTS[DataTypeID.TRS] = parseTRS;
      ASSIGNMENTS[DataTypeID.ValueType] = deserializeBuiltinValueType;
      ASSIGNMENTS[DataTypeID.Array_Class] = genArrayParser(parseClass);
      ASSIGNMENTS[DataTypeID.CustomizedClass] = parseCustomClass;
      ASSIGNMENTS[DataTypeID.Dict] = parseDict;
      ASSIGNMENTS[DataTypeID.Array] = parseArray;
      deserialize.Details = Details;
      deserialize.reportMissingClass = defaultReportMissingClass;
      FileInfo = class FileInfo {
        constructor(version) {
          this.preprocessed = true;
          this.version = version;
        }
      };
      if (PREVIEW) {
        deserialize.isCompiledJson = isCompiledJson;
      }
      if (EDITOR || TEST || NODEJS) {
        deserialize._macros = {
          EMPTY_PLACEHOLDER,
          CUSTOM_OBJ_DATA_CLASS,
          CUSTOM_OBJ_DATA_CONTENT,
          CLASS_TYPE,
          CLASS_KEYS,
          CLASS_PROP_TYPE_OFFSET,
          MASK_CLASS,
          OBJ_DATA_MASK,
          DICT_JSON_LAYOUT,
          ARRAY_ITEM_VALUES,
          PACKED_SECTIONS
        };
      }
      if (TEST) {
        cclegacy._Test.deserializeCompiled = {
          deserialize,
          dereference,
          deserializeCCObject,
          deserializeCustomCCObject,
          parseInstances,
          parseResult,
          cacheMasks,
          File: {
            Version: File.Version,
            Context: File.Context,
            SharedUuids: File.SharedUuids,
            SharedStrings: File.SharedStrings,
            SharedClasses: File.SharedClasses,
            SharedMasks: File.SharedMasks,
            Instances: File.Instances,
            InstanceTypes: File.InstanceTypes,
            Refs: File.Refs,
            DependObjs: File.DependObjs,
            DependKeys: File.DependKeys,
            DependUuidIndices: File.DependUuidIndices
            // ArrayLength: File.ArrayLength,
          },
          DataTypeID: {
            SimpleType: DataTypeID.SimpleType,
            InstanceRef: DataTypeID.InstanceRef,
            Array_InstanceRef: DataTypeID.Array_InstanceRef,
            Array_AssetRefByInnerObj: DataTypeID.Array_AssetRefByInnerObj,
            Class: DataTypeID.Class,
            ValueTypeCreated: DataTypeID.ValueTypeCreated,
            AssetRefByInnerObj: DataTypeID.AssetRefByInnerObj,
            TRS: DataTypeID.TRS,
            ValueType: DataTypeID.ValueType,
            Array_Class: DataTypeID.Array_Class,
            CustomizedClass: DataTypeID.CustomizedClass,
            Dict: DataTypeID.Dict,
            Array: DataTypeID.Array
          },
          unpackJSONs
        };
      }
      cclegacy.deserialize = deserialize;
    }
  };
});