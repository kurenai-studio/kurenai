System.register("q-bundled:///fs/cocos/asset/asset-manager/deserialize.js", ["../../../../virtual/internal%253Aconstants.js", "../../misc/missing-script.js", "../../serialization/deserialize.js", "../../core/index.js", "./depend-maps.js", "./helper.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, MissingScript, deserialize, Details, error, js, dependMap, nativeDependMap, decodeUuid, missingClass;
  function deserializeAsset(json, options) {
    let classFinder;
    if (EDITOR || NODEJS) {
      classFinder = (type, data, owner, propName) => {
        const res = missingClass.classFinder(type, data, owner, propName);
        if (res) {
          return res;
        }
        return MissingScript;
      };
      classFinder.onDereferenced = missingClass.classFinder.onDereferenced;
    } else {
      classFinder = MissingScript.safeFindClass;
    }
    const tdInfo = Details.pool.get();
    let asset;
    try {
      asset = deserialize(json, tdInfo, {
        classFinder,
        customEnv: options
      });
    } catch (e) {
      error(e);
      Details.pool.put(tdInfo);
      throw e;
    }
    asset._uuid = options.__uuid__ || '';
    if (EDITOR || NODEJS) {
      missingClass.reportMissingClass(asset);
      missingClass.reset();
    }
    const uuidList = tdInfo.uuidList;
    const objList = tdInfo.uuidObjList;
    const propList = tdInfo.uuidPropList;
    const typeList = tdInfo.uuidTypeList || [];
    const depends = [];
    for (let i = 0; i < uuidList.length; i++) {
      const dependUuid = uuidList[i];
      depends[i] = {
        uuid: decodeUuid(dependUuid),
        owner: objList[i],
        prop: propList[i],
        type: js.getClassById(typeList[i])
      };
    }

    // non-native deps
    dependMap.set(asset, depends);
    // native dep
    if (asset._native) {
      nativeDependMap.add(asset);
    }
    Details.pool.put(tdInfo);
    return asset;
  }
  _export("default", deserializeAsset);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_miscMissingScriptJs) {
      MissingScript = _miscMissingScriptJs.MissingScript;
    }, function (_serializationDeserializeJs) {
      deserialize = _serializationDeserializeJs.deserialize;
      Details = _serializationDeserializeJs.Details;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
      js = _coreIndexJs.js;
    }, function (_dependMapsJs) {
      dependMap = _dependMapsJs.dependMap;
      nativeDependMap = _dependMapsJs.nativeDependMap;
    }, function (_helperJs) {
      decodeUuid = _helperJs.decodeUuid;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      missingClass = (EDITOR || NODEJS) && EditorExtends.MissingReporter.classInstance;
    }
  };
});