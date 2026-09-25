System.register("q-bundled:///fs/cocos/scene-graph/node-enum.js", ["../core/global-exports.js", "../core/value-types/index.js"], function (_export, _context) {
  "use strict";

  var legacyCC, Enum, NodeSpace, TransformBit, MobilityMode;
  return {
    setters: [function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @en Node's coordinate space
       * @zh 节点的坐标空间
       */
      _export("NodeSpace", NodeSpace = /*#__PURE__*/function (NodeSpace) {
        NodeSpace[NodeSpace["LOCAL"] = 0] = "LOCAL";
        NodeSpace[NodeSpace["WORLD"] = 1] = "WORLD";
        return NodeSpace;
      }({}));
      /**
       * @en Bit masks for node's transformation
       * @zh 节点的空间变换位标记
       */
      _export("TransformBit", TransformBit = function (TransformBit) {
        /**
         * @en No change
         * @zh 无改变
         */
        TransformBit[TransformBit["NONE"] = 0] = "NONE";
        /**
         * @en Translation changed
         * @zh 节点位置改变
         */
        TransformBit[TransformBit["POSITION"] = 1] = "POSITION";
        /**
         * @en Rotation changed
         * @zh 节点旋转
         */
        TransformBit[TransformBit["ROTATION"] = 2] = "ROTATION";
        /**
         * @en Scale changed
         * @zh 节点缩放
         */
        TransformBit[TransformBit["SCALE"] = 4] = "SCALE";
        /**
         * @en Skew changed
         * @zh 节点斜切
         */
        TransformBit[TransformBit["SKEW"] = 8] = "SKEW";
        /**
         * @en Rotation or scale changed
         * @zh 节点旋转及缩放
         */
        TransformBit[TransformBit["RS"] = TransformBit.ROTATION | TransformBit.SCALE] = "RS";
        /**
         * @en Rotation, scale or skew changed
         */
        TransformBit[TransformBit["RSS"] = TransformBit.ROTATION | TransformBit.SCALE | TransformBit.SKEW] = "RSS";
        /**
         * @en Translation, rotation or scale changed
         * @zh 节点平移，旋转及缩放
         */
        TransformBit[TransformBit["TRS"] = TransformBit.POSITION | TransformBit.ROTATION | TransformBit.SCALE] = "TRS";
        /**
         * @en Invert mask of [[TRS]]
         * @zh [[TRS]] 的反向掩码
         */
        TransformBit[TransformBit["TRS_MASK"] = ~TransformBit.TRS] = "TRS_MASK";
        return TransformBit;
      }({}));
      legacyCC.internal.TransformBit = TransformBit;

      /**
       * @en Node's mobility
       * @zh 节点的移动性
       */
      _export("MobilityMode", MobilityMode = Enum({
        /**
         * @en Static node
         * @zh 静态节点
         */
        Static: 0,
        /**
         * @en Stationary node
         * @zh 固定节点
         */
        Stationary: 1,
        /**
         * @en Movable node
         * @zh 可移动节点
         */
        Movable: 2
      }));
    }
  };
});