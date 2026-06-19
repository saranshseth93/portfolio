#!/usr/bin/env bash
# Dev helper: build, serve dist, screenshot all three themes (localStorage seeded so
# the theme sticks past the switcher init). Outputs /tmp/shot-<theme>.png.
# Usage: bash scripts/shot.sh [width] [height]
set -e
cd "$(dirname "$0")/.."
W="${1:-1280}"; H="${2:-860}"
pkill -f "Google Chrome" 2>/dev/null || true
pkill -f "http.server" 2>/dev/null || true
sleep 1
npm run build >/tmp/shotbuild.log 2>&1 || { echo "BUILD FAILED"; tail -20 /tmp/shotbuild.log; exit 1; }
cp dist/index.html /tmp/shot-orig.html
( cd dist && python3 -m http.server 8794 >/tmp/shot-py.log 2>&1 & echo $! > /tmp/shot-srv.pid )
sleep 2
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for t in midnight pixel blueprint; do
  python3 -c "
html=open('/tmp/shot-orig.html').read()
html=html.replace('data-theme=\"midnight\"','data-theme=\"$t\"',1)
html=html.replace('try {','try { localStorage.setItem(\"theme\",\"$t\");',1)
open('dist/index.html','w').write(html)
"
  UDD=$(mktemp -d)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=$W,$H \
    --user-data-dir="$UDD" --virtual-time-budget=8000 \
    --screenshot=/tmp/shot-$t.png "http://localhost:8794/" >/dev/null 2>&1 || true
  rm -rf "$UDD"
  echo "shot $t: $(ls -la /tmp/shot-$t.png 2>/dev/null | awk '{print $5}') bytes"
done
kill "$(cat /tmp/shot-srv.pid)" 2>/dev/null || true
cp /tmp/shot-orig.html dist/index.html
