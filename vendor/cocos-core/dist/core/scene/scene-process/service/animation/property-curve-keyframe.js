"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpPropertyTrack = dumpPropertyTrack;
exports.restoreTrackKeyframes = restoreTrackKeyframes;
exports.setTrackKey = setTrackKey;
exports.updateTrackKey = updateTrackKey;
exports.queryTargetCurves = queryTargetCurves;
exports.removeCurveKeys = removeCurveKeys;
exports.moveCurveKeys = moveCurveKeys;
exports.copyCurveKeysTo = copyCurveKeysTo;
const cc_1 = require("cc");
const utils_1 = require("./utils");
const property_curve_track_1 = require("./property-curve-track");
const real_curve_key_data_1 = require("./real-curve-key-data");
const asset_value_1 = require("./asset-value");
function dumpPropertyTrack(clip, track, descriptor, options = {}) {
    const base = {
        displayName: descriptor.displayName,
        name: descriptor.displayName,
        menuName: descriptor.menuName,
        type: descriptor.type,
        comp: descriptor.comp,
        isCurveSupport: descriptor.isCurveSupport,
    };
    switch (descriptor.kind) {
        case 'vector':
        case 'color':
        case 'size':
            return {
                ...base,
                keyframes: dumpCompositeRealTrackKeyframes(clip, track, descriptor),
                channels: dumpCompositeRealTrackChannels(clip, track, descriptor, options),
                partKeys: descriptor.partKeys ? [...descriptor.partKeys] : undefined,
                preExtrap: (0, property_curve_track_1.queryFirstRealCurve)(track)?.preExtrapolation ?? 0,
                postExtrap: (0, property_curve_track_1.queryFirstRealCurve)(track)?.postExtrapolation ?? 0,
            };
        case 'real':
            return {
                ...base,
                keyframes: dumpRealCurveKeyframes(clip, (0, property_curve_track_1.queryTrackChannels)(track)[0].curve, options),
                preExtrap: (0, property_curve_track_1.queryFirstRealCurve)(track)?.preExtrapolation ?? 0,
                postExtrap: (0, property_curve_track_1.queryFirstRealCurve)(track)?.postExtrapolation ?? 0,
            };
        case 'quat':
            return {
                ...base,
                keyframes: dumpQuatCurveKeyframes(clip, (0, property_curve_track_1.queryTrackChannels)(track)[0].curve),
            };
        case 'object':
            return {
                ...base,
                keyframes: dumpObjectCurveKeyframes(clip, (0, property_curve_track_1.queryTrackChannels)(track)[0].curve, descriptor),
            };
        default:
            return null;
    }
}
function restoreTrackKeyframes(clip, track, descriptor, keyframes, channelDumps) {
    const sample = (0, utils_1.getClipSample)(clip);
    switch (descriptor.kind) {
        case 'vector':
        case 'color':
        case 'size':
            if (channelDumps.length > 0) {
                const channelMap = new Map(channelDumps.map((channel) => [channel.key, channel]));
                const channels = (0, property_curve_track_1.queryTrackChannels)(track);
                for (const [index, key] of (descriptor.partKeys || []).entries()) {
                    assignRealCurveKeyframes(channels[index].curve, sample, channelMap.get(key)?.keyframes || []);
                }
                return true;
            }
            for (const keyframe of keyframes) {
                if (!setTrackKey(track, descriptor, keyframe.frame / sample, keyframe.dump.value, undefined, keyframe)) {
                    return false;
                }
            }
            return true;
        case 'real':
            assignRealCurveKeyframes((0, property_curve_track_1.queryTrackChannels)(track)[0].curve, sample, keyframes);
            return true;
        case 'quat':
            assignQuatCurveKeyframes((0, property_curve_track_1.queryTrackChannels)(track)[0].curve, sample, keyframes);
            return true;
        case 'object':
            assignObjectCurveKeyframes((0, property_curve_track_1.queryTrackChannels)(track)[0].curve, sample, keyframes, descriptor);
            return true;
        default:
            return false;
    }
}
function setTrackKey(track, descriptor, time, value, channel, keyData) {
    const channels = (0, property_curve_track_1.queryTrackChannels)(track);
    switch (descriptor.kind) {
        case 'vector':
        case 'color':
        case 'size': {
            const partKeys = descriptor.partKeys || [];
            if (channel) {
                const channelIndex = partKeys.indexOf(channel);
                const channelValue = normalizeNumberValue(value);
                if (channelIndex < 0 || channelValue === null) {
                    return false;
                }
                setCurveKey(channels[channelIndex].curve, time, (0, real_curve_key_data_1.createRealCurveValue)(channelValue, keyData));
                return true;
            }
            const compositeValue = normalizeCompositeValue(value, partKeys);
            if (!compositeValue) {
                return false;
            }
            for (let index = 0; index < partKeys.length; index++) {
                setCurveKey(channels[index].curve, time, (0, real_curve_key_data_1.createRealCurveValue)(compositeValue[partKeys[index]], keyData));
            }
            return true;
        }
        case 'real': {
            const numberValue = normalizeNumberValue(value);
            if (numberValue === null) {
                return false;
            }
            setCurveKey(channels[0].curve, time, (0, real_curve_key_data_1.createRealCurveValue)(numberValue, keyData));
            return true;
        }
        case 'quat': {
            const quatValue = normalizeQuatValue(value);
            if (!quatValue) {
                return false;
            }
            setCurveKey(channels[0].curve, time, createQuatCurveValue(quatValue, keyData));
            return true;
        }
        case 'object': {
            const objectValue = normalizeObjectCurveValue(descriptor, value);
            if (objectValue === undefined) {
                return false;
            }
            setCurveKey(channels[0].curve, time, objectValue);
            return true;
        }
        default:
            return false;
    }
}
function updateTrackKey(track, descriptor, time, value, channel, keyData) {
    const channels = (0, property_curve_track_1.queryTrackChannels)(track);
    switch (descriptor.kind) {
        case 'vector':
        case 'color':
        case 'size': {
            const partKeys = descriptor.partKeys || [];
            if (channel) {
                const channelIndex = partKeys.indexOf(channel);
                if (channelIndex < 0) {
                    return false;
                }
                const channelValue = value === undefined ? undefined : normalizeNumberValue(value);
                if (value !== undefined && channelValue === null) {
                    return false;
                }
                return updateRealCurveKey(channels[channelIndex].curve, time, channelValue, keyData);
            }
            const compositeValue = value === undefined ? null : normalizeCompositeValue(value, partKeys);
            if (value !== undefined && !compositeValue) {
                return false;
            }
            for (let index = 0; index < partKeys.length; index++) {
                if (!canUpdateRealCurveKey(channels[index].curve, time, compositeValue?.[partKeys[index]])) {
                    return false;
                }
            }
            for (let index = 0; index < partKeys.length; index++) {
                if (!updateRealCurveKey(channels[index].curve, time, compositeValue?.[partKeys[index]], keyData)) {
                    return false;
                }
            }
            return true;
        }
        case 'real': {
            const numberValue = value === undefined ? undefined : normalizeNumberValue(value);
            if (value !== undefined && numberValue === null) {
                return false;
            }
            return updateRealCurveKey(channels[0].curve, time, numberValue, keyData);
        }
        case 'quat':
            return updateQuatCurveKey(channels[0].curve, time, value, keyData);
        case 'object':
            if (value === undefined) {
                return false;
            }
            {
                const objectValue = normalizeObjectCurveValue(descriptor, value);
                if (objectValue === undefined) {
                    return false;
                }
                setCurveKey(channels[0].curve, time, objectValue);
            }
            return true;
        default:
            return false;
    }
}
function queryTargetCurves(track, descriptor, channel) {
    const channels = (0, property_curve_track_1.queryTrackChannels)(track);
    if (!channel || !descriptor.partKeys) {
        return channels.map((item) => item.curve);
    }
    const channelIndex = descriptor.partKeys.indexOf(channel);
    return channelIndex >= 0 ? [channels[channelIndex].curve] : [];
}
function removeCurveKeys(clip, curve, frames) {
    const sample = (0, utils_1.getClipSample)(clip);
    const before = queryCurveKeyframes(curve);
    const after = before.filter(([time]) => !frames.includes(timeToFrame(time, sample)));
    if (after.length === before.length) {
        return false;
    }
    curve.assignSorted(after);
    return true;
}
function moveCurveKeys(clip, curve, frames, offset) {
    const sample = (0, utils_1.getClipSample)(clip);
    let changed = false;
    const retained = [];
    const moved = new Map();
    for (const [time, value] of queryCurveKeyframes(curve)) {
        const frame = timeToFrame(time, sample);
        if (frames.includes(frame)) {
            changed = true;
            moved.set(Math.max(0, frame + offset), value);
        }
        else {
            retained.push({ frame, value });
        }
    }
    if (!changed) {
        return false;
    }
    const movedFrames = new Set(moved.keys());
    const keyframes = retained
        .filter((keyframe) => !movedFrames.has(keyframe.frame))
        .concat(Array.from(moved, ([frame, value]) => ({ frame, value })));
    keyframes.sort((a, b) => a.frame - b.frame);
    curve.assignSorted(keyframes.map((keyframe) => [keyframe.frame / sample, keyframe.value]));
    return true;
}
function copyCurveKeysTo(clip, curve, frames, dstFrame) {
    const sample = (0, utils_1.getClipSample)(clip);
    const sortedFrames = [...frames].sort((a, b) => a - b);
    if (sortedFrames.length === 0 || !Number.isFinite(dstFrame)) {
        return false;
    }
    const keyframes = queryCurveKeyframes(curve);
    const baseFrame = sortedFrames[0];
    const copied = keyframes
        .filter(([time]) => sortedFrames.includes(timeToFrame(time, sample)))
        .map(([time, value]) => ({
        frame: Math.max(0, timeToFrame(time, sample) - baseFrame + dstFrame),
        value: (0, utils_1.cloneValue)(value),
    }));
    if (copied.length === 0) {
        return false;
    }
    const copiedFrames = copied.map(keyframe => keyframe.frame);
    const retained = keyframes.filter(([time]) => !copiedFrames.includes(timeToFrame(time, sample)));
    const next = retained.concat(copied.map(keyframe => [keyframe.frame / sample, keyframe.value]));
    next.sort(([leftTime], [rightTime]) => leftTime - rightTime);
    curve.assignSorted(next);
    return true;
}
function dumpCompositeRealTrackChannels(clip, track, descriptor, options) {
    const partKeys = descriptor.partKeys || [];
    const channels = (0, property_curve_track_1.queryTrackChannels)(track);
    return partKeys.map((key, index) => ({
        key,
        displayName: key,
        type: { value: 'cc.Number' },
        keyframes: dumpRealCurveKeyframes(clip, channels[index].curve, options),
    }));
}
function dumpCompositeRealTrackKeyframes(clip, track, descriptor) {
    const sample = (0, utils_1.getClipSample)(clip);
    const channels = (0, property_curve_track_1.queryTrackChannels)(track);
    const partKeys = descriptor.partKeys || [];
    const times = new Set();
    for (let index = 0; index < partKeys.length; index++) {
        for (const time of queryCurveTimes(channels[index].curve)) {
            times.add(time);
        }
    }
    return Array.from(times)
        .sort((a, b) => a - b)
        .map((time) => ({
        frame: timeToFrame(time, sample),
        dump: {
            value: buildCompositeValue(channels, partKeys, time),
            type: descriptor.type.value,
        },
    }));
}
function dumpRealCurveKeyframes(clip, curve, options) {
    const sample = (0, utils_1.getClipSample)(clip);
    return queryCurveKeyframes(curve)
        .sort(([leftTime], [rightTime]) => leftTime - rightTime)
        .map(([time, value]) => {
        const keyData = (0, real_curve_key_data_1.dumpRealKeyData)(value, options);
        const keyframe = {
            frame: timeToFrame(time, sample),
            dump: {
                value: (0, real_curve_key_data_1.queryRealCurveNumberValue)(value),
                type: 'cc.Number',
            },
            ...keyData,
        };
        (0, real_curve_key_data_1.copyRealKeyDataInternalMetadata)(keyData, keyframe);
        return keyframe;
    });
}
function dumpQuatCurveKeyframes(clip, curve) {
    const sample = (0, utils_1.getClipSample)(clip);
    return queryCurveKeyframes(curve)
        .sort(([leftTime], [rightTime]) => leftTime - rightTime)
        .map(([time, value]) => ({
        frame: timeToFrame(time, sample),
        dump: {
            value: (0, utils_1.cloneValue)(normalizeQuatValue(value.value)),
            type: 'cc.Quat',
        },
        ...dumpQuatKeyData(value),
    }));
}
function dumpObjectCurveKeyframes(clip, curve, descriptor) {
    const sample = (0, utils_1.getClipSample)(clip);
    return queryCurveKeyframes(curve)
        .sort(([leftTime], [rightTime]) => leftTime - rightTime)
        .map(([time, value]) => ({
        frame: timeToFrame(time, sample),
        dump: {
            value: dumpObjectCurveValue(value, descriptor),
            type: descriptor.type.value,
        },
    }));
}
function assignRealCurveKeyframes(curve, sample, keyframes) {
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame).map((keyframe) => [
        keyframe.frame / sample,
        (0, real_curve_key_data_1.createRealCurveValue)(normalizeNumber(keyframe.dump.value), keyframe),
    ]);
    curve.assignSorted(sorted);
}
function assignQuatCurveKeyframes(curve, sample, keyframes) {
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame).map((keyframe) => [
        keyframe.frame / sample,
        {
            value: normalizeQuatValue(keyframe.dump.value),
            interpolationMode: keyframe.interpMode,
            easingMethod: keyframe.easingMethod,
        },
    ]);
    curve.assignSorted(sorted);
}
function assignObjectCurveKeyframes(curve, sample, keyframes, descriptor) {
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame).map((keyframe) => [
        keyframe.frame / sample,
        normalizeObjectCurveValue({ ...descriptor, type: { value: keyframe.dump.type || descriptor.type.value } }, keyframe.dump.value),
    ]);
    curve.assignSorted(sorted);
}
function setCurveKey(curve, time, value) {
    const keyframes = queryCurveKeyframes(curve)
        .filter(([keyTime]) => !isSameTime(keyTime, time))
        .concat([[time, value]]);
    keyframes.sort((a, b) => a[0] - b[0]);
    curve.assignSorted(keyframes);
}
function normalizeObjectCurveValue(descriptor, value) {
    const assetValue = normalizeAssetCurveValue(descriptor, value);
    if (assetValue === INVALID_ASSET_VALUE) {
        return undefined;
    }
    if (assetValue !== NOT_ASSET_TYPE) {
        return assetValue;
    }
    const typedValue = normalizeTypedObjectCurveValue(descriptor, value);
    if (typedValue !== NOT_TYPED_OBJECT) {
        return typedValue;
    }
    return (0, utils_1.cloneValue)(value);
}
function dumpObjectCurveValue(value, descriptor) {
    if (isAssetDescriptor(descriptor) || (0, asset_value_1.isAnimationAssetValue)(value)) {
        if (value === null || value === undefined) {
            return null;
        }
        if ((0, asset_value_1.isAnimationAssetValue)(value)) {
            return (0, asset_value_1.serializeAnimationAssetValue)(value);
        }
        const uuid = (0, asset_value_1.queryAnimationAssetUuid)(value);
        return uuid ? { uuid } : null;
    }
    return (0, utils_1.cloneSerializableValue)(value);
}
const NOT_ASSET_TYPE = Symbol('notAssetType');
const INVALID_ASSET_VALUE = Symbol('invalidAssetValue');
const NOT_TYPED_OBJECT = Symbol('notTypedObject');
function normalizeAssetCurveValue(descriptor, value) {
    const assetCtor = queryAssetCtor(descriptor);
    if (!assetCtor) {
        return NOT_ASSET_TYPE;
    }
    if (value === null) {
        return null;
    }
    if (value instanceof assetCtor) {
        return value;
    }
    const uuid = (0, asset_value_1.queryAnimationAssetUuid)(value);
    if (!uuid) {
        return INVALID_ASSET_VALUE;
    }
    return (0, asset_value_1.createAnimationAssetPlaceholder)(assetCtor, uuid);
}
function isAssetDescriptor(descriptor) {
    return Boolean(queryAssetCtor(descriptor));
}
function queryAssetCtor(descriptor) {
    return (0, asset_value_1.queryAnimationAssetCtor)(descriptor);
}
function normalizeTypedObjectCurveValue(descriptor, value) {
    const ctor = queryTypedObjectCtor(descriptor);
    if (!ctor) {
        return NOT_TYPED_OBJECT;
    }
    if (value === null || value === undefined) {
        return value;
    }
    if (value instanceof ctor) {
        return (0, utils_1.cloneValue)(value);
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const typeName = descriptor.type?.value || '';
    if (!typeName) {
        const result = new ctor();
        Object.assign(result, value);
        return result;
    }
    return (0, cc_1.deserialize)({
        __type__: typeName,
        ...value,
    });
}
function queryTypedObjectCtor(descriptor) {
    if ((0, asset_value_1.queryAnimationAssetCtor)(descriptor)) {
        return null;
    }
    const typeName = descriptor.type?.value || '';
    if (!descriptor.valueCtor && (!typeName || typeName === 'cc.Object' || typeName === 'Object' || typeName === 'Unknown')) {
        return null;
    }
    const ctor = descriptor.valueCtor || cc_1.js.getClassByName(typeName);
    return typeof ctor === 'function' ? ctor : null;
}
function updateRealCurveKey(curve, time, value, keyData) {
    const existed = (0, real_curve_key_data_1.findRealCurveKey)(curve, time);
    if (!existed) {
        if (value === undefined || value === null) {
            return false;
        }
        setCurveKey(curve, time, (0, real_curve_key_data_1.createRealCurveValue)(value, keyData));
        return true;
    }
    const currentValue = value ?? (0, real_curve_key_data_1.queryRealCurveNumberValue)(existed[1]);
    setCurveKey(curve, time, (0, real_curve_key_data_1.createMergedRealCurveValue)(currentValue, existed[1], keyData));
    return true;
}
function canUpdateRealCurveKey(curve, time, value) {
    return Boolean((0, real_curve_key_data_1.findRealCurveKey)(curve, time)) || (value !== undefined && value !== null);
}
function updateQuatCurveKey(curve, time, value, keyData) {
    const existed = queryCurveKeyframes(curve).find(([keyTime]) => isSameTime(keyTime, time));
    if (!existed) {
        const quatValue = normalizeQuatValue(value);
        if (!quatValue) {
            return false;
        }
        setCurveKey(curve, time, createQuatCurveValue(quatValue, keyData));
        return true;
    }
    const nextValue = value === undefined ? normalizeQuatValue(existed[1]?.value) : normalizeQuatValue(value);
    if (!nextValue) {
        return false;
    }
    setCurveKey(curve, time, {
        value: nextValue,
        interpolationMode: keyData?.interpMode ?? existed[1]?.interpolationMode,
        easingMethod: keyData?.easingMethod ?? existed[1]?.easingMethod,
    });
    return true;
}
function createQuatCurveValue(value, keyData) {
    return {
        value,
        interpolationMode: keyData?.interpMode,
        easingMethod: keyData?.easingMethod,
    };
}
function dumpQuatKeyData(value) {
    const data = {};
    setNonDefaultNumber(data, 'interpMode', value.interpolationMode);
    setNonDefaultNumber(data, 'easingMethod', value.easingMethod);
    return data;
}
function setNonDefaultNumber(data, key, value) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue !== 0) {
        data[key] = numberValue;
    }
}
function buildCompositeValue(channels, partKeys, time) {
    const value = {};
    for (let index = 0; index < partKeys.length; index++) {
        value[partKeys[index]] = normalizeNumber(channels[index].curve.evaluate(time));
    }
    return value;
}
function normalizeCompositeValue(value, partKeys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const result = {};
    for (const key of partKeys) {
        const numberValue = Number(value[key]);
        if (!Number.isFinite(numberValue)) {
            return null;
        }
        result[key] = numberValue;
    }
    return result;
}
function normalizeQuatValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const x = Number(value.x);
    const y = Number(value.y);
    const z = Number(value.z);
    const w = Number(value.w);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(w)) {
        return null;
    }
    return { x, y, z, w };
}
function normalizeNumberValue(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}
function normalizeNumber(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
}
function queryCurveKeyframes(curve) {
    return Array.from(curve.keyframes?.() || []);
}
function queryCurveTimes(curve) {
    return Array.from(curve.times?.() || []);
}
function timeToFrame(time, sample) {
    return Math.round(time * sample);
}
function isSameTime(left, right) {
    return Math.abs(left - right) <= 1e-6;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktY3VydmUta2V5ZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvYW5pbWF0aW9uL3Byb3BlcnR5LWN1cnZlLWtleWZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBd0NBLDhDQThDQztBQUVELHNEQXNDQztBQUVELGtDQTREQztBQUVELHdDQWtFQztBQUVELDhDQVFDO0FBRUQsMENBU0M7QUFFRCxzQ0F5QkM7QUFFRCwwQ0F5QkM7QUEzVUQsMkJBQXFDO0FBU3JDLG1DQUlpQjtBQU1qQixpRUFHZ0M7QUFDaEMsK0RBUStCO0FBQy9CLCtDQU11QjtBQUV2QixTQUFnQixpQkFBaUIsQ0FDN0IsSUFBbUIsRUFDbkIsS0FBZSxFQUNmLFVBQW9DLEVBQ3BDLFVBQW1DLEVBQUU7SUFFckMsTUFBTSxJQUFJLEdBQUc7UUFDVCxXQUFXLEVBQUUsVUFBVSxDQUFDLFdBQVc7UUFDbkMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxXQUFXO1FBQzVCLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUTtRQUM3QixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7UUFDckIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO1FBQ3JCLGNBQWMsRUFBRSxVQUFVLENBQUMsY0FBYztLQUM1QyxDQUFDO0lBQ0YsUUFBUSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLE9BQU8sQ0FBQztRQUNiLEtBQUssTUFBTTtZQUNQLE9BQU87Z0JBQ0gsR0FBRyxJQUFJO2dCQUNQLFNBQVMsRUFBRSwrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQztnQkFDbkUsUUFBUSxFQUFFLDhCQUE4QixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQztnQkFDMUUsUUFBUSxF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QUFLLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxNQUFNLE1BQU0sR0FBRyxTQUFTO1NBQ25CLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ3BFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JCLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDcEUsS0FBSyxFQUFFLElBQUEsa0JBQVUsRUFBQyxLQUFLLENBQUM7S0FDM0IsQ0FBQyxDQUFDLENBQUM7SUFDUixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDdEIsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsTUFBTSxF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QyxDQUFDO0FBQzFELENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLEtBQWU7SUFDeEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFFLEtBQWEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBeUIsQ0FBQztBQUNsRixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsS0FBZTtJQUNwQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUUsS0FBYSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxDQUFhLENBQUM7QUFDbEUsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLElBQVksRUFBRSxNQUFjO0lBQzdDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLElBQVksRUFBRSxLQUFhO0lBQzNDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNlcmlhbGl6ZSwganMgfSBmcm9tICdjYyc7XG5pbXBvcnQgdHlwZSB7IEFuaW1hdGlvbkNsaXAsIEFzc2V0IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHR5cGUge1xuICAgIElBbmltYXRpb25DdXJ2ZUNoYW5uZWxEdW1wLFxuICAgIElBbmltYXRpb25DdXJ2ZUR1bXAsXG4gICAgSUFuaW1hdGlvbkN1cnZlS2V5RGF0YSxcbiAgICBJQW5pbWF0aW9uQ3VydmVLZXlEdW1wLFxuICAgIElBbmltYXRpb25WYWx1ZSxcbn0gZnJvbSAnLi4vLi4vLi4vY29tbW9uJztcbmltcG9ydCB7XG4gICAgY2xvbmVTZXJpYWxpemFibGVWYWx1ZSxcbiAgICBjbG9uZVZhbHVlLFxuICAgIGdldENsaXBTYW1wbGUsXG59IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHR5cGUge1xuICAgIEFueUN1cnZlLFxuICAgIEFueVRyYWNrLFxuICAgIElQcm9wZXJ0eVRyYWNrRGVzY3JpcHRvcixcbn0gZnJvbSAnLi9wcm9wZXJ0eS1jdXJ2ZS10eXBlcyc7XG5pbXBvcnQge1xuICAgIHF1ZXJ5Rmlyc3RSZWFsQ3VydmUsXG4gICAgcXVlcnlUcmFja0NoYW5uZWxzLFxufSBmcm9tICcuL3Byb3BlcnR5LWN1cnZlLXRyYWNrJztcbmltcG9ydCB7XG4gICAgY29weVJlYWxLZXlEYXRhSW50ZXJuYWxNZXRhZGF0YSxcbiAgICBjcmVhdGVNZXJnZWRSZWFsQ3VydmVWYWx1ZSxcbiAgICBjcmVhdGVSZWFsQ3VydmVWYWx1ZSxcbiAgICB0eXBlIElEdW1wUmVhbEtleURhdGFPcHRpb25zLFxuICAgIGR1bXBSZWFsS2V5RGF0YSxcbiAgICBmaW5kUmVhbEN1cnZlS2V5LFxuICAgIHF1ZXJ5UmVhbEN1cnZlTnVtYmVyVmFsdWUsXG59IGZyb20gJy4vcmVhbC1jdXJ2ZS1rZXktZGF0YSc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZUFuaW1hdGlvbkFzc2V0UGxhY2Vob2xkZXIsXG4gICAgaXNBbmltYXRpb25Bc3NldFZhbHVlLFxuICAgIHF1ZXJ5QW5pbWF0aW9uQXNzZXRDdG9yLFxuICAgIHF1ZXJ5QW5pbWF0aW9uQXNzZXRVdWlkLFxuICAgIHNlcmlhbGl6ZUFuaW1hdGlvbkFzc2V0VmFsdWUsXG59IGZyb20gJy4vYXNzZXQtdmFsdWUnO1xuXG5leHBvcnQgZnVuY3Rpb24gZHVtcFByb3BlcnR5VHJhY2soXG4gICAgY2xpcDogQW5pbWF0aW9uQ2xpcCxcbiAgICB0cmFjazogQW55VHJhY2ssXG4gICAgZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yLFxuICAgIG9wdGlvbnM6IElEdW1wUmVhbEtleURhdGFPcHRpb25zID0ge30sXG4pOiBPbWl0PElBbmltYXRpb25DdXJ2ZUR1bXAsICdub2RlUGF0aCcgfCAna2V5Jz4gfCBudWxsIHtcbiAgICBjb25zdCBiYXNlID0ge1xuICAgICAgICBkaXNwbGF5TmFtZTogZGVzY3JpcHRvci5kaXNwbGF5TmFtZSxcbiAgICAgICAgbmFtZTogZGVzY3JpcHRvci5kaXNwbGF5TmFtZSxcbiAgICAgICAgbWVudU5hbWU6IGRlc2NyaXB0b3IubWVudU5hbWUsXG4gICAgICAgIHR5cGU6IGRlc2NyaXB0b3IudHlwZSxcbiAgICAgICAgY29tcDogZGVzY3JpcHRvci5jb21wLFxuICAgICAgICBpc0N1cnZlU3VwcG9ydDogZGVzY3JpcHRvci5pc0N1cnZlU3VwcG9ydCxcbiAgICB9O1xuICAgIHN3aXRjaCAoZGVzY3JpcHRvci5raW5kKSB7XG4gICAgICAgIGNhc2UgJ3ZlY3Rvcic6XG4gICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgY2FzZSAnc2l6ZSc6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLmJhc2UsXG4gICAgICAgICAgICAgICAga2V5ZnJhbWVzOiBkdW1wQ29tcG9zaXRlUmVhbFRyYWNrS2V5ZnJhbWVzKGNsaXAsIHRyYWNrLCBkZXNjcmlwdG9yKSxcbiAgICAgICAgICAgICAgICBjaGFubmVsczogZHVtcENvbXBvc2l0ZVJlYWxUcmFja0NoYW5uZWxzKGNsaXAsIHRyYWNrLCBkZXNjcmlwdG9yLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBwYXJ0S2V5czogZGVzY3JpcHRvci5wYXJ0S2V5cyA/IFsuLi5kZXNjcmlwdG9yLnBhcnRLZXlzXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBwcmVFeHRyYXA6IHF1ZXJ5Rmlyc3RSZWFsQ3VydmUodHJhY2spPy5wcmVFeHRyYXBvbGF0aW9uID8/IDAsXG4gICAgICAgICAgICAgICAgcG9zdEV4dHJhcDogcXVlcnlGaXJzdFJlYWxDdXJ2ZSh0cmFjayk/LnBvc3RFeHRyYXBvbGF0aW9uID8/IDAsXG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlICdyZWFsJzpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgICAgICBrZXlmcmFtZXM6IGR1bXBSZWFsQ3VydmVLZXlmcmFtZXMoY2xpcCwgcXVlcnlUcmFja0NoYW5uZWxzKHRyYWNrKVswXS5jdXJ2ZSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgcHJlRXh0cmFwOiBxdWVyeUZpcnN0UmVhbEN1cnZlKHRyYWNrKT8ucHJlRXh0cmFwb2xhdGlvbiA/PyAwLFxuICAgICAgICAgICAgICAgIHBvc3RFeHRyYXA6IHF1ZXJ5Rmlyc3RSZWFsQ3VydmUodHJhY2spPy5wb3N0RXh0cmFwb2xhdGlvbiA/PyAwLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAncXVhdCc6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLmJhc2UsXG4gICAgICAgICAgICAgICAga2V5ZnJhbWVzOiBkdW1wUXVhdEN1cnZlS2V5ZnJhbWVzKGNsaXAsIHF1ZXJ5VHJhY2tDaGFubmVscyh0cmFjaylbMF0uY3VydmUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgICAgICBrZXlmcmFtZXM6IGR1bXBPYmplY3RDdXJ2ZUtleWZyYW1lcyhjbGlwLCBxdWVyeVRyYWNrQ2hhbm5lbHModHJhY2spWzBdLmN1cnZlLCBkZXNjcmlwdG9yKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXN0b3JlVHJhY2tLZXlmcmFtZXMoXG4gICAgY2xpcDogQW5pbWF0aW9uQ2xpcCxcbiAgICB0cmFjazogQW55VHJhY2ssXG4gICAgZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yLFxuICAgIGtleWZyYW1lczogSUFuaW1hdGlvbkN1cnZlS2V5RHVtcFtdLFxuICAgIGNoYW5uZWxEdW1wczogSUFuaW1hdGlvbkN1cnZlQ2hhbm5lbER1bXBbXSxcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoY2xpcCk7XG4gICAgc3dpdGNoIChkZXNjcmlwdG9yLmtpbmQpIHtcbiAgICAgICAgY2FzZSAndmVjdG9yJzpcbiAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICBjYXNlICdzaXplJzpcbiAgICAgICAgICAgIGlmIChjaGFubmVsRHVtcHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5uZWxNYXAgPSBuZXcgTWFwKGNoYW5uZWxEdW1wcy5tYXAoKGNoYW5uZWwpID0+IFtjaGFubmVsLmtleSwgY2hhbm5lbF0pKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGFubmVscyA9IHF1ZXJ5VHJhY2tDaGFubmVscyh0cmFjayk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbaW5kZXgsIGtleV0gb2YgKGRlc2NyaXB0b3IucGFydEtleXMgfHwgW10pLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBhc3NpZ25SZWFsQ3VydmVLZXlmcmFtZXMoY2hhbm5lbHNbaW5kZXhdLmN1cnZlLCBzYW1wbGUsIGNoYW5uZWxNYXAuZ2V0KGtleSk/LmtleWZyYW1lcyB8fCBbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXlmcmFtZSBvZiBrZXlmcmFtZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNldFRyYWNrS2V5KHRyYWNrLCBkZXNjcmlwdG9yLCBrZXlmcmFtZS5mcmFtZSAvIHNhbXBsZSwga2V5ZnJhbWUuZHVtcC52YWx1ZSwgdW5kZWZpbmVkLCBrZXlmcmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdyZWFsJzpcbiAgICAgICAgICAgIGFzc2lnblJlYWxDdXJ2ZUtleWZyYW1lcyhxdWVyeVRyYWNrQ2hhbm5lbHModHJhY2spWzBdLmN1cnZlLCBzYW1wbGUsIGtleWZyYW1lcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgY2FzZSAncXVhdCc6XG4gICAgICAgICAgICBhc3NpZ25RdWF0Q3VydmVLZXlmcmFtZXMocXVlcnlUcmFja0NoYW5uZWxzKHRyYWNrKVswXS5jdXJ2ZSwgc2FtcGxlLCBrZXlmcmFtZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBhc3NpZ25PYmplY3RDdXJ2ZUtleWZyYW1lcyhxdWVyeVRyYWNrQ2hhbm5lbHModHJhY2spWzBdLmN1cnZlLCBzYW1wbGUsIGtleWZyYW1lcywgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUcmFja0tleShcbiAgICB0cmFjazogQW55VHJhY2ssXG4gICAgZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yLFxuICAgIHRpbWU6IG51bWJlcixcbiAgICB2YWx1ZTogSUFuaW1hdGlvblZhbHVlLFxuICAgIGNoYW5uZWw/OiBzdHJpbmcsXG4gICAga2V5RGF0YT86IElBbmltYXRpb25DdXJ2ZUtleURhdGEsXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBjaGFubmVscyA9IHF1ZXJ5VHJhY2tDaGFubmVscyh0cmFjayk7XG4gICAgc3dpdGNoIChkZXNjcmlwdG9yLmtpbmQpIHtcbiAgICAgICAgY2FzZSAndmVjdG9yJzpcbiAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICBjYXNlICdzaXplJzoge1xuICAgICAgICAgICAgY29uc3QgcGFydEtleXMgPSBkZXNjcmlwdG9yLnBhcnRLZXlzIHx8IFtdO1xuICAgICAgICAgICAgaWYgKGNoYW5uZWwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGFubmVsSW5kZXggPSBwYXJ0S2V5cy5pbmRleE9mKGNoYW5uZWwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5uZWxWYWx1ZSA9IG5vcm1hbGl6ZU51bWJlclZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoY2hhbm5lbEluZGV4IDwgMCB8fCBjaGFubmVsVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRDdXJ2ZUtleShjaGFubmVsc1tjaGFubmVsSW5kZXhdLmN1cnZlLCB0aW1lLCBjcmVhdGVSZWFsQ3VydmVWYWx1ZShjaGFubmVsVmFsdWUsIGtleURhdGEpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9zaXRlVmFsdWUgPSBub3JtYWxpemVDb21wb3NpdGVWYWx1ZSh2YWx1ZSwgcGFydEtleXMpO1xuICAgICAgICAgICAgaWYgKCFjb21wb3NpdGVWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwYXJ0S2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBzZXRDdXJ2ZUtleShjaGFubmVsc1tpbmRleF0uY3VydmUsIHRpbWUsIGNyZWF0ZVJlYWxDdXJ2ZVZhbHVlKGNvbXBvc2l0ZVZhbHVlW3BhcnRLZXlzW2luZGV4XV0sIGtleURhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3JlYWwnOiB7XG4gICAgICAgICAgICBjb25zdCBudW1iZXJWYWx1ZSA9IG5vcm1hbGl6ZU51bWJlclZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChudW1iZXJWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEN1cnZlS2V5KGNoYW5uZWxzWzBdLmN1cnZlLCB0aW1lLCBjcmVhdGVSZWFsQ3VydmVWYWx1ZShudW1iZXJWYWx1ZSwga2V5RGF0YSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAncXVhdCc6IHtcbiAgICAgICAgICAgIGNvbnN0IHF1YXRWYWx1ZSA9IG5vcm1hbGl6ZVF1YXRWYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoIXF1YXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEN1cnZlS2V5KGNoYW5uZWxzWzBdLmN1cnZlLCB0aW1lLCBjcmVhdGVRdWF0Q3VydmVWYWx1ZShxdWF0VmFsdWUsIGtleURhdGEpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFZhbHVlID0gbm9ybWFsaXplT2JqZWN0Q3VydmVWYWx1ZShkZXNjcmlwdG9yLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAob2JqZWN0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEN1cnZlS2V5KGNoYW5uZWxzWzBdLmN1cnZlLCB0aW1lLCBvYmplY3RWYWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRyYWNrS2V5KFxuICAgIHRyYWNrOiBBbnlUcmFjayxcbiAgICBkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IsXG4gICAgdGltZTogbnVtYmVyLFxuICAgIHZhbHVlOiBJQW5pbWF0aW9uVmFsdWUsXG4gICAgY2hhbm5lbD86IHN0cmluZyxcbiAgICBrZXlEYXRhPzogSUFuaW1hdGlvbkN1cnZlS2V5RGF0YSxcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNoYW5uZWxzID0gcXVlcnlUcmFja0NoYW5uZWxzKHRyYWNrKTtcbiAgICBzd2l0Y2ggKGRlc2NyaXB0b3Iua2luZCkge1xuICAgICAgICBjYXNlICd2ZWN0b3InOlxuICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgIGNhc2UgJ3NpemUnOiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0S2V5cyA9IGRlc2NyaXB0b3IucGFydEtleXMgfHwgW107XG4gICAgICAgICAgICBpZiAoY2hhbm5lbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5uZWxJbmRleCA9IHBhcnRLZXlzLmluZGV4T2YoY2hhbm5lbCk7XG4gICAgICAgICAgICAgICAgaWYgKGNoYW5uZWxJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBjaGFubmVsVmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogbm9ybWFsaXplTnVtYmVyVmFsdWUodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIGNoYW5uZWxWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1cGRhdGVSZWFsQ3VydmVLZXkoY2hhbm5lbHNbY2hhbm5lbEluZGV4XS5jdXJ2ZSwgdGltZSwgY2hhbm5lbFZhbHVlLCBrZXlEYXRhKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9zaXRlVmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IG5vcm1hbGl6ZUNvbXBvc2l0ZVZhbHVlKHZhbHVlLCBwYXJ0S2V5cyk7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhY29tcG9zaXRlVmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcGFydEtleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjYW5VcGRhdGVSZWFsQ3VydmVLZXkoY2hhbm5lbHNbaW5kZXhdLmN1cnZlLCB0aW1lLCBjb21wb3NpdGVWYWx1ZT8uW3BhcnRLZXlzW2luZGV4XV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcGFydEtleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1cGRhdGVSZWFsQ3VydmVLZXkoY2hhbm5lbHNbaW5kZXhdLmN1cnZlLCB0aW1lLCBjb21wb3NpdGVWYWx1ZT8uW3BhcnRLZXlzW2luZGV4XV0sIGtleURhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlICdyZWFsJzoge1xuICAgICAgICAgICAgY29uc3QgbnVtYmVyVmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogbm9ybWFsaXplTnVtYmVyVmFsdWUodmFsdWUpO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgbnVtYmVyVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlUmVhbEN1cnZlS2V5KGNoYW5uZWxzWzBdLmN1cnZlLCB0aW1lLCBudW1iZXJWYWx1ZSwga2V5RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAncXVhdCc6XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlUXVhdEN1cnZlS2V5KGNoYW5uZWxzWzBdLmN1cnZlLCB0aW1lLCB2YWx1ZSwga2V5RGF0YSk7XG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmplY3RWYWx1ZSA9IG5vcm1hbGl6ZU9iamVjdEN1cnZlVmFsdWUoZGVzY3JpcHRvciwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChvYmplY3RWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0Q3VydmVLZXkoY2hhbm5lbHNbMF0uY3VydmUsIHRpbWUsIG9iamVjdFZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5VGFyZ2V0Q3VydmVzKHRyYWNrOiBBbnlUcmFjaywgZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yLCBjaGFubmVsPzogc3RyaW5nKTogQW55Q3VydmVbXSB7XG4gICAgY29uc3QgY2hhbm5lbHMgPSBxdWVyeVRyYWNrQ2hhbm5lbHModHJhY2spO1xuICAgIGlmICghY2hhbm5lbCB8fCAhZGVzY3JpcHRvci5wYXJ0S2V5cykge1xuICAgICAgICByZXR1cm4gY2hhbm5lbHMubWFwKChpdGVtKSA9PiBpdGVtLmN1cnZlKTtcbiAgICB9XG5cbiAgICBjb25zdCBjaGFubmVsSW5kZXggPSBkZXNjcmlwdG9yLnBhcnRLZXlzLmluZGV4T2YoY2hhbm5lbCk7XG4gICAgcmV0dXJuIGNoYW5uZWxJbmRleCA+PSAwID8gW2NoYW5uZWxzW2NoYW5uZWxJbmRleF0uY3VydmVdIDogW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDdXJ2ZUtleXMoY2xpcDogQW5pbWF0aW9uQ2xpcCwgY3VydmU6IEFueUN1cnZlLCBmcmFtZXM6IG51bWJlcltdKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc2FtcGxlID0gZ2V0Q2xpcFNhbXBsZShjbGlwKTtcbiAgICBjb25zdCBiZWZvcmUgPSBxdWVyeUN1cnZlS2V5ZnJhbWVzKGN1cnZlKTtcbiAgICBjb25zdCBhZnRlciA9IGJlZm9yZS5maWx0ZXIoKFt0aW1lXSkgPT4gIWZyYW1lcy5pbmNsdWRlcyh0aW1lVG9GcmFtZSh0aW1lLCBzYW1wbGUpKSk7XG4gICAgaWYgKGFmdGVyLmxlbmd0aCA9PT0gYmVmb3JlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIChjdXJ2ZSBhcyBhbnkpLmFzc2lnblNvcnRlZChhZnRlcik7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3ZlQ3VydmVLZXlzKGNsaXA6IEFuaW1hdGlvbkNsaXAsIGN1cnZlOiBBbnlDdXJ2ZSwgZnJhbWVzOiBudW1iZXJbXSwgb2Zmc2V0OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBzYW1wbGUgPSBnZXRDbGlwU2FtcGxlKGNsaXApO1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgY29uc3QgcmV0YWluZWQ6IEFycmF5PHsgZnJhbWU6IG51bWJlcjsgdmFsdWU6IHVua25vd24gfT4gPSBbXTtcbiAgICBjb25zdCBtb3ZlZCA9IG5ldyBNYXA8bnVtYmVyLCB1bmtub3duPigpO1xuICAgIGZvciAoY29uc3QgW3RpbWUsIHZhbHVlXSBvZiBxdWVyeUN1cnZlS2V5ZnJhbWVzKGN1cnZlKSkge1xuICAgICAgICBjb25zdCBmcmFtZSA9IHRpbWVUb0ZyYW1lKHRpbWUsIHNhbXBsZSk7XG4gICAgICAgIGlmIChmcmFtZXMuaW5jbHVkZXMoZnJhbWUpKSB7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIG1vdmVkLnNldChNYXRoLm1heCgwLCBmcmFtZSArIG9mZnNldCksIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldGFpbmVkLnB1c2goeyBmcmFtZSwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWNoYW5nZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtb3ZlZEZyYW1lcyA9IG5ldyBTZXQobW92ZWQua2V5cygpKTtcbiAgICBjb25zdCBrZXlmcmFtZXMgPSByZXRhaW5lZFxuICAgICAgICAuZmlsdGVyKChrZXlmcmFtZSkgPT4gIW1vdmVkRnJhbWVzLmhhcyhrZXlmcmFtZS5mcmFtZSkpXG4gICAgICAgIC5jb25jYXQoQXJyYXkuZnJvbShtb3ZlZCwgKFtmcmFtZSwgdmFsdWVdKSA9PiAoeyBmcmFtZSwgdmFsdWUgfSkpKTtcbiAgICBrZXlmcmFtZXMuc29ydCgoYSwgYikgPT4gYS5mcmFtZSAtIGIuZnJhbWUpO1xuICAgIChjdXJ2ZSBhcyBhbnkpLmFzc2lnblNvcnRlZChrZXlmcmFtZXMubWFwKChrZXlmcmFtZSkgPT4gW2tleWZyYW1lLmZyYW1lIC8gc2FtcGxlLCBrZXlmcmFtZS52YWx1ZV0gYXMgW251bWJlciwgYW55XSkpO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29weUN1cnZlS2V5c1RvKGNsaXA6IEFuaW1hdGlvbkNsaXAsIGN1cnZlOiBBbnlDdXJ2ZSwgZnJhbWVzOiBudW1iZXJbXSwgZHN0RnJhbWU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoY2xpcCk7XG4gICAgY29uc3Qgc29ydGVkRnJhbWVzID0gWy4uLmZyYW1lc10uc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIGlmIChzb3J0ZWRGcmFtZXMubGVuZ3RoID09PSAwIHx8ICFOdW1iZXIuaXNGaW5pdGUoZHN0RnJhbWUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXlmcmFtZXMgPSBxdWVyeUN1cnZlS2V5ZnJhbWVzKGN1cnZlKTtcbiAgICBjb25zdCBiYXNlRnJhbWUgPSBzb3J0ZWRGcmFtZXNbMF07XG4gICAgY29uc3QgY29waWVkID0ga2V5ZnJhbWVzXG4gICAgICAgIC5maWx0ZXIoKFt0aW1lXSkgPT4gc29ydGVkRnJhbWVzLmluY2x1ZGVzKHRpbWVUb0ZyYW1lKHRpbWUsIHNhbXBsZSkpKVxuICAgICAgICAubWFwKChbdGltZSwgdmFsdWVdKSA9PiAoe1xuICAgICAgICAgICAgZnJhbWU6IE1hdGgubWF4KDAsIHRpbWVUb0ZyYW1lKHRpbWUsIHNhbXBsZSkgLSBiYXNlRnJhbWUgKyBkc3RGcmFtZSksXG4gICAgICAgICAgICB2YWx1ZTogY2xvbmVWYWx1ZSh2YWx1ZSksXG4gICAgICAgIH0pKTtcbiAgICBpZiAoY29waWVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgY29waWVkRnJhbWVzID0gY29waWVkLm1hcChrZXlmcmFtZSA9PiBrZXlmcmFtZS5mcmFtZSk7XG4gICAgY29uc3QgcmV0YWluZWQgPSBrZXlmcmFtZXMuZmlsdGVyKChbdGltZV0pID0+ICFjb3BpZWRGcmFtZXMuaW5jbHVkZXModGltZVRvRnJhbWUodGltZSwgc2FtcGxlKSkpO1xuICAgIGNvbnN0IG5leHQgPSByZXRhaW5lZC5jb25jYXQoY29waWVkLm1hcChrZXlmcmFtZSA9PiBba2V5ZnJhbWUuZnJhbWUgLyBzYW1wbGUsIGtleWZyYW1lLnZhbHVlXSBhcyBbbnVtYmVyLCBhbnldKSk7XG4gICAgbmV4dC5zb3J0KChbbGVmdFRpbWVdLCBbcmlnaHRUaW1lXSkgPT4gbGVmdFRpbWUgLSByaWdodFRpbWUpO1xuICAgIChjdXJ2ZSBhcyBhbnkpLmFzc2lnblNvcnRlZChuZXh0KTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZHVtcENvbXBvc2l0ZVJlYWxUcmFja0NoYW5uZWxzKFxuICAgIGNsaXA6IEFuaW1hdGlvbkNsaXAsXG4gICAgdHJhY2s6IEFueVRyYWNrLFxuICAgIGRlc2NyaXB0b3I6IElQcm9wZXJ0eVRyYWNrRGVzY3JpcHRvcixcbiAgICBvcHRpb25zOiBJRHVtcFJlYWxLZXlEYXRhT3B0aW9ucyxcbik6IElBbmltYXRpb25DdXJ2ZUNoYW5uZWxEdW1wW10ge1xuICAgIGNvbnN0IHBhcnRLZXlzID0gZGVzY3JpcHRvci5wYXJ0S2V5cyB8fCBbXTtcbiAgICBjb25zdCBjaGFubmVscyA9IHF1ZXJ5VHJhY2tDaGFubmVscyh0cmFjayk7XG4gICAgcmV0dXJuIHBhcnRLZXlzLm1hcCgoa2V5LCBpbmRleCkgPT4gKHtcbiAgICAgICAga2V5LFxuICAgICAgICBkaXNwbGF5TmFtZToga2V5LFxuICAgICAgICB0eXBlOiB7IHZhbHVlOiAnY2MuTnVtYmVyJyB9LFxuICAgICAgICBrZXlmcmFtZXM6IGR1bXBSZWFsQ3VydmVLZXlmcmFtZXMoY2xpcCwgY2hhbm5lbHNbaW5kZXhdLmN1cnZlLCBvcHRpb25zKSxcbiAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGR1bXBDb21wb3NpdGVSZWFsVHJhY2tLZXlmcmFtZXMoY2xpcDogQW5pbWF0aW9uQ2xpcCwgdHJhY2s6IEFueVRyYWNrLCBkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IpOiBJQW5pbWF0aW9uQ3VydmVLZXlEdW1wW10ge1xuICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoY2xpcCk7XG4gICAgY29uc3QgY2hhbm5lbHMgPSBxdWVyeVRyYWNrQ2hhbm5lbHModHJhY2spO1xuICAgIGNvbnN0IHBhcnRLZXlzID0gZGVzY3JpcHRvci5wYXJ0S2V5cyB8fCBbXTtcbiAgICBjb25zdCB0aW1lcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwYXJ0S2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgZm9yIChjb25zdCB0aW1lIG9mIHF1ZXJ5Q3VydmVUaW1lcyhjaGFubmVsc1tpbmRleF0uY3VydmUpKSB7XG4gICAgICAgICAgICB0aW1lcy5hZGQodGltZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aW1lcylcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgICAgICAubWFwKCh0aW1lKSA9PiAoe1xuICAgICAgICAgICAgZnJhbWU6IHRpbWVUb0ZyYW1lKHRpbWUsIHNhbXBsZSksXG4gICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGJ1aWxkQ29tcG9zaXRlVmFsdWUoY2hhbm5lbHMsIHBhcnRLZXlzLCB0aW1lKSxcbiAgICAgICAgICAgICAgICB0eXBlOiBkZXNjcmlwdG9yLnR5cGUudmFsdWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGR1bXBSZWFsQ3VydmVLZXlmcmFtZXMoY2xpcDogQW5pbWF0aW9uQ2xpcCwgY3VydmU6IEFueUN1cnZlLCBvcHRpb25zOiBJRHVtcFJlYWxLZXlEYXRhT3B0aW9ucyk6IElBbmltYXRpb25DdXJ2ZUtleUR1bXBbXSB7XG4gICAgY29uc3Qgc2FtcGxlID0gZ2V0Q2xpcFNhbXBsZShjbGlwKTtcbiAgICByZXR1cm4gcXVlcnlDdXJ2ZUtleWZyYW1lcyhjdXJ2ZSlcbiAgICAgICAgLnNvcnQoKFtsZWZ0VGltZV0sIFtyaWdodFRpbWVdKSA9PiBsZWZ0VGltZSAtIHJpZ2h0VGltZSlcbiAgICAgICAgLm1hcCgoW3RpbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5RGF0YSA9IGR1bXBSZWFsS2V5RGF0YSh2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBrZXlmcmFtZSA9IHtcbiAgICAgICAgICAgICAgICBmcmFtZTogdGltZVRvRnJhbWUodGltZSwgc2FtcGxlKSxcbiAgICAgICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBxdWVyeVJlYWxDdXJ2ZU51bWJlclZhbHVlKHZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NjLk51bWJlcicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAuLi5rZXlEYXRhLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvcHlSZWFsS2V5RGF0YUludGVybmFsTWV0YWRhdGEoa2V5RGF0YSwga2V5ZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuIGtleWZyYW1lO1xuICAgICAgICB9KTtcbn1cblxuZnVuY3Rpb24gZHVtcFF1YXRDdXJ2ZUtleWZyYW1lcyhjbGlwOiBBbmltYXRpb25DbGlwLCBjdXJ2ZTogQW55Q3VydmUpOiBJQW5pbWF0aW9uQ3VydmVLZXlEdW1wW10ge1xuICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoY2xpcCk7XG4gICAgcmV0dXJuIHF1ZXJ5Q3VydmVLZXlmcmFtZXMoY3VydmUpXG4gICAgICAgIC5zb3J0KChbbGVmdFRpbWVdLCBbcmlnaHRUaW1lXSkgPT4gbGVmdFRpbWUgLSByaWdodFRpbWUpXG4gICAgICAgIC5tYXAoKFt0aW1lLCB2YWx1ZV0pID0+ICh7XG4gICAgICAgICAgICBmcmFtZTogdGltZVRvRnJhbWUodGltZSwgc2FtcGxlKSxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogY2xvbmVWYWx1ZShub3JtYWxpemVRdWF0VmFsdWUodmFsdWUudmFsdWUpKSxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUXVhdCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLi4uZHVtcFF1YXRLZXlEYXRhKHZhbHVlKSxcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiBkdW1wT2JqZWN0Q3VydmVLZXlmcmFtZXMoY2xpcDogQW5pbWF0aW9uQ2xpcCwgY3VydmU6IEFueUN1cnZlLCBkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IpOiBJQW5pbWF0aW9uQ3VydmVLZXlEdW1wW10ge1xuICAgIGNvbnN0IHNhbXBsZSA9IGdldENsaXBTYW1wbGUoY2xpcCk7XG4gICAgcmV0dXJuIHF1ZXJ5Q3VydmVLZXlmcmFtZXMoY3VydmUpXG4gICAgICAgIC5zb3J0KChbbGVmdFRpbWVdLCBbcmlnaHRUaW1lXSkgPT4gbGVmdFRpbWUgLSByaWdodFRpbWUpXG4gICAgICAgIC5tYXAoKFt0aW1lLCB2YWx1ZV0pID0+ICh7XG4gICAgICAgICAgICBmcmFtZTogdGltZVRvRnJhbWUodGltZSwgc2FtcGxlKSxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZHVtcE9iamVjdEN1cnZlVmFsdWUodmFsdWUsIGRlc2NyaXB0b3IpLFxuICAgICAgICAgICAgICAgIHR5cGU6IGRlc2NyaXB0b3IudHlwZS52YWx1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gYXNzaWduUmVhbEN1cnZlS2V5ZnJhbWVzKGN1cnZlOiBBbnlDdXJ2ZSwgc2FtcGxlOiBudW1iZXIsIGtleWZyYW1lczogSUFuaW1hdGlvbkN1cnZlS2V5RHVtcFtdKTogdm9pZCB7XG4gICAgY29uc3Qgc29ydGVkID0gWy4uLmtleWZyYW1lc10uc29ydCgoYSwgYikgPT4gYS5mcmFtZSAtIGIuZnJhbWUpLm1hcCgoa2V5ZnJhbWUpID0+IFtcbiAgICAgICAga2V5ZnJhbWUuZnJhbWUgLyBzYW1wbGUsXG4gICAgICAgIGNyZWF0ZVJlYWxDdXJ2ZVZhbHVlKG5vcm1hbGl6ZU51bWJlcihrZXlmcmFtZS5kdW1wLnZhbHVlKSwga2V5ZnJhbWUpLFxuICAgIF0pO1xuICAgIChjdXJ2ZSBhcyBhbnkpLmFzc2lnblNvcnRlZChzb3J0ZWQpO1xufVxuXG5mdW5jdGlvbiBhc3NpZ25RdWF0Q3VydmVLZXlmcmFtZXMoY3VydmU6IEFueUN1cnZlLCBzYW1wbGU6IG51bWJlciwga2V5ZnJhbWVzOiBJQW5pbWF0aW9uQ3VydmVLZXlEdW1wW10pOiB2b2lkIHtcbiAgICBjb25zdCBzb3J0ZWQgPSBbLi4ua2V5ZnJhbWVzXS5zb3J0KChhLCBiKSA9PiBhLmZyYW1lIC0gYi5mcmFtZSkubWFwKChrZXlmcmFtZSkgPT4gW1xuICAgICAgICBrZXlmcmFtZS5mcmFtZSAvIHNhbXBsZSxcbiAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IG5vcm1hbGl6ZVF1YXRWYWx1ZShrZXlmcmFtZS5kdW1wLnZhbHVlKSxcbiAgICAgICAgICAgIGludGVycG9sYXRpb25Nb2RlOiBrZXlmcmFtZS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgZWFzaW5nTWV0aG9kOiBrZXlmcmFtZS5lYXNpbmdNZXRob2QsXG4gICAgICAgIH0sXG4gICAgXSk7XG4gICAgKGN1cnZlIGFzIGFueSkuYXNzaWduU29ydGVkKHNvcnRlZCk7XG59XG5cbmZ1bmN0aW9uIGFzc2lnbk9iamVjdEN1cnZlS2V5ZnJhbWVzKGN1cnZlOiBBbnlDdXJ2ZSwgc2FtcGxlOiBudW1iZXIsIGtleWZyYW1lczogSUFuaW1hdGlvbkN1cnZlS2V5RHVtcFtdLCBkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBzb3J0ZWQgPSBbLi4ua2V5ZnJhbWVzXS5zb3J0KChhLCBiKSA9PiBhLmZyYW1lIC0gYi5mcmFtZSkubWFwKChrZXlmcmFtZSkgPT4gW1xuICAgICAgICBrZXlmcmFtZS5mcmFtZSAvIHNhbXBsZSxcbiAgICAgICAgbm9ybWFsaXplT2JqZWN0Q3VydmVWYWx1ZSh7IC4uLmRlc2NyaXB0b3IsIHR5cGU6IHsgdmFsdWU6IGtleWZyYW1lLmR1bXAudHlwZSB8fCBkZXNjcmlwdG9yLnR5cGUudmFsdWUgfSB9LCBrZXlmcmFtZS5kdW1wLnZhbHVlKSxcbiAgICBdKTtcbiAgICAoY3VydmUgYXMgYW55KS5hc3NpZ25Tb3J0ZWQoc29ydGVkKTtcbn1cblxuZnVuY3Rpb24gc2V0Q3VydmVLZXkoY3VydmU6IEFueUN1cnZlLCB0aW1lOiBudW1iZXIsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ZnJhbWVzID0gcXVlcnlDdXJ2ZUtleWZyYW1lcyhjdXJ2ZSlcbiAgICAgICAgLmZpbHRlcigoW2tleVRpbWVdKSA9PiAhaXNTYW1lVGltZShrZXlUaW1lLCB0aW1lKSlcbiAgICAgICAgLmNvbmNhdChbW3RpbWUsIHZhbHVlXSBhcyBbbnVtYmVyLCB1bmtub3duXV0pO1xuICAgIGtleWZyYW1lcy5zb3J0KChhLCBiKSA9PiBhWzBdIC0gYlswXSk7XG4gICAgKGN1cnZlIGFzIGFueSkuYXNzaWduU29ydGVkKGtleWZyYW1lcyk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdEN1cnZlVmFsdWUoZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yLCB2YWx1ZTogSUFuaW1hdGlvblZhbHVlKTogdW5rbm93biB7XG4gICAgY29uc3QgYXNzZXRWYWx1ZSA9IG5vcm1hbGl6ZUFzc2V0Q3VydmVWYWx1ZShkZXNjcmlwdG9yLCB2YWx1ZSk7XG4gICAgaWYgKGFzc2V0VmFsdWUgPT09IElOVkFMSURfQVNTRVRfVkFMVUUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0VmFsdWUgIT09IE5PVF9BU1NFVF9UWVBFKSB7XG4gICAgICAgIHJldHVybiBhc3NldFZhbHVlO1xuICAgIH1cbiAgICBjb25zdCB0eXBlZFZhbHVlID0gbm9ybWFsaXplVHlwZWRPYmplY3RDdXJ2ZVZhbHVlKGRlc2NyaXB0b3IsIHZhbHVlKTtcbiAgICBpZiAodHlwZWRWYWx1ZSAhPT0gTk9UX1RZUEVEX09CSkVDVCkge1xuICAgICAgICByZXR1cm4gdHlwZWRWYWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGNsb25lVmFsdWUodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBkdW1wT2JqZWN0Q3VydmVWYWx1ZSh2YWx1ZTogdW5rbm93biwgZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yKTogSUFuaW1hdGlvblZhbHVlIHtcbiAgICBpZiAoaXNBc3NldERlc2NyaXB0b3IoZGVzY3JpcHRvcikgfHwgaXNBbmltYXRpb25Bc3NldFZhbHVlKHZhbHVlKSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQW5pbWF0aW9uQXNzZXRWYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVBbmltYXRpb25Bc3NldFZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1dWlkID0gcXVlcnlBbmltYXRpb25Bc3NldFV1aWQodmFsdWUpO1xuICAgICAgICByZXR1cm4gdXVpZCA/IHsgdXVpZCB9IDogbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGNsb25lU2VyaWFsaXphYmxlVmFsdWUodmFsdWUpIGFzIElBbmltYXRpb25WYWx1ZTtcbn1cblxuY29uc3QgTk9UX0FTU0VUX1RZUEUgPSBTeW1ib2woJ25vdEFzc2V0VHlwZScpO1xuY29uc3QgSU5WQUxJRF9BU1NFVF9WQUxVRSA9IFN5bWJvbCgnaW52YWxpZEFzc2V0VmFsdWUnKTtcbmNvbnN0IE5PVF9UWVBFRF9PQkpFQ1QgPSBTeW1ib2woJ25vdFR5cGVkT2JqZWN0Jyk7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFzc2V0Q3VydmVWYWx1ZShkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IsIHZhbHVlOiBJQW5pbWF0aW9uVmFsdWUpOiB1bmtub3duIHwgdHlwZW9mIE5PVF9BU1NFVF9UWVBFIHwgdHlwZW9mIElOVkFMSURfQVNTRVRfVkFMVUUge1xuICAgIGNvbnN0IGFzc2V0Q3RvciA9IHF1ZXJ5QXNzZXRDdG9yKGRlc2NyaXB0b3IpO1xuICAgIGlmICghYXNzZXRDdG9yKSB7XG4gICAgICAgIHJldHVybiBOT1RfQVNTRVRfVFlQRTtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBhc3NldEN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCB1dWlkID0gcXVlcnlBbmltYXRpb25Bc3NldFV1aWQodmFsdWUpO1xuICAgIGlmICghdXVpZCkge1xuICAgICAgICByZXR1cm4gSU5WQUxJRF9BU1NFVF9WQUxVRTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZUFuaW1hdGlvbkFzc2V0UGxhY2Vob2xkZXIoYXNzZXRDdG9yLCB1dWlkKTtcbn1cblxuZnVuY3Rpb24gaXNBc3NldERlc2NyaXB0b3IoZGVzY3JpcHRvcjogSVByb3BlcnR5VHJhY2tEZXNjcmlwdG9yKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4ocXVlcnlBc3NldEN0b3IoZGVzY3JpcHRvcikpO1xufVxuXG5mdW5jdGlvbiBxdWVyeUFzc2V0Q3RvcihkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IpOiAobmV3ICgpID0+IEFzc2V0KSB8IG51bGwge1xuICAgIHJldHVybiBxdWVyeUFuaW1hdGlvbkFzc2V0Q3RvcihkZXNjcmlwdG9yKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVHlwZWRPYmplY3RDdXJ2ZVZhbHVlKGRlc2NyaXB0b3I6IElQcm9wZXJ0eVRyYWNrRGVzY3JpcHRvciwgdmFsdWU6IElBbmltYXRpb25WYWx1ZSk6IHVua25vd24gfCB0eXBlb2YgTk9UX1RZUEVEX09CSkVDVCB7XG4gICAgY29uc3QgY3RvciA9IHF1ZXJ5VHlwZWRPYmplY3RDdG9yKGRlc2NyaXB0b3IpO1xuICAgIGlmICghY3Rvcikge1xuICAgICAgICByZXR1cm4gTk9UX1RZUEVEX09CSkVDVDtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBjdG9yKSB7XG4gICAgICAgIHJldHVybiBjbG9uZVZhbHVlKHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB0eXBlTmFtZSA9IGRlc2NyaXB0b3IudHlwZT8udmFsdWUgfHwgJyc7XG4gICAgaWYgKCF0eXBlTmFtZSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgY3RvcigpO1xuICAgICAgICBPYmplY3QuYXNzaWduKHJlc3VsdCBhcyBvYmplY3QsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplKHtcbiAgICAgICAgX190eXBlX186IHR5cGVOYW1lLFxuICAgICAgICAuLi4odmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLFxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBxdWVyeVR5cGVkT2JqZWN0Q3RvcihkZXNjcmlwdG9yOiBJUHJvcGVydHlUcmFja0Rlc2NyaXB0b3IpOiAobmV3ICgpID0+IHVua25vd24pIHwgbnVsbCB7XG4gICAgaWYgKHF1ZXJ5QW5pbWF0aW9uQXNzZXRDdG9yKGRlc2NyaXB0b3IpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB0eXBlTmFtZSA9IGRlc2NyaXB0b3IudHlwZT8udmFsdWUgfHwgJyc7XG4gICAgaWYgKCFkZXNjcmlwdG9yLnZhbHVlQ3RvciAmJiAoIXR5cGVOYW1lIHx8IHR5cGVOYW1lID09PSAnY2MuT2JqZWN0JyB8fCB0eXBlTmFtZSA9PT0gJ09iamVjdCcgfHwgdHlwZU5hbWUgPT09ICdVbmtub3duJykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGN0b3IgPSBkZXNjcmlwdG9yLnZhbHVlQ3RvciB8fCBqcy5nZXRDbGFzc0J5TmFtZSh0eXBlTmFtZSk7XG4gICAgcmV0dXJuIHR5cGVvZiBjdG9yID09PSAnZnVuY3Rpb24nID8gY3RvciBhcyBuZXcgKCkgPT4gdW5rbm93biA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlYWxDdXJ2ZUtleShjdXJ2ZTogQW55Q3VydmUsIHRpbWU6IG51bWJlciwgdmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwsIGtleURhdGE/OiBJQW5pbWF0aW9uQ3VydmVLZXlEYXRhKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZXhpc3RlZCA9IGZpbmRSZWFsQ3VydmVLZXkoY3VydmUgYXMgYW55LCB0aW1lKTtcbiAgICBpZiAoIWV4aXN0ZWQpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBzZXRDdXJ2ZUtleShjdXJ2ZSwgdGltZSwgY3JlYXRlUmVhbEN1cnZlVmFsdWUodmFsdWUsIGtleURhdGEpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gdmFsdWUgPz8gcXVlcnlSZWFsQ3VydmVOdW1iZXJWYWx1ZShleGlzdGVkWzFdKTtcbiAgICBzZXRDdXJ2ZUtleShjdXJ2ZSwgdGltZSwgY3JlYXRlTWVyZ2VkUmVhbEN1cnZlVmFsdWUoY3VycmVudFZhbHVlLCBleGlzdGVkWzFdLCBrZXlEYXRhKSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNhblVwZGF0ZVJlYWxDdXJ2ZUtleShjdXJ2ZTogQW55Q3VydmUsIHRpbWU6IG51bWJlciwgdmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbihmaW5kUmVhbEN1cnZlS2V5KGN1cnZlIGFzIGFueSwgdGltZSkpIHx8ICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUXVhdEN1cnZlS2V5KGN1cnZlOiBBbnlDdXJ2ZSwgdGltZTogbnVtYmVyLCB2YWx1ZTogSUFuaW1hdGlvblZhbHVlLCBrZXlEYXRhPzogSUFuaW1hdGlvbkN1cnZlS2V5RGF0YSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGV4aXN0ZWQgPSBxdWVyeUN1cnZlS2V5ZnJhbWVzKGN1cnZlKS5maW5kKChba2V5VGltZV0pID0+IGlzU2FtZVRpbWUoa2V5VGltZSwgdGltZSkpO1xuICAgIGlmICghZXhpc3RlZCkge1xuICAgICAgICBjb25zdCBxdWF0VmFsdWUgPSBub3JtYWxpemVRdWF0VmFsdWUodmFsdWUpO1xuICAgICAgICBpZiAoIXF1YXRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHNldEN1cnZlS2V5KGN1cnZlLCB0aW1lLCBjcmVhdGVRdWF0Q3VydmVWYWx1ZShxdWF0VmFsdWUsIGtleURhdGEpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dFZhbHVlID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IG5vcm1hbGl6ZVF1YXRWYWx1ZShleGlzdGVkWzFdPy52YWx1ZSkgOiBub3JtYWxpemVRdWF0VmFsdWUodmFsdWUpO1xuICAgIGlmICghbmV4dFZhbHVlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgc2V0Q3VydmVLZXkoY3VydmUsIHRpbWUsIHtcbiAgICAgICAgdmFsdWU6IG5leHRWYWx1ZSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbk1vZGU6IGtleURhdGE/LmludGVycE1vZGUgPz8gZXhpc3RlZFsxXT8uaW50ZXJwb2xhdGlvbk1vZGUsXG4gICAgICAgIGVhc2luZ01ldGhvZDoga2V5RGF0YT8uZWFzaW5nTWV0aG9kID8/IGV4aXN0ZWRbMV0/LmVhc2luZ01ldGhvZCxcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUXVhdEN1cnZlVmFsdWUodmFsdWU6IElBbmltYXRpb25WYWx1ZSwga2V5RGF0YT86IElBbmltYXRpb25DdXJ2ZUtleURhdGEpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGludGVycG9sYXRpb25Nb2RlOiBrZXlEYXRhPy5pbnRlcnBNb2RlLFxuICAgICAgICBlYXNpbmdNZXRob2Q6IGtleURhdGE/LmVhc2luZ01ldGhvZCxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBkdW1wUXVhdEtleURhdGEodmFsdWU6IGFueSk6IElBbmltYXRpb25DdXJ2ZUtleURhdGEge1xuICAgIGNvbnN0IGRhdGE6IElBbmltYXRpb25DdXJ2ZUtleURhdGEgPSB7fTtcbiAgICBzZXROb25EZWZhdWx0TnVtYmVyKGRhdGEsICdpbnRlcnBNb2RlJywgdmFsdWUuaW50ZXJwb2xhdGlvbk1vZGUpO1xuICAgIHNldE5vbkRlZmF1bHROdW1iZXIoZGF0YSwgJ2Vhc2luZ01ldGhvZCcsIHZhbHVlLmVhc2luZ01ldGhvZCk7XG4gICAgcmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIHNldE5vbkRlZmF1bHROdW1iZXIoZGF0YTogSUFuaW1hdGlvbkN1cnZlS2V5RGF0YSwga2V5OiBrZXlvZiBJQW5pbWF0aW9uQ3VydmVLZXlEYXRhLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIGNvbnN0IG51bWJlclZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKG51bWJlclZhbHVlKSAmJiBudW1iZXJWYWx1ZSAhPT0gMCkge1xuICAgICAgICAoZGF0YSBhcyBhbnkpW2tleV0gPSBudW1iZXJWYWx1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29tcG9zaXRlVmFsdWUoY2hhbm5lbHM6IEFycmF5PHsgY3VydmU6IGFueSB9PiwgcGFydEtleXM6IHJlYWRvbmx5IHN0cmluZ1tdLCB0aW1lOiBudW1iZXIpOiBJQW5pbWF0aW9uVmFsdWUge1xuICAgIGNvbnN0IHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBJQW5pbWF0aW9uVmFsdWU+ID0ge307XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHBhcnRLZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YWx1ZVtwYXJ0S2V5c1tpbmRleF1dID0gbm9ybWFsaXplTnVtYmVyKGNoYW5uZWxzW2luZGV4XS5jdXJ2ZS5ldmFsdWF0ZSh0aW1lKSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29tcG9zaXRlVmFsdWUodmFsdWU6IElBbmltYXRpb25WYWx1ZSwgcGFydEtleXM6IHJlYWRvbmx5IHN0cmluZ1tdKTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiB8IG51bGwge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBwYXJ0S2V5cykge1xuICAgICAgICBjb25zdCBudW1iZXJWYWx1ZSA9IE51bWJlcigodmFsdWUgYXMgYW55KVtrZXldKTtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtYmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRba2V5XSA9IG51bWJlclZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVRdWF0VmFsdWUodmFsdWU6IHVua25vd24pOiBJQW5pbWF0aW9uVmFsdWUge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgeCA9IE51bWJlcigodmFsdWUgYXMgYW55KS54KTtcbiAgICBjb25zdCB5ID0gTnVtYmVyKCh2YWx1ZSBhcyBhbnkpLnkpO1xuICAgIGNvbnN0IHogPSBOdW1iZXIoKHZhbHVlIGFzIGFueSkueik7XG4gICAgY29uc3QgdyA9IE51bWJlcigodmFsdWUgYXMgYW55KS53KTtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZSh4KSB8fCAhTnVtYmVyLmlzRmluaXRlKHkpIHx8ICFOdW1iZXIuaXNGaW5pdGUoeikgfHwgIU51bWJlci5pc0Zpbml0ZSh3KSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHsgeCwgeSwgeiwgdyB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOdW1iZXJWYWx1ZSh2YWx1ZTogSUFuaW1hdGlvblZhbHVlKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgbnVtYmVyVmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUobnVtYmVyVmFsdWUpID8gbnVtYmVyVmFsdWUgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOdW1iZXIodmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICAgIGNvbnN0IG51bWJlclZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKG51bWJlclZhbHVlKSA/IG51bWJlclZhbHVlIDogMDtcbn1cblxuZnVuY3Rpb24gcXVlcnlDdXJ2ZUtleWZyYW1lcyhjdXJ2ZTogQW55Q3VydmUpOiBBcnJheTxbbnVtYmVyLCBhbnldPiB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oKGN1cnZlIGFzIGFueSkua2V5ZnJhbWVzPy4oKSB8fCBbXSkgYXMgQXJyYXk8W251bWJlciwgYW55XT47XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5Q3VydmVUaW1lcyhjdXJ2ZTogQW55Q3VydmUpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oKGN1cnZlIGFzIGFueSkudGltZXM/LigpIHx8IFtdKSBhcyBudW1iZXJbXTtcbn1cblxuZnVuY3Rpb24gdGltZVRvRnJhbWUodGltZTogbnVtYmVyLCBzYW1wbGU6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQodGltZSAqIHNhbXBsZSk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZVRpbWUobGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIE1hdGguYWJzKGxlZnQgLSByaWdodCkgPD0gMWUtNjtcbn1cbiJdfQ==