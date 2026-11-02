# Genre: first-person and third-person shooter

Viewpoint is selected separately from the match route. Both views share the match, weapon, Bot, hitscan, shot-transaction, aim, reticle, recoil, shot-path, and post-commit feedback contracts. The first-person table shows those shared shot layers plus first-person-only viewmodel presentation; requirements that name a viewmodel or camera-child pose apply only to first-person. Third-person applies the shared shot rules plus the extra view obligations in this file — not a second copy of the table. [default-third-person-character.ts](../../examples/default-third-person-character.ts) is the unspecified-appearance locomotion starter. [third-person-character.ts](../../examples/third-person-character.ts) is the compositor for an already loaded model. Neither is a third-person shooter.

## Choose one match route

| Route | Match structure | Required boundary checks |
| --- | --- | --- |
| `short-duel` | rounds in a compact combat space | round reset, simultaneous defeat, final result |
| `arena-deathmatch` | repeated combat and kill scoring | attribution, respawn safety, time/tie policy |
| `objective-shooter` | one capture, escort, plant, or control rule | prerequisites, contest, interruption, timeout |
| `gun-ladder` | kills advance a bounded weapon sequence | idempotent advancement and final-stage rules |

These four routes are default match structures for standalone arena or match shooters. **When the request is a Shooter RPG / First-Person or Third-Person RPG — including when a short prompt only names a role-playing franchise, sequel, or style that uses guns (such as *Cyberpunk*, *Fallout*, *Starfield*, *Mass Effect*, *Borderlands*, or *Deus Ex*, even without the word "RPG") — you MUST load BOTH [RPG](./genre_rpg.md) AND this guide (`genre_fps_tps.md`)**: `genre_rpg.md` owns the role-playing world/NPC/dialogue-check stage, attribute/perk/cyberware/gear progression, and unified `C/I/K/J/Esc` menus, while this guide MUST still be applied in full for the shooting feel (first-person viewmodel or third-person over-shoulder camera, Pointer Lock, hip/ADS FOV and spread, recoil, `--wk-reticle-gap` reticle, frozen eye-ray shot transaction, and hit feedback). Never reduce a shooter RPG to a bare single-mission arena shooter, and never drop this guide's gunplay feel when building a shooter RPG. For a standalone match shooter, do not combine multiple score, respawn, objective, or weapon-progression rules in the first slice unless one match-result authority is declared.

Before implementation, select the view, match route, human/Bot policy, weapon and hit model, map form, promised devices, HUD, and exact result condition. Keep all damage, fire rate, magazine, movement, reaction, vision, score, and map values in a named project profile; this guide provides no numeric defaults.

When a route has teams, declare target eligibility, ally filtering, friendly fire, and spawn protection during shot validation.

Visual Profile ownership is the Visual Style section of [render-pipeline.md](./render-pipeline.md#visual-style). The first shooter slice MUST keep the player, weapon/viewmodel, floor, first target, and first live opponent readable against the background in the spawn view and shadowed areas. Author key/fill/environment and renderer exposure; a named preset or quality tier is not a lighting solution. If contact shadows crush dark materials, start Medium/Low or an explicit pipeline; runtime rechecks follow the system policy. When grounded combatant appearance is unspecified and stylized default characters fit the game's tone, load `WANAKA_DEFAULT_CHARACTER` (and `wanaka-studio-engine/default-characters/*` for opponents) through `model3DLoader`, pass its `clipNames` into `attachAnimatedModelInstance`, and bind that presentation with `{ model }`; for realistic, military, or tactical shooters where stylized cartoon default bodies would clash, source a theme-matching biped combatant via `search_native_assets` or `generate_game_asset` + `prepare_character`. A visible locomotion capsule or untextured block is not a finished combatant unless that is the requested style.

## Product and match contract

The minimum loop is: enter or choose a loadout, start clearly, move and aim, fire with an explainable hit or miss, advance a kill or objective, settle the match once, and restart cleanly. A moving weapon showcase is not a complete shooter. Encounter distance stays inside the selected weapon's useful range.

Desktop relative look MUST use Pointer Lock and the start/pause/resume coupling in [input-handling.md](./input-handling.md). An uncaptured look path is not the finished desktop game. The playing overlay has no buttons. Escape pauses, shows the pause menu, and releases the lock. A click on the game surface or Continue requests the lock, hides that menu, and resumes; that click does not fire. Pause-menu copy is Paused and Continue; it does not explain lock or mouse capture.

One reducer owns preparation, countdown, combat, round settlement, match settlement, score/objective, and result. Pause freezes weapon clocks, projectiles, Bot state, objectives, respawns, and settlement. A committed result rejects later damage, score, death, and objective events.

Every shot has a stable identity and follows one transaction:

1. Validate phase, actor, weapon state, and resources.
2. Freeze origin and direction from authoritative aim state after this frame's look.
3. Resolve the nearest hitscan owner or create one scoped projectile.
4. Commit damage once, then death, attribution, score/objective, and presentation.

Dead actors, expired projectiles, and actors from an old run cannot block or damage the current match. Hiding the mesh is not that exclusion: follow [physics.md](./physics.md).

## Playable feel

This guide does not ship magnitudes. The first playable loop MUST still be learnable:

- Planar speed approaches and leaves the profile cap; it does not jump to rest or full speed unless the brief names that.
- Mouse look is linear with captured pointer delta. Do not add a custom mouse-acceleration curve unless the brief names it.
- A finished desktop shooter exposes look sensitivity and field of view. A first slice MAY keep those as profile constants until the brief names settings.
- Fire audio, muzzle flash, a hit marker, and a hit sound that exist share this shot's identity.
- Recoil is either repeatable from the same shot or declared random; do not mix both without saying so.
- Respawn safety: the player is not overlapping a live enemy, a kill volume, or an immediate fatal drop.

A mission briefing, compass, or other orientation chrome is optional.

## Controls, view, and weapon state

All devices feed one movement, aim, and action path. Position, facing, aim, camera, weapon state, damage, and result each have one writer.

Pointer look writes the submitted camera (or its yaw/pitch pivots) in `update`. Touch look rates MAY integrate in `fixedInput` into that same look state. Do not leave pointer look on a head node and touch look on the camera as two finished look paths. Captured look geometry, signs, and the orbit versus over-shoulder hierarchy are [camera.md](./camera.md).

Camera-relative WASD and its signed movement probe follow [camera.md](./camera.md); do not hand-roll a second yaw/sine/cosine basis or use `up x forward`. Because browsers consume the first `Escape` key press to exit Pointer Lock without firing `keydown`, open the pause menu on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) so a single `Escape` press opens pause ([input-handling.md](./input-handling.md)).

The scheduler runs every `fixedInput` step before `update`. Freeze the eye ray only after this frame's look is on the submitted camera. If any look writer still runs in `update` (pointer look, or mixed pointer and touch), freeze in `update` after that look. If fire is consumed in `fixedInput` while look still writes in `update`, latch the fire edge or frozen ray in `update` after look. Freeze in the same `fixedInput` step only for touch-only look, with no pointer look still pending in `update`.

A weapon minimally supports ready, fire or dry-fire, and cooldown. If magazines, reload, switching, or sprint cancellation are selected, define their start, commit, cancellation, and completion boundaries. HUD only projects committed weapon state. Per-frame HUD projection MUST avoid unconditional DOM/style writes and string formatting: cache the last committed value and mutate only when it changes. Preserve object pools and render settings while diagnosing FPS; measure frame-time attribution before changing them, and report the evidence for any performance fix.

Touch support requires a complete layout: movement plus an independent look surface or second stick, reachable one-shot action buttons, non-overlapping hit regions, cancellation/focus recovery, safe-area and resize behavior, and no Pointer Lock dependency. Aim assist, when selected, must declare device scope, target filtering, obstruction, angular/range bounds, strength, and an off path. It adjusts the shared aim state before the shot and never bends an already committed shot through a blocker.

## Third-person view

A third-person shooter keeps a visible body. The default view is over-shoulder: the submitted camera sits behind the back on the look axis with a lateral offset so that body stays beside the reticle, not on it. Look writes yaw and pitch; body yaw follows that look (`facing.kind: 'forward'` with the camera planar forward) unless the brief names locomotion-facing (`facing.kind: 'movement'`) or a two-state split (locomotion versus aim-strafe). The visible pivot writes facing only and never writes player position.

That body MUST present locomotion, aim, fire, hurt, and death as distinct readable states. When grounded appearance is unspecified and stylized default characters fit the game's tone, start from `WANAKA_DEFAULT_CHARACTER`, pass `WANAKA_DEFAULT_CHARACTER.clipNames` into `attachAnimatedModelInstance`, and bind that presentation with `{ model }`; for realistic, military, or tactical shooters where stylized cartoon default bodies would clash, source a theme-matching biped combatant via `search_native_assets` or `generate_game_asset` + `prepare_character` and bind that attached model the same way. A visible locomotion capsule or untextured block MAY present those states only when that treatment is the requested style and each commit is still visually distinct. A still T-pose after those commits is not a finished combatant. Skinned move/aim/fire/hurt/death clips are the finished body, not a first-slice requirement; when using them, follow [Character models](assets.md#character-models) for clip mapping and animation ownership.

A live hit on that actor is a short flash that recovers, this shot's hit sound, and a short reticle marker. Miss, dead-target reject, and duplicate-damage reject do not trigger them. This player's committed hurt is a red screen border and a short camera shake.

Follow, leftover-frame presentation, and enclosure obstruction stay with that camera guide. Obstruction MAY shorten the over-shoulder offset. Aiming MAY pull the camera closer and farther off the reticle line. In either case the follow target's own body MUST NOT fill the sight picture. Derive this shot's aim point from camera/reticle state, then test muzzle-to-aim-point obstruction; a near wall wins over the reticle target. Those rays decide this shot. Hover reticle color uses only the look ray.

View switching is an explicit ownership handoff of look, facing, and shot origin.

## First-person shot presentation

Look-axis ownership stays with that camera guide. Overlay mount and pointer-transparent HUD stay with the input guide. Aim blend and recoil that write look state run with the look writer; viewmodel pose, flash, optional shot streak, and reticle project in `preRender` or overlay update from committed state.

Each shot has one simulation origin: the frozen eye ray from the submitted camera. Hitscan, spread, and damage read only that origin. A visual origin MAY be a muzzle node; otherwise it is the same eye origin. Flash, any simple gameplay-owned shot streak, and impact that exist MUST end at that ray's committed hit or range end. Near a wall, keep the simulation origin on that eye ray; do not retarget it to the barrel.

Hip/aim FOV and the look-scaling tangent ratio use vertical `PerspectiveCamera.fov`. A player-facing horizontal FOV number is not `camera.fov` until converted.

A first-person route MUST ship the simple column. Construct the advanced column when the brief names it.

| Layer | MUST — simple | MAY — advanced |
| --- | --- | --- |
| Viewmodel | Child of the submitted camera; one hip local pose; muzzle along the look axis; hide a world-space body from this camera without removing its collision or hit owner | Hip and aiming local poses with one aim amount; bob and sway as local offsets from grounded planar speed; keep the weapon readable when world field of view changes; hide or push back when the muzzle sits in a wall |
| Reticle | Overlay `.wk-reticle` at screen center with `hudElement()` on `context.viewport.overlayContainer`; not a world object; the look's `--wk-reticle-color` stays `#fff`; play writes `--wk-reticle-gap` (fire held grows the look default, release recovers, aiming collapses it); do not scale the element; non-interactive regions stay pointer-transparent | Set `--wk-reticle-color` while the look ray is on a live actor; aiming MAY replace the overlay with the sight picture |
| Aim | Freeze origin and direction from the submitted camera; desktop hold-to-aim on the right mouse button; one aim amount drives field of view, viewmodel pose, and spread; look scaling uses the ratio of the tangents of half the current and hip fields of view | Hold versus toggle once declared; sprint, reload, and switch cancel aiming when those actions exist |
| Recoil | After freeze, the shared look pitches up, then recovers so the next shot uses the kicked aim | Viewmodel kick as a local impulse that returns; a short field-of-view punch that recovers; camera kick, gun kick, and punch share this shot's identity |
| Shot path | Impact at the committed hit or range end; a miss or range end is not a hit on an actor | Muzzle flash parented to the muzzle node after freeze; an optional short pooled line segment from visual origin to that same point; bound those pools before committing a shot |
| Hit feedback | After live-target damage commit: reticle marker, actor flash, hit sound; none on miss, dead-target reject, or duplicate-damage reject. Not combat text. This player's hurt is a red screen border and a short camera shake. Feedback MUST NOT apply damage or write pose | A kill marker on that same commit; a reticle pulse; a distinct headshot marker; blood or flinch; knockback or stagger through the pose owner; hurt direction on the overlay; a camera punch on a kill |
| Death | After the death commit, the actor is no longer a live combatant and reads as downed (hide, freeze, or a simple collapse pose); live collision and query volumes follow [physics.md](./physics.md) | Scoped `Ragdoll`: asleep until that death commit, then `wake()`; locomotion no longer writes that presentation |

Construct only named MAY cells. Do not restate the MUST column. Constraints the table does not already state:

- A second aiming pose seats a sight on the look axis, or moves the weapon onto that axis when there is no sight.
- Bob drops or stops in air; aiming reduces bob. Aim pose, bob/sway, viewmodel FOV/scale, viewmodel kick, and FOV punch are presentation-only: they MUST NOT write look or the frozen shot, create a second aim camera, or make viewmodel FOV follow world FOV one-to-one; kicks and punches MUST recover.
- Reticle stays visible every frame. Do not scale or transform the reticle to fake spread; only `--wk-reticle-gap` moves the ticks. Fire is a separate one-shot. Suppress the browser context menu while a mouse button holds aim.
- With no muzzle node, flash and any optional shot streak start at the frozen eye origin. Define pool exhaustion before committing a shot. The streak MUST end at that frozen ray's committed point, never retargeting another point.
- Reticle marker is a short cross or four ticks; actor flash recovers to that body's color; knockback uses the pose owner in [physics.md](./physics.md). Scoped `Ragdoll` from [physics.md](./physics.md) and [ragdoll.ts](../../examples/ragdoll.ts) MUST NOT share bones with locomotion or run on a living actor. Do not add `ragdoll.ts` as a project module.

## Bot fairness and level truth

A Bot receives bounded sight/noise observations, waits through a measurable reaction, commits an action, forgets stale observations, investigates, recovers, and handles navigation failure explicitly. It does not track a live player reference through walls.

Sight combines range, direction, and the nearest physics blocker. Noise is an immutable event with identity, position, category, time, and expiry. Difficulty may change reaction, accuracy, burst policy, or risk; it must not bypass obstruction, weapon state, damage idempotency, or result lock.

Visible geometry, physics blockers, navigation blockers, hitscan obstruction, cover, objectives, and traversable routes must describe the same level. A moving door or cover change updates every affected spatial system. Objective transactions reject unmet prerequisites without partial progress and settle contest, interruption, simultaneous completion, and timeout deterministically.

## Troubleshooting

- A Start/Resume gesture firing a weapon, Escape immediately re-locking, or stale look while uncaptured points to Pointer Lock and gameplay-input ownership. An in-flight request is not lock loss.
- Reversed movement relative to the view suggests a camera-basis mismatch; [camera.md](./camera.md) describes the signed probe. A changed yaw alone does not establish direction labels.
- A viewmodel disappearing during aim or recoil points to parenting, FOV, and camera ownership. Reticle spread that does not grow on held fire, recover on release, or narrow while aiming points to the presentation's connection to weapon state.
- A hit through a nearby wall, damage to a dead target, or duplicate damage points to the committed ray, obstruction ordering, target filtering, and hit identity. Hit markers, flashes, audio, and impact placement should follow the same commit.
- Third-person self-occlusion or an impact away from the aim point points to the shoulder camera, obstruction shortening, and camera-to-weapon ray relationship.
- Weapon rejection, cancellation, or switching that disagrees with HUD/audio points to multiple owners or presentation preceding commit. Additional presentation layers matter only when the brief selects them.
- A bot seeing through walls, chasing expired noise, or remaining stuck after target loss points to perception, memory expiry, and navigation failure handling.
- Incorrect death attribution, repeated results, or actors surviving respawn/rematch points to result latches and round-owned cleanup.
- Touch controls interfering with each other can come from overlapping move/look/button regions, repeated action edges, missed `pointercancel`, or stale coordinates after resize. Trace the affected device path rather than treating all devices as a test suite.

## Implementation

### Player, aim, and camera ownership

Character-driven shooters use the `CharacterController` contract in [physics.md](./physics.md) for the player. A walking hostile that must slide on ground, slopes, stairs, or character collision uses that contract too. Flying enemies, turrets, and simple kinematic hostiles keep project-owned pose and heading plus a pose-derived hit volume; do not give them a grounded CharacterController. Match reset and respawn use `reset()` on each CharacterController; `teleport` is the immediate pose write when the project does not need that queued barrier. Planar movement and shot direction follow [camera.md](./camera.md). Submit one `control(intent)` per CharacterController per fixed step; the compile-checked camera-relative player mapping is [third-person-character.ts](../../examples/third-person-character.ts). World-space grounded-bot chase, patrol, and facing are [character-ai.ts](../../examples/character-ai.ts). The first promised interaction is the first live target or objective point.

First-person and the default over-shoulder view use a scene-rooted look rig. `preRender` copies its position from the character anchors. The Character root publishes position and facing and is not an ancestor of the rig. Turn the capsule with `facing: { kind: 'forward' }` and the camera's planar world forward, as in [camera.md](./camera.md).

- First-person: [first-person-look.ts](../../examples/first-person-look.ts) is the sole yaw and pitch writer on the submitted camera. Camera position follows `anchors.eyes`. The viewmodel is a child of that camera with a project-owned local pose.
- Over-shoulder: the yaw pivot is the sole yaw writer and the pitch pivot is the sole pitch writer. The camera is a child of the pitch pivot; its local offset sits behind the back and off the reticle. Yaw-pivot position follows `anchors.eyes`. The visible body stays on the character presentation and does not write player position or the look.

Orbit look around the body does not use this parenting. That camera is scene-rooted and MUST NOT sit under the yaw/pitch rig.

### Hitscan and projectile boundaries

Gameplay hitscan, Bot sight, and cover follow the hit, pick, and sight contract in [physics.md](./physics.md). Pass every shooter- or observer-owned `RigidBody` in `castRay` `ignore`. If head and body are selected, resolve the split in the same damage commit from the hit point versus that pose. [physics-basics.ts](../../examples/physics-basics.ts) `pickCrate` attributes this crate through `hit.body`; do not copy it as the shooter.

Scoped physical projectiles use the public body and contact APIs in [physics.md](./physics.md). Resolve repeated or simultaneous contacts through one projectile identity; dispose the projectile on hit, expiry, or result lock. Bound projectile and presentation pools and define exhaustion behavior before committing a shot.

### Bot perception and navigation

A walking hostile that must slide on ground, slopes, stairs, or character collision is a character: give it a `CharacterController` and submit one `control(intent)` per fixed step. Behavior owns target selection; the controller owns the root. World-space chase, patrol, and facing are [character-ai.ts](../../examples/character-ai.ts). Waypoint following is [character-navigation.ts](../../examples/character-navigation.ts).

Flying enemies, turrets, and simple kinematic hostiles keep project-owned pose and heading. Hits and sight against those actors use a pose-derived Sphere or Box3, not a grounded CharacterController capsule.

Use `NavigationAgent` and [navmesh-walk.ts](../../examples/navmesh-walk.ts) only when that agent exclusively owns an ordinary `Object3D` that is not a character root. A `NavigationAgent`, `CharacterController`, and rigid body MUST NOT write the same transform. Navigation rotation and combat aim MUST NOT write the same transform. A no-progress watchdog stays project-owned.

A turret or other non-character object that still needs a project-owned heading MUST point local `+Z` at the planar target (`Math.atan2(dx, dz)` with yaw 0 facing world `+Z`). MUST NOT apply a blanket `rotation.y = Math.PI` or 180° Y to face the camera. Sight forward is that same local `+Z` (`Object3D.getWorldDirection`, not `Camera.getWorldDirection`). Axes: [camera.md](./camera.md).

For sight, prefilter with distance and facing, then `castRay` the complete eye-to-target vector with every observer-owned `RigidBody` in `ignore`. A CharacterController is not a `RigidBody`. Accept only when no closer registered blocker exists. Store observation identity, sample time, last-known position, and transition reason. Noise events contain a frozen position and expiry, not a live player reference.

### Reset

A reset clears the shooter match reducer, shot and damage identities, weapon state, Bot state, score/objective/result, and transient camera/input state. Apply the body and scope teardown rules from [physics.md](./physics.md). Each CharacterController uses `reset()` for that respawn barrier; project-owned Object3D hostiles restore pose in project code. State surviving into another match or resource counts growing on restart points to incomplete teardown.
