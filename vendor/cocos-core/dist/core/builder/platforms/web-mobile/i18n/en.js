'use strict';
module.exports = {
    title: 'Web Mobile',
    options: {
        web_debugger: 'VConsole',
        preview_url: 'Preview URL',
        preview_qrcode: 'Preview QRCode',
        orientation: 'Orientation',
        landscape: 'Landscape',
        portrait: 'Portrait',
        auto: 'Auto',
        async_functions: 'Async Functions',
        async_functions_tips: 'Whether the polyfills for async functions need to be included',
        core_js: 'core-js/core-js',
        core_js_tips: 'If enabled, core-js polyfills are included. The default options of core-js-builder will be used to build the core-js. / 开启后将包含 core-js polyfills。',
    },
    tips: {
        overwriteTemplate: 'Do you want to overwrite the source file {file} ?',
        overwrite: 'Overwrite',
        cancel: 'Cancel',
        webgpu: 'Use WEBGPU as a rendering backend.',
        web_debugger: 'Similar to devtools mini version, used to help debug.',
        webGPUServer: `You can't use local HTTP server to preview on your phone when WebGPU is enabled, please try to build your own HTTPS server to access it. Refer to Environment:`,
    },
    run: {
        label: 'Run',
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItbW9iaWxlL2kxOG4vZW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLEtBQUssRUFBRSxZQUFZO0lBQ25CLE9BQU8sRUFBRTtRQUNMLFlBQVksRUFBRSxVQUFVO1FBQ3hCLFdBQVcsRUFBRSxhQUFhO1FBQzFCLGNBQWMsRUFBRSxnQkFBZ0I7UUFDaEMsV0FBVyxFQUFFLGFBQWE7UUFDMUIsU0FBUyxFQUFFLFdBQVc7UUFDdEIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsSUFBSSxFQUFFLE1BQU07UUFDWixlQUFlLEVBQUUsaUJBQWlCO1FBQ2xDLG9CQUFvQixFQUFFLCtEQUErRDtRQUNyRixPQUFPLEVBQUUsaUJBQWlCO1FBQzFCLFlBQVksRUFBRSxtSkFBbUo7S0FDcEs7SUFDRCxJQUFJLEVBQUU7UUFDRixpQkFBaUIsRUFBRSxtREFBbUQ7UUFDdEUsU0FBUyxFQUFFLFdBQVc7UUFDdEIsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLG9DQUFvQztRQUM1QyxZQUFZLEVBQUUsdURBQXVEO1FBQ3JFLFlBQVksRUFBRSxnS0FBZ0s7S0FDakw7SUFDRCxHQUFHLEVBQUU7UUFDRCxLQUFLLEVBQUUsS0FBSztLQUNmO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdGl0bGU6ICdXZWIgTW9iaWxlJyxcbiAgICBvcHRpb25zOiB7XG4gICAgICAgIHdlYl9kZWJ1Z2dlcjogJ1ZDb25zb2xlJyxcbiAgICAgICAgcHJldmlld191cmw6ICdQcmV2aWV3IFVSTCcsXG4gICAgICAgIHByZXZpZXdfcXJjb2RlOiAnUHJldmlldyBRUkNvZGUnLFxuICAgICAgICBvcmllbnRhdGlvbjogJ09yaWVudGF0aW9uJyxcbiAgICAgICAgbGFuZHNjYXBlOiAnTGFuZHNjYXBlJyxcbiAgICAgICAgcG9ydHJhaXQ6ICdQb3J0cmFpdCcsXG4gICAgICAgIGF1dG86ICdBdXRvJyxcbiAgICAgICAgYXN5bmNfZnVuY3Rpb25zOiAnQXN5bmMgRnVuY3Rpb25zJyxcbiAgICAgICAgYXN5bmNfZnVuY3Rpb25zX3RpcHM6ICdXaGV0aGVyIHRoZSBwb2x5ZmlsbHMgZm9yIGFzeW5jIGZ1bmN0aW9ucyBuZWVkIHRvIGJlIGluY2x1ZGVkJyxcbiAgICAgICAgY29yZV9qczogJ2NvcmUtanMvY29yZS1qcycsXG4gICAgICAgIGNvcmVfanNfdGlwczogJ0lmIGVuYWJsZWQsIGNvcmUtanMgcG9seWZpbGxzIGFyZSBpbmNsdWRlZC4gVGhlIGRlZmF1bHQgb3B0aW9ucyBvZiBjb3JlLWpzLWJ1aWxkZXIgd2lsbCBiZSB1c2VkIHRvIGJ1aWxkIHRoZSBjb3JlLWpzLiAvIOW8gOWQr+WQjuWwhuWMheWQqyBjb3JlLWpzIHBvbHlmaWxsc+OAgicsXG4gICAgfSxcbiAgICB0aXBzOiB7XG4gICAgICAgIG92ZXJ3cml0ZVRlbXBsYXRlOiAnRG8geW91IHdhbnQgdG8gb3ZlcndyaXRlIHRoZSBzb3VyY2UgZmlsZSB7ZmlsZX0gPycsXG4gICAgICAgIG92ZXJ3cml0ZTogJ092ZXJ3cml0ZScsXG4gICAgICAgIGNhbmNlbDogJ0NhbmNlbCcsXG4gICAgICAgIHdlYmdwdTogJ1VzZSBXRUJHUFUgYXMgYSByZW5kZXJpbmcgYmFja2VuZC4nLFxuICAgICAgICB3ZWJfZGVidWdnZXI6ICdTaW1pbGFyIHRvIGRldnRvb2xzIG1pbmkgdmVyc2lvbiwgdXNlZCB0byBoZWxwIGRlYnVnLicsXG4gICAgICAgIHdlYkdQVVNlcnZlcjogYFlvdSBjYW4ndCB1c2UgbG9jYWwgSFRUUCBzZXJ2ZXIgdG8gcHJldmlldyBvbiB5b3VyIHBob25lIHdoZW4gV2ViR1BVIGlzIGVuYWJsZWQsIHBsZWFzZSB0cnkgdG8gYnVpbGQgeW91ciBvd24gSFRUUFMgc2VydmVyIHRvIGFjY2VzcyBpdC4gUmVmZXIgdG8gRW52aXJvbm1lbnQ6YCxcbiAgICB9LFxuICAgIHJ1bjoge1xuICAgICAgICBsYWJlbDogJ1J1bicsXG4gICAgfSxcbn07XG4iXX0=