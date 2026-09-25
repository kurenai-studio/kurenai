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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacOSPackTool = void 0;
const fs = __importStar(require("fs-extra"));
const ps = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const default_1 = require("../base/default");
const utils_1 = require("../utils");
class MacOSPackTool extends default_1.NativePackTool {
    async create() {
        await this.copyCommonTemplate();
        await this.copyPlatformTemplate();
        await this.generateCMakeConfig();
        await this.executeCocosTemplateTask();
        return true;
    }
    shouldSkipGenerate() {
        const nativePrjDir = this.paths.nativePrjDir;
        const options = this.params.platformParams;
        if (options.skipUpdateXcodeProject && fs.existsSync(ps.join(nativePrjDir, 'CMakeCache.txt'))) {
            console.log('Skip xcode project update');
            return true;
        }
        const cmakePath = ps.join(this.paths.platformTemplateDirInPrj, 'CMakeLists.txt');
        if (!fs.existsSync(cmakePath)) {
            throw new Error(`CMakeLists.txt not found in ${cmakePath}`);
        }
        return false;
    }
    isAppleSilicon() {
        const cpus = os.cpus();
        const model = (cpus && cpus[0] && cpus[0].model) ? cpus[0].model : '';
        return /Apple/.test(model) && process.platform === 'darwin';
    }
    compareVersion(a, b) {
        var _a, _b;
        const aParts = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
        const bParts = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
        const maxLength = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLength; i++) {
            const aValue = (_a = aParts[i]) !== null && _a !== void 0 ? _a : 0;
            const bValue = (_b = bParts[i]) !== null && _b !== void 0 ? _b : 0;
            if (aValue !== bValue) {
                return aValue - bValue;
            }
        }
        return 0;
    }
    getXcodeVersion() {
        try {
            const output = (0, child_process_1.execSync)('xcrun xcodebuild -version').toString('utf8');
            const match = output.match(/Xcode\s+(\d+(?:\.\d+)+)/);
            return (match === null || match === void 0 ? void 0 : match[1]) || '0.0';
        }
        catch (e) {
            console.error(e);
            return '0.0';
        }
    }
    getXcodeMajorVerion() {
        try {
            return Number.parseInt(this.getXcodeVersion().split('.')[0] || '0', 10);
        }
        catch (e) {
            console.error(e);
            // fallback to default Xcode version
            return 11;
        }
    }
    getIosSimulatorArch() {
        // Xcode 14.3+ no longer supports running iOS Simulator under Rosetta on Apple Silicon.
        if (this.isAppleSilicon() && this.compareVersion(this.getXcodeVersion(), '14.3') >= 0) {
            return 'arm64';
        }
        return 'x86_64';
    }
    async modifyXcodeProject() {
        if (this.params.platformParams.skipUpdateXcodeProject) {
            if (this.getXcodeMajorVerion() < 12) {
                console.error(`SKIP UPDATE XCODE PROJECT is only supported with Xcode 12 or later`);
                return;
            }
            await this.xcodeFixAssetsReferences();
        }
    }
    static async openWithIDE(projPath) {
        await utils_1.toolHelper.runCmake(['--open', `"${utils_1.cchelper.fixPath(projPath)}"`]);
        return true;
    }
    /**
     * When "Skip Xcode Project Update" is checked, changes to the contents of the "data" directory
     * still need to be synchronized with Xcode. One way to achieve this is to modify the Xcode
     * project file directly and use directory references to access the "data" directory.
     * However, this method is not supported in Xcode 11 and earlier project formats due to
     * differences in their formats.
     */
    async xcodeFixAssetsReferences() {
        const nativePrjDir = this.paths.nativePrjDir;
        const xcode = require(ps.join(this.params.enginePath, 'scripts/native-pack-tool/xcode'));
        const projs = fs.readdirSync(nativePrjDir).filter((x) => x.endsWith('.xcodeproj')).map((x) => ps.join(nativePrjDir, x));
        if (projs.length === 0) {
            throw new Error(`can not find xcode project file in ${nativePrjDir}`);
        }
        else {
            try {
                for (const proj of projs) {
                    const pbxfile = ps.join(proj, 'project.pbxproj');
                    console.log(`parsing pbxfile ${pbxfile}`);
                    const projectFile = xcode.project(pbxfile);
                    await (function () {
                        return new Promise((resolve, reject) => {
                            projectFile.parse((err) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(projectFile);
                            });
                        });
                    })();
                    console.log(`  modifiy Xcode project file ${pbxfile}`);
                    {
                        // Resources/ add references to files/folders in assets/ 
                        const assetsDir = this.paths.buildDir;
                        const objects = projectFile.hash.project.objects;
                        const KeyResource = `Resources`;
                        const resources = Object.entries(objects.PBXGroup).filter(([, x]) => x.name === KeyResource);
                        let hash = resources[0][0];
                        if (resources.length > 1) {
                            console.log(`   multiple Resources/ group found!`);
                            const itemWeight = (a) => {
                                const hasImageAsset = a[1].children.filter((c) => c.comment.endsWith('.xcassets')).length > 0;
                                const finalBuildTarget = a[1].children.filter((c) => c.comment.indexOf(`CMakeFiles/${this.params.projectName}`) > -1).length > 0;
                                console.log(`   ${a[0]} hasImageAsset ${hasImageAsset}, is final target ${finalBuildTarget}`);
                                return (finalBuildTarget ? 1 : 0) * 100 + (hasImageAsset ? 1 : 0) * 10 + a[1].children.length;
                            };
                            hash = resources.sort((a, b) => itemWeight(b) - itemWeight(a))[0][0];
                            console.log(`   select ${hash}`);
                        }
                        const filterFolders = (name) => {
                            // NOTE: `assets/remote` should not be linked into Resources/
                            // return name !== '.' && name !== '..' && name !== 'remote';
                            return name === 'data'; // only accept `data` folder
                        };
                        fs.readdirSync(assetsDir, { encoding: 'utf8' }).filter(filterFolders).forEach(f => {
                            const full = ps.normalize(ps.join(assetsDir, f));
                            const options = {};
                            const st = fs.statSync(full);
                            if (st.isDirectory()) {
                                options.lastKnownFileType = 'folder';
                            }
                            // add file ref
                            const newResFile = projectFile.addFile(full, hash, options);
                            {
                                // add file to build file
                                const newBuildFile = {
                                    fileRef: newResFile.fileRef,
                                    uuid: projectFile.generateUuid(),
                                    isa: 'PBXBuildFile',
                                    basename: `${f}`,
                                    group: KeyResource,
                                };
                                projectFile.addToPbxBuildFileSection(newBuildFile);
                                // add file to ResourceBuildPhase of `Resources`
                                const [phaseId] = Object.entries(objects.PBXResourcesBuildPhase).find(([k, x]) => {
                                    return k.endsWith('_comment') && x === KeyResource;
                                });
                                const id = phaseId.split('_comment')[0];
                                objects["PBXResourcesBuildPhase"][id].files.push({
                                    value: newBuildFile.uuid,
                                    comment: full,
                                });
                            }
                        });
                    }
                    fs.writeFileSync(pbxfile, projectFile.writeSync());
                    console.log(`  replace pbxfile: ${pbxfile}.`);
                }
            }
            catch (e) {
                console.error(`disable ZERO_CHECK, failed to update xcode.`);
                console.error(e);
            }
        }
    }
    async checkIfXcodeInstalled() {
        let xcodeFound = false;
        const xcodeInstalled = await utils_1.toolHelper.runCommand('xcode-select', ['-p'], (code, stdout, stderr) => {
            if (code === 0) {
                console.log(`[xcode-select] ${stdout}`);
                if (stdout.indexOf('Xcode') > 0) {
                    xcodeFound = true;
                }
            }
            else {
                console.log(`[xcode-select] ${stdout}`);
                console.error(`[xcode-select] ${stderr}`);
            }
        });
        if (!xcodeInstalled) {
            utils_1.toolHelper.runCommand('xcode-select', ['--install']);
            return false;
        }
        return xcodeFound;
    }
}
exports.MacOSPackTool = MacOSPackTool;
//# sourceMappingURL=mac-os.js.map