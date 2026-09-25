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
exports.RunCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
/**
 * Run 命令类
 */
class RunCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('run')
            .description('Run a Cocos project')
            .requiredOption('-p, --platform <platform>', 'Target platform (web-desktop, web-mobile, android, ios, etc.)')
            .requiredOption('-d, --dest <path>', 'Destination path of the built project')
            .action(async (options) => {
            try {
                const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../api/index')));
                const result = await CocosAPI.runProject(options.platform, options.dest);
                if (result.code === 0 /* BuildExitCode.BUILD_SUCCESS */) {
                    console.log(chalk_1.default.green('✓ Project is running!'));
                }
                else {
                    console.error(chalk_1.default.red('✗ Failed to run project!'));
                    process.exit(result.code);
                }
                // Run command might be long-running, so we might not want to exit immediately if it's a server or watcher.
                // However, based on the API signature returning a promise, it might be a fire-and-forget or wait-until-done.
                // If it's a server, we probably shouldn't exit.
                // But for now, let's assume it returns when done or if it's just launching something.
                // If it returns a process or similar, we might need to handle it.
                // For now, I'll follow the pattern but be aware it might need to stay alive.
                // If runProject returns a boolean indicating success of *launch*, then exit(0) is fine.
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to run project:'), error);
                process.exit(1);
            }
        });
    }
}
exports.RunCommand = RunCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3J1bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsaUNBQXFDO0FBR3JDOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEsa0JBQVc7SUFDdkMsUUFBUTtRQUNKLElBQUksQ0FBQyxPQUFPO2FBQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUNkLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQzthQUNsQyxjQUFjLENBQUMsMkJBQTJCLEVBQUUsK0RBQStELENBQUM7YUFDNUcsY0FBYyxDQUFDLG1CQUFtQixFQUFFLHVDQUF1QyxDQUFDO2FBQzVFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDO2dCQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyx3REFBYSxjQUFjLEdBQUMsQ0FBQztnQkFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLE1BQU0sQ0FBQyxJQUFJLHdDQUFnQyxFQUFFLENBQUM7b0JBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCwyR0FBMkc7Z0JBQzNHLDZHQUE2RztnQkFDN0csZ0RBQWdEO2dCQUNoRCxzRkFBc0Y7Z0JBQ3RGLGtFQUFrRTtnQkFDbEUsNkVBQTZFO2dCQUM3RSx3RkFBd0Y7WUFDNUYsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNKO0FBL0JELGdDQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBCYXNlQ29tbWFuZCB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQgeyBCdWlsZEV4aXRDb2RlIH0gZnJvbSAnLi4vY29yZS9idWlsZGVyL0B0eXBlcy9wcm90ZWN0ZWQnO1xuXG4vKipcbiAqIFJ1biDlkb3ku6TnsbtcbiAqL1xuZXhwb3J0IGNsYXNzIFJ1bkNvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gICAgcmVnaXN0ZXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJvZ3JhbVxuICAgICAgICAgICAgLmNvbW1hbmQoJ3J1bicpXG4gICAgICAgICAgICAuZGVzY3JpcHRpb24oJ1J1biBhIENvY29zIHByb2plY3QnKVxuICAgICAgICAgICAgLnJlcXVpcmVkT3B0aW9uKCctcCwgLS1wbGF0Zm9ybSA8cGxhdGZvcm0+JywgJ1RhcmdldCBwbGF0Zm9ybSAod2ViLWRlc2t0b3AsIHdlYi1tb2JpbGUsIGFuZHJvaWQsIGlvcywgZXRjLiknKVxuICAgICAgICAgICAgLnJlcXVpcmVkT3B0aW9uKCctZCwgLS1kZXN0IDxwYXRoPicsICdEZXN0aW5hdGlvbiBwYXRoIG9mIHRoZSBidWlsdCBwcm9qZWN0JylcbiAgICAgICAgICAgIC5hY3Rpb24oYXN5bmMgKG9wdGlvbnM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBDb2Nvc0FQSSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hcGkvaW5kZXgnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgQ29jb3NBUEkucnVuUHJvamVjdChvcHRpb25zLnBsYXRmb3JtLCBvcHRpb25zLmRlc3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNvZGUgPT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBQcm9qZWN0IGlzIHJ1bm5pbmchJykpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQoJ+KclyBGYWlsZWQgdG8gcnVuIHByb2plY3QhJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KHJlc3VsdC5jb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBSdW4gY29tbWFuZCBtaWdodCBiZSBsb25nLXJ1bm5pbmcsIHNvIHdlIG1pZ2h0IG5vdCB3YW50IHRvIGV4aXQgaW1tZWRpYXRlbHkgaWYgaXQncyBhIHNlcnZlciBvciB3YXRjaGVyLlxuICAgICAgICAgICAgICAgICAgICAvLyBIb3dldmVyLCBiYXNlZCBvbiB0aGUgQVBJIHNpZ25hdHVyZSByZXR1cm5pbmcgYSBwcm9taXNlLCBpdCBtaWdodCBiZSBhIGZpcmUtYW5kLWZvcmdldCBvciB3YWl0LXVudGlsLWRvbmUuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGl0J3MgYSBzZXJ2ZXIsIHdlIHByb2JhYmx5IHNob3VsZG4ndCBleGl0LlxuICAgICAgICAgICAgICAgICAgICAvLyBCdXQgZm9yIG5vdywgbGV0J3MgYXNzdW1lIGl0IHJldHVybnMgd2hlbiBkb25lIG9yIGlmIGl0J3MganVzdCBsYXVuY2hpbmcgc29tZXRoaW5nLlxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgcHJvY2VzcyBvciBzaW1pbGFyLCB3ZSBtaWdodCBuZWVkIHRvIGhhbmRsZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIG5vdywgSSdsbCBmb2xsb3cgdGhlIHBhdHRlcm4gYnV0IGJlIGF3YXJlIGl0IG1pZ2h0IG5lZWQgdG8gc3RheSBhbGl2ZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgcnVuUHJvamVjdCByZXR1cm5zIGEgYm9vbGVhbiBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb2YgKmxhdW5jaCosIHRoZW4gZXhpdCgwKSBpcyBmaW5lLlxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCdGYWlsZWQgdG8gcnVuIHByb2plY3Q6JyksIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==