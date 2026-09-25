System.register("q-bundled:///fs/cocos/render-scene/core/program-utils.js", ["../../core/platform/debug.js", "../../gfx/base/define.js", "../../rendering/define.js", "./pass-utils.js"], function (_export, _context) {
  "use strict";

  var errorID, warnID, GetTypeSize, UBOForwardLightEnum, UBOSkinning, genHandle, defaultUniformCounts;
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

  function mapDefine(info, def) {
    switch (info.type) {
      case 'boolean':
        return typeof def === 'number' ? def.toString() : def ? '1' : '0';
      case 'string':
        return def !== undefined ? def : info.options[0];
      case 'number':
        return def !== undefined ? def.toString() : info.range[0].toString();
      default:
        warnID(16369);
        return '-1';
      // should neven happen
    }
  }
  function prepareDefines(defs, tDefs) {
    const macros = [];
    for (let i = 0; i < tDefs.length; i++) {
      const tmpl = tDefs[i];
      const name = tmpl.name;
      const v = defs[name];
      const value = mapDefine(tmpl, v);
      const isDefault = !v || v === '0';
      macros.push({
        name,
        value,
        isDefault
      });
    }
    return macros;
  }
  function getShaderInstanceName(name, macros) {
    return name + macros.reduce((acc, cur) => cur.isDefault ? acc : `${acc}|${cur.name}${cur.value}`, '');
  }
  function dependencyCheck(dependencies, defines) {
    for (let i = 0; i < dependencies.length; i++) {
      const d = dependencies[i];
      if (d[0] === '!') {
        // negative dependency
        if (defines[d.slice(1)]) {
          return false;
        }
      } else if (!defines[d]) {
        return false;
      }
    }
    return true;
  }
  function getActiveAttributes(tmpl, gfxAttributes, defines) {
    const out = [];
    const attributes = tmpl.attributes;
    for (let i = 0; i < attributes.length; i++) {
      if (!dependencyCheck(attributes[i].defines, defines)) {
        continue;
      }
      out.push(gfxAttributes[i]);
    }
    return out;
  }
  function getVariantKey(programInfo, defines) {
    const tmplDefs = programInfo.defines;
    if (programInfo.uber) {
      let key = '';
      for (let i = 0; i < tmplDefs.length; i++) {
        const tmplDef = tmplDefs[i];
        const value = defines[tmplDef.name];
        if (!value || !tmplDef._map) {
          continue;
        }
        const mapped = tmplDef._map(value);
        const offset = tmplDef._offset;
        key += `${offset}${mapped}|`;
      }
      return `${key}${programInfo.hash}`;
    }
    let key = 0;
    for (let i = 0; i < tmplDefs.length; i++) {
      const tmplDef = tmplDefs[i];
      const value = defines[tmplDef.name];
      if (!value || !tmplDef._map) {
        continue;
      }
      const mapped = tmplDef._map(value);
      const offset = tmplDef._offset;
      key |= mapped << offset;
    }
    return `${key.toString(16)}|${programInfo.hash}`;
  }
  function getUniformSize(prevSize, m) {
    if (m.count) {
      return prevSize + GetTypeSize(m.type) * m.count;
    } else {
      const count = defaultUniformCounts.get(m.name);
      if (count !== undefined) {
        return prevSize + GetTypeSize(m.type) * count;
      }
      errorID(16345, m.name);
    }
    return prevSize;
  }
  function getSize(blockMembers) {
    return blockMembers.reduce(getUniformSize, 0);
  }
  function genHandles(tmpl) {
    const handleMap = {};
    // block member handles
    for (let i = 0; i < tmpl.blocks.length; i++) {
      const block = tmpl.blocks[i];
      const members = block.members;
      let offset = 0;
      for (let j = 0; j < members.length; j++) {
        const uniform = members[j];
        handleMap[uniform.name] = genHandle(block.binding, uniform.type, uniform.count, offset);
        offset += (GetTypeSize(uniform.type) >> 2) * uniform.count; // assumes no implicit padding, which is guaranteed by effect compiler
      }
    }
    // samplerTexture handles
    for (let i = 0; i < tmpl.samplerTextures.length; i++) {
      const samplerTexture = tmpl.samplerTextures[i];
      handleMap[samplerTexture.name] = genHandle(samplerTexture.binding, samplerTexture.type, samplerTexture.count);
    }
    return handleMap;
  }
  function getBitCount(cnt) {
    return Math.ceil(Math.log2(Math.max(cnt, 2)));
  }
  function populateMacros(tmpl) {
    // calculate option mask offset
    let offset = 0;
    for (let i = 0; i < tmpl.defines.length; i++) {
      const def = tmpl.defines[i];
      let cnt = 1;
      if (def.type === 'number') {
        const range = def.range;
        cnt = getBitCount(range[1] - range[0] + 1); // inclusive on both ends
        def._map = value => value - range[0];
      } else if (def.type === 'string') {
        cnt = getBitCount(def.options.length);
        def._map = value => Math.max(0, def.options.findIndex(s => s === value));
      } else if (def.type === 'boolean') {
        def._map = value => value ? 1 : 0;
      }
      def._offset = offset;
      offset += cnt;
    }
    if (offset > 31) {
      tmpl.uber = true;
    }
    // generate constant macros
    tmpl.constantMacros = '';
    for (const key in tmpl.builtins.statistics) {
      tmpl.constantMacros += `#define ${key} ${tmpl.builtins.statistics[key]}\n`;
    }
  }
  function getCombinationDefines(combination) {
    const defines = Object.keys(combination).reduce((out, name) => out.reduce((acc, cur) => {
      const choices = combination[name];
      for (let i = 0; i < choices.length; ++i) {
        const defines = {
          ...cur
        };
        defines[name] = choices[i];
        acc.push(defines);
      }
      return acc;
    }, []), [{}]);
    return defines;
  }
  function addEffectDefaultProperties(effect) {
    for (let i = 0; i < effect.techniques.length; i++) {
      const tech = effect.techniques[i];
      for (let j = 0; j < tech.passes.length; j++) {
        const pass = tech.passes[j];
        // grab default property declaration if there is none
        if (pass.propertyIndex !== undefined && pass.properties === undefined) {
          pass.properties = tech.passes[pass.propertyIndex].properties;
        }
      }
    }
  }
  _export({
    prepareDefines: prepareDefines,
    getShaderInstanceName: getShaderInstanceName,
    getActiveAttributes: getActiveAttributes,
    getVariantKey: getVariantKey,
    getSize: getSize,
    genHandles: genHandles,
    populateMacros: populateMacros,
    getCombinationDefines: getCombinationDefines,
    addEffectDefaultProperties: addEffectDefaultProperties
  });
  return {
    setters: [function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
      warnID = _corePlatformDebugJs.warnID;
    }, function (_gfxBaseDefineJs) {
      GetTypeSize = _gfxBaseDefineJs.GetTypeSize;
    }, function (_renderingDefineJs) {
      UBOForwardLightEnum = _renderingDefineJs.UBOForwardLightEnum;
      UBOSkinning = _renderingDefineJs.UBOSkinning;
    }, function (_passUtilsJs) {
      genHandle = _passUtilsJs.genHandle;
    }],
    execute: function () {
      defaultUniformCounts = new Map();
      defaultUniformCounts.set('cc_joints', UBOSkinning.LAYOUT.members[0].count);
      defaultUniformCounts.set('cc_lightPos', UBOForwardLightEnum.LIGHTS_PER_PASS);
      defaultUniformCounts.set('cc_lightColor', UBOForwardLightEnum.LIGHTS_PER_PASS);
      defaultUniformCounts.set('cc_lightSizeRangeAngle', UBOForwardLightEnum.LIGHTS_PER_PASS);
      defaultUniformCounts.set('cc_lightDir', UBOForwardLightEnum.LIGHTS_PER_PASS);
      defaultUniformCounts.set('cc_lightBoundingSizeVS', UBOForwardLightEnum.LIGHTS_PER_PASS);
    }
  };
});