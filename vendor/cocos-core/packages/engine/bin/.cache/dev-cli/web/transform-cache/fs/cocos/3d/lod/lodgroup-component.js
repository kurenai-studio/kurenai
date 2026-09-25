System.register("q-bundled:///fs/cocos/3d/lod/lodgroup-component.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../../core/index.js", "../../scene-graph/component.js", "../framework/mesh-renderer.js", "../../render-scene/index.js", "../../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var EDITOR, JSB, ccclass, editable, executeInEditMode, menu, serializable, type, Vec3, geometry, CCInteger, CCFloat, warn, error, Component, MeshRenderer, scene, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _dec6, _dec7, _dec8, _dec9, _class3, _class4, _descriptor3, _descriptor4, _descriptor5, DEFAULT_SCREEN_OCCUPATION, LOD, LODGroup;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
      CCInteger = _coreIndexJs.CCInteger;
      CCFloat = _coreIndexJs.CCFloat;
      warn = _coreIndexJs.warn;
      error = _coreIndexJs.error;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_frameworkMeshRendererJs) {
      MeshRenderer = _frameworkMeshRendererJs.MeshRenderer;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      // Ratio of objects occupying the screen
      DEFAULT_SCREEN_OCCUPATION = [0.25, 0.125, 0.01];
      _export("LOD", LOD = (_dec = ccclass('cc.LOD'), _dec2 = type([MeshRenderer]), _dec3 = type(CCFloat), _dec4 = type([MeshRenderer]), _dec5 = type([CCInteger]), _dec(_class = (_class2 = class LOD {
        constructor() {
          // Minimum percentage of screen usage for the current lod in effect, range in [0, 1]
          _initializerDefineProperty(this, "_screenUsagePercentage", _descriptor, this);
          // Mesh renderers components contained in this LOD level.
          _initializerDefineProperty(this, "_renderers", _descriptor2, this);
          // renderer internal LOD data block.
          /**
           * @engineInternal
           */
          this._LODData = new scene.LODData();
          /**
           * @engineInternal
           */
          this._modelAddedCallback = void 0;
          this._LODData.screenUsagePercentage = this._screenUsagePercentage;
          this._modelAddedCallback = null;
        }

        /**
         * @en Minimum percentage of screen usage for the current lod in effect, range in [0, 1]
         * @zh 本层级生效时，占用屏幕的最小百分比, 取值范围[0, 1]
         */
        get screenUsagePercentage() {
          return this._screenUsagePercentage;
        }
        set screenUsagePercentage(val) {
          this._screenUsagePercentage = val;
          this._LODData.screenUsagePercentage = val;
        }

        /**
         * @en Get the list of [[MeshRenderer]] used by the current lod.
         * @zh 获取当前lod使用的 [[MeshRenderer]] 列表
         */
        get renderers() {
          return this._renderers;
        }

        /**
         * @en reset _renderers to meshList or [], LODData's model will be reset too.
         * @zh 重置 _renderers 为 meshList或空数组, LODData上的model也会被重置
         */
        set renderers(meshList) {
          if (meshList === this._renderers) return;
          let modelAdded = false;
          this._renderers.length = 0;
          this._LODData.clearModels();
          for (let i = 0; i < meshList.length; i++) {
            var _meshList$i;
            this._renderers[i] = meshList[i];
            const model = (_meshList$i = meshList[i]) == null ? void 0 : _meshList$i.model;
            if (model) {
              modelAdded = true;
              this._LODData.addModel(model);
            }
          }
          if (this._modelAddedCallback && modelAdded) {
            this._modelAddedCallback();
          }
        }

        /**
         * @engineInternal
         * @en Get the total number of all mesh's triangle.
         * @zh 获取所有模型的三角形总数
         */
        get triangleCount() {
          const tris = [];
          this._renderers.forEach(meshRenderer => {
            let count = 0;
            if (meshRenderer && meshRenderer.mesh) {
              const primitives = meshRenderer.mesh.struct.primitives;
              primitives == null || primitives.forEach(subMesh => {
                if (subMesh && subMesh.indexView) {
                  count += subMesh.indexView.count;
                }
              });
            }
            tris.push(count / 3);
          });
          return tris;
        }

        /**
         * @en Get the number of LOD.
         * @zh 获取LOD的数量
         */
        get rendererCount() {
          return this._renderers.length;
        }

        /**
          * @engineInternal
          * @en Get internal LOD object.
          */
        get lodData() {
          return this._LODData;
        }

        /**
          * @engineInternal
          */
        set modelAddedCallback(callback) {
          this._modelAddedCallback = callback;
        }

        /**
         * @en Insert a [[MeshRenderer]] before specific index position.
         * @zh 在指定的数组索引处插入一个[[MeshRenderer]]
         * @param index @en The rendering array is indexed from 0. If - 1 is passed, it will be added to the end of the list.
         * @zh renderers数组从0开始索引，若传递-1将会被添加到列表末尾。
         * @param renderer @en The mesh-renderer object. @zh [[MeshRenderer]] 对象
         * @returns @en The inserted [[MeshRenderer]] @zh 返回被插入的 [[MeshRenderer]] 对象
         */
        insertRenderer(index, renderer) {
          // make sure insert at the tail of the list.
          if (index < 0 || index > this._renderers.length) {
            index = this._renderers.length;
          }
          this._renderers.splice(index, 0, renderer);
          let modelAdded = false;
          if (renderer.model) {
            modelAdded = true;
            this._LODData.addModel(renderer.model);
          }
          if (this._modelAddedCallback && modelAdded) {
            this._modelAddedCallback();
          }
          return renderer;
        }

        /**
         * @en Delete the [[MeshRenderer]] at specific index position.
         * @zh 删除指定索引处的[[MeshRenderer]]
         * @param index @en 0 indexed position in renderer array, when -1 is specified, the last element will be deleted.
         * @zh _renderers从0开始索引，传递-1则最后一个元素会被删除。
         * @returns @en The deleted [[MeshRenderer]], or null if the specified index does not exist. @zh 如果指定索引处的对象存在，返回被删除对象否则返回null。
         */
        deleteRenderer(index) {
          var _renders$;
          const renders = this._renderers.splice(index, 1);
          const model = renders.length > 0 ? (_renders$ = renders[0]) == null ? void 0 : _renders$.model : null;
          if (model) {
            this._LODData.eraseModel(model);
          }
          return renders[0];
        }

        /**
         * @en Get the [[MeshRenderer]] at specific index position.
         * @zh 获取指定索引处的[[MeshRenderer]]
         * @param index @en Value range from 0 to _renderers's length. @zh 取值范围是[0, _renderers长度]
         * @return @en Returns the [[MeshRenderer]] at the specified index, or null if the specified index does not exist. @zh 返回指定索引处的对象，若不存在则返回null。
         */
        getRenderer(index) {
          return this._renderers[index] || null;
        }

        /**
         * @en Update the [[MeshRenderer]] at specific index position.
         * @zh 更新指定索引处的 [[MeshRenderer]]
         * @param index @en Value range from 0 to _renderers's length @zh 取值范围是 [0, _renderers数组长度]
         */
        setRenderer(index, renderer) {
          if (index < 0 || index >= this.rendererCount) {
            error('setRenderer to LOD error, index out of range');
            return;
          }
          this.deleteRenderer(index);
          this.insertRenderer(index, renderer);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_screenUsagePercentage", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_renderers", [_dec2, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "screenUsagePercentage", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "screenUsagePercentage"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "renderers", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "renderers"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "triangleCount", [editable, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "triangleCount"), _class2.prototype), _class2)) || _class));
      _export("LODGroup", LODGroup = (_dec6 = ccclass('cc.LODGroup'), _dec7 = menu('Rendering/LOD Group'), _dec8 = type(CCFloat), _dec9 = type([LOD]), _dec6(_class3 = _dec7(_class3 = executeInEditMode(_class3 = (_class4 = class LODGroup extends Component {
        constructor() {
          super();
          /**
           * @en Object reference point in local space, e.g. center of the bound volume for all LODs
           */
          _initializerDefineProperty(this, "_localBoundaryCenter", _descriptor3, this);
          /**
           * @en Object Size in local space, may be auto-calculated value from object bounding box or value from user input.
           */
          _initializerDefineProperty(this, "_objectSize", _descriptor4, this);
          /**
           *@en The array of LODs
           */
          _initializerDefineProperty(this, "_LODs", _descriptor5, this);
          /**
           * @engineInternal
           */
          this._lodGroup = new scene.LODGroup();
          this._eventRegistered = false;
          this._forceUsedLevels = [];
        }

        /**
         * @engineInternal
         */
        set localBoundaryCenter(val) {
          this._localBoundaryCenter.set(val);
          this._lodGroup.localBoundaryCenter = val;
        }

        /**
         * @en Obtain the center point of AABB composed of all models
         * @zh 获取所有模型组成的AABB的中心点
         */
        get localBoundaryCenter() {
          return this._localBoundaryCenter.clone();
        }

        /**
         * @en Obtain LOD level numbers.
         * @zh 获取LOD层级数
         */
        get lodCount() {
          return this._LODs.length;
        }

        /**
         * @en Set current AABB's size.
         * @zh 设置当前包围盒的大小
         */
        set objectSize(val) {
          this._objectSize = val;
          this._lodGroup.objectSize = val;
        }

        /**
         * @en Get current AABB's size.
         * @zh 获取当前包围盒的大小
         */
        get objectSize() {
          return this._objectSize;
        }

        /**
         * @en Get LOD array config.
         * @zh 获取 LOD 数组
         */
        get LODs() {
          return this._LODs;
        }

        /**
         * @en Reset current LODs to new value.
         * @ 重置 LODs 为当前新设置的值。
         */
        set LODs(valArray) {
          if (valArray === this._LODs) {
            //_LODs maybe changed, we need to notify the scene to update.
            this._updateDataToScene();
            return;
          }
          this._LODs.length = 0;
          this.lodGroup.clearLODs();
          valArray.forEach((lod, index) => {
            this.lodGroup.insertLOD(index, lod.lodData);
            this._LODs[index] = lod;
            lod.modelAddedCallback = this.onLodModelAddedCallback.bind(this);
          });
          //_LODs has been changed, we need to notify the scene to update.
          this._updateDataToScene();
        }

        /**
         * @engineInternal
         */
        get lodGroup() {
          return this._lodGroup;
        }
        onLodModelAddedCallback() {
          if (this.objectSize === 0) {
            this.recalculateBounds();
          }
        }

        /**
         * @en Insert the [[LOD]] at specific index position, [[LOD]] will be inserted to the last position if index less than 0 or greater than lodCount.
         * @zh 在指定索引处插入 [[LOD]], 若索引为负或超过lodCount，则在末尾添加
         * @param index @en location where lod is added. @zh lod被插入的位置
         * @param screenUsagePercentage @en The minimum screen usage percentage that the currently set lod starts to use, range in[0, 1].
         * @zh lod生效时的最低屏幕显示百分比要求，取值范围[0, 1]
         * @param lod @en If this parameter is not set, it will be created by default. @zh 如果参数没传，则内部创建
         * @returns @en The new lod added. @zh 返回被添加的lod
         */
        insertLOD(index, screenUsagePercentage, lod) {
          if (index < 0 || index > this.lodCount) {
            index = this.lodCount;
          }
          if (!lod) {
            lod = new LOD();
          }
          lod.modelAddedCallback = this.onLodModelAddedCallback.bind(this);
          if (!screenUsagePercentage) {
            const preLod = this.getLOD(index - 1);
            const nextLod = this.getLOD(index);
            if (preLod && nextLod) {
              screenUsagePercentage = (preLod.screenUsagePercentage + nextLod.screenUsagePercentage) / 2;
            } else if (preLod && !nextLod) {
              // insert at last position
              screenUsagePercentage = preLod.screenUsagePercentage / 2;
              if (screenUsagePercentage > 0.01) {
                screenUsagePercentage = 0.01;
              }
            } else if (nextLod && !preLod) {
              //insert at first position
              screenUsagePercentage = nextLod.screenUsagePercentage;
              const curNextLOD = this.getLOD(index + 1);
              nextLod.screenUsagePercentage = (screenUsagePercentage + (curNextLOD ? curNextLOD.screenUsagePercentage : 0)) / 2;
            } else {
              //lod count is zero
              screenUsagePercentage = DEFAULT_SCREEN_OCCUPATION[0];
            }
          }
          lod.screenUsagePercentage = screenUsagePercentage;
          this._LODs.splice(index, 0, lod);
          this._lodGroup.insertLOD(index, lod.lodData);
          this._updateDataToScene();
          if (this.node) {
            this._emitChangeNode(this.node);
          }
          return lod;
        }

        /**
         * @en Erase the [[LOD]] at specific index position.
         * @zh 删除指定索引处的 [[LOD]]
         * @param index @en Index of the erased lod, range in [0, lodCount]. @zh 被删除对象索引, 取值范围[0, lodCount]
         * @returns @en Erased lod. @zh 被删除的对象
         */
        eraseLOD(index) {
          if (index < 0 || index >= this.lodCount) {
            warn('eraseLOD error, index out of range');
            return null;
          }
          const lod = this._LODs[index];
          if (!lod) {
            warn('eraseLOD error, LOD not exist at specified index.');
            return null;
          }
          this._LODs.splice(index, 1);
          this._lodGroup.eraseLOD(index);
          this._updateDataToScene();
          this._emitChangeNode(this.node);
          return lod;
        }

        /**
         * @en Get [[LOD]] at specific index position.
         * @zh 获取指定索引处的 [[LOD]]
         * @param index @en Range in [0, lodCount]. @zh 取值范围[0, lodCount]
         * @returns @en Lod at specified index, or null. @zh 返回指定索引的lod或null
         */
        getLOD(index) {
          if (index < 0 || index >= this.lodCount) {
            warn('getLOD error, index out of range');
            return null;
          }
          return this._LODs[index];
        }

        /**
         * @en Update the [[LOD]] at specific index position.
         * @zh 更新指定索引处的 [[LOD]]
         * @param index, update lod at specified index.
         * @param lod, the updated lod.
         */
        setLOD(index, lod) {
          if (index < 0 || index >= this.lodCount) {
            warn('setLOD error, index out of range');
            return;
          }
          this._LODs[index] = lod;
          lod.modelAddedCallback = this.onLodModelAddedCallback.bind(this);
          this.lodGroup.updateLOD(index, lod.lodData);
          this._updateDataToScene();
        }

        /**
         * @en Recalculate the bounding box, and the interface will recalculate the localBoundaryCenter and objectSize
         * @zh 重新计算包围盒，该接口会更新 localBoundaryCenter 和 objectSize
         */
        recalculateBounds() {
          function getTransformedBoundary(c, e, transform) {
            let minPos;
            let maxPos;
            const pts = new Array(new Vec3(c.x - e.x, c.y - e.y, c.z - e.z), new Vec3(c.x - e.x, c.y + e.y, c.z - e.z), new Vec3(c.x + e.x, c.y + e.y, c.z - e.z), new Vec3(c.x + e.x, c.y - e.y, c.z - e.z), new Vec3(c.x - e.x, c.y - e.y, c.z + e.z), new Vec3(c.x - e.x, c.y + e.y, c.z + e.z), new Vec3(c.x + e.x, c.y + e.y, c.z + e.z), new Vec3(c.x + e.x, c.y - e.y, c.z + e.z));
            minPos = pts[0].transformMat4(transform);
            maxPos = minPos.clone();
            for (let i = 1; i < 8; ++i) {
              const pt = pts[i].transformMat4(transform);
              minPos = Vec3.min(minPos, minPos, pt);
              maxPos = Vec3.max(maxPos, maxPos, pt);
            }
            return [minPos, maxPos];
          }
          const minPos = new Vec3();
          const maxPos = new Vec3();
          let boundsMin = null;
          let boundsMax = new Vec3();
          for (let i = 0; i < this.lodCount; ++i) {
            const lod = this.getLOD(i);
            if (lod) {
              for (let j = 0; j < lod.rendererCount; ++j) {
                var _renderer$model, _renderer$model2;
                const renderer = lod.getRenderer(j);
                if (!renderer) {
                  continue;
                }
                (_renderer$model = renderer.model) == null || _renderer$model.updateWorldBound();
                let worldBounds = (_renderer$model2 = renderer.model) == null ? void 0 : _renderer$model2.worldBounds;
                if (worldBounds) {
                  if (JSB) {
                    const center = worldBounds.center;
                    const halfExtents = worldBounds.halfExtents;
                    worldBounds = geometry.AABB.create(center.x, center.y, center.z, halfExtents.x, halfExtents.y, halfExtents.z);
                  }
                  worldBounds.getBoundary(minPos, maxPos);
                  if (boundsMin) {
                    Vec3.min(boundsMin, boundsMin, minPos);
                    Vec3.max(boundsMax, boundsMax, maxPos);
                  } else {
                    boundsMin = minPos.clone();
                    boundsMax = maxPos.clone();
                  }
                }
              }
            }
          }
          if (boundsMin) {
            // Transform world bounds to local space bounds
            const boundsMin2 = boundsMin;
            const c = new Vec3((boundsMax.x + boundsMin2.x) * 0.5, (boundsMax.y + boundsMin2.y) * 0.5, (boundsMax.z + boundsMin2.z) * 0.5);
            const e = new Vec3((boundsMax.x - boundsMin2.x) * 0.5, (boundsMax.y - boundsMin2.y) * 0.5, (boundsMax.z - boundsMin2.z) * 0.5);
            const [minPos, maxPos] = getTransformedBoundary(c, e, this.node.worldMatrix.clone().invert());

            // Set bounding volume center and extents in local space
            c.set((maxPos.x + minPos.x) * 0.5, (maxPos.y + minPos.y) * 0.5, (maxPos.z + minPos.z) * 0.5);
            e.set((maxPos.x - minPos.x) * 0.5, (maxPos.y - minPos.y) * 0.5, (maxPos.z - minPos.z) * 0.5);

            // Save the result
            this.localBoundaryCenter = c;
            this.objectSize = Math.max(e.x, e.y, e.z) * 2.0;
          } else {
            // No model exists, reset to default value
            this.localBoundaryCenter = new Vec3(0, 0, 0);
            this.objectSize = 0;
          }
          this._emitChangeNode(this.node);
        }

        /**
         * @en reset current objectSize to 1, and recalculate screenUsagePercentage.
         * @zh 重置 objectSize 的大小为1，该接口会重新计算 screenUsagePercentage
         */
        resetObjectSize() {
          if (this.objectSize === 1.0) return;
          if (this.objectSize === 0) {
            this.objectSize = 1.0;
          }

          // 1 will be new object size
          const scale = 1.0 / this.objectSize;
          // reset object size to 1
          this.objectSize = 1.0;
          for (let i = 0; i < this.lodCount; ++i) {
            const lod = this.getLOD(i);
            if (lod) {
              lod.screenUsagePercentage *= scale;
            }
          }
          this._emitChangeNode(this.node);
        }

        /**
         * @zh 强制使用某一级的LOD
         * @en Force LOD level to use.
         * lodLevel @en The LOD level to use. Passing lodLevel < 0 will return to standard LOD processing. @zh 要使用的LOD层级，为负数时使用标准的处理流程
         */
        forceLOD(lodLevel) {
          this._forceUsedLevels = lodLevel < 0 ? [] : [lodLevel];
          this.lodGroup.lockLODLevels(this._forceUsedLevels);
        }

        /**
         * @en Force multi LOD level to use, This function is only called in editor.<br/>
         * @zh 强制使用某几级的LOD,该接口只会在编辑器下调用。
         * lodIndexArray @en The LOD level array. Passing [] will return to standard LOD processing. @zh 要使用的LOD层级数组，传[]时将使用标准的处理流程。
         */
        forceLODs(lodIndexArray) {
          if (EDITOR) {
            this._forceUsedLevels = lodIndexArray.slice();
            this.lodGroup.lockLODLevels(this._forceUsedLevels);
          }
        }
        onLoad() {
          this._lodGroup.node = this.node;
          // objectSize maybe initialized from deserialize
          this._lodGroup.objectSize = this._objectSize;
          this._lodGroup.localBoundaryCenter = this._localBoundaryCenter;
          if (!this._eventRegistered) {
            this.node.on(NodeEventType.COMPONENT_REMOVED, this._onRemove, this);
            this._eventRegistered = true;
          }
          this._constructLOD();
        }
        _onRemove(comp) {
          if (comp === this) {
            this.onDisable();
          }
        }
        _constructLOD() {
          // generate default lod for lodGroup
          if (this.lodCount < 1) {
            const size = DEFAULT_SCREEN_OCCUPATION.length;
            for (let i = 0; i < size; i++) {
              this.insertLOD(i, DEFAULT_SCREEN_OCCUPATION[i]);
            }
          }
        }

        // Redo, Undo, Prefab restore, etc.
        onRestore() {
          this._constructLOD();
          if (this.enabledInHierarchy) {
            this._attachToScene();
          }
        }
        onEnable() {
          this._attachToScene();
          if (this.objectSize === 0) {
            this.recalculateBounds();
          }
          this.lodGroup.lockLODLevels(this._forceUsedLevels);

          // cache lod for scene
          if (this.lodCount > 0 && this._lodGroup.lodCount < 1) {
            this._LODs.forEach((lod, index) => {
              lod.lodData.screenUsagePercentage = lod.screenUsagePercentage;
              const renderers = lod.renderers;
              if (renderers !== null && renderers.length > 0) {
                for (let i = 0; i < renderers.length; i++) {
                  const lodInstance = lod.lodData;
                  const renderer = renderers[i];
                  if (lodInstance && renderer && renderer.model) {
                    lodInstance.addModel(renderer.model);
                  }
                }
              }
              this._lodGroup.insertLOD(index, lod.lodData);
            });
          }
        }
        onDisable() {
          this._detachFromScene();
          this.lodGroup.lockLODLevels([]);
        }
        _attachToScene() {
          if (this.node && this.node.scene) {
            const renderScene = this._getRenderScene();
            if (this._lodGroup.scene) {
              this._detachFromScene();
            }
            renderScene.addLODGroup(this._lodGroup);
          }
        }
        _detachFromScene() {
          if (this._lodGroup.scene) {
            this._lodGroup.scene.removeLODGroup(this._lodGroup);
          }
        }
        _emitChangeNode(node) {
          if (EDITOR) {
            EditorExtends.Node.emit('change', node.uuid, node);
          }
        }
        _updateDataToScene() {
          this._detachFromScene();
          this._attachToScene();
        }
      }, _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_localBoundaryCenter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 0, 0);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_objectSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "_LODs", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "objectSize", [_dec8], Object.getOwnPropertyDescriptor(_class4.prototype, "objectSize"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "LODs", [_dec9], Object.getOwnPropertyDescriptor(_class4.prototype, "LODs"), _class4.prototype), _class4)) || _class3) || _class3) || _class3));
    }
  };
});