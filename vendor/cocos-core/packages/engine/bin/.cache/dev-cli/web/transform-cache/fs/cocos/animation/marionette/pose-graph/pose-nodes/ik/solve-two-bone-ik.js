System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/ik/solve-two-bone-ik.js", ["../../../../../../../virtual/internal%253Aconstants.js", "../../../../../core/index.js", "./two-bone-ik-debugger.js"], function (_export, _context) {
  "use strict";

  var DEBUG, approx, clamp, Quat, Vec3, debugTwoBoneIKDraw, TwoBoneIKPositionSanityChecker, SANITY_CHECK_ENABLED, solveTwoBoneIK, solveTwoBoneIKPositions;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      approx = _coreIndexJs.approx;
      clamp = _coreIndexJs.clamp;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_twoBoneIkDebuggerJs) {
      debugTwoBoneIKDraw = _twoBoneIkDebuggerJs.debugTwoBoneIKDraw;
    }],
    execute: function () {
      SANITY_CHECK_ENABLED = DEBUG;
      TwoBoneIKPositionSanityChecker = class TwoBoneIKPositionSanityChecker {
        constructor() {
          this._a = new Vec3();
        }
        reset(a, b, c) {
          Vec3.copy(this._a, a);
          this._dAB = Vec3.distance(a, b);
          this._dBC = Vec3.distance(b, c);
        }
        check(_a, _b, _c) {
          const CHECK_EPSILON = 1e-3;
          const dAB = Vec3.distance(_a, _b);
          const dBC = Vec3.distance(_b, _c);
          if (!approx(Vec3.distance(_a, this._a), 0.0, CHECK_EPSILON)) {
            // eslint-disable-next-line no-debugger
            debugger;
            return false;
          }
          if (!approx(dAB, this._dAB, CHECK_EPSILON)) {
            // eslint-disable-next-line no-debugger
            debugger;
            return false;
          }
          if (!approx(dBC, this._dBC, CHECK_EPSILON)) {
            // eslint-disable-next-line no-debugger
            debugger;
            return false;
          }
          return true;
        }
      };
      /**
       * 解算双骨骼（三关节）的 IK 问题。
       * 三关节分别称为根关节、中间关节和末端关节。例如，分别对应于大腿、膝盖和脚关节。
       * @param root 根关节转换（世界空间）。
       * @param middle 中间关节转换（世界空间）。
       * @param end 末端关节转换（世界空间）。
       * @param target 末端关节要抵达的目标位置（世界空间）。
       * @param hint 中间关节的提示位置（世界空间），用于决定中间关节的朝向。
       */
      _export("solveTwoBoneIK", solveTwoBoneIK = (() => {
        const cacheQuat = new Quat();
        const cacheHint = new Vec3();
        const cacheBSolved = new Vec3();
        const cacheCSolved = new Vec3();
        const calculateRotationBetweenRays = (() => {
          const cacheVec3_1 = new Vec3();
          const cacheVec3_2 = new Vec3();
          return (out, sourceOrigin, sourceDestination, targetOrigin, targetDestination
          // eslint-disable-next-line arrow-body-style
          ) => {
            return Quat.rotationTo(out, Vec3.subtract(cacheVec3_1, sourceDestination, sourceOrigin).normalize(), Vec3.subtract(cacheVec3_2, targetDestination, targetOrigin).normalize());
          };
        })();
        return (root, middle, end, target, middlePositionHint, debugKey) => {
          const hint = Vec3.copy(cacheHint, middlePositionHint != null ? middlePositionHint : middle.position);
          const pA = root.position;
          const pB = middle.position;
          const pC = end.position;
          const qC = end.rotation;
          if (DEBUG) {
            if (typeof debugKey !== undefined) {
              debugTwoBoneIKDraw(debugKey, pA, pB, pC);
            }
          }
          const bSolved = cacheBSolved;
          const cSolved = cacheCSolved;
          solveTwoBoneIKPositions(pA, pB, pC, target, hint, bSolved, cSolved);
          const qA = calculateRotationBetweenRays(cacheQuat, pA, pB, pA, bSolved);
          Quat.multiply(qA, qA, root.rotation);
          root.rotation = qA;
          const qB = calculateRotationBetweenRays(cacheQuat, pB, pC, bSolved, cSolved);
          Quat.multiply(qB, qB, middle.rotation);
          middle.rotation = qB;
          middle.position = bSolved;
          end.position = cSolved;
        };
      })());
      _export("solveTwoBoneIKPositions", solveTwoBoneIKPositions = (() => {
        const cacheDirAT = new Vec3();
        const cacheDirAB = new Vec3();
        const cacheDirHeightLine = new Vec3();
        const cacheSanityChecker = SANITY_CHECK_ENABLED ? new TwoBoneIKPositionSanityChecker() : undefined;
        return (a, b, c, target, middleTarget, bSolved, cSolved) => {
          const sanityCheck = cacheSanityChecker ? (() => {
            cacheSanityChecker == null || cacheSanityChecker.reset(a, b, c);
            return () => cacheSanityChecker.check(a, bSolved, cSolved);
          })() : undefined;
          const dAB = Vec3.distance(a, b);
          const dBC = Vec3.distance(b, c);
          const dAT = Vec3.distance(a, target);
          const dirAT = Vec3.subtract(cacheDirAT, target, a);
          dirAT.normalize();
          const chainLength = dAB + dBC;
          if (dAT >= chainLength) {
            // Target is too far
            Vec3.scaleAndAdd(bSolved, a, dirAT, dAB);
            Vec3.scaleAndAdd(cSolved, a, dirAT, chainLength);
            sanityCheck == null || sanityCheck();
            return;
          }

          // Now we should have a solution with target reached.
          // And then solve the middle joint B as Ḃ.
          Vec3.copy(cSolved, target);
          // Calculate ∠BAC's cosine.
          const cosḂAT = clamp((dAB * dAB + dAT * dAT - dBC * dBC) / (2 * dAB * dAT), -1.0, 1.0);
          // Then use basic trigonometry(instead of rotation) to solve Ḃ.
          // Let D the intersect point of the height line passing Ḃ.
          const dirAB = Vec3.subtract(cacheDirAB, middleTarget, a);
          const dirHeightLine = Vec3.projectOnPlane(cacheDirHeightLine, dirAB, dirAT);
          dirHeightLine.normalize();
          const dAD = dAB * cosḂAT;
          const hSqr = dAB * dAB - dAD * dAD;
          if (hSqr < 0) {
            // TODO: 'Shall handle this case';
            // eslint-disable-next-line no-debugger
            debugger;
          }
          const h = Math.sqrt(hSqr);
          Vec3.scaleAndAdd(bSolved, a, dirAT, dAD);
          Vec3.scaleAndAdd(bSolved, bSolved, dirHeightLine, h);
          sanityCheck == null || sanityCheck();
        };
      })());
    }
  };
});