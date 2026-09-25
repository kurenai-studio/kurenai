System.register("q-bundled:///fs/cocos/physics/physx/physx-adapter.js", ["../../misc/webassembly-support.js", "pal/wasm", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../utils/util.js", "./physx-instance.js", "./physx-enum.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var NativeCodeBundleMode, ensureWasmModuleReady, instantiateWasm, EDITOR, TEST, NATIVE_CODE_BUNDLE_MODE, LOAD_PHYSX_MANUALLY, BUILD, Quat, Vec3, cclegacy, geometry, sys, error, shrinkPositions, PhysXInstance, PxHitFlag, PxQueryFlag, EFilterDataWord3, game, PX, globalThis, USE_EXTERNAL_PHYSX, _v3, _v4, _trans, _pxtrans;
  function initPhysXLibs() {
    const errorReport = msg => {
      error(msg);
    };
    return ensureWasmModuleReady().then(() => {
      if (shouldUseWasmModule()) {
        return Promise.all([_context.import('external:emscripten/physx/physx.release.wasm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fphysx%252Fphysx.release.wasm.wasm.js")]).then(([{
          default: physxWasmFactory
        }, {
          default: physxWasmUrl
        }]) => initWASM(physxWasmFactory, physxWasmUrl));
      } else {
        return _context.import('external:emscripten/physx/physx.release.asm.js').then(({
          default: physxAsmFactory
        }) => initASM(physxAsmFactory));
      }
    }).catch(errorReport);
  }
  function initASM(physxAsmFactory) {
    globalThis.PhysX = globalThis.PHYSX ? globalThis.PHYSX : physxAsmFactory;
    if (globalThis.PhysX != null) {
      return globalThis.PhysX().then(Instance => {
        if (!EDITOR && !TEST) console.debug('[PHYSICS]:', `${USE_EXTERNAL_PHYSX ? 'External' : 'Internal'} PhysX asm libs loaded.`);
        initAdaptWrapper(Instance);
        initConfigAndCacheObject(Instance);
        Object.assign(PX, Instance);
      }, reason => {
        console.error('[PHYSICS]:', `PhysX asm load failed: ${reason}`);
      });
    } else {
      if (!EDITOR && !TEST) console.error('[PHYSICS]:', 'Failed to load PhysX js libs, package may be not found.');
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }
  function initWASM(physxWasmFactory, physxWasmUrl) {
    globalThis.PhysX = globalThis.PHYSX ? globalThis.PHYSX : physxWasmFactory;
    if (globalThis.PhysX != null) {
      return globalThis.PhysX({
        instantiateWasm(importObject, receiveInstance) {
          return instantiateWasm(physxWasmUrl, importObject).then(result => {
            receiveInstance(result.instance, result.module);
          });
        }
      }).then(Instance => {
        if (!EDITOR && !TEST) console.debug('[PHYSICS]:', `${USE_EXTERNAL_PHYSX ? 'External' : 'Internal'} PhysX wasm libs loaded.`);
        initAdaptWrapper(Instance);
        initConfigAndCacheObject(Instance);
        _export("PX", PX = Instance);
      }, reason => {
        console.error('[PHYSICS]:', `PhysX wasm load failed: ${reason}`);
      });
    } else {
      if (!EDITOR && !TEST) console.error('[PHYSICS]:', 'Failed to load PhysX wasm libs, package may be not found.');
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }
  function shouldUseWasmModule() {
    if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.BOTH) {
      return sys.hasFeature(sys.Feature.WASM);
    } else if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.WASM) {
      return true;
    } else {
      return false;
    }
  }
  function initConfigAndCacheObject(PX) {
    globalThis.PhysX = PX;
    PX.EPSILON = 1e-3;
    PX.MULTI_THREAD = false;
    PX.SUB_THREAD_COUNT = 1;
    PX.CACHE_MAT = {};
    PX.IMPL_PTR = {};
    PX.MESH_CONVEX = {};
    PX.MESH_STATIC = {};
    PX.TERRAIN_STATIC = {};
  }
  function initAdaptWrapper(obj) {
    obj.VECTOR_MAT = new obj.PxMaterialVector();
    obj.MeshScale = obj.PxMeshScale;
    obj.ShapeFlag = obj.PxShapeFlag;
    obj.ActorFlag = obj.PxActorFlag;
    obj.ForceMode = obj.PxForceMode;
    obj.CombineMode = obj.PxCombineMode;
    obj.BoxGeometry = obj.PxBoxGeometry;
    obj.QueryHitType = obj.PxQueryHitType;
    obj.RigidBodyFlag = obj.PxRigidBodyFlag;
    obj.PlaneGeometry = obj.PxPlaneGeometry;
    obj.SphereGeometry = obj.PxSphereGeometry;
    obj.CapsuleGeometry = obj.PxCapsuleGeometry;
    obj.ConvexMeshGeometry = obj.PxConvexMeshGeometry;
    obj.D6Motion = obj.PxD6Motion;
    obj.D6Axis = obj.PxD6Axis;
    obj.D6Drive = obj.PxD6Drive;
    obj.D6JointDrive = obj.PxD6JointDrive;
    obj.LinearLimitPair = obj.PxJointLinearLimitPair;
    obj.AngularLimitPair = obj.PxJointAngularLimitPair;
    obj.TriangleMeshGeometry = obj.PxTriangleMeshGeometry;
    obj.RigidDynamicLockFlag = obj.PxRigidDynamicLockFlag;
    obj.TolerancesScale = obj.PxTolerancesScale;
    obj.RevoluteJointFlags = {
      eLIMIT_ENABLED: 1 << 0,
      eDRIVE_ENABLED: 1 << 1,
      eDRIVE_FREESPIN: 1 << 2
    };
    obj.JointAngularLimitPair = obj.PxJointAngularLimitPair;
    obj.createRevoluteJoint = (a, b, c, d) => obj.PxRevoluteJointCreate(PX.physics, a, b, c, d);
    obj.createFixedConstraint = (a, b, c, d) => obj.PxFixedJointCreate(PX.physics, a, b, c, d);
    obj.createSphericalJoint = (a, b, c, d) => obj.PxSphericalJointCreate(PX.physics, a, b, c, d);
    obj.createD6Joint = (a, b, c, d) => obj.PxD6JointCreate(PX.physics, a, b, c, d);
  }
  function getColorPXColor(color, rgba) {
    color.b = rgba >> 16 & 0xff;
    color.g = rgba >> 8 & 0xff;
    color.r = rgba & 0xff;
    color.a = 255;
  }
  function addReference(shape, impl) {
    if (!impl) return;
    if (impl.$$) PX.IMPL_PTR[impl.$$.ptr] = shape;
  }
  function removeReference(shape, impl) {
    if (!impl) return;
    if (impl.$$) {
      PX.IMPL_PTR[impl.$$.ptr] = null;
      delete PX.IMPL_PTR[impl.$$.ptr];
    }
  }
  function getWrapShape(pxShape) {
    return PX.IMPL_PTR[pxShape.$$.ptr];
  }
  function getTempTransform(pos, quat) {
    Vec3.copy(_pxtrans.translation, pos);
    Quat.copy(_pxtrans.rotation, quat);
    return _pxtrans;
  }
  function getJsTransform(pos, quat) {
    Vec3.copy(_trans.p, pos);
    Quat.copy(_trans.q, quat);
    return _trans;
  }
  function addActorToScene(scene, actor) {
    scene.addActor(actor, null);
  }
  function setJointActors(joint, actor0, actor1) {
    joint.setActors(actor0, actor1);
  }
  function setMassAndUpdateInertia(impl, mass) {
    impl.setMassAndUpdateInertia(mass);
  }
  function copyPhysXTransform(node, transform) {
    const wp = node.worldPosition;
    const wr = node.worldRotation;
    const dontUpdate = physXEqualsCocosVec3(transform, wp) && physXEqualsCocosQuat(transform, wr);
    if (dontUpdate) return;
    node.setWorldPosition(transform.translation);
    node.setWorldRotation(transform.rotation);
  }
  function physXEqualsCocosVec3(trans, v3) {
    return Vec3.equals(trans.translation, v3, PX.EPSILON);
  }
  function physXEqualsCocosQuat(trans, q) {
    return Quat.equals(trans.rotation, q, PX.EPSILON);
  }
  function applyImpulse(isGlobal, impl, vec, rp) {
    if (isGlobal) {
      impl.applyImpulse(vec, rp);
    } else {
      impl.applyLocalImpulse(vec, rp);
    }
  }
  function applyForce(isGlobal, impl, vec, rp) {
    if (isGlobal) {
      impl.applyForce(vec, rp);
    } else {
      impl.applyLocalForce(vec, rp);
    }
  }
  function applyTorqueForce(impl, vec) {
    impl.addTorque(vec);
  }
  function getShapeFlags(isTrigger) {
    const flag = (isTrigger ? PX.PxShapeFlag.eTRIGGER_SHAPE.value : PX.PxShapeFlag.eSIMULATION_SHAPE.value) | PX.PxShapeFlag.eSCENE_QUERY_SHAPE.value | PX.PxShapeFlag.eVISUALIZATION.value;
    return new PX.PxShapeFlags(flag);
  }

  // eslint-disable-next-line default-param-last
  function getShapeWorldBounds(shape, actor, i = 1.01, out) {
    const b3 = shape.getWorldBounds(actor, i);
    geometry.AABB.fromPoints(out, b3.minimum, b3.maximum);
  }
  function getShapeMaterials(pxMtl) {
    if (PX.VECTOR_MAT.size() > 0) {
      PX.VECTOR_MAT.set(0, pxMtl);
    } else {
      PX.VECTOR_MAT.push_back(pxMtl);
    }
    return PX.VECTOR_MAT;
  }
  function createConvexMesh(_buffer, cooking, physics) {
    const vertices = shrinkPositions(_buffer);
    const l = vertices.length;
    const vArr = new PX.PxVec3Vector();
    for (let i = 0; i < l; i += 3) {
      vArr.push_back({
        x: vertices[i],
        y: vertices[i + 1],
        z: vertices[i + 2]
      });
    }
    const r = cooking.createConvexMesh(vArr, physics);
    vArr.delete();
    return r;
  }

  // eTIGHT_BOUNDS = (1<<0) convex
  // eDOUBLE_SIDED = (1<<1) trimesh
  function createMeshGeometryFlags(flags, isConvex) {
    return isConvex ? new PX.PxConvexMeshGeometryFlags(flags) : new PX.PxMeshGeometryFlags(flags);
  }
  function createTriangleMesh(vertices, indices, cooking, physics) {
    const l = vertices.length;
    const l2 = indices.length;
    const vArr = new PX.PxVec3Vector();
    for (let i = 0; i < l; i += 3) {
      vArr.push_back({
        x: vertices[i],
        y: vertices[i + 1],
        z: vertices[i + 2]
      });
    }
    const iArr = new PX.PxU16Vector();
    for (let i = 0; i < l2; i += 3) {
      iArr.push_back(indices[i]);
      iArr.push_back(indices[i + 1]);
      iArr.push_back(indices[i + 2]);
    }
    const r = cooking.createTriMeshExt(vArr, iArr, physics);
    vArr.delete();
    iArr.delete();
    return r;
  }
  function createHeightField(terrain, heightScale, cooking, physics) {
    const sizeI = terrain.getVertexCountI();
    const sizeJ = terrain.getVertexCountJ();
    const samples = new PX.PxHeightFieldSampleVector();
    for (let i = 0; i < sizeI; i++) {
      for (let j = 0; j < sizeJ; j++) {
        const s = new PX.PxHeightFieldSample();
        s.height = terrain.getHeight(i, j) / heightScale;
        samples.push_back(s);
      }
    }
    return cooking.createHeightFieldExt(sizeI, sizeJ, samples, physics);
  }
  function createHeightFieldGeometry(hf, flags, hs, xs, zs) {
    return new PX.PxHeightFieldGeometry(hf, new PX.PxMeshGeometryFlags(flags), hs, xs, zs);
  }
  function simulateScene(scene, deltaTime) {
    scene.simulate(deltaTime, true);
  }
  function raycastAll(world, worldRay, options, pool, results) {
    const maxDistance = options.maxDistance;
    const flags = PxHitFlag.ePOSITION | PxHitFlag.eNORMAL;
    const word3 = EFilterDataWord3.QUERY_FILTER | (options.queryTrigger ? 0 : EFilterDataWord3.QUERY_CHECK_TRIGGER);
    const queryFlags = PxQueryFlag.eSTATIC | PxQueryFlag.eDYNAMIC | PxQueryFlag.ePREFILTER | PxQueryFlag.eNO_BLOCK;
    const queryfilterData = PhysXInstance.queryfilterData;
    const queryFilterCB = PhysXInstance.queryFilterCB;
    const mutipleResults = PhysXInstance.mutipleResults;
    const mutipleResultSize = PhysXInstance.mutipleResultSize;
    queryfilterData.setWords(options.mask >>> 0, 0);
    queryfilterData.setWords(word3, 3);
    queryfilterData.setFlags(queryFlags);
    const blocks = mutipleResults;
    const r = world.scene.raycastMultiple(worldRay.o, worldRay.d, maxDistance, flags, blocks, blocks.size(), queryfilterData, queryFilterCB, null);
    if (r > 0) {
      for (let i = 0; i < r; i++) {
        const block = blocks.get(i);
        const collider = getWrapShape(block.getShape()).collider;
        const result = pool.add();
        result._assign(block.position, block.distance, collider, block.normal);
        results.push(result);
      }
      return true;
    }
    if (r === -1) {
      // eslint-disable-next-line no-console
      console.error('not enough memory.');
    }
    return false;
  }
  function raycastClosest(world, worldRay, options, result) {
    const maxDistance = options.maxDistance;
    const flags = PxHitFlag.ePOSITION | PxHitFlag.eNORMAL;
    const word3 = EFilterDataWord3.QUERY_FILTER | (options.queryTrigger ? 0 : EFilterDataWord3.QUERY_CHECK_TRIGGER) | EFilterDataWord3.QUERY_SINGLE_HIT;
    const queryFlags = PxQueryFlag.eSTATIC | PxQueryFlag.eDYNAMIC | PxQueryFlag.ePREFILTER;
    const queryfilterData = PhysXInstance.queryfilterData;
    const queryFilterCB = PhysXInstance.queryFilterCB;
    queryfilterData.setWords(options.mask >>> 0, 0);
    queryfilterData.setWords(word3, 3);
    queryfilterData.setFlags(queryFlags);
    const block = PhysXInstance.singleResult;
    const r = world.scene.raycastSingle(worldRay.o, worldRay.d, options.maxDistance, flags, block, queryfilterData, queryFilterCB, null);
    if (r) {
      const collider = getWrapShape(block.getShape()).collider;
      result._assign(block.position, block.distance, collider, block.normal);
      return true;
    }
    return false;
  }
  function sweepAll(world, worldRay, geometry, geometryRotation, options, pool, results) {
    const maxDistance = options.maxDistance;
    const flags = PxHitFlag.ePOSITION | PxHitFlag.eNORMAL;
    const word3 = EFilterDataWord3.QUERY_FILTER | (options.queryTrigger ? 0 : EFilterDataWord3.QUERY_CHECK_TRIGGER);
    const queryFlags = PxQueryFlag.eSTATIC | PxQueryFlag.eDYNAMIC | PxQueryFlag.ePREFILTER | PxQueryFlag.eNO_BLOCK;
    const queryfilterData = PhysXInstance.queryfilterData;
    const queryFilterCB = PhysXInstance.queryFilterCB; //?
    const mutipleResults = PhysXInstance.mutipleSweepResults;
    const mutipleResultSize = PhysXInstance.mutipleResultSize;
    queryfilterData.setWords(options.mask >>> 0, 0);
    queryfilterData.setWords(word3, 3);
    queryfilterData.setFlags(queryFlags);
    const blocks = mutipleResults;
    const r = world.scene.sweepMultiple(geometry, getTempTransform(worldRay.o, geometryRotation), worldRay.d, maxDistance, flags, blocks, blocks.size(), queryfilterData, queryFilterCB, null, 0);
    if (r > 0) {
      for (let i = 0; i < r; i++) {
        const block = blocks.get(i);
        const collider = getWrapShape(block.getShape()).collider;
        const result = pool.add();
        result._assign(block.position, block.distance, collider, block.normal);
        results.push(result);
      }
      return true;
    }
    if (r === -1) {
      // eslint-disable-next-line no-console
      console.error('not enough memory.');
    }
    return false;
  }
  function sweepClosest(world, worldRay, geometry, geometryRotation, options, result) {
    const maxDistance = options.maxDistance;
    const flags = PxHitFlag.ePOSITION | PxHitFlag.eNORMAL;
    const word3 = EFilterDataWord3.QUERY_FILTER | (options.queryTrigger ? 0 : EFilterDataWord3.QUERY_CHECK_TRIGGER) | EFilterDataWord3.QUERY_SINGLE_HIT;
    const queryFlags = PxQueryFlag.eSTATIC | PxQueryFlag.eDYNAMIC | PxQueryFlag.ePREFILTER;
    const queryfilterData = PhysXInstance.queryfilterData;
    queryfilterData.setWords(options.mask >>> 0, 0);
    queryfilterData.setWords(word3, 3);
    queryfilterData.setFlags(queryFlags);
    const queryFilterCB = PhysXInstance.queryFilterCB;
    const block = PhysXInstance.singleSweepResult;
    const r = world.scene.sweepSingle(geometry, getTempTransform(worldRay.o, geometryRotation), worldRay.d, maxDistance, flags, block, queryfilterData, queryFilterCB, null, 0);
    if (r) {
      const collider = getWrapShape(block.getShape()).collider;
      result._assign(block.position, block.distance, collider, block.normal);
      return true;
    }
    return false;
  }
  function initializeWorld(world) {
    // construct PhysX instance object only once
    if (!PhysXInstance.foundation) {
      const version = PX.PX_PHYSICS_VERSION;
      const allocator = new PX.PxDefaultAllocator();
      const defaultErrorCallback = new PX.PxDefaultErrorCallback();
      const foundation = PhysXInstance.foundation = PX.PxCreateFoundation(version, allocator, defaultErrorCallback);
      PhysXInstance.pvd = null;
      const scale = new PX.PxTolerancesScale();
      PhysXInstance.physics = PX.physics = PX.PxCreatePhysics(version, foundation, scale, false, PhysXInstance.pvd);
      PhysXInstance.cooking = PX.PxCreateCooking(version, foundation, new PX.PxCookingParams(scale));
      PX.PxInitExtensions(PhysXInstance.physics, PhysXInstance.pvd);
      PhysXInstance.singleResult = new PX.PxRaycastHit();
      PhysXInstance.mutipleResults = new PX.PxRaycastHitVector();
      PhysXInstance.mutipleResults.resize(PhysXInstance.mutipleResultSize, PhysXInstance.singleResult);
      PhysXInstance.queryfilterData = new PX.PxQueryFilterData();
      PhysXInstance.simulationCB = PX.PxSimulationEventCallback.implement(world.callback.eventCallback);
      PhysXInstance.queryFilterCB = PX.PxQueryFilterCallback.implement(world.callback.queryCallback);
      PhysXInstance.singleSweepResult = new PX.PxSweepHit();
      PhysXInstance.mutipleSweepResults = new PX.PxSweepHitVector();
      PhysXInstance.mutipleSweepResults.resize(PhysXInstance.mutipleResultSize, PhysXInstance.singleSweepResult);
    }
    const sceneDesc = PX.getDefaultSceneDesc(PhysXInstance.physics.getTolerancesScale(), 0, PhysXInstance.simulationCB);
    world.scene = PhysXInstance.physics.createScene(sceneDesc);
    world.scene.setVisualizationParameter(PX.PxVisualizationParameter.eSCALE, 1);
    world.controllerManager = PX.PxCreateControllerManager(world.scene, false);
  }

  /**
   * f32 x3 position.x,position.y,position.z,
   * f32 x3 normal.x,normal.y,normal.z,
   * f32 x3 impulse.x,impulse.y,impulse.z,
   * f32 separation,
   * totoal = 40
   * ui32 internalFaceIndex0,
   * ui32 internalFaceIndex1,
   * totoal = 48
   */
  function getContactPosition(pxContactOrOffset, out, buf) {
    Vec3.copy(out, pxContactOrOffset.position);
  }
  function getContactNormal(pxContactOrOffset, out, buf) {
    Vec3.copy(out, pxContactOrOffset.normal);
  }
  function getContactDataOrByteOffset(index, offset) {
    const gc = PX.getGContacts();
    const data = gc.get(index + offset);
    return data;
  }
  function syncNoneStaticToSceneIfWaking(actor, node) {
    if (actor.isSleeping()) return;
    copyPhysXTransform(node, actor.getGlobalPose());
  }

  /**
   * Extension config for bytedance
   */
  _export({
    initPhysXLibs: initPhysXLibs,
    getColorPXColor: getColorPXColor,
    addReference: addReference,
    removeReference: removeReference,
    getWrapShape: getWrapShape,
    getTempTransform: getTempTransform,
    getJsTransform: getJsTransform,
    addActorToScene: addActorToScene,
    setJointActors: setJointActors,
    setMassAndUpdateInertia: setMassAndUpdateInertia,
    copyPhysXTransform: copyPhysXTransform,
    physXEqualsCocosVec3: physXEqualsCocosVec3,
    physXEqualsCocosQuat: physXEqualsCocosQuat,
    applyImpulse: applyImpulse,
    applyForce: applyForce,
    applyTorqueForce: applyTorqueForce,
    getShapeFlags: getShapeFlags,
    getShapeWorldBounds: getShapeWorldBounds,
    getShapeMaterials: getShapeMaterials,
    createConvexMesh: createConvexMesh,
    createMeshGeometryFlags: createMeshGeometryFlags,
    createTriangleMesh: createTriangleMesh,
    createHeightField: createHeightField,
    createHeightFieldGeometry: createHeightFieldGeometry,
    simulateScene: simulateScene,
    raycastAll: raycastAll,
    raycastClosest: raycastClosest,
    sweepAll: sweepAll,
    sweepClosest: sweepClosest,
    initializeWorld: initializeWorld,
    getContactPosition: getContactPosition,
    getContactNormal: getContactNormal,
    getContactDataOrByteOffset: getContactDataOrByteOffset,
    syncNoneStaticToSceneIfWaking: syncNoneStaticToSceneIfWaking
  });
  return {
    setters: [function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }, function (_palWasm) {
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
      instantiateWasm = _palWasm.instantiateWasm;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      TEST = _virtualInternal253AconstantsJs.TEST;
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
      LOAD_PHYSX_MANUALLY = _virtualInternal253AconstantsJs.LOAD_PHYSX_MANUALLY;
      BUILD = _virtualInternal253AconstantsJs.BUILD;
    }, function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      geometry = _coreIndexJs.geometry;
      sys = _coreIndexJs.sys;
      error = _coreIndexJs.error;
    }, function (_utilsUtilJs) {
      shrinkPositions = _utilsUtilJs.shrinkPositions;
    }, function (_physxInstanceJs) {
      PhysXInstance = _physxInstanceJs.PhysXInstance;
    }, function (_physxEnumJs) {
      PxHitFlag = _physxEnumJs.PxHitFlag;
      PxQueryFlag = _physxEnumJs.PxQueryFlag;
      EFilterDataWord3 = _physxEnumJs.EFilterDataWord3;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      /* eslint-disable import/no-mutable-exports */
      /* eslint-disable no-console */
      /* eslint-disable @typescript-eslint/restrict-template-expressions */
      /* eslint-disable consistent-return */
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      /* eslint-disable no-lonely-if */
      /* eslint-disable import/order */
      _export("PX", PX = {});
      globalThis = cclegacy._global; // Use bytedance native or js physics if nativePhysX is not null.
      USE_EXTERNAL_PHYSX = !!globalThis.PHYSX;
      if (!BUILD || !LOAD_PHYSX_MANUALLY) {
        // Init physx libs when engine init.
        game.onPostInfrastructureInitDelegate.add(initPhysXLibs);
      }
      _v3 = {
        x: 0,
        y: 0,
        z: 0
      };
      _v4 = {
        x: 0,
        y: 0,
        z: 0,
        w: 1
      };
      _export("_trans", _trans = {
        translation: _v3,
        rotation: _v4,
        p: _v3,
        q: _v4
      });
      _export("_pxtrans", _pxtrans = _trans);
    }
  };
});