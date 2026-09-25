"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const gltf_validator_1 = require("gltf-validator");
function send(message) {
    if (typeof process.send === 'function') {
        process.send(message, () => process.disconnect());
    }
}
process.once('message', async (message) => {
    try {
        const { gltfFilePath } = message;
        const validationOptions = {
            uri: gltfFilePath,
            ignoredIssues: [],
            severityOverrides: {
                NON_RELATIVE_URI: 2 /* Severity.Information */,
                UNDECLARED_EXTENSION: 1 /* Severity.Warning */,
                ACCESSOR_TOTAL_OFFSET_ALIGNMENT: 2 /* Severity.Information */,
            },
        };
        const isGlb = gltfFilePath.endsWith('.glb');
        // For some glTF files exported by fbx2glTF, the validator can report
        // invalid JSON when it is given bytes. Read textual glTF as a string.
        const report = await (isGlb
            ? (0, gltf_validator_1.validateBytes)(Uint8Array.from(fs_1.default.readFileSync(gltfFilePath)), validationOptions)
            : (0, gltf_validator_1.validateString)(fs_1.default.readFileSync(gltfFilePath).toString(), validationOptions));
        send({ report });
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        send({
            error: {
                message: err.message,
                stack: err.stack,
            },
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvZ2x0Zi92YWxpZGF0aW9uLXdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixtREFBaUc7QUFNakcsU0FBUyxJQUFJLENBQUMsT0FBZ0I7SUFDMUIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDdEQsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBZ0MsRUFBRSxFQUFFO0lBQy9ELElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDakMsTUFBTSxpQkFBaUIsR0FBc0I7WUFDekMsR0FBRyxFQUFFLFlBQVk7WUFDakIsYUFBYSxFQUFFLEVBQUU7WUFDakIsaUJBQWlCLEVBQUU7Z0JBQ2YsZ0JBQWdCLDhCQUFzQjtnQkFDdEMsb0JBQW9CLDBCQUFrQjtnQkFDdEMsK0JBQStCLDhCQUFzQjthQUN4RDtTQUNKLENBQUM7UUFDRixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLHFFQUFxRTtRQUNyRSxzRUFBc0U7UUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUs7WUFDdkIsQ0FBQyxDQUFDLElBQUEsOEJBQWEsRUFBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztZQUNsRixDQUFDLENBQUMsSUFBQSwrQkFBYyxFQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ25GLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLEdBQUcsR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQztZQUNELEtBQUssRUFBRTtnQkFDSCxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87Z0JBQ3BCLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSzthQUNuQjtTQUNKLENBQUMsQ0FBQztJQUNQLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBTZXZlcml0eSwgdmFsaWRhdGVCeXRlcywgdmFsaWRhdGVTdHJpbmcsIHR5cGUgVmFsaWRhdGlvbk9wdGlvbnMgfSBmcm9tICdnbHRmLXZhbGlkYXRvcic7XG5cbmludGVyZmFjZSBWYWxpZGF0aW9uV29ya2VyUmVxdWVzdCB7XG4gICAgZ2x0ZkZpbGVQYXRoOiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIHNlbmQobWVzc2FnZTogdW5rbm93bikge1xuICAgIGlmICh0eXBlb2YgcHJvY2Vzcy5zZW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb2Nlc3Muc2VuZChtZXNzYWdlLCAoKSA9PiBwcm9jZXNzLmRpc2Nvbm5lY3QoKSk7XG4gICAgfVxufVxuXG5wcm9jZXNzLm9uY2UoJ21lc3NhZ2UnLCBhc3luYyAobWVzc2FnZTogVmFsaWRhdGlvbldvcmtlclJlcXVlc3QpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGdsdGZGaWxlUGF0aCB9ID0gbWVzc2FnZTtcbiAgICAgICAgY29uc3QgdmFsaWRhdGlvbk9wdGlvbnM6IFZhbGlkYXRpb25PcHRpb25zID0ge1xuICAgICAgICAgICAgdXJpOiBnbHRmRmlsZVBhdGgsXG4gICAgICAgICAgICBpZ25vcmVkSXNzdWVzOiBbXSxcbiAgICAgICAgICAgIHNldmVyaXR5T3ZlcnJpZGVzOiB7XG4gICAgICAgICAgICAgICAgTk9OX1JFTEFUSVZFX1VSSTogU2V2ZXJpdHkuSW5mb3JtYXRpb24sXG4gICAgICAgICAgICAgICAgVU5ERUNMQVJFRF9FWFRFTlNJT046IFNldmVyaXR5Lldhcm5pbmcsXG4gICAgICAgICAgICAgICAgQUNDRVNTT1JfVE9UQUxfT0ZGU0VUX0FMSUdOTUVOVDogU2V2ZXJpdHkuSW5mb3JtYXRpb24sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBpc0dsYiA9IGdsdGZGaWxlUGF0aC5lbmRzV2l0aCgnLmdsYicpO1xuICAgICAgICAvLyBGb3Igc29tZSBnbFRGIGZpbGVzIGV4cG9ydGVkIGJ5IGZieDJnbFRGLCB0aGUgdmFsaWRhdG9yIGNhbiByZXBvcnRcbiAgICAgICAgLy8gaW52YWxpZCBKU09OIHdoZW4gaXQgaXMgZ2l2ZW4gYnl0ZXMuIFJlYWQgdGV4dHVhbCBnbFRGIGFzIGEgc3RyaW5nLlxuICAgICAgICBjb25zdCByZXBvcnQgPSBhd2FpdCAoaXNHbGJcbiAgICAgICAgICAgID8gdmFsaWRhdGVCeXRlcyhVaW50OEFycmF5LmZyb20oZnMucmVhZEZpbGVTeW5jKGdsdGZGaWxlUGF0aCkpLCB2YWxpZGF0aW9uT3B0aW9ucylcbiAgICAgICAgICAgIDogdmFsaWRhdGVTdHJpbmcoZnMucmVhZEZpbGVTeW5jKGdsdGZGaWxlUGF0aCkudG9TdHJpbmcoKSwgdmFsaWRhdGlvbk9wdGlvbnMpKTtcbiAgICAgICAgc2VuZCh7IHJlcG9ydCB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBlcnIgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSk7XG4gICAgICAgIHNlbmQoe1xuICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBzdGFjazogZXJyLnN0YWNrLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG4iXX0=