import { ProgrammingFacet } from './Facet';
export declare function createProgrammingFacet(enginePath: string, projectPath: string, features: string[]): Promise<ProgrammingFacet>;
export declare function waitForProgrammingFacet(): Promise<ProgrammingFacet>;
export declare function getPreviewFacet(): ProgrammingFacet;
