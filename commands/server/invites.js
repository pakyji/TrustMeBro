const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { requireGuild, ephemeral } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('List active invite links with their usage.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const invites = await interaction.guild.invites.fetch().catch(() => null);
        if (!invites) return ephemeral(interaction, 'Bro, I cannot read invites. Check my Manage Server permission.');
        if (invites.size === 0) return ephemeral(interaction, 'No active invites.');

        const lines = [...invites.values()].slice(0, 15).map(i => {
            const uses = i.maxUses ? `${i.uses}/${i.maxUses}` : `${i.uses} uses`;
            const expires = i.expiresTimestamp ? ` · expires <t:${Math.floor(i.expiresTimestamp / 1000)}:R>` : '';
            return `• \`${i.code}\` by ${i.inviter?.tag || 'unknown'} · ${uses}${expires}`;
        });
        const embed = new EmbedBuilder()
            .setTitle(`🔗 Invites (${invites.size})`)
            .setDescription(lines.join('\n').slice(0, 4000));
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
