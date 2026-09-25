System.register("q-bundled:///fs/cocos/2d/framework/ui-transform.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../scene-graph/index.js", "../../core/index.js", "../../game/director.js", "../../scene-graph/node-event.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, executionOrder, menu, tooltip, displayOrder, serializable, disallowMultiple, EDITOR, Component, Mat4, Rect, Size, Vec2, Vec3, geometry, warnID, visibleRect, approx, EPSILON, director, DirectorEvent, NodeEventType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _UITransform, _vec2a, _vec2b, _vec3a, _mat4_temp, _matrix, _worldMatrix, _zeroMatrix, _rect, UITransform;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      Rect = _coreIndexJs.Rect;
      Size = _coreIndexJs.Size;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      geometry = _coreIndexJs.geometry;
      warnID = _coreIndexJs.warnID;
      visibleRect = _coreIndexJs.visibleRect;
      approx = _coreIndexJs.approx;
      EPSILON = _coreIndexJs.EPSILON;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
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
      _vec2a = new Vec2();
      _vec2b = new Vec2();
      _vec3a = new Vec3();
      _mat4_temp = new Mat4();
      _matrix = new Mat4();
      _worldMatrix = new Mat4();
      _zeroMatrix = new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      _rect = new Rect();
      /**
       * @en
       * The component of transform in UI.
       *
       * @zh
       * UI 变换组件。
       */
      _export("UITransform", UITransform = (_dec = ccclass('cc.UITransform'), _dec2 = help('i18n:cc.UITransform'), _dec3 = executionOrder(110), _dec4 = menu('UI/UITransform'), _dec5 = displayOrder(0), _dec6 = tooltip('i18n:ui_transform.content_size'), _dec7 = displayOrder(1), _dec8 = tooltip('i18n:ui_transform.anchor_point'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = (_UITransform = class UITransform extends Component {
        constructor() {
          super();
          this._priority = 0;
          _initializerDefineProperty(this, "_contentSize", _descriptor, this);
          _initializerDefineProperty(this, "_anchorPoint", _descriptor2, this);
        }

        /**
         * @en
         * Size of the UI node.
         *
         * @zh
         * 内容尺寸。
         */
        get contentSize() {
          return this._contentSize;
        }
        set contentSize(value) {
          if (this._contentSize.equals(value)) {
            return;
          }
          if (EDITOR) {
            const clone = new Size(this._contentSize);
            this._contentSize.set(value);
            this.node.emit(NodeEventType.SIZE_CHANGED, clone);
          } else {
            this._contentSize.set(value);
            this.node.emit(NodeEventType.SIZE_CHANGED);
          }
          this._markRenderDataDirty();
        }

        /**
         * @en
         * component width.
         * @zh
         * 组件宽度。
         */
        get width() {
          return this._contentSize.width;
        }
        set width(value) {
          if (this._contentSize.width === value) {
            return;
          }
          if (EDITOR) {
            const clone = new Size(this._contentSize);
            this._contentSize.width = value;
            this.node.emit(NodeEventType.SIZE_CHANGED, clone);
          } else {
            this._contentSize.width = value;
            this.node.emit(NodeEventType.SIZE_CHANGED);
          }
          this._markRenderDataDirty();
        }

        /**
         * @en
         * component height.
         * @zh
         * 组件高度。
         */
        get height() {
          return this._contentSize.height;
        }
        set height(value) {
          if (this.contentSize.height === value) {
            return;
          }
          if (EDITOR) {
            const clone = new Size(this._contentSize);
            this._contentSize.height = value;
            this.node.emit(NodeEventType.SIZE_CHANGED, clone);
          } else {
            this._contentSize.height = value;
            this.node.emit(NodeEventType.SIZE_CHANGED);
          }
          this._markRenderDataDirty();
        }

        /**
         * @en
         * Anchor point of the UI node.
         *
         * @zh
         * 锚点位置。
         */
        get anchorPoint() {
          return this._anchorPoint;
        }
        set anchorPoint(value) {
          if (this._anchorPoint.equals(value)) {
            return;
          }
          this._anchorPoint.set(value);
          this.node.emit(NodeEventType.ANCHOR_CHANGED, this._anchorPoint);
          this._markRenderDataDirty();
        }

        /**
         * @en
         * The x-axis anchor of the node.
         *
         * @zh
         * 锚点位置的 X 坐标。
         */
        get anchorX() {
          return this._anchorPoint.x;
        }
        set anchorX(value) {
          if (this._anchorPoint.x === value) {
            return;
          }
          this._anchorPoint.x = value;
          this.node.emit(NodeEventType.ANCHOR_CHANGED, this._anchorPoint);
          this._markRenderDataDirty();
        }

        /**
         * @en
         * The y-axis anchor of the node.
         *
         * @zh
         * 锚点位置的 Y 坐标。
         */
        get anchorY() {
          return this._anchorPoint.y;
        }
        set anchorY(value) {
          if (this._anchorPoint.y === value) {
            return;
          }
          this._anchorPoint.y = value;
          this.node.emit(NodeEventType.ANCHOR_CHANGED, this._anchorPoint);
          this._markRenderDataDirty();
        }

        /**
         * @en
         * Render sequence.
         * Note: UI rendering is only about priority.
         *
         * @zh
         * 渲染先后顺序，按照广度渲染排列，按同级节点下进行一次排列。
         * @deprecated Since v3.1
         */
        get priority() {
          return this._priority;
        }
        set priority(value) {
          if (this._priority === value) {
            return;
          }
          if (this.node.getComponent('cc.RenderRoot2D')) {
            warnID(6706);
            return;
          }
          this._priority = value;
          if (this.node.parent) {
            UITransform.insertChangeMap(this.node.parent);
          }
        }
        /**
         * @en Get the visibility bit-mask of the rendering camera
         * @zh 查找被渲染相机的可见性掩码。
         * @deprecated since v3.0
         */
        get visibility() {
          const camera = director.root.batcher2D.getFirstRenderCamera(this.node);
          return camera ? camera.visibility : 0;
        }

        /**
         * @en Get the priority of the rendering camera
         * @zh 查找被渲染相机的渲染优先级。
         */
        get cameraPriority() {
          const camera = director.root.batcher2D.getFirstRenderCamera(this.node);
          return camera ? camera.priority : 0;
        }
        __preload() {
          this.node._uiProps.uiTransformComp = this;
        }
        onLoad() {
          if (this.node.parent) {
            UITransform.insertChangeMap(this.node.parent);
          }
        }
        onEnable() {
          this.node.on(NodeEventType.PARENT_CHANGED, this._parentChanged, this);
          this._markRenderDataDirty();
        }
        onDisable() {
          this.node.off(NodeEventType.PARENT_CHANGED, this._parentChanged, this);
        }
        onDestroy() {
          this.node._uiProps.uiTransformComp = null;
        }

        /**
         * @en
         * Sets the untransformed size of the ui transform.<br/>
         * The contentSize remains the same no matter if the node is scaled or rotated.<br/>
         * @zh
         * 设置节点 UI Transform 的原始大小，不受该节点是否被缩放或者旋转的影响。
         *
         * @param size @en The size of the UI transform. @zh UI Transform 的 Size 大小。
         * @example
         * ```ts
         * import { Size } from 'cc';
         * node.setContentSize(new Size(100, 100));
         * ```
         */

        /**
         * @en
         * Sets the untransformed size of the ui transform.<br/>
         * The contentSize remains the same no matter if the node is scaled or rotated.<br/>
         * @zh
         * 设置节点 UI Transform 的原始大小，不受该节点是否被缩放或者旋转的影响。
         *
         * @param width  @en The width of the UI transform. @zh UI Transform 的宽。
         * @param height @en The height of the UI transform. @zh UI Transform 的高。
         * @example
         * ```ts
         * import { Size } from 'cc';
         * node.setContentSize(100, 100);
         * ```
         */

        setContentSize(size, height) {
          const locContentSize = this._contentSize;
          let locWidth;
          let locHeight;
          if (height === undefined) {
            size = size;
            if (approx(size.width, locContentSize.width, EPSILON) && approx(size.height, locContentSize.height, EPSILON)) {
              return;
            }
            locWidth = size.width;
            locHeight = size.height;
          } else {
            size = size;
            if (approx(size, locContentSize.width, EPSILON) && approx(height, locContentSize.height, EPSILON)) {
              return;
            }
            locWidth = size;
            locHeight = height;
          }
          if (EDITOR) {
            const clone = new Size(this._contentSize);
            locContentSize.width = locWidth;
            locContentSize.height = locHeight;
            this.node.emit(NodeEventType.SIZE_CHANGED, clone);
          } else {
            locContentSize.width = locWidth;
            locContentSize.height = locHeight;
            this.node.emit(NodeEventType.SIZE_CHANGED);
          }
          this._markRenderDataDirty();
        }

        /**
         * @en
         * Sets the anchor point in percent. <br/>
         * anchor point is the point around which all transformations and positioning manipulations take place. <br/>
         * It's like a pin in the node where it is "attached" to its parent. <br/>
         * The anchorPoint is normalized, like a percentage. (0,0) means the bottom-left corner and (1,1) means the top-right corner.<br/>
         * But you can use values higher than (1,1) and lower than (0,0) too.<br/>
         * The default anchor point is (0.5,0.5), so it starts at the center of the node.
         *
         * @zh
         * 设置锚点的百分比。<br>
         * 锚点应用于所有变换和坐标点的操作，它就像在节点上连接其父节点的大头针。<br>
         * 锚点是标准化的，就像百分比一样。(0，0) 表示左下角，(1，1) 表示右上角。<br>
         * 但是你可以使用比（1，1）更高的值或者比（0，0）更低的值。<br>
         * 默认的锚点是（0.5，0.5），因此它开始于节点的中心位置。<br>
         * 注意：Creator 中的锚点仅用于定位所在的节点，子节点的定位不受影响。
         *
         * @param point @en Node anchor point or node x-axis anchor.
         *              @zh 节点锚点或节点 x 轴锚。
         * @param y @en The y-axis anchor of the node.
         *          @zh 节点 y 轴锚。
         * @example
         * ```ts
         * import { Vec2 } from 'cc';
         * node.setAnchorPoint(new Vec2(1, 1));
         * node.setAnchorPoint(1, 1);
         * ```
         */
        setAnchorPoint(point, y) {
          const locAnchorPoint = this._anchorPoint;
          if (y === undefined) {
            point = point;
            if (point.x === locAnchorPoint.x && point.y === locAnchorPoint.y) {
              return;
            }
            locAnchorPoint.x = point.x;
            locAnchorPoint.y = point.y;
          } else {
            if (point === locAnchorPoint.x && y === locAnchorPoint.y) {
              return;
            }
            locAnchorPoint.x = point;
            locAnchorPoint.y = y;
          }

          // this.setLocalDirty(LocalDirtyFlag.POSITION);
          // if (this._eventMask & ANCHOR_ON) {
          this.node.emit(NodeEventType.ANCHOR_CHANGED, this._anchorPoint);
          this._markRenderDataDirty();
          // }
        }

        /**
         * @zh UI 空间中的点击测试。
         * @en Hit test with point in UI Space.
         *
         * @param uiPoint point in UI Space.
         * @deprecated since v3.5.0, please use `uiTransform.hitTest(screenPoint: Vec2)` instead.
         */
        isHit(uiPoint) {
          const w = this._contentSize.width;
          const h = this._contentSize.height;
          const v2WorldPt = _vec2a;
          const testPt = _vec2b;
          const cameras = this._getRenderScene().cameras;
          for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (!(camera.visibility & this.node.layer)) continue;

            // Convert UI Space into World Space.
            camera.node.getWorldRT(_mat4_temp);
            const m12 = _mat4_temp.m12;
            const m13 = _mat4_temp.m13;
            const center = visibleRect.center;
            _mat4_temp.m12 = center.x - (_mat4_temp.m00 * m12 + _mat4_temp.m04 * m13);
            _mat4_temp.m13 = center.y - (_mat4_temp.m01 * m12 + _mat4_temp.m05 * m13);
            Mat4.invert(_mat4_temp, _mat4_temp);
            Vec2.transformMat4(v2WorldPt, uiPoint, _mat4_temp);

            // Convert World Space into Local Node Space.
            this.node.getWorldMatrix(_worldMatrix);
            Mat4.invert(_mat4_temp, _worldMatrix);
            if (Mat4.strictEquals(_mat4_temp, _zeroMatrix)) {
              continue;
            }
            Vec2.transformMat4(testPt, v2WorldPt, _mat4_temp);
            testPt.x += this._anchorPoint.x * w;
            testPt.y += this._anchorPoint.y * h;
            let hit = false;
            if (testPt.x >= 0 && testPt.y >= 0 && testPt.x <= w && testPt.y <= h) {
              hit = this._maskTest(v2WorldPt);
            }
            if (hit) {
              return true;
            }
          }
          return false;
        }

        /**
         * @zh 屏幕空间中的点击测试。
         * @en Hit test with point in Screen Space.
         *
         * @param screenPoint @en point in Screen Space. @zh 屏幕坐标中的点。
         */
        hitTest(screenPoint, windowId = 0) {
          const w = this._contentSize.width;
          const h = this._contentSize.height;
          const v3WorldPt = _vec3a;
          const v2WorldPt = _vec2a;
          const testPt = _vec2b;
          const cameras = this._getRenderScene().cameras;
          for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (!(camera.visibility & this.node.layer) || camera.window && !camera.window.swapchain) {
              continue;
            }
            if (camera.systemWindowId !== windowId) {
              continue;
            }

            // Convert Screen Space into World Space.
            Vec3.set(v3WorldPt, screenPoint.x, screenPoint.y, 0); // vec3 screen pos
            camera.screenToWorld(v3WorldPt, v3WorldPt);
            Vec2.set(v2WorldPt, v3WorldPt.x, v3WorldPt.y);

            // Convert World Space into Local Node Space.
            this.node.getWorldMatrix(_worldMatrix);
            Mat4.invert(_mat4_temp, _worldMatrix);
            if (Mat4.strictEquals(_mat4_temp, _zeroMatrix)) {
              continue;
            }
            Vec2.transformMat4(testPt, v2WorldPt, _mat4_temp);
            testPt.x += this._anchorPoint.x * w;
            testPt.y += this._anchorPoint.y * h;
            let hit = false;
            if (testPt.x >= 0 && testPt.y >= 0 && testPt.x <= w && testPt.y <= h) {
              hit = this._maskTest(v2WorldPt);
            }
            if (hit) {
              return true;
            }
          }
          return false;
        }
        _maskTest(pointInWorldSpace) {
          var _this$node;
          const maskList = (_this$node = this.node) == null || (_this$node = _this$node.eventProcessor) == null ? void 0 : _this$node.maskList;
          if (maskList) {
            let parent = this.node;
            const length = maskList.length;
            // find mask parent, should hit test it
            for (let i = 0, j = 0; parent && j < length; ++i, parent = parent.parent) {
              const temp = maskList[j];
              if (i === temp.index) {
                if (parent === temp.comp.node) {
                  const comp = temp.comp;
                  if (comp && comp._enabled && !comp.isHit(pointInWorldSpace)) {
                    return false;
                  }
                  j++;
                } else {
                  // mask parent no longer exists
                  maskList.length = j;
                  break;
                }
              } else if (i > temp.index) {
                // mask parent no longer exists
                maskList.length = j;
                break;
              }
            }
          }
          return true;
        }

        /**
         * @en
         * Converts a Point to node (local) space coordinates.
         *
         * @zh
         * 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点。
         * 非 UI 节点转换到 UI 节点(局部) 空间坐标系，请走 Camera 的 `convertToUINode`。
         *
         * @param worldPoint @en Point in world space.
         *                   @zh 世界坐标点。
         * @param out @en Point in local space.
         *            @zh 转换后坐标。
         * @returns @en Return the relative position to the target node.
         *          @zh 返回与目标节点的相对位置。
         * @example
         * ```ts
         * const newVec3 = uiTransform.convertToNodeSpaceAR(cc.v3(100, 100, 0));
         * ```
         */
        convertToNodeSpaceAR(worldPoint, out) {
          this.node.getWorldMatrix(_worldMatrix);
          Mat4.invert(_mat4_temp, _worldMatrix);
          if (!out) {
            out = new Vec3();
          }
          return Vec3.transformMat4(out, worldPoint, _mat4_temp);
        }

        /**
         * @en
         * Converts a Point in node coordinates to world space coordinates.
         *
         * @zh
         * 将距当前节点坐标系下的一个点转换到世界坐标系。
         *
         * @param nodePoint @en Point in local space.
         *                  @zh 节点坐标。
         * @param out @en Point in world space.
         *            @zh 转换后坐标。
         * @returns @en Returns the coordinates in the UI world coordinate system.
         *          @zh 返回 UI 世界坐标系。
         * @example
         * ```ts
         * const newVec3 = uiTransform.convertToWorldSpaceAR(3(100, 100, 0));
         * ```
         */
        convertToWorldSpaceAR(nodePoint, out) {
          this.node.getWorldMatrix(_worldMatrix);
          if (!out) {
            out = new Vec3();
          }
          return Vec3.transformMat4(out, nodePoint, _worldMatrix);
        }

        /**
         * @en
         * Returns an axis aligned bounding box of this node in local space coordinate.
         * The returned box is relative only to its parent, and it doesn't contain any child nodes.
         * The behavior is slightly different with [[getBoundingBoxToWorld]] and [[getBoundingBoxTo]].
         *
         * @zh
         * 返回父节坐标系下的轴向对齐的包围盒。
         * 返回的包围盒仅仅只包含当前节点的轴向对齐包围盒，不包含子节点。
         * 这个 API 的行为和 [[getBoundingBoxToWorld]] 和 [[getBoundingBoxTo]] 略有不同。
         *
         * @returns @en An axis aligned bounding box of this node in local space coordinate.  @zh 本地坐标系下的包围盒。
         * @example
         * ```ts
         * const boundingBox = uiTransform.getBoundingBox();
         * ```
         */
        getBoundingBox() {
          const rect = new Rect();
          this._selfBoundingBox(rect);
          Mat4.fromSRT(_matrix, this.node.rotation, this.node.position, this.node.scale);
          rect.transformMat4(_matrix);
          return rect;
        }

        /**
         * @en
         * Returns an axis aligned bounding box of this node in world space coordinate.
         * The bounding box contains self and active children's world bounding box, and it will eliminate all zero sized nodes.
         * @zh
         * 返回节点在世界坐标系下的对齐轴向的包围盒（AABB）。
         * 该边框包含自身和已激活的子节点的世界边框，但会剔除所有零大小的节点。
         * @returns @en An axis aligned bounding box of this node in world space coordinate. @zh 世界坐标系下包围盒。
         * @example
         * ```ts
         * const newRect = uiTransform.getBoundingBoxToWorld();
         * ```
         */
        getBoundingBoxToWorld() {
          const rect = new Rect();
          const locChildren = this.node.children;
          for (let i = 0; i < locChildren.length; ++i) {
            const child = locChildren[i];
            if (child && child.active) {
              const uiTransform = child.getComponent(UITransform);
              // Zero sized rect is not accepted
              if (uiTransform && uiTransform.contentSize.width && uiTransform.contentSize.height) {
                uiTransform._selfBoundingBox(_rect);
                _rect.transformMat4(child.worldMatrix);
                if (rect.width === 0) {
                  // Initializing
                  rect.set(_rect);
                } else {
                  Rect.union(rect, rect, _rect);
                }
              }
            }
          }
          if (this._contentSize.width && this._contentSize.height) {
            this._selfBoundingBox(_rect);
            _rect.transformMat4(this.node.worldMatrix);
            if (rect.width === 0) {
              // Initializing
              rect.set(_rect);
            } else {
              Rect.union(rect, rect, _rect);
            }
          }
          return rect;
        }

        /**
         * @en
         * Returns the minimum bounding box in the coordinate system of the target node.
         * The result contains the current node and its child node tree, and it will eliminates all zero size nodes.
         * E.g. passing an identical matrix will return the world bounding box of the current node tree.
         * @zh
         * 返回在目标节点坐标系下包含当前包围盒及其子节点包围盒的最小总包围盒，但会剔除所有零大小的节点。
         * 如果传入单位矩阵，将得到世界坐标系下的包围盒。
         *
         * @param targetMat @en The target node's world matrix representing its coordinate system.
         *                  @zh 表示目标节点坐标系的世界矩阵。
         * @returns @en The minimum bounding box containing the current bounding box and its child nodes.
         *          @zh 包含当前节点包围盒及其子节点包围盒的最小包围盒。
         */
        getBoundingBoxTo(targetMat) {
          const rect = new Rect();
          const locChildren = this.node.children;
          Mat4.invert(_mat4_temp, targetMat);
          for (let i = 0; i < locChildren.length; ++i) {
            const child = locChildren[i];
            if (child && child.active) {
              const uiTransform = child.getComponent(UITransform);
              // Zero sized rect is not accepted
              if (uiTransform && uiTransform.contentSize.width && uiTransform.contentSize.height) {
                uiTransform._selfBoundingBox(_rect);
                // Must combine all matrix because rect can only be transformed once.
                Mat4.multiply(_matrix, child.worldMatrix, _mat4_temp);
                _rect.transformMat4(_matrix);
                if (rect.width === 0) {
                  // Initializing
                  rect.set(_rect);
                } else {
                  Rect.union(rect, rect, _rect);
                }
              }
            }
          }
          if (this._contentSize.width && this._contentSize.height) {
            this._selfBoundingBox(_rect);
            // Must combine all matrix because rect can only be transformed once.
            Mat4.multiply(_matrix, this.node.worldMatrix, _mat4_temp);
            _rect.transformMat4(_matrix);
            if (rect.width === 0) {
              // Initializing
              rect.set(_rect);
            } else {
              Rect.union(rect, rect, _rect);
            }
          }
          return rect;
        }

        /**
         * @en
         * Compute the corresponding aabb in world space for raycast.
         * @zh
         * 计算出此 UI_2D 节点在世界空间下的 aabb 包围盒。
         * @param out @en The out object of aabb bounding box of the node in world space.  @zh 输出节点在世界空间下的 aabb 包围盒。
         * @returns @en The aabb bounding box of the node in world space. @zh 节点在世界空间下的 aabb 包围盒。
         */
        getComputeAABB(out) {
          const width = this._contentSize.width;
          const height = this._contentSize.height;
          _rect.set(-this._anchorPoint.x * width, -this._anchorPoint.y * height, width, height);
          _rect.transformMat4(this.node.worldMatrix);
          const px = _rect.x + _rect.width * 0.5;
          const py = _rect.y + _rect.height * 0.5;
          const pz = this.node.worldPosition.z;
          const w = _rect.width / 2;
          const h = _rect.height / 2;
          const l = 0.001;
          if (out != null) {
            geometry.AABB.set(out, px, py, pz, w, h, l);
            return out;
          } else {
            return new geometry.AABB(px, py, pz, w, h, l);
          }
        }
        _selfBoundingBox(out) {
          const width = this._contentSize.width;
          const height = this._contentSize.height;
          out.set(-this._anchorPoint.x * width, -this._anchorPoint.y * height, width, height);
          return out;
        }
        _parentChanged(node) {
          if (this.node.getComponent('cc.RenderRoot2D')) {
            return;
          }
          if (this.node.parent) {
            UITransform.insertChangeMap(this.node.parent);
          }
        }
        _markRenderDataDirty() {
          const uiComp = this.node._uiProps.uiComp;
          if (uiComp) {
            uiComp._markForUpdateRenderData();
          }
        }
        static insertChangeMap(node) {
          const key = node.uuid;
          if (!UITransform.priorityChangeNodeMap.has(key)) {
            UITransform.priorityChangeNodeMap.set(key, node);
          }
        }
        static _sortChildrenSibling(node) {
          const siblings = node.children;
          if (siblings) {
            siblings.sort((a, b) => {
              const aComp = a._getUITransformComp();
              const bComp = b._getUITransformComp();
              const ca = aComp ? aComp._priority : 0;
              const cb = bComp ? bComp._priority : 0;
              const diff = ca - cb;
              if (diff === 0) return a.siblingIndex - b.siblingIndex;
              return diff;
            });
          }
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         * @engineInternal
         * @mangle
         */
        static _sortSiblings() {
          UITransform.priorityChangeNodeMap.forEach((node, ID) => {
            UITransform._sortChildrenSibling(node);
            node._updateSiblingIndex();
            node.emit('childrenSiblingOrderChanged');
          });
          UITransform.priorityChangeNodeMap.clear();
        }

        /**
         * @deprecated Since v3.7.0, this is an engine private interface that will be removed in the future.
         * @engineInternal
         * @mangle
         */
        static _cleanChangeMap() {
          UITransform.priorityChangeNodeMap.clear();
        }
      }, _UITransform.EventType = NodeEventType, _UITransform.priorityChangeNodeMap = new Map(), _UITransform), _applyDecoratedDescriptor(_class2.prototype, "contentSize", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "contentSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "anchorPoint", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "anchorPoint"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_contentSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Size(100, 100);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_anchorPoint", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2(0.5, 0.5);
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class)); // HACK
      director.on(DirectorEvent.AFTER_UPDATE, UITransform._sortSiblings);
      director.on(DirectorEvent.BEFORE_SCENE_LAUNCH, UITransform._cleanChangeMap);
    }
  };
});