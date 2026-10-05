const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// In-memory storage for anti-link configuration per guild
// Structure: { guildId: { enabled: boolean, links: string[] } }
const antilinkConfigs = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('Configure anti-link system to delete custom links and DM users.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Turn anti-link system ON or OFF.')
                .addBooleanOption(option =>
                    option.setName('status')
                        .setDescription('Set status to true (on) or false (off)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a custom domain/link to the restricted list.')
                .addStringOption(option =>
                    option.setName('link')
                        .setDescription('The domain or keyword to block (e.g., discord.gg, t.me)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a custom domain/link from the restricted list.')
                .addStringOption(option =>
                    option.setName('link')
                        .setDescription('The domain or keyword to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View currently blocked links and status.')
        ),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        if (!antilinkConfigs.has(guildId)) {
            antilinkConfigs.set(guildId, { enabled: false, links: ['discord.gg', 't.me', 'https://', 'http://'] });
        }
        const config = antilinkConfigs.get(guildId);

        if (subcommand === 'toggle') {
            const status = interaction.options.getBoolean('status');
            config.enabled = status;

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Configuration')
                .setDescription(`Anti-link system has been turned **${status ? 'ON' : 'OFF'}**!`)
                .setColor(status ? 0x00FF00 : 0xFF0000)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'add') {
            let linkToAdd = interaction.options.getString('link').toLowerCase().trim();
            
            if (config.links.includes(linkToAdd)) {
                return interaction.reply({ content: `Bro, \`${linkToAdd}\` is already in the restricted list!`, ephemeral: true });
            }

            config.links.push(linkToAdd);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Updated')
                .setDescription(`Successfully added \`${linkToAdd}\` to the blocked links list.`)
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove') {
            let linkToRemove = interaction.options.getString('link').toLowerCase().trim();
            const index = config.links.indexOf(linkToRemove);

            if (index === -1) {
                return interaction.reply({ content: `Bro, \`${linkToRemove}\` was not found in the blocked list!`, ephemeral: true });
            }

            config.links.splice(index, 1);

            const embed = new EmbedBuilder()
                .setTitle('🛡️️ Anti-Link Updated')
                .setDescription(`Successfully removed \`${linkToRemove}\` from the blocked links list.`)
                .setColor(0xFFA500)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'list') {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Status & List')
                .addFields(
                    { name: 'Status', value: config.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: false },
                    { name: 'Blocked Links', value: config.links.length > 0 ? config.links.map(l => `• \`${l}\``).join('\n') : 'No custom links added yet.', inline: false }
                )
                .setColor(0x651FFF)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // Automatically triggered by index.js message listener loop
    async handleMessage(message) {
        if (!message.guild || message.author.bot) return;

        const guildId = message.guild.id;
        const config = antilinkConfigs.get(guildId);

        if (!config || !config.enabled || config.links.length === 0) return;

        // Bypass for members with Manage Messages permission
        if (message.member && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        const content = message.content.toLowerCase();
        const matchedLink = config.links.find(link => content.includes(link));

        if (matchedLink) {
            try {
                if (message.deletable) {
                    await message.delete();
                }

                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Link Blocked!')
                    .setDescription(`Bro, your message containing a restricted link/keyword (\`${matchedLink}\`) was deleted in **${message.guild.name}**.`)
                    .setColor(0xFF0000)
                    .setTimestamp();

                await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

                const warningMsg = await message.channel.send(`Bro <@${message.author.id}>, sending that link is not allowed here! Check your DMs.`);
                setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

            } catch (error) {
                console.error("Anti-link execution error:", error);
            }
        }
    }
};
