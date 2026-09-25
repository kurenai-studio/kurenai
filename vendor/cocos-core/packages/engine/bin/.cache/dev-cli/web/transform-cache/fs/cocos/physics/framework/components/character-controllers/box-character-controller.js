System.register("q-bundled:///fs/cocos/physics/framework/components/character-controllers/box-character-controller.js", ["../../../../core/data/decorators/index.js", "../../../../core/index.js", "../../physics-enum.js", "./character-controller.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, executionOrder, tooltip, type, serializable, Vec3, CCFloat, ECharacterControllerType, CharacterController, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _class, _class2, _descriptor, _descriptor2, _descriptor3, v3_0, BoxCharacterController;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      CCFloat = _coreIndexJs.CCFloat;
    }, function (_physicsEnumJs) {
      ECharacterControllerType = _physicsEnumJs.ECharacterControllerType;
    }, function (_characterControllerJs) {
      CharacterController = _characterControllerJs.CharacterController;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      v3_0 = new Vec3(0, 0, 0);
      /**
       * @en
       * Character Controller component.
       * @zh
       * 角色控制器组件。
       */
      _export("BoxCharacterController", BoxCharacterController = (_dec = ccclass('cc.BoxCharacterController'), _dec2 = help('i18n:cc.BoxCharacterController'), _dec3 = menu('Physics/BoxCharacterController'), _dec4 = executionOrder(-1), _dec5 = tooltip('i18n:physics3d.character_controller.boxHalfHeight'), _dec6 = type(CCFloat), _dec7 = tooltip('i18n:physics3d.character_controller.boxHalfSideExtent'), _dec8 = type(CCFloat), _dec9 = tooltip('i18n:physics3d.character_controller.boxHalfForwardExtent'), _dec0 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = _dec4(_class = (_class2 = class BoxCharacterController extends CharacterController {
        constructor() {
          super(ECharacterControllerType.BOX);
          /// PRIVATE PROPERTY ///
          _initializerDefineProperty(this, "_halfHeight", _descriptor, this);
          _initializerDefineProperty(this, "_halfSideExtent", _descriptor2, this);
          _initializerDefineProperty(this, "_halfForwardExtent", _descriptor3, this);
        }

        /// PUBLIC PROPERTY GETTER\SETTER ///
        /**
         * @en
         * Gets or sets the half height of the box shape of the CharacterController in local space.
         * @zh
         * 获取或设置立方体在本地坐标系下的高度的一半。
         */
        get halfHeight() {
          return this._halfHeight;
        }
        set halfHeight(value) {
          if (this._halfHeight === value) return;
          this._halfHeight = Math.abs(value);
          if (this._cct) {
            this._cct.setHalfHeight(value);
          }
        }

        /**
         * @en
         * Gets or sets the half side extent of box shape of the CharacterController in local space.
         * @zh
         * 获取或设置立方体在本地坐标系下的横向宽度的一半。
         */
        get halfSideExtent() {
          return this._halfSideExtent;
        }
        set halfSideExtent(value) {
          if (this._halfSideExtent === value) return;
          this._halfSideExtent = Math.abs(value);
          if (this._cct) {
            this._cct.setHalfSideExtent(value);
          }
        }

        /**
         * @en
         * Gets or sets the half forward extent of the box on the CharacterController in local space.
         * @zh
         * 获取或设置立方体在本地坐标系下的纵向宽度一半。
         */
        get halfForwardExtent() {
          return this._halfForwardExtent;
        }
        set halfForwardExtent(value) {
          if (this._halfForwardExtent === value) return;
          this._halfForwardExtent = Math.abs(value);
          if (this._cct) {
            this._cct.setHalfForwardExtent(value);
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "halfHeight", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "halfHeight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "halfSideExtent", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "halfSideExtent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "halfForwardExtent", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "halfForwardExtent"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_halfHeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_halfSideExtent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_halfForwardExtent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});