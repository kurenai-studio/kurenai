System.register("q-bundled:///fs/cocos/video/video-downloader.js", ["../asset/asset-manager/downloader.js", "../asset/asset-manager/factory.js", "../core/platform/debug.js", "./assets/video-clip.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var downloader, factory, log, VideoClip, ccwindow, ccdocument;
  // eslint-disable-next-line consistent-return
  function downloadVideo(url, options, onComplete) {
    const video = ccdocument.createElement('video');
    const source = ccdocument.createElement('source');
    video.appendChild(source);
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'blob';
    req.onload = function onload() {
      if (this.status === 200 || this.status === 0) {
        source.src = URL.createObjectURL(this.response);
        onComplete(null, video);
      } else {
        onComplete(new Error(`${req.status}(no response)`));
      }
    };
    req.onerror = function onerror() {
      const message = `load video failure - ${url}`;
      log(message);
      onComplete(new Error(message));
    };
    req.send();
  }
  function createVideoClip(id, data, options, onComplete) {
    const out = new VideoClip();
    out._nativeUrl = id;
    out._nativeAsset = data;
    onComplete(null, out);
  }
  _export("downloadVideo", downloadVideo);
  return {
    setters: [function (_assetAssetManagerDownloaderJs) {
      downloader = _assetAssetManagerDownloaderJs.default;
    }, function (_assetAssetManagerFactoryJs) {
      factory = _assetAssetManagerFactoryJs.default;
    }, function (_corePlatformDebugJs) {
      log = _corePlatformDebugJs.log;
    }, function (_assetsVideoClipJs) {
      VideoClip = _assetsVideoClipJs.VideoClip;
    }, function (_coreGlobalExportsJs) {
      ccwindow = _coreGlobalExportsJs.ccwindow;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
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
      ccdocument = ccwindow.document;
      downloader.register({
        // Video
        '.mp4': downloadVideo,
        '.avi': downloadVideo,
        '.mov': downloadVideo,
        '.mpg': downloadVideo,
        '.mpeg': downloadVideo,
        '.rm': downloadVideo,
        '.rmvb': downloadVideo
      });
      factory.register({
        // Video
        '.mp4': createVideoClip,
        '.avi': createVideoClip,
        '.mov': createVideoClip,
        '.mpg': createVideoClip,
        '.mpeg': createVideoClip,
        '.rm': createVideoClip,
        '.rmvb': createVideoClip
      });
    }
  };
});