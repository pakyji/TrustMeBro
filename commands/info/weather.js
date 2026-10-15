const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Current weather in a city.')
        .addStringOption(o => o.setName('city').setDescription('City name, e.g. Bologna').setRequired(true).setMaxLength(80)),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const w = await web.getWeather(interaction.options.getString('city'));
            return interaction.editReply(`🌦️ **${w.place}**: ${w.condition}, **${w.temperature}°C**, wind ${w.windspeed} km/h`);
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
