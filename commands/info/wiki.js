const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('Short summary from English Wikipedia.')
        .addStringOption(o => o.setName('topic').setDescription('Topic, e.g. Bologna').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const w = await web.wikiSummary(interaction.options.getString('topic'));
            const text = w.extract.length > 900 ? `${w.extract.slice(0, 897)}...` : w.extract;
            return interaction.editReply({ content: `📖 **${w.title}**\n${text}${w.link ? `\n<${w.link}>` : ''}`, allowedMentions: { parse: [] } });
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
