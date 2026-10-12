'use strict';

module.exports = {
    title: '微信小游戏',
    options: {
        appid_holder: '不能为空，请填写项目 appid',
        separate_engine: '启用微信引擎插件（分离引擎）',
        separate_engine_tips: `该功能是通过共享全局引擎，来减小每个小游戏的首包大小。（仅支持 Cocos Creator 正式版本和非调试模式）<br/>
        启用后，如果引擎在手机中已经有缓存，首包下载时将会自动剔除引擎文件，加载手机中缓存的完整版引擎。<br/>
        如果手机中没有缓存，将会加载完整首包，完整首包里会包含剔除后的引擎`,
        localSeparateEngine: '允许使用本地引擎插件包',
        localSeparateEngineTips: '开启后将会在本地游戏包内生成引擎插件，可在编辑器引擎版本尚未发布时体验微信引擎插件',
        client_path_error: '找不到微信开发程序路径 [%{path}]。',
        client_info_path_err: '找不到微信开发程序版本信息路径 [%{path}]。',
        client_version_low: '微信开发程序版本过低，不能享用所有功能，请尽快升级。',
        remote_server_address: '资源服务器地址',
        remote_server_address_tips: '用于下载远程资源的服务器地址，由于微信小游戏限制原生包为 4 MB，如果大于的话可以把部分资源存放到服务器进行下载',
        gen_open_data_context_template: '生成开放数据域工程模版',
        gen_open_data_context_template_tips: '生成并使用开放数据域工程模版，工程目录名为 openDataContext，请不要修改这个目录名，如果构建路径已经存在了，则不会覆盖',
        build_sub: '小游戏开放数据域工程',
        build_sub_tips: '我们推荐开发者在独立的 Creator 项目中添加开放数据域中运行的排行榜场景，并打包为开放数据域中可运行的游戏包',
        orientation: '设备方向',
        landscape: '横屏',
        portrait: '竖屏',
        highPerformanceMode: '高性能模式',
        wasm_subpackage: '引擎原生代码(wasm/asmjs)分包',
        wasm_subpackage_tips: '将引擎原生代码模块作为小游戏分包，以减少主包包体。',
    },
    tips: {
        overwriteTemplate: '模板文件已存在，是否替换源文件 {file} ？',
        overwrite: '替换',
        cancel: '取消',
        wechatgame_app_path_empty: '请在 [偏好设置 -> 程序管理器] 中设置微信开发者工具路径。',
        build_path_contains_symbol: '微信包路径中包含特殊符号({symbol})可能无法在对应平台的开发者工具中直接运行，请更改路径!',
        separate_engine_with_wasm: '启用微信引擎分离后，原生代码打包模式为 Wasm 且 Wasm 压缩设置无效',
        separate_engine_only_in_normal_version: '引擎分离仅在 Cocos 正式版中可用。',
        templateVersionWarning: '构建模板的版本与当前编辑器版本不一致，可能会导致一些错误，请更新您的构建模板。',
        pleaseRead: '请阅读',
        weixinDocs: '微信官方文档',
        enableHighPerformanceMode: '并开通高性能模式开关。',
    },
    error: {
        separate_engine: '微信引擎插件功能仅支持 Cocos Creator 正式版本并使用内置引擎',
    },
    run: {
        label: '运行',
        description: '在微信开发者工具中启动当前构建产物',
    },
    program: {
        wechatDevtools: '微信开发者工具',
    },
};