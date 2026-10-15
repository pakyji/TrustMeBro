const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });

        const skipped = music.skip(interaction.guild.id);
        return interaction.reply({
            content: skipped ? '⏭️ Skipped! Next track is loading.' : 'Bro, nothing is playing right now.',
            ephemeral: !skipped,
        });
    },
};
