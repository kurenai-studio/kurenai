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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy90eXBlc2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFrRDtBQUNsRCx1Q0FBc0c7QUFDdEcsK0JBQXdEO0FBQ3hELG9DQUFtRDtBQUNuRCw2Q0FBNkM7QUFDN0Msb0NBQW9DO0FBQ3BDLDhEQUE2QztBQUM3QywrQ0FBaUg7QUFFakgsc0VBQTZDO0FBQzdDLDhEQUFzQztBQUN0Qyx1Q0FBdUM7QUFDdkMsNENBQXlDO0FBQ3pDLHlEQUF5RDtBQUV6RCw4QkFBOEI7QUFDOUIsMkJBQTJCO0FBQzNCLCtCQUErQjtBQUMvQixxQ0FBcUM7QUFDckMsSUFBSTtBQUVTLFFBQUEsaUJBQWlCLEdBQWlCO0lBQzNDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsWUFBWTtJQUVsQixXQUFXO0lBQ1gsU0FBUyxFQUFFLFdBQVc7SUFDdEIsSUFBSSxFQUFFLGdCQUFRO0lBQ2QsVUFBVSxFQUFFO1FBQ1IsS0FBSyxDQUFDLGdCQUFnQjtZQUNsQixNQUFNLElBQUksR0FBc0I7Z0JBQzVCO29CQUNJLEtBQUssRUFBRSxrQ0FBa0M7b0JBQ3pDLFlBQVksRUFBRSxHQUFHLDRCQUFpQixDQUFDLG1CQUFtQixFQUFFLEtBQUs7b0JBQzdELFFBQVEsRUFBRSxzQ0FBc0MseUJBQWlCLENBQUMsSUFBSSxVQUFVO29CQUNoRixLQUFLLEVBQUUsUUFBUTtvQkFDZixvQkFBb0IsRUFBRSxDQUFDLDJDQUFnQyxDQUFDO29CQUN4RCxJQUFJLEVBQUUsU0FBUztpQkFDbEI7YUFDSixDQUFDO1lBQ0YsTUFBTSxXQUFXLEdBQUcsSUFBQSxXQUFJLEVBQUMsc0JBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUseUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEYsNEJBQTRCO1lBQzVCLDhC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QztBQUNyQywwQkFBMEI7QUFDMUIsb0JBQW9CO0FBQ3BCLGdCQUFnQjtBQUNoQix1REFBdUQ7QUFDdkQsb0NBQW9DO0FBQ3BDLGdCQUFnQjtBQUNoQixpREFBaUQ7QUFDakQsbUVBQW1FO0FBQ25FLHVDQUF1QztBQUN2QyxpQkFBaUI7QUFDakIsYUFBYTtBQUNiLHNEQUFzRDtBQUN0RCxTQUFTO0FBQ1QsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBxdWVyeVVybCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBlbnN1cmVEaXJTeW5jLCBleGlzdHNTeW5jLCBvdXRwdXRGaWxlU3luYywgcmVhZGRpclN5bmMsIHJlYWRGaWxlLCBzdGF0U3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBleHRuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBpMThuVHJhbnNsYXRlLCBvcGVuQ29kZSB9IGZyb20gJy4uL3V0aWxzJztcbi8vIGltcG9ydCB7IGRpcm5hbWUsIG5vcm1hbGl6ZSB9IGZyb20gJ3BhdGgnO1xuLy8gaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgSmF2YXNjcmlwdEhhbmRsZXIgZnJvbSAnLi9qYXZhc2NyaXB0JztcbmltcG9ydCB7IERlZmF1bHRTY3JpcHRGaWxlTmFtZUNoZWNrQ29uZmlnLCBTY3JpcHROYW1lQ2hlY2tlciwgU2NyaXB0TmFtZUNoZWNrZXJNYW5hZ2VyIH0gZnJvbSAnLi91dGlscy90cy11dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIsIElDcmVhdGVNZW51SW5mbyB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uLy4uL2Fzc2V0LWNvbmZpZyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgdXJsMnBhdGggfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi8uLi9lbmdpbmUnO1xuLy8gaW1wb3J0IHsgZ2V0Q29tcGlsZXJPcHRpb25zIH0gZnJvbSAnLi91dGlscy90cy11dGlscyc7XG5cbi8vIGNvbnN0IGVudW0gVHlwZUNoZWNrTGV2ZWwge1xuLy8gICAgIGRpc2FibGUgPSAnZGlzYWJsZScsXG4vLyAgICAgY2hlY2tPbmx5ID0gJ2NoZWNrT25seScsXG4vLyAgICAgZmF0YWxPbkVycm9yID0gJ2ZhdGFsT25FcnJvcicsXG4vLyB9XG5cbmV4cG9ydCBjb25zdCBUeXBlU2NyaXB0SGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ3R5cGVzY3JpcHQnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuU2NyaXB0JyxcbiAgICBvcGVuOiBvcGVuQ29kZSxcbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGFzeW5jIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICBjb25zdCBtZW51OiBJQ3JlYXRlTWVudUluZm9bXSA9IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld1R5cGVTY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICBmdWxsRmlsZU5hbWU6IGAke1NjcmlwdE5hbWVDaGVja2VyLmdldERlZmF1bHRDbGFzc05hbWUoKX0udHNgLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtUeXBlU2NyaXB0SGFuZGxlci5uYW1lfS9kZWZhdWx0YCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZUNoZWNrQ29uZmlnczogW0RlZmF1bHRTY3JpcHRGaWxlTmFtZUNoZWNrQ29uZmlnXSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVEaXIgPSBqb2luKGFzc2V0Q29uZmlnLmRhdGEuY3JlYXRlVGVtcGxhdGVSb290LCBUeXBlU2NyaXB0SGFuZGxlci5uYW1lKTtcbiAgICAgICAgICAgIC8vIFRPRE8g5paH5Lu25aS55Yid5aeL5YyW5bqU6K+l5Zyo54K55Ye75p+l55yL6ISa5pys5qih5p2/5pe25aSE55CGXG4gICAgICAgICAgICAvLyBlbnN1cmVEaXJTeW5jKHRlbXBsYXRlRGlyKTtcblxuICAgICAgICAgICAgY29uc3QgZ3VpZGVGaWxlTmFtZSA9ICdDdXN0b20gU2NyaXB0IFRlbXBsYXRlIEhlbHAgRG9jdW1lbnRhdGlvbi51cmwnO1xuICAgICAgICAgICAgY29uc3QgZ3VpZGVGaWxlID0gam9pbih0ZW1wbGF0ZURpciwgZ3VpZGVGaWxlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhndWlkZUZpbGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9XG4gICAgICAgICAgICAgICAgICAgICdbSW50ZXJuZXRTaG9ydGN1dF1cXG5VUkw9aHR0cHM6Ly9kb2NzLmNvY29zLmNvbS9jcmVhdG9yL21hbnVhbC9lbi9zY3JpcHRpbmcvc2V0dXAuaHRtbCNjdXN0b20tc2NyaXB0LXRlbXBsYXRlJztcbiAgICAgICAgICAgICAgICBvdXRwdXRGaWxlU3luYyhndWlkZUZpbGUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyh0ZW1wbGF0ZURpcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lcyA9IHJlYWRkaXJTeW5jKHRlbXBsYXRlRGlyKTtcbiAgICAgICAgICAgICAgICBuYW1lcy5mb3JFYWNoKChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKHRlbXBsYXRlRGlyLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdCA9IHN0YXRTeW5jKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBndWlkZUZpbGVOYW1lIHx8IG5hbWUuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlTmFtZSA9IGJhc2VuYW1lKG5hbWUsIGV4dG5hbWUobmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICBtZW51LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGJhc2VOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAoU2NyaXB0TmFtZUNoZWNrZXIuZ2V0VmFsaWRDbGFzc05hbWUoYmFzZU5hbWUpIHx8IFNjcmlwdE5hbWVDaGVja2VyLmdldERlZmF1bHRDbGFzc05hbWUoKSkgKyAnLnRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBmaWxlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lQ2hlY2tDb25maWdzOiBbRGVmYXVsdFNjcmlwdEZpbGVOYW1lQ2hlY2tDb25maWddLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYmFzZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lbnU7XG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIGNyZWF0ZShvcHRpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gdXJsMnBhdGgob3B0aW9ucy50ZW1wbGF0ZSB8fCAnZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC90eXBlc2NyaXB0L2RlZmF1bHQnKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbnRlbnQgJiYgdHlwZW9mIG9wdGlvbnMuY29udGVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRGaWxlU3luYyhvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5jb250ZW50LCAndXRmLTgnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50YXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgY29udGVudCA9IG9wdGlvbnMuY29udGVudCB8fCBhd2FpdCByZWFkRmlsZShwYXRoLCAndXRmLTgnKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoU2NyaXB0TmFtZUNoZWNrZXIuY29tbWVudHNSZWcsICgkMDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCQwLmluY2x1ZGVzKCdDT01NRU5UU19HRU5FUkFURV9JR05PUkUnKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAkMDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBGaWxlQmFzZW5hbWVOb0V4dGVuc2lvbiA9IGJhc2VuYW1lKG9wdGlvbnMudGFyZ2V0LCBleHRuYW1lKG9wdGlvbnMudGFyZ2V0KSk7XG4gICAgICAgICAgICBjb25zdCBzY3JpcHROYW1lQ2hlY2tlciA9IGF3YWl0IFNjcmlwdE5hbWVDaGVja2VyTWFuYWdlci5nZXRTY3JpcHRDaGVja2VyKGNvbnRlbnQpO1xuXG4gICAgICAgICAgICAvLyDmm7/mjaLmqKHmnb/lhoXnmoTohJrmnKzkv6Hmga9cbiAgICAgICAgICAgIGNvbnN0IHVzZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgbmlja25hbWU6ICdjb2NvcyBjbGknXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVwbGFjZUNvbnRlbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICAgICAgICAgIC8vIOiOt+WPluS4gOS4quWPr+eUqOeahOexu+WQjVxuICAgICAgICAgICAgICAgIE5hbWU6IFNjcmlwdE5hbWVDaGVja2VyLmdldFZhbGlkQ2xhc3NOYW1lKEZpbGVCYXNlbmFtZU5vRXh0ZW5zaW9uKSxcbiAgICAgICAgICAgICAgICBVbmRlcnNjb3JlQ2FzZUNsYXNzTmFtZTogU2NyaXB0TmFtZUNoZWNrZXIuZ2V0VmFsaWRDbGFzc05hbWUoRmlsZUJhc2VuYW1lTm9FeHRlbnNpb24pLFxuICAgICAgICAgICAgICAgIENhbWVsQ2FzZUNsYXNzTmFtZTogc2NyaXB0TmFtZUNoZWNrZXIuZ2V0VmFsaWRDYW1lbENhc2VDbGFzc05hbWUoRmlsZUJhc2VuYW1lTm9FeHRlbnNpb24pLFxuICAgICAgICAgICAgICAgIERhdGVUaW1lOiBuZXcgRGF0ZSgpLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgQXV0aG9yOiB1c2VEYXRhLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgIEZpbGVCYXNlbmFtZTogYmFzZW5hbWUob3B0aW9ucy50YXJnZXQpLFxuICAgICAgICAgICAgICAgIEZpbGVCYXNlbmFtZU5vRXh0ZW5zaW9uLFxuICAgICAgICAgICAgICAgIFVSTDogcXVlcnlVcmwob3B0aW9ucy50YXJnZXQpLFxuICAgICAgICAgICAgICAgIEVkaXRvclZlcnNpb246IEVuZ2luZS5nZXRJbmZvKCkudmVyc2lvbixcbiAgICAgICAgICAgICAgICBNYW51YWxVcmw6ICdodHRwczovL2RvY3MuY29jb3MuY29tL2NyZWF0b3IvbWFudWFsL2VuL3NjcmlwdGluZy9zZXR1cC5odG1sI2N1c3RvbS1zY3JpcHQtdGVtcGxhdGUnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzS2V5ID0gc2NyaXB0TmFtZUNoZWNrZXIuY2xhc3NOYW1lU3RyaW5nRm9ybWF0LnN1YnN0cmluZygyLCBzY3JpcHROYW1lQ2hlY2tlci5jbGFzc05hbWVTdHJpbmdGb3JtYXQubGVuZ3RoIC0gMik7XG4gICAgICAgICAgICBpZiAoY2xhc3NLZXkgaW4gcmVwbGFjZUNvbnRlbnRzKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNsYXNzTmFtZSA9IHJlcGxhY2VDb250ZW50c1tjbGFzc0tleV07XG4gICAgICAgICAgICAgICAgaWYgKCFjbGFzc05hbWUgfHwgIVNjcmlwdE5hbWVDaGVja2VyLmludmFsaWRDbGFzc05hbWVSZWcudGVzdChjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VDb250ZW50cy5EZWZhdWx0Q2FtZWxDYXNlQ2xhc3NOYW1lID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2VDb250ZW50cy5DYW1lbENhc2VDbGFzc05hbWUgfHwgU2NyaXB0TmFtZUNoZWNrZXIuZ2V0RGVmYXVsdENsYXNzTmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIVNjcmlwdE5hbWVDaGVja2VyLmludmFsaWRDbGFzc05hbWVSZWcudGVzdChjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKGBAY2NjbGFzcygnPCUke2NsYXNzS2V5fSU+JylgLCBgQGNjY2xhc3MoJzwlRGVmYXVsdENhbWVsQ2FzZUNsYXNzTmFtZSU+JylgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoYGNsYXNzIDwlJHtjbGFzc0tleX0lPmAsIGBjbGFzcyA8JURlZmF1bHRDYW1lbENhc2VDbGFzc05hbWUlPmApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IHJlcGxhY2VDb250ZW50cy5EZWZhdWx0Q2FtZWxDYXNlQ2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgICAgICAhcmVwbGFjZUNvbnRlbnRzLkNhbWVsQ2FzZUNsYXNzTmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkxOG4udCgnaW1wb3J0ZXIuc2NyaXB0LmZpbmRfY2xhc3NfbmFtZV9mcm9tX2ZpbGVfbmFtZV9mYWlsZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVCYXNlbmFtZTogRmlsZUJhc2VuYW1lTm9FeHRlbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFyZXBsYWNlQ29udGVudHMuQ2FtZWxDYXNlQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVwbGFjZUNvbnRlbnRzLk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2VDb250ZW50cy5OYW1lID0gY2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VDb250ZW50cy5DYW1lbENhc2VDbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmtleXMocmVwbGFjZUNvbnRlbnRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKG5ldyBSZWdFeHAoYDwlJHtrZXl9JT5gLCAnZycpLCByZXBsYWNlQ29udGVudHNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG91dHB1dEZpbGVTeW5jKG9wdGlvbnMudGFyZ2V0LCBjb250ZW50LCAndXRmLTgnKTtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLnRhcmdldDtcbiAgICAgICAgfSxcbiAgICAgICAgcHJldmVudERlZmF1bHRUZW1wbGF0ZU1lbnU6IHRydWUsXG4gICAgfSxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC4uLkphdmFzY3JpcHRIYW5kbGVyLmltcG9ydGVyLFxuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGFzc2V0LnNvdXJjZTtcbiAgICAgICAgICAgIGlmIChmaWxlTmFtZS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gbGV0IGRvVHlwZUNoZWNrID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBsZXQgZmF0YWxPbkVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBjb25zdCBjaGVja0xldmVsID0gYXdhaXQgZ2V0VHlwZUNoZWNrTGV2ZWwoKTtcbiAgICAgICAgICAgIC8vIHN3aXRjaCAoY2hlY2tMZXZlbCkge1xuICAgICAgICAgICAgLy8gICAgIGNhc2UgJ2NoZWNrT25seSc6XG4gICAgICAgICAgICAvLyAgICAgICAgIGRvVHlwZUNoZWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgZmF0YWxPbkVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gICAgIGNhc2UgJ2ZhdGFsT25FcnJvcic6XG4gICAgICAgICAgICAvLyAgICAgICAgIGRvVHlwZUNoZWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgZmF0YWxPbkVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyAgICAgY2FzZSAnZGlzYWJsZSc6XG4gICAgICAgICAgICAvLyAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vICAgICAgICAgZG9UeXBlQ2hlY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIHJldHVybiBKYXZhc2NyaXB0SGFuZGxlci5pbXBvcnRlci5pbXBvcnQoYXNzZXQpO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBkZXN0cm95OiBKYXZhc2NyaXB0SGFuZGxlci5kZXN0cm95LFxuICAgIC8qKlxuICAgICAqIOexu+Wei+ajgOafpeaMh+WumuiEmuacrOi1hOa6kOOAglxuICAgICAqIEBwYXJhbSBhc3NldCDopoHmo4Dmn6XnmoTohJrmnKzotYTmupDjgIJcbiAgICAgKiBAcmV0dXJucyDljIXlkKvplJnor6/ov5Tlm54gYHRydWVg77yM5ZCm5YiZ6L+U5ZueIGBmYWxzZWDjgIJcbiAgICAgKi9cbiAgICAvLyBwcml2YXRlIGFzeW5jIF90eXBlQ2hlY2soYXNzZXQ6IEFzc2V0KSB7XG4gICAgLy8gICAgIGNvbnN0IGZpbGVOYW1lID0gYXNzZXQuc291cmNlO1xuICAgIC8vICAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBnZXRDb21waWxlck9wdGlvbnMoKTtcbiAgICAvLyAgICAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0oe1xuICAgIC8vICAgICAgICAgcm9vdE5hbWVzOiBbZmlsZU5hbWVdLFxuICAgIC8vICAgICAgICAgb3B0aW9uczogY29tcGlsZXJPcHRpb25zLFxuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgY29uc3Qgc291cmNlRmlsZSA9IHByb2dyYW0uZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgLy8gICAgIGlmICghc291cmNlRmlsZSkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5kZWJ1ZyhgcHJvZ3JhbSBjcmVhdGVkIGluIF90eXBlQ2hlY2soKSBkb2Vzbid0IGNvbnRhaW4gbWFpbiBlbnRyeSBmaWxlP2ApO1xuICAgIC8vICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGNvbnN0IGRpYWdub3N0aWNzID0gdHMuZ2V0UHJlRW1pdERpYWdub3N0aWNzKHByb2dyYW0sIHNvdXJjZUZpbGUpO1xuICAgIC8vICAgICAvLyBjb25zdCBkaWFnbm9zdGljcyA9IHByb2dyYW0uZ2V0U3ludGFjdGljRGlhZ25vc3RpY3Moc291cmNlRmlsZSk7XG4gICAgLy8gICAgIGlmICghZGlhZ25vc3RpY3MgfHwgZGlhZ25vc3RpY3MubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgY29uc3QgZm9ybWF0RGlhZ25vc3RpY3NIb3N0OiB0cy5Gb3JtYXREaWFnbm9zdGljc0hvc3QgPSB7XG4gICAgLy8gICAgICAgICBnZXRDdXJyZW50RGlyZWN0b3J5KCkge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiBkaXJuYW1lKGFzc2V0LnNvdXJjZSk7XG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgZ2V0Q2Fub25pY2FsRmlsZU5hbWUoZmlsZU5hbWU6IHN0cmluZykge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiBub3JtYWxpemUoZmlsZU5hbWUpO1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIGdldE5ld0xpbmUoKSB7XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuICdcXG4nO1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgfTtcbiAgICAvLyAgICAgbGV0IG5FcnJvciA9IDA7XG4gICAgLy8gICAgIGZvciAoY29uc3QgZGlhZ25vc3RpYyBvZiBkaWFnbm9zdGljcykge1xuICAgIC8vICAgICAgICAgY29uc3QgdGV4dCA9IHRzLmZvcm1hdERpYWdub3N0aWMoZGlhZ25vc3RpYywgZm9ybWF0RGlhZ25vc3RpY3NIb3N0KTtcbiAgICAvLyAgICAgICAgIGxldCBwcmludGVyOiB1bmRlZmluZWQgfCAoKHRleHQ6IHN0cmluZykgPT4gdm9pZCk7XG4gICAgLy8gICAgICAgICBzd2l0Y2ggKGRpYWdub3N0aWMuY2F0ZWdvcnkpIHtcbiAgICAvLyAgICAgICAgICAgICBjYXNlIHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcjpcbiAgICAvLyAgICAgICAgICAgICAgICAgKytuRXJyb3I7XG4gICAgLy8gICAgICAgICAgICAgICAgIHByaW50ZXIgPSBjb25zb2xlLmVycm9yO1xuICAgIC8vICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICBjYXNlIHRzLkRpYWdub3N0aWNDYXRlZ29yeS5XYXJuaW5nOlxuICAgIC8vICAgICAgICAgICAgICAgICBwcmludGVyID0gY29uc29sZS53YXJuO1xuICAgIC8vICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICBjYXNlIHRzLkRpYWdub3N0aWNDYXRlZ29yeS5NZXNzYWdlOlxuICAgIC8vICAgICAgICAgICAgIGNhc2UgdHMuRGlhZ25vc3RpY0NhdGVnb3J5LlN1Z2dlc3Rpb246XG4gICAgLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAvLyAgICAgICAgICAgICAgICAgcHJpbnRlciA9IGNvbnNvbGUubG9nO1xuICAgIC8vICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIHByaW50ZXIodGV4dCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgcmV0dXJuIG5FcnJvciAhPT0gMDtcbiAgICAvLyB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBUeXBlU2NyaXB0SGFuZGxlcjtcblxuLy8gYXN5bmMgZnVuY3Rpb24gZ2V0VHlwZUNoZWNrTGV2ZWwoKSB7XG4vLyAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLmdldCgncHJvamVjdC5nZW5lcmFsLnR5cGVfY2hlY2tfbGV2ZWwnKTtcbi8vICAgICByZXR1cm4gZGF0YTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gQ29jb3NTY3JpcHRGcmFtZVRyYW5zZm9ybWVyPFQgZXh0ZW5kcyB0cy5Ob2RlPihjb21wcmVzc2VkVVVJRDogc3RyaW5nLCBiYXNlbmFtZTogc3RyaW5nKTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PFQ+IHtcbi8vICAgICByZXR1cm4gKGNvbnRleHQpID0+IHtcbi8vICAgICAgICAgY29uc3QgdmlzaXQ6IHRzLlZpc2l0b3IgPSAobm9kZSkgPT4ge1xuLy8gICAgICAgICAgICAgaWYgKHRzLmlzU291cmNlRmlsZShub2RlKSkge1xuLy8gICAgICAgICAgICAgICAgIC8vIGBjYy5fUkYucHVzaCh3aW5kb3cubW9kdWxlIHx8IHt9LCBjb21wcmVzc2VkX3V1aWQsIGJhc2VuYW1lKTsgLy8gYmVnaW4gYmFzZW5hbWVgO1xuLy8gICAgICAgICAgICAgICAgIGNvbnN0IGNjUkZQdXNoID0gdHMuY3JlYXRlRXhwcmVzc2lvblN0YXRlbWVudChcbi8vICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlQ2FsbChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHRzLmNyZWF0ZUlkZW50aWZpZXIoJ2NjJyksIHRzLmNyZWF0ZUlkZW50aWZpZXIoJ19SRicpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVJZGVudGlmaWVyKCdwdXNoJylcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIC8vIHR5cGVBcmd1bWVudHNcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIFtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVCaW5hcnkoXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHRzLmNyZWF0ZUlkZW50aWZpZXIoJ3dpbmRvdycpLCB0cy5jcmVhdGVJZGVudGlmaWVyKCdtb2R1bGUnKSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLlN5bnRheEtpbmQuQmFyQmFyVG9rZW4sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZU9iamVjdExpdGVyYWwoKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChjb21wcmVzc2VkVVVJRCksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChiYXNlbmFtZSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBdXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIC8vIGBjYy5fUkYucG9wKCk7IC8vIGVuZCBiYXNlbmFtZWBcbi8vICAgICAgICAgICAgICAgICBjb25zdCBjY1JGUG9wID0gdHMuY3JlYXRlRXhwcmVzc2lvblN0YXRlbWVudChcbi8vICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlQ2FsbChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHRzLmNyZWF0ZUlkZW50aWZpZXIoJ2NjJyksIHRzLmNyZWF0ZUlkZW50aWZpZXIoJ19SRicpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVJZGVudGlmaWVyKCdwb3AnKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgLy8gdHlwZUFyZ3VtZW50c1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgW11cbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdGVtZW50cyA9IG5ldyBBcnJheTx0cy5TdGF0ZW1lbnQ+KCk7XG4vLyAgICAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKGNjUkZQdXNoKTtcbi8vICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goLi4uKG5vZGUuc3RhdGVtZW50cykpO1xuLy8gICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaChjY1JGUG9wKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdHMudXBkYXRlU291cmNlRmlsZU5vZGUoXG4vLyAgICAgICAgICAgICAgICAgICAgIG5vZGUsXG4vLyAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHMsXG4vLyAgICAgICAgICAgICAgICAgICAgIG5vZGUuaXNEZWNsYXJhdGlvbkZpbGUsXG4vLyAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVmZXJlbmNlZEZpbGVzLFxuLy8gICAgICAgICAgICAgICAgICAgICBub2RlLnR5cGVSZWZlcmVuY2VEaXJlY3RpdmVzLFxuLy8gICAgICAgICAgICAgICAgICAgICBub2RlLmhhc05vRGVmYXVsdExpYixcbi8vICAgICAgICAgICAgICAgICAgICAgbm9kZS5saWJSZWZlcmVuY2VEaXJlY3RpdmVzKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCAoY2hpbGQpID0+IHZpc2l0KGNoaWxkKSwgY29udGV4dCk7XG4vLyAgICAgICAgIH07XG4vLyAgICAgICAgIHJldHVybiAobm9kZSkgPT4gdHMudmlzaXROb2RlKG5vZGUsIHZpc2l0KTtcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBDb2Nvc0xpYlRyYW5zZm9ybWVyPFQgZXh0ZW5kcyB0cy5Ob2RlPigpOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8VD4ge1xuLy8gICAgIHJldHVybiAoY29udGV4dCkgPT4ge1xuLy8gICAgICAgICBjb25zdCB2aXNpdDogdHMuVmlzaXRvciA9IChub2RlKSA9PiB7XG4vLyAgICAgICAgICAgICBpZiAoIXRzLmlzSW1wb3J0RGVjbGFyYXRpb24obm9kZSkgfHxcbi8vICAgICAgICAgICAgICAgICAhbm9kZS5pbXBvcnRDbGF1c2UgfHwgLy8gYGltcG9ydCBcInh4XCI7YCBpcyBpZ25vcmVkLlxuLy8gICAgICAgICAgICAgICAgICF0cy5pc1N0cmluZ0xpdGVyYWwobm9kZS5tb2R1bGVTcGVjaWZpZXIpIHx8XG4vLyAgICAgICAgICAgICAgICAgbm9kZS5tb2R1bGVTcGVjaWZpZXIudGV4dCAhPT0gJ0NvY29zM0QnKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRzLnZpc2l0RWFjaENoaWxkKG5vZGUsIChjaGlsZCkgPT4gdmlzaXQoY2hpbGQpLCBjb250ZXh0KTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZUNDID0gKCkgPT4ge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVJZGVudGlmaWVyKCdjYycpO1xuLy8gICAgICAgICAgICAgfTtcbi8vICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlRGVjbGFyYXRpb25zID0gbmV3IEFycmF5PHRzLlZhcmlhYmxlRGVjbGFyYXRpb24+KCk7XG4vLyAgICAgICAgICAgICBjb25zdCBtYWtlRGVmYXVsdEltcG9ydCA9IChpZDogdHMuSWRlbnRpZmllcikgPT4ge1xuLy8gICAgICAgICAgICAgICAgIHZhcmlhYmxlRGVjbGFyYXRpb25zLnB1c2godHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbihcbi8vICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlSWRlbnRpZmllcihpZC50ZXh0KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICBjcmVhdGVDQygpXG4vLyAgICAgICAgICAgICAgICAgKSk7XG4vLyAgICAgICAgICAgICB9O1xuLy8gICAgICAgICAgICAgY29uc3QgeyBpbXBvcnRDbGF1c2U6IHsgbmFtZSwgbmFtZWRCaW5kaW5ncyB9IH0gPSBub2RlO1xuLy8gICAgICAgICAgICAgaWYgKG5hbWUpIHtcbi8vICAgICAgICAgICAgICAgICAvLyBpbXBvcnQgeHggZnJvbSAnQ29jb3MzRCc7XG4vLyAgICAgICAgICAgICAgICAgLy8gY29uc3QgeHggPSBjYztcbi8vICAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdEltcG9ydChuYW1lKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGlmIChuYW1lZEJpbmRpbmdzKSB7XG4vLyAgICAgICAgICAgICAgICAgaWYgKHRzLmlzTmFtZXNwYWNlSW1wb3J0KG5hbWVkQmluZGluZ3MpKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIGltcG9ydCAqIGFzIHh4IGZyb20gJ0NvY29zM0QnO1xuLy8gICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCB4eCA9IGNjO1xuLy8gICAgICAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdEltcG9ydChuYW1lZEJpbmRpbmdzLm5hbWUpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJpbmRpbmdFbGVtZW50cyA9IG5ldyBBcnJheTx0cy5CaW5kaW5nRWxlbWVudD4oKTtcbi8vICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB7IG5hbWUsIHByb3BlcnR5TmFtZSB9IG9mIG5hbWVkQmluZGluZ3MuZWxlbWVudHMpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbXBvcnQgeyB4eCBhcyB5eSB9IGZyb20gJ0NvY29zM0QnO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0IHsgeHg6IHl5IH0gPSBjYztcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5kaW5nRWxlbWVudHMucHVzaCh0cy5jcmVhdGVCaW5kaW5nRWxlbWVudChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAvLyAuLi5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlSWRlbnRpZmllcihwcm9wZXJ0eU5hbWUudGV4dCksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZUlkZW50aWZpZXIobmFtZS50ZXh0KVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbXBvcnQgeyB4eCB9IGZyb20gJ0NvY29zM0QnO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0IHsgeHggfSA9IGNjO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRpbmdFbGVtZW50cy5wdXNoKHRzLmNyZWF0ZUJpbmRpbmdFbGVtZW50KFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIC8vIC4uLlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZUlkZW50aWZpZXIobmFtZS50ZXh0KVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlRGVjbGFyYXRpb25zLnB1c2godHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbihcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZU9iamVjdEJpbmRpbmdQYXR0ZXJuKGJpbmRpbmdFbGVtZW50cyksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIC8vIHR5cGVcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUNDKClcbi8vICAgICAgICAgICAgICAgICAgICAgKSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgaWYgKHZhcmlhYmxlRGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICByZXR1cm4gdHMuY3JlYXRlVmFyaWFibGVTdGF0ZW1lbnQoXG4vLyAgICAgICAgICAgICAgICAgW3RzLmNyZWF0ZU1vZGlmaWVyKHRzLlN5bnRheEtpbmQuQ29uc3RLZXl3b3JkKV0sXG4vLyAgICAgICAgICAgICAgICAgdmFyaWFibGVEZWNsYXJhdGlvbnNcbi8vICAgICAgICAgICAgICk7XG4vLyAgICAgICAgIH07XG4vLyAgICAgICAgIHJldHVybiAobm9kZSkgPT4gdHMudmlzaXROb2RlKG5vZGUsIHZpc2l0KTtcbi8vICAgICB9O1xuLy8gfVxuIl19