System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/use-stashed-pose.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/data/decorators/index.js", "../../../define.js", "../decorator/node.js", "./menu-common.js", "../pose-node.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, editable, serializable, CLASS_NAME_PREFIX_ANIM, poseGraphCreateNodeFactory, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE, PoseNode, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, createNodeFactory, PoseNodeUseStashedPose;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_decoratorNodeJs) {
      poseGraphCreateNodeFactory = _decoratorNodeJs.poseGraphCreateNodeFactory;
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
    }],
    execute: function () {
      createNodeFactory = {
        // eslint-disable-next-line arrow-body-style
        listEntries: context => {
          // eslint-disable-next-line arrow-body-style
          return [...context.animationGraph.layers[context.layerIndex].stashes()].map(([stashId]) => {
            return {
              arg: stashId,
              menu: stashId
            };
          });
        },
        create: arg => {
          const node = new PoseNodeUseStashedPose();
          node.stashName = arg;
          return node;
        }
      };
      _export("PoseNodeUseStashedPose", PoseNodeUseStashedPose = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeUseStashedPose`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE), _dec3 = poseGraphCreateNodeFactory(createNodeFactory), _dec4 = poseGraphNodeAppearance({
        inline: true
      }), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = class PoseNodeUseStashedPose extends PoseNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "stashName", _descriptor, this);
          this._runtimeStash = undefined;
        }
        bind(context) {
          const {
            stashName
          } = this;

          // If stashName is empty, silently ignore.
          if (!stashName) {
            return;
          }
          const runtimeStash = context.stashView.bindStash(stashName);
          this._runtimeStash = runtimeStash;
        }
        settle(context) {}
        reenter() {
          var _this$_runtimeStash;
          (_this$_runtimeStash = this._runtimeStash) == null || _this$_runtimeStash.reenter();
        }
        doUpdate(context) {
          var _this$_runtimeStash2;
          (_this$_runtimeStash2 = this._runtimeStash) == null || _this$_runtimeStash2.requestUpdate(context);
        }
        doEvaluate(context) {
          var _this$_runtimeStash$e, _this$_runtimeStash3;
          return (_this$_runtimeStash$e = (_this$_runtimeStash3 = this._runtimeStash) == null ? void 0 : _this$_runtimeStash3.evaluate(context)) != null ? _this$_runtimeStash$e : context.pushDefaultedPose();
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "stashName", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class) || _class) || _class) || _class));
      if (EDITOR) {
        PoseNodeUseStashedPose.prototype.getTitle = function getTitle() {
          if (this.stashName) {
            return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PoseNodeUseStashedPose.title`, {
              stashName: this.stashName
            }];
          }
          return undefined;
        };
        PoseNodeUseStashedPose.prototype.getEnterInfo = function getTitle() {
          return {
            type: 'stash',
            stashName: this.stashName
          };
        };
      }
    }
  };
});