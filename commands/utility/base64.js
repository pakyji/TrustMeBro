const { SlashCommandBuilder } = require('discord.js');
const { base64Encode, base64Decode } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('base64')
        .setDescription('Encode or decode Base64 text.')
        .addStringOption(o => o.setName('mode').setDescription('encode or decode').setRequired(true)
            .addChoices({ name: 'Encode', value: 'encode' }, { name: 'Decode', value: 'decode' }))
        .addStringOption(o => o.setName('text').setDescription('Text to convert').setRequired(true).setMaxLength(1000)),

    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        const text = interaction.options.getString('text');
        try {
            const out = mode === 'encode' ? base64Encode(text) : base64Decode(text);
            return interaction.reply({ content: `\`\`\`\n${out.slice(0, 1800)}\n\`\`\``, allowedMentions: { parse: [] } });
        } catch (error) {
            return interaction.reply({ content: 'Bro, that is not valid Base64 text.', ephemeral: true });
        }
    },
};
