System.register("q-bundled:///fs/cocos/core/system.js", ["./value-types/enum.js"], function (_export, _context) {
  "use strict";

  var Enum, System, SystemPriority;
  _export("System", void 0);
  return {
    setters: [function (_valueTypesEnumJs) {
      Enum = _valueTypesEnumJs.Enum;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("SystemPriority", SystemPriority = /*#__PURE__*/function (SystemPriority) {
        SystemPriority[SystemPriority["LOW"] = 0] = "LOW";
        SystemPriority[SystemPriority["MEDIUM"] = 100] = "MEDIUM";
        SystemPriority[SystemPriority["HIGH"] = 200] = "HIGH";
        SystemPriority[SystemPriority["SCHEDULER"] = 2147483648] = "SCHEDULER";
        return SystemPriority;
      }({}));
      /**
       * @en Base class for all functional system managed by [[Director]].
       * @zh 功能系统的基类，由 [[Director]] 管理。
       */
      _export("System", System = class System {
        constructor() {
          this._id = '';
          this._priority = 0;
          this._executeInEditMode = false;
        }
        set priority(value) {
          this._priority = value;
        }
        get priority() {
          return this._priority;
        }
        set id(id) {
          this._id = id;
        }
        get id() {
          return this._id;
        }

        /**
         * @en Sorting between different systems.
         * @zh 不同系统间排序。
         * @param a System a
         * @param b System b
         */
        static sortByPriority(a, b) {
          if (a._priority < b._priority) {
            return 1;
          } else if (a._priority > b.priority) {
            return -1;
          } else {
            return 0;
          }
        }

        /**
         * @en Init the system, will be invoked by [[Director]] when registered, should be implemented if needed.
         * @zh 系统初始化函数，会在注册时被 [[Director]] 调用，如果需要的话应该由子类实现
         */
        init() {}
        /**
         * @en Update function of the system, it will be invoked between all components update phase and late update phase.
         * @zh 系统的帧更新函数，它会在所有组件的 update 和 lateUpdate 之间被调用
         * @param dt Delta time after the last frame
         */
        update(dt) {}
        /**
         * @en Post update function of the system, it will be invoked after all components late update phase and before the rendering process.
         * @zh 系统的帧后处理函数，它会在所有组件的 lateUpdate 之后以及渲染之前被调用
         * @param dt Delta time after the last frame
         */
        postUpdate(dt) {}
        destroy() {}
      });
      System.Priority = Enum({
        LOW: SystemPriority.LOW,
        MEDIUM: SystemPriority.MEDIUM,
        HIGH: SystemPriority.HIGH,
        SCHEDULER: SystemPriority.SCHEDULER
      });
    }
  };
});