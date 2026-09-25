System.register("q-bundled:///fs/cocos/core/utils/x-deprecated.js", ["../../../../virtual/internal%253Aconstants.js", "../platform/debug.js"], function (_export, _context) {
  "use strict";

  var DEBUG, error, errorID, warn, warnID, defaultLogTimes, replaceProperty, removeProperty, markAsWarning, replacePropertyLog, markAsWarningLog, removePropertyLog, messageID, messageMap, topLevelDeprecateList, _cachedProxy;
  /**
   * @deprecated since v3.6.0, this is an engine private interface that will be removed in the future.
   */
  function setDefaultLogTimes(times) {
    if (times > 0) {
      defaultLogTimes = times;
    }
  }

  /**
   * @deprecated since v3.6.0, this is an engine private interface that will be removed in the future.
   */

  /**
   * @deprecated since v3.6.0, this is an engine private interface that will be removed in the future.
   */

  /**
   * @deprecated since v3.6.0, this is an engine private interface that will be removed in the future.
   */

  /**
   * This is an internal method to register the deprecate info of module exported binding name.
   * DO NOT USE THIS INTERFACE.
   *
   * @example
   * ```ts
   * deprecateModuleExportedName({
   *     ButtonComponent: {
   *         newName: 'Button',
   *         since: '1.2.0',
   *         removed: false,
   *     },
   * });
   * ```
   * @engineInternal
   */
  function deprecateModuleExportedName(deprecateList) {
    for (let deprecateName in deprecateList) {
      const deprecateInfo = deprecateList[deprecateName];
      topLevelDeprecateList[deprecateName] = deprecateInfo;
    }
  }
  function _checkObsoleteByName(checkName) {
    const deprecateInfo = topLevelDeprecateList[checkName];
    if (!deprecateInfo) {
      return;
    }
    const {
      newName,
      since,
      removed
    } = deprecateInfo;
    if (removed) {
      if (newName) {
        errorID(16003, checkName, since, newName);
      } else {
        errorID(16002, checkName, since);
      }
    } else if (newName) {
      warnID(16001, checkName, since, newName);
    } else {
      warnID(16000, checkName, since);
    }
  }

  /**
   * An internal method to check whether the top level interface is deprecated.
   * DO NOT USE THIS INTERFACE.
   *
   * @example
   * ```ts
   * // print deprecate info of ButtonComponent and ToggleComponent
   * import { ButtonComponent, ToggleComponent } from 'cc';
   * ```
   * @engineInternal
   */
  function __checkObsolete__(checkList) {
    for (let checkName of checkList) {
      _checkObsoleteByName(checkName);
    }
  }
  /**
   * An internal method to check whether the top level interface is deprecated in namespace.
   * DO NOT USE THIS INTERFACE.
   *
   * @example
   * ```ts
   * import * as cc from 'cc';
   * console.log(cc.ButtonComponent);  // print deprecate info of ButtonComponent
   * ```
   * @engineInternal
   */
  function __checkObsoleteInNamespace__(ccNamespace) {
    if (!_cachedProxy) {
      if (typeof Proxy === 'undefined') {
        _cachedProxy = {};
      } else {
        _cachedProxy = new Proxy(ccNamespace, {
          get(target, name, receiver) {
            // NOTE: for now we use tsc version 4.3.5, which has not supported symbol as index.
            _checkObsoleteByName(name);
            return Reflect.get(target, name, receiver);
          }
        });
      }
    }
    return _cachedProxy;
  }
  _export({
    setDefaultLogTimes: setDefaultLogTimes,
    deprecateModuleExportedName: deprecateModuleExportedName,
    __checkObsolete__: __checkObsolete__,
    __checkObsoleteInNamespace__: __checkObsoleteInNamespace__,
    replaceProperty: void 0,
    removeProperty: void 0,
    markAsWarning: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_platformDebugJs) {
      error = _platformDebugJs.error;
      errorID = _platformDebugJs.errorID;
      warn = _platformDebugJs.warn;
      warnID = _platformDebugJs.warnID;
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
      /* eslint-disable @typescript-eslint/ban-types */
      /* eslint-disable import/no-mutable-exports */
      /* eslint-disable func-names */
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      /* eslint-disable prefer-const */
      defaultLogTimes = 10;
      // if (DEBUG) {
      messageID = 0;
      messageMap = new Map();
      replacePropertyLog = (n, dp, n2, newp, f, id, s) => {
        const item = messageMap.get(id);
        if (item && item.logTimes > item.count) {
          f(`'%s' is deprecated, please use '%s' instead. ${s}`, `${n}.${dp}`, `${n2}.${newp}`);
          item.count++;
        }
      };
      _export("replaceProperty", replaceProperty = (owner, ownerName, properties) => {
        if (owner == null) return;
        properties.forEach(item => {
          const id = messageID++;
          messageMap.set(id, {
            id,
            count: 0,
            logTimes: item.logTimes !== undefined ? item.logTimes : defaultLogTimes
          });
          const target = item.target != null ? item.target : owner;
          const newName = item.newName != null ? item.newName : item.name;
          const targetName = item.targetName != null ? item.targetName : ownerName;
          const sameTarget = target === owner;
          const suggest = item.suggest ? `(${item.suggest})` : '';
          if (item.customFunction != null) {
            owner[item.name] = function () {
              replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
              return item.customFunction.call(this, ...arguments);
            };
          } else if (item.customSetter != null || item.customGetter != null) {
            const hasSetter = item.customSetter != null;
            const hasGetter = item.customGetter != null;
            if (hasSetter && hasGetter) {
              Object.defineProperty(owner, item.name, {
                get() {
                  replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                  return item.customGetter.call(this);
                },
                set(v) {
                  replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                  item.customSetter.call(this, v);
                },
                enumerable: false
              });
            } else if (hasSetter) {
              Object.defineProperty(owner, item.name, {
                set(v) {
                  replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                  item.customSetter.call(this, v);
                },
                enumerable: false
              });
            } else if (hasGetter) {
              Object.defineProperty(owner, item.name, {
                get() {
                  replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                  return item.customGetter.call(this);
                },
                enumerable: false
              });
            }
          } else {
            Object.defineProperty(owner, item.name, {
              get() {
                replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                return sameTarget ? this[newName] : target[newName];
              },
              set(v) {
                replacePropertyLog(ownerName, item.name, targetName, newName, warn, id, suggest);
                if (sameTarget) {
                  this[newName] = v;
                } else {
                  target[newName] = v;
                }
              },
              enumerable: false
            });
          }
        });
      });
      removePropertyLog = (n, dp, f, id, s) => {
        const item = messageMap.get(id);
        if (item && item.logTimes > item.count) {
          f(`'%s' has been removed. ${s}`, `${n}.${dp}`);
          item.count++;
        }
      };
      _export("removeProperty", removeProperty = (owner, ownerName, properties) => {
        if (owner == null) return;
        properties.forEach(item => {
          const id = messageID++;
          messageMap.set(id, {
            id,
            count: 0,
            logTimes: item.logTimes !== undefined ? item.logTimes : defaultLogTimes
          });
          const suggest = item.suggest ? `(${item.suggest})` : '';
          Object.defineProperty(owner, item.name, {
            get() {
              return removePropertyLog(ownerName, item.name, error, id, suggest);
            },
            set() {
              removePropertyLog(ownerName, item.name, error, id, suggest);
            },
            enumerable: false
          });
        });
      });
      markAsWarningLog = (n, dp, f, id, s) => {
        const item = messageMap.get(id);
        if (item && item.logTimes > item.count) {
          f(`'%s' is deprecated. ${s}`, `${n}.${dp}`);
          item.count++;
        }
      };
      _export("markAsWarning", markAsWarning = (owner, ownerName, properties) => {
        if (!DEBUG || owner == null) return;
        const _defaultGetSet = (d, n, dp, f, id, s) => {
          if (d.get) {
            const oldGet = d.get;
            d.get = function () {
              markAsWarningLog(n, dp, f, id, s);
              return oldGet.call(this);
            };
          }
          if (d.set) {
            const oldSet = d.set;
            d.set = function (v) {
              markAsWarningLog(n, dp, f, id, s);
              oldSet.call(this, v);
            };
          }
          Object.defineProperty(owner, dp, d);
        };
        properties.forEach(item => {
          const deprecatedProp = item.name;
          const descriptor = Object.getOwnPropertyDescriptor(owner, deprecatedProp);
          if (!descriptor || !descriptor.configurable) {
            return;
          }
          const id = messageID++;
          messageMap.set(id, {
            id,
            count: 0,
            logTimes: item.logTimes !== undefined ? item.logTimes : defaultLogTimes
          });
          const suggest = item.suggest ? `(${item.suggest})` : '';
          if (typeof descriptor.value !== 'undefined') {
            if (typeof descriptor.value === 'function') {
              const oldValue = descriptor.value;
              owner[deprecatedProp] = function () {
                markAsWarningLog(ownerName, deprecatedProp, warn, id, suggest);
                return oldValue.call(this, ...arguments);
              };
            } else {
              let oldValue = descriptor.value;
              Object.defineProperty(owner, deprecatedProp, {
                configurable: true,
                get() {
                  markAsWarningLog(ownerName, deprecatedProp, warn, id, suggest);
                  return oldValue;
                }
              });
              if (descriptor.writable) {
                Object.defineProperty(owner, deprecatedProp, {
                  set(value) {
                    markAsWarningLog(ownerName, deprecatedProp, warn, id, suggest);
                    oldValue = value;
                  }
                });
              }
            }
          } else {
            _defaultGetSet(descriptor, ownerName, deprecatedProp, warn, id, suggest);
          }
          Object.defineProperty(owner, deprecatedProp, {
            enumerable: false
          });
        });
      });

      // } else {
      //     // for compatible

      //     replaceProperty = () => { };
      //     removeProperty = () => { };
      //     markAsWarning = () => { };

      //     replacePropertyLog = () => { };
      //     removePropertyLog = () => { };
      //     markAsWarningLog = () => { };
      // }

      /**
       * @engineInternal
       */

      /**
       * @engineInternal
       */
      topLevelDeprecateList = {};
    }
  };
});