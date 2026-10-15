const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music, clear the queue, and leave the voice channel.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });

        music.destroySession(interaction.guild.id);
        return interaction.reply({ content: '⏹️ Music stopped, queue cleared, and I left the voice channel.' });
    },
};
