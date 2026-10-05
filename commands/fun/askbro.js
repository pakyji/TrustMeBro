const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

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

            const aiResponse = await ai.interactions.create({
                model: "gemini-3.8-flash",
                input: `You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. STRICT RULE: Keep your response strictly under 2 sentences. Punchy and short. Always claim your info is 100% real. User question: ${userPrompt}`,
            });

            const replyText = aiResponse?.output_text || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro AI Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 Bro\'s Answer', value: replyText, inline: false }
                )
                .setColor(0x00AAFF)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Gemini SDK Execution Error:", error);
            await interaction.editReply({ content: `Bro, AI servers are taking a nap right now. Try again later!` });
        }
    },
};
