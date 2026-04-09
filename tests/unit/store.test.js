import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tmpDir = mkdtempSync(join(tmpdir(), 'digest-test-'));
process.env.DATA_DIR = tmpDir;

const { getWeekKey, appendArticles, loadArticles } = await import('../../src/storage/store.js');

after(() => rmSync(tmpDir, { recursive: true, force: true }));

test('getWeekKey - standard Thursday in W15', () => {
  assert.equal(getWeekKey(new Date('2026-04-09')), '2026-W15');
});

test('getWeekKey - Monday starts the same week', () => {
  assert.equal(getWeekKey(new Date('2026-04-06')), '2026-W15');
});

test('getWeekKey - Sunday ends the same week', () => {
  assert.equal(getWeekKey(new Date('2026-04-12')), '2026-W15');
});

test('getWeekKey - Dec 29 2025 is ISO week 2026-W01', () => {
  assert.equal(getWeekKey(new Date('2025-12-29')), '2026-W01');
});

test('getWeekKey - Jan 1 2024 is 2024-W01', () => {
  assert.equal(getWeekKey(new Date('2024-01-01')), '2024-W01');
});

test('appendArticles - returns count of new articles', () => {
  const weekKey = '2099-W01';
  const articles = [
    { source: 'iDnes', title: 'Test Article', description: '', link: 'https://idnes.cz/test/1', pubDate: '2026-04-09' },
    { source: 'iDnes', title: 'Test Article 2', description: '', link: 'https://idnes.cz/test/2', pubDate: '2026-04-09' },
  ];
  const added = appendArticles(weekKey, articles);
  assert.equal(added, 2);
});

test('appendArticles - deduplicates by link', () => {
  const weekKey = '2099-W02';
  const articles = [
    { source: 'iDnes', title: 'Unique', description: '', link: 'https://idnes.cz/dedup/1', pubDate: '2026-04-09' },
  ];
  appendArticles(weekKey, articles);
  const addedAgain = appendArticles(weekKey, articles);
  assert.equal(addedAgain, 0);
});

test('appendArticles - loaded data matches what was written', () => {
  const weekKey = '2099-W03';
  const articles = [
    { source: 'Extra.cz', title: 'Bulvar titulek nejake novinky', description: '', link: 'https://extra.cz/clanek-abc-1a2b3c', pubDate: '2026-04-09' },
  ];
  appendArticles(weekKey, articles);
  const loaded = loadArticles(weekKey);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].title, articles[0].title);
  assert.equal(loaded[0].link, articles[0].link);
  assert.equal(loaded[0].source, 'Extra.cz');
});

test('loadArticles - returns empty array for nonexistent week', () => {
  const result = loadArticles('2099-W99');
  assert.deepEqual(result, []);
});

test('appendArticles - merges new articles with existing ones', () => {
  const weekKey = '2099-W04';
  const first = [{ source: 'iDnes', title: 'First', description: '', link: 'https://idnes.cz/merge/1', pubDate: '2026-04-07' }];
  const second = [{ source: 'iDnes', title: 'Second', description: '', link: 'https://idnes.cz/merge/2', pubDate: '2026-04-08' }];
  appendArticles(weekKey, first);
  appendArticles(weekKey, second);
  const loaded = loadArticles(weekKey);
  assert.equal(loaded.length, 2);
});
