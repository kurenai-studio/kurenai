# Genre: Adventure and exploration

## Routes and composition

Adventure and exploration games center on spatial navigation, landmark reading, object/clue inspection, NPC interaction, and branching world or story state. Treat these routes as composable lenses:

- `free-explore` / `world-stroll`: first-person or third-person 3D traversal between landmarks, optional detours, and environmental discoveries;
- `interactive-discovery`: close inspection of objects, rooms, clues, and mechanisms where discoveries unlock new interactions or paths;
- `action-adventure`: exploration and landmark progression composed with traversal ([3D platformer](./genre_3d_platformer.md)), melee combat ([Action Combat](./genre_rpg_action_combat.md)), stealth perception ([Survival horror](./genre_survival_horror.md)), shooting ([Shooter](./genre_fps_tps.md)), or environmental puzzles ([Puzzle / casual](./genre_puzzle_casual.md));
- `narrative-choice`: dialogue trees, branching story/relationship flags, clue deduction, and multiple endings under fixed cameras, 3D staging, or 2D portrait overlays.

When composed with [RPG](./genre_rpg.md) for an open-world or story RPG, this guide owns landmark discovery, inspection ray/trigger resolution, and world/dialogue flag commits while RPG owns character/party progression and inventory/equipment rules.

## Camera and input by viewpoint

Match camera and pointer ownership to the chosen viewpoint rather than forcing one input lock onto every adventure:

- **First-person or third-person free-look 3D**: Desktop free-look MUST use Pointer Lock on `context.viewport.surface` and consume relative mouse movement from the captured pointer snapshot ([pointer-lock.ts](../../examples/pointer-lock.ts) with [first-person-look.ts](../../examples/first-person-look.ts) or [third-person-orbit-look.ts](../../examples/third-person-orbit-look.ts)). Do not replace relative look with mouse dragging, Q/E/R camera keys, or an automatic camera that fights player look. The activation gesture requests Pointer Lock; because the browser consumes the first `Escape` key press to revoke Pointer Lock without firing `keydown`, open pause on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) so a single `Escape` press opens the menu; a later Start or Resume gesture acquires the lock again without firing a stale action edge on the first frame. Follow [input-handling.md](./input-handling.md) for request-in-flight and denied-request states. Touch projects use left-stick movement and right-stick or right-half-screen swipe look writing the same yaw and pitch state.
- **Top-down, isometric, side-view, fixed-camera, or cursor/dialogue narrative (`narrative-choice` / point-and-click)**: Do NOT request Pointer Lock. Keep the pointer free for clicking world targets (projected through the active camera via Three `Raycaster`) and choosing dialogue or inspection options, paired with planar keyboard/touch movement when direct character locomotion is present.

Third-person orbit look follows the committed interpolated character presentation node, keeps the player readable, and resolves obstruction with a project-owned ray or sweep. First-person look follows the eyes pivot and keeps the interaction ray aligned with the submitted camera. One camera module owns the pose. Camera-relative movement uses the shared basis and signed movement probe in [camera.md](./camera.md); never derive movement from an orbit pivot or target-to-camera offset.

## Discovery and narrative contract

Before implementation, declare:

- the place or scene graph the player explores and its continuation, chapter, or completion boundary;
- the discovery or narrative subjects: landmarks, inspectable props, clues, mechanisms, NPCs, or dialogue branches;
- the interaction that commits each discovery or flag and the authoritative state it changes;
- the reset boundary for transient observations and the persistence boundary for durable discoveries or story flags;
- how landmarks, lighting, framing, or concise prompts guide the player without covering the view in a checklist.

Every discovery, clue, mechanism state, and dialogue flag has a stable logical identity and commits once. Pause, retry, refresh, and repeated inspection MUST NOT duplicate its reward or consequence. Presentation reads committed discovery state; it never becomes the source of truth.

## World and interaction

Build a connected, readable space with meaningful points of interest. An inspection or dialogue choice can reveal information, trigger an animation or camera cut, open a path, alter a prop, update a relationship or story flag, or start an encounter.

In free-look 3D, the interaction ray uses the submitted camera's viewing direction (or a bounded proximity + facing check for nearby prompts) and MUST NOT read a camera parent pivot. In cursor-driven or fixed-camera routes, convert pointer client coordinates against the active render surface rectangle before raycasting. Pause freezes movement, interaction rays, discovery timers, ambient actors, and presentation transitions.

## UI and presentation

Use the shared game UI and keep `.wk-reticle` out of non-shooting exploration. A free-look adventure MAY show a subtle center prompt or interaction hint, but it MUST NOT mount the four-tick shooting reticle unless the game actually fires shots through the screen-center look ray. During captured free-look play, interactive menus and dialogue choice buttons open only after releasing Pointer Lock (or use keyboard/gamepad selection edges without requiring a free cursor). For NPC or story dialogue, choose one of the three presentation modes in [ui.md](./ui.md) — a clean bottom `.wk-dialogue` panel (without inventing 2D portraits when the project has none), a **shot-reverse-shot conversation camera** switching `CameraRig` shots between speaker and listener while hiding HUD clutter, or a **cinematic cutscene sequence** (`camera-sequence`).

## Troubleshooting

- A discovery or dialogue choice that changes nothing later can be disconnected from committed story state. Trace the choice to the later interaction, branch, or reachable space it is meant to affect.
- An interaction firing twice can come from duplicate input edges or a missing once-only commit.
- Free-look movement or interaction pointing away from the visible view suggests camera/input ownership or basis mismatch; see [camera.md](./camera.md). For fixed-camera or cursor-driven play, accidental world actions can come from UI click-through.
- Stale movement after Escape, focus loss, or a denied Pointer Lock request points to capture-state handling. Pause and retry leaks point to transient state ownership.
- A blocked continuation or unwanted scoreboard can come from applying a terminal-session model to a chapter or open-ended exploration loop.

## Implementation

Keep exploration, clue, and dialogue-flag state as ordinary serializable TypeScript data under the Play closure. Store stable discovery IDs and committed facts; keep Three objects, listeners, DOM nodes, and pointer-lock handles transient and scoped to the current session. Use one coordinator for discovery/flag commits and reset. Derive camera, UI, audio, and effects from committed state after each interaction.
