System.register("q-bundled:///fs/cocos/animation/marionette/variable/index.js", ["./basic.js", "./primitive-variable.js", "./trigger-variable.js", "./vec3-variable.js", "./quat-variable.js"], function (_export, _context) {
  "use strict";

  var VariableType, PlainVariable, TriggerVariable, Vec3Variable, QuatVariable;
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

  function createVariable(type, initialValue) {
    let variable;
    switch (type) {
      case VariableType.FLOAT:
      case VariableType.INTEGER:
      case VariableType.BOOLEAN:
        variable = new PlainVariable(type);
        break;
      case VariableType.TRIGGER:
        variable = new TriggerVariable();
        break;
      case VariableType.VEC3_experimental:
        variable = new Vec3Variable();
        break;
      case VariableType.QUAT_experimental:
        variable = new QuatVariable();
        break;
      default:
        throw new Error(`Unknown variable type ${type}`);
    }
    if (typeof initialValue !== 'undefined') {
      variable.value = initialValue;
    }
    return variable;
  }
  _export("createVariable", createVariable);
  return {
    setters: [function (_basicJs) {
      VariableType = _basicJs.VariableType;
      _export({
        VariableType: _basicJs.VariableType,
        createInstanceTag: _basicJs.createInstanceTag
      });
    }, function (_primitiveVariableJs) {
      PlainVariable = _primitiveVariableJs.PlainVariable;
    }, function (_triggerVariableJs) {
      TriggerVariable = _triggerVariableJs.TriggerVariable;
      _export({
        VarInstanceTrigger: _triggerVariableJs.VarInstanceTrigger,
        TriggerResetMode: _triggerVariableJs.TriggerResetMode
      });
    }, function (_vec3VariableJs) {
      Vec3Variable = _vec3VariableJs.Vec3Variable;
    }, function (_quatVariableJs) {
      QuatVariable = _quatVariableJs.QuatVariable;
    }],
    execute: function () {}
  };
});