const { SlashCommandBuilder } = require('discord.js');
const { splitBill } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Work out a tip and split the bill between people.')
        .addNumberOption(o => o.setName('amount').setDescription('Bill amount (e.g. 45.5)').setRequired(true).setMinValue(0.01).setMaxValue(1000000))
        .addNumberOption(o => o.setName('percent').setDescription('Tip percent (default 10)').setMinValue(0).setMaxValue(100))
        .addIntegerOption(o => o.setName('people').setDescription('How many people share it (default 1)').setMinValue(1).setMaxValue(50)),

    async execute(interaction) {
        const amount = interaction.options.getNumber('amount');
        const percent = interaction.options.getNumber('percent') ?? 10;
        const people = interaction.options.getInteger('people') ?? 1;
        try {
            const r = splitBill(amount, percent, people);
            return interaction.reply({
                content: `🧾 Bill **${amount.toFixed(2)}** + tip **${r.tip.toFixed(2)}** (${percent}%)\nTotal **${r.total.toFixed(2)}**${people > 1 ? ` · each person pays **${r.perPerson.toFixed(2)}**` : ''}`,
            });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
