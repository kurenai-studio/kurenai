System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-graph.js", ["../../../core/index.js", "../../../core/data/decorators/index.js", "../../define.js", "./foundation/node-shell.js", "./foundation/errors.js", "./graph-output-node.js"], function (_export, _context) {
  "use strict";

  var EditorExtendable, assertIsTrue, error, js, ccclass, serializable, CLASS_NAME_PREFIX_ANIM, PoseGraphNodeShell, AddNonFreestandingNodeError, PoseGraphOutputNode, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, PoseGraph;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      EditorExtendable = _coreIndexJs.EditorExtendable;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      error = _coreIndexJs.error;
      js = _coreIndexJs.js;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_foundationNodeShellJs) {
      PoseGraphNodeShell = _foundationNodeShellJs.PoseGraphNodeShell;
    }, function (_foundationErrorsJs) {
      AddNonFreestandingNodeError = _foundationErrorsJs.AddNonFreestandingNodeError;
    }, function (_graphOutputNodeJs) {
      PoseGraphOutputNode = _graphOutputNodeJs.PoseGraphOutputNode;
    }],
    execute: function () {
      /**
       * @zh
       * 姿势图。
       * @en
       * Pose graph.
       */
      _export("PoseGraph", PoseGraph = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseGraph`), _dec(_class = (_class2 = class PoseGraph extends EditorExtendable {
        constructor() {
          super();
          _initializerDefineProperty(this, "_outputNode", _descriptor, this);
          _initializerDefineProperty(this, "_nodes", _descriptor2, this);
          _initializerDefineProperty(this, "_shells", _descriptor3, this);
          _initializerDefineProperty(this, "_shellMap", _descriptor4, this);
          this.addNode(this._outputNode);
        }

        /**
         * @zh 姿势图的输出结点。
         * @en The pose graph's output node.
         */
        get outputNode() {
          return this._outputNode;
        }

        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive() {
          assertIsTrue(this._nodes.length === this._shells.length);
          for (let iNode = 0; iNode < this._nodes.length; ++iNode) {
            const node = this._nodes[iNode];
            const shell = this._shells[iNode];
            this._shellMap.set(node, shell);
            node.__callOnAfterDeserializeRecursive == null || node.__callOnAfterDeserializeRecursive();
          }
        }

        /**
         * @zh 获取所有结点。
         * @en Gets all nodes.
         * @returns @zh 用于遍历所有结点的迭代器。 @en The iterator to iterate all nodes.
         */
        nodes() {
          return this._nodes.values();
        }

        /**
         * @zh 添加一个结点到图中。
         * @en Adds a node into graph.
         * @param node @zh 要添加的结点。 @en Node to add.
         * @returns `node`
         *
         * @note
         * @zh 注意，要添加的结点必须是“独立”的，也就是说它不能已经在任何图中。否则会抛出异常。
         * @en Note, the node to add should be "freestanding",
         * means it should not been already in any graph. Otherwise, an exception would be thrown.
         */
        addNode(node) {
          if (this._shellMap.has(node)) {
            throw new AddNonFreestandingNodeError(node);
          }
          const shell = new PoseGraphNodeShell();
          this._shells.push(shell);
          this._nodes.push(node);
          this._shellMap.set(node, shell);
          return node;
        }

        /**
         * @zh 将指定的结点从图中移除。
         * @en Removes specified node from the graph.
         * @param removal @zh 要移除的结点。 @en The node to remove.
         *
         * @note
         * @zh 如果要移除的结点不在图中或该结点是图的输出结点，则此方法不会生效。
         * @en If the removal node is not within graph or is the output node of graph,
         * this method takes no effect.
         */
        removeNode(removal) {
          if (removal === this._outputNode) {
            error(`Can not remove the output node.`);
            return;
          }
          const nodeIndex = this._nodes.indexOf(removal);
          if (nodeIndex < 0) {
            return;
          }

          // This should be true.
          assertIsTrue(this._shellMap.has(removal));

          // Disconnect from others.
          for (const shell of this._shells) {
            shell.deleteBindingTo(removal);
          }

          // Remove from graph.
          js.array.removeAt(this._shells, nodeIndex);
          js.array.removeAt(this._nodes, nodeIndex);
          this._shellMap.delete(removal);
        }

        /**
         * @zh
         * 获取指定结点在姿势图中的外壳。
         * @en
         * Gets the specified node's shell in pose graph.
         * @internal
         */
        getShell(node) {
          return this._shellMap.get(node);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_outputNode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new PoseGraphOutputNode();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_nodes", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_shells", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_shellMap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Map();
        }
      }), _class2)) || _class));
    }
  };
});