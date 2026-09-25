"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FbxHandler = void 0;
const gltf_1 = __importDefault(require("./gltf"));
exports.FbxHandler = {
    ...gltf_1.default,
    // Handler 的名字，用于指定 Handler as 等
    name: 'fbx',
    propertySchemaConfig: {
        ...(gltf_1.default.propertySchemaConfig ?? {}),
        legacyFbxImporter: {
            title: 'i18n:ENGINE.assets.fbx.legacyFbxImporter.name',
            description: 'i18n:ENGINE.assets.fbx.legacyFbxImporter.title',
            type: 'boolean',
            default: false,
        },
        fbx: {
            title: 'i18n:ENGINE.assets.fbx.fbx',
            description: 'i18n:importer.property_schema.fbx.fbx_description',
            type: 'object',
            default: {
                unitConversion: 'geometry-level',
                animationBakeRate: 24,
                preferLocalTimeSpan: true,
                smartMaterialEnabled: false,
                matchMeshNames: false,
            },
            properties: {
                unitConversion: {
                    title: 'i18n:importer.property_schema.fbx.unit_conversion',
                    description: 'i18n:importer.property_schema.fbx.unit_conversion_description',
                    type: 'string',
                    default: 'geometry-level',
                    enum: ['geometry-level', 'hierarchy-level', 'disabled'],
                    enumDescriptions: [
                        'i18n:importer.property_schema.fbx.unit_conversion_geometry_level',
                        'i18n:importer.property_schema.fbx.unit_conversion_hierarchy_level',
                        'i18n:importer.property_schema.fbx.unit_conversion_disabled',
                    ],
                },
                animationBakeRate: {
                    title: 'i18n:ENGINE.assets.fbx.animationBakeRate.name',
                    description: 'i18n:ENGINE.assets.fbx.animationBakeRate.title',
                    type: 'number',
                    default: 24,
                    enum: [0, 24, 25, 30, 60],
                    enumDescriptions: ['i18n:ENGINE.assets.fbx.animationBakeRate.auto', '24 FPS', '25 FPS', '30 FPS', '60 FPS'],
                },
                preferLocalTimeSpan: {
                    title: 'i18n:ENGINE.assets.fbx.preferLocalTimeSpan.name',
                    description: 'i18n:ENGINE.assets.fbx.preferLocalTimeSpan.title',
                    type: 'boolean',
                    default: true,
                },
                smartMaterialEnabled: {
                    title: 'i18n:ENGINE.assets.fbx.smartMaterialEnabled.name',
                    description: 'i18n:ENGINE.assets.fbx.smartMaterialEnabled.title',
                    type: 'boolean',
                    default: false,
                },
                matchMeshNames: {
                    title: 'i18n:importer.property_schema.fbx.match_mesh_names',
                    description: 'i18n:importer.property_schema.fbx.match_mesh_names_description',
                    type: 'boolean',
                    default: false,
                },
            },
        },
    },
};
exports.default = exports.FbxHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmJ4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2ZieC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxrREFBaUM7QUFFcEIsUUFBQSxVQUFVLEdBQXFCO0lBQ3hDLEdBQUcsY0FBVztJQUVkLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsS0FBSztJQUVYLG9CQUFvQixFQUFFO1FBQ2xCLEdBQUcsQ0FBQyxjQUFXLENBQUMsb0JBQW9CLElBQUksRUFBRSxDQUFDO1FBQzNDLGlCQUFpQixFQUFFO1lBQ2YsS0FBSyxFQUFFLCtDQUErQztZQUN0RCxXQUFXLEVBQUUsZ0RBQWdEO1lBQzdELElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7U0FDakI7UUFDRCxHQUFHLEVBQUU7WUFDRCxLQUFLLEVBQUUsNEJBQTRCO1lBQ25DLFdBQVcsRUFBRSxtREFBbUQ7WUFDaEUsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGdCQUFnQjtnQkFDaEMsaUJBQWlCLEVBQUUsRUFBRTtnQkFDckIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IsY0FBYyxFQUFFLEtBQUs7YUFDeEI7WUFDRCxVQUFVLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFO29CQUNaLEtBQUssRUFBRSxtREFBbUQ7b0JBQzFELFdBQVcsRUFBRSwrREFBK0Q7b0JBQzVFLElBQUksRUFBRSxRQUFRO29CQUNkLE9BQU8sRUFBRSxnQkFBZ0I7b0JBQ3pCLElBQUksRUFBRSxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQztvQkFDdkQsZ0JBQWdCLEVBQUU7d0JBQ2Qsa0VBQWtFO3dCQUNsRSxtRUFBbUU7d0JBQ25FLDREQUE0RDtxQkFDL0Q7aUJBQ0o7Z0JBQ0QsaUJBQWlCLEVBQUU7b0JBQ2YsS0FBSyxFQUFFLCtDQUErQztvQkFDdEQsV0FBVyxFQUFFLGdEQUFnRDtvQkFDN0QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxFQUFFLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztvQkFDekIsZ0JBQWdCLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7aUJBQzlHO2dCQUNELG1CQUFtQixFQUFFO29CQUNqQixLQUFLLEVBQUUsaURBQWlEO29CQUN4RCxXQUFXLEVBQUUsa0RBQWtEO29CQUMvRCxJQUFJLEVBQUUsU0FBUztvQkFDZixPQUFPLEVBQUUsSUFBSTtpQkFDaEI7Z0JBQ0Qsb0JBQW9CLEVBQUU7b0JBQ2xCLEtBQUssRUFBRSxrREFBa0Q7b0JBQ3pELFdBQVcsRUFBRSxtREFBbUQ7b0JBQ2hFLElBQUksRUFBRSxTQUFTO29CQUNmLE9BQU8sRUFBRSxLQUFLO2lCQUNqQjtnQkFDRCxjQUFjLEVBQUU7b0JBQ1osS0FBSyxFQUFFLG9EQUFvRDtvQkFDM0QsV0FBVyxFQUFFLGdFQUFnRTtvQkFDN0UsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsT0FBTyxFQUFFLEtBQUs7aUJBQ2pCO2FBQ0o7U0FDSjtLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLGtCQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEhhbmRsZXJCYXNlIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgR2x0ZkhhbmRsZXIgZnJvbSAnLi9nbHRmJztcblxuZXhwb3J0IGNvbnN0IEZieEhhbmRsZXI6IEFzc2V0SGFuZGxlckJhc2UgPSB7XG4gICAgLi4uR2x0ZkhhbmRsZXIsXG5cbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdmYngnLFxuXG4gICAgcHJvcGVydHlTY2hlbWFDb25maWc6IHtcbiAgICAgICAgLi4uKEdsdGZIYW5kbGVyLnByb3BlcnR5U2NoZW1hQ29uZmlnID8/IHt9KSxcbiAgICAgICAgbGVnYWN5RmJ4SW1wb3J0ZXI6IHtcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5sZWdhY3lGYnhJbXBvcnRlci5uYW1lJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5sZWdhY3lGYnhJbXBvcnRlci50aXRsZScsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgZmJ4OiB7XG4gICAgICAgICAgICB0aXRsZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguZmJ4JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZmJ4LmZieF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICB1bml0Q29udmVyc2lvbjogJ2dlb21ldHJ5LWxldmVsJyxcbiAgICAgICAgICAgICAgICBhbmltYXRpb25CYWtlUmF0ZTogMjQsXG4gICAgICAgICAgICAgICAgcHJlZmVyTG9jYWxUaW1lU3BhbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzbWFydE1hdGVyaWFsRW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWF0Y2hNZXNoTmFtZXM6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICB1bml0Q29udmVyc2lvbjoge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmZieC51bml0X2NvbnZlcnNpb24nLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmZieC51bml0X2NvbnZlcnNpb25fZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2dlb21ldHJ5LWxldmVsJyxcbiAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZW9tZXRyeS1sZXZlbCcsICdoaWVyYXJjaHktbGV2ZWwnLCAnZGlzYWJsZWQnXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bURlc2NyaXB0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmZieC51bml0X2NvbnZlcnNpb25fZ2VvbWV0cnlfbGV2ZWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmZieC51bml0X2NvbnZlcnNpb25faGllcmFyY2h5X2xldmVsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5mYngudW5pdF9jb252ZXJzaW9uX2Rpc2FibGVkJyxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkJha2VSYXRlOiB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5hbmltYXRpb25CYWtlUmF0ZS5uYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LmFuaW1hdGlvbkJha2VSYXRlLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDI0LFxuICAgICAgICAgICAgICAgICAgICBlbnVtOiBbMCwgMjQsIDI1LCAzMCwgNjBdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBbJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguYW5pbWF0aW9uQmFrZVJhdGUuYXV0bycsICcyNCBGUFMnLCAnMjUgRlBTJywgJzMwIEZQUycsICc2MCBGUFMnXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHByZWZlckxvY2FsVGltZVNwYW46IHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LnByZWZlckxvY2FsVGltZVNwYW4ubmFtZScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmZieC5wcmVmZXJMb2NhbFRpbWVTcGFuLnRpdGxlJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc21hcnRNYXRlcmlhbEVuYWJsZWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuZmJ4LnNtYXJ0TWF0ZXJpYWxFbmFibGVkLm5hbWUnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5mYnguc21hcnRNYXRlcmlhbEVuYWJsZWQudGl0bGUnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWF0Y2hNZXNoTmFtZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5mYngubWF0Y2hfbWVzaF9uYW1lcycsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuZmJ4Lm1hdGNoX21lc2hfbmFtZXNfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBGYnhIYW5kbGVyO1xuIl19