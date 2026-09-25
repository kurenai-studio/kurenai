System.register("q-bundled:///fs/cocos/scene-graph/prefab/prefab-info.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/data/index.js", "../component.js", "../node.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, editable, type, EDITOR, cclegacy, CCObject, CCString, Component, Node, _dec, _dec2, _class, _class2, _descriptor, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class3, _class4, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _dec9, _class5, _class6, _descriptor7, _dec0, _dec1, _dec10, _class7, _class8, _descriptor8, _descriptor9, _descriptor0, _dec11, _dec12, _dec13, _class9, _class0, _descriptor1, _descriptor10, _dec14, _dec15, _dec16, _class1, _class10, _descriptor11, _descriptor12, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _class11, _class12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _dec23, _dec24, _dec25, _dec26, _class13, _class14, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, TargetInfo, TargetOverrideInfo, CompPrefabInfo, PropertyOverrideInfo, MountedChildrenInfo, MountedComponentsInfo, PrefabInstance, PrefabInfo;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /*
   Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
  
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

  function compareStringArray(array1, array2) {
    if (!array1 || !array2) {
      return false;
    }
    if (array1.length !== array2.length) {
      return false;
    }
    return array1.every((value, index) => value === array2[index]);
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_coreDataIndexJs) {
      CCObject = _coreDataIndexJs.CCObject;
      CCString = _coreDataIndexJs.CCString;
    }, function (_componentJs) {
      Component = _componentJs.Component;
    }, function (_nodeJs) {
      Node = _nodeJs.Node;
    }],
    execute: function () {
      _export("TargetInfo", TargetInfo = (_dec = ccclass('cc.TargetInfo'), _dec2 = type([CCString]), _dec(_class = (_class2 = class TargetInfo {
        constructor() {
          // as the target's fileId in prefab asset,used to find the target when prefab expanded.
          _initializerDefineProperty(this, "localID", _descriptor, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "localID", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      _export("TargetOverrideInfo", TargetOverrideInfo = (_dec3 = ccclass('cc.TargetOverrideInfo'), _dec4 = type(CCObject), _dec5 = type(TargetInfo), _dec6 = type([CCString]), _dec7 = type(Node), _dec8 = type(TargetInfo), _dec3(_class3 = (_class4 = class TargetOverrideInfo {
        constructor() {
          _initializerDefineProperty(this, "source", _descriptor2, this);
          // if owner is in a prefab, use TargetInfo to index it
          _initializerDefineProperty(this, "sourceInfo", _descriptor3, this);
          _initializerDefineProperty(this, "propertyPath", _descriptor4, this);
          _initializerDefineProperty(this, "target", _descriptor5, this);
          // if target is in a prefab, use TargetInfo to index it
          _initializerDefineProperty(this, "targetInfo", _descriptor6, this);
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "source", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "sourceInfo", [serializable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "propertyPath", [serializable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "target", [serializable, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "targetInfo", [serializable, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class4)) || _class3));
      _export("CompPrefabInfo", CompPrefabInfo = (_dec9 = ccclass('cc.CompPrefabInfo'), _dec9(_class5 = (_class6 = class CompPrefabInfo {
        constructor() {
          // To identify current component in a prefab asset, so only needs to be unique.
          _initializerDefineProperty(this, "fileId", _descriptor7, this);
        }
      }, _descriptor7 = _applyDecoratedDescriptor(_class6.prototype, "fileId", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class6)) || _class5));
      _export("PropertyOverrideInfo", PropertyOverrideInfo = (_dec0 = ccclass('CCPropertyOverrideInfo'), _dec1 = type(TargetInfo), _dec10 = type([CCString]), _dec0(_class7 = (_class8 = class PropertyOverrideInfo {
        constructor() {
          _initializerDefineProperty(this, "targetInfo", _descriptor8, this);
          _initializerDefineProperty(this, "propertyPath", _descriptor9, this);
          _initializerDefineProperty(this, "value", _descriptor0, this);
        }
        // eslint-disable-next-line consistent-return
        isTarget(localID, propPath) {
          if (EDITOR) {
            var _this$targetInfo;
            return compareStringArray((_this$targetInfo = this.targetInfo) == null ? void 0 : _this$targetInfo.localID, localID) && compareStringArray(this.propertyPath, propPath);
          }
        }
      }, _descriptor8 = _applyDecoratedDescriptor(_class8.prototype, "targetInfo", [serializable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class8.prototype, "propertyPath", [serializable, _dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class8.prototype, "value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class8)) || _class7));
      _export("MountedChildrenInfo", MountedChildrenInfo = (_dec11 = ccclass('cc.MountedChildrenInfo'), _dec12 = type(TargetInfo), _dec13 = type([Node]), _dec11(_class9 = (_class0 = class MountedChildrenInfo {
        constructor() {
          _initializerDefineProperty(this, "targetInfo", _descriptor1, this);
          _initializerDefineProperty(this, "nodes", _descriptor10, this);
        }
        // eslint-disable-next-line consistent-return
        isTarget(localID) {
          if (EDITOR) {
            var _this$targetInfo2;
            return compareStringArray((_this$targetInfo2 = this.targetInfo) == null ? void 0 : _this$targetInfo2.localID, localID);
          }
        }
      }, _descriptor1 = _applyDecoratedDescriptor(_class0.prototype, "targetInfo", [serializable, _dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class0.prototype, "nodes", [serializable, _dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class0)) || _class9));
      _export("MountedComponentsInfo", MountedComponentsInfo = (_dec14 = ccclass('cc.MountedComponentsInfo'), _dec15 = type(TargetInfo), _dec16 = type([Component]), _dec14(_class1 = (_class10 = class MountedComponentsInfo {
        constructor() {
          _initializerDefineProperty(this, "targetInfo", _descriptor11, this);
          _initializerDefineProperty(this, "components", _descriptor12, this);
        }
        // eslint-disable-next-line consistent-return
        isTarget(localID) {
          if (EDITOR) {
            var _this$targetInfo3;
            return compareStringArray((_this$targetInfo3 = this.targetInfo) == null ? void 0 : _this$targetInfo3.localID, localID);
          }
        }
      }, _descriptor11 = _applyDecoratedDescriptor(_class10.prototype, "targetInfo", [serializable, _dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class10.prototype, "components", [serializable, _dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class10)) || _class1));
      /**
       * Prefab实例类
       * @internal
       */
      _export("PrefabInstance", PrefabInstance = (_dec17 = ccclass('cc.PrefabInstance'), _dec18 = type(Node), _dec19 = type([MountedChildrenInfo]), _dec20 = type([MountedComponentsInfo]), _dec21 = type([PropertyOverrideInfo]), _dec22 = type([TargetInfo]), _dec17(_class11 = (_class12 = class PrefabInstance {
        constructor() {
          // Identify current prefabInstance;
          _initializerDefineProperty(this, "fileId", _descriptor13, this);
          // record the node with the Prefab that this prefabInstance belongs to.
          _initializerDefineProperty(this, "prefabRootNode", _descriptor14, this);
          // record children nodes that exist in this prefabInstance but not in prefab asset.
          _initializerDefineProperty(this, "mountedChildren", _descriptor15, this);
          // record components that exist in this prefabInstance but not in prefab asset.
          _initializerDefineProperty(this, "mountedComponents", _descriptor16, this);
          // override properties info in this prefabInstance.
          _initializerDefineProperty(this, "propertyOverrides", _descriptor17, this);
          // record components that exist in ths prefab asset but not in prefabInstance.
          _initializerDefineProperty(this, "removedComponents", _descriptor18, this);
          this.targetMap = {};
          /**
           * make sure prefab instance expand only once
           * @internal
           */
          this.expanded = false;
        }
        // eslint-disable-next-line consistent-return
        findPropertyOverride(localID, propPath) {
          if (EDITOR) {
            for (let i = 0; i < this.propertyOverrides.length; i++) {
              const propertyOverride = this.propertyOverrides[i];
              if (propertyOverride.isTarget(localID, propPath)) {
                return propertyOverride;
              }
            }
            return null;
          }
        }
        removePropertyOverride(localID, propPath) {
          if (EDITOR) {
            for (let i = 0; i < this.propertyOverrides.length; i++) {
              const propertyOverride = this.propertyOverrides[i];
              if (propertyOverride.isTarget(localID, propPath)) {
                this.propertyOverrides.splice(i, 1);
                break;
              }
            }
          }
        }
      }, _descriptor13 = _applyDecoratedDescriptor(_class12.prototype, "fileId", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class12.prototype, "prefabRootNode", [serializable, _dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor15 = _applyDecoratedDescriptor(_class12.prototype, "mountedChildren", [serializable, _dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class12.prototype, "mountedComponents", [serializable, _dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class12.prototype, "propertyOverrides", [serializable, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class12.prototype, "removedComponents", [serializable, _dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class12)) || _class11));
      _export("PrefabInfo", PrefabInfo = (_dec23 = ccclass('cc.PrefabInfo'), _dec24 = type(Node), _dec25 = type(PrefabInstance), _dec26 = type([TargetOverrideInfo]), _dec23(_class13 = (_class14 = class PrefabInfo {
        constructor() {
          // the most top node of this prefab in the scene
          _initializerDefineProperty(this, "root", _descriptor19, this);
          // reference to the prefab asset file.
          // In Editor, only asset._uuid is usable because asset will be changed.
          _initializerDefineProperty(this, "asset", _descriptor20, this);
          // prefabInfo's id,unique in the asset.
          _initializerDefineProperty(this, "fileId", _descriptor21, this);
          // Instance of a prefabAsset
          _initializerDefineProperty(this, "instance", _descriptor22, this);
          _initializerDefineProperty(this, "targetOverrides", _descriptor23, this);
          // record outMost prefabInstance nodes in descendants
          // collected when saving sceneAsset or prefabAsset
          _initializerDefineProperty(this, "nestedPrefabInstanceRoots", _descriptor24, this);
        }
      }, _descriptor19 = _applyDecoratedDescriptor(_class14.prototype, "root", [serializable, _dec24], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor20 = _applyDecoratedDescriptor(_class14.prototype, "asset", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor21 = _applyDecoratedDescriptor(_class14.prototype, "fileId", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor22 = _applyDecoratedDescriptor(_class14.prototype, "instance", [serializable, _dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor23 = _applyDecoratedDescriptor(_class14.prototype, "targetOverrides", [serializable, _dec26], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor24 = _applyDecoratedDescriptor(_class14.prototype, "nestedPrefabInstanceRoots", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class14)) || _class13));
      cclegacy._PrefabInfo = PrefabInfo;
    }
  };
});