const { SlashCommandBuilder } = require('discord.js');
const { newUuid } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder().setName('uuid').setDescription('Generate a random UUID (v4).'),
    async execute(interaction) {
        return interaction.reply({ content: `🆔 \`${newUuid()}\``, ephemeral: true });
    },
};
