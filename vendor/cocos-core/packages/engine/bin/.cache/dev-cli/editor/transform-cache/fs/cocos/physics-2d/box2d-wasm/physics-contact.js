System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/physics-contact.js", ["./instantiated.js", "../../core/index.js", "../framework/physics-types.js", "../framework/index.js"], function (_export, _context) {
  "use strict";

  var B2, B2ObjectType, addImplPtrReference, getTSObjectFromWASMObjectPtr, removeImplPtrReference, Vec2, PHYSICS_2D_PTM_RATIO, PhysicsSystem2D, ManifoldPoint, PhysicsContact, pointCache, worldmanifold, manifoldPointCache, manifold, impulse;
  _export("PhysicsContact", void 0);
  return {
    setters: [function (_instantiatedJs) {
      B2 = _instantiatedJs.B2;
      B2ObjectType = _instantiatedJs.B2ObjectType;
      addImplPtrReference = _instantiatedJs.addImplPtrReference;
      getTSObjectFromWASMObjectPtr = _instantiatedJs.getTSObjectFromWASMObjectPtr;
      removeImplPtrReference = _instantiatedJs.removeImplPtrReference;
    }, function (_coreIndexJs) {
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
      /* pools moved to PhysicsContactManager */
      // temp world manifold
      pointCache = [new Vec2(), new Vec2()];
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
      /** @mangle */
      _export("PhysicsContact", PhysicsContact = class PhysicsContact {
        constructor() {
          /* static get/put/clear moved to PhysicsContactManager */
          this.colliderA = null;
          this.colliderB = null;
          this.disabled = false;
          this.disabledOnce = false;
          this._impulsePtr = 0;
          this._inverted = false;
          this._implPtr = 0;
          //wasm object pointer
          this._b2WorldmanifoldPtr = 0;
        }
        //wasm object pointer

        _setImpulse(impulse) {
          this._impulsePtr = impulse;
        }
        init(b2contact) {
          const ab = B2.ContactGetFixture(b2contact);
          this.colliderA = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, ab.x).collider;
          this.colliderB = getTSObjectFromWASMObjectPtr(B2ObjectType.Fixture, ab.y).collider;
          this.disabled = false;
          this.disabledOnce = false;
          this._impulsePtr = 0;
          this._inverted = false;
          this._implPtr = b2contact;
          addImplPtrReference(B2ObjectType.Contact, this, this._implPtr);
          this._b2WorldmanifoldPtr = B2.WorldManifoldNew();
        }
        reset() {
          this.setTangentSpeed(0);
          this.resetFriction();
          this.resetRestitution();
          this.colliderA = null;
          this.colliderB = null;
          this.disabled = false;
          this._impulsePtr = 0;
          removeImplPtrReference(B2ObjectType.Contact, this._implPtr);
          this._implPtr = 0;
          B2.WorldManifoldDelete(this._b2WorldmanifoldPtr);
          this._b2WorldmanifoldPtr = 0;
        }
        getWorldManifold() {
          const points = worldmanifold.points;
          const separations = worldmanifold.separations;
          const normal = worldmanifold.normal;
          B2.ContactGetWorldManifold(this._implPtr, this._b2WorldmanifoldPtr);
          const b2Manifold = B2.ContactGetManifold(this._implPtr);
          const count = B2.ManifoldGetPointCount(b2Manifold);
          points.length = separations.length = count;
          for (let i = 0; i < count; i++) {
            const p = pointCache[i];
            p.x = B2.WorldManifoldGetPointValueX(this._b2WorldmanifoldPtr, i) * PHYSICS_2D_PTM_RATIO;
            p.y = B2.WorldManifoldGetPointValueY(this._b2WorldmanifoldPtr, i) * PHYSICS_2D_PTM_RATIO;
            points[i] = p;
            separations[i] = B2.WorldManifoldGetSeparationValue(this._b2WorldmanifoldPtr, i) * PHYSICS_2D_PTM_RATIO;
          }
          normal.x = B2.WorldManifoldGetNormalValueX(this._b2WorldmanifoldPtr);
          normal.y = B2.WorldManifoldGetNormalValueY(this._b2WorldmanifoldPtr);
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
          const b2Manifold = B2.ContactGetManifold(this._implPtr);
          const count = points.length = B2.ManifoldGetPointCount(b2Manifold);
          for (let i = 0; i < count; i++) {
            const p = manifoldPointCache[i];
            const b2p = B2.ManifoldGetManifoldPointPtr(b2Manifold, i); //B2.ManifoldPoint
            p.localPoint.x = B2.ManifoldPointGetLocalPointX(b2p) * PHYSICS_2D_PTM_RATIO;
            p.localPoint.y = B2.ManifoldPointGetLocalPointY(b2p) * PHYSICS_2D_PTM_RATIO;
            p.normalImpulse = B2.ManifoldPointGetNormalImpulse(b2p) * PHYSICS_2D_PTM_RATIO;
            p.tangentImpulse = B2.ManifoldPointGetTangentImpulse(b2p); //* PHYSICS_2D_PTM_RATIO;?
            points[i] = p;
          }
          localPoint.x = B2.ManifoldGetLocalPointValueX(b2Manifold) * PHYSICS_2D_PTM_RATIO;
          localPoint.y = B2.ManifoldGetLocalPointValueY(b2Manifold) * PHYSICS_2D_PTM_RATIO;
          localNormal.x = B2.ManifoldGetLocalNormalValueX(b2Manifold);
          localNormal.y = B2.ManifoldGetLocalNormalValueY(b2Manifold);
          manifold.type = B2.ManifoldGetType(b2Manifold);
          if (this._inverted) {
            localNormal.x *= -1;
            localNormal.y *= -1;
          }
          return manifold;
        }
        getImpulse() {
          const b2impulse = this._impulsePtr;
          if (!b2impulse) return null;
          const normalImpulses = impulse.normalImpulses;
          const tangentImpulses = impulse.tangentImpulses;
          const count = B2.ContactImpulseGetCount(b2impulse);
          for (let i = 0; i < count; i++) {
            normalImpulses[i] = B2.ContactImpulseGetNormalImpulse(b2impulse, i) * PHYSICS_2D_PTM_RATIO;
            tangentImpulses[i] = B2.ContactImpulseGetTangentImpulse(b2impulse, i);
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
          B2.ContactSetEnabled(this._implPtr, value);
        }
        isTouching() {
          return B2.ContactIsTouching(this._implPtr);
        }
        setTangentSpeed(value) {
          B2.ContactSetTangentSpeed(this._implPtr, value);
        }
        getTangentSpeed() {
          return B2.ContactGetTangentSpeed(this._implPtr);
        }
        setFriction(value) {
          B2.ContactSetFriction(this._implPtr, value);
        }
        getFriction() {
          return B2.ContactGetFriction(this._implPtr);
        }
        resetFriction() {
          B2.ContactResetFriction(this._implPtr);
        }
        setRestitution(value) {
          B2.ContactSetRestitution(this._implPtr, value);
        }
        getRestitution() {
          return B2.ContactGetRestitution(this._implPtr);
        }
        resetRestitution() {
          B2.ContactResetRestitution(this._implPtr);
        }
      });
    }
  };
});