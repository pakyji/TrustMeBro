const { SlashCommandBuilder } = require('discord.js');

const NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Start a quick poll with up to 4 options.')
        .addStringOption(o => o.setName('question').setDescription('The question').setRequired(true).setMaxLength(200))
        .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true).setMaxLength(80))
        .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true).setMaxLength(80))
        .addStringOption(o => o.setName('option3').setDescription('Option 3').setMaxLength(80))
        .addStringOption(o => o.setName('option4').setDescription('Option 4').setMaxLength(80)),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const options = ['option1', 'option2', 'option3', 'option4']
            .map(n => interaction.options.getString(n))
            .filter(Boolean);
        const lines = options.map((o, i) => `${NUMBERS[i]} ${o}`);
        const msg = await interaction.reply({
            content: `📊 **${question}**\n${lines.join('\n')}`,
            fetchReply: true,
            allowedMentions: { parse: [] },
        });
        for (let i = 0; i < options.length; i++) {
            await msg.react(NUMBERS[i]).catch(() => null);
        }
        return null;
    },
};
