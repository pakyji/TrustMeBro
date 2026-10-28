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

        // Count channels by type
        const textChannels = g.channels.cache.filter(c => c.isTextBased()).size;
        const voiceChannels = g.channels.cache.filter(c => c.isVoiceBased()).size;
        const categories = g.channels.cache.filter(c => c.type === 4).size;

        // Count members by status (cached)
        const members = g.members.cache;
        const humans = members.filter(m => !m.user.bot).size;
        const bots = members.filter(m => m.user.bot).size;

        // Role info
        const highestRole = g.roles.cache.filter(r => r.id !== g.id).sort((a, b) => b.position - a.position).first();
        const boosters = g.premiumSubscriptionCount || 0;

        // Features
        const features = g.features.length > 0 ? g.features.join(', ') : 'None';

        const embed = new EmbedBuilder()
            .setTitle(`${g.name} Server Info`)
            .setThumbnail(g.iconURL({ size: 256 }))
            .setColor(0x5865F2)
            .addFields(
                { name: '📋 General', value: [
                    `**ID:** ${g.id}`,
                    `**Owner:** ${owner ? owner.user.tag : 'Unknown'}`,
                    `**Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:D> (<t:${Math.floor(g.createdTimestamp / 1000)}:R>)`,
                    `**Verification:** ${g.verificationLevel}`,
                    `**Features:** ${features}`,
                ].join('\n'), inline: true },
                { name: '👥 Members', value: [
                    `**Total:** ${g.memberCount}`,
                    `**Humans:** ${humans}`,
                    `**Bots:** ${bots}`,
                    `**Boosts:** ${boosters} (Tier ${g.premiumTier})`,
                    `**Boosters:** ${g.premiumSubscriberRole ? g.premiumSubscriberRole.members.size : 0}`,
                ].join('\n'), inline: true },
                { name: '📺 Channels', value: [
                    `**Total:** ${g.channels.cache.size}`,
                    `**Text:** ${textChannels}`,
                    `**Voice:** ${voiceChannels}`,
                    `**Categories:** ${categories}`,
                ].join('\n'), inline: true },
                { name: '🎭 Roles', value: [
                    `**Count:** ${g.roles.cache.size}`,
                    `**Highest:** ${highestRole ? highestRole.name : 'None'}`,
                ].join('\n'), inline: true },
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        if (g.banner) {
            embed.setImage(g.bannerURL({ size: 1024 }));
        }

        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
