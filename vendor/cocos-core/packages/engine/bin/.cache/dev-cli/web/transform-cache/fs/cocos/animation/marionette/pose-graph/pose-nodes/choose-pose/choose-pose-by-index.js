System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/choose-pose/choose-pose-by-index.js", ["../../../../../core/data/decorators/index.js", "../../../../define.js", "../../decorator/input.js", "../../decorator/node.js", "./menu.js", "./choose-pose-base.js", "../../foundation/type-system.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, CLASS_NAME_PREFIX_ANIM, input, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE, PoseNodeChoosePoseBase, PoseGraphType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, PoseNodeChoosePoseByIndex;
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
      _export("PoseNodeChoosePoseByIndex", PoseNodeChoosePoseByIndex = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeChoosePoseByIndex`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_CHOOSE), _dec3 = poseGraphNodeAppearance({
        themeColor: '#D07979'
      }), _dec4 = input({
        type: PoseGraphType.POSE,
        arraySyncGroup: 'choose-item'
      }), _dec5 = input({
        type: PoseGraphType.FLOAT,
        arraySyncGroup: 'choose-item',
        arraySyncGroupFollower: true
      }), _dec6 = input({
        type: PoseGraphType.INTEGER
      }), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeChoosePoseByIndex extends PoseNodeChoosePoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "choice", _descriptor, this);
        }
        get poses() {
          return this._poses;
        }
        set poses(value) {
          this._poses = value;
        }
        get fadeInDurations() {
          return this._fadeInDurations;
        }
        set fadeInDurations(value) {
          this._fadeInDurations = value;
        }
        getChosenIndex() {
          return this.choice;
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "poses", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "poses"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fadeInDurations", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "fadeInDurations"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "choice", [serializable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});