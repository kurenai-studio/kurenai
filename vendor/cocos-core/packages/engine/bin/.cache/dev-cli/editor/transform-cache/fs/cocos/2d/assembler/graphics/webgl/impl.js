System.register("q-bundled:///fs/cocos/2d/assembler/graphics/webgl/impl.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/index.js", "../../../renderer/render-data.js", "../../../renderer/render-draw-info.js", "../helper.js", "../types.js"], function (_export, _context) {
  "use strict";

  var JSB, Color, Vec2, MeshRenderData, RenderDrawInfoType, arc, ellipse, roundRect, tesselateBezier, LineCap, LineJoin, PointFlags, Point, Path, Impl;
  _export({
    Point: void 0,
    Path: void 0,
    Impl: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Vec2 = _coreIndexJs.Vec2;
    }, function (_rendererRenderDataJs) {
      MeshRenderData = _rendererRenderDataJs.MeshRenderData;
    }, function (_rendererRenderDrawInfoJs) {
      RenderDrawInfoType = _rendererRenderDrawInfoJs.RenderDrawInfoType;
    }, function (_helperJs) {
      arc = _helperJs.arc;
      ellipse = _helperJs.ellipse;
      roundRect = _helperJs.roundRect;
      tesselateBezier = _helperJs.tesselateBezier;
    }, function (_typesJs) {
      LineCap = _typesJs.LineCap;
      LineJoin = _typesJs.LineJoin;
      PointFlags = _typesJs.PointFlags;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("Point", Point = class Point extends Vec2 {
        constructor(x, y) {
          super(x, y);
          this.dx = 0;
          this.dy = 0;
          this.dmx = 0;
          this.dmy = 0;
          this.flags = 0;
          this.len = 0;
        }
        reset() {
          this.dx = 0;
          this.dy = 0;
          this.dmx = 0;
          this.dmy = 0;
          this.flags = 0;
          this.len = 0;
        }
      });
      _export("Path", Path = class Path {
        constructor() {
          this.closed = false;
          this.bevel = 0;
          this.complex = true;
          this.points = [];
        }
        reset() {
          this.closed = false;
          this.bevel = 0;
          this.complex = true;
          this.points.length = 0;
        }
      });
      /** @mangle */
      _export("Impl", Impl = class Impl {
        constructor(comp) {
          this.dataOffset = 0;
          this.updatePathOffset = false;
          this.pathLength = 0;
          this.pathOffset = 0;
          this.paths = [];
          // inner properties
          this.tessTol = 0.25;
          this.distTol = 0.01;
          this.fillColor = Color.WHITE.clone();
          this.lineCap = LineCap.BUTT;
          this.strokeColor = Color.BLACK.clone();
          this.lineJoin = LineJoin.MITER;
          this.lineWidth = 0;
          this.pointsOffset = 0;
          this._commandX = 0;
          this._commandY = 0;
          this._points = [];
          this._renderDataList = [];
          this._curPath = null;
          this._comp = comp;
        }
        moveTo(x, y) {
          if (this.updatePathOffset) {
            this.pathOffset = this.pathLength;
            this.updatePathOffset = false;
          }
          this._addPath();
          this.addPoint(x, y, PointFlags.PT_CORNER);
          this._commandX = x;
          this._commandY = y;
        }
        lineTo(x, y) {
          this.addPoint(x, y, PointFlags.PT_CORNER);
          this._commandX = x;
          this._commandY = y;
        }
        bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
          const path = this._curPath;
          const last = path.points[path.points.length - 1];
          if (!last) {
            return;
          }
          if (last.x === c1x && last.y === c1y && c2x === x && c2y === y) {
            this.lineTo(x, y);
            return;
          }
          tesselateBezier(this, last.x, last.y, c1x, c1y, c2x, c2y, x, y, 0, PointFlags.PT_CORNER);
          this._commandX = x;
          this._commandY = y;
        }
        quadraticCurveTo(cx, cy, x, y) {
          const x0 = this._commandX;
          const y0 = this._commandY;
          this.bezierCurveTo(x0 + 2.0 / 3.0 * (cx - x0), y0 + 2.0 / 3.0 * (cy - y0), x + 2.0 / 3.0 * (cx - x), y + 2.0 / 3.0 * (cy - y), x, y);
        }
        arc(cx, cy, r, startAngle, endAngle, counterclockwise) {
          arc(this, cx, cy, r, startAngle, endAngle, counterclockwise);
        }
        ellipse(cx, cy, rx, ry) {
          ellipse(this, cx, cy, rx, ry);
          this._curPath.complex = false;
        }
        circle(cx, cy, r) {
          ellipse(this, cx, cy, r, r);
          this._curPath.complex = false;
        }
        rect(x, y, w, h) {
          this.moveTo(x, y);
          this.lineTo(x + w, y);
          this.lineTo(x + w, y + h);
          this.lineTo(x, y + h);
          this.close();
          this._curPath.complex = false;
        }
        roundRect(x, y, w, h, r) {
          roundRect(this, x, y, w, h, r);
          this._curPath.complex = false;
        }
        clear() {
          this.pathLength = 0;
          this.pathOffset = 0;
          this.pointsOffset = 0;
          this.dataOffset = 0;
          this._curPath = null;
          this.paths.length = 0;
          this._points.length = 0;
          const dataList = this._renderDataList;
          for (let i = 0, l = dataList.length; i < l; i++) {
            const data = dataList[i];
            if (!data) {
              continue;
            }
            MeshRenderData.remove(data);
            if (JSB) {
              this._comp.renderEntity.clearRenderDrawInfos();
            }
          }
          this._renderDataList.length = 0;
        }
        close() {
          this._curPath.closed = true;
        }
        requestRenderData() {
          const renderData = MeshRenderData.add();
          this._renderDataList.push(renderData);
          if (JSB) {
            renderData.initRenderDrawInfo(this._comp, RenderDrawInfoType.MODEL);
            // TODO: MeshRenderData and RenderData are both sub class of BaseRenderData, here we weirdly use MeshRenderData as RenderData
            // please fix the type @holycanvas
            // issue: https://github.com/cocos/cocos-engine/issues/14637
            renderData.material = this._comp.getMaterialInstance(0); // hack
            this._comp.setRenderData(renderData);
          }
          return renderData;
        }
        getRenderDataList() {
          if (this._renderDataList.length === 0) {
            this.requestRenderData();
          }
          return this._renderDataList;
        }
        addPoint(x, y, flags) {
          const path = this._curPath;
          if (!path) {
            return;
          }
          const points = this._points;
          const pathPoints = path.points;
          const offset = this.pointsOffset++;
          let pt = points[offset];
          if (!pt) {
            pt = new Point(x, y);
            points.push(pt);
          } else {
            pt.x = x;
            pt.y = y;
          }
          pt.flags = flags;
          pathPoints.push(pt);
        }
        _addPath() {
          const offset = this.pathLength;
          let path = this.paths[offset];
          if (!path) {
            path = new Path();
            this.paths.push(path);
          } else {
            path.reset();
          }
          this.pathLength++;
          this._curPath = path;
          return path;
        }
      });
    }
  };
});