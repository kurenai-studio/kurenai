System.register("q-bundled:///fs/cocos/animation/embedded-player/embedded-particle-system-player.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../define.js", "./embedded-player.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, warn, js, CLASS_NAME_PREFIX_ANIM, EmbeddedPlayableState, EmbeddedPlayable, EmbeddedParticleSystemPlayableState, _dec, _class, _class2, _descriptor, EmbeddedParticleSystemPlayable;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      warn = _coreIndexJs.warn;
      js = _coreIndexJs.js;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_embeddedPlayerJs) {
      EmbeddedPlayableState = _embeddedPlayerJs.EmbeddedPlayableState;
      EmbeddedPlayable = _embeddedPlayerJs.EmbeddedPlayable;
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
      /**
       * @en
       * The embedded particle system playable. The players play particle system on a embedded player.
       * @zh
       * 粒子系统子区域播放器。此播放器在子区域上播放粒子系统。
       */
      _export("EmbeddedParticleSystemPlayable", EmbeddedParticleSystemPlayable = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}EmbeddedParticleSystemPlayable`), _dec(_class = (_class2 = class EmbeddedParticleSystemPlayable extends EmbeddedPlayable {
        constructor(...args) {
          super(...args);
          /**
           * @en
           * Path to the node where particle system inhabits, relative from animation context root.
           * @zh
           * 粒子系统所在的结点路径，相对于动画上下文的根节点。
           */
          _initializerDefineProperty(this, "path", _descriptor, this);
        }
        instantiate(root) {
          const node = root.getChildByPath(this.path);
          if (!node) {
            warn(`Hierarchy path ${this.path} does not exists.`);
            return null;
          }
          // TODO: we shouldn't wanna know the name of `ParticleSystem` indeed.
          const ParticleSystemConstructor = js.getClassByName(`cc.ParticleSystem`);
          if (!ParticleSystemConstructor) {
            warn(`Particle system is required for embedded particle system player.`);
            return null;
          }
          const particleSystem = node.getComponent(ParticleSystemConstructor);
          if (!particleSystem) {
            warn(`${this.path} does not includes a particle system component.`);
            return null;
          }
          return new EmbeddedParticleSystemPlayableState(particleSystem);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class));
      EmbeddedParticleSystemPlayableState = class EmbeddedParticleSystemPlayableState extends EmbeddedPlayableState {
        constructor(particleSystem) {
          super(false);
          this._particleSystem = void 0;
          this._particleSystem = particleSystem;
        }
        destroy() {
          // DO NOTHING
        }

        /**
         * Plays the particle system from the beginning no matter current time.
         */
        play() {
          this._particleSystem.play();
        }

        /**
         * Pause the particle system no matter current time.
         */
        pause() {
          this._particleSystem.stopEmitting();
        }

        /**
         * Stops the particle system.
         */
        stop() {
          this._particleSystem.stopEmitting();
        }

        /**
         * Sets the speed of the particle system.
         * @param speed The speed.
         */
        setSpeed(speed) {
          this._particleSystem.simulationSpeed = speed;
        }
      };
    }
  };
});