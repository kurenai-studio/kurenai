System.register("q-bundled:///fs/cocos/core/scheduler.js", ["./utils/id-generator.js", "./utils/js.js", "./system.js", "./global-exports.js", "./platform/debug.js"], function (_export, _context) {
  "use strict";

  var IDGenerator, createMap, System, SystemPriority, legacyCC, errorID, warnID, logID, assertID, ListEntry, HashUpdateEntry, HashTimerEntry, CallbackTimer, Scheduler, MAX_POOL_SIZE, idGenerator;
  _export("Scheduler", void 0);
  return {
    setters: [function (_utilsIdGeneratorJs) {
      IDGenerator = _utilsIdGeneratorJs.IDGenerator;
    }, function (_utilsJsJs) {
      createMap = _utilsJsJs.createMap;
    }, function (_systemJs) {
      System = _systemJs.System;
      SystemPriority = _systemJs.SystemPriority;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }, function (_platformDebugJs) {
      errorID = _platformDebugJs.errorID;
      warnID = _platformDebugJs.warnID;
      logID = _platformDebugJs.logID;
      assertID = _platformDebugJs.assertID;
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
      MAX_POOL_SIZE = 20;
      idGenerator = new IDGenerator('Scheduler');
      // data structures
      /**
       * @en A list double-linked list used for "updates with priority".
       * @zh 用于“优先更新”的列表。
       * @class ListEntry
       * @mangle
       */
      ListEntry = class ListEntry {
        static get(target, priority, paused, markedForDeletion) {
          let result = ListEntry._listEntries.pop();
          if (result) {
            result.target = target;
            result.priority = priority;
            result.paused = paused;
            result.markedForDeletion = markedForDeletion;
          } else {
            result = new ListEntry(target, priority, paused, markedForDeletion);
          }
          return result;
        }
        static put(entry) {
          if (ListEntry._listEntries.length < MAX_POOL_SIZE) {
            entry.target = null;
            ListEntry._listEntries.push(entry);
          }
        }
        /**
         * @en The constructor of ListEntry.
         * @zh ListEntry 的构造函数。
         * @param target
         * @en Target object, which is ISchedulable type, retained by hashUpdateEntry.
         * @zh 目标对象, 为ISchedulable类型. 被hashUpdateEntry持有。
         * @param priority
         * @en The priority.
         * @zh 优先级。
         * @param paused
         * @en Whether is paused.
         * @zh 是否被暂停。
         * @param markedForDeletion
         * @en Mark for deletion. if true, selector will no longer be called and entry will be removed at end of the next tick.
         * @zh 删除标记, 当为true时, selector 将不再被调用，并且entry将在下一个tick结束时被删除。
         */
        constructor(target, priority, paused, markedForDeletion) {
          this.target = void 0;
          this.priority = void 0;
          this.paused = void 0;
          this.markedForDeletion = void 0;
          this.target = target;
          this.priority = priority;
          this.paused = paused;
          this.markedForDeletion = markedForDeletion;
        }
      };
      /**
       * @en The update entry list.
       * @zh 更新条目列表。
       * @class HashUpdateEntry
       * @param list @en Which list does it belong to. @zh 所属的列表。
       * @param entry @en Entry in the list. @zh 所述的条目。
       * @param target @en Hash key (retained). @zh 哈希键所对应的目标(被持有的)。
       * @param callback @en The callback function. @zh 所回调的函数。
       * @mangle
       */
      ListEntry._listEntries = [];
      HashUpdateEntry = class HashUpdateEntry {
        static get(list, entry, target, callback) {
          let result = HashUpdateEntry._hashUpdateEntries.pop();
          if (result) {
            result.list = list;
            result.entry = entry;
            result.target = target;
            result.callback = callback;
          } else {
            result = new HashUpdateEntry(list, entry, target, callback);
          }
          return result;
        }
        static put(entry) {
          if (HashUpdateEntry._hashUpdateEntries.length < MAX_POOL_SIZE) {
            entry.list = entry.entry = entry.target = entry.callback = null;
            HashUpdateEntry._hashUpdateEntries.push(entry);
          }
        }
        constructor(list, entry, target, callback) {
          this.list = void 0;
          this.entry = void 0;
          this.target = void 0;
          this.callback = void 0;
          this.list = list;
          this.entry = entry;
          this.target = target;
          this.callback = callback;
        }
      };
      /**
       * @en Hash Element used for "selectors with interval".
       * @zh “用于间隔选择”的哈希元素。
       * @param timers
       * @param target  hash key (retained)
       * @param timerIndex
       * @param currentTimer
       * @param currentTimerSalvaged
       * @param paused
       * @mangle
       */
      HashUpdateEntry._hashUpdateEntries = [];
      HashTimerEntry = class HashTimerEntry {
        static get(timers, target, timerIndex, currentTimer, currentTimerSalvaged, paused) {
          let result = HashTimerEntry._hashTimerEntries.pop();
          if (result) {
            result.timers = timers;
            result.target = target;
            result.timerIndex = timerIndex;
            result.currentTimer = currentTimer;
            result.currentTimerSalvaged = currentTimerSalvaged;
            result.paused = paused;
          } else {
            result = new HashTimerEntry(timers, target, timerIndex, currentTimer, currentTimerSalvaged, paused);
          }
          return result;
        }
        static put(entry) {
          if (HashTimerEntry._hashTimerEntries.length < MAX_POOL_SIZE) {
            entry.timers = entry.target = entry.currentTimer = null;
            HashTimerEntry._hashTimerEntries.push(entry);
          }
        }
        constructor(timers, target, timerIndex, currentTimer, currentTimerSalvaged, paused) {
          this.timers = void 0;
          this.target = void 0;
          this.timerIndex = void 0;
          this.currentTimer = void 0;
          this.currentTimerSalvaged = void 0;
          this.paused = void 0;
          this.timers = timers;
          this.target = target;
          this.timerIndex = timerIndex;
          this.currentTimer = currentTimer;
          this.currentTimerSalvaged = currentTimerSalvaged;
          this.paused = paused;
        }
      };
      HashTimerEntry._hashTimerEntries = [];
      /**
       * Light weight timer
       * @mangle
       */
      CallbackTimer = class CallbackTimer {
        static get() {
          return CallbackTimer._timers.pop() || new CallbackTimer();
        }
        static put(timer) {
          if (CallbackTimer._timers.length < MAX_POOL_SIZE && !timer._lock) {
            timer._scheduler = timer._target = timer._callback = null;
            CallbackTimer._timers.push(timer);
          }
        }
        constructor() {
          this._lock = void 0;
          this._scheduler = void 0;
          this._elapsed = void 0;
          this._runForever = void 0;
          this._useDelay = void 0;
          this._timesExecuted = void 0;
          this._repeat = void 0;
          this._delay = void 0;
          this._interval = void 0;
          this._target = void 0;
          this._callback = void 0;
          this._lock = false;
          this._scheduler = null;
          this._elapsed = -1;
          this._runForever = false;
          this._useDelay = false;
          this._timesExecuted = 0;
          this._repeat = 0;
          this._delay = 0;
          this._interval = 0;
          this._target = null;
        }
        initWithCallback(scheduler, callback, target, seconds, repeat, delay) {
          this._lock = false;
          this._scheduler = scheduler;
          this._target = target;
          this._callback = callback;
          this._timesExecuted = 0;
          this._elapsed = -1;
          this._interval = seconds;
          this._delay = delay;
          this._useDelay = this._delay > 0;
          this._repeat = repeat;
          this._runForever = this._repeat === legacyCC.macro.REPEAT_FOREVER;
          return true;
        }
        /**
         * @en get interval for timer in seconds.
         * @zh 获取计时器的时间间隔, 以秒为单位。
         * @returns
         * @en returns interval of timer in seconds.
         * @zh 返回计时器的时间间隔, 以秒为单位。
         */
        getInterval() {
          return this._interval;
        }
        /**
         * @en Set interval in seconds.
         * @zh 以秒为单位设置时间间隔。
         */
        setInterval(interval) {
          this._interval = interval;
        }

        /**
         * @en Update function which triggers the timer.
         * @zh 计时更新函数，用来触发计时器。
         * @param dt
         * @en delta time. The unit is seconds.
         * @zh 更新间隔时间, 单位是秒。
         */
        update(dt) {
          if (this._elapsed === -1) {
            this._elapsed = 0;
            this._timesExecuted = 0;
          } else {
            this._elapsed += dt;
            if (this._runForever && !this._useDelay) {
              // standard timer usage
              if (this._elapsed >= this._interval) {
                this.trigger();
                this._elapsed = 0;
              }
            } else {
              // advanced usage
              if (this._useDelay) {
                if (this._elapsed >= this._delay) {
                  this.trigger();
                  this._elapsed -= this._delay;
                  this._timesExecuted += 1;
                  this._useDelay = false;
                }
              } else if (this._elapsed >= this._interval) {
                this.trigger();
                this._elapsed = 0;
                this._timesExecuted += 1;
              }
              if (this._callback && !this._runForever && this._timesExecuted > this._repeat) {
                this.cancel();
              }
            }
          }
        }
        getCallback() {
          return this._callback;
        }
        trigger() {
          if (this._target && this._callback) {
            this._lock = true;
            this._callback.call(this._target, this._elapsed);
            this._lock = false;
          }
        }
        cancel() {
          if (this._scheduler && this._callback && this._target) {
            this._scheduler.unscheduleForTimer(this, this._target);
          }
        }
      };
      /**
       * @en
       * Scheduler is responsible of triggering the scheduled callbacks.<br>
       * You should not use NSTimer. Instead use this class.<br>
       * <br>
       * There are 2 different types of callbacks (selectors):<br>
       *     - update callback: the 'update' callback will be called every frame. You can customize the priority.<br>
       *     - custom callback: A custom callback will be called every frame, or with a custom interval of time.<br>
       * <br>
       * The 'custom selectors' should be avoided when possible. It is faster,<br>
       * and consumes less memory to use the 'update callback'. *
       * @zh
       * Scheduler 是负责触发回调函数的类。<br>
       * 通常情况下，建议使用 `director.getScheduler()` 来获取系统定时器。<br>
       * 有两种不同类型的定时器：<br>
       *     - update 定时器：每一帧都会触发。您可以自定义优先级。<br>
       *     - 自定义定时器：自定义定时器可以每一帧或者自定义的时间间隔触发。<br>
       * 如果希望每帧都触发，应该使用 update 定时器，使用 update 定时器更快，而且消耗更少的内存。
       */
      CallbackTimer._timers = [];
      _export("Scheduler", Scheduler = class Scheduler extends System {
        /**
         * @en This method should be called for any target which needs to schedule tasks, and this method should be called before any scheduler API usage.
         * This method will add a `id` property if it doesn't exist.
         * @zh 任何需要用 Scheduler 管理任务的对象主体都应该调用这个方法，并且应该在调用任何 Scheduler API 之前调用这个方法。
         * 这个方法会给对象添加一个 `id` 属性，如果这个属性不存在的话。
         * @param target
         * @en The target to enable, which type is ISchedulable.
         * @zh 所作用的对象。类型为ISchedulable。
         */
        static enableForTarget(target) {
          let found = false;
          if (target.uuid) {
            found = true;
          } else if (target.id) {
            found = true;
          }
          if (!found) {
            target.id = idGenerator.getNewId();
          }
        }
        constructor() {
          super();
          this._timeScale = void 0;
          this._updatesNegList = void 0;
          this._updates0List = void 0;
          this._updatesPosList = void 0;
          this._hashForUpdates = void 0;
          this._hashForTimers = void 0;
          this._currentTarget = void 0;
          this._currentTargetSalvaged = void 0;
          this._updateHashLocked = void 0;
          this._arrayForTimers = void 0;
          this._timeScale = 1.0;
          this._updatesNegList = []; // list of priority < 0
          this._updates0List = []; // list of priority == 0
          this._updatesPosList = []; // list of priority > 0
          this._hashForUpdates = createMap(true); // hash used to fetch quickly the list entries for pause, delete, etc
          this._hashForTimers = createMap(true); // Used for "selectors with interval"
          this._currentTarget = null;
          this._currentTargetSalvaged = false;
          this._updateHashLocked = false; // If true unschedule will not remove anything from a hash. Elements will only be marked for deletion.

          this._arrayForTimers = []; // Speed up indexing
          // this._arrayForUpdates = [];   // Speed up indexing
        }

        // -----------------------public method-------------------------

        /**
         * @en
         * Modifies the time of all scheduled callbacks.<br>
         * You can use this property to create a 'slow motion' or 'fast forward' effect.<br>
         * Default is 1.0. To create a 'slow motion' effect, use values below 1.0.<br>
         * To create a 'fast forward' effect, use values higher than 1.0.<br>
         * Note：It will affect EVERY scheduled selector / action.
         * @zh
         * 设置时间间隔的缩放比例。<br>
         * 您可以使用这个方法来创建一个 “slow motion（慢动作）” 或 “fast forward（快进）” 的效果。<br>
         * 默认是 1.0。要创建一个 “slow motion（慢动作）” 效果,使用值低于 1.0。<br>
         * 要使用 “fast forward（快进）” 效果，使用值大于 1.0。<br>
         * 注意：它影响该 Scheduler 下管理的所有定时器。
         * @param timeScale
         */
        setTimeScale(timeScale) {
          this._timeScale = timeScale;
        }

        /**
         * @en Returns time scale of scheduler.
         * @zh 获取时间间隔的缩放比例。
         */
        getTimeScale() {
          return this._timeScale;
        }

        /**
         * @en 'update' the scheduler. (You should NEVER call this method, unless you know what you are doing.)
         * @zh update 调度函数。(不应该直接调用这个方法，除非完全了解这么做的结果)
         * @param dt
         * @en delta time. The unit is seconds.
         * @zh 更新间隔时间, 单位是秒。
         */
        update(dt) {
          this._updateHashLocked = true;
          if (this._timeScale !== 1) {
            dt *= this._timeScale;
          }
          let i;
          let list;
          let len;
          let entry;
          for (i = 0, list = this._updatesNegList, len = list.length; i < len; i++) {
            entry = list[i];
            if (!entry.paused && !entry.markedForDeletion && entry.target) {
              entry.target.update == null || entry.target.update(dt);
            }
          }
          for (i = 0, list = this._updates0List, len = list.length; i < len; i++) {
            entry = list[i];
            if (!entry.paused && !entry.markedForDeletion && entry.target) {
              entry.target.update == null || entry.target.update(dt);
            }
          }
          for (i = 0, list = this._updatesPosList, len = list.length; i < len; i++) {
            entry = list[i];
            if (!entry.paused && !entry.markedForDeletion && entry.target) {
              entry.target.update == null || entry.target.update(dt);
            }
          }

          // Iterate over all the custom selectors
          let elt;
          const arr = this._arrayForTimers;
          for (i = 0; i < arr.length; i++) {
            var _this$_currentTarget$;
            elt = arr[i];
            this._currentTarget = elt;
            this._currentTargetSalvaged = false;
            if (!elt.paused && elt.timers) {
              // The 'timers' array may change while inside this loop
              for (elt.timerIndex = 0; elt.timerIndex < elt.timers.length; ++elt.timerIndex) {
                elt.currentTimer = elt.timers[elt.timerIndex];
                elt.currentTimerSalvaged = false;
                elt.currentTimer.update(dt);
                elt.currentTimer = null;
              }
            }

            // only delete currentTarget if no actions were scheduled during the cycle (issue #481)
            if (this._currentTargetSalvaged && ((_this$_currentTarget$ = this._currentTarget.timers) == null ? void 0 : _this$_currentTarget$.length) === 0) {
              this._removeHashElement(this._currentTarget);
              --i;
            }
          }

          // delete all updates that are marked for deletion
          // updates with priority < 0
          for (i = 0, list = this._updatesNegList; i < list.length;) {
            entry = list[i];
            if (entry.markedForDeletion) {
              this._removeUpdateFromHash(entry);
            } else {
              i++;
            }
          }
          for (i = 0, list = this._updates0List; i < list.length;) {
            entry = list[i];
            if (entry.markedForDeletion) {
              this._removeUpdateFromHash(entry);
            } else {
              i++;
            }
          }
          for (i = 0, list = this._updatesPosList; i < list.length;) {
            entry = list[i];
            if (entry.markedForDeletion) {
              this._removeUpdateFromHash(entry);
            } else {
              i++;
            }
          }
          this._updateHashLocked = false;
          this._currentTarget = null;
        }

        /**
         * @en Specify the callback to schedule a new timer.
         * If the callback function is already scheduled, then only the interval parameter will be updated without re-scheduling it again.
         * @zh 指定回调函数来规划一个新的定时器。
         * 如果回调函数已经被定时器使用，那么只会更新之前定时器的时间间隔参数，不会设置新的定时器。
         * @param callback
         * @en The specified target.
         * @zh 所指定的调用对象。
         * @param target
         * @en The scheduled method will be called every 'interval' seconds.
         * If 'interval' is 0, it will be called every frame, but if so, it recommended to use 'scheduleUpdateForTarget:' instead.
         * @zh 当时间间隔达到指定值时，设置的回调函数将会被调用。
         * 如果 interval 值为 0，那么回调函数每一帧都会被调用，但如果是这样，建议使用 scheduleUpdateForTarget 代替。
         * @param interval
         * @en repeat let the action be repeated repeat + 1 times, use `macro.REPEAT_FOREVER` to let the action run continuously.
         * @zh repeat 值可以让定时器触发 repeat + 1 次，使用 `macro.REPEAT_FOREVER` 可以让定时器一直循环触发。
         * @param repeat
         * @en delay is the amount of time the action will wait before it'll start. Unit: s.
         * @zh delay 值指定延迟时间，定时器会在延迟指定的时间之后开始计时，单位: 秒。
         * @param delay
         * @en If paused is YES, then it won't be called until it is resumed.
         * @zh 如果 paused 值为 true，那么直到 resume 被调用才开始计时。
         * @param paused
         */

        /**
         * @en The specified target.
         * @zh 所指定的调用对象。
         * @param target
         * @en Specify the callback to schedule a new timer.
         * If the callback function is already scheduled, then only the interval parameter will be updated without re-scheduling it again.
         * @zh 指定回调函数来规划一个新的定时器。
         * 如果回调函数已经被定时器使用，那么只会更新之前定时器的时间间隔参数，不会设置新的定时器。
         * @param callback
         * @en The scheduled method will be called every 'interval' seconds.
         * If 'interval' is 0, it will be called every frame, but if so, it recommended to use 'scheduleUpdateForTarget:' instead.
         * @zh 当时间间隔达到指定值时，设置的回调函数将会被调用。
         * 如果 interval 值为 0，那么回调函数每一帧都会被调用，但如果是这样，建议使用 scheduleUpdateForTarget 代替。
         * @param interval
         * @en repeat let the action be repeated repeat + 1 times, use `macro.REPEAT_FOREVER` to let the action run continuously.
         * @zh repeat 值可以让定时器触发 repeat + 1 次，使用 `macro.REPEAT_FOREVER` 可以让定时器一直循环触发。
         * @param repeat
         * @en delay is the amount of time the action will wait before it'll start. Unit: s.
         * @zh delay 值指定延迟时间，定时器会在延迟指定的时间之后开始计时，单位: 秒。
         * @param delay
         * @en If paused is YES, then it won't be called until it is resumed.
         * @zh 如果 paused 值为 true，那么直到 resume 被调用才开始计时。
         * @param paused
         *
         * @deprecated since v3.8.0, please use `Scheduler.schedule(callback, target, interval)` instead.
         */

        schedule(callbackTmp, targetTmp, interval, repeat, delay, paused) {
          let callback;
          let target;
          if (typeof callbackTmp !== 'function') {
            warnID(1514);
            callback = targetTmp;
            target = callbackTmp;
          } else {
            callback = callbackTmp;
            target = targetTmp;
          }
          // selector, target, interval, repeat, delay, paused
          // selector, target, interval, paused
          if (arguments.length === 3 || arguments.length === 4 || arguments.length === 5) {
            paused = !!repeat;
            repeat = legacyCC.macro.REPEAT_FOREVER;
            delay = 0;
          }
          assertID(Boolean(target), 1502);
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }
          let element = this._hashForTimers[targetId];
          if (!element) {
            // Is this the 1st element ? Then set the pause level to all the callback_fns of this target
            element = HashTimerEntry.get(null, target, 0, null, false, Boolean(paused));
            this._arrayForTimers.push(element);
            this._hashForTimers[targetId] = element;
          } else if (element.paused !== paused) {
            warnID(1511);
          }
          let timer;
          let i;
          if (element.timers == null) {
            element.timers = [];
          } else {
            for (i = 0; i < element.timers.length; ++i) {
              timer = element.timers[i];
              if (timer && callback === timer.getCallback()) {
                logID(1507, timer.getInterval(), interval);
                timer.setInterval(interval);
                return;
              }
            }
          }
          timer = CallbackTimer.get();
          timer.initWithCallback(this, callback, target, interval, repeat != null ? repeat : 0, delay != null ? delay : 0);
          element.timers.push(timer);
          if (this._currentTarget === element && this._currentTargetSalvaged) {
            this._currentTargetSalvaged = false;
          }
        }

        /**
         * @en
         * Schedules the update callback for a given target,
         * During every frame after schedule started, the "update" function of target will be invoked.
         * @zh
         * 使用指定的优先级为指定的对象设置 update 定时器。<br>
         * update 定时器每一帧都会被触发，触发时自动调用指定对象的 "update" 函数。<br>
         * 优先级的值越低，定时器被触发的越早。
         * @param target
         * @en The target bound to the callback. @zh 回调所绑定的目标对象。
         * @param priority
         * @en The priority. @zh 优先级。
         * @param paused
         * @en Whether is paused. @zh 是否被暂停。
         */
        scheduleUpdate(target, priority, paused) {
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }
          const hashElement = this._hashForUpdates[targetId];
          if (hashElement && hashElement.entry) {
            // check if priority has changed
            if (hashElement.entry.priority !== priority) {
              if (this._updateHashLocked) {
                logID(1506);
                hashElement.entry.markedForDeletion = false;
                hashElement.entry.paused = paused;
                return;
              } else {
                // will be added again outside if (hashElement).
                this.unscheduleUpdate(target);
              }
            } else {
              hashElement.entry.markedForDeletion = false;
              hashElement.entry.paused = paused;
              return;
            }
          }
          const listElement = ListEntry.get(target, priority, paused, false);
          let ppList;

          // most of the updates are going to be 0, that's way there
          // is an special list for updates with priority 0
          if (priority === 0) {
            ppList = this._updates0List;
            this._appendIn(ppList, listElement);
          } else {
            ppList = priority < 0 ? this._updatesNegList : this._updatesPosList;
            this._priorityIn(ppList, listElement, priority);
          }

          // update hash entry for quick access
          this._hashForUpdates[targetId] = HashUpdateEntry.get(ppList, listElement, target, null);
        }

        /**
         * @en
         * Unschedule a callback for a callback and a given target.
         * If you want to unschedule the "update", use `unscheduleUpdate()`
         * @zh
         * 取消指定对象定时器。
         * 如果需要取消 update 定时器，请使用 unscheduleUpdate()。
         * @param callback @en The callback to be unscheduled @zh 被取消调度的回调。
         * @param target @en The target bound to the callback. @zh 回调所绑定的目标对象。
         */
        unschedule(callback, target) {
          // callback, target

          // explicity handle nil arguments when removing an object
          if (!target || !callback) {
            return;
          }
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }
          const element = this._hashForTimers[targetId];
          if (element) {
            const timers = element.timers;
            if (!timers) {
              return;
            }
            for (let i = 0, li = timers.length; i < li; i++) {
              const timer = timers[i];
              if (callback === timer.getCallback()) {
                if (timer === element.currentTimer && !element.currentTimerSalvaged) {
                  element.currentTimerSalvaged = true;
                }
                timers.splice(i, 1);
                CallbackTimer.put(timer);
                // update timerIndex in case we are in tick;, looping over the actions
                if (element.timerIndex >= i) {
                  element.timerIndex--;
                }
                if (timers.length === 0) {
                  if (this._currentTarget === element) {
                    this._currentTargetSalvaged = true;
                  } else {
                    this._removeHashElement(element);
                  }
                }
                return;
              }
            }
          }
        }

        /**
         * @en Unschedule a timer. It is invoked by CallbackTimer when a timer is finished.
         * @param timerToUnschedule The timer to be unscheduled.
         * @param target The target of the timer.
         * @engineInternal
         * @mangle
         */
        unscheduleForTimer(timerToUnschedule, target) {
          const targetId = target.uuid || target.id;
          const element = this._hashForTimers[targetId];
          const timers = element.timers;
          if (!timers || timers.length === 0) {
            return;
          }
          for (let i = timers.length - 1; i >= 0; i--) {
            const timer = timers[i];
            if (timer === timerToUnschedule) {
              timers.splice(i, 1);
              CallbackTimer.put(timer);

              // update timerIndex in case we are in tick;, looping over the actions
              if (element.timerIndex >= i) {
                element.timerIndex--;
              }
              if (timers.length === 0) {
                this._currentTargetSalvaged = true;
              }
              return;
            }
          }
        }

        /**
         * @en Unschedule the update callback for a given target.
         * @zh 取消指定对象的 update 定时器。
         * @param target The target to be unscheduled.
         */
        unscheduleUpdate(target) {
          if (!target) {
            return;
          }
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }
          const element = this._hashForUpdates[targetId];
          if (element != null && element.entry) {
            if (this._updateHashLocked) {
              element.entry.markedForDeletion = true;
            } else {
              this._removeUpdateFromHash(element.entry);
            }
          }
        }

        /**
         * @en
         * Unschedule all scheduled callbacks for a given target.
         * This also includes the "update" callback.
         * @zh 取消指定对象的所有定时器，包括 update 定时器。
         * @param target The target to be unscheduled.
         */
        unscheduleAllForTarget(target) {
          // explicit nullptr handling
          if (!target) {
            return;
          }
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }

          // Custom Selectors
          const element = this._hashForTimers[targetId];
          if (element != null && element.timers) {
            const timers = element.timers;
            if (element.currentTimer && timers.indexOf(element.currentTimer) > -1 && !element.currentTimerSalvaged) {
              element.currentTimerSalvaged = true;
            }
            for (let i = 0, l = timers.length; i < l; i++) {
              CallbackTimer.put(timers[i]);
            }
            timers.length = 0;
            if (this._currentTarget === element) {
              this._currentTargetSalvaged = true;
            } else {
              this._removeHashElement(element);
            }
          }

          // update selector
          this.unscheduleUpdate(target);
        }

        /**
         * @en
         * Unschedule all scheduled callbacks from all targets including the system callbacks.
         * You should NEVER call this method, unless you know what you are doing.
         * @zh
         * 取消所有对象的所有定时器，包括系统定时器。
         * 不要调用此函数，除非你确定你在做什么。
         */
        unscheduleAll() {
          this.unscheduleAllWithMinPriority(SystemPriority.SCHEDULER);
        }

        /**
         * @en
         * Unschedule all callbacks from all targets with a minimum priority.
         * You should only call this with `PRIORITY_NON_SYSTEM_MIN` or higher.
         * @zh
         * 取消所有优先级的值大于指定优先级的定时器。
         * 你应该只取消优先级的值大于 PRIORITY_NON_SYSTEM_MIN 的定时器。
         * @param minPriority
         * @en The minimum priority of selector to be unscheduled.
         * Which means, all selectors which priority is higher than minPriority will be unscheduled.
         * @zh 要取消调度的选择器的最低优先级。
         * 这意味着，所有优先级高于 minPriority 的选择器将被取消调度。
         */
        unscheduleAllWithMinPriority(minPriority) {
          // Custom Selectors
          let i;
          let element;
          const arr = this._arrayForTimers;
          for (i = arr.length - 1; i >= 0; i--) {
            element = arr[i];
            if (element.target) {
              this.unscheduleAllForTarget(element.target);
            }
          }

          // Updates selectors
          let entry;
          let temp_length = 0;
          if (minPriority < 0) {
            for (i = 0; i < this._updatesNegList.length;) {
              var _entry;
              temp_length = this._updatesNegList.length;
              entry = this._updatesNegList[i];
              if ((_entry = entry) != null && _entry.target && entry.priority >= minPriority) {
                this.unscheduleUpdate(entry.target);
              }
              if (temp_length === this._updatesNegList.length) {
                i++;
              }
            }
          }
          if (minPriority <= 0) {
            for (i = 0; i < this._updates0List.length;) {
              var _entry2;
              temp_length = this._updates0List.length;
              entry = this._updates0List[i];
              if ((_entry2 = entry) != null && _entry2.target) {
                this.unscheduleUpdate(entry.target);
              }
              if (temp_length === this._updates0List.length) {
                i++;
              }
            }
          }
          for (i = 0; i < this._updatesPosList.length;) {
            var _entry3;
            temp_length = this._updatesPosList.length;
            entry = this._updatesPosList[i];
            if ((_entry3 = entry) != null && _entry3.target && entry.priority >= minPriority) {
              this.unscheduleUpdate(entry.target);
            }
            if (temp_length === this._updatesPosList.length) {
              i++;
            }
          }
        }

        /**
         * @en Checks whether a callback for a given target is scheduled.
         * @zh 检查指定的回调函数和回调对象组合是否存在定时器。
         * @param callback @en The callback to check. @zh 指定检测的回调。
         * @param target @en The target of the callback. @zh 回调的目标对象。
         * @returns @en True if the specified callback is invoked, false if not. @zh 返回true如果指定回调被调用, 否则返回false。
         */
        isScheduled(callback, target) {
          // key, target
          // selector, target
          assertID(Boolean(callback), 1508);
          assertID(Boolean(target), 1509);
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return false;
          }
          const element = this._hashForTimers[targetId];
          if (!element) {
            return false;
          }
          if (element.timers == null) {
            return false;
          } else {
            const timers = element.timers;
            for (let i = 0; i < timers.length; ++i) {
              const timer = timers[i];
              if (callback === timer.getCallback()) {
                return true;
              }
            }
            return false;
          }
        }

        /**
         * @en
         * Pause all selectors from all targets.
         * You should NEVER call this method, unless you know what you are doing.
         * @zh
         * 暂停所有对象的所有定时器。
         * 不要调用这个方法，除非你知道你正在做什么。
         */
        pauseAllTargets() {
          return this.pauseAllTargetsWithMinPriority(SystemPriority.SCHEDULER);
        }

        /**
         * @en
         * Pause all selectors from all targets with a minimum priority.
         * You should only call this with kCCPriorityNonSystemMin or higher.
         * @zh
         * 暂停所有优先级的值大于指定优先级的定时器。
         * 你应该只暂停优先级的值大于 PRIORITY_NON_SYSTEM_MIN 的定时器。
         * @param minPriority @en the minimum priority. @zn 最小优先级。
         */
        pauseAllTargetsWithMinPriority(minPriority) {
          const idsWithSelectors = [];
          let element;
          const locArrayForTimers = this._arrayForTimers;
          let i;
          let li;
          // Custom Selectors
          for (i = 0, li = locArrayForTimers.length; i < li; i++) {
            var _element;
            element = locArrayForTimers[i];
            if ((_element = element) != null && _element.target) {
              element.paused = true;
              idsWithSelectors.push(element.target);
            }
          }
          let entry;
          if (minPriority < 0) {
            for (i = 0; i < this._updatesNegList.length; i++) {
              var _entry4;
              entry = this._updatesNegList[i];
              if ((_entry4 = entry) != null && _entry4.target) {
                if (entry.priority >= minPriority) {
                  entry.paused = true;
                  idsWithSelectors.push(entry.target);
                }
              }
            }
          }
          if (minPriority <= 0) {
            for (i = 0; i < this._updates0List.length; i++) {
              var _entry5;
              entry = this._updates0List[i];
              if ((_entry5 = entry) != null && _entry5.target) {
                entry.paused = true;
                idsWithSelectors.push(entry.target);
              }
            }
          }
          for (i = 0; i < this._updatesPosList.length; i++) {
            var _entry6;
            entry = this._updatesPosList[i];
            if ((_entry6 = entry) != null && _entry6.target) {
              if (entry.priority >= minPriority) {
                entry.paused = true;
                idsWithSelectors.push(entry.target);
              }
            }
          }
          return idsWithSelectors;
        }

        /**
         * @en
         * Resume selectors on a set of targets.<br/>
         * This can be useful for undoing a call to pauseAllCallbacks.
         * @zh
         * 恢复指定数组中所有对象的定时器。<br/>
         * 这个函数是 pauseAllCallbacks 的逆操作。
         * @param targetsToResume
         */
        resumeTargets(targetsToResume) {
          if (!targetsToResume) {
            return;
          }
          for (let i = 0; i < targetsToResume.length; i++) {
            this.resumeTarget(targetsToResume[i]);
          }
        }

        /**
         * @en
         * Pauses the target.<br/>
         * All scheduled selectors/update for a given target won't be 'ticked' until the target is resumed.<br/>
         * If the target is not present, nothing happens.
         * @zh
         * 暂停指定对象的定时器。<br/>
         * 指定对象的所有定时器都会被暂停。<br/>
         * 如果指定的对象没有定时器，什么也不会发生。
         * @param target
         */
        pauseTarget(target) {
          assertID(Boolean(target), 1503);
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }

          // customer selectors
          const element = this._hashForTimers[targetId];
          if (element) {
            element.paused = true;
          }

          // update callback
          const elementUpdate = this._hashForUpdates[targetId];
          if (elementUpdate != null && elementUpdate.entry) {
            elementUpdate.entry.paused = true;
          }
        }

        /**
         * @en
         * Resumes the target.<br/>
         * The 'target' will be unpaused, so all schedule selectors/update will be 'ticked' again.<br/>
         * If the target is not present, nothing happens.
         * @zh
         * 恢复指定对象的所有定时器。<br/>
         * 指定对象的所有定时器将继续工作。<br/>
         * 如果指定的对象没有定时器，什么也不会发生。
         * @param target
         */
        resumeTarget(target) {
          assertID(Boolean(target), 1504);
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return;
          }

          // custom selectors
          const element = this._hashForTimers[targetId];
          if (element) {
            element.paused = false;
          }

          // update callback
          const elementUpdate = this._hashForUpdates[targetId];
          if (elementUpdate != null && elementUpdate.entry) {
            elementUpdate.entry.paused = false;
          }
        }

        /**
         * @en Returns whether or not the target is paused.
         * @zh 返回指定对象的定时器是否处于暂停状态。
         * @param target
         */
        isTargetPaused(target) {
          assertID(Boolean(target), 1505);
          const targetId = target.uuid || target.id;
          if (!targetId) {
            errorID(1510);
            return false;
          }

          // Custom selectors
          const element = this._hashForTimers[targetId];
          if (element) {
            return element.paused;
          }
          const elementUpdate = this._hashForUpdates[targetId];
          if (elementUpdate != null && elementUpdate.entry) {
            return elementUpdate.entry.paused;
          }
          return false;
        }

        // -----------------------private method----------------------
        _removeHashElement(element) {
          if (!element.target) {
            return;
          }
          const targetId = element.target.uuid || element.target.id;
          if (typeof targetId === 'undefined') {
            return;
          }
          delete this._hashForTimers[targetId];
          const arr = this._arrayForTimers;
          for (let i = 0, l = arr.length; i < l; i++) {
            if (arr[i] === element) {
              arr.splice(i, 1);
              break;
            }
          }
          HashTimerEntry.put(element);
        }
        _removeUpdateFromHash(entry) {
          if (!entry.target) {
            return;
          }
          const targetId = entry.target.uuid || entry.target.id;
          if (typeof targetId === 'undefined') {
            return;
          }
          const element = this._hashForUpdates[targetId];
          if (element) {
            // Remove list entry from list
            const list = element.list;
            const listEntry = element.entry;
            if (list) {
              for (let i = 0, l = list.length; i < l; i++) {
                if (list[i] === listEntry) {
                  list.splice(i, 1);
                  break;
                }
              }
            }
            delete this._hashForUpdates[targetId];
            if (listEntry) {
              ListEntry.put(listEntry);
            }
            HashUpdateEntry.put(element);
          }
        }
        _priorityIn(ppList, listElement, priority) {
          for (let i = 0; i < ppList.length; i++) {
            if (priority < ppList[i].priority) {
              ppList.splice(i, 0, listElement);
              return;
            }
          }
          ppList.push(listElement);
        }
        _appendIn(ppList, listElement) {
          ppList.push(listElement);
        }
      });
      Scheduler.ID = 'scheduler';
      legacyCC.Scheduler = Scheduler;
    }
  };
});