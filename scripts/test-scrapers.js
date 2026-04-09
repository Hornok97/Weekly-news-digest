import 'dotenv/config';
import { scrapeIdnes } from '../src/scrapers/idnes.js';
import { scrapeExtra } from '../src/scrapers/extra.js';

console.log('=== iDnes ===');
const idnes = await scrapeIdnes();
console.log(`Total: ${idnes.length}\n`);
idnes.forEach((a, i) => {
  console.log(`${i + 1}. ${a.title}`);
  if (a.description) console.log(`   ${a.description.slice(0, 120)}...`);
  console.log(`   ${a.pubDate}`);
});

console.log('\n=== Extra.cz ===');
const extra = await scrapeExtra();
console.log(`Total: ${extra.length}\n`);
extra.forEach((a, i) => {
  console.log(`${i + 1}. ${a.title}`);
  console.log(`   ${a.pubDate}`);
  console.log(`   ${a.link}`);
});
