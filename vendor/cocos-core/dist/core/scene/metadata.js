"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSceneMetadataNodes = createSceneMetadataNodes;
const metadata_1 = require("../configuration/script/metadata");
function createSceneMetadataNodes(defaultConfig) {
    return [
        (0, metadata_1.createNode)('scene.tick', 'i18n:configuration.scene.tick.title', 'scene', {
            'scene.tick': {
                type: 'boolean',
                default: defaultConfig.tick,
                title: 'i18n:configuration.scene.tick.title',
                description: 'i18n:configuration.scene.tick.description',
            },
        }, 30),
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9tZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBLDREQVdDO0FBZEQsK0RBQThEO0FBRzlELFNBQWdCLHdCQUF3QixDQUFDLGFBQTJCO0lBQ2hFLE9BQU87UUFDSCxJQUFBLHFCQUFVLEVBQUMsWUFBWSxFQUFFLHFDQUFxQyxFQUFFLE9BQU8sRUFBRTtZQUNyRSxZQUFZLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJO2dCQUMzQixLQUFLLEVBQUUscUNBQXFDO2dCQUM1QyxXQUFXLEVBQUUsMkNBQTJDO2FBQzNEO1NBQ0osRUFBRSxFQUFFLENBQUM7S0FDVCxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSUNvY29zQ29uZmlndXJhdGlvbk5vZGUgfSBmcm9tICcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9tZXRhZGF0YSc7XG5pbXBvcnQgeyBjcmVhdGVOb2RlIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbi9zY3JpcHQvbWV0YWRhdGEnO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVDb25maWcgfSBmcm9tICcuL3NjZW5lLWNvbmZpZ3MnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2NlbmVNZXRhZGF0YU5vZGVzKGRlZmF1bHRDb25maWc6IElTY2VuZUNvbmZpZyk6IElDb2Nvc0NvbmZpZ3VyYXRpb25Ob2RlW10ge1xuICAgIHJldHVybiBbXG4gICAgICAgIGNyZWF0ZU5vZGUoJ3NjZW5lLnRpY2snLCAnaTE4bjpjb25maWd1cmF0aW9uLnNjZW5lLnRpY2sudGl0bGUnLCAnc2NlbmUnLCB7XG4gICAgICAgICAgICAnc2NlbmUudGljayc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdENvbmZpZy50aWNrLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjZW5lLnRpY2sudGl0bGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpjb25maWd1cmF0aW9uLnNjZW5lLnRpY2suZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgMzApLFxuICAgIF07XG59XG4iXX0=