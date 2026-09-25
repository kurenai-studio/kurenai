System.register("q-bundled:///fs/cocos/tween/actions/action-instant.js", ["./action.js", "../../misc/renderer.js"], function (_export, _context) {
  "use strict";

  var FiniteTimeAction, Renderer, ActionInstant, Show, Hide, ToggleVisibility, RemoveSelf, CallFunc;
  /**
   * @en Show the Node.
   * @zh 立即显示。
   * @method show
   * @return {Show}
   * @example
   * // example
   * var showAction = show();
   */
  function show() {
    return new Show();
  }

  /*
   * Hide the node.
   * @class Hide
   * @extends ActionInstant
   */

  /**
   * @en Hide the node.
   * @zh 立即隐藏。
   * @method hide
   * @return {Hide}
   * @example
   * // example
   * var hideAction = hide();
   */
  function hide() {
    return new Hide();
  }

  /*
   * Toggles the visibility of a node.
   * @class ToggleVisibility
   * @extends ActionInstant
   */

  /**
   * @en Toggles the visibility of a node.
   * @zh 显隐状态切换。
   * @method toggleVisibility
   * @return {ToggleVisibility}
   * @example
   * // example
   * var toggleVisibilityAction = toggleVisibility();
   */
  function toggleVisibility() {
    return new ToggleVisibility();
  }

  /*
   * Delete self in the next frame.
   * @class RemoveSelf
   * @extends ActionInstant
   * @param {Boolean} [isNeedCleanUp=true]
   *
   * @example
   * // example
   * var removeSelfAction = new RemoveSelf(false);
   */

  /**
   * @en Create a RemoveSelf object with a flag indicate whether the target should be cleaned up while removing.
   * @zh 从父节点移除自身。
   * @method removeSelf
   * @param {Boolean} [isNeedCleanUp = true]
   * @return {RemoveSelf}
   *
   * @example
   * // example
   * var removeSelfAction = removeSelf();
   */
  function removeSelf(isNeedCleanUp) {
    return new RemoveSelf(isNeedCleanUp);
  }
  /**
   * @en Creates the action with the callback.
   * @zh 执行回调函数。
   * @method callFunc
   * @param {function} selector
   * @param {object} [selectorTarget=null]
   * @param {*} [data=null] - data for function, it accepts all data types.
   * @return {ActionInstant}
   * @example
   * // example
   * // CallFunc without data
   * var finish = callFunc(this.removeSprite, this);
   *
   * // CallFunc with data
   * var finish = callFunc(this.removeFromParentAndCleanup, this._grossini,  true);
   */
  function callFunc(selector, selectorTarget, data) {
    return new CallFunc(selector, selectorTarget, data);
  }
  _export({
    ActionInstant: void 0,
    Show: void 0,
    show: show,
    Hide: void 0,
    hide: hide,
    ToggleVisibility: void 0,
    toggleVisibility: toggleVisibility,
    RemoveSelf: void 0,
    removeSelf: removeSelf,
    CallFunc: void 0,
    callFunc: callFunc
  });
  return {
    setters: [function (_actionJs) {
      FiniteTimeAction = _actionJs.FiniteTimeAction;
    }, function (_miscRendererJs) {
      Renderer = _miscRendererJs.Renderer;
    }],
    execute: function () {
      /*
       Copyright (c) 2008-2010 Ricardo Quesada
       Copyright (c) 2011-2012 cocos2d-x.org
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
       * @en Instant actions are immediate actions. They don't have a duration like the ActionInterval actions.
       * @zh 即时动作，这种动作立即就会执行，继承自 FiniteTimeAction。
       * @class ActionInstant
       * @extends FiniteTimeAction
       */
      _export("ActionInstant", ActionInstant = class ActionInstant extends FiniteTimeAction {
        isDone() {
          return true;
        }
        step(_dt) {
          this.update(1);
        }
        update(_dt) {
          // nothing
        }

        /**
         * returns a reversed action. <br />
         * For example: <br />
         * - The action is x coordinates of 0 move to 100. <br />
         * - The reversed action will be x of 100 move to 0.
         * @returns {Action}
         */
        reverse() {
          return this.clone();
        }
        isUnknownDuration() {
          return false;
        }
      });
      /*
       * Show the node.
       * @class Show
       * @extends ActionInstant
       */
      _export("Show", Show = class Show extends ActionInstant {
        update(_dt) {
          const target = this._getWorkerTarget();
          if (!target) return;
          const _renderComps = target.getComponentsInChildren(Renderer);
          for (let i = 0; i < _renderComps.length; ++i) {
            const render = _renderComps[i];
            render.enabled = true;
          }
        }
        reverse() {
          return new Hide();
        }
        clone() {
          const action = new Show();
          action._id = this._id;
          return action;
        }
        toString() {
          return '<Show>';
        }
      });
      _export("Hide", Hide = class Hide extends ActionInstant {
        update(_dt) {
          const target = this._getWorkerTarget();
          if (!target) return;
          const _renderComps = target.getComponentsInChildren(Renderer);
          for (let i = 0; i < _renderComps.length; ++i) {
            const render = _renderComps[i];
            render.enabled = false;
          }
        }
        reverse() {
          return new Show();
        }
        clone() {
          const action = new Hide();
          action._id = this._id;
          return action;
        }
        toString() {
          return '<Hide>';
        }
      });
      _export("ToggleVisibility", ToggleVisibility = class ToggleVisibility extends ActionInstant {
        update(_dt) {
          const target = this._getWorkerTarget();
          if (!target) return;
          const _renderComps = target.getComponentsInChildren(Renderer);
          for (let i = 0; i < _renderComps.length; ++i) {
            const render = _renderComps[i];
            render.enabled = !render.enabled;
          }
        }
        reverse() {
          return new ToggleVisibility();
        }
        clone() {
          const action = new ToggleVisibility();
          action._id = this._id;
          return action;
        }
        toString() {
          return '<ToggleVisibility>';
        }
      });
      _export("RemoveSelf", RemoveSelf = class RemoveSelf extends ActionInstant {
        constructor(isNeedCleanUp) {
          super();
          this._isNeedCleanUp = true;
          if (isNeedCleanUp !== undefined) this.init(isNeedCleanUp);
        }
        update(_dt) {
          const target = this._getWorkerTarget();
          if (!target) return;
          target.removeFromParent();
          if (this._isNeedCleanUp) {
            target.destroy();
          }
        }
        init(isNeedCleanUp) {
          this._isNeedCleanUp = isNeedCleanUp;
          return true;
        }
        reverse() {
          return new RemoveSelf(this._isNeedCleanUp);
        }
        clone() {
          const action = new RemoveSelf(this._isNeedCleanUp);
          action._id = this._id;
          return action;
        }
        toString() {
          return '<RemoveSelf>';
        }
      });
      /*
       * Calls a 'callback'.
       * @class CallFunc
       * @extends ActionInstant
       * @param {function} selector
       * @param {object} [selectorTarget=null]
       * @param {*} [data=null] data for function, it accepts all data types.
       * @example
       * // example
       * // CallFunc without data
       * var finish = new CallFunc(this.removeSprite, this);
       *
       * // CallFunc with data
       * var finish = new CallFunc(this.removeFromParentAndCleanup, this,  true);
       */
      _export("CallFunc", CallFunc = class CallFunc extends ActionInstant {
        /*
         * Constructor function, override it to extend the construction behavior, remember to call "super()". <br />
         * Creates a CallFunc action with the callback.
         * @param callback The callback function
         * @param callbackThis The this object for callback
         * @param data The custom data passed to the callback function, it accepts all data types.
         */
        constructor(selector, callbackThis, data) {
          super();
          this._callbackThis = undefined;
          this._callback = undefined;
          this._data = undefined;
          this.initWithFunction(selector, callbackThis, data);
        }

        /*
         * Initializes the action with a function or function and its target
         * @param callback The callback function
         * @param callbackThis The this object for callback
         * @param data The custom data passed to the callback function, it accepts all data types.
         * @return This function always returns true.
         */
        initWithFunction(callback, callbackThis, data) {
          if (callback) {
            this._callback = callback;
          }
          if (callbackThis) {
            this._callbackThis = callbackThis;
          }
          if (data !== undefined) {
            this._data = data;
          }
          return true;
        }

        /*
         * execute the function.
         */
        execute() {
          if (this._callback) {
            const target = this._getWorkerTarget();
            this._callback.call(this._callbackThis, target, this._data);
          }
        }
        update(_dt) {
          this.execute();
        }

        /*
         * Get selectorTarget.
         * @mangle
         */
        getTargetCallback() {
          return this._callbackThis;
        }

        /*
         * Set selectorTarget.
         * @mangle
         */
        setTargetCallback(sel) {
          if (sel !== this._callbackThis) {
            this._callbackThis = sel;
          }
        }
        clone() {
          const action = new CallFunc();
          action._id = this._id;
          if (this._callback) action.initWithFunction(this._callback, this._callbackThis, this._data);
          return action;
        }
        toString() {
          return `<CallFunc>`;
        }
      });
    }
  };
});