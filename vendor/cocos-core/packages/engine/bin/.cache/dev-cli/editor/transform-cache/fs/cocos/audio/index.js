System.register("q-bundled:///fs/cocos/audio/index.js", ["./audio-downloader.js", "./audio-source.js", "../core/index.js", "./deprecated.js", "./audio-clip.js", "../../pal/audio/type.js"], function (_export, _context) {
  "use strict";

  var AudioSource, cclegacy, js;
  return {
    setters: [function (_audioDownloaderJs) {}, function (_audioSourceJs) {
      AudioSource = _audioSourceJs.AudioSource;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
    }, function (_deprecatedJs) {}, function (_audioClipJs) {
      _export("AudioClip", _audioClipJs.AudioClip);
    }, function (_palAudioTypeJs) {
      _export("AudioPCMDataView", _palAudioTypeJs.AudioPCMDataView);
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
      _export("AudioSource", AudioSource);
      _export("AudioSourceComponent", AudioSource);
      cclegacy.AudioSourceComponent = AudioSource;
      js.setClassAlias(AudioSource, 'cc.AudioSourceComponent');
    }
  };
});