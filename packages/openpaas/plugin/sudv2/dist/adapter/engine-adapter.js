(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

(function () {
  if (!(cc && cc.internal && cc.internal.EditBox)) {
    return;
  }
  var EditBoxComp = cc.internal.EditBox;
  var js = cc.js;
  var KeyboardReturnType = EditBoxComp.KeyboardReturnType;
  var MAX_VALUE = 65535;
  var KEYBOARD_HIDE_TIME = 600;
  var _hideKeyboardTimeout = null;
  var _currentEditBoxImpl = null;
  function getKeyboardReturnType(type) {
    switch (type) {
      case KeyboardReturnType.DEFAULT:
      case KeyboardReturnType.DONE:
        return 'done';
      case KeyboardReturnType.SEND:
        return 'send';
      case KeyboardReturnType.SEARCH:
        return 'search';
      case KeyboardReturnType.GO:
        return 'go';
      case KeyboardReturnType.NEXT:
        return 'next';
    }
    return 'done';
  }
  function MiniGameEditBoxImpl() {
    this._delegate = null;
    this._editing = false;
    this._eventListeners = {
      onKeyboardInput: null,
      onKeyboardConfirm: null,
      onKeyboardComplete: null
    };
  }
  js.extend(MiniGameEditBoxImpl, EditBoxComp._EditBoxImpl);
  EditBoxComp._EditBoxImpl = MiniGameEditBoxImpl;
  Object.assign(MiniGameEditBoxImpl.prototype, {
    init: function init(delegate) {
      if (!delegate) {
        cc.error('EditBox init failed');
        return;
      }
      this._delegate = delegate;
    },
    beginEditing: function beginEditing() {
      var _this = this;
      if (this._editing) {
        return;
      }
      this._ensureKeyboardHide(function () {
        var delegate = _this._delegate;
        _this._showKeyboard();
        _this._registerKeyboardEvent();
        _this._editing = true;
        _currentEditBoxImpl = _this;
        delegate._editBoxEditingDidBegan();
      });
    },
    endEditing: function endEditing() {
      this._hideKeyboard();
      var cbs = this._eventListeners;
      cbs.onKeyboardComplete && cbs.onKeyboardComplete();
    },
    _registerKeyboardEvent: function _registerKeyboardEvent() {
      var self = this;
      var delegate = this._delegate;
      var cbs = this._eventListeners;
      cbs.onKeyboardInput = function (res) {
        if (delegate._string !== res.value) {
          delegate._editBoxTextChanged(res.value);
        }
      };
      cbs.onKeyboardConfirm = function (res) {
        delegate._editBoxEditingReturn();
        var cbs = self._eventListeners;
        cbs.onKeyboardComplete && cbs.onKeyboardComplete();
      };
      cbs.onKeyboardComplete = function () {
        self._editing = false;
        _currentEditBoxImpl = null;
        self._unregisterKeyboardEvent();
        delegate._editBoxEditingDidEnded();
      };
      ral.onKeyboardInput(cbs.onKeyboardInput);
      ral.onKeyboardConfirm(cbs.onKeyboardConfirm);
      ral.onKeyboardComplete(cbs.onKeyboardComplete);
    },
    _unregisterKeyboardEvent: function _unregisterKeyboardEvent() {
      var cbs = this._eventListeners;
      if (cbs.onKeyboardInput) {
        ral.offKeyboardInput(cbs.onKeyboardInput);
        cbs.onKeyboardInput = null;
      }
      if (cbs.onKeyboardConfirm) {
        ral.offKeyboardConfirm(cbs.onKeyboardConfirm);
        cbs.onKeyboardConfirm = null;
      }
      if (cbs.onKeyboardComplete) {
        ral.offKeyboardComplete(cbs.onKeyboardComplete);
        cbs.onKeyboardComplete = null;
      }
    },
    _otherEditing: function _otherEditing() {
      return !!_currentEditBoxImpl && _currentEditBoxImpl !== this && _currentEditBoxImpl._editing;
    },
    _ensureKeyboardHide: function _ensureKeyboardHide(cb) {
      var otherEditing = this._otherEditing();
      if (!otherEditing && !_hideKeyboardTimeout) {
        return cb();
      }
      if (_hideKeyboardTimeout) {
        clearTimeout(_hideKeyboardTimeout);
      }
      if (otherEditing) {
        _currentEditBoxImpl.endEditing();
      }
      _hideKeyboardTimeout = setTimeout(function () {
        _hideKeyboardTimeout = null;
        cb();
      }, KEYBOARD_HIDE_TIME);
    },
    _showKeyboard: function _showKeyboard() {
      var delegate = this._delegate;
      var multiline = delegate.inputMode === EditBoxComp.InputMode.ANY;
      ral.showKeyboard({
        defaultValue: delegate.string,
        maxLength: delegate.maxLength < 0 ? MAX_VALUE : delegate.maxLength,
        multiple: multiline,
        confirmHold: false,
        confirmType: getKeyboardReturnType(delegate.returnType),
        success: function success(res) {},
        fail: function fail(res) {
          cc.warn(res.errMsg);
        }
      });
    },
    _hideKeyboard: function _hideKeyboard() {
      ral.hideKeyboard({
        success: function success(res) {},
        fail: function fail(res) {
          cc.warn(res.errMsg);
        }
      });
    }
  });
})();

},{}],2:[function(require,module,exports){
"use strict";

var _require = require('./fs-utils'),
  getUserDataPath = _require.getUserDataPath,
  readJsonSync = _require.readJsonSync,
  makeDirSync = _require.makeDirSync,
  writeFileSync = _require.writeFileSync,
  copyFile = _require.copyFile,
  downloadFile = _require.downloadFile,
  deleteFile = _require.deleteFile,
  rmdirSync = _require.rmdirSync,
  unzip = _require.unzip,
  isOutOfStorage = _require.isOutOfStorage;
var checkNextPeriod = false;
var writeCacheFileList = null;
var cleaning = false;
var suffix = 0;
var REGEX = /^https?:\/\/.*/;
var cacheManager = {
  cacheDir: 'gamecaches',
  cachedFileName: 'cacheList.json',
  cacheEnabled: true,
  autoClear: true,
  cacheInterval: 500,
  deleteInterval: 500,
  writeFileInterval: 2000,
  outOfStorage: false,
  tempFiles: null,
  cachedFiles: null,
  cacheQueue: {},
  version: '1.0',
  getCache: function getCache(url) {
    return this.cachedFiles.has(url) ? this.cachedFiles.get(url).url : '';
  },
  getTemp: function getTemp(url) {
    return this.tempFiles.has(url) ? this.tempFiles.get(url) : '';
  },
  init: function init() {
    this.cacheDir = "".concat(getUserDataPath(), "/").concat(this.cacheDir);
    var cacheFilePath = "".concat(this.cacheDir, "/").concat(this.cachedFileName);
    var result = readJsonSync(cacheFilePath);
    if (result instanceof Error || !result.version) {
      if (!(result instanceof Error)) rmdirSync(this.cacheDir, true);
      this.cachedFiles = new cc.AssetManager.Cache();
      makeDirSync(this.cacheDir, true);
      writeFileSync(cacheFilePath, JSON.stringify({
        files: this.cachedFiles._map,
        version: this.version
      }), 'utf8');
    } else {
      this.cachedFiles = new cc.AssetManager.Cache(result.files);
    }
    this.tempFiles = new cc.AssetManager.Cache();
  },
  updateLastTime: function updateLastTime(url) {
    if (this.cachedFiles.has(url)) {
      var cache = this.cachedFiles.get(url);
      cache.lastTime = Date.now();
    }
  },
  _write: function _write() {
    writeCacheFileList = null;
    writeFileSync("".concat(this.cacheDir, "/").concat(this.cachedFileName), JSON.stringify({
      files: this.cachedFiles._map,
      version: this.version
    }), 'utf8');
  },
  writeCacheFile: function writeCacheFile() {
    if (!writeCacheFileList) {
      writeCacheFileList = setTimeout(this._write.bind(this), this.writeFileInterval);
    }
  },
  _cache: function _cache() {
    checkNextPeriod = false;
    var self = this;
    var id = '';
    for (var key in this.cacheQueue) {
      id = key;
      break;
    }
    if (!id) return;
    var _this$cacheQueue$id = this.cacheQueue[id],
      srcUrl = _this$cacheQueue$id.srcUrl,
      isCopy = _this$cacheQueue$id.isCopy,
      cacheBundleRoot = _this$cacheQueue$id.cacheBundleRoot;
    var time = Date.now().toString();
    var localPath = '';
    if (cacheBundleRoot) {
      localPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat(suffix++).concat(cc.path.extname(id));
    } else {
      localPath = "".concat(this.cacheDir, "/").concat(time).concat(suffix++).concat(cc.path.extname(id));
    }
    function callback(err) {
      if (err) {
        if (isOutOfStorage(err.message)) {
          self.outOfStorage = true;
          self.autoClear && self.clearLRU();
          return;
        }
      } else {
        self.cachedFiles.add(id, {
          bundle: cacheBundleRoot,
          url: localPath,
          lastTime: time
        });
        self.writeCacheFile();
      }
      delete self.cacheQueue[id];
      if (!cc.js.isEmptyObject(self.cacheQueue) && !checkNextPeriod) {
        checkNextPeriod = true;
        setTimeout(self._cache.bind(self), self.cacheInterval);
      }
    }
    if (!isCopy) {
      downloadFile(srcUrl, localPath, null, callback);
    } else {
      copyFile(srcUrl, localPath, callback);
    }
  },
  cacheFile: function cacheFile(id, srcUrl, cacheEnabled, cacheBundleRoot, isCopy) {
    cacheEnabled = cacheEnabled !== undefined ? cacheEnabled : this.cacheEnabled;
    if (!cacheEnabled || this.cacheQueue[id] || this.cachedFiles.has(id)) return;
    this.cacheQueue[id] = {
      srcUrl: srcUrl,
      cacheBundleRoot: cacheBundleRoot,
      isCopy: isCopy
    };
    if (!checkNextPeriod && !this.outOfStorage) {
      checkNextPeriod = true;
      setTimeout(this._cache.bind(this), this.cacheInterval);
    }
  },
  clearCache: function clearCache() {
    var _this = this;
    rmdirSync(this.cacheDir, true);
    this.cachedFiles = new cc.AssetManager.Cache();
    makeDirSync(this.cacheDir, true);
    this.outOfStorage = false;
    clearTimeout(writeCacheFileList);
    this._write();
    cc.assetManager.bundles.forEach(function (bundle) {
      if (REGEX.test(bundle.base)) _this.makeBundleFolder(bundle.name);
    });
  },
  clearLRU: function clearLRU() {
    if (cleaning) return;
    cleaning = true;
    var caches = [];
    var self = this;
    this.cachedFiles.forEach(function (val, key) {
      if (self._isZipFile(key) && cc.assetManager.bundles.find(function (bundle) {
        return bundle.base.indexOf(val.url) !== -1;
      })) return;
      caches.push({
        originUrl: key,
        url: val.url,
        lastTime: val.lastTime
      });
    });
    caches.sort(function (a, b) {
      return a.lastTime - b.lastTime;
    });
    caches.length = Math.floor(caches.length / 3);
    if (caches.length < 3) {
      console.warn('Insufficient storage, cleaning now');
    } else {
      caches.length = Math.floor(caches.length / 3);
    }
    for (var i = 0, l = caches.length; i < l; i++) {
      var cacheKey = "".concat(cc.assetManager.utils.getUuidFromURL(caches[i].originUrl), "@native");
      cc.assetManager.files.remove(cacheKey);
      this.cachedFiles.remove(caches[i].originUrl);
    }
    clearTimeout(writeCacheFileList);
    this._write();
    function deferredDelete() {
      var item = caches.pop();
      self._removePathOrFile(item.originUrl, item.url);
      if (caches.length > 0) {
        setTimeout(deferredDelete, self.deleteInterval);
      } else {
        cleaning = false;
      }
    }
    setTimeout(deferredDelete, self.deleteInterval);
  },
  removeCache: function removeCache(url) {
    if (this.cachedFiles.has(url)) {
      var path = this.cachedFiles.remove(url).url;
      clearTimeout(writeCacheFileList);
      this._write();
      this._removePathOrFile(url, path);
    }
  },
  _removePathOrFile: function _removePathOrFile(url, path) {
    if (this._isZipFile(url)) {
      if (this._isZipFile(path)) {
        deleteFile(path, this._deleteFileCB.bind(this));
      } else {
        rmdirSync(path, true);
        this._deleteFileCB();
      }
    } else {
      deleteFile(path, this._deleteFileCB.bind(this));
    }
  },
  _deleteFileCB: function _deleteFileCB(err) {
    if (!err) this.outOfStorage = false;
  },
  makeBundleFolder: function makeBundleFolder(bundleName) {
    makeDirSync("".concat(this.cacheDir, "/").concat(bundleName), true);
  },
  unzipAndCacheBundle: function unzipAndCacheBundle(id, zipFilePath, cacheBundleRoot, onComplete) {
    var time = Date.now().toString();
    var targetPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat(suffix++);
    var self = this;
    makeDirSync(targetPath, true);
    unzip(zipFilePath, targetPath, function (err) {
      if (err) {
        rmdirSync(targetPath, true);
        if (isOutOfStorage(err.message)) {
          self.outOfStorage = true;
          self.autoClear && self.clearLRU();
        }
        onComplete && onComplete(err);
        return;
      }
      self.cachedFiles.add(id, {
        bundle: cacheBundleRoot,
        url: targetPath,
        lastTime: time
      });
      self.writeCacheFile();
      onComplete && onComplete(null, targetPath);
    });
  },
  _isZipFile: function _isZipFile(url) {
    return url.slice(-4) === '.zip';
  }
};
cc.assetManager.cacheManager = module.exports = cacheManager;

},{"./fs-utils":4}],3:[function(require,module,exports){
"use strict";

var originalCreateCanvas = ral.createCanvas.bind(ral);
ral.createCanvas = function () {
  var canvas = originalCreateCanvas();
  canvas.style = {};
  return canvas;
};

},{}],4:[function(require,module,exports){
"use strict";

var fs = ral.getFileSystemManager ? ral.getFileSystemManager() : null;
var outOfStorageRegExp = /the maximum size of the file storage/;
var fsUtils = {
  fs: fs,
  _subpackagesPath: 'usr_',
  isOutOfStorage: function isOutOfStorage(errMsg) {
    return outOfStorageRegExp.test(errMsg);
  },
  getUserDataPath: function getUserDataPath() {
    return ral.env.USER_DATA_PATH;
  },
  checkFsValid: function checkFsValid() {
    if (!fs) {
      console.warn('can not get the file system!');
      return false;
    }
    return true;
  },
  deleteFile: function deleteFile(filePath, onComplete) {
    fs.unlink({
      filePath: filePath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Delete file failed: path: ".concat(filePath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg));
      }
    });
  },
  downloadFile: function downloadFile(remoteUrl, filePath, header, onProgress, onComplete) {
    var options = {
      url: remoteUrl,
      success: function success(res) {
        if (res.statusCode === 200) {
          onComplete && onComplete(null, res.tempFilePath || res.filePath);
        } else {
          if (res.filePath) {
            fsUtils.deleteFile(res.filePath);
          }
          console.warn("Download file failed: path: ".concat(remoteUrl, " message: ").concat(res.statusCode));
          onComplete && onComplete(new Error(res.statusCode), null);
        }
      },
      fail: function fail(res) {
        console.warn("Download file failed: path: ".concat(remoteUrl, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg), null);
      }
    };
    if (filePath) options.filePath = filePath;
    if (header) options.header = header;
    var task = ral.downloadFile(options);
    onProgress && task.onProgressUpdate(onProgress);
  },
  saveFile: function saveFile(srcPath, destPath, onComplete) {
    ral.saveFile({
      tempFilePath: srcPath,
      filePath: destPath,
      success: function success(res) {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Save file failed: path: ".concat(srcPath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg));
      }
    });
  },
  copyFile: function copyFile(srcPath, destPath, onComplete) {
    fs.copyFile({
      srcPath: srcPath,
      destPath: destPath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Copy file failed: path: ".concat(srcPath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg));
      }
    });
  },
  writeFile: function writeFile(path, data, encoding, onComplete) {
    fs.writeFile({
      filePath: path,
      encoding: encoding,
      data: data,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Write file failed: path: ".concat(path, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg));
      }
    });
  },
  writeFileSync: function writeFileSync(path, data, encoding) {
    try {
      fs.writeFileSync(path, data, encoding);
      return null;
    } catch (e) {
      console.warn("Write file failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  readFile: function readFile(filePath, encoding, onComplete) {
    fs.readFile({
      filePath: filePath,
      encoding: encoding,
      success: function success(res) {
        onComplete && onComplete(null, res.data);
      },
      fail: function fail(res) {
        console.warn("Read file failed: path: ".concat(filePath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg), null);
      }
    });
  },
  readDir: function readDir(filePath, onComplete) {
    fs.readdir({
      dirPath: filePath,
      success: function success(res) {
        onComplete && onComplete(null, res.files);
      },
      fail: function fail(res) {
        console.warn("Read directory failed: path: ".concat(filePath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error(res.errMsg), null);
      }
    });
  },
  readText: function readText(filePath, onComplete) {
    fsUtils.readFile(filePath, 'utf8', onComplete);
  },
  readArrayBuffer: function readArrayBuffer(filePath, onComplete) {
    fsUtils.readFile(filePath, 'binary', onComplete);
  },
  readJson: function readJson(filePath, onComplete) {
    fsUtils.readFile(filePath, 'utf8', function (err, text) {
      var out = null;
      if (!err) {
        try {
          out = JSON.parse(text);
        } catch (e) {
          console.warn("Read json failed: path: ".concat(filePath, " message: ").concat(e.message));
          err = new Error(e.message);
        }
      }
      onComplete && onComplete(err, out);
    });
  },
  readJsonSync: function readJsonSync(path) {
    try {
      var str = fs.readFileSync(path, 'utf8');
      return JSON.parse(str);
    } catch (e) {
      console.warn("Read json failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  makeDirSync: function makeDirSync(path, recursive) {
    try {
      fs.mkdirSync(path, recursive);
      return null;
    } catch (e) {
      console.warn("Make directory failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  rmdirSync: function rmdirSync(dirPath, recursive) {
    try {
      fs.rmdirSync(dirPath, recursive);
      return null;
    } catch (e) {
      console.warn("rm directory failed: path: ".concat(dirPath, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  exists: function exists(filePath, onComplete) {
    fs.access({
      path: filePath,
      success: function success() {
        onComplete && onComplete(true);
      },
      fail: function fail() {
        onComplete && onComplete(false);
      }
    });
  },
  loadSubpackage: function loadSubpackage(name, onProgress, onComplete) {
    var task = ral.loadSubpackage({
      name: "".concat(fsUtils._subpackagesPath).concat(name),
      success: function success() {
        onComplete && onComplete();
      },
      fail: function fail(res) {
        console.warn("Load Subpackage failed: path: ".concat(name, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error("Failed to load subpackage ".concat(name, ": ").concat(res.errMsg)));
      }
    });
    onProgress && task.onProgressUpdate(onProgress);
    return task;
  },
  unzip: function unzip(zipFilePath, targetPath, onComplete) {
    fs.unzip({
      zipFilePath: zipFilePath,
      targetPath: targetPath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("unzip failed: path: ".concat(zipFilePath, " message: ").concat(res.errMsg));
        onComplete && onComplete(new Error("unzip failed: ".concat(res.errMsg)));
      }
    });
  }
};
window.fsUtils = module.exports = fsUtils;

},{}],5:[function(require,module,exports){
"use strict";

cc.game.restart = function () {};
ral.onWindowResize && ral.onWindowResize(function (width, height) {
  cc.game.canvas && cc.view.setCanvasSize(width, height);
});

},{}],6:[function(require,module,exports){
"use strict";

var cacheManager = require('../common/engine/cache-manager');
var _require = require('../common/engine/fs-utils'),
  downloadFile = _require.downloadFile,
  readText = _require.readText,
  readArrayBuffer = _require.readArrayBuffer,
  readJson = _require.readJson,
  loadSubpackage = _require.loadSubpackage,
  getUserDataPath = _require.getUserDataPath,
  _subpackagesPath = _require._subpackagesPath;
cc.assetManager.fsUtils = ral.fsUtils;
var REGEX = /^https?:\/\/.*/;
var downloader = cc.assetManager.downloader;
var parser = cc.assetManager.parser;
var presets = cc.assetManager.presets;
downloader.maxConcurrency = 12;
downloader.maxRequestsPerFrame = 64;
presets.scene.maxConcurrency = 12;
presets.scene.maxRequestsPerFrame = 64;
var subpackages = {};
var loadedScripts = {};
function downloadScript(url, options, onComplete) {
  if (REGEX.test(url)) {
    onComplete && onComplete(new Error('Can not load remote scripts'));
    return;
  }
  if (loadedScripts[url]) return onComplete && onComplete();
  console.log("[sudv2 asset-manager] downloadScript: ".concat(url));
  require(url);
  loadedScripts[url] = true;
  onComplete && onComplete(null);
}
function handleZip(url, options, onComplete) {
  var cachedUnzip = cacheManager.cachedFiles.get(url);
  if (cachedUnzip) {
    cacheManager.updateLastTime(url);
    onComplete && onComplete(null, cachedUnzip.url);
  } else if (REGEX.test(url)) {
    downloadFile(url, null, options.header, options.onFileProgress, function (err, downloadedZipPath) {
      if (err) {
        onComplete && onComplete(err);
        return;
      }
      cacheManager.unzipAndCacheBundle(url, downloadedZipPath, options.__cacheBundleRoot__, onComplete);
    });
  } else {
    cacheManager.unzipAndCacheBundle(url, url, options.__cacheBundleRoot__, onComplete);
  }
}
function loadAudioPlayer(url, options, onComplete) {
  cc.AudioPlayer.load(url).then(function (player) {
    var audioMeta = {
      player: player,
      url: url,
      duration: player.duration,
      type: player.type
    };
    onComplete(null, audioMeta);
  })["catch"](function (err) {
    onComplete(err);
  });
}
function download(url, func, options, onFileProgress, onComplete) {
  var result = transformUrl(url, options);
  if (result.inLocal) {
    func(result.url, options, onComplete);
  } else if (result.inCache) {
    cacheManager.updateLastTime(url);
    func(result.url, options, function (err, data) {
      if (err) {
        cacheManager.removeCache(url);
      }
      onComplete(err, data);
    });
  } else {
    downloadFile(url, null, options.header, onFileProgress, function (err, path) {
      if (err) {
        onComplete(err, null);
        return;
      }
      func(path, options, function (err, data) {
        if (!err) {
          cacheManager.tempFiles.add(url, path);
          cacheManager.cacheFile(url, path, options.cacheEnabled, options.__cacheBundleRoot__, true);
        }
        onComplete(err, data);
      });
    });
  }
}
function parseArrayBuffer(url, options, onComplete) {
  readArrayBuffer(url, onComplete);
}
function parseText(url, options, onComplete) {
  readText(url, onComplete);
}
function parseJson(url, options, onComplete) {
  readJson(url, onComplete);
}
function downloadText(url, options, onComplete) {
  download(url, parseText, options, options.onFileProgress, onComplete);
}
function downloadJson(url, options, onComplete) {
  download(url, parseJson, options, options.onFileProgress, onComplete);
}
function loadFont(url, options, onComplete) {
  var fontFamilyName = _getFontFamily(url);
  var fontFace = new FontFace(fontFamilyName, "url('".concat(url, "')"));
  document.fonts.add(fontFace);
  fontFace.load();
  fontFace.loaded.then(function () {
    onComplete(null, fontFamilyName);
  }, function () {
    cc.warnID(4933, fontFamilyName);
    onComplete(null, fontFamilyName);
  });
}
function _getFontFamily(fontHandle) {
  var ttfIndex = fontHandle.lastIndexOf('.ttf');
  if (ttfIndex === -1) {
    ttfIndex = fontHandle.lastIndexOf('.tmp');
  }
  if (ttfIndex === -1) return fontHandle;
  var slashPos = fontHandle.lastIndexOf('/');
  var fontFamilyName;
  if (slashPos === -1) {
    fontFamilyName = "".concat(fontHandle.substring(0, ttfIndex), "_LABEL");
  } else {
    fontFamilyName = "".concat(fontHandle.substring(slashPos + 1, ttfIndex), "_LABEL");
  }
  return fontFamilyName;
}
function doNothing(content, options, onComplete) {
  onComplete(null, content);
}
function downloadAsset(url, options, onComplete) {
  download(url, doNothing, options, options.onFileProgress, onComplete);
}
function downloadBundle(nameOrUrl, options, onComplete) {
  var bundleName = cc.path.basename(nameOrUrl);
  var version = options.version || cc.assetManager.downloader.bundleVers[bundleName];
  var suffix = version ? "".concat(version, ".") : '';
  if (subpackages[bundleName]) {
    var config = "".concat(bundleName, "/config.").concat(suffix, "json");
    loadSubpackage(bundleName, options.onFileProgress, function (err) {
      if (err) {
        onComplete(err, null);
        return;
      }
      downloadJson(config, options, function (err, data) {
        data && (data.base = "".concat(bundleName, "/"));
        onComplete(err, data);
      });
    });
  } else {
    var js;
    var url;
    if (REGEX.test(nameOrUrl) || nameOrUrl.startsWith(getUserDataPath())) {
      url = nameOrUrl;
      js = "src/bundle-scripts/".concat(bundleName, "/index.").concat(suffix, "js");
      cacheManager.makeBundleFolder(bundleName);
    } else if (downloader.remoteBundles.indexOf(bundleName) !== -1) {
      url = "".concat(downloader.remoteServerAddress, "remote/").concat(bundleName);
      js = "src/bundle-scripts/".concat(bundleName, "/index.").concat(suffix, "js");
      cacheManager.makeBundleFolder(bundleName);
    } else {
      url = "assets/".concat(bundleName);
      js = "assets/".concat(bundleName, "/index.").concat(suffix, "js");
    }
    if (!loadedScripts[js]) {
      var requireBefore = require;
      var globalRequireBefore = typeof globalThis !== 'undefined' ? globalThis.require : undefined;
      console.log("[sudv2 asset-manager] load bundle script: ".concat(js));
      console.log('require before:', require);
      require(js);
      console.log('require after:', require);
      console.log("[sudv2 asset-manager] require unchanged after loading ".concat(js, ": local=").concat(requireBefore === require, ", global=").concat(globalRequireBefore === (typeof globalThis !== 'undefined' ? globalThis.require : undefined)));
      loadedScripts[js] = true;
    }
    options.__cacheBundleRoot__ = bundleName;
    var config = "".concat(url, "/config.").concat(suffix, "json");
    downloadJson(config, options, function (err, data) {
      if (err) {
        onComplete && onComplete(err);
        return;
      }
      if (data.isZip) {
        var zipVersion = data.zipVersion;
        var zipUrl = "".concat(url, "/res.").concat(zipVersion ? "".concat(zipVersion, ".") : '', "zip");
        handleZip(zipUrl, options, function (err, unzipPath) {
          if (err) {
            onComplete && onComplete(err);
            return;
          }
          data.base = "".concat(unzipPath, "/res/");
          onComplete && onComplete(null, data);
        });
      } else {
        data.base = "".concat(url, "/");
        onComplete && onComplete(null, data);
      }
    });
  }
}
function downloadArrayBuffer(url, options, onComplete) {
  download(url, parseArrayBuffer, options, options.onFileProgress, onComplete);
}
var originParsePVRTex = parser.parsePVRTex;
var parsePVRTex = function parsePVRTex(file, options, onComplete) {
  readArrayBuffer(file, function (err, data) {
    if (err) return onComplete(err);
    originParsePVRTex(data, options, onComplete);
  });
};
var originParsePKMTex = parser.parsePKMTex;
var parsePKMTex = function parsePKMTex(file, options, onComplete) {
  readArrayBuffer(file, function (err, data) {
    if (err) return onComplete(err);
    originParsePKMTex(data, options, onComplete);
  });
};
var originParseASTCTex = parser.parseASTCTex;
var parseASTCTex = function parseASTCTex(file, options, onComplete) {
  readArrayBuffer(file, function (err, data) {
    if (err) return onComplete(err);
    originParseASTCTex(data, options, onComplete);
  });
};
var originParsePlist = parser.parsePlist;
var parsePlist = function parsePlist(url, options, onComplete) {
  readText(url, function (err, file) {
    if (err) return onComplete(err);
    originParsePlist(file, options, onComplete);
  });
};
downloader.downloadScript = downloadScript;
downloader._downloadArrayBuffer = downloadArrayBuffer;
downloader._downloadJson = downloadJson;
parser.parsePVRTex = parsePVRTex;
parser.parsePKMTex = parsePKMTex;
parser.parseASTCTex = parseASTCTex;
parser.parsePlist = parsePlist;
downloader.register({
  '.js': downloadScript,
  '.mp3': downloadAsset,
  '.ogg': downloadAsset,
  '.wav': downloadAsset,
  '.m4a': downloadAsset,
  '.png': downloadAsset,
  '.jpg': downloadAsset,
  '.bmp': downloadAsset,
  '.jpeg': downloadAsset,
  '.gif': downloadAsset,
  '.ico': downloadAsset,
  '.tiff': downloadAsset,
  '.image': downloadAsset,
  '.webp': downloadAsset,
  '.pvr': downloadAsset,
  '.pkm': downloadAsset,
  '.astc': downloadAsset,
  '.font': downloadAsset,
  '.eot': downloadAsset,
  '.ttf': downloadAsset,
  '.woff': downloadAsset,
  '.svg': downloadAsset,
  '.ttc': downloadAsset,
  '.txt': downloadAsset,
  '.xml': downloadAsset,
  '.vsh': downloadAsset,
  '.fsh': downloadAsset,
  '.atlas': downloadAsset,
  '.tmx': downloadAsset,
  '.tsx': downloadAsset,
  '.plist': downloadAsset,
  '.fnt': downloadAsset,
  '.json': downloadJson,
  '.ExportJson': downloadAsset,
  '.binary': downloadAsset,
  '.bin': downloadAsset,
  '.dbbin': downloadAsset,
  '.skel': downloadAsset,
  '.mp4': downloadAsset,
  '.avi': downloadAsset,
  '.mov': downloadAsset,
  '.mpg': downloadAsset,
  '.mpeg': downloadAsset,
  '.rm': downloadAsset,
  '.rmvb': downloadAsset,
  bundle: downloadBundle,
  "default": downloadText
});
parser.register({
  '.png': downloader.downloadDomImage,
  '.jpg': downloader.downloadDomImage,
  '.bmp': downloader.downloadDomImage,
  '.jpeg': downloader.downloadDomImage,
  '.gif': downloader.downloadDomImage,
  '.ico': downloader.downloadDomImage,
  '.tiff': downloader.downloadDomImage,
  '.image': downloader.downloadDomImage,
  '.webp': downloader.downloadDomImage,
  '.pvr': parsePVRTex,
  '.pkm': parsePKMTex,
  '.astc': parseASTCTex,
  '.font': loadFont,
  '.eot': loadFont,
  '.ttf': loadFont,
  '.woff': loadFont,
  '.svg': loadFont,
  '.ttc': loadFont,
  '.mp3': loadAudioPlayer,
  '.ogg': loadAudioPlayer,
  '.wav': loadAudioPlayer,
  '.m4a': loadAudioPlayer,
  '.txt': parseText,
  '.xml': parseText,
  '.vsh': parseText,
  '.fsh': parseText,
  '.atlas': parseText,
  '.tmx': parseText,
  '.tsx': parseText,
  '.fnt': parseText,
  '.plist': parsePlist,
  '.binary': parseArrayBuffer,
  '.bin': parseArrayBuffer,
  '.dbbin': parseArrayBuffer,
  '.skel': parseArrayBuffer,
  '.ExportJson': parseJson
});
var transformUrl = function transformUrl(url, options) {
  var inLocal = false;
  var inCache = false;
  var isInUserDataPath = url.startsWith(getUserDataPath());
  if (isInUserDataPath) {
    inLocal = true;
  } else if (REGEX.test(url)) {
    if (!options.reload) {
      var cache = cacheManager.cachedFiles.get(url);
      if (cache) {
        inCache = true;
        url = cache.url;
      } else {
        var tempUrl = cacheManager.tempFiles.get(url);
        if (tempUrl) {
          inLocal = true;
          url = tempUrl;
        }
      }
    }
  } else {
    inLocal = true;
  }
  return {
    url: url,
    inLocal: inLocal,
    inCache: inCache
  };
};
cc.assetManager.transformPipeline.append(function (task) {
  var input = task.output = task.input;
  for (var i = 0, l = input.length; i < l; i++) {
    var item = input[i];
    var options = item.options;
    if (!item.config) {
      if (item.ext === 'bundle') continue;
      options.cacheEnabled = options.cacheEnabled !== undefined ? options.cacheEnabled : false;
    } else {
      options.__cacheBundleRoot__ = item.config.name;
    }
    if (item.ext === '.cconb') {
      item.url = item.url.replace(item.ext, '.bin');
    } else if (item.ext === '.ccon') {
      item.url = item.url.replace(item.ext, '.json');
    }
  }
});
var originInit = cc.assetManager.init;
cc.assetManager.init = function (options) {
  originInit.call(cc.assetManager, options);
  var subpacks = cc.settings.querySettings('assets', 'subpackages');
  subpacks && subpacks.forEach(function (x) {
    return subpackages[x] = "".concat(_subpackagesPath).concat(x);
  });
  cacheManager.init();
};

},{"../common/engine/cache-manager":2,"../common/engine/fs-utils":4}],7:[function(require,module,exports){
"use strict";

require('../common/engine/fs-utils');
require('../common/engine/canvas');
require('./asset-manager.js');
require('../common/engine/EditBox.js');
require('../common/engine/game.js');

},{"../common/engine/EditBox.js":1,"../common/engine/canvas":3,"../common/engine/fs-utils":4,"../common/engine/game.js":5,"./asset-manager.js":6}]},{},[7]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJlbmdpbmUtYWRhcHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKCkge1xuICBpZiAoIShjYyAmJiBjYy5pbnRlcm5hbCAmJiBjYy5pbnRlcm5hbC5FZGl0Qm94KSkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgRWRpdEJveENvbXAgPSBjYy5pbnRlcm5hbC5FZGl0Qm94O1xuICB2YXIganMgPSBjYy5qcztcbiAgdmFyIEtleWJvYXJkUmV0dXJuVHlwZSA9IEVkaXRCb3hDb21wLktleWJvYXJkUmV0dXJuVHlwZTtcbiAgdmFyIE1BWF9WQUxVRSA9IDY1NTM1O1xuICB2YXIgS0VZQk9BUkRfSElERV9USU1FID0gNjAwO1xuICB2YXIgX2hpZGVLZXlib2FyZFRpbWVvdXQgPSBudWxsO1xuICB2YXIgX2N1cnJlbnRFZGl0Qm94SW1wbCA9IG51bGw7XG4gIGZ1bmN0aW9uIGdldEtleWJvYXJkUmV0dXJuVHlwZSh0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIEtleWJvYXJkUmV0dXJuVHlwZS5ERUZBVUxUOlxuICAgICAgY2FzZSBLZXlib2FyZFJldHVyblR5cGUuRE9ORTpcbiAgICAgICAgcmV0dXJuICdkb25lJztcbiAgICAgIGNhc2UgS2V5Ym9hcmRSZXR1cm5UeXBlLlNFTkQ6XG4gICAgICAgIHJldHVybiAnc2VuZCc7XG4gICAgICBjYXNlIEtleWJvYXJkUmV0dXJuVHlwZS5TRUFSQ0g6XG4gICAgICAgIHJldHVybiAnc2VhcmNoJztcbiAgICAgIGNhc2UgS2V5Ym9hcmRSZXR1cm5UeXBlLkdPOlxuICAgICAgICByZXR1cm4gJ2dvJztcbiAgICAgIGNhc2UgS2V5Ym9hcmRSZXR1cm5UeXBlLk5FWFQ6XG4gICAgICAgIHJldHVybiAnbmV4dCc7XG4gICAgfVxuICAgIHJldHVybiAnZG9uZSc7XG4gIH1cbiAgZnVuY3Rpb24gTWluaUdhbWVFZGl0Qm94SW1wbCgpIHtcbiAgICB0aGlzLl9kZWxlZ2F0ZSA9IG51bGw7XG4gICAgdGhpcy5fZWRpdGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzID0ge1xuICAgICAgb25LZXlib2FyZElucHV0OiBudWxsLFxuICAgICAgb25LZXlib2FyZENvbmZpcm06IG51bGwsXG4gICAgICBvbktleWJvYXJkQ29tcGxldGU6IG51bGxcbiAgICB9O1xuICB9XG4gIGpzLmV4dGVuZChNaW5pR2FtZUVkaXRCb3hJbXBsLCBFZGl0Qm94Q29tcC5fRWRpdEJveEltcGwpO1xuICBFZGl0Qm94Q29tcC5fRWRpdEJveEltcGwgPSBNaW5pR2FtZUVkaXRCb3hJbXBsO1xuICBPYmplY3QuYXNzaWduKE1pbmlHYW1lRWRpdEJveEltcGwucHJvdG90eXBlLCB7XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChkZWxlZ2F0ZSkge1xuICAgICAgaWYgKCFkZWxlZ2F0ZSkge1xuICAgICAgICBjYy5lcnJvcignRWRpdEJveCBpbml0IGZhaWxlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9kZWxlZ2F0ZSA9IGRlbGVnYXRlO1xuICAgIH0sXG4gICAgYmVnaW5FZGl0aW5nOiBmdW5jdGlvbiBiZWdpbkVkaXRpbmcoKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKHRoaXMuX2VkaXRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fZW5zdXJlS2V5Ym9hcmRIaWRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlbGVnYXRlID0gX3RoaXMuX2RlbGVnYXRlO1xuICAgICAgICBfdGhpcy5fc2hvd0tleWJvYXJkKCk7XG4gICAgICAgIF90aGlzLl9yZWdpc3RlcktleWJvYXJkRXZlbnQoKTtcbiAgICAgICAgX3RoaXMuX2VkaXRpbmcgPSB0cnVlO1xuICAgICAgICBfY3VycmVudEVkaXRCb3hJbXBsID0gX3RoaXM7XG4gICAgICAgIGRlbGVnYXRlLl9lZGl0Qm94RWRpdGluZ0RpZEJlZ2FuKCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGVuZEVkaXRpbmc6IGZ1bmN0aW9uIGVuZEVkaXRpbmcoKSB7XG4gICAgICB0aGlzLl9oaWRlS2V5Ym9hcmQoKTtcbiAgICAgIHZhciBjYnMgPSB0aGlzLl9ldmVudExpc3RlbmVycztcbiAgICAgIGNicy5vbktleWJvYXJkQ29tcGxldGUgJiYgY2JzLm9uS2V5Ym9hcmRDb21wbGV0ZSgpO1xuICAgIH0sXG4gICAgX3JlZ2lzdGVyS2V5Ym9hcmRFdmVudDogZnVuY3Rpb24gX3JlZ2lzdGVyS2V5Ym9hcmRFdmVudCgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBkZWxlZ2F0ZSA9IHRoaXMuX2RlbGVnYXRlO1xuICAgICAgdmFyIGNicyA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzO1xuICAgICAgY2JzLm9uS2V5Ym9hcmRJbnB1dCA9IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgaWYgKGRlbGVnYXRlLl9zdHJpbmcgIT09IHJlcy52YWx1ZSkge1xuICAgICAgICAgIGRlbGVnYXRlLl9lZGl0Qm94VGV4dENoYW5nZWQocmVzLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNicy5vbktleWJvYXJkQ29uZmlybSA9IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgZGVsZWdhdGUuX2VkaXRCb3hFZGl0aW5nUmV0dXJuKCk7XG4gICAgICAgIHZhciBjYnMgPSBzZWxmLl9ldmVudExpc3RlbmVycztcbiAgICAgICAgY2JzLm9uS2V5Ym9hcmRDb21wbGV0ZSAmJiBjYnMub25LZXlib2FyZENvbXBsZXRlKCk7XG4gICAgICB9O1xuICAgICAgY2JzLm9uS2V5Ym9hcmRDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5fZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICBfY3VycmVudEVkaXRCb3hJbXBsID0gbnVsbDtcbiAgICAgICAgc2VsZi5fdW5yZWdpc3RlcktleWJvYXJkRXZlbnQoKTtcbiAgICAgICAgZGVsZWdhdGUuX2VkaXRCb3hFZGl0aW5nRGlkRW5kZWQoKTtcbiAgICAgIH07XG4gICAgICByYWwub25LZXlib2FyZElucHV0KGNicy5vbktleWJvYXJkSW5wdXQpO1xuICAgICAgcmFsLm9uS2V5Ym9hcmRDb25maXJtKGNicy5vbktleWJvYXJkQ29uZmlybSk7XG4gICAgICByYWwub25LZXlib2FyZENvbXBsZXRlKGNicy5vbktleWJvYXJkQ29tcGxldGUpO1xuICAgIH0sXG4gICAgX3VucmVnaXN0ZXJLZXlib2FyZEV2ZW50OiBmdW5jdGlvbiBfdW5yZWdpc3RlcktleWJvYXJkRXZlbnQoKSB7XG4gICAgICB2YXIgY2JzID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnM7XG4gICAgICBpZiAoY2JzLm9uS2V5Ym9hcmRJbnB1dCkge1xuICAgICAgICByYWwub2ZmS2V5Ym9hcmRJbnB1dChjYnMub25LZXlib2FyZElucHV0KTtcbiAgICAgICAgY2JzLm9uS2V5Ym9hcmRJbnB1dCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoY2JzLm9uS2V5Ym9hcmRDb25maXJtKSB7XG4gICAgICAgIHJhbC5vZmZLZXlib2FyZENvbmZpcm0oY2JzLm9uS2V5Ym9hcmRDb25maXJtKTtcbiAgICAgICAgY2JzLm9uS2V5Ym9hcmRDb25maXJtID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChjYnMub25LZXlib2FyZENvbXBsZXRlKSB7XG4gICAgICAgIHJhbC5vZmZLZXlib2FyZENvbXBsZXRlKGNicy5vbktleWJvYXJkQ29tcGxldGUpO1xuICAgICAgICBjYnMub25LZXlib2FyZENvbXBsZXRlID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIF9vdGhlckVkaXRpbmc6IGZ1bmN0aW9uIF9vdGhlckVkaXRpbmcoKSB7XG4gICAgICByZXR1cm4gISFfY3VycmVudEVkaXRCb3hJbXBsICYmIF9jdXJyZW50RWRpdEJveEltcGwgIT09IHRoaXMgJiYgX2N1cnJlbnRFZGl0Qm94SW1wbC5fZWRpdGluZztcbiAgICB9LFxuICAgIF9lbnN1cmVLZXlib2FyZEhpZGU6IGZ1bmN0aW9uIF9lbnN1cmVLZXlib2FyZEhpZGUoY2IpIHtcbiAgICAgIHZhciBvdGhlckVkaXRpbmcgPSB0aGlzLl9vdGhlckVkaXRpbmcoKTtcbiAgICAgIGlmICghb3RoZXJFZGl0aW5nICYmICFfaGlkZUtleWJvYXJkVGltZW91dCkge1xuICAgICAgICByZXR1cm4gY2IoKTtcbiAgICAgIH1cbiAgICAgIGlmIChfaGlkZUtleWJvYXJkVGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoX2hpZGVLZXlib2FyZFRpbWVvdXQpO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVyRWRpdGluZykge1xuICAgICAgICBfY3VycmVudEVkaXRCb3hJbXBsLmVuZEVkaXRpbmcoKTtcbiAgICAgIH1cbiAgICAgIF9oaWRlS2V5Ym9hcmRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9oaWRlS2V5Ym9hcmRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgY2IoKTtcbiAgICAgIH0sIEtFWUJPQVJEX0hJREVfVElNRSk7XG4gICAgfSxcbiAgICBfc2hvd0tleWJvYXJkOiBmdW5jdGlvbiBfc2hvd0tleWJvYXJkKCkge1xuICAgICAgdmFyIGRlbGVnYXRlID0gdGhpcy5fZGVsZWdhdGU7XG4gICAgICB2YXIgbXVsdGlsaW5lID0gZGVsZWdhdGUuaW5wdXRNb2RlID09PSBFZGl0Qm94Q29tcC5JbnB1dE1vZGUuQU5ZO1xuICAgICAgcmFsLnNob3dLZXlib2FyZCh7XG4gICAgICAgIGRlZmF1bHRWYWx1ZTogZGVsZWdhdGUuc3RyaW5nLFxuICAgICAgICBtYXhMZW5ndGg6IGRlbGVnYXRlLm1heExlbmd0aCA8IDAgPyBNQVhfVkFMVUUgOiBkZWxlZ2F0ZS5tYXhMZW5ndGgsXG4gICAgICAgIG11bHRpcGxlOiBtdWx0aWxpbmUsXG4gICAgICAgIGNvbmZpcm1Ib2xkOiBmYWxzZSxcbiAgICAgICAgY29uZmlybVR5cGU6IGdldEtleWJvYXJkUmV0dXJuVHlwZShkZWxlZ2F0ZS5yZXR1cm5UeXBlKSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcyhyZXMpIHt9LFxuICAgICAgICBmYWlsOiBmdW5jdGlvbiBmYWlsKHJlcykge1xuICAgICAgICAgIGNjLndhcm4ocmVzLmVyck1zZyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgX2hpZGVLZXlib2FyZDogZnVuY3Rpb24gX2hpZGVLZXlib2FyZCgpIHtcbiAgICAgIHJhbC5oaWRlS2V5Ym9hcmQoe1xuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiBzdWNjZXNzKHJlcykge30sXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIGZhaWwocmVzKSB7XG4gICAgICAgICAgY2Mud2FybihyZXMuZXJyTXNnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn0pKCk7XG5cbn0se31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfcmVxdWlyZSA9IHJlcXVpcmUoJy4vZnMtdXRpbHMnKSxcbiAgZ2V0VXNlckRhdGFQYXRoID0gX3JlcXVpcmUuZ2V0VXNlckRhdGFQYXRoLFxuICByZWFkSnNvblN5bmMgPSBfcmVxdWlyZS5yZWFkSnNvblN5bmMsXG4gIG1ha2VEaXJTeW5jID0gX3JlcXVpcmUubWFrZURpclN5bmMsXG4gIHdyaXRlRmlsZVN5bmMgPSBfcmVxdWlyZS53cml0ZUZpbGVTeW5jLFxuICBjb3B5RmlsZSA9IF9yZXF1aXJlLmNvcHlGaWxlLFxuICBkb3dubG9hZEZpbGUgPSBfcmVxdWlyZS5kb3dubG9hZEZpbGUsXG4gIGRlbGV0ZUZpbGUgPSBfcmVxdWlyZS5kZWxldGVGaWxlLFxuICBybWRpclN5bmMgPSBfcmVxdWlyZS5ybWRpclN5bmMsXG4gIHVuemlwID0gX3JlcXVpcmUudW56aXAsXG4gIGlzT3V0T2ZTdG9yYWdlID0gX3JlcXVpcmUuaXNPdXRPZlN0b3JhZ2U7XG52YXIgY2hlY2tOZXh0UGVyaW9kID0gZmFsc2U7XG52YXIgd3JpdGVDYWNoZUZpbGVMaXN0ID0gbnVsbDtcbnZhciBjbGVhbmluZyA9IGZhbHNlO1xudmFyIHN1ZmZpeCA9IDA7XG52YXIgUkVHRVggPSAvXmh0dHBzPzpcXC9cXC8uKi87XG52YXIgY2FjaGVNYW5hZ2VyID0ge1xuICBjYWNoZURpcjogJ2dhbWVjYWNoZXMnLFxuICBjYWNoZWRGaWxlTmFtZTogJ2NhY2hlTGlzdC5qc29uJyxcbiAgY2FjaGVFbmFibGVkOiB0cnVlLFxuICBhdXRvQ2xlYXI6IHRydWUsXG4gIGNhY2hlSW50ZXJ2YWw6IDUwMCxcbiAgZGVsZXRlSW50ZXJ2YWw6IDUwMCxcbiAgd3JpdGVGaWxlSW50ZXJ2YWw6IDIwMDAsXG4gIG91dE9mU3RvcmFnZTogZmFsc2UsXG4gIHRlbXBGaWxlczogbnVsbCxcbiAgY2FjaGVkRmlsZXM6IG51bGwsXG4gIGNhY2hlUXVldWU6IHt9LFxuICB2ZXJzaW9uOiAnMS4wJyxcbiAgZ2V0Q2FjaGU6IGZ1bmN0aW9uIGdldENhY2hlKHVybCkge1xuICAgIHJldHVybiB0aGlzLmNhY2hlZEZpbGVzLmhhcyh1cmwpID8gdGhpcy5jYWNoZWRGaWxlcy5nZXQodXJsKS51cmwgOiAnJztcbiAgfSxcbiAgZ2V0VGVtcDogZnVuY3Rpb24gZ2V0VGVtcCh1cmwpIHtcbiAgICByZXR1cm4gdGhpcy50ZW1wRmlsZXMuaGFzKHVybCkgPyB0aGlzLnRlbXBGaWxlcy5nZXQodXJsKSA6ICcnO1xuICB9LFxuICBpbml0OiBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuY2FjaGVEaXIgPSBcIlwiLmNvbmNhdChnZXRVc2VyRGF0YVBhdGgoKSwgXCIvXCIpLmNvbmNhdCh0aGlzLmNhY2hlRGlyKTtcbiAgICB2YXIgY2FjaGVGaWxlUGF0aCA9IFwiXCIuY29uY2F0KHRoaXMuY2FjaGVEaXIsIFwiL1wiKS5jb25jYXQodGhpcy5jYWNoZWRGaWxlTmFtZSk7XG4gICAgdmFyIHJlc3VsdCA9IHJlYWRKc29uU3luYyhjYWNoZUZpbGVQYXRoKTtcbiAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgRXJyb3IgfHwgIXJlc3VsdC52ZXJzaW9uKSB7XG4gICAgICBpZiAoIShyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcikpIHJtZGlyU3luYyh0aGlzLmNhY2hlRGlyLCB0cnVlKTtcbiAgICAgIHRoaXMuY2FjaGVkRmlsZXMgPSBuZXcgY2MuQXNzZXRNYW5hZ2VyLkNhY2hlKCk7XG4gICAgICBtYWtlRGlyU3luYyh0aGlzLmNhY2hlRGlyLCB0cnVlKTtcbiAgICAgIHdyaXRlRmlsZVN5bmMoY2FjaGVGaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBmaWxlczogdGhpcy5jYWNoZWRGaWxlcy5fbWFwLFxuICAgICAgICB2ZXJzaW9uOiB0aGlzLnZlcnNpb25cbiAgICAgIH0pLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhY2hlZEZpbGVzID0gbmV3IGNjLkFzc2V0TWFuYWdlci5DYWNoZShyZXN1bHQuZmlsZXMpO1xuICAgIH1cbiAgICB0aGlzLnRlbXBGaWxlcyA9IG5ldyBjYy5Bc3NldE1hbmFnZXIuQ2FjaGUoKTtcbiAgfSxcbiAgdXBkYXRlTGFzdFRpbWU6IGZ1bmN0aW9uIHVwZGF0ZUxhc3RUaW1lKHVybCkge1xuICAgIGlmICh0aGlzLmNhY2hlZEZpbGVzLmhhcyh1cmwpKSB7XG4gICAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlZEZpbGVzLmdldCh1cmwpO1xuICAgICAgY2FjaGUubGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgfSxcbiAgX3dyaXRlOiBmdW5jdGlvbiBfd3JpdGUoKSB7XG4gICAgd3JpdGVDYWNoZUZpbGVMaXN0ID0gbnVsbDtcbiAgICB3cml0ZUZpbGVTeW5jKFwiXCIuY29uY2F0KHRoaXMuY2FjaGVEaXIsIFwiL1wiKS5jb25jYXQodGhpcy5jYWNoZWRGaWxlTmFtZSksIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGZpbGVzOiB0aGlzLmNhY2hlZEZpbGVzLl9tYXAsXG4gICAgICB2ZXJzaW9uOiB0aGlzLnZlcnNpb25cbiAgICB9KSwgJ3V0ZjgnKTtcbiAgfSxcbiAgd3JpdGVDYWNoZUZpbGU6IGZ1bmN0aW9uIHdyaXRlQ2FjaGVGaWxlKCkge1xuICAgIGlmICghd3JpdGVDYWNoZUZpbGVMaXN0KSB7XG4gICAgICB3cml0ZUNhY2hlRmlsZUxpc3QgPSBzZXRUaW1lb3V0KHRoaXMuX3dyaXRlLmJpbmQodGhpcyksIHRoaXMud3JpdGVGaWxlSW50ZXJ2YWwpO1xuICAgIH1cbiAgfSxcbiAgX2NhY2hlOiBmdW5jdGlvbiBfY2FjaGUoKSB7XG4gICAgY2hlY2tOZXh0UGVyaW9kID0gZmFsc2U7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBpZCA9ICcnO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmNhY2hlUXVldWUpIHtcbiAgICAgIGlkID0ga2V5O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICghaWQpIHJldHVybjtcbiAgICB2YXIgX3RoaXMkY2FjaGVRdWV1ZSRpZCA9IHRoaXMuY2FjaGVRdWV1ZVtpZF0sXG4gICAgICBzcmNVcmwgPSBfdGhpcyRjYWNoZVF1ZXVlJGlkLnNyY1VybCxcbiAgICAgIGlzQ29weSA9IF90aGlzJGNhY2hlUXVldWUkaWQuaXNDb3B5LFxuICAgICAgY2FjaGVCdW5kbGVSb290ID0gX3RoaXMkY2FjaGVRdWV1ZSRpZC5jYWNoZUJ1bmRsZVJvb3Q7XG4gICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpLnRvU3RyaW5nKCk7XG4gICAgdmFyIGxvY2FsUGF0aCA9ICcnO1xuICAgIGlmIChjYWNoZUJ1bmRsZVJvb3QpIHtcbiAgICAgIGxvY2FsUGF0aCA9IFwiXCIuY29uY2F0KHRoaXMuY2FjaGVEaXIsIFwiL1wiKS5jb25jYXQoY2FjaGVCdW5kbGVSb290LCBcIi9cIikuY29uY2F0KHRpbWUpLmNvbmNhdChzdWZmaXgrKykuY29uY2F0KGNjLnBhdGguZXh0bmFtZShpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFBhdGggPSBcIlwiLmNvbmNhdCh0aGlzLmNhY2hlRGlyLCBcIi9cIikuY29uY2F0KHRpbWUpLmNvbmNhdChzdWZmaXgrKykuY29uY2F0KGNjLnBhdGguZXh0bmFtZShpZCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjYWxsYmFjayhlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKGlzT3V0T2ZTdG9yYWdlKGVyci5tZXNzYWdlKSkge1xuICAgICAgICAgIHNlbGYub3V0T2ZTdG9yYWdlID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLmF1dG9DbGVhciAmJiBzZWxmLmNsZWFyTFJVKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmNhY2hlZEZpbGVzLmFkZChpZCwge1xuICAgICAgICAgIGJ1bmRsZTogY2FjaGVCdW5kbGVSb290LFxuICAgICAgICAgIHVybDogbG9jYWxQYXRoLFxuICAgICAgICAgIGxhc3RUaW1lOiB0aW1lXG4gICAgICAgIH0pO1xuICAgICAgICBzZWxmLndyaXRlQ2FjaGVGaWxlKCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgc2VsZi5jYWNoZVF1ZXVlW2lkXTtcbiAgICAgIGlmICghY2MuanMuaXNFbXB0eU9iamVjdChzZWxmLmNhY2hlUXVldWUpICYmICFjaGVja05leHRQZXJpb2QpIHtcbiAgICAgICAgY2hlY2tOZXh0UGVyaW9kID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dChzZWxmLl9jYWNoZS5iaW5kKHNlbGYpLCBzZWxmLmNhY2hlSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzQ29weSkge1xuICAgICAgZG93bmxvYWRGaWxlKHNyY1VybCwgbG9jYWxQYXRoLCBudWxsLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvcHlGaWxlKHNyY1VybCwgbG9jYWxQYXRoLCBjYWxsYmFjayk7XG4gICAgfVxuICB9LFxuICBjYWNoZUZpbGU6IGZ1bmN0aW9uIGNhY2hlRmlsZShpZCwgc3JjVXJsLCBjYWNoZUVuYWJsZWQsIGNhY2hlQnVuZGxlUm9vdCwgaXNDb3B5KSB7XG4gICAgY2FjaGVFbmFibGVkID0gY2FjaGVFbmFibGVkICE9PSB1bmRlZmluZWQgPyBjYWNoZUVuYWJsZWQgOiB0aGlzLmNhY2hlRW5hYmxlZDtcbiAgICBpZiAoIWNhY2hlRW5hYmxlZCB8fCB0aGlzLmNhY2hlUXVldWVbaWRdIHx8IHRoaXMuY2FjaGVkRmlsZXMuaGFzKGlkKSkgcmV0dXJuO1xuICAgIHRoaXMuY2FjaGVRdWV1ZVtpZF0gPSB7XG4gICAgICBzcmNVcmw6IHNyY1VybCxcbiAgICAgIGNhY2hlQnVuZGxlUm9vdDogY2FjaGVCdW5kbGVSb290LFxuICAgICAgaXNDb3B5OiBpc0NvcHlcbiAgICB9O1xuICAgIGlmICghY2hlY2tOZXh0UGVyaW9kICYmICF0aGlzLm91dE9mU3RvcmFnZSkge1xuICAgICAgY2hlY2tOZXh0UGVyaW9kID0gdHJ1ZTtcbiAgICAgIHNldFRpbWVvdXQodGhpcy5fY2FjaGUuYmluZCh0aGlzKSwgdGhpcy5jYWNoZUludGVydmFsKTtcbiAgICB9XG4gIH0sXG4gIGNsZWFyQ2FjaGU6IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBybWRpclN5bmModGhpcy5jYWNoZURpciwgdHJ1ZSk7XG4gICAgdGhpcy5jYWNoZWRGaWxlcyA9IG5ldyBjYy5Bc3NldE1hbmFnZXIuQ2FjaGUoKTtcbiAgICBtYWtlRGlyU3luYyh0aGlzLmNhY2hlRGlyLCB0cnVlKTtcbiAgICB0aGlzLm91dE9mU3RvcmFnZSA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh3cml0ZUNhY2hlRmlsZUxpc3QpO1xuICAgIHRoaXMuX3dyaXRlKCk7XG4gICAgY2MuYXNzZXRNYW5hZ2VyLmJ1bmRsZXMuZm9yRWFjaChmdW5jdGlvbiAoYnVuZGxlKSB7XG4gICAgICBpZiAoUkVHRVgudGVzdChidW5kbGUuYmFzZSkpIF90aGlzLm1ha2VCdW5kbGVGb2xkZXIoYnVuZGxlLm5hbWUpO1xuICAgIH0pO1xuICB9LFxuICBjbGVhckxSVTogZnVuY3Rpb24gY2xlYXJMUlUoKSB7XG4gICAgaWYgKGNsZWFuaW5nKSByZXR1cm47XG4gICAgY2xlYW5pbmcgPSB0cnVlO1xuICAgIHZhciBjYWNoZXMgPSBbXTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5jYWNoZWRGaWxlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgaWYgKHNlbGYuX2lzWmlwRmlsZShrZXkpICYmIGNjLmFzc2V0TWFuYWdlci5idW5kbGVzLmZpbmQoZnVuY3Rpb24gKGJ1bmRsZSkge1xuICAgICAgICByZXR1cm4gYnVuZGxlLmJhc2UuaW5kZXhPZih2YWwudXJsKSAhPT0gLTE7XG4gICAgICB9KSkgcmV0dXJuO1xuICAgICAgY2FjaGVzLnB1c2goe1xuICAgICAgICBvcmlnaW5Vcmw6IGtleSxcbiAgICAgICAgdXJsOiB2YWwudXJsLFxuICAgICAgICBsYXN0VGltZTogdmFsLmxhc3RUaW1lXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBjYWNoZXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgcmV0dXJuIGEubGFzdFRpbWUgLSBiLmxhc3RUaW1lO1xuICAgIH0pO1xuICAgIGNhY2hlcy5sZW5ndGggPSBNYXRoLmZsb29yKGNhY2hlcy5sZW5ndGggLyAzKTtcbiAgICBpZiAoY2FjaGVzLmxlbmd0aCA8IDMpIHtcbiAgICAgIGNvbnNvbGUud2FybignSW5zdWZmaWNpZW50IHN0b3JhZ2UsIGNsZWFuaW5nIG5vdycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWNoZXMubGVuZ3RoID0gTWF0aC5mbG9vcihjYWNoZXMubGVuZ3RoIC8gMyk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2FjaGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGNhY2hlS2V5ID0gXCJcIi5jb25jYXQoY2MuYXNzZXRNYW5hZ2VyLnV0aWxzLmdldFV1aWRGcm9tVVJMKGNhY2hlc1tpXS5vcmlnaW5VcmwpLCBcIkBuYXRpdmVcIik7XG4gICAgICBjYy5hc3NldE1hbmFnZXIuZmlsZXMucmVtb3ZlKGNhY2hlS2V5KTtcbiAgICAgIHRoaXMuY2FjaGVkRmlsZXMucmVtb3ZlKGNhY2hlc1tpXS5vcmlnaW5VcmwpO1xuICAgIH1cbiAgICBjbGVhclRpbWVvdXQod3JpdGVDYWNoZUZpbGVMaXN0KTtcbiAgICB0aGlzLl93cml0ZSgpO1xuICAgIGZ1bmN0aW9uIGRlZmVycmVkRGVsZXRlKCkge1xuICAgICAgdmFyIGl0ZW0gPSBjYWNoZXMucG9wKCk7XG4gICAgICBzZWxmLl9yZW1vdmVQYXRoT3JGaWxlKGl0ZW0ub3JpZ2luVXJsLCBpdGVtLnVybCk7XG4gICAgICBpZiAoY2FjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2V0VGltZW91dChkZWZlcnJlZERlbGV0ZSwgc2VsZi5kZWxldGVJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhbmluZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBzZXRUaW1lb3V0KGRlZmVycmVkRGVsZXRlLCBzZWxmLmRlbGV0ZUludGVydmFsKTtcbiAgfSxcbiAgcmVtb3ZlQ2FjaGU6IGZ1bmN0aW9uIHJlbW92ZUNhY2hlKHVybCkge1xuICAgIGlmICh0aGlzLmNhY2hlZEZpbGVzLmhhcyh1cmwpKSB7XG4gICAgICB2YXIgcGF0aCA9IHRoaXMuY2FjaGVkRmlsZXMucmVtb3ZlKHVybCkudXJsO1xuICAgICAgY2xlYXJUaW1lb3V0KHdyaXRlQ2FjaGVGaWxlTGlzdCk7XG4gICAgICB0aGlzLl93cml0ZSgpO1xuICAgICAgdGhpcy5fcmVtb3ZlUGF0aE9yRmlsZSh1cmwsIHBhdGgpO1xuICAgIH1cbiAgfSxcbiAgX3JlbW92ZVBhdGhPckZpbGU6IGZ1bmN0aW9uIF9yZW1vdmVQYXRoT3JGaWxlKHVybCwgcGF0aCkge1xuICAgIGlmICh0aGlzLl9pc1ppcEZpbGUodXJsKSkge1xuICAgICAgaWYgKHRoaXMuX2lzWmlwRmlsZShwYXRoKSkge1xuICAgICAgICBkZWxldGVGaWxlKHBhdGgsIHRoaXMuX2RlbGV0ZUZpbGVDQi5iaW5kKHRoaXMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJtZGlyU3luYyhwYXRoLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fZGVsZXRlRmlsZUNCKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZUZpbGUocGF0aCwgdGhpcy5fZGVsZXRlRmlsZUNCLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfSxcbiAgX2RlbGV0ZUZpbGVDQjogZnVuY3Rpb24gX2RlbGV0ZUZpbGVDQihlcnIpIHtcbiAgICBpZiAoIWVycikgdGhpcy5vdXRPZlN0b3JhZ2UgPSBmYWxzZTtcbiAgfSxcbiAgbWFrZUJ1bmRsZUZvbGRlcjogZnVuY3Rpb24gbWFrZUJ1bmRsZUZvbGRlcihidW5kbGVOYW1lKSB7XG4gICAgbWFrZURpclN5bmMoXCJcIi5jb25jYXQodGhpcy5jYWNoZURpciwgXCIvXCIpLmNvbmNhdChidW5kbGVOYW1lKSwgdHJ1ZSk7XG4gIH0sXG4gIHVuemlwQW5kQ2FjaGVCdW5kbGU6IGZ1bmN0aW9uIHVuemlwQW5kQ2FjaGVCdW5kbGUoaWQsIHppcEZpbGVQYXRoLCBjYWNoZUJ1bmRsZVJvb3QsIG9uQ29tcGxldGUpIHtcbiAgICB2YXIgdGltZSA9IERhdGUubm93KCkudG9TdHJpbmcoKTtcbiAgICB2YXIgdGFyZ2V0UGF0aCA9IFwiXCIuY29uY2F0KHRoaXMuY2FjaGVEaXIsIFwiL1wiKS5jb25jYXQoY2FjaGVCdW5kbGVSb290LCBcIi9cIikuY29uY2F0KHRpbWUpLmNvbmNhdChzdWZmaXgrKyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIG1ha2VEaXJTeW5jKHRhcmdldFBhdGgsIHRydWUpO1xuICAgIHVuemlwKHppcEZpbGVQYXRoLCB0YXJnZXRQYXRoLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJtZGlyU3luYyh0YXJnZXRQYXRoLCB0cnVlKTtcbiAgICAgICAgaWYgKGlzT3V0T2ZTdG9yYWdlKGVyci5tZXNzYWdlKSkge1xuICAgICAgICAgIHNlbGYub3V0T2ZTdG9yYWdlID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLmF1dG9DbGVhciAmJiBzZWxmLmNsZWFyTFJVKCk7XG4gICAgICAgIH1cbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlbGYuY2FjaGVkRmlsZXMuYWRkKGlkLCB7XG4gICAgICAgIGJ1bmRsZTogY2FjaGVCdW5kbGVSb290LFxuICAgICAgICB1cmw6IHRhcmdldFBhdGgsXG4gICAgICAgIGxhc3RUaW1lOiB0aW1lXG4gICAgICB9KTtcbiAgICAgIHNlbGYud3JpdGVDYWNoZUZpbGUoKTtcbiAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShudWxsLCB0YXJnZXRQYXRoKTtcbiAgICB9KTtcbiAgfSxcbiAgX2lzWmlwRmlsZTogZnVuY3Rpb24gX2lzWmlwRmlsZSh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnNsaWNlKC00KSA9PT0gJy56aXAnO1xuICB9XG59O1xuY2MuYXNzZXRNYW5hZ2VyLmNhY2hlTWFuYWdlciA9IG1vZHVsZS5leHBvcnRzID0gY2FjaGVNYW5hZ2VyO1xuXG59LHtcIi4vZnMtdXRpbHNcIjo0fV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIG9yaWdpbmFsQ3JlYXRlQ2FudmFzID0gcmFsLmNyZWF0ZUNhbnZhcy5iaW5kKHJhbCk7XG5yYWwuY3JlYXRlQ2FudmFzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY2FudmFzID0gb3JpZ2luYWxDcmVhdGVDYW52YXMoKTtcbiAgY2FudmFzLnN0eWxlID0ge307XG4gIHJldHVybiBjYW52YXM7XG59O1xuXG59LHt9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgZnMgPSByYWwuZ2V0RmlsZVN5c3RlbU1hbmFnZXIgPyByYWwuZ2V0RmlsZVN5c3RlbU1hbmFnZXIoKSA6IG51bGw7XG52YXIgb3V0T2ZTdG9yYWdlUmVnRXhwID0gL3RoZSBtYXhpbXVtIHNpemUgb2YgdGhlIGZpbGUgc3RvcmFnZS87XG52YXIgZnNVdGlscyA9IHtcbiAgZnM6IGZzLFxuICBfc3VicGFja2FnZXNQYXRoOiAndXNyXycsXG4gIGlzT3V0T2ZTdG9yYWdlOiBmdW5jdGlvbiBpc091dE9mU3RvcmFnZShlcnJNc2cpIHtcbiAgICByZXR1cm4gb3V0T2ZTdG9yYWdlUmVnRXhwLnRlc3QoZXJyTXNnKTtcbiAgfSxcbiAgZ2V0VXNlckRhdGFQYXRoOiBmdW5jdGlvbiBnZXRVc2VyRGF0YVBhdGgoKSB7XG4gICAgcmV0dXJuIHJhbC5lbnYuVVNFUl9EQVRBX1BBVEg7XG4gIH0sXG4gIGNoZWNrRnNWYWxpZDogZnVuY3Rpb24gY2hlY2tGc1ZhbGlkKCkge1xuICAgIGlmICghZnMpIHtcbiAgICAgIGNvbnNvbGUud2FybignY2FuIG5vdCBnZXQgdGhlIGZpbGUgc3lzdGVtIScpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZGVsZXRlRmlsZTogZnVuY3Rpb24gZGVsZXRlRmlsZShmaWxlUGF0aCwgb25Db21wbGV0ZSkge1xuICAgIGZzLnVubGluayh7XG4gICAgICBmaWxlUGF0aDogZmlsZVBhdGgsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobnVsbCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbChyZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiRGVsZXRlIGZpbGUgZmFpbGVkOiBwYXRoOiBcIi5jb25jYXQoZmlsZVBhdGgsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQocmVzLmVyck1zZykpO1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobmV3IEVycm9yKHJlcy5lcnJNc2cpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgZG93bmxvYWRGaWxlOiBmdW5jdGlvbiBkb3dubG9hZEZpbGUocmVtb3RlVXJsLCBmaWxlUGF0aCwgaGVhZGVyLCBvblByb2dyZXNzLCBvbkNvbXBsZXRlKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICB1cmw6IHJlbW90ZVVybCxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIHN1Y2Nlc3MocmVzKSB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwsIHJlcy50ZW1wRmlsZVBhdGggfHwgcmVzLmZpbGVQYXRoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAocmVzLmZpbGVQYXRoKSB7XG4gICAgICAgICAgICBmc1V0aWxzLmRlbGV0ZUZpbGUocmVzLmZpbGVQYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiRG93bmxvYWQgZmlsZSBmYWlsZWQ6IHBhdGg6IFwiLmNvbmNhdChyZW1vdGVVcmwsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiBmdW5jdGlvbiBmYWlsKHJlcykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJEb3dubG9hZCBmaWxlIGZhaWxlZDogcGF0aDogXCIuY29uY2F0KHJlbW90ZVVybCwgXCIgbWVzc2FnZTogXCIpLmNvbmNhdChyZXMuZXJyTXNnKSk7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShuZXcgRXJyb3IocmVzLmVyck1zZyksIG51bGwpO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKGZpbGVQYXRoKSBvcHRpb25zLmZpbGVQYXRoID0gZmlsZVBhdGg7XG4gICAgaWYgKGhlYWRlcikgb3B0aW9ucy5oZWFkZXIgPSBoZWFkZXI7XG4gICAgdmFyIHRhc2sgPSByYWwuZG93bmxvYWRGaWxlKG9wdGlvbnMpO1xuICAgIG9uUHJvZ3Jlc3MgJiYgdGFzay5vblByb2dyZXNzVXBkYXRlKG9uUHJvZ3Jlc3MpO1xuICB9LFxuICBzYXZlRmlsZTogZnVuY3Rpb24gc2F2ZUZpbGUoc3JjUGF0aCwgZGVzdFBhdGgsIG9uQ29tcGxldGUpIHtcbiAgICByYWwuc2F2ZUZpbGUoe1xuICAgICAgdGVtcEZpbGVQYXRoOiBzcmNQYXRoLFxuICAgICAgZmlsZVBhdGg6IGRlc3RQYXRoLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcyhyZXMpIHtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwpO1xuICAgICAgfSxcbiAgICAgIGZhaWw6IGZ1bmN0aW9uIGZhaWwocmVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlNhdmUgZmlsZSBmYWlsZWQ6IHBhdGg6IFwiLmNvbmNhdChzcmNQYXRoLCBcIiBtZXNzYWdlOiBcIikuY29uY2F0KHJlcy5lcnJNc2cpKTtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG5ldyBFcnJvcihyZXMuZXJyTXNnKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGNvcHlGaWxlOiBmdW5jdGlvbiBjb3B5RmlsZShzcmNQYXRoLCBkZXN0UGF0aCwgb25Db21wbGV0ZSkge1xuICAgIGZzLmNvcHlGaWxlKHtcbiAgICAgIHNyY1BhdGg6IHNyY1BhdGgsXG4gICAgICBkZXN0UGF0aDogZGVzdFBhdGgsXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobnVsbCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbChyZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiQ29weSBmaWxlIGZhaWxlZDogcGF0aDogXCIuY29uY2F0KHNyY1BhdGgsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQocmVzLmVyck1zZykpO1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobmV3IEVycm9yKHJlcy5lcnJNc2cpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgd3JpdGVGaWxlOiBmdW5jdGlvbiB3cml0ZUZpbGUocGF0aCwgZGF0YSwgZW5jb2RpbmcsIG9uQ29tcGxldGUpIHtcbiAgICBmcy53cml0ZUZpbGUoe1xuICAgICAgZmlsZVBhdGg6IHBhdGgsXG4gICAgICBlbmNvZGluZzogZW5jb2RpbmcsXG4gICAgICBkYXRhOiBkYXRhLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwpO1xuICAgICAgfSxcbiAgICAgIGZhaWw6IGZ1bmN0aW9uIGZhaWwocmVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIldyaXRlIGZpbGUgZmFpbGVkOiBwYXRoOiBcIi5jb25jYXQocGF0aCwgXCIgbWVzc2FnZTogXCIpLmNvbmNhdChyZXMuZXJyTXNnKSk7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShuZXcgRXJyb3IocmVzLmVyck1zZykpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICB3cml0ZUZpbGVTeW5jOiBmdW5jdGlvbiB3cml0ZUZpbGVTeW5jKHBhdGgsIGRhdGEsIGVuY29kaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgZGF0YSwgZW5jb2RpbmcpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwiV3JpdGUgZmlsZSBmYWlsZWQ6IHBhdGg6IFwiLmNvbmNhdChwYXRoLCBcIiBtZXNzYWdlOiBcIikuY29uY2F0KGUubWVzc2FnZSkpO1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcbiAgcmVhZEZpbGU6IGZ1bmN0aW9uIHJlYWRGaWxlKGZpbGVQYXRoLCBlbmNvZGluZywgb25Db21wbGV0ZSkge1xuICAgIGZzLnJlYWRGaWxlKHtcbiAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aCxcbiAgICAgIGVuY29kaW5nOiBlbmNvZGluZyxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIHN1Y2Nlc3MocmVzKSB7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShudWxsLCByZXMuZGF0YSk7XG4gICAgICB9LFxuICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbChyZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUmVhZCBmaWxlIGZhaWxlZDogcGF0aDogXCIuY29uY2F0KGZpbGVQYXRoLCBcIiBtZXNzYWdlOiBcIikuY29uY2F0KHJlcy5lcnJNc2cpKTtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG5ldyBFcnJvcihyZXMuZXJyTXNnKSwgbnVsbCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIHJlYWREaXI6IGZ1bmN0aW9uIHJlYWREaXIoZmlsZVBhdGgsIG9uQ29tcGxldGUpIHtcbiAgICBmcy5yZWFkZGlyKHtcbiAgICAgIGRpclBhdGg6IGZpbGVQYXRoLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcyhyZXMpIHtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwsIHJlcy5maWxlcyk7XG4gICAgICB9LFxuICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbChyZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUmVhZCBkaXJlY3RvcnkgZmFpbGVkOiBwYXRoOiBcIi5jb25jYXQoZmlsZVBhdGgsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQocmVzLmVyck1zZykpO1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobmV3IEVycm9yKHJlcy5lcnJNc2cpLCBudWxsKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgcmVhZFRleHQ6IGZ1bmN0aW9uIHJlYWRUZXh0KGZpbGVQYXRoLCBvbkNvbXBsZXRlKSB7XG4gICAgZnNVdGlscy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCBvbkNvbXBsZXRlKTtcbiAgfSxcbiAgcmVhZEFycmF5QnVmZmVyOiBmdW5jdGlvbiByZWFkQXJyYXlCdWZmZXIoZmlsZVBhdGgsIG9uQ29tcGxldGUpIHtcbiAgICBmc1V0aWxzLnJlYWRGaWxlKGZpbGVQYXRoLCAnYmluYXJ5Jywgb25Db21wbGV0ZSk7XG4gIH0sXG4gIHJlYWRKc29uOiBmdW5jdGlvbiByZWFkSnNvbihmaWxlUGF0aCwgb25Db21wbGV0ZSkge1xuICAgIGZzVXRpbHMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgZnVuY3Rpb24gKGVyciwgdGV4dCkge1xuICAgICAgdmFyIG91dCA9IG51bGw7XG4gICAgICBpZiAoIWVycikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG91dCA9IEpTT04ucGFyc2UodGV4dCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJSZWFkIGpzb24gZmFpbGVkOiBwYXRoOiBcIi5jb25jYXQoZmlsZVBhdGgsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQoZS5tZXNzYWdlKSk7XG4gICAgICAgICAgZXJyID0gbmV3IEVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShlcnIsIG91dCk7XG4gICAgfSk7XG4gIH0sXG4gIHJlYWRKc29uU3luYzogZnVuY3Rpb24gcmVhZEpzb25TeW5jKHBhdGgpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHN0ciA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLCAndXRmOCcpO1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJSZWFkIGpzb24gZmFpbGVkOiBwYXRoOiBcIi5jb25jYXQocGF0aCwgXCIgbWVzc2FnZTogXCIpLmNvbmNhdChlLm1lc3NhZ2UpKTtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG4gIG1ha2VEaXJTeW5jOiBmdW5jdGlvbiBtYWtlRGlyU3luYyhwYXRoLCByZWN1cnNpdmUpIHtcbiAgICB0cnkge1xuICAgICAgZnMubWtkaXJTeW5jKHBhdGgsIHJlY3Vyc2l2ZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJNYWtlIGRpcmVjdG9yeSBmYWlsZWQ6IHBhdGg6IFwiLmNvbmNhdChwYXRoLCBcIiBtZXNzYWdlOiBcIikuY29uY2F0KGUubWVzc2FnZSkpO1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcbiAgcm1kaXJTeW5jOiBmdW5jdGlvbiBybWRpclN5bmMoZGlyUGF0aCwgcmVjdXJzaXZlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLnJtZGlyU3luYyhkaXJQYXRoLCByZWN1cnNpdmUpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwicm0gZGlyZWN0b3J5IGZhaWxlZDogcGF0aDogXCIuY29uY2F0KGRpclBhdGgsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQoZS5tZXNzYWdlKSk7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICB9LFxuICBleGlzdHM6IGZ1bmN0aW9uIGV4aXN0cyhmaWxlUGF0aCwgb25Db21wbGV0ZSkge1xuICAgIGZzLmFjY2Vzcyh7XG4gICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZSh0cnVlKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiBmdW5jdGlvbiBmYWlsKCkge1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBsb2FkU3VicGFja2FnZTogZnVuY3Rpb24gbG9hZFN1YnBhY2thZ2UobmFtZSwgb25Qcm9ncmVzcywgb25Db21wbGV0ZSkge1xuICAgIHZhciB0YXNrID0gcmFsLmxvYWRTdWJwYWNrYWdlKHtcbiAgICAgIG5hbWU6IFwiXCIuY29uY2F0KGZzVXRpbHMuX3N1YnBhY2thZ2VzUGF0aCkuY29uY2F0KG5hbWUpLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbChyZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTG9hZCBTdWJwYWNrYWdlIGZhaWxlZDogcGF0aDogXCIuY29uY2F0KG5hbWUsIFwiIG1lc3NhZ2U6IFwiKS5jb25jYXQocmVzLmVyck1zZykpO1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUobmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgc3VicGFja2FnZSBcIi5jb25jYXQobmFtZSwgXCI6IFwiKS5jb25jYXQocmVzLmVyck1zZykpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBvblByb2dyZXNzICYmIHRhc2sub25Qcm9ncmVzc1VwZGF0ZShvblByb2dyZXNzKTtcbiAgICByZXR1cm4gdGFzaztcbiAgfSxcbiAgdW56aXA6IGZ1bmN0aW9uIHVuemlwKHppcEZpbGVQYXRoLCB0YXJnZXRQYXRoLCBvbkNvbXBsZXRlKSB7XG4gICAgZnMudW56aXAoe1xuICAgICAgemlwRmlsZVBhdGg6IHppcEZpbGVQYXRoLFxuICAgICAgdGFyZ2V0UGF0aDogdGFyZ2V0UGF0aCxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShudWxsKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiBmdW5jdGlvbiBmYWlsKHJlcykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJ1bnppcCBmYWlsZWQ6IHBhdGg6IFwiLmNvbmNhdCh6aXBGaWxlUGF0aCwgXCIgbWVzc2FnZTogXCIpLmNvbmNhdChyZXMuZXJyTXNnKSk7XG4gICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShuZXcgRXJyb3IoXCJ1bnppcCBmYWlsZWQ6IFwiLmNvbmNhdChyZXMuZXJyTXNnKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xud2luZG93LmZzVXRpbHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZzVXRpbHM7XG5cbn0se31dLDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNjLmdhbWUucmVzdGFydCA9IGZ1bmN0aW9uICgpIHt9O1xucmFsLm9uV2luZG93UmVzaXplICYmIHJhbC5vbldpbmRvd1Jlc2l6ZShmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICBjYy5nYW1lLmNhbnZhcyAmJiBjYy52aWV3LnNldENhbnZhc1NpemUod2lkdGgsIGhlaWdodCk7XG59KTtcblxufSx7fV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGNhY2hlTWFuYWdlciA9IHJlcXVpcmUoJy4uL2NvbW1vbi9lbmdpbmUvY2FjaGUtbWFuYWdlcicpO1xudmFyIF9yZXF1aXJlID0gcmVxdWlyZSgnLi4vY29tbW9uL2VuZ2luZS9mcy11dGlscycpLFxuICBkb3dubG9hZEZpbGUgPSBfcmVxdWlyZS5kb3dubG9hZEZpbGUsXG4gIHJlYWRUZXh0ID0gX3JlcXVpcmUucmVhZFRleHQsXG4gIHJlYWRBcnJheUJ1ZmZlciA9IF9yZXF1aXJlLnJlYWRBcnJheUJ1ZmZlcixcbiAgcmVhZEpzb24gPSBfcmVxdWlyZS5yZWFkSnNvbixcbiAgbG9hZFN1YnBhY2thZ2UgPSBfcmVxdWlyZS5sb2FkU3VicGFja2FnZSxcbiAgZ2V0VXNlckRhdGFQYXRoID0gX3JlcXVpcmUuZ2V0VXNlckRhdGFQYXRoLFxuICBfc3VicGFja2FnZXNQYXRoID0gX3JlcXVpcmUuX3N1YnBhY2thZ2VzUGF0aDtcbmNjLmFzc2V0TWFuYWdlci5mc1V0aWxzID0gcmFsLmZzVXRpbHM7XG52YXIgUkVHRVggPSAvXmh0dHBzPzpcXC9cXC8uKi87XG52YXIgZG93bmxvYWRlciA9IGNjLmFzc2V0TWFuYWdlci5kb3dubG9hZGVyO1xudmFyIHBhcnNlciA9IGNjLmFzc2V0TWFuYWdlci5wYXJzZXI7XG52YXIgcHJlc2V0cyA9IGNjLmFzc2V0TWFuYWdlci5wcmVzZXRzO1xuZG93bmxvYWRlci5tYXhDb25jdXJyZW5jeSA9IDEyO1xuZG93bmxvYWRlci5tYXhSZXF1ZXN0c1BlckZyYW1lID0gNjQ7XG5wcmVzZXRzLnNjZW5lLm1heENvbmN1cnJlbmN5ID0gMTI7XG5wcmVzZXRzLnNjZW5lLm1heFJlcXVlc3RzUGVyRnJhbWUgPSA2NDtcbnZhciBzdWJwYWNrYWdlcyA9IHt9O1xudmFyIGxvYWRlZFNjcmlwdHMgPSB7fTtcbmZ1bmN0aW9uIGRvd25sb2FkU2NyaXB0KHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICBpZiAoUkVHRVgudGVzdCh1cmwpKSB7XG4gICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG5ldyBFcnJvcignQ2FuIG5vdCBsb2FkIHJlbW90ZSBzY3JpcHRzJykpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobG9hZGVkU2NyaXB0c1t1cmxdKSByZXR1cm4gb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKCk7XG4gIGNvbnNvbGUubG9nKFwiW3N1ZHYyIGFzc2V0LW1hbmFnZXJdIGRvd25sb2FkU2NyaXB0OiBcIi5jb25jYXQodXJsKSk7XG4gIHJlcXVpcmUodXJsKTtcbiAgbG9hZGVkU2NyaXB0c1t1cmxdID0gdHJ1ZTtcbiAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwpO1xufVxuZnVuY3Rpb24gaGFuZGxlWmlwKHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICB2YXIgY2FjaGVkVW56aXAgPSBjYWNoZU1hbmFnZXIuY2FjaGVkRmlsZXMuZ2V0KHVybCk7XG4gIGlmIChjYWNoZWRVbnppcCkge1xuICAgIGNhY2hlTWFuYWdlci51cGRhdGVMYXN0VGltZSh1cmwpO1xuICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShudWxsLCBjYWNoZWRVbnppcC51cmwpO1xuICB9IGVsc2UgaWYgKFJFR0VYLnRlc3QodXJsKSkge1xuICAgIGRvd25sb2FkRmlsZSh1cmwsIG51bGwsIG9wdGlvbnMuaGVhZGVyLCBvcHRpb25zLm9uRmlsZVByb2dyZXNzLCBmdW5jdGlvbiAoZXJyLCBkb3dubG9hZGVkWmlwUGF0aCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUoZXJyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2FjaGVNYW5hZ2VyLnVuemlwQW5kQ2FjaGVCdW5kbGUodXJsLCBkb3dubG9hZGVkWmlwUGF0aCwgb3B0aW9ucy5fX2NhY2hlQnVuZGxlUm9vdF9fLCBvbkNvbXBsZXRlKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjYWNoZU1hbmFnZXIudW56aXBBbmRDYWNoZUJ1bmRsZSh1cmwsIHVybCwgb3B0aW9ucy5fX2NhY2hlQnVuZGxlUm9vdF9fLCBvbkNvbXBsZXRlKTtcbiAgfVxufVxuZnVuY3Rpb24gbG9hZEF1ZGlvUGxheWVyKHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICBjYy5BdWRpb1BsYXllci5sb2FkKHVybCkudGhlbihmdW5jdGlvbiAocGxheWVyKSB7XG4gICAgdmFyIGF1ZGlvTWV0YSA9IHtcbiAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgdXJsOiB1cmwsXG4gICAgICBkdXJhdGlvbjogcGxheWVyLmR1cmF0aW9uLFxuICAgICAgdHlwZTogcGxheWVyLnR5cGVcbiAgICB9O1xuICAgIG9uQ29tcGxldGUobnVsbCwgYXVkaW9NZXRhKTtcbiAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbiAoZXJyKSB7XG4gICAgb25Db21wbGV0ZShlcnIpO1xuICB9KTtcbn1cbmZ1bmN0aW9uIGRvd25sb2FkKHVybCwgZnVuYywgb3B0aW9ucywgb25GaWxlUHJvZ3Jlc3MsIG9uQ29tcGxldGUpIHtcbiAgdmFyIHJlc3VsdCA9IHRyYW5zZm9ybVVybCh1cmwsIG9wdGlvbnMpO1xuICBpZiAocmVzdWx0LmluTG9jYWwpIHtcbiAgICBmdW5jKHJlc3VsdC51cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpO1xuICB9IGVsc2UgaWYgKHJlc3VsdC5pbkNhY2hlKSB7XG4gICAgY2FjaGVNYW5hZ2VyLnVwZGF0ZUxhc3RUaW1lKHVybCk7XG4gICAgZnVuYyhyZXN1bHQudXJsLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNhY2hlTWFuYWdlci5yZW1vdmVDYWNoZSh1cmwpO1xuICAgICAgfVxuICAgICAgb25Db21wbGV0ZShlcnIsIGRhdGEpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGRvd25sb2FkRmlsZSh1cmwsIG51bGwsIG9wdGlvbnMuaGVhZGVyLCBvbkZpbGVQcm9ncmVzcywgZnVuY3Rpb24gKGVyciwgcGF0aCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBvbkNvbXBsZXRlKGVyciwgbnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZ1bmMocGF0aCwgb3B0aW9ucywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgIGNhY2hlTWFuYWdlci50ZW1wRmlsZXMuYWRkKHVybCwgcGF0aCk7XG4gICAgICAgICAgY2FjaGVNYW5hZ2VyLmNhY2hlRmlsZSh1cmwsIHBhdGgsIG9wdGlvbnMuY2FjaGVFbmFibGVkLCBvcHRpb25zLl9fY2FjaGVCdW5kbGVSb290X18sIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIG9uQ29tcGxldGUoZXJyLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiBwYXJzZUFycmF5QnVmZmVyKHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICByZWFkQXJyYXlCdWZmZXIodXJsLCBvbkNvbXBsZXRlKTtcbn1cbmZ1bmN0aW9uIHBhcnNlVGV4dCh1cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgcmVhZFRleHQodXJsLCBvbkNvbXBsZXRlKTtcbn1cbmZ1bmN0aW9uIHBhcnNlSnNvbih1cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgcmVhZEpzb24odXJsLCBvbkNvbXBsZXRlKTtcbn1cbmZ1bmN0aW9uIGRvd25sb2FkVGV4dCh1cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgZG93bmxvYWQodXJsLCBwYXJzZVRleHQsIG9wdGlvbnMsIG9wdGlvbnMub25GaWxlUHJvZ3Jlc3MsIG9uQ29tcGxldGUpO1xufVxuZnVuY3Rpb24gZG93bmxvYWRKc29uKHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICBkb3dubG9hZCh1cmwsIHBhcnNlSnNvbiwgb3B0aW9ucywgb3B0aW9ucy5vbkZpbGVQcm9ncmVzcywgb25Db21wbGV0ZSk7XG59XG5mdW5jdGlvbiBsb2FkRm9udCh1cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgdmFyIGZvbnRGYW1pbHlOYW1lID0gX2dldEZvbnRGYW1pbHkodXJsKTtcbiAgdmFyIGZvbnRGYWNlID0gbmV3IEZvbnRGYWNlKGZvbnRGYW1pbHlOYW1lLCBcInVybCgnXCIuY29uY2F0KHVybCwgXCInKVwiKSk7XG4gIGRvY3VtZW50LmZvbnRzLmFkZChmb250RmFjZSk7XG4gIGZvbnRGYWNlLmxvYWQoKTtcbiAgZm9udEZhY2UubG9hZGVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIG9uQ29tcGxldGUobnVsbCwgZm9udEZhbWlseU5hbWUpO1xuICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgY2Mud2FybklEKDQ5MzMsIGZvbnRGYW1pbHlOYW1lKTtcbiAgICBvbkNvbXBsZXRlKG51bGwsIGZvbnRGYW1pbHlOYW1lKTtcbiAgfSk7XG59XG5mdW5jdGlvbiBfZ2V0Rm9udEZhbWlseShmb250SGFuZGxlKSB7XG4gIHZhciB0dGZJbmRleCA9IGZvbnRIYW5kbGUubGFzdEluZGV4T2YoJy50dGYnKTtcbiAgaWYgKHR0ZkluZGV4ID09PSAtMSkge1xuICAgIHR0ZkluZGV4ID0gZm9udEhhbmRsZS5sYXN0SW5kZXhPZignLnRtcCcpO1xuICB9XG4gIGlmICh0dGZJbmRleCA9PT0gLTEpIHJldHVybiBmb250SGFuZGxlO1xuICB2YXIgc2xhc2hQb3MgPSBmb250SGFuZGxlLmxhc3RJbmRleE9mKCcvJyk7XG4gIHZhciBmb250RmFtaWx5TmFtZTtcbiAgaWYgKHNsYXNoUG9zID09PSAtMSkge1xuICAgIGZvbnRGYW1pbHlOYW1lID0gXCJcIi5jb25jYXQoZm9udEhhbmRsZS5zdWJzdHJpbmcoMCwgdHRmSW5kZXgpLCBcIl9MQUJFTFwiKTtcbiAgfSBlbHNlIHtcbiAgICBmb250RmFtaWx5TmFtZSA9IFwiXCIuY29uY2F0KGZvbnRIYW5kbGUuc3Vic3RyaW5nKHNsYXNoUG9zICsgMSwgdHRmSW5kZXgpLCBcIl9MQUJFTFwiKTtcbiAgfVxuICByZXR1cm4gZm9udEZhbWlseU5hbWU7XG59XG5mdW5jdGlvbiBkb05vdGhpbmcoY29udGVudCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICBvbkNvbXBsZXRlKG51bGwsIGNvbnRlbnQpO1xufVxuZnVuY3Rpb24gZG93bmxvYWRBc3NldCh1cmwsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgZG93bmxvYWQodXJsLCBkb05vdGhpbmcsIG9wdGlvbnMsIG9wdGlvbnMub25GaWxlUHJvZ3Jlc3MsIG9uQ29tcGxldGUpO1xufVxuZnVuY3Rpb24gZG93bmxvYWRCdW5kbGUobmFtZU9yVXJsLCBvcHRpb25zLCBvbkNvbXBsZXRlKSB7XG4gIHZhciBidW5kbGVOYW1lID0gY2MucGF0aC5iYXNlbmFtZShuYW1lT3JVcmwpO1xuICB2YXIgdmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbiB8fCBjYy5hc3NldE1hbmFnZXIuZG93bmxvYWRlci5idW5kbGVWZXJzW2J1bmRsZU5hbWVdO1xuICB2YXIgc3VmZml4ID0gdmVyc2lvbiA/IFwiXCIuY29uY2F0KHZlcnNpb24sIFwiLlwiKSA6ICcnO1xuICBpZiAoc3VicGFja2FnZXNbYnVuZGxlTmFtZV0pIHtcbiAgICB2YXIgY29uZmlnID0gXCJcIi5jb25jYXQoYnVuZGxlTmFtZSwgXCIvY29uZmlnLlwiKS5jb25jYXQoc3VmZml4LCBcImpzb25cIik7XG4gICAgbG9hZFN1YnBhY2thZ2UoYnVuZGxlTmFtZSwgb3B0aW9ucy5vbkZpbGVQcm9ncmVzcywgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBvbkNvbXBsZXRlKGVyciwgbnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRvd25sb2FkSnNvbihjb25maWcsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgZGF0YSAmJiAoZGF0YS5iYXNlID0gXCJcIi5jb25jYXQoYnVuZGxlTmFtZSwgXCIvXCIpKTtcbiAgICAgICAgb25Db21wbGV0ZShlcnIsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGpzO1xuICAgIHZhciB1cmw7XG4gICAgaWYgKFJFR0VYLnRlc3QobmFtZU9yVXJsKSB8fCBuYW1lT3JVcmwuc3RhcnRzV2l0aChnZXRVc2VyRGF0YVBhdGgoKSkpIHtcbiAgICAgIHVybCA9IG5hbWVPclVybDtcbiAgICAgIGpzID0gXCJzcmMvYnVuZGxlLXNjcmlwdHMvXCIuY29uY2F0KGJ1bmRsZU5hbWUsIFwiL2luZGV4LlwiKS5jb25jYXQoc3VmZml4LCBcImpzXCIpO1xuICAgICAgY2FjaGVNYW5hZ2VyLm1ha2VCdW5kbGVGb2xkZXIoYnVuZGxlTmFtZSk7XG4gICAgfSBlbHNlIGlmIChkb3dubG9hZGVyLnJlbW90ZUJ1bmRsZXMuaW5kZXhPZihidW5kbGVOYW1lKSAhPT0gLTEpIHtcbiAgICAgIHVybCA9IFwiXCIuY29uY2F0KGRvd25sb2FkZXIucmVtb3RlU2VydmVyQWRkcmVzcywgXCJyZW1vdGUvXCIpLmNvbmNhdChidW5kbGVOYW1lKTtcbiAgICAgIGpzID0gXCJzcmMvYnVuZGxlLXNjcmlwdHMvXCIuY29uY2F0KGJ1bmRsZU5hbWUsIFwiL2luZGV4LlwiKS5jb25jYXQoc3VmZml4LCBcImpzXCIpO1xuICAgICAgY2FjaGVNYW5hZ2VyLm1ha2VCdW5kbGVGb2xkZXIoYnVuZGxlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IFwiYXNzZXRzL1wiLmNvbmNhdChidW5kbGVOYW1lKTtcbiAgICAgIGpzID0gXCJhc3NldHMvXCIuY29uY2F0KGJ1bmRsZU5hbWUsIFwiL2luZGV4LlwiKS5jb25jYXQoc3VmZml4LCBcImpzXCIpO1xuICAgIH1cbiAgICBpZiAoIWxvYWRlZFNjcmlwdHNbanNdKSB7XG4gICAgICB2YXIgcmVxdWlyZUJlZm9yZSA9IHJlcXVpcmU7XG4gICAgICB2YXIgZ2xvYmFsUmVxdWlyZUJlZm9yZSA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMucmVxdWlyZSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnNvbGUubG9nKFwiW3N1ZHYyIGFzc2V0LW1hbmFnZXJdIGxvYWQgYnVuZGxlIHNjcmlwdDogXCIuY29uY2F0KGpzKSk7XG4gICAgICBjb25zb2xlLmxvZygncmVxdWlyZSBiZWZvcmU6JywgcmVxdWlyZSk7XG4gICAgICByZXF1aXJlKGpzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdyZXF1aXJlIGFmdGVyOicsIHJlcXVpcmUpO1xuICAgICAgY29uc29sZS5sb2coXCJbc3VkdjIgYXNzZXQtbWFuYWdlcl0gcmVxdWlyZSB1bmNoYW5nZWQgYWZ0ZXIgbG9hZGluZyBcIi5jb25jYXQoanMsIFwiOiBsb2NhbD1cIikuY29uY2F0KHJlcXVpcmVCZWZvcmUgPT09IHJlcXVpcmUsIFwiLCBnbG9iYWw9XCIpLmNvbmNhdChnbG9iYWxSZXF1aXJlQmVmb3JlID09PSAodHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcy5yZXF1aXJlIDogdW5kZWZpbmVkKSkpO1xuICAgICAgbG9hZGVkU2NyaXB0c1tqc10gPSB0cnVlO1xuICAgIH1cbiAgICBvcHRpb25zLl9fY2FjaGVCdW5kbGVSb290X18gPSBidW5kbGVOYW1lO1xuICAgIHZhciBjb25maWcgPSBcIlwiLmNvbmNhdCh1cmwsIFwiL2NvbmZpZy5cIikuY29uY2F0KHN1ZmZpeCwgXCJqc29uXCIpO1xuICAgIGRvd25sb2FkSnNvbihjb25maWcsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChkYXRhLmlzWmlwKSB7XG4gICAgICAgIHZhciB6aXBWZXJzaW9uID0gZGF0YS56aXBWZXJzaW9uO1xuICAgICAgICB2YXIgemlwVXJsID0gXCJcIi5jb25jYXQodXJsLCBcIi9yZXMuXCIpLmNvbmNhdCh6aXBWZXJzaW9uID8gXCJcIi5jb25jYXQoemlwVmVyc2lvbiwgXCIuXCIpIDogJycsIFwiemlwXCIpO1xuICAgICAgICBoYW5kbGVaaXAoemlwVXJsLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCB1bnppcFBhdGgpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBvbkNvbXBsZXRlICYmIG9uQ29tcGxldGUoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGF0YS5iYXNlID0gXCJcIi5jb25jYXQodW56aXBQYXRoLCBcIi9yZXMvXCIpO1xuICAgICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZShudWxsLCBkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhLmJhc2UgPSBcIlwiLmNvbmNhdCh1cmwsIFwiL1wiKTtcbiAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKG51bGwsIGRhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiBkb3dubG9hZEFycmF5QnVmZmVyKHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICBkb3dubG9hZCh1cmwsIHBhcnNlQXJyYXlCdWZmZXIsIG9wdGlvbnMsIG9wdGlvbnMub25GaWxlUHJvZ3Jlc3MsIG9uQ29tcGxldGUpO1xufVxudmFyIG9yaWdpblBhcnNlUFZSVGV4ID0gcGFyc2VyLnBhcnNlUFZSVGV4O1xudmFyIHBhcnNlUFZSVGV4ID0gZnVuY3Rpb24gcGFyc2VQVlJUZXgoZmlsZSwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICByZWFkQXJyYXlCdWZmZXIoZmlsZSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHJldHVybiBvbkNvbXBsZXRlKGVycik7XG4gICAgb3JpZ2luUGFyc2VQVlJUZXgoZGF0YSwgb3B0aW9ucywgb25Db21wbGV0ZSk7XG4gIH0pO1xufTtcbnZhciBvcmlnaW5QYXJzZVBLTVRleCA9IHBhcnNlci5wYXJzZVBLTVRleDtcbnZhciBwYXJzZVBLTVRleCA9IGZ1bmN0aW9uIHBhcnNlUEtNVGV4KGZpbGUsIG9wdGlvbnMsIG9uQ29tcGxldGUpIHtcbiAgcmVhZEFycmF5QnVmZmVyKGZpbGUsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICBpZiAoZXJyKSByZXR1cm4gb25Db21wbGV0ZShlcnIpO1xuICAgIG9yaWdpblBhcnNlUEtNVGV4KGRhdGEsIG9wdGlvbnMsIG9uQ29tcGxldGUpO1xuICB9KTtcbn07XG52YXIgb3JpZ2luUGFyc2VBU1RDVGV4ID0gcGFyc2VyLnBhcnNlQVNUQ1RleDtcbnZhciBwYXJzZUFTVENUZXggPSBmdW5jdGlvbiBwYXJzZUFTVENUZXgoZmlsZSwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICByZWFkQXJyYXlCdWZmZXIoZmlsZSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHJldHVybiBvbkNvbXBsZXRlKGVycik7XG4gICAgb3JpZ2luUGFyc2VBU1RDVGV4KGRhdGEsIG9wdGlvbnMsIG9uQ29tcGxldGUpO1xuICB9KTtcbn07XG52YXIgb3JpZ2luUGFyc2VQbGlzdCA9IHBhcnNlci5wYXJzZVBsaXN0O1xudmFyIHBhcnNlUGxpc3QgPSBmdW5jdGlvbiBwYXJzZVBsaXN0KHVybCwgb3B0aW9ucywgb25Db21wbGV0ZSkge1xuICByZWFkVGV4dCh1cmwsIGZ1bmN0aW9uIChlcnIsIGZpbGUpIHtcbiAgICBpZiAoZXJyKSByZXR1cm4gb25Db21wbGV0ZShlcnIpO1xuICAgIG9yaWdpblBhcnNlUGxpc3QoZmlsZSwgb3B0aW9ucywgb25Db21wbGV0ZSk7XG4gIH0pO1xufTtcbmRvd25sb2FkZXIuZG93bmxvYWRTY3JpcHQgPSBkb3dubG9hZFNjcmlwdDtcbmRvd25sb2FkZXIuX2Rvd25sb2FkQXJyYXlCdWZmZXIgPSBkb3dubG9hZEFycmF5QnVmZmVyO1xuZG93bmxvYWRlci5fZG93bmxvYWRKc29uID0gZG93bmxvYWRKc29uO1xucGFyc2VyLnBhcnNlUFZSVGV4ID0gcGFyc2VQVlJUZXg7XG5wYXJzZXIucGFyc2VQS01UZXggPSBwYXJzZVBLTVRleDtcbnBhcnNlci5wYXJzZUFTVENUZXggPSBwYXJzZUFTVENUZXg7XG5wYXJzZXIucGFyc2VQbGlzdCA9IHBhcnNlUGxpc3Q7XG5kb3dubG9hZGVyLnJlZ2lzdGVyKHtcbiAgJy5qcyc6IGRvd25sb2FkU2NyaXB0LFxuICAnLm1wMyc6IGRvd25sb2FkQXNzZXQsXG4gICcub2dnJzogZG93bmxvYWRBc3NldCxcbiAgJy53YXYnOiBkb3dubG9hZEFzc2V0LFxuICAnLm00YSc6IGRvd25sb2FkQXNzZXQsXG4gICcucG5nJzogZG93bmxvYWRBc3NldCxcbiAgJy5qcGcnOiBkb3dubG9hZEFzc2V0LFxuICAnLmJtcCc6IGRvd25sb2FkQXNzZXQsXG4gICcuanBlZyc6IGRvd25sb2FkQXNzZXQsXG4gICcuZ2lmJzogZG93bmxvYWRBc3NldCxcbiAgJy5pY28nOiBkb3dubG9hZEFzc2V0LFxuICAnLnRpZmYnOiBkb3dubG9hZEFzc2V0LFxuICAnLmltYWdlJzogZG93bmxvYWRBc3NldCxcbiAgJy53ZWJwJzogZG93bmxvYWRBc3NldCxcbiAgJy5wdnInOiBkb3dubG9hZEFzc2V0LFxuICAnLnBrbSc6IGRvd25sb2FkQXNzZXQsXG4gICcuYXN0Yyc6IGRvd25sb2FkQXNzZXQsXG4gICcuZm9udCc6IGRvd25sb2FkQXNzZXQsXG4gICcuZW90JzogZG93bmxvYWRBc3NldCxcbiAgJy50dGYnOiBkb3dubG9hZEFzc2V0LFxuICAnLndvZmYnOiBkb3dubG9hZEFzc2V0LFxuICAnLnN2Zyc6IGRvd25sb2FkQXNzZXQsXG4gICcudHRjJzogZG93bmxvYWRBc3NldCxcbiAgJy50eHQnOiBkb3dubG9hZEFzc2V0LFxuICAnLnhtbCc6IGRvd25sb2FkQXNzZXQsXG4gICcudnNoJzogZG93bmxvYWRBc3NldCxcbiAgJy5mc2gnOiBkb3dubG9hZEFzc2V0LFxuICAnLmF0bGFzJzogZG93bmxvYWRBc3NldCxcbiAgJy50bXgnOiBkb3dubG9hZEFzc2V0LFxuICAnLnRzeCc6IGRvd25sb2FkQXNzZXQsXG4gICcucGxpc3QnOiBkb3dubG9hZEFzc2V0LFxuICAnLmZudCc6IGRvd25sb2FkQXNzZXQsXG4gICcuanNvbic6IGRvd25sb2FkSnNvbixcbiAgJy5FeHBvcnRKc29uJzogZG93bmxvYWRBc3NldCxcbiAgJy5iaW5hcnknOiBkb3dubG9hZEFzc2V0LFxuICAnLmJpbic6IGRvd25sb2FkQXNzZXQsXG4gICcuZGJiaW4nOiBkb3dubG9hZEFzc2V0LFxuICAnLnNrZWwnOiBkb3dubG9hZEFzc2V0LFxuICAnLm1wNCc6IGRvd25sb2FkQXNzZXQsXG4gICcuYXZpJzogZG93bmxvYWRBc3NldCxcbiAgJy5tb3YnOiBkb3dubG9hZEFzc2V0LFxuICAnLm1wZyc6IGRvd25sb2FkQXNzZXQsXG4gICcubXBlZyc6IGRvd25sb2FkQXNzZXQsXG4gICcucm0nOiBkb3dubG9hZEFzc2V0LFxuICAnLnJtdmInOiBkb3dubG9hZEFzc2V0LFxuICBidW5kbGU6IGRvd25sb2FkQnVuZGxlLFxuICBcImRlZmF1bHRcIjogZG93bmxvYWRUZXh0XG59KTtcbnBhcnNlci5yZWdpc3Rlcih7XG4gICcucG5nJzogZG93bmxvYWRlci5kb3dubG9hZERvbUltYWdlLFxuICAnLmpwZyc6IGRvd25sb2FkZXIuZG93bmxvYWREb21JbWFnZSxcbiAgJy5ibXAnOiBkb3dubG9hZGVyLmRvd25sb2FkRG9tSW1hZ2UsXG4gICcuanBlZyc6IGRvd25sb2FkZXIuZG93bmxvYWREb21JbWFnZSxcbiAgJy5naWYnOiBkb3dubG9hZGVyLmRvd25sb2FkRG9tSW1hZ2UsXG4gICcuaWNvJzogZG93bmxvYWRlci5kb3dubG9hZERvbUltYWdlLFxuICAnLnRpZmYnOiBkb3dubG9hZGVyLmRvd25sb2FkRG9tSW1hZ2UsXG4gICcuaW1hZ2UnOiBkb3dubG9hZGVyLmRvd25sb2FkRG9tSW1hZ2UsXG4gICcud2VicCc6IGRvd25sb2FkZXIuZG93bmxvYWREb21JbWFnZSxcbiAgJy5wdnInOiBwYXJzZVBWUlRleCxcbiAgJy5wa20nOiBwYXJzZVBLTVRleCxcbiAgJy5hc3RjJzogcGFyc2VBU1RDVGV4LFxuICAnLmZvbnQnOiBsb2FkRm9udCxcbiAgJy5lb3QnOiBsb2FkRm9udCxcbiAgJy50dGYnOiBsb2FkRm9udCxcbiAgJy53b2ZmJzogbG9hZEZvbnQsXG4gICcuc3ZnJzogbG9hZEZvbnQsXG4gICcudHRjJzogbG9hZEZvbnQsXG4gICcubXAzJzogbG9hZEF1ZGlvUGxheWVyLFxuICAnLm9nZyc6IGxvYWRBdWRpb1BsYXllcixcbiAgJy53YXYnOiBsb2FkQXVkaW9QbGF5ZXIsXG4gICcubTRhJzogbG9hZEF1ZGlvUGxheWVyLFxuICAnLnR4dCc6IHBhcnNlVGV4dCxcbiAgJy54bWwnOiBwYXJzZVRleHQsXG4gICcudnNoJzogcGFyc2VUZXh0LFxuICAnLmZzaCc6IHBhcnNlVGV4dCxcbiAgJy5hdGxhcyc6IHBhcnNlVGV4dCxcbiAgJy50bXgnOiBwYXJzZVRleHQsXG4gICcudHN4JzogcGFyc2VUZXh0LFxuICAnLmZudCc6IHBhcnNlVGV4dCxcbiAgJy5wbGlzdCc6IHBhcnNlUGxpc3QsXG4gICcuYmluYXJ5JzogcGFyc2VBcnJheUJ1ZmZlcixcbiAgJy5iaW4nOiBwYXJzZUFycmF5QnVmZmVyLFxuICAnLmRiYmluJzogcGFyc2VBcnJheUJ1ZmZlcixcbiAgJy5za2VsJzogcGFyc2VBcnJheUJ1ZmZlcixcbiAgJy5FeHBvcnRKc29uJzogcGFyc2VKc29uXG59KTtcbnZhciB0cmFuc2Zvcm1VcmwgPSBmdW5jdGlvbiB0cmFuc2Zvcm1VcmwodXJsLCBvcHRpb25zKSB7XG4gIHZhciBpbkxvY2FsID0gZmFsc2U7XG4gIHZhciBpbkNhY2hlID0gZmFsc2U7XG4gIHZhciBpc0luVXNlckRhdGFQYXRoID0gdXJsLnN0YXJ0c1dpdGgoZ2V0VXNlckRhdGFQYXRoKCkpO1xuICBpZiAoaXNJblVzZXJEYXRhUGF0aCkge1xuICAgIGluTG9jYWwgPSB0cnVlO1xuICB9IGVsc2UgaWYgKFJFR0VYLnRlc3QodXJsKSkge1xuICAgIGlmICghb3B0aW9ucy5yZWxvYWQpIHtcbiAgICAgIHZhciBjYWNoZSA9IGNhY2hlTWFuYWdlci5jYWNoZWRGaWxlcy5nZXQodXJsKTtcbiAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICBpbkNhY2hlID0gdHJ1ZTtcbiAgICAgICAgdXJsID0gY2FjaGUudXJsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHRlbXBVcmwgPSBjYWNoZU1hbmFnZXIudGVtcEZpbGVzLmdldCh1cmwpO1xuICAgICAgICBpZiAodGVtcFVybCkge1xuICAgICAgICAgIGluTG9jYWwgPSB0cnVlO1xuICAgICAgICAgIHVybCA9IHRlbXBVcmw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaW5Mb2NhbCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB1cmw6IHVybCxcbiAgICBpbkxvY2FsOiBpbkxvY2FsLFxuICAgIGluQ2FjaGU6IGluQ2FjaGVcbiAgfTtcbn07XG5jYy5hc3NldE1hbmFnZXIudHJhbnNmb3JtUGlwZWxpbmUuYXBwZW5kKGZ1bmN0aW9uICh0YXNrKSB7XG4gIHZhciBpbnB1dCA9IHRhc2sub3V0cHV0ID0gdGFzay5pbnB1dDtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbnB1dC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGlucHV0W2ldO1xuICAgIHZhciBvcHRpb25zID0gaXRlbS5vcHRpb25zO1xuICAgIGlmICghaXRlbS5jb25maWcpIHtcbiAgICAgIGlmIChpdGVtLmV4dCA9PT0gJ2J1bmRsZScpIGNvbnRpbnVlO1xuICAgICAgb3B0aW9ucy5jYWNoZUVuYWJsZWQgPSBvcHRpb25zLmNhY2hlRW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jYWNoZUVuYWJsZWQgOiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucy5fX2NhY2hlQnVuZGxlUm9vdF9fID0gaXRlbS5jb25maWcubmFtZTtcbiAgICB9XG4gICAgaWYgKGl0ZW0uZXh0ID09PSAnLmNjb25iJykge1xuICAgICAgaXRlbS51cmwgPSBpdGVtLnVybC5yZXBsYWNlKGl0ZW0uZXh0LCAnLmJpbicpO1xuICAgIH0gZWxzZSBpZiAoaXRlbS5leHQgPT09ICcuY2NvbicpIHtcbiAgICAgIGl0ZW0udXJsID0gaXRlbS51cmwucmVwbGFjZShpdGVtLmV4dCwgJy5qc29uJyk7XG4gICAgfVxuICB9XG59KTtcbnZhciBvcmlnaW5Jbml0ID0gY2MuYXNzZXRNYW5hZ2VyLmluaXQ7XG5jYy5hc3NldE1hbmFnZXIuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIG9yaWdpbkluaXQuY2FsbChjYy5hc3NldE1hbmFnZXIsIG9wdGlvbnMpO1xuICB2YXIgc3VicGFja3MgPSBjYy5zZXR0aW5ncy5xdWVyeVNldHRpbmdzKCdhc3NldHMnLCAnc3VicGFja2FnZXMnKTtcbiAgc3VicGFja3MgJiYgc3VicGFja3MuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBzdWJwYWNrYWdlc1t4XSA9IFwiXCIuY29uY2F0KF9zdWJwYWNrYWdlc1BhdGgpLmNvbmNhdCh4KTtcbiAgfSk7XG4gIGNhY2hlTWFuYWdlci5pbml0KCk7XG59O1xuXG59LHtcIi4uL2NvbW1vbi9lbmdpbmUvY2FjaGUtbWFuYWdlclwiOjIsXCIuLi9jb21tb24vZW5naW5lL2ZzLXV0aWxzXCI6NH1dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoJy4uL2NvbW1vbi9lbmdpbmUvZnMtdXRpbHMnKTtcbnJlcXVpcmUoJy4uL2NvbW1vbi9lbmdpbmUvY2FudmFzJyk7XG5yZXF1aXJlKCcuL2Fzc2V0LW1hbmFnZXIuanMnKTtcbnJlcXVpcmUoJy4uL2NvbW1vbi9lbmdpbmUvRWRpdEJveC5qcycpO1xucmVxdWlyZSgnLi4vY29tbW9uL2VuZ2luZS9nYW1lLmpzJyk7XG5cbn0se1wiLi4vY29tbW9uL2VuZ2luZS9FZGl0Qm94LmpzXCI6MSxcIi4uL2NvbW1vbi9lbmdpbmUvY2FudmFzXCI6MyxcIi4uL2NvbW1vbi9lbmdpbmUvZnMtdXRpbHNcIjo0LFwiLi4vY29tbW9uL2VuZ2luZS9nYW1lLmpzXCI6NSxcIi4vYXNzZXQtbWFuYWdlci5qc1wiOjZ9XX0se30sWzddKTtcbiJdLCJmaWxlIjoiZW5naW5lLWFkYXB0ZXIuanMifQ==
