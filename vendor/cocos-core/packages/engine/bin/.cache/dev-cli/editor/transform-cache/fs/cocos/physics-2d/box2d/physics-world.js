System.register("q-bundled:///fs/cocos/physics-2d/box2d/physics-world.js", ["@cocos/box2d", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../framework/physics-types.js", "./platform/physics-contact-listener.js", "./platform/physics-aabb-query-callback.js", "./platform/physics-ray-cast-callback.js", "../framework/index.js", "./platform/physics-debug-draw.js", "../../scene-graph/index.js", "../../game/index.js", "./physics-contact-manager.js"], function (_export, _context) {
  "use strict";

  var b2, EDITOR_NOT_IN_PREVIEW, TEST, Vec3, Quat, Vec2, toDegree, CCObjectFlags, js, errorID, PHYSICS_2D_PTM_RATIO, ERaycast2DType, ERigidBody2DType, PhysicsContactListener, PhysicsAABBQueryCallback, PhysicsRayCastCallback, Contact2DType, PhysicsDebugDraw, Node, find, Layers, director, PhysicsContactManager, b2PhysicsWorld, tempVec3, tempVec2_1, tempVec2_2, temoBodyDef, tempB2AABB, testResults;
  _export("b2PhysicsWorld", void 0);
  return {
    setters: [function (_cocosBox2d) {
      b2 = _cocosBox2d.default;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
      Vec2 = _coreIndexJs.Vec2;
      toDegree = _coreIndexJs.toDegree;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      js = _coreIndexJs.js;
      errorID = _coreIndexJs.errorID;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
      ERaycast2DType = _frameworkPhysicsTypesJs.ERaycast2DType;
      ERigidBody2DType = _frameworkPhysicsTypesJs.ERigidBody2DType;
    }, function (_platformPhysicsContactListenerJs) {
      PhysicsContactListener = _platformPhysicsContactListenerJs.PhysicsContactListener;
    }, function (_platformPhysicsAabbQueryCallbackJs) {
      PhysicsAABBQueryCallback = _platformPhysicsAabbQueryCallbackJs.PhysicsAABBQueryCallback;
    }, function (_platformPhysicsRayCastCallbackJs) {
      PhysicsRayCastCallback = _platformPhysicsRayCastCallbackJs.PhysicsRayCastCallback;
    }, function (_frameworkIndexJs) {
      Contact2DType = _frameworkIndexJs.Contact2DType;
    }, function (_platformPhysicsDebugDrawJs) {
      PhysicsDebugDraw = _platformPhysicsDebugDrawJs.PhysicsDebugDraw;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
      find = _sceneGraphIndexJs.find;
      Layers = _sceneGraphIndexJs.Layers;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
    }, function (_physicsContactManagerJs) {
      PhysicsContactManager = _physicsContactManagerJs.PhysicsContactManager;
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
      tempVec3 = new Vec3();
      tempVec2_1 = new Vec2();
      tempVec2_2 = new Vec2();
      temoBodyDef = new b2.BodyDef();
      tempB2AABB = new b2.AABB();
      testResults = [];
      /** @mangle */
      _export("b2PhysicsWorld", b2PhysicsWorld = class b2PhysicsWorld {
        get impl() {
          return this._world;
        }
        get groundBodyImpl() {
          return this._physicsGroundBody;
        }
        constructor() {
          this._world = void 0;
          this._bodies = [];
          this._animatedBodies = [];
          this._rotationAxis = new Vec3();
          this._physicsGroundBody = void 0;
          this._contactListener = void 0;
          this._aabbQueryCallback = void 0;
          this._raycastQueryCallback = void 0;
          this._debugGraphics = null;
          this._b2DebugDrawer = null;
          this._debugDrawFlags = 0;
          this._world = new b2.World(new b2.Vec2(0, -10));
          const tempBodyDef = new b2.BodyDef();
          //tempBodyDef.position.Set(480 / PHYSICS_2D_PTM_RATIO, 320 / PHYSICS_2D_PTM_RATIO);//temporary
          this._physicsGroundBody = this._world.CreateBody(tempBodyDef);
          const listener = new PhysicsContactListener();
          listener.setBeginContact(this._onBeginContact);
          listener.setEndContact(this._onEndContact);
          listener.setPreSolve(this._onPreSolve);
          listener.setPostSolve(this._onPostSolve);
          this._world.SetContactListener(listener);
          this._contactListener = listener;
          this._aabbQueryCallback = new PhysicsAABBQueryCallback();
          this._raycastQueryCallback = new PhysicsRayCastCallback();
        }
        get debugDrawFlags() {
          return this._debugDrawFlags;
        }
        set debugDrawFlags(v) {
          if (EDITOR_NOT_IN_PREVIEW) return;
          if (!v) {
            if (this._debugGraphics) {
              this._debugGraphics.clear();
            }
          }
          this._debugDrawFlags = v;
        }
        _checkDebugDrawValid() {
          if (EDITOR_NOT_IN_PREVIEW) return;
          if (!this._debugGraphics || !this._debugGraphics.isValid) {
            let canvas = find('Canvas');
            if (!canvas) {
              const scene = director.getScene();
              if (!scene) {
                return;
              }
              canvas = new Node('Canvas');
              canvas.addComponent('cc.Canvas');
              canvas.parent = scene;
            }
            let node = new Node('PHYSICS_2D_DEBUG_DRAW');
            // node.zIndex = cc.macro.MAX_ZINDEX;
            node.hideFlags |= CCObjectFlags.DontSave;
            node.parent = canvas;
            node.worldPosition = Vec3.ZERO;
            node.layer = Layers.Enum.UI_2D;
            try {
              this._debugGraphics = node.addComponent('cc.Graphics');
              this._debugGraphics.lineWidth = 3;

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              const debugDraw = new PhysicsDebugDraw(this._debugGraphics);
              this._b2DebugDrawer = debugDraw;
              this._world.SetDebugDraw(debugDraw);
            } catch (e) {
              errorID(4501, e.message);
              node.destroy();
              node = null;
            }
          }
          if (this._debugGraphics) {
            const parent = this._debugGraphics.node.parent;
            this._debugGraphics.node.setSiblingIndex(parent.children.length - 1);
          }
          if (this._b2DebugDrawer) {
            this._b2DebugDrawer.SetFlags(this.debugDrawFlags);
          }
        }
        setGravity(v) {
          this._world.SetGravity(v);
        }
        setAllowSleep(v) {
          this._world.SetAllowSleeping(true);
        }
        step(deltaTime, velocityIterations = 10, positionIterations = 10) {
          const animatedBodies = this._animatedBodies;
          for (let i = 0, l = animatedBodies.length; i < l; i++) {
            animatedBodies[i].animate(deltaTime);
          }
          this._world.Step(deltaTime, velocityIterations, positionIterations);
        }
        raycast(p1, p2, type, mask) {
          if (p1.equals(p2)) {
            return [];
          }
          type = type || ERaycast2DType.Closest;
          tempVec2_1.x = p1.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_1.y = p1.y / PHYSICS_2D_PTM_RATIO;
          tempVec2_2.x = p2.x / PHYSICS_2D_PTM_RATIO;
          tempVec2_2.y = p2.y / PHYSICS_2D_PTM_RATIO;
          const callback = this._raycastQueryCallback;
          callback.init(type, mask);
          this._world.RayCast(callback, tempVec2_1, tempVec2_2);
          const fixtures = callback.getFixtures();
          if (fixtures.length > 0) {
            const points = callback.getPoints();
            const normals = callback.getNormals();
            const fractions = callback.getFractions();
            const results = [];
            for (let i = 0, l = fixtures.length; i < l; i++) {
              const fixture = fixtures[i];
              const shape = fixture.m_userData;
              const collider = shape.collider;
              if (type === ERaycast2DType.AllClosest) {
                let result;
                for (let j = 0; j < results.length; j++) {
                  if (results[j].collider === collider) {
                    result = results[j];
                  }
                }
                if (result) {
                  if (fractions[i] < result.fraction) {
                    result.fixtureIndex = shape.getFixtureIndex(fixture);
                    result.point.x = points[i].x * PHYSICS_2D_PTM_RATIO;
                    result.point.y = points[i].y * PHYSICS_2D_PTM_RATIO;
                    result.normal.x = normals[i].x;
                    result.normal.y = normals[i].y;
                    result.fraction = fractions[i];
                  }
                  continue;
                }
              }
              results.push({
                collider,
                fixtureIndex: shape.getFixtureIndex(fixture),
                point: new Vec2(points[i].x * PHYSICS_2D_PTM_RATIO, points[i].y * PHYSICS_2D_PTM_RATIO),
                normal: new Vec2(normals[i].x, normals[i].y),
                fraction: fractions[i]
              });
            }
            return results;
          }
          return [];
        }
        syncPhysicsToScene() {
          const bodies = this._bodies;
          for (let i = 0, l = bodies.length; i < l; i++) {
            const body = bodies[i];
            const bodyComp = body.rigidBody;
            if (bodyComp.type === ERigidBody2DType.Animated) {
              body.resetVelocity();
              continue;
            }
            const node = bodyComp.node;
            const b2body = body.impl;

            // position
            const pos = b2body.GetPosition();
            tempVec3.x = pos.x * PHYSICS_2D_PTM_RATIO;
            tempVec3.y = pos.y * PHYSICS_2D_PTM_RATIO;
            tempVec3.z = 0;
            node.worldPosition = tempVec3;

            // rotation
            const angle = toDegree(b2body.GetAngle());
            node.setWorldRotationFromEuler(0, 0, angle);
          }
        }
        syncSceneToPhysics() {
          const bodies = this._bodies;
          for (let i = 0; i < bodies.length; i++) {
            bodies[i].syncSceneToPhysics();
          }
        }
        addBody(body) {
          const bodies = this._bodies;
          if (bodies.includes(body)) {
            return;
          }
          const bodyDef = temoBodyDef;
          const comp = body.rigidBody;
          bodyDef.allowSleep = comp.allowSleep;
          bodyDef.gravityScale = comp.gravityScale;
          bodyDef.linearDamping = comp.linearDamping;
          bodyDef.angularDamping = comp.angularDamping;
          bodyDef.fixedRotation = comp.fixedRotation;
          bodyDef.bullet = comp.bullet;
          const node = comp.node;
          const pos = node.worldPosition;
          bodyDef.position.Set(pos.x / PHYSICS_2D_PTM_RATIO, pos.y / PHYSICS_2D_PTM_RATIO);
          tempVec3.z = Quat.getAxisAngle(this._rotationAxis, node.worldRotation);
          if (this._rotationAxis.z < 0.0) {
            tempVec3.z = Math.PI * 2 - tempVec3.z;
          }
          bodyDef.angle = tempVec3.z;
          bodyDef.awake = comp.awakeOnLoad;
          if (comp.type === ERigidBody2DType.Animated) {
            bodyDef.type = ERigidBody2DType.Kinematic;
            this._animatedBodies.push(body);
            body._animatedPos.set(bodyDef.position.x, bodyDef.position.y);
            body._animatedAngle = bodyDef.angle;
          } else {
            bodyDef.type = comp.type;
          }

          // read private property
          const compPrivate = comp;
          const linearVelocity = compPrivate._linearVelocity;
          bodyDef.linearVelocity.Set(linearVelocity.x, linearVelocity.y);
          bodyDef.angularVelocity = compPrivate._angularVelocity;
          const b2Body = this._world.CreateBody(bodyDef);
          b2Body.m_userData = body;
          body._imp = b2Body;
          this._bodies.push(body);
        }
        removeBody(body) {
          if (!this._bodies.includes(body)) {
            return;
          }
          if (body.impl) {
            body.impl.m_userData = null;
            this._world.DestroyBody(body.impl);
            body._imp = null;
          }
          js.array.remove(this._bodies, body);
          const comp = body.rigidBody;
          if (comp.type === ERigidBody2DType.Animated) {
            js.array.remove(this._animatedBodies, body);
          }
        }
        _updateBodyType(body) {
          const animatedBodies = this._animatedBodies;
          const comp = body.rigidBody;
          if (comp.type !== ERigidBody2DType.Animated) {
            js.array.remove(animatedBodies, body);
          } else {
            if (animatedBodies.includes(body)) {
              return;
            }
            animatedBodies.push(body);
          }
        }
        registerContactFixture(fixture) {
          this._contactListener.registerContactFixture(fixture);
        }
        unregisterContactFixture(fixture) {
          this._contactListener.unregisterContactFixture(fixture);
        }
        testPoint(point) {
          const x = tempVec2_1.x = point.x / PHYSICS_2D_PTM_RATIO;
          const y = tempVec2_1.y = point.y / PHYSICS_2D_PTM_RATIO;
          const d = 0.2 / PHYSICS_2D_PTM_RATIO;
          tempB2AABB.lowerBound.x = x - d;
          tempB2AABB.lowerBound.y = y - d;
          tempB2AABB.upperBound.x = x + d;
          tempB2AABB.upperBound.y = y + d;
          const callback = this._aabbQueryCallback;
          callback.init(tempVec2_1);
          this._world.QueryAABB(callback, tempB2AABB);
          const fixtures = callback.getFixtures();
          testResults.length = 0;
          for (let i = 0; i < fixtures.length; i++) {
            const collider = fixtures[i].m_userData.collider;
            if (!testResults.includes(collider)) {
              testResults.push(collider);
            }
          }
          return testResults;
        }
        testAABB(rect) {
          tempB2AABB.lowerBound.x = rect.xMin / PHYSICS_2D_PTM_RATIO;
          tempB2AABB.lowerBound.y = rect.yMin / PHYSICS_2D_PTM_RATIO;
          tempB2AABB.upperBound.x = rect.xMax / PHYSICS_2D_PTM_RATIO;
          tempB2AABB.upperBound.y = rect.yMax / PHYSICS_2D_PTM_RATIO;
          const callback = this._aabbQueryCallback;
          callback.init();
          this._world.QueryAABB(callback, tempB2AABB);
          const fixtures = callback.getFixtures();
          testResults.length = 0;
          for (let i = 0; i < fixtures.length; i++) {
            const collider = fixtures[i].m_userData.collider;
            if (!testResults.includes(collider)) {
              testResults.push(collider);
            }
          }
          return testResults;
        }
        drawDebug() {
          if (TEST) return;
          this._checkDebugDrawValid();
          if (!this._debugGraphics) {
            return;
          }
          this._debugGraphics.clear();
          this._world.DrawDebugData();
        }
        _onBeginContact(b2contact) {
          const c = PhysicsContactManager.get(b2contact);
          c.emit(Contact2DType.BEGIN_CONTACT);
        }
        _onEndContact(b2contact) {
          const c = PhysicsContactManager.find(b2contact);
          if (!c) {
            return;
          }
          c.emit(Contact2DType.END_CONTACT);
          PhysicsContactManager.put(b2contact);
        }
        _onPreSolve(b2contact) {
          const c = PhysicsContactManager.find(b2contact);
          if (!c) {
            return;
          }
          c.emit(Contact2DType.PRE_SOLVE);
        }
        _onPostSolve(b2contact, impulse) {
          const c = PhysicsContactManager.find(b2contact);
          if (!c) {
            return;
          }

          // impulse only survive during post sole callback
          c._setImpulse(impulse);
          c.emit(Contact2DType.POST_SOLVE);
          c._setImpulse(null);
        }
        clearContacts() {
          PhysicsContactManager.clear();
        }
      });
    }
  };
});