const { SlashCommandBuilder } = require('discord.js');
const scheduler = require('../../lib/scheduler');
const { JOB_TYPES } = require('../../lib/jobs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminders')
        .setDescription('See or cancel your reminders.')
        .addSubcommand(sc => sc.setName('list').setDescription('Show your upcoming reminders'))
        .addSubcommand(sc => sc.setName('cancel').setDescription('Cancel a reminder')
            .addStringOption(o => o.setName('id').setDescription('Reminder id from /reminders list').setRequired(true).setMaxLength(40))),

    async execute(interaction) {
        const userId = interaction.user.id;
        const mine = job => job.data.userId === userId;

        if (interaction.options.getSubcommand() === 'cancel') {
            const id = interaction.options.getString('id').trim();
            const removed = scheduler.cancelJob(id, mine);
            return interaction.reply({ content: removed ? `🗑️ Reminder \`${id}\` cancelled.` : 'Bro, I found no reminder with that id.', ephemeral: true });
        }

        const jobs = scheduler.listJobs(JOB_TYPES.reminder, mine).sort((a, b) => a.runAt - b.runAt);
        if (jobs.length === 0) return interaction.reply({ content: 'You have no reminders.', ephemeral: true });
        const lines = jobs.slice(0, 15).map(j => `\`${j.id}\` <t:${Math.floor(j.runAt / 1000)}:R> — ${j.data.message.slice(0, 80)}`);
        return interaction.reply({ content: `⏰ **Your reminders**\n${lines.join('\n')}`, ephemeral: true, allowedMentions: { parse: [] } });
    },
};
