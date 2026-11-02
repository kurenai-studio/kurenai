# Optional gameplay preset: Action Combat

## Scope and control forms

`action-combat` owns direct-control real-time melee/skill encounters, attack/defense timing windows, hit/damage transactions, enemy/boss combat patterns, and point-to-move or camera-relative combat locomotion. **When the game is an Action RPG — including cross-genre action, monster-hunting, or soulslike RPGs (such as *The Witcher*, *Elden Ring*, *Sekiro*, *Black Myth*, or *Monster Hunter*, even when the prompt does not literally say "RPG") — you MUST load BOTH [RPG](./genre_rpg.md) AND this file (`genre_rpg_action_combat.md`)** so the game combines RPG progression, NPC/quest staging, and unified character menus with responsive melee/skill combat feel. You can also compose this preset with [Roguelike](./genre_roguelike.md) for room-based action roguelikes/roguelites, or with [Adventure and exploration](./genre_adventure_exploration.md) and [3D platformer](./genre_3d_platformer.md) for 3D or 2D/2.5D action-adventure games.

It is not interchangeable with automatic-attack [Top-Down Survivors](./genre_roguelike_topdown_survivors.md) merely because both may use an elevated camera: manual skill casting, point-to-move pathfinding, and itemized loot/affix builds belong here.

Choose one control form before implementation:

| Control form | Typical subgenres | Required ownership |
| --- | --- | --- |
| `over-shoulder-keyboard` | 3D soulslike, character-action combo, open-world action RPG, third-person action-adventure | one movement owner, one semantic-facing owner, one camera owner and an explicit target/lock-on policy |
| `fixed-camera-point-to-move` | isometric / top-down hack-and-slash loot ARPG (click-to-move + hotbar skills) | one destination transaction and one final transform owner; no hidden keyboard writer |
| documented hybrid | top-down WASD + cursor-aim skills, or 2D/2.5D side-plane action combat | named transfer conditions, cancellation rules and one writer after every transfer |

For an underspecified standalone action-combat slice, start with `over-shoulder-keyboard` and a connected combat route with standard foes, a progression or loadout beat, and a boss encounter. When composed with [RPG](./genre_rpg.md) or [Adventure and exploration](./genre_adventure_exploration.md), follow the host genre's world layout, quest/narrative structure, and character/equipment progression systems.

## Encounter state

Profile, quest/world, inventory/equipment, skill progression, reward identity, reset policy, and persistence are owned by [RPG](./genre_rpg.md), [Roguelike](./genre_roguelike.md), or the host game. This preset adds only the encounter layer: actors, action instances, the contact ledger, enemy and boss actions, any encounter gate, and local cleanup. Presentation derives from committed encounter state.

Where a project uses gated areas or boss arenas, populate the route with spatially placed enemy packs/camps (standing packs with proximity aggro rather than timed arena wave spawners), open gates/seals from committed conditions (such as a quest key, mechanism, or cleared camps), and settle a boss outcome once.

A character sheet, inventory, skill tree, dialogue, or result overlay is an activity state rather than a second pause owner. On retry or checkpoint respawn, the encounter layer clears commands, destination, action buffer, contact/damage ledgers, transient actors, boss state, camera mode, and overlays while preserving durable RPG progression, opened shortcuts/seals, and defeated bosses (with regular camps either staying cleared in dungeon RPGs or respawning on shrine rest in soulslikes) as declared by the host game.

## Action and damage authority

### Skeletal melee primitives

For a reusable humanoid encounter, start with
[`melee-encounter.ts`](../../examples/melee-encounter.ts) and the generated
`references/engine-api/melee-combat.d.ts` and
`references/engine-api/combat-recipe.d.ts` signatures.
The bundled free CMU motions provide unarmed punches/kicks and weapon slashes;
guard, dodge, reaction and get-up support clips are original authored poses.
Sword, dagger and staff recipes currently share the swordplay motion family;
weapon geometry supplies the actual reach, not a label-based hit radius.
This is not Overgrowth's animation library, procedural controller or a promise
of matching its final visual quality.

Persist the complete `defineCombatRecipe({...})` literal in `game/combat/*.ts`,
then pass that export as the fourth argument to `createMeleeMotionPack` in Play.
The Studio Melee Combat toolbox edits that same source with conflict-checked
transactions. Computed recipes remain source-only. The existing model loader
owns the GLB instance, material and texture resources. Pass fresh rest-pose
models with a feet-origin meter-scaled root and calibrated local +Z forward.
Use `WANA_COMBAT_RIG` for the Wana base-v2 skeleton, `VROID_COMBAT_RIG` for the
named VRoid mapping, or an explicit `CombatRigMap` for another humanoid.
Missing bones or clips are errors, not permission to substitute an idle clip.
Mount the real weapon below the mapped right hand with the existing equipment
pipeline before calling `createMeleeProbes`; preserve its socket calibration.

`CombatArena` owns the visible mixer and fixed-step damage transaction.
Do not attach another animated-model mixer or transform writer to the same root.
`createCombatCharacterMotor` is its sole CharacterVirtual movement owner;
root travel is a motor command, so collision resolution can shorten it.
Knockdown removes that character and switches to an eleven-body constrained
ragdoll. Recovery waits for reachable footing, removes the physical bodies and
resumes the character with the get-up move. Death remains terminal.
Route `drainEvents()` to scene-owned sound, camera feedback and HUD effects.
Stop and dispose the encounter scope on retry, then load fresh asset instances
and start again; do not reset one health field and leave old physics bodies alive.

The included motions are from the CMU Graphics Lab Motion Capture Database.
Retain `COMBAT_MOTION_LICENSE.acknowledgment` in the game's credits and the
source/license URLs in distribution notices. The official CMU home page states
that the motions are free for all uses. Check the source terms for additional
assets rather than inheriting that permission by name.

For authored fist, foot or weapon attacks, read
[`action-combat.d.ts`](../engine-api/action-combat.d.ts) before using
`wanaka-studio-engine/action-combat`. These primitives are not a finished move
library: never substitute an idle or locomotion clip for a missing attack and
claim that the promised combat is complete. Validate the actual rig, clip names,
socket names, units, facing and root trajectory before authoring timing windows.

Advance one `ActionCombat` per actor on the simulation clock. Its windows use
action seconds; clip sampling uses clip seconds. Changing playback speed requires
reviewing the authored window timing. Pass each active `CombatSpan` to
`CombatAnimationSampler` with the declared clip and the animation root's
parent-world transforms at the span boundaries.
Use `stepFrom` and `stepTo` to locate those boundaries within the simulation
step, including any hit stop or combo transition that preceded this span.
The isolated sampler preserves the visible rig and interpolates intermediate
bone poses. A weapon needs probes
along its length, not just one sphere at its tip. Probe radii are world-space
gameplay dimensions; offsets are bone-local asset dimensions.

Interpolate each target's hurt volume at each segment's `from` and `to` fractions
before calling `sweepCombatSphere`. Reject friendly, occluded or otherwise
ineligible contacts before `claimContact(span, targetId)`; the claim deduplicates
that target across the entire action. Gather candidates before committing
defense, damage or interruption. Claim spans only during the advance that issued
them, including an action that ended within that step. Do not call `advance`
again before processing those receipts.

`resolveCombatDefense` decides eligibility, not damage, stamina cost or physical
reaction. Root-motion receipts go through the sole movement owner; never also
move the presentation root. Bone-local translation in the source clip must not
apply the same root travel a second time. Queue committed hit events for sound,
camera response and authored reaction. Scope disposal and interruption invalidate
outstanding contact claims; retry must recreate all encounter-owned state.

Foot sliding or implausible reach can come from disagreement between animation,
root travel and contact geometry. Contact alignment and recovery are useful
observations for those symptoms; unit-test success alone does not establish
observed animation quality.

All combat follows one transaction:

`semantic command → action validation → windup → active contact → recovery → damage/defense commit → death/reward commit → presentation events`

Every attack, projectile, skill, damage, death and drop has a stable logical identity; the reward that follows a death or objective commits through the RPG growth transaction. Collect eligible contacts before mutating actors, and resolve each action-target pair once. A miss, invulnerable target, blocked action or unaffordable skill publishes a reason without consuming damage identity or partially spending resources.

Actions are typed data with timing phases, resource rules, movement policy, contact shape, target policy, cancel rules, and presentation keys. Equipped weapons, unlocked skills, or attribute scaling must change at least one of those authoritative parameters or rules rather than only changing UI labels.

Movement, semantic facing, imported-asset axis calibration, camera look and targeting are separate channels. Position has one owner. Facing transfer during lock-on, attack or dodge must be explicit and return to the declared owner. Asset calibration lives once on a native visual child; it never becomes a gameplay heading offset.

## Control-route requirements

### Over-shoulder keyboard

Normalize all promised devices into one camera-relative movement command derived from `camera.getWorldDirection(cameraForward)` ([camera.md](./camera.md); never hand-roll `sin(yaw)` / `cos(yaw)` movement vectors that can disagree with `CameraRig`). Follow [input-handling.md](./input-handling.md) for edge, release, focus-loss, and pointer-capture-loss handling: in particular, because the browser consumes the first `Escape` key press to release Pointer Lock without firing `keydown`, open the pause or unified RPG menu on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) so a single `Escape` press opens the menu. The movement owner accepts semantic velocity or action intent; combat code does not also write the native root position.

Lock-on is optional. If selected, define candidate eligibility, occlusion policy, break distance, manual switch, camera influence, and facing transfer: while locked onto a target, character facing and melee/spell aim MUST track the locked target (taking priority over nearer untargeted foes), and planar movement (`WASD`) and dodge rolls operate relative to the target (`W` closes in, `S` backs off, `A/D` strafes around the target) rather than turning the character's back to the target. If `Tab` is bound to lock-on, intercept `Tab` on `keydown` with `event.preventDefault()` so the browser does not shift DOM focus out of the game viewport. A target marker is presentation only and cannot keep an invalid target alive.

### Fixed-camera point-to-move and top-down hybrid

A pointer edge creates one candidate ground or enemy hit. Before committing a ground destination, prove that the candidate belongs to the declared walkable set and is reachable from the player's current region. A visible hit does not prove collision or navigation connectivity.

In isometric hack-and-slash ARPGs, bind mouse-led combat so left-clicking the ground moves, left-clicking an enemy approaches and performs basic attacks, right-clicking casts the core skill toward the cursor, and `1–4` triggers hotbar skills (never leave the mouse as walk-only with all attacks exclusively on keyboard keys). When optional `WASD` planar movement coexists with click-to-move/attack, pressing `WASD` cancels only the active ground path — it MUST NOT clear the locked enemy target or swallow attack/skill inputs while movement keys are held (either briefly pause locomotion during the swing windup or attack while moving). Accepted destinations persist until arrival, cancellation, topology invalidation, or a declared action boundary. Keyboard movement, scripted movement, and destination movement must never write concurrently.

## Enemies, boss and fairness

Standard enemies have engage, attack windup/active/recovery, stagger or interruption policy, leash, death and cleanup. AI uses the same action validation, contact and damage entry as the player. Difficulty may alter data and decision policy but must not bypass defense, recovery or identity rules.

Boss and enemy attacks need readable anticipation before active contact; never ship instant zero-frame hits. Boss difficulty comes from a readable, state-driven pattern — move set, timing windows, recovery and phase triggers — rather than an enlarged health pool. Match the anticipation cue to the attack type — character windup poses, a weapon glint, charge particles or audio for melee, casting sigils or fissures for spells, or ground area markers only when a delayed AoE or artillery strike needs an explicit landing zone — rather than defaulting every attack to a ground circle or sector. Phase changes clear or deliberately carry pending actions. Victory commits only from boss death or another declared objective, never from presentation completion.

Combat fairness requires:

- readable anticipation before unavoidable damage;
- a defense or positioning response appropriate to the selected route;
- collision, navigation and visible footing that agree along the mandatory path;
- stable target and hit rules across frame rate;
- recovery opportunities and an explainable failure cause;
- no damage from an inactive encounter, old chapter or hidden stage.

## Space, camera and presentation

Build a connected combat route with readable traversal surfaces, encounter boundaries, boss space and landmarks. Design ramps, stairs, bridges, seams and arena boundaries for the selected movement route and inspect their geometry and connectivity in source. When a custom walkable-polygon or A* navigation grid shrinks walkable rectangles inward by the actor's collision radius, adjacent connected regions (such as a bridge meeting north/south plazas, or a doorway connecting rooms) MUST overlap across the shared threshold by at least `2 × actorRadius` rather than meeting butt-jointed edge-to-edge (which opens an impassable seam gap after radius inset). A visible destination across a disconnected gap must remain unreachable.

The native camera has one base-pose owner; follow [camera.md](./camera.md) for that contract. Elevated follow starts from a rigid boom. Facing look-ahead when walk and attack share a heading; cursor look-ahead when aim is independent of move; pan lag when twin-stick or the player should lead the frame. Follow, look, lock-on framing, recoil, and cinematic transitions compose as presentation layers without moving combat actors. Unreadable silhouettes, apparent reach errors, or an obscured boss are framing issues in the affected gameplay view.

Animation and effects consume committed action state; gameplay decides when damage exists.
Choose presentation through the [VFX recipe index](vfx-examples-index.md) and bind it to
actual attack, contact and cancellation events. Follow each recipe's coordinate frame;
[camera orientation](camera.md#orientation-contract) covers native Three geometry.

Audio fires from committed action, defense, damage, death, and result identities. The DOM HUD reads authoritative health, resources, target, objective, equipped skills/items, pause, and result, and submits only typed intent.

## Parameter boundary

Keep project values in a named tuning profile with units and the selected mode. Relevant families include:

| Family | Required record |
| --- | --- |
| locomotion and turn | world-units per second, angular convention, control route and movement owner |
| action timing | simulation ticks or seconds on one declared timebase |
| contact geometry | shape, dimensions, local-space convention and target policy |
| damage and resources | gameplay units, source action and commit identity |
| defense | gate semantics, duration/distance/cost families and failure policy |
| enemy decisions | perception, leash, cadence, cancellation and difficulty source |
| boss patterns | move set, timing windows, recovery and phase trigger |
| camera | projection, framing, follow offset, lookAt the same presentation pose, composition owners |

## Troubleshooting

- Commands lost on release, focus recovery, or point-to-move cancellation point to input-edge and destination ownership.
- Whiffs committing damage, repeated contacts applying twice, or defenses ignoring their timing point to action identity, contact validation, and defense state.
- Enemy attacks, death, or rewards disagreeing with presentation point to paths bypassing the shared combat transaction.
- Skills or equipment changing displayed values without changing combat point to the authoritative stat consumer.
- Boss progression or results repeating, or retry retaining actors and hooks, points to encounter latches and lifetime cleanup.
- Pause or modal activity leaving combat active points to clock and input ownership. A HUD or camera tracking the wrong target points to stale presentation bindings.
- For a specific issue, useful existing state includes semantic command, action phase/identity, destination rejection, contact/defense result, health/resource commit, reward/result identity, and reset generation.

## Implementation

### Genre-specific owners

- State owns profile/world/encounter (or run/encounter) partitions, action identities, gate state, result, and reset generation.
- One command path normalizes input and DOM intent into semantic commands.
- One action owner holds phase transitions, resource validation, and the contact ledger; one combat commit resolves defense, damage, death, and reward.
- Enemy and boss AI submit the same semantic actions as the player.
- Presentation owns native transforms not owned by physics, camera, animation, audio, effects, and the scope-owned HUD.
- Project tuning stays in named profiles with explicit units.

The managed scene exposes a small number of meaningful native bindings. Runtime enemies, effects, colliders, mixers and sidecar handles remain scoped code-owned values. No parallel scene or entity registry is required.

When grounded humanoid appearance is unspecified and stylized default bodies fit the game's art direction, load `WANAKA_DEFAULT_CHARACTER` through `model3DLoader` and pass `WANAKA_DEFAULT_CHARACTER.clipNames` into `attachAnimatedModelInstance`; when the brief calls for a realistic or genre-specific aesthetic where cartoon default bodies would clash, source a matching biped humanoid via `search_native_assets` or `generate_game_asset` + `prepare_character`; bind the attached presentation with `{ model }`. The CharacterController capsule remains collision-only. Follow [Character models](assets.md#character-models) for clip mapping and animation ownership.

### Select one locomotion owner

#### Physics character route

Use [default-third-person-character.ts](../../examples/default-third-person-character.ts) (when appearance is unspecified) or [third-person-character.ts](../../examples/third-person-character.ts) (for a catalog GLB) for grounded movement that needs slopes, stairs, gravity, and static collision. Bind `{ model }`, use `anchors` for follow cameras, submit one `control(intent)` per fixed step from `fixedInput`, and use `fixedInput.wasPressed` for jump. Respawn uses `reset()`; `teleport` is the immediate pose write — [physics.md](./physics.md).

- player: `CharacterController`;
- level blockers: static bodies;
- interactors: explicitly selected dynamic or kinematic bodies;
- visual children: no body unless the mechanic requires physical interaction.

Keep semantic facing in gameplay state and rotate a native visual child or another explicitly owned orientation node. If a promised action needs a controller operation absent from the declaration, implement a project mechanic or record the implementation gap; do not invent a controller method.

#### Project-owned point-to-move route

Convert pointer client coordinates to normalized device coordinates against the real render surface, then use native Three picking:

```ts
import * as THREE from 'three/webgpu';

const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(pointerNdc, camera);
const hit = raycaster.intersectObjects(walkableRoots, true)[0];
```

This hit proves only that a native visible object was intersected. It does not require a physics body, and it does not prove walkable connectivity. Validate the candidate against one explicit topology owner:

- create a scoped `NavigationMesh` from declared walkable and blocked native objects, then use `closestPoint` and `findPath`;
- or maintain an authored region-and-connector graph and reject candidates without a connected route.

When collision-aware character movement is required, consume `findPath().points` only when its receipt is `complete`; the path MUST be owned in project state and its current waypoint MUST feed `character.control({ movement: { kind: 'world', velocity }, ... })`. [character-navigation.ts](../../examples/character-navigation.ts) proves that handoff. Use `setMoveIntent` only when the project deliberately drops facing, jump, stance, and control sequence. Alternatively, `NavigationAgent.create` can own and move a native object in `update`, but then that agent is the sole transform writer and MUST NOT share the object with `CharacterController`. The Engine's arrival, `partial`, and `unreachable` states MUST be recorded separately from project-owned cancellation and bounded no-progress watchdog outcomes; no-progress is not a `NavigationAgentStatus` value.

Use the active physics instance's `castRay` only when physics bodies, rather than visible meshes, define the query. Its direction argument is the complete ray vector; pass every querier-owned `RigidBody` in `ignore` so closest-hit continues past those colliders. A CharacterController is not a `RigidBody`. The native raycaster and physics ray answer different questions and MUST NOT be interchanged.

### Static collision and transform authority

Build visible terrain as native Three hierarchies in the scene factory. In Play, use primitive or heightfield shapes with `physics.createAndBindBody(scope, { motion: 'static', shape, object })` when the body should publish a pose to a presentation object. For an irregular native Three hierarchy, use `physics.createBody(scope, { motion: 'static', shape: { kind: 'mesh', objects } })`: the hierarchy is cooked once at its current world transforms and cannot also supply `object`, `position`, or `rotation`. When the triangle data is already plain -- procedurally generated, or cooked once and cached -- pass `{ kind: 'mesh', vertices, indices }` directly instead; it is the same shape `objects` resolves to, without holding a native hierarchy for it. A visible surface without a body is still native-raycastable but not physics collision truth. A hidden body that disagrees with visible footing is also invalid.

Authority follows the body and fixed-step contract in [physics.md](./physics.md#fixed-step-order): one actor selects one body route, and camera, animation and combat presentation read the committed pose without copying it into another gameplay owner.

### Combat transaction order

Consume each pending input or DOM command once, then validate and advance action windup/active/recovery before resolving the selected contact route. Project-math contacts use authoritative fixed-step poses; physics-backed contacts consume physics-owned poses or observations only after their declared boundary. Animation, HUD, audio, effects, camera, and target markers consume committed outcomes and never decide damage.

If physics contacts are the selected combat truth, collect them from scope-owned body listeners or explicit queries and commit them after the physics boundary. If project geometry is combat truth, resolve typed shapes from authoritative actor poses on the fixed timebase. Do not run both paths for the same attack.

### Contact and damage implementation

Action definitions contain local-space contact geometry, target masks, active interval, defense interaction, movement policy and presentation keys. Convert those shapes from the authoritative native root transform or semantic pose. Use project math for sphere, segment, capsule or oriented-volume tests when it is the declared source of truth.

The published physics query surface provides closest ray casts and `overlapAabb` broad-phase bodies. Both accept an `ignore` list of `RigidBody`; pass attacker-owned bodies when they exist so the candidate set does not include the querier. A CharacterController is not a `RigidBody`. It does not publish a universal melee or target query. An AABB overlap is a candidate set, so apply the action's exact shape and identity tests before committing. Register `onContactBegin` / `onContactEnd` removers with the scope when persistent body contacts are relevant.

For every active action:

1. allocate an action identity after phase, resource and cooldown validation;
2. collect eligible targets without removing actors;
3. check team, life state, invulnerability, block/parry/dodge and the action-target ledger;
4. commit cost, defense result, damage, stagger and knockback intent once;
5. commit death, gate/reward state, and presentation events once;
6. clean expired actions, projectiles and targets after iteration.

Animation notifies and audio completion never authorize contact or result. A physics contact without a live action identity is not automatically combat damage.

### Assets and animation

For a skinned GLB actor, follow [Character models](assets.md#character-models) for loading, clip mapping, and animation ownership. Mixer time is presentation unless the project explicitly proves a single shared fixed timebase. Attack animation consumes committed action state; its callbacks never define active contact, damage, death, or result timing.

### Encounter, gate, boss and reset scopes

Use a parent session/progression scope for character/world state (or run state when composed with [Roguelike](./genre_roguelike.md)) and a child encounter scope for enemies and encounter resources; apply the physics contract above to any bodies or controllers in that scope. On area or gate transition:

1. validate and commit gate state once;
2. disable the old encounter's input/damage writers;
3. dispose its scope and release all encounter-owned resources;
4. activate the next authored area or managed scene;
5. rebuild native and sidecar projections from committed character/world (or run) state;
6. enable commands only after the new encounter is ready.

Boss phase changes are state transitions inside the boss encounter, not a second encounter loop. Checkpoint respawn or encounter retry disposes the active encounter scope while preserving durable RPG progression (or disposes the run scope when composed with [Roguelike](./genre_roguelike.md)). User pause uses the single session pause owner; RPG menus, dialogue, and result overlays remain explicit activity gates.
