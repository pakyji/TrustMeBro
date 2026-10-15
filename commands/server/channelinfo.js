const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { requireGuild } = require('../../lib/cmd');

const TYPE_NAMES = {
    [ChannelType.GuildText]: 'Text',
    [ChannelType.GuildVoice]: 'Voice',
    [ChannelType.GuildAnnouncement]: 'Announcement',
    [ChannelType.GuildForum]: 'Forum',
    [ChannelType.GuildStageVoice]: 'Stage',
    [ChannelType.GuildCategory]: 'Category',
    [ChannelType.PublicThread]: 'Public thread',
    [ChannelType.PrivateThread]: 'Private thread',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Show details about a channel.')
        .setDMPermission(false)
        .addChannelOption(o => o.setName('channel').setDescription('Channel (default: this one)')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const embed = new EmbedBuilder()
            .setTitle(`📺 ${channel.name}`)
            .addFields(
                { name: 'ID', value: channel.id, inline: true },
                { name: 'Type', value: TYPE_NAMES[channel.type] || 'Other', inline: true },
                { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
                { name: 'Slowmode', value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser}s` : 'Off', inline: true },
                { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
            );
        if (channel.topic) embed.setDescription(channel.topic.slice(0, 500));
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
