// Import from "wanaka-studio-engine/pcg-kit-underwater".
import type { PcgRoleKit } from "wanaka-studio-engine/pcg-author";
export const roles: readonly ["reef.coral", "reef.rock", "plant.kelp", "fauna.fish", "fauna.ray", "landmark.cave", "landmark.wreck", "lighting.caustic"];
export const PCG_UNDERWATER_KIT: PcgRoleKit & { readonly roleContract: { readonly roles: typeof roles } };
