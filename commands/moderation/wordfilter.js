const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild, ephemeral } = require('../../lib/cmd');

const KEY = 'wordfilter';
const MAX_WORDS = 50;

function getConfig(guildId) {
    return store.get(KEY, {})[guildId] || { enabled: false, words: [] };
}

function saveConfig(guildId, config) {
    const all = store.get(KEY, {});
    all[guildId] = config;
    store.set(KEY, all);
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordfilter')
        .setDescription('Delete messages that contain banned words.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addSubcommand(sc => sc.setName('add').setDescription('Ban a word or phrase')
            .addStringOption(o => o.setName('word').setDescription('Word or phrase').setRequired(true).setMaxLength(40)))
        .addSubcommand(sc => sc.setName('remove').setDescription('Allow a word again')
            .addStringOption(o => o.setName('word').setDescription('Word or phrase').setRequired(true).setMaxLength(40)))
        .addSubcommand(sc => sc.setName('list').setDescription('Show the banned words'))
        .addSubcommand(sc => sc.setName('on').setDescription('Turn the filter on'))
        .addSubcommand(sc => sc.setName('off').setDescription('Turn the filter off')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = getConfig(guildId);

        if (sub === 'list') {
            const words = config.words.length ? config.words.map(w => `\`${w}\``).join(', ') : 'None yet.';
            return ephemeral(interaction, `🚫 Filter is **${config.enabled ? 'on' : 'off'}**.\nBanned: ${words}`);
        }
        if (sub === 'on' || sub === 'off') {
            config.enabled = sub === 'on';
            saveConfig(guildId, config);
            return ephemeral(interaction, `Word filter is now **${sub}**.`);
        }

        const word = interaction.options.getString('word').trim().toLowerCase();
        if (!word) return ephemeral(interaction, 'Bro, that word is empty.');

        if (sub === 'add') {
            if (config.words.includes(word)) return ephemeral(interaction, 'Bro, that word is already banned.');
            if (config.words.length >= MAX_WORDS) return ephemeral(interaction, `Bro, the limit is ${MAX_WORDS} words.`);
            config.words.push(word);
            saveConfig(guildId, config);
            return ephemeral(interaction, `🚫 Added \`${word}\`.`);
        }

        if (sub === 'remove') {
            if (!config.words.includes(word)) return ephemeral(interaction, 'Bro, that word is not in the list.');
            config.words = config.words.filter(w => w !== word);
            saveConfig(guildId, config);
            return ephemeral(interaction, `✅ Removed \`${word}\`.`);
        }
        return ephemeral(interaction, 'Unknown option.');
    },

    /** Runs on every message. Deletes messages with banned words from non-staff members. */
    async handleMessage(message) {
        const config = getConfig(message.guild.id);
        if (!config.enabled || config.words.length === 0) return;
        if (message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const text = message.content.toLowerCase();
        const hit = config.words.find(w => new RegExp(`(^|[^a-z0-9])${escapeRegExp(w)}($|[^a-z0-9])`, 'i').test(text));
        if (!hit || !message.deletable) return;

        await message.delete().catch(() => null);
        await message.channel.send({
            content: `🚫 <@${message.author.id}>, that word is not allowed here.`,
            allowedMentions: { users: [message.author.id] },
        }).then(m => setTimeout(() => m.delete().catch(() => null), 8000)).catch(() => null);
    },
};
