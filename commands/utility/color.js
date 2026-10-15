const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colorInfo } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Show a colour from its hex code.')
        .addStringOption(o => o.setName('hex').setDescription('Hex code, e.g. #ff8800').setRequired(true).setMaxLength(7)),

    async execute(interaction) {
        try {
            const c = colorInfo(interaction.options.getString('hex'));
            const embed = new EmbedBuilder()
                .setTitle(`🎨 ${c.hex}`)
                .setColor(c.decimal)
                .addFields(
                    { name: 'Decimal', value: String(c.decimal), inline: true },
                    { name: 'RGB', value: c.rgb.join(', '), inline: true },
                );
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
