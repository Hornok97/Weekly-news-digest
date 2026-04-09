import 'dotenv/config';
import { writeFileSync } from 'fs';
import { loadArticles, getWeekKey, getPrevWeekKey } from '../src/storage/store.js';

const weekArg = process.argv[3];
const weekKey = weekArg === 'prev' ? getPrevWeekKey() : getWeekKey();

const articles = loadArticles(weekKey);
const idnes = articles.filter(a => a.source === 'iDnes');
const extra = articles.filter(a => a.source === 'Extra.cz');

console.log(`Week: ${weekKey} | iDnes: ${idnes.length} | Extra.cz: ${extra.length}`);

const idnesRows = idnes.map(a => `
  <tr>
    <td><a href="${a.link}" target="_blank">${a.title}</a></td>
    <td>${a.description ? a.description.slice(0, 150) + '...' : ''}</td>
    <td style="white-space:nowrap;color:#888">${a.pubDate ? new Date(a.pubDate).toLocaleString('cs-CZ') : ''}</td>
  </tr>`).join('');

const extraRows = extra.map(a => `
  <tr>
    <td><a href="${a.link}" target="_blank">${a.title}</a></td>
    <td style="white-space:nowrap;color:#888">${a.pubDate ? new Date(a.pubDate).toLocaleString('cs-CZ') : ''}</td>
  </tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Scraper output – ${weekKey}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1100px; margin: 30px auto; color: #222; }
    h1 { font-size: 22px; }
    h2 { border-bottom: 3px solid #1a73e8; padding-bottom: 6px; color: #1a73e8; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { background: #1a73e8; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:hover td { background: #f5f8ff; }
    a { color: #1a73e8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .count { font-size: 13px; color: #888; margin-top: -10px; margin-bottom: 12px; }
    .empty { color: #c00; font-style: italic; }
  </style>
</head>
<body>
  <h1>Scraper output – week ${weekKey}</h1>
  <p style="color:#888">Generated: ${new Date().toLocaleString('cs-CZ')}</p>

  <h2>iDnes</h2>
  <p class="count">${idnes.length} articles</p>
  ${idnes.length === 0
    ? '<p class="empty">No articles. Run: node src/index.js --scrape</p>'
    : `<table>
    <tr><th>Title</th><th>Perex</th><th>Date</th></tr>
    ${idnesRows}
  </table>`}

  <h2>Extra.cz</h2>
  <p class="count">${extra.length} articles</p>
  ${extra.length === 0
    ? '<p class="empty">No articles. Run: node src/index.js --scrape</p>'
    : `<table>
    <tr><th>Title</th><th>Date</th></tr>
    ${extraRows}
  </table>`}
</body>
</html>`;

writeFileSync('output.html', html);
console.log('Saved to output.html');
