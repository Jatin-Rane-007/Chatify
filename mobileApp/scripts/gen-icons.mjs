// Extracts the Chatify speech-bubble mark (no wordmark) from a composed logo PNG
// and emits transparent, padded square assets for the Android adaptive-icon
// foreground and the notification small-icon.
//
// Usage: node scripts/gen-icons.mjs [--inspect]
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '../assets');
const SRC = path.join(ASSETS, 'images/chatify_logo.png');
const OUT_DIR = path.join(ASSETS, 'AppIcons');

const ALPHA_T = 32; // a pixel counts as "ink" above this alpha
const inspectOnly = process.argv.includes('--inspect');

async function findMarkBBox() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const cornerAlpha = data[3]; // top-left pixel alpha
  const rowInk = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_T) count++;
    }
    rowInk[y] = count;
  }

  const rowHasInk = (y) => rowInk[y] > width * 0.008;
  // First contiguous ink block from the top = the logo mark.
  let top = 0;
  while (top < height && !rowHasInk(top)) top++;
  let bottom = top;
  let gap = 0;
  const gapMax = Math.round(height * 0.03); // a 3%-tall empty band ends the mark
  for (let y = top; y < height; y++) {
    if (rowHasInk(y)) {
      bottom = y;
      gap = 0;
    } else if (++gap > gapMax) {
      break;
    }
  }

  // Column bounds within the mark's row band.
  let left = width;
  let right = 0;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_T) {
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  return { width, height, cornerAlpha, top, bottom, left, right };
}

const bbox = await findMarkBBox();
console.log(JSON.stringify(bbox, null, 2));

if (inspectOnly) process.exit(0);

const { left, top, right, bottom } = bbox;
const cropW = right - left + 1;
const cropH = bottom - top + 1;

async function emit(file, canvas, safeFraction) {
  const inner = Math.round(canvas * safeFraction);
  const mark = await sharp(SRC)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const pad = Math.round((canvas - inner) / 2);
  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, top: pad, left: pad }])
    .png()
    .toFile(path.join(OUT_DIR, file));
  console.log(`wrote ${file} (${canvas}px, mark ${inner}px)`);
}

// Adaptive foreground: mark inside the ~66% safe zone of a 1024 canvas.
await emit('adaptive-foreground.png', 1024, 0.6);
// Notification small-icon: a bit more padding so the silhouette breathes at 24dp.
await emit('notification-icon.png', 512, 0.66);
