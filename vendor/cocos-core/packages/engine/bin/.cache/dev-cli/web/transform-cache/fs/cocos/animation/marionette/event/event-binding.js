System.register("q-bundled:///fs/cocos/animation/marionette/event/event-binding.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "../../define.js", "../../event/event-emitter.js"], function (_export, _context) {
  "use strict";

  var editable, ccclass, serializable, CLASS_NAME_PREFIX_ANIM, invokeComponentMethodsEngagedInAnimationEvent, _dec, _class, _class2, _descriptor, AnimationGraphEventBinding;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      editable = _coreIndexJs.editable;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_eventEventEmitterJs) {
      invokeComponentMethodsEngagedInAnimationEvent = _eventEventEmitterJs.invokeComponentMethodsEngagedInAnimationEvent;
    }],
    execute: function () {
      /**
       * @zh 描述动画图中的事件绑定。
       * @en Describes the event bindings in animation graph.
       */
      _export("AnimationGraphEventBinding", AnimationGraphEventBinding = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}AnimationGraphEventBinding`), _dec(_class = (_class2 = class AnimationGraphEventBinding {
        constructor() {
          /**
           * @zh 绑定的方法名。
           * @en The event name bound.
           */
          _initializerDefineProperty(this, "methodName", _descriptor, this);
        }
        /**
         * @zh 获取该绑定是否绑定了任何事件。
         * @en Tells if there's any event bound to this binding.
         */
        get isBound() {
          return !!this.methodName;
        }
        emit(origin) {
          if (!this.methodName) {
            return;
          }
          invokeComponentMethodsEngagedInAnimationEvent(origin, this.methodName, []);
        }
        copyTo(that) {
          that.methodName = this.methodName;
          return this;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "methodName", [editable, serializable], {
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