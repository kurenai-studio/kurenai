export interface MangleConfig {
    mangleProtected?: boolean;
    mangleList?: string[];
    dontMangleList?: string[];
    extends?: string;
}
export declare function parseMangleConfig(filePath: string, platform: string): MangleConfig | undefined;
