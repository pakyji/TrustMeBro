const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Show a user\'s profile picture in full size.')
        .addUserOption(o => o.setName('user').setDescription('User (default: you)')),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const url = user.displayAvatarURL({ size: 1024 });
        const embed = new EmbedBuilder().setTitle(`${user.username}'s avatar`).setImage(url).setURL(url);
        return interaction.reply({ embeds: [embed] });
    },
};
