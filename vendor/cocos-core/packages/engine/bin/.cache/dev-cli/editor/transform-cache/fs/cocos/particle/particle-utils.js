System.register("q-bundled:///fs/cocos/particle/particle-utils.js", ["../serialization/index.js", "../core/index.js", "../game/director.js", "../scene-graph/index.js", "./particle-system.js"], function (_export, _context) {
  "use strict";

  var instantiate, Pool, director, DirectorEvent, Node, ParticleSystem, ParticleUtils;
  _export("ParticleUtils", void 0);
  return {
    setters: [function (_serializationIndexJs) {
      instantiate = _serializationIndexJs.instantiate;
    }, function (_coreIndexJs) {
      Pool = _coreIndexJs.Pool;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_particleSystemJs) {
      ParticleSystem = _particleSystemJs.ParticleSystem;
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
      /**
       * @en Contains some util functions for particle system. Such as create and destroy particle system.
       * @zh 该类包含一些粒子系统的工具函数，例如创建和销毁粒子系统。
       */
      _export("ParticleUtils", ParticleUtils = class ParticleUtils {
        /**
         * @en Instantiate particle system from prefab.
         * @zh 从 prefab 实例化粒子系统。
         */
        static instantiate(prefab) {
          if (!this.registeredSceneEvent) {
            director.on(DirectorEvent.BEFORE_SCENE_LAUNCH, this.onSceneUnload, this);
            this.registeredSceneEvent = true;
          }
          const uuid = prefab._uuid;
          if (!this.particleSystemPool.has(uuid)) {
            const ps = new Pool(() => instantiate(prefab) || new Node(), 1, prefab => prefab.destroy());
            this.particleSystemPool.set(uuid, ps);
          }
          return this.particleSystemPool.get(uuid).alloc();
        }

        /**
         * @en Destroy particle system prefab.
         * @zh 销毁创建出来的粒子系统prefab。
         * @param prefab @en Particle system prefab to destroy. @zh 要销毁的粒子系统prefab。
         */
        static destroy(prefab) {
          var _prefab$prefab;
          const uuid = (_prefab$prefab = prefab.prefab) == null || (_prefab$prefab = _prefab$prefab.asset) == null ? void 0 : _prefab$prefab.uuid;
          if (uuid && this.particleSystemPool.has(uuid)) {
            this.stop(prefab);
            this.particleSystemPool.get(uuid).free(prefab);
          }
        }

        /**
         * @en Play particle system.
         * @zh 播放粒子系统。
         * @param rootNode @en Root node contains the particle system. @zh 包含粒子系统的根节点。
         */
        static play(rootNode) {
          for (const ps of rootNode.getComponentsInChildren(ParticleSystem)) {
            ps.play();
          }
        }

        /**
         * @en Stop particle system.
         * @zh 停止播放粒子系统。
         * @param rootNode @en Root node contains the particle system. @zh 包含粒子系统的根节点。
         */
        static stop(rootNode) {
          for (const ps of rootNode.getComponentsInChildren(ParticleSystem)) {
            ps.stop();
          }
        }
        static onSceneUnload() {
          this.particleSystemPool.forEach(value => value.destroy());
          this.particleSystemPool.clear();
        }
      });
      ParticleUtils.particleSystemPool = new Map();
      ParticleUtils.registeredSceneEvent = false;
    }
  };
});