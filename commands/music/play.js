const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const music = require('../../lib/music');
const { validateAudioUrl, assertPublicHost, titleFromUrl } = require('../../lib/source');
const { searchSong, isHost } = require('../../lib/search');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song by name, or a direct audio file link.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('A song or artist name, or a direct link to an audio file')
                .setRequired(true)
                .setMaxLength(500)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, music only works in a server.', ephemeral: true });
        }

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'Bro, join a voice channel first!', ephemeral: true });
        }

        const me = interaction.guild.members.me;
        const perms = voiceChannel.permissionsFor(me);
        if (!perms || !perms.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
            return interaction.reply({ content: 'Bro, I need the Connect and Speak permissions in that voice channel.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const input = interaction.options.getString('query').trim();
            let track;

            if (/^https?:\/\//i.test(input)) {
                // Direct link: any public audio file.
                const url = await validateAudioUrl(input);
                track = { url: url.href, title: titleFromUrl(url.href), requestedBy: interaction.user.tag };
            } else {
                // Song name: search Audius, then the Internet Archive, and play the best match.
                const hit = await searchSong(input);
                if (!isHost(hit.audioUrl, ['api.audius.co', 'archive.org'])) {
                    throw new Error('The search result had an unexpected link.');
                }
                await assertPublicHost(new URL(hit.audioUrl).hostname);
                track = {
                    url: hit.audioUrl,
                    title: `${hit.artist} - ${hit.title}`,
                    requestedBy: interaction.user.tag,
                    source: hit.source,
                };
            }

            const { position, nowPlaying } = await music.enqueue(
                interaction.guild,
                voiceChannel.id,
                interaction.channel,
                track,
            );

            const text = nowPlaying
                ? `🎶 Starting **${track.title}** in ${voiceChannel.name}...`
                : `✅ Added **${track.title}** to the queue at position ${position}.`;
            const credit = track.source ? `\n*Found on ${track.source}.*` : '';
            return interaction.editReply({ content: text + credit, allowedMentions: { parse: [] } });
        } catch (error) {
            console.error('play command error:', error.message);
            return interaction.editReply({ content: `Bro, I could not play that: ${error.message}`, allowedMentions: { parse: [] } });
        }
    },
};
