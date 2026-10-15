const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Empty the queue. The current song keeps playing.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const count = music.clearWaiting(interaction.guild.id);
        return interaction.reply({ content: count > 0 ? `🧹 Cleared ${count} waiting song(s).` : 'The queue was already empty.' });
    },
};
