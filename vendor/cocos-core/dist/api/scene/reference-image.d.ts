/** Public AI/MCP facade for formal reference-image operations. */
import { CommonResultType } from '../base/schema-base';
import { TReferenceImageParameters, TReferenceImagePath, TReferenceImageState, TReferenceImageVisibility } from './reference-image-schema';
/** Formal, semantic MCP operations. Ephemeral preview APIs remain scene-Webview only. */
export declare class ReferenceImageApi {
    query(): Promise<CommonResultType<TReferenceImageState>>;
    add(options: TReferenceImagePath): Promise<CommonResultType<TReferenceImageState>>;
    delete(options: TReferenceImagePath): Promise<CommonResultType<TReferenceImageState>>;
    select(options: TReferenceImagePath): Promise<CommonResultType<TReferenceImageState>>;
    clearBinding(): Promise<CommonResultType<TReferenceImageState>>;
    setVisible(options: TReferenceImageVisibility): Promise<CommonResultType<TReferenceImageState>>;
    refresh(): Promise<CommonResultType<TReferenceImageState>>;
    setParameters(patch: TReferenceImageParameters): Promise<CommonResultType<TReferenceImageState>>;
    private execute;
}
