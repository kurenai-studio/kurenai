System.register("q-bundled:///fs/cocos/tween/actions/action-unknown-duration.js", ["./action.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var FiniteTimeAction, cclegacy, ActionUnknownDuration;
  _export("ActionUnknownDuration", void 0);
  return {
    setters: [function (_actionJs) {
      FiniteTimeAction = _actionJs.FiniteTimeAction;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com
      
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
      _export("ActionUnknownDuration", ActionUnknownDuration = class ActionUnknownDuration extends FiniteTimeAction {
        constructor(cb, args) {
          super();
          this._finished = false;
          this._cb = cb;
          this._args = args;
        }
        clone() {
          return new ActionUnknownDuration(this._cb, this._args);
        }
        reverse() {
          return this.clone();
        }
        step(dt) {
          throw new Error('should never go here');
        }
        update(t) {
          const dt = cclegacy.game.deltaTime;
          this._finished = this._cb(this.target, dt, ...this._args);
        }
        isDone() {
          return this._finished;
        }
        isUnknownDuration() {
          return !this.isDone();
        }
        toString() {
          return `<ActionUnknownDuration>`;
        }
      });
    }
  };
});