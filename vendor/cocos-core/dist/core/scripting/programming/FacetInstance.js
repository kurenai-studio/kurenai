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
exports.createProgrammingFacet = createProgrammingFacet;
exports.waitForProgrammingFacet = waitForProgrammingFacet;
exports.getPreviewFacet = getPreviewFacet;
const path_1 = require("path");
const Facet_1 = require("./Facet");
let programmingFacet = null;
let createProgrammingFacetPromise = null;
async function createProgrammingFacet(enginePath, projectPath, features) {
    if (!programmingFacet) {
        programmingFacet = await Facet_1.ProgrammingFacet.create({
            root: enginePath,
            distRoot: (0, path_1.join)(enginePath, 'bin', '.cache', 'dev-cli', 'web'),
            baseUrl: '/scripting/engine',
            features,
        }, projectPath);
    }
    return programmingFacet;
}
async function waitForProgrammingFacet() {
    if (!createProgrammingFacetPromise) {
        const { Engine } = await Promise.resolve().then(() => __importStar(require('../../engine')));
        const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../')));
        const enginePath = Engine.getInfo().typescript.path;
        const features = Engine.getConfig().includeModules || [];
        createProgrammingFacetPromise = createProgrammingFacet(enginePath, scripting.projectPath, features);
        createProgrammingFacetPromise.catch(() => {
            createProgrammingFacetPromise = null;
        });
    }
    await createProgrammingFacetPromise;
    return programmingFacet;
}
function getPreviewFacet() {
    if (!programmingFacet) {
        throw new Error('ProgrammingFacet not init, please init firstly.');
    }
    return programmingFacet;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFjZXRJbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjcmlwdGluZy9wcm9ncmFtbWluZy9GYWNldEluc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTUEsd0RBYUM7QUFFRCwwREFjQztBQUVELDBDQUtDO0FBMUNELCtCQUE0QjtBQUM1QixtQ0FBMkM7QUFFM0MsSUFBSSxnQkFBZ0IsR0FBNEIsSUFBSSxDQUFDO0FBQ3JELElBQUksNkJBQTZCLEdBQXFDLElBQUksQ0FBQztBQUVwRSxLQUFLLFVBQVUsc0JBQXNCLENBQUMsVUFBa0IsRUFBRSxXQUFtQixFQUFFLFFBQWtCO0lBQ3BHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3BCLGdCQUFnQixHQUFHLE1BQU0sd0JBQWdCLENBQUMsTUFBTSxDQUM1QztZQUNJLElBQUksRUFBRSxVQUFVO1lBQ2hCLFFBQVEsRUFBRSxJQUFBLFdBQUksRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDO1lBQzdELE9BQU8sRUFBRSxtQkFBbUI7WUFDNUIsUUFBUTtTQUNYLEVBQ0QsV0FBVyxDQUNkLENBQUM7SUFDTixDQUFDO0lBQ0QsT0FBTyxnQkFBZ0IsQ0FBQztBQUM1QixDQUFDO0FBRU0sS0FBSyxVQUFVLHVCQUF1QjtJQUN6QyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNqQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsd0RBQWEsY0FBYyxHQUFDLENBQUM7UUFDaEQsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyx3REFBYSxLQUFLLEdBQUMsQ0FBQztRQUNuRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztRQUNwRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztRQUN6RCw2QkFBNkIsR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRyw2QkFBNkIsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ3JDLDZCQUE2QixHQUFHLElBQUksQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxNQUFNLDZCQUE2QixDQUFDO0lBRXBDLE9BQU8sZ0JBQWlCLENBQUM7QUFDN0IsQ0FBQztBQUVELFNBQWdCLGVBQWU7SUFDM0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFDRCxPQUFPLGdCQUFnQixDQUFDO0FBQzVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBQcm9ncmFtbWluZ0ZhY2V0IH0gZnJvbSAnLi9GYWNldCc7XG5cbmxldCBwcm9ncmFtbWluZ0ZhY2V0OiBQcm9ncmFtbWluZ0ZhY2V0IHwgbnVsbCA9IG51bGw7XG5sZXQgY3JlYXRlUHJvZ3JhbW1pbmdGYWNldFByb21pc2U6IFByb21pc2U8UHJvZ3JhbW1pbmdGYWNldD4gfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVByb2dyYW1taW5nRmFjZXQoZW5naW5lUGF0aDogc3RyaW5nLCBwcm9qZWN0UGF0aDogc3RyaW5nLCBmZWF0dXJlczogc3RyaW5nW10pIHtcbiAgICBpZiAoIXByb2dyYW1taW5nRmFjZXQpIHtcbiAgICAgICAgcHJvZ3JhbW1pbmdGYWNldCA9IGF3YWl0IFByb2dyYW1taW5nRmFjZXQuY3JlYXRlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJvb3Q6IGVuZ2luZVBhdGgsXG4gICAgICAgICAgICAgICAgZGlzdFJvb3Q6IGpvaW4oZW5naW5lUGF0aCwgJ2JpbicsICcuY2FjaGUnLCAnZGV2LWNsaScsICd3ZWInKSxcbiAgICAgICAgICAgICAgICBiYXNlVXJsOiAnL3NjcmlwdGluZy9lbmdpbmUnLFxuICAgICAgICAgICAgICAgIGZlYXR1cmVzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2plY3RQYXRoXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtbWluZ0ZhY2V0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2FpdEZvclByb2dyYW1taW5nRmFjZXQoKTogUHJvbWlzZTxQcm9ncmFtbWluZ0ZhY2V0PiB7XG4gICAgaWYgKCFjcmVhdGVQcm9ncmFtbWluZ0ZhY2V0UHJvbWlzZSkge1xuICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9lbmdpbmUnKTtcbiAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi4vJyk7XG4gICAgICAgIGNvbnN0IGVuZ2luZVBhdGggPSBFbmdpbmUuZ2V0SW5mbygpLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBFbmdpbmUuZ2V0Q29uZmlnKCkuaW5jbHVkZU1vZHVsZXMgfHwgW107XG4gICAgICAgIGNyZWF0ZVByb2dyYW1taW5nRmFjZXRQcm9taXNlID0gY3JlYXRlUHJvZ3JhbW1pbmdGYWNldChlbmdpbmVQYXRoLCBzY3JpcHRpbmcucHJvamVjdFBhdGgsIGZlYXR1cmVzKTtcbiAgICAgICAgY3JlYXRlUHJvZ3JhbW1pbmdGYWNldFByb21pc2UuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgY3JlYXRlUHJvZ3JhbW1pbmdGYWNldFByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgY3JlYXRlUHJvZ3JhbW1pbmdGYWNldFByb21pc2U7XG5cbiAgICByZXR1cm4gcHJvZ3JhbW1pbmdGYWNldCE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3RmFjZXQoKSB7XG4gICAgaWYgKCFwcm9ncmFtbWluZ0ZhY2V0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUHJvZ3JhbW1pbmdGYWNldCBub3QgaW5pdCwgcGxlYXNlIGluaXQgZmlyc3RseS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW1taW5nRmFjZXQ7XG59XG4iXX0=