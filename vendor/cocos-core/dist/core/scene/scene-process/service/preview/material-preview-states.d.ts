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
export declare function omitEmptyMaterialPhaseOverrides(states: unknown): boolean;
