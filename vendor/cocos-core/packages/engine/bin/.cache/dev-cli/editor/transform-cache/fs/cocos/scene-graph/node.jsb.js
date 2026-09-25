System.register("q-bundled:///fs/cocos/scene-graph/node.jsb.js", ["../../../virtual/internal%253Aconstants.js", "../core/global-exports.js", "../core/platform/debug.js", "./component.js", "./node-event.js", "../core/data/object.js", "./node-ui-properties.js", "./node-enum.js", "../core/math/index.js", "./layers.js", "../core/data/index.js", "./utils.jsb.js", "../core/utils/js-typed.js", "../core/utils/jsb-utils.js", "./node-dev.js", "../core/utils/js.js", "../native-binding/decorators.js", "./node-event-processor.js"], function (_export, _context) {
  "use strict";

  var EDITOR, EDITOR_NOT_IN_PREVIEW, cclegacy, errorID, getError, Component, NodeEventType, CCObjectFlags, NodeUIProperties, MobilityMode, NodeSpace, TransformBit, Mat4, Quat, Vec3, Layers, editorExtrasTag, serializeTag, _tempFloatArray, fillMat4WithTempFloatArray, getClassByName, isChildClassOf, syncNodeValues, nodePolyfill, js, patch_cc_Node, DispatcherEventType, NodeEventProcessor, reserveContentsForAllSyncablePrefabTag, Node, tempVec3, NodeCls, TRANSFORMBIT_TRS, nodeProto, TRANSFORM_ON, ACTIVE_ON, Destroying, REGISTERED_EVENT_MASK_TRANSFORM_CHANGED, REGISTERED_EVENT_MASK_PARENT_CHANGED, REGISTERED_EVENT_MASK_MOBILITY_CHANGED, REGISTERED_EVENT_MASK_LAYER_CHANGED, REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED, REGISTERED_EVENT_MASK_LIGHT_PROBE_BAKING_CHANGED, oldPreDestroy, _tempQuat;
  function getConstructor(typeOrClassName) {
    if (!typeOrClassName) {
      return null;
    }
    if (typeof typeOrClassName === 'string') {
      return getClassByName(typeOrClassName);
    }
    return typeOrClassName;
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
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreGlobalExportsJs) {
      cclegacy = _coreGlobalExportsJs.cclegacy;
    }, function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
      getError = _corePlatformDebugJs.getError;
    }, function (_componentJs) {
      Component = _componentJs.Component;
    }, function (_nodeEventJs) {
      NodeEventType = _nodeEventJs.NodeEventType;
    }, function (_coreDataObjectJs) {
      CCObjectFlags = _coreDataObjectJs.CCObjectFlags;
    }, function (_nodeUiPropertiesJs) {
      NodeUIProperties = _nodeUiPropertiesJs.NodeUIProperties;
    }, function (_nodeEnumJs) {
      MobilityMode = _nodeEnumJs.MobilityMode;
      NodeSpace = _nodeEnumJs.NodeSpace;
      TransformBit = _nodeEnumJs.TransformBit;
    }, function (_coreMathIndexJs) {
      Mat4 = _coreMathIndexJs.Mat4;
      Quat = _coreMathIndexJs.Quat;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_layersJs) {
      Layers = _layersJs.Layers;
    }, function (_coreDataIndexJs) {
      editorExtrasTag = _coreDataIndexJs.editorExtrasTag;
      serializeTag = _coreDataIndexJs.serializeTag;
    }, function (_utilsJsbJs) {
      _tempFloatArray = _utilsJsbJs._tempFloatArray;
      fillMat4WithTempFloatArray = _utilsJsbJs.fillMat4WithTempFloatArray;
    }, function (_coreUtilsJsTypedJs) {
      getClassByName = _coreUtilsJsTypedJs.getClassByName;
      isChildClassOf = _coreUtilsJsTypedJs.isChildClassOf;
    }, function (_coreUtilsJsbUtilsJs) {
      syncNodeValues = _coreUtilsJsbUtilsJs.syncNodeValues;
    }, function (_nodeDevJs) {
      nodePolyfill = _nodeDevJs.nodePolyfill;
    }, function (_coreUtilsJsJs) {
      js = _coreUtilsJsJs;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_Node = _nativeBindingDecoratorsJs.patch_cc_Node;
    }, function (_nodeEventProcessorJs) {
      DispatcherEventType = _nodeEventProcessorJs.DispatcherEventType;
      NodeEventProcessor = _nodeEventProcessorJs.NodeEventProcessor;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
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
      reserveContentsForAllSyncablePrefabTag = Symbol('ReserveContentsForAllSyncablePrefab');
      _export("Node", Node = jsb.Node);
      cclegacy.Node = Node;
      tempVec3 = new Vec3();
      NodeCls = Node;
      NodeCls.reserveContentsForAllSyncablePrefabTag = reserveContentsForAllSyncablePrefabTag;

      /**
       * @en Event types emitted by Node
       * @zh 节点可能发出的事件类型
       */
      NodeCls.EventType = NodeEventType;

      /**
       * @en Coordinates space
       * @zh 空间变换操作的坐标系
       */
      NodeCls.NodeSpace = NodeSpace;

      /**
       * @en Bit masks for Node transformation parts
       * @zh 节点变换更新的具体部分
       * @deprecated please use [[Node.TransformBit]]
       */
      NodeCls.TransformDirtyBit = TransformBit;

      /**
       * @en Bit masks for Node transformation parts, can be used to determine which part changed in [[NodeEventType.TRANSFORM_CHANGED]] event
       * @zh 节点变换更新的具体部分，可用于判断 [[NodeEventType.TRANSFORM_CHANGED]] 事件的具体类型
       */
      NodeCls.TransformBit = TransformBit;
      TRANSFORMBIT_TRS = TransformBit.TRS;
      nodeProto = jsb.Node.prototype;
      _export("TRANSFORM_ON", TRANSFORM_ON = 1 << 0);
      ACTIVE_ON = 1 << 1;
      Destroying = CCObjectFlags.Destroying; // TODO: `_setTempFloatArray` is only implemented on Native platforms. @dumganhar
      // issue: https://github.com/cocos/cocos-engine/issues/14644
      Node._setTempFloatArray(_tempFloatArray.buffer);
      nodeProto.attr = function (attrs) {
        js.mixin(this, attrs);
      };
      nodeProto.getComponent = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        if (constructor) {
          return NodeCls._findComponent(this, constructor);
        }
        return null;
      };
      nodeProto.getComponents = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        const components = [];
        if (constructor) {
          NodeCls._findComponents(this, constructor, components);
        }
        return components;
      };
      nodeProto.getComponentInChildren = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        if (constructor) {
          return NodeCls._findChildComponent(this._children, constructor);
        }
        return null;
      };
      nodeProto.getComponentsInChildren = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        const components = [];
        if (constructor) {
          NodeCls._findComponents(this, constructor, components);
          NodeCls._findChildComponents(this.children, constructor, components);
        }
        return components;
      };
      nodeProto.addComponent = function (typeOrClassName) {
        if (EDITOR && this._objFlags & Destroying) {
          throw Error('isDestroying');
        }

        // get component

        let constructor;
        if (typeof typeOrClassName === 'string') {
          constructor = getClassByName(typeOrClassName);
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
        if (!isChildClassOf(constructor, Component)) {
          throw TypeError(getError(3810));
        }
        if (EDITOR && constructor._disallowMultiple) {
          this._checkMultipleComp(constructor);
        }

        // check requirement

        // TODO: `_requireComponent` is injected properties
        const reqComps = constructor._requireComponent;
        if (reqComps) {
          const tryAdd = c => {
            if (!this.getComponent(c)) {
              this.addComponent(c);
            }
          };
          if (Array.isArray(reqComps)) {
            reqComps.forEach(c => tryAdd(c));
          } else {
            tryAdd(reqComps);
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
        if (EDITOR && EditorExtends.Node && EditorExtends.Component) {
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
      };
      nodeProto.removeComponent = function (component) {
        if (!component) {
          errorID(3813);
          return;
        }
        let componentInstance = null;
        if (component instanceof Component) {
          componentInstance = component;
        } else {
          componentInstance = this.getComponent(component);
        }
        if (componentInstance) {
          componentInstance.destroy();
        }
      };
      REGISTERED_EVENT_MASK_TRANSFORM_CHANGED = 1 << 0;
      REGISTERED_EVENT_MASK_PARENT_CHANGED = 1 << 1;
      REGISTERED_EVENT_MASK_MOBILITY_CHANGED = 1 << 2;
      REGISTERED_EVENT_MASK_LAYER_CHANGED = 1 << 3;
      REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED = 1 << 4;
      REGISTERED_EVENT_MASK_LIGHT_PROBE_BAKING_CHANGED = 1 << 5;
      nodeProto.on = function (type, callback, target, useCapture = false) {
        switch (type) {
          case NodeEventType.TRANSFORM_CHANGED:
            this._eventMask |= TRANSFORM_ON;
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_TRANSFORM_CHANGED)) {
              this._registerOnTransformChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_TRANSFORM_CHANGED;
            }
            break;
          case NodeEventType.ACTIVE_CHANGED:
            this._eventMask |= ACTIVE_ON;
            break;
          case NodeEventType.PARENT_CHANGED:
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_PARENT_CHANGED)) {
              this._registerOnParentChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_PARENT_CHANGED;
            }
            break;
          case NodeEventType.MOBILITY_CHANGED:
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_MOBILITY_CHANGED)) {
              this._registerOnMobilityChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_MOBILITY_CHANGED;
            }
            break;
          case NodeEventType.LAYER_CHANGED:
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_LAYER_CHANGED)) {
              this._registerOnLayerChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_LAYER_CHANGED;
            }
            break;
          case NodeEventType.CHILDREN_ORDER_CHANGED:
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED)) {
              this._registerOnSiblingOrderChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED;
            }
            break;
          case NodeEventType.LIGHT_PROBE_BAKING_CHANGED:
            if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_LIGHT_PROBE_BAKING_CHANGED)) {
              this._registerOnLightProbeBakingChanged();
              this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_LIGHT_PROBE_BAKING_CHANGED;
            }
            break;
          default:
            break;
        }
        this._eventProcessor.on(type, callback, target, useCapture);
      };
      nodeProto.off = function (type, callback, target, useCapture = false) {
        this._eventProcessor.off(type, callback, target, useCapture);
        const hasListeners = this._eventProcessor.hasEventListener(type);
        // All listener removed
        if (!hasListeners) {
          switch (type) {
            case NodeEventType.TRANSFORM_CHANGED:
              this._eventMask &= ~TRANSFORM_ON;
              break;
            case NodeEventType.ACTIVE_CHANGED:
              this._eventMask &= ~ACTIVE_ON;
              break;
            default:
              break;
          }
        }
      };
      nodeProto.once = function (type, callback, target, useCapture) {
        this._eventProcessor.once(type, callback, target, useCapture);
      };
      nodeProto.emit = function (type, arg0, arg1, arg2, arg3, arg4) {
        this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
      };
      nodeProto.dispatchEvent = function (event) {
        this._eventProcessor.dispatchEvent(event);
      };
      nodeProto.hasEventListener = function (type, callback, target) {
        return this._eventProcessor.hasEventListener(type, callback, target);
      };
      nodeProto.targetOff = function (target) {
        this._eventProcessor.targetOff(target);
        // Check for event mask reset
        if (this._eventMask & TRANSFORM_ON && !this._eventProcessor.hasEventListener(NodeEventType.TRANSFORM_CHANGED)) {
          this._eventMask &= ~TRANSFORM_ON;
        }
        if (this._eventMask & ACTIVE_ON && !this._eventProcessor.hasEventListener(NodeEventType.ACTIVE_CHANGED)) {
          this._eventMask &= ~ACTIVE_ON;
        }
      };
      nodeProto.pauseSystemEvents = function pauseSystemEvents(recursive) {
        this._eventProcessor.setEnabled(false, recursive);
      };
      nodeProto.resumeSystemEvents = function resumeSystemEvents(recursive) {
        this._eventProcessor.setEnabled(true, recursive);
      };
      nodeProto.getWritableComponents = function () {
        return this._components;
      };
      nodeProto._setActiveInHierarchy = function (v) {
        return this._activeInHierarchy = v;
      };
      nodeProto._removeComponent = function (component) {
        if (!component) {
          errorID(3814);
          return;
        }
        if (!(this._objFlags & Destroying)) {
          const i = this._components.indexOf(component);
          if (i !== -1) {
            this._components.splice(i, 1);
            if (EDITOR && EditorExtends.Component) {
              EditorExtends.Component.remove(component._id);
            }
            this.emit(NodeEventType.COMPONENT_REMOVED, component);
          } else if (component.node !== this) {
            errorID(3815);
          }
        }
      };
      nodeProto._registerIfAttached = !EDITOR ? undefined : function (attached) {
        if (EditorExtends.Node && EditorExtends.Component) {
          if (attached) {
            EditorExtends.Node.add(this._id, this);
            for (let i = 0; i < this._components.length; i++) {
              const comp = this._components[i];
              EditorExtends.Component.add(comp._id, comp);
            }
          } else {
            for (let i = 0; i < this._components.length; i++) {
              const comp = this._components[i];
              EditorExtends.Component.remove(comp._id);
            }
            EditorExtends.Node.remove(this._id);
          }
        }
        const children = this._children;
        for (let i = 0, len = children.length; i < len; ++i) {
          const child = children[i];
          // TODO: `_registerIfAttached` is an injected property.
          // issue: https://github.com/cocos/cocos-engine/issues/14643
          child._registerIfAttached(attached);
        }
      };

      // These functions are invoked by native Node object.

      nodeProto._onTransformChanged = function (transformType) {
        this.emit(NodeEventType.TRANSFORM_CHANGED, transformType);
      };
      nodeProto._onParentChanged = function (oldParent) {
        this.emit(NodeEventType.PARENT_CHANGED, oldParent);
      };
      nodeProto._onReAttach = function () {
        this._eventProcessor.reattach();
      };
      nodeProto._onEditorAttached = function (attached) {
        if (EDITOR) {
          this._registerIfAttached(attached);
        }
      };
      nodeProto._onRemovePersistRootNode = function () {
        cclegacy.game.removePersistRootNode(this);
      };
      nodeProto._onDestroyComponents = function () {
        // Destroy node event processor
        this._eventProcessor.destroy();
        const comps = this._components;
        for (let i = 0; i < comps.length; ++i) {
          // destroy immediate so its _onPreDestroy can be called
          // TO DO
          comps[i]._destroyImmediate();
        }
      };
      nodeProto._onMobilityChanged = function () {
        this.emit(NodeEventType.MOBILITY_CHANGED);
      };
      nodeProto._onLayerChanged = function (layer) {
        this.emit(NodeEventType.LAYER_CHANGED, layer);
      };
      nodeProto._onChildRemoved = function (child) {
        const removeAt = this._children.indexOf(child);
        if (removeAt < 0) {
          errorID(1633);
          return;
        }
        this._children.splice(removeAt, 1);
        this.emit(NodeEventType.CHILD_REMOVED, child);
      };
      nodeProto._onChildAdded = function (child) {
        this._children.push(child);
        this.emit(NodeEventType.CHILD_ADDED, child);
      };
      oldPreDestroy = nodeProto._onPreDestroy;
      nodeProto._onPreDestroy = function _onPreDestroy() {
        const ret = oldPreDestroy.call(this);

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
        return ret;
      };
      nodeProto.destroyAllChildren = function destroyAllChildren() {
        const children = this._children;
        for (let i = 0, len = children.length; i < len; ++i) {
          children[i].destroy();
        }
      };
      nodeProto._onSiblingOrderChanged = function () {
        this.emit(NodeEventType.CHILDREN_ORDER_CHANGED);
      };
      nodeProto._onActivateNode = function (shouldActiveNow) {
        cclegacy.director._nodeActivator.activateNode(this, shouldActiveNow);
      };
      nodeProto._onPostActivated = function (active) {
        if (this._eventMask & ACTIVE_ON) {
          this.emit(NodeEventType.ACTIVE_CHANGED, this, active);
        }
        const eventProcessor = this._eventProcessor;
        if (eventProcessor.isEnabled === active) {
          NodeEventProcessor.callbacksInvoker.emit(DispatcherEventType.MARK_LIST_DIRTY);
        }
        eventProcessor.setEnabled(active);
        if (active) {
          // in case transform updated during deactivated period
          this.invalidateChildren(TransformBit.TRS);
          // ALL Node renderData dirty flag will set on here
          if (this._uiProps && this._uiProps.uiComp) {
            this._uiProps.uiComp.setNodeDirty();
            this._uiProps.uiComp.setTextureDirty(); // for dynamic atlas
            this._uiProps.uiComp._markForUpdateRenderData();
          }
        }
      };
      nodeProto._onLightProbeBakingChanged = function () {
        this.emit(NodeEventType.LIGHT_PROBE_BAKING_CHANGED);
      };

      // Static functions.

      NodeCls._findComponent = function (node, constructor) {
        const cls = constructor;
        const comps = node._components;
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
      };
      NodeCls._findComponents = function (node, constructor, components) {
        const cls = constructor;
        const comps = node._components;
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
      };
      NodeCls._findChildComponent = function (children, constructor) {
        for (let i = 0; i < children.length; ++i) {
          const node = children[i];
          let comp = NodeCls._findComponent(node, constructor);
          if (comp) {
            return comp;
          }
          const childChildren = node.children;
          if (childChildren.length > 0) {
            comp = NodeCls._findChildComponent(childChildren, constructor);
            if (comp) {
              return comp;
            }
          }
        }
        return null;
      };
      NodeCls._findChildComponents = function (children, constructor, components) {
        for (let i = 0; i < children.length; ++i) {
          const node = children[i];
          NodeCls._findComponents(node, constructor, components);
          const childChildren = node.children;
          if (childChildren.length > 0) {
            NodeCls._findChildComponents(childChildren, constructor, components);
          }
        }
      };

      /**
       * @en Determine whether the given object is a normal Node. Will return false if [[Scene]] given.
       * @zh 指定对象是否是普通的节点？如果传入 [[Scene]] 会返回 false。
       */
      // @ts-ignore
      NodeCls.isNode = function (obj) {
        // @ts-ignore
        return obj instanceof jsb.Node && (obj.constructor === jsb.Node || !(obj instanceof cclegacy.Scene));
      };
      _tempQuat = new Quat();
      nodeProto.setRTS = function setRTS(rot, pos, scale) {
        if (rot) {
          let val = _tempQuat;
          if (rot instanceof Quat) {
            val = rot;
          } else {
            Quat.fromEuler(val, rot.x, rot.y, rot.z);
          }
          _tempFloatArray[0] = 4;
          _tempFloatArray[1] = val.x;
          _tempFloatArray[2] = val.y;
          _tempFloatArray[3] = val.z;
          _tempFloatArray[4] = val.w;
          this._lrot.set(val.x, val.y, val.z, val.w);
        } else {
          _tempFloatArray[0] = 0;
        }
        if (pos) {
          _tempFloatArray[5] = 3;
          _tempFloatArray[6] = pos.x;
          _tempFloatArray[7] = pos.y;
          _tempFloatArray[8] = pos.z;
          this._lpos.set(pos.x, pos.y, pos.z);
        } else {
          _tempFloatArray[5] = 0;
        }
        if (scale) {
          _tempFloatArray[9] = 3;
          _tempFloatArray[10] = scale.x;
          _tempFloatArray[11] = scale.y;
          _tempFloatArray[12] = scale.z;
          this._lscale.set(scale.x, scale.y, scale.z);
        } else {
          _tempFloatArray[9] = 0;
        }
        this._setRTS();
      };
      nodeProto.getPosition = function getPosition(out) {
        if (out) {
          return Vec3.set(out, this._lpos.x, this._lpos.y, this._lpos.z);
        }
        return Vec3.copy(new Vec3(), this._lpos);
      };
      nodeProto.setPosition = function setPosition(val, y, z) {
        if (y === undefined && z === undefined) {
          _tempFloatArray[0] = 3;
          const pos = val;
          this._lpos.x = _tempFloatArray[1] = pos.x;
          this._lpos.y = _tempFloatArray[2] = pos.y;
          this._lpos.z = _tempFloatArray[3] = pos.z;
        } else if (z === undefined) {
          _tempFloatArray[0] = 2;
          this._lpos.x = _tempFloatArray[1] = val;
          this._lpos.y = _tempFloatArray[2] = y;
        } else {
          _tempFloatArray[0] = 3;
          this._lpos.x = _tempFloatArray[1] = val;
          this._lpos.y = _tempFloatArray[2] = y;
          this._lpos.z = _tempFloatArray[3] = z;
        }
        this._setPosition();
      };
      nodeProto.getRotation = function getRotation(out) {
        const lrot = this._lrot;
        if (out) {
          return Quat.set(out, lrot.x, lrot.y, lrot.z, lrot.w);
        }
        return Quat.copy(new Quat(), lrot);
      };
      nodeProto.setRotation = function setRotation(val, y, z, w) {
        if (y === undefined || z === undefined || w === undefined) {
          const rot = val;
          this._lrot.x = _tempFloatArray[0] = rot.x;
          this._lrot.y = _tempFloatArray[1] = rot.y;
          this._lrot.z = _tempFloatArray[2] = rot.z;
          this._lrot.w = _tempFloatArray[3] = rot.w;
        } else {
          this._lrot.x = _tempFloatArray[0] = val;
          this._lrot.y = _tempFloatArray[1] = y;
          this._lrot.z = _tempFloatArray[2] = z;
          this._lrot.w = _tempFloatArray[3] = w;
        }
        this._setRotation();
      };
      nodeProto.setRotationFromEuler = function setRotationFromEuler(val, y, zOpt) {
        const z = zOpt === undefined ? this._euler.z : zOpt;
        if (y === undefined) {
          const euler = val;
          this._euler.x = _tempFloatArray[0] = euler.x;
          this._euler.y = _tempFloatArray[1] = euler.y;
          this._euler.z = _tempFloatArray[2] = euler.z;
        } else {
          this._euler.x = _tempFloatArray[0] = val;
          this._euler.y = _tempFloatArray[1] = y;
          this._euler.z = _tempFloatArray[2] = z;
        }
        this._setRotationFromEuler();
      };
      nodeProto.getScale = function getScale(out) {
        if (out) {
          return Vec3.set(out, this._lscale.x, this._lscale.y, this._lscale.z);
        }
        return Vec3.copy(new Vec3(), this._lscale);
      };
      nodeProto.set2DTransform = function set2DTransform(x, y, angle) {
        _tempFloatArray[0] = x;
        _tempFloatArray[1] = y;
        _tempFloatArray[2] = angle;
        this._set2DTransform();
      };
      nodeProto.setScale = function setScale(val, y, z) {
        if (y === undefined && z === undefined) {
          _tempFloatArray[0] = 3;
          const scale = val;
          this._lscale.x = _tempFloatArray[1] = scale.x;
          this._lscale.y = _tempFloatArray[2] = scale.y;
          this._lscale.z = _tempFloatArray[3] = scale.z;
        } else if (z === undefined) {
          _tempFloatArray[0] = 2;
          this._lscale.x = _tempFloatArray[1] = val;
          this._lscale.y = _tempFloatArray[2] = y;
        } else {
          _tempFloatArray[0] = 3;
          this._lscale.x = _tempFloatArray[1] = val;
          this._lscale.y = _tempFloatArray[2] = y;
          this._lscale.z = _tempFloatArray[3] = z;
        }
        this._setScale();
      };
      nodeProto.getWorldPosition = function getWorldPosition(out) {
        this._getWorldPosition();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.getWorldRotation = function getWorldRotation(out) {
        this._getWorldRotation();
        out = out || new Quat();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2], _tempFloatArray[3]);
      };
      nodeProto.getWorldScale = function getWorldScale(out) {
        this._getWorldScale();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.getWorldMatrix = function getWorldMatrix(out) {
        this._getWorldMatrix();
        out = out || new Mat4();
        fillMat4WithTempFloatArray(out);
        return out;
      };
      nodeProto.getEulerAngles = function getEulerAngles(out) {
        this._getEulerAngles();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.getForward = function getForward(out) {
        this._getForward();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.getUp = function getUp(out) {
        this._getUp();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.getRight = function getRight(out) {
        this._getRight();
        out = out || new Vec3();
        return out.set(_tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
      };
      nodeProto.inverseTransformPoint = function inverseTransformPoint(out, p) {
        _tempFloatArray[0] = p.x;
        _tempFloatArray[1] = p.y;
        _tempFloatArray[2] = p.z;
        this._inverseTransformPoint();
        out.x = _tempFloatArray[0];
        out.y = _tempFloatArray[1];
        out.z = _tempFloatArray[2];
        return out;
      };
      nodeProto.getWorldRT = function getWorldRT(out) {
        out = out || new Mat4();
        this._getWorldRT();
        fillMat4WithTempFloatArray(out);
        return out;
      };
      nodeProto.getWorldRS = function getWorldRS(out) {
        out = out || new Mat4();
        this._getWorldRS();
        fillMat4WithTempFloatArray(out);
        return out;
      };
      nodeProto.isTransformDirty = function () {
        return this._transformFlags !== TransformBit.NONE;
      };
      Object.defineProperty(nodeProto, 'name', {
        configurable: true,
        enumerable: true,
        get() {
          return this._name;
        },
        set(v) {
          this._name = v;
        }
      });
      Object.defineProperty(nodeProto, 'position', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lpos;
        },
        set(v) {
          this.setPosition(v);
        }
      });
      Object.defineProperty(nodeProto, 'x', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lpos.x;
        },
        set(v) {
          this.setPosition(v, this._lpos.y, this._lpos.z);
        }
      });
      Object.defineProperty(nodeProto, 'y', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lpos.y;
        },
        set(v) {
          this.setPosition(this._lpos.x, v, this._lpos.z);
        }
      });
      Object.defineProperty(nodeProto, 'z', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lpos.z;
        },
        set(v) {
          this.setPosition(this._lpos.x, this._lpos.y, v);
        }
      });
      Object.defineProperty(nodeProto, 'rotation', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lrot;
        },
        set(v) {
          this.setRotation(v);
        }
      });
      Object.defineProperty(nodeProto, 'scale', {
        configurable: true,
        enumerable: true,
        get() {
          return this._lscale;
        },
        set(v) {
          this.setScale(v);
        }
      });
      Object.defineProperty(nodeProto, 'worldPosition', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldPosition();
        },
        set(v) {
          this.setWorldPosition(v);
        }
      });
      Object.defineProperty(nodeProto, 'worldPositionX', {
        configurable: true,
        enumerable: true,
        get() {
          this.getWorldPosition(tempVec3);
          return tempVec3.x;
        },
        set(v) {
          this.getWorldPosition(tempVec3);
          tempVec3.x = v;
          this.setWorldPosition(tempVec3);
        }
      });
      Object.defineProperty(nodeProto, 'worldPositionY', {
        configurable: true,
        enumerable: true,
        get() {
          this.getWorldPosition(tempVec3);
          return tempVec3.y;
        },
        set(v) {
          this.getWorldPosition(tempVec3);
          tempVec3.y = v;
          this.setWorldPosition(tempVec3);
        }
      });
      Object.defineProperty(nodeProto, 'worldPositionZ', {
        configurable: true,
        enumerable: true,
        get() {
          this.getWorldPosition(tempVec3);
          return tempVec3.z;
        },
        set(v) {
          this.getWorldPosition(tempVec3);
          tempVec3.z = v;
          this.setWorldPosition(tempVec3);
        }
      });
      Object.defineProperty(nodeProto, 'worldRotation', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldRotation();
        },
        set(v) {
          this.setWorldRotation(v);
        }
      });
      Object.defineProperty(nodeProto, 'worldScale', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldScale();
        },
        set(v) {
          this.setWorldScale(v);
        }
      });
      Object.defineProperty(nodeProto, '_pos', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldPosition();
        }
      });
      Object.defineProperty(nodeProto, '_rot', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldRotation();
        }
      });
      Object.defineProperty(nodeProto, '_scale', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldScale();
        }
      });
      Object.defineProperty(nodeProto, 'eulerAngles', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getEulerAngles();
        },
        set(v) {
          this.setRotationFromEuler(v.x, v.y, v.z);
        }
      });
      Object.defineProperty(nodeProto, 'worldMatrix', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldMatrix();
        }
      });
      Object.defineProperty(nodeProto, '_mat', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getWorldMatrix();
        }
      });
      Object.defineProperty(nodeProto, 'activeInHierarchy', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x01) !== 0; // Uint8, 0:0, activeInHierarchy
        },
        set(v) {
          v ? this._sharedUint8Arr[0] |= 0x01 : this._sharedUint8Arr[0] &= ~0x01; // Uint8, 0:0, activeInHierarchy
        }
      });
      Object.defineProperty(nodeProto, '_activeInHierarchy', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x01) !== 0; // Uint8, 0:0, activeInHierarchy
        },
        set(v) {
          v ? this._sharedUint8Arr[0] |= 0x01 : this._sharedUint8Arr[0] &= ~0x01; // Uint8, 0:0, activeInHierarchy
        }
      });
      Object.defineProperty(nodeProto, 'layer', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedUint32Arr[1]; // Uint32, 1: layer
        },
        set(v) {
          this._sharedUint32Arr[1] = v; // Uint32, 1: layer
          if (this._uiProps && this._uiProps.uiComp) {
            this._uiProps.uiComp.setNodeDirty();
            this._uiProps.uiComp._markForUpdateRenderData();
          }
          this.emit(NodeEventType.LAYER_CHANGED, v);
        }
      });
      Object.defineProperty(nodeProto, '_layer', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedUint32Arr[1]; // Uint32, 1: layer
        },
        set(v) {
          this._sharedUint32Arr[1] = v; // Uint32, 1: layer
        }
      });
      Object.defineProperty(nodeProto, '_eventMask', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedUint32Arr[0]; // Uint32, 0: eventMask
        },
        set(v) {
          this._sharedUint32Arr[0] = v; // Uint32, 0: eventMask
        }
      });
      Object.defineProperty(nodeProto, '_siblingIndex', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedInt32Arr[0]; // Int32, 0: siblingIndex
        },
        set(v) {
          this._sharedInt32Arr[0] = v;
        }
      });
      Object.defineProperty(nodeProto, 'prefab', {
        configurable: true,
        enumerable: true,
        get() {
          return this._prefab;
        }
      });

      // External classes need to access it through getter/setter
      Object.defineProperty(nodeProto, 'siblingIndex', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedInt32Arr[0]; // Int32, 0: siblingIndex
        },
        set(v) {
          this._sharedInt32Arr[0] = v;
        }
      });

      // note: setSiblingIndex is a JSB function, DO NOT override it
      nodeProto.getSiblingIndex = function getSiblingIndex() {
        return this._sharedInt32Arr[0]; // Int32, 0: siblingIndex
      };
      Object.defineProperty(nodeProto, '_transformFlags', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedUint32Arr[2]; // Uint32, 2: _transformFlags
        },
        set(v) {
          this._sharedUint32Arr[2] = v; // Uint32, 2: _transformFlags
        }
      });
      Object.defineProperty(nodeProto, '_active', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x02) !== 0; // Uint8, 0:1, active
        },
        set(v) {
          v ? this._sharedUint8Arr[0] |= 0x02 : this._sharedUint8Arr[0] &= ~0x02; // Uint8, 0:1, active
        }
      });
      Object.defineProperty(nodeProto, 'active', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x02) !== 0; // Uint8, 0:1, active
        },
        set(v) {
          this.setActive(!!v);
        }
      });
      Object.defineProperty(nodeProto, '_static', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x04) !== 0; // Uint8, 0:2, static
        },
        set(v) {
          v ? this._sharedUint8Arr[0] |= 0x04 : this._sharedUint8Arr[0] &= ~0x04; // Uint8, 0:2, static
        }
      });
      Object.defineProperty(nodeProto, '_colorDirty', {
        configurable: true,
        enumerable: true,
        get() {
          return (this._sharedUint8Arr[0] & 0x08) !== 0; // Uint8, 0:3, _colorDirty
        },
        set(v) {
          v ? this._sharedUint8Arr[0] |= 0x08 : this._sharedUint8Arr[0] &= ~0x08; // Uint8, 0:3, _colorDirty
        }
      });
      Object.defineProperty(nodeProto, '_skewType', {
        configurable: true,
        enumerable: true,
        get() {
          return this._sharedUint8Arr[1];
        },
        set(v) {
          this._sharedUint8Arr[1] = v;
        }
      });
      Object.defineProperty(nodeProto, 'forward', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getForward();
        },
        set(dir) {
          this.setForward(dir);
        }
      });
      Object.defineProperty(nodeProto, 'up', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getUp();
        }
      });
      Object.defineProperty(nodeProto, 'right', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getRight();
        }
      });
      Object.defineProperty(nodeProto, 'eventProcessor', {
        configurable: true,
        enumerable: true,
        get() {
          return this._eventProcessor;
        }
      });
      Object.defineProperty(nodeProto, 'components', {
        configurable: true,
        enumerable: true,
        get() {
          return this._components;
        }
      });
      Object.defineProperty(nodeProto, '_parent', {
        configurable: true,
        enumerable: true,
        get() {
          this._parentRef = this._parentInternal;
          return this._parentRef;
        },
        set(v) {
          this._parentRef = this._parentInternal = v;
        }
      });
      Object.defineProperty(nodeProto, 'parent', {
        configurable: true,
        enumerable: true,
        get() {
          this._parentRef = this.getParent();
          return this._parentRef;
        },
        set(v) {
          this._parentRef = v;
          this.setParent(v);
        }
      });
      Object.defineProperty(nodeProto, 'children', {
        configurable: true,
        enumerable: true,
        get() {
          return this._children;
        },
        set(v) {
          this._children = v;
        }
      });
      Object.defineProperty(nodeProto, 'scene', {
        configurable: true,
        enumerable: true,
        get() {
          return this._scene;
        }
      });
      Object.defineProperty(nodeProto, 'id', {
        configurable: true,
        enumerable: true,
        set(id) {
          this._id = id;
        }
      });
      nodeProto.rotate = function (rot, ns) {
        _tempFloatArray[1] = rot.x;
        _tempFloatArray[2] = rot.y;
        _tempFloatArray[3] = rot.z;
        _tempFloatArray[4] = rot.w;
        if (ns) {
          _tempFloatArray[5] = ns;
          _tempFloatArray[0] = 5;
        } else {
          _tempFloatArray[0] = 4;
        }
        this._rotateForJS();
        const lrot = this._lrot;
        lrot.x = _tempFloatArray[0];
        lrot.y = _tempFloatArray[1];
        lrot.z = _tempFloatArray[2];
        lrot.w = _tempFloatArray[3];
      };
      nodeProto.addChild = function (child) {
        child.setParent(this);
      };
      nodeProto.insertChild = function (child, siblingIndex) {
        child.parent = this;
        child.setSiblingIndex(siblingIndex);
      };
      nodeProto[serializeTag] = function (serializationOutput, context) {
        if (!EDITOR) {
          serializationOutput.writeThis();
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
      };
      nodeProto._onActiveNode = function (shouldActiveNow) {
        cclegacy.director._nodeActivator.activateNode(this, shouldActiveNow);
      };
      nodeProto._onBatchCreated = function (dontSyncChildPrefab) {
        if (this._eventMask & ACTIVE_ON) {
          if (!this._activeInHierarchy) {
            this.emit(NodeEventType.ACTIVE_CHANGED, this, false);
          }
        }
        this.hasChangedFlags = TRANSFORMBIT_TRS;
        const children = this._children;
        const len = children.length;
        let child;
        for (let i = 0; i < len; ++i) {
          child = children[i];
          child._siblingIndex = i;
          child._onBatchCreated(dontSyncChildPrefab);
        }

        // Sync node _lpos, _lrot, _lscale to native
        syncNodeValues(this);
      };
      nodeProto._onSceneUpdated = function (scene) {
        this._scene = scene;
      };
      nodeProto._onLocalPositionUpdated = function (x, y, z) {
        const lpos = this._lpos;
        lpos.x = x;
        lpos.y = y;
        lpos.z = z;
      };
      nodeProto._onLocalRotationUpdated = function (x, y, z, w) {
        const lrot = this._lrot;
        lrot.x = x;
        lrot.y = y;
        lrot.z = z;
        lrot.w = w;
      };
      nodeProto._onLocalScaleUpdated = function (x, y, z) {
        const lscale = this._lscale;
        lscale.x = x;
        lscale.y = y;
        lscale.z = z;
      };
      nodeProto._onLocalPositionRotationScaleUpdated = function (px, py, pz, rx, ry, rz, rw, sx, sy, sz) {
        const lpos = this._lpos;
        lpos.x = px;
        lpos.y = py;
        lpos.z = pz;
        const lrot = this._lrot;
        lrot.x = rx;
        lrot.y = ry;
        lrot.z = rz;
        lrot.w = rw;
        const lscale = this._lscale;
        lscale.x = sx;
        lscale.y = sy;
        lscale.z = sz;
      };
      nodeProto._instantiate = function (cloned, isSyncedNode) {
        if (!cloned) {
          cloned = cclegacy.instantiate._clone(this, this);
        }

        // TODO(PP_Pro): after we support editorOnly tag, we could remove this any type assertion.
        // Tracking issue: https://github.com/cocos/cocos-engine/issues/14613
        const newPrefabInfo = cloned._prefab;
        if (EDITOR && newPrefabInfo) {
          if (cloned === newPrefabInfo.root) {
            EditorExtends.PrefabUtils.addPrefabInstance == null || EditorExtends.PrefabUtils.addPrefabInstance(cloned);
            // newPrefabInfo.fileId = '';
          } else {
            // var PrefabUtils = Editor.require('scene://utils/prefab');
            // PrefabUtils.unlinkPrefab(cloned);
          }
        }

        // reset and init
        // NOTE: access protected property
        cloned._parent = null;
        cloned._onBatchCreated(isSyncedNode);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cloned;
      };
      nodeProto._getUITransformComp = function () {
        return this._uiProps.uiTransformComp;
      };
      nodeProto._onSiblingIndexChanged = function (index) {
        const siblings = this._parent._children;
        index = index !== -1 ? index : siblings.length - 1;
        const oldIndex = siblings.indexOf(this);
        if (index !== oldIndex) {
          siblings.splice(oldIndex, 1);
          if (index < siblings.length) {
            siblings.splice(index, 0, this);
          } else {
            siblings.push(this);
          }
          this._eventProcessor.onUpdatingSiblingIndex();
        }
      };
      nodeProto._setSkew = function (v) {
        this._sharedFloat32Arr[0] = v.x;
        this._sharedFloat32Arr[1] = v.y;
      };
      nodeProto._getSkewX = function () {
        return this._sharedFloat32Arr[0];
      };
      nodeProto._setSkewX = function (v) {
        this._sharedFloat32Arr[0] = v;
      };
      nodeProto._getSkewY = function () {
        return this._sharedFloat32Arr[1];
      };
      nodeProto._setSkewY = function (v) {
        this._sharedFloat32Arr[1] = v;
      };
      nodeProto._getLocalOpacity = function () {
        return this._sharedFloat32Arr[2];
      };
      nodeProto._setLocalOpacity = function (v) {
        this._sharedFloat32Arr[2] = v;
      };
      nodeProto._getFinalOpacity = function () {
        return this._sharedFloat32Arr[3];
      };
      nodeProto._setFinalOpacity = function (v) {
        this._sharedFloat32Arr[3] = v;
      };

      //
      nodeProto._ctor = function (name) {
        this.__nativeRefs = {};
        this._parentRef = null;
        this.__jsb_ref_id = undefined;
        this._iN$t = null;
        this.__editorExtras__ = {
          editorOnly: true
        };
        this._components = [];
        this._eventProcessor = new NodeEventProcessor(this);
        this._uiProps = new NodeUIProperties(this);
        const sharedArrayBuffer = this._initAndReturnSharedBuffer();
        // Uint32Array with 3 elements: eventMask, layer, dirtyFlags
        this._sharedUint32Arr = new Uint32Array(sharedArrayBuffer, 0, 3);
        // Int32Array with 1 element: siblingIndex
        this._sharedInt32Arr = new Int32Array(sharedArrayBuffer, 12, 1);
        // Uint8Array with 4 elements: (activeInHierarchy, active, static, localOpacityDirty) uses 1 bytes for booleans, skewType, 2 bytes padding
        this._sharedUint8Arr = new Uint8Array(sharedArrayBuffer, 16, 4);
        // Float32Array with 4 elements: skewX, skewY, localOpacity, finalOpacity
        this._sharedFloat32Arr = new Float32Array(sharedArrayBuffer, 20, 4);
        this._sharedUint32Arr[1] = Layers.Enum.DEFAULT; // this._sharedUint32Arr[1] is layer
        this._scene = null;
        this._prefab = null;
        // record scene's id when set this node as persist node
        this._originalSceneId = '';
        this._children = [];
        // this._isChildrenRedefined = false;

        this._lpos = new Vec3();
        this._lrot = new Quat();
        this._lscale = new Vec3(1, 1, 1);
        this._euler = new Vec3();
        this._registeredNodeEventTypeMask = 0;
      };
      nodePolyfill(Node);

      //  handle meta data, it is generated automatically
      patch_cc_Node({
        Node,
        Vec3,
        Quat,
        MobilityMode,
        Layers
      });
    }
  };
});