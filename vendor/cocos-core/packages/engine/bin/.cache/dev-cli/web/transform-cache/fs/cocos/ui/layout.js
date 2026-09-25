System.register("q-bundled:///fs/cocos/ui/layout.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../core/math/index.js", "../core/value-types/enum.js", "../2d/framework/ui-transform.js", "../game/director.js", "../scene-graph/node-enum.js", "../core/index.js", "../scene-graph/node-event.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, executionOrder, menu, requireComponent, tooltip, type, displayOrder, serializable, visible, Component, Size, Vec3, ccenum, UITransform, director, DirectorEvent, TransformBit, warnID, NodeEventType, legacyCC, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _Layout, LayoutType, LayoutResizeMode, LayoutAxisDirection, LayoutVerticalDirection, LayoutHorizontalDirection, LayoutConstraint, _tempVec3, Layout;
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
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreMathIndexJs) {
      Size = _coreMathIndexJs.Size;
      Vec3 = _coreMathIndexJs.Vec3;
    }, function (_coreValueTypesEnumJs) {
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_dFrameworkUiTransformJs) {
      UITransform = _dFrameworkUiTransformJs.UITransform;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
       * @en Layout type.
       *
       * @zh 布局类型。
       */
      _export("LayoutType", LayoutType = /*#__PURE__*/function (LayoutType) {
        /**
         * @en No layout.
         *
         * @zh 禁用布局。
         */
        LayoutType[LayoutType["NONE"] = 0] = "NONE";
        /**
         * @en Horizontal layout.
         *
         * @zh 水平布局。
         */
        LayoutType[LayoutType["HORIZONTAL"] = 1] = "HORIZONTAL";
        /**
         * @en Vertical layout.
         *
         * @zh 垂直布局。
         */
        LayoutType[LayoutType["VERTICAL"] = 2] = "VERTICAL";
        /**
         * @en Grid layout.
         *
         * @zh 网格布局。
         */
        LayoutType[LayoutType["GRID"] = 3] = "GRID";
        return LayoutType;
      }({}));
      ccenum(LayoutType);

      /**
       * @en Layout Resize Mode.
       *
       * @zh 缩放模式。
       */
      _export("LayoutResizeMode", LayoutResizeMode = /*#__PURE__*/function (LayoutResizeMode) {
        /**
         * @en Don't scale.
         *
         * @zh 不做任何缩放。
         */
        LayoutResizeMode[LayoutResizeMode["NONE"] = 0] = "NONE";
        /**
         * @en The container size will be expanded with its children's size.
         *
         * @zh 容器的大小会根据子节点的大小自动缩放。
         */
        LayoutResizeMode[LayoutResizeMode["CONTAINER"] = 1] = "CONTAINER";
        /**
         * @en Child item size will be adjusted with the container's size.
         *
         * @zh 子节点的大小会随着容器的大小自动缩放。
         */
        LayoutResizeMode[LayoutResizeMode["CHILDREN"] = 2] = "CHILDREN";
        return LayoutResizeMode;
      }({}));
      ccenum(LayoutResizeMode);

      /**
       * @en Grid Layout start axis direction.
       *
       * @zh 布局轴向，只用于 GRID 布局。
       */
      _export("LayoutAxisDirection", LayoutAxisDirection = /*#__PURE__*/function (LayoutAxisDirection) {
        /**
         * @en The horizontal axis.
         *
         * @zh 进行水平方向布局。
         */
        LayoutAxisDirection[LayoutAxisDirection["HORIZONTAL"] = 0] = "HORIZONTAL";
        /**
         * @en The vertical axis.
         *
         * @zh 进行垂直方向布局。
         */
        LayoutAxisDirection[LayoutAxisDirection["VERTICAL"] = 1] = "VERTICAL";
        return LayoutAxisDirection;
      }({}));
      ccenum(LayoutAxisDirection);

      /**
       * @en Vertical layout direction.
       *
       * @zh 垂直方向布局方式。
       */
      _export("LayoutVerticalDirection", LayoutVerticalDirection = /*#__PURE__*/function (LayoutVerticalDirection) {
        /**
         * @en Items arranged from bottom to top.
         *
         * @zh 从下到上排列。
         */
        LayoutVerticalDirection[LayoutVerticalDirection["BOTTOM_TO_TOP"] = 0] = "BOTTOM_TO_TOP";
        /**
         * @en Items arranged from top to bottom.
         * @zh 从上到下排列。
         */
        LayoutVerticalDirection[LayoutVerticalDirection["TOP_TO_BOTTOM"] = 1] = "TOP_TO_BOTTOM";
        return LayoutVerticalDirection;
      }({}));
      ccenum(LayoutVerticalDirection);

      /**
       * @en Horizontal layout direction.
       *
       * @zh 水平方向布局方式。
       */
      _export("LayoutHorizontalDirection", LayoutHorizontalDirection = /*#__PURE__*/function (LayoutHorizontalDirection) {
        /**
         * @en Items arranged from left to right.
         *
         * @zh 从左往右排列。
         */
        LayoutHorizontalDirection[LayoutHorizontalDirection["LEFT_TO_RIGHT"] = 0] = "LEFT_TO_RIGHT";
        /**
         * @en Items arranged from right to left.
         * @zh 从右往左排列。
         */
        LayoutHorizontalDirection[LayoutHorizontalDirection["RIGHT_TO_LEFT"] = 1] = "RIGHT_TO_LEFT";
        return LayoutHorizontalDirection;
      }({}));
      ccenum(LayoutHorizontalDirection);

      /**
       * @en Layout constraint.
       *
       * @zh 布局约束。
       */
      _export("LayoutConstraint", LayoutConstraint = /*#__PURE__*/function (LayoutConstraint) {
        /**
         * @en Constraint free.
         *
         * @zh 自由排布。
         */
        LayoutConstraint[LayoutConstraint["NONE"] = 0] = "NONE";
        /**
         * @en Keep the number of rows fixed.
         *
         * @zh 固定行。
         */
        LayoutConstraint[LayoutConstraint["FIXED_ROW"] = 1] = "FIXED_ROW";
        /**
         * @en Keep the number of rows fixed columns.
         *
         * @zh 固定列。
         */
        LayoutConstraint[LayoutConstraint["FIXED_COL"] = 2] = "FIXED_COL";
        return LayoutConstraint;
      }({}));
      ccenum(LayoutConstraint);
      _tempVec3 = new Vec3();
      /**
       * @en
       * The Layout is a container component, use it to arrange child elements easily.<br>
       * Note：<br>
       * 1.Scaling and rotation of child nodes are not considered.<br>
       * 2.After setting the Layout, the results need to be updated until the next frame,unless you manually call.[[updateLayout]]
       *
       * @zh
       * Layout 组件相当于一个容器，能自动对它的所有子节点进行统一排版。<br>
       * 注意：<br>
       * 1.不会考虑子节点的缩放和旋转。<br>
       * 2.对 Layout 设置后结果需要到下一帧才会更新，除非你设置完以后手动调用。[[updateLayout]]
       */
      _export("Layout", Layout = (_dec = ccclass('cc.Layout'), _dec2 = help('i18n:cc.Layout'), _dec3 = executionOrder(110), _dec4 = menu('UI/Layout'), _dec5 = requireComponent(UITransform), _dec6 = visible(function () {
        return this._layoutType === LayoutType.HORIZONTAL;
      }), _dec7 = tooltip('i18n:layout.align_horizontal'), _dec8 = visible(function () {
        return this._layoutType === LayoutType.VERTICAL;
      }), _dec9 = tooltip('i18n:layout.align_vertical'), _dec0 = type(LayoutType), _dec1 = displayOrder(0), _dec10 = tooltip('i18n:layout.layout_type'), _dec11 = type(LayoutResizeMode), _dec12 = visible(function () {
        return this._layoutType !== LayoutType.NONE;
      }), _dec13 = tooltip('i18n:layout.resize_mode'), _dec14 = visible(function () {
        if (this.type === LayoutType.GRID && this._resizeMode === LayoutResizeMode.CHILDREN) {
          return true;
        }
        return false;
      }), _dec15 = tooltip('i18n:layout.cell_size'), _dec16 = type(LayoutAxisDirection), _dec17 = tooltip('i18n:layout.start_axis'), _dec18 = tooltip('i18n:layout.padding_left'), _dec19 = tooltip('i18n:layout.padding_right'), _dec20 = tooltip('i18n:layout.padding_top'), _dec21 = tooltip('i18n:layout.padding_bottom'), _dec22 = tooltip('i18n:layout.space_x'), _dec23 = tooltip('i18n:layout.space_y'), _dec24 = type(LayoutVerticalDirection), _dec25 = tooltip('i18n:layout.vertical_direction'), _dec26 = type(LayoutHorizontalDirection), _dec27 = tooltip('i18n:layout.horizontal_direction'), _dec28 = type(LayoutConstraint), _dec29 = visible(function () {
        return this.type === LayoutType.GRID;
      }), _dec30 = tooltip('i18n:layout.constraint'), _dec31 = visible(function () {
        return this._constraint !== LayoutConstraint.NONE;
      }), _dec32 = tooltip('i18n:layout.constraint_number'), _dec33 = tooltip('i18n:layout.affected_scale'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = (_Layout = class Layout extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_resizeMode", _descriptor, this);
          _initializerDefineProperty(this, "_layoutType", _descriptor2, this);
          _initializerDefineProperty(this, "_cellSize", _descriptor3, this);
          _initializerDefineProperty(this, "_startAxis", _descriptor4, this);
          _initializerDefineProperty(this, "_paddingLeft", _descriptor5, this);
          _initializerDefineProperty(this, "_paddingRight", _descriptor6, this);
          _initializerDefineProperty(this, "_paddingTop", _descriptor7, this);
          _initializerDefineProperty(this, "_paddingBottom", _descriptor8, this);
          _initializerDefineProperty(this, "_spacingX", _descriptor9, this);
          _initializerDefineProperty(this, "_spacingY", _descriptor0, this);
          _initializerDefineProperty(this, "_verticalDirection", _descriptor1, this);
          _initializerDefineProperty(this, "_horizontalDirection", _descriptor10, this);
          _initializerDefineProperty(this, "_constraint", _descriptor11, this);
          _initializerDefineProperty(this, "_constraintNum", _descriptor12, this);
          _initializerDefineProperty(this, "_affectedByScale", _descriptor13, this);
          _initializerDefineProperty(this, "_isAlign", _descriptor14, this);
          this._layoutSize = new Size(300, 200);
          this._layoutDirty = true;
          this._childrenDirty = false;
          this._usefulLayoutObj = [];
          this._init = false;
        }

        /**
         * @en
         * Alignment horizontal. Fixed starting position in the same direction when Type is Horizontal.
         *
         * @zh
         * 横向对齐。在 Type 为 Horizontal 时按同个方向固定起始位置排列。
         */
        get alignHorizontal() {
          return this._isAlign;
        }
        set alignHorizontal(value) {
          if (this._layoutType !== LayoutType.HORIZONTAL) {
            return;
          }
          this._isAlign = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * Alignment vertical. Fixed starting position in the same direction when Type is Vertical.
         *
         * @zh
         * 纵向对齐。在 Type 为 Horizontal 或 Vertical 时按同个方向固定起始位置排列。
         */
        get alignVertical() {
          return this._isAlign;
        }
        set alignVertical(value) {
          if (this._layoutType !== LayoutType.VERTICAL) {
            return;
          }
          this._isAlign = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The layout type.
         *
         * @zh
         * 布局类型。
         */
        get type() {
          return this._layoutType;
        }
        set type(value) {
          this._layoutType = value;
          this._doLayoutDirty();
        }
        /**
         * @en
         * The are three resize modes for Layout. None, resize Container and resize children.
         *
         * @zh
         * 缩放模式。
         */
        get resizeMode() {
          return this._resizeMode;
        }
        set resizeMode(value) {
          if (this._layoutType === LayoutType.NONE) {
            return;
          }
          this._resizeMode = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The cell size for grid layout.
         *
         * @zh
         * 每个格子的大小，只有布局类型为 GRID 的时候才有效。
         */
        get cellSize() {
          return this._cellSize;
        }
        set cellSize(value) {
          if (this._cellSize === value) {
            return;
          }
          this._cellSize.set(value);
          this._doLayoutDirty();
        }

        /**
         * @en
         * The start axis for grid layout. If you choose horizontal, then children will layout horizontally at first,
         * and then break line on demand. Choose vertical if you want to layout vertically at first.
         *
         * @zh
         * 起始轴方向类型，可进行水平和垂直布局排列，只有布局类型为 GRID 的时候才有效。
         */
        get startAxis() {
          return this._startAxis;
        }
        set startAxis(value) {
          if (this._startAxis === value) {
            return;
          }
          this._startAxis = value;
          this._doLayoutDirty();
        }
        /**
         * @en
         * The left padding of layout, it only effect the layout in one direction.
         *
         * @zh
         * 容器内左边距，只会在一个布局方向上生效。
         */
        get paddingLeft() {
          return this._paddingLeft;
        }
        set paddingLeft(value) {
          if (this._paddingLeft === value) {
            return;
          }
          this._paddingLeft = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The right padding of layout, it only effect the layout in one direction.
         *
         * @zh
         * 容器内右边距，只会在一个布局方向上生效。
         */
        get paddingRight() {
          return this._paddingRight;
        }
        set paddingRight(value) {
          if (this._paddingRight === value) {
            return;
          }
          this._paddingRight = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The top padding of layout, it only effect the layout in one direction.
         *
         * @zh
         * 容器内上边距，只会在一个布局方向上生效。
         */
        get paddingTop() {
          return this._paddingTop;
        }
        set paddingTop(value) {
          if (this._paddingTop === value) {
            return;
          }
          this._paddingTop = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The bottom padding of layout, it only effect the layout in one direction.
         *
         * @zh
         * 容器内下边距，只会在一个布局方向上生效。
         */
        get paddingBottom() {
          return this._paddingBottom;
        }
        set paddingBottom(value) {
          if (this._paddingBottom === value) {
            return;
          }
          this._paddingBottom = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The distance in x-axis between each element in layout.
         *
         * @zh
         * 子节点之间的水平间距。
         */
        get spacingX() {
          return this._spacingX;
        }
        set spacingX(value) {
          if (this._spacingX === value) {
            return;
          }
          this._spacingX = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The distance in y-axis between each element in layout.
         *
         * @zh
         * 子节点之间的垂直间距。
         */
        get spacingY() {
          return this._spacingY;
        }
        set spacingY(value) {
          if (this._spacingY === value) {
            return;
          }
          this._spacingY = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * Only take effect in Vertical layout mode.
         * This option changes the start element's positioning.
         *
         * @zh
         * 垂直排列子节点的方向。
         */
        get verticalDirection() {
          return this._verticalDirection;
        }
        set verticalDirection(value) {
          if (this._verticalDirection === value) {
            return;
          }
          this._verticalDirection = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * Only take effect in horizontal layout mode.
         * This option changes the start element's positioning.
         *
         * @zh
         * 水平排列子节点的方向。
         */
        get horizontalDirection() {
          return this._horizontalDirection;
        }
        set horizontalDirection(value) {
          if (this._horizontalDirection === value) {
            return;
          }
          this._horizontalDirection = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The padding of layout, it will effect the layout in horizontal and vertical direction.
         *
         * @zh
         * 容器内边距，该属性会在四个布局方向上生效。
         */
        get padding() {
          return this._paddingLeft;
        }
        set padding(value) {
          if (this.paddingLeft !== value || this._paddingRight !== value || this._paddingTop !== value || this._paddingBottom !== value) {
            this._paddingLeft = this._paddingRight = this._paddingTop = this._paddingBottom = value;
            this._doLayoutDirty();
          }
        }

        /**
         * @en
         * The layout constraint inside the container.
         *
         * @zh
         * 容器内布局约束。
         */
        get constraint() {
          return this._constraint;
        }
        set constraint(value) {
          if (this._layoutType === LayoutType.NONE || this._constraint === value) {
            return;
          }
          this._constraint = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * The limit value used by the layout constraint inside the container.
         *
         * @zh
         * 容器内布局约束使用的限定值。
         */
        get constraintNum() {
          return this._constraintNum;
        }
        set constraintNum(value) {
          if (this._constraint === LayoutConstraint.NONE || this._constraintNum === value) {
            return;
          }
          if (value <= 0) {
            warnID(16400);
          }
          this._constraintNum = value;
          this._doLayoutDirty();
        }

        /**
         * @en
         * Adjust the layout if the children scaled.
         *
         * @zh
         * 子节点缩放比例是否影响布局。
         */
        get affectedByScale() {
          return this._affectedByScale;
        }
        set affectedByScale(value) {
          this._affectedByScale = value;
          this._doLayoutDirty();
        }

        /**
         * @en Layout type.
         * @zh 布局类型。
         */

        /**
         * @en
         * Perform the layout update.
         *
         * @zh
         * 立即执行更新布局。
         * @param force @en force update or not. @zh 是否强制更新。
         * @example
         * ```ts
         * import { Layout, log } from 'cc';
         * layout.type = Layout.Type.HORIZONTAL;
         * layout.node.addChild(childNode);
         * log(childNode.x); // not yet changed
         * layout.updateLayout();
         * log(childNode.x); // changed
         * ```
         */
        updateLayout(force = false) {
          if (this._layoutDirty || force) {
            this._doLayout();
            this._layoutDirty = false;
          }
        }
        onEnable() {
          this._addEventListeners();
          const trans = this.node._getUITransformComp();
          if (trans.contentSize.equals(Size.ZERO)) {
            trans.setContentSize(this._layoutSize);
          }
          this._childrenChanged();
        }
        onDisable() {
          this._usefulLayoutObj.length = 0;
          this._removeEventListeners();
        }
        _checkUsefulObj() {
          this._usefulLayoutObj.length = 0;
          const children = this.node.children;
          for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            const uiTrans = child._getUITransformComp();
            if (child.activeInHierarchy && uiTrans) {
              this._usefulLayoutObj.push(uiTrans);
            }
          }
        }
        _addEventListeners() {
          director.on(DirectorEvent.AFTER_UPDATE, this.updateLayout, this);
          this.node.on(NodeEventType.SIZE_CHANGED, this._resized, this);
          this.node.on(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
          this.node.on(NodeEventType.CHILD_ADDED, this._childAdded, this);
          this.node.on(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
          this.node.on(NodeEventType.CHILDREN_ORDER_CHANGED, this._childrenChanged, this);
          this.node.on('childrenSiblingOrderChanged', this.updateLayout, this);
          this._addChildrenEventListeners();
        }
        _removeEventListeners() {
          director.off(DirectorEvent.AFTER_UPDATE, this.updateLayout, this);
          this.node.off(NodeEventType.SIZE_CHANGED, this._resized, this);
          this.node.off(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
          this.node.off(NodeEventType.CHILD_ADDED, this._childAdded, this);
          this.node.off(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
          this.node.off(NodeEventType.CHILDREN_ORDER_CHANGED, this._childrenChanged, this);
          this.node.off('childrenSiblingOrderChanged', this.updateLayout, this);
          this._removeChildrenEventListeners();
        }
        _addChildrenEventListeners() {
          const children = this.node.children;
          for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            child.on(NodeEventType.SIZE_CHANGED, this._doLayoutDirty, this);
            child.on(NodeEventType.TRANSFORM_CHANGED, this._transformDirty, this);
            child.on(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
            child.on(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, this._childrenChanged, this);
          }
        }
        _removeChildrenEventListeners() {
          const children = this.node.children;
          for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            child.off(NodeEventType.SIZE_CHANGED, this._doLayoutDirty, this);
            child.off(NodeEventType.TRANSFORM_CHANGED, this._transformDirty, this);
            child.off(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
            child.off(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, this._childrenChanged, this);
          }
        }
        _childAdded(child) {
          child.on(NodeEventType.SIZE_CHANGED, this._doLayoutDirty, this);
          child.on(NodeEventType.TRANSFORM_CHANGED, this._transformDirty, this);
          child.on(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
          child.on(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, this._childrenChanged, this);
          this._childrenChanged();
        }
        _childRemoved(child) {
          child.off(NodeEventType.SIZE_CHANGED, this._doLayoutDirty, this);
          child.off(NodeEventType.TRANSFORM_CHANGED, this._transformDirty, this);
          child.off(NodeEventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
          child.off(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, this._childrenChanged, this);
          this._childrenChanged();
        }
        _resized() {
          this._layoutSize.set(this.node._getUITransformComp().contentSize);
          this._doLayoutDirty();
        }
        _doLayoutHorizontally(baseWidth, rowBreak, fnPositionY, applyChildren) {
          const trans = this.node._getUITransformComp();
          const layoutAnchor = trans.anchorPoint;
          const limit = this._getFixedBreakingNum();
          let sign = 1;
          let paddingX = this._paddingLeft;
          if (this._horizontalDirection === LayoutHorizontalDirection.RIGHT_TO_LEFT) {
            sign = -1;
            paddingX = this._paddingRight;
          }
          const startPos = (this._horizontalDirection - layoutAnchor.x) * baseWidth + sign * paddingX;
          let nextX = startPos - sign * this._spacingX;
          let totalHeight = 0; // total content height (not including spacing)
          let rowMaxHeight = 0; // maximum height of a single line
          let tempMaxHeight = 0; //
          let maxHeight = 0;
          let isBreak = false;
          const activeChildCount = this._usefulLayoutObj.length;
          let newChildWidth = this._cellSize.width;
          const paddingH = this._getPaddingH();
          if (this._layoutType !== LayoutType.GRID && this._resizeMode === LayoutResizeMode.CHILDREN) {
            newChildWidth = (baseWidth - paddingH - (activeChildCount - 1) * this._spacingX) / activeChildCount;
          }
          const children = this._usefulLayoutObj;
          for (let i = 0; i < children.length; ++i) {
            const childTrans = children[i];
            const child = childTrans.node;
            const scale = child.scale;
            const childScaleX = this._getUsedScaleValue(scale.x);
            const childScaleY = this._getUsedScaleValue(scale.y);
            // for resizing children
            if (this._resizeMode === LayoutResizeMode.CHILDREN) {
              childTrans.width = newChildWidth / childScaleX;
              if (this._layoutType === LayoutType.GRID) {
                childTrans.height = this._cellSize.height / childScaleY;
              }
            }
            const anchorX = Math.abs(this._horizontalDirection - childTrans.anchorX);
            const childBoundingBoxWidth = childTrans.width * childScaleX;
            const childBoundingBoxHeight = childTrans.height * childScaleY;
            if (childBoundingBoxHeight > tempMaxHeight) {
              maxHeight = Math.max(tempMaxHeight, maxHeight);
              rowMaxHeight = tempMaxHeight || childBoundingBoxHeight;
              tempMaxHeight = childBoundingBoxHeight;
            }
            nextX += sign * (anchorX * childBoundingBoxWidth + this._spacingX);
            const rightBoundaryOfChild = sign * (1 - anchorX) * childBoundingBoxWidth;
            if (rowBreak) {
              if (limit > 0) {
                isBreak = i / limit > 0 && i % limit === 0;
                if (isBreak) {
                  rowMaxHeight = tempMaxHeight > childBoundingBoxHeight ? tempMaxHeight : rowMaxHeight;
                }
              } else if (childBoundingBoxWidth > baseWidth - paddingH) {
                if (nextX > startPos + sign * (anchorX * childBoundingBoxWidth)) {
                  isBreak = true;
                }
              } else {
                const boundary = (1 - this._horizontalDirection - layoutAnchor.x) * baseWidth;
                const rowBreakBoundary = nextX + rightBoundaryOfChild + sign * (sign > 0 ? this._paddingRight : this._paddingLeft);
                isBreak = Math.abs(rowBreakBoundary) > Math.abs(boundary);
              }
              if (isBreak) {
                nextX = startPos + sign * (anchorX * childBoundingBoxWidth);
                if (childBoundingBoxHeight !== tempMaxHeight) {
                  rowMaxHeight = tempMaxHeight;
                }
                // In unconstrained mode, the second height size is always what we need when a line feed condition is required to trigger
                totalHeight += rowMaxHeight + this._spacingY;
                rowMaxHeight = tempMaxHeight = childBoundingBoxHeight;
              }
            }
            const finalPositionY = fnPositionY(child, childTrans, totalHeight);
            if (applyChildren) {
              child.setPosition(nextX, finalPositionY);
            }
            nextX += rightBoundaryOfChild;
          }
          rowMaxHeight = Math.max(rowMaxHeight, tempMaxHeight);
          const containerResizeBoundary = Math.max(maxHeight, totalHeight + rowMaxHeight) + this._getPaddingV();
          return containerResizeBoundary;
        }
        _doLayoutVertically(baseHeight, columnBreak, fnPositionX, applyChildren) {
          const trans = this.node._getUITransformComp();
          const layoutAnchor = trans.anchorPoint;
          const limit = this._getFixedBreakingNum();
          let sign = 1;
          let paddingY = this._paddingBottom;
          if (this._verticalDirection === LayoutVerticalDirection.TOP_TO_BOTTOM) {
            sign = -1;
            paddingY = this._paddingTop;
          }
          const startPos = (this._verticalDirection - layoutAnchor.y) * baseHeight + sign * paddingY;
          let nextY = startPos - sign * this._spacingY;
          let tempMaxWidth = 0;
          let maxWidth = 0;
          let colMaxWidth = 0;
          let totalWidth = 0;
          let isBreak = false;
          const activeChildCount = this._usefulLayoutObj.length;
          let newChildHeight = this._cellSize.height;
          const paddingV = this._getPaddingV();
          if (this._layoutType !== LayoutType.GRID && this._resizeMode === LayoutResizeMode.CHILDREN) {
            newChildHeight = (baseHeight - paddingV - (activeChildCount - 1) * this._spacingY) / activeChildCount;
          }
          const children = this._usefulLayoutObj;
          for (let i = 0; i < children.length; ++i) {
            const childTrans = children[i];
            const child = childTrans.node;
            const scale = child.scale;
            const childScaleX = this._getUsedScaleValue(scale.x);
            const childScaleY = this._getUsedScaleValue(scale.y);

            // for resizing children
            if (this._resizeMode === LayoutResizeMode.CHILDREN) {
              childTrans.height = newChildHeight / childScaleY;
              if (this._layoutType === LayoutType.GRID) {
                childTrans.width = this._cellSize.width / childScaleX;
              }
            }
            const anchorY = Math.abs(this._verticalDirection - childTrans.anchorY);
            const childBoundingBoxWidth = childTrans.width * childScaleX;
            const childBoundingBoxHeight = childTrans.height * childScaleY;
            if (childBoundingBoxWidth > tempMaxWidth) {
              maxWidth = Math.max(tempMaxWidth, maxWidth);
              colMaxWidth = tempMaxWidth || childBoundingBoxWidth;
              tempMaxWidth = childBoundingBoxWidth;
            }
            nextY += sign * (anchorY * childBoundingBoxHeight + this._spacingY);
            const topBoundaryOfChild = sign * (1 - anchorY) * childBoundingBoxHeight;
            if (columnBreak) {
              if (limit > 0) {
                isBreak = i / limit > 0 && i % limit === 0;
                if (isBreak) {
                  colMaxWidth = tempMaxWidth > childBoundingBoxHeight ? tempMaxWidth : colMaxWidth;
                }
              } else if (childBoundingBoxHeight > baseHeight - paddingV) {
                if (nextY > startPos + sign * (anchorY * childBoundingBoxHeight)) {
                  isBreak = true;
                }
              } else {
                const boundary = (1 - this._verticalDirection - layoutAnchor.y) * baseHeight;
                const columnBreakBoundary = nextY + topBoundaryOfChild + sign * (sign > 0 ? this._paddingTop : this._paddingBottom);
                isBreak = Math.abs(columnBreakBoundary) > Math.abs(boundary);
              }
              if (isBreak) {
                nextY = startPos + sign * (anchorY * childBoundingBoxHeight);
                if (childBoundingBoxWidth !== tempMaxWidth) {
                  colMaxWidth = tempMaxWidth;
                }
                // In unconstrained mode, the second width size is always what we need when a line feed condition is required to trigger
                totalWidth += colMaxWidth + this._spacingX;
                colMaxWidth = tempMaxWidth = childBoundingBoxWidth;
              }
            }
            const finalPositionX = fnPositionX(child, childTrans, totalWidth);
            if (applyChildren) {
              child.getPosition(_tempVec3);
              child.setPosition(finalPositionX, nextY, _tempVec3.z);
            }
            nextY += topBoundaryOfChild;
          }
          colMaxWidth = Math.max(colMaxWidth, tempMaxWidth);
          const containerResizeBoundary = Math.max(maxWidth, totalWidth + colMaxWidth) + this._getPaddingH();
          return containerResizeBoundary;
        }
        _doLayoutGridAxisHorizontal(layoutAnchor, layoutSize) {
          const baseWidth = layoutSize.width;
          let sign = 1;
          let bottomBoundaryOfLayout = -layoutAnchor.y * layoutSize.height;
          let paddingY = this._paddingBottom;
          if (this._verticalDirection === LayoutVerticalDirection.TOP_TO_BOTTOM) {
            sign = -1;
            bottomBoundaryOfLayout = (1 - layoutAnchor.y) * layoutSize.height;
            paddingY = this._paddingTop;
          }
          const fnPositionY = (child, childTrans, topOffset) => bottomBoundaryOfLayout + sign * (topOffset + (1 - childTrans.anchorY) * childTrans.height * this._getUsedScaleValue(child.scale.y) + paddingY);
          let newHeight = 0;
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            // calculate the new height of container, it won't change the position of it's children
            newHeight = this._doLayoutHorizontally(baseWidth, true, fnPositionY, false);
            bottomBoundaryOfLayout = -layoutAnchor.y * newHeight;
            if (this._verticalDirection === LayoutVerticalDirection.TOP_TO_BOTTOM) {
              sign = -1;
              bottomBoundaryOfLayout = (1 - layoutAnchor.y) * newHeight;
            }
          }
          this._doLayoutHorizontally(baseWidth, true, fnPositionY, true);
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            this.node._getUITransformComp().setContentSize(baseWidth, newHeight);
          }
        }
        _doLayoutGridAxisVertical(layoutAnchor, layoutSize) {
          const baseHeight = layoutSize.height;
          let sign = 1;
          let leftBoundaryOfLayout = -layoutAnchor.x * layoutSize.width;
          let paddingX = this._paddingLeft;
          if (this._horizontalDirection === LayoutHorizontalDirection.RIGHT_TO_LEFT) {
            sign = -1;
            leftBoundaryOfLayout = (1 - layoutAnchor.x) * layoutSize.width;
            paddingX = this._paddingRight;
          }
          const fnPositionX = (child, childTrans, leftOffset) => leftBoundaryOfLayout + sign * (leftOffset + (1 - childTrans.anchorX) * childTrans.width * this._getUsedScaleValue(child.scale.x) + paddingX);
          let newWidth = 0;
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            newWidth = this._doLayoutVertically(baseHeight, true, fnPositionX, false);
            leftBoundaryOfLayout = -layoutAnchor.x * newWidth;
            if (this._horizontalDirection === LayoutHorizontalDirection.RIGHT_TO_LEFT) {
              sign = -1;
              leftBoundaryOfLayout = (1 - layoutAnchor.x) * newWidth;
            }
          }
          this._doLayoutVertically(baseHeight, true, fnPositionX, true);
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            this.node._getUITransformComp().setContentSize(newWidth, baseHeight);
          }
        }
        _doLayoutGrid() {
          const trans = this.node._getUITransformComp();
          const layoutAnchor = trans.anchorPoint;
          const layoutSize = trans.contentSize;
          if (this.startAxis === LayoutAxisDirection.HORIZONTAL) {
            this._doLayoutGridAxisHorizontal(layoutAnchor, layoutSize);
          } else if (this.startAxis === LayoutAxisDirection.VERTICAL) {
            this._doLayoutGridAxisVertical(layoutAnchor, layoutSize);
          }
        }
        _getHorizontalBaseWidth(horizontal = true) {
          const children = this._usefulLayoutObj;
          let baseSize = 0;
          const activeChildCount = children.length;
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            for (let i = 0; i < children.length; ++i) {
              const childTrans = children[i];
              const child = childTrans.node;
              const scale = child.scale;
              baseSize += childTrans.width * this._getUsedScaleValue(scale.x);
            }
            baseSize += (activeChildCount - 1) * this._spacingX + this._getPaddingH();
          } else {
            baseSize = this.node._getUITransformComp().width;
          }
          return baseSize;
        }
        _getVerticalBaseHeight() {
          const children = this._usefulLayoutObj;
          let baseSize = 0;
          const activeChildCount = children.length;
          if (this._resizeMode === LayoutResizeMode.CONTAINER) {
            for (let i = 0; i < children.length; ++i) {
              const childTrans = children[i];
              const child = childTrans.node;
              const scale = child.scale;
              baseSize += childTrans.height * this._getUsedScaleValue(scale.y);
            }
            baseSize += (activeChildCount - 1) * this._spacingY + this._getPaddingV();
          } else {
            baseSize = this.node._getUITransformComp().height;
          }
          return baseSize;
        }
        _doLayout() {
          if (!this._init || this._childrenDirty) {
            this._checkUsefulObj();
            this._init = true;
            this._childrenDirty = false;
          }
          if (this._layoutType === LayoutType.HORIZONTAL) {
            const newWidth = this._getHorizontalBaseWidth();
            const fnPositionY = child => {
              const pos = this._isAlign ? Vec3.ZERO : child.position;
              return pos.y;
            };
            this._doLayoutHorizontally(newWidth, false, fnPositionY, true);
            this.node._getUITransformComp().width = newWidth;
          } else if (this._layoutType === LayoutType.VERTICAL) {
            const newHeight = this._getVerticalBaseHeight();
            const fnPositionX = child => {
              const pos = this._isAlign ? Vec3.ZERO : child.position;
              return pos.x;
            };
            this._doLayoutVertically(newHeight, false, fnPositionX, true);
            this.node._getUITransformComp().height = newHeight;
          } else if (this._layoutType === LayoutType.GRID) {
            this._doLayoutGrid();
          }
        }
        _getUsedScaleValue(value) {
          return this._affectedByScale ? Math.abs(value) : 1;
        }
        _transformDirty(type) {
          // Invalidate layout when scale is affected and changed, or position is changed.
          if (type & TransformBit.SCALE && this._affectedByScale || type & TransformBit.POSITION) {
            this._doLayoutDirty();
          }
        }
        _doLayoutDirty() {
          this._layoutDirty = true;
        }
        _childrenChanged() {
          this._childrenDirty = true;
          this._doLayoutDirty();
        }
        _getPaddingH() {
          return this._paddingLeft + this._paddingRight;
        }
        _getPaddingV() {
          return this._paddingTop + this._paddingBottom;
        }
        _getFixedBreakingNum() {
          if (this._layoutType !== LayoutType.GRID || this._constraint === LayoutConstraint.NONE || this._constraintNum <= 0) {
            return 0;
          }
          let num = this._constraint === LayoutConstraint.FIXED_ROW ? Math.ceil(this._usefulLayoutObj.length / this._constraintNum) : this._constraintNum;
          // Horizontal sorting always counts the number of columns
          if (this._startAxis === LayoutAxisDirection.VERTICAL) {
            num = this._constraint === LayoutConstraint.FIXED_COL ? Math.ceil(this._usefulLayoutObj.length / this._constraintNum) : this._constraintNum;
          }
          return num;
        }
      }, _Layout.Type = LayoutType, _Layout.VerticalDirection = LayoutVerticalDirection, _Layout.HorizontalDirection = LayoutHorizontalDirection, _Layout.ResizeMode = LayoutResizeMode, _Layout.AxisDirection = LayoutAxisDirection, _Layout.Constraint = LayoutConstraint, _Layout), _applyDecoratedDescriptor(_class2.prototype, "alignHorizontal", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "alignHorizontal"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "alignVertical", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "alignVertical"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "type", [_dec0, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "type"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "resizeMode", [_dec11, _dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "resizeMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cellSize", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "cellSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "startAxis", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "startAxis"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "paddingLeft", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "paddingLeft"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "paddingRight", [_dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "paddingRight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "paddingTop", [_dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "paddingTop"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "paddingBottom", [_dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "paddingBottom"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spacingX", [_dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "spacingX"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spacingY", [_dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "spacingY"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "verticalDirection", [_dec24, _dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "verticalDirection"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "horizontalDirection", [_dec26, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "horizontalDirection"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "constraint", [_dec28, _dec29, _dec30], Object.getOwnPropertyDescriptor(_class2.prototype, "constraint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "constraintNum", [_dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "constraintNum"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "affectedByScale", [_dec33], Object.getOwnPropertyDescriptor(_class2.prototype, "affectedByScale"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_resizeMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutResizeMode.NONE;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_layoutType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutType.NONE;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_cellSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Size(40, 40);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_startAxis", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutAxisDirection.HORIZONTAL;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_paddingLeft", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_paddingRight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_paddingTop", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_paddingBottom", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_spacingX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_spacingY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_verticalDirection", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutVerticalDirection.TOP_TO_BOTTOM;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_horizontalDirection", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutHorizontalDirection.LEFT_TO_RIGHT;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_constraint", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LayoutConstraint.NONE;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_constraintNum", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_affectedByScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_isAlign", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
      legacyCC.Layout = Layout;
    }
  };
});