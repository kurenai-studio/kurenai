"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnimationOperationResult = isAnimationOperationResult;
exports.shouldSyncClipDuration = shouldSyncClipDuration;
exports.shouldSyncAnimationClipDuration = shouldSyncAnimationClipDuration;
exports.isAllowedSkeletonAnimationOperation = isAllowedSkeletonAnimationOperation;
function isAnimationOperationResult(value) {
    return value.state === 'success' || value.state === 'failure';
}
function shouldSyncClipDuration(operation) {
    switch (operation.type) {
        case 'changeSample':
        case 'addEvent':
        case 'deleteEvent':
        case 'updateEvent':
        case 'moveEvents':
        case 'copyEventsTo':
        case 'addEmbeddedPlayer':
        case 'deleteEmbeddedPlayer':
        case 'updateEmbeddedPlayer':
        case 'clearEmbeddedPlayer':
        case 'removeEmbeddedPlayerGroup':
        case 'clearEmbeddedPlayerGroup':
        case 'removeAuxiliaryCurve':
        case 'createAuxKey':
        case 'removeAuxKey':
        case 'moveAuxKeys':
        case 'copyAuxKey':
        case 'createPropertyKey':
        case 'updatePropertyKey':
        case 'removePropertyCurve':
        case 'removePropertyKey':
        case 'removePropertyKeys':
        case 'movePropertyKeys':
        case 'copyPropertyKeysTo':
            return true;
        default:
            return false;
    }
}
/**
 * Imported skeletal clips keep the duration authored by the importer. Their
 * editable event/settings operations must not recompute duration from the
 * currently visible event list and accidentally shorten the source clip.
 */
function shouldSyncAnimationClipDuration(operation, isSkeleton) {
    return !isSkeleton && shouldSyncClipDuration(operation);
}
function isAllowedSkeletonAnimationOperation(operation) {
    switch (operation.type) {
        case 'changeSample':
        case 'changeSpeed':
        case 'changeWrapMode':
        case 'addEvent':
        case 'deleteEvent':
        case 'updateEvent':
        case 'moveEvents':
        case 'copyEventsTo':
        case 'addEmbeddedPlayer':
        case 'deleteEmbeddedPlayer':
        case 'updateEmbeddedPlayer':
        case 'clearEmbeddedPlayer':
        case 'addEmbeddedPlayerGroup':
        case 'removeEmbeddedPlayerGroup':
        case 'clearEmbeddedPlayerGroup':
        case 'addAuxiliaryCurve':
        case 'removeAuxiliaryCurve':
        case 'renameAuxiliaryCurve':
        case 'createAuxKey':
        case 'removeAuxKey':
        case 'moveAuxKeys':
        case 'copyAuxKey':
        case 'updateAuxKeyData':
            return true;
        default:
            return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9uLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9hbmltYXRpb24vb3BlcmF0aW9uLXBvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGdFQUVDO0FBRUQsd0RBOEJDO0FBT0QsMEVBRUM7QUFFRCxrRkE2QkM7QUExRUQsU0FBZ0IsMEJBQTBCLENBQUMsS0FBc0Q7SUFDN0YsT0FBUSxLQUFtQyxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUssS0FBbUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQ2hJLENBQUM7QUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxTQUE4QjtJQUNqRSxRQUFRLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNyQixLQUFLLGNBQWMsQ0FBQztRQUNwQixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLGFBQWEsQ0FBQztRQUNuQixLQUFLLGFBQWEsQ0FBQztRQUNuQixLQUFLLFlBQVksQ0FBQztRQUNsQixLQUFLLGNBQWMsQ0FBQztRQUNwQixLQUFLLG1CQUFtQixDQUFDO1FBQ3pCLEtBQUssc0JBQXNCLENBQUM7UUFDNUIsS0FBSyxzQkFBc0IsQ0FBQztRQUM1QixLQUFLLHFCQUFxQixDQUFDO1FBQzNCLEtBQUssMkJBQTJCLENBQUM7UUFDakMsS0FBSywwQkFBMEIsQ0FBQztRQUNoQyxLQUFLLHNCQUFzQixDQUFDO1FBQzVCLEtBQUssY0FBYyxDQUFDO1FBQ3BCLEtBQUssY0FBYyxDQUFDO1FBQ3BCLEtBQUssYUFBYSxDQUFDO1FBQ25CLEtBQUssWUFBWSxDQUFDO1FBQ2xCLEtBQUssbUJBQW1CLENBQUM7UUFDekIsS0FBSyxtQkFBbUIsQ0FBQztRQUN6QixLQUFLLHFCQUFxQixDQUFDO1FBQzNCLEtBQUssbUJBQW1CLENBQUM7UUFDekIsS0FBSyxvQkFBb0IsQ0FBQztRQUMxQixLQUFLLGtCQUFrQixDQUFDO1FBQ3hCLEtBQUssb0JBQW9CO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCO1lBQ0ksT0FBTyxLQUFLLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsK0JBQStCLENBQUMsU0FBOEIsRUFBRSxVQUFtQjtJQUMvRixPQUFPLENBQUMsVUFBVSxJQUFJLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFnQixtQ0FBbUMsQ0FBQyxTQUE4QjtJQUM5RSxRQUFRLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNyQixLQUFLLGNBQWMsQ0FBQztRQUNwQixLQUFLLGFBQWEsQ0FBQztRQUNuQixLQUFLLGdCQUFnQixDQUFDO1FBQ3RCLEtBQUssVUFBVSxDQUFDO1FBQ2hCLEtBQUssYUFBYSxDQUFDO1FBQ25CLEtBQUssYUFBYSxDQUFDO1FBQ25CLEtBQUssWUFBWSxDQUFDO1FBQ2xCLEtBQUssY0FBYyxDQUFDO1FBQ3BCLEtBQUssbUJBQW1CLENBQUM7UUFDekIsS0FBSyxzQkFBc0IsQ0FBQztRQUM1QixLQUFLLHNCQUFzQixDQUFDO1FBQzVCLEtBQUsscUJBQXFCLENBQUM7UUFDM0IsS0FBSyx3QkFBd0IsQ0FBQztRQUM5QixLQUFLLDJCQUEyQixDQUFDO1FBQ2pDLEtBQUssMEJBQTBCLENBQUM7UUFDaEMsS0FBSyxtQkFBbUIsQ0FBQztRQUN6QixLQUFLLHNCQUFzQixDQUFDO1FBQzVCLEtBQUssc0JBQXNCLENBQUM7UUFDNUIsS0FBSyxjQUFjLENBQUM7UUFDcEIsS0FBSyxjQUFjLENBQUM7UUFDcEIsS0FBSyxhQUFhLENBQUM7UUFDbkIsS0FBSyxZQUFZLENBQUM7UUFDbEIsS0FBSyxrQkFBa0I7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDaEI7WUFDSSxPQUFPLEtBQUssQ0FBQztJQUNyQixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgICBJQW5pbWF0aW9uT3BlcmF0aW9uLFxuICAgIElBbmltYXRpb25PcGVyYXRpb25SZXN1bHQsXG59IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FuaW1hdGlvbk9wZXJhdGlvblJlc3VsdCh2YWx1ZTogSUFuaW1hdGlvbk9wZXJhdGlvbiB8IElBbmltYXRpb25PcGVyYXRpb25SZXN1bHQpOiB2YWx1ZSBpcyBJQW5pbWF0aW9uT3BlcmF0aW9uUmVzdWx0IHtcbiAgICByZXR1cm4gKHZhbHVlIGFzIElBbmltYXRpb25PcGVyYXRpb25SZXN1bHQpLnN0YXRlID09PSAnc3VjY2VzcycgfHwgKHZhbHVlIGFzIElBbmltYXRpb25PcGVyYXRpb25SZXN1bHQpLnN0YXRlID09PSAnZmFpbHVyZSc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTeW5jQ2xpcER1cmF0aW9uKG9wZXJhdGlvbjogSUFuaW1hdGlvbk9wZXJhdGlvbik6IGJvb2xlYW4ge1xuICAgIHN3aXRjaCAob3BlcmF0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY2hhbmdlU2FtcGxlJzpcbiAgICAgICAgY2FzZSAnYWRkRXZlbnQnOlxuICAgICAgICBjYXNlICdkZWxldGVFdmVudCc6XG4gICAgICAgIGNhc2UgJ3VwZGF0ZUV2ZW50JzpcbiAgICAgICAgY2FzZSAnbW92ZUV2ZW50cyc6XG4gICAgICAgIGNhc2UgJ2NvcHlFdmVudHNUbyc6XG4gICAgICAgIGNhc2UgJ2FkZEVtYmVkZGVkUGxheWVyJzpcbiAgICAgICAgY2FzZSAnZGVsZXRlRW1iZWRkZWRQbGF5ZXInOlxuICAgICAgICBjYXNlICd1cGRhdGVFbWJlZGRlZFBsYXllcic6XG4gICAgICAgIGNhc2UgJ2NsZWFyRW1iZWRkZWRQbGF5ZXInOlxuICAgICAgICBjYXNlICdyZW1vdmVFbWJlZGRlZFBsYXllckdyb3VwJzpcbiAgICAgICAgY2FzZSAnY2xlYXJFbWJlZGRlZFBsYXllckdyb3VwJzpcbiAgICAgICAgY2FzZSAncmVtb3ZlQXV4aWxpYXJ5Q3VydmUnOlxuICAgICAgICBjYXNlICdjcmVhdGVBdXhLZXknOlxuICAgICAgICBjYXNlICdyZW1vdmVBdXhLZXknOlxuICAgICAgICBjYXNlICdtb3ZlQXV4S2V5cyc6XG4gICAgICAgIGNhc2UgJ2NvcHlBdXhLZXknOlxuICAgICAgICBjYXNlICdjcmVhdGVQcm9wZXJ0eUtleSc6XG4gICAgICAgIGNhc2UgJ3VwZGF0ZVByb3BlcnR5S2V5JzpcbiAgICAgICAgY2FzZSAncmVtb3ZlUHJvcGVydHlDdXJ2ZSc6XG4gICAgICAgIGNhc2UgJ3JlbW92ZVByb3BlcnR5S2V5JzpcbiAgICAgICAgY2FzZSAncmVtb3ZlUHJvcGVydHlLZXlzJzpcbiAgICAgICAgY2FzZSAnbW92ZVByb3BlcnR5S2V5cyc6XG4gICAgICAgIGNhc2UgJ2NvcHlQcm9wZXJ0eUtleXNUbyc6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogSW1wb3J0ZWQgc2tlbGV0YWwgY2xpcHMga2VlcCB0aGUgZHVyYXRpb24gYXV0aG9yZWQgYnkgdGhlIGltcG9ydGVyLiBUaGVpclxuICogZWRpdGFibGUgZXZlbnQvc2V0dGluZ3Mgb3BlcmF0aW9ucyBtdXN0IG5vdCByZWNvbXB1dGUgZHVyYXRpb24gZnJvbSB0aGVcbiAqIGN1cnJlbnRseSB2aXNpYmxlIGV2ZW50IGxpc3QgYW5kIGFjY2lkZW50YWxseSBzaG9ydGVuIHRoZSBzb3VyY2UgY2xpcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFN5bmNBbmltYXRpb25DbGlwRHVyYXRpb24ob3BlcmF0aW9uOiBJQW5pbWF0aW9uT3BlcmF0aW9uLCBpc1NrZWxldG9uOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICFpc1NrZWxldG9uICYmIHNob3VsZFN5bmNDbGlwRHVyYXRpb24ob3BlcmF0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWxsb3dlZFNrZWxldG9uQW5pbWF0aW9uT3BlcmF0aW9uKG9wZXJhdGlvbjogSUFuaW1hdGlvbk9wZXJhdGlvbik6IGJvb2xlYW4ge1xuICAgIHN3aXRjaCAob3BlcmF0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY2hhbmdlU2FtcGxlJzpcbiAgICAgICAgY2FzZSAnY2hhbmdlU3BlZWQnOlxuICAgICAgICBjYXNlICdjaGFuZ2VXcmFwTW9kZSc6XG4gICAgICAgIGNhc2UgJ2FkZEV2ZW50JzpcbiAgICAgICAgY2FzZSAnZGVsZXRlRXZlbnQnOlxuICAgICAgICBjYXNlICd1cGRhdGVFdmVudCc6XG4gICAgICAgIGNhc2UgJ21vdmVFdmVudHMnOlxuICAgICAgICBjYXNlICdjb3B5RXZlbnRzVG8nOlxuICAgICAgICBjYXNlICdhZGRFbWJlZGRlZFBsYXllcic6XG4gICAgICAgIGNhc2UgJ2RlbGV0ZUVtYmVkZGVkUGxheWVyJzpcbiAgICAgICAgY2FzZSAndXBkYXRlRW1iZWRkZWRQbGF5ZXInOlxuICAgICAgICBjYXNlICdjbGVhckVtYmVkZGVkUGxheWVyJzpcbiAgICAgICAgY2FzZSAnYWRkRW1iZWRkZWRQbGF5ZXJHcm91cCc6XG4gICAgICAgIGNhc2UgJ3JlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAnOlxuICAgICAgICBjYXNlICdjbGVhckVtYmVkZGVkUGxheWVyR3JvdXAnOlxuICAgICAgICBjYXNlICdhZGRBdXhpbGlhcnlDdXJ2ZSc6XG4gICAgICAgIGNhc2UgJ3JlbW92ZUF1eGlsaWFyeUN1cnZlJzpcbiAgICAgICAgY2FzZSAncmVuYW1lQXV4aWxpYXJ5Q3VydmUnOlxuICAgICAgICBjYXNlICdjcmVhdGVBdXhLZXknOlxuICAgICAgICBjYXNlICdyZW1vdmVBdXhLZXknOlxuICAgICAgICBjYXNlICdtb3ZlQXV4S2V5cyc6XG4gICAgICAgIGNhc2UgJ2NvcHlBdXhLZXknOlxuICAgICAgICBjYXNlICd1cGRhdGVBdXhLZXlEYXRhJzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbiJdfQ==