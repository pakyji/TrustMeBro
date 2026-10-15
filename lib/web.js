// Read-only lookups on public APIs. Each function returns plain data or throws an Error
// with a message that can be shown to the user. None of them need an API key.
const TIMEOUT_MS = 10000;
const HEADERS = { 'user-agent': 'TrustMeBro/1.0', accept: 'application/json' };

async function getJson(url, fetchImpl = fetch) {
    const res = await fetchImpl(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`The service returned HTTP ${res.status}. Try again later.`);
    return res.json();
}

const WEATHER_CODES = [
    [[0], 'Clear sky'], [[1, 2, 3], 'Partly cloudy'], [[45, 48], 'Fog'],
    [[51, 53, 55, 56, 57], 'Drizzle'], [[61, 63, 65, 66, 67], 'Rain'],
    [[71, 73, 75, 77], 'Snow'], [[80, 81, 82], 'Rain showers'],
    [[85, 86], 'Snow showers'], [[95, 96, 99], 'Thunderstorm'],
];

function describeWeatherCode(code) {
    const hit = WEATHER_CODES.find(([codes]) => codes.includes(code));
    return hit ? hit[1] : 'Unknown';
}

async function getWeather(city, fetchImpl) {
    const name = String(city || '').trim().slice(0, 80);
    if (!name) throw new Error('Give a city name.');
    const geo = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`, fetchImpl);
    const place = geo.results && geo.results[0];
    if (!place) throw new Error(`No city found for "${name}".`);
    const fc = await getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`,
        fetchImpl,
    );
    const w = fc.current_weather;
    return {
        place: [place.name, place.country_code].filter(Boolean).join(', '),
        temperature: w.temperature,
        windspeed: w.windspeed,
        condition: describeWeatherCode(w.weathercode),
    };
}

/** Next public holidays in Italy (or another country code) from today. */
async function getHolidays(year, country = 'IT', fetchImpl) {
    const list = await getJson(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, fetchImpl);
    const today = new Date().toISOString().slice(0, 10);
    return list.filter(h => h.date >= today).slice(0, 5).map(h => ({ date: h.date, name: h.name, local: h.localName }));
}

// CoinPaprika ids for common coins. Other symbols are not supported, so the lookup stays accurate.
const COIN_IDS = {
    btc: 'btc-bitcoin', eth: 'eth-ethereum', sol: 'sol-solana', xrp: 'xrp-xrp',
    ada: 'ada-cardano', doge: 'doge-dogecoin', bnb: 'bnb-binance-coin', ltc: 'ltc-litecoin',
};

async function getCrypto(symbol, fetchImpl) {
    const key = String(symbol || '').trim().toLowerCase();
    const id = COIN_IDS[key];
    if (!id) throw new Error(`Supported coins: ${Object.keys(COIN_IDS).join(', ')}.`);
    const t = await getJson(`https://api.coinpaprika.com/v1/tickers/${id}`, fetchImpl);
    const usd = t.quotes && t.quotes.USD;
    if (!usd) throw new Error('No price available right now.');
    return { name: t.name, symbol: t.symbol, price: usd.price, change24h: usd.percent_change_24h };
}

async function searchBooks(query, fetchImpl) {
    const q = String(query || '').trim().slice(0, 100);
    if (!q) throw new Error('Give a book title or author.');
    const data = await getJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`, fetchImpl);
    return (data.docs || []).slice(0, 3).map(d => ({
        title: d.title,
        author: (d.author_name || ['Unknown'])[0],
        year: d.first_publish_year || null,
        link: d.key ? `https://openlibrary.org${d.key}` : null,
    }));
}

async function searchArtworks(query, fetchImpl) {
    const q = String(query || '').trim().slice(0, 100);
    if (!q) throw new Error('Give an artwork or artist name.');
    const data = await getJson(
        `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&limit=3&fields=id,title,artist_display,date_display`,
        fetchImpl,
    );
    return (data.data || []).slice(0, 3).map(a => ({
        title: a.title,
        artist: a.artist_display || 'Unknown',
        date: a.date_display || '',
        link: `https://www.artic.edu/artworks/${a.id}`,
    }));
}

async function wikiSummary(title, fetchImpl) {
    const t = String(title || '').trim().slice(0, 100);
    if (!t) throw new Error('Give a topic.');
    const data = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t.replace(/ /g, '_'))}`, fetchImpl);
    if (data.type === 'disambiguation' || !data.extract) throw new Error(`No clear article for "${t}". Try a more exact name.`);
    return { title: data.title, extract: data.extract, link: data.content_urls && data.content_urls.desktop.page };
}

async function defineWord(word, fetchImpl) {
    const w = String(word || '').trim().slice(0, 50);
    if (!/^[\p{L}'-]+$/u.test(w)) throw new Error('Give a single English word.');
    const data = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`, fetchImpl);
    const entry = Array.isArray(data) ? data[0] : null;
    const meaning = entry && entry.meanings && entry.meanings[0];
    const def = meaning && meaning.definitions && meaning.definitions[0];
    if (!def) throw new Error(`No definition found for "${w}".`);
    return { word: entry.word, partOfSpeech: meaning.partOfSpeech, definition: def.definition };
}

/** Converts an amount between two currencies using ECB rates (via frankfurter.app). */
async function convertCurrency(amount, from, to, fetchImpl) {
    const f = String(from || '').toUpperCase();
    const t = String(to || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(f) || !/^[A-Z]{3}$/.test(t)) throw new Error('Use 3-letter currency codes, like EUR or USD.');
    if (!(amount > 0) || amount > 1e12) throw new Error('Enter an amount above 0.');
    const data = await getJson(`https://api.frankfurter.app/latest?amount=${amount}&from=${f}&to=${t}`, fetchImpl);
    const value = data.rates && data.rates[t];
    if (value === undefined) throw new Error(`Currency ${t} is not supported.`);
    return { amount, from: f, to: t, value, date: data.date };
}

async function randomPerson(fetchImpl) {
    const data = await getJson('https://randomuser.me/api/', fetchImpl);
    const p = data.results[0];
    return {
        name: `${p.name.first} ${p.name.last}`,
        city: p.location.city,
        country: p.location.country,
        age: p.dob.age,
        picture: p.picture.large,
    };
}

module.exports = {
    getWeather,
    getHolidays,
    getCrypto,
    searchBooks,
    searchArtworks,
    wikiSummary,
    defineWord,
    convertCurrency,
    randomPerson,
    describeWeatherCode,
};
