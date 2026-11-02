# Camera strategy

Wanaka games use native Three cameras. A scene factory creates them, a stable `nodes` entry exposes the camera Studio needs, and the project's `SceneHost` composition returns the `RenderView` submitted by `RenderSession`.

Read [scene.d.ts](../engine-api/scene.d.ts) and [render-session.d.ts](../engine-api/render-session.d.ts) when changing the host boundary.

## Choose the camera role first

The Agent SHOULD choose the smallest strategy that fits the game:

| Need | Native approach |
| --- | --- |
| Fixed composition | One `PerspectiveCamera` or `OrthographicCamera` with an authored pose |
| First-person look | One scene-rooted camera; its orientation owner consumes captured pointer deltas; `preRender` copies position from the character eye anchor |
| Over-shoulder look | The same view Euler on a scene-rooted yaw/pitch rig; camera is a pitch-pivot child behind the look; `preRender` copies the yaw pivot from the character eye anchor |
| Mouse orbit around a target | yaw/pitch place the camera, then `lookAt` the target |
| Follow or chase without mouse look | Project TypeScript updates one rig or camera from the target pose |
| 2D / 2.5D side-follow | Lock the gameplay plane, follow the interpolated feet presentation pose, and apply only a bounded horizontal look-ahead |
| Authored cinematic or cutscene | A scoped Camera Sequence owns pose and lens until an explicit completion handoff |
| Runtime camera switch | Build another `RenderView` and call `replaceMainView` |
| Still preview from another camera | `captureCameraPreview` |
| Split screen or live minimap | One submitted view using native `ArrayCamera` subviews |

A preset name is not a complete controls model. Input mapping, actor facing, camera pose, collision avoidance, and mode transitions MUST each have an explicit owner.

## Captured pointer look

When mouse movement turns the view, choose one geometry before writing yaw or pitch. `pointer.deltaX` / `deltaY` are raw browser movement. The same captured delta uses opposite signs for view Euler and orbit position.

| Geometry | What yaw/pitch mean | Captured delta |
| --- | --- | --- |
| View Euler (`YXZ`) | Camera orientation, or the same Euler on yaw/pitch pivots | `yaw -= deltaX`; `pitch -= deltaY` |
| Orbit position | Azimuth and elevation around a target, then `lookAt(target)` | `yaw += deltaX`; `pitch += deltaY` |

View Euler is [first-person-look.ts](../../examples/first-person-look.ts). First-person writes it on the scene-rooted camera and copies that camera's position from `anchors.eyes` in `preRender`. Over-shoulder uses that same writer on a scene-rooted yaw pivot and its pitch child: the camera is a pitch-pivot child behind the look (parent `+Z` when camera rotation is identity) and still looks along local `-Z`, and `preRender` copies the yaw pivot position from `anchors.eyes`. The Character root is not an ancestor of either rig. Facing updates only that bound object. The scene-rooted look rig does not inherit it, and the character follows the look through the camera's planar forward. Orbit position is [third-person-orbit-look.ts](../../examples/third-person-orbit-look.ts). That camera MUST be scene-rooted so `position` is world space. Do not mix the two: an orbit camera MUST NOT also run the view-Euler writer, and MUST NOT sit under a yaw/pitch look rig.

Cockpit free-look, spectator fly, and inspect-orbit reuse those two files. They are not additional sign conventions. If mouse does not turn the view — follow-chase, side-follow, top-down, authored-fixed, strategy pan — do not apply captured look. Elevated XZ follow without mouse look defaults to [top-down-follow.ts](../../examples/top-down-follow.ts). Other follow-chase, side-follow, authored-fixed, and strategy pan cameras stay in the genre guide. Consume captured deltas only while `input.frame.snapshot.pointer.captured` is true.

## Initial camera and resize

The scene factory SHOULD create the initial camera, set its pose, add it to the scene when useful for hierarchy inspection, and return it through `nodes`. A cold-start pose MUST face the main playable space and keep the first interaction readable; do not rely on a default Euler rotation. The first promised interaction MUST lie in front of the submitted camera. A spawn frame of empty ground and a distant skyline while the play space sits behind the camera is a failed composition. Perspective projection MUST update its aspect and projection matrix when the presentation size changes. `PerspectiveCamera.fov` is the vertical field of view in degrees, from bottom to top of view. Horizontal FOV follows aspect. A player-facing horizontal FOV number is not `camera.fov` until converted.

`RenderView.resize` is the current host hook for viewport-dependent camera state. The pattern in [multi-camera.ts](../../examples/multi-camera.ts) keeps the camera and view native while allowing `RenderSession` to own resize and submission.

Near and far planes SHOULD stay as narrow as the actual scene permits. Establish a clipping cause from the camera configuration and scene geometry before changing them; disappearance with distance alone does not prove a clipping-plane problem.

## Pose ownership

Exactly one system MUST write each camera pose channel at a time. A fixed pose, follow rig, pointer-look controller, cutscene, and manual debug camera MUST NOT race over the same position or rotation.

For a mode handoff, the project SHOULD retain explicit typed state describing the outgoing and incoming owner. A temporary transition MAY interpolate native camera position, quaternion, or lens values from the scheduler, but completion or cancellation MUST leave one clear owner.

`CameraSequencePlayer` claims conflicts between sequence players, but it cannot detect ordinary project code writing the same camera or an ancestor. Suspend the gameplay camera rig before `play()`. Register the player after character, animation, and other presentation writers it samples, then wait for the playback's `finished` receipt before a `hold` completion hands the final pose back to gameplay. The Camera sequences section below covers anchors, clocks, markers, and fixed-time verification.

## Orientation contract

Wanaka gameplay roots and directional models use local `+Z` as forward. A local axis belongs to the object and rotates with it and its ancestors; a world direction is that axis expressed after the current world transform. For a scene-rooted object at yaw zero, local `+Z` is world `(0, 0, 1)`. `Object3D.getWorldDirection(target)` returns that local `+Z` direction in world space. A project-owned heading on an ordinary `Object3D` — kinematic enemy, turret, authored spawn — MUST point that local `+Z` at the planar target: `rotation.y = Math.atan2(dx, dz)`, or `lookAt` a same-height point. MUST NOT add a blanket 180° Y (`rotation.y = Math.PI`) to face the camera or world `-Z`. That offset is the Camera viewing exception below, not a model or character spawn pose.

Keep three local-space and Euler traps in mind:

- **Never read `object.rotation.y` as horizontal yaw after quaternion or physics updates**: Three.js decomposes a `180°` yaw quaternion (`yaw = Math.PI`, facing `-Z`) into Euler `(x = -π, y = 0, z = -π)`, so reading `object.rotation.y` returns `0` instead of `π` (flipping vehicle/actor heading and chase camera by 180°). Always extract planar heading from the rotated local `+Z` forward vector: `const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(object.quaternion); const yaw = Math.atan2(fwd.x, fwd.z);`.
- **Separate parent yaw from child tilt on `RingGeometry` and `ConeGeometry`**: Three.js polar geometries (`RingGeometry`, `CircleGeometry`) start `thetaStart = 0` along local `+X`; when laid flat on the XZ plane (`rotation.x = -Math.PI / 2`) for a horizontal arc or ring, keep `rotation.x = -Math.PI / 2` and `thetaStart = -Math.PI / 2 - arc / 2` on the child mesh and apply horizontal `rotation.y = yaw` on a parent holder node (setting both `rotation.x` and `rotation.y` on the same `'XYZ'` mesh tilts the flat ring vertically out of the ground plane). Similarly, `ConeGeometry` and `CylinderGeometry` point along local `+Y` by default; rotate the child mesh by `rotation.x = Math.PI / 2` inside a yaw-aligned parent holder (or use `quaternion.setFromUnitVectors`) to point a cone horizontally along `+Z`.
- **Handedness under local `+Z` forward**: with local `+Z` forward and `+Y` up, right-hand rule (`+Y × +Z = +X`) places an actor's **right side at `-X`** and **left side at `+X`**.

Three.js cameras are the native exception: they look along local `-Z`, and `Camera.getWorldDirection(target)` returns that viewing direction in world space. An ordinary `Object3D.lookAt(target)` points its local `+Z` at the target, while `Camera.lookAt(target)` points its local `-Z` at the target. A camera and a model with the same quaternion therefore face opposite directions. With the common `YXZ` Euler order, yaw is the horizontal rotation around world Y and pitch is the vertical rotation around the local X axis; positive yaw turns the default Camera `-Z` view toward `-X`. Clamp pitch before applying it so the view cannot flip.

Keep these roles distinct:

| Role | Authority |
| --- | --- |
| Camera orientation | The one look controller that writes the camera or its yaw/pitch pivots. |
| Character facing | The selected gameplay policy: `preserve` (keep heading), `movement`, or `forward`. It may follow the camera but does not create a second camera orientation. `control()` uses `{ kind: 'preserve' }`; `reset({ facing: 'preserve' })` uses the string `'preserve'`. |
| Movement basis | Camera-relative move samples a per-step planar projection of `camera.getWorldDirection(cameraForward)` in the same `fixedInput` or `fixedUpdate` that submits `control()`. It MUST NOT keep a parallel yaw just for movement. Tank-style move uses `{ kind: 'actor' }`; world-space NPC move uses `{ kind: 'world' }` — [input-handling.md](./input-handling.md). |

The look controller MAY retain one authoritative yaw/pitch state, as in the first-person look example. “Do not keep a parallel yaw” means do not maintain a second camera-relative heading for movement; it does not prohibit the sole orientation state used by that controller.

Camera-relative character movement MUST reuse a `THREE.Vector3` target and take planar forward from `camera.getWorldDirection(cameraForward)` (forward xz, right `(-forward.z, forward.x)`). Do not keep a parallel yaw and hand-compute `sin`/`cos`, and do not replace the right basis with `up x forward` or an ad-hoc sign adjustment. Submit that named view-forward through `character.control({ movement: { kind: 'relative', relativeTo: { kind: 'view', forward }, ... }, facing })`; do not multiply it into `setMoveIntent`. Pointer look writes in `update` and follow cameras write in `preRender`, so a `fixedInput` sample is the last completed look — one frame of lag is expected; freeze aim rays after this frame's look — [input-handling.md](./input-handling.md#use-the-correct-phase). Planar forward comes from the camera's viewing direction, not the target-to-camera follow offset; using the latter without negation reverses forward and backward. Movement and view rays use the submitted Camera's viewing `-Z`; actor, vehicle, and model facing use their ordinary Object3D local `+Z`. A yaw or aim pivot is an ordinary Object3D, so its `getWorldDirection` is not the Camera viewing direction. To face a `+Z` model with the view, derive its semantic yaw from the Camera world-forward vector, such as `Math.atan2(forward.x, forward.z)`, instead of copying `camera.rotation.y`. Movement and aim rays MUST call `getWorldDirection` on the submitted camera, not on a parent pivot. Do not parent the gameplay camera or its yaw/pitch pivots under the Character root. The [third-person character starter](../../examples/third-person-character.ts) shows this basis together with `fixedInput.wasPressed` for one-shot jump. Shooter over-shoulder composition is [genre_fps_tps.md](./genre_fps_tps.md).

A follow camera reads engine-published presentation in `preRender` for engine-simulated actors: a CharacterController's `anchors.feet` / `anchors.eyes` or bound `model.root` / `object`; a dynamic RigidBody or Vehicle's bound `object`. Do not follow `.position` on those controllers; that getter is the 60 Hz simulation pose. Character `anchors` positions are presentation-space; `physicsStep` names the last completed simulation step.

For a project-written fixed-step kinematic, run its presenter before the camera callback and follow the presentation node's world position and orientation. Sampling and reset ownership belong to [project-owned fixed-step presentation](./physics.md#project-owned-fixed-step-presentation); arcade chase integration is in [3D Racing](./genre_3d_racing.md).

A follow camera that lerps its position toward the actor and then `lookAt`s a less-lagged pose turns leftover-frame lag into yaw, worst while the actor strafes. Keep `lookAt`. Copy a rigid world offset of one look-point, then `lookAt` that same point ([top-down-follow.ts](../../examples/top-down-follow.ts)). Replacing `lookAt` with a world-fixed Euler keeps yaw still but drops actor-centered composition.

For a 2D or 2.5D side-follow, lock the gameplay plane to the declared axis and follow the engine-interpolated `character.anchors.feet.position` directly in `preRender`. A horizontal look-ahead MAY offset that same look-point along the committed movement direction. Do not follow the simulation `.position`, run a second `rawDeltaSeconds` exponential filter, or add vertical/depth drift that breaks the side-view plane. The side-follow contract is rigid and does not consume captured mouse look.

Direction-aware look-ahead MUST have a stable transition policy. Prefer a fixed route-forward lead (or no lead) for one-way platforming. If reversing input changes the lead, update a separate lead state with an explicit hysteresis or bounded slew; never set `lead = magnitude * sign(currentInput)` on every frame. The lead state may ease between directions, but the camera position still has one look-point and one owner; this is not permission to add another frame-time camera spring.

This is elevated XZ follow, not arcade chase. Start from that rigid boom. Choose pan lag or look-ahead from how the player moves and aims, not from whether the request names those compositions. Each still uses one look-point: a planar lead is an offset of that same point, not a second spring, and pan lag leftover-interpolates the lagged look-point rather than looking at a live actor from a lagged camera. Do not yaw the camera from strafe input.

| Composition | Use when | Skip when | Example |
| --- | --- | --- | --- |
| Rigid follow | Elevated XZ follow when none of the rows below apply | — | [top-down-follow.ts](../../examples/top-down-follow.ts) |
| Pan lag | Twin-stick, or action where the player should lead the frame while world rotation stays locked | Bullet-heaven / survivors that keep the player near screen center | `attachTopDownPanLag` in [top-down-follow-advanced.ts](../../examples/top-down-follow-advanced.ts) |
| Facing look-ahead | Melee that walks into the attack, dash-forward, one heading for move and strike | Move and fire independent; auto-aim swarm | `attachTopDownFacingLead` in [top-down-follow-advanced.ts](../../examples/top-down-follow-advanced.ts) |
| Cursor / aim look-ahead | Mouse-aim action or twin-stick where move and fire are independent, including firing behind while walking forward | Facing already is the aim; no cursor or stick aim | `attachTopDownCursorLead` in [top-down-follow-advanced.ts](../../examples/top-down-follow-advanced.ts) |

A follow camera in a confined level MUST remain on a readable side of opaque geometry throughout the intended orbit, or use an explicit collision/occlusion strategy. Occlusion in a tight space points to the affected geometry and camera path, which may differ from spawn.

When free mouse orbit can point the desired follow offset through a closed room or corridor, a fixed short distance cannot guarantee containment. A CameraRig collision policy MAY sample the target-to-desired-camera segment with parallel center and side rays. Treat a clear ray as the full desired distance and take the greatest safe candidate when the goal is to ignore isolated thin poles or trees; require the declared broad-obstacle policy before allowing a partially covered wall to be crossed. When an obstruction wins, shorten immediately to its safe point; when it clears, recover the distance with delta-time damping. Reset that collision state on an explicit shot change. Skip the follow target's own collision: a physics `castRay` passes every follow-target-owned `RigidBody` in `ignore`; a native mesh raycast omits that actor's meshes. Do not sit the camera on the body it follows. Keep those obstacle objects available to the camera controller; do not delete a wall or omit its collision body to expose the view.

The camera MUST adapt to the promised space. Never remove or open a user-required enclosure, widen required geometry, or add an unintended exterior view to avoid camera obstruction.

## Pointer look and UI

Pointer Lock request, failure, retry, and focus semantics are owned by [input-handling.md](./input-handling.md). The camera only consumes relative deltas while `input.frame.snapshot.pointer.captured` is true. HUD elements that do not need pointer interaction SHOULD avoid intercepting the canvas. Pause and menu flows follow those same release and reactivation rules.

## Multiple cameras and viewports

`RenderSession` submits exactly one main `RenderView`. A runtime switch SHOULD replace that view; it MUST NOT create a second renderer loop.

For simultaneous cameras, the submitted view SHOULD use native `ArrayCamera` subviews and update their `viewport` rectangles from `RenderView.resize`. Per-view visibility SHOULD use native Three layers. See [multi-viewport.ts](../../examples/multi-viewport.ts).

An off-loop `captureCameraPreview` is appropriate for a still image or thumbnail. It SHOULD NOT be used as a second per-frame rendering loop.

## Camera sequences

Use `wanaka-studio-engine/camera-sequence` for an authored cinematic path with timed cuts, lens changes, and markers. Keep ordinary fixed, first-person, follow, and chase cameras on the native strategies above. Read `../engine-api/camera-sequence.d.ts` before writing calls; that generated declaration is the API authority.

Definitions are plain TypeScript literals. Put a reusable definition in a project module such as `game/cinematics/opening-camera.ts`, import it only from the Play graph, and construct the player from `activateGame`. The [cinematic camera example](../../examples/cinematic-camera.ts) is a closed ownership slice, not a complete opening coordinator.

### Define the path

Call `defineCameraSequence` with a unique `id`, a finite positive `durationSeconds`, at least two time-ordered keyframes, and optional markers. The first keyframe is at zero and has no `transition`; every later keyframe explicitly chooses one of:

- `{ kind: 'cut' }` for an atomic pose and lens cut at the destination time;
- `{ kind: 'linear', easing }` for straight travel;
- `{ kind: 'smooth', easing }` for a smooth authored path.

The supported easing names are `linear`, `ease-in-cubic`, `ease-out-cubic`, and `ease-in-out-cubic`. Easing applies to the complete transition into the keyframe. A cut has no easing.

A position is either `{ world: [x, y, z] }` or `{ anchor, local: [x, y, z], sampling: 'snapshot' }`. Snapshot anchors capture the native `Object3D` world transform when a play generation begins. Use them for a stable local coordinate system or a final gameplay pose that must not drift while the sequence runs. Live anchors are not supported.

Aim is explicit at every keyframe:

- `look-at` targets a world or snapshot-anchor point and supplies a deterministic orientation fallback for the coincident-point case;
- `euler-degrees` uses Three X/Y/Z angles with `YXZ` order;
- `quaternion` takes a normalized `[x, y, z, w]` orientation;
- `binding` snapshots another anchor's world orientation, which is useful for ending exactly on a gameplay rig pose.

Do not interpolate between look-at and orientation modes; cut between them. Orientation interpolation follows the shortest quaternion arc.

Lens animation supports a native `PerspectiveCamera` and `{ kind: 'perspective', fovDegrees }`. A sequence that authors any FOV also gives the first keyframe an FOV. The player never owns aspect, near/far planes, or host resize.

`defineCameraSequence` validates, copies, and freezes its input. Keep marker ids unique. Markers publish cinematic cues such as HUD, subtitle, audio-director, or mission intents; they do not transfer ownership of those systems to the camera player.

Treat `onMarker` as a cue publisher. A marker callback may request `cancel()` for a safe exit; do not issue `pause`, `resume`, `seek`, `skip`, `prepare`, or `play` reentrantly from that callback. Coordinate those controls from the owning project state machine after the callback returns.

### Attach and play

Pass the `PerspectiveCamera` from the current main `RenderView`. The player waits to claim that exact scene-and-camera pair; if you pass a secondary or off-loop camera, `ready` remains pending until it becomes the main view.

Create the player after the scene's character, animation, and other presentation writers have registered their updates:

```ts
const player = CameraSequencePlayer.create(scope, scheduler, {
  camera,
  sequence,
  anchors: { origin, 'gameplay-handoff': gameplayHandoff },
  clock: 'presentation',
  onMarker: (marker) => openingCoordinator.publish(marker.id),
});

pauseGameplayCameraWriter();
const playback = player.play({ completion: { kind: 'hold' } });
await playback.ready;
await playback.finished;
resumeGameplayCameraWriter();
```

Do not block `activateGame` by awaiting those receipts inside the activation call stack. Start the playback there, then let the project coordinator observe the promises asynchronously.

Sequence playback follows Pose ownership above: the player rejects overlapping sequence-player claims, but native project writes are outside that protection, so pause a follow, look, debug, or other gameplay camera writer before `play()` and resume it only after `finished` settles.

The driven `PerspectiveCamera` must keep both `matrixAutoUpdate` and `matrixWorldAutoUpdate` enabled. The player fails before claiming a camera that uses manually maintained matrices, because it cannot safely restore an arbitrary authored matrix or shear from position and quaternion state.

Every direct call to `play()` starts a generation and captures its initial camera state and snapshot anchors. It returns `ready`, which settles after the starting pose reaches a submitted main frame, and `finished`, which settles after the terminal frame, completion policy, and ownership cleanup.

`prepare(timeSeconds?)` is optional. It starts a generation at zero or the requested time, applies that pose, and resolves only after the pose reaches a submitted main frame. Use it when a video or other covering presentation must reveal an already-rendered scene beneath it. Calling it from `activateGame` is valid; awaiting it in the activation call stack is not. Direct `play()` performs its own preparation when no prepared generation exists.

Every play chooses a completion policy:

- `hold` leaves the final pose and FOV in place, then releases ownership. Make the last keyframe match the gameplay rig's intended pose and resume that writer after `finished`.
- `restore` presents the terminal frame, restores the pre-play pose and FOV, then releases ownership. Use it for a temporary insert or preview.

The completion union does not switch to another camera. A gameplay handoff uses the same driven camera, a final snapshot binding that matches the gameplay rig, `hold`, and an explicit project-level writer resume.

Use `pause()` and `resume()` for the sequence clock itself. `seek(timeSeconds)` changes the requested playhead without firing markers by default; opt into crossed-marker delivery only when the project owns that replay behavior. `skip()` reaches the terminal pose without firing remaining markers by default; opt into remaining-marker delivery only for cues that must be committed. `cancel()` exits the current generation through its safe cancellation path. Both `skip()` and `cancel()` are safe no-ops once a generation is already finishing or has settled (`completed` or `cancelled`). The parent `LifetimeScope` owns player teardown. Read `snapshot()` for state and playhead diagnostics, not as a substitute for looking at the submitted frame.

### Choose the clock

`presentation` is the default cinematic clock. It advances from rendered-frame time and suits openings, cutscenes, and camera motion that must stay with what the player sees. Pausing the RuntimeSession does not pause this clock; call `player.pause()` when the cinematic must freeze.

`simulation` advances with scaled gameplay time. Choose it only when the camera path intentionally slows or freezes with project simulation. The player does not pause input, physics, AI, animation, video, audio, or HUD; the project coordinator owns those policies.

### Pure sampling

`sampleCameraSequence(sequence, timeSeconds, bindings)` returns the deterministic position, quaternion, lens, keyframe, segment progress, and cut state without mutating a camera. Supply resolved serializable snapshot binding records in the shape declared by `camera-sequence.d.ts`. Use the pure sampler for deterministic calculation and Studio-style scrub logic; use `CameraSequencePlayer` for runtime ownership, markers, and submitted-frame receipts.

## Troubleshooting

- Reversed movement or captured look can come from a basis/sign mismatch. A changed
  pose alone does not establish the direction labels; the signed movement probe below
  and Captured pointer look describe the relevant comparisons.
- A wall-filled, dark, empty-horizon or target-occluded view points to framing and
  scene readability at that pose. Spawn does not represent every constrained area.
- Split-screen or minimap errors after resize point to viewport geometry and
  visibility filtering at the affected host size.
- Camera jumps or lost gameplay control after a sequence point to pose ownership,
  markers, and terminal handoff. A cut, FOV change, skip, cancel or teardown can expose
  that boundary; these are possible causes to investigate, not a playback checklist.

### Signed movement probe

When diagnosing camera-relative movement, start every probe from the same committed pose and the same submitted camera orientation. Project `camera.getWorldDirection(forward)` onto XZ and normalize it; define `right = (-forward.z, forward.x)`. Hold each input separately for a bounded number of fixed steps and measure displacement from the authoritative simulation pose, not camera yaw or a presentation offset:

- A or left input projects negatively onto `right`.
- D or right input projects positively onto `right`.
- W or forward input projects positively onto `forward`.

Reset to the same pose between probes. Do not hold opposing inputs together, infer labels from yaw alone, or use an unlabeled opposite displacement as evidence. When the selected movement space is world, actor, grid, vehicle, side-plane, or six-axis, test that declared basis instead of applying this camera-relative probe.

### Sequence troubleshooting

For an authored camera sequence, compile the complete Edit and Play graphs even
though the sequence belongs only to Play. The retained player's `snapshot()` and
the pose/lens at the affected playhead can help locate a handoff or sampling issue.
If a chosen investigation needs exact-time observation, a temporary test-support
control can call `seek()`; consider its preparation cost before adding it.

Source presence, a sampler result, or a settled promise alone does not establish
observed framing, visibility, or a clean handoff. Report the observations actually
available without treating every cut, viewport, or exit path as required coverage.
