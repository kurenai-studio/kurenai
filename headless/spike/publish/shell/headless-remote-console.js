/**
 * Headless Cocos preview → Remote Console bridge.
 * Enabled on localhost by default; ?remoteConsole=0 to disable.
 */
(function (global) {
  'use strict';

  var SDK_URL =
    'https://kuroneko.chat/remote-console/sdk/remote-console.legacy.umd.js';
  var DEFAULT_WS = 'wss://kuroneko.chat/remote-console/ws';
  var booted = false;

  function isEnabled() {
    if (typeof global.location === 'undefined') return false;
    var p = new URLSearchParams(global.location.search);
    if (p.get('remoteConsole') === '0') return false;
    if (p.get('remoteConsole') === '1') return true;
    var host = global.location.hostname || '';
    return host === 'localhost' || host === '127.0.0.1';
  }

  function sessionName() {
    var p = new URLSearchParams(global.location.search);
    var fromUrl = p.get('remoteConsole');
    if (fromUrl && fromUrl !== '0' && fromUrl !== '1') return fromUrl;
    var host = global.location.hostname || 'local';
    var port = global.location.port || '7456';
    return 'selfGame-headless@' + host + '-' + port;
  }

  function loadConfig() {
    return fetch('/scripting/remote-console.local.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .catch(function () {
        return null;
      });
  }

  function loadSdk(sdkUrl) {
    if (global.RemoteConsole && global.RemoteConsole.init) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-remote-console-sdk="1"]');
      if (existing) {
        existing.addEventListener('load', function () {
          resolve();
        }, { once: true });
        existing.addEventListener(
          'error',
          function () {
            reject(new Error('RemoteConsole SDK load failed'));
          },
          { once: true },
        );
        return;
      }
      var script = document.createElement('script');
      script.src = sdkUrl;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.dataset.remoteConsoleSdk = '1';
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error('RemoteConsole SDK load failed'));
      };
      document.head.appendChild(script);
    });
  }

  function boot() {
    if (booted || !isEnabled()) {
      if (!booted && typeof console !== 'undefined') {
        console.info('[RemoteConsole] disabled (add ?remoteConsole=1)');
      }
      return;
    }
    booted = true;

    loadConfig().then(function (cfg) {
      if (cfg && cfg.enabled === false) {
        console.info('[RemoteConsole] disabled by config');
        return;
      }
      var p = new URLSearchParams(global.location.search);
      var sdkUrl = (p.get('rcSdk') || (cfg && cfg.sdkUrl) || SDK_URL).trim();
      var serverUrl = (p.get('rcServer') || (cfg && cfg.serverUrl) || DEFAULT_WS).trim();
      var token = (p.get('rcToken') || (cfg && cfg.token) || '').trim() || undefined;
      var name = sessionName();
      var attempts = 0;

      function tryInit() {
        loadSdk(sdkUrl)
          .then(function () {
            var rc = global.RemoteConsole;
            if (!rc || !rc.init) throw new Error('RemoteConsole.init missing');
            var opts = { autoConnect: true, serverUrl: serverUrl, name: name };
            if (token) opts.token = token;
            rc.init(opts);
            if (rc.connect) rc.connect();
            console.info(
              '[RemoteConsole] connected name=' +
                name +
                ' sessionId=' +
                (rc.getSessionId ? rc.getSessionId() : '?'),
            );
          })
          .catch(function (err) {
            attempts += 1;
            if (attempts < 20) {
              global.setTimeout(tryInit, 1000);
              return;
            }
            console.warn('[RemoteConsole] init failed:', err);
          });
      }
      tryInit();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
