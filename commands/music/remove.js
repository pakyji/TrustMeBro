const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove one song from the queue by its number (see /queue).')
        .setDMPermission(false)
        .addIntegerOption(o => o.setName('position').setDescription('Queue number, 1 = next').setRequired(true).setMinValue(1).setMaxValue(50)),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const position = interaction.options.getInteger('position');
        const removed = music.removeFromQueue(interaction.guild.id, position);
        if (!removed) return interaction.reply({ content: `Bro, there is no song at position ${position}.`, ephemeral: true });
        return interaction.reply({ content: `🗑️ Removed **${removed.title}** from the queue.`, allowedMentions: { parse: [] } });
    },
};
