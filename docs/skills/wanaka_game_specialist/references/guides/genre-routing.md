# Genre routing

Treat genre guides as composable Wanaka Engine integration and state-authority modules, not mutually exclusive game templates. The user's brief and natural game-design conventions own the gameplay loop, world structure, progression, and completion or continuation rules. Named modes, match formats, stage sequences, and win/lose wrappers inside a genre guide are fallback defaults only when the user's request leaves the loop unspecified. Isolated sidecar questions and ordinary Three.js implementation skip genre routing.

When a game blends genres or borrows a sub-mechanic (for example: an open-world action RPG combining RPG growth, world exploration, and 3D melee; a linear action-adventure combining traversal, stealth sight checks, and over-shoulder shooting; a shooter RPG; or a side-scrolling action roguelite), load the guide for each mechanic the game actually uses. Take only that mechanic's Engine integration and transaction rules, drop unrequested match scoreboards, wave shops, extraction timers, or roguelite resets, and declare the single authoritative owner for shared state, input, camera, actor transform, settlement, and persistence.

Any task involving a HUD, menu, dialogue, or other interface reads [Game UI](ui.md) first. The UI guide owns look hooks, platform rules, and screen composition; this route guide owns the genre's gameplay information priority.

For an original whole-game build, the shared player-experience floor — promised loop, phase roles, project-specific values, readability, and honest completion — lives in the [good-game scaffold](_good_game_scaffold.md). Where a genre guide defines a default camera, projection, movement, or input setup and the brief fits it, follow that guide directly.

| Category | Guide | Modes and compatibility routes |
| --- | --- | --- |
| Adventure / exploration | [Adventure and exploration](genre_adventure_exploration.md) | `free-explore`, `world-stroll`, `interactive-discovery`, `action-adventure`, `narrative-choice`; first-person and third-person free-look use Pointer Lock, while top-down, side-view, fixed-camera, and cursor/dialogue narrative routes keep a free cursor; composes with 3D platformer, Action Combat, Shooter, Puzzle / casual, or RPG |
| Platform / parkour | [3D platformer](genre_3d_platformer.md) | `course-platformer`, `precision-platformer`, `obstacle-run`, `collectathon`, `hub-adventure`, `technical-tower`, `incremental-escape`; `cooperative-hazard-escape` is online multiplayer — start with the `wanaka:wanaka_game_multiplayer` Skill instead of substituting local split-screen |
| Shooter | [first-person / third-person](genre_fps_tps.md) | `short-duel`, `arena-deathmatch`, `objective-shooter`, `gun-ladder`; viewpoint is first-person or third-person, selected separately; for a shooter RPG or a prompt naming a role-playing franchise/sequel that uses guns (*Cyberpunk*, *Fallout*, *Starfield*, *Mass Effect*, *Borderlands*, *Deus Ex* — even when the prompt does not literally say "RPG"), ALWAYS load **both** `genre_rpg.md` (world/NPC/quest stage, attributes/perks/cyberware/gear, unified menus) **and** `genre_fps_tps.md` (viewmodel/over-shoulder aim, ADS, recoil, `--wk-reticle-gap`, shot/hit feedback) |
| Racing / driving | [3D racing](genre_3d_racing.md) | arcade racer (default), circuit, time trial, drift; simulation wheeled only when the brief demands it; drag, endless drive |
| Puzzle / casual | [Puzzle / casual](genre_puzzle_casual.md) | `logic-grid`, `sokoban`, `merge-grid`, `escape-room`, `falling-block`, `forced-perspective`, `physics-puzzle` |
| Farm / life / management | [Farm sim](genre_farm_sim.md) | `farm-loop`, `management`, `life-adventure` |
| Strategy | [RTS / tower defense](genre_rts_td.md) | fixed-route tower defense, compact RTS, lane strategy |
| Survival horror | [Survival horror](genre_survival_horror.md) | `pursuit-extraction`, `resource-scarcity`, `loot-risk-extraction`; sight, noise, and patrol/search perception rules also compose as stealth modules in other genres |
| Fighting | [Fighting](genre_fighting.md) | `versus-round`, `arena-brawler`, `platform-brawler`, `beat-em-up` |
| RPG | [RPG](genre_rpg.md) | ALWAYS load `genre_rpg.md` together with the matching combat/exploration guide for any RPG: `open-world-quest` (open-world, monster-hunting, or first/third-person shooter RPGs such as *Cyberpunk*, *Fallout*, *Starfield*, *Mass Effect*, or *The Witcher*; load **both** `genre_rpg.md` and `genre_fps_tps.md` or `genre_rpg_action_combat.md` plus `genre_adventure_exploration.md`), `action-combat` ([Action Combat preset](genre_rpg_action_combat.md): load **both** `genre_rpg.md` and `genre_rpg_action_combat.md` for 3D soulslike/combo ARPGs and isometric hack-and-slash loot ARPGs), and `turn-based-tactics` (turn-based command JRPG, ATB, dice-check CRPG, or grid SRPG composing Board / card) |
| Roguelike / roguelite | [Roguelike](genre_roguelike.md) | `action-roguelike`, `room-roguelite`, `deck-and-relic-run`, `traditional-roguelike` (seeded room/node or grid dungeon runs, in-run weapon/boon/relic/shop/deck builds, permadeath reset, and between-run meta-progression; composes with Action Combat, 3D platformer, Shooter, Board / card deckbuilders & tactical grids, RPG / RTS tactics, or Farm sim management hybrids), and `topdown-survivors` ([Top-Down Survivors preset](genre_roguelike_topdown_survivors.md): `bullet-heaven` / `survivors-like` auto-attacking high-count swarm) |
| Sports | [Sports](genre_sports.md) | `team-ball`, `racket-sport`, `target-sport`; racing and checkpoint athletics route to 3D Racing |
| Board / card | [Board and card](genre_board_card.md) | `board-strategy`, `hand-and-tile`, `track-and-economy`; also supplies grid-tactical turn reducers and deterministic deck/zone conservation for card battlers and deckbuilders |
| Flight | [Flight](genre_flight_space.md) | `checkpoint-time-trial`, `civil-free-flight`, `arcade-combat-mission`, `helicopter-lite`; report a genre/platform gap for a six-axis or orbital space request unless the brief supplies that model |
| Rhythm | [Rhythm](genre_rhythm.md) | `highway-tap`, `lane-based`, `falling-mania`, `gesture-rhythm` |
| Physics construction | [Physics construction](genre_physics_construction.md) | `objective-builder`, `sandbox-builder`; this is not the `physics-puzzle` route |

## Overriding camera, projection, controls, or composing sub-mechanics

When the brief asks for a camera, projection, movement style, or hybrid gameplay loop different from a genre guide's fallback default — or when a guide leaves that dimension open — follow the user's promised activity loop, progression, and completion rules while keeping the selected Engine invariants and choosing each technical dimension from its owning guide:

| Dimension | Options | Owning guide |
| --- | --- | --- |
| Camera role | first-person, over-shoulder, orbit, follow/chase, side-follow, fixed/zone | [camera.md](camera.md) |
| Projection | perspective, orthographic | [camera.md](camera.md) and the submitted `RenderView` |
| Movement space | camera-relative planar, world-space, actor-relative, side-plane, grid/track, six-axis | [camera.md](camera.md), [input-handling.md](input-handling.md), and the motion owner |
| Look input | captured pointer, touch look, fixed/no look, project-owned pointer gesture | [input-handling.md](input-handling.md) |
| Motion owner | `CharacterController`, project integrator, `VehicleController`, rigid body, grid/state reducer | [physics.md](physics.md) |

Do not treat a camera or control override as a second genre, and do not force a borrowed sub-mechanic's standalone match or run wrapper onto the host game. Every shared channel still requires a single authoritative writer. Projection changes lens and framing, not semantic movement signs. Camera `-Z` viewing and gameplay model `+Z` facing remain separate contracts.
