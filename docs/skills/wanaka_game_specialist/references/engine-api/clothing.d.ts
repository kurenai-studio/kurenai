// Import from "wanaka-studio-engine/clothing".

import type { LifetimeScope } from "wanaka-studio-engine";
import * as T from "three";
import { type WanaV2Recipe } from "@wanaka/platform/wana-character";

export type { WanaV2Recipe } from "@wanaka/platform/wana-character";

/** Replace clothing on a baked Wana without rebuilding its face, skeleton or animations. */
export function applyWanaClothing(scope: LifetimeScope, host: T.Object3D, input: WanaV2Recipe): void;

/** Tailored clothing details use named bone anchors, and follow exported animations. */
export function dressWanaBody(skeleton: T.Skeleton, r: WanaV2Recipe): void;
