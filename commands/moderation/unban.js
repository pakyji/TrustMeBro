const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server using their User ID.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user you want to unban')
                .setRequired(true)
                .setMaxLength(25)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)
                .setMaxLength(400)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const userId = interaction.options.getString('userid').trim();
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Discord user IDs are numeric snowflakes. Reject anything else before calling the API.
        if (!/^\d{15,25}$/.test(userId)) {
            return interaction.reply({ content: 'Bro, that is not a valid User ID. It should be a long number.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const bannedEntry = await interaction.guild.bans.fetch(userId).catch(() => null);
            if (!bannedEntry) {
                return interaction.editReply({ content: 'Bro, this user is not banned or the User ID is invalid!' });
            }

            await interaction.guild.members.unban(userId, `${reason} (by ${interaction.user.tag})`);

            const embed = new EmbedBuilder()
                .setTitle('🔓 Welcome Back!')
                .setDescription(`Successfully unbanned **${bannedEntry.user.tag}**. Trust me, bro, give them another chance!`)
                .addFields(
                    { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Unban command error:', error);
            return interaction.editReply({ content: 'Bro, something went wrong, could not execute the unban! Check if the User ID is correct.' });
        }
    },
};
