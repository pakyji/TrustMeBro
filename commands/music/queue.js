const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const music = require('../../lib/music');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue.')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, music only works in a server.', ephemeral: true });
        }

        const status = music.status(interaction.guild.id);
        if (!status || (!status.current && status.upcoming.length === 0)) {
            return interaction.reply({ content: 'Bro, the queue is empty. Use /play to add a song.', ephemeral: true });
        }

        const lines = status.upcoming.slice(0, 15).map((t, i) => `**${i + 1}.** ${t.title} *(by ${t.requestedBy})*`);
        if (status.upcoming.length > 15) lines.push(`…and ${status.upcoming.length - 15} more`);

        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Queue')
            .setColor(0x1DB954)
            .addFields(
                {
                    name: status.paused ? '⏸️ Paused' : '▶️ Now playing',
                    value: status.current ? `${status.current.title} *(by ${status.current.requestedBy})*` : 'Nothing',
                },
                { name: 'Up next', value: lines.length ? lines.join('\n').slice(0, 1024) : 'Nothing else in the queue.' }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
