System.register("q-bundled:///fs/cocos/particle/particle.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var Color, Vec3, Mat4, Quat, Particle, ParticleModuleBase, PARTICLE_MODULE_NAME, PARTICLE_MODULE_ORDER, PARTICLE_MODULE_PROPERTY;
  _export({
    Particle: void 0,
    ParticleModuleBase: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Vec3 = _coreIndexJs.Vec3;
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
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
      _export("Particle", Particle = class Particle {
        constructor(particleSystem) {
          this.particleSystem = void 0;
          this.position = void 0;
          this.velocity = void 0;
          this.animatedVelocity = void 0;
          this.ultimateVelocity = void 0;
          this.angularVelocity = void 0;
          this.axisOfRotation = void 0;
          this.rotation = void 0;
          this.startEuler = void 0;
          this.startRotation = void 0;
          this.startRotated = void 0;
          this.deltaQuat = void 0;
          this.deltaMat = void 0;
          this.localMat = void 0;
          this.startSize = void 0;
          this.size = void 0;
          this.startColor = void 0;
          this.color = void 0;
          this.randomSeed = void 0;
          // uint
          this.remainingLifetime = void 0;
          this.loopCount = void 0;
          this.lastLoop = void 0;
          this.trailDelay = void 0;
          this.startLifetime = void 0;
          this.emitAccumulator0 = void 0;
          this.emitAccumulator1 = void 0;
          this.frameIndex = void 0;
          this.startRow = void 0;
          this.particleSystem = particleSystem;
          this.position = new Vec3(0, 0, 0);
          this.velocity = new Vec3(0, 0, 0);
          this.animatedVelocity = new Vec3(0, 0, 0);
          this.ultimateVelocity = new Vec3(0, 0, 0);
          this.angularVelocity = new Vec3(0, 0, 0);
          this.axisOfRotation = new Vec3(0, 0, 0);
          this.rotation = new Vec3(0, 0, 0);
          this.startEuler = new Vec3(0, 0, 0);
          this.startRotation = new Quat();
          this.startRotated = false;
          this.deltaQuat = new Quat();
          this.deltaMat = new Mat4();
          this.localMat = new Mat4();
          this.startSize = new Vec3(0, 0, 0);
          this.size = new Vec3(0, 0, 0);
          this.startColor = Color.WHITE.clone();
          this.color = Color.WHITE.clone();
          this.randomSeed = 0; // uint
          this.remainingLifetime = 0.0;
          this.loopCount = 0;
          this.lastLoop = 0;
          this.trailDelay = 0;
          this.startLifetime = 0.0;
          this.emitAccumulator0 = 0.0;
          this.emitAccumulator1 = 0.0;
          this.frameIndex = 0.0;
          this.startRow = 0;
        }
        reset() {
          this.rotation.set(0, 0, 0);
          this.startEuler.set(0, 0, 0);
          this.startRotation.set(0, 0, 0, 1);
          this.startRotated = false;
          this.deltaQuat.set(0, 0, 0, 1);
          this.deltaMat.identity();
          this.localMat.identity();
        }
      });
      Particle.INDENTIFY_NEG_QUAT = 10;
      Particle.R2D = 180.0 / Math.PI;
      _export("PARTICLE_MODULE_NAME", PARTICLE_MODULE_NAME = {
        COLOR: 'colorModule',
        FORCE: 'forceModule',
        LIMIT: 'limitModule',
        ROTATION: 'rotationModule',
        SIZE: 'sizeModule',
        VELOCITY: 'velocityModule',
        TEXTURE: 'textureModule',
        NOISE: 'noiseModule'
      });
      _export("PARTICLE_MODULE_ORDER", PARTICLE_MODULE_ORDER = ['sizeModule', 'colorModule', 'forceModule', 'velocityModule', 'limitModule', 'rotationModule', 'textureModule', 'noiseModule']);
      _export("PARTICLE_MODULE_PROPERTY", PARTICLE_MODULE_PROPERTY = ['_colorOverLifetimeModule', '_shapeModule', '_sizeOvertimeModule', '_velocityOvertimeModule', '_forceOvertimeModule', '_limitVelocityOvertimeModule', '_rotationOvertimeModule', '_textureAnimationModule', '_noiseModule', '_trailModule']);
      _export("ParticleModuleBase", ParticleModuleBase = class ParticleModuleBase {
        constructor() {
          this.target = null;
          this.needUpdate = false;
          this.needAnimate = true;
        }
        bindTarget(target) {
          this.target = target;
        }
        update(space, trans) {}
      });
    }
  };
});