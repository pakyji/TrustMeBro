const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Use a temporary store so tests never touch real data.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmb-helpers-'));
process.env.STORE_PATH = path.join(tmpDir, 'store.json');

const tools = require('../lib/tools');
const { TrackQueue } = require('../lib/queue');
const scheduler = require('../lib/scheduler');
const web = require('../lib/web');
const content = require('../lib/content');

test('discordTimestamp uses Rome time with the right DST offset', () => {
    // 2026-12-25 10:00 CET = 09:00 UTC; 2026-07-01 10:00 CEST = 08:00 UTC
    assert.equal(tools.discordTimestamp('2026-12-25', '10:00', 'long'), '<t:1798189200:T>');
    assert.equal(tools.discordTimestamp('2026-07-01', '10:00', 'relative'), '<t:1782892800:R>');
    // DST starts 2026-03-29 at 02:00; 03:30 CEST = 01:30 UTC
    assert.equal(tools.discordTimestamp('2026-03-29', '03:30', 'short'), '<t:1774747800:t>');
});

test('discordTimestamp rejects bad input and unknown styles', () => {
    assert.throws(() => tools.discordTimestamp('2026-13', '10:00', 'long'));
    assert.throws(() => tools.discordTimestamp('2026-12-25', '10:00', 'bogus'), /Style must be one of/);
});

test('safeCalc evaluates arithmetic and rejects code', () => {
    assert.equal(tools.safeCalc('2 + 3 * (4 - 1) ^ 2'), 29);
    assert.equal(tools.safeCalc('2^3^2'), 512);
    assert.throws(() => tools.safeCalc('1/0'), /Division by zero/);
    assert.throws(() => tools.safeCalc('process.exit()'));
});

test('colorInfo accepts hex with or without # and rejects others', () => {
    assert.deepEqual(tools.colorInfo('#ff8800').rgb, [255, 136, 0]);
    assert.equal(tools.colorInfo('ff8800').hex, '#ff8800');
    assert.throws(() => tools.colorInfo('#fff'));
});

test('splitBill computes tip and per-person share', () => {
    const r = tools.splitBill(100, 10, 4);
    assert.equal(r.total, 110);
    assert.equal(r.perPerson, 27.5);
});

test('rollDice stays in range and rejects bad notation', () => {
    for (let i = 0; i < 50; i++) {
        const r = tools.rollDice('2d6');
        assert.ok(r.total >= 2 && r.total <= 12);
    }
    assert.throws(() => tools.rollDice('banana'));
});

test('TrackQueue: add, addFirst, removeAt, clear and shuffle keep the same tracks', () => {
    const q = new TrackQueue();
    ['a', 'b', 'c', 'd'].forEach(t => q.add({ title: t }));
    q.addFirst({ title: 'first' });
    assert.equal(q.list()[0].title, 'first');
    assert.equal(q.removeAt(2).title, 'a');
    assert.equal(q.removeAt(99), null);
    const before = q.list().map(t => t.title).sort().join();
    q.shuffle();
    assert.equal(q.list().map(t => t.title).sort().join(), before);
    q.clear();
    assert.equal(q.size, 0);
});

test('scheduler saves, lists and cancels jobs by owner', () => {
    const a = scheduler.schedule({ type: 'reminder', runAt: Date.now() + 60000, data: { userId: 'u1' } });
    scheduler.schedule({ type: 'reminder', runAt: Date.now() + 60000, data: { userId: 'u2' } });
    const mine = scheduler.listJobs('reminder', j => j.data.userId === 'u1');
    assert.equal(mine.length, 1);
    assert.equal(scheduler.cancelJob(a.id, j => j.data.userId === 'u2'), false, 'other users cannot cancel');
    assert.equal(scheduler.cancelJob(a.id, j => j.data.userId === 'u1'), true);
    assert.equal(scheduler.listJobs('reminder', j => j.data.userId === 'u1').length, 0);
});

test('web lookups reject empty input without calling the network', async () => {
    const noNet = async () => { throw new Error('network should not be used'); };
    await assert.rejects(web.getWeather('  ', noNet), /Give a city name/);
    await assert.rejects(web.getCrypto('nope', noNet), /Supported coins/);
    await assert.rejects(web.convertCurrency(5, 'EURO', 'USD', noNet), /3-letter/);
    await assert.rejects(web.defineWord('two words', noNet), /single English word/);
});

test('getWeather builds the answer from mocked API responses', async () => {
    const fake = async (url) => {
        const body = url.includes('geocoding')
            ? { results: [{ name: 'Bologna', country_code: 'IT', latitude: 44.5, longitude: 11.3 }] }
            : { current_weather: { temperature: 18.2, windspeed: 9, weathercode: 3 } };
        return { ok: true, json: async () => body };
    };
    const w = await web.getWeather('Bologna', fake);
    assert.equal(w.place, 'Bologna, IT');
    assert.equal(w.condition, 'Partly cloudy');
    assert.equal(w.temperature, 18.2);
});

test('every fun text list has the same number of entries in en, ur, it and hi', () => {
    const langs = ['en', 'ur', 'it', 'hi'];
    const sizes = (obj) => langs.map(l => obj[l].length);
    assert.deepEqual(new Set(sizes(content.JOKES)).size, 1);
    assert.deepEqual(new Set(sizes(content.COMPLIMENTS)).size, 1);
    assert.deepEqual(new Set(sizes(content.RIZZ)).size, 1);
    assert.deepEqual(new Set(sizes(content.WOULD_YOU_RATHER)).size, 1);
    assert.deepEqual(new Set(langs.map(l => content.TRIVIA[l].length)).size, 1);
    assert.equal(content.pickLang('xx'), 'en');
    assert.equal(content.pickLang('ur'), 'ur');
});

test('trivia answers point at a real option', () => {
    for (const lang of ['en', 'ur', 'it', 'hi']) {
        for (const q of content.TRIVIA[lang]) {
            assert.ok(q.answer >= 0 && q.answer < q.options.length);
        }
    }
});

test('wordfilter deletes banned words for members without Manage Messages', async () => {
    const store = require('../lib/store');
    store.set('wordfilter', { g1: { enabled: true, words: ['badword'] } });
    const wordfilter = require('../commands/moderation/wordfilter');
    let deleted = false;
    const message = {
        content: 'this has a BadWord in it',
        guild: { id: 'g1' },
        member: { permissions: { has: () => false } },
        deletable: true,
        delete: async () => { deleted = true; },
        author: { id: 'u1' },
        channel: { send: async () => ({ delete: async () => {} }) },
    };
    await wordfilter.handleMessage(message);
    assert.equal(deleted, true);

    const clean = { ...message, content: 'classy words only', delete: async () => { throw new Error('should not delete'); } };
    await wordfilter.handleMessage(clean);
});

test('wordfilter does not delete partial matches', async () => {
    const store = require('../lib/store');
    store.set('wordfilter', { g2: { enabled: true, words: ['ass'] } });
    const wordfilter = require('../commands/moderation/wordfilter');
    const message = {
        content: 'a classic class',
        guild: { id: 'g2' },
        member: { permissions: { has: () => false } },
        deletable: true,
        delete: async () => { throw new Error('should not delete partial match'); },
        author: { id: 'u1' },
        channel: { send: async () => ({}) },
    };
    await wordfilter.handleMessage(message);
});
