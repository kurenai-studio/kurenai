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
exports.UploadCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const base_1 = require("./base");
/**
 * Upload command.
 */
class UploadCommand extends base_1.BaseCommand {
    register() {
        this.program
            .command('upload')
            .description('Upload a built Cocos package')
            .requiredOption('-p, --platform <platform>', 'Target platform')
            .requiredOption('-d, --dest <path>', 'Destination path of the built project')
            .option('--access-token <token>', 'Access token used by the target platform upload API')
            .action(async (options) => {
            try {
                const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../api/index')));
                const result = await CocosAPI.uploadProject(options.platform, options.dest, options.accessToken);
                if (result.code === 0 /* BuildExitCode.BUILD_SUCCESS */) {
                    console.log(chalk_1.default.green('Upload completed successfully!'));
                }
                else {
                    console.error(chalk_1.default.red('Upload failed!'));
                    process.exit(result.code);
                }
                process.exit(0);
            }
            catch (error) {
                console.error(chalk_1.default.red('Failed to upload project:'), error);
                process.exit(1);
            }
        });
    }
}
exports.UploadCommand = UploadCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3VwbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsaUNBQXFDO0FBR3JDOztHQUVHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsa0JBQVc7SUFDMUMsUUFBUTtRQUNKLElBQUksQ0FBQyxPQUFPO2FBQ1AsT0FBTyxDQUFDLFFBQVEsQ0FBQzthQUNqQixXQUFXLENBQUMsOEJBQThCLENBQUM7YUFDM0MsY0FBYyxDQUFDLDJCQUEyQixFQUFFLGlCQUFpQixDQUFDO2FBQzlELGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSx1Q0FBdUMsQ0FBQzthQUM1RSxNQUFNLENBQUMsd0JBQXdCLEVBQUUscURBQXFELENBQUM7YUFDdkYsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFZLEVBQUUsRUFBRTtZQUMzQixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGNBQWMsR0FBQyxDQUFDO2dCQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDakcsSUFBSSxNQUFNLENBQUMsSUFBSSx3Q0FBZ0MsRUFBRSxDQUFDO29CQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztvQkFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQUssQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDN0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0o7QUF6QkQsc0NBeUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCB7IEJhc2VDb21tYW5kIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7IEJ1aWxkRXhpdENvZGUgfSBmcm9tICcuLi9jb3JlL2J1aWxkZXIvQHR5cGVzL3Byb3RlY3RlZCc7XG5cbi8qKlxuICogVXBsb2FkIGNvbW1hbmQuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGxvYWRDb21tYW5kIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICAgIHJlZ2lzdGVyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2dyYW1cbiAgICAgICAgICAgIC5jb21tYW5kKCd1cGxvYWQnKVxuICAgICAgICAgICAgLmRlc2NyaXB0aW9uKCdVcGxvYWQgYSBidWlsdCBDb2NvcyBwYWNrYWdlJylcbiAgICAgICAgICAgIC5yZXF1aXJlZE9wdGlvbignLXAsIC0tcGxhdGZvcm0gPHBsYXRmb3JtPicsICdUYXJnZXQgcGxhdGZvcm0nKVxuICAgICAgICAgICAgLnJlcXVpcmVkT3B0aW9uKCctZCwgLS1kZXN0IDxwYXRoPicsICdEZXN0aW5hdGlvbiBwYXRoIG9mIHRoZSBidWlsdCBwcm9qZWN0JylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tYWNjZXNzLXRva2VuIDx0b2tlbj4nLCAnQWNjZXNzIHRva2VuIHVzZWQgYnkgdGhlIHRhcmdldCBwbGF0Zm9ybSB1cGxvYWQgQVBJJylcbiAgICAgICAgICAgIC5hY3Rpb24oYXN5bmMgKG9wdGlvbnM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQ29jb3NBUEkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL2luZGV4Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IENvY29zQVBJLnVwbG9hZFByb2plY3Qob3B0aW9ucy5wbGF0Zm9ybSwgb3B0aW9ucy5kZXN0LCBvcHRpb25zLmFjY2Vzc1Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5jb2RlID09PSBCdWlsZEV4aXRDb2RlLkJVSUxEX1NVQ0NFU1MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCdVcGxvYWQgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSEnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZCgnVXBsb2FkIGZhaWxlZCEnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQocmVzdWx0LmNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZCgnRmFpbGVkIHRvIHVwbG9hZCBwcm9qZWN0OicpLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=