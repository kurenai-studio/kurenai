System.register("q-bundled:///fs/cocos/3d/lights/deprecated.js", ["./light-component.js", "./spot-light-component.js", "./sphere-light-component.js", "./directional-light-component.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var Light, SpotLight, SphereLight, DirectionalLight, cclegacy, js, replaceProperty;
  return {
    setters: [function (_lightComponentJs) {
      Light = _lightComponentJs.Light;
    }, function (_spotLightComponentJs) {
      SpotLight = _spotLightComponentJs.SpotLight;
    }, function (_sphereLightComponentJs) {
      SphereLight = _sphereLightComponentJs.SphereLight;
    }, function (_directionalLightComponentJs) {
      DirectionalLight = _directionalLightComponentJs.DirectionalLight;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      replaceProperty = _coreIndexJs.replaceProperty;
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
       * Alias of [[Light]]
       * @deprecated Since v1.2
       */
      _export("LightComponent", Light);
      cclegacy.LightComponent = Light;
      js.setClassAlias(Light, 'cc.LightComponent');
      /**
       * Alias of [[DirectionalLight]]
       * @deprecated Since v1.2
       */
      _export("DirectionalLightComponent", DirectionalLight);
      cclegacy.DirectionalLightComponent = DirectionalLight;
      js.setClassAlias(DirectionalLight, 'cc.DirectionalLightComponent');
      /**
       * Alias of [[SphereLight]]
       * @deprecated Since v1.2
       */
      _export("SphereLightComponent", SphereLight);
      cclegacy.SphereLightComponent = SphereLight;
      js.setClassAlias(SphereLight, 'cc.SphereLightComponent');
      /**
       * Alias of [[SpotLight]]
       * @deprecated Since v1.2
       */
      _export("SpotLightComponent", SpotLight);
      cclegacy.SpotLightComponent = SpotLight;
      js.setClassAlias(SpotLight, 'cc.SpotLightComponent');
      replaceProperty(SpotLight.prototype, 'SpotLight.prototype', [{
        name: 'luminousPower',
        newName: 'luminousFlux',
        customGetter() {
          return this.luminousFlux;
        },
        customSetter(value) {
          this.luminousFlux = value;
        }
      }]);
      replaceProperty(SphereLight.prototype, 'SphereLight.prototype', [{
        name: 'luminousPower',
        newName: 'luminousFlux',
        customGetter() {
          return this.luminousFlux;
        },
        customSetter(value) {
          this.luminousFlux = value;
        }
      }]);
      replaceProperty(Light.PhotometricTerm, 'Light.PhotometricTerm', [{
        name: 'LUMINOUS_POWER',
        newName: 'LUMINOUS_FLUX'
      }]);
    }
  };
});