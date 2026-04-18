import {room_click, map_no} from './Engine.js';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const WHEEL_ZOOM_SENSITIVITY = 0.002;
const KEYBOARD_ZOOM_STEP = 1.15;
const LINE_HEIGHT_PX = 20;

let svgMaps = document.querySelectorAll('#removal div svg');

let mapMatrices = [
  new DOMMatrix(),
  new DOMMatrix(),
  new DOMMatrix(),
  new DOMMatrix(),
];

const mapNaturalCenters = [null, null, null, null];

const mapsWithHandlers = new WeakSet();
let keyboardZoomAttached = false;

function currentScale(M) {
  return Math.hypot(M.a, M.b);
}

function applyTouchAction(svgMap, scale) {
  svgMap.style.touchAction = scale > MIN_SCALE ? 'none' : 'pan-y';
}

function applyMatrix(svgMap, maps_no, M, animate) {
  mapMatrices[maps_no] = M;
  svgMap.style.transition =
    animate || M.isIdentity ? 'transform 0.5s' : '';
  svgMap.style.transform = M.toString();
  applyTouchAction(svgMap, currentScale(M));
}

function localPoint(svgMap, clientX, clientY) {
  const r = svgMap.parentElement.getBoundingClientRect();
  return {x: clientX - r.left, y: clientY - r.top};
}

function normalizeWheelDeltaYPixels(e) {
  let dy = e.deltaY;
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    dy *= LINE_HEIGHT_PX;
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    dy *= window.innerHeight || 600;
  }
  return dy;
}

function zoomAround(svgMap, maps_no, clientX, clientY, factor) {
  if (!Number.isFinite(factor) || factor <= 0) return;
  const M = mapMatrices[maps_no];
  const cur = currentScale(M);
  let next = cur * factor;
  if (next <= MIN_SCALE) {
    // Snap back to scale 1 but preserve the current rotation, so the user
    // doesn't lose the orientation they set with the rotate buttons.
    const angleDeg = rotationDegrees(M);
    if (Math.abs(angleDeg) < 0.5) {
      applyMatrix(svgMap, maps_no, new DOMMatrix());
    } else {
      const c = getNaturalCenterLocal(svgMap, maps_no);
      const Mreset = new DOMMatrix()
        .translateSelf(c.x, c.y)
        .rotateSelf(angleDeg)
        .translateSelf(-c.x, -c.y);
      applyMatrix(svgMap, maps_no, Mreset, true);
    }
    return;
  }
  if (next > MAX_SCALE) factor = MAX_SCALE / cur;
  const p = localPoint(svgMap, clientX, clientY);
  const Mnew = new DOMMatrix()
    .translateSelf(p.x, p.y)
    .scaleSelf(factor)
    .translateSelf(-p.x, -p.y)
    .multiplySelf(M);
  applyMatrix(svgMap, maps_no, Mnew);
}

function panBy(svgMap, maps_no, dx, dy) {
  if (dx === 0 && dy === 0) return;
  const Mnew = new DOMMatrix()
    .translateSelf(dx, dy)
    .multiplySelf(mapMatrices[maps_no]);
  applyMatrix(svgMap, maps_no, Mnew);
}

function rotateAround(svgMap, maps_no, deltaDeg, clientX, clientY, animate) {
  const p = localPoint(svgMap, clientX, clientY);
  const Mnew = new DOMMatrix()
    .translateSelf(p.x, p.y)
    .rotateSelf(deltaDeg)
    .translateSelf(-p.x, -p.y)
    .multiplySelf(mapMatrices[maps_no]);
  applyMatrix(svgMap, maps_no, Mnew, animate);
}

function svgCenterClient(svgMap) {
  const r = svgMap.getBoundingClientRect();
  return {cx: r.left + r.width / 2, cy: r.top + r.height / 2};
}

// Returns the SVG's natural (untransformed) center in wrapper-local coords.
// Cached per-map; the first call temporarily clears the SVG transform to
// measure, then restores it within the same JS tick to avoid a visible flash.
function getNaturalCenterLocal(svgMap, maps_no) {
  if (mapNaturalCenters[maps_no]) return mapNaturalCenters[maps_no];
  const prevTransform = svgMap.style.transform;
  const prevTransition = svgMap.style.transition;
  svgMap.style.transition = 'none';
  svgMap.style.transform = 'none';
  const svgRect = svgMap.getBoundingClientRect();
  const wrapperRect = svgMap.parentElement.getBoundingClientRect();
  svgMap.style.transform = prevTransform;
  svgMap.style.transition = prevTransition;
  const c = {
    x: svgRect.left + svgRect.width / 2 - wrapperRect.left,
    y: svgRect.top + svgRect.height / 2 - wrapperRect.top,
  };
  mapNaturalCenters[maps_no] = c;
  return c;
}

function rotationDegrees(M) {
  return (Math.atan2(M.b, M.a) * 180) / Math.PI;
}

export const resetCache = () => {
  for (let i = 0; i < svgMaps.length; i++) {
    if (svgMaps[i]) {
      applyMatrix(svgMaps[i], i, new DOMMatrix());
    } else {
      mapMatrices[i] = new DOMMatrix();
    }
  }
};

document.getElementById('counterclock').onclick = () => {
  const m = parseInt(map_no);
  const svgMap = svgMaps[m];
  if (!svgMap) return;
  const {cx, cy} = svgCenterClient(svgMap);
  rotateAround(svgMap, m, -90, cx, cy, true);
};

document.getElementById('clock').onclick = () => {
  const m = parseInt(map_no);
  const svgMap = svgMaps[m];
  if (!svgMap) return;
  const {cx, cy} = svgCenterClient(svgMap);
  rotateAround(svgMap, m, 90, cx, cy, true);
};

function isTypingTarget(el) {
  if (!el || !el.tagName) return false;
  const t = el.tagName.toLowerCase();
  return (
    t === 'input' ||
    t === 'textarea' ||
    t === 'select' ||
    el.isContentEditable
  );
}

function attachKeyboardZoomOnce() {
  if (keyboardZoomAttached) return;
  keyboardZoomAttached = true;
  window.addEventListener('keydown', e => {
    if (isTypingTarget(document.activeElement)) return;
    const m = parseInt(map_no, 10);
    if (Number.isNaN(m) || m < 0 || m >= svgMaps.length) return;
    const svgMap = svgMaps[m];
    if (!svgMap) return;
    const {cx, cy} = svgCenterClient(svgMap);
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomAround(svgMap, m, cx, cy, KEYBOARD_ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomAround(svgMap, m, cx, cy, 1 / KEYBOARD_ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      applyMatrix(svgMap, m, new DOMMatrix());
    }
  });
}

const reloades = (svgMap, maps_no) => {
  if (mapsWithHandlers.has(svgMap)) return;
  mapsWithHandlers.add(svgMap);

  if (svgMap.parentElement) {
    svgMap.parentElement.style.transform = '';
  }
  applyMatrix(svgMap, maps_no, mapMatrices[maps_no]);

  let pannings = false;
  let lastX = 0;
  let lastY = 0;

  svgMap.onpointercancel = pointerupHandler;
  svgMap.onpointerout = pointerupHandler;
  svgMap.onpointerleave = pointerupHandler;

  let evCache = [];
  let prevDiff = -1;

  function pointerupHandler(ev) {
    const index = evCache.findIndex(
      cachedEv => cachedEv.pointerId === ev.pointerId,
    );
    if (index >= 0) evCache.splice(index, 1);
    if (evCache.length < 2) {
      prevDiff = -1;
    }
    pannings = false;
  }

  const onclicked = e => {
    let gSelector = e.srcElement.parentElement;
    if (gSelector.nodeName == 'text') gSelector = gSelector.parentElement;

    if (gSelector.classList && gSelector.classList.contains('room')) {
      room_click(gSelector.id);
    }
  };

  svgMap.onpointerdown = function (e) {
    if (e.pointerType == 'mouse') {
      e.preventDefault();
      touchStart(e, 300);
    }
    evCache.push(e);
    lastX = e.clientX;
    lastY = e.clientY;
    pannings = true;
  };

  svgMap.onpointerup = function (ev) {
    if (ev.pointerType == 'mouse') touchEnd(ev);
    pointerupHandler(ev);
  };

  let onlongtouch = () => {
    timer = null;
  };
  let timer = null;

  const touchStart = (e, tTime) => {
    if (timer == null) {
      timer = setTimeout(onlongtouch, tTime);
    }
  };

  const touchEnd = e => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
      onclicked(e);
    }
  };

  svgMap.addEventListener('touchstart', function (e) {
    touchStart(e, 150);
  });

  svgMap.addEventListener('touchend', function (e) {
    touchEnd(e);
  });

  svgMap.onwheel = function (e) {
    const dy = normalizeWheelDeltaYPixels(e);
    if (dy === 0) return;

    const cur = currentScale(mapMatrices[maps_no]);
    if (cur <= MIN_SCALE && !e.ctrlKey && !e.metaKey) {
      return;
    }

    e.preventDefault();
    const factor = Math.exp(-dy * WHEEL_ZOOM_SENSITIVITY);
    zoomAround(svgMap, maps_no, e.clientX, e.clientY, factor);
  };

  svgMap.onpointermove = function (ev) {
    if (evCache.length === 2) {
      ev.preventDefault();
      const index = evCache.findIndex(
        cachedEv => cachedEv.pointerId === ev.pointerId,
      );
      if (index >= 0) evCache[index] = ev;
      const p0 = evCache[0];
      const p1 = evCache[1];
      const midX = (p0.clientX + p1.clientX) / 2;
      const midY = (p0.clientY + p1.clientY) / 2;
      const curDiff = Math.hypot(
        p0.clientX - p1.clientX,
        p0.clientY - p1.clientY,
      );
      if (prevDiff > 0 && curDiff > 0) {
        const factor = curDiff / prevDiff;
        zoomAround(svgMap, maps_no, midX, midY, factor);
      }
      prevDiff = curDiff;
      return;
    }

    if (evCache.length === 1) {
      const cur = currentScale(mapMatrices[maps_no]);
      if (ev.pointerType === 'mouse' || cur > MIN_SCALE) {
        ev.preventDefault();
        if (!pannings) {
          return;
        }
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        lastX = ev.clientX;
        lastY = ev.clientY;
        panBy(svgMap, maps_no, dx, dy);
      }
    }
  };
};

export const switching = _maps_no => {
  // No-op: each map owns its own DOMMatrix; nothing to swap on floor switch.
};

export const switchMap = () => {
  attachKeyboardZoomOnce();
  reloades(svgMaps[0], 0);
  reloades(svgMaps[1], 1);
  reloades(svgMaps[2], 2);
  reloades(svgMaps[3], 3);
};
