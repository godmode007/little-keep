/**
 * Records first-level playtest videos against Expo web (localhost:8081).
 * Run: npx --yes playwright@1.49.1 test is not used; this is a standalone script.
 *   node qa/record-first-level.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa', 'videos');
const rawDir = join(outDir, 'raw');
mkdirSync(rawDir, { recursive: true });

const BASE = process.env.KEEP_URL || 'http://localhost:8081';
const pause = (page, ms = 900) => page.waitForTimeout(ms);

async function tapText(page, text) {
  const loc = page.getByText(text, { exact: true }).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  await loc.tap();
}

async function tapLabel(page, name) {
  const loc = page.getByLabel(name, { exact: true }).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  await loc.tap();
}

async function withVideo(fileStem, play) {
  const framesDir = join(rawDir, fileStem);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: process.env.KEEP_CHROME || 'chrome',
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  let n = 0;
  client.on('Page.screencastFrame', async (event) => {
    const i = String(n).padStart(4, '0');
    n += 1;
    writeFileSync(join(framesDir, `f${i}.jpg`), Buffer.from(event.data, 'base64'));
    try {
      await client.send('Page.screencastFrameAck', { sessionId: event.sessionId });
    } catch {
      /* page closed */
    }
  });
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 70,
    maxWidth: 390,
    maxHeight: 844,
    everyNthFrame: 1,
  });
  try {
    await play(page);
    await pause(page, 1200);
  } finally {
    try {
      await client.send('Page.stopScreencast');
    } catch {
      /* ignore */
    }
    await page.close();
    await context.close();
    await browser.close();
  }
  if (n < 8) throw new Error(`${fileStem}: only captured ${n} frames`);
  const mp4 = join(outDir, `${fileStem}.mp4`);
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      '8',
      '-i',
      join(framesDir, 'f%04d.jpg'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      mp4,
    ],
    { stdio: 'inherit' }
  );
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${fileStem}`);
  console.log('wrote', mp4, `(${n} frames)`);
}

async function startGame(page, name) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText('Little Keep').first().waitFor({ timeout: 30000 });
  await pause(page, 800);
  const box = page.getByPlaceholder('Sam');
  await box.waitFor({ timeout: 15000 });
  await box.fill(name);
  await pause(page, 600);
  await tapText(page, 'Start Playing!');
  await page.getByLabel('Little Keep field').waitFor({ timeout: 20000 });
  await pause(page, 1000);
}

async function closeSheet(page) {
  await tapText(page, 'Close');
  await pause(page, 500);
}

async function firstLevel(page) {
  await startGame(page, 'Sam');
  await tapLabel(page, 'Farm');
  await pause(page, 1400);
  await tapLabel(page, 'Pip');
  await pause(page, 1200);
  await closeSheet(page);
  await tapLabel(page, 'Deeper woods');
  await pause(page, 1400);
  await closeSheet(page);
  await tapLabel(page, 'Misty woods');
  await pause(page, 1000);
  await tapText(page, 'Clear the woods');
  await pause(page, 1600);
  await tapLabel(page, 'Watch tower');
  await pause(page, 1200);
  await closeSheet(page);
  await tapLabel(page, 'Quest flag');
  await pause(page, 1000);
  await tapText(page, 'Go Adventure');
  await pause(page, 1800);
  await tapLabel(page, 'Quest flag');
  await pause(page, 1600);
  await closeSheet(page);
}

async function fogChain(page) {
  await startGame(page, 'Ryn');
  await tapLabel(page, 'Deeper woods');
  await pause(page, 1400);
  await closeSheet(page);
  await tapLabel(page, 'Misty woods');
  await pause(page, 800);
  await tapText(page, 'Clear the woods');
  await pause(page, 1600);
  await tapLabel(page, 'Farm');
  await pause(page, 1200);
  await page.waitForTimeout(4200);
  await tapLabel(page, 'Forest Hut');
  await pause(page, 1400);
  await tapLabel(page, 'Misty woods');
  await pause(page, 1000);
  await tapText(page, 'Clear the woods');
  await pause(page, 1800);
}

await withVideo('01-first-level', firstLevel);
await withVideo('02-fog-chain', fogChain);
console.log('done');
