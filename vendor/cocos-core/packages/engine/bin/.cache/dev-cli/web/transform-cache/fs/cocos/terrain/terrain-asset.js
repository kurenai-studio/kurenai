System.register("q-bundled:///fs/cocos/terrain/terrain-asset.js", ["../core/data/decorators/index.js", "../asset/assets/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, Asset, TerrainBuffer, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _dec2, _class3, _dec3, _class4, _class5, _descriptor7, TERRAIN_MAX_LEVELS, TERRAIN_MAX_BLEND_LAYERS, TERRAIN_MAX_LAYER_COUNT, TERRAIN_BLOCK_TILE_COMPLEXITY, TERRAIN_BLOCK_VERTEX_COMPLEXITY, TERRAIN_BLOCK_VERTEX_SIZE, TERRAIN_HEIGHT_BASE, TERRAIN_HEIGHT_FACTORY, TERRAIN_HEIGHT_FACTORY_V7, TERRAIN_HEIGHT_FMIN, TERRAIN_HEIGHT_FMAX, TERRAIN_NORTH_INDEX, TERRAIN_SOUTH_INDEX, TERRAIN_WEST_INDEX, TERRAIN_EAST_INDEX, TERRAIN_DATA_VERSION, TERRAIN_DATA_VERSION2, TERRAIN_DATA_VERSION3, TERRAIN_DATA_VERSION4, TERRAIN_DATA_VERSION5, TERRAIN_DATA_VERSION6, TERRAIN_DATA_VERSION7, TERRAIN_DATA_VERSION8, TERRAIN_DATA_VERSION_DEFAULT, TerrainLayerInfo, TerrainLayerBinaryInfo, TerrainAsset;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_assetAssetsIndexJs) {
      Asset = _assetAssetsIndexJs.Asset;
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
      _export("TERRAIN_MAX_LEVELS", TERRAIN_MAX_LEVELS = 4);
      _export("TERRAIN_MAX_BLEND_LAYERS", TERRAIN_MAX_BLEND_LAYERS = 4);
      _export("TERRAIN_MAX_LAYER_COUNT", TERRAIN_MAX_LAYER_COUNT = 256);
      _export("TERRAIN_BLOCK_TILE_COMPLEXITY", TERRAIN_BLOCK_TILE_COMPLEXITY = 32);
      _export("TERRAIN_BLOCK_VERTEX_COMPLEXITY", TERRAIN_BLOCK_VERTEX_COMPLEXITY = 33);
      _export("TERRAIN_BLOCK_VERTEX_SIZE", TERRAIN_BLOCK_VERTEX_SIZE = 8); // position + normal + uv
      _export("TERRAIN_HEIGHT_BASE", TERRAIN_HEIGHT_BASE = 32768);
      _export("TERRAIN_HEIGHT_FACTORY", TERRAIN_HEIGHT_FACTORY = 1.0 / 128.0);
      _export("TERRAIN_HEIGHT_FACTORY_V7", TERRAIN_HEIGHT_FACTORY_V7 = 1.0 / 512.0);
      _export("TERRAIN_HEIGHT_FMIN", TERRAIN_HEIGHT_FMIN = -TERRAIN_HEIGHT_BASE * TERRAIN_HEIGHT_FACTORY);
      _export("TERRAIN_HEIGHT_FMAX", TERRAIN_HEIGHT_FMAX = (65535 - TERRAIN_HEIGHT_BASE) * TERRAIN_HEIGHT_FACTORY);
      _export("TERRAIN_NORTH_INDEX", TERRAIN_NORTH_INDEX = 0);
      _export("TERRAIN_SOUTH_INDEX", TERRAIN_SOUTH_INDEX = 1);
      _export("TERRAIN_WEST_INDEX", TERRAIN_WEST_INDEX = 2);
      _export("TERRAIN_EAST_INDEX", TERRAIN_EAST_INDEX = 3);
      _export("TERRAIN_DATA_VERSION", TERRAIN_DATA_VERSION = 0x01010001);
      _export("TERRAIN_DATA_VERSION2", TERRAIN_DATA_VERSION2 = 0x01010002);
      _export("TERRAIN_DATA_VERSION3", TERRAIN_DATA_VERSION3 = 0x01010003);
      _export("TERRAIN_DATA_VERSION4", TERRAIN_DATA_VERSION4 = 0x01010004);
      _export("TERRAIN_DATA_VERSION5", TERRAIN_DATA_VERSION5 = 0x01010005);
      _export("TERRAIN_DATA_VERSION6", TERRAIN_DATA_VERSION6 = 0x01010006);
      _export("TERRAIN_DATA_VERSION7", TERRAIN_DATA_VERSION7 = 0x01010007);
      _export("TERRAIN_DATA_VERSION8", TERRAIN_DATA_VERSION8 = 0x01010008);
      _export("TERRAIN_DATA_VERSION_DEFAULT", TERRAIN_DATA_VERSION_DEFAULT = 0x01010111);
      TerrainBuffer = class TerrainBuffer {
        constructor() {
          this.length = 0;
          this.buffer = new Uint8Array(2048);
          this._buffView = new DataView(this.buffer.buffer);
          this._seekPos = 0;
        }
        reserve(size) {
          if (this.buffer.byteLength > size) {
            return;
          }
          let capacity = this.buffer.byteLength;
          while (capacity < size) {
            capacity += capacity;
          }
          const temp = new Uint8Array(capacity);
          for (let i = 0; i < this.length; ++i) {
            temp[i] = this.buffer[i];
          }
          this.buffer = temp;
          this._buffView = new DataView(this.buffer.buffer);
        }
        assign(buff) {
          this.buffer = buff;
          this.length = buff.length;
          this._seekPos = buff.byteOffset;
          this._buffView = new DataView(buff.buffer);
        }
        writeInt8(value) {
          this.reserve(this.length + 1);
          this._buffView.setInt8(this.length, value);
          this.length += 1;
        }
        writeInt16(value) {
          this.reserve(this.length + 2);
          this._buffView.setInt16(this.length, value, true);
          this.length += 2;
        }
        writeInt32(value) {
          this.reserve(this.length + 4);
          this._buffView.setInt32(this.length, value, true);
          this.length += 4;
        }
        writeIntArray(value) {
          this.reserve(this.length + 4 * value.length);
          for (let i = 0; i < value.length; ++i) {
            this._buffView.setInt32(this.length + i * 4, value[i], true);
          }
          this.length += 4 * value.length;
        }
        writeFloat(value) {
          this.reserve(this.length + 4);
          this._buffView.setFloat32(this.length, value, true);
          this.length += 4;
        }
        writeFloatArray(value) {
          this.reserve(this.length + 4 * value.length);
          for (let i = 0; i < value.length; ++i) {
            this._buffView.setFloat32(this.length + i * 4, value[i], true);
          }
          this.length += 4 * value.length;
        }
        writeDouble(value) {
          this.reserve(this.length + 8);
          this._buffView.setFloat64(this.length, value, true);
          this.length += 8;
        }
        writeDoubleArray(value) {
          this.reserve(this.length + 8 * value.length);
          for (let i = 0; i < value.length; ++i) {
            this._buffView.setFloat64(this.length + i * 8, value[i], true);
          }
          this.length += 8 * value.length;
        }
        writeString(value) {
          this.reserve(this.length + value.length + 4);
          this._buffView.setInt32(this.length, value.length, true);
          for (let i = 0; i < value.length; ++i) {
            this._buffView.setInt8(this.length + 4 + i, value.charCodeAt(i));
          }
          this.length += value.length + 4;
        }
        readInt8() {
          const value = this._buffView.getInt8(this._seekPos);
          this._seekPos += 1;
          return value;
        }
        readInt16() {
          const value = this._buffView.getInt16(this._seekPos, true);
          this._seekPos += 2;
          return value;
        }
        readInt() {
          const value = this._buffView.getInt32(this._seekPos, true);
          this._seekPos += 4;
          return value;
        }
        readIntArray(value) {
          for (let i = 0; i < value.length; ++i) {
            value[i] = this._buffView.getInt32(this._seekPos + i * 4, true);
          }
          this._seekPos += 4 * value.length;
          return value;
        }
        readFloat() {
          const value = this._buffView.getFloat32(this._seekPos, true);
          this._seekPos += 4;
          return value;
        }
        readFloatArray(value) {
          for (let i = 0; i < value.length; ++i) {
            value[i] = this._buffView.getFloat32(this._seekPos + i * 4, true);
          }
          this._seekPos += 4 * value.length;
          return value;
        }
        readDouble() {
          const value = this._buffView.getFloat64(this._seekPos, true);
          this._seekPos += 8;
          return value;
        }
        readDoubleArray(value) {
          for (let i = 0; i < value.length; ++i) {
            value[i] = this._buffView.getFloat64(this._seekPos + i * 4, true);
          }
          this._seekPos += 8 * value.length;
          return value;
        }
        readString() {
          const length = this.readInt();
          let value = '';
          for (let i = 0; i < length; ++i) {
            value += String.fromCharCode(this.readInt8());
          }
          return value;
        }
      };
      /**
       * @en terrain layer info
       * @zh 地形纹理信息
       */
      _export("TerrainLayerInfo", TerrainLayerInfo = (_dec = ccclass('cc.TerrainLayerInfo'), _dec(_class = (_class2 = class TerrainLayerInfo {
        constructor() {
          _initializerDefineProperty(this, "slot", _descriptor, this);
          _initializerDefineProperty(this, "tileSize", _descriptor2, this);
          _initializerDefineProperty(this, "detailMap", _descriptor3, this);
          _initializerDefineProperty(this, "normalMap", _descriptor4, this);
          _initializerDefineProperty(this, "roughness", _descriptor5, this);
          _initializerDefineProperty(this, "metallic", _descriptor6, this);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "slot", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "tileSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "detailMap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "normalMap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "roughness", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "metallic", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
      /**
       * @en terrain layer binary info
       * @zh 地形纹理二进制信息
       */
      _export("TerrainLayerBinaryInfo", TerrainLayerBinaryInfo = (_dec2 = ccclass('cc.TerrainLayerBinaryInfo'), _dec2(_class3 = class TerrainLayerBinaryInfo {
        constructor() {
          this.slot = 0;
          this.tileSize = 1;
          this.roughness = 1;
          this.metallic = 0;
          this.detailMapId = '';
          this.normalMapId = '';
        }
      }) || _class3));
      /**
       * @en terrain asset
       * @zh 地形资源
       */
      _export("TerrainAsset", TerrainAsset = (_dec3 = ccclass('cc.TerrainAsset'), _dec3(_class4 = (_class5 = class TerrainAsset extends Asset {
        constructor() {
          super();
          this._version = 0;
          this._data = null;
          this._tileSize = 1;
          this._blockCount = [1, 1];
          this._weightMapSize = 128;
          this._lightMapSize = 128;
          this._heights = new Uint16Array();
          this._normals = new Float32Array();
          this._weights = new Uint8Array();
          this._layerBuffer = [-1, -1, -1, -1];
          this._layerBinaryInfos = [];
          _initializerDefineProperty(this, "_layerInfos", _descriptor7, this);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeAsset() {
          return this._data.buffer;
        }
        set _nativeAsset(value) {
          if (this._data && this._data.byteLength === value.byteLength) {
            this._data.set(new Uint8Array(value));
          } else {
            this._data = new Uint8Array(value);
          }
          this._loadNativeData(this._data);
        }

        /**
         * @en version
         * @zh 版本
         */
        get version() {
          return this._version;
        }

        /**
         * @en tile size
         * @zh 栅格大小
         */
        set tileSize(value) {
          this._tileSize = value;
        }
        get tileSize() {
          return this._tileSize;
        }

        /**
         * @en block count
         * @zh 块数量
         */
        set blockCount(value) {
          this._blockCount = value;
        }
        get blockCount() {
          return this._blockCount;
        }

        /**
         * @en light map size
         * @zh 光照图大小
         */
        set lightMapSize(value) {
          this._lightMapSize = value;
        }
        get lightMapSize() {
          return this._lightMapSize;
        }

        /**
         * @en weight map size
         * @zh 权重图大小
         */
        set weightMapSize(value) {
          this._weightMapSize = value;
        }
        get weightMapSize() {
          return this._weightMapSize;
        }

        /**
         * @en height buffer
         * @zh 高度缓存
         */
        set heights(value) {
          this._heights = value;
        }
        get heights() {
          return this._heights;
        }

        /**
         * @en normal buffer
         * @zh 法线缓存
         */
        set normals(value) {
          this._normals = value;
        }
        get normals() {
          return this._normals;
        }

        /**
         * @en weight buffer
         * @zh 权重缓存
         */
        set weights(value) {
          this._weights = value;
        }
        get weights() {
          return this._weights;
        }

        /**
         * @en layer buffer
         * @zh 纹理索引缓存
         */
        set layerBuffer(value) {
          this._layerBuffer = value;
        }
        get layerBuffer() {
          return this._layerBuffer;
        }

        /**
         * @en layer info
         * @zh 纹理信息
         */
        set layerInfos(value) {
          this._layerInfos = value;
        }
        get layerInfos() {
          return this._layerInfos;
        }
        get layerBinaryInfos() {
          return this._layerBinaryInfos;
        }

        /**
         * @en get layer
         * @zh 获得纹理索引
         * @param xBlock block index x
         * @param yBlock block index y
         * @param layerId layer id
         */
        getLayer(xBlock, yBlock, layerId) {
          const blockId = yBlock * this.blockCount[0] + xBlock;
          const index = blockId * 4 + layerId;
          if (xBlock < this.blockCount[0] && yBlock < this.blockCount[1] && index < this._layerBuffer.length) {
            return this._layerBuffer[index];
          }
          return -1;
        }
        getHeight(i, j) {
          const vertexCountX = this._blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY + 1;
          return (this._heights[j * vertexCountX + i] - TERRAIN_HEIGHT_BASE) * TERRAIN_HEIGHT_FACTORY;
        }
        getVertexCountI() {
          if (this._blockCount.length < 1) return 0;
          return this._blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY + 1;
        }
        getVertexCountJ() {
          if (this._blockCount.length < 2) return 0;
          return this._blockCount[1] * TERRAIN_BLOCK_TILE_COMPLEXITY + 1;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _setNativeData(_nativeData) {
          this._data = _nativeData;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _loadNativeData(_nativeData) {
          if (!_nativeData || _nativeData.length === 0) {
            return false;
          }
          const stream = new TerrainBuffer();
          stream.assign(_nativeData);

          // version
          this._version = stream.readInt();
          if (this._version === TERRAIN_DATA_VERSION_DEFAULT) {
            return true;
          }
          if (this._version !== TERRAIN_DATA_VERSION && this._version !== TERRAIN_DATA_VERSION2 && this._version !== TERRAIN_DATA_VERSION3 && this._version !== TERRAIN_DATA_VERSION4 && this._version !== TERRAIN_DATA_VERSION5 && this._version !== TERRAIN_DATA_VERSION6 && this._version !== TERRAIN_DATA_VERSION7 && this._version !== TERRAIN_DATA_VERSION8) {
            return false;
          }

          // geometry info
          if (this._version >= TERRAIN_DATA_VERSION7) {
            this.tileSize = stream.readDouble();
          } else {
            this.tileSize = stream.readFloat();
          }
          this.tileSize = Math.floor(this.tileSize * 100) / 100.0;
          stream.readIntArray(this._blockCount);
          this.weightMapSize = stream.readInt16();
          this.lightMapSize = stream.readInt16();

          // heights
          const heightBufferSize = stream.readInt();
          this.heights = new Uint16Array(heightBufferSize);
          for (let i = 0; i < this.heights.length; ++i) {
            this.heights[i] = stream.readInt16();
          }
          if (this._version < TERRAIN_DATA_VERSION8) {
            for (let i = 0; i < this.heights.length; ++i) {
              const h = (this._heights[i] - TERRAIN_HEIGHT_BASE) * TERRAIN_HEIGHT_FACTORY_V7;
              const ch = TERRAIN_HEIGHT_BASE + h / TERRAIN_HEIGHT_FACTORY;
              this.heights[i] = ch;
            }
          }

          // normals
          if (this._version >= TERRAIN_DATA_VERSION6) {
            const normalBufferSize = stream.readInt();
            this.normals = new Float32Array(normalBufferSize);
            for (let i = 0; i < this.normals.length; ++i) {
              this.normals[i] = stream.readFloat();
            }
          }

          // weights
          const WeightBufferSize = stream.readInt();
          this.weights = new Uint8Array(WeightBufferSize);
          for (let i = 0; i < this.weights.length; ++i) {
            this.weights[i] = stream.readInt8();
          }

          // layer buffer
          if (this._version >= TERRAIN_DATA_VERSION2) {
            const layerBufferSize = stream.readInt();
            this.layerBuffer = new Array(layerBufferSize);
            for (let i = 0; i < this.layerBuffer.length; ++i) {
              this.layerBuffer[i] = stream.readInt16();
            }
          }

          // layer infos
          if (this._version >= TERRAIN_DATA_VERSION3) {
            const layerInfoSize = stream.readInt();
            this._layerBinaryInfos = new Array(layerInfoSize);
            for (let i = 0; i < this._layerBinaryInfos.length; ++i) {
              this._layerBinaryInfos[i] = new TerrainLayerBinaryInfo();
              this._layerBinaryInfos[i].slot = stream.readInt();
              if (this._version >= TERRAIN_DATA_VERSION7) {
                this._layerBinaryInfos[i].tileSize = stream.readDouble();
              } else {
                this._layerBinaryInfos[i].tileSize = stream.readFloat();
              }
              this._layerBinaryInfos[i].detailMapId = stream.readString();
              if (this._version >= TERRAIN_DATA_VERSION4) {
                this._layerBinaryInfos[i].normalMapId = stream.readString();
                if (this._version >= TERRAIN_DATA_VERSION7) {
                  this._layerBinaryInfos[i].roughness = stream.readDouble();
                  this._layerBinaryInfos[i].metallic = stream.readDouble();
                } else {
                  this._layerBinaryInfos[i].roughness = stream.readFloat();
                  this._layerBinaryInfos[i].metallic = stream.readFloat();
                }
              }
            }
          }
          return true;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _exportNativeData() {
          const stream = new TerrainBuffer();

          // version
          stream.writeInt32(TERRAIN_DATA_VERSION8);

          // geometry info
          stream.writeDouble(this.tileSize);
          stream.writeIntArray(this._blockCount);
          stream.writeInt16(this.weightMapSize);
          stream.writeInt16(this.lightMapSize);

          // heights
          stream.writeInt32(this.heights.length);
          for (let i = 0; i < this.heights.length; ++i) {
            stream.writeInt16(this.heights[i]);
          }

          // normals
          stream.writeInt32(this.normals.length);
          for (let i = 0; i < this.normals.length; ++i) {
            stream.writeFloat(this.normals[i]);
          }

          // weights
          stream.writeInt32(this.weights.length);
          for (let i = 0; i < this.weights.length; ++i) {
            stream.writeInt8(this.weights[i]);
          }

          // layer buffer
          stream.writeInt32(this.layerBuffer.length);
          for (let i = 0; i < this.layerBuffer.length; ++i) {
            stream.writeInt16(this.layerBuffer[i]);
          }

          // layer infos
          const layerBinaryInfos = [];
          layerBinaryInfos.length = this.layerInfos.length;
          for (let i = 0; i < layerBinaryInfos.length; ++i) {
            const layer = this.layerInfos[i];
            const binaryLayer = new TerrainLayerBinaryInfo();
            binaryLayer.slot = i;
            binaryLayer.tileSize = layer.tileSize;
            binaryLayer.detailMapId = layer.detailMap ? layer.detailMap._uuid : '';
            binaryLayer.normalMapId = layer.normalMap ? layer.normalMap._uuid : '';
            binaryLayer.metallic = layer.metallic;
            binaryLayer.roughness = layer.roughness;
            layerBinaryInfos[i] = binaryLayer;
          }
          stream.writeInt32(layerBinaryInfos.length);
          for (let i = 0; i < layerBinaryInfos.length; ++i) {
            stream.writeInt32(layerBinaryInfos[i].slot);
            stream.writeDouble(layerBinaryInfos[i].tileSize);
            stream.writeString(layerBinaryInfos[i].detailMapId);
            stream.writeString(layerBinaryInfos[i].normalMapId);
            stream.writeDouble(layerBinaryInfos[i].roughness);
            stream.writeDouble(layerBinaryInfos[i].metallic);
          }
          return stream.buffer;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _exportDefaultNativeData() {
          const stream = new TerrainBuffer();
          stream.writeInt32(TERRAIN_DATA_VERSION_DEFAULT);
          return stream.buffer;
        }
      }, _descriptor7 = _applyDecoratedDescriptor(_class5.prototype, "_layerInfos", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class5)) || _class4));
    }
  };
});