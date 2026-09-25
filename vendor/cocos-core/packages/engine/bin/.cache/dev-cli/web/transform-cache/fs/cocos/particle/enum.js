System.register("q-bundled:///fs/cocos/particle/enum.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var Enum, ParticleSpace, ParticleCullingMode, ParticleAlignmentSpace, ParticleRenderMode, ParticleShapeType, ParticleEmitLocation, ParticleArcMode, ParticleTrailMode, ParticleTextureMode, ParticleModuleRandSeed;
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
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
      _export("ParticleSpace", ParticleSpace = /*#__PURE__*/function (ParticleSpace) {
        ParticleSpace[ParticleSpace["World"] = 0] = "World";
        ParticleSpace[ParticleSpace["Local"] = 1] = "Local";
        ParticleSpace[ParticleSpace["Custom"] = 2] = "Custom";
        return ParticleSpace;
      }({}));
      Enum(ParticleSpace);

      /**
       * @en Particle emitter culling mode
       * @zh 粒子的剔除模式。
       * @enum ParticleSystem.CullingMode
       */
      _export("ParticleCullingMode", ParticleCullingMode = /*#__PURE__*/function (ParticleCullingMode) {
        ParticleCullingMode[ParticleCullingMode["Pause"] = 0] = "Pause";
        ParticleCullingMode[ParticleCullingMode["PauseAndCatchup"] = 1] = "PauseAndCatchup";
        ParticleCullingMode[ParticleCullingMode["AlwaysSimulate"] = 2] = "AlwaysSimulate";
        return ParticleCullingMode;
      }({}));
      Enum(ParticleCullingMode);

      /**
       * @en Particle emitter alignment space
       * @zh 粒子的对齐模式。
       * @enum ParticleSystemRenderer.AlignmentSpace
       */
      _export("ParticleAlignmentSpace", ParticleAlignmentSpace = /*#__PURE__*/function (ParticleAlignmentSpace) {
        ParticleAlignmentSpace[ParticleAlignmentSpace["World"] = 0] = "World";
        ParticleAlignmentSpace[ParticleAlignmentSpace["Local"] = 1] = "Local";
        ParticleAlignmentSpace[ParticleAlignmentSpace["View"] = 2] = "View";
        return ParticleAlignmentSpace;
      }({}));
      Enum(ParticleAlignmentSpace);

      /**
       * 粒子的生成模式。
       * @enum ParticleSystemRenderer.RenderMode
       */
      _export("ParticleRenderMode", ParticleRenderMode = /*#__PURE__*/function (ParticleRenderMode) {
        /**
         * 粒子始终面向摄像机。
         */
        ParticleRenderMode[ParticleRenderMode["Billboard"] = 0] = "Billboard";
        /**
         * 粒子始终面向摄像机但会根据参数进行拉伸。
         */
        ParticleRenderMode[ParticleRenderMode["StrecthedBillboard"] = 1] = "StrecthedBillboard";
        /**
         * 粒子始终与 XZ 平面平行。
         */
        ParticleRenderMode[ParticleRenderMode["HorizontalBillboard"] = 2] = "HorizontalBillboard";
        /**
         * 粒子始终与 Y 轴平行且朝向摄像机。
         */
        ParticleRenderMode[ParticleRenderMode["VerticalBillboard"] = 3] = "VerticalBillboard";
        /**
         * 粒子保持模型本身状态。
         */
        ParticleRenderMode[ParticleRenderMode["Mesh"] = 4] = "Mesh";
        return ParticleRenderMode;
      }({}));
      Enum(ParticleRenderMode);

      /**
       * 粒子发射器类型。
       * @enum shapeModule.ShapeType
       */
      _export("ParticleShapeType", ParticleShapeType = /*#__PURE__*/function (ParticleShapeType) {
        /**
         * 立方体类型粒子发射器。
         */
        ParticleShapeType[ParticleShapeType["Box"] = 0] = "Box";
        /**
         * 圆形粒子发射器。
         */
        ParticleShapeType[ParticleShapeType["Circle"] = 1] = "Circle";
        /**
         * 圆锥体粒子发射器。
         */
        ParticleShapeType[ParticleShapeType["Cone"] = 2] = "Cone";
        /**
         * 球体粒子发射器。
         */
        ParticleShapeType[ParticleShapeType["Sphere"] = 3] = "Sphere";
        /**
         * 半球体粒子发射器。
         */
        ParticleShapeType[ParticleShapeType["Hemisphere"] = 4] = "Hemisphere";
        return ParticleShapeType;
      }({}));
      Enum(ParticleShapeType);

      /**
       * 粒子从发射器的哪个部位发射。
       * @enum shapeModule.EmitLocation
       */
      _export("ParticleEmitLocation", ParticleEmitLocation = /*#__PURE__*/function (ParticleEmitLocation) {
        /**
         * 基础位置发射（仅对 Circle 类型及 Cone 类型的粒子发射器适用）。
         */
        ParticleEmitLocation[ParticleEmitLocation["Base"] = 0] = "Base";
        /**
         * 边框位置发射（仅对 Box 类型及 Circle 类型的粒子发射器适用）。
         */
        ParticleEmitLocation[ParticleEmitLocation["Edge"] = 1] = "Edge";
        /**
         * 表面位置发射（对所有类型的粒子发射器都适用）。
         */
        ParticleEmitLocation[ParticleEmitLocation["Shell"] = 2] = "Shell";
        /**
         * 内部位置发射（对所有类型的粒子发射器都适用）。
         */
        ParticleEmitLocation[ParticleEmitLocation["Volume"] = 3] = "Volume";
        return ParticleEmitLocation;
      }({}));
      Enum(ParticleEmitLocation);

      /**
       * 粒子在扇形区域的发射方式。
       * @enum shapeModule.ArcMode
       */
      _export("ParticleArcMode", ParticleArcMode = /*#__PURE__*/function (ParticleArcMode) {
        /**
         * 随机位置发射。
         */
        ParticleArcMode[ParticleArcMode["Random"] = 0] = "Random";
        /**
         * 沿某一方向循环发射，每次循环方向相同。
         */
        ParticleArcMode[ParticleArcMode["Loop"] = 1] = "Loop";
        /**
         * 循环发射，每次循环方向相反。
         */
        ParticleArcMode[ParticleArcMode["PingPong"] = 2] = "PingPong";
        return ParticleArcMode;
      }({}));
      Enum(ParticleArcMode);

      /**
       * 选择如何为粒子系统生成轨迹。
       * @enum trailModule.TrailMode
       */
      _export("ParticleTrailMode", ParticleTrailMode = /*#__PURE__*/function (ParticleTrailMode) {
        /**
         * 粒子模式<bg>。
         * 创建一种效果，其中每个粒子在其路径中留下固定的轨迹。
         */
        ParticleTrailMode[ParticleTrailMode["Particles"] = 0] = "Particles";
        /**
         * 带模式<bg>。
         * 根据其生命周期创建连接每个粒子的轨迹带。
         */
        // Ribbon = 1,
        return ParticleTrailMode;
      }({}));
      Enum(ParticleTrailMode);

      /**
       * 纹理填充模式。
       * @enum trailModule.TextureMode
       */
      _export("ParticleTextureMode", ParticleTextureMode = /*#__PURE__*/function (ParticleTextureMode) {
        /**
         * 拉伸填充纹理。
         */
        ParticleTextureMode[ParticleTextureMode["Stretch"] = 0] = "Stretch";
        /**
         * 重复填充纹理。
         */
        // Repeat = 1,
        return ParticleTextureMode;
      }({}));
      Enum(ParticleTextureMode);
      _export("ParticleModuleRandSeed", ParticleModuleRandSeed = /*#__PURE__*/function (ParticleModuleRandSeed) {
        ParticleModuleRandSeed[ParticleModuleRandSeed["LIMIT"] = 23541] = "LIMIT";
        ParticleModuleRandSeed[ParticleModuleRandSeed["SIZE"] = 39825] = "SIZE";
        ParticleModuleRandSeed[ParticleModuleRandSeed["TEXTURE"] = 90794] = "TEXTURE";
        ParticleModuleRandSeed[ParticleModuleRandSeed["COLOR"] = 91041] = "COLOR";
        ParticleModuleRandSeed[ParticleModuleRandSeed["FORCE"] = 212165] = "FORCE";
        ParticleModuleRandSeed[ParticleModuleRandSeed["ROTATION"] = 125292] = "ROTATION";
        ParticleModuleRandSeed[ParticleModuleRandSeed["VELOCITY_X"] = 197866] = "VELOCITY_X";
        ParticleModuleRandSeed[ParticleModuleRandSeed["VELOCITY_Y"] = 156497] = "VELOCITY_Y";
        ParticleModuleRandSeed[ParticleModuleRandSeed["VELOCITY_Z"] = 984136] = "VELOCITY_Z";
        return ParticleModuleRandSeed;
      }({}));
    }
  };
});