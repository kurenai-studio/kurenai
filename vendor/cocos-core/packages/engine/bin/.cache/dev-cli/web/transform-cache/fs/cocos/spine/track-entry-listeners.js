System.register("q-bundled:///fs/cocos/spine/track-entry-listeners.js", ["./lib/spine-core.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var spine, warn, TrackEntryListeners, _TrackEntryListeners, _listener_ID, _track_ID;
  _export("TrackEntryListeners", void 0);
  return {
    setters: [function (_libSpineCoreJs) {
      spine = _libSpineCoreJs.default;
    }, function (_coreIndexJs) {
      warn = _coreIndexJs.warn;
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
      _listener_ID = 0;
      _track_ID = 0;
      _export("TrackEntryListeners", TrackEntryListeners = class TrackEntryListeners {
        constructor() {
          this.start = void 0;
          this.interrupt = void 0;
          this.end = void 0;
          this.dispose = void 0;
          this.complete = void 0;
          this.event = void 0;
        }
        static getListeners(entry, instance) {
          if (!entry.listener) {
            entry.listener = new TrackEntryListeners();
            const id = ++_track_ID;
            instance.setTrackEntryListener(id, entry);
            TrackEntryListeners._trackSet.set(id, entry);
          }
          return entry.listener;
        }
        static emitListener(id, entry, event, eventType) {
          const listener = TrackEntryListeners._listenerSet.get(id);
          if (!listener) return;
          switch (eventType) {
            case spine.EventType.event:
              if (listener.event) {
                listener.event(entry, event);
              }
              break;
            case spine.EventType.start:
              if (listener.start) {
                listener.start(entry);
              }
              break;
            case spine.EventType.interrupt:
              if (listener.interrupt) {
                listener.interrupt(entry);
              }
              break;
            case spine.EventType.end:
              if (listener.end) {
                listener.end(entry);
              }
              break;
            case spine.EventType.dispose:
              if (listener.dispose) {
                listener.dispose(entry);
              }
              break;
            case spine.EventType.complete:
              if (listener.complete) {
                listener.complete(entry);
              }
              break;
            default:
              warn('emitListener doesn\'t handled', eventType);
              break;
          }
        }
        static emitTrackEntryListener(id, entry, event, eventType) {
          const curTrack = this._trackSet.get(id);
          if (!curTrack) return;
          switch (eventType) {
            case spine.EventType.start:
              if (curTrack.listener.start) {
                curTrack.listener.start(entry);
              }
              break;
            case spine.EventType.interrupt:
              if (curTrack.listener.interrupt) {
                curTrack.listener.interrupt(entry);
              }
              break;
            case spine.EventType.end:
              if (curTrack.listener.end) {
                curTrack.listener.end(entry);
              }
              break;
            case spine.EventType.dispose:
              if (curTrack.listener.dispose) {
                curTrack.listener.dispose(entry);
              }
              this._trackSet.delete(id);
              curTrack.listener = null;
              break;
            case spine.EventType.complete:
              if (curTrack.listener.complete) {
                curTrack.listener.complete(entry);
              }
              break;
            case spine.EventType.event:
              if (curTrack.listener.event) {
                curTrack.listener.event(entry, event);
              }
              break;
            default:
              warn('TrackEntry doesn\'t handled', eventType);
              break;
          }
        }
        static addListener(listener) {
          const id = ++_listener_ID;
          TrackEntryListeners._listenerSet.set(id, listener);
          return id;
        }
        static removeListener(id) {
          TrackEntryListeners._listenerSet.delete(id);
        }
      });
      _TrackEntryListeners = TrackEntryListeners;
      TrackEntryListeners._listenerSet = new Map();
      TrackEntryListeners._trackSet = new Map();
      globalThis.TrackEntryListeners = TrackEntryListeners;
    }
  };
});