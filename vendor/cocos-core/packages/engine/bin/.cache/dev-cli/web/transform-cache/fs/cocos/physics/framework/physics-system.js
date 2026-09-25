System.register("q-bundled:///fs/cocos/physics/framework/physics-system.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../game/index.js", "./assets/physics-material.js", "./physics-ray-result.js", "./collision-matrix.js", "./physics-enum.js", "./physics-selector.js", "../../asset/asset-manager/index.js"], function (_export, _context) {
  "use strict";

  var BUILD, EDITOR_NOT_IN_PREVIEW, LOAD_BULLET_MANUALLY, LOAD_PHYSX_MANUALLY, Vec3, RecyclePool, Enum, System, cclegacy, settings, geometry, warn, SettingsCategory, errorID, warnID, director, DirectorEvent, game, PhysicsMaterial, PhysicsRayResult, PhysicsLineStripCastResult, CollisionMatrix, PhysicsGroup, constructDefaultWorld, selector, assetManager, builtinResMgr, PhysicsSystem, querySettings;
  _export("PhysicsSystem", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      LOAD_BULLET_MANUALLY = _virtualInternal253AconstantsJs.LOAD_BULLET_MANUALLY;
      LOAD_PHYSX_MANUALLY = _virtualInternal253AconstantsJs.LOAD_PHYSX_MANUALLY;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      RecyclePool = _coreIndexJs.RecyclePool;
      Enum = _coreIndexJs.Enum;
      System = _coreIndexJs.System;
      cclegacy = _coreIndexJs.cclegacy;
      settings = _coreIndexJs.settings;
      geometry = _coreIndexJs.geometry;
      warn = _coreIndexJs.warn;
      SettingsCategory = _coreIndexJs.SettingsCategory;
      errorID = _coreIndexJs.errorID;
      warnID = _coreIndexJs.warnID;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
      DirectorEvent = _gameIndexJs.DirectorEvent;
      game = _gameIndexJs.game;
    }, function (_assetsPhysicsMaterialJs) {
      PhysicsMaterial = _assetsPhysicsMaterialJs.PhysicsMaterial;
    }, function (_physicsRayResultJs) {
      PhysicsRayResult = _physicsRayResultJs.PhysicsRayResult;
      PhysicsLineStripCastResult = _physicsRayResultJs.PhysicsLineStripCastResult;
    }, function (_collisionMatrixJs) {
      CollisionMatrix = _collisionMatrixJs.CollisionMatrix;
    }, function (_physicsEnumJs) {
      PhysicsGroup = _physicsEnumJs.PhysicsGroup;
    }, function (_physicsSelectorJs) {
      constructDefaultWorld = _physicsSelectorJs.constructDefaultWorld;
      selector = _physicsSelectorJs.selector;
    }, function (_assetAssetManagerIndexJs) {
      assetManager = _assetAssetManagerIndexJs.assetManager;
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
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

      cclegacy.internal.PhysicsGroup = PhysicsGroup;
      querySettings = settings.querySettings.bind(settings);
      /**
       * @en
       * Physics system.
       * @zh
       * 物理系统。
       */
      _export("PhysicsSystem", PhysicsSystem = class PhysicsSystem extends System {
        static get PHYSICS_NONE() {
          return !selector.id;
        }
        static get PHYSICS_BUILTIN() {
          return selector.id === 'builtin';
        }
        static get PHYSICS_CANNON() {
          return selector.id === 'cannon.js';
        }
        static get PHYSICS_BULLET() {
          return selector.id === 'bullet';
        }
        static get PHYSICS_PHYSX() {
          return selector.id === 'physx';
        }

        /**
         * @en
         * Gets the ID of the system.
         * @zh
         * 获取此系统的ID。
         */

        /**
         * @en
         * Gets the predefined physics groups.
         * @zh
         * 获取预定义的物理分组。
         */
        static get PhysicsGroup() {
          return PhysicsGroup;
        }

        /**
         * @en
         * Gets the physical system instance.
         * @zh
         * 获取物理系统实例。
         */
        static get instance() {
          return PhysicsSystem._instance;
        }

        /**
         * @en
         * Gets or sets whether the physical system is enabled, which can be used to pause or continue running the physical system.
         * @zh
         * 获取或设置是否启用物理系统，可以用于暂停或继续运行物理系统。
         */
        get enable() {
          return this._enable;
        }
        set enable(value) {
          this._enable = value;
        }

        /**
         * @zh
         * Gets or sets whether the physical system allows automatic sleep, which defaults to true.
         * @zh
         * 获取或设置物理系统是否允许自动休眠，默认为 true。
         */
        get allowSleep() {
          return this._allowSleep;
        }
        set allowSleep(v) {
          this._allowSleep = v;
          if (this.physicsWorld) {
            this.physicsWorld.setAllowSleep(v);
          }
        }

        /**
         * @en
         * Gets or sets the maximum number of simulated substeps per frame.
         * @zh
         * 获取或设置每帧模拟的最大子步数。
         */
        get maxSubSteps() {
          return this._maxSubSteps;
        }
        set maxSubSteps(value) {
          this._maxSubSteps = value;
        }

        /**
         * @en
         * Gets or sets the fixed delta time consumed by each simulation step in seconds.
         * @zh
         * 获取或设置每步模拟消耗的固定时间（以 s 为单位）。
         */
        get fixedTimeStep() {
          return this._fixedTimeStep;
        }
        set fixedTimeStep(value) {
          this._fixedTimeStep = value;
        }

        /**
         * @en
         * Gets or sets the value of gravity in the physical world, which defaults to (0, -10, 0).
         * @zh
         * 获取或设置物理世界的重力数值，默认为 (0, -10, 0)。
         */
        get gravity() {
          return this._gravity;
        }
        set gravity(gravity) {
          this._gravity.set(gravity);
          if (this.physicsWorld) {
            this.physicsWorld.setGravity(gravity);
          }
        }

        /**
         * @en
         * Gets or sets the default speed threshold for going to sleep.
         * @zh
         * 获取或设置进入休眠的默认速度临界值。
         */
        get sleepThreshold() {
          return this._sleepThreshold;
        }
        set sleepThreshold(v) {
          this._sleepThreshold = v;
        }

        /**
         * @en
         * Turn on or off the automatic simulation.
         * @zh
         * 获取或设置是否自动模拟。
         */
        get autoSimulation() {
          return this._autoSimulation;
        }
        set autoSimulation(value) {
          this._autoSimulation = value;
        }

        /**
         * @en
         * Gets the global default physical material.
         * @zh
         * 获取全局的默认物理材质。
         */
        get defaultMaterial() {
          return this._material;
        }

        /**
         * @en
         * Set the default physics material.
         * @zh
         * 设置默认物理材质。
         */
        setDefaultPhysicsMaterial(material) {
          this._material = material;
          this.physicsWorld.setDefaultMaterial(this._material);
          this._material.on(PhysicsMaterial.EVENT_UPDATE, this._updateMaterial, this);
        }

        // eslint-disable-next-line consistent-return
        initDefaultMaterial() {
          if (this._material != null) return Promise.resolve();
          const builtinMaterial = builtinResMgr.get('default-physics-material');
          if (!builtinMaterial) {
            errorID(9642);
            return Promise.resolve();
          }
          const userMaterial = querySettings(SettingsCategory.PHYSICS, 'defaultMaterial');
          if (!userMaterial) {
            //use built-in default physics material
            this.setDefaultPhysicsMaterial(builtinMaterial);
            return Promise.resolve();
          } else {
            //use user customized default physics material
            return new Promise((resolve, reject) => {
              assetManager.loadAny(userMaterial, (err, asset) => err || !(asset instanceof PhysicsMaterial) ? reject(err) : resolve(asset));
            }).then(asset => {
              this.setDefaultPhysicsMaterial(asset);
            }).catch(reason => {
              warn(reason);
              warnID(9643, userMaterial);
              this.setDefaultPhysicsMaterial(builtinMaterial);
            });
          }
        }

        /**
         * @en
         * Gets the wrappered object of the physical world through which you can access the actual underlying object.
         * @zh
         * 获取物理世界的封装对象，通过它你可以访问到实际的底层对象。
         */
        get physicsWorld() {
          return selector.physicsWorld;
        }

        /**
         * @en
         * Gets the raycastClosest test result.
         * @zh
         * 获取 raycastClosest 的检测结果。
         */

        constructor() {
          super();
          this.raycastClosestResult = new PhysicsRayResult();
          /**
          * @en
          * Gets the raycast test results.
          * @zh
          * 获取 raycast 的检测结果。
          */
          this.raycastResults = [];
          /**
           * @en
           * Gets the lineStripCastClosest test result.
           * @zh
           * 获取 lineStripCastClosest 的检测结果。
           */
          this.lineStripCastClosestResult = new PhysicsLineStripCastResult();
          /**
          * @en
          * Gets the lineStripCast test results.
          * @zh
          * 获取 lineStripCast 的检测结果。
          */
          this.lineStripCastResults = [];
          /**
           * @en
           * Gets the sweepCastClosest test result.
           * @zh
           * 获取 sweepCastClosest 的检测结果。
           */
          this.sweepCastClosestResult = new PhysicsRayResult();
          /**
              * @en
              * Gets the sweepCast test results.
              * @zh
              * 获取 sweepCast 的检测结果。
              */
          this.sweepCastResults = [];
          /**
          * @en
          * Gets the collision matrix that used for initialization only.
          * @zh
          * 获取碰撞矩阵，它仅用于初始化。
          */
          this.collisionMatrix = new CollisionMatrix(1);
          /**
           * @en
           * The minimum size of the collision body.
           * @zh
           * 碰撞体的最小尺寸。
           */
          this.minVolumeSize = 1e-5;
          this.useNodeChains = false;
          this._enable = true;
          this._allowSleep = true;
          this._maxSubSteps = 1;
          this._subStepCount = 0;
          this._fixedTimeStep = 1.0 / 60.0;
          this._autoSimulation = true;
          this._accumulator = 0;
          this._sleepThreshold = 0.1;
          this._gravity = new Vec3(0, -10, 0);
          this._material = void 0;
          this.raycastOptions = {
            group: -1,
            mask: -1,
            queryTrigger: true,
            maxDistance: 10000000
          };
          this.raycastResultPool = new RecyclePool(() => new PhysicsRayResult(), 1);
          this.sweepResultPool = new RecyclePool(() => new PhysicsRayResult(), 1);
        }
        postUpdate(deltaTime) {
          if (EDITOR_NOT_IN_PREVIEW && !this._executeInEditMode && !selector.runInEditor) return;
          if (!this.physicsWorld) return;
          if (!this._enable) {
            this.physicsWorld.syncSceneToPhysics();
            return;
          }
          if (this._autoSimulation) {
            this._subStepCount = 0;
            this._accumulator += deltaTime;
            director.emit(DirectorEvent.BEFORE_PHYSICS);
            while (this._subStepCount < this._maxSubSteps) {
              if (this._accumulator >= this._fixedTimeStep) {
                this.physicsWorld.syncSceneToPhysics();
                this.physicsWorld.step(this._fixedTimeStep);
                this.physicsWorld.emitEvents();
                this.physicsWorld.syncAfterEvents();
                this._accumulator -= this._fixedTimeStep;
                this._subStepCount++;
              } else {
                this.physicsWorld.syncSceneToPhysics();
                break;
              }
            }
            director.emit(DirectorEvent.AFTER_PHYSICS);
          }
        }

        /**
         * @en
         * Reset the physics configuration.
         * @zh
         * 重置物理配置。
         */
        resetConfiguration(config) {
          const allowSleep = config ? config.allowSleep : querySettings(SettingsCategory.PHYSICS, 'allowSleep');
          if (typeof allowSleep === 'boolean') this._allowSleep = allowSleep;
          const fixedTimeStep = config ? config.fixedTimeStep : querySettings(SettingsCategory.PHYSICS, 'fixedTimeStep');
          if (typeof fixedTimeStep === 'number') this._fixedTimeStep = fixedTimeStep;
          const maxSubSteps = config ? config.maxSubSteps : querySettings(SettingsCategory.PHYSICS, 'maxSubSteps');
          if (typeof maxSubSteps === 'number') this._maxSubSteps = maxSubSteps;
          const sleepThreshold = config ? config.sleepThreshold : querySettings(SettingsCategory.PHYSICS, 'sleepThreshold');
          if (typeof sleepThreshold === 'number') this._sleepThreshold = sleepThreshold;
          const autoSimulation = config ? config.autoSimulation : querySettings(SettingsCategory.PHYSICS, 'autoSimulation');
          if (typeof autoSimulation === 'boolean') this.autoSimulation = autoSimulation;
          const gravity = config ? config.gravity : querySettings(SettingsCategory.PHYSICS, 'gravity');
          if (gravity) Vec3.copy(this._gravity, gravity);
          const collisionMatrix = config ? config.collisionMatrix : querySettings(SettingsCategory.PHYSICS, 'collisionMatrix');
          if (collisionMatrix) {
            for (const i in collisionMatrix) {
              this.collisionMatrix[`${1 << parseInt(i)}`] = collisionMatrix[i];
            }
          }
          const collisionGroups = config ? config.collisionGroups : querySettings(SettingsCategory.PHYSICS, 'collisionGroups');
          if (collisionGroups) {
            const cg = collisionGroups;
            if (cg instanceof Array) {
              cg.forEach(v => {
                PhysicsGroup[v.name] = 1 << v.index;
              });
              Enum.update(PhysicsGroup);
            }
          }
          if (this.physicsWorld) {
            this.physicsWorld.setGravity(this._gravity);
            this.physicsWorld.setAllowSleep(this._allowSleep);
          }
        }

        /**
         * @en
         * Reset the accumulator of time to given value.
         * @zh
         * 重置时间累积总量为给定值。
         */
        resetAccumulator(time = 0) {
          this._accumulator = time;
        }

        /**
         * @en
         * Perform simulation steps for the physics world.
         * @zh
         * 执行物理世界的模拟步进。
         * @param fixedTimeStep
         */
        step(fixedTimeStep, deltaTime, maxSubSteps) {
          if (this.physicsWorld) this.physicsWorld.step(fixedTimeStep, deltaTime, maxSubSteps);
        }

        /**
         * @en
         * Sync the scene world transform changes to the physics world.
         * @zh
         * 同步场景世界的变化信息到物理世界中。
         */
        syncSceneToPhysics() {
          if (this.physicsWorld) this.physicsWorld.syncSceneToPhysics();
        }

        /**
         * @en
         * Emit trigger and collision events.
         * @zh
         * 触发`trigger`和`collision`事件。
         */
        emitEvents() {
          if (this.physicsWorld) this.physicsWorld.emitEvents();
        }

        /**
         * @en
         * Get or set debug draw flags. Default is EPhysicsDrawFlags.NONE.
         * Refer to EPhysicsDrawFlags.
         * Note: Since physics debug draw uses Geometry-Renderer to do drawing,
         * make sure Geometry-Renderer is not cropped in Project Setting.
         * @zh
         * 获取或设置调试绘制标志。默认为 EPhysicsDrawFlags.NONE。
         * 参考 EPhysicsDrawFlags。
         * 注意：因为物理调试绘制使用几何渲染器来绘制，请确保项目设置中几何渲染器没有被裁剪掉。
         */
        get debugDrawFlags() {
          return this.physicsWorld.debugDrawFlags;
        }
        set debugDrawFlags(v) {
          this.physicsWorld.debugDrawFlags = v;
        }

        /**
         * @en
         * Get or set constraint debug draw size. Default is 0.3.
         * @zh
         * 获取或设置约束的调试绘制尺寸。默认为 0.3。
         */
        get debugDrawConstraintSize() {
          return this.physicsWorld.debugDrawConstraintSize;
        }
        set debugDrawConstraintSize(v) {
          this.physicsWorld.debugDrawConstraintSize = v;
        }

        /**
         * @en
         * Collision detect all collider, and record all the detected results, through PhysicsSystem.Instance.RaycastResults access to the results.
         * @zh
         * 检测所有的碰撞盒，并记录所有被检测到的结果，通过 PhysicsSystem.instance.raycastResults 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                    @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        raycast(worldRay, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.raycastResultPool.reset();
          this.raycastResults.length = 0;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.raycast(worldRay, this.raycastOptions, this.raycastResultPool, this.raycastResults);
        }

        /**
         * @en
         * Collision detect all collider, and record and ray test results with the shortest distance
         * by PhysicsSystem.Instance.RaycastClosestResult access to the results.
         * @zh
         * 检测所有的碰撞盒，并记录与射线距离最短的检测结果，通过 PhysicsSystem.instance.raycastClosestResult 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                    @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        raycastClosest(worldRay, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.raycastClosest(worldRay, this.raycastOptions, this.raycastClosestResult);
        }

        /**
        * @en
        * Collision detect all collider and record all the detected results, using
        * PhysicsSystem.Instance.lineStripCastResults to access the results.
        * @zh
        * 逐线段检测所有的碰撞盒，并记录所有检测结果。通过 PhysicsSystem.instance.lineStripCastResults 访问结果。
        * @param samplePointsWorldSpace @zh 世界空间下的采样点/直线段 @en sample points/line segments in world space
        * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
        * @param maxDistance @zh 沿着直线段的最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
        *                    @en Maximum detection distance along the line segments, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
        * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
        * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
        */
        lineStripCast(samplePointsWorldSpace, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (samplePointsWorldSpace.length < 2) return false;
          this.lineStripCastResults = [];
          let distance = 0;
          const worldRay = new geometry.Ray();
          for (let i = 1; i < samplePointsWorldSpace.length; ++i) {
            if (distance > maxDistance) break;
            const fromPoint = samplePointsWorldSpace[i - 1];
            const toPoint = samplePointsWorldSpace[i];
            const direction = new Vec3();
            Vec3.subtract(direction, toPoint, fromPoint);
            const stepLength = Vec3.len(direction);
            distance += stepLength;
            const EPSILON = 1e-6;
            // The stepLength may be 0, making the subsequent calculations meaningless, so return here.
            if (Math.abs(stepLength) < EPSILON) {
              continue;
            }
            Vec3.multiplyScalar(direction, direction, 1.0 / stepLength);
            worldRay.d = direction;
            worldRay.o = fromPoint;
            const hit = this.raycast(worldRay, mask, stepLength, queryTrigger);
            if (hit) {
              for (let re = 0; re < this.raycastResults.length; re++) {
                const result = this.raycastResults[re];
                //if ray starts inside shape and hit point equals to start point, this should be ignored
                if (re === 0 && Vec3.equals(fromPoint, result.hitPoint)) {
                  continue;
                }
                const copiedResult = new PhysicsLineStripCastResult();
                copiedResult._assign(result.hitPoint, result.distance, result.collider, result.hitNormal, i - 1);
                this.lineStripCastResults.push(copiedResult);
              }
            }
          }
          return this.lineStripCastResults.length > 0;
        }

        /**
         * @en
         * Collision detect all collider, and record the ray test results with the shortest distance.
         * Using PhysicsSystem.Instance.lineStripCastClosestResult to access the result.
         * @zh
         * 逐线段检测所有的碰撞盒，并记录沿这些线段距离最短的检测结果，通过 PhysicsSystem.instance.lineStripCastClosestResult 访问结果。
         * @param samplePointsWorldSpace @zh 世界空间下的采样点/直线段 @en sample points/line segments in world space
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 沿着直线段的最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                    @en Maximum detection distance along the line segments, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        lineStripCastClosest(samplePointsWorldSpace, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (samplePointsWorldSpace.length < 2) {
            return false;
          }
          let distance = 0;
          const worldRay = new geometry.Ray();
          let hit = false;
          for (let i = 1; i < samplePointsWorldSpace.length; ++i) {
            if (distance > maxDistance) break;
            const fromPoint = samplePointsWorldSpace[i - 1];
            const toPoint = samplePointsWorldSpace[i];
            const direction = new Vec3();
            Vec3.subtract(direction, toPoint, fromPoint);
            const stepLength = Vec3.len(direction);
            distance += stepLength;
            Vec3.multiplyScalar(direction, direction, 1.0 / stepLength);
            worldRay.d = direction;
            worldRay.o = fromPoint;
            hit = this.raycastClosest(worldRay, mask, stepLength, queryTrigger);
            if (hit) {
              const result = this.raycastClosestResult;
              const copiedResult = new PhysicsLineStripCastResult();
              copiedResult._assign(result.hitPoint, result.distance, result.collider, result.hitNormal, i - 1);
              this.lineStripCastClosestResult = copiedResult;
              break;
            }
          }
          return hit;
        }

        /**
         * @en
         * Cast a box along a ray and record information on what was hit.
         * Access the results through PhysicsSystem.Instance.sweepCastResults.
         * @zh
         * 将盒体沿着射线发射，记录所有被检测到的结果，通过 PhysicsSystem.instance.sweepCastResults 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param halfExtent @zh 盒体的一半尺寸 @en Half extent of the box
         * @param orientation @zh 盒体的方向 @en Orientation of the box
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                    @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepBox(worldRay, halfExtent, orientation, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.sweepResultPool.reset();
          this.sweepCastResults.length = 0;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepBox(worldRay, halfExtent, orientation, this.raycastOptions, this.sweepResultPool, this.sweepCastResults);
        }

        /**
         * @en
         * Cast a box along a ray and record information on the closest hit.
         * Access the results through PhysicsSystem.Instance.sweepCastClosestResult.
         * @zh
         * 将盒体沿着射线发射，记录距离最近的碰撞结果，通过 PhysicsSystem.instance.sweepCastClosestResult 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param halfExtent @zh 盒体的一半尺寸 @en Half extent of the box
         * @param orientation @zh 盒体的方向 @en Orientation of the box
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                   @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepBoxClosest(worldRay, halfExtent, orientation, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepBoxClosest(worldRay, halfExtent, orientation, this.raycastOptions, this.sweepCastClosestResult);
        }

        /**
         * @en
         * Cast a sphere along a ray and record information on what was hit.
         * Access the results through PhysicsSystem.Instance.sweepCastResults.
         * @zh
         * 将球体沿着射线发射，记录所有被检测到的结果，通过 PhysicsSystem.instance.sweepCastResults 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param radius @zh 球体的半径 @en Radius of the sphere
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                  @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepSphere(worldRay, radius, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.sweepResultPool.reset();
          this.sweepCastResults.length = 0;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepSphere(worldRay, radius, this.raycastOptions, this.sweepResultPool, this.sweepCastResults);
        }

        /**
         * @en
         * Cast a sphere along a ray and record information on the closest hit.
         * Access the result through PhysicsSystem.Instance.sweepCastClosestResult.
         * @zh
         * 将球体沿着射线发射，记录距离最近的碰撞结果，通过 PhysicsSystem.instance.sweepCastClosestResult 访问结果。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param radius @zh 球体的半径 @en Radius of the sphere
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                 @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepSphereClosest(worldRay, radius, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepSphereClosest(worldRay, radius, this.raycastOptions, this.sweepCastClosestResult);
        }

        /**
         * @en
         * Cast a capsule along a ray and record information on what was hit.
         * Access the results through PhysicsSystem.Instance.sweepCastResults.
         * Capsule's default axis is along the world space Y axis.
         * @zh
         * 将胶囊体沿着射线发射，记录所有被检测到的结果，通过 PhysicsSystem.instance.sweepCastResults 访问结果。
         * 胶囊体的默认朝向是世界空间下的 Y 轴。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param radius @zh 胶囊体的半径 @en Radius of the capsule
         * @param height @zh 胶囊体末端两个半球圆心的距离 @en Distance between the two half-sphere centers of the capsule
         * @param orientation @zh 胶囊体的朝向 @en Orientation of the capsule
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *                @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepCapsule(worldRay, radius, height, orientation, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.sweepResultPool.reset();
          this.sweepCastResults.length = 0;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepCapsule(worldRay, radius, height, orientation, this.raycastOptions, this.sweepResultPool, this.sweepCastResults);
        }

        /**
         * @en
         * Cast a capsule along a ray and record information on the closest hit.
         * Access the result through PhysicsSystem.Instance.sweepCastClosestResult.
         * Capsule's default axis is along the world space Y axis.
         * @zh
         * 将胶囊体沿着射线发射，记录距离最近的碰撞结果，通过 PhysicsSystem.instance.sweepCastClosestResult 访问结果。
         * 胶囊体的默认朝向是世界空间下的 Y 轴。
         * @param worldRay @zh 世界空间下的一条射线 @en A ray in world space
         * @param radius @zh 胶囊体的半径 @en Radius of the capsule
         * @param height @zh 胶囊体末端两个半球圆心的距离 @en Distance between the two half-sphere centers of the capsule
         * @param orientation @zh 胶囊体的朝向 @en Orientation of the capsule
         * @param mask @zh 掩码，默认为 0xffffffff @en Mask, default value is 0xffffffff
         * @param maxDistance @zh 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
         *               @en Maximum detection distance, default value is 10000000, do not pass Infinity or Number.MAX_VALUE for now
         * @param queryTrigger @zh 是否检测触发器 @en Whether to detect triggers
         * @return {boolean} @zh 表示是否有检测到碰撞 @en Indicates whether a collision has been detected
         */
        sweepCapsuleClosest(worldRay, radius, height, orientation, mask = 0xffffffff, maxDistance = 10000000, queryTrigger = true) {
          if (!this.physicsWorld) return false;
          this.raycastOptions.mask = mask >>> 0;
          this.raycastOptions.maxDistance = maxDistance;
          this.raycastOptions.queryTrigger = queryTrigger;
          return this.physicsWorld.sweepCapsuleClosest(worldRay, radius, height, orientation, this.raycastOptions, this.sweepCastClosestResult);
        }
        _updateMaterial() {
          if (this.physicsWorld) this.physicsWorld.setDefaultMaterial(this._material);
        }

        /**
         * @en
         * Construct and register the system singleton.
         * If the module is pre-loaded, it will be executed automatically.
         * @zh
         * 构造并注册系统单例。
         * 预先加载模块的情况下，会自动执行。
         */
        static constructAndRegister() {
          if (BUILD && (LOAD_BULLET_MANUALLY || LOAD_PHYSX_MANUALLY)) return;
          if (!PhysicsSystem._instance) {
            const sys = this.doConstructAndRegister();
            if (sys) game.onPostProjectInitDelegate.add(sys.initDefaultMaterial.bind(sys));
          }
        }
        static constructAndRegisterManually() {
          if (BUILD && (LOAD_BULLET_MANUALLY || LOAD_PHYSX_MANUALLY)) {
            if (!PhysicsSystem._instance) {
              const sys = this.doConstructAndRegister();
              if (sys) return sys.initDefaultMaterial();
            }
          }
          return Promise.resolve();
        }
        static doConstructAndRegister() {
          var _querySettings;
          const enabled = (_querySettings = querySettings(SettingsCategory.PHYSICS, 'enabled')) != null ? _querySettings : true;
          if (!enabled) {
            return null;
          }
          if (!PhysicsSystem._instance) {
            // Construct physics world and physics system only once
            const sys = new PhysicsSystem();
            PhysicsSystem._instance = sys;
            sys.resetConfiguration();
            constructDefaultWorld(sys);
            director.registerSystem(PhysicsSystem.ID, sys, sys.priority);
          }
          return PhysicsSystem._instance;
        }
      });
      /**
       * By registering the initialization event, the system can be automatically
       * constructed and registered when the module is pre-loaded
       */
      PhysicsSystem.ID = 'PHYSICS';
      //default physics material
      PhysicsSystem._instance = null;
      director.once(DirectorEvent.INIT, () => {
        PhysicsSystem.constructAndRegister();
      });
    }
  };
});