const { SlashCommandBuilder } = require('discord.js');
const { WOULD_YOU_RATHER, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wyr')
        .setDescription('Would you rather? A random question.')
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const [a, b] = randomItem(WOULD_YOU_RATHER[lang]).split('|');
        const word = { en: 'Would you rather', ur: 'کیا تم چاہو گے', it: 'Preferiresti', hi: 'क्या तुम चुनोगे' }[lang];
        const or = { en: 'or', ur: 'یا', it: 'o', hi: 'या' }[lang];
        return interaction.reply({ content: `🤷 **${word}**\n🅰️ ${a}\n**${or}**\n🅱️ ${b}?` });
    },
};
