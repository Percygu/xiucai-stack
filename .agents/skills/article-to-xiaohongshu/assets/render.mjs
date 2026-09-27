// 渲染封面 + 内页为 1080x1440 PNG。
// 前置：先 `node serve.mjs &` 起服务器（默认 8788），并用浏览器读到内页分页数。
// 用法： node render.mjs <内页卡数> [封面风格 memo|macaron|random] [淡背景名|random] [端口] [主题 sky|sage|lilac|peach|mint|random]
//   内页卡数：浏览器打开 http://localhost:8788/inner.html 后读 window.__PAGES__（见 SKILL.md）。
// 依赖：本机 Chrome。产物输出到 ./output/。
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = resolve(__dirname, 'output');

const innerCount = Number(process.argv[2] || 0);
const BGS = ['cream','blue','pink','purple','green','yellow','mint','sky'];
const THEMES = ['sky','sage','lilac','peach','mint'];
const THEME_BG = { sky:'sky', sage:'green', lilac:'purple', peach:'pink', mint:'mint' };
const pick = a => a[Math.floor(Math.random()*a.length)];
let style = process.argv[3] || 'random';
let bg    = process.argv[4] || 'random';
const PORT = Number(process.argv[5] || 8788);
let theme = process.argv[6] || 'random';
if (style === 'random') style = pick(['memo','macaron']);
if (theme === 'random') theme = pick(THEMES);
if (!THEMES.includes(theme)) theme = 'sky';
if (bg === 'random')    bg = THEME_BG[theme] || pick(BGS);

if (!existsSync(chrome)) throw new Error('找不到 Chrome：' + chrome);
if (!innerCount) throw new Error('请先传入内页卡数：node render.mjs <count> [style] [bg]（用浏览器读 window.__PAGES__）');

const base = `http://localhost:${PORT}`;
function shot(url, out) {
  const profile = resolve(__dirname, `tmp/cp-${out}`);
  rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
  try {
    execFileSync(chrome, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
      '--no-first-run','--no-default-browser-check','--force-device-scale-factor=1',
      `--user-data-dir=${profile}`, '--window-size=1080,1440', '--virtual-time-budget=20000',
      `--screenshot=${resolve(outputDir, out)}`, url], { stdio: 'pipe', timeout: 45000 });
  } catch (e) { if (!existsSync(resolve(outputDir, out))) { console.error('FAIL', out, e.message); return; } }
  console.log('ok', out);
}

mkdirSync(outputDir, { recursive: true });
shot(`${base}/cover.html?card=${style}&bg=${bg}`, `00-cover-${style}-${bg}.png`);
for (let i = 0; i < innerCount; i++) {
  const out = i === 0 ? '01-origin-doc.png' : `${String(i+1).padStart(2,'0')}-card.png`;
  shot(`${base}/inner.html?theme=${theme}&only=${i}`, out);
}
console.log(`done | 封面风格=${style} 背景=${bg} | 主题=${theme} | 内页 ${innerCount} 张 | 共 ${innerCount+1} 张`);
