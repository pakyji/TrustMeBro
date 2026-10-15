const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

const CHANNELS_KEY = 'suggestChannels';
const COUNT_KEY = 'suggestCount';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Send a suggestion for the server.')
        .setDMPermission(false)
        .addSubcommand(sc => sc.setName('post').setDescription('Post a suggestion')
            .addStringOption(o => o.setName('idea').setDescription('Your idea').setRequired(true).setMaxLength(1000)))
        .addSubcommand(sc => sc.setName('setup').setDescription('Choose where suggestions go (staff)')
            .addChannelOption(o => o.setName('channel').setDescription('Suggestions channel').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
        .addSubcommand(sc => sc.setName('off').setDescription('Turn off suggestions (staff)'))
        .setDefaultMemberPermissions(null),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const channels = store.get(CHANNELS_KEY, {});

        if (sub === 'setup' || sub === 'off') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return ephemeral(interaction, 'Bro, you need Manage Server to set this up.');
            }
            if (sub === 'off') {
                delete channels[guildId];
                store.set(CHANNELS_KEY, channels);
                return ephemeral(interaction, 'Suggestions are off.');
            }
            const channel = interaction.options.getChannel('channel');
            const problem = missingBotPerms(interaction, channel, ['SendMessages', 'AddReactions', 'EmbedLinks']);
            if (problem) return ephemeral(interaction, problem);
            channels[guildId] = channel.id;
            store.set(CHANNELS_KEY, channels);
            return ephemeral(interaction, `✅ Suggestions will be posted in ${channel}.`);
        }

        const channelId = channels[guildId];
        const channel = channelId && (interaction.guild.channels.cache.get(channelId));
        if (!channel) return ephemeral(interaction, 'Bro, suggestions are not set up yet. Staff can run `/suggest setup`.');

        const counts = store.get(COUNT_KEY, {});
        const number = (counts[guildId] || 0) + 1;
        counts[guildId] = number;
        store.set(COUNT_KEY, counts);

        const embed = new EmbedBuilder()
            .setTitle(`💡 Suggestion #${number}`)
            .setDescription(interaction.options.getString('idea'))
            .setFooter({ text: `From ${interaction.user.tag}` })
            .setTimestamp();
        const msg = await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
        await msg.react('👍').catch(() => null);
        await msg.react('👎').catch(() => null);
        return ephemeral(interaction, `✅ Posted as suggestion #${number} in ${channel}.`);
    },
};
