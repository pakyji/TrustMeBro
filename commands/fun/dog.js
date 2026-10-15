const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('dog').setDescription('Show a random dog picture.'),
    async execute(interaction) {
        await interaction.deferReply();
        const res = await fetch('https://dog.ceo/api/breeds/image/random', { signal: AbortSignal.timeout(8000) }).catch(() => null);
        const data = res && res.ok ? await res.json().catch(() => null) : null;
        if (!data || !data.message) return interaction.editReply('Bro, the dog service is not answering. Try later.');
        const embed = new EmbedBuilder().setTitle('🐶 Good dog').setImage(data.message);
        return interaction.editReply({ embeds: [embed] });
    },
};
