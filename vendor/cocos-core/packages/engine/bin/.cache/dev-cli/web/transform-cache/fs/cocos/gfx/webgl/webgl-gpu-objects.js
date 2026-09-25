System.register("q-bundled:///fs/cocos/gfx/webgl/webgl-gpu-objects.js", ["../base/define.js", "../base/pipeline-state.js", "./webgl-commands.js", "./webgl-define.js", "../gl-constants.js", "../../core/math/bits.js"], function (_export, _context) {
  "use strict";

  var DescriptorType, Format, ShaderStageFlagBit, Type, Attribute, UniformBlock, UniformSamplerTexture, DescriptorSetLayoutBinding, DrawInfo, Uniform, BufferUsageBit, MemoryUsageBit, Filter, FormatInfos, DepthStencilState, WebGLCmdFuncBindStates, WebGLCmdFuncCreateBuffer, WebGLCmdFuncCreateInputAssember, WebGLCmdFuncCreateShader, WebGLCmdFuncDestroyBuffer, WebGLCmdFuncDestroyInputAssembler, WebGLCmdFuncDestroyShader, WebGLCmdFuncDraw, WebGLCmdFuncUpdateBuffer, WebGLDeviceManager, WebGLConstants, nextPow2, WebGLIndirectDrawInfos, IWebGLBlitManager;
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

  function createInt32Array(capacity) {
    return new Int32Array(capacity);
  }

  /** @mangle */
  _export({
    WebGLIndirectDrawInfos: void 0,
    IWebGLBlitManager: void 0
  });
  return {
    setters: [function (_baseDefineJs) {
      DescriptorType = _baseDefineJs.DescriptorType;
      Format = _baseDefineJs.Format;
      ShaderStageFlagBit = _baseDefineJs.ShaderStageFlagBit;
      Type = _baseDefineJs.Type;
      Attribute = _baseDefineJs.Attribute;
      UniformBlock = _baseDefineJs.UniformBlock;
      UniformSamplerTexture = _baseDefineJs.UniformSamplerTexture;
      DescriptorSetLayoutBinding = _baseDefineJs.DescriptorSetLayoutBinding;
      DrawInfo = _baseDefineJs.DrawInfo;
      Uniform = _baseDefineJs.Uniform;
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      MemoryUsageBit = _baseDefineJs.MemoryUsageBit;
      Filter = _baseDefineJs.Filter;
      FormatInfos = _baseDefineJs.FormatInfos;
    }, function (_basePipelineStateJs) {
      DepthStencilState = _basePipelineStateJs.DepthStencilState;
    }, function (_webglCommandsJs) {
      WebGLCmdFuncBindStates = _webglCommandsJs.WebGLCmdFuncBindStates;
      WebGLCmdFuncCreateBuffer = _webglCommandsJs.WebGLCmdFuncCreateBuffer;
      WebGLCmdFuncCreateInputAssember = _webglCommandsJs.WebGLCmdFuncCreateInputAssember;
      WebGLCmdFuncCreateShader = _webglCommandsJs.WebGLCmdFuncCreateShader;
      WebGLCmdFuncDestroyBuffer = _webglCommandsJs.WebGLCmdFuncDestroyBuffer;
      WebGLCmdFuncDestroyInputAssembler = _webglCommandsJs.WebGLCmdFuncDestroyInputAssembler;
      WebGLCmdFuncDestroyShader = _webglCommandsJs.WebGLCmdFuncDestroyShader;
      WebGLCmdFuncDraw = _webglCommandsJs.WebGLCmdFuncDraw;
      WebGLCmdFuncUpdateBuffer = _webglCommandsJs.WebGLCmdFuncUpdateBuffer;
    }, function (_webglDefineJs) {
      WebGLDeviceManager = _webglDefineJs.WebGLDeviceManager;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
    }, function (_coreMathBitsJs) {
      nextPow2 = _coreMathBitsJs.nextPow2;
    }],
    execute: function () {
      _export("WebGLIndirectDrawInfos", WebGLIndirectDrawInfos = class WebGLIndirectDrawInfos {
        constructor() {
          this.drawCount = 0;
          this.drawByIndex = false;
          this.instancedDraw = false;
          this._capacity = 4;
          this.counts = createInt32Array(this._capacity);
          this.offsets = createInt32Array(this._capacity);
          this.instances = createInt32Array(this._capacity);
          this.byteOffsets = createInt32Array(this._capacity);
        }
        clearDraws() {
          this.drawCount = 0;
          this.drawByIndex = false;
          this.instancedDraw = false;
        }
        setDrawInfo(idx, info) {
          this._ensureCapacity(idx);
          this.drawByIndex = info.indexCount > 0;
          this.instancedDraw = !!info.instanceCount;
          this.drawCount = Math.max(idx + 1, this.drawCount);
          if (this.drawByIndex) {
            this.counts[idx] = info.indexCount;
            this.offsets[idx] = info.firstIndex;
          } else {
            this.counts[idx] = info.vertexCount;
            this.offsets[idx] = info.firstVertex;
          }
          this.instances[idx] = Math.max(1, info.instanceCount);
        }
        _ensureCapacity(target) {
          if (this._capacity > target) return;
          this._capacity = nextPow2(target);
          const counts = createInt32Array(this._capacity);
          const offsets = createInt32Array(this._capacity);
          const instances = createInt32Array(this._capacity);
          this.byteOffsets = createInt32Array(this._capacity);
          counts.set(this.counts);
          offsets.set(this.offsets);
          instances.set(this.instances);
          this.counts = counts;
          this.offsets = offsets;
          this.instances = instances;
        }
      });
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      _export("IWebGLBlitManager", IWebGLBlitManager = class IWebGLBlitManager {
        constructor() {
          this._gpuShader = null;
          this._gpuDescriptorSetLayout = null;
          this._gpuPipelineLayout = null;
          this._gpuPipelineState = null;
          this._gpuVertexBuffer = null;
          this._gpuInputAssembler = null;
          this._gpuPointSampler = null;
          this._gpuLinearSampler = null;
          this._gpuDescriptorSet = null;
          this._gpuUniformBuffer = null;
          this._drawInfo = null;
          this._glFramebuffer = null;
          this._uniformBuffer = null;
          const device = WebGLDeviceManager.instance;
          const samplerOffset = device.bindingMappingInfo.maxBlockCounts[0];
          this._gpuShader = {
            name: 'Blit Pass',
            blocks: [new UniformBlock(0, 0, `BlitParams`, [new Uniform(`tilingOffsetSrc`, Type.FLOAT4, 1), new Uniform(`tilingOffsetDst`, Type.FLOAT4, 1)], 1)],
            samplerTextures: [new UniformSamplerTexture(0, samplerOffset, 'textureSrc', Type.SAMPLER2D, 1)],
            subpassInputs: [],
            gpuStages: [{
              type: ShaderStageFlagBit.VERTEX,
              source: `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec4 tilingOffsetSrc;
uniform vec4 tilingOffsetDst;
varying vec2 v_texCoord;
void main() {
    v_texCoord = a_texCoord * tilingOffsetSrc.xy + tilingOffsetSrc.zw;
    gl_Position = vec4((a_position + 1.0) * tilingOffsetDst.xy - 1.0 + tilingOffsetDst.zw * 2.0, 0, 1);
}`,
              glShader: null
            }, {
              type: ShaderStageFlagBit.FRAGMENT,
              source: `
precision mediump float;
uniform sampler2D textureSrc;
varying vec2 v_texCoord;
void main() {
    gl_FragColor = texture2D(textureSrc, v_texCoord);
}`,
              glShader: null
            }],
            glProgram: null,
            glInputs: [],
            glUniforms: [],
            glBlocks: [],
            glSamplerTextures: []
          };
          WebGLCmdFuncCreateShader(WebGLDeviceManager.instance, this._gpuShader);
          this._gpuDescriptorSetLayout = {
            bindings: [new DescriptorSetLayoutBinding(0, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX), new DescriptorSetLayoutBinding(samplerOffset, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT)],
            dynamicBindings: [],
            descriptorIndices: [],
            descriptorCount: samplerOffset + 1
          };
          for (let i = 0; i < samplerOffset; i++) {
            this._gpuDescriptorSetLayout.descriptorIndices[i] = 0;
          }
          this._gpuDescriptorSetLayout.descriptorIndices.push(1);
          this._gpuPipelineLayout = {
            gpuSetLayouts: [this._gpuDescriptorSetLayout],
            dynamicOffsetCount: 0,
            dynamicOffsetOffsets: [0],
            dynamicOffsetIndices: [[]]
          };
          this._gpuPipelineState = {
            glPrimitive: WebGLConstants.TRIANGLE_STRIP,
            gpuShader: this._gpuShader,
            gpuPipelineLayout: this._gpuPipelineLayout,
            rs: null,
            dss: new DepthStencilState(false, false),
            bs: null,
            dynamicStates: [],
            gpuRenderPass: null
          };
          this._gpuVertexBuffer = {
            usage: BufferUsageBit.VERTEX,
            memUsage: MemoryUsageBit.DEVICE,
            size: 16 * Float32Array.BYTES_PER_ELEMENT,
            stride: 4 * Float32Array.BYTES_PER_ELEMENT,
            buffer: null,
            vf32: null,
            indirects: new WebGLIndirectDrawInfos(),
            glTarget: 0,
            glBuffer: null
          };
          WebGLCmdFuncCreateBuffer(WebGLDeviceManager.instance, this._gpuVertexBuffer);
          WebGLDeviceManager.instance.memoryStatus.bufferSize += this._gpuVertexBuffer.size;
          const data = new Float32Array([-1.0, -1.0, 0.0, 0.0, 1.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
          WebGLCmdFuncUpdateBuffer(WebGLDeviceManager.instance, this._gpuVertexBuffer, data, 0, data.length);
          this._gpuInputAssembler = {
            attributes: [new Attribute(`a_position`, Format.RG32F), new Attribute(`a_texCoord`, Format.RG32F)],
            gpuVertexBuffers: [this._gpuVertexBuffer],
            gpuIndexBuffer: null,
            gpuIndirectBuffer: null,
            glAttribs: [],
            glIndexType: 0,
            glVAOs: new Map()
          };
          WebGLCmdFuncCreateInputAssember(WebGLDeviceManager.instance, this._gpuInputAssembler);
          this._gpuPointSampler = {
            glMinFilter: 0x2600,
            // WebGLRenderingContext.NEAREST
            glMagFilter: 0x2600,
            // WebGLRenderingContext.NEAREST
            glWrapS: 0x2901,
            // WebGLRenderingContext.REPEAT,
            glWrapT: 0x2901,
            // WebGLRenderingContext.REPEAT,
            glWrapR: 0x2901 // WebGLRenderingContext.REPEAT,
          };
          this._gpuLinearSampler = {
            glMinFilter: 0x2601,
            // WebGLRenderingContext.LINEAR;
            glMagFilter: 0x2601,
            // WebGLRenderingContext.LINEAR;
            glWrapS: 0x2901,
            // WebGLRenderingContext.REPEAT,
            glWrapT: 0x2901,
            // WebGLRenderingContext.REPEAT,
            glWrapR: 0x2901 // WebGLRenderingContext.REPEAT,
          };
          this._uniformBuffer = new Float32Array(8);
          this._gpuUniformBuffer = {
            usage: BufferUsageBit.UNIFORM,
            memUsage: MemoryUsageBit.DEVICE,
            size: 8 * Float32Array.BYTES_PER_ELEMENT,
            stride: 8 * Float32Array.BYTES_PER_ELEMENT,
            buffer: this._uniformBuffer,
            vf32: null,
            indirects: new WebGLIndirectDrawInfos(),
            glTarget: 0,
            glBuffer: null
          };
          WebGLCmdFuncCreateBuffer(WebGLDeviceManager.instance, this._gpuUniformBuffer);
          WebGLDeviceManager.instance.memoryStatus.bufferSize += this._gpuUniformBuffer.size;
          this._gpuDescriptorSet = {
            gpuDescriptors: [{
              type: DescriptorType.UNIFORM_BUFFER,
              gpuBuffer: this._gpuUniformBuffer,
              gpuTexture: null,
              gpuSampler: null
            }, {
              type: DescriptorType.SAMPLER_TEXTURE,
              gpuBuffer: null,
              gpuTexture: null,
              gpuSampler: null
            }],
            descriptorIndices: this._gpuDescriptorSetLayout.descriptorIndices
          };
          this._drawInfo = new DrawInfo(4, 0, 0, 0, 0, 0, 0);
          this._glFramebuffer = WebGLDeviceManager.instance.gl.createFramebuffer();
        }
        destroy() {
          if (this._glFramebuffer) {
            WebGLDeviceManager.instance.gl.deleteFramebuffer(this._glFramebuffer);
            this._glFramebuffer = null;
          }
          if (this._gpuVertexBuffer) {
            WebGLDeviceManager.instance.memoryStatus.bufferSize -= this._gpuVertexBuffer.size;
            WebGLCmdFuncDestroyBuffer(WebGLDeviceManager.instance, this._gpuVertexBuffer);
          }
          if (this._gpuUniformBuffer) {
            WebGLDeviceManager.instance.memoryStatus.bufferSize -= this._gpuUniformBuffer.size;
            WebGLCmdFuncDestroyBuffer(WebGLDeviceManager.instance, this._gpuUniformBuffer);
          }
          if (this._gpuShader) {
            WebGLCmdFuncDestroyShader(WebGLDeviceManager.instance, this._gpuShader);
          }
          if (this._gpuInputAssembler) {
            WebGLCmdFuncDestroyInputAssembler(WebGLDeviceManager.instance, this._gpuInputAssembler);
          }
        }
        draw(gpuTextureSrc, gpuTextureDst, regions, filter) {
          const device = WebGLDeviceManager.instance;
          const {
            gl
          } = device;
          const stateCache = device.stateCache;
          const origFramebuffer = stateCache.glFramebuffer;
          gl.viewport(0, 0, gpuTextureDst.width, gpuTextureDst.height);
          gl.scissor(0, 0, gpuTextureDst.width, gpuTextureDst.height);
          if (!this._uniformBuffer || !this._gpuUniformBuffer || !this._gpuPipelineState || !this._gpuInputAssembler || !this._gpuDescriptorSet || !this._drawInfo) {
            return;
          }
          const descriptor = this._gpuDescriptorSet.gpuDescriptors[1];
          descriptor.gpuTexture = gpuTextureSrc;
          descriptor.gpuSampler = filter === Filter.POINT ? this._gpuPointSampler : this._gpuLinearSampler;
          const formatInfo = FormatInfos[gpuTextureDst.format];
          let attachment = WebGLConstants.COLOR_ATTACHMENT0;
          if (formatInfo.hasStencil) {
            attachment = WebGLConstants.DEPTH_STENCIL_ATTACHMENT;
          } else if (formatInfo.hasDepth) {
            attachment = WebGLConstants.DEPTH_ATTACHMENT;
          }
          const regionIndices = regions.map((_, i) => i);
          regionIndices.sort((a, b) => regions[a].srcSubres.mipLevel - regions[b].srcSubres.mipLevel);
          if (stateCache.glFramebuffer !== this._glFramebuffer) {
            gl.bindFramebuffer(WebGLConstants.FRAMEBUFFER, this._glFramebuffer);
            stateCache.glFramebuffer = this._glFramebuffer;
          }
          let mipLevel = regions[0].dstSubres.mipLevel;
          if (gpuTextureDst.glTexture) {
            gl.framebufferTexture2D(WebGLConstants.FRAMEBUFFER, attachment, gpuTextureDst.glTarget, gpuTextureDst.glTexture, mipLevel);
          } else {
            gl.framebufferRenderbuffer(WebGLConstants.FRAMEBUFFER, attachment, WebGLConstants.RENDERBUFFER, gpuTextureDst.glRenderbuffer);
          }
          for (let i = 0; i < regionIndices.length; ++i) {
            const region = regions[regionIndices[i]];
            if (gpuTextureSrc.glTexture && mipLevel !== region.srcSubres.mipLevel) {
              mipLevel = region.srcSubres.mipLevel;
              gl.framebufferTexture2D(WebGLConstants.FRAMEBUFFER, attachment, gpuTextureDst.glTarget, gpuTextureDst.glTexture, mipLevel);
            }
            const srcWidth = gpuTextureSrc.width;
            const srcHeight = gpuTextureSrc.height;
            const dstWidth = gpuTextureDst.width;
            const dstHeight = gpuTextureDst.height;
            this._uniformBuffer[0] = region.srcExtent.width / srcWidth;
            this._uniformBuffer[1] = region.srcExtent.height / srcHeight;
            this._uniformBuffer[2] = region.srcOffset.x / srcWidth;
            this._uniformBuffer[3] = region.srcOffset.y / srcHeight;
            this._uniformBuffer[4] = region.dstExtent.width / dstWidth;
            this._uniformBuffer[5] = region.dstExtent.height / dstHeight;
            this._uniformBuffer[6] = region.dstOffset.x / dstWidth;
            this._uniformBuffer[7] = region.dstOffset.y / dstHeight;
            WebGLCmdFuncUpdateBuffer(device, this._gpuUniformBuffer, this._uniformBuffer, 0, this._uniformBuffer.length * Float32Array.BYTES_PER_ELEMENT);
            WebGLCmdFuncBindStates(device, this._gpuPipelineState, this._gpuInputAssembler, [this._gpuDescriptorSet], [], null);
            WebGLCmdFuncDraw(device, this._drawInfo);
          }

          // restore fbo
          if (stateCache.glFramebuffer !== origFramebuffer) {
            gl.bindFramebuffer(WebGLConstants.FRAMEBUFFER, origFramebuffer);
            stateCache.glFramebuffer = origFramebuffer;
          }
          // restore viewport
          const origViewport = stateCache.viewport;
          gl.viewport(origViewport.left, origViewport.top, origViewport.width, origViewport.height);
          // restore scissor
          const origScissor = stateCache.scissorRect;
          gl.scissor(origScissor.x, origScissor.y, origScissor.width, origScissor.height);
        }
      });
    }
  };
});