"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mode_base_3d_1 = __importDefault(require("./mode-base-3d"));
const utils_1 = require("../utils");
class IdleMode extends mode_base_3d_1.default {
    constructor(cameraCtrl) {
        super(cameraCtrl, utils_1.CameraMoveMode.IDLE);
    }
    async enter() {
        this._cameraCtrl.emit('camera-move-mode', utils_1.CameraMoveMode.IDLE);
    }
    async exit() { }
}
exports.default = IdleMode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRsZS1tb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2NhbWVyYS9tb2Rlcy9pZGxlLW1vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrRUFBd0M7QUFDeEMsb0NBQTBDO0FBRzFDLE1BQU0sUUFBUyxTQUFRLHNCQUFVO0lBQzdCLFlBQVksVUFBOEI7UUFDdEMsS0FBSyxDQUFDLFVBQVUsRUFBRSxzQkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLHNCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLEtBQUksQ0FBQztDQUN6QjtBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNb2RlQmFzZTNEIGZyb20gJy4vbW9kZS1iYXNlLTNkJztcbmltcG9ydCB7IENhbWVyYU1vdmVNb2RlIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBDYW1lcmFDb250cm9sbGVyM0QgfSBmcm9tICcuLi9jYW1lcmEtY29udHJvbGxlci0zZCc7XG5cbmNsYXNzIElkbGVNb2RlIGV4dGVuZHMgTW9kZUJhc2UzRCB7XG4gICAgY29uc3RydWN0b3IoY2FtZXJhQ3RybDogQ2FtZXJhQ29udHJvbGxlcjNEKSB7XG4gICAgICAgIHN1cGVyKGNhbWVyYUN0cmwsIENhbWVyYU1vdmVNb2RlLklETEUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBlbnRlcigpIHtcbiAgICAgICAgdGhpcy5fY2FtZXJhQ3RybC5lbWl0KCdjYW1lcmEtbW92ZS1tb2RlJywgQ2FtZXJhTW92ZU1vZGUuSURMRSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGV4aXQoKSB7fVxufVxuXG5leHBvcnQgZGVmYXVsdCBJZGxlTW9kZTtcbiJdfQ==