System.register("q-bundled:///fs/cocos/core/data/decorators/type.js", ["./property.js", "../utils/attribute.js"], function (_export, _context) {
  "use strict";

  var property, CCString, CCInteger, CCFloat, CCBoolean, integer, float, boolean, string;
  function type(type) {
    return property({
      type
    });
  }
  _export("type", type);
  return {
    setters: [function (_propertyJs) {
      property = _propertyJs.property;
    }, function (_utilsAttributeJs) {
      CCString = _utilsAttributeJs.CCString;
      CCInteger = _utilsAttributeJs.CCInteger;
      CCFloat = _utilsAttributeJs.CCFloat;
      CCBoolean = _utilsAttributeJs.CCBoolean;
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
       * @en Declare the property as integer
       * @zh 将该属性标记为整数。
       */
      _export("integer", integer = type(CCInteger));
      /**
       * @en Declare the property as float
       * @zh 将该属性标记为浮点数。
       */
      _export("float", float = type(CCFloat));
      /**
       * @en Declare the property as boolean
       * @zh 将该属性标记为布尔值。
       */
      _export("boolean", boolean = type(CCBoolean));
      /**
       * @en Declare the property as string
       * @zh 将该属性标记为字符串。
       */
      _export("string", string = type(CCString));
      /**
       * @en Declare the property as the given type
       * @zh 标记该属性的类型。
       * @param type
       */
    }
  };
});