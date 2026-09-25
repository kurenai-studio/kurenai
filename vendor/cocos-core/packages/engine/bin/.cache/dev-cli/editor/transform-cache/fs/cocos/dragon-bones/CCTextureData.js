System.register("q-bundled:///fs/cocos/dragon-bones/CCTextureData.js", ["@cocos/dragonbones-js", "../2d/index.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var BaseObject, TextureAtlasData, TextureData, SpriteFrame, Rect, _decorator, _dec, _class, _dec2, _class2, ccclass, CCTextureAtlasData, CCTextureData;
  return {
    setters: [function (_cocosDragonbonesJs) {
      BaseObject = _cocosDragonbonesJs.BaseObject;
      TextureAtlasData = _cocosDragonbonesJs.TextureAtlasData;
      TextureData = _cocosDragonbonesJs.TextureData;
    }, function (_dIndexJs) {
      SpriteFrame = _dIndexJs.SpriteFrame;
    }, function (_coreIndexJs) {
      Rect = _coreIndexJs.Rect;
      _decorator = _coreIndexJs._decorator;
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
      ({
        ccclass
      } = _decorator);
      /**
       * @en The texture atlas of dragonbones.
       * @zh 龙骨组件中的纹理图集资源。
       */
      _export("CCTextureAtlasData", CCTextureAtlasData = (_dec = ccclass('dragonBones.CCTextureAtlasData'), _dec(_class = class CCTextureAtlasData extends TextureAtlasData {
        constructor(...args) {
          super(...args);
          this._renderTexture = null;
        }
        /**
         * @en The texture used for rendering.
         * @zh 实际用于渲染显示的纹理对象。
         */
        get renderTexture() {
          return this._renderTexture;
        }
        set renderTexture(value) {
          this._renderTexture = value;
          if (value) {
            for (const k in this.textures) {
              const textureData = this.textures[k];
              if (!textureData.spriteFrame) {
                let rect = null;
                if (textureData.rotated) {
                  rect = new Rect(textureData.region.x, textureData.region.y, textureData.region.height, textureData.region.width);
                } else {
                  rect = new Rect(textureData.region.x, textureData.region.y, textureData.region.width, textureData.region.height);
                  // }
                  // const offset = new Vec2(0, 0);
                  // const size = new Size(rect.width, rect.height);
                  // setTexture(value, rect, false, offset, size);
                  textureData.spriteFrame = new SpriteFrame();
                  textureData.spriteFrame.texture = value;
                  textureData.spriteFrame.rect = rect;
                }
              }
            }
          } else {
            for (const k in this.textures) {
              const textureData = this.textures[k];
              textureData.spriteFrame = null;
            }
          }
        }
        /**
         * @engineInternal Since v3.7.2 this is an engine private function.
         */
        static toString() {
          return '[class dragonBones.CCTextureAtlasData]';
        }
        /**
         * @en Create texture data, get data from the object pool.
         * @zh 创建纹理数据，从对象池获取。
         */
        createTexture() {
          return BaseObject.borrowObject(CCTextureData);
        }
        /**
         * @en Clear associated texture resources.
         * @zh 清除关联的纹理。
         */
        _onClear() {
          super._onClear();
          this.renderTexture = null;
        }
      }) || _class));
      /**
       * @en Texture data used in dragonbones.
       * @zh 龙骨资源中的纹理数据。
       */
      _export("CCTextureData", CCTextureData = (_dec2 = ccclass('dragonBones.CCTextureData'), _dec2(_class2 = class CCTextureData extends TextureData {
        constructor(...args) {
          super(...args);
          /**
           * @en SpriteFrame assets.
           * @zh SpriteFrame 资源。
           */
          this.spriteFrame = null;
        }
        /**
         * @engineInternal Since v3.7.2 this is an engine private function.
         */
        static toString() {
          return '[class dragonBones.CCTextureData]';
        }
        /**
         * @en Clear SpriteFrame assets.
         * @zh 清除关联的SpriteFrame 资源。
         */
        _onClear() {
          super._onClear();
          this.spriteFrame = null;
        }
      }) || _class2));
    }
  };
});