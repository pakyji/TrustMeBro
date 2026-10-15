const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { requireGuild, ephemeral } = require('../../lib/cmd');

const LIMIT = 20;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription(`Show the most recent bans (up to ${LIMIT}).`)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const bans = await interaction.guild.bans.fetch({ limit: LIMIT }).catch(() => null);
        if (!bans) return ephemeral(interaction, 'Bro, I cannot read the ban list. Check my Ban Members permission.');
        if (bans.size === 0) return ephemeral(interaction, 'No bans in this server. Nice!');

        const lines = [...bans.values()].map(b => `• **${b.user.tag}** (\`${b.user.id}\`)${b.reason ? ` — ${b.reason.slice(0, 80)}` : ''}`);
        const embed = new EmbedBuilder()
            .setTitle(`🔨 Bans (${bans.size} shown)`)
            .setDescription(lines.join('\n').slice(0, 4000))
            .setColor(0xFF0000)
            .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
