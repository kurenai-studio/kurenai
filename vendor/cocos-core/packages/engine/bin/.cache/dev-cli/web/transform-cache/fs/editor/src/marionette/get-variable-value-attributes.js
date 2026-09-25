System.register("q-bundled:///fs/editor/src/marionette/get-variable-value-attributes.js", ["../../../cocos/animation/define.js", "../../../cocos/core/data/class-decorator.js", "../../../exports/base.js", "../../exports/new-gen-anim.js"], function (_export, _context) {
  "use strict";

  var CLASS_NAME_PREFIX_ANIM, ccclass, property, CCClass, CCInteger, js, VariableType, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, VariableValueAttributeRegistry, FLOAT_VALUE_ATTRS, INT_VALUE_ATTRS, OTHER_ATTRS;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function getVariableValueAttributes(variableDescription) {
    switch (variableDescription.type) {
      case VariableType.FLOAT:
        return FLOAT_VALUE_ATTRS;
      case VariableType.INTEGER:
        return INT_VALUE_ATTRS;
      default:
        return OTHER_ATTRS;
    }
  }
  _export("getVariableValueAttributes", getVariableValueAttributes);
  return {
    setters: [function (_cocosAnimationDefineJs) {
      CLASS_NAME_PREFIX_ANIM = _cocosAnimationDefineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_cocosCoreDataClassDecoratorJs) {
      ccclass = _cocosCoreDataClassDecoratorJs.ccclass;
      property = _cocosCoreDataClassDecoratorJs.property;
    }, function (_exportsBaseJs) {
      CCClass = _exportsBaseJs.CCClass;
      CCInteger = _exportsBaseJs.CCInteger;
      js = _exportsBaseJs.js;
    }, function (_exportsNewGenAnimJs) {
      VariableType = _exportsNewGenAnimJs.VariableType;
    }],
    execute: function () {
      VariableValueAttributeRegistry = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}internal/VariableValueAttributeRegistry`), _dec2 = property({
        step: 0.1
      }), _dec3 = property({
        type: CCInteger,
        step: 1
      }), _dec(_class = (_class2 = class VariableValueAttributeRegistry {
        constructor() {
          _initializerDefineProperty(this, "floatValue", _descriptor, this);
          _initializerDefineProperty(this, "intValue", _descriptor2, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "floatValue", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "intValue", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class);
      FLOAT_VALUE_ATTRS = Object.freeze(CCClass.Attr.attr(VariableValueAttributeRegistry, 'floatValue'));
      INT_VALUE_ATTRS = Object.freeze(CCClass.Attr.attr(VariableValueAttributeRegistry, 'intValue'));
      js.unregisterClass(VariableValueAttributeRegistry);
      OTHER_ATTRS = Object.freeze({});
    }
  };
});