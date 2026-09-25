System.register("q-bundled:///fs/cocos/spine/lib/spine-define.js", ["./spine-core.js", "./spine-version.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var spine, SPINE_VERSION, js;
  /*
   Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
  
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
  /* eslint @typescript-eslint/no-explicit-any: "off" */
  /* eslint @typescript-eslint/no-unsafe-argument: "off" */

  function resizeArray(array, newSize) {
    if (!array) return new Array(newSize);
    if (newSize === array.length) return array;
    if (newSize < array.length) return array.slice(0, newSize);else return new Array(newSize);
  }
  function overrideDefineArrayProp(prototype, getPropVector, name) {
    const _name = `_${name}`;
    Object.defineProperty(prototype, name, {
      get() {
        const vectors = getPropVector.call(this);
        const count = vectors.size();
        let array = this[_name];
        array = resizeArray(array, count);
        for (let i = 0; i < count; i++) array[i] = vectors.get(i);
        this[_name] = array;
        return array;
      }
    });
  }
  function overrideDefineArrayArrayProp(prototype, getPropVector, name) {
    const _name = `_${name}`;
    Object.defineProperty(prototype, name, {
      get() {
        const vectors = getPropVector.call(this);
        const count = vectors.size();
        let array = this[_name];
        array = resizeArray(array, count);
        for (let i = 0; i < count; i++) {
          const vectorI = vectors.get(i);
          const countJ = vectorI.size();
          let arrayJ = array[i];
          arrayJ = resizeArray(arrayJ, countJ);
          for (let j = 0; j < countJ; j++) arrayJ[j] = vectorI.get(j);
          array[i] = arrayJ;
        }
        this[_name] = array;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return array;
      }
    });
  }
  function overrideDefineArrayFunction(prototype, getPropVector, name) {
    const _name = `_${name}`;
    Object.defineProperty(prototype, name, {
      value() {
        const vectors = getPropVector.call(this);
        const count = vectors.size();
        let array = this[_name];
        array = resizeArray(array, count);
        for (let i = 0; i < count; i++) array[i] = vectors.get(i);
        this[_name] = array;
        return array;
      }
    });
  }
  function overrideClass(wasm) {
    spine.wasmUtil = wasm.SpineWasmUtil;
    spine.wasmUtil.wasm = wasm;
    spine.wasmUtil.spineWasmInit();
    for (const k in wasm) {
      const v = wasm[k];
      if (!spine[k]) {
        spine[k] = v;
      }
    }
  }
  function overrideProperty_IkConstraintData() {
    const prototype = spine.IkConstraintData.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_PathConstraintData() {
    const prototype = spine.PathConstraintData.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_VertexAttachment() {
    const prototype = spine.VertexAttachment.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
    overrideDefineArrayProp(prototype, prototype.getVertices, 'vertices');
    const originComputeWorldVertices = prototype.computeWorldVertices;
    const vectors = new spine.SPVectorFloat();
    Object.defineProperty(prototype, 'computeWorldVertices', {
      value(slot, start, count, worldVertices, offset, stride) {
        const length = worldVertices.length;
        vectors.resize(length, 0);
        for (let i = 0; i < length; i++) vectors.set(i, worldVertices[i]);
        originComputeWorldVertices.call(this, slot, start, count, vectors, offset, stride);
        for (let i = 0; i < length; i++) worldVertices[i] = vectors.get(i);
      }
    });
  }
  function overrideProperty_MeshAttachment() {
    const prototype = spine.MeshAttachment.prototype;
    overrideDefineArrayProp(prototype, prototype.getRegionUVs, 'regionUVs');
    overrideDefineArrayProp(prototype, prototype.getUVs, 'uvs');
    overrideDefineArrayProp(prototype, prototype.getTriangles, 'triangles');
    overrideDefineArrayProp(prototype, prototype.getEdges, 'edges');
  }
  function overrideProperty_PathAttachment() {
    const prototype = spine.PathAttachment.prototype;
    overrideDefineArrayProp(prototype, prototype.getLengths, 'lengths');
  }
  function overrideProperty_RegionAttachment() {
    const prototype = spine.RegionAttachment.prototype;
    overrideDefineArrayProp(prototype, prototype.getOffset, 'offset');
    const getUVs = prototype.getUVs;
    const setUVs = prototype.setUVs;
    const _uvs = '_uvs';
    Object.defineProperty(prototype, 'uvs', {
      get() {
        const vectors = getUVs.call(this);
        const count = vectors.size();
        let array = prototype[_uvs];
        array = resizeArray(array, count);
        for (let i = 0; i < count; i++) array[i] = vectors.get(i);
        prototype[_uvs] = array;
        return array;
      },
      set(value) {
        setUVs.call(this, value[0], value[1], value[2], value[3], value[4] === 1);
      }
    });
    const originComputeWorldVertices = prototype.computeWorldVertices;
    const vectors = new spine.SPVectorFloat();
    Object.defineProperty(prototype, 'computeWorldVertices', {
      value(bone, worldVertices, offset, stride) {
        const length = worldVertices.length;
        vectors.resize(length, 0);
        for (let i = 0; i < length; i++) vectors.set(i, worldVertices[i]);
        originComputeWorldVertices.call(this, bone, vectors, offset, stride);
        for (let i = 0; i < length; i++) worldVertices[i] = vectors.get(i);
      }
    });
  }
  function overrideProperty_IkConstraint() {
    const prototype = spine.IkConstraint.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_PathConstraint() {
    const prototype = spine.PathConstraint.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_TransformConstraintData() {
    const prototype = spine.TransformConstraintData.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_TransformConstraint() {
    const prototype = spine.TransformConstraint.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
  }
  function overrideProperty_Bone() {
    const prototype = spine.Bone.prototype;
    overrideDefineArrayProp(prototype, prototype.getChildren, 'children');
  }
  function overrideProperty_Slot() {
    const prototype = spine.Slot.prototype;
    overrideDefineArrayProp(prototype, prototype.getDeform, 'deform');
  }
  function overrideProperty_Skin() {
    const prototype = spine.Skin.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
    overrideDefineArrayProp(prototype, prototype.getAttachments, 'attachments');
    overrideDefineArrayProp(prototype, prototype.getConstraints, 'constraints');
    overrideDefineArrayFunction(prototype, prototype.getAttachments, 'getAttachments');
    const originGetAttachmentsForSlot = prototype.getAttachmentsForSlot;
    Object.defineProperty(prototype, 'getAttachmentsForSlot', {
      value(slotIndex, attachments) {
        const vectors = originGetAttachmentsForSlot.call(this, slotIndex);
        const count = vectors.size();
        attachments.length = count;
        for (let i = 0; i < count; i++) {
          attachments[i] = vectors.get(i);
        }
        vectors.delete();
      }
    });
    const originFindNamesForSlot = prototype.findNamesForSlot;
    Object.defineProperty(prototype, 'findNamesForSlot', {
      value(slotIndex, names) {
        const vectors = originFindNamesForSlot.call(this, slotIndex);
        const count = vectors.size();
        names.length = count;
        for (let i = 0; i < count; i++) {
          names[i] = vectors.get(i);
        }
        vectors.delete();
      }
    });
  }
  function overrideProperty_SkinEntry() {
    const prototype = spine.SkinEntry.prototype;
    const propertyPolyfills = [['name', prototype.getName], ['attachment', prototype.getAttachment]];
    propertyPolyfills.forEach(prop => {
      js.getset(prototype, prop[0], prop[1]);
    });
  }
  function overrideProperty_SkeletonData() {
    const prototype = spine.SkeletonData.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
    overrideDefineArrayProp(prototype, prototype.getSlots, 'slots');
    overrideDefineArrayProp(prototype, prototype.getSkins, 'skins');
    overrideDefineArrayProp(prototype, prototype.getAnimations, 'animations');
    overrideDefineArrayProp(prototype, prototype.getEvents, 'events');
    overrideDefineArrayProp(prototype, prototype.getIkConstraints, 'ikConstraints');
    overrideDefineArrayProp(prototype, prototype.getTransformConstraints, 'transformConstraints');
    overrideDefineArrayProp(prototype, prototype.getPathConstraints, 'pathConstraints');
  }
  function overrideProperty_RotateTimeline() {
    const prototype = spine.RotateTimeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
  }
  function overrideProperty_ColorTimeline() {
    const prototype = spine.ColorTimeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
  }
  function overrideProperty_Timeline() {
    const prototype = spine.Timeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
  }
  function overrideProperty_AttachmentTimeline() {
    const prototype = spine.AttachmentTimeline.prototype;
    if (SPINE_VERSION === '3.8') {
      overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
    }
    overrideDefineArrayProp(prototype, prototype.getAttachmentNames, 'attachmentNames');
  }
  function overrideProperty_DeformTimeline() {
    const prototype = spine.DeformTimeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
    overrideDefineArrayArrayProp(prototype, prototype.getFrameVertices, 'frameVertices');
  }
  function overrideProperty_EventTimeline() {
    const prototype = spine.EventTimeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
    overrideDefineArrayProp(prototype, prototype.getEvents, 'events');
  }
  function overrideProperty_DrawOrderTimeline() {
    const prototype = spine.DrawOrderTimeline.prototype;
    overrideDefineArrayProp(prototype, prototype.getFrames, 'frames');
  }
  function overrideProperty_AnimationState() {
    const prototype = spine.AnimationState.prototype;
    overrideDefineArrayProp(prototype, prototype.getTracks, 'tracks');
  }
  function overrideProperty_Animation() {
    const prototype = spine.Animation.prototype;
    overrideDefineArrayProp(prototype, prototype.getTimelines, 'timelines');
  }
  function overrideProperty_Skeleton() {
    const prototype = spine.Skeleton.prototype;
    overrideDefineArrayProp(prototype, prototype.getBones, 'bones');
    overrideDefineArrayProp(prototype, prototype.getSlots, 'slots');
    overrideDefineArrayProp(prototype, prototype.getDrawOrder, 'drawOrder');
    overrideDefineArrayProp(prototype, prototype.getIkConstraints, 'ikConstraints');
    overrideDefineArrayProp(prototype, prototype.getTransformConstraints, 'transformConstraints');
    overrideDefineArrayProp(prototype, prototype.getPathConstraints, 'pathConstraints');
    overrideDefineArrayProp(prototype, prototype.getUpdateCacheList, '_updateCache');
  }
  function overrideSpineDefine(wasm) {
    overrideClass(wasm);
    overrideProperty_IkConstraintData();
    overrideProperty_PathConstraintData();
    overrideProperty_MeshAttachment();
    overrideProperty_PathAttachment();
    overrideProperty_RegionAttachment();
    overrideProperty_VertexAttachment();
    overrideProperty_IkConstraint();
    overrideProperty_PathConstraint();
    overrideProperty_TransformConstraintData();
    overrideProperty_TransformConstraint();
    overrideProperty_Bone();
    overrideProperty_Slot();
    overrideProperty_Skin();
    overrideProperty_SkinEntry();
    overrideProperty_SkeletonData();
    overrideProperty_RotateTimeline();
    if (SPINE_VERSION === '3.8') {
      overrideProperty_ColorTimeline();
    } else if (SPINE_VERSION === '4.2') {
      overrideProperty_Timeline();
    }
    overrideProperty_AttachmentTimeline();
    overrideProperty_DeformTimeline();
    overrideProperty_EventTimeline();
    overrideProperty_DrawOrderTimeline();
    overrideProperty_AnimationState();
    overrideProperty_Animation();
    overrideProperty_Skeleton();
  }
  _export("overrideSpineDefine", overrideSpineDefine);
  return {
    setters: [function (_spineCoreJs) {
      spine = _spineCoreJs.default;
    }, function (_spineVersionJs) {
      SPINE_VERSION = _spineVersionJs.SPINE_VERSION;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }],
    execute: function () {}
  };
});