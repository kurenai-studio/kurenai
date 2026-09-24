import { _decorator, Component } from 'cc';
import { MainView } from '../game/MainView';

const { ccclass } = _decorator;

/**
 * Kurenai entry point. main.scene references this script by uuid, so keep the
 * file name, the .meta file and the class name unchanged.
 */
@ccclass('KurenaiBoot')
export class KurenaiBoot extends Component {
    start() {
        this.node.addComponent(MainView).bind(this.node);
    }
}
