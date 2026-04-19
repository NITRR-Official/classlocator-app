---
name: URL-driven maps.html state
overview: Replace the implicit `sessionStorage` + `postMessage` contract between React Native and the WebView engine with an explicit URL-query contract. `maps.html` will hydrate `sessionStorage` from `?map_no=…&start=…&end=…` on load, and every entry point (RN navigation, in-page Floor buttons, search button, deep links) will pass state through the URL.
todos:
  - id: engine-hydrate
    content: Add hydrateFromUrl() in Engine.js and call it as the first step inside window load handler
    status: completed
  - id: main-floor-buttons
    content: Rewrite grounds1/firstt1/secondd1/backyard1 onclicks in main.js to preventDefault and navigate to ./maps.html?map_no=N
    status: completed
  - id: suggestion-search
    content: Fix search.onclick in Suggestion-index.js to preventDefault on validation failures and on success build maps.html URL with map_no/start/end
    status: completed
  - id: index-html-search-anchor
    content: Change the search <a id="search"> in index.html from href="/maps.html" to href="#" (or button) as a safety net
    status: completed
  - id: auth-startserver-query
    content: Extend startServer in src/utils/auth.js to accept an optional query object and append it as URLSearchParams
    status: completed
  - id: home-old-cards
    content: "Update Ground/First/Second card handlers in Home_Old.js to pass {map_no: N} to startServer('maps')"
    status: completed
  - id: bottomtabs-deeplink
    content: Update BottomTabs.js shared-location handler to spread props.route.params into startServer's query
    status: completed
  - id: heartitout-cleanup
    content: Remove (or keep as fallback) the postMessage useEffect in Heartitout.js since URL now carries the state
    status: completed
  - id: manual-verify
    content: "Manually verify each entry path: Home cards, Search->index->Floor buttons, Search->source/dest, deep links, popup-without-selection"
    status: completed
isProject: false
---

## Goal

Make the floor that `maps.html` renders deterministic on first paint, regardless of WebView quirks, port changes, or the click-vs-navigation race. The URL becomes the single source of truth on entry; `Engine.js` keeps using `sessionStorage` internally, but it is *seeded* from the URL.

## Data flow (after change)

```mermaid
flowchart LR
  Home[Home_Old card / Search button / Deep link]
  Auth[auth.js startServer "builds URL with query"]
  RN[Heartitout WebView "loads URL"]
  Maps["maps.html on load"]
  Hydrate[hydrateFromUrl "writes URLSearchParams into sessionStorage"]
  Engine[Engine.js "reads sessionStorage as today"]

  Home --> Auth --> RN --> Maps --> Hydrate --> Engine
  IndexBtns[index.html Floor / Search buttons] -->|"./maps.html?map_no=N&..."| Maps
```

## Contract

- URL: `maps.html?map_no=<0|1|2|3>&start=<id>&end=<id>&serviceUse=X&mode=<S|L>&Stair=<...>`
- `map_no` is the only key that wins over existing `sessionStorage`. Everything else is optional and only written if present and not the literal string `"undefined"` / `"null"` / empty.
- After hydration, `Engine.js` behaves exactly as today (no changes to `pointsSE`, `swap`, `detectFloor`, etc.).
- `postMessage` listener can stay as a fallback but is no longer the primary channel.

## Files to change

### 1. [android/app/src/main/assets/engine/assets/js/Engine.js](android/app/src/main/assets/engine/assets/js/Engine.js)

- Add `hydrateFromUrl()` near the top of the module:
  ```js
  const hydrateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const allowed = ['map_no', 'start', 'end', 'serviceUse', 'mode', 'Stair'];
    for (const key of allowed) {
      const value = params.get(key);
      if (value != null && value !== '' && value !== 'undefined' && value !== 'null') {
        sessionStorage.setItem(key, value);
      }
    }
  };
  ```
- Call it as the first line inside the existing `window.addEventListener("load", async () => { ... })` (around lines 171-196), before `prerequisiteTask()` and before `map_no = sessionStorage.getItem("map_no")`.
- Leave the `document.addEventListener('message', …)` listener (lines 198-209) intact for now as a fallback (older bundles will still work).

### 2. [android/app/src/main/assets/engine/assets/js/main.js](android/app/src/main/assets/engine/assets/js/main.js)

Replace the four Floor `onclick` handlers (lines 49-68) with explicit URL navigation that calls `e.preventDefault()` so the `<a href="./maps.html">` cannot race the storage write:

```js
const goToMap = (mapNo) => {
  const params = new URLSearchParams({ map_no: String(mapNo), serviceUse: 'X' });
  window.location.assign(`./maps.html?${params.toString()}`);
};

grounds1.onclick  = (e) => { e.preventDefault(); goToMap(0); };
firstt1.onclick   = (e) => { e.preventDefault(); goToMap(1); };
secondd1.onclick  = (e) => { e.preventDefault(); goToMap(2); };
backyard1.onclick = (e) => { e.preventDefault(); goToMap(3); };
```

The `try { grounds2.onclick = … }` block (lines 69-90) targets elements that don't exist on `index.html`, so it can be left untouched (it already swallows the null reference) or deleted for cleanliness.

### 3. [android/app/src/main/assets/engine/assets/js/Suggestion-index.js](android/app/src/main/assets/engine/assets/js/Suggestion-index.js)

Two fixes in `search.onclick` (lines 123-151) and `letsGoo()` (lines 106-115):

- Take the click event and call `e.preventDefault()` in the validation-failure branches so the popup is no longer immediately blown away by an `<a>` navigation.
- On success, derive `map_no` from `start` exactly as `letsGoo()` does today, then navigate via URL:
  ```js
  search.onclick = (e) => {
    const startId = name.get(current.value);
    const endId   = name.get(final.value);

    if (startId == null) {
      e.preventDefault();
      createPopup("#popup", "Please first select the nearest room.", false)();
      return;
    }
    if (endId == null) {
      e.preventDefault();
      createPopup("#popup", "Quick actions for you, or click continue anyway to proceed without selecting any destination.", true)();
      return;
    }

    e.preventDefault();
    const n = Number.parseInt(startId);
    const map_no = n >= 205 ? "1" : (n >= 115 ? "2" : "0");
    const params = new URLSearchParams({
      map_no, start: String(startId), end: String(endId), serviceUse: 'X',
    });
    window.location.assign(`./maps.html?${params.toString()}`);
  };
  ```
- `letsGoo()` is no longer needed for navigation, but keep the export and have it call the same URL builder so anything else that imports it keeps working.

Also change the search anchor in [android/app/src/main/assets/engine/index.html](android/app/src/main/assets/engine/index.html) (line 87) from `href="/maps.html"` to `href="#"` (or convert to `<button>`), so even if `e.preventDefault()` is ever skipped, the absolute path no longer escapes the local-server root.

### 4. [src/utils/auth.js](src/utils/auth.js)

Make `startServer` accept an optional query object and append it to the returned URL:

```js
const startServer = async (link, query = {}) => {
  await stopServer();
  const path = `${RNFS.CachesDirectoryPath}/engine`;
  const address = await startLocalServer({ rootPath: path, port: 0, localOnly: true });
  const base = address.replace(/\/$/, '');
  const file = link === 'main' ? 'index.html' : 'maps.html';
  const entries = Object.entries(query).filter(([, v]) => v != null && v !== '');
  const qs = new URLSearchParams(Object.fromEntries(entries)).toString();
  return qs ? `${base}/${file}?${qs}` : `${base}/${file}`;
};
```

Backwards compatible: callers that pass no `query` (e.g. the Search-style entry into `index.html`) get the same URL as before.

### 5. [src/screens/Home/Home_Old.js](src/screens/Home/Home_Old.js)

Update the three Floor cards (lines 178-216) to pass `map_no` into `startServer`:

```js
startServer('maps', { map_no: 0 }).then(res => {
  trackM('Ground-F');
  navigation.navigate('maps', { link: res, map_no: 0 });
});
```

Same shape for `map_no: 1` and `map_no: 2`. The top "Search" button (lines 35-41) stays as `startServer('main')` with `map_no: -1`.

### 6. [src/navigation/Home/BottomTabs.js](src/navigation/Home/BottomTabs.js)

Forward the deep-link params into the URL (lines 31-42):

```js
startServer('maps', { map_no: 3, ...props.route.params }).then(res => {
  trackM('Shared location');
  navigation.navigate('maps', {
    link: res, map_no: 3, parameters: props.route.params,
  });
});
```

This means the WebView opens directly at `maps.html?map_no=3&start=…&end=…` and `Engine.js` hydrates from it.

### 7. [src/screens/Utilities/Web/Heartitout.js](src/screens/Utilities/Web/Heartitout.js)

The `useEffect` that posts state to the WebView (lines 63-73) becomes redundant because the URL already carries everything. Two safe options:

- Recommended: delete the `useEffect` and the `keyValuePairs` object. The WebView now boots into the right state on first paint, no message round-trip required.
- Conservative: keep the `useEffect` as a fallback, but the `Engine.js` listener is already idempotent (`first` flag), so it will be a no-op once `hydrateFromUrl` has populated `sessionStorage`.

Either way, the "share location" button (`runJavaScript` / `injectJavaScript`) is unchanged.

## What is intentionally NOT changed

- `Engine.js` `pointsSE` / `swap` / `detectFloor` keep writing `map_no` into `sessionStorage` based on user interactions. That is the correct behavior *after* the page has loaded; the URL only governs the initial entry.
- `local-static-server` config (`port: 0`, restart on `blur`) stays as-is. The URL-based contract makes the random port irrelevant for correctness.
- The Hermes JS bundle and ProGuard config are not touched. After the change you will still need a fresh release build for the RN-side edits to take effect on devices running the release APK.

## Verification

- Cold-launch app -> Home -> tap Ground / First / Second / Backside cards -> each opens the correct floor.
- Cold-launch app -> Home -> Search -> `index.html` -> tap each Floor button -> each opens the correct floor (this was the broken case).
- Cold-launch app -> Home -> Search -> `index.html` -> select a Source room and Destination room -> Search -> opens floor matching the source room id; `start`/`end` are present in `sessionStorage` on `maps.html`.
- Tap Search with no source selected -> popup appears and the page does NOT navigate.
- Open a shared-location deep link -> `maps.html` opens with the shared `start`/`end` and `map_no=3`.
- Devtools (`chrome://inspect`) check on `maps.html`: `window.location.search` and `sessionStorage` should match for every entry above.
