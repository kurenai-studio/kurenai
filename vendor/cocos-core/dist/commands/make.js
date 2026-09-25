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
exports.MakeCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
/**
 * Make 命令类
 */
class MakeCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('make')
            .description('Make a Cocos native project')
            .requiredOption('-p, --platform <platform>', 'Target platform (windows, android, ios, etc.)')
            .requiredOption('-d, --dest <path>', 'Destination path for the made project')
            .action(async (options) => {
            try {
                const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../api/index')));
                const result = await CocosAPI.makeProject(options.platform, options.dest);
                if (result.code === 0 /* BuildExitCode.BUILD_SUCCESS */) {
                    console.log(chalk_1.default.green('✓ Make completed successfully!'));
                }
                else {
                    console.error(chalk_1.default.red('✗ Make failed!'));
                    process.exit(result.code);
                }
                process.exit(0);
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to make project:'), error);
                process.exit(1);
            }
        });
    }
}
exports.MakeCommand = MakeCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9tYWtlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixpQ0FBcUM7QUFHckM7O0dBRUc7QUFDSCxNQUFhLFdBQVksU0FBUSxrQkFBVztJQUN4QyxRQUFRO1FBQ0osSUFBSSxDQUFDLE9BQU87YUFDUCxPQUFPLENBQUMsTUFBTSxDQUFDO2FBQ2YsV0FBVyxDQUFDLDZCQUE2QixDQUFDO2FBQzFDLGNBQWMsQ0FBQywyQkFBMkIsRUFBRSwrQ0FBK0MsQ0FBQzthQUM1RixjQUFjLENBQUMsbUJBQW1CLEVBQUUsdUNBQXVDLENBQUM7YUFDNUUsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFZLEVBQUUsRUFBRTtZQUMzQixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGNBQWMsR0FBQyxDQUFDO2dCQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFFLElBQUksTUFBTSxDQUFDLElBQUksd0NBQWdDLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNKO0FBeEJELGtDQXdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBCYXNlQ29tbWFuZCB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQgeyBCdWlsZEV4aXRDb2RlIH0gZnJvbSAnLi4vY29yZS9idWlsZGVyL0B0eXBlcy9wcm90ZWN0ZWQnO1xuXG4vKipcbiAqIE1ha2Ug5ZG95Luk57G7XG4gKi9cbmV4cG9ydCBjbGFzcyBNYWtlQ29tbWFuZCBleHRlbmRzIEJhc2VDb21tYW5kIHtcbiAgICByZWdpc3RlcigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcm9ncmFtXG4gICAgICAgICAgICAuY29tbWFuZCgnbWFrZScpXG4gICAgICAgICAgICAuZGVzY3JpcHRpb24oJ01ha2UgYSBDb2NvcyBuYXRpdmUgcHJvamVjdCcpXG4gICAgICAgICAgICAucmVxdWlyZWRPcHRpb24oJy1wLCAtLXBsYXRmb3JtIDxwbGF0Zm9ybT4nLCAnVGFyZ2V0IHBsYXRmb3JtICh3aW5kb3dzLCBhbmRyb2lkLCBpb3MsIGV0Yy4pJylcbiAgICAgICAgICAgIC5yZXF1aXJlZE9wdGlvbignLWQsIC0tZGVzdCA8cGF0aD4nLCAnRGVzdGluYXRpb24gcGF0aCBmb3IgdGhlIG1hZGUgcHJvamVjdCcpXG4gICAgICAgICAgICAuYWN0aW9uKGFzeW5jIChvcHRpb25zOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IENvY29zQVBJIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2FwaS9pbmRleCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBDb2Nvc0FQSS5tYWtlUHJvamVjdChvcHRpb25zLnBsYXRmb3JtLCBvcHRpb25zLmRlc3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNvZGUgPT09IEJ1aWxkRXhpdENvZGUuQlVJTERfU1VDQ0VTUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBNYWtlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJykpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQoJ+KclyBNYWtlIGZhaWxlZCEnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQocmVzdWx0LmNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZCgnRmFpbGVkIHRvIG1ha2UgcHJvamVjdDonKSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuIl19