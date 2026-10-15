const test = require('node:test');
const assert = require('node:assert/strict');
const { searchSong, isHost } = require('../lib/search');

// Returns responses in order. Each response is { url-substring: body } matched by the URL.
function fakeFetch(routes) {
    const calls = [];
    const fn = async (url) => {
        const u = String(url);
        calls.push(u);
        const route = routes.find(r => u.includes(r.match));
        const body = route ? route.body : { data: [] };
        return { ok: route ? route.ok !== false : true, status: route && route.ok === false ? 500 : 200, json: async () => body };
    };
    fn.calls = calls;
    return fn;
}

const audiusHit = { data: [{ id: 'K9EO2', title: 'Sunrise Series', user: { name: 'Vincent' }, duration: 4752, is_streamable: true }] };

test('Audius result is used first and gives a stream URL', async () => {
    const f = fakeFetch([{ match: 'api.audius.co/v1/tracks/search', body: audiusHit }]);
    const hit = await searchSong('sunrise', { fetchImpl: f });
    assert.equal(hit.source, 'Audius');
    assert.equal(hit.artist, 'Vincent');
    assert.match(hit.audioUrl, /api\.audius\.co\/v1\/tracks\/K9EO2\/stream\?app_name=TrustMeBro/);
    assert.equal(f.calls.length, 1, 'Internet Archive must not be called when Audius has a result');
});

test('falls back to Internet Archive and picks an MP3 file', async () => {
    const f = fakeFetch([
        { match: 'api.audius.co', body: { data: [] } },
        { match: 'advancedsearch.php', body: { response: { docs: [{ identifier: 'my-item', title: 'Old Song', creator: 'Someone' }] } } },
        { match: 'archive.org/metadata/my-item', body: { files: [{ name: 'song.flac', format: 'Flac' }, { name: 'Old Song.mp3', format: 'VBR MP3' }] } },
    ]);
    const hit = await searchSong('old song', { fetchImpl: f });
    assert.equal(hit.source, 'Internet Archive');
    assert.equal(hit.title, 'Old Song');
    assert.equal(hit.audioUrl, 'https://archive.org/download/my-item/Old%20Song.mp3');
});

test('Internet Archive query strips Lucene syntax characters', async () => {
    const f = fakeFetch([{ match: 'api.audius.co', body: { data: [] } }, { match: 'advancedsearch.php', body: { response: { docs: [] } } }]);
    await assert.rejects(searchSong('a:b (c) "d"', { fetchImpl: f }), /No song found/);
    const archiveCall = new URL(f.calls.find(c => c.includes('advancedsearch')));
    assert.equal(archiveCall.searchParams.get('q'), 'mediatype:audio AND title:(a b c d)');
});

test('clear message when nothing is found anywhere', async () => {
    const f = fakeFetch([{ match: 'api.audius.co', body: { data: [] } }, { match: 'advancedsearch.php', body: { response: { docs: [] } } }]);
    await assert.rejects(searchSong('zzzz', { fetchImpl: f }), /No song found for "zzzz"/);
});

test('a failing source does not break the search', async () => {
    const f = fakeFetch([
        { match: 'api.audius.co', ok: false },
        { match: 'advancedsearch.php', body: { response: { docs: [{ identifier: 'x1', title: 'X', creator: 'Y' }] } } },
        { match: 'archive.org/metadata/x1', body: { files: [{ name: 'x.mp3', format: 'MP3' }] } },
    ]);
    const hit = await searchSong('x', { fetchImpl: f });
    assert.equal(hit.source, 'Internet Archive');
});

test('empty query is rejected', async () => {
    await assert.rejects(searchSong('   ', { fetchImpl: fakeFetch([]) }), /Please type a song name/);
});

test('isHost accepts only https links on the listed hosts', () => {
    assert.equal(isHost('https://api.audius.co/v1/x', ['api.audius.co']), true);
    assert.equal(isHost('https://archive.org/download/a/b.mp3', ['archive.org']), true);
    assert.equal(isHost('http://archive.org/download/a/b.mp3', ['archive.org']), false);
    assert.equal(isHost('https://archive.org.evil.net/x', ['archive.org']), false);
    assert.equal(isHost('nonsense', ['archive.org']), false);
});
