import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeArticles(idnesArticles, extraArticles) {
  const formatList = (articles) =>
    articles.map((a, i) => {
      const desc = a.description ? `\n   Perex: ${a.description}` : '';
      return `${i + 1}. ${a.title}${desc}`;
    }).join('\n');

  const prompt = `Jsi redaktor tydenniho zpravodajskeho digestu. Nize jsou clanky z minuleho tydne.

== iDnes – zpravy (${idnesArticles.length} clanku) ==
${formatList(idnesArticles)}

== Extra.cz – bulvar (${extraArticles.length} clanku) ==
${formatList(extraArticles)}

Ukol:
1. Z iDnes vyber 5-8 nejdulezitejsich zprav. Kazdou shrn do 1-2 vet. Rad od nejdulezitejsi.
2. Z Extra.cz vyber 4-5 nejzajimavejsich bulvarnich zprav. Kazdou shrn do 1 vety.
3. Pis cesky, neutralne, strucne.
4. Vystup formatuj jako HTML vhodne pro email (pouzij <h2>, <ul>, <li>, <b>).

Struktura vystupu:
<h2>Zpravy tydne – iDnes</h2>
<ul>
  <li><b>Nazev tematu:</b> strucne shrnuti...</li>
</ul>

<h2>Bulvar tydne – Extra.cz</h2>
<ul>
  <li><b>Jmeno/tema:</b> strucne shrnuti...</li>
</ul>`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return response.text;
}
