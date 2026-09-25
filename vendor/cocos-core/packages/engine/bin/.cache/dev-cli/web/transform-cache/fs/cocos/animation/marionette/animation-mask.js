System.register("q-bundled:///fs/cocos/animation/marionette/animation-mask.js", ["../../core/data/decorators/index.js", "../../asset/assets/asset.js", "../../core/index.js", "../define.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, editable, type, Asset, js, CLASS_NAME_PREFIX_ANIM, _dec, _class, _class2, _descriptor, _descriptor2, _dec2, _dec3, _class3, _class4, _descriptor3, JointMask, AnimationMask;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }],
    execute: function () {
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
      JointMask = (_dec = ccclass('cc.JointMask'), _dec(_class = (_class2 = class JointMask {
        constructor() {
          _initializerDefineProperty(this, "path", _descriptor, this);
          _initializerDefineProperty(this, "enabled", _descriptor2, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class);
      _export("AnimationMask", AnimationMask = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationMask`), _dec3 = type(JointMask), _dec2(_class3 = (_class4 = class AnimationMask extends Asset {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_jointMasks", _descriptor3, this);
        }
        get joints() {
          // TODO: editor currently treats this property as (and expects it to be) an array.
          // If later refactoring is needed, changes should also be made to editor.

          return this._jointMasks;
        }
        set joints(value) {
          this.clear();
          for (const joint of value) {
            this.addJoint(joint.path, joint.enabled);
          }
        }

        /**
         * @zh 添加一个关节遮罩项。
         * 已存在的相同路径的关节遮罩项会被替换为新的。
         * @en Add a joint mask item.
         * Already existing joint mask with same path item will be replaced.
         * @param path @zh 关节的路径。 @en The joint's path.
         * @param enabled @zh 是否启用该关节。 @en Whether to enable the joint.
         */
        addJoint(path, enabled) {
          this.removeJoint(path);
          const info = new JointMask();
          info.path = path;
          info.enabled = enabled;
          this._jointMasks.push(info);
        }
        removeJoint(removal) {
          js.array.removeIf(this._jointMasks, ({
            path
          }) => path === removal);
        }
        clear() {
          this._jointMasks.length = 0;
        }
        filterDisabledNodes(root) {
          const {
            _jointMasks: jointMasks
          } = this;
          const nJointMasks = jointMasks.length;
          const disabledNodes = new Set();
          for (let iJointMask = 0; iJointMask < nJointMasks; ++iJointMask) {
            const {
              path,
              enabled
            } = jointMasks[iJointMask];
            if (enabled) {
              continue;
            }
            const node = root.getChildByPath(path);
            if (node) {
              disabledNodes.add(node);
            }
          }
          return disabledNodes;
        }
        isExcluded(path) {
          var _this$_jointMasks$fin, _this$_jointMasks$fin2;
          return !((_this$_jointMasks$fin = (_this$_jointMasks$fin2 = this._jointMasks.find(({
            path: p
          }) => p === path)) == null ? void 0 : _this$_jointMasks$fin2.enabled) != null ? _this$_jointMasks$fin : true);
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_jointMasks", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "joints", [editable, _dec3], Object.getOwnPropertyDescriptor(_class4.prototype, "joints"), _class4.prototype), _class4)) || _class3));
    }
  };
});