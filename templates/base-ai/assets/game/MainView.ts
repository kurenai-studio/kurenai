import { _decorator, Color, Component, Graphics, Node } from 'cc';
import type { IView } from '../kurenai/IView';
import { addLabel } from '../kurenai/helpers';

const { ccclass } = _decorator;

@ccclass('MainView')
export class MainView extends Component implements IView {
    private box: Node | null = null;
    private time = 0;

    bind(root: Node): void {
        const box = new Node('Box');
        root.addChild(box);
        const graphics = box.addComponent(Graphics);
        graphics.fillColor = new Color(80, 160, 255, 255);
        graphics.rect(-60, -60, 120, 120);
        graphics.fill();
        this.box = box;

        addLabel(root, 'Hello Kurenai', { name: 'Title', fontSize: 32, y: 160 });
    }

    update(dt: number): void {
        this.time += dt;
        this.box?.setPosition(Math.sin(this.time) * 200, 0, 0);
    }
}
