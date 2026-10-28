const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { execSync } = require('child_process');
const path = require('path');
const announce = require('../../lib/announce');
const { getBuildInfo } = require('../../lib/build');

const ROOT = path.join(__dirname, '..', '..');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Set the channel where TrustMeBro posts a live message (with @everyone) after each update.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Choose the channel for update announcements.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Text channel to post in')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Send the live message now, to check the channel and permissions.')
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Show the announcement channel and the last announced build.')
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('Turn update announcements off for this server.')
        )
        .addSubcommand(sub =>
            sub.setName('update')
                .setDescription('Check for updates, pull changes, and announce to Discord.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What to do')
                        .setRequired(true)
                        .addChoices(
                            { name: 'check', value: 'check' },
                            { name: 'apply', value: 'apply' },
                            { name: 'restart', value: 'restart' },
                        )
                )
        ),

    async execute(interaction, client) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();
        const build = getBuildInfo();
        const settings = announce.getSettings(guild.id);

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            const perms = channel.permissionsFor(guild.members.me);
            const missing = [];
            if (!perms?.has(PermissionFlagsBits.SendMessages)) missing.push('Send Messages');
            if (!perms?.has(PermissionFlagsBits.MentionEveryone)) missing.push('Mention Everyone');
            if (missing.length) {
                return interaction.reply({
                    content: `Bro, I need these permissions in ${channel}: ${missing.join(', ')}.`,
                    ephemeral: true,
                });
            }

            // The current build counts as announced, so setting this up does not ping anyone.
            announce.setSettings(guild.id, { channelId: channel.id, lastBuild: build.id });
            return interaction.reply({
                content: `✅ Done. Next time I start with a new version, I will post the live message with @everyone in ${channel}. Use \`/announce test\` to check it now.`,
                ephemeral: true,
            });
        }

        if (sub === 'test') {
            if (!settings) {
                return interaction.reply({ content: 'Bro, set a channel first with `/announce channel`.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const result = await announce.sendLiveMessage(guild, settings.channelId, build, { test: true })
                .catch(error => ({ ok: false, reason: error.message }));
            return interaction.editReply({
                content: result.ok ? '✅ Test message sent.' : `Bro, could not send it: ${result.reason}`,
            });
        }

        if (sub === 'status') {
            if (!settings) {
                return interaction.reply({ content: 'Update announcements are off for this server. Use `/announce channel` to turn them on.', ephemeral: true });
            }
            return interaction.reply({
                content: `📣 Channel: <#${settings.channelId}>\nLast announced build: \`${settings.lastBuild || 'none'}\`\nRunning build: \`${build.id}\``,
                ephemeral: true,
                allowedMentions: { parse: [] },
            });
        }

        if (sub === 'off') {
            announce.setSettings(guild.id, null);
            return interaction.reply({ content: '🔕 Update announcements are off for this server.', ephemeral: true });
        }

        if (sub === 'update') {
            const action = interaction.options.getString('action');
            await interaction.deferReply({ ephemeral: true });

            try {
                if (action === 'check') {
                    execSync('git fetch origin', { cwd: ROOT, stdio: 'pipe', timeout: 10000 });

                    const currentCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
                    const remoteCommit = execSync('git rev-parse --short origin/main', { cwd: ROOT, encoding: 'utf8' }).trim();

                    if (currentCommit === remoteCommit) {
                        return interaction.editReply({ content: '✅ You are already on the latest version!', ephemeral: true });
                    }

                    const log = execSync(`git log --oneline ${currentCommit}..origin/main`, { cwd: ROOT, encoding: 'utf8' }).trim();
                    const changes = log.split('\n').slice(0, 10).join('\n');

                    const embed = new EmbedBuilder()
                        .setTitle('🔄 Update Available')
                        .setDescription(`Current: \`${currentCommit}\`\nLatest: \`${remoteCommit}\``)
                        .addFields(
                            { name: 'Commits behind', value: log.split('\n').length.toString(), inline: true },
                            { name: 'Changes', value: changes || 'No changes', inline: false }
                        )
                        .setColor(0xFFAA00)
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                if (action === 'apply') {
                    const output = execSync('git pull origin main', { cwd: ROOT, encoding: 'utf8', timeout: 30000 });

                    if (output.includes('Already up to date')) {
                        return interaction.editReply({ content: '✅ Already up to date!', ephemeral: true });
                    }

                    const newCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
                    const subject = execSync('git log -1 --pretty=%s', { cwd: ROOT, encoding: 'utf8' }).trim();

                    // Send update announcement to Discord
                    const build = getBuildInfo();
                    const announceResults = await announce.announceUpdate(client, build);
                    const announceText = announceResults.map(r => r.ok ? `✅ ${r.guildId}` : `❌ ${r.guildId}: ${r.reason}`).join('\n');

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Update Applied')
                        .setDescription(`Pulled latest changes from GitHub.`)
                        .addFields(
                            { name: 'New Commit', value: `\`${newCommit}\``, inline: true },
                            { name: 'Subject', value: subject, inline: false }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    return interaction.editReply({
                        content: `⚠️ **Restart the bot to apply changes.** Use \`/announce update restart\` or restart via your process manager (PM2, systemd, etc.).\n\n**Announcements sent:**\n${announceText}`,
                        embeds: [embed],
                        ephemeral: true,
                    });
                }

                if (action === 'restart') {
                    const pullOutput = execSync('git pull origin main', { cwd: ROOT, encoding: 'utf8', timeout: 30000 });

                    if (pullOutput.includes('Already up to date')) {
                        return interaction.editReply({ content: '✅ Already up to date! No restart needed.', ephemeral: true });
                    }

                    const newCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
                    const subject = execSync('git log -1 --pretty=%s', { cwd: ROOT, encoding: 'utf8' }).trim();

                    let restartMethod = 'manual';
                    let restartMessage = '';

                    try {
                        execSync('pm2 restart trustmebro', { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
                        restartMethod = 'pm2';
                        restartMessage = 'Restarting via PM2...';
                    } catch {
                        try {
                            execSync('pm2 restart all', { cwd: ROOT, encoding: 'utf8', timeout: 10000 });
                            restartMethod = 'pm2';
                            restartMessage = 'Restarting all PM2 processes...';
                        } catch {
                            restartMessage = '⚠️ Could not auto-restart. Please restart the bot manually (PM2, systemd, Docker, etc.).';
                        }
                    }

                    // Send update announcement to Discord
                    const build = getBuildInfo();
                    const announceResults = await announce.announceUpdate(client, build);
                    const announceText = announceResults.map(r => r.ok ? `✅ ${r.guildId}` : `❌ ${r.guildId}: ${r.reason}`).join('\n');

                    const embed = new EmbedBuilder()
                        .setTitle('🔄 Update & Restart')
                        .setDescription(`${restartMessage}\n\nNew version: \`${newCommit}\`\nChanges: ${subject}`)
                        .setColor(0x00AAFF)
                        .setTimestamp();

                    await interaction.editReply({
                        content: `**Announcements sent:**\n${announceText}`,
                        embeds: [embed],
                        ephemeral: true,
                    });

                    if (restartMethod !== 'pm2') {
                        console.log('Update applied. Manual restart required.');
                        return;
                    }

                    setTimeout(() => process.exit(0), 1000);
                }
            } catch (error) {
                console.error('Update error:', error);
                return interaction.editReply({ content: `Bro, update failed: ${error.message}\n\`\`\`${error.stdout || ''}\`\`\``, ephemeral: true });
            }
        }
    },
};
