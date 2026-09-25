System.register("q-bundled:///fs/cocos/physics/framework/deprecated.js", ["./physics-system.js", "../../core/index.js", "./components/colliders/box-collider.js", "./components/colliders/sphere-collider.js", "./components/colliders/capsule-collider.js", "./components/colliders/cylinder-collider.js", "./components/colliders/mesh-collider.js", "./components/rigid-body.js", "./components/colliders/collider.js", "./assets/physics-material.js", "./components/constraints/constraint.js"], function (_export, _context) {
  "use strict";

  var PhysicsSystem, replaceProperty, removeProperty, js, cclegacy, BoxCollider, SphereCollider, CapsuleCollider, CylinderCollider, MeshCollider, RigidBody, Collider, PhysicsMaterial, Constraint;
  return {
    setters: [function (_physicsSystemJs) {
      PhysicsSystem = _physicsSystemJs.PhysicsSystem;
    }, function (_coreIndexJs) {
      replaceProperty = _coreIndexJs.replaceProperty;
      removeProperty = _coreIndexJs.removeProperty;
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_componentsCollidersBoxColliderJs) {
      BoxCollider = _componentsCollidersBoxColliderJs.BoxCollider;
    }, function (_componentsCollidersSphereColliderJs) {
      SphereCollider = _componentsCollidersSphereColliderJs.SphereCollider;
    }, function (_componentsCollidersCapsuleColliderJs) {
      CapsuleCollider = _componentsCollidersCapsuleColliderJs.CapsuleCollider;
    }, function (_componentsCollidersCylinderColliderJs) {
      CylinderCollider = _componentsCollidersCylinderColliderJs.CylinderCollider;
    }, function (_componentsCollidersMeshColliderJs) {
      MeshCollider = _componentsCollidersMeshColliderJs.MeshCollider;
    }, function (_componentsRigidBodyJs) {
      RigidBody = _componentsRigidBodyJs.RigidBody;
    }, function (_componentsCollidersColliderJs) {
      Collider = _componentsCollidersColliderJs.Collider;
    }, function (_assetsPhysicsMaterialJs) {
      PhysicsMaterial = _assetsPhysicsMaterialJs.PhysicsMaterial;
    }, function (_componentsConstraintsConstraintJs) {
      Constraint = _componentsConstraintsConstraintJs.Constraint;
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

      replaceProperty(PhysicsSystem, 'PhysicsSystem', [{
        name: 'ins',
        newName: 'instance'
      }, {
        name: 'PHYSICS_AMMO',
        newName: 'PHYSICS_BULLET'
      }]);
      replaceProperty(PhysicsSystem.prototype, 'PhysicsSystem.prototype', [{
        name: 'deltaTime',
        newName: 'fixedTimeStep'
      }, {
        name: 'maxSubStep',
        newName: 'maxSubSteps'
      }]);
      removeProperty(PhysicsSystem.prototype, 'PhysicsSystem.prototype', [{
        name: 'useFixedTime'
      }, {
        name: 'useCollisionMatrix'
      }, {
        name: 'updateCollisionMatrix'
      }, {
        name: 'resetCollisionMatrix'
      }, {
        name: 'isCollisionGroup'
      }, {
        name: 'setCollisionGroup'
      }]);
      replaceProperty(Collider.prototype, 'Collider.prototype', [{
        name: 'attachedRigidbody',
        newName: 'attachedRigidBody'
      }, {
        name: 'TYPE',
        newName: 'type'
      }]);
      replaceProperty(Collider, 'Collider', [{
        name: 'EColliderType',
        newName: 'Type'
      }, {
        name: 'EAxisDirection',
        newName: 'Axis'
      }]);
      replaceProperty(Constraint, 'Constraint', [{
        name: 'EConstraintType',
        newName: 'Type'
      }]);
      replaceProperty(BoxCollider.prototype, 'BoxCollider.prototype', [{
        name: 'boxShape',
        newName: 'shape'
      }]);
      replaceProperty(SphereCollider.prototype, 'SphereCollider.prototype', [{
        name: 'sphereShape',
        newName: 'shape'
      }]);
      replaceProperty(CapsuleCollider.prototype, 'CapsuleCollider.prototype', [{
        name: 'capsuleShape',
        newName: 'shape'
      }]);
      replaceProperty(RigidBody.prototype, 'RigidBody.prototype', [{
        name: 'rigidBody',
        newName: 'body'
      }]);
      replaceProperty(RigidBody, 'RigidBody', [{
        name: 'ERigidBodyType',
        newName: 'Type'
      }]);
      removeProperty(RigidBody.prototype, 'RigidBody.prototype', [{
        name: 'fixedRotation'
      }]);

      /**
       * Alias of [[RigidBody]]
       * @deprecated Since v1.2
       */
      _export("RigidBodyComponent", RigidBody);
      cclegacy.RigidBodyComponent = RigidBody;
      js.setClassAlias(RigidBody, 'cc.RigidBodyComponent');
      /**
       * Alias of [[Collider]]
       * @deprecated Since v1.2
       */
      _export("ColliderComponent", Collider);
      cclegacy.ColliderComponent = Collider;
      js.setClassAlias(Collider, 'cc.ColliderComponent');
      /**
       * Alias of [[BoxCollider]]
       * @deprecated Since v1.2
       */
      _export("BoxColliderComponent", BoxCollider);
      cclegacy.BoxColliderComponent = BoxCollider;
      js.setClassAlias(BoxCollider, 'cc.BoxColliderComponent');
      /**
       * Alias of [[SphereCollider]]
       * @deprecated Since v1.2
       */
      _export("SphereColliderComponent", SphereCollider);
      cclegacy.SphereColliderComponent = SphereCollider;
      js.setClassAlias(SphereCollider, 'cc.SphereColliderComponent');
      /**
       * Alias of [[CapsuleCollider]]
       * @deprecated Since v1.2
       */
      _export("CapsuleColliderComponent", CapsuleCollider);
      js.setClassAlias(CapsuleCollider, 'cc.CapsuleColliderComponent');
      /**
       * Alias of [[MeshCollider]]
       * @deprecated Since v1.2
       */
      _export("MeshColliderComponent", MeshCollider);
      js.setClassAlias(MeshCollider, 'cc.MeshColliderComponent');
      /**
       * Alias of [[CylinderCollider]]
       * @deprecated Since v1.2
       */
      _export("CylinderColliderComponent", CylinderCollider);
      js.setClassAlias(CylinderCollider, 'cc.CylinderColliderComponent');
      /**
       * Alias of [[PhysicsMaterial]]
       * @deprecated Since v1.2
       */
      _export("PhysicMaterial", PhysicsMaterial);
      cclegacy.PhysicMaterial = PhysicsMaterial;
      js.setClassAlias(PhysicsMaterial, 'cc.PhysicMaterial');
    }
  };
});