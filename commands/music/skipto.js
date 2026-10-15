const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skip ahead to a song in the queue. Songs before it are removed.')
        .setDMPermission(false)
        .addIntegerOption(o => o.setName('position').setDescription('Queue number (see /queue)').setRequired(true).setMinValue(1).setMaxValue(50)),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const position = interaction.options.getInteger('position');
        const ok = music.skipTo(interaction.guild.id, position);
        if (!ok) return interaction.reply({ content: `Bro, there is no song at position ${position}.`, ephemeral: true });
        return interaction.reply({ content: `⏭️ Skipping to song ${position}.` });
    },
};
