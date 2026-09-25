/** Main-process authority for the shared, project-local reference-image configuration. */
import { IReferenceImageAuthorityMutation, IReferenceImageAuthoritySnapshot, IReferenceImageAuthorityStore } from '../common/reference-image';
/**
 * The single writer for the project-local reference-image library. Scene
 * Webviews only submit intents so their independent rendering snapshots can
 * never overwrite another Webview's changes.
 */
export declare class ReferenceImageStore implements IReferenceImageAuthorityStore {
    /** Changes after a main-process restart; it is intentionally not persisted. */
    private readonly instanceId;
    private revision;
    /** Serializes the complete read-modify-write operation, not only the disk write. */
    private mutationQueue;
    getSnapshot(): Promise<IReferenceImageAuthoritySnapshot>;
    mutate(options: IReferenceImageAuthorityMutation): Promise<IReferenceImageAuthoritySnapshot>;
    private mutateLatest;
    private applyMutation;
    private createSnapshot;
}
export declare const referenceImageStore: ReferenceImageStore;
