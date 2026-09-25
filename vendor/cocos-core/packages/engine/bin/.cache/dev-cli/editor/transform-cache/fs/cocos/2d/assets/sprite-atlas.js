System.register("q-bundled:///fs/cocos/2d/assets/sprite-atlas.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../../asset/assets/index.js", "./sprite-frame.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, TEST, ccclass, serializable, editable, Asset, SpriteFrame, cclegacy, js, _dec, _class, _class2, _descriptor, SpriteAtlas;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_assetAssetsIndexJs) {
      Asset = _assetAssetsIndexJs.Asset;
    }, function (_spriteFrameJs) {
      SpriteFrame = _spriteFrameJs.SpriteFrame;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      js = _coreIndexJs.js;
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
      /**
       * @en
       * Class for sprite atlas handling.
       * @zh
       * 精灵图集资源类。
       */
      _export("SpriteAtlas", SpriteAtlas = (_dec = ccclass('cc.SpriteAtlas'), _dec(_class = (_class2 = class SpriteAtlas extends Asset {
        constructor(name) {
          super(name);
          /**
           * @en All sprite frames in the sprite atlas.
           * @zh 精灵图集中的所有精灵。
           */
          _initializerDefineProperty(this, "spriteFrames", _descriptor, this);
        }

        /**
         * @en Get the [[Texture2D]] asset of the atlas.
         * @zh 获取精灵图集的贴图。
         * @returns @en The texture2d asset. @zh 二维贴图资源。
         */
        getTexture() {
          const keys = Object.keys(this.spriteFrames);
          if (keys.length > 0) {
            const spriteFrame = this.spriteFrames[keys[0]];
            return spriteFrame && spriteFrame.texture;
          } else {
            return null;
          }
        }

        /**
         * @en Gets the [[SpriteFrame]] correspond to the given key in sprite atlas.
         * @zh 根据键值获取精灵。
         *
         * @param key @en The SpriteFrame name. @zh 精灵名字。
         * @returns @en The SpriteFrame asset. @zh 精灵资源。
         */
        getSpriteFrame(key) {
          const sf = this.spriteFrames[key];
          if (!sf) {
            return null;
          }
          if (!sf.name) {
            sf.name = key;
          }
          return sf;
        }

        /**
         * @en Returns all sprite frames in the sprite atlas.
         * @zh 获取精灵图集所有精灵。
         * @returns @en All sprite frames. @zh 所有的精灵资源。
         */
        getSpriteFrames() {
          const frames = [];
          const spriteFrames = this.spriteFrames;
          for (const key in spriteFrames) {
            frames.push(spriteFrames[key]);
          }
          return frames;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _serialize(ctxForExporting) {
          if (EDITOR || NODEJS || TEST) {
            const frames = [];
            for (const key in this.spriteFrames) {
              const spriteFrame = this.spriteFrames[key];
              let id = spriteFrame ? spriteFrame._uuid : '';
              if (ctxForExporting) {
                if (id && ctxForExporting._compressUuid) {
                  id = EditorExtends.UuidUtils.compressUuid(id, true);
                }
                if (id) {
                  ctxForExporting.dependsOn('_textureSource', id);
                }
              }
              frames.push(key);
              frames.push(id);
            }
            return {
              name: this._name,
              spriteFrames: frames
            };
          }
          return null;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _deserialize(serializeData, handle) {
          const data = serializeData;
          this._name = data.name;
          const frames = data.spriteFrames;
          this.spriteFrames = js.createMap();
          for (let i = 0; i < frames.length; i += 2) {
            handle.result.push(this.spriteFrames, frames[i], frames[i + 1], js.getClassId(SpriteFrame));
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "spriteFrames", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return js.createMap();
        }
      }), _class2)) || _class));
      cclegacy.SpriteAtlas = SpriteAtlas;
    }
  };
});