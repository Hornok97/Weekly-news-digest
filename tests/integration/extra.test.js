import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrapeExtra } from '../../src/scrapers/extra.js';

test('scrapeExtra returns a non-empty array', { timeout: 60000 }, async () => {
  const articles = await scrapeExtra();
  assert.ok(Array.isArray(articles), 'result should be an array');
  assert.ok(articles.length > 0, 'should return at least one article');
});

test('scrapeExtra articles have required fields', { timeout: 60000 }, async () => {
  const articles = await scrapeExtra();
  for (const a of articles) {
    assert.equal(a.source, 'Extra.cz', `source should be "Extra.cz", got "${a.source}"`);
    assert.ok(typeof a.title === 'string' && a.title.length >= 10, `title should be at least 10 chars, got "${a.title}"`);
    assert.ok(typeof a.link === 'string' && a.link.includes('extra.cz'), `link should point to extra.cz, got "${a.link}"`);
    assert.ok(typeof a.description === 'string', 'description should be a string');
  }
});

test('scrapeExtra skips already-known links', { timeout: 60000 }, async () => {
  const first = await scrapeExtra();
  assert.ok(first.length > 0, 'first scrape should return articles');

  const knownLinks = new Set(first.map(a => a.link));
  const second = await scrapeExtra(knownLinks);
  assert.equal(second.length, 0, 'second scrape with all known links should return 0 new articles');
});
