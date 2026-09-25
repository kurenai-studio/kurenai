System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/copy-transform.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/data/decorators/index.js", "../../../define.js", "../pose-node.js", "../../../../core/index.js", "../decorator/node.js", "./menu-common.js", "./modify-pose-base.js", "../../../core/transform.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editable, serializable, type, CLASS_NAME_PREFIX_ANIM, PoseTransformSpaceRequirement, ccenum, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE, PoseNodeModifyPoseBase, Transform, Workspace, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, cacheTransform, CopySpace, PoseNodeCopyTransform;
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
    }, function (_poseNodeJs) {
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE;
    }, function (_modifyPoseBaseJs) {
      PoseNodeModifyPoseBase = _modifyPoseBaseJs.PoseNodeModifyPoseBase;
    }, function (_coreTransformJs) {
      Transform = _coreTransformJs.Transform;
    }],
    execute: function () {
      cacheTransform = new Transform();
      _export("CopySpace", CopySpace = /*#__PURE__*/function (CopySpace) {
        /**
         * Transforms are stored relative to their parent nodes.
         */
        CopySpace[CopySpace["LOCAL"] = 0] = "LOCAL";
        /**
         * Transforms are stored relative to the belonging animation controller's node's space.
         */
        CopySpace[CopySpace["COMPONENT"] = 1] = "COMPONENT";
        return CopySpace;
      }({}));
      ccenum(CopySpace);
      _export("PoseNodeCopyTransform", PoseNodeCopyTransform = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeCopyTransform`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec4 = type(CopySpace), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeCopyTransform extends PoseNodeModifyPoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "sourceNodeName", _descriptor, this);
          _initializerDefineProperty(this, "targetNodeName", _descriptor2, this);
          _initializerDefineProperty(this, "space", _descriptor3, this);
          this._workspace = undefined;
        }
        bind(context) {
          super.bind(context);
          const sourceTransformHandle = context.bindTransformByName(this.sourceNodeName);
          const targetTransformHandle = context.bindTransformByName(this.targetNodeName);
          if (!sourceTransformHandle || !targetTransformHandle) {
            sourceTransformHandle == null || sourceTransformHandle.destroy();
            targetTransformHandle == null || targetTransformHandle.destroy();
            return;
          }
          this._workspace = new Workspace(sourceTransformHandle, targetTransformHandle);
        }
        modifyPose(context, inputPose) {
          const {
            _workspace: workspace
          } = this;
          if (!workspace) {
            return;
          }
          const {
            hSource: {
              index: sourceTransformIndex
            },
            hTarget: {
              index: targetTransformIndex
            }
          } = workspace;
          const transform = inputPose.transforms.getTransform(sourceTransformIndex, cacheTransform);
          inputPose.transforms.setTransform(targetTransformIndex, transform);
        }
        getPoseTransformSpaceRequirement() {
          return this.space === CopySpace.COMPONENT ? PoseTransformSpaceRequirement.COMPONENT : PoseTransformSpaceRequirement.LOCAL;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "sourceNodeName", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "targetNodeName", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "space", [serializable, editable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CopySpace.COMPONENT;
        }
      }), _class2)) || _class) || _class) || _class));
      Workspace = class Workspace {
        constructor(hSource, hTarget) {
          this.hSource = hSource;
          this.hTarget = hTarget;
        }
      };
      if (EDITOR) {
        PoseNodeCopyTransform.prototype.getTitle = function getTitle() {
          if (this.sourceNodeName && this.targetNodeName) {
            return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PoseNodeCopyTransform.title`, {
              sourceNodeName: this.sourceNodeName,
              targetNodeName: this.targetNodeName
            }];
          }
          return undefined;
        };
      }
    }
  };
});