const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin.'),
    async execute(interaction) {
        const side = crypto.randomInt(2) === 0 ? 'Heads' : 'Tails';
        return interaction.reply({ content: `🪙 **${side}!**` });
    },
};
