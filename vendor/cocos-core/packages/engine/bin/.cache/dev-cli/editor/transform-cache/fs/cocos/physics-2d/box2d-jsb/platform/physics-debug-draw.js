System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/platform/physics-debug-draw.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../framework/index.js", "../empty-for-editor.js"], function (_export, _context) {
  "use strict";

  var JSB, Color, PHYSICS_2D_PTM_RATIO, b2EmptyInstance, PhysicsDebugDraw, _tmp_vec2, _tmp_color, GREEN_COLOR, RED_COLOR;
  _export("PhysicsDebugDraw", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
    }, function (_frameworkIndexJs) {
      PHYSICS_2D_PTM_RATIO = _frameworkIndexJs.PHYSICS_2D_PTM_RATIO;
    }, function (_emptyForEditorJs) {
      b2EmptyInstance = _emptyForEditorJs.b2EmptyInstance;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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

      if (!JSB) {
        globalThis.b2jsb = b2EmptyInstance;
      }
      _tmp_vec2 = new b2jsb.Vec2();
      _tmp_color = new Color();
      GREEN_COLOR = Color.GREEN;
      RED_COLOR = Color.RED; // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      b2jsb.Transform.MulXV = function (T, v, out) {
        const T_q_c = T.q.c;
        const T_q_s = T.q.s;
        const v_x = v.x;
        const v_y = v.y;
        out.x = T_q_c * v_x - T_q_s * v_y + T.p.x;
        out.y = T_q_s * v_x + T_q_c * v_y + T.p.y;
        return out;
      };
      _export("PhysicsDebugDraw", PhysicsDebugDraw = class PhysicsDebugDraw extends b2jsb.Draw {
        constructor(drawer) {
          super();
          this._drawer = null;
          this._xf = new b2jsb.Transform();
          this._dxf = new b2jsb.Transform();
          this._drawer = drawer;
        }
        _DrawPolygon(vertices, vertexCount) {
          const drawer = this._drawer;
          for (let i = 0; i < vertexCount; i++) {
            b2jsb.Transform.MulXV(this._xf, vertices[i], _tmp_vec2);
            const x = _tmp_vec2.x * PHYSICS_2D_PTM_RATIO;
            const y = _tmp_vec2.y * PHYSICS_2D_PTM_RATIO;
            if (i === 0) drawer.moveTo(x, y);else {
              drawer.lineTo(x, y);
            }
          }
          drawer.close();
        }
        DrawPolygon(vertices, vertexCount, color) {
          this._applyStrokeColor(color);
          this._DrawPolygon(vertices, vertexCount);
          this._drawer.stroke();
        }
        DrawSolidPolygon(vertices, vertexCount, color) {
          this._applyFillColor(color);
          this._DrawPolygon(vertices, vertexCount);
          this._drawer.fill();
          this._drawer.stroke();
        }
        _DrawCircle(center, radius) {
          b2jsb.Transform.MulXV(this._xf, center, _tmp_vec2);
          //scale?
          this._drawer.circle(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO, radius * PHYSICS_2D_PTM_RATIO);
        }
        DrawCircle(center, radius, color) {
          this._applyStrokeColor(color);
          this._DrawCircle(center, radius);
          this._drawer.stroke();
        }
        DrawSolidCircle(center, radius, axis, color) {
          this._applyFillColor(color);
          this._DrawCircle(center, radius);
          this._drawer.fill();
        }
        DrawSegment(p1, p2, color) {
          const drawer = this._drawer;
          if (p1.x === p2.x && p1.y === p2.y) {
            this._applyFillColor(color);
            this._DrawCircle(p1, 2 / PHYSICS_2D_PTM_RATIO);
            drawer.fill();
            return;
          }
          this._applyStrokeColor(color);
          b2jsb.Transform.MulXV(this._xf, p1, _tmp_vec2);
          drawer.moveTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          b2jsb.Transform.MulXV(this._xf, p2, _tmp_vec2);
          drawer.lineTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          drawer.stroke();
        }
        DrawTransform(xf) {
          const drawer = this._drawer;
          drawer.strokeColor = RED_COLOR;
          _tmp_vec2.x = _tmp_vec2.y = 0;
          b2jsb.Transform.MulXV(xf, _tmp_vec2, _tmp_vec2);
          drawer.moveTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          _tmp_vec2.x = 1;
          _tmp_vec2.y = 0;
          b2jsb.Transform.MulXV(xf, _tmp_vec2, _tmp_vec2);
          drawer.lineTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          drawer.stroke();
          drawer.strokeColor = GREEN_COLOR;
          _tmp_vec2.x = _tmp_vec2.y = 0;
          b2jsb.Transform.MulXV(xf, _tmp_vec2, _tmp_vec2);
          drawer.moveTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          _tmp_vec2.x = 0;
          _tmp_vec2.y = 1;
          b2jsb.Transform.MulXV(xf, _tmp_vec2, _tmp_vec2);
          drawer.lineTo(_tmp_vec2.x * PHYSICS_2D_PTM_RATIO, _tmp_vec2.y * PHYSICS_2D_PTM_RATIO);
          drawer.stroke();
        }
        DrawPoint(center, radius, color) {
          //empty
        }
        DrawParticles() {
          //empty
        }
        _applyStrokeColor(color) {
          this._drawer.strokeColor = _tmp_color.set(color.r * 255, color.g * 255, color.b * 255, 150);
        }
        _applyFillColor(color) {
          this._drawer.fillColor = _tmp_color.set(color.r * 255, color.g * 255, color.b * 255, 150);
        }
        PushTransform(xf) {
          this._xf = xf;
        }
        PopTransform() {
          this._xf = this._dxf;
        }
      });
    }
  };
});