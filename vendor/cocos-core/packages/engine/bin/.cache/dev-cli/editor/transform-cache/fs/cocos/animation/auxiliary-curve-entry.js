System.register("q-bundled:///fs/cocos/animation/auxiliary-curve-entry.js", ["../core/index.js", "../core/data/decorators/index.js", "./define.js"], function (_export, _context) {
  "use strict";

  var RealCurve, ccclass, serializable, CLASS_NAME_PREFIX_ANIM, _dec, _class, _class2, _descriptor, _descriptor2, AuxiliaryCurveEntry;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      RealCurve = _coreIndexJs.RealCurve;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }],
    execute: function () {
      _export("AuxiliaryCurveEntry", AuxiliaryCurveEntry = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AuxiliaryCurveEntry`), _dec(_class = (_class2 = class AuxiliaryCurveEntry {
        constructor() {
          _initializerDefineProperty(this, "name", _descriptor, this);
          _initializerDefineProperty(this, "curve", _descriptor2, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "curve", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new RealCurve();
        }
      }), _class2)) || _class));
    }
  };
});