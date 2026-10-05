const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fakefact')
        .setDescription('Get a 100% fake fact! Trust me bro.'),
    async execute(interaction) {
        const facts = [
            "Earth is actually shaped like a triangle. Trust me bro.",
            "Water boils faster if you stare at it angrily.",
            "Penguins wear tuxedos because they are always going to a VIP party."
        ];
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(randomFact);
    },
};
