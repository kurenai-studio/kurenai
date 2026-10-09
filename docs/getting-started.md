<!-- kurenai-doc-version: 0.1.0 -->
# Kurenai (Creator 4.0) — agent bootstrap

Verified against **kurenai v0.1.0**. After install, `kurenai --version` / the
package version in `package.json` should match; if it does not, re-read this
file from the repository you actually installed.

Treat this file as the **only entry point**. Follow it in order. After
`kurenai init`, coding rules live in the project root `AGENTS.md` (this file
covers tooling install and the feedback loop).

## Goal

Use **Kurenai** to develop / preview / publish **Cocos Creator 4.0** projects
aligned with PinK.

- Do **not** use Enji for 4.0 work (Enji is Creator 3.8 only).
- Do **not** install full cocos-cli / PinK beside it.
- Preview and Web publish both use the bundled `vendor/cocos-core`.

## Environment

- Node.js **22+**, npm, GitHub access
- Nothing else. The preview runtime is bundled in `vendor/cocos-core`.

## Install

```sh
git clone --depth 1 https://github.com/kurenai-studio/kurenai.git
cd kurenai && npm install && npm link
```

`lib/` is committed, so no build step is needed. `npm install` also prepares
`vendor/cocos-core` dependencies (postinstall). Check: `kurenai --help`.

## Loop

```sh
kurenai init ./my-game          # or: kurenai init ./my-game --3d
cd my-game
kurenai host start              # prints previewUrl
# edit assets/game and assets/resources only; never hand-write .meta
kurenai logs --errors
kurenai check
kurenai asset info assets/resources/...
# when the user asks for a build:
kurenai publish --platform web-desktop --release --out ./dist
```

Rules after init are in the project `AGENTS.md`. Prefabs describe structure and
look; behaviour is TypeScript with `addComponent(View).bind(root)`.

## Rendering

Read [rendering.md](rendering.md) before custom shaders, float data textures,
or render-to-texture. Shader compile errors and TypeScript stacks in
`kurenai logs --errors` point back at project source lines.

## Not covered by the bundled runtime

These need PinK / Creator:

- Native / mini-game builds (use channel packs later)
- Legacy FBX importer, panorama-to-HDR, lightmap baking, texture compression
  (ASTC / ETC / PVRTC)

## Size note

The checkout is trimmed like Enji's preview runtime, and still keeps Web
builders plus engine TypeScript sources for `kurenai publish`. Engine-local
`node_modules` are installed on first publish when missing.
