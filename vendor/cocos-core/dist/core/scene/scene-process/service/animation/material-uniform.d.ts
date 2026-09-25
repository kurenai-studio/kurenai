export interface IMaterialUniformProperty {
    comp: string;
    materialProperty: string;
    materialIndex?: number;
    passIndex: number;
    uniformName: string;
}
export declare function parseMaterialUniformPropertyKey(propKey: string): IMaterialUniformProperty | null;
export declare function createMaterialUniformPropertyKey(data: IMaterialUniformProperty): string;
export declare function queryMaterialUniformTarget(component: Record<string, unknown>, data: IMaterialUniformProperty): {
    material: any;
    pass: any;
} | null;
export declare function queryMaterialUniformType(pass: any, uniformName: string): string;
export declare function readMaterialUniformValue(component: Record<string, unknown>, data: IMaterialUniformProperty): unknown;
