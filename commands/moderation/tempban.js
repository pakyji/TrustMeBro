const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { moderationBlocker } = require('../../lib/moderation');
const { requireGuild, ephemeral } = require('../../lib/cmd');
const scheduler = require('../../lib/scheduler');
const { JOB_TYPES } = require('../../lib/jobs');
const modlog = require('../../commands/admin/modlog');

const MAX_MINUTES = 43200; // 30 days

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempban')
        .setDescription('Ban a member for a set time. They are unbanned automatically.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))
        .addIntegerOption(o => o.setName('minutes').setDescription(`How long (1-${MAX_MINUTES} minutes)`).setMinValue(1).setMaxValue(MAX_MINUTES).setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(400)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const target = interaction.options.getUser('target');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        const blocked = moderationBlocker(interaction, target, member);
        if (blocked) return ephemeral(interaction, blocked);
        if (member && !member.bannable) return ephemeral(interaction, 'Bro, I cannot ban this member. Check my role position.');

        // DM the user before ban
        const dmEmbed = new EmbedBuilder()
            .setTitle('⏳ You got Temp Banned!')
            .setDescription(`Bro, you have been temporarily banned from **${interaction.guild.name}** for ${minutes} minutes.\n\n**Reason:** ${reason}\n\n*TrustMeBro Note:* You'll be auto-unbanned after the time expires.`)
            .setColor(0xFF8C00)
            .setTimestamp();
        await target.send({ embeds: [dmEmbed] }).catch(() => { /* DMs closed */ });

        await interaction.guild.members.ban(target.id, { reason: `Temp ban ${minutes} min: ${reason} (by ${interaction.user.tag})` });
        scheduler.schedule({
            type: JOB_TYPES.unban,
            runAt: Date.now() + minutes * 60 * 1000,
            data: { guildId: interaction.guild.id, userId: target.id },
        });

        const until = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);

        // Log to modlog channel
        await modlog.log(interaction.guild, {
            title: '⏳ Member Temp Banned',
            description: `**${target.tag}** (\`${target.id}\`) was temporarily banned.`,
            fields: [
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Duration', value: `${minutes} minutes`, inline: true },
                { name: 'Reason', value: reason, inline: true },
            ],
            color: 0xFF8C00,
            moderator: interaction.user.tag,
            user: target,
        });

        return interaction.reply({ content: `⏳ **${target.tag}** is banned until <t:${until}:f>. Reason: ${reason}` });
    },
};
