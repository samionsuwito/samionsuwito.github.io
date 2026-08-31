import React, { useEffect, useRef, useState } from 'react';
import {
  getShaderColorFromString,
  imageDitheringFragmentShader,
  ShaderFitOptions,
} from '@paper-design/shaders';
import './GameBoy.css';

type Kind = 'cold' | 'hot';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: Kind;
};

type Ripple = {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  color: string;
};

const COLD = 7;
const HOT = 7;
const COLD_SPEED = 0.55;
const HOT_SPEED = 2.15;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeParticle(kind: Kind, w: number, h: number): Particle {
  const speed = kind === 'cold' ? COLD_SPEED : HOT_SPEED;
  const angle = rand(0, Math.PI * 2);
  const left = Math.random() < 0.5;
  return {
    x: left ? rand(12, w * 0.46) : rand(w * 0.54, w - 12),
    y: rand(12, h - 12),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: kind === 'cold' ? 6.5 : 6,
    kind,
  };
}

function bounce(p: Particle, min: number, max: number, axis: 'x' | 'y') {
  if (axis === 'x') {
    if (p.x - p.r < min) {
      p.x = min + p.r;
      p.vx = Math.abs(p.vx);
    } else if (p.x + p.r > max) {
      p.x = max - p.r;
      p.vx = -Math.abs(p.vx);
    }
  } else if (p.y - p.r < min) {
    p.y = min + p.r;
    p.vy = Math.abs(p.vy);
  } else if (p.y + p.r > max) {
    p.y = max - p.r;
    p.vy = -Math.abs(p.vy);
  }
}

function speedOf(kind: Kind) {
  return kind === 'cold' ? COLD_SPEED : HOT_SPEED;
}

function restoreSpeed(p: Particle) {
  const mag = Math.hypot(p.vx, p.vy) || 1;
  const speed = speedOf(p.kind);
  p.vx = (p.vx / mag) * speed;
  p.vy = (p.vy / mag) * speed;
}

function rippleColor(a: Kind, b: Kind) {
  if (a === b) return a === 'hot' ? '#ff6a52' : '#7ecbff';
  return '#c56bff';
}

function collideParticles(particles: Particle[], ripples: Ripple[]) {
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist === 0) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      if (dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) / 2 + 0.05;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel >= 0) continue;

      const vaN = a.vx * nx + a.vy * ny;
      const vbN = b.vx * nx + b.vy * ny;
      a.vx += (vbN - vaN) * nx;
      a.vy += (vbN - vaN) * ny;
      b.vx += (vaN - vbN) * nx;
      b.vy += (vaN - vbN) * ny;
      restoreSpeed(a);
      restoreSpeed(b);

      if (ripples.length < 16) {
        ripples.push({
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          r: Math.min(a.r, b.r) * 0.4,
          maxR: 34,
          life: 1,
          color: rippleColor(a.kind, b.kind),
        });
      }
    }
  }
}

function collideWall(p: Particle, wallX: number, wallT: number, gateY0: number, gateY1: number, open: boolean) {
  const left = wallX - wallT / 2;
  const right = wallX + wallT / 2;
  const throughGate = open && p.y > gateY0 + p.r && p.y < gateY1 - p.r;
  if (throughGate) return;
  if (p.x + p.r <= left || p.x - p.r >= right) return;

  if (p.x < wallX) {
    p.x = left - p.r;
    p.vx = -Math.abs(p.vx);
  } else {
    p.x = right + p.r;
    p.vx = Math.abs(p.vx);
  }
}

function sortProgress(particles: Particle[], wallX: number) {
  if (particles.length === 0) return 0;
  let coldLeft = 0;
  let hotRight = 0;
  let hotLeft = 0;
  let coldRight = 0;
  for (const p of particles) {
    const left = p.x < wallX;
    if (p.kind === 'cold') {
      if (left) coldLeft += 1;
      else coldRight += 1;
    } else if (left) hotLeft += 1;
    else hotRight += 1;
  }
  const total = particles.length;
  return Math.max((coldLeft + hotRight) / total, (hotLeft + coldRight) / total);
}

const DITHER_VERT = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function mountCanvasDither(output: HTMLCanvasElement) {
  const gl = output.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, DITHER_VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, imageDitheringFragmentShader);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const colorFront = getShaderColorFromString('#8bac0f');
  const colorBack = getShaderColorFromString('#0f380f');
  const colorHighlight = getShaderColorFromString('#9bbc0f');

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
  gl.uniform4f(gl.getUniformLocation(program, 'u_colorFront'), ...colorFront);
  gl.uniform4f(gl.getUniformLocation(program, 'u_colorBack'), ...colorBack);
  gl.uniform4f(gl.getUniformLocation(program, 'u_colorHighlight'), ...colorHighlight);
  gl.uniform1f(gl.getUniformLocation(program, 'u_type'), 3);
  gl.uniform1f(gl.getUniformLocation(program, 'u_pxSize'), 3);
  gl.uniform1f(gl.getUniformLocation(program, 'u_colorSteps'), 3);
  gl.uniform1i(gl.getUniformLocation(program, 'u_originalColors'), 1);
  gl.uniform1i(gl.getUniformLocation(program, 'u_inverted'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_fit'), ShaderFitOptions.cover ?? 2);
  gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), 1);
  gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_offsetX'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_offsetY'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_originX'), 0.5);
  gl.uniform1f(gl.getUniformLocation(program, 'u_originY'), 0.5);
  gl.uniform1f(gl.getUniformLocation(program, 'u_worldWidth'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_worldHeight'), 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uPixelRatio = gl.getUniformLocation(program, 'u_pixelRatio');
  const uImageAspect = gl.getUniformLocation(program, 'u_imageAspectRatio');

  return {
    render(source: HTMLCanvasElement, cssWidth: number) {
      if (output.width < 1 || output.height < 1 || source.width < 1 || source.height < 1) return;
      gl.viewport(0, 0, output.width, output.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform2f(uResolution, output.width, output.height);
      gl.uniform1f(uPixelRatio, output.width / Math.max(1, cssWidth));
      gl.uniform1f(uImageAspect, source.width / source.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}

function startSim(
  source: HTMLCanvasElement,
  output: HTMLCanvasElement,
  isOpen: () => boolean,
  onProgress: (value: number) => void,
) {
  const maybeCtx = source.getContext('2d');
  if (!maybeCtx) return { destroy() {} };
  const ctx: CanvasRenderingContext2D = maybeCtx;
  let dither: ReturnType<typeof mountCanvasDither> = null;
  try {
    dither = mountCanvasDither(output);
  } catch (err) {
    console.error(err);
  }

  let w = 0;
  let h = 0;
  let particles: Particle[] = [];
  let ripples: Ripple[] = [];
  let raf = 0;
  let running = true;
  let lastProgress = -1;

  function size() {
    const rect = output.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    source.width = Math.floor(w * dpr);
    source.height = Math.floor(h * dpr);
    output.width = source.width;
    output.height = source.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = [
      ...Array.from({ length: COLD }, () => makeParticle('cold', w, h)),
      ...Array.from({ length: HOT }, () => makeParticle('hot', w, h)),
    ];
    ripples = [];
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const wallX = w / 2;
    const wallT = 5;
    const gateH = Math.max(32, h * 0.34);
    const gateY0 = (h - gateH) / 2;
    const gateY1 = gateY0 + gateH;
    const open = isOpen();

    ctx.fillStyle = '#3d5a38';
    ctx.fillRect(wallX - wallT / 2, 0, wallT, gateY0);
    ctx.fillRect(wallX - wallT / 2, gateY1, wallT, h - gateY1);

    if (open) {
      ctx.fillStyle = 'rgba(180, 220, 140, 0.28)';
      ctx.fillRect(wallX - 1, gateY0, 2, gateH);
    } else {
      ctx.fillStyle = '#6a8f4c';
      ctx.fillRect(wallX - wallT / 2, gateY0, wallT, gateH);
    }

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      bounce(p, 1, w - 1, 'x');
      bounce(p, 1, h - 1, 'y');
      collideWall(p, wallX, wallT, gateY0, gateY1, open);
    }
    collideParticles(particles, ripples);
    for (const p of particles) {
      bounce(p, 1, w - 1, 'x');
      bounce(p, 1, h - 1, 'y');
      collideWall(p, wallX, wallT, gateY0, gateY1, open);
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.r += 1.7;
      rip.life -= 0.04;
      if (rip.life <= 0 || rip.r >= rip.maxR) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = Math.max(0, rip.life);
      ctx.lineWidth = 2.4;
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.stroke();
      if (rip.r > 8) {
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, rip.life * 0.45);
        ctx.lineWidth = 1.6;
        ctx.arc(rip.x, rip.y, rip.r * 0.52, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = p.kind === 'cold' ? '#7ecbff' : '#ff6a52';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (dither) dither.render(source, w);
    else {
      const out = output.getContext('2d');
      if (out) out.drawImage(source, 0, 0);
    }

    const progress = sortProgress(particles, wallX);
    if (Math.abs(progress - lastProgress) > 0.008) {
      lastProgress = progress;
      onProgress(progress);
    }
  }

  function loop() {
    if (!running) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  size();
  seed();
  raf = requestAnimationFrame(loop);

  const observer = new ResizeObserver(() => {
    const rect = output.getBoundingClientRect();
    const nextW = Math.max(1, Math.round(rect.width));
    const nextH = Math.max(1, Math.round(rect.height));
    if (nextW === w && nextH === h) return;
    size();
    seed();
  });
  observer.observe(output);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      dither?.destroy();
    },
  };
}

export default function GameBoy() {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(Math.random() < 0.5);
  const [open, setOpen] = useState(openRef.current);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    const source = sourceRef.current;
    const output = outputRef.current;
    if (!source || !output) return;
    const sim = startSim(source, output, () => openRef.current, setProgress);
    return () => sim.destroy();
  }, []);

  function toggle() {
    const next = !openRef.current;
    openRef.current = next;
    setOpen(next);
  }

  const segments = 12;
  const lit = Math.round(progress * segments);

  return (
    <div className="gb">
      <div className="gb-body">
        <div className="gb-title">MAXWELL&apos;S DEMON</div>
        <div className="gb-bezel">
          <div className="gb-screen">
            <canvas ref={sourceRef} className="gb-screen-src" aria-hidden="true" />
            <canvas ref={outputRef} className="gb-screen-out" key="lcd-alpha" />
          </div>
        </div>
        <div
          className="gb-meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Sort progress"
        >
          {Array.from({ length: segments }, (_, i) => (
            <span key={i} className={`gb-meter-seg${i < lit ? ' is-on' : ''}`} />
          ))}
        </div>
        <button
          type="button"
          className={`gb-switch${open ? ' is-open' : ''}`}
          role="switch"
          aria-checked={open}
          aria-label={open ? 'Close gate' : 'Open gate'}
          onClick={toggle}
        >
          <span className="gb-switch-plate">
            <span className="gb-switch-well">
              <span className="gb-switch-paddle">
                <span className="gb-switch-face" />
                <span className="gb-switch-face" />
              </span>
            </span>
          </span>
          <span className="gb-switch-caption">
            <span>CLOSED</span>
            <span>GATE</span>
            <span>OPEN</span>
          </span>
        </button>
      </div>
    </div>
  );
}
