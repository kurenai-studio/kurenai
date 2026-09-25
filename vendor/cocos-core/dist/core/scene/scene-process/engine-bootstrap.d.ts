import * as EditorExtends from '../../engine/editor-extends';
import { serviceManager } from './service/service-manager';
import { ReferenceImageService } from './service/reference-image';
import './service';
export { serviceManager, EditorExtends };
export declare const Service: import("./service/interfaces").IServiceManager;
export { ReferenceImageService };
export declare function startup(options: {
    serverURL: string;
}): Promise<void>;
