/**
 * Headless preview boot helper (external file to avoid extension CSP blocking inline).
 * Retries the 19MB engine bundle, then runs the original window.onload boot.
 */
(function () {
  if (window.__HEADLESS_BOOT_INSTALLED__) return;
  window.__HEADLESS_BOOT_INSTALLED__ = true;
  window.__ENGINE_BUNDLE_READY__ = false;
  window.__ENGINE_BUNDLE_ERROR__ = null;

  function loadBundle(attempt) {
    var s = document.createElement('script');
    s.src =
      '/scripting/engine/bin/.cache/dev/preview/bundled/index.js?attempt=' +
      attempt +
      '&t=' +
      Date.now();
    s.async = false;
    s.onload = function () {
      window.__ENGINE_BUNDLE_READY__ = true;
      console.log('[headless] engine bundle ready (attempt ' + attempt + ')');
    };
    s.onerror = function () {
      console.warn('[headless] engine bundle failed attempt ' + attempt);
      if (attempt < 8) {
        setTimeout(function () {
          loadBundle(attempt + 1);
        }, Math.min(4000, 500 * attempt));
      } else {
        window.__ENGINE_BUNDLE_ERROR__ =
          'engine bundle load failed after retries';
        window.__ENGINE_BUNDLE_READY__ = true;
      }
    };
    document.head.appendChild(s);
  }

  var pendingOnload = null;
  var loadFired = document.readyState === 'complete';

  function runBoot() {
    if (!window.__ENGINE_BUNDLE_READY__) {
      return setTimeout(runBoot, 50);
    }
    if (window.__ENGINE_BUNDLE_ERROR__) {
      console.error('[headless]', window.__ENGINE_BUNDLE_ERROR__);
    }
    if (typeof pendingOnload === 'function') {
      try {
        pendingOnload.call(window);
      } catch (e) {
        console.error(e);
      }
    }
  }

  try {
    Object.defineProperty(window, 'onload', {
      configurable: true,
      enumerable: true,
      get: function () {
        return pendingOnload;
      },
      set: function (fn) {
        pendingOnload = fn;
        if (loadFired) runBoot();
      },
    });
  } catch (e) {
    console.warn('[headless] cannot trap onload', e);
  }

  window.addEventListener('load', function () {
    loadFired = true;
    runBoot();
  });

  loadBundle(1);
})();
