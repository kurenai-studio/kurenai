// Import from "wanaka-studio-engine/npc".

import type { LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler, FrameStep } from "wanaka-studio-engine";

/** JSON values captured from a game-owned observation of an NPC. */
export type NpcDecisionValue = string | number | boolean | null | readonly NpcDecisionValue[] | {
    readonly [key: string]: NpcDecisionValue;
};

/** A bounded action a decision port is allowed to choose. */
export interface NpcDecisionCandidate<ActionId extends string = string> {
    readonly id: ActionId;
    readonly description: string;
}

/** One structured choice request. The state is game-owned and JSON-safe. */
export interface NpcDecisionRequest<ActionId extends string = string> {
    readonly goal: string;
    readonly state: {
        readonly [key: string]: NpcDecisionValue;
    };
    readonly candidates: readonly NpcDecisionCandidate<ActionId>[];
    readonly epoch: number;
}

/** Decision-port response after the candidate id has been validated by the host. */
export interface NpcDecisionReceipt<ActionId extends string = string> {
    readonly action: ActionId;
    readonly confidence: number;
    readonly probabilities: Readonly<Record<ActionId, number>>;
    readonly model?: string;
}

/** Host-owned decision port. Credentials and network access stay outside game code. */
export interface NpcDecisionPort {
    choose<ActionId extends string>(request: NpcDecisionRequest<ActionId>, signal?: AbortSignal): Promise<NpcDecisionReceipt<ActionId>>;
}

/** One decision source, useful for telemetry and deterministic fallback testing. */
export type NpcDecisionSource = 'rules' | 'decision' | 'jev';

/** Current action receipt exposed for diagnostics and UI. */
export interface NpcActionReceipt<ActionId extends string = string> {
    readonly action: ActionId;
    readonly source: NpcDecisionSource;
    readonly confidence: number;
    readonly epoch: number;
}

/** Configuration for a scope-owned, fixed-step NPC decision loop. */
export interface NpcControllerOptions<ActionId extends string = string> {
    readonly goal: string;
    readonly candidates: readonly NpcDecisionCandidate<ActionId>[];
    readonly observe: () => {
        readonly [key: string]: NpcDecisionValue;
    };
    readonly chooseFallback: (state: {
        readonly [key: string]: NpcDecisionValue;
    }, candidates: readonly NpcDecisionCandidate<ActionId>[]) => ActionId;
    readonly apply: (action: ActionId, step: FrameStep) => void;
    readonly decisionPort?: NpcDecisionPort;
    /** Minimum decision-port confidence accepted before the local rule remains active. */
    readonly minConfidence?: number;
    /** Seconds between remote consultations. Defaults to one second. */
    readonly consultationIntervalSeconds?: number;
}

/**
 * Drives a character or navigation policy without putting an AI provider in
 * the fixed-step loop. Rules always provide an action; an optional decision
 * port may replace it after a validated, bounded choice arrives from the host.
 */
export class NpcController<ActionId extends string = string> {
    private constructor();
    /** Creates a controller whose scheduler hook and pending requests are scope-owned. */
    static create<ActionId extends string = string>(scope: LifetimeScope, scheduler: PhaseScheduler, options: NpcControllerOptions<ActionId>): NpcController<ActionId>;
    /** Most recently applied action, or null before the first fixed step. */
    get action(): NpcActionReceipt<ActionId> | null;
}
