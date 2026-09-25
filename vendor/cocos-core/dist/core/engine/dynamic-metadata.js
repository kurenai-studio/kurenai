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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1pYy1tZXRhZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9keW5hbWljLW1ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBNERBLHNEQUdDO0FBRUQsd0VBS0M7QUFFRCxnRkEwQkM7QUFsR0QsMkJBQThDO0FBQzlDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsNERBQTRCO0FBQzVCLHdEQUFnQztBQUVoQywrREFBdUY7QUFtRHZGLE1BQU0seUJBQXlCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUMvRixNQUFNLHdCQUF3QixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFFcEYsU0FBZ0IscUJBQXFCLENBQUMsVUFBa0I7SUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBdUIsQ0FBQztBQUM1RSxDQUFDO0FBRUQsU0FBZ0IsOEJBQThCLENBQUMsVUFBa0I7SUFDN0QsTUFBTSxNQUFNLEdBQUcsY0FBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7SUFDbEMsTUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdkQsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFELE9BQU8sb0JBQW9CLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFnQixrQ0FBa0MsQ0FBQyxPQUFvQztJQUNuRixJQUFJLENBQUM7UUFDRCxN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RTtvQkFDSCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxLQUFLLEVBQUUsNERBQTREO2lCQUN0RTthQUNKO1lBQ0QsY0FBYztZQUNkLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxjQUFjLENBQUM7WUFDbkQsZUFBZTtTQUNsQjtLQUNKLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHR5cGUgeyBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWEgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5pbXBvcnQgeyBvYmplY3RTY2hlbWEsIHRyYW5zbGF0ZU1ldGFkYXRhVGV4dCB9IGZyb20gJy4uL2NvbmZpZ3VyYXRpb24vc2NyaXB0L21ldGFkYXRhJztcbmltcG9ydCB0eXBlIHsgSUVuZ2luZUNvbmZpZyB9IGZyb20gJy4vQHR5cGVzL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IElGZWF0dXJlSXRlbSwgSU1vZHVsZUl0ZW0sIE1vZHVsZVJlbmRlckNvbmZpZyB9IGZyb20gJy4vQHR5cGVzL21vZHVsZXMnO1xuXG50eXBlIFByaW1pdGl2ZSA9IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG50eXBlIEZsYWdWYWx1ZSA9IGJvb2xlYW4gfCBudW1iZXI7XG50eXBlIExvY2FsaXphdGlvblZhbHVlID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5leHBvcnQgaW50ZXJmYWNlIElFbmdpbmVEeW5hbWljTWV0YWRhdGFTY2hlbWFzIHtcbiAgICBpbmNsdWRlTW9kdWxlczogSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hO1xuICAgIGZsYWdQcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWE+O1xuICAgIGZsYWdzT2JqZWN0OiBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWE7XG4gICAgbWFjcm9Qcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWE+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFbmdpbmVEeW5hbWljQ29uZmlnRGVmYXVsdHMge1xuICAgIGluY2x1ZGVNb2R1bGVzOiBzdHJpbmdbXTtcbiAgICBmbGFnczogUmVjb3JkPHN0cmluZywgRmxhZ1ZhbHVlPjtcbiAgICBtYWNyb0NvbmZpZzogUmVjb3JkPHN0cmluZywgUHJpbWl0aXZlPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbiB7XG4gICAgZGVmYXVsdHM6IElFbmdpbmVEeW5hbWljQ29uZmlnRGVmYXVsdHM7XG4gICAgbWV0YWRhdGE6IElFbmdpbmVEeW5hbWljTWV0YWRhdGFTY2hlbWFzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFbmdpbmVEeW5hbWljQ29uZmlnT3B0aW9ucyB7XG4gICAgZW5naW5lUm9vdDogc3RyaW5nO1xuICAgIGZhbGxiYWNrQ29uZmlnOiBQaWNrPElFbmdpbmVDb25maWcsICdpbmNsdWRlTW9kdWxlcycgfCAnZmxhZ3MnIHwgJ21hY3JvQ29uZmlnJz47XG59XG5cbmludGVyZmFjZSBJRmVhdHVyZURlc2NyaXB0b3Ige1xuICAgIGlkOiBzdHJpbmc7XG4gICAgbGFiZWw6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBkZWZhdWx0OiBib29sZWFuO1xuICAgIGZsYWdzOiBJRmxhZ0Rlc2NyaXB0b3JbXTtcbn1cblxuaW50ZXJmYWNlIElGbGFnRGVzY3JpcHRvciB7XG4gICAga2V5OiBzdHJpbmc7XG4gICAgbGFiZWw6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBkZWZhdWx0OiBGbGFnVmFsdWU7XG59XG5cbmludGVyZmFjZSBJTWFjcm9EZXNjcmlwdG9yIHtcbiAgICBrZXk6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBkZWZhdWx0OiBQcmltaXRpdmU7XG59XG5cbmNvbnN0IEVOR0lORV9SRU5ERVJfQ09ORklHX1BBVEggPSBwYXRoLmpvaW4oJ2VkaXRvcicsICdlbmdpbmUtZmVhdHVyZXMnLCAncmVuZGVyLWNvbmZpZy5qc29uJyk7XG5jb25zdCBFTkdJTkVfTUFDUk9fU09VUkNFX1BBVEggPSBwYXRoLmpvaW4oJ2NvY29zJywgJ2NvcmUnLCAncGxhdGZvcm0nLCAnbWFjcm8udHMnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVuZ2luZVJlbmRlckNvbmZpZyhlbmdpbmVSb290OiBzdHJpbmcpOiBNb2R1bGVSZW5kZXJDb25maWcge1xuICAgIGNvbnN0IHJlbmRlckNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oZW5naW5lUm9vdCwgRU5HSU5FX1JFTkRFUl9DT05GSUdfUEFUSCk7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZFV0ZjhGaWxlKHJlbmRlckNvbmZpZ1BhdGgpKSBhcyBNb2R1bGVSZW5kZXJDb25maWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGl6ZWRFbmdpbmVSZW5kZXJDb25maWcoZW5naW5lUm9vdDogc3RyaW5nKTogTW9kdWxlUmVuZGVyQ29uZmlnIHtcbiAgICBjb25zdCBsb2NhbGUgPSBpMThuLl9sYW5nID8/ICd6aCc7XG4gICAgY29uc3QgcmVuZGVyQ29uZmlnID0gZ2V0RW5naW5lUmVuZGVyQ29uZmlnKGVuZ2luZVJvb3QpO1xuICAgIGNvbnN0IGxvY2FsaXphdGlvbiA9IGxvYWRMb2NhbGl6YXRpb24oZW5naW5lUm9vdCwgbG9jYWxlKTtcbiAgICByZXR1cm4gbG9jYWxpemVSZW5kZXJDb25maWcocmVuZGVyQ29uZmlnLCBsb2NhbGl6YXRpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbihvcHRpb25zOiBJRW5naW5lRHluYW1pY0NvbmZpZ09wdGlvbnMpOiBJRW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbG9jYWxlID0gaTE4bi5fbGFuZyA/PyAnemgnO1xuICAgICAgICBjb25zdCByZW5kZXJDb25maWcgPSBnZXRFbmdpbmVSZW5kZXJDb25maWcob3B0aW9ucy5lbmdpbmVSb290KTtcbiAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBjb2xsZWN0RmVhdHVyZURlc2NyaXB0b3JzKHJlbmRlckNvbmZpZyk7XG4gICAgICAgIGNvbnN0IG1hY3JvcyA9IGNvbGxlY3RNYWNyb0Rlc2NyaXB0b3JzKG9wdGlvbnMuZW5naW5lUm9vdCwgbG9jYWxlKTtcbiAgICAgICAgY29uc3QgZmxhZ0Rlc2NyaXB0b3JzID0gY29sbGVjdEZsYWdEZXNjcmlwdG9ycyhmZWF0dXJlcyk7XG4gICAgICAgIGNvbnN0IGZsYWdQcm9wZXJ0aWVzID0gYnVpbGRGbGFnUHJvcGVydGllcyhmbGFnRGVzY3JpcHRvcnMpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzOiBmZWF0dXJlcy5maWx0ZXIoKGZlYXR1cmUpID0+IGZlYXR1cmUuZGVmYXVsdCkubWFwKChmZWF0dXJlKSA9PiBmZWF0dXJlLmlkKSxcbiAgICAgICAgICAgICAgICBmbGFnczogYnVpbGRGbGFnRGVmYXVsdHMoZmxhZ0Rlc2NyaXB0b3JzKSxcbiAgICAgICAgICAgICAgICBtYWNyb0NvbmZpZzogYnVpbGRNYWNyb0RlZmF1bHRzKG1hY3JvcyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICBpbmNsdWRlTW9kdWxlczogYnVpbGRJbmNsdWRlTW9kdWxlc1NjaGVtYShmZWF0dXJlcyksXG4gICAgICAgICAgICAgICAgZmxhZ1Byb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgZmxhZ3NPYmplY3Q6IGJ1aWxkRmxhZ3NPYmplY3RTY2hlbWEoZmxhZ1Byb3BlcnRpZXMpLFxuICAgICAgICAgICAgICAgIG1hY3JvUHJvcGVydGllczogYnVpbGRNYWNyb1Byb3BlcnRpZXMobWFjcm9zKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRW5naW5lXSBGYWlsZWQgdG8gYnVpbGQgZHluYW1pYyBjb25maWd1cmF0aW9uIG1ldGFkYXRhIGZyb20gZW5naW5lIHNvdXJjZSwgZmFsbGJhY2sgdG8gc3RhdGljIGRlZmF1bHRzLicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUZhbGxiYWNrQ29udHJpYnV0aW9uKG9wdGlvbnMuZmFsbGJhY2tDb25maWcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZExvY2FsaXphdGlvbihlbmdpbmVSb290OiBzdHJpbmcsIGxvY2FsZTogc3RyaW5nKTogTG9jYWxpemF0aW9uVmFsdWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGxvY2FsZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoW2xvY2FsZSwgJ3poJywgJ2VuJ10pKTtcbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBsb2NhbGVzKSB7XG4gICAgICAgIGNvbnN0IGxvY2FsaXphdGlvblBhdGggPSBwYXRoLmpvaW4oZW5naW5lUm9vdCwgJ2VkaXRvcicsICdpMThuJywgY2FuZGlkYXRlLCAnbG9jYWxpemF0aW9uLmpzJyk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhsb2NhbGl6YXRpb25QYXRoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRDb21tb25Kc01vZHVsZUZyZXNoKGxvY2FsaXphdGlvblBhdGgpIGFzIExvY2FsaXphdGlvblZhbHVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbRW5naW5lXSBGYWlsZWQgdG8gbG9hZCBlbmdpbmUgbG9jYWxpemF0aW9uOiAke2xvY2FsaXphdGlvblBhdGh9YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbG9hZENvbW1vbkpzTW9kdWxlRnJlc2goZmlsZVBhdGg6IHN0cmluZyk6IHVua25vd24ge1xuICAgIGNvbnN0IHJlc29sdmVkID0gcmVxdWlyZS5yZXNvbHZlKGZpbGVQYXRoKTtcbiAgICBkZWxldGUgcmVxdWlyZS5jYWNoZVtyZXNvbHZlZF07XG4gICAgcmV0dXJuIHJlcXVpcmUocmVzb2x2ZWQpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RmVhdHVyZURlc2NyaXB0b3JzKFxuICAgIHJlbmRlckNvbmZpZzogTW9kdWxlUmVuZGVyQ29uZmlnXG4pOiBJRmVhdHVyZURlc2NyaXB0b3JbXSB7XG4gICAgY29uc3QgZGVzY3JpcHRvcnM6IElGZWF0dXJlRGVzY3JpcHRvcltdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IFtmZWF0dXJlS2V5LCBtb2R1bGVJdGVtXSBvZiBPYmplY3QuZW50cmllcyhyZW5kZXJDb25maWcuZmVhdHVyZXMpKSB7XG4gICAgICAgIGlmIChpc0ZlYXR1cmVHcm91cChtb2R1bGVJdGVtKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbb3B0aW9uS2V5LCBvcHRpb25JdGVtXSBvZiBPYmplY3QuZW50cmllcyhtb2R1bGVJdGVtLm9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvcnMucHVzaChjcmVhdGVGZWF0dXJlRGVzY3JpcHRvcihvcHRpb25LZXksIG9wdGlvbkl0ZW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzY3JpcHRvcnMucHVzaChjcmVhdGVGZWF0dXJlRGVzY3JpcHRvcihmZWF0dXJlS2V5LCBtb2R1bGVJdGVtKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3JzO1xufVxuXG5mdW5jdGlvbiBpc0ZlYXR1cmVHcm91cChtb2R1bGVJdGVtOiBJTW9kdWxlSXRlbSk6IG1vZHVsZUl0ZW0gaXMgRXh0cmFjdDxJTW9kdWxlSXRlbSwgeyBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBJRmVhdHVyZUl0ZW0+IH0+IHtcbiAgICByZXR1cm4gJ29wdGlvbnMnIGluIG1vZHVsZUl0ZW07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZlYXR1cmVEZXNjcmlwdG9yKFxuICAgIGZlYXR1cmVLZXk6IHN0cmluZyxcbiAgICBmZWF0dXJlSXRlbTogSUZlYXR1cmVJdGVtXG4pOiBJRmVhdHVyZURlc2NyaXB0b3Ige1xuICAgIGNvbnN0IGZsYWdzOiBJRmxhZ0Rlc2NyaXB0b3JbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2ZsYWdLZXksIGZsYWdJdGVtXSBvZiBPYmplY3QuZW50cmllcyhmZWF0dXJlSXRlbS5mbGFncyA/PyB7fSkpIHtcbiAgICAgICAgZmxhZ3MucHVzaCh7XG4gICAgICAgICAgICBrZXk6IGZsYWdLZXksXG4gICAgICAgICAgICBsYWJlbDogcmVzb2x2ZUxvY2FsaXphdGlvblRleHQoZmxhZ0l0ZW0ubGFiZWwsIHVuZGVmaW5lZCwgbG9kYXNoLnN0YXJ0Q2FzZShmbGFnS2V5KSkgPz8gbG9kYXNoLnN0YXJ0Q2FzZShmbGFnS2V5KSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiByZXNvbHZlTG9jYWxpemF0aW9uVGV4dChmbGFnSXRlbS5kZXNjcmlwdGlvbiwgdW5kZWZpbmVkKSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG5vcm1hbGl6ZUZsYWdWYWx1ZShmbGFnSXRlbS5kZWZhdWx0KSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGZlYXR1cmVLZXksXG4gICAgICAgIGxhYmVsOiByZXNvbHZlTG9jYWxpemF0aW9uVGV4dChmZWF0dXJlSXRlbS5sYWJlbCwgdW5kZWZpbmVkLCBsb2Rhc2guc3RhcnRDYXNlKGZlYXR1cmVLZXkpKSA/PyBsb2Rhc2guc3RhcnRDYXNlKGZlYXR1cmVLZXkpLFxuICAgICAgICBkZXNjcmlwdGlvbjogcmVzb2x2ZUxvY2FsaXphdGlvblRleHQoZmVhdHVyZUl0ZW0uZGVzY3JpcHRpb24sIHVuZGVmaW5lZCksXG4gICAgICAgIGRlZmF1bHQ6IEJvb2xlYW4oZmVhdHVyZUl0ZW0uZGVmYXVsdCksXG4gICAgICAgIGZsYWdzLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RGbGFnRGVzY3JpcHRvcnMoZmVhdHVyZXM6IElGZWF0dXJlRGVzY3JpcHRvcltdKTogSUZsYWdEZXNjcmlwdG9yW10ge1xuICAgIGNvbnN0IHByb3BlcnR5TWFwID0gbmV3IE1hcDxzdHJpbmcsIElGbGFnRGVzY3JpcHRvcj4oKTtcbiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmbGFnIG9mIGZlYXR1cmUuZmxhZ3MpIHtcbiAgICAgICAgICAgIGlmICghcHJvcGVydHlNYXAuaGFzKGZsYWcua2V5KSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5TWFwLnNldChmbGFnLmtleSwgeyAuLi5mbGFnIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHByb3BlcnR5TWFwLmdldChmbGFnLmtleSkhO1xuICAgICAgICAgICAgaWYgKCFleGlzdGluZy5kZXNjcmlwdGlvbiAmJiBmbGFnLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmcuZGVzY3JpcHRpb24gPSBmbGFnLmRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20ocHJvcGVydHlNYXAudmFsdWVzKCkpO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTG9jYWxpemF0aW9uVGV4dChcbiAgICB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsaXphdGlvbj86IExvY2FsaXphdGlvblZhbHVlLFxuICAgIGZhbGxiYWNrPzogc3RyaW5nXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICAgIH1cblxuICAgIGlmICghdmFsdWUuc3RhcnRzV2l0aCgnaTE4bjonKSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY29uc3Qga2V5ID0gdmFsdWUuc2xpY2UoJ2kxOG46Jy5sZW5ndGgpO1xuICAgIGNvbnN0IHJlc29sdmVkID0gZ2V0QnlQYXRoKGxvY2FsaXphdGlvbiwga2V5KVxuICAgICAgICA/PyBnZXRCeVBhdGgobG9jYWxpemF0aW9uLCBrZXkuc3BsaXQoJy4nKS5zbGljZSgxKS5qb2luKCcuJykpO1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2xhdGVkID0gdHJhbnNsYXRlTWV0YWRhdGFUZXh0KHZhbHVlKTtcbiAgICBpZiAodHJhbnNsYXRlZCAmJiB0cmFuc2xhdGVkICE9PSBrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBsb2NhbGl6ZVJlbmRlckNvbmZpZyhcbiAgICByZW5kZXJDb25maWc6IE1vZHVsZVJlbmRlckNvbmZpZyxcbiAgICBsb2NhbGl6YXRpb24/OiBMb2NhbGl6YXRpb25WYWx1ZVxuKTogTW9kdWxlUmVuZGVyQ29uZmlnIHtcbiAgICByZXR1cm4gdHJhbnNsYXRlUmVuZGVyQ29uZmlnVmFsdWUocmVuZGVyQ29uZmlnLCBsb2NhbGl6YXRpb24pO1xufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGVSZW5kZXJDb25maWdWYWx1ZTxUPih2YWx1ZTogVCwgbG9jYWxpemF0aW9uPzogTG9jYWxpemF0aW9uVmFsdWUpOiBUIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLm1hcCgoaXRlbSkgPT4gdHJhbnNsYXRlUmVuZGVyQ29uZmlnVmFsdWUoaXRlbSwgbG9jYWxpemF0aW9uKSkgYXMgVDtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLm1hcCgoW2tleSwgY2hpbGRWYWx1ZV0pID0+IFtcbiAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlUmVuZGVyQ29uZmlnVmFsdWUoY2hpbGRWYWx1ZSwgbG9jYWxpemF0aW9uKSxcbiAgICAgICAgICAgIF0pXG4gICAgICAgICkgYXMgVDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdHJhbnNsYXRlUmVuZGVyQ29uZmlnVGV4dCh2YWx1ZSwgbG9jYWxpemF0aW9uKSBhcyBUO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJhbnNsYXRlUmVuZGVyQ29uZmlnVGV4dCh2YWx1ZTogc3RyaW5nLCBsb2NhbGl6YXRpb24/OiBMb2NhbGl6YXRpb25WYWx1ZSk6IHN0cmluZyB7XG4gICAgaWYgKCF2YWx1ZS5zdGFydHNXaXRoKCdpMThuOicpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzb2x2ZUxvY2FsaXphdGlvblRleHQodmFsdWUsIGxvY2FsaXphdGlvbiwgdmFsdWUuc2xpY2UoJ2kxOG46Jy5sZW5ndGgpKVxuICAgICAgICA/PyB2YWx1ZS5zbGljZSgnaTE4bjonLmxlbmd0aCk7XG59XG5cbmZ1bmN0aW9uIGdldEJ5UGF0aCh0YXJnZXQ6IHVua25vd24sIGtleVBhdGg6IHN0cmluZyk6IHVua25vd24ge1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudHMgPSBrZXlQYXRoLnNwbGl0KCcuJyk7XG4gICAgbGV0IGN1cnJlbnQ6IHVua25vd24gPSB0YXJnZXQ7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICAgIGlmICghc2VnbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY3VycmVudCB8fCB0eXBlb2YgY3VycmVudCAhPT0gJ29iamVjdCcgfHwgIShzZWdtZW50IGluIGN1cnJlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudCA9IChjdXJyZW50IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtzZWdtZW50XTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gYnVpbGRJbmNsdWRlTW9kdWxlc1NjaGVtYShmZWF0dXJlczogSUZlYXR1cmVEZXNjcmlwdG9yW10pOiBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWEge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVzLmZpbHRlcigoZmVhdHVyZSkgPT4gZmVhdHVyZS5kZWZhdWx0KS5tYXAoKGZlYXR1cmUpID0+IGZlYXR1cmUuaWQpLFxuICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZHluYW1pYy5pbmNsdWRlTW9kdWxlcy50aXRsZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5keW5hbWljLmluY2x1ZGVNb2R1bGVzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmR5bmFtaWMuaW5jbHVkZU1vZHVsZXMuaXRlbVRpdGxlJyxcbiAgICAgICAgICAgIGVudW06IGZlYXR1cmVzLm1hcCgoZmVhdHVyZSkgPT4gZmVhdHVyZS5pZCksXG4gICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBmZWF0dXJlcy5tYXAoKGZlYXR1cmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZS5kZXNjcmlwdGlvbiAmJiBmZWF0dXJlLmRlc2NyaXB0aW9uICE9PSBmZWF0dXJlLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtmZWF0dXJlLmxhYmVsfSAtICR7ZmVhdHVyZS5kZXNjcmlwdGlvbn1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmVhdHVyZS5sYWJlbDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRmxhZ1Byb3BlcnRpZXMoZmxhZ3M6IElGbGFnRGVzY3JpcHRvcltdKTogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPiB7XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPiA9IHt9O1xuICAgIGZvciAoY29uc3QgZmxhZyBvZiBmbGFncykge1xuICAgICAgICBwcm9wZXJ0aWVzW2ZsYWcua2V5XSA9IHtcbiAgICAgICAgICAgIHR5cGU6IGluZmVyUHJpbWl0aXZlU2NoZW1hVHlwZShmbGFnLmRlZmF1bHQpLFxuICAgICAgICAgICAgZGVmYXVsdDogZmxhZy5kZWZhdWx0LFxuICAgICAgICAgICAgdGl0bGU6IGZsYWcubGFiZWwsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZmxhZy5kZXNjcmlwdGlvbixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuZnVuY3Rpb24gYnVpbGRGbGFnRGVmYXVsdHMoZmxhZ3M6IElGbGFnRGVzY3JpcHRvcltdKTogUmVjb3JkPHN0cmluZywgRmxhZ1ZhbHVlPiB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgZmxhZ3MubWFwKChmbGFnKSA9PiBbZmxhZy5rZXksIGZsYWcuZGVmYXVsdF0pXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRGbGFnc09iamVjdFNjaGVtYShcbiAgICBmbGFnUHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPlxuKTogSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoZmxhZ1Byb3BlcnRpZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LCB2YWx1ZS5kZWZhdWx0XSlcbiAgICApO1xuXG4gICAgcmV0dXJuIG9iamVjdFNjaGVtYShmbGFnUHJvcGVydGllcywge1xuICAgICAgICBkZWZhdWx0OiBkZWZhdWx0cyxcbiAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmR5bmFtaWMuZmxhZ3MudGl0bGUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5lbmdpbmUuZHluYW1pYy5mbGFncy5kZXNjcmlwdGlvbicsXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTWFjcm9Qcm9wZXJ0aWVzKG1hY3JvczogSU1hY3JvRGVzY3JpcHRvcltdKTogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPiB7XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hPiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBtYWNybyBvZiBtYWNyb3MpIHtcbiAgICAgICAgcHJvcGVydGllc1ttYWNyby5rZXldID0ge1xuICAgICAgICAgICAgdHlwZTogaW5mZXJQcmltaXRpdmVTY2hlbWFUeXBlKG1hY3JvLmRlZmF1bHQpLFxuICAgICAgICAgICAgZGVmYXVsdDogbWFjcm8uZGVmYXVsdCxcbiAgICAgICAgICAgIHRpdGxlOiBtYWNyby5rZXksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbWFjcm8uZGVzY3JpcHRpb24sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTWFjcm9EZWZhdWx0cyhtYWNyb3M6IElNYWNyb0Rlc2NyaXB0b3JbXSk6IFJlY29yZDxzdHJpbmcsIFByaW1pdGl2ZT4ge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgIG1hY3Jvcy5tYXAoKG1hY3JvKSA9PiBbbWFjcm8ua2V5LCBtYWNyby5kZWZhdWx0XSlcbiAgICApO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0TWFjcm9EZXNjcmlwdG9ycyhlbmdpbmVSb290OiBzdHJpbmcsIGxvY2FsZTogc3RyaW5nKTogSU1hY3JvRGVzY3JpcHRvcltdIHtcbiAgICBjb25zdCBtYWNyb1BhdGggPSBwYXRoLmpvaW4oZW5naW5lUm9vdCwgRU5HSU5FX01BQ1JPX1NPVVJDRV9QQVRIKTtcbiAgICBjb25zdCBzb3VyY2UgPSByZWFkVXRmOEZpbGUobWFjcm9QYXRoKTtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShtYWNyb1BhdGgsIHNvdXJjZSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSwgdHMuU2NyaXB0S2luZC5UUyk7XG4gICAgY29uc3QgbWFjcm9EZWZhdWx0cyA9IGNvbGxlY3RNYWNyb0RlZmF1bHRWYWx1ZXMoc291cmNlRmlsZSk7XG4gICAgY29uc3QgbWFjcm9JbnRlcmZhY2UgPSBzb3VyY2VGaWxlLnN0YXRlbWVudHMuZmluZCgoc3RhdGVtZW50KTogc3RhdGVtZW50IGlzIHRzLkludGVyZmFjZURlY2xhcmF0aW9uID0+IHtcbiAgICAgICAgcmV0dXJuIHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24oc3RhdGVtZW50KSAmJiBzdGF0ZW1lbnQubmFtZS50ZXh0ID09PSAnTWFjcm8nO1xuICAgIH0pO1xuXG4gICAgaWYgKCFtYWNyb0ludGVyZmFjZSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgZGVzY3JpcHRvcnM6IElNYWNyb0Rlc2NyaXB0b3JbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIG1hY3JvSW50ZXJmYWNlLm1lbWJlcnMpIHtcbiAgICAgICAgaWYgKCF0cy5pc1Byb3BlcnR5U2lnbmF0dXJlKG1lbWJlcikgfHwgIW1lbWJlci5uYW1lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleSA9IGdldFByb3BlcnR5TmFtZVRleHQobWVtYmVyLm5hbWUpO1xuICAgICAgICBpZiAoIWtleSB8fCAhbWFjcm9EZWZhdWx0cy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gZXh0cmFjdEpTRG9jVGV4dHMobWVtYmVyKTtcbiAgICAgICAgaWYgKCFkb2NzLmRlZmF1bHRUYWcpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzY3JpcHRvcnMucHVzaCh7XG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbG9jYWxlID09PSAnZW4nID8gZG9jcy5lbiA/PyBkb2NzLnpoIDogZG9jcy56aCA/PyBkb2NzLmVuLFxuICAgICAgICAgICAgZGVmYXVsdDogbWFjcm9EZWZhdWx0cy5nZXQoa2V5KSEsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBkZXNjcmlwdG9ycztcbn1cblxuZnVuY3Rpb24gY29sbGVjdE1hY3JvRGVmYXVsdFZhbHVlcyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogTWFwPHN0cmluZywgUHJpbWl0aXZlPiB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSBuZXcgTWFwPHN0cmluZywgUHJpbWl0aXZlPigpO1xuXG4gICAgZm9yIChjb25zdCBzdGF0ZW1lbnQgb2Ygc291cmNlRmlsZS5zdGF0ZW1lbnRzKSB7XG4gICAgICAgIGlmICghdHMuaXNWYXJpYWJsZVN0YXRlbWVudChzdGF0ZW1lbnQpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgZGVjbGFyYXRpb24gb2Ygc3RhdGVtZW50LmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghdHMuaXNJZGVudGlmaWVyKGRlY2xhcmF0aW9uLm5hbWUpIHx8IGRlY2xhcmF0aW9uLm5hbWUudGV4dCAhPT0gJ21hY3JvJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRlY2xhcmF0aW9uLmluaXRpYWxpemVyIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGRlY2xhcmF0aW9uLmluaXRpYWxpemVyKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIGRlY2xhcmF0aW9uLmluaXRpYWxpemVyLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSB8fCAhcHJvcGVydHkubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBnZXRQcm9wZXJ0eU5hbWVUZXh0KHByb3BlcnR5Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXZhbHVhdGVQcmltaXRpdmVFeHByZXNzaW9uKHByb3BlcnR5LmluaXRpYWxpemVyKTtcbiAgICAgICAgICAgICAgICBpZiAoIWtleSB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRlZmF1bHRzLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0cztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHlOYW1lVGV4dChuYW1lOiB0cy5Qcm9wZXJ0eU5hbWUpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICh0cy5pc0lkZW50aWZpZXIobmFtZSkgfHwgdHMuaXNTdHJpbmdMaXRlcmFsKG5hbWUpIHx8IHRzLmlzTnVtZXJpY0xpdGVyYWwobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIG5hbWUudGV4dDtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBldmFsdWF0ZVByaW1pdGl2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbjogdHMuRXhwcmVzc2lvbik6IFByaW1pdGl2ZSB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRzLmlzUGFyZW50aGVzaXplZEV4cHJlc3Npb24oZXhwcmVzc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIGV2YWx1YXRlUHJpbWl0aXZlRXhwcmVzc2lvbihleHByZXNzaW9uLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIGlmIChleHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGV4cHJlc3Npb24ua2luZCA9PT0gdHMuU3ludGF4S2luZC5GYWxzZUtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWwoZXhwcmVzc2lvbikgfHwgdHMuaXNOb1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbChleHByZXNzaW9uKSkge1xuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbi50ZXh0O1xuICAgIH1cblxuICAgIGlmICh0cy5pc051bWVyaWNMaXRlcmFsKGV4cHJlc3Npb24pKSB7XG4gICAgICAgIHJldHVybiBOdW1iZXIoZXhwcmVzc2lvbi50ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNQcmVmaXhVbmFyeUV4cHJlc3Npb24oZXhwcmVzc2lvbikpIHtcbiAgICAgICAgY29uc3Qgb3BlcmFuZCA9IGV2YWx1YXRlUHJpbWl0aXZlRXhwcmVzc2lvbihleHByZXNzaW9uLm9wZXJhbmQpO1xuICAgICAgICBpZiAodHlwZW9mIG9wZXJhbmQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4cHJlc3Npb24ub3BlcmF0b3IgPT09IHRzLlN5bnRheEtpbmQuTWludXNUb2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIC1vcGVyYW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4cHJlc3Npb24ub3BlcmF0b3IgPT09IHRzLlN5bnRheEtpbmQuUGx1c1Rva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gb3BlcmFuZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RKU0RvY1RleHRzKG5vZGU6IHRzLk5vZGUpOiB7XG4gICAgemg/OiBzdHJpbmc7XG4gICAgZW4/OiBzdHJpbmc7XG4gICAgZGVmYXVsdFRhZz86IHN0cmluZztcbn0ge1xuICAgIGNvbnN0IHJlc3VsdDoge1xuICAgICAgICB6aD86IHN0cmluZztcbiAgICAgICAgZW4/OiBzdHJpbmc7XG4gICAgICAgIGRlZmF1bHRUYWc/OiBzdHJpbmc7XG4gICAgfSA9IHt9O1xuXG4gICAgZm9yIChjb25zdCB0YWcgb2YgdHMuZ2V0SlNEb2NUYWdzKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0YWcudGFnTmFtZS50ZXh0O1xuICAgICAgICBjb25zdCBjb21tZW50ID0gbm9ybWFsaXplRG9jVGV4dChmbGF0dGVuVGFnQ29tbWVudCh0YWcuY29tbWVudCkpO1xuICAgICAgICBpZiAoIWNvbW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICd6aCcpIHtcbiAgICAgICAgICAgIHJlc3VsdC56aCA9IGNvbW1lbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ2VuJykge1xuICAgICAgICAgICAgcmVzdWx0LmVuID0gY29tbWVudDtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIHJlc3VsdC5kZWZhdWx0VGFnID0gY29tbWVudDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5UYWdDb21tZW50KGNvbW1lbnQ6IHRzLkpTRG9jVGFnWydjb21tZW50J10pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICghY29tbWVudCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY29tbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY29tbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1lbnQubWFwKChwYXJ0KSA9PiB0eXBlb2YgcGFydCA9PT0gJ3N0cmluZycgPyBwYXJ0IDogcGFydC50ZXh0KS5qb2luKCcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEb2NUZXh0KHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIHJlYWRVdGY4RmlsZShmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpLnJlcGxhY2UoL15cXHVGRUZGLywgJycpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVGbGFnVmFsdWUodmFsdWU6IHVua25vd24pOiBGbGFnVmFsdWUge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gQm9vbGVhbih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByaW1pdGl2ZVZhbHVlKHZhbHVlOiB1bmtub3duKTogUHJpbWl0aXZlIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gQm9vbGVhbih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGluZmVyUHJpbWl0aXZlU2NoZW1hVHlwZSh2YWx1ZTogUHJpbWl0aXZlKTogSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hWyd0eXBlJ10ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiAnbnVtYmVyJztcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuICdib29sZWFuJztcbiAgICB9XG5cbiAgICByZXR1cm4gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZhbGxiYWNrQ29uZmlnKFxuICAgIGZhbGxiYWNrQ29uZmlnOiBQaWNrPElFbmdpbmVDb25maWcsICdpbmNsdWRlTW9kdWxlcycgfCAnZmxhZ3MnIHwgJ21hY3JvQ29uZmlnJz5cbik6IElFbmdpbmVEeW5hbWljQ29uZmlnRGVmYXVsdHMge1xuICAgIHJldHVybiB7XG4gICAgICAgIGluY2x1ZGVNb2R1bGVzOiBbLi4uKGZhbGxiYWNrQ29uZmlnLmluY2x1ZGVNb2R1bGVzID8/IFtdKV0sXG4gICAgICAgIGZsYWdzOiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhmYWxsYmFja0NvbmZpZy5mbGFncyA/PyB7fSkubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXksIHZhbHVlXSlcbiAgICAgICAgKSxcbiAgICAgICAgbWFjcm9Db25maWc6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGZhbGxiYWNrQ29uZmlnLm1hY3JvQ29uZmlnID8/IHt9KS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gW2tleSwgbm9ybWFsaXplUHJpbWl0aXZlVmFsdWUodmFsdWUpXSlcbiAgICAgICAgKSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVGYWxsYmFja0NvbnRyaWJ1dGlvbihcbiAgICBmYWxsYmFja0NvbmZpZzogUGljazxJRW5naW5lQ29uZmlnLCAnaW5jbHVkZU1vZHVsZXMnIHwgJ2ZsYWdzJyB8ICdtYWNyb0NvbmZpZyc+XG4pOiBJRW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZEZhbGxiYWNrID0gbm9ybWFsaXplRmFsbGJhY2tDb25maWcoZmFsbGJhY2tDb25maWcpO1xuICAgIGNvbnN0IGZsYWdQcm9wZXJ0aWVzID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICBPYmplY3QuZW50cmllcyhub3JtYWxpemVkRmFsbGJhY2suZmxhZ3MpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LCB7XG4gICAgICAgICAgICB0eXBlOiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gJ251bWJlcicgOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiB2YWx1ZSxcbiAgICAgICAgICAgIHRpdGxlOiBrZXksXG4gICAgICAgIH0gc2F0aXNmaWVzIElDb2Nvc0NvbmZpZ3VyYXRpb25Qcm9wZXJ0eVNjaGVtYV0pXG4gICAgKTtcblxuICAgIGNvbnN0IG1hY3JvUHJvcGVydGllcyA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMobm9ybWFsaXplZEZhbGxiYWNrLm1hY3JvQ29uZmlnKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gW2tleSwge1xuICAgICAgICAgICAgdHlwZTogaW5mZXJQcmltaXRpdmVTY2hlbWFUeXBlKHZhbHVlKSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHZhbHVlLFxuICAgICAgICAgICAgdGl0bGU6IGtleSxcbiAgICAgICAgfSBzYXRpc2ZpZXMgSUNvY29zQ29uZmlndXJhdGlvblByb3BlcnR5U2NoZW1hXSlcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVmYXVsdHM6IG5vcm1hbGl6ZWRGYWxsYmFjayxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBub3JtYWxpemVkRmFsbGJhY2suaW5jbHVkZU1vZHVsZXMsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmR5bmFtaWMuaW5jbHVkZU1vZHVsZXMudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLmVuZ2luZS5keW5hbWljLmluY2x1ZGVNb2R1bGVzLmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uZW5naW5lLmR5bmFtaWMuaW5jbHVkZU1vZHVsZXMuaXRlbVRpdGxlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZsYWdQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgZmxhZ3NPYmplY3Q6IGJ1aWxkRmxhZ3NPYmplY3RTY2hlbWEoZmxhZ1Byb3BlcnRpZXMpLFxuICAgICAgICAgICAgbWFjcm9Qcm9wZXJ0aWVzLFxuICAgICAgICB9LFxuICAgIH07XG59XG4iXX0=