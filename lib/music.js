const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    NoSubscriberBehavior,
    StreamType,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { TrackQueue } = require('./queue');
const { openAudioSource } = require('./source');

// The bot leaves the voice channel after this long with an empty queue.
const IDLE_LEAVE_MS = 3 * 60 * 1000;

// guildId -> session. A session is one voice connection plus its queue.
const sessions = new Map();

function notify(session, text) {
    if (!session.textChannel) return;
    session.textChannel.send({ content: text, allowedMentions: { parse: [] } }).catch(() => {});
}

/**
 * Starts ffmpeg to turn the audio file into raw 48 kHz stereo PCM, which Discord needs.
 * Returns the audio resource and a cleanup function that stops the download and ffmpeg.
 */
async function createTrackResource(url) {
    if (!ffmpegPath) throw new Error('ffmpeg is not available on this host.');

    const body = await openAudioSource(url);
    const ff = spawn(ffmpegPath, [
        '-hide_banner', '-loglevel', 'error',
        '-i', 'pipe:0',
        '-f', 's16le', '-ar', '48000', '-ac', '2',
        'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    let cleanedUp = false;
    const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        body.destroy();
        ff.kill('SIGKILL');
    };

    ff.stderr.on('data', (chunk) => console.error('ffmpeg:', chunk.toString().trim()));
    ff.stdin.on('error', () => { /* ffmpeg closed early, nothing to do */ });
    ff.on('error', (error) => console.error('ffmpeg could not start:', error.message));
    body.on('error', () => cleanup());
    body.pipe(ff.stdin);

    const resource = createAudioResource(ff.stdout, { inputType: StreamType.Raw });
    return { resource, cleanup };
}

function clearIdleTimer(session) {
    if (session.idleTimer) {
        clearTimeout(session.idleTimer);
        session.idleTimer = null;
    }
}

function startIdleTimer(session) {
    clearIdleTimer(session);
    session.idleTimer = setTimeout(() => {
        notify(session, '👋 Queue is empty, so I am leaving the voice channel. Bye bro!');
        destroySession(session.guildId);
    }, IDLE_LEAVE_MS);
}

// Stops the current track and frees its download/ffmpeg process.
function finishCurrent(session) {
    if (session.current && session.current.cleanup) session.current.cleanup();
    session.current = null;
}

// Plays the next queued track. Tracks that fail to load are reported and skipped.
async function advance(session) {
    if (session.busy || session.stopped) return;
    session.busy = true;

    try {
        for (;;) {
            const track = session.queue.next();
            if (!track) {
                startIdleTimer(session);
                return;
            }

            clearIdleTimer(session);
            try {
                const { resource, cleanup } = await createTrackResource(track.url);
                if (session.stopped) {
                    cleanup();
                    return;
                }
                session.current = { ...track, cleanup };
                session.player.play(resource);
                notify(session, `🎶 Now playing **${track.title}** (requested by ${track.requestedBy})`);
                return;
            } catch (error) {
                notify(session, `⚠️ Skipped **${track.title}**: ${error.message}`);
            }
        }
    } finally {
        session.busy = false;
    }
}

function createSession(guild, channelId, textChannel) {
    const connection = joinVoiceChannel({
        channelId,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
    });
    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

    const session = {
        guildId: guild.id,
        channelId,
        textChannel,
        connection,
        player,
        queue: new TrackQueue(),
        current: null,
        busy: false,
        stopped: false,
        idleTimer: null,
    };

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        finishCurrent(session);
        advance(session);
    });

    player.on('error', (error) => {
        console.error('Audio player error:', error.message);
        const title = session.current ? session.current.title : 'the track';
        finishCurrent(session);
        notify(session, `⚠️ Could not play **${title}**. Skipping.`);
        advance(session);
    });

    connection.on('error', (error) => console.error('Voice connection error:', error.message));

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        // Try to recover from a move or a brief network drop. Otherwise, clean up.
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch {
            destroySession(guild.id);
        }
    });

    sessions.set(guild.id, session);
    return session;
}

/** Stops playback, empties the queue, and leaves the voice channel. */
function destroySession(guildId) {
    const session = sessions.get(guildId);
    if (!session) return false;

    session.stopped = true;
    clearIdleTimer(session);
    session.queue.clear();
    finishCurrent(session);
    try {
        session.player.stop(true);
    } catch { /* already stopped */ }
    try {
        session.connection.destroy();
    } catch { /* already destroyed */ }
    sessions.delete(guildId);
    return true;
}

/** Returns the session for the guild, creating and connecting one if needed. */
async function ensureSession(guild, channelId, textChannel) {
    const existing = sessions.get(guild.id);
    if (existing) {
        if (existing.channelId !== channelId) {
            throw new Error('I am already playing music in another voice channel here.');
        }
        return existing;
    }

    const session = createSession(guild, channelId, textChannel);
    try {
        await entersState(session.connection, VoiceConnectionStatus.Ready, 20_000);
    } catch {
        destroySession(guild.id);
        throw new Error('I could not connect to that voice channel. Check my Connect and Speak permissions.');
    }
    return session;
}

/** Adds a track and starts playback when nothing is playing. Returns { position, nowPlaying }. */
async function enqueue(guild, channelId, textChannel, track) {
    const session = await ensureSession(guild, channelId, textChannel);
    session.textChannel = textChannel;

    const position = session.queue.add(track);
    if (position === -1) throw new Error('The queue is full (50 tracks). Wait for some to finish.');

    const nowPlaying = !session.current && !session.busy;
    if (nowPlaying) advance(session);
    return { position, nowPlaying };
}

function getSession(guildId) {
    return sessions.get(guildId) || null;
}

function skip(guildId) {
    const session = sessions.get(guildId);
    if (!session || !session.current) return false;
    finishCurrent(session);
    session.player.stop(true); // Idle event then loads the next track
    return true;
}

function pause(guildId) {
    const session = sessions.get(guildId);
    if (!session || !session.current) return false;
    return session.player.pause();
}

function resume(guildId) {
    const session = sessions.get(guildId);
    if (!session || !session.current) return false;
    return session.player.unpause();
}

function status(guildId) {
    const session = sessions.get(guildId);
    if (!session) return null;
    return {
        current: session.current,
        paused: session.player.state.status === AudioPlayerStatus.Paused,
        upcoming: session.queue.list(),
    };
}

module.exports = {
    enqueue,
    skip,
    pause,
    resume,
    status,
    destroySession,
    getSession,
};
