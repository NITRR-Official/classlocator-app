#!/usr/bin/env bash
#
# Verify that every 64-bit native library inside the release AAB is aligned
# to a 16 KB page boundary, as required by Google Play for devices using
# 16 KB memory pages (Android 15+).
#
# Usage:
#   scripts/check-16kb.sh [path/to/app.aab]
#
# Exits 0 if everything is aligned, 1 otherwise.
#
set -euo pipefail

AAB="${1:-android/app/build/outputs/bundle/release/app-release.aab}"

if [ ! -f "$AAB" ]; then
  echo "AAB not found: $AAB"
  echo "Run 'cd android && ./gradlew bundleRelease' first."
  exit 2
fi

if [ -z "${ANDROID_HOME:-}" ]; then
  if [ -d "$HOME/Library/Android/sdk" ]; then
    ANDROID_HOME="$HOME/Library/Android/sdk"
  else
    echo "ANDROID_HOME is not set."
    exit 2
  fi
fi

# Pick the newest installed NDK that has llvm-readelf.
NDK_DIR=$(ls -1 "$ANDROID_HOME/ndk" 2>/dev/null | sort -V | tail -1 || true)
if [ -z "$NDK_DIR" ]; then
  echo "No NDK installed under $ANDROID_HOME/ndk"
  exit 2
fi

case "$(uname -s)" in
  Darwin) HOST_TAG="darwin-x86_64" ;;
  Linux)  HOST_TAG="linux-x86_64" ;;
  *)      echo "Unsupported host: $(uname -s)"; exit 2 ;;
esac

READELF="$ANDROID_HOME/ndk/$NDK_DIR/toolchains/llvm/prebuilt/$HOST_TAG/bin/llvm-readelf"
if [ ! -x "$READELF" ]; then
  echo "llvm-readelf not found at $READELF"
  exit 2
fi

TMP=$(mktemp -d)
trap "rm -rf '$TMP'" EXIT

unzip -q "$AAB" "base/lib/arm64-v8a/*" "base/lib/x86_64/*" -d "$TMP"

fail=0
total=0
for f in "$TMP"/base/lib/*/*.so; do
  total=$((total + 1))
  align=$("$READELF" -l "$f" 2>/dev/null | awk '/LOAD/ {print $NF; exit}')
  case "$align" in
    0x4000|0x10000)
      ;;
    0x1000)
      echo "FAIL_4KB  ${f#"$TMP"/}"
      fail=$((fail + 1))
      ;;
    *)
      echo "UNKNOWN_$align  ${f#"$TMP"/}"
      fail=$((fail + 1))
      ;;
  esac
done

if [ "$fail" -eq 0 ]; then
  echo "OK: all $total 64-bit native libraries are 16 KB aligned."
  exit 0
else
  echo
  echo "$fail of $total libraries are NOT 16 KB aligned."
  exit 1
fi
