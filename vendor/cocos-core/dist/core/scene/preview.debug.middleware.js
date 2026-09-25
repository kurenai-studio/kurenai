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
exports.default = {
    get: [],
    post: [
        {
            url: '/create-asset',
            async handler(req, res) {
                try {
                    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                    const { dbURL, content } = req.body;
                    if (!dbURL) {
                        return res.status(400).json({ error: 'dbURL is required' });
                    }
                    const result = await assetManager.createAsset({ target: dbURL, content: content || '' });
                    res.status(200).json({ success: true, result });
                }
                catch (e) {
                    res.status(500).json({ error: e.message });
                }
            },
        },
        {
            url: '/delete-asset',
            async handler(req, res) {
                try {
                    const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                    const { dbURL } = req.body;
                    if (!dbURL) {
                        return res.status(400).json({ error: 'dbURL is required' });
                    }
                    const result = await assetManager.removeAsset(dbURL, { useTrash: false });
                    res.status(200).json({ success: true, result });
                }
                catch (e) {
                    res.status(500).json({ error: e.message });
                }
            },
        },
    ],
    socket: {
        connection: (_socket) => { },
        disconnect: (_socket) => { }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy5kZWJ1Zy5taWRkbGV3YXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvcHJldmlldy5kZWJ1Zy5taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0Esa0JBQWU7SUFDWCxHQUFHLEVBQUUsRUFBRTtJQUNQLElBQUksRUFBRTtRQUNGO1lBQ0ksR0FBRyxFQUFFLGVBQWU7WUFDcEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFZLEVBQUUsR0FBYTtnQkFDckMsSUFBSSxDQUFDO29CQUNELE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyx3REFBYSxXQUFXLEdBQUMsQ0FBQztvQkFDbkQsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7b0JBQ2hFLENBQUM7b0JBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3pGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7b0JBQ2QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDTCxDQUFDO1NBQ0o7UUFDRDtZQUNJLEdBQUcsRUFBRSxlQUFlO1lBQ3BCLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBWSxFQUFFLEdBQWE7Z0JBQ3JDLElBQUksQ0FBQztvQkFDRCxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsd0RBQWEsV0FBVyxHQUFDLENBQUM7b0JBQ25ELE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUMzQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7b0JBQ2hFLENBQUM7b0JBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUMxRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztnQkFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO29CQUNkLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0wsQ0FBQztTQUNKO0tBQ0o7SUFDRCxNQUFNLEVBQUU7UUFDSixVQUFVLEVBQUUsQ0FBQyxPQUFZLEVBQUUsRUFBRSxHQUFHLENBQUM7UUFDakMsVUFBVSxFQUFFLENBQUMsT0FBWSxFQUFFLEVBQUUsR0FBRyxDQUFDO0tBQ3BDO0NBQ3VCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElNaWRkbGV3YXJlQ29udHJpYnV0aW9uIH0gZnJvbSAnLi4vLi4vc2VydmVyL2ludGVyZmFjZXMnO1xuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldDogW10sXG4gICAgcG9zdDogW1xuICAgICAgICB7XG4gICAgICAgICAgICB1cmw6ICcvY3JlYXRlLWFzc2V0JyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGJVUkwsIGNvbnRlbnQgfSA9IHJlcS5ib2R5O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRiVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ2RiVVJMIGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhc3NldE1hbmFnZXIuY3JlYXRlQXNzZXQoeyB0YXJnZXQ6IGRiVVJMLCBjb250ZW50OiBjb250ZW50IHx8ICcnIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogJy9kZWxldGUtYXNzZXQnLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGFzc2V0TWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldHMnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBkYlVSTCB9ID0gcmVxLmJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGJVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnZGJVUkwgaXMgcmVxdWlyZWQnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFzc2V0TWFuYWdlci5yZW1vdmVBc3NldChkYlVSTCwgeyB1c2VUcmFzaDogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICBdLFxuICAgIHNvY2tldDoge1xuICAgICAgICBjb25uZWN0aW9uOiAoX3NvY2tldDogYW55KSA9PiB7IH0sXG4gICAgICAgIGRpc2Nvbm5lY3Q6IChfc29ja2V0OiBhbnkpID0+IHsgfVxuICAgIH0sXG59IGFzIElNaWRkbGV3YXJlQ29udHJpYnV0aW9uO1xuIl19