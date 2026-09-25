"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineLoader = void 0;
const path_1 = require("path");
const module_1 = __importDefault(require("module"));
const ModuleInternal = module_1.default;
class EngineLoader {
    static isEngineModule(request) {
        return request === 'cc' || (request.startsWith('cc/') && !request.startsWith('cc/preload')) || request.startsWith('cce:/internal/');
    }
    static engineModules = {};
    static getEngineModuleById(id) {
        return EngineLoader.engineModules[id];
    }
    static loader;
    static createEngineLoader(engineDevPath) {
        const loaderModule = require((0, path_1.resolve)((0, path_1.join)(engineDevPath, 'editor'), 'loader'));
        return loaderModule.default;
    }
    static async init(engineDevPath, modules) {
        this.loader = this.createEngineLoader(engineDevPath);
        await this.requiredModules(modules);
        const vendorResolveFilename = ModuleInternal._resolveFilename;
        ModuleInternal._resolveFilename = function (request) {
            if (EngineLoader.isEngineModule(request)) {
                return request;
            }
            else {
                // @ts-ignore
                return vendorResolveFilename.apply(this, arguments);
            }
        };
        const vendorLoad = ModuleInternal._load;
        ModuleInternal._load = function (request) {
            if (EngineLoader.isEngineModule(request)) {
                const module = EngineLoader.getEngineModuleById(request);
                if (module) {
                    return module;
                }
                else {
                    throw new Error(`Can not load engine module: ${request}. Valid engine modules are: ${Object.keys(EngineLoader.engineModules).join(',')}`);
                }
            }
            else {
                // @ts-ignore
                return vendorLoad.apply(this, arguments);
            }
        };
    }
    static async requiredModules(modules) {
        if (!this.loader) {
            throw new Error(`Failed to load engine module ${modules.join(',')}. ` + 'Loader has not been initialized. engineLoader.init.');
        }
        for (const module of modules) {
            try {
                EngineLoader.engineModules[module] = await this.loader.import(module);
            }
            catch (e) {
                console.error(`Failed to load engine module: ${module}  e: ${e}`);
            }
        }
    }
    static async importModule(module) {
        if (!this.loader) {
            throw new Error(`Failed to load engine module ${module}. ` + 'Loader has not been initialized. engineLoader.init.');
        }
        return await this.loader.import(module);
    }
}
exports.EngineLoader = EngineLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsb0RBQTRCO0FBTTVCLE1BQU0sY0FBYyxHQUFHLGdCQUd0QixDQUFDO0FBRUYsTUFBYSxZQUFZO0lBQ3JCLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBZTtRQUNqQyxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN4SSxDQUFDO0lBRU8sTUFBTSxDQUFDLGFBQWEsR0FBd0IsRUFBRSxDQUFDO0lBQ2hELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFVO1FBQ3hDLE9BQU8sWUFBWSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU8sTUFBTSxDQUFDLE1BQU0sQ0FBNEI7SUFFekMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQXFCO1FBQ25ELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFBLFdBQUksRUFBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBRTVFLENBQUM7UUFFRixPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUM7SUFDaEMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQXFCLEVBQUUsT0FBaUI7UUFDN0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDckQsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXBDLE1BQU0scUJBQXFCLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixDQUFDO1FBQzlELGNBQWMsQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLE9BQWU7WUFDdkQsSUFBSSxZQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sT0FBTyxDQUFDO1lBQ25CLENBQUM7aUJBQU0sQ0FBQztnQkFDSixhQUFhO2dCQUViLE9BQU8scUJBQXFCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUN4QyxjQUFjLENBQUMsS0FBSyxHQUFHLFVBQVUsT0FBZTtZQUM1QyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNULE9BQU8sTUFBTSxDQUFDO2dCQUNsQixDQUFDO3FCQUFNLENBQUM7b0JBQ0osTUFBTSxJQUFJLEtBQUssQ0FDWCwrQkFBK0IsT0FBTywrQkFBK0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQzNILENBQUM7Z0JBQ04sQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixhQUFhO2dCQUViLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNMLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFpQjtRQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLHFEQUFxRCxDQUFDLENBQUM7UUFDbkksQ0FBQztRQUVELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDO2dCQUNELFlBQVksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxNQUFNLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0RSxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFjO1FBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxNQUFNLElBQUksR0FBRyxxREFBcUQsQ0FBQyxDQUFDO1FBQ3hILENBQUM7UUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUMsQ0FBQzs7QUExRUwsb0NBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IE1vZHVsZSBmcm9tICdtb2R1bGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElFbmdpbmVMb2FkZXIge1xuICAgIGltcG9ydChpZDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbn1cblxuY29uc3QgTW9kdWxlSW50ZXJuYWwgPSBNb2R1bGUgYXMgdHlwZW9mIE1vZHVsZSAmIHtcbiAgICBfcmVzb2x2ZUZpbGVuYW1lKHRoaXM6IE1vZHVsZSwgcmVxdWVzdDogc3RyaW5nKTogdm9pZDtcbiAgICBfbG9hZCh0aGlzOiBNb2R1bGUsIHJlcXVlc3Q6IHN0cmluZyk6IHZvaWQ7XG59O1xuXG5leHBvcnQgY2xhc3MgRW5naW5lTG9hZGVyIHtcbiAgICBzdGF0aWMgaXNFbmdpbmVNb2R1bGUocmVxdWVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0ID09PSAnY2MnIHx8IChyZXF1ZXN0LnN0YXJ0c1dpdGgoJ2NjLycpICYmICFyZXF1ZXN0LnN0YXJ0c1dpdGgoJ2NjL3ByZWxvYWQnKSkgfHwgcmVxdWVzdC5zdGFydHNXaXRoKCdjY2U6L2ludGVybmFsLycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGVuZ2luZU1vZHVsZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBwdWJsaWMgc3RhdGljIGdldEVuZ2luZU1vZHVsZUJ5SWQoaWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiBFbmdpbmVMb2FkZXIuZW5naW5lTW9kdWxlc1tpZF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgbG9hZGVyOiBJRW5naW5lTG9hZGVyIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlRW5naW5lTG9hZGVyKGVuZ2luZURldlBhdGg6IHN0cmluZyk6IElFbmdpbmVMb2FkZXIge1xuICAgICAgICBjb25zdCBsb2FkZXJNb2R1bGUgPSByZXF1aXJlKHJlc29sdmUoam9pbihlbmdpbmVEZXZQYXRoLCAnZWRpdG9yJyksICdsb2FkZXInKSkgYXMge1xuICAgICAgICAgICAgZGVmYXVsdDogSUVuZ2luZUxvYWRlcjtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbG9hZGVyTW9kdWxlLmRlZmF1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBpbml0KGVuZ2luZURldlBhdGg6IHN0cmluZywgbW9kdWxlczogc3RyaW5nW10pIHtcbiAgICAgICAgdGhpcy5sb2FkZXIgPSB0aGlzLmNyZWF0ZUVuZ2luZUxvYWRlcihlbmdpbmVEZXZQYXRoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXF1aXJlZE1vZHVsZXMobW9kdWxlcyk7XG5cbiAgICAgICAgY29uc3QgdmVuZG9yUmVzb2x2ZUZpbGVuYW1lID0gTW9kdWxlSW50ZXJuYWwuX3Jlc29sdmVGaWxlbmFtZTtcbiAgICAgICAgTW9kdWxlSW50ZXJuYWwuX3Jlc29sdmVGaWxlbmFtZSA9IGZ1bmN0aW9uIChyZXF1ZXN0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChFbmdpbmVMb2FkZXIuaXNFbmdpbmVNb2R1bGUocmVxdWVzdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZlbmRvclJlc29sdmVGaWxlbmFtZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHZlbmRvckxvYWQgPSBNb2R1bGVJbnRlcm5hbC5fbG9hZDtcbiAgICAgICAgTW9kdWxlSW50ZXJuYWwuX2xvYWQgPSBmdW5jdGlvbiAocmVxdWVzdDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoRW5naW5lTG9hZGVyLmlzRW5naW5lTW9kdWxlKHJlcXVlc3QpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gRW5naW5lTG9hZGVyLmdldEVuZ2luZU1vZHVsZUJ5SWQocmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBDYW4gbm90IGxvYWQgZW5naW5lIG1vZHVsZTogJHtyZXF1ZXN0fS4gVmFsaWQgZW5naW5lIG1vZHVsZXMgYXJlOiAke09iamVjdC5rZXlzKEVuZ2luZUxvYWRlci5lbmdpbmVNb2R1bGVzKS5qb2luKCcsJyl9YCxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcblxuICAgICAgICAgICAgICAgIHJldHVybiB2ZW5kb3JMb2FkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyByZXF1aXJlZE1vZHVsZXMobW9kdWxlczogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBlbmdpbmUgbW9kdWxlICR7bW9kdWxlcy5qb2luKCcsJyl9LiBgICsgJ0xvYWRlciBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQuIGVuZ2luZUxvYWRlci5pbml0LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbW9kdWxlcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBFbmdpbmVMb2FkZXIuZW5naW5lTW9kdWxlc1ttb2R1bGVdID0gYXdhaXQgdGhpcy5sb2FkZXIhLmltcG9ydChtb2R1bGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBsb2FkIGVuZ2luZSBtb2R1bGU6ICR7bW9kdWxlfSAgZTogJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBpbXBvcnRNb2R1bGUobW9kdWxlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBlbmdpbmUgbW9kdWxlICR7bW9kdWxlfS4gYCArICdMb2FkZXIgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkLiBlbmdpbmVMb2FkZXIuaW5pdC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxvYWRlci5pbXBvcnQobW9kdWxlKTtcbiAgICB9XG59XG4iXX0=