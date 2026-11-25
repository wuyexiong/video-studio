#!/usr/bin/env node
/**
 * Universal 60fps Retina Chrome Dynamic Web Capture for video-studio.
 * Uses local /Applications/Google Chrome.app + /opt/homebrew/bin/ffmpeg (zero Chromium download).
 *
 * Usage:
 *   node capture_web.mjs --spec capture_spec.json
 *
 * Spec JSON schema:
 * {
 *   "url": "https://... or file:///...",
 *   "output": "/abs/path/to/clip.mp4",
 *   "durationSec": 4.5,
 *   "fps": 60,
 *   "viewport": { "width": 1280, "height": 800 },
 *   "startScrollY": 0,
 *   "endScrollY": 900,
 *   "sliderActions": [
 *     { "selector": "#simUv", "from": 3000, "to": 22000, "step": 500, "startRatio": 0.45, "endRatio": 0.85 }
 *   ],
 *   "clickSelectors": [
 *     { "selector": "#tab-pricing", "atRatio": 0.35 }
 *   ]
 * }
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const RUNTIME_DIR = path.resolve(import.meta.dirname, '../runtime');
const requireFromRuntime = createRequire(path.join(RUNTIME_DIR, 'package.json'));
const { chromium } = requireFromRuntime('playwright-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';

const specIdx = process.argv.indexOf('--spec');
if (specIdx === -1 || !process.argv[specIdx + 1]) {
  console.error('Usage: node capture_web.mjs --spec <spec.json>');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(process.argv[specIdx + 1], 'utf-8'));
const fps = spec.fps || 60;
const durationSec = spec.durationSec || 4.5;
const totalFrames = Math.max(30, Math.round(durationSec * fps));
const width = spec.viewport?.width || 1280;
const height = spec.viewport?.height || 800;
const startY = Number(spec.startScrollY ?? 0);
const endY = Number(spec.endScrollY ?? 720);
const outMp4 = path.resolve(spec.output);

const tmpDir = `/tmp/vstudio_cap_${Date.now()}`;
fs.mkdirSync(tmpDir, { recursive: true });

function easeInOutCubic(p) {
  const c = Math.max(0, Math.min(1, p));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--font-render-hinting=none', '--force-color-profile=srgb'],
});

const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
});

const page = await context.newPage();
await page.goto(spec.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(spec.initialWaitMs ?? 350);

const clicked = new Set();
const sliders = Array.isArray(spec.sliderActions) ? spec.sliderActions : [];
const clicks = Array.isArray(spec.clickSelectors) ? spec.clickSelectors : [];

for (let f = 0; f < totalFrames; f++) {
  const ratio = f / Math.max(1, totalFrames - 1);

  // Execute scheduled clicks
  for (let i = 0; i < clicks.length; i++) {
    if (!clicked.has(i) && ratio >= (clicks[i].atRatio ?? 0.3)) {
      clicked.add(i);
      await page.click(clicks[i].selector).catch(() => {});
    }
  }

  // Smooth scroll between startRatio (default 0.08) and endRatio (default 0.65 if sliders exist, else 0.90)
  const scrollStartR = spec.scrollStartRatio ?? 0.08;
  const scrollEndR = spec.scrollEndRatio ?? (sliders.length > 0 ? 0.55 : 0.88);
  if (ratio <= scrollStartR) {
    await page.evaluate((y) => window.scrollTo(0, y), startY);
  } else if (ratio <= scrollEndR) {
    const sp = easeInOutCubic((ratio - scrollStartR) / Math.max(0.01, scrollEndR - scrollStartR));
    await page.evaluate((y) => window.scrollTo(0, y), startY + (endY - startY) * sp);
  }

  // Execute live slider drags
  for (const sl of sliders) {
    const r0 = sl.startRatio ?? 0.56;
    const r1 = sl.endRatio ?? 0.92;
    if (ratio >= r0 && ratio <= r1) {
      const sp = easeInOutCubic((ratio - r0) / Math.max(0.01, r1 - r0));
      let val = sl.from + (sl.to - sl.from) * sp;
      if (sl.step) val = Math.round(val / sl.step) * sl.step;
      await page.evaluate(
        ({ selector, value }) => {
          const el = document.querySelector(selector);
          if (el) {
            el.value = String(value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        },
        { selector: sl.selector, value: val }
      );
    }
  }

  const jpg = path.join(tmpDir, `f_${String(f).padStart(5, '0')}.jpg`);
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 92 });
}

await context.close();
await browser.close();

fs.mkdirSync(path.dirname(outMp4), { recursive: true });
execFileSync(FFMPEG_PATH, [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(fps),
  '-i', path.join(tmpDir, 'f_%05d.jpg'),
  '-vf', `scale=${width}:${height}:flags=lanczos`,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p',
  outMp4,
]);

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`Captured 60fps stream (${totalFrames} frames -> ${outMp4})`);
