const { SlashCommandBuilder } = require('discord.js');
const { randomItem } = require('../../lib/content');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Let the bot pick one option for you.')
        .addStringOption(o => o.setName('options').setDescription('Options separated by commas or |, e.g. pizza, pasta, biryani').setRequired(true).setMaxLength(300)),

    async execute(interaction) {
        const options = interaction.options.getString('options').split(/[,|]/).map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return interaction.reply({ content: 'Bro, give me at least 2 options separated by commas.', ephemeral: true });
        return interaction.reply({ content: `🤔 I pick **${randomItem(options)}**.`, allowedMentions: { parse: [] } });
    },
};
