const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');
const { colorInfo } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Post a nicely formatted embed box.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true).setMaxLength(256))
        .addStringOption(o => o.setName('description').setDescription('Body text').setRequired(true).setMaxLength(2000))
        .addStringOption(o => o.setName('color').setDescription('Hex colour, e.g. #ff8800').setMaxLength(7))
        .addChannelOption(o => o.setName('channel').setDescription('Where to post (default: here)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const problem = missingBotPerms(interaction, channel, ['SendMessages', 'EmbedLinks']);
        if (problem) return ephemeral(interaction, problem);

        let color = 0x5865F2;
        const colorInput = interaction.options.getString('color');
        if (colorInput) {
            try {
                color = colorInfo(colorInput).decimal;
            } catch (error) {
                return ephemeral(interaction, `Bro, ${error.message}`);
            }
        }
        const embed = new EmbedBuilder()
            .setTitle(interaction.options.getString('title'))
            .setDescription(interaction.options.getString('description'))
            .setColor(color);
        await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
        return ephemeral(interaction, `✅ Embed posted in ${channel}.`);
    },
};
