System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/transform-space.js", ["../../../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccenum, TransformSpace;
  return {
    setters: [function (_coreIndexJs) {
      ccenum = _coreIndexJs.ccenum;
    }],
    execute: function () {
      /**
       * @zh
       * 表示某些姿势图结点在接受变换输入（包括整个变换或者单独的位置旋转）时，
       * 该变换所在的空间。
       * @en
       * Represents the space of input transforms(including whole transform or individual position or rotation)
       * accepted by certain pose graph nodes.
       */
      _export("TransformSpace", TransformSpace = /*#__PURE__*/function (TransformSpace) {
        /**
         * @zh 表示该变换是在世界空间中描述的。
         * @en Indicates the transform is described in world space.
         */
        TransformSpace[TransformSpace["WORLD"] = 0] = "WORLD";
        /**
         * @zh 表示该变换是在动画图所在组件（即动画控制器组件）的所属结点的本地空间中描述的。
         * @en Indicates the transform is described in local space of the node
         * to which the animation graph's belonging component(ie. the animation controller) is attached.
         */
        TransformSpace[TransformSpace["COMPONENT"] = 1] = "COMPONENT";
        /**
         * @zh 表示该变换是在应用到的目标结点的父结点的本地空间中描述的。
         * @en Indicates the transform is described in local space of the applying node(bone).
         */
        TransformSpace[TransformSpace["PARENT"] = 2] = "PARENT";
        /**
         * @zh 表示该变换是在应用到的目标结点的本地空间中描述的。
         * @en Indicates the transform is described in local space of the applying node(bone).
         */
        TransformSpace[TransformSpace["LOCAL"] = 3] = "LOCAL";
        return TransformSpace;
      }({}));
      ccenum(TransformSpace);
    }
  };
});