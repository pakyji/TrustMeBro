const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gen AI with the environment variable API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

            // Use gemini-1.5-flash model with system instruction
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: "You are a sarcastic, funny, and meme-obsessed AI bot named TrustMeBro. Always claim your info is 100% real (even if it's completely fake)."
            });

            const result = await model.generateContent(userPrompt);
            const response = await result.response;
            const aiReply = response.text() || "Bro, my brain lagged. Trust me, it's not my fault.";

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
            console.error("Gemini Error:", error);
            await interaction.editReply(`Bro, AI crashed: \`${error.message}\``);
        }
    },
};
