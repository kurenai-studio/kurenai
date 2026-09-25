"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncDelegate = void 0;
exports.fastRemove = fastRemove;
/* eslint-disable prefer-rest-params */
/**
 * @zh
 * 移除首个指定的数组元素。判定元素相等时相当于于使用了 `Array.prototype.indexOf`。
 * 此函数十分高效，但会改变数组的元素次序。
 * @en
 * Removes the first occurrence of a specific object from the array.
 * Decision of the equality of elements is similar to `Array.prototype.indexOf`.
 * It's faster but the order of the array will be changed.
 * @param array @zh 被操作的数组。@en The array to be operated.
 * @param value @zh 待移除元素。@en The value to be removed.
 */
function fastRemove(array, value) {
    const index = array.indexOf(value);
    if (index >= 0) {
        array[index] = array[array.length - 1];
        --array.length;
    }
}
/**
 * @zh
 * Async Delegate 用于支持异步回调的代理，你可以新建一个异步代理，并注册异步回调，等到对应的时机触发代理事件。
 *
 * @en
 * Async Delegate is a delegate that supports asynchronous callbacks.
 * You can create a new AsyncDelegate, register the asynchronous callback, and wait until the corresponding time to dispatch the event.
 *
 * @example
 * ```ts
 * const ad = new AsyncDelegate();
 * ad.add(() => {
 *     return new Promise((resolve, reject) => {
 *        setTimeout(() => {
 *            console.log('hello world');
 *            resolve();
 *        }, 1000);
 *     })
 * });
 * await ad.dispatch();
 * ```
 */
class AsyncDelegate {
    _delegates = [];
    /**
     * @en
     * Add an async callback or sync callback.
     *
     * @zh
     * 添加一个异步回调或同步回调。
     *
     * @param callback
     * @en The callback to add, and will be invoked when this delegate is dispatching.
     * @zh 要添加的回调，并将在该委托调度时被调用。
     */
    add(callback) {
        if (!this._delegates.includes(callback)) {
            this._delegates.push(callback);
        }
    }
    /**
     * @zh
     * 查询是否已注册某个回调。
     * @en
     * Queries if a callback has been registered.
     *
     * @param callback @en The callback to query. @zh 要查询的回调函数。
     * @returns @en Whether the callback has been added. @zh 是否已经添加了回调。
     */
    hasListener(callback) {
        return this._delegates.includes(callback);
    }
    /**
     * @en
     * Remove the specific callback of this delegate.
     *
     * @zh
     * 移除此代理中某个具体的回调。
     *
     * @param callback @en The callback to remove. @zh 要移除的某个回调。
     */
    remove(callback) {
        fastRemove(this._delegates, callback);
    }
    /**
     * @en
     * Dispatching the delegate event. This function will trigger all previously registered callbacks and does not guarantee execution order.
     *
     * @zh
     * 派发代理事件。此函数会触发所有之前注册的回调，并且不保证执行顺序。
     *
     * @param args @en The parameters to be transferred to callback. @zh 传递给回调函数的参数。
     * @returns @en The promise awaiting all async callback resolved. @zh 等待所有异步回调结束的 Promise 对象。
     */
    dispatch(...args) {
        return Promise.all(this._delegates.map((func) => func(...arguments)).filter(Boolean));
    }
}
exports.AsyncDelegate = AsyncDelegate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZWdhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvdXRpbHMvZGVsZWdhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBWUEsZ0NBTUM7QUFsQkQsdUNBQXVDO0FBQ3ZDOzs7Ozs7Ozs7O0dBVUc7QUFDSCxTQUFnQixVQUFVLENBQUksS0FBVSxFQUFFLEtBQVE7SUFDOUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNiLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2QyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDbkIsQ0FBQztBQUNMLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJHO0FBQ0gsTUFBYSxhQUFhO0lBQ2QsVUFBVSxHQUFRLEVBQUUsQ0FBQztJQUU3Qjs7Ozs7Ozs7OztPQVVHO0lBQ0ksR0FBRyxDQUFDLFFBQVc7UUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNJLFdBQVcsQ0FBQyxRQUFXO1FBQzFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksTUFBTSxDQUFDLFFBQVc7UUFDckIsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNJLFFBQVEsQ0FBQyxHQUFHLElBQW1CO1FBQ2xDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMxRixDQUFDO0NBQ0o7QUEzREQsc0NBMkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcHJlZmVyLXJlc3QtcGFyYW1zICovXG4vKipcbiAqIEB6aFxuICog56e76Zmk6aaW5Liq5oyH5a6a55qE5pWw57uE5YWD57Sg44CC5Yik5a6a5YWD57Sg55u4562J5pe255u45b2T5LqO5LqO5L2/55So5LqGIGBBcnJheS5wcm90b3R5cGUuaW5kZXhPZmDjgIJcbiAqIOatpOWHveaVsOWNgeWIhumrmOaViO+8jOS9huS8muaUueWPmOaVsOe7hOeahOWFg+e0oOasoeW6j+OAglxuICogQGVuXG4gKiBSZW1vdmVzIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGEgc3BlY2lmaWMgb2JqZWN0IGZyb20gdGhlIGFycmF5LlxuICogRGVjaXNpb24gb2YgdGhlIGVxdWFsaXR5IG9mIGVsZW1lbnRzIGlzIHNpbWlsYXIgdG8gYEFycmF5LnByb3RvdHlwZS5pbmRleE9mYC5cbiAqIEl0J3MgZmFzdGVyIGJ1dCB0aGUgb3JkZXIgb2YgdGhlIGFycmF5IHdpbGwgYmUgY2hhbmdlZC5cbiAqIEBwYXJhbSBhcnJheSBAemgg6KKr5pON5L2c55qE5pWw57uE44CCQGVuIFRoZSBhcnJheSB0byBiZSBvcGVyYXRlZC5cbiAqIEBwYXJhbSB2YWx1ZSBAemgg5b6F56e76Zmk5YWD57Sg44CCQGVuIFRoZSB2YWx1ZSB0byBiZSByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmFzdFJlbW92ZTxUPihhcnJheTogVFtdLCB2YWx1ZTogVCkge1xuICAgIGNvbnN0IGluZGV4ID0gYXJyYXkuaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgYXJyYXlbaW5kZXhdID0gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgICAgIC0tYXJyYXkubGVuZ3RoO1xuICAgIH1cbn1cblxuLyoqXG4gKiBAemhcbiAqIEFzeW5jIERlbGVnYXRlIOeUqOS6juaUr+aMgeW8guatpeWbnuiwg+eahOS7o+eQhu+8jOS9oOWPr+S7peaWsOW7uuS4gOS4quW8guatpeS7o+eQhu+8jOW5tuazqOWGjOW8guatpeWbnuiwg++8jOetieWIsOWvueW6lOeahOaXtuacuuinpuWPkeS7o+eQhuS6i+S7tuOAglxuICpcbiAqIEBlblxuICogQXN5bmMgRGVsZWdhdGUgaXMgYSBkZWxlZ2F0ZSB0aGF0IHN1cHBvcnRzIGFzeW5jaHJvbm91cyBjYWxsYmFja3MuXG4gKiBZb3UgY2FuIGNyZWF0ZSBhIG5ldyBBc3luY0RlbGVnYXRlLCByZWdpc3RlciB0aGUgYXN5bmNocm9ub3VzIGNhbGxiYWNrLCBhbmQgd2FpdCB1bnRpbCB0aGUgY29ycmVzcG9uZGluZyB0aW1lIHRvIGRpc3BhdGNoIHRoZSBldmVudC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGNvbnN0IGFkID0gbmV3IEFzeW5jRGVsZWdhdGUoKTtcbiAqIGFkLmFkZCgoKSA9PiB7XG4gKiAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAqICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAqICAgICAgICAgICAgY29uc29sZS5sb2coJ2hlbGxvIHdvcmxkJyk7XG4gKiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAqICAgICAgICB9LCAxMDAwKTtcbiAqICAgICB9KVxuICogfSk7XG4gKiBhd2FpdCBhZC5kaXNwYXRjaCgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3luY0RlbGVnYXRlPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55KSA9PiAoUHJvbWlzZTx2b2lkPiB8IHZvaWQpID0gKCkgPT4gKFByb21pc2U8dm9pZD4gfCB2b2lkKT4ge1xuICAgIHByaXZhdGUgX2RlbGVnYXRlczogVFtdID0gW107XG5cbiAgICAvKipcbiAgICAgKiBAZW5cbiAgICAgKiBBZGQgYW4gYXN5bmMgY2FsbGJhY2sgb3Igc3luYyBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIEB6aFxuICAgICAqIOa3u+WKoOS4gOS4quW8guatpeWbnuiwg+aIluWQjOatpeWbnuiwg+OAglxuICAgICAqXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICogQGVuIFRoZSBjYWxsYmFjayB0byBhZGQsIGFuZCB3aWxsIGJlIGludm9rZWQgd2hlbiB0aGlzIGRlbGVnYXRlIGlzIGRpc3BhdGNoaW5nLlxuICAgICAqIEB6aCDopoHmt7vliqDnmoTlm57osIPvvIzlubblsIblnKjor6Xlp5TmiZjosIPluqbml7booqvosIPnlKjjgIJcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkKGNhbGxiYWNrOiBUKSB7XG4gICAgICAgIGlmICghdGhpcy5fZGVsZWdhdGVzLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgdGhpcy5fZGVsZWdhdGVzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHpoXG4gICAgICog5p+l6K+i5piv5ZCm5bey5rOo5YaM5p+Q5Liq5Zue6LCD44CCXG4gICAgICogQGVuXG4gICAgICogUXVlcmllcyBpZiBhIGNhbGxiYWNrIGhhcyBiZWVuIHJlZ2lzdGVyZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgQGVuIFRoZSBjYWxsYmFjayB0byBxdWVyeS4gQHpoIOimgeafpeivoueahOWbnuiwg+WHveaVsOOAglxuICAgICAqIEByZXR1cm5zIEBlbiBXaGV0aGVyIHRoZSBjYWxsYmFjayBoYXMgYmVlbiBhZGRlZC4gQHpoIOaYr+WQpuW3sue7j+a3u+WKoOS6huWbnuiwg+OAglxuICAgICAqL1xuICAgIHB1YmxpYyBoYXNMaXN0ZW5lcihjYWxsYmFjazogVCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGVzLmluY2x1ZGVzKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZW5cbiAgICAgKiBSZW1vdmUgdGhlIHNwZWNpZmljIGNhbGxiYWNrIG9mIHRoaXMgZGVsZWdhdGUuXG4gICAgICpcbiAgICAgKiBAemhcbiAgICAgKiDnp7vpmaTmraTku6PnkIbkuK3mn5DkuKrlhbfkvZPnmoTlm57osIPjgIJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBAZW4gVGhlIGNhbGxiYWNrIHRvIHJlbW92ZS4gQHpoIOimgeenu+mZpOeahOafkOS4quWbnuiwg+OAglxuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmUoY2FsbGJhY2s6IFQpIHtcbiAgICAgICAgZmFzdFJlbW92ZSh0aGlzLl9kZWxlZ2F0ZXMsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZW5cbiAgICAgKiBEaXNwYXRjaGluZyB0aGUgZGVsZWdhdGUgZXZlbnQuIFRoaXMgZnVuY3Rpb24gd2lsbCB0cmlnZ2VyIGFsbCBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGFuZCBkb2VzIG5vdCBndWFyYW50ZWUgZXhlY3V0aW9uIG9yZGVyLlxuICAgICAqXG4gICAgICogQHpoXG4gICAgICog5rS+5Y+R5Luj55CG5LqL5Lu244CC5q2k5Ye95pWw5Lya6Kem5Y+R5omA5pyJ5LmL5YmN5rOo5YaM55qE5Zue6LCD77yM5bm25LiU5LiN5L+d6K+B5omn6KGM6aG65bqP44CCXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXJncyBAZW4gVGhlIHBhcmFtZXRlcnMgdG8gYmUgdHJhbnNmZXJyZWQgdG8gY2FsbGJhY2suIEB6aCDkvKDpgJLnu5nlm57osIPlh73mlbDnmoTlj4LmlbDjgIJcbiAgICAgKiBAcmV0dXJucyBAZW4gVGhlIHByb21pc2UgYXdhaXRpbmcgYWxsIGFzeW5jIGNhbGxiYWNrIHJlc29sdmVkLiBAemgg562J5b6F5omA5pyJ5byC5q2l5Zue6LCD57uT5p2f55qEIFByb21pc2Ug5a+56LGh44CCXG4gICAgICovXG4gICAgcHVibGljIGRpc3BhdGNoKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VD4pIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuX2RlbGVnYXRlcy5tYXAoKGZ1bmMpID0+IGZ1bmMoLi4uYXJndW1lbnRzKSkuZmlsdGVyKEJvb2xlYW4pKTtcbiAgICB9XG59XG4iXX0=