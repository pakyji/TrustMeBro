const { SlashCommandBuilder } = require('discord.js');
const { TRUTH_OR_DARE, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('truthordare')
        .setDescription('Get a truth or a dare.')
        .addStringOption(o => o.setName('type').setDescription('Truth or dare (default: random)')
            .addChoices({ name: 'Truth', value: 'truth' }, { name: 'Dare', value: 'dare' }))
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const text = TRUTH_OR_DARE[lang];
        const type = interaction.options.getString('type') || (crypto.randomInt(2) ? 'truth' : 'dare');
        const label = type === 'truth' ? text.truth : text.dare;
        const prompt = randomItem(type === 'truth' ? text.truths : text.dares);
        return interaction.reply({ content: `🎭 **${label}:** ${prompt}` });
    },
};
