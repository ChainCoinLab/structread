#!/usr/bin/env python3
"""Build a Chrome Web Store release package for the extension."""

from __future__ import annotations

import argparse
import json
import pathlib
import shutil


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--api-origin",
        required=True,
        help="HTTPS origin for the production API, for example https://api.example.com",
    )
    parser.add_argument(
        "--source",
        default="extension",
        help="Extension source directory",
    )
    parser.add_argument(
        "--output-dir",
        default="dist/extension-release",
        help="Output directory for the generated extension package",
    )
    parser.add_argument(
        "--zip-path",
        default="dist/english-sentence-analyzer",
        help="Zip output path without the .zip suffix",
    )
    return parser.parse_args()


def ensure_https_origin(raw_origin: str) -> str:
    origin = raw_origin.rstrip("/")
    if not origin.startswith("https://"):
      raise SystemExit("Release builds require an HTTPS API origin.")
    return origin


def copy_tree(src: pathlib.Path, dst: pathlib.Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def update_manifest(manifest_path: pathlib.Path, api_origin: str) -> None:
    manifest = json.loads(manifest_path.read_text())
    manifest["host_permissions"] = [f"{api_origin}/*"]
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")


def write_runtime_config(config_path: pathlib.Path, api_origin: str) -> None:
    config_path.write_text(
        "(function () {\n"
        '  "use strict";\n\n'
        "  globalThis.ESA_CONFIG = Object.freeze({\n"
        f'    defaultApiEndpoint: "{api_origin}",\n'
        "  });\n"
        "})();\n"
    )


def build_zip(source_dir: pathlib.Path, zip_base: pathlib.Path) -> None:
    zip_base.parent.mkdir(parents=True, exist_ok=True)
    archive_path = shutil.make_archive(str(zip_base), "zip", root_dir=source_dir)
    print(f"Created {archive_path}")


def main() -> None:
    args = parse_args()
    repo_root = pathlib.Path(__file__).resolve().parent.parent
    source_dir = (repo_root / args.source).resolve()
    output_dir = (repo_root / args.output_dir).resolve()
    zip_base = (repo_root / args.zip_path).resolve()
    api_origin = ensure_https_origin(args.api_origin)

    copy_tree(source_dir, output_dir)
    update_manifest(output_dir / "manifest.json", api_origin)
    write_runtime_config(output_dir / "shared" / "runtime-config.js", api_origin)
    build_zip(output_dir, zip_base)


if __name__ == "__main__":
    main()
