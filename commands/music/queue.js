const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const music = require('../../lib/music');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue.')
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('show')
                .setDescription('Show the current music queue.')
        )
        .addSubcommand(sub =>
            sub.setName('export')
                .setDescription('Export the current queue as JSON.')
        )
        .addSubcommand(sub =>
            sub.setName('import')
                .setDescription('Import a queue from JSON.')
                .addStringOption(option =>
                    option.setName('data')
                        .setDescription('JSON queue data to import')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, music only works in a server.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'show') {
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
        }

        if (sub === 'export') {
            const status = music.status(interaction.guild.id);
            if (!status || (!status.current && status.upcoming.length === 0)) {
                return interaction.reply({ content: 'Bro, the queue is empty. Nothing to export.', ephemeral: true });
            }

            const queueData = {
                current: status.current ? { url: status.current.url, title: status.current.title, requestedBy: status.current.requestedBy, source: status.current.source } : null,
                queue: status.upcoming.map(t => ({ url: t.url, title: t.title, requestedBy: t.requestedBy, source: t.source })),
                loop: status.loop,
                volume: status.volume,
            };

            return interaction.reply({
                content: 'Here\'s your queue JSON (copy and save it):',
                ephemeral: true,
            }).then(() => interaction.followUp({
                content: `\`\`\`json\n${JSON.stringify(queueData, null, 2)}\n\`\`\``,
                ephemeral: true,
            }));
        }

        if (sub === 'import') {
            const dataString = interaction.options.getString('data');
            let queueData;
            try {
                queueData = JSON.parse(dataString);
            } catch {
                return interaction.reply({ content: 'Bro, invalid JSON. Make sure you copied it correctly.', ephemeral: true });
            }

            if (!queueData.queue || !Array.isArray(queueData.queue)) {
                return interaction.reply({ content: 'Bro, invalid queue format. Need "queue" array.', ephemeral: true });
            }

            const voiceChannel = interaction.member?.voice?.channel;
            if (!voiceChannel) {
                return interaction.reply({ content: 'Bro, join a voice channel first!', ephemeral: true });
            }

            await interaction.deferReply();

            try {
                const session = await music.ensureSession(interaction.guild, voiceChannel.id, interaction.channel);

                // Add current track if provided
                if (queueData.current) {
                    await music.enqueue(interaction.guild, voiceChannel.id, interaction.channel, queueData.current);
                }

                // Add queued tracks
                let added = 0;
                for (const track of queueData.queue) {
                    if (session.queue.size >= 50) break;
                    await music.enqueue(interaction.guild, voiceChannel.id, interaction.channel, track);
                    added++;
                }

                // Restore loop mode
                if (queueData.loop) {
                    music.setLoop(interaction.guild.id, queueData.loop);
                }

                // Restore volume
                if (queueData.volume) {
                    music.setVolume(interaction.guild.id, queueData.volume);
                }

                return interaction.editReply({ content: `✅ Imported ${added} track(s) to the queue.` });
            } catch (error) {
                console.error('Queue import error:', error);
                return interaction.editReply({ content: `Bro, import failed: ${error.message}` });
            }
        }
    },
};
