import axios from 'axios';
import * as cheerio from 'cheerio';

const NEWS_URL = 'https://www.extra.cz/tema/news/';
const PAGES = 5;
const ARTICLE_PATH_RE = /^\/[a-z0-9]+-[a-z0-9-]+-[a-f0-9]{4,6}$/;
const DELAY_MS = 400;

const http = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'cs-CZ,cs;q=0.9',
  },
  timeout: 10000,
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchArticleDate(url) {
  try {
    const res = await http.get(url);
    const $ = cheerio.load(res.data);
    for (const el of $('script[type="application/ld+json"]').toArray()) {
      try {
        const json = JSON.parse($(el).html());
        const date = json?.datePublished
          ?? json?.['@graph']?.find(n => n.datePublished)?.datePublished;
        if (date) return date;
      } catch {
        // malformed JSON-LD, skip
      }
    }
  } catch {
    // article unavailable
  }
  return null;
}

async function collectCandidates() {
  const seen = new Set();
  const candidates = [];

  for (let page = 1; page <= PAGES; page++) {
    try {
      const res = await http.get(`${NEWS_URL}${page}`);
      const $ = cheerio.load(res.data);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        let path;
        try {
          const url = new URL(href, 'https://www.extra.cz');
          if (url.hostname !== 'www.extra.cz' && url.hostname !== 'extra.cz') return;
          path = url.pathname;
        } catch { return; }

        if (!ARTICLE_PATH_RE.test(path)) return;
        if (seen.has(path)) return;
        seen.add(path);

        const title = $(el).text().trim() || $(el).attr('title')?.trim() || '';
        if (!title || title.length < 10) return;

        candidates.push({ path, title });
      });
    } catch {
      // page unavailable, skip
    }
  }

  return candidates;
}

export async function scrapeExtra(knownLinks = new Set()) {
  const candidates = await collectCandidates();

  const articles = [];
  for (const { path, title } of candidates) {
    const link = `https://www.extra.cz${path}`;

    if (knownLinks.has(link)) continue;

    await sleep(DELAY_MS);
    const pubDate = await fetchArticleDate(link);

    articles.push({
      source: 'Extra.cz',
      title,
      description: '',
      link,
      pubDate: pubDate ?? '',
    });
  }

  return articles;
}
