"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedoService = void 0;
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
let RedoService = class RedoService extends core_1.BaseService {
    redo(options) {
        return decorator_1.Service.Undo.redo(options);
    }
    canRedo(options) {
        return decorator_1.Service.Undo.canRedo(options);
    }
};
exports.RedoService = RedoService;
exports.RedoService = RedoService = __decorate([
    (0, decorator_1.register)('Redo')
], RedoService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9yZWRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLGlDQUFxQztBQUNyQyxnREFBcUQ7QUFJOUMsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLGtCQUFvQztJQUNqRSxJQUFJLENBQUMsT0FBK0I7UUFDaEMsT0FBTyxtQkFBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELE9BQU8sQ0FBQyxPQUErQjtRQUNuQyxPQUFPLG1CQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQ0osQ0FBQTtBQVJZLGtDQUFXO3NCQUFYLFdBQVc7SUFEdkIsSUFBQSxvQkFBUSxFQUFDLE1BQU0sQ0FBQztHQUNKLFdBQVcsQ0FRdkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlU2VydmljZSB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyByZWdpc3RlciwgU2VydmljZSB9IGZyb20gJy4vY29yZS9kZWNvcmF0b3InO1xuaW1wb3J0IHR5cGUgeyBJUmVkb1NlcnZpY2UsIElVbmRvT3BlcmF0aW9uT3B0aW9ucywgSVVuZG9SZWRvUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29tbW9uJztcblxuQHJlZ2lzdGVyKCdSZWRvJylcbmV4cG9ydCBjbGFzcyBSZWRvU2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPFJlY29yZDxzdHJpbmcsIG5ldmVyW10+PiBpbXBsZW1lbnRzIElSZWRvU2VydmljZSB7XG4gICAgcmVkbyhvcHRpb25zPzogSVVuZG9PcGVyYXRpb25PcHRpb25zKTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgcmV0dXJuIFNlcnZpY2UuVW5kby5yZWRvKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGNhblJlZG8ob3B0aW9ucz86IElVbmRvT3BlcmF0aW9uT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gU2VydmljZS5VbmRvLmNhblJlZG8ob3B0aW9ucyk7XG4gICAgfVxufVxuIl19