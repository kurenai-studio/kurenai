System.register("q-bundled:///fs/cocos/ui/editbox/types.js", ["../../core/value-types/index.js"], function (_export, _context) {
  "use strict";

  var Enum, KeyboardReturnType, InputMode, InputFlag;
  return {
    setters: [function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
       * 键盘的返回键类型。
       * @readonly
       * @enum EditBox.KeyboardReturnType
       */
      _export("KeyboardReturnType", KeyboardReturnType = /*#__PURE__*/function (KeyboardReturnType) {
        /**
         * 默认。
         */
        KeyboardReturnType[KeyboardReturnType["DEFAULT"] = 0] = "DEFAULT";
        /**
         * 完成类型。
         */
        KeyboardReturnType[KeyboardReturnType["DONE"] = 1] = "DONE";
        /**
         * 发送类型。
         */
        KeyboardReturnType[KeyboardReturnType["SEND"] = 2] = "SEND";
        /**
         * 搜索类型。
         */
        KeyboardReturnType[KeyboardReturnType["SEARCH"] = 3] = "SEARCH";
        /**
         * 跳转类型。
         */
        KeyboardReturnType[KeyboardReturnType["GO"] = 4] = "GO";
        /**
         * 下一个类型。
         */
        KeyboardReturnType[KeyboardReturnType["NEXT"] = 5] = "NEXT";
        return KeyboardReturnType;
      }({}));
      Enum(KeyboardReturnType);

      /**
       * 输入模式。
       * @readonly
       * @enum EditBox.InputMode
       */
      _export("InputMode", InputMode = /*#__PURE__*/function (InputMode) {
        /**
         * 用户可以输入任何文本，包括换行符。
         */
        InputMode[InputMode["ANY"] = 0] = "ANY";
        /**
         * 允许用户输入一个电子邮件地址。
         */
        InputMode[InputMode["EMAIL_ADDR"] = 1] = "EMAIL_ADDR";
        /**
         * 允许用户输入一个整数值。
         */
        InputMode[InputMode["NUMERIC"] = 2] = "NUMERIC";
        /**
         * 允许用户输入一个电话号码。
         */
        InputMode[InputMode["PHONE_NUMBER"] = 3] = "PHONE_NUMBER";
        /**
         * 允许用户输入一个 URL。
         */
        InputMode[InputMode["URL"] = 4] = "URL";
        /**
         * 允许用户输入一个实数。
         */
        InputMode[InputMode["DECIMAL"] = 5] = "DECIMAL";
        /**
         * 除了换行符以外，用户可以输入任何文本。
         */
        InputMode[InputMode["SINGLE_LINE"] = 6] = "SINGLE_LINE";
        return InputMode;
      }({}));
      Enum(InputMode);

      /**
       * 定义了一些用于设置文本显示和文本格式化的标志位。
       * @readonly
       * @enum EditBox.InputFlag
       */
      _export("InputFlag", InputFlag = /*#__PURE__*/function (InputFlag) {
        /**
         * 表明输入的文本是保密的数据，任何时候都应该隐藏起来，它隐含了 EDIT_BOX_INPUT_FLAG_SENSITIVE。
         */
        InputFlag[InputFlag["PASSWORD"] = 0] = "PASSWORD";
        /**
         * 表明输入的文本是敏感数据，它禁止存储到字典或表里面，也不能用来自动补全和提示用户输入。
         * 一个信用卡号码就是一个敏感数据的例子。
         */
        InputFlag[InputFlag["SENSITIVE"] = 1] = "SENSITIVE";
        /**
         * 这个标志用来指定在文本编辑的时候，是否把每一个单词的首字母大写。
         */
        InputFlag[InputFlag["INITIAL_CAPS_WORD"] = 2] = "INITIAL_CAPS_WORD";
        /**
         * 这个标志用来指定在文本编辑是否每个句子的首字母大写。
         */
        InputFlag[InputFlag["INITIAL_CAPS_SENTENCE"] = 3] = "INITIAL_CAPS_SENTENCE";
        /**
         * 自动把输入的所有字符大写。
         */
        InputFlag[InputFlag["INITIAL_CAPS_ALL_CHARACTERS"] = 4] = "INITIAL_CAPS_ALL_CHARACTERS";
        /**
         * Don't do anything with the input text.
         */
        InputFlag[InputFlag["DEFAULT"] = 5] = "DEFAULT";
        return InputFlag;
      }({}));
      Enum(InputFlag);
    }
  };
});