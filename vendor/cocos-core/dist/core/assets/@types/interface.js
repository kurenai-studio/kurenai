"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TangentImportSetting = exports.NormalImportSetting = exports.SUPPORT_CREATE_TYPES = exports.ASSET_HANDLER_TYPES = void 0;
// 记录一些会在运行时使用的类型常量，确保编译后可用
/** 所有资源处理器类型的常量数组（用于 Zod enum 和 TypeScript type） */
exports.ASSET_HANDLER_TYPES = [
    'directory',
    'unknown',
    'text',
    'json',
    'spine-data',
    'dragonbones',
    'dragonbones-atlas',
    'terrain',
    'javascript',
    'typescript',
    'scene',
    'prefab',
    'sprite-frame',
    'tiled-map',
    'buffer',
    'image',
    'sign-image',
    'alpha-image',
    'texture',
    'texture-cube',
    'erp-texture-cube',
    'render-texture',
    'texture-cube-face',
    'rt-sprite-frame',
    'gltf',
    'gltf-mesh',
    'gltf-animation',
    'gltf-skeleton',
    'gltf-material',
    'gltf-scene',
    'gltf-embeded-image',
    'fbx',
    'material',
    'physics-material',
    'effect',
    'effect-header',
    'audio-clip',
    'animation-clip',
    'animation-graph',
    'animation-graph-variant',
    'animation-mask',
    'ttf-font',
    'bitmap-font',
    'particle',
    'sprite-atlas',
    'auto-atlas',
    'label-atlas',
    'render-pipeline',
    'render-stage',
    'render-flow',
    'instantiation-material',
    'instantiation-mesh',
    'instantiation-skeleton',
    'instantiation-animation',
    'video-clip',
    '*',
    'database',
];
/** 支持创建的资源类型常量数组（用于 Zod enum 和 TypeScript type） */
exports.SUPPORT_CREATE_TYPES = [
    'animation-clip', // 动画剪辑
    'typescript', // TypeScript 脚本
    'auto-atlas', // 自动图集
    'effect', // 着色器效果
    'scene', // 场景
    'prefab', // 预制体
    'material', // 材质
    'texture-cube', // 立方体贴图
    'terrain', // 地形
    'physics-material', // 物理材质
    'label-atlas', // 标签图集
    'render-texture', // 渲染纹理
    // 'animation-graph',         // 动画图
    // 'animation-mask',          // 动画遮罩
    // 'animation-graph-variant', // 动画图变体
    'directory', // 文件夹
    'effect-header', // 着色器头文件（chunk）
];
var NormalImportSetting;
(function (NormalImportSetting) {
    /**
     * 如果模型文件中包含法线信息则导出法线，否则不导出法线。
     */
    NormalImportSetting[NormalImportSetting["optional"] = 0] = "optional";
    /**
     * 不在导出的网格中包含法线信息。
     */
    NormalImportSetting[NormalImportSetting["exclude"] = 1] = "exclude";
    /**
     * 如果模型文件中包含法线信息则导出法线，否则重新计算并导出法线。
     */
    NormalImportSetting[NormalImportSetting["require"] = 2] = "require";
    /**
     * 不管模型文件中是否包含法线信息，直接重新计算并导出法线。
     */
    NormalImportSetting[NormalImportSetting["recalculate"] = 3] = "recalculate";
})(NormalImportSetting || (exports.NormalImportSetting = NormalImportSetting = {}));
var TangentImportSetting;
(function (TangentImportSetting) {
    /**
     * 不在导出的网格中包含正切信息。
     */
    TangentImportSetting[TangentImportSetting["exclude"] = 0] = "exclude";
    /**
     * 如果模型文件中包含正切信息则导出正切，否则不导出正切。
     */
    TangentImportSetting[TangentImportSetting["optional"] = 1] = "optional";
    /**
     * 如果模型文件中包含正切信息则导出正切，否则若纹理坐标存在则重新计算并导出正切。
     */
    TangentImportSetting[TangentImportSetting["require"] = 2] = "require";
    /**
     * 不管模型文件中是否包含正切信息，直接重新计算并导出正切。
     */
    TangentImportSetting[TangentImportSetting["recalculate"] = 3] = "recalculate";
})(TangentImportSetting || (exports.TangentImportSetting = TangentImportSetting = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL0B0eXBlcy9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkJBQTJCO0FBQzNCLG9EQUFvRDtBQUN2QyxRQUFBLG1CQUFtQixHQUFHO0lBQy9CLFdBQVc7SUFDWCxTQUFTO0lBQ1QsTUFBTTtJQUNOLE1BQU07SUFDTixZQUFZO0lBQ1osYUFBYTtJQUNiLG1CQUFtQjtJQUNuQixTQUFTO0lBQ1QsWUFBWTtJQUNaLFlBQVk7SUFDWixPQUFPO0lBQ1AsUUFBUTtJQUNSLGNBQWM7SUFDZCxXQUFXO0lBQ1gsUUFBUTtJQUNSLE9BQU87SUFDUCxZQUFZO0lBQ1osYUFBYTtJQUNiLFNBQVM7SUFDVCxjQUFjO0lBQ2Qsa0JBQWtCO0lBQ2xCLGdCQUFnQjtJQUNoQixtQkFBbUI7SUFDbkIsaUJBQWlCO0lBQ2pCLE1BQU07SUFDTixXQUFXO0lBQ1gsZ0JBQWdCO0lBQ2hCLGVBQWU7SUFDZixlQUFlO0lBQ2YsWUFBWTtJQUNaLG9CQUFvQjtJQUNwQixLQUFLO0lBQ0wsVUFBVTtJQUNWLGtCQUFrQjtJQUNsQixRQUFRO0lBQ1IsZUFBZTtJQUNmLFlBQVk7SUFDWixnQkFBZ0I7SUFDaEIsaUJBQWlCO0lBQ2pCLHlCQUF5QjtJQUN6QixnQkFBZ0I7SUFDaEIsVUFBVTtJQUNWLGFBQWE7SUFDYixVQUFVO0lBQ1YsY0FBYztJQUNkLFlBQVk7SUFDWixhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGNBQWM7SUFDZCxhQUFhO0lBQ2Isd0JBQXdCO0lBQ3hCLG9CQUFvQjtJQUNwQix3QkFBd0I7SUFDeEIseUJBQXlCO0lBQ3pCLFlBQVk7SUFDWixHQUFHO0lBQ0gsVUFBVTtDQUNKLENBQUM7QUFFWCxtREFBbUQ7QUFDdEMsUUFBQSxvQkFBb0IsR0FBRztJQUNoQyxnQkFBZ0IsRUFBVyxPQUFPO0lBQ2xDLFlBQVksRUFBZSxnQkFBZ0I7SUFDM0MsWUFBWSxFQUFlLE9BQU87SUFDbEMsUUFBUSxFQUFtQixRQUFRO0lBQ25DLE9BQU8sRUFBb0IsS0FBSztJQUNoQyxRQUFRLEVBQW1CLE1BQU07SUFDakMsVUFBVSxFQUFpQixLQUFLO0lBQ2hDLGNBQWMsRUFBYSxRQUFRO0lBQ25DLFNBQVMsRUFBa0IsS0FBSztJQUNoQyxrQkFBa0IsRUFBUyxPQUFPO0lBQ2xDLGFBQWEsRUFBYyxPQUFPO0lBQ2xDLGdCQUFnQixFQUFXLE9BQU87SUFDbEMsb0NBQW9DO0lBQ3BDLHFDQUFxQztJQUNyQyxzQ0FBc0M7SUFDdEMsV0FBVyxFQUFnQixNQUFNO0lBQ2pDLGVBQWUsRUFBWSxnQkFBZ0I7Q0FDckMsQ0FBQztBQUVYLElBQVksbUJBb0JYO0FBcEJELFdBQVksbUJBQW1CO0lBQzNCOztPQUVHO0lBQ0gscUVBQVEsQ0FBQTtJQUVSOztPQUVHO0lBQ0gsbUVBQU8sQ0FBQTtJQUVQOztPQUVHO0lBQ0gsbUVBQU8sQ0FBQTtJQUVQOztPQUVHO0lBQ0gsMkVBQVcsQ0FBQTtBQUNmLENBQUMsRUFwQlcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFvQjlCO0FBRUQsSUFBWSxvQkFvQlg7QUFwQkQsV0FBWSxvQkFBb0I7SUFDNUI7O09BRUc7SUFDSCxxRUFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCx1RUFBUSxDQUFBO0lBRVI7O09BRUc7SUFDSCxxRUFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCw2RUFBVyxDQUFBO0FBQ2YsQ0FBQyxFQXBCVyxvQkFBb0Isb0NBQXBCLG9CQUFvQixRQW9CL0IiLCJzb3VyY2VzQ29udGVudCI6WyIvLyDorrDlvZXkuIDkupvkvJrlnKjov5DooYzml7bkvb/nlKjnmoTnsbvlnovluLjph4/vvIznoa7kv53nvJbor5HlkI7lj6/nlKhcbi8qKiDmiYDmnInotYTmupDlpITnkIblmajnsbvlnovnmoTluLjph4/mlbDnu4TvvIjnlKjkuo4gWm9kIGVudW0g5ZKMIFR5cGVTY3JpcHQgdHlwZe+8iSAqL1xuZXhwb3J0IGNvbnN0IEFTU0VUX0hBTkRMRVJfVFlQRVMgPSBbXG4gICAgJ2RpcmVjdG9yeScsXG4gICAgJ3Vua25vd24nLFxuICAgICd0ZXh0JyxcbiAgICAnanNvbicsXG4gICAgJ3NwaW5lLWRhdGEnLFxuICAgICdkcmFnb25ib25lcycsXG4gICAgJ2RyYWdvbmJvbmVzLWF0bGFzJyxcbiAgICAndGVycmFpbicsXG4gICAgJ2phdmFzY3JpcHQnLFxuICAgICd0eXBlc2NyaXB0JyxcbiAgICAnc2NlbmUnLFxuICAgICdwcmVmYWInLFxuICAgICdzcHJpdGUtZnJhbWUnLFxuICAgICd0aWxlZC1tYXAnLFxuICAgICdidWZmZXInLFxuICAgICdpbWFnZScsXG4gICAgJ3NpZ24taW1hZ2UnLFxuICAgICdhbHBoYS1pbWFnZScsXG4gICAgJ3RleHR1cmUnLFxuICAgICd0ZXh0dXJlLWN1YmUnLFxuICAgICdlcnAtdGV4dHVyZS1jdWJlJyxcbiAgICAncmVuZGVyLXRleHR1cmUnLFxuICAgICd0ZXh0dXJlLWN1YmUtZmFjZScsXG4gICAgJ3J0LXNwcml0ZS1mcmFtZScsXG4gICAgJ2dsdGYnLFxuICAgICdnbHRmLW1lc2gnLFxuICAgICdnbHRmLWFuaW1hdGlvbicsXG4gICAgJ2dsdGYtc2tlbGV0b24nLFxuICAgICdnbHRmLW1hdGVyaWFsJyxcbiAgICAnZ2x0Zi1zY2VuZScsXG4gICAgJ2dsdGYtZW1iZWRlZC1pbWFnZScsXG4gICAgJ2ZieCcsXG4gICAgJ21hdGVyaWFsJyxcbiAgICAncGh5c2ljcy1tYXRlcmlhbCcsXG4gICAgJ2VmZmVjdCcsXG4gICAgJ2VmZmVjdC1oZWFkZXInLFxuICAgICdhdWRpby1jbGlwJyxcbiAgICAnYW5pbWF0aW9uLWNsaXAnLFxuICAgICdhbmltYXRpb24tZ3JhcGgnLFxuICAgICdhbmltYXRpb24tZ3JhcGgtdmFyaWFudCcsXG4gICAgJ2FuaW1hdGlvbi1tYXNrJyxcbiAgICAndHRmLWZvbnQnLFxuICAgICdiaXRtYXAtZm9udCcsXG4gICAgJ3BhcnRpY2xlJyxcbiAgICAnc3ByaXRlLWF0bGFzJyxcbiAgICAnYXV0by1hdGxhcycsXG4gICAgJ2xhYmVsLWF0bGFzJyxcbiAgICAncmVuZGVyLXBpcGVsaW5lJyxcbiAgICAncmVuZGVyLXN0YWdlJyxcbiAgICAncmVuZGVyLWZsb3cnLFxuICAgICdpbnN0YW50aWF0aW9uLW1hdGVyaWFsJyxcbiAgICAnaW5zdGFudGlhdGlvbi1tZXNoJyxcbiAgICAnaW5zdGFudGlhdGlvbi1za2VsZXRvbicsXG4gICAgJ2luc3RhbnRpYXRpb24tYW5pbWF0aW9uJyxcbiAgICAndmlkZW8tY2xpcCcsXG4gICAgJyonLFxuICAgICdkYXRhYmFzZScsXG5dIGFzIGNvbnN0O1xuXG4vKiog5pSv5oyB5Yib5bu655qE6LWE5rqQ57G75Z6L5bi46YeP5pWw57uE77yI55So5LqOIFpvZCBlbnVtIOWSjCBUeXBlU2NyaXB0IHR5cGXvvIkgKi9cbmV4cG9ydCBjb25zdCBTVVBQT1JUX0NSRUFURV9UWVBFUyA9IFtcbiAgICAnYW5pbWF0aW9uLWNsaXAnLCAgICAgICAgICAvLyDliqjnlLvliarovpFcbiAgICAndHlwZXNjcmlwdCcsICAgICAgICAgICAgICAvLyBUeXBlU2NyaXB0IOiEmuacrFxuICAgICdhdXRvLWF0bGFzJywgICAgICAgICAgICAgIC8vIOiHquWKqOWbvumbhlxuICAgICdlZmZlY3QnLCAgICAgICAgICAgICAgICAgIC8vIOedgOiJsuWZqOaViOaenFxuICAgICdzY2VuZScsICAgICAgICAgICAgICAgICAgIC8vIOWcuuaZr1xuICAgICdwcmVmYWInLCAgICAgICAgICAgICAgICAgIC8vIOmihOWItuS9k1xuICAgICdtYXRlcmlhbCcsICAgICAgICAgICAgICAgIC8vIOadkOi0qFxuICAgICd0ZXh0dXJlLWN1YmUnLCAgICAgICAgICAgIC8vIOeri+aWueS9k+i0tOWbvlxuICAgICd0ZXJyYWluJywgICAgICAgICAgICAgICAgIC8vIOWcsOW9olxuICAgICdwaHlzaWNzLW1hdGVyaWFsJywgICAgICAgIC8vIOeJqeeQhuadkOi0qFxuICAgICdsYWJlbC1hdGxhcycsICAgICAgICAgICAgIC8vIOagh+etvuWbvumbhlxuICAgICdyZW5kZXItdGV4dHVyZScsICAgICAgICAgIC8vIOa4suafk+e6ueeQhlxuICAgIC8vICdhbmltYXRpb24tZ3JhcGgnLCAgICAgICAgIC8vIOWKqOeUu+WbvlxuICAgIC8vICdhbmltYXRpb24tbWFzaycsICAgICAgICAgIC8vIOWKqOeUu+mBrue9qVxuICAgIC8vICdhbmltYXRpb24tZ3JhcGgtdmFyaWFudCcsIC8vIOWKqOeUu+WbvuWPmOS9k1xuICAgICdkaXJlY3RvcnknLCAgICAgICAgICAgICAgIC8vIOaWh+S7tuWkuVxuICAgICdlZmZlY3QtaGVhZGVyJywgICAgICAgICAgIC8vIOedgOiJsuWZqOWktOaWh+S7tu+8iGNodW5r77yJXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZW51bSBOb3JtYWxJbXBvcnRTZXR0aW5nIHtcbiAgICAvKipcbiAgICAgKiDlpoLmnpzmqKHlnovmlofku7bkuK3ljIXlkKvms5Xnur/kv6Hmga/liJnlr7zlh7rms5Xnur/vvIzlkKbliJnkuI3lr7zlh7rms5Xnur/jgIJcbiAgICAgKi9cbiAgICBvcHRpb25hbCxcblxuICAgIC8qKlxuICAgICAqIOS4jeWcqOWvvOWHuueahOe9keagvOS4reWMheWQq+azlee6v+S/oeaBr+OAglxuICAgICAqL1xuICAgIGV4Y2x1ZGUsXG5cbiAgICAvKipcbiAgICAgKiDlpoLmnpzmqKHlnovmlofku7bkuK3ljIXlkKvms5Xnur/kv6Hmga/liJnlr7zlh7rms5Xnur/vvIzlkKbliJnph43mlrDorqHnrpflubblr7zlh7rms5Xnur/jgIJcbiAgICAgKi9cbiAgICByZXF1aXJlLFxuXG4gICAgLyoqXG4gICAgICog5LiN566h5qih5Z6L5paH5Lu25Lit5piv5ZCm5YyF5ZCr5rOV57q/5L+h5oGv77yM55u05o6l6YeN5paw6K6h566X5bm25a+85Ye65rOV57q/44CCXG4gICAgICovXG4gICAgcmVjYWxjdWxhdGUsXG59XG5cbmV4cG9ydCBlbnVtIFRhbmdlbnRJbXBvcnRTZXR0aW5nIHtcbiAgICAvKipcbiAgICAgKiDkuI3lnKjlr7zlh7rnmoTnvZHmoLzkuK3ljIXlkKvmraPliIfkv6Hmga/jgIJcbiAgICAgKi9cbiAgICBleGNsdWRlLFxuXG4gICAgLyoqXG4gICAgICog5aaC5p6c5qih5Z6L5paH5Lu25Lit5YyF5ZCr5q2j5YiH5L+h5oGv5YiZ5a+85Ye65q2j5YiH77yM5ZCm5YiZ5LiN5a+85Ye65q2j5YiH44CCXG4gICAgICovXG4gICAgb3B0aW9uYWwsXG5cbiAgICAvKipcbiAgICAgKiDlpoLmnpzmqKHlnovmlofku7bkuK3ljIXlkKvmraPliIfkv6Hmga/liJnlr7zlh7rmraPliIfvvIzlkKbliJnoi6XnurnnkIblnZDmoIflrZjlnKjliJnph43mlrDorqHnrpflubblr7zlh7rmraPliIfjgIJcbiAgICAgKi9cbiAgICByZXF1aXJlLFxuXG4gICAgLyoqXG4gICAgICog5LiN566h5qih5Z6L5paH5Lu25Lit5piv5ZCm5YyF5ZCr5q2j5YiH5L+h5oGv77yM55u05o6l6YeN5paw6K6h566X5bm25a+85Ye65q2j5YiH44CCXG4gICAgICovXG4gICAgcmVjYWxjdWxhdGUsXG59XG4iXX0=