System.register("q-bundled:///fs/cocos/animation/marionette/animation-controller.js", ["../../../../virtual/internal%253Aconstants.js", "../../scene-graph/component.js", "./animation-graph.js", "../../core/index.js", "./graph-eval.js", "./animation-graph-variant.js", "./animation-graph-like.js"], function (_export, _context) {
  "use strict";

  var DEBUG, Component, AnimationGraph, _decorator, assertIsNonNullable, assertIsTrue, warn, AnimationGraphEval, AnimationGraphVariant, AnimationGraphLike, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, ccclass, menu, help, type, serializable, editable, formerlySerializedAs, AnimationController;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_animationGraphJs) {
      AnimationGraph = _animationGraphJs.AnimationGraph;
    }, function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
      assertIsNonNullable = _coreIndexJs.assertIsNonNullable;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      warn = _coreIndexJs.warn;
    }, function (_graphEvalJs) {
      AnimationGraphEval = _graphEvalJs.AnimationGraphEval;
    }, function (_animationGraphVariantJs) {
      AnimationGraphVariant = _animationGraphVariantJs.AnimationGraphVariant;
    }, function (_animationGraphLikeJs) {
      AnimationGraphLike = _animationGraphLikeJs.AnimationGraphLike;
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
      ({
        ccclass,
        menu,
        help,
        type,
        serializable,
        editable,
        formerlySerializedAs
      } = _decorator);
      /**
       * @en
       * The animation controller component applies an animation graph
       * to the node which it's attached to.
       * When the controller starts, the animation graph is instantiated.
       * Then you may set variables or query the running statuses of the animation graph instance.
       * @zh
       * 将动画图应用到动画控制器组件所挂载的节点上。
       * 当动画控制器开始运行时，动画图会被实例化。然后便可以设置动画图实例中的变量或者查询动画图的运行状况。
       */
      _export("AnimationController", AnimationController = (_dec = ccclass('cc.animation.AnimationController'), _dec2 = menu('Animation/Animation Controller'), _dec3 = help('i18n:cc.animation.AnimationController'), _dec4 = type(AnimationGraphLike), _dec5 = formerlySerializedAs('graph'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class AnimationController extends Component {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_graph", _descriptor, this);
          this._graphEval = null;
        }
        /**
         * @zh
         * 动画控制器所关联的动画图。
         * @en
         * The animation graph associated with the animation controller.
         */
        get graph() {
          return this._graph;
        }
        set graph(value) {
          this._graph = value;
        }
        /**
         * @zh 获取动画图的层级数量。如果控制器没有指定动画图，则返回 0。
         * @en Gets the count of layers in the animation graph.
         * If no animation graph is specified, 0 is returned.
         */
        get layerCount() {
          var _this$_graphEval$laye, _this$_graphEval;
          return (_this$_graphEval$laye = (_this$_graphEval = this._graphEval) == null ? void 0 : _this$_graphEval.layerCount) != null ? _this$_graphEval$laye : 0;
        }
        __preload() {
          const {
            graph
          } = this;
          if (graph) {
            let originalGraph;
            let clipOverrides = null;
            if (graph instanceof AnimationGraphVariant) {
              if (!graph.original) {
                return;
              }
              originalGraph = graph.original;
              clipOverrides = graph.clipOverrides;
            } else {
              assertIsTrue(graph instanceof AnimationGraph);
              originalGraph = graph;
            }
            const graphEval = new AnimationGraphEval(originalGraph, this.node, this, clipOverrides);
            this._graphEval = graphEval;
          }
        }
        onDestroy() {
          var _this$_graphEval2;
          (_this$_graphEval2 = this._graphEval) == null || _this$_graphEval2.destroy();
        }
        update(deltaTime) {
          var _this$_graphEval3;
          (_this$_graphEval3 = this._graphEval) == null || _this$_graphEval3.update(deltaTime);
        }

        /**
         * @zh 获取动画图中的所有变量。
         * @en Gets all the variables in the animation graph.
         * @returns The iterator to the variables.
         * @example
         * ```ts
         * for (const [name, { type }] of animationController.getVariables()) {
         *   log(`Name: ${name}, Type: ${type}`);
         * }
         * ```
         */
        getVariables() {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getVariables();
        }

        /**
         * @zh 设置动画图实例中变量的值。
         * @en Sets the value of the variable in the animation graph instance.
         * @param name @en Variable's name. @zh 变量的名称。
         * @param value @en Variable's value. @zh 变量的值。
         * @example
         * ```ts
         * animationController.setValue('speed', 3.14);
         * animationController.setValue('crouching', true);
         * animationController.setValue('attack', true);
         * ```
         */
        setValue(name, value) {
          return this.setValue_experimental(name, value);
        }

        /**
         * @zh 设置动画图实例中变量的值。
         * @en Sets the value of the variable in the animation graph instance.
         * @param name @en Variable's name. @zh 变量的名称。
         * @param value @en Variable's value. @zh 变量的值。
         * @example
         * ```ts
         * animationController.setValue('speed', 3.14);
         * animationController.setValue('crouching', true);
         * animationController.setValue('attack', true);
         * ```
         * @experimental
         */
        setValue_experimental(name, value) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          graphEval.setValue(name, value);
        }

        /**
         * @zh 获取动画图实例中变量的值。
         * @en Gets the value of the variable in the animation graph instance.
         * @param name @en Variable's name. @zh 变量的名称。
         * @returns @en Variable's value. @zh 变量的值。
         */
        getValue(name) {
          const value = this.getValue_experimental(name);
          if (typeof value === 'object') {
            if (DEBUG) {
              warn(`Obtaining variable "${name}" is not of primitive type, ` + `which is currently supported experimentally and should be explicitly obtained through this.getValue_experimental()`);
            }
            return undefined;
          } else {
            return value;
          }
        }

        /**
         * @zh 获取动画图实例中变量的值。
         * @en Gets the value of the variable in the animation graph instance.
         * @param name @en Variable's name. @zh 变量的名称。
         * @returns @en Variable's value. @zh 变量的值。
         */
        getValue_experimental(name) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getValue(name);
        }

        /**
         * @zh 获取动画图实例中当前状态的运行状况。
         * @en Gets the running status of the current state in the animation graph instance.
         * @param layer @en Index of the layer. @zh 层级索引。
         * @returns @en The running status of the current state. `null` is returned if current state is not a motion state.
         *          @zh 当前的状态运作状态对象。如果当前的状态不是动作状态，则返回 `null`。
         */
        getCurrentStateStatus(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getCurrentStateStatus(layer);
        }

        /**
         * @zh 获取动画图实例中当前状态上包含的所有动画剪辑的运行状况。
         * @en Gets the running status of all the animation clips added on the current state in the animation graph instance.
         * @param layer @en Index of the layer. @zh 层级索引。
         * @returns @en Iterable to the animation clip statuses on current state.
         *              An empty iterable is returned if current state is not a motion state.
         *          @zh 到动画剪辑运作状态的迭代器。若当前状态不是动画状态，则返回一个空的迭代器。
         */
        getCurrentClipStatuses(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getCurrentClipStatuses(layer);
        }

        /**
         * @zh 获取动画图实例中当前正在进行的过渡的运行状况。
         * @en Gets the running status of the transition currently in progress in the animation graph instance.
         * @param layer @en Index of the layer. @zh 层级索引。
         * @returns @en Current transition status. `null` is returned in case of no transition.
         *          @zh 当前正在进行的过渡，若没有进行任何过渡，则返回 `null`。
         */
        getCurrentTransition(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getCurrentTransition(layer);
        }

        /**
         * @zh 获取动画图实例中下一个状态的运行状况。
         * @en Gets the running status of the next state in the animation graph instance.
         * @param layer @en Index of the layer. @zh 层级索引。
         * @returns @en The running status of the next state. `null` is returned in case of no transition or if next state is not a motion state.
         *          @zh 下一状态运作状态对象，若未在进行过渡或下一状态不是动画状态，则返回 `null`。
         */
        getNextStateStatus(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getNextStateStatus(layer);
        }

        /**
         * @zh 获取动画图实例中下一个状态上添加的所有动画剪辑的运行状况。
         * @en Gets the running status of all the animation clips added on the next state in the animation graph instance.
         * @param layer @en Index of the layer. @zh 层级索引。
         * @returns @en Iterable to the animation clip statuses on next state.
         *              An empty iterable is returned in case of no transition or next state is not a motion state.
         *          @zh 到下一状态上包含的动画剪辑运作状态的迭代器，若未在进行过渡或下一状态不是动画状态，则返回一个空的迭代器。
         */
        getNextClipStatuses(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getNextClipStatuses(layer);
        }

        /**
         * @zh 获取层级权重。
         * @en Gets the weight of specified layer.
         * @param layer @en Index of the layer. @zh 层级索引。
         */
        getLayerWeight(layer) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.getLayerWeight(layer);
        }

        /**
         * @zh 设置层级权重。
         * @en Sets the weight of specified layer.
         * @param layer @en Index of the layer. @zh 层级索引。
         */
        setLayerWeight(layer, weight) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          return graphEval.setLayerWeight(layer, weight);
        }

        /**
         * @zh 覆盖动画图实例中的动画剪辑。
         * 对于每一对源剪辑、目标剪辑，
         * 动画图（实例）中的出现的所有源剪辑都会被替换为目标剪辑，就好像动画图中一开始就使用的是目标剪辑。
         * 不过，动画图当前的运转状态会依然保持不变，例如：
         *
         * - 若动作状态涉及的动画剪辑被替换，动作状态的播放进度百分比依然保持不变。
         *
         * - 若过渡的周期是相对的，即使在某一刻动画过渡的源头被替换，那么过渡的进度百分比也依然保持不变。
         *
         * 不管进行多少次覆盖，源剪辑应该一直指定为原始动画图中的动画剪辑。例如：
         *
         * ```ts
         * // `originalClip` 是原始动画图中的剪辑对象，第一次希望将原剪辑覆盖为 `newClip1`，第二次希望将原剪辑覆盖为 `newClip2`
         * animationController.overrideClips_experimental(new Map([ [originalClip, newClip1] ])); // 第一次覆盖
         * animationController.overrideClips_experimental(new Map([ [newClip1, newClip2] ])); // 错误：第二次覆盖
         * animationController.overrideClips_experimental(new Map([ [originalClip, newClip2] ])); // 正确：第二次覆盖
         * ```
         * @en Overrides the animation clips in animation graph instance.
         * TODO
         * @experimental
         */
        overrideClips_experimental(overrides) {
          const {
            _graphEval: graphEval
          } = this;
          assertIsNonNullable(graphEval);
          graphEval.overrideClips(overrides);
        }

        /**
         * @zh 获取指定辅助曲线的当前值。
         * @en Gets the current value of specified auxiliary curve.
         * @param curveName @en Name of the auxiliary curve. @zh 辅助曲线的名字。
         * @returns @zh 指定辅助曲线的当前值，如果指定辅助曲线不存在或动画图为空则返回 0。
         * @en The current value of specified auxiliary curve,
         * or 0 if specified adjoint curve does not exist or if the animation graph is null.
         * @experimental
         */
        getAuxiliaryCurveValue_experimental(curveName) {
          const {
            _graphEval: graphEval
          } = this;
          if (!graphEval) {
            return 0.0;
          }
          return graphEval.getAuxiliaryCurveValue(curveName);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "graph", [_dec4, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "graph"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_graph", [serializable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});