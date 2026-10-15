const { SlashCommandBuilder } = require('discord.js');
const { discordTimestamp } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timestamp')
        .setDescription('Make a Discord time code that shows in each person\'s own timezone.')
        .addStringOption(o => o.setName('date').setDescription('Date as YYYY-MM-DD (Rome time)').setRequired(true).setMaxLength(10))
        .addStringOption(o => o.setName('time').setDescription('Time as HH:MM (default 00:00)').setMaxLength(5))
        .addStringOption(o => o.setName('style').setDescription('How it shows (default: long)')
            .addChoices(
                { name: 'Short time', value: 'short' },
                { name: 'Long time', value: 'long' },
                { name: 'Short date', value: 'date' },
                { name: 'Long date', value: 'date-long' },
                { name: 'Relative (in 3 days)', value: 'relative' },
            )),

    async execute(interaction) {
        try {
            const code = discordTimestamp(
                interaction.options.getString('date'),
                interaction.options.getString('time') || '00:00',
                interaction.options.getString('style') || 'long',
            );
            return interaction.reply({ content: `🕰️ ${code}\nCopy this to send: \`${code}\``, ephemeral: true });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
