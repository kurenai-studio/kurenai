System.register("q-bundled:///fs/cocos/render-scene/scene/sphere-light.js", ["../../core/index.js", "../../rendering/pipeline-scene-data-utils.js", "./light.js"], function (_export, _context) {
  "use strict";

  var Vec3, geometry, getPipelineSceneData, Light, LightType, nt2lm, SphereLight;
  _export("SphereLight", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
    }, function (_lightJs) {
      Light = _lightJs.Light;
      LightType = _lightJs.LightType;
      nt2lm = _lightJs.nt2lm;
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
      /**
       * @en The sphere light representation in the render scene, it will light up a spherical area in the scene.
       * It doesn't support shadow generation currently.
       * @zh 渲染场景中的球面光抽象，可以照亮场景中的一个球形区域，目前还不支持生成阴影。
       */
      _export("SphereLight", SphereLight = class SphereLight extends Light {
        /**
         * @en The world position of the light source
         * @zh 光源中心点的世界坐标
         */
        get position() {
          return this._pos;
        }

        /**
         * @en The size of the light source
         * @zh 球面光源的尺寸
         */
        set size(size) {
          this._size = size;
        }
        get size() {
          return this._size;
        }

        /**
         * @en The lighting range of the light source
         * @zh 球面光源的光照范围
         */
        set range(range) {
          this._range = range;
          this._needUpdate = true;
        }
        get range() {
          return this._range;
        }

        /**
         * @en The luminance of the light source
         * @zh 光源的亮度
         */
        get luminance() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._luminanceHDR;
          } else {
            return this._luminanceLDR;
          }
        }
        set luminance(value) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this.luminanceHDR = value;
          } else {
            this.luminanceLDR = value;
          }
        }

        /**
         * @en The luminance of the light source in HDR mode
         * @zh HDR 模式下光源的亮度
         */
        get luminanceHDR() {
          return this._luminanceHDR;
        }
        set luminanceHDR(value) {
          this._luminanceHDR = value;
        }

        /**
         * @en The luminance of the light source in LDR mode
         * @zh LDR 模式下光源的亮度
         */
        get luminanceLDR() {
          return this._luminanceLDR;
        }
        set luminanceLDR(value) {
          this._luminanceLDR = value;
        }

        /**
         * @en The AABB bounding box of the lighting area
         * @zh 受光源影响范围的 AABB 包围盒
         */
        get aabb() {
          return this._aabb;
        }
        constructor() {
          super();
          this._needUpdate = false;
          this._size = 0.15;
          this._range = 1.0;
          this._luminanceHDR = 0;
          this._luminanceLDR = 0;
          this._pos = new Vec3();
          this._aabb = geometry.AABB.create();
          this._type = LightType.SPHERE;
        }
        initialize() {
          super.initialize();
          const size = 0.15;
          this.size = size;
          this.range = 1.0;
          this.luminanceHDR = 1700 / nt2lm(size);
          this.luminanceLDR = 1.0;
        }

        /**
         * @en Update the lighting area
         * @zh 更新光源影响范围
         */
        update() {
          if (this._node && (this._node.hasChangedFlags || this._needUpdate)) {
            this._node.getWorldPosition(this._pos);
            const range = this._range;
            geometry.AABB.set(this._aabb, this._pos.x, this._pos.y, this._pos.z, range, range, range);
            this._needUpdate = false;
          }
        }
      });
    }
  };
});