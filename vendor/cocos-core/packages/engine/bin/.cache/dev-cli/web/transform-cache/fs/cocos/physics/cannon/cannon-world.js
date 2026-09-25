System.register("q-bundled:///fs/cocos/physics/cannon/cannon-world.js", ["@cocos/cannon", "../../core/index.js", "./cannon-util.js", "./shapes/cannon-shape.js", "./cannon-shared-body.js", "../framework/index.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var CANNON, Vec3, error, js, geometry, warnID, Color, fillRaycastResult, toCannonRaycastOptions, CannonShape, CannonSharedBody, EPhysicsDrawFlags, director, CannonWorld, aabbTemp, AABB_LINE_COUNT, from, to, raycastOpt;
  function setupFromAndTo(worldRay, distance) {
    Vec3.copy(from, worldRay.o);
    worldRay.computeHit(to, distance);
  }
  _export("CannonWorld", void 0);
  return {
    setters: [function (_cocosCannon) {
      CANNON = _cocosCannon.default;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      error = _coreIndexJs.error;
      js = _coreIndexJs.js;
      geometry = _coreIndexJs.geometry;
      warnID = _coreIndexJs.warnID;
      Color = _coreIndexJs.Color;
    }, function (_cannonUtilJs) {
      fillRaycastResult = _cannonUtilJs.fillRaycastResult;
      toCannonRaycastOptions = _cannonUtilJs.toCannonRaycastOptions;
    }, function (_shapesCannonShapeJs) {
      CannonShape = _shapesCannonShapeJs.CannonShape;
    }, function (_cannonSharedBodyJs) {
      CannonSharedBody = _cannonSharedBodyJs.CannonSharedBody;
    }, function (_frameworkIndexJs) {
      EPhysicsDrawFlags = _frameworkIndexJs.EPhysicsDrawFlags;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
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
      aabbTemp = new geometry.AABB();
      AABB_LINE_COUNT = 12;
      _export("CannonWorld", CannonWorld = class CannonWorld {
        get impl() {
          return this._world;
        }
        setDefaultMaterial(mat) {
          this._world.defaultMaterial.friction = mat.friction;
          this._world.defaultMaterial.restitution = mat.restitution;
          if (CannonShape.idToMaterial[mat.id] != null) {
            CannonShape.idToMaterial[mat.id] = this._world.defaultMaterial;
          }
        }
        setAllowSleep(v) {
          this._world.allowSleep = v;
        }
        setGravity(gravity) {
          Vec3.copy(this._world.gravity, gravity);
        }

        // get defaultContactMaterial () {
        //     return this._defaultContactMaterial;
        // }

        constructor() {
          this.bodies = [];
          this.constraints = [];
          this._world = void 0;
          this._debugLineCount = 0;
          this._MAX_DEBUG_LINE_COUNT = 16384;
          this._debugDrawFlags = EPhysicsDrawFlags.NONE;
          this._debugConstraintSize = 0.3;
          this._aabbColor = new Color(0, 255, 255, 255);
          this._wireframeColor = new Color(255, 0, 255, 255);
          this._world = new CANNON.World();
          this._world.broadphase = new CANNON.NaiveBroadphase();
          // this._world.broadphase = new CANNON.SAPBroadphase(this._world);
          this._world.solver.iterations = 10;
          this._world.solver.tolerance = 0.0001;
          this._world.defaultContactMaterial.contactEquationStiffness = 1000000;
          this._world.defaultContactMaterial.frictionEquationStiffness = 1000000;
          this._world.defaultContactMaterial.contactEquationRelaxation = 3;
          this._world.defaultContactMaterial.frictionEquationRelaxation = 3;
        }
        sweepBox(worldRay, halfExtent, orientation, options, pool, results) {
          warnID(9641);
          return false;
        }
        sweepBoxClosest(worldRay, halfExtent, orientation, options, result) {
          warnID(9641);
          return false;
        }
        sweepSphere(worldRay, radius, options, pool, results) {
          warnID(9641);
          return false;
        }
        sweepSphereClosest(worldRay, radius, options, result) {
          warnID(9641);
          return false;
        }
        sweepCapsule(worldRay, radius, height, orientation, options, pool, results) {
          warnID(9641);
          return false;
        }
        sweepCapsuleClosest(worldRay, radius, height, orientation, options, result) {
          warnID(9641);
          return false;
        }
        destroy() {
          if (this.constraints.length || this.bodies.length) error('You should destroy all physics component first.');
          this._world.broadphase = null;
          this._world = null;
        }
        emitEvents() {
          this._world.emitTriggeredEvents();
          this._world.emitCollisionEvents();
        }
        syncSceneToPhysics() {
          for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncSceneToPhysics();
          }
        }
        syncAfterEvents() {
          this.syncSceneToPhysics();
        }
        step(deltaTime, timeSinceLastCalled, maxSubStep) {
          if (this.bodies.length === 0) return;
          this._world.step(deltaTime, timeSinceLastCalled, maxSubStep);

          // sync physics to scene
          for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncPhysicsToScene();
          }
          this._debugDraw();
        }
        raycastClosest(worldRay, options, result) {
          setupFromAndTo(worldRay, options.maxDistance);
          toCannonRaycastOptions(raycastOpt, options);
          const hit = this._world.raycastClosest(from, to, raycastOpt, CannonWorld.rayResult);
          if (hit) {
            fillRaycastResult(result, CannonWorld.rayResult);
          }
          return hit;
        }
        raycast(worldRay, options, pool, results) {
          setupFromAndTo(worldRay, options.maxDistance);
          toCannonRaycastOptions(raycastOpt, options);
          const hit = this._world.raycastAll(from, to, raycastOpt, result => {
            const r = pool.add();
            fillRaycastResult(r, result);
            results.push(r);
          });
          return hit;
        }
        getSharedBody(node, wrappedBody) {
          return CannonSharedBody.getSharedBody(node, this, wrappedBody);
        }
        addSharedBody(sharedBody) {
          const i = this.bodies.indexOf(sharedBody);
          if (i < 0) {
            this.bodies.push(sharedBody);
            this._world.addBody(sharedBody.body);
          }
        }
        removeSharedBody(sharedBody) {
          const i = this.bodies.indexOf(sharedBody);
          if (i >= 0) {
            js.array.fastRemoveAt(this.bodies, i);
            this._world.remove(sharedBody.body);
          }
        }

        //  addContactMaterial (contactMaterial: ContactMaterial) {
        //     this._cannonWorld.addContactMaterial(contactMaterial._getImpl());
        // }

        addConstraint(constraint) {
          const i = this.constraints.indexOf(constraint);
          if (i < 0) {
            this.constraints.push(constraint);
            this._world.addConstraint(constraint.impl);
          }
        }
        removeConstraint(constraint) {
          const i = this.constraints.indexOf(constraint);
          if (i >= 0) {
            js.array.fastRemoveAt(this.constraints, i);
            this._world.removeConstraint(constraint.impl);
          }
        }
        get debugDrawFlags() {
          return this._debugDrawFlags;
        }
        set debugDrawFlags(v) {
          this._debugDrawFlags = v;
        }
        get debugDrawConstraintSize() {
          return this._debugConstraintSize;
        }
        set debugDrawConstraintSize(v) {
          this._debugConstraintSize = v;
        }
        _getDebugRenderer() {
          var _mainWindow;
          const cameras = (_mainWindow = director.root.mainWindow) == null ? void 0 : _mainWindow.cameras;
          if (!cameras) return null;
          if (cameras.length === 0) return null;
          if (!cameras[0]) return null;
          cameras[0].initGeometryRenderer();
          return cameras[0].geometryRenderer;
        }
        _debugDraw() {
          const debugRenderer = this._getDebugRenderer();
          if (!debugRenderer) return;
          this._debugLineCount = 0;
          if (this._debugDrawFlags & EPhysicsDrawFlags.AABB) {
            for (let i = 0; i < this.bodies.length; i++) {
              const body = this.bodies[i];
              for (let j = 0; j < body.wrappedShapes.length; j++) {
                const shape = body.wrappedShapes[j];
                if (this._debugLineCount + AABB_LINE_COUNT < this._MAX_DEBUG_LINE_COUNT) {
                  this._debugLineCount += AABB_LINE_COUNT;
                  shape.getAABB(aabbTemp);
                  debugRenderer.addBoundingBox(aabbTemp, this._aabbColor);
                }
              }
            }
          }
        }
      });
      CannonWorld.rayResult = new CANNON.RaycastResult();
      from = new CANNON.Vec3();
      to = new CANNON.Vec3();
      raycastOpt = {
        checkCollisionResponse: false,
        collisionFilterGroup: -1,
        collisionFilterMask: -1,
        skipBackfaces: true
      };
    }
  };
});