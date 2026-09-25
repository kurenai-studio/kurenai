System.register([], (function (exports) {
	'use strict';
	return {
		execute: (function () {

			exports({
				a: commonjsRequire,
				c: createCommonjsModule
			});

			var commonjsGlobal = exports('b', typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});

			function createCommonjsModule(fn, basedir, module) {
				return module = {
					path: basedir,
					exports: {},
					require: function (path, base) {
						return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
					}
				}, fn(module, module.exports), module.exports;
			}

			function commonjsRequire () {
				throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
			}

		})
	};
}));
//# sourceMappingURL=_commonjsHelpers-9cedf210.js.map
