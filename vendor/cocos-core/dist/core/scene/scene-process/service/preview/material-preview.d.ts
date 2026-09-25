import { InteractivePreview } from './interactive-preview';
import { Material, Scene } from 'cc';
import type { IMaterialPreviewInstance } from '../../../common/preview';
export declare class MaterialPreview extends InteractivePreview implements IMaterialPreviewInstance {
    private lightComp;
    private modelComp;
    private currentPrimitive;
    private material;
    private dummyUniformBuffer;
    private dummyStorageTexture;
    private dummySampleTexture;
    private dummySampler;
    private dummyStorageBuffer;
    private uniformBuffer;
    private storageBuffer;
    protected enableGrid: boolean;
    disablePan: boolean;
    disableMouseWheel: boolean;
    init(registerName: string, queryName: string): void;
    createNodes(scene: Scene): void;
    setMaterial(material: Material | null, force?: boolean): void;
    updateDs(): void;
    setMaterialByUuid(uuid: string): Promise<void>;
    switchPrimitive(type: string): void;
    setLightEnable(enable: boolean): void;
    resetCameraView(): void;
}
