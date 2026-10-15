const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const announce = require('../../lib/announce');
const { getBuildInfo } = require('../../lib/build');

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
    },
};
