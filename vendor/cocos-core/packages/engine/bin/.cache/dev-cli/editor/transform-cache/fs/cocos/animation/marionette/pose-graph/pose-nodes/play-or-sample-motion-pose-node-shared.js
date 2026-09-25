System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/play-or-sample-motion-pose-node-shared.js", ["../../motion/index.js"], function (_export, _context) {
  "use strict";

  var ClipMotion, AnimationBlend, AnimationBlend1D, AnimationBlend2D;
  function getEnterInfo() {
    if (!this.motion || !(this.motion instanceof AnimationBlend)) {
      return undefined;
    }
    return {
      type: 'animation-blend',
      target: this.motion
    };
  }
  function makeCreateNodeFactory(create_) {
    return {
      listEntries: context => [{
        arg: {
          type: 'clip-motion'
        },
        menu: 'i18n:ENGINE.animation_graph.pose_graph_node_sub_menus.play_or_sample_clip_motion'
      }, {
        arg: {
          type: 'animation-blend-1d'
        },
        menu: 'i18n:ENGINE.animation_graph.pose_graph_node_sub_menus.play_or_sample_animation_blend_1d'
      }, {
        arg: {
          type: 'animation-blend-2d'
        },
        menu: 'i18n:ENGINE.animation_graph.pose_graph_node_sub_menus.play_or_sample_animation_blend_2d'
      }],
      create: arg => {
        let motion = null;
        switch (arg.type) {
          case 'clip-motion':
            motion = new ClipMotion();
            break;
          case 'animation-blend-1d':
            motion = new AnimationBlend1D();
            break;
          case 'animation-blend-2d':
            motion = new AnimationBlend2D();
            break;
          default:
            break;
        }
        return create_(motion);
      }
    };
  }
  function getTileBase(titleI18nKey, motion) {
    let motionName = '';
    if (motion instanceof ClipMotion) {
      if (!motion.clip) {
        return undefined;
      } else {
        motionName = motion.clip.name;
      }
    } else {
      motionName = 'Unnamed Animation Blend';
    }
    return [titleI18nKey, {
      motionName
    }];
  }
  _export({
    getEnterInfo: getEnterInfo,
    makeCreateNodeFactory: makeCreateNodeFactory,
    getTileBase: getTileBase
  });
  return {
    setters: [function (_motionIndexJs) {
      ClipMotion = _motionIndexJs.ClipMotion;
      AnimationBlend = _motionIndexJs.AnimationBlend;
      AnimationBlend1D = _motionIndexJs.AnimationBlend1D;
      AnimationBlend2D = _motionIndexJs.AnimationBlend2D;
    }],
    execute: function () {}
  };
});