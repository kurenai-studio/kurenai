'use strict';
module.exports = {
    title: 'Web 手机端',
    options: {
        web_debugger: 'VConsole',
        preview_url: '预览地址',
        preview_qrcode: '预览二维码',
        orientation: '设备方向',
        landscape: '横屏',
        portrait: '竖屏',
        auto: '自动',
        async_functions: '异步函数',
        async_functions_tips: '是否需要包含异步函数 polyfills',
        core_js: 'core-js/core-js',
        core_js_tips: '开启后将包含 core-js polyfills。将使用 core-js-builder 的默认选项来生成 core-js。',
    },
    tips: {
        overwriteTemplate: '模板文件已存在，是否替换源文件 {file} ？',
        overwrite: '替换',
        cancel: '取消',
        webgpu: '是否使用 WEBGPU 渲染后端',
        web_debugger: ' 类似 DevTools 的迷你版，用于辅助手机端调试',
        webGPUServer: '启用 WebGPU 时无法使用本地 HTTP 服务器在手机上预览，请尝试自行搭建 HTTPS 服务器来访问。参考环境：',
    },
    run: {
        label: '运行',
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItbW9iaWxlL2kxOG4vemguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLEtBQUssRUFBRSxTQUFTO0lBQ2hCLE9BQU8sRUFBRTtRQUNMLFlBQVksRUFBRSxVQUFVO1FBQ3hCLFdBQVcsRUFBRSxNQUFNO1FBQ25CLGNBQWMsRUFBRSxPQUFPO1FBQ3ZCLFdBQVcsRUFBRSxNQUFNO1FBQ25CLFNBQVMsRUFBRSxJQUFJO1FBQ2YsUUFBUSxFQUFFLElBQUk7UUFDZCxJQUFJLEVBQUUsSUFBSTtRQUNWLGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLG9CQUFvQixFQUFFLHNCQUFzQjtRQUM1QyxPQUFPLEVBQUUsaUJBQWlCO1FBQzFCLFlBQVksRUFBRSxnRUFBZ0U7S0FDakY7SUFDRCxJQUFJLEVBQUU7UUFDRixpQkFBaUIsRUFBRSwwQkFBMEI7UUFDN0MsU0FBUyxFQUFFLElBQUk7UUFDZixNQUFNLEVBQUUsSUFBSTtRQUNaLE1BQU0sRUFBRSxrQkFBa0I7UUFDMUIsWUFBWSxFQUFFLDZCQUE2QjtRQUMzQyxZQUFZLEVBQUUsNkRBQTZEO0tBQzlFO0lBQ0QsR0FBRyxFQUFFO1FBQ0QsS0FBSyxFQUFFLElBQUk7S0FDZDtDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRpdGxlOiAnV2ViIOaJi+acuuerrycsXG4gICAgb3B0aW9uczoge1xuICAgICAgICB3ZWJfZGVidWdnZXI6ICdWQ29uc29sZScsXG4gICAgICAgIHByZXZpZXdfdXJsOiAn6aKE6KeI5Zyw5Z2AJyxcbiAgICAgICAgcHJldmlld19xcmNvZGU6ICfpooTop4jkuoznu7TnoIEnLFxuICAgICAgICBvcmllbnRhdGlvbjogJ+iuvuWkh+aWueWQkScsXG4gICAgICAgIGxhbmRzY2FwZTogJ+aoquWxjycsXG4gICAgICAgIHBvcnRyYWl0OiAn56uW5bGPJyxcbiAgICAgICAgYXV0bzogJ+iHquWKqCcsXG4gICAgICAgIGFzeW5jX2Z1bmN0aW9uczogJ+W8guatpeWHveaVsCcsXG4gICAgICAgIGFzeW5jX2Z1bmN0aW9uc190aXBzOiAn5piv5ZCm6ZyA6KaB5YyF5ZCr5byC5q2l5Ye95pWwIHBvbHlmaWxscycsXG4gICAgICAgIGNvcmVfanM6ICdjb3JlLWpzL2NvcmUtanMnLFxuICAgICAgICBjb3JlX2pzX3RpcHM6ICflvIDlkK/lkI7lsIbljIXlkKsgY29yZS1qcyBwb2x5ZmlsbHPjgILlsIbkvb/nlKggY29yZS1qcy1idWlsZGVyIOeahOm7mOiupOmAiemhueadpeeUn+aIkCBjb3JlLWpz44CCJyxcbiAgICB9LFxuICAgIHRpcHM6IHtcbiAgICAgICAgb3ZlcndyaXRlVGVtcGxhdGU6ICfmqKHmnb/mlofku7blt7LlrZjlnKjvvIzmmK/lkKbmm7/mjaLmupDmlofku7Yge2ZpbGV9IO+8nycsXG4gICAgICAgIG92ZXJ3cml0ZTogJ+abv+aNoicsXG4gICAgICAgIGNhbmNlbDogJ+WPlua2iCcsXG4gICAgICAgIHdlYmdwdTogJ+aYr+WQpuS9v+eUqCBXRUJHUFUg5riy5p+T5ZCO56uvJyxcbiAgICAgICAgd2ViX2RlYnVnZ2VyOiAnIOexu+S8vCBEZXZUb29scyDnmoTov7fkvaDniYjvvIznlKjkuo7ovoXliqnmiYvmnLrnq6/osIPor5UnLFxuICAgICAgICB3ZWJHUFVTZXJ2ZXI6ICflkK/nlKggV2ViR1BVIOaXtuaXoOazleS9v+eUqOacrOWcsCBIVFRQIOacjeWKoeWZqOWcqOaJi+acuuS4iumihOiniO+8jOivt+WwneivleiHquihjOaQreW7uiBIVFRQUyDmnI3liqHlmajmnaXorr/pl67jgILlj4LogIPnjq/looPvvJonLFxuICAgIH0sXG4gICAgcnVuOiB7XG4gICAgICAgIGxhYmVsOiAn6L+Q6KGMJyxcbiAgICB9LFxufTtcbiJdfQ==