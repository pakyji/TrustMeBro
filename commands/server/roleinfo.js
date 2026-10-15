const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireGuild } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Show details about a role.')
        .setDMPermission(false)
        .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const role = interaction.options.getRole('role');
        const embed = new EmbedBuilder()
            .setTitle(`🎭 ${role.name}`)
            .setColor(role.color || 0x5865F2)
            .addFields(
                { name: 'ID', value: role.id, inline: true },
                { name: 'Members', value: String(role.members.size), inline: true },
                { name: 'Colour', value: role.hexColor, inline: true },
                { name: 'Position', value: String(role.position), inline: true },
                { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Shown separately', value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Managed by an integration', value: role.managed ? 'Yes' : 'No', inline: true },
            );
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
