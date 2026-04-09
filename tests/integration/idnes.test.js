import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrapeIdnes } from '../../src/scrapers/idnes.js';

test('scrapeIdnes returns a non-empty array', { timeout: 15000 }, async () => {
  const articles = await scrapeIdnes();
  assert.ok(Array.isArray(articles), 'result should be an array');
  assert.ok(articles.length > 0, 'should return at least one article');
});

test('scrapeIdnes articles have required fields', { timeout: 15000 }, async () => {
  const articles = await scrapeIdnes();
  for (const a of articles) {
    assert.equal(a.source, 'iDnes', `source should be "iDnes", got "${a.source}"`);
    assert.ok(typeof a.title === 'string' && a.title.length > 0, `title should be non-empty string`);
    assert.ok(typeof a.link === 'string' && a.link.startsWith('http'), `link should be a URL, got "${a.link}"`);
    assert.ok(typeof a.description === 'string', 'description should be a string');
    assert.ok(typeof a.pubDate === 'string' && a.pubDate.length > 0, 'pubDate should exist');
  }
});

test('scrapeIdnes articles have parseable dates', { timeout: 15000 }, async () => {
  const articles = await scrapeIdnes();
  for (const a of articles) {
    const d = new Date(a.pubDate);
    assert.ok(!isNaN(d.getTime()), `pubDate "${a.pubDate}" should be a valid date`);
  }
});
