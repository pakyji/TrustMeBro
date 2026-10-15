const { SlashCommandBuilder } = require('discord.js');
const { openAICompatible, askChat, buildAnswer } = require('../../lib/ai');

// xAI (Grok). The model is configurable because xAI retires model names over time.
// grok-beta and grok-3-mini are no longer in the catalogue.
const BASE_URL = 'https://api.x.ai/v1';
const MODEL = process.env.GROK_MODEL || 'grok-4.3';
const SYSTEM = 'You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro powered by Grok. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real.';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grokbro')
        .setDescription('Ask anything to Grok AI! Based-as-hell answers.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the Grok bro?')
                .setRequired(true)
                .setMaxLength(300)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');
        const client = openAICompatible(process.env.GROK_API_KEY, BASE_URL);
        if (!client) {
            await interaction.editReply('Bro, GROK_API_KEY is missing! Ask the bot owner to set it.');
            return;
        }

        try {
            const reply = await askChat(client, MODEL, SYSTEM, userPrompt);
            await interaction.editReply({
                content: buildAnswer({
                    question: userPrompt,
                    label: "Grok Bro's Answer",
                    reply,
                    fallback: "Bro, my brain lagged. Trust me, it's not my fault.",
                }),
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error('grokbro error:', error);
            await interaction.editReply({
                content: 'Bro, Grok servers are taking a nap right now. Try again later!',
                allowedMentions: { parse: [] },
            });
        }
    },
};
