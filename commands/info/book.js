const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('book')
        .setDescription('Search books by title or author (Open Library).')
        .addStringOption(o => o.setName('query').setDescription('Title or author').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const books = await web.searchBooks(interaction.options.getString('query'));
            if (books.length === 0) return interaction.editReply('No books found. Try another title.');
            const lines = books.map(b => `📚 **${b.title}** by ${b.author}${b.year ? ` (${b.year})` : ''}${b.link ? `\n<${b.link}>` : ''}`);
            return interaction.editReply({ content: lines.join('\n\n').slice(0, 1900), allowedMentions: { parse: [] } });
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
