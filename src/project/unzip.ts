import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { inflateRawSync } from "node:zlib";

const END_OF_CENTRAL_DIR = 0x06054b50;
const CENTRAL_FILE = 0x02014b50;
const LOCAL_FILE = 0x04034b50;

/** Extracts a (non-zip64, unencrypted) zip into dest without relying on a system `unzip`. */
export async function extractZip(zipPath: string, dest: string): Promise<void> {
  const zip = await readFile(zipPath);
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (zip.readUInt32LE(i) === END_OF_CENTRAL_DIR) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${zipPath} is not a zip file`);

  const root = resolve(dest);
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== CENTRAL_FILE) throw new Error(`${zipPath}: corrupt central directory`);
    const flags = zip.readUInt16LE(p + 8);
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLength = zip.readUInt16LE(p + 28);
    const next = p + 46 + nameLength + zip.readUInt16LE(p + 30) + zip.readUInt16LE(p + 32);
    const localHeader = zip.readUInt32LE(p + 42);
    const name = zip.toString("utf8", p + 46, p + 46 + nameLength);
    p = next;

    if (flags & 1) throw new Error(`${zipPath}: encrypted entries are not supported`);
    if (size === 0xffffffff || localHeader === 0xffffffff) throw new Error(`${zipPath}: zip64 is not supported`);
    const target = resolve(root, name);
    if (target !== root && !target.startsWith(root + sep)) throw new Error(`${zipPath}: entry escapes target dir: ${name}`);
    if (name.endsWith("/")) {
      await mkdir(target, { recursive: true });
      continue;
    }

    if (zip.readUInt32LE(localHeader) !== LOCAL_FILE) throw new Error(`${zipPath}: corrupt local header for ${name}`);
    const start = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
    const raw = zip.subarray(start, start + size);
    let data: Buffer;
    if (method === 0) data = raw;
    else if (method === 8) data = inflateRawSync(raw);
    else throw new Error(`${zipPath}: unsupported compression method ${method} for ${name}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
  }
}
