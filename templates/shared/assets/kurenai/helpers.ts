import {
    Camera,
    Canvas,
    Color,
    EventMouse,
    EventTouch,
    instantiate,
    Label,
    Layers,
    Node,
    Prefab,
    ResolutionPolicy,
    resources,
    UIOpacity,
    UITransform,
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

/**
 * Instantiates the prefab generated for an imported .glb / .gltf / .fbx, e.g.
 * `loadModel('models/tower')` for `assets/resources/models/tower.glb`.
 * The model's main asset is not instantiable; its prefab lives at
 * `<path>/<file name>` with every mesh and material already wired.
 */
export function loadModel(path: string): Promise<Node> {
    const base = path.replace(/\.(glb|gltf|fbx)$/i, '');
    const own = `${base}/${base.split('/').pop()}`;
    const prefabPath = resources.getInfoWithPath(own, Prefab)
        ? own
        : resources.getDirWithPath(base, Prefab)[0]?.path;
    if (!prefabPath) {
        return Promise.reject(new Error(`No model prefab at resources/${base} — is the file under assets/resources/?`));
    }
    return loadPrefab(prefabPath);
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
