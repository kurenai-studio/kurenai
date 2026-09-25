"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omitEmptyMaterialPhaseOverrides = omitEmptyMaterialPhaseOverrides;
/**
 * Removes empty-string `phase` overrides from material pipeline states.
 *
 * Inspector dumps encode an unset effect pass.phase as `PassStatesEditor.phase = ''`.
 * `Pass.fillPipelineInfo` treats any defined phase as an override, and
 * `getPhaseID('')` registers a unique unused render phase. The preview camera
 * never draws that phase, so the mesh disappears after apply.
 *
 * @param states Material `_states` array, a single override record, or unrelated input.
 * @returns Whether any empty phase was removed.
 *
 * @example
 * ```ts
 * const states = [{ phase: '', primitive: 7 }, { phase: 'forward-add' }];
 * omitEmptyMaterialPhaseOverrides(states);
 * // states[0] has no phase; states[1].phase is still 'forward-add'
 * ```
 */
function omitEmptyMaterialPhaseOverrides(states) {
    if (Array.isArray(states)) {
        let mutated = false;
        for (const state of states) {
            if (omitEmptyPhaseFromRecord(state)) {
                mutated = true;
            }
        }
        return mutated;
    }
    return omitEmptyPhaseFromRecord(states);
}
function omitEmptyPhaseFromRecord(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
        return false;
    }
    const record = state;
    if (record.phase !== '') {
        return false;
    }
    delete record.phase;
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwtcHJldmlldy1zdGF0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvcHJldmlldy9tYXRlcmlhbC1wcmV2aWV3LXN0YXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWtCQSwwRUFXQztBQTdCRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxTQUFnQiwrQkFBK0IsQ0FBQyxNQUFlO0lBQzNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3hCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNwQixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLElBQUksd0JBQXdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNuQixDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDRCxPQUFPLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFDLEtBQWM7SUFDNUMsSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzlELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBRyxLQUFnQyxDQUFDO0lBQ2hELElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUN0QixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ3BCLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFJlbW92ZXMgZW1wdHktc3RyaW5nIGBwaGFzZWAgb3ZlcnJpZGVzIGZyb20gbWF0ZXJpYWwgcGlwZWxpbmUgc3RhdGVzLlxuICpcbiAqIEluc3BlY3RvciBkdW1wcyBlbmNvZGUgYW4gdW5zZXQgZWZmZWN0IHBhc3MucGhhc2UgYXMgYFBhc3NTdGF0ZXNFZGl0b3IucGhhc2UgPSAnJ2AuXG4gKiBgUGFzcy5maWxsUGlwZWxpbmVJbmZvYCB0cmVhdHMgYW55IGRlZmluZWQgcGhhc2UgYXMgYW4gb3ZlcnJpZGUsIGFuZFxuICogYGdldFBoYXNlSUQoJycpYCByZWdpc3RlcnMgYSB1bmlxdWUgdW51c2VkIHJlbmRlciBwaGFzZS4gVGhlIHByZXZpZXcgY2FtZXJhXG4gKiBuZXZlciBkcmF3cyB0aGF0IHBoYXNlLCBzbyB0aGUgbWVzaCBkaXNhcHBlYXJzIGFmdGVyIGFwcGx5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZXMgTWF0ZXJpYWwgYF9zdGF0ZXNgIGFycmF5LCBhIHNpbmdsZSBvdmVycmlkZSByZWNvcmQsIG9yIHVucmVsYXRlZCBpbnB1dC5cbiAqIEByZXR1cm5zIFdoZXRoZXIgYW55IGVtcHR5IHBoYXNlIHdhcyByZW1vdmVkLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogY29uc3Qgc3RhdGVzID0gW3sgcGhhc2U6ICcnLCBwcmltaXRpdmU6IDcgfSwgeyBwaGFzZTogJ2ZvcndhcmQtYWRkJyB9XTtcbiAqIG9taXRFbXB0eU1hdGVyaWFsUGhhc2VPdmVycmlkZXMoc3RhdGVzKTtcbiAqIC8vIHN0YXRlc1swXSBoYXMgbm8gcGhhc2U7IHN0YXRlc1sxXS5waGFzZSBpcyBzdGlsbCAnZm9yd2FyZC1hZGQnXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9taXRFbXB0eU1hdGVyaWFsUGhhc2VPdmVycmlkZXMoc3RhdGVzOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGVzKSkge1xuICAgICAgICBsZXQgbXV0YXRlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IHN0YXRlIG9mIHN0YXRlcykge1xuICAgICAgICAgICAgaWYgKG9taXRFbXB0eVBoYXNlRnJvbVJlY29yZChzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbXV0YXRlZDtcbiAgICB9XG4gICAgcmV0dXJuIG9taXRFbXB0eVBoYXNlRnJvbVJlY29yZChzdGF0ZXMpO1xufVxuXG5mdW5jdGlvbiBvbWl0RW1wdHlQaGFzZUZyb21SZWNvcmQoc3RhdGU6IHVua25vd24pOiBib29sZWFuIHtcbiAgICBpZiAoIXN0YXRlIHx8IHR5cGVvZiBzdGF0ZSAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShzdGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCByZWNvcmQgPSBzdGF0ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBpZiAocmVjb3JkLnBoYXNlICE9PSAnJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRlbGV0ZSByZWNvcmQucGhhc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG4iXX0=