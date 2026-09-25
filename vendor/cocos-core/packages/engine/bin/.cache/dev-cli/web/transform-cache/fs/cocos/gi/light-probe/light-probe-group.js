System.register("q-bundled:///fs/cocos/gi/light-probe/light-probe-group.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../scene-graph/node-event.js", "../../scene-graph/component.js", "../../core/index.js", "./auto-placement.js"], function (_export, _context) {
  "use strict";

  var ccclass, disallowMultiple, displayName, editable, executeInEditMode, help, menu, range, serializable, tooltip, type, visible, EDITOR, NodeEventType, Component, Vec3, CCInteger, AutoPlacement, PlaceMethod, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, LightProbeGroup;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      displayName = _coreDataDecoratorsIndexJs.displayName;
      editable = _coreDataDecoratorsIndexJs.editable;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      CCInteger = _coreIndexJs.CCInteger;
    }, function (_autoPlacementJs) {
      AutoPlacement = _autoPlacementJs.AutoPlacement;
      PlaceMethod = _autoPlacementJs.PlaceMethod;
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
      /**
       * @en The light probe group component.
       * @zh 光照探针组组件。
       */
      _export("LightProbeGroup", LightProbeGroup = (_dec = ccclass('cc.LightProbeGroup'), _dec2 = help('i18n:cc.LightProbeGroup'), _dec3 = menu('Rendering/LightProbeGroup'), _dec4 = type([Vec3]), _dec5 = visible(false), _dec6 = type(PlaceMethod), _dec7 = tooltip('i18n:light_probe_group.method'), _dec8 = displayName('Generating Method'), _dec9 = tooltip('i18n:light_probe_group.minPos'), _dec0 = displayName('Generating Min Pos'), _dec1 = tooltip('i18n:light_probe_group.maxPos'), _dec10 = displayName('Generating Max Pos'), _dec11 = range([2, 65535, 1]), _dec12 = type(CCInteger), _dec13 = tooltip('i18n:light_probe_group.nProbesX'), _dec14 = displayName('Number Of Probes X'), _dec15 = range([2, 65535, 1]), _dec16 = type(CCInteger), _dec17 = tooltip('i18n:light_probe_group.nProbesY'), _dec18 = displayName('Number Of Probes Y'), _dec19 = range([2, 65535, 1]), _dec20 = type(CCInteger), _dec21 = tooltip('i18n:light_probe_group.nProbesZ'), _dec22 = displayName('Number Of Probes Z'), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class LightProbeGroup extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_probes", _descriptor, this);
          _initializerDefineProperty(this, "_method", _descriptor2, this);
          _initializerDefineProperty(this, "_minPos", _descriptor3, this);
          _initializerDefineProperty(this, "_maxPos", _descriptor4, this);
          _initializerDefineProperty(this, "_nProbesX", _descriptor5, this);
          _initializerDefineProperty(this, "_nProbesY", _descriptor6, this);
          _initializerDefineProperty(this, "_nProbesZ", _descriptor7, this);
        }
        get probes() {
          return this._probes;
        }
        set probes(val) {
          this._probes = val;
        }
        get method() {
          return this._method;
        }
        // Support this feature later.
        // set method (val) {
        //     this._method = val;
        // }

        /**
         * @en Minimum position of the light probe group
         * @zh 光照探针组包围盒最小值
         */
        get minPos() {
          return this._minPos;
        }
        set minPos(val) {
          this._minPos = val;
        }

        /**
         * @en Maximum position of the light probe group
         * @zh 光照探针组包围盒最大值
         */
        get maxPos() {
          return this._maxPos;
        }
        set maxPos(val) {
          this._maxPos = val;
        }
        get nProbesX() {
          return this._nProbesX;
        }
        set nProbesX(val) {
          this._nProbesX = val;
        }
        get nProbesY() {
          return this._nProbesY;
        }
        set nProbesY(val) {
          this._nProbesY = val;
        }
        get nProbesZ() {
          return this._nProbesZ;
        }
        set nProbesZ(val) {
          this._nProbesZ = val;
        }
        onLoad() {
          if (!EDITOR) {
            return;
          }
          if (!this.node) {
            return;
          }
          const lightProbeInfo = this.node.scene.globals.lightProbeInfo;
          const changed = lightProbeInfo.addNode(this.node);
          if (changed) {
            lightProbeInfo.syncData(this.node, this.probes);
            lightProbeInfo.update(true);
          }
        }
        onEnable() {
          if (!EDITOR) {
            return;
          }
          if (!this.node) {
            return;
          }
          const changed = this.node.scene.globals.lightProbeInfo.addNode(this.node);
          if (changed) {
            this.onProbeChanged();
          }
        }
        onDisable() {
          if (!EDITOR) {
            return;
          }
          if (!this.node) {
            return;
          }
          const changed = this.node.scene.globals.lightProbeInfo.removeNode(this.node);
          if (changed) {
            this.onProbeChanged();
          }
        }
        generateLightProbes() {
          if (!this.node) {
            return;
          }
          this._probes = AutoPlacement.generate({
            method: this._method,
            nProbesX: this._nProbesX,
            nProbesY: this._nProbesY,
            nProbesZ: this._nProbesZ,
            minPos: this._minPos,
            maxPos: this._maxPos
          });
          this.onProbeChanged();
        }
        onProbeChanged(updateTet = true, emitEvent = true) {
          const lightProbeInfo = this.node.scene.globals.lightProbeInfo;
          lightProbeInfo.syncData(this.node, this.probes);
          lightProbeInfo.update(updateTet);
          if (emitEvent) {
            this.node.emit(NodeEventType.LIGHT_PROBE_CHANGED);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_probes", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_method", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PlaceMethod.UNIFORM;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_minPos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(-5, -5, -5);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_maxPos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(5, 5, 5);
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_nProbesX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_nProbesY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_nProbesZ", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "probes", [editable, _dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "probes"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "method", [editable, _dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "method"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "minPos", [editable, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "minPos"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxPos", [editable, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "maxPos"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nProbesX", [editable, _dec11, _dec12, _dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "nProbesX"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nProbesY", [editable, _dec15, _dec16, _dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "nProbesY"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "nProbesZ", [editable, _dec19, _dec20, _dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "nProbesZ"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});