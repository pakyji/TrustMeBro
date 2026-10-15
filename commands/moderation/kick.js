const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { moderationBlocker } = require('../../lib/moderation');
const { requireGuild, ephemeral } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server. They can rejoin with an invite.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .addUserOption(o => o.setName('target').setDescription('Member to kick').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(400)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return ephemeral(interaction, 'Bro, that user is not in this server.');
        const blocked = moderationBlocker(interaction, target, member);
        if (blocked) return ephemeral(interaction, blocked);
        if (!member.kickable) return ephemeral(interaction, 'Bro, I cannot kick this member. Check my role position.');

        await member.kick(`${reason} (by ${interaction.user.tag})`);
        return interaction.reply({ content: `👢 **${target.tag}** was kicked. Reason: ${reason}` });
    },
};
