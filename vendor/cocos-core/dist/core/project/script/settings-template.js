"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProjectSettings = exports.defaultEngineSettings = void 0;
exports.createDefaultEngineSettings = createDefaultEngineSettings;
const global_1 = require("../../../global");
const module_config_defaults_1 = require("../../engine/module-config-defaults");
function createDefaultEngineSettings(engineRoot = global_1.GlobalPaths.enginePath) {
    return {
        '__version__': '1.0.12',
        'modules': (0, module_config_defaults_1.createDefaultEngineModuleSettings)(engineRoot),
    };
}
exports.defaultEngineSettings = createDefaultEngineSettings();
exports.defaultProjectSettings = {
    '__version__': '1.0.6',
    'general': {
        'designResolution': {
            'width': 960,
            'height': 640
        }
    },
    'script': {
        'preserveSymlinks': true
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtdGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9wcm9qZWN0L3NjcmlwdC9zZXR0aW5ncy10ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxrRUFLQztBQVJELDRDQUE4QztBQUM5QyxnRkFBd0Y7QUFFeEYsU0FBZ0IsMkJBQTJCLENBQUMsYUFBcUIsb0JBQVcsQ0FBQyxVQUFVO0lBQ25GLE9BQU87UUFDSCxhQUFhLEVBQUUsUUFBUTtRQUN2QixTQUFTLEVBQUUsSUFBQSwwREFBaUMsRUFBQyxVQUFVLENBQUM7S0FDM0QsQ0FBQztBQUNOLENBQUM7QUFFWSxRQUFBLHFCQUFxQixHQUFHLDJCQUEyQixFQUFFLENBQUM7QUFFdEQsUUFBQSxzQkFBc0IsR0FBRztJQUNsQyxhQUFhLEVBQUUsT0FBTztJQUN0QixTQUFTLEVBQUU7UUFDUCxrQkFBa0IsRUFBRTtZQUNoQixPQUFPLEVBQUUsR0FBRztZQUNaLFFBQVEsRUFBRSxHQUFHO1NBQ2hCO0tBQ0o7SUFDRCxRQUFRLEVBQUU7UUFDTixrQkFBa0IsRUFBRSxJQUFJO0tBQzNCO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdsb2JhbFBhdGhzIH0gZnJvbSAnLi4vLi4vLi4vZ2xvYmFsJztcbmltcG9ydCB7IGNyZWF0ZURlZmF1bHRFbmdpbmVNb2R1bGVTZXR0aW5ncyB9IGZyb20gJy4uLy4uL2VuZ2luZS9tb2R1bGUtY29uZmlnLWRlZmF1bHRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURlZmF1bHRFbmdpbmVTZXR0aW5ncyhlbmdpbmVSb290OiBzdHJpbmcgPSBHbG9iYWxQYXRocy5lbmdpbmVQYXRoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgJ19fdmVyc2lvbl9fJzogJzEuMC4xMicsXG4gICAgICAgICdtb2R1bGVzJzogY3JlYXRlRGVmYXVsdEVuZ2luZU1vZHVsZVNldHRpbmdzKGVuZ2luZVJvb3QpLFxuICAgIH07XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0RW5naW5lU2V0dGluZ3MgPSBjcmVhdGVEZWZhdWx0RW5naW5lU2V0dGluZ3MoKTtcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRQcm9qZWN0U2V0dGluZ3MgPSB7XG4gICAgJ19fdmVyc2lvbl9fJzogJzEuMC42JyxcbiAgICAnZ2VuZXJhbCc6IHtcbiAgICAgICAgJ2Rlc2lnblJlc29sdXRpb24nOiB7XG4gICAgICAgICAgICAnd2lkdGgnOiA5NjAsXG4gICAgICAgICAgICAnaGVpZ2h0JzogNjQwXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdzY3JpcHQnOiB7XG4gICAgICAgICdwcmVzZXJ2ZVN5bWxpbmtzJzogdHJ1ZVxuICAgIH1cbn07XG4iXX0=