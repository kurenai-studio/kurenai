System.register("q-bundled:///fs/editor/src/marionette/pose-graph/drag/registry.js", ["../../../../../exports/base.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, assetDragHandlerRegistry, handlerIdGenerator;
  /**
   * In pose graph, describes the drag handling info for an asset type.
   */

  /**
   * Query all asset drag handlers.
   */
  function* getPoseGraphAssetDragHandlersMap() {
    for (const [assetType, register] of assetDragHandlerRegistry.entries()) {
      const info = {
        handlers: {}
      };
      for (const [handlerId, handler] of Object.entries(register.handlers)) {
        info.handlers[handlerId] = {
          displayName: handler.displayName
        };
      }
      yield [assetType, info];
    }
  }
  function createPoseNodeOnAssetDrag(asset, handlerId) {
    const assetType = asset.constructor;
    const assetDragRegister = assetDragHandlerRegistry.get(assetType);
    if (!assetDragRegister) {
      console.warn(`There has any no handlers for asset type ${assetType}`);
      return;
    }
    const handler = assetDragRegister.handlers[handlerId];
    if (!handler) {
      console.warn(`Asset type ${assetType} has no handler ${handlerId}, existing handlers are ${Object.keys(assetDragRegister.handlers).join(',')}`);
      return;
    }
    return handler.handle(asset);
  }
  function registerCreatePoseNodeOnAssetDragHandler(assetType, handler) {
    let assetDragHandlerRegister = assetDragHandlerRegistry.get(assetType);
    if (!assetDragHandlerRegister) {
      assetDragHandlerRegister = {
        handlers: {}
      };
      assetDragHandlerRegistry.set(assetType, assetDragHandlerRegister);
    }
    const handlerId = handlerIdGenerator++;
    assertIsTrue(!(handlerId in assetDragHandlerRegister.handlers));
    assetDragHandlerRegister.handlers[handlerId] = handler;
  }
  _export({
    getPoseGraphAssetDragHandlersMap: getPoseGraphAssetDragHandlersMap,
    createPoseNodeOnAssetDrag: createPoseNodeOnAssetDrag,
    registerCreatePoseNodeOnAssetDragHandler: registerCreatePoseNodeOnAssetDragHandler
  });
  return {
    setters: [function (_exportsBaseJs) {
      assertIsTrue = _exportsBaseJs.assertIsTrue;
    }],
    execute: function () {
      assetDragHandlerRegistry = new Map();
      handlerIdGenerator = 1;
    }
  };
});