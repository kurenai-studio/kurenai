// Import from "wanaka-studio-engine/pcg-kit-cave".
import type { PcgRoleKit, PcgWorldPreset } from "wanaka-studio-engine/pcg-author";
export const roles: readonly ["rock.scan", "rock.cliff", "rock.face", "surface.rock.albedo", "surface.rock.normal", "surface.rock.arm", "surface.ground.albedo"];
export const PCG_CAVE_KIT: PcgRoleKit & { readonly roleContract: { readonly roles: typeof roles } };
export const presets: Readonly<{ limestoneCave: PcgWorldPreset<"limestone-cave", "cave">; }>;
