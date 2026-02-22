#!/usr/bin/env bash
set -euo pipefail

REQUIRED_NODE_MAJOR=20
MISSING=0

check_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[missing] $cmd"
    MISSING=1
  else
    echo "[ok] $cmd: $(command -v "$cmd")"
  fi
}

echo "Checking required tools..."
check_command node
check_command pnpm
check_command git

if [ "$MISSING" -ne 0 ]; then
  echo
  echo "Install missing tools and run again."
  exit 1
fi

NODE_VERSION_RAW="$(node -v)"
NODE_MAJOR="$(echo "$NODE_VERSION_RAW" | sed -E 's/^v([0-9]+).*/\1/')"

echo
echo "Detected versions:"
echo "- node: $NODE_VERSION_RAW"
if PNPM_VERSION_RAW="$(pnpm -v 2>/dev/null)"; then
  echo "- pnpm: $PNPM_VERSION_RAW"
else
  echo "- pnpm: found in PATH (version check skipped: permission or corepack setup issue)"
fi
echo "- git: $(git --version)"

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo
  echo "Node.js $REQUIRED_NODE_MAJOR+ is required. Current: $NODE_VERSION_RAW"
  exit 1
fi

echo
echo "Environment check passed."
