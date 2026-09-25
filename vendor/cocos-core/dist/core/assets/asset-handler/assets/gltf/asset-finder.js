"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGltfAssetFinder = void 0;
const load_asset_sync_1 = require("../utils/load-asset-sync");
class DefaultGltfAssetFinder {
    _assetDetails;
    constructor(_assetDetails = {}) {
        this._assetDetails = _assetDetails;
    }
    serialize() {
        return this._assetDetails;
    }
    set(kind, values) {
        this._assetDetails[kind] = values;
    }
    find(kind, index, type) {
        const uuids = this._assetDetails[kind];
        if (uuids === undefined) {
            return null;
        }
        const detail = uuids[index];
        if (detail === null) {
            return null;
        }
        else {
            return (0, load_asset_sync_1.loadAssetSync)(detail, type) || null;
        }
    }
}
exports.DefaultGltfAssetFinder = DefaultGltfAssetFinder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtZmluZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2dsdGYvYXNzZXQtZmluZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUlBLDhEQUF5RDtBQUl6RCxNQUFhLHNCQUFzQjtJQUNYO0lBQXBCLFlBQW9CLGdCQUF1QyxFQUFFO1FBQXpDLGtCQUFhLEdBQWIsYUFBYSxDQUE0QjtJQUFHLENBQUM7SUFFMUQsU0FBUztRQUNaLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM5QixDQUFDO0lBRU0sR0FBRyxDQUFDLElBQWtCLEVBQUUsTUFBNEI7UUFDdkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDdEMsQ0FBQztJQUVNLElBQUksQ0FBcUIsSUFBa0IsRUFBRSxLQUFhLEVBQUUsSUFBb0I7UUFDbkYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLElBQUksTUFBTSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxJQUFBLCtCQUFhLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztRQUMvQyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBdkJELHdEQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNjIGZyb20gJ2NjJztcbmltcG9ydCB7IENvbnN0cnVjdG9yIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgU2VyaWFsaXplZEFzc2V0RmluZGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5pbXBvcnQgeyBHbHRmQXNzZXRGaW5kZXJLaW5kLCBJR2x0ZkFzc2V0RmluZGVyIH0gZnJvbSAnLi4vdXRpbHMvZ2x0Zi1jb252ZXJ0ZXInO1xuaW1wb3J0IHsgbG9hZEFzc2V0U3luYyB9IGZyb20gJy4uL3V0aWxzL2xvYWQtYXNzZXQtc3luYyc7XG5cbmV4cG9ydCB0eXBlIE15RmluZGVyS2luZCA9IEdsdGZBc3NldEZpbmRlcktpbmQgfCAnc2NlbmVzJztcblxuZXhwb3J0IGNsYXNzIERlZmF1bHRHbHRmQXNzZXRGaW5kZXIgaW1wbGVtZW50cyBJR2x0ZkFzc2V0RmluZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hc3NldERldGFpbHM6IFNlcmlhbGl6ZWRBc3NldEZpbmRlciA9IHt9KSB7fVxuXG4gICAgcHVibGljIHNlcmlhbGl6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Fzc2V0RGV0YWlscztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0KGtpbmQ6IE15RmluZGVyS2luZCwgdmFsdWVzOiBBcnJheTxzdHJpbmcgfCBudWxsPikge1xuICAgICAgICB0aGlzLl9hc3NldERldGFpbHNba2luZF0gPSB2YWx1ZXM7XG4gICAgfVxuXG4gICAgcHVibGljIGZpbmQ8VCBleHRlbmRzIGNjLkFzc2V0PihraW5kOiBNeUZpbmRlcktpbmQsIGluZGV4OiBudW1iZXIsIHR5cGU6IENvbnN0cnVjdG9yPFQ+KTogVCB8IG51bGwge1xuICAgICAgICBjb25zdCB1dWlkcyA9IHRoaXMuX2Fzc2V0RGV0YWlsc1traW5kXTtcbiAgICAgICAgaWYgKHV1aWRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRldGFpbCA9IHV1aWRzW2luZGV4XTtcbiAgICAgICAgaWYgKGRldGFpbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZEFzc2V0U3luYyhkZXRhaWwsIHR5cGUpIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=