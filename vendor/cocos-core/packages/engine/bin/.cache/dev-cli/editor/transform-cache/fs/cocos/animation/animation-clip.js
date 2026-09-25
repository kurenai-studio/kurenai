System.register("q-bundled:///fs/cocos/animation/animation-clip.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../asset/assets/asset.js", "../core/index.js", "../3d/skeletal-animation/skeletal-animation-data-hub.js", "./types.js", "../scene-graph/node.js", "./legacy-clip-data.js", "./internal-symbols.js", "./tracks/track.js", "./define.js", "./tracks/untyped-track.js", "./tracks/object-track.js", "./exotic-animation/exotic-animation.js", "./global-animation-manager.js", "./auxiliary-curve-entry.js", "../core/utils/array.js", "./event/event-emitter.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, DEBUG, Asset, errorID, warnID, cclegacy, js, geometry, approx, clamp, Mat4, Quat, Vec3, murmurhash2_32_gc, binarySearchEpsilon, assertIsTrue, SkelAnimDataHub, AnimationWrapMode, WrapMode, Node, legacy, BAKE_SKELETON_CURVE_SYMBOL, trackBindingTag, TrackPath, createEvalSymbol, UntypedTrack, ObjectTrack, getGlobalAnimationManager, AuxiliaryCurveEntry, removeIf, invokeComponentMethodsEngagedInAnimationEvent, TrackEvalStatus, EmbeddedPlayerEvaluation, AnimationClipEvaluation, BoneTransform, BoneGlobalTransform, RootMotionEvaluation, EventEvaluator, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _AnimationClip, _dec2, _class3, _class4, _descriptor11, _descriptor12, searchForRootBonePathSymbol, exoticAnimationTag, embeddedPlayerCountTag, getEmbeddedPlayersTag, addEmbeddedPlayerTag, removeEmbeddedPlayerTag, clearEmbeddedPlayersTag, additiveSettingsTag, AnimationClip, AdditiveSettings, motionTransformCache, InvalidIndex;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function relativeTransform(out, from, to) {
    Mat4.invert(out, from);
    Mat4.multiply(out, to, out);
  }
  function createBoneTransformBinding(boneTransform, property) {
    switch (property) {
      default:
        return undefined;
      case 'position':
        return {
          setValue(value) {
            Vec3.copy(boneTransform.position, value);
          }
        };
      case 'rotation':
        return {
          setValue(value) {
            Quat.copy(boneTransform.rotation, value);
          }
        };
      case 'scale':
        return {
          setValue(value) {
            Vec3.copy(boneTransform.scale, value);
          }
        };
      case 'eulerAngles':
        return {
          setValue(value) {
            Vec3.copy(boneTransform.eulerAngles, value);
          }
        };
    }
  }

  // #region Events

  function wrapIterations(iterations) {
    if (iterations - (iterations | 0) === 0) {
      iterations -= 1;
    }
    return iterations | 0;
  }
  function getEventGroupIndexAtRatio(ratio, ratios) {
    const result = binarySearchEpsilon(ratios, ratio);
    return result;
  }

  // #endregion
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
      warnID = _coreIndexJs.warnID;
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      geometry = _coreIndexJs.geometry;
      approx = _coreIndexJs.approx;
      clamp = _coreIndexJs.clamp;
      Mat4 = _coreIndexJs.Mat4;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
      binarySearchEpsilon = _coreIndexJs.binarySearchEpsilon;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_dSkeletalAnimationSkeletalAnimationDataHubJs) {
      SkelAnimDataHub = _dSkeletalAnimationSkeletalAnimationDataHubJs.SkelAnimDataHub;
    }, function (_typesJs) {
      AnimationWrapMode = _typesJs.WrapMode;
      WrapMode = _typesJs.WrapMode;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_legacyClipDataJs) {
      legacy = _legacyClipDataJs;
    }, function (_internalSymbolsJs) {
      BAKE_SKELETON_CURVE_SYMBOL = _internalSymbolsJs.BAKE_SKELETON_CURVE_SYMBOL;
    }, function (_tracksTrackJs) {
      trackBindingTag = _tracksTrackJs.trackBindingTag;
      TrackPath = _tracksTrackJs.TrackPath;
    }, function (_defineJs) {
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_tracksUntypedTrackJs) {
      UntypedTrack = _tracksUntypedTrackJs.UntypedTrack;
    }, function (_tracksObjectTrackJs) {
      ObjectTrack = _tracksObjectTrackJs.ObjectTrack;
    }, function (_exoticAnimationExoticAnimationJs) {}, function (_globalAnimationManagerJs) {
      getGlobalAnimationManager = _globalAnimationManagerJs.getGlobalAnimationManager;
    }, function (_auxiliaryCurveEntryJs) {
      AuxiliaryCurveEntry = _auxiliaryCurveEntryJs.AuxiliaryCurveEntry;
    }, function (_coreUtilsArrayJs) {
      removeIf = _coreUtilsArrayJs.removeIf;
    }, function (_eventEventEmitterJs) {
      invokeComponentMethodsEngagedInAnimationEvent = _eventEventEmitterJs.invokeComponentMethodsEngagedInAnimationEvent;
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
      // #region Tracks
      // Export for test
      _export("searchForRootBonePathSymbol", searchForRootBonePathSymbol = Symbol('SearchForRootBonePath')); // #endregion
      _export("exoticAnimationTag", exoticAnimationTag = Symbol('ExoticAnimation'));
      _export("embeddedPlayerCountTag", embeddedPlayerCountTag = Symbol('[[EmbeddedPlayerCount]]'));
      _export("getEmbeddedPlayersTag", getEmbeddedPlayersTag = Symbol('[[GetEmbeddedPlayers]]'));
      _export("addEmbeddedPlayerTag", addEmbeddedPlayerTag = Symbol('[[AddEmbeddedPlayer]]'));
      _export("removeEmbeddedPlayerTag", removeEmbeddedPlayerTag = Symbol('[[RemoveEmbeddedPlayer]]'));
      _export("clearEmbeddedPlayersTag", clearEmbeddedPlayersTag = Symbol('[[ClearEmbeddedPlayers]]'));
      /**
       * Tag to access the additive settings associated on animation clip.
       */
      _export("additiveSettingsTag", additiveSettingsTag = Symbol('[[Additive Settings]]'));
      /**
       * @zh 动画剪辑表示一段使用动画编辑器编辑的关键帧动画或是外部美术工具生产的骨骼动画。
       * 它的数据主要被分为几层：轨道、关键帧和曲线。
       * @en The animation clip represents a sequence of key frame animation created with the animation editor or skeletal animation other DCC tools.
       * The data is divided in different levels: tracks, key frames, curves.
       */
      _export("AnimationClip", AnimationClip = (_dec = ccclass('cc.AnimationClip'), _dec(_class = (_class2 = (_AnimationClip = class AnimationClip extends Asset {
        /**
         * @en Crate clip with a set of sprite frames
         * @zh 使用一组序列帧图片来创建动画剪辑
         * @example
         * ```
         * import { AnimationClip } from 'cc';
         * const clip = AnimationClip.createWithSpriteFrames(spriteFrames, 10);
         * ```
         */
        static createWithSpriteFrames(spriteFrames, sample) {
          const clip = new AnimationClip();
          clip.sample = sample || clip.sample;
          clip.duration = spriteFrames.length / clip.sample;
          const step = 1 / clip.sample;
          const track = new ObjectTrack();
          track.path = new TrackPath().toComponent('cc.Sprite').toProperty('spriteFrame');
          const curve = track.channels()[0].curve;
          curve.assignSorted(spriteFrames.map((spriteFrame, index) => [step * index, spriteFrame]));
          clip.addTrack(track);
          return clip;
        }

        /**
         * @zh 动画帧率，单位为帧/秒。注意此属性仅用于编辑器动画编辑。
         * @en Animation frame rate: frames per second.
         * Note this property is only used for animation editing in Editor.
         */

        constructor(name) {
          super(name);
          _initializerDefineProperty(this, "sample", _descriptor, this);
          /**
           * @zh 动画的播放速度。
           * @en Animation playback speed.
           */
          _initializerDefineProperty(this, "speed", _descriptor2, this);
          /**
           * @zh 动画的循环模式。
           * @en Animation loop mode.
           */
          _initializerDefineProperty(this, "wrapMode", _descriptor3, this);
          /**
           * Sets if node TRS curves in this animation can be blended.
           * Normally this flag is enabled for model animation and disabled for other case.
           * @internal This is an internal slot. Never use it in your code.
           */
          _initializerDefineProperty(this, "enableTrsBlending", _descriptor4, this);
          _initializerDefineProperty(this, "_duration", _descriptor5, this);
          _initializerDefineProperty(this, "_hash", _descriptor6, this);
          this.frameRate = 0;
          _initializerDefineProperty(this, "_tracks", _descriptor7, this);
          _initializerDefineProperty(this, "_exoticAnimation", _descriptor8, this);
          this._legacyData = undefined;
          this._legacyDataDirty = false;
          _initializerDefineProperty(this, "_events", _descriptor9, this);
          _initializerDefineProperty(this, "_embeddedPlayers", _descriptor0, this);
          _initializerDefineProperty(this, "_additiveSettings", _descriptor1, this);
          _initializerDefineProperty(this, "_auxiliaryCurveEntries", _descriptor10, this);
          this._runtimeEvents = {
            ratios: [],
            eventGroups: []
          };
        }

        /**
         * @zh 动画的周期。
         * @en Animation duration.
         */
        get duration() {
          return this._duration;
        }
        set duration(value) {
          this._duration = value;
        }

        /**
         * @en
         * Gets the count of tracks this animation owns.
         * @zh
         * 获取此动画中的轨道数量。
         */
        get tracksCount() {
          return this._tracks.length;
        }

        /**
         * @en
         * Gets an iterable to tracks.
         * @zh
         * 获取可用于迭代轨道的对象。
         */
        get tracks() {
          return this._tracks;
        }
        get hash() {
          var _this$_exoticAnimatio, _this$_exoticAnimatio2;
          // hashes should already be computed offline, but if not, make one
          if (this._hash) {
            return this._hash;
          }
          // Only hash exotic animations(including skeletal animations imported from model file).
          // The behavior is consistent with how `.hash` implemented prior to 3.3.
          const hashString = `Exotic:${(_this$_exoticAnimatio = (_this$_exoticAnimatio2 = this._exoticAnimation) == null ? void 0 : _this$_exoticAnimatio2.toHashString()) != null ? _this$_exoticAnimatio : ''}`;
          return this._hash = murmurhash2_32_gc(hashString, 666);
        }

        /**
         * @zh 动画包含的事件数据。
         * @en Associated event data.
         */
        get events() {
          return this._events;
        }
        set events(value) {
          this._events = value;
          const ratios = [];
          const eventGroups = [];
          const events = this.events.sort((a, b) => a.frame - b.frame);
          const nEvents = events.length;
          for (let iEvent = 0; iEvent < nEvents; ++iEvent) {
            const eventData = events[iEvent];
            const ratio = eventData.frame / this._duration;
            let i = ratios.findIndex(r => r === ratio);
            if (i < 0) {
              i = ratios.length;
              ratios.push(ratio);
              eventGroups.push({
                events: []
              });
            }
            eventGroups[i].events.push({
              functionName: eventData.func,
              parameters: eventData.params
            });
          }
          this._runtimeEvents = {
            ratios,
            eventGroups
          };
        }
        get [exoticAnimationTag]() {
          return this._exoticAnimation;
        }
        set [exoticAnimationTag](value) {
          this._exoticAnimation = value;
        }

        /**
         * Gets if this animation clip contains additive animation.
         * @experimental
         */
        get isAdditive_experimental() {
          return this._additiveSettings.enabled;
        }

        /**
         * Accesses the additive animation settings.
         * @internal
         */
        get [additiveSettingsTag]() {
          return this._additiveSettings;
        }
        onLoaded() {
          this.frameRate = this.sample;
          this.events = this._events;
        }

        /**
         * @en
         * Counts the time range that the tracks within this animation span.
         * @zh
         * 获取此动画所有轨道占据的时间范围。
         * @returns The time range.
         */
        range() {
          const range = {
            min: Infinity,
            max: -Infinity
          };
          const {
            _tracks: tracks
          } = this;
          const nTracks = tracks.length;
          for (let iTrack = 0; iTrack < nTracks; ++iTrack) {
            const track = tracks[iTrack];
            const trackRange = track.range();
            range.min = Math.min(range.min, trackRange.min);
            range.max = Math.max(range.max, trackRange.max);
          }
          return range;
        }

        /**
         * @en
         * Gets the specified track.
         * @zh
         * 获取指定的轨道。
         * @param index Index to the track.
         * @returns The track.
         */
        getTrack(index) {
          return this._tracks[index];
        }

        /**
         * @en
         * Adds a track into this animation.
         * @zh
         * 添加一个轨道到此动画中。
         * @param track The track.
         * @returns Index to the track.
         */
        addTrack(track) {
          const index = this._tracks.length;
          this._tracks.push(track);
          return index;
        }

        /**
         * @en
         * Removes a track from this animation.
         * @zh
         * 移除此动画中的指定轨道。
         * @param index Index to the track.
         */
        removeTrack(index) {
          this._tracks.splice(index, 1);
        }

        /**
         * @en
         * Removes all tracks from this animation.
         * @zh
         * 移除此动画的所有轨道。
         */
        clearTracks() {
          this._tracks.length = 0;
        }

        /**
         * Returns if this clip has any event.
         * @internal Do not use this in your code.
         */
        containsAnyEvent() {
          return this._events.length !== 0;
        }

        /**
         * Creates an event evaluator for this animation.
         * @param targetNode Target node used to fire events.
         * @internal Do not use this in your code.
         */
        createEventEvaluator(targetNode) {
          return new EventEvaluator(targetNode, this._runtimeEvents.ratios, this._runtimeEvents.eventGroups, this.wrapMode);
        }

        /**
         * Returns if this clip has any embedded player.
         * @internal Do not use this in your code.
         */
        containsAnyEmbeddedPlayer() {
          return this._embeddedPlayers.length !== 0;
        }

        /**
         * Creates an embedded player evaluator for this animation.
         * @param targetNode Target node.
         * @internal Do not use this in your code.
         */
        createEmbeddedPlayerEvaluator(targetNode) {
          return new EmbeddedPlayerEvaluation(this._embeddedPlayers, targetNode);
        }

        /**
         * Creates an evaluator for this animation.
         * @param context The context.
         * @returns The evaluator.
         * @internal Do not use this in your code.
         */
        createEvaluator(context) {
          const {
            target
          } = context;
          const binder = binding => {
            if (context.mask && binding.isMaskedOff(context.mask)) {
              return undefined;
            }
            const trackTarget = binding.createRuntimeBinding(target, this.enableTrsBlending ? context.pose : undefined, false);
            if (DEBUG && !trackTarget) {
              // If we got a null track target here, we should already have warn logged,
              // To elaborate on error details, we warn here as well.
              // Note: if in the future this log appears alone,
              // it must be a BUG which break promise by above statement.
              warnID(3937, this.name, context.target instanceof Node ? context.target.name : context.target);
            }
            return trackTarget != null ? trackTarget : undefined;
          };
          return this._createEvalWithBinder(target, binder, context.rootMotion);
        }
        destroy() {
          var _cclegacy$director$ro;
          const dataPoolManager = (_cclegacy$director$ro = cclegacy.director.root) == null ? void 0 : _cclegacy$director$ro.dataPoolManager;
          if (dataPoolManager) {
            dataPoolManager.releaseAnimationClip(this);
          }
          SkelAnimDataHub.destroy(this);
          return super.destroy();
        }
        [BAKE_SKELETON_CURVE_SYMBOL](start, samples, frames) {
          const step = 1.0 / samples;
          const animatedJoints = this._collectAnimatedJoints();
          const nAnimatedJoints = animatedJoints.length;
          const jointsBakeInfo = {};
          for (let iAnimatedJoint = 0; iAnimatedJoint < nAnimatedJoints; ++iAnimatedJoint) {
            const joint = animatedJoints[iAnimatedJoint];
            jointsBakeInfo[joint] = {
              transforms: Array.from({
                length: frames
              }, () => new Mat4())
            };
          }
          const skeletonFrames = animatedJoints.reduce((result, joint) => {
            result[joint] = new BoneGlobalTransform();
            return result;
          }, {});
          for (const joint in skeletonFrames) {
            const skeletonFrame = skeletonFrames[joint];
            const parentJoint = joint.lastIndexOf('/');
            if (parentJoint >= 0) {
              const parentJointName = joint.substring(0, parentJoint);
              const parentJointFrame = skeletonFrames[parentJointName];
              // Parent joint can be nil since some of joints' parents
              // are not in animation list. For example, joints under socket nodes.
              if (parentJointFrame) {
                skeletonFrame.parent = parentJointFrame;
              }
            }
          }
          const binder = binding => {
            const trsPath = binding.parseTrsPath();
            if (!trsPath) {
              return undefined;
            }
            const jointFrame = skeletonFrames[trsPath.node];
            if (!jointFrame) {
              return undefined;
            }
            return createBoneTransformBinding(jointFrame, trsPath.property);
          };
          const evaluator = this._createEvalWithBinder(undefined, binder, undefined);
          for (let iFrame = 0; iFrame < frames; ++iFrame) {
            const time = start + step * iFrame;
            evaluator.evaluate(time);
            for (let iAnimatedJoint = 0; iAnimatedJoint < nAnimatedJoints; ++iAnimatedJoint) {
              const joint = animatedJoints[iAnimatedJoint];
              Mat4.copy(jointsBakeInfo[joint].transforms[iFrame], skeletonFrames[joint].globalTransform);
            }
            for (let iAnimatedJoint = 0; iAnimatedJoint < nAnimatedJoints; ++iAnimatedJoint) {
              const joint = animatedJoints[iAnimatedJoint];
              skeletonFrames[joint].invalidate();
            }
          }
          return {
            samples,
            frames,
            joints: jointsBakeInfo
          };
        }

        /**
         * Convert all untyped tracks into typed ones and delete the original.
         * @param refine How to decide the type on specified path.
         * @internal DO NOT USE THIS IN YOUR CODE.
         */
        upgradeUntypedTracks(refine) {
          const newTracks = [];
          const removals = [];
          const {
            _tracks: tracks
          } = this;
          const nTracks = tracks.length;
          for (let iTrack = 0; iTrack < nTracks; ++iTrack) {
            const track = tracks[iTrack];
            if (!(track instanceof UntypedTrack)) {
              continue;
            }
            const newTrack = track.upgrade(refine);
            if (newTrack) {
              newTracks.push(newTrack);
              removals.push(track);
            }
          }
          const nRemovalTracks = removals.length;
          for (let iRemovalTrack = 0; iRemovalTrack < nRemovalTracks; ++iRemovalTrack) {
            js.array.remove(tracks, removals[iRemovalTrack]);
          }
          tracks.push(...newTracks);
        }

        /**
         * @internal Export for test.
         */
        [searchForRootBonePathSymbol]() {
          return this._searchForRootBonePath();
        }

        // #region Legacy area
        // The following are significantly refactored and deprecated since 3.3.
        // We deprecates the direct exposure of keys, values, events.
        // Instead, we use track to organize them together.

        /**
         * @zh 曲线可引用的所有时间轴。
         * @en Frame keys referenced by curves.
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        get keys() {
          return this._getLegacyData().keys;
        }
        set keys(value) {
          this._legacyDataDirty = true;
          this._getLegacyData().keys = value;
        }

        /**
         * @zh 此动画包含的所有曲线。
         * @en Curves this animation contains.
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        get curves() {
          this._legacyDataDirty = true;
          return this._getLegacyData().curves;
        }
        set curves(value) {
          this._getLegacyData().curves = value;
        }

        /**
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        get commonTargets() {
          return this._getLegacyData().commonTargets;
        }
        set commonTargets(value) {
          this._legacyDataDirty = true;
          this._getLegacyData().commonTargets = value;
        }

        /**
         * @en
         * The animation's data.
         * @zh
         * 此动画的数据。
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        get data() {
          return this._getLegacyData().data;
        }

        /**
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        getPropertyCurves() {
          return this._getLegacyData().getPropertyCurves();
        }

        /**
         * @deprecated Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        get eventGroups() {
          return this._runtimeEvents.eventGroups;
        }

        /**
         * @zh 提交事件数据的修改。
         * 当你修改了 `this.events` 时，必须调用 `this.updateEventDatas()` 使修改生效。
         * @en
         * Commit event data update.
         * You should call this function after you changed the `events` data to take effect.
         * @deprecated Since V3.3. Please Assign to `this.events`.
         */
        updateEventDatas() {
          this.events = this._events;
        }

        /**
         * @zh 返回本动画是否包含事件数据。
         * @en Returns if this animation contains event data.
         * @protected
         */
        hasEvents() {
          return this.events.length !== 0;
        }

        /**
         * Migrates legacy data into tracks.
         * NOTE: This method tend to be used as internal purpose or patch.
         * DO NOT use it in your code since it might be removed for the future at any time.
         * @internal Since V3.3. Please reference to the track/channel/curve mechanism introduced in V3.3.
         */
        syncLegacyData() {
          if (this._legacyData) {
            this._fromLegacy(this._legacyData);
            this._legacyData = undefined;
          }
        }

        // #endregion

        /**
         * @internal
         */
        get [embeddedPlayerCountTag]() {
          return this._embeddedPlayers.length;
        }

        /**
         * @internal
         */
        [getEmbeddedPlayersTag]() {
          return this._embeddedPlayers;
        }

        /**
         * @internal
         */
        [addEmbeddedPlayerTag](embeddedPlayer) {
          this._embeddedPlayers.push(embeddedPlayer);
        }

        /**
         * @internal
         */
        [removeEmbeddedPlayerTag](embeddedPlayer) {
          const iEmbeddedPlayer = this._embeddedPlayers.indexOf(embeddedPlayer);
          if (iEmbeddedPlayer >= 0) {
            this._embeddedPlayers.splice(iEmbeddedPlayer, 1);
          }
        }

        /**
         * @internal
         */
        [clearEmbeddedPlayersTag]() {
          this._embeddedPlayers.length = 0;
        }

        /**
         * @zh 获取此动画剪辑中的辅助曲线数量。
         * @en Gets the count of auxiliary curves within this animation clip.
         */
        get auxiliaryCurveCount_experimental() {
          return this._auxiliaryCurveEntries.length;
        }

        /**
         * @zh 返回此动画剪辑中所有辅助曲线的名称。
         * @en Returns names of all auxiliary curves within this animation clip.
         */
        getAuxiliaryCurveNames_experimental() {
          return this._auxiliaryCurveEntries.map(entry => entry.name);
        }

        /**
         * @zh 返回此动画剪辑中是否存在指定的辅助曲线。
         * @en Returns if the specified auxiliary curve exists in this animation clip.
         */
        hasAuxiliaryCurve_experimental(name) {
          return !!this._findAuxiliaryCurveEntry(name);
        }

        /**
         * @zh 添加一条辅助曲线。如果已存在同名的辅助曲线，则直接返回。
         * @en Adds an auxiliary curve. Directly return if there is already such named auxiliary curve.
         * @param name @zh 辅助曲线的名称。@en The auxiliary curve's name.
         * @returns @zh 新增或已存在的辅助曲线。 @en The newly created or existing auxiliary curve.
         * @experimental
         */
        addAuxiliaryCurve_experimental(name) {
          let entry = this._findAuxiliaryCurveEntry(name);
          if (!entry) {
            entry = new AuxiliaryCurveEntry();
            entry.name = name;
            this._auxiliaryCurveEntries.push(entry);
          }
          return entry.curve;
        }

        /**
         * @zh 获取指定的辅助曲线。
         * @en Gets the specified auxiliary curve.
         * @param name @zh 辅助曲线的名称。@en The auxiliary curve's name.
         * @returns @zh 指定的辅助曲线。@en The specified auxiliary curve.
         * @experimental
         */
        getAuxiliaryCurve_experimental(name) {
          const entry = this._findAuxiliaryCurveEntry(name);
          assertIsTrue(entry);
          return entry.curve;
        }

        /**
         * @zh 重命名指定的辅助曲线。
         * @en Renames the specified auxiliary curve.
         * @param name @zh 要重命名的辅助曲线的名称。@en Name of the auxiliary curve to rename.
         * @param newName @zh 新名称。@en New name.
         */
        renameAuxiliaryCurve_experimental(name, newName) {
          const entry = this._findAuxiliaryCurveEntry(name);
          if (entry) {
            entry.name = newName;
          }
        }

        /**
         * @zh 移除指定的辅助曲线。
         * @en Removes the specified auxiliary curve.
         * @param name @zh 辅助曲线的名称。@en The auxiliary curve's name.
         * @experimental
         */
        removeAuxiliaryCurve_experimental(name) {
          removeIf(this._auxiliaryCurveEntries, entry => entry.name === name);
        }

        /**
         * @internal
         */
        _trySyncLegacyData() {
          if (this._legacyDataDirty) {
            this._legacyDataDirty = false;
            this.syncLegacyData();
          }
        }
        _createEvalWithBinder(target, binder, rootMotionOptions) {
          if (this._legacyDataDirty) {
            this._legacyDataDirty = false;
            this.syncLegacyData();
          }
          const rootMotionTrackExcludes = [];
          let rootMotionEvaluation;
          if (rootMotionOptions) {
            rootMotionEvaluation = this._createRootMotionEvaluation(target, rootMotionOptions, rootMotionTrackExcludes);
          }
          const trackEvalStatues = [];
          let exoticAnimationEvaluator;
          const {
            _tracks: tracks
          } = this;
          const nTracks = tracks.length;
          for (let iTrack = 0; iTrack < nTracks; ++iTrack) {
            const track = tracks[iTrack];
            if (rootMotionTrackExcludes.includes(track)) {
              continue;
            }
            if (Array.from(track.channels()).every(({
              curve
            }) => curve.keyFramesCount === 0)) {
              continue;
            }
            const runtimeBinding = binder(track[trackBindingTag]);
            if (!runtimeBinding) {
              continue;
            }
            let trackEval;
            if (!(track instanceof UntypedTrack)) {
              trackEval = track[createEvalSymbol]();
            } else {
              // Handle untyped track specially.
              if (!runtimeBinding.getValue) {
                // If we can not get a value from binding,
                // we're not able to instantiate the untyped track.
                // This matches the behavior prior to V3.3.
                errorID(3930);
                continue;
              }
              const hintValue = runtimeBinding.getValue();
              trackEval = track.createLegacyEval(hintValue);
            }
            trackEvalStatues.push(new TrackEvalStatus(runtimeBinding, trackEval));
          }
          if (this._exoticAnimation) {
            exoticAnimationEvaluator = this._exoticAnimation.createEvaluator(binder);
          }
          const evaluation = new AnimationClipEvaluation(trackEvalStatues, exoticAnimationEvaluator, rootMotionEvaluation);
          return evaluation;
        }
        _createRootMotionEvaluation(target, rootMotionOptions, rootMotionTrackExcludes) {
          if (!(target instanceof Node)) {
            errorID(3920);
            return undefined;
          }
          const rootBonePath = this._searchForRootBonePath();
          if (!rootBonePath) {
            warnID(3923);
            return undefined;
          }
          const rootBone = target.getChildByPath(rootBonePath);
          if (!rootBone) {
            warnID(3924);
            return undefined;
          }

          // const { } = rootMotionOptions;

          const boneTransform = new BoneTransform();
          const rootMotionsTrackEvaluations = [];
          const {
            _tracks: tracks
          } = this;
          const nTracks = tracks.length;
          for (let iTrack = 0; iTrack < nTracks; ++iTrack) {
            const track = tracks[iTrack];
            const {
              [trackBindingTag]: trackBinding
            } = track;
            const trsPath = trackBinding.parseTrsPath();
            if (!trsPath) {
              continue;
            }
            const bonePath = trsPath.node;
            if (bonePath !== rootBonePath) {
              continue;
            }
            rootMotionTrackExcludes.push(track);
            const property = trsPath.property;
            const runtimeBinding = createBoneTransformBinding(boneTransform, property);
            if (!runtimeBinding) {
              continue;
            }
            const trackEval = track[createEvalSymbol]();
            rootMotionsTrackEvaluations.push(new TrackEvalStatus(runtimeBinding, trackEval));
          }
          const rootMotionEvaluation = new RootMotionEvaluation(rootBone, this._duration, boneTransform, rootMotionsTrackEvaluations);
          return rootMotionEvaluation;
        }
        _searchForRootBonePath() {
          const paths = this._tracks.map(track => {
            const trsPath = track[trackBindingTag].parseTrsPath();
            if (trsPath) {
              const nodePath = trsPath.node;
              return {
                path: nodePath,
                rank: nodePath.split('/').length
              };
            } else {
              return {
                path: '',
                rank: 0
              };
            }
          });
          paths.sort((a, b) => a.rank - b.rank);
          const iNonEmptyPath = paths.findIndex(p => p.rank !== 0);
          if (iNonEmptyPath < 0) {
            return '';
          }
          const nPaths = paths.length;
          const firstPath = paths[iNonEmptyPath];
          let highestPathsAreSame = true;
          for (let iPath = iNonEmptyPath + 1; iPath < nPaths; ++iPath) {
            const path = paths[iPath];
            if (path.rank !== firstPath.rank) {
              break;
            }
            if (path.path !== firstPath.path) {
              highestPathsAreSame = false;
              break;
            }
          }
          return highestPathsAreSame ? firstPath.path : '';
        }
        _getLegacyData() {
          if (!this._legacyData) {
            this._legacyData = this._toLegacy();
          }
          return this._legacyData;
        }
        _toLegacy() {
          const keys = [];
          const legacyCurves = [];
          const commonTargets = [];
          const legacyClipData = new legacy.AnimationClipLegacyData(this._duration);
          legacyClipData.keys = keys;
          legacyClipData.curves = legacyCurves;
          legacyClipData.commonTargets = commonTargets;
          return legacyClipData;
        }
        _fromLegacy(legacyData) {
          const newTracks = legacyData.toTracks();
          const nNewTracks = newTracks.length;
          for (let iNewTrack = 0; iNewTrack < nNewTracks; ++iNewTrack) {
            this.addTrack(newTracks[iNewTrack]);
          }
        }
        _collectAnimatedJoints() {
          const joints = new Set();
          const {
            _tracks: tracks
          } = this;
          const nTracks = tracks.length;
          for (let iTrack = 0; iTrack < nTracks; ++iTrack) {
            const track = tracks[iTrack];
            const trsPath = track[trackBindingTag].parseTrsPath();
            if (trsPath) {
              joints.add(trsPath.node);
            }
          }
          if (this._exoticAnimation) {
            const animatedJoints = this._exoticAnimation.collectAnimatedJoints();
            const nAnimatedJoints = animatedJoints.length;
            for (let iAnimatedJoint = 0; iAnimatedJoint < nAnimatedJoints; ++iAnimatedJoint) {
              joints.add(animatedJoints[iAnimatedJoint]);
            }
          }
          return Array.from(joints);
        }
        _findAuxiliaryCurveEntry(name) {
          return this._auxiliaryCurveEntries.find(entry => entry.name === name);
        }
      }, _AnimationClip.WrapMode = AnimationWrapMode, _AnimationClip), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "sample", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 60;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "speed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "wrapMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return AnimationWrapMode.Normal;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "enableTrsBlending", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_duration", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_hash", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_tracks", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_exoticAnimation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_events", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_embeddedPlayers", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_additiveSettings", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new AdditiveSettings();
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_auxiliaryCurveEntries", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      _export("AnimationClipAdditiveSettings", AdditiveSettings = (_dec2 = ccclass('cc.AnimationClipAdditiveSettings'), _dec2(_class3 = (_class4 = class AdditiveSettings {
        constructor() {
          _initializerDefineProperty(this, "enabled", _descriptor11, this);
          _initializerDefineProperty(this, "refClip", _descriptor12, this);
        }
      }, _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "enabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "refClip", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class4)) || _class3));
      cclegacy.AnimationClip = AnimationClip;
      TrackEvalStatus = class TrackEvalStatus {
        constructor(binding, trackEval) {
          this._binding = void 0;
          this._trackEval = void 0;
          this._shouldEvaluateDefault = true;
          this._binding = binding;
          this._trackEval = trackEval;
          this._shouldEvaluateDefault = !!binding.getValue && trackEval.requiresDefault;
        }
        evaluate(time) {
          const {
            _binding: binding,
            _trackEval: trackEval
          } = this;
          const defaultValue = this._shouldEvaluateDefault
          // See `this._shouldEvaluateDefault` for the assertion.
          ? binding.getValue() : undefined;
          const value = trackEval.evaluate(time, defaultValue);
          binding.setValue(value);
        }
      }; // eslint-disable-next-line @typescript-eslint/no-empty-interface
      EmbeddedPlayerEvaluation = class EmbeddedPlayerEvaluation {
        constructor(embeddedPlayers, rootNode) {
          this._embeddedPlayers = embeddedPlayers;
          this._embeddedPlayerEvaluationInfos = embeddedPlayers.map(embeddedPlayer => {
            const {
              playable: player
            } = embeddedPlayer;
            if (!player) {
              return null;
            }
            const instantiatedPlayer = player.instantiate(rootNode);
            if (!instantiatedPlayer) {
              return null;
            }
            return {
              instantiatedPlayer,
              entered: false,
              hostPauseTime: 0.0,
              lastIterations: 0
            };
          });
        }
        destroy() {
          const {
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayerEvaluationInfos.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            var _embeddedPlayerEvalua;
            (_embeddedPlayerEvalua = embeddedPlayerEvaluationInfos[iEmbeddedPlayer]) == null || _embeddedPlayerEvalua.instantiatedPlayer.destroy();
          }
          this._embeddedPlayerEvaluationInfos.length = 0;
        }

        /**
         * Evaluates the embedded players.
         * @param time The time([0, clipDuration]).
         * @param iterations The iterations the evaluation occurred. Should be integral.
         */
        evaluate(time, iterations) {
          assertIsTrue(Number.isInteger(iterations));
          const {
            _embeddedPlayers: embeddedPlayers,
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayers.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            const embeddedPlayerEvaluationInfo = embeddedPlayerEvaluationInfos[iEmbeddedPlayer];
            if (!embeddedPlayerEvaluationInfo) {
              continue;
            }
            const {
              entered,
              instantiatedPlayer,
              lastIterations
            } = embeddedPlayerEvaluationInfo;
            const {
              begin,
              end
            } = embeddedPlayers[iEmbeddedPlayer];
            const withinEmbeddedPlayer = time >= begin && time <= end;
            if (withinEmbeddedPlayer) {
              if (!entered) {
                instantiatedPlayer.play();
                embeddedPlayerEvaluationInfo.entered = true;
              } else if (iterations !== lastIterations) {
                instantiatedPlayer.stop();
                instantiatedPlayer.play();
                embeddedPlayerEvaluationInfo.entered = true;
              }
            } else if (entered) {
              instantiatedPlayer.stop();
              embeddedPlayerEvaluationInfo.entered = false;
            }
            embeddedPlayerEvaluationInfo.lastIterations = iterations;
            if (embeddedPlayerEvaluationInfo.entered) {
              const playerTime = time - begin;
              embeddedPlayerEvaluationInfo.instantiatedPlayer.setTime(playerTime);
            }
          }
        }
        notifyHostSpeedChanged(speed) {
          // Transmit the speed to embedded players that want a reconciled speed.
          const {
            _embeddedPlayers: embeddedPlayers,
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayers.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            const embeddedPlayerEvaluationInfo = embeddedPlayerEvaluationInfos[iEmbeddedPlayer];
            if (!embeddedPlayerEvaluationInfo) {
              continue;
            }
            const {
              instantiatedPlayer
            } = embeddedPlayerEvaluationInfo;
            const {
              reconciledSpeed
            } = embeddedPlayers[iEmbeddedPlayer];
            if (reconciledSpeed) {
              instantiatedPlayer.setSpeed(speed);
            }
          }
        }

        /**
         * Notifies that the host has ran into **playing** state.
         * @param time The time where host ran into playing state.
         */
        notifyHostPlay(time) {
          // Host has switched to "playing", this can be happened when:
          // - Previous state is "stopped": we must have stopped all embedded players.
          // - Is pausing: we need to resume all embedded players.
          const {
            _embeddedPlayers: embeddedPlayers,
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayers.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            const embeddedPlayerEvaluationInfo = embeddedPlayerEvaluationInfos[iEmbeddedPlayer];
            if (!embeddedPlayerEvaluationInfo) {
              continue;
            }
            const {
              begin,
              end
            } = embeddedPlayers[iEmbeddedPlayer];
            const {
              instantiatedPlayer,
              entered
            } = embeddedPlayerEvaluationInfo;
            if (entered) {
              const {
                hostPauseTime
              } = embeddedPlayerEvaluationInfo;
              // We can resume the embedded player
              // only if the pause/play happened at the same time
              // or the embedded player supports random access.
              // Otherwise we have to say goodbye to that embedded player.
              if (instantiatedPlayer.randomAccess || approx(hostPauseTime, time, 1e-5)) {
                const startTime = clamp(time, begin, end);
                instantiatedPlayer.play();
                instantiatedPlayer.setTime(startTime - begin);
              } else {
                instantiatedPlayer.stop();
              }
            }
          }
        }

        /**
         * Notifies that the host has ran into **pause** state.
         */
        notifyHostPause(time) {
          // Host is paused, simply transmit this to embedded players.
          const {
            _embeddedPlayers: embeddedPlayers,
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayers.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            const embeddedPlayerEvaluationInfo = embeddedPlayerEvaluationInfos[iEmbeddedPlayer];
            if (!embeddedPlayerEvaluationInfo) {
              continue;
            }
            const {
              instantiatedPlayer,
              entered
            } = embeddedPlayerEvaluationInfo;
            if (entered) {
              instantiatedPlayer.pause();
              embeddedPlayerEvaluationInfo.hostPauseTime = time;
            }
          }
        }

        /**
         * Notifies that the host has ran into **stopped** state.
         */
        notifyHostStop() {
          // Now that host is stopped, we stop all embedded players' playing
          // regardless of their progresses.
          const {
            _embeddedPlayers: embeddedPlayers,
            _embeddedPlayerEvaluationInfos: embeddedPlayerEvaluationInfos
          } = this;
          const nEmbeddedPlayers = embeddedPlayers.length;
          for (let iEmbeddedPlayer = 0; iEmbeddedPlayer < nEmbeddedPlayers; ++iEmbeddedPlayer) {
            const embeddedPlayerEvaluationInfo = embeddedPlayerEvaluationInfos[iEmbeddedPlayer];
            if (!embeddedPlayerEvaluationInfo) {
              continue;
            }
            const {
              instantiatedPlayer,
              entered
            } = embeddedPlayerEvaluationInfo;
            if (entered) {
              embeddedPlayerEvaluationInfo.entered = false;
              instantiatedPlayer.stop();
            }
          }
        }
      };
      AnimationClipEvaluation = class AnimationClipEvaluation {
        constructor(trackEvalStatuses, exoticAnimationEvaluator, rootMotionEvaluation) {
          this._exoticAnimationEvaluator = void 0;
          this._trackEvalStatues = [];
          this._rootMotionEvaluation = undefined;
          this._trackEvalStatues = trackEvalStatuses;
          this._exoticAnimationEvaluator = exoticAnimationEvaluator;
          this._rootMotionEvaluation = rootMotionEvaluation;
        }

        /**
         * Evaluates this animation.
         * @param time The time.
         */
        evaluate(time) {
          const {
            _trackEvalStatues: trackEvalStatuses,
            _exoticAnimationEvaluator: exoticAnimationEvaluator
          } = this;
          const nTrackEvalStatuses = trackEvalStatuses.length;
          for (let iTrackEvalStatus = 0; iTrackEvalStatus < nTrackEvalStatuses; ++iTrackEvalStatus) {
            trackEvalStatuses[iTrackEvalStatus].evaluate(time);
          }
          if (exoticAnimationEvaluator) {
            exoticAnimationEvaluator.evaluate(time);
          }
        }

        /**
         * Gets the root bone motion.
         * @param startTime Start time.
         * @param endTime End time.
         */
        evaluateRootMotion(time, motionLength) {
          const {
            _rootMotionEvaluation: rootMotionEvaluation
          } = this;
          if (rootMotionEvaluation) {
            rootMotionEvaluation.evaluate(time, motionLength);
          }
        }
      };
      BoneTransform = class BoneTransform {
        constructor() {
          this.position = new Vec3();
          this.scale = new Vec3(1.0, 1.0, 1.0);
          this.rotation = new Quat();
          this.eulerAngles = new Vec3();
        }
        getTransform(out) {
          Mat4.fromRTS(out, this.rotation, this.position, this.scale);
        }
      };
      BoneGlobalTransform = class BoneGlobalTransform extends BoneTransform {
        constructor(...args) {
          super(...args);
          this.parent = null;
          this._dirty = true;
          this._transform = new Mat4();
        }
        get globalTransform() {
          const transform = this._transform;
          if (this._dirty) {
            this._dirty = false;
            Mat4.fromRTS(transform, this.rotation, this.position, this.scale);
            if (this.parent) {
              Mat4.multiply(transform, this.parent.globalTransform, transform);
            }
          }
          return this._transform;
        }
        invalidate() {
          this._dirty = true;
        }
      };
      motionTransformCache = new Mat4();
      RootMotionEvaluation = class RootMotionEvaluation {
        constructor(_rootBone, _duration, _boneTransform, _trackEvalStatuses) {
          this._initialTransformCache = new Mat4();
          this._clipEndTransformCache = new Mat4();
          this._startTransformCache = new Mat4();
          this._endTransformCache = new Mat4();
          this._motionTransformCache = new Mat4();
          this._translationMotionCache = new Vec3();
          this._rotationMotionCache = new Quat();
          this._scaleMotionCache = new Vec3();
          this._rootBone = _rootBone;
          this._duration = _duration;
          this._boneTransform = _boneTransform;
          this._trackEvalStatuses = _trackEvalStatuses;
        }
        evaluate(time, motionLength) {
          const motionTransform = this._calcMotionTransform(time, motionLength, this._motionTransformCache);
          const {
            _translationMotionCache: translationMotion,
            _rotationMotionCache: rotationMotion,
            _scaleMotionCache: scaleMotion,
            _rootBone: rootBone
          } = this;
          Mat4.toSRT(motionTransform, rotationMotion, translationMotion, scaleMotion);
          Vec3.add(translationMotion, translationMotion, rootBone.position);
          rootBone.setPosition(translationMotion);
          Quat.multiply(rotationMotion, rotationMotion, rootBone.rotation);
          rootBone.setRotation(rotationMotion);
          Vec3.multiply(scaleMotion, scaleMotion, rootBone.scale);
          rootBone.setScale(scaleMotion);
        }
        _calcMotionTransform(time, motionLength, outTransform) {
          const {
            _duration: duration
          } = this;
          const remainLength = duration - time;
          assertIsTrue(remainLength >= 0);
          const startTransform = this._evaluateAt(time, this._startTransformCache);
          if (motionLength < remainLength) {
            const endTransform = this._evaluateAt(time + motionLength, this._endTransformCache);
            relativeTransform(outTransform, startTransform, endTransform);
          } else {
            Mat4.identity(outTransform);
            const accumulateMotionTransform = (from, to) => {
              relativeTransform(motionTransformCache, from, to);
              Mat4.multiply(outTransform, outTransform, motionTransformCache);
            };
            const diff = motionLength - remainLength;
            const repeatCount = Math.floor(diff / duration);
            const lastRemainTime = diff - repeatCount * duration;
            const clipStartTransform = this._evaluateAt(0, this._initialTransformCache);
            const clipEndTransform = this._evaluateAt(duration, this._clipEndTransformCache);
            const endTransform = this._evaluateAt(lastRemainTime, this._endTransformCache);

            // Start -> Clip End
            accumulateMotionTransform(startTransform, clipEndTransform);

            // Whole clip x Repeat Count
            relativeTransform(motionTransformCache, clipStartTransform, clipEndTransform);
            for (let i = 0; i < repeatCount; ++i) {
              Mat4.multiply(outTransform, outTransform, motionTransformCache);
            }

            // Clip Start -> End
            accumulateMotionTransform(clipStartTransform, endTransform);
          }
          return outTransform;
        }
        _evaluateAt(time, outTransform) {
          const {
            _trackEvalStatuses: trackEvalStatuses
          } = this;
          const nTrackEvalStatuses = trackEvalStatuses.length;
          for (let iTrackEvalStatus = 0; iTrackEvalStatus < nTrackEvalStatuses; ++iTrackEvalStatus) {
            trackEvalStatuses[iTrackEvalStatus].evaluate(time);
          }
          this._boneTransform.getTransform(outTransform);
          return outTransform;
        }
      };
      InvalidIndex = -1;
      EventEvaluator = class EventEvaluator {
        constructor(_targetNode, _ratios, _eventGroups, _wrapMode) {
          this._lastFrameIndex = -1;
          this._lastIterations = 0.0;
          this._lastDirection = 0;
          this._ignoreIndex = InvalidIndex;
          this._sampled = false;
          this._targetNode = _targetNode;
          this._ratios = _ratios;
          this._eventGroups = _eventGroups;
          this._wrapMode = _wrapMode;
        }
        setWrapMode(wrapMode) {
          this._wrapMode = wrapMode;
        }
        ignore(ratio, direction) {
          this._ignoreIndex = InvalidIndex;
          this._sampled = false;
          let frameIndex = getEventGroupIndexAtRatio(ratio, this._ratios);

          // only ignore when time not on a frame index
          if (frameIndex < 0) {
            frameIndex = ~frameIndex - 1;

            // if direction is inverse, then increase index
            if (direction < 0) {
              frameIndex += 1;
            }
            this._ignoreIndex = frameIndex;
          }
        }
        reset() {
          this._lastFrameIndex = -1;
          this._lastIterations = 0.0;
          this._lastDirection = 0;
          this._ignoreIndex = InvalidIndex;
          this._sampled = false;
        }
        sample(ratio, direction, iterations) {
          if (this._eventGroups.length === 0) {
            return;
          }
          const length = this._eventGroups.length;
          let eventIndex = getEventGroupIndexAtRatio(ratio, this._ratios);
          if (eventIndex < 0) {
            eventIndex = ~eventIndex - 1;
            // If direction is inverse, increase index.
            if (direction < 0) {
              eventIndex += 1;
            }
          }
          if (this._ignoreIndex !== eventIndex) {
            this._ignoreIndex = InvalidIndex;
          }
          if (!this._sampled) {
            this._sampled = true;
            this._doFire(eventIndex, false);
            this._lastFrameIndex = eventIndex;
            this._lastIterations = iterations;
            this._lastDirection = direction;
            return;
          }
          const wrapMode = this._wrapMode;
          const currentIterations = wrapIterations(iterations);
          let lastIterations = wrapIterations(this._lastIterations);
          let lastIndex = this._lastFrameIndex;
          const lastDirection = this._lastDirection;
          const iterationsChanged = lastIterations !== -1 && currentIterations !== lastIterations;
          if (lastIndex === eventIndex && iterationsChanged && length === 1) {
            this._doFire(0, false);
          } else if (lastIndex !== eventIndex || iterationsChanged) {
            direction = lastDirection;
            do {
              if (lastIndex !== eventIndex) {
                if (direction === -1 && lastIndex === 0 && eventIndex > 0) {
                  if ((wrapMode & geometry.WrapModeMask.PingPong) === geometry.WrapModeMask.PingPong) {
                    direction *= -1;
                  } else {
                    lastIndex = length;
                  }
                  lastIterations++;
                } else if (direction === 1 && lastIndex === length - 1 && eventIndex < length - 1) {
                  if ((wrapMode & geometry.WrapModeMask.PingPong) === geometry.WrapModeMask.PingPong) {
                    direction *= -1;
                  } else {
                    lastIndex = -1;
                  }
                  lastIterations++;
                }
                if (lastIndex === eventIndex) {
                  break;
                }
                if (lastIterations > currentIterations) {
                  break;
                }
              }
              lastIndex += direction;
              this._doFire(lastIndex, true);
            } while (lastIndex !== eventIndex && lastIndex > -1 && lastIndex < length);
          }
          this._lastFrameIndex = eventIndex;
          this._lastIterations = iterations;
          this._lastDirection = direction;
        }
        _doFire(eventIndex, delay) {
          if (delay) {
            getGlobalAnimationManager().pushDelayEvent(this._checkAndFire, this, [eventIndex]);
          } else {
            this._checkAndFire(eventIndex);
          }
        }
        _checkAndFire(eventIndex) {
          if (!this._targetNode || !this._targetNode.isValid) {
            return;
          }
          const {
            _eventGroups: eventGroups
          } = this;
          if (eventIndex < 0 || eventIndex >= eventGroups.length || this._ignoreIndex === eventIndex) {
            return;
          }
          const eventGroup = eventGroups[eventIndex];
          const nEvents = eventGroup.events.length;
          for (let iEvent = 0; iEvent < nEvents; ++iEvent) {
            const event = eventGroup.events[iEvent];
            invokeComponentMethodsEngagedInAnimationEvent(this._targetNode, event.functionName, event.parameters);
          }
        }
      };
    }
  };
});