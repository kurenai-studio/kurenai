System.register("q-bundled:///fs/cocos/primitive/torus.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec3;
  function torus(radius = 0.4, tube = 0.1, opts = {}) {
    const radialSegments = opts.radialSegments || 32;
    const tubularSegments = opts.tubularSegments || 32;
    const arc = opts.arc || 2.0 * Math.PI;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const minPos = new Vec3(-radius - tube, -tube, -radius - tube);
    const maxPos = new Vec3(radius + tube, tube, radius + tube);
    const boundingRadius = radius + tube;
    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const v = j / radialSegments;
        const u1 = u * arc;
        const v1 = v * Math.PI * 2;

        // vertex
        const x = (radius + tube * Math.cos(v1)) * Math.sin(u1);
        const y = tube * Math.sin(v1);
        const z = (radius + tube * Math.cos(v1)) * Math.cos(u1);

        // this vector is used to calculate the normal
        const nx = Math.sin(u1) * Math.cos(v1);
        const ny = Math.sin(v1);
        const nz = Math.cos(u1) * Math.cos(v1);
        positions.push(x, y, z);
        normals.push(nx, ny, nz);
        uvs.push(u, v);
        if (i < tubularSegments && j < radialSegments) {
          const seg1 = tubularSegments + 1;
          const a = seg1 * j + i;
          const b = seg1 * (j + 1) + i;
          const c = seg1 * (j + 1) + i + 1;
          const d = seg1 * j + i + 1;
          indices.push(a, d, b);
          indices.push(d, c, b);
        }
      }
    }
    return {
      positions,
      normals,
      uvs,
      indices,
      minPos,
      maxPos,
      boundingRadius
    };
  }
  _export("default", torus);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }],
    execute: function () {}
  };
});