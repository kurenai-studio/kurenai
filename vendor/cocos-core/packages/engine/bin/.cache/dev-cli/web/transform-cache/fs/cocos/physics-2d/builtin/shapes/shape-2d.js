System.register("q-bundled:///fs/cocos/physics-2d/builtin/shapes/shape-2d.js", ["../../../../exports/physics-2d-framework.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var PhysicsSystem2D, Rect, BuiltinShape2D;
  _export("BuiltinShape2D", void 0);
  return {
    setters: [function (_exportsPhysics2dFrameworkJs) {
      PhysicsSystem2D = _exportsPhysics2dFrameworkJs.PhysicsSystem2D;
    }, function (_coreIndexJs) {
      Rect = _coreIndexJs.Rect;
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
      /** @mangle */
      _export("BuiltinShape2D", BuiltinShape2D = class BuiltinShape2D {
        constructor() {
          this._collider = null;
          this._worldAabb = new Rect();
          //contacts contain this Shape
          this._contacts = [];
        }
        get impl() {
          return null;
        }
        get collider() {
          return this._collider;
        }
        apply() {}
        initialize(comp) {
          this._collider = comp;
        }
        onLoad() {}
        onEnable() {
          PhysicsSystem2D.instance.physicsWorld.addShape(this);
        }
        onDisable() {
          PhysicsSystem2D.instance.physicsWorld.removeShape(this);
        }
        start() {}
        update() {}
        get worldAABB() {
          return this._worldAabb;
        }
        containsPoint(p) {
          if (!this.worldAABB.contains(p)) {
            return false;
          }
          return true;
        }
        intersectsRect(rect) {
          if (!this.worldAABB.intersects(rect)) {
            return false;
          }
          return true;
        }
        onGroupChanged() {
          PhysicsSystem2D.instance.physicsWorld.updateShapeGroup(this);
        }
      });
    }
  };
});