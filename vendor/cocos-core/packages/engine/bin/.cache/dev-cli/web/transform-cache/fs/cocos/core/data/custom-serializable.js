System.register("q-bundled:///fs/cocos/core/data/custom-serializable.js", ["./utils/asserts.js"], function (_export, _context) {
  "use strict";

  var assertIsNonNullable, assertIsTrue, serializeTag, deserializeTag, enableIfCCON;
  return {
    setters: [function (_utilsAssertsJs) {
      assertIsNonNullable = _utilsAssertsJs.assertIsNonNullable;
      assertIsTrue = _utilsAssertsJs.assertIsTrue;
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
      /**
       * Tag to define the custom serialization method.
       * @internal
       */
      _export("serializeTag", serializeTag = Symbol('[[Serialize]]'));
      /**
       * Tag to define the custom deserialization method.
       * @internal
       */
      _export("deserializeTag", deserializeTag = Symbol('[[Deserialize]]'));
      /**
       * @engineInternal
       */
      /**
       * Enables the custom to serialize/deserialize method only if the (de)serialize procedure is targeting CCON.
       * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
       */
      _export("enableIfCCON", enableIfCCON = (_target, propertyKey, descriptor) => {
        const original = descriptor.value;
        assertIsNonNullable(original);
        if (propertyKey === serializeTag) {
          return {
            ...descriptor,
            value: function wrapSerialize(output, context) {
              if (!context.toCCON) {
                output.writeThis();
              } else {
                original.call(this, output, context);
              }
            }
          };
        } else {
          assertIsTrue(propertyKey === deserializeTag, '@enableIfCCON should be only applied to custom (de)serialize method');
          return {
            ...descriptor,
            value: function wrapDeserialize(input, context) {
              if (!context.fromCCON) {
                input.readThis();
              } else {
                original.call(this, input, context);
              }
            }
          };
        }
      });
    }
  };
});