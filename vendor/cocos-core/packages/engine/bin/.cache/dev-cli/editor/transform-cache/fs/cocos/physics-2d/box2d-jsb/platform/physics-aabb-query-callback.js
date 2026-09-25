System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/platform/physics-aabb-query-callback.js", ["../../../../../virtual/internal%253Aconstants.js", "../empty-for-editor.js"], function (_export, _context) {
  "use strict";

  var JSB, b2EmptyInstance, PhysicsAABBQueryCallback;
  _export("PhysicsAABBQueryCallback", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
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
      _export("PhysicsAABBQueryCallback", PhysicsAABBQueryCallback = class PhysicsAABBQueryCallback extends b2jsb.QueryCallback {
        constructor(...args) {
          super(...args);
          this._point = new b2jsb.Vec2();
          this._isPoint = false;
          this._fixtures = [];
        }
        init(point) {
          this.initWithThis(this);
          if (point) {
            this._isPoint = true;
            this._point.x = point.x;
            this._point.y = point.y;
          } else {
            this._isPoint = false;
          }
          this._fixtures.length = 0;
        }
        ReportFixture(fixture) {
          if (this._isPoint) {
            if (fixture.TestPoint(this._point)) {
              this._fixtures.push(fixture);
            }
          } else {
            this._fixtures.push(fixture);
          }

          // True to continue the query, false to terminate the query.
          return true;
        }
        getFixture() {
          return this._fixtures[0];
        }
        getFixtures() {
          return this._fixtures;
        }
      });
    }
  };
});