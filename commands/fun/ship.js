const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Check the compatibility of two people (100% fake).')
        .addUserOption(o => o.setName('first').setDescription('First person').setRequired(true))
        .addUserOption(o => o.setName('second').setDescription('Second person').setRequired(true)),

    async execute(interaction) {
        const a = interaction.options.getUser('first');
        const b = interaction.options.getUser('second');
        // Same pair always gets the same score, whatever the order.
        const [x, y] = [a.id, b.id].sort();
        const score = parseInt(crypto.createHash('sha256').update(x + y).digest('hex').slice(0, 8), 16) % 101;
        const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
        return interaction.reply({
            content: `💘 **${a.username}** × **${b.username}**\n${bar} **${score}%**`,
            allowedMentions: { parse: [] },
        });
    },
};
