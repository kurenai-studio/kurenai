System.register("q-bundled:///fs/cocos/core/data/index.js", ["./class-decorator.js", "../global-exports.js", "./class.js", "./object.js", "./utils/attribute.js", "./utils/compact-value-type-array.js", "./editor-extras-tag.js", "./custom-serializable.js", "./serialization-metadata.js", "./editor-extendable.js"], function (_export, _context) {
  "use strict";

  var _decorator, legacyCC;
  return {
    setters: [function (_classDecoratorJs) {
      _decorator = _classDecoratorJs;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }, function (_classJs) {
      _export({
        CCClass: _classJs.CCClass,
        isCCClassOrFastDefined: _classJs.isCCClassOrFastDefined
      });
    }, function (_objectJs) {
      _export({
        CCObject: _objectJs.CCObject,
        CCObjectFlags: _objectJs.CCObjectFlags
      });
    }, function (_utilsAttributeJs) {
      _export({
        CCInteger: _utilsAttributeJs.CCInteger,
        CCFloat: _utilsAttributeJs.CCFloat,
        CCBoolean: _utilsAttributeJs.CCBoolean,
        CCString: _utilsAttributeJs.CCString
      });
    }, function (_utilsCompactValueTypeArrayJs) {
      _export("CompactValueTypeArray", _utilsCompactValueTypeArrayJs.CompactValueTypeArray);
    }, function (_editorExtrasTagJs) {
      _export("editorExtrasTag", _editorExtrasTagJs.editorExtrasTag);
    }, function (_customSerializableJs) {
      _export({
        deserializeTag: _customSerializableJs.deserializeTag,
        serializeTag: _customSerializableJs.serializeTag
      });
    }, function (_serializationMetadataJs) {
      _export("getSerializationMetadata", _serializationMetadataJs.getSerializationMetadata);
    }, function (_editorExtendableJs) {
      _export("EditorExtendable", _editorExtendableJs.EditorExtendable);
    }],
    execute: function () {
      /*
       Copyright (c) 2018-2023 Xiamen Yaji Software Co., Ltd.
      
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

      legacyCC._decorator = _decorator;
      _export("_decorator", _decorator);
    }
  };
});