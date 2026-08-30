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

type ThemeColors = {
  bg: string;
  rail: RGB;
  name: RGB;
  bio: RGB;
};

const LIGHT: ThemeColors = {
  bg: '#f4f4f2',
  rail: [122, 122, 116],
  name: [17, 17, 17],
  bio: [51, 51, 51],
};

const DARK: ThemeColors = {
  bg: '#111111',
  rail: [120, 120, 114],
  name: [242, 242, 238],
  bio: [196, 196, 190],
};

function themeColors(): ThemeColors {
  return document.documentElement.dataset.theme === 'light' ? LIGHT : DARK;
}

const NAME_FONT = '600 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
const BIO_FONT = '400 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
const RAIL_FONT = 'italic 34px Georgia, "Times New Roman", Times, serif';
const NAME_SIZE = 40;
const BIO_SIZE = 24;
const RAIL_SIZE = 34;
const NAME_LH = 48;
const BIO_LH = 34;
const RAIL_LH = 46;
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
  role: 'name' | 'bio';
};

type Flyer = {
  dest: DestGlyph;
  delay: number;
  fromCh: string;
  fromX: number;
  fromY: number;
  fromSize: number;
  peeled: boolean;
  sourceIndex: number | null;
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

function hexAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
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

function cellKey(glyph: Glyph) {
  return `${glyph.side}:${Math.round(glyph.x)}:${Math.round(glyph.y)}`;
}

function assignSources(dest: DestGlyph[], rails: Glyph[], viewW: number) {
  const claimed = new Set<number>();
  const claimedCells = new Set<string>();

  return dest.map((letter) => {
    if (isSpace(letter.ch)) return null;

    const preferLeft = letter.x < viewW / 2;
    let best = -1;
    let bestScore = Infinity;

    for (let i = 0; i < rails.length; i += 1) {
      if (claimed.has(i)) continue;
      const glyph = rails[i];
      if (isSpace(glyph.ch)) continue;
      if (claimedCells.has(cellKey(glyph))) continue;
      if (glyph.ch.toLowerCase() !== letter.ch.toLowerCase()) continue;

      const dx = glyph.x - letter.x;
      const dy = glyph.y - letter.y;
      let score = dx * dx + dy * dy * 0.35;
      if (glyph.ch !== letter.ch) score *= 8;
      if ((glyph.side === 'left') !== preferLeft) score *= 3;

      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }

    if (best < 0) return null;
    claimed.add(best);
    claimedCells.add(cellKey(rails[best]));
    return best;
  });
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
  let rebuilding = false;

  function metricsFor(width: number) {
    const mobile = width < 720;
    const railW = mobile ? 104 : Math.min(width * 0.34, 440);
    const contentW = Math.min(640, Math.max(200, width - (mobile ? 220 : railW * 2 + 48)));
    const bioPrepared = prepareWithSegments(BIO, BIO_FONT);
    const bioLayout = layout(bioPrepared, contentW, BIO_LH);
    return { mobile, railW, contentW, nameH: NAME_LH, bioH: bioLayout.height };
  }

  function build() {
    rebuilding = true;
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
        role: 'name' as const,
      })),
      ...layoutGlyphs(BIO, BIO_FONT, contentW, BIO_LH, contentX, bioY, 'center').map((glyph) => ({
        ...glyph,
        font: BIO_FONT,
        size: BIO_SIZE,
        role: 'bio' as const,
      })),
    ];

    leftPad = mobile ? 10 : 18;
    rightPad = mobile ? 10 : 18;
    railInner = Math.max(64, railW - (mobile ? 18 : 40));

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

    const sources = assignSources(dest, rails, viewW);
    flyers = dest.map((glyph, index) => ({
      dest: glyph,
      delay: reduced ? 0 : (index / Math.max(dest.length - 1, 1)) * STAGGER_MS,
      fromCh: glyph.ch,
      fromX: glyph.x,
      fromY: glyph.y,
      fromSize: RAIL_SIZE,
      peeled: reduced || isSpace(glyph.ch),
      sourceIndex: sources[index],
    }));

    used = new Set();
    if (reduced) {
      settled = true;
      onSettled();
    }
    rebuilding = false;
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

    const index = flyer.sourceIndex;
    if (index == null || used.has(index)) {
      const fromLeft = flyer.dest.x < viewW / 2;
      flyer.fromX = fromLeft ? leftPad : viewW - rightPad - RAIL_SIZE;
      flyer.fromY = flyer.dest.y;
      flyer.fromCh = flyer.dest.ch;
      flyer.peeled = true;
      return;
    }

    used.add(index);
    const glyph = rails[index];
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
    const colors = themeColors();
    ctx.font = RAIL_FONT;
    ctx.fillStyle = rgb(colors.rail);
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

    const fade = ctx.createLinearGradient(0, 0, 0, viewH);
    fade.addColorStop(0, colors.bg);
    fade.addColorStop(0.08, hexAlpha(colors.bg, 0));
    fade.addColorStop(0.92, hexAlpha(colors.bg, 0));
    fade.addColorStop(1, colors.bg);
    ctx.fillStyle = fade;
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
    const colors = themeColors();
    const destColor = flyer.dest.role === 'name' ? colors.name : colors.bio;
    const color = lerpRgb(colors.rail, destColor, t);
    const alpha = local <= 0 ? 0 : Math.min(1, local / 0.12 + t);

    ctx.textBaseline = 'top';
    ctx.globalAlpha = alpha;
    const ch = t < 0.55 ? flyer.fromCh : flyer.dest.ch;
    ctx.font = scaledFont(t < 0.72 ? RAIL_FONT : flyer.dest.font, size);
    ctx.fillStyle = rgb(color);
    ctx.fillText(ch, x, y);

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
        if (flyer.peeled && local >= 0) drawFlyer(flyer, local);
      }
      if (allDone) {
        settled = true;
        onSettled();
      }
    } else {
      const colors = themeColors();
      ctx.textBaseline = 'top';
      for (const glyph of dest) {
        if (isSpace(glyph.ch)) continue;
        ctx.font = glyph.font;
        ctx.fillStyle = rgb(glyph.role === 'name' ? colors.name : colors.bio);
        ctx.fillText(glyph.ch, glyph.x, glyph.y);
      }
    }

  }

  function hidePeeledSources() {
    used = new Set();
    for (const flyer of flyers) {
      if (flyer.peeled && flyer.sourceIndex != null) used.add(flyer.sourceIndex);
    }
  }

  let resizeTimer = 0;
  function onResize() {
    if (rebuilding) return;
    const nextW = canvas.clientWidth || window.innerWidth;
    const nextH = canvas.clientHeight || window.innerHeight;
    if (nextW === viewW && nextH === viewH) return;

    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (rebuilding) return;
      const previousFlyers = flyers;
      const wasSettled = settled;
      build();
      if (wasSettled) {
        settled = true;
        flyers.forEach((flyer) => {
          flyer.peeled = true;
        });
        hidePeeledSources();
        return;
      }
      flyers = previousFlyers.map((flyer, i) => ({
        ...flyer,
        dest: dest[i] ?? flyer.dest,
        sourceIndex: dest[i] ? flyers[i]?.sourceIndex ?? flyer.sourceIndex : flyer.sourceIndex,
      }));
      if (flyers.length === 0) flyers = previousFlyers;
      hidePeeledSources();
    }, 80);
  }

  let launched = false;
  const start = () => {
    if (launched || !running) return;
    launched = true;
    build();
    const loop = (now: number) => {
      frame(now);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
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
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    },
  };
}
