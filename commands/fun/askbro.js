const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API using environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        await interaction.deferReply(); // AI response mein time lag sakta hai isliye defer kiya

        const userPrompt = interaction.options.getString('prompt');

        try {
            // Call Gemini API (using gemini-2.5-flash as default fast model)
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. Always claim your info is 100% real (even if it's completely fake). Answer this user prompt: ${userPrompt}` }]
                    }
                ]
            });

            const aiReply = response.text || "Bro, my brain lagged. Trust me, it's not my fault.";

            const embed = new EmbedBuilder()
                .setTitle('🤖 TrustMeBro AI Chat')
                .addFields(
                    { name: '❓ Question', value: userPrompt, inline: false },
                    { name: '💡 Bro\'s Answer', value: aiReply, inline: false }
                )
                .setColor(0x00AAFF)
                .setFooter({ text: '100% real info (I swear).' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Bro, the AI servers are crying right now. Trust me, try again later.');
        }
    },
};
