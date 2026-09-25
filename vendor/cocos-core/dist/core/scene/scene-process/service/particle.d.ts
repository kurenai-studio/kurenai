import { Component } from 'cc';
import { BaseService } from './core';
import { IParticleService } from '../../common';
export declare class ParticleService extends BaseService<Record<string, never>> implements IParticleService {
    private _selectedUUIDs;
    private _stoppedSet;
    private _getSelectedParticleSystemComponents;
    onSelectionSelect(path: string, paths: string[]): void;
    onSelectionUnselect(path: string, paths: string[]): void;
    onSelectionClear(): void;
    onComponentAdded(comp: Component): void;
    onEditorDisposed(): void;
    /**
     * 请求粒子系统运行时的数据，与 cocos-editor ParticleManager.queryPlayInfo 一致。
     * @param uuid 粒子组件的 uuid
     */
    queryPlayInfo(uuid: string): {
        speed: any;
        time: number;
        particle: any;
        isPlaying: boolean;
    } | null;
    /**
     * 设置粒子的运行速度，与 cocos-editor ParticleManager.setPlaySpeed 一致。
     * @param uuid 组件的 uuid
     * @param speed 粒子组件的运行速度
     */
    setPlaySpeed(uuid: string, speed: number): void;
    /**
     * 这个播放的行为会将递归找当前选中节点的父节点，直到找到非包含粒子组件的节点为止，将找到的父节点一起播放。
     * 与 cocos-editor ParticleManager.play 一致。
     */
    play(): void;
    /**
     * 这个停止的行为会将递归找当前选中节点父节点，直到找到非包含粒子组件的节点为止，将找到的父节点一起停止。
     * 与 cocos-editor ParticleManager.stop 一致。
     */
    stop(): void;
    /**
     * 这个暂停的行为会将递归找当前选中的节点的父节点，直到找到非包含粒子组件的节点为止，将找到的父节点一起暂停。
     * 与 cocos-editor ParticleManager.pause 一致。
     */
    pause(): void;
    /**
     * 重新开始播放选中的粒子，与 cocos-editor ParticleManager.restart 一致。
     */
    restart(): void;
    /**
     * 通过组件 uuid 查找粒子组件实例。
     */
    private _findComponentByUuid;
}
