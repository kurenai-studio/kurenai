'use strict';

module.exports = {
    title: 'WeChat Mini Game',
    options: {
        appid_holder: 'Cannot be empty, please fill in the project appid',
        separate_engine: 'Wechat Engine Plugin (Separate Engine)',
        separate_engine_tips: `This feature reduces the size of the first packet for each mini-game by sharing the global engine. (this feature only supports the official version of Cocos Creator and non-debug mode)<br/>
When enabled, if the engine already has a cache in the phone, the first package download will automatically remove the engine file and load the full version of the engine cached in the phone. <br/>
If there is no cache in the phone, the full first package will be loaded, and the complete first package will contain the culled engine `,
        localSeparateEngine: 'Allow use of local engine plug-in packages',
        localSeparateEngineTips: 'The engine plugin will be generated in the local game package when it is turned on, so you can experience the microsoft engine plugin when the editor engine version is not yet released',
        client_path_error: 'Can not find WeChat game develop program path [%{path}].',
        client_info_path_err: 'Can not find WeChat game develop program version information path [%{path}].',
        client_version_low: 'WeChat game develop version is too low, please upgrade to the newest version.',
        remote_server_address: 'Resource Server Address',
        remote_server_address_tips: 'The address of the server used to download the remote assets. ' +
            'Because the WeChat game limits the native packet size to 4 mb, if it is greater than that, ' +
            'it can save some assets to the server for download.',
        gen_open_data_context_template: 'Generate Open Data Context Template',
        gen_open_data_context_template_tips: 'Generate and use an open data context project template with a project directory named openDataContext, do not modify this directory name. If the directory already exists, it won\'t be overwritten.',
        build_sub: 'Mini Game Open Data Context Project',
        build_sub_tips: 'We recommend developers add leaderboard scenes running in the open data context in a separate Creator project and package them as a game package that can run in the open data context',
        orientation: 'Orientation',
        landscape: 'Landscape',
        portrait: 'Portrait',
        highPerformanceMode: 'High Performance Mode',
        wasm_subpackage: 'Engine Wasm Subpackage',
        wasm_subpackage_tips: 'build engine wasm module as subpackage to reduce code size.',
    },
    tips: {
        overwriteTemplate: 'Do you want to overwrite the source file {file} ?',
        overwrite: 'Overwrite',
        cancel: 'Cancel',
        wechatgame_app_path_empty: 'Please set WeChat Developer Tool Path at [Preference -> Program Manager].',
        build_path_contains_symbol: 'The package path is not allowed to contain special symbols ({symbol})! It will not be able to open in the developer tools!',
        separate_engine_with_wasm: 'After enabling Wechat Engine Plugin, the native code bundle mode is set to Wasm, and Wasm compression settings are ineffective.',
        separate_engine_only_in_normal_version: 'Separate engine is only available in official releases of Cocos.',
        templateVersionWarning:
            'The version of build-template is not equal to this editor, that may cause some error, please update your build template.',
        pleaseRead: 'Please read',
        weixinDocs: 'Weixin Docs',
        enableHighPerformanceMode: 'and enable the high performance mode in Weixin Official Accounts Platform.',
    },
    error: {
        separate_engine: 'The separate engine feature only supports the official version of Cocos Creator and the internal engine',
    },
    run: {
        label: 'Run',
        description: 'Launch the built game in WeChat DevTools',
    },
    program: {
        wechatDevtools: 'Wechat Devtools',
    },
};