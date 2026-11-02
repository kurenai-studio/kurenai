# Genre: Roguelike and Roguelite

## Core dimensions of a Roguelike / Roguelite

This guide owns run-based session lifecycles across **Roguelite** (run-based play paired with between-run permanent meta-progression) and **Roguelike** (strict per-run permadeath when the brief asks for zero carryover): deterministic run seeds, procedural route/encounter variation, in-run build construction, full run-state teardown on defeat or victory, and between-run meta-progression that turns defeat into forward progress.

Select and combine from the three dimensions below to match the requested game or subgenre (making a deliberate depth vs. breadth trade-off in the first pass rather than forcing one fixed template onto every game):

### 1. Stage, route, and environmental randomness (how the player advances)

- **Room or biome exits with reward/variant previews**: clearing an encounter unlocks exit doors or biome paths in the scene that preview the next room's reward or room variant (combat, elite, treasure, merchant, event, boss);
- **Procedural dungeon, platform, or room chunks**: interconnected combat rooms, platforming segments, treasure rooms, shops, secret rooms, readable traps/hazards, and boss chambers;
- **Branching node map**: a route graph of combat, elite, `?` risk-reward event, campfire/rest, merchant, and boss nodes;
- **Arena wave or time-pressure director**: a bounded or scrolling arena where a director escalates enemy density, elite spawns, and in-arena drops over time or waves.

### 2. In-run build and reward randomness (how a run grows)

- **Weapon / equipment drops with affixes & slot swaps**: chests, pedestals, elites, or shops drop weapons/skills with random rarities and affixes (`burn`, `freeze`, `pierce`, `lifesteal`, etc.) that swap into bounded equipment slots;
- **In-run shops & economy**: spending run currency to buy gear/cards/relics/consumables, pay escalating costs to **Reroll** shop stock or **Remove** cards, **Lock** offers, or **Merge** duplicate weapons;
- **Passive relics, stat altars & risk-reward contracts**: stat scroll altars, rule-changing relics, and cursed chests or `?` events that trade health, gold, or temporary curses for high-tier rewards;
- **Deck / dice / pool manipulation**: shuffle-time RNG, visible enemy intents, card/dice rewards (with **Skip** to keep the pool lean), and campfire upgrades vs. healing;
- **Synergy boons, item combinations & level-up drafting**: deity boons or passive item synergies with rarity scaling and multiplicative tag interactions, or XP-gem level-up choices with weapon/passive slot caps and evolutions.

### 3. Between-run meta-progression and loadout preparation (matching the subgenre)

Match the between-run layer to the subgenre's design philosophy:

- **Vertical meta-upgrades & hub preparation** (default for action roguelites, dungeon crawlers, and survivors): bank earned meta-currency (essence, cells, darkness, souls, or gold) on defeat or victory, and let the player spend it in a hub camp/sanctuary or title/result panel on permanent upgrades (extra health/damage, revive / death-defiance charges, starting flask/gold, shop reroll dice, higher rare-drop odds) or starting weapon/keepsake selection;
- **Base / town management loop** (for adventure + management hybrids such as *Cult of the Lamb* or *Moonlighter*): compose with [Farm sim](./genre_farm_sim.md) (`management` / `farm-loop`) so resources looted during a dungeon run feed between-run shopkeeping, crafting, or settlement building;
- **Horizontal unlocks or strict zero-carryover** (for deckbuilders, skill-purity platformer roguelikes, or traditional roguelikes): keep starting combat stats flat so skill and strategy stay primary, using between-run progression to unlock new cards, relics, or characters into the pool — or omit carryover entirely when strict permadeath is requested.

| Plan route / pattern | Core structure and module composition |
| --- | --- |
| `roguelike/action-roguelike` (archetypes: `arena-advance`, `boss-route`, `deck-and-relic-run`) | Seeded room, biome, or node-map progression, encounter clear gates, subgenre-matched in-run build mechanics (weapon/affix drops, boons, scrolls, relics, shops, or deck/dice rewards), boss payoff, clean run reset, and between-run meta-progression. Composes with [Action Combat](./genre_rpg_action_combat.md) for 3D/isometric action roguelikes, [3D platformer](./genre_3d_platformer.md) for 2D/2.5D platformer roguelikes, [Shooter](./genre_fps_tps.md) for twin-stick/bullet-hell or FPS roguelikes, [Board and card](./genre_board_card.md) (`hand-and-tile` for deckbuilders/dice; `board-strategy` for tactical grid roguelikes), [RPG](./genre_rpg.md) (`turn-based-tactics`) or [RTS / tower defense](./genre_rts_td.md) for squad/tactical roguelikes, and [Farm sim](./genre_farm_sim.md) for run + town-management hybrids. |
| `roguelike/topdown-survivors` (archetypes: `garden-horde`, `night-market-run`, `endless-gauntlet`) | [Top-Down Survivors preset](./genre_roguelike_topdown_survivors.md): player steering, automatic attacks, escalating pooled swarms (`THREE.InstancedMesh`), wave/XP upgrade drafting or between-wave shop reroll/merge, between-run power-ups/character unlocks, and instant run retry. |
| `traditional-roguelike` (uses `roguelike/action-roguelike` or `board-card/board-strategy` in Plan Studio) | Turn-based, grid-based procedural dungeon crawl with strict permadeath, step-locked turns, and emergent item/environment interactions. Composes run seed and reset rules here with the grid/turn reducer in [Board and card](./genre_board_card.md) (`board-strategy`) and stat/inventory rules in [RPG](./genre_rpg.md). |

Do not route persistent quest/story RPGs or manual-skill hack-and-slash loot RPGs without run resets here; those belong to [RPG](./genre_rpg.md).

## Run state, meta state, and reset authority

Strictly separate transient run-owned state from durable meta-progression state:

- **run state (reset every run)**: run ID, PRNG seed, current room/node index and route graph, temporary in-run build (equipped run weapons, relics, boons, or deck), run health/currency/curses, and run result;
- **room / encounter state (reset every room)**: live enemies, room exits/doors, chests/pickups/merchants, projectiles, hazards, and objective status for the active node only;
- **meta-progression state (preserved across runs)**: banked meta-currency, purchased permanent upgrade levels, unlocked starting weapons/characters/relics, and run history;
- **presentation**: native Three objects, DOM overlays, audio, and VFX derived from committed state.

On defeat, victory retry, or starting a new run:

1. Settle and bank any earned meta-currency into **meta-progression state** at most once for the finished run.
2. Increment the run generation, allocate a fresh run ID and seed, and initialize the new run's starting stats and loadout from the current **meta-progression state**.
3. Dispose the previous run's `LifetimeScope` so all room actors, interactables, timers, scheduler hooks, physics bodies, pools, and pending in-run modals are torn down before constructing the next run.
4. Never carry transient in-run buffs, curses, queued level-up modals, or enemy handles across a run reset.

## Room graph, in-run build, and meta transactions

When the game uses a room or node graph (`action-roguelike` / `room-roguelite`):

- Own the finite graph or seeded generation policy in plain serializable run data, never in live Three scene objects. Ensure procedurally selected or assembled rooms, platforms, and dungeon chunks preserve a connected, traversable route from entrance to required interactables and exits (no unreachable doors or soft-locks) and keep hazards readable before impact.
- A room completes only when its authoritative objective commits (such as clearing the encounter ledger); a timer or empty visual list does not settle the room unless that is the declared rule.
- In-run build changes — weapon swaps, affix rolls, relics, shop purchases/rerolls, card drafts/upgrades/removals, scroll/boon choices, and cursed chests — commit through one atomic transaction (`reward/offer identity → validation → run-build commit → derived stat/rule change → presentation`). Each accepted build change MUST alter at least one authoritative gameplay parameter, action rule, status effect, or deck/weapon behavior rather than only changing UI text.
- On room transition, commit the room reward once into run state, record the chosen next node/door, dispose the old room's child scope, construct the next room from run data, and re-enable player input only when ready.

Meta-upgrades and starting-loadout unlocks use the same atomic transaction pattern against **meta-progression state**: validate meta-currency cost, commit the upgrade level or unlock once, and apply the recalculated starting stats, revive charges, or loadout when the next run initializes.

## Parameter boundary

Record project-selected values and units for run length or room count, seed and offer/drop cadence, weapon/relic/card/boon definitions, upgrade/shop/reroll costs, difficulty escalation per node/wave, and meta-currency earn rates and meta-upgrade costs.

## Troubleshooting

- Runs unexpectedly sharing an identity, seed, or starting build point to run initialization mixing with persistent meta-progression.
- A boon, item, draft, or upgrade changing the UI but not subsequent gameplay points to modifier application or the authoritative consumer.
- Rejected purchases mutating funds, or rewards applying twice, point to transaction guards and commit identity.
- A locked exit opening early, or a transition retaining old room actors, points to gate prerequisites and room lifetime.
- Defeat/victory banking currency repeatedly or a new run losing meta-upgrades points to result locking and the run/persistent-state boundary.
- Reward, shop, or progression overlays allowing gameplay input through point to input and camera ownership.
- For a specific issue, useful existing state includes the run ID and seed, node/wave, active modifiers, transaction status, meta-progression, and reset generation.

## Implementation

Keep run, room-graph, and meta-progression state as serializable TypeScript data under the Play closure. Route offer generation, room branching, deck shuffling, and drop rolls through a seeded PRNG stored on the run state so replays and tests are deterministic.

Use a parent run `LifetimeScope` for run-wide listeners and a child encounter/room `LifetimeScope` for per-room enemies, interactables, physics bodies, and effects. When meta-progression persists across browser reloads, bind `PersistenceSession` once on `context.session.scope` ([persistence.ts](../../examples/persistence.ts)) and persist only meta-progression truth, never live run objects.
