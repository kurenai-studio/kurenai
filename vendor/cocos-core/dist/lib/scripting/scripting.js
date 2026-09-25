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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.initProgrammingFacet = initProgrammingFacet;
exports.getProgrammingFacet = getProgrammingFacet;
exports.startCompileScript = startCompileScript;
exports.onCompileStart = onCompileStart;
exports.onCompiled = onCompiled;
exports.onPackBuildStart = onPackBuildStart;
exports.onPackBuildEnd = onPackBuildEnd;
const global_1 = require("../../global");
const scripting_1 = __importDefault(require("../../core/scripting"));
async function init(projectPath) {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    return await scripting_1.default.initialize(projectPath, global_1.GlobalPaths.enginePath, Engine.getConfig().includeModules);
}
async function initProgrammingFacet() {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    const features = Engine.getConfig().includeModules || [];
    const enginePath = global_1.GlobalPaths.enginePath;
    const { createProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../../core/scripting/programming/FacetInstance')));
    return await createProgrammingFacet(enginePath, scripting_1.default.projectPath, features);
}
async function getProgrammingFacet() {
    const { getPreviewFacet } = await Promise.resolve().then(() => __importStar(require('../../core/scripting/programming/FacetInstance')));
    return getPreviewFacet();
}
/**
 * 在独立的子进程中运行项目脚本编译
 * 以避免阻塞主进程
 */
async function startCompileScript(assetChanges) {
    const { Engine } = await Promise.resolve().then(() => __importStar(require('../../core/engine')));
    const features = Engine.getConfig().includeModules;
    const { startCompileScriptProcess } = await Promise.resolve().then(() => __importStar(require('../../core/scripting/compile-process')));
    const facet = await getProgrammingFacet();
    await startCompileScriptProcess({
        projectPath: scripting_1.default.projectPath,
        enginePath: global_1.GlobalPaths.enginePath,
        features,
        assetChanges
    }, () => {
        if (facet) {
            facet.notifyPackDriverUpdated();
        }
    });
}
function onCompileStart(listener) {
    const wrapped = (scope, taskId) => listener({ scope, taskId });
    scripting_1.default.on('compile-start', wrapped);
    return () => { scripting_1.default.off('compile-start', wrapped); };
}
function onCompiled(listener) {
    const wrapped = (scope) => listener({ scope });
    scripting_1.default.on('compiled', wrapped);
    return () => { scripting_1.default.off('compiled', wrapped); };
}
function onPackBuildStart(listener) {
    const wrapped = (targetName) => listener({ targetName });
    scripting_1.default.on('pack-build-start', wrapped);
    return () => { scripting_1.default.off('pack-build-start', wrapped); };
}
function onPackBuildEnd(listener) {
    const wrapped = (targetName) => listener({ targetName });
    scripting_1.default.on('pack-build-end', wrapped);
    return () => { scripting_1.default.off('pack-build-end', wrapped); };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0aW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9zY3JpcHRpbmcvc2NyaXB0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBT0Esb0JBTUM7QUFFRCxvREFPQztBQUVELGtEQUdDO0FBTUQsZ0RBZ0JDO0FBRUQsd0NBSUM7QUFFRCxnQ0FJQztBQUVELDRDQUlDO0FBRUQsd0NBSUM7QUF6RUQseUNBQTJDO0FBQzNDLHFFQUE2QztBQU10QyxLQUFLLFVBQVUsSUFBSSxDQUFDLFdBQW1CO0lBQzFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyx3REFBYSxtQkFBbUIsR0FBQyxDQUFDO0lBQ3JELE9BQU8sTUFBTSxtQkFBUyxDQUFDLFVBQVUsQ0FDN0IsV0FBVyxFQUNYLG9CQUFXLENBQUMsVUFBVSxFQUN0QixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVNLEtBQUssVUFBVSxvQkFBb0I7SUFDdEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLHdEQUFhLG1CQUFtQixHQUFDLENBQUM7SUFDckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7SUFDekQsTUFBTSxVQUFVLEdBQUcsb0JBQVcsQ0FBQyxVQUFVLENBQUM7SUFFMUMsTUFBTSxFQUFFLHNCQUFzQixFQUFFLEdBQUcsd0RBQWEsZ0RBQWdELEdBQUMsQ0FBQztJQUNsRyxPQUFPLE1BQU0sc0JBQXNCLENBQUMsVUFBVSxFQUFFLG1CQUFTLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7QUFFTSxLQUFLLFVBQVUsbUJBQW1CO0lBQ3JDLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyx3REFBYSxnREFBZ0QsR0FBQyxDQUFDO0lBQzNGLE9BQU8sZUFBZSxFQUFFLENBQUM7QUFDN0IsQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxZQUFnQztJQUNyRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsd0RBQWEsbUJBQW1CLEdBQUMsQ0FBQztJQUNyRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDO0lBRW5ELE1BQU0sRUFBRSx5QkFBeUIsRUFBRSxHQUFHLHdEQUFhLHNDQUFzQyxHQUFDLENBQUM7SUFDM0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxtQkFBbUIsRUFBRSxDQUFDO0lBQzFDLE1BQU0seUJBQXlCLENBQUM7UUFDNUIsV0FBVyxFQUFFLG1CQUFTLENBQUMsV0FBVztRQUNsQyxVQUFVLEVBQUUsb0JBQVcsQ0FBQyxVQUFVO1FBQ2xDLFFBQVE7UUFDUixZQUFZO0tBQ2YsRUFBRSxHQUFHLEVBQUU7UUFDSixJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1IsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDcEMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxRQUF5RDtJQUNwRixNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQWEsRUFBRSxNQUFlLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ2hGLG1CQUFTLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN2QyxPQUFPLEdBQUcsRUFBRSxHQUFHLG1CQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLFFBQXdDO0lBQy9ELE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELG1CQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNsQyxPQUFPLEdBQUcsRUFBRSxHQUFHLG1CQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsUUFBNkM7SUFDMUUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxVQUFrQixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ2pFLG1CQUFTLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsbUJBQVMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxRQUE2QztJQUN4RSxNQUFNLE9BQU8sR0FBRyxDQUFDLFVBQWtCLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDakUsbUJBQVMsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDeEMsT0FBTyxHQUFHLEVBQUUsR0FBRyxtQkFBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi8uLi9nbG9iYWwnO1xuaW1wb3J0IHNjcmlwdGluZyBmcm9tICcuLi8uLi9jb3JlL3NjcmlwdGluZyc7XG5pbXBvcnQgdHlwZSB7IEFzc2V0Q2hhbmdlSW5mbyB9IGZyb20gJy4uLy4uL2NvcmUvc2NyaXB0aW5nJztcbmltcG9ydCB0eXBlIHsgUHJvZ3JhbW1pbmdGYWNldCB9IGZyb20gJy4uLy4uL2NvcmUvc2NyaXB0aW5nL3Byb2dyYW1taW5nL0ZhY2V0JztcblxuZXhwb3J0IHR5cGUgKiBmcm9tICcuLi8uLi9jb3JlL3NjcmlwdGluZy9pbnRlcmZhY2UnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdChwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9lbmdpbmUnKTtcbiAgICByZXR1cm4gYXdhaXQgc2NyaXB0aW5nLmluaXRpYWxpemUoXG4gICAgICAgIHByb2plY3RQYXRoLFxuICAgICAgICBHbG9iYWxQYXRocy5lbmdpbmVQYXRoLFxuICAgICAgICBFbmdpbmUuZ2V0Q29uZmlnKCkuaW5jbHVkZU1vZHVsZXMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdFByb2dyYW1taW5nRmFjZXQoKTogUHJvbWlzZTxQcm9ncmFtbWluZ0ZhY2V0PiB7XG4gICAgY29uc3QgeyBFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9lbmdpbmUnKTtcbiAgICBjb25zdCBmZWF0dXJlcyA9IEVuZ2luZS5nZXRDb25maWcoKS5pbmNsdWRlTW9kdWxlcyB8fCBbXTtcbiAgICBjb25zdCBlbmdpbmVQYXRoID0gR2xvYmFsUGF0aHMuZW5naW5lUGF0aDtcblxuICAgIGNvbnN0IHsgY3JlYXRlUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjcmlwdGluZy9wcm9ncmFtbWluZy9GYWNldEluc3RhbmNlJyk7XG4gICAgcmV0dXJuIGF3YWl0IGNyZWF0ZVByb2dyYW1taW5nRmFjZXQoZW5naW5lUGF0aCwgc2NyaXB0aW5nLnByb2plY3RQYXRoLCBmZWF0dXJlcyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcm9ncmFtbWluZ0ZhY2V0KCk6IFByb21pc2U8UHJvZ3JhbW1pbmdGYWNldD4ge1xuICAgIGNvbnN0IHsgZ2V0UHJldmlld0ZhY2V0IH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NyaXB0aW5nL3Byb2dyYW1taW5nL0ZhY2V0SW5zdGFuY2UnKTtcbiAgICByZXR1cm4gZ2V0UHJldmlld0ZhY2V0KCk7XG59XG5cbi8qKlxuICog5Zyo54us56uL55qE5a2Q6L+b56iL5Lit6L+Q6KGM6aG555uu6ISa5pys57yW6K+RXG4gKiDku6Xpgb/lhY3pmLvloZ7kuLvov5vnqItcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0Q29tcGlsZVNjcmlwdChhc3NldENoYW5nZXM/OiBBc3NldENoYW5nZUluZm9bXSkge1xuICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvZW5naW5lJyk7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBFbmdpbmUuZ2V0Q29uZmlnKCkuaW5jbHVkZU1vZHVsZXM7XG5cbiAgICBjb25zdCB7IHN0YXJ0Q29tcGlsZVNjcmlwdFByb2Nlc3MgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9zY3JpcHRpbmcvY29tcGlsZS1wcm9jZXNzJyk7XG4gICAgY29uc3QgZmFjZXQgPSBhd2FpdCBnZXRQcm9ncmFtbWluZ0ZhY2V0KCk7XG4gICAgYXdhaXQgc3RhcnRDb21waWxlU2NyaXB0UHJvY2Vzcyh7XG4gICAgICAgIHByb2plY3RQYXRoOiBzY3JpcHRpbmcucHJvamVjdFBhdGgsXG4gICAgICAgIGVuZ2luZVBhdGg6IEdsb2JhbFBhdGhzLmVuZ2luZVBhdGgsXG4gICAgICAgIGZlYXR1cmVzLFxuICAgICAgICBhc3NldENoYW5nZXNcbiAgICB9LCAoKSA9PiB7XG4gICAgICAgIGlmIChmYWNldCkge1xuICAgICAgICAgICAgZmFjZXQubm90aWZ5UGFja0RyaXZlclVwZGF0ZWQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb25Db21waWxlU3RhcnQobGlzdGVuZXI6IChlOiB7IHNjb3BlOiBzdHJpbmc7IHRhc2tJZD86IHN0cmluZyB9KSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgY29uc3Qgd3JhcHBlZCA9IChzY29wZTogc3RyaW5nLCB0YXNrSWQ/OiBzdHJpbmcpID0+IGxpc3RlbmVyKHsgc2NvcGUsIHRhc2tJZCB9KTtcbiAgICBzY3JpcHRpbmcub24oJ2NvbXBpbGUtc3RhcnQnLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gKCkgPT4geyBzY3JpcHRpbmcub2ZmKCdjb21waWxlLXN0YXJ0Jywgd3JhcHBlZCk7IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkNvbXBpbGVkKGxpc3RlbmVyOiAoZTogeyBzY29wZTogc3RyaW5nIH0pID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICBjb25zdCB3cmFwcGVkID0gKHNjb3BlOiBzdHJpbmcpID0+IGxpc3RlbmVyKHsgc2NvcGUgfSk7XG4gICAgc2NyaXB0aW5nLm9uKCdjb21waWxlZCcsIHdyYXBwZWQpO1xuICAgIHJldHVybiAoKSA9PiB7IHNjcmlwdGluZy5vZmYoJ2NvbXBpbGVkJywgd3JhcHBlZCk7IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvblBhY2tCdWlsZFN0YXJ0KGxpc3RlbmVyOiAoZTogeyB0YXJnZXROYW1lOiBzdHJpbmcgfSkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgIGNvbnN0IHdyYXBwZWQgPSAodGFyZ2V0TmFtZTogc3RyaW5nKSA9PiBsaXN0ZW5lcih7IHRhcmdldE5hbWUgfSk7XG4gICAgc2NyaXB0aW5nLm9uKCdwYWNrLWJ1aWxkLXN0YXJ0Jywgd3JhcHBlZCk7XG4gICAgcmV0dXJuICgpID0+IHsgc2NyaXB0aW5nLm9mZigncGFjay1idWlsZC1zdGFydCcsIHdyYXBwZWQpOyB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb25QYWNrQnVpbGRFbmQobGlzdGVuZXI6IChlOiB7IHRhcmdldE5hbWU6IHN0cmluZyB9KSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgY29uc3Qgd3JhcHBlZCA9ICh0YXJnZXROYW1lOiBzdHJpbmcpID0+IGxpc3RlbmVyKHsgdGFyZ2V0TmFtZSB9KTtcbiAgICBzY3JpcHRpbmcub24oJ3BhY2stYnVpbGQtZW5kJywgd3JhcHBlZCk7XG4gICAgcmV0dXJuICgpID0+IHsgc2NyaXB0aW5nLm9mZigncGFjay1idWlsZC1lbmQnLCB3cmFwcGVkKTsgfTtcbn1cblxuIl19