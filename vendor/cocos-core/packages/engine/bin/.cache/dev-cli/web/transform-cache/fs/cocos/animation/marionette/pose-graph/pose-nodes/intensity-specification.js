System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/intensity-specification.js", ["../../../../core/index.js", "../../../../core/data/decorators/index.js", "../../../define.js"], function (_export, _context) {
  "use strict";

  var ccenum, ccclass, editable, range, serializable, type, visible, CLASS_NAME_PREFIX_ANIM, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, IntensityType, IntensitySpecification;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }],
    execute: function () {
      IntensityType = /*#__PURE__*/function (IntensityType) {
        IntensityType[IntensityType["VALUE"] = 0] = "VALUE";
        IntensityType[IntensityType["AUXILIARY_CURVE"] = 1] = "AUXILIARY_CURVE";
        return IntensityType;
      }(IntensityType || {});
      ccenum(IntensityType);
      _export("IntensitySpecification", IntensitySpecification = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}IntensitySpecification`), _dec2 = type(IntensityType), _dec3 = visible(function visible() {
        return this.type === IntensityType.VALUE;
      }), _dec4 = range([0.0, 1.0, 0.01]), _dec5 = visible(function visible() {
        return this.type === IntensityType.AUXILIARY_CURVE;
      }), _dec(_class = (_class2 = class IntensitySpecification {
        constructor() {
          _initializerDefineProperty(this, "type", _descriptor, this);
          _initializerDefineProperty(this, "value", _descriptor2, this);
          _initializerDefineProperty(this, "auxiliaryCurveName", _descriptor3, this);
          this._handle = undefined;
        }
        bind(context) {
          if (this.type === IntensityType.AUXILIARY_CURVE && this.auxiliaryCurveName) {
            const handle = context.bindAuxiliaryCurve(this.auxiliaryCurveName);
            this._handle = handle;
          }
        }
        evaluate(pose) {
          if (this.type === IntensityType.AUXILIARY_CURVE && this._handle) {
            const value = pose.auxiliaryCurves[this._handle.index];
            return value;
          }
          return this.value;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec2, serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return IntensityType.VALUE;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [serializable, editable, _dec3, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "auxiliaryCurveName", [serializable, editable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class));
    }
  };
});