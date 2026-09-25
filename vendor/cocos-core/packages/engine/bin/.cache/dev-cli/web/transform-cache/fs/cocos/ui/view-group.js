System.register("q-bundled:///fs/cocos/ui/view-group.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var ccclass, executionOrder, Component, legacyCC, _dec, _dec2, _class, ViewGroup;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
       * Handling touch events in a ViewGroup takes special care,
       * because it's common for a ViewGroup to have children that are targets for different touch events than the ViewGroup itself.
       * To make sure that each view correctly receives the touch events intended for it,
       * ViewGroup should register capture phase event and handle the event propagation properly.
       * Please refer to ScrollView for more information.
       *
       * @zh
       * ViewGroup 的事件处理比较特殊，因为 ViewGroup 里面的子节点关心的事件跟 ViewGroup 本身可能不一样。
       * 为了让子节点能够正确地处理事件，ViewGroup 需要注册 capture 阶段的事件，并且合理地处理 ViewGroup 之间的事件传递。
       * 请参考 ScrollView 的实现来获取更多信息。
       */
      _export("ViewGroup", ViewGroup = (_dec = ccclass('cc.ViewGroup'), _dec2 = executionOrder(110), _dec(_class = _dec2(_class = class ViewGroup extends Component {}) || _class) || _class));
      legacyCC.ViewGroup = ViewGroup;
    }
  };
});