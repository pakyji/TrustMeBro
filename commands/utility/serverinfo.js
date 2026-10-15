const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireGuild } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show details about this server.')
        .setDMPermission(false),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const g = interaction.guild;
        const owner = await g.fetchOwner().catch(() => null);
        const embed = new EmbedBuilder()
            .setTitle(g.name)
            .setThumbnail(g.iconURL({ size: 256 }))
            .addFields(
                { name: 'ID', value: g.id, inline: true },
                { name: 'Owner', value: owner ? owner.user.tag : 'Unknown', inline: true },
                { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Members', value: String(g.memberCount), inline: true },
                { name: 'Channels', value: String(g.channels.cache.size), inline: true },
                { name: 'Roles', value: String(g.roles.cache.size), inline: true },
                { name: 'Boosts', value: `${g.premiumSubscriptionCount || 0} (tier ${g.premiumTier})`, inline: true },
                { name: 'Verification', value: String(g.verificationLevel), inline: true },
            );
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
