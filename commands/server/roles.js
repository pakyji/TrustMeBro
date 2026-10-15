const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireGuild } = require('../../lib/cmd');

const MAX_SHOWN = 40;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('List the roles in this server, highest first.')
        .setDMPermission(false),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const roles = interaction.guild.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position);
        const shown = [...roles.values()].slice(0, MAX_SHOWN).map(r => `${r.name} (${r.members.size})`);
        const more = roles.size > MAX_SHOWN ? `\n…and ${roles.size - MAX_SHOWN} more.` : '';
        const embed = new EmbedBuilder()
            .setTitle(`🎭 Roles (${roles.size})`)
            .setDescription((shown.join('\n') || 'No roles.') + more)
            .setFooter({ text: 'Number in brackets = members with that role' });
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
