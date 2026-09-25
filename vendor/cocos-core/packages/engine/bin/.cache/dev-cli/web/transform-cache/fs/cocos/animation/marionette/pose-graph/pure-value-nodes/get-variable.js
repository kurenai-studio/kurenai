System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pure-value-nodes/get-variable.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/index.js", "../../../../core/data/class-decorator.js", "../../variable/index.js", "../../../define.js", "../pure-value-node.js", "../decorator/node.js", "../foundation/type-system.js"], function (_export, _context) {
  "use strict";

  var EDITOR, editable, serializable, ccclass, VariableType, CLASS_NAME_PREFIX_ANIM, SingleOutputPVNode, poseGraphCreateNodeFactory, poseGraphNodeAppearance, poseGraphNodeHide, PoseGraphType, _dec, _dec2, _class, _class2, _descriptor, _dec3, _dec4, _dec5, _class3, _dec6, _dec7, _dec8, _class4, _dec9, _dec0, _dec1, _class5, _dec10, _dec11, _dec12, _class6, _dec13, _dec14, _dec15, _class7, createNodeFactory, PVNodeGetVariableBase, PVNodeGetVariableFloat, PVNodeGetVariableInteger, PVNodeGetVariableBoolean, PVNodeGetVariableVec3, PVNodeGetVariableQuat;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreIndexJs) {
      editable = _coreIndexJs.editable;
      serializable = _coreIndexJs.serializable;
    }, function (_coreDataClassDecoratorJs) {
      ccclass = _coreDataClassDecoratorJs.ccclass;
    }, function (_variableIndexJs) {
      VariableType = _variableIndexJs.VariableType;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_pureValueNodeJs) {
      SingleOutputPVNode = _pureValueNodeJs.SingleOutputPVNode;
    }, function (_decoratorNodeJs) {
      poseGraphCreateNodeFactory = _decoratorNodeJs.poseGraphCreateNodeFactory;
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeHide = _decoratorNodeJs.poseGraphNodeHide;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }],
    execute: function () {
      createNodeFactory = {
        // eslint-disable-next-line arrow-body-style
        listEntries: context => {
          // eslint-disable-next-line arrow-body-style
          const entries = [];
          for (const [variableName, {
            type
          }] of context.animationGraph.variables) {
            if (type === VariableType.TRIGGER) {
              continue;
            }
            let poseGraphType;
            switch (type) {
              default:
                break;
              case VariableType.FLOAT:
                poseGraphType = PoseGraphType.FLOAT;
                break;
              case VariableType.INTEGER:
                poseGraphType = PoseGraphType.INTEGER;
                break;
              case VariableType.BOOLEAN:
                poseGraphType = PoseGraphType.BOOLEAN;
                break;
              case VariableType.VEC3_experimental:
                poseGraphType = PoseGraphType.VEC3;
                break;
              case VariableType.QUAT_experimental:
                poseGraphType = PoseGraphType.QUAT;
                break;
            }
            if (typeof poseGraphType === 'undefined') {
              continue;
            }
            entries.push({
              arg: {
                name: variableName,
                type: poseGraphType
              },
              menu: variableName
            });
          }
          return entries;
        },
        create: arg => {
          let node;
          switch (arg.type) {
            default:
              throw new Error(`Bad create node arg: ${PoseGraphType[arg.type]}`);
            case PoseGraphType.FLOAT:
              node = new PVNodeGetVariableFloat();
              break;
            case PoseGraphType.INTEGER:
              node = new PVNodeGetVariableInteger();
              break;
            case PoseGraphType.BOOLEAN:
              node = new PVNodeGetVariableBoolean();
              break;
            case PoseGraphType.VEC3:
              node = new PVNodeGetVariableVec3();
              break;
            case PoseGraphType.QUAT:
              node = new PVNodeGetVariableQuat();
              break;
          }
          node.variableName = arg.name;
          return node;
        }
      };
      _export("PVNodeGetVariableBase", PVNodeGetVariableBase = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableBase`), _dec2 = poseGraphCreateNodeFactory(createNodeFactory), _dec(_class = _dec2(_class = (_class2 = class PVNodeGetVariableBase extends SingleOutputPVNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "variableName", _descriptor, this);
          this._varInstance = undefined;
        }
        link(context) {
          this._varInstance = context.getVar(this.variableName);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "variableName", [editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _class2)) || _class) || _class));
      if (EDITOR) {
        PVNodeGetVariableBase.prototype.getTitle = function getTitle() {
          if (!this.variableName) {
            return undefined;
          }
          return [`ENGINE.classes.${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableBase.title`, {
            variableName: this.variableName
          }];
        };
      }
      _export("PVNodeGetVariableFloat", PVNodeGetVariableFloat = (_dec3 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableFloat`), _dec4 = poseGraphNodeHide(), _dec5 = poseGraphNodeAppearance({
        inline: true,
        themeColor: '#8471CF'
      }), _dec3(_class3 = _dec4(_class3 = _dec5(_class3 = class PVNodeGetVariableFloat extends PVNodeGetVariableBase {
        constructor() {
          super(PoseGraphType.FLOAT);
        }
        selfEvaluateDefaultOutput() {
          var _this$_varInstance;
          return (_this$_varInstance = this._varInstance) == null ? void 0 : _this$_varInstance.value; // TODO
        }
      }) || _class3) || _class3) || _class3));
      _export("PVNodeGetVariableInteger", PVNodeGetVariableInteger = (_dec6 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableInteger`), _dec7 = poseGraphNodeHide(), _dec8 = poseGraphNodeAppearance({
        inline: true,
        themeColor: '#2A90DC'
      }), _dec6(_class4 = _dec7(_class4 = _dec8(_class4 = class PVNodeGetVariableInteger extends PVNodeGetVariableBase {
        constructor() {
          super(PoseGraphType.INTEGER);
        }
        selfEvaluateDefaultOutput() {
          var _this$_varInstance2;
          return (_this$_varInstance2 = this._varInstance) == null ? void 0 : _this$_varInstance2.value; // TODO
        }
      }) || _class4) || _class4) || _class4));
      _export("PVNodeGetVariableBoolean", PVNodeGetVariableBoolean = (_dec9 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableBoolean`), _dec0 = poseGraphNodeHide(), _dec1 = poseGraphNodeAppearance({
        inline: true,
        themeColor: '#D07979'
      }), _dec9(_class5 = _dec0(_class5 = _dec1(_class5 = class PVNodeGetVariableBoolean extends PVNodeGetVariableBase {
        constructor() {
          super(PoseGraphType.BOOLEAN);
        }
        selfEvaluateDefaultOutput() {
          var _this$_varInstance3;
          return (_this$_varInstance3 = this._varInstance) == null ? void 0 : _this$_varInstance3.value; // TODO
        }
      }) || _class5) || _class5) || _class5));
      _export("PVNodeGetVariableVec3", PVNodeGetVariableVec3 = (_dec10 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableVec3`), _dec11 = poseGraphNodeHide(), _dec12 = poseGraphNodeAppearance({
        inline: true,
        themeColor: '#D97721'
      }), _dec10(_class6 = _dec11(_class6 = _dec12(_class6 = class PVNodeGetVariableVec3 extends PVNodeGetVariableBase {
        constructor() {
          super(PoseGraphType.VEC3);
        }
        selfEvaluateDefaultOutput() {
          var _this$_varInstance4;
          return (_this$_varInstance4 = this._varInstance) == null ? void 0 : _this$_varInstance4.value; // TODO
        }
      }) || _class6) || _class6) || _class6));
      _export("PVNodeGetVariableQuat", PVNodeGetVariableQuat = (_dec13 = ccclass(`${CLASS_NAME_PREFIX_ANIM}PVNodeGetVariableQuat`), _dec14 = poseGraphNodeHide(), _dec15 = poseGraphNodeAppearance({
        inline: true,
        themeColor: '#B169C4'
      }), _dec13(_class7 = _dec14(_class7 = _dec15(_class7 = class PVNodeGetVariableQuat extends PVNodeGetVariableBase {
        constructor() {
          super(PoseGraphType.QUAT);
        }
        selfEvaluateDefaultOutput() {
          var _this$_varInstance5;
          return (_this$_varInstance5 = this._varInstance) == null ? void 0 : _this$_varInstance5.value; // TODO
        }
      }) || _class7) || _class7) || _class7));
    }
  };
});