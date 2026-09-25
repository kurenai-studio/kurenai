System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/instantiated.js", ["pal/wasm", "../../../../virtual/internal%253Aconstants.js", "../../game/index.js", "../../core/index.js", "../../misc/webassembly-support.js"], function (_export, _context) {
  "use strict";

  var instantiateWasm, ensureWasmModuleReady, BUILD, LOAD_BOX2D_MANUALLY, NATIVE_CODE_BUNDLE_MODE, game, error, sys, debug, NativeCodeBundleMode, B2, B2ObjectType, WASM_OBJECT_PTR_2_TS_OBJECT, WASM_OBJECT_PTR_2_WASM_OBJECT;
  function getImplPtr(wasmObject) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (!wasmObject) return 0;
    return wasmObject.$$.ptr;
  }

  // type : Fixture, Body, Contact, Joint, ...

  function addImplPtrReference(Type, TSObject, implPtr) {
    if (implPtr) {
      let map = WASM_OBJECT_PTR_2_TS_OBJECT.get(Type);
      if (!map) {
        map = new Map();
        WASM_OBJECT_PTR_2_TS_OBJECT.set(Type, map);
      }
      map.set(implPtr, TSObject);
    }
  }
  function removeImplPtrReference(Type, implPtr) {
    if (implPtr) {
      const map = WASM_OBJECT_PTR_2_TS_OBJECT.get(Type);
      if (map && map.has(implPtr)) {
        map.delete(implPtr);
        if (map.size === 0) {
          WASM_OBJECT_PTR_2_TS_OBJECT.delete(Type);
        }
      }
    }
  }
  function getTSObjectFromWASMObjectPtr(Type, implPtr) {
    const map = WASM_OBJECT_PTR_2_TS_OBJECT.get(Type);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return map == null ? void 0 : map.get(implPtr);
  }

  /**
  * mapping wasm-object-ptr to wasm-object
  *  B2.Fixture pointer -->B2.Fixture
  *  B2.Body pointer --> B2.Body
  *  B2.Contact pointer --> B2.Contact
  *  B2.Joint pointer --> B2.Joint
  *  ...
  */
  //todo: combine WASM_OBJECT_PTR_2_TS_OBJECT and WASM_OBJECT_PTR_2_WASM_OBJECT

  function addImplPtrReferenceWASM(Type, WASMObject, implPtr) {
    if (implPtr) {
      let map = WASM_OBJECT_PTR_2_WASM_OBJECT.get(Type);
      if (!map) {
        map = new Map();
        WASM_OBJECT_PTR_2_WASM_OBJECT.set(Type, map);
      }
      map.set(implPtr, WASMObject);
    }
  }
  function removeImplPtrReferenceWASM(Type, implPtr) {
    if (implPtr) {
      const map = WASM_OBJECT_PTR_2_WASM_OBJECT.get(Type);
      if (map && map.has(implPtr)) {
        map.delete(implPtr);
        if (map.size === 0) {
          WASM_OBJECT_PTR_2_WASM_OBJECT.delete(Type);
        }
      }
    }
  }
  function getWASMObjectFromWASMObjectPtr(Type, implPtr) {
    const map = WASM_OBJECT_PTR_2_WASM_OBJECT.get(Type);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return map == null ? void 0 : map.get(implPtr);
  }

  /**
  * ts implementation of c++ b2Mul
  */
  function b2Mul(T, v, out) {
    out.x = T.q.c * v.x - T.q.s * v.y + T.p.x;
    out.y = T.q.s * v.x + T.q.c * v.y + T.p.y;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  function initWasm(wasmFactory, wasmUrl) {
    return new Promise((resolve, reject) => {
      const errorMessage = err => `[box2d]: box2d wasm lib load failed: ${err}`;
      wasmFactory({
        instantiateWasm(importObject, receiveInstance) {
          // NOTE: the Promise return by instantiateWasm hook can't be caught.
          instantiateWasm(wasmUrl, importObject).then(result => {
            receiveInstance(result.instance, result.module);
          }).catch(err => reject(errorMessage(err)));
        }
      }).then(Instance => {
        debug('[box2d]:box2d wasm lib loaded.');
        _export("B2", B2 = Instance);
      }).then(resolve).catch(err => reject(errorMessage(err)));
    });
  }
  function initAsm(asmFactory) {
    return new Promise((resolve, reject) => {
      const errorMessage = err => `[box2d]: box2d asm lib load failed: ${err}`;
      asmFactory().then(instance => {
        debug('[box2d]:box2d asm lib loaded.');
        _export("B2", B2 = instance);
      }).then(resolve).catch(err => reject(errorMessage(err)));
    });
  }
  function shouldUseWasmModule() {
    if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.BOTH) {
      return sys.hasFeature(sys.Feature.WASM);
    } else if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.WASM) {
      return true;
    } else {
      return false;
    }
  }
  function waitForBox2dWasmInstantiation() {
    const errorReport = msg => {
      error(msg);
    };
    return ensureWasmModuleReady().then(() => {
      if (shouldUseWasmModule()) {
        return Promise.all([_context.import('external:emscripten/box2d/box2d.release.wasm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fbox2d%252Fbox2d.release.wasm.wasm.js")]).then(([{
          default: wasmFactory
        }, {
          default: wasmUrl
        }]) => initWasm(wasmFactory, wasmUrl));
      } else {
        return _context.import('external:emscripten/box2d/box2d.release.asm.js').then(({
          default: asmFactory
        }) => initAsm(asmFactory));
      }
    }).catch(errorReport);
  }
  _export({
    getImplPtr: getImplPtr,
    addImplPtrReference: addImplPtrReference,
    removeImplPtrReference: removeImplPtrReference,
    getTSObjectFromWASMObjectPtr: getTSObjectFromWASMObjectPtr,
    addImplPtrReferenceWASM: addImplPtrReferenceWASM,
    removeImplPtrReferenceWASM: removeImplPtrReferenceWASM,
    getWASMObjectFromWASMObjectPtr: getWASMObjectFromWASMObjectPtr,
    b2Mul: b2Mul,
    waitForBox2dWasmInstantiation: waitForBox2dWasmInstantiation
  });
  return {
    setters: [function (_palWasm) {
      instantiateWasm = _palWasm.instantiateWasm;
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
    }, function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      LOAD_BOX2D_MANUALLY = _virtualInternal253AconstantsJs.LOAD_BOX2D_MANUALLY;
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
      sys = _coreIndexJs.sys;
      debug = _coreIndexJs.debug;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
      // eslint-disable-next-line import/no-mutable-exports
      _export("B2", B2 = {});
      _export("B2ObjectType", B2ObjectType = {
        Fixture: 0,
        Body: 1,
        Contact: 2,
        Joint: 3
      });
      /**
      * mapping wasm-object-ptr to ts-object
      *  B2.Fixture pointer -->B2Shape2D
      *  B2.Body pointer --> B2RigidBody2D
      *  B2.Contact pointer --> PhysicsContact
      *  B2.Joint pointer --> B2Joint
      *  ...
      */
      //todo: combine WASM_OBJECT_PTR_2_TS_OBJECT and WASM_OBJECT_PTR_2_WASM_OBJECT
      WASM_OBJECT_PTR_2_TS_OBJECT = new Map();
      WASM_OBJECT_PTR_2_WASM_OBJECT = new Map();
      if (!BUILD || !LOAD_BOX2D_MANUALLY) {
        game.onPostInfrastructureInitDelegate.add(waitForBox2dWasmInstantiation);
      }
    }
  };
});