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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU9hLFFBQUEsaUJBQWlCLEdBQXVCO0lBQ2pEO1FBQ0ksSUFBSSxFQUFFLFdBQVc7UUFDakIsVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFDO1FBQ2pCLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtZQUNiLE9BQU8sQ0FBQyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3hELENBQUM7S0FDSjtJQUNEO1FBQ0ksSUFBSSxFQUFFLFNBQVM7UUFDZixVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFDakIsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2IsT0FBTyxDQUFDLHdEQUFhLGtCQUFrQixHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDdEQsQ0FBQztLQUNKO0lBQ0Q7UUFDSSxJQUFJLEVBQUUsTUFBTTtRQUNaLFVBQVUsRUFBRTtZQUNSLE1BQU07WUFDTixPQUFPO1lBQ1AsTUFBTTtZQUNOLE1BQU07WUFDTixNQUFNO1lBQ04sT0FBTztZQUNQLE9BQU87WUFDUCxTQUFTO1lBQ1QsT0FBTztZQUNQLE1BQU07WUFDTixNQUFNO1lBQ04sUUFBUTtZQUNSLEtBQUs7WUFDTCxNQUFNO1lBQ04sS0FBSztZQUNMLFdBQVc7U0FDZDtRQUNELElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtZQUNiLE9BQU8sQ0FBQyx3REFBYSxlQUFlLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNuRCxDQUFDO0tBQ0o7SUFDRDtRQUNJLElBQUksRUFBRSxNQUFNO1FBQ1osVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3JCLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtZQUNi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QyxPQUFPLENBQUM7UUFDekQsQ0FBQztLQUNKO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuZXhwb3J0IGludGVyZmFjZSBBc3NldEhhbmRsZXJJbmZvIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZXh0ZW5zaW9uczogc3RyaW5nW107XG4gICAgbG9hZDogKCkgPT4gQXNzZXRIYW5kbGVyIHwgUHJvbWlzZTxBc3NldEhhbmRsZXI+O1xufVxuXG5leHBvcnQgY29uc3QgYXNzZXRIYW5kbGVySW5mb3M6IEFzc2V0SGFuZGxlckluZm9bXSA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdkaXJlY3RvcnknLFxuICAgICAgICBleHRlbnNpb25zOiBbJyonXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2RpcmVjdG9yeScpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICd1bmtub3duJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycqJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy91bmtub3duJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3RleHQnLFxuICAgICAgICBleHRlbnNpb25zOiBbXG4gICAgICAgICAgICAnLnR4dCcsXG4gICAgICAgICAgICAnLmh0bWwnLFxuICAgICAgICAgICAgJy5odG0nLFxuICAgICAgICAgICAgJy54bWwnLFxuICAgICAgICAgICAgJy5jc3MnLFxuICAgICAgICAgICAgJy5sZXNzJyxcbiAgICAgICAgICAgICcuc2NzcycsXG4gICAgICAgICAgICAnLnN0eWx1cycsXG4gICAgICAgICAgICAnLnlhbWwnLFxuICAgICAgICAgICAgJy5pbmknLFxuICAgICAgICAgICAgJy5jc3YnLFxuICAgICAgICAgICAgJy5wcm90bycsXG4gICAgICAgICAgICAnLnRzJyxcbiAgICAgICAgICAgICcudHN4JyxcbiAgICAgICAgICAgICcubWQnLFxuICAgICAgICAgICAgJy5tYXJrZG93bidcbiAgICAgICAgXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3RleHQnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnanNvbicsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmpzb24nXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2pzb24nKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnc3BpbmUtZGF0YScsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmpzb24nLCAnLnNrZWwnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3NwaW5lJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2RyYWdvbmJvbmVzJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuanNvbicsICcuZGJiaW4nXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2RyYWdvbmJvbmVzL2RyYWdvbmJvbmVzJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2RyYWdvbmJvbmVzLWF0bGFzJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuanNvbiddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvZHJhZ29uYm9uZXMvZHJhZ29uYm9uZXMtYXRsYXMnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAndGVycmFpbicsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLnRlcnJhaW4nXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3RlcnJhaW4nKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnamF2YXNjcmlwdCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmpzJywgJy5janMnLCAnLm1qcyddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvamF2YXNjcmlwdCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICd0eXBlc2NyaXB0JyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycudHMnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3R5cGVzY3JpcHQnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnc2NlbmUnLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5zY2VuZScsICcuZmlyZSddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvc2NlbmUnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncHJlZmFiJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucHJlZmFiJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9zY2VuZS9wcmVmYWInKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnc3ByaXRlLWZyYW1lJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9zcHJpdGUtZnJhbWUnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAndGlsZWQtbWFwJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycudG14J10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy90aWxlZC1tYXAnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYnVmZmVyJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuYmluJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9idWZmZXInKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnaW1hZ2UnLFxuICAgICAgICBleHRlbnNpb25zOiBbXG4gICAgICAgICAgICAnLmpwZycsXG4gICAgICAgICAgICAnLnBuZycsXG4gICAgICAgICAgICAnLmpwZWcnLFxuICAgICAgICAgICAgJy53ZWJwJyxcbiAgICAgICAgICAgICcudGdhJyxcbiAgICAgICAgICAgICcuaGRyJyxcbiAgICAgICAgICAgICcuYm1wJyxcbiAgICAgICAgICAgICcucHNkJyxcbiAgICAgICAgICAgICcudGlmJyxcbiAgICAgICAgICAgICcudGlmZicsXG4gICAgICAgICAgICAnLmV4cicsXG4gICAgICAgICAgICAnLnpudCdcbiAgICAgICAgXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2ltYWdlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3NpZ24taW1hZ2UnLFxuICAgICAgICBleHRlbnNpb25zOiBbXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2ltYWdlL3NpZ24nKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYWxwaGEtaW1hZ2UnLFxuICAgICAgICBleHRlbnNpb25zOiBbXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2ltYWdlL2FscGhhJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3RleHR1cmUnLFxuICAgICAgICBleHRlbnNpb25zOiBbJy50ZXh0dXJlJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy90ZXh0dXJlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3RleHR1cmUtY3ViZScsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmN1YmVtYXAnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3RleHR1cmUtY3ViZScpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdlcnAtdGV4dHVyZS1jdWJlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9lcnAtdGV4dHVyZS1jdWJlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3JlbmRlci10ZXh0dXJlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucnQnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3JlbmRlci10ZXh0dXJlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3RleHR1cmUtY3ViZS1mYWNlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy90ZXh0dXJlLWN1YmUtZmFjZScpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdydC1zcHJpdGUtZnJhbWUnLFxuICAgICAgICBleHRlbnNpb25zOiBbXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3JlbmRlci10ZXh0dXJlL3J0LXNwcml0ZS1mcmFtZScpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdnbHRmJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuZ2x0ZicsICcuZ2xiJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9nbHRmJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2dsdGYtbWVzaCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFtdLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvZ2x0Zi9tZXNoJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2dsdGYtYW5pbWF0aW9uJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9nbHRmL2FuaW1hdGlvbicpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdnbHRmLXNrZWxldG9uJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9nbHRmL3NrZWxldG9uJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2dsdGYtbWF0ZXJpYWwnLFxuICAgICAgICBleHRlbnNpb25zOiBbXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2dsdGYvbWF0ZXJpYWwnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnZ2x0Zi1zY2VuZScsXG4gICAgICAgIGV4dGVuc2lvbnM6IFtdLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvZ2x0Zi9wcmVmYWInKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnZ2x0Zi1lbWJlZGVkLWltYWdlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9nbHRmL2ltYWdlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2ZieCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmZieCddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvZmJ4JykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ21hdGVyaWFsJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycubXRsJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9tYXRlcmlhbCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdwaHlzaWNzLW1hdGVyaWFsJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucG10bCddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvcGh5c2ljcy1tYXRlcmlhbCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdlZmZlY3QnLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5lZmZlY3QnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2VmZmVjdCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdlZmZlY3QtaGVhZGVyJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuY2h1bmsnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2VmZmVjdC1oZWFkZXInKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYXVkaW8tY2xpcCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFtcbiAgICAgICAgICAgICcubXAzJyxcbiAgICAgICAgICAgICcud2F2JyxcbiAgICAgICAgICAgICcub2dnJyxcbiAgICAgICAgICAgICcuYWFjJyxcbiAgICAgICAgICAgICcucGNtJyxcbiAgICAgICAgICAgICcubTRhJ1xuICAgICAgICBdLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvYXVkaW8tY2xpcCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdhbmltYXRpb24tY2xpcCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmFuaW0nXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2FuaW1hdGlvbi1jbGlwJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2FuaW1hdGlvbi1ncmFwaCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmFuaW1ncmFwaCddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvYW5pbWF0aW9uLWdyYXBoJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2FuaW1hdGlvbi1ncmFwaC12YXJpYW50JyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuYW5pbWdyYXBodmFyaSddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvYW5pbWF0aW9uLWdyYXBoLXZhcmlhbnQnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYW5pbWF0aW9uLW1hc2snLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5hbmltYXNrJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9hbmltYXRpb24tbWFzaycpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICd0dGYtZm9udCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLnR0ZiddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvdHRmLWZvbnQnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYml0bWFwLWZvbnQnLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5mbnQnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2JpdG1hcC1mb250JykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3BhcnRpY2xlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucGxpc3QnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL3BhcnRpY2xlJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3Nwcml0ZS1hdGxhcycsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLnBsaXN0J10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy90ZXh0dXJlLXBhY2tlcicpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdhdXRvLWF0bGFzJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucGFjJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9hdXRvLWF0bGFzJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2xhYmVsLWF0bGFzJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycubGFiZWxhdGxhcyddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvbGFiZWwtYXRsYXMnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncmVuZGVyLXBpcGVsaW5lJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycucnBwJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9yZW5kZXItcGlwZWxpbmUnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncmVuZGVyLXN0YWdlJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycuc3RnJ10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9yZW5kZXItc3RhZ2UnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncmVuZGVyLWZsb3cnLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5mbG93J10sXG4gICAgICAgIGxvYWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL2Fzc2V0cy9yZW5kZXItZmxvdycpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdpbnN0YW50aWF0aW9uLW1hdGVyaWFsJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycubWF0ZXJpYWwnXSxcbiAgICAgICAgbG9hZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vYXNzZXRzL2luc3RhbnRpYXRpb24tYXNzZXQvbWF0ZXJpYWwnKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnaW5zdGFudGlhdGlvbi1tZXNoJyxcbiAgICAgICAgZXh0ZW5zaW9uczogWycubWVzaCddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9tZXNoJykpLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2luc3RhbnRpYXRpb24tc2tlbGV0b24nLFxuICAgICAgICBleHRlbnNpb25zOiBbJy5za2VsZXRvbiddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9za2VsZXRvbicpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdpbnN0YW50aWF0aW9uLWFuaW1hdGlvbicsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLmFuaW1hdGlvbiddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9hbmltYXRpb24nKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAndmlkZW8tY2xpcCcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsnLm1wNCddLFxuICAgICAgICBsb2FkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IGltcG9ydCgnLi9hc3NldHMvdmlkZW8tY2xpcCcpKS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgfVxuXTsiXX0=