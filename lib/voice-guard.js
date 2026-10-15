// Helper shared by the queue controls (queue, skip, pause, resume, stop).
// The user must be in the same voice channel as the bot before they can control playback.
function checkSameVoiceChannel(interaction, music) {
    if (!interaction.guild) return 'Bro, music only works in a server.';

    const session = music.getSession(interaction.guild.id);
    if (!session) return 'Bro, I am not playing anything right now.';

    const userChannel = interaction.member?.voice?.channelId;
    if (userChannel !== session.channelId) {
        return 'Bro, join my voice channel to control the music.';
    }
    return null;
}

module.exports = { checkSameVoiceChannel };
