# Visual Style presets

Read this guide when choosing, applying, or tuning a named Visual Style in `game/visual.ts`.

## Recipes and adjustment

- Presets are visual references and starting recipes. Refine their palette, lighting, atmosphere, grading, and shading to fit the project's visual direction and actual scene. Evaluate the resulting picture as a whole, including its materials and camera.
- Keep the named `presetId` only while its palette, key/fill/rim lighting, atmosphere, four listed post values, and shading still match the recipe. Changing one of those recipe values sets `presetId: 'custom'`; the active top-level values are the runtime source. If the profile already has `savedCustom`, synchronize that snapshot with the active style-owned values. Do not create `savedCustom` only to make the runtime apply the adjustment. Optional grade adjustments may remain composed with a named preset.
- Applying a named preset to an existing profile replaces its palette, key/fill/rim lighting, atmosphere, exposure/saturation/contrast/vignette, and shading. Preserve environment selection, tintable roles, Bloom, `lighting.shadowMode`, optional grade leaves, Rendering, Render Quality, and the existing `savedCustom` recipe.

The entries below are complete style-owned recipes. Palette values are ordered as `sky / ground / road / accent`. Key values are `color, intensity, azimuth, elevation`; fill and rim values are `color, intensity`. Fog values are `enabled, color, near, far`; weather values are `kind, amount, wind`. Post values are `exposure, saturation, contrast, vignette`.

## Default (`neutral`)

- Palette: `#569bd5 / #a5c9e2 / #4a5258 / #ffd86b`
- Key: `#ffffff, 2, 53, 58`; fill: `#ffffff, 1`; rim: `#fff0c5, 0.31`
- Fog: `true, #d5dfe8, 60, 160`; weather: `clear, 0, 0`
- Post: `0.35, 1, 1, 0`
- Shading: `{ model: 'standard', ink: false, look: 'none' }`

## Realistic (`realistic`)

- Palette: `#3d7eb8 / #5c6b3d / #2c3036 / #e8d27a`
- Key: `#ffd89a, 2.56, 28, 40`; fill: `#6aa4d4, 0.4`; rim: `#ffc878, 0.5`
- Fog: `true, #b7cfe0, 22, 130`; weather: `clear, 0, 0.08`
- Post: `0.18, 1.16, 1.2, 0.12`
- Shading: `{ model: 'standard', ink: false, look: 'none' }`

## Stylized Toon (`stylized-toon`)

Cel shading works with or without ink outlines. Decide whether to enable outlines based on the actual scene, materials, and camera; tune or disable them if they obscure detail or reduce readability.

- Palette: `#79bdf2 / #6fbd67 / #535e73 / #ffda67`
- Key: `#fff4cb, 1.69, 42, 55`; fill: `#9dd7ff, 0.63`; rim: `#fff08b, 0.56`
- Fog: `false, #a8d9f2, 45, 180`; weather: `clear, 0, 0.08`
- Post: `0.08, 1.25, 1.12, 0.02`
- Shading: `{ model: 'cel', ink: true, look: 'none' }`

## Graphic Ink (`graphic-ink`)

The graphic look reshapes light and dark tones.

- Palette: `#d8c9a3 / #7d8a4a / #1c1812 / #e8c43a`
- Key: `#fff1c2, 1.75, 48, 38`; fill: `#9a8b6c, 0.35`; rim: `#ffe27a, 0.25`
- Fog: `false, #cfc09a, 40, 160`; weather: `clear, 0, 0.05`
- Post: `0.05, 0.82, 1.28, 0.16`
- Shading: `{ model: 'standard', ink: true, look: 'graphic' }`

## Ink Wash (`ink-wash`)

The wash look uses sky/ground/accent as paper/ink/margin colors and adds hatching and ruled lines.

- Palette: `#efe6d2 / #1e4a8c / #081428 / #b42828`
- Key: `#fff6e8, 1.25, 36, 50`; fill: `#e4d6c2, 0.38`; rim: `#c8b89a, 0.18`
- Fog: `false, #efe6d2, 40, 160`; weather: `clear, 0, 0.04`
- Post: `0.1, 0.92, 1.12, 0.04`
- Shading: `{ model: 'standard', ink: true, look: 'wash' }`

## Pixel Screen (`pixel-screen`)

The pixel look snaps the picture to discrete screen-space blocks while keeping color continuous.

- Palette: `#5c94fc / #3d9e3a / #74604a / #fcbc3c`
- Key: `#fff4b0, 1.5, 40, 58`; fill: `#7eb0ff, 0.44`; rim: `#ffe37a, 0.19`
- Fog: `false, #8eb4ff, 50, 200`; weather: `clear, 0, 0`
- Post: `0.06, 1.2, 1.15, 0`
- Shading: `{ model: 'standard', ink: false, look: 'pixel' }`

## Crosshatch (`crosshatch`)

The hatch look adds crossed strokes in midtones and shadows.

- Palette: `#c5c8c2 / #6e7268 / #3f403c / #8a3a32`
- Key: `#eceae3, 1.31, 32, 44`; fill: `#a8aaa4, 0.4`; rim: `#d7d4cc, 0.23`
- Fog: `false, #b8bbb4, 35, 140`; weather: `clear, 0, 0.04`
- Post: `-0.05, 0.35, 1.22, 0.14`
- Shading: `{ model: 'standard', ink: false, look: 'hatch' }`

## One-Bit (`one-bit`)

The dither look maps luminance to sky (paper) or ground (ink) colors using ordered dithering.

- Palette: `#e8dcc4 / #2c2416 / #1a1610 / #8a3a32`
- Key: `#f0e6d2, 1.44, 40, 48`; fill: `#c4b49a, 0.28`; rim: `#efe4cc, 0.15`
- Fog: `false, #d8cdb8, 40, 160`; weather: `clear, 0, 0.04`
- Post: `0.05, 0.15, 1.35, 0.12`
- Shading: `{ model: 'standard', ink: true, look: 'dither' }`

## Phosphor (`phosphor`)

The CRT look adds scanlines and a fluorescent accent-color cast while retaining picture color.

- Palette: `#070b08 / #27343d / #4a5258 / #3cff6a`
- Key: `#f4fff6, 1.31, -15, 38`; fill: `#8fa89a, 0.45`; rim: `#5cff88, 0.38`
- Fog: `true, #0c1410, 28, 140`; weather: `clear, 0, 0.08`
- Post: `0.08, 0.92, 1.12, 0.14`
- Shading: `{ model: 'standard', ink: false, look: 'crt' }`

## Retro Warm (`retro-warm`)

- Palette: `#e8b86d / #7a5c35 / #4a3520 / #d4522a`
- Key: `#ffd090, 1.58, 62, 28`; fill: `#c89060, 0.38`; rim: `#ff9050, 0.42`
- Fog: `true, #d4956a, 35, 150`; weather: `clear, 0, 0.03`
- Post: `0.14, 1.08, 1.18, 0.22`
- Shading: `{ model: 'standard', ink: false, look: 'none' }`

## Horror (`horror`)

- Palette: `#04040a / #1a1a1f / #0d0d12 / #8b1a1a`
- Key: `#8090b0, 0.72, -165, 18`; fill: `#060810, 0.15`; rim: `#404860, 0.28`
- Fog: `true, #06060f, 18, 90`; weather: `clear, 0, 0.04`
- Post: `-0.12, 0.68, 1.38, 0.28`
- Shading: `{ model: 'standard', ink: false, look: 'none' }`
