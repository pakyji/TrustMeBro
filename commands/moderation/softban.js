const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { moderationBlocker } = require('../../lib/moderation');
const { requireGuild, ephemeral } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Ban and immediately unban a member, to delete their recent messages. They can rejoin.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(400)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        const blocked = moderationBlocker(interaction, target, member);
        if (blocked) return ephemeral(interaction, blocked);
        if (member && !member.bannable) return ephemeral(interaction, 'Bro, I cannot ban this member. Check my role position.');

        await interaction.deferReply();
        const auditReason = `Softban: ${reason} (by ${interaction.user.tag})`;
        await interaction.guild.members.ban(target.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason: auditReason });
        await interaction.guild.members.unban(target.id, 'Softban complete');
        return interaction.editReply({ content: `🧹 **${target.tag}** was softbanned. Their last 7 days of messages were deleted and they can rejoin.` });
    },
};
