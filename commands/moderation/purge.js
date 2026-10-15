const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireGuild, ephemeral, missingBotPerms } = require('../../lib/cmd');

// Discord cannot bulk-delete messages older than 14 days.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete recent messages in this channel (up to 100). Messages older than 14 days are skipped.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        .addIntegerOption(o => o.setName('amount').setDescription('How many messages to check (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
        .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user')),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const problem = missingBotPerms(interaction, interaction.channel, ['ManageMessages', 'ReadMessageHistory']);
        if (problem) return ephemeral(interaction, problem);

        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');
        await interaction.deferReply({ ephemeral: true });

        const fetched = await interaction.channel.messages.fetch({ limit: amount });
        const cutoff = Date.now() - MAX_AGE_MS;
        const targets = [...fetched.values()].filter(m => m.createdTimestamp > cutoff && (!user || m.author.id === user.id));
        if (targets.length === 0) return interaction.editReply('Bro, no messages to delete there.');

        const deleted = targets.length === 1
            ? (await targets[0].delete().then(() => 1).catch(() => 0))
            : (await interaction.channel.bulkDelete(targets, true)).size;

        return interaction.editReply(`🧹 Deleted ${deleted} message(s).`);
    },
};
