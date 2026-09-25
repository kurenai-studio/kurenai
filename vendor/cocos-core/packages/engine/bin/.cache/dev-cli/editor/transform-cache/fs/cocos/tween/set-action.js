System.register("q-bundled:///fs/cocos/tween/set-action.js", ["./actions/action-instant.js"], function (_export, _context) {
  "use strict";

  var ActionInstant, SetAction;
  _export("SetAction", void 0);
  return {
    setters: [function (_actionsActionInstantJs) {
      ActionInstant = _actionsActionInstantJs.ActionInstant;
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
      _export("SetAction", SetAction = class SetAction extends ActionInstant {
        constructor(props) {
          super();
          this._props = void 0;
          this._props = {};
          if (props) this.init(props);
        }
        init(props) {
          for (const name in props) {
            this._props[name] = props[name];
          }
          return true;
        }
        update() {
          const props = this._props;
          const target = this._getWorkerTarget();
          for (const name in props) {
            target[name] = props[name];
          }
        }
        clone() {
          const action = new SetAction();
          action._id = this._id;
          action.init(this._props);
          return action;
        }
        isUnknownDuration() {
          return false;
        }
      });
    }
  };
});