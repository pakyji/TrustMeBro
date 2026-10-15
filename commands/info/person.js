const { SlashCommandBuilder } = require('discord.js');
const web = require('../../lib/web');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('person')
        .setDescription('Generate a random fake person profile (for testing and fun).'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const p = await web.randomPerson();
            return interaction.editReply({
                content: `🧑 **${p.name}**, age ${p.age}, from ${p.city}, ${p.country}\n*This person is randomly generated and does not exist.*`,
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            return interaction.editReply(`Bro, ${error.message}`);
        }
    },
};
