System.register("q-bundled:///fs/cocos/physics-2d/box2d/instantiate.js", ["../framework/physics-selector.js", "./physics-world.js", "./rigid-body.js", "./shapes/box-shape-2d.js", "./shapes/circle-shape-2d.js", "./shapes/polygon-shape-2d.js", "./joints/mouse-joint.js", "./joints/distance-joint.js", "./joints/spring-joint.js", "./joints/relative-joint.js", "./joints/slider-joint.js", "./joints/fixed-joint.js", "./joints/wheel-joint.js", "./joints/hinge-joint.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var selector, b2PhysicsWorld, b2RigidBody2D, b2BoxShape, b2CircleShape, b2PolygonShape, b2MouseJoint, b2DistanceJoint, b2SpringJoint, b2RelativeJoint, b2SliderJoint, b2FixedJoint, b2WheelJoint, b2HingeJoint, Game, game;
  return {
    setters: [function (_frameworkPhysicsSelectorJs) {
      selector = _frameworkPhysicsSelectorJs.selector;
    }, function (_physicsWorldJs) {
      b2PhysicsWorld = _physicsWorldJs.b2PhysicsWorld;
    }, function (_rigidBodyJs) {
      b2RigidBody2D = _rigidBodyJs.b2RigidBody2D;
    }, function (_shapesBoxShape2dJs) {
      b2BoxShape = _shapesBoxShape2dJs.b2BoxShape;
    }, function (_shapesCircleShape2dJs) {
      b2CircleShape = _shapesCircleShape2dJs.b2CircleShape;
    }, function (_shapesPolygonShape2dJs) {
      b2PolygonShape = _shapesPolygonShape2dJs.b2PolygonShape;
    }, function (_jointsMouseJointJs) {
      b2MouseJoint = _jointsMouseJointJs.b2MouseJoint;
    }, function (_jointsDistanceJointJs) {
      b2DistanceJoint = _jointsDistanceJointJs.b2DistanceJoint;
    }, function (_jointsSpringJointJs) {
      b2SpringJoint = _jointsSpringJointJs.b2SpringJoint;
    }, function (_jointsRelativeJointJs) {
      b2RelativeJoint = _jointsRelativeJointJs.b2RelativeJoint;
    }, function (_jointsSliderJointJs) {
      b2SliderJoint = _jointsSliderJointJs.b2SliderJoint;
    }, function (_jointsFixedJointJs) {
      b2FixedJoint = _jointsFixedJointJs.b2FixedJoint;
    }, function (_jointsWheelJointJs) {
      b2WheelJoint = _jointsWheelJointJs.b2WheelJoint;
    }, function (_jointsHingeJointJs) {
      b2HingeJoint = _jointsHingeJointJs.b2HingeJoint;
    }, function (_gameIndexJs) {
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
    }],
    execute: function () {
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

      game.once(Game.EVENT_PRE_SUBSYSTEM_INIT, () => {
        selector.register('box2d', {
          PhysicsWorld: b2PhysicsWorld,
          RigidBody: b2RigidBody2D,
          BoxShape: b2BoxShape,
          CircleShape: b2CircleShape,
          PolygonShape: b2PolygonShape,
          MouseJoint: b2MouseJoint,
          DistanceJoint: b2DistanceJoint,
          SpringJoint: b2SpringJoint,
          RelativeJoint: b2RelativeJoint,
          SliderJoint: b2SliderJoint,
          FixedJoint: b2FixedJoint,
          WheelJoint: b2WheelJoint,
          HingeJoint: b2HingeJoint
        });
      });
    }
  };
});