const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// Function to handle multiple API keys rotation safely
function getNextGeminiClient() {
    const rawKeys = process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(/[\s,]+/).filter(k => k.trim().length > 0);
    
    if (keys.length === 0) return null;

    // Pick a random key or rotate sequentially
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
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const userPrompt = interaction.options.getString('prompt');

        try {
            if (!process.env.GEMINI_API_KEY) {
                await interaction.editReply("Bro, GEMINI_API_KEY environment variable is missing!");
                return;
            }

            const aiClient = getNextGeminiClient();
            if (!aiClient) {
                await interaction.editReply("Bro, no valid Gemini API keys found in config!");
                return;
            }

            const aiResponse = await aiClient.interactions.create({
                model: "gemini-2.5-flash",
                input: `You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real. User question: ${userPrompt}`,
            });

            const replyText = aiResponse?.output_text || "Bro, my brain lagged. Trust me, it's not my fault.";

            // Clean, text-only response keeping the bro style intact
            const responseMessage = `❓ **Question:** ${userPrompt}\n\n💡 **Bro's Answer:** ${replyText}\n\n*Trust me bro, this info is 100% real (I swear).*`;

            await interaction.editReply({ content: responseMessage });
        } catch (error) {
            console.error("Gemini SDK Execution Error:", error);
            await interaction.editReply({ content: `Bro, AI servers are taking a nap right now. Try again later!` });
        }
    },
};
