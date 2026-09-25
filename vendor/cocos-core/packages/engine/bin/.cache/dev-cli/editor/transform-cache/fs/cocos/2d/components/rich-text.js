System.register("q-bundled:///fs/cocos/2d/components/rich-text.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../assets/index.js", "../../core/index.js", "../utils/html-text-parser.js", "../../scene-graph/index.js", "./label.js", "./sprite.js", "../framework/index.js", "../../scene-graph/component.js", "../../scene-graph/node-event.js", "../utils/text-utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, requireComponent, executeInEditMode, executionOrder, help, menu, multiline, type, displayOrder, serializable, editable, DEBUG, DEV, EDITOR, Font, SpriteAtlas, TTFFont, assert, warnID, Color, Vec2, CCObjectFlags, cclegacy, js, HtmlTextParser, Node, CacheMode, HorizontalTextAlignment, Label, VerticalTextAlignment, Sprite, UITransform, Component, NodeEventType, BASELINE_RATIO, fragmentText, isUnicodeCJK, isUnicodeSpace, getEnglishWordPartAtFirst, getEnglishWordPartAtLast, getSymbolAt, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _RichText, _htmlTextParser, RichTextChildName, RichTextChildImageName, _tempSize, _tempSizeLeft, labelPool, imagePool, RichText;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  //
  function createSegment(type) {
    return {
      node: new Node(type),
      comp: null,
      lineCount: 0,
      styleIndex: 0,
      imageOffset: '',
      clickParam: '',
      clickHandler: '',
      type
    };
  }
  function getSegmentByPool(type, content) {
    let seg;
    if (type === RichTextChildName) {
      seg = labelPool._get();
    } else if (type === RichTextChildImageName) {
      seg = imagePool._get();
    }
    seg = seg || createSegment(type);
    let node = seg.node;
    if (!node) {
      node = new Node(type);
    }
    node.hideFlags |= CCObjectFlags.DontSave | CCObjectFlags.HideInHierarchy;
    node.active = true; // Reset node state when use node
    if (type === RichTextChildImageName) {
      seg.comp = node.getComponent(Sprite) || node.addComponent(Sprite);
      seg.comp.spriteFrame = content;
      seg.comp.type = Sprite.Type.SLICED;
      seg.comp.sizeMode = Sprite.SizeMode.CUSTOM;
    } else {
      // RichTextChildName
      seg.comp = node.getComponent(Label) || node.addComponent(Label);
      seg.comp.string = content;
      seg.comp.horizontalAlign = HorizontalTextAlignment.LEFT;
      seg.comp.verticalAlign = VerticalTextAlignment.TOP;
      seg.comp.underlineHeight = 2;
    }
    node.setPosition(0, 0, 0);
    const trans = node._getUITransformComp();
    trans.setAnchorPoint(0.5, 0.5);
    seg.node = node;
    seg.lineCount = 0;
    seg.styleIndex = 0;
    seg.imageOffset = '';
    seg.clickParam = '';
    seg.clickHandler = '';
    return seg;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      multiline = _coreDataDecoratorsIndexJs.multiline;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      DEV = _virtualInternal253AconstantsJs.DEV;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetsIndexJs) {
      Font = _assetsIndexJs.Font;
      SpriteAtlas = _assetsIndexJs.SpriteAtlas;
      TTFFont = _assetsIndexJs.TTFFont;
    }, function (_coreIndexJs) {
      assert = _coreIndexJs.assert;
      warnID = _coreIndexJs.warnID;
      Color = _coreIndexJs.Color;
      Vec2 = _coreIndexJs.Vec2;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
    }, function (_utilsHtmlTextParserJs) {
      HtmlTextParser = _utilsHtmlTextParserJs.HtmlTextParser;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_labelJs) {
      CacheMode = _labelJs.CacheMode;
      HorizontalTextAlignment = _labelJs.HorizontalTextAlignment;
      Label = _labelJs.Label;
      VerticalTextAlignment = _labelJs.VerticalTextAlignment;
    }, function (_spriteJs) {
      Sprite = _spriteJs.Sprite;
    }, function (_frameworkIndexJs) {
      UITransform = _frameworkIndexJs.UITransform;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_utilsTextUtilsJs) {
      BASELINE_RATIO = _utilsTextUtilsJs.BASELINE_RATIO;
      fragmentText = _utilsTextUtilsJs.fragmentText;
      isUnicodeCJK = _utilsTextUtilsJs.isUnicodeCJK;
      isUnicodeSpace = _utilsTextUtilsJs.isUnicodeSpace;
      getEnglishWordPartAtFirst = _utilsTextUtilsJs.getEnglishWordPartAtFirst;
      getEnglishWordPartAtLast = _utilsTextUtilsJs.getEnglishWordPartAtLast;
      getSymbolAt = _utilsTextUtilsJs.getSymbolAt;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _htmlTextParser = new HtmlTextParser();
      RichTextChildName = 'RICHTEXT_CHILD';
      RichTextChildImageName = 'RICHTEXT_Image_CHILD';
      _tempSize = new Vec2();
      _tempSizeLeft = new Vec2();
      /**
       * 富文本池。<br/>
       */
      labelPool = new js.Pool(seg => {
        if (DEV) {
          assert(!seg.node.parent, 'Recycling node\'s parent should be null!');
        }
        if (!cclegacy.isValid(seg.node)) {
          return false;
        } else {
          const label = seg.node.getComponent(Label);
          if (label) {
            label.outlineWidth = 0;
          }
        }
        return true;
      }, 20);
      imagePool = new js.Pool(seg => {
        if (DEV) {
          assert(!seg.node.parent, 'Recycling node\'s parent should be null!');
        }
        return cclegacy.isValid(seg.node);
      }, 10);
      /**
       * @en
       * The RichText Component.
       *
       * @zh
       * 富文本组件。
       */
      _export("RichText", RichText = (_dec = ccclass('cc.RichText'), _dec2 = requireComponent(UITransform), _dec3 = help('i18n:cc.RichText'), _dec4 = executionOrder(110), _dec5 = menu('2D/RichText'), _dec6 = type(HorizontalTextAlignment), _dec7 = type(VerticalTextAlignment), _dec8 = type(Color), _dec9 = type(Font), _dec0 = displayOrder(12), _dec1 = type(CacheMode), _dec10 = type(SpriteAtlas), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = executeInEditMode(_class = (_class2 = (_RichText = class RichText extends Component {
        /**
         * @en
         * Content string of RichText.
         *
         * @zh
         * 富文本显示的文本内容。
         */
        get string() {
          return this._string;
        }
        set string(value) {
          if (this._string === value) {
            return;
          }
          this._string = value;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Horizontal Alignment of each line in RichText.
         *
         * @zh
         * 文本内容的水平对齐方式。
         */
        get horizontalAlign() {
          return this._horizontalAlign;
        }
        set horizontalAlign(value) {
          if (this.horizontalAlign === value) {
            return;
          }
          this._horizontalAlign = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Vertical Alignment of each line in RichText.
         *
         * @zh
         * 文本内容的竖直对齐方式。
         */
        get verticalAlign() {
          return this._verticalAlign;
        }
        set verticalAlign(value) {
          if (this._verticalAlign === value) {
            return;
          }
          this._verticalAlign = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Font size of RichText.
         *
         * @zh
         * 富文本字体大小。
         */
        get fontSize() {
          return this._fontSize;
        }
        set fontSize(value) {
          if (this._fontSize === value) {
            return;
          }
          this._fontSize = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Font color of RichText. Works when the text content does not have a color parameter set. Transparency cascade is not supported.
         *
         * @zh
         * 富文本默认文字颜色。在文本内容没有设置颜色参数时生效。暂不支持颜色级联。
         */
        get fontColor() {
          return this._fontColor;
        }
        set fontColor(value) {
          if (this._fontColor === value) {
            return;
          }
          this._fontColor = value;
          this._updateTextDefaultColor();
        }

        /**
         * @en
         * Custom System font of RichText.
         *
         * @zh
         * 富文本定制系统字体。
         */
        get fontFamily() {
          return this._fontFamily;
        }
        set fontFamily(value) {
          if (this._fontFamily === value) return;
          this._fontFamily = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Custom System font of RichText.
         *
         * @zh
         * 富文本定制字体。
         */
        get font() {
          return this._font;
        }
        set font(value) {
          if (this._font === value) {
            return;
          }
          this._font = value;
          this._layoutDirty = true;
          if (this._font) {
            if (EDITOR) {
              this._userDefinedFont = this._font;
            }
            this.useSystemFont = false;
            this._onTTFLoaded();
          } else {
            this.useSystemFont = true;
          }
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Whether to use system font name or not.
         *
         * @zh
         * 是否使用系统字体。
         */
        get useSystemFont() {
          return this._isSystemFontUsed;
        }
        set useSystemFont(value) {
          if (this._isSystemFontUsed === value) {
            return;
          }
          this._isSystemFontUsed = value;
          if (EDITOR) {
            if (value) {
              this._font = null;
            } else if (this._userDefinedFont) {
              this._font = this._userDefinedFont;
              return;
            }
          }
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * The cache mode of label. This mode only supports system fonts.
         *
         * @zh
         * 文本缓存模式, 该模式只支持系统字体。
         */
        get cacheMode() {
          return this._cacheMode;
        }
        set cacheMode(value) {
          if (this._cacheMode === value) {
            return;
          }
          this._cacheMode = value;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * The maximize width of the RichText.
         *
         * @zh
         * 富文本的最大宽度。
         */
        get maxWidth() {
          return this._maxWidth;
        }
        set maxWidth(value) {
          if (this._maxWidth === value) {
            return;
          }
          this._maxWidth = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Line Height of RichText.
         *
         * @zh
         * 富文本行高。
         */
        get lineHeight() {
          return this._lineHeight;
        }
        set lineHeight(value) {
          if (this._lineHeight === value) {
            return;
          }
          this._lineHeight = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * The image atlas for the img tag. For each src value in the img tag, there should be a valid spriteFrame in the image atlas.
         *
         * @zh
         * 对于 img 标签里面的 src 属性名称，都需要在 imageAtlas 里面找到一个有效的 spriteFrame，否则 img tag 会判定为无效。
         */
        get imageAtlas() {
          return this._imageAtlas;
        }
        set imageAtlas(value) {
          if (this._imageAtlas === value) {
            return;
          }
          this._imageAtlas = value;
          this._layoutDirty = true;
          this._updateRichTextStatus();
        }

        /**
         * @en
         * Once checked, the RichText will block all input events (mouse and touch) within
         * the bounding box of the node, preventing the input from penetrating into the underlying node.
         *
         * @zh
         * 选中此选项后，RichText 将阻止节点边界框中的所有输入事件（鼠标和触摸），从而防止输入事件穿透到底层节点。
         */
        get handleTouchEvent() {
          return this._handleTouchEvent;
        }
        set handleTouchEvent(value) {
          if (this._handleTouchEvent === value) {
            return;
          }
          this._handleTouchEvent = value;
          if (this.enabledInHierarchy) {
            if (this.handleTouchEvent) {
              this._addEventListeners();
            } else {
              this._removeEventListeners();
            }
          }
        }
        /**
         * @en Enum for horizontal text alignment.
         *
         * @zh 文本横向对齐类型。
         */

        // only ISegment

        constructor() {
          super();
          _initializerDefineProperty(this, "_lineHeight", _descriptor, this);
          _initializerDefineProperty(this, "_string", _descriptor2, this);
          // protected _updateRichTextStatus =
          _initializerDefineProperty(this, "_horizontalAlign", _descriptor3, this);
          _initializerDefineProperty(this, "_verticalAlign", _descriptor4, this);
          _initializerDefineProperty(this, "_fontSize", _descriptor5, this);
          _initializerDefineProperty(this, "_fontColor", _descriptor6, this);
          _initializerDefineProperty(this, "_maxWidth", _descriptor7, this);
          _initializerDefineProperty(this, "_fontFamily", _descriptor8, this);
          _initializerDefineProperty(this, "_font", _descriptor9, this);
          _initializerDefineProperty(this, "_isSystemFontUsed", _descriptor0, this);
          _initializerDefineProperty(this, "_userDefinedFont", _descriptor1, this);
          _initializerDefineProperty(this, "_cacheMode", _descriptor10, this);
          _initializerDefineProperty(this, "_imageAtlas", _descriptor11, this);
          _initializerDefineProperty(this, "_handleTouchEvent", _descriptor12, this);
          this._textArray = [];
          this._segments = [];
          this._labelSegmentsCache = [];
          this._linesWidth = [];
          this._lineCount = 1;
          this._labelWidth = 0;
          this._labelHeight = 0;
          this._layoutDirty = true;
          this._lineOffsetX = 0;
          this._labelChildrenNum = 0;
          this._updateRichTextStatus = this._updateRichText;
        }
        onLoad() {
          this.node.on(NodeEventType.LAYER_CHANGED, this._applyLayer, this);
          this.node.on(NodeEventType.ANCHOR_CHANGED, this._updateRichTextPosition, this);
        }
        onEnable() {
          if (this.handleTouchEvent) {
            this._addEventListeners();
          }
          this._updateRichText();
          this._activateChildren(true);
        }
        onDisable() {
          if (this.handleTouchEvent) {
            this._removeEventListeners();
          }
          this._activateChildren(false);
        }
        onRestore() {
          if (!EDITOR) {
            return;
          }

          // TODO: refine undo/redo system
          // Because undo/redo will not call onEnable/onDisable,
          // we need call onEnable/onDisable manually to active/disactive children nodes.
          if (this.enabledInHierarchy) {
            this.onEnable();
          } else {
            this.onDisable();
          }
        }
        onDestroy() {
          this._segments.forEach(seg => {
            seg.node.removeFromParent();
            if (seg.type === RichTextChildName) {
              labelPool.put(seg);
            } else if (seg.type === RichTextChildImageName) {
              imagePool.put(seg);
            }
          });
          this.node.off(NodeEventType.ANCHOR_CHANGED, this._updateRichTextPosition, this);
          this.node.off(NodeEventType.LAYER_CHANGED, this._applyLayer, this);
        }
        _addEventListeners() {
          this.node.on(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        }
        _removeEventListeners() {
          this.node.off(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        }
        _updateLabelSegmentTextAttributes() {
          this._segments.forEach(item => {
            this._applyTextAttribute(item);
          });
        }
        _createFontLabel(str) {
          return getSegmentByPool(RichTextChildName, str);
        }
        _createImage(spriteFrame) {
          return getSegmentByPool(RichTextChildImageName, spriteFrame);
        }
        _onTTFLoaded() {
          if (this._font instanceof TTFFont) {
            this._layoutDirty = true;
            this._updateRichText();
          } else {
            this._layoutDirty = true;
            this._updateRichText();
          }
        }

        /**
        * @engineInternal
        * @mangle
        */
        splitLongStringApproximatelyIn2048(text, styleIndex) {
          const approxSize = text.length * this.fontSize;
          const partStringArr = [];
          // avoid that many short richtext still execute _calculateSize so that performance is low
          // we set a threshold as 2048 * 0.8, if the estimated size is less than it, we can skip _calculateSize precisely
          if (approxSize <= 2048 * 0.8) {
            partStringArr.push(text);
            return partStringArr;
          }
          this._calculateSize(_tempSize, styleIndex, text);
          if (_tempSize.x < 2048) {
            partStringArr.push(text);
          } else {
            const multilineTexts = text.split('\n');
            for (let i = 0; i < multilineTexts.length; i++) {
              this._calculateSize(_tempSize, styleIndex, multilineTexts[i]);
              if (_tempSize.x < 2048) {
                partStringArr.push(multilineTexts[i]);
              } else {
                const thisPartSplitResultArr = this.splitLongStringOver2048(multilineTexts[i], styleIndex);
                partStringArr.push(...thisPartSplitResultArr);
              }
            }
          }
          return partStringArr;
        }

        /**
        * @engineInternal
        * @mangle
        */
        splitLongStringOver2048(text, styleIndex) {
          const partStringArr = [];
          const longStr = text;
          let curStart = 0;
          let curEnd = longStr.length / 2;
          let curString = longStr.substring(curStart, curEnd);
          let leftString = longStr.substring(curEnd);
          const curStringSize = this._calculateSize(_tempSize, styleIndex, curString);
          const leftStringSize = this._calculateSize(_tempSizeLeft, styleIndex, leftString);
          let maxWidth = this._maxWidth;
          if (this._maxWidth === 0) {
            maxWidth = 2047.9; // Callback when maxWidth is 0
          }

          // a line should be an unit to split long string
          const lineCountForOnePart = 1;
          const sizeForOnePart = lineCountForOnePart * maxWidth;

          // divide text into some pieces of which the size is less than sizeForOnePart
          while (curStringSize.x > sizeForOnePart) {
            curEnd /= 2;
            // at least one char can be an entity, step back.
            if (curEnd < 1) {
              curEnd *= 2;
              break;
            }
            curString = curString.substring(curStart, curEnd);
            leftString = longStr.substring(curEnd);
            this._calculateSize(curStringSize, styleIndex, curString);
          }

          // avoid too many loops
          let leftTryTimes = 1000;
          // the minimum step of expansion or reduction
          let curWordStep = 1;
          while (leftTryTimes && curStart < text.length) {
            while (leftTryTimes && curStringSize.x < sizeForOnePart) {
              const nextPartExec = getEnglishWordPartAtFirst(leftString);
              // add a character, unless there is a complete word at the beginning of the next line
              if (nextPartExec && nextPartExec.length > 0) {
                curWordStep = nextPartExec[0].length;
              }
              curEnd += curWordStep;
              curString = longStr.substring(curStart, curEnd);
              leftString = longStr.substring(curEnd);
              this._calculateSize(curStringSize, styleIndex, curString);
              leftTryTimes--;
            }

            // reduce condition：size > maxwidth && curString.length >= 2
            while (leftTryTimes && curString.length >= 2 && curStringSize.x > sizeForOnePart) {
              curEnd -= curWordStep;
              curString = longStr.substring(curStart, curEnd);
              this._calculateSize(curStringSize, styleIndex, curString);
              // after the first reduction, the step should be 1.
              curWordStep = 1;
              leftTryTimes--;
            }

            // consider there is a part of a word at the end of this line, it should be moved to the next line
            if (curString.length >= 2) {
              const lastWordExec = getEnglishWordPartAtLast(curString);
              if (lastWordExec && lastWordExec.length > 0
              // to avoid endless loop when there is only one word in this line
              && curString !== lastWordExec[0]) {
                curEnd -= lastWordExec[0].length;
                curString = longStr.substring(curStart, curEnd);
              }
            }

            // curStart and curEnd can be float since they are like positions of pointer,
            // but step must be integer because we split the complete characters of which the unit is integer.
            // it is reasonable that using the length of this result to estimate the next result.
            partStringArr.push(curString);
            const partStep = curString.length;
            curStart = curEnd;
            curEnd += partStep;
            curString = longStr.substring(curStart, curEnd);
            leftString = longStr.substring(curEnd);
            this._calculateSize(leftStringSize, styleIndex, leftString);
            this._calculateSize(curStringSize, styleIndex, curString);
            leftTryTimes--;

            // Exit: If the left part string size is less than 2048, the method will finish.
            if (leftStringSize.x < 2048 && curStringSize.x < sizeForOnePart) {
              partStringArr.push(curString);
              curStart = text.length;
              curEnd = text.length;
              curString = leftString;
              if (leftString !== '') {
                partStringArr.push(curString);
              }
              break;
            }
          }
          return partStringArr;
        }
        _measureText(styleIndex, string) {
          const func = s => {
            const width = this._calculateSize(_tempSize, styleIndex, s).x;
            return width;
          };
          if (string) {
            return func(string);
          } else {
            return func;
          }
        }

        /**
        * @engineInternal
        * @mangle
        */
        _calculateSize(out, styleIndex, s) {
          let label;
          if (this._labelSegmentsCache.length === 0) {
            label = this._createFontLabel(s);
            this._labelSegmentsCache.push(label);
          } else {
            label = this._labelSegmentsCache[0];
            label.node.getComponent(Label).string = s;
          }
          label.styleIndex = styleIndex;
          this._applyTextAttribute(label);
          const size = label.node._getUITransformComp().contentSize;
          Vec2.set(out, size.x, size.y);
          return out;
        }
        _onTouchEnded(event) {
          const components = this.node.getComponents(Component);
          this._segments.forEach(seg => {
            const clickHandler = seg.clickHandler;
            const clickParam = seg.clickParam;
            if (clickHandler && this._containsTouchLocation(seg, event.touch.getUILocation())) {
              components.forEach(component => {
                const func = component[clickHandler];
                if (component.enabledInHierarchy && func) {
                  func.call(component, event, clickParam);
                }
              });
              event.propagationStopped = true;
            }
          });
        }
        _containsTouchLocation(label, point) {
          const comp = label.node.getComponent(UITransform);
          if (!comp) {
            return false;
          }
          const myRect = comp.getBoundingBoxToWorld();
          return myRect.contains(point);
        }
        _resetState() {
          const children = this.node.children;
          for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child.name === RichTextChildName || child.name === RichTextChildImageName) {
              if (DEBUG) {
                assert(child.parent === this.node);
              }
              child.parent = null;
              const segment = createSegment(child.name);
              segment.node = child;
              if (child.name === RichTextChildName) {
                segment.comp = child.getComponent(Label);
                labelPool.put(segment);
              } else {
                segment.comp = child.getComponent(Sprite);
                imagePool.put(segment);
              }
              this._labelChildrenNum--;
            }
          }
          this._segments.length = 0;
          this._labelSegmentsCache.length = 0;
          this._linesWidth.length = 0;
          this._lineOffsetX = 0;
          this._lineCount = 1;
          this._labelWidth = 0;
          this._labelHeight = 0;
          this._layoutDirty = true;
        }
        _activateChildren(active) {
          for (let i = this.node.children.length - 1; i >= 0; i--) {
            const child = this.node.children[i];
            if (child.name === RichTextChildName || child.name === RichTextChildImageName) {
              child.active = active;
            }
          }
        }
        _addLabelSegment(stringToken, styleIndex) {
          let labelSegment;
          if (this._labelSegmentsCache.length === 0) {
            labelSegment = this._createFontLabel(stringToken);
          } else {
            labelSegment = this._labelSegmentsCache.pop();
            const label = labelSegment.node.getComponent(Label);
            if (label) {
              label.string = stringToken;
            }
          }

          // set vertical alignments
          // because horizontal alignment is applied with line offsets in method "_updateRichTextPosition"
          const labelComp = labelSegment.comp;
          if (labelComp.verticalAlign !== this._verticalAlign) {
            labelComp.verticalAlign = this._verticalAlign;
          }
          labelSegment.styleIndex = styleIndex;
          labelSegment.lineCount = this._lineCount;
          labelSegment.node._getUITransformComp().setAnchorPoint(0, 0);
          labelSegment.node.layer = this.node.layer;
          this.node.insertChild(labelSegment.node, this._labelChildrenNum++);
          this._applyTextAttribute(labelSegment);
          this._segments.push(labelSegment);
          return labelSegment;
        }
        _updateRichTextWithMaxWidth(labelString, labelWidth, styleIndex) {
          let fragmentWidth = labelWidth;
          let labelSegment;
          if (this._lineOffsetX > 0 && fragmentWidth + this._lineOffsetX > this._maxWidth) {
            // concat previous line
            let checkStartIndex = 0;
            while (this._lineOffsetX <= this._maxWidth) {
              const checkEndIndex = this._getFirstWordLen(labelString, checkStartIndex, labelString.length);
              const checkString = labelString.substr(checkStartIndex, checkEndIndex);
              const checkStringWidth = this._measureText(styleIndex, checkString);
              if (this._lineOffsetX + checkStringWidth <= this._maxWidth) {
                this._lineOffsetX += checkStringWidth;
                checkStartIndex += checkEndIndex;
              } else {
                if (checkStartIndex > 0) {
                  const remainingString = labelString.substr(0, checkStartIndex);
                  this._addLabelSegment(remainingString, styleIndex);
                  labelString = labelString.substr(checkStartIndex, labelString.length);
                  fragmentWidth = this._measureText(styleIndex, labelString);
                }
                this._updateLineInfo();
                break;
              }
            }
          }
          if (fragmentWidth > this._maxWidth) {
            const fragments = fragmentText(labelString, fragmentWidth, this._maxWidth, this._measureText(styleIndex));
            for (let k = 0; k < fragments.length; ++k) {
              const splitString = fragments[k];
              labelSegment = this._addLabelSegment(splitString, styleIndex);
              const labelSize = labelSegment.node._getUITransformComp().contentSize;
              this._lineOffsetX += labelSize.width;
              if (fragments.length > 1 && k < fragments.length - 1) {
                this._updateLineInfo();
              }
            }
          } else {
            this._lineOffsetX += fragmentWidth;
            this._addLabelSegment(labelString, styleIndex);
          }
        }
        _isLastComponentCR(stringToken) {
          return stringToken.length - 1 === stringToken.lastIndexOf('\n');
        }
        _updateLineInfo() {
          this._linesWidth.push(this._lineOffsetX);
          this._lineOffsetX = 0;
          this._lineCount++;
        }
        _needsUpdateTextLayout(newTextArray) {
          if (this._layoutDirty || !this._textArray || !newTextArray) {
            return true;
          }
          if (this._textArray.length !== newTextArray.length) {
            return true;
          }
          for (let i = 0; i < this._textArray.length; i++) {
            const oldItem = this._textArray[i];
            const newItem = newTextArray[i];
            if (oldItem.text !== newItem.text) {
              return true;
            } else {
              const oldStyle = oldItem.style;
              const newStyle = newItem.style;
              if (oldStyle) {
                if (newStyle) {
                  if (!!newStyle.outline !== !!oldStyle.outline) {
                    return true;
                  }
                  if (oldStyle.size !== newStyle.size || oldStyle.italic !== newStyle.italic || oldStyle.isImage !== newStyle.isImage) {
                    return true;
                  }
                  if (oldStyle.src !== newStyle.src || oldStyle.imageAlign !== newStyle.imageAlign || oldStyle.imageHeight !== newStyle.imageHeight || oldStyle.imageWidth !== newStyle.imageWidth || oldStyle.imageOffset !== newStyle.imageOffset) {
                    return true;
                  }
                } else if (oldStyle.size || oldStyle.italic || oldStyle.isImage || oldStyle.outline) {
                  return true;
                }
              } else if (newStyle) {
                if (newStyle.size || newStyle.italic || newStyle.isImage || newStyle.outline) {
                  return true;
                }
              }
            }
          }
          return false;
        }
        _addRichTextImageElement(richTextElement) {
          if (!richTextElement.style) {
            return;
          }
          const style = richTextElement.style;
          const spriteFrameName = style.src;
          const spriteFrame = this._imageAtlas && spriteFrameName && this._imageAtlas.getSpriteFrame(spriteFrameName);
          if (!spriteFrame) {
            warnID(4400);
          } else {
            const segment = this._createImage(spriteFrame);
            const uiTransform = segment.node._getUITransformComp();
            switch (style.imageAlign) {
              case 'top':
                uiTransform.setAnchorPoint(0, 1);
                break;
              case 'center':
                uiTransform.setAnchorPoint(0, 0.5);
                break;
              default:
                uiTransform.setAnchorPoint(0, 0);
                break;
            }
            if (style.imageOffset) {
              segment.imageOffset = style.imageOffset;
            }
            segment.node.layer = this.node.layer;
            this.node.insertChild(segment.node, this._labelChildrenNum++);
            this._segments.push(segment);
            const spriteRect = spriteFrame.rect.clone();
            let scaleFactor = 1;
            let spriteWidth = spriteRect.width;
            let spriteHeight = spriteRect.height;
            const expectWidth = style.imageWidth || 0;
            const expectHeight = style.imageHeight || 0;
            if (expectHeight > 0) {
              scaleFactor = expectHeight / spriteHeight;
              spriteWidth *= scaleFactor;
              spriteHeight *= scaleFactor;
            } else {
              scaleFactor = this._lineHeight / spriteHeight;
              spriteWidth *= scaleFactor;
              spriteHeight *= scaleFactor;
            }
            if (expectWidth > 0) {
              spriteWidth = expectWidth;
            }
            if (this._maxWidth > 0) {
              if (this._lineOffsetX + spriteWidth > this._maxWidth) {
                this._updateLineInfo();
              }
              this._lineOffsetX += spriteWidth;
            } else {
              this._lineOffsetX += spriteWidth;
              if (this._lineOffsetX > this._labelWidth) {
                this._labelWidth = this._lineOffsetX;
              }
            }
            uiTransform.setContentSize(spriteWidth, spriteHeight);
            segment.lineCount = this._lineCount;
            segment.clickHandler = '';
            segment.clickParam = '';
            const event = style.event;
            if (event) {
              segment.clickHandler = event.click;
              segment.clickParam = event.param;
            }
          }
        }
        _updateTextDefaultColor() {
          for (let i = 0; i < this._segments.length; ++i) {
            var _this$_textArray$segm;
            const segment = this._segments[i];
            const label = segment.node.getComponent(Label);
            if (!label) {
              continue;
            }
            if ((_this$_textArray$segm = this._textArray[segment.styleIndex]) != null && (_this$_textArray$segm = _this$_textArray$segm.style) != null && _this$_textArray$segm.color) {
              continue;
            }
            label.color = this._fontColor;
          }
        }
        _updateRichText() {
          if (!this.enabledInHierarchy) {
            return;
          }
          const newTextArray = _htmlTextParser.parse(this._string);
          if (!this._needsUpdateTextLayout(newTextArray)) {
            this._textArray = newTextArray.slice();
            this._updateLabelSegmentTextAttributes();
            return;
          }
          this._textArray = newTextArray.slice();
          this._resetState();
          let lastEmptyLine = false;
          let label;
          for (let i = 0; i < this._textArray.length; ++i) {
            const richTextElement = this._textArray[i];
            let text = richTextElement.text;
            if (text === undefined) {
              continue;
            }

            // handle <br/> <img /> tag
            if (text === '') {
              if (richTextElement.style && richTextElement.style.isNewLine) {
                this._updateLineInfo();
                continue;
              }
              if (richTextElement.style && richTextElement.style.isImage && this._imageAtlas) {
                this._addRichTextImageElement(richTextElement);
                continue;
              }
            }
            const splitArr = this.splitLongStringApproximatelyIn2048(text, i);
            text = splitArr.join('\n');
            const multilineTexts = text.split('\n');
            for (let j = 0; j < multilineTexts.length; ++j) {
              const labelString = multilineTexts[j];
              if (labelString === '') {
                // for continues \n
                if (this._isLastComponentCR(text) && j === multilineTexts.length - 1) {
                  continue;
                }
                this._updateLineInfo();
                lastEmptyLine = true;
                continue;
              }
              lastEmptyLine = false;
              if (this._maxWidth > 0) {
                const labelWidth = this._measureText(i, labelString);
                this._updateRichTextWithMaxWidth(labelString, labelWidth, i);
                if (multilineTexts.length > 1 && j < multilineTexts.length - 1) {
                  this._updateLineInfo();
                }
              } else {
                label = this._addLabelSegment(labelString, i);
                this._lineOffsetX += label.node._getUITransformComp().width;
                if (this._lineOffsetX > this._labelWidth) {
                  this._labelWidth = this._lineOffsetX;
                }
                if (multilineTexts.length > 1 && j < multilineTexts.length - 1) {
                  this._updateLineInfo();
                }
              }
            }
          }
          if (!lastEmptyLine) {
            this._linesWidth.push(this._lineOffsetX);
          }
          if (this._maxWidth > 0) {
            this._labelWidth = this._maxWidth;
          }
          this._labelHeight = (this._lineCount + BASELINE_RATIO) * this._lineHeight;

          // trigger "size-changed" event
          this.node._getUITransformComp().setContentSize(this._labelWidth, this._labelHeight);
          this._updateRichTextPosition();
          this._layoutDirty = false;
        }
        _getFirstWordLen(text, startIndex, textLen) {
          let character = getSymbolAt(text, startIndex);
          if (isUnicodeCJK(character) || isUnicodeSpace(character)) {
            return 1;
          }
          let len = 1;
          for (let index = startIndex + 1; index < textLen; ++index) {
            character = getSymbolAt(text, index);
            if (isUnicodeSpace(character) || isUnicodeCJK(character)) {
              break;
            }
            len++;
          }
          return len;
        }
        _updateRichTextPosition() {
          let nextTokenX = 0;
          let nextLineIndex = 1;
          const totalLineCount = this._lineCount;
          const trans = this.node._getUITransformComp();
          const anchorX = trans.anchorX;
          const anchorY = trans.anchorY;
          for (let i = 0; i < this._segments.length; ++i) {
            const segment = this._segments[i];
            const lineCount = segment.lineCount;
            if (lineCount > nextLineIndex) {
              nextTokenX = 0;
              nextLineIndex = lineCount;
            }
            let lineOffsetX = this._labelWidth * (this._horizontalAlign * 0.5 - anchorX);
            switch (this._horizontalAlign) {
              case HorizontalTextAlignment.LEFT:
                break;
              case HorizontalTextAlignment.CENTER:
                lineOffsetX -= this._linesWidth[lineCount - 1] / 2;
                break;
              case HorizontalTextAlignment.RIGHT:
                lineOffsetX -= this._linesWidth[lineCount - 1];
                break;
              default:
                break;
            }
            const segmentNode = segment.node;
            const pos = segmentNode.position;
            segmentNode.setPosition(nextTokenX + lineOffsetX, this._lineHeight * (totalLineCount - lineCount) - this._labelHeight * anchorY, pos.z);
            if (lineCount === nextLineIndex) {
              nextTokenX += segmentNode._getUITransformComp().width;
            }
            const sprite = segmentNode.getComponent(Sprite);
            if (sprite) {
              const position = segmentNode.position.clone();
              // adjust img align (from <img align=top|center|bottom>)
              const lineHeightSet = this._lineHeight;
              const lineHeightReal = this._lineHeight * (1 + BASELINE_RATIO); // single line node height
              switch (segmentNode._getUITransformComp().anchorY) {
                case 1:
                  position.y += lineHeightSet + (lineHeightReal - lineHeightSet) / 2;
                  break;
                case 0.5:
                  position.y += lineHeightReal / 2;
                  break;
                default:
                  position.y += (lineHeightReal - lineHeightSet) / 2;
                  break;
              }
              // adjust img offset (from <img offset=12|12,34>)
              if (segment.imageOffset) {
                const offsets = segment.imageOffset.split(',');
                if (offsets.length === 1 && offsets[0]) {
                  const offsetY = parseFloat(offsets[0]);
                  if (Number.isInteger(offsetY)) position.y += offsetY;
                } else if (offsets.length === 2) {
                  const offsetX = parseFloat(offsets[0]);
                  const offsetY = parseFloat(offsets[1]);
                  if (Number.isInteger(offsetX)) position.x += offsetX;
                  if (Number.isInteger(offsetY)) position.y += offsetY;
                }
              }
              segmentNode.position = position;
            }

            // adjust y for label with outline
            const label = segmentNode.getComponent(Label);
            if (label && label.enableOutline) {
              const position = segmentNode.position.clone();
              position.y -= label.outlineWidth;
              segmentNode.position = position;
            }
          }
        }
        _convertLiteralColorValue(color) {
          const colorValue = color.toUpperCase();
          if (Color[colorValue]) {
            const colorUse = Color[colorValue];
            return colorUse;
          } else {
            const out = new Color();
            return out.fromHEX(color);
          }
        }
        _applyTextAttribute(labelSeg) {
          const label = labelSeg.node.getComponent(Label);
          if (!label) {
            return;
          }
          this._resetLabelState(label);
          const index = labelSeg.styleIndex;
          let textStyle;
          if (this._textArray[index]) {
            textStyle = this._textArray[index].style;
          }
          if (textStyle) {
            if (textStyle.color) {
              label.color = this._convertLiteralColorValue(textStyle.color);
            } else {
              label.color = this._fontColor;
            }
            label.isBold = !!textStyle.bold;
            label.isItalic = !!textStyle.italic;
            // TODO: temporary implementation, the italic effect should be implemented in the internal of label-assembler.
            // if (textStyle.italic) {
            //     labelNode.skewX = 12;
            // }

            label.isUnderline = !!textStyle.underline;
            if (textStyle.outline) {
              label.enableOutline = true;
              label.outlineColor = this._convertLiteralColorValue(textStyle.outline.color);
              label.outlineWidth = textStyle.outline.width;
            }
            label.fontSize = textStyle.size || this._fontSize;
            labelSeg.clickHandler = '';
            labelSeg.clickParam = '';
            const event = textStyle.event;
            if (event) {
              labelSeg.clickHandler = event.click || '';
              labelSeg.clickParam = event.param || '';
            }
          }
          label.cacheMode = this._cacheMode;
          const isAsset = this._font instanceof Font;
          if (isAsset && !this._isSystemFontUsed) {
            label.font = this._font;
          } else {
            label.fontFamily = this._fontFamily;
          }
          label.useSystemFont = this._isSystemFontUsed;
          label.lineHeight = this._lineHeight;
          label.updateRenderData(true);
        }
        _applyLayer() {
          this._segments.forEach(seg => {
            seg.node.layer = this.node.layer;
          });
        }
        _resetLabelState(label) {
          label.fontSize = this._fontSize;
          label.color = this._fontColor;
          label.isBold = false;
          label.isItalic = false;
          label.isUnderline = false;
        }
      }, _RichText.HorizontalAlign = HorizontalTextAlignment, _RichText.VerticalAlign = VerticalTextAlignment, _RichText), _applyDecoratedDescriptor(_class2.prototype, "string", [multiline], Object.getOwnPropertyDescriptor(_class2.prototype, "string"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "horizontalAlign", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "horizontalAlign"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "verticalAlign", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "verticalAlign"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fontSize", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "fontSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fontColor", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "fontColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fontFamily", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "fontFamily"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "font", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "font"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "useSystemFont", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "useSystemFont"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cacheMode", [_dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "cacheMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "maxWidth", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "maxWidth"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lineHeight", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "lineHeight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "imageAtlas", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "imageAtlas"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleTouchEvent", [editable], Object.getOwnPropertyDescriptor(_class2.prototype, "handleTouchEvent"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_lineHeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 40;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_string", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '<color=#00ff00>Rich</color><color=#0fffff>Text</color>';
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_horizontalAlign", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return HorizontalTextAlignment.LEFT;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_verticalAlign", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return VerticalTextAlignment.TOP;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_fontSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 40;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_fontColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_maxWidth", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_fontFamily", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'Arial';
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_font", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_isSystemFontUsed", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_userDefinedFont", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_cacheMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CacheMode.NONE;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_imageAtlas", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_handleTouchEvent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
      cclegacy.RichText = RichText;
    }
  };
});