System.register("q-bundled:///fs/cocos/physics/framework/physics-selector.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "./physics-enum.js"], function (_export, _context) {
  "use strict";

  var EDITOR, TEST, errorID, warn, cclegacy, debug, EColliderType, EConstraintType, ECharacterControllerType, worldInitData, selector, FUNC, ENTIRE_WORLD, ECheckType, ENTIRE_RIGID_BODY, CREATE_COLLIDER_PROXY, ENTIRE_SHAPE, CREATE_CONSTRAINT_PROXY, ENTIRE_CONSTRAINT, CREATE_CHARACTER_CONTROLLER_PROXY, ENTIRE_CHARACTER_CONTROLLER;
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
  /* eslint-disable @typescript-eslint/restrict-template-expressions */
  /* eslint-disable @typescript-eslint/no-unsafe-return */

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents

  function updateLegacyMacro(id) {
    cclegacy._global.CC_PHYSICS_BUILTIN = id === 'builtin';
    cclegacy._global.CC_PHYSICS_CANNON = id === 'cannon.js';
    cclegacy._global.CC_PHYSICS_AMMO = id === 'bullet';
  }
  function register(id, wrapper) {
    if (!EDITOR && !TEST) debug(`[PHYSICS]: register ${id}.`);
    selector.backend[id] = wrapper;
    if (!selector.physicsWorld || selector.id === id) {
      updateLegacyMacro(id);
      const mutableSelector = selector;
      mutableSelector.id = id;
      mutableSelector.wrapper = wrapper;
    }
  }
  function switchTo(id) {
    if (!selector.runInEditor) return;
    const mutableSelector = selector;
    if (selector.physicsWorld && id !== selector.id && selector.backend[id] != null) {
      selector.physicsWorld.destroy();
      if (!TEST) debug(`[PHYSICS]: switch from ${selector.id} to ${id}.`);
      updateLegacyMacro(id);
      mutableSelector.id = id;
      mutableSelector.wrapper = selector.backend[id];
      mutableSelector.physicsWorld = createPhysicsWorld();
    } else {
      if (!EDITOR && !TEST) debug(`[PHYSICS]: using ${id}.`);
      mutableSelector.physicsWorld = createPhysicsWorld();
    }
    if (worldInitData) {
      const world = mutableSelector.physicsWorld;
      world.setGravity(worldInitData.gravity);
      world.setAllowSleep(worldInitData.allowSleep);
    }
  }

  /**
   * @en
   * The physics selector is used to register and switch the physics engine backend.
   * @zh
   * 物理选择器用于注册和切换物理引擎后端。
   */

  function constructDefaultWorld(data) {
    if (!worldInitData) worldInitData = data;
    if (!selector.runInEditor) return;
    if (!selector.physicsWorld) {
      if (!TEST) debug(`[PHYSICS]: using ${selector.id}.`);
      const mutableSelector = selector;
      const world = mutableSelector.physicsWorld = createPhysicsWorld();
      world.setGravity(worldInitData.gravity);
      world.setAllowSleep(worldInitData.allowSleep);
    }
  }

  /// Utility Function For Create Wrapper Entity ///

  function check(obj, type) {
    if (obj == null) {
      if (selector.id) {
        warn(`${selector.id} physics does not support ${ECheckType[type]}`);
      } else {
        errorID(9600);
      }
      return true;
    }
    return false;
  }
  function createPhysicsWorld() {
    if (check(selector.wrapper.PhysicsWorld, ECheckType.World)) {
      return ENTIRE_WORLD;
    }
    return new selector.wrapper.PhysicsWorld();
  }
  function createRigidBody() {
    if (check(selector.wrapper.RigidBody, ECheckType.RigidBody)) {
      return ENTIRE_RIGID_BODY;
    }
    return new selector.wrapper.RigidBody();
  }

  /// CREATE COLLIDER ///

  function createShape(type) {
    initColliderProxy();
    return CREATE_COLLIDER_PROXY[type]();
  }
  function initColliderProxy() {
    if (CREATE_COLLIDER_PROXY.INITED) return;
    CREATE_COLLIDER_PROXY.INITED = true;
    CREATE_COLLIDER_PROXY[EColliderType.BOX] = function createBoxShape() {
      if (check(selector.wrapper.BoxShape, ECheckType.BoxCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.BoxShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.SPHERE] = function createSphereShape() {
      if (check(selector.wrapper.SphereShape, ECheckType.SphereCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.SphereShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.CAPSULE] = function createCapsuleShape() {
      if (check(selector.wrapper.CapsuleShape, ECheckType.CapsuleCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.CapsuleShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.CYLINDER] = function createCylinderShape() {
      if (check(selector.wrapper.CylinderShape, ECheckType.CylinderCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.CylinderShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.CONE] = function createConeShape() {
      if (check(selector.wrapper.ConeShape, ECheckType.ConeCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.ConeShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.MESH] = function createTrimeshShape() {
      if (check(selector.wrapper.TrimeshShape, ECheckType.MeshCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.TrimeshShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.TERRAIN] = function createTerrainShape() {
      if (check(selector.wrapper.TerrainShape, ECheckType.TerrainCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.TerrainShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.SIMPLEX] = function createSimplexShape() {
      if (check(selector.wrapper.SimplexShape, ECheckType.SimplexCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.SimplexShape();
    };
    CREATE_COLLIDER_PROXY[EColliderType.PLANE] = function createPlaneShape() {
      if (check(selector.wrapper.PlaneShape, ECheckType.PlaneCollider)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.PlaneShape();
    };
  }

  /// CREATE CONSTRAINT ///

  function createConstraint(type) {
    initConstraintProxy();
    return CREATE_CONSTRAINT_PROXY[type]();
  }
  function initConstraintProxy() {
    if (CREATE_CONSTRAINT_PROXY.INITED) return;
    CREATE_CONSTRAINT_PROXY.INITED = true;
    CREATE_CONSTRAINT_PROXY[EConstraintType.POINT_TO_POINT] = function createPointToPointConstraint() {
      if (check(selector.wrapper.PointToPointConstraint, ECheckType.PointToPointConstraint)) {
        return ENTIRE_CONSTRAINT;
      }
      return new selector.wrapper.PointToPointConstraint();
    };
    CREATE_CONSTRAINT_PROXY[EConstraintType.HINGE] = function createHingeConstraint() {
      if (check(selector.wrapper.HingeConstraint, ECheckType.HingeConstraint)) {
        return ENTIRE_CONSTRAINT;
      }
      return new selector.wrapper.HingeConstraint();
    };
    CREATE_CONSTRAINT_PROXY[EConstraintType.FIXED] = function createFixedConstraint() {
      if (check(selector.wrapper.FixedConstraint, ECheckType.FixedConstraint)) {
        return ENTIRE_CONSTRAINT;
      }
      return new selector.wrapper.FixedConstraint();
    };
    CREATE_CONSTRAINT_PROXY[EConstraintType.CONFIGURABLE] = function createConfigurableConstraint() {
      if (check(selector.wrapper.ConfigurableConstraint, ECheckType.ConfigurableConstraint)) {
        return ENTIRE_CONSTRAINT;
      }
      return new selector.wrapper.ConfigurableConstraint();
    };
  }

  /// CREATE CHARACTER CONTROLLER ///

  function createCharacterController(type) {
    initCharacterControllerProxy();
    return CREATE_CHARACTER_CONTROLLER_PROXY[type]();
  }
  function initCharacterControllerProxy() {
    if (CREATE_CHARACTER_CONTROLLER_PROXY.INITED) return;
    CREATE_CHARACTER_CONTROLLER_PROXY.INITED = true;
    CREATE_CHARACTER_CONTROLLER_PROXY[ECharacterControllerType.BOX] = function createBoxCharacterController() {
      if (check(selector.wrapper.BoxCharacterController, ECheckType.BoxCharacterController)) {
        return ENTIRE_CHARACTER_CONTROLLER;
      }
      return new selector.wrapper.BoxCharacterController();
    };
    CREATE_CHARACTER_CONTROLLER_PROXY[ECharacterControllerType.CAPSULE] = function createCapsuleCharacterController() {
      if (check(selector.wrapper.CapsuleCharacterController, ECheckType.CapsuleCharacterController)) {
        return ENTIRE_CHARACTER_CONTROLLER;
      }
      return new selector.wrapper.CapsuleCharacterController();
    };
  }
  _export({
    constructDefaultWorld: constructDefaultWorld,
    createPhysicsWorld: createPhysicsWorld,
    createRigidBody: createRigidBody,
    createShape: createShape,
    createConstraint: createConstraint,
    createCharacterController: createCharacterController
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
      warn = _coreIndexJs.warn;
      cclegacy = _coreIndexJs.cclegacy;
      debug = _coreIndexJs.debug;
    }, function (_physicsEnumJs) {
      EColliderType = _physicsEnumJs.EColliderType;
      EConstraintType = _physicsEnumJs.EConstraintType;
      ECharacterControllerType = _physicsEnumJs.ECharacterControllerType;
    }],
    execute: function () {
      _export("selector", selector = {
        id: '',
        switchTo,
        register,
        wrapper: {},
        backend: {},
        physicsWorld: null,
        /// hide for now ///
        runInEditor: !EDITOR
      });
      FUNC = (...v) => 0;
      ENTIRE_WORLD = {
        impl: null,
        debugDrawFlags: 0,
        debugDrawConstraintSize: 0,
        setGravity: FUNC,
        setAllowSleep: FUNC,
        setDefaultMaterial: FUNC,
        step: FUNC,
        syncAfterEvents: FUNC,
        syncSceneToPhysics: FUNC,
        raycast: FUNC,
        raycastClosest: FUNC,
        sweepBox: FUNC,
        sweepBoxClosest: FUNC,
        sweepSphere: FUNC,
        sweepSphereClosest: FUNC,
        sweepCapsule: FUNC,
        sweepCapsuleClosest: FUNC,
        emitEvents: FUNC,
        destroy: FUNC
      };
      ECheckType = /*#__PURE__*/function (ECheckType) {
        ECheckType[ECheckType["World"] = 0] = "World";
        ECheckType[ECheckType["RigidBody"] = 1] = "RigidBody";
        // COLLIDER //
        ECheckType[ECheckType["BoxCollider"] = 2] = "BoxCollider";
        ECheckType[ECheckType["SphereCollider"] = 3] = "SphereCollider";
        ECheckType[ECheckType["CapsuleCollider"] = 4] = "CapsuleCollider";
        ECheckType[ECheckType["MeshCollider"] = 5] = "MeshCollider";
        ECheckType[ECheckType["CylinderCollider"] = 6] = "CylinderCollider";
        ECheckType[ECheckType["ConeCollider"] = 7] = "ConeCollider";
        ECheckType[ECheckType["TerrainCollider"] = 8] = "TerrainCollider";
        ECheckType[ECheckType["SimplexCollider"] = 9] = "SimplexCollider";
        ECheckType[ECheckType["PlaneCollider"] = 10] = "PlaneCollider";
        // JOINT //
        ECheckType[ECheckType["PointToPointConstraint"] = 11] = "PointToPointConstraint";
        ECheckType[ECheckType["HingeConstraint"] = 12] = "HingeConstraint";
        ECheckType[ECheckType["FixedConstraint"] = 13] = "FixedConstraint";
        ECheckType[ECheckType["ConfigurableConstraint"] = 14] = "ConfigurableConstraint";
        // CHARACTER CONTROLLER //
        ECheckType[ECheckType["BoxCharacterController"] = 15] = "BoxCharacterController";
        ECheckType[ECheckType["CapsuleCharacterController"] = 16] = "CapsuleCharacterController";
        return ECheckType;
      }(ECheckType || {});
      ENTIRE_RIGID_BODY = {
        impl: null,
        rigidBody: null,
        isAwake: false,
        isSleepy: false,
        isSleeping: false,
        initialize: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC,
        setType: FUNC,
        setMass: FUNC,
        setLinearDamping: FUNC,
        setAngularDamping: FUNC,
        useGravity: FUNC,
        setLinearFactor: FUNC,
        setAngularFactor: FUNC,
        setAllowSleep: FUNC,
        wakeUp: FUNC,
        sleep: FUNC,
        clearState: FUNC,
        clearForces: FUNC,
        clearVelocity: FUNC,
        setSleepThreshold: FUNC,
        getSleepThreshold: FUNC,
        getLinearVelocity: FUNC,
        setLinearVelocity: FUNC,
        getAngularVelocity: FUNC,
        setAngularVelocity: FUNC,
        applyForce: FUNC,
        applyLocalForce: FUNC,
        applyImpulse: FUNC,
        applyLocalImpulse: FUNC,
        applyTorque: FUNC,
        applyLocalTorque: FUNC,
        setGroup: FUNC,
        getGroup: FUNC,
        addGroup: FUNC,
        removeGroup: FUNC,
        setMask: FUNC,
        getMask: FUNC,
        addMask: FUNC,
        removeMask: FUNC,
        isUsingCCD: FUNC,
        useCCD: FUNC
      };
      CREATE_COLLIDER_PROXY = {
        INITED: false
      };
      ENTIRE_SHAPE = {
        impl: null,
        collider: null,
        attachedRigidBody: null,
        initialize: FUNC,
        onLoad: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC,
        setGroup: FUNC,
        getGroup: FUNC,
        addGroup: FUNC,
        removeGroup: FUNC,
        setMask: FUNC,
        getMask: FUNC,
        addMask: FUNC,
        removeMask: FUNC,
        setMaterial: FUNC,
        setAsTrigger: FUNC,
        setCenter: FUNC,
        getAABB: FUNC,
        getBoundingSphere: FUNC,
        updateSize: FUNC,
        updateRadius: FUNC,
        setRadius: FUNC,
        setCylinderHeight: FUNC,
        setDirection: FUNC,
        setHeight: FUNC,
        setShapeType: FUNC,
        setVertices: FUNC,
        setMesh: FUNC,
        setTerrain: FUNC,
        setNormal: FUNC,
        setConstant: FUNC,
        updateEventListener: FUNC
      };
      CREATE_CONSTRAINT_PROXY = {
        INITED: false
      };
      ENTIRE_CONSTRAINT = {
        impl: null,
        initialize: FUNC,
        onLoad: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC,
        setEnableCollision: FUNC,
        setConnectedBody: FUNC,
        setPivotA: FUNC,
        setPivotB: FUNC,
        setAxis: FUNC,
        setSecondaryAxis: FUNC,
        setBreakForce: FUNC,
        setBreakTorque: FUNC,
        setConstraintMode: FUNC,
        setLinearLimit: FUNC,
        setAngularExtent: FUNC,
        setLinearSoftConstraint: FUNC,
        setLinearStiffness: FUNC,
        setLinearDamping: FUNC,
        setLinearRestitution: FUNC,
        setSwingSoftConstraint: FUNC,
        setTwistSoftConstraint: FUNC,
        setSwingStiffness: FUNC,
        setSwingDamping: FUNC,
        setSwingRestitution: FUNC,
        setTwistStiffness: FUNC,
        setTwistDamping: FUNC,
        setTwistRestitution: FUNC,
        setDriverMode: FUNC,
        setLinearMotorTarget: FUNC,
        setLinearMotorVelocity: FUNC,
        setLinearMotorForceLimit: FUNC,
        setAngularMotorTarget: FUNC,
        setAngularMotorVelocity: FUNC,
        setAngularMotorForceLimit: FUNC,
        setAutoPivotB: FUNC,
        setLimitEnabled: FUNC,
        setLowerLimit: FUNC,
        setUpperLimit: FUNC,
        setMotorEnabled: FUNC,
        setMotorVelocity: FUNC,
        setMotorForceLimit: FUNC
      };
      CREATE_CHARACTER_CONTROLLER_PROXY = {
        INITED: false
      };
      ENTIRE_CHARACTER_CONTROLLER = {
        initialize: FUNC,
        onLoad: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC,
        onGround: FUNC,
        getPosition: FUNC,
        setPosition: FUNC,
        setStepOffset: FUNC,
        setSlopeLimit: FUNC,
        setContactOffset: FUNC,
        setDetectCollisions: FUNC,
        setOverlapRecovery: FUNC,
        setGroup: FUNC,
        getGroup: FUNC,
        addGroup: FUNC,
        removeGroup: FUNC,
        setMask: FUNC,
        getMask: FUNC,
        addMask: FUNC,
        removeMask: FUNC,
        move: FUNC,
        syncPhysicsToScene: FUNC,
        updateEventListener: FUNC,
        //IBoxCharacterController
        setHalfHeight: FUNC,
        setHalfSideExtent: FUNC,
        setHalfForwardExtent: FUNC,
        //ICapsuleCharacterController
        setRadius: FUNC,
        setHeight: FUNC
      };
    }
  };
});