const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Stop everyone except staff with a role from sending messages in a channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption(o => o.setName('channel').setDescription('Channel (default: this one)').addChannelTypes(ChannelType.GuildText)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const problem = missingBotPerms(interaction, channel, ['ManageChannels', 'ManageRoles']);
        if (problem) return ephemeral(interaction, problem);

        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: false },
            { reason: `Locked by ${interaction.user.tag}` },
        );
        return interaction.reply({ content: `🔒 ${channel} is locked. Use \`/unlock\` to open it again.` });
    },
};
