System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/modify-pose-base.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/data/decorators/index.js", "../../../define.js", "../pose-node.js", "../decorator/input.js", "../decorator/node.js", "../../../core/pose.js", "../foundation/type-system.js", "../../../../core/index.js", "../../../core/transform.js"], function (_export, _context) {
  "use strict";

  var DEBUG, ccclass, serializable, CLASS_NAME_PREFIX_ANIM, PoseNode, input, poseGraphNodeHide, PoseTransformSpace, PoseGraphType, assertIsTrue, CachedArray, Pool, Transform, TransformModification, TransformModificationQueue, PoseTransformSpaceFlagTable, _dec, _dec2, _dec3, _class, _class2, _descriptor, cacheTransform_spaceConversion, cacheParentTransform_spaceConversion, PoseNodeModifyPoseBase;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function applyTransformModificationQueue(context, pose, queue, spaceFlagTable) {
    const nMods = queue.length;
    if (nMods === 0) {
      return;
    }
    if (DEBUG) {
      let debugLastModTransformIndex = -1;
      for (let iMod = 0; iMod < nMods; ++iMod) {
        const {
          transformIndex
        } = queue.array[iMod];
        // Ensure the modifications are queued from parent to child.
        assertIsTrue(transformIndex > debugLastModTransformIndex);
        debugLastModTransformIndex = transformIndex;
      }
    }

    // In case of local space pose, no space conversion needed.
    if (pose._poseTransformSpace === PoseTransformSpace.LOCAL) {
      for (let iMod = 0; iMod < nMods; ++iMod) {
        const {
          transformIndex,
          transform
        } = queue.array[iMod];
        pose.transforms.setTransform(transformIndex, transform);
      }
      return;
    }
    assertIsTrue(pose._poseTransformSpace === PoseTransformSpace.COMPONENT);

    // In the following, the flag of a transform is defined as:
    // - False if it's in component space,
    // - True if it's in local space or is component space but need to be converted into local space.

    // At initial, all transforms are in component space.
    spaceFlagTable.clear();

    // From parent to child, collect all transforms needs to be converted into local space.
    const firstTransformToConvert = queue.array[0].transformIndex;
    let lastTransformToConvert = firstTransformToConvert;
    for (let iMod = 0; iMod < nMods; ++iMod) {
      const {
        transformIndex
      } = queue.array[iMod];
      spaceFlagTable.set(transformIndex); // Set as "need to be converted".
      lastTransformToConvert = transformIndex;
    }
    for (let transformIndex = firstTransformToConvert; transformIndex < pose.transforms.length; ++transformIndex) {
      const parentTransformIndex = context.parentTable[transformIndex];
      if (parentTransformIndex < 0) {
        continue;
      }
      // If parent need be converted, then the child need to be converted to.
      if (spaceFlagTable.test(parentTransformIndex)) {
        spaceFlagTable.set(transformIndex); // Set as "need to be converted".
        lastTransformToConvert = transformIndex;
      }
    }

    // From child to parent, convert transforms in to local space.
    // Now the "need to be converted" flags are turned into "in local space".
    for (let transformIndex = lastTransformToConvert; transformIndex >= firstTransformToConvert; --transformIndex) {
      if (spaceFlagTable.test(transformIndex)) {
        const parentTransformIndex = context.parentTable[transformIndex];
        if (parentTransformIndex >= 0) {
          const transform = pose.transforms.getTransform(transformIndex, cacheTransform_spaceConversion);
          const parentTransform = pose.transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
          Transform.calculateRelative(transform, transform, parentTransform);
          pose.transforms.setTransform(transformIndex, transform);
        }
      }
    }

    // From parent to child, apply modifications, these modified transforms are now in component space.
    for (let iMod = 0; iMod < nMods; ++iMod) {
      const {
        transformIndex,
        transform
      } = queue.array[iMod];
      pose.transforms.setTransform(transformIndex, transform);
      spaceFlagTable.unset(transformIndex); // Set as "in component space".
    }

    // Finally, from parent to child, recalculate component space back.
    for (let transformIndex = firstTransformToConvert; transformIndex <= lastTransformToConvert; ++transformIndex) {
      if (spaceFlagTable.test(transformIndex)) {
        const parentTransformIndex = context.parentTable[transformIndex];
        assertIsTrue(parentTransformIndex >= 0); // These changes should all be children of transforms in modification queue.
        const transform = pose.transforms.getTransform(transformIndex, cacheTransform_spaceConversion);
        const parentTransform = pose.transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
        Transform.multiply(transform, parentTransform, transform);
        pose.transforms.setTransform(transformIndex, transform);
      }
    }
  }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_decoratorNodeJs) {
      poseGraphNodeHide = _decoratorNodeJs.poseGraphNodeHide;
    }, function (_corePoseJs) {
      PoseTransformSpace = _corePoseJs.PoseTransformSpace;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      CachedArray = _coreIndexJs.CachedArray;
      Pool = _coreIndexJs.Pool;
    }, function (_coreTransformJs) {
      Transform = _coreTransformJs.Transform;
    }],
    execute: function () {
      TransformModification = class TransformModification {
        constructor() {
          this.transformIndex = -1;
          this.transform = new Transform();
        }
      };
      TransformModificationQueue = class TransformModificationQueue {
        constructor() {
          this._pool = new Pool(() => new TransformModification(), 3);
          this._array = new CachedArray(3);
          this._debugLastTransformIndex = -1;
        }
        get length() {
          return this._array.length;
        }
        get array() {
          return this._array.array;
        }
        push(transformIndex, transform) {
          if (DEBUG) {
            assertIsTrue(transformIndex > this._debugLastTransformIndex, `Unexpected transform modification order`);
            this._debugLastTransformIndex = transformIndex;
          }
          const mod = this._pool.alloc();
          mod.transformIndex = transformIndex;
          Transform.copy(mod.transform, transform);
          this._array.push(mod);
        }
        clear() {
          const length = this._array.length;
          for (let iMod = 0; iMod < length; ++iMod) {
            const mod = this._array.get(iMod);
            assertIsTrue(mod);
            this._pool.free(mod);
          }
          this._array.clear();
          if (DEBUG) {
            this._debugLastTransformIndex = -1;
          }
        }
      };
      PoseTransformSpaceFlagTable = class PoseTransformSpaceFlagTable {
        constructor(nTransforms) {
          this._transformFlags = [];
          this._transformFlags = new Array(nTransforms);
        }

        /**
         * Set all transforms' flags to false.
         */
        clear() {
          this._transformFlags.fill(false);
        }

        /**
         * Test if the transform's flag is set to true.
         * @param transformIndex Transform index.
         * @returns True if the transform's flag is set to true.
         */
        test(transformIndex) {
          return this._transformFlags[transformIndex];
        }

        /**
         * Sets the transform's flag to true.
         * @param transformIndex Transform index.
         */
        set(transformIndex) {
          this._transformFlags[transformIndex] = true;
        }

        /**
         * Sets the transform's flag to false.
         * @param transformIndex Transform index.
         */
        unset(transformIndex) {
          this._transformFlags[transformIndex] = false;
        }
      };
      cacheTransform_spaceConversion = new Transform();
      cacheParentTransform_spaceConversion = new Transform();
      _export("PoseNodeModifyPoseBase", PoseNodeModifyPoseBase = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeModifyPoseBase`), _dec2 = poseGraphNodeHide(), _dec3 = input({
        type: PoseGraphType.POSE
      }), _dec(_class = _dec2(_class = (_class2 = class PoseNodeModifyPoseBase extends PoseNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "pose", _descriptor, this);
          this._modificationQueue = new TransformModificationQueue();
          this._spaceFlagTable = new PoseTransformSpaceFlagTable(0);
        }
        settle(context) {
          var _this$pose;
          (_this$pose = this.pose) == null || _this$pose.settle(context);
          this._spaceFlagTable = new PoseTransformSpaceFlagTable(context.transformCount);
        }
        reenter() {
          var _this$pose2;
          (_this$pose2 = this.pose) == null || _this$pose2.reenter();
        }
        bind(context) {
          var _this$pose3;
          (_this$pose3 = this.pose) == null || _this$pose3.bind(context);
        }
        doUpdate(context) {
          var _this$pose4;
          (_this$pose4 = this.pose) == null || _this$pose4.update(context);
        }
        doEvaluate(context) {
          var _this$pose$evaluate, _this$pose5;
          const poseTransformSpaceRequirement = this.getPoseTransformSpaceRequirement();
          const inputPose = (_this$pose$evaluate = (_this$pose5 = this.pose) == null ? void 0 : _this$pose5.evaluate(context, poseTransformSpaceRequirement)) != null ? _this$pose$evaluate : PoseNode.evaluateDefaultPose(context, poseTransformSpaceRequirement);
          const {
            _modificationQueue: modificationQueue
          } = this;
          assertIsTrue(modificationQueue.length === 0);
          this.modifyPose(context, inputPose, modificationQueue);
          applyTransformModificationQueue(context, inputPose, modificationQueue, this._spaceFlagTable);
          modificationQueue.clear();
          return inputPose;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "pose", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class));
    }
  };
});