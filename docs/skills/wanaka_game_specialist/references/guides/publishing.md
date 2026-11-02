# Publishing metadata and asset credits

Studio project settings and Publish use `game/publishing.json`. Edit this source file when the creator asks to change mobile listing settings; ordinary Web publishing and its visibility stay separate. Omitted fields use these defaults:

```json
{
  "orientation": "landscape",
  "ageRating": "4+",
  "contentDeclaration": "None",
  "requiresNetwork": true,
  "instructions": "Use the on-screen touch controls to play.",
  "screenshots": []
}
```

`orientation` accepts `landscape`, `portrait`, or `adaptive`; absent configuration initially follows the project's display orientation. Age choices are `4+`, `9+`, `13+`, `16+`, `18+`; `4+` is the initial no-age-restriction draft, not an official Apple classification. Describe the actual game's content and touch controls. Set network requirements truthfully. Screenshots are up to eight HTTP(S) URLs; an empty list uses the publish cover when one exists. The creator chooses whether to submit mobile review in Publish. Editing this file does not approve, submit, or publish a game.

Third-party assets carry source-owned credits in `game/assets/ATTRIBUTIONS.json`. Keep the existing manifest's schema and entries when editing it. Preserve original authors, source pages, the exact license name and version-specific license URL, supplied copyright and disclaimer notices. Record your transformations in `changes`; do not replace existing changes. Asset installs from external sources such as Sketchfab already write this sidecar. If importing bytes yourself, obtain this information from the source before adding the asset, rather than inventing it. A catalog asset known to require attribution cannot publish without complete credits; report the affected asset and missing data if you cannot obtain them.

Compilation freezes this sidecar and export combines it with catalog and private-file provenance. The resulting `asset-credits.json` and `credits.html` travel with that published version; Web details and native/offline play can show the same credits. New source edits do not change older publications.
