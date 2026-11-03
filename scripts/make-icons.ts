// Renders public/icon.svg to the PNG icons the web app manifest and iPhones need. Run with
// `node scripts/make-icons.ts` after changing the SVG; the PNGs are committed.

import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icon.svg', 'utf8');
/** Name, size, and how much of the square the drawing fills (maskable icons need margin). */
const ICONS: [string, number, number][] = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 1],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, scale] of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * scale);
  await page.setContent(
    `<body style="margin:0;background:#2d6a4f;display:grid;place-items:center;height:${size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </body>`,
  );
  await page.screenshot({ path: `public/${name}`, omitBackground: false });
}
await browser.close();
