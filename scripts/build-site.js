import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listWeekKeys, loadArticles, loadDigest } from '../src/storage/store.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const WEEKS_DIR = join(DOCS, 'weeks');

function weekLabel(weekKey) {
  const [year, week] = weekKey.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = d => d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, Arial, sans-serif; background: #f5f7fa; color: #222; line-height: 1.6; }
  .container { max-width: 780px; margin: 0 auto; padding: 32px 20px; }
  header { border-bottom: 3px solid #1a73e8; padding-bottom: 16px; margin-bottom: 32px; }
  header h1 { font-size: 22px; color: #1a73e8; }
  header p { font-size: 13px; color: #888; margin-top: 4px; }
  h2 { font-size: 17px; color: #1a73e8; border-bottom: 1px solid #dde3f0; padding-bottom: 6px; margin: 28px 0 12px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
  b { color: #111; }
  a { color: #1a73e8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .week-card { background: white; border: 1px solid #dde3f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
  .week-card:hover { border-color: #1a73e8; }
  .week-card .label { font-weight: 600; }
  .week-card .meta { font-size: 13px; color: #888; margin-top: 3px; }
  .week-card .arrow { color: #1a73e8; font-size: 20px; }
  .no-digest { background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; padding: 12px 16px; font-size: 14px; color: #795548; margin-bottom: 24px; }
  .back { font-size: 14px; margin-bottom: 24px; display: inline-block; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #dde3f0; font-size: 12px; color: #aaa; }
`;

function pageShell(title, body) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="container">
    ${body}
    <footer>Generovano pomoci Groq / Llama 3.3 ze zdroju iDnes.cz a Extra.cz</footer>
  </div>
</body>
</html>`;
}

function buildWeekPage(weekKey) {
  const articles = loadArticles(weekKey);
  const digest = loadDigest(weekKey);
  const label = weekLabel(weekKey);
  const idnesCount = articles.filter(a => a.source === 'iDnes').length;
  const extraCount = articles.filter(a => a.source === 'Extra.cz').length;

  const digestSection = digest
    ? digest
    : `<p class="no-digest">AI souhrn pro tento tyden jeste neni k dispozici.</p>`;

  const body = `
    <header>
      <h1>Tydenni digest</h1>
      <p>Tyden ${weekKey} &mdash; ${label}</p>
    </header>
    <a class="back" href="../index.html">&larr; Vsechny tydny</a>
    ${digestSection}
    <p style="font-size:13px;color:#888;margin-top:32px">
      Zpracovano ${idnesCount} clanku z iDnes a ${extraCount} clanku z Extra.cz.
    </p>`;

  return pageShell(`Digest ${weekKey}`, body);
}

function buildIndex(weekKeys) {
  const cards = weekKeys.map(key => {
    const articles = loadArticles(key);
    const hasDigest = loadDigest(key) !== null;
    const count = articles.length;
    return `
    <a href="weeks/${key}.html" style="text-decoration:none;color:inherit">
      <div class="week-card">
        <div>
          <div class="label">Tyden ${key}</div>
          <div class="meta">${weekLabel(key)} &mdash; ${count} clanku${hasDigest ? '' : ' &mdash; digest se zpracovava'}</div>
        </div>
        <div class="arrow">&#8250;</div>
      </div>
    </a>`;
  }).join('');

  const body = `
    <header>
      <h1>Weekly News Digest</h1>
      <p>Tydenni prehled zprav z iDnes a Extra.cz zpracovany pomoci AI</p>
    </header>
    ${weekKeys.length === 0 ? '<p>Zatim zadna data.</p>' : cards}`;

  return pageShell('Weekly News Digest', body);
}

export function buildSite() {
  if (!existsSync(DOCS)) mkdirSync(DOCS, { recursive: true });
  if (!existsSync(WEEKS_DIR)) mkdirSync(WEEKS_DIR, { recursive: true });

  const weekKeys = listWeekKeys();

  for (const key of weekKeys) {
    writeFileSync(join(WEEKS_DIR, `${key}.html`), buildWeekPage(key));
  }

  writeFileSync(join(DOCS, 'index.html'), buildIndex(weekKeys));
  console.log(`Site built: ${weekKeys.length} week(s) -> docs/`);
}

// Pokud spusten primo: node scripts/build-site.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSite();
}
