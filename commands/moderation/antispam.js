const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild, ephemeral } = require('../../lib/cmd');

const KEY = 'antispam';
// More than 6 messages in 5 seconds from one member counts as spam.
const WINDOW_MS = 5000;
const MAX_MESSAGES = 6;
const TIMEOUT_MS = 5 * 60 * 1000;

// In memory only: recent message times per "guild:user". Resets on restart, which is fine.
const recent = new Map();

function isOn(guildId) {
    return Boolean(store.get(KEY, {})[guildId]);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antispam')
        .setDescription('Time out members who send messages too fast.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sc => sc.setName('on').setDescription('Turn anti-spam on'))
        .addSubcommand(sc => sc.setName('off').setDescription('Turn anti-spam off'))
        .addSubcommand(sc => sc.setName('status').setDescription('Show whether anti-spam is on')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'status') {
            return ephemeral(interaction, `Anti-spam is **${isOn(guildId) ? 'on' : 'off'}**. Limit: ${MAX_MESSAGES} messages in ${WINDOW_MS / 1000}s → ${TIMEOUT_MS / 60000} min timeout.`);
        }
        const all = store.get(KEY, {});
        all[guildId] = sub === 'on';
        store.set(KEY, all);
        return ephemeral(interaction, `Anti-spam is now **${sub}**.`);
    },

    async handleMessage(message) {
        if (!isOn(message.guild.id)) return;
        if (message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const key = `${message.guild.id}:${message.author.id}`;
        const now = Date.now();
        const times = (recent.get(key) || []).filter(t => now - t < WINDOW_MS);
        times.push(now);
        recent.set(key, times);
        if (times.length <= MAX_MESSAGES) return;

        recent.delete(key);
        await message.delete().catch(() => null);
        const member = message.member;
        if (member && member.moderatable) {
            await member.timeout(TIMEOUT_MS, 'Anti-spam: too many messages').catch(() => null);
        }
        await message.channel.send({
            content: `🛑 <@${message.author.id}> is timed out for 5 minutes (spam).`,
            allowedMentions: { users: [message.author.id] },
        }).catch(() => null);
    },
};
