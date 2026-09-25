System.register("q-bundled:///fs/cocos/animation/core/pose.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/data/utils/asserts.js", "./transform.js"], function (_export, _context) {
  "use strict";

  var DEBUG, lerp, assertIsTrue, Transform, __applyDeltaTransform, __calculateDeltaTransform, Pose, TransformFilter, PoseTransformSpace, blendIntoTransformArrayAt, calculateDeltaTransformArrayAt, applyDeltaTransformArrayAt;
  function blendPoseInto(target, source, alpha, transformFilter = undefined) {
    blendTransformsInto(target.transforms, source.transforms, alpha, transformFilter);
    blendAuxiliaryCurvesInto(target.auxiliaryCurves, source.auxiliaryCurves, alpha);
  }
  function blendTransformsInto(target, source, alpha, transformFilter = undefined) {
    const nTransforms = target.length;
    assertIsTrue(nTransforms === target.length);
    if (alpha === 0) {
      return;
    } else if (alpha === 1) {
      if (!transformFilter) {
        target.set(source);
      } else {
        copyTransformsWithFilter(target, source, transformFilter);
      }
      return;
    }
    if (!transformFilter) {
      // Fast path.
      for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
        blendIntoTransformArrayAt(target, source, alpha, iTransform);
      }
    } else {
      // TODO: cannot use for-of statement for Readonly ArrayBuffer on TS 4.2 for OH platform, wait for they upgrade TS version.
      // issue: https://github.com/cocos/cocos-engine/issues/14715
      for (let index = 0; index < transformFilter.involvedTransforms.length; ++index) {
        const involvedTransformIndex = transformFilter.involvedTransforms[index];
        blendIntoTransformArrayAt(target, source, alpha, involvedTransformIndex);
      }
    }
  }
  function copyTransformsWithFilter(target, source, filter) {
    const nTransforms = target.length;
    assertIsTrue(nTransforms === target.length);
    // TODO: cannot use for-of statement for Readonly ArrayBuffer on TS 4.2 for OH platform, wait for they upgrade TS version.
    // issue: https://github.com/cocos/cocos-engine/issues/14715
    for (let index = 0; index < filter.involvedTransforms.length; ++index) {
      const involvedTransformIndex = filter.involvedTransforms[index];
      target.copyRange(involvedTransformIndex, source, involvedTransformIndex, 1);
    }
  }
  function blendAuxiliaryCurvesInto(target, source, alpha) {
    const nValues = source.length;
    assertIsTrue(nValues === target.length);
    for (let iValue = 0; iValue < nValues; ++iValue) {
      target[iValue] = lerp(target[iValue], source[iValue], alpha);
    }
  }
  function calculateDeltaPose(target, base) {
    calculateDeltaTransforms(target.transforms, base.transforms);
    calculateDeltaAuxiliaryCurves(target.auxiliaryCurves, base.auxiliaryCurves);
  }
  function calculateDeltaTransforms(target, base) {
    const nTransforms = target.length;
    assertIsTrue(nTransforms === base.length);
    for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
      calculateDeltaTransformArrayAt(target, base, iTransform);
    }
  }
  function calculateDeltaAuxiliaryCurves(target, base) {
    const nAuxiliaryCurves = target.length;
    assertIsTrue(nAuxiliaryCurves === base.length);
    for (let i = 0; i < target.length; ++i) {
      target[i] -= base[i];
    }
  }
  function applyDeltaPose(target, base, alpha, transformFilter = undefined) {
    applyDeltaTransforms(target.transforms, base.transforms, alpha, transformFilter);
    applyDeltaAuxiliaryCurves(target.auxiliaryCurves, base.auxiliaryCurves, alpha);
  }
  function applyDeltaTransforms(target, delta, alpha, transformFilter = undefined) {
    const nTransforms = target.length;
    assertIsTrue(nTransforms === delta.length);
    if (!transformFilter) {
      for (let iTransform = 0; iTransform < nTransforms; ++iTransform) {
        applyDeltaTransformArrayAt(target, delta, alpha, iTransform);
      }
    } else {
      // TODO: cannot use for-of statement for Readonly ArrayBuffer on TS 4.2 for OH platform, wait for they upgrade TS version.
      // issue: https://github.com/cocos/cocos-engine/issues/14715
      for (let index = 0; index < transformFilter.involvedTransforms.length; ++index) {
        const transformIndex = transformFilter.involvedTransforms[index];
        applyDeltaTransformArrayAt(target, delta, alpha, transformIndex);
      }
    }
  }
  function applyDeltaAuxiliaryCurves(target, delta, alpha) {
    const nAuxiliaryCurves = target.length;
    assertIsTrue(nAuxiliaryCurves === delta.length);
    for (let i = 0; i < target.length; ++i) {
      target[i] += delta[i] * alpha;
    }
  }
  _export({
    Pose: void 0,
    TransformFilter: void 0,
    blendPoseInto: blendPoseInto,
    blendTransformsInto: blendTransformsInto,
    blendAuxiliaryCurvesInto: blendAuxiliaryCurvesInto,
    calculateDeltaPose: calculateDeltaPose,
    calculateDeltaTransforms: calculateDeltaTransforms,
    calculateDeltaAuxiliaryCurves: calculateDeltaAuxiliaryCurves,
    applyDeltaPose: applyDeltaPose,
    applyDeltaTransforms: applyDeltaTransforms,
    applyDeltaAuxiliaryCurves: applyDeltaAuxiliaryCurves
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      lerp = _coreIndexJs.lerp;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_transformJs) {
      Transform = _transformJs.Transform;
      __applyDeltaTransform = _transformJs.__applyDeltaTransform;
      __calculateDeltaTransform = _transformJs.__calculateDeltaTransform;
    }],
    execute: function () {
      _export("Pose", Pose = class Pose {
        constructor(transforms, auxiliaryCurves) {
          this.transforms = void 0;
          this.auxiliaryCurves = void 0;
          /**
           * @internal
           */
          this._poseTransformSpace = PoseTransformSpace.LOCAL;
          this.transforms = transforms;
          this.auxiliaryCurves = auxiliaryCurves;
        }
        /**
         * @internal
         */
        static _create(transforms, auxiliaryCurves) {
          return new Pose(transforms, auxiliaryCurves);
        }
      });
      _export("PoseTransformSpace", PoseTransformSpace = /*#__PURE__*/function (PoseTransformSpace) {
        /**
         * Transforms are stored relative to their parent nodes.
         */
        PoseTransformSpace[PoseTransformSpace["LOCAL"] = 0] = "LOCAL";
        /**
         * Transforms are stored relative to the belonging animation controller's node's space.
         */
        PoseTransformSpace[PoseTransformSpace["COMPONENT"] = 1] = "COMPONENT";
        return PoseTransformSpace;
      }({}));
      _export("TransformFilter", TransformFilter = class TransformFilter {
        constructor(involvedTransforms) {
          if (DEBUG) {
            assertIsTrue(involvedTransforms.every(transformIndex => transformIndex < 2 ** 16), 'The number of transforms exceeds the max allowed(2 ** 16)');
          }
          this._involvedTransforms = new Uint16Array(involvedTransforms);
        }
        get involvedTransforms() {
          return this._involvedTransforms;
        }

        /**
         * ANOTHER IDEA: if we partition the indices into intervals,
         * can we achieve a better performance when do transform copy?
         *
         * For example: let every two elements of this array represents
         * an involved transform range: first index and end index.
         * For example, [1, 3, 4, 5, 5, 10] denotes the transform indices:
         * - [1, 3)  i.e indices 1, 2
         * - [4, 5)  i.e indices 4
         * - [5, 10) i.e indices 5, 6, 7, 8, 9
         * Its length always be multiple of 2.
         *
         * Obviously, the actual optimization effect is decided by the sparsity of the indices.
         *
         * ```ts
         * // Partition the ordered array in intervals.
         * let nIntervals = 0;
         * const intervals = new Uint32Array(involvedTransforms.length * 2); // Capacity, not size
         * for (let iBegin = 0; iBegin < involvedTransforms.length;) {
         *      const begin = involvedTransforms[iBegin];
         *      let iEnd = iBegin + 1;
         *      let end = begin + 1;
         *      for (; iEnd < involvedTransforms.length; ++iEnd, ++end) {
         *          if (intervals[iEnd] !== (end + 1)) {
         *              break;
         *          }
         *      }
         *      intervals[2 * nIntervals + 0] = begin;
         *      intervals[2 * nIntervals + 1] = end;
         *      ++nIntervals;
         *  }
         *
         * this._involvedTransformIntervals = intervals.slice(0, nIntervals * 2);
         * ```
         */
      });
      blendIntoTransformArrayAt = (() => {
        const cacheTransformSource = new Transform();
        const cacheTransformTarget = new Transform();
        return (target, source, alpha, transformIndex) => {
          const transformTarget = target.getTransform(transformIndex, cacheTransformTarget);
          const transformSource = source.getTransform(transformIndex, cacheTransformSource);
          Transform.lerp(transformTarget, transformTarget, transformSource, alpha);
          target.setTransform(transformIndex, transformTarget);
        };
      })();
      calculateDeltaTransformArrayAt = (() => {
        const cacheTransformBase = new Transform();
        const cacheTransformTarget = new Transform();
        return (target, base, transformIndex) => {
          const baseTransform = base.getTransform(transformIndex, cacheTransformBase);
          const targetTransform = target.getTransform(transformIndex, cacheTransformTarget);
          __calculateDeltaTransform(targetTransform, targetTransform, baseTransform);
          target.setTransform(transformIndex, targetTransform);
        };
      })();
      applyDeltaTransformArrayAt = (() => {
        const cacheTransformDelta = new Transform();
        const cacheTransformTarget = new Transform();
        return (target, delta, alpha, transformIndex) => {
          const deltaTransform = delta.getTransform(transformIndex, cacheTransformDelta);
          const targetTransform = target.getTransform(transformIndex, cacheTransformTarget);
          __applyDeltaTransform(targetTransform, targetTransform, deltaTransform, alpha);
          target.setTransform(transformIndex, targetTransform);
        };
      })();
    }
  };
});