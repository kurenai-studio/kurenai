System.register("q-bundled:///fs/cocos/particle/particle-culler.js", ["./particle.js", "../scene-graph/node-enum.js", "./enum.js", "../core/index.js", "./particle-general-function.js", "./animator/curve-range.js"], function (_export, _context) {
  "use strict";

  var Particle, PARTICLE_MODULE_ORDER, TransformBit, ParticleRenderMode, ParticleSpace, approx, EPSILON, Mat4, pseudoRandom, Quat, randomRangeInt, Vec3, Vec4, geometry, bits, isCurveTwoValues, particleEmitZAxis, Mode, ParticleCuller, _nodeMat, _nodeParentInv, _nodeRol, _nodeScale, _animModule;
  _export("ParticleCuller", void 0);
  return {
    setters: [function (_particleJs) {
      Particle = _particleJs.Particle;
      PARTICLE_MODULE_ORDER = _particleJs.PARTICLE_MODULE_ORDER;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_enumJs) {
      ParticleRenderMode = _enumJs.ParticleRenderMode;
      ParticleSpace = _enumJs.ParticleSpace;
    }, function (_coreIndexJs) {
      approx = _coreIndexJs.approx;
      EPSILON = _coreIndexJs.EPSILON;
      Mat4 = _coreIndexJs.Mat4;
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Quat = _coreIndexJs.Quat;
      randomRangeInt = _coreIndexJs.randomRangeInt;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
      geometry = _coreIndexJs.geometry;
      bits = _coreIndexJs.bits;
    }, function (_particleGeneralFunctionJs) {
      isCurveTwoValues = _particleGeneralFunctionJs.isCurveTwoValues;
      particleEmitZAxis = _particleGeneralFunctionJs.particleEmitZAxis;
    }, function (_animatorCurveRangeJs) {
      Mode = _animatorCurveRangeJs.Mode;
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
      _nodeMat = new Mat4();
      _nodeParentInv = new Mat4();
      _nodeRol = new Quat();
      _nodeScale = new Vec3();
      _animModule = ['_colorOverLifetimeModule', '_sizeOvertimeModule', '_velocityOvertimeModule', '_forceOvertimeModule', '_limitVelocityOvertimeModule', '_rotationOvertimeModule', '_textureAnimationModule'];
      _export("ParticleCuller", ParticleCuller = class ParticleCuller {
        constructor(ps) {
          this._particleSystem = void 0;
          this._processor = void 0;
          this._node = void 0;
          this._particlesAll = void 0;
          this._updateList = new Map();
          this._animateList = new Map();
          this._runAnimateList = [];
          this._localMat = new Mat4();
          this._gravity = new Vec4();
          this.minPos = new Vec3();
          this.maxPos = new Vec3();
          this._nodePos = new Vec3();
          this._nodeSize = new Vec3();
          this._particleSystem = ps;
          this._processor = this._particleSystem.processor;
          this._node = ps.node;
          this._particlesAll = [];
          this._initModuleList();
        }
        _updateBoundingNode() {
          this._nodeSize.set(this.maxPos.x - this.minPos.x, this.maxPos.y - this.minPos.y, this.maxPos.z - this.minPos.z);
          this._nodePos.set(this.minPos.x + this._nodeSize.x * 0.5, this.minPos.y + this._nodeSize.y * 0.5, this.minPos.z + this._nodeSize.z * 0.5);
        }
        setBoundingBoxSize(halfExt) {
          this.maxPos.x = this._nodePos.x + halfExt.x;
          this.maxPos.y = this._nodePos.y + halfExt.y;
          this.maxPos.z = this._nodePos.z + halfExt.z;
          this.minPos.x = this._nodePos.x - halfExt.x;
          this.minPos.y = this._nodePos.y - halfExt.y;
          this.minPos.z = this._nodePos.z - halfExt.z;
          this._updateBoundingNode();
        }
        setBoundingBoxCenter(px, py, pz) {
          this.maxPos.x = px + this._nodeSize.x * 0.5;
          this.maxPos.y = py + this._nodeSize.y * 0.5;
          this.maxPos.z = pz + this._nodeSize.z * 0.5;
          this.minPos.x = px - this._nodeSize.x * 0.5;
          this.minPos.y = py - this._nodeSize.y * 0.5;
          this.minPos.z = pz - this._nodeSize.z * 0.5;
          this._updateBoundingNode();
        }
        _initModuleList() {
          _animModule.forEach(val => {
            const pm = this._particleSystem[val];
            if (pm && pm.enable) {
              if (pm.needUpdate) {
                this._updateList.set(pm.name, pm);
              }
              if (pm.needAnimate) {
                this._animateList.set(pm.name, pm);
              }
            }
          });

          // reorder
          this._runAnimateList.length = 0;
          for (let i = 0, len = PARTICLE_MODULE_ORDER.length; i < len; i++) {
            const p = this._animateList.get(PARTICLE_MODULE_ORDER[i]);
            if (p) {
              this._runAnimateList.push(p);
            }
          }
        }
        _emit(count, dt, particleLst) {
          const ps = this._particleSystem;
          const node = this._node;
          const loopDelta = ps.time % ps.duration / ps.duration; // loop delta value

          node.invalidateChildren(TransformBit.POSITION);
          if (ps.simulationSpace === ParticleSpace.World) {
            node.getWorldMatrix(_nodeMat);
            node.getWorldRotation(_nodeRol);
          }
          for (let i = 0; i < count; ++i) {
            const particle = new Particle(ps);
            particle.particleSystem = ps;
            particle.reset();
            const rand = pseudoRandom(randomRangeInt(0, bits.INT_MAX));
            if (ps._shapeModule && ps._shapeModule.enable) {
              ps._shapeModule.emit(particle);
            } else {
              Vec3.set(particle.position, 0, 0, 0);
              Vec3.copy(particle.velocity, particleEmitZAxis);
            }
            if (ps._textureAnimationModule && ps._textureAnimationModule.enable) {
              ps._textureAnimationModule.init(particle);
            }
            const curveStartSpeed = ps.startSpeed.evaluate(loopDelta, rand);
            Vec3.multiplyScalar(particle.velocity, particle.velocity, curveStartSpeed);
            if (ps.simulationSpace === ParticleSpace.World) {
              Vec3.transformMat4(particle.position, particle.position, _nodeMat);
              Vec3.transformQuat(particle.velocity, particle.velocity, _nodeRol);
            }
            Vec3.copy(particle.ultimateVelocity, particle.velocity);

            // apply startRotation.
            Vec3.set(particle.rotation, 0, 0, 0);

            // apply startSize.
            if (ps.startSize3D) {
              Vec3.set(particle.startSize, ps.startSizeX.evaluate(loopDelta, rand), ps.startSizeY.evaluate(loopDelta, rand), ps.startSizeZ.evaluate(loopDelta, rand));
            } else {
              Vec3.set(particle.startSize, ps.startSizeX.evaluate(loopDelta, rand), 1, 1);
              particle.startSize.y = particle.startSize.x;
            }
            Vec3.copy(particle.size, particle.startSize);

            // apply startLifetime.
            particle.startLifetime = ps.startLifetime.evaluate(loopDelta, rand) + dt;
            particle.remainingLifetime = particle.startLifetime;
            particleLst.push(particle);
          }
        }
        _updateParticles(dt, particleLst) {
          const ps = this._particleSystem;
          ps.node.getWorldMatrix(_nodeMat);
          switch (ps.scaleSpace) {
            case ParticleSpace.Local:
              ps.node.getScale(_nodeScale);
              break;
            case ParticleSpace.World:
              ps.node.getWorldScale(_nodeScale);
              break;
            default:
              break;
          }
          this._updateList.forEach((value, key) => {
            // TODO(cjh): Bug here? _updateList is a Map, the old code uses `this._updateList['some_key'] = some_value;`
            // to do the assignment which forEach will not take care of it.
            // In order not to change the behavior in this PR ( https://github.com/cocos/cocos-engine/pull/17289 )
            // We commented the update the particle module temporarily.
            // value.update(ps.simulationSpace, _node_mat);
          });
          if (ps.simulationSpace === ParticleSpace.Local) {
            const r = ps.node.getRotation();
            Mat4.fromQuat(this._localMat, r);
            this._localMat.transpose(); // just consider rotation, use transpose as invert
          }
          if (ps.node.parent) {
            ps.node.parent.getWorldMatrix(_nodeParentInv);
            _nodeParentInv.invert();
          }
          for (let i = 0; i < particleLst.length; ++i) {
            const p = particleLst[i];
            p.remainingLifetime -= dt;
            Vec3.set(p.animatedVelocity, 0, 0, 0);

            // apply gravity when both the mode is not Constant and the value is not 0.
            const useGravity = ps.gravityModifier.mode !== Mode.Constant || ps.gravityModifier.constant !== 0;
            if (useGravity) {
              const rand = isCurveTwoValues(ps.gravityModifier) ? pseudoRandom(p.randomSeed) : 0;
              if (ps.simulationSpace === ParticleSpace.Local) {
                const gravityFactor = -ps.gravityModifier.evaluate(1 - p.remainingLifetime / p.startLifetime, rand) * 9.8 * dt;
                this._gravity.x = 0.0;
                this._gravity.y = gravityFactor;
                this._gravity.z = 0.0;
                this._gravity.w = 1.0;
                if (!approx(gravityFactor, 0.0, EPSILON)) {
                  if (ps.node.parent) {
                    this._gravity = this._gravity.transformMat4(_nodeParentInv);
                  }
                  this._gravity = this._gravity.transformMat4(this._localMat);
                  p.velocity.x += this._gravity.x;
                  p.velocity.y += this._gravity.y;
                  p.velocity.z += this._gravity.z;
                }
              } else {
                // apply gravity.
                p.velocity.y -= ps.gravityModifier.evaluate(1 - p.remainingLifetime / p.startLifetime, rand) * 9.8 * dt;
              }
            }
            Vec3.copy(p.ultimateVelocity, p.velocity);
            this._runAnimateList.forEach(value => {
              value.animate(p, dt);
            });
            Vec3.scaleAndAdd(p.position, p.position, p.ultimateVelocity, dt); // apply velocity.
          }
        }
        _calculateBounding(isInit) {
          const size = new Vec3();
          const position = new Vec3();
          const subPos = new Vec3();
          const addPos = new Vec3();
          const meshSize = new Vec3(1.0, 1.0, 1.0);
          if (this._processor.getInfo().renderMode === ParticleRenderMode.Mesh) {
            const mesh = this._processor.getInfo().mesh;
            if (mesh && mesh.struct.minPosition && mesh.struct.maxPosition) {
              const meshAABB = new geometry.AABB();
              geometry.AABB.fromPoints(meshAABB, mesh.struct.minPosition, mesh.struct.maxPosition);
              const meshMax = Math.max(meshAABB.halfExtents.x, meshAABB.halfExtents.y, meshAABB.halfExtents.z);
              meshSize.set(meshMax, meshMax, meshMax);
            }
          }
          const worldMat = this._particleSystem.node.worldMatrix;
          for (let i = 0; i < this._particlesAll.length; ++i) {
            const p = this._particlesAll[i];
            Vec3.multiply(size, _nodeScale, p.size);
            Vec3.multiply(size, size, meshSize);
            position.set(p.position);
            if (this._particleSystem.simulationSpace !== ParticleSpace.World) {
              Vec3.transformMat4(position, position, worldMat);
            }
            if (isInit && i === 0) {
              Vec3.subtract(this.minPos, position, size);
              Vec3.add(this.maxPos, position, size);
            } else {
              Vec3.subtract(subPos, position, size);
              Vec3.add(addPos, position, size);
              Vec3.min(this.minPos, this.minPos, subPos);
              Vec3.max(this.maxPos, this.maxPos, addPos);
            }
          }
        }
        calculatePositions() {
          this._emit(this._particleSystem.capacity, 0, this._particlesAll);
          const rand = isCurveTwoValues(this._particleSystem.startLifetime) ? pseudoRandom(randomRangeInt(0, bits.INT_MAX)) : 0;
          this._updateParticles(0, this._particlesAll);
          this._calculateBounding(true);
          this._updateParticles(this._particleSystem.startLifetime.evaluate(0, rand), this._particlesAll);
          this._calculateBounding(false);
          this._updateBoundingNode();
        }
        clear() {
          this._particlesAll.length = 0;
        }
        destroy() {}
      });
    }
  };
});