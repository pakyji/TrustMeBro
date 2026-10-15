const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const music = require('../../lib/music');
const { validateAudioUrl, titleFromUrl, AUDIO_EXTENSIONS } = require('../../lib/source');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a direct audio file link in your voice channel.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('url')
                .setDescription(`Direct link to an audio file (${AUDIO_EXTENSIONS.join(', ')})`)
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
            const url = await validateAudioUrl(interaction.options.getString('url'));
            const track = {
                url: url.href,
                title: titleFromUrl(url.href),
                requestedBy: interaction.user.tag,
            };

            const { position, nowPlaying } = await music.enqueue(
                interaction.guild,
                voiceChannel.id,
                interaction.channel,
                track,
            );

            const text = nowPlaying
                ? `🎶 Starting **${track.title}** in ${voiceChannel.name}...`
                : `✅ Added **${track.title}** to the queue at position ${position}.`;
            return interaction.editReply({ content: text, allowedMentions: { parse: [] } });
        } catch (error) {
            console.error('play command error:', error.message);
            return interaction.editReply({ content: `Bro, I could not play that: ${error.message}`, allowedMentions: { parse: [] } });
        }
    },
};
