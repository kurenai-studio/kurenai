System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/physics-world.js", ["../../../../virtual/internal%253Aconstants.js", "./instantiated.js", "../../core/index.js", "../framework/physics-types.js", "../../2d/framework/index.js", "./platform/physics-contact-listener.js", "./platform/physics-aabb-query-callback.js", "./platform/physics-ray-cast-callback.js", "./physics-contact-manager.js", "../framework/index.js", "./platform/physics-debug-draw.js", "../../scene-graph/index.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, B2, getImplPtr, addImplPtrReference, addImplPtrReferenceWASM, getTSObjectFromWASMObjectPtr, removeImplPtrReference, removeImplPtrReferenceWASM, B2ObjectType, Vec3, Quat, Vec2, toDegree, CCObjectFlags, js, errorID, PHYSICS_2D_PTM_RATIO, ERaycast2DType, ERigidBody2DType, Canvas, PhysicsContactListener, PhysicsAABBQueryCallback, PhysicsRayCastCallback, PhysicsContactManager, Contact2DType, PhysicsDebugDraw, Node, find, Layers, director, B2PhysicsWorld, tempVec3, tempVec2_1, tempVec2_2, testResults;
  _export("B2PhysicsWorld", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_instantiatedJs) {
      B2 = _instantiatedJs.B2;
      getImplPtr = _instantiatedJs.getImplPtr;
      addImplPtrReference = _instantiatedJs.addImplPtrReference;
      addImplPtrReferenceWASM = _instantiatedJs.addImplPtrReferenceWASM;
      getTSObjectFromWASMObjectPtr = _instantiatedJs.getTSObjectFromWASMObjectPtr;
      removeImplPtrReference = _instantiatedJs.removeImplPtrReference;
      removeImplPtrReferenceWASM = _instantiatedJs.removeImplPtrReferenceWASM;
      B2ObjectType = _instantiatedJs.B2ObjectType;
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
    }, function (_dFrameworkIndexJs) {
      Canvas = _dFrameworkIndexJs.Canvas;
    }, function (_platformPhysicsContactListenerJs) {
      PhysicsContactListener = _platformPhysicsContactListenerJs.PhysicsContactListener;
    }, function (_platformPhysicsAabbQueryCallbackJs) {
      PhysicsAABBQueryCallback = _platformPhysicsAabbQueryCallbackJs.PhysicsAABBQueryCallback;
    }, function (_platformPhysicsRayCastCallbackJs) {
      PhysicsRayCastCallback = _platformPhysicsRayCastCallbackJs.PhysicsRayCastCallback;
    }, function (_physicsContactManagerJs) {
      PhysicsContactManager = _physicsContactManagerJs.PhysicsContactManager;
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
      tempVec2_2 = new Vec2(); // const tempB2AABB = null;//new B2.AABB();
      testResults = [];
      /** @mangle */
      _export("B2PhysicsWorld", B2PhysicsWorld = class B2PhysicsWorld {
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
          this._temoBodyDef = void 0;
          this._tempB2AABB = void 0;
          this.tempB2FixtureDefPtr = void 0;
          this._debugGraphics = null;
          this._b2DebugDrawer = null;
          this._debugDrawFlags = 0;
          this._world = new B2.World({
            x: 0,
            y: -10
          });
          this._physicsGroundBody = this._world.CreateBody(new B2.BodyDef());
          PhysicsContactListener._BeginContact = this._onBeginContact;
          PhysicsContactListener._EndContact = this._onEndContact;
          PhysicsContactListener._PreSolve = this._onPreSolve;
          PhysicsContactListener._PostSolve = this._onPostSolve;
          this._contactListener = B2.ContactListener.implement(PhysicsContactListener.callback);
          const orgRegisterContactFixture = this._contactListener.registerContactFixture.bind(this._contactListener);
          this._contactListener.registerContactFixture = contactFixture => {
            PhysicsContactListener.registerContactFixture(contactFixture);
            orgRegisterContactFixture(contactFixture);
          };
          const orgUnregisterContactFixture = this._contactListener.unregisterContactFixture.bind(this._contactListener);
          this._contactListener.unregisterContactFixture = contactFixture => {
            PhysicsContactListener.unregisterContactFixture(contactFixture);
            orgUnregisterContactFixture(contactFixture);
          };
          this._world.SetContactListener(this._contactListener);
          this._aabbQueryCallback = B2.QueryCallback.implement(PhysicsAABBQueryCallback.callback);
          this._raycastQueryCallback = B2.RayCastCallback.implement(PhysicsRayCastCallback.callback);
          this._temoBodyDef = new B2.BodyDef();
          this._tempB2AABB = new B2.AABB();
          this.tempB2FixtureDefPtr = B2.FixtureDefNew();
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
              canvas.addComponent(Canvas);
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
              PhysicsDebugDraw._drawer = this._debugGraphics;
              const debugDraw = B2.Draw.implement(PhysicsDebugDraw.callback); //new PhysicsDebugDraw();

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
          PhysicsRayCastCallback.init(type, mask);
          this._world.RayCast(this._raycastQueryCallback, tempVec2_1, tempVec2_2);
          const fixtures = PhysicsRayCastCallback.getFixtures();
          if (fixtures.length > 0) {
            const points = PhysicsRayCastCallback.getPoints();
            const normals = PhysicsRayCastCallback.getNormals();
            const fractions = PhysicsRayCastCallback.getFractions();
            const results = [];
            for (let i = 0, l = fixtures.length; i < l; i++) {
              const fixture = fixtures[i];
              const shape = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, fixture);
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
          const bodyDef = this._temoBodyDef;
          const comp = body.rigidBody;
          bodyDef.allowSleep = comp.allowSleep;
          bodyDef.gravityScale = comp.gravityScale;
          bodyDef.linearDamping = comp.linearDamping;
          bodyDef.angularDamping = comp.angularDamping;
          bodyDef.fixedRotation = comp.fixedRotation;
          bodyDef.bullet = comp.bullet;
          const node = comp.node;
          const pos = node.worldPosition;
          bodyDef.position = {
            x: pos.x / PHYSICS_2D_PTM_RATIO,
            y: pos.y / PHYSICS_2D_PTM_RATIO
          };
          tempVec3.z = Quat.getAxisAngle(this._rotationAxis, node.worldRotation);
          if (this._rotationAxis.z < 0.0) {
            tempVec3.z = Math.PI * 2 - tempVec3.z;
          }
          bodyDef.angle = tempVec3.z;
          bodyDef.awake = comp.awakeOnLoad;
          if (comp.type === ERigidBody2DType.Animated) {
            bodyDef.type = B2.BodyType.b2_kinematicBody;
            this._animatedBodies.push(body);
            body._animatedPos.set(bodyDef.position.x, bodyDef.position.y);
            body._animatedAngle = bodyDef.angle;
          } else {
            switch (comp.type) {
              case ERigidBody2DType.Dynamic:
                bodyDef.type = B2.BodyType.b2_dynamicBody;
                break;
              case ERigidBody2DType.Static:
                bodyDef.type = B2.BodyType.b2_staticBody;
                break;
              case ERigidBody2DType.Kinematic:
                bodyDef.type = B2.BodyType.b2_kinematicBody;
                break;
              default:
                bodyDef.type = B2.BodyType.b2_staticBody;
                break;
            }
          }

          // read private property
          const compPrivate = comp;
          const linearVelocity = compPrivate._linearVelocity;
          bodyDef.linearVelocity = {
            x: linearVelocity.x,
            y: linearVelocity.y
          };
          bodyDef.angularVelocity = compPrivate._angularVelocity;
          const b2Body = this._world.CreateBody(bodyDef);
          addImplPtrReference(B2ObjectType.Body, body, getImplPtr(b2Body));
          addImplPtrReferenceWASM(B2ObjectType.Body, b2Body, getImplPtr(b2Body));
          body._imp = b2Body;
          this._bodies.push(body);
        }
        removeBody(body) {
          if (!this._bodies.includes(body)) {
            return;
          }
          if (body.impl) {
            removeImplPtrReference(B2ObjectType.Body, getImplPtr(body.impl));
            removeImplPtrReferenceWASM(B2ObjectType.Body, getImplPtr(body.impl));
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
          //B2.Fixture ptr
          this._contactListener.registerContactFixture(fixture);
        }
        unregisterContactFixture(fixture) {
          //B2.Fixture ptr
          this._contactListener.unregisterContactFixture(fixture);
        }
        testPoint(point) {
          const x = tempVec2_1.x = point.x / PHYSICS_2D_PTM_RATIO;
          const y = tempVec2_1.y = point.y / PHYSICS_2D_PTM_RATIO;
          const d = 0.2 / PHYSICS_2D_PTM_RATIO;
          this._tempB2AABB.lowerBound = {
            x: x - d,
            y: y - d
          };
          this._tempB2AABB.upperBound = {
            x: x + d,
            y: y + d
          };
          const callback = this._aabbQueryCallback;
          PhysicsAABBQueryCallback.init(tempVec2_1);
          this._world.QueryAABB(callback, this._tempB2AABB);
          const fixtures = PhysicsAABBQueryCallback.getFixtures();
          testResults.length = 0;
          for (let i = 0; i < fixtures.length; i++) {
            const collider = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, fixtures[i]).collider;
            if (!testResults.includes(collider)) {
              testResults.push(collider);
            }
          }
          return testResults;
        }
        testAABB(rect) {
          this._tempB2AABB.lowerBound = {
            x: rect.xMin / PHYSICS_2D_PTM_RATIO,
            y: rect.yMin / PHYSICS_2D_PTM_RATIO
          };
          this._tempB2AABB.upperBound = {
            x: rect.xMax / PHYSICS_2D_PTM_RATIO,
            y: rect.yMax / PHYSICS_2D_PTM_RATIO
          };
          const callback = this._aabbQueryCallback;
          PhysicsAABBQueryCallback.init();
          this._world.QueryAABB(callback, this._tempB2AABB);
          const fixtures = PhysicsAABBQueryCallback.getFixtures();
          testResults.length = 0;
          for (let i = 0; i < fixtures.length; i++) {
            const collider = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, fixtures[i]).collider;
            if (!testResults.includes(collider)) {
              testResults.push(collider);
            }
          }
          return testResults;
        }
        drawDebug() {
          this._checkDebugDrawValid();
          if (!this._debugGraphics) {
            return;
          }
          this._debugGraphics.clear();
          this._world.DebugDraw();
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
          c._setImpulse(0);
        }
        clearContacts() {
          PhysicsContactManager.clear();
        }
      });
    }
  };
});