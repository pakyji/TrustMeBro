const { SlashCommandBuilder } = require('discord.js');
const { EIGHT_BALL, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question.')
        .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true).setMaxLength(200))
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const text = EIGHT_BALL[lang];
        const question = interaction.options.getString('question');
        return interaction.reply({
            content: `🎱 **${text.q}:** ${question}\n**${text.a}:** ${randomItem(text.answers)}`,
            allowedMentions: { parse: [] },
        });
    },
};
