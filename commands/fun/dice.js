const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice, for example 2d6 or d20.')
        .addStringOption(o => o.setName('expr').setDescription('Dice, like 2d6 (default 1d6)').setMaxLength(10)),

    async execute(interaction) {
        try {
            const { rolls, total, expr } = rollDice(interaction.options.getString('expr') || '1d6');
            const detail = rolls.length > 1 ? ` (${rolls.join(' + ')})` : '';
            return interaction.reply({ content: `🎲 ${expr}: **${total}**${detail}` });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
