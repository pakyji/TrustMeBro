const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const store = require('../../lib/store');
const { requireGuild, ephemeral } = require('../../lib/cmd');

const KEY = 'notes';
const MAX_NOTES_PER_USER = 50;

function allNotes() {
    return store.get(KEY, {});
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('note')
        .setDescription('Private staff notes about a member. Only staff can see them.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(sc => sc.setName('add').setDescription('Add a note')
            .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))
            .addStringOption(o => o.setName('text').setDescription('Note').setRequired(true).setMaxLength(300)))
        .addSubcommand(sc => sc.setName('list').setDescription('Show notes about a member')
            .addUserOption(o => o.setName('target').setDescription('Member').setRequired(true))),

    async execute(interaction) {
        if (requireGuild(interaction)) return;
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');
        const guildId = interaction.guild.id;
        const all = allNotes();
        all[guildId] = all[guildId] || {};
        const list = all[guildId][target.id] || [];

        if (sub === 'add') {
            if (list.length >= MAX_NOTES_PER_USER) return ephemeral(interaction, `Bro, this member already has ${MAX_NOTES_PER_USER} notes.`);
            list.push({ text: interaction.options.getString('text'), by: interaction.user.tag, at: Date.now() });
            all[guildId][target.id] = list;
            store.set(KEY, all);
            return ephemeral(interaction, `📝 Note #${list.length} saved for ${target.tag}.`);
        }

        if (list.length === 0) return ephemeral(interaction, `No notes for ${target.tag}.`);
        const lines = list.slice(-15).map((n, i) => `**${list.length - Math.min(15, list.length) + i + 1}.** ${n.text}\n↳ ${n.by} · <t:${Math.floor(n.at / 1000)}:d>`);
        const embed = new EmbedBuilder()
            .setTitle(`📝 Notes about ${target.tag}`)
            .setDescription(lines.join('\n').slice(0, 4000))
            .setFooter({ text: 'Staff only' });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
