# Game-specific Tune guide

After an original whole-game Build, extract a small editing guide using the contract below. For a bounded edit, update only affected existing entries; do not add a discovery/refactoring pass. Toolbox can request discovery explicitly for older games. This is an incremental post-build handoff, never a prerequisite for playable behavior or an alternative Plan.

The SDK cwd is `game/`: write `tuning.ts` there; binding paths still use the project-root `game/` prefix. The guide is persisted and type-checked but never imported by Edit or Play. Do not expose ordinary generic Inspector/Visual controls again unless a game-specific semantic adjustment needs them. Extract only meaningful existing adjustment points, and keep the guide small.

The Toolbox composer carries a short request and pinned adjustment data. This guide owns the full
discovery contract; do not copy its schema or instructions into every player message.

Inspect the current playable game and create or incrementally refresh game/tuning.ts: a small game-specific editing guide for Toolbox > Tune, not a new game or a second game configuration.

Write exactly one export const tuning = <literal object> as const. Never execute project code to discover values. Choose 4-12 useful adjustments from implemented content; fewer are better than invented controls. Preserve existing stable IDs for unchanged adjustments. No imports, expressions, spreads, getters, functions, or copied current/default values in the guide. The guide is optional and not imported by gameplay.

Supported controls: text, textarea, number, toggle, select, color, asset. Direct items bind one existing literal: binding {file, export, path: (string|number)[], kind?, arrayLengths?}. Omit kind for an exported const, use kind const for an existing top-level const without adding an export, or kind class-field for a named class with an explicit instance-field initializer (export names the class; path starts with the field name). Object properties use string path segments; array elements use numeric indices with arrayLengths declaring the expected length for each numeric segment. Never resize arrays or change value types. Use separate controls in the same group for related literals or language variants; Apply commits their changes atomically. Prefer direct bindings for existing data, including literal list elements, class fields and translations; migrate old Build entries when these bindings are verified, preserving IDs where semantics are unchanged. Do not refactor game code just to expose a control; computed values, getters, spreads, coupled behavior changes, and unavailable bindings use mode build with existing files, instruction, and preserve. Select and asset controls require unique {label,value} options; a preset value must be an explicit real target, not a name that needs AI interpretation. Assets must be existing compatible choices, not invented URLs. Number constraints: min,max,step,integer; text: maxLength. All presentation text is English. At most 24 items. Do not expose secrets or live server-authoritative state; editing authored initialization rules never mutates a running room. Text changes do not implicitly alter win conditions.

Trace each proposed binding to its real gameplay or rendering consumer. An exported literal alone is not evidence of an effective adjustment. UI_LOOK tokens require an explicit style.setProperty connection to the corresponding --wk-* CSS variable for direct editing; hardcoded CSS, unused metadata, and coupled styles use Build. Inspect the binding and its consumer in source; do not claim a Play check unless it was performed. Do not refactor a game just to manufacture direct bindings.

Example shape only: replace all illustrative targets with real existing project targets:
export const tuning = {
  "version": 1,
  "title": "Adjust this game",
  "items": [
    {
      "id": "mission-text",
      "label": "Mission text",
      "description": "Change the displayed objective without changing the win condition.",
      "group": "Missions",
      "control": "textarea",
      "mode": "direct",
      "binding": {
        "file": "game/missions.ts",
        "export": "missions",
        "path": [
          "intro",
          "text"
        ]
      },
      "maxLength": 200
    },
    {
      "id": "handling",
      "label": "Handling",
      "description": "Adjust the existing rover response while keeping the world and missions.",
      "group": "Rover",
      "control": "select",
      "mode": "build",
      "files": [
        "game/rover.ts"
      ],
      "instruction": "Adjust the existing steering and acceleration response.",
      "preserve": [
        "Terrain",
        "Mission rules",
        "Rover appearance"
      ],
      "options": [
        {
          "label": "Stable",
          "value": "stable"
        },
        {
          "label": "Responsive",
          "value": "responsive"
        }
      ]
    }
  ]
} as const;

Check in source that every direct value is a literal with a matching control type and valid constraints, every build target exists, and every exposed adjustment changes a real part of this game. Use descriptive game-specific groups. Preserve gameplay, assets, and unrelated manual edits; only update the guide. Explain any unavailable adjustments. Do not publish.
