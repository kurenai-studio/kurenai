System.register("q-bundled:///fs/cocos/rendering/custom/utils.js", ["../../gfx/index.js"], function (_export, _context) {
  "use strict";

  var Type, ObjectPool;
  /*
   Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
  
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

  // https://stackoverflow.com/questions/56714318/how-to-disable-multiple-rules-for-eslint-nextline?msclkid=5d4c2298ba7911eca34d0ab30591752e

  function isUICamera(camera) {
    const scene = camera.scene;
    const batches = scene.batches;
    for (let i = 0; batches && i < batches.length; i++) {
      const batch = batches[i];
      if (camera.visibility & batch.visFlags) {
        return true;
      }
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function replacer(key, value) {
    if (value instanceof Map) {
      return {
        meta_t: 'Map',
        value: Array.from(value.entries()).sort((a, b) => String(a[0]).localeCompare(b[0]))
      };
    } else if (value instanceof Set) {
      return {
        meta_t: 'Set',
        value: Array.from(value).sort()
      };
    }
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (value.meta_t === 'Map') {
        return new Map(value.value);
      } else if (value.meta_t === 'Set') {
        return new Set(value.value);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  }
  function stringify(data, space) {
    return JSON.stringify(data, replacer, space);
  }
  function parse(text) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(text, reviver);
  }
  function getUBOTypeCount(type) {
    switch (type) {
      case Type.BOOL:
      case Type.INT:
      case Type.UINT:
      case Type.FLOAT:
        return 1;
      case Type.INT2:
      case Type.FLOAT2:
      case Type.UINT2:
      case Type.BOOL2:
        return 2;
      case Type.FLOAT3:
      case Type.BOOL3:
      case Type.UINT3:
      case Type.INT3:
        return 3;
      case Type.BOOL4:
      case Type.FLOAT4:
      case Type.UINT4:
      case Type.INT4:
        return 4;
      case Type.MAT2:
        return 4;
      case Type.MAT2X3:
      case Type.MAT3X2:
        return 6;
      case Type.MAT2X4:
      case Type.MAT4X2:
        return 8;
      case Type.MAT3:
        return 9;
      case Type.MAT3X4:
      case Type.MAT4X3:
        return 12;
      case Type.MAT4:
        return 16;
      default:
        return 0;
    }
  }
  _export({
    isUICamera: isUICamera,
    replacer: replacer,
    reviver: reviver,
    stringify: stringify,
    parse: parse,
    getUBOTypeCount: getUBOTypeCount,
    ObjectPool: void 0
  });
  return {
    setters: [function (_gfxIndexJs) {
      Type = _gfxIndexJs.Type;
    }],
    execute: function () {
      _export("ObjectPool", ObjectPool = class ObjectPool {
        // Constructor, takes a function to create objects as parameter
        constructor(createFunction) {
          // Array to store objects in the pool
          this.pool = [];
          // Function to create new objects
          this.createFunction = void 0;
          this.createFunction = createFunction;
        }
        // Get object from the pool, either take from the pool if available or create a new one
        acquire(...args) {
          if (this.pool.length > 0) {
            return this.pool.pop();
          }
          return this.createFunction(...args);
        }
        // Put the object back into the pool for later reuse
        release(obj) {
          // Push the object to the end of the pool
          if (!this.pool.includes(obj)) {
            this.pool.push(obj);
          }
        }
        create(...args) {
          return this.createFunction(...args);
        }
      });
    }
  };
});