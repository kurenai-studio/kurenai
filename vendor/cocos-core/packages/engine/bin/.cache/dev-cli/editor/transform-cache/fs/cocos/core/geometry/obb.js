System.register("q-bundled:///fs/cocos/core/geometry/obb.js", ["../math/index.js", "./enums.js"], function (_export, _context) {
  "use strict";

  var Mat3, Vec3, ShapeType, OBB, _v3_tmp, _v3_tmp2, _m3_tmp, mathAbs, transform_extent_m3;
  _export("OBB", void 0);
  return {
    setters: [function (_mathIndexJs) {
      Mat3 = _mathIndexJs.Mat3;
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
      _v3_tmp = new Vec3();
      _v3_tmp2 = new Vec3();
      _m3_tmp = new Mat3();
      mathAbs = Math.abs; // https://zeuxcg.org/2010/10/17/aabb-from-obb-with-component-wise-abs/
      transform_extent_m3 = (out, extent, m3) => {
        _m3_tmp.m00 = mathAbs(m3.m00);
        _m3_tmp.m01 = mathAbs(m3.m01);
        _m3_tmp.m02 = mathAbs(m3.m02);
        _m3_tmp.m03 = mathAbs(m3.m03);
        _m3_tmp.m04 = mathAbs(m3.m04);
        _m3_tmp.m05 = mathAbs(m3.m05);
        _m3_tmp.m06 = mathAbs(m3.m06);
        _m3_tmp.m07 = mathAbs(m3.m07);
        _m3_tmp.m08 = mathAbs(m3.m08);
        Vec3.transformMat3(out, extent, _m3_tmp);
      };
      /**
       * @en
       * Basic Geometry: Oriented bounding box.
       * @zh
       * 基础几何：方向包围盒。
       */
      _export("OBB", OBB = class OBB {
        /**
         * @en
         * Creates a new OBB instance
         * @zh
         * 创建一个新的 OBB 实例。
         * @param cx @zh 形状的相对于原点的 X 坐标。 @en The x coordinate of origin.
         * @param cy @zh 形状的相对于原点的 Y 坐标。 @en The y coordinate of origin.
         * @param cz @zh 形状的相对于原点的 Z 坐标。 @en The z coordinate of origin.
         * @param hw @zh - OBB 宽度的一半。 @en Half the width of the OBB.
         * @param hh @zh - OBB 高度的一半。 @en Half the height of the OBB.
         * @param hl @zh - OBB 长度的一半。 @en Half the length of the OBB.
         * @param ox_1 @zh 方向矩阵参数，第 1 条轴的 x 分量。 @en The x component of the first axis of the OBB.
         * @param ox_2 @zh 方向矩阵参数，第 2 条轴的 x 分量。 @en The x component of the second axis of the OBB.
         * @param ox_3 @zh 方向矩阵参数，第 3 条轴的 x 分量。 @en The x component of the third axis of the OBB.
         * @param oy_1 @zh 方向矩阵参数，第 1 条轴的 y 分量。 @en The y component of the first axis of the OBB.
         * @param oy_2 @zh 方向矩阵参数，第 2 条轴的 y 分量。 @en The y component of the second axis of the OBB.
         * @param oy_3 @zh 方向矩阵参数，第 3 条轴的 y 分量。 @en The y component of the third axis of the OBB.
         * @param oz_1 @zh 方向矩阵参数，第 1 条轴的 z 分量。 @en The z component of the first axis of the OBB.
         * @param oz_2 @zh 方向矩阵参数，第 2 条轴的 z 分量。 @en The z component of the second axis of the OBB.
         * @param oz_3 @zh 方向矩阵参数，第 3 条轴的 z 分量。 @en The z component of the third axis of the OBB.
         * @returns @zh 返回新创建的 OBB 实例。 @en A new OBB instance.
         */
        static create(cx, cy, cz, hw, hh, hl, ox_1, ox_2, ox_3, oy_1, oy_2, oy_3, oz_1, oz_2, oz_3) {
          return new OBB(cx, cy, cz, hw, hh, hl, ox_1, ox_2, ox_3, oy_1, oy_2, oy_3, oz_1, oz_2, oz_3);
        }

        /**
         * @en
         * Clones a new OBB instance.
         * @zh
         * 克隆一个 OBB 实例。
         * @param a @zh 克隆的目标。 @en The input OBB.
         * @returns @zh The cloned OBB instance.  @en 克隆出的新对象。
         */
        static clone(a) {
          return new OBB(a.center.x, a.center.y, a.center.z, a.halfExtents.x, a.halfExtents.y, a.halfExtents.z, a.orientation.m00, a.orientation.m01, a.orientation.m02, a.orientation.m03, a.orientation.m04, a.orientation.m05, a.orientation.m06, a.orientation.m07, a.orientation.m08);
        }

        /**
         * @en
         * Copies the values from one OBB to another.
         * @zh
         * 复制一个 OBB 的值到另一个 OBB 中。
         * @param  out @zh 接受操作的 OBB。 @en The output OBB.
         * @param  a @zh 被复制的 OBB。 @en The input OBB.
         * @returns  @zh 接受操作的 OBB，与 `out` 参数相同。 @en The output OBB, same as the `out` parameter.
         */
        static copy(out, a) {
          Vec3.copy(out.center, a.center);
          Vec3.copy(out.halfExtents, a.halfExtents);
          Mat3.copy(out.orientation, a.orientation);
          return out;
        }

        /**
         * @en
         * Creates a new OBB from two corner points.
         * @zh
         * 用两个点创建一个新的 OBB。
         * @param out @zh - 接受操作的 OBB。 @en The output OBB.
         * @param minPos @zh - OBB 的最小点。 @en The minimum position of the AABB.
         * @param maxPos @zh - OBB 的最大点。 @en The maximum position of the AABB.
         * @returns  @zh 接受操作的 OBB，与 `out` 参数相同。 @en The output OBB, same as the `out` parameter.
         */
        static fromPoints(out, minPos, maxPos) {
          Vec3.multiplyScalar(out.center, Vec3.add(_v3_tmp, minPos, maxPos), 0.5);
          Vec3.multiplyScalar(out.halfExtents, Vec3.subtract(_v3_tmp2, maxPos, minPos), 0.5);
          Mat3.identity(out.orientation);
          return out;
        }

        /**
         * @en
         * Sets the components of an OBB to the given values.
         * @zh
         * 将给定 OBB 的属性设置为给定的值。
         * @param out @zh 目标 OBB @en The output OBB instance.
         * @param cx @zh 形状的相对于原点的 X 坐标。 @en The x coordinate of origin.
         * @param cy @zh 形状的相对于原点的 Y 坐标。 @en The y coordinate of origin.
         * @param cz @zh 形状的相对于原点的 Z 坐标。 @en The z coordinate of origin.
         * @param hw @zh - obb 宽度的一半。 @en Half the width of the OBB.
         * @param hh @zh - obb 高度的一半。 @en Half the height of the OBB.
         * @param hl @zh - obb 长度的一半。 @en Half the length of the OBB.
         * @param ox_1 @zh 方向矩阵参数，第 1 条轴的 x 分量。 @en The x component of the first axis of the OBB.
         * @param ox_2 @zh 方向矩阵参数，第 2 条轴的 x 分量。 @en The x component of the second axis of the OBB.
         * @param ox_3 @zh 方向矩阵参数，第 3 条轴的 x 分量。 @en The x component of the third axis of the OBB.
         * @param oy_1 @zh 方向矩阵参数，第 1 条轴的 y 分量。 @en The y component of the first axis of the OBB.
         * @param oy_2 @zh 方向矩阵参数，第 2 条轴的 y 分量。 @en The y component of the second axis of the OBB.
         * @param oy_3 @zh 方向矩阵参数，第 3 条轴的 y 分量。 @en The y component of the third axis of the OBB.
         * @param oz_1 @zh 方向矩阵参数，第 1 条轴的 z 分量。 @en The z component of the first axis of the OBB.
         * @param oz_2 @zh 方向矩阵参数，第 2 条轴的 z 分量。 @en The z component of the second axis of the OBB.
         * @param oz_3 @zh 方向矩阵参数，第 3 条轴的 z 分量。 @en The z component of the third axis of the OBB.
         * @returns  @zh 接受操作的 OBB，与 `out` 参数相同。 @en The output OBB, same as the `out` parameter.
         */
        static set(out, cx, cy, cz, hw, hh, hl, ox_1, ox_2, ox_3, oy_1, oy_2, oy_3, oz_1, oz_2, oz_3) {
          Vec3.set(out.center, cx, cy, cz);
          Vec3.set(out.halfExtents, hw, hh, hl);
          Mat3.set(out.orientation, ox_1, ox_2, ox_3, oy_1, oy_2, oy_3, oz_1, oz_2, oz_3);
          return out;
        }

        /**
         * @en
         * The center point of an OBB in local coordinate.
         * @zh
         * 本地坐标的中心点。
         */

        /**
         * @en
         * Gets the type of the OBB. Always returns `ShapeType.SHAPE_OBB`.
         * @zh
         * 获取形状的类型，固定返回 `ShapeType.SHAPE_OBB`。
         */
        get type() {
          return this._type;
        }
        /**
         * @param cx @zh 形状的相对于原点的 X 坐标。 @en The x coordinate of origin.
         * @param cy @zh 形状的相对于原点的 Y 坐标。 @en The y coordinate of origin.
         * @param cz @zh 形状的相对于原点的 Z 坐标。 @en The z coordinate of origin.
         * @param hw @zh - OBB 宽度的一半。 @en Half the width of the OBB.
         * @param hh @zh - OBB 高度的一半。 @en Half the height of the OBB.
         * @param hl @zh - OBB 长度的一半。 @en Half the length of the OBB.
         * @param ox_1 @zh 方向矩阵参数，第 1 条轴的 x 分量。 @en The x component of the first axis of the OBB.
         * @param ox_2 @zh 方向矩阵参数，第 2 条轴的 x 分量。 @en The x component of the second axis of the OBB.
         * @param ox_3 @zh 方向矩阵参数，第 3 条轴的 x 分量。 @en The x component of the third axis of the OBB.
         * @param oy_1 @zh 方向矩阵参数，第 1 条轴的 y 分量。 @en The y component of the first axis of the OBB.
         * @param oy_2 @zh 方向矩阵参数，第 2 条轴的 y 分量。 @en The y component of the second axis of the OBB.
         * @param oy_3 @zh 方向矩阵参数，第 3 条轴的 y 分量。 @en The y component of the third axis of the OBB.
         * @param oz_1 @zh 方向矩阵参数，第 1 条轴的 z 分量。 @en The z component of the first axis of the OBB.
         * @param oz_2 @zh 方向矩阵参数，第 2 条轴的 z 分量。 @en The z component of the second axis of the OBB.
         * @param oz_3 @zh 方向矩阵参数，第 3 条轴的 z 分量。 @en The z component of the third axis of the OBB.
         */
        constructor(cx = 0, cy = 0, cz = 0, hw = 1, hh = 1, hl = 1, ox_1 = 1, ox_2 = 0, ox_3 = 0, oy_1 = 0, oy_2 = 1, oy_3 = 0, oz_1 = 0, oz_2 = 0, oz_3 = 1) {
          this.center = void 0;
          /**
           * @en
           * Half the distance across the OBB in each local axis.
           * @zh
           * 长宽高的一半。
           */
          this.halfExtents = void 0;
          /**
           * @en
           * Orientation matrix.
           * @zh
           * 方向矩阵。
           */
          this.orientation = void 0;
          this._type = void 0;
          this._type = ShapeType.SHAPE_OBB;
          this.center = new Vec3(cx, cy, cz);
          this.halfExtents = new Vec3(hw, hh, hl);
          this.orientation = new Mat3(ox_1, ox_2, ox_3, oy_1, oy_2, oy_3, oz_1, oz_2, oz_3);
        }

        /**
         * @en
         * Gets the bounding points of this OBB instance.
         * @zh
         * 获取此 OBB 的最小点和最大点。
         * @param minPos @zh 此 OBB 的最小点。 @en The out minimum position of the OBB.
         * @param maxPos @zh 此 OBB 的最大点。 @en The out maximum position of the OBB.
         */
        getBoundary(minPos, maxPos) {
          transform_extent_m3(_v3_tmp, this.halfExtents, this.orientation);
          Vec3.subtract(minPos, this.center, _v3_tmp);
          Vec3.add(maxPos, this.center, _v3_tmp);
        }

        /**
         * @en
         * Transforms this OBB and store the result to the `out` parameter.
         * @zh
         * 对当前 OBB 的数据进行变换，并存储结果到 `out` 参数中。
         * @param m @zh 变换的矩阵。 @en The transform matrix
         * @param pos @zh 变换的位置部分。 @en 3d-vector translation.
         * @param rot @zh 变换的旋转部分。 @en Quaternion rotation.
         * @param scale @zh 变换的缩放部分。 @en 3d-vector scale.
         * @param out @zh 变换结果的目标 OBB。 @en The output OBB.
         * @note @zh 此方法不会修改当前 OBB 的数据。 @en This method will not modify the data of current OBB.
         */
        transform(m, pos, rot, scale, out) {
          Vec3.transformMat4(out.center, this.center, m);
          // parent shape doesn't contain rotations for now
          Mat3.fromQuat(out.orientation, rot);
          Vec3.multiply(out.halfExtents, this.halfExtents, scale);
        }

        /**
         * @en
         * Transforms this OBB by a 4x4 matrix and a quaternion.
         * @zh
         * 根据一个 4x4 矩阵和一个四元数变换此 OBB。
         * @param m @zh 变换的矩阵。 @en The transform matrix.
         * @param rot @zh 变换的旋转部分。 @en The quaternion for rotation.
         * @param out @zh 变换的目标。 @en The output OBB.
         * @note @zh 此方法不会修改当前 OBB 的数据。 @en This method will not modify the data of current OBB.
         */
        translateAndRotate(m, rot, out) {
          Vec3.transformMat4(out.center, this.center, m);
          // parent shape doesn't contain rotations for now
          Mat3.fromQuat(out.orientation, rot);
        }

        /**
         * @en
         * Scales this OBB by a 3d-vector and store the result to the `out` parameter.
         * @zh
         * 根据 3D 向量对此 OBB 的数据进行缩放并将结果存储在 out 参数中。
         * @param scale @zh 缩放值。 @en 3d-vector scale.
         * @param out @zh 缩放的目标。 @en The output OBB.
         * @note @zh 此方法不会修改当前 OBB 的数据。 @en This method will not modify the data of current OBB.
         */
        setScale(scale, out) {
          Vec3.multiply(out.halfExtents, this.halfExtents, scale);
        }
      });
    }
  };
});