System.register("q-bundled:///fs/cocos/asset/assets/asset-enum.js", ["../../gfx/index.js"], function (_export, _context) {
  "use strict";

  var Address, Filter, Format, CustomPixelFormat, PixelFormat, WrapMode, TextureFilter;
  return {
    setters: [function (_gfxIndexJs) {
      Address = _gfxIndexJs.Address;
      Filter = _gfxIndexJs.Filter;
      Format = _gfxIndexJs.Format;
    }],
    execute: function () {
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
      // define a specified number for the pixel format which gfx do not have a standard definition.
      CustomPixelFormat = /*#__PURE__*/function (CustomPixelFormat) {
        CustomPixelFormat[CustomPixelFormat["VALUE"] = 1024] = "VALUE";
        return CustomPixelFormat;
      }(CustomPixelFormat || {});
      /**
       * @en
       * The texture pixel format, default value is RGBA8888,<br>
       * you should note that textures loaded by normal image files (png, jpg) can only support RGBA8888 format,<br>
       * other formats are supported by compressed file types or raw data.
       * @zh
       * 纹理像素格式，默认值为RGBA8888，<br>
       * 你应该注意到普通图像文件（png，jpg）加载的纹理只能支持RGBA8888格式，<br>
       * 压缩文件类型或原始数据支持其他格式。
       */
      _export("PixelFormat", PixelFormat = function (PixelFormat) {
        /**
         * @en
         * 16-bit pixel format containing red, green and blue channels
         * @zh
         * 包含 RGB 通道的 16 位纹理。
         */
        PixelFormat[PixelFormat["RGB565"] = Format.R5G6B5] = "RGB565";
        /**
         * @en
         * 16-bit pixel format containing red, green, blue channels with 5 bits per channel and one bit alpha channel: RGB5A1
         * @zh
         * 包含 RGB（分别占 5 bits）和 1 bit 的 alpha 通道的 16 位纹理：RGB5A1。
         */
        PixelFormat[PixelFormat["RGB5A1"] = Format.RGB5A1] = "RGB5A1";
        /**
         * @en
         * 16-bit pixel format containing red, green, blue and alpha channels: RGBA4444
         * @zh
         * 包含 RGBA 通道的 16 位纹理：RGBA4444。
         */
        PixelFormat[PixelFormat["RGBA4444"] = Format.RGBA4] = "RGBA4444";
        /**
         * @en
         * 24-bit pixel format containing red, green and blue channels: RGB888
         * @zh
         * 包含 RGB 通道的 24 位纹理：RGB888。
         */
        PixelFormat[PixelFormat["RGB888"] = Format.RGB8] = "RGB888";
        /**
         * @en
         * 32-bit float pixel format containing red, green and blue channels: RGBA32F
         * @zh
         * 包含 RGB 通道的 32 位浮点数像素格式：RGBA32F。
         */
        PixelFormat[PixelFormat["RGB32F"] = Format.RGB32F] = "RGB32F";
        /**
         * @en
         * 32-bit pixel format containing red, green, blue and alpha channels: RGBA8888
         * @zh
         * 包含 RGBA 四通道的 32 位整形像素格式：RGBA8888。
         */
        PixelFormat[PixelFormat["RGBA8888"] = Format.RGBA8] = "RGBA8888";
        /**
         * @en
         * 32-bit pixel format containing blue, green, red, and alpha channels: BGRA8888
         * @zh
         * 包含 BGRA 四通道的 32 位整形像素格式：BGRA8888。
         */
        PixelFormat[PixelFormat["BGRA8888"] = Format.BGRA8] = "BGRA8888";
        /**
         * @en
         * 32-bit float pixel format containing red, green, blue and alpha channels: RGBA32F
         * @zh
         * 32位浮点数像素格式：RGBA32F。
         */
        PixelFormat[PixelFormat["RGBA32F"] = Format.RGBA32F] = "RGBA32F";
        /**
         * @en
         * 8-bit pixel format used as masks
         * @zh
         * 用作蒙版的8位纹理。
         */
        PixelFormat[PixelFormat["A8"] = Format.A8] = "A8";
        /**
         * @en
         * 8-bit intensity pixel format
         * @zh
         * 8位强度纹理。
         */
        PixelFormat[PixelFormat["I8"] = Format.L8] = "I8";
        /**
         * @en
         * 16-bit pixel format used as masks
         * @zh
         * 用作蒙版的16位纹理。
         */
        PixelFormat[PixelFormat["AI8"] = Format.LA8] = "AI8";
        /**
         * @en A pixel format containing red, green, and blue channels that is PVR 2bpp compressed.
         * @zh 包含 RGB 通道的 PVR 2BPP 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGB_PVRTC_2BPPV1"] = Format.PVRTC_RGB2] = "RGB_PVRTC_2BPPV1";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is PVR 2bpp compressed.
         * @zh 包含 RGBA 通道的 PVR 2BPP 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGBA_PVRTC_2BPPV1"] = Format.PVRTC_RGBA2] = "RGBA_PVRTC_2BPPV1";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is PVR 2bpp compressed.
         * RGB_A_PVRTC_2BPPV1 texture is a 2x height RGB_PVRTC_2BPPV1 format texture.
         * It separate the origin alpha channel to the bottom half atlas, the origin rgb channel to the top half atlas.
         * @zh 包含 RGBA 通道的 PVR 2BPP 压缩纹理格式
         * 这种压缩纹理格式贴图的高度是普通 RGB_PVRTC_2BPPV1 贴图高度的两倍，使用上半部分作为原始 RGB 通道数据，下半部分用来存储透明通道数据。
         */
        PixelFormat[PixelFormat["RGB_A_PVRTC_2BPPV1"] = 1024] = "RGB_A_PVRTC_2BPPV1";
        /**
         * @en A pixel format containing red, green, and blue channels that is PVR 4bpp compressed.
         * @zh 包含 RGB 通道的 PVR 4BPP 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGB_PVRTC_4BPPV1"] = Format.PVRTC_RGB4] = "RGB_PVRTC_4BPPV1";
        /**
         * @en A pixel format containing red, green, blue and alpha channels that is PVR 4bpp compressed.
         * @zh 包含 RGBA 通道的 PVR 4BPP 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGBA_PVRTC_4BPPV1"] = Format.PVRTC_RGBA4] = "RGBA_PVRTC_4BPPV1";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is PVR 4bpp compressed.
         * RGB_A_PVRTC_4BPPV1 texture is a 2x height RGB_PVRTC_4BPPV1 format texture.
         * It separate the origin alpha channel to the bottom half atlas, the origin rgb channel to the top half atlas.
         * @zh 包含 RGBA 通道的 PVR 4BPP 压缩纹理格式
        * 这种压缩纹理格式贴图的高度是普通 RGB_PVRTC_4BPPV1 贴图高度的两倍，使用上半部分作为原始 RGB 通道数据，下半部分用来存储透明通道数据。
         */
        PixelFormat[PixelFormat["RGB_A_PVRTC_4BPPV1"] = 1025] = "RGB_A_PVRTC_4BPPV1";
        /**
         * @en A pixel format containing red, green, and blue channels that is ETC1 compressed.
         * @zh 包含 RGB 通道的 ETC1 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGB_ETC1"] = Format.ETC_RGB8] = "RGB_ETC1";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ETC1 compressed.
         * @zh 包含 RGBA 通道的 ETC1 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGBA_ETC1"] = 1026] = "RGBA_ETC1";
        /**
         * @en A pixel format containing red, green, and blue channels that is ETC2 compressed.
         * @zh 包含 RGB 通道的 ETC2 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGB_ETC2"] = Format.ETC2_RGB8] = "RGB_ETC2";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ETC2 compressed.
         * @zh 包含 RGBA 通道的 ETC2 压缩纹理格式
         */
        PixelFormat[PixelFormat["RGBA_ETC2"] = Format.ETC2_RGBA8] = "RGBA_ETC2";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 4x4 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 4x4
         */
        PixelFormat[PixelFormat["RGBA_ASTC_4x4"] = Format.ASTC_RGBA_4X4] = "RGBA_ASTC_4x4";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 5x4 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 5x4
         */
        PixelFormat[PixelFormat["RGBA_ASTC_5x4"] = Format.ASTC_RGBA_5X4] = "RGBA_ASTC_5x4";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 5x5 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 5x5
         */
        PixelFormat[PixelFormat["RGBA_ASTC_5x5"] = Format.ASTC_RGBA_5X5] = "RGBA_ASTC_5x5";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 6x5 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 6x5
         */
        PixelFormat[PixelFormat["RGBA_ASTC_6x5"] = Format.ASTC_RGBA_6X5] = "RGBA_ASTC_6x5";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 6x6 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 6x6
         */
        PixelFormat[PixelFormat["RGBA_ASTC_6x6"] = Format.ASTC_RGBA_6X6] = "RGBA_ASTC_6x6";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 8x5 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 8x5
         */
        PixelFormat[PixelFormat["RGBA_ASTC_8x5"] = Format.ASTC_RGBA_8X5] = "RGBA_ASTC_8x5";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 8x6 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 8x6
         */
        PixelFormat[PixelFormat["RGBA_ASTC_8x6"] = Format.ASTC_RGBA_8X6] = "RGBA_ASTC_8x6";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 8x8 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 8x8
         */
        PixelFormat[PixelFormat["RGBA_ASTC_8x8"] = Format.ASTC_RGBA_8X8] = "RGBA_ASTC_8x8";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 10x5 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 10x5
         */
        PixelFormat[PixelFormat["RGBA_ASTC_10x5"] = Format.ASTC_RGBA_10X5] = "RGBA_ASTC_10x5";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 10x6 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 10x6
         */
        PixelFormat[PixelFormat["RGBA_ASTC_10x6"] = Format.ASTC_RGBA_10X6] = "RGBA_ASTC_10x6";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 10x8 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 10x8
         */
        PixelFormat[PixelFormat["RGBA_ASTC_10x8"] = Format.ASTC_RGBA_10X8] = "RGBA_ASTC_10x8";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 10x10 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 10x10
         */
        PixelFormat[PixelFormat["RGBA_ASTC_10x10"] = Format.ASTC_RGBA_10X10] = "RGBA_ASTC_10x10";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 12x10 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 12x10
         */
        PixelFormat[PixelFormat["RGBA_ASTC_12x10"] = Format.ASTC_RGBA_12X10] = "RGBA_ASTC_12x10";
        /**
         * @en A pixel format containing red, green, blue, and alpha channels that is ASTC compressed with 12x12 block size.
         * @zh 包含 RGBA 通道的 ASTC 压缩纹理格式，压缩分块大小为 12x12
         */
        PixelFormat[PixelFormat["RGBA_ASTC_12x12"] = Format.ASTC_RGBA_12X12] = "RGBA_ASTC_12x12";
        return PixelFormat;
      }({}));
      /**
       * @en
       * The texture wrap mode.
       * @zh
       * 纹理环绕方式。
       */
      _export("WrapMode", WrapMode = function (WrapMode) {
        /**
         * @en
         * Specifies that the repeat warp mode will be used.
         * @zh
         * 指定环绕模式：重复纹理图像。
         */
        WrapMode[WrapMode["REPEAT"] = Address.WRAP] = "REPEAT";
        /**
         * @en
         * Specifies that the clamp to edge warp mode will be used.
         * @zh
         * 指定环绕模式：纹理边缘拉伸效果。
         */
        WrapMode[WrapMode["CLAMP_TO_EDGE"] = Address.CLAMP] = "CLAMP_TO_EDGE";
        /**
         * @en
         * Specifies that the mirrored repeat warp mode will be used.
         * @zh
         * 指定环绕模式：以镜像模式重复纹理图像。
         */
        WrapMode[WrapMode["MIRRORED_REPEAT"] = Address.MIRROR] = "MIRRORED_REPEAT";
        /**
         * @en
         * Specifies that the  clamp to border wrap mode will be used.
         * @zh
         * 指定环绕模式：超出纹理坐标部分以用户指定颜色填充。
         */
        WrapMode[WrapMode["CLAMP_TO_BORDER"] = Address.BORDER] = "CLAMP_TO_BORDER";
        return WrapMode;
      }({}));
      /**
       * @en
       * The texture filter mode
       * @zh
       * 纹理过滤模式。
       */
      _export("Filter", _export("TextureFilter", TextureFilter = function (TextureFilter) {
        TextureFilter[TextureFilter["NONE"] = Filter.NONE] = "NONE";
        /**
         * @en
         * Specifies linear filtering.
         * @zh
         * 线性过滤模式。
         */
        TextureFilter[TextureFilter["LINEAR"] = Filter.LINEAR] = "LINEAR";
        /**
         * @en
         * Specifies nearest filtering.
         * @zh
         * 临近过滤模式。
         */
        TextureFilter[TextureFilter["NEAREST"] = Filter.POINT] = "NEAREST";
        return TextureFilter;
      }({})));
    }
  };
});