const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('catfact').setDescription('Get a random fact about cats.'),
    async execute(interaction) {
        await interaction.deferReply();
        const res = await fetch('https://catfact.ninja/fact', { signal: AbortSignal.timeout(8000) }).catch(() => null);
        const data = res && res.ok ? await res.json().catch(() => null) : null;
        if (!data || !data.fact) return interaction.editReply('Bro, the cat fact service is sleeping. Try later.');
        return interaction.editReply(`🐱 ${data.fact}`);
    },
};
