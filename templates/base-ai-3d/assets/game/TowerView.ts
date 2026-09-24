import { _decorator, Component, Node } from 'cc';
import type { IView } from '../kurenai/IView';

const { ccclass } = _decorator;

/** Behaviour for `resources/prefabs/Tower.prefab`. */
@ccclass('TowerView')
export class TowerView extends Component implements IView {
    private ball: Node | null = null;
    private time = 0;

    bind(root: Node): void {
        this.ball = root.getChildByPath('Ball');
    }

    update(dt: number): void {
        this.time += dt;
        this.node.setRotationFromEuler(0, this.time * 30, 0);
        this.ball?.setPosition(0, 1.2 + Math.abs(Math.sin(this.time * 3)) * 0.6, 0);
    }
}
