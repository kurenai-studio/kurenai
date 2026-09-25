"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImportMetadataNodes = createImportMetadataNodes;
const metadata_1 = require("../configuration/script/metadata");
const import_config_defaults_1 = require("./import-config-defaults");
function createImportMetadataNodes() {
    return [
        (0, metadata_1.createNode)('import', 'i18n:configuration.import.title', 'import', {
            'import.globList': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.import.globList.title',
                description: 'i18n:configuration.import.globList.description',
                items: { type: 'string', title: 'i18n:configuration.import.globList.itemTitle' },
            },
            'import.restoreAssetDBFromCache': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.import.restoreAssetDBFromCache.title',
            },
            'import.createTemplateRoot': {
                type: 'string',
                default: import_config_defaults_1.DEFAULT_CREATE_TEMPLATE_ROOT,
                title: 'i18n:configuration.import.createTemplateRoot.title',
            },
            'import.userDataTemplate': (0, metadata_1.objectSchema)(undefined, {
                title: 'i18n:configuration.import.userDataTemplate.title',
                description: 'i18n:configuration.import.userDataTemplate.description',
                additionalProperties: true,
            }),
            'import.fbx.material.smart': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.import.fbx.material.smart.title',
            },
        }, 10),
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvbWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSw4REFnQ0M7QUFuQ0QsK0RBQTRFO0FBQzVFLHFFQUF3RTtBQUV4RSxTQUFnQix5QkFBeUI7SUFDckMsT0FBTztRQUNILElBQUEscUJBQVUsRUFBQyxRQUFRLEVBQUUsaUNBQWlDLEVBQUUsUUFBUSxFQUFFO1lBQzlELGlCQUFpQixFQUFFO2dCQUNmLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSwwQ0FBMEM7Z0JBQ2pELFdBQVcsRUFBRSxnREFBZ0Q7Z0JBQzdELEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLDhDQUE4QyxFQUFFO2FBQ25GO1lBQ0QsZ0NBQWdDLEVBQUU7Z0JBQzlCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSx5REFBeUQ7YUFDbkU7WUFDRCwyQkFBMkIsRUFBRTtnQkFDekIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLHFEQUE0QjtnQkFDckMsS0FBSyxFQUFFLG9EQUFvRDthQUM5RDtZQUNELHlCQUF5QixFQUFFLElBQUEsdUJBQVksRUFBQyxTQUFTLEVBQUU7Z0JBQy9DLEtBQUssRUFBRSxrREFBa0Q7Z0JBQ3pELFdBQVcsRUFBRSx3REFBd0Q7Z0JBQ3JFLG9CQUFvQixFQUFFLElBQUk7YUFDN0IsQ0FBQztZQUNGLDJCQUEyQixFQUFFO2dCQUN6QixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsb0RBQW9EO2FBQzlEO1NBQ0osRUFBRSxFQUFFLENBQUM7S0FDVCxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSUNvY29zQ29uZmlndXJhdGlvbk5vZGUgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5pbXBvcnQgeyBjcmVhdGVOb2RlLCBvYmplY3RTY2hlbWEgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5pbXBvcnQgeyBERUZBVUxUX0NSRUFURV9URU1QTEFURV9ST09UIH0gZnJvbSAnLi9pbXBvcnQtY29uZmlnLWRlZmF1bHRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUltcG9ydE1ldGFkYXRhTm9kZXMoKTogSUNvY29zQ29uZmlndXJhdGlvbk5vZGVbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgY3JlYXRlTm9kZSgnaW1wb3J0JywgJ2kxOG46Y29uZmlndXJhdGlvbi5pbXBvcnQudGl0bGUnLCAnaW1wb3J0Jywge1xuICAgICAgICAgICAgJ2ltcG9ydC5nbG9iTGlzdCc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmltcG9ydC5nbG9iTGlzdC50aXRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmNvbmZpZ3VyYXRpb24uaW1wb3J0Lmdsb2JMaXN0LmRlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJywgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uaW1wb3J0Lmdsb2JMaXN0Lml0ZW1UaXRsZScgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnaW1wb3J0LnJlc3RvcmVBc3NldERCRnJvbUNhY2hlJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5pbXBvcnQucmVzdG9yZUFzc2V0REJGcm9tQ2FjaGUudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdpbXBvcnQuY3JlYXRlVGVtcGxhdGVSb290Jzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IERFRkFVTFRfQ1JFQVRFX1RFTVBMQVRFX1JPT1QsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uaW1wb3J0LmNyZWF0ZVRlbXBsYXRlUm9vdC50aXRsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2ltcG9ydC51c2VyRGF0YVRlbXBsYXRlJzogb2JqZWN0U2NoZW1hKHVuZGVmaW5lZCwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLmltcG9ydC51c2VyRGF0YVRlbXBsYXRlLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5pbXBvcnQudXNlckRhdGFUZW1wbGF0ZS5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IHRydWUsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICdpbXBvcnQuZmJ4Lm1hdGVyaWFsLnNtYXJ0Jzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5pbXBvcnQuZmJ4Lm1hdGVyaWFsLnNtYXJ0LnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIDEwKSxcbiAgICBdO1xufVxuIl19