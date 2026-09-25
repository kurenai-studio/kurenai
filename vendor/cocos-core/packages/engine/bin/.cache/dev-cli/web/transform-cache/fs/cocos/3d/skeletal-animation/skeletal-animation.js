System.register("q-bundled:///fs/cocos/3d/skeletal-animation/skeletal-animation.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../skinned-mesh-renderer/index.js", "../../core/index.js", "../../scene-graph/node.js", "../../animation/animation-component.js", "./skeletal-animation-data-hub.js", "./skeletal-animation-state.js", "../../animation/transform-utils.js", "../../animation/global-animation-manager.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, executionOrder, help, menu, type, serializable, editable, EDITOR_NOT_IN_PREVIEW, SkinnedMeshRenderer, Mat4, cclegacy, js, assertIsTrue, warn, Node, Animation, SkelAnimDataHub, SkeletalAnimationState, getWorldTransformUntilRoot, getGlobalAnimationManager, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class3, _class4, _descriptor3, _descriptor4, _SkeletalAnimation, FORCE_BAN_BAKED_ANIMATION, Socket, m4_1, m4_2, SkeletalAnimation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function collectRecursively(node, prefix = '', out = []) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) {
        continue;
      }
      const path = prefix ? `${prefix}/${child.name}` : child.name;
      out.push(path);
      collectRecursively(child, path, out);
    }
    return out;
  }

  /**
   * @en
   * Skeletal animation component, offers the following features on top of [[Animation]]:
   * * Choice between baked animation and real-time calculation, to leverage efficiency and expressiveness.
   * * Joint socket system: Create any socket node directly under the animation component root node,
   *   find your target joint and register both to the socket list, so that the socket node would be in-sync with the joint.
   * @zh
   * 骨骼动画组件，在普通动画组件基础上额外提供以下功能：
   * * 可选预烘焙动画模式或实时计算模式，用以权衡运行时效率与效果；
   * * 提供骨骼挂点功能：通过在动画根节点下创建挂点节点，并在骨骼动画组件上配置 socket 列表，挂点节点的 Transform 就能与骨骼保持同步。
   */
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
    }, function (_skinnedMeshRendererIndexJs) {
      SkinnedMeshRenderer = _skinnedMeshRendererIndexJs.SkinnedMeshRenderer;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      warn = _coreIndexJs.warn;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_animationAnimationComponentJs) {
      Animation = _animationAnimationComponentJs.Animation;
    }, function (_skeletalAnimationDataHubJs) {
      SkelAnimDataHub = _skeletalAnimationDataHubJs.SkelAnimDataHub;
    }, function (_skeletalAnimationStateJs) {
      SkeletalAnimationState = _skeletalAnimationStateJs.SkeletalAnimationState;
    }, function (_animationTransformUtilsJs) {
      getWorldTransformUntilRoot = _animationTransformUtilsJs.getWorldTransformUntilRoot;
    }, function (_animationGlobalAnimationManagerJs) {
      getGlobalAnimationManager = _animationGlobalAnimationManagerJs.getGlobalAnimationManager;
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
      FORCE_BAN_BAKED_ANIMATION = EDITOR_NOT_IN_PREVIEW;
      /**
       * @en The socket to synchronize transform from skeletal joint to target node.
       * @zh 骨骼动画的挂点，用于将骨骼树的挂点节点变化矩阵同步到目标节点上
       */
      _export("Socket", Socket = (_dec = ccclass('cc.SkeletalAnimation.Socket'), _dec2 = type(Node), _dec(_class = (_class2 = class Socket {
        constructor(path = '', target = null) {
          /**
           * @en Path of the target joint.
           * @zh 此挂点的目标骨骼路径。
           */
          _initializerDefineProperty(this, "path", _descriptor, this);
          /**
           * @en Transform output node.
           * @zh 此挂点的变换信息输出节点。
           */
          _initializerDefineProperty(this, "target", _descriptor2, this);
          this.path = path;
          this.target = target;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "target", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      js.setClassAlias(Socket, 'cc.SkeletalAnimationComponent.Socket');
      m4_1 = new Mat4();
      m4_2 = new Mat4();
      _export("SkeletalAnimation", SkeletalAnimation = (_dec3 = ccclass('cc.SkeletalAnimation'), _dec4 = help('i18n:cc.SkeletalAnimation'), _dec5 = executionOrder(99), _dec6 = menu('Animation/SkeletalAnimation'), _dec7 = type([Socket]), _dec8 = type([Socket]), _dec3(_class3 = _dec4(_class3 = _dec5(_class3 = executeInEditMode(_class3 = _dec6(_class3 = (_class4 = (_SkeletalAnimation = class SkeletalAnimation extends Animation {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_useBakedAnimation", _descriptor3, this);
          _initializerDefineProperty(this, "_sockets", _descriptor4, this);
          this._users = new Set();
          this._currentBakedState = null;
        }
        /**
         * @en
         * The joint sockets this animation component maintains.<br>
         * Sockets have to be registered here before attaching custom nodes to animated joints.
         * @zh
         * 当前动画组件维护的挂点数组。要挂载自定义节点到受动画驱动的骨骼上，必须先在此注册挂点。
         */
        get sockets() {
          return this._sockets;
        }
        set sockets(val) {
          if (!this._useBakedEffectively) {
            const animMgr = getGlobalAnimationManager();
            animMgr.removeSockets(this.node, this._sockets);
            animMgr.addSockets(this.node, val);
          }
          this._sockets = val;
          this.rebuildSocketAnimations();
        }

        /**
         * @en
         * Whether to bake animations. Default to true,<br>
         * which substantially increases performance while making all animations completely fixed.<br>
         * Dynamically changing this property will take effect when playing the next animation clip.
         * Note, in editor(not in preview) mode, this option takes no effect: animation is always non-baked.
         * @zh
         * 是否使用预烘焙动画，默认启用，可以大幅提高运行效时率，但所有动画效果会被彻底固定，不支持任何形式的编辑和混合。<br>
         * 运行时动态修改此选项会在播放下一条动画片段时生效。
         * 注意，在编辑器（非预览）模式下，此选项不起作用：动画总是非预烘焙的。
         */
        get useBakedAnimation() {
          return this._useBakedAnimation;
        }
        set useBakedAnimation(value) {
          this._useBakedAnimation = value;
          this._applyBakeFlagChange();
        }
        onLoad() {
          super.onLoad();
          // Actively search for potential users and notify them that an animation is usable.
          const comps = this.node.getComponentsInChildren(SkinnedMeshRenderer);
          for (let i = 0; i < comps.length; ++i) {
            const comp = comps[i];
            if (comp.skinningRoot === this.node) {
              this.notifySkinnedMeshAdded(comp);
            }
          }
        }
        onDestroy() {
          super.onDestroy();
          cclegacy.director.root.dataPoolManager.jointAnimationInfo.destroy(this.node.uuid);
          getGlobalAnimationManager().removeSockets(this.node, this._sockets);
          this._removeAllUsers();
        }
        onEnable() {
          var _this$_currentBakedSt;
          super.onEnable();
          (_this$_currentBakedSt = this._currentBakedState) == null || _this$_currentBakedSt.resume();
        }
        onDisable() {
          var _this$_currentBakedSt2;
          super.onDisable();
          (_this$_currentBakedSt2 = this._currentBakedState) == null || _this$_currentBakedSt2.pause();
        }
        start() {
          this.sockets = this._sockets;
          this._applyBakeFlagChange();
          super.start();
        }
        pause() {
          if (!this._useBakedEffectively) {
            super.pause();
          } else {
            var _this$_currentBakedSt3;
            (_this$_currentBakedSt3 = this._currentBakedState) == null || _this$_currentBakedSt3.pause();
          }
        }
        resume() {
          if (!this._useBakedEffectively) {
            super.resume();
          } else {
            var _this$_currentBakedSt4;
            (_this$_currentBakedSt4 = this._currentBakedState) == null || _this$_currentBakedSt4.resume();
          }
        }
        stop() {
          if (!this._useBakedEffectively) {
            super.stop();
          } else if (this._currentBakedState) {
            this._currentBakedState.stop();
            this._currentBakedState = null;
          }
        }

        /**
         * @en Query all socket paths
         * @zh 获取所有挂点的骨骼路径
         * @returns @en All socket paths @zh 所有挂点的骨骼路径
         */
        querySockets() {
          const animPaths = this._defaultClip && Object.keys(SkelAnimDataHub.getOrExtract(this._defaultClip).joints).sort().reduce((acc, cur) => cur.startsWith(`${acc[acc.length - 1]}/`) ? acc : (acc.push(cur), acc), []) || [];
          if (!animPaths.length) {
            return ['please specify a valid default animation clip first'];
          }
          const out = [];
          for (let i = 0; i < animPaths.length; i++) {
            const path = animPaths[i];
            const node = this.node.getChildByPath(path);
            if (!node) {
              continue;
            }
            out.push(path);
            collectRecursively(node, path, out);
          }
          return out;
        }

        /**
         * @en Rebuild animations to synchronize immediately all sockets to their target node.
         * @zh 重建动画并立即同步所有挂点的转换矩阵到它们的目标节点上。
         */
        rebuildSocketAnimations() {
          this._sockets.forEach(socket => {
            const joint = this.node.getChildByPath(socket.path);
            const {
              target
            } = socket;
            if (joint && target) {
              target.name = `${socket.path.substring(socket.path.lastIndexOf('/') + 1)} Socket`;
              target.parent = this.node;
              getWorldTransformUntilRoot(joint, this.node, m4_1);
              Mat4.fromRTS(m4_2, target.rotation, target.position, target.scale);
              if (!Mat4.equals(m4_2, m4_1)) {
                target.matrix = m4_1;
              }
            }
          });
          for (const stateName in this._nameToState) {
            const state = this._nameToState[stateName];
            state.rebuildSocketCurves(this._sockets);
          }
        }

        /**
         * @en Create or get the target node from a socket.
         * If a socket haven't been created for the corresponding path, this function will register a new socket.
         * @zh 创建或获取一个挂点的同步目标节点。
         * 如果对应路径还没有创建挂点，这个函数会创建一个新的挂点。
         * @param path @en Path of the target joint. @zh 此挂点的骨骼路径。
         * @returns @en The target node of the socket. @zh 挂点的目标节点
         */
        createSocket(path) {
          const socket = this._sockets.find(s => s.path === path);
          if (socket) {
            return socket.target;
          }
          const joint = this.node.getChildByPath(path);
          if (!joint) {
            warn('illegal socket path');
            return null;
          }
          const target = new Node();
          target.parent = this.node;
          this._sockets.push(new Socket(path, target));
          this.rebuildSocketAnimations();
          return target;
        }

        /**
         * @internal This method only friends to skinned mesh renderer.
         */
        notifySkinnedMeshAdded(skinnedMeshRenderer) {
          const {
            _useBakedEffectively
          } = this;
          const formerBound = skinnedMeshRenderer.associatedAnimation;
          if (formerBound) {
            formerBound._users.delete(skinnedMeshRenderer);
          }
          skinnedMeshRenderer.associatedAnimation = this;
          skinnedMeshRenderer.setUseBakedAnimation(_useBakedEffectively, true);
          if (_useBakedEffectively) {
            const {
              _currentBakedState: playingState
            } = this;
            if (playingState) {
              skinnedMeshRenderer.uploadAnimation(playingState.clip);
            }
          }
          this._users.add(skinnedMeshRenderer);
        }

        /**
         * @internal This method only friends to skinned mesh renderer.
         */
        notifySkinnedMeshRemoved(skinnedMeshRenderer) {
          assertIsTrue(skinnedMeshRenderer.associatedAnimation === this || skinnedMeshRenderer.associatedAnimation === null);
          skinnedMeshRenderer.setUseBakedAnimation(false);
          skinnedMeshRenderer.associatedAnimation = null;
          this._users.delete(skinnedMeshRenderer);
        }

        /**
         * Get all users.
         * @internal This method only friends to the skeleton animation state.
         */
        getUsers() {
          return this._users;
        }
        _createState(clip, name) {
          return new SkeletalAnimationState(clip, name);
        }
        _doCreateState(clip, name) {
          const state = super._doCreateState(clip, name);
          state.rebuildSocketCurves(this._sockets);
          return state;
        }
        doPlayOrCrossFade(state, duration) {
          if (this._useBakedEffectively) {
            if (this._currentBakedState) {
              this._currentBakedState.stop();
            }
            const skeletalAnimationState = state;
            this._currentBakedState = skeletalAnimationState;
            skeletalAnimationState.play();
          } else {
            super.doPlayOrCrossFade(state, duration);
          }
        }
        _removeAllUsers() {
          Array.from(this._users).forEach(user => {
            this.notifySkinnedMeshRemoved(user);
          });
        }
        get _useBakedEffectively() {
          if (FORCE_BAN_BAKED_ANIMATION) {
            return false;
          } else {
            return this._useBakedAnimation;
          }
        }
        _applyBakeFlagChange() {
          const useBakedEffectively = this._useBakedEffectively;
          for (const stateName in this._nameToState) {
            const state = this._nameToState[stateName];
            state.setUseBaked(useBakedEffectively);
          }
          this._users.forEach(user => {
            user.setUseBakedAnimation(useBakedEffectively);
          });
          if (useBakedEffectively) {
            getGlobalAnimationManager().removeSockets(this.node, this._sockets);
          } else {
            getGlobalAnimationManager().addSockets(this.node, this._sockets);
            this._currentBakedState = null;
          }
          this._setSkeletonTransformEnabled(!useBakedEffectively);
        }
        _setSkeletonTransformEnabled(enabled) {
          this.node.children.forEach(child => {
            if (!this._sockets.find(socket => socket.target === child)) {
              child.isSkipTransformUpdate = !enabled;
            }
          });
        }
      }, _SkeletalAnimation.Socket = Socket, _SkeletalAnimation), _applyDecoratedDescriptor(_class4.prototype, "sockets", [_dec7, editable], Object.getOwnPropertyDescriptor(_class4.prototype, "sockets"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "useBakedAnimation", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "useBakedAnimation"), _class4.prototype), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_useBakedAnimation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_sockets", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class4)) || _class3) || _class3) || _class3) || _class3) || _class3));
    }
  };
});