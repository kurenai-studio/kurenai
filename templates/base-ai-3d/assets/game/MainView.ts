import { _decorator, Component, Node, UITransform } from 'cc';
import type { IView } from '../kurenai/IView';
import { addLabel, ensureCanvas, loadPrefab } from '../kurenai/helpers';
import { TowerView } from './TowerView';

const { ccclass } = _decorator;

@ccclass('MainView')
export class MainView extends Component implements IView {
    bind(root: Node): void {
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
