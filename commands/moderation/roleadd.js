const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { moderationBlocker } = require('../../lib/moderation');
const { requireGuild, ephemeral, roleBlocker } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('Give a role to a member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const target = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');

        const blocked = roleBlocker(interaction, role);
        if (blocked) return ephemeral(interaction, blocked);

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return ephemeral(interaction, 'Bro, that user is not in this server.');
        const memberBlocked = moderationBlocker(interaction, target, member);
        if (memberBlocked) return ephemeral(interaction, memberBlocked);
        if (member.roles.cache.has(role.id)) return ephemeral(interaction, `Bro, ${target.tag} already has ${role.name}.`);

        await member.roles.add(role, `Added by ${interaction.user.tag}`);
        return interaction.reply({ content: `✅ Gave **${role.name}** to ${target.tag}.`, allowedMentions: { parse: [] } });
    },
};
