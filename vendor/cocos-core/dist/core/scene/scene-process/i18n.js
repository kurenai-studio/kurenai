'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLocalI18n = initLocalI18n;
exports.reloadLocalI18n = reloadLocalI18n;
const i18next_1 = __importDefault(require("i18next"));
const i18n_class_1 = require("../../base/i18n-class");
const rpc_1 = require("./rpc");
const i18n = new i18n_class_1.I18n(i18next_1.default.createInstance());
let _ready = false;
let _initPromise = null;
function flattenBundle(obj) {
    const out = {};
    const walk = (cur, prefix) => {
        for (const key of Object.keys(cur)) {
            const value = cur[key];
            const currentKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                walk(value, currentKey);
            }
            else {
                out[currentKey] = value;
            }
        }
    };
    walk(obj, '');
    return out;
}
function initLocalI18n() {
    if (_initPromise)
        return _initPromise;
    _initPromise = (async () => {
        try {
            const { lang, data } = await rpc_1.Rpc.getInstance().request('i18n', 'getBundle', []);
            if (!_ready) {
                await i18n.instance.init({
                    lng: lang,
                    fallbackLng: 'en',
                    resources: { [lang]: { translation: {} } },
                });
                _ready = true;
            }
            for (const [l, bundle] of Object.entries(data)) {
                i18n.instance.addResources(l, 'translation', flattenBundle(bundle));
            }
            await i18n.setLanguage(lang);
        }
        catch (e) {
            console.warn('[i18n] Failed to init local i18n bundle:', e);
        }
    })().finally(() => {
        _initPromise = null;
    });
    return _initPromise;
}
/**
 * Reload the local bundle from main process. Callers must invoke this after
 * main-process i18n state changes (setLanguage, dynamic patch registration).
 *
 * NOTE: main process cannot push invalidation in web mode (notify() requires
 * IPC), so reload must be triggered from the scene side after a known mutation.
 */
async function reloadLocalI18n() {
    if (_initPromise)
        await _initPromise;
    _initPromise = null;
    await initLocalI18n();
}
exports.default = i18n;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3MvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBMEJiLHNDQTJCQztBQVNELDBDQUlDO0FBakVELHNEQUE4QjtBQUM5QixzREFBNkM7QUFDN0MsK0JBQTRCO0FBRTVCLE1BQU0sSUFBSSxHQUFHLElBQUksaUJBQUksQ0FBQyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7QUFDaEQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ25CLElBQUksWUFBWSxHQUF5QixJQUFJLENBQUM7QUFFOUMsU0FBUyxhQUFhLENBQUMsR0FBd0I7SUFDM0MsTUFBTSxHQUFHLEdBQXdCLEVBQUUsQ0FBQztJQUNwQyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQXdCLEVBQUUsTUFBYyxFQUFFLEVBQUU7UUFDdEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNyRCxJQUFJLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDNUIsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLENBQUM7SUFDRixJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBZ0IsYUFBYTtJQUN6QixJQUFJLFlBQVk7UUFBRSxPQUFPLFlBQVksQ0FBQztJQUN0QyxZQUFZLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUN2QixJQUFJLENBQUM7WUFDRCxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FHN0UsQ0FBQztZQUNGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDVixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO29CQUNyQixHQUFHLEVBQUUsSUFBSTtvQkFDVCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRTtpQkFDN0MsQ0FBQyxDQUFDO2dCQUNILE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbEIsQ0FBQztZQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsMENBQTBDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztJQUNMLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNkLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLFlBQVksQ0FBQztBQUN4QixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLGVBQWU7SUFDakMsSUFBSSxZQUFZO1FBQUUsTUFBTSxZQUFZLENBQUM7SUFDckMsWUFBWSxHQUFHLElBQUksQ0FBQztJQUNwQixNQUFNLGFBQWEsRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5pbXBvcnQgaTE4bmV4dCBmcm9tICdpMThuZXh0JztcbmltcG9ydCB7IEkxOG4gfSBmcm9tICcuLi8uLi9iYXNlL2kxOG4tY2xhc3MnO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi9ycGMnO1xuXG5jb25zdCBpMThuID0gbmV3IEkxOG4oaTE4bmV4dC5jcmVhdGVJbnN0YW5jZSgpKTtcbmxldCBfcmVhZHkgPSBmYWxzZTtcbmxldCBfaW5pdFByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDtcblxuZnVuY3Rpb24gZmxhdHRlbkJ1bmRsZShvYmo6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBjb25zdCB3YWxrID0gKGN1cjogUmVjb3JkPHN0cmluZywgYW55PiwgcHJlZml4OiBzdHJpbmcpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY3VyKSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRLZXkgPSBwcmVmaXggPyBgJHtwcmVmaXh9LiR7a2V5fWAgOiBrZXk7XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB3YWxrKHZhbHVlLCBjdXJyZW50S2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0W2N1cnJlbnRLZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHdhbGsob2JqLCAnJyk7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMb2NhbEkxOG4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKF9pbml0UHJvbWlzZSkgcmV0dXJuIF9pbml0UHJvbWlzZTtcbiAgICBfaW5pdFByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBsYW5nLCBkYXRhIH0gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdpMThuJywgJ2dldEJ1bmRsZScsIFtdKSBhcyB7XG4gICAgICAgICAgICAgICAgbGFuZzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRhdGE6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghX3JlYWR5KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgaTE4bi5pbnN0YW5jZS5pbml0KHtcbiAgICAgICAgICAgICAgICAgICAgbG5nOiBsYW5nLFxuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja0xuZzogJ2VuJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiB7IFtsYW5nXTogeyB0cmFuc2xhdGlvbjoge30gfSB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9yZWFkeSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtsLCBidW5kbGVdIG9mIE9iamVjdC5lbnRyaWVzKGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgaTE4bi5pbnN0YW5jZS5hZGRSZXNvdXJjZXMobCwgJ3RyYW5zbGF0aW9uJywgZmxhdHRlbkJ1bmRsZShidW5kbGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGkxOG4uc2V0TGFuZ3VhZ2UobGFuZyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW2kxOG5dIEZhaWxlZCB0byBpbml0IGxvY2FsIGkxOG4gYnVuZGxlOicsIGUpO1xuICAgICAgICB9XG4gICAgfSkoKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgX2luaXRQcm9taXNlID0gbnVsbDtcbiAgICB9KTtcbiAgICByZXR1cm4gX2luaXRQcm9taXNlO1xufVxuXG4vKipcbiAqIFJlbG9hZCB0aGUgbG9jYWwgYnVuZGxlIGZyb20gbWFpbiBwcm9jZXNzLiBDYWxsZXJzIG11c3QgaW52b2tlIHRoaXMgYWZ0ZXJcbiAqIG1haW4tcHJvY2VzcyBpMThuIHN0YXRlIGNoYW5nZXMgKHNldExhbmd1YWdlLCBkeW5hbWljIHBhdGNoIHJlZ2lzdHJhdGlvbikuXG4gKlxuICogTk9URTogbWFpbiBwcm9jZXNzIGNhbm5vdCBwdXNoIGludmFsaWRhdGlvbiBpbiB3ZWIgbW9kZSAobm90aWZ5KCkgcmVxdWlyZXNcbiAqIElQQyksIHNvIHJlbG9hZCBtdXN0IGJlIHRyaWdnZXJlZCBmcm9tIHRoZSBzY2VuZSBzaWRlIGFmdGVyIGEga25vd24gbXV0YXRpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWxvYWRMb2NhbEkxOG4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKF9pbml0UHJvbWlzZSkgYXdhaXQgX2luaXRQcm9taXNlO1xuICAgIF9pbml0UHJvbWlzZSA9IG51bGw7XG4gICAgYXdhaXQgaW5pdExvY2FsSTE4bigpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpMThuO1xuIl19