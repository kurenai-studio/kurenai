#!/usr/bin/env python3
"""
Git clean filter for GDevelop/Wanaka JSON files. Strips volatile fields
that otherwise produce noisy diffs on every save:
  - collisionMask (recomputed on build)
  - persistentUuid (stable but regenerated on some edits)
  - timestamp / build (mtime-like; not meaningful for diffs)

Two invocation modes:

  python3 json-diff-filter.py
    Per-file clean filter: read JSON on stdin, write cleaned JSON on stdout.
    Compatible with `git config filter.<name>.clean = "python3 .../json-diff-filter.py"`.

  python3 json-diff-filter.py --process
    Long-running filter process: implements the git protocol described in
    `gitattributes(5)` Long Running Filter Process. One subprocess handles
    every file in a `git add` / `git checkout` invocation, eliminating
    fork+exec overhead. Compatible with
    `git config filter.<name>.process = "python3 .../json-diff-filter.py --process"`.

The cleaning algorithm is identical between the two modes; only the IO
framing differs.
"""
import json
import sys
from typing import List, Optional


def clean(obj):
    if isinstance(obj, dict):
        obj.pop("collisionMask", None)
        obj.pop("persistentUuid", None)
        obj.pop("timestamp", None)
        obj.pop("build", None)
        for v in obj.values():
            clean(v)
    elif isinstance(obj, list):
        for v in obj:
            clean(v)
    return obj


def clean_bytes(raw: bytes) -> bytes:
    """Run the clean algorithm on raw bytes. Non-JSON input passes through
    unchanged (v1 parity)."""
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return raw
    out = json.dumps(
        clean(data),
        indent=2,
        separators=(",", ": "),
        ensure_ascii=False,
    )
    return out.encode("utf-8")


# ─────────────────────────────────────────────────────────────────────
# One-shot mode (legacy clean filter)
# ─────────────────────────────────────────────────────────────────────


def run_oneshot() -> None:
    raw = sys.stdin.buffer.read()
    sys.stdout.buffer.write(clean_bytes(raw))


# ─────────────────────────────────────────────────────────────────────
# Long-running filter process (git pkt-line protocol)
# ─────────────────────────────────────────────────────────────────────
#
# Wire format:
#   - pkt-line: 4-byte ASCII hex length prefix, then payload bytes.
#     Length INCLUDES the 4 header bytes. "0000" = flush-pkt (delimiter).
#   - Each message is a sequence of pkt-lines terminated by a flush-pkt.
#   - Flow:
#       1. Server (git) sends welcome: "git-filter-client", supported version.
#       2. Filter replies: "git-filter-server", "version=2".
#       3. Server sends "capability=clean", "capability=smudge", ...,
#          flush-pkt.
#       4. Filter replies with the subset it supports + flush-pkt.
#       5. Per file: server sends key=value headers (command=clean,
#          pathname=…) + flush, then content pkt-lines + flush.
#       6. Filter replies status=success/error + content + flush + flush.

_FLUSH = b"0000"


def _read_pkt_line(stdin) -> Optional[bytes]:
    """Return payload bytes, or None on flush-pkt."""
    header = stdin.read(4)
    if len(header) < 4:
        return None
    length = int(header, 16)
    if length == 0:
        return None
    return stdin.read(length - 4)


def _write_pkt_line(stdout, payload: bytes) -> None:
    stdout.write(f"{len(payload) + 4:04x}".encode("ascii"))
    stdout.write(payload)


def _write_flush(stdout) -> None:
    stdout.write(_FLUSH)


def _read_until_flush(stdin) -> List[bytes]:
    items = []
    while True:
        line = _read_pkt_line(stdin)
        if line is None:
            return items
        items.append(line)


def run_process() -> None:
    stdin = sys.stdin.buffer
    stdout = sys.stdout.buffer

    # Handshake
    welcome = _read_until_flush(stdin)
    if b"git-filter-client\n" not in welcome:
        raise SystemExit("expected git-filter-client welcome")
    _write_pkt_line(stdout, b"git-filter-server\n")
    _write_pkt_line(stdout, b"version=2\n")
    _write_flush(stdout)
    stdout.flush()

    # Capability negotiation
    _read_until_flush(stdin)  # capability list from git
    _write_pkt_line(stdout, b"capability=clean\n")
    _write_flush(stdout)
    stdout.flush()

    # Main loop
    while True:
        headers = _read_until_flush(stdin)
        if not headers:
            return  # git closed the pipe
        meta = {}
        for h in headers:
            text = h.decode("utf-8").rstrip("\n")
            if "=" in text:
                k, _, v = text.partition("=")
                meta[k] = v
        if meta.get("command") != "clean":
            _write_pkt_line(stdout, b"status=error\n")
            _write_flush(stdout)
            stdout.flush()
            continue

        body = b"".join(_read_until_flush(stdin))
        cleaned = clean_bytes(body)

        _write_pkt_line(stdout, b"status=success\n")
        _write_flush(stdout)
        view = memoryview(cleaned)
        max_chunk = 65516
        for i in range(0, len(view), max_chunk):
            _write_pkt_line(stdout, bytes(view[i : i + max_chunk]))
        _write_flush(stdout)
        _write_flush(stdout)
        stdout.flush()


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] == "--process":
        run_process()
    else:
        run_oneshot()


if __name__ == "__main__":
    main()
