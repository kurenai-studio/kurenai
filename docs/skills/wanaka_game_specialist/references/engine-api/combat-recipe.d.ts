// Import from "wanaka-studio-engine/combat-recipe".

import { type CombatAction } from "wanaka-studio-engine/action-combat";

export type CombatMoveRole = 'attack' | 'defense' | 'dodge' | 'reaction' | 'get-up';

export interface CombatMove extends CombatAction {
    readonly role: CombatMoveRole;
    readonly probes: readonly string[];
    readonly damage: number;
    readonly staminaCost: number;
    readonly guardCost: number;
    readonly stagger: number;
    readonly pushSpeed: number;
    readonly hitStop: number;
    readonly unblockable: boolean;
}

/** Project-owned literal recipe; animation identity is never inferred from a label. */
export interface CombatRecipe {
    readonly id: string;
    readonly version: number;
    readonly mode: 'unarmed' | 'sword' | 'dagger' | 'staff';
    readonly health: number;
    readonly stamina: number;
    readonly staminaRecovery: number;
    readonly staggerThreshold: number;
    readonly staggerRecovery: number;
    readonly downSeconds: number;
    readonly guardHalfAngle: number;
    readonly reaction: string;
    readonly getUp: string;
    readonly moves: readonly CombatMove[];
}

/** Shared runtime/IDE validation and detached immutable recipe data. */
export function defineCombatRecipe(recipe: CombatRecipe): CombatRecipe;

/** Starter tuning for the bundled motion pack; projects persist and edit the returned literal. */
export function createMeleeRecipe(mode?: CombatRecipe['mode']): CombatRecipe;
