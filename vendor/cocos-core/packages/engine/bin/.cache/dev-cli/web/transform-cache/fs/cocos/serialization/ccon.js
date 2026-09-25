System.register("q-bundled:///fs/cocos/serialization/ccon.js", ["../core/index.js", "../../external/deserialize/notepack_decode.js", "../../external/deserialize/notepack_encode.js"], function (_export, _context) {
  "use strict";

  var getError, cclegacy, notepackDecode, notepackEncode, CCON, InvalidCCONError, BufferBuilder, VERSION, MAGIC, CHUNK_ALIGN_AS;
  function encodeCCONBinary(ccon) {
    const {
      document,
      chunks
    } = ccon;
    const jsonBytes = new Uint8Array(notepackEncode(document));
    const ccobBuilder = new BufferBuilder();
    const header = new ArrayBuffer(12);
    const headerView = new DataView(header);
    headerView.setUint32(0, MAGIC, true); // Magic
    headerView.setUint32(4, VERSION, true); // Version

    ccobBuilder.append(headerView);
    ccobBuilder.append(uint32Bytes(jsonBytes.byteLength));
    ccobBuilder.append(jsonBytes);
    chunks.forEach(chunk => {
      ccobBuilder.alignAs(CHUNK_ALIGN_AS);
      ccobBuilder.append(uint32Bytes(chunk.byteLength));
      ccobBuilder.append(chunk);
    });
    headerView.setUint32(8, ccobBuilder.byteLength, true);
    return ccobBuilder.get();
    function uint32Bytes(value) {
      const bytes = new ArrayBuffer(4);
      const view = new DataView(bytes);
      view.setUint32(0, value, true);
      return view;
    }
  }
  function decodeCCONBinary(bytes) {
    if (bytes.length < 16) {
      throw new InvalidCCONError(getError(13102));
    }
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = dataView.getUint32(0, true);
    if (magic !== MAGIC) {
      throw new InvalidCCONError(getError(13100));
    }
    const version = dataView.getUint32(4, true);
    const dataByteLength = dataView.getUint32(8, true);
    if (dataByteLength !== dataView.byteLength) {
      throw new InvalidCCONError(getError(13102));
    }
    let chunksStart = 12;
    const jsonDataLength = dataView.getUint32(chunksStart, true);
    chunksStart += 4;
    const jsonData = new Uint8Array(dataView.buffer, chunksStart + dataView.byteOffset, jsonDataLength);
    chunksStart += jsonDataLength;
    let json;
    try {
      if (version === 1) {
        const jsonString = decodeJson(jsonData);
        json = JSON.parse(jsonString);
      } else if (version === 2) {
        json = notepackDecode(jsonData);
      }
    } catch (err) {
      throw new InvalidCCONError(err);
    }
    const chunks = [];
    while (chunksStart < dataView.byteLength) {
      if (chunksStart % CHUNK_ALIGN_AS !== 0) {
        const padding = CHUNK_ALIGN_AS - chunksStart % CHUNK_ALIGN_AS;
        chunksStart += padding;
      }
      const chunkDataLength = dataView.getUint32(chunksStart, true);
      chunksStart += 4;
      chunks.push(new Uint8Array(dataView.buffer, chunksStart + dataView.byteOffset, chunkDataLength));
      chunksStart += chunkDataLength;
    }
    if (chunksStart !== dataView.byteLength) {
      throw new InvalidCCONError(getError(13102));
    }
    return new CCON(json, chunks);
  }

  /**
   * Partial signature of Node.js `Buffer`: https://nodejs.org/api/buffer.html
   */

  function decodeJson(data) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder().decode(data);
    } else if ('Buffer' in globalThis) {
      const {
        Buffer
      } = globalThis;
      // eslint-disable-next-line no-buffer-constructor
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString();
    } else {
      throw new Error(getError(13104));
    }
  }
  _export({
    CCON: void 0,
    encodeCCONBinary: encodeCCONBinary,
    decodeCCONBinary: decodeCCONBinary,
    InvalidCCONError: void 0,
    BufferBuilder: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      getError = _coreIndexJs.getError;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_externalDeserializeNotepack_decodeJs) {
      notepackDecode = _externalDeserializeNotepack_decodeJs.notepackDecode;
    }, function (_externalDeserializeNotepack_encodeJs) {
      notepackEncode = _externalDeserializeNotepack_encodeJs.notepackEncode;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      VERSION = 2;
      MAGIC = 0x4E4F4343;
      CHUNK_ALIGN_AS = 8;
      _export("CCON", CCON = class CCON {
        constructor(document, chunks) {
          this._document = document;
          this._chunks = chunks;
        }
        get document() {
          return this._document;
        }
        get chunks() {
          return this._chunks;
        }
      });
      _export("InvalidCCONError", InvalidCCONError = class InvalidCCONError extends Error {});
      _export("BufferBuilder", BufferBuilder = class BufferBuilder {
        constructor() {
          this._viewOrPaddings = [];
          this._length = 0;
        }
        get byteLength() {
          return this._length;
        }
        alignAs(align) {
          if (align !== 0) {
            const remainder = this._length % align;
            if (remainder !== 0) {
              const padding = align - remainder;
              this._viewOrPaddings.push(padding);
              this._length += padding;
              return padding;
            }
          }
          return 0;
        }
        append(view) {
          const result = this._length;
          this._viewOrPaddings.push(view);
          this._length += view.byteLength;
          return result;
        }
        get() {
          const result = new Uint8Array(this._length);
          let counter = 0;
          this._viewOrPaddings.forEach(viewOrPadding => {
            if (typeof viewOrPadding === 'number') {
              counter += viewOrPadding;
            } else {
              result.set(new Uint8Array(viewOrPadding.buffer, viewOrPadding.byteOffset, viewOrPadding.byteLength), counter);
              counter += viewOrPadding.byteLength;
            }
          });
          return result;
        }
      });
      cclegacy.internal.decodeCCONBinary = decodeCCONBinary;
      cclegacy.internal.encodeCCONBinary = encodeCCONBinary;
      cclegacy.internal.CCON = CCON;
      cclegacy.internal.BufferBuilder = BufferBuilder;
    }
  };
});