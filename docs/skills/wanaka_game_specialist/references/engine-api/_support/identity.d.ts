import type { LifetimeScope } from "wanaka-studio-engine";

/**
 * Lazy identity sidecar: NetworkId and SaveKey stay separate namespaces. The
 * native host object is the local runtime identity, AuthoringId remains source
 * metadata, and pure visual Object3D hosts do not need a record.
 */
export interface IdentityRecord {
    readonly networkId?: string;
    readonly saveKey?: string;
}

export interface IdentityBinding {
    readonly networkId?: string;
    readonly saveKey?: string;
}

/** Binds stable network/save namespaces onto a native host object. */
export class IdentityRegistry {
    /** Binds identities until the supplied lifetime scope is disposed. */
    bindScoped(scope: LifetimeScope, host: object, ids: IdentityBinding): IdentityRecord;
    /** Returns the bound record when the host has one. */
    get(host: object): IdentityRecord | undefined;
    /** Releases this RuntimeSession-local identity namespace. */
    dispose(): void;
}
