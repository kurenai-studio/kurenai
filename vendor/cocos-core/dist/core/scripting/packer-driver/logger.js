"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackerDriverLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const packerDriverLogTag = '::PackerDriver::';
const packerDriverLogTagRegex = new RegExp(packerDriverLogTag);
const packerDriverLogTagHidden = `{hidden(${packerDriverLogTag})}`;
class PackerDriverLogger {
    constructor(debugLogFile) {
        const fileLogger = winston_1.default.createLogger({
            transports: [
                new winston_1.default.transports.File({
                    level: 'debug',
                    filename: debugLogFile,
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss.SSS' }), winston_1.default.format.printf(({ level, message, timestamp }) => {
                        return `${timestamp} ${level}: ${message}`;
                    })),
                }),
            ],
        });
        this._fileLogger = fileLogger;
    }
    debug(message) {
        this._fileLogger.debug(message);
    }
    info(message) {
        this._fileLogger.info(message);
        console.info(packerDriverLogTagHidden, message);
        return this;
    }
    warn(message) {
        this._fileLogger.warn(message);
        console.warn(packerDriverLogTagHidden, message);
        return this;
    }
    error(message) {
        this._fileLogger.error(message);
        console.error(packerDriverLogTagHidden, message);
        return this;
    }
    clear() {
        console.debug('Clear logs...');
    }
    _fileLogger;
}
exports.PackerDriverLogger = PackerDriverLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NyaXB0aW5nL3BhY2tlci1kcml2ZXIvbG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNEQUE4QjtBQUc5QixNQUFNLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0FBQzlDLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMvRCxNQUFNLHdCQUF3QixHQUFHLFdBQVcsa0JBQWtCLElBQUksQ0FBQztBQUVuRSxNQUFhLGtCQUFrQjtJQUMzQixZQUFZLFlBQW9CO1FBQzVCLE1BQU0sVUFBVSxHQUFHLGlCQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3BDLFVBQVUsRUFBRTtnQkFDUixJQUFJLGlCQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztvQkFDeEIsS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLFlBQVk7b0JBQ3RCLE1BQU0sRUFBRSxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQzFCLGlCQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUNwRCxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTt3QkFDcEQsT0FBTyxHQUFHLFNBQVMsSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQy9DLENBQUMsQ0FBQyxDQUNMO2lCQUNKLENBQUM7YUFDTDtTQUNKLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBZTtRQUNqQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQWU7UUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQWU7UUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQWU7UUFDakIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsS0FBSztRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVPLFdBQVcsQ0FBaUI7Q0FDdkM7QUE5Q0QsZ0RBOENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3Rvbic7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICdAY29jb3MvY3JlYXRvci1wcm9ncmFtbWluZy1jb21tb24vbGliL2xvZ2dlcic7XG5cbmNvbnN0IHBhY2tlckRyaXZlckxvZ1RhZyA9ICc6OlBhY2tlckRyaXZlcjo6JztcbmNvbnN0IHBhY2tlckRyaXZlckxvZ1RhZ1JlZ2V4ID0gbmV3IFJlZ0V4cChwYWNrZXJEcml2ZXJMb2dUYWcpO1xuY29uc3QgcGFja2VyRHJpdmVyTG9nVGFnSGlkZGVuID0gYHtoaWRkZW4oJHtwYWNrZXJEcml2ZXJMb2dUYWd9KX1gO1xuXG5leHBvcnQgY2xhc3MgUGFja2VyRHJpdmVyTG9nZ2VyIGltcGxlbWVudHMgTG9nZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihkZWJ1Z0xvZ0ZpbGU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBmaWxlTG9nZ2VyID0gd2luc3Rvbi5jcmVhdGVMb2dnZXIoe1xuICAgICAgICAgICAgdHJhbnNwb3J0czogW1xuICAgICAgICAgICAgICAgIG5ldyB3aW5zdG9uLnRyYW5zcG9ydHMuRmlsZSh7XG4gICAgICAgICAgICAgICAgICAgIGxldmVsOiAnZGVidWcnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogZGVidWdMb2dGaWxlLFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHdpbnN0b24uZm9ybWF0LmNvbWJpbmUoXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5zdG9uLmZvcm1hdC50aW1lc3RhbXAoeyBmb3JtYXQ6ICdISDptbTpzcy5TU1MnIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2luc3Rvbi5mb3JtYXQucHJpbnRmKCh7IGxldmVsLCBtZXNzYWdlLCB0aW1lc3RhbXAgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHt0aW1lc3RhbXB9ICR7bGV2ZWx9OiAke21lc3NhZ2V9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fZmlsZUxvZ2dlciA9IGZpbGVMb2dnZXI7XG4gICAgfVxuXG4gICAgZGVidWcobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2ZpbGVMb2dnZXIuZGVidWcobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgaW5mbyhtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZmlsZUxvZ2dlci5pbmZvKG1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLmluZm8ocGFja2VyRHJpdmVyTG9nVGFnSGlkZGVuLCBtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgd2FybihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZmlsZUxvZ2dlci53YXJuKG1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLndhcm4ocGFja2VyRHJpdmVyTG9nVGFnSGlkZGVuLCBtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2ZpbGVMb2dnZXIuZXJyb3IobWVzc2FnZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IocGFja2VyRHJpdmVyTG9nVGFnSGlkZGVuLCBtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ0NsZWFyIGxvZ3MuLi4nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9maWxlTG9nZ2VyOiB3aW5zdG9uLkxvZ2dlcjtcbn1cbiJdfQ==