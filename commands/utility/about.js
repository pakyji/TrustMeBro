const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBuildInfo } = require('../../lib/build');

const REPO_URL = 'https://github.com/pakyji/TrustMeBro';

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About TrustMeBro: version, features, uptime and links.'),

    async execute(interaction, client) {
        const build = getBuildInfo();
        const embed = new EmbedBuilder()
            .setTitle('🤖 About TrustMeBro')
            .setDescription(
                'A Discord bot for moderation, a few AI-powered jokes, and music from direct audio links.\n\n' +
                '⚠️ **Jokes are jokes.** Fake facts, aura scores and "100% real" answers are for fun. ' +
                'AI answers come from third-party models and can be wrong. Do not rely on them.'
            )
            .addFields(
                { name: 'Version', value: build.version, inline: true },
                { name: 'Build', value: `\`${build.id}\``, inline: true },
                { name: 'Commands', value: `${client.commands.size}`, inline: true },
                { name: 'Ping', value: `${Math.round(client.ws.ping)} ms`, inline: true },
                { name: 'Uptime', value: formatUptime(client.uptime ?? 0), inline: true },
                { name: 'Features', value: '• Moderation (ban, mute, warn, anti-link)\n• AI jokes (/askbro, /heybro, /grokbro, /qwenbro)\n• Music from direct audio links (/play, /queue, /skip, /pause, /resume, /stop)\n• Welcome DMs for new members', inline: false },
                { name: 'Source code', value: REPO_URL, inline: false }
            )
            .setColor(0x00FF00)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
