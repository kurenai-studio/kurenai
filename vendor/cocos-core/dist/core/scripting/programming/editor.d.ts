declare global {
    namespace Editor {
        namespace Message {
            function request(pkg: string, message: string, ...args: any[]): Promise<any>;
        }
    }
}

export {};
