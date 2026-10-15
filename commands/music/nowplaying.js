const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const music = require('../../lib/music');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the track that is playing now.')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) return interaction.reply({ content: 'Bro, music only works in a server.', ephemeral: true });
        const status = music.status(interaction.guild.id);
        if (!status || !status.current) return interaction.reply({ content: 'Bro, nothing is playing right now.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('🎧 Now playing')
            .setDescription(`**${status.current.title}**`)
            .addFields(
                { name: 'Requested by', value: String(status.current.requestedBy || 'Unknown'), inline: true },
                { name: 'State', value: status.paused ? '⏸️ Paused' : '▶️ Playing', inline: true },
                { name: 'Loop', value: status.loop, inline: true },
                { name: 'Volume', value: `${status.volume}%`, inline: true },
                { name: 'Up next', value: String(status.upcoming.length), inline: true },
            )
            .setColor(0x1DB954);
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
