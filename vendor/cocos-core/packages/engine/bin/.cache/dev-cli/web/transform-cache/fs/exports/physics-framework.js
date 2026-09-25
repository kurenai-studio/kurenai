System.register("q-bundled:///fs/exports/physics-framework.js", ["../cocos/physics/framework/index.js", "./base.js", "../cocos/physics/framework/deprecated.js"], function (_export, _context) {
  "use strict";

  var physics, cclegacy;
  return {
    setters: [function (_cocosPhysicsFrameworkIndexJs) {
      physics = _cocosPhysicsFrameworkIndexJs;
      _export({
        PhysicsSystem: _cocosPhysicsFrameworkIndexJs.PhysicsSystem,
        RigidBody: _cocosPhysicsFrameworkIndexJs.RigidBody,
        CharacterController: _cocosPhysicsFrameworkIndexJs.CharacterController,
        ConstantForce: _cocosPhysicsFrameworkIndexJs.ConstantForce,
        PhysicsMaterial: _cocosPhysicsFrameworkIndexJs.PhysicsMaterial,
        PhysicsRayResult: _cocosPhysicsFrameworkIndexJs.PhysicsRayResult,
        PhysicsLineStripCastResult: _cocosPhysicsFrameworkIndexJs.PhysicsLineStripCastResult,
        Collider: _cocosPhysicsFrameworkIndexJs.Collider,
        BoxCollider: _cocosPhysicsFrameworkIndexJs.BoxCollider,
        SphereCollider: _cocosPhysicsFrameworkIndexJs.SphereCollider,
        CapsuleCollider: _cocosPhysicsFrameworkIndexJs.CapsuleCollider,
        MeshCollider: _cocosPhysicsFrameworkIndexJs.MeshCollider,
        CylinderCollider: _cocosPhysicsFrameworkIndexJs.CylinderCollider,
        ConeCollider: _cocosPhysicsFrameworkIndexJs.ConeCollider,
        TerrainCollider: _cocosPhysicsFrameworkIndexJs.TerrainCollider,
        SimplexCollider: _cocosPhysicsFrameworkIndexJs.SimplexCollider,
        PlaneCollider: _cocosPhysicsFrameworkIndexJs.PlaneCollider,
        Constraint: _cocosPhysicsFrameworkIndexJs.Constraint,
        HingeConstraint: _cocosPhysicsFrameworkIndexJs.HingeConstraint,
        ConfigurableConstraint: _cocosPhysicsFrameworkIndexJs.ConfigurableConstraint,
        FixedConstraint: _cocosPhysicsFrameworkIndexJs.FixedConstraint,
        PointToPointConstraint: _cocosPhysicsFrameworkIndexJs.PointToPointConstraint,
        CapsuleCharacterController: _cocosPhysicsFrameworkIndexJs.CapsuleCharacterController,
        BoxCharacterController: _cocosPhysicsFrameworkIndexJs.BoxCharacterController,
        EAxisDirection: _cocosPhysicsFrameworkIndexJs.EAxisDirection,
        ERigidBodyType: _cocosPhysicsFrameworkIndexJs.ERigidBodyType,
        EColliderType: _cocosPhysicsFrameworkIndexJs.EColliderType,
        EPhysicsDrawFlags: _cocosPhysicsFrameworkIndexJs.EPhysicsDrawFlags
      });
    }, function (_baseJs) {
      cclegacy = _baseJs.cclegacy;
    }, function (_cocosPhysicsFrameworkDeprecatedJs) {
      var _exportObj = {};
      for (var _key in _cocosPhysicsFrameworkDeprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocosPhysicsFrameworkDeprecatedJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      /*
       Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated engine source code (the "Software"), a limited,
       worldwide, royalty-free, non-assignable, revocable and non-exclusive license
       to use Cocos Creator solely to develop games on your target platforms. You shall
       not use Cocos Creator software for developing other software or tools that's
       used for developing games. You are not granted to publish, distribute,
       sublicense, and/or sell copies of Cocos Creator.
      
       The software or tools in this License Agreement are licensed, not sold.
       Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
       */
      /// physics namespace ///
      _export("physics", physics);
      cclegacy.physics = physics;

      /// cc namespace ///
    }
  };
});