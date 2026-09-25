System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/physics-contact.js", ["../../core/index.js", "../framework/physics-types.js", "../framework/index.js"], function (_export, _context) {
  "use strict";

  var Vec2, PHYSICS_2D_PTM_RATIO, PhysicsSystem2D, ManifoldPoint, PhysicsContact, pointCache, b2worldmanifold, worldmanifold, manifoldPointCache, manifold, impulse;
  _export("PhysicsContact", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
    }, function (_frameworkPhysicsTypesJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkPhysicsTypesJs.PHYSICS_2D_PTM_RATIO;
    }, function (_frameworkIndexJs) {
      PhysicsSystem2D = _frameworkIndexJs.PhysicsSystem2D;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      // temp world manifold
      pointCache = [new Vec2(), new Vec2()]; // const b2worldmanifold = new b2jsb.WorldManifold();
      b2worldmanifold = {
        ///< world vector pointing from A to B
        normal: {
          x: 0,
          y: 0
        },
        points: [{
          x: 0,
          y: 0
        }, {
          x: 0,
          y: 0
        }],
        //b2_maxManifoldPoints];///< world contact point (point of intersection)
        separations: [0, 0]
        //[b2_maxManifoldPoints];///< a negative value indicates overlap, in meters
      };
      worldmanifold = {
        points: [],
        separations: [],
        normal: new Vec2()
      };
      ManifoldPoint = class ManifoldPoint {
        constructor() {
          this.localPoint = new Vec2();
          this.normalImpulse = 0;
          this.tangentImpulse = 0;
        }
      };
      manifoldPointCache = [new ManifoldPoint(), new ManifoldPoint()];
      manifold = {
        type: 0,
        localPoint: new Vec2(),
        localNormal: new Vec2(),
        points: []
      };
      impulse = {
        normalImpulses: [],
        tangentImpulses: []
      };
      _export("PhysicsContact", PhysicsContact = class PhysicsContact {
        constructor() {
          this.colliderA = null;
          this.colliderB = null;
          this.disabled = false;
          this.disabledOnce = false;
          this._impulse = null;
          this._inverted = false;
          this._b2contact = null;
        }
        _setImpulse(impulse) {
          this._impulse = impulse;
        }
        init(b2contact) {
          this._b2contact = b2contact;
          this.colliderA = b2contact.GetFixtureA().m_userData.collider;
          this.colliderB = b2contact.GetFixtureB().m_userData.collider;
          this.disabled = false;
          this.disabledOnce = false;
          this._impulse = null;
          this._inverted = false;
        }
        reset() {
          this.setTangentSpeed(0);
          this.resetFriction();
          this.resetRestitution();
          this.colliderA = null;
          this.colliderB = null;
          this.disabled = false;
          this._impulse = null;
          this._b2contact = null;
        }
        getWorldManifold() {
          const points = worldmanifold.points;
          const separations = worldmanifold.separations;
          const normal = worldmanifold.normal;
          this._b2contact.GetWorldManifold(b2worldmanifold);
          const b2points = b2worldmanifold.points;
          const b2separations = b2worldmanifold.separations;
          const count = this._b2contact.GetManifold().pointCount;
          points.length = separations.length = count;
          for (let i = 0; i < count; i++) {
            const p = pointCache[i];
            p.x = b2points[i].x * PHYSICS_2D_PTM_RATIO;
            p.y = b2points[i].y * PHYSICS_2D_PTM_RATIO;
            points[i] = p;
            separations[i] = b2separations[i] * PHYSICS_2D_PTM_RATIO;
          }
          normal.x = b2worldmanifold.normal.x;
          normal.y = b2worldmanifold.normal.y;
          if (this._inverted) {
            normal.x *= -1;
            normal.y *= -1;
          }
          return worldmanifold;
        }
        getManifold() {
          const points = manifold.points;
          const localNormal = manifold.localNormal;
          const localPoint = manifold.localPoint;
          const b2manifold = this._b2contact.GetManifold();
          const b2points = b2manifold.points;
          const count = points.length = b2manifold.pointCount;
          for (let i = 0; i < count; i++) {
            const p = manifoldPointCache[i];
            const b2p = b2points[i];
            p.localPoint.x = b2p.localPoint.x * PHYSICS_2D_PTM_RATIO;
            p.localPoint.y = b2p.localPoint.y * PHYSICS_2D_PTM_RATIO;
            p.normalImpulse = b2p.normalImpulse * PHYSICS_2D_PTM_RATIO;
            p.tangentImpulse = b2p.tangentImpulse;
            points[i] = p;
          }
          localPoint.x = b2manifold.localPoint.x * PHYSICS_2D_PTM_RATIO;
          localPoint.y = b2manifold.localPoint.y * PHYSICS_2D_PTM_RATIO;
          localNormal.x = b2manifold.localNormal.x;
          localNormal.y = b2manifold.localNormal.y;
          manifold.type = b2manifold.type;
          if (this._inverted) {
            localNormal.x *= -1;
            localNormal.y *= -1;
          }
          return manifold;
        }
        getImpulse() {
          const b2impulse = this._impulse;
          if (!b2impulse) return null;
          const normalImpulses = impulse.normalImpulses;
          const tangentImpulses = impulse.tangentImpulses;
          const count = b2impulse.count;
          for (let i = 0; i < count; i++) {
            normalImpulses[i] = b2impulse.normalImpulses[i] * PHYSICS_2D_PTM_RATIO;
            tangentImpulses[i] = b2impulse.tangentImpulses[i];
          }
          tangentImpulses.length = normalImpulses.length = count;
          return impulse;
        }
        emit(contactType) {
          var _colliderA$body, _colliderB$body;
          const colliderA = this.colliderA;
          const colliderB = this.colliderB;
          const hasListenerA = colliderA == null || (_colliderA$body = colliderA.body) == null ? void 0 : _colliderA$body.enabledContactListener;
          const hasListenerB = colliderB == null || (_colliderB$body = colliderB.body) == null ? void 0 : _colliderB$body.enabledContactListener;
          if (hasListenerA) {
            colliderA.emit(contactType, colliderA, colliderB, this);
          }
          if (hasListenerB) {
            colliderB.emit(contactType, colliderB, colliderA, this);
          }
          if (hasListenerA || hasListenerB) {
            PhysicsSystem2D.instance.emit(contactType, colliderA, colliderB, this);
          }
          if (this.disabled || this.disabledOnce) {
            this.setEnabled(false);
            this.disabledOnce = false;
          }
        }
        setEnabled(value) {
          this._b2contact.SetEnabled(value);
        }
        isTouching() {
          return this._b2contact.IsTouching();
        }
        setTangentSpeed(value) {
          this._b2contact.SetTangentSpeed(value);
        }
        getTangentSpeed() {
          return this._b2contact.GetTangentSpeed();
        }
        setFriction(value) {
          this._b2contact.SetFriction(value);
        }
        getFriction() {
          return this._b2contact.GetFriction();
        }
        resetFriction() {
          return this._b2contact.ResetFriction();
        }
        setRestitution(value) {
          this._b2contact.SetRestitution(value);
        }
        getRestitution() {
          return this._b2contact.GetRestitution();
        }
        resetRestitution() {
          return this._b2contact.ResetRestitution();
        }
      });
    }
  };
});