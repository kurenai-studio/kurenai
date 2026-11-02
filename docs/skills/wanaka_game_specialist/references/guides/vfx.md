# VFX

Select from [VFX examples](vfx-examples-index.md), copy the source and listed shared
dependencies once, and call the named factory. Start with its inputs and lifetime notes;
inspect implementation details when adapting it. Game code supplies
triggers, poses and end/cancel events; establish those owners in a new game first.

## Authoring order

1. Select the recipe and only the stages the game needs. Flight and confirmed contact,
   anticipation and impact, status hold and release are independently triggered.
2. Read that factory's placement and lifetime notes. Bind its real host, socket,
   receiving plane, endpoints or motion history; do not reuse preview movement or hits.
3. Prepare the selected definitions during scene activation. Reuse them on game events;
   update declared live parameters from game state and stop owned handles on state exit,
   cancellation or despawn. A missed/cancelled flight never creates impact.
4. Adapt texture, palette, density and timing in the copied composition. Structural
   factory choices happen before preparation; handle updates use declared live params.

[Public signatures](../engine-api/vfx.d.ts) cover fields absent from the source.
A copied family can contain several factories and literal texture choices. Selecting one
factory at runtime does not remove the other texture references from compiler asset discovery.
Once the game appearance is chosen, trim unused factories and texture choices in the project
copy, keeping the selected texture's source number, layout and coverage together. Inspect the
compiled asset list; a short effect can still include large atlases. Keep selected textures
as literal `vfxTexture` references rather than dynamically constructing names.

Shared helpers register no default effect; keep their relative imports. When adapting
or combining recipes cannot meet the requirement, author a project-owned `defineVfx`
through `wanaka-studio-engine/vfx` and its public declarations.

`duration` is the authored emission/presentation timeline, not a guarantee that every
particle has disappeared. Existing particles can drain after a non-looping timeline
ends. Use `await handle.finished` for actual completion instead of a timer based on
`effect.duration`. `handle.stop()` lets remaining particles fade;
`handle.stop({ immediate: true })` cuts the remaining presentation.

`build` runs when the definition is prepared. Put gameplay state on `play`:
`position`, `parent`, `source`, `params`, and `setParam`. Do not close over a
value that changes after `defineVfx`.

Gameplay owns motion, collision, damage and state changes. A recipe may supply the
whole visual or complement an existing one; choose according to the requested look.
When replacing presentation, retire superseded visuals and their owned resources.
Feed it actual poses, contacts and state. Keep cosmetic playback separate from game
logic so replacing a visual does not change when an action moves, hits or ends.

For a copied effect with a sampled path, `sample(age, context)` can read the current
play's declared params through `context.param(name)`. For example, declare numeric
`targetX`, `targetY`, and `targetZ` params, read them while sampling the path, and update
them from gameplay with `handle.setParam`. Returned points are effect-local: convert a
world-space hit point into the effect's local space before writing those values.
Freeze the contact values at the gameplay shot event if the effect should retain that shot's
contact. The VFX does not perform collision detection or apply damage. One-argument
samplers remain suitable for authored fixed paths.

One cast that hits many targets is one `play` per target. `position` or
`source` places that play. `params` carries values that differ per target.
Raise `maxInstances` to the number of plays that may overlap.

`createVfxPointSource` samples a moving position and velocity; it does not transfer
rotation. Supply `rotation` explicitly for a committed contact plane. For a marker or
other local presentation that must rotate with a game-owned frame, use an unscaled
`parent` and local placement instead. Keep world-space endpoints in a consistent frame.

For a ground pull field, copy [createGroundVortex](../../examples/vfx/vortex.ts).
Start the vortex and pull query from the same committed activation event and cancel
them together; if the field also presents a windup cue, start and cancel it on that
same lifecycle. The field's intensity changes appearance only; gameplay owns forces
and the exact range.

Await `prepare` for every effect the scene can play while the scene activates.
That is what lets `play` start without compiling shaders mid-game; an effect
prepared later reports a `vfx.late-compile` warning and hitches on first play.

`useVfx` accepts only `{ camera }`. `maxInstances` defaults to 1 and must be an
integer from 1 to 256. Set it to how many copies may overlap. `play` asks
preparation for that count. A preparation that already covers the count is
reused. Call `prepare` with a larger `instances` count before the first `play`
when more copies must stay reserved. A smaller `prepare` is raised to
`maxInstances` on `play`. After the scene is ready that raise compiles again and
reports `vfx.late-compile`, so prepare with the default count (`maxInstances`).

For `fx.particles`, omit `bursts` and `rateOverTime` to fire `capacity` particles once at `delay`.
`capacity` defaults to one. Use `rateOverTime` for a continuous stream. `emission` is brightness;
omitted brightness is 1. In `map`, `vfxTexture('<name>')` supplies a built-in texture's coverage, color
source, color space, and frame grid; set a field explicitly when the layer needs a different
interpretation. Reference every built-in texture by name through `vfxTexture`, in `map` and in
material or look fields as `texture: vfxTexture('<name>')`. Keep the names of the example you
copied; texture variants of one asset group are numbered `<group>-<n>`. `opacityOverLife` or `fade: [inSeconds, outSeconds]` controls alpha,
while `colorOverLife` changes RGB. `secondsCurve` uses the owning part's lifetime.

`rotation` groups particle rotation settings. Omitting it leaves the particle upright. `RANDOM_YAW` is a full-turn random start; a spin without `start` uses that yaw unless `enabled` is false. `mesh` can group geometry and mesh-only settings.
Look callbacks receive typed particle nodes, `ctx.age` in seconds, and `ctx.sampleTexture` for
textures declared by the look. `ctx.position` is in simulation space; `ctx.positionWorld` is the renderer-supplied world-space centre. Use `vfxPlaneClip` for a world receiving plane. It clips particle centres, not pixels or surrounding scene geometry.
`ctx.sampleTexture(name, uv)` returns RGBA at that UV; it does
not select a coverage channel or atlas cell. In a custom `opacityNode`, read the texture's
coverage channel and map atlas UVs explicitly. RGB can remain white where Alpha is zero.
The copied `createMuzzleFlash` in `gunfire.ts` uses one held atlas cell and Alpha.
Coverage channels are texture-specific. Shared curves and `viewFresnel` are listed
in [vfx.d.ts](../engine-api/vfx.d.ts).

`fx.light({ follow })` follows an emitter attachment, the head of a sampled path, an Object3D,
or `{ sample(age) }` in effect seconds. For a body moving inside particle simulation, follow its
matching path rather than its static emitter attachment. Particle simulation and shader offsets
do not move an emitter attachment.

Create appearance variants through the copied recipe factory with distinct ids and its
texture, palette or shape options. Keep common layer construction in that factory; edit
its options when the game needs another supported appearance. Host coatings and recorded
paths retain their own placement contracts. Flight, contact and release
are independent stages triggered by the game. Do not mutate an existing definition.

## Model hosts

Declare `host` in the definition and pass the actual visible model to both
`await vfx.prepare(effect, { host })` and `vfx.play(effect, { host })`.
Use matching geometry/skeleton for preparation. Host plays take neither `parent` nor `source`.
`pose: 'follow'` tracks animation and needs the host until completion; `snapshot`
freezes the play pose. `fit: { height }` sets the authored height for positions/sizes/speeds.
`takeover: 'none'` keeps the model visible; `reveal` hides it during the effect and
shows it at completion; `conceal` leaves it hidden at completion. Early stop restores
visibility. Leave mesh visibility to the effect until finished; gameplay owns removal.

`fx.hostShell` copies host meshes. Its look receives `positionLocal`, `normalLocal`,
`hostUnit` (normalized host bounds), `hostRestUnit` (stable rest bounds for follow),
and `color` (host base color). Use rest coordinates for masks attached through animation.
Shells inherit materials; `vertexColors: false`, roughness and metalness override the copy.
`backdropNode` can sample refraction. `fx.hostPoints` remains on sampled skin;
`mode: 'vertical'`, `pivot: [0.5, 0]` anchors upright cards. Host-shaped particles
leave the skin after spawning. See the selected TS for its mask, placement and lifecycle.

## Playback and tuning

`play` returns a `VfxHandle`. Use `ready` only when later logic needs startup
state, inspect `diagnostics` for stable repair hints, and use `stop()` for a
graceful release or `dispose()` for immediate ownership cleanup. Pass a
gameplay `seed` for replicated cosmetics. Particle state never owns gameplay
truth, damage, scoring, or room state.

`fx.particles` is the layer to copy and edit. Also call:

- `fx.ribbon` for a trail
- `fx.mesh` with `vfxMesh(...)` for one authored mesh
- `fx.light` for a short point light
- `fx.path` for a strip whose centerline follows effect age
- `fx.arc` for a jagged bolt between `origin` and `target`

`flash`, `burst`, `streaks`, `shockwave`, `groundSheet`, `slashSheet`, `plume`,
`motes`, `bolt`, `beam`, `stroke`, and `energyBlade` are shortcuts for one
common layer. Reviewed examples are written with `fx.particles` unless a
shortcut already matches that layer. Use `curve` for size and width, `gradient` for color over life,
and `vfxTexture` for a preset name, builtin name, sheet role, or built-in texture name.
`part.material` is the typed TSL slot written before prepare. Keep effects at
scene metre scale and pass the semantic origin in `position`. Use `parent` or
`source` for a moving point. Pass `host` only when `defineVfx` declares `host`;
that play follows the model and does not take `parent` or `source`.

For multiplayer, trigger cosmetics from committed presentation events and
pass a deterministic seed.

Closed examples (prepare once during scene activation, then retain one controller per cast):

- [frozen enclosure lifecycle](../../examples/vfx-cryo-lifecycle.ts): hold, matched release, pending-handoff cancellation
- [barrier contacts](../../examples/vfx-barrier-contact.ts): raycast geometry, UV contacts, repair, collapse and cancellation
- [doorway lifecycle](../../examples/vfx-portal-lifecycle.ts): per-cast clock, close and cancellation

Basic playback:

- [scene-bound playback](../../examples/vfx-scene-playback.ts): await createCombatVfx during scene activation
- [source follow](../../examples/vfx-source-follow.ts): await createFollowAuraVfx during scene activation
- [host playback](../../examples/vfx-host-playback.ts)

Custom material hooks can use `sampleVfxLookTexture` for bound RGBA textures and `sampleVfxAtlas` for top-row-first atlas sampling with frame interpolation and half-texel cell insets. Supply columns, rows and pixel dimensions explicitly; `getVfxTextureSampling` provides registered library metadata while literal `vfxTexture` references keep asset discovery static. `createVfxAtlasLook` combines sampling with caller-authored palette thresholds and coverage. `sampleVfxCurve` evaluates the same curves as the Engine; `vfxHdrTint` separates HDR tint from emission. `vfxParticleRandom` provides deterministic variation by particle slot. `vfxPlaneClip` supplies hard or soft particle-centre clipping against an explicit world plane; it does not provide scene-depth soft particles or per-pixel clipping.

Position histories use `createVfxPositionHistory` per playback. Continuous high-speed
motion stays connected. For copied projectile/dash trails, increment `breakSerial`
after teleports or network corrections; set `recording=false` at the final point and
let the tail drain. A long sample gap disconnects the next segment. Size preparation
from event rate and visual tail, including overlapping actors. Missing effects under
load can come from rejected handles; their diagnostics identify that boundary.

A recipe's finite demonstration duration is not an event-owned hold. Use
`createCryoHold` for a frozen enclosure with a game-controlled release, and
`createHeldPortal` for a doorway whose close is triggered by gameplay. Read the
adjacent factory notes before choosing a timed or held variant.

Tune texture coverage, timing, scale and density before raising emission.

## Troubleshooting

- An effect that disappears against the scene can have insufficient texture coverage,
  scale or contrast; bloom can mask that weakness. A same-pose comparison with bloom
  disabled can distinguish broad glow from the underlying effect.
- An effect following the wrong pose points to its host, socket, transform ownership
  or motion history.
- Effects surviving cancellation or repeated triggers point to handle lifetime,
  scope cleanup or missing end events.

When appearance is the problem, inspect the affected view and state rather than
inferring the result from a copied recipe or successful compilation.
