"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEngineRenderConfig = getEngineRenderConfig;
exports.getLocalizedEngineRenderConfig = getLocalizedEngineRenderConfig;
exports.getEngineDynamicConfigContribution = getEngineDynamicConfigContribution;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const typescript_1 = __importDefault(require("typescript"));
const i18n_1 = __importDefault(require("../base/i18n"));
const metadata_1 = require("../configuration/script/metadata");
const ENGINE_RENDER_CONFIG_PATH = path_1.default.join('editor', 'engine-features', 'render-config.json');
const ENGINE_MACRO_SOURCE_PATH = path_1.default.join('cocos', 'core', 'platform', 'macro.ts');
function getEngineRenderConfig(engineRoot) {
    const renderConfigPath = path_1.default.join(engineRoot, ENGINE_RENDER_CONFIG_PATH);
    return JSON.parse(readUtf8File(renderConfigPath));
}
function getLocalizedEngineRenderConfig(engineRoot) {
    const locale = i18n_1.default._lang ?? 'zh';
    const renderConfig = getEngineRenderConfig(engineRoot);
    const localization = loadLocalization(engineRoot, locale);
    return localizeRenderConfig(renderConfig, localization);
}
function getEngineDynamicConfigContribution(options) {
    try {
        const locale = i18n_1.default._lang ?? 'zh';
        const renderConfig = getEngineRenderConfig(options.engineRoot);
        const features = collectFeatureDescriptors(renderConfig);
        const macros = collectMacroDescriptors(options.engineRoot, locale);
        const flagDescriptors = collectFlagDescriptors(features);
        const flagProperties = buildFlagProperties(flagDescriptors);
        return {
            defaults: {
                includeModules: features.filter((feature) => feature.default).map((feature) => feature.id),
                flags: buildFlagDefaults(flagDescriptors),
                macroConfig: buildMacroDefaults(macros),
            },
            metadata: {
                includeModules: buildIncludeModulesSchema(features),
                flagProperties,
                flagsObject: buildFlagsObjectSchema(flagProperties),
                macroProperties: buildMacroProperties(macros),
            },
        };
    }
    catch (error) {
        console.warn('[Engine] Failed to build dynamic configuration metadata from engine source, fallback to static defaults.', error);
        return createFallbackContribution(options.fallbackConfig);
    }
}
function loadLocalization(engineRoot, locale) {
    const locales = Array.from(new Set([locale, 'zh', 'en']));
    for (const candidate of locales) {
        const localizationPath = path_1.default.join(engineRoot, 'editor', 'i18n', candidate, 'localization.js');
        if (!(0, fs_1.existsSync)(localizationPath)) {
            continue;
        }
        try {
            return loadCommonJsModuleFresh(localizationPath);
        }
        catch (error) {
            console.warn(`[Engine] Failed to load engine localization: ${localizationPath}`, error);
        }
    }
    return undefined;
}
function loadCommonJsModuleFresh(filePath) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
    return require(resolved);
}
function collectFeatureDescriptors(renderConfig) {
    const descriptors = [];
    for (const [featureKey, moduleItem] of Object.entries(renderConfig.features)) {
        if (isFeatureGroup(moduleItem)) {
            for (const [optionKey, optionItem] of Object.entries(moduleItem.options)) {
                descriptors.push(createFeatureDescriptor(optionKey, optionItem));
            }
            continue;
        }
        descriptors.push(createFeatureDescriptor(featureKey, moduleItem));
    }
    return descriptors;
}
function isFeatureGroup(moduleItem) {
    return 'options' in moduleItem;
}
function createFeatureDescriptor(featureKey, featureItem) {
    const flags = [];
    for (const [flagKey, flagItem] of Object.entries(featureItem.flags ?? {})) {
        flags.push({
            key: flagKey,
            label: resolveLocalizationText(flagItem.label, undefined, lodash_1.default.startCase(flagKey)) ?? lodash_1.default.startCase(flagKey),
            description: resolveLocalizationText(flagItem.description, undefined),
            default: normalizeFlagValue(flagItem.default),
        });
    }
    return {
        id: featureKey,
        label: resolveLocalizationText(featureItem.label, undefined, lodash_1.default.startCase(featureKey)) ?? lodash_1.default.startCase(featureKey),
        description: resolveLocalizationText(featureItem.description, undefined),
        default: Boolean(featureItem.default),
        flags,
    };
}
function collectFlagDescriptors(features) {
    const propertyMap = new Map();
    for (const feature of features) {
        for (const flag of feature.flags) {
            if (!propertyMap.has(flag.key)) {
                propertyMap.set(flag.key, { ...flag });
                continue;
            }
            const existing = propertyMap.get(flag.key);
            if (!existing.description && flag.description) {
                existing.description = flag.description;
            }
        }
    }
    return Array.from(propertyMap.values());
}
function resolveLocalizationText(value, localization, fallback) {
    if (!value) {
        return fallback;
    }
    if (!value.startsWith('i18n:')) {
        return value;
    }
    const key = value.slice('i18n:'.length);
    const resolved = getByPath(localization, key)
        ?? getByPath(localization, key.split('.').slice(1).join('.'));
    if (typeof resolved === 'string') {
        return resolved;
    }
    const translated = (0, metadata_1.translateMetadataText)(value);
    if (translated && translated !== key) {
        return translated;
    }
    return fallback;
}
function localizeRenderConfig(renderConfig, localization) {
    return translateRenderConfigValue(renderConfig, localization);
}
function translateRenderConfigValue(value, localization) {
    if (Array.isArray(value)) {
        return value.map((item) => translateRenderConfigValue(item, localization));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, childValue]) => [
            key,
            translateRenderConfigValue(childValue, localization),
        ]));
    }
    if (typeof value === 'string') {
        return translateRenderConfigText(value, localization);
    }
    return value;
}
function translateRenderConfigText(value, localization) {
    if (!value.startsWith('i18n:')) {
        return value;
    }
    return resolveLocalizationText(value, localization, value.slice('i18n:'.length))
        ?? value.slice('i18n:'.length);
}
function getByPath(target, keyPath) {
    if (!target) {
        return undefined;
    }
    const segments = keyPath.split('.');
    let current = target;
    for (const segment of segments) {
        if (!segment) {
            return undefined;
        }
        if (!current || typeof current !== 'object' || !(segment in current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
function buildIncludeModulesSchema(features) {
    return {
        type: 'array',
        default: features.filter((feature) => feature.default).map((feature) => feature.id),
        title: 'i18n:configuration.engine.dynamic.includeModules.title',
        description: 'i18n:configuration.engine.dynamic.includeModules.description',
        items: {
            type: 'string',
            title: 'i18n:configuration.engine.dynamic.includeModules.itemTitle',
            enum: features.map((feature) => feature.id),
            enumDescriptions: features.map((feature) => {
                if (feature.description && feature.description !== feature.label) {
                    return `${feature.label} - ${feature.description}`;
                }
                return feature.label;
            }),
        },
    };
}
function buildFlagProperties(flags) {
    const properties = {};
    for (const flag of flags) {
        properties[flag.key] = {
            type: inferPrimitiveSchemaType(flag.default),
            default: flag.default,
            title: flag.label,
            description: flag.description,
        };
    }
    return properties;
}
function buildFlagDefaults(flags) {
    return Object.fromEntries(flags.map((flag) => [flag.key, flag.default]));
}
function buildFlagsObjectSchema(flagProperties) {
    const defaults = Object.fromEntries(Object.entries(flagProperties).map(([key, value]) => [key, value.default]));
    return (0, metadata_1.objectSchema)(flagProperties, {
        default: defaults,
        title: 'i18n:configuration.engine.dynamic.flags.title',
        description: 'i18n:configuration.engine.dynamic.flags.description',
    });
}
function buildMacroProperties(macros) {
    const properties = {};
    for (const macro of macros) {
        properties[macro.key] = {
            type: inferPrimitiveSchemaType(macro.default),
            default: macro.default,
            title: macro.key,
            description: macro.description,
        };
    }
    return properties;
}
function buildMacroDefaults(macros) {
    return Object.fromEntries(macros.map((macro) => [macro.key, macro.default]));
}
function collectMacroDescriptors(engineRoot, locale) {
    const macroPath = path_1.default.join(engineRoot, ENGINE_MACRO_SOURCE_PATH);
    const source = readUtf8File(macroPath);
    const sourceFile = typescript_1.default.createSourceFile(macroPath, source, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    const macroDefaults = collectMacroDefaultValues(sourceFile);
    const macroInterface = sourceFile.statements.find((statement) => {
        return typescript_1.default.isInterfaceDeclaration(statement) && statement.name.text === 'Macro';
    });
    if (!macroInterface) {
        return [];
    }
    const descriptors = [];
    for (const member of macroInterface.members) {
        if (!typescript_1.default.isPropertySignature(member) || !member.name) {
            continue;
        }
        const key = getPropertyNameText(member.name);
        if (!key || !macroDefaults.has(key)) {
            continue;
        }
        const docs = extractJSDocTexts(member);
        if (!docs.defaultTag) {
            continue;
        }
        descriptors.push({
            key,
            description: locale === 'en' ? docs.en ?? docs.zh : docs.zh ?? docs.en,
            default: macroDefaults.get(key),
        });
    }
    return descriptors;
}
function collectMacroDefaultValues(sourceFile) {
    const defaults = new Map();
    for (const statement of sourceFile.statements) {
        if (!typescript_1.default.isVariableStatement(statement)) {
            continue;
        }
        for (const declaration of statement.declarationList.declarations) {
            if (!typescript_1.default.isIdentifier(declaration.name) || declaration.name.text !== 'macro') {
                continue;
            }
            if (!declaration.initializer || !typescript_1.default.isObjectLiteralExpression(declaration.initializer)) {
                continue;
            }
            for (const property of declaration.initializer.properties) {
                if (!typescript_1.default.isPropertyAssignment(property) || !property.name) {
                    continue;
                }
                const key = getPropertyNameText(property.name);
                const value = evaluatePrimitiveExpression(property.initializer);
                if (!key || value === undefined) {
                    continue;
                }
                defaults.set(key, value);
            }
        }
    }
    return defaults;
}
function getPropertyNameText(name) {
    if (typescript_1.default.isIdentifier(name) || typescript_1.default.isStringLiteral(name) || typescript_1.default.isNumericLiteral(name)) {
        return name.text;
    }
    return undefined;
}
function evaluatePrimitiveExpression(expression) {
    if (typescript_1.default.isParenthesizedExpression(expression)) {
        return evaluatePrimitiveExpression(expression.expression);
    }
    if (expression.kind === typescript_1.default.SyntaxKind.TrueKeyword) {
        return true;
    }
    if (expression.kind === typescript_1.default.SyntaxKind.FalseKeyword) {
        return false;
    }
    if (typescript_1.default.isStringLiteral(expression) || typescript_1.default.isNoSubstitutionTemplateLiteral(expression)) {
        return expression.text;
    }
    if (typescript_1.default.isNumericLiteral(expression)) {
        return Number(expression.text);
    }
    if (typescript_1.default.isPrefixUnaryExpression(expression)) {
        const operand = evaluatePrimitiveExpression(expression.operand);
        if (typeof operand !== 'number') {
            return undefined;
        }
        if (expression.operator === typescript_1.default.SyntaxKind.MinusToken) {
            return -operand;
        }
        if (expression.operator === typescript_1.default.SyntaxKind.PlusToken) {
            return operand;
        }
    }
    return undefined;
}
function extractJSDocTexts(node) {
    const result = {};
    for (const tag of typescript_1.default.getJSDocTags(node)) {
        const name = tag.tagName.text;
        const comment = normalizeDocText(flattenTagComment(tag.comment));
        if (!comment) {
            continue;
        }
        if (name === 'zh') {
            result.zh = comment;
        }
        else if (name === 'en') {
            result.en = comment;
        }
        else if (name === 'default') {
            result.defaultTag = comment;
        }
    }
    return result;
}
function flattenTagComment(comment) {
    if (!comment) {
        return undefined;
    }
    if (typeof comment === 'string') {
        return comment;
    }
    if (Array.isArray(comment)) {
        return comment.map((part) => typeof part === 'string' ? part : part.text).join('');
    }
    return undefined;
}
function normalizeDocText(text) {
    if (!text) {
        return undefined;
    }
    return text.replace(/\r\n/g, '\n').trim();
}
function readUtf8File(filePath) {
    return (0, fs_1.readFileSync)(filePath, 'utf8').replace(/^\uFEFF/, '');
}
function normalizeFlagValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    return Boolean(value);
}
function normalizePrimitiveValue(value) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    return Boolean(value);
}
function inferPrimitiveSchemaType(value) {
    if (typeof value === 'number') {
        return 'number';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    return 'string';
}
function normalizeFallbackConfig(fallbackConfig) {
    return {
        includeModules: [...(fallbackConfig.includeModules ?? [])],
        flags: Object.fromEntries(Object.entries(fallbackConfig.flags ?? {}).map(([key, value]) => [key, value])),
        macroConfig: Object.fromEntries(Object.entries(fallbackConfig.macroConfig ?? {}).map(([key, value]) => [key, normalizePrimitiveValue(value)])),
    };
}
function createFallbackContribution(fallbackConfig) {
    const normalizedFallback = normalizeFallbackConfig(fallbackConfig);
    const flagProperties = Object.fromEntries(Object.entries(normalizedFallback.flags).map(([key, value]) => [key, {
            type: typeof value === 'number' ? 'number' : 'boolean',
            default: value,
            title: key,
        }]));
    const macroProperties = Object.fromEntries(Object.entries(normalizedFallback.macroConfig).map(([key, value]) => [key, {
            type: inferPrimitiveSchemaType(value),
            default: value,
            title: key,
        }]));
    return {
        defaults: normalizedFallback,
        metadata: {
            includeModules: {
                type: 'array',
                default: normalizedFallback.includeModules,
                title: 'i18n:configuration.engine.dynamic.includeModules.title',
                description: 'i18n:configuration.engine.dynamic.includeModules.description',
                items: {
                    type: 'string',
                    title: 'i18n:configuration.engine.dynamic.includeModules.itemTitle',
                },
            },
            flagProperties,
            flagsObject: buildFlagsObjectSchema(flagProperties),
            macroProperties,
        },
    };
}
