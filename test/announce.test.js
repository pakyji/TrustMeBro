const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Use a temporary store file so tests never touch data/store.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmb-test-'));
process.env.STORE_PATH = path.join(tmpDir, 'store.json');

const announce = require('../lib/announce');
const { getBuildInfo } = require('../lib/build');
const { PermissionFlagsBits } = require('discord.js');

function fakeGuild(sent, { canMention = true } = {}) {
    const channel = {
        isTextBased: () => true,
        permissionsFor: () => ({
            has: (flags) => {
                const list = Array.isArray(flags) ? flags : [flags];
                return list.every(f => f !== PermissionFlagsBits.MentionEveryone || canMention);
            },
        }),
        send: async (payload) => { sent.push(payload); },
    };
    return {
        id: 'G1',
        name: 'Test Guild',
        members: { me: {} },
        channels: { fetch: async () => channel },
    };
}

function fakeClient(guild) {
    return { guilds: { cache: new Map([[guild.id, guild]]), fetch: async () => null } };
}

test('build info has a version and an id', () => {
    const build = getBuildInfo();
    assert.ok(build.version);
    assert.ok(build.id.startsWith(build.version));
});

test('live message does not ping anyone and neutralises @everyone inside commit text', () => {
    const msg = announce.buildMessage({ version: '1.2.0', commit: 'abc1234', subject: 'fix @everyone spam', id: 'x' });
    assert.ok(!msg.startsWith('@everyone'));
    assert.ok(!msg.includes('@everyone'));
    assert.match(msg, /abc1234/);
});

test('announces once per new build and not again on restart', async () => {
    const sent = [];
    const guild = fakeGuild(sent);
    const client = fakeClient(guild);
    announce.setSettings('G1', { channelId: 'C1', lastBuild: 'old-build' });

    await announce.announceNewBuild(client, { version: '2.0.0', commit: null, subject: null, id: 'new-build' });
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].allowedMentions, { parse: [] });

    await announce.announceNewBuild(client, { version: '2.0.0', commit: null, subject: null, id: 'new-build' });
    assert.equal(sent.length, 1, 'restart with the same build must not ping again');
});

test('no ping when the channel was just set up for the current build', async () => {
    const sent = [];
    const client = fakeClient(fakeGuild(sent));
    announce.setSettings('G1', { channelId: 'C1', lastBuild: 'cur' });
    await announce.announceNewBuild(client, { version: '2.0.0', commit: null, subject: null, id: 'cur' });
    assert.equal(sent.length, 0);
});

test('missing permission sends nothing and retries next start', async () => {
    const sent = [];
    const client = fakeClient(fakeGuild(sent));
    announce.setSettings('G1', { channelId: 'C1', lastBuild: 'old' });
    const build = { version: '3.0.0', commit: null, subject: null, id: 'b3' };

    await announce.announceNewBuild(client, build);
    assert.equal(sent.length, 1);

    await announce.announceNewBuild(client, build);
    assert.equal(sent.length, 1);
});

test('guilds without settings are ignored', async () => {
    const sent = [];
    const client = fakeClient(fakeGuild(sent));
    announce.setSettings('G1', null);
    await announce.announceNewBuild(client, { version: '4.0.0', commit: null, subject: null, id: 'b4' });
    assert.equal(sent.length, 0);
});
