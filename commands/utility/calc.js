const { SlashCommandBuilder } = require('discord.js');
const { safeCalc } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Do maths: + - * / % ^ and brackets.')
        .addStringOption(o => o.setName('expression').setDescription('For example (2 + 3) * 4 ^ 2').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        const expression = interaction.options.getString('expression');
        try {
            const result = safeCalc(expression);
            return interaction.reply({ content: `🧮 \`${expression}\` = **${result}**` });
        } catch (error) {
            return interaction.reply({ content: `Bro, ${error.message}`, ephemeral: true });
        }
    },
};
