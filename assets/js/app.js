const PHRASE = "Climate ReAssemblies";

const lineEl = document.getElementById('line');

// Layout/state based on dynamic absolute-position slots with a fixed 5px ink gap
const state = {
  glyphs: [],
  widths: [],          // measured INK width for each glyph (px)
  leftOffsets: [],     // ink left bearing offset (px)
  chars: [],
  order: [],           // position -> glyphIndex
  posOfGlyph: [],      // glyphIndex -> position
  xPositions: [],      // position -> left x (px)
  initialOrder: [],
  gapUnit: 5,
  letterGap: 10, // 2x unit
  wordGap: 90,   // 6x unit
  cycleCount: 0
};

// Runtime configuration, adjustable via UI controls
const config = {
  tickIntervalMs: 500,
  ticksPerCycle: 3,
  maxGroupSize: 12,
  enableFontEffect: false,
  enableBlurEffect: false,
  scrambleDurationMs: 1000,
  scrambleDelayMs: 1000,
  motionDurationMs: 500,
  preCycleHoldMs: 0
};

const FONT_BASE = "'Apercu Bold', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'";
const ALT_FONTS = ["'Playfair Display', serif", "'Roboto Mono', monospace", "'Rubik', sans-serif"];
function pickAltFont() { return ALT_FONTS[Math.floor(Math.random() * ALT_FONTS.length)]; }
function setMovingFont(el) { if (!config.enableFontEffect) return; el.style.fontFamily = pickAltFont(); }
function resetFont(el) { el.style.fontFamily = FONT_BASE; }
const BLUR_PX = 8;
function setMovingBlur(el) { if (!config.enableBlurEffect) return; el.style.filter = `blur(${BLUR_PX}px)`; }
function resetBlur(el) { el.style.filter = 'none'; }

function createGlyphs(phrase) {
  lineEl.innerHTML = '';
  const fragments = [];
  state.chars = [];
  for (let i = 0; i < phrase.length; i++) {
    const ch = phrase[i];
    const span = document.createElement('span');
    span.className = 'glyph';
    span.textContent = ch;
    lineEl.appendChild(span);
    state.chars.push(ch);
    fragments.push(span);
  }
  return fragments;
}

function measureGlyphs(glyphs) {
  const rects = glyphs.map(g => g.getBoundingClientRect());
  const containerRect = lineEl.getBoundingClientRect();
  const baselineY = containerRect.top + containerRect.height; // approximate baseline
  const fontHeight = containerRect.height; // used for 1.5x vertical move
  return { rects, baselineY, fontHeight, containerRect };
}

function setupAbsoluteSlots(glyphs) {
  const { rects, containerRect } = measureGlyphs(glyphs);
  // Fix container height so absolutely positioned children don't collapse it
  lineEl.style.height = `${containerRect.height}px`;
  const left0 = containerRect.left;

  state.glyphs = glyphs;
  // Create a cloned, tight-measure layer to estimate ink bounds
  const measureLayer = document.createElement('div');
  measureLayer.style.position = 'fixed';
  measureLayer.style.left = '-10000px';
  measureLayer.style.top = '0';
  measureLayer.style.whiteSpace = 'nowrap';
  measureLayer.style.fontFamily = getComputedStyle(lineEl).fontFamily;
  measureLayer.style.fontWeight = getComputedStyle(lineEl).fontWeight;
  measureLayer.style.fontSize = getComputedStyle(lineEl).fontSize;
  document.body.appendChild(measureLayer);

  state.widths = [];
  state.leftOffsets = [];
  for (let i = 0; i < glyphs.length; i++) {
    const ch = state.chars[i];
    if (ch === ' ') {
      state.widths[i] = 0;
      state.leftOffsets[i] = 0;
      continue;
    }
    const box = document.createElement('span');
    box.textContent = ch;
    box.style.display = 'inline-block';
    box.style.padding = '0 2px'; // guard for potential clipping
    measureLayer.appendChild(box);
    const r = box.getBoundingClientRect();
    // approximate ink width as element width; leftOffsets set to 0 due to font variance
    state.widths[i] = r.width - 4; // remove artificial padding
    state.leftOffsets[i] = 0;
    measureLayer.removeChild(box);
  }
  document.body.removeChild(measureLayer);
  state.order = glyphs.map((_, i) => i); // initial order is index order
  state.initialOrder = [...state.order];

  // Compute tight positions with constant 5px gaps based on measured widths
  state.xPositions = [];
  let cursor = 0;
  for (let i = 0; i < glyphs.length; i++) {
    state.xPositions[i] = cursor;
    // Determine spacing: 6x between words, 2x between letters
    const spaceAfter = (state.chars[i] === ' ' || state.chars[i] === '') ? state.wordGap : state.letterGap;
    cursor += state.widths[i] + spaceAfter;
  }

  glyphs.forEach((g, i) => {
    g.classList.add('abs');
    gsap.set(g, { x: state.xPositions[i] - state.leftOffsets[i], y: 0 });
  });
}

// Utility to clamp a value
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Calculates target indices for selected glyphs and prevents offscreen
function computeXPositionsForOrder(order) {
  const x = [];
  let cursor = 0;
  for (let i = 0; i < order.length; i++) {
    const glyphIndex = order[i];
    x[i] = cursor;
    // Determine whether a word boundary follows this position in original chars
    const isSpace = state.chars[i] === ' ' || state.chars[i] === '';
    const gap = isSpace ? state.wordGap : state.letterGap;
    cursor += state.widths[glyphIndex] + gap;
  }
  return x;
}

function planReassemblySlots() {
  const count = state.glyphs.length;
  const maxPick = Math.min(config.maxGroupSize, count);
  const numToMove = Math.max(2, Math.floor(Math.random() * maxPick) + 1);
  const positionsChosen = new Set();
  while (positionsChosen.size < numToMove) {
    positionsChosen.add(Math.floor(Math.random() * count));
  }
  const movingPositions = Array.from(positionsChosen);

  // Permute within selected positions only
  const shuffled = [...movingPositions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.every((v, i) => v === movingPositions[i]) && shuffled.length > 1) {
    const first = shuffled.shift();
    shuffled.push(first);
  }

  // Build new order as a permutation of selected positions
  const newOrder = state.order.slice();
  for (let k = 0; k < movingPositions.length; k++) {
    const fromPos = movingPositions[k];
    const toPos = shuffled[k];
    newOrder[toPos] = state.order[fromPos];
  }

  // Compute new x positions based on glyph widths in their new order
  const newX = computeXPositionsForOrder(newOrder);

  // Describe moves for selected glyphs
  const moves = [];
  for (let k = 0; k < movingPositions.length; k++) {
    const fromPos = movingPositions[k];
    const toPos = shuffled[k];
    const glyphIndex = state.order[fromPos];
    const targetX = newX[toPos];
    moves.push({ glyphIndex, fromPos, toPos, targetX });
  }

  return { movingPositions, newOrder, newX, moves };
}

function runCycle() {
  const measure = measureGlyphs(state.glyphs);
  const vOffset = measure.fontHeight * 1.3;
  const canMoveUp = measure.containerRect.top - vOffset >= 0;
  const canMoveDown = measure.containerRect.bottom + vOffset <= window.innerHeight;

  const plan = planReassemblySlots();
  const { newOrder, newX, moves, movingPositions } = plan;
  // derive leg durations from motionDurationMs (total approximated ~ leg*4)
  const totalDur = Math.max(200, Math.min(config.motionDurationMs, config.tickIntervalMs));
  // proportions: up/down:1, horiz:1, settle:2 → 4 parts
  const leg = totalDur / 4 / 1000; // GSAP durations are in seconds
  const ease = 'power3.inOut';
  const stagger = 0.06;
  const tl = gsap.timeline({ defaults: { ease } });

  moves.forEach((m, idx) => {
    const g = state.glyphs[m.glyphIndex];
    let goUp = Math.random() < 0.5;
    if (goUp && !canMoveUp && canMoveDown) goUp = false;
    if (!goUp && !canMoveDown && canMoveUp) goUp = true;
    const offset = (!canMoveUp && !canMoveDown) ? 0 : (goUp ? -vOffset : vOffset);
    // Start: ensure default font, apply blur if enabled during motion
    tl.call(() => { resetFont(g); setMovingBlur(g); }, null, 0 + idx * stagger);
    // 1) Vertical move to offset track
    tl.to(g, { y: offset, duration: leg }, 0 + idx * stagger);
    // When on the offset track, enable random font for horizontal motion only
    tl.call(() => { setMovingFont(g); }, null, leg + idx * stagger);
    // 2) Horizontal move along the offset track
    tl.to(g, { x: m.targetX, duration: leg }, leg + idx * stagger);
    // Before starting final vertical, return to default font (must be default on vertical)
    tl.call(() => { resetFont(g); }, null, leg * 2 + idx * stagger);
    // revert blur 0.3s before the glyph fully settles on the baseline
    const perGlyphTotal = leg + leg + leg * 2; // full per-glyph duration
    const revertAt = Math.max(0, perGlyphTotal - 0.3);
    tl.call(() => { resetBlur(g); }, null, revertAt + idx * stagger);
    // 3) Vertical move back to baseline
    tl.to(g, { y: 0, duration: leg * 2 }, leg * 2 + idx * stagger);
  });

  // While selected glyphs are off the baseline, shift non-moving glyphs to their new X instantly (or quick tween)
  const nonMovingPositions = state.order.map((_, i) => i).filter(p => !movingPositions.includes(p));
  nonMovingPositions.forEach(p => {
    const glyphIndex = state.order[p];
    const g = state.glyphs[glyphIndex];
    // quick, subtle move during the horizontal phase (no font change for non-moving)
    tl.to(g, { x: newX[p], duration: 0.12 }, leg + 0.02);
  });

  tl.eventCallback('onComplete', () => {
    // Commit new order and x positions
    state.order = newOrder;
    state.xPositions = newX;
    state.posOfGlyph = state.glyphs.map((_, i) => state.order.indexOf(i));
  });

  return tl;
}

function animateReturnToOriginal(onDone) {
  const measure = measureGlyphs(state.glyphs);
  const vOffset = measure.fontHeight * 1.0;
  const canMoveUp = measure.containerRect.top - vOffset >= 0;
  const canMoveDown = measure.containerRect.bottom + vOffset <= window.innerHeight;

  const retTotalMs = Math.max(200, Math.min(Math.floor(config.motionDurationMs / 5), config.tickIntervalMs));
  const leg = (retTotalMs / 4) / 1000; // seconds
  const ease = 'power3.inOut';
  const tl = gsap.timeline({ defaults: { ease } });
  const stagger = 0.04;

  const targetXPositions = computeXPositionsForOrder(state.initialOrder);
  for (let gIdx = 0; gIdx < state.glyphs.length; gIdx++) {
    const g = state.glyphs[gIdx];
    const targetX = targetXPositions[gIdx];

    let goUp = Math.random() < 0.5;
    if (goUp && !canMoveUp && canMoveDown) goUp = false;
    if (!goUp && !canMoveDown && canMoveUp) goUp = true;
    const offset = (!canMoveUp && !canMoveDown) ? 0 : (goUp ? -vOffset : vOffset);
    // Start: default font, blur during motion
    tl.call(() => { resetFont(g); setMovingBlur(g); }, null, 0 + gIdx * stagger);
    // 1) Vertical to offset track
    tl.to(g, { y: offset, duration: leg }, 0 + gIdx * stagger);
    // On offset tracks, allow random font during horizontal motion
    tl.call(() => { setMovingFont(g); }, null, leg + gIdx * stagger);
    // 2) Horizontal move
    tl.to(g, { x: targetX, duration: leg }, leg + gIdx * stagger);
    // Before final vertical, return to default font
    tl.call(() => { resetFont(g); }, null, leg * 2 + gIdx * stagger);
    const perGlyphTotal = leg + leg + leg * 2;
    const revertAt = Math.max(0, perGlyphTotal - 0.3);
    tl.call(() => { resetBlur(g); }, null, revertAt + gIdx * stagger);
    // 3) Vertical back to baseline
    tl.to(g, { y: 0, duration: leg * 2 }, leg * 2 + gIdx * stagger);
  }

  tl.eventCallback('onComplete', () => {
    // Reset state to original mapping and exact positions
    state.order = [...state.initialOrder];
    state.posOfGlyph = state.glyphs.map((_, i) => i);
    state.xPositions = targetXPositions;
    state.glyphs.forEach((g, i) => { gsap.set(g, { x: state.xPositions[i], y: 0 }); });
    if (typeof onDone === 'function') onDone();
  });
}

// Secret scramble text reveal back to original layout over ~2 seconds
function scrambleRevealToOriginal(onDone) {
  // Wait 2 seconds before starting the scramble
  const startDelayMs = config.scrambleDelayMs;
  setTimeout(() => {
    // Kill any in-flight tweens to avoid conflicts
    state.glyphs.forEach(g => gsap.killTweensOf(g));
    // Ensure all fonts reset before scramble
    state.glyphs.forEach(g => { resetFont(g); resetBlur(g); });

    const targetXPositions = computeXPositionsForOrder(state.initialOrder);
    // Snap all glyphs back to their original slots instantly
    state.glyphs.forEach((g, i) => {
      gsap.set(g, { x: targetXPositions[i], y: 0 });
    });

    // Use configured scramble duration
    const durationMs = config.scrambleDurationMs;
    const startTime = performance.now();
    const endTime = startTime + durationMs;

    // Character set for scrambling (inspired by classic decoder effects)
    const scrambleChars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    const isSpaceAt = (i) => state.chars[i] === ' ' || state.chars[i] === '';
    const randChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

    // Assign a settle time per glyph across the shorter window
    // Also throttle character changes to be ~10x less frequent than per-frame
    const changeIntervalMs = Math.round((1000 / 60) * 10); // ~166ms
    const plan = state.glyphs.map((_, i) => {
      const settleProgress = 0.4 + Math.random() * 0.55; // 40% - 95% of duration
      const settleAt = Math.min(endTime - 50, startTime + durationMs * settleProgress);
      return { settleAt, isSpace: isSpaceAt(i), nextChangeAt: startTime };
    });

    // Kick off the scramble loop
    function step(now) {
      let allSettled = true;
      for (let i = 0; i < state.glyphs.length; i++) {
        const g = state.glyphs[i];
        const p = plan[i];
        if (p.isSpace) {
          // Ensure spaces remain blank
          g.textContent = '';
          continue;
        }
        if (now < p.settleAt) {
          allSettled = false;
          if (now >= p.nextChangeAt) {
            g.textContent = randChar();
            p.nextChangeAt = now + changeIntervalMs;
          }
        } else {
          g.textContent = state.chars[i];
          // Reset to base font when settled
          resetFont(g);
        }
      }

      if (!allSettled && now < endTime) {
        requestAnimationFrame(step);
      } else {
        // Finalize: ensure exact final text and canonical state
        for (let i = 0; i < state.glyphs.length; i++) {
          const g = state.glyphs[i];
          if (!plan[i].isSpace) g.textContent = state.chars[i];
        }
        state.order = [...state.initialOrder];
        state.posOfGlyph = state.glyphs.map((_, i) => i);
        state.xPositions = targetXPositions;
        state.glyphs.forEach((g, i) => { gsap.set(g, { x: state.xPositions[i], y: 0 }); });
        if (typeof onDone === 'function') onDone();
      }
    }

    requestAnimationFrame(step);
  }, startDelayMs);
}

let schedulerIntervalId = null;
let schedulerRunning = false;
let schedulerTimeouts = [];
function startScheduler() {
  // ensure no overlap; use config-driven cadence and cycle length
  let locked = false;
  let tickCount = 0;
  schedulerRunning = true;

  const tick = () => {
    if (!schedulerRunning || locked) return;
    locked = true;
    // wait pre-cycle hold, then run the cycle
    schedulerTimeouts.push(setTimeout(() => {
      if (!schedulerRunning) return;
      runCycle();
      tickCount += 1;

      // unlock after forward completes, derived from motion duration with small buffer
      const forwardDoneMs = Math.min(config.tickIntervalMs, Math.max(200, config.motionDurationMs)) + 180;
      schedulerTimeouts.push(setTimeout(() => {
        if (!schedulerRunning) return;
        if (tickCount >= config.ticksPerCycle) {
          // run secret scramble reveal, then reset counter and unlock
          scrambleRevealToOriginal(() => {
            tickCount = 0;
            locked = false;
          });
        } else {
          locked = false;
        }
      }, forwardDoneMs));
    }, Math.max(0, config.preCycleHoldMs)));
  };

  // initial immediate tick, then schedule
  tick();
  if (schedulerIntervalId) clearInterval(schedulerIntervalId);
  schedulerIntervalId = setInterval(tick, config.tickIntervalMs);
}

function stopScheduler() {
  schedulerRunning = false;
  if (schedulerIntervalId) { clearInterval(schedulerIntervalId); schedulerIntervalId = null; }
  schedulerTimeouts.forEach(clearTimeout);
  schedulerTimeouts = [];
}

// Instantly kill any in-flight motion and snap glyphs back to the original layout
function restoreInitialState() {
  const targetX = computeXPositionsForOrder(state.initialOrder);
  state.order = [...state.initialOrder];
  state.posOfGlyph = state.glyphs.map((_, i) => i);
  state.xPositions = targetX;
  state.glyphs.forEach((g, i) => {
    gsap.killTweensOf(g);
    resetFont(g);
    resetBlur(g);
    g.textContent = state.chars[i]; // undo any scramble characters
    gsap.set(g, { x: targetX[i], y: 0 });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const glyphs = createGlyphs(PHRASE);
  setupAbsoluteSlots(glyphs);
});

lineEl.addEventListener("mouseenter", () => {
  startScheduler();
});

lineEl.addEventListener("mouseleave", () => {
  stopScheduler();
  restoreInitialState();
});


