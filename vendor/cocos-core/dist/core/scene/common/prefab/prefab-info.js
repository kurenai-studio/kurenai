"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabState = void 0;
var PrefabState;
(function (PrefabState) {
    PrefabState[PrefabState["NotAPrefab"] = 0] = "NotAPrefab";
    PrefabState[PrefabState["PrefabChild"] = 1] = "PrefabChild";
    PrefabState[PrefabState["PrefabInstance"] = 2] = "PrefabInstance";
    PrefabState[PrefabState["PrefabLostAsset"] = 3] = "PrefabLostAsset";
})(PrefabState || (exports.PrefabState = PrefabState = {}));
