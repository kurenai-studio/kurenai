System.register("q-bundled:///fs/cocos/tween/tween-action.js", ["../core/index.js", "./actions/action-interval.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var warnID, warn, easing, ActionInterval, VERSION, TweenAction;
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

  /** adapter */
  function TweenEasingAdapter(easingName) {
    const initialChar = easingName.charAt(0);
    if (/[A-Z]/.test(initialChar)) {
      easingName = easingName.replace(initialChar, initialChar.toLowerCase());
      const arr = easingName.split('-');
      if (arr.length === 2) {
        const str0 = arr[0];
        if (str0 === 'linear') {
          easingName = 'linear';
        } else {
          const str1 = arr[1];
          switch (str0) {
            case 'quadratic':
              easingName = `quad${str1}`;
              break;
            case 'quartic':
              easingName = `quart${str1}`;
              break;
            case 'quintic':
              easingName = `quint${str1}`;
              break;
            case 'sinusoidal':
              easingName = `sine${str1}`;
              break;
            case 'exponential':
              easingName = `expo${str1}`;
              break;
            case 'circular':
              easingName = `circ${str1}`;
              break;
            default:
              easingName = str0 + str1;
              break;
          }
        }
      }
    }
    return easingName;
  }

  /** checker */
  function TweenOptionChecker(opts) {
    const header = ' [Tween:] ';
    const message = ` option is not support in v + ${VERSION}`;
    const _opts = opts;
    if (_opts.delay) {
      warn(`${header}delay${message}`);
    }
    if (_opts.repeat) {
      warn(`${header}repeat${message}`);
    }
    if (_opts.repeatDelay) {
      warn(`${header}repeatDelay${message}`);
    }
    if (_opts.interpolation) {
      warn(`${header}interpolation${message}`);
    }
    if (_opts.onStop) {
      warn(`${header}onStop${message}`);
    }
  }
  _export("TweenAction", void 0);
  return {
    setters: [function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
      warn = _coreIndexJs.warn;
      easing = _coreIndexJs.easing;
    }, function (_actionsActionIntervalJs) {
      ActionInterval = _actionsActionIntervalJs.ActionInterval;
    }, function (_coreGlobalExportsJs) {
      VERSION = _coreGlobalExportsJs.VERSION;
    }],
    execute: function () {
      _export("TweenAction", TweenAction = class TweenAction extends ActionInterval {
        constructor(duration, props, opts) {
          super();
          this._reversed = false;
          if (opts == null) {
            opts = Object.create(null);
          } else {
            /** checker */
            TweenOptionChecker(opts);

            /** adapter */
            if (opts.easing && typeof opts.easing === 'string') {
              opts.easing = TweenEasingAdapter(opts.easing);
            }

            // global easing or progress used for this action
            if (!opts.progress) {
              opts.progress = this.progress;
            }
            if (opts.easing && typeof opts.easing === 'string') {
              const easingName = opts.easing;
              opts.easing = easing[easingName];
              if (!opts.easing) {
                warnID(1031, easingName);
              }
            }
          }
          this._opts = opts;
          this._props = Object.create(null);
          for (const name in props) {
            var _value$legacyProgress;
            // filtering if
            // - it was not own property
            // - types was function / string
            // - it was undefined / null
            // eslint-disable-next-line no-prototype-builtins
            if (!props.hasOwnProperty(name)) continue;
            let value = props[name];
            if (typeof value === 'function') {
              value = value();
            } else if (value == null) {
              continue;
            }
            // property may have custom easing or progress function
            let customEasing;
            let customProgress;
            let customValue;
            if (value.value !== undefined) {
              customValue = value.value;
              if (typeof customValue === 'function') {
                customValue = customValue();
              }
              if (value.easing !== undefined) {
                if (typeof value.easing === 'string') {
                  customEasing = easing[value.easing];
                  if (!customEasing) warnID(1031, value.easing);
                } else {
                  customEasing = value.easing;
                }
              }
              if (value.progress !== undefined) {
                customProgress = value.progress;
              }
            } else {
              customValue = value;
            }
            const prop = Object.create(null);
            prop.start = prop.current = prop.end = null;
            prop.keys = null;
            prop.value = customValue;
            prop.easing = customEasing;
            prop.progress = customProgress;
            prop.convert = value.convert;
            prop.clone = value.clone;
            prop.add = value.add;
            prop.sub = value.sub;
            prop.legacyProgress = (_value$legacyProgress = value.legacyProgress) != null ? _value$legacyProgress : true;
            prop.toFixed = value.toFixed;
            prop.onStart = value.onStart;
            prop.onStop = value.onStop;
            prop.onComplete = value.onComplete;
            prop.valid = true;
            this._props[name] = prop;
          }
          this._originProps = props;
          this.initWithDuration(duration);
        }
        get relative() {
          return !!this._opts.relative;
        }
        clone() {
          const action = new TweenAction(this._duration, this._originProps, this._opts);
          action._reversed = this._reversed;
          action._owner = this._owner;
          action._id = this._id;
          this._cloneDecoration(action);
          return action;
        }
        reverse() {
          if (!this._opts.relative) {
            warnID(16382);
            return new TweenAction(0, {});
          }
          const action = new TweenAction(this._duration, this._originProps, this._opts);
          this._cloneDecoration(action);
          action._reversed = !this._reversed;
          action._owner = this._owner;
          return action;
        }
        startWithTarget(target) {
          const isEqual = true;
          if (!isEqual) return;
          super.startWithTarget(target);
          const workerTarget = this._getWorkerTarget();
          if (!workerTarget) return;
          const relative = !!this._opts.relative;
          const props = this._props;
          const reversed = this._reversed;
          for (const property in props) {
            const _t = workerTarget[property];
            if (_t === undefined) {
              continue;
            }
            const prop = props[property];
            const value = prop.value;
            if (typeof _t === 'number') {
              prop.start = _t;
              prop.current = _t;
              prop.end = relative ? reversed ? _t - value : _t + value : value;
            } else if (typeof _t === 'object') {
              if (prop.legacyProgress) {
                if (prop.start == null) {
                  const Ctor = _t.constructor;
                  prop.start = new Ctor();
                  prop.current = new Ctor();
                  prop.end = new Ctor();
                }
                let propertyKeys;
                if (value.getModifiableProperties) {
                  propertyKeys = value.getModifiableProperties();
                } else {
                  propertyKeys = Object.keys(value);
                }
                prop.keys = propertyKeys;
                for (let i = 0, len = propertyKeys.length; i < len; ++i) {
                  const k = propertyKeys[i];
                  // eslint-disable-next-line no-restricted-globals
                  if (isNaN(_t[k])) continue;
                  prop.start[k] = _t[k];
                  prop.current[k] = _t[k];
                  prop.end[k] = relative ? reversed ? _t[k] - value[k] : _t[k] + value[k] : value[k];
                }
              } else {
                const clone = prop.clone;
                if (!clone) {
                  warnID(16383, property);
                  prop.valid = false;
                  continue;
                } else {
                  const add = prop.add;
                  const sub = prop.sub;
                  if (relative) {
                    if (!add) {
                      warnID(16384, property);
                      prop.valid = false;
                    }
                    if (reversed && !sub) {
                      warnID(16385, property);
                      prop.valid = false;
                    }
                    if (!prop.valid) continue;
                  }
                  prop.start = clone(_t);
                  prop.current = clone(_t);
                  prop.end = relative ? reversed ? sub(_t, value) : add(_t, value) : clone(value);
                }
              }
            } else if (typeof _t === 'string') {
              const convertFn = prop.convert;
              const convertToNumber = v => {
                if (typeof v === 'number') return v;
                let convertedValue = v;
                if (convertFn) {
                  convertedValue = convertFn(v);
                }
                if (typeof convertedValue !== 'number') {
                  convertedValue = Number(convertedValue);
                  if (Number.isNaN(convertedValue)) {
                    warnID(16386, `${v}`);
                    return null;
                  }
                }
                return convertedValue;
              };
              const targetNumValue = convertToNumber(value);
              const startNumValue = convertToNumber(_t);
              if (targetNumValue == null || startNumValue == null) {
                prop.valid = false;
                continue;
              }
              prop.start = startNumValue;
              prop.current = _t;
              prop.end = relative ? reversed ? startNumValue - targetNumValue : startNumValue + targetNumValue : targetNumValue;
            }
            if (prop.onStart) {
              prop.onStart({
                relative,
                reversed,
                start: prop.start,
                end: prop.end
              });
            }
          }
          if (this._opts.onStart) {
            this._opts.onStart(workerTarget);
          }
        }
        stop() {
          const props = this._props;
          for (const name in props) {
            const prop = props[name];
            if (!prop.valid) continue;
            if (prop.onStop) {
              prop.onStop();
            }
          }
          super.stop();
        }
        update(t) {
          const workerTarget = this._getWorkerTarget();
          if (!workerTarget) return;
          if (!this._opts) return;
          const props = this._props;
          const opts = this._opts;
          let easingTime = t;
          if (typeof opts.easing === 'function') easingTime = opts.easing(t);
          const progress = opts.progress;
          for (const name in props) {
            const prop = props[name];
            if (!prop.valid) continue;
            const time = prop.easing ? prop.easing(t) : easingTime;
            const interpolation = prop.progress ? prop.progress : progress;
            const start = prop.start;
            const end = prop.end;
            const current = prop.current;
            if (typeof current === 'number') {
              prop.current = interpolation(start, end, prop.current, time);
            } else if (typeof start === 'object') {
              if (prop.legacyProgress) {
                const keys = prop.keys;
                for (let i = 0, len = keys.length; i < len; ++i) {
                  const k = keys[i];
                  prop.current[k] = interpolation(start[k], end[k], prop.current[k], time);
                }
              } else {
                prop.current = interpolation(start, end, prop.current, time);
              }
            } else if (typeof current === 'string') {
              let newCurrent = interpolation(start, end, prop.current, time);
              if (typeof newCurrent === 'number') {
                var _prop$toFixed;
                newCurrent = newCurrent.toFixed((_prop$toFixed = prop.toFixed) != null ? _prop$toFixed : 0);
              } else if (typeof newCurrent !== 'string') {
                warnID(16387);
                continue;
              }
              prop.current = newCurrent;
            }
            workerTarget[name] = prop.current;
            if (t === 1 && prop.onComplete) {
              prop.onComplete();
            }
          }
          if (opts.onUpdate) {
            opts.onUpdate(workerTarget, t);
          }
          if (t === 1 && opts.onComplete) {
            opts.onComplete(workerTarget);
          }
        }
        progress(start, end, current, t) {
          return current = start + (end - start) * t;
        }
        isUnknownDuration() {
          return false;
        }
      });
    }
  };
});