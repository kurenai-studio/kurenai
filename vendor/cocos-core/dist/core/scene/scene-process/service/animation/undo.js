"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationClipSnapshotCommand = void 0;
const command_utils_shared_1 = require("../undo/commands/command-utils-shared");
class AnimationClipSnapshotCommand {
    options;
    meta;
    constructor(options) {
        this.options = options;
        this.meta = {
            id: (0, command_utils_shared_1.createUndoId)('animation-operation'),
            label: 'Animation Operation',
            type: 'animation:clip-snapshot',
            scope: {
                assetUuid: options.clipUuid,
                editorType: 'animation',
                mode: 'animation',
            },
            timestamp: Date.now(),
        };
    }
    async undo() {
        return await this._apply(this.options.before);
    }
    async redo() {
        return await this._apply(this.options.after);
    }
    async _apply(snapshot) {
        try {
            await this.options.applySnapshot(snapshot);
            return {
                success: true,
                commandId: this.meta.id,
                label: this.meta.label,
            };
        }
        catch (error) {
            return {
                success: false,
                commandId: this.meta.id,
                label: this.meta.label,
                reason: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
exports.AnimationClipSnapshotCommand = AnimationClipSnapshotCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9hbmltYXRpb24vdW5kby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnRkFBcUU7QUFVckUsTUFBYSw0QkFBNEI7SUFHUjtJQUZwQixJQUFJLENBQW1CO0lBRWhDLFlBQTZCLE9BQTZDO1FBQTdDLFlBQU8sR0FBUCxPQUFPLENBQXNDO1FBQ3RFLElBQUksQ0FBQyxJQUFJLEdBQUc7WUFDUixFQUFFLEVBQUUsSUFBQSxtQ0FBWSxFQUFDLHFCQUFxQixDQUFDO1lBQ3ZDLEtBQUssRUFBRSxxQkFBcUI7WUFDNUIsSUFBSSxFQUFFLHlCQUF5QjtZQUMvQixLQUFLLEVBQUU7Z0JBQ0gsU0FBUyxFQUFFLE9BQU8sQ0FBQyxRQUFRO2dCQUMzQixVQUFVLEVBQUUsV0FBVztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7YUFDcEI7WUFDRCxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtTQUN4QixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ04sT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUk7UUFDTixPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFTyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQWdDO1FBQ2pELElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsT0FBTztnQkFDSCxPQUFPLEVBQUUsSUFBSTtnQkFDYixTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLO2FBQ3pCLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU87Z0JBQ0gsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSztnQkFDdEIsTUFBTSxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7YUFDakUsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUExQ0Qsb0VBMENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJVW5kb0NvbW1hbmQsIElVbmRvQ29tbWFuZE1ldGEsIElVbmRvUmVkb1Jlc3VsdCB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBjcmVhdGVVbmRvSWQgfSBmcm9tICcuLi91bmRvL2NvbW1hbmRzL2NvbW1hbmQtdXRpbHMtc2hhcmVkJztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGlvbkNsaXBTbmFwc2hvdCB9IGZyb20gJy4vY2xpcC1zbmFwc2hvdCc7XG5cbmludGVyZmFjZSBJQW5pbWF0aW9uQ2xpcFNuYXBzaG90Q29tbWFuZE9wdGlvbnMge1xuICAgIGNsaXBVdWlkOiBzdHJpbmc7XG4gICAgYmVmb3JlOiBJQW5pbWF0aW9uQ2xpcFNuYXBzaG90O1xuICAgIGFmdGVyOiBJQW5pbWF0aW9uQ2xpcFNuYXBzaG90O1xuICAgIGFwcGx5U25hcHNob3Q6IChzbmFwc2hvdDogSUFuaW1hdGlvbkNsaXBTbmFwc2hvdCkgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFuaW1hdGlvbkNsaXBTbmFwc2hvdENvbW1hbmQgaW1wbGVtZW50cyBJVW5kb0NvbW1hbmQge1xuICAgIHJlYWRvbmx5IG1ldGE6IElVbmRvQ29tbWFuZE1ldGE7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IElBbmltYXRpb25DbGlwU25hcHNob3RDb21tYW5kT3B0aW9ucykge1xuICAgICAgICB0aGlzLm1ldGEgPSB7XG4gICAgICAgICAgICBpZDogY3JlYXRlVW5kb0lkKCdhbmltYXRpb24tb3BlcmF0aW9uJyksXG4gICAgICAgICAgICBsYWJlbDogJ0FuaW1hdGlvbiBPcGVyYXRpb24nLFxuICAgICAgICAgICAgdHlwZTogJ2FuaW1hdGlvbjpjbGlwLXNuYXBzaG90JyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBvcHRpb25zLmNsaXBVdWlkLFxuICAgICAgICAgICAgICAgIGVkaXRvclR5cGU6ICdhbmltYXRpb24nLFxuICAgICAgICAgICAgICAgIG1vZGU6ICdhbmltYXRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyB1bmRvKCk6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9hcHBseSh0aGlzLm9wdGlvbnMuYmVmb3JlKTtcbiAgICB9XG5cbiAgICBhc3luYyByZWRvKCk6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9hcHBseSh0aGlzLm9wdGlvbnMuYWZ0ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FwcGx5KHNuYXBzaG90OiBJQW5pbWF0aW9uQ2xpcFNuYXBzaG90KTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub3B0aW9ucy5hcHBseVNuYXBzaG90KHNuYXBzaG90KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb21tYW5kSWQ6IHRoaXMubWV0YS5pZCxcbiAgICAgICAgICAgICAgICBsYWJlbDogdGhpcy5tZXRhLmxhYmVsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29tbWFuZElkOiB0aGlzLm1ldGEuaWQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IHRoaXMubWV0YS5sYWJlbCxcbiAgICAgICAgICAgICAgICByZWFzb246IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=