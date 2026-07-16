gsap.registerPlugin(SplitText);

const PHRASE = "Climate ReAssemblies";

const lineEl = document.getElementById('line');
const headerEl = document.querySelector('header');

// Show a "progress" cursor only while glyphs are actually in motion
const setHeaderBusy = (busy) => {
  if (headerEl) headerEl.style.cursor = busy ? 'progress' : 'default';
};

// Layout/state based on dynamic absolute-position slots with fixed ink gaps
const state = {
  glyphs: [],
  widths: [],          // measured INK width for each glyph (px)
  chars: [],
  order: [],           // position -> glyphIndex
  xPositions: [],      // position -> left x (px)
  initialOrder: [],
  gapUnit: 2,   // base gap unit (px)
  letterGap: 1, // 1x unit between letters
  wordGap: 6    // 6x units between words
};

// Gap (px) that follows the character at position i in the original phrase
const gapAfter = (i) => {
  return (state.chars[i] === ' ' ? state.wordGap : state.letterGap) * state.gapUnit;
};

// Runtime configuration
const config = {
  tickIntervalMs: 8000,
  ticksPerCycle: 1,
  maxGroupSize: 12,
  enableBlurEffect: true,
  scrambleDurationMs: 500,
  scrambleDelayMs: 1000,
  motionDurationMs: 1000,
  preCycleHoldMs: 0
};

const BLUR_PX = 2;
const setMovingBlur = (el) => { if (!config.enableBlurEffect) return; el.style.filter = `blur(${BLUR_PX}px)`; };
const resetBlur = (el) => { el.style.filter = 'none'; };

const createGlyphs = (phrase) => {
  lineEl.textContent = phrase;
  const split = new SplitText(lineEl, { type: 'chars', charsClass: 'glyph' });

  const fragments = [];
  state.chars = [];
  let charCursor = 0;
  for (let i = 0; i < phrase.length; i++) {
    const ch = phrase[i];
    state.chars.push(ch);
    if (ch === ' ') {
      const span = document.createElement('span');
      span.className = 'glyph';
      const nextChar = split.chars[charCursor];
      if (nextChar) nextChar.before(span); else lineEl.appendChild(span);
      fragments.push(span);
    } else {
      fragments.push(split.chars[charCursor++]);
    }
  }
  return fragments;
};

const measureLine = () => {
  const containerRect = lineEl.getBoundingClientRect();
  const fontHeight = containerRect.height; // used for the vertical offset track
  return { fontHeight, containerRect };
};

const setupAbsoluteSlots = (glyphs) => {
  const { containerRect } = measureLine();
  // Fix container height so absolutely positioned children don't collapse it
  lineEl.style.height = `${containerRect.height}px`;

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
  for (let i = 0; i < glyphs.length; i++) {
    const ch = state.chars[i];
    if (ch === ' ') {
      state.widths[i] = 0;
      continue;
    }
    const box = document.createElement('span');
    box.textContent = ch;
    box.style.display = 'inline-block';
    box.style.padding = '0 2px'; // guard for potential clipping
    measureLayer.appendChild(box);
    const r = box.getBoundingClientRect();
    // approximate ink width as element width
    state.widths[i] = r.width - 2; // remove artificial padding
    measureLayer.removeChild(box);
  }
  document.body.removeChild(measureLayer);
  state.order = glyphs.map((_, i) => i); // initial order is index order
  state.initialOrder = [...state.order];

  // Compute tight positions with constant unit gaps based on measured widths
  state.xPositions = [];
  let cursor = 0;
  for (let i = 0; i < glyphs.length; i++) {
    state.xPositions[i] = cursor;
    cursor += state.widths[i] + gapAfter(i);
  }
  // Size the container to the actual glyph layout (not the natural text
  // width) so the last glyph isn't clipped when custom gaps run wider
  const lastIdx = glyphs.length - 1;
  lineEl.style.width = `${state.xPositions[lastIdx] + state.widths[lastIdx]}px`;

  glyphs.forEach((g, i) => {
    g.classList.add('abs');
    // position set inline too: SplitText may leave inline styles that would
    // otherwise override the .abs class
    gsap.set(g, { position: 'absolute', top: 0, left: 0, x: state.xPositions[i], y: 0 });
  });
};

// Calculates target x positions for a given glyph order
const computeXPositionsForOrder = (order) => {
  const x = [];
  let cursor = 0;
  for (let i = 0; i < order.length; i++) {
    const glyphIndex = order[i];
    x[i] = cursor;
    // Word boundaries stay tied to positions in the original phrase
    cursor += state.widths[glyphIndex] + gapAfter(i);
  }
  return x;
};

const planReassemblySlots = () => {
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
    const glyphIndex = state.order[movingPositions[k]];
    const targetX = newX[shuffled[k]];
    moves.push({ glyphIndex, targetX });
  }

  return { movingPositions, newOrder, newX, moves };
};

const runCycle = () => {
  const measure = measureLine();
  const vOffset = measure.fontHeight * 1.3;
  const canMoveUp = measure.containerRect.top - vOffset >= 0;
  const canMoveDown = measure.containerRect.bottom + vOffset <= window.innerHeight;

  const { newOrder, newX, moves, movingPositions } = planReassemblySlots();
  // derive leg durations from motionDurationMs (total approximated ~ leg*4)
  const totalDur = Math.max(200, Math.min(config.motionDurationMs, config.tickIntervalMs));
  // proportions: up/down:1, horiz:1, settle:2 → 4 parts
  const leg = totalDur / 4 / 1000; // GSAP durations are in seconds
  const ease = 'power3.inOut';
  const stagger = 0.06;
  const tl = gsap.timeline({ defaults: { ease }, onStart: () => setHeaderBusy(true) });

  moves.forEach((m, idx) => {
    const g = state.glyphs[m.glyphIndex];
    let goUp = Math.random() < 0.5;
    if (goUp && !canMoveUp && canMoveDown) goUp = false;
    if (!goUp && !canMoveDown && canMoveUp) goUp = true;
    const offset = (!canMoveUp && !canMoveDown) ? 0 : (goUp ? -vOffset : vOffset);
    // Start: apply blur if enabled during motion
    tl.call(() => { setMovingBlur(g); }, null, 0 + idx * stagger);
    // 1) Vertical move to offset track
    tl.to(g, { y: offset, duration: leg }, 0 + idx * stagger);
    // 2) Horizontal move along the offset track
    tl.to(g, { x: m.targetX, duration: leg }, leg + idx * stagger);
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
    // quick, subtle move during the horizontal phase
    tl.to(g, { x: newX[p], duration: 0.12 }, leg + 0.02);
  });

  tl.eventCallback('onComplete', () => {
    // Commit new order and x positions
    state.order = newOrder;
    state.xPositions = newX;
    setHeaderBusy(false);
  });

  return tl;
};

// Secret scramble text reveal back to original layout over ~2 seconds
const scrambleRevealToOriginal = (onDone) => {
  // Wait 2 seconds before starting the scramble
  const startDelayMs = config.scrambleDelayMs;
  setTimeout(() => {
    // Kill any in-flight tweens to avoid conflicts
    state.glyphs.forEach(g => gsap.killTweensOf(g));
    // Ensure blur is cleared before scramble
    state.glyphs.forEach(g => resetBlur(g));

    const targetXPositions = computeXPositionsForOrder(state.initialOrder);
    // Snap all glyphs back to their original slots instantly
    state.glyphs.forEach((g, i) => {
      gsap.set(g, { x: targetXPositions[i], y: 0 });
    });

    setHeaderBusy(true);

    // Use configured scramble duration
    const durationMs = config.scrambleDurationMs;
    const startTime = performance.now();
    const endTime = startTime + durationMs;

    // Character set for scrambling (inspired by classic decoder effects)
    const scrambleChars = '!<>-[]+*?#ABCEILRS'.split('');
    const isSpaceAt = (i) => state.chars[i] === ' ';
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
    const step = (now) => {
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
        state.xPositions = targetXPositions;
        state.glyphs.forEach((g, i) => { gsap.set(g, { x: state.xPositions[i], y: 0 }); });
        setHeaderBusy(false);
        if (typeof onDone === 'function') onDone();
      }
    };

    requestAnimationFrame(step);
  }, startDelayMs);
};

let schedulerIntervalId = null;
const startScheduler = () => {
  // ensure no overlap; use config-driven cadence and cycle length
  let locked = false;
  let tickCount = 0;

  const tick = () => {
    if (locked) return;
    locked = true;
    // wait pre-cycle hold, then run the cycle
    setTimeout(() => {
      runCycle();
      tickCount += 1;

      // unlock after forward completes, derived from motion duration with small buffer
      const forwardDoneMs = Math.min(config.tickIntervalMs, Math.max(200, config.motionDurationMs)) + 180;
      setTimeout(() => {
        if (tickCount >= config.ticksPerCycle) {
          // run secret scramble reveal, then reset counter and unlock
          scrambleRevealToOriginal(() => {
            tickCount = 0;
            locked = false;
          });
        } else {
          locked = false;
        }
      }, forwardDoneMs);
    }, Math.max(0, config.preCycleHoldMs));
  };

  // initial immediate tick, then schedule
  tick();
  if (schedulerIntervalId) clearInterval(schedulerIntervalId);
  schedulerIntervalId = setInterval(tick, config.tickIntervalMs);
};

window.addEventListener('DOMContentLoaded', () => {
  const glyphs = createGlyphs(PHRASE);
  setupAbsoluteSlots(glyphs);
  startScheduler();
});

lineEl.addEventListener("mouseenter", () => {
  startScheduler();
});

document.addEventListener("sectionchange", () => {
  startScheduler();
});


