'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DumpConverter = void 0;
class DumpConverter {
    static toNode(dump, options) {
        if ('isScene' in dump && dump.isScene) {
            return DumpConverter.sceneToNode(dump, options);
        }
        return DumpConverter.nodeToNode(dump, options);
    }
    static toScene(dump, options) {
        const d = dump;
        const identifier = d.__identifier__ ?? {};
        return {
            assetType: identifier.assetType ?? '',
            assetName: identifier.assetName ?? '',
            assetUuid: identifier.assetUuid ?? '',
            assetUrl: identifier.assetUrl ?? '',
            name: dump.name.value,
            prefab: DumpConverter.convertPrefab(d.__prefab__),
            children: dump.children?.map((c) => DumpConverter.toNodeIdentifier(c)),
            components: d.__comps__?.map((c) => DumpConverter.toComponentIdentifier(c)),
        };
    }
    static sceneToNode(dump, options) {
        const d = dump;
        return {
            nodeId: dump.uuid.value,
            path: options?.path || d.__path__ || '/',
            name: dump.name.value,
            properties: {
                active: dump.active.value,
                position: d.position?.value ?? { x: 0, y: 0, z: 0 },
                rotation: d.rotation?.value ?? { x: 0, y: 0, z: 0 },
                scale: d.scale?.value ?? { x: 1, y: 1, z: 1 },
                mobility: d.mobility?.value ?? 0,
                layer: d.layer?.value ?? 0,
            },
            children: dump.children?.map((c) => DumpConverter.toNodeIdentifier(c)),
            components: d.__comps__?.map((c) => DumpConverter.toComponentIdentifier(c)),
            prefab: DumpConverter.convertPrefab(d.__prefab__),
        };
    }
    static nodeToNode(dump, options) {
        const d = dump;
        return {
            nodeId: dump.uuid.value,
            path: options?.path || d.__path__ || '',
            name: dump.name.value,
            properties: {
                active: dump.active.value,
                position: dump.position.value,
                rotation: dump.rotation.value,
                scale: dump.scale.value,
                mobility: dump.mobility.value,
                layer: dump.layer.value,
            },
            components: dump.__comps__?.map(c => DumpConverter.toComponentIdentifier(c)),
            children: dump.children?.map((c) => DumpConverter.toNodeIdentifier(c)),
            prefab: DumpConverter.convertPrefab(dump.__prefab__),
        };
    }
    static toNodeIdentifier(childProp) {
        return {
            nodeId: childProp.value?.uuid ?? '',
            path: childProp.__path__ ?? '',
            name: childProp.__name__ ?? '',
        };
    }
    static toComponent(dump) {
        const properties = {};
        if (dump.value && typeof dump.value === 'object') {
            for (const key in dump.value) {
                if (key === 'uuid' || key === 'name' || key === 'enabled') {
                    continue;
                }
                properties[key] = dump.value[key];
            }
        }
        return {
            cid: dump.cid || '',
            path: dump.component_path || '',
            uuid: dump.value?.uuid?.value || '',
            name: dump.value?.name?.value || '',
            type: dump.type || '',
            enabled: dump.value?.enabled?.value ?? true,
            properties,
            prefab: dump.__compPrefab__ ?? null,
        };
    }
    static toComponentIdentifier(dump) {
        return {
            cid: dump.cid || '',
            path: dump.component_path || '',
            uuid: dump.value?.uuid?.value || '',
            name: dump.value?.name?.value || '',
            type: dump.type || '',
            enabled: dump.value?.enabled?.value ?? true,
        };
    }
    static convertPrefab(prefab) {
        if (!prefab)
            return null;
        const d = prefab;
        return {
            asset: d.__asset__ ?? undefined,
            root: d.__root__?.nodeId ? d.__root__ : undefined,
            instance: DumpConverter.convertPrefabInstance(prefab.instance, d.__instance__),
            fileId: prefab.fileId,
            targetOverrides: DumpConverter.convertTargetOverrides(prefab.targetOverrides),
            nestedPrefabInstanceRoots: d.__nested_roots__ ?? [],
        };
    }
    static convertTargetOverrides(overrides) {
        if (!overrides)
            return [];
        return overrides.map(info => {
            const d = info;
            return {
                source: d.__source__ ?? null,
                sourceInfo: info.sourceInfo ? { localID: info.sourceInfo } : null,
                propertyPath: info.propertyPath,
                target: d.__target__ ?? null,
                targetInfo: info.targetInfo ? { localID: info.targetInfo } : null,
            };
        });
    }
    static convertPrefabInstance(instanceDump, enriched) {
        if (!instanceDump?.value)
            return undefined;
        const v = instanceDump.value;
        return {
            fileId: v.fileId?.value ?? '',
            prefabRootNode: enriched?.prefabRootNode ?? undefined,
            mountedChildren: (v.mountedChildren?.value ?? []).map((mc, i) => ({
                targetInfo: DumpConverter.extractTargetInfo(mc.value?.targetInfo),
                nodes: enriched?.mountedChildren?.[i]?.nodes ?? [],
            })),
            mountedComponents: (v.mountedComponents?.value ?? []).map((mc, i) => ({
                targetInfo: DumpConverter.extractTargetInfo(mc.value?.targetInfo),
                components: enriched?.mountedComponents?.[i]?.components ?? [],
            })),
            propertyOverrides: (v.propertyOverrides?.value ?? []).map((po) => ({
                targetInfo: DumpConverter.extractTargetInfo(po.value?.targetInfo),
                propertyPath: DumpConverter.extractPropertyPath(po.value?.propertyPath),
            })),
            removedComponents: (v.removedComponents?.value ?? []).map((rc) => ({
                localID: DumpConverter.extractLocalID(rc),
            })),
        };
    }
    static extractTargetInfo(prop) {
        if (!prop?.value)
            return null;
        return { localID: DumpConverter.extractLocalID(prop) };
    }
    static extractLocalID(prop) {
        const localID = prop?.value?.localID;
        if (!localID?.value || !Array.isArray(localID.value))
            return [];
        return localID.value.map((item) => String(item.value ?? ''));
    }
    static extractPropertyPath(prop) {
        if (!prop?.value || !Array.isArray(prop.value))
            return [];
        return prop.value.map((item) => String(item.value ?? ''));
    }
}
exports.DumpConverter = DumpConverter;
