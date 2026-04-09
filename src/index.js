import 'dotenv/config';
import cron from 'node-cron';
import { scrapeIdnes } from './scrapers/idnes.js';
import { scrapeExtra } from './scrapers/extra.js';
import { summarizeArticles } from './ai/summarize.js';
import { appendArticles, loadArticles, saveDigest, getWeekKey, getPrevWeekKey } from './storage/store.js';
import { buildSite } from '../scripts/build-site.js';

async function runDailyScrape() {
  const weekKey = getWeekKey();
  console.log(`[${new Date().toISOString()}] Daily scrape - week ${weekKey}`);

  try {
    const existing = loadArticles(weekKey);
    const knownLinks = new Set(existing.filter(a => a.source === 'Extra.cz').map(a => a.link));

    const [idnes, extra] = await Promise.all([scrapeIdnes(), scrapeExtra(knownLinks)]);
    const newIdnes = appendArticles(weekKey, idnes);
    const newExtra = appendArticles(weekKey, extra);
    console.log(`  +${newIdnes} iDnes, +${newExtra} Extra.cz`);
  } catch (err) {
    console.error('Daily scrape failed:', err);
    process.exit(1);
  }
}

async function runWeeklyDigest() {
  const weekKey = getPrevWeekKey();
  console.log(`[${new Date().toISOString()}] Weekly digest - ${weekKey}`);

  try {
    const articles = loadArticles(weekKey);
    const idnesArticles = articles.filter(a => a.source === 'iDnes');
    const extraArticles = articles.filter(a => a.source === 'Extra.cz');

    console.log(`  iDnes: ${idnesArticles.length}, Extra.cz: ${extraArticles.length}`);

    if (idnesArticles.length === 0 && extraArticles.length === 0) {
      console.warn('No articles for previous week, skipping digest.');
      return;
    }

    const summary = await summarizeArticles(idnesArticles, extraArticles);
    saveDigest(weekKey, summary);
    console.log(`  Digest saved for ${weekKey}`);

    buildSite();
    console.log('  Site built.');
  } catch (err) {
    console.error('Weekly digest failed:', err);
    process.exit(1);
  }
}

const arg = process.argv[2];

if (arg === '--scrape') {
  await runDailyScrape();
} else if (arg === '--digest') {
  await runWeeklyDigest();
} else if (arg === '--build') {
  buildSite();
} else {
  cron.schedule('0 8 * * *', runDailyScrape, { timezone: 'Europe/Prague' });
  cron.schedule('0 9 * * 1', runWeeklyDigest, { timezone: 'Europe/Prague' });
  console.log('Scheduler running. Daily scrape at 08:00, digest every Monday at 09:00.');
}
