"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropertySchema = createPropertySchema;
exports.createNode = createNode;
exports.createTitleFromKey = createTitleFromKey;
exports.translateMetadataText = translateMetadataText;
exports.normalizeDisplayText = normalizeDisplayText;
exports.isPlainObject = isPlainObject;
exports.hasConfigItemShape = hasConfigItemShape;
exports.objectSchema = objectSchema;
exports.arraySchema = arraySchema;
exports.inferSchemaFromValue = inferSchemaFromValue;
exports.convertConfigItem = convertConfigItem;
const lodash_1 = __importDefault(require("lodash"));
const i18n_1 = __importDefault(require("../../base/i18n"));
function createPropertySchema(schema) {
    const { title, description, enumDescriptions, properties, items, additionalProperties, ...base } = schema;
    const result = {
        ...base,
        title: translateMetadataText(title),
        description: translateMetadataText(description),
        enumDescriptions: enumDescriptions?.map((value) => translateMetadataText(value) ?? value),
    };
    if (properties) {
        result.properties = Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, createPropertySchema(value)]));
    }
    if (items) {
        result.items = Array.isArray(items)
            ? items.map((item) => createPropertySchema(item))
            : createPropertySchema(items);
    }
    if (typeof additionalProperties === 'object') {
        result.additionalProperties = createPropertySchema(additionalProperties);
    }
    else if (typeof additionalProperties === 'boolean') {
        result.additionalProperties = additionalProperties;
    }
    return result;
}
function createNode(id, title, group, props, order) {
    const properties = {};
    for (const key of Object.keys(props)) {
        properties[key] = createPropertySchema(props[key]);
    }
    return {
        id,
        title: translateMetadataText(title) ?? title,
        group,
        order,
        properties,
    };
}
function createTitleFromKey(key) {
    const normalized = key.replace(/\[\d+\]/g, '').split('.').pop() || key;
    return lodash_1.default.startCase(normalized);
}
function translateMetadataText(value, fallback) {
    if (!value) {
        return fallback;
    }
    if (!value.startsWith('i18n:')) {
        return value;
    }
    const translated = i18n_1.default.transI18nName(value);
    const strippedKey = value.slice('i18n:'.length);
    if (translated && translated !== strippedKey) {
        return translated;
    }
    return fallback ?? strippedKey;
}
function normalizeDisplayText(value, fallback) {
    return translateMetadataText(value, fallback) ?? fallback;
}
function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function hasConfigItemShape(value) {
    return !!value
        && typeof value === 'object'
        && 'type' in value
        && typeof value.type === 'string';
}
function normalizeEnumValue(value) {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    return value;
}
function resolveEnumItems(items) {
    const descriptions = [];
    const values = items.map((item) => {
        if (typeof item === 'string') {
            descriptions.push(createTitleFromKey(item));
            return normalizeEnumValue(item);
        }
        descriptions.push(normalizeDisplayText(item.label, String(item.value)));
        return normalizeEnumValue(item.value);
    });
    return {
        values,
        descriptions: descriptions.length ? descriptions : undefined,
    };
}
function inferEnumType(values, fallback) {
    const types = new Set(values.map((value) => typeof value));
    if (types.size === 1) {
        if (types.has('number')) {
            return 'number';
        }
        if (types.has('boolean')) {
            return 'boolean';
        }
    }
    if (typeof fallback === 'number') {
        return 'number';
    }
    if (typeof fallback === 'boolean') {
        return 'boolean';
    }
    return 'string';
}
function getDefaultFromSchema(schema) {
    if (schema.default !== undefined) {
        return schema.default;
    }
    if (schema.type === 'array') {
        return [];
    }
    if (schema.type === 'object') {
        if (!schema.properties) {
            return {};
        }
        const result = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            result[key] = getDefaultFromSchema(value);
        }
        return result;
    }
    return undefined;
}
function objectSchema(properties, overrides = {}) {
    const schema = {
        type: 'object',
        ...overrides,
    };
    if (properties && Object.keys(properties).length) {
        schema.properties = properties;
    }
    if (schema.default === undefined) {
        schema.default = schema.properties ? getDefaultFromSchema(schema) : {};
    }
    if (!schema.properties && schema.additionalProperties === undefined) {
        schema.additionalProperties = true;
    }
    return schema;
}
function arraySchema(items, overrides = {}) {
    const schema = {
        type: 'array',
        default: [],
        ...overrides,
    };
    if (items) {
        schema.items = items;
    }
    return schema;
}
function inferSchemaFromValue(value, key) {
    const title = createTitleFromKey(key);
    if (Array.isArray(value)) {
        const firstItem = value.find((item) => item !== undefined);
        return arraySchema(firstItem === undefined ? undefined : inferSchemaFromValue(firstItem, `${key}.item`), { title, default: value });
    }
    if (isPlainObject(value)) {
        const properties = Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, inferSchemaFromValue(childValue, childKey)]));
        return objectSchema(properties, { title, default: value });
    }
    if (typeof value === 'number') {
        return { type: 'number', default: value, title };
    }
    if (typeof value === 'boolean') {
        return { type: 'boolean', default: value, title };
    }
    return { type: 'string', default: value ?? '', title };
}
function convertConfigItem(item, key) {
    const title = normalizeDisplayText(item.label, createTitleFromKey(key));
    const description = translateMetadataText(item.description);
    switch (item.type) {
        case 'string':
            return {
                type: 'string',
                default: item.default,
                title,
                description,
                hidden: item.hidden,
            };
        case 'number':
            return {
                type: 'number',
                default: item.default,
                title,
                description,
                hidden: item.hidden,
                minimum: item.minimum,
                maximum: item.maximum,
                step: item.step,
            };
        case 'boolean':
            return {
                type: 'boolean',
                default: item.default,
                title,
                description,
                hidden: item.hidden,
            };
        case 'enum': {
            const { values, descriptions } = resolveEnumItems(item.items);
            const defaultValue = item.default === undefined ? undefined : normalizeEnumValue(item.default);
            return {
                type: inferEnumType(values, defaultValue),
                default: defaultValue,
                title,
                description,
                hidden: item.hidden,
                enum: values,
                enumDescriptions: descriptions,
            };
        }
        case 'array': {
            const inferredItem = Array.isArray(item.items)
                ? item.items.filter(hasConfigItemShape).map((subItem, index) => convertConfigItem(subItem, `${key}[${index}]`))
                : hasConfigItemShape(item.items)
                    ? convertConfigItem(item.items, `${key}.item`)
                    : Array.isArray(item.default) && item.default.length
                        ? inferSchemaFromValue(item.default[0], `${key}.item`)
                        : undefined;
            return arraySchema(inferredItem, {
                default: Array.isArray(item.default) ? item.default : [],
                title,
                description,
                hidden: item.hidden,
            });
        }
        case 'object': {
            const declaredProperties = {};
            for (const [childKey, childItem] of Object.entries(item.properties ?? {})) {
                if (hasConfigItemShape(childItem)) {
                    declaredProperties[childKey] = convertConfigItem(childItem, childKey);
                }
            }
            if (isPlainObject(item.default)) {
                for (const [childKey, childValue] of Object.entries(item.default)) {
                    if (!declaredProperties[childKey]) {
                        declaredProperties[childKey] = inferSchemaFromValue(childValue, childKey);
                    }
                }
            }
            return objectSchema(Object.keys(declaredProperties).length ? declaredProperties : undefined, {
                default: item.default,
                title,
                description,
                hidden: item.hidden,
                required: item.required,
                additionalProperties: item.additionalProperties,
            });
        }
    }
}
