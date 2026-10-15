const { SlashCommandBuilder } = require('discord.js');
const { HUG, LANGUAGE_CHOICES, pickLang } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Give someone a hug.')
        .addUserOption(o => o.setName('target').setDescription('Who gets the hug').setRequired(true))
        .addStringOption(o => o.setName('language').setDescription('Reply language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const target = interaction.options.getUser('target');
        return interaction.reply({
            content: HUG[lang](`<@${interaction.user.id}>`, `<@${target.id}>`),
            allowedMentions: { users: [interaction.user.id, target.id] },
        });
    },
};
