# Physics

Physics is an explicit Play-only Engine API. A project that does not import `wanaka-studio-engine/physics` has no Jolt world. Edit-safe scene modules SHOULD build the visible Three graph; Play activation creates physics ownership when the game requires it.

Read [physics.d.ts](../engine-api/physics.d.ts) before creating a shape or body.

## Object, body, and lifetime contract

An `Object3D`, a `RigidBody`, a stable project entity id, and an editing `nodes` key are independent identities. An object does not create a collider, and a body does not need a bound object. When an actor has a `RigidBody`, attribute hits to that body (`hit.body` or a project map from body to actor). A `CharacterController` volume is not a `RigidBody`; visual-only actors have no query body. Those owners use a pose-derived Sphere or Box3, or an explicit sensor. Do not treat a visual mesh as proof that a physics query can hit it.

Setting a visual object's `visible = false` changes rendering only; it does not disable an attached physics body or remove it from collision and query results. Body teardown remains owned by the scope that created it. A dead or removed actor still collides and answers queries until that body or controller is moved, disposed, or excluded; hiding the mesh is not enough.

| Entity | Body decision | Pose and query rule |
| --- | --- | --- |
| Pure visual object, HUD, or decoration | No body | Never use its mesh as evidence that a physics query can hit it. |
| Immovable floor, wall, or blocker | `static` body | The authored world pose is authoritative; move it only with an explicit `RigidBody.teleport`. |
| Moving door, platform, or blocker | `kinematic` body when project code owns motion; `dynamic` when forces and collision response own it | Keep the selected motion type's pose authority; do not add a second writer. |
| Dynamic prop or projectile | `dynamic` body | Physics publishes the bound object's pose in `postPhysics`. |
| Player or grounded walking NPC (slopes, stairs, character collision) | `CharacterController` | The controller owns the actor root; do not also let a rigid body or navigation agent write it. |
| Flying enemy, turret, or simple kinematic hostile | No CharacterController | Project code owns pose and heading; hits use a pose-derived Sphere or Box3. |
| Contact sensor | Explicit body, usually with `isSensor: true` | Contact edges only; keep once-only event identity separate from visual presentation and from hit/pick/sight volumes. |

Bodies MUST be created in a scope matching the lifetime of their owner. Use a world/session scope for shared level blockers, an actor scope for an actor and its contact sensors, and a child scope for each projectile or temporary mechanism. Dispose that scope to remove the body and its contact listeners. The public API has no separate body destroy or disable operation.

To rebuild a mesh collider, replace the owning child scope. Cook the new hierarchy once at its current world transforms and register the new body before the old collider can be queried.

An `Object3D` presentation binding requires automatic TRS matrices, unit scale on the bound node, and identity automatic-TRS ancestors. Put non-uniform or reflected scale on visual children.

A mesh hierarchy supplied as `shape.objects` is cooked in world space. It cannot also supply `object`, `position`, or `rotation`. Finalize its hierarchy and scale before cooking, then rebuild the body after any later change.

## Create one world and choose one motion authority

`PhysicsWorld.create(scope, scheduler, options)` owns Jolt and fixed-step integration for one runtime lifetime. Use the body and scope decisions above when attaching bodies to that world.

Every body has one motion type:

| Motion | Authority |
| --- | --- |
| `static` | Immovable collision; explicit `RigidBody.teleport` is the only supported pose change |
| `dynamic` | Physics records pose in `postPhysics` and samples its presentation onto the bound object in `preRender` |
| `kinematic` | The bound Three object's pose is read in `prePhysics` |

The project MUST NOT write a dynamic object's transform after binding it and expect that write to survive. It MUST NOT use a kinematic body when forces and collision response are supposed to own motion.

The current floor-and-crate composition is [physics-basics.ts](../../examples/physics-basics.ts).

## Shapes and dimensions

Shape values MUST come from the intended collision geometry, not from a guessed asset scale. Box dimensions are `halfExtents`; capsule and cylinder dimensions use `halfHeight` plus `radius`; heightfields require a valid sample grid; mesh shapes consume explicit vertices or native Three object hierarchies.

The Agent SHOULD prefer primitive shapes when they represent the gameplay volume. Create that primitive body in the same step as the visual blocker; do not walk a later mesh tree to reconstruct collision. Static mesh collision MAY be used for irregular level geometry, but the source hierarchy is cooked once at its current world transforms.

Changing cooked geometry requires replacing the owning body. [mesh-collider-rebuild.ts](../../examples/mesh-collider-rebuild.ts) demonstrates a child-scope generation that disposes the previous body before cooking the next one. Heightfield presentation and collision sharing one sample source is demonstrated in [heightfield-terrain.ts](../../examples/heightfield-terrain.ts).

## Fixed-step order

The runtime fixed phases are ordered as `fixedInput`, `fixedUpdate`, `prePhysics`, `physics`, and `postPhysics`.

- Input intent SHOULD be latched into gameplay commands during `fixedInput`.
- Gameplay fixed decisions SHOULD run in `fixedUpdate`.
- Kinematic presentation poses are consumed in `prePhysics`.
- Jolt advances in `physics`.
- Dynamic and character simulation poses are recorded in `postPhysics` and sampled as leftover-frame presentation poses onto bound objects in `preRender`. A follow camera MUST read that presentation (bound `object`, or Character `anchors`), not the 60 Hz `.position` getter.

The project MUST keep one writer for each transform across those phases. Render projection MAY sample simulation state for presentation, but it MUST NOT become a second simulation authority.

### Project-owned fixed-step presentation

A project-written kinematic has no engine pose smoothing. Integrate its authoritative root once per fixed step; physics and gameplay read that root, and presentation never writes back to it.

For continuous display:

1. Keep adjacent committed position and quaternion snapshots, recording each current endpoint after integration and all contact corrections.
2. In `preRender`, interpolate position and shortest-path quaternion rotation with `step.alpha` onto a separate presentation node. Camera position, look target, and chase heading follow that same updated display pose.
3. At spawn, reset, respawn, teleport, or a new run, set both endpoints to the new pose and snap the chase-camera state together.

This introduces one fixed step of display latency (about 16.7 ms at 60 Hz). [arcade-racer.ts](../../examples/arcade-racer.ts) demonstrates the scoped presentation node and callbacks, including child-transform compensation. Layer lean, pitch, and effects below the sampled pose or on the camera.

CharacterController, dynamic RigidBody, and VehicleController already publish presentation poses; use their bound objects or anchors without adding this interpolation again.

Simulation and presentation run on separate clocks, and only simulation keeps running while the browser is not painting the page. Anything the game decides — a hit, a trigger, a score, a distance test, replicated room state — MUST read simulation state: a body's `.position`, a Character's `.position`, or shared room state. Only what the player looks at — cameras, follow rigs, effect anchors — MAY read the interpolated presentation transform. A gameplay decision that reads a bound object's transform is correct on screen and frozen the moment the window goes to the background, which on a multiplayer host stalls every peer in the room.

## Contacts, queries, and forces

Contact listeners MUST be scope-owned. A contact edge MAY publish a gameplay fact, but scoring or damage SHOULD still enforce its own once-only event identity when repeated contacts are possible.

`castRay` uses the complete direction vector and returns the closest narrow-phase hit or `null`. `overlapAabb` returns bodies whose broad-phase bounds overlap the supplied world-space box. Both accept an optional `ignore` list of same-world `RigidBody` so a query can skip those colliders. Pass every querier-owned `RigidBody`; a CharacterController volume is not a `RigidBody` and cannot go in that list. Do not nudge the origin out of an owned collider as a substitute, and do not invent a general collision-layer API. Disposed ignore entries are skipped; a live body from another world throws. The Agent MUST inspect the returned body identity and MUST NOT treat a visual mesh as proof that a physics query can hit it.

A CharacterController collision volume is locomotion, not a hit, pick, or sight owner. After any `ignore` list, `castRay` reports the nearest remaining physics body. If that body is the actor's, it is the owner. If the actor is a CharacterController or visual-only, compare a pose-derived Sphere or Box3 sized to that actor. Place that volume from the actor's simulation pose (the controller's `.position` or the body's `.position`), not from leftover-frame presentation anchors. Do not cook the traversable floor into the same mesh used as query obstruction. [physics-basics.ts](../../examples/physics-basics.ts) `pickCrate` attributes this playground crate through `hit.body`. Do not copy it as a shooter: shooters still pass ignore lists, and a CharacterController or visual-only actor uses a pose volume.

Mesh colliders are single-sided for physics queries, so competitive blockers SHOULD use closed or primitive shapes, or verify winding from both sides.

Continuous motion of a dynamic body SHOULD use velocity or an appropriate controller. Impulses and forces SHOULD be reserved for effects whose mass-dependent response is intentional. A teleport is an explicit discontinuity and MUST be used deliberately.

## Specialized owners

- Player-style slope, stair, crouch, and jump behavior SHOULD use `CharacterController`. A walking NPC that needs the same ground support is the same row. Flying enemies, turrets, and simple kinematic hostiles keep project-owned pose and heading plus a pose-derived hit volume; do not force a grounded CharacterController onto them. Read [character.d.ts](../engine-api/character.d.ts). Submit one `control(intent)` per CharacterController per fixed step: device channels in `fixedInput`, behavior that reads `latestStep` in `fixedUpdate`. Keyboard camera-relative mapping is [third-person-character.ts](../../examples/third-person-character.ts); world-space grounded NPC AI and waypoints are [character-ai.ts](../../examples/character-ai.ts) and [character-navigation.ts](../../examples/character-navigation.ts). If a non-character object still turns, point local `+Z` at the planar target; do not add a blanket 180° Y — [camera.md](./camera.md).
- `.position` and `latestStep.position` are the 60 Hz simulation pose: capsule bottom with `object`, capsule center with `model`. Gameplay traces use that pose. Follow cameras use `anchors` (feet = capsule bottom). A bound `model` root sits at the feet; a bound `object` sits at `.position`.
- World-space planar velocity belongs on `control({ movement: { kind: 'world', velocity }, ... })`. `setMoveIntent` is the escape hatch that does not carry facing, jump, stance, or a control sequence.
- A grounded jump SHOULD ride that same control frame as `jump: 'fixed'` from one consumed `fixedInput` press edge. Omitted `stance` is stand this step; a crouch game MUST pass `stance` every step. Direct `jump()`, `setStance()`, and `setMoveIntent()` remain low-level operations and MUST NOT be mixed with `control()` in the same step. An intentional air jump or other vertical impulse MUST use the controller's velocity boundary, such as `setVerticalVelocity`; calling a grounded-only jump again does not implement a double jump.
- Respawn and match reset SHOULD `reset({ position, facing, velocity: 'clear', jump: 'reset', groundContact: 'clear' })` so the next physics step is an atomic barrier that also drops pending control, impulse, and nudge that lost the sequence race. `facing` here is `'preserve' | { yawDeg }`, not `{ kind: 'preserve' }`. `teleport(position)` is an immediate pose write; the declaration does not promise that it clears velocity or jump. Need a deterministic dynamics clear — use `reset()`. Neither writes the bound root.
- Character `createAndBind` does not run the rigid-body unit-scale binding check. Size the presentation by passing the asset result's `recommendedScale` to `model3DLoader` as `scale`; if gameplay needs another size, adjust that one scalar. Keep capsule `radius` and `halfHeight` in meters.
- A hit knockback on a `CharacterController` MUST use `applyImpulse`. It MUST NOT write the bound object. After an external displacement on a `NavigationAgent`, call `replanFromCurrentPosition`.
- Simulation wheeled driving SHOULD use `VehicleController`; read [vehicle.d.ts](../engine-api/vehicle.d.ts) and [vehicle-drive.ts](../../examples/vehicle-drive.ts). Vehicle-local forward is `+Z`. Bind actual model wheel pivots through `wheelObjects` in the same order as `wheels`; declaring physics wheels alone does not animate imported meshes. The example uses [vehicle-wheel-visuals.ts](../../examples/vehicle-wheel-visuals.ts) to keep authored scale and orientation on children of unit-scale wheel-centred pivots. Wheel pivots are scene siblings of the chassis because the controller publishes world poses; do not parent them under the moving chassis. Keep all chassis bodywork as direct children of the bound `chassis` `Object3D` passed to `VehicleController.createAndBind` — NEVER place bodywork on a separate `Group` driven by a manual `lerp`/`slerp` lag follower in `preRender`, which desynchronizes the body from the wheels. Drive the chase camera from the bound `chassis.position` and horizontal yaw heading rather than raw chassis pitch/roll oscillation. Set each wheel's hub position, radius, width, suspension travel, and `steers` to match the model. `VehicleController` needs world gravity and a driveable collision surface under the wheels. Optional `createAndBind` `steeringWheel`, `springs`, and `axles` are chassis-local presentation from interpolated `wheelPose`; they do not change Jolt spring parameters. `VehicleController` lowers the chassis center of mass (`chassis.centerOfMassOffset`), applies suspension/tire forces near the center of mass (`suspensionForcePoint`), enables internal-edge removal on road meshes, and includes default `antiRollBars`, `maxPitchRollAngleDeg`, speed-sensitive steering smoothing (`steerSmoothing`, `highSpeedSteerThreshold`, `highSpeedSteerFactor`), reverse-brake protection, and grounded `downforce`. Default [3D racing](./genre_3d_racing.md) arcade route uses a project-owned integrator plus kinematic and static boxes — [arcade-racer.ts](../../examples/arcade-racer.ts) — not a Jolt vehicle.
- Fixed physical assemblies MAY use the constraint modules; [physics-basics.ts](../../examples/physics-basics.ts) shows the current weld boundary. Joints do not disable collision between the constrained bodies.
- Ragdolls MAY use the scoped `Ragdoll` API with an explicit anatomical joint graph; see [ragdoll.ts](../../examples/ragdoll.ts).
- Navigation uses a native `Object3D` movement owner, not a physics body controller. A `NavigationAgent`, `CharacterController`, and dynamic body MUST NOT independently write the same actor transform. The compile-checked walk boundary is [navmesh-walk.ts](../../examples/navmesh-walk.ts). When a CharacterController NPC follows `findPath()`, feed the current waypoint through [character-navigation.ts](../../examples/character-navigation.ts) instead of sharing that root with `NavigationAgent`.

## Authoring guidance

Visual-only objects are not colliders. Every required blocker and character has one body or controller owner; gravity and contacts use the intended body, hit/pick/sight volumes track the actor pose, and sensor bodies disappear with their scopes.

A restart MUST recreate any body or child scope disposed by the previous round in the running session; it MUST NOT reload the document.

## Troubleshooting

Pass-through collisions, detached hit volumes, or bodies surviving reset point to
the ownership and lifetime boundaries above. A constraint or vehicle that appears
aligned in one frame may still diverge during simulation; a static visual pose alone
does not establish a stable physical relationship.
