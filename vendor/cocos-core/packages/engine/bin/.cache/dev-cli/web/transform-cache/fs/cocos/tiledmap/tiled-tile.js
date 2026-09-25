System.register("q-bundled:///fs/cocos/tiledmap/tiled-tile.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../core/index.js", "../2d/framework/index.js", "../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, help, menu, requireComponent, type, Component, CCInteger, warn, UITransform, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, TiledTile;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      CCInteger = _coreIndexJs.CCInteger;
      warn = _coreIndexJs.warn;
    }, function (_dFrameworkIndexJs) {
      UITransform = _dFrameworkIndexJs.UITransform;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
       * @en TiledTile can control the specified map tile.
       * It will apply the node rotation, scale, translate to the map tile.
       * You can change the TiledTile's gid to change the map tile's style.
       * @zh TiledTile 可以单独对某一个地图块进行操作。
       * 他会将节点的旋转，缩放，平移操作应用在这个地图块上，并可以通过更换当前地图块的 gid 来更换地图块的显示样式。
       * @class TiledTile
       * @extends Component
       */
      _export("TiledTile", TiledTile = (_dec = ccclass('cc.TiledTile'), _dec2 = help('i18n:cc.TiledTile'), _dec3 = menu('TiledMap/TiledTile'), _dec4 = requireComponent(UITransform), _dec5 = type(CCInteger), _dec6 = type(CCInteger), _dec7 = type(CCInteger), _dec8 = type(CCInteger), _dec9 = type(CCInteger), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = class TiledTile extends Component {
        constructor() {
          super();
          this._layer = null;
          _initializerDefineProperty(this, "_x", _descriptor, this);
          _initializerDefineProperty(this, "_y", _descriptor2, this);
        }
        /**
         * @en Specify the TiledTile horizontal coordinate，use map tile as the unit.
         * @zh 指定 TiledTile 的横向坐标，以地图块为单位
         * @property {Number} x
         * @default 0
         */

        get x() {
          return this._x;
        }
        set x(value) {
          if (value === this._x) return;
          if (this._layer && this._layer.isInvalidPosition(value, this._y)) {
            warn(`Invalid x, the valid value is between [%s] ~ [%s]`, 0, this._layer.layerSize.width);
            return;
          }
          this._resetTile();
          this._x = value;
          this.updateInfo();
        }

        /**
         * @en Specify the TiledTile vertical coordinate，use map tile as the unit.
         * @zh 指定 TiledTile 的纵向坐标，以地图块为单位
         * @property {Number} y
         * @default 0
         */
        get y() {
          return this._y;
        }
        set y(value) {
          if (value === this._y) return;
          if (this._layer && this._layer.isInvalidPosition(this._x, value)) {
            warn(`Invalid y, the valid value is between [%s] ~ [%s]`, 0, this._layer.layerSize.height);
            return;
          }
          this._resetTile();
          this._y = value;
          this.updateInfo();
        }
        /**
         * @en Specify the TiledTile gid.
         * @zh 指定 TiledTile 的 gid 值
         * @property {Number} gid
         * @default 0
         */
        get grid() {
          if (this._layer) {
            return this._layer.getTileGIDAt(this._x, this._y);
          }
          return 0;
        }
        set grid(value) {
          if (this._layer) {
            this._layer.setTileGIDAt(value, this._x, this._y);
          }
        }
        onEnable() {
          const parent = this.node.parent;
          this._layer = parent.getComponent('cc.TiledLayer');
          this.node.on(NodeEventType.TRANSFORM_CHANGED, this._updatePosition, this);
          this.node.on(NodeEventType.SIZE_CHANGED, this._updatePosition, this);
          this._resetTile();
          this.updateInfo();
        }
        onDisable() {
          this._resetTile();
          this.node.off(NodeEventType.TRANSFORM_CHANGED, this._updatePosition, this);
          this.node.off(NodeEventType.SIZE_CHANGED, this._updatePosition, this);
        }
        _resetTile() {
          if (this._layer && this._layer.getTiledTileAt(this._x, this._y) === this) {
            this._layer.setTiledTileAt(this._x, this._y, null);
          }
        }
        updateInfo() {
          if (!this._layer) return;
          const x = this._x;
          const y = this._y;
          if (this._layer.getTiledTileAt(x, y)) {
            warn('There is already a TiledTile at [%s, %s]', x, y);
            return;
          }
          const p = this._layer.getPositionAt(x, y);
          this.node.setPosition(p.x, p.y);
          this._layer.setTiledTileAt(x, y, this);
          this._layer._markForUpdateRenderData();
        }
        _updatePosition() {
          this._layer._markForUpdateRenderData();
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_x", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_y", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "x", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "x"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "y", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "y"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "grid", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "grid"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});