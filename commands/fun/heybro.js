const { SlashCommandBuilder } = require('discord.js');
const { openAICompatible, askChat, buildAnswer } = require('../../lib/ai');

// The client is created per request, so a missing key only affects this command.
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const SYSTEM = 'You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real.';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('heybro')
        .setDescription('Ask anything to the Bro! 100% fake & funny.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the bro?')
                .setRequired(true)
                .setMaxLength(300)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');
        const client = openAICompatible(process.env.OPENROUTER_API_KEY, BASE_URL);
        if (!client) {
            await interaction.editReply('Bro, OPENROUTER_API_KEY is missing! Ask the bot owner to set it.');
            return;
        }

        try {
            const reply = await askChat(client, MODEL, SYSTEM, userPrompt);
            await interaction.editReply({
                content: buildAnswer({
                    question: userPrompt,
                    label: "Bro's Answer",
                    reply,
                    fallback: "Bro, my brain lagged. Trust me, it's not my fault.",
                }),
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error('heybro error:', error);
            await interaction.editReply({
                content: 'Bro, servers are taking a nap right now. Try again later!',
                allowedMentions: { parse: [] },
            });
        }
    },
};
