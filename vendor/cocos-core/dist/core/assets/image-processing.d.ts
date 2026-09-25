export interface IImagePixelExtractionOptions {
    rect: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    rotation?: 0 | 90;
}
export interface IExtractedImagePixels {
    dataBase64: string;
    width: number;
    height: number;
    channels: number;
}
/**
 * 在 Node 进程中读取图片像素。
 *
 * Scene Runtime 可能运行在浏览器中，不能直接加载 Sharp 原生模块，因此只通过 RPC
 * 调用此方法并接收可 JSON 序列化的 Base64 数据。
 */
export declare function extractImagePixelsFromFile(file: string, options: IImagePixelExtractionOptions): Promise<IExtractedImagePixels>;
