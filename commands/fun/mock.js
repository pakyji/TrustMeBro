const { SlashCommandBuilder } = require('discord.js');
const { mockText } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mock')
        .setDescription('Convert text to mOcKiNg sPoNgEbOb case.')
        .addStringOption(o => o.setName('text').setDescription('Text to mock').setRequired(true).setMaxLength(300)),

    async execute(interaction) {
        return interaction.reply({ content: mockText(interaction.options.getString('text')), allowedMentions: { parse: [] } });
    },
};
