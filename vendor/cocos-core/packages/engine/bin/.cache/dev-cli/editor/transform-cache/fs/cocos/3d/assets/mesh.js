System.register("q-bundled:///fs/cocos/3d/assets/mesh.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../asset/assets/asset.js", "../misc/buffer-blob.js", "../../core/index.js", "../../asset/assets/index.js", "../../gfx/index.js", "./morph-rendering.js", "../misc/mesh-codec.js", "../../../external/compression/zlib.min.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, EDITOR, Asset, BufferBlob, geometry, cclegacy, sys, warnID, Quat, Vec3, assertIsTrue, murmurhash2_32_gc, errorID, halfToFloat, v3, RenderingSubMesh, Attribute, BufferInfo, AttributeName, BufferUsageBit, Feature, Format, FormatInfos, FormatType, MemoryUsageBit, getTypedArrayConstructor, DrawInfo, deviceManager, FormatFeatureBit, createMorphRendering, MeshoptDecoder, zlib, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, vec3Add, vec3MultiplyScalar, vec3Subtract, aabbTransform, aabbFromPoints, vec3Max, vec3Min, vec3TransformQuat, vec3TransformMat4, v3_1, v3_2, globalEmptyMeshBuffer, Mesh, isLittleEndian;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function getIndexStrideCtor(stride) {
    switch (stride) {
      case 1:
        return Uint8Array;
      case 2:
        return Uint16Array;
      case 4:
        return Uint32Array;
      default:
        return Uint8Array;
    }
  }
  function getOffset(attributes, attributeIndex) {
    let result = 0;
    for (let i = 0; i < attributeIndex; ++i) {
      const attribute = attributes[i];
      result += FormatInfos[attribute.format].size;
    }
    return result;
  }
  function getComponentByteLength(format) {
    const info = FormatInfos[format];
    return info.size / info.count;
  }
  function getReader(dataView, format) {
    const info = FormatInfos[format];
    const stride = info.size / info.count;
    switch (info.type) {
      case FormatType.UNORM:
        {
          switch (stride) {
            case 1:
              return offset => dataView.getUint8(offset);
            case 2:
              return offset => dataView.getUint16(offset, isLittleEndian);
            case 4:
              return offset => dataView.getUint32(offset, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.SNORM:
        {
          switch (stride) {
            case 1:
              return offset => dataView.getInt8(offset);
            case 2:
              return offset => dataView.getInt16(offset, isLittleEndian);
            case 4:
              return offset => dataView.getInt32(offset, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.INT:
        {
          switch (stride) {
            case 1:
              return offset => dataView.getInt8(offset);
            case 2:
              return offset => dataView.getInt16(offset, isLittleEndian);
            case 4:
              return offset => dataView.getInt32(offset, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.UINT:
        {
          switch (stride) {
            case 1:
              return offset => dataView.getUint8(offset);
            case 2:
              return offset => dataView.getUint16(offset, isLittleEndian);
            case 4:
              return offset => dataView.getUint32(offset, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.FLOAT:
        {
          switch (stride) {
            case 2:
              return offset => dataView.getUint16(offset, isLittleEndian);
            case 4:
              return offset => dataView.getFloat32(offset, isLittleEndian);
            default:
          }
          break;
        }
      default:
    }
    return null;
  }
  function getWriter(dataView, format) {
    const info = FormatInfos[format];
    const stride = info.size / info.count;
    switch (info.type) {
      case FormatType.UNORM:
        {
          switch (stride) {
            case 1:
              return (offset, value) => dataView.setUint8(offset, value);
            case 2:
              return (offset, value) => dataView.setUint16(offset, value, isLittleEndian);
            case 4:
              return (offset, value) => dataView.setUint32(offset, value, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.SNORM:
        {
          switch (stride) {
            case 1:
              return (offset, value) => dataView.setInt8(offset, value);
            case 2:
              return (offset, value) => dataView.setInt16(offset, value, isLittleEndian);
            case 4:
              return (offset, value) => dataView.setInt32(offset, value, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.INT:
        {
          switch (stride) {
            case 1:
              return (offset, value) => dataView.setInt8(offset, value);
            case 2:
              return (offset, value) => dataView.setInt16(offset, value, isLittleEndian);
            case 4:
              return (offset, value) => dataView.setInt32(offset, value, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.UINT:
        {
          switch (stride) {
            case 1:
              return (offset, value) => dataView.setUint8(offset, value);
            case 2:
              return (offset, value) => dataView.setUint16(offset, value, isLittleEndian);
            case 4:
              return (offset, value) => dataView.setUint32(offset, value, isLittleEndian);
            default:
          }
          break;
        }
      case FormatType.FLOAT:
        {
          switch (stride) {
            case 2:
              return (offset, value) => dataView.setUint16(offset, value, isLittleEndian);
            case 4:
              return (offset, value) => dataView.setFloat32(offset, value, isLittleEndian);
            default:
          }
          break;
        }
      default:
    }
    return null;
  }
  function decodeMesh(mesh) {
    if (!mesh.struct.encoded) {
      // the mesh is not encoded, so no need to decode
      return mesh;
    }
    const res_checker = res => {
      if (res < 0) {
        errorID(14204, res);
      }
    };
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    const bufferBlob = new BufferBlob();
    bufferBlob.setNextAlignment(0);
    for (const bundle of struct.vertexBundles) {
      const view = bundle.view;
      const bound = view.count * view.stride;
      const buffer = new Uint8Array(bound);
      const vertex = new Uint8Array(mesh.data.buffer, view.offset, view.length);
      const res = MeshoptDecoder.decodeVertexBuffer(buffer, view.count, view.stride, vertex);
      res_checker(res);
      bufferBlob.setNextAlignment(view.stride);
      const newView = {
        offset: bufferBlob.getLength(),
        length: buffer.byteLength,
        count: view.count,
        stride: view.stride
      };
      bundle.view = newView;
      bufferBlob.addBuffer(buffer);
    }
    for (const primitive of struct.primitives) {
      if (primitive.indexView === undefined) {
        continue;
      }
      const view = primitive.indexView;
      const bound = view.count * view.stride;
      const buffer = new Uint8Array(bound);
      const index = new Uint8Array(mesh.data.buffer, view.offset, view.length);
      const res = MeshoptDecoder.decodeIndexBuffer(buffer, view.count, view.stride, index);
      res_checker(res);
      bufferBlob.setNextAlignment(view.stride);
      const newView = {
        offset: bufferBlob.getLength(),
        length: buffer.byteLength,
        count: view.count,
        stride: view.stride
      };
      primitive.indexView = newView;
      bufferBlob.addBuffer(buffer);
    }
    const data = new Uint8Array(bufferBlob.getCombined());
    return {
      struct,
      data
    };
  }
  function inflateMesh(mesh) {
    const inflator = new zlib.Inflate(mesh.data);
    const decompressed = inflator.decompress();
    mesh.data = decompressed;
    mesh.struct.compressed = false;
    return mesh;
  }
  function dequantizeMesh(mesh) {
    const struct = JSON.parse(JSON.stringify(mesh.struct));
    const bufferBlob = new BufferBlob();
    bufferBlob.setNextAlignment(0);
    function transformVertex(reader, writer, count, components, componentSize, readerStride, writerStride) {
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < components; j++) {
          const inputOffset = readerStride * i + componentSize * j;
          const outputOffset = writerStride * i + componentSize * j;
          writer(outputOffset, reader(inputOffset));
        }
      }
    }
    function dequantizeHalf(reader, writer, count, components, readerStride, writerStride) {
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < components; j++) {
          const inputOffset = readerStride * i + 2 * j;
          const outputOffset = writerStride * i + 4 * j;
          const value = halfToFloat(reader(inputOffset));
          writer(outputOffset, value);
        }
      }
    }
    for (let i = 0; i < struct.vertexBundles.length; ++i) {
      const bundle = struct.vertexBundles[i];
      const view = bundle.view;
      const attributes = bundle.attributes;
      const oldAttributes = mesh.struct.vertexBundles[i].attributes;
      const strides = [];
      const dequantizes = [];
      const readers = [];
      for (let j = 0; j < attributes.length; ++j) {
        const attr = attributes[j];
        const inputView = new DataView(mesh.data.buffer, view.offset + getOffset(oldAttributes, j));
        const reader = getReader(inputView, attr.format);
        let dequantize = true;
        switch (attr.format) {
          case Format.R16F:
            attr.format = Format.R32F;
            break;
          case Format.RG16F:
            attr.format = Format.RG32F;
            break;
          case Format.RGB16F:
            attr.format = Format.RGB32F;
            break;
          case Format.RGBA16F:
            attr.format = Format.RGBA32F;
            break;
          default:
            dequantize = false;
            break;
        }
        strides.push(FormatInfos[attr.format].size);
        dequantizes.push(dequantize);
        readers.push(reader);
      }
      const netStride = strides.reduce((acc, cur) => acc + cur, 0);
      const newBuffer = new Uint8Array(netStride * view.count);
      for (let j = 0; j < attributes.length; ++j) {
        const attribute = attributes[j];
        const reader = readers[j];
        const outputView = new DataView(newBuffer.buffer, getOffset(attributes, j));
        const writer = getWriter(outputView, attribute.format);
        const dequantize = dequantizes[j];
        const formatInfo = FormatInfos[attribute.format];
        if (dequantize) {
          dequantizeHalf(reader, writer, view.count, formatInfo.count, view.stride, netStride);
        } else {
          transformVertex(reader, writer, view.count, formatInfo.count, formatInfo.size / formatInfo.count, view.stride, netStride);
        }
      }
      bufferBlob.setNextAlignment(netStride);
      const newView = {
        offset: bufferBlob.getLength(),
        length: newBuffer.byteLength,
        count: view.count,
        stride: netStride
      };
      bundle.view = newView;
      bufferBlob.addBuffer(newBuffer);
    }

    // dump index buffer
    for (const primitive of struct.primitives) {
      if (primitive.indexView === undefined) {
        continue;
      }
      const view = primitive.indexView;
      const buffer = new Uint8Array(mesh.data.buffer, view.offset, view.length);
      bufferBlob.setNextAlignment(view.stride);
      const newView = {
        offset: bufferBlob.getLength(),
        length: buffer.byteLength,
        count: view.count,
        stride: view.stride
      };
      primitive.indexView = newView;
      bufferBlob.addBuffer(buffer);
    }
    const data = new Uint8Array(bufferBlob.getCombined());
    struct.quantized = false;
    return {
      struct,
      data
    };
  }

  // function get
  _export({
    decodeMesh: decodeMesh,
    inflateMesh: inflateMesh,
    dequantizeMesh: dequantizeMesh
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_miscBufferBlobJs) {
      BufferBlob = _miscBufferBlobJs.BufferBlob;
    }, function (_coreIndexJs) {
      geometry = _coreIndexJs.geometry;
      cclegacy = _coreIndexJs.cclegacy;
      sys = _coreIndexJs.sys;
      warnID = _coreIndexJs.warnID;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
      errorID = _coreIndexJs.errorID;
      halfToFloat = _coreIndexJs.halfToFloat;
      v3 = _coreIndexJs.v3;
    }, function (_assetAssetsIndexJs) {
      RenderingSubMesh = _assetAssetsIndexJs.RenderingSubMesh;
    }, function (_gfxIndexJs) {
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
      AttributeName = _gfxIndexJs.AttributeName;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      Feature = _gfxIndexJs.Feature;
      Format = _gfxIndexJs.Format;
      FormatInfos = _gfxIndexJs.FormatInfos;
      FormatType = _gfxIndexJs.FormatType;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      getTypedArrayConstructor = _gfxIndexJs.getTypedArrayConstructor;
      DrawInfo = _gfxIndexJs.DrawInfo;
      deviceManager = _gfxIndexJs.deviceManager;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
    }, function (_morphRenderingJs) {
      createMorphRendering = _morphRenderingJs.createMorphRendering;
    }, function (_miscMeshCodecJs) {
      MeshoptDecoder = _miscMeshCodecJs.MeshoptDecoder;
    }, function (_externalCompressionZlibMinJs) {
      zlib = _externalCompressionZlibMinJs.default;
    }],
    execute: function () {
      /*
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
      vec3Add = Vec3.add;
      vec3MultiplyScalar = Vec3.multiplyScalar;
      vec3Subtract = Vec3.subtract;
      aabbTransform = geometry.AABB.transform;
      aabbFromPoints = geometry.AABB.fromPoints;
      vec3Max = Vec3.max;
      vec3Min = Vec3.min;
      vec3TransformQuat = Vec3.transformQuat;
      vec3TransformMat4 = Vec3.transformMat4;
      v3_1 = new Vec3();
      v3_2 = new Vec3();
      globalEmptyMeshBuffer = new Uint8Array();
      /**
       * @en A representation of a mesh asset
       * A mesh can contain multiple sub-mesh resources. The mesh mainly provides data such as vertices and indices for model instances.
       * @zh 代表一个网格资源
       * 一个网格可包含多个子网格资源，网格主要为模型实例提供顶点，索引等数据
       */
      _export("Mesh", Mesh = (_dec = ccclass('cc.Mesh'), _dec(_class = (_class2 = class Mesh extends Asset {
        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        get _nativeAsset() {
          return this._data.buffer;
        }
        set _nativeAsset(value) {
          this._data = new Uint8Array(value);
        }

        /**
         * @en The sub meshes count of the mesh.
         * @zh 此网格的子网格数量。
         * @deprecated Please use [[renderingSubMeshes.length]] instead
         */
        get subMeshCount() {
          const renderingMesh = this.renderingSubMeshes;
          return renderingMesh ? renderingMesh.length : 0;
        }

        /**
         * @en The minimum position of all vertices in the mesh
         * @zh （各分量都）小于等于此网格任何顶点位置的最大位置。
         * @deprecated Please use [[struct.minPosition]] instead
         */
        get minPosition() {
          return this.struct.minPosition;
        }

        /**
         * @en The maximum position of all vertices in the mesh
         * @zh （各分量都）大于等于此网格任何顶点位置的最大位置。
         * @deprecated Please use [[struct.maxPosition]] instead
         */
        get maxPosition() {
          return this.struct.maxPosition;
        }

        /**
         * @en The struct of the mesh
         * @zh 此网格的结构。
         */
        get struct() {
          return this._struct;
        }

        /**
         * @en The actual data of the mesh
         * @zh 此网格的数据。
         */
        get data() {
          return this._data;
        }

        /**
         * @en The hash of the mesh
         * @zh 此网格的哈希值。
         */
        get hash() {
          // hashes should already be computed offline, but if not, make one
          if (!this._hash) {
            this._hash = murmurhash2_32_gc(this._data, 666);
          }
          return this._hash;
        }

        /**
         * @en The index of the joint buffer of all sub meshes in the joint map buffers
         * @zh 所有子网格的关节索引集合
         */
        get jointBufferIndices() {
          if (this._jointBufferIndices) {
            return this._jointBufferIndices;
          }
          return this._jointBufferIndices = this._struct.primitives.map(p => p.jointMapIndex || 0);
        }

        /**
         * @en The sub meshes for rendering. Mesh could be split into different sub meshes for rendering.
         * @zh 此网格创建的渲染网格。
         */
        get renderingSubMeshes() {
          this.initialize();
          return this._renderingSubMeshes;
        }

        /**
         * @en morph rendering data
         * @zh 变形渲染数据
         */

        constructor(name) {
          super(name);
          this.morphRendering = null;
          _initializerDefineProperty(this, "_struct", _descriptor, this);
          _initializerDefineProperty(this, "_hash", _descriptor2, this);
          this._data = globalEmptyMeshBuffer;
          this._initialized = false;
          _initializerDefineProperty(this, "_allowDataAccess", _descriptor3, this);
          this._isMeshDataUploaded = false;
          this._renderingSubMeshes = null;
          this._boneSpaceBounds = new Map();
          this._jointBufferIndices = null;
        }

        /**
         * @en complete loading callback
         * @zh 加载完成回调
         */
        onLoaded() {
          this.initialize();
        }

        /**
         * @en mesh init
         * @zh 网格初始化函数
         */
        initialize() {
          if (this._initialized) {
            return;
          }
          this._initialized = true;
          let info = {
            struct: this.struct,
            data: this.data
          };
          if (info.struct.compressed) {
            // decompress mesh data
            info = inflateMesh(info);
          }
          if (this.struct.encoded) {
            // decode mesh data
            info = decodeMesh(info);
          }
          if (this.struct.quantized && !(deviceManager.gfxDevice.getFormatFeatures(Format.RGB16F) & FormatFeatureBit.VERTEX_ATTRIBUTE)) {
            // dequantize mesh data
            info = dequantizeMesh(info);
          }
          this._struct = info.struct;
          this._data = info.data;
          if (this._struct.dynamic) {
            const device = deviceManager.gfxDevice;
            const vertexBuffers = [];
            const subMeshes = [];
            for (let i = 0; i < this._struct.vertexBundles.length; i++) {
              const vertexBundle = this._struct.vertexBundles[i];
              const vertexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, vertexBundle.view.length, vertexBundle.view.stride));
              vertexBuffers.push(vertexBuffer);
            }
            for (let i = 0; i < this._struct.primitives.length; i++) {
              const primitive = this._struct.primitives[i];
              const indexView = primitive.indexView;
              let indexBuffer = null;
              if (indexView) {
                indexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, indexView.length, indexView.stride));
              }
              const subVBs = [];
              for (let k = 0; k < primitive.vertexBundelIndices.length; k++) {
                const idx = primitive.vertexBundelIndices[k];
                subVBs.push(vertexBuffers[idx]);
              }
              const allAttributes = [];
              for (let k = 0; k < primitive.vertexBundelIndices.length; k++) {
                const idx = primitive.vertexBundelIndices[k];
                const attributes = this._struct.vertexBundles[idx].attributes;
                for (let j = 0; j < attributes.length; j++) {
                  const attr = attributes[j];
                  const attribute = new Attribute();
                  attribute.copy(attr);
                  allAttributes.push(attribute);
                }
              }
              const subMesh = new RenderingSubMesh(subVBs, allAttributes, primitive.primitiveMode, indexBuffer);
              subMesh.drawInfo = new DrawInfo();
              subMesh.mesh = this;
              subMesh.subMeshIdx = i;
              subMeshes.push(subMesh);
            }
            this._renderingSubMeshes = subMeshes;
          } else {
            const {
              buffer
            } = this._data;
            const gfxDevice = deviceManager.gfxDevice;
            const vertexBuffers = this._createVertexBuffers(gfxDevice, buffer);
            const indexBuffers = [];
            const subMeshes = [];
            for (let i = 0; i < this._struct.primitives.length; i++) {
              const prim = this._struct.primitives[i];
              if (prim.vertexBundelIndices.length === 0) {
                continue;
              }
              let indexBuffer = null;
              let ib;
              if (prim.indexView) {
                const idxView = prim.indexView;
                let dstStride = idxView.stride;
                let dstSize = idxView.length;
                if (dstStride === 4 && !gfxDevice.hasFeature(Feature.ELEMENT_INDEX_UINT)) {
                  const vertexCount = this._struct.vertexBundles[prim.vertexBundelIndices[0]].view.count;
                  if (vertexCount > 65536) {
                    // Uint16 can address 65536 vertices (indices 0–65535)
                    warnID(10001, vertexCount, 65536);
                    continue; // Ignore this primitive
                  } else {
                    dstStride >>= 1; // Reduce to short.
                    dstSize >>= 1;
                  }
                }
                indexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.INDEX, MemoryUsageBit.DEVICE, dstSize, dstStride));
                indexBuffers.push(indexBuffer);
                ib = new (getIndexStrideCtor(idxView.stride))(buffer, idxView.offset, idxView.count);
                if (idxView.stride !== dstStride) {
                  ib = getIndexStrideCtor(dstStride).from(ib);
                }
                indexBuffer.update(ib);
              }
              const vbReference = prim.vertexBundelIndices.map(idx => vertexBuffers[idx]);
              const gfxAttributes = [];
              if (prim.vertexBundelIndices.length > 0) {
                const idx = prim.vertexBundelIndices[0];
                const vertexBundle = this._struct.vertexBundles[idx];
                const attrs = vertexBundle.attributes;
                for (let j = 0; j < attrs.length; ++j) {
                  const attr = attrs[j];
                  gfxAttributes[j] = new Attribute(attr.name, attr.format, attr.isNormalized, attr.stream, attr.isInstanced, attr.location);
                }
              }
              const subMesh = new RenderingSubMesh(vbReference, gfxAttributes, prim.primitiveMode, indexBuffer);
              subMesh.mesh = this;
              subMesh.subMeshIdx = i;
              subMeshes.push(subMesh);
            }
            this._renderingSubMeshes = subMeshes;
            if (this._struct.morph) {
              this.morphRendering = createMorphRendering(this, gfxDevice);
            }
            this._isMeshDataUploaded = true;
            if (!this._allowDataAccess && !EDITOR) {
              this.releaseData();
            }
          }
        }

        /**
         * @en update dynamic sub mesh geometry
         * @zh 更新动态子网格的几何数据
         * @param primitiveIndex @en sub mesh index @zh 子网格索引
         * @param dynamicGeometry @en sub mesh geometry data @zh 子网格几何数据
         */
        updateSubMesh(primitiveIndex, dynamicGeometry) {
          if (!this._struct.dynamic) {
            warnID(14200);
            return;
          }
          if (primitiveIndex >= this._struct.primitives.length) {
            warnID(14201);
            return;
          }
          const buffers = [];
          if (dynamicGeometry.positions.length > 0) {
            buffers.push(dynamicGeometry.positions);
          }
          if (dynamicGeometry.normals && dynamicGeometry.normals.length > 0) {
            buffers.push(dynamicGeometry.normals);
          }
          if (dynamicGeometry.uvs && dynamicGeometry.uvs.length > 0) {
            buffers.push(dynamicGeometry.uvs);
          }
          if (dynamicGeometry.tangents && dynamicGeometry.tangents.length > 0) {
            buffers.push(dynamicGeometry.tangents);
          }
          if (dynamicGeometry.colors && dynamicGeometry.colors.length > 0) {
            buffers.push(dynamicGeometry.colors);
          }
          if (dynamicGeometry.customAttributes) {
            for (let k = 0; k < dynamicGeometry.customAttributes.length; k++) {
              buffers.push(dynamicGeometry.customAttributes[k].values);
            }
          }
          const dynamic = this._struct.dynamic;
          const info = dynamic.info;
          const primitive = this._struct.primitives[primitiveIndex];
          const subMesh = this._renderingSubMeshes[primitiveIndex];
          const drawInfo = subMesh.drawInfo;

          // update _data & buffer
          for (let index = 0; index < buffers.length; index++) {
            const vertices = buffers[index];
            const bundle = this._struct.vertexBundles[primitive.vertexBundelIndices[index]];
            const stride = bundle.view.stride;
            const vertexCount = vertices.byteLength / stride;
            const updateSize = vertices.byteLength;
            const dstBuffer = new Uint8Array(this._data.buffer, bundle.view.offset, updateSize);
            const srcBuffer = new Uint8Array(vertices.buffer, vertices.byteOffset, updateSize);
            const vertexBuffer = subMesh.vertexBuffers[index];
            assertIsTrue(vertexCount <= info.maxSubMeshVertices, 'Too many vertices.');
            if (updateSize > 0) {
              dstBuffer.set(srcBuffer);
              vertexBuffer.update(srcBuffer, updateSize);
            }
            bundle.view.count = vertexCount;
            drawInfo.vertexCount = vertexCount;
          }
          if (primitive.indexView) {
            const indexView = primitive.indexView;
            const stride = indexView.stride;
            const indexCount = stride === 2 ? dynamicGeometry.indices16.length : dynamicGeometry.indices32.length;
            const updateSize = indexCount * stride;
            const dstBuffer = new Uint8Array(this._data.buffer, indexView.offset, updateSize);
            const srcBuffer = stride === 2 ? new Uint8Array(dynamicGeometry.indices16.buffer, dynamicGeometry.indices16.byteOffset, updateSize) : new Uint8Array(dynamicGeometry.indices32.buffer, dynamicGeometry.indices32.byteOffset, updateSize);
            const indexBuffer = subMesh.indexBuffer;
            assertIsTrue(indexCount <= info.maxSubMeshIndices, 'Too many indices.');
            if (updateSize > 0) {
              dstBuffer.set(srcBuffer);
              indexBuffer.update(srcBuffer, updateSize);
            }
            indexView.count = indexCount;
            drawInfo.indexCount = indexCount;
          }

          // update bound
          if (dynamicGeometry.minPos && dynamicGeometry.maxPos) {
            const minPos = v3(dynamicGeometry.minPos.x, dynamicGeometry.minPos.y, dynamicGeometry.minPos.z);
            const maxPos = v3(dynamicGeometry.maxPos.x, dynamicGeometry.maxPos.y, dynamicGeometry.maxPos.z);
            if (!dynamic.bounds[primitiveIndex]) {
              dynamic.bounds[primitiveIndex] = new geometry.AABB();
            }
            aabbFromPoints(dynamic.bounds[primitiveIndex], minPos, maxPos);
            const subMin = v3();
            const subMax = v3();
            dynamic.bounds.forEach(bound => {
              if (bound) {
                bound.getBoundary(subMin, subMax);
                vec3Min(minPos, subMin, minPos);
                vec3Max(maxPos, subMax, maxPos);
              }
            });
            this._struct.minPosition = v3(minPos.x, minPos.y, minPos.z);
            this._struct.maxPosition = v3(maxPos.x, maxPos.y, maxPos.z);
          }
          subMesh.invalidateGeometricInfo();
        }

        /**
         * @en Destroy the mesh and release all related GPU resources
         * @zh 销毁此网格，并释放它占有的所有 GPU 资源。
         */
        destroy() {
          this.destroyRenderingMesh();
          return super.destroy();
        }

        /**
         * @en Release all related GPU resources
         * @zh 释放此网格占有的所有 GPU 资源。
         */
        destroyRenderingMesh() {
          if (this._renderingSubMeshes) {
            for (let i = 0; i < this._renderingSubMeshes.length; i++) {
              this._renderingSubMeshes[i].destroy();
            }
            this._renderingSubMeshes = null;
            this._initialized = false;
            this._isMeshDataUploaded = false;
          }
        }

        /**
         * @en Reset the struct and data of the mesh
         * @zh 重置此网格的结构和数据。
         * @param struct @en The new struct @zh 新结构
         * @param data @en The new data @zh 新数据
         * @deprecated Will be removed in v3.0.0, please use [[reset]] instead
         */
        assign(struct, data) {
          this.reset({
            struct,
            data
          });
        }

        /**
         * @en Reset the mesh with mesh creation information
         * @zh 重置此网格。
         * @param info @en Mesh creation information including struct and data @zh 网格创建信息，包含结构及数据
         */
        reset(info) {
          this.destroyRenderingMesh();
          this._struct = info.struct;
          this._data = info.data;
          this._hash = 0;
        }

        /**
         * @en Get [[geometry.AABB]] bounds in the skeleton's bone space
         * @zh 获取骨骼变换空间内下的 [[geometry.AABB]] 包围盒
         * @param skeleton @en skeleton data @zh 骨骼信息
         * @param skeleton @en skeleton data @zh 骨骼信息
         */
        getBoneSpaceBounds(skeleton) {
          if (this._boneSpaceBounds.has(skeleton.hash)) {
            return this._boneSpaceBounds.get(skeleton.hash);
          }
          const bounds = [];
          this._boneSpaceBounds.set(skeleton.hash, bounds);
          const valid = [];
          const {
            bindposes
          } = skeleton;
          for (let i = 0; i < bindposes.length; i++) {
            bounds.push(new geometry.AABB(Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity));
            valid.push(false);
          }
          const {
            primitives
          } = this._struct;
          for (let p = 0; p < primitives.length; p++) {
            const joints = this.readAttribute(p, AttributeName.ATTR_JOINTS);
            const weights = this.readAttribute(p, AttributeName.ATTR_WEIGHTS);
            const positions = this.readAttribute(p, AttributeName.ATTR_POSITION);
            if (!joints || !weights || !positions) {
              continue;
            }
            const vertCount = Math.min(joints.length / 4, weights.length / 4, positions.length / 3);
            for (let i = 0; i < vertCount; i++) {
              Vec3.set(v3_1, positions[3 * i + 0], positions[3 * i + 1], positions[3 * i + 2]);
              for (let j = 0; j < 4; ++j) {
                const idx = 4 * i + j;
                const joint = joints[idx];
                if (weights[idx] === 0 || joint >= bindposes.length) {
                  continue;
                }
                vec3TransformMat4(v3_2, v3_1, bindposes[joint]);
                valid[joint] = true;
                const b = bounds[joint];
                vec3Min(b.center, b.center, v3_2);
                vec3Max(b.halfExtents, b.halfExtents, v3_2);
              }
            }
          }
          for (let i = 0; i < bindposes.length; i++) {
            const b = bounds[i];
            if (!valid[i]) {
              bounds[i] = null;
            } else {
              aabbFromPoints(b, b.center, b.halfExtents);
            }
          }
          return bounds;
        }

        /**
         * @en Merge the given mesh into the current mesh
         * @zh 合并指定的网格到此网格中。
         * @param mesh @en The mesh to be merged @zh 要合并的网格
         * @param worldMatrix @en The world matrix of the given mesh @zh 给定网格的模型变换矩阵
         * @param validate @en Whether to validate the mesh @zh 是否验证网格顶点布局
         * @returns @en whether the merging was successful or not @zh 返回合并成功与否
         */
        merge(mesh, worldMatrix, validate) {
          if (validate) {
            if (!this.validateMergingMesh(mesh)) {
              return false;
            }
          }
          const vec3_temp = new Vec3();
          const rotate = worldMatrix && new Quat();
          const boundingBox = worldMatrix && new geometry.AABB();
          if (rotate) {
            worldMatrix.getRotation(rotate);
          }
          if (!this._initialized) {
            const struct = JSON.parse(JSON.stringify(mesh._struct));
            const data = mesh._data.slice();
            if (worldMatrix) {
              if (struct.maxPosition && struct.minPosition) {
                vec3Add(boundingBox.center, struct.maxPosition, struct.minPosition);
                vec3MultiplyScalar(boundingBox.center, boundingBox.center, 0.5);
                vec3Subtract(boundingBox.halfExtents, struct.maxPosition, struct.minPosition);
                vec3MultiplyScalar(boundingBox.halfExtents, boundingBox.halfExtents, 0.5);
                aabbTransform(boundingBox, boundingBox, worldMatrix);
                vec3Add(struct.maxPosition, boundingBox.center, boundingBox.halfExtents);
                vec3Subtract(struct.minPosition, boundingBox.center, boundingBox.halfExtents);
              }
              for (let i = 0; i < struct.vertexBundles.length; i++) {
                const vtxBdl = struct.vertexBundles[i];
                for (let j = 0; j < vtxBdl.attributes.length; j++) {
                  if (vtxBdl.attributes[j].name === AttributeName.ATTR_POSITION || vtxBdl.attributes[j].name === AttributeName.ATTR_NORMAL) {
                    const {
                      format
                    } = vtxBdl.attributes[j];
                    const inputView = new DataView(data.buffer, vtxBdl.view.offset + getOffset(vtxBdl.attributes, j));
                    const reader = getReader(inputView, format);
                    const writer = getWriter(inputView, format);
                    if (!reader || !writer) {
                      continue;
                    }
                    const vertexCount = vtxBdl.view.count;
                    const vertexStride = vtxBdl.view.stride;
                    const attrComponentByteLength = getComponentByteLength(format);
                    for (let vtxIdx = 0; vtxIdx < vertexCount; vtxIdx++) {
                      const xOffset = vtxIdx * vertexStride;
                      const yOffset = xOffset + attrComponentByteLength;
                      const zOffset = yOffset + attrComponentByteLength;
                      vec3_temp.set(reader(xOffset), reader(yOffset), reader(zOffset));
                      switch (vtxBdl.attributes[j].name) {
                        case AttributeName.ATTR_POSITION:
                          vec3_temp.transformMat4(worldMatrix);
                          break;
                        case AttributeName.ATTR_NORMAL:
                          vec3TransformQuat(vec3_temp, vec3_temp, rotate);
                          break;
                        default:
                      }
                      writer(xOffset, vec3_temp.x);
                      writer(yOffset, vec3_temp.y);
                      writer(zOffset, vec3_temp.z);
                    }
                  }
                }
              }
            }
            this.reset({
              struct,
              data
            });
            this.initialize();
            return true;
          }

          // merge buffer
          const bufferBlob = new BufferBlob();

          // merge vertex buffer
          let vertCount = 0;
          let vertStride = 0;
          let srcOffset = 0;
          let dstOffset = 0;
          let vb;
          let vbView;
          let srcVBView;
          let dstVBView;
          let srcAttrOffset = 0;
          let srcVBOffset = 0;
          let dstVBOffset = 0;
          let attrSize = 0;
          let dstAttrView;
          let hasAttr = false;
          const vertexBundles = new Array(this._struct.vertexBundles.length);
          for (let i = 0; i < this._struct.vertexBundles.length; ++i) {
            const bundle = this._struct.vertexBundles[i];
            const dstBundle = mesh._struct.vertexBundles[i];
            srcOffset = bundle.view.offset;
            dstOffset = dstBundle.view.offset;
            vertStride = bundle.view.stride;
            vertCount = bundle.view.count + dstBundle.view.count;
            vb = new ArrayBuffer(vertCount * vertStride);
            vbView = new Uint8Array(vb);
            srcVBView = this._data.subarray(srcOffset, srcOffset + bundle.view.length);
            srcOffset += srcVBView.length;
            dstVBView = mesh._data.subarray(dstOffset, dstOffset + dstBundle.view.length);
            dstOffset += dstVBView.length;
            vbView.set(srcVBView);
            srcAttrOffset = 0;
            for (const attr of bundle.attributes) {
              dstVBOffset = 0;
              hasAttr = false;
              for (const dstAttr of dstBundle.attributes) {
                if (attr.name === dstAttr.name && attr.format === dstAttr.format) {
                  hasAttr = true;
                  break;
                }
                dstVBOffset += FormatInfos[dstAttr.format].size;
              }
              if (hasAttr) {
                attrSize = FormatInfos[attr.format].size;
                srcVBOffset = bundle.view.length + srcAttrOffset;
                for (let v = 0; v < dstBundle.view.count; ++v) {
                  dstAttrView = dstVBView.subarray(dstVBOffset, dstVBOffset + attrSize);
                  vbView.set(dstAttrView, srcVBOffset);
                  if ((attr.name === AttributeName.ATTR_POSITION || attr.name === AttributeName.ATTR_NORMAL) && worldMatrix) {
                    const f32_temp = new Float32Array(vbView.buffer, srcVBOffset, 3);
                    vec3_temp.set(f32_temp[0], f32_temp[1], f32_temp[2]);
                    switch (attr.name) {
                      case AttributeName.ATTR_POSITION:
                        vec3_temp.transformMat4(worldMatrix);
                        break;
                      case AttributeName.ATTR_NORMAL:
                        vec3TransformQuat(vec3_temp, vec3_temp, rotate);
                        break;
                      default:
                    }
                    f32_temp[0] = vec3_temp.x;
                    f32_temp[1] = vec3_temp.y;
                    f32_temp[2] = vec3_temp.z;
                  }
                  srcVBOffset += bundle.view.stride;
                  dstVBOffset += dstBundle.view.stride;
                }
              }
              srcAttrOffset += FormatInfos[attr.format].size;
            }
            vertexBundles[i] = {
              attributes: bundle.attributes,
              view: {
                offset: bufferBlob.getLength(),
                length: vb.byteLength,
                count: vertCount,
                stride: vertStride
              }
            };
            bufferBlob.addBuffer(vb);
          }

          // merge index buffer
          let idxCount = 0;
          let idxStride = 2;
          let ibView;
          let srcIBView;
          let dstIBView;
          const primitives = new Array(this._struct.primitives.length);
          for (let i = 0; i < this._struct.primitives.length; ++i) {
            const prim = this._struct.primitives[i];
            const dstPrim = mesh._struct.primitives[i];
            primitives[i] = {
              primitiveMode: prim.primitiveMode,
              vertexBundelIndices: prim.vertexBundelIndices
            };
            let vertBatchCount = 0;
            for (const bundleIdx of prim.vertexBundelIndices) {
              vertBatchCount = Math.max(vertBatchCount, this._struct.vertexBundles[bundleIdx].view.count);
            }
            if (prim.indexView && dstPrim.indexView) {
              idxCount = prim.indexView.count;
              idxCount += dstPrim.indexView.count;
              srcOffset = prim.indexView.offset;
              dstOffset = dstPrim.indexView.offset;
              if (idxCount < 256) {
                idxStride = 1;
              } else if (idxCount < 65536) {
                idxStride = 2;
              } else {
                idxStride = 4;
              }
              const ib = new ArrayBuffer(idxCount * idxStride);
              if (idxStride === 2) {
                ibView = new Uint16Array(ib);
              } else if (idxStride === 1) {
                ibView = new Uint8Array(ib);
              } else {
                // Uint32
                ibView = new Uint32Array(ib);
              }

              // merge src indices
              if (prim.indexView.stride === 2) {
                srcIBView = new Uint16Array(this._data.buffer, srcOffset, prim.indexView.count);
              } else if (prim.indexView.stride === 1) {
                srcIBView = new Uint8Array(this._data.buffer, srcOffset, prim.indexView.count);
              } else {
                // Uint32
                srcIBView = new Uint32Array(this._data.buffer, srcOffset, prim.indexView.count);
              }
              if (idxStride === prim.indexView.stride) {
                ibView.set(srcIBView);
              } else {
                for (let n = 0; n < prim.indexView.count; ++n) {
                  ibView[n] = srcIBView[n];
                }
              }
              srcOffset += prim.indexView.length;

              // merge dst indices
              if (dstPrim.indexView.stride === 2) {
                dstIBView = new Uint16Array(mesh._data.buffer, dstOffset, dstPrim.indexView.count);
              } else if (dstPrim.indexView.stride === 1) {
                dstIBView = new Uint8Array(mesh._data.buffer, dstOffset, dstPrim.indexView.count);
              } else {
                // Uint32
                dstIBView = new Uint32Array(mesh._data.buffer, dstOffset, dstPrim.indexView.count);
              }
              for (let n = 0; n < dstPrim.indexView.count; ++n) {
                ibView[prim.indexView.count + n] = vertBatchCount + dstIBView[n];
              }
              dstOffset += dstPrim.indexView.length;
              primitives[i].indexView = {
                offset: bufferBlob.getLength(),
                length: ib.byteLength,
                count: idxCount,
                stride: idxStride
              };
              bufferBlob.setNextAlignment(idxStride);
              bufferBlob.addBuffer(ib);
            }
          }

          // Create mesh struct.
          const meshStruct = {
            vertexBundles,
            primitives,
            minPosition: this._struct.minPosition,
            maxPosition: this._struct.maxPosition
          };
          if (meshStruct.minPosition && mesh._struct.minPosition && meshStruct.maxPosition && mesh._struct.maxPosition) {
            if (worldMatrix) {
              vec3Add(boundingBox.center, mesh._struct.maxPosition, mesh._struct.minPosition);
              vec3MultiplyScalar(boundingBox.center, boundingBox.center, 0.5);
              vec3Subtract(boundingBox.halfExtents, mesh._struct.maxPosition, mesh._struct.minPosition);
              vec3MultiplyScalar(boundingBox.halfExtents, boundingBox.halfExtents, 0.5);
              aabbTransform(boundingBox, boundingBox, worldMatrix);
              vec3Add(vec3_temp, boundingBox.center, boundingBox.halfExtents);
              vec3Max(meshStruct.maxPosition, meshStruct.maxPosition, vec3_temp);
              vec3Subtract(vec3_temp, boundingBox.center, boundingBox.halfExtents);
              vec3Min(meshStruct.minPosition, meshStruct.minPosition, vec3_temp);
            } else {
              vec3Min(meshStruct.minPosition, meshStruct.minPosition, mesh._struct.minPosition);
              vec3Max(meshStruct.maxPosition, meshStruct.maxPosition, mesh._struct.maxPosition);
            }
          }

          // Create mesh.
          this.reset({
            struct: meshStruct,
            data: new Uint8Array(bufferBlob.getCombined())
          });
          this.initialize();
          return true;
        }

        /**
         * @en Validation for whether the given mesh can be merged into the current mesh.
         * To pass the validation, it must satisfy either of these two requirements:
         * - When the current mesh have no data
         * - When the two mesh have the same vertex bundle count, the same sub meshes count, and the same sub mesh layout.
         *
         * Same mesh layout means:
         * - They have the same primitive type and reference to the same amount vertex bundle with the same indices.
         * - And they all have or don't have index view
         * @zh 验证指定网格是否可以合并至当前网格。
         *
         * 当满足以下条件之一时，指定网格可以合并至当前网格：
         *  - 当前网格无数据而待合并网格有数据；
         *  - 它们的顶点块数目相同且对应顶点块的布局一致，并且它们的子网格数目相同且对应子网格的布局一致。
         *
         * 两个顶点块布局一致当且仅当：
         *  - 它们具有相同数量的顶点属性且对应的顶点属性具有相同的属性格式。
         *
         * 两个子网格布局一致，当且仅当：
         *  - 它们具有相同的图元类型并且引用相同数量、相同索引的顶点块；并且，
         *  - 要么都需要索引绘制，要么都不需要索引绘制。
         * @param mesh @en The other mesh to be validated @zh 待验证的网格
         */
        validateMergingMesh(mesh) {
          // dynamic mesh is not allowed to merge.
          if (this._struct.dynamic || mesh._struct.dynamic) {
            return false;
          }

          // validate vertex bundles
          if (this._struct.vertexBundles.length !== mesh._struct.vertexBundles.length) {
            return false;
          }
          for (let i = 0; i < this._struct.vertexBundles.length; ++i) {
            const bundle = this._struct.vertexBundles[i];
            const dstBundle = mesh._struct.vertexBundles[i];
            if (bundle.attributes.length !== dstBundle.attributes.length) {
              return false;
            }
            for (let j = 0; j < bundle.attributes.length; ++j) {
              if (bundle.attributes[j].format !== dstBundle.attributes[j].format) {
                return false;
              }
            }
          }

          // validate primitives
          if (this._struct.primitives.length !== mesh._struct.primitives.length) {
            return false;
          }
          for (let i = 0; i < this._struct.primitives.length; ++i) {
            const prim = this._struct.primitives[i];
            const dstPrim = mesh._struct.primitives[i];
            if (prim.vertexBundelIndices.length !== dstPrim.vertexBundelIndices.length) {
              return false;
            }
            for (let j = 0; j < prim.vertexBundelIndices.length; ++j) {
              if (prim.vertexBundelIndices[j] !== dstPrim.vertexBundelIndices[j]) {
                return false;
              }
            }
            if (prim.primitiveMode !== dstPrim.primitiveMode) {
              return false;
            }
            if (prim.indexView) {
              if (dstPrim.indexView === undefined) {
                return false;
              }
            } else if (dstPrim.indexView) {
              return false;
            }
          }
          return true;
        }

        /**
         * @en Read the requested attribute of the given sub mesh
         * @zh 读取子网格的指定属性。
         * @param primitiveIndex @en Sub mesh index @zh 子网格索引
         * @param attributeName @en Attribute name @zh 属性名称
         * @returns @en Return null if not found or can't read, otherwise, will create a large enough typed array to contain all data of the attribute,
         * the array type will match the data type of the attribute. @zh 读取失败返回 null， 否则返回对应的类型数组
         */
        readAttribute(primitiveIndex, attributeName) {
          let result = null;
          this._accessAttribute(primitiveIndex, attributeName, (vertexBundle, iAttribute) => {
            const vertexCount = vertexBundle.view.count;
            const {
              format
            } = vertexBundle.attributes[iAttribute];
            const StorageConstructor = getTypedArrayConstructor(FormatInfos[format]);
            if (vertexCount === 0) {
              return;
            }
            const inputView = new DataView(this._data.buffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, iAttribute));
            const formatInfo = FormatInfos[format];
            const reader = getReader(inputView, format);
            if (!StorageConstructor || !reader) {
              return;
            }
            const componentCount = formatInfo.count;
            const storage = new StorageConstructor(vertexCount * componentCount);
            const inputStride = vertexBundle.view.stride;
            for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
              for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
                storage[componentCount * iVertex + iComponent] = reader(inputStride * iVertex + storage.BYTES_PER_ELEMENT * iComponent);
              }
            }
            result = storage;
          });
          return result;
        }

        /**
         * @en Read the requested attribute of the given sub mesh and fill into the given buffer.
         * @zh 读取子网格的指定属性到目标缓冲区中。
         * @param primitiveIndex @en Sub mesh index @zh 子网格索引
         * @param attributeName @en Attribute name @zh 属性名称
         * @param buffer @en The target array buffer @zh 目标缓冲区
         * @param stride @en attribute stride @zh 属性跨距
         * @param offset @en The offset of the first attribute in the target buffer @zh 第一个属性在目标缓冲区的偏移
         * @returns @en false if failed to access attribute, true otherwise @zh 是否成功拷贝
         */
        copyAttribute(primitiveIndex, attributeName, buffer, stride, offset) {
          let written = false;
          this._accessAttribute(primitiveIndex, attributeName, (vertexBundle, iAttribute) => {
            const vertexCount = vertexBundle.view.count;
            if (vertexCount === 0) {
              written = true;
              return;
            }
            const {
              format
            } = vertexBundle.attributes[iAttribute];
            const inputView = new DataView(this._data.buffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, iAttribute));
            const outputView = new DataView(buffer, offset);
            const formatInfo = FormatInfos[format];
            const reader = getReader(inputView, format);
            const writer = getWriter(outputView, format);
            if (!reader || !writer) {
              return;
            }
            const componentCount = formatInfo.count;
            const inputStride = vertexBundle.view.stride;
            const inputComponentByteLength = getComponentByteLength(format);
            const outputStride = stride;
            const outputComponentByteLength = inputComponentByteLength;
            for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
              for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
                const inputOffset = inputStride * iVertex + inputComponentByteLength * iComponent;
                const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                writer(outputOffset, reader(inputOffset));
              }
            }
            written = true;
          });
          return written;
        }

        /**
         * @en Read the indices data of the given sub mesh
         * @zh 读取子网格的索引数据。
         * @param primitiveIndex @en Sub mesh index @zh 子网格索引
         * @returns @en Return null if not found or can't read, otherwise, will create a large enough typed array to contain all indices data,
         * the array type will use the corresponding stride size. @zh 读取失败返回 null，否则返回索引数据
         */
        readIndices(primitiveIndex) {
          if (primitiveIndex >= this._struct.primitives.length) {
            return null;
          }
          const primitive = this._struct.primitives[primitiveIndex];
          if (!primitive.indexView) {
            return null;
          }
          const {
            stride
          } = primitive.indexView;
          const Ctor = stride === 1 ? Uint8Array : stride === 2 ? Uint16Array : Uint32Array;
          return new Ctor(this._data.buffer, primitive.indexView.offset, primitive.indexView.count);
        }

        /**
         * @en Read the indices data of the given sub mesh and fill into the given array
         * @zh 读取子网格的索引数据到目标数组中。
         * @param primitiveIndex @en Sub mesh index @zh 子网格索引
         * @param outputArray @en The target output array @zh 目标索引数组
         * @returns @en Return false if failed to access the indices data, return true otherwise. @zh 拷贝失败返回 false， 否则返回 true
         */
        copyIndices(primitiveIndex, outputArray) {
          if (primitiveIndex >= this._struct.primitives.length) {
            return false;
          }
          const primitive = this._struct.primitives[primitiveIndex];
          if (!primitive.indexView) {
            return false;
          }
          const indexCount = primitive.indexView.count;
          const indexFormat = primitive.indexView.stride === 1 ? Format.R8UI : primitive.indexView.stride === 2 ? Format.R16UI : Format.R32UI;
          const reader = getReader(new DataView(this._data.buffer), indexFormat);
          for (let i = 0; i < indexCount; ++i) {
            outputArray[i] = reader(primitive.indexView.offset + FormatInfos[indexFormat].size * i);
          }
          return true;
        }

        /**
         * @en Read the format by attributeName of submesh
         * @zh 根据属性名读取子网格的属性信息。
         * @param primitiveIndex @en Sub mesh index @zh 子网格索引
         * @param attributeName @en Attribute name @zh 属性名称
         * @returns @en Return null if failed to read format, return the format otherwise. @zh 读取失败返回 null， 否则返回 format
         */
        readAttributeFormat(primitiveIndex, attributeName) {
          let result = null;
          this._accessAttribute(primitiveIndex, attributeName, (vertexBundle, iAttribute) => {
            const format = vertexBundle.attributes[iAttribute].format;
            result = FormatInfos[format];
          });
          return result;
        }
        _accessAttribute(primitiveIndex, attributeName, accessor) {
          if (primitiveIndex >= this._struct.primitives.length) {
            return;
          }
          const vertexBundelIndices = this._struct.primitives[primitiveIndex].vertexBundelIndices;
          for (let i = 0; i < vertexBundelIndices.length; i++) {
            const vertexBundleIndex = vertexBundelIndices[i];
            const vertexBundle = this._struct.vertexBundles[vertexBundleIndex];
            const iAttribute = vertexBundle.attributes.findIndex(a => a.name === attributeName);
            if (iAttribute < 0) {
              continue;
            }
            accessor(vertexBundle, iAttribute);
            break;
          }
        }
        _createVertexBuffers(gfxDevice, data) {
          return this._struct.vertexBundles.map(vertexBundle => {
            const vertexBuffer = gfxDevice.createBuffer(new BufferInfo(BufferUsageBit.VERTEX, MemoryUsageBit.DEVICE, vertexBundle.view.length, vertexBundle.view.stride));
            const view = new Uint8Array(data, vertexBundle.view.offset, vertexBundle.view.length);
            vertexBuffer.update(view);
            return vertexBuffer;
          });
        }

        /**
         * @en default init
         * @zh 默认初始化
         * @param uuid @en asset uuid @zh 资源 uuid
         */
        initDefault(uuid) {
          super.initDefault(uuid);
          this.reset({
            struct: {
              vertexBundles: [],
              primitives: []
            },
            data: globalEmptyMeshBuffer
          });
        }

        /**
         * @en Set whether the data of this mesh could be accessed (read or wrote), it could be used only for static mesh
         * @zh 设置此网格的数据是否可被存取，此接口只针对静态网格资源生效
         * @param allowDataAccess @en Indicate whether the data of this mesh could be accessed (read or wrote) @zh 是否允许存取网格数据
         */
        set allowDataAccess(allowDataAccess) {
          this._allowDataAccess = allowDataAccess;
          if (this._isMeshDataUploaded && !this._allowDataAccess && !EDITOR) {
            this.releaseData();
          }
        }

        /**
         * @en Get whether the data of this mesh could be read or wrote
         * @zh 获取此网格的数据是否可被存取
         * @return @en whether the data of this mesh could be accessed (read or wrote) @zh 此网格的数据是否可被存取
         */
        get allowDataAccess() {
          return this._allowDataAccess;
        }
        releaseData() {
          this._data = globalEmptyMeshBuffer;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_struct", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return {
            vertexBundles: [],
            primitives: []
          };
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_hash", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_allowDataAccess", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class2)) || _class));
      cclegacy.Mesh = Mesh;
      ({
        isLittleEndian
      } = sys);
    }
  };
});