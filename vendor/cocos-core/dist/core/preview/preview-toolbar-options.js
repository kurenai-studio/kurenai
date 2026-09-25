"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewToolbarOptions = getPreviewToolbarOptions;
exports.setPreviewToolbarOption = setPreviewToolbarOption;
exports.resetPreviewToolbarOptions = resetPreviewToolbarOptions;
const defaultOptions = {
    device: 'design',
    rotate: false,
    debugMode: 'WARN',
    showFps: true,
};
const deviceIds = new Set([
    'design',
    'webpage-fullscreen',
    'iphone-14-pro',
    'iphone-14-plus',
    'iphone-14',
    'iphone-x',
    'iphone-xr',
    'ipad-10-2',
    'ipad-air',
    'ipad-pro',
    'oppo-reno-2',
    'huawei-nova-5',
    'honor-x8',
    'huawei-nova-8i',
    'huawei-mate-40-pro',
    'huawei-mate-30-pro',
    'xiaomi-redmi-8',
    'sony-xperia-5',
    'oppo-a77',
    'nokia-c2',
    'asus-rog-phone-6',
    'lenovo-legion-2-pro',
]);
const debugModes = new Set([
    'NONE',
    'VERBOSE',
    'INFO',
    'WARN',
    'ERROR',
    'INFO_FOR_WEB_PAGE',
    'WARN_FOR_WEB_PAGE',
    'ERROR_FOR_WEB_PAGE',
]);
let options = { ...defaultOptions };
function getPreviewToolbarOptions() {
    return { ...options };
}
function setPreviewToolbarOption(name, value) {
    switch (name) {
        case 'device':
            if (typeof value === 'string' && deviceIds.has(value)) {
                options.device = value;
                return true;
            }
            return false;
        case 'rotate':
            if (typeof value === 'boolean') {
                options.rotate = value;
                return true;
            }
            return false;
        case 'debugMode':
            if (typeof value === 'string' && debugModes.has(value)) {
                options.debugMode = value;
                return true;
            }
            return false;
        case 'showFps':
            if (typeof value === 'boolean') {
                options.showFps = value;
                return true;
            }
            return false;
        default:
            return false;
    }
}
/** @internal Test-only reset for this process-scoped preview session state. */
function resetPreviewToolbarOptions() {
    options = { ...defaultOptions };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy10b29sYmFyLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L3ByZXZpZXctdG9vbGJhci1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBNkRBLDREQUVDO0FBRUQsMERBNkJDO0FBR0QsZ0VBRUM7QUFuRkQsTUFBTSxjQUFjLEdBQW9DO0lBQ3BELE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxLQUFLO0lBQ2IsU0FBUyxFQUFFLE1BQU07SUFDakIsT0FBTyxFQUFFLElBQUk7Q0FDaEIsQ0FBQztBQUVGLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3RCLFFBQVE7SUFDUixvQkFBb0I7SUFDcEIsZUFBZTtJQUNmLGdCQUFnQjtJQUNoQixXQUFXO0lBQ1gsVUFBVTtJQUNWLFdBQVc7SUFDWCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFVBQVU7SUFDVixhQUFhO0lBQ2IsZUFBZTtJQUNmLFVBQVU7SUFDVixnQkFBZ0I7SUFDaEIsb0JBQW9CO0lBQ3BCLG9CQUFvQjtJQUNwQixnQkFBZ0I7SUFDaEIsZUFBZTtJQUNmLFVBQVU7SUFDVixVQUFVO0lBQ1Ysa0JBQWtCO0lBQ2xCLHFCQUFxQjtDQUN4QixDQUFDLENBQUM7QUFFSCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUN2QixNQUFNO0lBQ04sU0FBUztJQUNULE1BQU07SUFDTixNQUFNO0lBQ04sT0FBTztJQUNQLG1CQUFtQjtJQUNuQixtQkFBbUI7SUFDbkIsb0JBQW9CO0NBQ3ZCLENBQUMsQ0FBQztBQUVILElBQUksT0FBTyxHQUEwQixFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7QUFFM0QsU0FBZ0Isd0JBQXdCO0lBQ3BDLE9BQU8sRUFBRSxHQUFHLE9BQU8sRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFhLEVBQUUsS0FBYztJQUNqRSxRQUFRLElBQUksRUFBRSxDQUFDO1FBQ2YsS0FBSyxRQUFRO1lBQ1QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDdkIsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLEtBQUssUUFBUTtZQUNULElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDakIsS0FBSyxXQUFXO1lBQ1osSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLEtBQUssU0FBUztZQUNWLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDakI7WUFDSSxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0FBQ0wsQ0FBQztBQUVELCtFQUErRTtBQUMvRSxTQUFnQiwwQkFBMEI7SUFDdEMsT0FBTyxHQUFHLEVBQUUsR0FBRyxjQUFjLEVBQUUsQ0FBQztBQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmtY/op4jlmajpooTop4jlt6XlhbfmoI/nmoTkvJror53nirbmgIHjgIJcbiAqXG4gKiBDcmVhdG9yIOmAmui/h+mihOiniOmhtSBzb2NrZXQg55qEIGBjaGFuZ2VPcHRpb25gIOS6i+S7tuS/neWtmOi/meS6m+mAiemhue+8jOW5tuWcqOWIt+aWsOWQjueahFxuICogSFRNTCDkuK3lho3mrKHms6jlhaXjgILov5nph4zkv53mjIHlkIzmoLfnmoTjgIxDTEkg6L+b56iL5YaF6aKE6KeI5Lya6K+d44CN6IyD5Zu077ya5LiN5YaZ5YWl5bel56iL6YWN572u77yMXG4gKiDkuI3lvbHlk43msqHmnInlkK/nlKggcHJldmlld1Rvb2xiYXIg55qE5pmu6YCa6aKE6KeI44CCXG4gKi9cbmV4cG9ydCB0eXBlIFByZXZpZXdUb29sYmFyT3B0aW9uTmFtZSA9ICdkZXZpY2UnIHwgJ3JvdGF0ZScgfCAnZGVidWdNb2RlJyB8ICdzaG93RnBzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3VG9vbGJhck9wdGlvbnMge1xuICAgIGRldmljZTogc3RyaW5nO1xuICAgIHJvdGF0ZTogYm9vbGVhbjtcbiAgICBkZWJ1Z01vZGU6IHN0cmluZztcbiAgICBzaG93RnBzOiBib29sZWFuO1xufVxuXG5jb25zdCBkZWZhdWx0T3B0aW9uczogUmVhZG9ubHk8UHJldmlld1Rvb2xiYXJPcHRpb25zPiA9IHtcbiAgICBkZXZpY2U6ICdkZXNpZ24nLFxuICAgIHJvdGF0ZTogZmFsc2UsXG4gICAgZGVidWdNb2RlOiAnV0FSTicsXG4gICAgc2hvd0ZwczogdHJ1ZSxcbn07XG5cbmNvbnN0IGRldmljZUlkcyA9IG5ldyBTZXQoW1xuICAgICdkZXNpZ24nLFxuICAgICd3ZWJwYWdlLWZ1bGxzY3JlZW4nLFxuICAgICdpcGhvbmUtMTQtcHJvJyxcbiAgICAnaXBob25lLTE0LXBsdXMnLFxuICAgICdpcGhvbmUtMTQnLFxuICAgICdpcGhvbmUteCcsXG4gICAgJ2lwaG9uZS14cicsXG4gICAgJ2lwYWQtMTAtMicsXG4gICAgJ2lwYWQtYWlyJyxcbiAgICAnaXBhZC1wcm8nLFxuICAgICdvcHBvLXJlbm8tMicsXG4gICAgJ2h1YXdlaS1ub3ZhLTUnLFxuICAgICdob25vci14OCcsXG4gICAgJ2h1YXdlaS1ub3ZhLThpJyxcbiAgICAnaHVhd2VpLW1hdGUtNDAtcHJvJyxcbiAgICAnaHVhd2VpLW1hdGUtMzAtcHJvJyxcbiAgICAneGlhb21pLXJlZG1pLTgnLFxuICAgICdzb255LXhwZXJpYS01JyxcbiAgICAnb3Bwby1hNzcnLFxuICAgICdub2tpYS1jMicsXG4gICAgJ2FzdXMtcm9nLXBob25lLTYnLFxuICAgICdsZW5vdm8tbGVnaW9uLTItcHJvJyxcbl0pO1xuXG5jb25zdCBkZWJ1Z01vZGVzID0gbmV3IFNldChbXG4gICAgJ05PTkUnLFxuICAgICdWRVJCT1NFJyxcbiAgICAnSU5GTycsXG4gICAgJ1dBUk4nLFxuICAgICdFUlJPUicsXG4gICAgJ0lORk9fRk9SX1dFQl9QQUdFJyxcbiAgICAnV0FSTl9GT1JfV0VCX1BBR0UnLFxuICAgICdFUlJPUl9GT1JfV0VCX1BBR0UnLFxuXSk7XG5cbmxldCBvcHRpb25zOiBQcmV2aWV3VG9vbGJhck9wdGlvbnMgPSB7IC4uLmRlZmF1bHRPcHRpb25zIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3VG9vbGJhck9wdGlvbnMoKTogUHJldmlld1Rvb2xiYXJPcHRpb25zIHtcbiAgICByZXR1cm4geyAuLi5vcHRpb25zIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aWV3VG9vbGJhck9wdGlvbihuYW1lOiB1bmtub3duLCB2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgJ2RldmljZSc6XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIGRldmljZUlkcy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRldmljZSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNhc2UgJ3JvdGF0ZSc6XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgb3B0aW9ucy5yb3RhdGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjYXNlICdkZWJ1Z01vZGUnOlxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiBkZWJ1Z01vZGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGVidWdNb2RlID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgY2FzZSAnc2hvd0Zwcyc6XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgb3B0aW9ucy5zaG93RnBzID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqIEBpbnRlcm5hbCBUZXN0LW9ubHkgcmVzZXQgZm9yIHRoaXMgcHJvY2Vzcy1zY29wZWQgcHJldmlldyBzZXNzaW9uIHN0YXRlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UHJldmlld1Rvb2xiYXJPcHRpb25zKCk6IHZvaWQge1xuICAgIG9wdGlvbnMgPSB7IC4uLmRlZmF1bHRPcHRpb25zIH07XG59XG4iXX0=