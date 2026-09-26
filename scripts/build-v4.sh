#!/usr/bin/env bash
set -euo pipefail

rm -rf .v4/work dist
mkdir -p .v4/work

cat .v4/chunk-*.b64 > .v4/work/source.b64
base64 -d .v4/work/source.b64 > .v4/work/source.tar.gz
tar -xzf .v4/work/source.tar.gz -C .v4/work

cd .v4/work/creators-studio-web
python - <<'PY'
from pathlib import Path
p = Path("src/app/publish/page.tsx")
s = p.read_text()
s = s.replace(
    "const dripDelayMs = snapshot.publishingDefaults.dripDelayMinutes * 60 * 1000;",
    "const dripDelayMs = (snapshot?.publishingDefaults.dripDelayMinutes ?? 0) * 60 * 1000;"
)
p.write_text(s)
PY
npm install --no-audit --no-fund
npm run build

cd ../../..
cp -R .v4/work/creators-studio-web/dist ./dist
