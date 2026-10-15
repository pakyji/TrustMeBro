const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check if the bot is alive and how fast it responds.'),

    async execute(interaction) {
        const sent = Date.now();
        await interaction.reply({ content: 'Pong...', fetchReply: true });
        const roundTrip = Date.now() - sent;
        return interaction.editReply(`🏓 Pong! Round trip **${roundTrip} ms**, gateway **${interaction.client.ws.ping} ms**.`);
    },
};
