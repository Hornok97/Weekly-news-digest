import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = process.env.DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');

export function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getPrevWeekKey() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getWeekKey(d);
}

function ensureRoot() {
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true });
}

export function appendArticles(weekKey, articles) {
  ensureRoot();
  const path = join(ROOT, `articles-${weekKey}.json`);
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
  const existingLinks = new Set(existing.map(a => a.link));
  const fresh = articles.filter(a => !existingLinks.has(a.link));

  if (fresh.length === 0) return 0;

  writeFileSync(path, JSON.stringify([...existing, ...fresh], null, 2));
  return fresh.length;
}

export function loadArticles(weekKey) {
  const path = join(ROOT, `articles-${weekKey}.json`);
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function saveDigest(weekKey, html) {
  ensureRoot();
  writeFileSync(join(ROOT, `digest-${weekKey}.html`), html);
}

export function loadDigest(weekKey) {
  const path = join(ROOT, `digest-${weekKey}.html`);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8');
}

export function listWeekKeys() {
  if (!existsSync(ROOT)) return [];
  return readdirSync(ROOT)
    .filter(f => f.startsWith('articles-') && f.endsWith('.json'))
    .map(f => f.replace('articles-', '').replace('.json', ''))
    .sort()
    .reverse();
}
