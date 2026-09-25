System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/node-shell.js", ["../../../../core/index.js", "../../../../core/data/decorators/index.js", "../../../define.js"], function (_export, _context) {
  "use strict";

  var EditorExtendable, ccclass, serializable, CLASS_NAME_PREFIX_ANIM, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _descriptor3, _descriptor4, PoseGraphNodeShell, PoseGraphNodeInputBinding;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function isEqualNodeInputPath(lhs, rhs) {
    const [lhsPropertyKey, lhsElementIndex] = lhs;
    const [rhsPropertyKey, rhsElementIndex] = rhs;
    return lhsPropertyKey === rhsPropertyKey && lhsElementIndex === rhsElementIndex;
  }

  /**
   * @zh 描述既定结点（作为消费方）和另一结点（作为生产方）之间的绑定信息。
   * @en Describes the binding information between a given node(as consumer) and another node(as producer).
   */
  return {
    setters: [function (_coreIndexJs) {
      EditorExtendable = _coreIndexJs.EditorExtendable;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }],
    execute: function () {
      /**
       * @zh
       * 描述姿势图结点上的某项输入的路径。
       * @en
       * Describes the path to a input of a pose graph node.
       *
       * @internal Internally, the path is stored as an tuple.
       * The first element of tuple is always the input's property key.
       * There can be an optional second tuple element,
       * which represents the input's property's element, if it's an array property.
       */
      /**
       * @zh 表示姿势图结点的外壳。
       *
       * 结点外壳是附着在结点上的、对结点之间的连接（称之为绑定）的描述。
       * 外壳由姿势图以及绑定系统操纵，结点对于其外壳是无感知的。
       *
       * @en Represents the shell of a pose graph node.
       *
       * The node shell is attached to a node,
       * and describes the connections(so called binding) between nodes.
       * Shells are manipulated by pose graph and binding system.
       * Nodes are imperceptible to their shells.
       */
      _export("PoseGraphNodeShell", PoseGraphNodeShell = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseGraphNodeShell`), _dec(_class = (_class2 = class PoseGraphNodeShell extends EditorExtendable {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_bindings", _descriptor, this);
        }
        /**
         * @zh
         * 获取此结点上的所有的绑定。
         * @en
         * Gets all bindings on this node.
         * @returns @zh 绑定对象数组。 @en The binding objects array.
         */
        getBindings() {
          return this._bindings;
        }

        /**
         * @zh
         * 添加一项绑定。
         * @en
         * Adds a binding.
         * @param inputPath @zh 要绑定的输入的路径。 @en Path of the input to bind.
         * @param producer @zh 生产方结点。 @en The producer node.
         * @param outputIndex @zh 要绑定的生产方的输出索引。 @en Index of the output to bind.
         * @note
         * @zh 绑定是由三元组输入路径、生产方结点和生产方索引唯一键定的。重复的添加相同绑定没有效果。
         * @en A binding is keyed by the 3-element tuple: input path, producer node and producer output index.
         * Redundantly adding a binding takes no effect.
         */
        addBinding(inputPath, producer, outputIndex) {
          this._emplaceBinding(new PoseGraphNodeInputBinding(inputPath, producer, outputIndex));
        }

        /**
         * @zh
         * 删除指定输入上的绑定。
         * @en
         * Deletes the binding on specified input.
         * @param inputPath @zh 要解绑的输入的路径。 @en Path of the input to unbind.
         */
        deleteBinding(inputPath) {
          const index = this._findBindingIndex(inputPath);
          if (index >= 0) {
            this._bindings.splice(index, 1);
          }
        }

        /**
         * @zh
         * 更新绑定，
         * 对于具有相同属性键的、索引小于（或大于） `firstIndex` 的输入的绑定，
         * 将它们替换为上一个（或下一个）索引上的绑定。
         * @en
         * Update bindings so that
         * for the input bindings having specified property key but having element index less than the specified index,
         * substitute them as previous(or next) index's binding.
         * @param propertyKey @zh 输入的属性键。 @en The input's property key.
         * @param firstIndex @zh 见描述。 @en See description.
         * @param forward @en 替换的方向。`true` 表示向前替换，反之向后。
         *              @en Substitution direction. `true` means substitute in forward, backward otherwise.
         */
        moveArrayElementBindingForward(propertyKey, firstIndex, forward) {
          // TODO: this method has worse performance!
          const {
            _bindings: bindings
          } = this;
          const oldBindings = [];
          for (let iBinding = 0; iBinding < bindings.length;
          // Note: array length may be varied.
          ++iBinding) {
            const binding = bindings[iBinding];
            const [consumerPropertyKey, consumerElementIndex = -1] = binding.inputPath;
            if (consumerPropertyKey === propertyKey && consumerElementIndex >= firstIndex) {
              oldBindings.push(binding);
              bindings.splice(iBinding, 1);
            }
          }
          for (const oldBinding of oldBindings) {
            const [consumerPropertyKey, consumerElementIndex = -1] = oldBinding.inputPath;
            this.addBinding([consumerPropertyKey, consumerElementIndex + (forward ? -1 : 1)], oldBinding.producer, oldBinding.outputIndex);
          }
        }

        /**
         * @zh
         * 删除绑定到指定生产方结点的所有绑定。
         * @en
         * Deletes all the bindings bound to specified producer.
         * @param producer @zh 生产方结点。 @en The producer node.
         */
        deleteBindingTo(producer) {
          const {
            _bindings: bindings
          } = this;
          for (let iBinding = 0; iBinding < bindings.length;
          // Note: array length might vary
          ++iBinding) {
            const binding = bindings[iBinding];
            if (binding.producer === producer) {
              bindings.splice(iBinding, 1);
            }
          }
        }

        /**
         * @zh
         * 查找指定输入上的绑定。
         * @en
         * Finds the binding on specified input.
         * @param inputPath @zh 要查找的输入的路径。 @en Path of the input to find.
         */
        findBinding(inputPath) {
          const bindingIndex = this._findBindingIndex(inputPath);
          return bindingIndex >= 0 ? this._bindings[bindingIndex] : undefined;
        }
        _findBindingIndex(inputPath) {
          return this._bindings.findIndex(searchElement => isEqualNodeInputPath(searchElement.inputPath, inputPath));
        }
        _emplaceBinding(binding) {
          const index = this._bindings.findIndex(searchElement => isEqualNodeInputPath(searchElement.inputPath, binding.inputPath));
          if (index >= 0) {
            this._bindings[index] = binding;
          } else {
            this._bindings.push(binding);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_bindings", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      PoseGraphNodeInputBinding = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseGraphNodeInputBinding`), _dec2(_class3 = (_class4 = class PoseGraphNodeInputBinding {
        constructor(inputPath, producer, outputIndex) {
          _initializerDefineProperty(this, "_inputPath", _descriptor2, this);
          _initializerDefineProperty(this, "_producer", _descriptor3, this);
          _initializerDefineProperty(this, "_outputIndex", _descriptor4, this);
          this._inputPath = inputPath;
          this._producer = producer;
          if (typeof outputIndex !== 'undefined') {
            this._outputIndex = outputIndex;
          }
        }

        /**
         * @zh 消费方结点的输入路径。
         * @en Input path of consumer node.
         */
        get inputPath() {
          return this._inputPath;
        }

        /**
         * @zh 生产方结点。
         * @en The producer node.
         */
        get producer() {
          return this._producer;
        }

        /**
         * @zh 生产方结点的输出索引。
         * @en The producer node's output index.
         */
        get outputIndex() {
          return this._outputIndex;
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_inputPath", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_producer", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_outputIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class4)) || _class3);
    }
  };
});