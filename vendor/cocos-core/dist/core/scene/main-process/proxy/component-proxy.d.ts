import { IAddComponentOptions, IQueryComponentOptions, IPublicComponentService } from '../../common';
import { IComponentInfo } from '../../common/cli/component';
import { ISetPropertyOptionsInfo } from '../../common/cli/component';
export interface IComponentProxy extends Omit<IPublicComponentService, 'add' | 'query' | 'setProperty' | 'getPathByUuid'> {
    add(params: IAddComponentOptions): Promise<IComponentInfo>;
    query(params: IQueryComponentOptions): Promise<IComponentInfo | null>;
    setProperty(params: ISetPropertyOptionsInfo): Promise<boolean>;
}
export declare const ComponentProxy: IComponentProxy;
