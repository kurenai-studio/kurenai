System.register("q-bundled:///fs/pal/input/input-source.js", ["../../cocos/core/math/index.js"], function (_export, _context) {
  "use strict";

  var Vec2, Vec3, InputSource, InputSourceAxis1D, InputSourceAxis2D, InputSourceAxis3D, InputSourceQuat, CompositeInputSourceAxis1D, CompositeInputSourceAxis2D, CompositeInputSourceAxis3D, InputSourceButton, InputSourceDpad, InputSourceStick, InputSourceOrientation, InputSourcePosition, InputSourceTouch;
  return {
    setters: [function (_cocosCoreMathIndexJs) {
      Vec2 = _cocosCoreMathIndexJs.Vec2;
      Vec3 = _cocosCoreMathIndexJs.Vec3;
    }],
    execute: function () {
      _export("InputSource", InputSource = class InputSource {});
      _export("InputSourceAxis1D", InputSourceAxis1D = class InputSourceAxis1D extends InputSource {
        getValue() {
          throw new Error("Method not implemented.");
        }
      });
      _export("InputSourceAxis2D", InputSourceAxis2D = class InputSourceAxis2D extends InputSource {
        getValue() {
          throw new Error("Method not implemented.");
        }
      });
      _export("InputSourceAxis3D", InputSourceAxis3D = class InputSourceAxis3D extends InputSource {
        getValue() {
          throw new Error("Method not implemented.");
        }
      });
      _export("InputSourceQuat", InputSourceQuat = class InputSourceQuat extends InputSource {
        getValue() {
          throw new Error("Method not implemented.");
        }
      });
      _export("CompositeInputSourceAxis1D", CompositeInputSourceAxis1D = class CompositeInputSourceAxis1D extends InputSourceAxis1D {
        constructor(options) {
          super();
          this.positive = options.positive;
          this.negative = options.negative;
        }
        getValue() {
          const positiveValue = this.positive.getValue();
          const negativeValue = this.negative.getValue();
          if (Math.abs(positiveValue) > Math.abs(negativeValue)) {
            return positiveValue;
          }
          return -negativeValue;
        }
      });
      _export("CompositeInputSourceAxis2D", CompositeInputSourceAxis2D = class CompositeInputSourceAxis2D extends InputSourceAxis2D {
        constructor(options) {
          super();
          this.up = options.up;
          this.down = options.down;
          this.left = options.left;
          this.right = options.right;
          this.xAxis = new CompositeInputSourceAxis1D({
            positive: this.right,
            negative: this.left
          });
          this.yAxis = new CompositeInputSourceAxis1D({
            positive: this.up,
            negative: this.down
          });
        }
        getValue() {
          return new Vec2(this.xAxis.getValue(), this.yAxis.getValue());
        }
      });
      _export("CompositeInputSourceAxis3D", CompositeInputSourceAxis3D = class CompositeInputSourceAxis3D extends InputSourceAxis3D {
        constructor(options) {
          super();
          this.up = options.up;
          this.down = options.down;
          this.left = options.left;
          this.right = options.right;
          this.forward = options.forward;
          this.backward = options.backward;
          this.xAxis = new CompositeInputSourceAxis1D({
            positive: this.right,
            negative: this.left
          });
          this.yAxis = new CompositeInputSourceAxis1D({
            positive: this.up,
            negative: this.down
          });
          this.zAxis = new CompositeInputSourceAxis1D({
            positive: this.forward,
            negative: this.backward
          });
        }
        getValue() {
          return new Vec3(this.xAxis.getValue(), this.yAxis.getValue(), this.zAxis.getValue());
        }
      });
      _export("InputSourceButton", InputSourceButton = class InputSourceButton extends InputSourceAxis1D {
        getValue() {
          return super.getValue();
        }
      });
      _export("InputSourceDpad", InputSourceDpad = class InputSourceDpad extends CompositeInputSourceAxis2D {});
      _export("InputSourceStick", InputSourceStick = class InputSourceStick extends CompositeInputSourceAxis2D {});
      _export("InputSourceOrientation", InputSourceOrientation = class InputSourceOrientation extends InputSourceQuat {
        getValue() {
          return super.getValue();
        }
      });
      _export("InputSourcePosition", InputSourcePosition = class InputSourcePosition extends InputSourceAxis3D {
        getValue() {
          return super.getValue();
        }
      });
      _export("InputSourceTouch", InputSourceTouch = class InputSourceTouch extends InputSourceAxis1D {
        getValue() {
          return super.getValue();
        }
      });
    }
  };
});