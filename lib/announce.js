const { PermissionFlagsBits } = require('discord.js');
const store = require('./store');
const { getBuildInfo } = require('./build');

// Per-guild announcement settings, saved in data/store.json.
// Shape: { [guildId]: { channelId: string, lastBuild: string | null } }
const STORE_KEY = 'announce';

function getSettings(guildId) {
    return store.get(STORE_KEY, {})[guildId] || null;
}

function setSettings(guildId, value) {
    const all = store.get(STORE_KEY, {});
    if (value) all[guildId] = value;
    else delete all[guildId];
    store.set(STORE_KEY, all);
}

// Stops user text such as commit messages from pinging anyone.
function neutralise(text) {
    return text.replace(/@/g, '@\u200b');
}

function buildMessage(build, { test = false } = {}) {
    const lines = [];
    lines.push(`@everyone 🟢 **TrustMeBro is live!**${test ? ' *(test message)*' : ''}`);
    const commit = build.commit ? ` (\`${build.commit}\`)` : '';
    lines.push(`Version **${build.version}**${commit} is now running.`);
    if (build.subject) lines.push(`What's new: ${neutralise(build.subject).slice(0, 200)}`);
    return lines.join('\n');
}

/**
 * Sends the live message to one guild's channel.
 * Returns { ok: true } or { ok: false, reason } so the caller can tell an admin what to fix.
 */
async function sendLiveMessage(guild, channelId, build, options) {
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        return { ok: false, reason: 'The announcement channel is missing or is not a text channel.' };
    }

    const perms = channel.permissionsFor(guild.members.me);
    if (!perms || !perms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        return { ok: false, reason: 'I cannot view or send messages in the announcement channel.' };
    }
    if (!perms.has(PermissionFlagsBits.MentionEveryone)) {
        return { ok: false, reason: 'I need the Mention Everyone permission in the announcement channel.' };
    }

    await channel.send({
        content: buildMessage(build, options),
        allowedMentions: { parse: ['everyone'] },
    });
    return { ok: true };
}

/**
 * Runs once at startup. In each configured guild, sends the live message if this build
 * was not announced there yet. Restarts with the same build send nothing.
 */
async function announceNewBuild(client, build = getBuildInfo()) {
    const all = store.get(STORE_KEY, {});

    for (const [guildId, settings] of Object.entries(all)) {
        if (settings.lastBuild === build.id) continue;

        const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) continue;

        // Mark before sending, so a crash loop cannot ping everyone repeatedly.
        const previous = settings.lastBuild;
        setSettings(guildId, { ...settings, lastBuild: build.id });

        try {
            const result = await sendLiveMessage(guild, settings.channelId, build);
            if (!result.ok) {
                // Nothing was sent. Try again on the next start, after the admin fixes the problem.
                setSettings(guildId, { ...settings, lastBuild: previous });
                console.warn(`Live announcement skipped in ${guild.name}: ${result.reason}`);
            } else {
                console.log(`Live announcement sent in ${guild.name} for build ${build.id}.`);
            }
        } catch (error) {
            setSettings(guildId, { ...settings, lastBuild: previous });
            console.error(`Live announcement failed in ${guild.name}:`, error.message);
        }
    }
}

module.exports = {
    getSettings,
    setSettings,
    buildMessage,
    sendLiveMessage,
    announceNewBuild,
};
