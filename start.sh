#!/bin/sh
# Builds zen from ../zen and runs it against an empty data folder, so a run never touches a real database.
set -e

E2E_DIR=$(cd "$(dirname "$0")" && pwd)
ZEN_DIR=$(cd "${ZEN_DIR:-$E2E_DIR/../zen}" && pwd)
RUN_DIR="${ZEN_RUN_DIR:-$E2E_DIR/.zen}"

cd "$ZEN_DIR"
esbuild index.js --bundle --minify --format=esm --outfile=assets/bundle.js --loader:.js=jsx --jsx-factory=h --jsx-fragment=Fragment --log-level=warning
go build --tags "fts5" -o "$RUN_DIR/zen" .

# zen resolves the database and images folder against its working directory.
rm -rf "$RUN_DIR/data"
mkdir -p "$RUN_DIR/data"
cd "$RUN_DIR/data"

export PORT="${ZEN_E2E_PORT:-8091}"
unset DATA_FOLDER IMAGES_FOLDER DEV_MODE
exec "$RUN_DIR/zen" >"$RUN_DIR/zen.log" 2>&1
