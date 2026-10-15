const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Show or set the volume (0-200%). 100% is normal.')
        .setDMPermission(false)
        .addIntegerOption(o => o.setName('percent').setDescription('Volume 0-200').setMinValue(0).setMaxValue(200)),

    async execute(interaction) {
        const percent = interaction.options.getInteger('percent');
        if (percent === null) {
            return interaction.reply({ content: `🔊 Volume is **${music.getVolumePercent(interaction.guild?.id)}%**.`, ephemeral: true });
        }
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const ok = music.setVolume(interaction.guild.id, percent);
        if (!ok) return interaction.reply({ content: 'Bro, nothing is playing right now.', ephemeral: true });
        return interaction.reply({ content: `🔊 Volume set to **${percent}%**.` });
    },
};
