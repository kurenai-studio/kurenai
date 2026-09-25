System.register("q-bundled:///fs/cocos/physics/bullet/instantiated.js", ["pal/wasm", "../../../../virtual/internal%253Aconstants.js", "../../game/index.js", "../../core/index.js", "../../misc/webassembly-support.js"], function (_export, _context) {
  "use strict";

  var ensureWasmModuleReady, instantiateWasm, BUILD, LOAD_BULLET_MANUALLY, NATIVE_CODE_BUNDLE_MODE, game, debug, error, sys, NativeCodeBundleMode, EBulletType, EBulletTriangleRaycastFlag, EBulletDebugDrawModes, bt, btCache;
  function initWASM(wasmFactory, wasmUrl) {
    return new Promise((resolve, reject) => {
      const errorMessage = err => `[bullet]: bullet wasm lib load failed: ${err}`;
      wasmFactory({
        instantiateWasm(importObject, receiveInstance) {
          // NOTE: the Promise return by instantiateWasm hook can't be caught.
          instantiateWasm(wasmUrl, importObject).then(result => {
            receiveInstance(result.instance, result.module);
          }).catch(err => reject(errorMessage(err)));
        }
      }).then(instance => {
        debug('[bullet]:bullet wasm lib loaded.');
        _export("bt", bt = instance);
        globalThis.Bullet = bt;
      }).then(resolve).catch(err => reject(errorMessage(err)));
    });
  }
  function initASM(asmFactory) {
    if (asmFactory != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return asmFactory().then(instance => {
        debug('[bullet]:bullet asm lib loaded.');
        _export("bt", bt = instance);
      });
    } else {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
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
  function waitForAmmoInstantiation() {
    const errorReport = msg => {
      error(msg);
    };
    return ensureWasmModuleReady().then(() => {
      if (shouldUseWasmModule()) {
        return Promise.all([_context.import('external:emscripten/bullet/bullet.release.wasm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fbullet%252Fbullet.release.wasm.wasm.js")]).then(([{
          default: bulletWasmFactory
        }, {
          default: bulletWasmUrl
        }]) => initWASM(bulletWasmFactory, bulletWasmUrl));
      } else {
        return _context.import('external:emscripten/bullet/bullet.release.asm.js').then(({
          default: bulletAsmFactory
        }) => initASM(bulletAsmFactory));
      }
    }).catch(errorReport);
  }
  _export("waitForAmmoInstantiation", waitForAmmoInstantiation);
  return {
    setters: [function (_palWasm) {
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
      instantiateWasm = _palWasm.instantiateWasm;
    }, function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      LOAD_BULLET_MANUALLY = _virtualInternal253AconstantsJs.LOAD_BULLET_MANUALLY;
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_coreIndexJs) {
      debug = _coreIndexJs.debug;
      error = _coreIndexJs.error;
      sys = _coreIndexJs.sys;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }],
    execute: function () {
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
      //corresponds to bulletType in bullet-compile
      _export("EBulletType", EBulletType = /*#__PURE__*/function (EBulletType) {
        EBulletType[EBulletType["EBulletTypeVec3"] = 0] = "EBulletTypeVec3";
        EBulletType[EBulletType["EBulletTypeQuat"] = 1] = "EBulletTypeQuat";
        EBulletType[EBulletType["EBulletTypeTransform"] = 2] = "EBulletTypeTransform";
        EBulletType[EBulletType["EBulletTypeMotionState"] = 3] = "EBulletTypeMotionState";
        EBulletType[EBulletType["EBulletTypeCollisionObject"] = 4] = "EBulletTypeCollisionObject";
        EBulletType[EBulletType["EBulletTypeCollisionShape"] = 5] = "EBulletTypeCollisionShape";
        EBulletType[EBulletType["EBulletTypeCharacterController"] = 6] = "EBulletTypeCharacterController";
        EBulletType[EBulletType["EBulletTypeStridingMeshInterface"] = 7] = "EBulletTypeStridingMeshInterface";
        EBulletType[EBulletType["EBulletTypeTriangleMesh"] = 8] = "EBulletTypeTriangleMesh";
        EBulletType[EBulletType["EBulletTypeCollisionDispatcher"] = 9] = "EBulletTypeCollisionDispatcher";
        EBulletType[EBulletType["EBulletTypeDbvtBroadPhase"] = 10] = "EBulletTypeDbvtBroadPhase";
        EBulletType[EBulletType["EBulletTypeSequentialImpulseConstraintSolver"] = 11] = "EBulletTypeSequentialImpulseConstraintSolver";
        EBulletType[EBulletType["EBulletTypeCollisionWorld"] = 12] = "EBulletTypeCollisionWorld";
        EBulletType[EBulletType["EBulletTypeTypedConstraint"] = 13] = "EBulletTypeTypedConstraint";
        EBulletType[EBulletType["EBulletTypeDebugDraw"] = 14] = "EBulletTypeDebugDraw";
        return EBulletType;
      }({})); //corresponds to btTriangleRaycastCallback::EFlags
      _export("EBulletTriangleRaycastFlag", EBulletTriangleRaycastFlag = /*#__PURE__*/function (EBulletTriangleRaycastFlag) {
        EBulletTriangleRaycastFlag[EBulletTriangleRaycastFlag["NONE"] = 0] = "NONE";
        EBulletTriangleRaycastFlag[EBulletTriangleRaycastFlag["FilterBackfaces"] = 1] = "FilterBackfaces";
        EBulletTriangleRaycastFlag[EBulletTriangleRaycastFlag["KeepUnflippedNormal"] = 2] = "KeepUnflippedNormal";
        //Prevents returned face normal getting flipped when a ray hits a back-facing triangle
        EBulletTriangleRaycastFlag[EBulletTriangleRaycastFlag["UseSubSimplexConvexCastRaytest"] = 4] = "UseSubSimplexConvexCastRaytest";
        //default, uses an approximate but faster ray versus convex intersection algorithm
        EBulletTriangleRaycastFlag[EBulletTriangleRaycastFlag["UseGjkConvexCastRaytest"] = 8] = "UseGjkConvexCastRaytest";
        return EBulletTriangleRaycastFlag;
      }({})); //btIDebugDraw::EBulletDebugDrawModes
      _export("EBulletDebugDrawModes", EBulletDebugDrawModes = /*#__PURE__*/function (EBulletDebugDrawModes) {
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_NoDebug"] = 0] = "DBG_NoDebug";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawWireframe"] = 1] = "DBG_DrawWireframe";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawAabb"] = 2] = "DBG_DrawAabb";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawFeaturesText"] = 4] = "DBG_DrawFeaturesText";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawContactPoints"] = 8] = "DBG_DrawContactPoints";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_NoDeactivation"] = 16] = "DBG_NoDeactivation";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_NoHelpText"] = 32] = "DBG_NoHelpText";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawText"] = 64] = "DBG_DrawText";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_ProfileTimings"] = 128] = "DBG_ProfileTimings";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_EnableSatComparison"] = 256] = "DBG_EnableSatComparison";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DisableBulletLCP"] = 512] = "DBG_DisableBulletLCP";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_EnableCCD"] = 1024] = "DBG_EnableCCD";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawConstraints"] = 2048] = "DBG_DrawConstraints";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawConstraintLimits"] = 4096] = "DBG_DrawConstraintLimits";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_FastWireframe"] = 8192] = "DBG_FastWireframe";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawNormals"] = 16384] = "DBG_DrawNormals";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_DrawFrames"] = 32768] = "DBG_DrawFrames";
        EBulletDebugDrawModes[EBulletDebugDrawModes["DBG_MAX_DEBUG_DRAW_MODE"] = 32769] = "DBG_MAX_DEBUG_DRAW_MODE";
        return EBulletDebugDrawModes;
      }({}));
      // eslint-disable-next-line import/no-mutable-exports
      _export("bt", bt = {});
      _export("btCache", btCache = {});
      btCache.BODY_CACHE_NAME = 'body';
      btCache.CCT_CACHE_NAME = 'cct';
      if (!BUILD || !LOAD_BULLET_MANUALLY) {
        game.onPostInfrastructureInitDelegate.add(waitForAmmoInstantiation);
      }
    }
  };
});