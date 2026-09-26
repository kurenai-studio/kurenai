'use strict';
const tokenizer = require('glsl-tokenizer/string');
const parser = require('glsl-parser/direct');
const mappings = require('./offline-mappings');
const yaml = require('js-yaml');
const tabAsSpaces = 2;
const plainDefineRE = /#define\s+(\w+)\s+(\w+)/g;
const effectDefineRE = /#pragma\s+define\s+(\w+)\s+(.*)\n/g;
const ident = /[_a-zA-Z]\w*/g;
const labelRE = /(\w+)\((.*?)\)/;
const locationRE = /location\s*=\s*(\d+)/;
const inDecl = /(?:layout\s*\((.*?)\)\s*)?in ((?:\w+\s+)?\w+\s+(\w+)\s*(?:\[[\d\s]+])?)\s*;/g;
const outDecl = /(?:layout\s*\((.*?)\)\s*)?(?<=\b)out ((?:\w+\s+)?\w+\s+(\w+)\s*(?:\[[\d\s]+])?)\s*;/g;
const layoutExtract = /layout\s*\((.*?)\)(\s*)$/;
const bindingExtract = /(?:location|binding)\s*=\s*(\d+)/;
const builtinRE = /^cc\w+$/i;
const pragmasToStrip = /^\s*(?:#pragma\s*)(?!STDGL|optimize|debug).*$\n/gm;
// texture function table remapping texture(glsl300) to textureXX(glsl100)
const textureFuncRemap = new Map([['ExternalOES', '2D']]);
let effectName = '', shaderName = '', shaderTokens = [];
const formatMsg = (msg, ln) => `${effectName}.effect - ${shaderName}` + (ln !== undefined ? ` - ${ln}: ` : ': ') + msg;
const options = {
    throwOnError: true,
    throwOnWarning: false,
    noSource: false,
    skipParserTest: false,
    chunkSearchFn: (names) => ({}),
    getAlternativeChunkPaths: (path) => [],
};
const dumpSource = (tokens) => {
    let ln = 0;
    return tokens.reduce((acc, cur) => (cur.line > ln ? acc + `\n${(ln = cur.line)}\t${cur.data.replace(/\n/g, '')}` : acc + cur.data), '');
};
const throwFnFactory = (level, outputFn) => {
    return (msg, ln) => {
        if (options.noSource) {
            ln = undefined;
        }
        const source = ln !== undefined ? ' ↓↓↓↓↓ EXPAND THIS MESSAGE FOR MORE INFO ↓↓↓↓↓' + dumpSource(shaderTokens) + '\n' : '';
        const formattedMsg = formatMsg(level + ' ' + msg, ln) + source;
        if (options.throwOnWarning) {
            throw formattedMsg;
        }
        else {
            outputFn(formattedMsg);
        }
    };
};
const warn = throwFnFactory('Warning', console.warn);
const error = throwFnFactory('Error', console.error);
const convertType = (t) => {
    const tp = mappings.typeMap[t];
    return tp === undefined ? t : tp;
};
const VSBit = mappings.getShaderStage('vertex');
const FSBit = mappings.getShaderStage('fragment');
const CSBit = mappings.getShaderStage('compute');
const mapShaderStage = (stage) => {
    switch (stage) {
        case 'vert':
            return VSBit;
        case 'frag':
            return FSBit;
        case 'compute':
            return CSBit;
        default:
            return 0;
    }
};
const stripComments = (() => {
    const crlfNewLines = /\r\n/g;
    const blockComments = /\/\*.*?\*\//gs;
    const lineComments = /\s*\/\/.*$/gm;
    return (code) => {
        // strip comments
        let result = code.replace(blockComments, '');
        result = result.replace(lineComments, '');
        // replace CRLFs (tokenizer doesn't work with /r/n)
        result = result.replace(crlfNewLines, '\n');
        return result;
    };
})();
const globalChunks = {};
const globalDeprecations = { chunks: {}, identifiers: {} };
const addChunk = (() => {
    const depRE = /#pragma\s+deprecate-(chunk|identifier)\s+([\w-]+)(?:\s+(.*))?/g;
    return (name, content, chunks = globalChunks, deprecations = globalDeprecations) => {
        const chunk = stripComments(content);
        let depCap = depRE.exec(chunk);
        let code = '', nextBegIdx = 0;
        while (depCap) {
            const type = `${depCap[1]}s`;
            if (!deprecations[type]) {
                deprecations[type] = {};
            }
            deprecations[type][depCap[2]] = depCap[3];
            code += chunk.slice(nextBegIdx, depCap.index);
            nextBegIdx = depCap.index + depCap[0].length;
            depCap = depRE.exec(chunk);
        }
        chunks[name] = code + chunk.slice(nextBegIdx);
    };
})();
const invokeSearch = (names) => {
    const { name, content } = options.chunkSearchFn(names);
    if (content !== undefined) {
        addChunk(name, content);
        return name;
    }
    return '';
};
const unwindIncludes = (() => {
    const includeRE = /^(.*)#include\s+[<"]([^>"]+)[>"](.*)$/gm;
    let replacer;
    const replacerFactory = (chunks, deprecations, record) => (str, prefix, name, suffix) => {
        name = name.trim();
        if (name.endsWith('.chunk')) {
            name = name.slice(0, -6);
        }
        const originalName = name;
        if (record.has(name)) {
            return '';
        }
        if (deprecations[name] !== undefined) {
            error(`EFX2003: header '${name}' is deprecated: ${deprecations[name]}`);
        }
        let content = undefined;
        do {
            content = chunks[name];
            if (content !== undefined) {
                break;
            }
            const alternatives = options.getAlternativeChunkPaths(name);
            if (alternatives.some((path) => {
                if (chunks[path] !== undefined) {
                    name = path;
                    content = chunks[path];
                    return true;
                }
                return false;
            })) {
                break;
            }
            name = invokeSearch([].concat(name, alternatives));
            content = globalChunks[name];
            if (content !== undefined) {
                break;
            }
            error(`EFX2001: can not resolve '${originalName}'`);
            return '';
        } while (0); // eslint-disable-line
        record.add(name);
        if (prefix) {
            content = content.replace(/^/gm, prefix);
        }
        if (suffix) {
            content = content.replace(/\n/g, suffix + '\n') + suffix;
        }
        content = content.replace(includeRE, replacer);
        return content;
    };
    return (str, chunks, deprecations, record = new Set()) => {
        replacer = replacerFactory(chunks, deprecations.chunks, record);
        str = str.replace(includeRE, replacer);
        if (deprecations.identifierRE) {
            let depCap = deprecations.identifierRE.exec(str);
            while (depCap) {
                const depMsg = deprecations.identifiers[depCap[1]];
                if (depMsg) {
                    error(`EFX2004: identifier '${depCap[1]}' is deprecated: ${depMsg}`);
                }
                depCap = deprecations.identifierRE.exec(str);
            }
        }
        return str;
    };
})();
const expandFunctionalMacro = (() => {
    const getMatchingParen = (string, startParen) => {
        if (string[startParen] !== '(') {
            return startParen;
        }
        let depth = 1;
        let i = startParen + 1;
        for (; i < string.length; i++) {
            if (string[i] === '(') {
                depth++;
            }
            if (string[i] === ')') {
                depth--;
            }
            if (depth === 0) {
                break;
            }
        }
        return i;
    };
    const parenAwareSplit = (string) => {
        const res = [];
        let beg = 0;
        for (let i = 0; i < string.length; i++) {
            if (string[i] === '(') {
                i = getMatchingParen(string, i) + 1;
            }
            if (string[i] === ',') {
                res.push(string.substring(beg, i).trim());
                beg = i + 1;
            }
        }
        if (beg !== string.length || string[string.length - 1] === ',') {
            res.push(string.substring(beg).trim());
        }
        return res;
    };
    const defineRE = /#pragma\s+define\s+(\w+)\(([\w,\s]*)\)\s+(.*?)\n/g;
    const hashRE = /(?<=\w)##(?=\w)/g;
    const newlineRE = /\\\s*?\n/g;
    const newlineMarkRE = /@@/g;
    const definePrefixRE = /#pragma\s+define|#define/;
    return (code) => {
        code = code.replace(newlineRE, '@@');
        let defineCapture = defineRE.exec(code);
        // loop through definitions
        while (defineCapture !== null) {
            const fnName = defineCapture[1];
            const fnParams = parenAwareSplit(defineCapture[2]);
            const fnBody = defineCapture[3];
            const defStartIdx = defineCapture.index;
            const defEndIdx = defineCapture.index + defineCapture[0].length;
            const macroRE = new RegExp('^(.*?)' + fnName + '\\s*\\(', 'gm');
            // loop through invocations
            if (new RegExp('\\b' + fnName + '\\b').test(fnBody)) {
                warn(`EFX2002: recursive macro processor '${fnName}'`);
            }
            else {
                for (let macroCapture = macroRE.exec(code); macroCapture !== null; macroCapture = macroRE.exec(code)) {
                    const openParenIdx = macroCapture.index + macroCapture[0].length - 1;
                    if (openParenIdx > defStartIdx && openParenIdx < defEndIdx) {
                        continue;
                    } // skip original definition
                    const prefix = macroCapture[1];
                    const startIdx = macroCapture.index + prefix.length;
                    const endIdx = getMatchingParen(code, openParenIdx) + 1;
                    const params = parenAwareSplit(code.slice(macroCapture.index + macroCapture[0].length, endIdx - 1));
                    if (params.length !== fnParams.length) {
                        warn(`EFX2005: not enough arguments for function-like macro invocation '${fnName}'`);
                    }
                    // patch function body
                    const records = [];
                    for (let i = 0; i < fnParams.length; i++) {
                        const re = new RegExp('\\b' + fnParams[i] + '\\b', 'g');
                        let match;
                        while ((match = re.exec(fnBody)) !== null) {
                            records.push({ beg: match.index, end: re.lastIndex, target: params[i] });
                        }
                    }
                    let body = '';
                    let index = 0;
                    for (const record of records.sort((a, b) => a.beg - b.beg)) {
                        body += fnBody.slice(index, record.beg) + record.target;
                        index = record.end;
                    }
                    body += fnBody.slice(index, fnBody.length);
                    if (!definePrefixRE.test(prefix)) {
                        // for top level invocations
                        let indentCount = prefix.search(/\S/); // calc indentation
                        if (indentCount < 0) {
                            indentCount = prefix.length;
                        }
                        body = body.replace(hashRE, ''); // clear the hashes
                        body = body.replace(newlineMarkRE, '\n' + ' '.repeat(indentCount)); // restore newlines in the output
                    }
                    else {
                        const lastNewline = prefix.lastIndexOf('@@'); // calc indentation
                        const curLinePrefix = lastNewline < 0 ? prefix : prefix.slice(lastNewline + 2);
                        let indentCount = curLinePrefix.search(/\S/);
                        if (indentCount < 0) {
                            indentCount = curLinePrefix.length;
                        }
                        body = body.replace(newlineMarkRE, '@@' + ' '.repeat(indentCount));
                    }
                    // replace the invocation
                    code = code.substring(0, startIdx) + body + code.substring(endIdx);
                    // move to the starting point in case the function body is actually shorter than the invocation
                    macroRE.lastIndex -= macroCapture[0].length;
                }
            }
            code = code.substring(0, defStartIdx) + code.substring(defEndIdx); // no longer need to be around
            defineRE.lastIndex = 0; // reset pointer
            defineCapture = defineRE.exec(code);
        }
        code.replace(newlineMarkRE, '\\\n');
        return code;
    };
})();
const expandInputStatement = (statements) => {
    let gl4Index = 0;
    let es1Index = 0;
    let es3Index = 0;
    let outIndex = 0;
    let dsIndex;
    const Types = {
        u: ['uvec4', 'usubpassInput'],
        i: ['ivec4', 'isubpassInput'],
        f: ['vec4', 'subpassInput'],
    };
    const inputPrefix = '__in';
    let out = '';
    let hasColor = false;
    let hasDepthStencil = false;
    for (const statement of statements) {
        const inputType = statement.type;
        const varType = Types[statement.signed];
        const inout = statement.inout;
        const name = statement.name;
        const precision = statement.precision ? statement.precision : '';
        const inputIndex = inputType !== 'Color' ? dsIndex ?? gl4Index : gl4Index;
        const macroOut = `\n` +
            `#if __VERSION__ >= 450\n` +
            `  layout(location = ${outIndex}) out ${varType[0]} ${name};\n` +
            `#elif __VERSION__ >= 300\n` +
            `  layout(location = ${es3Index}) out ${varType[0]} ${name};\n` +
            `#endif\n`;
        const macroOut450 = `\n` + `#if __VERSION__ >= 450\n` + `  layout(location = ${outIndex}) out ${varType[0]} ${name};\n` + `#endif\n`;
        const macroDepthStencilIn = `\n` +
            `#pragma rate ${inputPrefix}${name} pass\n` +
            `#if CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT\n` +
            `  #if __VERSION__ >= 450\n` +
            `    layout(input_attachment_index = ${inputIndex}) uniform ${varType[1]} ${inputPrefix}${name};\n` +
            `    #define subpassLoad_${name} subpassLoad(${inputPrefix}${name})\n` +
            `  #else\n` +
            `    #define subpassLoad_${name} ${varType[0]}(gl_LastFrag${inputType}ARM, 0, 0, 0)\n` +
            `  #endif\n` +
            `#else\n` +
            `  #define subpassLoad_${name} ${varType[0]}(0, 0, 0, 0)\n` +
            `#endif\n`;
        const macroColorIn = `\n` +
            `#pragma rate ${inputPrefix}${name} pass\n` +
            `#if CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT\n` +
            `  #if __VERSION__ >= 450\n` +
            `    layout(input_attachment_index = ${inputIndex}) uniform subpassInput ${inputPrefix}${name};\n` +
            `    #define subpassLoad_${name} subpassLoad(${inputPrefix}${name})\n` +
            `  #elif __VERSION__ >= 300\n` +
            `    layout(location = ${es3Index}) inout ${precision} ${varType[0]} ${name};\n` +
            `    #define subpassLoad_${name} ${name}\n` +
            `  #else\n` +
            `    #define subpassLoad_${name} gl_LastFragData[${es1Index}]\n` +
            `  #endif\n` +
            `#else\n` +
            `  #define subpassLoad_${name} ${precision} ${varType[0]}(0, 0, 0, 0)\n` +
            `#endif\n`;
        if (inout === 'out') {
            out += macroOut;
            outIndex++;
            es3Index++;
        }
        if (inout === 'inout') {
            out += macroOut450;
            outIndex++;
        }
        if (inout === 'in' || inout === 'inout') {
            if (inputType === 'Color') {
                out += macroColorIn;
                gl4Index++;
                es1Index++;
                es3Index++;
                hasColor = true;
            }
            else {
                if (dsIndex === void 0) {
                    dsIndex = gl4Index;
                    gl4Index++;
                }
                out += macroDepthStencilIn;
                hasDepthStencil = true;
            }
        }
    }
    const colorExtension = '#pragma extension([GL_EXT_shader_framebuffer_fetch, __VERSION__ < 450, enable])\n';
    const dsExtension = '#pragma extension([GL_ARM_shader_framebuffer_fetch_depth_stencil, __VERSION__ < 450, enable])\n';
    if (hasColor) {
        out = colorExtension + out;
    }
    if (hasDepthStencil) {
        out = dsExtension + out;
    }
    return out;
};
const expandSubpassInout = (code) => {
    const inputStatements = [];
    const inputTypeWeights = {
        Color: 0,
        Depth: 1,
        Stencil: 2,
    };
    const inoutTypeWeights = {
        in: 0,
        inout: 1,
        out: 2,
    };
    const FilterMap = {
        Color: { inouts: ['in', 'out', 'inout'], types: ['i', 'f', 'u'], hint: '' },
        Depth: { inouts: ['in'], types: ['f'], hint: 'subpassDepth' },
        Stencil: { inouts: ['in'], types: ['i'], hint: 'isubpassStencil' },
    };
    // replace subpassLoad(val) functions to subpassLoad_val
    code = code.replace(/subpassLoad\s*\(\s*(\w+)\s*\)/g, `subpassLoad_$1`);
    let attachmentIndex = 0;
    const subpassDefineRE = /#pragma\s+(i|u)?subpass(Color|Depth|Stencil)\s+(\w+)\s*(mediump|highp|lowp)?\s+(\w+)\s+/g;
    let defineCapture = subpassDefineRE.exec(code);
    while (defineCapture !== null) {
        const signed = defineCapture[1] ? defineCapture[1] : 'f';
        const input = defineCapture[2];
        const inout = defineCapture[3];
        const precision = defineCapture[4];
        const name = defineCapture[5];
        const index = attachmentIndex;
        const filter = FilterMap[input];
        if (!filter.inouts.includes(inout)) {
            error(`unsupported inout type ${input}, ${inout}`);
            return code;
        }
        if (!filter.types.includes(signed)) {
            error(`unsupported subpass type for ${input}, only ${filter.hint} supported`);
            return code;
        }
        inputStatements.push({
            type: input,
            inout: inout,
            name: name,
            index: index,
            precision: precision,
            signed: signed,
            sortKeyInput: inputTypeWeights[input],
            sortKeyInout: inoutTypeWeights[inout],
        });
        const beg = defineCapture.index;
        const end = defineCapture.index + defineCapture[0].length;
        code = code.substring(0, beg) + code.substring(end);
        subpassDefineRE.lastIndex = beg;
        defineCapture = subpassDefineRE.exec(code);
        ++attachmentIndex;
    }
    inputStatements.sort((a, b) => {
        if (a.sortKeyInout !== b.sortKeyInout) {
            return a.sortKeyInout - b.sortKeyInout;
        }
        if (a.sortKeyInput != b.sortKeyInput) {
            return a.sortKeyInput - b.sortKeyInput;
        }
        // no sort will be applied to out-only color attachment
        if (a.sortKeyInout === inoutTypeWeights['out']) {
            return a.index - b.index;
        }
        else {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
        }
        return 0;
    });
    const out = expandInputStatement(inputStatements);
    const subpassReplaceRE = /#pragma\s+subpass/g;
    const subpassReplace = subpassReplaceRE.exec(code);
    if (subpassReplace) {
        const beg = subpassReplace.index;
        const end = subpassReplace.index + subpassReplace[0].length;
        code = code.substring(0, beg) + out + code.substring(end);
    }
    return code;
};
const expandLiteralMacro = (code) => {
    const defines = {};
    let defCap = effectDefineRE.exec(code);
    // extraction
    while (defCap !== null) {
        let value = defCap[2];
        if (value.endsWith('\\')) {
            value = value.slice(0, -1);
        }
        defines[defCap[1]] = value.trim();
        const beg = defCap.index;
        const end = defCap.index + defCap[0].length;
        code = code.substring(0, beg) + code.substring(end);
        effectDefineRE.lastIndex = beg;
        defCap = effectDefineRE.exec(code);
    }
    // replacement
    const keyREs = Object.keys(defines).map((k) => new RegExp(`\\b${k}\\b`, 'g'));
    const values = Object.values(defines);
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        for (let j = 0; j < i; j++) {
            // only replace ealier ones
            value = value.replace(keyREs[j], values[j]);
        }
        code = code.replace(keyREs[i], value);
    }
    return code;
};
const extractMacroDefinitions = (code) => {
    const defines = new Set();
    let defCap = plainDefineRE.exec(code);
    const substituteMap = new Map();
    while (defCap !== null) {
        defines.add(defCap[1]);
        if (defCap[2] && defCap[2].toLowerCase !== 'true' && defCap[2].toLowerCase !== 'false') {
            const tryNumber = parseInt(defCap[2]);
            if (isNaN(tryNumber)) {
                // #define CC_SURFACE_USE_VERTEX_COLOR USE_VERTEX_COLOR
                substituteMap.set(defCap[1], defCap[2]);
            }
        }
        defCap = plainDefineRE.exec(code);
    }
    return [defines, substituteMap];
};
const eliminateDeadCode = (() => {
    const scopeRE = /[{}()]/g;
    const sigRE = /(?:\w+p\s+)?\w+\s+(\w+)\s*$/; // precision? returnType fnName
    const spacesRE = /^\s*$/;
    let name = '';
    let beg = 0;
    let end = 0;
    const recordBegin = (code, leftParen) => {
        const cap = code.substring(end, leftParen).match(sigRE) || ['', ''];
        name = cap[1];
        beg = leftParen - cap[0].length;
    };
    const getAllCaptures = (code, RE) => {
        const caps = [];
        let cap = RE.exec(code);
        while (cap) {
            caps.push(cap);
            cap = RE.exec(code);
        }
        return caps;
    };
    const livepool = new Set();
    const ascension = (functions, idx) => {
        if (livepool.has(idx)) {
            return;
        }
        livepool.add(idx);
        for (const dep of functions[idx].deps) {
            ascension(functions, dep);
        }
    };
    return (code, entry, functions) => {
        let depth = 0, state = 0, paramListEnd = 0;
        end = 0;
        scopeRE.lastIndex = 0;
        livepool.clear();
        const functionsFull = [];
        // extraction
        for (const cur of getAllCaptures(code, scopeRE)) {
            const c = cur[0];
            if (depth === 0) {
                if (c === '(') {
                    (state = 1), recordBegin(code, cur.index);
                }
                else if (c === ')') {
                    if (state === 1) {
                        (state = 2), (paramListEnd = cur.index + 1);
                    }
                    else {
                        state = 0;
                    }
                }
                else if (c === '{') {
                    if (state === 2 && spacesRE.test(code.substring(paramListEnd, cur.index))) {
                        state = 3;
                    }
                    else {
                        state = 0;
                    }
                }
            }
            if (c === '{') {
                depth++;
            }
            if (c === '}' && --depth === 0) {
                if (state !== 3) {
                    continue;
                }
                end = cur.index + 1;
                state = 0;
                if (name) {
                    functionsFull.push({ name, beg, end, paramListEnd, deps: [] });
                }
            }
        }
        // inspection
        let entryIdx = functionsFull.findIndex((f) => f.name === entry);
        if (entryIdx < 0) {
            error(`EFX2403: entry function '${entry}' not found.`);
            entryIdx = 0;
        }
        for (let i = 0; i < functionsFull.length; i++) {
            const fn = functionsFull[i];
            const caps = getAllCaptures(code, new RegExp('\\b' + fn.name + '\\b', 'g'));
            for (const cap of caps) {
                const target = functionsFull.findIndex((f) => cap.index > f.beg && cap.index < f.end);
                if (target >= 0 && target !== i) {
                    functionsFull[target].deps.push(i);
                }
            }
        }
        // extract all functionsFull reachable from main
        // actually this even works with function overloading, albeit not the best output possible:
        // overloads for the same function will be extracted all at once or not at all
        ascension(functionsFull, entryIdx);
        // elimination
        let result = '', pointer = 0, offset = 0;
        for (let i = 0; i < functionsFull.length; i++) {
            const dc = functionsFull[i];
            const { name, beg, end } = dc;
            if (livepool.has(i) || name === 'main') {
                // adjust position and add to final list
                dc.beg -= offset;
                dc.end -= offset;
                dc.paramListEnd -= offset;
                functions.push(dc);
                continue;
            }
            result += code.substring(pointer, beg);
            pointer = end;
            offset += end - beg;
        }
        return result + code.substring(pointer);
    };
})();
const parseCustomLabels = (arr, out = {}) => {
    let str = arr.join(' ');
    let labelCap = labelRE.exec(str);
    while (labelCap) {
        try {
            out[labelCap[1]] = yaml.load(labelCap[2] || 'true');
        }
        catch (e) {
            warn(`EFX2102: parameter for label '${labelCap[1]}' is not legal YAML: ${e.message}`);
        }
        str = str.substring(labelCap.index + labelCap[0].length);
        labelCap = labelRE.exec(str);
    }
    return out;
};
/**
 * say we are extracting from this program:
 * ```
 *    // ..
 * 12 #if USE_LIGHTING
 *      // ..
 * 34   #if NUM_LIGHTS > 0
 *        // ..
 * 56   #endif
 *      // ..
 * 78 #endif
 *    // ..
 * ```
 *
 * the output would be:
 * ```
 * // the complete define list
 * defines = [
 *   { name: 'USE_LIGHTING', type: 'boolean', defines: [] },
 *   { name: 'NUM_LIGHTS', type: 'number', range: [0, 3], defines: [ 'USE_LIGHTING' ] }
 * ]
 * // bookkeeping: define dependency throughout the code
 * cache = {
 *   lines: [12, 34, 56, 78],
 *   12: [ 'USE_LIGHTING' ],
 *   34: [ 'USE_LIGHTING', 'NUM_LIGHTS' ],
 *   56: [ 'USE_LIGHTING' ],
 *   78: []
 * }
 * ````
 */
const getDefs = (line, cache) => {
    let idx = cache.lines.findIndex((i) => i > line);
    if (idx < 0) {
        idx = cache.lines.length;
    }
    return cache[cache.lines[idx - 1]] || [];
};
const pushDefines = (defines, existingDefines, newDefine) => {
    if (existingDefines.has(newDefine.name)) {
        return;
    }
    defines.push(newDefine);
};
const extractDefines = (tokens, defines, cache) => {
    const curDefs = [], save = (line) => {
        cache[line] = curDefs.reduce((acc, val) => acc.concat(val), []);
        cache.lines.push(line);
    };
    let elifClauses = 0;
    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i], str = t.data, id, df;
        if (t.type !== 'preprocessor' || str.startsWith('#extension')) {
            continue;
        }
        str = str.split(/\s+/);
        if (str[0] === '#endif') {
            // pop one level up
            while (elifClauses > 0) {
                curDefs.pop(), elifClauses--;
            } // pop all the elifs
            curDefs.pop();
            save(t.line);
            continue;
        }
        else if (str[0] === '#else' || str[0] === '#elif') {
            // flip
            const def = curDefs[curDefs.length - 1];
            def && def.forEach((d, i) => (def[i] = d[0] === '!' ? d.slice(1) : '!' + d));
            save(t.line);
            if (str[0] === '#else') {
                continue;
            }
            elifClauses++;
        }
        else if (str[0] === '#pragma') {
            // pragmas
            if (str.length <= 1) {
                continue;
            }
            if (str[1] === 'define-meta') {
                // define specifications
                if (str.length <= 2) {
                    warn('EFX2101: define pragma: missing info', t.line);
                    continue;
                }
                ident.lastIndex = 0;
                if (!ident.test(str[2])) {
                    continue;
                } // some constant macro replaced this one, skip
                const d = curDefs.reduce((acc, val) => acc.concat(val), []);
                let def = defines.find((d) => d.name === str[2]);
                if (!def) {
                    pushDefines(defines, cache.existingDefines, (def = { name: str[2], type: 'boolean', defines: d, dummyDependency: true }));
                }
                const prop = parseCustomLabels(str.splice(3));
                for (const key in prop) {
                    if (key === 'range') {
                        // number range
                        def.type = 'number';
                        def.range = [0, 3];
                        def.fixedType = true;
                        if (!Array.isArray(prop.range)) {
                            warn(`EFX2103: invalid range for macro '${def.name}'`, t.line);
                        }
                        else {
                            def.range = prop.range;
                        }
                    }
                    else if (key === 'options') {
                        // string options
                        def.type = 'string';
                        def.options = [];
                        def.fixedType = true;
                        if (!Array.isArray(prop.options)) {
                            warn(`EFX2104: invalid options for macro '${def.name}'`, t.line);
                        }
                        else {
                            def.options = prop.options;
                        }
                    }
                    else if (key === 'default') {
                        switch (prop.default) {
                            case true:
                                def.default = 1;
                                break;
                            case false:
                                def.default = 0;
                                break;
                            default:
                                def.type = 'constant';
                                def.default = prop.default;
                                def.fixedType = true;
                                break;
                        }
                    }
                    else if (key === 'editor') {
                        def.editor = prop.editor;
                    }
                    else {
                        warn(`EFX2105: define pragma: illegal label '${key}'`, t.line);
                        continue;
                    }
                }
            }
            else if (str[1] === 'warning') {
                warn(`EFX2107: ${str.slice(2).join(' ')}`);
            }
            else if (str[1] === 'error') {
                error(`EFX2108: ${str.slice(2).join(' ')}`);
            }
            else {
                // other specifications, save for later passes
                const labels = parseCustomLabels(str.slice(1));
                if (labels.extension) {
                    // extension request
                    cache.extensions[labels.extension[0]] = {
                        defines: getDefs(t.line, cache),
                        cond: labels.extension[1],
                        level: labels.extension[2],
                        runtimeCond: labels.extension[3],
                    };
                }
                else {
                    cache[t.line] = labels;
                }
            }
            continue;
        }
        else if (!/#(el)?if$/.test(str[0])) {
            continue;
        }
        let defs = [];
        let orAppeared = false;
        str.splice(1).some((s) => {
            ident.lastIndex = 0;
            id = ident.exec(s);
            if (id) {
                // is identifier
                if (id[0] === 'defined' || // skip macros that can be undefined
                    id[0].startsWith('__') || // skip language builtin macros
                    id[0].startsWith('GL_') ||
                    id[0] === 'VULKAN') {
                    return false;
                }
                const d = curDefs.reduce((acc, val) => acc.concat(val), defs.slice());
                df = defines.find((d) => d.name === id[0]);
                if (df) {
                    let needUpdate = d.length < df.defines.length; // update path if shorter
                    if (df.dummyDependency) {
                        (needUpdate = true), delete df.dummyDependency;
                    } // or have a dummy
                    if (needUpdate) {
                        df.defines = d;
                    }
                }
                else {
                    pushDefines(defines, cache.existingDefines, (df = { name: id[0], type: 'boolean', defines: d }));
                }
                defs.push((s[0] === '!' ? '!' : '') + id[0]);
            }
            else if (df && /^[<=>]+$/.test(s) && !df.fixedType) {
                df.type = 'number';
                df.range = [0, 3];
            }
            else if (s === '||') {
                orAppeared = true;
                return false;
            }
            return false;
        });
        if (orAppeared) {
            defs = []; // or is not supported, skip all
        }
        curDefs.push(defs);
        save(t.line);
    }
    defines.forEach((d) => (delete d.fixedType, delete d.dummyDependency));
};
const extractUpdateRates = (tokens, rates = []) => {
    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i], str = t.data, id, df;
        if (t.type !== 'preprocessor' || str.startsWith('#extension')) {
            continue;
        }
        str = str.split(/\s+/);
        if (str[0] === '#pragma' && str.length === 4) {
            if (str[1] === 'rate') {
                rates.push({ name: str[2], rate: str[3] });
            }
        }
    }
    return rates;
};
const extractUnfilterableFloat = (tokens, sampleTypes = []) => {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        let str = t.data;
        if (t.type !== 'preprocessor' || str.startsWith('#extension')) {
            continue;
        }
        str = str.split(/\s+/);
        if (str[0] === '#pragma' && str.length === 3) {
            if (str[1] === 'unfilterable-float') {
                sampleTypes.push({ name: str[2], sampleType: 1 }); // SampleType.UNFILTERABLE_FLOAT
            }
        }
    }
    return sampleTypes;
};
const extractParams = (() => {
    // tokens (from ith): [ ..., ('highp', ' ',) 'vec4', ' ', 'color', ('[', '4', ']',) ... ]
    const precision = /(low|medium|high)p/;
    const extractInfo = (tokens, i) => {
        const param = {};
        const definedPrecision = precision.exec(tokens[i].data);
        let offset = definedPrecision ? 2 : 0;
        param.name = tokens[i + offset + 2].data;
        param.typename = tokens[i + offset].data;
        param.type = convertType(tokens[i + offset].data);
        param.count = 1;
        if (definedPrecision) {
            param.precision = definedPrecision[0] + ' ';
        }
        // handle array type
        if (tokens[(offset = nextWord(tokens, i + offset + 2))].data === '[') {
            let expr = '', end = offset;
            while (tokens[++end].data !== ']') {
                expr += tokens[end].data;
            }
            try {
                if (/^[\d+\-*/%\s]+$/.test(expr)) {
                    param.count = eval(expr);
                } // arithmetics
                else if (builtinRE.test(param.name)) {
                    param.count = expr;
                }
                else {
                    throw expr;
                }
                param.isArray = true;
            }
            catch (e) {
                error(`EFX2202: ${param.name}: non-builtin array length must be compile-time constant: ${e}`, tokens[offset].line);
            }
        }
        return param;
    };
    const stripDuplicates = (arr) => {
        const dict = {};
        return arr.filter((e) => (dict[e] ? false : (dict[e] = true)));
    };
    const exMap = { whitespace: true };
    const nextWord = (tokens, i) => {
        do {
            ++i;
        } while (exMap[tokens[i].type]);
        return i;
    };
    const nextSemicolon = (tokens, i, check = (t) => { }) => {
        while (tokens[i].data !== ';') {
            check(tokens[i++]);
        }
        return i;
    };
    const isFunctionParameter = (functions, pos) => functions.some((f) => pos > f.beg && pos < f.paramListEnd);
    const nonBlockUniforms = /texture|sampler|image|subpassInput/;
    return (tokens, cache, shaderInfo, stage, functions) => {
        const res = [];
        const isVert = stage === 'vert';
        for (let i = 0; i < tokens.length; i++) {
            let t = tokens[i], str = t.data, dest, type;
            if (str === 'uniform') {
                (dest = shaderInfo.blocks), (type = 'blocks');
            }
            else if (str === 'in' && !isFunctionParameter(functions, t.position)) {
                if (stage === 'compute') {
                    // compute shader local_size definition, skipped
                    i = nextWord(tokens, i + 2);
                    continue;
                }
                dest = isVert ? shaderInfo.attributes : shaderInfo.varyings;
                type = isVert ? 'attributes' : 'varyings';
            }
            else if (str === 'out' && !isFunctionParameter(functions, t.position)) {
                dest = isVert ? shaderInfo.varyings : shaderInfo.fragColors;
                type = isVert ? 'varyings' : 'fragColors';
            }
            else if (str === 'buffer') {
                (dest = shaderInfo.buffers), (type = 'buffers');
            }
            else {
                continue;
            }
            const defines = getDefs(t.line, cache), param = {};
            // uniforms
            param.tags = cache[t.line - 1]; // pass pragma tags further
            let idx = nextWord(tokens, i + 2);
            if (tokens[idx].data !== '{') {
                Object.assign(param, extractInfo(tokens, i + 2));
                if (dest === shaderInfo.blocks) {
                    // samplerTextures
                    const uType = tokens[i + (param.precision ? 4 : 2)].data;
                    const uTypeCap = nonBlockUniforms.exec(uType);
                    if (!uTypeCap) {
                        error('EFX2201: vector uniforms must be declared in blocks.', t.line);
                    }
                    else if (uType === 'sampler') {
                        dest = shaderInfo.samplers;
                        type = 'samplers';
                    }
                    else if (uTypeCap[0] === 'sampler') {
                        dest = shaderInfo.samplerTextures;
                        type = 'samplerTextures';
                    }
                    else if (uTypeCap[0] === 'texture') {
                        dest = shaderInfo.textures;
                        type = 'textures';
                    }
                    else if (uTypeCap[0] === 'image') {
                        dest = shaderInfo.images;
                        type = 'images';
                    }
                    else if (uTypeCap[0] === 'subpassInput') {
                        dest = shaderInfo.subpassInputs;
                        type = 'subpassInputs';
                    }
                } // other attributes or varyings
                idx = nextSemicolon(tokens, idx);
            }
            else {
                // blocks
                param.name = tokens[i + 2].data;
                param.members = [];
                while (tokens[(idx = nextWord(tokens, idx))].data !== '}') {
                    if (dest !== shaderInfo.buffers) {
                        // don't need to parse SSBO members
                        const info = extractInfo(tokens, idx);
                        if (mappings.isSampler(info.type)) {
                            error('EFX2208: texture uniforms must be declared outside blocks.', tokens[idx].line);
                        }
                        param.members.push(info);
                    }
                    idx = nextSemicolon(tokens, idx);
                }
                // std140 specific checks
                param.members.reduce((acc, cur) => {
                    let baseAlignment = mappings.GetTypeSize(cur.type);
                    switch (cur.typename) {
                        case 'mat2':
                            baseAlignment /= 2;
                            break;
                        case 'mat3':
                            baseAlignment /= 3;
                            break;
                        case 'mat4':
                            baseAlignment /= 4;
                            break;
                    }
                    if (cur.count > 1 && baseAlignment < 16) {
                        const typeMsg = `uniform ${convertType(cur.type)} ${cur.name}[${cur.count}]`;
                        error('EFX2203: ' + typeMsg + ': array UBO members need to be 16-bytes-aligned to avoid implicit padding');
                        baseAlignment = 16;
                    }
                    else if (baseAlignment === 12) {
                        const typeMsg = `uniform ${convertType(cur.type)} ${cur.name}`;
                        error('EFX2204: ' + typeMsg + ': please use 1, 2 or 4-component vectors to avoid implicit padding');
                        baseAlignment = 16;
                    }
                    else if (mappings.isPaddedMatrix(cur.type)) {
                        const typeMsg = `uniform ${convertType(cur.type)} ${cur.name}`;
                        error('EFX2210: ' + typeMsg + ': use only 4x4 matrices to avoid implicit padding');
                    }
                    const alignedOffset = Math.ceil(acc / baseAlignment) * baseAlignment;
                    const implicitPadding = alignedOffset - acc;
                    if (implicitPadding) {
                        error(`EFX2205: UBO '${param.name}' introduces implicit padding: ` +
                            `${implicitPadding} bytes before '${cur.name}', consider re-ordering the members`);
                    }
                    return alignedOffset + baseAlignment * cur.count; // base offset for the next member
                }, 0); // top level UBOs have a base offset of zero
                // check for preprocessors inside blocks
                const pre = cache.lines.find((l) => l >= tokens[i].line && l < tokens[idx].line);
                if (pre) {
                    error(`EFX2206: ${param.name}: no preprocessors allowed inside uniform blocks!`, pre);
                }
                // check for struct members
                param.members.forEach((info) => {
                    if (typeof info.type === 'string') {
                        error(`EFX2211: '${info.type} ${info.name}' in block '${param.name}': ` +
                            'struct-typed member within UBOs is not supported due to compatibility reasons.', tokens[idx].line);
                    }
                });
                idx = nextWord(tokens, idx);
                if (tokens[idx].data !== ';') {
                    error('EFX2209: Block declarations must be semicolon-terminated，non-array-typed and instance-name-free. ' +
                        `Please check your '${param.name}' block declaration.`, tokens[idx].line);
                }
            }
            // check for duplicates
            const item = dest.find((i) => i.name === param.name);
            if (item) {
                if (param.members && JSON.stringify(item.members) !== JSON.stringify(param.members)) {
                    error(`EFX2207: different UBO using the same name '${param.name}'`, t.line);
                }
                item.stageFlags |= mapShaderStage(stage);
                param.duplicate = item;
            }
            let beg = i;
            if (dest === shaderInfo.buffers || dest === shaderInfo.images) {
                param.memoryAccess = mappings.getMemoryAccessFlag(tokens[i - 2].data);
                if (/writeonly|readonly/.test(tokens[i - 2].data)) {
                    beg = i - 2;
                }
            }
            res.push({ beg: tokens[beg].position, end: tokens[idx].position, param: param.duplicate || param, type });
            if (!param.duplicate) {
                param.defines = stripDuplicates(defines);
                param.stageFlags = mapShaderStage(stage);
                dest.push(param);
            }
            // now we are done with the whole expression
            i = idx;
        }
        return res;
    };
})();
const miscChecks = (() => {
    // mostly from glsl 100 spec, except:
    // 'texture' is reserved on android devices with relatively new GPUs
    // usage as an identifier will lead to runtime compilation failure:
    // https://github.com/pedroSG94/rtmp-rtsp-stream-client-java/issues/146
    const reservedKeywords = 'asm|class|union|enum|typedef|template|this|packed|goto|switch|default|inline|noinline|volatile|' +
        'public|static|extern|external|interface|flat|long|short|double|half|fixed|unsigned|superp|input|' +
        'output|hvec2|hvec3|hvec4|dvec2|dvec3|dvec4|fvec2|fvec3|fvec4|sampler1D|sampler3D|sampler1DShadow|' +
        'sampler2DShadow|sampler2DRect|sampler3DRect|sampler2DRectShadow|sizeof|cast|namespace|using|texture';
    const keywordRE = new RegExp(`\\b(?:${reservedKeywords})\\b`);
    const precisionRE = /precision\s+(low|medium|high)p\s+(\w+)/;
    return (code) => {
        // precision declaration check
        const cap = precisionRE.exec(code);
        if (cap) {
            if (/#extension/.test(code.slice(cap.index))) {
                warn('EFX2400: precision declaration should come after extensions');
            }
        }
        else {
            warn('EFX2401: precision declaration not found.');
        }
        const resCap = keywordRE.exec(code);
        if (resCap) {
            error(`EFX2402: using reserved keyword in glsl1: ${resCap[0]}`);
        }
        // the parser throws obscure errors when encounters some semantic errors,
        // so in some situation disabling this might be a better option
        if (options.skipParserTest) {
            return;
        }
        // AST based checks
        const tokens = tokenizer(code).filter((t) => t.type !== 'preprocessor');
        shaderTokens = tokens;
        try {
            parser(tokens);
        }
        catch (e) {
            error(`EFX2404: glsl1 parser failed: ${e}`, 0);
        }
    };
})();
// kurenai: skip headless WebGL finalTypeCheck (formerly used the native gl package).
// Shader errors surface in browser preview; dropping that native dep.
const finalTypeCheck = () => { };
const stripToSpecificVersion = (() => {
    const globalSearch = /#(if|elif|else|endif)(.*)?/g;
    const legalExpr = /^[\d<=>!|&^\s]*(__VERSION__)?[\d<=>!|&^\s]*$/; // all compile-time constant branches
    const macroWrap = (src, runtimeCond, defines) => {
        /* */
        return runtimeCond ? `#if ${runtimeCond}\n${src}#endif\n` : src;
        /* not now, maybe. the macro dependency extraction is still too fragile *
        const macros = defines.reduce((acc, cur) => `${acc} && ${cur}`, '').slice(4);
        return macros ? `#if ${macros}\n${src}#endif\n` : src;
        /* */
    };
    const declareExtension = (ext, level) => {
        if (level === 'require') {
            return `#extension ${ext}: require\n`;
        }
        return `\n#ifdef ${ext}\n#extension ${ext}: enable\n#endif\n`;
    };
    return (code, version, extensions, isVert) => {
        if (version < 310) {
            // keep std140 declaration, discard others
            code = code.replace(/layout\s*\((.*?)\)(\s*)(\w+)\s+(\w+)/g, (_, tokens, trailingSpaces, type, uType) => {
                if (!isVert && type === 'out') {
                    return _;
                } // keep Draw Buffer locations
                if (type !== 'out' && type !== 'in' && type !== 'uniform') {
                    return _;
                } // keep Storage Buffer bindings
                if (type === 'uniform' && uType.includes('image')) {
                    return _;
                } // keep Storage Image bindings
                const decl = tokens.indexOf('std140') >= 0 ? 'layout(std140)' + trailingSpaces + type : type;
                return `${decl} ${uType}`;
            });
        }
        // extraction
        const instances = [];
        let cap = null, temp = null;
        /* eslint-disable-next-line */
        while (true) {
            // eslint-disable-line
            cap = globalSearch.exec(code);
            if (!cap) {
                break;
            }
            if (cap[1] === 'if') {
                if (temp) {
                    temp.level++;
                    continue;
                }
                if (!legalExpr.test(cap[2])) {
                    continue;
                }
                temp = { start: cap.index, end: cap.index, conds: [cap[2]], content: [cap.index + cap[0].length], level: 1 };
            }
            else if (cap[1] === 'elif') {
                if (!temp || temp.level > 1) {
                    continue;
                }
                if (!legalExpr.test(cap[2])) {
                    error(`EFX2301: #elif conditions after a constant #if should be constant too; get '${cap[2]}'`);
                    cap[2] = '';
                }
                temp.conds.push(cap[2]);
                temp.content.push(cap.index, cap.index + cap[0].length);
            }
            else if (cap[1] === 'else') {
                if (!temp || temp.level > 1) {
                    continue;
                }
                temp.conds.push('true');
                temp.content.push(cap.index, cap.index + cap[0].length);
            }
            else if (cap[1] === 'endif') {
                if (!temp || --temp.level) {
                    continue;
                }
                temp.content.push(cap.index);
                temp.end = cap.index + cap[0].length;
                instances.push(temp);
                temp = null;
            }
        }
        let res = code;
        if (instances.length) {
            // replacement
            res = res.substring(0, instances[0].start);
            for (let j = 0; j < instances.length; j++) {
                const ins = instances[j];
                for (let i = 0; i < ins.conds.length; i++) {
                    if (eval(ins.conds[i].replace('__VERSION__', version))) {
                        const subBlock = code.substring(ins.content[i * 2], ins.content[i * 2 + 1]);
                        res += stripToSpecificVersion(subBlock, version, isVert);
                        break;
                    }
                }
                const next = (instances[j + 1] && instances[j + 1].start) || code.length;
                res += code.substring(ins.end, next);
            }
        }
        // extensions
        for (const ext in extensions) {
            const { defines, cond, level, runtimeCond } = extensions[ext];
            if (eval(cond.replace('__VERSION__', version))) {
                res = macroWrap(declareExtension(ext, level), runtimeCond, defines) + res;
            }
        }
        return res;
    };
})();
const glsl300to100 = (code, blocks, defines, paramInfo, functions, cache, vert) => {
    let res = '';
    // unpack UBOs
    let idx = 0;
    paramInfo.forEach((i) => {
        if (i.type !== 'blocks') {
            return;
        }
        res += code.slice(idx, i.beg);
        const indentCount = res.length - res.search(/\s*$/) + 1;
        blocks
            .find((u) => u.name === i.param.name)
            .members.forEach((m) => {
            // crucial optimization, for the uniform vectors in WebGL (iOS especially) is extremely limited
            const matches = code.match(new RegExp(`\\b${m.name}\\b`, 'g'));
            if (!matches || matches.length <= 1) {
                return;
            }
            const type = convertType(m.type);
            const precision = m.precision || '';
            const arraySpec = typeof m.count === 'string' || m.isArray ? `[${m.count}]` : '';
            res += ' '.repeat(indentCount) + `uniform ${precision}${type} ${m.name}${arraySpec};\n`;
        });
        idx = i.end + (code[i.end] === ';');
    });
    res += code.slice(idx);
    // texture functions
    res = res.replace(/\btexture((?!2D|Cube)\w*)\s*\(\s*(\w+)\s*([,[])/g, (original, suffix, name, endToken, idx) => {
        // skip replacement if function already defined
        const fnName = 'texture' + suffix;
        if (functions.find((f) => f.name === fnName)) {
            return original;
        }
        // find in parent scope first
        let re = new RegExp('sampler(\\w+)\\s+' + name);
        const scope = functions.find((f) => idx > f.beg && idx < f.end);
        let cap = (scope && re.exec(res.substring(scope.beg, scope.eng))) || re.exec(res);
        if (!cap) {
            // perhaps defined in macro
            const def = defines.find((d) => d.name === name);
            if (def && def.options) {
                for (const n of def.options) {
                    re = new RegExp('sampler(\\w+)\\s+' + n);
                    cap = re.exec(res);
                    if (cap) {
                        break;
                    }
                }
            }
            if (!cap) {
                error(`EFX2300: sampler '${name}' does not exist`);
                return original;
            }
        }
        const texFnType = textureFuncRemap.get(cap[1]) ?? cap[1];
        return `texture${texFnType}${suffix}(${name}${endToken}`;
    });
    if (vert) {
        // in/out => attribute/varying
        res = res.replace(inDecl, (str, qualifiers, decl) => `attribute ${decl};`);
        res = res.replace(outDecl, (str, qualifiers, decl) => `varying ${decl};`);
    }
    else {
        // in/out => varying/gl_FragColor
        res = res.replace(inDecl, (str, qualifiers, decl) => `varying ${decl};`);
        const outList = [];
        res = res.replace(outDecl, (str, qualifiers, decl, name) => {
            const locationCap = qualifiers && locationRE.exec(qualifiers);
            if (!locationCap) {
                error('EFX2302: fragment output location must be specified');
            }
            outList.push({ name, location: locationCap[1] });
            return '';
        });
        if (outList.length === 1) {
            const outRE = new RegExp(`\\b${outList[0].name}\\b`, 'g');
            res = res.replace(outRE, 'gl_FragColor');
        }
        else if (outList.length > 1) {
            // EXT_draw_buffers
            for (const out of outList) {
                const outRE = new RegExp(`\\b${out.name}\\b`, 'g');
                res = res.replace(outRE, `gl_FragData[${out.location}]`);
            }
            if (!cache.extensions['GL_EXT_draw_buffers']) {
                cache.extensions['GL_EXT_draw_buffers'] = {
                    defines: [],
                    cond: '__VERSION__ <= 100',
                    // we can't reliably deduce the macro dependecies for this extension
                    // so not making this a hard require here
                    level: 'enable',
                };
            }
        }
    }
    res = res.replace(/layout\s*\(.*?\)\s*/g, () => ''); // layout qualifiers
    return res.replace(pragmasToStrip, ''); // strip pragmas here for a cleaner webgl compiler output
};
const decorateBlockMemoryLayouts = (code, paramInfo) => {
    let idx = 0;
    const positions = [];
    paramInfo.forEach((info, paramIdx) => {
        if (info.type !== 'blocks' && info.type !== 'buffers') {
            return;
        }
        const isSSBO = info.type === 'buffers';
        const frag = code.slice(idx, info.beg);
        const cap = layoutExtract.exec(frag);
        positions[paramIdx] = cap ? idx + cap.index + (isSSBO ? 0 : cap[0].length - cap[2].length - 1) : -1;
        idx = info.end;
    });
    let res = '';
    idx = 0;
    paramInfo.forEach((info, paramIdx) => {
        const position = positions[paramIdx];
        if (position === undefined) {
            return;
        }
        // insert declarations
        if (info.type === 'blocks') {
            // UBO-specific
            if (position < 0) {
                // no qualifier, just insert everything
                res += code.slice(idx, info.beg);
                res += 'layout(std140) ';
            }
            else {
                // append the token
                res += code.slice(idx, position);
                res += ', std140';
                res += code.slice(position, info.beg);
            }
        }
        else if (info.type === 'buffers') {
            // SSBO-specific
            let declaration = 'std430'; // std430 are preferred for SSBOs
            if (info.param.tags && info.param.tags.glBinding !== undefined) {
                declaration += `, binding = ${info.param.tags.glBinding}`;
            }
            // ignore input specifiers
            res += code.slice(idx, position < 0 ? info.beg : position);
            res += `layout(${declaration}) `;
        }
        res += code.slice(info.beg, info.end);
        idx = info.end;
    });
    res += code.slice(idx);
    return res;
};
const decorateBindings = (code, manifest, paramInfo) => {
    paramInfo = paramInfo.filter((i) => !builtinRE.test(i.param.name));
    let idx = 0;
    const record = [];
    const overrides = {};
    // extract existing binding infos
    paramInfo.forEach((info, paramIdx) => {
        // overlapping locations/bindings under different macros are not supported yet
        if (info.type === 'fragColors') {
            return;
        }
        const name = info.param.name;
        if (!manifest[info.type]) {
            return;
        }
        const frag = code.slice(idx, info.beg);
        const layoutInfo = { prop: info.param };
        const cap = layoutExtract.exec(frag);
        const category = overrides[info.type] || (overrides[info.type] = {});
        if (cap) {
            // position of ')'
            layoutInfo.position = idx + cap.index + cap[0].length - cap[2].length - 1;
            const bindingCap = bindingExtract.exec(cap[1]);
            if (bindingCap) {
                if (cap[1].search(/\bset\s*=/) < 0) {
                    layoutInfo.position = cap[1].length - layoutInfo.position;
                } // should insert set declaration
                else {
                    layoutInfo.position = -1;
                } // indicating no-op
                const value = parseInt(bindingCap[1]);
                // adapt bindings
                const dest = info.type === 'varyings' || info.type === 'attributes' ? 'location' : 'binding';
                let validSubstitution = manifest[info.type].find((v) => v[dest] === value);
                if (!validSubstitution && info.type === 'subpassInputs') {
                    // input attachments need fallback bindings, skip this check
                    validSubstitution = true;
                }
                if (validSubstitution) {
                    // auto-generated binding is guaranteed to be consecutive
                    if (category[value] && category[value] !== name) {
                        error(`EFX2600: duplicated binding/location declaration for '${category[value]}' and '${name}'`);
                    }
                    category[(category[value] = name)] = value;
                }
                else if (info.type === 'blocks') {
                    error(`EFX2601: illegal custom binding for '${name}', block bindings should be consecutive and start from 0`);
                }
                else if (info.type === 'samplerTextures') {
                    error(`EFX2602: illegal custom binding for '${name}', texture bindings should be consecutive and after all the blocks`);
                }
                else if (info.type === 'buffers') {
                    error(`EFX2603: illegal custom binding for '${name}', buffer bindings should be consecutive and after all the ` +
                        'blocks/samplerTextures');
                }
                else if (info.type === 'images') {
                    error(`EFX2604: illegal custom binding for '${name}', image bindings should be consecutive and after all the ` +
                        'blocks/samplerTextures/buffers');
                }
                else if (info.type === 'textures') {
                    error(`EFX2605: illegal custom binding for '${name}', texture bindings should be consecutive and after all the ` +
                        'blocks/samplerTextures/buffers/images');
                }
                else if (info.type === 'samplers') {
                    error(`EFX2606: illegal custom binding for '${name}', sampler bindings should be consecutive and after all the ` +
                        'blocks/samplerTextures/buffers/images/textures');
                }
                else {
                    // attributes or varyings
                    error(`EFX2607: illegal custom location for '${name}', locations should be consecutive and start from 0`);
                }
            }
        }
        record[paramIdx] = layoutInfo;
        idx = info.end;
    });
    // override bindings/locations
    paramInfo.forEach((info, paramIdx) => {
        if (!overrides[info.type]) {
            return;
        }
        const needLocation = info.type === 'attributes' || info.type === 'varyings' || info.type === 'fragColors';
        const dest = needLocation ? 'location' : 'binding';
        const category = overrides[info.type];
        const name = info.param.name;
        if (info.type === 'attributes') {
            // some rationale behind these oddities:
            // 1. paramInfo member is guaranteed to be in consistent order with manifest members
            // 2. we want the output number to be as consistent as possible with their declaration order.
            //    e.g. gfx.InputState utilizes declaration order to calculate buffer offsets, etc.
            if (name in category) {
                record[paramIdx].prop[dest] = category[name];
            }
            else {
                let n = 0;
                while (category[n]) {
                    n++;
                }
                record[paramIdx].prop[dest] = n;
                category[n] = name;
            }
        }
        else {
            if (name in category) {
                const oldLocation = record[paramIdx].prop[dest];
                const substitute = manifest[info.type].find((v) => v[dest] === category[name]);
                if (substitute) {
                    substitute[dest] = oldLocation;
                }
                record[paramIdx].prop[dest] = category[name];
            }
        }
    });
    // insert declarations
    let res = '';
    idx = 0;
    const setIndex = mappings.SetIndex.MATERIAL;
    paramInfo.forEach((info, paramIdx) => {
        if (!record[paramIdx]) {
            return;
        }
        const needLocation = info.type === 'attributes' || info.type === 'varyings' || info.type === 'fragColors';
        const dest = needLocation ? 'location' : 'binding';
        const { position, prop } = record[paramIdx];
        const setDeclaration = needLocation ? '' : `set = ${setIndex}, `;
        // insert declaration
        if (position === undefined) {
            // no qualifier, just insert everything
            res += code.slice(idx, info.beg);
            res += `layout(${setDeclaration + dest} = ${prop[dest]}) `;
        }
        else if (position >= 0) {
            // qualifier exists, but no binding specified
            res += code.slice(idx, position);
            res += `, ${setDeclaration + dest} = ${prop[dest]}`;
            res += code.slice(position, info.beg);
        }
        else if (position < -1) {
            // binding exists, but no set specified
            res += code.slice(idx, -position);
            res += setDeclaration;
            res += code.slice(-position, info.beg);
        }
        else {
            // no-op, binding is already specified
            res += code.slice(idx, info.beg);
        }
        res += code.slice(info.beg, info.end);
        idx = info.end;
    });
    res += code.slice(idx);
    // remove subpass fallback declarations
    manifest.samplerTextures = manifest.samplerTextures.filter((t) => manifest.subpassInputs.findIndex((s) => s.binding === t.binding) < 0);
    return res;
};
const remapDefine = (obj, substituteMap) => {
    for (let i = 0; i < obj.defines.length; ++i) {
        let subVal = substituteMap.get(obj.defines[i]);
        while (subVal) {
            obj.defines[i] = subVal;
            subVal = substituteMap.get(subVal);
        }
    }
};
const shaderFactory = (() => {
    const trailingSpaces = /\s+$/gm;
    const newlines = /(^\s*\n){2,}/gm;
    const clean = (code) => {
        let result = code.replace(pragmasToStrip, ''); // strip our pragmas
        result = result.replace(newlines, '\n'); // squash multiple newlines
        result = result.replace(trailingSpaces, '');
        return result;
    };
    const objectMap = (obj, fn) => Object.keys(obj).reduce((acc, cur) => ((acc[cur] = fn(cur)), acc), {});
    const filterFactory = (target, builtins) => (u) => {
        if (!builtinRE.test(u.name)) {
            return true;
        }
        const tags = u.tags;
        let type;
        if (!tags || !tags.builtin) {
            type = 'global';
        }
        else {
            type = tags.builtin;
        }
        builtins[`${type}s`][target].push({ name: u.name, defines: u.defines });
        return false;
    };
    const classifyDescriptor = (descriptors, shaderInfo, member) => {
        const instance = 0;
        const batch = 1;
        // const phase = 2;
        const pass = 3;
        const sources = shaderInfo[member];
        for (let i = 0; i !== sources.length; ++i) {
            const info = sources[i];
            if (info.rate !== undefined) {
                descriptors[info.rate][member].push(info);
                continue;
            }
            if (!builtinRE.test(info.name)) {
                descriptors[batch][member].push(info);
                continue;
            }
            const tags = info.tags;
            if (!info.tags || !info.tags.builtin) {
                descriptors[pass][member].push(info);
            }
            else {
                if (tags.builtin === 'global') {
                    descriptors[pass][member].push(info);
                }
                else if (tags.builtin === 'local') {
                    descriptors[instance][member].push(info);
                }
            }
        }
    };
    const classifyDescriptors = (descriptors, shaderInfo) => {
        classifyDescriptor(descriptors, shaderInfo, 'blocks');
        classifyDescriptor(descriptors, shaderInfo, 'samplerTextures');
        classifyDescriptor(descriptors, shaderInfo, 'samplers');
        classifyDescriptor(descriptors, shaderInfo, 'textures');
        classifyDescriptor(descriptors, shaderInfo, 'buffers');
        classifyDescriptor(descriptors, shaderInfo, 'images');
        classifyDescriptor(descriptors, shaderInfo, 'subpassInputs');
    };
    const wrapEntry = (() => {
        const wrapperFactory = (stage, fn) => {
            switch (stage) {
                case 'vert':
                    return `\nvoid main() { gl_Position = ${fn}(); }\n`;
                case 'frag':
                    return `\nlayout(location = 0) out vec4 cc_FragColor;\nvoid main() { cc_FragColor = ${fn}(); }\n`;
                default:
                    return `\nvoid main() { ${fn}(); }\n`;
            }
        };
        return (content, entry, stage) => (entry === 'main' ? content : content + wrapperFactory(stage, entry));
    })();
    const entryRE = /([^:]+)(?::(\w+))?/;
    const preprocess = (name, chunks, deprecations, stage, defaultEntry = 'main') => {
        const entryCap = entryRE.exec(name);
        const entry = entryCap[2] || defaultEntry;
        const record = new Set();
        const functions = [];
        let code = unwindIncludes(`#include <${entryCap[1]}>`, chunks, deprecations, record);
        code = wrapEntry(code, entry, stage);
        code = expandSubpassInout(code);
        code = expandLiteralMacro(code);
        code = expandFunctionalMacro(code);
        code = eliminateDeadCode(code, entry, functions); // this has to be the last process, or the `functions` output won't match
        return { code, record, functions };
    };
    const rateMapping = {
        instance: 0,
        batch: 1,
        phase: 2,
        pass: 3,
    };
    const assignRate = (entry, rates) => {
        entry.forEach((i) => {
            const rate = rates.find((r) => r.name === i.name);
            if (rate) {
                i.rate = rateMapping[rate.rate];
            }
        });
    };
    const assignSampleType = (entry, sampleTypes) => {
        entry.forEach((i) => {
            const sampleTypeInfo = sampleTypes.find((s) => s.name === i.name);
            if (sampleTypeInfo) {
                i.sampleType = sampleTypeInfo.sampleType;
            }
            else {
                i.sampleType = 0; // SampleType.FLOAT;
            }
        });
    };
    const tokenizerOpt = { version: '300 es' };
    const createShaderInfo = () => ({
        blocks: [],
        samplerTextures: [],
        samplers: [],
        textures: [],
        buffers: [],
        images: [],
        subpassInputs: [],
        attributes: [],
        varyings: [],
        fragColors: [],
        descriptors: [],
    });
    const compile = (name, stage, outDefines = [], shaderInfo = createShaderInfo(), chunks = globalChunks, deprecations = globalDeprecations) => {
        const out = {};
        shaderName = name;
        const cache = { lines: [], extensions: {} };
        const { code, record, functions } = preprocess(name, chunks, deprecations, stage);
        const tokens = (shaderTokens = tokenizer(code, tokenizerOpt));
        // [0]: existingDefines; [1]: substituteMap
        const res = extractMacroDefinitions(code);
        cache.existingDefines = res[0];
        const substituteMap = res[1];
        extractDefines(tokens, outDefines, cache);
        const rates = extractUpdateRates(tokens);
        const sampleTypes = extractUnfilterableFloat(tokens);
        const blockInfo = extractParams(tokens, cache, shaderInfo, stage, functions);
        shaderInfo.samplerTextures = shaderInfo.samplerTextures.filter((ele) => !shaderInfo.subpassInputs.find((obj) => obj.name === ele.name));
        out.blockInfo = blockInfo; // pass forward
        out.record = record; // header dependencies
        out.extensions = cache.extensions; // extensions requests
        out.glsl4 = code;
        shaderInfo.attributes.forEach((attr) => {
            remapDefine(attr, substituteMap);
        });
        shaderInfo.blocks.forEach((block) => {
            remapDefine(block, substituteMap);
        });
        shaderInfo.buffers.forEach((buffer) => {
            remapDefine(buffer, substituteMap);
        });
        shaderInfo.images.forEach((image) => {
            remapDefine(image, substituteMap);
        });
        shaderInfo.samplerTextures.forEach((samplerTexture) => {
            remapDefine(samplerTexture, substituteMap);
        });
        shaderInfo.samplers.forEach((sampler) => {
            remapDefine(sampler, substituteMap);
        });
        shaderInfo.textures.forEach((texture) => {
            remapDefine(texture, substituteMap);
        });
        assignRate(shaderInfo.blocks, rates);
        assignRate(shaderInfo.buffers, rates);
        assignRate(shaderInfo.images, rates);
        assignRate(shaderInfo.samplerTextures, rates);
        assignRate(shaderInfo.samplers, rates);
        assignRate(shaderInfo.textures, rates);
        assignRate(shaderInfo.subpassInputs, rates);
        assignSampleType(shaderInfo.samplerTextures, sampleTypes);
        assignSampleType(shaderInfo.textures, sampleTypes);
        const isVert = stage == 'vert';
        out.glsl3 = stripToSpecificVersion(decorateBlockMemoryLayouts(code, blockInfo), 300, cache.extensions, isVert); // GLES3 needs explicit memory layout qualifier
        if (stage == 'vert' || stage == 'frag') {
            // glsl1 only supports vert and frag
            out.glsl1 = stripToSpecificVersion(glsl300to100(code, shaderInfo.blocks, outDefines, blockInfo, functions, cache, isVert), 100, cache.extensions, isVert);
            miscChecks(out.glsl1); // TODO : add higher version checks
        }
        else {
            out.glsl1 = '';
        }
        return out;
    };
    const createBuiltinInfo = () => ({ blocks: [], samplerTextures: [], buffers: [], images: [] });
    const build = (stageNames, type, chunks = globalChunks, deprecations = globalDeprecations) => {
        let defines = [];
        const shaderInfo = createShaderInfo();
        const src = { vert: '', frag: '' };
        for (const stage in stageNames) {
            src[stage] = compile(stageNames[stage], stage, defines, shaderInfo, chunks, deprecations);
        }
        if (type === 'graphics') {
            finalTypeCheck(src.vert.glsl1, src.frag.glsl1, defines, stageNames['vert'], stageNames['frag']);
        }
        const builtins = { globals: createBuiltinInfo(), locals: createBuiltinInfo(), statistics: {} };
        // strip runtime constants & generate statistics
        defines = defines.filter((d) => d.type !== 'constant');
        let vsUniformVectors = 0, fsUniformVectors = 0, csUniformVectors = 0;
        shaderInfo.blocks.forEach((b) => {
            const vectors = b.members.reduce((acc, cur) => {
                if (typeof cur.count !== 'number') {
                    return acc;
                }
                return acc + Math.ceil(mappings.GetTypeSize(cur.type) / 16) * cur.count;
            }, 0);
            if (b.stageFlags & VSBit) {
                vsUniformVectors += vectors;
            }
            if (b.stageFlags & FSBit) {
                fsUniformVectors += vectors;
            }
            if (b.stageFlags & CSBit) {
                csUniformVectors += vectors;
            }
        }, 0);
        if (type === 'graphics') {
            builtins.statistics.CC_EFFECT_USED_VERTEX_UNIFORM_VECTORS = vsUniformVectors;
            builtins.statistics.CC_EFFECT_USED_FRAGMENT_UNIFORM_VECTORS = fsUniformVectors;
        }
        if (type === 'compute') {
            builtins.statistics.CC_EFFECT_USED_COMPUTE_UNIFORM_VECTORS = csUniformVectors;
        }
        // filter out pipeline builtin params
        shaderInfo.descriptors[0] = {
            rate: 0,
            blocks: [],
            samplerTextures: [],
            samplers: [],
            textures: [],
            buffers: [],
            images: [],
            subpassInputs: [],
        };
        shaderInfo.descriptors[1] = {
            rate: 1,
            blocks: [],
            samplerTextures: [],
            samplers: [],
            textures: [],
            buffers: [],
            images: [],
            subpassInputs: [],
        };
        shaderInfo.descriptors[2] = {
            rate: 2,
            blocks: [],
            samplerTextures: [],
            samplers: [],
            textures: [],
            buffers: [],
            images: [],
            subpassInputs: [],
        };
        shaderInfo.descriptors[3] = {
            rate: 3,
            blocks: [],
            samplerTextures: [],
            samplers: [],
            textures: [],
            buffers: [],
            images: [],
            subpassInputs: [],
        };
        classifyDescriptors(shaderInfo.descriptors, shaderInfo);
        // convert count from string to 0, avoiding jsb crash
        for (let k = 0; k !== 4; ++k) {
            const set = shaderInfo.descriptors[k];
            set.blocks.forEach((b) => {
                for (const m of b.members) {
                    if (typeof m.count !== 'number') {
                        m.count = 0;
                    }
                }
            });
        }
        // filter descriptors
        shaderInfo.blocks = shaderInfo.blocks.filter(filterFactory('blocks', builtins));
        shaderInfo.samplerTextures = shaderInfo.samplerTextures.filter(filterFactory('samplerTextures', builtins));
        shaderInfo.buffers = shaderInfo.buffers.filter(filterFactory('buffers', builtins));
        shaderInfo.images = shaderInfo.images.filter(filterFactory('images', builtins));
        // attribute property process
        shaderInfo.attributes.forEach((a) => {
            a.format = mappings.formatMap[a.typename];
            if (a.defines.indexOf('USE_INSTANCING') >= 0) {
                a.isInstanced = true;
            }
            if (a.tags && a.tags.format) {
                // custom format
                const f = mappings.getFormat(a.tags.format);
                if (f !== undefined) {
                    a.format = f;
                }
                if (mappings.isNormalized(f)) {
                    a.isNormalized = true;
                }
            }
        });
        // strip the intermediate informations
        shaderInfo.attributes.forEach((v) => (delete v.tags, delete v.typename, delete v.precision, delete v.isArray, delete v.type, delete v.count, delete v.stageFlags));
        shaderInfo.varyings.forEach((v) => (delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        shaderInfo.blocks.forEach((b) => (delete b.rate, delete b.tags, b.members.forEach((v) => (delete v.typename, delete v.precision, delete v.isArray))));
        shaderInfo.samplerTextures.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        shaderInfo.buffers.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray, delete v.members));
        shaderInfo.images.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        shaderInfo.textures.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        shaderInfo.samplers.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        shaderInfo.subpassInputs.forEach((v) => (delete v.rate, delete v.tags, delete v.typename, delete v.precision, delete v.isArray));
        // assign bindings
        let bindingIdx = 0;
        shaderInfo.blocks.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.samplerTextures.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.samplers.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.textures.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.buffers.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.images.forEach((u) => (u.binding = bindingIdx++));
        shaderInfo.subpassInputs.forEach((u) => (u.binding = bindingIdx++));
        let locationIdx = 0;
        shaderInfo.attributes.forEach((a) => (a.location = locationIdx++));
        locationIdx = 0;
        shaderInfo.varyings.forEach((u) => (u.location = locationIdx++));
        locationIdx = 0;
        shaderInfo.fragColors.forEach((u) => (u.location = locationIdx++));
        // filter defines for json
        shaderInfo.blocks.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.samplerTextures.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.samplers.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.textures.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.buffers.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.images.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.subpassInputs.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.attributes.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.varyings.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        shaderInfo.fragColors.forEach((u) => (u.defines = u.defines.filter((d) => defines.find((def) => d.endsWith(def.name)))));
        // generate binding layout for glsl4
        const glsl1 = {}, glsl3 = {}, glsl4 = {};
        const record = new Set();
        for (const stage in stageNames) {
            // generate binding layout for glsl4
            const isVert = stage === 'vert';
            src[stage].glsl4 = stripToSpecificVersion(decorateBindings(src[stage].glsl4, shaderInfo, src[stage].blockInfo), 460, src[stage].extensions, isVert);
            glsl4[stage] = clean(src[stage].glsl4); // for SPIR-V-based cross-compilation
            glsl3[stage] = clean(src[stage].glsl3); // for WebGL2/GLES3
            glsl1[stage] = clean(src[stage].glsl1); // for WebGL/GLES2
            src[stage].record.forEach((v) => record.add(v));
        }
        let hash = 0;
        if (type === 'graphics') {
            if (glsl4.compute || glsl3.compute) {
                error('compute shader is not supported in graphics effect');
            }
            hash = mappings.murmurhash2_32_gc(glsl4.vert + glsl4.frag + glsl3.vert + glsl3.frag + glsl1.vert + glsl1.frag, 666);
        }
        else {
            if (glsl4.vert || glsl4.frag || glsl3.vert || glsl3.frag || glsl1.vert || glsl1.frag) {
                error('vertex/fragment shader is not supported in compute effect');
            }
            hash = mappings.murmurhash2_32_gc(glsl4.vert + glsl4.frag + glsl4.compute + glsl3.vert + glsl3.frag + glsl3.compute + glsl1.vert + glsl1.frag, 666);
        }
        const passGroup = shaderInfo.descriptors[3];
        shaderInfo.blocks = shaderInfo.blocks.filter((v) => passGroup.blocks.every((t) => t.name !== v.name));
        shaderInfo.samplerTextures = shaderInfo.samplerTextures.filter((v) => passGroup.samplerTextures.every((t) => t.name !== v.name));
        shaderInfo.samplers = shaderInfo.samplers.filter((v) => passGroup.samplers.every((t) => t.name !== v.name));
        shaderInfo.textures = shaderInfo.textures.filter((v) => passGroup.textures.every((t) => t.name !== v.name));
        shaderInfo.buffers = shaderInfo.buffers.filter((v) => passGroup.buffers.every((t) => t.name !== v.name));
        shaderInfo.images = shaderInfo.images.filter((v) => passGroup.images.every((t) => t.name !== v.name));
        return Object.assign(shaderInfo, { hash, glsl4, glsl3, glsl1, builtins, defines, record });
    };
    return { compile, build };
})();
const compileShader = shaderFactory.compile;
// ==================
// effects
// ==================
const parseEffect = (() => {
    const effectRE = /CCEffect\s*%{([^]+?)(?:}%|%})/;
    const programRE = /CCProgram\s*([\w-]+)\s*%{([^]*?)(?:}%|%})/;
    const hashComments = /#.*$/gm;
    const whitespaces = /^\s*$/;
    const noIndent = /\n[^\s]/;
    const leadingSpace = /^[^\S\n]/gm; // \s without \n
    const tabs = /\t/g;
    const stripHashComments = (code) => code.replace(hashComments, '');
    const structuralTypeCheck = (ref, cur, path = 'effect') => {
        if (Array.isArray(ref)) {
            if (!Array.isArray(cur)) {
                error(`EFX1002: ${path} must be an array`);
                return;
            }
            if (ref[0]) {
                for (let i = 0; i < cur.length; i++) {
                    structuralTypeCheck(ref[0], cur[i], path + `[${i}]`);
                }
            }
        }
        else {
            if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
                error(`EFX1003: ${path} must be an object`);
                return;
            }
            for (const key of Object.keys(cur)) {
                if (key.indexOf(':') !== -1) {
                    error(`EFX1004: syntax error at '${key}', you might need to insert a space after colon`);
                }
            }
            if (ref.any) {
                for (const key of Object.keys(cur)) {
                    structuralTypeCheck(ref.any, cur[key], path + `.${key}`);
                }
            }
            else {
                for (const key of Object.keys(ref)) {
                    let testKey = key;
                    if (testKey[0] === '$') {
                        testKey = testKey.substring(1);
                    }
                    else if (!cur[testKey]) {
                        continue;
                    }
                    structuralTypeCheck(ref[key], cur[testKey], path + `.${testKey}`);
                }
            }
        }
    };
    return (name, content) => {
        shaderName = 'syntax';
        content = content.replace(tabs, ' '.repeat(tabAsSpaces));
        // process each block
        let effect = {}, templates = {}, localDeprecations = {};
        const effectCap = effectRE.exec(stripHashComments(content));
        if (!effectCap) {
            error('EFX1000: CCEffect is not defined');
        }
        else {
            try {
                const src = yaml.load(effectCap[1]);
                // deep clone to decouple references
                effect = JSON.parse(JSON.stringify(src));
            }
            catch (e) {
                error(`EFX1001: CCEffect parser failed: ${e}`);
            }
            if (!effect.name) {
                effect.name = name;
            }
            structuralTypeCheck(mappings.effectStructure, effect);
        }
        content = stripComments(content);
        let programCap = programRE.exec(content);
        while (programCap) {
            let result = programCap[2];
            if (!whitespaces.test(result)) {
                // skip this for empty blocks
                while (!noIndent.test(result)) {
                    result = result.replace(leadingSpace, '');
                }
            }
            addChunk(programCap[1], result, templates, localDeprecations);
            content = content.substring(programCap.index + programCap[0].length);
            programCap = programRE.exec(content);
        }
        return { effect, templates, localDeprecations };
    };
})();
const mapPassParam = (() => {
    const findUniformType = (name, shader) => {
        let res = 0, cb = (u) => {
            if (u.name !== name) {
                return false;
            }
            res = u.type;
            return true;
        };
        if (!shader.blocks.some((b) => b.members.some(cb))) {
            shader.samplerTextures.some(cb);
        }
        return res;
    };
    const propTypeCheck = (value, type, givenType) => {
        if (type <= 0) {
            return 'no matching uniform';
        }
        if (value === undefined) {
            return '';
        } // default value
        if (givenType === 'string') {
            if (!mappings.isSampler(type)) {
                return 'string for vectors';
            }
        }
        else if (!Array.isArray(value)) {
            return 'non-array for buffer members';
        }
        else if (value.length !== mappings.GetTypeSize(type) / 4) {
            return 'wrong array length';
        }
        return '';
    };
    const targetRE = /^(\w+)(?:\.([xyzw]+|[rgba]+))?$/;
    const channelMap = { x: 0, y: 1, z: 2, w: 3, r: 0, g: 1, b: 2, a: 3 };
    const mapTarget = (target, shader) => {
        const handleInfo = [target, 0, 0];
        const cap = targetRE.exec(target);
        if (!cap) {
            error(`EFX3303: illegal property target '${target}'`);
            return handleInfo;
        }
        const swizzle = (cap[2] && cap[2].toLowerCase()) || '';
        const beginning = channelMap[swizzle[0]] || 0;
        if (swizzle
            .split('')
            .map((c, idx) => channelMap[c] - beginning - idx)
            .some((n) => n)) {
            error(`EFX3304: '${target}': random component swizzle is not supported`);
        }
        handleInfo[0] = cap[1];
        handleInfo[1] = beginning;
        handleInfo[2] = findUniformType(cap[1], shader);
        if (swizzle.length) {
            handleInfo[2] -= Math.max(0, mappings.GetTypeSize(handleInfo[2]) / 4 - swizzle.length);
        }
        if (handleInfo[2] <= 0) {
            error(`EFX3305: no matching uniform target '${target}'`);
        }
        return handleInfo;
    };
    const mapProperties = (props, shader) => {
        let metadata = {};
        for (const p of Object.keys(props)) {
            if (p === '__metadata__') {
                metadata = props[p];
                delete props[p];
                continue;
            }
            const info = props[p], shaderType = findUniformType(p, shader);
            // type translation or extraction
            if (info.type !== undefined) {
                warn(`EFX3300: property '${p}': you don't have to specify type in here`);
            }
            info.type = shaderType;
            // target specification
            if (info.target) {
                info.handleInfo = mapTarget(info.target, shader);
                delete info.target;
                info.type = info.handleInfo[2];
                // polyfill source property
                const deprecated = info.editor && info.editor.visible;
                const target = info.handleInfo[0], targetType = findUniformType(info.handleInfo[0], shader);
                if (!props[target]) {
                    props[target] = { type: targetType, editor: { visible: false } };
                }
                if (deprecated === undefined || deprecated) {
                    if (!props[target].editor) {
                        props[target].editor = { deprecated: true };
                    }
                    else if (props[target].editor.deprecated === undefined) {
                        props[target].editor.deprecated = true;
                    }
                }
                if (mappings.isSampler(targetType)) {
                    if (info.value) {
                        props[target].value = info.value;
                    }
                }
                else {
                    if (!props[target].value) {
                        props[target].value = Array(mappings.GetTypeSize(targetType) / 4).fill(0);
                    }
                    if (Array.isArray(info.value)) {
                        props[target].value.splice(info.handleInfo[1], info.value.length, ...info.value);
                    }
                    else if (info.value !== undefined) {
                        props[target].value.splice(info.handleInfo[1], 1, info.value);
                    }
                }
            }
            // sampler specification
            if (info.sampler) {
                info.samplerHash = mapSampler(generalMap(info.sampler));
                delete info.sampler;
            }
            // default values
            const givenType = typeof info.value;
            // convert numbers to array
            if (givenType === 'number' || givenType === 'boolean') {
                info.value = [info.value];
            }
            // type check the given value
            const msg = propTypeCheck(info.value, info.type, givenType);
            if (msg) {
                error(`EFX3302: illegal property declaration for '${p}': ${msg}`);
            }
        }
        for (const p of Object.keys(props)) {
            patchMetadata(props[p], metadata);
        }
        return props;
    };
    const patchMetadata = (target, metadata) => {
        for (const k of Object.keys(metadata)) {
            const v = metadata[k];
            if (typeof v === 'object' && typeof target[k] === 'object') {
                patchMetadata(target[k], v);
            }
            else if (target[k] === undefined) {
                target[k] = v;
            }
        }
    };
    const generalMap = (obj) => {
        for (const key in obj) {
            const prop = obj[key];
            if (typeof prop === 'string') {
                // string literal
                let num = parseInt(prop);
                if (isNaN(num)) {
                    num = mappings.passParams[prop.toUpperCase()];
                }
                if (num !== undefined) {
                    obj[key] = num;
                }
            }
            else if (Array.isArray(prop)) {
                // arrays:
                if (!prop.length) {
                    continue;
                } // empty
                switch (typeof prop[0]) {
                    case 'object':
                        prop.forEach(generalMap);
                        break; // nested props
                    case 'string':
                        generalMap(prop);
                        break; // string array
                    case 'number':
                        obj[key] = // color array
                            (((prop[0] * 255) << 24) | ((prop[1] * 255) << 16) | ((prop[2] * 255) << 8) | ((prop[3] || 255) * 255)) >>> 0;
                }
            }
            else if (typeof prop === 'object') {
                generalMap(prop); // nested props
            }
        }
        return obj;
    };
    const samplerInfo = new mappings.SamplerInfo();
    const mapSampler = (obj) => {
        for (const key of Object.keys(obj)) {
            if (samplerInfo[key] === undefined) {
                warn(`EFX3301: illegal sampler info '${key}'`);
            }
        }
        return mappings.Sampler.computeHash(obj);
    };
    const priorityRE = /^([a-zA-Z]+)?\s*([+-])?\s*([\dxabcdef]+)?$/i;
    const dfault = mappings.RenderPriority.DEFAULT;
    const min = mappings.RenderPriority.MIN;
    const max = mappings.RenderPriority.MAX;
    const mapPriority = (str) => {
        let res = 0;
        const cap = priorityRE.exec(str);
        if (cap[1]) {
            res = mappings.RenderPriority[cap[1].toUpperCase()];
        }
        if (cap[3]) {
            res += parseInt(cap[3]) * (cap[2] === '-' ? -1 : 1);
        }
        if (isNaN(res) || res < min || res > max) {
            warn(`EFX3000: illegal pass priority: ${str}`);
            return dfault;
        }
        return res;
    };
    const mapSwitch = (def, shader) => {
        if (shader.defines.find((d) => d.name === def)) {
            error('EFX3200: existing shader macros cannot be used as pass switch');
        }
        return def;
    };
    const mapDSS = (dss) => {
        for (const key of Object.keys(dss)) {
            if (!key.startsWith('stencil')) {
                continue;
            }
            if (!key.endsWith('Front') && !key.endsWith('Back')) {
                dss[key + 'Front'] = dss[key + 'Back'] = dss[key];
                delete dss[key];
            }
        }
        if (dss.stencilWriteMaskFront !== dss.stencilWriteMaskBack) {
            warn('EFX3100: WebGL(2) doesn\'t support inconsistent front/back stencil write mask');
        }
        if (dss.stencilReadMaskFront !== dss.stencilReadMaskBack) {
            warn('EFX3101: WebGL(2) doesn\'t support inconsistent front/back stencil read mask');
        }
        if (dss.stencilRefFront !== dss.stencilRefBack) {
            warn('EFX3102: WebGL(2) doesn\'t support inconsistent front/back stencil ref');
        }
        return generalMap(dss);
    };
    return (pass, shader) => {
        shaderName = 'type error';
        const tmp = {};
        // special treatments
        if (pass.priority) {
            tmp.priority = mapPriority(pass.priority);
            delete pass.priority;
        }
        if (pass.depthStencilState) {
            tmp.depthStencilState = mapDSS(pass.depthStencilState);
            delete pass.depthStencilState;
        }
        if (pass.switch) {
            tmp.switch = mapSwitch(pass.switch, shader);
            delete pass.switch;
        }
        if (pass.properties) {
            tmp.properties = mapProperties(pass.properties, shader);
            delete pass.properties;
        }
        if (pass.migrations) {
            tmp.migrations = pass.migrations;
            delete pass.migrations;
        }
        generalMap(pass);
        Object.assign(pass, tmp);
    };
})();
const reduceHeaderRecord = (shaders) => {
    const deps = new Set();
    for (const shader of shaders) {
        shader.record.forEach(deps.add, deps);
    }
    return [...deps.values()];
};
const stageValidation = (stages) => {
    const passMap = {
        vert: 'graphics',
        frag: 'graphics',
        compute: 'compute',
    };
    if (stages.length === 0) {
        error('0 stages provided for a pass');
        return '';
    }
    const type = passMap[stages[0]];
    stages.forEach((stage) => {
        // validation: all stages must have the same pass type
        if (!passMap[stage]) {
            error(`invalid stage type ${stage}`);
            return '';
        }
        if (passMap[stage] !== type) {
            error('more than one pass type appears');
            return '';
        }
    });
    if (type === 'graphics') {
        const vert = stages.find((s) => s === 'vert');
        const frag = stages.find((s) => s === 'frag');
        if (stages.length === 1 || !vert || !frag) {
            error('graphics pass must include vert and frag shaders');
            return '';
        }
    }
    return type;
};
const buildEffect = (name, content) => {
    effectName = name;
    let { effect, templates, localDeprecations } = parseEffect(name, content);
    if (!effect || !Array.isArray(effect.techniques)) {
        return null;
    }
    // map passes
    templates = Object.assign({}, globalChunks, templates);
    const deprecations = {};
    for (const type in globalDeprecations) {
        deprecations[type] = Object.assign({}, globalDeprecations[type], localDeprecations[type]);
    }
    const deprecationStr = Object.keys(deprecations.identifiers)
        .reduce((cur, acc) => `|${acc}` + cur, '')
        .slice(1);
    if (deprecationStr.length) {
        deprecations.identifierRE = new RegExp(`\\b(${deprecationStr})\\b`, 'g');
    }
    const shaders = (effect.shaders = []);
    for (const jsonTech of effect.techniques) {
        for (const pass of jsonTech.passes) {
            const stageNames = {};
            const stages = [];
            if (pass.vert) {
                stageNames['vert'] = pass.vert;
                delete pass.vert;
                stages.push('vert');
            }
            if (pass.frag) {
                stageNames['frag'] = pass.frag;
                delete pass.frag;
                stages.push('frag');
            }
            if (pass.compute) {
                stageNames['compute'] = pass.compute;
                delete pass.compute;
                stages.push('compute');
            }
            const name = (pass.program = stages.reduce((acc, val) => acc.concat(`|${stageNames[val]}`), effectName));
            const type = stageValidation(stages);
            if (type === '') {
                // invalid, skip pass
                continue;
            }
            let shader = shaders.find((s) => s.name === name);
            if (!shader) {
                shader = shaderFactory.build(stageNames, type, templates, deprecations);
                shader.name = name;
                shaders.push(shader);
            }
            mapPassParam(pass, shader);
        }
    }
    effect.dependencies = reduceHeaderRecord(shaders);
    return effect;
};
// ==================
// exports
// ==================
module.exports = {
    options,
    addChunk,
    compileShader,
    buildEffect,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hkYy1saWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvZWZmZWN0LWNvbXBpbGVyL3NoZGMtbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ25ELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzdDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQy9DLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUVoQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDdEIsTUFBTSxhQUFhLEdBQUcsMEJBQTBCLENBQUM7QUFDakQsTUFBTSxjQUFjLEdBQUcsb0NBQW9DLENBQUM7QUFDNUQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDO0FBQzlCLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDO0FBQ2pDLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixDQUFDO0FBQzFDLE1BQU0sTUFBTSxHQUFHLDhFQUE4RSxDQUFDO0FBQzlGLE1BQU0sT0FBTyxHQUFHLHNGQUFzRixDQUFDO0FBQ3ZHLE1BQU0sYUFBYSxHQUFHLDBCQUEwQixDQUFDO0FBQ2pELE1BQU0sY0FBYyxHQUFHLGtDQUFrQyxDQUFDO0FBQzFELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQztBQUM3QixNQUFNLGNBQWMsR0FBRyxtREFBbUQsQ0FBQztBQUUzRSwwRUFBMEU7QUFDMUUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUUxRCxJQUFJLFVBQVUsR0FBRyxFQUFFLEVBQ2YsVUFBVSxHQUFHLEVBQUUsRUFDZixZQUFZLEdBQUcsRUFBRSxD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QUFFLEVBQUUsQ0FBQyxDQUNILE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FDN0gsQ0FDSixDQUFDO1FBQ0YsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3RyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDckIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FDN0gsQ0FBQztRQUNGLFVBQVUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ25JLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUN0QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUNuSCxDQUFDO1FBQ0YsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUgsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDNUgsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDNUgsVUFBVSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxP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LElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUgsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2SCxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZILFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEgsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNySCxVQUFVLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVILFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekgsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2SCxV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QUssQ0FBQyxJQUFJLEVBQzNHLEdBQUcsQ0FDTixDQUFDO1FBQ04sQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEcsVUFBVSxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakksVUFBVSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUcsVUFBVSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUcsVUFBVSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxD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Q0FBQztJQUNsRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDLENBQUM7QUFFRixxQkFBcUI7QUFDckIsVUFBVTtBQUNWLHFCQUFxQjtBQUVyQixNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2IsT0FBTztJQUNQLFFBQVE7SUFDUixhQUFhO0lBQ2IsV0FBVztDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHRva2VuaXplciA9IHJlcXVpcmUoJ2dsc2wtdG9rZW5pemVyL3N0cmluZycpO1xuY29uc3QgcGFyc2VyID0gcmVxdWlyZSgnZ2xzbC1wYXJzZXIvZGlyZWN0Jyk7XG5jb25zdCBtYXBwaW5ncyA9IHJlcXVpcmUoJy4vb2ZmbGluZS1tYXBwaW5ncycpO1xuY29uc3QgeWFtbCA9IHJlcXVpcmUoJ2pzLXlhbWwnKTtcblxuY29uc3QgdGFiQXNTcGFjZXMgPSAyO1xuY29uc3QgcGxhaW5EZWZpbmVSRSA9IC8jZGVmaW5lXFxzKyhcXHcrKVxccysoXFx3KykvZztcbmNvbnN0IGVmZmVjdERlZmluZVJFID0gLyNwcmFnbWFcXHMrZGVmaW5lXFxzKyhcXHcrKVxccysoLiopXFxuL2c7XG5jb25zdCBpZGVudCA9IC9bX2EtekEtWl1cXHcqL2c7XG5jb25zdCBsYWJlbFJFID0gLyhcXHcrKVxcKCguKj8pXFwpLztcbmNvbnN0IGxvY2F0aW9uUkUgPSAvbG9jYXRpb25cXHMqPVxccyooXFxkKykvO1xuY29uc3QgaW5EZWNsID0gLyg/OmxheW91dFxccypcXCgoLio/KVxcKVxccyopP2luICgoPzpcXHcrXFxzKyk/XFx3K1xccysoXFx3KylcXHMqKD86XFxbW1xcZFxcc10rXSk/KVxccyo7L2c7XG5jb25zdCBvdXREZWNsID0gLyg/OmxheW91dFxccypcXCgoLio/KVxcKVxccyopPyg/PD1cXGIpb3V0ICgoPzpcXHcrXFxzKyk/XFx3K1xccysoXFx3KylcXHMqKD86XFxbW1xcZFxcc10rXSk/KVxccyo7L2c7XG5jb25zdCBsYXlvdXRFeHRyYWN0ID0gL2xheW91dFxccypcXCgoLio/KVxcKShcXHMqKSQvO1xuY29uc3QgYmluZGluZ0V4dHJhY3QgPSAvKD86bG9jYXRpb258YmluZGluZylcXHMqPVxccyooXFxkKykvO1xuY29uc3QgYnVpbHRpblJFID0gL15jY1xcdyskL2k7XG5jb25zdCBwcmFnbWFzVG9TdHJpcCA9IC9eXFxzKig/OiNwcmFnbWFcXHMqKSg/IVNUREdMfG9wdGltaXplfGRlYnVnKS4qJFxcbi9nbTtcblxuLy8gdGV4dHVyZSBmdW5jdGlvbiB0YWJsZSByZW1hcHBpbmcgdGV4dHVyZShnbHNsMzAwKSB0byB0ZXh0dXJlWFgoZ2xzbDEwMClcbmNvbnN0IHRleHR1cmVGdW5jUmVtYXAgPSBuZXcgTWFwKFtbJ0V4dGVybmFsT0VTJywgJzJEJ11dKTtcblxubGV0IGVmZmVjdE5hbWUgPSAnJyxcbiAgICBzaGFkZXJOYW1lID0gJycsXG4gICAgc2hhZGVyVG9rZW5zID0gW107XG5jb25zdCBmb3JtYXRNc2cgPSAobXNnLCBsbikgPT4gYCR7ZWZmZWN0TmFtZX0uZWZmZWN0IC0gJHtzaGFkZXJOYW1lfWAgKyAobG4gIT09IHVuZGVmaW5lZCA/IGAgLSAke2xufTogYCA6ICc6ICcpICsgbXNnO1xuY29uc3Qgb3B0aW9ucyA9IHtcbiAgICB0aHJvd09uRXJyb3I6IHRydWUsXG4gICAgdGhyb3dPbldhcm5pbmc6IGZhbHNlLFxuICAgIG5vU291cmNlOiBmYWxzZSxcbiAgICBza2lwUGFyc2VyVGVzdDogZmFsc2UsXG4gICAgY2h1bmtTZWFyY2hGbjogKG5hbWVzKSA9PiAoe30pLFxuICAgIGdldEFsdGVybmF0aXZlQ2h1bmtQYXRoczogKHBhdGgpID0+IFtdLFxufTtcbmNvbnN0IGR1bXBTb3VyY2UgPSAodG9rZW5zKSA9PiB7XG4gICAgbGV0IGxuID0gMDtcbiAgICByZXR1cm4gdG9rZW5zLnJlZHVjZSgoYWNjLCBjdXIpID0+IChjdXIubGluZSA+IGxuID8gYWNjICsgYFxcbiR7KGxuID0gY3VyLmxpbmUpfVxcdCR7Y3VyLmRhdGEucmVwbGFjZSgvXFxuL2csICcnKX1gIDogYWNjICsgY3VyLmRhdGEpLCAnJyk7XG59O1xuY29uc3QgdGhyb3dGbkZhY3RvcnkgPSAobGV2ZWwsIG91dHB1dEZuKSA9PiB7XG4gICAgcmV0dXJuIChtc2csIGxuKSA9PiB7XG4gICAgICAgIGlmIChvcHRpb25zLm5vU291cmNlKSB7XG4gICAgICAgICAgICBsbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb3VyY2UgPSBsbiAhPT0gdW5kZWZpbmVkID8gJyDihpPihpPihpPihpPihpMgRVhQQU5EIFRISVMgTUVTU0FHRSBGT1IgTU9SRSBJTkZPIOKGk+KGk+KGk+KGk+KGkycgKyBkdW1wU291cmNlKHNoYWRlclRva2VucykgKyAnXFxuJyA6ICcnO1xuICAgICAgICBjb25zdCBmb3JtYXR0ZWRNc2cgPSBmb3JtYXRNc2cobGV2ZWwgKyAnICcgKyBtc2csIGxuKSArIHNvdXJjZTtcbiAgICAgICAgaWYgKG9wdGlvbnMudGhyb3dPbldhcm5pbmcpIHtcbiAgICAgICAgICAgIHRocm93IGZvcm1hdHRlZE1zZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dEZuKGZvcm1hdHRlZE1zZyk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbmNvbnN0IHdhcm4gPSB0aHJvd0ZuRmFjdG9yeSgnV2FybmluZycsIGNvbnNvbGUud2Fybik7XG5jb25zdCBlcnJvciA9IHRocm93Rm5GYWN0b3J5KCdFcnJvcicsIGNvbnNvbGUuZXJyb3IpO1xuXG5jb25zdCBjb252ZXJ0VHlwZSA9ICh0KSA9PiB7XG4gICAgY29uc3QgdHAgPSBtYXBwaW5ncy50eXBlTWFwW3RdO1xuICAgIHJldHVybiB0cCA9PT0gdW5kZWZpbmVkID8gdCA6IHRwO1xufTtcblxuY29uc3QgVlNCaXQgPSBtYXBwaW5ncy5nZXRTaGFkZXJTdGFnZSgndmVydGV4Jyk7XG5jb25zdCBGU0JpdCA9IG1hcHBpbmdzLmdldFNoYWRlclN0YWdlKCdmcmFnbWVudCcpO1xuY29uc3QgQ1NCaXQgPSBtYXBwaW5ncy5nZXRTaGFkZXJTdGFnZSgnY29tcHV0ZScpO1xuXG5jb25zdCBtYXBTaGFkZXJTdGFnZSA9IChzdGFnZSkgPT4ge1xuICAgIHN3aXRjaCAoc3RhZ2UpIHtcbiAgICAgICAgY2FzZSAndmVydCc6XG4gICAgICAgICAgICByZXR1cm4gVlNCaXQ7XG4gICAgICAgIGNhc2UgJ2ZyYWcnOlxuICAgICAgICAgICAgcmV0dXJuIEZTQml0O1xuICAgICAgICBjYXNlICdjb21wdXRlJzpcbiAgICAgICAgICAgIHJldHVybiBDU0JpdDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgIH1cbn07XG5cbmNvbnN0IHN0cmlwQ29tbWVudHMgPSAoKCkgPT4ge1xuICAgIGNvbnN0IGNybGZOZXdMaW5lcyA9IC9cXHJcXG4vZztcbiAgICBjb25zdCBibG9ja0NvbW1lbnRzID0gL1xcL1xcKi4qP1xcKlxcLy9ncztcbiAgICBjb25zdCBsaW5lQ29tbWVudHMgPSAvXFxzKlxcL1xcLy4qJC9nbTtcbiAgICByZXR1cm4gKGNvZGUpID0+IHtcbiAgICAgICAgLy8gc3RyaXAgY29tbWVudHNcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvZGUucmVwbGFjZShibG9ja0NvbW1lbnRzLCAnJyk7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGxpbmVDb21tZW50cywgJycpO1xuICAgICAgICAvLyByZXBsYWNlIENSTEZzICh0b2tlbml6ZXIgZG9lc24ndCB3b3JrIHdpdGggL3IvbilcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoY3JsZk5ld0xpbmVzLCAnXFxuJyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn0pKCk7XG5cbmNvbnN0IGdsb2JhbENodW5rcyA9IHt9O1xuY29uc3QgZ2xvYmFsRGVwcmVjYXRpb25zID0geyBjaHVua3M6IHt9LCBpZGVudGlmaWVyczoge30gfTtcbmNvbnN0IGFkZENodW5rID0gKCgpID0+IHtcbiAgICBjb25zdCBkZXBSRSA9IC8jcHJhZ21hXFxzK2RlcHJlY2F0ZS0oY2h1bmt8aWRlbnRpZmllcilcXHMrKFtcXHctXSspKD86XFxzKyguKikpPy9nO1xuICAgIHJldHVybiAobmFtZSwgY29udGVudCwgY2h1bmtzID0gZ2xvYmFsQ2h1bmtzLCBkZXByZWNhdGlvbnMgPSBnbG9iYWxEZXByZWNhdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBzdHJpcENvbW1lbnRzKGNvbnRlbnQpO1xuICAgICAgICBsZXQgZGVwQ2FwID0gZGVwUkUuZXhlYyhjaHVuayk7XG4gICAgICAgIGxldCBjb2RlID0gJycsXG4gICAgICAgICAgICBuZXh0QmVnSWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGRlcENhcCkge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IGAke2RlcENhcFsxXX1zYDtcbiAgICAgICAgICAgIGlmICghZGVwcmVjYXRpb25zW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgZGVwcmVjYXRpb25zW3R5cGVdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXByZWNhdGlvbnNbdHlwZV1bZGVwQ2FwWzJdXSA9IGRlcENhcFszXTtcblxuICAgICAgICAgICAgY29kZSArPSBjaHVuay5zbGljZShuZXh0QmVnSWR4LCBkZXBDYXAuaW5kZXgpO1xuICAgICAgICAgICAgbmV4dEJlZ0lkeCA9IGRlcENhcC5pbmRleCArIGRlcENhcFswXS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGRlcENhcCA9IGRlcFJFLmV4ZWMoY2h1bmspO1xuICAgICAgICB9XG4gICAgICAgIGNodW5rc1tuYW1lXSA9IGNvZGUgKyBjaHVuay5zbGljZShuZXh0QmVnSWR4KTtcbiAgICB9O1xufSkoKTtcblxuY29uc3QgaW52b2tlU2VhcmNoID0gKG5hbWVzKSA9PiB7XG4gICAgY29uc3QgeyBuYW1lLCBjb250ZW50IH0gPSBvcHRpb25zLmNodW5rU2VhcmNoRm4obmFtZXMpO1xuICAgIGlmIChjb250ZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWRkQ2h1bmsobmFtZSwgY29udGVudCk7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59O1xuXG5jb25zdCB1bndpbmRJbmNsdWRlcyA9ICgoKSA9PiB7XG4gICAgY29uc3QgaW5jbHVkZVJFID0gL14oLiopI2luY2x1ZGVcXHMrWzxcIl0oW14+XCJdKylbPlwiXSguKikkL2dtO1xuICAgIGxldCByZXBsYWNlcjtcbiAgICBjb25zdCByZXBsYWNlckZhY3RvcnkgPSAoY2h1bmtzLCBkZXByZWNhdGlvbnMsIHJlY29yZCkgPT4gKHN0ciwgcHJlZml4LCBuYW1lLCBzdWZmaXgpID0+IHtcbiAgICAgICAgbmFtZSA9IG5hbWUudHJpbSgpO1xuICAgICAgICBpZiAobmFtZS5lbmRzV2l0aCgnLmNodW5rJykpIHtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnNsaWNlKDAsIC02KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmlnaW5hbE5hbWUgPSBuYW1lO1xuICAgICAgICBpZiAocmVjb3JkLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZXByZWNhdGlvbnNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZXJyb3IoYEVGWDIwMDM6IGhlYWRlciAnJHtuYW1lfScgaXMgZGVwcmVjYXRlZDogJHtkZXByZWNhdGlvbnNbbmFtZV19YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbnRlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjaHVua3NbbmFtZV07XG4gICAgICAgICAgICBpZiAoY29udGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhbHRlcm5hdGl2ZXMgPSBvcHRpb25zLmdldEFsdGVybmF0aXZlQ2h1bmtQYXRocyhuYW1lKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBhbHRlcm5hdGl2ZXMuc29tZSgocGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2h1bmtzW3BhdGhdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBwYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNodW5rc1twYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lID0gaW52b2tlU2VhcmNoKFtdLmNvbmNhdChuYW1lLCBhbHRlcm5hdGl2ZXMpKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBnbG9iYWxDaHVua3NbbmFtZV07XG4gICAgICAgICAgICBpZiAoY29udGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlcnJvcihgRUZYMjAwMTogY2FuIG5vdCByZXNvbHZlICcke29yaWdpbmFsTmFtZX0nYCk7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0gd2hpbGUgKDApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIHJlY29yZC5hZGQobmFtZSk7XG5cbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvXi9nbSwgcHJlZml4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VmZml4KSB7XG4gICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC9cXG4vZywgc3VmZml4ICsgJ1xcbicpICsgc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoaW5jbHVkZVJFLCByZXBsYWNlcik7XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH07XG4gICAgcmV0dXJuIChzdHIsIGNodW5rcywgZGVwcmVjYXRpb25zLCByZWNvcmQgPSBuZXcgU2V0KCkpID0+IHtcbiAgICAgICAgcmVwbGFjZXIgPSByZXBsYWNlckZhY3RvcnkoY2h1bmtzLCBkZXByZWNhdGlvbnMuY2h1bmtzLCByZWNvcmQpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShpbmNsdWRlUkUsIHJlcGxhY2VyKTtcbiAgICAgICAgaWYgKGRlcHJlY2F0aW9ucy5pZGVudGlmaWVyUkUpIHtcbiAgICAgICAgICAgIGxldCBkZXBDYXAgPSBkZXByZWNhdGlvbnMuaWRlbnRpZmllclJFLmV4ZWMoc3RyKTtcbiAgICAgICAgICAgIHdoaWxlIChkZXBDYXApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXBNc2cgPSBkZXByZWNhdGlvbnMuaWRlbnRpZmllcnNbZGVwQ2FwWzFdXTtcbiAgICAgICAgICAgICAgICBpZiAoZGVwTXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGBFRlgyMDA0OiBpZGVudGlmaWVyICcke2RlcENhcFsxXX0nIGlzIGRlcHJlY2F0ZWQ6ICR7ZGVwTXNnfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXBDYXAgPSBkZXByZWNhdGlvbnMuaWRlbnRpZmllclJFLmV4ZWMoc3RyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH07XG59KSgpO1xuXG5jb25zdCBleHBhbmRGdW5jdGlvbmFsTWFjcm8gPSAoKCkgPT4ge1xuICAgIGNvbnN0IGdldE1hdGNoaW5nUGFyZW4gPSAoc3RyaW5nLCBzdGFydFBhcmVuKSA9PiB7XG4gICAgICAgIGlmIChzdHJpbmdbc3RhcnRQYXJlbl0gIT09ICcoJykge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0UGFyZW47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlcHRoID0gMTtcbiAgICAgICAgbGV0IGkgPSBzdGFydFBhcmVuICsgMTtcbiAgICAgICAgZm9yICg7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmdbaV0gPT09ICcoJykge1xuICAgICAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyaW5nW2ldID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICBkZXB0aC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGk7XG4gICAgfTtcbiAgICBjb25zdCBwYXJlbkF3YXJlU3BsaXQgPSAoc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgICBsZXQgYmVnID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmdbaV0gPT09ICcoJykge1xuICAgICAgICAgICAgICAgIGkgPSBnZXRNYXRjaGluZ1BhcmVuKHN0cmluZywgaSkgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0cmluZ1tpXSA9PT0gJywnKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goc3RyaW5nLnN1YnN0cmluZyhiZWcsIGkpLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgYmVnID0gaSArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJlZyAhPT0gc3RyaW5nLmxlbmd0aCB8fCBzdHJpbmdbc3RyaW5nLmxlbmd0aCAtIDFdID09PSAnLCcpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKHN0cmluZy5zdWJzdHJpbmcoYmVnKS50cmltKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBjb25zdCBkZWZpbmVSRSA9IC8jcHJhZ21hXFxzK2RlZmluZVxccysoXFx3KylcXCgoW1xcdyxcXHNdKilcXClcXHMrKC4qPylcXG4vZztcbiAgICBjb25zdCBoYXNoUkUgPSAvKD88PVxcdykjIyg/PVxcdykvZztcbiAgICBjb25zdCBuZXdsaW5lUkUgPSAvXFxcXFxccyo/XFxuL2c7XG4gICAgY29uc3QgbmV3bGluZU1hcmtSRSA9IC9AQC9nO1xuICAgIGNvbnN0IGRlZmluZVByZWZpeFJFID0gLyNwcmFnbWFcXHMrZGVmaW5lfCNkZWZpbmUvO1xuICAgIHJldHVybiAoY29kZSkgPT4ge1xuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKG5ld2xpbmVSRSwgJ0BAJyk7XG4gICAgICAgIGxldCBkZWZpbmVDYXB0dXJlID0gZGVmaW5lUkUuZXhlYyhjb2RlKTtcbiAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGRlZmluaXRpb25zXG4gICAgICAgIHdoaWxlIChkZWZpbmVDYXB0dXJlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBmbk5hbWUgPSBkZWZpbmVDYXB0dXJlWzFdO1xuICAgICAgICAgICAgY29uc3QgZm5QYXJhbXMgPSBwYXJlbkF3YXJlU3BsaXQoZGVmaW5lQ2FwdHVyZVsyXSk7XG4gICAgICAgICAgICBjb25zdCBmbkJvZHkgPSBkZWZpbmVDYXB0dXJlWzNdO1xuICAgICAgICAgICAgY29uc3QgZGVmU3RhcnRJZHggPSBkZWZpbmVDYXB0dXJlLmluZGV4O1xuICAgICAgICAgICAgY29uc3QgZGVmRW5kSWR4ID0gZGVmaW5lQ2FwdHVyZS5pbmRleCArIGRlZmluZUNhcHR1cmVbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgbWFjcm9SRSA9IG5ldyBSZWdFeHAoJ14oLio/KScgKyBmbk5hbWUgKyAnXFxcXHMqXFxcXCgnLCAnZ20nKTtcbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBpbnZvY2F0aW9uc1xuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIGZuTmFtZSArICdcXFxcYicpLnRlc3QoZm5Cb2R5KSkge1xuICAgICAgICAgICAgICAgIHdhcm4oYEVGWDIwMDI6IHJlY3Vyc2l2ZSBtYWNybyBwcm9jZXNzb3IgJyR7Zm5OYW1lfSdgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbWFjcm9DYXB0dXJlID0gbWFjcm9SRS5leGVjKGNvZGUpOyBtYWNyb0NhcHR1cmUgIT09IG51bGw7IG1hY3JvQ2FwdHVyZSA9IG1hY3JvUkUuZXhlYyhjb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcGVuUGFyZW5JZHggPSBtYWNyb0NhcHR1cmUuaW5kZXggKyBtYWNyb0NhcHR1cmVbMF0ubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW5QYXJlbklkeCA+IGRlZlN0YXJ0SWR4ICYmIG9wZW5QYXJlbklkeCA8IGRlZkVuZElkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH0gLy8gc2tpcCBvcmlnaW5hbCBkZWZpbml0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZpeCA9IG1hY3JvQ2FwdHVyZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRJZHggPSBtYWNyb0NhcHR1cmUuaW5kZXggKyBwcmVmaXgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmRJZHggPSBnZXRNYXRjaGluZ1BhcmVuKGNvZGUsIG9wZW5QYXJlbklkeCkgKyAxO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBwYXJlbkF3YXJlU3BsaXQoY29kZS5zbGljZShtYWNyb0NhcHR1cmUuaW5kZXggKyBtYWNyb0NhcHR1cmVbMF0ubGVuZ3RoLCBlbmRJZHggLSAxKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbXMubGVuZ3RoICE9PSBmblBhcmFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm4oYEVGWDIwMDU6IG5vdCBlbm91Z2ggYXJndW1lbnRzIGZvciBmdW5jdGlvbi1saWtlIG1hY3JvIGludm9jYXRpb24gJyR7Zm5OYW1lfSdgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBwYXRjaCBmdW5jdGlvbiBib2R5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY29yZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmblBhcmFtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKCdcXFxcYicgKyBmblBhcmFtc1tpXSArICdcXFxcYicsICdnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF0Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKG1hdGNoID0gcmUuZXhlYyhmbkJvZHkpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29yZHMucHVzaCh7IGJlZzogbWF0Y2guaW5kZXgsIGVuZDogcmUubGFzdEluZGV4LCB0YXJnZXQ6IHBhcmFtc1tpXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiByZWNvcmRzLnNvcnQoKGEsIGIpID0+IGEuYmVnIC0gYi5iZWcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5ICs9IGZuQm9keS5zbGljZShpbmRleCwgcmVjb3JkLmJlZykgKyByZWNvcmQudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZWNvcmQuZW5kO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJvZHkgKz0gZm5Cb2R5LnNsaWNlKGluZGV4LCBmbkJvZHkubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWZpbmVQcmVmaXhSRS50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciB0b3AgbGV2ZWwgaW52b2NhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbmRlbnRDb3VudCA9IHByZWZpeC5zZWFyY2goL1xcUy8pOyAvLyBjYWxjIGluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50Q291bnQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50Q291bnQgPSBwcmVmaXgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZShoYXNoUkUsICcnKTsgLy8gY2xlYXIgdGhlIGhhc2hlc1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZShuZXdsaW5lTWFya1JFLCAnXFxuJyArICcgJy5yZXBlYXQoaW5kZW50Q291bnQpKTsgLy8gcmVzdG9yZSBuZXdsaW5lcyBpbiB0aGUgb3V0cHV0XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0TmV3bGluZSA9IHByZWZpeC5sYXN0SW5kZXhPZignQEAnKTsgLy8gY2FsYyBpbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyTGluZVByZWZpeCA9IGxhc3ROZXdsaW5lIDwgMCA/IHByZWZpeCA6IHByZWZpeC5zbGljZShsYXN0TmV3bGluZSArIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGluZGVudENvdW50ID0gY3VyTGluZVByZWZpeC5zZWFyY2goL1xcUy8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudENvdW50IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudENvdW50ID0gY3VyTGluZVByZWZpeC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5ID0gYm9keS5yZXBsYWNlKG5ld2xpbmVNYXJrUkUsICdAQCcgKyAnICcucmVwZWF0KGluZGVudENvdW50KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSB0aGUgaW52b2NhdGlvblxuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5zdWJzdHJpbmcoMCwgc3RhcnRJZHgpICsgYm9keSArIGNvZGUuc3Vic3RyaW5nKGVuZElkeCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdmUgdG8gdGhlIHN0YXJ0aW5nIHBvaW50IGluIGNhc2UgdGhlIGZ1bmN0aW9uIGJvZHkgaXMgYWN0dWFsbHkgc2hvcnRlciB0aGFuIHRoZSBpbnZvY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIG1hY3JvUkUubGFzdEluZGV4IC09IG1hY3JvQ2FwdHVyZVswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29kZSA9IGNvZGUuc3Vic3RyaW5nKDAsIGRlZlN0YXJ0SWR4KSArIGNvZGUuc3Vic3RyaW5nKGRlZkVuZElkeCk7IC8vIG5vIGxvbmdlciBuZWVkIHRvIGJlIGFyb3VuZFxuICAgICAgICAgICAgZGVmaW5lUkUubGFzdEluZGV4ID0gMDsgLy8gcmVzZXQgcG9pbnRlclxuICAgICAgICAgICAgZGVmaW5lQ2FwdHVyZSA9IGRlZmluZVJFLmV4ZWMoY29kZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29kZS5yZXBsYWNlKG5ld2xpbmVNYXJrUkUsICdcXFxcXFxuJyk7XG4gICAgICAgIHJldHVybiBjb2RlO1xuICAgIH07XG59KSgpO1xuXG5jb25zdCBleHBhbmRJbnB1dFN0YXRlbWVudCA9IChzdGF0ZW1lbnRzKSA9PiB7XG4gICAgbGV0IGdsNEluZGV4ID0gMDtcbiAgICBsZXQgZXMxSW5kZXggPSAwO1xuICAgIGxldCBlczNJbmRleCA9IDA7XG4gICAgbGV0IG91dEluZGV4ID0gMDtcbiAgICBsZXQgZHNJbmRleDtcblxuICAgIGNvbnN0IFR5cGVzID0ge1xuICAgICAgICB1OiBbJ3V2ZWM0JywgJ3VzdWJwYXNzSW5wdXQnXSxcbiAgICAgICAgaTogWydpdmVjNCcsICdpc3VicGFzc0lucHV0J10sXG4gICAgICAgIGY6IFsndmVjNCcsICdzdWJwYXNzSW5wdXQnXSxcbiAgICB9O1xuXG4gICAgY29uc3QgaW5wdXRQcmVmaXggPSAnX19pbic7XG5cbiAgICBsZXQgb3V0ID0gJyc7XG4gICAgbGV0IGhhc0NvbG9yID0gZmFsc2U7XG4gICAgbGV0IGhhc0RlcHRoU3RlbmNpbCA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50cykge1xuICAgICAgICBjb25zdCBpbnB1dFR5cGUgPSBzdGF0ZW1lbnQudHlwZTtcbiAgICAgICAgY29uc3QgdmFyVHlwZSA9IFR5cGVzW3N0YXRlbWVudC5zaWduZWRdO1xuICAgICAgICBjb25zdCBpbm91dCA9IHN0YXRlbWVudC5pbm91dDtcbiAgICAgICAgY29uc3QgbmFtZSA9IHN0YXRlbWVudC5uYW1lO1xuICAgICAgICBjb25zdCBwcmVjaXNpb24gPSBzdGF0ZW1lbnQucHJlY2lzaW9uID8gc3RhdGVtZW50LnByZWNpc2lvbiA6ICcnO1xuICAgICAgICBjb25zdCBpbnB1dEluZGV4ID0gaW5wdXRUeXBlICE9PSAnQ29sb3InID8gZHNJbmRleCA/PyBnbDRJbmRleCA6IGdsNEluZGV4O1xuICAgICAgICBjb25zdCBtYWNyb091dCA9XG4gICAgICAgICAgICBgXFxuYCArXG4gICAgICAgICAgICBgI2lmIF9fVkVSU0lPTl9fID49IDQ1MFxcbmAgK1xuICAgICAgICAgICAgYCAgbGF5b3V0KGxvY2F0aW9uID0gJHtvdXRJbmRleH0pIG91dCAke3ZhclR5cGVbMF19ICR7bmFtZX07XFxuYCArXG4gICAgICAgICAgICBgI2VsaWYgX19WRVJTSU9OX18gPj0gMzAwXFxuYCArXG4gICAgICAgICAgICBgICBsYXlvdXQobG9jYXRpb24gPSAke2VzM0luZGV4fSkgb3V0ICR7dmFyVHlwZVswXX0gJHtuYW1lfTtcXG5gICtcbiAgICAgICAgICAgIGAjZW5kaWZcXG5gO1xuXG4gICAgICAgIGNvbnN0IG1hY3JvT3V0NDUwID0gYFxcbmAgKyBgI2lmIF9fVkVSU0lPTl9fID49IDQ1MFxcbmAgKyBgICBsYXlvdXQobG9jYXRpb24gPSAke291dEluZGV4fSkgb3V0ICR7dmFyVHlwZVswXX0gJHtuYW1lfTtcXG5gICsgYCNlbmRpZlxcbmA7XG5cbiAgICAgICAgY29uc3QgbWFjcm9EZXB0aFN0ZW5jaWxJbiA9XG4gICAgICAgICAgICBgXFxuYCArXG4gICAgICAgICAgICBgI3ByYWdtYSByYXRlICR7aW5wdXRQcmVmaXh9JHtuYW1lfSBwYXNzXFxuYCArXG4gICAgICAgICAgICBgI2lmIENDX0RFVklDRV9DQU5fQkVORUZJVF9GUk9NX0lOUFVUX0FUVEFDSE1FTlRcXG5gICtcbiAgICAgICAgICAgIGAgICNpZiBfX1ZFUlNJT05fXyA+PSA0NTBcXG5gICtcbiAgICAgICAgICAgIGAgICAgbGF5b3V0KGlucHV0X2F0dGFjaG1lbnRfaW5kZXggPSAke2lucHV0SW5kZXh9KSB1bmlmb3JtICR7dmFyVHlwZVsxXX0gJHtpbnB1dFByZWZpeH0ke25hbWV9O1xcbmAgK1xuICAgICAgICAgICAgYCAgICAjZGVmaW5lIHN1YnBhc3NMb2FkXyR7bmFtZX0gc3VicGFzc0xvYWQoJHtpbnB1dFByZWZpeH0ke25hbWV9KVxcbmAgK1xuICAgICAgICAgICAgYCAgI2Vsc2VcXG5gICtcbiAgICAgICAgICAgIGAgICAgI2RlZmluZSBzdWJwYXNzTG9hZF8ke25hbWV9ICR7dmFyVHlwZVswXX0oZ2xfTGFzdEZyYWcke2lucHV0VHlwZX1BUk0sIDAsIDAsIDApXFxuYCArXG4gICAgICAgICAgICBgICAjZW5kaWZcXG5gICtcbiAgICAgICAgICAgIGAjZWxzZVxcbmAgK1xuICAgICAgICAgICAgYCAgI2RlZmluZSBzdWJwYXNzTG9hZF8ke25hbWV9ICR7dmFyVHlwZVswXX0oMCwgMCwgMCwgMClcXG5gICtcbiAgICAgICAgICAgIGAjZW5kaWZcXG5gO1xuXG4gICAgICAgIGNvbnN0IG1hY3JvQ29sb3JJbiA9XG4gICAgICAgICAgICBgXFxuYCArXG4gICAgICAgICAgICBgI3ByYWdtYSByYXRlICR7aW5wdXRQcmVmaXh9JHtuYW1lfSBwYXNzXFxuYCArXG4gICAgICAgICAgICBgI2lmIENDX0RFVklDRV9DQU5fQkVORUZJVF9GUk9NX0lOUFVUX0FUVEFDSE1FTlRcXG5gICtcbiAgICAgICAgICAgIGAgICNpZiBfX1ZFUlNJT05fXyA+PSA0NTBcXG5gICtcbiAgICAgICAgICAgIGAgICAgbGF5b3V0KGlucHV0X2F0dGFjaG1lbnRfaW5kZXggPSAke2lucHV0SW5kZXh9KSB1bmlmb3JtIHN1YnBhc3NJbnB1dCAke2lucHV0UHJlZml4fSR7bmFtZX07XFxuYCArXG4gICAgICAgICAgICBgICAgICNkZWZpbmUgc3VicGFzc0xvYWRfJHtuYW1lfSBzdWJwYXNzTG9hZCgke2lucHV0UHJlZml4fSR7bmFtZX0pXFxuYCArXG4gICAgICAgICAgICBgICAjZWxpZiBfX1ZFUlNJT05fXyA+PSAzMDBcXG5gICtcbiAgICAgICAgICAgIGAgICAgbGF5b3V0KGxvY2F0aW9uID0gJHtlczNJbmRleH0pIGlub3V0ICR7cHJlY2lzaW9ufSAke3ZhclR5cGVbMF19ICR7bmFtZX07XFxuYCArXG4gICAgICAgICAgICBgICAgICNkZWZpbmUgc3VicGFzc0xvYWRfJHtuYW1lfSAke25hbWV9XFxuYCArXG4gICAgICAgICAgICBgICAjZWxzZVxcbmAgK1xuICAgICAgICAgICAgYCAgICAjZGVmaW5lIHN1YnBhc3NMb2FkXyR7bmFtZX0gZ2xfTGFzdEZyYWdEYXRhWyR7ZXMxSW5kZXh9XVxcbmAgK1xuICAgICAgICAgICAgYCAgI2VuZGlmXFxuYCArXG4gICAgICAgICAgICBgI2Vsc2VcXG5gICtcbiAgICAgICAgICAgIGAgICNkZWZpbmUgc3VicGFzc0xvYWRfJHtuYW1lfSAke3ByZWNpc2lvbn0gJHt2YXJUeXBlWzBdfSgwLCAwLCAwLCAwKVxcbmAgK1xuICAgICAgICAgICAgYCNlbmRpZlxcbmA7XG5cbiAgICAgICAgaWYgKGlub3V0ID09PSAnb3V0Jykge1xuICAgICAgICAgICAgb3V0ICs9IG1hY3JvT3V0O1xuICAgICAgICAgICAgb3V0SW5kZXgrKztcbiAgICAgICAgICAgIGVzM0luZGV4Kys7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5vdXQgPT09ICdpbm91dCcpIHtcbiAgICAgICAgICAgIG91dCArPSBtYWNyb091dDQ1MDtcbiAgICAgICAgICAgIG91dEluZGV4Kys7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5vdXQgPT09ICdpbicgfHwgaW5vdXQgPT09ICdpbm91dCcpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dFR5cGUgPT09ICdDb2xvcicpIHtcbiAgICAgICAgICAgICAgICBvdXQgKz0gbWFjcm9Db2xvckluO1xuICAgICAgICAgICAgICAgIGdsNEluZGV4Kys7XG4gICAgICAgICAgICAgICAgZXMxSW5kZXgrKztcbiAgICAgICAgICAgICAgICBlczNJbmRleCsrO1xuICAgICAgICAgICAgICAgIGhhc0NvbG9yID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRzSW5kZXggPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgICAgICBkc0luZGV4ID0gZ2w0SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGdsNEluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dCArPSBtYWNyb0RlcHRoU3RlbmNpbEluO1xuICAgICAgICAgICAgICAgIGhhc0RlcHRoU3RlbmNpbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb2xvckV4dGVuc2lvbiA9ICcjcHJhZ21hIGV4dGVuc2lvbihbR0xfRVhUX3NoYWRlcl9mcmFtZWJ1ZmZlcl9mZXRjaCwgX19WRVJTSU9OX18gPCA0NTAsIGVuYWJsZV0pXFxuJztcbiAgICBjb25zdCBkc0V4dGVuc2lvbiA9ICcjcHJhZ21hIGV4dGVuc2lvbihbR0xfQVJNX3NoYWRlcl9mcmFtZWJ1ZmZlcl9mZXRjaF9kZXB0aF9zdGVuY2lsLCBfX1ZFUlNJT05fXyA8IDQ1MCwgZW5hYmxlXSlcXG4nO1xuXG4gICAgaWYgKGhhc0NvbG9yKSB7XG4gICAgICAgIG91dCA9IGNvbG9yRXh0ZW5zaW9uICsgb3V0O1xuICAgIH1cbiAgICBpZiAoaGFzRGVwdGhTdGVuY2lsKSB7XG4gICAgICAgIG91dCA9IGRzRXh0ZW5zaW9uICsgb3V0O1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG5jb25zdCBleHBhbmRTdWJwYXNzSW5vdXQgPSAoY29kZSkgPT4ge1xuICAgIGNvbnN0IGlucHV0U3RhdGVtZW50cyA9IFtdO1xuXG4gICAgY29uc3QgaW5wdXRUeXBlV2VpZ2h0cyA9IHtcbiAgICAgICAgQ29sb3I6IDAsXG4gICAgICAgIERlcHRoOiAxLFxuICAgICAgICBTdGVuY2lsOiAyLFxuICAgIH07XG5cbiAgICBjb25zdCBpbm91dFR5cGVXZWlnaHRzID0ge1xuICAgICAgICBpbjogMCxcbiAgICAgICAgaW5vdXQ6IDEsXG4gICAgICAgIG91dDogMixcbiAgICB9O1xuXG4gICAgY29uc3QgRmlsdGVyTWFwID0ge1xuICAgICAgICBDb2xvcjogeyBpbm91dHM6IFsnaW4nLCAnb3V0JywgJ2lub3V0J10sIHR5cGVzOiBbJ2knLCAnZicsICd1J10sIGhpbnQ6ICcnIH0sXG4gICAgICAgIERlcHRoOiB7IGlub3V0czogWydpbiddLCB0eXBlczogWydmJ10sIGhpbnQ6ICdzdWJwYXNzRGVwdGgnIH0sXG4gICAgICAgIFN0ZW5jaWw6IHsgaW5vdXRzOiBbJ2luJ10sIHR5cGVzOiBbJ2knXSwgaGludDogJ2lzdWJwYXNzU3RlbmNpbCcgfSxcbiAgICB9O1xuXG4gICAgLy8gcmVwbGFjZSBzdWJwYXNzTG9hZCh2YWwpIGZ1bmN0aW9ucyB0byBzdWJwYXNzTG9hZF92YWxcbiAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9zdWJwYXNzTG9hZFxccypcXChcXHMqKFxcdyspXFxzKlxcKS9nLCBgc3VicGFzc0xvYWRfJDFgKTtcblxuICAgIGxldCBhdHRhY2htZW50SW5kZXggPSAwO1xuICAgIGNvbnN0IHN1YnBhc3NEZWZpbmVSRSA9IC8jcHJhZ21hXFxzKyhpfHUpP3N1YnBhc3MoQ29sb3J8RGVwdGh8U3RlbmNpbClcXHMrKFxcdyspXFxzKihtZWRpdW1wfGhpZ2hwfGxvd3ApP1xccysoXFx3KylcXHMrL2c7XG4gICAgbGV0IGRlZmluZUNhcHR1cmUgPSBzdWJwYXNzRGVmaW5lUkUuZXhlYyhjb2RlKTtcbiAgICB3aGlsZSAoZGVmaW5lQ2FwdHVyZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBzaWduZWQgPSBkZWZpbmVDYXB0dXJlWzFdID8gZGVmaW5lQ2FwdHVyZVsxXSA6ICdmJztcbiAgICAgICAgY29uc3QgaW5wdXQgPSBkZWZpbmVDYXB0dXJlWzJdO1xuICAgICAgICBjb25zdCBpbm91dCA9IGRlZmluZUNhcHR1cmVbM107XG4gICAgICAgIGNvbnN0IHByZWNpc2lvbiA9IGRlZmluZUNhcHR1cmVbNF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBkZWZpbmVDYXB0dXJlWzVdO1xuICAgICAgICBjb25zdCBpbmRleCA9IGF0dGFjaG1lbnRJbmRleDtcblxuICAgICAgICBjb25zdCBmaWx0ZXIgPSBGaWx0ZXJNYXBbaW5wdXRdO1xuICAgICAgICBpZiAoIWZpbHRlci5pbm91dHMuaW5jbHVkZXMoaW5vdXQpKSB7XG4gICAgICAgICAgICBlcnJvcihgdW5zdXBwb3J0ZWQgaW5vdXQgdHlwZSAke2lucHV0fSwgJHtpbm91dH1gKTtcbiAgICAgICAgICAgIHJldHVybiBjb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmaWx0ZXIudHlwZXMuaW5jbHVkZXMoc2lnbmVkKSkge1xuICAgICAgICAgICAgZXJyb3IoYHVuc3VwcG9ydGVkIHN1YnBhc3MgdHlwZSBmb3IgJHtpbnB1dH0sIG9ubHkgJHtmaWx0ZXIuaGludH0gc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICByZXR1cm4gY29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlucHV0U3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IGlucHV0LFxuICAgICAgICAgICAgaW5vdXQ6IGlub3V0LFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgIHByZWNpc2lvbjogcHJlY2lzaW9uLFxuICAgICAgICAgICAgc2lnbmVkOiBzaWduZWQsXG4gICAgICAgICAgICBzb3J0S2V5SW5wdXQ6IGlucHV0VHlwZVdlaWdodHNbaW5wdXRdLFxuICAgICAgICAgICAgc29ydEtleUlub3V0OiBpbm91dFR5cGVXZWlnaHRzW2lub3V0XSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYmVnID0gZGVmaW5lQ2FwdHVyZS5pbmRleDtcbiAgICAgICAgY29uc3QgZW5kID0gZGVmaW5lQ2FwdHVyZS5pbmRleCArIGRlZmluZUNhcHR1cmVbMF0ubGVuZ3RoO1xuICAgICAgICBjb2RlID0gY29kZS5zdWJzdHJpbmcoMCwgYmVnKSArIGNvZGUuc3Vic3RyaW5nKGVuZCk7XG4gICAgICAgIHN1YnBhc3NEZWZpbmVSRS5sYXN0SW5kZXggPSBiZWc7XG4gICAgICAgIGRlZmluZUNhcHR1cmUgPSBzdWJwYXNzRGVmaW5lUkUuZXhlYyhjb2RlKTtcbiAgICAgICAgKythdHRhY2htZW50SW5kZXg7XG4gICAgfVxuXG4gICAgaW5wdXRTdGF0ZW1lbnRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgaWYgKGEuc29ydEtleUlub3V0ICE9PSBiLnNvcnRLZXlJbm91dCkge1xuICAgICAgICAgICAgcmV0dXJuIGEuc29ydEtleUlub3V0IC0gYi5zb3J0S2V5SW5vdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYS5zb3J0S2V5SW5wdXQgIT0gYi5zb3J0S2V5SW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnNvcnRLZXlJbnB1dCAtIGIuc29ydEtleUlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm8gc29ydCB3aWxsIGJlIGFwcGxpZWQgdG8gb3V0LW9ubHkgY29sb3IgYXR0YWNobWVudFxuICAgICAgICBpZiAoYS5zb3J0S2V5SW5vdXQgPT09IGlub3V0VHlwZVdlaWdodHNbJ291dCddKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoYS5uYW1lIDwgYi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYS5uYW1lID4gYi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IG91dCA9IGV4cGFuZElucHV0U3RhdGVtZW50KGlucHV0U3RhdGVtZW50cyk7XG5cbiAgICBjb25zdCBzdWJwYXNzUmVwbGFjZVJFID0gLyNwcmFnbWFcXHMrc3VicGFzcy9nO1xuICAgIGNvbnN0IHN1YnBhc3NSZXBsYWNlID0gc3VicGFzc1JlcGxhY2VSRS5leGVjKGNvZGUpO1xuICAgIGlmIChzdWJwYXNzUmVwbGFjZSkge1xuICAgICAgICBjb25zdCBiZWcgPSBzdWJwYXNzUmVwbGFjZS5pbmRleDtcbiAgICAgICAgY29uc3QgZW5kID0gc3VicGFzc1JlcGxhY2UuaW5kZXggKyBzdWJwYXNzUmVwbGFjZVswXS5sZW5ndGg7XG4gICAgICAgIGNvZGUgPSBjb2RlLnN1YnN0cmluZygwLCBiZWcpICsgb3V0ICsgY29kZS5zdWJzdHJpbmcoZW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvZGU7XG59O1xuXG5jb25zdCBleHBhbmRMaXRlcmFsTWFjcm8gPSAoY29kZSkgPT4ge1xuICAgIGNvbnN0IGRlZmluZXMgPSB7fTtcbiAgICBsZXQgZGVmQ2FwID0gZWZmZWN0RGVmaW5lUkUuZXhlYyhjb2RlKTtcbiAgICAvLyBleHRyYWN0aW9uXG4gICAgd2hpbGUgKGRlZkNhcCAhPT0gbnVsbCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBkZWZDYXBbMl07XG4gICAgICAgIGlmICh2YWx1ZS5lbmRzV2l0aCgnXFxcXCcpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgfVxuICAgICAgICBkZWZpbmVzW2RlZkNhcFsxXV0gPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIGNvbnN0IGJlZyA9IGRlZkNhcC5pbmRleDtcbiAgICAgICAgY29uc3QgZW5kID0gZGVmQ2FwLmluZGV4ICsgZGVmQ2FwWzBdLmxlbmd0aDtcbiAgICAgICAgY29kZSA9IGNvZGUuc3Vic3RyaW5nKDAsIGJlZykgKyBjb2RlLnN1YnN0cmluZyhlbmQpO1xuICAgICAgICBlZmZlY3REZWZpbmVSRS5sYXN0SW5kZXggPSBiZWc7XG4gICAgICAgIGRlZkNhcCA9IGVmZmVjdERlZmluZVJFLmV4ZWMoY29kZSk7XG4gICAgfVxuICAgIC8vIHJlcGxhY2VtZW50XG4gICAgY29uc3Qga2V5UkVzID0gT2JqZWN0LmtleXMoZGVmaW5lcykubWFwKChrKSA9PiBuZXcgUmVnRXhwKGBcXFxcYiR7a31cXFxcYmAsICdnJykpO1xuICAgIGNvbnN0IHZhbHVlcyA9IE9iamVjdC52YWx1ZXMoZGVmaW5lcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGk7IGorKykge1xuICAgICAgICAgICAgLy8gb25seSByZXBsYWNlIGVhbGllciBvbmVzXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2Uoa2V5UkVzW2pdLCB2YWx1ZXNbal0pO1xuICAgICAgICB9XG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2Uoa2V5UkVzW2ldLCB2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBjb2RlO1xufTtcblxuY29uc3QgZXh0cmFjdE1hY3JvRGVmaW5pdGlvbnMgPSAoY29kZSkgPT4ge1xuICAgIGNvbnN0IGRlZmluZXMgPSBuZXcgU2V0KCk7XG4gICAgbGV0IGRlZkNhcCA9IHBsYWluRGVmaW5lUkUuZXhlYyhjb2RlKTtcbiAgICBjb25zdCBzdWJzdGl0dXRlTWFwID0gbmV3IE1hcCgpO1xuICAgIHdoaWxlIChkZWZDYXAgIT09IG51bGwpIHtcbiAgICAgICAgZGVmaW5lcy5hZGQoZGVmQ2FwWzFdKTtcbiAgICAgICAgaWYgKGRlZkNhcFsyXSAmJiBkZWZDYXBbMl0udG9Mb3dlckNhc2UgIT09ICd0cnVlJyAmJiBkZWZDYXBbMl0udG9Mb3dlckNhc2UgIT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyeU51bWJlciA9IHBhcnNlSW50KGRlZkNhcFsyXSk7XG4gICAgICAgICAgICBpZiAoaXNOYU4odHJ5TnVtYmVyKSkge1xuICAgICAgICAgICAgICAgIC8vICNkZWZpbmUgQ0NfU1VSRkFDRV9VU0VfVkVSVEVYX0NPTE9SIFVTRV9WRVJURVhfQ09MT1JcbiAgICAgICAgICAgICAgICBzdWJzdGl0dXRlTWFwLnNldChkZWZDYXBbMV0sIGRlZkNhcFsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZGVmQ2FwID0gcGxhaW5EZWZpbmVSRS5leGVjKGNvZGUpO1xuICAgIH1cbiAgICByZXR1cm4gW2RlZmluZXMsIHN1YnN0aXR1dGVNYXBdO1xufTtcblxuY29uc3QgZWxpbWluYXRlRGVhZENvZGUgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHNjb3BlUkUgPSAvW3t9KCldL2c7XG4gICAgY29uc3Qgc2lnUkUgPSAvKD86XFx3K3BcXHMrKT9cXHcrXFxzKyhcXHcrKVxccyokLzsgLy8gcHJlY2lzaW9uPyByZXR1cm5UeXBlIGZuTmFtZVxuICAgIGNvbnN0IHNwYWNlc1JFID0gL15cXHMqJC87XG4gICAgbGV0IG5hbWUgPSAnJztcbiAgICBsZXQgYmVnID0gMDtcbiAgICBsZXQgZW5kID0gMDtcbiAgICBjb25zdCByZWNvcmRCZWdpbiA9IChjb2RlLCBsZWZ0UGFyZW4pID0+IHtcbiAgICAgICAgY29uc3QgY2FwID0gY29kZS5zdWJzdHJpbmcoZW5kLCBsZWZ0UGFyZW4pLm1hdGNoKHNpZ1JFKSB8fCBbJycsICcnXTtcbiAgICAgICAgbmFtZSA9IGNhcFsxXTtcbiAgICAgICAgYmVnID0gbGVmdFBhcmVuIC0gY2FwWzBdLmxlbmd0aDtcbiAgICB9O1xuICAgIGNvbnN0IGdldEFsbENhcHR1cmVzID0gKGNvZGUsIFJFKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhcHMgPSBbXTtcbiAgICAgICAgbGV0IGNhcCA9IFJFLmV4ZWMoY29kZSk7XG4gICAgICAgIHdoaWxlIChjYXApIHtcbiAgICAgICAgICAgIGNhcHMucHVzaChjYXApO1xuICAgICAgICAgICAgY2FwID0gUkUuZXhlYyhjb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FwcztcbiAgICB9O1xuICAgIGNvbnN0IGxpdmVwb29sID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGFzY2Vuc2lvbiA9IChmdW5jdGlvbnMsIGlkeCkgPT4ge1xuICAgICAgICBpZiAobGl2ZXBvb2wuaGFzKGlkeCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsaXZlcG9vbC5hZGQoaWR4KTtcbiAgICAgICAgZm9yIChjb25zdCBkZXAgb2YgZnVuY3Rpb25zW2lkeF0uZGVwcykge1xuICAgICAgICAgICAgYXNjZW5zaW9uKGZ1bmN0aW9ucywgZGVwKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIChjb2RlLCBlbnRyeSwgZnVuY3Rpb25zKSA9PiB7XG4gICAgICAgIGxldCBkZXB0aCA9IDAsXG4gICAgICAgICAgICBzdGF0ZSA9IDAsXG4gICAgICAgICAgICBwYXJhbUxpc3RFbmQgPSAwO1xuICAgICAgICBlbmQgPSAwO1xuICAgICAgICBzY29wZVJFLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIGxpdmVwb29sLmNsZWFyKCk7XG4gICAgICAgIGNvbnN0IGZ1bmN0aW9uc0Z1bGwgPSBbXTtcbiAgICAgICAgLy8gZXh0cmFjdGlvblxuICAgICAgICBmb3IgKGNvbnN0IGN1ciBvZiBnZXRBbGxDYXB0dXJlcyhjb2RlLCBzY29wZVJFKSkge1xuICAgICAgICAgICAgY29uc3QgYyA9IGN1clswXTtcbiAgICAgICAgICAgIGlmIChkZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChjID09PSAnKCcpIHtcbiAgICAgICAgICAgICAgICAgICAgKHN0YXRlID0gMSksIHJlY29yZEJlZ2luKGNvZGUsIGN1ci5pbmRleCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RhdGUgPSAyKSwgKHBhcmFtTGlzdEVuZCA9IGN1ci5pbmRleCArIDEpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSAyICYmIHNwYWNlc1JFLnRlc3QoY29kZS5zdWJzdHJpbmcocGFyYW1MaXN0RW5kLCBjdXIuaW5kZXgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAzO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGMgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYyA9PT0gJ30nICYmIC0tZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVuZCA9IGN1ci5pbmRleCArIDE7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uc0Z1bGwucHVzaCh7IG5hbWUsIGJlZywgZW5kLCBwYXJhbUxpc3RFbmQsIGRlcHM6IFtdIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBpbnNwZWN0aW9uXG4gICAgICAgIGxldCBlbnRyeUlkeCA9IGZ1bmN0aW9uc0Z1bGwuZmluZEluZGV4KChmKSA9PiBmLm5hbWUgPT09IGVudHJ5KTtcbiAgICAgICAgaWYgKGVudHJ5SWR4IDwgMCkge1xuICAgICAgICAgICAgZXJyb3IoYEVGWDI0MDM6IGVudHJ5IGZ1bmN0aW9uICcke2VudHJ5fScgbm90IGZvdW5kLmApO1xuICAgICAgICAgICAgZW50cnlJZHggPSAwO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnVuY3Rpb25zRnVsbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZm4gPSBmdW5jdGlvbnNGdWxsW2ldO1xuICAgICAgICAgICAgY29uc3QgY2FwcyA9IGdldEFsbENhcHR1cmVzKGNvZGUsIG5ldyBSZWdFeHAoJ1xcXFxiJyArIGZuLm5hbWUgKyAnXFxcXGInLCAnZycpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2FwIG9mIGNhcHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBmdW5jdGlvbnNGdWxsLmZpbmRJbmRleCgoZikgPT4gY2FwLmluZGV4ID4gZi5iZWcgJiYgY2FwLmluZGV4IDwgZi5lbmQpO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPj0gMCAmJiB0YXJnZXQgIT09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25zRnVsbFt0YXJnZXRdLmRlcHMucHVzaChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXh0cmFjdCBhbGwgZnVuY3Rpb25zRnVsbCByZWFjaGFibGUgZnJvbSBtYWluXG4gICAgICAgIC8vIGFjdHVhbGx5IHRoaXMgZXZlbiB3b3JrcyB3aXRoIGZ1bmN0aW9uIG92ZXJsb2FkaW5nLCBhbGJlaXQgbm90IHRoZSBiZXN0IG91dHB1dCBwb3NzaWJsZTpcbiAgICAgICAgLy8gb3ZlcmxvYWRzIGZvciB0aGUgc2FtZSBmdW5jdGlvbiB3aWxsIGJlIGV4dHJhY3RlZCBhbGwgYXQgb25jZSBvciBub3QgYXQgYWxsXG4gICAgICAgIGFzY2Vuc2lvbihmdW5jdGlvbnNGdWxsLCBlbnRyeUlkeCk7XG4gICAgICAgIC8vIGVsaW1pbmF0aW9uXG4gICAgICAgIGxldCByZXN1bHQgPSAnJyxcbiAgICAgICAgICAgIHBvaW50ZXIgPSAwLFxuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmdW5jdGlvbnNGdWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkYyA9IGZ1bmN0aW9uc0Z1bGxbaV07XG4gICAgICAgICAgICBjb25zdCB7IG5hbWUsIGJlZywgZW5kIH0gPSBkYztcbiAgICAgICAgICAgIGlmIChsaXZlcG9vbC5oYXMoaSkgfHwgbmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IHBvc2l0aW9uIGFuZCBhZGQgdG8gZmluYWwgbGlzdFxuICAgICAgICAgICAgICAgIGRjLmJlZyAtPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgZGMuZW5kIC09IG9mZnNldDtcbiAgICAgICAgICAgICAgICBkYy5wYXJhbUxpc3RFbmQgLT0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9ucy5wdXNoKGRjKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCArPSBjb2RlLnN1YnN0cmluZyhwb2ludGVyLCBiZWcpO1xuICAgICAgICAgICAgcG9pbnRlciA9IGVuZDtcbiAgICAgICAgICAgIG9mZnNldCArPSBlbmQgLSBiZWc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdCArIGNvZGUuc3Vic3RyaW5nKHBvaW50ZXIpO1xuICAgIH07XG59KSgpO1xuXG5jb25zdCBwYXJzZUN1c3RvbUxhYmVscyA9IChhcnIsIG91dCA9IHt9KSA9PiB7XG4gICAgbGV0IHN0ciA9IGFyci5qb2luKCcgJyk7XG4gICAgbGV0IGxhYmVsQ2FwID0gbGFiZWxSRS5leGVjKHN0cik7XG4gICAgd2hpbGUgKGxhYmVsQ2FwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvdXRbbGFiZWxDYXBbMV1dID0geWFtbC5sb2FkKGxhYmVsQ2FwWzJdIHx8ICd0cnVlJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHdhcm4oYEVGWDIxMDI6IHBhcmFtZXRlciBmb3IgbGFiZWwgJyR7bGFiZWxDYXBbMV19JyBpcyBub3QgbGVnYWwgWUFNTDogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZyhsYWJlbENhcC5pbmRleCArIGxhYmVsQ2FwWzBdLmxlbmd0aCk7XG4gICAgICAgIGxhYmVsQ2FwID0gbGFiZWxSRS5leGVjKHN0cik7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIHNheSB3ZSBhcmUgZXh0cmFjdGluZyBmcm9tIHRoaXMgcHJvZ3JhbTpcbiAqIGBgYFxuICogICAgLy8gLi5cbiAqIDEyICNpZiBVU0VfTElHSFRJTkdcbiAqICAgICAgLy8gLi5cbiAqIDM0ICAgI2lmIE5VTV9MSUdIVFMgPiAwXG4gKiAgICAgICAgLy8gLi5cbiAqIDU2ICAgI2VuZGlmXG4gKiAgICAgIC8vIC4uXG4gKiA3OCAjZW5kaWZcbiAqICAgIC8vIC4uXG4gKiBgYGBcbiAqXG4gKiB0aGUgb3V0cHV0IHdvdWxkIGJlOlxuICogYGBgXG4gKiAvLyB0aGUgY29tcGxldGUgZGVmaW5lIGxpc3RcbiAqIGRlZmluZXMgPSBbXG4gKiAgIHsgbmFtZTogJ1VTRV9MSUdIVElORycsIHR5cGU6ICdib29sZWFuJywgZGVmaW5lczogW10gfSxcbiAqICAgeyBuYW1lOiAnTlVNX0xJR0hUUycsIHR5cGU6ICdudW1iZXInLCByYW5nZTogWzAsIDNdLCBkZWZpbmVzOiBbICdVU0VfTElHSFRJTkcnIF0gfVxuICogXVxuICogLy8gYm9va2tlZXBpbmc6IGRlZmluZSBkZXBlbmRlbmN5IHRocm91Z2hvdXQgdGhlIGNvZGVcbiAqIGNhY2hlID0ge1xuICogICBsaW5lczogWzEyLCAzNCwgNTYsIDc4XSxcbiAqICAgMTI6IFsgJ1VTRV9MSUdIVElORycgXSxcbiAqICAgMzQ6IFsgJ1VTRV9MSUdIVElORycsICdOVU1fTElHSFRTJyBdLFxuICogICA1NjogWyAnVVNFX0xJR0hUSU5HJyBdLFxuICogICA3ODogW11cbiAqIH1cbiAqIGBgYGBcbiAqL1xuY29uc3QgZ2V0RGVmcyA9IChsaW5lLCBjYWNoZSkgPT4ge1xuICAgIGxldCBpZHggPSBjYWNoZS5saW5lcy5maW5kSW5kZXgoKGkpID0+IGkgPiBsaW5lKTtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgICBpZHggPSBjYWNoZS5saW5lcy5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZVtjYWNoZS5saW5lc1tpZHggLSAxXV0gfHwgW107XG59O1xuXG5jb25zdCBwdXNoRGVmaW5lcyA9IChkZWZpbmVzLCBleGlzdGluZ0RlZmluZXMsIG5ld0RlZmluZSkgPT4ge1xuICAgIGlmIChleGlzdGluZ0RlZmluZXMuaGFzKG5ld0RlZmluZS5uYW1lKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlZmluZXMucHVzaChuZXdEZWZpbmUpO1xufTtcblxuY29uc3QgZXh0cmFjdERlZmluZXMgPSAodG9rZW5zLCBkZWZpbmVzLCBjYWNoZSkgPT4ge1xuICAgIGNvbnN0IGN1ckRlZnMgPSBbXSxcbiAgICAgICAgc2F2ZSA9IChsaW5lKSA9PiB7XG4gICAgICAgICAgICBjYWNoZVtsaW5lXSA9IGN1ckRlZnMucmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjLmNvbmNhdCh2YWwpLCBbXSk7XG4gICAgICAgICAgICBjYWNoZS5saW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9O1xuICAgIGxldCBlbGlmQ2xhdXNlcyA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHQgPSB0b2tlbnNbaV0sXG4gICAgICAgICAgICBzdHIgPSB0LmRhdGEsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGRmO1xuICAgICAgICBpZiAodC50eXBlICE9PSAncHJlcHJvY2Vzc29yJyB8fCBzdHIuc3RhcnRzV2l0aCgnI2V4dGVuc2lvbicpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzdHIgPSBzdHIuc3BsaXQoL1xccysvKTtcbiAgICAgICAgaWYgKHN0clswXSA9PT0gJyNlbmRpZicpIHtcbiAgICAgICAgICAgIC8vIHBvcCBvbmUgbGV2ZWwgdXBcbiAgICAgICAgICAgIHdoaWxlIChlbGlmQ2xhdXNlcyA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJEZWZzLnBvcCgpLCBlbGlmQ2xhdXNlcy0tO1xuICAgICAgICAgICAgfSAvLyBwb3AgYWxsIHRoZSBlbGlmc1xuICAgICAgICAgICAgY3VyRGVmcy5wb3AoKTtcbiAgICAgICAgICAgIHNhdmUodC5saW5lKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHN0clswXSA9PT0gJyNlbHNlJyB8fCBzdHJbMF0gPT09ICcjZWxpZicpIHtcbiAgICAgICAgICAgIC8vIGZsaXBcbiAgICAgICAgICAgIGNvbnN0IGRlZiA9IGN1ckRlZnNbY3VyRGVmcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGRlZiAmJiBkZWYuZm9yRWFjaCgoZCwgaSkgPT4gKGRlZltpXSA9IGRbMF0gPT09ICchJyA/IGQuc2xpY2UoMSkgOiAnIScgKyBkKSk7XG4gICAgICAgICAgICBzYXZlKHQubGluZSk7XG4gICAgICAgICAgICBpZiAoc3RyWzBdID09PSAnI2Vsc2UnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGlmQ2xhdXNlcysrO1xuICAgICAgICB9IGVsc2UgaWYgKHN0clswXSA9PT0gJyNwcmFnbWEnKSB7XG4gICAgICAgICAgICAvLyBwcmFnbWFzXG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyWzFdID09PSAnZGVmaW5lLW1ldGEnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIHNwZWNpZmljYXRpb25zXG4gICAgICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGggPD0gMikge1xuICAgICAgICAgICAgICAgICAgICB3YXJuKCdFRlgyMTAxOiBkZWZpbmUgcHJhZ21hOiBtaXNzaW5nIGluZm8nLCB0LmxpbmUpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWRlbnQubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoIWlkZW50LnRlc3Qoc3RyWzJdKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9IC8vIHNvbWUgY29uc3RhbnQgbWFjcm8gcmVwbGFjZWQgdGhpcyBvbmUsIHNraXBcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gY3VyRGVmcy5yZWR1Y2UoKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCksIFtdKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVmID0gZGVmaW5lcy5maW5kKChkKSA9PiBkLm5hbWUgPT09IHN0clsyXSk7XG4gICAgICAgICAgICAgICAgaWYgKCFkZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcHVzaERlZmluZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuZXhpc3RpbmdEZWZpbmVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgKGRlZiA9IHsgbmFtZTogc3RyWzJdLCB0eXBlOiAnYm9vbGVhbicsIGRlZmluZXM6IGQsIGR1bW15RGVwZW5kZW5jeTogdHJ1ZSB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IHBhcnNlQ3VzdG9tTGFiZWxzKHN0ci5zcGxpY2UoMykpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3JhbmdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbnVtYmVyIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWYudHlwZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJhbmdlID0gWzAsIDNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmLmZpeGVkVHlwZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcC5yYW5nZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXJuKGBFRlgyMTAzOiBpbnZhbGlkIHJhbmdlIGZvciBtYWNybyAnJHtkZWYubmFtZX0nYCwgdC5saW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJhbmdlID0gcHJvcC5yYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdvcHRpb25zJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RyaW5nIG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZi50eXBlID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWYub3B0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmLmZpeGVkVHlwZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcC5vcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhcm4oYEVGWDIxMDQ6IGludmFsaWQgb3B0aW9ucyBmb3IgbWFjcm8gJyR7ZGVmLm5hbWV9J2AsIHQubGluZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5vcHRpb25zID0gcHJvcC5vcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHByb3AuZGVmYXVsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLmRlZmF1bHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIGZhbHNlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYuZGVmYXVsdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi50eXBlID0gJ2NvbnN0YW50JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLmRlZmF1bHQgPSBwcm9wLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5maXhlZFR5cGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdlZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWYuZWRpdG9yID0gcHJvcC5lZGl0b3I7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuKGBFRlgyMTA1OiBkZWZpbmUgcHJhZ21hOiBpbGxlZ2FsIGxhYmVsICcke2tleX0nYCwgdC5saW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJbMV0gPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgICAgIHdhcm4oYEVGWDIxMDc6ICR7c3RyLnNsaWNlKDIpLmpvaW4oJyAnKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyWzFdID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IoYEVGWDIxMDg6ICR7c3RyLnNsaWNlKDIpLmpvaW4oJyAnKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gb3RoZXIgc3BlY2lmaWNhdGlvbnMsIHNhdmUgZm9yIGxhdGVyIHBhc3Nlc1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVscyA9IHBhcnNlQ3VzdG9tTGFiZWxzKHN0ci5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVscy5leHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXh0ZW5zaW9uIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuZXh0ZW5zaW9uc1tsYWJlbHMuZXh0ZW5zaW9uWzBdXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZXM6IGdldERlZnModC5saW5lLCBjYWNoZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kOiBsYWJlbHMuZXh0ZW5zaW9uWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IGxhYmVscy5leHRlbnNpb25bMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lQ29uZDogbGFiZWxzLmV4dGVuc2lvblszXSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZVt0LmxpbmVdID0gbGFiZWxzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKCEvIyhlbCk/aWYkLy50ZXN0KHN0clswXSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkZWZzID0gW107XG4gICAgICAgIGxldCBvckFwcGVhcmVkID0gZmFsc2U7XG4gICAgICAgIHN0ci5zcGxpY2UoMSkuc29tZSgocykgPT4ge1xuICAgICAgICAgICAgaWRlbnQubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGlkID0gaWRlbnQuZXhlYyhzKTtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIC8vIGlzIGlkZW50aWZpZXJcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGlkWzBdID09PSAnZGVmaW5lZCcgfHwgLy8gc2tpcCBtYWNyb3MgdGhhdCBjYW4gYmUgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIGlkWzBdLnN0YXJ0c1dpdGgoJ19fJykgfHwgLy8gc2tpcCBsYW5ndWFnZSBidWlsdGluIG1hY3Jvc1xuICAgICAgICAgICAgICAgICAgICBpZFswXS5zdGFydHNXaXRoKCdHTF8nKSB8fFxuICAgICAgICAgICAgICAgICAgICBpZFswXSA9PT0gJ1ZVTEtBTidcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBkID0gY3VyRGVmcy5yZWR1Y2UoKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCksIGRlZnMuc2xpY2UoKSk7XG4gICAgICAgICAgICAgICAgZGYgPSBkZWZpbmVzLmZpbmQoKGQpID0+IGQubmFtZSA9PT0gaWRbMF0pO1xuICAgICAgICAgICAgICAgIGlmIChkZikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmVlZFVwZGF0ZSA9IGQubGVuZ3RoIDwgZGYuZGVmaW5lcy5sZW5ndGg7IC8vIHVwZGF0ZSBwYXRoIGlmIHNob3J0ZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRmLmR1bW15RGVwZW5kZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKG5lZWRVcGRhdGUgPSB0cnVlKSwgZGVsZXRlIGRmLmR1bW15RGVwZW5kZW5jeTtcbiAgICAgICAgICAgICAgICAgICAgfSAvLyBvciBoYXZlIGEgZHVtbXlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZWRVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRmLmRlZmluZXMgPSBkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHVzaERlZmluZXMoZGVmaW5lcywgY2FjaGUuZXhpc3RpbmdEZWZpbmVzLCAoZGYgPSB7IG5hbWU6IGlkWzBdLCB0eXBlOiAnYm9vbGVhbicsIGRlZmluZXM6IGQgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZzLnB1c2goKHNbMF0gPT09ICchJyA/ICchJyA6ICcnKSArIGlkWzBdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGYgJiYgL15bPD0+XSskLy50ZXN0KHMpICYmICFkZi5maXhlZFR5cGUpIHtcbiAgICAgICAgICAgICAgICBkZi50eXBlID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgZGYucmFuZ2UgPSBbMCwgM107XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHMgPT09ICd8fCcpIHtcbiAgICAgICAgICAgICAgICBvckFwcGVhcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAob3JBcHBlYXJlZCkge1xuICAgICAgICAgICAgZGVmcyA9IFtdOyAvLyBvciBpcyBub3Qgc3VwcG9ydGVkLCBza2lwIGFsbFxuICAgICAgICB9XG4gICAgICAgIGN1ckRlZnMucHVzaChkZWZzKTtcbiAgICAgICAgc2F2ZSh0LmxpbmUpO1xuICAgIH1cbiAgICBkZWZpbmVzLmZvckVhY2goKGQpID0+IChkZWxldGUgZC5maXhlZFR5cGUsIGRlbGV0ZSBkLmR1bW15RGVwZW5kZW5jeSkpO1xufTtcblxuY29uc3QgZXh0cmFjdFVwZGF0ZVJhdGVzID0gKHRva2VucywgcmF0ZXMgPSBbXSkgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCB0ID0gdG9rZW5zW2ldLFxuICAgICAgICAgICAgc3RyID0gdC5kYXRhLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBkZjtcbiAgICAgICAgaWYgKHQudHlwZSAhPT0gJ3ByZXByb2Nlc3NvcicgfHwgc3RyLnN0YXJ0c1dpdGgoJyNleHRlbnNpb24nKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gc3RyLnNwbGl0KC9cXHMrLyk7XG4gICAgICAgIGlmIChzdHJbMF0gPT09ICcjcHJhZ21hJyAmJiBzdHIubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICBpZiAoc3RyWzFdID09PSAncmF0ZScpIHtcbiAgICAgICAgICAgICAgICByYXRlcy5wdXNoKHsgbmFtZTogc3RyWzJdLCByYXRlOiBzdHJbM10gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJhdGVzO1xufTtcblxuY29uc3QgZXh0cmFjdFVuZmlsdGVyYWJsZUZsb2F0ID0gKHRva2Vucywgc2FtcGxlVHlwZXMgPSBbXSkgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHQgPSB0b2tlbnNbaV07XG4gICAgICAgIGxldCBzdHIgPSB0LmRhdGE7XG4gICAgICAgIGlmICh0LnR5cGUgIT09ICdwcmVwcm9jZXNzb3InIHx8IHN0ci5zdGFydHNXaXRoKCcjZXh0ZW5zaW9uJykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHN0ciA9IHN0ci5zcGxpdCgvXFxzKy8pO1xuICAgICAgICBpZiAoc3RyWzBdID09PSAnI3ByYWdtYScgJiYgc3RyLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgaWYgKHN0clsxXSA9PT0gJ3VuZmlsdGVyYWJsZS1mbG9hdCcpIHtcbiAgICAgICAgICAgICAgICBzYW1wbGVUeXBlcy5wdXNoKHsgbmFtZTogc3RyWzJdLCBzYW1wbGVUeXBlOiAxIH0pOyAvLyBTYW1wbGVUeXBlLlVORklMVEVSQUJMRV9GTE9BVFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzYW1wbGVUeXBlcztcbn07XG5cbmNvbnN0IGV4dHJhY3RQYXJhbXMgPSAoKCkgPT4ge1xuICAgIC8vIHRva2VucyAoZnJvbSBpdGgpOiBbIC4uLiwgKCdoaWdocCcsICcgJywpICd2ZWM0JywgJyAnLCAnY29sb3InLCAoJ1snLCAnNCcsICddJywpIC4uLiBdXG4gICAgY29uc3QgcHJlY2lzaW9uID0gLyhsb3d8bWVkaXVtfGhpZ2gpcC87XG4gICAgY29uc3QgZXh0cmFjdEluZm8gPSAodG9rZW5zLCBpKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcmFtID0ge307XG4gICAgICAgIGNvbnN0IGRlZmluZWRQcmVjaXNpb24gPSBwcmVjaXNpb24uZXhlYyh0b2tlbnNbaV0uZGF0YSk7XG4gICAgICAgIGxldCBvZmZzZXQgPSBkZWZpbmVkUHJlY2lzaW9uID8gMiA6IDA7XG4gICAgICAgIHBhcmFtLm5hbWUgPSB0b2tlbnNbaSArIG9mZnNldCArIDJdLmRhdGE7XG4gICAgICAgIHBhcmFtLnR5cGVuYW1lID0gdG9rZW5zW2kgKyBvZmZzZXRdLmRhdGE7XG4gICAgICAgIHBhcmFtLnR5cGUgPSBjb252ZXJ0VHlwZSh0b2tlbnNbaSArIG9mZnNldF0uZGF0YSk7XG4gICAgICAgIHBhcmFtLmNvdW50ID0gMTtcbiAgICAgICAgaWYgKGRlZmluZWRQcmVjaXNpb24pIHtcbiAgICAgICAgICAgIHBhcmFtLnByZWNpc2lvbiA9IGRlZmluZWRQcmVjaXNpb25bMF0gKyAnICc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaGFuZGxlIGFycmF5IHR5cGVcbiAgICAgICAgaWYgKHRva2Vuc1sob2Zmc2V0ID0gbmV4dFdvcmQodG9rZW5zLCBpICsgb2Zmc2V0ICsgMikpXS5kYXRhID09PSAnWycpIHtcbiAgICAgICAgICAgIGxldCBleHByID0gJycsXG4gICAgICAgICAgICAgICAgZW5kID0gb2Zmc2V0O1xuICAgICAgICAgICAgd2hpbGUgKHRva2Vuc1srK2VuZF0uZGF0YSAhPT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgZXhwciArPSB0b2tlbnNbZW5kXS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoL15bXFxkK1xcLSovJVxcc10rJC8udGVzdChleHByKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbS5jb3VudCA9IGV2YWwoZXhwcik7XG4gICAgICAgICAgICAgICAgfSAvLyBhcml0aG1ldGljc1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGJ1aWx0aW5SRS50ZXN0KHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmNvdW50ID0gZXhwcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBleHByO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJhbS5pc0FycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjIwMjogJHtwYXJhbS5uYW1lfTogbm9uLWJ1aWx0aW4gYXJyYXkgbGVuZ3RoIG11c3QgYmUgY29tcGlsZS10aW1lIGNvbnN0YW50OiAke2V9YCwgdG9rZW5zW29mZnNldF0ubGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmFtO1xuICAgIH07XG4gICAgY29uc3Qgc3RyaXBEdXBsaWNhdGVzID0gKGFycikgPT4ge1xuICAgICAgICBjb25zdCBkaWN0ID0ge307XG4gICAgICAgIHJldHVybiBhcnIuZmlsdGVyKChlKSA9PiAoZGljdFtlXSA/IGZhbHNlIDogKGRpY3RbZV0gPSB0cnVlKSkpO1xuICAgIH07XG4gICAgY29uc3QgZXhNYXAgPSB7IHdoaXRlc3BhY2U6IHRydWUgfTtcbiAgICBjb25zdCBuZXh0V29yZCA9ICh0b2tlbnMsIGkpID0+IHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICB9IHdoaWxlIChleE1hcFt0b2tlbnNbaV0udHlwZV0pO1xuICAgICAgICByZXR1cm4gaTtcbiAgICB9O1xuICAgIGNvbnN0IG5leHRTZW1pY29sb24gPSAodG9rZW5zLCBpLCBjaGVjayA9ICh0KSA9PiB7IH0pID0+IHtcbiAgICAgICAgd2hpbGUgKHRva2Vuc1tpXS5kYXRhICE9PSAnOycpIHtcbiAgICAgICAgICAgIGNoZWNrKHRva2Vuc1tpKytdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaTtcbiAgICB9O1xuICAgIGNvbnN0IGlzRnVuY3Rpb25QYXJhbWV0ZXIgPSAoZnVuY3Rpb25zLCBwb3MpID0+IGZ1bmN0aW9ucy5zb21lKChmKSA9PiBwb3MgPiBmLmJlZyAmJiBwb3MgPCBmLnBhcmFtTGlzdEVuZCk7XG4gICAgY29uc3Qgbm9uQmxvY2tVbmlmb3JtcyA9IC90ZXh0dXJlfHNhbXBsZXJ8aW1hZ2V8c3VicGFzc0lucHV0LztcbiAgICByZXR1cm4gKHRva2VucywgY2FjaGUsIHNoYWRlckluZm8sIHN0YWdlLCBmdW5jdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgIGNvbnN0IGlzVmVydCA9IHN0YWdlID09PSAndmVydCc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgdCA9IHRva2Vuc1tpXSxcbiAgICAgICAgICAgICAgICBzdHIgPSB0LmRhdGEsXG4gICAgICAgICAgICAgICAgZGVzdCxcbiAgICAgICAgICAgICAgICB0eXBlO1xuICAgICAgICAgICAgaWYgKHN0ciA9PT0gJ3VuaWZvcm0nKSB7XG4gICAgICAgICAgICAgICAgKGRlc3QgPSBzaGFkZXJJbmZvLmJsb2NrcyksICh0eXBlID0gJ2Jsb2NrcycpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHIgPT09ICdpbicgJiYgIWlzRnVuY3Rpb25QYXJhbWV0ZXIoZnVuY3Rpb25zLCB0LnBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFnZSA9PT0gJ2NvbXB1dGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbXB1dGUgc2hhZGVyIGxvY2FsX3NpemUgZGVmaW5pdGlvbiwgc2tpcHBlZFxuICAgICAgICAgICAgICAgICAgICBpID0gbmV4dFdvcmQodG9rZW5zLCBpICsgMik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXN0ID0gaXNWZXJ0ID8gc2hhZGVySW5mby5hdHRyaWJ1dGVzIDogc2hhZGVySW5mby52YXJ5aW5ncztcbiAgICAgICAgICAgICAgICB0eXBlID0gaXNWZXJ0ID8gJ2F0dHJpYnV0ZXMnIDogJ3ZhcnlpbmdzJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyID09PSAnb3V0JyAmJiAhaXNGdW5jdGlvblBhcmFtZXRlcihmdW5jdGlvbnMsIHQucG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgZGVzdCA9IGlzVmVydCA/IHNoYWRlckluZm8udmFyeWluZ3MgOiBzaGFkZXJJbmZvLmZyYWdDb2xvcnM7XG4gICAgICAgICAgICAgICAgdHlwZSA9IGlzVmVydCA/ICd2YXJ5aW5ncycgOiAnZnJhZ0NvbG9ycyc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ciA9PT0gJ2J1ZmZlcicpIHtcbiAgICAgICAgICAgICAgICAoZGVzdCA9IHNoYWRlckluZm8uYnVmZmVycyksICh0eXBlID0gJ2J1ZmZlcnMnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkZWZpbmVzID0gZ2V0RGVmcyh0LmxpbmUsIGNhY2hlKSxcbiAgICAgICAgICAgICAgICBwYXJhbSA9IHt9O1xuICAgICAgICAgICAgLy8gdW5pZm9ybXNcbiAgICAgICAgICAgIHBhcmFtLnRhZ3MgPSBjYWNoZVt0LmxpbmUgLSAxXTsgLy8gcGFzcyBwcmFnbWEgdGFncyBmdXJ0aGVyXG4gICAgICAgICAgICBsZXQgaWR4ID0gbmV4dFdvcmQodG9rZW5zLCBpICsgMik7XG4gICAgICAgICAgICBpZiAodG9rZW5zW2lkeF0uZGF0YSAhPT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihwYXJhbSwgZXh0cmFjdEluZm8odG9rZW5zLCBpICsgMikpO1xuICAgICAgICAgICAgICAgIGlmIChkZXN0ID09PSBzaGFkZXJJbmZvLmJsb2Nrcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBzYW1wbGVyVGV4dHVyZXNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdVR5cGUgPSB0b2tlbnNbaSArIChwYXJhbS5wcmVjaXNpb24gPyA0IDogMildLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVUeXBlQ2FwID0gbm9uQmxvY2tVbmlmb3Jtcy5leGVjKHVUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1VHlwZUNhcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IoJ0VGWDIyMDE6IHZlY3RvciB1bmlmb3JtcyBtdXN0IGJlIGRlY2xhcmVkIGluIGJsb2Nrcy4nLCB0LmxpbmUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVUeXBlID09PSAnc2FtcGxlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3QgPSBzaGFkZXJJbmZvLnNhbXBsZXJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdzYW1wbGVycyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodVR5cGVDYXBbMF0gPT09ICdzYW1wbGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdCA9IHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdzYW1wbGVyVGV4dHVyZXMnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVUeXBlQ2FwWzBdID09PSAndGV4dHVyZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3QgPSBzaGFkZXJJbmZvLnRleHR1cmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICd0ZXh0dXJlcyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodVR5cGVDYXBbMF0gPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3QgPSBzaGFkZXJJbmZvLmltYWdlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSAnaW1hZ2VzJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1VHlwZUNhcFswXSA9PT0gJ3N1YnBhc3NJbnB1dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3QgPSBzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gJ3N1YnBhc3NJbnB1dHMnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSAvLyBvdGhlciBhdHRyaWJ1dGVzIG9yIHZhcnlpbmdzXG4gICAgICAgICAgICAgICAgaWR4ID0gbmV4dFNlbWljb2xvbih0b2tlbnMsIGlkeCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGJsb2Nrc1xuICAgICAgICAgICAgICAgIHBhcmFtLm5hbWUgPSB0b2tlbnNbaSArIDJdLmRhdGE7XG4gICAgICAgICAgICAgICAgcGFyYW0ubWVtYmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIHdoaWxlICh0b2tlbnNbKGlkeCA9IG5leHRXb3JkKHRva2VucywgaWR4KSldLmRhdGEgIT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzdCAhPT0gc2hhZGVySW5mby5idWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBuZWVkIHRvIHBhcnNlIFNTQk8gbWVtYmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGV4dHJhY3RJbmZvKHRva2VucywgaWR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXBwaW5ncy5pc1NhbXBsZXIoaW5mby50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKCdFRlgyMjA4OiB0ZXh0dXJlIHVuaWZvcm1zIG11c3QgYmUgZGVjbGFyZWQgb3V0c2lkZSBibG9ja3MuJywgdG9rZW5zW2lkeF0ubGluZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbS5tZW1iZXJzLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gbmV4dFNlbWljb2xvbih0b2tlbnMsIGlkeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHN0ZDE0MCBzcGVjaWZpYyBjaGVja3NcbiAgICAgICAgICAgICAgICBwYXJhbS5tZW1iZXJzLnJlZHVjZSgoYWNjLCBjdXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJhc2VBbGlnbm1lbnQgPSBtYXBwaW5ncy5HZXRUeXBlU2l6ZShjdXIudHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY3VyLnR5cGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtYXQyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlQWxpZ25tZW50IC89IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtYXQzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlQWxpZ25tZW50IC89IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtYXQ0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlQWxpZ25tZW50IC89IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ci5jb3VudCA+IDEgJiYgYmFzZUFsaWdubWVudCA8IDE2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlTXNnID0gYHVuaWZvcm0gJHtjb252ZXJ0VHlwZShjdXIudHlwZSl9ICR7Y3VyLm5hbWV9WyR7Y3VyLmNvdW50fV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IoJ0VGWDIyMDM6ICcgKyB0eXBlTXNnICsgJzogYXJyYXkgVUJPIG1lbWJlcnMgbmVlZCB0byBiZSAxNi1ieXRlcy1hbGlnbmVkIHRvIGF2b2lkIGltcGxpY2l0IHBhZGRpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VBbGlnbm1lbnQgPSAxNjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChiYXNlQWxpZ25tZW50ID09PSAxMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZU1zZyA9IGB1bmlmb3JtICR7Y29udmVydFR5cGUoY3VyLnR5cGUpfSAke2N1ci5uYW1lfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcignRUZYMjIwNDogJyArIHR5cGVNc2cgKyAnOiBwbGVhc2UgdXNlIDEsIDIgb3IgNC1jb21wb25lbnQgdmVjdG9ycyB0byBhdm9pZCBpbXBsaWNpdCBwYWRkaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlQWxpZ25tZW50ID0gMTY7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWFwcGluZ3MuaXNQYWRkZWRNYXRyaXgoY3VyLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlTXNnID0gYHVuaWZvcm0gJHtjb252ZXJ0VHlwZShjdXIudHlwZSl9ICR7Y3VyLm5hbWV9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKCdFRlgyMjEwOiAnICsgdHlwZU1zZyArICc6IHVzZSBvbmx5IDR4NCBtYXRyaWNlcyB0byBhdm9pZCBpbXBsaWNpdCBwYWRkaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpZ25lZE9mZnNldCA9IE1hdGguY2VpbChhY2MgLyBiYXNlQWxpZ25tZW50KSAqIGJhc2VBbGlnbm1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltcGxpY2l0UGFkZGluZyA9IGFsaWduZWRPZmZzZXQgLSBhY2M7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbXBsaWNpdFBhZGRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFRlgyMjA1OiBVQk8gJyR7cGFyYW0ubmFtZX0nIGludHJvZHVjZXMgaW1wbGljaXQgcGFkZGluZzogYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7aW1wbGljaXRQYWRkaW5nfSBieXRlcyBiZWZvcmUgJyR7Y3VyLm5hbWV9JywgY29uc2lkZXIgcmUtb3JkZXJpbmcgdGhlIG1lbWJlcnNgLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxpZ25lZE9mZnNldCArIGJhc2VBbGlnbm1lbnQgKiBjdXIuY291bnQ7IC8vIGJhc2Ugb2Zmc2V0IGZvciB0aGUgbmV4dCBtZW1iZXJcbiAgICAgICAgICAgICAgICB9LCAwKTsgLy8gdG9wIGxldmVsIFVCT3MgaGF2ZSBhIGJhc2Ugb2Zmc2V0IG9mIHplcm9cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3IgcHJlcHJvY2Vzc29ycyBpbnNpZGUgYmxvY2tzXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlID0gY2FjaGUubGluZXMuZmluZCgobCkgPT4gbCA+PSB0b2tlbnNbaV0ubGluZSAmJiBsIDwgdG9rZW5zW2lkeF0ubGluZSk7XG4gICAgICAgICAgICAgICAgaWYgKHByZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjIwNjogJHtwYXJhbS5uYW1lfTogbm8gcHJlcHJvY2Vzc29ycyBhbGxvd2VkIGluc2lkZSB1bmlmb3JtIGJsb2NrcyFgLCBwcmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3RydWN0IG1lbWJlcnNcbiAgICAgICAgICAgICAgICBwYXJhbS5tZW1iZXJzLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbmZvLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgRUZYMjIxMTogJyR7aW5mby50eXBlfSAke2luZm8ubmFtZX0nIGluIGJsb2NrICcke3BhcmFtLm5hbWV9JzogYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0cnVjdC10eXBlZCBtZW1iZXIgd2l0aGluIFVCT3MgaXMgbm90IHN1cHBvcnRlZCBkdWUgdG8gY29tcGF0aWJpbGl0eSByZWFzb25zLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zW2lkeF0ubGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZHggPSBuZXh0V29yZCh0b2tlbnMsIGlkeCk7XG4gICAgICAgICAgICAgICAgaWYgKHRva2Vuc1tpZHhdLmRhdGEgIT09ICc7Jykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdFRlgyMjA5OiBCbG9jayBkZWNsYXJhdGlvbnMgbXVzdCBiZSBzZW1pY29sb24tdGVybWluYXRlZO+8jG5vbi1hcnJheS10eXBlZCBhbmQgaW5zdGFuY2UtbmFtZS1mcmVlLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGBQbGVhc2UgY2hlY2sgeW91ciAnJHtwYXJhbS5uYW1lfScgYmxvY2sgZGVjbGFyYXRpb24uYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vuc1tpZHhdLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGR1cGxpY2F0ZXNcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBkZXN0LmZpbmQoKGkpID0+IGkubmFtZSA9PT0gcGFyYW0ubmFtZSk7XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbS5tZW1iZXJzICYmIEpTT04uc3RyaW5naWZ5KGl0ZW0ubWVtYmVycykgIT09IEpTT04uc3RyaW5naWZ5KHBhcmFtLm1lbWJlcnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGBFRlgyMjA3OiBkaWZmZXJlbnQgVUJPIHVzaW5nIHRoZSBzYW1lIG5hbWUgJyR7cGFyYW0ubmFtZX0nYCwgdC5saW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaXRlbS5zdGFnZUZsYWdzIHw9IG1hcFNoYWRlclN0YWdlKHN0YWdlKTtcbiAgICAgICAgICAgICAgICBwYXJhbS5kdXBsaWNhdGUgPSBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGJlZyA9IGk7XG4gICAgICAgICAgICBpZiAoZGVzdCA9PT0gc2hhZGVySW5mby5idWZmZXJzIHx8IGRlc3QgPT09IHNoYWRlckluZm8uaW1hZ2VzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW0ubWVtb3J5QWNjZXNzID0gbWFwcGluZ3MuZ2V0TWVtb3J5QWNjZXNzRmxhZyh0b2tlbnNbaSAtIDJdLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmICgvd3JpdGVvbmx5fHJlYWRvbmx5Ly50ZXN0KHRva2Vuc1tpIC0gMl0uZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnID0gaSAtIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2goeyBiZWc6IHRva2Vuc1tiZWddLnBvc2l0aW9uLCBlbmQ6IHRva2Vuc1tpZHhdLnBvc2l0aW9uLCBwYXJhbTogcGFyYW0uZHVwbGljYXRlIHx8IHBhcmFtLCB0eXBlIH0pO1xuICAgICAgICAgICAgaWYgKCFwYXJhbS5kdXBsaWNhdGUpIHtcbiAgICAgICAgICAgICAgICBwYXJhbS5kZWZpbmVzID0gc3RyaXBEdXBsaWNhdGVzKGRlZmluZXMpO1xuICAgICAgICAgICAgICAgIHBhcmFtLnN0YWdlRmxhZ3MgPSBtYXBTaGFkZXJTdGFnZShzdGFnZSk7XG4gICAgICAgICAgICAgICAgZGVzdC5wdXNoKHBhcmFtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG5vdyB3ZSBhcmUgZG9uZSB3aXRoIHRoZSB3aG9sZSBleHByZXNzaW9uXG4gICAgICAgICAgICBpID0gaWR4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbn0pKCk7XG5cbmNvbnN0IG1pc2NDaGVja3MgPSAoKCkgPT4ge1xuICAgIC8vIG1vc3RseSBmcm9tIGdsc2wgMTAwIHNwZWMsIGV4Y2VwdDpcbiAgICAvLyAndGV4dHVyZScgaXMgcmVzZXJ2ZWQgb24gYW5kcm9pZCBkZXZpY2VzIHdpdGggcmVsYXRpdmVseSBuZXcgR1BVc1xuICAgIC8vIHVzYWdlIGFzIGFuIGlkZW50aWZpZXIgd2lsbCBsZWFkIHRvIHJ1bnRpbWUgY29tcGlsYXRpb24gZmFpbHVyZTpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGVkcm9TRzk0L3J0bXAtcnRzcC1zdHJlYW0tY2xpZW50LWphdmEvaXNzdWVzLzE0NlxuICAgIGNvbnN0IHJlc2VydmVkS2V5d29yZHMgPVxuICAgICAgICAnYXNtfGNsYXNzfHVuaW9ufGVudW18dHlwZWRlZnx0ZW1wbGF0ZXx0aGlzfHBhY2tlZHxnb3RvfHN3aXRjaHxkZWZhdWx0fGlubGluZXxub2lubGluZXx2b2xhdGlsZXwnICtcbiAgICAgICAgJ3B1YmxpY3xzdGF0aWN8ZXh0ZXJufGV4dGVybmFsfGludGVyZmFjZXxmbGF0fGxvbmd8c2hvcnR8ZG91YmxlfGhhbGZ8Zml4ZWR8dW5zaWduZWR8c3VwZXJwfGlucHV0fCcgK1xuICAgICAgICAnb3V0cHV0fGh2ZWMyfGh2ZWMzfGh2ZWM0fGR2ZWMyfGR2ZWMzfGR2ZWM0fGZ2ZWMyfGZ2ZWMzfGZ2ZWM0fHNhbXBsZXIxRHxzYW1wbGVyM0R8c2FtcGxlcjFEU2hhZG93fCcgK1xuICAgICAgICAnc2FtcGxlcjJEU2hhZG93fHNhbXBsZXIyRFJlY3R8c2FtcGxlcjNEUmVjdHxzYW1wbGVyMkRSZWN0U2hhZG93fHNpemVvZnxjYXN0fG5hbWVzcGFjZXx1c2luZ3x0ZXh0dXJlJztcbiAgICBjb25zdCBrZXl3b3JkUkUgPSBuZXcgUmVnRXhwKGBcXFxcYig/OiR7cmVzZXJ2ZWRLZXl3b3Jkc30pXFxcXGJgKTtcbiAgICBjb25zdCBwcmVjaXNpb25SRSA9IC9wcmVjaXNpb25cXHMrKGxvd3xtZWRpdW18aGlnaClwXFxzKyhcXHcrKS87XG4gICAgcmV0dXJuIChjb2RlKSA9PiB7XG4gICAgICAgIC8vIHByZWNpc2lvbiBkZWNsYXJhdGlvbiBjaGVja1xuICAgICAgICBjb25zdCBjYXAgPSBwcmVjaXNpb25SRS5leGVjKGNvZGUpO1xuICAgICAgICBpZiAoY2FwKSB7XG4gICAgICAgICAgICBpZiAoLyNleHRlbnNpb24vLnRlc3QoY29kZS5zbGljZShjYXAuaW5kZXgpKSkge1xuICAgICAgICAgICAgICAgIHdhcm4oJ0VGWDI0MDA6IHByZWNpc2lvbiBkZWNsYXJhdGlvbiBzaG91bGQgY29tZSBhZnRlciBleHRlbnNpb25zJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3YXJuKCdFRlgyNDAxOiBwcmVjaXNpb24gZGVjbGFyYXRpb24gbm90IGZvdW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc0NhcCA9IGtleXdvcmRSRS5leGVjKGNvZGUpO1xuICAgICAgICBpZiAocmVzQ2FwKSB7XG4gICAgICAgICAgICBlcnJvcihgRUZYMjQwMjogdXNpbmcgcmVzZXJ2ZWQga2V5d29yZCBpbiBnbHNsMTogJHtyZXNDYXBbMF19YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlIHBhcnNlciB0aHJvd3Mgb2JzY3VyZSBlcnJvcnMgd2hlbiBlbmNvdW50ZXJzIHNvbWUgc2VtYW50aWMgZXJyb3JzLFxuICAgICAgICAvLyBzbyBpbiBzb21lIHNpdHVhdGlvbiBkaXNhYmxpbmcgdGhpcyBtaWdodCBiZSBhIGJldHRlciBvcHRpb25cbiAgICAgICAgaWYgKG9wdGlvbnMuc2tpcFBhcnNlclRlc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBBU1QgYmFzZWQgY2hlY2tzXG4gICAgICAgIGNvbnN0IHRva2VucyA9IHRva2VuaXplcihjb2RlKS5maWx0ZXIoKHQpID0+IHQudHlwZSAhPT0gJ3ByZXByb2Nlc3NvcicpO1xuICAgICAgICBzaGFkZXJUb2tlbnMgPSB0b2tlbnM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYXJzZXIodG9rZW5zKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZXJyb3IoYEVGWDI0MDQ6IGdsc2wxIHBhcnNlciBmYWlsZWQ6ICR7ZX1gLCAwKTtcbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5jb25zdCBmaW5hbFR5cGVDaGVjayA9ICgoKSA9PiB7XG4gICAgbGV0IGdsID0gcmVxdWlyZSgnZ2wnKSgzMDAsIDE1MCwgeyBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6IHRydWUgfSk7XG4gICAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9ucyA9IGdsLmdldFN1cHBvcnRlZEV4dGVuc2lvbnMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSAhPT0gc3VwcG9ydGVkRXh0ZW5zaW9ucy5sZW5ndGg7ICsraSkge1xuICAgICAgICBnbC5nZXRFeHRlbnNpb24oc3VwcG9ydGVkRXh0ZW5zaW9uc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IGdldERlZmluZVN0cmluZyA9IChkZWZpbmVzKSA9PlxuICAgICAgICBkZWZpbmVzLnJlZHVjZSgoYWNjLCBjdXIpID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IDE7IC8vIGVuYWJsZSBhbGwgYm9vbGVhbiBzd2l0aGNlc1xuICAgICAgICAgICAgc3dpdGNoIChjdXIudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY3VyLm9wdGlvbnNbMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY3VyLnJhbmdlWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjb25zdGFudCc6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY3VyLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGN1ci5kZWZhdWx0ID09PSB1bmRlZmluZWQgPyAxIDogY3VyLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGAke2FjY30jZGVmaW5lICR7Y3VyLm5hbWV9ICR7dmFsdWV9XFxuYDtcbiAgICAgICAgfSwgJycpO1xuICAgIGNvbnN0IGNvbXBpbGUgPSAoc291cmNlLCB0eXBlKSA9PiB7XG4gICAgICAgIGxldCBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGxldCBsaW5lTnVtYmVyID0gMTtcbiAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBzb3VyY2UucmVwbGFjZSgvXnxcXG4vZywgKCkgPT4gYFxcbiR7bGluZU51bWJlcisrfSBgKTtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcbiAgICAgICAgICAgIGdsLmRlbGV0ZVNoYWRlcihzaGFkZXIpO1xuICAgICAgICAgICAgc2hhZGVyID0gbnVsbDtcbiAgICAgICAgICAgIGVycm9yKGBFRlgyNDA2OiBjb21waWxhdGlvbiBmYWlsZWQ6IOKGk+KGk+KGk+KGk+KGkyBFWFBBTkQgVEhJUyBNRVNTQUdFIEZPUiBNT1JFIElORk8g4oaT4oaT4oaT4oaT4oaTXFxuJHtlcnJ9XFxuJHtkdW1wfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgfTtcbiAgICBjb25zdCBsaW5rID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgbGV0IHByb2cgPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIGFyZ3MuZm9yRWFjaCgocykgPT4gZ2wuYXR0YWNoU2hhZGVyKHByb2csIHMpKTtcbiAgICAgICAgZ2wubGlua1Byb2dyYW0ocHJvZyk7XG4gICAgICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9nLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2cpO1xuICAgICAgICAgICAgZ2wuZGVsZXRlUHJvZ3JhbShwcm9nKTtcbiAgICAgICAgICAgIHByb2cgPSBudWxsO1xuICAgICAgICAgICAgZXJyb3IoYEVGWDI0MDc6IGxpbmsgZmFpbGVkOiAke2Vycn1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvZztcbiAgICB9O1xuICAgIHJldHVybiAodmVydCwgZnJhZywgZGVmaW5lcywgdmVydE5hbWUsIGZyYWdOYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9ICcjdmVyc2lvbiAxMDBcXG4nICsgZ2V0RGVmaW5lU3RyaW5nKGRlZmluZXMpO1xuICAgICAgICBzaGFkZXJOYW1lID0gdmVydE5hbWU7XG4gICAgICAgIGNvbnN0IHZzID0gY29tcGlsZShwcmVmaXggKyB2ZXJ0LCBnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgc2hhZGVyTmFtZSA9IGZyYWdOYW1lO1xuICAgICAgICBjb25zdCBmcyA9IGNvbXBpbGUocHJlZml4ICsgZnJhZywgZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgICAgICAgc2hhZGVyTmFtZSA9ICdsaW5raW5nJztcbiAgICAgICAgY29uc3QgcHJvZyA9IGxpbmsodnMsIGZzKTtcbiAgICAgICAgZ2wuZGVsZXRlUHJvZ3JhbShwcm9nKTtcbiAgICAgICAgZ2wuZGVsZXRlU2hhZGVyKGZzKTtcbiAgICAgICAgZ2wuZGVsZXRlU2hhZGVyKHZzKTtcbiAgICB9O1xufSkoKTtcblxuY29uc3Qgc3RyaXBUb1NwZWNpZmljVmVyc2lvbiA9ICgoKSA9PiB7XG4gICAgY29uc3QgZ2xvYmFsU2VhcmNoID0gLyMoaWZ8ZWxpZnxlbHNlfGVuZGlmKSguKik/L2c7XG4gICAgY29uc3QgbGVnYWxFeHByID0gL15bXFxkPD0+IXwmXlxcc10qKF9fVkVSU0lPTl9fKT9bXFxkPD0+IXwmXlxcc10qJC87IC8vIGFsbCBjb21waWxlLXRpbWUgY29uc3RhbnQgYnJhbmNoZXNcbiAgICBjb25zdCBtYWNyb1dyYXAgPSAoc3JjLCBydW50aW1lQ29uZCwgZGVmaW5lcykgPT4ge1xuICAgICAgICAvKiAqL1xuICAgICAgICByZXR1cm4gcnVudGltZUNvbmQgPyBgI2lmICR7cnVudGltZUNvbmR9XFxuJHtzcmN9I2VuZGlmXFxuYCA6IHNyYztcbiAgICAgICAgLyogbm90IG5vdywgbWF5YmUuIHRoZSBtYWNybyBkZXBlbmRlbmN5IGV4dHJhY3Rpb24gaXMgc3RpbGwgdG9vIGZyYWdpbGUgKlxuICAgICAgICBjb25zdCBtYWNyb3MgPSBkZWZpbmVzLnJlZHVjZSgoYWNjLCBjdXIpID0+IGAke2FjY30gJiYgJHtjdXJ9YCwgJycpLnNsaWNlKDQpO1xuICAgICAgICByZXR1cm4gbWFjcm9zID8gYCNpZiAke21hY3Jvc31cXG4ke3NyY30jZW5kaWZcXG5gIDogc3JjO1xuICAgICAgICAvKiAqL1xuICAgIH07XG4gICAgY29uc3QgZGVjbGFyZUV4dGVuc2lvbiA9IChleHQsIGxldmVsKSA9PiB7XG4gICAgICAgIGlmIChsZXZlbCA9PT0gJ3JlcXVpcmUnKSB7XG4gICAgICAgICAgICByZXR1cm4gYCNleHRlbnNpb24gJHtleHR9OiByZXF1aXJlXFxuYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYFxcbiNpZmRlZiAke2V4dH1cXG4jZXh0ZW5zaW9uICR7ZXh0fTogZW5hYmxlXFxuI2VuZGlmXFxuYDtcbiAgICB9O1xuICAgIHJldHVybiAoY29kZSwgdmVyc2lvbiwgZXh0ZW5zaW9ucywgaXNWZXJ0KSA9PiB7XG4gICAgICAgIGlmICh2ZXJzaW9uIDwgMzEwKSB7XG4gICAgICAgICAgICAvLyBrZWVwIHN0ZDE0MCBkZWNsYXJhdGlvbiwgZGlzY2FyZCBvdGhlcnNcbiAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL2xheW91dFxccypcXCgoLio/KVxcKShcXHMqKShcXHcrKVxccysoXFx3KykvZywgKF8sIHRva2VucywgdHJhaWxpbmdTcGFjZXMsIHR5cGUsIHVUeXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZlcnQgJiYgdHlwZSA9PT0gJ291dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF87XG4gICAgICAgICAgICAgICAgfSAvLyBrZWVwIERyYXcgQnVmZmVyIGxvY2F0aW9uc1xuICAgICAgICAgICAgICAgIGlmICh0eXBlICE9PSAnb3V0JyAmJiB0eXBlICE9PSAnaW4nICYmIHR5cGUgIT09ICd1bmlmb3JtJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXztcbiAgICAgICAgICAgICAgICB9IC8vIGtlZXAgU3RvcmFnZSBCdWZmZXIgYmluZGluZ3NcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3VuaWZvcm0nICYmIHVUeXBlLmluY2x1ZGVzKCdpbWFnZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfO1xuICAgICAgICAgICAgICAgIH0gLy8ga2VlcCBTdG9yYWdlIEltYWdlIGJpbmRpbmdzXG4gICAgICAgICAgICAgICAgY29uc3QgZGVjbCA9IHRva2Vucy5pbmRleE9mKCdzdGQxNDAnKSA+PSAwID8gJ2xheW91dChzdGQxNDApJyArIHRyYWlsaW5nU3BhY2VzICsgdHlwZSA6IHR5cGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke2RlY2x9ICR7dVR5cGV9YDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV4dHJhY3Rpb25cbiAgICAgICAgY29uc3QgaW5zdGFuY2VzID0gW107XG4gICAgICAgIGxldCBjYXAgPSBudWxsLFxuICAgICAgICAgICAgdGVtcCA9IG51bGw7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSAqL1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgY2FwID0gZ2xvYmFsU2VhcmNoLmV4ZWMoY29kZSk7XG4gICAgICAgICAgICBpZiAoIWNhcCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNhcFsxXSA9PT0gJ2lmJykge1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXAubGV2ZWwrKztcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghbGVnYWxFeHByLnRlc3QoY2FwWzJdKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGVtcCA9IHsgc3RhcnQ6IGNhcC5pbmRleCwgZW5kOiBjYXAuaW5kZXgsIGNvbmRzOiBbY2FwWzJdXSwgY29udGVudDogW2NhcC5pbmRleCArIGNhcFswXS5sZW5ndGhdLCBsZXZlbDogMSB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjYXBbMV0gPT09ICdlbGlmJykge1xuICAgICAgICAgICAgICAgIGlmICghdGVtcCB8fCB0ZW1wLmxldmVsID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFsZWdhbEV4cHIudGVzdChjYXBbMl0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGBFRlgyMzAxOiAjZWxpZiBjb25kaXRpb25zIGFmdGVyIGEgY29uc3RhbnQgI2lmIHNob3VsZCBiZSBjb25zdGFudCB0b287IGdldCAnJHtjYXBbMl19J2ApO1xuICAgICAgICAgICAgICAgICAgICBjYXBbMl0gPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGVtcC5jb25kcy5wdXNoKGNhcFsyXSk7XG4gICAgICAgICAgICAgICAgdGVtcC5jb250ZW50LnB1c2goY2FwLmluZGV4LCBjYXAuaW5kZXggKyBjYXBbMF0ubGVuZ3RoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FwWzFdID09PSAnZWxzZScpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlbXAgfHwgdGVtcC5sZXZlbCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRlbXAuY29uZHMucHVzaCgndHJ1ZScpO1xuICAgICAgICAgICAgICAgIHRlbXAuY29udGVudC5wdXNoKGNhcC5pbmRleCwgY2FwLmluZGV4ICsgY2FwWzBdLmxlbmd0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNhcFsxXSA9PT0gJ2VuZGlmJykge1xuICAgICAgICAgICAgICAgIGlmICghdGVtcCB8fCAtLXRlbXAubGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRlbXAuY29udGVudC5wdXNoKGNhcC5pbmRleCk7XG4gICAgICAgICAgICAgICAgdGVtcC5lbmQgPSBjYXAuaW5kZXggKyBjYXBbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlcy5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIHRlbXAgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXMgPSBjb2RlO1xuICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIHJlcyA9IHJlcy5zdWJzdHJpbmcoMCwgaW5zdGFuY2VzWzBdLnN0YXJ0KTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5zdGFuY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5zID0gaW5zdGFuY2VzW2pdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zLmNvbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmFsKGlucy5jb25kc1tpXS5yZXBsYWNlKCdfX1ZFUlNJT05fXycsIHZlcnNpb24pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ViQmxvY2sgPSBjb2RlLnN1YnN0cmluZyhpbnMuY29udGVudFtpICogMl0sIGlucy5jb250ZW50W2kgKiAyICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IHN0cmlwVG9TcGVjaWZpY1ZlcnNpb24oc3ViQmxvY2ssIHZlcnNpb24sIGlzVmVydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gKGluc3RhbmNlc1tqICsgMV0gJiYgaW5zdGFuY2VzW2ogKyAxXS5zdGFydCkgfHwgY29kZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmVzICs9IGNvZGUuc3Vic3RyaW5nKGlucy5lbmQsIG5leHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGV4dGVuc2lvbnNcbiAgICAgICAgZm9yIChjb25zdCBleHQgaW4gZXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZpbmVzLCBjb25kLCBsZXZlbCwgcnVudGltZUNvbmQgfSA9IGV4dGVuc2lvbnNbZXh0XTtcbiAgICAgICAgICAgIGlmIChldmFsKGNvbmQucmVwbGFjZSgnX19WRVJTSU9OX18nLCB2ZXJzaW9uKSkpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBtYWNyb1dyYXAoZGVjbGFyZUV4dGVuc2lvbihleHQsIGxldmVsKSwgcnVudGltZUNvbmQsIGRlZmluZXMpICsgcmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbn0pKCk7XG5cbmNvbnN0IGdsc2wzMDB0bzEwMCA9IChjb2RlLCBibG9ja3MsIGRlZmluZXMsIHBhcmFtSW5mbywgZnVuY3Rpb25zLCBjYWNoZSwgdmVydCkgPT4ge1xuICAgIGxldCByZXMgPSAnJztcbiAgICAvLyB1bnBhY2sgVUJPc1xuICAgIGxldCBpZHggPSAwO1xuICAgIHBhcmFtSW5mby5mb3JFYWNoKChpKSA9PiB7XG4gICAgICAgIGlmIChpLnR5cGUgIT09ICdibG9ja3MnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVzICs9IGNvZGUuc2xpY2UoaWR4LCBpLmJlZyk7XG4gICAgICAgIGNvbnN0IGluZGVudENvdW50ID0gcmVzLmxlbmd0aCAtIHJlcy5zZWFyY2goL1xccyokLykgKyAxO1xuICAgICAgICBibG9ja3NcbiAgICAgICAgICAgIC5maW5kKCh1KSA9PiB1Lm5hbWUgPT09IGkucGFyYW0ubmFtZSlcbiAgICAgICAgICAgIC5tZW1iZXJzLmZvckVhY2goKG0pID0+IHtcbiAgICAgICAgICAgICAgICAvLyBjcnVjaWFsIG9wdGltaXphdGlvbiwgZm9yIHRoZSB1bmlmb3JtIHZlY3RvcnMgaW4gV2ViR0wgKGlPUyBlc3BlY2lhbGx5KSBpcyBleHRyZW1lbHkgbGltaXRlZFxuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBjb2RlLm1hdGNoKG5ldyBSZWdFeHAoYFxcXFxiJHttLm5hbWV9XFxcXGJgLCAnZycpKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZXMgfHwgbWF0Y2hlcy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBjb252ZXJ0VHlwZShtLnR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWNpc2lvbiA9IG0ucHJlY2lzaW9uIHx8ICcnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFycmF5U3BlYyA9IHR5cGVvZiBtLmNvdW50ID09PSAnc3RyaW5nJyB8fCBtLmlzQXJyYXkgPyBgWyR7bS5jb3VudH1dYCA6ICcnO1xuICAgICAgICAgICAgICAgIHJlcyArPSAnICcucmVwZWF0KGluZGVudENvdW50KSArIGB1bmlmb3JtICR7cHJlY2lzaW9ufSR7dHlwZX0gJHttLm5hbWV9JHthcnJheVNwZWN9O1xcbmA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWR4ID0gaS5lbmQgKyAoY29kZVtpLmVuZF0gPT09ICc7Jyk7XG4gICAgfSk7XG4gICAgcmVzICs9IGNvZGUuc2xpY2UoaWR4KTtcbiAgICAvLyB0ZXh0dXJlIGZ1bmN0aW9uc1xuICAgIHJlcyA9IHJlcy5yZXBsYWNlKC9cXGJ0ZXh0dXJlKCg/ITJEfEN1YmUpXFx3KilcXHMqXFwoXFxzKihcXHcrKVxccyooWyxbXSkvZywgKG9yaWdpbmFsLCBzdWZmaXgsIG5hbWUsIGVuZFRva2VuLCBpZHgpID0+IHtcbiAgICAgICAgLy8gc2tpcCByZXBsYWNlbWVudCBpZiBmdW5jdGlvbiBhbHJlYWR5IGRlZmluZWRcbiAgICAgICAgY29uc3QgZm5OYW1lID0gJ3RleHR1cmUnICsgc3VmZml4O1xuICAgICAgICBpZiAoZnVuY3Rpb25zLmZpbmQoKGYpID0+IGYubmFtZSA9PT0gZm5OYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZpbmQgaW4gcGFyZW50IHNjb3BlIGZpcnN0XG4gICAgICAgIGxldCByZSA9IG5ldyBSZWdFeHAoJ3NhbXBsZXIoXFxcXHcrKVxcXFxzKycgKyBuYW1lKTtcbiAgICAgICAgY29uc3Qgc2NvcGUgPSBmdW5jdGlvbnMuZmluZCgoZikgPT4gaWR4ID4gZi5iZWcgJiYgaWR4IDwgZi5lbmQpO1xuICAgICAgICBsZXQgY2FwID0gKHNjb3BlICYmIHJlLmV4ZWMocmVzLnN1YnN0cmluZyhzY29wZS5iZWcsIHNjb3BlLmVuZykpKSB8fCByZS5leGVjKHJlcyk7XG4gICAgICAgIGlmICghY2FwKSB7XG4gICAgICAgICAgICAvLyBwZXJoYXBzIGRlZmluZWQgaW4gbWFjcm9cbiAgICAgICAgICAgIGNvbnN0IGRlZiA9IGRlZmluZXMuZmluZCgoZCkgPT4gZC5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgICAgIGlmIChkZWYgJiYgZGVmLm9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG4gb2YgZGVmLm9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwKCdzYW1wbGVyKFxcXFx3KylcXFxccysnICsgbik7XG4gICAgICAgICAgICAgICAgICAgIGNhcCA9IHJlLmV4ZWMocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNhcCkge1xuICAgICAgICAgICAgICAgIGVycm9yKGBFRlgyMzAwOiBzYW1wbGVyICcke25hbWV9JyBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXhGblR5cGUgPSB0ZXh0dXJlRnVuY1JlbWFwLmdldChjYXBbMV0pID8/IGNhcFsxXTtcbiAgICAgICAgcmV0dXJuIGB0ZXh0dXJlJHt0ZXhGblR5cGV9JHtzdWZmaXh9KCR7bmFtZX0ke2VuZFRva2VufWA7XG4gICAgfSk7XG4gICAgaWYgKHZlcnQpIHtcbiAgICAgICAgLy8gaW4vb3V0ID0+IGF0dHJpYnV0ZS92YXJ5aW5nXG4gICAgICAgIHJlcyA9IHJlcy5yZXBsYWNlKGluRGVjbCwgKHN0ciwgcXVhbGlmaWVycywgZGVjbCkgPT4gYGF0dHJpYnV0ZSAke2RlY2x9O2ApO1xuICAgICAgICByZXMgPSByZXMucmVwbGFjZShvdXREZWNsLCAoc3RyLCBxdWFsaWZpZXJzLCBkZWNsKSA9PiBgdmFyeWluZyAke2RlY2x9O2ApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGluL291dCA9PiB2YXJ5aW5nL2dsX0ZyYWdDb2xvclxuICAgICAgICByZXMgPSByZXMucmVwbGFjZShpbkRlY2wsIChzdHIsIHF1YWxpZmllcnMsIGRlY2wpID0+IGB2YXJ5aW5nICR7ZGVjbH07YCk7XG4gICAgICAgIGNvbnN0IG91dExpc3QgPSBbXTtcbiAgICAgICAgcmVzID0gcmVzLnJlcGxhY2Uob3V0RGVjbCwgKHN0ciwgcXVhbGlmaWVycywgZGVjbCwgbmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYXRpb25DYXAgPSBxdWFsaWZpZXJzICYmIGxvY2F0aW9uUkUuZXhlYyhxdWFsaWZpZXJzKTtcbiAgICAgICAgICAgIGlmICghbG9jYXRpb25DYXApIHtcbiAgICAgICAgICAgICAgICBlcnJvcignRUZYMjMwMjogZnJhZ21lbnQgb3V0cHV0IGxvY2F0aW9uIG11c3QgYmUgc3BlY2lmaWVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRMaXN0LnB1c2goeyBuYW1lLCBsb2NhdGlvbjogbG9jYXRpb25DYXBbMV0gfSk7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAob3V0TGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dFJFID0gbmV3IFJlZ0V4cChgXFxcXGIke291dExpc3RbMF0ubmFtZX1cXFxcYmAsICdnJyk7XG4gICAgICAgICAgICByZXMgPSByZXMucmVwbGFjZShvdXRSRSwgJ2dsX0ZyYWdDb2xvcicpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dExpc3QubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgLy8gRVhUX2RyYXdfYnVmZmVyc1xuICAgICAgICAgICAgZm9yIChjb25zdCBvdXQgb2Ygb3V0TGlzdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dFJFID0gbmV3IFJlZ0V4cChgXFxcXGIke291dC5uYW1lfVxcXFxiYCwgJ2cnKTtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMucmVwbGFjZShvdXRSRSwgYGdsX0ZyYWdEYXRhWyR7b3V0LmxvY2F0aW9ufV1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY2FjaGUuZXh0ZW5zaW9uc1snR0xfRVhUX2RyYXdfYnVmZmVycyddKSB7XG4gICAgICAgICAgICAgICAgY2FjaGUuZXh0ZW5zaW9uc1snR0xfRVhUX2RyYXdfYnVmZmVycyddID0ge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY29uZDogJ19fVkVSU0lPTl9fIDw9IDEwMCcsXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGNhbid0IHJlbGlhYmx5IGRlZHVjZSB0aGUgbWFjcm8gZGVwZW5kZWNpZXMgZm9yIHRoaXMgZXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIG5vdCBtYWtpbmcgdGhpcyBhIGhhcmQgcmVxdWlyZSBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGxldmVsOiAnZW5hYmxlJyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlcyA9IHJlcy5yZXBsYWNlKC9sYXlvdXRcXHMqXFwoLio/XFwpXFxzKi9nLCAoKSA9PiAnJyk7IC8vIGxheW91dCBxdWFsaWZpZXJzXG4gICAgcmV0dXJuIHJlcy5yZXBsYWNlKHByYWdtYXNUb1N0cmlwLCAnJyk7IC8vIHN0cmlwIHByYWdtYXMgaGVyZSBmb3IgYSBjbGVhbmVyIHdlYmdsIGNvbXBpbGVyIG91dHB1dFxufTtcblxuY29uc3QgZGVjb3JhdGVCbG9ja01lbW9yeUxheW91dHMgPSAoY29kZSwgcGFyYW1JbmZvKSA9PiB7XG4gICAgbGV0IGlkeCA9IDA7XG4gICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgcGFyYW1JbmZvLmZvckVhY2goKGluZm8sIHBhcmFtSWR4KSA9PiB7XG4gICAgICAgIGlmIChpbmZvLnR5cGUgIT09ICdibG9ja3MnICYmIGluZm8udHlwZSAhPT0gJ2J1ZmZlcnMnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNTU0JPID0gaW5mby50eXBlID09PSAnYnVmZmVycyc7XG4gICAgICAgIGNvbnN0IGZyYWcgPSBjb2RlLnNsaWNlKGlkeCwgaW5mby5iZWcpO1xuICAgICAgICBjb25zdCBjYXAgPSBsYXlvdXRFeHRyYWN0LmV4ZWMoZnJhZyk7XG4gICAgICAgIHBvc2l0aW9uc1twYXJhbUlkeF0gPSBjYXAgPyBpZHggKyBjYXAuaW5kZXggKyAoaXNTU0JPID8gMCA6IGNhcFswXS5sZW5ndGggLSBjYXBbMl0ubGVuZ3RoIC0gMSkgOiAtMTtcbiAgICAgICAgaWR4ID0gaW5mby5lbmQ7XG4gICAgfSk7XG4gICAgbGV0IHJlcyA9ICcnO1xuICAgIGlkeCA9IDA7XG4gICAgcGFyYW1JbmZvLmZvckVhY2goKGluZm8sIHBhcmFtSWR4KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gcG9zaXRpb25zW3BhcmFtSWR4XTtcbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluc2VydCBkZWNsYXJhdGlvbnNcbiAgICAgICAgaWYgKGluZm8udHlwZSA9PT0gJ2Jsb2NrcycpIHtcbiAgICAgICAgICAgIC8vIFVCTy1zcGVjaWZpY1xuICAgICAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgICAgICAgICAgIC8vIG5vIHF1YWxpZmllciwganVzdCBpbnNlcnQgZXZlcnl0aGluZ1xuICAgICAgICAgICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKGlkeCwgaW5mby5iZWcpO1xuICAgICAgICAgICAgICAgIHJlcyArPSAnbGF5b3V0KHN0ZDE0MCkgJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kIHRoZSB0b2tlblxuICAgICAgICAgICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKGlkeCwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHJlcyArPSAnLCBzdGQxNDAnO1xuICAgICAgICAgICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKHBvc2l0aW9uLCBpbmZvLmJlZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnYnVmZmVycycpIHtcbiAgICAgICAgICAgIC8vIFNTQk8tc3BlY2lmaWNcbiAgICAgICAgICAgIGxldCBkZWNsYXJhdGlvbiA9ICdzdGQ0MzAnOyAvLyBzdGQ0MzAgYXJlIHByZWZlcnJlZCBmb3IgU1NCT3NcbiAgICAgICAgICAgIGlmIChpbmZvLnBhcmFtLnRhZ3MgJiYgaW5mby5wYXJhbS50YWdzLmdsQmluZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb24gKz0gYCwgYmluZGluZyA9ICR7aW5mby5wYXJhbS50YWdzLmdsQmluZGluZ31gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWdub3JlIGlucHV0IHNwZWNpZmllcnNcbiAgICAgICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKGlkeCwgcG9zaXRpb24gPCAwID8gaW5mby5iZWcgOiBwb3NpdGlvbik7XG4gICAgICAgICAgICByZXMgKz0gYGxheW91dCgke2RlY2xhcmF0aW9ufSkgYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKGluZm8uYmVnLCBpbmZvLmVuZCk7XG4gICAgICAgIGlkeCA9IGluZm8uZW5kO1xuICAgIH0pO1xuICAgIHJlcyArPSBjb2RlLnNsaWNlKGlkeCk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmNvbnN0IGRlY29yYXRlQmluZGluZ3MgPSAoY29kZSwgbWFuaWZlc3QsIHBhcmFtSW5mbykgPT4ge1xuICAgIHBhcmFtSW5mbyA9IHBhcmFtSW5mby5maWx0ZXIoKGkpID0+ICFidWlsdGluUkUudGVzdChpLnBhcmFtLm5hbWUpKTtcbiAgICBsZXQgaWR4ID0gMDtcbiAgICBjb25zdCByZWNvcmQgPSBbXTtcbiAgICBjb25zdCBvdmVycmlkZXMgPSB7fTtcbiAgICAvLyBleHRyYWN0IGV4aXN0aW5nIGJpbmRpbmcgaW5mb3NcbiAgICBwYXJhbUluZm8uZm9yRWFjaCgoaW5mbywgcGFyYW1JZHgpID0+IHtcbiAgICAgICAgLy8gb3ZlcmxhcHBpbmcgbG9jYXRpb25zL2JpbmRpbmdzIHVuZGVyIGRpZmZlcmVudCBtYWNyb3MgYXJlIG5vdCBzdXBwb3J0ZWQgeWV0XG4gICAgICAgIGlmIChpbmZvLnR5cGUgPT09ICdmcmFnQ29sb3JzJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5hbWUgPSBpbmZvLnBhcmFtLm5hbWU7XG5cbiAgICAgICAgaWYgKCFtYW5pZmVzdFtpbmZvLnR5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZnJhZyA9IGNvZGUuc2xpY2UoaWR4LCBpbmZvLmJlZyk7XG4gICAgICAgIGNvbnN0IGxheW91dEluZm8gPSB7IHByb3A6IGluZm8ucGFyYW0gfTtcbiAgICAgICAgY29uc3QgY2FwID0gbGF5b3V0RXh0cmFjdC5leGVjKGZyYWcpO1xuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IG92ZXJyaWRlc1tpbmZvLnR5cGVdIHx8IChvdmVycmlkZXNbaW5mby50eXBlXSA9IHt9KTtcbiAgICAgICAgaWYgKGNhcCkge1xuICAgICAgICAgICAgLy8gcG9zaXRpb24gb2YgJyknXG4gICAgICAgICAgICBsYXlvdXRJbmZvLnBvc2l0aW9uID0gaWR4ICsgY2FwLmluZGV4ICsgY2FwWzBdLmxlbmd0aCAtIGNhcFsyXS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgY29uc3QgYmluZGluZ0NhcCA9IGJpbmRpbmdFeHRyYWN0LmV4ZWMoY2FwWzFdKTtcbiAgICAgICAgICAgIGlmIChiaW5kaW5nQ2FwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcFsxXS5zZWFyY2goL1xcYnNldFxccyo9LykgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxheW91dEluZm8ucG9zaXRpb24gPSBjYXBbMV0ubGVuZ3RoIC0gbGF5b3V0SW5mby5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICB9IC8vIHNob3VsZCBpbnNlcnQgc2V0IGRlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxheW91dEluZm8ucG9zaXRpb24gPSAtMTtcbiAgICAgICAgICAgICAgICB9IC8vIGluZGljYXRpbmcgbm8tb3BcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlSW50KGJpbmRpbmdDYXBbMV0pO1xuICAgICAgICAgICAgICAgIC8vIGFkYXB0IGJpbmRpbmdzXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGluZm8udHlwZSA9PT0gJ3ZhcnlpbmdzJyB8fCBpbmZvLnR5cGUgPT09ICdhdHRyaWJ1dGVzJyA/ICdsb2NhdGlvbicgOiAnYmluZGluZyc7XG4gICAgICAgICAgICAgICAgbGV0IHZhbGlkU3Vic3RpdHV0aW9uID0gbWFuaWZlc3RbaW5mby50eXBlXS5maW5kKCh2KSA9PiB2W2Rlc3RdID09PSB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZFN1YnN0aXR1dGlvbiAmJiBpbmZvLnR5cGUgPT09ICdzdWJwYXNzSW5wdXRzJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBpbnB1dCBhdHRhY2htZW50cyBuZWVkIGZhbGxiYWNrIGJpbmRpbmdzLCBza2lwIHRoaXMgY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRTdWJzdGl0dXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsaWRTdWJzdGl0dXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXV0by1nZW5lcmF0ZWQgYmluZGluZyBpcyBndWFyYW50ZWVkIHRvIGJlIGNvbnNlY3V0aXZlXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXRlZ29yeVt2YWx1ZV0gJiYgY2F0ZWdvcnlbdmFsdWVdICE9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjYwMDogZHVwbGljYXRlZCBiaW5kaW5nL2xvY2F0aW9uIGRlY2xhcmF0aW9uIGZvciAnJHtjYXRlZ29yeVt2YWx1ZV19JyBhbmQgJyR7bmFtZX0nYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlbKGNhdGVnb3J5W3ZhbHVlXSA9IG5hbWUpXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnYmxvY2tzJykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjYwMTogaWxsZWdhbCBjdXN0b20gYmluZGluZyBmb3IgJyR7bmFtZX0nLCBibG9jayBiaW5kaW5ncyBzaG91bGQgYmUgY29uc2VjdXRpdmUgYW5kIHN0YXJ0IGZyb20gMGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnc2FtcGxlclRleHR1cmVzJykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjYwMjogaWxsZWdhbCBjdXN0b20gYmluZGluZyBmb3IgJyR7bmFtZX0nLCB0ZXh0dXJlIGJpbmRpbmdzIHNob3VsZCBiZSBjb25zZWN1dGl2ZSBhbmQgYWZ0ZXIgYWxsIHRoZSBibG9ja3NgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluZm8udHlwZSA9PT0gJ2J1ZmZlcnMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYEVGWDI2MDM6IGlsbGVnYWwgY3VzdG9tIGJpbmRpbmcgZm9yICcke25hbWV9JywgYnVmZmVyIGJpbmRpbmdzIHNob3VsZCBiZSBjb25zZWN1dGl2ZSBhbmQgYWZ0ZXIgYWxsIHRoZSBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdibG9ja3Mvc2FtcGxlclRleHR1cmVzJyxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluZm8udHlwZSA9PT0gJ2ltYWdlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRUZYMjYwNDogaWxsZWdhbCBjdXN0b20gYmluZGluZyBmb3IgJyR7bmFtZX0nLCBpbWFnZSBiaW5kaW5ncyBzaG91bGQgYmUgY29uc2VjdXRpdmUgYW5kIGFmdGVyIGFsbCB0aGUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmxvY2tzL3NhbXBsZXJUZXh0dXJlcy9idWZmZXJzJyxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluZm8udHlwZSA9PT0gJ3RleHR1cmVzJykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBFRlgyNjA1OiBpbGxlZ2FsIGN1c3RvbSBiaW5kaW5nIGZvciAnJHtuYW1lfScsIHRleHR1cmUgYmluZGluZ3Mgc2hvdWxkIGJlIGNvbnNlY3V0aXZlIGFuZCBhZnRlciBhbGwgdGhlIGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jsb2Nrcy9zYW1wbGVyVGV4dHVyZXMvYnVmZmVycy9pbWFnZXMnLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnc2FtcGxlcnMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYEVGWDI2MDY6IGlsbGVnYWwgY3VzdG9tIGJpbmRpbmcgZm9yICcke25hbWV9Jywgc2FtcGxlciBiaW5kaW5ncyBzaG91bGQgYmUgY29uc2VjdXRpdmUgYW5kIGFmdGVyIGFsbCB0aGUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmxvY2tzL3NhbXBsZXJUZXh0dXJlcy9idWZmZXJzL2ltYWdlcy90ZXh0dXJlcycsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXR0cmlidXRlcyBvciB2YXJ5aW5nc1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihgRUZYMjYwNzogaWxsZWdhbCBjdXN0b20gbG9jYXRpb24gZm9yICcke25hbWV9JywgbG9jYXRpb25zIHNob3VsZCBiZSBjb25zZWN1dGl2ZSBhbmQgc3RhcnQgZnJvbSAwYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlY29yZFtwYXJhbUlkeF0gPSBsYXlvdXRJbmZvO1xuICAgICAgICBpZHggPSBpbmZvLmVuZDtcbiAgICB9KTtcbiAgICAvLyBvdmVycmlkZSBiaW5kaW5ncy9sb2NhdGlvbnNcbiAgICBwYXJhbUluZm8uZm9yRWFjaCgoaW5mbywgcGFyYW1JZHgpID0+IHtcbiAgICAgICAgaWYgKCFvdmVycmlkZXNbaW5mby50eXBlXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5lZWRMb2NhdGlvbiA9IGluZm8udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnIHx8IGluZm8udHlwZSA9PT0gJ3ZhcnlpbmdzJyB8fCBpbmZvLnR5cGUgPT09ICdmcmFnQ29sb3JzJztcbiAgICAgICAgY29uc3QgZGVzdCA9IG5lZWRMb2NhdGlvbiA/ICdsb2NhdGlvbicgOiAnYmluZGluZyc7XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gb3ZlcnJpZGVzW2luZm8udHlwZV07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBpbmZvLnBhcmFtLm5hbWU7XG4gICAgICAgIGlmIChpbmZvLnR5cGUgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgLy8gc29tZSByYXRpb25hbGUgYmVoaW5kIHRoZXNlIG9kZGl0aWVzOlxuICAgICAgICAgICAgLy8gMS4gcGFyYW1JbmZvIG1lbWJlciBpcyBndWFyYW50ZWVkIHRvIGJlIGluIGNvbnNpc3RlbnQgb3JkZXIgd2l0aCBtYW5pZmVzdCBtZW1iZXJzXG4gICAgICAgICAgICAvLyAyLiB3ZSB3YW50IHRoZSBvdXRwdXQgbnVtYmVyIHRvIGJlIGFzIGNvbnNpc3RlbnQgYXMgcG9zc2libGUgd2l0aCB0aGVpciBkZWNsYXJhdGlvbiBvcmRlci5cbiAgICAgICAgICAgIC8vICAgIGUuZy4gZ2Z4LklucHV0U3RhdGUgdXRpbGl6ZXMgZGVjbGFyYXRpb24gb3JkZXIgdG8gY2FsY3VsYXRlIGJ1ZmZlciBvZmZzZXRzLCBldGMuXG4gICAgICAgICAgICBpZiAobmFtZSBpbiBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgIHJlY29yZFtwYXJhbUlkeF0ucHJvcFtkZXN0XSA9IGNhdGVnb3J5W25hbWVdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgbiA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGNhdGVnb3J5W25dKSB7XG4gICAgICAgICAgICAgICAgICAgIG4rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVjb3JkW3BhcmFtSWR4XS5wcm9wW2Rlc3RdID0gbjtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVtuXSA9IG5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobmFtZSBpbiBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZExvY2F0aW9uID0gcmVjb3JkW3BhcmFtSWR4XS5wcm9wW2Rlc3RdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnN0aXR1dGUgPSBtYW5pZmVzdFtpbmZvLnR5cGVdLmZpbmQoKHYpID0+IHZbZGVzdF0gPT09IGNhdGVnb3J5W25hbWVdKTtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic3RpdHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzdWJzdGl0dXRlW2Rlc3RdID0gb2xkTG9jYXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlY29yZFtwYXJhbUlkeF0ucHJvcFtkZXN0XSA9IGNhdGVnb3J5W25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gaW5zZXJ0IGRlY2xhcmF0aW9uc1xuICAgIGxldCByZXMgPSAnJztcbiAgICBpZHggPSAwO1xuICAgIGNvbnN0IHNldEluZGV4ID0gbWFwcGluZ3MuU2V0SW5kZXguTUFURVJJQUw7XG4gICAgcGFyYW1JbmZvLmZvckVhY2goKGluZm8sIHBhcmFtSWR4KSA9PiB7XG4gICAgICAgIGlmICghcmVjb3JkW3BhcmFtSWR4XSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5lZWRMb2NhdGlvbiA9IGluZm8udHlwZSA9PT0gJ2F0dHJpYnV0ZXMnIHx8IGluZm8udHlwZSA9PT0gJ3ZhcnlpbmdzJyB8fCBpbmZvLnR5cGUgPT09ICdmcmFnQ29sb3JzJztcbiAgICAgICAgY29uc3QgZGVzdCA9IG5lZWRMb2NhdGlvbiA/ICdsb2NhdGlvbicgOiAnYmluZGluZyc7XG4gICAgICAgIGNvbnN0IHsgcG9zaXRpb24sIHByb3AgfSA9IHJlY29yZFtwYXJhbUlkeF07XG4gICAgICAgIGNvbnN0IHNldERlY2xhcmF0aW9uID0gbmVlZExvY2F0aW9uID8gJycgOiBgc2V0ID0gJHtzZXRJbmRleH0sIGA7XG4gICAgICAgIC8vIGluc2VydCBkZWNsYXJhdGlvblxuICAgICAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gbm8gcXVhbGlmaWVyLCBqdXN0IGluc2VydCBldmVyeXRoaW5nXG4gICAgICAgICAgICByZXMgKz0gY29kZS5zbGljZShpZHgsIGluZm8uYmVnKTtcbiAgICAgICAgICAgIHJlcyArPSBgbGF5b3V0KCR7c2V0RGVjbGFyYXRpb24gKyBkZXN0fSA9ICR7cHJvcFtkZXN0XX0pIGA7XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPj0gMCkge1xuICAgICAgICAgICAgLy8gcXVhbGlmaWVyIGV4aXN0cywgYnV0IG5vIGJpbmRpbmcgc3BlY2lmaWVkXG4gICAgICAgICAgICByZXMgKz0gY29kZS5zbGljZShpZHgsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHJlcyArPSBgLCAke3NldERlY2xhcmF0aW9uICsgZGVzdH0gPSAke3Byb3BbZGVzdF19YDtcbiAgICAgICAgICAgIHJlcyArPSBjb2RlLnNsaWNlKHBvc2l0aW9uLCBpbmZvLmJlZyk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPCAtMSkge1xuICAgICAgICAgICAgLy8gYmluZGluZyBleGlzdHMsIGJ1dCBubyBzZXQgc3BlY2lmaWVkXG4gICAgICAgICAgICByZXMgKz0gY29kZS5zbGljZShpZHgsIC1wb3NpdGlvbik7XG4gICAgICAgICAgICByZXMgKz0gc2V0RGVjbGFyYXRpb247XG4gICAgICAgICAgICByZXMgKz0gY29kZS5zbGljZSgtcG9zaXRpb24sIGluZm8uYmVnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vLW9wLCBiaW5kaW5nIGlzIGFscmVhZHkgc3BlY2lmaWVkXG4gICAgICAgICAgICByZXMgKz0gY29kZS5zbGljZShpZHgsIGluZm8uYmVnKTtcbiAgICAgICAgfVxuICAgICAgICByZXMgKz0gY29kZS5zbGljZShpbmZvLmJlZywgaW5mby5lbmQpO1xuICAgICAgICBpZHggPSBpbmZvLmVuZDtcbiAgICB9KTtcbiAgICByZXMgKz0gY29kZS5zbGljZShpZHgpO1xuICAgIC8vIHJlbW92ZSBzdWJwYXNzIGZhbGxiYWNrIGRlY2xhcmF0aW9uc1xuICAgIG1hbmlmZXN0LnNhbXBsZXJUZXh0dXJlcyA9IG1hbmlmZXN0LnNhbXBsZXJUZXh0dXJlcy5maWx0ZXIoKHQpID0+IG1hbmlmZXN0LnN1YnBhc3NJbnB1dHMuZmluZEluZGV4KChzKSA9PiBzLmJpbmRpbmcgPT09IHQuYmluZGluZykgPCAwKTtcbiAgICByZXR1cm4gcmVzO1xufTtcblxuY29uc3QgcmVtYXBEZWZpbmUgPSAob2JqLCBzdWJzdGl0dXRlTWFwKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmouZGVmaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBsZXQgc3ViVmFsID0gc3Vic3RpdHV0ZU1hcC5nZXQob2JqLmRlZmluZXNbaV0pO1xuICAgICAgICB3aGlsZSAoc3ViVmFsKSB7XG4gICAgICAgICAgICBvYmouZGVmaW5lc1tpXSA9IHN1YlZhbDtcbiAgICAgICAgICAgIHN1YlZhbCA9IHN1YnN0aXR1dGVNYXAuZ2V0KHN1YlZhbCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBzaGFkZXJGYWN0b3J5ID0gKCgpID0+IHtcbiAgICBjb25zdCB0cmFpbGluZ1NwYWNlcyA9IC9cXHMrJC9nbTtcbiAgICBjb25zdCBuZXdsaW5lcyA9IC8oXlxccypcXG4pezIsfS9nbTtcbiAgICBjb25zdCBjbGVhbiA9IChjb2RlKSA9PiB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjb2RlLnJlcGxhY2UocHJhZ21hc1RvU3RyaXAsICcnKTsgLy8gc3RyaXAgb3VyIHByYWdtYXNcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UobmV3bGluZXMsICdcXG4nKTsgLy8gc3F1YXNoIG11bHRpcGxlIG5ld2xpbmVzXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKHRyYWlsaW5nU3BhY2VzLCAnJyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBjb25zdCBvYmplY3RNYXAgPSAob2JqLCBmbikgPT4gT2JqZWN0LmtleXMob2JqKS5yZWR1Y2UoKGFjYywgY3VyKSA9PiAoKGFjY1tjdXJdID0gZm4oY3VyKSksIGFjYyksIHt9KTtcbiAgICBjb25zdCBmaWx0ZXJGYWN0b3J5ID0gKHRhcmdldCwgYnVpbHRpbnMpID0+ICh1KSA9PiB7XG4gICAgICAgIGlmICghYnVpbHRpblJFLnRlc3QodS5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFncyA9IHUudGFncztcbiAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgIGlmICghdGFncyB8fCAhdGFncy5idWlsdGluKSB7XG4gICAgICAgICAgICB0eXBlID0gJ2dsb2JhbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eXBlID0gdGFncy5idWlsdGluO1xuICAgICAgICB9XG4gICAgICAgIGJ1aWx0aW5zW2Ake3R5cGV9c2BdW3RhcmdldF0ucHVzaCh7IG5hbWU6IHUubmFtZSwgZGVmaW5lczogdS5kZWZpbmVzIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBjb25zdCBjbGFzc2lmeURlc2NyaXB0b3IgPSAoZGVzY3JpcHRvcnMsIHNoYWRlckluZm8sIG1lbWJlcikgPT4ge1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IDA7XG4gICAgICAgIGNvbnN0IGJhdGNoID0gMTtcbiAgICAgICAgLy8gY29uc3QgcGhhc2UgPSAyO1xuICAgICAgICBjb25zdCBwYXNzID0gMztcbiAgICAgICAgY29uc3Qgc291cmNlcyA9IHNoYWRlckluZm9bbWVtYmVyXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgIT09IHNvdXJjZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBzb3VyY2VzW2ldO1xuICAgICAgICAgICAgaWYgKGluZm8ucmF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvcnNbaW5mby5yYXRlXVttZW1iZXJdLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWJ1aWx0aW5SRS50ZXN0KGluZm8ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBkZXNjcmlwdG9yc1tiYXRjaF1bbWVtYmVyXS5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdGFncyA9IGluZm8udGFncztcbiAgICAgICAgICAgIGlmICghaW5mby50YWdzIHx8ICFpbmZvLnRhZ3MuYnVpbHRpbikge1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0b3JzW3Bhc3NdW21lbWJlcl0ucHVzaChpbmZvKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3MuYnVpbHRpbiA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRvcnNbcGFzc11bbWVtYmVyXS5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFncy5idWlsdGluID09PSAnbG9jYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0b3JzW2luc3RhbmNlXVttZW1iZXJdLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBjbGFzc2lmeURlc2NyaXB0b3JzID0gKGRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvKSA9PiB7XG4gICAgICAgIGNsYXNzaWZ5RGVzY3JpcHRvcihkZXNjcmlwdG9ycywgc2hhZGVySW5mbywgJ2Jsb2NrcycpO1xuICAgICAgICBjbGFzc2lmeURlc2NyaXB0b3IoZGVzY3JpcHRvcnMsIHNoYWRlckluZm8sICdzYW1wbGVyVGV4dHVyZXMnKTtcbiAgICAgICAgY2xhc3NpZnlEZXNjcmlwdG9yKGRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvLCAnc2FtcGxlcnMnKTtcbiAgICAgICAgY2xhc3NpZnlEZXNjcmlwdG9yKGRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvLCAndGV4dHVyZXMnKTtcbiAgICAgICAgY2xhc3NpZnlEZXNjcmlwdG9yKGRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvLCAnYnVmZmVycycpO1xuICAgICAgICBjbGFzc2lmeURlc2NyaXB0b3IoZGVzY3JpcHRvcnMsIHNoYWRlckluZm8sICdpbWFnZXMnKTtcbiAgICAgICAgY2xhc3NpZnlEZXNjcmlwdG9yKGRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvLCAnc3VicGFzc0lucHV0cycpO1xuICAgIH07XG4gICAgY29uc3Qgd3JhcEVudHJ5ID0gKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd3JhcHBlckZhY3RvcnkgPSAoc3RhZ2UsIGZuKSA9PiB7XG4gICAgICAgICAgICBzd2l0Y2ggKHN0YWdlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndmVydCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgXFxudm9pZCBtYWluKCkgeyBnbF9Qb3NpdGlvbiA9ICR7Zm59KCk7IH1cXG5gO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2ZyYWcnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYFxcbmxheW91dChsb2NhdGlvbiA9IDApIG91dCB2ZWM0IGNjX0ZyYWdDb2xvcjtcXG52b2lkIG1haW4oKSB7IGNjX0ZyYWdDb2xvciA9ICR7Zm59KCk7IH1cXG5gO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgXFxudm9pZCBtYWluKCkgeyAke2ZufSgpOyB9XFxuYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChjb250ZW50LCBlbnRyeSwgc3RhZ2UpID0+IChlbnRyeSA9PT0gJ21haW4nID8gY29udGVudCA6IGNvbnRlbnQgKyB3cmFwcGVyRmFjdG9yeShzdGFnZSwgZW50cnkpKTtcbiAgICB9KSgpO1xuICAgIGNvbnN0IGVudHJ5UkUgPSAvKFteOl0rKSg/OjooXFx3KykpPy87XG4gICAgY29uc3QgcHJlcHJvY2VzcyA9IChuYW1lLCBjaHVua3MsIGRlcHJlY2F0aW9ucywgc3RhZ2UsIGRlZmF1bHRFbnRyeSA9ICdtYWluJykgPT4ge1xuICAgICAgICBjb25zdCBlbnRyeUNhcCA9IGVudHJ5UkUuZXhlYyhuYW1lKTtcbiAgICAgICAgY29uc3QgZW50cnkgPSBlbnRyeUNhcFsyXSB8fCBkZWZhdWx0RW50cnk7XG4gICAgICAgIGNvbnN0IHJlY29yZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgZnVuY3Rpb25zID0gW107XG4gICAgICAgIGxldCBjb2RlID0gdW53aW5kSW5jbHVkZXMoYCNpbmNsdWRlIDwke2VudHJ5Q2FwWzFdfT5gLCBjaHVua3MsIGRlcHJlY2F0aW9ucywgcmVjb3JkKTtcbiAgICAgICAgY29kZSA9IHdyYXBFbnRyeShjb2RlLCBlbnRyeSwgc3RhZ2UpO1xuICAgICAgICBjb2RlID0gZXhwYW5kU3VicGFzc0lub3V0KGNvZGUpO1xuICAgICAgICBjb2RlID0gZXhwYW5kTGl0ZXJhbE1hY3JvKGNvZGUpO1xuICAgICAgICBjb2RlID0gZXhwYW5kRnVuY3Rpb25hbE1hY3JvKGNvZGUpO1xuICAgICAgICBjb2RlID0gZWxpbWluYXRlRGVhZENvZGUoY29kZSwgZW50cnksIGZ1bmN0aW9ucyk7IC8vIHRoaXMgaGFzIHRvIGJlIHRoZSBsYXN0IHByb2Nlc3MsIG9yIHRoZSBgZnVuY3Rpb25zYCBvdXRwdXQgd29uJ3QgbWF0Y2hcbiAgICAgICAgcmV0dXJuIHsgY29kZSwgcmVjb3JkLCBmdW5jdGlvbnMgfTtcbiAgICB9O1xuICAgIGNvbnN0IHJhdGVNYXBwaW5nID0ge1xuICAgICAgICBpbnN0YW5jZTogMCxcbiAgICAgICAgYmF0Y2g6IDEsXG4gICAgICAgIHBoYXNlOiAyLFxuICAgICAgICBwYXNzOiAzLFxuICAgIH07XG4gICAgY29uc3QgYXNzaWduUmF0ZSA9IChlbnRyeSwgcmF0ZXMpID0+IHtcbiAgICAgICAgZW50cnkuZm9yRWFjaCgoaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmF0ZSA9IHJhdGVzLmZpbmQoKHIpID0+IHIubmFtZSA9PT0gaS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChyYXRlKSB7XG4gICAgICAgICAgICAgICAgaS5yYXRlID0gcmF0ZU1hcHBpbmdbcmF0ZS5yYXRlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBhc3NpZ25TYW1wbGVUeXBlID0gKGVudHJ5LCBzYW1wbGVUeXBlcykgPT4ge1xuICAgICAgICBlbnRyeS5mb3JFYWNoKChpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzYW1wbGVUeXBlSW5mbyA9IHNhbXBsZVR5cGVzLmZpbmQoKHMpID0+IHMubmFtZSA9PT0gaS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChzYW1wbGVUeXBlSW5mbykge1xuICAgICAgICAgICAgICAgIGkuc2FtcGxlVHlwZSA9IHNhbXBsZVR5cGVJbmZvLnNhbXBsZVR5cGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkuc2FtcGxlVHlwZSA9IDA7IC8vIFNhbXBsZVR5cGUuRkxPQVQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgdG9rZW5pemVyT3B0ID0geyB2ZXJzaW9uOiAnMzAwIGVzJyB9O1xuICAgIGNvbnN0IGNyZWF0ZVNoYWRlckluZm8gPSAoKSA9PiAoe1xuICAgICAgICBibG9ja3M6IFtdLFxuICAgICAgICBzYW1wbGVyVGV4dHVyZXM6IFtdLFxuICAgICAgICBzYW1wbGVyczogW10sXG4gICAgICAgIHRleHR1cmVzOiBbXSxcbiAgICAgICAgYnVmZmVyczogW10sXG4gICAgICAgIGltYWdlczogW10sXG4gICAgICAgIHN1YnBhc3NJbnB1dHM6IFtdLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXSxcbiAgICAgICAgdmFyeWluZ3M6IFtdLFxuICAgICAgICBmcmFnQ29sb3JzOiBbXSxcbiAgICAgICAgZGVzY3JpcHRvcnM6IFtdLFxuICAgIH0pO1xuICAgIGNvbnN0IGNvbXBpbGUgPSAoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHN0YWdlLFxuICAgICAgICBvdXREZWZpbmVzID0gW10sXG4gICAgICAgIHNoYWRlckluZm8gPSBjcmVhdGVTaGFkZXJJbmZvKCksXG4gICAgICAgIGNodW5rcyA9IGdsb2JhbENodW5rcyxcbiAgICAgICAgZGVwcmVjYXRpb25zID0gZ2xvYmFsRGVwcmVjYXRpb25zLFxuICAgICkgPT4ge1xuICAgICAgICBjb25zdCBvdXQgPSB7fTtcbiAgICAgICAgc2hhZGVyTmFtZSA9IG5hbWU7XG4gICAgICAgIGNvbnN0IGNhY2hlID0geyBsaW5lczogW10sIGV4dGVuc2lvbnM6IHt9IH07XG4gICAgICAgIGNvbnN0IHsgY29kZSwgcmVjb3JkLCBmdW5jdGlvbnMgfSA9IHByZXByb2Nlc3MobmFtZSwgY2h1bmtzLCBkZXByZWNhdGlvbnMsIHN0YWdlKTtcbiAgICAgICAgY29uc3QgdG9rZW5zID0gKHNoYWRlclRva2VucyA9IHRva2VuaXplcihjb2RlLCB0b2tlbml6ZXJPcHQpKTtcbiAgICAgICAgLy8gWzBdOiBleGlzdGluZ0RlZmluZXM7IFsxXTogc3Vic3RpdHV0ZU1hcFxuICAgICAgICBjb25zdCByZXMgPSBleHRyYWN0TWFjcm9EZWZpbml0aW9ucyhjb2RlKTtcbiAgICAgICAgY2FjaGUuZXhpc3RpbmdEZWZpbmVzID0gcmVzWzBdO1xuICAgICAgICBjb25zdCBzdWJzdGl0dXRlTWFwID0gcmVzWzFdO1xuICAgICAgICBleHRyYWN0RGVmaW5lcyh0b2tlbnMsIG91dERlZmluZXMsIGNhY2hlKTtcbiAgICAgICAgY29uc3QgcmF0ZXMgPSBleHRyYWN0VXBkYXRlUmF0ZXModG9rZW5zKTtcbiAgICAgICAgY29uc3Qgc2FtcGxlVHlwZXMgPSBleHRyYWN0VW5maWx0ZXJhYmxlRmxvYXQodG9rZW5zKTtcbiAgICAgICAgY29uc3QgYmxvY2tJbmZvID0gZXh0cmFjdFBhcmFtcyh0b2tlbnMsIGNhY2hlLCBzaGFkZXJJbmZvLCBzdGFnZSwgZnVuY3Rpb25zKTtcblxuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJUZXh0dXJlcyA9IHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzLmZpbHRlcihcbiAgICAgICAgICAgIChlbGUpID0+ICFzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHMuZmluZCgob2JqKSA9PiBvYmoubmFtZSA9PT0gZWxlLm5hbWUpLFxuICAgICAgICApO1xuXG4gICAgICAgIG91dC5ibG9ja0luZm8gPSBibG9ja0luZm87IC8vIHBhc3MgZm9yd2FyZFxuICAgICAgICBvdXQucmVjb3JkID0gcmVjb3JkOyAvLyBoZWFkZXIgZGVwZW5kZW5jaWVzXG4gICAgICAgIG91dC5leHRlbnNpb25zID0gY2FjaGUuZXh0ZW5zaW9uczsgLy8gZXh0ZW5zaW9ucyByZXF1ZXN0c1xuICAgICAgICBvdXQuZ2xzbDQgPSBjb2RlO1xuXG4gICAgICAgIHNoYWRlckluZm8uYXR0cmlidXRlcy5mb3JFYWNoKChhdHRyKSA9PiB7XG4gICAgICAgICAgICByZW1hcERlZmluZShhdHRyLCBzdWJzdGl0dXRlTWFwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNoYWRlckluZm8uYmxvY2tzLmZvckVhY2goKGJsb2NrKSA9PiB7XG4gICAgICAgICAgICByZW1hcERlZmluZShibG9jaywgc3Vic3RpdHV0ZU1hcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzaGFkZXJJbmZvLmJ1ZmZlcnMuZm9yRWFjaCgoYnVmZmVyKSA9PiB7XG4gICAgICAgICAgICByZW1hcERlZmluZShidWZmZXIsIHN1YnN0aXR1dGVNYXApO1xuICAgICAgICB9KTtcbiAgICAgICAgc2hhZGVySW5mby5pbWFnZXMuZm9yRWFjaCgoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgIHJlbWFwRGVmaW5lKGltYWdlLCBzdWJzdGl0dXRlTWFwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzLmZvckVhY2goKHNhbXBsZXJUZXh0dXJlKSA9PiB7XG4gICAgICAgICAgICByZW1hcERlZmluZShzYW1wbGVyVGV4dHVyZSwgc3Vic3RpdHV0ZU1hcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJzLmZvckVhY2goKHNhbXBsZXIpID0+IHtcbiAgICAgICAgICAgIHJlbWFwRGVmaW5lKHNhbXBsZXIsIHN1YnN0aXR1dGVNYXApO1xuICAgICAgICB9KTtcbiAgICAgICAgc2hhZGVySW5mby50ZXh0dXJlcy5mb3JFYWNoKCh0ZXh0dXJlKSA9PiB7XG4gICAgICAgICAgICByZW1hcERlZmluZSh0ZXh0dXJlLCBzdWJzdGl0dXRlTWFwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFzc2lnblJhdGUoc2hhZGVySW5mby5ibG9ja3MsIHJhdGVzKTtcbiAgICAgICAgYXNzaWduUmF0ZShzaGFkZXJJbmZvLmJ1ZmZlcnMsIHJhdGVzKTtcbiAgICAgICAgYXNzaWduUmF0ZShzaGFkZXJJbmZvLmltYWdlcywgcmF0ZXMpO1xuICAgICAgICBhc3NpZ25SYXRlKHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzLCByYXRlcyk7XG4gICAgICAgIGFzc2lnblJhdGUoc2hhZGVySW5mby5zYW1wbGVycywgcmF0ZXMpO1xuICAgICAgICBhc3NpZ25SYXRlKHNoYWRlckluZm8udGV4dHVyZXMsIHJhdGVzKTtcbiAgICAgICAgYXNzaWduUmF0ZShzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHMsIHJhdGVzKTtcblxuICAgICAgICBhc3NpZ25TYW1wbGVUeXBlKHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzLCBzYW1wbGVUeXBlcyk7XG4gICAgICAgIGFzc2lnblNhbXBsZVR5cGUoc2hhZGVySW5mby50ZXh0dXJlcywgc2FtcGxlVHlwZXMpO1xuXG4gICAgICAgIGNvbnN0IGlzVmVydCA9IHN0YWdlID09ICd2ZXJ0JztcbiAgICAgICAgb3V0Lmdsc2wzID0gc3RyaXBUb1NwZWNpZmljVmVyc2lvbihkZWNvcmF0ZUJsb2NrTWVtb3J5TGF5b3V0cyhjb2RlLCBibG9ja0luZm8pLCAzMDAsIGNhY2hlLmV4dGVuc2lvbnMsIGlzVmVydCk7IC8vIEdMRVMzIG5lZWRzIGV4cGxpY2l0IG1lbW9yeSBsYXlvdXQgcXVhbGlmaWVyXG4gICAgICAgIGlmIChzdGFnZSA9PSAndmVydCcgfHwgc3RhZ2UgPT0gJ2ZyYWcnKSB7XG4gICAgICAgICAgICAvLyBnbHNsMSBvbmx5IHN1cHBvcnRzIHZlcnQgYW5kIGZyYWdcbiAgICAgICAgICAgIG91dC5nbHNsMSA9IHN0cmlwVG9TcGVjaWZpY1ZlcnNpb24oXG4gICAgICAgICAgICAgICAgZ2xzbDMwMHRvMTAwKGNvZGUsIHNoYWRlckluZm8uYmxvY2tzLCBvdXREZWZpbmVzLCBibG9ja0luZm8sIGZ1bmN0aW9ucywgY2FjaGUsIGlzVmVydCksXG4gICAgICAgICAgICAgICAgMTAwLFxuICAgICAgICAgICAgICAgIGNhY2hlLmV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgaXNWZXJ0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG1pc2NDaGVja3Mob3V0Lmdsc2wxKTsgLy8gVE9ETyA6IGFkZCBoaWdoZXIgdmVyc2lvbiBjaGVja3NcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dC5nbHNsMSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBjb25zdCBjcmVhdGVCdWlsdGluSW5mbyA9ICgpID0+ICh7IGJsb2NrczogW10sIHNhbXBsZXJUZXh0dXJlczogW10sIGJ1ZmZlcnM6IFtdLCBpbWFnZXM6IFtdIH0pO1xuICAgIGNvbnN0IGJ1aWxkID0gKHN0YWdlTmFtZXMsIHR5cGUsIGNodW5rcyA9IGdsb2JhbENodW5rcywgZGVwcmVjYXRpb25zID0gZ2xvYmFsRGVwcmVjYXRpb25zKSA9PiB7XG4gICAgICAgIGxldCBkZWZpbmVzID0gW107XG4gICAgICAgIGNvbnN0IHNoYWRlckluZm8gPSBjcmVhdGVTaGFkZXJJbmZvKCk7XG4gICAgICAgIGNvbnN0IHNyYyA9IHsgdmVydDogJycsIGZyYWc6ICcnIH07XG4gICAgICAgIGZvciAoY29uc3Qgc3RhZ2UgaW4gc3RhZ2VOYW1lcykge1xuICAgICAgICAgICAgc3JjW3N0YWdlXSA9IGNvbXBpbGUoc3RhZ2VOYW1lc1tzdGFnZV0sIHN0YWdlLCBkZWZpbmVzLCBzaGFkZXJJbmZvLCBjaHVua3MsIGRlcHJlY2F0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdncmFwaGljcycpIHtcbiAgICAgICAgICAgIGZpbmFsVHlwZUNoZWNrKHNyYy52ZXJ0Lmdsc2wxLCBzcmMuZnJhZy5nbHNsMSwgZGVmaW5lcywgc3RhZ2VOYW1lc1sndmVydCddLCBzdGFnZU5hbWVzWydmcmFnJ10pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnVpbHRpbnMgPSB7IGdsb2JhbHM6IGNyZWF0ZUJ1aWx0aW5JbmZvKCksIGxvY2FsczogY3JlYXRlQnVpbHRpbkluZm8oKSwgc3RhdGlzdGljczoge30gfTtcbiAgICAgICAgLy8gc3RyaXAgcnVudGltZSBjb25zdGFudHMgJiBnZW5lcmF0ZSBzdGF0aXN0aWNzXG4gICAgICAgIGRlZmluZXMgPSBkZWZpbmVzLmZpbHRlcigoZCkgPT4gZC50eXBlICE9PSAnY29uc3RhbnQnKTtcbiAgICAgICAgbGV0IHZzVW5pZm9ybVZlY3RvcnMgPSAwLFxuICAgICAgICAgICAgZnNVbmlmb3JtVmVjdG9ycyA9IDAsXG4gICAgICAgICAgICBjc1VuaWZvcm1WZWN0b3JzID0gMDtcbiAgICAgICAgc2hhZGVySW5mby5ibG9ja3MuZm9yRWFjaCgoYikgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmVjdG9ycyA9IGIubWVtYmVycy5yZWR1Y2UoKGFjYywgY3VyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXIuY291bnQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2MgKyBNYXRoLmNlaWwobWFwcGluZ3MuR2V0VHlwZVNpemUoY3VyLnR5cGUpIC8gMTYpICogY3VyLmNvdW50O1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICBpZiAoYi5zdGFnZUZsYWdzICYgVlNCaXQpIHtcbiAgICAgICAgICAgICAgICB2c1VuaWZvcm1WZWN0b3JzICs9IHZlY3RvcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYi5zdGFnZUZsYWdzICYgRlNCaXQpIHtcbiAgICAgICAgICAgICAgICBmc1VuaWZvcm1WZWN0b3JzICs9IHZlY3RvcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYi5zdGFnZUZsYWdzICYgQ1NCaXQpIHtcbiAgICAgICAgICAgICAgICBjc1VuaWZvcm1WZWN0b3JzICs9IHZlY3RvcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2dyYXBoaWNzJykge1xuICAgICAgICAgICAgYnVpbHRpbnMuc3RhdGlzdGljcy5DQ19FRkZFQ1RfVVNFRF9WRVJURVhfVU5JRk9STV9WRUNUT1JTID0gdnNVbmlmb3JtVmVjdG9ycztcbiAgICAgICAgICAgIGJ1aWx0aW5zLnN0YXRpc3RpY3MuQ0NfRUZGRUNUX1VTRURfRlJBR01FTlRfVU5JRk9STV9WRUNUT1JTID0gZnNVbmlmb3JtVmVjdG9ycztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ2NvbXB1dGUnKSB7XG4gICAgICAgICAgICBidWlsdGlucy5zdGF0aXN0aWNzLkNDX0VGRkVDVF9VU0VEX0NPTVBVVEVfVU5JRk9STV9WRUNUT1JTID0gY3NVbmlmb3JtVmVjdG9ycztcbiAgICAgICAgfVxuICAgICAgICAvLyBmaWx0ZXIgb3V0IHBpcGVsaW5lIGJ1aWx0aW4gcGFyYW1zXG4gICAgICAgIHNoYWRlckluZm8uZGVzY3JpcHRvcnNbMF0gPSB7XG4gICAgICAgICAgICByYXRlOiAwLFxuICAgICAgICAgICAgYmxvY2tzOiBbXSxcbiAgICAgICAgICAgIHNhbXBsZXJUZXh0dXJlczogW10sXG4gICAgICAgICAgICBzYW1wbGVyczogW10sXG4gICAgICAgICAgICB0ZXh0dXJlczogW10sXG4gICAgICAgICAgICBidWZmZXJzOiBbXSxcbiAgICAgICAgICAgIGltYWdlczogW10sXG4gICAgICAgICAgICBzdWJwYXNzSW5wdXRzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgc2hhZGVySW5mby5kZXNjcmlwdG9yc1sxXSA9IHtcbiAgICAgICAgICAgIHJhdGU6IDEsXG4gICAgICAgICAgICBibG9ja3M6IFtdLFxuICAgICAgICAgICAgc2FtcGxlclRleHR1cmVzOiBbXSxcbiAgICAgICAgICAgIHNhbXBsZXJzOiBbXSxcbiAgICAgICAgICAgIHRleHR1cmVzOiBbXSxcbiAgICAgICAgICAgIGJ1ZmZlcnM6IFtdLFxuICAgICAgICAgICAgaW1hZ2VzOiBbXSxcbiAgICAgICAgICAgIHN1YnBhc3NJbnB1dHM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBzaGFkZXJJbmZvLmRlc2NyaXB0b3JzWzJdID0ge1xuICAgICAgICAgICAgcmF0ZTogMixcbiAgICAgICAgICAgIGJsb2NrczogW10sXG4gICAgICAgICAgICBzYW1wbGVyVGV4dHVyZXM6IFtdLFxuICAgICAgICAgICAgc2FtcGxlcnM6IFtdLFxuICAgICAgICAgICAgdGV4dHVyZXM6IFtdLFxuICAgICAgICAgICAgYnVmZmVyczogW10sXG4gICAgICAgICAgICBpbWFnZXM6IFtdLFxuICAgICAgICAgICAgc3VicGFzc0lucHV0czogW10sXG4gICAgICAgIH07XG4gICAgICAgIHNoYWRlckluZm8uZGVzY3JpcHRvcnNbM10gPSB7XG4gICAgICAgICAgICByYXRlOiAzLFxuICAgICAgICAgICAgYmxvY2tzOiBbXSxcbiAgICAgICAgICAgIHNhbXBsZXJUZXh0dXJlczogW10sXG4gICAgICAgICAgICBzYW1wbGVyczogW10sXG4gICAgICAgICAgICB0ZXh0dXJlczogW10sXG4gICAgICAgICAgICBidWZmZXJzOiBbXSxcbiAgICAgICAgICAgIGltYWdlczogW10sXG4gICAgICAgICAgICBzdWJwYXNzSW5wdXRzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgY2xhc3NpZnlEZXNjcmlwdG9ycyhzaGFkZXJJbmZvLmRlc2NyaXB0b3JzLCBzaGFkZXJJbmZvKTtcblxuICAgICAgICAvLyBjb252ZXJ0IGNvdW50IGZyb20gc3RyaW5nIHRvIDAsIGF2b2lkaW5nIGpzYiBjcmFzaFxuICAgICAgICBmb3IgKGxldCBrID0gMDsgayAhPT0gNDsgKytrKSB7XG4gICAgICAgICAgICBjb25zdCBzZXQgPSBzaGFkZXJJbmZvLmRlc2NyaXB0b3JzW2tdO1xuICAgICAgICAgICAgc2V0LmJsb2Nrcy5mb3JFYWNoKChiKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBtIG9mIGIubWVtYmVycykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG0uY291bnQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLmNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZmlsdGVyIGRlc2NyaXB0b3JzXG4gICAgICAgIHNoYWRlckluZm8uYmxvY2tzID0gc2hhZGVySW5mby5ibG9ja3MuZmlsdGVyKGZpbHRlckZhY3RvcnkoJ2Jsb2NrcycsIGJ1aWx0aW5zKSk7XG4gICAgICAgIHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzID0gc2hhZGVySW5mby5zYW1wbGVyVGV4dHVyZXMuZmlsdGVyKGZpbHRlckZhY3RvcnkoJ3NhbXBsZXJUZXh0dXJlcycsIGJ1aWx0aW5zKSk7XG4gICAgICAgIHNoYWRlckluZm8uYnVmZmVycyA9IHNoYWRlckluZm8uYnVmZmVycy5maWx0ZXIoZmlsdGVyRmFjdG9yeSgnYnVmZmVycycsIGJ1aWx0aW5zKSk7XG4gICAgICAgIHNoYWRlckluZm8uaW1hZ2VzID0gc2hhZGVySW5mby5pbWFnZXMuZmlsdGVyKGZpbHRlckZhY3RvcnkoJ2ltYWdlcycsIGJ1aWx0aW5zKSk7XG4gICAgICAgIC8vIGF0dHJpYnV0ZSBwcm9wZXJ0eSBwcm9jZXNzXG4gICAgICAgIHNoYWRlckluZm8uYXR0cmlidXRlcy5mb3JFYWNoKChhKSA9PiB7XG4gICAgICAgICAgICBhLmZvcm1hdCA9IG1hcHBpbmdzLmZvcm1hdE1hcFthLnR5cGVuYW1lXTtcbiAgICAgICAgICAgIGlmIChhLmRlZmluZXMuaW5kZXhPZignVVNFX0lOU1RBTkNJTkcnKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgYS5pc0luc3RhbmNlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYS50YWdzICYmIGEudGFncy5mb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAvLyBjdXN0b20gZm9ybWF0XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG1hcHBpbmdzLmdldEZvcm1hdChhLnRhZ3MuZm9ybWF0KTtcbiAgICAgICAgICAgICAgICBpZiAoZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGEuZm9ybWF0ID0gZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1hcHBpbmdzLmlzTm9ybWFsaXplZChmKSkge1xuICAgICAgICAgICAgICAgICAgICBhLmlzTm9ybWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdHJpcCB0aGUgaW50ZXJtZWRpYXRlIGluZm9ybWF0aW9uc1xuICAgICAgICBzaGFkZXJJbmZvLmF0dHJpYnV0ZXMuZm9yRWFjaChcbiAgICAgICAgICAgICh2KSA9PiAoXG4gICAgICAgICAgICAgICAgZGVsZXRlIHYudGFncywgZGVsZXRlIHYudHlwZW5hbWUsIGRlbGV0ZSB2LnByZWNpc2lvbiwgZGVsZXRlIHYuaXNBcnJheSwgZGVsZXRlIHYudHlwZSwgZGVsZXRlIHYuY291bnQsIGRlbGV0ZSB2LnN0YWdlRmxhZ3NcbiAgICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICAgIHNoYWRlckluZm8udmFyeWluZ3MuZm9yRWFjaCgodikgPT4gKGRlbGV0ZSB2LnRhZ3MsIGRlbGV0ZSB2LnR5cGVuYW1lLCBkZWxldGUgdi5wcmVjaXNpb24sIGRlbGV0ZSB2LmlzQXJyYXkpKTtcbiAgICAgICAgc2hhZGVySW5mby5ibG9ja3MuZm9yRWFjaChcbiAgICAgICAgICAgIChiKSA9PiAoZGVsZXRlIGIucmF0ZSwgZGVsZXRlIGIudGFncywgYi5tZW1iZXJzLmZvckVhY2goKHYpID0+IChkZWxldGUgdi50eXBlbmFtZSwgZGVsZXRlIHYucHJlY2lzaW9uLCBkZWxldGUgdi5pc0FycmF5KSkpLFxuICAgICAgICApO1xuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJUZXh0dXJlcy5mb3JFYWNoKCh2KSA9PiAoZGVsZXRlIHYucmF0ZSwgZGVsZXRlIHYudGFncywgZGVsZXRlIHYudHlwZW5hbWUsIGRlbGV0ZSB2LnByZWNpc2lvbiwgZGVsZXRlIHYuaXNBcnJheSkpO1xuICAgICAgICBzaGFkZXJJbmZvLmJ1ZmZlcnMuZm9yRWFjaChcbiAgICAgICAgICAgICh2KSA9PiAoZGVsZXRlIHYucmF0ZSwgZGVsZXRlIHYudGFncywgZGVsZXRlIHYudHlwZW5hbWUsIGRlbGV0ZSB2LnByZWNpc2lvbiwgZGVsZXRlIHYuaXNBcnJheSwgZGVsZXRlIHYubWVtYmVycyksXG4gICAgICAgICk7XG4gICAgICAgIHNoYWRlckluZm8uaW1hZ2VzLmZvckVhY2goKHYpID0+IChkZWxldGUgdi5yYXRlLCBkZWxldGUgdi50YWdzLCBkZWxldGUgdi50eXBlbmFtZSwgZGVsZXRlIHYucHJlY2lzaW9uLCBkZWxldGUgdi5pc0FycmF5KSk7XG4gICAgICAgIHNoYWRlckluZm8udGV4dHVyZXMuZm9yRWFjaCgodikgPT4gKGRlbGV0ZSB2LnJhdGUsIGRlbGV0ZSB2LnRhZ3MsIGRlbGV0ZSB2LnR5cGVuYW1lLCBkZWxldGUgdi5wcmVjaXNpb24sIGRlbGV0ZSB2LmlzQXJyYXkpKTtcbiAgICAgICAgc2hhZGVySW5mby5zYW1wbGVycy5mb3JFYWNoKCh2KSA9PiAoZGVsZXRlIHYucmF0ZSwgZGVsZXRlIHYudGFncywgZGVsZXRlIHYudHlwZW5hbWUsIGRlbGV0ZSB2LnByZWNpc2lvbiwgZGVsZXRlIHYuaXNBcnJheSkpO1xuICAgICAgICBzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHMuZm9yRWFjaCgodikgPT4gKGRlbGV0ZSB2LnJhdGUsIGRlbGV0ZSB2LnRhZ3MsIGRlbGV0ZSB2LnR5cGVuYW1lLCBkZWxldGUgdi5wcmVjaXNpb24sIGRlbGV0ZSB2LmlzQXJyYXkpKTtcbiAgICAgICAgLy8gYXNzaWduIGJpbmRpbmdzXG4gICAgICAgIGxldCBiaW5kaW5nSWR4ID0gMDtcbiAgICAgICAgc2hhZGVySW5mby5ibG9ja3MuZm9yRWFjaCgodSkgPT4gKHUuYmluZGluZyA9IGJpbmRpbmdJZHgrKykpO1xuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJUZXh0dXJlcy5mb3JFYWNoKCh1KSA9PiAodS5iaW5kaW5nID0gYmluZGluZ0lkeCsrKSk7XG4gICAgICAgIHNoYWRlckluZm8uc2FtcGxlcnMuZm9yRWFjaCgodSkgPT4gKHUuYmluZGluZyA9IGJpbmRpbmdJZHgrKykpO1xuICAgICAgICBzaGFkZXJJbmZvLnRleHR1cmVzLmZvckVhY2goKHUpID0+ICh1LmJpbmRpbmcgPSBiaW5kaW5nSWR4KyspKTtcbiAgICAgICAgc2hhZGVySW5mby5idWZmZXJzLmZvckVhY2goKHUpID0+ICh1LmJpbmRpbmcgPSBiaW5kaW5nSWR4KyspKTtcbiAgICAgICAgc2hhZGVySW5mby5pbWFnZXMuZm9yRWFjaCgodSkgPT4gKHUuYmluZGluZyA9IGJpbmRpbmdJZHgrKykpO1xuICAgICAgICBzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHMuZm9yRWFjaCgodSkgPT4gKHUuYmluZGluZyA9IGJpbmRpbmdJZHgrKykpO1xuICAgICAgICBsZXQgbG9jYXRpb25JZHggPSAwO1xuICAgICAgICBzaGFkZXJJbmZvLmF0dHJpYnV0ZXMuZm9yRWFjaCgoYSkgPT4gKGEubG9jYXRpb24gPSBsb2NhdGlvbklkeCsrKSk7XG4gICAgICAgIGxvY2F0aW9uSWR4ID0gMDtcbiAgICAgICAgc2hhZGVySW5mby52YXJ5aW5ncy5mb3JFYWNoKCh1KSA9PiAodS5sb2NhdGlvbiA9IGxvY2F0aW9uSWR4KyspKTtcbiAgICAgICAgbG9jYXRpb25JZHggPSAwO1xuICAgICAgICBzaGFkZXJJbmZvLmZyYWdDb2xvcnMuZm9yRWFjaCgodSkgPT4gKHUubG9jYXRpb24gPSBsb2NhdGlvbklkeCsrKSk7XG5cbiAgICAgICAgLy8gZmlsdGVyIGRlZmluZXMgZm9yIGpzb25cbiAgICAgICAgc2hhZGVySW5mby5ibG9ja3MuZm9yRWFjaCgodSkgPT4gKHUuZGVmaW5lcyA9IHUuZGVmaW5lcy5maWx0ZXIoKGQpID0+IGRlZmluZXMuZmluZCgoZGVmKSA9PiBkLmVuZHNXaXRoKGRlZi5uYW1lKSkpKSk7XG4gICAgICAgIHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzLmZvckVhY2goKHUpID0+ICh1LmRlZmluZXMgPSB1LmRlZmluZXMuZmlsdGVyKChkKSA9PiBkZWZpbmVzLmZpbmQoKGRlZikgPT4gZC5lbmRzV2l0aChkZWYubmFtZSkpKSkpO1xuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJzLmZvckVhY2goKHUpID0+ICh1LmRlZmluZXMgPSB1LmRlZmluZXMuZmlsdGVyKChkKSA9PiBkZWZpbmVzLmZpbmQoKGRlZikgPT4gZC5lbmRzV2l0aChkZWYubmFtZSkpKSkpO1xuICAgICAgICBzaGFkZXJJbmZvLnRleHR1cmVzLmZvckVhY2goKHUpID0+ICh1LmRlZmluZXMgPSB1LmRlZmluZXMuZmlsdGVyKChkKSA9PiBkZWZpbmVzLmZpbmQoKGRlZikgPT4gZC5lbmRzV2l0aChkZWYubmFtZSkpKSkpO1xuICAgICAgICBzaGFkZXJJbmZvLmJ1ZmZlcnMuZm9yRWFjaCgodSkgPT4gKHUuZGVmaW5lcyA9IHUuZGVmaW5lcy5maWx0ZXIoKGQpID0+IGRlZmluZXMuZmluZCgoZGVmKSA9PiBkLmVuZHNXaXRoKGRlZi5uYW1lKSkpKSk7XG4gICAgICAgIHNoYWRlckluZm8uaW1hZ2VzLmZvckVhY2goKHUpID0+ICh1LmRlZmluZXMgPSB1LmRlZmluZXMuZmlsdGVyKChkKSA9PiBkZWZpbmVzLmZpbmQoKGRlZikgPT4gZC5lbmRzV2l0aChkZWYubmFtZSkpKSkpO1xuICAgICAgICBzaGFkZXJJbmZvLnN1YnBhc3NJbnB1dHMuZm9yRWFjaCgodSkgPT4gKHUuZGVmaW5lcyA9IHUuZGVmaW5lcy5maWx0ZXIoKGQpID0+IGRlZmluZXMuZmluZCgoZGVmKSA9PiBkLmVuZHNXaXRoKGRlZi5uYW1lKSkpKSk7XG4gICAgICAgIHNoYWRlckluZm8uYXR0cmlidXRlcy5mb3JFYWNoKCh1KSA9PiAodS5kZWZpbmVzID0gdS5kZWZpbmVzLmZpbHRlcigoZCkgPT4gZGVmaW5lcy5maW5kKChkZWYpID0+IGQuZW5kc1dpdGgoZGVmLm5hbWUpKSkpKTtcbiAgICAgICAgc2hhZGVySW5mby52YXJ5aW5ncy5mb3JFYWNoKCh1KSA9PiAodS5kZWZpbmVzID0gdS5kZWZpbmVzLmZpbHRlcigoZCkgPT4gZGVmaW5lcy5maW5kKChkZWYpID0+IGQuZW5kc1dpdGgoZGVmLm5hbWUpKSkpKTtcbiAgICAgICAgc2hhZGVySW5mby5mcmFnQ29sb3JzLmZvckVhY2goKHUpID0+ICh1LmRlZmluZXMgPSB1LmRlZmluZXMuZmlsdGVyKChkKSA9PiBkZWZpbmVzLmZpbmQoKGRlZikgPT4gZC5lbmRzV2l0aChkZWYubmFtZSkpKSkpO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIGJpbmRpbmcgbGF5b3V0IGZvciBnbHNsNFxuICAgICAgICBjb25zdCBnbHNsMSA9IHt9LFxuICAgICAgICAgICAgZ2xzbDMgPSB7fSxcbiAgICAgICAgICAgIGdsc2w0ID0ge307XG4gICAgICAgIGNvbnN0IHJlY29yZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChjb25zdCBzdGFnZSBpbiBzdGFnZU5hbWVzKSB7XG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSBiaW5kaW5nIGxheW91dCBmb3IgZ2xzbDRcbiAgICAgICAgICAgIGNvbnN0IGlzVmVydCA9IHN0YWdlID09PSAndmVydCc7XG4gICAgICAgICAgICBzcmNbc3RhZ2VdLmdsc2w0ID0gc3RyaXBUb1NwZWNpZmljVmVyc2lvbihcbiAgICAgICAgICAgICAgICBkZWNvcmF0ZUJpbmRpbmdzKHNyY1tzdGFnZV0uZ2xzbDQsIHNoYWRlckluZm8sIHNyY1tzdGFnZV0uYmxvY2tJbmZvKSxcbiAgICAgICAgICAgICAgICA0NjAsXG4gICAgICAgICAgICAgICAgc3JjW3N0YWdlXS5leHRlbnNpb25zLFxuICAgICAgICAgICAgICAgIGlzVmVydCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBnbHNsNFtzdGFnZV0gPSBjbGVhbihzcmNbc3RhZ2VdLmdsc2w0KTsgLy8gZm9yIFNQSVItVi1iYXNlZCBjcm9zcy1jb21waWxhdGlvblxuICAgICAgICAgICAgZ2xzbDNbc3RhZ2VdID0gY2xlYW4oc3JjW3N0YWdlXS5nbHNsMyk7IC8vIGZvciBXZWJHTDIvR0xFUzNcbiAgICAgICAgICAgIGdsc2wxW3N0YWdlXSA9IGNsZWFuKHNyY1tzdGFnZV0uZ2xzbDEpOyAvLyBmb3IgV2ViR0wvR0xFUzJcbiAgICAgICAgICAgIHNyY1tzdGFnZV0ucmVjb3JkLmZvckVhY2goKHYpID0+IHJlY29yZC5hZGQodikpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGhhc2ggPSAwO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2dyYXBoaWNzJykge1xuICAgICAgICAgICAgaWYgKGdsc2w0LmNvbXB1dGUgfHwgZ2xzbDMuY29tcHV0ZSkge1xuICAgICAgICAgICAgICAgIGVycm9yKCdjb21wdXRlIHNoYWRlciBpcyBub3Qgc3VwcG9ydGVkIGluIGdyYXBoaWNzIGVmZmVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGFzaCA9IG1hcHBpbmdzLm11cm11cmhhc2gyXzMyX2djKGdsc2w0LnZlcnQgKyBnbHNsNC5mcmFnICsgZ2xzbDMudmVydCArIGdsc2wzLmZyYWcgKyBnbHNsMS52ZXJ0ICsgZ2xzbDEuZnJhZywgNjY2KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChnbHNsNC52ZXJ0IHx8IGdsc2w0LmZyYWcgfHwgZ2xzbDMudmVydCB8fCBnbHNsMy5mcmFnIHx8IGdsc2wxLnZlcnQgfHwgZ2xzbDEuZnJhZykge1xuICAgICAgICAgICAgICAgIGVycm9yKCd2ZXJ0ZXgvZnJhZ21lbnQgc2hhZGVyIGlzIG5vdCBzdXBwb3J0ZWQgaW4gY29tcHV0ZSBlZmZlY3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhhc2ggPSBtYXBwaW5ncy5tdXJtdXJoYXNoMl8zMl9nYyhcbiAgICAgICAgICAgICAgICBnbHNsNC52ZXJ0ICsgZ2xzbDQuZnJhZyArIGdsc2w0LmNvbXB1dGUgKyBnbHNsMy52ZXJ0ICsgZ2xzbDMuZnJhZyArIGdsc2wzLmNvbXB1dGUgKyBnbHNsMS52ZXJ0ICsgZ2xzbDEuZnJhZyxcbiAgICAgICAgICAgICAgICA2NjYsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFzc0dyb3VwID0gc2hhZGVySW5mby5kZXNjcmlwdG9yc1szXTtcbiAgICAgICAgc2hhZGVySW5mby5ibG9ja3MgPSBzaGFkZXJJbmZvLmJsb2Nrcy5maWx0ZXIoKHYpID0+IHBhc3NHcm91cC5ibG9ja3MuZXZlcnkoKHQpID0+IHQubmFtZSAhPT0gdi5uYW1lKSk7XG4gICAgICAgIHNoYWRlckluZm8uc2FtcGxlclRleHR1cmVzID0gc2hhZGVySW5mby5zYW1wbGVyVGV4dHVyZXMuZmlsdGVyKCh2KSA9PiBwYXNzR3JvdXAuc2FtcGxlclRleHR1cmVzLmV2ZXJ5KCh0KSA9PiB0Lm5hbWUgIT09IHYubmFtZSkpO1xuICAgICAgICBzaGFkZXJJbmZvLnNhbXBsZXJzID0gc2hhZGVySW5mby5zYW1wbGVycy5maWx0ZXIoKHYpID0+IHBhc3NHcm91cC5zYW1wbGVycy5ldmVyeSgodCkgPT4gdC5uYW1lICE9PSB2Lm5hbWUpKTtcbiAgICAgICAgc2hhZGVySW5mby50ZXh0dXJlcyA9IHNoYWRlckluZm8udGV4dHVyZXMuZmlsdGVyKCh2KSA9PiBwYXNzR3JvdXAudGV4dHVyZXMuZXZlcnkoKHQpID0+IHQubmFtZSAhPT0gdi5uYW1lKSk7XG4gICAgICAgIHNoYWRlckluZm8uYnVmZmVycyA9IHNoYWRlckluZm8uYnVmZmVycy5maWx0ZXIoKHYpID0+IHBhc3NHcm91cC5idWZmZXJzLmV2ZXJ5KCh0KSA9PiB0Lm5hbWUgIT09IHYubmFtZSkpO1xuICAgICAgICBzaGFkZXJJbmZvLmltYWdlcyA9IHNoYWRlckluZm8uaW1hZ2VzLmZpbHRlcigodikgPT4gcGFzc0dyb3VwLmltYWdlcy5ldmVyeSgodCkgPT4gdC5uYW1lICE9PSB2Lm5hbWUpKTtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihzaGFkZXJJbmZvLCB7IGhhc2gsIGdsc2w0LCBnbHNsMywgZ2xzbDEsIGJ1aWx0aW5zLCBkZWZpbmVzLCByZWNvcmQgfSk7XG4gICAgfTtcbiAgICByZXR1cm4geyBjb21waWxlLCBidWlsZCB9O1xufSkoKTtcblxuY29uc3QgY29tcGlsZVNoYWRlciA9IHNoYWRlckZhY3RvcnkuY29tcGlsZTtcblxuLy8gPT09PT09PT09PT09PT09PT09XG4vLyBlZmZlY3RzXG4vLyA9PT09PT09PT09PT09PT09PT1cblxuY29uc3QgcGFyc2VFZmZlY3QgPSAoKCkgPT4ge1xuICAgIGNvbnN0IGVmZmVjdFJFID0gL0NDRWZmZWN0XFxzKiV7KFteXSs/KSg/On0lfCV9KS87XG4gICAgY29uc3QgcHJvZ3JhbVJFID0gL0NDUHJvZ3JhbVxccyooW1xcdy1dKylcXHMqJXsoW15dKj8pKD86fSV8JX0pLztcbiAgICBjb25zdCBoYXNoQ29tbWVudHMgPSAvIy4qJC9nbTtcbiAgICBjb25zdCB3aGl0ZXNwYWNlcyA9IC9eXFxzKiQvO1xuICAgIGNvbnN0IG5vSW5kZW50ID0gL1xcblteXFxzXS87XG4gICAgY29uc3QgbGVhZGluZ1NwYWNlID0gL15bXlxcU1xcbl0vZ207IC8vIFxccyB3aXRob3V0IFxcblxuICAgIGNvbnN0IHRhYnMgPSAvXFx0L2c7XG4gICAgY29uc3Qgc3RyaXBIYXNoQ29tbWVudHMgPSAoY29kZSkgPT4gY29kZS5yZXBsYWNlKGhhc2hDb21tZW50cywgJycpO1xuICAgIGNvbnN0IHN0cnVjdHVyYWxUeXBlQ2hlY2sgPSAocmVmLCBjdXIsIHBhdGggPSAnZWZmZWN0JykgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWYpKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY3VyKSkge1xuICAgICAgICAgICAgICAgIGVycm9yKGBFRlgxMDAyOiAke3BhdGh9IG11c3QgYmUgYW4gYXJyYXlgKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVmWzBdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJhbFR5cGVDaGVjayhyZWZbMF0sIGN1cltpXSwgcGF0aCArIGBbJHtpfV1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWN1ciB8fCB0eXBlb2YgY3VyICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGN1cikpIHtcbiAgICAgICAgICAgICAgICBlcnJvcihgRUZYMTAwMzogJHtwYXRofSBtdXN0IGJlIGFuIG9iamVjdGApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGN1cikpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoYEVGWDEwMDQ6IHN5bnRheCBlcnJvciBhdCAnJHtrZXl9JywgeW91IG1pZ2h0IG5lZWQgdG8gaW5zZXJ0IGEgc3BhY2UgYWZ0ZXIgY29sb25gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVmLmFueSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGN1cikpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJhbFR5cGVDaGVjayhyZWYuYW55LCBjdXJba2V5XSwgcGF0aCArIGAuJHtrZXl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXN0S2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVzdEtleVswXSA9PT0gJyQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0S2V5ID0gdGVzdEtleS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWN1clt0ZXN0S2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJhbFR5cGVDaGVjayhyZWZba2V5XSwgY3VyW3Rlc3RLZXldLCBwYXRoICsgYC4ke3Rlc3RLZXl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gKG5hbWUsIGNvbnRlbnQpID0+IHtcbiAgICAgICAgc2hhZGVyTmFtZSA9ICdzeW50YXgnO1xuICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKHRhYnMsICcgJy5yZXBlYXQodGFiQXNTcGFjZXMpKTtcbiAgICAgICAgLy8gcHJvY2VzcyBlYWNoIGJsb2NrXG4gICAgICAgIGxldCBlZmZlY3QgPSB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlcyA9IHt9LFxuICAgICAgICAgICAgbG9jYWxEZXByZWNhdGlvbnMgPSB7fTtcbiAgICAgICAgY29uc3QgZWZmZWN0Q2FwID0gZWZmZWN0UkUuZXhlYyhzdHJpcEhhc2hDb21tZW50cyhjb250ZW50KSk7XG4gICAgICAgIGlmICghZWZmZWN0Q2FwKSB7XG4gICAgICAgICAgICBlcnJvcignRUZYMTAwMDogQ0NFZmZlY3QgaXMgbm90IGRlZmluZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3JjID0geWFtbC5sb2FkKGVmZmVjdENhcFsxXSk7XG4gICAgICAgICAgICAgICAgLy8gZGVlcCBjbG9uZSB0byBkZWNvdXBsZSByZWZlcmVuY2VzXG4gICAgICAgICAgICAgICAgZWZmZWN0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzcmMpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBlcnJvcihgRUZYMTAwMTogQ0NFZmZlY3QgcGFyc2VyIGZhaWxlZDogJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFlZmZlY3QubmFtZSkge1xuICAgICAgICAgICAgICAgIGVmZmVjdC5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cnVjdHVyYWxUeXBlQ2hlY2sobWFwcGluZ3MuZWZmZWN0U3RydWN0dXJlLCBlZmZlY3QpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRlbnQgPSBzdHJpcENvbW1lbnRzKGNvbnRlbnQpO1xuICAgICAgICBsZXQgcHJvZ3JhbUNhcCA9IHByb2dyYW1SRS5leGVjKGNvbnRlbnQpO1xuICAgICAgICB3aGlsZSAocHJvZ3JhbUNhcCkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHByb2dyYW1DYXBbMl07XG4gICAgICAgICAgICBpZiAoIXdoaXRlc3BhY2VzLnRlc3QocmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIC8vIHNraXAgdGhpcyBmb3IgZW1wdHkgYmxvY2tzXG4gICAgICAgICAgICAgICAgd2hpbGUgKCFub0luZGVudC50ZXN0KHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UobGVhZGluZ1NwYWNlLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkQ2h1bmsocHJvZ3JhbUNhcFsxXSwgcmVzdWx0LCB0ZW1wbGF0ZXMsIGxvY2FsRGVwcmVjYXRpb25zKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnN1YnN0cmluZyhwcm9ncmFtQ2FwLmluZGV4ICsgcHJvZ3JhbUNhcFswXS5sZW5ndGgpO1xuICAgICAgICAgICAgcHJvZ3JhbUNhcCA9IHByb2dyYW1SRS5leGVjKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGVmZmVjdCwgdGVtcGxhdGVzLCBsb2NhbERlcHJlY2F0aW9ucyB9O1xuICAgIH07XG59KSgpO1xuXG5jb25zdCBtYXBQYXNzUGFyYW0gPSAoKCkgPT4ge1xuICAgIGNvbnN0IGZpbmRVbmlmb3JtVHlwZSA9IChuYW1lLCBzaGFkZXIpID0+IHtcbiAgICAgICAgbGV0IHJlcyA9IDAsXG4gICAgICAgICAgICBjYiA9ICh1KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHUubmFtZSAhPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcyA9IHUudHlwZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGlmICghc2hhZGVyLmJsb2Nrcy5zb21lKChiKSA9PiBiLm1lbWJlcnMuc29tZShjYikpKSB7XG4gICAgICAgICAgICBzaGFkZXIuc2FtcGxlclRleHR1cmVzLnNvbWUoY2IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBjb25zdCBwcm9wVHlwZUNoZWNrID0gKHZhbHVlLCB0eXBlLCBnaXZlblR5cGUpID0+IHtcbiAgICAgICAgaWYgKHR5cGUgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICdubyBtYXRjaGluZyB1bmlmb3JtJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9IC8vIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgaWYgKGdpdmVuVHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghbWFwcGluZ3MuaXNTYW1wbGVyKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdzdHJpbmcgZm9yIHZlY3RvcnMnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuICdub24tYXJyYXkgZm9yIGJ1ZmZlciBtZW1iZXJzJztcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5sZW5ndGggIT09IG1hcHBpbmdzLkdldFR5cGVTaXplKHR5cGUpIC8gNCkge1xuICAgICAgICAgICAgcmV0dXJuICd3cm9uZyBhcnJheSBsZW5ndGgnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9O1xuICAgIGNvbnN0IHRhcmdldFJFID0gL14oXFx3KykoPzpcXC4oW3h5enddK3xbcmdiYV0rKSk/JC87XG4gICAgY29uc3QgY2hhbm5lbE1hcCA9IHsgeDogMCwgeTogMSwgejogMiwgdzogMywgcjogMCwgZzogMSwgYjogMiwgYTogMyB9O1xuICAgIGNvbnN0IG1hcFRhcmdldCA9ICh0YXJnZXQsIHNoYWRlcikgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVJbmZvID0gW3RhcmdldCwgMCwgMF07XG4gICAgICAgIGNvbnN0IGNhcCA9IHRhcmdldFJFLmV4ZWModGFyZ2V0KTtcbiAgICAgICAgaWYgKCFjYXApIHtcbiAgICAgICAgICAgIGVycm9yKGBFRlgzMzAzOiBpbGxlZ2FsIHByb3BlcnR5IHRhcmdldCAnJHt0YXJnZXR9J2ApO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZUluZm87XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3dpenpsZSA9IChjYXBbMl0gJiYgY2FwWzJdLnRvTG93ZXJDYXNlKCkpIHx8ICcnO1xuICAgICAgICBjb25zdCBiZWdpbm5pbmcgPSBjaGFubmVsTWFwW3N3aXp6bGVbMF1dIHx8IDA7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHN3aXp6bGVcbiAgICAgICAgICAgICAgICAuc3BsaXQoJycpXG4gICAgICAgICAgICAgICAgLm1hcCgoYywgaWR4KSA9PiBjaGFubmVsTWFwW2NdIC0gYmVnaW5uaW5nIC0gaWR4KVxuICAgICAgICAgICAgICAgIC5zb21lKChuKSA9PiBuKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGVycm9yKGBFRlgzMzA0OiAnJHt0YXJnZXR9JzogcmFuZG9tIGNvbXBvbmVudCBzd2l6emxlIGlzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgfVxuICAgICAgICBoYW5kbGVJbmZvWzBdID0gY2FwWzFdO1xuICAgICAgICBoYW5kbGVJbmZvWzFdID0gYmVnaW5uaW5nO1xuICAgICAgICBoYW5kbGVJbmZvWzJdID0gZmluZFVuaWZvcm1UeXBlKGNhcFsxXSwgc2hhZGVyKTtcbiAgICAgICAgaWYgKHN3aXp6bGUubGVuZ3RoKSB7XG4gICAgICAgICAgICBoYW5kbGVJbmZvWzJdIC09IE1hdGgubWF4KDAsIG1hcHBpbmdzLkdldFR5cGVTaXplKGhhbmRsZUluZm9bMl0pIC8gNCAtIHN3aXp6bGUubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlSW5mb1syXSA8PSAwKSB7XG4gICAgICAgICAgICBlcnJvcihgRUZYMzMwNTogbm8gbWF0Y2hpbmcgdW5pZm9ybSB0YXJnZXQgJyR7dGFyZ2V0fSdgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGFuZGxlSW5mbztcbiAgICB9O1xuICAgIGNvbnN0IG1hcFByb3BlcnRpZXMgPSAocHJvcHMsIHNoYWRlcikgPT4ge1xuICAgICAgICBsZXQgbWV0YWRhdGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBwIG9mIE9iamVjdC5rZXlzKHByb3BzKSkge1xuICAgICAgICAgICAgaWYgKHAgPT09ICdfX21ldGFkYXRhX18nKSB7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGEgPSBwcm9wc1twXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgcHJvcHNbcF07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gcHJvcHNbcF0sXG4gICAgICAgICAgICAgICAgc2hhZGVyVHlwZSA9IGZpbmRVbmlmb3JtVHlwZShwLCBzaGFkZXIpO1xuICAgICAgICAgICAgLy8gdHlwZSB0cmFuc2xhdGlvbiBvciBleHRyYWN0aW9uXG4gICAgICAgICAgICBpZiAoaW5mby50eXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB3YXJuKGBFRlgzMzAwOiBwcm9wZXJ0eSAnJHtwfSc6IHlvdSBkb24ndCBoYXZlIHRvIHNwZWNpZnkgdHlwZSBpbiBoZXJlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmZvLnR5cGUgPSBzaGFkZXJUeXBlO1xuICAgICAgICAgICAgLy8gdGFyZ2V0IHNwZWNpZmljYXRpb25cbiAgICAgICAgICAgIGlmIChpbmZvLnRhcmdldCkge1xuICAgICAgICAgICAgICAgIGluZm8uaGFuZGxlSW5mbyA9IG1hcFRhcmdldChpbmZvLnRhcmdldCwgc2hhZGVyKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5mby50YXJnZXQ7XG4gICAgICAgICAgICAgICAgaW5mby50eXBlID0gaW5mby5oYW5kbGVJbmZvWzJdO1xuICAgICAgICAgICAgICAgIC8vIHBvbHlmaWxsIHNvdXJjZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIGNvbnN0IGRlcHJlY2F0ZWQgPSBpbmZvLmVkaXRvciAmJiBpbmZvLmVkaXRvci52aXNpYmxlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGluZm8uaGFuZGxlSW5mb1swXSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VHlwZSA9IGZpbmRVbmlmb3JtVHlwZShpbmZvLmhhbmRsZUluZm9bMF0sIHNoYWRlcik7XG4gICAgICAgICAgICAgICAgaWYgKCFwcm9wc1t0YXJnZXRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzW3RhcmdldF0gPSB7IHR5cGU6IHRhcmdldFR5cGUsIGVkaXRvcjogeyB2aXNpYmxlOiBmYWxzZSB9IH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZXByZWNhdGVkID09PSB1bmRlZmluZWQgfHwgZGVwcmVjYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByb3BzW3RhcmdldF0uZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wc1t0YXJnZXRdLmVkaXRvciA9IHsgZGVwcmVjYXRlZDogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BzW3RhcmdldF0uZWRpdG9yLmRlcHJlY2F0ZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbdGFyZ2V0XS5lZGl0b3IuZGVwcmVjYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1hcHBpbmdzLmlzU2FtcGxlcih0YXJnZXRUeXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbdGFyZ2V0XS52YWx1ZSA9IGluZm8udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByb3BzW3RhcmdldF0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3RhcmdldF0udmFsdWUgPSBBcnJheShtYXBwaW5ncy5HZXRUeXBlU2l6ZSh0YXJnZXRUeXBlKSAvIDQpLmZpbGwoMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5mby52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3RhcmdldF0udmFsdWUuc3BsaWNlKGluZm8uaGFuZGxlSW5mb1sxXSwgaW5mby52YWx1ZS5sZW5ndGgsIC4uLmluZm8udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluZm8udmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbdGFyZ2V0XS52YWx1ZS5zcGxpY2UoaW5mby5oYW5kbGVJbmZvWzFdLCAxLCBpbmZvLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNhbXBsZXIgc3BlY2lmaWNhdGlvblxuICAgICAgICAgICAgaWYgKGluZm8uc2FtcGxlcikge1xuICAgICAgICAgICAgICAgIGluZm8uc2FtcGxlckhhc2ggPSBtYXBTYW1wbGVyKGdlbmVyYWxNYXAoaW5mby5zYW1wbGVyKSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGluZm8uc2FtcGxlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGRlZmF1bHQgdmFsdWVzXG4gICAgICAgICAgICBjb25zdCBnaXZlblR5cGUgPSB0eXBlb2YgaW5mby52YWx1ZTtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgbnVtYmVycyB0byBhcnJheVxuICAgICAgICAgICAgaWYgKGdpdmVuVHlwZSA9PT0gJ251bWJlcicgfHwgZ2l2ZW5UeXBlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICBpbmZvLnZhbHVlID0gW2luZm8udmFsdWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdHlwZSBjaGVjayB0aGUgZ2l2ZW4gdmFsdWVcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IHByb3BUeXBlQ2hlY2soaW5mby52YWx1ZSwgaW5mby50eXBlLCBnaXZlblR5cGUpO1xuICAgICAgICAgICAgaWYgKG1zZykge1xuICAgICAgICAgICAgICAgIGVycm9yKGBFRlgzMzAyOiBpbGxlZ2FsIHByb3BlcnR5IGRlY2xhcmF0aW9uIGZvciAnJHtwfSc6ICR7bXNnfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgcCBvZiBPYmplY3Qua2V5cyhwcm9wcykpIHtcbiAgICAgICAgICAgIHBhdGNoTWV0YWRhdGEocHJvcHNbcF0sIG1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgfTtcbiAgICBjb25zdCBwYXRjaE1ldGFkYXRhID0gKHRhcmdldCwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG1ldGFkYXRhKSkge1xuICAgICAgICAgICAgY29uc3QgdiA9IG1ldGFkYXRhW2tdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0W2tdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHBhdGNoTWV0YWRhdGEodGFyZ2V0W2tdLCB2KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0W2tdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba10gPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBnZW5lcmFsTWFwID0gKG9iaikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3AgPSBvYmpba2V5XTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmcgbGl0ZXJhbFxuICAgICAgICAgICAgICAgIGxldCBudW0gPSBwYXJzZUludChwcm9wKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4obnVtKSkge1xuICAgICAgICAgICAgICAgICAgICBudW0gPSBtYXBwaW5ncy5wYXNzUGFyYW1zW3Byb3AudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChudW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBvYmpba2V5XSA9IG51bTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAvLyBhcnJheXM6XG4gICAgICAgICAgICAgICAgaWYgKCFwcm9wLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9IC8vIGVtcHR5XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgcHJvcFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcC5mb3JFYWNoKGdlbmVyYWxNYXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIG5lc3RlZCBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbE1hcChwcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBzdHJpbmcgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialtrZXldID0gLy8gY29sb3IgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKChwcm9wWzBdICogMjU1KSA8PCAyNCkgfCAoKHByb3BbMV0gKiAyNTUpIDw8IDE2KSB8ICgocHJvcFsyXSAqIDI1NSkgPDwgOCkgfCAoKHByb3BbM10gfHwgMjU1KSAqIDI1NSkpID4+PiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb3AgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhbE1hcChwcm9wKTsgLy8gbmVzdGVkIHByb3BzXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICAgIGNvbnN0IHNhbXBsZXJJbmZvID0gbmV3IG1hcHBpbmdzLlNhbXBsZXJJbmZvKCk7XG4gICAgY29uc3QgbWFwU2FtcGxlciA9IChvYmopID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuICAgICAgICAgICAgaWYgKHNhbXBsZXJJbmZvW2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHdhcm4oYEVGWDMzMDE6IGlsbGVnYWwgc2FtcGxlciBpbmZvICcke2tleX0nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcHBpbmdzLlNhbXBsZXIuY29tcHV0ZUhhc2gob2JqKTtcbiAgICB9O1xuICAgIGNvbnN0IHByaW9yaXR5UkUgPSAvXihbYS16QS1aXSspP1xccyooWystXSk/XFxzKihbXFxkeGFiY2RlZl0rKT8kL2k7XG4gICAgY29uc3QgZGZhdWx0ID0gbWFwcGluZ3MuUmVuZGVyUHJpb3JpdHkuREVGQVVMVDtcbiAgICBjb25zdCBtaW4gPSBtYXBwaW5ncy5SZW5kZXJQcmlvcml0eS5NSU47XG4gICAgY29uc3QgbWF4ID0gbWFwcGluZ3MuUmVuZGVyUHJpb3JpdHkuTUFYO1xuICAgIGNvbnN0IG1hcFByaW9yaXR5ID0gKHN0cikgPT4ge1xuICAgICAgICBsZXQgcmVzID0gMDtcbiAgICAgICAgY29uc3QgY2FwID0gcHJpb3JpdHlSRS5leGVjKHN0cik7XG4gICAgICAgIGlmIChjYXBbMV0pIHtcbiAgICAgICAgICAgIHJlcyA9IG1hcHBpbmdzLlJlbmRlclByaW9yaXR5W2NhcFsxXS50b1VwcGVyQ2FzZSgpXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FwWzNdKSB7XG4gICAgICAgICAgICByZXMgKz0gcGFyc2VJbnQoY2FwWzNdKSAqIChjYXBbMl0gPT09ICctJyA/IC0xIDogMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTmFOKHJlcykgfHwgcmVzIDwgbWluIHx8IHJlcyA+IG1heCkge1xuICAgICAgICAgICAgd2FybihgRUZYMzAwMDogaWxsZWdhbCBwYXNzIHByaW9yaXR5OiAke3N0cn1gKTtcbiAgICAgICAgICAgIHJldHVybiBkZmF1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIGNvbnN0IG1hcFN3aXRjaCA9IChkZWYsIHNoYWRlcikgPT4ge1xuICAgICAgICBpZiAoc2hhZGVyLmRlZmluZXMuZmluZCgoZCkgPT4gZC5uYW1lID09PSBkZWYpKSB7XG4gICAgICAgICAgICBlcnJvcignRUZYMzIwMDogZXhpc3Rpbmcgc2hhZGVyIG1hY3JvcyBjYW5ub3QgYmUgdXNlZCBhcyBwYXNzIHN3aXRjaCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWY7XG4gICAgfTtcbiAgICBjb25zdCBtYXBEU1MgPSAoZHNzKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGRzcykpIHtcbiAgICAgICAgICAgIGlmICgha2V5LnN0YXJ0c1dpdGgoJ3N0ZW5jaWwnKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFrZXkuZW5kc1dpdGgoJ0Zyb250JykgJiYgIWtleS5lbmRzV2l0aCgnQmFjaycpKSB7XG4gICAgICAgICAgICAgICAgZHNzW2tleSArICdGcm9udCddID0gZHNzW2tleSArICdCYWNrJ10gPSBkc3Nba2V5XTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZHNzW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRzcy5zdGVuY2lsV3JpdGVNYXNrRnJvbnQgIT09IGRzcy5zdGVuY2lsV3JpdGVNYXNrQmFjaykge1xuICAgICAgICAgICAgd2FybignRUZYMzEwMDogV2ViR0woMikgZG9lc25cXCd0IHN1cHBvcnQgaW5jb25zaXN0ZW50IGZyb250L2JhY2sgc3RlbmNpbCB3cml0ZSBtYXNrJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRzcy5zdGVuY2lsUmVhZE1hc2tGcm9udCAhPT0gZHNzLnN0ZW5jaWxSZWFkTWFza0JhY2spIHtcbiAgICAgICAgICAgIHdhcm4oJ0VGWDMxMDE6IFdlYkdMKDIpIGRvZXNuXFwndCBzdXBwb3J0IGluY29uc2lzdGVudCBmcm9udC9iYWNrIHN0ZW5jaWwgcmVhZCBtYXNrJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRzcy5zdGVuY2lsUmVmRnJvbnQgIT09IGRzcy5zdGVuY2lsUmVmQmFjaykge1xuICAgICAgICAgICAgd2FybignRUZYMzEwMjogV2ViR0woMikgZG9lc25cXCd0IHN1cHBvcnQgaW5jb25zaXN0ZW50IGZyb250L2JhY2sgc3RlbmNpbCByZWYnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VuZXJhbE1hcChkc3MpO1xuICAgIH07XG4gICAgcmV0dXJuIChwYXNzLCBzaGFkZXIpID0+IHtcbiAgICAgICAgc2hhZGVyTmFtZSA9ICd0eXBlIGVycm9yJztcbiAgICAgICAgY29uc3QgdG1wID0ge307XG4gICAgICAgIC8vIHNwZWNpYWwgdHJlYXRtZW50c1xuICAgICAgICBpZiAocGFzcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgdG1wLnByaW9yaXR5ID0gbWFwUHJpb3JpdHkocGFzcy5wcmlvcml0eSk7XG4gICAgICAgICAgICBkZWxldGUgcGFzcy5wcmlvcml0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFzcy5kZXB0aFN0ZW5jaWxTdGF0ZSkge1xuICAgICAgICAgICAgdG1wLmRlcHRoU3RlbmNpbFN0YXRlID0gbWFwRFNTKHBhc3MuZGVwdGhTdGVuY2lsU3RhdGUpO1xuICAgICAgICAgICAgZGVsZXRlIHBhc3MuZGVwdGhTdGVuY2lsU3RhdGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhc3Muc3dpdGNoKSB7XG4gICAgICAgICAgICB0bXAuc3dpdGNoID0gbWFwU3dpdGNoKHBhc3Muc3dpdGNoLCBzaGFkZXIpO1xuICAgICAgICAgICAgZGVsZXRlIHBhc3Muc3dpdGNoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXNzLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRtcC5wcm9wZXJ0aWVzID0gbWFwUHJvcGVydGllcyhwYXNzLnByb3BlcnRpZXMsIHNoYWRlcik7XG4gICAgICAgICAgICBkZWxldGUgcGFzcy5wcm9wZXJ0aWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXNzLm1pZ3JhdGlvbnMpIHtcbiAgICAgICAgICAgIHRtcC5taWdyYXRpb25zID0gcGFzcy5taWdyYXRpb25zO1xuICAgICAgICAgICAgZGVsZXRlIHBhc3MubWlncmF0aW9ucztcbiAgICAgICAgfVxuICAgICAgICBnZW5lcmFsTWFwKHBhc3MpO1xuICAgICAgICBPYmplY3QuYXNzaWduKHBhc3MsIHRtcCk7XG4gICAgfTtcbn0pKCk7XG5cbmNvbnN0IHJlZHVjZUhlYWRlclJlY29yZCA9IChzaGFkZXJzKSA9PiB7XG4gICAgY29uc3QgZGVwcyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IHNoYWRlciBvZiBzaGFkZXJzKSB7XG4gICAgICAgIHNoYWRlci5yZWNvcmQuZm9yRWFjaChkZXBzLmFkZCwgZGVwcyk7XG4gICAgfVxuICAgIHJldHVybiBbLi4uZGVwcy52YWx1ZXMoKV07XG59O1xuXG5jb25zdCBzdGFnZVZhbGlkYXRpb24gPSAoc3RhZ2VzKSA9PiB7XG4gICAgY29uc3QgcGFzc01hcCA9IHtcbiAgICAgICAgdmVydDogJ2dyYXBoaWNzJyxcbiAgICAgICAgZnJhZzogJ2dyYXBoaWNzJyxcbiAgICAgICAgY29tcHV0ZTogJ2NvbXB1dGUnLFxuICAgIH07XG5cbiAgICBpZiAoc3RhZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBlcnJvcignMCBzdGFnZXMgcHJvdmlkZWQgZm9yIGEgcGFzcycpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGNvbnN0IHR5cGUgPSBwYXNzTWFwW3N0YWdlc1swXV07XG4gICAgc3RhZ2VzLmZvckVhY2goKHN0YWdlKSA9PiB7XG4gICAgICAgIC8vIHZhbGlkYXRpb246IGFsbCBzdGFnZXMgbXVzdCBoYXZlIHRoZSBzYW1lIHBhc3MgdHlwZVxuICAgICAgICBpZiAoIXBhc3NNYXBbc3RhZ2VdKSB7XG4gICAgICAgICAgICBlcnJvcihgaW52YWxpZCBzdGFnZSB0eXBlICR7c3RhZ2V9YCk7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhc3NNYXBbc3RhZ2VdICE9PSB0eXBlKSB7XG4gICAgICAgICAgICBlcnJvcignbW9yZSB0aGFuIG9uZSBwYXNzIHR5cGUgYXBwZWFycycpO1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHR5cGUgPT09ICdncmFwaGljcycpIHtcbiAgICAgICAgY29uc3QgdmVydCA9IHN0YWdlcy5maW5kKChzKSA9PiBzID09PSAndmVydCcpO1xuICAgICAgICBjb25zdCBmcmFnID0gc3RhZ2VzLmZpbmQoKHMpID0+IHMgPT09ICdmcmFnJyk7XG4gICAgICAgIGlmIChzdGFnZXMubGVuZ3RoID09PSAxIHx8ICF2ZXJ0IHx8ICFmcmFnKSB7XG4gICAgICAgICAgICBlcnJvcignZ3JhcGhpY3MgcGFzcyBtdXN0IGluY2x1ZGUgdmVydCBhbmQgZnJhZyBzaGFkZXJzJyk7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG59O1xuXG5jb25zdCBidWlsZEVmZmVjdCA9IChuYW1lLCBjb250ZW50KSA9PiB7XG4gICAgZWZmZWN0TmFtZSA9IG5hbWU7XG4gICAgbGV0IHsgZWZmZWN0LCB0ZW1wbGF0ZXMsIGxvY2FsRGVwcmVjYXRpb25zIH0gPSBwYXJzZUVmZmVjdChuYW1lLCBjb250ZW50KTtcbiAgICBpZiAoIWVmZmVjdCB8fCAhQXJyYXkuaXNBcnJheShlZmZlY3QudGVjaG5pcXVlcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIG1hcCBwYXNzZXNcbiAgICB0ZW1wbGF0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCBnbG9iYWxDaHVua3MsIHRlbXBsYXRlcyk7XG4gICAgY29uc3QgZGVwcmVjYXRpb25zID0ge307XG4gICAgZm9yIChjb25zdCB0eXBlIGluIGdsb2JhbERlcHJlY2F0aW9ucykge1xuICAgICAgICBkZXByZWNhdGlvbnNbdHlwZV0gPSBPYmplY3QuYXNzaWduKHt9LCBnbG9iYWxEZXByZWNhdGlvbnNbdHlwZV0sIGxvY2FsRGVwcmVjYXRpb25zW3R5cGVdKTtcbiAgICB9XG4gICAgY29uc3QgZGVwcmVjYXRpb25TdHIgPSBPYmplY3Qua2V5cyhkZXByZWNhdGlvbnMuaWRlbnRpZmllcnMpXG4gICAgICAgIC5yZWR1Y2UoKGN1ciwgYWNjKSA9PiBgfCR7YWNjfWAgKyBjdXIsICcnKVxuICAgICAgICAuc2xpY2UoMSk7XG4gICAgaWYgKGRlcHJlY2F0aW9uU3RyLmxlbmd0aCkge1xuICAgICAgICBkZXByZWNhdGlvbnMuaWRlbnRpZmllclJFID0gbmV3IFJlZ0V4cChgXFxcXGIoJHtkZXByZWNhdGlvblN0cn0pXFxcXGJgLCAnZycpO1xuICAgIH1cbiAgICBjb25zdCBzaGFkZXJzID0gKGVmZmVjdC5zaGFkZXJzID0gW10pO1xuICAgIGZvciAoY29uc3QganNvblRlY2ggb2YgZWZmZWN0LnRlY2huaXF1ZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBwYXNzIG9mIGpzb25UZWNoLnBhc3Nlcykge1xuICAgICAgICAgICAgY29uc3Qgc3RhZ2VOYW1lcyA9IHt9O1xuICAgICAgICAgICAgY29uc3Qgc3RhZ2VzID0gW107XG4gICAgICAgICAgICBpZiAocGFzcy52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgc3RhZ2VOYW1lc1sndmVydCddID0gcGFzcy52ZXJ0O1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXNzLnZlcnQ7XG4gICAgICAgICAgICAgICAgc3RhZ2VzLnB1c2goJ3ZlcnQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXNzLmZyYWcpIHtcbiAgICAgICAgICAgICAgICBzdGFnZU5hbWVzWydmcmFnJ10gPSBwYXNzLmZyYWc7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHBhc3MuZnJhZztcbiAgICAgICAgICAgICAgICBzdGFnZXMucHVzaCgnZnJhZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhc3MuY29tcHV0ZSkge1xuICAgICAgICAgICAgICAgIHN0YWdlTmFtZXNbJ2NvbXB1dGUnXSA9IHBhc3MuY29tcHV0ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgcGFzcy5jb21wdXRlO1xuICAgICAgICAgICAgICAgIHN0YWdlcy5wdXNoKCdjb21wdXRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKHBhc3MucHJvZ3JhbSA9IHN0YWdlcy5yZWR1Y2UoKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KGB8JHtzdGFnZU5hbWVzW3ZhbF19YCksIGVmZmVjdE5hbWUpKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBzdGFnZVZhbGlkYXRpb24oc3RhZ2VzKTtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnJykge1xuICAgICAgICAgICAgICAgIC8vIGludmFsaWQsIHNraXAgcGFzc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHNoYWRlciA9IHNoYWRlcnMuZmluZCgocykgPT4gcy5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgICAgIGlmICghc2hhZGVyKSB7XG4gICAgICAgICAgICAgICAgc2hhZGVyID0gc2hhZGVyRmFjdG9yeS5idWlsZChzdGFnZU5hbWVzLCB0eXBlLCB0ZW1wbGF0ZXMsIGRlcHJlY2F0aW9ucyk7XG4gICAgICAgICAgICAgICAgc2hhZGVyLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHNoYWRlcnMucHVzaChzaGFkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwUGFzc1BhcmFtKHBhc3MsIHNoYWRlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWZmZWN0LmRlcGVuZGVuY2llcyA9IHJlZHVjZUhlYWRlclJlY29yZChzaGFkZXJzKTtcbiAgICByZXR1cm4gZWZmZWN0O1xufTtcblxuLy8gPT09PT09PT09PT09PT09PT09XG4vLyBleHBvcnRzXG4vLyA9PT09PT09PT09PT09PT09PT1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3B0aW9ucyxcbiAgICBhZGRDaHVuayxcbiAgICBjb21waWxlU2hhZGVyLFxuICAgIGJ1aWxkRWZmZWN0LFxufTtcbiJdfQ==