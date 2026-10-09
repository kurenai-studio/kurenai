import {
    _decorator, Camera, Color, Component, DirectionalLight, director, Layers, Node, UITransform,
    renderer,
} from 'cc';
import type { IView } from '../kurenai/IView';
import { addLabel, ensureCanvas, loadPrefab } from '../kurenai/helpers';
import { TowerView } from './TowerView';

const { ccclass } = _decorator;

@ccclass('MainView')
export class MainView extends Component implements IView {
    bind(root: Node): void {
        const scene = director.getScene()!;
        // Canvas / UI cameras must draw only UI_2D on top. Their default visibility
        // also includes DEFAULT, which would draw every 3D mesh a second time, flat.
        for (const cam of scene.getComponentsInChildren(Camera)) {
            if (cam.visibility === Layers.Enum.UI_2D || cam.node.name.includes('UI')) {
                cam.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
                cam.priority = 1 << 30;
                cam.visibility = Layers.Enum.UI_2D;
            } else {
                cam.priority = 0;
            }
        }

        for (const light of scene.getComponentsInChildren(DirectionalLight)) {
            light.shadowEnabled = true;
            light.shadowPcf = 2;
            light.shadowFixedArea = false;
            light.shadowDistance = 20;
            light.shadowSaturation = 0.6;
        }
        const shadows = scene.globals.shadows;
        shadows.enabled = true;
        shadows.type = renderer.scene.ShadowType.ShadowMap;
        shadows.shadowMapSize = 2048;
        // Template HDR ambient can be too dark; lift it so unlit faces stay readable.
        scene.globals.ambient.skyLightingColor = new Color(110, 130, 160, 255);
        scene.globals.ambient.groundLightingColor = new Color(50, 50, 55, 255);

        void this.build(root);

        const canvas = ensureCanvas(root);
        const height = canvas.getComponent(UITransform)?.height ?? 640;
        addLabel(canvas.node, 'Hello Kurenai', { name: 'Title', fontSize: 32, y: height / 2 - 60 });
    }

    private async build(root: Node): Promise<void> {
        const [ground, tower] = await Promise.all([loadPrefab('prefabs/Ground'), loadPrefab('prefabs/Tower')]);
        root.addChild(ground);
        root.addChild(tower);
        tower.addComponent(TowerView).bind(tower);
    }
}
