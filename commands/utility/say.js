const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot post a message. Mentions are blocked.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addStringOption(o => o.setName('text').setDescription('What to say').setRequired(true).setMaxLength(1000))
        .addChannelOption(o => o.setName('channel').setDescription('Where to post (default: here)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const problem = missingBotPerms(interaction, channel, ['SendMessages', 'ViewChannel']);
        if (problem) return ephemeral(interaction, problem);

        await channel.send({ content: interaction.options.getString('text'), allowedMentions: { parse: [] } });
        return ephemeral(interaction, `✅ Posted in ${channel}.`);
    },
};
