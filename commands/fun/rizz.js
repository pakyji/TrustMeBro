const { SlashCommandBuilder } = require('discord.js');
const { RIZZ, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rizz')
        .setDescription('Get a random pickup line. Use at your own risk.')
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        return interaction.reply({ content: `😏 ${randomItem(RIZZ[lang])}` });
    },
};
