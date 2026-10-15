const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });

        const paused = music.pause(interaction.guild.id);
        return interaction.reply({
            content: paused ? '⏸️ Paused. Use /resume to continue.' : 'Bro, nothing is playing right now (or it is already paused).',
            ephemeral: !paused,
        });
    },
};
