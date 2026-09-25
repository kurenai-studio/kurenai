System.register("q-bundled:///fs/cocos/physics/framework/physics-enum.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Enum, ERigidBodyType, EAxisDirection, ED6Axis, ESimplexType, EColliderType, EConstraintType, EConstraintMode, EDriverMode, ECharacterControllerType, PhysicsGroup, EPhysicsDrawFlags;
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
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
      /**
       * @en
       * Rigid body type.
       * @zh
       * 刚体类型。
       */
      _export("ERigidBodyType", ERigidBodyType = /*#__PURE__*/function (ERigidBodyType) {
        /**
         * @en
         * Dynamic type.
         * @zh
         * 动态刚体。
         */
        ERigidBodyType[ERigidBodyType["DYNAMIC"] = 1] = "DYNAMIC";
        /**
         * @en
         * Static type.
         * @zh
         * 静态刚体。
         */
        ERigidBodyType[ERigidBodyType["STATIC"] = 2] = "STATIC";
        /**
         * @en
         * Kinematic type.
         * @zh
         * 运动学刚体。
         */
        ERigidBodyType[ERigidBodyType["KINEMATIC"] = 4] = "KINEMATIC";
        return ERigidBodyType;
      }({}));
      Enum(ERigidBodyType);

      /**
       * @en
       * Axis Direction.
       * @zh
       * 轴方向。
       */
      _export("EAxisDirection", EAxisDirection = /*#__PURE__*/function (EAxisDirection) {
        /**
         * @en
         * X axis.
         * @zh
         * X 轴。
         */
        EAxisDirection[EAxisDirection["X_AXIS"] = 0] = "X_AXIS";
        /**
         * @en
         * Y axis.
         * @zh
         * Y 轴。
         */
        EAxisDirection[EAxisDirection["Y_AXIS"] = 1] = "Y_AXIS";
        /**
         * @en
         * Z axis.
         * @zh
         * Z 轴。
         */
        EAxisDirection[EAxisDirection["Z_AXIS"] = 2] = "Z_AXIS";
        return EAxisDirection;
      }({}));
      Enum(EAxisDirection);

      /**
       * @en
       * Degree of freedom.
       * @zh
       * 自由度。
       */
      _export("ED6Axis", ED6Axis = /*#__PURE__*/function (ED6Axis) {
        /**
         * @en
         * X axis.
         * @zh
         * X 轴。
         */
        ED6Axis[ED6Axis["X"] = 0] = "X";
        /**
         * @en
         * Y axis.
         * @zh
         * Y 轴。
         */
        ED6Axis[ED6Axis["Y"] = 1] = "Y";
        /**
         * @en
         * Z axis.
         * @zh
         * Z 轴。
         */
        ED6Axis[ED6Axis["Z"] = 2] = "Z";
        /**
         * @en
         * Swing 1, directs toward the local Y axis.
         * @zh
         * 摆动 1，其方向朝向 Y 轴。
         */
        ED6Axis[ED6Axis["SWING1"] = 3] = "SWING1";
        /**
         * @en
         * Swing 2, directs toward the local Z axis.
         * @zh
         * 摆动 2，其方向朝向 Z 轴。
         */
        ED6Axis[ED6Axis["SWING2"] = 4] = "SWING2";
        /**
         * @en
         * Twist, directs toward the local X axis.
         * @zh
         * 扭转，其方向朝向 X 轴。
         */
        ED6Axis[ED6Axis["TWIST"] = 5] = "TWIST";
        return ED6Axis;
      }({}));
      Enum(ED6Axis);

      /**
       * @en
       * Simplex Type.
       * @zh
       * 单形体类型。
       */
      _export("ESimplexType", ESimplexType = /*#__PURE__*/function (ESimplexType) {
        /**
         * @en
         * Point.
         * @zh
         * 点。
         */
        ESimplexType[ESimplexType["VERTEX"] = 1] = "VERTEX";
        /**
         * @en
         * Line.
         * @zh
         * 线。
         */
        ESimplexType[ESimplexType["LINE"] = 2] = "LINE";
        /**
         * @en
         * Triangle.
         * @zh
         * 三角形。
         */
        ESimplexType[ESimplexType["TRIANGLE"] = 3] = "TRIANGLE";
        /**
         * @en
         * Tetrahedron.
         * @zh
         * 四面体。
         */
        ESimplexType[ESimplexType["TETRAHEDRON"] = 4] = "TETRAHEDRON";
        return ESimplexType;
      }({}));
      Enum(ESimplexType);

      /**
       * @en
       * Collider Type.
       * @zh
       * 碰撞体类型。
       */
      _export("EColliderType", EColliderType = /*#__PURE__*/function (EColliderType) {
        /**
         * @en
         * Box collider.
         * @zh
         * 盒子碰撞体。
         */
        EColliderType[EColliderType["BOX"] = 0] = "BOX";
        /**
         * @en
         * Sphere collider.
         * @zh
         * 球碰撞体。
         */
        EColliderType[EColliderType["SPHERE"] = 1] = "SPHERE";
        /**
         * @en
         * Capsule collider.
         * @zh
         * 胶囊碰撞体。
         */
        EColliderType[EColliderType["CAPSULE"] = 2] = "CAPSULE";
        /**
         * @en
         * Cylinder collider.
         * @zh
         * 圆柱碰撞体。
         */
        EColliderType[EColliderType["CYLINDER"] = 3] = "CYLINDER";
        /**
         * @en
         * Cone collider.
         * @zh
         * 圆锥碰撞体。
         */
        EColliderType[EColliderType["CONE"] = 4] = "CONE";
        /**
         * @en
         * Mesh collider.
         * @zh
         * 网格碰撞体。
         */
        EColliderType[EColliderType["MESH"] = 5] = "MESH";
        /**
         * @en
         * Plane collider.
         * @zh
         * 平面碰撞体。
         */
        EColliderType[EColliderType["PLANE"] = 6] = "PLANE";
        /**
         * @en
         * Simplex collider.
         * @zh
         * 单形体碰撞体。
         */
        EColliderType[EColliderType["SIMPLEX"] = 7] = "SIMPLEX";
        /**
         * @en
         * Terrain collider.
         * @zh
         * 地形碰撞体。
         */
        EColliderType[EColliderType["TERRAIN"] = 8] = "TERRAIN";
        return EColliderType;
      }({}));
      Enum(EColliderType);

      /**
       * @en
       * Constraint Type.
       * @zh
       * 约束类型。
       */
      _export("EConstraintType", EConstraintType = /*#__PURE__*/function (EConstraintType) {
        /**
         * @en
         * Point to point constraint.
         * @zh
         * 点对点约束。
         */
        EConstraintType[EConstraintType["POINT_TO_POINT"] = 0] = "POINT_TO_POINT";
        /**
         * @en
         * Hinge constraint.
         * @zh
         * 铰链约束。
         */
        EConstraintType[EConstraintType["HINGE"] = 1] = "HINGE";
        /**
         * @en
         * Fixed constraint.
         * @zh
         * 固定约束。
         */
        EConstraintType[EConstraintType["FIXED"] = 2] = "FIXED";
        /**
         * @en
         * Configurable constraint.
         * @zh
         * 可配置约束。
         */
        EConstraintType[EConstraintType["CONFIGURABLE"] = 3] = "CONFIGURABLE";
        return EConstraintType;
      }({}));
      Enum(EConstraintType);

      /**
       * @en
       * Constraint Mode for degrees of freedom.
       * @zh
       * 自由度约束模式。
       */
      _export("EConstraintMode", EConstraintMode = /*#__PURE__*/function (EConstraintMode) {
        /**
         * @en
         * Free mode, the specified degrees of freedom are free to move.
         * @zh
         * 自由模式，指定的自由度可以自由移动。
         */
        EConstraintMode[EConstraintMode["FREE"] = 0] = "FREE";
        /**
         * @en
         * Limited mode, the specified degrees of freedom are limited.
         * @zh
         * 限制模式，指定的自由度受到限制。
         */
        EConstraintMode[EConstraintMode["LIMITED"] = 1] = "LIMITED";
        /**
         * @en
         * Locked mode, the specified degrees of freedom are locked.
         * @zh
         * 锁定模式，指定的自由度被锁定。
         */
        EConstraintMode[EConstraintMode["LOCKED"] = 2] = "LOCKED";
        return EConstraintMode;
      }({}));
      Enum(EConstraintMode);

      /**
       * @en
       * Driver Type.
       * @zh
       * 驱动类型。
       */
      _export("EDriverMode", EDriverMode = /*#__PURE__*/function (EDriverMode) {
        /**
         * @en
         * Disabled.
         * @zh
         * 禁用。
         */
        EDriverMode[EDriverMode["DISABLED"] = 0] = "DISABLED";
        /**
         * @en
         * Servo motor, which targets the specified rotation angle.
         * @zh
         * 伺服电机，旋转到特定角度。
         */
        EDriverMode[EDriverMode["SERVO"] = 1] = "SERVO";
        /**
         * @en
         * Induction motor, which targets the specified velocity.
         * @zh
         * 感应电机，旋转到特定速度。
         */
        EDriverMode[EDriverMode["INDUCTION"] = 2] = "INDUCTION";
        return EDriverMode;
      }({}));
      Enum(EDriverMode);

      /**
       * @en
       * Character Controller Type.
       * @zh
       * 角色控制器类型。
       */
      _export("ECharacterControllerType", ECharacterControllerType = /*#__PURE__*/function (ECharacterControllerType) {
        /**
         * @en
         * Box Character Controller.
         * @zh
         * 盒体角色控制器。
         */
        ECharacterControllerType[ECharacterControllerType["BOX"] = 0] = "BOX";
        /**
         * @en
         * Capsule Character Controller.
         * @zh
         * 胶囊体角色控制器。
         */
        ECharacterControllerType[ECharacterControllerType["CAPSULE"] = 1] = "CAPSULE";
        return ECharacterControllerType;
      }({}));
      Enum(ECharacterControllerType);

      /**
       * @en
       * Physics Group.
       * @zh
       * 物理分组。
       */
      _export("PhysicsGroup", PhysicsGroup = /*#__PURE__*/function (PhysicsGroup) {
        /**
         * @en
         * Default group.
         * @zh
         * 默认分组。
         */
        PhysicsGroup[PhysicsGroup["DEFAULT"] = 1] = "DEFAULT";
        return PhysicsGroup;
      }({}));
      Enum(PhysicsGroup);
      _export("EPhysicsDrawFlags", EPhysicsDrawFlags = /*#__PURE__*/function (EPhysicsDrawFlags) {
        /**
         * @en
         * Draw nothing.
         * @zh
         * 不绘制。
        */
        EPhysicsDrawFlags[EPhysicsDrawFlags["NONE"] = 0] = "NONE";
        /**
         * @en
         * Draw wireframe
         * @zh
         * 绘制线框。
        */
        EPhysicsDrawFlags[EPhysicsDrawFlags["WIRE_FRAME"] = 1] = "WIRE_FRAME";
        /**
         * @en
         * Draw Constraint.
         * @zh
         * 绘制约束
        */
        EPhysicsDrawFlags[EPhysicsDrawFlags["CONSTRAINT"] = 2] = "CONSTRAINT";
        /**
         * @en
         * Draw AABB.
         * @zh
         * 绘制包围盒。
        */
        EPhysicsDrawFlags[EPhysicsDrawFlags["AABB"] = 4] = "AABB";
        return EPhysicsDrawFlags;
      }({}));
      Enum(EPhysicsDrawFlags);
    }
  };
});