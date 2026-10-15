const { SlashCommandBuilder } = require('discord.js');
const { COMPLIMENTS, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compliment')
        .setDescription('Send a nice compliment.')
        .addUserOption(o => o.setName('target').setDescription('Who gets the compliment (default: you)'))
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const target = interaction.options.getUser('target') || interaction.user;
        return interaction.reply({
            content: `💖 <@${target.id}> ${randomItem(COMPLIMENTS[lang])}`,
            allowedMentions: { users: [target.id] },
        });
    },
};
