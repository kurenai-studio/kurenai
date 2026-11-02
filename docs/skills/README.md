# Agent skill pack

Source of the skill pack that Wanaka Studio agents load while authoring games.
Vendored here as plain files so the Engine API declarations, guides and examples
can be read and diffed next to the engine code. Nothing here is imported by a
build.

```
.claude-plugin/plugin.json          skill-pack manifest
wanaka_game_specialist/
  SKILL.md                          routing + high-traffic contracts
  references/guides/     (38)       genre routing, UI, physics, camera, assets,
                                    VFX, rendering, scene config, publishing...
  references/engine-api/ (59)       generated .d.ts declarations (API authority)
  examples/              (83)       compile-checked examples incl. scenes/ vfx/
wanaka_game_tester/
  SKILL.md                          test-session workflow + t.* / m.* API tables
  references/prepared-states.md     preparing state with game_test_support/
wanaka_game_multiplayer/
  SKILL.md                          online-room build route
```

185 files, ~2.2 MB.

## Reading order

1. `wanaka_game_specialist/SKILL.md`
2. `references/guides/_good_game_scaffold.md`, then the genre guide
3. the `references/engine-api/*.d.ts` declaration for whatever subpath you import
4. the matching file under `examples/`

A nested Engine subpath joins its segments with dots:
`wanaka-studio-engine/default-characters/blond-beard` →
`references/engine-api/default-characters.blond-beard.d.ts`.
The generated declaration is API authority; guides are prose and yield to it.
