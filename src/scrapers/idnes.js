import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const RSS_URL = 'https://servis.idnes.cz/rss.asp?c=zpravy';

export async function scrapeIdnes() {
  const response = await axios.get(RSS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsDigestBot/1.0)' },
    timeout: 10000,
  });

  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(response.data);
  const items = result?.rss?.channel?.item ?? [];

  return items
    .filter(item => !isNaN(new Date(item.pubDate)))
    .map(item => ({
      source: 'iDnes',
      title: item.title?.trim() ?? '',
      description: item.description?.trim() ?? '',
      link: item.link ?? '',
      pubDate: item.pubDate ?? '',
    }));
}
