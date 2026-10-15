// Registers what each scheduled job does, then starts the scheduler.
const scheduler = require('./scheduler');

const JOB_TYPES = {
    unban: 'unban',
    reminder: 'reminder',
};

async function fetchGuild(client, guildId) {
    return client.guilds.cache.get(guildId) || client.guilds.fetch(guildId).catch(() => null);
}

function init(client) {
    scheduler.register(JOB_TYPES.unban, async (c, job) => {
        const guild = await fetchGuild(c, job.data.guildId);
        if (!guild) return;
        await guild.members.unban(job.data.userId, 'Temporary ban ended').catch(error => {
            console.error('Could not lift a temporary ban:', error.message);
        });
    });

    scheduler.register(JOB_TYPES.reminder, async (c, job) => {
        const channel = await c.channels.fetch(job.data.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;
        await channel.send({
            content: `⏰ <@${job.data.userId}> reminder: ${job.data.message}`,
            allowedMentions: { users: [job.data.userId] },
        });
    });

    scheduler.start(client);
}

module.exports = { init, JOB_TYPES };
