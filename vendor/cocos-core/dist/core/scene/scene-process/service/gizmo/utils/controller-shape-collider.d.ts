import { Component } from 'cc';
/**
 * 用于 Controller 碰撞检测的标记组件
 * 编辑器版本使用 @ccclass 和 @property 装饰器，此处简化为纯 Component 子类
 */
export declare class ControllerShapeCollider extends Component {
    isDetectMesh: boolean;
    isRender: boolean;
    onLoad(): void;
}
