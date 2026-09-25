"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let lastUpdateTime = 0;
let startTime = 0;
/**
 * !#en The interface to get time information from Fireball.
 *
 * See [Time](/en/scripting/time/)
 * !#zh Time 模块用于获得游戏里的时间和帧率相关信息。直接使用 cc.Time.*** 访问即可。
 *
 * 请参考教程[计时和帧率](/zh/scripting/time/)
 *
 * @class Time
 * @static
 */
class Time {
    /**
     * The time at the beginning of this frame. This is the time in seconds since the start of the game.
     * @property time
     * @type {number}
     * @readOnly
     */
    time = 0;
    /**
     * The time at the beginning of this frame. This is the real time in seconds since the start of the game.
     *
     * `Time.realTime` not affected by time scale, and also keeps increasing while the player is paused in editor or in the background.
     * @property realTime
     * @type {number}
     * @readOnly
     */
    realTime = 0;
    /**
     * The time in seconds it took to complete the last frame. Use this property to make your game frame rate independent.
     * @property deltaTime
     * @type {number}
     * @readOnly
     */
    deltaTime = 0;
    /**
     * The total number of frames that have passed.
     * @property frameCount
     * @type {number}
     * @readOnly
     */
    frameCount = 0;
    /**
     * The maximum time a frame can take.
     * @property maxDeltaTime
     * @type {number}
     * @readOnly
     */
    maxDeltaTime = 0.3333333;
    /**
     * @method _update
     * @param {number} timestamp
     * @param {Boolean} [paused=false] if true, only realTime will be updated
     * @param {number} [maxDeltaTime=Time.maxDeltaTime]
     * @private
     */
    update(timestamp, paused, maxDeltaTime) {
        if (!paused) {
            maxDeltaTime = maxDeltaTime || this.maxDeltaTime;
            let delta = timestamp - lastUpdateTime;
            delta = Math.min(maxDeltaTime, delta);
            this.deltaTime = delta;
            lastUpdateTime = timestamp;
            if (this.frameCount === 0) {
                startTime = timestamp;
            }
            else {
                this.time += delta;
                this.realTime = timestamp - startTime;
            }
            ++this.frameCount;
        }
    }
    /**
     * @method _restart
     * @param {number} timestamp
     * @private
     */
    restart(timestamp) {
        this.time = 0;
        this.realTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        lastUpdateTime = timestamp;
    }
}
exports.default = new Time();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9lbmdpbmUvdGltZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFFbEI7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sSUFBSTtJQUNOOzs7OztPQUtHO0lBQ0ksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUVoQjs7Ozs7OztPQU9HO0lBQ0ksUUFBUSxHQUFHLENBQUMsQ0FBQztJQUVwQjs7Ozs7T0FLRztJQUNJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFFckI7Ozs7O09BS0c7SUFDSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBRXRCOzs7OztPQUtHO0lBQ0ksWUFBWSxHQUFHLFNBQVMsQ0FBQztJQUVoQzs7Ozs7O09BTUc7SUFDSSxNQUFNLENBQUMsU0FBaUIsRUFBRSxNQUFlLEVBQUUsWUFBb0I7UUFDbEUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1YsWUFBWSxHQUFHLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ2pELElBQUksS0FBSyxHQUFHLFNBQVMsR0FBRyxjQUFjLENBQUM7WUFDdkMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFFM0IsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QixTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzFCLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztnQkFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzFDLENBQUM7WUFDRCxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDdEIsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksT0FBTyxDQUFDLFNBQWlCO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDcEIsY0FBYyxHQUFHLFNBQVMsQ0FBQztJQUMvQixDQUFDO0NBQ0o7QUFFRCxrQkFBZSxJQUFJLElBQUksRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGxhc3RVcGRhdGVUaW1lID0gMDtcbmxldCBzdGFydFRpbWUgPSAwO1xuXG4vKipcbiAqICEjZW4gVGhlIGludGVyZmFjZSB0byBnZXQgdGltZSBpbmZvcm1hdGlvbiBmcm9tIEZpcmViYWxsLlxuICpcbiAqIFNlZSBbVGltZV0oL2VuL3NjcmlwdGluZy90aW1lLylcbiAqICEjemggVGltZSDmqKHlnZfnlKjkuo7ojrflvpfmuLjmiI/ph4znmoTml7bpl7TlkozluKfnjofnm7jlhbPkv6Hmga/jgILnm7TmjqXkvb/nlKggY2MuVGltZS4qKiog6K6/6Zeu5Y2z5Y+v44CCXG4gKlxuICog6K+35Y+C6ICD5pWZ56iLW+iuoeaXtuWSjOW4p+eOh10oL3poL3NjcmlwdGluZy90aW1lLylcbiAqXG4gKiBAY2xhc3MgVGltZVxuICogQHN0YXRpY1xuICovXG5jbGFzcyBUaW1lIHtcbiAgICAvKipcbiAgICAgKiBUaGUgdGltZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoaXMgZnJhbWUuIFRoaXMgaXMgdGhlIHRpbWUgaW4gc2Vjb25kcyBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGdhbWUuXG4gICAgICogQHByb3BlcnR5IHRpbWVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqIEByZWFkT25seVxuICAgICAqL1xuICAgIHB1YmxpYyB0aW1lID0gMDtcblxuICAgIC8qKlxuICAgICAqIFRoZSB0aW1lIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBmcmFtZS4gVGhpcyBpcyB0aGUgcmVhbCB0aW1lIGluIHNlY29uZHMgc2luY2UgdGhlIHN0YXJ0IG9mIHRoZSBnYW1lLlxuICAgICAqXG4gICAgICogYFRpbWUucmVhbFRpbWVgIG5vdCBhZmZlY3RlZCBieSB0aW1lIHNjYWxlLCBhbmQgYWxzbyBrZWVwcyBpbmNyZWFzaW5nIHdoaWxlIHRoZSBwbGF5ZXIgaXMgcGF1c2VkIGluIGVkaXRvciBvciBpbiB0aGUgYmFja2dyb3VuZC5cbiAgICAgKiBAcHJvcGVydHkgcmVhbFRpbWVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqIEByZWFkT25seVxuICAgICAqL1xuICAgIHB1YmxpYyByZWFsVGltZSA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdGltZSBpbiBzZWNvbmRzIGl0IHRvb2sgdG8gY29tcGxldGUgdGhlIGxhc3QgZnJhbWUuIFVzZSB0aGlzIHByb3BlcnR5IHRvIG1ha2UgeW91ciBnYW1lIGZyYW1lIHJhdGUgaW5kZXBlbmRlbnQuXG4gICAgICogQHByb3BlcnR5IGRlbHRhVGltZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICogQHJlYWRPbmx5XG4gICAgICovXG4gICAgcHVibGljIGRlbHRhVGltZSA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdG90YWwgbnVtYmVyIG9mIGZyYW1lcyB0aGF0IGhhdmUgcGFzc2VkLlxuICAgICAqIEBwcm9wZXJ0eSBmcmFtZUNvdW50XG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKiBAcmVhZE9ubHlcbiAgICAgKi9cbiAgICBwdWJsaWMgZnJhbWVDb3VudCA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWF4aW11bSB0aW1lIGEgZnJhbWUgY2FuIHRha2UuXG4gICAgICogQHByb3BlcnR5IG1heERlbHRhVGltZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICogQHJlYWRPbmx5XG4gICAgICovXG4gICAgcHVibGljIG1heERlbHRhVGltZSA9IDAuMzMzMzMzMztcblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgX3VwZGF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lc3RhbXBcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtwYXVzZWQ9ZmFsc2VdIGlmIHRydWUsIG9ubHkgcmVhbFRpbWUgd2lsbCBiZSB1cGRhdGVkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhEZWx0YVRpbWU9VGltZS5tYXhEZWx0YVRpbWVdXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKHRpbWVzdGFtcDogbnVtYmVyLCBwYXVzZWQ6IGJvb2xlYW4sIG1heERlbHRhVGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghcGF1c2VkKSB7XG4gICAgICAgICAgICBtYXhEZWx0YVRpbWUgPSBtYXhEZWx0YVRpbWUgfHwgdGhpcy5tYXhEZWx0YVRpbWU7XG4gICAgICAgICAgICBsZXQgZGVsdGEgPSB0aW1lc3RhbXAgLSBsYXN0VXBkYXRlVGltZTtcbiAgICAgICAgICAgIGRlbHRhID0gTWF0aC5taW4obWF4RGVsdGFUaW1lLCBkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLmRlbHRhVGltZSA9IGRlbHRhO1xuICAgICAgICAgICAgbGFzdFVwZGF0ZVRpbWUgPSB0aW1lc3RhbXA7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZyYW1lQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSB0aW1lc3RhbXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWxUaW1lID0gdGltZXN0YW1wIC0gc3RhcnRUaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKyt0aGlzLmZyYW1lQ291bnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIF9yZXN0YXJ0XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVzdGFtcFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHVibGljIHJlc3RhcnQodGltZXN0YW1wOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcbiAgICAgICAgdGhpcy5yZWFsVGltZSA9IDA7XG4gICAgICAgIHRoaXMuZGVsdGFUaW1lID0gMDtcbiAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcbiAgICAgICAgbGFzdFVwZGF0ZVRpbWUgPSB0aW1lc3RhbXA7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgVGltZSgpO1xuIl19