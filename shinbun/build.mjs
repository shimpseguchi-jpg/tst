// 学級新聞をつくる
//   node shinbun/build.mjs shinbun/issues/2026-09-25.json
// → 同じ場所に .html（画面で見る用）と .pdf（印刷用・A4）と .png（確認用）を書き出す
//   --b4 をつけると B4 の PDF になる（紙面を拡大して刷る）
//   --tate をつけると、たて書きの和風レイアウトで組む（ふだんは英字新聞ふうの横書き）
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const jsonPath = args.find(a => !a.startsWith('--'));
if (!jsonPath) {
  console.error('つかいかた: node shinbun/build.mjs <号のJSON> [--b4] [--tate]');
  process.exit(1);
}
const issue = JSON.parse(readFileSync(jsonPath, 'utf8'));
const b4 = args.includes('--b4');
// 号の JSON に "layout": "tate" と書いてあっても、たて書きで組む
const tate = args.includes('--tate') || issue.layout === 'tate';

const template = readFileSync(path.join(here, tate ? 'template-tate.html' : 'template.html'), 'utf8');
// </script> で JSON が途切れないように < をエスケープしておく
const json = JSON.stringify(issue, null, 2).replace(/</g, '\\u003c');
const plainTitle = String(issue.title || '学級新聞').replace(/\{([^|{}]+)\|[^{}]+\}/g, '$1');
const title = `${plainTitle} 第${issue.issue ?? ''}号`.replace(/[<&]/g, '');
const html = template.replace('__TITLE__', title).replace('__ISSUE_JSON__', () => json);

const base = jsonPath.replace(/\.json$/, '');
writeFileSync(base + '.html', html);
console.log('HTML:', base + '.html');

// PDF は Playwright（Chromium）で刷る。入っていなければ HTML だけで終わる
let chromium;
try {
  const require = createRequire(import.meta.url);
  let mod;
  try { mod = require('playwright'); }
  catch { mod = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
  chromium = mod.chromium;
} catch {
  console.log('Playwright が見つからないため PDF は作りませんでした');
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
// プロキシの内側（クラウドの作業環境など）ではブラウザが Google Fonts に直接つながらないことがあるので、
// そのときは curl で取ってきて渡す
if (process.env.HTTPS_PROXY) {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async route => {
    const req = route.request();
    try {
      const body = execSync(`curl -sS --fail -A ${JSON.stringify(req.headers()['user-agent'] || 'Mozilla/5.0')} ${JSON.stringify(req.url())}`, { maxBuffer: 64 << 20 });
      const type = req.url().includes('googleapis') ? 'text/css' : 'font/woff2';
      await route.fulfill({ body, headers: { 'content-type': type, 'access-control-allow-origin': '*' } });
    } catch { await route.continue(); }
  });
}
await page.setContent('<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>' + html + '</body></html>', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 20000 });

// あふれている記事があれば知らせる（文章をけずる目安）
const report = await page.evaluate(() => [...document.querySelectorAll('[data-fitted]')].map(el => ({
  where: el.closest('[aria-label]')?.getAttribute('aria-label') || el.className,
  size: el.dataset.fitted, overflow: el.dataset.overflow === 'true',
})));
for (const r of report) console.log(`  ${r.overflow ? '⚠ あふれ' : '  ok    '} ${r.where}（${r.size}pt）`);

await page.locator('#page').screenshot({ path: base + '.png' });
console.log('PNG:', base + '.png');

if (b4) await page.addStyleTag({ content: '@page{size:B4 portrait} @media print{.page{zoom:1.2238}}' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: base + '.pdf', preferCSSPageSize: true, printBackground: true });
console.log('PDF:', base + '.pdf', b4 ? '（B4）' : '（A4）');
await browser.close();
