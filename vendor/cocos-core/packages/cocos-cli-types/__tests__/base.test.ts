type BaseModule = typeof import('../base');

describe('cocos-cli-types: base', () => {
    it('should be able to import init', () => {
        let _init: BaseModule['init'] | undefined = undefined;
        expect(_init).toBeUndefined();
    });
});
