#!/usr/bin/env python3
"""Download verified-origin free fonts, inspect signatures, and install without overwriting unchanged files."""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import pathlib
import re
import shutil
import urllib.parse
import urllib.request
import zipfile

FONT_DIR = pathlib.Path.home() / 'Library' / 'Fonts'
FONT_DIR.mkdir(parents=True, exist_ok=True)
MAX_REMOTE = 350 * 1024 * 1024
MAX_ONE_FONT = 120 * 1024 * 1024
MAX_COUNT = 50
FONT_EXT = ('.ttf', '.otf', '.ttc')
MAGIC = (b'\x00\x01\x00\x00', b'OTTO', b'ttcf', b'true')
HEADERS = {'User-Agent': 'mac-fonts-curation/1.0', 'Accept': 'application/vnd.github+json'}

def remote(url: str, limit: int = MAX_REMOTE) -> bytes:
    if not url.startswith('https://'):
        raise ValueError('僅允許 HTTPS')
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read(limit + 1)
        if len(data) > limit:
            raise ValueError('超出下載上限')
        return data

def from_zip(blob: bytes, subpath: str | None = None) -> list[tuple[str, bytes]]:
    result = []
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        for item in z.infolist():
            name = item.filename
            if item.is_dir() or not name.lower().endswith(FONT_EXT):
                continue
            if subpath and subpath.lower() not in name.lower().replace('\\', '/'):
                continue
            if item.file_size > MAX_ONE_FONT:
                continue
            if len(result) >= MAX_COUNT:
                break
            result.append((pathlib.PurePosixPath(name).name, z.read(item)))
    return result

def valid_font(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] in MAGIC and len(data) <= MAX_ONE_FONT

def install_family(family: str, candidates: list[tuple[str, bytes]], backup_dir: pathlib.Path) -> tuple[int, int]:
    installed, unchanged = 0, 0
    for name, data in candidates:
        if not valid_font(data):
            continue
        safe = re.sub(r'[^A-Za-z0-9._-]+', '_', name)
        dest = FONT_DIR / f'Curated_{family}_{safe}'
        if dest.exists():
            if hashlib.sha256(dest.read_bytes()).digest() == hashlib.sha256(data).digest():
                unchanged += 1
                continue
            backup_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, backup_dir / (dest.name + '.bak'))
        tmp = dest.with_suffix(dest.suffix + '.tmp')
        tmp.write_bytes(data)
        tmp.replace(dest)
        installed += 1
    return installed, unchanged

def github_repo_directory(owner: str, repo: str, branch: str, directory: str) -> list[tuple[str, bytes]]:
    encoded = urllib.parse.quote(directory, safe='/')
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{encoded}?ref={branch}'
    entries = json.loads(remote(url, limit=2_000_000))
    files = []
    for ent in entries:
        if ent.get('type') != 'file' or not ent['name'].lower().endswith(FONT_EXT):
            continue
        if len(files) >= MAX_COUNT:
            break
        raw = ent.get('download_url', '')
        if not raw.startswith(f'https://raw.githubusercontent.com/{owner}/{repo}/'):
            continue
        files.append((ent['name'], remote(raw, limit=MAX_ONE_FONT)))
    return files

def github_latest_assets(owner: str, repo: str) -> list[tuple[str, bytes]]:
    release = json.loads(remote(f'https://api.github.com/repos/{owner}/{repo}/releases/latest', limit=2_000_000))
    candidates = []
    for asset in release.get('assets', []):
        name = asset.get('name', '')
        low = name.lower()
        if low.endswith(FONT_EXT) or low.endswith('.zip'):
            candidates.append(asset)
    files = []
    for asset in candidates[:10]:
        filename = asset['name']
        url = asset['browser_download_url']
        if not url.startswith(f'https://github.com/{owner}/{repo}/releases/download/'):
            continue
        contents = remote(url)
        if filename.lower().endswith('.zip'):
            files.extend(from_zip(contents))
        else:
            files.append((filename, contents))
    return files

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--report', required=True)
    ap.add_argument('--report-dir', required=True)
    args = ap.parse_args()
    report = pathlib.Path(args.report)
    backup_dir = pathlib.Path(args.report_dir) / '被替換字體備份'
    tasks = [
        ('02', '獅尾繁中黑體', 'SweiFanSans',
         lambda: github_repo_directory('max32002', 'swei-fan-sans', 'master', 'CJK TC'),
         'GitHub 作者原始碼 CJK TC'),
        ('04', '悠哉字體', 'Yozai',
         lambda: github_latest_assets('lxgw', 'yozai-font'),
         'GitHub 作者最新 Release'),
        ('05', '隨峰體', 'PeakFont',
         lambda: from_zip(remote('https://cjkfonts.io/downloadfont?font_id=cjkfonts_003&v=0.02')),
         'cjkFonts 官網'),
    ]
    failed = 0
    with report.open('a', encoding='utf-8') as f:
        for number, label, family, fetch, source in tasks:
            try:
                items = fetch()
                installed, unchanged = install_family(family, items, backup_dir)
                if installed + unchanged == 0:
                    raise RuntimeError('未找到任何格式正確的 TTF／OTF／TTC 字體')
                status = '成功' if installed else '已存在'
                note = f'新增／更新 {installed} 檔，未變更 {unchanged} 檔；已驗證字體檔案格式標頭'
                print(label, status, note, flush=True)
            except Exception as e:
                status = '失敗'
                note = f'{type(e).__name__}: {str(e)[:200]}'
                failed += 1
                print(label, status, note, flush=True)
            f.write('\t'.join((number, label, source, status, note)) + '\n')
    return int(failed > 0)

if __name__ == '__main__':
    raise SystemExit(main())
