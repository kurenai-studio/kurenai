System.register("q-bundled:///fs/cocos/render-scene/scene/reflection-probe.js", ["../../../../virtual/internal%253Aconstants.js", "./camera.js", "../../scene-graph/node.js", "../../core/index.js", "../../rendering/define.js", "../../gfx/index.js", "../../asset/assets/render-texture.js"], function (_export, _context) {
  "use strict";

  var EDITOR, CameraAperture, CameraFOVAxis, CameraISO, CameraProjection, CameraShutter, CameraType, SkyBoxFlagValue, TrackingType, Node, Color, Quat, Rect, toRadian, Vec2, Vec3, geometry, cclegacy, Vec4, v3, quat, CAMERA_DEFAULT_MASK, ClearFlagBit, RenderTexture, ReflectionProbe, ProbeClearFlag, ProbeType, cameraDir, tempVec3;
  _export("ReflectionProbe", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_cameraJs) {
      CameraAperture = _cameraJs.CameraAperture;
      CameraFOVAxis = _cameraJs.CameraFOVAxis;
      CameraISO = _cameraJs.CameraISO;
      CameraProjection = _cameraJs.CameraProjection;
      CameraShutter = _cameraJs.CameraShutter;
      CameraType = _cameraJs.CameraType;
      SkyBoxFlagValue = _cameraJs.SkyBoxFlagValue;
      TrackingType = _cameraJs.TrackingType;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Quat = _coreIndexJs.Quat;
      Rect = _coreIndexJs.Rect;
      toRadian = _coreIndexJs.toRadian;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
      cclegacy = _coreIndexJs.cclegacy;
      Vec4 = _coreIndexJs.Vec4;
      v3 = _coreIndexJs.v3;
      quat = _coreIndexJs.quat;
    }, function (_renderingDefineJs) {
      CAMERA_DEFAULT_MASK = _renderingDefineJs.CAMERA_DEFAULT_MASK;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_assetAssetsRenderTextureJs) {
      RenderTexture = _assetAssetsRenderTextureJs.RenderTexture;
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
      _export("ProbeClearFlag", ProbeClearFlag = function (ProbeClearFlag) {
        ProbeClearFlag[ProbeClearFlag["SKYBOX"] = SkyBoxFlagValue.VALUE | ClearFlagBit.DEPTH_STENCIL] = "SKYBOX";
        ProbeClearFlag[ProbeClearFlag["SOLID_COLOR"] = ClearFlagBit.ALL] = "SOLID_COLOR";
        return ProbeClearFlag;
      }({}));
      _export("ProbeType", ProbeType = /*#__PURE__*/function (ProbeType) {
        ProbeType[ProbeType["CUBE"] = 0] = "CUBE";
        ProbeType[ProbeType["PLANAR"] = 1] = "PLANAR";
        return ProbeType;
      }({})); // right left up down front back
      cameraDir = [v3(0, -90, 0), v3(0, 90, 0), v3(90, 0, 0), v3(-90, 0, 0), v3(0, 0, 0), v3(0, 180, 0)];
      tempVec3 = v3();
      _export("ReflectionProbe", ReflectionProbe = class ReflectionProbe {
        /**
         * @en Set probe type,cube or planar.
         * @zh 设置探针类型，cube或者planar
         */
        set probeType(value) {
          this._probeType = value;
        }
        get probeType() {
          return this._probeType;
        }
        get resolution() {
          return this._resolution;
        }

        /**
         * @en set render texture size
         * @zh 设置渲染纹理大小
         */
        set resolution(value) {
          if (value !== this._resolution) {
            this.bakedCubeTextures.forEach((rt, idx) => {
              rt.resize(value, value);
            });
          }
          this._resolution = value;
        }

        /**
         * @en Clearing flags of the camera, specifies which part of the framebuffer will be actually cleared every frame.
         * @zh 相机的缓冲清除标志位，指定帧缓冲的哪部分要每帧清除。
         */
        set clearFlag(value) {
          this._clearFlag = value;
          this.camera.clearFlag = this._clearFlag;
        }
        get clearFlag() {
          return this._clearFlag;
        }

        /**
         * @en Clearing color of the camera.
         * @zh 相机的颜色缓冲默认值。
         */
        set backgroundColor(val) {
          this._backgroundColor = val;
          this.camera.clearColor = this._backgroundColor;
        }
        get backgroundColor() {
          return this._backgroundColor;
        }
        /**
         * @en Visibility mask, declaring a set of node layers that will be visible to this camera.
         * @zh 可见性掩码，声明在当前相机中可见的节点层级集合。
         */
        get visibility() {
          return this._visibility;
        }
        set visibility(val) {
          this._visibility = val;
          this._camera.visibility = this._visibility;
          if (this._previewCamera) {
            this._previewCamera.visibility = this._visibility;
          }
        }

        /**
         * @en Gets or sets the size of the box, in local space.
         * @zh 获取或设置盒的大小。
         */
        set size(value) {
          this._size.set(value);
          this.node.getWorldPosition(tempVec3);
          geometry.AABB.set(this._boundingBox, tempVec3.x, tempVec3.y, tempVec3.z, value.x, value.y, value.z);
        }
        get size() {
          return this._size;
        }
        set cubemap(val) {
          this._cubemap = val;
        }
        get cubemap() {
          return this._cubemap;
        }

        /**
         * @en The node of the probe.
         * @zh probe绑定的节点
         */
        get node() {
          return this._node;
        }
        get camera() {
          return this._camera;
        }

        /**
         * @en Refresh the objects that use this probe.
         * @zh 刷新使用该probe的物体
         */
        set needRefresh(value) {
          this._needRefresh = value;
        }
        get needRefresh() {
          return this._needRefresh;
        }
        set needRender(value) {
          this._needRender = value;
        }
        get needRender() {
          return this._needRender;
        }
        get boundingBox() {
          return this._boundingBox;
        }
        set cameraNode(node) {
          this._cameraNode = node;
        }
        get cameraNode() {
          return this._cameraNode;
        }

        /**
         * @en Reflection probe cube mode preview sphere
         * @zh 反射探针cube模式的预览小球
         * @engineInternal
         */
        set previewSphere(val) {
          this._previewSphere = val;
        }
        get previewSphere() {
          return this._previewSphere;
        }

        /**
         * @en Reflection probe planar mode preview plane
         * @zh 反射探针Planar模式的预览平面
         */
        set previewPlane(val) {
          this._previewPlane = val;
        }
        get previewPlane() {
          return this._previewPlane;
        }
        constructor(id) {
          this.bakedCubeTextures = [];
          this.realtimePlanarTexture = null;
          this._resolution = 256;
          this._clearFlag = ProbeClearFlag.SKYBOX;
          this._backgroundColor = new Color(0, 0, 0, 255);
          this._visibility = CAMERA_DEFAULT_MASK;
          this._probeType = ProbeType.CUBE;
          this._cubemap = null;
          this._size = v3(1, 1, 1);
          /**
           * @en Camera used for probe rendering (cubemap capture or planar reflection).
           * @zh 用于探针渲染的相机（cubemap 采集或平面反射）
           */
          this._camera = null;
          this._previewCamera = null;
          /**
           * @en Unique id of probe.
           * @zh probe的唯一id
           */
          this._probeId = 0;
          this._needRefresh = false;
          this._needRender = false;
          this._node = null;
          this._cameraNode = null;
          /**
           * @en The AABB bounding box and probe only render the objects inside the bounding box.
           * @zh AABB包围盒，probe只渲染包围盒内的物体
           */
          this._boundingBox = null;
          /**
           * @en The position of the camera in world space.
           * @zh 世界空间相机的位置
           */
          this._cameraWorldPos = v3();
          /**
           * @en The rotation of the camera in world space.
           * @zh 世界空间相机的旋转
           */
          this._cameraWorldRotation = quat();
          /**
           * @en The forward direction vertor of the camera in world space.
           * @zh 世界空间相机朝前的方向向量
           */
          this._forward = v3();
          /**
           * @en The up direction vertor of the camera in world space.
           * @zh 世界空间相机朝上的方向向量
           */
          this._up = v3();
          /**
           * @en Reflection probe cube pattern preview sphere
           * @zh 反射探针cube模式的预览小球
           */
          this._previewSphere = null;
          this._previewPlane = null;
          this._probeId = id;
        }
        initialize(node, cameraNode) {
          this._node = node;
          this._cameraNode = cameraNode;
          this.node.getWorldPosition(tempVec3);
          const size = this._size;
          this._boundingBox = geometry.AABB.create(tempVec3.x, tempVec3.y, tempVec3.z, size.x, size.y, size.z);
          this._createCamera(cameraNode);
        }
        initBakedTextures() {
          if (this.bakedCubeTextures.length === 0) {
            for (let i = 0; i < 6; i++) {
              const renderTexture = this._createTargetTexture(this._resolution, this._resolution);
              this.bakedCubeTextures.push(renderTexture);
            }
          }
        }
        captureCubemap() {
          this.initBakedTextures();
          this._resetCameraParams();
          this._needRender = true;
        }

        /**
         * @en Render real-time planar reflection textures
         * @zh 渲染实时平面反射贴图
         * @param sourceCamera render planar reflection for this camera
         */
        renderPlanarReflection(sourceCamera) {
          if (!sourceCamera) return;
          if (!this.realtimePlanarTexture) {
            const canvasSize = cclegacy.view.getDesignResolutionSize();
            this.realtimePlanarTexture = this._createTargetTexture(canvasSize.width, canvasSize.height);
            cclegacy.internal.reflectionProbeManager.updatePlanarMap(this, this.realtimePlanarTexture.getGFXTexture());
          }
          this._syncCameraParams(sourceCamera);
          this._transformReflectionCamera(sourceCamera);
          this._needRender = true;
        }

        /**
         * @engineInternal
         * @mangle
         */
        renderPreviewPlanarReflection(sourceCamera) {
          if (!this._previewCamera) {
            this._createCamera(new Node(`${this.cameraNode.name} Preview Reflection`), true);
          }
          const previewCamera = this._previewCamera;
          this._syncCameraParams(sourceCamera, previewCamera);
          this._transformReflectionCamera(sourceCamera, previewCamera);
          this._needRender = true;
          return previewCamera;
        }
        switchProbeType(type, sourceCamera) {
          if (type === ProbeType.CUBE) {
            this._needRender = false;
          } else if (sourceCamera !== null) {
            this.renderPlanarReflection(sourceCamera);
          }
        }
        getProbeId() {
          return this._probeId;
        }
        updateProbeId(id) {
          this._probeId = id;
        }
        renderArea() {
          if (this._probeType === ProbeType.PLANAR) {
            return new Vec2(this.realtimePlanarTexture.width, this.realtimePlanarTexture.height);
          } else {
            return new Vec2(this.resolution, this.resolution);
          }
        }
        isFinishedRendering() {
          return true;
        }
        validate() {
          return this.cubemap !== null;
        }
        destroy() {
          if (this._camera) {
            this._camera.destroy();
            this._camera = null;
          }
          if (this._previewCamera) {
            const cameraNode = this._previewCamera.node;
            this._previewCamera.destroy();
            this._previewCamera = null;
            cameraNode.destroy();
          }
          for (let i = 0; i < this.bakedCubeTextures.length; i++) {
            this.bakedCubeTextures[i].destroy();
          }
          this.bakedCubeTextures = [];
          if (this.realtimePlanarTexture) {
            this.realtimePlanarTexture.destroy();
            this.realtimePlanarTexture = null;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        enable() {}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        disable() {}
        updateCameraDir(faceIdx) {
          this.cameraNode.setRotationFromEuler(cameraDir[faceIdx]);
          this.camera.update(true);
        }
        updateBoundingBox() {
          if (this.node) {
            this.node.getWorldPosition(tempVec3);
            const size = this._size;
            geometry.AABB.set(this._boundingBox, tempVec3.x, tempVec3.y, tempVec3.z, size.x, size.y, size.z);
          }
        }
        hasFrameBuffer(framebuffer) {
          if (this.probeType === ProbeType.PLANAR) {
            var _this$realtimePlanarT;
            if (!this.realtimePlanarTexture) return false;
            if (((_this$realtimePlanarT = this.realtimePlanarTexture.window) == null ? void 0 : _this$realtimePlanarT.framebuffer) === framebuffer) {
              return true;
            }
          } else {
            if (this.bakedCubeTextures.length === 0) return false;
            for (let i = 0; i < this.bakedCubeTextures.length; i++) {
              var _rt$window;
              const rt = this.bakedCubeTextures[i];
              if (((_rt$window = rt.window) == null ? void 0 : _rt$window.framebuffer) === framebuffer) {
                return true;
              }
            }
          }
          return false;
        }
        isRGBE() {
          //todo: realtime do not use rgbe
          return true;
        }
        _syncCameraParams(camera, targetCamera = this.camera) {
          targetCamera.projectionType = camera.projectionType;
          targetCamera.orthoHeight = camera.orthoHeight;
          targetCamera.nearClip = camera.nearClip;
          targetCamera.farClip = camera.farClip;
          targetCamera.fov = camera.fov;
          targetCamera.clearFlag = camera.clearFlag;
          targetCamera.clearColor = camera.clearColor;
          targetCamera.priority = camera.priority - 1;
          targetCamera.resize(camera.width, camera.height);
        }
        _createCamera(cameraNode, preview = false) {
          const root = cclegacy.director.root;
          let camera = preview ? this._previewCamera : this._camera;
          if (!camera) {
            camera = root.createCamera();
            if (!camera) return null;
            camera.initialize({
              name: cameraNode.name,
              node: cameraNode,
              projection: CameraProjection.PERSPECTIVE,
              window: preview || EDITOR ? root.mainWindow : root.tempWindow,
              priority: 0,
              cameraType: CameraType.DEFAULT,
              trackingType: TrackingType.NO_TRACKING
            });
            if (preview) {
              this._previewCamera = camera;
            } else {
              this._camera = camera;
            }
          }
          camera.setViewportInOrientedSpace(new Rect(0, 0, 1, 1));
          camera.fovAxis = CameraFOVAxis.VERTICAL;
          camera.fov = toRadian(90);
          camera.orthoHeight = 10;
          camera.nearClip = 1;
          camera.farClip = 1000;
          camera.clearColor = this._backgroundColor;
          camera.clearDepth = 1.0;
          camera.clearStencil = 0.0;
          camera.clearFlag = this._clearFlag;
          camera.visibility = this._visibility;
          camera.aperture = CameraAperture.F16_0;
          camera.shutter = CameraShutter.D125;
          camera.iso = CameraISO.ISO100;
          return camera;
        }
        _resetCameraParams() {
          this.camera.projectionType = CameraProjection.PERSPECTIVE;
          this.camera.orthoHeight = 10;
          this.camera.nearClip = 1;
          this.camera.farClip = 1000;
          this.camera.fov = toRadian(90);
          this.camera.priority = 0;
          this.camera.resize(this.resolution, this.resolution);
          this.camera.visibility = this._visibility;
          this.camera.clearFlag = this._clearFlag;
          this.camera.clearColor = this._backgroundColor;
          this.cameraNode.worldPosition = this.node.worldPosition;
          this.cameraNode.worldRotation = this.node.worldRotation;
          this.camera.update(true);
        }
        _createTargetTexture(width, height) {
          const rt = new RenderTexture();
          rt.reset({
            width,
            height
          });
          return rt;
        }
        _transformReflectionCamera(sourceCamera, targetCamera = this.camera) {
          const offset = Vec3.dot(this.node.worldPosition, this.node.up);
          this._reflect(this._cameraWorldPos, sourceCamera.node.worldPosition, this.node.up, offset);
          targetCamera.node.worldPosition = this._cameraWorldPos;
          Vec3.transformQuat(this._forward, Vec3.FORWARD, sourceCamera.node.worldRotation);
          this._reflect(this._forward, this._forward, this.node.up, 0);
          this._forward.normalize();
          this._forward.negative();
          Vec3.transformQuat(this._up, Vec3.UP, sourceCamera.node.worldRotation);
          this._reflect(this._up, this._up, this.node.up, 0);
          this._up.normalize();
          Quat.fromViewUp(this._cameraWorldRotation, this._forward, this._up);
          targetCamera.node.worldRotation = this._cameraWorldRotation;
          targetCamera.update(true);

          // Transform the plane from world space to reflection camera space use the inverse transpose matrix
          const viewSpaceProbe = new Vec4(this.node.up.x, this.node.up.y, this.node.up.z, -Vec3.dot(this.node.up, this.node.worldPosition));
          viewSpaceProbe.transformMat4(targetCamera.matView.clone().invert().transpose());
          targetCamera.calculateObliqueMat(viewSpaceProbe);
        }
        _reflect(out, point, normal, offset) {
          const n = Vec3.clone(normal);
          n.normalize();
          const dist = Vec3.dot(n, point) - offset;
          n.multiplyScalar(2.0 * dist);
          Vec3.subtract(out, point, n);
          return out;
        }
      });
    }
  };
});