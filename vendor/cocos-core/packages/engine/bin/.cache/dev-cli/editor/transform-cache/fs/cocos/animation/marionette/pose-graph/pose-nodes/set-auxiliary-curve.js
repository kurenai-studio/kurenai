System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/set-auxiliary-curve.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/data/decorators/index.js", "../../../define.js", "../../../../core/index.js", "../decorator/input.js", "../decorator/node.js", "./menu-common.js", "./modify-pose-base.js", "../foundation/type-system.js", "../pose-node.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editable, serializable, type, CLASS_NAME_PREFIX_ANIM, ccenum, input, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE, PoseNodeModifyPoseBase, PoseGraphType, PoseTransformSpaceRequirement, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, SetAuxiliaryCurveFlag, PoseNodeSetAuxiliaryCurve;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_decoratorNodeJs) {
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE;
    }, function (_modifyPoseBaseJs) {
      PoseNodeModifyPoseBase = _modifyPoseBaseJs.PoseNodeModifyPoseBase;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_poseNodeJs) {
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }],
    execute: function () {
      SetAuxiliaryCurveFlag = /*#__PURE__*/function (SetAuxiliaryCurveFlag) {
        SetAuxiliaryCurveFlag[SetAuxiliaryCurveFlag["LEAVE_UNCHANGED"] = 0] = "LEAVE_UNCHANGED";
        SetAuxiliaryCurveFlag[SetAuxiliaryCurveFlag["REPLACE"] = 1] = "REPLACE";
        SetAuxiliaryCurveFlag[SetAuxiliaryCurveFlag["ADD"] = 2] = "ADD";
        return SetAuxiliaryCurveFlag;
      }(SetAuxiliaryCurveFlag || {});
      ccenum(SetAuxiliaryCurveFlag);
      _export("PoseNodeSetAuxiliaryCurve", PoseNodeSetAuxiliaryCurve = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeSetAuxiliaryCurve`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE), _dec3 = input({
        type: PoseGraphType.FLOAT
      }), _dec4 = type(SetAuxiliaryCurveFlag), _dec(_class = _dec2(_class = (_class2 = class PoseNodeSetAuxiliaryCurve extends PoseNodeModifyPoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "curveName", _descriptor, this);
          _initializerDefineProperty(this, "curveValue", _descriptor2, this);
          _initializerDefineProperty(this, "flag", _descriptor3, this);
          this._handle = undefined;
        }
        bind(context) {
          super.bind(context);
          if (this.curveName) {
            this._handle = context.bindAuxiliaryCurve(this.curveName);
          }
        }
        getPoseTransformSpaceRequirement() {
          return PoseTransformSpaceRequirement.NO;
        }
        modifyPose(context, inputPose) {
          const {
            _handle: handle
          } = this;
          if (!handle) {
            return;
          }
          switch (this.flag) {
            case SetAuxiliaryCurveFlag.REPLACE:
              inputPose.auxiliaryCurves[handle.index] = this.curveValue;
              break;
            case SetAuxiliaryCurveFlag.ADD:
              inputPose.auxiliaryCurves[handle.index] += this.curveValue;
              break;
            case SetAuxiliaryCurveFlag.LEAVE_UNCHANGED:
            default:
              break;
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "curveName", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "curveValue", [serializable, editable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "flag", [serializable, editable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SetAuxiliaryCurveFlag.REPLACE;
        }
      }), _class2)) || _class) || _class));
      if (EDITOR) {
        PoseNodeSetAuxiliaryCurve.prototype.getTitle = function getTitle() {
          if (!this.curveName) {
            return undefined;
          }
          return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PoseNodeSetAuxiliaryCurve.title`, {
            curveName: this.curveName
          }];
        };
      }
    }
  };
});