const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('art')
        .setDescription('Search artworks in the Art Institute of Chicago collection.')
        .addStringOption(o => o.setName('query').setDescription('Artwork or artist').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const works = await web.searchArtworks(interaction.options.getString('query'));
            if (works.length === 0) return interaction.editReply('No artworks found. Try another name.');
            const lines = works.map(a => `🖼️ **${a.title}** by ${a.artist}${a.date ? ` (${a.date})` : ''}\n<${a.link}>`);
            return interaction.editReply({ content: lines.join('\n\n').slice(0, 1900), allowedMentions: { parse: [] } });
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
