System.register("q-bundled:///fs/cocos/profiler/profiler.js", ["../../../virtual/internal%253Aconstants.js", "../3d/framework/mesh-renderer.js", "../3d/misc/index.js", "../asset/assets/material.js", "../gfx/index.js", "../scene-graph/index.js", "../scene-graph/node.js", "./perf-counter.js", "../core/index.js", "../game/index.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var USE_XR, MeshRenderer, createMesh, Material, Format, TextureType, TextureUsageBit, TextureInfo, BufferTextureCopy, deviceManager, Layers, Node, PerfCounter, preTransforms, System, sys, cclegacy, settings, warnID, SettingsCategory, CCObjectFlags, Color, director, DirectorEvent, Game, game, ccwindow, Profiler, _characters, _average, _string2offset, _profileInfo, _constants, profiler;
  _export("Profiler", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_dFrameworkMeshRendererJs) {
      MeshRenderer = _dFrameworkMeshRendererJs.MeshRenderer;
    }, function (_dMiscIndexJs) {
      createMesh = _dMiscIndexJs.createMesh;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
      TextureInfo = _gfxIndexJs.TextureInfo;
      BufferTextureCopy = _gfxIndexJs.BufferTextureCopy;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_sceneGraphIndexJs) {
      Layers = _sceneGraphIndexJs.Layers;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_perfCounterJs) {
      PerfCounter = _perfCounterJs.PerfCounter;
    }, function (_coreIndexJs) {
      preTransforms = _coreIndexJs.preTransforms;
      System = _coreIndexJs.System;
      sys = _coreIndexJs.sys;
      cclegacy = _coreIndexJs.cclegacy;
      settings = _coreIndexJs.settings;
      warnID = _coreIndexJs.warnID;
      SettingsCategory = _coreIndexJs.SettingsCategory;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      Color = _coreIndexJs.Color;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
      DirectorEvent = _gameIndexJs.DirectorEvent;
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      _characters = '0123456789. ';
      _average = 500;
      _string2offset = {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        '.': 10
      };
      _profileInfo = {
        fps: {
          desc: `Framerate (FPS)`,
          below: 30,
          average: _average,
          isInteger: true
        },
        draws: {
          desc: 'Draw call',
          isInteger: true
        },
        dispatches: {
          desc: 'Dispatch call',
          isInteger: true
        },
        frame: {
          desc: 'Frame time (ms)',
          min: 0,
          max: 50,
          average: _average
        },
        instances: {
          desc: 'Instance Count',
          isInteger: true
        },
        tricount: {
          desc: 'Triangle',
          isInteger: true
        },
        logic: {
          desc: 'Game Logic (ms)',
          min: 0,
          max: 50,
          average: _average,
          color: '#080'
        },
        physics: {
          desc: 'Physics (ms)',
          min: 0,
          max: 50,
          average: _average
        },
        render: {
          desc: 'Renderer (ms)',
          min: 0,
          max: 50,
          average: _average,
          color: '#f90'
        },
        present: {
          desc: 'Present (ms)',
          min: 0,
          max: 50,
          average: _average,
          color: '#f90'
        },
        textureMemory: {
          desc: 'GFX Texture Mem(M)'
        },
        bufferMemory: {
          desc: 'GFX Buffer Mem(M)'
        }
      };
      _constants = {
        fontSize: 23,
        quadHeight: 0.4,
        segmentsPerLine: 8,
        textureWidth: 280,
        textureHeight: 280
      };
      _export("Profiler", Profiler = class Profiler extends System {
        constructor() {
          super();
          this._profilerStats = null;
          this._showFPS = false;
          this._rootNode = null;
          this._device = null;
          this._swapchain = null;
          this._meshRenderer = null;
          this._canvas = null;
          this._ctx = null;
          this._texture = null;
          this._region = new BufferTextureCopy();
          this._canvasArr = [];
          this._regionArr = [this._region];
          this.digitsData = null;
          this.offsetData = null;
          this.pass = null;
          this._canvasDone = false;
          this._statsDone = false;
          this._inited = false;
          this._lineHeight = _constants.textureHeight / (Object.keys(_profileInfo).length + 1);
          this._wordHeight = 0;
          this._eachNumWidth = 0;
          this._totalLines = 0;
          // total lines to display
          this.lastTime = 0;
          // update use time
          this._backgroundColor = new Color(150, 150, 150, 100);
          this._fontColor = Color.WHITE.clone();
        }
        init() {
          const showFPS = !!settings.querySettings(SettingsCategory.PROFILING, 'showFPS');
          if (showFPS) {
            this.showStats();
          } else {
            this.hideStats();
          }
        }
        setBackgroundColor(color) {
          if (this._backgroundColor.equals(color)) {
            return;
          }
          this._backgroundColor.set(color);
          if (this._showFPS) {
            this.hideStats();
            this.showStats();
          }
        }
        setFontColor(color) {
          if (this._fontColor.equals(color)) {
            return;
          }
          this._fontColor.set(color);
          if (this._showFPS) {
            this.hideStats();
            this.showStats();
          }
        }

        /**
         * @deprecated We have removed this private interface in version 3.8, please use the public interface get stats instead.
         */
        get _stats() {
          warnID(16381);
          return this._profilerStats;
        }

        /**
         * @zh 获取引擎运行性能状态
         * @en Get engine performance status
         */
        get stats() {
          return this._profilerStats;
        }
        isShowingStats() {
          return this._showFPS;
        }
        hideStats() {
          const self = this;
          if (self._showFPS) {
            self._profilerStats = null;
            if (self._rootNode) {
              self._rootNode.destroy();
              self._rootNode = null;
            }
            self._device = null;
            self._swapchain = null;
            const meshRenderer = self._meshRenderer;
            if (meshRenderer) {
              var _meshRenderer$sharedM, _meshRenderer$mesh;
              (_meshRenderer$sharedM = meshRenderer.sharedMaterial) == null || _meshRenderer$sharedM.destroy();
              (_meshRenderer$mesh = meshRenderer.mesh) == null || _meshRenderer$mesh.destroy();
              meshRenderer.destroy();
              self._meshRenderer = null;
            }
            self._canvas = null;
            self._ctx = null;
            if (self._texture) {
              self._texture.destroy();
              self._texture = null;
            }
            self._canvasArr.length = 0;
            self.digitsData = null;
            self.offsetData = null;
            self.pass = null; // Pass was destroyed in the material
            self._canvasDone = false;
            self._statsDone = false;
            self._inited = false;
            self._wordHeight = 0;
            self._eachNumWidth = 0;
            self._totalLines = 0;
            self.lastTime = 0;
            director.off(DirectorEvent.BEFORE_UPDATE, self.beforeUpdate, self);
            director.off(DirectorEvent.AFTER_UPDATE, self.afterUpdate, self);
            director.off(DirectorEvent.BEFORE_PHYSICS, self.beforePhysics, self);
            director.off(DirectorEvent.AFTER_PHYSICS, self.afterPhysics, self);
            director.off(DirectorEvent.BEFORE_DRAW, self.beforeDraw, self);
            director.off(DirectorEvent.AFTER_RENDER, self.afterRender, self);
            director.off(DirectorEvent.AFTER_DRAW, self.afterPresent, self);
            self._showFPS = false;
            director.root.pipeline.profiler = null;
            cclegacy.game.config.showFPS = false;
          }
        }
        showStats() {
          const game = cclegacy.game;
          if (!this._showFPS) {
            this._canvas = ccwindow.document.createElement('canvas');
            this._ctx = this._canvas.getContext('2d');
            this._canvasArr.push(this._canvas);
            if (!this._device) {
              const root = cclegacy.director.root;
              this._device = deviceManager.gfxDevice;
              this._swapchain = root.mainWindow.swapchain;
            }
            this.generateCanvas();
            this.generateStats();
            game.once(Game.EVENT_ENGINE_INITED, this.generateNode, this);
            game.on(Game.EVENT_RESTART, this.generateNode, this);
            if (this._rootNode) {
              this._rootNode.active = true;
            }
            director.on(DirectorEvent.BEFORE_UPDATE, this.beforeUpdate, this);
            director.on(DirectorEvent.AFTER_UPDATE, this.afterUpdate, this);
            director.on(DirectorEvent.BEFORE_PHYSICS, this.beforePhysics, this);
            director.on(DirectorEvent.AFTER_PHYSICS, this.afterPhysics, this);
            director.on(DirectorEvent.BEFORE_DRAW, this.beforeDraw, this);
            director.on(DirectorEvent.AFTER_RENDER, this.afterRender, this);
            director.on(DirectorEvent.AFTER_DRAW, this.afterPresent, this);
            this._showFPS = true;
            this._canvasDone = true;
            this._statsDone = true;
            game.config.showFPS = true;
          }
        }

        /** @mangle */
        generateCanvas() {
          if (this._canvasDone) {
            return;
          }
          const {
            textureWidth,
            textureHeight
          } = _constants;
          const canvas = this._canvas;
          const ctx = this._ctx;
          if (!ctx || !canvas) {
            return;
          }
          canvas.width = textureWidth;
          canvas.height = textureHeight;
          canvas.style.width = `${canvas.width}`;
          canvas.style.height = `${canvas.height}`;
          ctx.font = `${_constants.fontSize}px Arial`;
          ctx.textBaseline = 'top';
          const fontColor = this._fontColor;
          ctx.fillStyle = `rgba(${fontColor.r}, ${fontColor.g}, ${fontColor.b}, ${fontColor.a / 255})`;
          this._texture = this._device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST, Format.RGBA8, textureWidth, textureHeight));
          const texExtent = this._region.texExtent;
          texExtent.width = textureWidth;
          texExtent.height = textureHeight;
        }

        /** @mangle */
        generateStats() {
          const canvas = this._canvas;
          const ctx = this._ctx;
          if (this._statsDone || !ctx || !canvas) {
            return;
          }
          this._profilerStats = null;
          const now = performance.now();
          ctx.textAlign = 'left';
          let i = 0;
          for (const id in _profileInfo) {
            const element = _profileInfo[id];
            ctx.fillText(element.desc, 0, i * this._lineHeight);
            element.counter = new PerfCounter(id, element, now);
            i++;
          }
          this._totalLines = i;
          this._wordHeight = this._totalLines * this._lineHeight / canvas.height;
          let j = 0;
          for (j = 0; j < _characters.length; ++j) {
            const offset = ctx.measureText(_characters[j]).width;
            this._eachNumWidth = Math.max(this._eachNumWidth, offset);
          }
          for (j = 0; j < _characters.length; ++j) {
            ctx.fillText(_characters[j], j * this._eachNumWidth, this._totalLines * this._lineHeight);
          }
          const bgColor = this._backgroundColor;
          ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
          ctx.fillRect(canvas.width - 4, canvas.height - 4, 4, 4);
          this._eachNumWidth /= canvas.width;
          this._profilerStats = _profileInfo;
          this._canvasArr[0] = canvas;
          this._device.copyTexImagesToTexture(this._canvasArr, this._texture, this._regionArr);
        }

        /** @mangle */
        generateNode() {
          if (this._rootNode && this._rootNode.isValid) {
            return;
          }
          const canvas = this._canvas;
          this._rootNode = new Node('PROFILER_NODE');
          this._rootNode._objFlags = CCObjectFlags.DontSave | CCObjectFlags.HideInHierarchy;
          game.addPersistRootNode(this._rootNode);
          const managerNode = new Node('Profiler_Root');
          managerNode.parent = this._rootNode;
          const height = _constants.quadHeight;
          const rowHeight = height / this._totalLines;
          const lWidth = height / this._wordHeight;
          const scale = rowHeight / _constants.fontSize;
          const columnWidth = this._eachNumWidth * canvas.width * scale;
          const bgRight = lWidth + _constants.segmentsPerLine * columnWidth;
          const bgPadding = columnWidth;
          const vertexPos = [-bgPadding, height + bgPadding, 0,
          // top-left
          bgRight + bgPadding, height + bgPadding, 0,
          // top-right
          bgRight + bgPadding, -bgPadding, 0,
          // bottom-right
          -bgPadding, -bgPadding, 0 // bottom-left
          ];
          const vertexindices = [0, 2, 1, 0, 3, 2];
          const bgUvOriginX = (canvas.width - 3) / canvas.width;
          const bgUvOriginY = (canvas.height - 3) / canvas.height;
          const bgUvRight = (canvas.width - 1) / canvas.width;
          const bgUvTop = (canvas.height - 1) / canvas.width;
          const vertexUV = [bgUvOriginX, bgUvOriginY, -1, 0, bgUvRight, bgUvOriginY, -1, 0, bgUvRight, bgUvTop, -1, 0, bgUvOriginX, bgUvTop, -1, 0];
          vertexPos.push(0, height, 0,
          // tl
          lWidth, height, 0,
          // tr
          lWidth, 0, 0,
          // br
          0, 0, 0 // bl
          );
          vertexindices.push(4, 6, 5, 4, 7, 6);
          vertexUV.push(0, 0, -1, 0,
          // tl
          1, 0, -1, 0,
          // tr
          1, this._wordHeight, -1, 0,
          // br
          0, this._wordHeight, -1, 0 // bl
          );
          let offset = 0;
          for (let i = 0; i < this._totalLines; i++) {
            for (let j = 0; j < _constants.segmentsPerLine; j++) {
              vertexPos.push(lWidth + j * columnWidth, height - i * rowHeight, 0); // tl
              vertexPos.push(lWidth + (j + 1) * columnWidth, height - i * rowHeight, 0); // tr
              vertexPos.push(lWidth + (j + 1) * columnWidth, height - (i + 1) * rowHeight, 0); // br
              vertexPos.push(lWidth + j * columnWidth, height - (i + 1) * rowHeight, 0); // bl
              offset = (i * _constants.segmentsPerLine + j + 2) * 4; // + 2 means there are 2 quads offset before
              vertexindices.push(0 + offset, 2 + offset, 1 + offset, 0 + offset, 3 + offset, 2 + offset);
              const idx = i * _constants.segmentsPerLine + j;
              const z = Math.floor(idx / 4);
              const w = idx - z * 4;
              vertexUV.push(0, this._wordHeight, z, w); // tl
              vertexUV.push(this._eachNumWidth, this._wordHeight, z, w); // tr
              vertexUV.push(this._eachNumWidth, 1, z, w); // br
              vertexUV.push(0, 1, z, w); // bl
            }
          }
          this._meshRenderer = managerNode.addComponent(MeshRenderer);
          this._meshRenderer.mesh = createMesh({
            positions: vertexPos,
            indices: vertexindices,
            colors: vertexUV // pack all the necessary info in a_color: { x: u, y: v, z: id.x, w: id.y }
          });
          const _material = new Material();
          _material.initialize({
            effectName: 'util/profiler'
          });
          const pass = this.pass = _material.passes[0];
          const hTexture = pass.getBinding('mainTexture');
          const bDigits = pass.getBinding('digits');
          const bOffset = pass.getBinding('offset');
          pass.bindTexture(hTexture, this._texture);
          this.digitsData = pass.blocks[bDigits];
          this.offsetData = pass.blocks[bOffset];
          this.offsetData[3] = -1; // ensure init on the first frame

          this._meshRenderer.material = _material;
          this._meshRenderer.node.layer = Layers.Enum.PROFILER;
          this._inited = true;
        }

        /** @mangle */
        beforeUpdate() {
          const profilerStats = this._profilerStats;
          if (!profilerStats) {
            return;
          }
          const now = performance.now();
          profilerStats.frame.counter.start(now);
          profilerStats.logic.counter.start(now);
        }

        /** @mangle */
        afterUpdate() {
          const profilerStats = this._profilerStats;
          if (!profilerStats) {
            return;
          }
          const now = performance.now();
          if (director.isPaused()) {
            profilerStats.frame.counter.start(now);
          } else {
            profilerStats.logic.counter.end(now);
          }
        }

        /** @mangle */
        beforePhysics() {
          if (!this._profilerStats) {
            return;
          }
          const now = performance.now();
          this._profilerStats.physics.counter.start(now);
        }

        /** @mangle */
        afterPhysics() {
          if (!this._profilerStats) {
            return;
          }
          const now = performance.now();
          this._profilerStats.physics.counter.end(now);
        }

        /** @mangle */
        beforeDraw() {
          if (!this._profilerStats || !this._inited) {
            return;
          }
          const surfaceTransform = this._swapchain.surfaceTransform;
          const clipSpaceSignY = this._device.capabilities.clipSpaceSignY;
          if (surfaceTransform !== this.offsetData[3]) {
            const preTransform = preTransforms[surfaceTransform];
            let x = -0.9;
            let y = -0.9 * clipSpaceSignY;
            if (USE_XR && sys.isXR) {
              x = -0.5;
              y = -0.5 * clipSpaceSignY;
            }
            this.offsetData[0] = x * preTransform[0] + y * preTransform[2];
            this.offsetData[1] = x * preTransform[1] + y * preTransform[3];
            this.offsetData[2] = this._eachNumWidth;
            this.offsetData[3] = surfaceTransform;
          }
          this.pass.setRootBufferDirty(true);
          if (this._meshRenderer.model) {
            director.root.pipeline.profiler = this._meshRenderer.model;
          } else {
            director.root.pipeline.profiler = null;
          }
          const now = performance.now();
          this._profilerStats.render.counter.start(now);
        }

        /** @mangle */
        afterRender() {
          const profilerStats = this._profilerStats;
          if (!profilerStats || !this._inited) {
            return;
          }
          const now = performance.now();
          profilerStats.render.counter.end(now);
          profilerStats.present.counter.start(now);
        }

        /** @mangle */
        afterPresent() {
          var _device$numDispatches;
          const profilerStats = this._profilerStats;
          if (!profilerStats || !this._inited) {
            return;
          }
          const now = performance.now();
          profilerStats.frame.counter.end(now);
          profilerStats.fps.counter.frame(now);
          profilerStats.present.counter.end(now);
          if (now - this.lastTime < _average) {
            return;
          }
          this.lastTime = now;
          const device = this._device;
          profilerStats.draws.counter.value = device.numDrawCalls;
          // Native (JSB) devices expose no dispatch stats yet; WebGPU does. Treat missing as 0.
          profilerStats.dispatches.counter.value = (_device$numDispatches = device.numDispatches) != null ? _device$numDispatches : 0;
          profilerStats.instances.counter.value = device.numInstances;
          profilerStats.bufferMemory.counter.value = device.memoryStatus.bufferSize / (1024 * 1024);
          profilerStats.textureMemory.counter.value = device.memoryStatus.textureSize / (1024 * 1024);
          profilerStats.tricount.counter.value = device.numTris;
          let i = 0;
          const view = this.digitsData;
          const segmentsPerLine = _constants.segmentsPerLine;
          for (const id in profilerStats) {
            const stat = profilerStats[id];
            stat.counter.sample(now);
            const result = stat.counter.human().toString();
            for (let j = segmentsPerLine - 1; j >= 0; j--) {
              const index = i * segmentsPerLine + j;
              const character = result[result.length - (segmentsPerLine - j)];
              let offset = _string2offset[character];
              if (offset === undefined) {
                offset = 11;
              }
              view[index] = offset;
            }
            i++;
          }
        }
      });
      _export("profiler", profiler = new Profiler());
      director.registerSystem('profiler', profiler, 0);
      cclegacy.profiler = profiler;
    }
  };
});