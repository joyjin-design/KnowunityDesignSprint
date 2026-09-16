#!/usr/bin/env bash
# Fails if a raw hex color appears in app/ or stories/ — colors must come from tokens/tokens.json.
set -euo pipefail

matches=$(grep -rnE '#[0-9a-fA-F]{3,8}\b' app stories --include='*.tsx' --include='*.ts' --include='*.css' || true)

if [ -n "$matches" ]; then
  echo "Raw hex colors found — use a token from tokens/tokens.json instead:"
  echo "$matches"
  exit 1
fi

echo "No raw hex colors found."
