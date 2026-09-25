System.register("q-bundled:///fs/cocos/ui/deprecated.js", ["./deprecated-1.2.0.js", "./ui-coordinate-tracker.js", "./block-input-events.js", "./button.js", "./editbox/edit-box.js", "./layout.js", "./progress-bar.js", "./scroll-view.js", "./scroll-bar.js", "./slider.js", "./toggle.js", "./toggle-container.js", "./widget.js", "./page-view.js", "./page-view-indicator.js", "./safe-area.js", "../core/platform/debug.js", "../core/data/class-decorator.js", "../core/index.js", "../core/global-exports.js", "./view.js"], function (_export, _context) {
  "use strict";

  var UICoordinateTracker, BlockInputEvents, Button, EditBox, Layout, ProgressBar, ScrollView, ScrollBar, Slider, Toggle, ToggleContainer, Widget, PageView, PageViewIndicator, SafeArea, warnID, ccclass, js, removeProperty, markAsWarning, legacyCC, View, _dec, _class, UIReorderComponent;
  return {
    setters: [function (_deprecated120Js) {}, function (_uiCoordinateTrackerJs) {
      UICoordinateTracker = _uiCoordinateTrackerJs.UICoordinateTracker;
    }, function (_blockInputEventsJs) {
      BlockInputEvents = _blockInputEventsJs.BlockInputEvents;
    }, function (_buttonJs) {
      Button = _buttonJs.Button;
    }, function (_editboxEditBoxJs) {
      EditBox = _editboxEditBoxJs.EditBox;
    }, function (_layoutJs) {
      Layout = _layoutJs.Layout;
    }, function (_progressBarJs) {
      ProgressBar = _progressBarJs.ProgressBar;
    }, function (_scrollViewJs) {
      ScrollView = _scrollViewJs.ScrollView;
    }, function (_scrollBarJs) {
      ScrollBar = _scrollBarJs.ScrollBar;
    }, function (_sliderJs) {
      Slider = _sliderJs.Slider;
    }, function (_toggleJs) {
      Toggle = _toggleJs.Toggle;
    }, function (_toggleContainerJs) {
      ToggleContainer = _toggleContainerJs.ToggleContainer;
    }, function (_widgetJs) {
      Widget = _widgetJs.Widget;
    }, function (_pageViewJs) {
      PageView = _pageViewJs.PageView;
    }, function (_pageViewIndicatorJs) {
      PageViewIndicator = _pageViewIndicatorJs.PageViewIndicator;
    }, function (_safeAreaJs) {
      SafeArea = _safeAreaJs.SafeArea;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
    }, function (_coreDataClassDecoratorJs) {
      ccclass = _coreDataClassDecoratorJs.ccclass;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
      removeProperty = _coreIndexJs.removeProperty;
      markAsWarning = _coreIndexJs.markAsWarning;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_viewJs) {
      View = _viewJs.View;
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
      /**
       * @deprecated Since v1.2
       */
      _export("UIReorderComponent", UIReorderComponent = (_dec = ccclass('cc.UIReorderComponent'), _dec(_class = class UIReorderComponent {
        constructor() {
          warnID(1408, 'UIReorderComponent');
        }
      }) || _class));
      legacyCC.UIReorderComponent = UIReorderComponent;

      /**
       * Alias of [[Button]]
       * @deprecated Since v1.2
       */
      _export("ButtonComponent", Button);
      legacyCC.ButtonComponent = Button;
      js.setClassAlias(Button, 'cc.ButtonComponent');
      /**
       * Alias of [[EditBox]]
       * @deprecated Since v1.2
       */
      _export("EditBoxComponent", EditBox);
      legacyCC.EditBoxComponent = EditBox;
      js.setClassAlias(EditBox, 'cc.EditBoxComponent');
      /**
       * Alias of [[Layout]]
       * @deprecated Since v1.2
       */
      _export("LayoutComponent", Layout);
      legacyCC.LayoutComponent = Layout;
      js.setClassAlias(Layout, 'cc.LayoutComponent');
      /**
       * Alias of [[ProgressBar]]
       * @deprecated Since v1.2
       */
      _export("ProgressBarComponent", ProgressBar);
      legacyCC.ProgressBarComponent = ProgressBar;
      js.setClassAlias(ProgressBar, 'cc.ProgressBarComponent');
      /**
       * Alias of [[ScrollView]]
       * @deprecated Since v1.2
       */
      _export("ScrollViewComponent", ScrollView);
      legacyCC.ScrollViewComponent = ScrollView;
      js.setClassAlias(ScrollView, 'cc.ScrollViewComponent');
      /**
       * Alias of [[ScrollBar]]
       * @deprecated Since v1.2
       */
      _export("ScrollBarComponent", ScrollBar);
      legacyCC.ScrollBarComponent = ScrollBar;
      js.setClassAlias(ScrollBar, 'cc.ScrollBarComponent');
      /**
       * Alias of [[Slider]]
       * @deprecated Since v1.2
       */
      _export("SliderComponent", Slider);
      legacyCC.SliderComponent = Slider;
      js.setClassAlias(Slider, 'cc.SliderComponent');
      /**
       * Alias of [[Toggle]]
       * @deprecated Since v1.2
       */
      _export("ToggleComponent", Toggle);
      legacyCC.ToggleComponent = Toggle;
      js.setClassAlias(Toggle, 'cc.ToggleComponent');
      /**
       * Alias of [[ToggleContainer]]
       * @deprecated Since v1.2
       */
      _export("ToggleContainerComponent", ToggleContainer);
      legacyCC.ToggleContainerComponent = ToggleContainer;
      js.setClassAlias(ToggleContainer, 'cc.ToggleContainerComponent');
      /**
       * Alias of [[Widget]]
       * @deprecated Since v1.2
       */
      _export("WidgetComponent", Widget);
      legacyCC.WidgetComponent = Widget;
      js.setClassAlias(Widget, 'cc.WidgetComponent');
      /**
       * Alias of [[PageView]]
       * @deprecated Since v1.2
       */
      _export("PageViewComponent", PageView);
      legacyCC.PageViewComponent = PageView;
      js.setClassAlias(PageView, 'cc.PageViewComponent');
      /**
       * Alias of [[PageViewIndicator]]
       * @deprecated Since v1.2
       */
      _export("PageViewIndicatorComponent", PageViewIndicator);
      legacyCC.PageViewIndicatorComponent = PageViewIndicator;
      js.setClassAlias(PageViewIndicator, 'cc.PageViewIndicatorComponent');
      /**
       * Alias of [[SafeArea]]
       * @deprecated Since v1.2
       */
      _export("SafeAreaComponent", SafeArea);
      legacyCC.SafeAreaComponent = SafeArea;
      js.setClassAlias(SafeArea, 'cc.SafeAreaComponent');
      /**
       * Alias of [[UICoordinateTracker]]
       * @deprecated Since v1.2
       */
      _export("UICoordinateTrackerComponent", UICoordinateTracker);
      js.setClassAlias(UICoordinateTracker, 'cc.UICoordinateTrackerComponent');
      /**
       * Alias of [[BlockInputEvents]]
       * @deprecated Since v1.2
       */
      _export("BlockInputEventsComponent", BlockInputEvents);
      legacyCC.BlockInputEventsComponent = BlockInputEvents;
      js.setClassAlias(BlockInputEvents, 'cc.BlockInputEventsComponent');

      // #region deprecation on view
      removeProperty(View.prototype, 'View.prototype', [{
        name: 'isAntiAliasEnabled',
        suggest: 'The API of Texture2d have been largely modified, no alternative'
      }, {
        name: 'enableAntiAlias',
        suggest: 'The API of Texture2d have been largely modified, no alternative'
      }]);
      markAsWarning(View.prototype, 'View.prototype', [{
        name: 'adjustViewportMeta'
      }, {
        name: 'enableAutoFullScreen',
        suggest: 'use screen.requestFullScreen() instead.'
      }, {
        name: 'isAutoFullScreenEnabled'
      }, {
        name: 'setCanvasSize',
        suggest: 'setting size in CSS pixels is not recommended, please use screen.windowSize instead.'
      }, {
        name: 'getCanvasSize',
        suggest: 'please use screen.windowSize instead.'
      }, {
        name: 'getFrameSize',
        suggest: 'getting size in CSS pixels is not recommended, please use screen.windowSize instead.'
      }, {
        name: 'setFrameSize',
        suggest: 'setting size in CSS pixels is not recommended, please use screen.windowSize instead.'
      }, {
        name: 'getDevicePixelRatio',
        suggest: 'use screen.devicePixelRatio instead.'
      }, {
        name: 'convertToLocationInView'
      }, {
        name: 'enableRetina'
      }, {
        name: 'isRetinaEnabled'
      }, {
        name: 'setRealPixelResolution'
      }]);
    }
  };
});