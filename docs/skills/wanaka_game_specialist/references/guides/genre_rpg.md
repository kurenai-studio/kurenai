# Genre: RPG

## Core pillars of an RPG

An RPG combines two pillars that work together:

1. **An authored role-playing stage (world, exploration, combat, and narrative)**:
   The player inhabits a character or party inside a crafted setting — an open region, a semi-open hub-and-dungeon layout, or a linear chapter space — where spatial exploration, NPC or environmental storytelling (matching the subgenre: live NPC dialogue, quests/contracts, and settlement/camp hubs in open-world/narrative/CRPG/hunting RPGs; or rest shrines, relics, and concise NPC/environmental lore in solitary dungeon crawlers and soulslikes), and combat encounters connect into a coherent journey.
2. **A player-directed character progression and build system**:
   The player shapes how their character or party grows and fights through explicit RPG systems such as **attributes/stats**, **skill trees or spell loadouts**, **equipment slots (weapons, armor, accessories/relics) with item stats/affixes or upgrades/socketing**, **consumables and key items**, and **class or party synergies**.

### Randomness and encounter staging boundary

Keep the world layout, story beats, quests, key NPCs, boss encounters, and milestone rewards **handcrafted and authored**. Populate dungeons and regions with **spatially placed enemy packs or camps (standing packs that aggro on proximity)** where defeated bosses, opened gates/shortcuts, and character progression stay permanent on recovery (while regular packs either stay cleared in dungeon/quest RPGs or respawn on rest in soulslikes — do not structure an RPG dungeon as a timed arena wave spawner or reset floor progress back to Floor 1 on death). Use randomness only where it serves replayable texture — such as minor enemy spawns, loot affix rolls, or combat/skill-check dice — rather than replacing authored world progression or character build systems with random wave survival or random three-card buff popups (which belong to [Roguelike](./genre_roguelike.md)).

## Subgenre focus and first-pass scope trade-offs

A first playable build does not need every possible RPG subsystem at full scale, nor should it strip away progression or the role-playing world. Make a deliberate **depth vs. breadth trade-off** that matches the requested subgenre:

- **Depth-first**: focus on 1–2 interconnected progression systems with rich build decisions (for example, itemized equipment drops with affixes and smith upgrades paired with an active skill tree, or combat-art unlocks paired with posture/gourd upgrades) inside a compact, atmospheric hub-and-zone stage.
- **Breadth-first**: connect world exploration, NPC quest dialogue, combat, and a clean multi-tab character/inventory/skill sheet so the full role-playing loop is playable end to end.

| Subgenre | Role-playing stage & combat focus | Progression & build focus | Engine module composition |
| --- | --- | --- | --- |
| **Hardcore Action / Soulslike ARPG** (`action-combat`) | Atmospheric linear or interconnected shrine-to-boss stage with unlockable shortcuts and boss fog gates; deep melee timing, stamina/posture, deflect/dodge windows, and multi-phase bosses; concise environmental or NPC narrative | Rest-point (bonfire/shrine) progression that refills flasks, respawns standard foes, and unlocks combat arts/spirit skills, weapon/armor or relic loadout, and gourd/vitality upgrades | RPG progression + [Action Combat](./genre_rpg_action_combat.md) (`over-shoulder-keyboard`, lock-on, `CombatArena` or `ActionCombat`) |
| **Isometric Hack-and-Slash Loot ARPG** (`action-combat`) | Town camp/merchant hub connected to authored dungeon zones, standing monster packs (with proximity aggro), and boss lairs; fast pack clearing and manual hotbar skill rotations | Deep itemization & build synergy: multi-slot equipment (weapon, armor, ring/amulet) with rarities/affixes, loot drops, smith upgrades/socketing, and skill/attribute allocation | RPG itemization & stats + [Action Combat](./genre_rpg_action_combat.md) (`fixed-camera-point-to-move` or planar hybrid) |
| **Turn-Based / Party JRPG** (`turn-based-tactics`) | Explorable town/dungeon stage with story dialogue and encounters that transition into stylized turn-based or ATB battles (presentation may focus on clean command menus and camera cuts rather than complex physics) | Rich party & growth systems: party roster or persona/job switching, elemental weakness/break combos, leveling stats, equipment/consumable management, and story progression | RPG party/inventory state + turn-based/ATB reducer below |
| **Tactical Grid & Dice-Check CRPG / SRPG** (`turn-based-tactics`) | Interactive rooms or tactical maps where NPC dialogue, object inspection, and pre-battle choices branch through attribute/skill checks into grid-based AP combat | Character sheet attributes (`STR/DEX/CON/INT/WIS/CHA` or tactical stats), class skills/spells, equippable gear, and lootable containers | RPG character sheet & check reducer + [Board and card](./genre_board_card.md) (`board-strategy`) |
| **Open-World / Narrative Quest RPG** (`open-world-quest`) | Settlement/camp hub, wilderness landmarks, and dungeons with multi-stage NPC contracts, investigation clues, and branching dialogue | Balanced breadth: attribute/perk progression, equippable weapons/armor, spells/signs, and potions/crafting/vendors | Load **both** `genre_rpg.md` + [Action Combat](./genre_rpg_action_combat.md) (plus [Adventure and exploration](./genre_adventure_exploration.md)) |
| **First / Third-Person Shooter RPG** (`open-world-quest`, e.g. *Cyberpunk*, *Fallout*, *Starfield*, *Mass Effect*, *Borderlands*) | District/hub exploration, Fixer/companion NPCs, branching dialogue (with optional attribute/skill checks), and combat missions/bounties | Attributes, perks, multi-slot weapons/armor/cyberware, quickhacks/abilities, and vendor/clinic economy | Load **both** `genre_rpg.md` + [Shooter](./genre_fps_tps.md) (retaining full viewmodel/over-shoulder aim, ADS, recoil, `--wk-reticle-gap` reticle, and shot/hit feedback) |
| **Adventure-leaning Action RPG** (Zelda-like) | Exploration, environmental puzzles, and landmark dungeons | Streamlined progression centered on heart/stamina vessels, key traversal/combat tools, and equipment upgrades | [Adventure and exploration](./genre_adventure_exploration.md) + [Action Combat](./genre_rpg_action_combat.md) + RPG state |

## State layers and ownership

Separate only the serializable state layers the project uses:

- **profile / party state**: durable identity, level/XP, attributes, unlocked skills/spells, equipped items by slot, inventory/consumables, gold/materials, and save version;
- **world / quest state**: current region/location, active and completed quest stages, NPC dialogue/story flags, opened chests/gates, and committed world consequences;
- **activity state**: the active combat encounter, turn/check reducer, character/inventory/skill menu, dialogue node, or merchant/smith interaction;
- **presentation**: native Three objects, UI, camera, animation, audio, and effects derived from committed state.

Every state channel has one owner and one reset policy. A chapter transition, checkpoint respawn, rest point, load, or retry MUST state which layers reset and which survive. Transient Three objects, listeners, handles, DOM nodes, and pool slots never become saved progression truth.

## Progression, equipment, and quest transactions

Use one atomic, idempotent transaction for XP/level-up, attribute/skill allocation, loot/equipment changes, item use, quest stages, and rewards:

`eligible outcome → transaction identity → eligibility & cost validation → state commit → derived stat/unlock recalculation → presentation`

Each quest stage, chest, drop, dialogue reward, and purchase has a stable logical identity. Pause, refresh, retry, duplicate contact, repeated dialogue, and save/load MUST NOT grant it twice. Reject an ineligible or unaffordable action without partially spending currency/materials or mutating progression.

Derived combat and check stats (such as attack power, spell potency, max health/stamina/mana, armor/resistance, crit rate, or skill-check modifiers) should be computed from base attributes, equipped items, and active skill passives so progression systems genuinely interact.

Expose the active progression and narrative systems in a unified, multi-tab RPG menu (`ui/inventory` and `ui/pause` in [ui.md](./ui.md), mounting the tabs relevant to the subgenre's chosen systems) rather than hiding progression behind automatic stat bumps, disconnected popups, or one-line HUD strings:

- **Tabs**:
  - **Character (`C`)**: level, XP progress, and allocatable or inspectable attributes alongside derived combat/check stats;
  - **Inventory & Equipment (`I` / `Tab`)**: distinct equipment slots (such as weapon, armor, accessory/relic) and backpack items/consumables with rarities, affixes, or upgrade/socket actions;
  - **Skills / Spells (`K`)**: unlockable or equippable active skills, combat arts, spells, or personas;
  - **Quest Journal (`J`)**: active and completed quests with narrative context, step-by-step objectives, and rewards (while `.wk-objective` on the HUD tracks the current step);
  - **System (`Esc`)**: `Continue` / `Restart` actions integrated alongside the RPG tabs so pausing or pressing `Escape` gives immediate access to both character/quest tabs and session controls.
- **Interaction & Pointer Lock handoff**:
  - In 3D free-look games, browsers consume the first `Escape` key press to revoke Pointer Lock without delivering a `keydown` event; open the unified menu immediately on the capture-loss transition (`wasCaptured && !pointer.captured && !isRequesting`) so a single `Escape` press opens the menu (relying only on `wasPressed('Escape')` forces the player to press `Escape` twice);
  - Pressing `Tab`, `I`, `C`, `K`, or `J` while captured calls `document.exitPointerLock()` and opens the unified menu directly on that tab;
  - Once open, the player can click across all tabs freely with the cursor, and click `Continue` (wired as a Pointer Lock activation surface in 3D free-look games) to close the menu and re-lock the camera in one gesture;
  - Show concise hotkey hints in `.wk-muted` on the HUD (and clickable HUD buttons in cursor-driven or touch RPGs).
- **Dialogue presentation modes**:
  - Choose one of the three dialogue modes in [ui.md](./ui.md) to match the subgenre (without inventing 2D portraits when the project has none): a clean bottom `.wk-dialogue` panel (for isometric/tactical/2D RPGs), a **shot-reverse-shot conversation camera** switching `CameraRig` shots between speaker and listener while hiding combat HUD (for 3D open-world and action RPGs), or a **cinematic cutscene sequence** (`camera-sequence`) for key story/boss beats.

## Turn-based, ATB, tactical grid, and dice-check resolution

When the game uses turn-based commands, ATB gauges, tactical grid movement, or CRPG attribute/dice checks:

1. **Pure-data reducer authority**: One serializable reducer owns turn order / initiative / ATB fill, active unit, legal action and target set, AP/MP/item costs, elemental weakness/break state, status durations, or seeded dice rolls plus attribute modifiers.
2. **Unified command path**: Player UI menus, grid clicks, and enemy AI submit typed commands to the same validator and reducer. Illegal targets, insufficient AP/MP, or out-of-range cells reject cleanly without advancing the turn or consuming RNG. Pause freezes ATB clocks, AI timers, and pending turn handoffs.
3. **Commit before presentation playback**: Commit the turn action or check result once with a stable action ID, then drive attack animations, camera cuts, floating damage/check readouts, and VFX from that committed receipt. Animation or camera completion callbacks advance presentation sequencing only and MUST NOT re-apply damage, healing, status ticks, or RNG rolls.
4. **Exploration-to-battle handoff**: When exploration transitions into a turn-based or grid encounter, preserve world/quest and party state across the transition and return cleanly to exploration (with committed XP, loot, and quest updates) after the encounter resolves.

## Parameter boundary

Record project-selected values and units for XP/level curves, attribute and equipment formulas, skill/MP/AP costs, quest or check thresholds, loss/checkpoint recovery rules, and save cadence. Omit families the project does not use.

## Troubleshooting

- NPC, quest, or narrative interactions with no later consequence point to a missing connection to committed story or activity state.
- Equipment, skill, or attribute changes with no gameplay effect point to stat recomputation or consumers still reading defaults.
- Rejected purchases or quests changing state, or rewards applying twice, point to transaction validation and commit identity.
- Gameplay input continuing behind character, inventory, dialogue, or shop menus points to modal input and camera ownership.
- Respawn clearing durable progression, or save/load duplicating rewards, points to the transient/persistent boundary and reconstruction path.
- For a specific issue, useful existing state includes stats, equipped items/skills, quest stage, transaction status, active activity, and reset generation. In composed genres, trace the owner of the affected input, camera, transform, reward, or persistence channel.

## Implementation

Keep versioned profile/party, world/quest, and activity documents as ordinary serializable TypeScript data under the Play closure. Store stable logical IDs and committed facts; keep native objects and runtime handles transient.

One coordinator owns each progression, equipment, or quest transaction and reset. Validate eligibility and cost before mutation, commit the transaction identity with the state change, then derive stats, unlocks, and presentation from committed state.

When persistence is promised, use `PersistenceSession` with explicit bindings and a browser storage implementation from the published Engine entry points. Create it once on `context.session.scope` with `identity: context.session.identity`; a second `create()` throws. See [persistence.ts](../../examples/persistence.ts). Restore logical state first, validate its version and owner identities, then rebuild activities. Never partially restore live objects or replay already committed rewards.
