System.register("q-bundled:///fs/cocos/physics/utils/object-collision-matrix.js", [], function (_export, _context) {
  "use strict";

  var ObjectCollisionMatrix;
  _export("ObjectCollisionMatrix", void 0);
  return {
    setters: [],
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
       * Records what objects are colliding with each other
       * @class ObjectCollisionMatrix
       * @constructor
       */
      _export("ObjectCollisionMatrix", ObjectCollisionMatrix = class ObjectCollisionMatrix {
        constructor() {
          /**
           * The matrix storage
           */
          this.matrix = void 0;
          this.matrix = {};
        }

        /**
         * @method get
         * @param  {number} i
         * @param  {number} j
         * @return
         */
        get(i, j) {
          if (j > i) {
            const temp = j;
            j = i;
            i = temp;
          }
          return this.matrix[`${i}-${j}`];
        }

        /**
         * @method set
         * @param  {number} i
         * @param  {number} j
         * @param {number} value
         */
        set(i, j, value) {
          if (j > i) {
            const temp = j;
            j = i;
            i = temp;
          }
          this.matrix[`${i}-${j}`] = value;
        }

        /**
         * Empty the matrix
         * @method reset
         */
        reset() {
          this.matrix = {};
        }
      });
    }
  };
});