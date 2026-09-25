System.register("q-bundled:///fs/cocos/2d/components/deprecated.js", ["./mask.js", "./label.js", "./label-outline.js", "./rich-text.js", "./sprite.js", "./ui-mesh-renderer.js", "./graphics.js", "./ui-static-batch.js", "./ui-opacity.js", "../../core/index.js", "./label-shadow.js"], function (_export, _context) {
  "use strict";

  var Mask, MaskType, Label, LabelOutline, RichText, Sprite, UIMeshRenderer, Graphics, UIStaticBatch, UIOpacity, js, cclegacy, replaceProperty, markAsWarning, LabelShadow;
  return {
    setters: [function (_maskJs) {
      Mask = _maskJs.Mask;
      MaskType = _maskJs.MaskType;
    }, function (_labelJs) {
      Label = _labelJs.Label;
    }, function (_labelOutlineJs) {
      LabelOutline = _labelOutlineJs.LabelOutline;
    }, function (_richTextJs) {
      RichText = _richTextJs.RichText;
    }, function (_spriteJs) {
      Sprite = _spriteJs.Sprite;
    }, function (_uiMeshRendererJs) {
      UIMeshRenderer = _uiMeshRendererJs.UIMeshRenderer;
    }, function (_graphicsJs) {
      Graphics = _graphicsJs.Graphics;
    }, function (_uiStaticBatchJs) {
      UIStaticBatch = _uiStaticBatchJs.UIStaticBatch;
    }, function (_uiOpacityJs) {
      UIOpacity = _uiOpacityJs.UIOpacity;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      cclegacy = _coreIndexJs.cclegacy;
      replaceProperty = _coreIndexJs.replaceProperty;
      markAsWarning = _coreIndexJs.markAsWarning;
    }, function (_labelShadowJs) {
      LabelShadow = _labelShadowJs.LabelShadow;
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
      /**
       * Alias of [[Mask]]
       * @deprecated Since v1.2
       */
      _export("MaskComponent", Mask);
      cclegacy.MaskComponent = Mask;
      js.setClassAlias(Mask, 'cc.MaskComponent');
      /**
       * Alias of [[Label]]
       * @deprecated Since v1.2
       */
      _export("LabelComponent", Label);
      cclegacy.LabelComponent = Label;
      js.setClassAlias(Label, 'cc.LabelComponent');
      /**
       * Alias of [[LabelOutline]]
       * @deprecated Since v1.2
       */
      _export("LabelOutlineComponent", LabelOutline);
      cclegacy.LabelOutlineComponent = LabelOutline;
      js.setClassAlias(LabelOutline, 'cc.LabelOutlineComponent');

      /**
       * Alias of [[RichText]]
       * @deprecated Since v1.2
       */
      _export("RichTextComponent", RichText);
      cclegacy.RichTextComponent = RichText;
      js.setClassAlias(RichText, 'cc.RichTextComponent');
      /**
       * Alias of [[Sprite]]
       * @deprecated Since v1.2
       */
      _export("SpriteComponent", Sprite);
      cclegacy.SpriteComponent = Sprite;
      js.setClassAlias(Sprite, 'cc.SpriteComponent');
      /**
       * Alias of [[UIMeshRenderer]]
       * @deprecated Since v1.2
       */
      _export("UIModelComponent", UIMeshRenderer);
      cclegacy.UIModelComponent = UIMeshRenderer;
      js.setClassAlias(UIMeshRenderer, 'cc.UIModelComponent');
      /**
       * Alias of [[Graphics]]
       * @deprecated Since v1.2
       */
      _export("GraphicsComponent", Graphics);
      cclegacy.GraphicsComponent = Graphics;
      js.setClassAlias(Graphics, 'cc.GraphicsComponent');
      /**
       * Alias of [[UIStaticBatch]]
       * @deprecated Since v1.2
       */
      _export("UIStaticBatchComponent", UIStaticBatch);
      js.setClassAlias(UIStaticBatch, 'cc.UIStaticBatchComponent');
      /**
       * Alias of [[UIOpacity]]
       * @deprecated Since v1.2
       */
      _export("UIOpacityComponent", UIOpacity);
      js.setClassAlias(UIOpacity, 'cc.UIOpacityComponent');
      replaceProperty(Mask.prototype, 'Mask', [{
        name: 'graphics',
        newName: 'subComp',
        target: Mask.prototype,
        targetName: 'Mask'
      }]);
      replaceProperty(MaskType, 'MaskType', [{
        name: 'RECT',
        newName: 'GRAPHICS_RECT',
        target: MaskType,
        targetName: 'MaskType'
      }, {
        name: 'ELLIPSE',
        newName: 'GRAPHICS_ELLIPSE',
        target: MaskType,
        targetName: 'MaskType'
      }, {
        name: 'IMAGE_STENCIL',
        newName: 'SPRITE_STENCIL',
        target: MaskType,
        targetName: 'MaskType'
      }]);
      markAsWarning(LabelOutline.prototype, 'LabelOutline', [{
        name: 'width',
        suggest: 'Please use Label.outlineWidth instead.'
      }, {
        name: 'color',
        suggest: 'Please use Label.outlineColor instead.'
      }]);
      markAsWarning(LabelShadow.prototype, 'LabelShadow', [{
        name: 'color',
        suggest: 'Please use Label.shadowColor instead.'
      }, {
        name: 'offset',
        suggest: 'Please use Label.shadowOffset instead.'
      }, {
        name: 'blur',
        suggest: 'Please use Label.shadowBlur instead.'
      }]);
    }
  };
});