const { SlashCommandBuilder } = require('discord.js');
const { openAICompatible, askChat, buildAnswer } = require('../../lib/ai');

// BazaarLink. The model is configurable: free model names change, so check them on the provider site.
const BASE_URL = 'https://api.bazaarlink.ai/v1';
const MODEL = process.env.BAZAAR_MODEL || 'qwen/qwen3.7-flash:free';
const SYSTEM = 'You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real.';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qwenbro')
        .setDescription('Ask anything to Qwen AI via BazaarLink! 100% fake & funny.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the Qwen bro?')
                .setRequired(true)
                .setMaxLength(300)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');
        const client = openAICompatible(process.env.BAZAAR_API_KEY, BASE_URL);
        if (!client) {
            await interaction.editReply('Bro, BAZAAR_API_KEY is missing! Ask the bot owner to set it.');
            return;
        }

        try {
            const reply = await askChat(client, MODEL, SYSTEM, userPrompt);
            await interaction.editReply({
                content: buildAnswer({
                    question: userPrompt,
                    label: "Qwen Bro's Answer",
                    reply,
                    fallback: "Bro, my brain lagged. Trust me, it's not my fault.",
                }),
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error('qwenbro error:', error);
            await interaction.editReply({
                content: 'Bro, Qwen servers are taking a nap right now. Try again later!',
                allowedMentions: { parse: [] },
            });
        }
    },
};
