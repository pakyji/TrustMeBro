const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { moderationBlocker } = require('../../lib/moderation');
const { requireGuild, ephemeral } = require('../../lib/cmd');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Change or reset a member\'s nickname.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .setDMPermission(false)
        .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))
        .addStringOption(o => o.setName('name').setDescription('New nickname (leave empty to reset)').setMaxLength(32)),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const target = interaction.options.getUser('target');
        const name = interaction.options.getString('name')?.trim() || null;

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return ephemeral(interaction, 'Bro, that user is not in this server.');
        const blocked = moderationBlocker(interaction, target, member);
        if (blocked) return ephemeral(interaction, blocked);
        if (!member.manageable) return ephemeral(interaction, 'Bro, I cannot change this member\'s nickname. Check my role position.');

        await member.setNickname(name, `Changed by ${interaction.user.tag}`);
        return interaction.reply({ content: name ? `✏️ Nickname set to **${name}**.` : '↩️ Nickname reset.', ephemeral: true });
    },
};
