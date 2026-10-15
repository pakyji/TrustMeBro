const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('holidays')
        .setDescription('Next public holidays (Italy by default).')
        .addStringOption(o => o.setName('country').setDescription('Two-letter country code, e.g. IT, PK, IN, US').setMinLength(2).setMaxLength(2)),

    async execute(interaction) {
        await interaction.deferReply();
        const country = (interaction.options.getString('country') || 'IT').toUpperCase();
        if (!/^[A-Z]{2}$/.test(country)) return interaction.editReply('Bro, use a two-letter country code like IT or US.');
        try {
            const year = new Date().getFullYear();
            let list = await web.getHolidays(year, country);
            if (list.length === 0) list = await web.getHolidays(year + 1, country);
            if (list.length === 0) return interaction.editReply('No upcoming holidays found for that country.');
            const lines = list.map(h => `• **${h.date}** — ${h.name}${h.local && h.local !== h.name ? ` (${h.local})` : ''}`);
            return interaction.editReply(`🎉 **Next holidays in ${country}**\n${lines.join('\n')}`);
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
