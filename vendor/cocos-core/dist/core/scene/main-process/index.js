"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scene = void 0;
const scene_worker_1 = require("./scene-worker");
const editor_proxy_1 = require("./proxy/editor-proxy");
const script_proxy_1 = require("./proxy/script-proxy");
const node_proxy_1 = require("./proxy/node-proxy");
const component_proxy_1 = require("./proxy/component-proxy");
const asset_proxy_1 = require("./proxy/asset-proxy");
const engine_proxy_1 = require("./proxy/engine-proxy");
const prefab_proxy_1 = require("./proxy/prefab-proxy");
const reference_image_proxy_1 = require("./proxy/reference-image-proxy");
const particle_proxy_1 = require("./proxy/particle-proxy");
exports.Scene = {
    ...editor_proxy_1.EditorProxy,
    ...script_proxy_1.ScriptProxy,
    ...asset_proxy_1.AssetProxy,
    ...engine_proxy_1.EngineProxy,
    ...prefab_proxy_1.PrefabProxy,
    ReferenceImage: reference_image_proxy_1.ReferenceImageProxy,
    // 粒子系统相关接口（play/pause/stop/restart/setPlaySpeed/queryPlayInfo）
    Particle: particle_proxy_1.ParticleProxy,
    // 节点相关的接口
    Node: node_proxy_1.NodeProxy,
    // 组件相关的接口
    Component: component_proxy_1.ComponentProxy,
    // 场景进程
    worker: scene_worker_1.sceneWorker,
};
