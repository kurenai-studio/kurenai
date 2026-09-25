System.register("q-bundled:///fs/cocos/input/types/key-code.js", [], function (_export, _context) {
  "use strict";

  var KeyCode;
  return {
    setters: [],
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
       * @en Enum type of keyCode for key event
       * @zh 按键事件的按键码
       */
      _export("KeyCode", KeyCode = /*#__PURE__*/function (KeyCode) {
        /**
        * @en None
        * @zh 没有分配
        */
        KeyCode[KeyCode["NONE"] = 0] = "NONE";
        /**
         * @en The back key on mobile phone
         * @zh 移动端返回键
         */
        KeyCode[KeyCode["MOBILE_BACK"] = 6] = "MOBILE_BACK";
        /**
        * @en The backspace key
        * @zh 退格键
        */
        KeyCode[KeyCode["BACKSPACE"] = 8] = "BACKSPACE";
        /**
        * @en The tab key
        * @zh Tab 键
        */
        KeyCode[KeyCode["TAB"] = 9] = "TAB";
        /**
        * @en The enter key
        * @zh 回车键
        */
        KeyCode[KeyCode["ENTER"] = 13] = "ENTER";
        /**
        * @en The left shift key
        * @zh 左 Shift 键
        */
        KeyCode[KeyCode["SHIFT_LEFT"] = 16] = "SHIFT_LEFT";
        /**
        * @en The left ctrl key
        * @zh 左 Ctrl 键
        */
        KeyCode[KeyCode["CTRL_LEFT"] = 17] = "CTRL_LEFT";
        /**
        * @en The left alt key
        * @zh 左 Alt 键
        */
        KeyCode[KeyCode["ALT_LEFT"] = 18] = "ALT_LEFT";
        /**
        * @en The pause key
        * @zh 暂停键
        */
        KeyCode[KeyCode["PAUSE"] = 19] = "PAUSE";
        /**
        * @en The caps lock key
        * @zh 大写锁定键
        */
        KeyCode[KeyCode["CAPS_LOCK"] = 20] = "CAPS_LOCK";
        /**
        * @en The esc key
        * @zh ESC 键
        */
        KeyCode[KeyCode["ESCAPE"] = 27] = "ESCAPE";
        /**
        * @en The space key
        * @zh 空格键
        */
        KeyCode[KeyCode["SPACE"] = 32] = "SPACE";
        /**
        * @en The page up key
        * @zh 向上翻页键
        */
        KeyCode[KeyCode["PAGE_UP"] = 33] = "PAGE_UP";
        /**
        * @en The page down key
        * @zh 向下翻页键
        */
        KeyCode[KeyCode["PAGE_DOWN"] = 34] = "PAGE_DOWN";
        /**
        * @en The end key
        * @zh 结束键
        */
        KeyCode[KeyCode["END"] = 35] = "END";
        /**
        * @en The home key
        * @zh 主菜单键
        */
        KeyCode[KeyCode["HOME"] = 36] = "HOME";
        /**
        * @en The left key
        * @zh 向左箭头键
        */
        KeyCode[KeyCode["ARROW_LEFT"] = 37] = "ARROW_LEFT";
        /**
        * @en The up key
        * @zh 向上箭头键
        */
        KeyCode[KeyCode["ARROW_UP"] = 38] = "ARROW_UP";
        /**
        * @en The right key
        * @zh 向右箭头键
        */
        KeyCode[KeyCode["ARROW_RIGHT"] = 39] = "ARROW_RIGHT";
        /**
        * @en The down key
        * @zh 向下箭头键
        */
        KeyCode[KeyCode["ARROW_DOWN"] = 40] = "ARROW_DOWN";
        /**
        * @en The insert key
        * @zh 插入键
        */
        KeyCode[KeyCode["INSERT"] = 45] = "INSERT";
        /**
        * @en The Delete key
        * @zh 删除键
        */
        KeyCode[KeyCode["DELETE"] = 46] = "DELETE";
        /**
        * @en The '0' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 0 键
        */
        KeyCode[KeyCode["DIGIT_0"] = 48] = "DIGIT_0";
        /**
        * @en The '1' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 1 键
        */
        KeyCode[KeyCode["DIGIT_1"] = 49] = "DIGIT_1";
        /**
        * @en The '2' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 2 键
        */
        KeyCode[KeyCode["DIGIT_2"] = 50] = "DIGIT_2";
        /**
        * @en The '3' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 3 键
        */
        KeyCode[KeyCode["DIGIT_3"] = 51] = "DIGIT_3";
        /**
        * @en The '4' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 4 键
        */
        KeyCode[KeyCode["DIGIT_4"] = 52] = "DIGIT_4";
        /**
        * @en The '5' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 5 键
        */
        KeyCode[KeyCode["DIGIT_5"] = 53] = "DIGIT_5";
        /**
        * @en The '6' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 6 键
        */
        KeyCode[KeyCode["DIGIT_6"] = 54] = "DIGIT_6";
        /**
        * @en The '7' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 7 键
        */
        KeyCode[KeyCode["DIGIT_7"] = 55] = "DIGIT_7";
        /**
        * @en The '8' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 8 键
        */
        KeyCode[KeyCode["DIGIT_8"] = 56] = "DIGIT_8";
        /**
        * @en The '9' key on the top of the alphanumeric keyboard.
        * @zh 字母键盘上的 9 键
        */
        KeyCode[KeyCode["DIGIT_9"] = 57] = "DIGIT_9";
        /**
        * @en The a key
        * @zh A 键
        */
        KeyCode[KeyCode["KEY_A"] = 65] = "KEY_A";
        /**
        * @en The b key
        * @zh B 键
        */
        KeyCode[KeyCode["KEY_B"] = 66] = "KEY_B";
        /**
        * @en The c key
        * @zh C 键
        */
        KeyCode[KeyCode["KEY_C"] = 67] = "KEY_C";
        /**
        * @en The d key
        * @zh D 键
        */
        KeyCode[KeyCode["KEY_D"] = 68] = "KEY_D";
        /**
        * @en The e key
        * @zh E 键
        */
        KeyCode[KeyCode["KEY_E"] = 69] = "KEY_E";
        /**
        * @en The f key
        * @zh F 键
        */
        KeyCode[KeyCode["KEY_F"] = 70] = "KEY_F";
        /**
        * @en The g key
        * @zh G 键
        */
        KeyCode[KeyCode["KEY_G"] = 71] = "KEY_G";
        /**
        * @en The h key
        * @zh H 键
        */
        KeyCode[KeyCode["KEY_H"] = 72] = "KEY_H";
        /**
        * @en The i key
        * @zh I 键
        */
        KeyCode[KeyCode["KEY_I"] = 73] = "KEY_I";
        /**
        * @en The j key
        * @zh J 键
        */
        KeyCode[KeyCode["KEY_J"] = 74] = "KEY_J";
        /**
        * @en The k key
        * @zh K 键
        */
        KeyCode[KeyCode["KEY_K"] = 75] = "KEY_K";
        /**
        * @en The l key
        * @zh L 键
        */
        KeyCode[KeyCode["KEY_L"] = 76] = "KEY_L";
        /**
        * @en The m key
        * @zh M 键
        */
        KeyCode[KeyCode["KEY_M"] = 77] = "KEY_M";
        /**
        * @en The n key
        * @zh N 键
        */
        KeyCode[KeyCode["KEY_N"] = 78] = "KEY_N";
        /**
        * @en The o key
        * @zh O 键
        */
        KeyCode[KeyCode["KEY_O"] = 79] = "KEY_O";
        /**
        * @en The p key
        * @zh P 键
        */
        KeyCode[KeyCode["KEY_P"] = 80] = "KEY_P";
        /**
        * @en The q key
        * @zh Q 键
        */
        KeyCode[KeyCode["KEY_Q"] = 81] = "KEY_Q";
        /**
        * @en The r key
        * @zh R 键
        */
        KeyCode[KeyCode["KEY_R"] = 82] = "KEY_R";
        /**
        * @en The s key
        * @zh S 键
        */
        KeyCode[KeyCode["KEY_S"] = 83] = "KEY_S";
        /**
        * @en The t key
        * @zh T 键
        */
        KeyCode[KeyCode["KEY_T"] = 84] = "KEY_T";
        /**
        * @en The u key
        * @zh U 键
        */
        KeyCode[KeyCode["KEY_U"] = 85] = "KEY_U";
        /**
        * @en The v key
        * @zh V 键
        */
        KeyCode[KeyCode["KEY_V"] = 86] = "KEY_V";
        /**
        * @en The w key
        * @zh W 键
        */
        KeyCode[KeyCode["KEY_W"] = 87] = "KEY_W";
        /**
        * @en The x key
        * @zh X 键
        */
        KeyCode[KeyCode["KEY_X"] = 88] = "KEY_X";
        /**
        * @en The y key
        * @zh Y 键
        */
        KeyCode[KeyCode["KEY_Y"] = 89] = "KEY_Y";
        /**
        * @en The z key
        * @zh Z 键
        */
        KeyCode[KeyCode["KEY_Z"] = 90] = "KEY_Z";
        /**
        * @en The numeric keypad 0
        * @zh 数字键盘 0
        */
        KeyCode[KeyCode["NUM_0"] = 96] = "NUM_0";
        /**
        * @en The numeric keypad 1
        * @zh 数字键盘 1
        */
        KeyCode[KeyCode["NUM_1"] = 97] = "NUM_1";
        /**
        * @en The numeric keypad 2
        * @zh 数字键盘 2
        */
        KeyCode[KeyCode["NUM_2"] = 98] = "NUM_2";
        /**
        * @en The numeric keypad 3
        * @zh 数字键盘 3
        */
        KeyCode[KeyCode["NUM_3"] = 99] = "NUM_3";
        /**
        * @en The numeric keypad 4
        * @zh 数字键盘 4
        */
        KeyCode[KeyCode["NUM_4"] = 100] = "NUM_4";
        /**
        * @en The numeric keypad 5
        * @zh 数字键盘 5
        */
        KeyCode[KeyCode["NUM_5"] = 101] = "NUM_5";
        /**
        * @en The numeric keypad 6
        * @zh 数字键盘 6
        */
        KeyCode[KeyCode["NUM_6"] = 102] = "NUM_6";
        /**
        * @en The numeric keypad 7
        * @zh 数字键盘 7
        */
        KeyCode[KeyCode["NUM_7"] = 103] = "NUM_7";
        /**
        * @en The numeric keypad 8
        * @zh 数字键盘 8
        */
        KeyCode[KeyCode["NUM_8"] = 104] = "NUM_8";
        /**
        * @en The numeric keypad 9
        * @zh 数字键盘 9
        */
        KeyCode[KeyCode["NUM_9"] = 105] = "NUM_9";
        /**
        * @en The numeric keypad '*'
        * @zh 数字键盘 *
        */
        KeyCode[KeyCode["NUM_MULTIPLY"] = 106] = "NUM_MULTIPLY";
        /**
        * @en The numeric keypad '+'
        * @zh 数字键盘 +
        */
        KeyCode[KeyCode["NUM_PLUS"] = 107] = "NUM_PLUS";
        /**
        * @en The numeric keypad '-'
        * @zh 数字键盘 -
        */
        KeyCode[KeyCode["NUM_SUBTRACT"] = 109] = "NUM_SUBTRACT";
        /**
        * @en The numeric keypad '.'
        * @zh 数字键盘小数点 '.'
        */
        KeyCode[KeyCode["NUM_DECIMAL"] = 110] = "NUM_DECIMAL";
        /**
        * @en The numeric keypad '/'
        * @zh 数字键盘 /
        */
        KeyCode[KeyCode["NUM_DIVIDE"] = 111] = "NUM_DIVIDE";
        /**
        * @en The F1 function key
        * @zh F1 功能键
        */
        KeyCode[KeyCode["F1"] = 112] = "F1";
        /**
        * @en The F2 function key
        * @zh F2 功能键
        */
        KeyCode[KeyCode["F2"] = 113] = "F2";
        /**
        * @en The F3 function key
        * @zh F3 功能键
        */
        KeyCode[KeyCode["F3"] = 114] = "F3";
        /**
        * @en The F4 function key
        * @zh F4 功能键
        */
        KeyCode[KeyCode["F4"] = 115] = "F4";
        /**
        * @en The F5 function key
        * @zh F5 功能键
        */
        KeyCode[KeyCode["F5"] = 116] = "F5";
        /**
        * @en The F6 function key
        * @zh F6 功能键
        */
        KeyCode[KeyCode["F6"] = 117] = "F6";
        /**
        * @en The F7 function key
        * @zh F7 功能键
        */
        KeyCode[KeyCode["F7"] = 118] = "F7";
        /**
        * @en The F8 function key
        * @zh F8 功能键
        */
        KeyCode[KeyCode["F8"] = 119] = "F8";
        /**
        * @en The F9 function key
        * @zh F9 功能键
        */
        KeyCode[KeyCode["F9"] = 120] = "F9";
        /**
        * @en The F10 function key
        * @zh F10 功能键
        */
        KeyCode[KeyCode["F10"] = 121] = "F10";
        /**
        * @en The F11 function key
        * @zh F11 功能键
        */
        KeyCode[KeyCode["F11"] = 122] = "F11";
        /**
        * @en The F12 function key
        * @zh F12 功能键
        */
        KeyCode[KeyCode["F12"] = 123] = "F12";
        /**
        * @en The numlock key
        * @zh 数字锁定键
        */
        KeyCode[KeyCode["NUM_LOCK"] = 144] = "NUM_LOCK";
        /**
        * @en The scroll lock key
        * @zh 滚动锁定键
        */
        KeyCode[KeyCode["SCROLL_LOCK"] = 145] = "SCROLL_LOCK";
        /**
        * @en The ';' key.
        * @zh 分号键
        */
        KeyCode[KeyCode["SEMICOLON"] = 186] = "SEMICOLON";
        /**
        * @en The '=' key.
        * @zh 等于号键
        */
        KeyCode[KeyCode["EQUAL"] = 187] = "EQUAL";
        /**
        * @en The ',' key.
        * @zh 逗号键
        */
        KeyCode[KeyCode["COMMA"] = 188] = "COMMA";
        /**
        * @en The dash '-' key.
        * @zh 中划线键
        */
        KeyCode[KeyCode["DASH"] = 189] = "DASH";
        /**
        * @en The '.' key
        * @zh 句号键
        */
        KeyCode[KeyCode["PERIOD"] = 190] = "PERIOD";
        /**
        * @en The slash key '/'
        * @zh 正斜杠键 '/'
        */
        KeyCode[KeyCode["SLASH"] = 191] = "SLASH";
        /**
        * @en The back quote key `
        * @zh 按键 `
        */
        KeyCode[KeyCode["BACK_QUOTE"] = 192] = "BACK_QUOTE";
        /**
        * @en The '[' key
        * @zh 按键 [
        */
        KeyCode[KeyCode["BRACKET_LEFT"] = 219] = "BRACKET_LEFT";
        /**
        * @en The back slash key '\'
        * @zh 反斜杠键 '\'
        */
        KeyCode[KeyCode["BACKSLASH"] = 220] = "BACKSLASH";
        /**
        * @en The ']' key
        * @zh 按键 ]
        */
        KeyCode[KeyCode["BRACKET_RIGHT"] = 221] = "BRACKET_RIGHT";
        /**
        * @en The quote key
        * @zh 单引号键
        */
        KeyCode[KeyCode["QUOTE"] = 222] = "QUOTE";
        // #region The new allocated key enum since v3.3
        /**
        * @en The right shift key
        * @zh 右 Shift 键
        */
        KeyCode[KeyCode["SHIFT_RIGHT"] = 2000] = "SHIFT_RIGHT";
        /**
        * @en The right ctrl key
        * @zh 右 Ctrl 键
        */
        KeyCode[KeyCode["CTRL_RIGHT"] = 2001] = "CTRL_RIGHT";
        /**
        * @en The right alt key
        * @zh 右 Alt 键
        */
        KeyCode[KeyCode["ALT_RIGHT"] = 2002] = "ALT_RIGHT";
        /**
        * @en The numeric keypad enter
        * @zh 数字键盘 enter
        */
        KeyCode[KeyCode["NUM_ENTER"] = 2003] = "NUM_ENTER"; // #endregion The new allocated key enum since v3.3
        return KeyCode;
      }({}));
    }
  };
});