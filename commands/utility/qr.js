const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qr')
        .setDescription('Make a QR code from text or a link.')
        .addStringOption(o => o.setName('text').setDescription('Text or link (max 200 characters)').setRequired(true).setMaxLength(200)),

    async execute(interaction) {
        const text = interaction.options.getString('text');
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
        const embed = new EmbedBuilder().setTitle('📱 QR code').setDescription('Scan with your phone camera.').setImage(url);
        return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
};
