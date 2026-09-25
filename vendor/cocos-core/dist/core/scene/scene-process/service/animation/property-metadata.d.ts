import { Component, Node } from 'cc';
import type { IAnimationPropertyInfo } from '../../../common';
import type { IAnimationPropertyMetadata } from './property-curve';
export declare function queryComponentAnimableProperties(component: Component): IAnimationPropertyInfo[];
export declare function queryAnimationPropertyMetadata(rootNode: Node, nodePath: string, propKey: string): IAnimationPropertyMetadata | null;
