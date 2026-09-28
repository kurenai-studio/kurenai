"use strict";
// kurenai: pure-JS media duration (replaces the per-platform ffprobe binary).
// Supports the extensions the audio/video importers accept: wav, mp3, ogg (Vorbis/Opus), aac (ADTS), m4a/mp4.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaDuration = mediaDuration;
const fs = require("fs");

function mediaDuration(filePath) {
    const b = fs.readFileSync(filePath);
    const tag = b.toString("latin1", 0, 4);
    if (tag === "RIFF" && b.toString("latin1", 8, 12) === "WAVE") return wav(b);
    if (tag === "OggS") return ogg(b);
    if (b.toString("latin1", 4, 8) === "ftyp") return mp4(b);
    if (tag.startsWith("ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) {
        return (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) ? adts(b) : mp3(b);
    }
    throw new Error(`unsupported media format: ${filePath}`);
}

function wav(b) {
    let byteRate = 0;
    for (let o = 12; o + 8 <= b.length;) {
        const id = b.toString("latin1", o, o + 4);
        let size = b.readUInt32LE(o + 4);
        if (id === "fmt ") byteRate = b.readUInt32LE(o + 16);
        if (id === "data") {
            if (size === 0xffffffff || o + 8 + size > b.length) size = b.length - o - 8;
            if (!byteRate) break;
            return size / byteRate;
        }
        o += 8 + size + (size & 1);
    }
    throw new Error("wav: missing fmt or data chunk");
}

const MP3_BITRATES = {
    // [version 1 | 2][layer 1..3] in kbps, index 1..14
    "1-1": [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    "1-2": [32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    "1-3": [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    "2-1": [32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    "2-2": [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    "2-3": [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const MP3_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

function mp3(b) {
    let o = 0;
    if (b.toString("latin1", 0, 3) === "ID3") {
        o = 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f));
    }
    let seconds = 0;
    let frames = 0;
    while (o + 4 <= b.length) {
        const h = b.readUInt32BE(o);
        const versionBits = (h >> 19) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
        const layerBits = (h >> 17) & 3; // 3 = layer I, 2 = II, 1 = III
        const brIndex = (h >> 12) & 15;
        const srIndex = (h >> 10) & 3;
        if ((h >>> 21) !== 0x7ff || versionBits === 1 || layerBits === 0 || brIndex === 0 || brIndex === 15 || srIndex === 3) {
            o++;
            continue;
        }
        const layer = 4 - layerBits;
        const v = versionBits === 3 ? 1 : 2;
        const bitrate = MP3_BITRATES[`${v}-${layer}`][brIndex - 1] * 1000;
        const rate = MP3_RATES[versionBits][srIndex];
        const pad = (h >> 9) & 1;
        const samples = layer === 1 ? 384 : layer === 3 && v === 2 ? 576 : 1152;
        if (frames === 0) {
            // Xing/Info (VBR) header carries the frame count.
            const side = layer !== 3 ? 0 : v === 1 ? ((h >> 6) & 3) === 3 ? 17 : 32 : ((h >> 6) & 3) === 3 ? 9 : 17;
            const x = o + 4 + side;
            const xtag = b.toString("latin1", x, x + 4);
            if ((xtag === "Xing" || xtag === "Info") && (b.readUInt32BE(x + 4) & 1)) {
                return (b.readUInt32BE(x + 8) * samples) / rate;
            }
        }
        const length = layer === 1 ? Math.floor((12 * bitrate) / rate + pad) * 4 : Math.floor((samples / 8 * bitrate) / rate) + pad;
        seconds += samples / rate;
        frames++;
        o += length;
    }
    if (!frames) throw new Error("mp3: no frames");
    return seconds;
}

const AAC_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];

function adts(b) {
    let seconds = 0;
    for (let o = 0; o + 7 <= b.length;) {
        if (b[o] !== 0xff || (b[o + 1] & 0xf6) !== 0xf0) {
            o++;
            continue;
        }
        const rate = AAC_RATES[(b[o + 2] >> 2) & 15];
        const length = ((b[o + 3] & 3) << 11) | (b[o + 4] << 3) | (b[o + 5] >> 5);
        if (!rate || length < 7) break;
        seconds += (1024 * ((b[o + 6] & 3) + 1)) / rate;
        o += length;
    }
    return seconds;
}

function ogg(b) {
    let rate = 0;
    let preSkip = 0;
    const vorbis = b.indexOf("\x01vorbis", 0, "latin1");
    const opus = b.indexOf("OpusHead", 0, "latin1");
    if (opus >= 0 && (vorbis < 0 || opus < vorbis)) {
        rate = 48000;
        preSkip = b.readUInt16LE(opus + 10);
    } else if (vorbis >= 0) {
        rate = b.readUInt32LE(vorbis + 12);
    }
    if (!rate) throw new Error("ogg: unknown codec");
    for (let o = b.lastIndexOf("OggS", b.length - 4, "latin1"); o >= 0; o = b.lastIndexOf("OggS", o - 1, "latin1")) {
        const granule = Number(b.readBigUInt64LE(o + 6));
        if (granule > 0 && granule < Number.MAX_SAFE_INTEGER) return Math.max(0, granule - preSkip) / rate;
    }
    throw new Error("ogg: no granule position");
}

function mp4(b) {
    const box = (start, end, type) => {
        for (let o = start; o + 8 <= end;) {
            let size = b.readUInt32BE(o);
            let header = 8;
            if (size === 1) {
                size = Number(b.readBigUInt64BE(o + 8));
                header = 16;
            } else if (size === 0) {
                size = end - o;
            }
            if (size < header) break;
            if (b.toString("latin1", o + 4, o + 8) === type) return [o + header, o + size];
            o += size;
        }
        return null;
    };
    const moov = box(0, b.length, "moov");
    const mvhd = moov && box(moov[0], moov[1], "mvhd");
    if (!mvhd) throw new Error("mp4: no mvhd box");
    const o = mvhd[0];
    const [timescale, duration] = b[o] === 1
        ? [b.readUInt32BE(o + 20), Number(b.readBigUInt64BE(o + 24))]
        : [b.readUInt32BE(o + 12), b.readUInt32BE(o + 16)];
    if (!timescale) throw new Error("mp4: zero timescale");
    return duration / timescale;
}
