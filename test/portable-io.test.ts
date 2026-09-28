import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractZip } from "../src/project/unzip.js";

const { mediaDuration } = createRequire(import.meta.url)(
  "../vendor/cocos-core/dist/core/assets/asset-handler/media-duration.js",
) as { mediaDuration: (path: string) => number };

/** Minimal zip writer: [name, content | null for a directory, deflate?]. CRCs are not checked on extract. */
function zipOf(entries: [string, string | null, boolean][]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content, deflate] of entries) {
    const nameBytes = Buffer.from(name);
    const raw = Buffer.from(content ?? "");
    const data = deflate ? deflateRawSync(raw) : raw;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

describe("extractZip", () => {
  it("extracts stored and deflated entries without a system unzip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "kurenai-zip-"));
    const zip = join(dir, "kit.zip");
    await writeFile(zip, zipOf([
      ["kit/", null, false],
      ["kit/README.md", "# Kit", false],
      ["kit/glb/Knight.glb", "glb".repeat(100), true],
    ]));
    await extractZip(zip, join(dir, "out"));
    expect(await readFile(join(dir, "out/kit/README.md"), "utf8")).toBe("# Kit");
    expect(await readFile(join(dir, "out/kit/glb/Knight.glb"), "utf8")).toBe("glb".repeat(100));
  });

  it("refuses entries that escape the target directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "kurenai-zip-"));
    const zip = join(dir, "evil.zip");
    await writeFile(zip, zipOf([["../evil.txt", "x", false]]));
    await expect(extractZip(zip, join(dir, "out"))).rejects.toThrow(/escapes/);
  });
});

describe("mediaDuration", () => {
  it("reads WAV duration from the header", async () => {
    const rate = 8000;
    const seconds = 1.5;
    const data = rate * 2 * seconds;
    const wav = Buffer.alloc(44 + data);
    wav.write("RIFF", 0, "latin1");
    wav.writeUInt32LE(36 + data, 4);
    wav.write("WAVEfmt ", 8, "latin1");
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(rate, 24);
    wav.writeUInt32LE(rate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36, "latin1");
    wav.writeUInt32LE(data, 40);
    const path = join(await mkdtemp(join(tmpdir(), "kurenai-wav-")), "a.wav");
    await writeFile(path, wav);
    expect(mediaDuration(path)).toBeCloseTo(seconds, 6);
  });

  it("reads MP4/M4A duration from mvhd", async () => {
    const box = (type: string, body: Buffer) => {
      const head = Buffer.alloc(8);
      head.writeUInt32BE(8 + body.length, 0);
      head.write(type, 4, "latin1");
      return Buffer.concat([head, body]);
    };
    const mvhd = Buffer.alloc(100);
    mvhd.writeUInt32BE(1000, 12);
    mvhd.writeUInt32BE(4533, 16);
    const file = Buffer.concat([box("ftyp", Buffer.from("M4A \0\0\0\0")), box("moov", box("mvhd", mvhd))]);
    const path = join(await mkdtemp(join(tmpdir(), "kurenai-mp4-")), "a.m4a");
    await writeFile(path, file);
    expect(mediaDuration(path)).toBeCloseTo(4.533, 6);
  });

  it("rejects unknown formats", async () => {
    const path = join(await mkdtemp(join(tmpdir(), "kurenai-pcm-")), "a.pcm");
    await writeFile(path, Buffer.alloc(64));
    expect(() => mediaDuration(path)).toThrow(/unsupported/);
  });
});
