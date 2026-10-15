const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate anything out of 10. Totally scientific.')
        .addStringOption(o => o.setName('thing').setDescription('What to rate').setRequired(true).setMaxLength(100)),

    async execute(interaction) {
        const thing = interaction.options.getString('thing');
        const score = crypto.randomInt(0, 101) / 10;
        return interaction.reply({ content: `⭐ I rate **${thing}** a solid **${score}/10**.`, allowedMentions: { parse: [] } });
    },
};
