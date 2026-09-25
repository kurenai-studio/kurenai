import type { IReferenceImageFileService } from '../common/reference-image';
/** Node-only file boundary; it returns a JSON-safe data URL, never a Buffer. */
export declare class ReferenceImageFileService implements IReferenceImageFileService {
    readDataUrl(filePath: string): Promise<string>;
}
export declare const referenceImageFiles: ReferenceImageFileService;
