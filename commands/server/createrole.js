const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireGuild, ephemeral } = require('../../lib/cmd');
const { colorInfo } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrole')
        .setDescription('Create a new role.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addStringOption(o => o.setName('name').setDescription('Role name').setRequired(true).setMaxLength(100))
        .addStringOption(o => o.setName('color').setDescription('Hex colour, e.g. #ff8800').setMaxLength(7))
        .addBooleanOption(o => o.setName('mentionable').setDescription('Can anyone mention this role?')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const name = interaction.options.getString('name').trim();
        const colorInput = interaction.options.getString('color');
        const mentionable = interaction.options.getBoolean('mentionable') ?? false;

        let color;
        if (colorInput) {
            try {
                color = colorInfo(colorInput).decimal;
            } catch (error) {
                return ephemeral(interaction, `Bro, ${error.message}`);
            }
        }
        if (!name) return ephemeral(interaction, 'Bro, the role needs a name.');

        const role = await interaction.guild.roles.create({
            name,
            color,
            mentionable,
            reason: `Created by ${interaction.user.tag}`,
        });
        return interaction.reply({ content: `✅ Created role **${role.name}**.`, allowedMentions: { parse: [] } });
    },
};
