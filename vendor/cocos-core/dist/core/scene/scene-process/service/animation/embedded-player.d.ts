import { AnimationClip } from 'cc';
import type { IAnimationEmbeddedPlayerDump, IAnimationEmbeddedPlayerGroup } from '../../../common';
export declare function queryEmbeddedPlayerGroups(clip: AnimationClip): IAnimationEmbeddedPlayerGroup[];
export declare function ensureEmbeddedPlayerGroups(clip: AnimationClip): IAnimationEmbeddedPlayerGroup[];
export declare function replaceEmbeddedPlayerGroups(clip: AnimationClip, groups: IAnimationEmbeddedPlayerGroup[]): void;
export declare function dumpEmbeddedPlayers(clip: AnimationClip): IAnimationEmbeddedPlayerDump[];
export declare function dumpEmbeddedPlayable(playable: unknown): IAnimationEmbeddedPlayerDump['playable'];
export declare function addEmbeddedPlayer(clip: AnimationClip, dump: IAnimationEmbeddedPlayerDump): Promise<boolean>;
export declare function deleteEmbeddedPlayer(clip: AnimationClip, dump: IAnimationEmbeddedPlayerDump): Promise<boolean>;
export declare function updateEmbeddedPlayer(clip: AnimationClip, oldDump: IAnimationEmbeddedPlayerDump, newDump: IAnimationEmbeddedPlayerDump): Promise<boolean>;
export declare function clearEmbeddedPlayers(clip: AnimationClip, group?: string): Promise<boolean>;
export declare function addEmbeddedPlayerGroup(clip: AnimationClip, group: IAnimationEmbeddedPlayerGroup): boolean;
export declare function removeEmbeddedPlayerGroup(clip: AnimationClip, key: string): Promise<boolean>;
export declare function serializeEmbeddedPlayersForMeta(clip: AnimationClip): {
    begin: number;
    end: number;
    reconciledSpeed: boolean;
    editorExtras: {
        group: any;
        displayName: any;
    };
    playable: import("../../../common").IAnimationEmbeddedPlayable | undefined;
}[];
export declare function replaceEmbeddedPlayers(clip: AnimationClip, players: IAnimationEmbeddedPlayerDump[]): Promise<boolean>;
