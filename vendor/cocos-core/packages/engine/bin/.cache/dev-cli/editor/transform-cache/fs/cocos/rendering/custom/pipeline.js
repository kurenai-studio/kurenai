System.register("q-bundled:///fs/cocos/rendering/custom/pipeline.js", [], function (_export, _context) {
  "use strict";

  var PipelineCapabilities, PipelineType, SubpassCapabilities;
  _export("PipelineCapabilities", void 0);
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com
      
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
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       * The following section is auto-generated.
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       */
      /* eslint-disable max-len */
      /**
       * @engineInternal
       * @en PipelineRuntime is the runtime of both classical and custom pipelines.
       * It is used internally and should not be called directly.
       * @zh PipelineRuntime是经典管线以及自定义管线的运行时。
       * 属于内部实现，用户不应直接调用。
       */
      /**
       * @en Type of render pipeline.
       * Different types of pipeline have different hardward capabilities and interfaces.
       * @zh 管线类型，不同类型的管线具有不同的硬件能力与接口
       */
      _export("PipelineType", PipelineType = /*#__PURE__*/function (PipelineType) {
        /**
         * @en Basic render pipeline.
         * Basic render pipeline is available on all platforms.
         * The corresponding interface is {@link BasicPipeline}
         * @zh 基础渲染管线，全平台支持。对应接口为 {@link BasicPipeline}
         */
        PipelineType[PipelineType["BASIC"] = 0] = "BASIC";
        /**
         * @en Standard render pipeline.
         * Standard render pipeline supports compute shader and subpass rendering.
         * It works well on Tile-based GPUs and is available on all native platforms.
         * Vulkan, GLES3 and Metal backends are supported.
         * The corresponding interface is {@link Pipeline}
         * @zh 标准渲染管线.
         * 标准渲染管线支持计算着色器(Compute Shader)与次通道渲染(Subpass rendering)。
         * 能充分利用Tile-based GPU，支持所有原生平台并对移动平台特别优化。
         * 支持Vulkan、GLES3、Metal图形后端。
         * 对应接口为{@link Pipeline}
         */
        PipelineType[PipelineType["STANDARD"] = 1] = "STANDARD";
        return PipelineType;
      }({}));
      /**
       * @en Render subpass capabilities.
       * Tile-based GPUs support reading color or depth_stencil attachment in pixel shader.
       * Our implementation is based-on Vulkan abstraction (aka input attachment),
       * and it is emulated on other graphics backends.
       * For example, in GLES3 we have used various framebuffer fetch (FBF) extensions.
       * As a result, different backends and hardwares support different input attachment features.
       * User should inspect pipeline capabilities when implementing tile-based rendering algorithms.
       * Using unsupported feature is undefined behaviour.
       * @zh 次通道渲染能力
       * Tile-based GPU可以在像素着色器读取当前像素的值。
       * 我们的抽象方式基于Vulkan的input attachment，并在其他图形后端模拟了这个功能。
       * 比如在GLES3上，我们使用了多种framebuffer fetch (FBF) 扩展来实现这个功能。
       * 所以对于不同的硬件以及图形API，支持的能力是略有不同的。
       * 在编写渲染算法时，应该查询当前设备的能力，来选择合适的tile-based算法。
       * 使用硬件不支持的特性，会导致未定义行为。
       */
      _export("SubpassCapabilities", SubpassCapabilities = /*#__PURE__*/function (SubpassCapabilities) {
        SubpassCapabilities[SubpassCapabilities["NONE"] = 0] = "NONE";
        /**
         * @en Supports read depth/stencil value at current pixel.
         * @zh 支持读取当前像素的depth/stencil值
         */
        SubpassCapabilities[SubpassCapabilities["INPUT_DEPTH_STENCIL"] = 1] = "INPUT_DEPTH_STENCIL";
        /**
         * @en Supports read color value 0 at current pixel.
         * @zh 支持读取当前像素第0个颜色值
         */
        SubpassCapabilities[SubpassCapabilities["INPUT_COLOR"] = 2] = "INPUT_COLOR";
        /**
         * @en Supports read color values at current pixel.
         * @zh 支持读取当前像素任意颜色值
         */
        SubpassCapabilities[SubpassCapabilities["INPUT_COLOR_MRT"] = 4] = "INPUT_COLOR_MRT";
        /**
         * @en Each subpass has its own sample count.
         * @zh 每个Subpass拥有不同的采样数
         */
        SubpassCapabilities[SubpassCapabilities["HETEROGENEOUS_SAMPLE_COUNT"] = 8] = "HETEROGENEOUS_SAMPLE_COUNT";
        return SubpassCapabilities;
      }({}));
      /**
       * @en Pipeline capabilities.
       * The following capabilities are partially supported on different hardware and graphics backends.
       * @zh 管线能力。根据硬件与后端，支持的特性会有所不同
       */
      _export("PipelineCapabilities", PipelineCapabilities = class PipelineCapabilities {
        constructor() {
          this.subpass = SubpassCapabilities.NONE;
        }
      });
      /**
       * @en Base class of render graph node.
       * A node of render graph represents a specific type of rendering operation.
       * A render graph consists of these nodes and form a forest(which is a set of trees).
       * @zh RenderGraph中节点的基类，每个RenderGraph节点代表一种渲染操作，并构成一个森林(一组树)
       */
      /**
       * @en Render node which supports setting uniforms and descriptors.
       * @zh 节点支持设置常量值(uniform/constant)与描述符
       */
      /**
       * @en Scene
       * A scene is an abstraction of content for rendering.
       * @zh 场景。需要绘制的场景内容。
       */
      /**
       * @en Render queue
       * A render queue is an abstraction of graphics commands submission.
       * Only when the graphics commands in a render queue are all submitted,
       * the next render queue will start submitting.
       * @zh 渲染队列。渲染队列是图形命令提交的抽象。
       * 只有一个渲染队列中的渲染命令全部提交完，才会开始提交下一个渲染队列中的命令。
       */
      /**
       * @en Basic render pass.
       * @zh 基础光栅通道
       */
      /**
       * @en Basic multisample render pass builder
       * Support resolve render targets and depth stencil.
       * This render pass only contains one render subpass.
       * If resolve targets are specified, they will be resolved at the end of the render pass.
       * After resolving, the contents of multisample render targets and depth stencils are unspecified.
       * @zh 基础的多重采样渲染通道。支持决算(Resolve)渲染目标与深度缓冲。
       * 此渲染通道只包含一个渲染子通道。
       * 如果添加了决算对象，那么在渲染通道结束时，会进行决算。
       * 决算后多重采样渲染目标与深度缓冲的内容是未定义的。
       */
      /**
       * @en BasicPipeline
       * Basic pipeline provides basic rendering features which are supported on all platforms.
       * User can register resources which will be used in the render graph.
       * Theses resources are generally read and write, and will be managed by the pipeline.
       * The residency information of resource should not be changed after registration.
       * In each frame, user can create a render graph to be executed by the pipeline.
       * @zh 基础渲染管线。
       * 基础渲染管线提供基础的渲染能力，能在全平台使用。
       * 用户可以在渲染管线中注册资源，这些资源将由管线托管，用于render graph。
       * 这些资源一般是可读写的资源。
       * 资源在注册后，不能更改驻留属性。
       * 用户可以每帧构建一个render graph，然后交由管线执行。
       */
      /**
       * @beta Feature is under development
       * @en Render subpass
       * @zh 渲染次通道
       */
      /**
       * @beta Feature is under development
       * @en Multisample render subpass
       * @zh 多重采样渲染次通道
       */
      /**
       * @en Compute queue
       * @zh 计算队列
       */
      /**
       * @beta Feature is under development
       * @en Compute subpass
       * @zh 计算次通道
       */
      /**
       * @beta Feature is under development
       * @en Render pass
       * @zh 渲染通道
       */
      /**
       * @en Multisample render pass builder
       * @zh 多重采样渲染通道。
       */
      /**
       * @en Compute pass
       * @zh 计算通道
       */
      /**
       * @en Render pipeline.
       * @zh 渲染管线
       */
      /**
       * @en Pipeline builder.
       * User can implement this interface and setup render graph.
       * Call setCustomPipeline to register the pipeline builder
       * @zh 管线构造器
       * 用户可以实现这个接口，来构建自己想要的render graph。
       * 调用setCustomPipeline注册管线
       */
      /**
       * @engineInternal
       */
    }
  };
});