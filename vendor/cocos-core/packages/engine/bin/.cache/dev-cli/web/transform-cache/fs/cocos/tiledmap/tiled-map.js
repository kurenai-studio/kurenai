System.register("q-bundled:///fs/cocos/tiledmap/tiled-map.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../scene-graph/component.js", "../2d/framework/index.js", "./tiled-types.js", "./tmx-xml-parser.js", "./tiled-layer.js", "./tiled-object-group.js", "./tiled-map-asset.js", "../2d/components/sprite.js", "./tiled-utils.js", "../core/index.js", "../scene-graph/node-event.js", "../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, executeInEditMode, help, menu, requireComponent, type, serializable, editable, EDITOR, JSB, Component, UITransform, Orientation, Property, RenderOrder, StaggerAxis, StaggerIndex, TileFlag, TMXImageLayerInfo, TMXLayerInfo, TMXObjectGroupInfo, TMXObjectType, TMXMapInfo, TiledLayer, TiledObjectGroup, TiledMapAsset, Sprite, fillTextureGrids, enableTexelOffsetUtils, Size, Vec2, logID, sys, warnID, NodeEventType, Node, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _TiledMap, TiledMap;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_tiledTypesJs) {
      Orientation = _tiledTypesJs.Orientation;
      Property = _tiledTypesJs.Property;
      RenderOrder = _tiledTypesJs.RenderOrder;
      StaggerAxis = _tiledTypesJs.StaggerAxis;
      StaggerIndex = _tiledTypesJs.StaggerIndex;
      TileFlag = _tiledTypesJs.TileFlag;
      TMXImageLayerInfo = _tiledTypesJs.TMXImageLayerInfo;
      TMXLayerInfo = _tiledTypesJs.TMXLayerInfo;
      TMXObjectGroupInfo = _tiledTypesJs.TMXObjectGroupInfo;
      TMXObjectType = _tiledTypesJs.TMXObjectType;
    }, function (_tmxXmlParserJs) {
      TMXMapInfo = _tmxXmlParserJs.TMXMapInfo;
    }, function (_tiledLayerJs) {
      TiledLayer = _tiledLayerJs.TiledLayer;
    }, function (_tiledObjectGroupJs) {
      TiledObjectGroup = _tiledObjectGroupJs.TiledObjectGroup;
    }, function (_tiledMapAssetJs) {
      TiledMapAsset = _tiledMapAssetJs.TiledMapAsset;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_tiledUtilsJs) {
      fillTextureGrids = _tiledUtilsJs.fillTextureGrids;
      enableTexelOffsetUtils = _tiledUtilsJs.enableTexelOffsetUtils;
    }, function (_coreIndexJs) {
      Size = _coreIndexJs.Size;
      Vec2 = _coreIndexJs.Vec2;
      logID = _coreIndexJs.logID;
      sys = _coreIndexJs.sys;
      warnID = _coreIndexJs.warnID;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
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
       * @en Renders a TMX Tile Map in the scene.
       * @zh 在场景中渲染一个 tmx 格式的 Tile Map。
       * @class TiledMap
       * @extends Component
       */
      _export("TiledMap", TiledMap = (_dec = ccclass('cc.TiledMap'), _dec2 = help('i18n:cc.TiledMap'), _dec3 = menu('TiledMap/TiledMap'), _dec4 = requireComponent(UITransform), _dec5 = type(TiledMapAsset), _dec6 = displayOrder(7), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = (_TiledMap = class TiledMap extends Component {
        /**
         * @en The TiledMap Asset.
         * @zh TiledMap 资源。
         * @property {TiledMapAsset} tmxAsset
         * @default ""
         */

        get tmxAsset() {
          return this._tmxFile;
        }
        set tmxAsset(value) {
          if (this._tmxFile !== value || EDITOR) {
            this._tmxFile = value;
            this._applyFile();
            this._isApplied = true;
          }
        }

        /**
         * @en
         * Whether or not enabled tiled map auto culling. If you set the TiledMap skew or rotation, then need to manually
         *  disable this, otherwise, the rendering will be wrong.
         * @zh
         * 是否开启瓦片地图的自动裁减功能。瓦片地图如果设置了 skew, rotation 或者采用了摄像机的话，需要手动关闭，否则渲染会出错。
         */

        get enableCulling() {
          return this._enableCulling;
        }
        set enableCulling(value) {
          this._enableCulling = value;
          const layers = this._layers;
          for (let i = 0; i < layers.length; ++i) {
            layers[i].enableCulling = value;
          }
        }
        constructor() {
          super();
          // store all layer gid corresponding texture info, index is gid, format likes '[gid0]=tex-info,[gid1]=tex-info, ...'
          this._texGrids = new Map();
          // store all tileset texture, index is tileset index, format likes '[0]=texture0, [1]=texture1, ...'
          this._textures = [];
          this._tilesets = [];
          this._animations = new Map();
          this._imageLayers = [];
          this._layers = [];
          this._groups = [];
          this._images = [];
          this._properties = {};
          this._tileProperties = new Map();
          this._mapInfo = null;
          this._mapSize = new Size(0, 0);
          this._tileSize = new Size(0, 0);
          this._mapOrientation = Orientation.ORTHO;
          this._isApplied = false;
          _initializerDefineProperty(this, "_tmxFile", _descriptor, this);
          _initializerDefineProperty(this, "_enableCulling", _descriptor2, this);
          _initializerDefineProperty(this, "cleanupImageCache", _descriptor3, this);
        }

        /**
         * @en Gets the map size.
         * @zh 获取地图大小。
         * @method getMapSize
         * @return {Size}
         * @example
         * let mapSize = tiledMap.getMapSize();
         * cc.log("Map Size: " + mapSize);
         */
        getMapSize() {
          return this._mapSize;
        }

        /**
         * @en Gets the tile size.
         * @zh 获取地图背景中 tile 元素的大小。
         * @method getTileSize
         * @return {Size}
         * @example
         * let tileSize = tiledMap.getTileSize();
         * cc.log("Tile Size: " + tileSize);
         */
        getTileSize() {
          return this._tileSize;
        }

        /**
         * @en map orientation.
         * @zh 获取地图方向。
         * @method getMapOrientation
         * @return {Number}
         * @example
         * let mapOrientation = tiledMap.getMapOrientation();
         * cc.log("Map Orientation: " + mapOrientation);
         */
        getMapOrientation() {
          return this._mapOrientation;
        }

        /**
         * @en object groups.
         * @zh 获取所有的对象层。
         * @method getObjectGroups
         * @return {TiledObjectGroup[]}
         * @example
         * let objGroups = titledMap.getObjectGroups();
         * for (let i = 0; i < objGroups.length; ++i) {
         *     cc.log("obj: " + objGroups[i]);
         * }
         */
        getObjectGroups() {
          return this._groups;
        }

        /**
         * @en Return the TMXObjectGroup for the specific group.
         * @zh 获取指定的 TMXObjectGroup。
         * @method getObjectGroup
         * @param {String} groupName
         * @return {TiledObjectGroup}
         * @example
         * let group = titledMap.getObjectGroup("Players");
         * cc.log("ObjectGroup: " + group);
         */
        getObjectGroup(groupName) {
          const groups = this._groups;
          for (let i = 0, l = groups.length; i < l; i++) {
            const group = groups[i];
            if (group && group.getGroupName() === groupName) {
              return group;
            }
          }
          return null;
        }

        /**
         * @en Gets the map properties.
         * @zh 获取地图的属性。
         * @method getProperties
         * @return {Object[]}
         * @example
         * let properties = titledMap.getProperties();
         * for (let i = 0; i < properties.length; ++i) {
         *     cc.log("Properties: " + properties[i]);
         * }
         */
        getProperties() {
          return this._properties;
        }

        /**
         * @en Return All layers array.
         * @zh 返回包含所有 layer 的数组。
         * @method getLayers
         * @returns {TiledLayer[]}
         * @example
         * let layers = titledMap.getLayers();
         * for (let i = 0; i < layers.length; ++i) {
         *     cc.log("Layers: " + layers[i]);
         * }
         */
        getLayers() {
          return this._layers;
        }

        /**
         * @en return the cc.TiledLayer for the specific layer.
         * @zh 获取指定名称的 layer。
         * @method getLayer
         * @param {String} layerName
         * @return {TiledLayer}
         * @example
         * let layer = titledMap.getLayer("Player");
         * cc.log(layer);
         */
        getLayer(layerName) {
          const layers = this._layers;
          for (let i = 0, l = layers.length; i < l; i++) {
            const layer = layers[i];
            if (layer && layer.getLayerName() === layerName) {
              return layer;
            }
          }
          return null;
        }
        _changeLayer(layerName, replaceLayer) {
          const layers = this._layers;
          for (let i = 0, l = layers.length; i < l; i++) {
            const layer = layers[i];
            if (layer && layer.getLayerName() === layerName) {
              layers[i] = replaceLayer;
              return;
            }
          }
        }

        /**
         * @en Return the value for the specific property name.
         * @zh 通过属性名称，获取指定的属性。
         * @method getProperty
         * @param {String} propertyName
         * @return {String}
         * @example
         * let property = titledMap.getProperty("info");
         * cc.log("Property: " + property);
         */
        getProperty(propertyName) {
          return this._properties[propertyName.toString()];
        }

        /**
         * @en Return properties dictionary for tile GID.
         * @zh 通过 GID ，获取指定的属性。
         * @method getPropertiesForGID
         * @param {Number} GID
         * @return {Object}
         * @example
         * let properties = titledMap.getPropertiesForGID(GID);
         * cc.log("Properties: " + properties);
         */
        getPropertiesForGID(gid) {
          return this._tileProperties.get(gid);
        }

        /**
         * @en Enables or disables texel offset correction to fix rendering issues like grid edge artifacts.
         * This function adjusts the texture coordinates of each grid in the tilemap by applying
         * a 0.5-pixel offset, ensuring that grid edges do not show black lines or artifacts caused by
         * texture sampling inaccuracies. This is especially useful for tile-based rendering systems.
         * @zh 启用或禁用像素偏移修正，用于修复网格边缘的渲染问题（如黑线）。此函数通过对每个 tilemap 网格的纹理坐标应用 0.5 像素
         * 的偏移来调整，确保网格边缘不会出现因纹理采样不准确导致的黑线或其他伪影问题。对基于图块的渲染系统特别有用。
         *
         * @param enable
         * @en Whether to enable (true) or disable (false) the texel offset correction.
         * @zh 是否启用 (true) 或禁用 (false) 像素偏移修正。
         */
        enableTexelOffset(enable) {
          enableTexelOffsetUtils(enable);
        }
        __preload() {
          if (!this._tmxFile) {
            return;
          }
          if (this._isApplied === false) {
            this._applyFile();
            this._isApplied = true;
          }
        }
        onEnable() {
          this.node.on(NodeEventType.ANCHOR_CHANGED, this._syncAnchorPoint, this);
        }
        onDisable() {
          this.node.off(NodeEventType.ANCHOR_CHANGED, this._syncAnchorPoint, this);
        }
        _applyFile() {
          const spriteFrames = [];
          const spriteFramesCache = {};
          const file = this._tmxFile;
          if (file) {
            // let texValues = file.textures;
            let spfNames = file.spriteFrameNames;
            const spfSizes = file.spriteFrameSizes;
            const fSpriteFrames = file.spriteFrames;
            const spfTexturesMap = {};
            const spfTextureSizeMap = {};
            for (let i = 0; i < spfNames.length; ++i) {
              const texName = spfNames[i];
              // textures[texName] = texValues[i];
              spfTextureSizeMap[texName] = spfSizes[i];
              spriteFrames[i] = fSpriteFrames[i];
              const frame = spriteFrames[i];
              if (frame) {
                spriteFramesCache[frame.name] = frame;
                spfTexturesMap[texName] = frame;
              }
            }
            const imageLayerTextures = {};
            const texValues = file.imageLayerSpriteFrame;
            spfNames = file.imageLayerSpriteFrameNames;
            for (let i = 0; i < texValues.length; ++i) {
              imageLayerTextures[spfNames[i]] = texValues[i];
            }
            const tsxFileNames = file.tsxFileNames;
            const tsxFiles = file.tsxFiles;
            const tsxContentMap = {};
            for (let i = 0; i < tsxFileNames.length; ++i) {
              if (tsxFileNames[i].length > 0) {
                tsxContentMap[tsxFileNames[i]] = tsxFiles[i].text;
              }
            }
            const mapInfo = new TMXMapInfo(file.tmxXmlStr, tsxContentMap, spfTexturesMap, spfTextureSizeMap, imageLayerTextures);
            const tilesets = mapInfo.getTilesets();
            if (!tilesets || tilesets.length === 0) {
              logID(7241);
            }
            this._buildWithMapInfo(mapInfo);
          } else {
            this._releaseMapInfo();
          }
        }
        _releaseMapInfo() {
          // remove the layers & object groups added before
          const layers = this._layers;
          for (let i = 0, l = layers.length; i < l; i++) {
            var _layers$i$node$parent, _layers$i$node$parent2;
            (_layers$i$node$parent = layers[i].node.parent) == null || _layers$i$node$parent.off(NodeEventType.SIZE_CHANGED, layers[i].updateCulling, layers[i]);
            (_layers$i$node$parent2 = layers[i].node.parent) == null || _layers$i$node$parent2.off(NodeEventType.TRANSFORM_CHANGED, layers[i].updateCulling, layers[i]);
            layers[i].node.removeFromParent();
            layers[i].node.destroy();
          }
          layers.length = 0;
          const groups = this._groups;
          for (let i = 0, l = groups.length; i < l; i++) {
            groups[i].node.removeFromParent();
            groups[i].node.destroy();
          }
          groups.length = 0;
          const images = this._images;
          for (let i = 0, l = images.length; i < l; i++) {
            images[i].removeFromParent();
            images[i].destroy();
          }
          images.length = 0;
        }
        _syncAnchorPoint() {
          const anchor = this.node._getUITransformComp().anchorPoint;
          const leftTopX = this.node._getUITransformComp().width * anchor.x;
          const leftTopY = this.node._getUITransformComp().height * (1 - anchor.y);
          let i;
          let l;
          for (i = 0, l = this._layers.length; i < l; i++) {
            const layerInfo = this._layers[i];
            const layerNode = layerInfo.node;
            // Tiled layer sync anchor to map because it's old behavior,
            // do not change the behavior avoid influence user's existed logic.
            layerNode._getUITransformComp().setAnchorPoint(anchor);
          }
          for (i = 0, l = this._groups.length; i < l; i++) {
            const groupInfo = this._groups[i];
            const groupNode = groupInfo.node._getUITransformComp();
            // Group layer not sync anchor to map because it's old behavior,
            // do not change the behavior avoid influence user's existing logic.
            groupNode.anchorX = 0.5;
            groupNode.anchorY = 0.5;
            const x = groupInfo.offset.x - leftTopX + groupNode.width * groupNode.anchorX;
            const y = groupInfo.offset.y + leftTopY - groupNode.height * groupNode.anchorY;
            groupInfo.node.setPosition(x, y);
          }
          for (i = 0, l = this._images.length; i < l; i++) {
            const image = this._images[i]._getUITransformComp();
            image.anchorX = 0.5;
            image.anchorY = 0.5;
            const x = this._images[i]._offset.x - leftTopX + image.width * image.anchorX;
            const y = this._images[i]._offset.y + leftTopY - image.height * image.anchorY;
            this._images[i].setPosition(x, y);
          }
        }
        _fillAniGrids(texGrids, animations) {
          for (const i of animations.keys()) {
            const animation = animations.get(i);
            if (!animation) continue;
            const frames = animation.frames;
            for (let j = 0; j < frames.length; j++) {
              const frame = frames[j];
              frame.grid = texGrids.get(frame.tileid);
            }
          }
        }
        _buildLayerAndGroup() {
          const tilesets = this._tilesets;
          const texGrids = this._texGrids;
          const animations = this._animations;
          texGrids.clear();
          for (let i = 0, l = tilesets.length; i < l; ++i) {
            const tilesetInfo = tilesets[i];
            if (!tilesetInfo) continue;
            if (!tilesetInfo.sourceImage) {
              warnID(16406, i);
              continue;
            }
            fillTextureGrids(tilesetInfo, texGrids, tilesetInfo.sourceImage);
          }
          this._fillAniGrids(texGrids, animations);
          let layers = this._layers;
          let groups = this._groups;
          let images = this._images;
          const oldNodeNames = {};
          for (let i = 0, n = layers.length; i < n; i++) {
            oldNodeNames[layers[i].node.name] = true;
          }
          for (let i = 0, n = groups.length; i < n; i++) {
            oldNodeNames[groups[i].node.name] = true;
          }
          for (let i = 0, n = images.length; i < n; i++) {
            oldNodeNames[images[i].name] = true;
          }
          layers = this._layers = [];
          groups = this._groups = [];
          images = this._images = [];
          const mapInfo = this._mapInfo;
          const node = this.node;
          const layerInfos = mapInfo.getAllChildren();
          const textures = this._textures;
          let maxWidth = 0;
          let maxHeight = 0;
          if (layerInfos && layerInfos.length > 0) {
            for (let i = 0, len = layerInfos.length; i < len; i++) {
              const layerInfo = layerInfos[i];
              const name = layerInfo.name;
              let child = this.node.getChildByName(name);
              oldNodeNames[name] = false;
              if (!child) {
                child = new Node();
                child.name = name;
                child.layer = node.layer;
                node.addChild(child);
              }
              child.setSiblingIndex(i);
              child.active = layerInfo.visible;
              if (layerInfo instanceof TMXLayerInfo) {
                let layer = child.getComponent(TiledLayer);
                if (!layer) {
                  layer = child.addComponent(TiledLayer);
                }
                layer.init(layerInfo, mapInfo, tilesets, textures, texGrids);
                layer.enableCulling = this._enableCulling;

                // tell the layerinfo to release the ownership of the tiles map.
                layerInfo.ownTiles = false;
                layers.push(layer);
              } else if (layerInfo instanceof TMXObjectGroupInfo) {
                let group = child.getComponent(TiledObjectGroup);
                if (!group) {
                  group = child.addComponent(TiledObjectGroup);
                }
                group._init(layerInfo, mapInfo, texGrids);
                groups.push(group);
              } else if (layerInfo instanceof TMXImageLayerInfo) {
                const spriteFrame = layerInfo.sourceImage;
                child.layerInfo = layerInfo;
                child._offset = new Vec2(layerInfo.offset.x, -layerInfo.offset.y);
                let image = child.getComponent(Sprite);
                if (!image) {
                  image = child.addComponent(Sprite);
                }
                const color = image.color;
                color.a *= layerInfo.opacity;
                image.spriteFrame = spriteFrame;
                let width = spriteFrame.width;
                let height = spriteFrame.height;
                if (spriteFrame.original) {
                  width = spriteFrame.originalSize.width;
                  height = spriteFrame.originalSize.height;
                }
                child._getUITransformComp().setContentSize(width, height);
                images.push(child);
              }
              maxWidth = Math.max(maxWidth, child._getUITransformComp().width);
              maxHeight = Math.max(maxHeight, child._getUITransformComp().height);
            }
          }
          const children = node.children;
          for (let i = 0, n = children.length; i < n; i++) {
            const c = children[i];
            if (oldNodeNames[c.name]) {
              c.destroy();
            }
          }
          this.node._getUITransformComp().setContentSize(maxWidth, maxHeight);
          this._syncAnchorPoint();
        }
        _buildWithMapInfo(mapInfo) {
          this._mapInfo = mapInfo;
          this._mapSize = mapInfo.getMapSize();
          this._tileSize = mapInfo.getTileSize();
          this._mapOrientation = mapInfo.orientation;
          this._properties = mapInfo.properties;
          this._tileProperties = mapInfo.getTileProperties();
          this._imageLayers = mapInfo.getImageLayers();
          this._animations = mapInfo.getTileAnimations();
          this._tilesets = mapInfo.getTilesets();
          const tilesets = this._tilesets;
          this._textures.length = 0;
          const totalTextures = [];
          for (let i = 0, l = tilesets.length; i < l; ++i) {
            const tilesetInfo = tilesets[i];
            if (!tilesetInfo || !tilesetInfo.sourceImage) continue;
            this._textures[i] = tilesetInfo.sourceImage;
            totalTextures.push(tilesetInfo.sourceImage);
          }
          for (let i = 0; i < this._imageLayers.length; i++) {
            const imageLayer = this._imageLayers[i];
            if (!imageLayer || !imageLayer.sourceImage) continue;
            totalTextures.push(imageLayer.sourceImage);
          }
          this._buildLayerAndGroup();
          if (this.cleanupImageCache) {
            this._textures.forEach(tex => {
              this.doCleanupImageCache(tex);
            });
          }
        }
        doCleanupImageCache(texture) {
          if (texture._image instanceof HTMLImageElement) {
            texture._image.src = '';
            if (JSB) texture._image.destroy();
          } else if (sys.hasFeature(sys.Feature.IMAGE_BITMAP) && texture._image instanceof ImageBitmap) {
            if (texture._image.close) texture._image.close();
          }
          texture._image = null;
        }
        lateUpdate(dt) {
          const animations = this._animations;
          const texGrids = this._texGrids;
          for (const aniGID of animations.keys()) {
            const animation = animations.get(aniGID);
            const frames = animation.frames;
            let frame = frames[animation.frameIdx];
            animation.dt += dt;
            if (frame.duration < animation.dt) {
              animation.dt = 0;
              animation.frameIdx++;
              if (animation.frameIdx >= frames.length) {
                animation.frameIdx = 0;
              }
              frame = frames[animation.frameIdx];
            }
            texGrids.set(aniGID, frame.grid);
          }
          const layers = this.getLayers();
          for (let i = 0, l = layers.length; i < l; i++) {
            const layer = layers[i];
            if (layer.hasAnimation() || layer.node.hasChangedFlags) {
              layer._markForUpdateRenderData();
            }
          }
        }
      }, _TiledMap.Orientation = Orientation, _TiledMap.Property = Property, _TiledMap.TileFlag = TileFlag, _TiledMap.StaggerAxis = StaggerAxis, _TiledMap.StaggerIndex = StaggerIndex, _TiledMap.TMXObjectType = TMXObjectType, _TiledMap.RenderOrder = RenderOrder, _TiledMap), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_tmxFile", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "tmxAsset", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "tmxAsset"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_enableCulling", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enableCulling", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "enableCulling"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "cleanupImageCache", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});