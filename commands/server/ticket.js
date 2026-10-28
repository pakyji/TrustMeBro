const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const store = require('../../lib/store');

const STORE_KEY = 'tickets';

function getSettings(guildId) {
    return store.get(STORE_KEY, {})[guildId] || {};
}

function setSettings(guildId, value) {
    const all = store.get(STORE_KEY, {});
    if (value && Object.keys(value).length > 0) all[guildId] = value;
    else delete all[guildId];
    store.set(STORE_KEY, all);
}

function generateTicketId() {
    return `ticket-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system for support.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Set up the ticket system.')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category to create tickets in')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('logchannel')
                        .setDescription('Channel for ticket logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('supportrole')
                        .setDescription('Role that can manage tickets')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('panel')
                .setDescription('Create a ticket panel in a channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the panel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Panel title')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Panel description')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('close')
                .setDescription('Close the current ticket channel.')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('claim')
                .setDescription('Claim a ticket as yours.')
        )
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a user to the ticket.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a user from the ticket.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('transcript')
                .setDescription('Generate a transcript of the ticket.')
        )
        .addSubcommand(sub =>
            sub.setName('settings')
                .setDescription('Show ticket system settings.')
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();
        const settings = getSettings(guild.id);

        if (sub === 'setup') {
            const category = interaction.options.getChannel('category');
            const logChannel = interaction.options.getChannel('logchannel');
            const supportRole = interaction.options.getRole('supportrole');

            // Check bot permissions in category
            const perms = category.permissionsFor(guild.members.me);
            if (!perms?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.SendMessages])) {
                return interaction.reply({ content: `Bro, I need View Channel, Manage Channels, and Send Messages in ${category}.`, ephemeral: true });
            }

            settings.categoryId = category.id;
            settings.supportRoleId = supportRole.id;
            if (logChannel) settings.logChannelId = logChannel.id;
            settings.nextTicketNumber = settings.nextTicketNumber || 1;
            setSettings(guild.id, settings);

            return interaction.reply({ content: `✅ Ticket system set up! Category: ${category}, Support: ${supportRole}${logChannel ? `, Logs: ${logChannel}` : ''}`, ephemeral: true });
        }

        if (sub === 'panel') {
            if (!settings.categoryId || !settings.supportRoleId) {
                return interaction.reply({ content: 'Bro, run `/ticket setup` first!', ephemeral: true });
            }

            const channel = interaction.options.getChannel('channel');
            const title = interaction.options.getString('title') || '🎫 Support Tickets';
            const description = interaction.options.getString('description') || 'Click the button below to create a support ticket. Our team will assist you shortly.';

            const perms = channel.permissionsFor(guild.members.me);
            if (!perms?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                return interaction.reply({ content: `Bro, I need View Channel, Send Messages, and Embed Links in ${channel}.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(0x5865F2)
                .setFooter({ text: 'TrustMeBro Ticket System' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: `✅ Ticket panel sent to ${channel}!`, ephemeral: true });
        }

        if (sub === 'close') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bro, this is not a ticket channel.', ephemeral: true });
            }

            const reason = interaction.options.getString('reason') || 'No reason provided';
            await this.closeTicket(interaction, reason);
        }

        if (sub === 'claim') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bro, this is not a ticket channel.', ephemeral: true });
            }

            const ticketData = settings[interaction.channel.id];
            if (!ticketData) return interaction.reply({ content: 'Bro, ticket data not found.', ephemeral: true });

            if (ticketData.claimedBy) {
                return interaction.reply({ content: `Bro, this ticket is already claimed by <@${ticketData.claimedBy}>.`, ephemeral: true });
            }

            // Check if user has support role
            if (!interaction.member.roles.cache.has(settings.supportRoleId)) {
                return interaction.reply({ content: 'Bro, you need the support role to claim tickets.', ephemeral: true });
            }

            ticketData.claimedBy = interaction.user.id;
            settings[interaction.channel.id] = ticketData;
            setSettings(guild.id, settings);

            await interaction.reply({ content: `✅ Ticket claimed by ${interaction.user}!` });
        }

        if (sub === 'add') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bro, this is not a ticket channel.', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            await interaction.channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
            return interaction.reply({ content: `✅ Added ${user} to the ticket.` });
        }

        if (sub === 'remove') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bro, this is not a ticket channel.', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            if (user.id === interaction.user.id) {
                return interaction.reply({ content: 'Bro, you cannot remove yourself.', ephemeral: true });
            }
            await interaction.channel.permissionOverwrites.delete(user);
            return interaction.reply({ content: `✅ Removed ${user} from the ticket.` });
        }

        if (sub === 'transcript') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'Bro, this is not a ticket channel.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages.reverse().map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');

            // Send as file if too long
            if (transcript.length > 1900) {
                const { Readable } = require('stream');
                const stream = Readable.from([transcript]);
                return interaction.editReply({
                    content: 'Transcript:',
                    files: [{ attachment: stream, name: `transcript-${interaction.channel.name}.txt` }]
                });
            }

            return interaction.editReply({ content: `\`\`\`\n${transcript}\n\`\`\`` });
        }

        if (sub === 'settings') {
            if (!settings.categoryId) {
                return interaction.reply({ content: 'Ticket system not set up yet.', ephemeral: true });
            }

            const category = guild.channels.cache.get(settings.categoryId);
            const supportRole = guild.roles.cache.get(settings.supportRoleId);
            const logChannel = settings.logChannelId ? guild.channels.cache.get(settings.logChannelId) : null;

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket System Settings')
                .addFields(
                    { name: 'Category', value: category ? `${category}` : 'Not set', inline: true },
                    { name: 'Support Role', value: supportRole ? `${supportRole}` : 'Not set', inline: true },
                    { name: 'Log Channel', value: logChannel ? `${logChannel}` : 'Not set', inline: true },
                    { name: 'Active Tickets', value: String(Object.keys(settings).filter(k => k.startsWith('ticket-')).length), inline: true },
                )
                .setColor(0x5865F2)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'ticket_create') return;

        if (!interaction.guild) return interaction.reply({ content: 'Bro, this only works in a server.', ephemeral: true });

        const guild = interaction.guild;
        const settings = getSettings(guild.id);

        if (!settings.categoryId || !settings.supportRoleId) {
            return interaction.reply({ content: 'Bro, ticket system not set up. Ask admin to run `/ticket setup`.', ephemeral: true });
        }

        // Check if user already has an open ticket
        const existingTicket = Object.entries(settings).find(([id, data]) => data.userId === interaction.user.id && data.status === 'open');
        if (existingTicket) {
            const channel = guild.channels.cache.get(existingTicket[0]);
            return interaction.reply({ content: `Bro, you already have an open ticket: ${channel ? `<#${channel.id}>` : 'Unknown'}.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const category = guild.channels.cache.get(settings.categoryId);
        const supportRole = guild.roles.cache.get(settings.supportRoleId);
        const ticketNumber = settings.nextTicketNumber || 1;
        settings.nextTicketNumber = ticketNumber + 1;

        const channel = await guild.channels.create({
            name: `ticket-${ticketNumber.toString().padStart(4, '0')}`,
            type: ChannelType.GuildText,
            parent: category,
            permissionOverwrites: [
                { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: supportRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] },
                { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
            ],
            topic: `Ticket by ${interaction.user.tag} (${interaction.user.id})`,
        });

        settings[channel.id] = {
            userId: interaction.user.id,
            number: ticketNumber,
            status: 'open',
            createdAt: Date.now(),
            claimedBy: null,
        };
        setSettings(guild.id, settings);

        const embed = new EmbedBuilder()
            .setTitle(`🎫 Ticket #${ticketNumber.toString().padStart(4, '0')}`)
            .setDescription(`Welcome ${interaction.user}! Support will be with you shortly.\n\nUse the buttons below to manage this ticket.`)
            .setColor(0x5865F2)
            .setFooter({ text: `Created by ${interaction.user.tag}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
            new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('👋'),
        );

        await channel.send({ content: `${interaction.user} ${supportRole}`, embeds: [embed], components: [row] });

        // Log
        if (settings.logChannelId) {
            const logChannel = guild.channels.cache.get(settings.logChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [new EmbedBuilder().setTitle('🎫 Ticket Created').setDescription(`Ticket #${ticketNumber.toString().padStart(4, '0')} created by ${interaction.user}`).setColor(0x00FF00).setTimestamp()] });
            }
        }

        return interaction.editReply({ content: `✅ Ticket created: ${channel}!` });
    },

    async closeTicket(interaction, reason) {
        const guild = interaction.guild;
        const settings = getSettings(guild.id);
        const ticketData = settings[interaction.channel.id];

        if (!ticketData) return interaction.reply({ content: 'Bro, ticket data not found.', ephemeral: true });

        // Generate transcript
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');

        // Send transcript to log channel
        if (settings.logChannelId) {
            const logChannel = guild.channels.cache.get(settings.logChannelId);
            if (logChannel) {
                const { Readable } = require('stream');
                const stream = Readable.from([transcript]);
                await logChannel.send({
                    embeds: [new EmbedBuilder().setTitle('🔒 Ticket Closed').setDescription(`Ticket #${ticketData.number.toString().padStart(4, '0')} closed by ${interaction.user}\nReason: ${reason}`).setColor(0xFF0000).setTimestamp()],
                    files: [{ attachment: stream, name: `transcript-ticket-${ticketData.number.toString().padStart(4, '0')}.txt` }]
                });
            }
        }

        // DM transcript to user
        const user = await guild.members.fetch(ticketData.userId).catch(() => null);
        if (user) {
            const { Readable } = require('stream');
            const stream = Readable.from([transcript]);
            await user.send({
                embeds: [new EmbedBuilder().setTitle('🔒 Your Ticket Was Closed').setDescription(`Ticket #${ticketData.number.toString().padStart(4, '0')} in **${guild.name}** was closed.\nReason: ${reason}`).setColor(0xFF0000).setTimestamp()],
                files: [{ attachment: stream, name: `transcript-ticket-${ticketData.number.toString().padStart(4, '0')}.txt` }]
            }).catch(() => {});
        }

        // Delete channel
        ticketData.status = 'closed';
        ticketData.closedAt = Date.now();
        ticketData.closedBy = interaction.user.id;
        ticketData.reason = reason;
        setSettings(guild.id, settings);

        await interaction.reply({ content: '🔒 Closing ticket...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    },
};