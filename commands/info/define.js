const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('Dictionary definition of an English word.')
        .addStringOption(o => o.setName('word').setDescription('One English word').setRequired(true).setMaxLength(50)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const d = await web.defineWord(interaction.options.getString('word'));
            return interaction.editReply(`📘 **${d.word}** *(${d.partOfSpeech})*: ${d.definition}`.slice(0, 1900));
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
