"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetHandlerInfos = void 0;
exports.assetHandlerInfos = [
    {
        name: 'directory',
        extensions: ['*'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/directory')))).default;
        }
    },
    {
        name: 'unknown',
        extensions: ['*'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/unknown')))).default;
        }
    },
    {
        name: 'text',
        extensions: [
            '.txt',
            '.html',
            '.htm',
            '.xml',
            '.css',
            '.less',
            '.scss',
            '.stylus',
            '.yaml',
            '.ini',
            '.csv',
            '.proto',
            '.ts',
            '.tsx',
            '.md',
            '.markdown'
        ],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/text')))).default;
        }
    },
    {
        name: 'json',
        extensions: ['.json'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/json')))).default;
        }
    },
    {
        name: 'spine-data',
        extensions: ['.json', '.skel'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/spine')))).default;
        }
    },
    {
        name: 'dragonbones',
        extensions: ['.json', '.dbbin'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/dragonbones/dragonbones')))).default;
        }
    },
    {
        name: 'dragonbones-atlas',
        extensions: ['.json'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/dragonbones/dragonbones-atlas')))).default;
        }
    },
    {
        name: 'terrain',
        extensions: ['.terrain'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/terrain')))).default;
        }
    },
    {
        name: 'javascript',
        extensions: ['.js', '.cjs', '.mjs'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/javascript')))).default;
        }
    },
    {
        name: 'typescript',
        extensions: ['.ts'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/typescript')))).default;
        }
    },
    {
        name: 'scene',
        extensions: ['.scene', '.fire'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/scene')))).default;
        }
    },
    {
        name: 'prefab',
        extensions: ['.prefab'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/scene/prefab')))).default;
        }
    },
    {
        name: 'sprite-frame',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/sprite-frame')))).default;
        }
    },
    {
        name: 'tiled-map',
        extensions: ['.tmx'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/tiled-map')))).default;
        }
    },
    {
        name: 'buffer',
        extensions: ['.bin'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/buffer')))).default;
        }
    },
    {
        name: 'image',
        extensions: [
            '.jpg',
            '.png',
            '.jpeg',
            '.webp',
            '.tga',
            '.hdr',
            '.bmp',
            '.psd',
            '.tif',
            '.tiff',
            '.exr',
            '.znt'
        ],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/image')))).default;
        }
    },
    {
        name: 'sign-image',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/image/sign')))).default;
        }
    },
    {
        name: 'alpha-image',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/image/alpha')))).default;
        }
    },
    {
        name: 'texture',
        extensions: ['.texture'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/texture')))).default;
        }
    },
    {
        name: 'texture-cube',
        extensions: ['.cubemap'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/texture-cube')))).default;
        }
    },
    {
        name: 'erp-texture-cube',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/erp-texture-cube')))).default;
        }
    },
    {
        name: 'render-texture',
        extensions: ['.rt'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/render-texture')))).default;
        }
    },
    {
        name: 'texture-cube-face',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/texture-cube-face')))).default;
        }
    },
    {
        name: 'rt-sprite-frame',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/render-texture/rt-sprite-frame')))).default;
        }
    },
    {
        name: 'gltf',
        extensions: ['.gltf', '.glb'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf')))).default;
        }
    },
    {
        name: 'gltf-mesh',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/mesh')))).default;
        }
    },
    {
        name: 'gltf-animation',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/animation')))).default;
        }
    },
    {
        name: 'gltf-skeleton',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/skeleton')))).default;
        }
    },
    {
        name: 'gltf-material',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/material')))).default;
        }
    },
    {
        name: 'gltf-scene',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/prefab')))).default;
        }
    },
    {
        name: 'gltf-embeded-image',
        extensions: [],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/gltf/image')))).default;
        }
    },
    {
        name: 'fbx',
        extensions: ['.fbx'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/fbx')))).default;
        }
    },
    {
        name: 'material',
        extensions: ['.mtl'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/material')))).default;
        }
    },
    {
        name: 'physics-material',
        extensions: ['.pmtl'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/physics-material')))).default;
        }
    },
    {
        name: 'effect',
        extensions: ['.effect'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/effect')))).default;
        }
    },
    {
        name: 'effect-header',
        extensions: ['.chunk'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/effect-header')))).default;
        }
    },
    {
        name: 'audio-clip',
        extensions: [
            '.mp3',
            '.wav',
            '.ogg',
            '.aac',
            '.pcm',
            '.m4a'
        ],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/audio-clip')))).default;
        }
    },
    {
        name: 'animation-clip',
        extensions: ['.anim'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/animation-clip')))).default;
        }
    },
    {
        name: 'animation-graph',
        extensions: ['.animgraph'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/animation-graph')))).default;
        }
    },
    {
        name: 'animation-graph-variant',
        extensions: ['.animgraphvari'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/animation-graph-variant')))).default;
        }
    },
    {
        name: 'animation-mask',
        extensions: ['.animask'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/animation-mask')))).default;
        }
    },
    {
        name: 'ttf-font',
        extensions: ['.ttf'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/ttf-font')))).default;
        }
    },
    {
        name: 'bitmap-font',
        extensions: ['.fnt'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/bitmap-font')))).default;
        }
    },
    {
        name: 'particle',
        extensions: ['.plist'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/particle')))).default;
        }
    },
    {
        name: 'sprite-atlas',
        extensions: ['.plist'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/texture-packer')))).default;
        }
    },
    {
        name: 'auto-atlas',
        extensions: ['.pac'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/auto-atlas')))).default;
        }
    },
    {
        name: 'label-atlas',
        extensions: ['.labelatlas'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/label-atlas')))).default;
        }
    },
    {
        name: 'render-pipeline',
        extensions: ['.rpp'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/render-pipeline')))).default;
        }
    },
    {
        name: 'render-stage',
        extensions: ['.stg'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/render-stage')))).default;
        }
    },
    {
        name: 'render-flow',
        extensions: ['.flow'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/render-flow')))).default;
        }
    },
    {
        name: 'instantiation-material',
        extensions: ['.material'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/instantiation-asset/material')))).default;
        }
    },
    {
        name: 'instantiation-mesh',
        extensions: ['.mesh'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/instantiation-asset/mesh')))).default;
        }
    },
    {
        name: 'instantiation-skeleton',
        extensions: ['.skeleton'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/instantiation-asset/skeleton')))).default;
        }
    },
    {
        name: 'instantiation-animation',
        extensions: ['.animation'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/instantiation-asset/animation')))).default;
        }
    },
    {
        name: 'video-clip',
        extensions: ['.mp4'],
        load: async () => {
            return (await Promise.resolve().then(() => __importStar(require('./assets/video-clip')))).default;
        }
    }
];
