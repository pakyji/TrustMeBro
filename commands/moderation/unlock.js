const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Let everyone send messages in a channel again.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption(o => o.setName('channel').setDescription('Channel (default: this one)').addChannelTypes(ChannelType.GuildText)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const problem = missingBotPerms(interaction, channel, ['ManageChannels', 'ManageRoles']);
        if (problem) return ephemeral(interaction, problem);

        // null removes the override, so the server's normal permissions apply again.
        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: null },
            { reason: `Unlocked by ${interaction.user.tag}` },
        );
        return interaction.reply({ content: `🔓 ${channel} is unlocked.` });
    },
};
