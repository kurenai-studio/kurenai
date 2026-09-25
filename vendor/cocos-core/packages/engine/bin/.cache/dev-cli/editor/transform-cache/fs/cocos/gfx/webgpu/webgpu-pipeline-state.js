System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-pipeline-state.js", ["../base/pipeline-state.js", "../base/define.js", "./webgpu-commands.js", "./define.js"], function (_export, _context) {
  "use strict";

  var PipelineState, BlendOp, CullMode, Format, FormatInfos, PipelineBindPoint, PrimitiveMode, ShaderStageFlagBit, GFXFormatToWGPUFormat, WebGPUBlendFactors, WebGPUBlendOps, WebGPUCompereFunc, WebGPUStencilOp, GFXFormatToWGPUVertexFormat, WebGPUBlendMask, WebGPUDeviceManager, WebGPUPipelineState, WebPUPrimitives;
  _export("WebGPUPipelineState", void 0);
  return {
    setters: [function (_basePipelineStateJs) {
      PipelineState = _basePipelineStateJs.PipelineState;
    }, function (_baseDefineJs) {
      BlendOp = _baseDefineJs.BlendOp;
      CullMode = _baseDefineJs.CullMode;
      Format = _baseDefineJs.Format;
      FormatInfos = _baseDefineJs.FormatInfos;
      PipelineBindPoint = _baseDefineJs.PipelineBindPoint;
      PrimitiveMode = _baseDefineJs.PrimitiveMode;
      ShaderStageFlagBit = _baseDefineJs.ShaderStageFlagBit;
    }, function (_webgpuCommandsJs) {
      GFXFormatToWGPUFormat = _webgpuCommandsJs.GFXFormatToWGPUFormat;
      WebGPUBlendFactors = _webgpuCommandsJs.WebGPUBlendFactors;
      WebGPUBlendOps = _webgpuCommandsJs.WebGPUBlendOps;
      WebGPUCompereFunc = _webgpuCommandsJs.WebGPUCompereFunc;
      WebGPUStencilOp = _webgpuCommandsJs.WebGPUStencilOp;
      GFXFormatToWGPUVertexFormat = _webgpuCommandsJs.GFXFormatToWGPUVertexFormat;
      WebGPUBlendMask = _webgpuCommandsJs.WebGPUBlendMask;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      WebPUPrimitives = ['point-list', 'line-list', 'line-strip', 'line-strip',
      // no line_loop in webgpu
      'line-list', 'line-strip', 'line-list', 'triangle-list', 'triangle-strip', 'triangle-strip', 'triangle-list', 'triangle-strip', 'triangle-strip', 'triangle-strip' // no quad
      ];
      _export("WebGPUPipelineState", WebGPUPipelineState = class WebGPUPipelineState extends PipelineState {
        constructor(...args) {
          super(...args);
          this._gpuPipelineState = null;
          this._locations = new Map();
        }
        get gpuPipelineState() {
          return this._gpuPipelineState;
        }
        initialize(info) {
          this._primitive = info.primitive;
          this._shader = info.shader;
          this._pipelineLayout = info.pipelineLayout;
          this._rs = info.rasterizerState;
          this._dss = info.depthStencilState;
          this._bs = info.blendState;
          this._is = info.inputState;
          this._renderPass = info.renderPass;
          this._dynamicStates = info.dynamicStates;
          const dynamicStates = [];
          for (let i = 0; i < 31; i++) {
            if (this._dynamicStates & 1 << i) {
              dynamicStates.push(1 << i);
            }
          }
          const gpuShader = info.shader;
          const pipelineLayoutObj = info.pipelineLayout;
          const shaderStages = gpuShader.gpuShader.gpuStages;
          if (info.bindPoint === PipelineBindPoint.COMPUTE) {
            // ---- Compute Pipeline ----
            let computeStage;
            const stageSize = shaderStages.length;
            for (let i = 0; i < stageSize; i++) {
              if (shaderStages[i].type === ShaderStageFlagBit.COMPUTE) {
                computeStage = shaderStages[i].gpuShader;
              }
            }
            const computeDesc = {
              layout: pipelineLayoutObj.gpuPipelineLayout.nativePipelineLayout,
              compute: computeStage
            };
            this._gpuPipelineState = {
              gpuPrimitive: 'triangle-list',
              gpuShader: gpuShader.gpuShader,
              gpuPipelineLayout: pipelineLayoutObj.gpuPipelineLayout,
              rs: info.rasterizerState,
              dss: info.depthStencilState,
              stencilRef: 0,
              bs: info.blendState,
              gpuRenderPass: null,
              dynamicStates,
              pipelineState: computeDesc,
              nativePipeline: undefined
            };
          } else {
            var _this$_renderPass$dep;
            // ---- Render Pipeline ----
            // colorstates
            const colorAttachments = this._renderPass.colorAttachments;
            const colorDescs = [];
            const colAttachmentSize = colorAttachments.length;
            for (let i = 0; i < colAttachmentSize; i++) {
              const colDesc = {
                format: GFXFormatToWGPUFormat(colorAttachments[i].format),
                writeMask: WebGPUBlendMask(this._bs.targets[i].blendColorMask)
              };
              if (this._bs.targets[i].blend) {
                colDesc.blend = {
                  color: {
                    dstFactor: WebGPUBlendFactors[this._bs.targets[i].blendDst],
                    operation: WebGPUBlendOps[this._bs.targets[i].blendEq === BlendOp.MAX ? BlendOp.ADD : this._bs.targets[i].blendEq],
                    srcFactor: WebGPUBlendFactors[this._bs.targets[i].blendSrc]
                  },
                  alpha: {
                    dstFactor: WebGPUBlendFactors[this._bs.targets[i].blendDstAlpha],
                    operation: WebGPUBlendOps[this._bs.targets[i].blendAlphaEq === BlendOp.MAX ? BlendOp.ADD : this._bs.targets[i].blendAlphaEq],
                    srcFactor: WebGPUBlendFactors[this._bs.targets[i].blendSrcAlpha]
                  }
                };
              }
              colorDescs.push(colDesc);
            }
            let vertexStage;
            let fragmentStage;
            const stageSize = shaderStages.length;
            for (let i = 0; i < stageSize; i++) {
              if (shaderStages[i].type === ShaderStageFlagBit.VERTEX) {
                vertexStage = shaderStages[i].gpuShader;
              }
              if (shaderStages[i].type === ShaderStageFlagBit.FRAGMENT) {
                fragmentStage = shaderStages[i].gpuShader;
              }
            }
            const shaderAttrs = gpuShader.attributes;
            const attrsSize = shaderAttrs.length;
            for (let i = 0; i < attrsSize; i++) {
              this._locations.set(shaderAttrs[i].name, shaderAttrs[i].location);
            }
            const stripTopology = info.primitive === PrimitiveMode.LINE_STRIP || info.primitive === PrimitiveMode.TRIANGLE_STRIP;
            const renderPplDesc = {
              layout: pipelineLayoutObj.gpuPipelineLayout.nativePipelineLayout,
              vertex: {
                module: vertexStage.module,
                entryPoint: 'main',
                buffers: []
              },
              primitive: {
                topology: WebPUPrimitives[info.primitive],
                frontFace: this._rs.isFrontFaceCCW ? 'ccw' : 'cw',
                cullMode: this._rs.cullMode === CullMode.NONE ? 'none' : this._rs.cullMode === CullMode.FRONT ? 'front' : 'back'
              },
              fragment: {
                module: fragmentStage.module,
                entryPoint: 'main',
                targets: colorDescs
              }
            };
            if (stripTopology) renderPplDesc.primitive.stripIndexFormat = 'uint16';

            // depthstencil states
            let stencilRef = 0;
            if (((_this$_renderPass$dep = this._renderPass.depthStencilAttachment) == null ? void 0 : _this$_renderPass$dep.format) !== Format.UNKNOWN) {
              const dssDesc = {};
              dssDesc.format = GFXFormatToWGPUFormat(this._renderPass.depthStencilAttachment.format);
              dssDesc.depthWriteEnabled = this._dss.depthWrite;
              dssDesc.depthCompare = this._dss.depthTest ? WebGPUCompereFunc[this._dss.depthFunc] : 'always';
              let stencilReadMask = 0;
              let stencilWriteMask = 0;
              if (this._dss.stencilTestFront) {
                dssDesc.stencilFront = {
                  compare: WebGPUCompereFunc[this._dss.stencilFuncFront],
                  depthFailOp: WebGPUStencilOp[this._dss.stencilZFailOpFront],
                  passOp: WebGPUStencilOp[this._dss.stencilPassOpFront],
                  failOp: WebGPUStencilOp[this._dss.stencilFailOpFront]
                };
                stencilReadMask |= this._dss.stencilReadMaskFront;
                stencilWriteMask |= this._dss.stencilWriteMaskFront;
                stencilRef |= this._dss.stencilRefFront;
              }
              if (this._dss.stencilTestBack) {
                dssDesc.stencilBack = {
                  compare: WebGPUCompereFunc[this._dss.stencilFuncBack],
                  depthFailOp: WebGPUStencilOp[this._dss.stencilZFailOpBack],
                  passOp: WebGPUStencilOp[this._dss.stencilPassOpBack],
                  failOp: WebGPUStencilOp[this._dss.stencilFailOpBack]
                };
                stencilReadMask |= this._dss.stencilReadMaskBack;
                stencilWriteMask |= this._dss.stencilWriteMaskBack;
                stencilRef |= this._dss.stencilRefBack;
              }
              dssDesc.stencilReadMask = stencilReadMask;
              dssDesc.stencilWriteMask = stencilWriteMask;
              dssDesc.depthBias = this._rs.depthBias;
              dssDesc.depthBiasSlopeScale = this._rs.depthBiasSlop;
              dssDesc.depthBiasClamp = this._rs.depthBiasClamp;
              renderPplDesc.depthStencil = dssDesc;
            }
            this._gpuPipelineState = {
              gpuPrimitive: WebPUPrimitives[info.primitive],
              gpuShader: gpuShader.gpuShader,
              gpuPipelineLayout: pipelineLayoutObj.gpuPipelineLayout,
              rs: info.rasterizerState,
              dss: info.depthStencilState,
              stencilRef,
              bs: info.blendState,
              gpuRenderPass: info.renderPass.gpuRenderPass,
              dynamicStates,
              pipelineState: renderPplDesc,
              nativePipeline: undefined
            };
          }
        }
        _getShaderLocation(name) {
          return this._locations.get(name);
        }
        updatePipelineLayout() {
          if (this._gpuPipelineState && this._gpuPipelineState.pipelineState) {
            this._gpuPipelineState.pipelineState.layout = this._pipelineLayout.gpuPipelineLayout.nativePipelineLayout;
          }
        }
        prepare(ia, forceUpdate = false) {
          if (this._gpuPipelineState.nativePipeline && !forceUpdate) {
            return;
          }
          const webgpuDevice = WebGPUDeviceManager.instance;
          const nativeDevice = webgpuDevice.nativeDevice;
          const pipelineState = this._gpuPipelineState.pipelineState;
          // Compute pipeline: no vertex attributes, no multisample
          if ('compute' in pipelineState) {
            const nativePipeline = nativeDevice == null ? void 0 : nativeDevice.createComputePipeline(pipelineState);
            this._gpuPipelineState.nativePipeline = nativePipeline;
            return;
          }

          // Render pipeline
          const gpuShader = this.shader;
          const shaderAttrs = gpuShader.attributes;
          const vertexAttrs = [];
          const emptyPushAttr = [];
          const streamCount = ia.gpuVertexBuffers.length;
          for (let i = 0; i < streamCount; i++) {
            const currBufferLayout = {
              arrayStride: 0,
              attributes: []
            };
            const currAttrs = [];
            const shaderAttrSize = shaderAttrs.length;
            for (let j = 0; j < shaderAttrSize; j++) {
              const shaderAttr = shaderAttrs[j];
              let hasAttr = false;
              const gpuAttrSize = ia.gpuAttribs.length;
              for (let k = 0; k < gpuAttrSize; k++) {
                const gpuAttr = ia.gpuAttribs[k];
                const attr = ia.attributes[k];
                if (attr.name === shaderAttr.name) {
                  hasAttr = true;
                  const loc = shaderAttr.location;
                  if (attr.stream === i) {
                    currBufferLayout.arrayStride = gpuAttr.stride;
                    currBufferLayout.stepMode = attr.isInstanced ? 'instance' : 'vertex';
                    const attrLayout = {
                      format: GFXFormatToWGPUVertexFormat(attr.format),
                      offset: gpuAttr.offset,
                      shaderLocation: loc
                    };
                    currAttrs.push(attrLayout);
                  }
                  break;
                }
              }
              const format = shaderAttr.format;
              if (!hasAttr && !emptyPushAttr.includes(shaderAttr.name) && FormatInfos[format].size <= ia.gpuVertexBuffers[i].stride) {
                emptyPushAttr.push(shaderAttr.name);
                const attrLayout = {
                  format: GFXFormatToWGPUVertexFormat(format),
                  offset: 0,
                  shaderLocation: shaderAttr.location
                };
                currAttrs.push(attrLayout);
              }
            }
            if (currAttrs.length) {
              currBufferLayout.attributes = currAttrs;
              vertexAttrs.push(currBufferLayout);
            }
          }
          pipelineState.vertex.buffers = vertexAttrs;
          pipelineState.multisample = {
            count: ia.samples
          };
          const nativePipeline = nativeDevice == null ? void 0 : nativeDevice.createRenderPipeline(pipelineState);
          this._gpuPipelineState.nativePipeline = nativePipeline;
        }
        destroy() {
          this._gpuPipelineState = null;
        }
      });
    }
  };
});