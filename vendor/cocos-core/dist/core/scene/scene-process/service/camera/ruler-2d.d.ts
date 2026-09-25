import type Grid from './grid';
/**
 * 刻度尺的屏幕映射，由相机实时状态构建（见 CameraController2D._rulerView），
 * 不依赖 Grid 的像素模型，保证刻度与渲染出的网格线/原点轴始终贴合。
 */
export interface IRulerView {
    /** 世界单位 → 屏幕像素（引擎渲染后备像素） */
    toX(value: number): number;
    toY(value: number): number;
    pxPerUnit: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}
/** 渲染相机（renderer.scene.Camera）的最小结构类型，便于解耦与单测 */
export interface IRulerRenderCamera {
    width?: number;
    height?: number;
    worldToScreen?: (out: {
        x: number;
        y: number;
        z: number;
    }, p: {
        x: number;
        y: number;
        z: number;
    }) => {
        x: number;
        y: number;
        z: number;
    };
    update?: (forceUpdate?: boolean) => void;
}
/**
 * 构建刻度尺屏幕映射（纯函数，便于单测）。
 * 正交投影下映射是仿射的：投影世界点 (0,0)/(1,0)/(0,1) 拟合线性系数。
 *
 * 视口尺寸优先取渲染相机自身的 width/height（PR #914 第二轮 P2）：
 * 跨不同 DPR/分辨率屏幕时宿主直接更新 canvas 与渲染相机、不走 onResize，
 * 控制器缓存的 size 会陈旧；worldToScreen 的 y 位于渲染目标高度空间，
 * Y 翻转必须用同一高度，否则纵向刻度整体错位。
 */
export declare function buildRulerView(rc: IRulerRenderCamera | undefined, size: {
    width: number;
    height: number;
}, ortho: {
    orthoHeight: number;
    x: number;
    y: number;
}): IRulerView;
/**
 * 2D 场景刻度尺：横向（底部）+ 纵向（左侧），参考 Creator 场景 web ruler 移植。
 * 两个透明 canvas 由本类自建并 fixed 覆盖在宿主页上（Pink 内嵌宿主 / scene-editor.ejs
 * 等所有宿主通用，不依赖宿主页 DOM），仅绘制刻度文字。
 *
 * 环境边界（review P1）：headless 场景进程提供 mock document，其元素没有 getContext，
 * 本类在此整体 no-op，不影响场景服务启动与保存/关闭流程。
 *
 * 像素基准（review P2）：worldToScreen 坐标位于引擎渲染后备像素空间（引擎 DPR 封顶），
 * 故刻度后备/字号统一使用「有效渲染 DPR」（引擎 canvas 后备/CSS 比），与引擎同基准。
 *
 * 视口变化（review P2）：Pink 宿主摘除引擎 window-resize 自适应、面板 resize 不走
 * 引擎 canvas-resize 事件链，故本类自行观察 overlay 尺寸（ResizeObserver + window
 * resize，rAF 去抖），变化后重设后备并经 onNeedRedraw 回调控制器重画。
 */
export declare class Ruler2D {
    private hCanvas;
    private vCanvas;
    private hCtx;
    private vCtx;
    private isShow;
    private ro;
    private resizePending;
    /** 控制器注入的重画入口；视口变化重设后备后触发 */
    onNeedRedraw: (() => void) | null;
    init(): void;
    /** 复用或创建透明刻度 canvas；headless mock 元素无 getContext 时返回 null（整体 no-op） */
    private ensureCanvas;
    /** 独立观察宿主视口：overlay 尺寸或 window 变化时重设后备并重画 */
    private observeHost;
    private readonly onHostResize;
    /** 有效渲染 DPR：引擎 canvas 后备/CSS 比（与引擎同封顶），回退 window.devicePixelRatio */
    private renderDpr;
    show(isShow: boolean): void;
    resize(): void;
    private cssWidthOf;
    private cssHeightOf;
    updateTicks(grid: Grid, view: IRulerView): void;
}
export default Ruler2D;
