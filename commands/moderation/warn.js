const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// In-memory storage for warnings
// Structure: { guildId: { userId: [ { reason: string, moderator: string, date: string } ] } }
const warningsStorage = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advanced warning management system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Issue a warning to a member.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to warn')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Check active warnings for a member.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to check warnings for')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a member.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');

        // Initialize guild and user storage if not present
        if (!warningsStorage.has(guildId)) {
            warningsStorage.set(guildId, new Map());
        }
        const guildWarnings = warningsStorage.get(guildId);

        if (!guildWarnings.has(target.id)) {
            guildWarnings.set(target.id, []);
        }
        const userWarnings = guildWarnings.get(target.id);

        if (subcommand === 'add') {
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const warningEntry = {
                reason: reason,
                moderator: interaction.user.tag,
                date: new Date().toLocaleDateString()
            };

            userWarnings.push(warningEntry);

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Member Warned')
                .setDescription(`Successfully warned **${target.tag}**.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor(0xFFA500)
                .setTimestamp();

            // Try to DM the user about the warning
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`⚠️ Bro You were warned in ${interaction.guild.name}`)
                    .setDescription(`**Reason:** ${reason}\n**Total Warnings:** ${userWarnings.length}`)
                    .setColor(0xFF0000)
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // User DMs might be closed
            }

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'list') {
            if (userWarnings.length === 0) {
                return interaction.reply({ content: `Bro, **${target.tag}** has no active warnings!`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Warnings for ${target.tag}`)
                .setColor(0x3498DB)
                .setTimestamp();

            const description = userWarnings.map((w, index) => 
                `**#${index + 1}** | **Reason:** ${w.reason}\n*By:* ${w.moderator} on *${w.date}*`
            ).join('\n\n');

            embed.setDescription(description);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'clear') {
            if (userWarnings.length === 0) {
                return interaction.reply({ content: `Bro, **${target.tag}** already has zero warnings!`, ephemeral: true });
            }

            guildWarnings.set(target.id, []);

            const embed = new EmbedBuilder()
                .setTitle('🧹Bro Warnings Cleared')
                .setDescription(`Successfully cleared all warnings for **${target.tag}**.`)
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
