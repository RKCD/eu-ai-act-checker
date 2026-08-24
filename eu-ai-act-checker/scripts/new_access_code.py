#!/usr/bin/env python
"""Mint a new per-recipient access code.

Codes live in the ACCESS_CODES environment variable on Render, as a JSON
object of {code: recipient label}. There is no server-side store for them —
this script keeps a local working copy (access_codes.local.json, gitignored;
it holds live credentials) so each new code doesn't require reconstructing
the whole set by hand, and prints the updated JSON ready to paste into
Render's dashboard.

Usage:
    python scripts/new_access_code.py "Kadi - Cleantech Estonia"
    python scripts/new_access_code.py "Peeter" --code my-chosen-code

After running, paste the printed JSON into Render: Environment ->
ACCESS_CODES -> Save, then send the recipient their code (not the label,
not the JSON — just the short code).

To revoke a code: delete its entry from access_codes.local.json by hand,
then re-run this script with any label (or `--reprint`) to get the updated
JSON to paste into Render.
"""

from __future__ import annotations

import argparse
import json
import secrets
import string
import sys
from pathlib import Path

STORE_PATH = Path(__file__).resolve().parent.parent / "access_codes.local.json"

# Avoid visually ambiguous characters (0/O, 1/l/I) — these codes get typed
# by hand into a password-style input, often from a phone.
CODE_ALPHABET = "".join(c for c in string.ascii_lowercase + string.digits if c not in "01lo")


def load_store() -> dict[str, str]:
    if not STORE_PATH.exists():
        return {}
    return json.loads(STORE_PATH.read_text(encoding="utf-8"))


def save_store(codes: dict[str, str]) -> None:
    STORE_PATH.write_text(json.dumps(codes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def generate_code(existing: dict[str, str], length: int = 8) -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))
        if code not in existing:
            return code


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("label", nargs="?", help="Who this code identifies, e.g. 'Kadi - Cleantech Estonia'")
    parser.add_argument("--code", help="Use this exact code instead of generating a random one.")
    parser.add_argument("--reprint", action="store_true", help="Don't add anyone; just print the current set as JSON.")
    args = parser.parse_args()

    codes = load_store()

    if args.reprint:
        pass
    elif not args.label:
        parser.error("a label is required unless --reprint is given")
    else:
        code = args.code or generate_code(codes)
        if code in codes:
            print(f"Code {code!r} already exists for {codes[code]!r} — pick a different --code.", file=sys.stderr)
            return 1
        codes[code] = args.label
        save_store(codes)
        print(f"New code: {code}")
        print(f"For:      {args.label}")
        print()

    print(f"{len(codes)} code(s) on file. Paste this into Render -> Environment -> ACCESS_CODES:")
    print()
    print(json.dumps(codes, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
