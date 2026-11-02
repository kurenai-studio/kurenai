// Import from "wanaka-studio-engine/pcg-kit-nature".
import type { PcgRoleKit, PcgWorldPreset } from "wanaka-studio-engine/pcg-author";
export const roles: readonly ["tree.canopy", "tree.conifer", "tree.broadleaf", "tree.coastal", "plant.bush", "plant.fern", "rock.boulder", "rock.cliff", "environment.forest"];
export const PCG_NATURE_KIT: PcgRoleKit & { readonly roleContract: { readonly roles: typeof roles } };
export const presets: Readonly<{ temperateNature: PcgWorldPreset<"temperate-nature", "nature">; rockForest: PcgWorldPreset<"rock-forest", "nature">; }>;
