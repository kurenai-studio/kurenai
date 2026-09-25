System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/ik/two-bone-ik-solver.js", ["../../../../../../../virtual/internal%253Aconstants.js", "../../../../../core/data/decorators/index.js", "../../../../define.js", "../../pose-node.js", "../../../../../core/index.js", "../../decorator/input.js", "../../decorator/node.js", "../modify-pose-base.js", "./solve-two-bone-ik.js", "../../../../core/transform.js", "../../foundation/type-system.js", "../transform-space.js", "./menu.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editable, serializable, type, visible, CLASS_NAME_PREFIX_ANIM, PoseTransformSpaceRequirement, assertIsTrue, ccenum, Vec3, input, poseGraphNodeCategory, PoseNodeModifyPoseBase, solveTwoBoneIK, Transform, PoseGraphType, TransformSpace, POSE_GRAPH_NODE_MENU_PREFIX_IK, Workspace, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class3, _class4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, cacheRootTransform, cacheMiddleTransform, cacheEndEffectorTransform, cacheEndEffectorTargetPosition, cachePoleTargetPosition, cacheTransform_evaluateTarget, TargetSpecificationType, TargetSpecification, PoseNodeTwoBoneIKSolver;
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
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_poseNodeJs) {
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      ccenum = _coreIndexJs.ccenum;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_decoratorNodeJs) {
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_modifyPoseBaseJs) {
      PoseNodeModifyPoseBase = _modifyPoseBaseJs.PoseNodeModifyPoseBase;
    }, function (_solveTwoBoneIkJs) {
      solveTwoBoneIK = _solveTwoBoneIkJs.solveTwoBoneIK;
    }, function (_coreTransformJs) {
      Transform = _coreTransformJs.Transform;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_transformSpaceJs) {
      TransformSpace = _transformSpaceJs.TransformSpace;
    }, function (_menuJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_IK = _menuJs.POSE_GRAPH_NODE_MENU_PREFIX_IK;
    }],
    execute: function () {
      cacheRootTransform = new Transform();
      cacheMiddleTransform = new Transform();
      cacheEndEffectorTransform = new Transform();
      cacheEndEffectorTargetPosition = new Vec3();
      cachePoleTargetPosition = new Vec3();
      cacheTransform_evaluateTarget = new Transform();
      TargetSpecificationType = /*#__PURE__*/function (TargetSpecificationType) {
        /**
         * Targets nothing.
         */
        TargetSpecificationType[TargetSpecificationType["NONE"] = 0] = "NONE";
        /**
         * Targets the specified vector value.
         */
        TargetSpecificationType[TargetSpecificationType["VALUE"] = 1] = "VALUE";
        /**
         * Targets the specified bone.
         */
        TargetSpecificationType[TargetSpecificationType["BONE"] = 2] = "BONE";
        return TargetSpecificationType;
      }(TargetSpecificationType || {});
      ccenum(TargetSpecificationType);
      TargetSpecification = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeTwoBoneIKSolver.TargetSpecification`), _dec2 = type(TargetSpecificationType), _dec3 = visible(function visible() {
        return this.type === TargetSpecificationType.VALUE;
      }), _dec4 = type(TransformSpace), _dec5 = visible(function visible() {
        return this.type === TargetSpecificationType.VALUE;
      }), _dec6 = visible(function visible() {
        return this.type === TargetSpecificationType.BONE;
      }), _dec(_class = (_class2 = class TargetSpecification {
        constructor(type) {
          _initializerDefineProperty(this, "type", _descriptor, this);
          _initializerDefineProperty(this, "targetPosition", _descriptor2, this);
          _initializerDefineProperty(this, "targetPositionSpace", _descriptor3, this);
          _initializerDefineProperty(this, "targetBone", _descriptor4, this);
          this._sourceBoneHandle = undefined;
          this._targetBoneHandle = undefined;
          if (typeof type !== 'undefined') {
            this.type = type;
          }
        }
        bind(context, sourceBoneHandle) {
          this._sourceBoneHandle = sourceBoneHandle;
          if (this.type === TargetSpecificationType.BONE && this.targetBone) {
            var _context$bindTransfor;
            this._targetBoneHandle = (_context$bindTransfor = context.bindTransformByName(this.targetBone)) != null ? _context$bindTransfor : undefined;
          }
        }
        evaluate(outTargetPosition, pose, context) {
          assertIsTrue(this._sourceBoneHandle);
          if (this._targetBoneHandle) {
            pose.transforms.getPosition(this._targetBoneHandle.index, outTargetPosition);
          } else if (this.type === TargetSpecificationType.NONE) {
            pose.transforms.getPosition(this._sourceBoneHandle.index, outTargetPosition);
          } else {
            const targetTransform = Transform.setIdentity(cacheTransform_evaluateTarget);
            targetTransform.position = this.targetPosition;
            context._convertTransformToPoseTransformSpace(targetTransform, this.targetPositionSpace, pose, this._sourceBoneHandle.index);
            Vec3.copy(outTargetPosition, targetTransform.position);
          }
          return outTargetPosition;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "type", [serializable, editable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TargetSpecificationType.VALUE;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "targetPosition", [serializable, editable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "targetPositionSpace", [serializable, editable, _dec4, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TransformSpace.WORLD;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "targetBone", [serializable, editable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class);
      _export("PoseNodeTwoBoneIKSolver", PoseNodeTwoBoneIKSolver = (_dec7 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeTwoBoneIKSolver`), _dec8 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_IK), _dec9 = input({
        type: PoseGraphType.VEC3
      }), _dec0 = visible(function visible() {
        return this.endEffectorTarget.type === TargetSpecificationType.VALUE;
      }), _dec1 = input({
        type: PoseGraphType.VEC3
      }), _dec10 = visible(function visible() {
        return this.poleTarget.type === TargetSpecificationType.VALUE;
      }), _dec7(_class3 = _dec8(_class3 = (_class4 = class PoseNodeTwoBoneIKSolver extends PoseNodeModifyPoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "debug", _descriptor5, this);
          _initializerDefineProperty(this, "endEffectorBoneName", _descriptor6, this);
          _initializerDefineProperty(this, "endEffectorTarget", _descriptor7, this);
          _initializerDefineProperty(this, "poleTarget", _descriptor8, this);
          this._workspace = undefined;
        }
        get endEffectorTargetPosition() {
          return this.endEffectorTarget.targetPosition;
        }
        set endEffectorTargetPosition(value) {
          Vec3.copy(this.endEffectorTarget.targetPosition, value);
        }
        get poleTargetPosition() {
          return this.poleTarget.targetPosition;
        }
        set poleTargetPosition(value) {
          Vec3.copy(this.poleTarget.targetPosition, value);
        }
        bind(context) {
          super.bind(context);
          if (this.endEffectorBoneName) {
            const parentBoneName = context.getParentBoneNameByName(this.endEffectorBoneName);
            const ikRootBoneName = parentBoneName ? context.getParentBoneNameByName(parentBoneName) : '';
            if (parentBoneName && ikRootBoneName) {
              const hEndEffector = context.bindTransformByName(this.endEffectorBoneName);
              const hMiddle = context.bindTransformByName(parentBoneName);
              const hIKRoot = context.bindTransformByName(ikRootBoneName);
              if (!hEndEffector || !hMiddle || !hIKRoot) {
                hEndEffector == null || hEndEffector.destroy();
                hMiddle == null || hMiddle.destroy();
                hIKRoot == null || hIKRoot.destroy();
              } else {
                this.endEffectorTarget.bind(context, hEndEffector);
                this.poleTarget.bind(context, hMiddle);
                this._workspace = new Workspace(hEndEffector, hMiddle, hIKRoot);
              }
            }
          }
        }
        getPoseTransformSpaceRequirement() {
          return PoseTransformSpaceRequirement.COMPONENT;
        }
        modifyPose(context, inputPose, modificationQueue) {
          const {
            _workspace: workspace
          } = this;
          if (!workspace) {
            return;
          }
          const {
            hRoot: {
              index: iRootTransform
            },
            hMiddle: {
              index: iMiddleTransform
            },
            hEndEffector: {
              index: iEndEffectorTransform
            }
          } = workspace;

          // Fetch transforms.
          const rootTransform = inputPose.transforms.getTransform(iRootTransform, cacheRootTransform);
          const middleTransform = inputPose.transforms.getTransform(iMiddleTransform, cacheMiddleTransform);
          const endEffectorTransform = inputPose.transforms.getTransform(iEndEffectorTransform, cacheEndEffectorTransform);
          const endEffectorTargetPosition = this.endEffectorTarget.evaluate(cacheEndEffectorTargetPosition, inputPose, context);
          const poleTargetPosition = this.poleTarget.evaluate(cachePoleTargetPosition, inputPose, context);

          // Solve.
          solveTwoBoneIK(rootTransform, middleTransform, endEffectorTransform, endEffectorTargetPosition, poleTargetPosition, this.debug ? this : undefined);
          modificationQueue.push(iRootTransform, rootTransform);
          modificationQueue.push(iMiddleTransform, middleTransform);
          modificationQueue.push(iEndEffectorTransform, endEffectorTransform);
        }
      }, _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "debug", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "endEffectorBoneName", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "endEffectorTarget", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new TargetSpecification(TargetSpecificationType.VALUE);
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "endEffectorTargetPosition", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class4.prototype, "endEffectorTargetPosition"), _class4.prototype), _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "poleTarget", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new TargetSpecification(TargetSpecificationType.NONE);
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "poleTargetPosition", [_dec1, _dec10], Object.getOwnPropertyDescriptor(_class4.prototype, "poleTargetPosition"), _class4.prototype), _class4)) || _class3) || _class3));
      if (EDITOR) {
        PoseNodeTwoBoneIKSolver.prototype.getTitle = function getTitle() {
          if (this.endEffectorBoneName) {
            return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PoseNodeTwoBoneIKSolver.title`, {
              endEffectorBoneName: this.endEffectorBoneName
            }];
          }
          return undefined;
        };
      }
      Workspace = class Workspace {
        constructor(hEndEffector, hMiddle, hRoot) {
          this.hEndEffector = hEndEffector;
          this.hMiddle = hMiddle;
          this.hRoot = hRoot;
        }
      };
    }
  };
});