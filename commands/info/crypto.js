const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Price of a popular cryptocurrency in USD.')
        .addStringOption(o => o.setName('coin').setDescription('Coin').setRequired(true)
            .addChoices(
                { name: 'Bitcoin (BTC)', value: 'btc' }, { name: 'Ethereum (ETH)', value: 'eth' },
                { name: 'Solana (SOL)', value: 'sol' }, { name: 'XRP', value: 'xrp' },
                { name: 'Cardano (ADA)', value: 'ada' }, { name: 'Dogecoin (DOGE)', value: 'doge' },
                { name: 'BNB', value: 'bnb' }, { name: 'Litecoin (LTC)', value: 'ltc' },
            )),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const c = await web.getCrypto(interaction.options.getString('coin'));
            const change = Number(c.change24h);
            const arrow = change >= 0 ? '📈' : '📉';
            return interaction.editReply(`${arrow} **${c.name} (${c.symbol})**: $${Number(c.price).toLocaleString('en-US', { maximumFractionDigits: 4 })} · 24h ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n*Not financial advice.*`);
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
