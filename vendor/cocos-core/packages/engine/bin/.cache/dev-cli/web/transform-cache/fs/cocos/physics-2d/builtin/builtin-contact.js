System.register("q-bundled:///fs/cocos/physics-2d/builtin/builtin-contact.js", ["./intersection-2d.js", "./shapes/box-shape-2d.js", "./shapes/polygon-shape-2d.js", "./shapes/circle-shape-2d.js", "../../core/index.js", "../framework/index.js"], function (_export, _context) {
  "use strict";

  var Intersection2D, BuiltinBoxShape, BuiltinPolygonShape, BuiltinCircleShape, error, Contact2DType, BuiltinContact;
  _export("BuiltinContact", void 0);
  return {
    setters: [function (_intersection2dJs) {
      Intersection2D = _intersection2dJs.default;
    }, function (_shapesBoxShape2dJs) {
      BuiltinBoxShape = _shapesBoxShape2dJs.BuiltinBoxShape;
    }, function (_shapesPolygonShape2dJs) {
      BuiltinPolygonShape = _shapesPolygonShape2dJs.BuiltinPolygonShape;
    }, function (_shapesCircleShape2dJs) {
      BuiltinCircleShape = _shapesCircleShape2dJs.BuiltinCircleShape;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
    }, function (_frameworkIndexJs) {
      Contact2DType = _frameworkIndexJs.Contact2DType;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /** @mangle */
      _export("BuiltinContact", BuiltinContact = class BuiltinContact {
        constructor(shape1, shape2) {
          this.shape1 = void 0;
          this.shape2 = void 0;
          // eslint-disable-next-line @typescript-eslint/ban-types
          this.testFunc = void 0;
          this.touching = false;
          this.type = Contact2DType.None;
          this.shape1 = shape1;
          this.shape2 = shape2;
          this.touching = false;
          const isShape1Polygon = shape1 instanceof BuiltinBoxShape || shape1 instanceof BuiltinPolygonShape;
          const isShape2Polygon = shape2 instanceof BuiltinBoxShape || shape2 instanceof BuiltinPolygonShape;
          const isShape1Circle = shape1 instanceof BuiltinCircleShape;
          const isShape2Circle = shape2 instanceof BuiltinCircleShape;
          if (isShape1Polygon && isShape2Polygon) {
            this.testFunc = Intersection2D.polygonPolygon;
          } else if (isShape1Circle && isShape2Circle) {
            this.testFunc = Intersection2D.circleCircle;
          } else if (isShape1Polygon && isShape2Circle) {
            this.testFunc = Intersection2D.polygonCircle;
          } else if (isShape1Circle && isShape2Polygon) {
            this.testFunc = Intersection2D.polygonCircle;
            this.shape1 = shape2;
            this.shape2 = shape1;
          } else {
            error(`Can not find contact for builtin shape: ${shape1.constructor.name}, ${shape2.constructor.name}`);
          }
        }
        test() {
          const s1 = this.shape1;
          const s2 = this.shape2;
          if (!s1.worldAABB.intersects(s2.worldAABB)) {
            return false;
          }
          if (this.testFunc === Intersection2D.polygonPolygon) {
            return Intersection2D.polygonPolygon(s1.worldPoints, s2.worldPoints);
          } else if (this.testFunc === Intersection2D.circleCircle) {
            return Intersection2D.circleCircle(s1.worldPosition, s1.worldRadius, s2.worldPosition, s2.worldRadius);
          } else if (this.testFunc === Intersection2D.polygonCircle) {
            return Intersection2D.polygonCircle(s1.worldPoints, s2.worldPosition, s2.worldRadius);
          }
          return false;
        }
        updateState() {
          const result = this.test();
          let type = Contact2DType.None;
          if (result && !this.touching) {
            this.touching = true;
            type = Contact2DType.BEGIN_CONTACT;
          } else if (!result && this.touching) {
            this.touching = false;
            type = Contact2DType.END_CONTACT;
          }
          this.type = type;
          return type;
        }
      });
    }
  };
});