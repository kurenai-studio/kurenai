System.register("q-bundled:///fs/cocos/profiler/counter.js", [], function (_export, _context) {
  "use strict";

  var Counter;
  _export("Counter", void 0);
  return {
    setters: [],
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
      _export("Counter", Counter = class Counter {
        get value() {
          return this._value;
        }
        set value(val) {
          this._value = val;
        }
        constructor(id, opts, now) {
          this._total = 0;
          this._value = 0;
          this._averageValue = 0;
          this._accumValue = 0;
          this._accumSamples = 0;
          this._id = id;
          this._opts = opts;
          this._accumStart = now;
        }
        sample(now) {
          this._average(this._value, now);
        }
        human() {
          const {
            average,
            isInteger
          } = this._opts;
          const v = average ? this._averageValue : this._value;
          return isInteger ? Math.round(v) : Math.round(v * 100) / 100;
        }
        alarm() {
          if (this._opts.below !== undefined && this._value < this._opts.below) {
            return true;
          }
          if (this._opts.over !== undefined && this._value > this._opts.over) {
            return true;
          }
          return false;
        }
        _average(v, now = 0) {
          if (this._opts.average) {
            this._accumValue += v;
            ++this._accumSamples;
            const t = now;
            if (t - this._accumStart >= this._opts.average) {
              this._averageValue = this._accumValue / this._accumSamples;
              this._accumValue = 0;
              this._accumStart = t;
              this._accumSamples = 0;
            }
          }
        }
      });
    }
  };
});