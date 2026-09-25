'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const controller_utils_1 = __importDefault(require("../utils/controller-utils"));
const base_1 = __importDefault(require("./base"));
const engine_utils_1 = require("../utils/engine-utils");
class PointController extends base_1.default {
    _pointNode = null;
    constructor(rootNode) {
        super(rootNode);
        this._color = cc_1.Color.GREEN;
        this.initShape();
    }
    setColor(color) {
        this._color = color;
        (0, engine_utils_1.setMeshColor)(this._pointNode, color);
    }
    initShape() {
        this.createShapeNode('PointController');
        this._pointNode = controller_utils_1.default.sphere(new cc_1.Vec3(), 0.05, this._color, { unlit: true });
        this._pointNode.parent = this.shape;
    }
    updateData(pos) {
        this._pointNode?.setPosition(pos);
    }
}
exports.default = PointController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29udHJvbGxlci9wb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsMkJBQXVDO0FBRXZDLGlGQUF3RDtBQUN4RCxrREFBb0M7QUFDcEMsd0RBQXFEO0FBRXJELE1BQU0sZUFBZ0IsU0FBUSxjQUFjO0lBQ2hDLFVBQVUsR0FBZ0IsSUFBSSxDQUFDO0lBQ3ZDLFlBQVksUUFBYztRQUN0QixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFLLENBQUMsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQVk7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBQSwyQkFBWSxFQUFDLElBQUksQ0FBQyxVQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQVM7UUFDTCxJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLFVBQVUsR0FBRywwQkFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFNBQUksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN4QyxDQUFDO0lBRUQsVUFBVSxDQUFDLEdBQVM7UUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNKO0FBRUQsa0JBQWUsZUFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDb2xvciwgTm9kZSwgVmVjMyB9IGZyb20gJ2NjJztcblxuaW1wb3J0IENvbnRyb2xsZXJVdGlscyBmcm9tICcuLi91dGlscy9jb250cm9sbGVyLXV0aWxzJztcbmltcG9ydCBDb250cm9sbGVyQmFzZSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHsgc2V0TWVzaENvbG9yIH0gZnJvbSAnLi4vdXRpbHMvZW5naW5lLXV0aWxzJztcblxuY2xhc3MgUG9pbnRDb250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlckJhc2Uge1xuICAgIHByaXZhdGUgX3BvaW50Tm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGNvbnN0cnVjdG9yKHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIHN1cGVyKHJvb3ROb2RlKTtcbiAgICAgICAgdGhpcy5fY29sb3IgPSBDb2xvci5HUkVFTjtcbiAgICAgICAgdGhpcy5pbml0U2hhcGUoKTtcbiAgICB9XG5cbiAgICBzZXRDb2xvcihjb2xvcjogQ29sb3IpIHtcbiAgICAgICAgdGhpcy5fY29sb3IgPSBjb2xvcjtcbiAgICAgICAgc2V0TWVzaENvbG9yKHRoaXMuX3BvaW50Tm9kZSEsIGNvbG9yKTtcbiAgICB9XG5cbiAgICBpbml0U2hhcGUoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlU2hhcGVOb2RlKCdQb2ludENvbnRyb2xsZXInKTtcbiAgICAgICAgdGhpcy5fcG9pbnROb2RlID0gQ29udHJvbGxlclV0aWxzLnNwaGVyZShuZXcgVmVjMygpLCAwLjA1LCB0aGlzLl9jb2xvciwgeyB1bmxpdDogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5fcG9pbnROb2RlLnBhcmVudCA9IHRoaXMuc2hhcGU7XG4gICAgfVxuXG4gICAgdXBkYXRlRGF0YShwb3M6IFZlYzMpIHtcbiAgICAgICAgdGhpcy5fcG9pbnROb2RlPy5zZXRQb3NpdGlvbihwb3MpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUG9pbnRDb250cm9sbGVyO1xuIl19