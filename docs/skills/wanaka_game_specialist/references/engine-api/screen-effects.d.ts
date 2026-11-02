// Import from "wanaka-studio-engine/screen-effects".

import type { LifetimeScope } from "wanaka-studio-engine";
import { type ShaderEffect, type ShaderEffectOptions } from "wanaka-studio-engine/ui-effects";

/**
 * Adds a non-interactive screen cover to the existing viewport overlay container.
 * Use SolidColor for flashes, Stripes for scanlines, and a colored layer followed
 * by LinearWipe/NoiseDissolve for reveals. Animate progress in project code.
 * This covers the game; it does not distort or filter its framebuffer.
 */
export function createScreenEffect(scope: LifetimeScope, overlayContainer: HTMLElement, options: ShaderEffectOptions): ShaderEffect;
