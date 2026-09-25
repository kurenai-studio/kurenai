System.register("q-bundled:///fs/cocos/animation/core/pose-allocator.js", ["../../core/data/utils/asserts.js", "./pose.js", "./transform-array.js", "./shared-stack-based-allocator.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, Pose, TransformArray, SharedStackBasedAllocatorManager, PoseStackAllocator, PAGE_SIZE, globalPosePageMemoryAllocatorManager;
  function calculateRequiredBytes(transformCount, auxiliaryCurveCount, capacity) {
    return (TransformArray.BYTES_PER_ELEMENT * transformCount + Float64Array.BYTES_PER_ELEMENT * auxiliaryCurveCount) * capacity;
  }
  _export("PoseStackAllocator", void 0);
  return {
    setters: [function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_poseJs) {
      Pose = _poseJs.Pose;
    }, function (_transformArrayJs) {
      TransformArray = _transformArrayJs.TransformArray;
    }, function (_sharedStackBasedAllocatorJs) {
      SharedStackBasedAllocatorManager = _sharedStackBasedAllocatorJs.SharedStackBasedAllocatorManager;
    }],
    execute: function () {
      _export("PoseStackAllocator", PoseStackAllocator = class PoseStackAllocator {
        constructor(transformCount, auxiliaryCurveCount) {
          this._poses = [];
          this._allocatedCount = 0;
          this._memoryAllocator = void 0;
          this._transformCount = transformCount;
          this._auxiliaryCurveCount = auxiliaryCurveCount;
          const poseBytes = calculateRequiredBytes(transformCount, auxiliaryCurveCount, 1);
          this._memoryAllocator = globalPosePageMemoryAllocatorManager.createAllocator(poseBytes);
        }
        destroy() {
          assertIsTrue(this._allocatedCount === 0, `Can not destroy the allocator since it's not empty.`);
          for (let iPose = 0; iPose < this._poses.length; ++iPose) {
            this._memoryAllocator.pop();
          }
          this._poses.length = 0;
          return this._memoryAllocator.destroy();
        }
        get allocatedCount() {
          return this._allocatedCount;
        }
        push() {
          // Lock the allocator when pushing first pose.
          if (this._allocatedCount === 0) {
            this._memoryAllocator.debugLock();
          }
          if (this._allocatedCount === this._poses.length) {
            this._allocateNewPose();
            assertIsTrue(this._allocatedCount < this._poses.length);
          }
          const pose = this._poses[this._allocatedCount];
          ++this._allocatedCount;
          return pose;
        }
        pop() {
          assertIsTrue(this._allocatedCount > 0, `PoseStackAllocator: push/pop does not match.`);
          --this._allocatedCount;

          // Unlock the allocator while popping last pose.
          if (this._allocatedCount === 0) {
            this._memoryAllocator.debugUnlock();
          }

          // Note: we don't actually free the pose -- only destroy() will free the pose.
          // This does not cause big problem since all pose allocators share the same stack memory.
        }
        get top() {
          assertIsTrue(this._allocatedCount > 0);
          return this._poses[this._allocatedCount - 1];
        }
        _allocateNewPose() {
          const slice = this._memoryAllocator.push();
          const transformsByteLength = TransformArray.BYTES_PER_ELEMENT * this._transformCount;
          const baseOffset = slice.byteOffset;
          const transforms = new TransformArray(slice.buffer, baseOffset, this._transformCount);
          const auxiliaryCurves = new Float64Array(slice.buffer, baseOffset + transformsByteLength, this._auxiliaryCurveCount);
          const pose = Pose._create(transforms, auxiliaryCurves);
          this._poses.push(pose);
        }
      });
      PAGE_SIZE = calculateRequiredBytes(128, 10, 4);
      globalPosePageMemoryAllocatorManager = new SharedStackBasedAllocatorManager([PAGE_SIZE]);
    }
  };
});