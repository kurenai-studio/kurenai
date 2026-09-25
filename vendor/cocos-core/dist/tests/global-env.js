"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGlobalEnv = void 0;
const path_1 = require("path");
const projectRoot = (0, path_1.join)(__dirname, '../../tests/fixtures/projects/asset-operation');
exports.TestGlobalEnv = {
    projectRoot,
    engineRoot: (0, path_1.join)(__dirname, '../../packages/engine'),
    libraryPath: (0, path_1.join)(projectRoot, 'library'),
    testRootUrl: 'db://assets/__test__',
    testRoot: (0, path_1.join)(projectRoot, 'assets/__test__'),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLWVudi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0cy9nbG9iYWwtZW52LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtCQUE0QjtBQUU1QixNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsK0NBQStDLENBQUMsQ0FBQztBQUV4RSxRQUFBLGFBQWEsR0FBRztJQUN6QixXQUFXO0lBQ1gsVUFBVSxFQUFFLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQztJQUNwRCxXQUFXLEVBQUUsSUFBQSxXQUFJLEVBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztJQUN6QyxXQUFXLEVBQUUsc0JBQXNCO0lBQ25DLFFBQVEsRUFBRSxJQUFBLFdBQUksRUFBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUM7Q0FDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuY29uc3QgcHJvamVjdFJvb3QgPSBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3Rlc3RzL2ZpeHR1cmVzL3Byb2plY3RzL2Fzc2V0LW9wZXJhdGlvbicpO1xuXG5leHBvcnQgY29uc3QgVGVzdEdsb2JhbEVudiA9IHtcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBlbmdpbmVSb290OiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL2VuZ2luZScpLFxuICAgIGxpYnJhcnlQYXRoOiBqb2luKHByb2plY3RSb290LCAnbGlicmFyeScpLFxuICAgIHRlc3RSb290VXJsOiAnZGI6Ly9hc3NldHMvX190ZXN0X18nLFxuICAgIHRlc3RSb290OiBqb2luKHByb2plY3RSb290LCAnYXNzZXRzL19fdGVzdF9fJyksXG59O1xuIl19