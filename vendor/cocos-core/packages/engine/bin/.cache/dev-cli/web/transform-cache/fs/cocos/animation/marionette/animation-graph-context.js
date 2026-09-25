System.register("q-bundled:///fs/cocos/animation/marionette/animation-graph-context.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/utils/asserts.js", "../core/pose.js", "../core/pose-allocator.js", "../core/transform-array.js", "../core/transform.js", "../../core/index.js", "../../core/algorithm/partition.js", "./pose-graph/pose-nodes/transform-space.js", "../core/pose-heap-allocator.js"], function (_export, _context) {
  "use strict";

  var DEBUG, assertIsTrue, PoseTransformSpace, TransformFilter, PoseStackAllocator, TransformArray, Transform, ZERO_DELTA_TRANSFORM, error, partition, TransformSpace, PoseHeapAllocator, AnimationGraphBindingContext, AuxiliaryCurveRegistry, TransformRecord, AuxiliaryCurveRecord, AnimationGraphSettleContext, AnimationGraphEvaluationContext, TransformHandleInternal, AuxiliaryCurveHandleInternal, AnimationGraphUpdateContextGenerator, DeferredPoseStashAllocator, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, cacheTransform, LayoutChangeFlag, checkBindStatus, AnimationGraphPoseLayoutMaintainer, defaultTransformsTag, cacheTransform_spaceConversion, cacheParentTransform_spaceConversion;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * This module contains stuffs related to animation graph's evaluation.
   *
   * The typical workflow to setup a animation graph evaluation is:
   *
   * At binding phase:
   * - Creates a `PoseLayoutMaintainer`.
   * - Creates a `AnimationGraphBindingContext`, which collects animation bindings and report them to the `PoseLayoutMaintainer`.
   * - Binding all portion of the animation graph under such a context.
   *
   * At each evaluation phase:
   * - Creates a (or reuse a) `AnimationGraphEvaluationContext`.
   * - Do the evaluation, generate a pose.
   * - Call `PoseLayoutMaintainer.apply()` to apply the pose into scene graph.
   *
   * When an override-clip request is fired, the binding phase is performed again.
   */

  function findBoneByNameRecursively(from, name) {
    if (from.name === name) {
      return from;
    }
    const nChildren = from.children.length;
    for (let iChild = 0; iChild < nChildren; ++iChild) {
      const found = findBoneByNameRecursively(from.children[iChild], name);
      if (found) {
        return found;
      }
    }
    return null;
  }
  function trimRecords(records) {
    const nUsedRecords = partition(records, record => {
      assertIsTrue(record.refCount >= 0);
      return record.refCount > 0;
    });
    assertIsTrue(nUsedRecords <= records.length);
    if (nUsedRecords === records.length) {
      return;
    }
    // Reassign indices.
    for (let iRecord = 0; iRecord < nUsedRecords; ++iRecord) {
      records[iRecord].handle.index = iRecord;
    }
    // Trim the array.
    if (DEBUG) {
      records.slice(nUsedRecords).forEach(record => record.refCount = -1);
    }
    records.splice(nUsedRecords, records.length - nUsedRecords);
  }
  _export({
    AnimationGraphBindingContext: void 0,
    AuxiliaryCurveRegistry: void 0,
    AnimationGraphSettleContext: void 0,
    AnimationGraphUpdateContextGenerator: void 0,
    DeferredPoseStashAllocator: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_corePoseJs) {
      PoseTransformSpace = _corePoseJs.PoseTransformSpace;
      TransformFilter = _corePoseJs.TransformFilter;
    }, function (_corePoseAllocatorJs) {
      PoseStackAllocator = _corePoseAllocatorJs.PoseStackAllocator;
    }, function (_coreTransformArrayJs) {
      TransformArray = _coreTransformArrayJs.TransformArray;
    }, function (_coreTransformJs) {
      Transform = _coreTransformJs.Transform;
      ZERO_DELTA_TRANSFORM = _coreTransformJs.ZERO_DELTA_TRANSFORM;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
    }, function (_coreAlgorithmPartitionJs) {
      partition = _coreAlgorithmPartitionJs.partition;
    }, function (_poseGraphPoseNodesTransformSpaceJs) {
      TransformSpace = _poseGraphPoseNodesTransformSpaceJs.TransformSpace;
    }, function (_corePoseHeapAllocatorJs) {
      PoseHeapAllocator = _corePoseHeapAllocatorJs.PoseHeapAllocator;
    }],
    execute: function () {
      /**
       * The binding context of an animation graph.
       */
      _export("AnimationGraphBindingContext", AnimationGraphBindingContext = class AnimationGraphBindingContext {
        constructor(origin, poseLayoutMaintainer, varRegistry, _controller) {
          this._origin = void 0;
          this._layoutMaintainer = void 0;
          this._varRegistry = void 0;
          /** At least has one. */
          this._additiveFlagStack = [];
          this._triggerResetter = name => this._resetTrigger(name);
          this._isLayerWideContextPropertiesSet = false;
          this._stashView = void 0;
          this._motionSyncManager = void 0;
          this._clipOverrides = undefined;
          this._controller = _controller;
          this._origin = origin;
          this._layoutMaintainer = poseLayoutMaintainer;
          this._varRegistry = varRegistry;
          this._additiveFlagStack = [false]; // By default, non-additive.
        }

        /**
         * The origin node.
         *
         * The origin node is the origin from where the animation target start to resolve.
         * It's now definitely the node hosting the running animation controller component.
         */
        get origin() {
          return this._origin;
        }

        /**
         * The animation controller component currently running the animation graph.
         */
        get controller() {
          return this._controller;
        }

        /**
         * A free function to reset specified trigger.
         * @internal This function should only be accessed by the builtin state machine.
         */
        get triggerResetter() {
          return this._triggerResetter;
        }
        get clipOverrides() {
          return this._clipOverrides;
        }

        /**
         * Returns if current context expects to have an additive pose.
         */
        get additive() {
          const {
            _additiveFlagStack: additiveFlagStack
          } = this;
          return additiveFlagStack[additiveFlagStack.length - 1];
        }
        bindTransform(bone) {
          const boneNode = this._origin.getChildByPath(bone);
          if (!boneNode) {
            return null;
          }
          return this._layoutMaintainer.getOrCreateTransformBinding(boneNode);
        }
        bindTransformByName(bone) {
          const boneNode = findBoneByNameRecursively(this._origin, bone);
          if (!boneNode) {
            return null;
          }
          return this._layoutMaintainer.getOrCreateTransformBinding(boneNode);
        }
        getBoneChildren(bone) {
          const boneNode = findBoneByNameRecursively(this._origin, bone);
          if (!boneNode) {
            return [];
          }
          return boneNode.children.map(childNode => childNode.name);
        }
        getParentBoneNameByName(bone) {
          var _boneNode$parent;
          const boneNode = findBoneByNameRecursively(this._origin, bone);
          if (!boneNode) {
            return null;
          }
          return boneNode === this._origin ? '' : (_boneNode$parent = boneNode.parent) == null ? void 0 : _boneNode$parent.name;
        }
        bindAuxiliaryCurve(name) {
          return this._layoutMaintainer.getOrCreateAuxiliaryCurveBinding(name);
        }
        getEvaluationTimeAuxiliaryCurveView() {
          return this._layoutMaintainer.auxiliaryCurveRegistry;
        }
        getVar(id) {
          return this._varRegistry[id];
        }

        /**
         * Pushes the `additive` flag. A later `_popAdditiveFlag` is required to pop the change.
         * @internal
         */
        _pushAdditiveFlag(additive) {
          this._additiveFlagStack.push(additive);
        }

        /**
         * Undo last `_pushAdditiveFlag`.
         * @internal
         */
        _popAdditiveFlag() {
          assertIsTrue(this._additiveFlagStack.length > 1);
          this._additiveFlagStack.pop();
        }

        /** @internal */
        _integrityCheck() {
          return this._additiveFlagStack.length === 1;
        }
        get stashView() {
          assertIsTrue(this._stashView);
          return this._stashView;
        }
        get motionSyncManager() {
          assertIsTrue(this._motionSyncManager);
          return this._motionSyncManager;
        }

        /**
         * @internal
         */
        _setLayerWideContextProperties(stashView, motionSyncManager) {
          assertIsTrue(!this._isLayerWideContextPropertiesSet);
          this._isLayerWideContextPropertiesSet = true;
          this._stashView = stashView;
          this._motionSyncManager = motionSyncManager;
        }

        /**
         * @internal
         */
        _unsetLayerWideContextProperties() {
          assertIsTrue(this._isLayerWideContextPropertiesSet);
          this._isLayerWideContextPropertiesSet = false;
          this._stashView = undefined;
          this._motionSyncManager = undefined;
        }

        /**
         * @internal
         */
        _setClipOverrides(clipOverrides) {
          this._clipOverrides = clipOverrides;
        }
        _resetTrigger(triggerName) {
          const varInstance = this._varRegistry[triggerName];
          if (!varInstance) {
            return;
          }
          varInstance.value = false;
        }
      });
      cacheTransform = new Transform();
      _export("AuxiliaryCurveRegistry", AuxiliaryCurveRegistry = class AuxiliaryCurveRegistry {
        constructor() {
          this._namedCurves = new Map();
        }
        names() {
          return this._namedCurves.keys();
        }
        has(name) {
          return this._namedCurves.has(name);
        }
        get(name) {
          var _this$_namedCurves$ge;
          return (_this$_namedCurves$ge = this._namedCurves.get(name)) != null ? _this$_namedCurves$ge : 0.0;
        }
        set(name, value) {
          this._namedCurves.set(name, value);
        }
      });
      _export("LayoutChangeFlag", LayoutChangeFlag = /*#__PURE__*/function (LayoutChangeFlag) {
        /**
         * If this flag is set, means the transform count and order has been changed.
         */
        LayoutChangeFlag[LayoutChangeFlag["TRANSFORM_COUNT"] = 1] = "TRANSFORM_COUNT";
        /**
         * If this flag is set, means the transform count is not change but the order has been changed.
         */
        LayoutChangeFlag[LayoutChangeFlag["TRANSFORM_ORDER"] = 2] = "TRANSFORM_ORDER";
        /**
         * If this flag is set, means the auxiliary curve count has been changed.
         */
        LayoutChangeFlag[LayoutChangeFlag["AUXILIARY_CURVE_COUNT"] = 4] = "AUXILIARY_CURVE_COUNT";
        return LayoutChangeFlag;
      }({}));
      checkBindStatus = (bindStarted = false) => (_, _propertyKey, descriptor) => {
        if (!DEBUG) {
          return;
        }
        const vendor = descriptor.value;
        if (vendor) {
          // eslint-disable-next-line func-names
          descriptor.value = function (...args) {
            assertIsTrue(this._bindStarted === bindStarted, bindStarted ? `The operation is invalid since bind has not been started.` : `The operation is invalid since bind has already been started.`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return vendor.call(this, ...args);
          };
        }
      };
      _export("AnimationGraphPoseLayoutMaintainer", AnimationGraphPoseLayoutMaintainer = (_dec = checkBindStatus(true), _dec2 = checkBindStatus(true), _dec3 = checkBindStatus(true), _dec4 = checkBindStatus(true), _dec5 = checkBindStatus(true), _dec6 = checkBindStatus(false), _dec7 = checkBindStatus(true), _class = class AnimationGraphPoseLayoutMaintainer {
        /**
         * @param origin This node and all nodes under this node can be bound.
         */
        constructor(origin, auxiliaryCurveRegistry) {
          this._origin = void 0;
          this._auxiliaryCurveRegistry = void 0;
          this._auxiliaryCurveRecords = [];
          this._transformRecords = [];
          this._parentTable = [];
          this._bindStarted = false;
          this._transformCountBeforeBind = -1;
          this._auxiliaryCurveCountBeforeBind = -1;
          this._origin = origin;
          this._auxiliaryCurveRegistry = auxiliaryCurveRegistry;
        }
        get transformCount() {
          return this._transformRecords.length;
        }
        get auxiliaryCurveCount() {
          return this._auxiliaryCurveRecords.length;
        }
        get auxiliaryCurveRegistry() {
          return this._auxiliaryCurveRegistry;
        }
        getOrCreateTransformBinding(node) {
          const {
            _origin: origin
          } = this;

          // Ensure the node is origin or under origin.
          let debugIntegrityCheckLengthOfPathToOrigin = 0;
          let isValidNode = false;
          for (let current = node; current; current = current.parent) {
            if (current === origin) {
              isValidNode = true;
              break;
            }
            if (DEBUG) {
              ++debugIntegrityCheckLengthOfPathToOrigin;
            }
          }
          if (!isValidNode) {
            return null;
          }

          // Get or create the handle for the node.
          const handle = this._getOrCreateTransformBinding(node);

          // Also try to create handles for ancestors if we're not bounding origin.
          // In other words, origin is not bound by default
          // except that you explicitly bind to it.
          if (node !== origin) {
            if (DEBUG) {
              --debugIntegrityCheckLengthOfPathToOrigin;
              assertIsTrue(debugIntegrityCheckLengthOfPathToOrigin >= 0);
            }
            for (let parent = node.parent; parent !== origin; parent = parent.parent) {
              assertIsTrue(parent);
              // But discard the result.
              // eslint-disable-next-line no-void
              void this._getOrCreateTransformBinding(parent);
              if (DEBUG) {
                --debugIntegrityCheckLengthOfPathToOrigin;
                assertIsTrue(debugIntegrityCheckLengthOfPathToOrigin >= 0);
              }
            }
          }
          if (DEBUG) {
            assertIsTrue(debugIntegrityCheckLengthOfPathToOrigin === 0);
          }
          return handle;
        }
        _getOrCreateTransformBinding(node) {
          const {
            _transformRecords: transformRecords
          } = this;
          const transformIndex = transformRecords.findIndex(transformRecord => transformRecord.node === node);
          if (transformIndex >= 0) {
            const transformRecord = transformRecords[transformIndex];
            ++transformRecord.refCount;
            return transformRecord.handle;
          }

          // Ensure parent is preceding to children.
          let newNodeIndex = 0;
          for (let parent = node.parent; parent; parent = parent.parent) {
            const parentIndex = transformRecords.findIndex(transformRecord => transformRecord.node === parent);
            if (parentIndex >= 0) {
              newNodeIndex = parentIndex + 1;
              break;
            }
          }

          // Update necessary bone handle.
          for (let transformIndex = newNodeIndex; transformIndex < transformRecords.length; ++transformIndex) {
            ++transformRecords[transformIndex].handle.index;
          }

          // Insert new transform record.
          const transformRecord = new TransformRecord(new TransformHandleInternal(this, newNodeIndex), node);
          transformRecords.splice(newNodeIndex, 0, transformRecord);
          return transformRecord.handle;
        }
        getOrCreateAuxiliaryCurveBinding(name) {
          const {
            _auxiliaryCurveRecords: auxiliaryCurveRecords
          } = this;
          const auxiliaryCurveIndex = auxiliaryCurveRecords.findIndex(record => record.name === name);
          if (auxiliaryCurveIndex >= 0) {
            const auxiliaryCurveRecord = auxiliaryCurveRecords[auxiliaryCurveIndex];
            ++auxiliaryCurveRecord.refCount;
            return auxiliaryCurveRecord.handle;
          } else {
            const newAuxiliaryCurveIndex = auxiliaryCurveRecords.length;
            const auxiliaryCurveRecord = new AuxiliaryCurveRecord(new AuxiliaryCurveHandleInternal(this, newAuxiliaryCurveIndex), name);
            auxiliaryCurveRecords.push(auxiliaryCurveRecord);
            return auxiliaryCurveRecord.handle;
          }
        }
        createEvaluationContext() {
          assertIsTrue(!this._bindStarted);
          return new AnimationGraphEvaluationContext(this.transformCount, this.auxiliaryCurveCount, this._parentTable.slice(), this._origin);
        }
        resetPoseStashAllocator(allocator) {
          assertIsTrue(!this._bindStarted);
          allocator._reset(this.transformCount, this.auxiliaryCurveCount);
        }
        createTransformFilter(mask) {
          const {
            _origin: origin
          } = this;
          const involvedTransformIndices = [];
          for (const {
            node,
            handle
          } of this._transformRecords) {
            const path = countPath(origin, node);
            if (typeof path === 'undefined') {
              error(`${node.getPathInHierarchy()} is not a child of ${origin.getPathInHierarchy()}`);
              // fallthrough
            } else if (mask.isExcluded(path)) {
              continue;
            }
            involvedTransformIndices.push(handle.index);
          }
          involvedTransformIndices.sort();
          const poseFilter = new TransformFilter(involvedTransformIndices);
          return poseFilter;
          function countPath(from, to) {
            const path = [];
            for (let node = to; node; node = node.parent) {
              if (node === from) {
                return path.join('/');
              } else {
                path.unshift(node.name);
              }
            }
            return undefined; // Non-closed.
          }
        }
        fetchDefaultTransforms(transforms) {
          const nTransforms = this._transformRecords.length;
          assertIsTrue(transforms.length === nTransforms);
          for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
            const {
              defaultTransform
            } = this._transformRecords[iTransform];
            transforms.setTransform(iTransform, defaultTransform);
          }
        }
        apply(pose) {
          const {
            transforms,
            auxiliaryCurves
          } = pose;
          const nTransforms = this._transformRecords.length;
          assertIsTrue(transforms.length === nTransforms);
          for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
            const transform = transforms.getTransform(iTransform, cacheTransform);
            const {
              node
            } = this._transformRecords[iTransform];
            node.setRTS(transform.rotation, transform.position, transform.scale);
          }
          const nAuxiliaryCurves = this._auxiliaryCurveRecords.length;
          for (let iAuxiliaryCurve = 0; iAuxiliaryCurve < nAuxiliaryCurves; ++iAuxiliaryCurve) {
            const {
              name: curveName
            } = this._auxiliaryCurveRecords[iAuxiliaryCurve];
            const curveValue = auxiliaryCurves[iAuxiliaryCurve];
            this._auxiliaryCurveRegistry.set(curveName, curveValue);
          }
        }

        /**
         * @engineInternal
         */
        _destroyTransformHandle(index) {
          assertIsTrue(index >= 0 && index < this._transformRecords.length, `Invalid transform handle.`);
          const record = this._transformRecords[index];
          assertIsTrue(record.refCount > 0, `Something work wrong: refCount mismatch.`);
          --record.refCount;
        }

        /**
         * @engineInternal
         */
        _destroyAuxiliaryCurveHandle(index) {
          assertIsTrue(index >= 0 && index < this._auxiliaryCurveRecords.length, `Invalid auxiliary value handle.`);
          const record = this._auxiliaryCurveRecords[index];
          assertIsTrue(record.refCount > 0, `Something work wrong: refCount mismatch.`);
          --record.refCount;
        }
        startBind() {
          this._bindStarted = true;
          this._transformCountBeforeBind = this._transformRecords.length;
          this._auxiliaryCurveCountBeforeBind = this._auxiliaryCurveRecords.length;
        }
        endBind() {
          const {
            _transformRecords: transformRecords,
            _auxiliaryCurveRecords: auxiliaryCurveRecords
          } = this;
          let changeFlags = 0;

          // Detect changes in transforms.
          trimRecords(transformRecords);
          if (transformRecords.length !== this._transformCountBeforeBind) {
            changeFlags |= LayoutChangeFlag.TRANSFORM_COUNT;
            // If the transform's count is changed, we only sync orders.
            const nRecords = transformRecords.length;
            for (let iRecord = 0; iRecord < nRecords; ++iRecord) {
              const record = transformRecords[iRecord];
              record.order = iRecord;
            }
          } else {
            // Sync order and detect change.
            const nRecords = transformRecords.length;
            let orderChanged = false;
            for (let iRecord = 0; iRecord < nRecords; ++iRecord) {
              const record = transformRecords[iRecord];
              if (record.order !== iRecord) {
                orderChanged = true;
                record.order = iRecord;
              }
            }
            if (orderChanged) {
              changeFlags |= LayoutChangeFlag.TRANSFORM_ORDER;
            }
          }

          // Detect changes in auxiliary values.
          trimRecords(auxiliaryCurveRecords);
          if (auxiliaryCurveRecords.length !== this._auxiliaryCurveCountBeforeBind) {
            changeFlags |= LayoutChangeFlag.AUXILIARY_CURVE_COUNT;
          }

          // Reconstruct the parent table.
          const {
            _parentTable: parentTable,
            _origin: origin
          } = this;
          parentTable.length = transformRecords.length;
          for (let iTransform = 0; iTransform < transformRecords.length; ++iTransform) {
            const {
              node
            } = transformRecords[iTransform];
            if (node === origin) {
              parentTable[iTransform] = -1;
              continue;
            }
            const parent = node.parent;
            if (parent === origin) {
              // If the parent is the origin, the origin can be bound or not.
              const parentIndex = transformRecords.findIndex(record => record.node === parent);
              parentTable[iTransform] = parentIndex >= 0 ? parentIndex : -1;
            } else {
              // In other case we have the promise: parent of a node should have also been bound.
              const parentIndex = transformRecords.findIndex(record => record.node === parent);
              assertIsTrue(parentIndex >= 0, `Parent node is not bound!`);
              // This is what we promised and what the evaluation context required.
              assertIsTrue(parentIndex < iTransform);
              parentTable[iTransform] = parentIndex;
            }
          }
          this._bindStarted = false;

          // Do some checks in debug mode.
          if (DEBUG) {
            transformRecords.forEach((transformRecord, index, transformRecords) => {
              assertIsTrue(transformRecord.handle.index === index, `Bad transform handle.`);
              assertIsTrue(transformRecord.order === index, `Bad transform order field.`);

              // Ensure that transforms are sorted so that parent is in front of child.
              for (let parent = transformRecord.node.parent; parent; parent = parent.parent) {
                const parentIndex = transformRecords.findIndex(r => r.node === parent);
                if (parentIndex >= 0) {
                  assertIsTrue(parentIndex < index, `Bad transform order.`);
                }
              }
            });
            this._transformCountBeforeBind = -1;
            this._auxiliaryCurveCountBeforeBind = -1;
          }
          return changeFlags;
        }
      }, _applyDecoratedDescriptor(_class.prototype, "getOrCreateTransformBinding", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "getOrCreateTransformBinding"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "_getOrCreateTransformBinding", [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, "_getOrCreateTransformBinding"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "getOrCreateAuxiliaryCurveBinding", [_dec3], Object.getOwnPropertyDescriptor(_class.prototype, "getOrCreateAuxiliaryCurveBinding"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "_destroyTransformHandle", [_dec4], Object.getOwnPropertyDescriptor(_class.prototype, "_destroyTransformHandle"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "_destroyAuxiliaryCurveHandle", [_dec5], Object.getOwnPropertyDescriptor(_class.prototype, "_destroyAuxiliaryCurveHandle"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "startBind", [_dec6], Object.getOwnPropertyDescriptor(_class.prototype, "startBind"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "endBind", [_dec7], Object.getOwnPropertyDescriptor(_class.prototype, "endBind"), _class.prototype), _class));
      TransformRecord = class TransformRecord {
        constructor(handle, node) {
          /** The order of the transform. */
          this.order = -1;
          this.refCount = 1;
          this.handle = void 0;
          this.node = void 0;
          this.defaultTransform = void 0;
          this.handle = handle;
          this.node = node;
          const defaultTransform = new Transform();
          defaultTransform.position = node.position;
          defaultTransform.rotation = node.rotation;
          defaultTransform.scale = node.scale;
          this.defaultTransform = defaultTransform;
        }
      };
      AuxiliaryCurveRecord = class AuxiliaryCurveRecord {
        constructor(handle, name) {
          this.refCount = 1;
          this.handle = void 0;
          this.name = void 0;
          this.handle = handle;
          this.name = name;
        }
      };
      _export("defaultTransformsTag", defaultTransformsTag = Symbol('[[DefaultTransforms]]'));
      /**
       * The settle context for animation graph building blocks(state machine/pose node/motion...etc).
       */
      _export("AnimationGraphSettleContext", AnimationGraphSettleContext = class AnimationGraphSettleContext {
        constructor(_layoutMaintainer) {
          this._layoutMaintainer = _layoutMaintainer;
        }

        /**
         * Gets the number of transforms in pose.
         */
        get transformCount() {
          return this._layoutMaintainer.transformCount;
        }

        /**
         * Creates a transform filter expressing specified animation mask effect.
         * @param mask Animation mask.
         * @returns Result transform filter.
         */
        createTransformFilter(mask) {
          return this._layoutMaintainer.createTransformFilter(mask);
        }
      });
      cacheTransform_spaceConversion = new Transform();
      cacheParentTransform_spaceConversion = new Transform();
      AnimationGraphEvaluationContext = class AnimationGraphEvaluationContext {
        constructor(transformCount, metaValueCount, parentTable, componentNode) {
          /**
           * @engineInternal
           */
          this[defaultTransformsTag] = void 0;
          this._poseAllocator = void 0;
          this._parentTable = void 0;
          this._componentNode = void 0;
          this._cacheComponentToWorldTransform = new Transform();
          if (DEBUG) {
            assertIsTrue(transformCount === parentTable.length);
            // We requires all parents are in front of children in `parentTable`.
            assertIsTrue(parentTable.every((parentIndex, currentIndex) => {
              if (parentIndex < 0) {
                // Root node
                return true;
              }
              return parentIndex < currentIndex;
            }));
          }
          this._poseAllocator = new PoseStackAllocator(transformCount, metaValueCount);
          this._parentTable = parentTable;
          this._componentNode = componentNode;
          this[defaultTransformsTag] = new TransformArray(transformCount);
        }
        destroy() {
          this._poseAllocator.destroy();
        }
        get allocatedPoseCount() {
          return this._poseAllocator.allocatedCount;
        }
        get parentTable() {
          return this._parentTable;
        }
        pushDefaultedPose() {
          const pose = this._poseAllocator.push();
          pose.transforms.set(this[defaultTransformsTag]);
          pose._poseTransformSpace = PoseTransformSpace.LOCAL;
          pose.auxiliaryCurves.fill(0.0);
          return pose;
        }
        pushDefaultedPoseInComponentSpace() {
          const pose = this.pushDefaultedPose();
          this._poseTransformsSpaceLocalToComponent(pose);
          return pose;
        }
        pushZeroDeltaPose() {
          const pose = this._poseAllocator.push();
          pose.transforms.fill(ZERO_DELTA_TRANSFORM);
          pose._poseTransformSpace = PoseTransformSpace.LOCAL;
          pose.auxiliaryCurves.fill(0.0);
          return pose;
        }
        pushDuplicatedPose(src) {
          const pose = this._poseAllocator.push();
          pose.transforms.set(src.transforms);
          pose._poseTransformSpace = src._poseTransformSpace;
          pose.auxiliaryCurves.set(src.auxiliaryCurves);
          return pose;
        }
        popPose() {
          this._poseAllocator.pop();
        }

        /**
         * @internal
         */
        get _stackSize_debugging() {
          return this._poseAllocator.allocatedCount;
        }

        /**
         * @internal
         */
        _isStackTopPose_debugging(pose) {
          return pose === this._poseAllocator.top;
        }

        /** @internal */
        _poseTransformsSpaceLocalToComponent(pose) {
          const {
            transforms
          } = pose;
          const {
            length: nTransforms
          } = transforms;
          for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
            const parentTransformIndex = this._parentTable[iTransform];
            if (parentTransformIndex < 0) {
              // Root node
              continue;
            }
            const transform = transforms.getTransform(iTransform, cacheTransform_spaceConversion);
            const parentTransform = transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
            Transform.multiply(transform, parentTransform, transform);
            transforms.setTransform(iTransform, transform);
          }
          pose._poseTransformSpace = PoseTransformSpace.COMPONENT;
        }

        /** @internal */
        _poseTransformsSpaceComponentToLocal(pose) {
          const {
            transforms
          } = pose;
          const {
            length: nTransforms
          } = transforms;
          for (let iTransform = nTransforms - 1; iTransform >= 0; --iTransform) {
            const parentTransformIndex = this._parentTable[iTransform];
            if (parentTransformIndex < 0) {
              // Root node
              continue;
            }
            const transform = transforms.getTransform(iTransform, cacheTransform_spaceConversion);
            const parentTransform = transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
            Transform.calculateRelative(transform, transform, parentTransform);
            transforms.setTransform(iTransform, transform);
          }
          pose._poseTransformSpace = PoseTransformSpace.LOCAL;
        }
        _convertPoseSpaceTransformToTargetSpace(transform, outTransformSpace, pose, poseTransformIndex) {
          const poseSpace = pose._poseTransformSpace;
          switch (outTransformSpace) {
            default:
              if (DEBUG) {
                assertIsTrue(false);
              }
              break;
            case TransformSpace.WORLD:
              if (poseSpace === PoseTransformSpace.COMPONENT) {
                // Component -> World.
                Transform.multiply(transform, this._getComponentToWorldTransform(), transform);
              } else {
                assertIsTrue(poseSpace === PoseTransformSpace.LOCAL);
                // Local -> World.
                Transform.multiply(transform, this._getLocalToWorldTransform(cacheParentTransform_spaceConversion, pose, poseTransformIndex), transform);
              }
              break;
            case TransformSpace.COMPONENT:
              if (poseSpace === PoseTransformSpace.COMPONENT) {
                // The transform is already in component.
              } else {
                assertIsTrue(poseSpace === PoseTransformSpace.LOCAL);
                // Local -> Component.
                Transform.multiply(transform, this._getLocalToComponentTransform(cacheParentTransform_spaceConversion, pose, poseTransformIndex), transform);
              }
              break;
            case TransformSpace.PARENT:
              {
                if (poseSpace === PoseTransformSpace.COMPONENT) {
                  // Component -> Parent.
                  // Parent_Component_Transform * result = Component
                  // result = inv(Component_Transform_of_Parent) * component
                  const parentTransformIndex = this._parentTable[poseTransformIndex];
                  if (parentTransformIndex >= 0) {
                    const parentComponentTransform = pose.transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
                    const invParentComponentTransform = Transform.invert(parentComponentTransform, parentComponentTransform);
                    Transform.multiply(transform, invParentComponentTransform, transform);
                  }
                } else {
                  assertIsTrue(poseSpace === PoseTransformSpace.LOCAL);
                  // Local -> Parent.
                  // The transform is already under parent.
                }
                break;
              }
            case TransformSpace.LOCAL:
              {
                // Local -> *
                // Bone_Local_Transform * result = input
                // result = inv(Bone_Local_Transform) * input
                assertIsTrue(poseSpace === PoseTransformSpace.COMPONENT || poseSpace === PoseTransformSpace.LOCAL);
                const boneTransform = pose.transforms.getTransform(poseTransformIndex, cacheParentTransform_spaceConversion);
                const invBoneTransform = Transform.invert(boneTransform, boneTransform);
                Transform.multiply(transform, invBoneTransform, transform);
                break;
              }
          }
          return transform;
        }
        _convertTransformToPoseTransformSpace(transform, transformSpace, pose, poseTransformIndex) {
          const poseSpace = pose._poseTransformSpace;
          switch (transformSpace) {
            default:
              if (DEBUG) {
                assertIsTrue(false);
              }
              break;
            case TransformSpace.WORLD:
              if (poseSpace === PoseTransformSpace.COMPONENT) {
                // World -> Component.
                const worldToComponent = Transform.invert(cacheParentTransform_spaceConversion, this._getComponentToWorldTransform());
                Transform.multiply(transform, worldToComponent, transform);
              } else {
                assertIsTrue(poseSpace === PoseTransformSpace.LOCAL);
                // World -> Local.
                const localToWorld = this._getLocalToWorldTransform(cacheParentTransform_spaceConversion, pose, poseTransformIndex);
                const worldToLocal = Transform.invert(localToWorld, localToWorld);
                Transform.multiply(transform, worldToLocal, transform);
              }
              break;
            case TransformSpace.COMPONENT:
              if (poseSpace === PoseTransformSpace.COMPONENT) {
                // Identity.
              } else {
                assertIsTrue(poseSpace === PoseTransformSpace.LOCAL);
                // Component -> Local.
                const localToComponent = this._getLocalToComponentTransform(cacheParentTransform_spaceConversion, pose, poseTransformIndex);
                const componentToLocal = Transform.invert(localToComponent, localToComponent);
                Transform.multiply(transform, componentToLocal, transform);
              }
              break;
            case TransformSpace.PARENT:
              {
                if (poseSpace === PoseTransformSpace.COMPONENT) {
                  // Parent -> Component.
                  const parentTransformIndex = this._parentTable[poseTransformIndex];
                  if (parentTransformIndex >= 0) {
                    const parentTransform = pose.transforms.getTransform(parentTransformIndex, cacheParentTransform_spaceConversion);
                    Transform.multiply(transform, parentTransform, transform);
                  }
                } else {
                  // Parent -> Local.
                  // The transform is already in local space.
                }
                break;
              }
            case TransformSpace.LOCAL:
              {
                assertIsTrue(poseSpace === PoseTransformSpace.COMPONENT || poseSpace === PoseTransformSpace.LOCAL);
                // Bone_Local_Transform * result = input
                // result = inv(Bone_Local_Transform) * input
                const currentTransform = pose.transforms.getTransform(poseTransformIndex, cacheParentTransform_spaceConversion);
                Transform.multiply(transform, currentTransform, transform);
                break;
              }
          }
          return transform;
        }
        _getComponentToWorldTransform() {
          const result = this._cacheComponentToWorldTransform;
          const componentNode = this._componentNode;
          result.position = componentNode.worldPosition;
          result.rotation = componentNode.worldRotation;
          result.scale = componentNode.worldScale;
          return result;
        }
        _getLocalToComponentTransform(out, pose, transformIndex) {
          const {
            _parentTable: parentTable
          } = this;
          Transform.setIdentity(out);
          for (let iTransform = parentTable[transformIndex]; iTransform >= 0; iTransform = parentTable[iTransform]) {
            const localTransform = pose.transforms.getTransform(iTransform, cacheTransform_spaceConversion);
            Transform.multiply(out, localTransform, out);
          }
          return out;
        }
        _getLocalToWorldTransform(out, pose, transformIndex) {
          this._getLocalToComponentTransform(out, pose, transformIndex);
          Transform.multiply(out, this._getComponentToWorldTransform(), out);
          return out;
        }
      };
      TransformHandleInternal = class TransformHandleInternal {
        constructor(host, index) {
          this.index = -1;
          this._host = void 0;
          this._host = host;
          this.index = index;
        }
        destroy() {
          this._host._destroyTransformHandle(this.index);
        }
      };
      AuxiliaryCurveHandleInternal = class AuxiliaryCurveHandleInternal {
        constructor(host, index) {
          this.index = -1;
          this._host = void 0;
          this._host = host;
          this.index = index;
        }
        destroy() {
          this._host._destroyAuxiliaryCurveHandle(this.index);
        }
      };
      /**
       * The update context for animation graph building blocks(state machine/pose node/motion...etc).
       */
      /**
       * Utility class to generate animation graph context.
       *
       * The result of each method of this class is kept available until next call on any of these methods.
       */
      _export("AnimationGraphUpdateContextGenerator", AnimationGraphUpdateContextGenerator = class AnimationGraphUpdateContextGenerator {
        constructor() {
          this._context = {
            deltaTime: 0.0,
            indicativeWeight: 0.0
          };
        }
        /**
         * Generates a context which has specified attributes.
         * @param deltaTime The result context's `.deltaTime`.
         * @param indicativeWeight The result context's `.indicativeWeight`.
         * @returns The result context.
         */
        generate(deltaTime, indicativeWeight) {
          this._context.deltaTime = deltaTime;
          this._context.indicativeWeight = indicativeWeight;
          return this._context;
        }

        /**
         * Forks specified `base` context so that the result context is same with the base
         * except that the result indicative weight is taken from base and multiplied by `subWeight`.
         * @param base The base context.
         * @param subWeight The sub weight.
         * @returns The result context.
         */
        forkSubWeight(base, subWeight) {
          this._context.deltaTime = base.deltaTime;
          this._context.indicativeWeight = base.indicativeWeight * subWeight;
        }
      });
      _export("DeferredPoseStashAllocator", DeferredPoseStashAllocator = class DeferredPoseStashAllocator {
        constructor() {
          this._allocator = null;
        }
        get allocatedPoseCount() {
          assertIsTrue(this._allocator);
          return this._allocator.allocatedCount;
        }

        /** @internal */
        _reset(transformCount, auxiliaryCurveCount) {
          this._allocator = new PoseHeapAllocator(transformCount, auxiliaryCurveCount);
        }
        allocatePose() {
          assertIsTrue(this._allocator);
          const pose = this._allocator.allocatePose();
          return pose;
        }
        destroyPose(pose) {
          assertIsTrue(this._allocator);
          return this._allocator.destroyPose(pose);
        }
      });
    }
  };
});