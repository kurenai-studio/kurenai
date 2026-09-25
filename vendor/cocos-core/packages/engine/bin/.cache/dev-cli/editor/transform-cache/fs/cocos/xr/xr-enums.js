System.register("q-bundled:///fs/cocos/xr/xr-enums.js", [], function (_export, _context) {
  "use strict";

  var XREye, XRConfigKey, XRPoseType;
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en XR Eye Enum.
       * @zh XR视窗枚举。
       */
      _export("XREye", XREye = /*#__PURE__*/function (XREye) {
        /**
         * @en None.
         * @zh 无。
         */
        XREye[XREye["NONE"] = -1] = "NONE";
        /**
         * @en Left eye.
         * @zh 左眼。
         */
        XREye[XREye["LEFT"] = 0] = "LEFT";
        /**
         * @en Right eye.
         * @zh 右眼。
         */
        XREye[XREye["RIGHT"] = 1] = "RIGHT";
        return XREye;
      }({}));
      /**
       * @en XR Config Key Enum.
       * @zh XR配置键值枚举。
       */
      _export("XRConfigKey", XRConfigKey = /*#__PURE__*/function (XRConfigKey) {
        /**
         * @en Session running.
         * @zh 会话运行中。
         */
        XRConfigKey[XRConfigKey["SESSION_RUNNING"] = 2] = "SESSION_RUNNING";
        /**
         * @en View count.
         * @zh 视窗数量。
         */
        XRConfigKey[XRConfigKey["VIEW_COUNT"] = 6] = "VIEW_COUNT";
        /**
         * @en Swapchain width.
         * @zh 交换链宽度。
         */
        XRConfigKey[XRConfigKey["SWAPCHAIN_WIDTH"] = 7] = "SWAPCHAIN_WIDTH";
        /**
         * @en Swapchain height.
         * @zh 交换链高度。
         */
        XRConfigKey[XRConfigKey["SWAPCHAIN_HEIGHT"] = 8] = "SWAPCHAIN_HEIGHT";
        /**
         * @en Device IPD.
         * @zh 设备瞳距。
         */
        XRConfigKey[XRConfigKey["DEVICE_IPD"] = 37] = "DEVICE_IPD";
        /**
         * @en Split AR Glasses.
         * @zh 分体式AR眼镜。
         */
        XRConfigKey[XRConfigKey["SPLIT_AR_GLASSES"] = 42] = "SPLIT_AR_GLASSES";
        return XRConfigKey;
      }({}));
      /**
       * @en XR Pose Type Enum.
       * @zh XR姿态类型枚举。
       */
      _export("XRPoseType", XRPoseType = /*#__PURE__*/function (XRPoseType) {
        /**
         * @en The pose for left eye.
         * @zh 左眼姿态。
         */
        XRPoseType[XRPoseType["VIEW_LEFT"] = 0] = "VIEW_LEFT";
        /**
         * @en The pose for left controller.
         * @zh 左手柄姿态。
         */
        XRPoseType[XRPoseType["HAND_LEFT"] = 1] = "HAND_LEFT";
        /**
         * @en The pose for left controller's aim.
         * @zh 左手柄瞄准方向姿态。
         */
        XRPoseType[XRPoseType["AIM_LEFT"] = 2] = "AIM_LEFT";
        /**
         * @en The pose for right eye.
         * @zh 右眼姿态。
         */
        XRPoseType[XRPoseType["VIEW_RIGHT"] = 3] = "VIEW_RIGHT";
        /**
         * @en The pose for right controller.
         * @zh 右手柄姿态。
         */
        XRPoseType[XRPoseType["HAND_RIGHT"] = 4] = "HAND_RIGHT";
        /**
         * @en The pose for right controller's aim.
         * @zh 右手柄瞄准方向姿态。
         */
        XRPoseType[XRPoseType["AIM_RIGHT"] = 5] = "AIM_RIGHT";
        /**
         * @en The pose for head.
         * @zh 头部姿态。
         */
        XRPoseType[XRPoseType["HEAD_MIDDLE"] = 6] = "HEAD_MIDDLE";
        return XRPoseType;
      }({}));
    }
  };
});