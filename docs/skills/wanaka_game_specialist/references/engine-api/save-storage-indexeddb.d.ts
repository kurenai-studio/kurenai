// Import from "wanaka-studio-engine/save-storage-indexeddb".

import type { SaveDocument, SaveStorage } from "wanaka-studio-engine/persistence";

/**
 * The production browser save storage: one IndexedDB database with one
 * object store keyed by slot name. The native factory is injected so each
 * browser or export host controls the storage environment it owns.
 */
export class IndexedDbSaveStorage implements SaveStorage {
    constructor(indexedDb: IDBFactory);
    read(slot: string): Promise<unknown>;
    write(slot: string, document: SaveDocument): Promise<void>;
    remove(slot: string): Promise<void>;
    /** Closes the underlying database connection. */
    dispose(): Promise<void>;
}
