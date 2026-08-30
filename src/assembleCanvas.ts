import { layout, layoutWithLines, prepareWithSegments } from '@chenglou/pretext';

export const NAME = 'Samion Suwito';
export const BIO =
  'i was born and raised in hong kong and study computer science at UC Berkeley. I am currently working with xAI as a Member of Technical Staff and previously did research at Sky Computing Lab.';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'skyler', 'wabi', 'kava',
  'jinx', 'zebra', 'quorum', 'flux', 'wyvern', 'kyoto', 'xenon', 'jakob',
];

const BG = '#f4f4f2';
const RAIL_COLOR: RGB = [122, 122, 116];
const NAME_COLOR: RGB = [17, 17, 17];
const BIO_COLOR: RGB = [51, 51, 51];

const NAME_FONT = '600 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
const BIO_FONT = '400 16.8px "Helvetica Neue", Helvetica, Arial, sans-serif';
const RAIL_FONT = 'italic 22px Georgia, "Times New Roman", Times, serif';
const NAME_SIZE = 24;
const BIO_SIZE = 16.8;
const RAIL_SIZE = 22;
const NAME_LH = 28;
const BIO_LH = 26;
const RAIL_LH = 31;
const FLY_MS = 2400;
const STAGGER_MS = 1600;

type RGB = [number, number, number];

type Glyph = {
  ch: string;
  x: number;
  y: number;
  side?: 'left' | 'right';
};

type DestGlyph = Glyph & {
  font: string;
  size: number;
  color: RGB;
};

type Flyer = {
  dest: DestGlyph;
  delay: number;
  fromCh: string;
  fromX: number;
  fromY: number;
  fromSize: number;
  peeled: boolean;
};

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

function eachGrapheme(text: string): string[] {
  return Array.from(text);
}

function isSpace(ch: string) {
  return /\s/.test(ch);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgb(color: RGB, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function scaledFont(font: string, size: number) {
  return font.replace(/\d+(?:\.\d+)?px/, `${Math.max(1, size)}px`);
}

function layoutGlyphs(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  originX: number,
  originY: number,
  align: 'left' | 'center',
): Glyph[] {
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
  measureCtx.font = font;
  const glyphs: Glyph[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    let x = align === 'center' ? originX + (maxWidth - line.width) / 2 : originX;
    const y = originY + i * lineHeight;
    for (const ch of eachGrapheme(line.text)) {
      glyphs.push({ ch, x, y });
      x += measureCtx.measureText(ch).width;
    }
  }

  return glyphs;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let n = t;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function randomParagraph(rng: () => number) {
  const count = 16 + Math.floor(rng() * 10);
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let word = LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)];
    if (i === 0 || rng() < 0.12) word = word.charAt(0).toUpperCase() + word.slice(1);
    words.push(word);
  }
  return `${words.join(' ')}.`;
}

function randomRailText(seed: number, width: number, minHeight: number, existing = '') {
  const rng = mulberry32(seed + existing.length * 997);
  let text = existing;
  while (true) {
    const sample = text || 'Lorem';
    const prepared = prepareWithSegments(sample, RAIL_FONT);
    const { height } = layout(prepared, width, RAIL_LH);
    if (text && height >= minHeight) return text;
    text = text ? `${text} ${randomParagraph(rng)}` : randomParagraph(rng);
  }
}

function wrapY(y: number, loop: number) {
  if (loop <= 0) return y;
  let wrapped = y % loop;
  if (wrapped < 0) wrapped += loop;
  return wrapped;
}

function findSource(
  ch: string,
  destX: number,
  destY: number,
  rails: Glyph[],
  used: Set<number>,
  viewH: number,
  leftScroll: number,
  rightScroll: number,
  leftLoop: number,
  rightLoop: number,
) {
  const preferLeft = destX < window.innerWidth / 2;
  let best = -1;
  let bestScore = Infinity;

  for (let i = 0; i < rails.length; i += 1) {
    if (used.has(i)) continue;
    const glyph = rails[i];
    if (isSpace(glyph.ch)) continue;

    const loop = glyph.side === 'left' ? leftLoop : rightLoop;
    const scroll = glyph.side === 'left' ? leftScroll : rightScroll;
    const y = wrapY(glyph.y + scroll, loop);
    const onScreen = y >= -RAIL_LH && y <= viewH + RAIL_LH;
    const same = glyph.ch === ch;
    const fold = glyph.ch.toLowerCase() === ch.toLowerCase();
    const dx = glyph.x - destX;
    const dy = y - destY;
    let score = dx * dx + dy * dy;
    if (same) score *= 1;
    else if (fold) score *= 6;
    else score *= 35;
    if (!onScreen) score *= 20;
    if ((glyph.side === 'left') !== preferLeft) score *= 3;

    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }

  return best === -1 ? null : best;
}

export type AssembleHandle = {
  destroy: () => void;
};

export function startAssemble(options: {
  canvas: HTMLCanvasElement;
  photo: HTMLImageElement;
  onMetrics: (metrics: { nameH: number; bioH: number; contentW: number }) => void;
  onSettled: () => void;
}): AssembleHandle {
  const { canvas, photo, onMetrics, onSettled } = options;
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) return { destroy() {} };
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rails: Glyph[] = [];
  let dest: DestGlyph[] = [];
  let flyers: Flyer[] = [];
  let used = new Set<number>();
  let taken: { ch: string; side?: 'left' | 'right' }[] = [];
  let leftText = '';
  let rightText = '';
  const railSeed = Date.now();
  let leftLoop = 1;
  let rightLoop = 1;
  let leftPad = 0;
  let rightPad = 0;
  let railInner = 0;
  let viewW = 0;
  let viewH = 0;
  let raf = 0;
  let running = true;
  let settled = reduced;
  let assembleStart = 0;
  let started = false;

  function metricsFor(width: number) {
    const mobile = width < 720;
    const railW = mobile ? 76 : Math.min(width * 0.3, 380);
    const contentW = Math.min(576, Math.max(200, width - (mobile ? 168 : railW * 2 + 48)));
    const bioPrepared = prepareWithSegments(BIO, BIO_FONT);
    const bioLayout = layout(bioPrepared, contentW, BIO_LH);
    return { mobile, railW, contentW, nameH: NAME_LH, bioH: bioLayout.height };
  }

  function build() {
    viewW = canvas.clientWidth || window.innerWidth;
    viewH = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { mobile, railW, contentW, nameH, bioH } = metricsFor(viewW);
    onMetrics({ nameH, bioH, contentW });

    const photoBox = photo.getBoundingClientRect();
    const nameY = photoBox.bottom + 28;
    const bioY = nameY + nameH + 16;
    const contentX = (viewW - contentW) / 2;

    dest = [
      ...layoutGlyphs(NAME, NAME_FONT, contentW, NAME_LH, contentX, nameY, 'center').map((glyph) => ({
        ...glyph,
        font: NAME_FONT,
        size: NAME_SIZE,
        color: NAME_COLOR,
      })),
      ...layoutGlyphs(BIO, BIO_FONT, contentW, BIO_LH, contentX, bioY, 'center').map((glyph) => ({
        ...glyph,
        font: BIO_FONT,
        size: BIO_SIZE,
        color: BIO_COLOR,
      })),
    ];

    leftPad = mobile ? 8 : 16;
    rightPad = mobile ? 8 : 16;
    railInner = Math.max(48, railW - (mobile ? 16 : 36));

    const minRail = viewH + RAIL_LH * 4;
    leftText = randomRailText(railSeed, railInner, minRail, leftText);
    rightText = randomRailText(railSeed + 7919, railInner, minRail, rightText);

    const leftGlyphs = layoutGlyphs(leftText, RAIL_FONT, railInner, RAIL_LH, leftPad, 0, 'left').map((glyph) => ({
      ...glyph,
      side: 'left' as const,
    }));
    const rightGlyphs = layoutGlyphs(
      rightText,
      RAIL_FONT,
      railInner,
      RAIL_LH,
      viewW - rightPad - railInner,
      0,
      'left',
    ).map((glyph) => ({
      ...glyph,
      side: 'right' as const,
    }));
    leftLoop = Math.max(
      RAIL_LH,
      leftGlyphs.reduce((max, glyph) => Math.max(max, glyph.y + RAIL_LH), 0),
    );
    rightLoop = Math.max(
      RAIL_LH,
      rightGlyphs.reduce((max, glyph) => Math.max(max, glyph.y + RAIL_LH), 0),
    );
    rails = [...leftGlyphs, ...rightGlyphs];

    flyers = dest.map((glyph, index) => ({
      dest: glyph,
      delay: reduced ? 0 : (index / Math.max(dest.length - 1, 1)) * STAGGER_MS,
      fromCh: glyph.ch,
      fromX: glyph.x,
      fromY: glyph.y,
      fromSize: RAIL_SIZE,
      peeled: reduced || isSpace(glyph.ch),
    }));

    used = new Set();
    for (const item of taken) {
      const idx = rails.findIndex(
        (glyph, i) => !used.has(i) && glyph.ch === item.ch && (!item.side || glyph.side === item.side),
      );
      if (idx >= 0) used.add(idx);
    }
    if (reduced) {
      settled = true;
      onSettled();
    }
  }

  function scrollOffsets(now: number) {
    const t = now / 1000;
    return {
      left: -((t * 14) % leftLoop),
      right: -((t * 11 + rightLoop * 0.35) % rightLoop),
    };
  }

  function peel(flyer: Flyer, leftScroll: number, rightScroll: number) {
    if (flyer.peeled || isSpace(flyer.dest.ch)) {
      flyer.peeled = true;
      return;
    }

    let index = findSource(
      flyer.dest.ch,
      flyer.dest.x,
      flyer.dest.y,
      rails,
      used,
      viewH,
      leftScroll,
      rightScroll,
      leftLoop,
      rightLoop,
    );

    if (index == null) {
      index = rails.findIndex((glyph, i) => !used.has(i) && !isSpace(glyph.ch));
    }
    if (index == null || index < 0) {
      const fromLeft = flyer.dest.x < viewW / 2;
      flyer.fromX = fromLeft ? leftPad : viewW - rightPad - RAIL_SIZE;
      flyer.fromY = flyer.dest.y;
      flyer.fromCh = flyer.dest.ch;
      flyer.peeled = true;
      return;
    }

    used.add(index);
    const glyph = rails[index];
    taken.push({ ch: glyph.ch, side: glyph.side });
    const loop = glyph.side === 'left' ? leftLoop : rightLoop;
    const scroll = glyph.side === 'left' ? leftScroll : rightScroll;
    flyer.fromCh = glyph.ch;
    flyer.fromX = glyph.x;
    flyer.fromY = wrapY(glyph.y + scroll, loop);
    flyer.fromSize = RAIL_SIZE;
    flyer.peeled = true;
  }

  function drawRails(leftScroll: number, rightScroll: number) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, leftPad + railInner + 8, viewH);
    ctx.rect(viewW - rightPad - railInner - 8, 0, rightPad + railInner + 8, viewH);
    ctx.clip();
    ctx.font = RAIL_FONT;
    ctx.fillStyle = rgb(RAIL_COLOR);
    ctx.textBaseline = 'top';

    for (let i = 0; i < rails.length; i += 1) {
      if (used.has(i)) continue;
      const glyph = rails[i];
      const loop = glyph.side === 'left' ? leftLoop : rightLoop;
      const scroll = glyph.side === 'left' ? leftScroll : rightScroll;
      const y = wrapY(glyph.y + scroll, loop);
      if (y < -RAIL_LH || y > viewH + RAIL_LH) continue;
      ctx.fillText(glyph.ch, glyph.x, y);
    }

    const fadeLeft = ctx.createLinearGradient(0, 0, 0, viewH);
    fadeLeft.addColorStop(0, BG);
    fadeLeft.addColorStop(0.08, 'rgba(244,244,242,0)');
    fadeLeft.addColorStop(0.92, 'rgba(244,244,242,0)');
    fadeLeft.addColorStop(1, BG);
    ctx.fillStyle = fadeLeft;
    ctx.fillRect(0, 0, leftPad + railInner + 8, viewH);
    ctx.fillRect(viewW - rightPad - railInner - 8, 0, rightPad + railInner + 8, viewH);
    ctx.restore();
  }

  function drawFlyer(flyer: Flyer, local: number) {
    const t = ease(Math.min(Math.max(local, 0), 1));
    if (isSpace(flyer.dest.ch)) return;

    const x = lerp(flyer.fromX, flyer.dest.x, t);
    const y = lerp(flyer.fromY, flyer.dest.y, t) - Math.sin(t * Math.PI) * 36;
    const size = lerp(flyer.fromSize, flyer.dest.size, t);
    const color = lerpRgb(RAIL_COLOR, flyer.dest.color, t);
    const alpha = local <= 0 ? 0 : Math.min(1, local / 0.12 + t);

    ctx.textBaseline = 'top';
    ctx.globalAlpha = alpha;

    if (t < 0.85 && flyer.fromCh !== flyer.dest.ch) {
      ctx.globalAlpha = alpha * (1 - t);
      ctx.font = scaledFont(RAIL_FONT, size);
      ctx.fillStyle = rgb(RAIL_COLOR);
      ctx.fillText(flyer.fromCh, x, y);
      ctx.globalAlpha = alpha * t;
      ctx.font = scaledFont(flyer.dest.font, size);
      ctx.fillStyle = rgb(color);
      ctx.fillText(flyer.dest.ch, x, y);
    } else if (t < 0.72) {
      ctx.font = scaledFont(RAIL_FONT, size);
      ctx.fillStyle = rgb(color);
      ctx.fillText(flyer.fromCh, x, y);
    } else {
      ctx.font = scaledFont(flyer.dest.font, size);
      ctx.fillStyle = rgb(color);
      ctx.fillText(flyer.dest.ch, x, y);
    }

    ctx.globalAlpha = 1;
  }

  function frame(now: number) {
    if (!running) return;
    if (!started) {
      assembleStart = now;
      started = true;
    }

    const { left, right } = scrollOffsets(now);
    ctx.clearRect(0, 0, viewW, viewH);
    drawRails(left, right);

    if (!settled) {
      let allDone = true;
      for (const flyer of flyers) {
        const local = (now - assembleStart - flyer.delay) / FLY_MS;
        if (local >= 0 && !flyer.peeled) peel(flyer, left, right);
        if (local < 1) allDone = false;
        if (flyer.peeled && local > 0) drawFlyer(flyer, local);
      }
      if (allDone) {
        settled = true;
        onSettled();
      }
    } else {
      ctx.textBaseline = 'top';
      for (const glyph of dest) {
        if (isSpace(glyph.ch)) continue;
        ctx.font = glyph.font;
        ctx.fillStyle = rgb(glyph.color);
        ctx.fillText(glyph.ch, glyph.x, glyph.y);
      }
    }

  }

  let resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const previousDest = dest;
      const previousFlyers = flyers;
      const wasSettled = settled;
      build();
      if (wasSettled) {
        settled = true;
        flyers.forEach((flyer) => {
          flyer.peeled = true;
        });
        return;
      }
      flyers = previousFlyers.map((flyer, i) => ({
        ...flyer,
        dest: dest[i] ?? flyer.dest,
      }));
      if (flyers.length === 0) flyers = previousFlyers;
      void previousDest;
    }, 80);
  }

  let launched = false;
  let interval = 0;
  const start = () => {
    if (launched || !running) return;
    launched = true;
    build();
    const loop = (now: number) => {
      frame(now);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    interval = window.setInterval(() => frame(performance.now()), 50);
  };
  if (photo.complete && photo.naturalHeight > 0) start();
  else {
    photo.addEventListener('load', start, { once: true });
    if (photo.complete && photo.naturalHeight > 0) start();
  }
  const observer = new ResizeObserver(() => onResize());
  observer.observe(canvas);
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    },
  };
}
