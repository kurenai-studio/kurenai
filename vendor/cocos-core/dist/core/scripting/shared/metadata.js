"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScriptMetadataNodes = createScriptMetadataNodes;
const metadata_1 = require("../../configuration/script/metadata");
function createScriptMetadataNodes() {
    return [
        (0, metadata_1.createNode)('script', 'i18n:configuration.script.title', 'script', {
            'script.useDefineForClassFields': {
                type: 'boolean',
                default: true,
                title: 'i18n:configuration.script.useDefineForClassFields.title',
            },
            'script.allowDeclareFields': {
                type: 'boolean',
                default: true,
                title: 'i18n:configuration.script.allowDeclareFields.title',
            },
            'script.loose': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.loose.title',
            },
            'script.guessCommonJsExports': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.guessCommonJsExports.title',
                description: 'i18n:configuration.script.guessCommonJsExports.description',
            },
            'script.exportsConditions': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.script.exportsConditions.title',
            },
            'script.sortingPlugin': {
                type: 'array',
                default: [],
                title: 'i18n:configuration.script.sortingPlugin.title',
                description: 'i18n:configuration.script.sortingPlugin.description',
                items: {
                    type: 'string',
                    title: 'i18n:configuration.script.sortingPlugin.itemTitle',
                    ui: 'asset-picker',
                    assetType: 'cc.Script',
                    valueField: 'uuid',
                    displayFields: ['url', 'name'],
                    query: {
                        userData: {
                            isPlugin: true,
                        },
                    },
                },
            },
            'script.preserveSymlinks': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.preserveSymlinks.title',
            },
            'script.importMap': {
                type: 'string',
                default: '',
                title: 'i18n:configuration.script.importMap.title',
            },
            'script.previewBrowserslistConfigFile': {
                type: 'string',
                default: '',
                title: 'i18n:configuration.script.previewBrowserslistConfigFile.title',
            },
            'script.updateAutoUpdateImportConfig': {
                type: 'boolean',
                default: false,
                title: 'i18n:configuration.script.updateAutoUpdateImportConfig.title',
            },
        }, 9),
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvc2hhcmVkL21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsOERBc0VDO0FBeEVELGtFQUFpRTtBQUVqRSxTQUFnQix5QkFBeUI7SUFDckMsT0FBTztRQUNILElBQUEscUJBQVUsRUFBQyxRQUFRLEVBQUUsaUNBQWlDLEVBQUUsUUFBUSxFQUFFO1lBQzlELGdDQUFnQyxFQUFFO2dCQUM5QixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLEVBQUUseURBQXlEO2FBQ25FO1lBQ0QsMkJBQTJCLEVBQUU7Z0JBQ3pCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLEtBQUssRUFBRSxvREFBb0Q7YUFDOUQ7WUFDRCxjQUFjLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLHVDQUF1QzthQUNqRDtZQUNELDZCQUE2QixFQUFFO2dCQUMzQixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsc0RBQXNEO2dCQUM3RCxXQUFXLEVBQUUsNERBQTREO2FBQzVFO1lBQ0QsMEJBQTBCLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxtREFBbUQ7YUFDN0Q7WUFDRCxzQkFBc0IsRUFBRTtnQkFDcEIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLCtDQUErQztnQkFDdEQsV0FBVyxFQUFFLHFEQUFxRDtnQkFDbEUsS0FBSyxFQUFFO29CQUNILElBQUksRUFBRSxRQUFRO29CQUNkLEtBQUssRUFBRSxtREFBbUQ7b0JBQzFELEVBQUUsRUFBRSxjQUFjO29CQUNsQixTQUFTLEVBQUUsV0FBVztvQkFDdEIsVUFBVSxFQUFFLE1BQU07b0JBQ2xCLGFBQWEsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUM7b0JBQzlCLEtBQUssRUFBRTt3QkFDSCxRQUFRLEVBQUU7NEJBQ04sUUFBUSxFQUFFLElBQUk7eUJBQ2pCO3FCQUNKO2lCQUNKO2FBQ0o7WUFDRCx5QkFBeUIsRUFBRTtnQkFDdkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLGtEQUFrRDthQUM1RDtZQUNELGtCQUFrQixFQUFFO2dCQUNoQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsMkNBQTJDO2FBQ3JEO1lBQ0Qsc0NBQXNDLEVBQUU7Z0JBQ3BDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSwrREFBK0Q7YUFDekU7WUFDRCxxQ0FBcUMsRUFBRTtnQkFDbkMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLDhEQUE4RDthQUN4RTtTQUNKLEVBQUUsQ0FBQyxDQUFDO0tBQ1IsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElDb2Nvc0NvbmZpZ3VyYXRpb25Ob2RlIH0gZnJvbSAnLi4vLi4vY29uZmlndXJhdGlvbi9zY3JpcHQvbWV0YWRhdGEnO1xuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gJy4uLy4uL2NvbmZpZ3VyYXRpb24vc2NyaXB0L21ldGFkYXRhJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjcmlwdE1ldGFkYXRhTm9kZXMoKTogSUNvY29zQ29uZmlndXJhdGlvbk5vZGVbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgY3JlYXRlTm9kZSgnc2NyaXB0JywgJ2kxOG46Y29uZmlndXJhdGlvbi5zY3JpcHQudGl0bGUnLCAnc2NyaXB0Jywge1xuICAgICAgICAgICAgJ3NjcmlwdC51c2VEZWZpbmVGb3JDbGFzc0ZpZWxkcyc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5zY3JpcHQudXNlRGVmaW5lRm9yQ2xhc3NGaWVsZHMudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQuYWxsb3dEZWNsYXJlRmllbGRzJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC5hbGxvd0RlY2xhcmVGaWVsZHMudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQubG9vc2UnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC5sb29zZS50aXRsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3NjcmlwdC5ndWVzc0NvbW1vbkpzRXhwb3J0cyc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uc2NyaXB0Lmd1ZXNzQ29tbW9uSnNFeHBvcnRzLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5zY3JpcHQuZ3Vlc3NDb21tb25Kc0V4cG9ydHMuZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQuZXhwb3J0c0NvbmRpdGlvbnMnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46Y29uZmlndXJhdGlvbi5zY3JpcHQuZXhwb3J0c0NvbmRpdGlvbnMudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQuc29ydGluZ1BsdWdpbic6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC5zb3J0aW5nUGx1Z2luLnRpdGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46Y29uZmlndXJhdGlvbi5zY3JpcHQuc29ydGluZ1BsdWdpbi5kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC5zb3J0aW5nUGx1Z2luLml0ZW1UaXRsZScsXG4gICAgICAgICAgICAgICAgICAgIHVpOiAnYXNzZXQtcGlja2VyJyxcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRUeXBlOiAnY2MuU2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVGaWVsZDogJ3V1aWQnLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5RmllbGRzOiBbJ3VybCcsICduYW1lJ10sXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzUGx1Z2luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQucHJlc2VydmVTeW1saW5rcyc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uc2NyaXB0LnByZXNlcnZlU3ltbGlua3MudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQuaW1wb3J0TWFwJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC5pbXBvcnRNYXAudGl0bGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdzY3JpcHQucHJldmlld0Jyb3dzZXJzbGlzdENvbmZpZ0ZpbGUnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmNvbmZpZ3VyYXRpb24uc2NyaXB0LnByZXZpZXdCcm93c2Vyc2xpc3RDb25maWdGaWxlLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnc2NyaXB0LnVwZGF0ZUF1dG9VcGRhdGVJbXBvcnRDb25maWcnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjcmlwdC51cGRhdGVBdXRvVXBkYXRlSW1wb3J0Q29uZmlnLnRpdGxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIDkpLFxuICAgIF07XG59XG4iXX0=