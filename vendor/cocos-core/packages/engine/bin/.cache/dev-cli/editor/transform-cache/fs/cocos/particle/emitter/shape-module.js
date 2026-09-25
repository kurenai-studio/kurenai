System.register("q-bundled:///fs/cocos/particle/emitter/shape-module.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../animator/curve-range.js", "../enum.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, formerlySerializedAs, serializable, visible, range, Mat4, Quat, Vec2, Vec3, clamp, pingPong, random, randomRange, repeat, toDegree, toRadian, warn, CurveRange, ParticleArcMode, ParticleEmitLocation, ParticleShapeType, fixedAngleUnitVector2, particleEmitZAxis, randomPointBetweenCircleAtFixedAngle, randomPointBetweenSphere, randomPointInCube, randomSign, randomSortArray, randomUnitVector, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _intermediVec, _intermediArr, _unitBoxExtent, ShapeModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function getShapeTypeEnumName(enumValue) {
    let enumName = '';
    for (const key in ParticleShapeType) {
      const value = ParticleShapeType[key];
      if (typeof value === 'number' && value === enumValue) {
        enumName = key;
        break;
      }
    }
    return enumName;
  }

  /**
   * @en
   * This module defines the the volume or surface from which particles can be emitted, and the direction of the start velocity.
   * The Shape property defines the shape of the emission volume, and the rest of the module properties vary depending on the Shape you choose.
   * All shapes have properties that define their dimensions, such as the Radius property.
   * To edit these, drag the handles on the wireframe emitter shape in the Scene view.
   * The choice of shape affects the region from which particles can be emitted, but also the initial direction of the particles.
   * @zh
   * 本模块定义一个发射体或发射面，粒子将会从它进行发射，并且定义了粒子发射的初始方向和初始速度。
   * 形状属性定义粒子系统的发射体，剩下的属性依赖于选择的形状。
   * 所有形状都具有定义其大小的属性，例如 Radius 属性。要编辑这些属性，请在视图中拖动线框发射器形状上的控制柄。
   * 形状的选择会影响可发射粒子的区域，但也会影响粒子的初始方向。
   */

  function sphereEmit(emitFrom, radius, radiusThickness, pos, dir) {
    switch (emitFrom) {
      case ParticleEmitLocation.Volume:
        randomPointBetweenSphere(pos, radius * (1 - radiusThickness), radius);
        Vec3.normalize(dir, pos);
        break;
      case ParticleEmitLocation.Shell:
        randomUnitVector(pos);
        Vec3.multiplyScalar(pos, pos, radius);
        Vec3.normalize(dir, pos);
        break;
      default:
        warn(`${emitFrom} is not supported for sphere emitter.`);
    }
  }
  function hemisphereEmit(emitFrom, radius, radiusThickness, pos, dir) {
    switch (emitFrom) {
      case ParticleEmitLocation.Volume:
        randomPointBetweenSphere(pos, radius * (1 - radiusThickness), radius);
        if (pos.z > 0) {
          pos.z *= -1;
        }
        Vec3.normalize(dir, pos);
        break;
      case ParticleEmitLocation.Shell:
        randomUnitVector(pos);
        Vec3.multiplyScalar(pos, pos, radius);
        if (pos.z > 0) {
          pos.z *= -1;
        }
        Vec3.normalize(dir, pos);
        break;
      default:
        warn(`${emitFrom} is not supported for hemisphere emitter.`);
    }
  }
  function coneEmit(emitFrom, radius, radiusThickness, theta, angle, length, pos, dir) {
    switch (emitFrom) {
      case ParticleEmitLocation.Base:
        randomPointBetweenCircleAtFixedAngle(pos, radius * (1 - radiusThickness), radius, theta);
        Vec2.multiplyScalar(dir, pos, Math.sin(angle));
        dir.z = -Math.cos(angle) * radius;
        Vec3.normalize(dir, dir);
        pos.z = 0;
        break;
      case ParticleEmitLocation.Shell:
        fixedAngleUnitVector2(pos, theta);
        Vec2.multiplyScalar(dir, pos, Math.sin(angle));
        dir.z = -Math.cos(angle);
        Vec3.normalize(dir, dir);
        Vec2.multiplyScalar(pos, pos, radius);
        pos.z = 0;
        break;
      case ParticleEmitLocation.Volume:
        randomPointBetweenCircleAtFixedAngle(pos, radius * (1 - radiusThickness), radius, theta);
        Vec2.multiplyScalar(dir, pos, Math.sin(angle));
        dir.z = -Math.cos(angle) * radius;
        Vec3.normalize(dir, dir);
        pos.z = 0;
        Vec3.add(pos, pos, Vec3.multiplyScalar(_intermediVec, dir, length * random() / -dir.z));
        break;
      default:
        warn(`${emitFrom} is not supported for cone emitter.`);
    }
  }
  function boxEmit(emitFrom, boxThickness, pos, dir) {
    switch (emitFrom) {
      case ParticleEmitLocation.Volume:
        randomPointInCube(pos, _unitBoxExtent);
        // randomPointBetweenCube(pos, vec3.multiply(_intermediVec, _unitBoxExtent, boxThickness), _unitBoxExtent);
        break;
      case ParticleEmitLocation.Shell:
        _intermediArr[0] = randomRange(-0.5, 0.5);
        _intermediArr[1] = randomRange(-0.5, 0.5);
        _intermediArr[2] = randomSign() * 0.5;
        randomSortArray(_intermediArr);
        applyBoxThickness(_intermediArr, boxThickness);
        Vec3.set(pos, _intermediArr[0], _intermediArr[1], _intermediArr[2]);
        break;
      case ParticleEmitLocation.Edge:
        _intermediArr[0] = randomRange(-0.5, 0.5);
        _intermediArr[1] = randomSign() * 0.5;
        _intermediArr[2] = randomSign() * 0.5;
        randomSortArray(_intermediArr);
        applyBoxThickness(_intermediArr, boxThickness);
        Vec3.set(pos, _intermediArr[0], _intermediArr[1], _intermediArr[2]);
        break;
      default:
        warn(`${emitFrom} is not supported for box emitter.`);
    }
    Vec3.copy(dir, particleEmitZAxis);
  }
  function circleEmit(radius, radiusThickness, theta, pos, dir) {
    randomPointBetweenCircleAtFixedAngle(pos, radius * (1 - radiusThickness), radius, theta);
    Vec3.normalize(dir, pos);
  }
  function applyBoxThickness(pos, thickness) {
    if (thickness.x > 0) {
      pos[0] += 0.5 * randomRange(-thickness.x, thickness.x);
      pos[0] = clamp(pos[0], -0.5, 0.5);
    }
    if (thickness.y > 0) {
      pos[1] += 0.5 * randomRange(-thickness.y, thickness.y);
      pos[1] = clamp(pos[1], -0.5, 0.5);
    }
    if (thickness.z > 0) {
      pos[2] += 0.5 * randomRange(-thickness.z, thickness.z);
      pos[2] = clamp(pos[2], -0.5, 0.5);
    }
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      clamp = _coreIndexJs.clamp;
      pingPong = _coreIndexJs.pingPong;
      random = _coreIndexJs.random;
      randomRange = _coreIndexJs.randomRange;
      repeat = _coreIndexJs.repeat;
      toDegree = _coreIndexJs.toDegree;
      toRadian = _coreIndexJs.toRadian;
      warn = _coreIndexJs.warn;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
    }, function (_enumJs) {
      ParticleArcMode = _enumJs.ParticleArcMode;
      ParticleEmitLocation = _enumJs.ParticleEmitLocation;
      ParticleShapeType = _enumJs.ParticleShapeType;
    }, function (_particleGeneralFunctionJs) {
      fixedAngleUnitVector2 = _particleGeneralFunctionJs.fixedAngleUnitVector2;
      particleEmitZAxis = _particleGeneralFunctionJs.particleEmitZAxis;
      randomPointBetweenCircleAtFixedAngle = _particleGeneralFunctionJs.randomPointBetweenCircleAtFixedAngle;
      randomPointBetweenSphere = _particleGeneralFunctionJs.randomPointBetweenSphere;
      randomPointInCube = _particleGeneralFunctionJs.randomPointInCube;
      randomSign = _particleGeneralFunctionJs.randomSign;
      randomSortArray = _particleGeneralFunctionJs.randomSortArray;
      randomUnitVector = _particleGeneralFunctionJs.randomUnitVector;
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
      _intermediVec = new Vec3(0, 0, 0);
      _intermediArr = [0, 0, 0];
      _unitBoxExtent = new Vec3(0.5, 0.5, 0.5);
      _export("default", ShapeModule = (_dec = ccclass('cc.ShapeModule'), _dec2 = displayOrder(13), _dec3 = tooltip('i18n:shapeModule.position'), _dec4 = displayOrder(14), _dec5 = tooltip('i18n:shapeModule.rotation'), _dec6 = displayOrder(15), _dec7 = tooltip('i18n:shapeModule.scale'), _dec8 = displayOrder(6), _dec9 = tooltip('i18n:shapeModule.arc'), _dec0 = visible(function () {
        const subset = ['Cone', 'Circle'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec1 = displayOrder(5), _dec10 = tooltip('i18n:shapeModule.angle'), _dec11 = visible(function () {
        const subset = ['Cone'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec12 = displayOrder(0), _dec13 = type(ParticleShapeType), _dec14 = formerlySerializedAs('shapeType'), _dec15 = displayOrder(1), _dec16 = type(ParticleShapeType), _dec17 = tooltip('i18n:shapeModule.shapeType'), _dec18 = type(ParticleEmitLocation), _dec19 = displayOrder(2), _dec20 = tooltip('i18n:shapeModule.emitFrom'), _dec21 = visible(function () {
        const subset = ['Box', 'Cone', 'Sphere', 'Hemisphere'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec22 = displayOrder(16), _dec23 = tooltip('i18n:shapeModule.alignToDirection'), _dec24 = displayOrder(17), _dec25 = tooltip('i18n:shapeModule.randomDirectionAmount'), _dec26 = displayOrder(18), _dec27 = tooltip('i18n:shapeModule.sphericalDirectionAmount'), _dec28 = displayOrder(19), _dec29 = tooltip('i18n:shapeModule.randomPositionAmount'), _dec30 = displayOrder(3), _dec31 = tooltip('i18n:shapeModule.radius'), _dec32 = visible(function () {
        const subset = ['Circle', 'Cone', 'Sphere', 'Hemisphere'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec33 = displayOrder(4), _dec34 = tooltip('i18n:shapeModule.radiusThickness'), _dec35 = visible(function () {
        const subset = ['Circle', 'Cone', 'Sphere', 'Hemisphere'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec36 = type(ParticleArcMode), _dec37 = displayOrder(7), _dec38 = tooltip('i18n:shapeModule.arcMode'), _dec39 = visible(function () {
        const subset = ['Cone', 'Circle'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec40 = visible(function noArc() {
        return this.arcMode !== ParticleArcMode.Random;
      }), _dec41 = displayOrder(9), _dec42 = tooltip('i18n:shapeModule.arcSpread'), _dec43 = visible(function () {
        const subset = ['Cone', 'Circle'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec44 = type(CurveRange), _dec45 = visible(function noArc() {
        return this.arcMode !== ParticleArcMode.Random;
      }), _dec46 = range([0, 1]), _dec47 = displayOrder(10), _dec48 = tooltip('i18n:shapeModule.arcSpeed'), _dec49 = visible(function () {
        const subset = ['Cone', 'Circle'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec50 = displayOrder(11), _dec51 = tooltip('i18n:shapeModule.length'), _dec52 = visible(function () {
        const subset = ['Cone'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec53 = displayOrder(12), _dec54 = tooltip('i18n:shapeModule.boxThickness'), _dec55 = visible(function () {
        const subset = ['Box'];
        const enumName = getShapeTypeEnumName(this.shapeType);
        return subset.includes(enumName);
      }), _dec(_class = (_class2 = class ShapeModule {
        /**
         * @en Emitter position.
         * @zh 粒子发射器位置。
         */
        get position() {
          return this._position;
        }
        set position(val) {
          this._position = val;
          this.constructMat();
        }

        /**
         * @en Emitter rotation.
         * @zh 粒子发射器旋转角度。
         */
        get rotation() {
          return this._rotation;
        }
        set rotation(val) {
          this._rotation = val;
          this.constructMat();
        }

        /**
         * @en Emitter size scale.
         * @zh 粒子发射器缩放比例。
         */
        get scale() {
          return this._scale;
        }
        set scale(val) {
          this._scale = val;
          this.constructMat();
        }

        /**
         * @en Particles will be emitted in an arc if shape is Cone or Circle.
         * @zh 粒子发射器在一个扇形范围内发射。
         */
        get arc() {
          return toDegree(this._arc);
        }
        set arc(val) {
          this._arc = toRadian(val);
        }

        /**
         * @en The angle of the Cone.<bg>
         * Define how the cone opening and closing.
         * @zh 圆锥的轴与母线的夹角<bg>。
         * 决定圆锥发射器的开合程度。
         */
        get angle() {
          return Math.round(toDegree(this._angle) * 100) / 100;
        }
        set angle(val) {
          this._angle = toRadian(val);
        }
        /**
         * @en Enable this module or not.
         * @zh 是否启用。
         */
        get enable() {
          return this._enable;
        }
        set enable(val) {
          this._enable = val;
        }

        /**
         * @en Emitter [[ShapeType]].
         * @zh 粒子发射器类型 [[ShapeType]]。
         *
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */

        get shapeType() {
          return this._shapeType;
        }
        set shapeType(val) {
          this._shapeType = val;
          switch (this._shapeType) {
            case ParticleShapeType.Box:
              if (this.emitFrom === ParticleEmitLocation.Base) {
                this.emitFrom = ParticleEmitLocation.Volume;
              }
              break;
            case ParticleShapeType.Cone:
              if (this.emitFrom === ParticleEmitLocation.Edge) {
                this.emitFrom = ParticleEmitLocation.Base;
              }
              break;
            case ParticleShapeType.Sphere:
            case ParticleShapeType.Hemisphere:
              if (this.emitFrom === ParticleEmitLocation.Base || this.emitFrom === ParticleEmitLocation.Edge) {
                this.emitFrom = ParticleEmitLocation.Volume;
              }
              break;
            default:
              break;
          }
        }

        /**
         * @en Particles emitted from which part of the shape [[EmitLocation]] (Box Cone Sphere Hemisphere).
         * @zh 粒子从发射器哪个部位发射 [[EmitLocation]]。
         */

        constructor() {
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "_shapeType", _descriptor2, this);
          _initializerDefineProperty(this, "emitFrom", _descriptor3, this);
          /**
           * @en Align particle with particle direction.
           * @zh 根据粒子的初始方向决定粒子的移动方向。
           */
          _initializerDefineProperty(this, "alignToDirection", _descriptor4, this);
          /**
           * @en Particle direction random amount.
           * @zh 粒子生成方向随机设定。
           */
          _initializerDefineProperty(this, "randomDirectionAmount", _descriptor5, this);
          /**
           * @en Blend particle directions towards a spherical direction, where they travel outwards from the center of their transform.
           * @zh 表示当前发射方向与当前位置到结点中心连线方向的插值。
           */
          _initializerDefineProperty(this, "sphericalDirectionAmount", _descriptor6, this);
          /**
           * @en Particle position random amount.
           * @zh 粒子生成位置随机设定（设定此值为非 0 会使粒子生成位置超出生成器大小范围）。
           */
          _initializerDefineProperty(this, "randomPositionAmount", _descriptor7, this);
          /**
           * @en Emition radius (available for Circle Cone Sphere Hemisphere).
           * @zh 粒子发射器半径。
           */
          _initializerDefineProperty(this, "radius", _descriptor8, this);
          /**
           * @en Emit position in shape (available for Circle Cone Sphere Hemisphere): <bg>
           * - 0 Emit from surface;
           * - 1 Emit from volume center;
           * - 0 to 1 Emit within surface and volume center.
           * @zh 粒子发射器发射位置（对 Box 类型的发射器无效）：<bg>
           * - 0 表示从表面发射；
           * - 1 表示从中心发射；
           * - 0 ~ 1 之间表示在中心到表面之间发射。
           */
          _initializerDefineProperty(this, "radiusThickness", _descriptor9, this);
          /**
           * @en Arc mode for Cone and Circle shape.
           * @zh 粒子在扇形范围内的发射方式 [[ArcMode]]。
           */
          _initializerDefineProperty(this, "arcMode", _descriptor0, this);
          /**
           * @en Control arc spread for Cone and circle shape.
           * @zh 控制可能产生粒子的弧周围的离散间隔。
           */
          _initializerDefineProperty(this, "arcSpread", _descriptor1, this);
          /**
           * @en Emit speed around arc (available for Cone and Circle).
           * @zh 粒子沿圆周发射的速度。
           */
          _initializerDefineProperty(this, "arcSpeed", _descriptor10, this);
          /**
           * @en The length from Cone bottom to top.
           * @zh 圆锥顶部截面距离底部的轴长<bg>。
           * 决定圆锥发射器的高度。
           */
          _initializerDefineProperty(this, "length", _descriptor11, this);
          /**
           * @en Shape thickness for box shape.
           * @zh 粒子发射器发射位置（针对 Box 类型的粒子发射器）。
           */
          _initializerDefineProperty(this, "boxThickness", _descriptor12, this);
          _initializerDefineProperty(this, "_position", _descriptor13, this);
          _initializerDefineProperty(this, "_rotation", _descriptor14, this);
          _initializerDefineProperty(this, "_scale", _descriptor15, this);
          _initializerDefineProperty(this, "_arc", _descriptor16, this);
          _initializerDefineProperty(this, "_angle", _descriptor17, this);
          this.mat = new Mat4();
          this.quat = new Quat();
          this.particleSystem = null;
          this.lastTime = 0;
          this.totalAngle = 0;
        }

        /**
         * @en Apply particle system to this shape and create shape transform matrix.
         * @zh 把发射形状应用到粒子系统，并且创建发射形状变换矩阵。
         * @param ps @en Emit shape applied to which Particle system. @zh 使用发射形状的粒子系统。
         * @internal
         */
        onInit(ps) {
          this.particleSystem = ps;
          this.constructMat();
          this.lastTime = this.particleSystem.time;
        }

        /**
         * @en Emit particle by this shape.
         * @zh 通过这个形状发射粒子。
         * @param p @en Particle emitted. @zh 发射出来的粒子。
         * @internal
         */
        emit(p) {
          switch (this.shapeType) {
            case ParticleShapeType.Box:
              boxEmit(this.emitFrom, this.boxThickness, p.position, p.velocity);
              break;
            case ParticleShapeType.Circle:
              circleEmit(this.radius, this.radiusThickness, this.generateArcAngle(), p.position, p.velocity);
              break;
            case ParticleShapeType.Cone:
              coneEmit(this.emitFrom, this.radius, this.radiusThickness, this.generateArcAngle(), this._angle, this.length, p.position, p.velocity);
              break;
            case ParticleShapeType.Sphere:
              sphereEmit(this.emitFrom, this.radius, this.radiusThickness, p.position, p.velocity);
              break;
            case ParticleShapeType.Hemisphere:
              hemisphereEmit(this.emitFrom, this.radius, this.radiusThickness, p.position, p.velocity);
              break;
            default:
              warn(`${this.shapeType} shapeType is not supported by ShapeModule.`);
          }
          if (this.randomPositionAmount > 0) {
            p.position.x += randomRange(-this.randomPositionAmount, this.randomPositionAmount);
            p.position.y += randomRange(-this.randomPositionAmount, this.randomPositionAmount);
            p.position.z += randomRange(-this.randomPositionAmount, this.randomPositionAmount);
          }
          Vec3.transformQuat(p.velocity, p.velocity, this.quat);
          Vec3.transformMat4(p.position, p.position, this.mat);
          if (this.sphericalDirectionAmount > 0) {
            const sphericalVel = Vec3.normalize(_intermediVec, p.position);
            Vec3.lerp(p.velocity, p.velocity, sphericalVel, this.sphericalDirectionAmount);
          }
          this.lastTime = this.particleSystem.time;
        }
        constructMat() {
          Quat.fromEuler(this.quat, this._rotation.x, this._rotation.y, this._rotation.z);
          Mat4.fromRTS(this.mat, this.quat, this._position, this._scale);
        }
        generateArcAngle() {
          if (this.arcMode === ParticleArcMode.Random) {
            return randomRange(0, this._arc);
          }
          let angle = this.totalAngle + 2 * Math.PI * this.arcSpeed.evaluate(this.particleSystem.time, 1) * (this.particleSystem.time - this.lastTime);
          this.totalAngle = angle;
          if (this.arcSpread !== 0) {
            angle = Math.floor(angle / (this._arc * this.arcSpread)) * this._arc * this.arcSpread;
          }
          switch (this.arcMode) {
            case ParticleArcMode.Loop:
              return repeat(angle, this._arc);
            case ParticleArcMode.PingPong:
              return pingPong(angle, this._arc);
            default:
              return repeat(angle, this._arc);
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "position", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "position"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "rotation", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "rotation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "scale", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "scale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "arc", [_dec8, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "arc"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angle", [_dec1, _dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "angle"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_shapeType", [_dec13, _dec14, _dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleShapeType.Cone;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "shapeType", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "shapeType"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "emitFrom", [_dec18, serializable, _dec19, _dec20, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleEmitLocation.Volume;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "alignToDirection", [serializable, _dec22, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "randomDirectionAmount", [serializable, _dec24, _dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "sphericalDirectionAmount", [serializable, _dec26, _dec27], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "randomPositionAmount", [serializable, _dec28, _dec29], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "radius", [serializable, _dec30, _dec31, _dec32], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "radiusThickness", [serializable, _dec33, _dec34, _dec35], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "arcMode", [_dec36, serializable, _dec37, _dec38, _dec39], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleArcMode.Random;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "arcSpread", [_dec40, serializable, _dec41, _dec42, _dec43], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "arcSpeed", [_dec44, _dec45, _dec46, serializable, _dec47, _dec48, _dec49], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "length", [serializable, _dec50, _dec51, _dec52], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "boxThickness", [serializable, _dec53, _dec54, _dec55], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_position", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_rotation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_scale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(1, 1, 1);
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "_arc", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return toRadian(360);
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_angle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return toRadian(25);
        }
      }), _class2)) || _class));
    }
  };
});