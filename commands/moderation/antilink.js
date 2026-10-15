const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../../lib/store');

// Settings are saved to data/store.json so they survive a restart.
// Shape: { [guildId]: { enabled: boolean, links: string[] } }
const STORE_KEY = 'antilink';

// Note: the default list includes "https://" and "http://", so once the system is ON,
// every message with a web link is removed. Remove those entries to allow links again.
const DEFAULT_LINKS = ['discord.gg', 't.me', 'https://', 'http://'];

function getConfig(guildId) {
    const all = store.get(STORE_KEY, {});
    if (!all[guildId]) {
        all[guildId] = { enabled: false, links: [...DEFAULT_LINKS] };
        store.set(STORE_KEY, all);
    }
    return all[guildId];
}

function saveConfig(guildId, config) {
    const all = store.get(STORE_KEY, {});
    all[guildId] = config;
    store.set(STORE_KEY, all);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('Configure anti-link system to delete custom links and DM users.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
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
                        .setMaxLength(100)
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
                        .setMaxLength(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View currently blocked links and status.')
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bro, this command only works in a server.', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        const config = getConfig(guildId);

        if (subcommand === 'toggle') {
            config.enabled = interaction.options.getBoolean('status');
            saveConfig(guildId, config);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Configuration')
                .setDescription(`Anti-link system has been turned **${config.enabled ? 'ON' : 'OFF'}**!`)
                .setColor(config.enabled ? 0x00FF00 : 0xFF0000)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'add') {
            const linkToAdd = interaction.options.getString('link').toLowerCase().trim();
            if (!linkToAdd) {
                return interaction.reply({ content: 'Bro, the link cannot be empty!', ephemeral: true });
            }

            if (config.links.includes(linkToAdd)) {
                return interaction.reply({ content: `Bro, \`${linkToAdd}\` is already in the restricted list!`, ephemeral: true });
            }

            config.links.push(linkToAdd);
            saveConfig(guildId, config);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Updated')
                .setDescription(`Successfully added \`${linkToAdd}\` to the blocked links list.`)
                .setColor(0x00FF00)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove') {
            const linkToRemove = interaction.options.getString('link').toLowerCase().trim();
            const index = config.links.indexOf(linkToRemove);

            if (index === -1) {
                return interaction.reply({ content: `Bro, \`${linkToRemove}\` was not found in the blocked list!`, ephemeral: true });
            }

            config.links.splice(index, 1);
            saveConfig(guildId, config);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Updated')
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
                    { name: 'Blocked Links', value: config.links.length > 0 ? config.links.map(l => `• \`${l}\``).join('\n').slice(0, 1024) : 'No custom links added yet.', inline: false }
                )
                .setColor(0x651FFF)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // Called by index.js for every guild message.
    async handleMessage(message) {
        if (!message.guild || message.author.bot) return;

        const all = store.get(STORE_KEY, {});
        const config = all[message.guild.id];
        if (!config || !config.enabled || config.links.length === 0) return;

        // Members with Manage Messages are not checked.
        if (message.member && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        const content = message.content.toLowerCase();
        const matchedLink = config.links.find(link => content.includes(link));
        if (!matchedLink) return;

        try {
            if (message.deletable) {
                await message.delete();
            }

            const dmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Link Blocked!')
                .setDescription(`Bro, your message containing a restricted link/keyword (\`${matchedLink}\`) was deleted in **${message.guild.name}**.`)
                .setColor(0xFF0000)
                .setTimestamp();
            await message.author.send({ embeds: [dmEmbed] }).catch(() => { /* DMs closed */ });

            const warningMsg = await message.channel.send({
                content: `Bro <@${message.author.id}>, sending that link is not allowed here! Check your DMs.`,
                allowedMentions: { users: [message.author.id] },
            });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
        } catch (error) {
            console.error('Anti-link error:', error);
        }
    },
};
