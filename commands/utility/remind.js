const { SlashCommandBuilder } = require('discord.js');
const scheduler = require('../../lib/scheduler');
const { JOB_TYPES } = require('../../lib/jobs');

const MAX_MINUTES = 10080; // 7 days

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Get a reminder in this channel after some minutes. Survives restarts.')
        .addIntegerOption(o => o.setName('minutes').setDescription(`In how many minutes (1-${MAX_MINUTES})`).setMinValue(1).setMaxValue(MAX_MINUTES).setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('What to remind you about').setRequired(true).setMaxLength(300)),

    async execute(interaction) {
        const minutes = interaction.options.getInteger('minutes');
        const message = interaction.options.getString('message');
        const runAt = Date.now() + minutes * 60 * 1000;
        scheduler.schedule({
            type: JOB_TYPES.reminder,
            runAt,
            data: { channelId: interaction.channelId, userId: interaction.user.id, message },
        });
        return interaction.reply({
            content: `⏰ Okay, I will remind you <t:${Math.floor(runAt / 1000)}:R>: ${message}`,
            ephemeral: true,
        });
    },
};
