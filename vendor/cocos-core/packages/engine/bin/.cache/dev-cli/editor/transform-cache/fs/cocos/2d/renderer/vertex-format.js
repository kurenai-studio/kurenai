System.register("q-bundled:///fs/cocos/2d/renderer/vertex-format.js", ["../../gfx/index.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var AttributeName, Format, FormatInfos, Attribute, cclegacy, ATTR_POSITION, ATTR_COLOR, ATTR_TEX_COORD, ATTR_COLOR2, vfmt, vfmtPosColor, vfmtPosUvColor, vfmtPosUvColor4B, vfmtPosUvTwoColor, vfmtPosUvTwoColor4B;
  /**
   * @en Get total components count for all attributes per vertex.
   * @zh 获取每个顶点上所有属性的分量数总和
   * @param attrs All attributes of the vertex format
   * @returns Total components count
   */
  function getComponentPerVertex(attrs) {
    let count = 0;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const info = FormatInfos[attr.format];
      count += info.count;
    }
    return count;
  }

  /**
   * @en Get total stride for all attributes per vertex.
   * @zh 获取每个顶点上所有属性的总步进
   * @param attrs All attributes of the vertex format
   * @returns Total stride
   */
  function getAttributeStride(attrs) {
    let count = 0;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const info = FormatInfos[attr.format];
      count += info.size;
    }
    return count;
  }
  _export({
    getComponentPerVertex: getComponentPerVertex,
    getAttributeStride: getAttributeStride
  });
  return {
    setters: [function (_gfxIndexJs) {
      AttributeName = _gfxIndexJs.AttributeName;
      Format = _gfxIndexJs.Format;
      FormatInfos = _gfxIndexJs.FormatInfos;
      Attribute = _gfxIndexJs.Attribute;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      */
      ATTR_POSITION = AttributeName.ATTR_POSITION;
      ATTR_COLOR = AttributeName.ATTR_COLOR;
      ATTR_TEX_COORD = AttributeName.ATTR_TEX_COORD;
      ATTR_COLOR2 = AttributeName.ATTR_COLOR2;
      /**
       * @en Vertex format with vector 3 position attribute
       * @zh 包含三维位置属性的顶点格式
       */
      _export("vfmt", vfmt = [new Attribute(ATTR_POSITION, Format.RGB32F)]);
      /**
       * @en Vertex format with the following layout.
       * 1. Vector 3 position attribute (Float32)
       * 2. Vector 4 color attribute (Float32)
       * @zh 包含以下数据的顶点格式
       * 1. 三维位置属性（Float32）
       * 2. RGBA 颜色属性（Float32）
       */
      _export("vfmtPosColor", vfmtPosColor = [new Attribute(ATTR_POSITION, Format.RGB32F), new Attribute(ATTR_COLOR, Format.RGBA32F)]);
      /**
       * @en Vertex format with the following layout
       * 1. Vector 3 position attribute (Float32)
       * 2. Vector 2 uv attribute (Float32)
       * 3. Vector 4 color attribute (Float32)
       * @zh 包含以下数据的顶点格式
       * 1. 三维位置属性（Float32）
       * 2. 二维贴图 UV 属性（Float32）
       * 3. RGBA 颜色属性（Float32）
       */
      _export("vfmtPosUvColor", vfmtPosUvColor = [new Attribute(ATTR_POSITION, Format.RGB32F), new Attribute(ATTR_TEX_COORD, Format.RG32F), new Attribute(ATTR_COLOR, Format.RGBA32F)]);
      /**
       * @en Vertex format with the following layout
       * 1. Vector 3 position attribute (Float32)
       * 2. Vector 2 uv attribute (Float32)
       * 3. Byte 4 color attribute (Byte)
       * @zh 包含以下数据的顶点格式
       * 1. 三维位置属性（Float32）
       * 2. 二维贴图 UV 属性（Float32）
       * 3. RGBA 颜色属性（Byte）
       */
      _export("vfmtPosUvColor4B", vfmtPosUvColor4B = [new Attribute(ATTR_POSITION, Format.RGB32F), new Attribute(ATTR_TEX_COORD, Format.RG32F), new Attribute(ATTR_COLOR, Format.RGBA8, true)]);
      /**
       * @en Vertex format with the following layout
       * 1. Vector 3 position attribute (Float32)
       * 2. Vector 2 uv attribute (Float32)
       * 3. First vector 4 color attribute (Float32)
       * 4. Second vector 4 color attribute (Float32)
       * @zh 包含以下数据的顶点格式
       * 1. 三维位置属性（Float32）
       * 2. 二维贴图 UV 属性（Float32）
       * 3. 第一套 RGBA 颜色属性（Float32）
       * 4. 第二套 RGBA 颜色属性（Float32）
       */
      _export("vfmtPosUvTwoColor", vfmtPosUvTwoColor = [new Attribute(ATTR_POSITION, Format.RGB32F), new Attribute(ATTR_TEX_COORD, Format.RG32F), new Attribute(ATTR_COLOR, Format.RGBA32F), new Attribute(ATTR_COLOR2, Format.RGBA32F)]);
      /**
       * @en Vertex format with the following layout
       * 1. Vector 3 position attribute (Float32)
       * 2. Vector 2 uv attribute (Float32)
       * 3. First byte 4 color attribute (Byte)
       * 4. Second byte 4 color attribute (Byte)
       * @zh 包含以下数据的顶点格式
       * 1. 三维位置属性（Float32）
       * 2. 二维贴图 UV 属性（Float32）
       * 3. 第一套 RGBA 颜色属性（Byte）
       * 4. 第二套 RGBA 颜色属性（Byte）
       */
      _export("vfmtPosUvTwoColor4B", vfmtPosUvTwoColor4B = [new Attribute(ATTR_POSITION, Format.RGB32F), new Attribute(ATTR_TEX_COORD, Format.RG32F), new Attribute(ATTR_COLOR, Format.RGBA8, true), new Attribute(ATTR_COLOR2, Format.RGBA8, true)]);
      cclegacy.internal.vfmtPosUvColor = vfmtPosUvColor;
      cclegacy.internal.vfmtPosUvTwoColor = vfmtPosUvTwoColor;
      cclegacy.internal.vfmtPosUvColor4B = vfmtPosUvColor4B;
      cclegacy.internal.vfmtPosUvTwoColor4B = vfmtPosUvTwoColor4B;
    }
  };
});