System.register("q-bundled:///fs/cocos/physics-2d/framework/physics-selector.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "./physics-types.js"], function (_export, _context) {
  "use strict";

  var EDITOR, DEBUG, TEST, EDITOR_NOT_IN_PREVIEW, debug, errorID, ECollider2DType, EJoint2DType, selector, FUNC, ENTIRE_WORLD, EntireBody, CREATE_COLLIDER_PROXY, ENTIRE_SHAPE, CREATE_JOINT_PROXY, ENTIRE_JOINT;
  /*
   Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
  
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

  /* eslint-disable @typescript-eslint/no-unsafe-return */

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents

  function register(id, wrapper) {
    if (!EDITOR && !TEST) debug(`[PHYSICS2D]: register ${id}.`);
    selector.backend[id] = wrapper;
    if (!selector.physicsWorld || selector.id === id) {
      const mutableSelector = selector;
      mutableSelector.id = id;
      mutableSelector.wrapper = wrapper;
    }
  }
  function switchTo(id) {
    //if (!selector.runInEditor) return;
    const mutableSelector = selector;
    if (selector.physicsWorld && id !== selector.id && selector.backend[id] != null) {
      //selector.physicsWorld.destroy();//todo
      if (!TEST) debug(`[PHYSICS2D]: switch from ${selector.id} to ${id}.`);
      mutableSelector.id = id;
      mutableSelector.wrapper = selector.backend[id];
      mutableSelector.physicsWorld = createPhysicsWorld();
    } else {
      if (!EDITOR && !TEST) debug(`[PHYSICS2D]: using ${mutableSelector.id}.`);
      mutableSelector.physicsWorld = createPhysicsWorld();
    }
  }

  /**
   * @en
   * The physics selector is used to register and switch the physics engine backend.
   * @zh
   * 物理选择器用于注册和切换物理引擎后端。
   */

  function checkPhysicsModule(obj) {
    if (DEBUG && !TEST && !EDITOR_NOT_IN_PREVIEW && obj == null) {
      errorID(9600);
      return true;
    }
    return false;
  }
  function createPhysicsWorld() {
    if (DEBUG && checkPhysicsModule(selector.wrapper.PhysicsWorld)) {
      return ENTIRE_WORLD;
    }
    return new selector.wrapper.PhysicsWorld();
  }
  function createRigidBody() {
    const PHYSICS_2D_BUILTIN = selector.id === 'builtin';
    if (PHYSICS_2D_BUILTIN) {
      return EntireBody;
    } else {
      if (DEBUG && checkPhysicsModule(selector.wrapper.RigidBody)) {
        return EntireBody;
      }
      return new selector.wrapper.RigidBody();
    }
  }

  // shapes

  function createShape(type) {
    initColliderProxy();
    return CREATE_COLLIDER_PROXY[type]();
  }
  function initColliderProxy() {
    if (CREATE_COLLIDER_PROXY.INITED) return;
    CREATE_COLLIDER_PROXY.INITED = true;
    CREATE_COLLIDER_PROXY[ECollider2DType.BOX] = function createBoxShape() {
      if (DEBUG && checkPhysicsModule(selector.wrapper.BoxShape)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.BoxShape();
    };
    CREATE_COLLIDER_PROXY[ECollider2DType.CIRCLE] = function createCircleShape() {
      if (DEBUG && checkPhysicsModule(selector.wrapper.CircleShape)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.CircleShape();
    };
    CREATE_COLLIDER_PROXY[ECollider2DType.POLYGON] = function createPolygonShape() {
      if (DEBUG && checkPhysicsModule(selector.wrapper.PolygonShape)) {
        return ENTIRE_SHAPE;
      }
      return new selector.wrapper.PolygonShape();
    };
  }

  // joints

  function createJoint(type) {
    initJointProxy();
    return CREATE_JOINT_PROXY[type]();
  }
  function initJointProxy() {
    if (CREATE_JOINT_PROXY.INITED) return;
    CREATE_JOINT_PROXY.INITED = true;
    const PHYSICS_2D_BUILTIN = selector.id === 'builtin';
    CREATE_JOINT_PROXY[EJoint2DType.SPRING] = function createSpringJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.SpringJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.SpringJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.DISTANCE] = function createDistanceJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.DistanceJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.DistanceJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.FIXED] = function createFixedJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.FixedJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.FixedJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.MOUSE] = function createMouseJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.MouseJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.MouseJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.RELATIVE] = function createRelativeJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.RelativeJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.RelativeJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.SLIDER] = function createSliderJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.SliderJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.SliderJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.WHEEL] = function createWheelJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.WheelJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.WheelJoint();
      }
    };
    CREATE_JOINT_PROXY[EJoint2DType.HINGE] = function createHingeJoint() {
      if (PHYSICS_2D_BUILTIN) {
        return ENTIRE_JOINT;
      } else {
        if (DEBUG && checkPhysicsModule(selector.wrapper.HingeJoint)) {
          return ENTIRE_JOINT;
        }
        return new selector.wrapper.HingeJoint();
      }
    };
  }
  _export({
    checkPhysicsModule: checkPhysicsModule,
    createPhysicsWorld: createPhysicsWorld,
    createRigidBody: createRigidBody,
    createShape: createShape,
    createJoint: createJoint
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreIndexJs) {
      debug = _coreIndexJs.debug;
      errorID = _coreIndexJs.errorID;
    }, function (_physicsTypesJs) {
      ECollider2DType = _physicsTypesJs.ECollider2DType;
      EJoint2DType = _physicsTypesJs.EJoint2DType;
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
        setGravity: FUNC,
        setAllowSleep: FUNC,
        step: FUNC,
        syncPhysicsToScene: FUNC,
        syncSceneToPhysics: FUNC,
        raycast: FUNC,
        testPoint: FUNC,
        testAABB: FUNC,
        drawDebug: FUNC,
        clearContacts: FUNC
      };
      EntireBody = {
        impl: null,
        rigidBody: null,
        isAwake: false,
        isSleeping: false,
        initialize: FUNC,
        setType: FUNC,
        setLinearDamping: FUNC,
        setAngularDamping: FUNC,
        setGravityScale: FUNC,
        setFixedRotation: FUNC,
        setAllowSleep: FUNC,
        isActive: FUNC,
        setActive: FUNC,
        wakeUp: FUNC,
        sleep: FUNC,
        getMass: FUNC,
        getInertia: FUNC,
        getLinearVelocity: FUNC,
        setLinearVelocity: FUNC,
        getLinearVelocityFromWorldPoint: FUNC,
        getAngularVelocity: FUNC,
        setAngularVelocity: FUNC,
        getLocalVector: FUNC,
        getWorldVector: FUNC,
        getLocalPoint: FUNC,
        getWorldPoint: FUNC,
        getLocalCenter: FUNC,
        getWorldCenter: FUNC,
        applyForce: FUNC,
        applyForceToCenter: FUNC,
        applyTorque: FUNC,
        applyLinearImpulse: FUNC,
        applyLinearImpulseToCenter: FUNC,
        applyAngularImpulse: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC
      };
      CREATE_COLLIDER_PROXY = {
        INITED: false
      };
      ENTIRE_SHAPE = {
        impl: null,
        collider: null,
        worldAABB: null,
        worldPoints: null,
        worldPosition: null,
        worldRadius: null,
        initialize: FUNC,
        apply: FUNC,
        onLoad: FUNC,
        onEnable: FUNC,
        onDisable: FUNC,
        onDestroy: FUNC,
        onGroupChanged: FUNC
      };
      CREATE_JOINT_PROXY = {
        INITED: false
      };
      ENTIRE_JOINT = {
        impl: null,
        initialize: FUNC,
        apply: FUNC,
        setDampingRatio: FUNC,
        setFrequency: FUNC,
        setMaxForce: FUNC,
        setTarget: FUNC,
        setDistance: FUNC,
        setAngularOffset: FUNC,
        setCorrectionFactor: FUNC,
        setLinearOffset: FUNC,
        setMaxLength: FUNC,
        setMaxTorque: FUNC,
        setLowerLimit: FUNC,
        setUpperLimit: FUNC,
        setMaxMotorForce: FUNC,
        setMaxMotorTorque: FUNC,
        setMotorSpeed: FUNC,
        enableLimit: FUNC,
        enableMotor: FUNC,
        setLowerAngle: FUNC,
        setUpperAngle: FUNC
      };
    }
  };
});