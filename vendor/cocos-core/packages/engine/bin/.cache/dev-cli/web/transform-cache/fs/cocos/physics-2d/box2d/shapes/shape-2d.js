System.register("q-bundled:///fs/cocos/physics-2d/box2d/shapes/shape-2d.js", ["@cocos/box2d", "../../../../exports/physics-2d-framework.js", "../../../core/index.js", "../../../physics/framework/physics-enum.js"], function (_export, _context) {
  "use strict";

  var b2, PhysicsSystem2D, RigidBody2D, PHYSICS_2D_PTM_RATIO, Rect, Vec3, PhysicsGroup, b2Shape2D, tempFilter, lowerBound, upperBound;
  function getFilter(shape) {
    const comp = shape.collider;
    if (comp.body) {
      tempFilter.categoryBits = comp.group === PhysicsGroup.DEFAULT ? comp.body.group : comp.group;
    } else {
      tempFilter.categoryBits = comp.group;
    }
    tempFilter.maskBits = PhysicsSystem2D.instance.collisionMatrix[tempFilter.categoryBits];
    return tempFilter;
  }

  /** @mangle */
  _export("b2Shape2D", void 0);
  return {
    setters: [function (_cocosBox2d) {
      b2 = _cocosBox2d.default;
    }, function (_exportsPhysics2dFrameworkJs) {
      PhysicsSystem2D = _exportsPhysics2dFrameworkJs.PhysicsSystem2D;
      RigidBody2D = _exportsPhysics2dFrameworkJs.RigidBody2D;
      PHYSICS_2D_PTM_RATIO = _exportsPhysics2dFrameworkJs.PHYSICS_2D_PTM_RATIO;
    }, function (_coreIndexJs) {
      Rect = _coreIndexJs.Rect;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_physicsFrameworkPhysicsEnumJs) {
      PhysicsGroup = _physicsFrameworkPhysicsEnumJs.PhysicsGroup;
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
      tempFilter = new b2.Filter();
      lowerBound = new b2.Vec2();
      upperBound = new b2.Vec2();
      _export("b2Shape2D", b2Shape2D = class b2Shape2D {
        constructor() {
          this._shapes = [];
          this._fixtures = [];
          this._collider = null;
          this._body = null;
          this._inited = false;
          this._rect = new Rect();
        }
        get impl() {
          return this._shapes;
        }
        get collider() {
          return this._collider;
        }
        initialize(comp) {
          this._collider = comp;
        }
        onLoad() {}
        onEnable() {
          PhysicsSystem2D.instance._callAfterStep(this, this._init);
        }
        onDisable() {
          PhysicsSystem2D.instance._callAfterStep(this, this._destroy);
        }
        start() {}
        onGroupChanged() {
          const filter = getFilter(this);
          this._fixtures.forEach(f => {
            f.SetFilterData(filter);
          });
        }
        apply() {
          this._destroy();
          if (this.collider.enabledInHierarchy) {
            this._init();
          }
        }
        get worldAABB() {
          const MAX = 10e6;
          let minX = MAX;
          let minY = MAX;
          let maxX = -MAX;
          let maxY = -MAX;
          const fixtures = this._fixtures;
          for (let i = 0; i < fixtures.length; i++) {
            const fixture = fixtures[i];
            const count = fixture.GetShape().GetChildCount();
            for (let j = 0; j < count; j++) {
              lowerBound.Copy(fixture.GetAABB(j).lowerBound);
              upperBound.Copy(fixture.GetAABB(j).upperBound);
              if (fixture.GetShape().m_type === 2) {
                //b2ShapeType.e_polygonShape
                const skinWidth = fixture.GetShape().m_radius;
                lowerBound.SelfAddXY(skinWidth, skinWidth);
                upperBound.SelfSubXY(skinWidth, skinWidth);
              }
              if (lowerBound.x < minX) minX = lowerBound.x;
              if (lowerBound.y < minY) minY = lowerBound.y;
              if (upperBound.x > maxX) maxX = upperBound.x;
              if (upperBound.y > maxY) maxY = upperBound.y;
            }
          }
          minX *= PHYSICS_2D_PTM_RATIO;
          minY *= PHYSICS_2D_PTM_RATIO;
          maxX *= PHYSICS_2D_PTM_RATIO;
          maxY *= PHYSICS_2D_PTM_RATIO;
          const r = this._rect;
          r.x = minX;
          r.y = minY;
          r.width = maxX - minX;
          r.height = maxY - minY;
          return r;
        }
        getFixtureIndex(fixture) {
          return this._fixtures.indexOf(fixture);
        }

        //relativePositionX/Y : relative Position from shape to rigid body
        _createShapes(scaleX, scaleY, relativePositionX, relativePositionY) {
          return [];
        }
        _init() {
          if (this._inited) return;
          const comp = this.collider;
          const scale = comp.node.worldScale;
          // relative Position from shape to rigid body
          let relativePosition = Vec3.ZERO;
          const body = comp.getComponent(RigidBody2D);

          //if rigid body is not attached to the same node of collider, this b2.shape is attached
          // to the groundRigidBody(pos zero, rot zero)
          if (body && body.impl && body.impl.impl) {
            this._body = body.impl.impl;
          } else {
            this._body = PhysicsSystem2D.instance.physicsWorld.groundBodyImpl;
            relativePosition = comp.node.worldPosition;
          }
          const shapes = scale.x === 0 && scale.y === 0 ? [] : this._createShapes(scale.x, scale.y, relativePosition.x, relativePosition.y);
          const filter = getFilter(this);
          for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            const fixDef = {
              density: comp.density,
              isSensor: comp.sensor,
              friction: comp.friction,
              restitution: comp.restitution,
              shape,
              filter
            };
            const fixture = this._body.CreateFixture(fixDef);
            fixture.m_userData = this;
            if (body != null && body.enabledContactListener) {
              PhysicsSystem2D.instance.physicsWorld.registerContactFixture(fixture);
            }
            this._shapes.push(shape);
            this._fixtures.push(fixture);
          }
          this._inited = true;
        }
        _destroy() {
          if (!this._inited) return;
          const fixtures = this._fixtures;
          const body = this._body;
          for (let i = fixtures.length - 1; i >= 0; i--) {
            const fixture = fixtures[i];
            fixture.m_userData = null;
            PhysicsSystem2D.instance.physicsWorld.unregisterContactFixture(fixture);
            if (body) {
              body.DestroyFixture(fixture);
            }
          }
          this._body = null;
          this._fixtures.length = 0;
          this._shapes.length = 0;
          this._inited = false;
        }
      });
    }
  };
});