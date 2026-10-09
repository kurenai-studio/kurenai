import {
    assetManager,
    Camera,
    Canvas,
    Color,
    EffectAsset,
    EventMouse,
    EventTouch,
    instantiate,
    Label,
    Layers,
    Material,
    Mesh,
    MeshRenderer,
    Node,
    Prefab,
    primitives,
    RenderTexture,
    ResolutionPolicy,
    resources,
    Texture2D,
    toDegree,
    UIOpacity,
    UITransform,
    utils,
    view,
    Widget,
} from 'cc';

/** Loads `assets/resources/<path>.prefab` and returns a new instance. */
export function loadPrefab(path: string): Promise<Node> {
    return new Promise((resolve, reject) => {
        resources.load(path, Prefab, (err, prefab) => {
            if (!err) return resolve(instantiate(prefab));
            if (resources.getDirWithPath(path, Prefab).length) {
                err.message += ` — "${path}" is a model; use loadModel("${path}")`;
            }
            reject(err);
        });
    });
}

function modelPrefabPath(path: string): string {
    const base = path.replace(/\.(glb|gltf|fbx)$/i, '');
    const own = `${base}/${base.split('/').pop()}`;
    const prefabPath = resources.getInfoWithPath(own, Prefab)
        ? own
        : resources.getDirWithPath(base, Prefab)[0]?.path;
    if (!prefabPath) {
        throw new Error(`No model prefab at resources/${base} — is the file under assets/resources/?`);
    }
    return prefabPath;
}

/**
 * Instantiates the prefab generated for an imported .glb / .gltf / .fbx, e.g.
 * `loadModel('models/tower')` for `assets/resources/models/tower.glb`.
 * The model's main asset is not instantiable; its prefab lives at
 * `<path>/<file name>` with every mesh and material already wired.
 */
export function loadModel(path: string): Promise<Node> {
    try {
        return loadPrefab(modelPrefabPath(path));
    } catch (err) {
        return Promise.reject(err);
    }
}

const modelPrefabs = new Map<string, Promise<Prefab>>();

/**
 * Loads a model's prefab once. Keep the result and call `instantiate(prefab)` for
 * every copy (enemies, props) instead of awaiting `loadModel` each time.
 */
export function preloadModel(path: string): Promise<Prefab> {
    let pending = modelPrefabs.get(path);
    if (!pending) {
        pending = new Promise<Prefab>((resolve, reject) => {
            let prefabPath: string;
            try {
                prefabPath = modelPrefabPath(path);
            } catch (err) {
                return reject(err);
            }
            resources.load(prefabPath, Prefab, (err, prefab) => (err ? reject(err) : resolve(prefab)));
        });
        pending.catch(() => modelPrefabs.delete(path));
        modelPrefabs.set(path, pending);
    }
    return pending;
}

/**
 * Swaps materials under `root` by the name the model file gave them, e.g.
 * `replaceMaterials(node, { M_Knight: knightMat })`. Returns how many slots changed.
 */
export function replaceMaterials(root: Node, byName: Record<string, Material>): number {
    let changed = 0;
    for (const renderer of root.getComponentsInChildren(MeshRenderer)) {
        renderer.sharedMaterials.forEach((mat, index) => {
            const next = mat && byName[mat.name];
            if (next) {
                renderer.setSharedMaterial(next, index);
                changed += 1;
            }
        });
    }
    return changed;
}

/**
 * Y rotation in degrees that turns a glTF model (front +Z) toward direction (dx, dz):
 * `node.setRotationFromEuler(0, yawToward(dx, dz), 0)`.
 * Cocos' own forward (`Node.forward`, cameras, lookAt) is -Z instead.
 */
export function yawToward(dx: number, dz: number): number {
    return toDegree(Math.atan2(dx, dz));
}

/** Design resolution from project view settings (not the live viewport). */
export function getDesignSize(): { width: number; height: number } {
    const size = view.getDesignResolutionSize();
    return { width: size.width, height: size.height };
}

/**
 * Visible size of the current viewport. Prefer `getDesignSize()` for layout that
 * should match the project's design resolution; `view.getVisibleSize()` follows
 * the actual window / device aspect (e.g. 960×432).
 */
export function getVisibleSize(): { width: number; height: number } {
    const size = view.getVisibleSize();
    return { width: size.width, height: size.height };
}

/**
 * Returns the scene's Canvas, or creates a full-screen one under `host` with its
 * own UI camera (3D scenes have no camera that renders the UI_2D layer).
 */
export function ensureCanvas(host: Node): Canvas {
    const existing = host.scene?.getComponentInChildren(Canvas);
    if (existing) return existing;
    const node = new Node('Canvas');
    node.layer = Layers.Enum.UI_2D;
    host.addChild(node);
    const canvas = node.addComponent(Canvas);
    const size = view.getVisibleSize();
    node.getComponent(UITransform)!.setContentSize(size.width, size.height);

    const cameraNode = new Node('UICamera');
    cameraNode.layer = Layers.Enum.UI_2D;
    node.addChild(cameraNode);
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.visibility = Layers.Enum.UI_2D;
    camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
    camera.priority = 1073741824;
    canvas.cameraComponent = camera;

    const widget = node.addComponent(Widget);
    widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
    widget.top = widget.bottom = widget.left = widget.right = 0;
    return canvas;
}

export function addLabel(
    parent: Node,
    text: string,
    options: { name?: string; fontSize?: number; color?: Color; x?: number; y?: number } = {},
): Label {
    const node = new Node(options.name ?? 'Label');
    node.layer = parent.layer;
    parent.addChild(node);
    node.setPosition(options.x ?? 0, options.y ?? 0, 0);
    // Runtime-created labels need UIOpacity; setting opacity without it throws.
    if (!node.getComponent(UIOpacity)) node.addComponent(UIOpacity);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = options.fontSize ?? 24;
    label.lineHeight = label.fontSize + 4;
    label.color = options.color ?? Color.WHITE;
    return label;
}

export type PointerMoveHandler = (uiX: number, uiY: number, event: EventTouch | EventMouse) => void;

/**
 * Listen for pointer move on desktop and touch. Desktop hover does not emit
 * `TOUCH_MOVE` unless a button is held — also bind `MOUSE_MOVE`.
 */
export function onPointerMove(node: Node, handler: PointerMoveHandler): void {
    const fromTouch = (event: EventTouch) => {
        const loc = event.getUILocation();
        handler(loc.x, loc.y, event);
    };
    const fromMouse = (event: EventMouse) => {
        const loc = event.getUILocation();
        handler(loc.x, loc.y, event);
    };
    node.on(Node.EventType.TOUCH_MOVE, fromTouch);
    node.on(Node.EventType.MOUSE_MOVE, fromMouse);
}

/** Apply design resolution with SHOW_ALL (letterbox). Optional helper for layouts. */
export function useDesignResolution(width?: number, height?: number): void {
    const design = getDesignSize();
    view.setDesignResolutionSize(
        width ?? design.width,
        height ?? design.height,
        ResolutionPolicy.SHOW_ALL,
    );
}

/** Engine effects that exist but are not registered until something loads them. */
const BUILTIN_EFFECT_UUIDS: Record<string, string> = {
    'builtin-standard': 'c8f66d17-351a-48da-a12c-0212d28575c4',
    'builtin-toon': '9b20a514-6cc3-49de-b216-b6b863046249',
    'builtin-unlit': 'a3cd009f-0ab0-420d-9278-b9fdab939bbc',
    'advanced/water': '113a72d8-20cd-42cd-ba96-37cc1046971a',
    'advanced/glass': 'f288f946-150b-443d-b4b3-0227c5117c93',
    'advanced/sky': '6308c013-7d49-4160-9516-562dd205b480',
};

/**
 * Returns an engine effect such as `builtin-standard`, loading it on first use.
 * A Creator build only ships builtin effects that some asset references, so for
 * shipped content also keep a `.mtl` under `resources/` that uses the effect.
 */
export function loadBuiltinEffect(name: string): Promise<EffectAsset> {
    const ready = EffectAsset.get(name);
    if (ready) return Promise.resolve(ready);
    const uuid = BUILTIN_EFFECT_UUIDS[name];
    if (!uuid) {
        return Promise.reject(
            new Error(`Unknown builtin effect "${name}"; known: ${Object.keys(BUILTIN_EFFECT_UUIDS).join(', ')}`),
        );
    }
    return new Promise((resolve, reject) => {
        assetManager.loadAny({ uuid }, (err: Error | null, effect: EffectAsset) => (err ? reject(err) : resolve(effect)));
    });
}

/** Loads a project effect, e.g. `loadEffect('effects/water')` for `assets/resources/effects/water.effect`. */
export function loadEffect(path: string): Promise<EffectAsset> {
    return new Promise((resolve, reject) => {
        resources.load(path, EffectAsset, (err, effect) => (err ? reject(err) : resolve(effect)));
    });
}

/**
 * Uploads new geometry into a mesh made by `utils.MeshUtils.createDynamicMesh`.
 * `mesh.updateSubMesh` alone keeps drawing the old index/vertex count; the
 * renderer must be told too.
 */
export function updateDynamicMesh(
    renderer: MeshRenderer,
    geometry: primitives.IDynamicGeometry,
    primitiveIndex = 0,
): void {
    renderer.mesh!.updateSubMesh(primitiveIndex, geometry);
    renderer.onGeometryChanged();
}

/**
 * A texture you fill from typed arrays every frame (simulation fields, lookup
 * tables). `float: true` stores RGBA32F, sampled with linear filtering on WebGL2.
 */
export function createDataTexture(width: number, height: number, options: { float?: boolean } = {}): Texture2D {
    const texture = new Texture2D();
    texture.reset({
        width,
        height,
        format: options.float ? Texture2D.PixelFormat.RGBA32F : Texture2D.PixelFormat.RGBA8888,
    });
    texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
    texture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
    return texture;
}

export interface TexturePass {
    camera: Camera;
    /** Draws the pass geometry; swap `renderer.mesh` or the material at any time. */
    renderer: MeshRenderer;
}

export interface TexturePassOptions {
    /** Camera priority; passes run in ascending order before the scene camera. Default -100. */
    priority?: number;
    /**
     * Geometry to draw instead of the full-screen quad (e.g. a grid displaced in
     * the vertex shader). Keep mesh bounds inside local x, y in [-1, 1].
     */
    mesh?: Mesh;
}

let texturePasses = 0;

/**
 * Renders `material` into `target` every frame (caustics maps, blurs, baked
 * lookups). `target` is always 8 bits per channel; keep float simulation state
 * in a `createDataTexture` instead.
 */
export function createTexturePass(
    scene: Node,
    material: Material,
    target: RenderTexture,
    options: TexturePassOptions = {},
): TexturePass {
    const slot = texturePasses++;
    if (slot >= 20) throw new Error('createTexturePass: at most 20 passes (one user layer each)');
    const layer = 1 << slot;
    const x = 100000 + slot * 100;

    const node = new Node(`TexturePass${slot}`);
    node.layer = layer;
    node.setPosition(x, 0, 0);
    scene.addChild(node);
    const meshRenderer = node.addComponent(MeshRenderer);
    meshRenderer.mesh = options.mesh ?? utils.MeshUtils.createMesh(primitives.quad());
    meshRenderer.setSharedMaterial(material, 0);

    const cameraNode = new Node(`TexturePassCamera${slot}`);
    cameraNode.setPosition(x, 0, 10);
    scene.addChild(cameraNode);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 1;
    camera.near = 1;
    camera.far = 20;
    camera.visibility = layer;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = new Color(0, 0, 0, 0);
    camera.priority = options.priority ?? -100;
    camera.targetTexture = target;
    return { camera, renderer: meshRenderer };
}
