System.register("q-bundled:///fs/cocos/tiledmap/tiled-object-group.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../2d/components/sprite.js", "../2d/components/label.js", "../gfx/index.js", "./tiled-types.js", "../2d/framework/ui-transform.js", "../core/index.js", "../2d/assets/index.js", "../scene-graph/node.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, type, requireComponent, Component, Sprite, Label, BlendFactor, TileFlag, Orientation, StaggerAxis, TMXObjectType, UITransform, CCBoolean, Vec2, Color, CCObjectFlags, SpriteFrame, Node, _dec, _dec2, _dec3, _dec4, _class, _class2, TiledObjectGroup;
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      type = _coreDataDecoratorsIndexJs.type;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_dComponentsSpriteJs) {
      Sprite = _dComponentsSpriteJs.Sprite;
    }, function (_dComponentsLabelJs) {
      Label = _dComponentsLabelJs.Label;
    }, function (_gfxIndexJs) {
      BlendFactor = _gfxIndexJs.BlendFactor;
    }, function (_tiledTypesJs) {
      TileFlag = _tiledTypesJs.TileFlag;
      Orientation = _tiledTypesJs.Orientation;
      StaggerAxis = _tiledTypesJs.StaggerAxis;
      TMXObjectType = _tiledTypesJs.TMXObjectType;
    }, function (_dFrameworkUiTransformJs) {
      UITransform = _dFrameworkUiTransformJs.UITransform;
    }, function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      Vec2 = _coreIndexJs.Vec2;
      Color = _coreIndexJs.Color;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
    }, function (_dAssetsIndexJs) {
      SpriteFrame = _dAssetsIndexJs.SpriteFrame;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }],
    execute: function () {
      /*
       Copyright (c) 2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en Renders the TMX object group.
       * @zh 渲染 tmx object group。
       * @class TiledObjectGroup
       * @extends Component
       */
      _export("TiledObjectGroup", TiledObjectGroup = (_dec = ccclass('cc.TiledObjectGroup'), _dec2 = help('i18n:cc.TiledObjectGroup'), _dec3 = requireComponent(UITransform), _dec4 = type(CCBoolean), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class TiledObjectGroup extends Component {
        constructor() {
          super();
          this._premultiplyAlpha = false;
          this._groupName = void 0;
          this._positionOffset = void 0;
          this._mapInfo = void 0;
          this._properties = void 0;
          this._offset = void 0;
          this._opacity = void 0;
          this._tintColor = null;
          this._animations = void 0;
          this._hasAniObj = void 0;
          this._texGrids = void 0;
          this.aniObjects = void 0;
          this._objects = [];
        }
        get premultiplyAlpha() {
          return this._premultiplyAlpha;
        }
        set premultiplyAlpha(value) {
          this._premultiplyAlpha = value;
        }

        /**
         * @en Offset position of child objects.
         * @zh 获取子对象的偏移位置。
         * @method getPositionOffset
         * @return {Vec2}
         * @example
         * let offset = tMXObjectGroup.getPositionOffset();
         */
        getPositionOffset() {
          return this._positionOffset;
        }

        /**
         * @en List of properties stored in a dictionary.
         * @zh 以映射的形式获取属性列表。
         * @method getProperties
         * @return {Object}
         * @example
         * let offset = tMXObjectGroup.getProperties();
         */
        getProperties() {
          return this._properties;
        }

        /**
         * @en Gets the Group name.
         * @zh 获取组名称。
         * @method getGroupName
         * @return {String}
         * @example
         * let groupName = tMXObjectGroup.getGroupName;
         */
        getGroupName() {
          return this._groupName;
        }

        /**
         * Return the value for the specific property name
         * @param {String} propertyName
         * @return {Object}
         */
        getProperty(propertyName) {
          return this._properties[propertyName.toString()];
        }

        /**
         * @en
         * Return the object for the specific object name. <br />
         * It will return the 1st object found on the array for the given name.
         * @zh 获取指定的对象。
         * @method getObject
         * @param {String} objectName
         * @return {Object|Null}
         * @example
         * let object = tMXObjectGroup.getObject("Group");
         */
        getObject(objectName) {
          for (let i = 0, len = this._objects.length; i < len; i++) {
            const obj = this._objects[i];
            if (obj && obj.name === objectName) {
              return obj;
            }
          }
          // object not found
          return null;
        }

        /**
         * @en Gets the objects.
         * @zh 获取对象数组。
         * @method getObjects
         * @return {Array}
         * @example
         * let objects = tMXObjectGroup.getObjects();
         */
        getObjects() {
          return this._objects;
        }
        get offset() {
          return this._offset;
        }
        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _init(groupInfo, mapInfo, texGrids) {
          const FLIPPED_MASK = TileFlag.FLIPPED_MASK;
          const FLAG_HORIZONTAL = TileFlag.HORIZONTAL;
          const FLAG_VERTICAL = TileFlag.VERTICAL;
          this._groupName = groupInfo.name;
          this._positionOffset = groupInfo.offset;
          this._mapInfo = mapInfo;
          this._properties = groupInfo.getProperties();
          this._offset = new Vec2(groupInfo.offset.x, -groupInfo.offset.y);
          this._opacity = groupInfo.opacity;
          if (groupInfo.tintColor) {
            this._tintColor = groupInfo.tintColor;
          }
          this._texGrids = texGrids;
          this._animations = mapInfo.getTileAnimations();
          this.aniObjects = [];
          this._hasAniObj = false;
          const mapSize = mapInfo.mapSize;
          const tileSize = mapInfo.tileSize;
          let width = 0;
          let height = 0;
          const colorVal = new Color();
          const iso = Orientation.ISO === mapInfo.orientation;
          if (mapInfo.orientation === Orientation.HEX) {
            if (mapInfo.getStaggerAxis() === StaggerAxis.STAGGERAXIS_X) {
              height = tileSize.height * (mapSize.height + 0.5);
              width = (tileSize.width + mapInfo.getHexSideLength()) * Math.floor(mapSize.width / 2) + tileSize.width * (mapSize.width % 2);
            } else {
              width = tileSize.width * (mapSize.width + 0.5);
              height = (tileSize.height + mapInfo.getHexSideLength()) * Math.floor(mapSize.height / 2) + tileSize.height * (mapSize.height % 2);
            }
          } else if (iso) {
            const wh = mapSize.width + mapSize.height;
            width = tileSize.width * 0.5 * wh;
            height = tileSize.height * 0.5 * wh;
          } else {
            width = mapSize.width * tileSize.width;
            height = mapSize.height * tileSize.height;
          }
          const transComp = this.node._getUITransformComp();
          transComp.setContentSize(width, height);
          const leftTopX = width * transComp.anchorX;
          const leftTopY = height * (1 - transComp.anchorY);
          const objects = groupInfo.objects;
          const aliveNodes = {};
          for (let i = 0, l = objects.length; i < l; i++) {
            const object = objects[i];
            const objType = object.type;
            object.offset = new Vec2(object.x, object.y);
            const points = object.points || object.polylinePoints;
            if (points) {
              for (let pi = 0; pi < points.length; pi++) {
                points[pi].y *= -1;
              }
            }
            if (iso) {
              const posIdxX = object.x / tileSize.height;
              const posIdxY = object.y / tileSize.height;
              object.x = tileSize.width * 0.5 * (mapSize.height + posIdxX - posIdxY);
              object.y = tileSize.height * 0.5 * (mapSize.width + mapSize.height - posIdxX - posIdxY);
            } else {
              object.y = height - object.y;
            }
            if (objType === TMXObjectType.TEXT) {
              const textName = `text${object.id}`;
              aliveNodes[textName] = true;
              let textNode = this.node.getChildByName(textName);
              if (!textNode) {
                textNode = new Node();
              }
              textNode.setRotationFromEuler(0, 0, -object.rotation);
              textNode.setPosition(object.x - leftTopX, object.y - leftTopY);
              textNode.name = textName;
              textNode.parent = this.node;
              textNode.setSiblingIndex(i);
              textNode.layer = this.node.layer;
              let label = textNode.getComponent(Label);
              if (!label) {
                label = textNode.addComponent(Label);
              }
              const textTransComp = textNode._getUITransformComp();
              textNode.active = object.visible;
              textTransComp.anchorX = 0;
              textTransComp.anchorY = 1;
              if (this._tintColor) {
                colorVal.set(this._tintColor);
                colorVal.a *= this._opacity / 255;
                label.color.set(colorVal);
              } else {
                const c = label.color;
                c.a *= this._opacity / 255;
              }
              label.overflow = Label.Overflow.SHRINK;
              label.lineHeight = object.height;
              label.string = object.text;
              label.horizontalAlign = object.halign;
              label.verticalAlign = object.valign;
              label.fontSize = object.pixelsize;
              textTransComp.setContentSize(object.width, object.height);
            } else if (objType === TMXObjectType.IMAGE) {
              const gid = object.gid;
              const gridGID = (gid & FLIPPED_MASK) >>> 0;
              const grid = texGrids.get(gridGID);
              if (!grid) continue;
              const tileset = grid.tileset;
              const imgName = `img${object.id}`;
              aliveNodes[imgName] = true;
              let imgNode = this.node.getChildByName(imgName);
              object.width = object.width || grid.width;
              object.height = object.height || grid.height;

              // Delete image nodes implemented as private nodes
              // Use cc.Node to implement node-level requirements
              if (imgNode && imgNode._objFlags & CCObjectFlags.HideInHierarchy) {
                imgNode.removeFromParent();
                imgNode.hideFlags |= CCObjectFlags.DontSave;
                imgNode.destroy();
                imgNode = null;
              }
              if (!imgNode) {
                imgNode = new Node();
              }
              if (this._animations.get(gridGID)) {
                this.aniObjects.push({
                  object,
                  imgNode,
                  gridGID
                });
                this._hasAniObj = true;
              }
              const tileOffsetX = tileset.tileOffset.x;
              const tileOffsetY = tileset.tileOffset.y;
              imgNode.active = object.visible;
              imgNode.setRotationFromEuler(0, 0, -object.rotation);
              imgNode.setPosition(object.x - leftTopX, object.y - leftTopY);
              imgNode.name = imgName;
              imgNode.parent = this.node;
              imgNode.setSiblingIndex(i);
              imgNode.layer = this.node.layer;
              let sprite = imgNode.getComponent(Sprite);
              if (!sprite) {
                sprite = imgNode.addComponent(Sprite);
              }
              const imgTrans = imgNode._getUITransformComp();
              if (iso) {
                imgTrans.anchorX = 0.5 + tileOffsetX / object.width;
                imgTrans.anchorY = tileOffsetY / object.height;
              } else {
                imgTrans.anchorX = tileOffsetX / object.width;
                imgTrans.anchorY = tileOffsetY / object.height;
              }
              if (this._tintColor) {
                colorVal.set(this._tintColor);
                colorVal.a *= this._opacity / 255;
                sprite.color.set(colorVal);
              } else {
                const c = sprite.color;
                c.a *= this._opacity / 255;
              }
              sprite.sizeMode = Sprite.SizeMode.CUSTOM;

              // HACK: we should support _premultiplyAlpha when group had material
              const srcBlendFactor = this._premultiplyAlpha ? BlendFactor.ONE : BlendFactor.SRC_ALPHA;
              if (sprite.srcBlendFactor !== srcBlendFactor) {
                sprite.srcBlendFactor = srcBlendFactor;
                if (sprite.material) {
                  sprite._updateBlendFunc();
                }
              }
              let spf = grid.spriteFrame;
              if (!spf) {
                spf = new SpriteFrame();
              } else {
                spf = spf.clone();
              }
              if ((gid & FLAG_HORIZONTAL) >>> 0) {
                spf.flipUVX = !spf.flipUVX;
              }
              if ((gid & FLAG_VERTICAL) >>> 0) {
                spf.flipUVY = !spf.flipUVY;
              }
              spf.rotated = grid._rotated;
              spf.rect = grid._rect;
              sprite.spriteFrame = spf;
              imgTrans.setContentSize(object.width, object.height);
              sprite._markForUpdateRenderData();
            }
          }
          this._objects = objects;

          // destroy useless node
          const children = this.node.children;
          const uselessExp = /^(?:img|text)\d+$/;
          for (let i = 0, n = children.length; i < n; i++) {
            const c = children[i];
            const cName = c.name;
            const isUseless = uselessExp.test(cName);
            if (isUseless && !aliveNodes[cName]) c.destroy();
          }
        }
        update(dt) {
          if (!this._hasAniObj) {
            return;
          }
          const aniObjects = this.aniObjects;
          const _texGrids = this._texGrids;
          const iso = Orientation.ISO === this._mapInfo.orientation;
          for (let i = 0, len = aniObjects.length; i < len; i++) {
            const aniObj = aniObjects[i];
            const gridGID = aniObj.gridGID;
            const grid = _texGrids.get(gridGID);
            if (!grid) {
              continue;
            }
            const tileset = grid.tileset;
            const object = aniObj.object;
            const imgNode = aniObj.imgNode;
            const tileOffsetX = tileset.tileOffset.x;
            const tileOffsetY = tileset.tileOffset.y;
            const imgTrans = imgNode._getUITransformComp();
            if (iso) {
              imgTrans.anchorX = 0.5 + tileOffsetX / object.width;
              imgTrans.anchorY = tileOffsetY / object.height;
            } else {
              imgTrans.anchorX = tileOffsetX / object.width;
              imgTrans.anchorY = tileOffsetY / object.height;
            }
            const sp = imgNode.getComponent(Sprite);
            const spf = sp.spriteFrame;
            spf.rotated = grid._rotated;
            spf.rect = grid._rect;
            sp.spriteFrame = spf;
            sp._markForUpdateRenderData();
          }
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "premultiplyAlpha", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "premultiplyAlpha"), _class2.prototype), _class2)) || _class) || _class) || _class));
    }
  };
});