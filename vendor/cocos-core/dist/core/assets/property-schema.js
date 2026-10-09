"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssetPropertySchemaMap = createAssetPropertySchemaMap;
const metadata_1 = require("../configuration/script/metadata");
function createAssetPropertySchemaMap(config) {
    const result = {};
    if (!config) {
        return result;
    }
    for (const [key, schema] of Object.entries(config)) {
        result[key] = (0, metadata_1.createPropertySchema)(schema);
    }
    return result;
}
