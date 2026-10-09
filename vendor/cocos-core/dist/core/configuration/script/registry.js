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
exports.configurationRegistry = exports.ConfigurationRegistry = void 0;
const events_1 = require("events");
const console_1 = require("../../base/console");
const config_1 = require("./config");
const interface_1 = require("./interface");
const utils = __importStar(require("./utils"));
function isConfigurationInstance(value) {
    return !!value
        && typeof value === 'object'
        && 'moduleName' in value
        && typeof value.get === 'function';
}
function isConfigurationRegistration(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((key) => key === 'defaults' || key === 'nodes');
}
function cloneValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => cloneValue(item));
    }
    if (value && typeof value === 'object') {
        const result = {};
        for (const [key, childValue] of Object.entries(value)) {
            result[key] = cloneValue(childValue);
        }
        return result;
    }
    return value;
}
function getDefaultValueFromPropertySchema(schema) {
    if (schema.default !== undefined) {
        return cloneValue(schema.default);
    }
    if (schema.type === 'array') {
        return [];
    }
    if (schema.type === 'object') {
        if (!schema.properties || !Object.keys(schema.properties).length) {
            return {};
        }
        const result = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            const defaultValue = getDefaultValueFromPropertySchema(value);
            if (defaultValue !== undefined) {
                result[key] = defaultValue;
            }
        }
        return result;
    }
    return undefined;
}
function mergeNodes(nodes = []) {
    const merged = new Map();
    for (const node of nodes) {
        const existing = merged.get(node.id);
        if (!existing) {
            merged.set(node.id, {
                ...node,
                properties: { ...node.properties },
            });
            continue;
        }
        merged.set(node.id, {
            ...existing,
            title: node.title || existing.title,
            group: node.group || existing.group,
            order: node.order ?? existing.order,
            properties: {
                ...existing.properties,
                ...node.properties,
            },
        });
    }
    return Array.from(merged.values());
}
async function resolveRegistrationNodes(nodes) {
    if (!nodes) {
        return [];
    }
    const resolved = typeof nodes === 'function'
        ? await nodes()
        : nodes;
    return mergeNodes(resolved);
}
function mergeNodeRegistrations(previous, next) {
    if (!previous) {
        return next;
    }
    if (!next) {
        return previous;
    }
    return async () => {
        const [previousNodes, nextNodes] = await Promise.all([
            resolveRegistrationNodes(previous),
            resolveRegistrationNodes(next),
        ]);
        return mergeNodes([
            ...previousNodes,
            ...nextNodes,
        ]);
    };
}
function sortNodes(nodes) {
    return [...nodes].sort((left, right) => {
        if (left.order === undefined && right.order === undefined) {
            return left.id.localeCompare(right.id);
        }
        if (left.order === undefined) {
            return 1;
        }
        if (right.order === undefined) {
            return -1;
        }
        if (left.order === right.order) {
            return left.id.localeCompare(right.id);
        }
        return left.order - right.order;
    });
}
class ConfigurationRegistry extends events_1.EventEmitter {
    instances = {};
    registrations = {};
    getInstances() {
        return this.instances;
    }
    getInstance(moduleName) {
        const instance = this.instances[moduleName];
        if (!instance) {
            console.warn(`[Configuration] 获取配置实例错误，${moduleName} 未注册配置。`);
            return undefined;
        }
        return instance;
    }
    async register(moduleName, configOrInstanceOrRegistration, registrationArg) {
        if (!utils.isValidConfigKey(moduleName)) {
            throw new Error('[Configuration] 注册配置失败：模块名不能为空。');
        }
        const { defaultConfig, instance, registration, } = this.parseRegisterArguments(moduleName, configOrInstanceOrRegistration, registrationArg);
        if (registration) {
            this.registrations[moduleName] = this.mergeRegistration(this.registrations[moduleName], registration);
        }
        const resolvedDefaults = await this.resolveDefaultConfig(moduleName, defaultConfig, this.registrations[moduleName]);
        const existingInstance = this.instances[moduleName];
        if (existingInstance) {
            if (resolvedDefaults !== undefined) {
                existingInstance.mergeDefaultConfig(resolvedDefaults);
            }
            if (instance && existingInstance !== instance) {
                console_1.newConsole.warn(`[Configuration] 配置项 "${moduleName}" 已存在，跳过注册。`);
            }
            return existingInstance;
        }
        const nextInstance = instance ?? new config_1.BaseConfiguration(moduleName);
        if (resolvedDefaults !== undefined) {
            nextInstance.mergeDefaultConfig(resolvedDefaults);
        }
        this.instances[moduleName] = nextInstance;
        this.emit(interface_1.MessageType.Registry, nextInstance);
        return nextInstance;
    }
    async unregister(moduleName) {
        const instance = this.instances[moduleName];
        this.emit(interface_1.MessageType.UnRegistry, instance);
        delete this.instances[moduleName];
        delete this.registrations[moduleName];
    }
    async getMetadata() {
        const aggregated = [];
        for (const moduleName of Object.keys(this.instances)) {
            const registration = this.registrations[moduleName];
            const nodes = await resolveRegistrationNodes(registration?.nodes);
            if (!nodes.length) {
                continue;
            }
            aggregated.push(...nodes);
        }
        return sortNodes(aggregated);
    }
    parseRegisterArguments(moduleName, configOrInstanceOrRegistration, registrationArg) {
        let registration = registrationArg;
        let defaultConfig;
        let instance;
        if (isConfigurationInstance(configOrInstanceOrRegistration)) {
            instance = configOrInstanceOrRegistration;
            if (instance.moduleName !== moduleName) {
                throw new Error(`[Configuration] 注册配置失败：配置实例的模块名 "${instance.moduleName}" 与注册的模块名 "${moduleName}" 不匹配。`);
            }
        }
        else if (isConfigurationRegistration(configOrInstanceOrRegistration)) {
            registration = configOrInstanceOrRegistration;
        }
        else if (configOrInstanceOrRegistration && typeof configOrInstanceOrRegistration === 'object') {
            defaultConfig = configOrInstanceOrRegistration;
        }
        return {
            defaultConfig,
            instance,
            registration,
        };
    }
    async resolveDefaultConfig(moduleName, defaultConfig, registration) {
        let merged = {};
        let hasDefaults = false;
        const nodeDefaults = this.deriveDefaultsFromNodes(moduleName, await resolveRegistrationNodes(registration?.nodes));
        if (Object.keys(nodeDefaults).length > 0) {
            merged = utils.deepMerge(merged, nodeDefaults);
            hasDefaults = true;
        }
        if (registration?.defaults !== undefined) {
            merged = utils.deepMerge(merged, cloneValue(registration.defaults));
            hasDefaults = true;
        }
        if (defaultConfig !== undefined) {
            merged = utils.deepMerge(merged, cloneValue(defaultConfig));
            hasDefaults = true;
        }
        return hasDefaults ? merged : undefined;
    }
    mergeRegistration(previous, next) {
        const merged = {};
        if (previous?.defaults !== undefined || next.defaults !== undefined) {
            merged.defaults = next.defaults === undefined
                ? cloneValue(previous?.defaults ?? {})
                : previous?.defaults === undefined
                    ? cloneValue(next.defaults)
                    : utils.deepMerge(cloneValue(previous.defaults), cloneValue(next.defaults));
        }
        const nodes = mergeNodeRegistrations(previous?.nodes, next.nodes);
        if (nodes) {
            merged.nodes = nodes;
        }
        return merged;
    }
    deriveDefaultsFromNodes(moduleName, nodes) {
        const defaults = {};
        if (!nodes?.length) {
            return defaults;
        }
        for (const node of nodes) {
            for (const [key, schema] of Object.entries(node.properties)) {
                const relativeKey = key.startsWith(`${moduleName}.`)
                    ? key.slice(moduleName.length + 1)
                    : key;
                if (!relativeKey) {
                    continue;
                }
                const defaultValue = getDefaultValueFromPropertySchema(schema);
                if (defaultValue === undefined) {
                    continue;
                }
                utils.setByDotPath(defaults, relativeKey, defaultValue);
            }
        }
        return defaults;
    }
}
exports.ConfigurationRegistry = ConfigurationRegistry;
exports.configurationRegistry = new ConfigurationRegistry();
