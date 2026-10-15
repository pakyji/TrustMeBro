const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('currency')
        .setDescription('Convert money using European Central Bank rates.')
        .addNumberOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(0.01).setMaxValue(1e12))
        .addStringOption(o => o.setName('from').setDescription('From, e.g. EUR').setRequired(true).setMinLength(3).setMaxLength(3))
        .addStringOption(o => o.setName('to').setDescription('To, e.g. USD').setRequired(true).setMinLength(3).setMaxLength(3)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const r = await web.convertCurrency(
                interaction.options.getNumber('amount'),
                interaction.options.getString('from'),
                interaction.options.getString('to'),
            );
            return interaction.editReply(`💱 **${r.amount} ${r.from}** = **${r.value.toFixed(2)} ${r.to}**\n*Rate date: ${r.date}. Rates may be delayed.*`);
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
