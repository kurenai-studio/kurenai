System.register("q-bundled:///fs/cocos/core/platform/macro.js", ["../../../../virtual/internal%253Aconstants.js", "../global-exports.js", "../settings.js", "../../../pal/screen-adapter/enum-type/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, MINIGAME, NATIVE, PREVIEW, RUNTIME_BASED, legacyCC, settings, SettingsCategory, Orientation, SUPPORT_TEXTURE_FORMATS, KEY, macro;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      MINIGAME = _virtualInternal253AconstantsJs.MINIGAME;
      NATIVE = _virtualInternal253AconstantsJs.NATIVE;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      RUNTIME_BASED = _virtualInternal253AconstantsJs.RUNTIME_BASED;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }, function (_settingsJs) {
      settings = _settingsJs.settings;
      SettingsCategory = _settingsJs.SettingsCategory;
    }, function (_palScreenAdapterEnumTypeIndexJs) {
      Orientation = _palScreenAdapterEnumTypeIndexJs.Orientation;
    }],
    execute: function () {
      /*
       Copyright (c) 2008-2010 Ricardo Quesada
       Copyright (c) 2011-2012 cocos2d-x.org
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
      SUPPORT_TEXTURE_FORMATS = ['.astc', '.pkm', '.pvr', '.webp', '.jpg', '.jpeg', '.bmp', '.png'];
      KEY = {
        /**
         * @en None
         * @zh 没有分配
         * @readonly
         */
        none: 0,
        // android
        /**
         * @en The back key on mobile phone
         * @zh 移动端返回键
         * @readonly
         * @deprecated since v3.3, please use KeyCode.MOBILE_BACK instead.
         */
        back: 6,
        /**
         * @en The menu key on mobile phone
         * @zh 移动端菜单键
         * @readonly
         * @deprecated since v3.3
         */
        menu: 18,
        /**
         * @en The backspace key
         * @zh 退格键
         * @readonly
         */
        backspace: 8,
        /**
         * @en The tab key
         * @zh Tab 键
         * @readonly
         */
        tab: 9,
        /**
         * @en The enter key
         * @zh 回车键
         * @readonly
         */
        enter: 13,
        /**
         * @en The shift key
         * @zh Shift 键
         * @readonly
         * @deprecated since v3.3, please use KeyCode.SHIFT_LEFT instead.
         */
        shift: 16,
        // should use shiftkey instead

        /**
         * @en The ctrl key
         * @zh Ctrl 键
         * @readonly
         * @deprecated since v3.3, please use KeyCode.CTRL_LEFT instead.
         */
        ctrl: 17,
        // should use ctrlkey

        /**
         * @en The alt key
         * @zh Alt 键
         * @readonly
         * @deprecated since v3.3, please use KeyCode.ALT_LEFT instead.
         */
        alt: 18,
        // should use altkey

        /**
         * @en The pause key
         * @zh 暂停键
         * @readonly
         */
        pause: 19,
        /**
         * @en The caps lock key
         * @zh 大写锁定键
         * @readonly
         */
        capslock: 20,
        /**
         * @en The esc key
         * @zh ESC 键
         * @readonly
         */
        escape: 27,
        /**
         * @en The space key
         * @zh 空格键
         * @readonly
         */
        space: 32,
        /**
         * @en The page up key
         * @zh 向上翻页键
         * @readonly
         */
        pageup: 33,
        /**
         * @en The page down key
         * @zh 向下翻页键
         * @readonly
         */
        pagedown: 34,
        /**
         * @en The end key
         * @zh 结束键
         * @readonly
         */
        end: 35,
        /**
         * @en The home key
         * @zh 主菜单键
         * @readonly
         */
        home: 36,
        /**
         * @en The left key
         * @zh 向左箭头键
         * @readonly
         */
        left: 37,
        /**
         * @en The up key
         * @zh 向上箭头键
         * @readonly
         */
        up: 38,
        /**
         * @en The right key
         * @zh 向右箭头键
         * @readonly
         */
        right: 39,
        /**
         * @en The down key
         * @zh 向下箭头键
         * @readonly
         */
        down: 40,
        /**
         * @en The select key
         * @zh Select 键
         * @readonly
         * @deprecated since v3.3
         */
        select: 41,
        /**
         * @en The insert key
         * @zh 插入键
         * @readonly
         */
        insert: 45,
        /**
         * @en The Delete key
         * @zh 删除键
         * @readonly
         */
        Delete: 46,
        /**
         * @en The '0' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 0 键
         * @readonly
         * @deprecated since v3.3
         */
        0: 48,
        /**
         * @en The '1' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 1 键
         * @readonly
         * @deprecated since v3.3
         */
        1: 49,
        /**
         * @en The '2' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 2 键
         * @readonly
         * @deprecated since v3.3
         */
        2: 50,
        /**
         * @en The '3' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 3 键
         * @readonly
         * @deprecated since v3.3
         */
        3: 51,
        /**
         * @en The '4' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 4 键
         * @readonly
         * @deprecated since v3.3
         */
        4: 52,
        /**
         * @en The '5' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 5 键
         * @readonly
         * @deprecated since v3.3
         */
        5: 53,
        /**
         * @en The '6' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 6 键
         * @readonly
         * @deprecated since v3.3
         */
        6: 54,
        /**
         * @en The '7' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 7 键
         * @readonly
         * @deprecated since v3.3
         */
        7: 55,
        /**
         * @en The '8' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 8 键
         * @readonly
         * @deprecated since v3.3
         */
        8: 56,
        /**
         * @en The '9' key on the top of the alphanumeric keyboard.
         * @zh 字母键盘上的 9 键
         * @readonly
         * @deprecated since v3.3
         */
        9: 57,
        /**
         * @en The a key
         * @zh A 键
         * @readonly
         */
        a: 65,
        /**
         * @en The b key
         * @zh B 键
         * @readonly
         */
        b: 66,
        /**
         * @en The c key
         * @zh C 键
         * @readonly
         */
        c: 67,
        /**
         * @en The d key
         * @zh D 键
         * @readonly
         */
        d: 68,
        /**
         * @en The e key
         * @zh E 键
         * @readonly
         */
        e: 69,
        /**
         * @en The f key
         * @zh F 键
         * @readonly
         */
        f: 70,
        /**
         * @en The g key
         * @zh G 键
         * @readonly
         */
        g: 71,
        /**
         * @en The h key
         * @zh H 键
         * @readonly
         */
        h: 72,
        /**
         * @en The i key
         * @zh I 键
         * @readonly
         */
        i: 73,
        /**
         * @en The j key
         * @zh J 键
         * @readonly
         */
        j: 74,
        /**
         * @en The k key
         * @zh K 键
         * @readonly
         */
        k: 75,
        /**
         * @en The l key
         * @zh L 键
         * @readonly
         */
        l: 76,
        /**
         * @en The m key
         * @zh M 键
         * @readonly
         */
        m: 77,
        /**
         * @en The n key
         * @zh N 键
         * @readonly
         */
        n: 78,
        /**
         * @en The o key
         * @zh O 键
         * @readonly
         */
        o: 79,
        /**
         * @en The p key
         * @zh P 键
         * @readonly
         */
        p: 80,
        /**
         * @en The q key
         * @zh Q 键
         * @readonly
         */
        q: 81,
        /**
         * @en The r key
         * @zh R 键
         * @readonly
         */
        r: 82,
        /**
         * @en The s key
         * @zh S 键
         * @readonly
         */
        s: 83,
        /**
         * @en The t key
         * @zh T 键
         * @readonly
         */
        t: 84,
        /**
         * @en The u key
         * @zh U 键
         * @readonly
         */
        u: 85,
        /**
         * @en The v key
         * @zh V 键
         * @readonly
         */
        v: 86,
        /**
         * @en The w key
         * @zh W 键
         * @readonly
         */
        w: 87,
        /**
         * @en The x key
         * @zh X 键
         * @readonly
         */
        x: 88,
        /**
         * @en The y key
         * @zh Y 键
         * @readonly
         */
        y: 89,
        /**
         * @en The z key
         * @zh Z 键
         * @readonly
         */
        z: 90,
        /**
         * @en The numeric keypad 0
         * @zh 数字键盘 0
         * @readonly
         */
        num0: 96,
        /**
         * @en The numeric keypad 1
         * @zh 数字键盘 1
         * @readonly
         */
        num1: 97,
        /**
         * @en The numeric keypad 2
         * @zh 数字键盘 2
         * @readonly
         */
        num2: 98,
        /**
         * @en The numeric keypad 3
         * @zh 数字键盘 3
         * @readonly
         */
        num3: 99,
        /**
         * @en The numeric keypad 4
         * @zh 数字键盘 4
         * @readonly
         */
        num4: 100,
        /**
         * @en The numeric keypad 5
         * @zh 数字键盘 5
         * @readonly
         */
        num5: 101,
        /**
         * @en The numeric keypad 6
         * @zh 数字键盘 6
         * @readonly
         */
        num6: 102,
        /**
         * @en The numeric keypad 7
         * @zh 数字键盘 7
         * @readonly
         */
        num7: 103,
        /**
         * @en The numeric keypad 8
         * @zh 数字键盘 8
         * @readonly
         */
        num8: 104,
        /**
         * @en The numeric keypad 9
         * @zh 数字键盘 9
         * @readonly
         */
        num9: 105,
        /**
         * @en The numeric keypad '*'
         * @zh 数字键盘 *
         * @readonly
         * @deprecated since v3.3
         */
        '*': 106,
        /**
         * @en The numeric keypad '+'
         * @zh 数字键盘 +
         * @readonly
         * @deprecated since v3.3
         */
        '+': 107,
        /**
         * @en The numeric keypad '-'
         * @zh 数字键盘 -
         * @readonly
         * @deprecated since v3.3
         */
        '-': 109,
        /**
         * @en The numeric keypad 'delete'
         * @zh 数字键盘删除键
         * @readonly
         */
        numdel: 110,
        /**
         * @en The numeric keypad '/'
         * @zh 数字键盘 /
         * @readonly
         * @deprecated since v3.3
         */
        '/': 111,
        /**
         * @en The F1 function key
         * @zh F1 功能键
         * @readonly
         */
        f1: 112,
        // f1-f12 dont work on ie

        /**
         * @en The F2 function key
         * @zh F2 功能键
         * @readonly
         */
        f2: 113,
        /**
         * @en The F3 function key
         * @zh F3 功能键
         * @readonly
         */
        f3: 114,
        /**
         * @en The F4 function key
         * @zh F4 功能键
         * @readonly
         */
        f4: 115,
        /**
         * @en The F5 function key
         * @zh F5 功能键
         * @readonly
         */
        f5: 116,
        /**
         * @en The F6 function key
         * @zh F6 功能键
         * @readonly
         */
        f6: 117,
        /**
         * @en The F7 function key
         * @zh F7 功能键
         * @readonly
         */
        f7: 118,
        /**
         * @en The F8 function key
         * @zh F8 功能键
         * @readonly
         */
        f8: 119,
        /**
         * @en The F9 function key
         * @zh F9 功能键
         * @readonly
         */
        f9: 120,
        /**
         * @en The F10 function key
         * @zh F10 功能键
         * @readonly
         */
        f10: 121,
        /**
         * @en The F11 function key
         * @zh F11 功能键
         * @readonly
         */
        f11: 122,
        /**
         * @en The F12 function key
         * @zh F12 功能键
         * @readonly
         */
        f12: 123,
        /**
         * @en The numlock key
         * @zh 数字锁定键
         * @readonly
         */
        numlock: 144,
        /**
         * @en The scroll lock key
         * @zh 滚动锁定键
         * @readonly
         */
        scrolllock: 145,
        /**
         * @en The ';' key.
         * @zh 分号键
         * @readonly
         * @deprecated since v3.3
         */
        ';': 186,
        /**
         * @en The ';' key.
         * @zh 分号键
         * @readonly
         */
        semicolon: 186,
        /**
         * @en The '=' key.
         * @zh 等于号键
         * @readonly
         */
        equal: 187,
        /**
         * @en The '=' key.
         * @zh 等于号键
         * @readonly
         * @deprecated since v3.3
         */
        '=': 187,
        /**
         * @en The ',' key.
         * @zh 逗号键
         * @readonly
         * @deprecated since v3.3
         */
        ',': 188,
        /**
         * @en The ',' key.
         * @zh 逗号键
         * @readonly
         */
        comma: 188,
        /**
         * @en The dash '-' key.
         * @zh 中划线键
         * @readonly
         */
        dash: 189,
        /**
         * @en The '.' key.
         * @zh 句号键
         * @readonly
         * @deprecated since v3.3
         */
        '.': 190,
        /**
         * @en The '.' key
         * @zh 句号键
         * @readonly
         */
        period: 190,
        /**
         * @en The forward slash key
         * @zh 正斜杠键
         * @readonly
         */
        forwardslash: 191,
        /**
         * @en The grave key
         * @zh 按键 `
         * @readonly
         */
        grave: 192,
        /**
         * @en The '[' key
         * @zh 按键 [
         * @readonly
         * @deprecated since v3.3
         */
        '[': 219,
        /**
         * @en The '[' key
         * @zh 按键 [
         * @readonly
         */
        openbracket: 219,
        /**
         * @en The '\' key
         * @zh 反斜杠键
         * @readonly
         */
        backslash: 220,
        /**
         * @en The ']' key
         * @zh 按键 ]
         * @readonly
         * @deprecated since v3.3
         */
        ']': 221,
        /**
         * @en The ']' key
         * @zh 按键 ]
         * @readonly
         */
        closebracket: 221,
        /**
         * @en The quote key
         * @zh 单引号键
         * @readonly
         */
        quote: 222,
        // gamepad controll

        /**
         * @en The dpad left key
         * @zh 导航键 向左
         * @readonly
         * @deprecated since v3.3
         */
        dpadLeft: 1000,
        /**
         * @en The dpad right key
         * @zh 导航键 向右
         * @readonly
         * @deprecated since v3.3
         */
        dpadRight: 1001,
        /**
         * @en The dpad up key
         * @zh 导航键 向上
         * @readonly
         * @deprecated since v3.3
         */
        dpadUp: 1003,
        /**
         * @en The dpad down key
         * @zh 导航键 向下
         * @readonly
         * @deprecated since v3.3
         */
        dpadDown: 1004,
        /**
         * @en The dpad center key
         * @zh 导航键 确定键
         * @readonly
         * @deprecated since v3.3
         */
        dpadCenter: 1005
      };
      /**
       * @en
       * Predefined constants, see [[Macro]] for detailed contents.
       * @zh
       * 预定义常量，具体内容参考 [[Macro]] 文档。
       */
      /**
       * @en Interface declaration for predefined constants, for usage you should be importing [[macro]] directly.
       * @zh 预定义常量的接口声明，实际使用应该直接导入 [[macro]]。
       */
      /**
       * @en
       * Predefined constants, see [[Macro]] for detailed contents.
       * @zh
       * 预定义常量，具体内容参考 [[Macro]] 文档。
       */
      _export("macro", macro = {
        SUPPORT_TEXTURE_FORMATS,
        KEY,
        RAD: Math.PI / 180,
        DEG: 180 / Math.PI,
        REPEAT_FOREVER: Number.MAX_VALUE - 1,
        FLT_EPSILON: 0.0000001192092896,
        ORIENTATION_PORTRAIT: Orientation.PORTRAIT,
        ORIENTATION_PORTRAIT_UPSIDE_DOWN: Orientation.PORTRAIT_UPSIDE_DOWN,
        ORIENTATION_LANDSCAPE: Orientation.LANDSCAPE,
        ORIENTATION_LANDSCAPE_LEFT: Orientation.LANDSCAPE_LEFT,
        ORIENTATION_LANDSCAPE_RIGHT: Orientation.LANDSCAPE_RIGHT,
        ORIENTATION_AUTO: Orientation.AUTO,
        ENABLE_TILEDMAP_CULLING: true,
        TOUCH_TIMEOUT: 5000,
        ENABLE_TRANSPARENT_CANVAS: false,
        ENABLE_WEBGL_ANTIALIAS: true,
        ENABLE_FLOAT_OUTPUT: false,
        CLEANUP_IMAGE_CACHE: false,
        ENABLE_MULTI_TOUCH: true,
        MAX_LABEL_CANVAS_POOL_SIZE: 20,
        ENABLE_WEBGL_HIGHP_STRUCT_VALUES: false,
        BATCHER2D_MEM_INCREMENT: 144,
        CUSTOM_PIPELINE_NAME: 'Builtin',
        init() {
          if (NATIVE || MINIGAME || RUNTIME_BASED) {
            this.CLEANUP_IMAGE_CACHE = true;
          }
          const defaultValues = settings.querySettings(SettingsCategory.ENGINE, 'macros');
          if (defaultValues) {
            for (const key in defaultValues) {
              macro[key] = defaultValues[key];
            }
          }
          if (PREVIEW || EDITOR) {
            this.ENABLE_WEBGL_ANTIALIAS = true;
          }
          if (EDITOR) {
            this.ENABLE_TRANSPARENT_CANVAS = false;
          }
        }
      });
      legacyCC.macro = macro;
    }
  };
});