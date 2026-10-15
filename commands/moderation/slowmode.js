const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set the delay between messages in a channel. 0 turns it off.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addIntegerOption(o => o.setName('seconds').setDescription('Delay in seconds (0-21600)').setMinValue(0).setMaxValue(21600).setRequired(true))
        .addChannelOption(o => o.setName('channel').setDescription('Channel (default: this one)').addChannelTypes(ChannelType.GuildText)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const seconds = interaction.options.getInteger('seconds');
        const problem = missingBotPerms(interaction, channel, ['ManageChannels']);
        if (problem) return ephemeral(interaction, problem);

        await channel.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag}`);
        return interaction.reply({ content: seconds === 0 ? `✅ Slowmode is off in ${channel}.` : `🐢 Slowmode in ${channel} is now ${seconds} second(s).` });
    },
};
