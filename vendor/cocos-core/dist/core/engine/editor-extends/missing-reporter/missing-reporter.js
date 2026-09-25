'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingReporter = void 0;
class MissingReporter {
    outputLevel = 'debug';
    static INFO_DETAILED = ' Detailed information:\n';
    static getObjectType(obj) {
        // @ts-ignore
        if (obj instanceof cc.Component) {
            return 'component';
            // @ts-ignore
        }
        else if (obj instanceof cc.Prefab) {
            return 'prefab';
            // @ts-ignore
        }
        else if (obj instanceof cc.SceneAsset) {
            return 'scene';
        }
        else {
            return 'asset';
        }
    }
    // 这个属性用于 stash 和 report
    missingObjects = new Set();
    // 这个属性用于 stashByOwner 和 reportByOwner
    missingOwners = new Map();
    root;
    report() { }
    reportByOwner() { }
    constructor(root) {
        this.root = root;
    }
    reset() {
        this.missingObjects.clear();
        this.missingOwners.clear();
        this.root = null;
    }
    stash(obj) {
        this.missingObjects.add(obj);
    }
    /**
     * stashByOwner 和 stash 的区别在于，stash 要求对象中有值，stashByOwner 允许对象的值为空
     * @param {any} [value] - 如果 value 未设置，不会影响提示信息，只不过提示信息可能会不够详细
     */
    stashByOwner(owner, propName, value) {
        let props = this.missingOwners.get(owner);
        if (!props) {
            props = {};
            this.missingOwners.set(owner, props);
        }
        props[propName] = value;
    }
    removeStashedByOwner(owner, propName) {
        const props = this.missingOwners.get(owner);
        if (props) {
            if (propName in props) {
                const id = props[propName];
                delete props[propName];
                if (Object.keys(props).length) {
                    return id;
                }
                // for (var k in props) {
                //     // still has props
                //     return id;
                // }
                // empty
                this.missingOwners.delete(owner);
                return id;
            }
        }
        return undefined;
    }
}
exports.MissingReporter = MissingReporter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2luZy1yZXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9taXNzaW5nLXJlcG9ydGVyL21pc3NpbmctcmVwb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixNQUFhLGVBQWU7SUFFeEIsV0FBVyxHQUErQixPQUFPLENBQUM7SUFFbEQsTUFBTSxDQUFDLGFBQWEsR0FBRywwQkFBMEIsQ0FBQztJQUVsRCxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQVE7UUFDekIsYUFBYTtRQUNiLElBQUksR0FBRyxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5QixPQUFPLFdBQVcsQ0FBQztZQUNuQixhQUFhO1FBQ2pCLENBQUM7YUFBTSxJQUFJLEdBQUcsWUFBWSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEMsT0FBTyxRQUFRLENBQUM7WUFDaEIsYUFBYTtRQUNqQixDQUFDO2FBQU0sSUFBSSxHQUFHLFlBQVksRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sT0FBTyxDQUFDO1FBQ25CLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxPQUFPLENBQUM7UUFDbkIsQ0FBQztJQUNMLENBQUM7SUFFRCx3QkFBd0I7SUFDeEIsY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFFM0Isc0NBQXNDO0lBQ3RDLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRTFCLElBQUksQ0FBTTtJQUVWLE1BQU0sS0FBSyxDQUFDO0lBQ1osYUFBYSxLQUFLLENBQUM7SUFFbkIsWUFBWSxJQUFVO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxLQUFLO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBUTtRQUNWLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxZQUFZLENBQUMsS0FBVSxFQUFFLFFBQWEsRUFBRSxLQUFVO1FBQzlDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNULEtBQUssR0FBRyxFQUFFLENBQUM7WUFDWCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUVELG9CQUFvQixDQUFDLEtBQVUsRUFBRSxRQUFhO1FBQzFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdkIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM1QixPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDO2dCQUNELHlCQUF5QjtnQkFDekIseUJBQXlCO2dCQUN6QixpQkFBaUI7Z0JBQ2pCLElBQUk7Z0JBQ0osUUFBUTtnQkFDUixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakMsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7O0FBOUVMLDBDQStFQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdSZXBvcnRlciB7XG5cbiAgICBvdXRwdXRMZXZlbDogJ2RlYnVnJyB8ICd3YXJuJyB8ICdlcnJvcicgPSAnZGVidWcnO1xuXG4gICAgc3RhdGljIElORk9fREVUQUlMRUQgPSAnIERldGFpbGVkIGluZm9ybWF0aW9uOlxcbic7XG5cbiAgICBzdGF0aWMgZ2V0T2JqZWN0VHlwZShvYmo6IGFueSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBjYy5Db21wb25lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiAnY29tcG9uZW50JztcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBjYy5QcmVmYWIpIHtcbiAgICAgICAgICAgIHJldHVybiAncHJlZmFiJztcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBjYy5TY2VuZUFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ3NjZW5lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnYXNzZXQnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6L+Z5Liq5bGe5oCn55So5LqOIHN0YXNoIOWSjCByZXBvcnRcbiAgICBtaXNzaW5nT2JqZWN0cyA9IG5ldyBTZXQoKTtcblxuICAgIC8vIOi/meS4quWxnuaAp+eUqOS6jiBzdGFzaEJ5T3duZXIg5ZKMIHJlcG9ydEJ5T3duZXJcbiAgICBtaXNzaW5nT3duZXJzID0gbmV3IE1hcCgpO1xuXG4gICAgcm9vdDogYW55O1xuXG4gICAgcmVwb3J0KCkgeyB9XG4gICAgcmVwb3J0QnlPd25lcigpIHsgfVxuXG4gICAgY29uc3RydWN0b3Iocm9vdD86IGFueSkge1xuICAgICAgICB0aGlzLnJvb3QgPSByb290O1xuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLm1pc3NpbmdPYmplY3RzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMubWlzc2luZ093bmVycy5jbGVhcigpO1xuICAgICAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgIH1cblxuICAgIHN0YXNoKG9iajogYW55KSB7XG4gICAgICAgIHRoaXMubWlzc2luZ09iamVjdHMuYWRkKG9iaik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc3Rhc2hCeU93bmVyIOWSjCBzdGFzaCDnmoTljLrliKvlnKjkuo7vvIxzdGFzaCDopoHmsYLlr7nosaHkuK3mnInlgLzvvIxzdGFzaEJ5T3duZXIg5YWB6K645a+56LGh55qE5YC85Li656m6XG4gICAgICogQHBhcmFtIHthbnl9IFt2YWx1ZV0gLSDlpoLmnpwgdmFsdWUg5pyq6K6+572u77yM5LiN5Lya5b2x5ZON5o+Q56S65L+h5oGv77yM5Y+q5LiN6L+H5o+Q56S65L+h5oGv5Y+v6IO95Lya5LiN5aSf6K+m57uGXG4gICAgICovXG4gICAgc3Rhc2hCeU93bmVyKG93bmVyOiBhbnksIHByb3BOYW1lOiBhbnksIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgbGV0IHByb3BzID0gdGhpcy5taXNzaW5nT3duZXJzLmdldChvd25lcik7XG4gICAgICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgICAgICB0aGlzLm1pc3NpbmdPd25lcnMuc2V0KG93bmVyLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmVtb3ZlU3Rhc2hlZEJ5T3duZXIob3duZXI6IGFueSwgcHJvcE5hbWU6IGFueSkge1xuICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMubWlzc2luZ093bmVycy5nZXQob3duZXIpO1xuICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgIGlmIChwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wc1twcm9wTmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBmb3IgKHZhciBrIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIC8vIHN0aWxsIGhhcyBwcm9wc1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gaWQ7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIGVtcHR5XG4gICAgICAgICAgICAgICAgdGhpcy5taXNzaW5nT3duZXJzLmRlbGV0ZShvd25lcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuIl19