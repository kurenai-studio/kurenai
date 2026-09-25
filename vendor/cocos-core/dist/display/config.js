"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.InteractiveConfig = void 0;
/**
 * 交互模式配置管理器
 */
class InteractiveConfig {
    static instance;
    interactiveMode = true;
    constructor() { }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!InteractiveConfig.instance) {
            InteractiveConfig.instance = new InteractiveConfig();
        }
        return InteractiveConfig.instance;
    }
    /**
     * 设置交互模式
     */
    setInteractiveMode(enabled) {
        this.interactiveMode = enabled;
    }
    /**
     * 检查是否启用交互模式
     */
    isInteractiveEnabled() {
        return this.interactiveMode;
    }
    /**
     * 检查是否应该显示 banner
     */
    shouldDisplayBanner() {
        return this.interactiveMode;
    }
    /**
     * 检查是否应该使用交互式组件
     */
    shouldUseInteractive() {
        return this.interactiveMode;
    }
    /**
     * 检查是否应该使用加载动画
     */
    shouldUseSpinner() {
        return this.interactiveMode;
    }
    /**
     * 检查是否应该使用进度条
     */
    shouldUseProgressBar() {
        return this.interactiveMode;
    }
}
exports.InteractiveConfig = InteractiveConfig;
// 导出单例实例
exports.config = InteractiveConfig.getInstance();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Rpc3BsYXkvY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFDbEIsTUFBTSxDQUFDLFFBQVEsQ0FBb0I7SUFDbkMsZUFBZSxHQUFZLElBQUksQ0FBQztJQUV4QyxnQkFBd0IsQ0FBQztJQUV6Qjs7T0FFRztJQUNILE1BQU0sQ0FBQyxXQUFXO1FBQ2QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7UUFDekQsQ0FBQztRQUNELE9BQU8saUJBQWlCLENBQUMsUUFBUSxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7T0FFRztJQUNILGtCQUFrQixDQUFDLE9BQWdCO1FBQy9CLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNILG9CQUFvQjtRQUNoQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsbUJBQW1CO1FBQ2YsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILG9CQUFvQjtRQUNoQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZ0JBQWdCO1FBQ1osT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILG9CQUFvQjtRQUNoQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDaEMsQ0FBQztDQUNKO0FBekRELDhDQXlEQztBQUVELFNBQVM7QUFDSSxRQUFBLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5Lqk5LqS5qih5byP6YWN572u566h55CG5ZmoXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGl2ZUNvbmZpZyB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IEludGVyYWN0aXZlQ29uZmlnO1xuICAgIHByaXZhdGUgaW50ZXJhY3RpdmVNb2RlOiBib29sZWFuID0gdHJ1ZTtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7IH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluWNleS+i+WunuS+i1xuICAgICAqL1xuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBJbnRlcmFjdGl2ZUNvbmZpZyB7XG4gICAgICAgIGlmICghSW50ZXJhY3RpdmVDb25maWcuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIEludGVyYWN0aXZlQ29uZmlnLmluc3RhbmNlID0gbmV3IEludGVyYWN0aXZlQ29uZmlnKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aXZlQ29uZmlnLmluc3RhbmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruS6pOS6kuaooeW8j1xuICAgICAqL1xuICAgIHNldEludGVyYWN0aXZlTW9kZShlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaW50ZXJhY3RpdmVNb2RlID0gZW5hYmxlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XmmK/lkKblkK/nlKjkuqTkupLmqKHlvI9cbiAgICAgKi9cbiAgICBpc0ludGVyYWN0aXZlRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJhY3RpdmVNb2RlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeaYr+WQpuW6lOivpeaYvuekuiBiYW5uZXJcbiAgICAgKi9cbiAgICBzaG91bGREaXNwbGF5QmFubmVyKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcmFjdGl2ZU1vZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5piv5ZCm5bqU6K+l5L2/55So5Lqk5LqS5byP57uE5Lu2XG4gICAgICovXG4gICAgc2hvdWxkVXNlSW50ZXJhY3RpdmUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyYWN0aXZlTW9kZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XmmK/lkKblupTor6Xkvb/nlKjliqDovb3liqjnlLtcbiAgICAgKi9cbiAgICBzaG91bGRVc2VTcGlubmVyKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcmFjdGl2ZU1vZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5piv5ZCm5bqU6K+l5L2/55So6L+b5bqm5p2hXG4gICAgICovXG4gICAgc2hvdWxkVXNlUHJvZ3Jlc3NCYXIoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyYWN0aXZlTW9kZTtcbiAgICB9XG59XG5cbi8vIOWvvOWHuuWNleS+i+WunuS+i1xuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IEludGVyYWN0aXZlQ29uZmlnLmdldEluc3RhbmNlKCk7XG4iXX0=