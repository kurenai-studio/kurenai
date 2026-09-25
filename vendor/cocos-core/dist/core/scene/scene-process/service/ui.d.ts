import { BaseService } from './core';
import type { IUIService, IUIEvents, UIAlignType } from '../../common';
export declare class UIService extends BaseService<IUIEvents> implements IUIService {
    alignSelection(type: UIAlignType): Promise<void>;
    distributeSelection(type: UIAlignType): Promise<void>;
}
