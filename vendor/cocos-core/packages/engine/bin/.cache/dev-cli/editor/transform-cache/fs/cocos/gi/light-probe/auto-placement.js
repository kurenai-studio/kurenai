System.register("q-bundled:///fs/cocos/gi/light-probe/auto-placement.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, Enum, AutoPlacement, PlaceMethod;
  _export("AutoPlacement", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Enum = _coreIndexJs.Enum;
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
      _export("PlaceMethod", PlaceMethod = Enum({
        UNIFORM: 0,
        ADAPTIVE: 1
      }));
      _export("AutoPlacement", AutoPlacement = class AutoPlacement {
        static generate(info) {
          switch (info.method) {
            case PlaceMethod.UNIFORM:
              return this.doGenerateUniform(info);
            case PlaceMethod.ADAPTIVE:
              return this.doGenerateAdaptive(info);
            default:
              return [];
          }
        }
        static doGenerateUniform(info) {
          if (info.nProbesX < 2 || info.nProbesY < 2 || info.nProbesZ < 2) {
            return [];
          }
          const probes = [];
          const position = new Vec3(0.0, 0.0, 0.0);
          const gridSize = new Vec3((info.maxPos.x - info.minPos.x) / (info.nProbesX - 1), (info.maxPos.y - info.minPos.y) / (info.nProbesY - 1), (info.maxPos.z - info.minPos.z) / (info.nProbesZ - 1));
          for (let x = 0; x < info.nProbesX; x++) {
            position.x = x * gridSize.x + info.minPos.x;
            for (let y = 0; y < info.nProbesY; y++) {
              position.y = y * gridSize.y + info.minPos.y;
              for (let z = 0; z < info.nProbesZ; z++) {
                position.z = z * gridSize.z + info.minPos.z;
                probes.push(new Vec3(position));
              }
            }
          }
          return probes;
        }
        static doGenerateAdaptive(info) {
          // TODO
          return this.doGenerateUniform(info);
        }
      });
    }
  };
});