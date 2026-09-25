System.register("q-bundled:///fs/cocos/spine/lib/instantiated.js", ["../../../../virtual/internal%253Aconstants.js", "../../game/index.js", "./spine-define.js", "./spine-instantiate.js"], function (_export, _context) {
  "use strict";

  var BUILD, JSB, LOAD_SPINE_MANUALLY, game, waitForSpineWasmInstantiation, SPINE_WASM;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      BUILD = _virtualInternal253AconstantsJs.BUILD;
      JSB = _virtualInternal253AconstantsJs.JSB;
      LOAD_SPINE_MANUALLY = _virtualInternal253AconstantsJs.LOAD_SPINE_MANUALLY;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_spineDefineJs) {}, function (_spineInstantiateJs) {
      waitForSpineWasmInstantiation = _spineInstantiateJs.waitForSpineWasmInstantiation;
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

      // Make spine._overrideSpineDefine take effect.

      if (!JSB && (!BUILD || !LOAD_SPINE_MANUALLY)) {
        game.onPostInfrastructureInitDelegate.add(waitForSpineWasmInstantiation);
      }
      _export("waitForSpineWasmInstantiation", waitForSpineWasmInstantiation);
      _export("SPINE_WASM", SPINE_WASM = 1);
    }
  };
});