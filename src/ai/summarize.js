import Groq from 'groq-sdk';

let client = null;

function getClient() {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

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
3. Pis POUZE cesky. Nikdy nepouzivej jina pismena nez ceska latinka. Zadna ruska, arabska ani jina pisma.
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

  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
  });

  return response.choices[0].message.content;
}
