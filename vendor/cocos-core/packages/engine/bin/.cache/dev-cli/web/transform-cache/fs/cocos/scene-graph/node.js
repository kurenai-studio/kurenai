System.register("q-bundled:///fs/cocos/scene-graph/node.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "./layers.js", "./node-ui-properties.js", "../core/global-exports.js", "./node-dev.js", "../core/math/index.js", "./node-enum.js", "../core/data/index.js", "../core/platform/debug.js", "./component.js", "../core/data/decorators/property.js", "../core/index.js", "./node-event.js", "./node-event-processor.js", "../2d/framework/ui-skew-utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, serializable, type, DEV, DEBUG, EDITOR, EDITOR_NOT_IN_PREVIEW, USE_UI_SKEW, NODEJS, Layers, NodeUIProperties, cclegacy, nodePolyfill, approx, EPSILON, Mat3, mat4, Mat4, quat, Quat, v3, Vec3, MobilityMode, NodeSpace, TransformBit, editorExtrasTag, serializeTag, errorID, warnID, log, getError, Component, property, CCObject, CCObjectFlags, js, NodeEventType, DispatcherEventType, NodeEventProcessor, findSkewAndGetOriginalWorldMatrix, updateLocalMatrixBySkew, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _Node, Destroying, DontDestroy, Deactivating, TRANSFORM_CHANGED, ACTIVE_CHANGED, TRANSFORM_ON, ACTIVE_ON, idGenerator, v3_a, v3_b, q_a, q_b, qt_1, m3_1, m4_1, m4_2, dirtyNodes, reserveContentsForAllSyncablePrefabTag, globalFlagChangeVersion, skewCompCount, Node;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function getConstructor(typeOrClassName) {
    if (!typeOrClassName) {
      errorID(3804);
      return null;
    }
    if (typeof typeOrClassName === 'string') {
      return js.getClassByName(typeOrClassName);
    }
    return typeOrClassName;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_virtualInternal253AconstantsJs) {
      DEV = _virtualInternal253AconstantsJs.DEV;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      USE_UI_SKEW = _virtualInternal253AconstantsJs.USE_UI_SKEW;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_layersJs) {
      Layers = _layersJs.Layers;
    }, function (_nodeUiPropertiesJs) {
      NodeUIProperties = _nodeUiPropertiesJs.NodeUIProperties;
    }, function (_coreGlobalExportsJs) {
      cclegacy = _coreGlobalExportsJs.cclegacy;
    }, function (_nodeDevJs) {
      nodePolyfill = _nodeDevJs.nodePolyfill;
    }, function (_coreMathIndexJs) {
      approx = _coreMathIndexJs.approx;
      EPSILON = _coreMathIndexJs.EPSILON;
      Mat3 = _coreMathIndexJs.Mat3;
      mat4 = _coreMathIndexJs.mat4;
      Mat4 = _coreMathIndexJs.Mat4;
      quat = _coreMathIndexJs.quat;
      Quat = _coreMathIndexJs.Quat;
      v3 = _coreMathIndexJs.v3;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_nodeEnumJs) {
      MobilityMode = _nodeEnumJs.MobilityMode;
      NodeSpace = _nodeEnumJs.NodeSpace;
      TransformBit = _nodeEnumJs.TransformBit;
    }, function (_coreDataIndexJs) {
      editorExtrasTag = _coreDataIndexJs.editorExtrasTag;
      serializeTag = _coreDataIndexJs.serializeTag;
    }, function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
      warnID = _corePlatformDebugJs.warnID;
      log = _corePlatformDebugJs.log;
      getError = _corePlatformDebugJs.getError;
    }, function (_componentJs) {
      Component = _componentJs.Component;
    }, function (_coreDataDecoratorsPropertyJs) {
      property = _coreDataDecoratorsPropertyJs.property;
    }, function (_coreIndexJs) {
      CCObject = _coreIndexJs.CCObject;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      js = _coreIndexJs.js;
    }, function (_nodeEventJs) {
      NodeEventType = _nodeEventJs.NodeEventType;
    }, function (_nodeEventProcessorJs) {
      DispatcherEventType = _nodeEventProcessorJs.DispatcherEventType;
      NodeEventProcessor = _nodeEventProcessorJs.NodeEventProcessor;
    }, function (_dFrameworkUiSkewUtilsJs) {
      findSkewAndGetOriginalWorldMatrix = _dFrameworkUiSkewUtilsJs.findSkewAndGetOriginalWorldMatrix;
      updateLocalMatrixBySkew = _dFrameworkUiSkewUtilsJs.updateLocalMatrixBySkew;
    }],
    execute: function () {
      /*
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
      Destroying = CCObjectFlags.Destroying;
      DontDestroy = CCObjectFlags.DontDestroy;
      Deactivating = CCObjectFlags.Deactivating;
      TRANSFORM_CHANGED = NodeEventType.TRANSFORM_CHANGED;
      ACTIVE_CHANGED = NodeEventType.ACTIVE_CHANGED;
      _export("TRANSFORM_ON", TRANSFORM_ON = 1 << 0);
      ACTIVE_ON = 1 << 1;
      idGenerator = new js.IDGenerator('Node');
      v3_a = v3();
      v3_b = v3();
      q_a = quat();
      q_b = quat();
      qt_1 = quat();
      m3_1 = new Mat3();
      m4_1 = mat4();
      m4_2 = mat4();
      dirtyNodes = [];
      reserveContentsForAllSyncablePrefabTag = Symbol('ReserveContentsForAllSyncablePrefab');
      globalFlagChangeVersion = 0;
      skewCompCount = 0;
      /**
       * @zh
       * 场景树中的基本节点，基本特性有：
       * * 具有层级关系
       * * 持有各类组件
       * * 维护空间变换（坐标、旋转、缩放）信息
       */
      /**
       * @en
       * Class of all entities in Cocos Creator scenes.
       * Basic functionalities include:
       * * Hierarchy management with parent and children
       * * Components management
       * * Coordinate system with position, scale, rotation in 3d space
       * @zh
       * Cocos Creator 场景中的所有节点类。
       * 基本特性有：
       * * 具有层级关系
       * * 持有各类组件
       * * 维护 3D 空间左边变换（坐标、旋转、缩放）信息
       */
      _export("Node", Node = (_dec = ccclass('cc.Node'), _dec2 = type(Vec3), _dec3 = type(MobilityMode), _dec(_class = (_class2 = (_Node = class Node extends CCObject {
        // --------------------- legacy BaseNode ---------------------
        /**
         * @en Gets all components attached to this node.
         * @zh 获取附加到此节点的所有组件。
         */
        get components() {
          return this._components;
        }

        /**
         * @en If true, the node is an persist node which won't be destroyed during scene transition.
         * If false, the node will be destroyed automatically when loading a new scene. Default is false.
         * @zh 如果为true，则该节点是一个常驻节点，不会在场景转换期间被销毁。
         * 如果为false，节点将在加载新场景时自动销毁。默认为 false。
         * @default false
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _persistNode() {
          return (this._objFlags & DontDestroy) > 0;
        }
        set _persistNode(value) {
          if (value) {
            this._objFlags |= DontDestroy;
          } else {
            this._objFlags &= ~DontDestroy;
          }
        }

        // API

        /**
         * @en Name of node.
         * @zh 该节点名称。
         */
        get name() {
          return this._name;
        }
        set name(value) {
          if (DEV && value.indexOf('/') !== -1) {
            errorID(1632);
            return;
          }
          this._name = value;
        }

        /**
         * @en The uuid for editor, will be stripped after building project.
         * @zh 主要用于编辑器的 uuid，在编辑器下可用于持久化存储，在项目构建之后将变成自增的 id。
         * @readOnly
         */
        get uuid() {
          return this._id;
        }

        /**
         * @en All children nodes.
         * @zh 节点的所有子节点。
         * @readOnly
         */
        get children() {
          return this._children; // TODO:remove as Node[]?
        }

        /**
         * @en
         * The local active state of this node.
         * Note that a Node may be inactive because a parent is not active, even if this returns true.
         * Use [[activeInHierarchy]]
         * if you want to check if the Node is actually treated as active in the scene.
         * @zh
         * 当前节点的自身激活状态。
         * 值得注意的是，一个节点的父节点如果不被激活，那么即使它自身设为激活，它仍然无法激活。
         * 如果你想检查节点在场景中实际的激活状态可以使用 [[activeInHierarchy]]
         * @default true
         */
        get active() {
          return this._active;
        }
        set active(isActive) {
          isActive = !!isActive;
          if (this._active !== isActive) {
            this._active = isActive;
            const parent = this._parent;
            if (parent) {
              const couldActiveInScene = parent._activeInHierarchy;
              if (couldActiveInScene) {
                cclegacy.director._nodeActivator.activateNode(this, isActive);
              }
            }
          }
        }

        /**
         * @engineInternal please don't use this method.
         * @mangle
         */
        _setActiveInHierarchy(v) {
          this._activeInHierarchy = v;
        }

        /**
         * @en Indicates whether this node is active in the scene.
         * @zh 表示此节点是否在场景中激活。
         */
        get activeInHierarchy() {
          return this._activeInHierarchy;
        }

        /**
          * @en The parent node
          * @zh 父节点
          */
        get parent() {
          return this._parent;
        }
        set parent(value) {
          this.setParent(value);
        }

        /**
         * @en Which scene this node belongs to.
         * @zh 此节点属于哪个场景。
         * @readonly
         */
        get scene() {
          return this._scene;
        }

        /**
         * @en The event processor of the current node, it provides EventTarget ability.
         * @zh 当前节点的事件处理器，提供 EventTarget 能力。
         * @readonly
         *
         * @deprecated since v3.4.0
         */
        get eventProcessor() {
          return this._eventProcessor;
        }

        /**
         * @internal
         */

        /**
         * Call `_updateScene` of specified node.
         * @internal
         * @param node The node.
         */
        static _setScene(node) {
          node._updateScene();
        }

        /**
         * @engineInternal
         */
        static _incSkewCompCount() {
          ++skewCompCount;
        }

        /**
         * @engineInternal
         */
        static _decSkewCompCount() {
          --skewCompCount;
        }
        static _findComponent(node, constructor) {
          const cls = constructor;
          const comps = node._components;
          // NOTE: internal rtti property
          if (cls._sealed) {
            for (let i = 0; i < comps.length; ++i) {
              const comp = comps[i];
              if (comp.constructor === constructor) {
                return comp;
              }
            }
          } else {
            for (let i = 0; i < comps.length; ++i) {
              const comp = comps[i];
              if (comp instanceof constructor) {
                return comp;
              }
            }
          }
          return null;
        }
        static _findComponents(node, constructor, components) {
          const cls = constructor;
          const comps = node._components;
          // NOTE: internal rtti property
          if (cls._sealed) {
            for (let i = 0; i < comps.length; ++i) {
              const comp = comps[i];
              if (comp.constructor === constructor) {
                components.push(comp);
              }
            }
          } else {
            for (let i = 0; i < comps.length; ++i) {
              const comp = comps[i];
              if (comp instanceof constructor) {
                components.push(comp);
              }
            }
          }
        }
        static _findChildComponent(children, constructor) {
          for (let i = 0; i < children.length; ++i) {
            const node = children[i];
            let comp = Node._findComponent(node, constructor);
            if (comp) {
              return comp;
            }
            if (node._children.length > 0) {
              comp = Node._findChildComponent(node._children, constructor);
              if (comp) {
                return comp;
              }
            }
          }
          return null;
        }
        static _findChildComponents(children, constructor, components) {
          for (let i = 0; i < children.length; ++i) {
            const node = children[i];
            Node._findComponents(node, constructor, components);
            if (node._children.length > 0) {
              Node._findChildComponents(node._children, constructor, components);
            }
          }
        }
        /**
         * NOTE: components getter is typeof ReadonlyArray
         * @engineInternal
         * @mangle
         */
        getWritableComponents() {
          return this._components;
        }
        /**
         * @engineInternal
         */
        get prefab() {
          return this._prefab;
        }
        /**
         * @engineInternal
         */
        set id(v) {
          this._id = v;
        }
        /**
         * @engineInternal
         */
        get siblingIndex() {
          return this._siblingIndex;
        }
        /**
         * @engineInternal
         */
        set siblingIndex(val) {
          this._siblingIndex = val;
        }

        /**
         * @en
         * record scene's id when set this node as persist node
         * @zh
         * 当设置节点为常驻节点时记录场景的 id
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */

        /**
         * Set `_scene` field of this node.
         * The derived `Scene` overrides this method to behavior differently.
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateScene() {
          if (this._parent == null) {
            errorID(1640, this.name, this.uuid);
          } else {
            this._scene = this._parent._scene;
          }
        }

        /**
         * @en
         * Properties configuration function.
         * All properties in attrs will be set to the node,
         * when the setter of the node is available,
         * the property will be set via setter function.
         * @zh 属性配置函数。在 attrs 的所有属性将被设置为节点属性。
         * @param attrs - Properties to be set to node
         * @example
         * ```
         * var attrs = { name: 'New Name', active: false };
         * node.attr(attrs);
         * ```
         */
        attr(attrs) {
          js.mixin(this, attrs);
        }

        /**
         * @en Get parent of the node.
         * @zh 获取该节点的父节点。
         */
        getParent() {
          return this._parent;
        }

        /**
         * As there are setter and setParent(), and both of them not just modify _parent, but have
         * other logic. So add a new function that only modify _parent value.
         * @engineInternal
         * @mangle
         */
        modifyParent(parent) {
          this._parent = parent;
        }

        /**
         * @en Set parent of the node.
         * @zh 设置该节点的父节点。
         * @param value Parent node
         * @param keepWorldTransform Whether keep node's current world transform unchanged after this operation
         */
        setParent(value, keepWorldTransform = false) {
          if (keepWorldTransform) {
            this.updateWorldTransform();
          }
          if (this._parent === value) {
            return;
          }
          const oldParent = this._parent;
          const newParent = value;
          if (DEBUG && oldParent
          // Change parent when old parent deactivating or activating
          && oldParent._objFlags & Deactivating) {
            errorID(3821);
          }
          this._parent = newParent;
          // Reset sibling index
          this._siblingIndex = 0;
          this._onSetParent(oldParent, keepWorldTransform);
          if (this.emit) {
            this.emit(NodeEventType.PARENT_CHANGED, oldParent);
          }
          if (oldParent) {
            if (!(oldParent._objFlags & Destroying)) {
              const removeAt = oldParent._children.indexOf(this);
              if (DEV && removeAt < 0) {
                errorID(1633);
                return;
              }
              oldParent._children.splice(removeAt, 1);
              oldParent._updateSiblingIndex();
              if (oldParent.emit) {
                oldParent.emit(NodeEventType.CHILD_REMOVED, this);
              }
            }
          }
          if (newParent) {
            if (DEBUG && newParent._objFlags & Deactivating) {
              errorID(3821);
            }
            newParent._children.push(this);
            this._siblingIndex = newParent._children.length - 1;
            if (newParent.emit) {
              newParent.emit(NodeEventType.CHILD_ADDED, this);
            }
          }
          this._onHierarchyChanged(oldParent);
        }

        /**
         * @en Returns a child with the same uuid.
         * @zh 通过 uuid 获取节点的子节点。
         * @param uuid - The uuid to find the child node.
         * @return a Node whose uuid equals to the input parameter
         */
        getChildByUuid(uuid) {
          if (!uuid) {
            log('Invalid uuid');
            return null;
          }
          const locChildren = this._children;
          for (let i = 0, len = locChildren.length; i < len; i++) {
            if (locChildren[i]._id === uuid) {
              return locChildren[i];
            }
          }
          return null;
        }

        /**
         * @en Returns a child with the same name.
         * @zh 通过名称获取节点的子节点。
         * @param name - A name to find the child node.
         * @return a CCNode object whose name equals to the input parameter
         * @example
         * ```
         * var child = node.getChildByName("Test Node");
         * ```
         */
        getChildByName(name) {
          if (!name) {
            log('Invalid name');
            return null;
          }
          const locChildren = this._children;
          for (let i = 0, len = locChildren.length; i < len; i++) {
            if (locChildren[i]._name === name) {
              return locChildren[i];
            }
          }
          return null;
        }

        /**
         * @en Returns a child with the given path.
         * @zh 通过路径获取节点的子节点。
         * @param path - A path to find the child node.
         * @return a Node object whose path equals to the input parameter
         * @example
         * ```
         * var child = node.getChildByPath("subNode/Test Node");
         * ```
         */
        getChildByPath(path) {
          const segments = path.split('/');
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          let lastNode = this;
          for (let i = 0; i < segments.length; ++i) {
            const segment = segments[i];
            if (segment.length === 0) {
              continue;
            }
            const next = lastNode.children.find(childNode => childNode.name === segment);
            if (!next) {
              return null;
            }
            lastNode = next;
          }
          return lastNode;
        }

        /**
         * @en Add a child to the current node.
         * @zh 添加一个子节点。
         * @param child - the child node to be added
         */
        addChild(child) {
          child.setParent(this);
        }

        /**
         * @en Inserts a child to the node at a specified index.
         * @zh 插入子节点到指定位置
         * @param child - the child node to be inserted
         * @param siblingIndex - the sibling index to place the child in
         * @example
         * ```
         * node.insertChild(child, 2);
         * ```
         */
        insertChild(child, siblingIndex) {
          child.setParent(this);
          child.setSiblingIndex(siblingIndex);
        }

        /**
         * @en Get the sibling index of the current node in its parent's children array.
         * @zh 获取当前节点在父节点的 children 数组中的位置。
         */
        getSiblingIndex() {
          return this._siblingIndex;
        }

        /**
         * @en Set the sibling index of the current node in its parent's children array.
         * @zh 设置当前节点在父节点的 children 数组中的位置。
         */
        setSiblingIndex(index) {
          if (!this._parent) {
            return;
          }
          if (this._parent._objFlags & Deactivating) {
            errorID(3821);
            return;
          }
          const siblings = this._parent._children;
          index = index >= 0 ? index : siblings.length + index;
          const oldIndex = siblings.indexOf(this);
          if (index !== oldIndex) {
            siblings.splice(oldIndex, 1);
            if (index < siblings.length) {
              siblings.splice(index, 0, this);
            } else {
              siblings.push(this);
            }
            this._parent._updateSiblingIndex();
            if (this._onSiblingIndexChanged) {
              this._onSiblingIndexChanged(index);
            }
            this._eventProcessor.onUpdatingSiblingIndex();
          }
        }

        /**
         * @en Walk though the sub children tree of the current node.
         * Each node, including the current node, in the sub tree will be visited two times,
         * before all children and after all children.
         * This function call is not recursive, it's based on stack.
         * Please don't walk any other node inside the walk process.
         * @zh 遍历该节点的子树里的所有节点并按规则执行回调函数。
         * 对子树中的所有节点，包含当前节点，会执行两次回调，preFunc 会在访问它的子节点之前调用，postFunc 会在访问所有子节点之后调用。
         * 这个函数的实现不是基于递归的，而是基于栈展开递归的方式。
         * 请不要在 walk 过程中对任何其他的节点嵌套执行 walk。
         * @param preFunc The callback to process node when reach the node for the first time
         * @param postFunc The callback to process node when re-visit the node after walked all children in its sub tree
         * @example
         * ```
         * node.walk(function (target) {
         *     console.log('Walked through node ' + target.name + ' for the first time');
         * }, function (target) {
         *     console.log('Walked through node ' + target.name + ' after walked all children in its sub tree');
         * });
         * ```
         */
        walk(preFunc, postFunc) {
          let index = 1;
          let children = null;
          let curr = null;
          let i = 0;
          let stack = Node._stacks[Node._stackId];
          if (!stack) {
            stack = [];
            Node._stacks.push(stack);
          }
          Node._stackId++;
          stack.length = 0;
          stack[0] = this;
          let parent = null;
          let afterChildren = false;
          while (index) {
            index--;
            curr = stack[index];
            if (!curr) {
              continue;
            }
            if (!afterChildren && preFunc) {
              // pre call
              preFunc(curr);
            } else if (afterChildren && postFunc) {
              // post call
              postFunc(curr);
            }

            // Avoid memory leak
            stack[index] = null;
            // Do not repeatedly visit child tree, just do post call and continue walk
            if (afterChildren) {
              if (parent === this._parent) break;
              afterChildren = false;
            } else {
              // Children not proceeded and has children, proceed to child tree
              if (curr._children.length > 0) {
                parent = curr;
                children = curr._children;
                i = 0;
                stack[index] = children[i];
                index++;
              } else {
                stack[index] = curr;
                index++;
                afterChildren = true;
              }
              continue;
            }
            // curr has no sub tree, so look into the siblings in parent children
            if (children) {
              i++;
              // Proceed to next sibling in parent children
              if (children[i]) {
                stack[index] = children[i];
                index++;
              } else if (parent) {
                stack[index] = parent;
                index++;
                // Setup parent walk env
                afterChildren = true;
                if (parent._parent) {
                  children = parent._parent._children;
                  i = children.indexOf(parent);
                  parent = parent._parent;
                } else {
                  // At root
                  parent = null;
                  children = null;
                }

                // ERROR
                if (i < 0) {
                  break;
                }
              }
            }
          }
          stack.length = 0;
          Node._stackId--;
        }

        /**
         * @en
         * Remove itself from its parent node.
         * If the node have no parent, then nothing happens.
         * @zh
         * 从父节点中删除该节点。
         * 如果这个节点是一个孤立节点，那么什么都不会发生。
         */
        removeFromParent() {
          if (this._parent) {
            this._parent.removeChild(this);
          }
        }

        /**
         * @en Removes a child from the container.
         * @zh 移除节点中指定的子节点。
         * @param child - The child node which will be removed.
         */
        removeChild(child) {
          if (this._children.indexOf(child) > -1) {
            // invoke the parent setter
            child.parent = null;
          }
        }

        /**
         * @en Removes all children from the container.
         * @zh 移除节点所有的子节点。
         */
        removeAllChildren() {
          // not using detachChild improves speed here
          const children = this._children;
          for (let i = children.length - 1; i >= 0; i--) {
            const node = children[i];
            if (node) {
              node.parent = null;
            }
          }
          this._children.length = 0;
        }

        /**
         * @en Is this node a child of the given node?
         * @zh 是否是指定节点的子节点？
         * @return True if this node is a child, deep child or identical to the given node.
         */
        isChildOf(parent) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          let child = this;
          do {
            if (child === parent) {
              return true;
            }
            child = child._parent;
          } while (child);
          return false;
        }

        // COMPONENT

        /**
         * @en
         * Returns the component of supplied type if the node has one attached, null if it doesn't.
         * You can also get component in the node by passing in the name of the script.
         * @zh
         * 获取节点上指定类型的组件，如果节点有附加指定类型的组件，则返回，如果没有则为空。
         * 传入参数也可以是脚本的名称。
         * @param classConstructor The class of the target component
         * @example
         * ```
         * // get sprite component.
         * var sprite = node.getComponent(Sprite);
         * ```
         */

        /**
         * @en
         * Returns the component of supplied type if the node has one attached, null if it doesn't.
         * You can also get component in the node by passing in the name of the script.
         * @zh
         * 获取节点上指定类型的组件，如果节点有附加指定类型的组件，则返回，如果没有则为空。
         * 传入参数也可以是脚本的名称。
         * @param className The class name of the target component
         * @example
         * ```
         * // get custom test class.
         * var test = node.getComponent("Test") as Test | null;
         * ```
         */

        /**
         * @en
         * Returns the component of supplied type if the node has one attached, null if it doesn't.
         * You can also get component in the node by passing in the name of the script.
         * @zh
         * 获取节点上指定类型的组件，如果节点有附加指定类型的组件，则返回，如果没有则为空。
         * 传入参数也可以是脚本的名称。
         * @param className The class name of the target component
         * @example
         * ```
         * // get custom test class.
         * var test = node.getComponent<Test>("Test");
         * ```
         */

        getComponent(typeOrClassName) {
          const constructor = getConstructor(typeOrClassName);
          if (constructor) {
            return Node._findComponent(this, constructor);
          }
          return null;
        }

        /**
         * @en Returns all components of given type in the node.
         * @zh 返回节点上指定类型的所有组件。
         * @param classConstructor The class of the target component
         */

        /**
         * @en Returns all components of given type in the node.
         * @zh 返回节点上指定类型的所有组件。
         * @param className The class name of the target component
         * @example
         * ```
         * var test = node.getComponents('Test') as Test[];
         * ```
         */

        /**
         * @en Returns all components of given type in the node.
         * @zh 返回节点上指定类型的所有组件。
         * @param className The class name of the target component
         * @example
         * ```
         * var test = node.getComponents<Test>('Test');
         * ```
         */

        getComponents(typeOrClassName) {
          const constructor = getConstructor(typeOrClassName);
          const components = [];
          if (constructor) {
            Node._findComponents(this, constructor, components);
          }
          return components;
        }

        /**
         * @en Returns the component of given type in any of its children using depth first search.
         * @zh 递归查找所有子节点中第一个匹配指定类型的组件。
         * @param classConstructor The class of the target component
         * @example
         * ```
         * var sprite = node.getComponentInChildren(Sprite);
         * ```
         */

        /**
         * @en Returns the component of given type in any of its children using depth first search.
         * @zh 递归查找所有子节点中第一个匹配指定类型的组件。
         * @param className The class name of the target component
         * @example
         * ```
         * var test = node.getComponentInChildren("Test") as Test | null;
         * ```
         */

        /**
         * @en Returns the component of given type in any of its children using depth first search.
         * @zh 递归查找所有子节点中第一个匹配指定类型的组件。
         * @param className The class name of the target component
         * @example
         * ```
         * var test = node.getComponentInChildren<Test>("Test");
         * ```
         */

        getComponentInChildren(typeOrClassName) {
          const constructor = getConstructor(typeOrClassName);
          if (constructor) {
            return Node._findChildComponent(this._children, constructor);
          }
          return null;
        }

        /**
         * @en Returns all components of given type in self or any of its children.
         * @zh 递归查找自身或所有子节点中指定类型的组件
         * @param classConstructor The class of the target component
         * @example
         * ```
         * var sprites = node.getComponentsInChildren(Sprite);
         * ```
         */

        /**
         * @en Returns all components of given type in self or any of its children.
         * @zh 递归查找自身或所有子节点中指定类型的组件
         * @param className The class name of the target component
         * @example
         * ```
         * var tests = node.getComponentsInChildren("Test") as Test[];
         * ```
         */

        /**
         * @en Returns all components of given type in self or any of its children.
         * @zh 递归查找自身或所有子节点中指定类型的组件
         * @param className The class name of the target component
         * @example
         * ```
         * var tests = node.getComponentsInChildren<Test>("Test");
         * ```
         */

        getComponentsInChildren(typeOrClassName) {
          const constructor = getConstructor(typeOrClassName);
          const components = [];
          if (constructor) {
            Node._findComponents(this, constructor, components);
            Node._findChildComponents(this._children, constructor, components);
          }
          return components;
        }

        /**
         * @en Adds a component class to the node. You can also add component to node by passing in the name of the script.
         * @zh 向节点添加一个指定类型的组件类，你还可以通过传入脚本的名称来添加组件。
         * @param classConstructor The class of the component to add
         * @throws `TypeError` if the `classConstructor` does not specify a cc-class constructor extending the `Component`.
         * @example
         * ```
         * var sprite = node.addComponent(Sprite);
         * ```
         */

        /**
         * @en Adds a component class to the node. You can also add component to node by passing in the name of the script.
         * @zh 向节点添加一个指定类型的组件类，你还可以通过传入脚本的名称来添加组件。
         * @param className The class name of the component to add
         * @throws `TypeError` if the `className` does not specify a cc-class constructor extending the `Component`.
         * @example
         * ```
         * var test = node.addComponent("Test") as Test;
         * ```
         */

        /**
         * @en Adds a component class to the node. You can also add component to node by passing in the name of the script.
         * @zh 向节点添加一个指定类型的组件类，你还可以通过传入脚本的名称来添加组件。
         * @param className The class name of the component to add
         * @throws `TypeError` if the `className` does not specify a cc-class constructor extending the `Component`.
         * @example
         * ```
         * var test = node.addComponent<Test>("Test");
         * ```
         */

        addComponent(typeOrClassName) {
          if (EDITOR && this._objFlags & Destroying) {
            throw Error('isDestroying');
          }

          // get component

          let constructor;
          if (typeof typeOrClassName === 'string') {
            constructor = js.getClassByName(typeOrClassName);
            if (!constructor) {
              if (cclegacy._RF.peek()) {
                errorID(3808, typeOrClassName);
              }
              throw TypeError(getError(3807, typeOrClassName));
            }
          } else {
            if (!typeOrClassName) {
              throw TypeError(getError(3804));
            }
            constructor = typeOrClassName;
          }

          // check component

          if (typeof constructor !== 'function') {
            throw TypeError(getError(3809));
          }
          if (!js.isChildClassOf(constructor, cclegacy.Component)) {
            throw TypeError(getError(3810));
          }
          if ((EDITOR || NODEJS) && constructor._disallowMultiple) {
            this._checkMultipleComp(constructor);
          }

          // check requirement

          const reqComps = constructor._requireComponent;
          if (reqComps) {
            // FIXME: why it can be array here?
            if (Array.isArray(reqComps)) {
              for (let i = 0; i < reqComps.length; i++) {
                const reqComp = reqComps[i];
                if (!this.getComponent(reqComp)) {
                  this.addComponent(reqComp);
                }
              }
            } else {
              const reqComp = reqComps;
              if (!this.getComponent(reqComp)) {
                this.addComponent(reqComp);
              }
            }
          }

          /// / check conflict
          //
          // if (EDITOR && !_Scene.DetectConflict.beforeAddComponent(this, constructor)) {
          //    return null;
          // }

          //

          const component = new constructor();
          component.node = this; // TODO: HACK here
          this._components.push(component);
          if ((EDITOR || NODEJS) && EditorExtends.Node && EditorExtends.Component) {
            const node = EditorExtends.Node.getNode(this._id);
            if (node) {
              EditorExtends.Component.add(component._id, component);
            }
          }
          this.emit(NodeEventType.COMPONENT_ADDED, component);
          if (this._activeInHierarchy) {
            cclegacy.director._nodeActivator.activateComp(component);
          }
          if (EDITOR_NOT_IN_PREVIEW) {
            component.resetInEditor == null || component.resetInEditor();
          }
          return component;
        }

        /**
         * @en
         * Removes a component identified by the given name or removes the component object given.
         * You can also use component.destroy() if you already have the reference.
         * @zh
         * 删除节点上的指定组件，传入参数可以是一个组件构造函数或组件名，也可以是已经获得的组件引用。
         * 如果你已经获得组件引用，你也可以直接调用 component.destroy()
         * @param classConstructor The class of the component to remove
         * @deprecated please destroy the component to remove it.
         * @example
         * ```
         * node.removeComponent(Sprite);
         * ```
         */

        /**
         * @en
         * Removes a component identified by the given name or removes the component object given.
         * You can also use component.destroy() if you already have the reference.
         * @zh
         * 删除节点上的指定组件，传入参数可以是一个组件构造函数或组件名，也可以是已经获得的组件引用。
         * 如果你已经获得组件引用，你也可以直接调用 component.destroy()
         * @param classNameOrInstance The class name of the component to remove or the component instance to be removed
         * @deprecated please destroy the component to remove it.
         * @example
         * ```
         * import { Sprite } from 'cc';
         * const sprite = node.getComponent(Sprite);
         * if (sprite) {
         *     node.removeComponent(sprite);
         * }
         * node.removeComponent('Sprite');
         * ```
         */

        removeComponent(component) {
          if (!component) {
            errorID(3813);
            return;
          }
          let componentInstance = null;
          if (component instanceof Component) {
            componentInstance = component;
          } else {
            // "component as string": Just make eslint happy.
            componentInstance = this.getComponent(component);
          }
          if (componentInstance) {
            componentInstance.destroy();
          }
        }

        // EVENT PROCESSING

        /**
         * @en
         * Register a callback of a specific event type on Node.
         * Use this method to register touch or mouse event permit propagation based on scene graph,
         * These kinds of event are triggered with dispatchEvent, the dispatch process has three steps:
         * 1. Capturing phase: dispatch in capture targets, e.g. parents in node tree, from root to the real target
         * 2. At target phase: dispatch to the listeners of the real target
         * 3. Bubbling phase: dispatch in bubble targets, e.g. parents in node tree, from the real target to root
         * In any moment of the dispatching process, it can be stopped via `event.stopPropagation()` or `event.stopPropagationImmediate()`.
         * You can also register custom event and use `emit` to trigger custom event on Node.
         * For such events, there won't be capturing and bubbling phase,
         * your event will be dispatched directly to its listeners registered on the same node.
         * You can also pass event callback parameters with `emit` by passing parameters after `type`.
         * @zh
         * 在节点上注册指定类型的回调函数，也可以设置 target 用于绑定响应函数的 this 对象。
         * 鼠标或触摸事件会被系统调用 dispatchEvent 方法触发，触发的过程包含三个阶段：
         * 1. 捕获阶段：派发事件给捕获目标，比如，节点树中注册了捕获阶段的父节点，从根节点开始派发直到目标节点。
         * 2. 目标阶段：派发给目标节点的监听器。
         * 3. 冒泡阶段：派发事件给冒泡目标，比如，节点树中注册了冒泡阶段的父节点，从目标节点开始派发直到根节点。
         * 同时您可以将事件派发到父节点或者通过调用 stopPropagation 拦截它。
         * 你也可以注册自定义事件到节点上，并通过 emit 方法触发此类事件，对于这类事件，不会发生捕获冒泡阶段，只会直接派发给注册在该节点上的监听器
         * 你可以通过在 emit 方法调用时在 type 之后传递额外的参数作为事件回调的参数列表
         * @param type - A string representing the event type to listen for.<br>See [[Node.EventType.POSITION_CHANGED]] for all builtin events.
         * @param callback - The callback that will be invoked when the event is dispatched.
         * The callback is ignored if it is a duplicate (the callbacks are unique).
         * @param target - The target (this object) to invoke the callback, can be null
         * @param useCapture - When set to true, the listener will be triggered at capturing phase which is ahead of the final target emit,
         * otherwise it will be triggered during bubbling phase.
         * @return - Just returns the incoming callback so you can save the anonymous function easier.
         * @example
         * ```ts
         * this.node.on(NodeEventType.TOUCH_START, this.memberFunction, this);  // if "this" is component and the "memberFunction" declared in CCClass.
         * node.on(NodeEventType.TOUCH_START, callback, this);
         * node.on(NodeEventType.TOUCH_MOVE, callback, this);
         * node.on(NodeEventType.TOUCH_END, callback, this);
         * ```
         */
        on(type, callback, target, useCapture = false) {
          switch (type) {
            case TRANSFORM_CHANGED:
              this._eventMask |= TRANSFORM_ON;
              break;
            case ACTIVE_CHANGED:
              this._eventMask |= ACTIVE_ON;
              break;
            default:
              break;
          }
          this._eventProcessor.on(type, callback, target, useCapture);
        }

        /**
         * @en
         * Removes the callback previously registered with the same type, callback, target and or useCapture.
         * This method is merely an alias to removeEventListener.
         * @zh 删除之前与同类型，回调，目标或 useCapture 注册的回调。
         * @param type - A string representing the event type being removed.
         * @param callback - The callback to remove.
         * @param target - The target (this object) to invoke the callback, if it's not given, only callback without target will be removed
         * @param useCapture - When set to true, the listener will be triggered at capturing phase
         * which is ahead of the final target emit, otherwise it will be triggered during bubbling phase.
         * @example
         * ```ts
         * this.node.off(NodeEventType.TOUCH_START, this.memberFunction, this);
         * node.off(NodeEventType.TOUCH_START, callback, this.node);
         * ```
         */
        off(type, callback, target, useCapture = false) {
          this._eventProcessor.off(type, callback, target, useCapture);
          const hasListeners = this._eventProcessor.hasEventListener(type);
          // All listener removed
          if (!hasListeners) {
            switch (type) {
              case TRANSFORM_CHANGED:
                this._eventMask &= ~TRANSFORM_ON;
                break;
              case ACTIVE_CHANGED:
                this._eventMask &= ~ACTIVE_ON;
                break;
              default:
                break;
            }
          }
        }

        /**
         * @en
         * Register an callback of a specific event type on the Node,
         * the callback will remove itself after the first time it is triggered.
         * @zh
         * 注册节点的特定事件类型回调，回调会在第一时间被触发后删除自身。
         *
         * @param type - A string representing the event type to listen for.
         * @param callback - The callback that will be invoked when the event is dispatched.
         *                              The callback is ignored if it is a duplicate (the callbacks are unique).
         * @param target - The target (this object) to invoke the callback, can be null
         */
        once(type, callback, target, useCapture) {
          this._eventProcessor.once(type, callback, target, useCapture);
        }

        /**
         * @en
         * Trigger an event directly with the event name and necessary arguments.
         * @zh
         * 通过事件名发送自定义事件
         * @param type - event type
         * @param arg1 - First argument in callback
         * @param arg2 - Second argument in callback
         * @param arg3 - Third argument in callback
         * @param arg4 - Fourth argument in callback
         * @param arg5 - Fifth argument in callback
         * @example
         * ```ts
         * eventTarget.emit('fire', event);
         * eventTarget.emit('fire', message, emitter);
         * ```
         */
        emit(type, arg0, arg1, arg2, arg3, arg4) {
          this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
        }

        /**
         * @en
         * Dispatches an event into the event flow.
         * The event target is the EventTarget object upon which the dispatchEvent() method is called.
         * @zh 分发事件到事件流中。
         * @param event - The Event object that is dispatched into the event flow
         */
        dispatchEvent(event) {
          this._eventProcessor.dispatchEvent(event);
        }

        /**
         * @en Checks whether the EventTarget object has any callback registered for a specific type of event.
         * @zh 检查事件目标对象是否有为特定类型的事件注册的回调。
         * @param type - The type of event.
         * @param callback - The callback function of the event listener, if absent all event listeners for the given type will be removed
         * @param target - The callback callee of the event listener
         * @return True if a callback of the specified type is registered; false otherwise.
         */
        hasEventListener(type, callback, target) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._eventProcessor.hasEventListener(type, callback, target);
        }

        /**
         * @en Removes all callbacks previously registered with the same target.
         * @zh 移除目标上的所有注册事件。
         * @param target - The target to be searched for all related callbacks
         */
        targetOff(target) {
          this._eventProcessor.targetOff(target);
          // Check for event mask reset
          if (this._eventMask & TRANSFORM_ON && !this._eventProcessor.hasEventListener(TRANSFORM_CHANGED)) {
            this._eventMask &= ~TRANSFORM_ON;
          }
          if (this._eventMask & ACTIVE_ON && !this._eventProcessor.hasEventListener(ACTIVE_CHANGED)) {
            this._eventMask &= ~ACTIVE_ON;
          }
        }
        destroy() {
          if (super.destroy()) {
            this.active = false;
            return true;
          }
          return false;
        }

        /**
         * @en
         * Destroy all children from the node, and release all their own references to other objects.
         * Actual destruct operation will delayed until before rendering.
         * @zh
         * 销毁所有子节点，并释放所有它们对其它对象的引用。
         * 实际销毁操作会延迟到当前帧渲染前执行。
         */
        destroyAllChildren() {
          const children = this._children;
          for (let i = 0; i < children.length; ++i) {
            children[i].destroy();
          }
        }

        /**
         * Do remove component, only used internally.
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _removeComponent(component) {
          if (!component) {
            errorID(3814);
            return;
          }
          if (!(this._objFlags & Destroying)) {
            const i = this._components.indexOf(component);
            if (i !== -1) {
              this._components.splice(i, 1);
              if ((EDITOR || NODEJS) && EditorExtends.Component) {
                EditorExtends.Component.remove(component._id);
              }
              this.emit(NodeEventType.COMPONENT_REMOVED, component);
            } else if (component.node !== this) {
              errorID(3815);
            }
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateSiblingIndex() {
          for (let i = 0; i < this._children.length; ++i) {
            this._children[i]._siblingIndex = i;
          }
          this.emit(NodeEventType.CHILDREN_ORDER_CHANGED);
        }

        /**
         * @dontmangle
         * NOTE: the protected method `_instantiate` is invoked by dynamically without type information.
         * See `instantiate` in cocos/serialization/instantiate.ts.
         * ```ts
         * clone = original._instantiate(null, true); // original is any, so _instantiate should not be mangled.
         * ```
         */
        _instantiate(cloned, isSyncedNode = false) {
          if (!cloned) {
            cloned = cclegacy.instantiate._clone(this, this);
          }
          const newPrefabInfo = cloned._prefab;
          if ((EDITOR || NODEJS) && newPrefabInfo) {
            if (cloned === newPrefabInfo.root) {
              // when instantiate prefab in Editor,should add prefab instance info for root node
              EditorExtends.PrefabUtils.addPrefabInstance == null || EditorExtends.PrefabUtils.addPrefabInstance(cloned);
              // newPrefabInfo.fileId = '';
            } else {
              // var PrefabUtils = Editor.require('scene://utils/prefab');
              // PrefabUtils.unlinkPrefab(cloned);
            }
          }

          // reset and init
          cloned._parent = null;
          cloned._onBatchCreated(isSyncedNode);
          return cloned;
        }
        _onHierarchyChangedBase(oldParent) {
          const newParent = this._parent;
          if (this._persistNode && !(newParent instanceof cclegacy.Scene)) {
            cclegacy.game.removePersistRootNode(this);
            if (EDITOR) {
              warnID(1623);
            }
          }
          if (EDITOR || NODEJS) {
            const scene = cclegacy.director.getScene();
            const inCurrentSceneBefore = oldParent && oldParent.isChildOf(scene);
            const inCurrentSceneNow = newParent && newParent.isChildOf(scene);
            if (!inCurrentSceneBefore && inCurrentSceneNow) {
              // attached
              // TODO: `_registerIfAttached` is injected property
              // issue: https://github.com/cocos/cocos-engine/issues/14643
              this._registerIfAttached(true);
            } else if (inCurrentSceneBefore && !inCurrentSceneNow) {
              // detached
              // TODO: `_registerIfAttached` is injected property
              // issue: https://github.com/cocos/cocos-engine/issues/14643
              this._registerIfAttached(false);
            }

            // conflict detection
            // _Scene.DetectConflict.afterAddChild(this);
          }
          const shouldActiveNow = this._active && !!(newParent && newParent._activeInHierarchy);
          if (this._activeInHierarchy !== shouldActiveNow) {
            cclegacy.director._nodeActivator.activateNode(this, shouldActiveNow);
          }
        }
        _onPreDestroyBase() {
          // marked as destroying
          this._objFlags |= Destroying;

          // detach self and children from editor
          const parent = this._parent;
          const destroyByParent = !!parent && (parent._objFlags & Destroying) !== 0;
          if (!destroyByParent && (EDITOR || NODEJS)) {
            // TODO: `_registerIfAttached` is injected property
            // issue: https://github.com/cocos/cocos-engine/issues/14643
            this._registerIfAttached(false);
          }

          // remove from persist
          if (this._persistNode) {
            cclegacy.game.removePersistRootNode(this);
          }
          if (!destroyByParent) {
            // remove from parent
            if (parent) {
              this.emit(NodeEventType.PARENT_CHANGED, this);
              // During destroy process, sibling index is not reliable
              const childIndex = parent._children.indexOf(this);
              parent._children.splice(childIndex, 1);
              this._siblingIndex = 0;
              parent._updateSiblingIndex();
              if (parent.emit) {
                parent.emit(NodeEventType.CHILD_REMOVED, this);
              }
            }
          }

          // emit node destroy event (this should before event processor destroy)
          this.emit(NodeEventType.NODE_DESTROYED, this);

          // Destroy node event processor
          this._eventProcessor.destroy();

          // destroy children
          const children = this._children;
          for (let i = 0; i < children.length; ++i) {
            // destroy immediate so its _onPreDestroy can be called
            children[i]._destroyImmediate();
          }

          // destroy self components
          const comps = this._components;
          for (let i = 0; i < comps.length; ++i) {
            // destroy immediate so its _onPreDestroy can be called
            // TO DO
            comps[i]._destroyImmediate();
          }
          return destroyByParent;
        }

        /**
         * @en
         * Ensures that this node has already had the specified component(s). If not, this method throws.
         * @zh
         * 检查节点已经包含对应的组件，如果没有，则抛出异常
         * @param constructor Constructor of the component.
         * @throws If one or more component of same type have been existed in this node.
         */

        // ---------------------- Node ------------------------
        /**
         * @en Event types emitted by Node
         * @zh 节点可能发出的事件类型
         */

        constructor(name) {
          if (name === undefined) name = 'New Node';
          super(name);
          _initializerDefineProperty(this, "_parent", _descriptor, this);
          _initializerDefineProperty(this, "_children", _descriptor2, this);
          _initializerDefineProperty(this, "_active", _descriptor3, this);
          _initializerDefineProperty(this, "_components", _descriptor4, this);
          /**
           * TODO(PP_Pro): this property should be exported to editor only, we should support editorOnly tag.
           * Tracking issue: https://github.com/cocos/cocos-engine/issues/14613
           */
          _initializerDefineProperty(this, "_prefab", _descriptor5, this);
          this._scene = null;
          this._activeInHierarchy = false;
          this._id = idGenerator.getNewId();
          this._eventProcessor = new NodeEventProcessor(this);
          /**
           * @dontmangle Ensure _eventMask not to be mangled since it is visited by UISkew._updateNodeTransformFlags with 'any' conversion.
           */
          this._eventMask = 0;
          this._siblingIndex = 0;
          this._originalSceneId = '';
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._uiProps = new NodeUIProperties(this);
          /**
           * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
           */
          this._static = false;
          // local transform
          _initializerDefineProperty(this, "_lpos", _descriptor6, this);
          _initializerDefineProperty(this, "_lrot", _descriptor7, this);
          _initializerDefineProperty(this, "_lscale", _descriptor8, this);
          _initializerDefineProperty(this, "_mobility", _descriptor9, this);
          _initializerDefineProperty(this, "_layer", _descriptor0, this);
          // the layer this node belongs to
          // local rotation in euler angles, maintained here so that rotation angles could be greater than 360 degree.
          _initializerDefineProperty(this, "_euler", _descriptor1, this);
          this._transformFlags = TransformBit.TRS | TransformBit.SKEW;
          // does the world transform need to update?
          this._eulerDirty = false;
          this._flagChangeVersion = 0;
          this._hasChangedFlags = 0;
          this._pos = new Vec3();
          this._rot = new Quat();
          this._scale = new Vec3(1, 1, 1);
          this._mat = new Mat4();
        }

        /**
         * @en Determine whether the given object is a normal Node. Will return false if [[Scene]] given.
         * @zh 指定对象是否是普通的节点？如果传入 [[Scene]] 会返回 false。
         */
        static isNode(obj) {
          return obj instanceof Node && (obj.constructor === Node || !(obj instanceof cclegacy.Scene));
        }
        _onPreDestroy() {
          return this._onPreDestroyBase();
        }

        /**
         * @en Position in local coordinate system
         * @zh 本地坐标系下的坐标
         */
        // @constget
        get position() {
          return this._lpos;
        }
        set position(val) {
          this.setPosition(val);
        }

        /**
         * @en Get x axis value in local coordinate system
         * @zh 获取本地 x 轴坐标分量
         */
        get x() {
          return this._lpos.x;
        }

        /**
         * @en Set x axis value in local coordinate system
         * @zh 设置本地 x 轴坐标分量
         */
        set x(val) {
          this.setPosition(val, this._lpos.y, this._lpos.z);
        }

        /**
         * @en Get y axis value in local coordinate system
         * @zh 获取本地 y 轴坐标分量
         */
        get y() {
          return this._lpos.y;
        }

        /**
         * @en Set y axis value in local coordinate system
         * @zh 设置本地 y 轴坐标分量
         */
        set y(val) {
          this.setPosition(this._lpos.x, val, this._lpos.z);
        }

        /**
         * @en Get z axis value in local coordinate system
         * @zh 获取本地 z 轴坐标分量
         */
        get z() {
          return this._lpos.z;
        }

        /**
         * @en Set z axis value in local coordinate system
         * @zh 设置本地 z 轴坐标分量
         */
        set z(val) {
          this.setPosition(this._lpos.x, this._lpos.y, val);
        }

        /**
         * @en Position in world coordinate system
         * @zh 世界坐标系下的坐标
         */
        // @constget
        get worldPosition() {
          this.updateWorldTransform();
          return this._pos;
        }
        set worldPosition(val) {
          this.setWorldPosition(val);
        }

        /**
         * @en Get x axis value in world coordinate system
         * @zh 获取世界坐标 x 轴分量
         */
        get worldPositionX() {
          this.updateWorldTransform();
          return this._pos.x;
        }

        /**
         * @en Set x axis value in world coordinate system
         * @zh 设置世界坐标 x 轴分量
         */
        set worldPositionX(val) {
          this.setWorldPosition(val, this._pos.y, this._pos.z);
        }

        /**
         * @en Get y axis value in world coordinate system
         * @zh 获取世界坐标 y 轴分量
         */
        get worldPositionY() {
          this.updateWorldTransform();
          return this._pos.y;
        }

        /**
         * @en Set y axis value in world coordinate system
         * @zh 设置世界坐标 y 轴分量
         */
        set worldPositionY(val) {
          this.setWorldPosition(this._pos.x, val, this._pos.z);
        }

        /**
         * @en Get z axis value in world coordinate system
         * @zh 获取世界坐标 z 轴分量
         */
        get worldPositionZ() {
          this.updateWorldTransform();
          return this._pos.z;
        }

        /**
         * @en Set z axis value in world coordinate system
         * @zh 设置世界坐标 z 轴分量
         */
        set worldPositionZ(val) {
          this.setWorldPosition(this._pos.x, this._pos.y, val);
        }

        /**
         * @en Rotation in local coordinate system, represented by a quaternion
         * @zh 本地坐标系下的旋转，用四元数表示
         */
        // @constget
        get rotation() {
          return this._lrot;
        }
        set rotation(val) {
          this.setRotation(val);
        }

        /**
         * @en Rotation in local coordinate system, represented by euler angles
         * @zh 本地坐标系下的旋转，用欧拉角表示
         */
        set eulerAngles(val) {
          this.setRotationFromEuler(val.x, val.y, val.z);
        }
        get eulerAngles() {
          if (this._eulerDirty) {
            Quat.toEuler(this._euler, this._lrot);
            this._eulerDirty = false;
          }
          return this._euler;
        }

        /**
         * @en Rotation in local coordinate system, represented by euler angles, but limited on z axis
         * @zh 本地坐标系下的旋转，用欧拉角表示，但是限定在 z 轴上。
         */
        get angle() {
          return this.eulerAngles.z;
        }
        set angle(val) {
          Vec3.set(this._euler, 0, 0, val);
          Quat.fromAngleZ(this._lrot, val);
          this._eulerDirty = false;
          this.invalidateChildren(TransformBit.ROTATION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.ROTATION);
          }
        }

        /**
         * @en Rotation in world coordinate system, represented by a quaternion
         * @zh 世界坐标系下的旋转，用四元数表示
         */
        // @constget
        get worldRotation() {
          this.updateWorldTransform();
          return this._rot;
        }
        set worldRotation(val) {
          this.setWorldRotation(val);
        }

        /**
         * @en Scale in local coordinate system
         * @zh 本地坐标系下的缩放
         */
        // @constget
        get scale() {
          return this._lscale;
        }
        set scale(val) {
          this.setScale(val);
        }

        /**
         * @en Scale in world coordinate system
         * @zh 世界坐标系下的缩放
         */
        // @constget
        get worldScale() {
          this.updateWorldTransform();
          return this._scale;
        }
        set worldScale(val) {
          this.setWorldScale(val);
        }

        /**
         * @en Local transformation matrix
         * @zh 本地坐标系变换矩阵
         */
        set matrix(val) {
          Mat4.toSRT(val, this._lrot, this._lpos, this._lscale);
          this.invalidateChildren(TransformBit.TRS);
          this._eulerDirty = true;
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.TRS);
          }
        }

        /**
         * @en World transformation matrix
         * @zh 世界坐标系变换矩阵
         */
        // @constget
        get worldMatrix() {
          this.updateWorldTransform();
          return this._mat;
        }

        /**
         * @en The vector representing forward direction in local coordinate system, it's the minus z direction by default
         * @zh 当前节点面向的前方方向，默认前方为 -z 方向
         */
        get forward() {
          return Vec3.transformQuat(new Vec3(), Vec3.FORWARD, this.worldRotation);
        }
        set forward(dir) {
          const len = dir.length();
          Vec3.multiplyScalar(v3_a, dir, -1 / len);
          Quat.fromViewUp(q_a, v3_a);
          this.setWorldRotation(q_a);
        }

        /**
         * @en Return the up direction vertor of this node in world space.
         * @zh 返回当前节点在世界空间中朝上的方向向量
         */
        get up() {
          return Vec3.transformQuat(new Vec3(), Vec3.UP, this.worldRotation);
        }

        /**
         * @en Return the right direction vector of this node in world space.
         * @zh 返回当前节点在世界空间中朝右的方向向量
         */
        get right() {
          return Vec3.transformQuat(new Vec3(), Vec3.RIGHT, this.worldRotation);
        }
        set mobility(m) {
          if (this._mobility === m) {
            return;
          }
          this._mobility = m;
          this.emit(NodeEventType.MOBILITY_CHANGED);
        }
        get mobility() {
          return this._mobility;
        }

        /**
         * @en Layer of the current Node, it affects raycast, physics etc, refer to [[Layers]]
         * @zh 节点所属层，主要影响射线检测、物理碰撞等，参考 [[Layers]]
         */
        set layer(l) {
          const self = this;
          if (self._layer === l) {
            return;
          }
          self._layer = l;
          const uiComp = self._uiProps && self._uiProps.uiComp;
          if (uiComp) {
            uiComp.setNodeDirty();
            uiComp._markForUpdateRenderData();
          }
          self.emit(NodeEventType.LAYER_CHANGED, self._layer);
        }
        get layer() {
          return this._layer;
        }

        /**
         * @zh 节点的变换改动版本号。
         * @en The transformation change version number of the node.
         * @engineInternal
         * @internal
         */
        get flagChangedVersion() {
          return this._flagChangeVersion;
        }

        /**
         * @en Whether the node's transformation have changed during the current frame.
         * @zh 这个节点的空间变换信息在当前帧内是否有变过？
         */
        get hasChangedFlags() {
          return this._flagChangeVersion === globalFlagChangeVersion ? this._hasChangedFlags : 0;
        }
        set hasChangedFlags(val) {
          this._flagChangeVersion = globalFlagChangeVersion;
          this._hasChangedFlags = val;
        }

        /**
         * @internal
         */
        [serializeTag](serializationOutput, context) {
          if (!EDITOR) {
            serializationOutput.writeThis();
            return;
          }

          // Detects if this node is mounted node of `PrefabInstance`
          // TODO: optimize
          const isMountedChild = () => {
            var _this$editorExtrasTag;
            return !!((_this$editorExtrasTag = this[editorExtrasTag]) != null && _this$editorExtrasTag.mountedRoot);
          };

          // Returns if this node is under `PrefabInstance`
          // eslint-disable-next-line arrow-body-style
          const isSyncPrefab = () => {
            var _this$_prefab, _this$_prefab2;
            // 1. Under `PrefabInstance`, but not mounted
            // 2. If the mounted node is a `PrefabInstance`, it's also a "sync prefab".
            return ((_this$_prefab = this._prefab) == null || (_this$_prefab = _this$_prefab.root) == null || (_this$_prefab = _this$_prefab._prefab) == null ? void 0 : _this$_prefab.instance) && ((this == null || (_this$_prefab2 = this._prefab) == null ? void 0 : _this$_prefab2.instance) || !isMountedChild());
          };
          const canDiscardByPrefabRoot = () => !(context.customArguments[reserveContentsForAllSyncablePrefabTag] || !isSyncPrefab() || context.root === this);
          if (canDiscardByPrefabRoot()) {
            var _this$_prefab3;
            // discard props disallow to synchronize
            const isRoot = ((_this$_prefab3 = this._prefab) == null ? void 0 : _this$_prefab3.root) === this;
            if (isRoot) {
              // if B prefab is in A prefab,B can be referenced by component.We should discard it.because B is not the root of prefab
              let isNestedPrefab = false;
              let parent = this.getParent();
              while (parent) {
                var _parent$_prefab;
                const nestedRoots = (_parent$_prefab = parent._prefab) == null ? void 0 : _parent$_prefab.nestedPrefabInstanceRoots;
                if (nestedRoots && nestedRoots.length > 0) {
                  // if this node is not in nestedPrefabInstanceRoots,it means this node is not the root of prefab,so it should be discarded.
                  isNestedPrefab = !nestedRoots.some(root => root === this);
                  break;
                }
                parent = parent.getParent();
              }
              if (!isNestedPrefab) {
                serializationOutput.writeProperty('_objFlags', this._objFlags);
                serializationOutput.writeProperty('_parent', this._parent);
                serializationOutput.writeProperty('_prefab', this._prefab);
                if (context.customArguments.keepNodeUuid) {
                  serializationOutput.writeProperty('_id', this._id);
                }
              }
              // TODO: editorExtrasTag may be a symbol in the future
              serializationOutput.writeProperty(editorExtrasTag, this[editorExtrasTag]);
            } else {
              // should not serialize child node of synchronizable prefab
            }
          } else {
            serializationOutput.writeThis();
          }
        }

        // ===============================
        // hierarchy
        // ===============================

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onSetParent(oldParent, keepWorldTransform = false) {
          const self = this;
          const parent = self._parent;
          if (parent) {
            if ((oldParent == null || oldParent._scene !== parent._scene) && parent._scene != null) {
              self.walk(Node._setScene);
            }
          }
          if (keepWorldTransform) {
            if (parent) {
              parent.updateWorldTransform();
              if (approx(Mat4.determinant(parent._mat), 0, EPSILON)) {
                warnID(14300);
                self._transformFlags |= TransformBit.TRS;
                self.updateWorldTransform();
              } else {
                let newParentMatWithoutSkew = parent._mat;
                if (USE_UI_SKEW) {
                  const hasSkew = skewCompCount > 0;
                  if (hasSkew) {
                    if (oldParent) {
                      // Calculate old parent's world matrix without skew side effect.
                      const foundSkewInOldParent = findSkewAndGetOriginalWorldMatrix(oldParent, m4_2);
                      Mat4.fromSRT(m4_1, self._lrot, self._lpos, self._lscale);
                      const oldParentMatWithoutSkew = foundSkewInOldParent ? m4_2 : oldParent._mat;
                      // Calculate current node's world matrix without skew side effect.
                      Mat4.multiply(self._mat, oldParentMatWithoutSkew, m4_1);
                    }

                    // Calculate new parent's world matrix without skew side effect.
                    const foundSkewInNewParent = findSkewAndGetOriginalWorldMatrix(parent, m4_2);
                    if (foundSkewInNewParent) {
                      newParentMatWithoutSkew = m4_2;
                    }
                  }
                }

                // Calculate current node's new local transform
                Mat4.multiply(m4_1, Mat4.invert(m4_1, newParentMatWithoutSkew), self._mat);
                Mat4.toSRT(m4_1, self._lrot, self._lpos, self._lscale);
              }
            } else {
              Vec3.copy(self._lpos, self._pos);
              Quat.copy(self._lrot, self._rot);
              Vec3.copy(self._lscale, self._scale);
            }
            self._eulerDirty = true;
          }
          self.invalidateChildren(TransformBit.TRS);
        }
        _onHierarchyChanged(oldParent) {
          this.eventProcessor.reattach();
          this._onHierarchyChangedBase(oldParent);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onBatchCreated(dontSyncChildPrefab) {
          if (this._eventMask & ACTIVE_ON) {
            if (!this._activeInHierarchy) {
              this.emit(ACTIVE_CHANGED, this, false);
            }
          }
          this.hasChangedFlags = TransformBit.TRS;
          this._children.forEach((child, i) => {
            child._siblingIndex = i;
            child._onBatchCreated(dontSyncChildPrefab);
          });
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onBeforeSerialize() {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          this.eulerAngles; // make sure we save the correct eulerAngles
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onPostActivated(active) {
          const self = this;
          if (self._eventMask & ACTIVE_ON) {
            self.emit(ACTIVE_CHANGED, self, active);
          }
          const eventProcessor = this._eventProcessor;
          // If the 'enable' state of event processor is equal to the node's active state, we should mark the list dirty for the global callback invoker
          // which will trigger re-sorting logic in PointerEventDispatcher._sortPointerEventProcessorList.
          // Otherwise, pointerEventProcessorList will not be sorted correctly since the 'enable' state may not change and the following
          // eventProcessor.setEnabled(active) may return directly.
          // Think of the case:
          //   this.node.pauseSystemEvents(true);  // child's eventProcessor will be disabled.
          //   child.active = false;               // child's active state is false and its eventProcessor keeps disabled.
          //   this.node.resumeSystemEvents(true); // child's eventProcessor will be enabled, MARK_LIST_DIRTY will be emitted,
          //                                          but the node is not active, so the resorting logic will take the child to the end of the list,
          //                                          see PointerEventDispatcher._sortByPriority.
          //   child.active = true;                // child's eventProcessor has already been enabled, eventProcessor.setEnabled(true) will do nothing.
          if (eventProcessor.isEnabled === active) {
            NodeEventProcessor.callbacksInvoker.emit(DispatcherEventType.MARK_LIST_DIRTY);
          }
          eventProcessor.setEnabled(active);
          if (active) {
            // activated
            // in case transform updated during deactivated period
            self.invalidateChildren(TransformBit.TRS);
            // ALL Node renderData dirty flag will set on here
            const uiComp = self._uiProps && self._uiProps.uiComp;
            if (uiComp) {
              uiComp.setNodeDirty();
              uiComp.setTextureDirty(); // for dynamic atlas
              uiComp._markForUpdateRenderData();
            }
          }
        }

        // ===============================
        // transform helper, convenient but not the most efficient
        // ===============================

        /**
         * @en Perform a translation on the node
         * @zh 移动节点
         * @param trans The increment on position
         * @param ns The operation coordinate space
         */
        translate(trans, ns) {
          const space = ns || NodeSpace.LOCAL;
          if (space === NodeSpace.LOCAL) {
            Vec3.transformQuat(v3_a, trans, this._lrot);
            this._lpos.x += v3_a.x;
            this._lpos.y += v3_a.y;
            this._lpos.z += v3_a.z;
          } else if (space === NodeSpace.WORLD) {
            if (this._parent) {
              Quat.invert(q_a, this._parent.worldRotation);
              Vec3.transformQuat(v3_a, trans, q_a);
              const scale = this.worldScale;
              this._lpos.x += v3_a.x / scale.x;
              this._lpos.y += v3_a.y / scale.y;
              this._lpos.z += v3_a.z / scale.z;
            } else {
              this._lpos.x += trans.x;
              this._lpos.y += trans.y;
              this._lpos.z += trans.z;
            }
          }
          this.invalidateChildren(TransformBit.POSITION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.POSITION);
          }
        }

        /**
         * @en Perform a rotation on the node
         * @zh 旋转节点
         * @param rot The increment on rotation
         * @param ns The operation coordinate space
         */
        rotate(rot, ns) {
          const space = ns || NodeSpace.LOCAL;
          Quat.normalize(q_a, rot);
          if (space === NodeSpace.LOCAL) {
            Quat.multiply(this._lrot, this._lrot, q_a);
          } else if (space === NodeSpace.WORLD) {
            const worldRot = this.worldRotation;
            Quat.multiply(q_b, q_a, worldRot);
            Quat.invert(q_a, worldRot);
            Quat.multiply(q_b, q_a, q_b);
            Quat.multiply(this._lrot, this._lrot, q_b);
          }
          this._eulerDirty = true;
          this.invalidateChildren(TransformBit.ROTATION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.ROTATION);
          }
        }

        /**
         * @en Set the orientation of the node to face the target position, the node is facing minus z direction by default
         * @zh 设置当前节点旋转为面向目标位置，默认前方为 -z 方向
         * @param pos Target position
         * @param up Up direction
         */
        lookAt(pos, up) {
          this.getWorldPosition(v3_a);
          Vec3.subtract(v3_a, v3_a, pos);
          Vec3.normalize(v3_a, v3_a);
          Quat.fromViewUp(q_a, v3_a, up);
          this.setWorldRotation(q_a);
        }

        /**
         * @en Invalidate the world transform information
         * for this node and all its children recursively
         * @zh 递归标记节点世界变换为 dirty
         * @param dirtyBit The dirty bits to setup to children, can be composed with multiple dirty bits
         */
        invalidateChildren(dirtyBit) {
          let i = 0;
          let j = 0;
          let l = 0;
          let cur;
          let children;
          let hasChangedFlags = 0;
          const childDirtyBit = dirtyBit | TransformBit.POSITION;
          dirtyNodes[0] = this;
          while (i >= 0) {
            cur = dirtyNodes[i--];
            hasChangedFlags = cur.hasChangedFlags;
            if (cur.isValid && !cur.isSkipTransformUpdate && (cur._transformFlags & hasChangedFlags & dirtyBit) !== dirtyBit) {
              cur._transformFlags |= dirtyBit;
              cur.hasChangedFlags = hasChangedFlags | dirtyBit;
              children = cur._children;
              l = children.length;
              for (j = 0; j < l; j++) {
                dirtyNodes[++i] = children[j];
              }
            }
            dirtyBit = childDirtyBit;
          }
        }

        /**
         * @en Update the world transform information if outdated
         * @zh 更新节点的世界变换信息
         */
        updateWorldTransform() {
          if (!this._transformFlags) {
            return;
          }
          // we need to recursively iterate this
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          let cur = this;
          let i = 0;
          while (cur && cur._transformFlags) {
            // top level node
            dirtyNodes[i++] = cur;
            cur = cur._parent;
          }
          let child;
          let childMat;
          let childPos;
          let dirtyBits = 0;
          let positionDirty = 0;
          let rotationScaleSkewDirty = 0;
          let uiSkewComp = null;
          let foundSkewInAncestor = false;
          while (i) {
            child = dirtyNodes[--i];
            childMat = child._mat;
            childPos = child._pos;
            dirtyBits |= child._transformFlags;
            positionDirty = dirtyBits & TransformBit.POSITION;
            rotationScaleSkewDirty = dirtyBits & TransformBit.RSS;
            if (cur) {
              if (positionDirty && !rotationScaleSkewDirty) {
                Vec3.transformMat4(childPos, child._lpos, cur._mat);
                childMat.m12 = childPos.x;
                childMat.m13 = childPos.y;
                childMat.m14 = childPos.z;
              }
              if (rotationScaleSkewDirty) {
                let originalWorldMatrix = childMat;
                Mat4.fromSRT(m4_1, child._lrot, child._lpos, child._lscale); // m4_1 stores local matrix
                if (USE_UI_SKEW && skewCompCount > 0) {
                  foundSkewInAncestor = findSkewAndGetOriginalWorldMatrix(cur, m4_2); // m4_2 stores parent's world matrix without skew
                  uiSkewComp = child._uiProps._uiSkewComp;
                  if (uiSkewComp || foundSkewInAncestor) {
                    // Save the original world matrix without skew side effect.
                    Mat4.multiply(m4_2, m4_2, m4_1); // m4_2 stores orignal world matrix without skew
                    if (uiSkewComp) {
                      updateLocalMatrixBySkew(uiSkewComp, m4_1);
                    }
                    originalWorldMatrix = m4_2;
                  }
                }
                Mat4.multiply(childMat, cur._mat, m4_1); // m4_1 stores local matrix with skew

                const rotTmp = dirtyBits & TransformBit.ROTATION ? child._rot : null;
                Mat4.toSRT(originalWorldMatrix, rotTmp, childPos, child._scale);
                if (USE_UI_SKEW && foundSkewInAncestor) {
                  // NOTE: world position from Mat4.toSRT(originalWorldMatrix, ...) will not consider the skew factor.
                  // So we need to update the world position manually here.
                  Vec3.transformMat4(childPos, child._lpos, cur._mat);
                }
              }
            } else {
              if (positionDirty) {
                Vec3.copy(childPos, child._lpos);
                childMat.m12 = childPos.x;
                childMat.m13 = childPos.y;
                childMat.m14 = childPos.z;
              }
              if (rotationScaleSkewDirty) {
                if (dirtyBits & TransformBit.ROTATION) {
                  Quat.copy(child._rot, child._lrot);
                }
                if (dirtyBits & TransformBit.SCALE) {
                  Vec3.copy(child._scale, child._lscale);
                }
                Mat4.fromSRT(childMat, child._rot, child._pos, child._scale);
                if (USE_UI_SKEW && skewCompCount > 0) {
                  uiSkewComp = child._uiProps._uiSkewComp;
                  if (uiSkewComp) {
                    updateLocalMatrixBySkew(uiSkewComp, childMat);
                  }
                }
              }
            }
            child._transformFlags = TransformBit.NONE;
            cur = child;
          }
        }

        // ===============================
        // transform
        // ===============================

        /**
         * @en Set position in local coordinate system
         * @zh 设置本地坐标
         * @param position Target position
         */

        /**
         * @en Set position in local coordinate system
         * @zh 设置本地坐标
         * @param x X axis position
         * @param y Y axis position
         * @param z Z axis position
         */

        setPosition(val, y, z) {
          const localPosition = this._lpos;
          if (y === undefined) {
            Vec3.copy(localPosition, val);
          } else {
            if (z === undefined) {
              z = localPosition.z;
            }
            Vec3.set(localPosition, val, y, z);
          }
          this.invalidateChildren(TransformBit.POSITION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.POSITION);
          }
        }

        /**
         * @en Get position in local coordinate system, please try to pass `out` vector and reuse it to avoid garbage.
         * @zh 获取本地坐标，注意，尽可能传递复用的 [[Vec3]] 以避免产生垃圾。
         * @param out Set the result to out vector
         * @return If `out` given, the return value equals to `out`, otherwise a new vector will be generated and return
         */
        getPosition(out) {
          if (out) {
            return Vec3.set(out, this._lpos.x, this._lpos.y, this._lpos.z);
          }
          return Vec3.copy(new Vec3(), this._lpos);
        }

        /**
         * @en Set rotation in local coordinate system with a quaternion representing the rotation.
         * Please make sure the rotation is normalized.
         * @zh 用四元数设置本地旋转, 请确保设置的四元数已归一化。
         * @param rotation Rotation in quaternion
         */

        /**
         * @en Set rotation in local coordinate system with a quaternion representing the rotation.
         * Please make sure the rotation is normalized.
         * @zh 用四元数设置本地旋转, 请确保设置的四元数已归一化。
         * @param x X value in quaternion
         * @param y Y value in quaternion
         * @param z Z value in quaternion
         * @param w W value in quaternion
         */

        setRotation(val, y, z, w) {
          if (y === undefined) {
            Quat.copy(this._lrot, val);
          } else {
            Quat.set(this._lrot, val, y, z, w);
          }
          this._eulerDirty = true;
          this.invalidateChildren(TransformBit.ROTATION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.ROTATION);
          }
        }

        /**
         * @en Set rotation in local coordinate system with a vector representing euler angles
         * @zh 用欧拉角设置本地旋转
         * @param rotation Rotation in vector
         */

        /**
         * @en Set rotation in local coordinate system with euler angles
         * @zh 用欧拉角设置本地旋转
         * @param x X axis rotation
         * @param y Y axis rotation
         * @param zOpt Z axis rotation
         */

        setRotationFromEuler(val, y, zOpt) {
          if (y === undefined) {
            Vec3.copy(this._euler, val);
            Quat.fromEuler(this._lrot, val.x, val.y, val.z);
          } else {
            const z = zOpt === undefined ? this._euler.z : zOpt;
            Vec3.set(this._euler, val, y, z);
            Quat.fromEuler(this._lrot, val, y, z);
          }
          this._eulerDirty = false;
          this.invalidateChildren(TransformBit.ROTATION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.ROTATION);
          }
        }

        /**
         * @en Get rotation as quaternion in local coordinate system, please try to pass `out` quaternion and reuse it to avoid garbage.
         * @zh 获取本地旋转，注意，尽可能传递复用的 [[Quat]] 以避免产生垃圾。
         * @param out Set the result to out quaternion
         * @return If `out` given, the return value equals to `out`, otherwise a new quaternion will be generated and return
         */
        getRotation(out) {
          if (out) {
            return Quat.set(out, this._lrot.x, this._lrot.y, this._lrot.z, this._lrot.w);
          }
          return Quat.copy(new Quat(), this._lrot);
        }

        /**
         * @en Set scale in local coordinate system
         * @zh 设置本地缩放
         * @param scale Target scale
         */

        /**
         * @en Set scale in local coordinate system
         * @zh 设置本地缩放
         * @param x X axis scale
         * @param y Y axis scale
         * @param z Z axis scale
         */

        setScale(val, y, z) {
          const localScale = this._lscale;
          if (y === undefined) {
            Vec3.copy(localScale, val);
          } else {
            if (z === undefined) {
              z = localScale.z;
            }
            Vec3.set(localScale, val, y, z);
          }
          this.invalidateChildren(TransformBit.SCALE);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.SCALE);
          }
        }

        /**
         * @en Get scale in local coordinate system, please try to pass `out` vector and reuse it to avoid garbage.
         * @zh 获取本地缩放，注意，尽可能传递复用的 [[Vec3]] 以避免产生垃圾。
         * @param out Set the result to out vector
         * @return If `out` given, the return value equals to `out`, otherwise a new vector will be generated and return
         */
        getScale(out) {
          if (out) {
            return Vec3.set(out, this._lscale.x, this._lscale.y, this._lscale.z);
          }
          return Vec3.copy(new Vec3(), this._lscale);
        }

        /**
         * @en Inversely transform a point from world coordinate system to local coordinate system.
         * @zh 逆向变换一个空间点，一般用于将世界坐标转换到本地坐标系中。
         * @param out The result point in local coordinate system will be stored in this vector
         * @param p A position in world coordinate system
         */
        inverseTransformPoint(out, p) {
          Vec3.copy(out, p);
          // we need to recursively iterate this
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          let cur = this;
          let i = 0;
          while (cur._parent) {
            dirtyNodes[i++] = cur;
            cur = cur._parent;
          }
          while (i >= 0) {
            Vec3.transformInverseRTS(out, out, cur._lrot, cur._lpos, cur._lscale);
            cur = dirtyNodes[--i];
          }
          return out;
        }

        /**
         * @en Set position in world coordinate system
         * @zh 设置世界坐标
         * @param position Target position
         */

        /**
         * @en Set position in world coordinate system
         * @zh 设置世界坐标
         * @param x X axis position
         * @param y Y axis position
         * @param z Z axis position
         */

        setWorldPosition(val, y, z) {
          const worldPosition = this._pos;
          if (y === undefined) {
            Vec3.copy(worldPosition, val);
          } else {
            if (z === undefined) {
              z = worldPosition.z;
            }
            Vec3.set(worldPosition, val, y, z);
          }
          const parent = this._parent;
          const local = this._lpos;
          if (parent) {
            // TODO: benchmark these approaches
            /* */
            parent.updateWorldTransform();
            Vec3.transformMat4(local, worldPosition, Mat4.invert(m4_1, parent._mat));
            /* *
            parent.inverseTransformPoint(local, this._pos);
            /* */
          } else {
            Vec3.copy(local, worldPosition);
          }
          this.invalidateChildren(TransformBit.POSITION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.POSITION);
          }
        }

        /**
         * @en Get position in world coordinate system, please try to pass `out` vector and reuse it to avoid garbage.
         * @zh 获取世界坐标，注意，尽可能传递复用的 [[Vec3]] 以避免产生垃圾。
         * @param out Set the result to out vector
         * @return If `out` given, the return value equals to `out`, otherwise a new vector will be generated and return
         */
        getWorldPosition(out) {
          this.updateWorldTransform();
          if (out) {
            return Vec3.copy(out, this._pos);
          }
          return Vec3.copy(new Vec3(), this._pos);
        }

        /**
         * @en Set rotation in world coordinate system with a quaternion representing the rotation
         * @zh 用四元数设置世界坐标系下的旋转
         * @param rotation Rotation in quaternion
         */

        /**
         * @en Set rotation in world coordinate system with a quaternion representing the rotation
         * @zh 用四元数设置世界坐标系下的旋转
         * @param x X value in quaternion
         * @param y Y value in quaternion
         * @param z Z value in quaternion
         * @param w W value in quaternion
         */

        setWorldRotation(val, y, z, w) {
          const worldRotation = this._rot;
          if (y === undefined) {
            Quat.copy(worldRotation, val);
          } else {
            Quat.set(worldRotation, val, y, z, w);
          }
          if (this._parent) {
            this._parent.updateWorldTransform();
            Quat.multiply(this._lrot, Quat.conjugate(this._lrot, this._parent._rot), worldRotation);
          } else {
            Quat.copy(this._lrot, worldRotation);
          }
          this._eulerDirty = true;
          this.invalidateChildren(TransformBit.ROTATION);
          if (this._eventMask & TRANSFORM_ON) {
            this.emit(TRANSFORM_CHANGED, TransformBit.ROTATION);
          }
        }

        /**
         * @en Set rotation in world coordinate system with euler angles
         * @zh 用欧拉角设置世界坐标系下的旋转
         * @param x X axis rotation
         * @param y Y axis rotation
         * @param z Z axis rotation
         */
        setWorldRotationFromEuler(x, y, z) {
          Quat.fromEuler(q_a, x, y, z);
          this.setWorldRotation(q_a);
        }

        /**
         * @en Get rotation as quaternion in world coordinate system, please try to pass `out` quaternion and reuse it to avoid garbage.
         * @zh 获取世界坐标系下的旋转，注意，尽可能传递复用的 [[Quat]] 以避免产生垃圾。
         * @param out Set the result to out quaternion
         * @return If `out` given, the return value equals to `out`, otherwise a new quaternion will be generated and return
         */
        getWorldRotation(out) {
          this.updateWorldTransform();
          if (out) {
            return Quat.copy(out, this._rot);
          }
          return Quat.copy(new Quat(), this._rot);
        }

        /**
         * @en Set scale in world coordinate system
         * @zh 设置世界坐标系下的缩放
         * @param scale Target scale
         */

        /**
         * @en Set scale in world coordinate system
         * @zh 设置世界坐标系下的缩放
         * @param x X axis scale
         * @param y Y axis scale
         * @param z Z axis scale
         */

        setWorldScale(val, y, z) {
          const self = this;
          const parent = self._parent;
          if (parent) {
            self.updateWorldTransform();
          }
          const worldScale = self._scale;
          if (y === undefined) {
            Vec3.copy(worldScale, val);
          } else {
            Vec3.set(worldScale, val, y, z);
          }
          let rotationFlag = TransformBit.NONE;
          if (parent) {
            const worldMatrix = self._mat;
            const uiSkewComp = self._uiProps._uiSkewComp;
            if (uiSkewComp) {
              Mat4.fromSRT(m4_1, self._lrot, self._lpos, self._lscale);
              Mat4.multiply(worldMatrix, parent._mat, m4_1);
            }
            const xScale = Vec3.set(v3_b, worldMatrix.m00, worldMatrix.m01, worldMatrix.m02).length();
            const yScale = Vec3.set(v3_b, worldMatrix.m04, worldMatrix.m05, worldMatrix.m06).length();
            const zScale = Vec3.set(v3_b, worldMatrix.m08, worldMatrix.m09, worldMatrix.m10).length();
            if (xScale === 0) {
              v3_a.x = worldScale.x;
              worldMatrix.m00 = 1;
              rotationFlag = TransformBit.ROTATION;
            } else {
              v3_a.x = worldScale.x / xScale;
            }
            if (yScale === 0) {
              v3_a.y = worldScale.y;
              worldMatrix.m05 = 1;
              rotationFlag = TransformBit.ROTATION;
            } else {
              v3_a.y = worldScale.y / yScale;
            }
            if (zScale === 0) {
              v3_a.z = worldScale.z;
              worldMatrix.m10 = 1;
              rotationFlag = TransformBit.ROTATION;
            } else {
              v3_a.z = worldScale.z / zScale;
            }
            Mat4.scale(m4_1, worldMatrix, v3_a);
            Mat4.multiply(m4_2, Mat4.invert(m4_2, parent._mat), m4_1);
            Mat3.fromQuat(m3_1, Quat.conjugate(qt_1, self._lrot));
            Mat3.multiplyMat4(m3_1, m3_1, m4_2);
            const localScale = self._lscale;
            localScale.x = Vec3.set(v3_a, m3_1.m00, m3_1.m01, m3_1.m02).length();
            localScale.y = Vec3.set(v3_a, m3_1.m03, m3_1.m04, m3_1.m05).length();
            localScale.z = Vec3.set(v3_a, m3_1.m06, m3_1.m07, m3_1.m08).length();
            if (localScale.x === 0 || localScale.y === 0 || localScale.z === 0) {
              rotationFlag = TransformBit.ROTATION;
            }
          } else {
            Vec3.copy(self._lscale, worldScale);
          }
          self.invalidateChildren(TransformBit.SCALE | rotationFlag);
          if (self._eventMask & TRANSFORM_ON) {
            self.emit(TRANSFORM_CHANGED, TransformBit.SCALE | rotationFlag);
          }
        }

        /**
         * @en Get scale in world coordinate system, please try to pass `out` vector and reuse it to avoid garbage.
         * @zh 获取世界缩放，注意，尽可能传递复用的 [[Vec3]] 以避免产生垃圾。
         * @param out Set the result to out vector
         * @return If `out` given, the return value equals to `out`, otherwise a new vector will be generated and return
         */
        getWorldScale(out) {
          this.updateWorldTransform();
          if (out) {
            return Vec3.copy(out, this._scale);
          }
          return Vec3.copy(new Vec3(), this._scale);
        }

        /**
         * @en Get a world transform matrix
         * @zh 获取世界变换矩阵
         * @param out Set the result to out matrix
         * @return If `out` given, the return value equals to `out`, otherwise a new matrix will be generated and return
         */
        getWorldMatrix(out) {
          this.updateWorldTransform();
          const target = out || new Mat4();
          return Mat4.copy(target, this._mat);
        }

        /**
         * @en Get a world transform matrix with only rotation and scale
         * @zh 获取只包含旋转和缩放的世界变换矩阵
         * @param out Set the result to out matrix
         * @return If `out` given, the return value equals to `out`, otherwise a new matrix will be generated and return
         */
        getWorldRS(out) {
          this.updateWorldTransform();
          const target = out || new Mat4();
          Mat4.copy(target, this._mat);
          target.m12 = 0;
          target.m13 = 0;
          target.m14 = 0;
          return target;
        }

        /**
         * @en Get a world transform matrix with only rotation and translation
         * @zh 获取只包含旋转和位移的世界变换矩阵
         * @param out Set the result to out matrix
         * @return If `out` given, the return value equals to `out`, otherwise a new matrix will be generated and return
         */
        getWorldRT(out) {
          this.updateWorldTransform();
          const target = out || new Mat4();
          return Mat4.fromRT(target, this._rot, this._pos);
        }

        /**
         * @en Set local transformation with rotation, position and scale separately.
         * @zh 一次性设置所有局部变换（平移、旋转、缩放）信息
         * @param rot The rotation
         * @param pos The position
         * @param scale The scale
         */
        setRTS(rot, pos, scale) {
          let dirtyBit = 0;
          if (rot) {
            dirtyBit |= TransformBit.ROTATION;
            if (rot.w !== undefined) {
              Quat.copy(this._lrot, rot);
              this._eulerDirty = true;
            } else {
              Vec3.copy(this._euler, rot);
              Quat.fromEuler(this._lrot, rot.x, rot.y, rot.z);
              this._eulerDirty = false;
            }
          }
          if (pos) {
            Vec3.copy(this._lpos, pos);
            dirtyBit |= TransformBit.POSITION;
          }
          if (scale) {
            Vec3.copy(this._lscale, scale);
            dirtyBit |= TransformBit.SCALE;
          }
          if (dirtyBit) {
            this.invalidateChildren(dirtyBit);
            if (this._eventMask & TRANSFORM_ON) {
              this.emit(TRANSFORM_CHANGED, dirtyBit);
            }
          }
        }

        /**
         * @en Does the world transform information of this node need to be updated?
         * @zh 这个节点的空间变换信息是否需要更新？
         */
        isTransformDirty() {
          return this._transformFlags !== TransformBit.NONE;
        }

        /**
         * @en
         * Pause all system events which is dispatched by [[SystemEvent]].
         * If recursive is set to true, then this API will pause the node system events for the node and all nodes in its sub node tree.
         * @zh
         * 暂停所有 [[SystemEvent]] 派发的系统事件。
         * 如果传递 recursive 为 true，那么这个 API 将暂停本节点和它的子树上所有节点的节点系统事件。
         *
         * @param recursive Whether pause system events recursively for the child node tree
         */
        pauseSystemEvents(recursive) {
          this._eventProcessor.setEnabled(false, recursive);
        }

        /**
         * @en
         * Resume all paused system events which is dispatched by [[SystemEvent]].
         * If recursive is set to true, then this API will resume the node system events for the node and all nodes in its sub node tree.
         *
         * @zh
         * 恢复所有 [[SystemEvent]] 派发的系统事件。
         * 如果传递 recursive 为 true，那么这个 API 将恢复本节点和它的子树上所有节点的节点系统事件。
         *
         * @param recursive Whether resume system events recursively for the child node tree
         */
        resumeSystemEvents(recursive) {
          this._eventProcessor.setEnabled(true, recursive);
        }

        /**
         * @en
         * clear all node dirty state.
         * @zh
         * 清除所有节点的脏标记。
         */
        static resetHasChangedFlags() {
          globalFlagChangeVersion += 1;
        }

        /**
         * @en
         * clear node array
         * @zh
         * 清除节点数组
         */
        static clearNodeArray() {
          if (Node.ClearFrame < Node.ClearRound && !EDITOR) {
            Node.ClearFrame++;
          } else {
            Node.ClearFrame = 0;
            dirtyNodes.length = 0;
          }
        }

        /**
         * @en
         * Get the complete path of the current node in the hierarchy.
         *
         * @zh
         * 获得当前节点在 hierarchy 中的完整路径。
         */
        getPathInHierarchy() {
          let result = this.name;
          let curNode = this.parent;
          while (curNode && !(curNode instanceof cclegacy.Scene)) {
            result = `${curNode.name}/${result}`;
            curNode = curNode.parent;
          }
          return result;
        }

        /**
         * @mangle
         * @engineInternal
         */
        _getUITransformComp() {
          return this._uiProps.uiTransformComp;
        }

        /**
         * @engineInternal
         */
        set isSkipTransformUpdate(skip) {
          if (skip) {
            this._objFlags |= CCObjectFlags.IsSkipTransformUpdate;
          } else {
            this._objFlags &= ~CCObjectFlags.IsSkipTransformUpdate;
          }
        }

        /**
         * @engineInternal
         */
        get isSkipTransformUpdate() {
          return (this._objFlags & CCObjectFlags.IsSkipTransformUpdate) !== 0;
        }
      }, _Node.idGenerator = idGenerator, _Node._stacks = [[]], _Node._stackId = 0, _Node.EventType = NodeEventType, _Node.NodeSpace = NodeSpace, _Node.TransformDirtyBit = TransformBit, _Node.TransformBit = TransformBit, _Node.reserveContentsForAllSyncablePrefabTag = reserveContentsForAllSyncablePrefabTag, _Node.ClearFrame = 0, _Node.ClearRound = 1000, _Node), _applyDecoratedDescriptor(_class2.prototype, "_persistNode", [property], Object.getOwnPropertyDescriptor(_class2.prototype, "_persistNode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "name", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "name"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "children", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "children"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "active", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "active"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "activeInHierarchy", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "activeInHierarchy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "parent", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "parent"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_parent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_children", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_active", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_components", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_prefab", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_lpos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_lrot", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Quat();
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_lscale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(1, 1, 1);
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_mobility", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return MobilityMode.Static;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_layer", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Layers.Enum.DEFAULT;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_euler", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "eulerAngles", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "eulerAngles"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angle", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "angle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mobility", [editable, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "mobility"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "layer", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "layer"), _class2.prototype), _class2)) || _class));
      nodePolyfill(Node);
      cclegacy.Node = Node;
    }
  };
});