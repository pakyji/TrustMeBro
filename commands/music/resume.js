const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume a paused track.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });

        const resumed = music.resume(interaction.guild.id);
        return interaction.reply({
            content: resumed ? '▶️ Resumed!' : 'Bro, nothing is paused right now.',
            ephemeral: !resumed,
        });
    },
};
