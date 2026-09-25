System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/ik/two-bone-ik-debugger.js", ["../../../../../3d/index.js", "../../../../../3d/misc/index.js", "../../../../../asset/assets/index.js", "../../../../../core/index.js", "../../../../../core/global-exports.js", "../../../../../gfx/index.js", "../../../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var MeshRenderer, createMesh, Material, Color, legacyCC, PrimitiveMode, Node, TwoBoneIKDebugger, debuggerMap;
  function debugTwoBoneIKDraw(key, a, b, c) {
    if (typeof key !== 'object' || !key) {
      return;
    }
    let ikDebugger = debuggerMap.get(key);
    if (!ikDebugger) {
      ikDebugger = new TwoBoneIKDebugger();
      debuggerMap.set(key, ikDebugger);
    }
    ikDebugger.draw(a, b, c);
  }
  _export({
    TwoBoneIKDebugger: void 0,
    debugTwoBoneIKDraw: debugTwoBoneIKDraw
  });
  return {
    setters: [function (_dIndexJs) {
      MeshRenderer = _dIndexJs.MeshRenderer;
    }, function (_dMiscIndexJs) {
      createMesh = _dMiscIndexJs.createMesh;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_gfxIndexJs) {
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }],
    execute: function () {
      _export("TwoBoneIKDebugger", TwoBoneIKDebugger = class TwoBoneIKDebugger {
        constructor() {
          this._node = void 0;
          this._meshRenderer = void 0;
          const node = new Node();
          legacyCC.director.getScene().addChild(node);
          const meshRenderer = node.addComponent(MeshRenderer);
          meshRenderer.material = (() => {
            const material = new Material();
            material.reset({
              effectName: 'builtin-unlit',
              states: {
                primitive: PrimitiveMode.LINE_LIST
              },
              defines: {
                USE_VERTEX_COLOR: true
              }
            });
            return material;
          })();
          this._node = node;
          this._meshRenderer = meshRenderer;
        }
        draw(a, b, c) {
          const color1 = Color.RED;
          const color2 = Color.BLUE;
          const positions = [a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y, b.z, c.x, c.y, c.z];
          const colors = [color1.x, color1.y, color1.z, color1.w, color1.x, color1.y, color1.z, color1.w, color2.x, color2.y, color2.z, color2.w, color2.x, color2.y, color2.z, color2.w];
          const mesh = createMesh({
            positions,
            colors,
            primitiveMode: PrimitiveMode.LINE_LIST
          });
          this._meshRenderer.mesh = mesh;
        }
      }); // eslint-disable-next-line @typescript-eslint/ban-types
      debuggerMap = new WeakMap();
    }
  };
});