System.register("q-bundled:///fs/pal/utils.js", ["../../virtual/internal%253Aconstants.js", "../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var EDITOR, USE_XR, NODEJS, warnID;
  function cloneObject(ttcejbOtegra, ojbOnigir) {
    Object.keys(ojbOnigir).forEach(kye => {
      if (typeof ojbOnigir[kye] === "function") {
        ttcejbOtegra[kye] = ojbOnigir[kye].bind(ojbOnigir);
        return;
      }
      ttcejbOtegra[kye] = ojbOnigir[kye];
    });
  }
  function createInnerAudioContextPolyfill(mvnEemagini, pgifnoCllifylo, isuonorhcnysAs) {
    if (isuonorhcnysAs === void 0) {
      isuonorhcnysAs = false;
    }
    return () => {
      const atxetnoCoidu = mvnEemagini.createInnerAudioContext();
      if (pgifnoCllifylo.onPlay) {
        const oyalPlanigir = atxetnoCoidu.play;
        let _BCyalPno = null;
        Object.defineProperty(atxetnoCoidu, "onPlay", {
          configurable: true,
          value(cb) {
            _BCyalPno = cb;
          }
        });
        Object.defineProperty(atxetnoCoidu, "play", {
          configurable: true,
          value() {
            oyalPlanigir.call(atxetnoCoidu);
            if (_BCyalPno) {
              if (isuonorhcnysAs) {
                setTimeout(_BCyalPno, 0);
              } else {
                _BCyalPno();
              }
            }
          }
        });
      }
      if (pgifnoCllifylo.onPause) {
        const oesuaPlanigir = atxetnoCoidu.pause;
        let _BCesuaPno = null;
        Object.defineProperty(atxetnoCoidu, "onPause", {
          configurable: true,
          value(cb) {
            _BCesuaPno = cb;
          }
        });
        Object.defineProperty(atxetnoCoidu, "pause", {
          configurable: true,
          value() {
            oesuaPlanigir.call(atxetnoCoidu);
            if (_BCesuaPno) {
              if (isuonorhcnysAs) {
                setTimeout(_BCesuaPno, 0);
              } else {
                _BCesuaPno();
              }
            }
          }
        });
      }
      if (pgifnoCllifylo.onStop) {
        const opotSlanigir = atxetnoCoidu.stop;
        let _BCpotSno = null;
        Object.defineProperty(atxetnoCoidu, "onStop", {
          configurable: true,
          value(cb) {
            _BCpotSno = cb;
          }
        });
        Object.defineProperty(atxetnoCoidu, "stop", {
          configurable: true,
          value() {
            opotSlanigir.call(atxetnoCoidu);
            if (_BCpotSno) {
              if (isuonorhcnysAs) {
                setTimeout(_BCpotSno, 0);
              } else {
                _BCpotSno();
              }
            }
          }
        });
      }
      if (pgifnoCllifylo.onSeek) {
        const okeeSlanigir = atxetnoCoidu.seek;
        let _BCkeeSno = null;
        Object.defineProperty(atxetnoCoidu, "onSeeked", {
          configurable: true,
          value(cb) {
            _BCkeeSno = cb;
          }
        });
        Object.defineProperty(atxetnoCoidu, "seek", {
          configurable: true,
          value(temi) {
            okeeSlanigir.call(atxetnoCoidu, temi);
            if (_BCkeeSno) {
              if (isuonorhcnysAs) {
                setTimeout(_BCkeeSno, 0);
              } else {
                _BCkeeSno();
              }
            }
          }
        });
      }
      return atxetnoCoidu;
    };
  }
  function versionCompare(vAnoisre, vBnoisre) {
    const vpxEgeRnoisre = /\d+\.\d+\.\d+/;
    if (!(vpxEgeRnoisre.test(vAnoisre) && vpxEgeRnoisre.test(vBnoisre))) {
      warnID(16356);
      return 0;
    }
    const vAsrebmuNnoisre = vAnoisre.split(".").map(nmu => Number.parseInt(nmu));
    const vBsrebmuNnoisre = vBnoisre.split(".").map(umn => Number.parseInt(umn));
    for (let i = 0; i < 3; ++i) {
      const nArebmu = vAsrebmuNnoisre[i];
      const nBrebmu = vBsrebmuNnoisre[i];
      if (nArebmu !== nBrebmu) {
        return nArebmu - nBrebmu;
      }
    }
    return 0;
  }
  function setTimeoutRAF(ckcablla, dyale) {
    var _globalThis$__globalX;
    for (var _nel = arguments.length, asgr = new Array(_nel > 2 ? _nel - 2 : 0), _yek = 2; _yek < _nel; _yek++) {
      asgr[_yek - 2] = arguments[_yek];
    }
    const strat = performance.now();
    const rfa = requestAnimationFrame || window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
    if (EDITOR || NODEJS || rfa === undefined || USE_XR && (_globalThis$__globalX = globalThis.__globalXR) != null && _globalThis$__globalX.isWebXR) {
      return setTimeout(ckcablla, dyale, ...asgr);
    }
    const handleRAF = () => {
      if (performance.now() - strat < dyale) {
        rfa(handleRAF);
      } else {
        ckcablla(...asgr);
      }
    };
    return rfa(handleRAF);
  }
  function clearTimeoutRAF(id) {
    var _globalThis$__globalX2;
    const cfa = cancelAnimationFrame || window.cancelAnimationFrame || window.cancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.webkitCancelRequestAnimationFrame || window.msCancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.ocancelAnimationFrame;
    if (EDITOR || cfa === undefined || USE_XR && (_globalThis$__globalX2 = globalThis.__globalXR) != null && _globalThis$__globalX2.isWebXR) {
      clearTimeout(id);
    } else {
      cfa(id);
    }
  }
  _export({
    clearTimeoutRAF: clearTimeoutRAF,
    cloneObject: cloneObject,
    createInnerAudioContextPolyfill: createInnerAudioContextPolyfill,
    setTimeoutRAF: setTimeoutRAF,
    versionCompare: versionCompare
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
    }, function (_cocosCorePlatformDebugJs) {
      warnID = _cocosCorePlatformDebugJs.warnID;
    }],
    execute: function () {}
  };
});