const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Array of funny strings used for mute responses
const funnyMuteMessages = [
    "Bro needs to cool down, mouth has been locked!",
    "Was acting too wild, now sit quietly in the corner!",
    "The admin hit the mute button, peace will prevail for the next few hours!",
    "Bro is muted now, time to cry alone in a corner!",
    "Tried to act too smart, now going to meditate while muted!"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a notorious member with some TrustMeBro comedy.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to mute')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const durationMinutes = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'Peace is necessary without any specific reason';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        // Check if member exists in the guild
        if (!member) {
            return interaction.reply({ content: "Bro, this member could not be found in the server!", ephemeral: true });
        }

        // Check if the bot has permission and hierarchy to moderate the member
        if (!member.moderatable) {
            return interaction.reply({ content: "Bro, I cannot mute this member. They might have a higher role or permissions than me!", ephemeral: true });
        }

        try {
            // Convert minutes to milliseconds for timeout duration
            const durationMs = durationMinutes * 60 * 1000;
            await member.timeout(durationMs, reason);

            // Select a random joke from the array
            const randomJoke = funnyMuteMessages[Math.floor(Math.random() * funnyMuteMessages.length)];

            const embed = new EmbedBuilder()
                .setTitle('🤐 Mouth Locked!')
                .setDescription(`**${target.tag}** has been successfully muted! Trust me, bro, everything will be fine (after a while).`)
                .addFields(
                    { name: '🎭 Comedy Note', value: `*${randomJoke}*`, inline: false },
                    { name: '⏱️ Duration', value: `${durationMinutes} minutes`, inline: true },
                    { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setColor(0xFF4500)
                .setTimestamp();

            // Attempt to send a direct message to the muted user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🤐 Oops! You got Muted!')
                    .setDescription(`Bro, you have been muted in **${interaction.guild.name}** for ${durationMinutes} minutes.\n\n**Reason:** ${reason}\n\n*TrustMeBro Tip:* Drink some water and chill!`)
                    .setColor(0xFF0000)
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore if user has DMs closed
            }

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Mute command execution error:", error);
            return interaction.reply({ content: "Bro, something went wrong, could not execute the mute!", ephemeral: true });
        }
    }
};                          
