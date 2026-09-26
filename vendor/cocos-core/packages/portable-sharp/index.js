'use strict';
/**
 * Sharp-compatible facade backed by jimp (pure JS).
 * Covers the subset cocos-cli asset-db / texture tools actually call.
 */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const MIME = {
  png: Jimp.MIME_PNG,
  jpeg: Jimp.MIME_JPEG,
  jpg: Jimp.MIME_JPEG,
  bmp: Jimp.MIME_BMP,
  gif: Jimp.MIME_GIF,
  tiff: Jimp.MIME_TIFF,
};

function formatFromPath(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase().replace('.', '');
  if (ext === 'jpg') return 'jpeg';
  if (ext === 'webp') return 'png';
  return ext || 'png';
}

function mimeFor(format) {
  const key = String(format || 'png').toLowerCase();
  return MIME[key] || Jimp.MIME_PNG;
}

function jimpColorFromBackground(background) {
  const bg = background || { r: 0, g: 0, b: 0, alpha: 0 };
  const a = Math.round((bg.alpha == null ? 1 : bg.alpha) * 255);
  return Jimp.rgbaToInt(bg.r & 255, bg.g & 255, bg.b & 255, a);
}

function createJimp(width, height, color) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-new
    new Jimp(width, height, color, (err, img) => (err ? reject(err) : resolve(img)));
  });
}

function createJimpFromRaw(data, width, height) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-new
    new Jimp({ data, width, height }, (err, img) => (err ? reject(err) : resolve(img)));
  });
}

function expandToRgba(input, width, height, channels) {
  if (channels === 4) return Buffer.from(input);
  if (channels === 3) {
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; i < input.length; i += 3, j += 4) {
      rgba[j] = input[i];
      rgba[j + 1] = input[i + 1];
      rgba[j + 2] = input[i + 2];
      rgba[j + 3] = 255;
    }
    return rgba;
  }
  if (channels === 1) {
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; i < input.length; i += 1, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = input[i];
      rgba[j + 3] = 255;
    }
    return rgba;
  }
  throw new Error(`portable-sharp: unsupported raw channels=${channels}`);
}

class SharpPipeline {
  constructor(input, options = {}) {
    this._input = input;
    this._options = options || {};
    this._ops = [];
    this._outFormat = null;
    this._outFormatOpts = {};
    this._wantRaw = false;
  }

  _queue(op) {
    this._ops.push(op);
    return this;
  }

  extract(rect) {
    return this._queue({ type: 'extract', rect });
  }

  rotate(angle = 0) {
    return this._queue({ type: 'rotate', angle: Number(angle) || 0 });
  }

  flip() {
    return this._queue({ type: 'flip' });
  }

  resize(width, height) {
    return this._queue({ type: 'resize', width, height });
  }

  ensureAlpha() {
    return this._queue({ type: 'ensureAlpha' });
  }

  raw() {
    this._wantRaw = true;
    return this;
  }

  png(opts = {}) {
    this._outFormat = 'png';
    this._outFormatOpts = opts || {};
    return this;
  }

  jpeg(opts = {}) {
    this._outFormat = 'jpeg';
    this._outFormatOpts = opts || {};
    return this;
  }

  toFormat(format, opts = {}) {
    if (format && typeof format === 'object' && format.id) {
      this._outFormat = format.id;
    } else {
      this._outFormat = String(format || 'png').toLowerCase();
    }
    this._outFormatOpts = opts || {};
    return this;
  }

  composite(inputs) {
    return this._queue({ type: 'composite', inputs: inputs || [] });
  }

  pipelineColourspace() {
    return this;
  }

  toColourspace() {
    return this;
  }

  async metadata() {
    const image = await this._loadFresh();
    const hasAlpha = image.hasAlpha();
    let format = this._outFormat;
    if (!format && typeof this._input === 'string') {
      format = formatFromPath(this._input);
    }
    return {
      width: image.bitmap.width,
      height: image.bitmap.height,
      channels: hasAlpha ? 4 : 3,
      hasAlpha,
      format: format || 'png',
      depth: 'uchar',
      space: 'srgb',
    };
  }

  async toBuffer(opts = {}) {
    const image = await this._applyOps(await this._loadFresh());
    if (this._wantRaw) {
      const data = Buffer.from(image.bitmap.data);
      const info = {
        width: image.bitmap.width,
        height: image.bitmap.height,
        channels: 4,
        size: data.length,
        format: 'raw',
      };
      if (opts && opts.resolveWithObject) return { data, info };
      return data;
    }
    this._applyEncodeOptions(image);
    const format = this._outFormat || 'png';
    const data = await image.getBufferAsync(mimeFor(format));
    if (opts && opts.resolveWithObject) {
      return {
        data,
        info: {
          width: image.bitmap.width,
          height: image.bitmap.height,
          channels: image.hasAlpha() ? 4 : 3,
          size: data.length,
          format,
        },
      };
    }
    return data;
  }

  async toFile(dest) {
    const image = await this._applyOps(await this._loadFresh());
    let format = this._outFormat;
    if (!format) format = formatFromPath(dest);
    this._outFormat = format;
    this._applyEncodeOptions(image);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await image.writeAsync(dest);
    const stat = await fs.promises.stat(dest);
    return {
      format,
      width: image.bitmap.width,
      height: image.bitmap.height,
      channels: image.hasAlpha() ? 4 : 3,
      size: stat.size,
    };
  }

  _applyEncodeOptions(image) {
    const format = this._outFormat || 'png';
    const quality = this._outFormatOpts.quality;
    if (typeof quality === 'number' && (format === 'jpeg' || format === 'jpg')) {
      image.quality(Math.max(1, Math.min(100, quality)));
    }
  }

  async _loadFresh() {
    const input = this._input;
    const options = this._options;

    if (input && typeof input === 'object' && !Buffer.isBuffer(input) && input.create) {
      const { width, height, channels = 4, background } = input.create;
      const image = await createJimp(width, height, jimpColorFromBackground(background));
      if (channels === 4) image.rgba(true);
      return image;
    }

    if (options.raw && Buffer.isBuffer(input)) {
      const { width, height, channels } = options.raw;
      const data = expandToRgba(input, width, height, channels);
      return createJimpFromRaw(data, width, height);
    }

    if (typeof input === 'string' || Buffer.isBuffer(input)) {
      return Jimp.read(input);
    }

    throw new Error('portable-sharp: unsupported input');
  }

  async _applyOps(start) {
    let image = start;
    for (const op of this._ops) {
      switch (op.type) {
        case 'extract': {
          const { left, top, width, height } = op.rect;
          image = image.clone().crop(left, top, width, height);
          break;
        }
        case 'rotate': {
          // sharp: positive = clockwise. jimp 0.22: positive = counter-clockwise.
          if (op.angle) image = image.clone().rotate(-op.angle, false);
          break;
        }
        case 'flip': {
          image = image.clone().flip(false, true);
          break;
        }
        case 'resize': {
          image = image.clone().resize(op.width, op.height);
          break;
        }
        case 'ensureAlpha': {
          image = image.clone();
          image.rgba(true);
          break;
        }
        case 'composite': {
          image = image.clone();
          for (const item of op.inputs) {
            const overlay = await Jimp.read(item.input);
            image.composite(overlay, item.left || 0, item.top || 0);
          }
          break;
        }
        default:
          throw new Error(`portable-sharp: unsupported op ${op.type}`);
      }
    }
    return image;
  }
}

function sharp(input, options) {
  return new SharpPipeline(input, options);
}

sharp.cache = function cache() {
  return sharp;
};
sharp.concurrency = function concurrency() {
  return 1;
};
sharp.simd = function simd() {
  return false;
};
sharp.versions = {
  sharp: '0.32.6-kurenai.portable',
  jimp: require('jimp/package.json').version,
  kurenai: 'portable-jimp',
};
sharp.format = {
  png: { id: 'png' },
  jpeg: { id: 'jpeg' },
  jpg: { id: 'jpeg' },
  webp: { id: 'webp' },
  raw: { id: 'raw' },
};

module.exports = sharp;
module.exports.default = sharp;
