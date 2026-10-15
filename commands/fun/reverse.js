const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Reverse any text.')
        .addStringOption(o => o.setName('text').setDescription('Text to reverse').setRequired(true).setMaxLength(300)),

    async execute(interaction) {
        const text = interaction.options.getString('text');
        return interaction.reply({ content: [...text].reverse().join(''), allowedMentions: { parse: [] } });
    },
};
