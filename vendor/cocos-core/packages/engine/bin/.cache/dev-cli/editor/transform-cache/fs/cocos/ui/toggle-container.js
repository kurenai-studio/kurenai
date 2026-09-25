System.register("q-bundled:///fs/cocos/ui/toggle-container.js", ["../core/data/decorators/index.js", "../scene-graph/index.js", "../core/global-exports.js", "../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, executionOrder, menu, tooltip, type, serializable, Component, ComponentEventHandler, legacyCC, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, ToggleContainer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
      ComponentEventHandler = _sceneGraphIndexJs.EventHandler;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
       * @en
       * ToggleContainer is not a visible UI component but a way to modify the behavior of a set of Toggles. <br/>
       * Toggles that belong to the same group could only have one of them to be switched on at a time.<br/>
       * Note: All the first layer child node containing the toggle component will auto be added to the container.
       *
       * @zh
       * ToggleGroup 不是一个可见的 UI 组件，它可以用来修改一组 Toggle  组件的行为。当一组 Toggle 属于同一个 ToggleGroup 的时候，<br/>
       * 任何时候只能有一个 Toggle 处于选中状态。
       */
      _export("ToggleContainer", ToggleContainer = (_dec = ccclass('cc.ToggleContainer'), _dec2 = help('i18n:cc.ToggleContainer'), _dec3 = executionOrder(110), _dec4 = menu('UI/ToggleContainer'), _dec5 = tooltip('i18n:toggle_group.allowSwitchOff'), _dec6 = type([ComponentEventHandler]), _dec7 = tooltip('i18n:toggle_group.check_events'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = class ToggleContainer extends Component {
        /**
         * @en
         * If this setting is true, a toggle could be switched off and on when pressed.
         * If it is false, it will make sure there is always only one toggle could be switched on
         * and the already switched on toggle can't be switched off.
         *
         * @zh
         * 如果这个设置为 true，那么 toggle 按钮在被点击的时候可以反复地被选中和未选中。
         */
        get allowSwitchOff() {
          return this._allowSwitchOff;
        }
        set allowSwitchOff(value) {
          this._allowSwitchOff = value;
        }

        /**
         * @en
         * If Toggle is clicked, it will trigger event's handler.
         *
         * @zh
         * Toggle 按钮的点击事件列表。
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "_allowSwitchOff", _descriptor, this);
          _initializerDefineProperty(this, "checkEvents", _descriptor2, this);
        }

        /**
         * @en
         * Read only property, return the toggle items array reference managed by ToggleContainer.
         *
         * @zh
         * 只读属性，返回 toggleContainer 管理的 toggle 数组引用。
         */
        get toggleItems() {
          return this.node.children.map(item => {
            const toggle = item.getComponent('cc.Toggle');
            if (toggle && toggle.enabled) {
              return toggle;
            }
            return null;
          }).filter(Boolean);
        }
        onEnable() {
          this.ensureValidState();
          this.node.on(NodeEventType.CHILD_ADDED, this.ensureValidState, this);
          this.node.on(NodeEventType.CHILD_REMOVED, this.ensureValidState, this);
        }
        onDisable() {
          this.node.off(NodeEventType.CHILD_ADDED, this.ensureValidState, this);
          this.node.off(NodeEventType.CHILD_REMOVED, this.ensureValidState, this);
        }
        activeToggles() {
          return this.toggleItems.filter(x => x.isChecked);
        }
        anyTogglesChecked() {
          return !!this.toggleItems.find(x => x.isChecked);
        }

        /**
         * @en
         * Refresh the state of the managed toggles.
         *
         * @zh
         * 刷新管理的 toggle 状态。
         *
         * @param toggle @en The toggle to be updated. @zh 需要被更新的切换键。
         * @param emitEvent @en Whether events are needed to be emitted. @zh 是否需要触发事件。
         */
        notifyToggleCheck(toggle, emitEvent = true) {
          if (!this.enabledInHierarchy) {
            return;
          }
          for (let i = 0; i < this.toggleItems.length; i++) {
            const item = this.toggleItems[i];
            if (item === toggle) {
              continue;
            }
            if (emitEvent) {
              item.isChecked = false;
            } else {
              item.setIsCheckedWithoutNotify(false);
            }
          }
          if (this.checkEvents) {
            legacyCC.Component.EventHandler.emitEvents(this.checkEvents, toggle);
          }
        }

        /**
         * @en Ensure toggles state valid.
         * @zh 确保 toggles 状态有效。
         */
        ensureValidState() {
          const toggles = this.toggleItems;
          if (!this._allowSwitchOff && !this.anyTogglesChecked() && toggles.length !== 0) {
            const toggle = toggles[0];
            toggle.isChecked = true;
            this.notifyToggleCheck(toggle);
          }
          const activeToggles = this.activeToggles();
          if (activeToggles.length > 1) {
            const firstToggle = activeToggles[0];
            for (let i = 0; i < activeToggles.length; ++i) {
              const toggle = activeToggles[i];
              if (toggle === firstToggle) {
                continue;
              }
              toggle.isChecked = false;
            }
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_allowSwitchOff", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "allowSwitchOff", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "allowSwitchOff"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "checkEvents", [_dec6, serializable, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
      legacyCC.ToggleContainer = ToggleContainer;
    }
  };
});