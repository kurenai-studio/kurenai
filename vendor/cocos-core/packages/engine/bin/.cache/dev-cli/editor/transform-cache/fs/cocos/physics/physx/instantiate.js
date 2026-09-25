System.register("q-bundled:///fs/cocos/physics/physx/instantiate.js", ["../../../../virtual/internal%253Aconstants.js", "../framework/physics-selector.js", "./physx-world.js", "./physx-rigid-body.js", "./shapes/physx-sphere-shape.js", "./shapes/physx-box-shape.js", "./shapes/physx-capsule-shape.js", "./shapes/physx-plane-shape.js", "./shapes/physx-trimesh-shape.js", "./shapes/physx-terrain-shape.js", "./shapes/physx-cylinder-shape.js", "./shapes/physx-cone-shape.js", "./joints/physx-fixed-joint.js", "./joints/physx-spherical-joint.js", "./joints/physx-revolute-joint.js", "./joints/physx-configurable-joint.js", "./character-controllers/physx-box-character-controller.js", "./character-controllers/physx-capsule-character-controller.js", "../../game/index.js", "./physx-adapter.js", "../framework/physics-system.js"], function (_export, _context) {
  "use strict";

  var BUILD, LOAD_PHYSX_MANUALLY, selector, PhysXWorld, PhysXRigidBody, PhysXSphereShape, PhysXBoxShape, PhysXCapsuleShape, PhysXPlaneShape, PhysXTrimeshShape, PhysXTerrainShape, PhysXCylinderShape, PhysXConeShape, PhysXFixedJoint, PhysXSphericalJoint, PhysXRevoluteJoint, PhysXConfigurableJoint, PhysXBoxCharacterController, PhysXCapsuleCharacterController, Game, game, initPhysXLibs, PhysicsSystem, loadPhysXPromise;
  function loadWasmModulePhysX() {
    if (BUILD && LOAD_PHYSX_MANUALLY) {
      if (loadPhysXPromise) return loadPhysXPromise;
      loadPhysXPromise = Promise.resolve().then(() => initPhysXLibs()).then(() => PhysicsSystem.constructAndRegisterManually());
      return loadPhysXPromise;
    } else {
      return Promise.resolve();
    }
  }
  _export("loadWasmModulePhysX", loadWasmModulePhysX);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      LOAD_PHYSX_MANUALLY = _virtualInternal253AconstantsJs.LOAD_PHYSX_MANUALLY;
    }, function (_frameworkPhysicsSelectorJs) {
      selector = _frameworkPhysicsSelectorJs.selector;
    }, function (_physxWorldJs) {
      PhysXWorld = _physxWorldJs.PhysXWorld;
    }, function (_physxRigidBodyJs) {
      PhysXRigidBody = _physxRigidBodyJs.PhysXRigidBody;
    }, function (_shapesPhysxSphereShapeJs) {
      PhysXSphereShape = _shapesPhysxSphereShapeJs.PhysXSphereShape;
    }, function (_shapesPhysxBoxShapeJs) {
      PhysXBoxShape = _shapesPhysxBoxShapeJs.PhysXBoxShape;
    }, function (_shapesPhysxCapsuleShapeJs) {
      PhysXCapsuleShape = _shapesPhysxCapsuleShapeJs.PhysXCapsuleShape;
    }, function (_shapesPhysxPlaneShapeJs) {
      PhysXPlaneShape = _shapesPhysxPlaneShapeJs.PhysXPlaneShape;
    }, function (_shapesPhysxTrimeshShapeJs) {
      PhysXTrimeshShape = _shapesPhysxTrimeshShapeJs.PhysXTrimeshShape;
    }, function (_shapesPhysxTerrainShapeJs) {
      PhysXTerrainShape = _shapesPhysxTerrainShapeJs.PhysXTerrainShape;
    }, function (_shapesPhysxCylinderShapeJs) {
      PhysXCylinderShape = _shapesPhysxCylinderShapeJs.PhysXCylinderShape;
    }, function (_shapesPhysxConeShapeJs) {
      PhysXConeShape = _shapesPhysxConeShapeJs.PhysXConeShape;
    }, function (_jointsPhysxFixedJointJs) {
      PhysXFixedJoint = _jointsPhysxFixedJointJs.PhysXFixedJoint;
    }, function (_jointsPhysxSphericalJointJs) {
      PhysXSphericalJoint = _jointsPhysxSphericalJointJs.PhysXSphericalJoint;
    }, function (_jointsPhysxRevoluteJointJs) {
      PhysXRevoluteJoint = _jointsPhysxRevoluteJointJs.PhysXRevoluteJoint;
    }, function (_jointsPhysxConfigurableJointJs) {
      PhysXConfigurableJoint = _jointsPhysxConfigurableJointJs.PhysXConfigurableJoint;
    }, function (_characterControllersPhysxBoxCharacterControllerJs) {
      PhysXBoxCharacterController = _characterControllersPhysxBoxCharacterControllerJs.PhysXBoxCharacterController;
    }, function (_characterControllersPhysxCapsuleCharacterControllerJs) {
      PhysXCapsuleCharacterController = _characterControllersPhysxCapsuleCharacterControllerJs.PhysXCapsuleCharacterController;
    }, function (_gameIndexJs) {
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
    }, function (_physxAdapterJs) {
      initPhysXLibs = _physxAdapterJs.initPhysXLibs;
    }, function (_frameworkPhysicsSystemJs) {
      PhysicsSystem = _frameworkPhysicsSystemJs.PhysicsSystem;
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

      game.once(Game.EVENT_PRE_SUBSYSTEM_INIT, () => {
        selector.register('physx', {
          PhysicsWorld: PhysXWorld,
          RigidBody: PhysXRigidBody,
          BoxShape: PhysXBoxShape,
          SphereShape: PhysXSphereShape,
          CapsuleShape: PhysXCapsuleShape,
          TrimeshShape: PhysXTrimeshShape,
          CylinderShape: PhysXCylinderShape,
          ConeShape: PhysXConeShape,
          TerrainShape: PhysXTerrainShape,
          PlaneShape: PhysXPlaneShape,
          PointToPointConstraint: PhysXSphericalJoint,
          HingeConstraint: PhysXRevoluteJoint,
          FixedConstraint: PhysXFixedJoint,
          ConfigurableConstraint: PhysXConfigurableJoint,
          BoxCharacterController: PhysXBoxCharacterController,
          CapsuleCharacterController: PhysXCapsuleCharacterController
        });
      });
    }
  };
});