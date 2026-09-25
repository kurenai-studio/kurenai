System.register("q-bundled:///fs/cocos/animation/animation-component.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../scene-graph/component.js", "../core/index.js", "./animation-clip.js", "./animation-state.js", "./cross-fade.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, executionOrder, help, menu, type, serializable, editable, EDITOR_NOT_IN_PREVIEW, TEST, Component, Eventify, warnID, js, cclegacy, AnimationClip, AnimationState, AnimationStateEventType, CrossFade, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _Animation, Animation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function equalClips(clip1, clip2) {
    if (clip1 === clip2) {
      return true;
    }
    return !!clip1 && !!clip2 && clip1._uuid === clip2._uuid && clip1._uuid;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      Eventify = _coreIndexJs.Eventify;
      warnID = _coreIndexJs.warnID;
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_animationClipJs) {
      AnimationClip = _animationClipJs.AnimationClip;
    }, function (_animationStateJs) {
      AnimationState = _animationStateJs.AnimationState;
      AnimationStateEventType = _animationStateJs.AnimationStateEventType;
    }, function (_crossFadeJs) {
      CrossFade = _crossFadeJs.CrossFade;
    }],
    execute: function () {
      /*
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
      /**
       * @en
       * Animation component governs a group of animation states to control playback of the states.
       * For convenient, it stores a group of animation clips.
       * Each of those clips would have an associated animation state uniquely created.
       * Animation component is eventful, it dispatch a serials playback status events.
       * See [[EventType]].
       * @zh
       * 动画组件管理一组动画状态，控制它们的播放。
       * 为了方便，动画组件还存储了一组动画剪辑。
       * 每个剪辑都会独自创建一个关联的动画状态对象。
       * 动画组件具有事件特性，它会派发一系列播放状态相关的事件。
       * 参考 [[EventType]]
       */
      _export("AnimationComponent", _export("Animation", Animation = (_dec = ccclass('cc.Animation'), _dec2 = help('i18n:cc.Animation'), _dec3 = executionOrder(99), _dec4 = menu('Animation/Animation'), _dec5 = type([AnimationClip]), _dec6 = type(AnimationClip), _dec7 = type([AnimationClip]), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = _dec4(_class = (_class2 = (_Animation = class Animation extends Eventify(Component) {
        constructor(...args) {
          super(...args);
          /**
           * @en
           * Whether the default clip should get into playing when this components starts.
           * Note, this field takes no effect if `crossFade()` or `play()` has been called before this component starts.
           * @zh
           * 是否在组件开始运行时自动播放默认剪辑。
           * 注意，若在组件开始运行前调用了 `crossFade` 或 `play()`，此字段将不会生效。
           */
          _initializerDefineProperty(this, "playOnLoad", _descriptor, this);
          /**
           * @internal
           */
          this._crossFade = new CrossFade();
          /**
           * @internal
           */
          this._nameToState = js.createMap(true);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_clips", _descriptor2, this);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_defaultClip", _descriptor3, this);
          /**
           * Whether if `crossFade()` or `play()` has been called before this component starts.
           */
          this._hasBeenPlayed = false;
        }
        /**
         * @en
         * Gets or sets clips this component governs.
         * When set, associated animation state of each existing clip will be stopped.
         * If the existing default clip is not in the set of new clips, default clip will be reset to null.
         * @zh
         * 获取或设置此组件管理的剪辑。
         * 设置时，已有剪辑关联的动画状态将被停止；若默认剪辑不在新的动画剪辑中，将被重置为空。
         */
        get clips() {
          return this._clips;
        }
        set clips(value) {
          if (this._crossFade) {
            this._crossFade.clear();
          }
          // Remove state for old automatic clips.
          this._clips.forEach(clip => {
            if (clip) {
              this._removeStateOfAutomaticClip(clip);
            }
          });
          // Create state for new clips.
          value.forEach(clip => {
            if (clip) {
              this.createState(clip);
            }
          });
          // Default clip should be in the list of automatic clips.
          const newDefaultClip = value.find(clip => equalClips(clip, this._defaultClip));
          if (newDefaultClip) {
            this._defaultClip = newDefaultClip;
          } else {
            this._defaultClip = null;
          }
          this._clips = value;
        }

        /**
         * @en
         * Gets or sets the default clip.
         * Two clips that both have same non-empty UUID are treat as equivalent.
         * @zh
         * 获取或设置默认剪辑。
         * 设置时，若指定的剪辑不在 `this.clips` 中则会被自动添加至 `this.clips`。
         * 具有相同的非空 UUID 的两个动画剪辑将被视为是相同的。
         * @see [[playOnLoad]]
         */
        get defaultClip() {
          return this._defaultClip;
        }
        set defaultClip(value) {
          this._defaultClip = value;
          if (!value) {
            return;
          }
          const isBoundedDefaultClip = this._clips.findIndex(clip => equalClips(clip, value)) >= 0;
          if (!isBoundedDefaultClip) {
            this._clips.push(value);
            this.createState(value);
          }
        }
        onLoad() {
          this.clips = this._clips;
          for (const stateName in this._nameToState) {
            const state = this._nameToState[stateName];
            state.initialize(this.node);
          }
        }
        start() {
          if (!EDITOR_NOT_IN_PREVIEW && this.playOnLoad && !this._hasBeenPlayed && this._defaultClip) {
            this.crossFade(this._defaultClip.name, 0);
          }
        }
        onEnable() {
          this._crossFade.resume();
        }
        onDisable() {
          this._crossFade.pause();
        }
        onDestroy() {
          this._crossFade.stop();
          for (const name in this._nameToState) {
            const state = this._nameToState[name];
            state.destroy();
          }
          this._nameToState = js.createMap(true);
        }

        /**
         * @en
         * Switch to play specified animation state, without fading.
         * @zh
         * 立即切换到指定动画状态。
         * @param name The name of the animation to be played, if absent, the default clip will be played
         */
        play(name) {
          this._hasBeenPlayed = true;
          if (!name) {
            if (!this._defaultClip) {
              return;
            }
            name = this._defaultClip.name;
          }
          this.crossFade(name, 0);
        }

        /**
         * @en
         * Smoothly switch to play specified animation state.
         * @zh
         * 平滑地切换到指定动画状态。
         * @param name The name of the animation to switch to
         * @param duration The duration of the cross fade, default value is 0.3s
         */
        crossFade(name, duration = 0.3) {
          this._hasBeenPlayed = true;
          const state = this._nameToState[name];
          if (state) {
            this.doPlayOrCrossFade(state, duration);
          }
        }

        /**
         * @en
         * Pause all animation states and all switching.
         * @zh
         * 暂停所有动画状态，并暂停所有切换。
         */
        pause() {
          this._crossFade.pause();
        }

        /**
         * @en
         * Resume all animation states and all switching.
         * @zh
         * 恢复所有动画状态，并恢复所有切换。
         */
        resume() {
          this._crossFade.resume();
        }

        /**
         * @en
         * Stop all animation states and all switching.
         * @zh
         * 停止所有动画状态，并停止所有切换。
         */
        stop() {
          this._crossFade.stop();
        }

        /**
         * @en
         * Get specified animation state.
         * @zh
         * 获取指定的动画状态。
         * @param name The name of the animation
         * @returns If no animation found, return null, otherwise the correspond animation state is returned
         */
        getState(name) {
          const state = this._nameToState[name];
          if (state && !state.curveLoaded) {
            state.initialize(this.node);
          }
          return state || null;
        }

        /**
         * @en
         * Creates a state for specified clip.
         * If there is already a clip with same name, the existing animation state will be stopped and overridden.
         * @zh
         * 使用指定的动画剪辑创建一个动画状态。
         * 若指定名称的动画状态已存在，已存在的动画状态将先被设为停止并被覆盖。
         * @param clip The animation clip
         * @param name The animation state name, if absent, the default clip's name will be used
         * @returns The animation state created
         */
        createState(clip, name) {
          name = name || clip.name;
          this.removeState(name);
          return this._doCreateState(clip, name);
        }

        /**
         * @en
         * Stops and removes specified clip.
         * @zh
         * 停止并移除指定的动画状态。
         * @param name The name of the animation state
         */
        removeState(name) {
          const state = this._nameToState[name];
          if (state) {
            state.allowLastFrameEvent(false);
            state.stop();
            delete this._nameToState[name];
          }
        }

        /**
         * @zh
         * 添加一个动画剪辑到 `this.clips`中并以此剪辑创建动画状态。
         * @en
         * Adds an animation clip into this component and creates a animation state for this clip.
         * @param clip The animation clip
         * @param name The animation state name, if absent, the default clip's name will be used
         * @returns The created animation state
         */
        addClip(clip, name) {
          if (!js.array.contains(this._clips, clip)) {
            this._clips.push(clip);
          }
          return this.createState(clip, name);
        }

        /**
         * @en
         * Remove clip from the animation list. This will remove the clip and any animation states based on it.<br>
         * If there are animation states depend on the clip are playing or clip is defaultClip, it will not delete the clip.<br>
         * But if force is true, then will always remove the clip and any animation states based on it. If clip is defaultClip,
         * defaultClip will be reset to null
         * @zh
         * 从动画列表中移除指定的动画剪辑，<br/>
         * 如果依赖于 clip 的 AnimationState 正在播放或者 clip 是 defaultClip 的话，默认是不会删除 clip 的。<br/>
         * 但是如果 force 参数为 true，则会强制停止该动画，然后移除该动画剪辑和相关的动画。这时候如果 clip 是 defaultClip，defaultClip 将会被重置为 null。<br/>
         * @param force - If force is true, then will always remove the clip and any animation states based on it.
         */
        removeClip(clip, force) {
          let removalState;
          for (const name in this._nameToState) {
            const state = this._nameToState[name];
            const stateClip = state.clip;
            if (stateClip === clip) {
              removalState = state;
              break;
            }
          }
          if (clip === this._defaultClip) {
            if (force) {
              this._defaultClip = null;
            } else {
              if (!TEST) {
                warnID(3902);
              }
              return;
            }
          }
          if (removalState && removalState.isPlaying) {
            if (force) {
              removalState.stop();
            } else {
              if (!TEST) {
                warnID(3903);
              }
              return;
            }
          }
          this._clips = this._clips.filter(item => item !== clip);
          if (removalState) {
            delete this._nameToState[removalState.name];
          }
        }

        /**
         * @en
         * Register animation event callback.<bg>
         * The event arguments will provide the AnimationState which emit the event.<bg>
         * When play an animation, will auto register the event callback to the AnimationState,<bg>
         * and unregister the event callback from the AnimationState when animation stopped.
         * @zh
         * 注册动画事件回调。<bg>
         * 回调的事件里将会附上发送事件的 AnimationState。<bg>
         * 当播放一个动画时，会自动将事件注册到对应的 AnimationState 上，停止播放时会将事件从这个 AnimationState 上取消注册。
         * @param type The event type to listen to
         * @param callback The callback when event triggered
         * @param target The callee when invoke the callback, could be absent
         * @return The registered callback
         * @example
         * ```ts
         * onPlay: function (type, state) {
         *     // callback
         * }
         *
         * // register event to all animation
         * animation.on('play', this.onPlay, this);
         * ```
         */
        on(type, callback, thisArg, once) {
          const ret = super.on(type, callback, thisArg, once);
          if (type === AnimationStateEventType.LASTFRAME) {
            this._syncAllowLastFrameEvent();
          }
          return ret;
        }
        once(type, callback, thisArg) {
          const ret = super.once(type, callback, thisArg);
          if (type === AnimationStateEventType.LASTFRAME) {
            this._syncAllowLastFrameEvent();
          }
          return ret;
        }

        /**
         * @en
         * Unregister animation event callback.
         * @zh
         * 取消注册动画事件回调。
         * @param {String} type The event type to unregister
         * @param {Function} callback The callback to unregister
         * @param {Object} target The callee of the callback, could be absent
         * @example
         * ```ts
         * // unregister event to all animation
         * animation.off('play', this.onPlay, this);
         * ```
         */
        off(type, callback, thisArg) {
          super.off(type, callback, thisArg);
          if (type === AnimationStateEventType.LASTFRAME) {
            this._syncDisallowLastFrameEvent();
          }
        }

        /**
         * @internal
         */
        _createState(clip, name) {
          return new AnimationState(clip, name);
        }

        /**
         * @internal
         */
        _doCreateState(clip, name) {
          const state = this._createState(clip, name);
          state._setEventTarget(this);
          state.allowLastFrameEvent(this.hasEventListener(AnimationStateEventType.LASTFRAME));
          if (this.node) {
            state.initialize(this.node);
          }
          this._nameToState[state.name] = state;
          return state;
        }

        /**
         * @internal This method only friends to skeletal animation component.
         */
        doPlayOrCrossFade(state, duration) {
          this._crossFade.play();
          this._crossFade.crossFade(state, duration);
        }
        _removeStateOfAutomaticClip(clip) {
          for (const name in this._nameToState) {
            const state = this._nameToState[name];
            if (equalClips(clip, state.clip)) {
              state.stop();
              delete this._nameToState[name];
            }
          }
        }
        _syncAllowLastFrameEvent() {
          if (this.hasEventListener(AnimationStateEventType.LASTFRAME)) {
            for (const stateName in this._nameToState) {
              this._nameToState[stateName].allowLastFrameEvent(true);
            }
          }
        }
        _syncDisallowLastFrameEvent() {
          if (!this.hasEventListener(AnimationStateEventType.LASTFRAME)) {
            for (const stateName in this._nameToState) {
              this._nameToState[stateName].allowLastFrameEvent(false);
            }
          }
        }
      }, _Animation.EventType = AnimationStateEventType, _Animation), _applyDecoratedDescriptor(_class2.prototype, "clips", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "clips"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "defaultClip", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "defaultClip"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "playOnLoad", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_clips", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_defaultClip", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class)));
      cclegacy.Animation = Animation;

      /**
       * Alias of [[Animation]]
       * @deprecated Since v1.2
       */

      cclegacy.AnimationComponent = Animation;
      js.setClassAlias(Animation, 'cc.AnimationComponent');
    }
  };
});