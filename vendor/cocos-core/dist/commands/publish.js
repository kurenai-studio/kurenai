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
exports.PublishCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
/**
 * Publish command.
 */
class PublishCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('publish')
            .description('Publish a previously uploaded Cocos package')
            .requiredOption('-p, --platform <platform>', 'Target platform')
            .requiredOption('-d, --dest <path>', 'Destination path of the built project')
            .action(async (options) => {
            try {
                const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../api/index')));
                const result = await CocosAPI.publishProject(options.platform, options.dest);
                if (result.code === 0 /* BuildExitCode.BUILD_SUCCESS */) {
                    console.log(chalk_1.default.green('Publish completed successfully!'));
                }
                else {
                    console.error(chalk_1.default.red('Publish failed!'));
                    process.exit(result.code);
                }
                process.exit(0);
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to publish project:'), error);
                process.exit(1);
            }
        });
    }
}
exports.PublishCommand = PublishCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wdWJsaXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixpQ0FBcUM7QUFHckM7O0dBRUc7QUFDSCxNQUFhLGNBQWUsU0FBUSxrQkFBVztJQUMzQyxRQUFRO1FBQ0osSUFBSSxDQUFDLE9BQU87YUFDUCxPQUFPLENBQUMsU0FBUyxDQUFDO2FBQ2xCLFdBQVcsQ0FBQyw2Q0FBNkMsQ0FBQzthQUMxRCxjQUFjLENBQUMsMkJBQTJCLEVBQUUsaUJBQWlCLENBQUM7YUFDOUQsY0FBYyxDQUFDLG1CQUFtQixFQUFFLHVDQUF1QyxDQUFDO2FBQzVFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDO2dCQUNELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyx3REFBYSxjQUFjLEdBQUMsQ0FBQztnQkFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLE1BQU0sQ0FBQyxJQUFJLHdDQUFnQyxFQUFFLENBQUM7b0JBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM5RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7Q0FDSjtBQXhCRCx3Q0F3QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHsgQmFzZUNvbW1hbmQgfSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHsgQnVpbGRFeGl0Q29kZSB9IGZyb20gJy4uL2NvcmUvYnVpbGRlci9AdHlwZXMvcHJvdGVjdGVkJztcblxuLyoqXG4gKiBQdWJsaXNoIGNvbW1hbmQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQdWJsaXNoQ29tbWFuZCBleHRlbmRzIEJhc2VDb21tYW5kIHtcbiAgICByZWdpc3RlcigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcm9ncmFtXG4gICAgICAgICAgICAuY29tbWFuZCgncHVibGlzaCcpXG4gICAgICAgICAgICAuZGVzY3JpcHRpb24oJ1B1Ymxpc2ggYSBwcmV2aW91c2x5IHVwbG9hZGVkIENvY29zIHBhY2thZ2UnKVxuICAgICAgICAgICAgLnJlcXVpcmVkT3B0aW9uKCctcCwgLS1wbGF0Zm9ybSA8cGxhdGZvcm0+JywgJ1RhcmdldCBwbGF0Zm9ybScpXG4gICAgICAgICAgICAucmVxdWlyZWRPcHRpb24oJy1kLCAtLWRlc3QgPHBhdGg+JywgJ0Rlc3RpbmF0aW9uIHBhdGggb2YgdGhlIGJ1aWx0IHByb2plY3QnKVxuICAgICAgICAgICAgLmFjdGlvbihhc3luYyAob3B0aW9uczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBDb2Nvc0FQSSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hcGkvaW5kZXgnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgQ29jb3NBUEkucHVibGlzaFByb2plY3Qob3B0aW9ucy5wbGF0Zm9ybSwgb3B0aW9ucy5kZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlID09PSBCdWlsZEV4aXRDb2RlLkJVSUxEX1NVQ0NFU1MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCdQdWJsaXNoIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJykpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQoJ1B1Ymxpc2ggZmFpbGVkIScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdChyZXN1bHQuY29kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCdGYWlsZWQgdG8gcHVibGlzaCBwcm9qZWN0OicpLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=