System.register("q-bundled:///fs/cocos/physics/cocos/instantiate.js", ["../framework/physics-selector.js", "./builtin-world.js", "./builtin-rigid-body.js", "./shapes/builtin-box-shape.js", "./shapes/builtin-sphere-shape.js", "./shapes/builtin-capsule-shape.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var selector, BuiltInWorld, BuiltinRigidBody, BuiltinBoxShape, BuiltinSphereShape, BuiltinCapsuleShape, Game, game;
  return {
    setters: [function (_frameworkPhysicsSelectorJs) {
      selector = _frameworkPhysicsSelectorJs.selector;
    }, function (_builtinWorldJs) {
      BuiltInWorld = _builtinWorldJs.BuiltInWorld;
    }, function (_builtinRigidBodyJs) {
      BuiltinRigidBody = _builtinRigidBodyJs.BuiltinRigidBody;
    }, function (_shapesBuiltinBoxShapeJs) {
      BuiltinBoxShape = _shapesBuiltinBoxShapeJs.BuiltinBoxShape;
    }, function (_shapesBuiltinSphereShapeJs) {
      BuiltinSphereShape = _shapesBuiltinSphereShapeJs.BuiltinSphereShape;
    }, function (_shapesBuiltinCapsuleShapeJs) {
      BuiltinCapsuleShape = _shapesBuiltinCapsuleShapeJs.BuiltinCapsuleShape;
    }, function (_gameIndexJs) {
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
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

      game.once(Game.EVENT_PRE_SUBSYSTEM_INIT, () => {
        selector.register('builtin', {
          RigidBody: BuiltinRigidBody,
          BoxShape: BuiltinBoxShape,
          SphereShape: BuiltinSphereShape,
          PhysicsWorld: BuiltInWorld,
          CapsuleShape: BuiltinCapsuleShape
        });
      });
    }
  };
});