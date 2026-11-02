// Import from "wanaka-studio-engine/pcg-kit-city".
import type { PcgRoleKit, PcgWorldPreset } from "wanaka-studio-engine/pcg-author";
export const roles: readonly ["building.tower", "building.landmark", "facade.storefront", "facade.window", "street.tree", "street.light", "street.bench", "street.vehicle"];
export const PCG_CITY_KIT: PcgRoleKit & { readonly roleContract: { readonly roles: typeof roles } };
export const presets: Readonly<{ natureCity: PcgWorldPreset<"nature-city", "city">; }>;
