const { SlashCommandBuilder } = require('discord.js');
const { JOKES, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Tell a joke.')
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        return interaction.reply({ content: `😂 ${randomItem(JOKES[lang])}` });
    },
};
