const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const store = require('../../lib/store');

const STORE_KEY = 'invites';

function getInviteData(guildId) {
    return store.get(STORE_KEY, {})[guildId] || { tracked: {}, config: {} };
}

function setInviteData(guildId, value) {
    const all = store.get(STORE_KEY, {});
    if (value && (Object.keys(value.tracked || {}).length > 0 || Object.keys(value.config || {}).length > 0)) {
        all[guildId] = value;
    } else {
        delete all[guildId];
    }
    store.set(STORE_KEY, all);
}

function getConfig(guildId) {
    return getInviteData(guildId).config;
}

function setConfig(guildId, config) {
    const data = getInviteData(guildId);
    data.config = config;
    setInviteData(guildId, data);
}

function getTracked(guildId) {
    return getInviteData(guildId).tracked;
}

function setTracked(guildId, tracked) {
    const data = getInviteData(guildId);
    data.tracked = tracked;
    setInviteData(guildId, data);
}

async function fetchInvites(guild) {
    try {
        return await guild.invites.fetch();
    } catch (error) {
        console.error('Failed to fetch invites:', error);
        return new Map();
    }
}

async function updateInviteCache(guild) {
    const invites = await fetchInvites(guild);
    const tracked = getTracked(guild.id);
    const newTracked = {};

    for (const [code, invite] of invites) {
        newTracked[code] = {
            code,
            uses: invite.uses,
            maxUses: invite.maxUses,
            inviterId: invite.inviter?.id || null,
            channelId: invite.channel?.id || null,
            createdAt: invite.createdAt?.getTime() || Date.now(),
            temporary: invite.temporary,
            maxAge: invite.maxAge,
        };
    }

    // Detect joins (new uses)
    for (const [code, oldData] of Object.entries(tracked)) {
        const newData = newTracked[code];
        if (newData && newData.uses > oldData.uses) {
            // Someone joined using this invite
            const config = getConfig(guild.id);
            if (config.logChannelId) {
                const logChannel = guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    const inviter = newData.inviterId ? await guild.members.fetch(newData.inviterId).catch(() => null) : null;
                    await logChannel.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('📥 Member Joined via Invite')
                            .setDescription(`**Invite:** \`${code}\`\n**Inviter:** ${inviter ? inviter.user.tag : 'Unknown'}${inviter ? ` (${inviter.id})` : ''}\n**Uses:** ${oldData.uses} → ${newData.uses}`)
                            .setColor(0x00FF00)
                            .setTimestamp()
                        ]
                    }).catch(() => {});
                }
            }

            // Update inviter stats
            if (newData.inviterId) {
                const inviterKey = `inviter_${newData.inviterId}`;
                if (!newTracked[inviterKey]) {
                    newTracked[inviterKey] = { total: 0, regular: 0, left: 0, fake: 0, bonus: 0 };
                }
                newTracked[inviterKey].total++;
                newTracked[inviterKey].regular++;
            }
        }
    }

    setTracked(guild.id, newTracked);
    return newTracked;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invitestats')
        .setDescription('Invite tracker system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Set up invite tracking.')
                .addChannelOption(option =>
                    option.setName('logchannel')
                        .setDescription('Channel to log invite joins/leaves')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option.setName('welcomechannel')
                        .setDescription('Channel for welcome messages with invite info')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('config')
                .setDescription('Configure invite tracker settings.')
                .addStringOption(option =>
                    option.setName('welcome_message')
                        .setDescription('Welcome message (use {user}, {inviter}, {invites}, {code})')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('dm_welcome')
                        .setDescription('DM welcome message to new members')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('track_fake')
                        .setDescription('Track fake/leave invites (vanity URL joins)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('leaderboard')
                .setDescription('Show invite leaderboard.')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (max 25)')
                        .setMinValue(1)
                        .setMaxValue(25)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('Show invite stats for a user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check (default: yourself)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('Reset invite stats for a user or everyone.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset (omit to reset everyone - requires confirmation)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('confirm')
                        .setDescription('Type "confirm" to reset everyone')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Show invite tracker status.')
        )
        .addSubcommand(sub =>
            sub.setName('sync')
                .setDescription('Manually sync invite cache with Discord.')
        )
        .addSubcommand(sub =>
            sub.setName('addbonus')
                .setDescription('Add bonus invites to a user (admin only).')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to give bonus invites')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Number of bonus invites')
                        .setMinValue(1)
                        .setMaxValue(1000)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('removebonus')
                .setDescription('Remove bonus invites from a user (admin only).')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove bonus invites')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Number of bonus invites to remove')
                        .setMinValue(1)
                        .setMaxValue(1000)
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();

        if (sub === 'setup') {
            const logChannel = interaction.options.getChannel('logchannel');
            const welcomeChannel = interaction.options.getChannel('welcomechannel');

            const config = getConfig(guild.id);
            if (logChannel) config.logChannelId = logChannel.id;
            if (welcomeChannel) config.welcomeChannelId = welcomeChannel.id;

            setConfig(guild.id, config);

            // Initial sync
            await interaction.deferReply({ ephemeral: true });
            await updateInviteCache(guild);

            return interaction.editReply({
                content: `✅ Invite tracker set up!${logChannel ? ` Logs: ${logChannel}` : ''}${welcomeChannel ? ` Welcome: ${welcomeChannel}` : ''}\nCache synced with Discord.`
            });
        }

        if (sub === 'config') {
            const welcomeMessage = interaction.options.getString('welcome_message');
            const dmWelcome = interaction.options.getBoolean('dm_welcome');
            const trackFake = interaction.options.getBoolean('track_fake');

            const config = getConfig(guild.id);
            if (welcomeMessage !== null) config.welcomeMessage = welcomeMessage;
            if (dmWelcome !== null) config.dmWelcome = dmWelcome;
            if (trackFake !== null) config.trackFake = trackFake;

            setConfig(guild.id, config);

            return interaction.reply({
                content: `✅ Invite tracker config updated!`,
                ephemeral: true
            });
        }

        if (sub === 'leaderboard') {
            const limit = interaction.options.getInteger('limit') || 10;
            const tracked = getTracked(guild.id);

            const inviters = Object.entries(tracked)
                .filter(([key]) => key.startsWith('inviter_'))
                .map(([key, data]) => ({
                    userId: key.replace('inviter_', ''),
                    total: data.total || 0,
                    regular: data.regular || 0,
                    left: data.left || 0,
                    fake: data.fake || 0,
                    bonus: data.bonus || 0,
                }))
                .sort((a, b) => (b.total + b.bonus) - (a.total + a.bonus))
                .slice(0, limit);

            if (inviters.length === 0) {
                return interaction.reply({ content: 'No invite data yet. Invite some people!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🏆 Invite Leaderboard')
                .setColor(0x5865F2)
                .setTimestamp();

            for (let i = 0; i < inviters.length; i++) {
                const inv = inviters[i];
                const member = await guild.members.fetch(inv.userId).catch(() => null);
                const total = inv.total + inv.bonus;
                embed.addFields({
                    name: `#${i + 1} ${member ? member.user.tag : 'Unknown User'}`,
                    value: `**Total:** ${total} (Regular: ${inv.regular} | Left: ${inv.left} | Fake: ${inv.fake} | Bonus: ${inv.bonus})`,
                    inline: true,
                });
            }

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'stats') {
            const user = interaction.options.getUser('user') || interaction.user;
            const tracked = getTracked(guild.id);
            const inviterKey = `inviter_${user.id}`;
            const data = tracked[inviterKey] || { total: 0, regular: 0, left: 0, fake: 0, bonus: 0 };

            const total = data.total + data.bonus;

            const embed = new EmbedBuilder()
                .setTitle(`📊 Invite Stats for ${user.tag}`)
                .addFields(
                    { name: 'Total Invites', value: String(total), inline: true },
                    { name: 'Regular', value: String(data.regular || 0), inline: true },
                    { name: 'Left', value: String(data.left || 0), inline: true },
                    { name: 'Fake/Vanity', value: String(data.fake || 0), inline: true },
                    { name: 'Bonus', value: String(data.bonus || 0), inline: true },
                )
                .setColor(0x5865F2)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'reset') {
            const user = interaction.options.getUser('user');
            const confirm = interaction.options.getString('confirm');
            const tracked = getTracked(guild.id);

            if (user) {
                const inviterKey = `inviter_${user.id}`;
                if (tracked[inviterKey]) {
                    delete tracked[inviterKey];
                    setTracked(guild.id, tracked);
                    return interaction.reply({ content: `✅ Reset invite stats for ${user.tag}.`, ephemeral: true });
                }
                return interaction.reply({ content: `Bro, ${user.tag} has no invite stats.`, ephemeral: true });
            }

            if (confirm !== 'confirm') {
                return interaction.reply({ content: 'Bro, this will reset EVERYONE\'s invites. Run again with `confirm: "confirm"` to proceed.', ephemeral: true });
            }

            // Reset all inviter stats
            for (const key of Object.keys(tracked)) {
                if (key.startsWith('inviter_')) {
                    delete tracked[key];
                }
            }
            setTracked(guild.id, tracked);

            return interaction.reply({ content: '✅ Reset invite stats for everyone.', ephemeral: true });
        }

        if (sub === 'status') {
            const config = getConfig(guild.id);
            const tracked = getTracked(guild.id);
            const inviterCount = Object.keys(tracked).filter(k => k.startsWith('inviter_')).length;
            const inviteCodeCount = Object.keys(tracked).filter(k => !k.startsWith('inviter_')).length;

            const embed = new EmbedBuilder()
                .setTitle('📥 Invite Tracker Status')
                .addFields(
                    { name: 'Log Channel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Not set', inline: true },
                    { name: 'Welcome Channel', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Not set', inline: true },
                    { name: 'DM Welcome', value: config.dmWelcome ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Track Fake', value: config.trackFake ? 'Enabled' : 'Disabled', inline: true },
                    { name: 'Welcome Message', value: config.welcomeMessage || 'Default', inline: true },
                    { name: 'Tracked Invite Codes', value: String(inviteCodeCount), inline: true },
                    { name: 'Tracked Inviters', value: String(inviterCount), inline: true },
                )
                .setColor(0x5865F2)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'sync') {
            await interaction.deferReply({ ephemeral: true });
            await updateInviteCache(guild);
            return interaction.editReply({ content: '✅ Invite cache synced with Discord!' });
        }

        if (sub === 'addbonus') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const tracked = getTracked(guild.id);
            const inviterKey = `inviter_${user.id}`;

            if (!tracked[inviterKey]) {
                tracked[inviterKey] = { total: 0, regular: 0, left: 0, fake: 0, bonus: 0 };
            }
            tracked[inviterKey].bonus = (tracked[inviterKey].bonus || 0) + amount;
            setTracked(guild.id, tracked);

            return interaction.reply({ content: `✅ Added ${amount} bonus invites to ${user.tag}.`, ephemeral: true });
        }

        if (sub === 'removebonus') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const tracked = getTracked(guild.id);
            const inviterKey = `inviter_${user.id}`;

            if (!tracked[inviterKey]) {
                return interaction.reply({ content: `Bro, ${user.tag} has no invite stats.`, ephemeral: true });
            }
            tracked[inviterKey].bonus = Math.max(0, (tracked[inviterKey].bonus || 0) - amount);
            setTracked(guild.id, tracked);

            return interaction.reply({ content: `✅ Removed ${amount} bonus invites from ${user.tag}.`, ephemeral: true });
        }
    },

    async handleGuildMemberAdd(member) {
        const guild = member.guild;
        const config = getConfig(guild.id);
        if (!config.logChannelId && !config.welcomeChannelId && !config.dmWelcome) return;

        // Wait a bit for Discord to update invite uses
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newInvites = await fetchInvites(guild);
        const tracked = getTracked(guild.id);

        let usedInvite = null;
        let inviterId = null;

        for (const [code, invite] of newInvites) {
            const oldData = tracked[code];
            if (oldData && invite.uses > oldData.uses) {
                usedInvite = code;
                inviterId = invite.inviter?.id || null;
                break;
            }
        }

        // If no invite found, might be vanity URL
        if (!usedInvite && config.trackFake) {
            for (const [code, invite] of newInvites) {
                if (invite.uses > 0 && !tracked[code]) {
                    usedInvite = code;
                    inviterId = invite.inviter?.id || null;
                    break;
                }
            }
        }

        // Update cache
        await updateInviteCache(guild);

        const inviter = inviterId ? await guild.members.fetch(inviterId).catch(() => null) : null;
        const welcomeMessage = config.welcomeMessage || 'Welcome {user}! Invited by {inviter} ({invites} invites)';

        const replacements = {
            user: member.toString(),
            inviter: inviter ? inviter.toString() : 'Unknown',
            invites: inviter ? ((getTracked(guild.id)[`inviter_${inviter.id}`]?.total || 0) + (getTracked(guild.id)[`inviter_${inviter.id}`]?.bonus || 0)) : 0,
            code: usedInvite || 'Unknown',
        };

        const finalMessage = welcomeMessage.replace(/{user}/g, replacements.user)
            .replace(/{inviter}/g, replacements.inviter)
            .replace(/{invites}/g, replacements.invites)
            .replace(/{code}/g, replacements.code);

        // Send welcome
        if (config.welcomeChannelId) {
            const channel = guild.channels.cache.get(config.welcomeChannelId);
            if (channel) {
                await channel.send({ content: finalMessage }).catch(() => {});
            }
        }

        if (config.dmWelcome) {
            await member.send({ content: finalMessage }).catch(() => {});
        }

        // Log
        if (config.logChannelId) {
            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                await logChannel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('📥 Member Joined')
                        .setDescription(`**User:** ${member.user.tag} (${member.id})\n**Invite:** \`${usedInvite || 'Vanity/Unknown'}\`\n**Inviter:** ${inviter ? inviter.user.tag : 'Unknown'}${inviter ? ` (${inviter.id})` : ''}`)
                        .setColor(0x00FF00)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp()
                    ]
                }).catch(() => {});
            }
        }
    },

    async handleGuildMemberRemove(member) {
        const guild = member.guild;
        const config = getConfig(guild.id);
        if (!config.logChannelId) return;

        const tracked = getTracked(guild.id);

        // Find which invite they used (approximate - check who has lost a use)
        // This is tricky, so we'll just log the leave
        const logChannel = guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
            await logChannel.send({
                embeds: [new EmbedBuilder()
                    .setTitle('📤 Member Left')
                    .setDescription(`**User:** ${member.user.tag} (${member.id})`)
                    .setColor(0xFF0000)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                ]
            }).catch(() => {});
        }

        // Update inviter stats (decrease regular, increase left)
        // We can't easily know which invite they used, so we skip this for now
    },

    // Export for scheduler to call periodically
    async syncAllGuilds(client) {
        for (const guild of client.guilds.cache.values()) {
            try {
                await updateInviteCache(guild);
            } catch (error) {
                console.error(`Failed to sync invites for ${guild.name}:`, error);
            }
        }
    },
};