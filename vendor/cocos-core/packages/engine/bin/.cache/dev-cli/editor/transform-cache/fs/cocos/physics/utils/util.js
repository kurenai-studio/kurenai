System.register("q-bundled:///fs/cocos/physics/utils/util.js", ["../../core/index.js", "../../primitive/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, murmurhash2_32_gc, VEC3_0, TriggerEventObject, CharacterTriggerEventObject, CollisionEventObject;
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

  function setWrap(object, wrapper) {
    object.__cc_wrapper__ = wrapper;
  }
  function getWrap(object) {
    return object.__cc_wrapper__;
  }
  function maxComponent(v) {
    return Math.max(v.x, Math.max(v.y, v.z));
  }
  function shrinkPositions(buffer) {
    const pos = [];
    const posHashMap = {};
    if (buffer.length >= 3) {
      pos[0] = buffer[0];
      pos[1] = buffer[1];
      pos[2] = buffer[2];
      const len = buffer.length;
      for (let i = 3; i < len; i += 3) {
        const p0 = buffer[i];
        const p1 = buffer[i + 1];
        const p2 = buffer[i + 2];
        const str = String(p0) + String(p1) + String(p2);
        //todo: directly use buffer as input
        const hash = murmurhash2_32_gc(str, 666);
        if (posHashMap[hash] !== str) {
          posHashMap[hash] = str;
          pos.push(p0);
          pos.push(p1);
          pos.push(p2);
        }
      }
    }
    return pos;
  }
  function absolute(v) {
    v.x = Math.abs(v.x);
    v.y = Math.abs(v.y);
    v.z = Math.abs(v.z);
    return v;
  }
  _export({
    setWrap: setWrap,
    getWrap: getWrap,
    maxComponent: maxComponent,
    shrinkPositions: shrinkPositions,
    absolute: absolute
  });
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
    }, function (_primitiveIndexJs) {
      _export("cylinder", _primitiveIndexJs.cylinder);
    }],
    execute: function () {
      _export("VEC3_0", VEC3_0 = new Vec3());
      _export("TriggerEventObject", TriggerEventObject = {
        type: 'onTriggerEnter',
        selfCollider: null,
        otherCollider: null,
        impl: null
      });
      _export("CharacterTriggerEventObject", CharacterTriggerEventObject = {
        type: 'onControllerTriggerEnter',
        collider: null,
        characterController: null,
        impl: null
      });
      _export("CollisionEventObject", CollisionEventObject = {
        type: 'onCollisionEnter',
        selfCollider: null,
        otherCollider: null,
        contacts: [],
        impl: null
      });
    }
  };
});