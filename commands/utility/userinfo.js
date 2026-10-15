const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show details about a user.')
        .addUserOption(o => o.setName('user').setDescription('User (default: you)')),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;
        const embed = new EmbedBuilder()
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Account created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
            );
        if (member) {
            embed.addFields(
                { name: 'Joined server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true },
                { name: 'Top role', value: member.roles.highest.id === interaction.guild.id ? 'None' : member.roles.highest.name, inline: true },
                { name: 'Roles', value: String(member.roles.cache.size - 1), inline: true },
            );
        }
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
