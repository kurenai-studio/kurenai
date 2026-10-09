"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgrammingFacet = createProgrammingFacet;
exports.waitForProgrammingFacet = waitForProgrammingFacet;
exports.getPreviewFacet = getPreviewFacet;
const path_1 = require("path");
const Facet_1 = require("./Facet");
let programmingFacet = null;
let createProgrammingFacetPromise = null;
async function createProgrammingFacet(enginePath, projectPath, features) {
    if (!programmingFacet) {
        programmingFacet = await Facet_1.ProgrammingFacet.create({
            root: enginePath,
            distRoot: (0, path_1.join)(enginePath, 'bin', '.cache', 'dev-cli', 'web'),
            baseUrl: '/scripting/engine',
            features,
        }, projectPath);
    }
    return programmingFacet;
}
async function waitForProgrammingFacet() {
    if (!createProgrammingFacetPromise) {
        const { Engine } = await Promise.resolve().then(() => __importStar(require('../../engine')));
        const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../')));
        const enginePath = Engine.getInfo().typescript.path;
        const features = Engine.getConfig().includeModules || [];
        createProgrammingFacetPromise = createProgrammingFacet(enginePath, scripting.projectPath, features);
        createProgrammingFacetPromise.catch(() => {
            createProgrammingFacetPromise = null;
        });
    }
    await createProgrammingFacetPromise;
    return programmingFacet;
}
function getPreviewFacet() {
    if (!programmingFacet) {
        throw new Error('ProgrammingFacet not init, please init firstly.');
    }
    return programmingFacet;
}
