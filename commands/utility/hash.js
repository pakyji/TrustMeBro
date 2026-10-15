const { SlashCommandBuilder } = require('discord.js');
const { hashText, HASH_ALGORITHMS } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hash')
        .setDescription('Compute a hash (fingerprint) of some text.')
        .addStringOption(o => o.setName('algorithm').setDescription('Hash type').setRequired(true)
            .addChoices(...HASH_ALGORITHMS.map(a => ({ name: a.toUpperCase(), value: a }))))
        .addStringOption(o => o.setName('text').setDescription('Text to hash').setRequired(true).setMaxLength(1000)),

    async execute(interaction) {
        const algorithm = interaction.options.getString('algorithm');
        const digest = hashText(algorithm, interaction.options.getString('text'));
        return interaction.reply({ content: `#️⃣ **${algorithm.toUpperCase()}**\n\`${digest}\``, ephemeral: true });
    },
};
