System.register("q-bundled:///fs/cocos/rendering/custom/layout-graph-utils.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../gfx/index.js", "../define.js", "./layout-graph.js", "./types.js"], function (_export, _context) {
  "use strict";

  var COCOS_RUNTIME, HTML5, assert, error, warn, API, DescriptorSetInfo, DescriptorSetLayoutBinding, DescriptorSetLayoutInfo, DescriptorType, Feature, Format, FormatFeatureBit, GetTypeSize, MemoryAccessBit, PipelineLayoutInfo, SampleType, Type, UniformBlock, ViewDimension, UBOForwardLightEnum, UBOSkinning, DescriptorBlockData, DescriptorData, DescriptorSetLayoutData, DescriptorTypeOrder, Layout, LayoutGraphDataValue, LayoutType, ParameterType, UpdateFrequency, INVALID_ID, ENABLE_SUBPASS, DEFAULT_UNIFORM_COUNTS, DYNAMIC_UNIFORM_BLOCK, _emptyDescriptorSetLayout, _emptyPipelineLayout;
  // get DescriptorType from DescriptorTypeOrder
  function getGfxDescriptorType(type) {
    switch (type) {
      case DescriptorTypeOrder.UNIFORM_BUFFER:
        return DescriptorType.UNIFORM_BUFFER;
      case DescriptorTypeOrder.DYNAMIC_UNIFORM_BUFFER:
        return DescriptorType.DYNAMIC_UNIFORM_BUFFER;
      case DescriptorTypeOrder.SAMPLER_TEXTURE:
        return DescriptorType.SAMPLER_TEXTURE;
      case DescriptorTypeOrder.SAMPLER:
        return DescriptorType.SAMPLER;
      case DescriptorTypeOrder.TEXTURE:
        return DescriptorType.TEXTURE;
      case DescriptorTypeOrder.STORAGE_BUFFER:
        return DescriptorType.STORAGE_BUFFER;
      case DescriptorTypeOrder.DYNAMIC_STORAGE_BUFFER:
        return DescriptorType.DYNAMIC_STORAGE_BUFFER;
      case DescriptorTypeOrder.STORAGE_IMAGE:
        return DescriptorType.STORAGE_IMAGE;
      case DescriptorTypeOrder.INPUT_ATTACHMENT:
        return DescriptorType.INPUT_ATTACHMENT;
      default:
        error('DescriptorType not found');
        return DescriptorType.INPUT_ATTACHMENT;
    }
  }

  // get DescriptorTypeOrder from DescriptorType
  function getDescriptorTypeOrder(type) {
    switch (type) {
      case DescriptorType.UNIFORM_BUFFER:
        return DescriptorTypeOrder.UNIFORM_BUFFER;
      case DescriptorType.DYNAMIC_UNIFORM_BUFFER:
        return DescriptorTypeOrder.DYNAMIC_UNIFORM_BUFFER;
      case DescriptorType.SAMPLER_TEXTURE:
        return DescriptorTypeOrder.SAMPLER_TEXTURE;
      case DescriptorType.SAMPLER:
        return DescriptorTypeOrder.SAMPLER;
      case DescriptorType.TEXTURE:
        return DescriptorTypeOrder.TEXTURE;
      case DescriptorType.STORAGE_BUFFER:
        return DescriptorTypeOrder.STORAGE_BUFFER;
      case DescriptorType.DYNAMIC_STORAGE_BUFFER:
        return DescriptorTypeOrder.DYNAMIC_STORAGE_BUFFER;
      case DescriptorType.STORAGE_IMAGE:
        return DescriptorTypeOrder.STORAGE_IMAGE;
      case DescriptorType.INPUT_ATTACHMENT:
        return DescriptorTypeOrder.INPUT_ATTACHMENT;
      case DescriptorType.UNKNOWN:
      default:
        error('DescriptorTypeOrder not found');
        return DescriptorTypeOrder.INPUT_ATTACHMENT;
    }
  }

  // find passID using name
  function getCustomPassID(lg, name) {
    return lg.locateChild(lg.N, name || 'default');
  }

  // find subpassID using name
  function getCustomSubpassID(lg, passID, name) {
    return lg.locateChild(passID, name);
  }

  // find phaseID using subpassOrPassID and phase name
  function getCustomPhaseID(lg, subpassOrPassID, name) {
    if (name === undefined) {
      return lg.locateChild(subpassOrPassID, 'default');
    }
    if (typeof name === 'number') {
      return lg.locateChild(subpassOrPassID, name.toString());
    }
    return lg.locateChild(subpassOrPassID, name);
  }
  function getUniformBlockSize(blockMembers) {
    let prevSize = 0;
    for (const m of blockMembers) {
      if (m.count) {
        prevSize += GetTypeSize(m.type) * m.count;
        continue;
      }
      const iter = DEFAULT_UNIFORM_COUNTS.get(m.name);
      if (iter !== undefined) {
        prevSize += GetTypeSize(m.type) * iter;
        continue;
      }
      if (m.name === 'cc_joints') {
        const sz = GetTypeSize(m.type) * UBOSkinning.LAYOUT.members[0].count;
        assert(sz !== UBOSkinning.SIZE);
        prevSize += sz;
        continue;
      }
      error(`Invalid uniform count: ${m.name}`);
    }
    assert(!!prevSize);
    return prevSize;
  }

  // sort descriptorBlocks using DescriptorBlockIndex
  function sortDescriptorBlocks(lhs, rhs) {
    const lhsIndex = JSON.parse(lhs[0]);
    const rhsIndex = JSON.parse(rhs[0]);
    const lhsValue = lhsIndex.updateFrequency * 10000 + lhsIndex.parameterType * 1000 + lhsIndex.descriptorType * 100 + lhsIndex.visibility;
    const rhsValue = rhsIndex.updateFrequency * 10000 + rhsIndex.parameterType * 1000 + rhsIndex.descriptorType * 100 + rhsIndex.visibility;
    return lhsValue - rhsValue;
  }
  function sortDescriptorGroupBlocks(lhs, rhs) {
    const lhsIndex = JSON.parse(lhs[0]);
    const rhsIndex = JSON.parse(rhs[0]);
    const lhsValue = lhsIndex.updateFrequency * 1000000000 + lhsIndex.parameterType * 100000000 + lhsIndex.descriptorType * 10000000 + lhsIndex.visibility * 1000000 + lhsIndex.accessType * 100000 + lhsIndex.viewDimension * 10000 + lhsIndex.sampleType * 1000 + lhsIndex.format;
    const rhsValue = rhsIndex.updateFrequency * 1000000000 + rhsIndex.parameterType * 100000000 + rhsIndex.descriptorType * 10000000 + rhsIndex.visibility * 1000000 + rhsIndex.accessType * 100000 + rhsIndex.viewDimension * 10000 + rhsIndex.sampleType * 1000 + rhsIndex.format;
    return lhsValue - rhsValue;
  }

  // get descriptor nameID from name
  function getOrCreateDescriptorID(lg, name) {
    const nameID = lg.attributeIndex.get(name);
    if (nameID === undefined) {
      const newID = lg.valueNames.length;
      lg.attributeIndex.set(name, newID);
      lg.valueNames.push(name);
      return newID;
    }
    return nameID;
  }
  function createDescriptorInfo(layoutData, info) {
    info.bindings.length = 0;
    for (let i = 0; i < layoutData.descriptorBlocks.length; ++i) {
      const block = layoutData.descriptorBlocks[i];
      let slot = block.offset;
      for (let j = 0; j < block.descriptors.length; ++j) {
        const d = block.descriptors[j];
        const binding = new DescriptorSetLayoutBinding();
        binding.binding = slot;
        binding.descriptorType = getGfxDescriptorType(block.type);
        binding.count = d.count;
        binding.stageFlags = block.visibility;
        binding.access = block.accessType;
        binding.viewDimension = block.viewDimension;
        binding.sampleType = block.sampleType;
        binding.format = block.format;
        binding.immutableSamplers = [];
        info.bindings.push(binding);
        slot += d.count;
      }
    }
  }
  function createDescriptorSetLayout(device, layoutData) {
    const info = new DescriptorSetLayoutInfo();
    createDescriptorInfo(layoutData, info);
    if (device) {
      return device.createDescriptorSetLayout(info);
    } else {
      return null;
    }
  }
  function createGfxDescriptorSetsAndPipelines(device, g) {
    for (let i = 0; i < g._layouts.length; ++i) {
      const ppl = g.getLayout(i);
      const sets = ppl.getSets();
      sets.forEach((value, key) => {
        const level = value;
        const layoutData = level.descriptorSetLayoutData;
        if (device) {
          const layout = createDescriptorSetLayout(device, layoutData);
          if (layout) {
            level.descriptorSetLayout = layout;
            level.descriptorSet = device.createDescriptorSet(new DescriptorSetInfo(layout));
          }
        } else {
          createDescriptorInfo(layoutData, level.descriptorSetLayoutInfo);
        }
      });
    }
  }

  // lookup DescriptorBlockData from Map
  function getDescriptorBlockData(map, index) {
    const key = JSON.stringify(index);
    const block = map.get(key);
    if (block) {
      return block;
    }
    const newBlock = new DescriptorBlockData(index.descriptorType, index.visibility, 0);
    map.set(key, newBlock);
    return newBlock;
  }
  function getDescriptorGroupBlockData(map, index) {
    const key = JSON.stringify(index);
    const block = map.get(key);
    if (block) {
      return block;
    }
    const newBlock = new DescriptorBlockData(index.descriptorType, index.visibility, 0, index.accessType, index.viewDimension, index.sampleType, index.format);
    map.set(key, newBlock);
    return newBlock;
  }
  function getViewDimension(type) {
    switch (type) {
      case Type.SAMPLER1D:
      case Type.TEXTURE1D:
      case Type.IMAGE1D:
        return ViewDimension.TEX1D;
      case Type.SAMPLER2D:
      case Type.TEXTURE2D:
      case Type.IMAGE2D:
        return ViewDimension.TEX2D;
      case Type.SAMPLER2D_ARRAY:
      case Type.TEXTURE2D_ARRAY:
      case Type.IMAGE2D_ARRAY:
        return ViewDimension.TEX2D_ARRAY;
      case Type.SAMPLER_CUBE:
      case Type.TEXTURE_CUBE:
      case Type.IMAGE_CUBE:
        return ViewDimension.TEXCUBE;
      case Type.SAMPLER3D:
      case Type.TEXTURE3D:
      case Type.IMAGE3D:
        return ViewDimension.TEX3D;
      default:
        return ViewDimension.UNKNOWN;
    }
  }

  // make DescriptorSetLayoutData from effect directly
  function makeDescriptorSetLayoutData(lg, rate, set, descriptors) {
    const map = new Map();
    const uniformBlocks = new Map();
    for (let i = 0; i < descriptors.blocks.length; i++) {
      const cb = descriptors.blocks[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.UNIFORM_BUFFER,
        visibility: cb.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: ViewDimension.BUFFER,
        sampleType: SampleType.FLOAT,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.UNIFORM_BUFFER,
        visibility: cb.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, cb.name);
      block.descriptors.push(new DescriptorData(nameID, Type.UNKNOWN, 1));
      // add uniform buffer
      uniformBlocks.set(nameID, new UniformBlock(set, 0xFFFFFFFF, cb.name, cb.members, 1));
    }
    for (let i = 0; i < descriptors.samplerTextures.length; i++) {
      const samplerTexture = descriptors.samplerTextures[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.SAMPLER_TEXTURE,
        visibility: samplerTexture.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: getViewDimension(samplerTexture.type),
        sampleType: samplerTexture.sampleType,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.SAMPLER_TEXTURE,
        visibility: samplerTexture.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, samplerTexture.name);
      block.descriptors.push(new DescriptorData(nameID, samplerTexture.type, samplerTexture.count));
    }
    for (let i = 0; i < descriptors.samplers.length; i++) {
      const sampler = descriptors.samplers[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.SAMPLER,
        visibility: sampler.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: ViewDimension.UNKNOWN,
        sampleType: SampleType.FLOAT,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.SAMPLER,
        visibility: sampler.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, sampler.name);
      block.descriptors.push(new DescriptorData(nameID, Type.SAMPLER, sampler.count));
    }
    for (let i = 0; i < descriptors.textures.length; i++) {
      const texture = descriptors.textures[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.TEXTURE,
        visibility: texture.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: getViewDimension(texture.type),
        sampleType: texture.sampleType,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.TEXTURE,
        visibility: texture.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, texture.name);
      block.descriptors.push(new DescriptorData(nameID, texture.type, texture.count));
    }
    for (let i = 0; i < descriptors.buffers.length; i++) {
      const buffer = descriptors.buffers[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.STORAGE_BUFFER,
        visibility: buffer.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: ViewDimension.BUFFER,
        sampleType: SampleType.FLOAT,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.STORAGE_BUFFER,
        visibility: buffer.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, buffer.name);
      block.descriptors.push(new DescriptorData(nameID, Type.UNKNOWN, 1));
    }
    for (let i = 0; i < descriptors.images.length; i++) {
      const image = descriptors.images[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.STORAGE_IMAGE,
        visibility: image.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: getViewDimension(image.type),
        sampleType: SampleType.FLOAT,
        format: Format.UNKNOWN // TODO(zhouzhenglong): Add storage image format
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.STORAGE_IMAGE,
        visibility: image.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, image.name);
      block.descriptors.push(new DescriptorData(nameID, image.type, image.count));
    }
    for (let i = 0; i < descriptors.subpassInputs.length; i++) {
      const subpassInput = descriptors.subpassInputs[i];
      const block = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? getDescriptorGroupBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.INPUT_ATTACHMENT,
        visibility: subpassInput.stageFlags,
        accessType: MemoryAccessBit.READ_ONLY,
        viewDimension: ViewDimension.TEX2D,
        sampleType: SampleType.FLOAT,
        format: Format.UNKNOWN
      }) : getDescriptorBlockData(map, {
        updateFrequency: rate,
        parameterType: ParameterType.TABLE,
        descriptorType: DescriptorTypeOrder.INPUT_ATTACHMENT,
        visibility: subpassInput.stageFlags
      });
      const nameID = getOrCreateDescriptorID(lg, subpassInput.name);
      block.descriptors.push(new DescriptorData(nameID, Type.UNKNOWN, subpassInput.count));
    }

    // sort blocks
    const flattenedBlocks = (COCOS_RUNTIME || HTML5) && Layout.isWebGPU ? Array.from(map).sort(sortDescriptorGroupBlocks) : Array.from(map).sort(sortDescriptorBlocks);
    const data = new DescriptorSetLayoutData(set, 0);
    // calculate bindings
    let capacity = 0;
    for (const [key, block] of flattenedBlocks) {
      const index = JSON.parse(key);
      block.offset = capacity;
      for (const d of block.descriptors) {
        if (index.descriptorType === DescriptorTypeOrder.UNIFORM_BUFFER) {
          // update uniform buffer binding
          const ub = uniformBlocks.get(d.descriptorID);
          if (!ub) {
            error(`Uniform block not found for ${d.descriptorID}`);
            continue;
          }
          assert(ub.binding === 0xFFFFFFFF);
          ub.binding = block.capacity;
          // add uniform buffer to output
          data.uniformBlocks.set(d.descriptorID, ub);
        }
        // update block capacity
        const binding = data.bindingMap.get(d.descriptorID);
        if (binding !== undefined) {
          error(`Duplicated descriptor ${d.descriptorID}`);
        }
        data.bindingMap.set(d.descriptorID, block.offset + block.capacity);
        block.capacity += d.count;
      }
      // increate total capacity
      capacity += block.capacity;
      data.capacity += block.capacity;
      if (index.descriptorType === DescriptorTypeOrder.UNIFORM_BUFFER || index.descriptorType === DescriptorTypeOrder.DYNAMIC_UNIFORM_BUFFER) {
        data.uniformBlockCapacity += block.capacity;
      } else if (index.descriptorType === DescriptorTypeOrder.SAMPLER_TEXTURE) {
        data.samplerTextureCapacity += block.capacity;
      }
      data.descriptorBlocks.push(block);
    }
    return data;
  }

  // fill DescriptorSetLayoutInfo from DescriptorSetLayoutData
  function initializeDescriptorSetLayoutInfo(layoutData, info) {
    info.bindings.length = 0;
    for (let i = 0; i < layoutData.descriptorBlocks.length; ++i) {
      const block = layoutData.descriptorBlocks[i];
      let slot = block.offset;
      for (let j = 0; j < block.descriptors.length; ++j) {
        const d = block.descriptors[j];
        const binding = new DescriptorSetLayoutBinding();
        binding.binding = slot;
        binding.descriptorType = getGfxDescriptorType(block.type);
        binding.count = d.count;
        binding.stageFlags = block.visibility;
        binding.access = block.accessType;
        binding.viewDimension = block.viewDimension;
        binding.sampleType = block.sampleType;
        binding.format = block.format;
        binding.immutableSamplers = [];
        info.bindings.push(binding);
        slot += d.count;
      }
    }
  }
  function populatePipelineLayoutInfo(layout, rate, info) {
    const set = layout.getSet(rate);
    if (set && set.descriptorSetLayout) {
      info.setLayouts.push(set.descriptorSetLayout);
    } else {
      info.setLayouts.push(_emptyDescriptorSetLayout);
    }
  }
  function generateConstantMacros(device, constantMacros) {
    constantMacros = `
  #define CC_DEVICE_SUPPORT_FLOAT_TEXTURE ${device.getFormatFeatures(Format.RGBA32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE) ? '1' : '0'}
  #define CC_DEVICE_MAX_VERTEX_UNIFORM_VECTORS ${device.capabilities.maxVertexUniformVectors}
  #define CC_DEVICE_MAX_FRAGMENT_UNIFORM_VECTORS ${device.capabilities.maxFragmentUniformVectors}
  #define CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT ${device.hasFeature(Feature.INPUT_ATTACHMENT_BENEFIT) ? '1' : '0'}
  #define CC_PLATFORM_ANDROID_AND_WEBGL 0
  #define CC_ENABLE_WEBGL_HIGHP_STRUCT_VALUES 0
  #define CC_JOINT_UNIFORM_CAPACITY ${UBOSkinning.JOINT_UNIFORM_CAPACITY}`;
  }

  // initialize layout graph module
  function initializeLayoutGraphData(device, lg) {
    Layout.type = device.gfxAPI === API.WEBGPU ? LayoutType.WEBGPU : LayoutType.VULKAN;
    Layout.isWebGPU = device.gfxAPI === API.WEBGPU;
    // create descriptor sets
    _emptyDescriptorSetLayout = device.createDescriptorSetLayout(new DescriptorSetLayoutInfo());
    _emptyPipelineLayout = device.createPipelineLayout(new PipelineLayoutInfo());
    for (const v of lg.v()) {
      const layoutData = lg.getLayout(v);
      const sets = layoutData.getSets();
      for (const [_, set] of sets) {
        if (set.descriptorSetLayout !== null) {
          warn('descriptor set layout already initialized. It will be overwritten');
        }
        initializeDescriptorSetLayoutInfo(set.descriptorSetLayoutData, set.descriptorSetLayoutInfo);
        set.descriptorSetLayout = device.createDescriptorSetLayout(set.descriptorSetLayoutInfo);
      }
    }
    // create pipeline layouts
    for (const v of lg.v()) {
      if (!lg.h(LayoutGraphDataValue.RenderPhase, v)) {
        continue;
      }
      const subpassOrPassID = lg.getParent(v);
      const phaseID = v;
      const passLayout = lg.getLayout(subpassOrPassID);
      const phaseLayout = lg.getLayout(phaseID);
      const info = new PipelineLayoutInfo();
      populatePipelineLayoutInfo(passLayout, UpdateFrequency.PER_PASS, info);
      populatePipelineLayoutInfo(phaseLayout, UpdateFrequency.PER_PHASE, info);
      populatePipelineLayoutInfo(phaseLayout, UpdateFrequency.PER_BATCH, info);
      populatePipelineLayoutInfo(phaseLayout, UpdateFrequency.PER_INSTANCE, info);
      const phase = lg.j(phaseID);
      phase.pipelineLayout = device.createPipelineLayout(info);
    }
  }

  // terminate layout graph module
  function terminateLayoutGraphData(lg) {
    for (const v of lg.v()) {
      const layoutData = lg.getLayout(v);
      const sets = layoutData.getSets();
      for (const [_, set] of sets) {
        if (set.descriptorSetLayout !== null) {
          set.descriptorSetLayout.destroy();
        }
      }
    }
    _emptyPipelineLayout.destroy();
    _emptyDescriptorSetLayout.destroy();
  }

  // get empty descriptor set layout
  function getEmptyDescriptorSetLayout() {
    return _emptyDescriptorSetLayout;
  }

  // get empty pipeline layout
  function getEmptyPipelineLayout() {
    return _emptyPipelineLayout;
  }

  // get descriptor set from LayoutGraphData (not from ProgramData)
  function getOrCreateDescriptorSetLayout(lg, subpassOrPassID, phaseID, rate) {
    if (rate < UpdateFrequency.PER_PASS) {
      const phaseData = lg.getLayout(phaseID);
      const data = phaseData.getSet(rate);
      if (data) {
        if (!data.descriptorSetLayout) {
          error('descriptor set layout not initialized');
          return _emptyDescriptorSetLayout;
        }
        return data.descriptorSetLayout;
      }
      return _emptyDescriptorSetLayout;
    }
    assert(rate === UpdateFrequency.PER_PASS);
    assert(subpassOrPassID === lg.getParent(phaseID));
    const passData = lg.getLayout(subpassOrPassID);
    const data = passData.getSet(rate);
    if (data) {
      if (!data.descriptorSetLayout) {
        error('descriptor set layout not initialized');
        return _emptyDescriptorSetLayout;
      }
      return data.descriptorSetLayout;
    }
    return _emptyDescriptorSetLayout;
  }

  // getDescriptorSetLayout from LayoutGraphData
  function getDescriptorSetLayout(lg, subpassOrPassID, phaseID, rate) {
    if (rate < UpdateFrequency.PER_PASS) {
      const phaseData = lg.getLayout(phaseID);
      const data = phaseData.getSet(rate);
      if (data) {
        if (!data.descriptorSetLayout) {
          error('descriptor set layout not initialized');
          return null;
        }
        return data.descriptorSetLayout;
      }
      return null;
    }
    assert(rate === UpdateFrequency.PER_PASS);
    assert(subpassOrPassID === lg.getParent(phaseID));
    const passData = lg.getLayout(subpassOrPassID);
    const data = passData.getSet(rate);
    if (data) {
      if (!data.descriptorSetLayout) {
        error('descriptor set layout not initialized');
        return null;
      }
      return data.descriptorSetLayout;
    }
    return null;
  }
  function getProgramID(lg, phaseID, programName) {
    assert(phaseID !== lg.N);
    const phase = lg.j(phaseID);
    const programID = phase.shaderIndex.get(programName);
    if (programID === undefined) {
      return INVALID_ID;
    }
    return programID;
  }
  function getDescriptorNameID(lg, name) {
    const nameID = lg.attributeIndex.get(name);
    if (nameID === undefined) {
      return INVALID_ID;
    }
    return nameID;
  }
  function getDescriptorName(lg, nameID) {
    if (nameID >= lg.valueNames.length) {
      return '';
    }
    return lg.valueNames[nameID];
  }
  function getPerPassDescriptorSetLayoutData(lg, subpassOrPassID) {
    assert(subpassOrPassID !== lg.N);
    const node = lg.getLayout(subpassOrPassID);
    const set = node.getSet(UpdateFrequency.PER_PASS);
    if (set === undefined) {
      return null;
    }
    return set.descriptorSetLayoutData;
  }
  function getPerPhaseDescriptorSetLayoutData(lg, phaseID) {
    assert(phaseID !== lg.N);
    const node = lg.getLayout(phaseID);
    const set = node.getSet(UpdateFrequency.PER_PHASE);
    if (set === undefined) {
      return null;
    }
    return set.descriptorSetLayoutData;
  }
  function getPerBatchDescriptorSetLayoutData(lg, phaseID, programID) {
    assert(phaseID !== lg.N);
    const phase = lg.j(phaseID);
    assert(programID < phase.shaderPrograms.length);
    const program = phase.shaderPrograms[programID];
    const set = program.layout.getSet(UpdateFrequency.PER_BATCH);
    if (set === undefined) {
      return null;
    }
    return set.descriptorSetLayoutData;
  }
  function getPerInstanceDescriptorSetLayoutData(lg, phaseID, programID) {
    assert(phaseID !== lg.N);
    const phase = lg.j(phaseID);
    assert(programID < phase.shaderPrograms.length);
    const program = phase.shaderPrograms[programID];
    const set = program.layout.getSet(UpdateFrequency.PER_INSTANCE);
    if (set === undefined) {
      return null;
    }
    return set.descriptorSetLayoutData;
  }
  function getBinding(layout, nameID) {
    const binding = layout.bindingMap.get(nameID);
    if (binding === undefined) {
      return 0xFFFFFFFF;
    }
    return binding;
  }
  _export({
    getGfxDescriptorType: getGfxDescriptorType,
    getDescriptorTypeOrder: getDescriptorTypeOrder,
    getCustomPassID: getCustomPassID,
    getCustomSubpassID: getCustomSubpassID,
    getCustomPhaseID: getCustomPhaseID,
    getUniformBlockSize: getUniformBlockSize,
    sortDescriptorBlocks: sortDescriptorBlocks,
    sortDescriptorGroupBlocks: sortDescriptorGroupBlocks,
    getOrCreateDescriptorID: getOrCreateDescriptorID,
    createGfxDescriptorSetsAndPipelines: createGfxDescriptorSetsAndPipelines,
    makeDescriptorSetLayoutData: makeDescriptorSetLayoutData,
    initializeDescriptorSetLayoutInfo: initializeDescriptorSetLayoutInfo,
    populatePipelineLayoutInfo: populatePipelineLayoutInfo,
    generateConstantMacros: generateConstantMacros,
    initializeLayoutGraphData: initializeLayoutGraphData,
    terminateLayoutGraphData: terminateLayoutGraphData,
    getEmptyDescriptorSetLayout: getEmptyDescriptorSetLayout,
    getEmptyPipelineLayout: getEmptyPipelineLayout,
    getOrCreateDescriptorSetLayout: getOrCreateDescriptorSetLayout,
    getDescriptorSetLayout: getDescriptorSetLayout,
    getProgramID: getProgramID,
    getDescriptorNameID: getDescriptorNameID,
    getDescriptorName: getDescriptorName,
    getPerPassDescriptorSetLayoutData: getPerPassDescriptorSetLayoutData,
    getPerPhaseDescriptorSetLayoutData: getPerPhaseDescriptorSetLayoutData,
    getPerBatchDescriptorSetLayoutData: getPerBatchDescriptorSetLayoutData,
    getPerInstanceDescriptorSetLayoutData: getPerInstanceDescriptorSetLayoutData,
    getBinding: getBinding
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      COCOS_RUNTIME = _virtualInternal253AconstantsJs.COCOS_RUNTIME;
      HTML5 = _virtualInternal253AconstantsJs.HTML5;
    }, function (_coreIndexJs) {
      assert = _coreIndexJs.assert;
      error = _coreIndexJs.error;
      warn = _coreIndexJs.warn;
    }, function (_gfxIndexJs) {
      API = _gfxIndexJs.API;
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      DescriptorSetLayoutBinding = _gfxIndexJs.DescriptorSetLayoutBinding;
      DescriptorSetLayoutInfo = _gfxIndexJs.DescriptorSetLayoutInfo;
      DescriptorType = _gfxIndexJs.DescriptorType;
      Feature = _gfxIndexJs.Feature;
      Format = _gfxIndexJs.Format;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
      GetTypeSize = _gfxIndexJs.GetTypeSize;
      MemoryAccessBit = _gfxIndexJs.MemoryAccessBit;
      PipelineLayoutInfo = _gfxIndexJs.PipelineLayoutInfo;
      SampleType = _gfxIndexJs.SampleType;
      Type = _gfxIndexJs.Type;
      UniformBlock = _gfxIndexJs.UniformBlock;
      ViewDimension = _gfxIndexJs.ViewDimension;
    }, function (_defineJs) {
      UBOForwardLightEnum = _defineJs.UBOForwardLightEnum;
      UBOSkinning = _defineJs.UBOSkinning;
    }, function (_layoutGraphJs) {
      DescriptorBlockData = _layoutGraphJs.DescriptorBlockData;
      DescriptorData = _layoutGraphJs.DescriptorData;
      DescriptorSetLayoutData = _layoutGraphJs.DescriptorSetLayoutData;
      DescriptorTypeOrder = _layoutGraphJs.DescriptorTypeOrder;
      Layout = _layoutGraphJs.Layout;
      LayoutGraphDataValue = _layoutGraphJs.LayoutGraphDataValue;
      LayoutType = _layoutGraphJs.LayoutType;
    }, function (_typesJs) {
      ParameterType = _typesJs.ParameterType;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }],
    execute: function () {
      /****************************************************************************
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      ****************************************************************************/
      /* eslint-disable max-len */
      _export("INVALID_ID", INVALID_ID = 0xFFFFFFFF);
      _export("ENABLE_SUBPASS", ENABLE_SUBPASS = true);
      _export("DEFAULT_UNIFORM_COUNTS", DEFAULT_UNIFORM_COUNTS = new Map([['cc_lightPos', UBOForwardLightEnum.LIGHTS_PER_PASS], ['cc_lightColor', UBOForwardLightEnum.LIGHTS_PER_PASS], ['cc_lightSizeRangeAngle', UBOForwardLightEnum.LIGHTS_PER_PASS], ['cc_lightDir', UBOForwardLightEnum.LIGHTS_PER_PASS], ['cc_lightBoundingSizeVS', UBOForwardLightEnum.LIGHTS_PER_PASS]]));
      _export("DYNAMIC_UNIFORM_BLOCK", DYNAMIC_UNIFORM_BLOCK = new Set(['CCCamera', 'CCForwardLight', 'CCUILocal']));
    }
  };
});