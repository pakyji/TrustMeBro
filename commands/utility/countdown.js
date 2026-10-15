const { SlashCommandBuilder } = require('discord.js');
const { daysUntil } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('How many days until a date (Rome time).')
        .addStringOption(o => o.setName('date').setDescription('Date as YYYY-MM-DD').setRequired(true).setMaxLength(10))
        .addStringOption(o => o.setName('name').setDescription('What is the day?').setMaxLength(60)),

    async execute(interaction) {
        const date = interaction.options.getString('date');
        const name = interaction.options.getString('name') || date;
        let days;
        try {
            days = daysUntil(date);
        } catch (error) {
            return interaction.reply({ content: 'Bro, use the date format YYYY-MM-DD.', ephemeral: true });
        }
        if (days === 0) return interaction.reply({ content: `🎉 **${name}** is today!` });
        if (days > 0) return interaction.reply({ content: `⏳ **${days}** day(s) until **${name}**.` });
        return interaction.reply({ content: `📅 **${name}** was ${Math.abs(days)} day(s) ago.` });
    },
};
