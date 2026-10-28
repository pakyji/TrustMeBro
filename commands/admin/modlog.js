const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const store = require('../../lib/store');

const STORE_KEY = 'modlog';

function getSettings(guildId) {
    return store.get(STORE_KEY, {})[guildId] || null;
}

function setSettings(guildId, value) {
    const all = store.get(STORE_KEY, {});
    if (value) all[guildId] = value;
    else delete all[guildId];
    store.set(STORE_KEY, all);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlog')
        .setDescription('Set up a moderation log channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Choose the channel for moderation logs.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Text channel to post mod logs in')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('Turn moderation logs off for this server.')
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Show the moderation log channel.')
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();
        const settings = getSettings(guild.id);

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            const perms = channel.permissionsFor(guild.members.me);
            if (!perms?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                return interaction.reply({
                    content: `Bro, I need View Channel, Send Messages, and Embed Links permissions in ${channel}.`,
                    ephemeral: true,
                });
            }

            setSettings(guild.id, { channelId: channel.id });
            return interaction.reply({
                content: `✅ Done. Moderation actions will be logged in ${channel}.`,
                ephemeral: true,
            });
        }

        if (sub === 'off') {
            setSettings(guild.id, null);
            return interaction.reply({ content: '🔕 Moderation logs are off for this server.', ephemeral: true });
        }

        if (sub === 'status') {
            if (!settings) {
                return interaction.reply({ content: 'Moderation logs are off. Use `/modlog channel` to turn them on.', ephemeral: true });
            }
            return interaction.reply({
                content: `📋 Channel: <#${settings.channelId}>`,
                ephemeral: true,
                allowedMentions: { parse: [] },
            });
        }
    },

    // Helper to log moderation actions
    async log(guild, data) {
        const settings = getSettings(guild.id);
        if (!settings) return;

        const channel = await guild.channels.fetch(settings.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setTitle(data.title)
            .setDescription(data.description)
            .addFields(data.fields || [])
            .setColor(data.color || 0xFF0000)
            .setTimestamp()
            .setFooter({ text: `Moderator: ${data.moderator}` });

        if (data.user) {
            embed.setAuthor({ name: data.user.tag, iconURL: data.user.displayAvatarURL() });
        }

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send modlog:', error.message);
        }
    },
};