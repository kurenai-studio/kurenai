System.register("q-bundled:///fs/cocos/2d/components/graphics.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../asset/asset-manager/index.js", "../framework/ui-renderer.js", "../../game/director.js", "../../core/index.js", "../../render-scene/index.js", "../assembler/graphics/types.js", "../assembler/graphics/webgl/impl.js", "../../asset/assets/index.js", "../../gfx/index.js", "../renderer/vertex-format.js", "../renderer/native-2d.js", "../renderer/render-entity.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executionOrder, menu, tooltip, type, visible, override, editable, serializable, JSB, builtinResMgr, InstanceMaterialType, UIRenderer, director, Color, warnID, cclegacy, scene, LineCap, LineJoin, Impl, RenderingSubMesh, Format, PrimitiveMode, Attribute, BufferUsageBit, BufferInfo, MemoryUsageBit, deviceManager, vfmtPosColor, getAttributeStride, getComponentPerVertex, NativeUIModelProxy, RenderEntity, RenderEntityType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _Graphics, attributes, componentPerVertex, stride, Graphics;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
      override = _coreDataDecoratorsIndexJs.override;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_frameworkUiRendererJs) {
      InstanceMaterialType = _frameworkUiRendererJs.InstanceMaterialType;
      UIRenderer = _frameworkUiRendererJs.UIRenderer;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      warnID = _coreIndexJs.warnID;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_assemblerGraphicsTypesJs) {
      LineCap = _assemblerGraphicsTypesJs.LineCap;
      LineJoin = _assemblerGraphicsTypesJs.LineJoin;
    }, function (_assemblerGraphicsWebglImplJs) {
      Impl = _assemblerGraphicsWebglImplJs.Impl;
    }, function (_assetAssetsIndexJs) {
      RenderingSubMesh = _assetAssetsIndexJs.RenderingSubMesh;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
      Attribute = _gfxIndexJs.Attribute;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      BufferInfo = _gfxIndexJs.BufferInfo;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_rendererVertexFormatJs) {
      vfmtPosColor = _rendererVertexFormatJs.vfmtPosColor;
      getAttributeStride = _rendererVertexFormatJs.getAttributeStride;
      getComponentPerVertex = _rendererVertexFormatJs.getComponentPerVertex;
    }, function (_rendererNative2dJs) {
      NativeUIModelProxy = _rendererNative2dJs.NativeUIModelProxy;
    }, function (_rendererRenderEntityJs) {
      RenderEntity = _rendererRenderEntityJs.RenderEntity;
      RenderEntityType = _rendererRenderEntityJs.RenderEntityType;
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
      attributes = vfmtPosColor.concat([new Attribute('a_dist', Format.R32F)]);
      componentPerVertex = getComponentPerVertex(attributes);
      stride = getAttributeStride(attributes);
      /**
       * @en
       * Graphics component.
       *
       * @zh
       * 自定义图形类。
       */
      _export("Graphics", Graphics = (_dec = ccclass('cc.Graphics'), _dec2 = help('i18n:cc.Graphics'), _dec3 = executionOrder(110), _dec4 = menu('2D/Graphics'), _dec5 = tooltip('i18n:graphics.lineWidth'), _dec6 = type(LineJoin), _dec7 = tooltip('i18n:graphics.lineJoin'), _dec8 = type(LineCap), _dec9 = tooltip('i18n:graphics.lineCap'), _dec0 = tooltip('i18n:graphics.strokeColor'), _dec1 = tooltip('i18n:graphics.fillColor'), _dec10 = tooltip('i18n:graphics.miterLimit'), _dec11 = visible(false), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = (_Graphics = class Graphics extends UIRenderer {
        /**
         * @en
         * Current line width.
         *
         * @zh
         * 当前线条宽度。
         */
        get lineWidth() {
          return this._lineWidth;
        }
        set lineWidth(value) {
          this._lineWidth = value;
          if (!this.impl) {
            return;
          }
          this.impl.lineWidth = value;
        }

        /**
         * @en
         * Determines how two connecting segments (of lines, arcs or curves) with non-zero lengths in a shape are joined together.
         *
         * @zh
         * 用来设置2个长度不为0的相连部分（线段，圆弧，曲线）如何连接在一起的属性。
         */
        get lineJoin() {
          return this._lineJoin;
        }
        set lineJoin(value) {
          this._lineJoin = value;
          if (!this.impl) {
            return;
          }
          this.impl.lineJoin = value;
        }

        /**
         * @en
         * Determines how the end points of every line are drawn.
         *
         * @zh
         * 指定如何绘制每一条线段末端。
         */
        get lineCap() {
          return this._lineCap;
        }
        set lineCap(value) {
          this._lineCap = value;
          if (!this.impl) {
            return;
          }
          this.impl.lineCap = value;
        }

        /**
         * @en
         * Brush stroke color.
         *
         * @zh
         * 笔触的颜色。
         */
        get strokeColor() {
          return this._strokeColor;
        }
        set strokeColor(value) {
          if (!this.impl) {
            return;
          }
          this._strokeColor.set(value);
          this.impl.strokeColor = this._strokeColor;
        }

        /**
         * @en
         * Fill paint color.
         *
         * @zh
         * 填充绘画的颜色。
         */
        get fillColor() {
          return this._fillColor;
        }
        set fillColor(value) {
          if (!this.impl) {
            return;
          }
          this._fillColor.set(value);
          this.impl.fillColor = this._fillColor;
        }

        /**
         * @en
         * Set the miter limit ratio.
         *
         * @zh
         * 设置斜接面限制比例。
         */
        get miterLimit() {
          return this._miterLimit;
        }
        set miterLimit(value) {
          this._miterLimit = value;
          // this.impl.miterLimit = value;
        }
        get color() {
          return this._color;
        }
        set color(value) {
          if (this._color === value) {
            return;
          }
          this._color.set(value);
        }
        //nativeObj

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get graphicsNativeProxy() {
          return this._graphicsNativeProxy;
        }
        constructor() {
          super();
          this.impl = null;
          /**
           * @deprecated since v3.6.0, this is an engine private interface that will be removed in the future.
           */
          this.model = null;
          _initializerDefineProperty(this, "_lineWidth", _descriptor, this);
          _initializerDefineProperty(this, "_strokeColor", _descriptor2, this);
          _initializerDefineProperty(this, "_lineJoin", _descriptor3, this);
          _initializerDefineProperty(this, "_lineCap", _descriptor4, this);
          _initializerDefineProperty(this, "_fillColor", _descriptor5, this);
          _initializerDefineProperty(this, "_miterLimit", _descriptor6, this);
          this._isDrawing = false;
          this._isNeedUploadData = true;
          this._graphicsUseSubMeshes = [];
          this._instanceMaterialType = InstanceMaterialType.ADD_COLOR;
          this.impl = new Impl(this);
          if (JSB) {
            this._graphicsNativeProxy = new NativeUIModelProxy();
          }
        }
        onRestore() {
          if (!this.impl) {
            this._flushAssembler();
          }
        }
        onLoad() {
          super.onLoad();
          if (JSB) {
            this._graphicsNativeProxy.initModel(this.node);
            this.model = this._graphicsNativeProxy.getModel();
          } else {
            this.model = director.root.createModel(scene.Model);
            this.model.node = this.model.transform = this.node;
          }
          this._flushAssembler();
        }
        onEnable() {
          super.onEnable();
          this._updateMtlForGraphics();
        }
        get _keepRenderData() {
          // Graphics is a retained-mode renderer: its MeshRenderData is the result of the
          // user's previous fill()/stroke() calls. Destroying it here would leave Impl's
          // render-data list pointing at cleared geometry, so re-enabling the node on native
          // platforms would require the user to draw the paths again. Keep it attached to the
          // disabled RenderEntity; clear() and onDestroy() remain the owning release points.
          return true;
        }
        onDestroy() {
          this._sceneGetter = null;
          if (JSB) {
            this._graphicsNativeProxy.destroy();
            this.model = null;
          } else {
            if (this.model) {
              director.root.destroyModel(this.model);
              this.model = null;
            }
            const subMeshLength = this._graphicsUseSubMeshes.length;
            if (subMeshLength > 0) {
              for (let i = 0; i < subMeshLength; ++i) {
                this._graphicsUseSubMeshes[i].destroy();
              }
              this._graphicsUseSubMeshes.length = 0;
            }
          }
          if (this.impl) {
            this._isDrawing = false;
            this.impl.clear();
            this.impl = null;
          }
          super.onDestroy();
        }

        /**
         * @en
         * Move path start point to (x,y).
         *
         * @zh
         * 移动路径起点到坐标(x, y)。
         *
         * @param x @en The x-axis coordinate of the target position.
         *          @zh 目标位置的 X 轴坐标。
         * @param y @en The y-axis coordinate of the target position.
         *          @zh 目标位置的 y 轴坐标。
         */
        moveTo(x, y) {
          if (!this.impl) {
            return;
          }
          this.impl.moveTo(x, y);
        }

        /**
         * @en
         * Adds a straight line to the path.
         *
         * @zh
         * 绘制直线路径。
         *
         * @param x @en The x-axis coordinate of the target position.
         *          @zh 目标位置的 x 轴坐标。
         * @param y @en The x-axis coordinate of the target position.
         *          @zh 目标位置的 y 轴坐标。
         */
        lineTo(x, y) {
          if (!this.impl) {
            return;
          }
          this.impl.lineTo(x, y);
        }

        /**
         * @en
         * Adds a cubic Bézier curve to the path.
         *
         * @zh
         * 绘制三次贝赛尔曲线路径。
         *
         * @param c1x @en The x-axis coordinate of the first control point.
         *            @zh 第一个控制点的 x 轴坐标。
         * @param c1y @en The y-axis coordinate of the first control point.
         *            @zh 第一个控制点的 y 轴坐标。
         * @param c2x @en The x-axis coordinate of the second control point.
         *            @zh 第二个控制点的 x 轴坐标。
         * @param c2y @en The y-axis coordinate of the second control point.
         *            @zh 第二个控制点的 y 轴坐标。
         * @param x @en The x-axis coordinate of the last control point.
         *          @zh 最后一个控制点的 x 轴坐标。
         * @param y @en The y-axis coordinate of the last control point.
         *          @zh 最后一个控制点的 y 轴坐标。
         */
        bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
          if (!this.impl) {
            return;
          }
          this.impl.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
        }

        /**
         * @en
         * Adds a quadratic Bézier curve to the path.
         *
         * @zh
         * 绘制二次贝赛尔曲线路径。
         *
         * @param cx @en The x-axis coordinate of the starting control point.
         *           @zh 起始控制点的 x 轴坐标。
         * @param cy @en The y-axis coordinate of the starting control point.
         *           @zh 起始控制点的 y 轴坐标。
         * @param x @en The x-axis coordinates of the endpoint control point.
         *          @zh 终点控制点的 x 轴坐标。
         * @param y @en The y-axis coordinates of the endpoint control point.
         *          @zh 终点控制点的 x 轴坐标。
         */
        quadraticCurveTo(cx, cy, x, y) {
          if (!this.impl) {
            return;
          }
          this.impl.quadraticCurveTo(cx, cy, x, y);
        }

        /**
         * @en
         * Adds an arc to the path which is centered at (cx, cy) position with radius r starting at startAngle
         * and ending at endAngle going in the given direction by counterclockwise (defaulting to false).
         *
         * @zh
         * 绘制圆弧路径。圆弧路径的圆心在 (cx, cy) 位置，半径为 r ，根据 counterclockwise （默认为false）指定的方向从 startAngle 开始绘制，到 endAngle 结束。
         *
         * @param cx @en The coordinate x-axis of the central control point.
         *           @zh 中心控制点的坐标 x 轴。
         * @param cy @en The coordinate y-axis of the central control point.
         *           @zh 中心控制点的坐标 y 轴。
         * @param r @en Angle in Radian.
         *          @zh 圆弧弧度。
         * @param startAngle @en The starting angle in radian, measured clockwise from the positive x-axis.
         *                   @zh 弧度起点，从正 x 轴顺时针方向测量。
         * @param endAngle @en The ending angle in radian, measured clockwise from the positive x-axis.
         *                 @zh 弧度终点，从正 x 轴顺时针方向测量。
         * @param counterclockwise @en If true, draws counterclockwise between the two angles. Default is clockwise.
         *                         @zh 如果为真，在两个角度之间逆时针绘制。默认顺时针。
         */
        arc(cx, cy, r, startAngle, endAngle, counterclockwise) {
          if (!this.impl) {
            return;
          }
          this.impl.arc(cx, cy, r, startAngle, endAngle, counterclockwise);
        }

        /**
         * @en
         * Adds an ellipse to the path.
         *
         * @zh
         * 绘制椭圆路径。
         *
         * @param cx @en The x-axis coordinates of the center point.
         *           @zh 中心点的 x 轴坐标。
         * @param cy @en The y-axis coordinates of the center point.
         *           @zh 中心点的 y 轴坐标。
         * @param rx @en The radius of the x-axis of the ellipse.
         *           @zh 椭圆 x 轴半径。
         * @param ry @en The radius of the y-axis of the ellipse.
         *           @zh 椭圆 y 轴半径。
         */
        ellipse(cx, cy, rx, ry) {
          if (!this.impl) {
            return;
          }
          this.impl.ellipse(cx, cy, rx, ry);
        }

        /**
         * @en
         * Adds a circle to the path.
         *
         * @zh
         * 绘制圆形路径。
         *
         * @param cx @en The x-axis coordinates of the center point.
         *           @zh 中心点的 x 轴坐标。
         * @param cy @en The y-axis coordinates of the center point.
         *           @zh 中心点的 y 轴坐标。
         * @param r @en Radius.
         *          @zh 圆半径。
         */
        circle(cx, cy, r) {
          if (!this.impl) {
            return;
          }
          this.impl.circle(cx, cy, r);
        }

        /**
         * @en
         * Adds a rectangle to the path.
         *
         * @zh
         * 绘制矩形路径。
         *
         * @param x @en The x-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 x 轴坐标。
         * @param y @en The y-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 y 轴坐标。
         * @param w @en The width of the rectangle.
         *          @zh 矩形宽度。
         * @param h @en The height of the rectangle.
         *          @zh 矩形高度。
         */
        rect(x, y, w, h) {
          if (!this.impl) {
            return;
          }
          this.impl.rect(x, y, w, h);
        }

        /**
         * @en
         * Adds a round corner rectangle to the path.
         *
         * @zh
         * 绘制圆角矩形路径。
         *
         * @param x @en The x-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 x 轴坐标。
         * @param y @en The y-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 y 轴坐标。
         * @param w @en The width of the rectangle.
         *          @zh 矩形宽度。
         * @param h @en The height of the rectangle.
         *          @zh 矩形高度。
         * @param r @en Radius of rectangular rounded corners.
         *          @zh 矩形圆角半径。
         */
        roundRect(x, y, w, h, r) {
          if (!this.impl) {
            return;
          }
          this.impl.roundRect(x, y, w, h, r);
        }

        /**
         * @en
         * Draws a filled rectangle.
         *
         * @zh
         * 绘制填充矩形。
         *
         * @param x @en The x-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 x 轴坐标。
         * @param y @en The y-axis coordinate of the top left point of the rectangle.
         *          @zh 矩形起始 y 轴坐标。
         * @param w @en The width of the rectangle.
         *          @zh 矩形宽度。
         * @param h @en The height of the rectangle.
         *          @zh 矩形高度。
         */
        fillRect(x, y, w, h) {
          this.rect(x, y, w, h);
          this.fill();
        }

        /**
         * @en
         * Erasing any previously drawn content.
         *
         * @zh
         * 擦除之前绘制的所有内容的方法。
         */
        clear() {
          if (!this.impl) {
            return;
          }
          this.impl.clear();
          this._isDrawing = false;
          if (JSB) {
            this._graphicsNativeProxy.clear(); // need native
          } else if (this.model) {
            for (let i = 0; i < this.model.subModels.length; i++) {
              const subModel = this.model.subModels[i];
              const ia = subModel.inputAssembler;
              ia.indexCount = 0;
              ia.vertexCount = 0;
            }
          }
          this._markForUpdateRenderData();
        }

        /**
         * @en
         * Causes the point of the pen to move back to the start of the current path.
         * It tries to add a straight line from the current point to the start.
         *
         * @zh
         * 将笔点返回到当前路径起始点的。它尝试从当前点到起始点绘制一条直线。
         */
        close() {
          if (!this.impl) {
            return;
          }
          this.impl.close();
        }

        /**
         * @en
         * Strokes the current or given path with the current stroke style.
         *
         * @zh
         * 根据当前的画线样式，绘制当前或已经存在的路径。
         */
        stroke() {
          if (!this._assembler) {
            this._flushAssembler();
          }
          this._isDrawing = true;
          this._isNeedUploadData = true;
          this._assembler.stroke(this);
        }

        /**
         * @en
         * Fills the current or given path with the current fill style.
         *
         * @zh
         * 根据当前的画线样式，填充当前或已经存在的路径。
         */
        fill() {
          if (!this._assembler) {
            this._flushAssembler();
          }
          this._isDrawing = true;
          this._isNeedUploadData = true;
          this._assembler.fill(this);
        }
        _updateMtlForGraphics() {
          let mat;
          if (this._customMaterial) {
            mat = this.getMaterialInstance(0);
          } else {
            mat = builtinResMgr.get('ui-graphics-material');
            this.setSharedMaterial(mat, 0);
            mat = this.getMaterialInstance(0);
            mat.recompileShaders({
              USE_LOCAL: true
            });
          }
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        activeSubModel(idx) {
          if (!this.model) {
            warnID(4500, this.node.name);
            return;
          }
          if (this.model.subModels.length <= idx) {
            const gfxDevice = deviceManager.gfxDevice;
            const vertexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, 65536 * stride,
            // Uint16 can address 65536 vertices (indices 0–65535)
            stride));
            const indexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, 65536 * Uint16Array.BYTES_PER_ELEMENT * 2,
            // Uint16 can address 65536 vertices (indices 0–65535)
            Uint16Array.BYTES_PER_ELEMENT));
            const renderMesh = new RenderingSubMesh([vertexBuffer], attributes, PrimitiveMode.TRIANGLE_LIST, indexBuffer);
            renderMesh.subMeshIdx = 0;
            this.model.initSubModel(idx, renderMesh, this.getMaterialInstance(0));
            this._graphicsUseSubMeshes.push(renderMesh);
          }
        }
        _uploadData() {
          const impl = this.impl;
          if (!impl) {
            return;
          }
          const renderDataList = impl && impl.getRenderDataList();
          if (renderDataList.length <= 0 || !this.model) {
            return;
          }
          const subModelList = this.model.subModels;
          for (let i = 0; i < renderDataList.length; i++) {
            const renderData = renderDataList[i];
            const ia = subModelList[i].inputAssembler;
            if (renderData.lastFilledVertex === renderData.vertexStart) {
              continue;
            }
            const vb = new Float32Array(renderData.vData.buffer, 0, renderData.vertexStart * componentPerVertex);
            ia.vertexBuffers[0].update(vb);
            ia.vertexCount = renderData.vertexStart;
            const ib = new Uint16Array(renderData.iData.buffer, 0, renderData.indexStart);
            ia.indexBuffer.update(ib);
            ia.indexCount = renderData.indexStart;
            renderData.lastFilledVertex = renderData.vertexStart;
            renderData.lastFilledIndex = renderData.indexStart;
          }
          this._isNeedUploadData = false;
        }
        _render(render) {
          if (this._isNeedUploadData) {
            if (this.impl) {
              const renderDataList = this.impl.getRenderDataList();
              const len = this.model.subModels.length;
              if (renderDataList.length > len) {
                for (let i = len; i < renderDataList.length; i++) {
                  this.activeSubModel(i);
                }
              }
            }
            this._uploadData();
          }
          render.commitModel(this, this.model, this.getMaterialInstance(0));
        }
        _flushAssembler() {
          const assembler = Graphics.Assembler.getAssembler(this);
          if (this._assembler !== assembler) {
            this._assembler = assembler;
          }
        }
        _canRender() {
          if (!super._canRender()) {
            return false;
          }
          if (JSB) {
            return this._isDrawing;
          } else {
            return !!this.model && this._isDrawing;
          }
        }

        /**
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        updateRenderer() {
          super.updateRenderer();
          if (JSB) {
            if (this._isNeedUploadData) {
              if (this.impl) {
                const renderDataList = this.impl.getRenderDataList();
                for (let i = 0; i < renderDataList.length; i++) {
                  renderDataList[i].setRenderDrawInfoAttributes();
                }
                this._graphicsNativeProxy.activeSubModels();
              }
              this._graphicsNativeProxy.uploadData();
              this._isNeedUploadData = false;
            }
          }
        }
        createRenderEntity() {
          return new RenderEntity(RenderEntityType.DYNAMIC);
        }
      }, _Graphics.LineJoin = LineJoin, _Graphics.LineCap = LineCap, _Graphics), _applyDecoratedDescriptor(_class2.prototype, "lineWidth", [editable, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "lineWidth"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lineJoin", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "lineJoin"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lineCap", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "lineCap"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "strokeColor", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "strokeColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fillColor", [_dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "fillColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "miterLimit", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "miterLimit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "color", [override, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "color"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_lineWidth", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_strokeColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.BLACK.clone();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_lineJoin", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LineJoin.MITER;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_lineCap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return LineCap.BUTT;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_fillColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_miterLimit", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      cclegacy.Graphics = Graphics;
    }
  };
});