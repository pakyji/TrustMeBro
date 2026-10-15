const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild, ephemeral, roleBlocker, missingBotPerms } = require('../../lib/cmd');

const KEY = 'autorole';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Give a role automatically to every new member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand(sc => sc.setName('set').setDescription('Choose the role to give new members')
            .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sc => sc.setName('off').setDescription('Stop giving a role to new members'))
        .addSubcommand(sc => sc.setName('status').setDescription('Show the current auto role')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const all = store.get(KEY, {});

        if (sub === 'status') {
            const roleId = all[guildId];
            const role = roleId && interaction.guild.roles.cache.get(roleId);
            return ephemeral(interaction, role ? `New members get **${role.name}**.` : 'No auto role is set.');
        }
        if (sub === 'off') {
            delete all[guildId];
            store.set(KEY, all);
            return ephemeral(interaction, 'Auto role is off.');
        }

        const role = interaction.options.getRole('role');
        const blocked = roleBlocker(interaction, role);
        if (blocked) return ephemeral(interaction, blocked);
        const problem = missingBotPerms(interaction, interaction.channel, ['ManageRoles']);
        if (problem) return ephemeral(interaction, problem);

        all[guildId] = role.id;
        store.set(KEY, all);
        return ephemeral(interaction, `✅ New members will get **${role.name}**.`);
    },
};
