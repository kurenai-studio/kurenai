'use strict';
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
exports.MissingReporter = exports.PrefabUtils = exports.GeometryUtils = exports.Component = exports.Node = exports.Script = exports.UuidUtils = exports.walkProperties = exports.deserializeFull = exports.serializeCompiled = exports.serialize = void 0;
exports.init = init;
exports.emit = emit;
exports.on = on;
exports.removeListener = removeListener;
// MissingReporter
const missing_class_reporter_1 = require("./missing-reporter/missing-class-reporter");
const missing_object_reporter_1 = require("./missing-reporter/missing-object-reporter");
var object_walker_1 = require("./missing-reporter/object-walker");
Object.defineProperty(exports, "walkProperties", { enumerable: true, get: function () { return object_walker_1.walkProperties; } });
const utils_1 = __importDefault(require("../../base/utils"));
const events_1 = __importDefault(require("events"));
if (!events_1.default.prototype.off) {
    events_1.default.prototype.off = events_1.default.prototype.removeListener;
}
const script_1 = __importDefault(require("./manager/script"));
const node_1 = __importDefault(require("./manager/node"));
const component_1 = __importDefault(require("./manager/component"));
exports.UuidUtils = utils_1.default.UUID;
exports.Script = new script_1.default();
exports.Node = new node_1.default();
exports.Component = new component_1.default();
exports.MissingReporter = {
    classInstance: missing_class_reporter_1.MissingClass,
    class: missing_class_reporter_1.MissingClassReporter,
    object: missing_object_reporter_1.MissingObjectReporter,
};
async function init() {
    const serializeUtils = await Promise.resolve().then(() => __importStar(require('./utils/serialize')));
    exports.serialize = serializeUtils.serialize;
    exports.serializeCompiled = serializeUtils.serializeCompiled;
    exports.deserializeFull = await Promise.resolve().then(() => __importStar(require('./utils/deserialize')));
    exports.GeometryUtils = await Promise.resolve().then(() => __importStar(require('./utils/geometry')));
    exports.PrefabUtils = await Promise.resolve().then(() => __importStar(require('./utils/prefab')));
    exports.Script.allow = true;
    exports.Node.allow = true;
    exports.Component.allow = true;
}
const event = new events_1.default();
function emit(name, ...args) {
    event.emit(name, ...args);
}
function on(name, handle) {
    event.on(name, handle);
}
function removeListener(name, handle) {
    event.removeListener(name, handle);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQ2Isb0JBV0M7QUFJRCxvQkFFQztBQUVELGdCQUVDO0FBRUQsd0NBRUM7QUF0REQsa0JBQWtCO0FBQ2xCLHNGQUErRjtBQUMvRix3RkFBbUY7QUFDbkYsa0VBQWtFO0FBQXpELCtHQUFBLGNBQWMsT0FBQTtBQUV2Qiw2REFBcUM7QUFDckMsb0RBQWtDO0FBQ2xDLElBQUksQ0FBQyxnQkFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM5QixnQkFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsZ0JBQVksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0FBQ3ZFLENBQUM7QUFDRCw4REFBNkM7QUFDN0MsMERBQXlDO0FBQ3pDLG9FQUFtRDtBQUV0QyxRQUFBLFNBQVMsR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDO0FBRXZCLFFBQUEsTUFBTSxHQUFHLElBQUksZ0JBQWEsRUFBRSxDQUFDO0FBQzdCLFFBQUEsSUFBSSxHQUFHLElBQUksY0FBVyxFQUFFLENBQUM7QUFDekIsUUFBQSxTQUFTLEdBQUcsSUFBSSxtQkFBZ0IsRUFBRSxDQUFDO0FBS25DLFFBQUEsZUFBZSxHQUFHO0lBQzNCLGFBQWEsRUFBRSxxQ0FBWTtJQUMzQixLQUFLLEVBQUUsNkNBQW9CO0lBQzNCLE1BQU0sRUFBRSwrQ0FBcUI7Q0FDaEMsQ0FBQztBQUVLLEtBQUssVUFBVSxJQUFJO0lBQ3RCLE1BQU0sY0FBYyxHQUFHLHdEQUFhLG1CQUFtQixHQUFDLENBQUM7SUFDekQsaUJBQVMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBQ3JDLHlCQUFpQixHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQztJQUNyRCx1QkFBZSxHQUFHLHdEQUFhLHFCQUFxQixHQUFDLENBQUM7SUFDdEQscUJBQWEsR0FBRyx3REFBYSxrQkFBa0IsR0FBQyxDQUFDO0lBQ2pELG1CQUFXLEdBQUcsd0RBQWEsZ0JBQWdCLEdBQUMsQ0FBQztJQUU3QyxjQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNsQixpQkFBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDM0IsQ0FBQztBQUVELE1BQU0sS0FBSyxHQUFHLElBQUksZ0JBQVksRUFBRSxDQUFDO0FBRWpDLFNBQWdCLElBQUksQ0FBQyxJQUFxQixFQUFFLEdBQUcsSUFBYztJQUN6RCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFFRCxTQUFnQixFQUFFLENBQUMsSUFBcUIsRUFBRSxNQUFnQztJQUN0RSxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQXFCLEVBQUUsTUFBZ0M7SUFDbEYsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGxldCBzZXJpYWxpemU6IGFueTtcbmV4cG9ydCBsZXQgc2VyaWFsaXplQ29tcGlsZWQ6IGFueTtcbmV4cG9ydCBsZXQgZGVzZXJpYWxpemVGdWxsOiBhbnk7XG5cbi8vIE1pc3NpbmdSZXBvcnRlclxuaW1wb3J0IHsgTWlzc2luZ0NsYXNzUmVwb3J0ZXIsIE1pc3NpbmdDbGFzcyB9IGZyb20gJy4vbWlzc2luZy1yZXBvcnRlci9taXNzaW5nLWNsYXNzLXJlcG9ydGVyJztcbmltcG9ydCB7IE1pc3NpbmdPYmplY3RSZXBvcnRlciB9IGZyb20gJy4vbWlzc2luZy1yZXBvcnRlci9taXNzaW5nLW9iamVjdC1yZXBvcnRlcic7XG5leHBvcnQgeyB3YWxrUHJvcGVydGllcyB9IGZyb20gJy4vbWlzc2luZy1yZXBvcnRlci9vYmplY3Qtd2Fsa2VyJztcblxuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaWYgKCFFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZikge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbn1cbmltcG9ydCBTY3JpcHRNYW5hZ2VyIGZyb20gJy4vbWFuYWdlci9zY3JpcHQnO1xuaW1wb3J0IE5vZGVNYW5hZ2VyIGZyb20gJy4vbWFuYWdlci9ub2RlJztcbmltcG9ydCBDb21wb25lbnRNYW5hZ2VyIGZyb20gJy4vbWFuYWdlci9jb21wb25lbnQnO1xuXG5leHBvcnQgY29uc3QgVXVpZFV0aWxzID0gdXRpbHMuVVVJRDtcblxuZXhwb3J0IGNvbnN0IFNjcmlwdCA9IG5ldyBTY3JpcHRNYW5hZ2VyKCk7XG5leHBvcnQgY29uc3QgTm9kZSA9IG5ldyBOb2RlTWFuYWdlcigpO1xuZXhwb3J0IGNvbnN0IENvbXBvbmVudCA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKCk7XG5cbmV4cG9ydCBsZXQgR2VvbWV0cnlVdGlsczogYW55O1xuZXhwb3J0IGxldCBQcmVmYWJVdGlsczogYW55O1xuXG5leHBvcnQgY29uc3QgTWlzc2luZ1JlcG9ydGVyID0ge1xuICAgIGNsYXNzSW5zdGFuY2U6IE1pc3NpbmdDbGFzcyxcbiAgICBjbGFzczogTWlzc2luZ0NsYXNzUmVwb3J0ZXIsXG4gICAgb2JqZWN0OiBNaXNzaW5nT2JqZWN0UmVwb3J0ZXIsXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjb25zdCBzZXJpYWxpemVVdGlscyA9IGF3YWl0IGltcG9ydCgnLi91dGlscy9zZXJpYWxpemUnKTtcbiAgICBzZXJpYWxpemUgPSBzZXJpYWxpemVVdGlscy5zZXJpYWxpemU7XG4gICAgc2VyaWFsaXplQ29tcGlsZWQgPSBzZXJpYWxpemVVdGlscy5zZXJpYWxpemVDb21waWxlZDtcbiAgICBkZXNlcmlhbGl6ZUZ1bGwgPSBhd2FpdCBpbXBvcnQoJy4vdXRpbHMvZGVzZXJpYWxpemUnKTtcbiAgICBHZW9tZXRyeVV0aWxzID0gYXdhaXQgaW1wb3J0KCcuL3V0aWxzL2dlb21ldHJ5Jyk7XG4gICAgUHJlZmFiVXRpbHMgPSBhd2FpdCBpbXBvcnQoJy4vdXRpbHMvcHJlZmFiJyk7XG5cbiAgICBTY3JpcHQuYWxsb3cgPSB0cnVlO1xuICAgIE5vZGUuYWxsb3cgPSB0cnVlO1xuICAgIENvbXBvbmVudC5hbGxvdyA9IHRydWU7XG59XG5cbmNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChuYW1lOiBzdHJpbmcgfCBzeW1ib2wsIC4uLmFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgZXZlbnQuZW1pdChuYW1lLCAuLi5hcmdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uKG5hbWU6IHN0cmluZyB8IHN5bWJvbCwgaGFuZGxlOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpIHtcbiAgICBldmVudC5vbihuYW1lLCBoYW5kbGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIobmFtZTogc3RyaW5nIHwgc3ltYm9sLCBoYW5kbGU6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCkge1xuICAgIGV2ZW50LnJlbW92ZUxpc3RlbmVyKG5hbWUsIGhhbmRsZSk7XG59XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgICBleHBvcnQgY29uc3QgRWRpdG9yRXh0ZW5kczogdHlwZW9mIGltcG9ydCgnLicpO1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgY2NlIHtcbiAgICAgICAgZXhwb3J0IG5hbWVzcGFjZSBVdGlscyB7XG4gICAgICAgICAgICBleHBvcnQgY29uc3Qgc2VyaWFsaXplOiB0eXBlb2YgaW1wb3J0KCcuL3V0aWxzL3NlcmlhbGl6ZS9pbmRleCcpWydzZXJpYWxpemUnXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==