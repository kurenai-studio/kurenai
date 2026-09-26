# portable-sharp

Pure-JS drop-in for the `sharp` APIs that cocos-cli asset-db / texture tools use.

- Implemented with [jimp](https://www.npmjs.com/package/jimp) (no native addon).
- Wired via `package.json`: `"sharp": "file:./packages/portable-sharp"`.
- Call sites keep `require('sharp')`.

Not a full sharp clone. Unsupported ops throw. Prefer browser preview for shader/image edge cases.
