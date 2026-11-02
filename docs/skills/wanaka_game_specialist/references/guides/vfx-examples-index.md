# VFX examples

Match the requested appearance and game event to a recipe below. Check its shape,
host or motion inputs, lifetime and expected concurrency before choosing. Prefer
adapting or combining suitable recipes; a shared name alone is not a match.
Copy the chosen source and its listed dependencies, then follow [VFX lifecycle](vfx.md).
Source files contain placement, live parameters and cancellation notes; default exports
and staged previews are browsing examples.

## Actions and contacts

- Gunfire: [createMuzzleFlash](../../examples/vfx/gunfire.ts) on an unscaled muzzle socket; [createRicochet](../../examples/vfx/gunfire.ts) only at a confirmed contact.
- Biological/elemental hits: [createBloodImpact](../../examples/vfx/elemental-hit.ts), [createIceImpact](../../examples/vfx/elemental-hit.ts), [createElectricHit](../../examples/vfx/elemental-hit.ts), [createAcidImpact](../../examples/vfx/elemental-hit.ts). Blood spray uses local +X; inspect the selected factory's plane. [createCombatFeedback](../../examples/vfx/elemental-hit.ts) is confirmed parry feedback.
- Explosions: [createFireExplosion](../../examples/vfx/explosion.ts) selects atlas or debris and ground/air placement. [createPairedFlipbook](../../examples/vfx/explosion.ts) composes paired bursts. Supply the real floor for debris.
- Pressure fronts: [createShockwave](../../examples/vfx/shockwave.ts), with ground/air placement and optional refraction-only appearance. Forces and hit timing remain game-owned.
- Ground attacks: [createGroundSlam](../../examples/vfx/ground-impact.ts), [createSeismicFront](../../examples/vfx/ground-impact.ts) for configurable fan/line propagation, or separately triggered [createCinderWarning](../../examples/vfx/ground-impact.ts) and [createCinderEruption](../../examples/vfx/ground-impact.ts). Flat-ground recipes.
- Melee: [createMeleeSlash](../../examples/vfx/melee.ts) for authored ice/warm/water arcs in a committed swing plane; [createWeaponTrail](../../examples/vfx/melee.ts) for real bladeBase/bladeTip history. Trigger contact effects separately.
- Projectiles: **complete visuals** — [createFireProjectile](../../examples/vfx/fire-projectile.ts) or [createShadowProjectile](../../examples/vfx/shadow-projectile.ts) follows game-owned motion; each source includes separate muzzle/impact factories. **Add a wake to an existing projectile** — [createProjectileTrail](../../examples/vfx/projectile-trail.ts) records live head positions. **Authored ground path** — [createSteelTempestTravel](../../examples/vfx/wind-projectile.ts) travels along local +X; [createSteelTempestImpact](../../examples/vfx/wind-projectile.ts) supplies confirmed ground contact. Copy the selected source and its listed dependencies; follow its motion and tail-drain notes. Gameplay owns collision and triggers impact only on confirmed contact.
- Lightning: [createChainLightning](../../examples/vfx/lightning.ts) connects 2–9 actual points; [createChainContact](../../examples/vfx/lightning.ts) is independently confirmed. [createVarietyLightning](../../examples/vfx/lightning.ts) supplies ground/air sky strikes.

## Actors and movement

- Model coatings: [createActorStatus](../../examples/vfx/actor-status.ts) selects burn, vulnerable, cleanse or frost-invulnerable. Requires the actual model host. Strength is live; cleanse is finite.
- Status auras: [createPoisonStatus](../../examples/vfx/status-aura.ts), [createLightningAura](../../examples/vfx/status-aura.ts), poison follows the actor anchor; electricity requires the visible animated model as `host` for prepare/play and follows its skin. Both end on state exit. Area poison is a separate field.
- Frozen enclosure: [createCryoHold](../../examples/vfx/ice-prison.ts) holds until gameplay releases; update heldSeconds, then hand off to [createCryoRelease](../../examples/vfx/ice-prison.ts) using cryoReleaseParams. [createCryoFreeze](../../examples/vfx/ice-prison.ts) is the timed version with holdSeconds. Fit the outline to the frozen pose.
- Weapon surfaces: [createWeaponEnchantment](../../examples/vfx/weapon-enchantment.ts) selects fire, poison, frost or electric. Supply the selected visible weapon mesh as host and stop on removal/destruction.
- Barriers: [createEnergyShield](../../examples/vfx/shield.ts) selects wall/dome; [createBarrierBreak](../../examples/vfx/shield.ts) is a separate committed burst. Feed real local/UV contacts; gameplay owns protection.
- Movement: [createContactDust](../../examples/vfx/movement.ts) for light/heavy/directional contact dust, burst or continuous; [createWaterStep](../../examples/vfx/movement.ts) for water; [createDashTrace](../../examples/vfx/movement.ts) for actual head history in a fixed frame. Confirm contact and supply the receiving plane.
- Appear/disappear: [createMeshReformation](../../examples/vfx/appearance.ts), [createHologram](../../examples/vfx/appearance.ts), [createTeleportDeparture](../../examples/vfx/appearance.ts), [createShadowEnvelope](../../examples/vfx/appearance.ts). Supply the actual host; gameplay owns relocation and cancellation.
- Doorways: [createHeldPortal](../../examples/vfx/portal.ts) opens until a game close event; [createDimensionalRift](../../examples/vfx/portal.ts) is a finite/repeating demonstration cycle. Local XY aperture; centre is 1.2 m above anchor.

## Areas and world effects

- Active fields: [createCorrosionPool](../../examples/vfx/field.ts), [createPoisonCloud](../../examples/vfx/field.ts), [createFlowField](../../examples/vfx/field.ts), [createTimeDistortion](../../examples/vfx/field.ts). Select the ground/volume shape, actual radius and lifetime; gameplay owns damage and time scaling. Inspect finite versus looping behaviour.
- Symbols: [createGroundSigil](../../examples/vfx/sigil.ts) for glyphs, rune walls, circles and animated rims. Decorative visual radius is independent of game queries.
- Surface residue: [createSurfaceMark](../../examples/vfx/surface-mark.ts), [createBloodStain](../../examples/vfx/surface-mark.ts). Supply actual receiver/contact; local +Z points outward. Planar blood does not conform to arbitrary geometry. Bound the active mark count; placement notes are in the source.
- Fire: [createCampfire](../../examples/vfx/fire.ts) creates a campfire with selectable flame atlases; [createFlameJet](../../examples/vfx/fire.ts) follows a real nozzle. Actor/weapon fire uses its own host route. Stop emission on extinguish/release and allow old particles to drain.
- Smoke outlets: [createLargeSmoke](../../examples/vfx/smoke.ts), with supported static-smoke variants. Supply a real upright outlet; old particles stay in world space.
- Vortices: [createVortex](../../examples/vfx/vortex.ts) selects projected swirl/debris intake; [createWindFunnel](../../examples/vfx/vortex.ts) selects airy/dark upright funnels. Supply the authored radius/height and game-owned active interval; forces remain gameplay.

Weather uses world environment. Simple shot segments and UI feedback use game
presentation when that directly expresses the need. For a visual
behaviour without a matching recipe, use the public [VFX declarations](../engine-api/vfx.d.ts)
to author a project-owned definition. Reuse game-owned events, coordinates and cleanup.
