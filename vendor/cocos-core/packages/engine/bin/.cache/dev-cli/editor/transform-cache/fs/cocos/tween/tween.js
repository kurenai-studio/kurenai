System.register("q-bundled:///fs/cocos/tween/tween.js", ["./tween-system.js", "../core/index.js", "./actions/action-interval.js", "./actions/action-instant.js", "./actions/action-unknown-duration.js", "./actions/action.js", "./tween-action.js", "./set-action.js", "../core/global-exports.js", "../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var TweenSystem, warnID, ActionInterval, sequence, reverseTime, delayTime, spawn, Sequence, Spawn, repeat, repeatForever, RepeatForever, ActionCustomUpdate, removeSelf, show, hide, callFunc, ActionUnknownDuration, ActionEnum, TweenAction, SetAction, legacyCC, Node, Tween;
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

  // https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c

  // eslint-disable-next-line @typescript-eslint/ban-types

  function getActionManager() {
    return TweenSystem.instance.ActionManager;
  }

  /**
   * @en
   * Tween provide a simple and flexible way to action, It's transplanted from cocos creator。
   * @zh
   * Tween 提供了一个简单灵活的方法来缓动目标，从 creator 移植而来。
   * @class Tween
   * @param [target]
   * @example
   * tween(this.node)
   *   .to(1, {scale: new Vec3(2, 2, 2), position: new Vec3(5, 5, 5)})
   *   .call(() => { console.log('This is a callback'); })
   *   .by(1, {scale: new Vec3(-1, -1, -1), position: new Vec3(-5, -5, -5)}, {easing: 'sineOutIn'})
   *   .start()
   */

  /**
   * @en
   * tween is a utility function that helps instantiate Tween instances.
   * @zh
   * tween 是一个工具函数，帮助实例化 Tween 实例。
   * @param target @en The target of the result tween @zh 缓动的目标
   * @returns Tween 实例
   * @example
   * tween(this.node)
   *   .to(1, {scale: new Vec3(2, 2, 2), position: new Vec3(5, 5, 5)})
   *   .call(() => { console.log('This is a callback'); })
   *   .by(1, {scale: new Vec3(-1, -1, -1)}, {easing: 'sineOutIn'})
   *   .start()
   */
  function tween(target) {
    return new Tween(target);
  }
  /**
   * @en
   * tweenUtil is a utility function that helps instantiate Tween instances.
   * @zh
   * tweenUtil 是一个工具函数，帮助实例化 Tween 实例。
   * @deprecated please use `tween` instead.
   */
  function tweenUtil(target) {
    warnID(16396);
    return new Tween(target);
  }
  _export({
    Tween: void 0,
    tween: tween,
    tweenUtil: tweenUtil
  });
  return {
    setters: [function (_tweenSystemJs) {
      TweenSystem = _tweenSystemJs.TweenSystem;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
    }, function (_actionsActionIntervalJs) {
      ActionInterval = _actionsActionIntervalJs.ActionInterval;
      sequence = _actionsActionIntervalJs.sequence;
      reverseTime = _actionsActionIntervalJs.reverseTime;
      delayTime = _actionsActionIntervalJs.delayTime;
      spawn = _actionsActionIntervalJs.spawn;
      Sequence = _actionsActionIntervalJs.Sequence;
      Spawn = _actionsActionIntervalJs.Spawn;
      repeat = _actionsActionIntervalJs.repeat;
      repeatForever = _actionsActionIntervalJs.repeatForever;
      RepeatForever = _actionsActionIntervalJs.RepeatForever;
      ActionCustomUpdate = _actionsActionIntervalJs.ActionCustomUpdate;
    }, function (_actionsActionInstantJs) {
      removeSelf = _actionsActionInstantJs.removeSelf;
      show = _actionsActionInstantJs.show;
      hide = _actionsActionInstantJs.hide;
      callFunc = _actionsActionInstantJs.callFunc;
    }, function (_actionsActionUnknownDurationJs) {
      ActionUnknownDuration = _actionsActionUnknownDurationJs.ActionUnknownDuration;
    }, function (_actionsActionJs) {
      ActionEnum = _actionsActionJs.ActionEnum;
    }, function (_tweenActionJs) {
      TweenAction = _tweenActionJs.TweenAction;
    }, function (_setActionJs) {
      SetAction = _setActionJs.SetAction;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }],
    execute: function () {
      _export("Tween", Tween = class Tween {
        // The default value is true which is compatible with Creator 2.x. See 'bindNodeState' method.

        constructor(target) {
          this._actions = [];
          this._finalAction = null;
          this._target = null;
          this._tag = ActionEnum.TAG_INVALID;
          this._timeScale = 1;
          this._isBindNodeState = true;
          this._target = target === undefined ? null : target;
        }

        /**
         * @en Set whether to bind the current tween's lifecycle with node target's state. (Supported from v3.8.7)
         * If set it to true :
         * - When the node is activated, the tween will automatically resume.
         * - When the node is deactivated, the tween will automatically pause.
         * - When the node is destroyed, the tween will automatically be destroyed.
         * @zh 设置当前缓动是否需要关联节点状态。如果设置为真，那么节点被激活，缓动会被自动恢复，节点被禁用，缓动会被自动暂停，节点销毁后，缓动会被自动销毁。 (从 v3.8.7 开始支持)
         * @param isBindNodeState @en Whether to associate node state for the current tween. @zh 关联节点状态。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         * @note @en If not set, the default value is true which is compatible with Creator 2.x. If only works on the tween with Node target.
         *       @zh 如果此接口未被调用，为兼容 Creator 2.x，其默认值为 true 。此方法只针对 Node 目标的 tween 有效。
         */
        bindNodeState(isBindNodeState) {
          this._isBindNodeState = isBindNodeState;
          return this;
        }

        /**
         * @en Sets tween tag
         * @zh 设置缓动的标签
         * @method tag
         * @param tag @en The tag set for this tween @zh 为当前缓动设置的标签
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        tag(tag) {
          this._tag = tag;
          return this;
        }

        /**
         * @en Set the id for previous action
         * @zh 设置前一个动作的 id
         * @param id @en The internal action id to set @zh 内部动作的 id 标识，
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        id(id) {
          if (this._actions.length > 0) {
            this._actions[this._actions.length - 1].setId(id);
          }
          return this;
        }

        /**
         * @en
         * Insert a tween to this sequence.
         * @zh
         * 插入一个 tween 到队列中。
         * @method then
         * @param other @en The rear tween of this tween @zh 当前缓动的后置缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        then(other) {
          const u = other._union(true);
          if (u) {
            u.setSpeed(other._timeScale);
            this._actions.push(u);
          }
          return this;
        }

        /**
         * @en Return a new Tween instance which reverses all actions in the current tween.
         * @zh 返回新的缓动实例，其会翻转当前缓动中的所有动作。
         * @return @en The new tween instance which reverses all actions in the current tween. @zh 新的缓动实例，其会翻转当前缓动中的所有动作。
         * @note @en The returned tween instance is a new instance which is not the current tween instance.
         *       @zh 返回的缓动实例是新的生成的实例，并不是当前缓动实例。
         */

        /**
         * @en Reverse an action by ID in the current tween.
         * @zh 翻转当前缓动中特定标识的动作。
         * @param id @en The ID of the internal action in the current tween to reverse. @zh 要翻转的当前缓动中的动作标识。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */

        /**
         * @en Reverse an action by ID in a specific tween
         * @zh 翻转特定缓动中特定标识的动作
         * @param otherTween @en The tween in which to find the action by ID
         *                   @zh 根据标识在关联的缓动中查找动作
         * @param id @en The ID of the action to reverse @zh 要翻转的动画标识
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */

        reverse(otherTweenOrId, id) {
          // Overload 1: reverse()
          if (otherTweenOrId == null && id == null) {
            return this.reverseTween();
          }
          let tweenForFindAction;
          let actionId;
          if (otherTweenOrId instanceof Tween) {
            // Overload 3: reverse(otherTween: Tween<U>, id? number)
            tweenForFindAction = otherTweenOrId;
            if (id !== undefined) {
              actionId = id;
            }
          } else if (typeof otherTweenOrId === 'number') {
            // Overload 2: reverse(id: number)
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            tweenForFindAction = this;
            actionId = otherTweenOrId;
          }
          if (tweenForFindAction) {
            const reversedAction = Tween.reverseAction(tweenForFindAction, actionId);
            if (reversedAction) {
              this._actions.push(reversedAction);
            }
          }
          return this;
        }
        reverseTween() {
          if (this._actions.length === 0) {
            warnID(16388);
            return this.clone(this._target);
          }
          const action = this._union(false); // workerTarget will be updated in the following insertAction
          const r = tween(this._target);
          r._timeScale = this._timeScale;
          if (action) r.insertAction(action.reverse());
          return r;
        }
        static reverseAction(t, actionId) {
          const actions = t._actions;
          if (actions.length === 0) return null;
          let action = null;
          let reversedAction = null;
          if (typeof actionId === 'number') {
            action = t.findAction(actionId, actions);
          } else if (t) {
            action = t._union(false);
          }
          if (action) {
            reversedAction = action.reverse();
            reversedAction._owner = t;
          } else {
            warnID(16391, `${actionId}`);
          }
          return reversedAction;
        }
        findAction(id, actions) {
          let action = null;
          for (let i = 0, len = actions.length; i < len; ++i) {
            action = actions[i];
            if (action.getId() === id) return action;
            if (action instanceof Sequence || action instanceof Spawn) {
              action = action.findAction(id);
              if (action) return action;
            }
          }
          return null;
        }

        /**
         * Insert an action to this sequence.
         * @param other @en The rear action of this tween @zh 当前缓动的后置缓动
         */
        insertAction(other) {
          const action = other.clone();
          this.updateOwnerForAction(action);
          this._actions.push(action);
          return this;
        }
        updateOwnerForAction(action) {
          if (!action) return;
          if (action instanceof Sequence || action instanceof Spawn) {
            action.updateOwner(this);
          } else if (!action._owner) {
            // action's owner should never be changed, so only set owner when it's not set yet.
            action._owner = this;
          }
        }

        /**
         * @en
         * Sets tween target.
         * @zh
         * 设置 tween 的 target。
         * @method target
         * @param target @en The target of this tween @zh 当前缓动的目标对象
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        target(target) {
          this._target = target;
          return this;
        }

        /**
         * @en Gets the target of the current tween instance.
         * @zh 获取当前缓动的目标对象。
         * @return @en the target of the current tween instance. @zh 当前缓动的目标对象。
         */
        getTarget() {
          return this._target;
        }

        /**
         * @en Start tween from a specific time, all actions before the time will be executed and finished immediately.
         * @zh 从指定时间开始执行当前缓动，此时间前的所有缓动将被立马执行完毕。
         * @param time @en The time (unit: seconds) to start to execute the current tween. Default value: 0.
         *             @zh 要执行当前缓动的开始时间，单位为秒。默认值为 0。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        start(time = 0) {
          if (!this._target) {
            warnID(16392);
            return this;
          }
          if (this._finalAction) {
            getActionManager().removeAction(this._finalAction);
          }
          const final = this._unionForStart();
          this._finalAction = final;
          if (final) {
            final.setTag(this._tag);
            final.setSpeed(this._timeScale);
            final.setStartTime(time);
            final.setPaused(false); // If a tween was paused, starting the tween again should clear the 'paused' flag for the final action.
            getActionManager().addAction(final, this._target, false, this._isBindNodeState);
          } else {
            warnID(16393);
          }
          return this;
        }

        /**
         * @en
         * Stop this tween.
         * @zh
         * 停止当前 tween。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        stop() {
          if (this._finalAction) {
            // ActionManager.removeAction will not stop action, so stop it before removeAction.
            this._finalAction.stop();
            getActionManager().removeAction(this._finalAction);
            this._finalAction = null;
          }
          return this;
        }

        /**
         * @en Pause the tween instance.
         * @zh 暂停此缓动实例。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        pause() {
          if (this._finalAction) {
            this._finalAction.setPaused(true);
          } else {
            warnID(16389);
          }
          return this;
        }

        /**
         * @en Resume the tween instance.
         * @zh 恢复此缓动实例。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        resume() {
          if (this._finalAction) {
            this._finalAction.setPaused(false);
          } else {
            warnID(16390);
          }
          return this;
        }

        /**
         * @en Checking whether the current tween instance is running.
         * @zh 检查当前缓动实例是否在运行。
         */
        get running() {
          if (this._finalAction) {
            return getActionManager().isActionRunning(this._finalAction);
          }
          return false;
        }

        /**
         * @en
         * Clone a tween.
         * @zh
         * 克隆当前 tween。
         * @method clone
         * @param target @en The target of clone tween @zh 克隆缓动的目标对象
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */

        clone(target) {
          const action = this._union(false);
          const r = tween(target != null ? target : this._target);
          r._timeScale = this._timeScale;
          return action ? r.insertAction(action) : r;
        }

        /**
         * @en
         * Integrate to an action by all previous actions or a range from the specific id to the last one.
         * @zh
         * 将之前所有的动作或者从指定标识的动作开始的所有动作整合为一个顺序动作。
         * @method union
         * @param fromId @en The action with the specific ID to start integrating @zh 指定开始整合的动作标识
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        union(fromId) {
          const unionAll = () => {
            const action = this._union(false);
            this._actions.length = 0;
            if (action) this._actions.push(action);
          };
          if (fromId === undefined) {
            unionAll();
            return this;
          }
          const actions = this._actions;
          const index = actions.findIndex(action => action.getId() === fromId);
          const len = actions.length;
          if (len > 1) {
            const actionsToUnion = actions.splice(index);
            if (actionsToUnion.length === 1) {
              actions.push(actionsToUnion[0]);
            } else {
              actions.push(sequence(actionsToUnion));
            }
          }
          return this;
        }

        /**
         * @en
         * Add an action which calculates with absolute value.
         * @zh
         * 添加一个对属性进行绝对值计算的 action。
         * @method to
         * @param duration @en Tween time, in seconds @zh 缓动时间，单位为秒
         * @param props @en List of properties of tween @zh 缓动的属性列表
         * @param opts @en Optional functions of tween @zh 可选的缓动功能
         * @param opts.progress @en Interpolation function @zh 缓动的速度插值函数
         * @param opts.easing @en Tween function or a lambda @zh 缓动的曲线函数或lambda表达式
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        to(duration, props, opts) {
          const options = opts || Object.create(null);
          options.relative = false;
          const action = new TweenAction(duration, props, options);
          this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Add an action which calculates with relative value.
         * @zh
         * 添加一个对属性进行相对值计算的 action。
         * @method by
         * @param duration @en Tween time, in seconds @zh 缓动时间，单位为秒
         * @param props @en List of properties of tween @zh 缓动的属性列表
         * @param opts @en Optional functions of tween @zh 可选的缓动功能
         * @param [opts.progress]
         * @param [opts.easing]
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        by(duration, props, opts) {
          const options = opts || Object.create(null);
          options.relative = true;
          const action = new TweenAction(duration, props, options);
          this._actions.push(action);
          return this;
        }

        /**
         * @en Add a custom action with constant duration.
         * @zh 添加一个固定时长的自定义动作。
         * @param duration @en The tween time in seconds. @zh 缓动时间，单位为秒。
         * @param cb @en The callback of the current action. @zh 动作回调函数。
         * @param args @en The arguments passed to the callback function. @zh 传递给动作回调函数的参数。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        update(duration, cb, ...args) {
          const action = new ActionCustomUpdate(duration, cb, args);
          this._actions.push(action);
          return this;
        }

        /**
         * @en Add a custom action with unknown duration. If the callback returns true means this action is finished.
         * @zh 添加一个不确定时长的自定义动作。如果回调函数返回 true，表示当前动作结束。
         * @param cb @en The callback of the current action. @zh 动作回调函数。如果回调函数返回 true，表示当前动作结束。
         * @param args @en The arguments passed to the callback function. @zh 传递给动作回调函数的参数。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        updateUntil(cb, ...args) {
          const action = new ActionUnknownDuration(cb, args);
          this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Directly set target properties.
         * @zh
         * 直接设置 target 的属性。
         * @method set
         * @param props @en List of properties of tween @zh 缓动的属性列表
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        set(props) {
          const action = new SetAction(props);
          this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Add a delay action.
         * @zh
         * 添加一个延时 action。
         * @method delay
         * @param duration @en Delay time of this tween @zh 当前缓动的延迟时间
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        delay(duration) {
          const action = delayTime(duration);
          this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Add a callback action.
         * @zh
         * 添加一个回调 action。
         * @method call
         * @param callback @en Callback function at the end of this tween @zh 当前缓动结束时的回调函数
         * @param callbackThis @en The this object in callback function @zh 回调函数中的 this 对象
         * @param data @en The Custom data that will be passed to callback @zh 要传递给回调函数的自定义数据
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        call(callback, callbackThis, data) {
          const action = callFunc(callback, callbackThis, data);
          this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Add a sequence action.
         * @zh
         * 添加一个队列 action。
         * @method sequence
         * @param args @en All tween that make up the sequence @zh 组成队列的所有缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        sequence(...args) {
          const action = Tween._wrappedSequence(args);
          if (action) this._actions.push(action);
          return this;
        }

        /**
         * @en
         * Add a parallel action.
         * @zh
         * 添加一个并行 action。
         * @method parallel
         * @param args @en The tween parallel to this tween @zh 与当前缓动并行的缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        parallel(...args) {
          const action = Tween._wrappedParallel(args);
          if (action) this._actions.push(action);
          return this;
        }

        /**
         * @en Set the factor that's used to scale time in the animation where 1 = normal speed (the default), 0.5 = half speed, 2 = double speed, etc.
         * @zh 设置动画中使用的缩放时间因子，其中 1 表示正常速度（默认值），0.5 表示减速一半，2 表示加速一倍，等等。
         * @param scale @en The scale factor to set. @zh 要设置的缩放因子。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        timeScale(scale) {
          this._timeScale = scale;
          if (this._finalAction) {
            this._finalAction.setSpeed(scale);
          }
          return this;
        }

        /**
         * @en Return the scale time factor of the current tween.
         * @zh 返回当前缓动的时间缩放因子。
         * @return @en The scale time factor of the current tween. @zh 当前缓动的时间缩放因子。
         */
        getTimeScale() {
          return this._timeScale;
        }

        /**
         * @en Return the duration of the current tween, its value is constant which means it's determinted at tween's design time
         *     and is not affected by the timeScale of the current tween.
         * @zh 返回当前缓动的总时长，此总时长为缓动的设计总时长，不受当前缓动的 timeScale 值影响。
         * @return @en The duration of the current tween, unit is seconds. @zh 当中缓动的总时长，单位为秒。
         * @note @en Return a valid duration value only after tween was started, otherwise, it returns 0.
         *       @zh 只有在缓动开始后才能返回有效值，否则返回 0。
         */
        get duration() {
          if (this._finalAction) {
            return this._finalAction.getDuration();
          }
          return 0;
        }

        /**
         * @en
         * Add a repeat action.
         * This action will integrate before actions to a sequence action as their parameters.
         * @zh
         * 添加一个重复 action，这个 action 会将前一个动作作为他的参数。
         * @param repeatTimes @en The repeat times of this tween @zh 重复次数
         * @param embedTween @en Optional, embedded tween of this tween @zh 可选，嵌入缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        repeat(repeatTimes, embedTween) {
          /** adapter */
          if (repeatTimes === Infinity) {
            return this.repeatForever(embedTween);
          }
          const actions = this._actions;
          let action;
          if (embedTween instanceof Tween) {
            action = embedTween._union(false);
          } else {
            action = actions.pop();
          }
          if (action) actions.push(repeat(action, repeatTimes));
          return this;
        }

        /**
         * @en
         * Add a repeat forever action.
         * This action will integrate before actions to a sequence action as their parameters.
         * @zh
         * 添加一个永久重复 action，这个 action 会将前一个动作作为他的参数。
         * @method repeatForever
         * @param embedTween @en Optional, embedded tween of this tween @zh 可选，嵌入缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        repeatForever(embedTween) {
          const actions = this._actions;
          let action;
          if (embedTween instanceof Tween) {
            action = embedTween._union(false);
          } else {
            action = actions.pop();
          }
          if (action && actions.length !== 0) {
            actions.push(repeat(action, Number.MAX_SAFE_INTEGER));
          } else if (action instanceof ActionInterval) {
            actions.push(repeatForever(action));
          } else {
            warnID(16394);
          }
          return this;
        }

        /**
         * @en
         * Add a reverse time action.
         * This action will integrate before actions to a sequence action as their parameters.
         * @zh
         * 添加一个倒置时间 action，这个 action 会将前一个动作作为他的参数。
         * @method reverseTime
         * @param embedTween @en Optional, embedded tween of this tween @zh 可选，嵌入缓动
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        reverseTime(embedTween) {
          const actions = this._actions;
          let action;
          if (embedTween instanceof Tween) {
            action = embedTween._union(false);
          } else {
            action = actions.pop();
          }
          if (action instanceof ActionInterval) {
            actions.push(reverseTime(action));
          } else {
            warnID(16395);
          }
          return this;
        }

        /**
         * @en
         * Add a hide action, only for node target.
         * @zh
         * 添加一个隐藏 action，只适用于 target 是节点类型的。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        hide() {
          const isNode = this._target instanceof Node;
          if (isNode) {
            const action = hide();
            this._actions.push(action);
          }
          return this;
        }

        /**
         * @en
         * Add a show action, only for node target.
         * @zh
         * 添加一个显示 action，只适用于 target 是节点类型的。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        show() {
          const isNode = this._target instanceof Node;
          if (isNode) {
            const action = show();
            this._actions.push(action);
          }
          return this;
        }

        /**
         * @en
         * Add a removeSelf action, only for node target.
         * @zh
         * 添加一个移除自己 action，只适用于 target 是节点类型的。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        removeSelf() {
          const isNode = this._target instanceof Node;
          if (isNode) {
            const action = removeSelf(false);
            this._actions.push(action);
          }
          return this;
        }

        /**
         * @en
         * Add a destroySelf action, only for node target.
         * @zh
         * 添加一个移除并销毁自己 action，只适用于 target 是节点类型的。
         * @return @en The instance itself for easier chaining. @zh 返回该实例本身，以便于链式调用。
         */
        destroySelf() {
          const isNode = this._target instanceof Node;
          if (isNode) {
            const action = removeSelf(true);
            this._actions.push(action);
          }
          return this;
        }

        /**
         * @en Get the count of running tween instances those associate with the target.
         * @zh 获取目标对象关联的正在运行的缓动实例的个数。
         * @param target @en The target to check. @zh 要检查的目标对象。
         * @return @en The count of running tween instances those associate with the target.
         *         @zh 目标对象关联的正在运行的缓动实例的个数。
         */
        static getRunningCount(target) {
          return getActionManager().getNumberOfRunningActionsInTarget(target);
        }

        /**
         * @en
         * Stop all tween instances.
         * @zh
         * 停止所有缓动实例
         */
        static stopAll() {
          getActionManager().removeAllActions();
        }
        /**
         * @en
         * Stop all tween instances by tag.
         * @zh
         * 停止指定标签关联的所有缓动实例。
         */
        static stopAllByTag(tag, target) {
          getActionManager().removeAllActionsByTag(tag, target);
        }
        /**
         * @en
         * Stop all tween instances associated with the target object.
         * @zh
         * 停止指定对象的关联的所有缓动实例。
         */
        static stopAllByTarget(target) {
          getActionManager().removeAllActionsFromTarget(target);
        }

        /**
         * @en Pause all tween instances associated with the target object.
         * @zh 暂停目标对象关联的所有缓动实例。
         * @param target @en The target object whose tweens should be paused. @zh 要暂停缓动的目标对象。
         */
        static pauseAllByTarget(target) {
          getActionManager().pauseTarget(target);
        }

        /**
         * @en Resume all tween instances associated with the target object.
         * @zh 恢复目标对象关联的所有缓动实例。
         * @param target @en The target object whose tweens should be resumed. @zh 要恢复缓动的目标对象。
         */
        static resumeAllByTarget(target) {
          getActionManager().resumeTarget(target);
        }
        _union(needUpdateOwner) {
          const actions = this._actions;
          if (actions.length === 0) return null;
          const action = sequence(actions);
          if (needUpdateOwner) {
            this.updateOwnerForAction(action);
          }
          return action;
        }
        _unionForStart() {
          const actions = this._actions;
          if (actions.length === 0) return null;
          let action;
          if (actions.length === 1 && actions[0] instanceof RepeatForever) {
            action = actions[0];
          } else {
            action = sequence(actions);
          }
          return action;
        }
        static _tweenToActions(args) {
          const tmpArgs = Tween._tmpArgs;
          tmpArgs.length = 0;
          for (let l = args.length, i = 0; i < l; i++) {
            const t = args[i];
            const action = t._union(true);
            if (action) {
              action.setSpeed(t._timeScale);
              tmpArgs.push(action);
            }
          }
        }
        static _wrappedSequence(args) {
          Tween._tweenToActions(args);
          const ret = sequence(Tween._tmpArgs);
          this._tmpArgs.length = 0;
          return ret;
        }
        static _wrappedParallel(args) {
          Tween._tweenToActions(args);
          const ret = spawn(Tween._tmpArgs);
          this._tmpArgs.length = 0;
          return ret;
        }
      });
      Tween._tmpArgs = [];
      legacyCC.Tween = Tween;
      legacyCC.tween = tween;
      legacyCC.tweenUtil = tweenUtil;
    }
  };
});