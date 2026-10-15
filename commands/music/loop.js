const { SlashCommandBuilder } = require('discord.js');
const music = require('../../lib/music');
const { checkSameVoiceChannel } = require('../../lib/voice-guard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Repeat the current track, the whole queue, or turn looping off.')
        .setDMPermission(false)
        .addStringOption(o => o.setName('mode').setDescription('Loop mode').setRequired(true)
            .addChoices(
                { name: 'Off', value: 'off' },
                { name: 'This track', value: 'track' },
                { name: 'Whole queue', value: 'queue' },
            )),

    async execute(interaction) {
        const problem = checkSameVoiceChannel(interaction, music);
        if (problem) return interaction.reply({ content: problem, ephemeral: true });
        const mode = interaction.options.getString('mode');
        music.setLoop(interaction.guild.id, mode);
        const text = { off: 'Loop is off.', track: '🔂 Looping this track.', queue: '🔁 Looping the whole queue.' }[mode];
        return interaction.reply({ content: text });
    },
};
