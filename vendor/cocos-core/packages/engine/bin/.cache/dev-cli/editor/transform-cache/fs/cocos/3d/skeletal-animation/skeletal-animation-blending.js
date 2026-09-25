System.register("q-bundled:///fs/cocos/3d/skeletal-animation/skeletal-animation-blending.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec3, Quat, BlendStateBuffer, BlendStateWriterInternal, LegacyVec3PropertyBlendState, LegacyQuatPropertyBlendState, NodeBlendState, LegacyNodeBlendState, LegacyBlendStateBuffer, TransformApplyFlag, TRANSFORM_APPLY_FLAGS_ALL;
  function mixAveragedVec3(result, previous, accumulatedWeight, input, weight) {
    const newSum = accumulatedWeight + weight;
    if (weight === 1.0 && !accumulatedWeight) {
      Vec3.copy(result, input);
    } else if (newSum) {
      const t = weight / newSum;
      Vec3.lerp(result, result, input, t);
    }
    return newSum;
  }
  function mixAveragedQuat(result, previous, accumulatedWeight, input, weight) {
    const newSum = accumulatedWeight + weight;
    if (weight === 1.0 && !accumulatedWeight) {
      Quat.copy(result, input);
    } else if (newSum) {
      const t = weight / newSum;
      Quat.slerp(result, previous, input, t);
    }
    return newSum;
  }
  _export({
    BlendStateBuffer: void 0,
    LegacyBlendStateBuffer: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
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
      _export("BlendStateBuffer", BlendStateBuffer = class BlendStateBuffer {
        constructor() {
          this._nodeBlendStates = new Map();
        }
        createWriter(node, property, host, constants) {
          const propertyBlendState = this.ref(node, property);
          return new BlendStateWriterInternal(node, property, propertyBlendState, host, constants);
        }
        destroyWriter(writer) {
          const internal = writer;
          this.deRef(internal.node, internal.property);
        }
        ref(node, property) {
          let nodeBlendState = this._nodeBlendStates.get(node);
          if (!nodeBlendState) {
            nodeBlendState = this.createNodeBlendState();
            this._nodeBlendStates.set(node, nodeBlendState);
          }
          const propertyBlendState = nodeBlendState.refProperty(node, property);
          return propertyBlendState;
        }
        deRef(node, property) {
          const nodeBlendState = this._nodeBlendStates.get(node);
          if (!nodeBlendState) {
            return;
          }
          nodeBlendState.deRefProperty(property);
          if (nodeBlendState.empty) {
            this._nodeBlendStates.delete(node);
          }
        }
        apply() {
          this._nodeBlendStates.forEach((nodeBlendState, node) => {
            nodeBlendState.apply(node);
          });
        }
      });
      BlendStateWriterInternal = class BlendStateWriterInternal {
        constructor(_node, _property, _propertyBlendState, _host, _constants) {
          this._node = _node;
          this._property = _property;
          this._propertyBlendState = _propertyBlendState;
          this._host = _host;
          this._constants = _constants;
        }
        get node() {
          return this._node;
        }
        get property() {
          return this._property;
        }
        getValue() {
          return this._node[this._property];
        }
        setValue(value) {
          const {
            _propertyBlendState: propertyBlendState,
            _host: host
          } = this;
          const weight = host.weight;
          // TODO: please fix type here @Leslie Leigh
          // Tracking issue: https://github.com/cocos/cocos-engine/issues/14640
          propertyBlendState.blend(value, weight);
        }
      };
      TransformApplyFlag = /*#__PURE__*/function (TransformApplyFlag) {
        TransformApplyFlag[TransformApplyFlag["POSITION"] = 1] = "POSITION";
        TransformApplyFlag[TransformApplyFlag["ROTATION"] = 2] = "ROTATION";
        TransformApplyFlag[TransformApplyFlag["SCALE"] = 4] = "SCALE";
        TransformApplyFlag[TransformApplyFlag["EULER_ANGLES"] = 8] = "EULER_ANGLES";
        return TransformApplyFlag;
      }(TransformApplyFlag || {});
      TRANSFORM_APPLY_FLAGS_ALL = TransformApplyFlag.POSITION | TransformApplyFlag.ROTATION | TransformApplyFlag.SCALE | TransformApplyFlag.EULER_ANGLES;
      LegacyVec3PropertyBlendState = class LegacyVec3PropertyBlendState {
        constructor() {
          this.refCount = 0;
          this.accumulatedWeight = 0.0;
          this.result = new Vec3();
        }
        blend(value, weight) {
          this.accumulatedWeight = mixAveragedVec3(this.result, this.result, this.accumulatedWeight, value, weight);
        }
        reset() {
          this.accumulatedWeight = 0.0;
          Vec3.zero(this.result);
        }
      };
      LegacyQuatPropertyBlendState = class LegacyQuatPropertyBlendState {
        constructor() {
          this.refCount = 0;
          this.accumulatedWeight = 0.0;
          this.result = new Quat();
        }
        blend(value, weight) {
          this.accumulatedWeight = mixAveragedQuat(this.result, this.result, this.accumulatedWeight, value, weight);
        }
        reset() {
          this.accumulatedWeight = 0.0;
          Quat.identity(this.result);
        }
      };
      NodeBlendState = class NodeBlendState {
        constructor() {
          this._transformApplyFlags = 0;
          this._properties = {};
        }
        get empty() {
          const {
            _properties: properties
          } = this;
          return !properties.position && !properties.rotation && !properties.eulerAngles && !properties.scale;
        }
        refProperty(node, property) {
          var _properties$property, _properties$property2;
          const {
            _properties: properties
          } = this;
          let propertyBlendState;
          switch (property) {
            default:
            case 'position':
            case 'scale':
            case 'eulerAngles':
              propertyBlendState = (_properties$property = properties[property]) != null ? _properties$property : properties[property] = this._createVec3BlendState(node[property]);
              break;
            case 'rotation':
              propertyBlendState = (_properties$property2 = properties[property]) != null ? _properties$property2 : properties[property] = this._createQuatBlendState(node.rotation);
              break;
          }
          ++propertyBlendState.refCount;
          return propertyBlendState;
        }
        deRefProperty(property) {
          const {
            _properties: properties
          } = this;
          const propertyBlendState = properties[property];
          if (!propertyBlendState) {
            return;
          }
          --propertyBlendState.refCount;
          if (propertyBlendState.refCount > 0) {
            return;
          }
          delete properties[property];
        }
        apply(node) {
          const {
            _transformApplyFlags: transformApplyFlags,
            _properties: {
              position,
              scale,
              rotation,
              eulerAngles
            }
          } = this;
          if (!transformApplyFlags) {
            return;
          }
          let t;
          let s;
          let r;
          if (position && transformApplyFlags & TransformApplyFlag.POSITION) {
            t = position.result;
          }
          if (scale && transformApplyFlags & TransformApplyFlag.SCALE) {
            s = scale.result;
          }
          if (eulerAngles && transformApplyFlags & TransformApplyFlag.EULER_ANGLES) {
            r = eulerAngles.result;
          }
          if (rotation && transformApplyFlags & TransformApplyFlag.ROTATION) {
            r = rotation.result;
          }
          if (r || t || s) {
            node.setRTS(r, t, s);
          }
          this._transformApplyFlags = 0;
        }
      };
      LegacyNodeBlendState = class LegacyNodeBlendState extends NodeBlendState {
        apply(node) {
          const {
            _properties: {
              position,
              scale,
              rotation,
              eulerAngles
            }
          } = this;
          if (position && position.accumulatedWeight) {
            this._transformApplyFlags |= TransformApplyFlag.POSITION;
            if (position.accumulatedWeight < 1.0) {
              position.blend(node.position, 1.0 - position.accumulatedWeight);
            }
          }
          if (scale && scale.accumulatedWeight) {
            this._transformApplyFlags |= TransformApplyFlag.SCALE;
            if (scale.accumulatedWeight < 1.0) {
              scale.blend(node.scale, 1.0 - scale.accumulatedWeight);
            }
          }
          if (eulerAngles && eulerAngles.accumulatedWeight) {
            this._transformApplyFlags |= TransformApplyFlag.EULER_ANGLES;
            if (eulerAngles.accumulatedWeight < 1.0) {
              eulerAngles.blend(node.eulerAngles, 1.0 - eulerAngles.accumulatedWeight);
            }
          }
          if (rotation && rotation.accumulatedWeight) {
            this._transformApplyFlags |= TransformApplyFlag.ROTATION;
            if (rotation.accumulatedWeight < 1.0) {
              rotation.blend(node.rotation, 1.0 - rotation.accumulatedWeight);
            }
          }
          super.apply(node);
          position == null || position.reset();
          scale == null || scale.reset();
          rotation == null || rotation.reset();
          eulerAngles == null || eulerAngles.reset();
        }
        _createVec3BlendState(_currentValue) {
          return new LegacyVec3PropertyBlendState();
        }
        _createQuatBlendState(_currentValue) {
          return new LegacyQuatPropertyBlendState();
        }
      };
      _export("LegacyBlendStateBuffer", LegacyBlendStateBuffer = class LegacyBlendStateBuffer extends BlendStateBuffer {
        createNodeBlendState() {
          return new LegacyNodeBlendState();
        }
      });
    }
  };
});