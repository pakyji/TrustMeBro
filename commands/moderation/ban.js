const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server with TrustMeBro style.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('days') || 0;

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'Bro, this member could not be found in the server!', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: 'Bro, I cannot ban this member. They might have a higher role or permissions than me!', ephemeral: true });
        }

        try {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔨 You got Banned!')
                    .setDescription(`Bro, you have been permanently banned from **${interaction.guild.name}**.\n\n**Reason:** ${reason}\n\n*TrustMeBro Note:* Consider it a permanent vacation!`)
                    .setColor(0xFF0000)
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore if user has DMs closed
            }

            await interaction.guild.members.ban(target.id, {
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60,
                reason: reason
            });

            const embed = new EmbedBuilder()
                .setTitle('🔨 Ban Hammer Hit!')
                .setDescription(`**${target.tag}** has been successfully banned from the server. Trust me, bro, they are gone for good!`)
                .addFields(
                    { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: true }
                )
                .setColor(0xFF0000)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Ban command execution error:', error);
            return interaction.reply({ content: 'Bro, something went wrong, could not execute the ban!', ephemeral: true });
        }
    }
};
