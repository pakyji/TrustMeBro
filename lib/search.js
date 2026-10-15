// Song search without any API key.
// 1. Audius: independent artists, full tracks, streamed through the public API.
// 2. Internet Archive: public-domain and Creative Commons audio, as a fallback.
const AUDIUS_APP_NAME = 'TrustMeBro';
const AUDIUS_API = 'https://api.audius.co/v1';
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const ARCHIVE_META = 'https://archive.org/metadata';
const TIMEOUT_MS = 10000;
const MAX_QUERY_LENGTH = 100;
const ARCHIVE_ITEMS_TO_CHECK = 3;

function cleanQuery(text) {
    return String(text || '').trim().slice(0, MAX_QUERY_LENGTH);
}

function isHost(href, hosts) {
    try {
        const url = new URL(href);
        return url.protocol === 'https:' && hosts.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`));
    } catch {
        return false;
    }
}

async function getJson(url, fetchImpl) {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'TrustMeBro-Music/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function searchAudius(term, fetchImpl) {
    const params = new URLSearchParams({ query: term, app_name: AUDIUS_APP_NAME, limit: '5' });
    const data = await getJson(`${AUDIUS_API}/tracks/search?${params}`, fetchImpl);
    const hit = (data.data || []).find(t => t.id && t.is_streamable !== false && t.duration > 0);
    if (!hit) return null;

    const streamParams = new URLSearchParams({ app_name: AUDIUS_APP_NAME });
    return {
        source: 'Audius',
        title: hit.title || 'Untitled',
        artist: (hit.user && hit.user.name) || 'Unknown artist',
        audioUrl: `${AUDIUS_API}/tracks/${encodeURIComponent(hit.id)}/stream?${streamParams}`,
    };
}

// Only these formats are used. Files are picked from each item's file list.
const ARCHIVE_FORMATS = ['VBR MP3', 'MP3'];

async function searchArchive(term, fetchImpl) {
    // Remove characters that have a meaning in Lucene query syntax.
    const safe = term.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!safe) return null;

    const params = new URLSearchParams();
    params.set('q', `mediatype:audio AND title:(${safe})`);
    params.append('fl[]', 'identifier');
    params.append('fl[]', 'title');
    params.append('fl[]', 'creator');
    params.set('rows', String(ARCHIVE_ITEMS_TO_CHECK));
    params.set('output', 'json');

    const search = await getJson(`${ARCHIVE_SEARCH}?${params}`, fetchImpl);
    for (const doc of (search.response?.docs || []).slice(0, ARCHIVE_ITEMS_TO_CHECK)) {
        const meta = await getJson(`${ARCHIVE_META}/${encodeURIComponent(doc.identifier)}`, fetchImpl).catch(() => null);
        const file = (meta?.files || []).find(f => ARCHIVE_FORMATS.includes(f.format));
        if (!file) continue;

        const path = [doc.identifier, file.name].map(encodeURIComponent).join('/');
        const artist = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
        return {
            source: 'Internet Archive',
            title: Array.isArray(doc.title) ? doc.title[0] : (doc.title || file.name),
            artist: artist || 'Unknown artist',
            audioUrl: `https://archive.org/download/${path}`,
        };
    }
    return null;
}

/**
 * Finds a playable song for a name. Returns { source, title, artist, audioUrl }.
 * Throws an Error with a user-facing message when nothing is found.
 */
async function searchSong(text, { fetchImpl = fetch } = {}) {
    const term = cleanQuery(text);
    if (!term) throw new Error('Please type a song name.');

    let hit = null;
    try {
        hit = await searchAudius(term, fetchImpl);
    } catch (error) {
        console.error('Audius search failed:', error.message);
    }
    if (!hit) {
        try {
            hit = await searchArchive(term, fetchImpl);
        } catch (error) {
            console.error('Internet Archive search failed:', error.message);
        }
    }
    if (!hit) throw new Error(`No song found for "${term}". Try another name, or use a direct audio link.`);

    if (!isHost(hit.audioUrl, ['api.audius.co', 'archive.org'])) {
        throw new Error('The search result had an unexpected link.');
    }
    return hit;
}

module.exports = { searchSong, isHost };
