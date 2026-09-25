System.register("q-bundled:///fs/cocos/particle-2d/particle-system-2d-assembler.js", ["./particle-system-2d.js", "../2d/renderer/render-data.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ParticleSystem2D, MeshRenderData, cclegacy, Particle2DAssembler, particle2DAssembler, ParticleSystem2DAssembler;
  _export("Particle2DAssembler", void 0);
  return {
    setters: [function (_particleSystem2dJs) {
      ParticleSystem2D = _particleSystem2dJs.ParticleSystem2D;
    }, function (_dRendererRenderDataJs) {
      MeshRenderData = _dRendererRenderDataJs.MeshRenderData;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2018 Chukong Technologies Inc.
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
      _export("Particle2DAssembler", Particle2DAssembler = class Particle2DAssembler {
        constructor() {
          this.maxParticleDeltaTime = 0;
        }
        createData(comp) {
          return MeshRenderData.add();
        }
        removeData(data) {
          MeshRenderData.remove(data);
        }
      });
      _export("particle2DAssembler", particle2DAssembler = new Particle2DAssembler());
      _export("ParticleSystem2DAssembler", ParticleSystem2DAssembler = {
        getAssembler(comp) {
          if (!particle2DAssembler.maxParticleDeltaTime) {
            particle2DAssembler.maxParticleDeltaTime = cclegacy.game.frameTime / 1000 * 2;
          }
          return particle2DAssembler;
        }
      });
      ParticleSystem2D.Assembler = ParticleSystem2DAssembler;
    }
  };
});