System.register("q-bundled:///fs/cocos/rendering/custom/layout-graph.js", ["../../../../virtual/internal%253Aconstants.js", "./graph.js", "../../gfx/index.js", "./types.js", "../../core/memop/index.js", "./serialization.js"], function (_export, _context) {
  "use strict";

  var COCOS_RUNTIME, HTML5, AdjI, ED, InEI, OutE, OutEI, findRelative, getPath, DescriptorSetLayoutInfo, Format, MemoryAccessBit, SampleType, ShaderStageFlagBit, Type, UniformBlock, ViewDimension, ParameterType, UpdateFrequency, RecyclePool, saveUniformBlock, loadUniformBlock, saveDescriptorSetLayoutInfo, loadDescriptorSetLayoutInfo, Layout, Descriptor, DescriptorBlock, DescriptorBlockFlattened, DescriptorBlockIndex, DescriptorGroupBlockIndex, DescriptorDB, RenderPhase, LayoutGraphVertex, LayoutGraph, UniformData, UniformBlockData, DescriptorData, DescriptorBlockData, DescriptorSetLayoutData, DescriptorSetData, PipelineLayoutData, ShaderBindingData, ShaderLayoutData, TechniqueData, EffectData, ShaderProgramData, RenderStageData, RenderPhaseData, LayoutGraphDataVertex, LayoutGraphData, LayoutGraphObjectPool, LayoutType, DescriptorTypeOrder, RenderPassType, LayoutGraphValue, LayoutGraphComponent, LayoutGraphDataValue, LayoutGraphDataComponent;
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

  function resetDescriptorSetLayoutInfo(info) {
    info.bindings.length = 0;
  }
  function getLayoutGraphValueName(e) {
    switch (e) {
      case LayoutGraphValue.RenderStage:
        return 'RenderStage';
      case LayoutGraphValue.RenderPhase:
        return 'RenderPhase';
      default:
        return '';
    }
  }
  function getLayoutGraphDataValueName(e) {
    switch (e) {
      case LayoutGraphDataValue.RenderStage:
        return 'RenderStage';
      case LayoutGraphDataValue.RenderPhase:
        return 'RenderPhase';
      default:
        return '';
    }
  }
  function createPool(Constructor) {
    return new RecyclePool(() => new Constructor(), 16);
  }
  function saveDescriptor(a, v) {
    a.n(v.type);
    a.n(v.count);
  }
  function loadDescriptor(a, v) {
    v.type = a.n();
    v.count = a.n();
  }
  function saveDescriptorBlock(a, v) {
    a.n(v.descriptors.size); // Map<string, Descriptor>
    for (const [k1, v1] of v.descriptors) {
      a.s(k1);
      saveDescriptor(a, v1);
    }
    a.n(v.uniformBlocks.size); // Map<string, UniformBlock>
    for (const [k1, v1] of v.uniformBlocks) {
      a.s(k1);
      saveUniformBlock(a, v1);
    }
    a.n(v.capacity);
    a.n(v.count);
  }
  function loadDescriptorBlock(a, v) {
    let sz = 0;
    sz = a.n(); // Map<string, Descriptor>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = new Descriptor();
      loadDescriptor(a, v1);
      v.descriptors.set(k1, v1);
    }
    sz = a.n(); // Map<string, UniformBlock>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = new UniformBlock();
      loadUniformBlock(a, v1);
      v.uniformBlocks.set(k1, v1);
    }
    v.capacity = a.n();
    v.count = a.n();
  }
  function saveDescriptorBlockFlattened(a, v) {
    a.n(v.descriptorNames.length); // string[]
    for (const v1 of v.descriptorNames) {
      a.s(v1);
    }
    a.n(v.uniformBlockNames.length); // string[]
    for (const v1 of v.uniformBlockNames) {
      a.s(v1);
    }
    a.n(v.descriptors.length); // Descriptor[]
    for (const v1 of v.descriptors) {
      saveDescriptor(a, v1);
    }
    a.n(v.uniformBlocks.length); // UniformBlock[]
    for (const v1 of v.uniformBlocks) {
      saveUniformBlock(a, v1);
    }
    a.n(v.capacity);
    a.n(v.count);
  }
  function loadDescriptorBlockFlattened(a, v) {
    let sz = 0;
    sz = a.n(); // string[]
    v.descriptorNames.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      v.descriptorNames[i1] = a.s();
    }
    sz = a.n(); // string[]
    v.uniformBlockNames.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      v.uniformBlockNames[i1] = a.s();
    }
    sz = a.n(); // Descriptor[]
    v.descriptors.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new Descriptor();
      loadDescriptor(a, v1);
      v.descriptors[i1] = v1;
    }
    sz = a.n(); // UniformBlock[]
    v.uniformBlocks.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new UniformBlock();
      loadUniformBlock(a, v1);
      v.uniformBlocks[i1] = v1;
    }
    v.capacity = a.n();
    v.count = a.n();
  }
  function saveDescriptorBlockIndex(a, v) {
    a.n(v.updateFrequency);
    a.n(v.parameterType);
    a.n(v.descriptorType);
    a.n(v.visibility);
  }
  function loadDescriptorBlockIndex(a, v) {
    v.updateFrequency = a.n();
    v.parameterType = a.n();
    v.descriptorType = a.n();
    v.visibility = a.n();
  }
  function saveDescriptorGroupBlockIndex(a, v) {
    a.n(v.updateFrequency);
    a.n(v.parameterType);
    a.n(v.descriptorType);
    a.n(v.visibility);
    a.n(v.accessType);
    a.n(v.viewDimension);
    a.n(v.sampleType);
    a.n(v.format);
  }
  function loadDescriptorGroupBlockIndex(a, v) {
    v.updateFrequency = a.n();
    v.parameterType = a.n();
    v.descriptorType = a.n();
    v.visibility = a.n();
    v.accessType = a.n();
    v.viewDimension = a.n();
    v.sampleType = a.n();
    v.format = a.n();
  }
  function saveDescriptorDB(a, v) {
    a.n(v.blocks.size); // Map<string, DescriptorBlock>
    for (const [k1, v1] of v.blocks) {
      saveDescriptorBlockIndex(a, JSON.parse(k1));
      saveDescriptorBlock(a, v1);
    }
    a.n(v.groupBlocks.size); // Map<string, DescriptorBlock>
    for (const [k1, v1] of v.groupBlocks) {
      saveDescriptorGroupBlockIndex(a, JSON.parse(k1));
      saveDescriptorBlock(a, v1);
    }
  }
  function loadDescriptorDB(a, v) {
    let sz = 0;
    sz = a.n(); // Map<string, DescriptorBlock>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = new DescriptorBlockIndex();
      loadDescriptorBlockIndex(a, k1);
      const v1 = new DescriptorBlock();
      loadDescriptorBlock(a, v1);
      v.blocks.set(JSON.stringify(k1), v1);
    }
    sz = a.n(); // Map<string, DescriptorBlock>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = new DescriptorGroupBlockIndex();
      loadDescriptorGroupBlockIndex(a, k1);
      const v1 = new DescriptorBlock();
      loadDescriptorBlock(a, v1);
      v.groupBlocks.set(JSON.stringify(k1), v1);
    }
  }
  function saveRenderPhase(a, v) {
    a.n(v.shaders.size); // Set<string>
    for (const v1 of v.shaders) {
      a.s(v1);
    }
  }
  function loadRenderPhase(a, v) {
    let sz = 0;
    sz = a.n(); // Set<string>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = a.s();
      v.shaders.add(v1);
    }
  }
  function saveLayoutGraph(a, g) {
    const numVertices = g.nv();
    const numEdges = g.ne();
    a.n(numVertices);
    a.n(numEdges);
    let numStages = 0;
    let numPhases = 0;
    for (const v of g.v()) {
      switch (g.w(v)) {
        case LayoutGraphValue.RenderStage:
          numStages += 1;
          break;
        case LayoutGraphValue.RenderPhase:
          numPhases += 1;
          break;
        default:
          break;
      }
    }
    a.n(numStages);
    a.n(numPhases);
    for (const v of g.v()) {
      a.n(g.w(v));
      a.n(g.getParent(v));
      a.s(g.getName(v));
      saveDescriptorDB(a, g.getDescriptors(v));
      switch (g.w(v)) {
        case LayoutGraphValue.RenderStage:
          a.n(g.x[v].j);
          break;
        case LayoutGraphValue.RenderPhase:
          saveRenderPhase(a, g.x[v].j);
          break;
        default:
          break;
      }
    }
  }
  function loadLayoutGraph(a, g) {
    const numVertices = a.n();
    const numEdges = a.n();
    const numStages = a.n();
    const numPhases = a.n();
    for (let v = 0; v !== numVertices; ++v) {
      const id = a.n();
      const u = a.n();
      const name = a.s();
      const descriptors = new DescriptorDB();
      loadDescriptorDB(a, descriptors);
      switch (id) {
        case LayoutGraphValue.RenderStage:
          {
            const renderStage = a.n();
            g.addVertex(LayoutGraphValue.RenderStage, renderStage, name, descriptors, u);
            break;
          }
        case LayoutGraphValue.RenderPhase:
          {
            const renderPhase = new RenderPhase();
            loadRenderPhase(a, renderPhase);
            g.addVertex(LayoutGraphValue.RenderPhase, renderPhase, name, descriptors, u);
            break;
          }
        default:
          break;
      }
    }
  }
  function saveUniformData(a, v) {
    a.n(v.uniformID);
    a.n(v.uniformType);
    a.n(v.offset);
    a.n(v.size);
  }
  function loadUniformData(a, v) {
    v.uniformID = a.n();
    v.uniformType = a.n();
    v.offset = a.n();
    v.size = a.n();
  }
  function saveUniformBlockData(a, v) {
    a.n(v.bufferSize);
    a.n(v.uniforms.length); // UniformData[]
    for (const v1 of v.uniforms) {
      saveUniformData(a, v1);
    }
  }
  function loadUniformBlockData(a, v) {
    v.bufferSize = a.n();
    let sz = 0;
    sz = a.n(); // UniformData[]
    v.uniforms.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new UniformData();
      loadUniformData(a, v1);
      v.uniforms[i1] = v1;
    }
  }
  function saveDescriptorData(a, v) {
    a.n(v.descriptorID);
    a.n(v.type);
    a.n(v.count);
  }
  function loadDescriptorData(a, v) {
    v.descriptorID = a.n();
    v.type = a.n();
    v.count = a.n();
  }
  function saveDescriptorBlockData(a, v) {
    a.n(v.type);
    a.n(v.visibility);
    a.n(v.offset);
    a.n(v.capacity);
    a.n(v.accessType);
    a.n(v.viewDimension);
    a.n(v.sampleType);
    a.n(v.format);
    a.n(v.descriptors.length); // DescriptorData[]
    for (const v1 of v.descriptors) {
      saveDescriptorData(a, v1);
    }
  }
  function loadDescriptorBlockData(a, v) {
    v.type = a.n();
    v.visibility = a.n();
    v.offset = a.n();
    v.capacity = a.n();
    v.accessType = a.n();
    v.viewDimension = a.n();
    v.sampleType = a.n();
    v.format = a.n();
    let sz = 0;
    sz = a.n(); // DescriptorData[]
    v.descriptors.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new DescriptorData();
      loadDescriptorData(a, v1);
      v.descriptors[i1] = v1;
    }
  }
  function saveDescriptorSetLayoutData(a, v) {
    a.n(v.slot);
    a.n(v.capacity);
    a.n(v.uniformBlockCapacity);
    a.n(v.samplerTextureCapacity);
    a.n(v.descriptorBlocks.length); // DescriptorBlockData[]
    for (const v1 of v.descriptorBlocks) {
      saveDescriptorBlockData(a, v1);
    }
    a.n(v.uniformBlocks.size); // Map<number, UniformBlock>
    for (const [k1, v1] of v.uniformBlocks) {
      a.n(k1);
      saveUniformBlock(a, v1);
    }
    a.n(v.bindingMap.size); // Map<number, number>
    for (const [k1, v1] of v.bindingMap) {
      a.n(k1);
      a.n(v1);
    }
  }
  function loadDescriptorSetLayoutData(a, v) {
    v.slot = a.n();
    v.capacity = a.n();
    v.uniformBlockCapacity = a.n();
    v.samplerTextureCapacity = a.n();
    let sz = 0;
    sz = a.n(); // DescriptorBlockData[]
    v.descriptorBlocks.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new DescriptorBlockData();
      loadDescriptorBlockData(a, v1);
      v.descriptorBlocks[i1] = v1;
    }
    sz = a.n(); // Map<number, UniformBlock>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = new UniformBlock();
      loadUniformBlock(a, v1);
      v.uniformBlocks.set(k1, v1);
    }
    sz = a.n(); // Map<number, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = a.n();
      v.bindingMap.set(k1, v1);
    }
  }
  function saveDescriptorSetData(a, v) {
    saveDescriptorSetLayoutData(a, v.descriptorSetLayoutData);
    saveDescriptorSetLayoutInfo(a, v.descriptorSetLayoutInfo);
    // skip, v.descriptorSetLayout: DescriptorSetLayout
    // skip, v.descriptorSet: DescriptorSet
  }
  function loadDescriptorSetData(a, v) {
    loadDescriptorSetLayoutData(a, v.descriptorSetLayoutData);
    loadDescriptorSetLayoutInfo(a, v.descriptorSetLayoutInfo);
    // skip, v.descriptorSetLayout: DescriptorSetLayout
    // skip, v.descriptorSet: DescriptorSet
  }
  function savePipelineLayoutData(a, v) {
    a.n(v.descriptorSets.size); // Map<UpdateFrequency, DescriptorSetData>
    for (const [k1, v1] of v.descriptorSets) {
      a.n(k1);
      saveDescriptorSetData(a, v1);
    }
    a.n(v.descriptorGroups.size); // Map<UpdateFrequency, DescriptorSetData>
    for (const [k1, v1] of v.descriptorGroups) {
      a.n(k1);
      saveDescriptorSetData(a, v1);
    }
  }
  function loadPipelineLayoutData(a, v) {
    let sz = 0;
    sz = a.n(); // Map<UpdateFrequency, DescriptorSetData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = new DescriptorSetData();
      loadDescriptorSetData(a, v1);
      v.descriptorSets.set(k1, v1);
    }
    sz = a.n(); // Map<UpdateFrequency, DescriptorSetData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = new DescriptorSetData();
      loadDescriptorSetData(a, v1);
      v.descriptorGroups.set(k1, v1);
    }
  }
  function saveShaderBindingData(a, v) {
    a.n(v.descriptorBindings.size); // Map<number, number>
    for (const [k1, v1] of v.descriptorBindings) {
      a.n(k1);
      a.n(v1);
    }
  }
  function loadShaderBindingData(a, v) {
    let sz = 0;
    sz = a.n(); // Map<number, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = a.n();
      v.descriptorBindings.set(k1, v1);
    }
  }
  function saveShaderLayoutData(a, v) {
    a.n(v.layoutData.size); // Map<UpdateFrequency, DescriptorSetLayoutData>
    for (const [k1, v1] of v.layoutData) {
      a.n(k1);
      saveDescriptorSetLayoutData(a, v1);
    }
    a.n(v.bindingData.size); // Map<UpdateFrequency, ShaderBindingData>
    for (const [k1, v1] of v.bindingData) {
      a.n(k1);
      saveShaderBindingData(a, v1);
    }
  }
  function loadShaderLayoutData(a, v) {
    let sz = 0;
    sz = a.n(); // Map<UpdateFrequency, DescriptorSetLayoutData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = new DescriptorSetLayoutData();
      loadDescriptorSetLayoutData(a, v1);
      v.layoutData.set(k1, v1);
    }
    sz = a.n(); // Map<UpdateFrequency, ShaderBindingData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = new ShaderBindingData();
      loadShaderBindingData(a, v1);
      v.bindingData.set(k1, v1);
    }
  }
  function saveTechniqueData(a, v) {
    a.n(v.passes.length); // ShaderLayoutData[]
    for (const v1 of v.passes) {
      saveShaderLayoutData(a, v1);
    }
  }
  function loadTechniqueData(a, v) {
    let sz = 0;
    sz = a.n(); // ShaderLayoutData[]
    v.passes.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new ShaderLayoutData();
      loadShaderLayoutData(a, v1);
      v.passes[i1] = v1;
    }
  }
  function saveEffectData(a, v) {
    a.n(v.techniques.size); // Map<string, TechniqueData>
    for (const [k1, v1] of v.techniques) {
      a.s(k1);
      saveTechniqueData(a, v1);
    }
  }
  function loadEffectData(a, v) {
    let sz = 0;
    sz = a.n(); // Map<string, TechniqueData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = new TechniqueData();
      loadTechniqueData(a, v1);
      v.techniques.set(k1, v1);
    }
  }
  function saveShaderProgramData(a, v) {
    savePipelineLayoutData(a, v.layout);
    // skip, v.pipelineLayout: PipelineLayout
  }
  function loadShaderProgramData(a, v) {
    loadPipelineLayoutData(a, v.layout);
    // skip, v.pipelineLayout: PipelineLayout
  }
  function saveRenderStageData(a, v) {
    a.n(v.descriptorVisibility.size); // Map<number, ShaderStageFlagBit>
    for (const [k1, v1] of v.descriptorVisibility) {
      a.n(k1);
      a.n(v1);
    }
  }
  function loadRenderStageData(a, v) {
    let sz = 0;
    sz = a.n(); // Map<number, ShaderStageFlagBit>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.n();
      const v1 = a.n();
      v.descriptorVisibility.set(k1, v1);
    }
  }
  function saveRenderPhaseData(a, v) {
    a.s(v.rootSignature);
    a.n(v.shaderPrograms.length); // ShaderProgramData[]
    for (const v1 of v.shaderPrograms) {
      saveShaderProgramData(a, v1);
    }
    a.n(v.shaderIndex.size); // Map<string, number>
    for (const [k1, v1] of v.shaderIndex) {
      a.s(k1);
      a.n(v1);
    }
    // skip, v.pipelineLayout: PipelineLayout
  }
  function loadRenderPhaseData(a, v) {
    v.rootSignature = a.s();
    let sz = 0;
    sz = a.n(); // ShaderProgramData[]
    v.shaderPrograms.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      const v1 = new ShaderProgramData();
      loadShaderProgramData(a, v1);
      v.shaderPrograms[i1] = v1;
    }
    sz = a.n(); // Map<string, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = a.n();
      v.shaderIndex.set(k1, v1);
    }
    // skip, v.pipelineLayout: PipelineLayout
  }
  function saveLayoutGraphData(a, g) {
    const numVertices = g.nv();
    const numEdges = g.ne();
    a.n(numVertices);
    a.n(numEdges);
    let numStages = 0;
    let numPhases = 0;
    for (const v of g.v()) {
      switch (g.w(v)) {
        case LayoutGraphDataValue.RenderStage:
          numStages += 1;
          break;
        case LayoutGraphDataValue.RenderPhase:
          numPhases += 1;
          break;
        default:
          break;
      }
    }
    a.n(numStages);
    a.n(numPhases);
    for (const v of g.v()) {
      a.n(g.w(v));
      a.n(g.getParent(v));
      a.s(g.getName(v));
      a.n(g.getUpdate(v));
      savePipelineLayoutData(a, g.getLayout(v));
      switch (g.w(v)) {
        case LayoutGraphDataValue.RenderStage:
          saveRenderStageData(a, g.x[v].j);
          break;
        case LayoutGraphDataValue.RenderPhase:
          saveRenderPhaseData(a, g.x[v].j);
          break;
        default:
          break;
      }
    }
    a.n(g.valueNames.length); // string[]
    for (const v1 of g.valueNames) {
      a.s(v1);
    }
    a.n(g.attributeIndex.size); // Map<string, number>
    for (const [k1, v1] of g.attributeIndex) {
      a.s(k1);
      a.n(v1);
    }
    a.n(g.constantIndex.size); // Map<string, number>
    for (const [k1, v1] of g.constantIndex) {
      a.s(k1);
      a.n(v1);
    }
    a.n(g.shaderLayoutIndex.size); // Map<string, number>
    for (const [k1, v1] of g.shaderLayoutIndex) {
      a.s(k1);
      a.n(v1);
    }
    a.n(g.effects.size); // Map<string, EffectData>
    for (const [k1, v1] of g.effects) {
      a.s(k1);
      saveEffectData(a, v1);
    }
  }
  function loadLayoutGraphData(a, g) {
    const numVertices = a.n();
    const numEdges = a.n();
    const numStages = a.n();
    const numPhases = a.n();
    for (let v = 0; v !== numVertices; ++v) {
      const id = a.n();
      const u = a.n();
      const name = a.s();
      const update = a.n();
      const layout = new PipelineLayoutData();
      loadPipelineLayoutData(a, layout);
      switch (id) {
        case LayoutGraphDataValue.RenderStage:
          {
            const renderStage = new RenderStageData();
            loadRenderStageData(a, renderStage);
            g.addVertex(LayoutGraphDataValue.RenderStage, renderStage, name, update, layout, u);
            break;
          }
        case LayoutGraphDataValue.RenderPhase:
          {
            const renderPhase = new RenderPhaseData();
            loadRenderPhaseData(a, renderPhase);
            g.addVertex(LayoutGraphDataValue.RenderPhase, renderPhase, name, update, layout, u);
            break;
          }
        default:
          break;
      }
    }
    let sz = 0;
    sz = a.n(); // string[]
    g.valueNames.length = sz;
    for (let i1 = 0; i1 !== sz; ++i1) {
      g.valueNames[i1] = a.s();
    }
    sz = a.n(); // Map<string, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = a.n();
      g.attributeIndex.set(k1, v1);
    }
    sz = a.n(); // Map<string, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = a.n();
      g.constantIndex.set(k1, v1);
    }
    sz = a.n(); // Map<string, number>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = a.n();
      g.shaderLayoutIndex.set(k1, v1);
    }
    sz = a.n(); // Map<string, EffectData>
    for (let i1 = 0; i1 !== sz; ++i1) {
      const k1 = a.s();
      const v1 = new EffectData();
      loadEffectData(a, v1);
      g.effects.set(k1, v1);
    }
  }
  _export({
    Layout: void 0,
    Descriptor: void 0,
    DescriptorBlock: void 0,
    DescriptorBlockFlattened: void 0,
    DescriptorBlockIndex: void 0,
    DescriptorGroupBlockIndex: void 0,
    DescriptorDB: void 0,
    RenderPhase: void 0,
    getLayoutGraphValueName: getLayoutGraphValueName,
    LayoutGraphVertex: void 0,
    LayoutGraph: void 0,
    UniformData: void 0,
    UniformBlockData: void 0,
    DescriptorData: void 0,
    DescriptorBlockData: void 0,
    DescriptorSetLayoutData: void 0,
    DescriptorSetData: void 0,
    PipelineLayoutData: void 0,
    ShaderBindingData: void 0,
    ShaderLayoutData: void 0,
    TechniqueData: void 0,
    EffectData: void 0,
    ShaderProgramData: void 0,
    RenderStageData: void 0,
    RenderPhaseData: void 0,
    getLayoutGraphDataValueName: getLayoutGraphDataValueName,
    LayoutGraphDataVertex: void 0,
    LayoutGraphData: void 0,
    LayoutGraphObjectPool: void 0,
    saveDescriptor: saveDescriptor,
    loadDescriptor: loadDescriptor,
    saveDescriptorBlock: saveDescriptorBlock,
    loadDescriptorBlock: loadDescriptorBlock,
    saveDescriptorBlockFlattened: saveDescriptorBlockFlattened,
    loadDescriptorBlockFlattened: loadDescriptorBlockFlattened,
    saveDescriptorBlockIndex: saveDescriptorBlockIndex,
    loadDescriptorBlockIndex: loadDescriptorBlockIndex,
    saveDescriptorGroupBlockIndex: saveDescriptorGroupBlockIndex,
    loadDescriptorGroupBlockIndex: loadDescriptorGroupBlockIndex,
    saveDescriptorDB: saveDescriptorDB,
    loadDescriptorDB: loadDescriptorDB,
    saveRenderPhase: saveRenderPhase,
    loadRenderPhase: loadRenderPhase,
    saveLayoutGraph: saveLayoutGraph,
    loadLayoutGraph: loadLayoutGraph,
    saveUniformData: saveUniformData,
    loadUniformData: loadUniformData,
    saveUniformBlockData: saveUniformBlockData,
    loadUniformBlockData: loadUniformBlockData,
    saveDescriptorData: saveDescriptorData,
    loadDescriptorData: loadDescriptorData,
    saveDescriptorBlockData: saveDescriptorBlockData,
    loadDescriptorBlockData: loadDescriptorBlockData,
    saveDescriptorSetLayoutData: saveDescriptorSetLayoutData,
    loadDescriptorSetLayoutData: loadDescriptorSetLayoutData,
    saveDescriptorSetData: saveDescriptorSetData,
    loadDescriptorSetData: loadDescriptorSetData,
    savePipelineLayoutData: savePipelineLayoutData,
    loadPipelineLayoutData: loadPipelineLayoutData,
    saveShaderBindingData: saveShaderBindingData,
    loadShaderBindingData: loadShaderBindingData,
    saveShaderLayoutData: saveShaderLayoutData,
    loadShaderLayoutData: loadShaderLayoutData,
    saveTechniqueData: saveTechniqueData,
    loadTechniqueData: loadTechniqueData,
    saveEffectData: saveEffectData,
    loadEffectData: loadEffectData,
    saveShaderProgramData: saveShaderProgramData,
    loadShaderProgramData: loadShaderProgramData,
    saveRenderStageData: saveRenderStageData,
    loadRenderStageData: loadRenderStageData,
    saveRenderPhaseData: saveRenderPhaseData,
    loadRenderPhaseData: loadRenderPhaseData,
    saveLayoutGraphData: saveLayoutGraphData,
    loadLayoutGraphData: loadLayoutGraphData
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      COCOS_RUNTIME = _virtualInternal253AconstantsJs.COCOS_RUNTIME;
      HTML5 = _virtualInternal253AconstantsJs.HTML5;
    }, function (_graphJs) {
      AdjI = _graphJs.AdjI;
      ED = _graphJs.ED;
      InEI = _graphJs.InEI;
      OutE = _graphJs.OutE;
      OutEI = _graphJs.OutEI;
      findRelative = _graphJs.findRelative;
      getPath = _graphJs.getPath;
    }, function (_gfxIndexJs) {
      DescriptorSetLayoutInfo = _gfxIndexJs.DescriptorSetLayoutInfo;
      Format = _gfxIndexJs.Format;
      MemoryAccessBit = _gfxIndexJs.MemoryAccessBit;
      SampleType = _gfxIndexJs.SampleType;
      ShaderStageFlagBit = _gfxIndexJs.ShaderStageFlagBit;
      Type = _gfxIndexJs.Type;
      UniformBlock = _gfxIndexJs.UniformBlock;
      ViewDimension = _gfxIndexJs.ViewDimension;
    }, function (_typesJs) {
      ParameterType = _typesJs.ParameterType;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }, function (_coreMemopIndexJs) {
      RecyclePool = _coreMemopIndexJs.RecyclePool;
    }, function (_serializationJs) {
      saveUniformBlock = _serializationJs.saveUniformBlock;
      loadUniformBlock = _serializationJs.loadUniformBlock;
      saveDescriptorSetLayoutInfo = _serializationJs.saveDescriptorSetLayoutInfo;
      loadDescriptorSetLayoutInfo = _serializationJs.loadDescriptorSetLayoutInfo;
    }],
    execute: function () {
      _export("LayoutType", LayoutType = {
        VULKAN: 0,
        WEBGPU: 1
      });
      _export("Layout", Layout = class Layout {});
      Layout.type = LayoutType.VULKAN;
      Layout.isWebGPU = false;
      _export("DescriptorTypeOrder", DescriptorTypeOrder = {
        UNIFORM_BUFFER: 0,
        DYNAMIC_UNIFORM_BUFFER: 1,
        SAMPLER_TEXTURE: 2,
        SAMPLER: 3,
        TEXTURE: 4,
        STORAGE_BUFFER: 5,
        DYNAMIC_STORAGE_BUFFER: 6,
        STORAGE_IMAGE: 7,
        INPUT_ATTACHMENT: 8
      });
      _export("Descriptor", Descriptor = class Descriptor {
        constructor(type = Type.UNKNOWN) {
          this.count = 1;
          this.type = type;
        }
        reset(type) {
          this.type = type;
          this.count = 1;
        }
      });
      _export("DescriptorBlock", DescriptorBlock = class DescriptorBlock {
        constructor() {
          this.descriptors = new Map();
          this.uniformBlocks = new Map();
          this.capacity = 0;
          this.count = 0;
        }
        reset() {
          this.descriptors.clear();
          this.uniformBlocks.clear();
          this.capacity = 0;
          this.count = 0;
        }
      });
      _export("DescriptorBlockFlattened", DescriptorBlockFlattened = class DescriptorBlockFlattened {
        constructor() {
          this.descriptorNames = [];
          this.uniformBlockNames = [];
          this.descriptors = [];
          this.uniformBlocks = [];
          this.capacity = 0;
          this.count = 0;
        }
        reset() {
          this.descriptorNames.length = 0;
          this.uniformBlockNames.length = 0;
          this.descriptors.length = 0;
          this.uniformBlocks.length = 0;
          this.capacity = 0;
          this.count = 0;
        }
      });
      _export("DescriptorBlockIndex", DescriptorBlockIndex = class DescriptorBlockIndex {
        constructor(updateFrequency = UpdateFrequency.PER_INSTANCE, parameterType = ParameterType.CONSTANTS, descriptorType = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE) {
          this.updateFrequency = updateFrequency;
          this.parameterType = parameterType;
          this.descriptorType = descriptorType;
          this.visibility = visibility;
        }
      });
      _export("DescriptorGroupBlockIndex", DescriptorGroupBlockIndex = class DescriptorGroupBlockIndex {
        constructor(updateFrequency = UpdateFrequency.PER_INSTANCE, parameterType = ParameterType.CONSTANTS, descriptorType = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE, accessType = MemoryAccessBit.READ_ONLY, viewDimension = ViewDimension.UNKNOWN, sampleType = SampleType.FLOAT, format = Format.UNKNOWN) {
          this.updateFrequency = updateFrequency;
          this.parameterType = parameterType;
          this.descriptorType = descriptorType;
          this.visibility = visibility;
          this.accessType = accessType;
          this.viewDimension = viewDimension;
          this.sampleType = sampleType;
          this.format = format;
        }
      });
      _export("DescriptorDB", DescriptorDB = class DescriptorDB {
        constructor() {
          this.blocks = new Map();
          this.groupBlocks = new Map();
        }
        reset() {
          this.blocks.clear();
          this.groupBlocks.clear();
        }
      });
      _export("RenderPhase", RenderPhase = class RenderPhase {
        constructor() {
          this.shaders = new Set();
        }
        reset() {
          this.shaders.clear();
        }
      });
      _export("RenderPassType", RenderPassType = {
        SINGLE_RENDER_PASS: 0,
        RENDER_PASS: 1,
        RENDER_SUBPASS: 2
      }); //=================================================================
      // LayoutGraph
      //=================================================================
      // PolymorphicGraph Concept
      _export("LayoutGraphValue", LayoutGraphValue = {
        RenderStage: 0,
        RenderPhase: 1
      });
      //-----------------------------------------------------------------
      // Graph Concept
      _export("LayoutGraphVertex", LayoutGraphVertex = class LayoutGraphVertex {
        constructor(id, object) {
          /** Out edge list */
          this.o = [];
          /** In edge list */
          this.i = [];
          /** Polymorphic object Id */
          this.t = void 0;
          /** Polymorphic object */
          this.j = void 0;
          this.id = id;
          this.object = object;
          this.t = id;
          this.j = object;
        }
      }); //-----------------------------------------------------------------
      // ComponentGraph Concept
      _export("LayoutGraphComponent", LayoutGraphComponent = {
        Name: 0,
        Descriptors: 1
      });
      //-----------------------------------------------------------------
      // LayoutGraph Implementation
      _export("LayoutGraph", LayoutGraph = class LayoutGraph {
        constructor() {
          //-----------------------------------------------------------------
          // Graph
          /** null vertex descriptor */
          this.N = 0xFFFFFFFF;
          this.x = [];
          this._names = [];
          this._descriptors = [];
        }
        // type edge_descriptor = ED;
        //-----------------------------------------------------------------
        // IncidenceGraph
        // type out_edge_iterator = OutEI;
        // type degree_size_type = number;
        edge(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        source(e) {
          return e.source;
        }
        target(e) {
          return e.target;
        }
        oe(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        od(v) {
          return this.x[v].o.length;
        }
        //-----------------------------------------------------------------
        // BidirectionalGraph
        // type in_edge_iterator = InEI;
        ie(v) {
          return new InEI(this.x[v].i.values(), v);
        }
        id(v) {
          return this.x[v].i.length;
        }
        d(v) {
          return this.od(v) + this.id(v);
        }
        //-----------------------------------------------------------------
        // AdjacencyGraph
        // type adjacency_iterator = AdjI;
        adj(v) {
          return new AdjI(this, this.oe(v));
        }
        //-----------------------------------------------------------------
        // VertexListGraph
        v() {
          return this.x.keys();
        }
        nv() {
          return this.x.length;
        }
        //-----------------------------------------------------------------
        // EdgeListGraph
        ne() {
          let numEdges = 0;
          for (const v of this.v()) {
            numEdges += this.od(v);
          }
          return numEdges;
        }
        //-----------------------------------------------------------------
        // MutableGraph
        clear() {
          // ComponentGraph
          this._names.length = 0;
          this._descriptors.length = 0;
          // Graph Vertices
          this.x.length = 0;
        }
        addVertex(id, object, name, descriptors, u = 0xFFFFFFFF) {
          const vert = new LayoutGraphVertex(id, object);
          const v = this.x.length;
          this.x.push(vert);
          this._names.push(name);
          this._descriptors.push(descriptors);

          // ReferenceGraph
          if (u !== 0xFFFFFFFF) {
            this.addEdge(u, v);
          }
          return v;
        }
        addEdge(u, v) {
          // update in/out edge list
          this.x[u].o.push(new OutE(v));
          this.x[v].i.push(new OutE(u));
          return new ED(u, v);
        }
        //-----------------------------------------------------------------
        // NamedGraph
        vertexName(v) {
          return this._names[v];
        }
        //-----------------------------------------------------------------
        // ComponentGraph
        // skip setName, Name is constant in AddressableGraph
        getName(v) {
          return this._names[v];
        }
        getDescriptors(v) {
          return this._descriptors[v];
        }
        //-----------------------------------------------------------------
        // PolymorphicGraph
        h(id, v) {
          return this.x[v].t === id;
        }
        w(v) {
          return this.x[v].t;
        }
        object(v) {
          return this.x[v].j;
        }
        value(id, v) {
          if (this.x[v].t === id) {
            return this.x[v].j;
          } else {
            throw Error('value id not match');
          }
        }
        visitVertex(visitor, v) {
          const vert = this.x[v];
          switch (vert.t) {
            case LayoutGraphValue.RenderStage:
              return visitor.renderStage(vert.j);
            case LayoutGraphValue.RenderPhase:
              return visitor.renderPhase(vert.j);
            default:
              throw Error('polymorphic type not found');
          }
        }
        j(v) {
          return this.x[v].j;
        }
        //-----------------------------------------------------------------
        // ReferenceGraph
        // type reference_descriptor = ED;
        // type child_iterator = OutEI;
        // type parent_iterator = InEI;
        reference(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        parent(e) {
          return e.source;
        }
        child(e) {
          return e.target;
        }
        children(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        numChildren(v) {
          return this.x[v].o.length;
        }
        getParent(v) {
          if (v === 0xFFFFFFFF) {
            return 0xFFFFFFFF;
          }
          const list = this.x[v].i;
          if (list.length === 0) {
            return 0xFFFFFFFF;
          } else {
            return list[0].target;
          }
        }
        //-----------------------------------------------------------------
        // MutableReferenceGraph
        addReference(u, v) {
          return this.addEdge(u, v);
        }
        //-----------------------------------------------------------------
        // ParentGraph
        locateChild(u, name) {
          if (u === 0xFFFFFFFF) {
            for (const v of this.x.keys()) {
              const vert = this.x[v];
              if (vert.i.length === 0 && this._names[v] === name) {
                return v;
              }
            }
            return 0xFFFFFFFF;
          }
          for (const oe of this.x[u].o) {
            const child = oe.target;
            if (name === this._names[child]) {
              return child;
            }
          }
          return 0xFFFFFFFF;
        }
        //-----------------------------------------------------------------
        // AddressableGraph
        locate(absPath) {
          return findRelative(this, 0xFFFFFFFF, absPath);
        }
        locateRelative(path, start = 0xFFFFFFFF) {
          return findRelative(this, start, path);
        }
        path(v) {
          return getPath(this, v);
        }
      });
      _export("UniformData", UniformData = class UniformData {
        constructor(uniformID = 0xFFFFFFFF, uniformType = Type.UNKNOWN, offset = 0) {
          this.size = 0;
          this.uniformID = uniformID;
          this.uniformType = uniformType;
          this.offset = offset;
        }
        reset(uniformID, uniformType, offset) {
          this.uniformID = uniformID;
          this.uniformType = uniformType;
          this.offset = offset;
          this.size = 0;
        }
      });
      _export("UniformBlockData", UniformBlockData = class UniformBlockData {
        constructor() {
          this.bufferSize = 0;
          this.uniforms = [];
        }
        reset() {
          this.bufferSize = 0;
          this.uniforms.length = 0;
        }
      });
      _export("DescriptorData", DescriptorData = class DescriptorData {
        constructor(descriptorID = 0, type = Type.UNKNOWN, count = 1) {
          this.descriptorID = descriptorID;
          this.type = type;
          this.count = count;
        }
        reset(descriptorID, type, count) {
          this.descriptorID = descriptorID;
          this.type = type;
          this.count = count;
        }
      });
      _export("DescriptorBlockData", DescriptorBlockData = class DescriptorBlockData {
        constructor(type = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE, capacity = 0, accessType = MemoryAccessBit.READ_ONLY, viewDimension = ViewDimension.UNKNOWN, sampleType = SampleType.FLOAT, format = Format.UNKNOWN) {
          this.offset = 0;
          this.descriptors = [];
          this.type = type;
          this.visibility = visibility;
          this.capacity = capacity;
          this.accessType = accessType;
          this.viewDimension = viewDimension;
          this.sampleType = sampleType;
          this.format = format;
        }
        reset(type, visibility, capacity, accessType, viewDimension, sampleType, format) {
          this.type = type;
          this.visibility = visibility;
          this.offset = 0;
          this.capacity = capacity;
          this.accessType = accessType;
          this.viewDimension = viewDimension;
          this.sampleType = sampleType;
          this.format = format;
          this.descriptors.length = 0;
        }
      });
      _export("DescriptorSetLayoutData", DescriptorSetLayoutData = class DescriptorSetLayoutData {
        constructor(slot = 0xFFFFFFFF, capacity = 0, descriptorBlocks = [], uniformBlocks = new Map(), bindingMap = new Map()) {
          this.uniformBlockCapacity = 0;
          this.samplerTextureCapacity = 0;
          this.slot = slot;
          this.capacity = capacity;
          this.descriptorBlocks = descriptorBlocks;
          this.uniformBlocks = uniformBlocks;
          this.bindingMap = bindingMap;
        }
        reset(slot, capacity) {
          this.slot = slot;
          this.capacity = capacity;
          this.uniformBlockCapacity = 0;
          this.samplerTextureCapacity = 0;
          this.descriptorBlocks.length = 0;
          this.uniformBlocks.clear();
          this.bindingMap.clear();
        }
      });
      _export("DescriptorSetData", DescriptorSetData = class DescriptorSetData {
        constructor(descriptorSetLayoutData = new DescriptorSetLayoutData(), descriptorSetLayout = null, descriptorSet = null) {
          this.descriptorSetLayoutInfo = new DescriptorSetLayoutInfo();
          this.descriptorSetLayoutData = descriptorSetLayoutData;
          this.descriptorSetLayout = descriptorSetLayout;
          this.descriptorSet = descriptorSet;
        }
        reset(descriptorSetLayout, descriptorSet) {
          this.descriptorSetLayoutData.reset(0xFFFFFFFF, 0);
          resetDescriptorSetLayoutInfo(this.descriptorSetLayoutInfo);
          this.descriptorSetLayout = descriptorSetLayout;
          this.descriptorSet = descriptorSet;
        }
      });
      _export("PipelineLayoutData", PipelineLayoutData = class PipelineLayoutData {
        constructor() {
          this.descriptorSets = new Map();
          this.descriptorGroups = new Map();
        }
        reset() {
          this.descriptorSets.clear();
          this.descriptorGroups.clear();
        }
        getSets() {
          return (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? this.descriptorGroups : this.descriptorSets;
        }
        getSet(frequency) {
          return (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? this.descriptorGroups.get(frequency) : this.descriptorSets.get(frequency);
        }
      });
      _export("ShaderBindingData", ShaderBindingData = class ShaderBindingData {
        constructor() {
          this.descriptorBindings = new Map();
        }
        reset() {
          this.descriptorBindings.clear();
        }
      });
      _export("ShaderLayoutData", ShaderLayoutData = class ShaderLayoutData {
        constructor() {
          this.layoutData = new Map();
          this.bindingData = new Map();
        }
        reset() {
          this.layoutData.clear();
          this.bindingData.clear();
        }
      });
      _export("TechniqueData", TechniqueData = class TechniqueData {
        constructor() {
          this.passes = [];
        }
        reset() {
          this.passes.length = 0;
        }
      });
      _export("EffectData", EffectData = class EffectData {
        constructor() {
          this.techniques = new Map();
        }
        reset() {
          this.techniques.clear();
        }
      });
      _export("ShaderProgramData", ShaderProgramData = class ShaderProgramData {
        constructor() {
          this.layout = new PipelineLayoutData();
          /*refcount*/
          this.pipelineLayout = null;
        }
        reset() {
          this.layout.reset();
          this.pipelineLayout = null;
        }
      });
      _export("RenderStageData", RenderStageData = class RenderStageData {
        constructor() {
          this.descriptorVisibility = new Map();
        }
        reset() {
          this.descriptorVisibility.clear();
        }
      });
      _export("RenderPhaseData", RenderPhaseData = class RenderPhaseData {
        constructor() {
          this.rootSignature = '';
          this.shaderPrograms = [];
          this.shaderIndex = new Map();
          /*refcount*/
          this.pipelineLayout = null;
        }
        reset() {
          this.rootSignature = '';
          this.shaderPrograms.length = 0;
          this.shaderIndex.clear();
          this.pipelineLayout = null;
        }
      }); //=================================================================
      // LayoutGraphData
      //=================================================================
      // PolymorphicGraph Concept
      _export("LayoutGraphDataValue", LayoutGraphDataValue = {
        RenderStage: 0,
        RenderPhase: 1
      });
      //-----------------------------------------------------------------
      // Graph Concept
      _export("LayoutGraphDataVertex", LayoutGraphDataVertex = class LayoutGraphDataVertex {
        constructor(id, object) {
          /** Out edge list */
          this.o = [];
          /** In edge list */
          this.i = [];
          /** Polymorphic object Id */
          this.t = void 0;
          /** Polymorphic object */
          this.j = void 0;
          this.id = id;
          this.object = object;
          this.t = id;
          this.j = object;
        }
      }); //-----------------------------------------------------------------
      // ComponentGraph Concept
      _export("LayoutGraphDataComponent", LayoutGraphDataComponent = {
        Name: 0,
        Update: 1,
        Layout: 2
      });
      //-----------------------------------------------------------------
      // LayoutGraphData Implementation
      _export("LayoutGraphData", LayoutGraphData = class LayoutGraphData {
        constructor() {
          //-----------------------------------------------------------------
          // Graph
          /** null vertex descriptor */
          this.N = 0xFFFFFFFF;
          this.x = [];
          this._names = [];
          this._updateFrequencies = [];
          this._layouts = [];
          this.valueNames = [];
          this.attributeIndex = new Map();
          this.constantIndex = new Map();
          this.shaderLayoutIndex = new Map();
          this.effects = new Map();
          this.constantMacros = '';
        }
        // type edge_descriptor = ED;
        //-----------------------------------------------------------------
        // IncidenceGraph
        // type out_edge_iterator = OutEI;
        // type degree_size_type = number;
        edge(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        source(e) {
          return e.source;
        }
        target(e) {
          return e.target;
        }
        oe(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        od(v) {
          return this.x[v].o.length;
        }
        //-----------------------------------------------------------------
        // BidirectionalGraph
        // type in_edge_iterator = InEI;
        ie(v) {
          return new InEI(this.x[v].i.values(), v);
        }
        id(v) {
          return this.x[v].i.length;
        }
        d(v) {
          return this.od(v) + this.id(v);
        }
        //-----------------------------------------------------------------
        // AdjacencyGraph
        // type adjacency_iterator = AdjI;
        adj(v) {
          return new AdjI(this, this.oe(v));
        }
        //-----------------------------------------------------------------
        // VertexListGraph
        v() {
          return this.x.keys();
        }
        nv() {
          return this.x.length;
        }
        //-----------------------------------------------------------------
        // EdgeListGraph
        ne() {
          let numEdges = 0;
          for (const v of this.v()) {
            numEdges += this.od(v);
          }
          return numEdges;
        }
        //-----------------------------------------------------------------
        // MutableGraph
        clear() {
          // Members
          this.valueNames.length = 0;
          this.attributeIndex.clear();
          this.constantIndex.clear();
          this.shaderLayoutIndex.clear();
          this.effects.clear();
          this.constantMacros = '';
          // ComponentGraph
          this._names.length = 0;
          this._updateFrequencies.length = 0;
          this._layouts.length = 0;
          // Graph Vertices
          this.x.length = 0;
        }
        addVertex(id, object, name, update, layout, u = 0xFFFFFFFF) {
          const vert = new LayoutGraphDataVertex(id, object);
          const v = this.x.length;
          this.x.push(vert);
          this._names.push(name);
          this._updateFrequencies.push(update);
          this._layouts.push(layout);

          // ReferenceGraph
          if (u !== 0xFFFFFFFF) {
            this.addEdge(u, v);
          }
          return v;
        }
        addEdge(u, v) {
          // update in/out edge list
          this.x[u].o.push(new OutE(v));
          this.x[v].i.push(new OutE(u));
          return new ED(u, v);
        }
        //-----------------------------------------------------------------
        // NamedGraph
        vertexName(v) {
          return this._names[v];
        }
        //-----------------------------------------------------------------
        // ComponentGraph
        // skip setName, Name is constant in AddressableGraph
        getName(v) {
          return this._names[v];
        }
        getUpdate(v) {
          return this._updateFrequencies[v];
        }
        setUpdate(v, value) {
          this._updateFrequencies[v] = value;
        }
        getLayout(v) {
          return this._layouts[v];
        }
        //-----------------------------------------------------------------
        // PolymorphicGraph
        h(id, v) {
          return this.x[v].t === id;
        }
        w(v) {
          return this.x[v].t;
        }
        object(v) {
          return this.x[v].j;
        }
        value(id, v) {
          if (this.x[v].t === id) {
            return this.x[v].j;
          } else {
            throw Error('value id not match');
          }
        }
        visitVertex(visitor, v) {
          const vert = this.x[v];
          switch (vert.t) {
            case LayoutGraphDataValue.RenderStage:
              return visitor.renderStage(vert.j);
            case LayoutGraphDataValue.RenderPhase:
              return visitor.renderPhase(vert.j);
            default:
              throw Error('polymorphic type not found');
          }
        }
        j(v) {
          return this.x[v].j;
        }
        //-----------------------------------------------------------------
        // ReferenceGraph
        // type reference_descriptor = ED;
        // type child_iterator = OutEI;
        // type parent_iterator = InEI;
        reference(u, v) {
          for (const oe of this.x[u].o) {
            if (v === oe.target) {
              return true;
            }
          }
          return false;
        }
        parent(e) {
          return e.source;
        }
        child(e) {
          return e.target;
        }
        children(v) {
          return new OutEI(this.x[v].o.values(), v);
        }
        numChildren(v) {
          return this.x[v].o.length;
        }
        getParent(v) {
          if (v === 0xFFFFFFFF) {
            return 0xFFFFFFFF;
          }
          const list = this.x[v].i;
          if (list.length === 0) {
            return 0xFFFFFFFF;
          } else {
            return list[0].target;
          }
        }
        //-----------------------------------------------------------------
        // MutableReferenceGraph
        addReference(u, v) {
          return this.addEdge(u, v);
        }
        //-----------------------------------------------------------------
        // ParentGraph
        locateChild(u, name) {
          if (u === 0xFFFFFFFF) {
            for (const v of this.x.keys()) {
              const vert = this.x[v];
              if (vert.i.length === 0 && this._names[v] === name) {
                return v;
              }
            }
            return 0xFFFFFFFF;
          }
          for (const oe of this.x[u].o) {
            const child = oe.target;
            if (name === this._names[child]) {
              return child;
            }
          }
          return 0xFFFFFFFF;
        }
        //-----------------------------------------------------------------
        // AddressableGraph
        locate(absPath) {
          return findRelative(this, 0xFFFFFFFF, absPath);
        }
        locateRelative(path, start = 0xFFFFFFFF) {
          return findRelative(this, start, path);
        }
        path(v) {
          return getPath(this, v);
        }
      });
      _export("LayoutGraphObjectPool", LayoutGraphObjectPool = class LayoutGraphObjectPool {
        constructor(renderCommon) {
          this.renderCommon = void 0;
          this.l = createPool(Layout);
          this.d = createPool(Descriptor);
          this.db = createPool(DescriptorBlock);
          this.dbf = createPool(DescriptorBlockFlattened);
          this.dbi = createPool(DescriptorBlockIndex);
          this.dgbi = createPool(DescriptorGroupBlockIndex);
          this.dd = createPool(DescriptorDB);
          this.rp = createPool(RenderPhase);
          this.lg = createPool(LayoutGraph);
          this.ud = createPool(UniformData);
          this.ubd = createPool(UniformBlockData);
          this.dd1 = createPool(DescriptorData);
          this.dbd = createPool(DescriptorBlockData);
          this.dsld = createPool(DescriptorSetLayoutData);
          this.dsd = createPool(DescriptorSetData);
          this.pld = createPool(PipelineLayoutData);
          this.sbd = createPool(ShaderBindingData);
          this.sld = createPool(ShaderLayoutData);
          this.td = createPool(TechniqueData);
          this.ed = createPool(EffectData);
          this.spd = createPool(ShaderProgramData);
          this.rsd = createPool(RenderStageData);
          this.rpd = createPool(RenderPhaseData);
          this.lgd = createPool(LayoutGraphData);
          this.renderCommon = renderCommon;
        }
        reset() {
          this.l.reset(); // Layout
          this.d.reset(); // Descriptor
          this.db.reset(); // DescriptorBlock
          this.dbf.reset(); // DescriptorBlockFlattened
          this.dbi.reset(); // DescriptorBlockIndex
          this.dgbi.reset(); // DescriptorGroupBlockIndex
          this.dd.reset(); // DescriptorDB
          this.rp.reset(); // RenderPhase
          this.lg.reset(); // LayoutGraph
          this.ud.reset(); // UniformData
          this.ubd.reset(); // UniformBlockData
          this.dd1.reset(); // DescriptorData
          this.dbd.reset(); // DescriptorBlockData
          this.dsld.reset(); // DescriptorSetLayoutData
          this.dsd.reset(); // DescriptorSetData
          this.pld.reset(); // PipelineLayoutData
          this.sbd.reset(); // ShaderBindingData
          this.sld.reset(); // ShaderLayoutData
          this.td.reset(); // TechniqueData
          this.ed.reset(); // EffectData
          this.spd.reset(); // ShaderProgramData
          this.rsd.reset(); // RenderStageData
          this.rpd.reset(); // RenderPhaseData
          this.lgd.reset(); // LayoutGraphData
        }
        createLayout() {
          const v = this.l.add(); // Layout
          return v;
        }
        createDescriptor(type = Type.UNKNOWN) {
          const v = this.d.add(); // Descriptor
          v.reset(type);
          return v;
        }
        createDescriptorBlock() {
          const v = this.db.add(); // DescriptorBlock
          v.reset();
          return v;
        }
        createDescriptorBlockFlattened() {
          const v = this.dbf.add(); // DescriptorBlockFlattened
          v.reset();
          return v;
        }
        createDescriptorBlockIndex(updateFrequency = UpdateFrequency.PER_INSTANCE, parameterType = ParameterType.CONSTANTS, descriptorType = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE) {
          const v = this.dbi.add(); // DescriptorBlockIndex
          v.updateFrequency = updateFrequency;
          v.parameterType = parameterType;
          v.descriptorType = descriptorType;
          v.visibility = visibility;
          return v;
        }
        createDescriptorGroupBlockIndex(updateFrequency = UpdateFrequency.PER_INSTANCE, parameterType = ParameterType.CONSTANTS, descriptorType = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE, accessType = MemoryAccessBit.READ_ONLY, viewDimension = ViewDimension.UNKNOWN, sampleType = SampleType.FLOAT, format = Format.UNKNOWN) {
          const v = this.dgbi.add(); // DescriptorGroupBlockIndex
          v.updateFrequency = updateFrequency;
          v.parameterType = parameterType;
          v.descriptorType = descriptorType;
          v.visibility = visibility;
          v.accessType = accessType;
          v.viewDimension = viewDimension;
          v.sampleType = sampleType;
          v.format = format;
          return v;
        }
        createDescriptorDB() {
          const v = this.dd.add(); // DescriptorDB
          v.reset();
          return v;
        }
        createRenderPhase() {
          const v = this.rp.add(); // RenderPhase
          v.reset();
          return v;
        }
        createLayoutGraph() {
          const v = this.lg.add(); // LayoutGraph
          v.clear();
          return v;
        }
        createUniformData(uniformID = 0xFFFFFFFF, uniformType = Type.UNKNOWN, offset = 0) {
          const v = this.ud.add(); // UniformData
          v.reset(uniformID, uniformType, offset);
          return v;
        }
        createUniformBlockData() {
          const v = this.ubd.add(); // UniformBlockData
          v.reset();
          return v;
        }
        createDescriptorData(descriptorID = 0, type = Type.UNKNOWN, count = 1) {
          const v = this.dd1.add(); // DescriptorData
          v.reset(descriptorID, type, count);
          return v;
        }
        createDescriptorBlockData(type = DescriptorTypeOrder.UNIFORM_BUFFER, visibility = ShaderStageFlagBit.NONE, capacity = 0, accessType = MemoryAccessBit.READ_ONLY, viewDimension = ViewDimension.UNKNOWN, sampleType = SampleType.FLOAT, format = Format.UNKNOWN) {
          const v = this.dbd.add(); // DescriptorBlockData
          v.reset(type, visibility, capacity, accessType, viewDimension, sampleType, format);
          return v;
        }
        createDescriptorSetLayoutData(slot = 0xFFFFFFFF, capacity = 0) {
          const v = this.dsld.add(); // DescriptorSetLayoutData
          v.reset(slot, capacity);
          return v;
        }
        createDescriptorSetData(descriptorSetLayout = null, descriptorSet = null) {
          const v = this.dsd.add(); // DescriptorSetData
          v.reset(descriptorSetLayout, descriptorSet);
          return v;
        }
        createPipelineLayoutData() {
          const v = this.pld.add(); // PipelineLayoutData
          v.reset();
          return v;
        }
        createShaderBindingData() {
          const v = this.sbd.add(); // ShaderBindingData
          v.reset();
          return v;
        }
        createShaderLayoutData() {
          const v = this.sld.add(); // ShaderLayoutData
          v.reset();
          return v;
        }
        createTechniqueData() {
          const v = this.td.add(); // TechniqueData
          v.reset();
          return v;
        }
        createEffectData() {
          const v = this.ed.add(); // EffectData
          v.reset();
          return v;
        }
        createShaderProgramData() {
          const v = this.spd.add(); // ShaderProgramData
          v.reset();
          return v;
        }
        createRenderStageData() {
          const v = this.rsd.add(); // RenderStageData
          v.reset();
          return v;
        }
        createRenderPhaseData() {
          const v = this.rpd.add(); // RenderPhaseData
          v.reset();
          return v;
        }
        createLayoutGraphData() {
          const v = this.lgd.add(); // LayoutGraphData
          v.clear();
          return v;
        }
      });
    }
  };
});