System.register("q-bundled:///fs/cocos/video/video-player-enums.js", ["../core/value-types/index.js"], function (_export, _context) {
  "use strict";

  var Enum, ResourceType, VideoPlayerEventType, READY_STATE;
  return {
    setters: [function (_coreValueTypesIndexJs) {
      Enum = _coreValueTypesIndexJs.Enum;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en Enum for video resource type.
       * @zh 视频资源类型枚举。
       */
      _export("ResourceType", ResourceType = Enum({
        /**
         * @en
         * The remote resource type.
         * @zh
         * 远程视频。
         */
        REMOTE: 0,
        /**
         * @en
         * The local resource type.
         * @zh
         * 本地视频。
         */
        LOCAL: 1
      }));
      _export("VideoPlayerEventType", VideoPlayerEventType = /*#__PURE__*/function (VideoPlayerEventType) {
        /**
         * @en None.
         * @zh 无。
         */
        VideoPlayerEventType["NONE"] = "none";
        /**
         * @en The video is playing.
         * @zh 视频播放中。
         */
        VideoPlayerEventType["PLAYING"] = "playing";
        /**
         * @en Video paused.
         * @zh 视频暂停中。
         */
        VideoPlayerEventType["PAUSED"] = "paused";
        /**
         * @en Video stopped.
         * @zh 视频停止中。
         */
        VideoPlayerEventType["STOPPED"] = "stopped";
        /**
         * @en Video playback complete.
         * @zh 视频播放完毕。
         */
        VideoPlayerEventType["COMPLETED"] = "completed";
        /**
         * @en Video metadata loading complete.
         * @zh 视频元数据加载完毕。
         */
        VideoPlayerEventType["META_LOADED"] = "meta-loaded";
        /**
         * @en The video is ready to play when loaded.
         * @zh 视频加载完毕可播放。
         */
        VideoPlayerEventType["READY_TO_PLAY"] = "ready-to-play";
        /**
         * @en Errors triggered while processing video
         * @zh 处理视频时触发的错误。
         */
        VideoPlayerEventType["ERROR"] = "error";
        /**
         * @en Video is clicked.
         * @zh 视频被点击。
         */
        VideoPlayerEventType["CLICKED"] = "clicked";
        return VideoPlayerEventType;
      }({}));
      _export("READY_STATE", READY_STATE = /*#__PURE__*/function (READY_STATE) {
        /**
         * @en No information about whether audio/video is ready.
         * @zh 没有关于音频/视频是否就绪的信息。
         */
        READY_STATE[READY_STATE["HAVE_NOTHING"] = 0] = "HAVE_NOTHING";
        /**
         * @en Metadata about audio/video ready.
         * @zh 关于音频/视频就绪的元数据。
         */
        READY_STATE[READY_STATE["HAVE_METADATA"] = 1] = "HAVE_METADATA";
        /**
         * @en Data is available for the current playback position, but not enough data to play the next frame/ms.
         * @zh 当前播放位置的数据可用，但没有足够的数据来播放下一帧/毫秒。
         */
        READY_STATE[READY_STATE["HAVE_CURRENT_DATA"] = 2] = "HAVE_CURRENT_DATA";
        /**
         * @en Data for the current and at least the next frame is available.
         * @zh 当前及至少下一帧的数据是可用的。
         */
        READY_STATE[READY_STATE["HAVE_FUTURE_DATA"] = 3] = "HAVE_FUTURE_DATA";
        /**
         * @en Available data is enough to start playback.
         * @zh 可用数据足以开始播放。
         */
        READY_STATE[READY_STATE["HAVE_ENOUGH_DATA"] = 4] = "HAVE_ENOUGH_DATA";
        return READY_STATE;
      }({}));
    }
  };
});