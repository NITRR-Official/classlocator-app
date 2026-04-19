# Android 16 KB Page Size Alignment Report

**Project:** NITRR_Classlocator
**Generated:** 2026-04-19
**App version:** `1.2.2` (versionCode `15`)
**React Native:** `0.77.0`
**Android NDK:** `27.1.12297006`
**compileSdk / targetSdk:** `35`
**Inspected artifact:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## TL;DR

Google Play flagged the following two libraries as incompatible with 16 KB page size devices:

```
base/lib/arm64-v8a/libgesturehandler.so
base/lib/arm64-v8a/librnscreens.so
base/lib/x86_64/libgesturehandler.so
base/lib/x86_64/librnscreens.so
```

After empirically inspecting **every** `.so` file inside the actual AAB:

- **Only those 2 libraries fail** on the 64-bit ABIs (the only ABIs Google Play checks for 16 KB compliance).
- **All other native libraries** in the project are already 16 KB aligned (`0x4000`).
- **All other npm dependencies** in the project either ship no native code at all (Java/Kotlin only) or are built locally from source by NDK r27 with the correct linker flags.

**Action required:** bump only two packages.

| Package | Current | Required min | Recommended |
|---|---|---|---|
| `react-native-gesture-handler` | `2.22.1` | `2.24.0` | `2.24.0` |
| `react-native-screens` | `4.5.0` | `4.8.0` (had a 32-bit alignment bug) | `4.11.1` |

---

## Why these two

Both `react-native-gesture-handler@2.22.1` and `react-native-screens@4.5.0` ship **prebuilt** `.so` artifacts inside the npm package (under `node_modules/<lib>/android/build/intermediates/.../jni/<abi>/`). Because the binaries are already built before they reach your Gradle build, the local NDK has no opportunity to re-align them.

Their later versions either:

1. Bumped the prebuild pipeline to use NDK r27+ with the linker flag `-Wl,-z,max-page-size=16384`, **or**
2. Removed the prebuilt binaries entirely so consumers compile from source.

| Library | Version that introduced 16 KB alignment | Source |
|---|---|---|
| `react-native-gesture-handler` | `2.24.0` (Feb 20, 2025, PR #3412) | [Release notes](https://github.com/software-mansion/react-native-gesture-handler/releases/tag/2.24.0) |
| `react-native-screens` | `4.8.0` (Feb 19, 2025); 32-bit alignment fully fixed in `4.11.2` | [Release notes](https://github.com/software-mansion/react-native-screens/releases/tag/4.8.0) |

---

## Empirical verification

The following table is generated from the actual `app-release.aab` using `llvm-readelf` from NDK r27 (`-l` to print program headers; the alignment of the first `LOAD` segment is the page-size requirement).

### `arm64-v8a`

| Library | Alignment | Status |
|---|---|---|
| `libappmodules.so` | `0x4000` | ✅ OK (16 KB) |
| `libc++_shared.so` | `0x4000` | ✅ OK (16 KB) |
| `libfbjni.so` | `0x4000` | ✅ OK (16 KB) |
| `libgesturehandler.so` | `0x1000` | ❌ **FAIL (4 KB)** |
| `libhermes.so` | `0x4000` | ✅ OK (16 KB) |
| `libhermestooling.so` | `0x4000` | ✅ OK (16 KB) |
| `libimagepipeline.so` | `0x4000` | ✅ OK (16 KB) |
| `libjsi.so` | `0x4000` | ✅ OK (16 KB) |
| `libnative-filters.so` | `0x4000` | ✅ OK (16 KB) |
| `libnative-imagetranscoder.so` | `0x4000` | ✅ OK (16 KB) |
| `libreact_codegen_rnscreens.so` | `0x4000` | ✅ OK (16 KB) |
| `libreact_codegen_rnsvg.so` | `0x4000` | ✅ OK (16 KB) |
| `libreact_codegen_safeareacontext.so` | `0x4000` | ✅ OK (16 KB) |
| `libreactnative.so` | `0x4000` | ✅ OK (16 KB) |
| `libreanimated.so` | `0x4000` | ✅ OK (16 KB) |
| `librnscreens.so` | `0x1000` | ❌ **FAIL (4 KB)** |
| `libworklets.so` | `0x4000` | ✅ OK (16 KB) |

### `x86_64`

Same result as `arm64-v8a` — only `libgesturehandler.so` and `librnscreens.so` are misaligned.

### `armeabi-v7a` and `x86` (32-bit)

Every `.so` is `0x1000` (4 KB) aligned. **This does not need to be fixed** — 16 KB page size is a 64-bit-only Android feature, and Google Play's compliance check explicitly ignores 32-bit ABIs ([source](https://developer.android.com/guide/practices/page-sizes)).

---

## Per-dependency assessment

| Package | Current | Ships native code? | Present in AAB? | Status |
|---|---|---|---|---|
| `react-native-gesture-handler` | `2.22.1` | yes (prebuilt `.so`) | yes | ❌ FAIL — bump to `2.24.0`+ |
| `react-native-screens` | `4.5.0` | yes (prebuilt `.so`) | yes | ❌ FAIL — bump to `4.11.1`+ |
| `react-native-reanimated` | `3.18.2` | yes (built locally) | yes (`libreanimated.so`, `libworklets.so`) | ✅ 16 KB OK |
| `react-native-svg` | `15.11.1` | yes (codegen, built locally) | yes (`libreact_codegen_rnsvg.so`) | ✅ 16 KB OK |
| `react-native-safe-area-context` | `^5.1.0` | yes (codegen, built locally) | yes (`libreact_codegen_safeareacontext.so`) | ✅ 16 KB OK |
| `react-native-fs` | `^2.20.0` | no (Java only) | no | ✅ N/A |
| `react-native-linear-gradient` | `^2.8.3` | no (Java only) | no | ✅ N/A |
| `react-native-pager-view` | `^6.7.0` | no (Kotlin only) | no | ✅ N/A |
| `react-native-permissions` | `^4.1.5` | no (Java only) | no | ✅ N/A |
| `react-native-share` | `^10.2.1` | no (Java only) | no | ✅ N/A |
| `react-native-vector-icons` | `^10.2.0` | no (Java only) | no | ✅ N/A |
| `react-native-webview` | `^13.13.1` | no (Java only) | no | ✅ N/A |
| `react-native-pull-to-refresh` | `^2.1.3` | no | no | ✅ N/A |
| `mixpanel-react-native` | `^3.0.5` | no | no | ✅ N/A |
| `react-native-heroicons` | latest | no (JS only) | no | ✅ N/A |
| `react-native-tab-view` | latest | no (JS only) | no | ✅ N/A |
| `react-native-responsive-screen` | latest | no (JS only) | no | ✅ N/A |

---

## Recommended fix

### 1. Update `package.json` ✅ Done

```diff
-    "react-native-gesture-handler": "2.22.1",
+    "react-native-gesture-handler": "2.24.0",
...
-    "react-native-screens": "4.5.0",
+    "react-native-screens": "4.11.1",
```

### 2. Reinstall and clean ✅ `npm install` done

```bash
rm -rf android/app/build android/build android/.gradle
cd android && ./gradlew clean && cd ..
```

### 3. Rebuild the release AAB

```bash
cd android && ./gradlew bundleRelease && cd ..
```

### 4. Re-verify alignment

A reusable verification script has been added at `scripts/check-16kb.sh`. After every release build, run:

```bash
./scripts/check-16kb.sh
```

It auto-detects your installed NDK and prints either:

- `OK: all <N> 64-bit native libraries are 16 KB aligned.` (exit `0`), or
- A list of misaligned `.so` files (exit `1`).

You can also point it at a specific AAB:

```bash
./scripts/check-16kb.sh path/to/some.aab
```

### Why this works without a prebuilt fix

After upgrading, `react-native-gesture-handler@2.24.0` and `react-native-screens@4.11.1` no longer ship **any** prebuilt `.so` files. They include `CMakeLists.txt` and are compiled from source by your local NDK (`27.1.12297006`) during `./gradlew bundleRelease`. NDK r27+ defaults to `-Wl,-z,max-page-size=16384`, so the resulting binaries are 16 KB aligned automatically.

Verified post-install:

```
$ find node_modules/react-native-gesture-handler node_modules/react-native-screens -name "*.so"
(no output)
```

---

## Background: why 16 KB matters

- Starting with **Android 15 (API 35)**, devices may ship with **16 KB memory pages** instead of the historical 4 KB. This improves performance and battery life on devices using the new page size.
- Google Play **requires** that all new app submissions targeting API 35+ contain 64-bit `.so` files whose ELF `LOAD` segments are aligned to a multiple of `16384` (`0x4000`) or higher.
- An `.so` file's alignment is set by the **linker** at build time (`-Wl,-z,max-page-size=16384`). NDK **r27+** sets this by default.
- 32-bit ABIs (`armeabi-v7a`, `x86`) are exempt — 16 KB pages are a 64-bit-only feature on Android.

References:
- [Support 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Google Play 16 KB requirement](https://android-developers.googleblog.com/2024/08/adding-16-kb-page-size-to-android.html)

---

## Notes about your project

1. Your toolchain (`React Native 0.77.0` + `NDK 27.1.12297006` + `compileSdk 35`) is already correctly configured for 16 KB. The only blocker is the two prebuilt third-party `.so` files described above.
2. `react-native-reanimated@3.18.2` is fine — Reanimated added 16 KB support in `3.16.x`, and your version's `libreanimated.so` / `libworklets.so` are already aligned to `0x4000` in the AAB.
3. Several files in `git status` look like build artifacts that should not be committed:
   - `android/app/src/main/assets/index.android.bundle`
   - `android/app/src/main/res/drawable-*/assets_images_*.png`
   - `android/app/src/main/res/drawable-*/node_modules_reactnavigation_elements_*.png`

   Consider adding them to `.gitignore` to keep the repo clean.
