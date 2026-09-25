System.register("q-bundled:///fs/cocos/core/geometry/triangle.js", ["../math/index.js", "./enums.js"], function (_export, _context) {
  "use strict";

  var Vec3, ShapeType, Triangle;
  _export("Triangle", void 0);
  return {
    setters: [function (_mathIndexJs) {
      Vec3 = _mathIndexJs.Vec3;
    }, function (_enumsJs) {
      ShapeType = _enumsJs.ShapeType;
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
      /**
       * @en
       * Basic Geometry: Triangle.
       * @zh
       * 基础几何：三角形。
       */
      _export("Triangle", Triangle = class Triangle {
        /**
         * @en
         * Creates a new triangle instance.
         * @zh
         * 创建一个新的三角形。
         * @param ax @en The x component of point a @zh a 点的 x 部分。
         * @param ay @en The y component of point a @zh a 点的 y 部分。
         * @param az @en The z component of point a @zh a 点的 z 部分。
         * @param bx @en The x component of point b @zh b 点的 x 部分。
         * @param by @en The y component of point b @zh b 点的 y 部分。
         * @param bz @en The z component of point b @zh b 点的 z 部分。
         * @param cx @en The x component of point c @zh c 点的 x 部分。
         * @param cy @en The y component of point c @zh c 点的 y 部分。
         * @param cz @en The z component of point c @zh c 点的 z 部分。
         * @returns @en The created Triangle instance. @zh 创建出的三角形实例。
         */
        static create(ax = 1, ay = 0, az = 0, bx = 0, by = 0, bz = 0, cx = 0, cy = 0, cz = 1) {
          return new Triangle(ax, ay, az, bx, by, bz, cx, cy, cz);
        }

        /**
         * @en
         * Clones a triangle instance.
         * @zh
         * 克隆一个新的三角形。
         * @param t @en The Triangle object to be cloned from. @zh 克隆的目标。
         * @returns @en The cloned triangle instance. @zh 克隆出的新对象。
         */
        static clone(t) {
          return new Triangle(t.a.x, t.a.y, t.a.z, t.b.x, t.b.y, t.b.z, t.c.x, t.c.y, t.c.z);
        }

        /**
         * @en
         * Copies the values from one triangle to another.
         * @zh
         * 复制一个三角形的值到另一个三角形中。
         * @param out @en The target Triangle object to be copied to. @zh 接受操作的三角形。
         * @param t @en A Triangle object to be copied from. @zh 被复制的三角形。
         * @returns @en The target Triangle object to be copied to, same as the `out` parameter. @zh 接受操作的三角形，与 `out` 参数相同。
         */
        static copy(out, t) {
          Vec3.copy(out.a, t.a);
          Vec3.copy(out.b, t.b);
          Vec3.copy(out.c, t.c);
          return out;
        }

        /**
         * @en
         * Creates a triangle instance from three points.
         * @zh
         * 用三个点创建一个三角形。
         * @param out @en The Triangle object to be modified. @zh 接受操作的三角形。
         * @param a @en The point value to set out.a. @zh a 点。
         * @param b @en The point value to set out.b. @zh b 点。
         * @param c @en The point value to set out.c. @zh c 点。
         * @returns @en The Triangle object to be modified， same as the `out` parameter. @zh 接受操作的三角形，与 `out` 参数相同。
         */
        static fromPoints(out, a, b, c) {
          Vec3.copy(out.a, a);
          Vec3.copy(out.b, b);
          Vec3.copy(out.c, c);
          return out;
        }

        /**
         * @en
         * Sets the components of a triangle to the given values.
         * @zh
         * 将给定三角形的属性设置为给定值。
         * @param out @en The Triangle object to be set. @zh 接受操作的三角形。
         * @param ax @en The value to set out.a.x. @zh a 点的 x 部分。
         * @param ay @en The value to set out.a.y. @zh a 点的 y 部分。
         * @param az @en The value to set out.a.z. @zh a 点的 z 部分。
         * @param bx @en The value to set out.b.x. @zh b 点的 x 部分。
         * @param by @en The value to set out.b.y. @zh b 点的 y 部分。
         * @param bz @en The value to set out.b.z. @zh b 点的 z 部分。
         * @param cx @en The value to set out.c.x. @zh c 点的 x 部分。
         * @param cy @en The value to set out.c.y. @zh c 点的 y 部分。
         * @param cz @en The value to set out.c.z. @zh c 点的 z 部分。
         * @returns @en The Triangle object to be set, same as the `out` parameter. @zh 接受操作的三角形，与 `out` 参数相同。
         */
        static set(out, ax, ay, az, bx, by, bz, cx, cy, cz) {
          out.a.x = ax;
          out.a.y = ay;
          out.a.z = az;
          out.b.x = bx;
          out.b.y = by;
          out.b.z = bz;
          out.c.x = cx;
          out.c.y = cy;
          out.c.z = cz;
          return out;
        }

        /**
         * @en
         * Point a.
         * @zh
         * 点 a。
         */

        /**
         * @en
         * Point b.
         * @zh
         * 点 b。
         */

        /**
         * @en
         * Point c.
         * @zh
         * 点 c。
         */

        /**
         * @en
         * Gets the type of the triangle, always returns `ShapeType.SHAPE_TRIANGLE`.
         * @zh
         * 获取此三角形的类型，固定返回 `ShapeType.SHAPE_TRIANGLE`。
         */
        get type() {
          return this._type;
        }
        /**
         * @en
         * Constructs a triangle.
         * @zh
         * 构造一个三角形。
         * @param ax @en x component of point a. @zh a 点的 x 部分。
         * @param ay @en y component of point a. @zh a 点的 y 部分。
         * @param az @en z component of point a. @zh a 点的 z 部分。
         * @param bx @en x component of point b. @zh b 点的 x 部分。
         * @param by @en y component of point b. @zh b 点的 y 部分。
         * @param bz @en z component of point b. @zh b 点的 z 部分。
         * @param cx @en x component of point c. @zh c 点的 x 部分。
         * @param cy @en y component of point c. @zh c 点的 y 部分。
         * @param cz @en z component of point c. @zh c 点的 z 部分。
         */
        constructor(ax = 0, ay = 0, az = 0, bx = 1, by = 0, bz = 0, cx = 0, cy = 1, cz = 0) {
          this._type = ShapeType.SHAPE_TRIANGLE;
          this.a = new Vec3(ax, ay, az);
          this.b = new Vec3(bx, by, bz);
          this.c = new Vec3(cx, cy, cz);
        }
      });
    }
  };
});