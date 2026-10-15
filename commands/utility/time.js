const { SlashCommandBuilder } = require('discord.js');
const { timeInZone } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Show the current time in a timezone.')
        .addStringOption(o => o.setName('zone').setDescription('Timezone, e.g. Europe/Rome, Asia/Karachi, America/New_York (default Europe/Rome)').setMaxLength(60)),

    async execute(interaction) {
        const zone = interaction.options.getString('zone') || 'Europe/Rome';
        try {
            return interaction.reply({ content: `🕒 **${zone}**: ${timeInZone(zone)}` });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
