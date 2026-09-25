System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/authoring/input-authoring.js", ["../../../../../core/index.js", "../type-system.js", "../errors.js"], function (_export, _context) {
  "use strict";

  var Quat, Vec3, assertIsTrue, js, PoseGraphType, OperationOnFreestandingNodeError, PoseGraphNodeInputManager, globalPoseGraphNodeInputManager;
  function insertPoseGraphNodeArrayElement(graph, node, inputKey, value) {
    const shell = graph.getShell(node);
    if (!shell) {
      throw new OperationOnFreestandingNodeError(node);
    }
    const [propertyKey, elementIndex = -1] = inputKey;
    const property = node[propertyKey];
    if (!Array.isArray(property)) {
      return;
    }

    // Insert the element itself.
    property.splice(elementIndex, 0, value);

    // Update bindings for following elements.
    shell.moveArrayElementBindingForward(propertyKey, elementIndex + 1, false);
  }
  function deletePoseGraphNodeArrayElement(graph, node, inputKey) {
    const shell = graph.getShell(node);
    if (!shell) {
      throw new OperationOnFreestandingNodeError(node);
    }
    const [propertyKey, elementIndex = -1] = inputKey;
    const property = node[propertyKey];
    if (!Array.isArray(property)) {
      return;
    }
    if (elementIndex < 0 || elementIndex >= property.length) {
      return;
    }

    // Delete the binding.
    shell.deleteBinding(inputKey);

    // Delete the element itself.
    property.splice(elementIndex, 1);

    // Update bindings for following elements.
    shell.moveArrayElementBindingForward(propertyKey, elementIndex + 1, true);
  }
  function createDefaultInputValueByType(type) {
    switch (type) {
      default:
        assertIsTrue(false);
      // fallthrough
      case PoseGraphType.FLOAT:
      case PoseGraphType.INTEGER:
        return 0;
      case PoseGraphType.BOOLEAN:
        return false;
      case PoseGraphType.POSE:
        return null;
      case PoseGraphType.VEC3:
        return new Vec3();
      case PoseGraphType.QUAT:
        return new Quat();
    }
  }
  return {
    setters: [function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      js = _coreIndexJs.js;
    }, function (_typeSystemJs) {
      PoseGraphType = _typeSystemJs.PoseGraphType;
    }, function (_errorsJs) {
      OperationOnFreestandingNodeError = _errorsJs.OperationOnFreestandingNodeError;
    }],
    execute: function () {
      // eslint-disable-next-line @typescript-eslint/ban-types
      /**
       * @zh 描述一个姿势图结点类属性在映射为结点输入时的选项。
       * @en Describes the options used
       * when a pose node class property is going to be mapped as node input(s).
       */
      // eslint-disable-next-line @typescript-eslint/ban-types
      PoseGraphNodeInputManager = class PoseGraphNodeInputManager {
        constructor() {
          this._classInputMap = new WeakMap();
        }
        setPropertyNodeInputRecord(constructor, propertyKey, options) {
          let classInputRecord = this._classInputMap.get(constructor);
          if (!classInputRecord) {
            classInputRecord = {
              properties: {}
            };
            this._classInputMap.set(constructor, classInputRecord);
          }
          const {
            arraySyncGroup,
            ...unchanged
          } = options;
          const record = unchanged;
          const arraySyncGroupName = options.arraySyncGroup;
          if (arraySyncGroupName) {
            var _classInputRecord$arr, _classInputRecord$arr2;
            if (!classInputRecord.arraySyncGroups) {
              classInputRecord.arraySyncGroups = {};
            }
            const group = (_classInputRecord$arr2 = (_classInputRecord$arr = classInputRecord.arraySyncGroups)[arraySyncGroupName]) != null ? _classInputRecord$arr2 : _classInputRecord$arr[arraySyncGroupName] = {
              members: []
            };
            if (!group.members.includes(propertyKey)) {
              group.members.push(propertyKey);
            }
            record.arraySyncGroup = group;
          }
          classInputRecord.properties[propertyKey] = Object.freeze(record);
        }
        getInputKeys(object) {
          const result = [];
          const getInputKeysRecurse = constructor => {
            if (!constructor) {
              return;
            }
            getInputKeysRecurse(js.getSuper(constructor));
            const record = this._classInputMap.get(constructor);
            if (!record) {
              return;
            }
            for (const [propertyKey] of Object.entries(record.properties)) {
              // Subclass's input mapping declaration overrides base's.
              if (result.findIndex(([subClassPropertyKey]) => propertyKey === subClassPropertyKey) >= 0) {
                continue;
              }
              const field = object[propertyKey];
              if (Array.isArray(field)) {
                for (let iElement = 0; iElement < field.length; ++iElement) {
                  result.push([propertyKey, iElement]);
                }
              } else {
                result.push([propertyKey]);
              }
            }
          };
          getInputKeysRecurse(object.constructor);
          return result;
        }
        isPoseInput(object, key) {
          const [propertyKey] = key;
          const propertyInputRecord = this._getPropertyNodeInputRecord(object.constructor, propertyKey);
          if (!propertyInputRecord) {
            return false;
          }
          return propertyInputRecord.type === PoseGraphType.POSE;
        }
        getInputMetadata(object, key) {
          const [propertyKey, elementIndex = -1] = key;
          const propertyInputRecord = this._getPropertyNodeInputRecord(object.constructor, propertyKey);
          if (!propertyInputRecord) {
            return undefined;
          }
          const field = object[propertyKey];
          if (Array.isArray(field)) {
            if (elementIndex < 0 || elementIndex >= field.length) {
              return undefined;
            } else {
              var _propertyInputRecord$, _propertyInputRecord$2;
              const displayName = (_propertyInputRecord$ = (_propertyInputRecord$2 = propertyInputRecord.getArrayElementDisplayName) == null ? void 0 : _propertyInputRecord$2.call(object, elementIndex)) != null ? _propertyInputRecord$ : propertyInputRecord.displayName;
              return {
                type: propertyInputRecord.type,
                displayName,
                deletable: !(propertyInputRecord.arraySyncGroup && propertyInputRecord.arraySyncGroupFollower),
                insertPoint: true
              };
            }
          }
          return {
            type: propertyInputRecord.type,
            displayName: propertyInputRecord.displayName
          };
        }
        hasInput(object, key) {
          const [propertyKey, elementIndex = -1] = key;
          const record = this._getPropertyNodeInputRecord(object.constructor, propertyKey);
          if (!record) {
            return false;
          }
          const field = object[propertyKey];
          if (Array.isArray(field)) {
            if (elementIndex < 0 || elementIndex >= field.length) {
              return false;
            }
          }
          return true;
        }
        getInputInsertInfos(object) {
          const result = {};
          for (let constructor = object.constructor; constructor; constructor = js.getSuper(constructor)) {
            const classInputRecord = this._classInputMap.get(constructor);
            if (!classInputRecord) {
              continue;
            }
            for (const propertyKey in classInputRecord.properties) {
              const propertyInputRecord = classInputRecord.properties[propertyKey];
              const property = object[propertyKey];
              if (Array.isArray(property)) {
                // Array sync group followers are not insert-able.
                if (propertyInputRecord.arraySyncGroup && propertyInputRecord.arraySyncGroupFollower) {
                  continue;
                }
                result[propertyKey] = {
                  displayName: propertyKey
                };
              }
            }
          }
          return result;
        }
        deleteInput(graph, node, key) {
          const [propertyKey, elementIndex = -1] = key;
          const propertyInputRecord = this._getPropertyNodeInputRecord(node.constructor, propertyKey);
          if (!propertyInputRecord) {
            return;
          }
          const property = node[propertyKey];
          if (!Array.isArray(property)) {
            return;
          }
          if (elementIndex < 0 || elementIndex >= property.length) {
            return;
          }

          // If it's an array record and belongs to a sync group,
          // Perform the deletion on all group members.
          // > Note: currently we can only insert input to array.
          // eslint-disable-next-line no-constant-condition
          if (true) {
            const {
              arraySyncGroup
            } = propertyInputRecord;
            if (arraySyncGroup) {
              this._deleteInputInArraySyncGroup(graph, node, arraySyncGroup, property.length, elementIndex);
              return;
            }
          }
          deletePoseGraphNodeArrayElement(graph, node, key);
        }
        insertInput(graph, node, insertId) {
          const propertyKey = insertId;
          const propertyInputRecord = this._getPropertyNodeInputRecord(node.constructor, propertyKey);
          if (!propertyInputRecord) {
            return;
          }
          const property = node[propertyKey];
          if (!Array.isArray(property)) {
            return;
          }
          const hint = property.length; // Always insert from back.

          // If it's an array record and belongs to a sync group,
          // Perform the insertion on all group members.
          // > Note: currently we can only insert input to array.
          // eslint-disable-next-line no-constant-condition
          if (true) {
            const {
              arraySyncGroup
            } = propertyInputRecord;
            if (arraySyncGroup) {
              this._insertInputInArraySyncGroup(graph, node, arraySyncGroup, property.length, hint);
              return;
            }
          }
          insertPoseGraphNodeArrayElement(graph, node, [propertyKey, hint], createDefaultInputValueByType(propertyInputRecord.type));
        }
        _getPropertyNodeInputRecord(constructor, propertyKey) {
          if (!constructor) {
            return undefined;
          }
          const classInputRecord = this._classInputMap.get(constructor);
          if (classInputRecord) {
            const record = classInputRecord.properties[propertyKey];
            if (record) {
              return record;
            }
          }
          return this._getPropertyNodeInputRecord(js.getSuper(constructor), propertyKey);
        }
        _insertInputInArraySyncGroup(graph, node, syncGroup, expectedOriginalSyncLength, insertHint) {
          for (let iGroupMember = 0; iGroupMember < syncGroup.members.length; ++iGroupMember) {
            const syncedPropertyKey = syncGroup.members[iGroupMember];
            const syncedPropertyInputRecord = this._getPropertyNodeInputRecord(node.constructor, syncedPropertyKey);
            assertIsTrue(syncedPropertyInputRecord);
            const syncedProperty = node[syncedPropertyKey];
            if (!Array.isArray(syncedProperty) || syncedProperty.length !== expectedOriginalSyncLength) {
              // The property is declared with a "syncWith",
              // but the sync target property is not an array or does not have a matched length.
              // To avoid un-expectations, interrupt.
              continue;
            }
            insertPoseGraphNodeArrayElement(graph, node, [syncedPropertyKey, insertHint], createDefaultInputValueByType(syncedPropertyInputRecord.type));
          }
        }
        _deleteInputInArraySyncGroup(graph, node, syncGroup, expectedOriginalSyncLength, index) {
          for (let iGroupMember = 0; iGroupMember < syncGroup.members.length; ++iGroupMember) {
            const syncedPropertyKey = syncGroup.members[iGroupMember];
            const syncedPropertyInputRecord = this._getPropertyNodeInputRecord(node.constructor, syncedPropertyKey);
            assertIsTrue(syncedPropertyInputRecord);
            const syncedProperty = node[syncedPropertyKey];
            if (!Array.isArray(syncedProperty) || syncedProperty.length !== expectedOriginalSyncLength) {
              // The property is declared with a "syncWith",
              // but the sync target property is not an array or does not have a matched length.
              // To avoid un-expectations, interrupt.
              continue;
            }
            deletePoseGraphNodeArrayElement(graph, node, [syncedPropertyKey, index]);
          }
        }
      };
      _export("globalPoseGraphNodeInputManager", globalPoseGraphNodeInputManager = new PoseGraphNodeInputManager());
    }
  };
});