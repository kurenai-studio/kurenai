System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/choose-pose/choose-pose-by-boolean.js", ["../../../../../core/data/decorators/index.js", "../../../../define.js", "../../decorator/input.js", "../../decorator/node.js", "./menu.js", "./choose-pose-base.js", "../../foundation/type-system.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, CLASS_NAME_PREFIX_ANIM, input, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE, PoseNodeChoosePoseBase, PoseGraphType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, PoseNodeChoosePoseByBoolean;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE = _menuJs.POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE;
    }, function (_choosePoseBaseJs) {
      PoseNodeChoosePoseBase = _choosePoseBaseJs.PoseNodeChoosePoseBase;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }],
    execute: function () {
      _export("PoseNodeChoosePoseByBoolean", PoseNodeChoosePoseByBoolean = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeChoosePoseByBoolean`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE), _dec3 = poseGraphNodeAppearance({
        themeColor: '#D07979'
      }), _dec4 = input({
        type: PoseGraphType.POSE
      }), _dec5 = input({
        type: PoseGraphType.POSE
      }), _dec6 = input({
        type: PoseGraphType.FLOAT
      }), _dec7 = input({
        type: PoseGraphType.FLOAT
      }), _dec8 = input({
        type: PoseGraphType.BOOLEAN
      }), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeChoosePoseByBoolean extends PoseNodeChoosePoseBase {
        constructor() {
          super(2);
          _initializerDefineProperty(this, "choice", _descriptor, this);
        }
        get truePose() {
          return this._poses[0];
        }
        set truePose(value) {
          this._poses[0] = value;
        }
        get falsePose() {
          return this._poses[1];
        }
        set falsePose(value) {
          this._poses[1] = value;
        }
        get trueFadeInDuration() {
          return this._fadeInDurations[0];
        }
        set trueFadeInDuration(value) {
          this._fadeInDurations[0] = value;
        }
        get falseFadeInDuration() {
          return this._fadeInDurations[1];
        }
        set falseFadeInDuration(value) {
          this._fadeInDurations[1] = value;
        }
        getChosenIndex() {
          return this.choice ? 0 : 1;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "truePose", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "truePose"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "falsePose", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "falsePose"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "trueFadeInDuration", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "trueFadeInDuration"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "falseFadeInDuration", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "falseFadeInDuration"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "choice", [serializable, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});