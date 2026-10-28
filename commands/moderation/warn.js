const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../../lib/store');
const { moderationBlocker } = require('../../lib/moderation');

// Warnings are saved to data/store.json so they survive a restart.
// Shape: { [guildId]: { [userId]: [ { reason, moderator, date } ] } }
const STORE_KEY = 'warnings';

function allWarnings() {
    return store.get(STORE_KEY, {});
}

function userWarnings(guildId, userId) {
    const all = allWarnings();
    return (all[guildId] && all[guildId][userId]) || [];
}

function setUserWarnings(guildId, userId, list) {
    const all = allWarnings();
    all[guildId] = all[guildId] || {};
    all[guildId][userId] = list;
    store.set(STORE_KEY, all);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advanced warning management system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
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
                        .setMaxLength(400)
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning by index.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to remove warning from')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('index')
                        .setDescription('Warning number to remove (1 = oldest)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');
        const list = userWarnings(guildId, target.id);

        if (subcommand === 'add' || subcommand === 'clear') {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            const blocked = moderationBlocker(interaction, target, member);
            if (blocked) return interaction.reply({ content: blocked, ephemeral: true });
        }

        if (subcommand === 'add') {
            const reason = interaction.options.getString('reason') || 'No reason provided';
            list.push({
                reason,
                moderator: interaction.user.tag,
                date: new Date().toISOString().slice(0, 10),
            });
            setUserWarnings(guildId, target.id, list);

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Member Warned')
                .setDescription(`Successfully warned **${target.tag}**.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Total Warnings', value: `${list.length}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor(0xFFA500)
                .setTimestamp();

            const dmEmbed = new EmbedBuilder()
                .setTitle(`⚠️ Bro You were warned in ${interaction.guild.name}`)
                .setDescription(`**Reason:** ${reason}\n**Total Warnings:** ${list.length}`)
                .setColor(0xFF0000)
                .setTimestamp();
            await target.send({ embeds: [dmEmbed] }).catch(() => { /* DMs closed */ });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'list') {
            if (list.length === 0) {
                return interaction.reply({ content: `Bro, **${target.tag}** has no active warnings!`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Warnings for ${target.tag}`)
                .setDescription(list.map((w, i) =>
                    `**#${i + 1}** | **Reason:** ${w.reason}\n*By:* ${w.moderator} on *${w.date}*`
                ).join('\n\n').slice(0, 4000))
                .setColor(0x3498DB)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'clear') {
            if (list.length === 0) {
                return interaction.reply({ content: `Bro, **${target.tag}** already has zero warnings!`, ephemeral: true });
            }

            setUserWarnings(guildId, target.id, []);

            const embed = new EmbedBuilder()
                .setTitle('🧹 Bro Warnings Cleared')
                .setDescription(`Successfully cleared all warnings for **${target.tag}**.`)
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            const blocked = moderationBlocker(interaction, target, member);
            if (blocked) return interaction.reply({ content: blocked, ephemeral: true });

            const index = interaction.options.getInteger('index');
            if (index < 1 || index > list.length) {
                return interaction.reply({ content: `Bro, invalid warning index. ${target.tag} has ${list.length} warning(s).`, ephemeral: true });
            }

            const removed = list.splice(index - 1, 1)[0];
            setUserWarnings(guildId, target.id, list);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Warning Removed')
                .setDescription(`Removed warning **#${index}** from **${target.tag}**.`)
                .addFields(
                    { name: 'Removed Reason', value: removed.reason, inline: false },
                    { name: 'Remaining Warnings', value: `${list.length}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    },
};
