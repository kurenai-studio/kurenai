System.register("q-bundled:///fs/cocos/rendering/post-process/utils/pass-context.js", ["../../../../../virtual/internal%253Aconstants.js", "../../custom/types.js", "../../../gfx/index.js", "../../../render-scene/scene/index.js", "../../custom/define.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, LightInfo, QueueHint, ResourceResidency, SceneFlags, ClearFlagBit, Color, Format, LoadOp, Rect, StoreOp, Viewport, SkyBoxFlagValue, getRenderArea, Vec4, geometry, PassContext, sphere, boundingBox, rangedDirLightBoundingBox, passContext;
  _export("PassContext", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_customTypesJs) {
      LightInfo = _customTypesJs.LightInfo;
      QueueHint = _customTypesJs.QueueHint;
      ResourceResidency = _customTypesJs.ResourceResidency;
      SceneFlags = _customTypesJs.SceneFlags;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
      Format = _gfxIndexJs.Format;
      LoadOp = _gfxIndexJs.LoadOp;
      Rect = _gfxIndexJs.Rect;
      StoreOp = _gfxIndexJs.StoreOp;
      Viewport = _gfxIndexJs.Viewport;
    }, function (_renderSceneSceneIndexJs) {
      SkyBoxFlagValue = _renderSceneSceneIndexJs.SkyBoxFlagValue;
    }, function (_customDefineJs) {
      getRenderArea = _customDefineJs.getRenderArea;
    }, function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      geometry = _coreIndexJs.geometry;
    }],
    execute: function () {
      sphere = geometry.Sphere.create(0, 0, 0, 1);
      boundingBox = new geometry.AABB();
      rangedDirLightBoundingBox = new geometry.AABB(0.0, 0.0, 0.0, 0.5, 0.5, 0.5);
      _export("PassContext", PassContext = class PassContext {
        constructor() {
          this.clearFlag = ClearFlagBit.COLOR;
          this.clearColor = new Color();
          this.clearDepthColor = new Color();
          this.ppl = void 0;
          this.camera = void 0;
          this.material = void 0;
          this.pass = void 0;
          this.rasterWidth = 0;
          this.rasterHeight = 0;
          this.layoutName = '';
          this.shadingScale = 1;
          this.viewport = new Rect();
          this.passViewport = new Rect();
          this.passPathName = '';
          this.passVersion = 0;
          this.isFinalCamera = false;
          this.isFinalPass = false;
          this.depthSlotName = '';
          this.shadowPass = undefined;
          this.forwardPass = undefined;
          this.postProcess = void 0;
          this.maxSpotLights = 0xFFFFFFFF;
          this.maxSphereLights = 0xFFFFFFFF;
          this.maxPointLights = 0xFFFFFFFF;
          this.maxRangedDirLights = 0xFFFFFFFF;
        }
        setClearFlag(clearFlag) {
          this.clearFlag = clearFlag;
          return this;
        }
        setClearColor(x, y, z, w) {
          Vec4.set(this.clearColor, x, y, z, w);
          return this;
        }
        setClearDepthColor(x, y, z, w) {
          Vec4.set(this.clearDepthColor, x, y, z, w);
          return this;
        }
        version() {
          if (!EDITOR) {
            this.passPathName += `_${this.pass.name}_${this.layoutName}`;
            this.pass.setVersion(this.passPathName, this.passVersion);
          }
          return this;
        }
        clearBlack() {
          this.clearFlag = ClearFlagBit.COLOR;
          Vec4.set(passContext.clearColor, 0, 0, 0, 1);
        }
        addRenderPass(layoutName, passName) {
          const passViewport = this.passViewport;
          const pass = this.ppl.addRenderPass(passViewport.width, passViewport.height, layoutName);
          pass.name = passName;
          this.pass = pass;
          this.layoutName = layoutName;
          this.rasterWidth = passViewport.width;
          this.rasterHeight = passViewport.height;
          pass.setViewport(new Viewport(passViewport.x, passViewport.y, passViewport.width, passViewport.height));
          return this;
        }
        addSceneLights(queue, camera, flags = SceneFlags.BLEND) {
          if (this.maxPointLights === 0 && this.maxSphereLights === 0 && this.maxSpotLights === 0 && this.maxRangedDirLights === 0) {
            return;
          }
          const scene = camera.scene;
          const spotLights = scene.spotLights;
          const sphereLights = scene.sphereLights;
          const pointLights = scene.pointLights;
          const rangedDirLights = scene.rangedDirLights;
          const numSpotLights = Math.min(spotLights.length, this.maxSpotLights);
          const numSphereLights = Math.min(sphereLights.length, this.maxSphereLights);
          const numPointLights = Math.min(pointLights.length, this.maxPointLights);
          const numRangedDirLights = Math.min(rangedDirLights.length, this.maxRangedDirLights);
          for (let i = 0; i < numSpotLights; i++) {
            const light = spotLights[i];
            if (light.baked) {
              continue;
            }
            geometry.Sphere.set(sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (geometry.intersect.sphereFrustum(sphere, camera.frustum)) {
              queue.addSceneOfCamera(camera, new LightInfo(light), flags);
            }
          }
          // sphere lights
          for (let i = 0; i < numSphereLights; i++) {
            const light = sphereLights[i];
            if (light.baked) {
              continue;
            }
            geometry.Sphere.set(sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (geometry.intersect.sphereFrustum(sphere, camera.frustum)) {
              queue.addSceneOfCamera(camera, new LightInfo(light), flags);
            }
          }
          // point lights
          for (let i = 0; i < numPointLights; i++) {
            const light = pointLights[i];
            if (light.baked) {
              continue;
            }
            geometry.Sphere.set(sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (geometry.intersect.sphereFrustum(sphere, camera.frustum)) {
              queue.addSceneOfCamera(camera, new LightInfo(light), flags);
            }
          }
          // ranged dir lights
          for (let i = 0; i < numRangedDirLights; i++) {
            const light = rangedDirLights[i];
            geometry.AABB.transform(boundingBox, rangedDirLightBoundingBox, light.node.getWorldMatrix());
            if (geometry.intersect.aabbFrustum(boundingBox, camera.frustum)) {
              queue.addSceneOfCamera(camera, new LightInfo(light), flags);
            }
          }
        }
        updateViewPort() {
          const camera = this.camera;
          if (!camera) {
            return;
          }
          let shadingScale = 1;
          if (this.postProcess && (!EDITOR || this.postProcess.enableShadingScaleInEditor)) {
            shadingScale *= this.postProcess.shadingScale;
          }
          this.shadingScale = shadingScale;
          const area = getRenderArea(camera, camera.window.width * shadingScale, camera.window.height * shadingScale, null, 0, this.viewport);
          area.width = Math.floor(area.width);
          area.height = Math.floor(area.height);
        }
        updatePassViewPort(shadingScale = 1, offsetScale = 0) {
          this.passViewport.width = this.viewport.width * shadingScale;
          this.passViewport.height = this.viewport.height * shadingScale;
          this.passViewport.x = this.viewport.x * offsetScale;
          this.passViewport.y = this.viewport.y * offsetScale;
          return this;
        }

        // setViewport (x: number, y: number, w: number, h: number) {
        //     this.pass!.setViewport(new Viewport(x, y, w, h));
        //     return this;
        // }

        addRasterView(name, format, offscreen = true, residency = ResourceResidency.MANAGED) {
          const ppl = this.ppl;
          const camera = this.camera;
          const pass = this.pass;
          if (!ppl || !camera || !pass) {
            return this;
          }
          if (!ppl.containsResource(name)) {
            if (format === Format.DEPTH_STENCIL) {
              ppl.addDepthStencil(name, format, this.rasterWidth, this.rasterHeight, ResourceResidency.MANAGED);
            } else if (offscreen) {
              ppl.addRenderTarget(name, format, this.rasterWidth, this.rasterHeight, residency || ResourceResidency.MANAGED);
            } else {
              ppl.addRenderWindow(name, format, this.rasterWidth, this.rasterHeight, camera.window);
            }
          }
          if (format !== Format.DEPTH_STENCIL) {
            if (!offscreen) {
              ppl.updateRenderWindow(name, camera.window);
            } else {
              ppl.updateRenderTarget(name, this.rasterWidth, this.rasterHeight);
            }
          } else {
            ppl.updateDepthStencil(name, this.rasterWidth, this.rasterHeight);
          }

          // let view: RasterView;
          if (format === Format.DEPTH_STENCIL) {
            const clearFlag = this.clearFlag & ClearFlagBit.DEPTH_STENCIL;
            let loadOp = LoadOp.CLEAR;
            if (clearFlag === ClearFlagBit.NONE) {
              loadOp = LoadOp.LOAD;
            }
            pass.addDepthStencil(name, loadOp, StoreOp.STORE, this.clearDepthColor.x, this.clearDepthColor.y, clearFlag);
          } else {
            const clearColor = new Color();
            clearColor.copy(this.clearColor);
            const clearFlag = this.clearFlag & ClearFlagBit.COLOR;
            let loadOp = LoadOp.CLEAR;
            if (clearFlag === ClearFlagBit.NONE && !(this.clearFlag & SkyBoxFlagValue.VALUE)) {
              loadOp = LoadOp.LOAD;
            } else if (this.clearFlag & SkyBoxFlagValue.VALUE) {
              clearColor.set(0, 0, 0, 1);
            }
            pass.addRenderTarget(name, loadOp, StoreOp.STORE, clearColor);
          }
          return this;
        }
        setPassInput(inputName, shaderName) {
          if (this.ppl.containsResource(inputName)) {
            this.pass.addTexture(inputName, shaderName);
          }
          return this;
        }
        blitScreen(passIdx = 0) {
          this.pass.addQueue(QueueHint.RENDER_TRANSPARENT).addCameraQuad(this.camera, this.material, passIdx, SceneFlags.NONE);
          return this;
        }
      });
      _export("passContext", passContext = new PassContext());
    }
  };
});