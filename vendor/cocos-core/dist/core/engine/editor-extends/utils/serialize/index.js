"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = serialize;
exports.serializeCompiled = serializeCompiled;
const builder_1 = require("./compiled/builder");
const pack_jsons_1 = __importDefault(require("./compiled/pack-jsons"));
const parser_1 = __importDefault(require("./parser"));
const dynamic_builder_1 = require("./dynamic-builder");
function serialize(obj, options) {
    // console.time('Serialize in dynamic format');
    options = Object.assign({
        builder: 'dynamic',
    }, options);
    const res = (0, parser_1.default)(obj, options);
    // console.timeEnd('Serialize in dynamic format');
    // if (!options.forceInline) {
    //     // console.time('Serialize by legacy module');
    //     const expectedRes = serializeLegacy(obj, options);
    //     // console.timeEnd('Serialize by legacy module');
    //     if (typeof res === 'string') {
    //         if (res !== expectedRes) {
    //             console.warn('Different serialize result, new:');
    //             console.log(res);
    //             console.warn('Old:');
    //             console.log(expectedRes);
    //             return expectedRes;
    //         }
    //     }
    // }
    return res;
}
serialize.asAsset = dynamic_builder_1.asAsset;
serialize.setName = dynamic_builder_1.setName;
serialize.findRootObject = dynamic_builder_1.findRootObject;
function serializeCompiled(obj, options) {
    options = Object.assign({
        builder: 'compiled',
        dontStripDefault: false,
    }, options);
    return (0, parser_1.default)(obj, options);
}
serializeCompiled.getRootData = builder_1.getRootData;
serializeCompiled.packJSONs = pack_jsons_1.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvdXRpbHMvc2VyaWFsaXplL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBS0EsOEJBd0JDO0FBTUQsOENBTUM7QUF6Q0QsZ0RBQWlEO0FBQ2pELHVFQUE4QztBQUM5QyxzREFBNEQ7QUFDNUQsdURBQXFFO0FBRXJFLFNBQWdCLFNBQVMsQ0FBQyxHQUFtQyxFQUFFLE9BQWtCO0lBQzdFLCtDQUErQztJQUMvQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNwQixPQUFPLEVBQUUsU0FBUztLQUNyQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ1osTUFBTSxHQUFHLEdBQUcsSUFBQSxnQkFBVyxFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QyxrREFBa0Q7SUFFbEQsOEJBQThCO0lBQzlCLHFEQUFxRDtJQUNyRCx5REFBeUQ7SUFDekQsd0RBQXdEO0lBQ3hELHFDQUFxQztJQUNyQyxxQ0FBcUM7SUFDckMsZ0VBQWdFO0lBQ2hFLGdDQUFnQztJQUNoQyxvQ0FBb0M7SUFDcEMsd0NBQXdDO0lBQ3hDLGtDQUFrQztJQUNsQyxZQUFZO0lBQ1osUUFBUTtJQUNSLElBQUk7SUFFSixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLENBQUMsT0FBTyxHQUFHLHlCQUFPLENBQUM7QUFDNUIsU0FBUyxDQUFDLE9BQU8sR0FBRyx5QkFBTyxDQUFDO0FBQzVCLFNBQVMsQ0FBQyxjQUFjLEdBQUcsZ0NBQWMsQ0FBQztBQUUxQyxTQUFnQixpQkFBaUIsQ0FBQyxHQUFtQyxFQUFFLE9BQWlCO0lBQ3BGLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3BCLE9BQU8sRUFBRSxVQUFVO1FBQ25CLGdCQUFnQixFQUFFLEtBQUs7S0FDMUIsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNaLE9BQU8sSUFBQSxnQkFBVyxFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRUQsaUJBQWlCLENBQUMsV0FBVyxHQUFHLHFCQUFXLENBQUM7QUFDNUMsaUJBQWlCLENBQUMsU0FBUyxHQUFHLG9CQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRSb290RGF0YSB9IGZyb20gJy4vY29tcGlsZWQvYnVpbGRlcic7XG5pbXBvcnQgcGFja0pTT05zIGZyb20gJy4vY29tcGlsZWQvcGFjay1qc29ucyc7XG5pbXBvcnQgeyBkZWZhdWx0IGFzIGRvU2VyaWFsaXplLCBJT3B0aW9ucyB9IGZyb20gJy4vcGFyc2VyJztcbmltcG9ydCB7IGFzQXNzZXQsIHNldE5hbWUsIGZpbmRSb290T2JqZWN0IH0gZnJvbSAnLi9keW5hbWljLWJ1aWxkZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKG9iajogRXhjbHVkZTxhbnksIG51bGwgfCB1bmRlZmluZWQ+LCBvcHRpb25zPzogSU9wdGlvbnMpOiBzdHJpbmcgfCBvYmplY3Qge1xuICAgIC8vIGNvbnNvbGUudGltZSgnU2VyaWFsaXplIGluIGR5bmFtaWMgZm9ybWF0Jyk7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBidWlsZGVyOiAnZHluYW1pYycsXG4gICAgfSwgb3B0aW9ucyk7XG4gICAgY29uc3QgcmVzID0gZG9TZXJpYWxpemUob2JqLCBvcHRpb25zKTtcbiAgICAvLyBjb25zb2xlLnRpbWVFbmQoJ1NlcmlhbGl6ZSBpbiBkeW5hbWljIGZvcm1hdCcpO1xuXG4gICAgLy8gaWYgKCFvcHRpb25zLmZvcmNlSW5saW5lKSB7XG4gICAgLy8gICAgIC8vIGNvbnNvbGUudGltZSgnU2VyaWFsaXplIGJ5IGxlZ2FjeSBtb2R1bGUnKTtcbiAgICAvLyAgICAgY29uc3QgZXhwZWN0ZWRSZXMgPSBzZXJpYWxpemVMZWdhY3kob2JqLCBvcHRpb25zKTtcbiAgICAvLyAgICAgLy8gY29uc29sZS50aW1lRW5kKCdTZXJpYWxpemUgYnkgbGVnYWN5IG1vZHVsZScpO1xuICAgIC8vICAgICBpZiAodHlwZW9mIHJlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyAgICAgICAgIGlmIChyZXMgIT09IGV4cGVjdGVkUmVzKSB7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS53YXJuKCdEaWZmZXJlbnQgc2VyaWFsaXplIHJlc3VsdCwgbmV3OicpO1xuICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS53YXJuKCdPbGQ6Jyk7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coZXhwZWN0ZWRSZXMpO1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiBleHBlY3RlZFJlcztcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbnNlcmlhbGl6ZS5hc0Fzc2V0ID0gYXNBc3NldDtcbnNlcmlhbGl6ZS5zZXROYW1lID0gc2V0TmFtZTtcbnNlcmlhbGl6ZS5maW5kUm9vdE9iamVjdCA9IGZpbmRSb290T2JqZWN0O1xuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQ29tcGlsZWQob2JqOiBFeGNsdWRlPGFueSwgbnVsbCB8IHVuZGVmaW5lZD4sIG9wdGlvbnM6IElPcHRpb25zKTogc3RyaW5nIHwgb2JqZWN0IHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGJ1aWxkZXI6ICdjb21waWxlZCcsXG4gICAgICAgIGRvbnRTdHJpcERlZmF1bHQ6IGZhbHNlLFxuICAgIH0sIG9wdGlvbnMpO1xuICAgIHJldHVybiBkb1NlcmlhbGl6ZShvYmosIG9wdGlvbnMpO1xufVxuXG5zZXJpYWxpemVDb21waWxlZC5nZXRSb290RGF0YSA9IGdldFJvb3REYXRhO1xuc2VyaWFsaXplQ29tcGlsZWQucGFja0pTT05zID0gcGFja0pTT05zO1xuIl19