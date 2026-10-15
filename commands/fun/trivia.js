const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { TRIVIA, LANGUAGE_CHOICES, pickLang, randomItem } = require('../../lib/content');

const LETTERS = ['A', 'B', 'C', 'D'];
const ANSWER_SECONDS = 20;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer a quick quiz question with buttons.')
        .addStringOption(o => o.setName('language').setDescription('Quiz language').addChoices(...LANGUAGE_CHOICES)),

    async execute(interaction) {
        const lang = pickLang(interaction.options.getString('language'));
        const question = randomItem(TRIVIA[lang]);
        const row = new ActionRowBuilder().addComponents(
            ...question.options.map((opt, i) => new ButtonBuilder()
                .setCustomId(`trivia:${i}`)
                .setLabel(`${LETTERS[i]}: ${opt}`.slice(0, 80))
                .setStyle(ButtonStyle.Primary)),
        );
        const reply = await interaction.reply({
            content: `🧠 **${question.q}**\nYou have ${ANSWER_SECONDS} seconds.`,
            components: [row],
            fetchReply: true,
        });

        try {
            const click = await reply.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: ANSWER_SECONDS * 1000,
            });
            const picked = Number(click.customId.split(':')[1]);
            const right = picked === question.answer;
            await click.update({
                content: `🧠 **${question.q}**\n${right ? '✅ Correct!' : `❌ Nope. The answer was **${question.options[question.answer]}**.`}`,
                components: [],
            });
        } catch (_) {
            await interaction.editReply({
                content: `⌛ Time is up! The answer was **${question.options[question.answer]}**.`,
                components: [],
            }).catch(() => null);
        }
    },
};
