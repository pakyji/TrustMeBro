const { SlashCommandBuilder } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild } = require('../../lib/cmd');

const KEY = 'afk';

function key(guildId, userId) {
    return `${guildId}:${userId}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Tell the server you are away. People who mention you get your reason.')
        .setDMPermission(false)
        .addStringOption(o => o.setName('reason').setDescription('Why you are away').setMaxLength(120)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const reason = interaction.options.getString('reason') || 'AFK';
        const all = store.get(KEY, {});
        all[key(interaction.guild.id, interaction.user.id)] = { reason, since: Date.now() };
        store.set(KEY, all);
        return interaction.reply({ content: `💤 ${interaction.user.username} is now AFK: ${reason}`, allowedMentions: { parse: [] } });
    },

    /** Clears AFK when the person writes again, and tells others who mention an AFK person. */
    async handleMessage(message) {
        const all = store.get(KEY, {});
        const selfKey = key(message.guild.id, message.author.id);
        if (all[selfKey]) {
            delete all[selfKey];
            store.set(KEY, all);
            await message.channel.send({ content: `👋 Welcome back <@${message.author.id}>, I removed your AFK.`, allowedMentions: { users: [message.author.id] } })
                .then(m => setTimeout(() => m.delete().catch(() => null), 10000)).catch(() => null);
        }
        for (const user of message.mentions.users.values()) {
            const entry = all[key(message.guild.id, user.id)];
            if (!entry || user.id === message.author.id) continue;
            await message.reply({
                content: `💤 **${user.username}** is AFK: ${entry.reason} (<t:${Math.floor(entry.since / 1000)}:R>)`,
                allowedMentions: { repliedUser: false, parse: [] },
            }).catch(() => null);
        }
    },
};
