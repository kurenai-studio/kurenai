System.register("q-bundled:///fs/cocos/dragon-bones/CCFactory.js", ["../../../virtual/internal%253Aconstants.js", "@cocos/dragonbones-js", "../core/index.js", "./CCTextureData.js", "./CCSlot.js", "./CCArmatureDisplay.js", "../scene-graph/index.js", "../game/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, Armature, BaseObject, Animation, BaseFactory, DragonBones, Scheduler, SystemPriority, _decorator, CCTextureAtlasData, CCSlot, CCArmatureDisplay, Node, director, Game, game, _dec, _class, _CCFactory, ccclass, CCFactory;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_cocosDragonbonesJs) {
      Armature = _cocosDragonbonesJs.Armature;
      BaseObject = _cocosDragonbonesJs.BaseObject;
      Animation = _cocosDragonbonesJs.Animation;
      BaseFactory = _cocosDragonbonesJs.BaseFactory;
      DragonBones = _cocosDragonbonesJs.DragonBones;
    }, function (_coreIndexJs) {
      Scheduler = _coreIndexJs.Scheduler;
      SystemPriority = _coreIndexJs.SystemPriority;
      _decorator = _coreIndexJs._decorator;
    }, function (_CCTextureDataJs) {
      CCTextureAtlasData = _CCTextureDataJs.CCTextureAtlasData;
    }, function (_CCSlotJs) {
      CCSlot = _CCSlotJs.CCSlot;
    }, function (_CCArmatureDisplayJs) {
      CCArmatureDisplay = _CCArmatureDisplayJs.CCArmatureDisplay;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
      Game = _gameIndexJs.Game;
      game = _gameIndexJs.game;
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
       * DragonBones factory
       * @class CCFactory
       * @extends BaseFactory
       * @en Usually only one global factory instance is needed. The factory creates
       * Armature object by parsing DragonBonesData and TextureAtlasData instances,
       * and is responsible for global updating the Dragonbones component animation
       * and rendering data.
       * @zh 通常只需要一个全局工厂实例，工厂通过解析 DragonBonesData 和 TextureAtlasData
       * 实例来创建骨架，并负责全局的龙骨组件动画和渲染数据的更新。
      */
      _export("CCFactory", CCFactory = (_dec = ccclass('CCFactory'), _dec(_class = (_CCFactory = class CCFactory extends BaseFactory {
        /**
         * @en
         * Get an CCFactory instance.
         * @zh
         * 获取一个 CCFactory 实例。
         * @method getInstance
         * @returns @en The global CCFactory instance object.
         *          @zh 返回全局的 CCFactory 实例对象。
         * @static
         * @example
         * let factory = CCFactory.getInstance();
        */
        static getInstance() {
          if (!CCFactory._factory) {
            CCFactory._factory = new CCFactory();
          }
          return CCFactory._factory;
        }
        /**
         * @en The id value always 'CCFactory'.
         * @zh 拥有固定值 'CCFactory'。
         */

        constructor() {
          super();
          this.id = void 0;
          /**
           * @en The uuid value always 'CCFactory'.
           * @zh 拥有固定值 'CCFactory'。
           */
          this.uuid = void 0;
          /**
           * @en Restores the sorted CCSlot objects.
           * @zh 存储已排序好的插槽。
           */
          this._slots = void 0;
          const eventManager = new CCArmatureDisplay();
          this._dragonBones = new DragonBones(eventManager);
          if (director.getScheduler()) {
            game.on(Game.EVENT_RESTART, this.onRestart, this);
            this.initUpdate();
          }
          this.id = this.uuid = 'CCFactory';
        }
        /**
         * @en Sets CCFactory object null when Restart game.
         * @zh 重启时需将工厂实例置空。
         */
        onRestart() {
          CCFactory._factory = null;
        }

        /**
         * @en Initialize update schedule.
         * @zh 初始化更新计划。
         */
        initUpdate(dt) {
          // director.getScheduler().enableForTarget(this);
          Scheduler.enableForTarget(this);
          director.getScheduler().scheduleUpdate(this, SystemPriority.HIGH, false);
        }
        /**
         * @en Trigger ArmatureDisplay components to update animation and render data.
         * @zh 触发 ArmatureDisplay 组件更新动画和渲染数据。
         */
        update(dt) {
          if (EDITOR_NOT_IN_PREVIEW) return;
          this._dragonBones.advanceTime(dt);
        }
        /**
         * @en Parser raw data to DragonBonesData.
         * @zh 从 raw data 解析出 DragonBonesData 数据。
         */
        getDragonBonesDataByRawData(rawData) {
          const dataParser = rawData instanceof ArrayBuffer ? BaseFactory._binaryParser : this._dataParser;
          return dataParser.parseDragonBonesData(rawData, 1.0);
        }
        /**
         * @en Build new armature with a new display.
         * @zh 创建骨架的显示数据。
         */
        // Build new armature with a new display.
        buildArmatureDisplay(armatureName, dragonBonesName, skinName, textureAtlasName) {
          const armature = this.buildArmature(armatureName, dragonBonesName, skinName, textureAtlasName);
          return armature ? armature._display : null;
        }

        // Build sub armature from an exist armature component.
        // It will share dragonAsset and dragonAtlasAsset.
        // But node can not share,or will cause render error.
        /**
         * @en Create a new node with Dragonbones component.
         * @zh 创建一个附带龙骨组件的 node 节点。
         */
        createArmatureNode(comp, armatureName, node) {
          node = node || new Node();
          let display = node.getComponent('dragonBones.ArmatureDisplay');
          if (!display) {
            display = node.addComponent('dragonBones.ArmatureDisplay');
          }
          node.name = armatureName;
          display._armatureName = armatureName;
          display._dragonAsset = comp.dragonAsset;
          display._dragonAtlasAsset = comp.dragonAtlasAsset;
          display._init();
          return display;
        }
        _buildTextureAtlasData(textureAtlasData, textureAtlas) {
          if (textureAtlasData) {
            textureAtlasData.renderTexture = textureAtlas;
          } else {
            textureAtlasData = BaseObject.borrowObject(CCTextureAtlasData);
          }
          return textureAtlasData;
        }
        _sortSlots() {
          const slots = this._slots;
          const sortedSlots = [];
          for (let i = 0, l = slots.length; i < l; i++) {
            const slot = slots[i];
            const zOrder = slot._zOrder;
            let inserted = false;
            for (let j = sortedSlots.length - 1; j >= 0; j--) {
              if (zOrder >= sortedSlots[j]._zOrder) {
                sortedSlots.splice(j + 1, 0, slot);
                inserted = true;
                break;
              }
            }
            if (!inserted) {
              sortedSlots.unshift(slot);
            }
          }
          this._slots = sortedSlots;
        }
        _buildArmature(dataPackage) {
          const armature = BaseObject.borrowObject(Armature);
          armature._skinData = dataPackage.skin;
          armature._animation = BaseObject.borrowObject(Animation);
          armature._animation._armature = armature;
          armature._animation.animations = dataPackage.armature.animations;
          armature._isChildArmature = false;

          // fixed dragonbones sort issue
          // armature._sortSlots = this._sortSlots;

          const display = new CCArmatureDisplay();
          armature.init(dataPackage.armature, display, display, this._dragonBones);
          return armature;
        }
        _buildSlot(dataPackage, slotData, displays) {
          const slot = BaseObject.borrowObject(CCSlot);
          const display = slot;
          slot.init(slotData, displays, display, display);
          return slot;
        }
        /**
         * @en Gets DragonBonesData object by UUID.
         * @zh 通过 UUID 获取 DragonBonesData object。
         */
        getDragonBonesDataByUUID(uuid) {
          for (const name in this._dragonBonesDataMap) {
            if (name.indexOf(uuid) !== -1) {
              return this._dragonBonesDataMap[name];
            }
          }
          return null;
        }
        /**
         * @en Remove DragonBonesData object from cache by UUID.
         * @zh 通过 UUID 从缓存移除 DragonBonesData object。
         */
        removeDragonBonesDataByUUID(uuid, disposeData) {
          if (disposeData === undefined) {
            disposeData = true;
          }
          for (const name in this._dragonBonesDataMap) {
            if (name.indexOf(uuid) === -1) continue;
            if (disposeData) {
              this._dragonBones.bufferObject(this._dragonBonesDataMap[name]);
            }
            delete this._dragonBonesDataMap[name];
          }
        }
      }, _CCFactory._factory = null, _CCFactory)) || _class));
    }
  };
});