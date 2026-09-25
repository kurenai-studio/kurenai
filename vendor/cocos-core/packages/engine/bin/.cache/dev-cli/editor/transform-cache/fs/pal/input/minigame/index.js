System.register("q-bundled:///fs/pal/input/minigame/index.js", ["./accelerometer-input.js", "./gamepad-input.js", "./handle-input.js", "./hmd-input.js", "./handheld-input.js", "./keyboard-input.js", "./mouse-input.js", "./touch-input.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_accelerometerInputJs) {
      _export("AccelerometerInputSource", _accelerometerInputJs.AccelerometerInputSource);
    }, function (_gamepadInputJs) {
      _export("GamepadInputDevice", _gamepadInputJs.GamepadInputDevice);
    }, function (_handleInputJs) {
      _export("HandleInputDevice", _handleInputJs.HandleInputDevice);
    }, function (_hmdInputJs) {
      _export("HMDInputDevice", _hmdInputJs.HMDInputDevice);
    }, function (_handheldInputJs) {
      _export("HandheldInputDevice", _handheldInputJs.HandheldInputDevice);
    }, function (_keyboardInputJs) {
      _export("KeyboardInputSource", _keyboardInputJs.KeyboardInputSource);
    }, function (_mouseInputJs) {
      _export("MouseInputSource", _mouseInputJs.MouseInputSource);
    }, function (_touchInputJs) {
      _export("TouchInputSource", _touchInputJs.TouchInputSource);
    }],
    execute: function () {}
  };
});