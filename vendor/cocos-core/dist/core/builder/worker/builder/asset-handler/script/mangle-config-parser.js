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
exports.parseMangleConfig = parseMangleConfig;
const fs = __importStar(require("fs-extra"));
function mergeConfigs(baseConfig, extendConfig) {
    return {
        mangleProtected: extendConfig.mangleProtected !== undefined ? extendConfig.mangleProtected : baseConfig.mangleProtected,
        mangleList: [...(baseConfig.mangleList || []), ...(extendConfig.mangleList || [])],
        dontMangleList: [...(baseConfig.dontMangleList || []), ...(extendConfig.dontMangleList || [])],
        extends: baseConfig.extends,
    };
}
function parseMangleConfig(filePath, platform) {
    if (!fs.existsSync(filePath)) {
        return undefined;
    }
    const configFile = fs.readJSONSync(filePath, 'utf-8');
    if (!configFile[platform]) {
        throw new Error(`Platform ${platform} not found in the configuration file.`);
    }
    let config = configFile[platform];
    while (config.extends) {
        const baseConfig = configFile[config.extends];
        if (!baseConfig) {
            throw new Error(`Base configuration ${config.extends} not found.`);
        }
        config = mergeConfigs(baseConfig, config);
    }
    return config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuZ2xlLWNvbmZpZy1wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvc2NyaXB0L21hbmdsZS1jb25maWctcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLDhDQW9CQztBQTFDRCw2Q0FBK0I7QUFhL0IsU0FBUyxZQUFZLENBQUMsVUFBd0IsRUFBRSxZQUEwQjtJQUN0RSxPQUFPO1FBQ0gsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsZUFBZTtRQUN2SCxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNsRixjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM5RixPQUFPLEVBQUUsVUFBVSxDQUFDLE9BQU87S0FDOUIsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxRQUFnQixFQUFFLFFBQWdCO0lBQ2hFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDM0IsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUNELE1BQU0sVUFBVSxHQUFlLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxFLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksUUFBUSx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRCxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEMsT0FBTyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixNQUFNLENBQUMsT0FBTyxhQUFhLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBQ0QsTUFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFuZ2xlQ29uZmlnIHtcbiAgICBtYW5nbGVQcm90ZWN0ZWQ/OiBib29sZWFuO1xuICAgIG1hbmdsZUxpc3Q/OiBzdHJpbmdbXTtcbiAgICBkb250TWFuZ2xlTGlzdD86IHN0cmluZ1tdO1xuICAgIGV4dGVuZHM/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDb25maWdGaWxlIHtcbiAgICBba2V5OiBzdHJpbmddOiBNYW5nbGVDb25maWc7XG59XG5cbmZ1bmN0aW9uIG1lcmdlQ29uZmlncyhiYXNlQ29uZmlnOiBNYW5nbGVDb25maWcsIGV4dGVuZENvbmZpZzogTWFuZ2xlQ29uZmlnKTogTWFuZ2xlQ29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBtYW5nbGVQcm90ZWN0ZWQ6IGV4dGVuZENvbmZpZy5tYW5nbGVQcm90ZWN0ZWQgIT09IHVuZGVmaW5lZCA/IGV4dGVuZENvbmZpZy5tYW5nbGVQcm90ZWN0ZWQgOiBiYXNlQ29uZmlnLm1hbmdsZVByb3RlY3RlZCxcbiAgICAgICAgbWFuZ2xlTGlzdDogWy4uLihiYXNlQ29uZmlnLm1hbmdsZUxpc3QgfHwgW10pLCAuLi4oZXh0ZW5kQ29uZmlnLm1hbmdsZUxpc3QgfHwgW10pXSxcbiAgICAgICAgZG9udE1hbmdsZUxpc3Q6IFsuLi4oYmFzZUNvbmZpZy5kb250TWFuZ2xlTGlzdCB8fCBbXSksIC4uLihleHRlbmRDb25maWcuZG9udE1hbmdsZUxpc3QgfHwgW10pXSxcbiAgICAgICAgZXh0ZW5kczogYmFzZUNvbmZpZy5leHRlbmRzLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1hbmdsZUNvbmZpZyhmaWxlUGF0aDogc3RyaW5nLCBwbGF0Zm9ybTogc3RyaW5nKTogTWFuZ2xlQ29uZmlnIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGNvbmZpZ0ZpbGU6IENvbmZpZ0ZpbGUgPSBmcy5yZWFkSlNPTlN5bmMoZmlsZVBhdGgsICd1dGYtOCcpO1xuXG4gICAgaWYgKCFjb25maWdGaWxlW3BsYXRmb3JtXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBsYXRmb3JtICR7cGxhdGZvcm19IG5vdCBmb3VuZCBpbiB0aGUgY29uZmlndXJhdGlvbiBmaWxlLmApO1xuICAgIH1cblxuICAgIGxldCBjb25maWcgPSBjb25maWdGaWxlW3BsYXRmb3JtXTtcbiAgICB3aGlsZSAoY29uZmlnLmV4dGVuZHMpIHtcbiAgICAgICAgY29uc3QgYmFzZUNvbmZpZyA9IGNvbmZpZ0ZpbGVbY29uZmlnLmV4dGVuZHNdO1xuICAgICAgICBpZiAoIWJhc2VDb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZSBjb25maWd1cmF0aW9uICR7Y29uZmlnLmV4dGVuZHN9IG5vdCBmb3VuZC5gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZ3MoYmFzZUNvbmZpZywgY29uZmlnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnO1xufVxuIl19