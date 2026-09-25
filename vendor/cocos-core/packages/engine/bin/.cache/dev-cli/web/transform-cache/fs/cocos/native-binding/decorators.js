System.register("q-bundled:///fs/cocos/native-binding/decorators.js", ["../core/data/decorators/index.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var $$, $, defaultExec;
  function patch_BloomStage(ctx, apply = defaultExec) {
    const {
      BloomStage,
      Material
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(3)(BloomStage.prototype, '_bloomMaterial', () => {
        return null;
      });
    }, 'displayOrder', '_bloomMaterial');
    apply(() => {
      $.serializable(BloomStage.prototype, '_bloomMaterial', () => {
        return null;
      });
    }, 'serializable', '_bloomMaterial');
    apply(() => {
      $.type(Material)(BloomStage.prototype, '_bloomMaterial', () => {
        return null;
      });
    }, 'type', '_bloomMaterial');
    apply(() => {
      $.ccclass('BloomStage')(BloomStage);
    }, 'ccclass', null);
  } // end of patch_BloomStage

  //---- class cc_AmbientInfo

  function patch_cc_AmbientInfo(ctx, apply = defaultExec) {
    const {
      AmbientInfo,
      legacyCC,
      CCFloat,
      Vec4,
      Ambient
    } = {
      ...ctx
    };
    const skyLightingColorDescriptor = Object.getOwnPropertyDescriptor(AmbientInfo.prototype, 'skyLightingColor');
    const skyIllumDescriptor = Object.getOwnPropertyDescriptor(AmbientInfo.prototype, 'skyIllum');
    const groundLightingColorDescriptor = Object.getOwnPropertyDescriptor(AmbientInfo.prototype, 'groundLightingColor');
    apply(() => {
      $.tooltip('i18n:ambient.skyLightingColor')(AmbientInfo.prototype, 'skyLightingColor', skyLightingColorDescriptor);
    }, 'tooltip', 'skyLightingColor');
    apply(() => {
      $.editable(AmbientInfo.prototype, 'skyLightingColor', skyLightingColorDescriptor);
    }, 'editable', 'skyLightingColor');
    apply(() => {
      $.visible(() => {
        const scene = legacyCC.director.getScene();
        const skybox = scene.globals.skybox;
        if (skybox.useIBL && skybox.applyDiffuseMap) {
          return false;
        } else {
          return true;
        }
      })(AmbientInfo.prototype, 'skyLightingColor', skyLightingColorDescriptor);
    }, 'visible', 'skyLightingColor');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 100])(AmbientInfo.prototype, 'skyIllum', skyIllumDescriptor);
    }, 'range', 'skyIllum');
    apply(() => {
      $.tooltip('i18n:ambient.skyIllum')(AmbientInfo.prototype, 'skyIllum', skyIllumDescriptor);
    }, 'tooltip', 'skyIllum');
    apply(() => {
      $.type(CCFloat)(AmbientInfo.prototype, 'skyIllum', skyIllumDescriptor);
    }, 'type', 'skyIllum');
    apply(() => {
      $.editable(AmbientInfo.prototype, 'skyIllum', skyIllumDescriptor);
    }, 'editable', 'skyIllum');
    apply(() => {
      $.tooltip('i18n:ambient.groundLightingColor')(AmbientInfo.prototype, 'groundLightingColor', groundLightingColorDescriptor);
    }, 'tooltip', 'groundLightingColor');
    apply(() => {
      $.editable(AmbientInfo.prototype, 'groundLightingColor', groundLightingColorDescriptor);
    }, 'editable', 'groundLightingColor');
    apply(() => {
      $.visible(() => {
        const scene = legacyCC.director.getScene();
        const skybox = scene.globals.skybox;
        if (skybox.useIBL && skybox.applyDiffuseMap) {
          return false;
        } else {
          return true;
        }
      })(AmbientInfo.prototype, 'groundLightingColor', groundLightingColorDescriptor);
    }, 'visible', 'groundLightingColor');
    apply(() => {
      $.formerlySerializedAs('_skyColor')(AmbientInfo.prototype, '_skyColorHDR', () => {
        return new Vec4(0.2, 0.5, 0.8, 1.0);
      });
    }, 'formerlySerializedAs', '_skyColorHDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_skyColorHDR', () => {
        return new Vec4(0.2, 0.5, 0.8, 1.0);
      });
    }, 'serializable', '_skyColorHDR');
    apply(() => {
      $.formerlySerializedAs('_skyIllum')(AmbientInfo.prototype, '_skyIllumHDR', () => {
        return Ambient.SKY_ILLUM;
      });
    }, 'formerlySerializedAs', '_skyIllumHDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_skyIllumHDR', () => {
        return Ambient.SKY_ILLUM;
      });
    }, 'serializable', '_skyIllumHDR');
    apply(() => {
      $.formerlySerializedAs('_groundAlbedo')(AmbientInfo.prototype, '_groundAlbedoHDR', () => {
        return new Vec4(0.2, 0.2, 0.2, 1.0);
      });
    }, 'formerlySerializedAs', '_groundAlbedoHDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_groundAlbedoHDR', () => {
        return new Vec4(0.2, 0.2, 0.2, 1.0);
      });
    }, 'serializable', '_groundAlbedoHDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_skyColorLDR', () => {
        return new Vec4(0.2, 0.5, 0.8, 1.0);
      });
    }, 'serializable', '_skyColorLDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_skyIllumLDR', () => {
        return Ambient.SKY_ILLUM;
      });
    }, 'serializable', '_skyIllumLDR');
    apply(() => {
      $.serializable(AmbientInfo.prototype, '_groundAlbedoLDR', () => {
        return new Vec4(0.2, 0.2, 0.2, 1.0);
      });
    }, 'serializable', '_groundAlbedoLDR');
    apply(() => {
      $.ccclass('cc.AmbientInfo')(AmbientInfo);
    }, 'ccclass', null);
  } // end of patch_cc_AmbientInfo

  //---- class cc_Asset

  function patch_cc_Asset(ctx, apply = defaultExec) {
    const {
      Asset
    } = {
      ...ctx
    };
    const _nativeAssetDescriptor = Object.getOwnPropertyDescriptor(Asset.prototype, '_nativeAsset');
    apply(() => {
      $.serializable(Asset.prototype, '_native', () => {
        return '';
      });
    }, 'serializable', '_native');
    apply(() => {
      $.property(Asset.prototype, '_nativeAsset', _nativeAssetDescriptor);
    }, 'property', '_nativeAsset');
    apply(() => {
      $.ccclass('cc.Asset')(Asset);
    }, 'ccclass', null);
  } // end of patch_cc_Asset

  //---- class cc_BufferAsset

  function patch_cc_BufferAsset(ctx, apply = defaultExec) {
    const {
      BufferAsset
    } = {
      ...ctx
    };
    const _nativeAssetDescriptor = Object.getOwnPropertyDescriptor(BufferAsset.prototype, '_nativeAsset');
    apply(() => {
      $.override(BufferAsset.prototype, '_nativeAsset', _nativeAssetDescriptor);
    }, 'override', '_nativeAsset');
    apply(() => {
      $.ccclass('cc.BufferAsset')(BufferAsset);
    }, 'ccclass', null);
  } // end of patch_cc_BufferAsset

  //---- class cc_CircumSphere

  function patch_cc_CircumSphere(ctx, apply = defaultExec) {
    const {
      CircumSphere,
      Vec3
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(CircumSphere.prototype, 'center', () => {
        return new Vec3(0, 0, 0);
      });
    }, 'serializable', 'center');
    apply(() => {
      $.serializable(CircumSphere.prototype, 'radiusSquared', () => {
        return 0.0;
      });
    }, 'serializable', 'radiusSquared');
    apply(() => {
      $.ccclass('cc.CircumSphere')(CircumSphere);
    }, 'ccclass', null);
  } // end of patch_cc_CircumSphere

  //---- class cc_DirectionalLight

  function patch_cc_DirectionalLight(ctx, apply = defaultExec) {
    const {
      DirectionalLight,
      Camera,
      PCFType,
      CSMLevel,
      CSMOptimizationMode,
      CCInteger,
      getPipelineSceneData,
      ShadowType,
      CCBoolean,
      CCFloat
    } = {
      ...ctx
    };
    const illuminanceDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'illuminance');
    const shadowEnabledDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowEnabled');
    const shadowPcfDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowPcf');
    const shadowBiasDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowBias');
    const shadowNormalBiasDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowNormalBias');
    const shadowSaturationDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowSaturation');
    const shadowDistanceDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowDistance');
    const shadowInvisibleOcclusionRangeDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange');
    const csmLevelDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmLevel');
    const enableCSMDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'enableCSM');
    const csmLayerLambdaDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmLayerLambda');
    const csmOptimizationModeDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmOptimizationMode');
    const shadowFixedAreaDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowFixedArea');
    const shadowNearDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowNear');
    const shadowFarDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowFar');
    const shadowOrthoSizeDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'shadowOrthoSize');
    const csmAdvancedOptionsDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmAdvancedOptions');
    const csmLayersTransitionDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmLayersTransition');
    const csmTransitionRangeDescriptor = Object.getOwnPropertyDescriptor(DirectionalLight.prototype, 'csmTransitionRange');
    apply(() => {
      $.formerlySerializedAs('_illuminance')(DirectionalLight.prototype, '_illuminanceHDR', () => {
        return 65000;
      });
    }, 'formerlySerializedAs', '_illuminanceHDR');
    apply(() => {
      $.property(DirectionalLight.prototype, '_illuminanceHDR', () => {
        return 65000;
      });
    }, 'property', '_illuminanceHDR');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_illuminanceLDR', () => {
        return 65000 * Camera.standardExposureValue;
      });
    }, 'serializable', '_illuminanceLDR');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowEnabled', () => {
        return false;
      });
    }, 'serializable', '_shadowEnabled');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowPcf', () => {
        return PCFType.HARD;
      });
    }, 'serializable', '_shadowPcf');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowBias', () => {
        return 0.00001;
      });
    }, 'serializable', '_shadowBias');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowNormalBias', () => {
        return 0.0;
      });
    }, 'serializable', '_shadowNormalBias');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowSaturation', () => {
        return 1.0;
      });
    }, 'serializable', '_shadowSaturation');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowDistance', () => {
        return 50;
      });
    }, 'serializable', '_shadowDistance');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowInvisibleOcclusionRange', () => {
        return 200;
      });
    }, 'serializable', '_shadowInvisibleOcclusionRange');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmLevel', () => {
        return CSMLevel.LEVEL_4;
      });
    }, 'serializable', '_csmLevel');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmLayerLambda', () => {
        return 0.75;
      });
    }, 'serializable', '_csmLayerLambda');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmOptimizationMode', () => {
        return CSMOptimizationMode.RemoveDuplicates;
      });
    }, 'serializable', '_csmOptimizationMode');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmAdvancedOptions', () => {
        return false;
      });
    }, 'serializable', '_csmAdvancedOptions');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmLayersTransition', () => {
        return false;
      });
    }, 'serializable', '_csmLayersTransition');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_csmTransitionRange', () => {
        return 0.05;
      });
    }, 'serializable', '_csmTransitionRange');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowFixedArea', () => {
        return false;
      });
    }, 'serializable', '_shadowFixedArea');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowNear', () => {
        return 0.1;
      });
    }, 'serializable', '_shadowNear');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowFar', () => {
        return 10.0;
      });
    }, 'serializable', '_shadowFar');
    apply(() => {
      $.serializable(DirectionalLight.prototype, '_shadowOrthoSize', () => {
        return 5;
      });
    }, 'serializable', '_shadowOrthoSize');
    apply(() => {
      $.type(CCInteger)(DirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'type', 'illuminance');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 10])(DirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'range', 'illuminance');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'editable', 'illuminance');
    apply(() => {
      $.tooltip('i18n:lights.illuminance')(DirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'tooltip', 'illuminance');
    apply(() => {
      $.type(CCBoolean)(DirectionalLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'type', 'shadowEnabled');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'editable', 'shadowEnabled');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 1
        }
      })(DirectionalLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'property', 'shadowEnabled');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'visible', 'shadowEnabled');
    apply(() => {
      $.tooltip('i18n:lights.shadowEnabled')(DirectionalLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'tooltip', 'shadowEnabled');
    apply(() => {
      $.type(PCFType)(DirectionalLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'type', 'shadowPcf');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'editable', 'shadowPcf');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 5
        }
      })(DirectionalLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'property', 'shadowPcf');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'visible', 'shadowPcf');
    apply(() => {
      $.tooltip('i18n:lights.shadowPcf')(DirectionalLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'tooltip', 'shadowPcf');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'type', 'shadowBias');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'editable', 'shadowBias');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 6
        }
      })(DirectionalLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'property', 'shadowBias');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'visible', 'shadowBias');
    apply(() => {
      $.tooltip('i18n:lights.shadowBias')(DirectionalLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'tooltip', 'shadowBias');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'type', 'shadowNormalBias');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'editable', 'shadowNormalBias');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 7
        }
      })(DirectionalLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'property', 'shadowNormalBias');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'visible', 'shadowNormalBias');
    apply(() => {
      $.tooltip('i18n:lights.shadowNormalBias')(DirectionalLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'tooltip', 'shadowNormalBias');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'type', 'shadowSaturation');
    apply(() => {
      $.slide(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'slide', 'shadowSaturation');
    apply(() => {
      $.range([0.0, 1.0, 0.01])(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'range', 'shadowSaturation');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'editable', 'shadowSaturation');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 8
        }
      })(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'property', 'shadowSaturation');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'visible', 'shadowSaturation');
    apply(() => {
      $.tooltip('i18n:lights.shadowSaturation')(DirectionalLight.prototype, 'shadowSaturation', shadowSaturationDescriptor);
    }, 'tooltip', 'shadowSaturation');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'type', 'shadowDistance');
    apply(() => {
      $.slide(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'slide', 'shadowDistance');
    apply(() => {
      $.range([0.0, 2000.0, 0.1])(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'range', 'shadowDistance');
    apply(() => {
      $.tooltip('shadow visible distance: shadow quality is inversely proportional of the magnitude of this value')(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'tooltip', 'shadowDistance');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'editable', 'shadowDistance');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 9
        }
      })(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'property', 'shadowDistance');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false;
      })(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'visible', 'shadowDistance');
    apply(() => {
      $.tooltip('i18n:lights.shadowDistance')(DirectionalLight.prototype, 'shadowDistance', shadowDistanceDescriptor);
    }, 'tooltip', 'shadowDistance');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'type', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.slide(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'slide', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.range([0.0, 2000.0, 1.0])(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'range', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.tooltip('if shadow has been culled, increase this value to fix it')(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'tooltip', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'editable', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 22
        }
      })(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'property', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false && this._csmAdvancedOptions;
      })(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'visible', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.tooltip('i18n:lights.shadowInvisibleOcclusionRange')(DirectionalLight.prototype, 'shadowInvisibleOcclusionRange', shadowInvisibleOcclusionRangeDescriptor);
    }, 'tooltip', 'shadowInvisibleOcclusionRange');
    apply(() => {
      $.type(CSMLevel)(DirectionalLight.prototype, 'csmLevel', csmLevelDescriptor);
    }, 'type', 'csmLevel');
    apply(() => {
      $.tooltip('CSM Level')(DirectionalLight.prototype, 'csmLevel', csmLevelDescriptor);
    }, 'tooltip', 'csmLevel');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmLevel', csmLevelDescriptor);
    }, 'editable', 'csmLevel');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 10
        }
      })(DirectionalLight.prototype, 'csmLevel', csmLevelDescriptor);
    }, 'property', 'csmLevel');
    apply(() => {
      $.visible(false)(DirectionalLight.prototype, 'csmLevel', csmLevelDescriptor);
    }, 'visible', 'csmLevel');
    apply(() => {
      $.type(CCBoolean)(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'type', 'enableCSM');
    apply(() => {
      $.tooltip('enable CSM')(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'tooltip', 'enableCSM');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'editable', 'enableCSM');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 11
        }
      })(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'property', 'enableCSM');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false;
      })(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'visible', 'enableCSM');
    apply(() => {
      $.tooltip('i18n:lights.enableCSM')(DirectionalLight.prototype, 'enableCSM', enableCSMDescriptor);
    }, 'tooltip', 'enableCSM');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'type', 'csmLayerLambda');
    apply(() => {
      $.slide(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'slide', 'csmLayerLambda');
    apply(() => {
      $.range([0.0, 1.0, 0.01])(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'range', 'csmLayerLambda');
    apply(() => {
      $.tooltip('CSM Level ratio')(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'tooltip', 'csmLayerLambda');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'editable', 'csmLayerLambda');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 12
        }
      })(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'property', 'csmLayerLambda');
    apply(() => {
      $.visible(false)(DirectionalLight.prototype, 'csmLayerLambda', csmLayerLambdaDescriptor);
    }, 'visible', 'csmLayerLambda');
    apply(() => {
      $.type(CSMOptimizationMode)(DirectionalLight.prototype, 'csmOptimizationMode', csmOptimizationModeDescriptor);
    }, 'type', 'csmOptimizationMode');
    apply(() => {
      $.tooltip('CSM Performance Optimization Mode')(DirectionalLight.prototype, 'csmOptimizationMode', csmOptimizationModeDescriptor);
    }, 'tooltip', 'csmOptimizationMode');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmOptimizationMode', csmOptimizationModeDescriptor);
    }, 'editable', 'csmOptimizationMode');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 13
        }
      })(DirectionalLight.prototype, 'csmOptimizationMode', csmOptimizationModeDescriptor);
    }, 'property', 'csmOptimizationMode');
    apply(() => {
      $.visible(false)(DirectionalLight.prototype, 'csmOptimizationMode', csmOptimizationModeDescriptor);
    }, 'visible', 'csmOptimizationMode');
    apply(() => {
      $.type(CCBoolean)(DirectionalLight.prototype, 'shadowFixedArea', shadowFixedAreaDescriptor);
    }, 'type', 'shadowFixedArea');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowFixedArea', shadowFixedAreaDescriptor);
    }, 'editable', 'shadowFixedArea');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 14
        }
      })(DirectionalLight.prototype, 'shadowFixedArea', shadowFixedAreaDescriptor);
    }, 'property', 'shadowFixedArea');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(DirectionalLight.prototype, 'shadowFixedArea', shadowFixedAreaDescriptor);
    }, 'visible', 'shadowFixedArea');
    apply(() => {
      $.tooltip('i18n:lights.shadowFixedArea')(DirectionalLight.prototype, 'shadowFixedArea', shadowFixedAreaDescriptor);
    }, 'tooltip', 'shadowFixedArea');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowNear', shadowNearDescriptor);
    }, 'type', 'shadowNear');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowNear', shadowNearDescriptor);
    }, 'editable', 'shadowNear');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 15
        }
      })(DirectionalLight.prototype, 'shadowNear', shadowNearDescriptor);
    }, 'property', 'shadowNear');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      })(DirectionalLight.prototype, 'shadowNear', shadowNearDescriptor);
    }, 'visible', 'shadowNear');
    apply(() => {
      $.tooltip('i18n:lights.shadowNear')(DirectionalLight.prototype, 'shadowNear', shadowNearDescriptor);
    }, 'tooltip', 'shadowNear');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowFar', shadowFarDescriptor);
    }, 'type', 'shadowFar');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'shadowFar', shadowFarDescriptor);
    }, 'editable', 'shadowFar');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 16
        }
      })(DirectionalLight.prototype, 'shadowFar', shadowFarDescriptor);
    }, 'property', 'shadowFar');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      })(DirectionalLight.prototype, 'shadowFar', shadowFarDescriptor);
    }, 'visible', 'shadowFar');
    apply(() => {
      $.tooltip('i18n:lights.shadowFar')(DirectionalLight.prototype, 'shadowFar', shadowFarDescriptor);
    }, 'tooltip', 'shadowFar');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'shadowOrthoSize', shadowOrthoSizeDescriptor);
    }, 'type', 'shadowOrthoSize');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 17
        }
      })(DirectionalLight.prototype, 'shadowOrthoSize', shadowOrthoSizeDescriptor);
    }, 'property', 'shadowOrthoSize');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      })(DirectionalLight.prototype, 'shadowOrthoSize', shadowOrthoSizeDescriptor);
    }, 'visible', 'shadowOrthoSize');
    apply(() => {
      $.tooltip('i18n:lights.shadowOrthoSize')(DirectionalLight.prototype, 'shadowOrthoSize', shadowOrthoSizeDescriptor);
    }, 'tooltip', 'shadowOrthoSize');
    apply(() => {
      $.type(CCBoolean)(DirectionalLight.prototype, 'csmAdvancedOptions', csmAdvancedOptionsDescriptor);
    }, 'type', 'csmAdvancedOptions');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmAdvancedOptions', csmAdvancedOptionsDescriptor);
    }, 'editable', 'csmAdvancedOptions');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 19
        }
      })(DirectionalLight.prototype, 'csmAdvancedOptions', csmAdvancedOptionsDescriptor);
    }, 'property', 'csmAdvancedOptions');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1;
      })(DirectionalLight.prototype, 'csmAdvancedOptions', csmAdvancedOptionsDescriptor);
    }, 'visible', 'csmAdvancedOptions');
    apply(() => {
      $.tooltip('i18n:lights.shadowAdvancedOptions')(DirectionalLight.prototype, 'csmAdvancedOptions', csmAdvancedOptionsDescriptor);
    }, 'tooltip', 'csmAdvancedOptions');
    apply(() => {
      $.type(CCBoolean)(DirectionalLight.prototype, 'csmLayersTransition', csmLayersTransitionDescriptor);
    }, 'type', 'csmLayersTransition');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmLayersTransition', csmLayersTransitionDescriptor);
    }, 'editable', 'csmLayersTransition');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 20
        }
      })(DirectionalLight.prototype, 'csmLayersTransition', csmLayersTransitionDescriptor);
    }, 'property', 'csmLayersTransition');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1 && this._csmAdvancedOptions;
      })(DirectionalLight.prototype, 'csmLayersTransition', csmLayersTransitionDescriptor);
    }, 'visible', 'csmLayersTransition');
    apply(() => {
      $.tooltip('i18n:lights.csmLayersTransition')(DirectionalLight.prototype, 'csmLayersTransition', csmLayersTransitionDescriptor);
    }, 'tooltip', 'csmLayersTransition');
    apply(() => {
      $.type(CCFloat)(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'type', 'csmTransitionRange');
    apply(() => {
      $.slide(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'slide', 'csmTransitionRange');
    apply(() => {
      $.range([0.0, 1.0, 0.01])(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'range', 'csmTransitionRange');
    apply(() => {
      $.editable(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'editable', 'csmTransitionRange');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 21
        }
      })(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'property', 'csmTransitionRange');
    apply(() => {
      $.visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1 && this._csmAdvancedOptions;
      })(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'visible', 'csmTransitionRange');
    apply(() => {
      $.tooltip('i18n:lights.csmTransitionRange')(DirectionalLight.prototype, 'csmTransitionRange', csmTransitionRangeDescriptor);
    }, 'tooltip', 'csmTransitionRange');
    apply(() => {
      $.executeInEditMode(DirectionalLight);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Light/DirectionalLight')(DirectionalLight);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.DirectionalLight')(DirectionalLight);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.DirectionalLight')(DirectionalLight);
    }, 'ccclass', null);
  } // end of patch_cc_DirectionalLight

  //---- class cc_EffectAsset

  function patch_cc_EffectAsset(ctx, apply = defaultExec) {
    const {
      EffectAsset
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(EffectAsset.prototype, 'techniques', () => {
        return [];
      });
    }, 'editable', 'techniques');
    apply(() => {
      $.serializable(EffectAsset.prototype, 'techniques', () => {
        return [];
      });
    }, 'serializable', 'techniques');
    apply(() => {
      $.editable(EffectAsset.prototype, 'shaders', () => {
        return [];
      });
    }, 'editable', 'shaders');
    apply(() => {
      $.serializable(EffectAsset.prototype, 'shaders', () => {
        return [];
      });
    }, 'serializable', 'shaders');
    apply(() => {
      $.editable(EffectAsset.prototype, 'combinations', () => {
        return [];
      });
    }, 'editable', 'combinations');
    apply(() => {
      $.serializable(EffectAsset.prototype, 'combinations', () => {
        return [];
      });
    }, 'serializable', 'combinations');
    apply(() => {
      $$.editorOnly(EffectAsset.prototype, 'hideInEditor', () => {
        return false;
      });
    }, 'editorOnly', 'hideInEditor');
    apply(() => {
      $.serializable(EffectAsset.prototype, 'hideInEditor', () => {
        return false;
      });
    }, 'serializable', 'hideInEditor');
    apply(() => {
      $.ccclass('cc.EffectAsset')(EffectAsset);
    }, 'ccclass', null);
  } // end of patch_cc_EffectAsset

  //---- class cc_FogInfo

  function patch_cc_FogInfo(ctx, apply = defaultExec) {
    const {
      FogInfo,
      FogType,
      CCFloat,
      Color
    } = {
      ...ctx
    };
    const enabledDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'enabled');
    const accurateDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'accurate');
    const fogColorDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogColor');
    const typeDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'type');
    const fogDensityDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogDensity');
    const fogStartDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogStart');
    const fogEndDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogEnd');
    const fogAttenDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogAtten');
    const fogTopDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogTop');
    const fogRangeDescriptor = Object.getOwnPropertyDescriptor(FogInfo.prototype, 'fogRange');
    apply(() => {
      $.displayOrder(0)(FogInfo.prototype, 'enabled', enabledDescriptor);
    }, 'displayOrder', 'enabled');
    apply(() => {
      $.tooltip('i18n:fog.enabled')(FogInfo.prototype, 'enabled', enabledDescriptor);
    }, 'tooltip', 'enabled');
    apply(() => {
      $.editable(FogInfo.prototype, 'enabled', enabledDescriptor);
    }, 'editable', 'enabled');
    apply(() => {
      $.displayOrder(0)(FogInfo.prototype, 'accurate', accurateDescriptor);
    }, 'displayOrder', 'accurate');
    apply(() => {
      $.tooltip('i18n:fog.accurate')(FogInfo.prototype, 'accurate', accurateDescriptor);
    }, 'tooltip', 'accurate');
    apply(() => {
      $.editable(FogInfo.prototype, 'accurate', accurateDescriptor);
    }, 'editable', 'accurate');
    apply(() => {
      $.tooltip('i18n:fog.fogColor')(FogInfo.prototype, 'fogColor', fogColorDescriptor);
    }, 'tooltip', 'fogColor');
    apply(() => {
      $.editable(FogInfo.prototype, 'fogColor', fogColorDescriptor);
    }, 'editable', 'fogColor');
    apply(() => {
      $.tooltip('i18n:fog.type')(FogInfo.prototype, 'type', typeDescriptor);
    }, 'tooltip', 'type');
    apply(() => {
      $.displayOrder(1)(FogInfo.prototype, 'type', typeDescriptor);
    }, 'displayOrder', 'type');
    apply(() => {
      $.type(FogType)(FogInfo.prototype, 'type', typeDescriptor);
    }, 'type', 'type');
    apply(() => {
      $.editable(FogInfo.prototype, 'type', typeDescriptor);
    }, 'editable', 'type');
    apply(() => {
      $.tooltip('i18n:fog.fogDensity')(FogInfo.prototype, 'fogDensity', fogDensityDescriptor);
    }, 'tooltip', 'fogDensity');
    apply(() => {
      $.slide(FogInfo.prototype, 'fogDensity', fogDensityDescriptor);
    }, 'slide', 'fogDensity');
    apply(() => {
      $.range([0, 1, 0.01])(FogInfo.prototype, 'fogDensity', fogDensityDescriptor);
    }, 'range', 'fogDensity');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogDensity', fogDensityDescriptor);
    }, 'type', 'fogDensity');
    apply(() => {
      $.visible(function () {
        return this._type !== FogType.LAYERED && this._type !== FogType.LINEAR;
      })(FogInfo.prototype, 'fogDensity', fogDensityDescriptor);
    }, 'visible', 'fogDensity');
    apply(() => {
      $.tooltip('i18n:fog.fogStart')(FogInfo.prototype, 'fogStart', fogStartDescriptor);
    }, 'tooltip', 'fogStart');
    apply(() => {
      $.rangeStep(0.01)(FogInfo.prototype, 'fogStart', fogStartDescriptor);
    }, 'rangeStep', 'fogStart');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogStart', fogStartDescriptor);
    }, 'type', 'fogStart');
    apply(() => {
      $.visible(function () {
        return this._type !== FogType.LAYERED;
      })(FogInfo.prototype, 'fogStart', fogStartDescriptor);
    }, 'visible', 'fogStart');
    apply(() => {
      $.tooltip('i18n:fog.fogEnd')(FogInfo.prototype, 'fogEnd', fogEndDescriptor);
    }, 'tooltip', 'fogEnd');
    apply(() => {
      $.rangeStep(0.01)(FogInfo.prototype, 'fogEnd', fogEndDescriptor);
    }, 'rangeStep', 'fogEnd');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogEnd', fogEndDescriptor);
    }, 'type', 'fogEnd');
    apply(() => {
      $.visible(function () {
        return this._type === FogType.LINEAR;
      })(FogInfo.prototype, 'fogEnd', fogEndDescriptor);
    }, 'visible', 'fogEnd');
    apply(() => {
      $.tooltip('i18n:fog.fogAtten')(FogInfo.prototype, 'fogAtten', fogAttenDescriptor);
    }, 'tooltip', 'fogAtten');
    apply(() => {
      $.rangeStep(0.01)(FogInfo.prototype, 'fogAtten', fogAttenDescriptor);
    }, 'rangeStep', 'fogAtten');
    apply(() => {
      $$.rangeMin(0.01)(FogInfo.prototype, 'fogAtten', fogAttenDescriptor);
    }, 'rangeMin', 'fogAtten');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogAtten', fogAttenDescriptor);
    }, 'type', 'fogAtten');
    apply(() => {
      $.visible(function () {
        return this._type !== FogType.LINEAR;
      })(FogInfo.prototype, 'fogAtten', fogAttenDescriptor);
    }, 'visible', 'fogAtten');
    apply(() => {
      $.tooltip('i18n:fog.fogTop')(FogInfo.prototype, 'fogTop', fogTopDescriptor);
    }, 'tooltip', 'fogTop');
    apply(() => {
      $.rangeStep(0.01)(FogInfo.prototype, 'fogTop', fogTopDescriptor);
    }, 'rangeStep', 'fogTop');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogTop', fogTopDescriptor);
    }, 'type', 'fogTop');
    apply(() => {
      $.visible(function () {
        return this._type === FogType.LAYERED;
      })(FogInfo.prototype, 'fogTop', fogTopDescriptor);
    }, 'visible', 'fogTop');
    apply(() => {
      $.tooltip('i18n:fog.fogRange')(FogInfo.prototype, 'fogRange', fogRangeDescriptor);
    }, 'tooltip', 'fogRange');
    apply(() => {
      $.rangeStep(0.01)(FogInfo.prototype, 'fogRange', fogRangeDescriptor);
    }, 'rangeStep', 'fogRange');
    apply(() => {
      $.type(CCFloat)(FogInfo.prototype, 'fogRange', fogRangeDescriptor);
    }, 'type', 'fogRange');
    apply(() => {
      $.visible(function () {
        return this._type === FogType.LAYERED;
      })(FogInfo.prototype, 'fogRange', fogRangeDescriptor);
    }, 'visible', 'fogRange');
    apply(() => {
      $.serializable(FogInfo.prototype, '_type', () => {
        return FogType.LINEAR;
      });
    }, 'serializable', '_type');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogColor', () => {
        return new Color('#C8C8C8');
      });
    }, 'serializable', '_fogColor');
    apply(() => {
      $.serializable(FogInfo.prototype, '_enabled', () => {
        return false;
      });
    }, 'serializable', '_enabled');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogDensity', () => {
        return 0.3;
      });
    }, 'serializable', '_fogDensity');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogStart', () => {
        return 0.5;
      });
    }, 'serializable', '_fogStart');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogEnd', () => {
        return 300;
      });
    }, 'serializable', '_fogEnd');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogAtten', () => {
        return 5;
      });
    }, 'serializable', '_fogAtten');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogTop', () => {
        return 1.5;
      });
    }, 'serializable', '_fogTop');
    apply(() => {
      $.serializable(FogInfo.prototype, '_fogRange', () => {
        return 1.2;
      });
    }, 'serializable', '_fogRange');
    apply(() => {
      $.serializable(FogInfo.prototype, '_accurate', () => {
        return false;
      });
    }, 'serializable', '_accurate');
    apply(() => {
      $.ccclass('cc.FogInfo')(FogInfo);
    }, 'ccclass', null);
  } // end of patch_cc_FogInfo

  //---- class cc_ImageAsset

  function patch_cc_ImageAsset(ctx, apply = defaultExec) {
    const {
      ImageAsset
    } = {
      ...ctx
    };
    const _nativeAssetDescriptor = Object.getOwnPropertyDescriptor(ImageAsset.prototype, '_nativeAsset');
    apply(() => {
      $.override(ImageAsset.prototype, '_nativeAsset', _nativeAssetDescriptor);
    }, 'override', '_nativeAsset');
    apply(() => {
      $.ccclass('cc.ImageAsset')(ImageAsset);
    }, 'ccclass', null);
  } // end of patch_cc_ImageAsset

  //---- class cc_LightProbeInfo

  function patch_cc_LightProbeInfo(ctx, apply = defaultExec) {
    const {
      LightProbeInfo,
      CCFloat,
      CCInteger
    } = {
      ...ctx
    };
    const giScaleDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'giScale');
    const giSamplesDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'giSamples');
    const bouncesDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'bounces');
    const reduceRingingDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'reduceRinging');
    const showWireframeDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'showWireframe');
    const showConvexDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'showConvex');
    const lightProbeSphereVolumeDescriptor = Object.getOwnPropertyDescriptor(LightProbeInfo.prototype, 'lightProbeSphereVolume');
    apply(() => {
      $.displayName('GIScale')(LightProbeInfo.prototype, 'giScale', giScaleDescriptor);
    }, 'displayName', 'giScale');
    apply(() => {
      $.tooltip('i18n:light_probe.giScale')(LightProbeInfo.prototype, 'giScale', giScaleDescriptor);
    }, 'tooltip', 'giScale');
    apply(() => {
      $.type(CCFloat)(LightProbeInfo.prototype, 'giScale', giScaleDescriptor);
    }, 'type', 'giScale');
    apply(() => {
      $.range([0, 100, 1])(LightProbeInfo.prototype, 'giScale', giScaleDescriptor);
    }, 'range', 'giScale');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'giScale', giScaleDescriptor);
    }, 'editable', 'giScale');
    apply(() => {
      $.displayName('GISamples')(LightProbeInfo.prototype, 'giSamples', giSamplesDescriptor);
    }, 'displayName', 'giSamples');
    apply(() => {
      $.tooltip('i18n:light_probe.giSamples')(LightProbeInfo.prototype, 'giSamples', giSamplesDescriptor);
    }, 'tooltip', 'giSamples');
    apply(() => {
      $.type(CCInteger)(LightProbeInfo.prototype, 'giSamples', giSamplesDescriptor);
    }, 'type', 'giSamples');
    apply(() => {
      $.range([64, 65535, 1])(LightProbeInfo.prototype, 'giSamples', giSamplesDescriptor);
    }, 'range', 'giSamples');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'giSamples', giSamplesDescriptor);
    }, 'editable', 'giSamples');
    apply(() => {
      $.tooltip('i18n:light_probe.bounces')(LightProbeInfo.prototype, 'bounces', bouncesDescriptor);
    }, 'tooltip', 'bounces');
    apply(() => {
      $.type(CCInteger)(LightProbeInfo.prototype, 'bounces', bouncesDescriptor);
    }, 'type', 'bounces');
    apply(() => {
      $.range([1, 4, 1])(LightProbeInfo.prototype, 'bounces', bouncesDescriptor);
    }, 'range', 'bounces');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'bounces', bouncesDescriptor);
    }, 'editable', 'bounces');
    apply(() => {
      $.tooltip('i18n:light_probe.reduceRinging')(LightProbeInfo.prototype, 'reduceRinging', reduceRingingDescriptor);
    }, 'tooltip', 'reduceRinging');
    apply(() => {
      $.type(CCFloat)(LightProbeInfo.prototype, 'reduceRinging', reduceRingingDescriptor);
    }, 'type', 'reduceRinging');
    apply(() => {
      $.slide(LightProbeInfo.prototype, 'reduceRinging', reduceRingingDescriptor);
    }, 'slide', 'reduceRinging');
    apply(() => {
      $.range([0.0, 0.05, 0.001])(LightProbeInfo.prototype, 'reduceRinging', reduceRingingDescriptor);
    }, 'range', 'reduceRinging');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'reduceRinging', reduceRingingDescriptor);
    }, 'editable', 'reduceRinging');
    apply(() => {
      $.tooltip('i18n:light_probe.showWireframe')(LightProbeInfo.prototype, 'showWireframe', showWireframeDescriptor);
    }, 'tooltip', 'showWireframe');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'showWireframe', showWireframeDescriptor);
    }, 'editable', 'showWireframe');
    apply(() => {
      $.tooltip('i18n:light_probe.showConvex')(LightProbeInfo.prototype, 'showConvex', showConvexDescriptor);
    }, 'tooltip', 'showConvex');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'showConvex', showConvexDescriptor);
    }, 'editable', 'showConvex');
    apply(() => {
      $.tooltip('i18n:light_probe.lightProbeSphereVolume')(LightProbeInfo.prototype, 'lightProbeSphereVolume', lightProbeSphereVolumeDescriptor);
    }, 'tooltip', 'lightProbeSphereVolume');
    apply(() => {
      $.type(CCFloat)(LightProbeInfo.prototype, 'lightProbeSphereVolume', lightProbeSphereVolumeDescriptor);
    }, 'type', 'lightProbeSphereVolume');
    apply(() => {
      $.range([0, 100, 1])(LightProbeInfo.prototype, 'lightProbeSphereVolume', lightProbeSphereVolumeDescriptor);
    }, 'range', 'lightProbeSphereVolume');
    apply(() => {
      $.editable(LightProbeInfo.prototype, 'lightProbeSphereVolume', lightProbeSphereVolumeDescriptor);
    }, 'editable', 'lightProbeSphereVolume');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_giScale', () => {
        return 1.0;
      });
    }, 'serializable', '_giScale');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_giSamples', () => {
        return 1024;
      });
    }, 'serializable', '_giSamples');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_bounces', () => {
        return 2;
      });
    }, 'serializable', '_bounces');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_reduceRinging', () => {
        return 0.0;
      });
    }, 'serializable', '_reduceRinging');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_showProbe', () => {
        return true;
      });
    }, 'serializable', '_showProbe');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_showWireframe', () => {
        return true;
      });
    }, 'serializable', '_showWireframe');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_showConvex', () => {
        return false;
      });
    }, 'serializable', '_showConvex');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_data', () => {
        return null;
      });
    }, 'serializable', '_data');
    apply(() => {
      $.serializable(LightProbeInfo.prototype, '_lightProbeSphereVolume', () => {
        return 1.0;
      });
    }, 'serializable', '_lightProbeSphereVolume');
    apply(() => {
      $.ccclass('cc.LightProbeInfo')(LightProbeInfo);
    }, 'ccclass', null);
  } // end of patch_cc_LightProbeInfo

  //---- class cc_LightProbesData

  function patch_cc_LightProbesData(ctx, apply = defaultExec) {
    const {
      LightProbesData,
      Vertex,
      Tetrahedron
    } = {
      ...ctx
    };
    apply(() => {
      $.type([Vertex])(LightProbesData.prototype, '_probes', () => {
        return [];
      });
    }, 'type', '_probes');
    apply(() => {
      $.serializable(LightProbesData.prototype, '_probes', () => {
        return [];
      });
    }, 'serializable', '_probes');
    apply(() => {
      $.type([Tetrahedron])(LightProbesData.prototype, '_tetrahedrons', () => {
        return [];
      });
    }, 'type', '_tetrahedrons');
    apply(() => {
      $.serializable(LightProbesData.prototype, '_tetrahedrons', () => {
        return [];
      });
    }, 'serializable', '_tetrahedrons');
    apply(() => {
      $.ccclass('cc.LightProbesData')(LightProbesData);
    }, 'ccclass', null);
  } // end of patch_cc_LightProbesData

  //---- class cc_Line

  function patch_cc_Line(ctx, apply = defaultExec) {
    const {
      Line,
      Texture2D,
      Material,
      Vec3,
      CurveRange,
      GradientRange,
      Vec2
    } = {
      ...ctx
    };
    const textureDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'texture');
    const lineMaterialDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'lineMaterial');
    const sharedMaterialsDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'sharedMaterials');
    const worldSpaceDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'worldSpace');
    const positionsDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'positions');
    const widthDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'width');
    const colorDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'color');
    const tileDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'tile');
    const offsetDescriptor = Object.getOwnPropertyDescriptor(Line.prototype, 'offset');
    apply(() => {
      $.type(Texture2D)(Line.prototype, '_texture', () => {
        return null;
      });
    }, 'type', '_texture');
    apply(() => {
      $.tooltip('i18n:line.texture')(Line.prototype, 'texture', textureDescriptor);
    }, 'tooltip', 'texture');
    apply(() => {
      $.displayOrder(0)(Line.prototype, 'texture', textureDescriptor);
    }, 'displayOrder', 'texture');
    apply(() => {
      $.type(Texture2D)(Line.prototype, 'texture', textureDescriptor);
    }, 'type', 'texture');
    apply(() => {
      $.serializable(Line.prototype, '_material', () => {
        return null;
      });
    }, 'serializable', '_material');
    apply(() => {
      $.displayName('Material')(Line.prototype, 'lineMaterial', lineMaterialDescriptor);
    }, 'displayName', 'lineMaterial');
    apply(() => {
      $.tooltip('i18n:line.material')(Line.prototype, 'lineMaterial', lineMaterialDescriptor);
    }, 'tooltip', 'lineMaterial');
    apply(() => {
      $.displayOrder(1)(Line.prototype, 'lineMaterial', lineMaterialDescriptor);
    }, 'displayOrder', 'lineMaterial');
    apply(() => {
      $.type(Material)(Line.prototype, 'lineMaterial', lineMaterialDescriptor);
    }, 'type', 'lineMaterial');
    apply(() => {
      $.serializable(Line.prototype, 'sharedMaterials', sharedMaterialsDescriptor);
    }, 'serializable', 'sharedMaterials');
    apply(() => {
      $.visible(false)(Line.prototype, 'sharedMaterials', sharedMaterialsDescriptor);
    }, 'visible', 'sharedMaterials');
    apply(() => {
      $.override(Line.prototype, 'sharedMaterials', sharedMaterialsDescriptor);
    }, 'override', 'sharedMaterials');
    apply(() => {
      $.serializable(Line.prototype, '_worldSpace', () => {
        return false;
      });
    }, 'serializable', '_worldSpace');
    apply(() => {
      $.tooltip('i18n:line.worldSpace')(Line.prototype, 'worldSpace', worldSpaceDescriptor);
    }, 'tooltip', 'worldSpace');
    apply(() => {
      $.displayOrder(1)(Line.prototype, 'worldSpace', worldSpaceDescriptor);
    }, 'displayOrder', 'worldSpace');
    apply(() => {
      $.type([Vec3])(Line.prototype, '_positions', () => {
        return [];
      });
    }, 'type', '_positions');
    apply(() => {
      $.tooltip('i18n:line.positions')(Line.prototype, 'positions', positionsDescriptor);
    }, 'tooltip', 'positions');
    apply(() => {
      $.displayOrder(2)(Line.prototype, 'positions', positionsDescriptor);
    }, 'displayOrder', 'positions');
    apply(() => {
      $.type([Vec3])(Line.prototype, 'positions', positionsDescriptor);
    }, 'type', 'positions');
    apply(() => {
      $.tooltip('i18n:line.width')(Line.prototype, 'width', widthDescriptor);
    }, 'tooltip', 'width');
    apply(() => {
      $.displayOrder(3)(Line.prototype, 'width', widthDescriptor);
    }, 'displayOrder', 'width');
    apply(() => {
      $.range([0, 1])(Line.prototype, 'width', widthDescriptor);
    }, 'range', 'width');
    apply(() => {
      $.type(CurveRange)(Line.prototype, 'width', widthDescriptor);
    }, 'type', 'width');
    apply(() => {
      $.serializable(Line.prototype, '_width', () => {
        return new CurveRange();
      });
    }, 'serializable', '_width');
    apply(() => {
      $.tooltip('i18n:line.color')(Line.prototype, 'color', colorDescriptor);
    }, 'tooltip', 'color');
    apply(() => {
      $.displayOrder(6)(Line.prototype, 'color', colorDescriptor);
    }, 'displayOrder', 'color');
    apply(() => {
      $.type(GradientRange)(Line.prototype, 'color', colorDescriptor);
    }, 'type', 'color');
    apply(() => {
      $.serializable(Line.prototype, '_color', () => {
        return new GradientRange();
      });
    }, 'serializable', '_color');
    apply(() => {
      $.serializable(Line.prototype, '_tile', () => {
        return new Vec2(1, 1);
      });
    }, 'serializable', '_tile');
    apply(() => {
      $.tooltip('i18n:line.tile')(Line.prototype, 'tile', tileDescriptor);
    }, 'tooltip', 'tile');
    apply(() => {
      $.displayOrder(4)(Line.prototype, 'tile', tileDescriptor);
    }, 'displayOrder', 'tile');
    apply(() => {
      $.type(Vec2)(Line.prototype, 'tile', tileDescriptor);
    }, 'type', 'tile');
    apply(() => {
      $.serializable(Line.prototype, '_offset', () => {
        return new Vec2(0, 0);
      });
    }, 'serializable', '_offset');
    apply(() => {
      $.tooltip('i18n:line.offset')(Line.prototype, 'offset', offsetDescriptor);
    }, 'tooltip', 'offset');
    apply(() => {
      $.displayOrder(5)(Line.prototype, 'offset', offsetDescriptor);
    }, 'displayOrder', 'offset');
    apply(() => {
      $.type(Vec2)(Line.prototype, 'offset', offsetDescriptor);
    }, 'type', 'offset');
    apply(() => {
      $.executeInEditMode(Line);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Effects/Line')(Line);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.Line')(Line);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.Line')(Line);
    }, 'ccclass', null);
  } // end of patch_cc_Line

  //---- class cc_Material

  function patch_cc_Material(ctx, apply = defaultExec) {
    const {
      Material,
      EffectAsset
    } = {
      ...ctx
    };
    apply(() => {
      $.type(EffectAsset)(Material.prototype, '_effectAsset', () => {
        return null;
      });
    }, 'type', '_effectAsset');
    apply(() => {
      $.serializable(Material.prototype, '_techIdx', () => {
        return 0;
      });
    }, 'serializable', '_techIdx');
    apply(() => {
      $.serializable(Material.prototype, '_defines', () => {
        return [];
      });
    }, 'serializable', '_defines');
    apply(() => {
      $.serializable(Material.prototype, '_states', () => {
        return [];
      });
    }, 'serializable', '_states');
    apply(() => {
      $.serializable(Material.prototype, '_props', () => {
        return [];
      });
    }, 'serializable', '_props');
    apply(() => {
      $.ccclass('cc.Material')(Material);
    }, 'ccclass', null);
  } // end of patch_cc_Material

  //---- class cc_Mesh

  function patch_cc_Mesh(ctx, apply = defaultExec) {
    const {
      Mesh
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(Mesh.prototype, '_struct', () => {
        return {
          vertexBundles: [],
          primitives: []
        };
      });
    }, 'serializable', '_struct');
    apply(() => {
      $.serializable(Mesh.prototype, '_hash', () => {
        return 0;
      });
    }, 'serializable', '_hash');
    apply(() => {
      $.serializable(Mesh.prototype, '_allowDataAccess', () => {
        return true;
      });
    }, 'serializable', '_allowDataAccess');
    apply(() => {
      $.ccclass('cc.Mesh')(Mesh);
    }, 'ccclass', null);
  } // end of patch_cc_Mesh

  //---- class cc_Node

  function patch_cc_Node(ctx, apply = defaultExec) {
    const {
      Node,
      Vec3,
      Quat,
      MobilityMode,
      Layers
    } = {
      ...ctx
    };
    const _persistNodeDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, '_persistNode');
    const nameDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'name');
    const childrenDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'children');
    const activeDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'active');
    const activeInHierarchyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'activeInHierarchy');
    const parentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'parent');
    const eulerAnglesDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'eulerAngles');
    const angleDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'angle');
    const mobilityDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'mobility');
    const layerDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'layer');
    apply(() => {
      $.property(Node.prototype, '_persistNode', _persistNodeDescriptor);
    }, 'property', '_persistNode');
    apply(() => {
      $.editable(Node.prototype, 'name', nameDescriptor);
    }, 'editable', 'name');
    apply(() => {
      $.editable(Node.prototype, 'children', childrenDescriptor);
    }, 'editable', 'children');
    apply(() => {
      $.editable(Node.prototype, 'active', activeDescriptor);
    }, 'editable', 'active');
    apply(() => {
      $.editable(Node.prototype, 'activeInHierarchy', activeInHierarchyDescriptor);
    }, 'editable', 'activeInHierarchy');
    apply(() => {
      $.editable(Node.prototype, 'parent', parentDescriptor);
    }, 'editable', 'parent');
    apply(() => {
      $.serializable(Node.prototype, '_parent', () => {
        return null;
      });
    }, 'serializable', '_parent');
    apply(() => {
      $.serializable(Node.prototype, '_children', () => {
        return [];
      });
    }, 'serializable', '_children');
    apply(() => {
      $.serializable(Node.prototype, '_active', () => {
        return true;
      });
    }, 'serializable', '_active');
    apply(() => {
      $.serializable(Node.prototype, '_components', () => {
        return [];
      });
    }, 'serializable', '_components');
    apply(() => {
      $.serializable(Node.prototype, '_prefab', () => {
        return null;
      });
    }, 'serializable', '_prefab');
    apply(() => {
      $.serializable(Node.prototype, '_lpos', () => {
        return new Vec3();
      });
    }, 'serializable', '_lpos');
    apply(() => {
      $.serializable(Node.prototype, '_lrot', () => {
        return new Quat();
      });
    }, 'serializable', '_lrot');
    apply(() => {
      $.serializable(Node.prototype, '_lscale', () => {
        return new Vec3(1, 1, 1);
      });
    }, 'serializable', '_lscale');
    apply(() => {
      $.serializable(Node.prototype, '_mobility', () => {
        return MobilityMode.Static;
      });
    }, 'serializable', '_mobility');
    apply(() => {
      $.serializable(Node.prototype, '_layer', () => {
        return Layers.Enum.DEFAULT;
      });
    }, 'serializable', '_layer');
    apply(() => {
      $.serializable(Node.prototype, '_euler', () => {
        return new Vec3();
      });
    }, 'serializable', '_euler');
    apply(() => {
      $.type(Vec3)(Node.prototype, 'eulerAngles', eulerAnglesDescriptor);
    }, 'type', 'eulerAngles');
    apply(() => {
      $.editable(Node.prototype, 'angle', angleDescriptor);
    }, 'editable', 'angle');
    apply(() => {
      $.type(MobilityMode)(Node.prototype, 'mobility', mobilityDescriptor);
    }, 'type', 'mobility');
    apply(() => {
      $.editable(Node.prototype, 'mobility', mobilityDescriptor);
    }, 'editable', 'mobility');
    apply(() => {
      $.editable(Node.prototype, 'layer', layerDescriptor);
    }, 'editable', 'layer');
    apply(() => {
      $.ccclass('cc.Node')(Node);
    }, 'ccclass', null);
  } // end of patch_cc_Node

  //---- class cc_OctreeInfo

  function patch_cc_OctreeInfo(ctx, apply = defaultExec) {
    const {
      OctreeInfo,
      CCInteger,
      Vec3,
      DEFAULT_WORLD_MIN_POS,
      DEFAULT_WORLD_MAX_POS,
      DEFAULT_OCTREE_DEPTH
    } = {
      ...ctx
    };
    const enabledDescriptor = Object.getOwnPropertyDescriptor(OctreeInfo.prototype, 'enabled');
    const minPosDescriptor = Object.getOwnPropertyDescriptor(OctreeInfo.prototype, 'minPos');
    const maxPosDescriptor = Object.getOwnPropertyDescriptor(OctreeInfo.prototype, 'maxPos');
    const depthDescriptor = Object.getOwnPropertyDescriptor(OctreeInfo.prototype, 'depth');
    apply(() => {
      $.tooltip('i18n:octree_culling.enabled')(OctreeInfo.prototype, 'enabled', enabledDescriptor);
    }, 'tooltip', 'enabled');
    apply(() => {
      $.editable(OctreeInfo.prototype, 'enabled', enabledDescriptor);
    }, 'editable', 'enabled');
    apply(() => {
      $.displayName('World MinPos')(OctreeInfo.prototype, 'minPos', minPosDescriptor);
    }, 'displayName', 'minPos');
    apply(() => {
      $.tooltip('i18n:octree_culling.minPos')(OctreeInfo.prototype, 'minPos', minPosDescriptor);
    }, 'tooltip', 'minPos');
    apply(() => {
      $.editable(OctreeInfo.prototype, 'minPos', minPosDescriptor);
    }, 'editable', 'minPos');
    apply(() => {
      $.displayName('World MaxPos')(OctreeInfo.prototype, 'maxPos', maxPosDescriptor);
    }, 'displayName', 'maxPos');
    apply(() => {
      $.tooltip('i18n:octree_culling.maxPos')(OctreeInfo.prototype, 'maxPos', maxPosDescriptor);
    }, 'tooltip', 'maxPos');
    apply(() => {
      $.editable(OctreeInfo.prototype, 'maxPos', maxPosDescriptor);
    }, 'editable', 'maxPos');
    apply(() => {
      $.tooltip('i18n:octree_culling.depth')(OctreeInfo.prototype, 'depth', depthDescriptor);
    }, 'tooltip', 'depth');
    apply(() => {
      $.type(CCInteger)(OctreeInfo.prototype, 'depth', depthDescriptor);
    }, 'type', 'depth');
    apply(() => {
      $.slide(OctreeInfo.prototype, 'depth', depthDescriptor);
    }, 'slide', 'depth');
    apply(() => {
      $.range([4, 12, 1])(OctreeInfo.prototype, 'depth', depthDescriptor);
    }, 'range', 'depth');
    apply(() => {
      $.editable(OctreeInfo.prototype, 'depth', depthDescriptor);
    }, 'editable', 'depth');
    apply(() => {
      $.serializable(OctreeInfo.prototype, '_enabled', () => {
        return false;
      });
    }, 'serializable', '_enabled');
    apply(() => {
      $.serializable(OctreeInfo.prototype, '_minPos', () => {
        return new Vec3(DEFAULT_WORLD_MIN_POS);
      });
    }, 'serializable', '_minPos');
    apply(() => {
      $.serializable(OctreeInfo.prototype, '_maxPos', () => {
        return new Vec3(DEFAULT_WORLD_MAX_POS);
      });
    }, 'serializable', '_maxPos');
    apply(() => {
      $.serializable(OctreeInfo.prototype, '_depth', () => {
        return DEFAULT_OCTREE_DEPTH;
      });
    }, 'serializable', '_depth');
    apply(() => {
      $.ccclass('cc.OctreeInfo')(OctreeInfo);
    }, 'ccclass', null);
  } // end of patch_cc_OctreeInfo

  //---- class cc_PointLight

  function patch_cc_PointLight(ctx, apply = defaultExec) {
    const {
      PointLight,
      scene,
      Camera,
      PhotometricTerm,
      CCInteger,
      CCFloat
    } = {
      ...ctx
    };
    const luminousFluxDescriptor = Object.getOwnPropertyDescriptor(PointLight.prototype, 'luminousFlux');
    const luminanceDescriptor = Object.getOwnPropertyDescriptor(PointLight.prototype, 'luminance');
    const termDescriptor = Object.getOwnPropertyDescriptor(PointLight.prototype, 'term');
    const rangeDescriptor = Object.getOwnPropertyDescriptor(PointLight.prototype, 'range');
    apply(() => {
      $.formerlySerializedAs('_luminance')(PointLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'formerlySerializedAs', '_luminanceHDR');
    apply(() => {
      $.serializable(PointLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'serializable', '_luminanceHDR');
    apply(() => {
      $.serializable(PointLight.prototype, '_luminanceLDR', () => {
        return 1700 / scene.nt2lm(0.15) * Camera.standardExposureValue * Camera.standardLightMeterScale;
      });
    }, 'serializable', '_luminanceLDR');
    apply(() => {
      $.serializable(PointLight.prototype, '_term', () => {
        return PhotometricTerm.LUMINOUS_FLUX;
      });
    }, 'serializable', '_term');
    apply(() => {
      $.serializable(PointLight.prototype, '_range', () => {
        return 1;
      });
    }, 'serializable', '_range');
    apply(() => {
      $.type(CCInteger)(PointLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'type', 'luminousFlux');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 100])(PointLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'range', 'luminousFlux');
    apply(() => {
      $.editable(PointLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'editable', 'luminousFlux');
    apply(() => {
      $.tooltip('i18n:lights.luminous_flux')(PointLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'tooltip', 'luminousFlux');
    apply(() => {
      $.displayOrder(-1)(PointLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'displayOrder', 'luminousFlux');
    apply(() => {
      $.type(CCInteger)(PointLight.prototype, 'luminance', luminanceDescriptor);
    }, 'type', 'luminance');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 10])(PointLight.prototype, 'luminance', luminanceDescriptor);
    }, 'range', 'luminance');
    apply(() => {
      $.editable(PointLight.prototype, 'luminance', luminanceDescriptor);
    }, 'editable', 'luminance');
    apply(() => {
      $.tooltip('i18n:lights.luminance')(PointLight.prototype, 'luminance', luminanceDescriptor);
    }, 'tooltip', 'luminance');
    apply(() => {
      $.displayOrder(-1)(PointLight.prototype, 'luminance', luminanceDescriptor);
    }, 'displayOrder', 'luminance');
    apply(() => {
      $.editable(PointLight.prototype, 'term', termDescriptor);
    }, 'editable', 'term');
    apply(() => {
      $.tooltip('i18n:lights.term')(PointLight.prototype, 'term', termDescriptor);
    }, 'tooltip', 'term');
    apply(() => {
      $.displayOrder(-2)(PointLight.prototype, 'term', termDescriptor);
    }, 'displayOrder', 'term');
    apply(() => {
      $.type(PhotometricTerm)(PointLight.prototype, 'term', termDescriptor);
    }, 'type', 'term');
    apply(() => {
      $.type(CCFloat)(PointLight.prototype, 'range', rangeDescriptor);
    }, 'type', 'range');
    apply(() => {
      $$.rangeMin(0)(PointLight.prototype, 'range', rangeDescriptor);
    }, 'rangeMin', 'range');
    apply(() => {
      $.editable(PointLight.prototype, 'range', rangeDescriptor);
    }, 'editable', 'range');
    apply(() => {
      $.tooltip('i18n:lights.range')(PointLight.prototype, 'range', rangeDescriptor);
    }, 'tooltip', 'range');
    apply(() => {
      $.executeInEditMode(PointLight);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Light/PointLight')(PointLight);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.PointLight')(PointLight);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.PointLight')(PointLight);
    }, 'ccclass', null);
  } // end of patch_cc_PointLight

  //---- class cc_PostSettingsInfo

  function patch_cc_PostSettingsInfo(ctx, apply = defaultExec) {
    const {
      PostSettingsInfo,
      ToneMappingType
    } = {
      ...ctx
    };
    const toneMappingTypeDescriptor = Object.getOwnPropertyDescriptor(PostSettingsInfo.prototype, 'toneMappingType');
    apply(() => {
      $.tooltip('i18n:tone_mapping.toneMappingType')(PostSettingsInfo.prototype, 'toneMappingType', toneMappingTypeDescriptor);
    }, 'tooltip', 'toneMappingType');
    apply(() => {
      $.type(ToneMappingType)(PostSettingsInfo.prototype, 'toneMappingType', toneMappingTypeDescriptor);
    }, 'type', 'toneMappingType');
    apply(() => {
      $.editable(PostSettingsInfo.prototype, 'toneMappingType', toneMappingTypeDescriptor);
    }, 'editable', 'toneMappingType');
    apply(() => {
      $.serializable(PostSettingsInfo.prototype, '_toneMappingType', () => {
        return ToneMappingType.DEFAULT;
      });
    }, 'serializable', '_toneMappingType');
    apply(() => {
      $.ccclass('cc.PostSettingsInfo')(PostSettingsInfo);
    }, 'ccclass', null);
  } // end of patch_cc_PostSettingsInfo

  //---- class cc_RangedDirectionalLight

  function patch_cc_RangedDirectionalLight(ctx, apply = defaultExec) {
    const {
      RangedDirectionalLight,
      Camera,
      CCInteger
    } = {
      ...ctx
    };
    const illuminanceDescriptor = Object.getOwnPropertyDescriptor(RangedDirectionalLight.prototype, 'illuminance');
    apply(() => {
      $.formerlySerializedAs('_illuminance')(RangedDirectionalLight.prototype, '_illuminanceHDR', () => {
        return 65000;
      });
    }, 'formerlySerializedAs', '_illuminanceHDR');
    apply(() => {
      $.property(RangedDirectionalLight.prototype, '_illuminanceHDR', () => {
        return 65000;
      });
    }, 'property', '_illuminanceHDR');
    apply(() => {
      $.serializable(RangedDirectionalLight.prototype, '_illuminanceLDR', () => {
        return 65000 * Camera.standardExposureValue;
      });
    }, 'serializable', '_illuminanceLDR');
    apply(() => {
      $.type(CCInteger)(RangedDirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'type', 'illuminance');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 10])(RangedDirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'range', 'illuminance');
    apply(() => {
      $.editable(RangedDirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'editable', 'illuminance');
    apply(() => {
      $.tooltip('i18n:lights.illuminance')(RangedDirectionalLight.prototype, 'illuminance', illuminanceDescriptor);
    }, 'tooltip', 'illuminance');
    apply(() => {
      $.executeInEditMode(RangedDirectionalLight);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Light/RangedDirectionalLight')(RangedDirectionalLight);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.RangedDirectionalLight')(RangedDirectionalLight);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.RangedDirectionalLight')(RangedDirectionalLight);
    }, 'ccclass', null);
  } // end of patch_cc_RangedDirectionalLight

  //---- class cc_RenderPipeline

  function patch_cc_RenderPipeline(ctx, apply = defaultExec) {
    const {
      RenderPipeline,
      RenderFlow
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(RenderPipeline.prototype, '_tag', () => {
        return 0;
      });
    }, 'serializable', '_tag');
    apply(() => {
      $.displayOrder(0)(RenderPipeline.prototype, '_tag', () => {
        return 0;
      });
    }, 'displayOrder', '_tag');
    apply(() => {
      $.serializable(RenderPipeline.prototype, '_flows', () => {
        return [];
      });
    }, 'serializable', '_flows');
    apply(() => {
      $.type([RenderFlow])(RenderPipeline.prototype, '_flows', () => {
        return [];
      });
    }, 'type', '_flows');
    apply(() => {
      $.displayOrder(1)(RenderPipeline.prototype, '_flows', () => {
        return [];
      });
    }, 'displayOrder', '_flows');
    apply(() => {
      $.ccclass('cc.RenderPipeline')(RenderPipeline);
    }, 'ccclass', null);
  } // end of patch_cc_RenderPipeline

  //---- class cc_RenderTexture

  function patch_cc_RenderTexture(ctx, apply = defaultExec) {
    const {
      RenderTexture
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('cc.RenderTexture')(RenderTexture);
    }, 'ccclass', null);
  } // end of patch_cc_RenderTexture

  //---- class cc_Scene

  function patch_cc_Scene(ctx, apply = defaultExec) {
    const {
      Scene,
      SceneGlobals
    } = {
      ...ctx
    };
    const globalsDescriptor = Object.getOwnPropertyDescriptor(Scene.prototype, 'globals');
    apply(() => {
      $.editable(Scene.prototype, 'globals', globalsDescriptor);
    }, 'editable', 'globals');
    apply(() => {
      $.editable(Scene.prototype, 'autoReleaseAssets', () => {
        return false;
      });
    }, 'editable', 'autoReleaseAssets');
    apply(() => {
      $.serializable(Scene.prototype, 'autoReleaseAssets', () => {
        return false;
      });
    }, 'serializable', 'autoReleaseAssets');
    apply(() => {
      $.serializable(Scene.prototype, '_globals', () => {
        return new SceneGlobals();
      });
    }, 'serializable', '_globals');
    apply(() => {
      $.ccclass('cc.Scene')(Scene);
    }, 'ccclass', null);
  } // end of patch_cc_Scene

  //---- class cc_SceneAsset

  function patch_cc_SceneAsset(ctx, apply = defaultExec) {
    const {
      SceneAsset
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(SceneAsset.prototype, 'scene', () => {
        return null;
      });
    }, 'serializable', 'scene');
    apply(() => {
      $.editable(SceneAsset.prototype, 'scene', () => {
        return null;
      });
    }, 'editable', 'scene');
    apply(() => {
      $.ccclass('cc.SceneAsset')(SceneAsset);
    }, 'ccclass', null);
  } // end of patch_cc_SceneAsset

  //---- class cc_SceneGlobals

  function patch_cc_SceneGlobals(ctx, apply = defaultExec) {
    const {
      SceneGlobals,
      AmbientInfo,
      ShadowsInfo,
      SkyboxInfo,
      FogInfo,
      OctreeInfo,
      SkinInfo,
      LightProbeInfo,
      PostSettingsInfo
    } = {
      ...ctx
    };
    const skyboxDescriptor = Object.getOwnPropertyDescriptor(SceneGlobals.prototype, 'skybox');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'ambient', () => {
        return new AmbientInfo();
      });
    }, 'editable', 'ambient');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'ambient', () => {
        return new AmbientInfo();
      });
    }, 'serializable', 'ambient');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'shadows', () => {
        return new ShadowsInfo();
      });
    }, 'editable', 'shadows');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'shadows', () => {
        return new ShadowsInfo();
      });
    }, 'serializable', 'shadows');
    apply(() => {
      $.serializable(SceneGlobals.prototype, '_skybox', () => {
        return new SkyboxInfo();
      });
    }, 'serializable', '_skybox');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'fog', () => {
        return new FogInfo();
      });
    }, 'serializable', 'fog');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'fog', () => {
        return new FogInfo();
      });
    }, 'editable', 'fog');
    apply(() => {
      $.type(SkyboxInfo)(SceneGlobals.prototype, 'skybox', skyboxDescriptor);
    }, 'type', 'skybox');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'skybox', skyboxDescriptor);
    }, 'editable', 'skybox');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'octree', () => {
        return new OctreeInfo();
      });
    }, 'serializable', 'octree');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'octree', () => {
        return new OctreeInfo();
      });
    }, 'editable', 'octree');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'skin', () => {
        return new SkinInfo();
      });
    }, 'serializable', 'skin');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'skin', () => {
        return new SkinInfo();
      });
    }, 'editable', 'skin');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'lightProbeInfo', () => {
        return new LightProbeInfo();
      });
    }, 'serializable', 'lightProbeInfo');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'lightProbeInfo', () => {
        return new LightProbeInfo();
      });
    }, 'editable', 'lightProbeInfo');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'postSettings', () => {
        return new PostSettingsInfo();
      });
    }, 'serializable', 'postSettings');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'postSettings', () => {
        return new PostSettingsInfo();
      });
    }, 'editable', 'postSettings');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'bakedWithStationaryMainLight', () => {
        return false;
      });
    }, 'serializable', 'bakedWithStationaryMainLight');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'bakedWithStationaryMainLight', () => {
        return false;
      });
    }, 'editable', 'bakedWithStationaryMainLight');
    apply(() => {
      $.serializable(SceneGlobals.prototype, 'bakedWithHighpLightmap', () => {
        return false;
      });
    }, 'serializable', 'bakedWithHighpLightmap');
    apply(() => {
      $.editable(SceneGlobals.prototype, 'bakedWithHighpLightmap', () => {
        return false;
      });
    }, 'editable', 'bakedWithHighpLightmap');
    apply(() => {
      $.ccclass('cc.SceneGlobals')(SceneGlobals);
    }, 'ccclass', null);
  } // end of patch_cc_SceneGlobals

  //---- class cc_ShadowsInfo

  function patch_cc_ShadowsInfo(ctx, apply = defaultExec) {
    const {
      ShadowsInfo,
      ShadowType,
      CCFloat,
      CCInteger,
      ShadowSize,
      Vec3,
      Color,
      Vec2
    } = {
      ...ctx
    };
    const enabledDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'enabled');
    const typeDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'type');
    const shadowColorDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'shadowColor');
    const planeDirectionDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'planeDirection');
    const planeHeightDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'planeHeight');
    const planeBiasDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'planeBias');
    const maxReceivedDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'maxReceived');
    const shadowMapSizeDescriptor = Object.getOwnPropertyDescriptor(ShadowsInfo.prototype, 'shadowMapSize');
    apply(() => {
      $.tooltip('i18n:shadow.enabled')(ShadowsInfo.prototype, 'enabled', enabledDescriptor);
    }, 'tooltip', 'enabled');
    apply(() => {
      $.editable(ShadowsInfo.prototype, 'enabled', enabledDescriptor);
    }, 'editable', 'enabled');
    apply(() => {
      $.type(ShadowType)(ShadowsInfo.prototype, 'type', typeDescriptor);
    }, 'type', 'type');
    apply(() => {
      $.editable(ShadowsInfo.prototype, 'type', typeDescriptor);
    }, 'editable', 'type');
    apply(() => {
      $.tooltip('i18n:shadow.type')(ShadowsInfo.prototype, 'type', typeDescriptor);
    }, 'tooltip', 'type');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.Planar;
      })(ShadowsInfo.prototype, 'shadowColor', shadowColorDescriptor);
    }, 'visible', 'shadowColor');
    apply(() => {
      $.tooltip('i18n:shadow.shadowColor')(ShadowsInfo.prototype, 'shadowColor', shadowColorDescriptor);
    }, 'tooltip', 'shadowColor');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.Planar;
      })(ShadowsInfo.prototype, 'planeDirection', planeDirectionDescriptor);
    }, 'visible', 'planeDirection');
    apply(() => {
      $.tooltip('i18n:shadow.planeDirection')(ShadowsInfo.prototype, 'planeDirection', planeDirectionDescriptor);
    }, 'tooltip', 'planeDirection');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.Planar;
      })(ShadowsInfo.prototype, 'planeHeight', planeHeightDescriptor);
    }, 'visible', 'planeHeight');
    apply(() => {
      $.type(CCFloat)(ShadowsInfo.prototype, 'planeHeight', planeHeightDescriptor);
    }, 'type', 'planeHeight');
    apply(() => {
      $.editable(ShadowsInfo.prototype, 'planeHeight', planeHeightDescriptor);
    }, 'editable', 'planeHeight');
    apply(() => {
      $.tooltip('i18n:shadow.planeHeight')(ShadowsInfo.prototype, 'planeHeight', planeHeightDescriptor);
    }, 'tooltip', 'planeHeight');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.Planar;
      })(ShadowsInfo.prototype, 'planeBias', planeBiasDescriptor);
    }, 'visible', 'planeBias');
    apply(() => {
      $.type(CCFloat)(ShadowsInfo.prototype, 'planeBias', planeBiasDescriptor);
    }, 'type', 'planeBias');
    apply(() => {
      $.editable(ShadowsInfo.prototype, 'planeBias', planeBiasDescriptor);
    }, 'editable', 'planeBias');
    apply(() => {
      $.tooltip('i18n:shadow.planeBias')(ShadowsInfo.prototype, 'planeBias', planeBiasDescriptor);
    }, 'tooltip', 'planeBias');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.ShadowMap;
      })(ShadowsInfo.prototype, 'maxReceived', maxReceivedDescriptor);
    }, 'visible', 'maxReceived');
    apply(() => {
      $.type(CCInteger)(ShadowsInfo.prototype, 'maxReceived', maxReceivedDescriptor);
    }, 'type', 'maxReceived');
    apply(() => {
      $.tooltip('i18n:shadow.maxReceived')(ShadowsInfo.prototype, 'maxReceived', maxReceivedDescriptor);
    }, 'tooltip', 'maxReceived');
    apply(() => {
      $.visible(function () {
        return this._type === ShadowType.ShadowMap;
      })(ShadowsInfo.prototype, 'shadowMapSize', shadowMapSizeDescriptor);
    }, 'visible', 'shadowMapSize');
    apply(() => {
      $.type(ShadowSize)(ShadowsInfo.prototype, 'shadowMapSize', shadowMapSizeDescriptor);
    }, 'type', 'shadowMapSize');
    apply(() => {
      $.tooltip('i18n:shadow.shadowMapSize')(ShadowsInfo.prototype, 'shadowMapSize', shadowMapSizeDescriptor);
    }, 'tooltip', 'shadowMapSize');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_enabled', () => {
        return false;
      });
    }, 'serializable', '_enabled');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_type', () => {
        return ShadowType.Planar;
      });
    }, 'serializable', '_type');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_normal', () => {
        return new Vec3(0, 1, 0);
      });
    }, 'serializable', '_normal');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_distance', () => {
        return 0;
      });
    }, 'serializable', '_distance');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_planeBias', () => {
        return 1.0;
      });
    }, 'serializable', '_planeBias');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_shadowColor', () => {
        return new Color(0, 0, 0, 76);
      });
    }, 'serializable', '_shadowColor');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_maxReceived', () => {
        return 4;
      });
    }, 'serializable', '_maxReceived');
    apply(() => {
      $.serializable(ShadowsInfo.prototype, '_size', () => {
        return new Vec2(1024, 1024);
      });
    }, 'serializable', '_size');
    apply(() => {
      $.ccclass('cc.ShadowsInfo')(ShadowsInfo);
    }, 'ccclass', null);
  } // end of patch_cc_ShadowsInfo

  //---- class cc_SimpleTexture

  function patch_cc_SimpleTexture(ctx, apply = defaultExec) {
    const {
      SimpleTexture
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('cc.SimpleTexture')(SimpleTexture);
    }, 'ccclass', null);
  } // end of patch_cc_SimpleTexture

  //---- class cc_Skeleton

  function patch_cc_Skeleton(ctx, apply = defaultExec) {
    const {
      Skeleton,
      CCString,
      Mat4
    } = {
      ...ctx
    };
    apply(() => {
      $.type([CCString])(Skeleton.prototype, '_joints', () => {
        return [];
      });
    }, 'type', '_joints');
    apply(() => {
      $.type([Mat4])(Skeleton.prototype, '_bindposes', () => {
        return [];
      });
    }, 'type', '_bindposes');
    apply(() => {
      $.serializable(Skeleton.prototype, '_hash', () => {
        return 0;
      });
    }, 'serializable', '_hash');
    apply(() => {
      $.ccclass('cc.Skeleton')(Skeleton);
    }, 'ccclass', null);
  } // end of patch_cc_Skeleton

  //---- class cc_SkinInfo

  function patch_cc_SkinInfo(ctx, apply = defaultExec) {
    const {
      SkinInfo,
      CCFloat
    } = {
      ...ctx
    };
    const enabledDescriptor = Object.getOwnPropertyDescriptor(SkinInfo.prototype, 'enabled');
    const blurRadiusDescriptor = Object.getOwnPropertyDescriptor(SkinInfo.prototype, 'blurRadius');
    const sssIntensityDescriptor = Object.getOwnPropertyDescriptor(SkinInfo.prototype, 'sssIntensity');
    apply(() => {
      $.tooltip('i18n:skin.enabled')(SkinInfo.prototype, 'enabled', enabledDescriptor);
    }, 'tooltip', 'enabled');
    apply(() => {
      $$.readOnly(SkinInfo.prototype, 'enabled', enabledDescriptor);
    }, 'readOnly', 'enabled');
    apply(() => {
      $.editable(SkinInfo.prototype, 'enabled', enabledDescriptor);
    }, 'editable', 'enabled');
    apply(() => {
      $.tooltip('i18n:skin.blurRadius')(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'tooltip', 'blurRadius');
    apply(() => {
      $.type(CCFloat)(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'type', 'blurRadius');
    apply(() => {
      $.slide(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'slide', 'blurRadius');
    apply(() => {
      $.range([0.0, 0.1, 0.001])(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'range', 'blurRadius');
    apply(() => {
      $.editable(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'editable', 'blurRadius');
    apply(() => {
      $.visible(false)(SkinInfo.prototype, 'blurRadius', blurRadiusDescriptor);
    }, 'visible', 'blurRadius');
    apply(() => {
      $.tooltip('i18n:skin.sssIntensity')(SkinInfo.prototype, 'sssIntensity', sssIntensityDescriptor);
    }, 'tooltip', 'sssIntensity');
    apply(() => {
      $.type(CCFloat)(SkinInfo.prototype, 'sssIntensity', sssIntensityDescriptor);
    }, 'type', 'sssIntensity');
    apply(() => {
      $.slide(SkinInfo.prototype, 'sssIntensity', sssIntensityDescriptor);
    }, 'slide', 'sssIntensity');
    apply(() => {
      $.range([0.0, 10.0, 0.1])(SkinInfo.prototype, 'sssIntensity', sssIntensityDescriptor);
    }, 'range', 'sssIntensity');
    apply(() => {
      $.editable(SkinInfo.prototype, 'sssIntensity', sssIntensityDescriptor);
    }, 'editable', 'sssIntensity');
    apply(() => {
      $.serializable(SkinInfo.prototype, '_enabled', () => {
        return true;
      });
    }, 'serializable', '_enabled');
    apply(() => {
      $.serializable(SkinInfo.prototype, '_blurRadius', () => {
        return 0.01;
      });
    }, 'serializable', '_blurRadius');
    apply(() => {
      $.serializable(SkinInfo.prototype, '_sssIntensity', () => {
        return 3.0;
      });
    }, 'serializable', '_sssIntensity');
    apply(() => {
      $.ccclass('cc.SkinInfo')(SkinInfo);
    }, 'ccclass', null);
  } // end of patch_cc_SkinInfo

  //---- class cc_SkyboxInfo

  function patch_cc_SkyboxInfo(ctx, apply = defaultExec) {
    const {
      SkyboxInfo,
      EnvironmentLightingType,
      TextureCube,
      CCFloat,
      Material
    } = {
      ...ctx
    };
    const enabledDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'enabled');
    const envLightingTypeDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'envLightingType');
    const useHDRDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'useHDR');
    const envmapDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'envmap');
    const rotationAngleDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'rotationAngle');
    const diffuseMapDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'diffuseMap');
    const reflectionMapDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'reflectionMap');
    const skyboxMaterialDescriptor = Object.getOwnPropertyDescriptor(SkyboxInfo.prototype, 'skyboxMaterial');
    apply(() => {
      $.tooltip('i18n:skybox.enabled')(SkyboxInfo.prototype, 'enabled', enabledDescriptor);
    }, 'tooltip', 'enabled');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'enabled', enabledDescriptor);
    }, 'editable', 'enabled');
    apply(() => {
      $.tooltip('i18n:skybox.EnvironmentLightingType')(SkyboxInfo.prototype, 'envLightingType', envLightingTypeDescriptor);
    }, 'tooltip', 'envLightingType');
    apply(() => {
      $.type(EnvironmentLightingType)(SkyboxInfo.prototype, 'envLightingType', envLightingTypeDescriptor);
    }, 'type', 'envLightingType');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'envLightingType', envLightingTypeDescriptor);
    }, 'editable', 'envLightingType');
    apply(() => {
      $.tooltip('i18n:skybox.useHDR')(SkyboxInfo.prototype, 'useHDR', useHDRDescriptor);
    }, 'tooltip', 'useHDR');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'useHDR', useHDRDescriptor);
    }, 'editable', 'useHDR');
    apply(() => {
      $.tooltip('i18n:skybox.envmap')(SkyboxInfo.prototype, 'envmap', envmapDescriptor);
    }, 'tooltip', 'envmap');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, 'envmap', envmapDescriptor);
    }, 'type', 'envmap');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'envmap', envmapDescriptor);
    }, 'editable', 'envmap');
    apply(() => {
      $.tooltip('i18n:skybox.rotationAngle')(SkyboxInfo.prototype, 'rotationAngle', rotationAngleDescriptor);
    }, 'tooltip', 'rotationAngle');
    apply(() => {
      $.slide(SkyboxInfo.prototype, 'rotationAngle', rotationAngleDescriptor);
    }, 'slide', 'rotationAngle');
    apply(() => {
      $.range([0, 360, 1])(SkyboxInfo.prototype, 'rotationAngle', rotationAngleDescriptor);
    }, 'range', 'rotationAngle');
    apply(() => {
      $.type(CCFloat)(SkyboxInfo.prototype, 'rotationAngle', rotationAngleDescriptor);
    }, 'type', 'rotationAngle');
    apply(() => {
      $.displayOrder(100)(SkyboxInfo.prototype, 'diffuseMap', diffuseMapDescriptor);
    }, 'displayOrder', 'diffuseMap');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, 'diffuseMap', diffuseMapDescriptor);
    }, 'type', 'diffuseMap');
    apply(() => {
      $$.readOnly(SkyboxInfo.prototype, 'diffuseMap', diffuseMapDescriptor);
    }, 'readOnly', 'diffuseMap');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'diffuseMap', diffuseMapDescriptor);
    }, 'editable', 'diffuseMap');
    apply(() => {
      $.visible(function () {
        if (this.useIBL && this.applyDiffuseMap) {
          return true;
        }
        return false;
      })(SkyboxInfo.prototype, 'diffuseMap', diffuseMapDescriptor);
    }, 'visible', 'diffuseMap');
    apply(() => {
      $.displayOrder(100)(SkyboxInfo.prototype, 'reflectionMap', reflectionMapDescriptor);
    }, 'displayOrder', 'reflectionMap');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, 'reflectionMap', reflectionMapDescriptor);
    }, 'type', 'reflectionMap');
    apply(() => {
      $$.readOnly(SkyboxInfo.prototype, 'reflectionMap', reflectionMapDescriptor);
    }, 'readOnly', 'reflectionMap');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'reflectionMap', reflectionMapDescriptor);
    }, 'editable', 'reflectionMap');
    apply(() => {
      $.visible(function () {
        var _this$_resource;
        if ((_this$_resource = this._resource) != null && _this$_resource.reflectionMap) {
          return true;
        }
        return false;
      })(SkyboxInfo.prototype, 'reflectionMap', reflectionMapDescriptor);
    }, 'visible', 'reflectionMap');
    apply(() => {
      $.tooltip('i18n:skybox.material')(SkyboxInfo.prototype, 'skyboxMaterial', skyboxMaterialDescriptor);
    }, 'tooltip', 'skyboxMaterial');
    apply(() => {
      $.type(Material)(SkyboxInfo.prototype, 'skyboxMaterial', skyboxMaterialDescriptor);
    }, 'type', 'skyboxMaterial');
    apply(() => {
      $.editable(SkyboxInfo.prototype, 'skyboxMaterial', skyboxMaterialDescriptor);
    }, 'editable', 'skyboxMaterial');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_envLightingType', () => {
        return EnvironmentLightingType.HEMISPHERE_DIFFUSE;
      });
    }, 'serializable', '_envLightingType');
    apply(() => {
      $.formerlySerializedAs('_envmap')(SkyboxInfo.prototype, '_envmapHDR', () => {
        return null;
      });
    }, 'formerlySerializedAs', '_envmapHDR');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_envmapHDR', () => {
        return null;
      });
    }, 'type', '_envmapHDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_envmapHDR', () => {
        return null;
      });
    }, 'serializable', '_envmapHDR');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_envmapLDR', () => {
        return null;
      });
    }, 'type', '_envmapLDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_envmapLDR', () => {
        return null;
      });
    }, 'serializable', '_envmapLDR');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_diffuseMapHDR', () => {
        return null;
      });
    }, 'type', '_diffuseMapHDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_diffuseMapHDR', () => {
        return null;
      });
    }, 'serializable', '_diffuseMapHDR');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_diffuseMapLDR', () => {
        return null;
      });
    }, 'type', '_diffuseMapLDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_diffuseMapLDR', () => {
        return null;
      });
    }, 'serializable', '_diffuseMapLDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_enabled', () => {
        return false;
      });
    }, 'serializable', '_enabled');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_useHDR', () => {
        return true;
      });
    }, 'serializable', '_useHDR');
    apply(() => {
      $.type(Material)(SkyboxInfo.prototype, '_editableMaterial', () => {
        return null;
      });
    }, 'type', '_editableMaterial');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_editableMaterial', () => {
        return null;
      });
    }, 'serializable', '_editableMaterial');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_reflectionHDR', () => {
        return null;
      });
    }, 'type', '_reflectionHDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_reflectionHDR', () => {
        return null;
      });
    }, 'serializable', '_reflectionHDR');
    apply(() => {
      $.type(TextureCube)(SkyboxInfo.prototype, '_reflectionLDR', () => {
        return null;
      });
    }, 'type', '_reflectionLDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_reflectionLDR', () => {
        return null;
      });
    }, 'serializable', '_reflectionLDR');
    apply(() => {
      $.serializable(SkyboxInfo.prototype, '_rotationAngle', () => {
        return 0;
      });
    }, 'serializable', '_rotationAngle');
    apply(() => {
      $.ccclass('cc.SkyboxInfo')(SkyboxInfo);
    }, 'ccclass', null);
  } // end of patch_cc_SkyboxInfo

  //---- class cc_SphereLight

  function patch_cc_SphereLight(ctx, apply = defaultExec) {
    const {
      SphereLight,
      scene,
      Camera,
      PhotometricTerm,
      CCInteger,
      CCFloat
    } = {
      ...ctx
    };
    const luminousFluxDescriptor = Object.getOwnPropertyDescriptor(SphereLight.prototype, 'luminousFlux');
    const luminanceDescriptor = Object.getOwnPropertyDescriptor(SphereLight.prototype, 'luminance');
    const termDescriptor = Object.getOwnPropertyDescriptor(SphereLight.prototype, 'term');
    const sizeDescriptor = Object.getOwnPropertyDescriptor(SphereLight.prototype, 'size');
    const rangeDescriptor = Object.getOwnPropertyDescriptor(SphereLight.prototype, 'range');
    apply(() => {
      $.serializable(SphereLight.prototype, '_size', () => {
        return 0.15;
      });
    }, 'serializable', '_size');
    apply(() => {
      $.formerlySerializedAs('_luminance')(SphereLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'formerlySerializedAs', '_luminanceHDR');
    apply(() => {
      $.serializable(SphereLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'serializable', '_luminanceHDR');
    apply(() => {
      $.serializable(SphereLight.prototype, '_luminanceLDR', () => {
        return 1700 / scene.nt2lm(0.15) * Camera.standardExposureValue * Camera.standardLightMeterScale;
      });
    }, 'serializable', '_luminanceLDR');
    apply(() => {
      $.serializable(SphereLight.prototype, '_term', () => {
        return PhotometricTerm.LUMINOUS_FLUX;
      });
    }, 'serializable', '_term');
    apply(() => {
      $.serializable(SphereLight.prototype, '_range', () => {
        return 1;
      });
    }, 'serializable', '_range');
    apply(() => {
      $.type(CCInteger)(SphereLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'type', 'luminousFlux');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 100])(SphereLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'range', 'luminousFlux');
    apply(() => {
      $.editable(SphereLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'editable', 'luminousFlux');
    apply(() => {
      $.tooltip('i18n:lights.luminous_flux')(SphereLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'tooltip', 'luminousFlux');
    apply(() => {
      $.displayOrder(-1)(SphereLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'displayOrder', 'luminousFlux');
    apply(() => {
      $.type(CCInteger)(SphereLight.prototype, 'luminance', luminanceDescriptor);
    }, 'type', 'luminance');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 10])(SphereLight.prototype, 'luminance', luminanceDescriptor);
    }, 'range', 'luminance');
    apply(() => {
      $.editable(SphereLight.prototype, 'luminance', luminanceDescriptor);
    }, 'editable', 'luminance');
    apply(() => {
      $.tooltip('i18n:lights.luminance')(SphereLight.prototype, 'luminance', luminanceDescriptor);
    }, 'tooltip', 'luminance');
    apply(() => {
      $.displayOrder(-1)(SphereLight.prototype, 'luminance', luminanceDescriptor);
    }, 'displayOrder', 'luminance');
    apply(() => {
      $.editable(SphereLight.prototype, 'term', termDescriptor);
    }, 'editable', 'term');
    apply(() => {
      $.tooltip('i18n:lights.term')(SphereLight.prototype, 'term', termDescriptor);
    }, 'tooltip', 'term');
    apply(() => {
      $.displayOrder(-2)(SphereLight.prototype, 'term', termDescriptor);
    }, 'displayOrder', 'term');
    apply(() => {
      $.type(PhotometricTerm)(SphereLight.prototype, 'term', termDescriptor);
    }, 'type', 'term');
    apply(() => {
      $.type(CCFloat)(SphereLight.prototype, 'size', sizeDescriptor);
    }, 'type', 'size');
    apply(() => {
      $.range([0.0, 10.0, 0.001])(SphereLight.prototype, 'size', sizeDescriptor);
    }, 'range', 'size');
    apply(() => {
      $.slide(SphereLight.prototype, 'size', sizeDescriptor);
    }, 'slide', 'size');
    apply(() => {
      $.editable(SphereLight.prototype, 'size', sizeDescriptor);
    }, 'editable', 'size');
    apply(() => {
      $.tooltip('i18n:lights.size')(SphereLight.prototype, 'size', sizeDescriptor);
    }, 'tooltip', 'size');
    apply(() => {
      $.type(CCFloat)(SphereLight.prototype, 'range', rangeDescriptor);
    }, 'type', 'range');
    apply(() => {
      $$.rangeMin(0)(SphereLight.prototype, 'range', rangeDescriptor);
    }, 'rangeMin', 'range');
    apply(() => {
      $.editable(SphereLight.prototype, 'range', rangeDescriptor);
    }, 'editable', 'range');
    apply(() => {
      $.tooltip('i18n:lights.range')(SphereLight.prototype, 'range', rangeDescriptor);
    }, 'tooltip', 'range');
    apply(() => {
      $.executeInEditMode(SphereLight);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Light/SphereLight')(SphereLight);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.SphereLight')(SphereLight);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.SphereLight')(SphereLight);
    }, 'ccclass', null);
  } // end of patch_cc_SphereLight

  //---- class cc_SpotLight

  function patch_cc_SpotLight(ctx, apply = defaultExec) {
    const {
      SpotLight,
      scene,
      Camera,
      PhotometricTerm,
      PCFType,
      CCFloat,
      getPipelineSceneData,
      ShadowType,
      CCBoolean
    } = {
      ...ctx
    };
    const luminousFluxDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'luminousFlux');
    const luminanceDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'luminance');
    const termDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'term');
    const sizeDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'size');
    const rangeDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'range');
    const spotAngleDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'spotAngle');
    const angleAttenuationStrengthDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'angleAttenuationStrength');
    const shadowEnabledDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'shadowEnabled');
    const shadowPcfDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'shadowPcf');
    const shadowBiasDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'shadowBias');
    const shadowNormalBiasDescriptor = Object.getOwnPropertyDescriptor(SpotLight.prototype, 'shadowNormalBias');
    apply(() => {
      $.serializable(SpotLight.prototype, '_size', () => {
        return 0.15;
      });
    }, 'serializable', '_size');
    apply(() => {
      $.formerlySerializedAs('_luminance')(SpotLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'formerlySerializedAs', '_luminanceHDR');
    apply(() => {
      $.serializable(SpotLight.prototype, '_luminanceHDR', () => {
        return 1700 / scene.nt2lm(0.15);
      });
    }, 'serializable', '_luminanceHDR');
    apply(() => {
      $.serializable(SpotLight.prototype, '_luminanceLDR', () => {
        return 1700 / scene.nt2lm(0.15) * Camera.standardExposureValue * Camera.standardLightMeterScale;
      });
    }, 'serializable', '_luminanceLDR');
    apply(() => {
      $.serializable(SpotLight.prototype, '_term', () => {
        return PhotometricTerm.LUMINOUS_FLUX;
      });
    }, 'serializable', '_term');
    apply(() => {
      $.serializable(SpotLight.prototype, '_range', () => {
        return 1;
      });
    }, 'serializable', '_range');
    apply(() => {
      $.serializable(SpotLight.prototype, '_spotAngle', () => {
        return 60;
      });
    }, 'serializable', '_spotAngle');
    apply(() => {
      $.serializable(SpotLight.prototype, '_angleAttenuationStrength', () => {
        return 0;
      });
    }, 'serializable', '_angleAttenuationStrength');
    apply(() => {
      $.serializable(SpotLight.prototype, '_shadowEnabled', () => {
        return false;
      });
    }, 'serializable', '_shadowEnabled');
    apply(() => {
      $.serializable(SpotLight.prototype, '_shadowPcf', () => {
        return PCFType.HARD;
      });
    }, 'serializable', '_shadowPcf');
    apply(() => {
      $.serializable(SpotLight.prototype, '_shadowBias', () => {
        return 0.00001;
      });
    }, 'serializable', '_shadowBias');
    apply(() => {
      $.serializable(SpotLight.prototype, '_shadowNormalBias', () => {
        return 0.0;
      });
    }, 'serializable', '_shadowNormalBias');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 100])(SpotLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'range', 'luminousFlux');
    apply(() => {
      $.displayOrder(-1)(SpotLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'displayOrder', 'luminousFlux');
    apply(() => {
      $.tooltip('i18n:lights.luminous_flux')(SpotLight.prototype, 'luminousFlux', luminousFluxDescriptor);
    }, 'tooltip', 'luminousFlux');
    apply(() => {
      $.range([0, Number.POSITIVE_INFINITY, 10])(SpotLight.prototype, 'luminance', luminanceDescriptor);
    }, 'range', 'luminance');
    apply(() => {
      $.displayOrder(-1)(SpotLight.prototype, 'luminance', luminanceDescriptor);
    }, 'displayOrder', 'luminance');
    apply(() => {
      $.tooltip('i18n:lights.luminance')(SpotLight.prototype, 'luminance', luminanceDescriptor);
    }, 'tooltip', 'luminance');
    apply(() => {
      $.tooltip('i18n:lights.term')(SpotLight.prototype, 'term', termDescriptor);
    }, 'tooltip', 'term');
    apply(() => {
      $.displayOrder(-2)(SpotLight.prototype, 'term', termDescriptor);
    }, 'displayOrder', 'term');
    apply(() => {
      $.type(PhotometricTerm)(SpotLight.prototype, 'term', termDescriptor);
    }, 'type', 'term');
    apply(() => {
      $.type(CCFloat)(SpotLight.prototype, 'size', sizeDescriptor);
    }, 'type', 'size');
    apply(() => {
      $.range([0.0, 10.0, 0.001])(SpotLight.prototype, 'size', sizeDescriptor);
    }, 'range', 'size');
    apply(() => {
      $.slide(SpotLight.prototype, 'size', sizeDescriptor);
    }, 'slide', 'size');
    apply(() => {
      $.editable(SpotLight.prototype, 'size', sizeDescriptor);
    }, 'editable', 'size');
    apply(() => {
      $.tooltip('i18n:lights.size')(SpotLight.prototype, 'size', sizeDescriptor);
    }, 'tooltip', 'size');
    apply(() => {
      $.tooltip('i18n:lights.range')(SpotLight.prototype, 'range', rangeDescriptor);
    }, 'tooltip', 'range');
    apply(() => {
      $.tooltip('i18n:lights.spotAngle')(SpotLight.prototype, 'spotAngle', spotAngleDescriptor);
    }, 'tooltip', 'spotAngle');
    apply(() => {
      $.range([2, 180, 1])(SpotLight.prototype, 'spotAngle', spotAngleDescriptor);
    }, 'range', 'spotAngle');
    apply(() => {
      $.slide(SpotLight.prototype, 'spotAngle', spotAngleDescriptor);
    }, 'slide', 'spotAngle');
    apply(() => {
      $.tooltip('i18n:lights.angleAttenuationStrength')(SpotLight.prototype, 'angleAttenuationStrength', angleAttenuationStrengthDescriptor);
    }, 'tooltip', 'angleAttenuationStrength');
    apply(() => {
      $.range([0, 1, 0.001])(SpotLight.prototype, 'angleAttenuationStrength', angleAttenuationStrengthDescriptor);
    }, 'range', 'angleAttenuationStrength');
    apply(() => {
      $.slide(SpotLight.prototype, 'angleAttenuationStrength', angleAttenuationStrengthDescriptor);
    }, 'slide', 'angleAttenuationStrength');
    apply(() => {
      $.type(CCBoolean)(SpotLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'type', 'shadowEnabled');
    apply(() => {
      $.editable(SpotLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'editable', 'shadowEnabled');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 1
        }
      })(SpotLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'property', 'shadowEnabled');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(SpotLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'visible', 'shadowEnabled');
    apply(() => {
      $.tooltip('i18n:lights.shadowEnabled')(SpotLight.prototype, 'shadowEnabled', shadowEnabledDescriptor);
    }, 'tooltip', 'shadowEnabled');
    apply(() => {
      $.type(PCFType)(SpotLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'type', 'shadowPcf');
    apply(() => {
      $.editable(SpotLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'editable', 'shadowPcf');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 2
        }
      })(SpotLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'property', 'shadowPcf');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(SpotLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'visible', 'shadowPcf');
    apply(() => {
      $.tooltip('i18n:lights.shadowPcf')(SpotLight.prototype, 'shadowPcf', shadowPcfDescriptor);
    }, 'tooltip', 'shadowPcf');
    apply(() => {
      $.type(CCFloat)(SpotLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'type', 'shadowBias');
    apply(() => {
      $.editable(SpotLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'editable', 'shadowBias');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 3
        }
      })(SpotLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'property', 'shadowBias');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(SpotLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'visible', 'shadowBias');
    apply(() => {
      $.tooltip('i18n:lights.shadowBias')(SpotLight.prototype, 'shadowBias', shadowBiasDescriptor);
    }, 'tooltip', 'shadowBias');
    apply(() => {
      $.type(CCFloat)(SpotLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'type', 'shadowNormalBias');
    apply(() => {
      $.editable(SpotLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'editable', 'shadowNormalBias');
    apply(() => {
      $.property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 4
        }
      })(SpotLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'property', 'shadowNormalBias');
    apply(() => {
      $.visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap)(SpotLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'visible', 'shadowNormalBias');
    apply(() => {
      $.tooltip('i18n:lights.shadowNormalBias')(SpotLight.prototype, 'shadowNormalBias', shadowNormalBiasDescriptor);
    }, 'tooltip', 'shadowNormalBias');
    apply(() => {
      $.executeInEditMode(SpotLight);
    }, 'executeInEditMode', null);
    apply(() => {
      $.menu('Light/SpotLight')(SpotLight);
    }, 'menu', null);
    apply(() => {
      $.help('i18n:cc.SpotLight')(SpotLight);
    }, 'help', null);
    apply(() => {
      $.ccclass('cc.SpotLight')(SpotLight);
    }, 'ccclass', null);
  } // end of patch_cc_SpotLight

  //---- class cc_SpriteFrame

  function patch_cc_SpriteFrame(ctx, apply = defaultExec) {
    const {
      SpriteFrame
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('cc.SpriteFrame')(SpriteFrame);
    }, 'ccclass', null);
  } // end of patch_cc_SpriteFrame

  //---- class cc_Tetrahedron

  function patch_cc_Tetrahedron(ctx, apply = defaultExec) {
    const {
      Tetrahedron,
      Mat3,
      Vec3,
      CircumSphere
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'invalid', () => {
        return false;
      });
    }, 'serializable', 'invalid');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'vertex0', () => {
        return -1;
      });
    }, 'serializable', 'vertex0');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'vertex1', () => {
        return -1;
      });
    }, 'serializable', 'vertex1');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'vertex2', () => {
        return -1;
      });
    }, 'serializable', 'vertex2');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'vertex3', () => {
        return -1;
      });
    }, 'serializable', 'vertex3');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'neighbours', () => {
        return [-1, -1, -1, -1];
      });
    }, 'serializable', 'neighbours');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'matrix', () => {
        return new Mat3();
      });
    }, 'serializable', 'matrix');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'offset', () => {
        return new Vec3(0.0, 0.0, 0.0);
      });
    }, 'serializable', 'offset');
    apply(() => {
      $.serializable(Tetrahedron.prototype, 'sphere', () => {
        return new CircumSphere();
      });
    }, 'serializable', 'sphere');
    apply(() => {
      $.ccclass('cc.Tetrahedron')(Tetrahedron);
    }, 'ccclass', null);
  } // end of patch_cc_Tetrahedron

  //---- class cc_TextAsset

  function patch_cc_TextAsset(ctx, apply = defaultExec) {
    const {
      TextAsset
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(TextAsset.prototype, 'text', () => {
        return '';
      });
    }, 'editable', 'text');
    apply(() => {
      $.serializable(TextAsset.prototype, 'text', () => {
        return '';
      });
    }, 'serializable', 'text');
    apply(() => {
      $.ccclass('cc.TextAsset')(TextAsset);
    }, 'ccclass', null);
  } // end of patch_cc_TextAsset

  //---- class cc_Texture2D

  function patch_cc_Texture2D(ctx, apply = defaultExec) {
    const {
      Texture2D,
      ImageAsset
    } = {
      ...ctx
    };
    apply(() => {
      $.type([ImageAsset])(Texture2D.prototype, '_mipmaps', () => {
        return [];
      });
    }, 'type', '_mipmaps');
    apply(() => {
      $.ccclass('cc.Texture2D')(Texture2D);
    }, 'ccclass', null);
  } // end of patch_cc_Texture2D

  //---- class cc_TextureBase

  function patch_cc_TextureBase(ctx, apply = defaultExec) {
    const {
      TextureBase,
      PixelFormat,
      TextureFilter,
      WrapMode
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(TextureBase.prototype, '_format', () => {
        return PixelFormat.RGBA8888;
      });
    }, 'serializable', '_format');
    apply(() => {
      $.serializable(TextureBase.prototype, '_minFilter', () => {
        return TextureFilter.LINEAR;
      });
    }, 'serializable', '_minFilter');
    apply(() => {
      $.serializable(TextureBase.prototype, '_magFilter', () => {
        return TextureFilter.LINEAR;
      });
    }, 'serializable', '_magFilter');
    apply(() => {
      $.serializable(TextureBase.prototype, '_mipFilter', () => {
        return TextureFilter.NONE;
      });
    }, 'serializable', '_mipFilter');
    apply(() => {
      $.serializable(TextureBase.prototype, '_wrapS', () => {
        return WrapMode.REPEAT;
      });
    }, 'serializable', '_wrapS');
    apply(() => {
      $.serializable(TextureBase.prototype, '_wrapT', () => {
        return WrapMode.REPEAT;
      });
    }, 'serializable', '_wrapT');
    apply(() => {
      $.serializable(TextureBase.prototype, '_wrapR', () => {
        return WrapMode.REPEAT;
      });
    }, 'serializable', '_wrapR');
    apply(() => {
      $.serializable(TextureBase.prototype, '_anisotropy', () => {
        return 0;
      });
    }, 'serializable', '_anisotropy');
    apply(() => {
      $.ccclass('cc.TextureBase')(TextureBase);
    }, 'ccclass', null);
  } // end of patch_cc_TextureBase

  //---- class cc_TextureCube

  function patch_cc_TextureCube(ctx, apply = defaultExec) {
    const {
      TextureCube,
      MipmapMode
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(TextureCube.prototype, 'isRGBE', () => {
        return false;
      });
    }, 'serializable', 'isRGBE');
    apply(() => {
      $.serializable(TextureCube.prototype, '_mipmapAtlas', () => {
        return null;
      });
    }, 'serializable', '_mipmapAtlas');
    apply(() => {
      $.serializable(TextureCube.prototype, '_mipmapMode', () => {
        return MipmapMode.NONE;
      });
    }, 'serializable', '_mipmapMode');
    apply(() => {
      $.serializable(TextureCube.prototype, '_mipmaps', () => {
        return [];
      });
    }, 'serializable', '_mipmaps');
    apply(() => {
      $.ccclass('cc.TextureCube')(TextureCube);
    }, 'ccclass', null);
  } // end of patch_cc_TextureCube

  //---- class cc_Vertex

  function patch_cc_Vertex(ctx, apply = defaultExec) {
    const {
      Vertex,
      Vec3
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(Vertex.prototype, 'position', () => {
        return new Vec3(0, 0, 0);
      });
    }, 'serializable', 'position');
    apply(() => {
      $.serializable(Vertex.prototype, 'normal', () => {
        return new Vec3(0, 0, 0);
      });
    }, 'serializable', 'normal');
    apply(() => {
      $.serializable(Vertex.prototype, 'coefficients', () => {
        return [];
      });
    }, 'serializable', 'coefficients');
    apply(() => {
      $.ccclass('cc.Vertex')(Vertex);
    }, 'ccclass', null);
  } // end of patch_cc_Vertex

  //---- class DeferredPipeline

  function patch_DeferredPipeline(ctx, apply = defaultExec) {
    const {
      DeferredPipeline,
      RenderTextureConfig
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(2)(DeferredPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'displayOrder', 'renderTextures');
    apply(() => {
      $.serializable(DeferredPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'serializable', 'renderTextures');
    apply(() => {
      $.type([RenderTextureConfig])(DeferredPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'type', 'renderTextures');
    apply(() => {
      $.ccclass('DeferredPipeline')(DeferredPipeline);
    }, 'ccclass', null);
  } // end of patch_DeferredPipeline

  //---- class ForwardFlow

  function patch_ForwardFlow(ctx, apply = defaultExec) {
    const {
      ForwardFlow
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('ForwardFlow')(ForwardFlow);
    }, 'ccclass', null);
  } // end of patch_ForwardFlow

  //---- class ForwardPipeline

  function patch_ForwardPipeline(ctx, apply = defaultExec) {
    const {
      ForwardPipeline,
      RenderTextureConfig
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(2)(ForwardPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'displayOrder', 'renderTextures');
    apply(() => {
      $.serializable(ForwardPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'serializable', 'renderTextures');
    apply(() => {
      $.type([RenderTextureConfig])(ForwardPipeline.prototype, 'renderTextures', () => {
        return [];
      });
    }, 'type', 'renderTextures');
    apply(() => {
      $.ccclass('ForwardPipeline')(ForwardPipeline);
    }, 'ccclass', null);
  } // end of patch_ForwardPipeline

  //---- class ForwardStage

  function patch_ForwardStage(ctx, apply = defaultExec) {
    const {
      ForwardStage,
      RenderQueueDesc
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(2)(ForwardStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'displayOrder', 'renderQueues');
    apply(() => {
      $.serializable(ForwardStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'serializable', 'renderQueues');
    apply(() => {
      $.type([RenderQueueDesc])(ForwardStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'type', 'renderQueues');
    apply(() => {
      $.ccclass('ForwardStage')(ForwardStage);
    }, 'ccclass', null);
  } // end of patch_ForwardStage

  //---- class FrameBufferDesc

  function patch_FrameBufferDesc(ctx, apply = defaultExec) {
    const {
      FrameBufferDesc,
      CCString,
      RenderTexture
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(FrameBufferDesc.prototype, 'name', () => {
        return '';
      });
    }, 'editable', 'name');
    apply(() => {
      $.serializable(FrameBufferDesc.prototype, 'name', () => {
        return '';
      });
    }, 'serializable', 'name');
    apply(() => {
      $.editable(FrameBufferDesc.prototype, 'renderPass', () => {
        return 0;
      });
    }, 'editable', 'renderPass');
    apply(() => {
      $.serializable(FrameBufferDesc.prototype, 'renderPass', () => {
        return 0;
      });
    }, 'serializable', 'renderPass');
    apply(() => {
      $.type([CCString])(FrameBufferDesc.prototype, 'colorTextures', () => {
        return [];
      });
    }, 'type', 'colorTextures');
    apply(() => {
      $.editable(FrameBufferDesc.prototype, 'depthStencilTexture', () => {
        return '';
      });
    }, 'editable', 'depthStencilTexture');
    apply(() => {
      $.serializable(FrameBufferDesc.prototype, 'depthStencilTexture', () => {
        return '';
      });
    }, 'serializable', 'depthStencilTexture');
    apply(() => {
      $.type(RenderTexture)(FrameBufferDesc.prototype, 'texture', () => {
        return null;
      });
    }, 'type', 'texture');
    apply(() => {
      $.ccclass('FrameBufferDesc')(FrameBufferDesc);
    }, 'ccclass', null);
  } // end of patch_FrameBufferDesc

  //---- class GbufferStage

  function patch_GbufferStage(ctx, apply = defaultExec) {
    const {
      GbufferStage,
      RenderQueueDesc
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(2)(GbufferStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'displayOrder', 'renderQueues');
    apply(() => {
      $.serializable(GbufferStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'serializable', 'renderQueues');
    apply(() => {
      $.type([RenderQueueDesc])(GbufferStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'type', 'renderQueues');
    apply(() => {
      $.ccclass('GbufferStage')(GbufferStage);
    }, 'ccclass', null);
  } // end of patch_GbufferStage

  //---- class LightingStage

  function patch_LightingStage(ctx, apply = defaultExec) {
    const {
      LightingStage,
      Material,
      RenderQueueDesc
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(3)(LightingStage.prototype, '_deferredMaterial', () => {
        return null;
      });
    }, 'displayOrder', '_deferredMaterial');
    apply(() => {
      $.serializable(LightingStage.prototype, '_deferredMaterial', () => {
        return null;
      });
    }, 'serializable', '_deferredMaterial');
    apply(() => {
      $.type(Material)(LightingStage.prototype, '_deferredMaterial', () => {
        return null;
      });
    }, 'type', '_deferredMaterial');
    apply(() => {
      $.displayOrder(2)(LightingStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'displayOrder', 'renderQueues');
    apply(() => {
      $.serializable(LightingStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'serializable', 'renderQueues');
    apply(() => {
      $.type([RenderQueueDesc])(LightingStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'type', 'renderQueues');
    apply(() => {
      $.ccclass('LightingStage')(LightingStage);
    }, 'ccclass', null);
  } // end of patch_LightingStage

  //---- class MainFlow

  function patch_MainFlow(ctx, apply = defaultExec) {
    const {
      MainFlow
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('MainFlow')(MainFlow);
    }, 'ccclass', null);
  } // end of patch_MainFlow

  //---- class PostProcessStage

  function patch_PostProcessStage(ctx, apply = defaultExec) {
    const {
      PostProcessStage,
      Material,
      RenderQueueDesc
    } = {
      ...ctx
    };
    apply(() => {
      $.displayOrder(3)(PostProcessStage.prototype, '_postProcessMaterial', () => {
        return null;
      });
    }, 'displayOrder', '_postProcessMaterial');
    apply(() => {
      $.serializable(PostProcessStage.prototype, '_postProcessMaterial', () => {
        return null;
      });
    }, 'serializable', '_postProcessMaterial');
    apply(() => {
      $.type(Material)(PostProcessStage.prototype, '_postProcessMaterial', () => {
        return null;
      });
    }, 'type', '_postProcessMaterial');
    apply(() => {
      $.displayOrder(2)(PostProcessStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'displayOrder', 'renderQueues');
    apply(() => {
      $.serializable(PostProcessStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'serializable', 'renderQueues');
    apply(() => {
      $.type([RenderQueueDesc])(PostProcessStage.prototype, 'renderQueues', () => {
        return [];
      });
    }, 'type', 'renderQueues');
    apply(() => {
      $.ccclass('PostProcessStage')(PostProcessStage);
    }, 'ccclass', null);
  } // end of patch_PostProcessStage

  //---- class ReflectionProbeFlow

  function patch_ReflectionProbeFlow(ctx, apply = defaultExec) {
    const {
      ReflectionProbeFlow
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('ReflectionProbeFlow')(ReflectionProbeFlow);
    }, 'ccclass', null);
  } // end of patch_ReflectionProbeFlow

  //---- class ReflectionProbeStage

  function patch_ReflectionProbeStage(ctx, apply = defaultExec) {
    const {
      ReflectionProbeStage
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('ReflectionProbeStage')(ReflectionProbeStage);
    }, 'ccclass', null);
  } // end of patch_ReflectionProbeStage

  //---- class RenderFlow

  function patch_RenderFlow(ctx, apply = defaultExec) {
    const {
      RenderFlow,
      RenderStage
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(RenderFlow.prototype, '_name', () => {
        return '';
      });
    }, 'serializable', '_name');
    apply(() => {
      $.displayOrder(0)(RenderFlow.prototype, '_name', () => {
        return '';
      });
    }, 'displayOrder', '_name');
    apply(() => {
      $.serializable(RenderFlow.prototype, '_priority', () => {
        return 0;
      });
    }, 'serializable', '_priority');
    apply(() => {
      $.displayOrder(1)(RenderFlow.prototype, '_priority', () => {
        return 0;
      });
    }, 'displayOrder', '_priority');
    apply(() => {
      $.serializable(RenderFlow.prototype, '_tag', () => {
        return 0;
      });
    }, 'serializable', '_tag');
    apply(() => {
      $.displayOrder(2)(RenderFlow.prototype, '_tag', () => {
        return 0;
      });
    }, 'displayOrder', '_tag');
    apply(() => {
      $.serializable(RenderFlow.prototype, '_stages', () => {
        return [];
      });
    }, 'serializable', '_stages');
    apply(() => {
      $.type([RenderStage])(RenderFlow.prototype, '_stages', () => {
        return [];
      });
    }, 'type', '_stages');
    apply(() => {
      $.displayOrder(3)(RenderFlow.prototype, '_stages', () => {
        return [];
      });
    }, 'displayOrder', '_stages');
    apply(() => {
      $.ccclass('RenderFlow')(RenderFlow);
    }, 'ccclass', null);
  } // end of patch_RenderFlow

  //---- class RenderPassDesc

  function patch_RenderPassDesc(ctx, apply = defaultExec) {
    const {
      RenderPassDesc,
      ColorDesc,
      DepthStencilDesc
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(RenderPassDesc.prototype, 'index', () => {
        return -1;
      });
    }, 'editable', 'index');
    apply(() => {
      $.serializable(RenderPassDesc.prototype, 'index', () => {
        return -1;
      });
    }, 'serializable', 'index');
    apply(() => {
      $.type([ColorDesc])(RenderPassDesc.prototype, 'colorAttachments', () => {
        return [];
      });
    }, 'type', 'colorAttachments');
    apply(() => {
      $.type(DepthStencilDesc)(RenderPassDesc.prototype, 'depthStencilAttachment', () => {
        return new DepthStencilDesc();
      });
    }, 'type', 'depthStencilAttachment');
    apply(() => {
      $.ccclass('RenderPassDesc')(RenderPassDesc);
    }, 'ccclass', null);
  } // end of patch_RenderPassDesc

  //---- class RenderQueueDesc

  function patch_RenderQueueDesc(ctx, apply = defaultExec) {
    const {
      RenderQueueDesc,
      RenderQueueSortMode,
      CCString
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(RenderQueueDesc.prototype, 'isTransparent', () => {
        return false;
      });
    }, 'editable', 'isTransparent');
    apply(() => {
      $.serializable(RenderQueueDesc.prototype, 'isTransparent', () => {
        return false;
      });
    }, 'serializable', 'isTransparent');
    apply(() => {
      $.type(RenderQueueSortMode)(RenderQueueDesc.prototype, 'sortMode', () => {
        return RenderQueueSortMode.FRONT_TO_BACK;
      });
    }, 'type', 'sortMode');
    apply(() => {
      $.type([CCString])(RenderQueueDesc.prototype, 'stages', () => {
        return [];
      });
    }, 'type', 'stages');
    apply(() => {
      $.ccclass('RenderQueueDesc')(RenderQueueDesc);
    }, 'ccclass', null);
  } // end of patch_RenderQueueDesc

  //---- class RenderStage

  function patch_RenderStage(ctx, apply = defaultExec) {
    const {
      RenderStage
    } = {
      ...ctx
    };
    apply(() => {
      $.serializable(RenderStage.prototype, '_name', () => {
        return '';
      });
    }, 'serializable', '_name');
    apply(() => {
      $.displayOrder(0)(RenderStage.prototype, '_name', () => {
        return '';
      });
    }, 'displayOrder', '_name');
    apply(() => {
      $.serializable(RenderStage.prototype, '_priority', () => {
        return 0;
      });
    }, 'serializable', '_priority');
    apply(() => {
      $.displayOrder(1)(RenderStage.prototype, '_priority', () => {
        return 0;
      });
    }, 'displayOrder', '_priority');
    apply(() => {
      $.serializable(RenderStage.prototype, '_tag', () => {
        return 0;
      });
    }, 'serializable', '_tag');
    apply(() => {
      $.displayOrder(2)(RenderStage.prototype, '_tag', () => {
        return 0;
      });
    }, 'displayOrder', '_tag');
    apply(() => {
      $.ccclass('RenderStage')(RenderStage);
    }, 'ccclass', null);
  } // end of patch_RenderStage

  //---- class RenderTextureDesc

  function patch_RenderTextureDesc(ctx, apply = defaultExec) {
    const {
      RenderTextureDesc,
      TextureType,
      TextureUsageBit,
      Format
    } = {
      ...ctx
    };
    apply(() => {
      $.editable(RenderTextureDesc.prototype, 'name', () => {
        return '';
      });
    }, 'editable', 'name');
    apply(() => {
      $.serializable(RenderTextureDesc.prototype, 'name', () => {
        return '';
      });
    }, 'serializable', 'name');
    apply(() => {
      $.type(TextureType)(RenderTextureDesc.prototype, 'type', () => {
        return TextureType.TEX2D;
      });
    }, 'type', 'type');
    apply(() => {
      $.type(TextureUsageBit)(RenderTextureDesc.prototype, 'usage', () => {
        return TextureUsageBit.COLOR_ATTACHMENT;
      });
    }, 'type', 'usage');
    apply(() => {
      $.type(Format)(RenderTextureDesc.prototype, 'format', () => {
        return Format.UNKNOWN;
      });
    }, 'type', 'format');
    apply(() => {
      $.editable(RenderTextureDesc.prototype, 'width', () => {
        return -1;
      });
    }, 'editable', 'width');
    apply(() => {
      $.serializable(RenderTextureDesc.prototype, 'width', () => {
        return -1;
      });
    }, 'serializable', 'width');
    apply(() => {
      $.editable(RenderTextureDesc.prototype, 'height', () => {
        return -1;
      });
    }, 'editable', 'height');
    apply(() => {
      $.serializable(RenderTextureDesc.prototype, 'height', () => {
        return -1;
      });
    }, 'serializable', 'height');
    apply(() => {
      $.ccclass('RenderTextureDesc')(RenderTextureDesc);
    }, 'ccclass', null);
  } // end of patch_RenderTextureDesc

  //---- class ShadowFlow

  function patch_ShadowFlow(ctx, apply = defaultExec) {
    const {
      ShadowFlow
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('ShadowFlow')(ShadowFlow);
    }, 'ccclass', null);
  } // end of patch_ShadowFlow

  //---- class ShadowStage

  function patch_ShadowStage(ctx, apply = defaultExec) {
    const {
      ShadowStage
    } = {
      ...ctx
    };
    apply(() => {
      $.ccclass('ShadowStage')(ShadowStage);
    }, 'ccclass', null);
  } // end of patch_ShadowStage
  _export({
    patch_BloomStage: patch_BloomStage,
    patch_cc_AmbientInfo: patch_cc_AmbientInfo,
    patch_cc_Asset: patch_cc_Asset,
    patch_cc_BufferAsset: patch_cc_BufferAsset,
    patch_cc_CircumSphere: patch_cc_CircumSphere,
    patch_cc_DirectionalLight: patch_cc_DirectionalLight,
    patch_cc_EffectAsset: patch_cc_EffectAsset,
    patch_cc_FogInfo: patch_cc_FogInfo,
    patch_cc_ImageAsset: patch_cc_ImageAsset,
    patch_cc_LightProbeInfo: patch_cc_LightProbeInfo,
    patch_cc_LightProbesData: patch_cc_LightProbesData,
    patch_cc_Line: patch_cc_Line,
    patch_cc_Material: patch_cc_Material,
    patch_cc_Mesh: patch_cc_Mesh,
    patch_cc_Node: patch_cc_Node,
    patch_cc_OctreeInfo: patch_cc_OctreeInfo,
    patch_cc_PointLight: patch_cc_PointLight,
    patch_cc_PostSettingsInfo: patch_cc_PostSettingsInfo,
    patch_cc_RangedDirectionalLight: patch_cc_RangedDirectionalLight,
    patch_cc_RenderPipeline: patch_cc_RenderPipeline,
    patch_cc_RenderTexture: patch_cc_RenderTexture,
    patch_cc_Scene: patch_cc_Scene,
    patch_cc_SceneAsset: patch_cc_SceneAsset,
    patch_cc_SceneGlobals: patch_cc_SceneGlobals,
    patch_cc_ShadowsInfo: patch_cc_ShadowsInfo,
    patch_cc_SimpleTexture: patch_cc_SimpleTexture,
    patch_cc_Skeleton: patch_cc_Skeleton,
    patch_cc_SkinInfo: patch_cc_SkinInfo,
    patch_cc_SkyboxInfo: patch_cc_SkyboxInfo,
    patch_cc_SphereLight: patch_cc_SphereLight,
    patch_cc_SpotLight: patch_cc_SpotLight,
    patch_cc_SpriteFrame: patch_cc_SpriteFrame,
    patch_cc_Tetrahedron: patch_cc_Tetrahedron,
    patch_cc_TextAsset: patch_cc_TextAsset,
    patch_cc_Texture2D: patch_cc_Texture2D,
    patch_cc_TextureBase: patch_cc_TextureBase,
    patch_cc_TextureCube: patch_cc_TextureCube,
    patch_cc_Vertex: patch_cc_Vertex,
    patch_DeferredPipeline: patch_DeferredPipeline,
    patch_ForwardFlow: patch_ForwardFlow,
    patch_ForwardPipeline: patch_ForwardPipeline,
    patch_ForwardStage: patch_ForwardStage,
    patch_FrameBufferDesc: patch_FrameBufferDesc,
    patch_GbufferStage: patch_GbufferStage,
    patch_LightingStage: patch_LightingStage,
    patch_MainFlow: patch_MainFlow,
    patch_PostProcessStage: patch_PostProcessStage,
    patch_ReflectionProbeFlow: patch_ReflectionProbeFlow,
    patch_ReflectionProbeStage: patch_ReflectionProbeStage,
    patch_RenderFlow: patch_RenderFlow,
    patch_RenderPassDesc: patch_RenderPassDesc,
    patch_RenderQueueDesc: patch_RenderQueueDesc,
    patch_RenderStage: patch_RenderStage,
    patch_RenderTextureDesc: patch_RenderTextureDesc,
    patch_ShadowFlow: patch_ShadowFlow,
    patch_ShadowStage: patch_ShadowStage
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      $$ = _coreDataDecoratorsIndexJs;
    }, function (_coreIndexJs) {
      $ = _coreIndexJs._decorator;
    }],
    execute: function () {
      /* This file is generated by script, do not modify it manually. */
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
      /* eslint-disable brace-style */
      /* eslint-disable @typescript-eslint/indent */
      /* eslint-disable max-len */
      /* eslint-disable arrow-body-style */
      /* eslint-disable comma-dangle */
      /* eslint-disable func-names */
      /* eslint-disable space-before-function-paren */
      defaultExec = (cb, decorator, attr) => {
        cb();
      }; //---- class BloomStage
    }
  };
});