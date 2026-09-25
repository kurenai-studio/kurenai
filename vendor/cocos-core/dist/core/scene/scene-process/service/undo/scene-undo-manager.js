"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneUndoManager = void 0;
const undo_command_1 = require("./undo-command");
const composite_command_1 = require("./commands/composite-command");
const snapshot_command_1 = require("./commands/snapshot-command");
const dump_util_1 = require("./dump-util");
const command_utils_shared_1 = require("./commands/command-utils-shared");
class SceneUndoManager {
    _commandArray = [];
    _index = -1;
    _lastSavedCommandId = null;
    _checkpointGeneration = 0;
    _autoCommands = [];
    _manualCommands = [];
    _snapshotRecordings = new Map();
    _activeRecordingUuidCounts = new Map();
    _activeGroup = null;
    _queue = Promise.resolve();
    _isApplying = false;
    _maxStackSize;
    _snapshotAdapter;
    constructor(options = {}) {
        this._maxStackSize = options.maxStackSize ?? 100;
        this._snapshotAdapter = options.snapshotAdapter;
    }
    push(command) {
        if (this._activeGroup) {
            this._activeGroup.children.push(command);
            return;
        }
        this._pushToStack(command);
    }
    pushWithPrevious(command, options) {
        if (this._activeGroup) {
            this._activeGroup.children.push(command);
            return;
        }
        if (this._index !== this._commandArray.length - 1) {
            this._pushToStack(command);
            return;
        }
        const previousCommands = [];
        let previousIndex = this._index;
        while (previousIndex >= 0) {
            const previous = this._commandArray[previousIndex];
            if (!previous || !matchesUndoScope(previous.meta.scope, options.previousScope) || !matchesUndoType(previous.meta.type, options.previousTypes)) {
                break;
            }
            previousCommands.unshift(previous);
            previousIndex--;
        }
        if (previousCommands.length === 0) {
            this._pushToStack(command);
            return;
        }
        this._commandArray.splice(previousIndex + 1, previousCommands.length);
        this._index = previousIndex;
        this._pushToStack(new composite_command_1.CompositeCommand({
            id: this._createId(options.type),
            label: options.label ?? command.meta.label,
            type: options.type,
            scope: options.scope,
            timestamp: Date.now(),
        }, [...previousCommands, command]));
    }
    async undo(options) {
        return this._enqueue(async () => {
            if (this._index === -1) {
                return { success: false, reason: 'Cannot undo' };
            }
            const command = this._commandArray[this._index];
            if (!command) {
                return { success: false, reason: 'Cannot undo' };
            }
            if (!matchesUndoScope(command.meta.scope, options?.scope)) {
                return { success: false, reason: 'Cannot undo' };
            }
            const result = await this._applyCommand(command, 'undo');
            if (result.success) {
                this._index--;
            }
            return result;
        });
    }
    async redo(options) {
        return this._enqueue(async () => {
            if (this._index >= this._commandArray.length - 1) {
                return { success: false, reason: 'Cannot redo' };
            }
            const command = this._commandArray[this._index + 1];
            if (!command) {
                return { success: false, reason: 'Cannot redo' };
            }
            if (!matchesUndoScope(command.meta.scope, options?.scope)) {
                return { success: false, reason: 'Cannot redo' };
            }
            const result = await this._applyCommand(command, 'redo');
            if (result.success) {
                this._index++;
            }
            return result;
        });
    }
    reset() {
        this._commandArray.length = 0;
        this._index = -1;
        this._lastSavedCommandId = null;
        this._checkpointGeneration++;
        this._autoCommands.length = 0;
        this._manualCommands.length = 0;
        this._snapshotRecordings.clear();
        this._activeRecordingUuidCounts.clear();
        this._activeGroup = null;
    }
    // reset 的对外别名（IUndoService 同时暴露 reset/clearHistory）。
    clearHistory() {
        this.reset();
    }
    markSaved() {
        this._lastSavedCommandId = this._currentCommandId();
    }
    isDirty() {
        return this._lastSavedCommandId !== this._currentCommandId();
    }
    createCheckpoint() {
        return { commandId: this._currentCommandId(), generation: this._checkpointGeneration };
    }
    hasScopedDifference(checkpoint, scope) {
        return this._hasDifferenceSince(checkpoint, command => matchesUndoScope(command.meta.scope, scope));
    }
    hasScopedDifferenceAfterCheckpoint(checkpoint, scope) {
        if (checkpoint.generation !== this._checkpointGeneration) {
            return false;
        }
        const checkpointIndex = this._resolveCheckpointIndex(checkpoint);
        if (checkpointIndex === undefined || this._index <= checkpointIndex) {
            return false;
        }
        for (let index = checkpointIndex + 1; index <= this._index; index++) {
            const command = this._commandArray[index];
            if (command && matchesUndoScope(command.meta.scope, scope)) {
                return true;
            }
        }
        return false;
    }
    async discardScopedChangesAfterCheckpoint(checkpoint, scope) {
        return this._enqueue(async () => {
            if (checkpoint.generation !== this._checkpointGeneration) {
                return { success: true };
            }
            const checkpointIndex = this._resolveCheckpointIndex(checkpoint);
            const originalIndex = this._index;
            if (checkpointIndex === undefined || originalIndex <= checkpointIndex) {
                return { success: true };
            }
            const originalCommands = [...this._commandArray];
            const appliedCommands = originalCommands.slice(checkpointIndex + 1, originalIndex + 1);
            const discardedCommands = appliedCommands.filter(command => matchesUndoScope(command.meta.scope, scope));
            if (discardedCommands.length === 0) {
                return { success: true };
            }
            const restoreCommands = async (commands, direction) => {
                for (const command of commands) {
                    const result = await this._applyCommand(command, direction);
                    if (!result.success) {
                        return result;
                    }
                }
                return { success: true };
            };
            const undoneCommands = [];
            for (let index = originalIndex; index > checkpointIndex; index--) {
                const command = originalCommands[index];
                if (!command) {
                    continue;
                }
                const result = await this._applyCommand(command, 'undo');
                if (!result.success) {
                    for (const undoneCommand of [...undoneCommands].reverse()) {
                        const restoreResult = await this._applyCommand(undoneCommand, 'redo');
                        if (restoreResult.success) {
                            this._index++;
                        }
                    }
                    return result;
                }
                undoneCommands.push(command);
                this._index--;
            }
            const keptCommands = appliedCommands.filter(command => !matchesUndoScope(command.meta.scope, scope));
            this._commandArray.splice(checkpointIndex + 1, appliedCommands.length, ...keptCommands);
            this._index = checkpointIndex;
            const redoneCommands = [];
            for (const command of keptCommands) {
                const result = await this._applyCommand(command, 'redo');
                if (!result.success) {
                    await restoreCommands([...redoneCommands].reverse(), 'undo');
                    this._commandArray.splice(0, this._commandArray.length, ...originalCommands);
                    this._index = checkpointIndex;
                    await restoreCommands(appliedCommands, 'redo');
                    this._index = originalIndex;
                    return result;
                }
                redoneCommands.push(command);
                this._index++;
            }
            return { success: true };
        });
    }
    hasDifferenceOutsideScope(checkpoint, scope) {
        return this._hasDifferenceSince(checkpoint, command => !matchesUndoScope(command.meta.scope, scope));
    }
    canUndo(options) {
        return this._index >= 0 && this._commandMatchesAt(this._index, options?.scope);
    }
    canRedo(options) {
        return this._index < this._commandArray.length - 1 && this._commandMatchesAt(this._index + 1, options?.scope);
    }
    isApplying() {
        return this._isApplying;
    }
    beginGroup(options = {}) {
        if (this._activeGroup) {
            throw new Error('Undo group is already active');
        }
        const id = this._createId('group');
        this._activeGroup = {
            id,
            label: options.label ?? 'Group',
            children: [],
        };
        return id;
    }
    endGroup(groupId) {
        if (!this._activeGroup || this._activeGroup.id !== groupId) {
            return { success: false, reason: 'Undo group not found' };
        }
        const group = this._activeGroup;
        this._activeGroup = null;
        if (group.children.length === 0) {
            return { success: true, commandId: group.id, label: group.label };
        }
        this._pushToStack(new composite_command_1.CompositeCommand({
            id: group.id,
            label: group.label,
            type: 'group:composite',
            scope: {},
            timestamp: Date.now(),
        }, group.children));
        return { success: true, commandId: group.id, label: group.label };
    }
    cancelGroup(groupId) {
        if (!this._activeGroup || this._activeGroup.id !== groupId) {
            return { success: false, reason: 'Undo group not found' };
        }
        const label = this._activeGroup.label;
        this._activeGroup = null;
        return { success: true, commandId: groupId, label };
    }
    isGroupActive() {
        return this._activeGroup !== null;
    }
    getHistoryForTesting() {
        return [...this._commandArray];
    }
    _commandMatchesAt(index, scope) {
        const command = this._commandArray[index];
        return Boolean(command && matchesUndoScope(command.meta.scope, scope));
    }
    hasActiveRecording(uuid) {
        if (uuid === undefined) {
            return this._snapshotRecordings.size > 0 || this._autoCommands.length > 0 || this._manualCommands.length > 0;
        }
        return this._activeRecordingUuidCounts.has(uuid);
    }
    beginRecording(uuids, option) {
        const uuidList = Array.isArray(uuids) ? uuids : [uuids];
        const uuidSet = new Set(uuidList);
        option = option ?? { auto: false };
        if (option.customCommand) {
            const command = this._createCommand(option);
            for (const uuid of uuidSet.values()) {
                command.uuids.push(uuid);
            }
            this._addActiveRecordingUuids(uuidSet);
            return command.id;
        }
        if (this._snapshotAdapter) {
            const id = this._createId(option.label ?? option.tag ?? 'recording');
            this._snapshotRecordings.set(id, {
                id,
                label: option.label ?? option.tag ?? id,
                scope: option.scope ?? {},
                uuids: [...uuidSet],
                before: this._snapshotAdapter.capture([...uuidSet]),
            });
            this._addActiveRecordingUuids(uuidSet);
            return id;
        }
        const command = this._createCommand(option);
        for (const uuid of uuidSet.values()) {
            command.uuids.push(uuid);
            if (!command.custom) {
                this._setUndo(command, uuid);
            }
        }
        this._addActiveRecordingUuids(uuidSet);
        return command.id;
    }
    async endRecording(id) {
        if (this._snapshotAdapter && this._snapshotRecordings.has(id)) {
            const recording = this._snapshotRecordings.get(id);
            try {
                const before = isPromiseLike(recording.before) ? await recording.before : recording.before;
                const capturedAfter = this._snapshotAdapter.capture(recording.uuids);
                const after = isPromiseLike(capturedAfter) ? await capturedAfter : capturedAfter;
                if (this._snapshotAdapter.equals(before, after)) {
                    return false;
                }
                this.push(new snapshot_command_1.SnapshotCommand({
                    id,
                    label: recording.label,
                    type: 'recording:snapshot',
                    scope: recording.scope,
                    timestamp: Date.now(),
                }, before, after, this._snapshotAdapter));
                return true;
            }
            finally {
                this._snapshotRecordings.delete(id);
                this._removeActiveRecordingUuids(recording.uuids);
            }
        }
        const command = this._autoCommands.find(t => t.id === id) ??
            this._manualCommands.find(t => t.id === id);
        if (!command)
            return false;
        if (this._commandArray.indexOf(command) !== -1) {
            console.warn('[Undo] command already exists', command.tag);
            this._removeCommand(this._autoCommands, id);
            this._removeCommand(this._manualCommands, id);
            this._removeActiveRecordingUuids(command.uuids);
            return false;
        }
        if (!command.custom) {
            command.uuids.forEach(uuid => {
                this._setRedo(command, uuid);
            });
        }
        this.push(command);
        const autoIndex = this._autoCommands.indexOf(command);
        if (autoIndex !== -1) {
            this._autoCommands.splice(autoIndex, 1);
        }
        const manualIndex = this._manualCommands.indexOf(command);
        if (manualIndex !== -1) {
            this._manualCommands.splice(manualIndex, 1);
        }
        this._removeActiveRecordingUuids(command.uuids);
        return true;
    }
    cancelRecording(id) {
        const snapshotRecording = this._snapshotRecordings.get(id);
        if (snapshotRecording) {
            this._snapshotRecordings.delete(id);
            this._removeActiveRecordingUuids(snapshotRecording.uuids);
            return true;
        }
        let removed = this._removeCommand(this._autoCommands, id);
        if (removed) {
            this._removeActiveRecordingUuids(removed.uuids);
            return true;
        }
        removed = this._removeCommand(this._manualCommands, id);
        if (removed) {
            this._removeActiveRecordingUuids(removed.uuids);
            return true;
        }
        return false;
    }
    _pushToStack(command) {
        if (this._index !== this._commandArray.length - 1) {
            this._commandArray.splice(this._index + 1);
        }
        this._commandArray.push(command);
        this._index = this._commandArray.length - 1;
        this._trimToMaxStackSize();
    }
    _trimToMaxStackSize() {
        const overflow = this._commandArray.length - this._maxStackSize;
        if (overflow <= 0) {
            return;
        }
        const removed = this._commandArray.splice(0, overflow);
        this._index = Math.max(-1, this._index - overflow);
        if (this._lastSavedCommandId && removed.some(command => command.meta.id === this._lastSavedCommandId)) {
            this._lastSavedCommandId = null;
        }
    }
    async _applyCommand(command, direction) {
        this._isApplying = true;
        try {
            return await command[direction]();
        }
        catch (e) {
            return {
                success: false,
                commandId: command.meta.id,
                label: command.meta.label,
                reason: e instanceof Error ? e.message : String(e),
            };
        }
        finally {
            this._isApplying = false;
        }
    }
    _enqueue(task) {
        const next = this._queue.then(task, task);
        this._queue = next.catch(() => undefined);
        return next;
    }
    _currentCommandId() {
        return this._index === -1 ? null : this._commandArray[this._index]?.meta.id ?? null;
    }
    _hasDifferenceSince(checkpoint, matches) {
        if (checkpoint.generation !== this._checkpointGeneration) {
            return false;
        }
        const checkpointIndex = this._resolveCheckpointIndex(checkpoint);
        if (checkpointIndex === undefined) {
            return this._currentCommandId() !== checkpoint.commandId;
        }
        if (checkpointIndex === this._index) {
            return false;
        }
        const start = Math.min(checkpointIndex, this._index) + 1;
        const end = Math.max(checkpointIndex, this._index);
        for (let i = start; i <= end; i++) {
            const command = this._commandArray[i];
            if (command && matches(command)) {
                return true;
            }
        }
        return false;
    }
    _resolveCheckpointIndex(checkpoint) {
        if (checkpoint.commandId === null) {
            return -1;
        }
        const index = this._commandArray.findIndex(command => command.meta.id === checkpoint.commandId);
        return index === -1 ? undefined : index;
    }
    // 降级路径：仅在未注入 snapshotAdapter 时使用（主要是单测）。
    // 运行时 UndoService 始终注入 adapter，beginRecording/endRecording 走 snapshot 分支，不会到这里。
    _createCommand(option) {
        let command;
        if (option.customCommand) {
            if (option.customCommand instanceof undo_command_1.SceneUndoCommand) {
                command = option.customCommand;
            }
            else {
                const customCommand = option.customCommand;
                command = new undo_command_1.SceneUndoCommand();
                command.undo = () => customCommand.undo();
                command.redo = () => customCommand.redo();
            }
            command.custom = true;
        }
        else {
            command = new undo_command_1.SceneUndoCommand();
        }
        const label = option.label ?? option.tag ?? '';
        if (label !== '')
            command.tag = label;
        if (option.auto !== undefined)
            command.auto = option.auto;
        if (command.auto !== false) {
            this._autoCommands.push(command);
        }
        else {
            this._manualCommands.push(command);
        }
        const id = this._createId(command.tag || 'cmd');
        command.id = id;
        command.meta = {
            id,
            label: command.tag || id,
            type: command.custom ? 'custom' : 'recording:snapshot',
            scope: option.scope ?? {},
            timestamp: Date.now(),
        };
        return command;
    }
    _createId(prefix) {
        return (0, command_utils_shared_1.createUndoId)(prefix);
    }
    _setUndo(command, uuid) {
        const EditorExtends = cc.EditorExtends;
        if (!EditorExtends)
            return;
        try {
            const node = EditorExtends.Node.getNode(uuid);
            if (node) {
                command.undoData.set(uuid, (0, dump_util_1.getDumpUtil)().dumpNode(node));
                return;
            }
            const comp = EditorExtends.Component?.getComponent(uuid);
            if (comp) {
                command.undoData.set(uuid, (0, dump_util_1.getDumpUtil)().dumpComponent(comp));
            }
        }
        catch (e) {
            console.error('[Undo] _setUndo error:', e);
        }
    }
    _setRedo(command, uuid) {
        const EditorExtends = cc.EditorExtends;
        if (!EditorExtends)
            return;
        try {
            const node = EditorExtends.Node.getNode(uuid);
            if (node) {
                command.redoData.set(uuid, (0, dump_util_1.getDumpUtil)().dumpNode(node));
                return;
            }
            const comp = EditorExtends.Component?.getComponent(uuid);
            if (comp) {
                command.redoData.set(uuid, (0, dump_util_1.getDumpUtil)().dumpComponent(comp));
            }
        }
        catch (e) {
            console.error('[Undo] _setRedo error:', e);
        }
    }
    _addActiveRecordingUuids(uuids) {
        for (const uuid of uuids) {
            this._activeRecordingUuidCounts.set(uuid, (this._activeRecordingUuidCounts.get(uuid) ?? 0) + 1);
        }
    }
    _removeActiveRecordingUuids(uuids) {
        for (const uuid of uuids) {
            const count = this._activeRecordingUuidCounts.get(uuid);
            if (!count) {
                continue;
            }
            if (count === 1) {
                this._activeRecordingUuidCounts.delete(uuid);
            }
            else {
                this._activeRecordingUuidCounts.set(uuid, count - 1);
            }
        }
    }
    _removeCommand(list, id) {
        const index = list.findIndex(t => t.id === id);
        if (index !== -1) {
            const [command] = list.splice(index, 1);
            return command ?? null;
        }
        return null;
    }
}
exports.SceneUndoManager = SceneUndoManager;
function isPromiseLike(value) {
    return !!value && typeof value.then === 'function';
}
function matchesUndoScope(commandScope, expectedScope) {
    if (!expectedScope) {
        return true;
    }
    for (const [key, value] of Object.entries(expectedScope)) {
        if (value !== undefined && commandScope[key] !== value) {
            return false;
        }
    }
    return true;
}
function matchesUndoType(commandType, expectedTypes) {
    return !expectedTypes || expectedTypes.includes(commandType);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdW5kby1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3VuZG8vc2NlbmUtdW5kby1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlEQUFzRTtBQUN0RSxvRUFBZ0U7QUFDaEUsa0VBQWdGO0FBQ2hGLDJDQUEwQztBQUMxQywwRUFBK0Q7QUE2Qi9ELE1BQU0sZ0JBQWdCO0lBQ1YsYUFBYSxHQUFtQixFQUFFLENBQUM7SUFDbkMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ1osbUJBQW1CLEdBQWtCLElBQUksQ0FBQztJQUMxQyxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDMUIsYUFBYSxHQUF1QixFQUFFLENBQUM7SUFDdkMsZUFBZSxHQUF1QixFQUFFLENBQUM7SUFDekMsbUJBQW1CLEdBQTBDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdkUsMEJBQTBCLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDNUQsWUFBWSxHQUF3QixJQUFJLENBQUM7SUFDekMsTUFBTSxHQUFxQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0MsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUNYLGFBQWEsQ0FBUztJQUN0QixnQkFBZ0IsQ0FBb0I7SUFFckQsWUFBWSxVQUFvQyxFQUFFO1FBQzlDLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUM7UUFDakQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7SUFDcEQsQ0FBQztJQUVELElBQUksQ0FBQyxPQUFxQjtRQUN0QixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekMs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O0FBRUQsU0FBUyxlQUFlLENBQUMsV0FBbUIsRUFBRSxhQUF3QjtJQUNsRSxPQUFPLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDakUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSVVuZG9DaGVja3BvaW50LCBJVW5kb0NvbW1hbmQsIElVbmRvR3JvdXBPcHRpb25zLCBJVW5kb09wZXJhdGlvbk9wdGlvbnMsIElVbmRvUHVzaFdpdGhQcmV2aW91c09wdGlvbnMsIElVbmRvUmVkb1Jlc3VsdCwgSVVuZG9TY29wZSB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBTY2VuZVVuZG9Db21tYW5kLCBTY2VuZVVuZG9Db21tYW5kSUQgfSBmcm9tICcuL3VuZG8tY29tbWFuZCc7XG5pbXBvcnQgeyBDb21wb3NpdGVDb21tYW5kIH0gZnJvbSAnLi9jb21tYW5kcy9jb21wb3NpdGUtY29tbWFuZCc7XG5pbXBvcnQgeyBJU25hcHNob3RBZGFwdGVyLCBTbmFwc2hvdENvbW1hbmQgfSBmcm9tICcuL2NvbW1hbmRzL3NuYXBzaG90LWNvbW1hbmQnO1xuaW1wb3J0IHsgZ2V0RHVtcFV0aWwgfSBmcm9tICcuL2R1bXAtdXRpbCc7XG5pbXBvcnQgeyBjcmVhdGVVbmRvSWQgfSBmcm9tICcuL2NvbW1hbmRzL2NvbW1hbmQtdXRpbHMtc2hhcmVkJztcblxuaW50ZXJmYWNlIElTY2VuZVVuZG9PcHRpb24ge1xuICAgIGxhYmVsPzogc3RyaW5nO1xuICAgIHRhZz86IHN0cmluZztcbiAgICBhdXRvPzogYm9vbGVhbjtcbiAgICBzY29wZT86IElVbmRvU2NvcGU7XG4gICAgY3VzdG9tQ29tbWFuZD86IElVbmRvQ29tbWFuZDtcbn1cblxuaW50ZXJmYWNlIElTY2VuZVVuZG9NYW5hZ2VyT3B0aW9ucyB7XG4gICAgbWF4U3RhY2tTaXplPzogbnVtYmVyO1xuICAgIHNuYXBzaG90QWRhcHRlcj86IElTbmFwc2hvdEFkYXB0ZXI7XG59XG5cbmludGVyZmFjZSBJQWN0aXZlR3JvdXAge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgbGFiZWw6IHN0cmluZztcbiAgICBjaGlsZHJlbjogSVVuZG9Db21tYW5kW107XG59XG5cbmludGVyZmFjZSBJQWN0aXZlU25hcHNob3RSZWNvcmRpbmcge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgbGFiZWw6IHN0cmluZztcbiAgICBzY29wZTogSVVuZG9TY29wZTtcbiAgICB1dWlkczogc3RyaW5nW107XG4gICAgYmVmb3JlOiBNYXA8c3RyaW5nLCBhbnk+IHwgUHJvbWlzZTxNYXA8c3RyaW5nLCBhbnk+Pjtcbn1cblxuY2xhc3MgU2NlbmVVbmRvTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBfY29tbWFuZEFycmF5OiBJVW5kb0NvbW1hbmRbXSA9IFtdO1xuICAgIHByaXZhdGUgX2luZGV4ID0gLTE7XG4gICAgcHJpdmF0ZSBfbGFzdFNhdmVkQ29tbWFuZElkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9jaGVja3BvaW50R2VuZXJhdGlvbiA9IDA7XG4gICAgcHJpdmF0ZSBfYXV0b0NvbW1hbmRzOiBTY2VuZVVuZG9Db21tYW5kW10gPSBbXTtcbiAgICBwcml2YXRlIF9tYW51YWxDb21tYW5kczogU2NlbmVVbmRvQ29tbWFuZFtdID0gW107XG4gICAgcHJpdmF0ZSBfc25hcHNob3RSZWNvcmRpbmdzOiBNYXA8c3RyaW5nLCBJQWN0aXZlU25hcHNob3RSZWNvcmRpbmc+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgX2FjdGl2ZVJlY29yZGluZ1V1aWRDb3VudHM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBfYWN0aXZlR3JvdXA6IElBY3RpdmVHcm91cCB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX3F1ZXVlOiBQcm9taXNlPHVua25vd24+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgcHJpdmF0ZSBfaXNBcHBseWluZyA9IGZhbHNlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX21heFN0YWNrU2l6ZTogbnVtYmVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3NuYXBzaG90QWRhcHRlcj86IElTbmFwc2hvdEFkYXB0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJU2NlbmVVbmRvTWFuYWdlck9wdGlvbnMgPSB7fSkge1xuICAgICAgICB0aGlzLl9tYXhTdGFja1NpemUgPSBvcHRpb25zLm1heFN0YWNrU2l6ZSA/PyAxMDA7XG4gICAgICAgIHRoaXMuX3NuYXBzaG90QWRhcHRlciA9IG9wdGlvbnMuc25hcHNob3RBZGFwdGVyO1xuICAgIH1cblxuICAgIHB1c2goY29tbWFuZDogSVVuZG9Db21tYW5kKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVHcm91cCkge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlR3JvdXAuY2hpbGRyZW4ucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayhjb21tYW5kKTtcbiAgICB9XG5cbiAgICBwdXNoV2l0aFByZXZpb3VzKGNvbW1hbmQ6IElVbmRvQ29tbWFuZCwgb3B0aW9uczogSVVuZG9QdXNoV2l0aFByZXZpb3VzT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlR3JvdXApIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUdyb3VwLmNoaWxkcmVuLnB1c2goY29tbWFuZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faW5kZXggIT09IHRoaXMuX2NvbW1hbmRBcnJheS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayhjb21tYW5kKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByZXZpb3VzQ29tbWFuZHM6IElVbmRvQ29tbWFuZFtdID0gW107XG4gICAgICAgIGxldCBwcmV2aW91c0luZGV4ID0gdGhpcy5faW5kZXg7XG4gICAgICAgIHdoaWxlIChwcmV2aW91c0luZGV4ID49IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5fY29tbWFuZEFycmF5W3ByZXZpb3VzSW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFwcmV2aW91cyB8fCAhbWF0Y2hlc1VuZG9TY29wZShwcmV2aW91cy5tZXRhLnNjb3BlLCBvcHRpb25zLnByZXZpb3VzU2NvcGUpIHx8ICFtYXRjaGVzVW5kb1R5cGUocHJldmlvdXMubWV0YS50eXBlLCBvcHRpb25zLnByZXZpb3VzVHlwZXMpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2aW91c0NvbW1hbmRzLnVuc2hpZnQocHJldmlvdXMpO1xuICAgICAgICAgICAgcHJldmlvdXNJbmRleC0tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZpb3VzQ29tbWFuZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayhjb21tYW5kKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1hbmRBcnJheS5zcGxpY2UocHJldmlvdXNJbmRleCArIDEsIHByZXZpb3VzQ29tbWFuZHMubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5faW5kZXggPSBwcmV2aW91c0luZGV4O1xuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayhuZXcgQ29tcG9zaXRlQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogdGhpcy5fY3JlYXRlSWQob3B0aW9ucy50eXBlKSxcbiAgICAgICAgICAgIGxhYmVsOiBvcHRpb25zLmxhYmVsID8/IGNvbW1hbmQubWV0YS5sYWJlbCxcbiAgICAgICAgICAgIHR5cGU6IG9wdGlvbnMudHlwZSxcbiAgICAgICAgICAgIHNjb3BlOiBvcHRpb25zLnNjb3BlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9LCBbLi4ucHJldmlvdXNDb21tYW5kcywgY29tbWFuZF0pKTtcbiAgICB9XG5cbiAgICBhc3luYyB1bmRvKG9wdGlvbnM/OiBJVW5kb09wZXJhdGlvbk9wdGlvbnMpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogJ0Nhbm5vdCB1bmRvJyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuX2NvbW1hbmRBcnJheVt0aGlzLl9pbmRleF07XG4gICAgICAgICAgICBpZiAoIWNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnQ2Fubm90IHVuZG8nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBvcHRpb25zPy5zY29wZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnQ2Fubm90IHVuZG8nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl9hcHBseUNvbW1hbmQoY29tbWFuZCwgJ3VuZG8nKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZWRvKG9wdGlvbnM/OiBJVW5kb09wZXJhdGlvbk9wdGlvbnMpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPj0gdGhpcy5fY29tbWFuZEFycmF5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnQ2Fubm90IHJlZG8nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5fY29tbWFuZEFycmF5W3RoaXMuX2luZGV4ICsgMV07XG4gICAgICAgICAgICBpZiAoIWNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnQ2Fubm90IHJlZG8nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBvcHRpb25zPy5zY29wZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnQ2Fubm90IHJlZG8nIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl9hcHBseUNvbW1hbmQoY29tbWFuZCwgJ3JlZG8nKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fY29tbWFuZEFycmF5Lmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2xhc3RTYXZlZENvbW1hbmRJZCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NoZWNrcG9pbnRHZW5lcmF0aW9uKys7XG4gICAgICAgIHRoaXMuX2F1dG9Db21tYW5kcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9tYW51YWxDb21tYW5kcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9zbmFwc2hvdFJlY29yZGluZ3MuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlUmVjb3JkaW5nVXVpZENvdW50cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9hY3RpdmVHcm91cCA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gcmVzZXQg55qE5a+55aSW5Yir5ZCN77yISVVuZG9TZXJ2aWNlIOWQjOaXtuaatOmcsiByZXNldC9jbGVhckhpc3RvcnnvvInjgIJcbiAgICBjbGVhckhpc3RvcnkoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG5cbiAgICBtYXJrU2F2ZWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2xhc3RTYXZlZENvbW1hbmRJZCA9IHRoaXMuX2N1cnJlbnRDb21tYW5kSWQoKTtcbiAgICB9XG5cbiAgICBpc0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGFzdFNhdmVkQ29tbWFuZElkICE9PSB0aGlzLl9jdXJyZW50Q29tbWFuZElkKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlQ2hlY2twb2ludCgpOiBJVW5kb0NoZWNrcG9pbnQge1xuICAgICAgICByZXR1cm4geyBjb21tYW5kSWQ6IHRoaXMuX2N1cnJlbnRDb21tYW5kSWQoKSwgZ2VuZXJhdGlvbjogdGhpcy5fY2hlY2twb2ludEdlbmVyYXRpb24gfTtcbiAgICB9XG5cbiAgICBoYXNTY29wZWREaWZmZXJlbmNlKGNoZWNrcG9pbnQ6IElVbmRvQ2hlY2twb2ludCwgc2NvcGU6IFBhcnRpYWw8SVVuZG9TY29wZT4pOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhc0RpZmZlcmVuY2VTaW5jZShjaGVja3BvaW50LCBjb21tYW5kID0+IG1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBzY29wZSkpO1xuICAgIH1cblxuICAgIGhhc1Njb3BlZERpZmZlcmVuY2VBZnRlckNoZWNrcG9pbnQoY2hlY2twb2ludDogSVVuZG9DaGVja3BvaW50LCBzY29wZTogUGFydGlhbDxJVW5kb1Njb3BlPik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoY2hlY2twb2ludC5nZW5lcmF0aW9uICE9PSB0aGlzLl9jaGVja3BvaW50R2VuZXJhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNoZWNrcG9pbnRJbmRleCA9IHRoaXMuX3Jlc29sdmVDaGVja3BvaW50SW5kZXgoY2hlY2twb2ludCk7XG4gICAgICAgIGlmIChjaGVja3BvaW50SW5kZXggPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9pbmRleCA8PSBjaGVja3BvaW50SW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IGNoZWNrcG9pbnRJbmRleCArIDE7IGluZGV4IDw9IHRoaXMuX2luZGV4OyBpbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5fY29tbWFuZEFycmF5W2luZGV4XTtcbiAgICAgICAgICAgIGlmIChjb21tYW5kICYmIG1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBzY29wZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYXN5bmMgZGlzY2FyZFNjb3BlZENoYW5nZXNBZnRlckNoZWNrcG9pbnQoXG4gICAgICAgIGNoZWNrcG9pbnQ6IElVbmRvQ2hlY2twb2ludCxcbiAgICAgICAgc2NvcGU6IFBhcnRpYWw8SVVuZG9TY29wZT4sXG4gICAgKTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNoZWNrcG9pbnQuZ2VuZXJhdGlvbiAhPT0gdGhpcy5fY2hlY2twb2ludEdlbmVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjaGVja3BvaW50SW5kZXggPSB0aGlzLl9yZXNvbHZlQ2hlY2twb2ludEluZGV4KGNoZWNrcG9pbnQpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxJbmRleCA9IHRoaXMuX2luZGV4O1xuICAgICAgICAgICAgaWYgKGNoZWNrcG9pbnRJbmRleCA9PT0gdW5kZWZpbmVkIHx8IG9yaWdpbmFsSW5kZXggPD0gY2hlY2twb2ludEluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbENvbW1hbmRzID0gWy4uLnRoaXMuX2NvbW1hbmRBcnJheV07XG4gICAgICAgICAgICBjb25zdCBhcHBsaWVkQ29tbWFuZHMgPSBvcmlnaW5hbENvbW1hbmRzLnNsaWNlKGNoZWNrcG9pbnRJbmRleCArIDEsIG9yaWdpbmFsSW5kZXggKyAxKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc2NhcmRlZENvbW1hbmRzID0gYXBwbGllZENvbW1hbmRzLmZpbHRlcihjb21tYW5kID0+IG1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBzY29wZSkpO1xuICAgICAgICAgICAgaWYgKGRpc2NhcmRlZENvbW1hbmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcmVzdG9yZUNvbW1hbmRzID0gYXN5bmMgKGNvbW1hbmRzOiBJVW5kb0NvbW1hbmRbXSwgZGlyZWN0aW9uOiAndW5kbycgfCAncmVkbycpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbW1hbmQgb2YgY29tbWFuZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fYXBwbHlDb21tYW5kKGNvbW1hbmQsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgdW5kb25lQ29tbWFuZHM6IElVbmRvQ29tbWFuZFtdID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IG9yaWdpbmFsSW5kZXg7IGluZGV4ID4gY2hlY2twb2ludEluZGV4OyBpbmRleC0tKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IG9yaWdpbmFsQ29tbWFuZHNbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICghY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fYXBwbHlDb21tYW5kKGNvbW1hbmQsICd1bmRvJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHVuZG9uZUNvbW1hbmQgb2YgWy4uLnVuZG9uZUNvbW1hbmRzXS5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3RvcmVSZXN1bHQgPSBhd2FpdCB0aGlzLl9hcHBseUNvbW1hbmQodW5kb25lQ29tbWFuZCwgJ3JlZG8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0b3JlUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVuZG9uZUNvbW1hbmRzLnB1c2goY29tbWFuZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5kZXgtLTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qga2VwdENvbW1hbmRzID0gYXBwbGllZENvbW1hbmRzLmZpbHRlcihjb21tYW5kID0+ICFtYXRjaGVzVW5kb1Njb3BlKGNvbW1hbmQubWV0YS5zY29wZSwgc2NvcGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1hbmRBcnJheS5zcGxpY2UoY2hlY2twb2ludEluZGV4ICsgMSwgYXBwbGllZENvbW1hbmRzLmxlbmd0aCwgLi4ua2VwdENvbW1hbmRzKTtcbiAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gY2hlY2twb2ludEluZGV4O1xuXG4gICAgICAgICAgICBjb25zdCByZWRvbmVDb21tYW5kczogSVVuZG9Db21tYW5kW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tbWFuZCBvZiBrZXB0Q29tbWFuZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl9hcHBseUNvbW1hbmQoY29tbWFuZCwgJ3JlZG8nKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlc3RvcmVDb21tYW5kcyhbLi4ucmVkb25lQ29tbWFuZHNdLnJldmVyc2UoKSwgJ3VuZG8nKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29tbWFuZEFycmF5LnNwbGljZSgwLCB0aGlzLl9jb21tYW5kQXJyYXkubGVuZ3RoLCAuLi5vcmlnaW5hbENvbW1hbmRzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSBjaGVja3BvaW50SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlc3RvcmVDb21tYW5kcyhhcHBsaWVkQ29tbWFuZHMsICdyZWRvJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gb3JpZ2luYWxJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVkb25lQ29tbWFuZHMucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCsrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhc0RpZmZlcmVuY2VPdXRzaWRlU2NvcGUoY2hlY2twb2ludDogSVVuZG9DaGVja3BvaW50LCBzY29wZTogUGFydGlhbDxJVW5kb1Njb3BlPik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFzRGlmZmVyZW5jZVNpbmNlKGNoZWNrcG9pbnQsIGNvbW1hbmQgPT4gIW1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBzY29wZSkpO1xuICAgIH1cblxuICAgIGNhblVuZG8ob3B0aW9ucz86IElVbmRvT3BlcmF0aW9uT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faW5kZXggPj0gMCAmJiB0aGlzLl9jb21tYW5kTWF0Y2hlc0F0KHRoaXMuX2luZGV4LCBvcHRpb25zPy5zY29wZSk7XG4gICAgfVxuXG4gICAgY2FuUmVkbyhvcHRpb25zPzogSVVuZG9PcGVyYXRpb25PcHRpb25zKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbmRleCA8IHRoaXMuX2NvbW1hbmRBcnJheS5sZW5ndGggLSAxICYmIHRoaXMuX2NvbW1hbmRNYXRjaGVzQXQodGhpcy5faW5kZXggKyAxLCBvcHRpb25zPy5zY29wZSk7XG4gICAgfVxuXG4gICAgaXNBcHBseWluZygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQXBwbHlpbmc7XG4gICAgfVxuXG4gICAgYmVnaW5Hcm91cChvcHRpb25zOiBJVW5kb0dyb3VwT3B0aW9ucyA9IHt9KTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZUdyb3VwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZG8gZ3JvdXAgaXMgYWxyZWFkeSBhY3RpdmUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZCA9IHRoaXMuX2NyZWF0ZUlkKCdncm91cCcpO1xuICAgICAgICB0aGlzLl9hY3RpdmVHcm91cCA9IHtcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgbGFiZWw6IG9wdGlvbnMubGFiZWwgPz8gJ0dyb3VwJyxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIGVuZEdyb3VwKGdyb3VwSWQ6IHN0cmluZyk6IElVbmRvUmVkb1Jlc3VsdCB7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZlR3JvdXAgfHwgdGhpcy5fYWN0aXZlR3JvdXAuaWQgIT09IGdyb3VwSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246ICdVbmRvIGdyb3VwIG5vdCBmb3VuZCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fYWN0aXZlR3JvdXA7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUdyb3VwID0gbnVsbDtcblxuICAgICAgICBpZiAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBjb21tYW5kSWQ6IGdyb3VwLmlkLCBsYWJlbDogZ3JvdXAubGFiZWwgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKG5ldyBDb21wb3NpdGVDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBncm91cC5pZCxcbiAgICAgICAgICAgIGxhYmVsOiBncm91cC5sYWJlbCxcbiAgICAgICAgICAgIHR5cGU6ICdncm91cDpjb21wb3NpdGUnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9LCBncm91cC5jaGlsZHJlbikpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBjb21tYW5kSWQ6IGdyb3VwLmlkLCBsYWJlbDogZ3JvdXAubGFiZWwgfTtcbiAgICB9XG5cbiAgICBjYW5jZWxHcm91cChncm91cElkOiBzdHJpbmcpOiBJVW5kb1JlZG9SZXN1bHQge1xuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUdyb3VwIHx8IHRoaXMuX2FjdGl2ZUdyb3VwLmlkICE9PSBncm91cElkKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnVW5kbyBncm91cCBub3QgZm91bmQnIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLl9hY3RpdmVHcm91cC5sYWJlbDtcbiAgICAgICAgdGhpcy5fYWN0aXZlR3JvdXAgPSBudWxsO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBjb21tYW5kSWQ6IGdyb3VwSWQsIGxhYmVsIH07XG4gICAgfVxuXG4gICAgaXNHcm91cEFjdGl2ZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUdyb3VwICE9PSBudWxsO1xuICAgIH1cblxuICAgIGdldEhpc3RvcnlGb3JUZXN0aW5nKCk6IElVbmRvQ29tbWFuZFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLl9jb21tYW5kQXJyYXldO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NvbW1hbmRNYXRjaGVzQXQoaW5kZXg6IG51bWJlciwgc2NvcGU/OiBQYXJ0aWFsPElVbmRvU2NvcGU+KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLl9jb21tYW5kQXJyYXlbaW5kZXhdO1xuICAgICAgICByZXR1cm4gQm9vbGVhbihjb21tYW5kICYmIG1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZC5tZXRhLnNjb3BlLCBzY29wZSkpO1xuICAgIH1cblxuICAgIGhhc0FjdGl2ZVJlY29yZGluZyh1dWlkPzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh1dWlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zbmFwc2hvdFJlY29yZGluZ3Muc2l6ZSA+IDAgfHwgdGhpcy5fYXV0b0NvbW1hbmRzLmxlbmd0aCA+IDAgfHwgdGhpcy5fbWFudWFsQ29tbWFuZHMubGVuZ3RoID4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlUmVjb3JkaW5nVXVpZENvdW50cy5oYXModXVpZCk7XG4gICAgfVxuXG4gICAgYmVnaW5SZWNvcmRpbmcodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb24/OiBJU2NlbmVVbmRvT3B0aW9uKTogU2NlbmVVbmRvQ29tbWFuZElEIHtcbiAgICAgICAgY29uc3QgdXVpZExpc3QgPSBBcnJheS5pc0FycmF5KHV1aWRzKSA/IHV1aWRzIDogW3V1aWRzXTtcbiAgICAgICAgY29uc3QgdXVpZFNldCA9IG5ldyBTZXQodXVpZExpc3QpO1xuICAgICAgICBvcHRpb24gPSBvcHRpb24gPz8geyBhdXRvOiBmYWxzZSB9O1xuXG4gICAgICAgIGlmIChvcHRpb24uY3VzdG9tQ29tbWFuZCkge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuX2NyZWF0ZUNvbW1hbmQob3B0aW9uKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB1dWlkU2V0LnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC51dWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYWRkQWN0aXZlUmVjb3JkaW5nVXVpZHModXVpZFNldCk7XG4gICAgICAgICAgICByZXR1cm4gY29tbWFuZC5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9zbmFwc2hvdEFkYXB0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gdGhpcy5fY3JlYXRlSWQob3B0aW9uLmxhYmVsID8/IG9wdGlvbi50YWcgPz8gJ3JlY29yZGluZycpO1xuICAgICAgICAgICAgdGhpcy5fc25hcHNob3RSZWNvcmRpbmdzLnNldChpZCwge1xuICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBvcHRpb24ubGFiZWwgPz8gb3B0aW9uLnRhZyA/PyBpZCxcbiAgICAgICAgICAgICAgICBzY29wZTogb3B0aW9uLnNjb3BlID8/IHt9LFxuICAgICAgICAgICAgICAgIHV1aWRzOiBbLi4udXVpZFNldF0sXG4gICAgICAgICAgICAgICAgYmVmb3JlOiB0aGlzLl9zbmFwc2hvdEFkYXB0ZXIuY2FwdHVyZShbLi4udXVpZFNldF0pLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9hZGRBY3RpdmVSZWNvcmRpbmdVdWlkcyh1dWlkU2V0KTtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLl9jcmVhdGVDb21tYW5kKG9wdGlvbik7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB1dWlkU2V0LnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb21tYW5kLnV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICBpZiAoIWNvbW1hbmQuY3VzdG9tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0VW5kbyhjb21tYW5kLCB1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRBY3RpdmVSZWNvcmRpbmdVdWlkcyh1dWlkU2V0KTtcbiAgICAgICAgcmV0dXJuIGNvbW1hbmQuaWQ7XG4gICAgfVxuXG4gICAgYXN5bmMgZW5kUmVjb3JkaW5nKGlkOiBTY2VuZVVuZG9Db21tYW5kSUQpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKHRoaXMuX3NuYXBzaG90QWRhcHRlciAmJiB0aGlzLl9zbmFwc2hvdFJlY29yZGluZ3MuaGFzKGlkKSkge1xuICAgICAgICAgICAgY29uc3QgcmVjb3JkaW5nID0gdGhpcy5fc25hcHNob3RSZWNvcmRpbmdzLmdldChpZCkhO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBiZWZvcmUgPSBpc1Byb21pc2VMaWtlKHJlY29yZGluZy5iZWZvcmUpID8gYXdhaXQgcmVjb3JkaW5nLmJlZm9yZSA6IHJlY29yZGluZy5iZWZvcmU7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FwdHVyZWRBZnRlciA9IHRoaXMuX3NuYXBzaG90QWRhcHRlci5jYXB0dXJlKHJlY29yZGluZy51dWlkcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSBpc1Byb21pc2VMaWtlKGNhcHR1cmVkQWZ0ZXIpID8gYXdhaXQgY2FwdHVyZWRBZnRlciA6IGNhcHR1cmVkQWZ0ZXI7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NuYXBzaG90QWRhcHRlci5lcXVhbHMoYmVmb3JlLCBhZnRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnB1c2gobmV3IFNuYXBzaG90Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogcmVjb3JkaW5nLmxhYmVsLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncmVjb3JkaW5nOnNuYXBzaG90JyxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IHJlY29yZGluZy5zY29wZSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIH0sIGJlZm9yZSwgYWZ0ZXIsIHRoaXMuX3NuYXBzaG90QWRhcHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zbmFwc2hvdFJlY29yZGluZ3MuZGVsZXRlKGlkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVBY3RpdmVSZWNvcmRpbmdVdWlkcyhyZWNvcmRpbmcudXVpZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuX2F1dG9Db21tYW5kcy5maW5kKHQgPT4gdC5pZCA9PT0gaWQpID8/XG4gICAgICAgICAgICB0aGlzLl9tYW51YWxDb21tYW5kcy5maW5kKHQgPT4gdC5pZCA9PT0gaWQpO1xuICAgICAgICBpZiAoIWNvbW1hbmQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuX2NvbW1hbmRBcnJheS5pbmRleE9mKGNvbW1hbmQpICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbVW5kb10gY29tbWFuZCBhbHJlYWR5IGV4aXN0cycsIGNvbW1hbmQudGFnKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUNvbW1hbmQodGhpcy5fYXV0b0NvbW1hbmRzLCBpZCk7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVDb21tYW5kKHRoaXMuX21hbnVhbENvbW1hbmRzLCBpZCk7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVBY3RpdmVSZWNvcmRpbmdVdWlkcyhjb21tYW5kLnV1aWRzKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbW1hbmQuY3VzdG9tKSB7XG4gICAgICAgICAgICBjb21tYW5kLnV1aWRzLmZvckVhY2godXVpZCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0UmVkbyhjb21tYW5kLCB1dWlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHVzaChjb21tYW5kKTtcbiAgICAgICAgY29uc3QgYXV0b0luZGV4ID0gdGhpcy5fYXV0b0NvbW1hbmRzLmluZGV4T2YoY29tbWFuZCk7XG4gICAgICAgIGlmIChhdXRvSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9hdXRvQ29tbWFuZHMuc3BsaWNlKGF1dG9JbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWFudWFsSW5kZXggPSB0aGlzLl9tYW51YWxDb21tYW5kcy5pbmRleE9mKGNvbW1hbmQpO1xuICAgICAgICBpZiAobWFudWFsSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW51YWxDb21tYW5kcy5zcGxpY2UobWFudWFsSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbW92ZUFjdGl2ZVJlY29yZGluZ1V1aWRzKGNvbW1hbmQudXVpZHMpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjYW5jZWxSZWNvcmRpbmcoaWQ6IFNjZW5lVW5kb0NvbW1hbmRJRCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdFJlY29yZGluZyA9IHRoaXMuX3NuYXBzaG90UmVjb3JkaW5ncy5nZXQoaWQpO1xuICAgICAgICBpZiAoc25hcHNob3RSZWNvcmRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX3NuYXBzaG90UmVjb3JkaW5ncy5kZWxldGUoaWQpO1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWN0aXZlUmVjb3JkaW5nVXVpZHMoc25hcHNob3RSZWNvcmRpbmcudXVpZHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbW92ZWQgPSB0aGlzLl9yZW1vdmVDb21tYW5kKHRoaXMuX2F1dG9Db21tYW5kcywgaWQpO1xuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWN0aXZlUmVjb3JkaW5nVXVpZHMocmVtb3ZlZC51dWlkcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZW1vdmVkID0gdGhpcy5fcmVtb3ZlQ29tbWFuZCh0aGlzLl9tYW51YWxDb21tYW5kcywgaWQpO1xuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWN0aXZlUmVjb3JkaW5nVXVpZHMocmVtb3ZlZC51dWlkcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcHVzaFRvU3RhY2soY29tbWFuZDogSVVuZG9Db21tYW5kKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9pbmRleCAhPT0gdGhpcy5fY29tbWFuZEFycmF5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1hbmRBcnJheS5zcGxpY2UodGhpcy5faW5kZXggKyAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb21tYW5kQXJyYXkucHVzaChjb21tYW5kKTtcbiAgICAgICAgdGhpcy5faW5kZXggPSB0aGlzLl9jb21tYW5kQXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgICAgdGhpcy5fdHJpbVRvTWF4U3RhY2tTaXplKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfdHJpbVRvTWF4U3RhY2tTaXplKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvdmVyZmxvdyA9IHRoaXMuX2NvbW1hbmRBcnJheS5sZW5ndGggLSB0aGlzLl9tYXhTdGFja1NpemU7XG4gICAgICAgIGlmIChvdmVyZmxvdyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW1vdmVkID0gdGhpcy5fY29tbWFuZEFycmF5LnNwbGljZSgwLCBvdmVyZmxvdyk7XG4gICAgICAgIHRoaXMuX2luZGV4ID0gTWF0aC5tYXgoLTEsIHRoaXMuX2luZGV4IC0gb3ZlcmZsb3cpO1xuICAgICAgICBpZiAodGhpcy5fbGFzdFNhdmVkQ29tbWFuZElkICYmIHJlbW92ZWQuc29tZShjb21tYW5kID0+IGNvbW1hbmQubWV0YS5pZCA9PT0gdGhpcy5fbGFzdFNhdmVkQ29tbWFuZElkKSkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdFNhdmVkQ29tbWFuZElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FwcGx5Q29tbWFuZChjb21tYW5kOiBJVW5kb0NvbW1hbmQsIGRpcmVjdGlvbjogJ3VuZG8nIHwgJ3JlZG8nKTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgdGhpcy5faXNBcHBseWluZyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgY29tbWFuZFtkaXJlY3Rpb25dKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29tbWFuZElkOiBjb21tYW5kLm1ldGEuaWQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IGNvbW1hbmQubWV0YS5sYWJlbCxcbiAgICAgICAgICAgICAgICByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9pc0FwcGx5aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9lbnF1ZXVlPFQ+KHRhc2s6ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMuX3F1ZXVlLnRoZW4odGFzaywgdGFzayk7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gbmV4dC5jYXRjaCgoKSA9PiB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gbmV4dDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jdXJyZW50Q29tbWFuZElkKCk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5faW5kZXggPT09IC0xID8gbnVsbCA6IHRoaXMuX2NvbW1hbmRBcnJheVt0aGlzLl9pbmRleF0/Lm1ldGEuaWQgPz8gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9oYXNEaWZmZXJlbmNlU2luY2UoY2hlY2twb2ludDogSVVuZG9DaGVja3BvaW50LCBtYXRjaGVzOiAoY29tbWFuZDogSVVuZG9Db21tYW5kKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChjaGVja3BvaW50LmdlbmVyYXRpb24gIT09IHRoaXMuX2NoZWNrcG9pbnRHZW5lcmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2hlY2twb2ludEluZGV4ID0gdGhpcy5fcmVzb2x2ZUNoZWNrcG9pbnRJbmRleChjaGVja3BvaW50KTtcbiAgICAgICAgaWYgKGNoZWNrcG9pbnRJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudENvbW1hbmRJZCgpICE9PSBjaGVja3BvaW50LmNvbW1hbmRJZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hlY2twb2ludEluZGV4ID09PSB0aGlzLl9pbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5taW4oY2hlY2twb2ludEluZGV4LCB0aGlzLl9pbmRleCkgKyAxO1xuICAgICAgICBjb25zdCBlbmQgPSBNYXRoLm1heChjaGVja3BvaW50SW5kZXgsIHRoaXMuX2luZGV4KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5fY29tbWFuZEFycmF5W2ldO1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQgJiYgbWF0Y2hlcyhjb21tYW5kKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXNvbHZlQ2hlY2twb2ludEluZGV4KGNoZWNrcG9pbnQ6IElVbmRvQ2hlY2twb2ludCk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGlmIChjaGVja3BvaW50LmNvbW1hbmRJZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY29tbWFuZEFycmF5LmZpbmRJbmRleChjb21tYW5kID0+IGNvbW1hbmQubWV0YS5pZCA9PT0gY2hlY2twb2ludC5jb21tYW5kSWQpO1xuICAgICAgICByZXR1cm4gaW5kZXggPT09IC0xID8gdW5kZWZpbmVkIDogaW5kZXg7XG4gICAgfVxuXG4gICAgLy8g6ZmN57qn6Lev5b6E77ya5LuF5Zyo5pyq5rOo5YWlIHNuYXBzaG90QWRhcHRlciDml7bkvb/nlKjvvIjkuLvopoHmmK/ljZXmtYvvvInjgIJcbiAgICAvLyDov5DooYzml7YgVW5kb1NlcnZpY2Ug5aeL57uI5rOo5YWlIGFkYXB0ZXLvvIxiZWdpblJlY29yZGluZy9lbmRSZWNvcmRpbmcg6LWwIHNuYXBzaG90IOWIhuaUr++8jOS4jeS8muWIsOi/memHjOOAglxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbW1hbmQob3B0aW9uOiBJU2NlbmVVbmRvT3B0aW9uKTogU2NlbmVVbmRvQ29tbWFuZCB7XG4gICAgICAgIGxldCBjb21tYW5kOiBTY2VuZVVuZG9Db21tYW5kO1xuICAgICAgICBpZiAob3B0aW9uLmN1c3RvbUNvbW1hbmQpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb24uY3VzdG9tQ29tbWFuZCBpbnN0YW5jZW9mIFNjZW5lVW5kb0NvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gb3B0aW9uLmN1c3RvbUNvbW1hbmQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUNvbW1hbmQgPSBvcHRpb24uY3VzdG9tQ29tbWFuZDtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gbmV3IFNjZW5lVW5kb0NvbW1hbmQoKTtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnVuZG8gPSAoKSA9PiBjdXN0b21Db21tYW5kLnVuZG8oKTtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnJlZG8gPSAoKSA9PiBjdXN0b21Db21tYW5kLnJlZG8oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbW1hbmQuY3VzdG9tID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1hbmQgPSBuZXcgU2NlbmVVbmRvQ29tbWFuZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxhYmVsID0gb3B0aW9uLmxhYmVsID8/IG9wdGlvbi50YWcgPz8gJyc7XG4gICAgICAgIGlmIChsYWJlbCAhPT0gJycpIGNvbW1hbmQudGFnID0gbGFiZWw7XG4gICAgICAgIGlmIChvcHRpb24uYXV0byAhPT0gdW5kZWZpbmVkKSBjb21tYW5kLmF1dG8gPSBvcHRpb24uYXV0bztcbiAgICAgICAgaWYgKGNvbW1hbmQuYXV0byAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2F1dG9Db21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbWFudWFsQ29tbWFuZHMucHVzaChjb21tYW5kKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZCA9IHRoaXMuX2NyZWF0ZUlkKGNvbW1hbmQudGFnIHx8ICdjbWQnKTtcbiAgICAgICAgY29tbWFuZC5pZCA9IGlkO1xuICAgICAgICBjb21tYW5kLm1ldGEgPSB7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGxhYmVsOiBjb21tYW5kLnRhZyB8fCBpZCxcbiAgICAgICAgICAgIHR5cGU6IGNvbW1hbmQuY3VzdG9tID8gJ2N1c3RvbScgOiAncmVjb3JkaW5nOnNuYXBzaG90JyxcbiAgICAgICAgICAgIHNjb3BlOiBvcHRpb24uc2NvcGUgPz8ge30sXG4gICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBjb21tYW5kO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUlkKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVVuZG9JZChwcmVmaXgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldFVuZG8oY29tbWFuZDogU2NlbmVVbmRvQ29tbWFuZCwgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBpZiAoIUVkaXRvckV4dGVuZHMpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC51bmRvRGF0YS5zZXQodXVpZCwgZ2V0RHVtcFV0aWwoKS5kdW1wTm9kZShub2RlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tcCA9IEVkaXRvckV4dGVuZHMuQ29tcG9uZW50Py5nZXRDb21wb25lbnQodXVpZCk7XG4gICAgICAgICAgICBpZiAoY29tcCkge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQudW5kb0RhdGEuc2V0KHV1aWQsIGdldER1bXBVdGlsKCkuZHVtcENvbXBvbmVudChjb21wKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tVbmRvXSBfc2V0VW5kbyBlcnJvcjonLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3NldFJlZG8oY29tbWFuZDogU2NlbmVVbmRvQ29tbWFuZCwgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBpZiAoIUVkaXRvckV4dGVuZHMpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC5yZWRvRGF0YS5zZXQodXVpZCwgZ2V0RHVtcFV0aWwoKS5kdW1wTm9kZShub2RlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tcCA9IEVkaXRvckV4dGVuZHMuQ29tcG9uZW50Py5nZXRDb21wb25lbnQodXVpZCk7XG4gICAgICAgICAgICBpZiAoY29tcCkge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucmVkb0RhdGEuc2V0KHV1aWQsIGdldER1bXBVdGlsKCkuZHVtcENvbXBvbmVudChjb21wKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tVbmRvXSBfc2V0UmVkbyBlcnJvcjonLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2FkZEFjdGl2ZVJlY29yZGluZ1V1aWRzKHV1aWRzOiBJdGVyYWJsZTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB1dWlkcykge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlUmVjb3JkaW5nVXVpZENvdW50cy5zZXQodXVpZCwgKHRoaXMuX2FjdGl2ZVJlY29yZGluZ1V1aWRDb3VudHMuZ2V0KHV1aWQpID8/IDApICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW1vdmVBY3RpdmVSZWNvcmRpbmdVdWlkcyh1dWlkczogSXRlcmFibGU8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fYWN0aXZlUmVjb3JkaW5nVXVpZENvdW50cy5nZXQodXVpZCk7XG4gICAgICAgICAgICBpZiAoIWNvdW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVSZWNvcmRpbmdVdWlkQ291bnRzLmRlbGV0ZSh1dWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlUmVjb3JkaW5nVXVpZENvdW50cy5zZXQodXVpZCwgY291bnQgLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbW92ZUNvbW1hbmQobGlzdDogU2NlbmVVbmRvQ29tbWFuZFtdLCBpZDogU2NlbmVVbmRvQ29tbWFuZElEKTogU2NlbmVVbmRvQ29tbWFuZCB8IG51bGwge1xuICAgICAgICBjb25zdCBpbmRleCA9IGxpc3QuZmluZEluZGV4KHQgPT4gdC5pZCA9PT0gaWQpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBbY29tbWFuZF0gPSBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICByZXR1cm4gY29tbWFuZCA/PyBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlTGlrZTxUPih2YWx1ZTogVCB8IFByb21pc2U8VD4pOiB2YWx1ZSBpcyBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgKHZhbHVlIGFzIFByb21pc2U8VD4pLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNVbmRvU2NvcGUoY29tbWFuZFNjb3BlOiBJVW5kb1Njb3BlLCBleHBlY3RlZFNjb3BlPzogUGFydGlhbDxJVW5kb1Njb3BlPik6IGJvb2xlYW4ge1xuICAgIGlmICghZXhwZWN0ZWRTY29wZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZXhwZWN0ZWRTY29wZSkgYXMgW2tleW9mIElVbmRvU2NvcGUsIHVua25vd25dW10pIHtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgY29tbWFuZFNjb3BlW2tleV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNVbmRvVHlwZShjb21tYW5kVHlwZTogc3RyaW5nLCBleHBlY3RlZFR5cGVzPzogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gIWV4cGVjdGVkVHlwZXMgfHwgZXhwZWN0ZWRUeXBlcy5pbmNsdWRlcyhjb21tYW5kVHlwZSk7XG59XG5cbmV4cG9ydCB7IFNjZW5lVW5kb01hbmFnZXIsIElTY2VuZVVuZG9PcHRpb24gfTtcbiJdfQ==