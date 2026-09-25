System.register("q-bundled:///fs/cocos/animation/tracks/track.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/data/utils/asserts.js", "../../scene-graph/index.js", "../define.js", "../target-path.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, uniquelyReferenced, SUPPORT_JIT, errorID, warnID, js, assertIsTrue, Node, CLASS_NAME_PREFIX_ANIM, createEvalSymbol, ComponentPath, HierarchyPath, isPropertyPath, SingleChannelTrackEval, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _descriptor3, _TrackBinding, _dec3, _class5, _class6, _descriptor4, _dec4, _class7, _class8, _descriptor5, _dec5, _class9, _class0, _descriptor6, normalizedFollowTag, parseTrsPathTag, trackBindingTag, TrackPath, TrackBinding, Track, Channel, SingleChannelTrack;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function isTrsPropertyName(name) {
    return name === 'position' || name === 'rotation' || name === 'scale' || name === 'eulerAngles';
  }
  _export("isTrsPropertyName", isTrsPropertyName);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      uniquelyReferenced = _coreDataDecoratorsIndexJs.uniquelyReferenced;
    }, function (_virtualInternal253AconstantsJs) {
      SUPPORT_JIT = _virtualInternal253AconstantsJs.SUPPORT_JIT;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
      warnID = _coreIndexJs.warnID;
      js = _coreIndexJs.js;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_targetPathJs) {
      ComponentPath = _targetPathJs.ComponentPath;
      HierarchyPath = _targetPathJs.HierarchyPath;
      isPropertyPath = _targetPathJs.isPropertyPath;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
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
      _export("normalizedFollowTag", normalizedFollowTag = Symbol('NormalizedFollow'));
      parseTrsPathTag = Symbol('ConvertAsTrsPath');
      _export("trackBindingTag", trackBindingTag = Symbol('TrackBinding'));
      /**
       * @en Describes how to find the animation target.
       * @zh 描述怎样寻址动画目标。
       */
      _export("TrackPath", TrackPath = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}TrackPath`), _dec(_class = (_class2 = class TrackPath {
        constructor() {
          _initializerDefineProperty(this, "_paths", _descriptor, this);
        }
        /**
         * @en The length of the path.
         * @zh 此路径的段数。
         */
        get length() {
          return this._paths.length;
        }

        /**
         * @en Appends a property path.
         * @zh 附加一段属性路径。
         * @param name The property's name.
         * @returns `this`
         */
        toProperty(name) {
          this._paths.push(name);
          return this;
        }

        /**
         * @en Appends an array element path.
         * @zh 附加一段数组元素路径。
         * @param index The element's index.
         * @returns `this`
         */
        toElement(index) {
          this._paths.push(index);
          return this;
        }

        /**
         * @en Appends a hierarchy path.
         * @zh 附加一段层级路径。
         * @param nodePath Path to the children.
         * @returns `this`
         */
        toHierarchy(nodePath) {
          this._paths.push(new HierarchyPath(nodePath));
          return this;
        }

        /**
         * @en Appends a component path.
         * @zh 附加一段组件路径。
         * @param constructor @en The constructor of the component. @zh 组件的构造函数。
         * @returns `this`
         */
        toComponent(constructor) {
          const path = new ComponentPath(typeof constructor === 'string' ? constructor : js.getClassName(constructor));
          this._paths.push(path);
          return this;
        }

        /**
         * @internal Reserved for backward compatibility. DO NOT USE IT IN YOUR CODE.
         */
        toCustomized(resolver) {
          this._paths.push(resolver);
          return this;
        }

        /**
         * @en Appends paths to this path.
         * @zh 附加指定路径到此路径后。
         * @param trackPaths Paths to append.
         * @returns `this`.
         */
        append(...trackPaths) {
          const paths = this._paths.concat(...trackPaths.map(trackPath => trackPath._paths));
          this._paths = paths;
          return this;
        }

        /**
         * @zh 判断指定路径段是否是属性路径。
         * @en Decides if the specific path segment is property path.
         * @param index Index to the segment。
         * @returns The judgement result.
         */
        isPropertyAt(index) {
          return typeof this._paths[index] === 'string';
        }

        /**
         * @zh 将指定路径段视为属性路径，获取其描述的属性。
         * @en Treats the path segment as a property path. Obtains the property it describes.
         * @param index Index to the segment。
         * @returns The property.
         */
        parsePropertyAt(index) {
          return this._paths[index];
        }

        /**
         * @zh 判断指定路径段是否是数组元素路径。
         * @en Decides if the specific path segment is an array element path.
         * @param index Index to the segment。
         * @returns The judgement result.
         */
        isElementAt(index) {
          return typeof this._paths[index] === 'number';
        }

        /**
         * @zh 将指定路径段视为数组元素路径，获取其描述的数组元素。
         * @en Treats the path segment as an array element path. Obtains the element index it describes.
         * @param index Index to the segment。
         * @returns The element index.
         */
        parseElementAt(index) {
          return this._paths[index];
        }

        /**
         * @zh 判断指定路径段是否是层级路径。
         * @en Decides if the specific path segment is a hierarchy path.
         * @param index Index to the segment。
         * @returns The judgement result.
         */
        isHierarchyAt(index) {
          return this._paths[index] instanceof HierarchyPath;
        }

        /**
         * @zh 将指定路径段视为层级路径，获取其描述的层级路径。
         * @en Treats the path segment as a hierarchy path. Obtains the hierarchy path it describes.
         * @param index Index to the segment。
         * @returns The hierarchy path.
         */
        parseHierarchyAt(index) {
          assertIsTrue(this.isHierarchyAt(index));
          return this._paths[index].path;
        }

        /**
         * @zh 判断指定路径段是否是组件路径。
         * @en Decides if the specific path segment is a component path.
         * @param index Index to the segment。
         * @returns The judgement result.
         */
        isComponentAt(index) {
          return this._paths[index] instanceof ComponentPath;
        }

        /**
         * @zh 将指定路径段视为组件路径，获取其描述的组件路径。
         * @en Treats the path segment as a hierarchy path. Obtains the component path it describes.
         * @param index Index to the segment。
         * @returns The component path.
         */
        parseComponentAt(index) {
          assertIsTrue(this.isComponentAt(index));
          return this._paths[index].component;
        }

        /**
         * @en Slices a interval of the path.
         * @zh 分割指定区段上的路径。
         * @param beginIndex Begin index to the segment. Default to 0.
         * @param endIndex End index to the segment. Default to the last segment.
         * @returns The new path.
         */
        slice(beginIndex, endIndex) {
          const trackPath = new TrackPath();
          trackPath._paths = this._paths.slice(beginIndex, endIndex);
          return trackPath;
        }

        /**
         * @internal
         */
        trace(object, beginIndex, endIndex) {
          beginIndex != null ? beginIndex : beginIndex = 0;
          endIndex != null ? endIndex : endIndex = this._paths.length;
          return this[normalizedFollowTag](object, beginIndex, endIndex);
        }

        /**
         * @internal
         */
        [parseTrsPathTag]() {
          const {
            _paths: paths
          } = this;
          const nPaths = paths.length;
          let iPath = 0;
          let nodePath = '';
          for (; iPath < nPaths; ++iPath) {
            const path = paths[iPath];
            if (!(path instanceof HierarchyPath)) {
              break;
            } else if (!path.path) {
              continue;
            } else if (nodePath) {
              nodePath += `/${path.path}`;
            } else {
              nodePath = path.path;
            }
          }
          if (iPath === nPaths) {
            return null;
          }
          let prs;
          if (iPath !== nPaths - 1) {
            return null;
          }
          switch (paths[iPath]) {
            case 'position':
            case 'scale':
            case 'rotation':
            case 'eulerAngles':
              prs = paths[iPath];
              break;
            default:
              return null;
          }
          return {
            node: nodePath,
            property: prs
          };
        }

        /**
         * @internal
         */
        [normalizedFollowTag](root, beginIndex, endIndex) {
          const {
            _paths: paths
          } = this;
          let result = root;
          for (let iPath = beginIndex; iPath < endIndex; ++iPath) {
            const path = paths[iPath];
            if (isPropertyPath(path)) {
              if (!(path in result)) {
                warnID(3929, path);
                return null;
              } else {
                result = result[path];
              }
            } else {
              result = path.get(result);
            }
            if (result === null) {
              break;
            }
          }
          return result;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_paths", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      /**
       * Composite of track path and value proxy.
       * Not exposed to external. If there is any reason it should be exposed,
       * please redesign the public interfaces.
       */
      _export("TrackBinding", TrackBinding = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}TrackBinding`), _dec2(_class3 = uniquelyReferenced(_class3 = (_class4 = (_TrackBinding = class TrackBinding {
        constructor() {
          _initializerDefineProperty(this, "path", _descriptor2, this);
          _initializerDefineProperty(this, "proxy", _descriptor3, this);
        }
        parseTrsPath() {
          if (this.proxy) {
            return null;
          } else {
            return this.path[parseTrsPathTag]();
          }
        }

        // eslint-disable-next-line max-len
        createRuntimeBinding(target, poseOutput, isConstant) {
          const {
            path,
            proxy
          } = this;
          const nPaths = path.length;
          const iLastPath = nPaths - 1;
          if (nPaths !== 0 && (path.isPropertyAt(iLastPath) || path.isElementAt(iLastPath)) && !proxy) {
            const lastPropertyKey = path.isPropertyAt(iLastPath) ? path.parsePropertyAt(iLastPath) : path.parseElementAt(iLastPath);
            const resultTarget = path[normalizedFollowTag](target, 0, nPaths - 1);
            if (resultTarget === null) {
              return null;
            }
            if (poseOutput && resultTarget instanceof Node && isTrsPropertyName(lastPropertyKey)) {
              const blendStateWriter = poseOutput.createPoseWriter(resultTarget, lastPropertyKey, isConstant);
              return blendStateWriter;
            }
            let setValue;
            let getValue;
            if (SUPPORT_JIT) {
              let animationFunction = TrackBinding._animationFunctions.get(resultTarget.constructor);
              if (!animationFunction) {
                animationFunction = new Map();
                TrackBinding._animationFunctions.set(resultTarget.constructor, animationFunction);
              }
              let accessor = animationFunction.get(lastPropertyKey);
              if (!accessor) {
                accessor = {
                  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
                  setValue: Function('value', `this.target["${lastPropertyKey}"] = value;`),
                  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
                  getValue: Function(`return this.target["${lastPropertyKey}"];`)
                };
                animationFunction.set(lastPropertyKey, accessor);
              }
              setValue = accessor.setValue;
              getValue = accessor.getValue;
            } else {
              setValue = value => {
                resultTarget[lastPropertyKey] = value;
              };
              getValue = () => resultTarget[lastPropertyKey];
            }
            return {
              target: resultTarget,
              setValue,
              getValue
            };
          } else if (!proxy) {
            errorID(3921);
            return null;
          } else {
            const resultTarget = path[normalizedFollowTag](target, 0, nPaths);
            if (resultTarget === null) {
              return null;
            }
            const runtimeProxy = proxy.forTarget(resultTarget);
            if (!runtimeProxy) {
              return null;
            }
            const binding = {
              setValue: value => {
                runtimeProxy.set(value);
              }
            };
            const proxyGet = runtimeProxy.get;
            if (proxyGet) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              binding.getValue = () => proxyGet.call(runtimeProxy);
            }
            return binding;
          }
        }
        isMaskedOff(mask) {
          const trsPath = this.parseTrsPath();
          if (!trsPath) {
            return false;
          }
          const joints = mask.joints[Symbol.iterator]();
          for (let jointMaskInfoIter = joints.next(); !jointMaskInfoIter.done; jointMaskInfoIter = joints.next()) {
            const {
              value: jointMaskInfo
            } = jointMaskInfoIter;
            if (jointMaskInfo.path !== trsPath.node) {
              continue;
            }
            return !jointMaskInfo.enabled;
          }
          return false;
        }
      }, _TrackBinding._animationFunctions = new WeakMap(), _TrackBinding), _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new TrackPath();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "proxy", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class4)) || _class3) || _class3));
      /**
       * @en
       * A track describes how to trace the target and how to animate it.
       * It's the basic unit of animation clip.
       * @zh
       * 轨道描述了动画目标的路径和动画的方式。它是动画剪辑的基础单元。
       */
      _export("Track", Track = (_dec3 = ccclass(`${CLASS_NAME_PREFIX_ANIM}Track`), _dec3(_class5 = (_class6 = class Track {
        constructor() {
          _initializerDefineProperty(this, "_binding", _descriptor4, this);
        }
        /**
         * @en Track path.
         * @zh 轨道路径。
         */
        get path() {
          return this._binding.path;
        }
        set path(value) {
          this._binding.path = value;
        }

        /**
         * @en Value proxy for the target.
         * @zh 目标的值代理。
         */
        get proxy() {
          return this._binding.proxy;
        }
        set proxy(value) {
          this._binding.proxy = value;
        }

        /**
         * @internal
         */
        get [trackBindingTag]() {
          return this._binding;
        }

        /**
         * @en Channels on this track.
         * @zh 此轨道上的通道。
         * @returns Iterator to the channels.
         */
        channels() {
          return [];
        }

        /**
         * @en Time range of this track.
         * @zh 此轨道的时间范围。
         * @returns The time range.
         */
        range() {
          const range = {
            min: Infinity,
            max: -Infinity
          };
          for (const channel of this.channels()) {
            range.min = Math.min(range.min, channel.curve.rangeMin);
            range.max = Math.max(range.max, channel.curve.rangeMax);
          }
          return range;
        }

        /**
         * @internal
         */
      }, _descriptor4 = _applyDecoratedDescriptor(_class6.prototype, "_binding", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new TrackBinding();
        }
      }), _class6)) || _class5));
      /**
       * @en
       * Channel contains a curve.
       * @zh
       * 通道包含了一条曲线。
       */
      _export("Channel", Channel = (_dec4 = ccclass(`${CLASS_NAME_PREFIX_ANIM}Channel`), _dec4(_class7 = (_class8 = class Channel {
        constructor(curve) {
          /**
           * @internal Not used for now.
           */
          this.name = '';
          _initializerDefineProperty(this, "_curve", _descriptor5, this);
          this._curve = curve;
        }
        /**
         * @en The curve within the channel.
         * @zh 通道中的曲线。
         */
        get curve() {
          return this._curve;
        }
      }, _descriptor5 = _applyDecoratedDescriptor(_class8.prototype, "_curve", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class8)) || _class7));
      /**
       * @en 表示一个包含了单条通道的轨道。
       * @zh Describes a track which contains only single channel.
       */
      _export("SingleChannelTrack", SingleChannelTrack = (_dec5 = ccclass(`${CLASS_NAME_PREFIX_ANIM}SingleChannelTrack`), _dec5(_class9 = (_class0 = class SingleChannelTrack extends Track {
        constructor() {
          super();
          _initializerDefineProperty(this, "_channel", _descriptor6, this);
          this._channel = new Channel(this.createCurve());
        }

        /**
         * @en The channel within the track.
         * @zh 轨道包含的通道。
         */
        get channel() {
          return this._channel;
        }
        channels() {
          return [this._channel];
        }

        /**
         * @internal
         */
        createCurve() {
          throw new Error(`Not impl`);
        }

        /**
         * @internal
         */
        [createEvalSymbol]() {
          const {
            curve
          } = this._channel;
          return new SingleChannelTrackEval(curve);
        }
      }, _descriptor6 = _applyDecoratedDescriptor(_class0.prototype, "_channel", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class0)) || _class9));
      SingleChannelTrackEval = class SingleChannelTrackEval {
        constructor(_curve) {
          this._curve = _curve;
        }
        get requiresDefault() {
          return false;
        }
        evaluate(time) {
          return this._curve.evaluate(time);
        }
      };
    }
  };
});