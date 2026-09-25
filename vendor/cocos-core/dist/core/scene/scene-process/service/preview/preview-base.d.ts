import PreviewBuffer from './buffer';
declare class PreviewBase {
    protected previewBuffer: PreviewBuffer;
    queryPreviewData(info: any): Promise<any>;
    queryPreviewDataQueue(info: any): Promise<any>;
    clearPreviewBuffer(): void;
    init(registerName: string, queryName: string): void;
}
export { PreviewBase };
