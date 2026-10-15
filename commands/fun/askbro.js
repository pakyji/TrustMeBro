const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const { buildAnswer } = require('../../lib/ai');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Picks one of the comma- or space-separated keys in GEMINI_API_KEY at random.
function getNextGeminiClient() {
    const keys = (process.env.GEMINI_API_KEY || '').split(/[\s,]+/).filter(k => k.trim().length > 0);
    if (keys.length === 0) return null;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return new GoogleGenAI({ apiKey: randomKey });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askbro')
        .setDescription('Ask anything to TrustMeBro AI! 100% fake & funny answers.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask the bro?')
                .setRequired(true)
                .setMaxLength(300)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');
        const aiClient = getNextGeminiClient();
        if (!aiClient) {
            await interaction.editReply('Bro, GEMINI_API_KEY is missing! Ask the bot owner to set it.');
            return;
        }

        try {
            const aiResponse = await aiClient.interactions.create({
                model: MODEL,
                input: `You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real. User question: ${userPrompt}`,
            });

            await interaction.editReply({
                content: buildAnswer({
                    question: userPrompt,
                    label: "Bro's Answer",
                    reply: aiResponse?.output_text,
                    fallback: "Bro, my brain lagged. Trust me, it's not my fault.",
                }),
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error('Gemini SDK execution error:', error);
            await interaction.editReply({
                content: 'Bro, AI servers are taking a nap right now. Try again later!',
                allowedMentions: { parse: [] },
            });
        }
    },
};
