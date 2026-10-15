const { SlashCommandBuilder } = require('discord.js');
const { emojifyText } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojify')
        .setDescription('Turn letters into emoji letters.')
        .addStringOption(o => o.setName('text').setDescription('Text to convert').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        const out = emojifyText(interaction.options.getString('text'));
        if (out.length > 1900) return interaction.reply({ content: 'Bro, that is too long to emojify.', ephemeral: true });
        return interaction.reply({ content: out, allowedMentions: { parse: [] } });
    },
};
