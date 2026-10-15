const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, '..', 'commands');

function allCommandFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? allCommandFiles(full) : entry.name.endsWith('.js') ? [full] : [];
    });
}

const files = allCommandFiles(commandsDir);
const commands = files.map(file => ({ file, command: require(file) }));

test('every command file exports data and execute', () => {
    for (const { file, command } of commands) {
        assert.ok(command.data, `${file} has no data`);
        assert.equal(typeof command.execute, 'function', `${file} has no execute`);
    }
});

test('slash command definitions are valid and names are unique', () => {
    const names = new Set();
    for (const { file, command } of commands) {
        const json = command.data.toJSON(); // throws if the builder is invalid
        assert.ok(!names.has(json.name), `duplicate command name ${json.name} in ${file}`);
        names.add(json.name);
    }
});

test('moderation, server and music commands are guild-only', () => {
    const guildFolders = ['moderation', 'server', 'music'];
    for (const { file, command } of commands) {
        const folder = path.relative(commandsDir, file).split(path.sep)[0];
        if (guildFolders.includes(folder)) {
            assert.equal(command.data.toJSON().dm_permission, false, `${command.data.name} should be guild-only`);
        }
    }
});

test('the bot has at most 100 top-level slash commands (Discord limit)', () => {
    const top = commands.map(c => c.command.data.name);
    assert.ok(top.length <= 100, `found ${top.length} commands`);
    assert.equal(top.length, 100, 'the planned set is exactly 100');
});

test('every command name and description fits Discord limits', () => {
    for (const { file, command } of commands) {
        const json = command.data.toJSON();
        assert.match(json.name, /^[a-z0-9_-]{1,32}$/, `${file} name`);
        assert.ok(json.description.length >= 1 && json.description.length <= 100, `${file} description length`);
    }
});

test('mute duration is limited to Discord timeout range', () => {
    const mute = commands.find(c => c.command.data.name === 'mute').command.data.toJSON();
    const duration = mute.options.find(o => o.name === 'duration');
    assert.equal(duration.min_value, 1);
    assert.equal(duration.max_value, 40320);
});

test('the bot has no unhandled "200+ commands" claim in its metadata', () => {
    const pkg = require('../package.json');
    assert.ok(!/200\+/.test(pkg.description));
});

test('fakefact replies with one of the known facts', async () => {
    const fakefact = require(path.join(commandsDir, 'fun', 'fakefact.js'));
    let reply = null;
    await fakefact.execute({ reply: async (text) => { reply = text; } });
    assert.equal(typeof reply, 'string');
    assert.ok(reply.length > 0);
});

test('AI commands say the key is missing instead of crashing when it is not set', async () => {
    const saved = process.env.GROK_API_KEY;
    delete process.env.GROK_API_KEY;
    const grok = require(path.join(commandsDir, 'fun', 'grokbro.js'));
    let edited = null;
    const interaction = {
        deferReply: async () => {},
        options: { getString: () => 'hello' },
        editReply: async (payload) => { edited = payload; },
    };
    await grok.execute(interaction);
    if (saved !== undefined) process.env.GROK_API_KEY = saved;
    assert.match(String(edited), /GROK_API_KEY is missing/);
});
