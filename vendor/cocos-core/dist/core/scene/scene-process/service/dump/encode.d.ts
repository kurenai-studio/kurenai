import { IProperty } from '../../../@types/public';
import { IComponent, INode, IPrefab, IScene } from '../../../common';
import { Node } from 'cc';
export declare function encodePrefab(node: Node): IPrefab | null;
interface IEncodeNodeOptions {
    includeComponents?: boolean;
}
/**
 * 编码一个 node 数据
 * @param node
 */
export declare function encodeNode(node: Node, options?: IEncodeNodeOptions): INode;
/**
 * 编码一个场景数据
 * @param scene
 */
export declare function encodeScene(scene: any): IScene;
/**
 * 详细的编码 component
 * @param component
 */
export declare function encodeComponent(component: any): IComponent;
/**
 * 编码一个对象
 * @param object 编码对象
 * @param attributes 属性描述
 * @param owner 编码对象所属的对象
 * @param objectKey 输出有效信息，当前数据 key，以便问题排查
 */
export declare function encodeObject(object: any, attributes: any, owner?: any, objectKey?: string, isTemplate?: boolean): IProperty;
declare const _default: {
    encodeNode: typeof encodeNode;
    encodeScene: typeof encodeScene;
    encodeComponent: typeof encodeComponent;
    encodeObject: typeof encodeObject;
};
export default _default;
