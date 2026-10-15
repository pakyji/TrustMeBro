const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the songs waiting in the queue.')
        .setDMPermission(false),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const count = music.shuffleQueue(interaction.guild.id);
        if (count < 2) return interaction.reply({ content: 'Bro, I need at least 2 songs waiting to shuffle.', ephemeral: true });
        return interaction.reply({ content: `🔀 Shuffled ${count} songs.` });
    },
};
