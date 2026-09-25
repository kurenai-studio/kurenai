'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillUserData = exports.setDefaultUserData = void 0;
const defaultMeta = {};
function setDefaultUserData(name, userData) {
    defaultMeta[name] = userData;
}
exports.setDefaultUserData = setDefaultUserData;
function fillUserData(name, userData) {
    const defaultUserData = defaultMeta[name];
    if (!defaultUserData) {
        return;
    }
    for (let key in defaultUserData) {
        if (!(key in userData)) {
            userData[key] = defaultUserData[key];
        }
    }
}
exports.fillUserData = fillUserData;
