System.register("q-bundled:///fs/cocos/animation/target-path.js", ["../core/data/decorators/index.js", "../scene-graph/node.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, Node, warnID, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, HierarchyPath, ComponentPath;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */
  function isPropertyPath(path) {
    return typeof path === 'string' || typeof path === 'number';
  }

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */
  function isCustomPath(path, constructor) {
    return path instanceof constructor;
  }

  /**
   * @deprecated Since V3.3, use [[TrackPath]] instead.
   */
  _export({
    isPropertyPath: isPropertyPath,
    isCustomPath: isCustomPath
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
    }],
    execute: function () {
      _export("HierarchyPath", HierarchyPath = (_dec = ccclass('cc.animation.HierarchyPath'), _dec(_class = (_class2 = class HierarchyPath {
        constructor(path) {
          _initializerDefineProperty(this, "path", _descriptor, this);
          this.path = path || '';
        }
        get(target) {
          if (!(target instanceof Node)) {
            warnID(3925);
            return null;
          }
          const result = target.getChildByPath(this.path);
          if (!result) {
            warnID(3926, target.name, this.path);
            return null;
          }
          return result;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class));
      /**
       * @deprecated Since V3.3, use [[TrackPath]] instead.
       */
      _export("ComponentPath", ComponentPath = (_dec2 = ccclass('cc.animation.ComponentPath'), _dec2(_class3 = (_class4 = class ComponentPath {
        constructor(component) {
          _initializerDefineProperty(this, "component", _descriptor2, this);
          this.component = component || '';
        }
        get(target) {
          if (!(target instanceof Node)) {
            warnID(3927);
            return null;
          }
          const result = target.getComponent(this.component);
          if (!result) {
            warnID(3928, target.name, this.component);
            return null;
          }
          return result;
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "component", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class4)) || _class3));
    }
  };
});