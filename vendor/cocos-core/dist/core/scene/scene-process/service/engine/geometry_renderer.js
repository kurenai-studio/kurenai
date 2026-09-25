"use strict";
/**
 *  对引擎geometry_renderer的封装;
 *  添加接口和引擎一致
 *  由于每帧都需要渲染，所以这个类主要是一个数据收集，在每帧渲染时，flush数据给引擎
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeometryRenderer = exports.methods = void 0;
exports.methods = [
    'addDashedLine',
    'addTriangle',
    'addQuad',
    'addBoundingBox',
    'addCross',
    'addFrustum',
    'addCapsule',
    'addCylinder',
    'addCone',
    'addCircle',
    'addArc',
    'addPolygon',
    'addDisc',
    'addSector',
    'addSphere',
    'addTorus',
    'addOctahedron',
    'addBezier',
    'addMesh',
    'addIndexedMesh',
];
class GeometryRenderer {
    _renderer;
    _dataMap;
    constructor() {
        this._renderer = null;
        this._dataMap = new Map();
        // 初始化map,模拟接口
        exports.methods.forEach(method => {
            this._dataMap.set(method, []);
            Object.defineProperty(this, method, {
                value: (...args) => {
                    const params = this._dataMap.get(method);
                    // @ts-ignore
                    params?.push(args);
                },
            });
        });
        // this?.addTriangle(new Vec3(0, 0, 0), new Vec3(0, 1, 0), new Vec3(1, 0, 0), new Color(255, 255, 255));
    }
    get renderer() {
        return this._renderer;
    }
    set renderer(renderer) {
        this._renderer = renderer;
    }
    // 统一输出数据
    flush() {
        for (const method of this._dataMap.keys()) {
            const params = this._dataMap.get(method);
            params?.forEach(param => {
                // @ts-ignore
                // console.log('插入数据', method, ...param);
                if (this._renderer) {
                    // @ts-ignore
                    this._renderer[method](...param);
                }
            });
        }
    }
    // 移除method对于的数据
    removeData(method) {
        this._dataMap.set(method, []);
    }
    // 移除所有数据 
    removeDataAll() {
        exports.methods.forEach(method => {
            this._dataMap.set(method, []);
        });
    }
}
exports.GeometryRenderer = GeometryRenderer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbWV0cnlfcmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZW5naW5lL2dlb21ldHJ5X3JlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOzs7QUFFVSxRQUFBLE9BQU8sR0FBRztJQUNuQixlQUFlO0lBQ2YsYUFBYTtJQUNiLFNBQVM7SUFDVCxnQkFBZ0I7SUFDaEIsVUFBVTtJQUNWLFlBQVk7SUFDWixZQUFZO0lBQ1osYUFBYTtJQUNiLFNBQVM7SUFDVCxXQUFXO0lBQ1gsUUFBUTtJQUNSLFlBQVk7SUFDWixTQUFTO0lBQ1QsV0FBVztJQUNYLFdBQVc7SUFDWCxVQUFVO0lBQ1YsZUFBZTtJQUNmLFdBQVc7SUFDWCxTQUFTO0lBQ1QsZ0JBQWdCO0NBQ1YsQ0FBQztBQUVYLE1BQU0sZ0JBQWdCO0lBQ1YsU0FBUyxDQUFNO0lBQ2YsUUFBUSxDQUFrQjtJQUNsQztRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxQixjQUFjO1FBQ2QsZUFBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO2dCQUNoQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFO29CQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDekMsYUFBYTtvQkFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2FBRUosQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDSCx3R0FBd0c7SUFDNUcsQ0FBQztJQUVELElBQUksUUFBUTtRQUNSLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxRQUFRLENBQUMsUUFBYTtRQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUM5QixDQUFDO0lBRUQsU0FBUztJQUNULEtBQUs7UUFDRCxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNwQixhQUFhO2dCQUNiLHlDQUF5QztnQkFDekMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2pCLGFBQWE7b0JBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixVQUFVLENBQUMsTUFBYztRQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELFVBQVU7SUFDVixhQUFhO1FBQ1QsZUFBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBRUo7QUFFUSw0Q0FBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICDlr7nlvJXmk45nZW9tZXRyeV9yZW5kZXJlcueahOWwgeijhTtcbiAqICDmt7vliqDmjqXlj6PlkozlvJXmk47kuIDoh7RcbiAqICDnlLHkuo7mr4/luKfpg73pnIDopoHmuLLmn5PvvIzmiYDku6Xov5nkuKrnsbvkuLvopoHmmK/kuIDkuKrmlbDmja7mlLbpm4bvvIzlnKjmr4/luKfmuLLmn5Pml7bvvIxmbHVzaOaVsOaNrue7meW8leaTjlxuICovXG5cbmV4cG9ydCBjb25zdCBtZXRob2RzID0gW1xuICAgICdhZGREYXNoZWRMaW5lJyxcbiAgICAnYWRkVHJpYW5nbGUnLFxuICAgICdhZGRRdWFkJyxcbiAgICAnYWRkQm91bmRpbmdCb3gnLFxuICAgICdhZGRDcm9zcycsXG4gICAgJ2FkZEZydXN0dW0nLFxuICAgICdhZGRDYXBzdWxlJyxcbiAgICAnYWRkQ3lsaW5kZXInLFxuICAgICdhZGRDb25lJyxcbiAgICAnYWRkQ2lyY2xlJyxcbiAgICAnYWRkQXJjJyxcbiAgICAnYWRkUG9seWdvbicsXG4gICAgJ2FkZERpc2MnLFxuICAgICdhZGRTZWN0b3InLFxuICAgICdhZGRTcGhlcmUnLFxuICAgICdhZGRUb3J1cycsXG4gICAgJ2FkZE9jdGFoZWRyb24nLFxuICAgICdhZGRCZXppZXInLFxuICAgICdhZGRNZXNoJyxcbiAgICAnYWRkSW5kZXhlZE1lc2gnLFxuXSBhcyBjb25zdDtcblxuY2xhc3MgR2VvbWV0cnlSZW5kZXJlciB7XG4gICAgcHJpdmF0ZSBfcmVuZGVyZXI6IGFueTtcbiAgICBwcml2YXRlIF9kYXRhTWFwOiBNYXA8c3RyaW5nLCBbXT47XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGF0YU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgLy8g5Yid5aeL5YyWbWFwLOaooeaLn+aOpeWPo1xuICAgICAgICBtZXRob2RzLmZvckVhY2gobWV0aG9kID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFNYXAuc2V0KG1ldGhvZCwgW10pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG1ldGhvZCwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5fZGF0YU1hcC5nZXQobWV0aG9kKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBwYXJhbXM/LnB1c2goYXJncyk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzPy5hZGRUcmlhbmdsZShuZXcgVmVjMygwLCAwLCAwKSwgbmV3IFZlYzMoMCwgMSwgMCksIG5ldyBWZWMzKDEsIDAsIDApLCBuZXcgQ29sb3IoMjU1LCAyNTUsIDI1NSkpO1xuICAgIH1cblxuICAgIGdldCByZW5kZXJlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyO1xuICAgIH1cblxuICAgIHNldCByZW5kZXJlcihyZW5kZXJlcjogYW55KSB7XG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgfVxuXG4gICAgLy8g57uf5LiA6L6T5Ye65pWw5o2uXG4gICAgZmx1c2goKSB7XG4gICAgICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIHRoaXMuX2RhdGFNYXAua2V5cygpKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLl9kYXRhTWFwLmdldChtZXRob2QpO1xuICAgICAgICAgICAgcGFyYW1zPy5mb3JFYWNoKHBhcmFtID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ+aPkuWFpeaVsOaNricsIG1ldGhvZCwgLi4ucGFyYW0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9yZW5kZXJlcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyW21ldGhvZF0oLi4ucGFyYW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g56e76ZmkbWV0aG9k5a+55LqO55qE5pWw5o2uXG4gICAgcmVtb3ZlRGF0YShtZXRob2Q6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9kYXRhTWFwLnNldChtZXRob2QsIFtdKTtcbiAgICB9XG5cbiAgICAvLyDnp7vpmaTmiYDmnInmlbDmja4gXG4gICAgcmVtb3ZlRGF0YUFsbCgpIHtcbiAgICAgICAgbWV0aG9kcy5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhTWFwLnNldChtZXRob2QsIFtdKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IEdlb21ldHJ5UmVuZGVyZXIgfTtcbiJdfQ==