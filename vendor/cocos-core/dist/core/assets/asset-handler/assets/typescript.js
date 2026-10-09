"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../utils");
// import { dirname, normalize } from 'path';
// import * as ts from 'typescript';
const javascript_1 = __importDefault(require("./javascript"));
const ts_utils_1 = require("./utils/ts-utils");
const asset_config_1 = __importDefault(require("../../asset-config"));
const i18n_1 = __importDefault(require("../../../base/i18n"));
const utils_2 = require("../../utils");
const engine_1 = require("../../../engine");
// import { getCompilerOptions } from './utils/ts-utils';
// const enum TypeCheckLevel {
//     disable = 'disable',
//     checkOnly = 'checkOnly',
//     fatalOnError = 'fatalOnError',
// }
exports.TypeScriptHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'typescript',
    // 引擎内对应的类型
    assetType: 'cc.Script',
    open: utils_1.openCode,
    createInfo: {
        async generateMenuInfo() {
            const menu = [
                {
                    label: 'i18n:ENGINE.assets.newTypeScript',
                    fullFileName: `${ts_utils_1.ScriptNameChecker.getDefaultClassName()}.ts`,
                    template: `db://internal/default_file_content/${exports.TypeScriptHandler.name}/default`,
                    group: 'script',
                    fileNameCheckConfigs: [ts_utils_1.DefaultScriptFileNameCheckConfig],
                    name: 'default',
                },
            ];
            const templateDir = (0, path_1.join)(asset_config_1.default.data.createTemplateRoot, exports.TypeScriptHandler.name);
            // TODO 文件夹初始化应该在点击查看脚本模板时处理
            // ensureDirSync(templateDir);
            const guideFileName = 'Custom Script Template Help Documentation.url';
            const guideFile = (0, path_1.join)(templateDir, guideFileName);
            if (!(0, fs_extra_1.existsSync)(guideFile)) {
                const content = '[InternetShortcut]\nURL=https://docs.cocos.com/creator/manual/en/scripting/setup.html#custom-script-template';
                (0, fs_extra_1.outputFileSync)(guideFile, content);
            }
            if ((0, fs_extra_1.existsSync)(templateDir)) {
                const names = (0, fs_extra_1.readdirSync)(templateDir);
                names.forEach((name) => {
                    const filePath = (0, path_1.join)(templateDir, name);
                    const stat = (0, fs_extra_1.statSync)(filePath);
                    if (stat.isDirectory()) {
                        return;
                    }
                    if (name === guideFileName || name.startsWith('.')) {
                        return;
                    }
                    const baseName = (0, path_1.basename)(name, (0, path_1.extname)(name));
                    menu.push({
                        label: baseName,
                        fullFileName: (ts_utils_1.ScriptNameChecker.getValidClassName(baseName) || ts_utils_1.ScriptNameChecker.getDefaultClassName()) + '.ts',
                        template: filePath,
                        fileNameCheckConfigs: [ts_utils_1.DefaultScriptFileNameCheckConfig],
                        name: baseName,
                    });
                });
            }
            return menu;
        },
        async create(options) {
            const path = (0, utils_2.url2path)(options.template || 'db://internal/default_file_content/typescript/default');
            if (options.content && typeof options.content !== 'string') {
                (0, fs_extra_1.outputFileSync)(options.target, options.content, 'utf-8');
                return options.target;
            }
            let content = options.content || await (0, fs_extra_1.readFile)(path, 'utf-8');
            content = content.replace(ts_utils_1.ScriptNameChecker.commentsReg, ($0) => {
                if ($0.includes('COMMENTS_GENERATE_IGNORE')) {
                    return '';
                }
                return $0;
            });
            const FileBasenameNoExtension = (0, path_1.basename)(options.target, (0, path_1.extname)(options.target));
            const scriptNameChecker = await ts_utils_1.ScriptNameCheckerManager.getScriptChecker(content);
            // 替换模板内的脚本信息
            const useData = {
                nickname: 'cocos cli'
            };
            const replaceContents = {
                // 获取一个可用的类名
                Name: ts_utils_1.ScriptNameChecker.getValidClassName(FileBasenameNoExtension),
                UnderscoreCaseClassName: ts_utils_1.ScriptNameChecker.getValidClassName(FileBasenameNoExtension),
                CamelCaseClassName: scriptNameChecker.getValidCamelCaseClassName(FileBasenameNoExtension),
                DateTime: new Date().toString(),
                Author: useData.nickname,
                FileBasename: (0, path_1.basename)(options.target),
                FileBasenameNoExtension,
                URL: (0, asset_db_1.queryUrl)(options.target),
                EditorVersion: engine_1.Engine.getInfo().version,
                ManualUrl: 'https://docs.cocos.com/creator/manual/en/scripting/setup.html#custom-script-template',
            };
            const classKey = scriptNameChecker.classNameStringFormat.substring(2, scriptNameChecker.classNameStringFormat.length - 2);
            if (classKey in replaceContents) {
                let className = replaceContents[classKey];
                if (!className || !ts_utils_1.ScriptNameChecker.invalidClassNameReg.test(className)) {
                    replaceContents.DefaultCamelCaseClassName =
                        replaceContents.CamelCaseClassName || ts_utils_1.ScriptNameChecker.getDefaultClassName();
                    if (!ts_utils_1.ScriptNameChecker.invalidClassNameReg.test(className)) {
                        content = content.replace(`@ccclass('<%${classKey}%>')`, `@ccclass('<%DefaultCamelCaseClassName%>')`);
                        content = content.replace(`class <%${classKey}%>`, `class <%DefaultCamelCaseClassName%>`);
                    }
                    className = replaceContents.DefaultCamelCaseClassName;
                    !replaceContents.CamelCaseClassName &&
                        console.warn(i18n_1.default.t('importer.script.find_class_name_from_file_name_failed', {
                            fileBasename: FileBasenameNoExtension,
                            className,
                        }));
                }
                if (!replaceContents.CamelCaseClassName) {
                    if (!replaceContents.Name) {
                        replaceContents.Name = className;
                    }
                    replaceContents.CamelCaseClassName = className;
                }
            }
            Object.keys(replaceContents).forEach((key) => {
                content = content.replace(new RegExp(`<%${key}%>`, 'g'), replaceContents[key]);
            });
            (0, fs_extra_1.outputFileSync)(options.target, content, 'utf-8');
            return options.target;
        },
        preventDefaultTemplateMenu: true,
    },
    importer: {
        ...javascript_1.default.importer,
        async import(asset) {
            const fileName = asset.source;
            if (fileName.endsWith('.d.ts')) {
                return true;
            }
            // let doTypeCheck = false;
            // let fatalOnError = false;
            // const checkLevel = await getTypeCheckLevel();
            // switch (checkLevel) {
            //     case 'checkOnly':
            //         doTypeCheck = true;
            //         fatalOnError = false;
            //         break;
            //     case 'fatalOnError':
            //         doTypeCheck = true;
            //         fatalOnError = true;
            //         break;
            //     case 'disable':
            //     default:
            //         doTypeCheck = false;
            //         break;
            // }
            return javascript_1.default.importer.import(asset);
        },
    },
    destroy: javascript_1.default.destroy,
    /**
     * 类型检查指定脚本资源。
     * @param asset 要检查的脚本资源。
     * @returns 包含错误返回 `true`，否则返回 `false`。
     */
    // private async _typeCheck(asset: Asset) {
    //     const fileName = asset.source;
    //     const compilerOptions = getCompilerOptions();
    //     const program = ts.createProgram({
    //         rootNames: [fileName],
    //         options: compilerOptions,
    //     });
    //     const sourceFile = program.getSourceFile(fileName);
    //     if (!sourceFile) {
    //         console.debug(`program created in _typeCheck() doesn't contain main entry file?`);
    //         return false;
    //     }
    //     const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
    //     // const diagnostics = program.getSyntacticDiagnostics(sourceFile);
    //     if (!diagnostics || diagnostics.length === 0) {
    //         return false;
    //     }
    //     const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
    //         getCurrentDirectory() {
    //             return dirname(asset.source);
    //         },
    //         getCanonicalFileName(fileName: string) {
    //             return normalize(fileName);
    //         },
    //         getNewLine() {
    //             return '\n';
    //         },
    //     };
    //     let nError = 0;
    //     for (const diagnostic of diagnostics) {
    //         const text = ts.formatDiagnostic(diagnostic, formatDiagnosticsHost);
    //         let printer: undefined | ((text: string) => void);
    //         switch (diagnostic.category) {
    //             case ts.DiagnosticCategory.Error:
    //                 ++nError;
    //                 printer = console.error;
    //                 break;
    //             case ts.DiagnosticCategory.Warning:
    //                 printer = console.warn;
    //                 break;
    //             case ts.DiagnosticCategory.Message:
    //             case ts.DiagnosticCategory.Suggestion:
    //             default:
    //                 printer = console.log;
    //                 break;
    //         }
    //         printer(text);
    //     }
    //     return nError !== 0;
    // }
};
exports.default = exports.TypeScriptHandler;
// async function getTypeCheckLevel() {
//     const data = await configurationManager.get('project.general.type_check_level');
//     return data;
// }
// function CocosScriptFrameTransformer<T extends ts.Node>(compressedUUID: string, basename: string): ts.TransformerFactory<T> {
//     return (context) => {
//         const visit: ts.Visitor = (node) => {
//             if (ts.isSourceFile(node)) {
//                 // `cc._RF.push(window.module || {}, compressed_uuid, basename); // begin basename`;
//                 const ccRFPush = ts.createExpressionStatement(
//                     ts.createCall(
//                         ts.createPropertyAccess(
//                             ts.createPropertyAccess(ts.createIdentifier('cc'), ts.createIdentifier('_RF')),
//                             ts.createIdentifier('push')
//                         ),
//                         undefined, // typeArguments
//                         [
//                             ts.createBinary(
//                                 ts.createPropertyAccess(ts.createIdentifier('window'), ts.createIdentifier('module')),
//                                 ts.SyntaxKind.BarBarToken,
//                                 ts.createObjectLiteral()
//                             ),
//                             ts.createStringLiteral(compressedUUID),
//                             ts.createStringLiteral(basename),
//                         ]
//                     )
//                 );
//                 // `cc._RF.pop(); // end basename`
//                 const ccRFPop = ts.createExpressionStatement(
//                     ts.createCall(
//                         ts.createPropertyAccess(
//                             ts.createPropertyAccess(ts.createIdentifier('cc'), ts.createIdentifier('_RF')),
//                             ts.createIdentifier('pop')
//                         ),
//                         undefined, // typeArguments
//                         []
//                     )
//                 );
//                 const statements = new Array<ts.Statement>();
//                 statements.push(ccRFPush);
//                 statements.push(...(node.statements));
//                 statements.push(ccRFPop);
//                 return ts.updateSourceFileNode(
//                     node,
//                     statements,
//                     node.isDeclarationFile,
//                     node.referencedFiles,
//                     node.typeReferenceDirectives,
//                     node.hasNoDefaultLib,
//                     node.libReferenceDirectives);
//             }
//             return ts.visitEachChild(node, (child) => visit(child), context);
//         };
//         return (node) => ts.visitNode(node, visit);
//     };
// }
// function CocosLibTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
//     return (context) => {
//         const visit: ts.Visitor = (node) => {
//             if (!ts.isImportDeclaration(node) ||
//                 !node.importClause || // `import "xx";` is ignored.
//                 !ts.isStringLiteral(node.moduleSpecifier) ||
//                 node.moduleSpecifier.text !== 'Cocos3D') {
//                 return ts.visitEachChild(node, (child) => visit(child), context);
//             }
//             const createCC = () => {
//                 return ts.createIdentifier('cc');
//             };
//             const variableDeclarations = new Array<ts.VariableDeclaration>();
//             const makeDefaultImport = (id: ts.Identifier) => {
//                 variableDeclarations.push(ts.createVariableDeclaration(
//                     ts.createIdentifier(id.text),
//                     undefined,
//                     createCC()
//                 ));
//             };
//             const { importClause: { name, namedBindings } } = node;
//             if (name) {
//                 // import xx from 'Cocos3D';
//                 // const xx = cc;
//                 makeDefaultImport(name);
//             }
//             if (namedBindings) {
//                 if (ts.isNamespaceImport(namedBindings)) {
//                     // import * as xx from 'Cocos3D';
//                     // const xx = cc;
//                     makeDefaultImport(namedBindings.name);
//                 } else {
//                     const bindingElements = new Array<ts.BindingElement>();
//                     for (const { name, propertyName } of namedBindings.elements) {
//                         if (propertyName) {
//                             // import { xx as yy } from 'Cocos3D';
//                             // const { xx: yy } = cc;
//                             bindingElements.push(ts.createBindingElement(
//                                 undefined, // ...
//                                 ts.createIdentifier(propertyName.text),
//                                 ts.createIdentifier(name.text)
//                             ));
//                         } else {
//                             // import { xx } from 'Cocos3D';
//                             // const { xx } = cc;
//                             bindingElements.push(ts.createBindingElement(
//                                 undefined, // ...
//                                 undefined,
//                                 ts.createIdentifier(name.text)
//                             ));
//                         }
//                     }
//                     variableDeclarations.push(ts.createVariableDeclaration(
//                         ts.createObjectBindingPattern(bindingElements),
//                         undefined, // type
//                         createCC()
//                     ));
//                 }
//             }
//             if (variableDeclarations.length === 0) {
//                 return undefined;
//             }
//             return ts.createVariableStatement(
//                 [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
//                 variableDeclarations
//             );
//         };
//         return (node) => ts.visitNode(node, visit);
//     };
// }
