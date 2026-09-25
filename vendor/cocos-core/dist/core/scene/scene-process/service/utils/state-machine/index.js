"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultStateTransition = exports.Transition = exports.FiniteStateMachine = void 0;
var finite_state_machine_1 = require("./finite-state-machine");
Object.defineProperty(exports, "FiniteStateMachine", { enumerable: true, get: function () { return __importDefault(finite_state_machine_1).default; } });
var transition_1 = require("./transition");
Object.defineProperty(exports, "Transition", { enumerable: true, get: function () { return transition_1.Transition; } });
Object.defineProperty(exports, "DefaultStateTransition", { enumerable: true, get: function () { return transition_1.DefaultStateTransition; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvdXRpbHMvc3RhdGUtbWFjaGluZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrREFBdUU7QUFBOUQsMklBQUEsT0FBTyxPQUFzQjtBQUV0QywyQ0FBa0U7QUFBekQsd0dBQUEsVUFBVSxPQUFBO0FBQUUsb0hBQUEsc0JBQXNCLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBkZWZhdWx0IGFzIEZpbml0ZVN0YXRlTWFjaGluZSB9IGZyb20gJy4vZmluaXRlLXN0YXRlLW1hY2hpbmUnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBJU3RhdGUgfSBmcm9tICcuL3N0YXRlLWludGVyZmFjZSc7XG5leHBvcnQgeyBUcmFuc2l0aW9uLCBEZWZhdWx0U3RhdGVUcmFuc2l0aW9uIH0gZnJvbSAnLi90cmFuc2l0aW9uJztcbiJdfQ==