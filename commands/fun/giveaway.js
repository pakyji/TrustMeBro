const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const store = require('../../lib/store');
const crypto = require('crypto');

const STORE_KEY = 'giveaways';

function getGiveaways(guildId) {
    return store.get(STORE_KEY, {})[guildId] || {};
}

function setGiveaways(guildId, value) {
    const all = store.get(STORE_KEY, {});
    if (value && Object.keys(value).length > 0) all[guildId] = value;
    else delete all[guildId];
    store.set(STORE_KEY, all);
}

function getGiveaway(guildId, messageId) {
    return getGiveaways(guildId)[messageId];
}

function setGiveaway(guildId, messageId, data) {
    const all = getGiveaways(guildId);
    all[messageId] = data;
    setGiveaways(guildId, all);
}

function deleteGiveaway(guildId, messageId) {
    const all = getGiveaways(guildId);
    delete all[messageId];
    setGiveaways(guildId, all);
}

function parseDuration(input) {
    const match = input.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

function formatDuration(ms) {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
    return `${Math.floor(ms / 86400000)}d`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create and manage giveaways.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a new giveaway.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to host the giveaway')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration (e.g., 1h, 30m, 1d)')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Prize description')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('required_role')
                        .setDescription('Required role to enter (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('End a giveaway early.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the giveaway')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Reroll winners for a giveaway.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the giveaway')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List active giveaways in this server.')
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const channel = interaction.options.getChannel('channel');
            const durationStr = interaction.options.getString('duration');
            const winnersCount = interaction.options.getInteger('winners') || 1;
            const prize = interaction.options.getString('prize');
            const requiredRole = interaction.options.getRole('required_role');

            const duration = parseDuration(durationStr);
            if (!duration) {
                return interaction.reply({ content: 'Bro, invalid duration. Use format like `1h`, `30m`, `1d`.', ephemeral: true });
            }

            if (duration < 10000) {
                return interaction.reply({ content: 'Bro, minimum duration is 10 seconds.', ephemeral: true });
            }

            if (duration > 30 * 86400000) {
                return interaction.reply({ content: 'Bro, maximum duration is 30 days.', ephemeral: true });
            }

            const perms = channel.permissionsFor(guild.members.me);
            if (!perms?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                return interaction.reply({ content: `Bro, I need View Channel, Send Messages, and Embed Links in ${channel}.`, ephemeral: true });
            }

            const endTime = Date.now() + duration;
            const giveawayId = crypto.randomUUID();

            const embed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY 🎉')
                .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)\n${requiredRole ? `**Required Role:** ${requiredRole}` : ''}`)
                .setColor(0xFF69B4)
                .setFooter({ text: `Giveaway ID: ${giveawayId.slice(0, 8)} | Hosted by ${interaction.user.tag}` })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_enter_${giveawayId}`)
                    .setLabel('Enter Giveaway')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎉')
            );

            const message = await channel.send({ embeds: [embed], components: [row] });

            setGiveaway(guild.id, message.id, {
                id: giveawayId,
                channelId: channel.id,
                messageId: message.id,
                prize,
                winnersCount,
                endTime,
                requiredRoleId: requiredRole?.id || null,
                hostId: interaction.user.id,
                ended: false,
                participants: [],
            });

            // Schedule end
            setTimeout(() => this.endGiveaway(guild, message.id), duration);

            return interaction.reply({ content: `✅ Giveaway created in ${channel}! Ends <t:${Math.floor(endTime / 1000)}:R>.`, ephemeral: true });
        }

        if (sub === 'end') {
            const messageId = interaction.options.getString('message_id');
            const giveaway = getGiveaway(guild.id, messageId);

            if (!giveaway) {
                return interaction.reply({ content: 'Bro, giveaway not found. Check the message ID.', ephemeral: true });
            }

            if (giveaway.ended) {
                return interaction.reply({ content: 'Bro, this giveaway already ended.', ephemeral: true });
            }

            await this.endGiveaway(guild, messageId);
            return interaction.reply({ content: '✅ Giveaway ended early!', ephemeral: true });
        }

        if (sub === 'reroll') {
            const messageId = interaction.options.getString('message_id');
            const giveaway = getGiveaway(guild.id, messageId);

            if (!giveaway) {
                return interaction.reply({ content: 'Bro, giveaway not found. Check the message ID.', ephemeral: true });
            }

            if (!giveaway.ended) {
                return interaction.reply({ content: 'Bro, giveaway has not ended yet.', ephemeral: true });
            }

            if (giveaway.participants.length === 0) {
                return interaction.reply({ content: 'Bro, no participants to reroll.', ephemeral: true });
            }

            await this.rerollGiveaway(guild, messageId);
            return interaction.reply({ content: '✅ Giveaway rerolled!', ephemeral: true });
        }

        if (sub === 'list') {
            const giveaways = getGiveaways(guild.id);
            const active = Object.entries(giveaways).filter(([, g]) => !g.ended);

            if (active.length === 0) {
                return interaction.reply({ content: 'No active giveaways in this server.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎉 Active Giveaways')
                .setColor(0xFF69B4);

            for (const [messageId, g] of active) {
                const channel = guild.channels.cache.get(g.channelId);
                embed.addFields({
                    name: `${g.prize}`,
                    value: `Channel: ${channel ? `<#${channel.id}>` : 'Deleted'}\nEnds: <t:${Math.floor(g.endTime / 1000)}:R>\nWinners: ${g.winnersCount}\nMessage ID: \`${messageId}\``,
                    inline: true,
                });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('giveaway_enter_')) return;

        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this only works in a server.', ephemeral: true });
        }

        const giveawayId = interaction.customId.replace('giveaway_enter_', '');
        const guild = interaction.guild;

        // Find giveaway by ID
        const giveaways = getGiveaways(guild.id);
        const entry = Object.entries(giveaways).find(([, g]) => g.id === giveawayId);
        if (!entry) {
            return interaction.reply({ content: 'Bro, giveaway not found.', ephemeral: true });
        }

        const [messageId, giveaway] = entry;

        if (giveaway.ended) {
            return interaction.reply({ content: 'Bro, this giveaway has ended.', ephemeral: true });
        }

        // Check required role
        if (giveaway.requiredRoleId && !interaction.member.roles.cache.has(giveaway.requiredRoleId)) {
            const role = guild.roles.cache.get(giveaway.requiredRoleId);
            return interaction.reply({ content: `Bro, you need the ${role?.name || 'required role'} to enter.`, ephemeral: true });
        }

        // Check if already entered
        if (giveaway.participants.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Bro, you already entered this giveaway!', ephemeral: true });
        }

        // Add participant
        giveaway.participants.push(interaction.user.id);
        setGiveaway(guild.id, messageId, giveaway);

        return interaction.reply({ content: '✅ You entered the giveaway! Good luck!', ephemeral: true });
    },

    async endGiveaway(guild, messageId) {
        const giveaway = getGiveaway(guild.id, messageId);
        if (!giveaway || giveaway.ended) return;

        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;

        giveaway.ended = true;
        setGiveaway(guild.id, messageId, giveaway);

        // Pick winners
        const winners = [];
        const participants = [...giveaway.participants];
        const count = Math.min(giveaway.winnersCount, participants.length);

        for (let i = 0; i < count; i++) {
            const idx = crypto.randomInt(participants.length);
            winners.push(participants.splice(idx, 1)[0]);
        }

        const winnerMentions = winners.map(id => `<@${id}>`).join(', ') || 'No valid participants';

        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY ENDED 🎉')
            .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnerMentions}\n**Participants:** ${giveaway.participants.length}`)
            .setColor(0x00FF00)
            .setFooter({ text: `Giveaway ID: ${giveaway.id.slice(0, 8)}` })
            .setTimestamp();

        // Disable button
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_enter_${giveaway.id}`)
                .setLabel('Ended')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
                .setEmoji('🎉')
        );

        await message.edit({ embeds: [embed], components: [row] }).catch(() => {});

        // Announce winners
        await channel.send({
            content: `🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`,
            allowedMentions: { users: winners },
        }).catch(() => {});

        // DM winners
        for (const winnerId of winners) {
            const winner = await guild.members.fetch(winnerId).catch(() => null);
            if (winner) {
                await winner.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🎉 You Won!')
                        .setDescription(`Congratulations! You won **${giveaway.prize}** in **${guild.name}**!`)
                        .setColor(0xFF69B4)
                        .setTimestamp()
                    ]
                }).catch(() => {});
            }
        }

        // Clean up after 24 hours
        setTimeout(() => deleteGiveaway(guild.id, messageId), 24 * 3600000);
    },

    async rerollGiveaway(guild, messageId) {
        const giveaway = getGiveaway(guild.id, messageId);
        if (!giveaway || !giveaway.ended) return;

        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;

        if (giveaway.participants.length === 0) return;

        // Pick new winners
        const winners = [];
        const participants = [...giveaway.participants];
        const count = Math.min(giveaway.winnersCount, participants.length);

        for (let i = 0; i < count; i++) {
            const idx = crypto.randomInt(participants.length);
            winners.push(participants.splice(idx, 1)[0]);
        }

        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

        // Announce new winners
        await channel.send({
            content: `🔄 **Rerolled!** New winners: ${winnerMentions} for **${giveaway.prize}**!`,
            allowedMentions: { users: winners },
        }).catch(() => {});

        // DM new winners
        for (const winnerId of winners) {
            const winner = await guild.members.fetch(winnerId).catch(() => null);
            if (winner) {
                await winner.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🎉 You Won (Reroll)!')
                        .setDescription(`Congratulations! You won **${giveaway.prize}** in **${guild.name}** (reroll)!`)
                        .setColor(0xFF69B4)
                        .setTimestamp()
                    ]
                }).catch(() => {});
            }
        }
    },
};