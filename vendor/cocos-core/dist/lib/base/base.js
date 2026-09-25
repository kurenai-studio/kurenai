"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const utils_1 = __importDefault(require("../../core/base/utils"));
async function init(projectPath) {
    utils_1.default.Path.register('project', {
        label: '项目',
        path: projectPath,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvYmFzZS9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRUEsb0JBS0M7QUFQRCxrRUFBMEM7QUFFbkMsS0FBSyxVQUFVLElBQUksQ0FBQyxXQUFtQjtJQUMxQyxlQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUU7UUFDM0IsS0FBSyxFQUFFLElBQUk7UUFDWCxJQUFJLEVBQUUsV0FBVztLQUNwQixDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uL2NvcmUvYmFzZS91dGlscyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0KHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB1dGlscy5QYXRoLnJlZ2lzdGVyKCdwcm9qZWN0Jywge1xuICAgICAgICBsYWJlbDogJ+mhueebricsXG4gICAgICAgIHBhdGg6IHByb2plY3RQYXRoLFxuICAgIH0pO1xufVxuXG4iXX0=