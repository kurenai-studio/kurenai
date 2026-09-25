System.register("q-bundled:///fs/cocos/physics-2d/framework/physics-types.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Enum, ERigidBody2DType, ECollider2DType, EJoint2DType, PhysicsGroup2D, PhysicsGroup, ERaycast2DType, Contact2DType, EPhysics2DDrawFlags, PHYSICS_2D_PTM_RATIO;
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
    }],
    execute: function () {
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
      _export("ERigidBody2DType", ERigidBody2DType = /*#__PURE__*/function (ERigidBody2DType) {
        /**
         * @en
         * zero mass, zero velocity, may be manually moved.
         * @zh
         * 零质量，零速度，可以手动移动。
         */
        ERigidBody2DType[ERigidBody2DType["Static"] = 0] = "Static";
        /**
         * @en
         * zero mass, non-zero velocity set by user.
         * @zh
         * 零质量，可以被设置速度。
         */
        ERigidBody2DType[ERigidBody2DType["Kinematic"] = 1] = "Kinematic";
        /**
         * @en
         * positive mass, non-zero velocity determined by forces.
         * @zh
         * 有质量，可以设置速度，力等。
         */
        ERigidBody2DType[ERigidBody2DType["Dynamic"] = 2] = "Dynamic";
        /**
         * @en
         * An extension of Kinematic type, can be animated by Animation.
         * @zh
         * Kinematic 类型的扩展，可以被动画控制动画效果。
         */
        ERigidBody2DType[ERigidBody2DType["Animated"] = 3] = "Animated";
        return ERigidBody2DType;
      }({}));
      Enum(ERigidBody2DType);
      _export("ECollider2DType", ECollider2DType = /*#__PURE__*/function (ECollider2DType) {
        ECollider2DType[ECollider2DType["None"] = 0] = "None";
        ECollider2DType[ECollider2DType["BOX"] = 1] = "BOX";
        ECollider2DType[ECollider2DType["CIRCLE"] = 2] = "CIRCLE";
        ECollider2DType[ECollider2DType["POLYGON"] = 3] = "POLYGON";
        return ECollider2DType;
      }({}));
      Enum(ECollider2DType);
      _export("EJoint2DType", EJoint2DType = /*#__PURE__*/function (EJoint2DType) {
        EJoint2DType[EJoint2DType["None"] = 0] = "None";
        EJoint2DType[EJoint2DType["DISTANCE"] = 1] = "DISTANCE";
        EJoint2DType[EJoint2DType["SPRING"] = 2] = "SPRING";
        EJoint2DType[EJoint2DType["WHEEL"] = 3] = "WHEEL";
        EJoint2DType[EJoint2DType["MOUSE"] = 4] = "MOUSE";
        EJoint2DType[EJoint2DType["FIXED"] = 5] = "FIXED";
        EJoint2DType[EJoint2DType["SLIDER"] = 6] = "SLIDER";
        EJoint2DType[EJoint2DType["RELATIVE"] = 7] = "RELATIVE";
        EJoint2DType[EJoint2DType["HINGE"] = 8] = "HINGE";
        return EJoint2DType;
      }({}));
      Enum(EJoint2DType);
      _export("PhysicsGroup2D", PhysicsGroup2D = /*#__PURE__*/function (PhysicsGroup2D) {
        PhysicsGroup2D[PhysicsGroup2D["DEFAULT"] = 1] = "DEFAULT";
        return PhysicsGroup2D;
      }({}));
      Enum(PhysicsGroup2D);

      // To keep the compatibility, don't use it internally, otherwise, enum value may be inlined to wrong value.
      // Use PhysicsGroup2D instead.
      _export("PhysicsGroup", PhysicsGroup = PhysicsGroup2D);
      /**
       * @en Enum for ERaycast2DType.
       * @zh 射线检测类型。
       * @enum ERaycast2DType.
       */
      _export("ERaycast2DType", ERaycast2DType = /*#__PURE__*/function (ERaycast2DType) {
        /**
         * @en
         * Detects closest collider on the raycast path.
         * @zh
         * 检测射线路径上最近的碰撞体。
         */
        ERaycast2DType[ERaycast2DType["Closest"] = 0] = "Closest";
        /**
         * @en
         * Detects any collider on the raycast path.
         * Once detects a collider, will stop the searching process.
         * @zh
         * 检测射线路径上任意的碰撞体。
         * 一旦检测到任何碰撞体，将立刻结束检测其他的碰撞体。
         */
        ERaycast2DType[ERaycast2DType["Any"] = 1] = "Any";
        /**
         * @en
         * Detects all colliders on the raycast path.
         * One collider may return several collision points(because one collider may have several fixtures,
         * one fixture will return one point, the point may inside collider), AllClosest will return the closest one.
         * @zh
         * 检测射线路径上所有的碰撞体。
         * 同一个碰撞体上有可能会返回多个碰撞点(因为一个碰撞体可能由多个夹具组成，每一个夹具会返回一个碰撞点，碰撞点有可能在碰撞体内部)，AllClosest 删选同一个碰撞体上最近的哪一个碰撞点。
         */
        ERaycast2DType[ERaycast2DType["AllClosest"] = 2] = "AllClosest";
        /**
         * @en
         * Detects all colliders on the raycast path.
         * One collider may return several collision points, All will return all these points.
         * @zh
         * 检测射线路径上所有的碰撞体。
         * 同一个碰撞体上有可能会返回多个碰撞点，All 将返回所有这些碰撞点。
         */
        ERaycast2DType[ERaycast2DType["All"] = 3] = "All";
        return ERaycast2DType;
      }({}));
      _export("Contact2DType", Contact2DType = {
        None: 'none-contact',
        BEGIN_CONTACT: 'begin-contact',
        END_CONTACT: 'end-contact',
        PRE_SOLVE: 'pre-solve',
        POST_SOLVE: 'post-solve'
      });
      _export("EPhysics2DDrawFlags", EPhysics2DDrawFlags = /*#__PURE__*/function (EPhysics2DDrawFlags) {
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["None"] = 0] = "None";
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Shape"] = 1] = "Shape";
        /// < draw shapes
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Joint"] = 2] = "Joint";
        /// < draw joint connections
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Aabb"] = 4] = "Aabb";
        /// < draw axis aligned bounding boxes
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Pair"] = 8] = "Pair";
        /// < draw broad-phase pairs
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["CenterOfMass"] = 16] = "CenterOfMass";
        /// < draw center of mass frame
        // #if B2_ENABLE_PARTICLE
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Particle"] = 32] = "Particle";
        /// < draw particles
        // #endif
        // #if B2_ENABLE_CONTROLLER
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["Controller"] = 64] = "Controller";
        /// @see b2Controller list
        // #endif
        EPhysics2DDrawFlags[EPhysics2DDrawFlags["All"] = 63] = "All";
        return EPhysics2DDrawFlags;
      }({}));
      _export("PHYSICS_2D_PTM_RATIO", PHYSICS_2D_PTM_RATIO = 32);
    }
  };
});