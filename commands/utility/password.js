const { SlashCommandBuilder } = require('discord.js');
const { makePassword } = require('../../lib/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Generate a strong random password. Only you can see it.')
        .addIntegerOption(o => o.setName('length').setDescription('Length 8-64 (default 16)').setMinValue(8).setMaxValue(64)),

    async execute(interaction) {
        const length = interaction.options.getInteger('length') || 16;
        const password = makePassword(length);
        return interaction.reply({
            content: `🔐 Your password (only you can see this):\n\`${password}\`\nSave it in a password manager and do not share it.`,
            ephemeral: true,
        });
    },
};
