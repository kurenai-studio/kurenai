System.register("q-bundled:///fs/cocos/ui/index.js", ["./button.js", "./editbox/edit-box.js", "./layout.js", "./progress-bar.js", "./scroll-bar.js", "./scroll-view.js", "./slider.js", "./toggle.js", "./toggle-container.js", "./view-group.js", "./widget.js", "./page-view.js", "./page-view-indicator.js", "./safe-area.js", "./ui-coordinate-tracker.js", "./block-input-events.js", "./sub-context-view.js", "./widget-manager.js", "./view.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_buttonJs) {
      _export("Button", _buttonJs.Button);
    }, function (_editboxEditBoxJs) {
      _export("EditBox", _editboxEditBoxJs.EditBox);
    }, function (_layoutJs) {
      _export("Layout", _layoutJs.Layout);
    }, function (_progressBarJs) {
      _export("ProgressBar", _progressBarJs.ProgressBar);
    }, function (_scrollBarJs) {
      _export("ScrollBar", _scrollBarJs.ScrollBar);
    }, function (_scrollViewJs) {
      _export("ScrollView", _scrollViewJs.ScrollView);
    }, function (_sliderJs) {
      _export("Slider", _sliderJs.Slider);
    }, function (_toggleJs) {
      _export("Toggle", _toggleJs.Toggle);
    }, function (_toggleContainerJs) {
      _export("ToggleContainer", _toggleContainerJs.ToggleContainer);
    }, function (_viewGroupJs) {
      _export("ViewGroup", _viewGroupJs.ViewGroup);
    }, function (_widgetJs) {
      _export("Widget", _widgetJs.Widget);
    }, function (_pageViewJs) {
      _export("PageView", _pageViewJs.PageView);
    }, function (_pageViewIndicatorJs) {
      _export("PageViewIndicator", _pageViewIndicatorJs.PageViewIndicator);
    }, function (_safeAreaJs) {
      _export("SafeArea", _safeAreaJs.SafeArea);
    }, function (_uiCoordinateTrackerJs) {
      _export("UICoordinateTracker", _uiCoordinateTrackerJs.UICoordinateTracker);
    }, function (_blockInputEventsJs) {
      _export("BlockInputEvents", _blockInputEventsJs.BlockInputEvents);
    }, function (_subContextViewJs) {
      _export("SubContextView", _subContextViewJs.SubContextView);
    }, function (_widgetManagerJs) {
      _export("widgetManager", _widgetManagerJs.widgetManager);
    }, function (_viewJs) {
      var _exportObj = {};
      for (var _key in _viewJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _viewJs[_key];
      }
      _export(_exportObj);
    }, function (_deprecatedJs) {
      var _exportObj2 = {};
      for (var _key2 in _deprecatedJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _deprecatedJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});