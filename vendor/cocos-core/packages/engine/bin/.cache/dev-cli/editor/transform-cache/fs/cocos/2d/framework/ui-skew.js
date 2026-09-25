System.register("q-bundled:///fs/cocos/2d/framework/ui-skew.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../../scene-graph/component.js", "../../core/index.js", "../../scene-graph/index.js", "../../scene-graph/node.js"], function (_export, _context) {
  "use strict";

  var JSB, ccclass, disallowMultiple, displayOrder, executeInEditMode, menu, serializable, type, Component, CCBoolean, cclegacy, v2, Vec2, NodeEventType, TransformBit, TRANSFORM_ON, Node, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, tempVec2, SkewType, UISkew;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      cclegacy = _coreIndexJs.cclegacy;
      v2 = _coreIndexJs.v2;
      Vec2 = _coreIndexJs.Vec2;
    }, function (_sceneGraphIndexJs) {
      NodeEventType = _sceneGraphIndexJs.NodeEventType;
      TransformBit = _sceneGraphIndexJs.TransformBit;
    }, function (_sceneGraphNodeJs) {
      TRANSFORM_ON = _sceneGraphNodeJs.TRANSFORM_ON;
      Node = _sceneGraphNodeJs.Node;
    }],
    execute: function () {
      /*
       Copyright (c) 2025 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      tempVec2 = v2();
      SkewType = /*#__PURE__*/function (SkewType) {
        SkewType[SkewType["NONE"] = 0] = "NONE";
        SkewType[SkewType["STANDARD"] = 1] = "STANDARD";
        SkewType[SkewType["ROTATIONAL"] = 2] = "ROTATIONAL";
        return SkewType;
      }(SkewType || {});
      _export("UISkew", UISkew = (_dec = ccclass('cc.UISkew'), _dec2 = menu('UI/UISkew'), _dec3 = displayOrder(0), _dec4 = type(CCBoolean), _dec5 = displayOrder(1), _dec6 = type(Vec2), _dec(_class = _dec2(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class UISkew extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_skew", _descriptor, this);
          _initializerDefineProperty(this, "_rotational", _descriptor2, this);
          // FIXME(cjh): I added this property instead of `Component.enabled` since I found that
          // When in UISkew.onDisable callback, `this.enabled` may still be true.
          this._skewEnabled = false;
        }

        /**
         * @engineInternal
         * @mangle
         */
        isSkewEnabled() {
          return this._skewEnabled;
        }
        get rotational() {
          return this._rotational;
        }
        set rotational(value) {
          this._rotational = value;
          if (this._skewEnabled) {
            this._updateNodeTransformFlags();
          }
        }
        __preload() {
          this.node._uiProps._uiSkewComp = this;
          if (JSB) {
            this.node._setSkew(this._skew);
          }
        }
        onEnable() {
          this._skewEnabled = true;
          Node._incSkewCompCount();
          this._syncNative(true);
          this._updateNodeTransformFlags();
        }
        onDisable() {
          this._skewEnabled = false;
          Node._decSkewCompCount();
          this._syncNative(false);
          this._updateNodeTransformFlags();
        }
        onDestroy() {
          this._skewEnabled = false;
          this._syncNative(false);
          this.node._uiProps._uiSkewComp = null;
          this._updateNodeTransformFlags();
        }
        _syncNative(enabled) {
          if (JSB) {
            const node = this.node;
            if (enabled) {
              node._skewType = this._rotational ? SkewType.ROTATIONAL : SkewType.STANDARD;
            } else {
              node._skewType = SkewType.NONE;
            }
          }
        }

        /**
         * @en Gets the skew on x axis. Unit is degree.
         * @zh 获取 X 轴斜切角度。
         */
        get x() {
          return this._skew.x;
        }

        /**
         * @en Sets the skew on x axis. Unit is degree.
         * @zh 设置 X 轴斜切角度。
         */
        set x(v) {
          this._skew.x = v;
          if (JSB) {
            this.node._setSkewX(v);
          }
          if (this._skewEnabled) {
            this._updateNodeTransformFlags();
          }
        }

        /**
         * @en Gets the skew on y axis. Unit is degree.
         * @zh 获取 Y 轴斜切角度。
         */
        get y() {
          return this._skew.y;
        }

        /**
         * @en Sets the skew on y axis. Unit is degree.
         * @zh 设置 Y 轴斜切角度。
         */
        set y(v) {
          this._skew.y = v;
          if (JSB) {
            this.node._setSkewY(v);
          }
          if (this._skewEnabled) {
            this._updateNodeTransformFlags();
          }
        }

        /**
         * @en Gets the skew value of the node. Unit is degree.
         * @zh 获取节点斜切角度。
         */
        get skew() {
          return this._skew;
        }

        /**
         * @en Sets the skew value of the node. Unit is degree.
         * @zh 设置节点斜切角度。
         */
        set skew(value) {
          this.setSkew(value);
        }

        /**
         * @en Sets the skew value of the node by Vec2.
         * @zh 设置节点斜切角度。
         * @param @en value The skew value in Vec2. @zh 斜切角度值。
         */

        /**
         * @en Sets the skew value of the node by x and y.
         * @zh 设置节点斜切角度。
         * @param x @en The skew on x axis. @zh X 轴斜切角度。
         * @param y @en The skew on y axis. @zh Y 轴斜切角度。
         */

        setSkew(xOrVec2, y) {
          const v = this._skew;
          if (typeof xOrVec2 === 'number') {
            tempVec2.set(xOrVec2, y);
          } else {
            Vec2.copy(tempVec2, xOrVec2);
          }
          if (Vec2.equals(v, tempVec2)) return;
          v.set(tempVec2);
          if (JSB) {
            this.node._setSkew(v);
          }
          if (this._skewEnabled) {
            this._updateNodeTransformFlags();
          }
        }

        /**
         * @en Copies and returns the skew value of the node.
         * @zh 拷贝节点斜切角度值并返回。
         * @returns @en The skew value of the node. @zh 节点斜切角度。
         */
        getSkew(out) {
          if (!out) out = new Vec2();
          return out.set(this._skew);
        }
        _updateNodeTransformFlags() {
          const node = this.node;
          node.invalidateChildren(TransformBit.SKEW);
          if (node._eventMask & TRANSFORM_ON) {
            node.emit(NodeEventType.TRANSFORM_CHANGED, TransformBit.SKEW);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_skew", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return v2();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_rotational", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "rotational", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "rotational"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "skew", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "skew"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
      cclegacy.UISkew = UISkew;
    }
  };
});