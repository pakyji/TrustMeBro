const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to unmute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmuting')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'Bro, this member could not be found in the server!', ephemeral: true });
        }

        if (!member.moderatable) {
            return interaction.reply({ content: 'Bro, I cannot unmute this member. They might have a higher role or permissions than me!', ephemeral: true });
        }

        try {
            await member.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setTitle('🔊 Mouth Unlocked!')
                .setDescription(`**${target.tag}** has been successfully unmuted. Trust me, bro, behave nicely now!`)
                .addFields(
                    { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔊 You got Unmuted!')
                    .setDescription(`Bro, your timeout has been lifted in **${interaction.guild.name}**.\n\n**Reason:** ${reason}`)
                    .setColor(0x00FF00)
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore if user has DMs closed
            }

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Unmute command execution error:', error);
            return interaction.reply({ content: 'Bro, something went wrong, could not execute the unmute!', ephemeral: true });
        }
    }
};
