declare class LinearTicks {
    ticks: number[];
    tickLods: number[];
    tickRatios: number[];
    minScale: number;
    maxScale: number;
    minValueScale: number;
    maxValueScale: number;
    minValue: number;
    maxValue: number;
    pixelRange: number;
    minSpacing: number;
    maxSpacing: number;
    minTickLevel: number;
    maxTickLevel: number;
    initTicks(lods: number[], min: number, max: number): this;
    spacing(min: number, max: number): this;
    range(minValue: number, maxValue: number, range: number): this;
    ticksAtLevel(level: number, excludeHigherLevel: boolean): number[];
    levelForStep(step: number): number;
}
export default LinearTicks;
