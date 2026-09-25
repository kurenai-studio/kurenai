System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/decorator/input.js", ["../../../../core/index.js", "../../../../core/data/class-stash.js", "../../../../core/data/decorators/property.js", "../foundation/authoring/input-authoring.js", "../foundation/type-system.js", "../pose-node.js", "../pure-value-node.js"], function (_export, _context) {
  "use strict";

  var error, js, PropertyStashInternalFlag, getOrCreatePropertyStash, globalPoseGraphNodeInputManager, PoseGraphType, PoseNode, PureValueNode;
  /* eslint-disable @typescript-eslint/ban-types */

  /**
   * @zh
   * 生成一个属性装饰器，将要装饰的属性映射为一或多项姿势图结点输入。
   * @en
   * Generates a property decorator, which maps the decorating property
   * as one or more pose graph node inputs.
   *
   * @param options @zh 结点输入映射选项。 @en Node input mapping  options.
   * @returns @zh 装饰器。 @en The decorator.
   *
   * @note
   *
   * @zh 生成的装饰器对要装饰的属性所属的类有要求：
   * - 如果结点输入选项中指定了输入类型为姿势，则所属类必须是 `PoseNode` 的子类。
   * - 否则，所属类必须是 `PoseNode` 或 `PureValueNode` 的子类。
   * 如果所属类不符合要求，此装饰器无效。
   *
   * 如果要装饰的属性 **不是** 数组属性，则该属性将映射为一项输入；
   * 否则，该属性的每个元素都将映射为一项输入。
   *
   * @en The generated has requirements on the class to which the decorating property belongs:
   * - If the node input option specifies that the input type is pose, then the belonging class should be subclass of `PoseNode`.
   * - Otherwise, the belonging class should be subclass of either `PoseNode` or `PureValueNode`.
   * The decorator takes no effect if the belonging class does not fulfill the requirements.
   *
   * If the decorating property is **NOT** an array, the property will be mapped as an input.
   * Otherwise, each element of the property will be mapped as an input.
   */
  function input(options) {
    return (target, propertyKey) => {
      const targetConstructor = target.constructor;
      if (options.type === PoseGraphType.POSE) {
        if (!js.isChildClassOf(targetConstructor, PoseNode)) {
          error(`@input specifying pose input can be only applied to fields of subclasses of PoseNode.`);
          return;
        }
      }
      if (!js.isChildClassOf(targetConstructor, PoseNode) && !js.isChildClassOf(targetConstructor, PureValueNode)) {
        error(`@input can be only applied to fields of subclasses of PoseNode or PureValueNode.`);
        return;
      }
      inputUnchecked(options)(target, propertyKey);
    };
  }

  /**
   * Unchecked version of `@input()`.
   * @internal
   */
  function inputUnchecked(options) {
    return (target, propertyKey) => {
      if (typeof propertyKey !== 'string') {
        error(`@input can be only applied to string-named fields.`);
        return;
      }
      const targetConstructor = target.constructor;
      globalPoseGraphNodeInputManager.setPropertyNodeInputRecord(targetConstructor, propertyKey, options);
      const propertyStash = getOrCreatePropertyStash(target, propertyKey);
      propertyStash.__internalFlags |= PropertyStashInternalFlag.STANDALONE | PropertyStashInternalFlag.IMPLICIT_VISIBLE;
    };
  }
  _export({
    input: input,
    inputUnchecked: inputUnchecked
  });
  return {
    setters: [function (_coreIndexJs) {
      error = _coreIndexJs.error;
      js = _coreIndexJs.js;
    }, function (_coreDataClassStashJs) {
      PropertyStashInternalFlag = _coreDataClassStashJs.PropertyStashInternalFlag;
    }, function (_coreDataDecoratorsPropertyJs) {
      getOrCreatePropertyStash = _coreDataDecoratorsPropertyJs.getOrCreatePropertyStash;
    }, function (_foundationAuthoringInputAuthoringJs) {
      globalPoseGraphNodeInputManager = _foundationAuthoringInputAuthoringJs.globalPoseGraphNodeInputManager;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
    }, function (_pureValueNodeJs) {
      PureValueNode = _pureValueNodeJs.PureValueNode;
    }],
    execute: function () {}
  };
});