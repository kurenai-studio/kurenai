import {
    Camera,
    Canvas,
    Color,
    instantiate,
    Label,
    Layers,
    Node,
    Prefab,
    resources,
    UITransform,
    Widget,
    view,
} from 'cc';

/** Loads `assets/resources/<path>.prefab` and returns a new instance. */
export function loadPrefab(path: string): Promise<Node> {
    return new Promise((resolve, reject) => {
        resources.load(path, Prefab, (err, prefab) => (err ? reject(err) : resolve(instantiate(prefab))));
    });
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
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = options.fontSize ?? 24;
    label.lineHeight = label.fontSize + 4;
    label.color = options.color ?? Color.WHITE;
    return label;
}
