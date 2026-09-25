System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/apply-transform.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/data/decorators/index.js", "../../../define.js", "../pose-node.js", "../decorator/input.js", "../../../../core/index.js", "../decorator/node.js", "./menu-common.js", "./intensity-specification.js", "./modify-pose-base.js", "../foundation/type-system.js", "./transform-space.js", "../../../core/transform.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editable, range, serializable, type, visible, CLASS_NAME_PREFIX_ANIM, PoseTransformSpaceRequirement, input, approx, ccenum, error, Quat, Vec3, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE, IntensitySpecification, PoseNodeModifyPoseBase, PoseGraphType, TransformSpace, Transform, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, TransformOperation, APPLY_INTENSITY_EPSILON, cacheTransform, PoseNodeApplyTransform, replacePosition, addPosition, replaceRotation, addRotation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_poseNodeJs) {
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_coreIndexJs) {
      approx = _coreIndexJs.approx;
      ccenum = _coreIndexJs.ccenum;
      error = _coreIndexJs.error;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE;
    }, function (_intensitySpecificationJs) {
      IntensitySpecification = _intensitySpecificationJs.IntensitySpecification;
    }, function (_modifyPoseBaseJs) {
      PoseNodeModifyPoseBase = _modifyPoseBaseJs.PoseNodeModifyPoseBase;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_transformSpaceJs) {
      TransformSpace = _transformSpaceJs.TransformSpace;
    }, function (_coreTransformJs) {
      Transform = _coreTransformJs.Transform;
    }],
    execute: function () {
      _export("TransformOperation", TransformOperation = /*#__PURE__*/function (TransformOperation) {
        TransformOperation[TransformOperation["LEAVE_UNCHANGED"] = 0] = "LEAVE_UNCHANGED";
        TransformOperation[TransformOperation["REPLACE"] = 1] = "REPLACE";
        TransformOperation[TransformOperation["ADD"] = 2] = "ADD";
        return TransformOperation;
      }({}));
      ccenum(TransformOperation);
      APPLY_INTENSITY_EPSILON = 1e-5;
      cacheTransform = new Transform();
      _export("PoseNodeApplyTransform", PoseNodeApplyTransform = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeApplyTransform`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec4 = type(TransformOperation), _dec5 = input({
        type: PoseGraphType.VEC3
      }), _dec6 = visible(function visible() {
        return this.positionOperation !== TransformOperation.LEAVE_UNCHANGED;
      }), _dec7 = type(TransformOperation), _dec8 = input({
        type: PoseGraphType.QUAT
      }), _dec9 = visible(function visible() {
        return this.rotationOperation !== TransformOperation.LEAVE_UNCHANGED;
      }), _dec0 = range([0.0, 1.0, 0.01]), _dec1 = type(TransformSpace), _dec10 = input({
        type: PoseGraphType.FLOAT
      }), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeApplyTransform extends PoseNodeModifyPoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "node", _descriptor, this);
          _initializerDefineProperty(this, "positionOperation", _descriptor2, this);
          _initializerDefineProperty(this, "position", _descriptor3, this);
          _initializerDefineProperty(this, "rotationOperation", _descriptor4, this);
          _initializerDefineProperty(this, "rotation", _descriptor5, this);
          _initializerDefineProperty(this, "intensity", _descriptor6, this);
          _initializerDefineProperty(this, "transformSpace", _descriptor7, this);
          this._transformHandle = null;
        }
        get intensityValue() {
          return this.intensity.value;
        }
        set intensityValue(value) {
          this.intensity.value = value;
        }
        bind(context) {
          const {
            node: nodeName
          } = this;
          super.bind(context);
          if (!nodeName) {
            return;
          }
          const transformHandle = context.bindTransformByName(nodeName);
          if (!transformHandle) {
            error(`Failed to bind transform ${nodeName}`);
            return;
          }
          this._transformHandle = transformHandle;
          this.intensity.bind(context);
        }
        getPoseTransformSpaceRequirement() {
          return PoseTransformSpaceRequirement.NO;
        }
        modifyPose(context, inputPose, modificationQueue) {
          const {
            _transformHandle: transformHandle
          } = this;
          if (!transformHandle) {
            return inputPose;
          }
          const intensity = this.intensity.evaluate(inputPose);

          // If intensity is too small. Takes no effect.
          if (intensity < APPLY_INTENSITY_EPSILON) {
            return inputPose;
          }
          const fullIntensity = approx(intensity, 1.0, APPLY_INTENSITY_EPSILON);
          const {
            index: transformIndex
          } = transformHandle;
          const nodeTransform = inputPose.transforms.getTransform(transformIndex, cacheTransform);
          const {
            rotationOperation
          } = this;
          if (rotationOperation !== TransformOperation.LEAVE_UNCHANGED) {
            const {
              rotation,
              transformSpace: rotationSpace
            } = this;
            context._convertPoseSpaceTransformToTargetSpace(nodeTransform, rotationSpace, inputPose, transformIndex);
            switch (rotationOperation) {
              default:
              case TransformOperation.REPLACE:
                replaceRotation(nodeTransform, rotation, intensity, fullIntensity);
                break;
              case TransformOperation.ADD:
                addRotation(nodeTransform, rotation, intensity, fullIntensity);
                break;
            }
            context._convertTransformToPoseTransformSpace(nodeTransform, rotationSpace, inputPose, transformIndex);
          }
          const {
            positionOperation
          } = this;
          if (positionOperation !== TransformOperation.LEAVE_UNCHANGED) {
            const {
              position,
              transformSpace: positionSpace
            } = this;
            context._convertPoseSpaceTransformToTargetSpace(nodeTransform, positionSpace, inputPose, transformIndex);
            switch (positionOperation) {
              default:
              case TransformOperation.REPLACE:
                replacePosition(nodeTransform, position, intensity, fullIntensity);
                break;
              case TransformOperation.ADD:
                addPosition(nodeTransform, position, intensity, fullIntensity);
                break;
            }
            context._convertTransformToPoseTransformSpace(nodeTransform, positionSpace, inputPose, transformIndex);
          }
          modificationQueue.push(transformIndex, nodeTransform);
          return inputPose;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "node", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "positionOperation", [serializable, editable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TransformOperation.LEAVE_UNCHANGED;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "position", [serializable, editable, _dec5, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "rotationOperation", [serializable, editable, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TransformOperation.LEAVE_UNCHANGED;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "rotation", [serializable, editable, _dec8, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Quat();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "intensity", [serializable, editable, _dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new IntensitySpecification();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "transformSpace", [serializable, editable, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TransformSpace.WORLD;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "intensityValue", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "intensityValue"), _class2.prototype), _class2)) || _class) || _class) || _class));
      ({
        replace: replacePosition,
        add: addPosition
      } = (() => {
        const cacheInput = new Vec3();
        const cacheResult = new Vec3();
        return {
          replace,
          add
        };
        function replace(transform, value, intensity, fullIntensity) {
          if (fullIntensity) {
            transform.position = value;
          } else {
            const inputPosition = Vec3.copy(cacheInput, transform.position);
            Vec3.lerp(inputPosition, inputPosition, value, intensity);
            transform.position = inputPosition;
          }
        }
        function add(transform, value, intensity, fullIntensity) {
          const result = cacheResult;
          if (fullIntensity) {
            Vec3.copy(result, value);
          } else {
            Vec3.slerp(result, Vec3.ZERO, value, intensity);
          }
          Vec3.add(result, transform.position, result);
          transform.position = result;
        }
      })());
      ({
        replace: replaceRotation,
        add: addRotation
      } = (() => {
        const cacheInput = new Quat();
        const cacheResult = new Quat();
        return {
          replace,
          add
        };
        function replace(transform, value, intensity, fullIntensity) {
          if (fullIntensity) {
            transform.rotation = value;
          } else {
            const inputRotation = Quat.copy(cacheInput, transform.rotation);
            Quat.slerp(inputRotation, inputRotation, value, intensity);
            transform.rotation = inputRotation;
          }
        }
        function add(transform, value, intensity, fullIntensity) {
          const inputRotation = Quat.copy(cacheInput, transform.rotation);
          const resultRotation = cacheResult;
          if (fullIntensity) {
            Quat.copy(resultRotation, value);
          } else {
            Quat.slerp(resultRotation, Quat.IDENTITY, value, intensity);
          }
          Quat.multiply(resultRotation, resultRotation, inputRotation);
          transform.rotation = resultRotation;
        }
      })());
      if (EDITOR) {
        PoseNodeApplyTransform.prototype.getTitle = function getTitle() {
          if (this.node) {
            return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PoseNodeApplyTransform.title`, {
              nodeName: this.node
            }];
          }
          return undefined;
        };
      }
    }
  };
});